import { BigNumber, ethers, Signer, utils } from 'ethers';
import { NitroBridgeConfig, Token } from 'config/config';
import { getBalance } from 'util/erc20';
import * as notifStyles from 'misc/notifStyles';
import { toast } from 'react-toastify';
import { FetchSignerResult } from '@wagmi/core';
import { TransferType } from 'util/transferUtils';
import {
  addCustomNetwork,
  Erc20Bridger,
  EthBridger,
  EthDepositStatus,
  L1Network,
  L1ToL2MessageStatus,
  L1TransactionReceipt,
  L2Network,
  L2ToL1MessageReader,
  L2ToL1MessageStatus,
  L2TransactionReceipt,
} from '@constellation-labs/arbitrum-sdk';
import {
  Bridge,
  MessageDeliveredEvent,
} from '@constellation-labs/arbitrum-sdk/dist/lib/abi/Bridge';
import { L1ERC20Gateway__factory } from '@constellation-labs/arbitrum-sdk/dist/lib/abi/factories/L1ERC20Gateway__factory';
import { L1ERC20Gateway } from '@constellation-labs/arbitrum-sdk/dist/lib/abi/L1ERC20Gateway';
import { Bridge__factory } from '@constellation-labs/arbitrum-sdk/dist/lib/abi/factories/Bridge__factory';
import { getTestNetwork } from '../generateNetworkConfig';
import {
  l1Networks,
  l2Networks,
} from '@constellation-labs/arbitrum-sdk/dist/lib/dataEntities/networks';
import { BridgeInterface, MessageInterface } from '../bridgeInterface';
import { Block } from '@ethersproject/abstract-provider';
import { L2ToL1TransactionEvent } from '@constellation-labs/arbitrum-sdk/dist/lib/message/L2ToL1Message';

type Message = {
  transactionHash: string;
  amount: ethers.BigNumber;
  l1Token: string;
};

type RichBridgeMessage = {
  message: Message;
  status: string;
  block: ethers.providers.Block;
};

class NitroMessage implements MessageInterface {
  data: RichBridgeMessage;
  bridge: NitroBridgeWrapper;

  constructor(data: RichBridgeMessage, bridge: NitroBridgeWrapper) {
    this.data = data;
    this.bridge = bridge;
  }

  getAmount(): BigNumber {
    return this.data.message.amount;
  }

  getBlock(): Block {
    return this.data.block;
  }

  getHash(): string {
    return this.data.block.hash;
  }

  getL1Token(): string {
    return this.data.message.l1Token;
  }

  getStatus(): string {
    return this.data.status;
  }

  nextStepName(isDepositMode: boolean): 'finalize' | undefined {
    if (
      this.data.status ===
        withdrawalStatusToString(L2ToL1MessageStatus.CONFIRMED) &&
      !isDepositMode
    ) {
      return 'finalize';
    }
  }

  async takeNextStep(
    signer: Signer,
    token: Token,
    isDepositMode: boolean
  ): Promise<void> {
    if (!this.nextStepName(isDepositMode))
      throw new Error(
        `invalid conditions for takeNextStep, status: ${this.getStatus()}, deposit: ${isDepositMode}`
      );
    await this.bridge.finalizeWithdrawalMessage(signer, this.data, token);
  }
}

export class NitroBridgeWrapper implements BridgeInterface {
  ethBridger: EthBridger;
  erc20Bridger: Erc20Bridger;
  l2Network: L2Network;
  bridgeConfig: NitroBridgeConfig;

  depositCreationFailedStatus(): string {
    return depositStatusToString(L1ToL2MessageStatus.CREATION_FAILED);
  }

  depositDepositedStatus(): string {
    return ethDepositStatusToString(EthDepositStatus.DEPOSITED);
  }

  depositRedeemedStatus(): string {
    return depositStatusToString(L1ToL2MessageStatus.REDEEMED);
  }

  getL1BridgeAddress(token: Token): string {
    return token?.isNative
      ? this.bridgeConfig.inbox
      : this.bridgeConfig.l1ERC20Gateway;
  }

  withdrawConfirmedStatus(): string {
    return '';
  }

  constructor(bridgeConfig: NitroBridgeConfig) {
    const networkConfig = getTestNetwork(bridgeConfig);
    const customL1Network: L1Network = networkConfig.l1Network as L1Network;
    const customL2Network: L2Network = networkConfig.l2Network as L2Network;
    if (!l1Networks[bridgeConfig.l1ChainId]) {
      addCustomNetwork({ customL1Network, customL2Network });
    }
    if (!l2Networks[bridgeConfig.l2ChainId]) {
      addCustomNetwork({ customL2Network });
    }
    this.ethBridger = new EthBridger(customL2Network);
    this.erc20Bridger = new Erc20Bridger(customL2Network);
    this.l2Network = customL2Network;
    this.bridgeConfig = bridgeConfig;
  }

  transferToken = async (
    amount: ethers.BigNumber, // This should be parsed and formatted before using it as an argument
    signer: ethers.Signer, // l1 signer for deposit, l2 signer for withdrawal
    token: Token,
    transferType: TransferType
  ) => {
    const isDeposit = transferType === TransferType.Deposit;
    const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
    const l2Provider = new ethers.providers.JsonRpcProvider(
      getReplicaUrl(token.l2.rpcURL)
    );
    const signerAddress = await signer.getAddress();

    try {
      let response;
      if (isDeposit) {
        if (token.isNative) {
          response = await this.ethBridger.deposit({
            amount,
            l1Signer: signer,
          });
        } else {
          const estimatedGas = (
            await this.erc20Bridger.getDepositRequest({
              amount,
              erc20L1Address: token.l1.address,
              l1Provider: signer.provider as ethers.providers.JsonRpcProvider,
              l2Provider,
              from: signerAddress,
            })
          ).retryableData.gasLimit;

          response = await this.erc20Bridger.deposit({
            amount,
            erc20L1Address: token.l1.address,
            l1Signer: signer,
            l2Provider,
            // The sdk gas estimation is wildly off for bridging ERC20s; this is a hack to allow deposits to go through
            overrides: {
              gasLimit: estimatedGas.add(200000),
            },
          });
        }
      } else {
        response = token.isNative
          ? await this.ethBridger.withdraw({
              amount,
              l2Signer: signer,
              from: signerAddress,
              destinationAddress: signerAddress,
            })
          : await this.erc20Bridger.withdraw({
              amount,
              erc20l1Address: token.l1.address,
              l2Signer: signer,
              destinationAddress: signerAddress,
            });
      }

      toast.info(
        notifStyles.msg.submitted(
          response.hash,
          isDeposit ? token.l1.rpcURL : token.l2.rpcURL
        ),
        notifStyles.standard
      );
      const receipt = await response.wait();
      if (receipt.confirmations > 0) {
        toast.success(notifStyles.msg.confirmed, notifStyles.standard);
      } else {
        throw '';
      }
    } catch (e) {
      console.log(e);
      toast.warn(notifStyles.msg.failed, notifStyles.standard);
    }
  };

  isReadyForFinalization = (message: RichBridgeMessage) => {
    return (
      message.status === withdrawalStatusToString(L2ToL1MessageStatus.CONFIRMED)
    );
  };

  finalizeWithdrawalMessage = async (
    l1Signer: ethers.Signer,
    message: RichBridgeMessage,
    token: Token
  ) => {
    const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
    const l2Provider = new ethers.providers.JsonRpcProvider(token.l2.rpcURL);
    if (!this.isReadyForFinalization(message)) {
      throw 'Message not ready for relay';
    }
    const receipt = await l2Provider.getTransactionReceipt(
      message.message.transactionHash
    );
    const l2Receipt = new L2TransactionReceipt(receipt);
    const messages = await l2Receipt.getL2ToL1Messages(l1Signer);
    const l2ToL1Msg = messages[0];
    const res = await l2ToL1Msg.execute(l2Provider);
    await res.wait();
  };

  getHackyWithdrawalStatus = async (
    message: any,
    timestamp: number,
    l2Provider: ethers.providers.Provider
  ) => {
    let status = 0;
    // Hack. If a batch has not been submitted for a tx and an assertion has not yet completed the challenge
    // period then the message will not have a status yet. We use 1 hour to approximate how long
    // it will take for the batch for a given withdrawal to be submitted
    if (
      timestamp &&
      timestamp > parseInt((Date.now() / 1000 - 3600).toFixed(0))
    ) {
      return status;
    }
    try {
      status = await message.status(l2Provider);
    } catch (error) {
      console.log(error);
    }
    return status;
  };

  getEthWithdrawalsForAddress = async (
    address: string,
    token: Token,
    amount: number,
    offset: number
  ): Promise<NitroMessage[]> => {
    const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
    const l2Provider = new ethers.providers.JsonRpcProvider(
      getReplicaUrl(token.l2.rpcURL)
    );
    const withdrawalEvents = (
      await L2ToL1MessageReader.getL2ToL1Events(
        l2Provider,
        { fromBlock: 0, toBlock: 'latest' },
        undefined,
        address
      )
    )
      .sort((a, b) => b.arbBlockNum.sub(a.arbBlockNum).toNumber())
      .slice(offset, offset + amount);
    const richEthWithdrawalMessages = await Promise.all(
      withdrawalEvents.map(async (event) => {
        const receipt = await l2Provider.getTransactionReceipt(
          event.transactionHash
        );
        const block = await l2Provider.getBlock(receipt.blockNumber);
        const message = L2ToL1MessageReader.fromEvent(l1Provider, event);
        const status = withdrawalStatusToString(
          await this.getHackyWithdrawalStatus(
            message,
            block.timestamp,
            l2Provider
          )
        );
        const amount = event.callvalue || ethers.BigNumber.from(0);
        const richMessage: Message = {
          transactionHash: receipt.transactionHash,
          amount,
          l1Token: token.l1.address,
        };
        return {
          message: richMessage,
          status,
          block,
        };
      })
    );
    return richEthWithdrawalMessages.map((msg) => new NitroMessage(msg, this));
  };

  getERC20WithdrawalsForAddress = async (
    address: string,
    token: Token,
    amount: number,
    offset: number
  ): Promise<NitroMessage[]> => {
    const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
    const l2Provider = new ethers.providers.JsonRpcProvider(
      getReplicaUrl(token.l2.rpcURL)
    );
    const withdrawalEvents = (
      await this.erc20Bridger.getL2WithdrawalEvents(
        l2Provider,
        this.l2Network.tokenBridge.l2ERC20Gateway,
        { fromBlock: 0, toBlock: 'latest' },
        undefined,
        address
      )
    )
      .reverse()
      .slice(offset, offset + amount);
    const richERC20WithdrawalMessages = await Promise.all(
      withdrawalEvents.map(async (event) => {
        const receipt = await l2Provider.getTransactionReceipt(event.txHash);
        const block = await l2Provider.getBlock(receipt.blockNumber);
        const l2Receipt = new L2TransactionReceipt(receipt);
        const message = (await l2Receipt.getL2ToL1Messages(l1Provider))[0];
        const status = withdrawalStatusToString(
          await this.getHackyWithdrawalStatus(
            message,
            block.timestamp,
            l2Provider
          )
        );
        const amount = event._amount || ethers.BigNumber.from(0);
        const richMessage: Message = {
          transactionHash: receipt.transactionHash,
          amount,
          l1Token: event.l1Token,
        };
        return {
          message: richMessage,
          status,
          block,
        };
      })
    );
    return richERC20WithdrawalMessages.map(
      (msg) => new NitroMessage(msg, this)
    );
  };

  getWithdrawalsForAddress = async (
    address: string,
    token: Token,
    amount: number,
    offset: number
  ): Promise<NitroMessage[]> => {
    // Displays all ETH messages first. A little hacky but there's not an efficient way to query for both eth and
    // erc20 deposits at the same time (and to sort the combined list)
    const ethWithdrawals = await this.getEthWithdrawalsForAddress(
      address,
      token,
      amount,
      offset
    );
    let erc20Withdrawals: NitroMessage[] = [];
    if (ethWithdrawals.length < amount) {
      erc20Withdrawals = await this.getERC20WithdrawalsForAddress(
        address,
        token,
        amount - ethWithdrawals.length,
        offset
      );
    }
    const allWithdrawals = ethWithdrawals.concat(erc20Withdrawals);
    return allWithdrawals;
  };

  getEthDepositsForAddress = async (
    address: string,
    token: Token,
    amount: number,
    offset: number
  ): Promise<NitroMessage[]> => {
    const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
    const l2Provider = new ethers.providers.JsonRpcProvider(
      getReplicaUrl(token.l2.rpcURL)
    );
    const bridge: Bridge = Bridge__factory.connect(
      this.ethBridger.l2Network.ethBridge.bridge,
      l1Provider
    );
    // Note: will only return up to 10k events. Make a plan on how to deal with this.
    const allDepositEvents = await bridge.queryFilter(
      bridge.filters.MessageDelivered(
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ),
      0,
      'latest'
    );
    // The mapping should preserve the original order
    const fromAddresses = await Promise.all(
      allDepositEvents.map(async (event) => {
        const tx = await l1Provider.getTransaction(event.transactionHash);
        return tx.from;
      })
    );
    const depositEvents = allDepositEvents.filter((_, index) => {
      return fromAddresses[index] === address;
    });
    const ethDeposits = depositEvents
      .filter((event: MessageDeliveredEvent) => {
        // See for the type number for eth deposits: https://github.com/OffchainLabs/nitro-contracts/blob/main/src/libraries/MessageTypes.sol
        return event.args.kind === 12;
      })
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(offset, offset + amount);
    console.log(ethDeposits);
    const richEthDepositMessages = await Promise.all(
      ethDeposits.map(async (event) => {
        const receipt = await l1Provider.getTransactionReceipt(
          event.transactionHash
        );
        const l1Receipt = new L1TransactionReceipt(receipt);
        const message = (await l1Receipt.getEthDeposits(l2Provider))[0];
        const status = ethDepositStatusToString(await message.status());
        const block = await l1Provider.getBlock(receipt.blockNumber);
        const amount = message.value;
        const richMessage: Message = {
          transactionHash: receipt.transactionHash,
          amount,
          l1Token: token.l1.address,
        };
        return {
          message: richMessage,
          status,
          block,
        };
      })
    );
    return richEthDepositMessages.map((msg) => new NitroMessage(msg, this));
  };

  getERC20DepositsForAddress = async (
    address: string,
    token: Token,
    amount: number,
    offset: number
  ): Promise<NitroMessage[]> => {
    const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
    const l2Provider = new ethers.providers.JsonRpcProvider(
      getReplicaUrl(token.l2.rpcURL)
    );
    const l1ERC20Gateway: L1ERC20Gateway = L1ERC20Gateway__factory.connect(
      this.erc20Bridger.l2Network.tokenBridge.l1ERC20Gateway,
      l1Provider
    );
    const userERC20Deposits = await l1ERC20Gateway.queryFilter(
      l1ERC20Gateway.filters.DepositInitiated(null, address, null, null, null),
      0,
      'latest'
    );
    const erc20Deposits = userERC20Deposits
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(offset, offset + amount);
    const richERC20DepositMessages = await Promise.all(
      erc20Deposits.map(async (event) => {
        const receipt = await l1Provider.getTransactionReceipt(
          event.transactionHash
        );
        const l1Receipt = new L1TransactionReceipt(receipt);
        const message = (await l1Receipt.getL1ToL2Messages(l2Provider))[0];
        const status = depositStatusToString(await message.status());
        const block = await l1Provider.getBlock(receipt.blockNumber);
        const amount = event.args._amount;
        const richMessage: Message = {
          transactionHash: receipt.transactionHash,
          amount,
          l1Token: event.args.l1Token,
        };
        return {
          message: richMessage,
          status,
          block,
        };
      })
    );
    return richERC20DepositMessages.map((msg) => new NitroMessage(msg, this));
  };

  getDepositsForAddress = async (
    address: string,
    token: Token,
    amount: number,
    offset: number
  ): Promise<NitroMessage[]> => {
    // Displays all ETH messages first. A little hacky but there's not an efficient way to query for both eth and
    // erc20 deposits at the same time (and to sort the combined list)
    const ethDeposits = await this.getEthDepositsForAddress(
      address,
      token,
      amount,
      offset
    );
    let erc20Deposits: NitroMessage[] = [];
    if (ethDeposits.length < amount) {
      erc20Deposits = await this.getERC20DepositsForAddress(
        address,
        token,
        amount - ethDeposits.length,
        offset
      );
    }
    const allDeposits = ethDeposits.concat(erc20Deposits);
    return allDeposits;
  };
}

export const getTxUrl = (txHash: string, rpcURL: string) => {
  return `${rpcURL}/tx/${txHash}`;
};

// TODO: Do this in a more stable way, without depending on URL structure
export const getReplicaUrl = (rpcUrl: string) => {
  //  if (rpcUrl.substr(-4) == "http")
  //    return rpcUrl.slice(0, rpcUrl.length - 4) + 'replica-http';
  return rpcUrl;
};

export const calculateGasPrice = (
  gasPriceWei: ethers.BigNumber,
  gas: Number,
  priceInUSD: Number
) => {
  const weiCost = gasPriceWei.mul(ethers.BigNumber.from(gas));
  return ethers.utils.formatEther(
    weiCost.mul(ethers.BigNumber.from(priceInUSD))
  );
};

// checks for valid sig and nonzero amount — returns null on error
export const getTransferAmountAndErrorCheck = (
  signer: FetchSignerResult<ethers.Signer> | undefined,
  amount: string,
  decimals: Number
) => {
  if (!signer?._isSigner) {
    toast.error(notifStyles.msg.sig, notifStyles.standard);
    return null;
  }
  if (!amount) {
    toast.error(notifStyles.msg.nonzero, notifStyles.standard);
    return null;
  }
  const amountToDeposit = utils.parseUnits(
    amount,
    ethers.BigNumber.from(decimals)
  );
  // Handle amount = 0, 0.00, etc.
  if (amountToDeposit._hex === '0x00') {
    toast.error(notifStyles.msg.nonzero, notifStyles.standard);
    return null;
  }
  return amountToDeposit;
};

// returns [l1bal, l2bal]
export const getTokenBalance = async (
  address: string,
  token: Token
): Promise<[ethers.BigNumberish, ethers.BigNumberish]> => {
  const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
  const l2Provider = new ethers.providers.JsonRpcProvider(
    getReplicaUrl(token.l2.rpcURL)
  );

  let l1bal: ethers.BigNumberish, l2bal: ethers.BigNumberish;
  l1bal = parseInt(token.l1.address, 16)
    ? await getBalance(l1Provider, token.l1.address, address)
    : await l1Provider.getBalance(address);
  l2bal = parseInt(token.l2.address, 16)
    ? await getBalance(l2Provider, token.l2.address, address)
    : await l2Provider.getBalance(address);

  return [l1bal, l2bal];
};

export const ethDepositStatusToString = (status: number) => {
  /*
  PENDING = 1,
  DEPOSITED = 2
*/
  const statuses: { [key: number]: string } = {
    1: 'Pending',
    2: 'Deposited',
  };
  if (status in statuses) {
    return statuses[status]!;
  } else {
    return 'Unknown';
  }
};

export const depositStatusToString = (status: number) => {
  /*
    NOT_YET_CREATED = 1
    CREATION_FAILED = 2
    FUNDS_DEPOSITED_ON_L2 = 3
    REDEEMED = 4
    EXPIRED = 5
    */
  const statuses: { [key: number]: string } = {
    1: 'Pending',
    2: 'Failed',
    3: 'Funds Deposited on L2',
    4: 'Deposited',
    5: 'Expired',
  };
  if (status in statuses) {
    return statuses[status]!;
  } else {
    return 'Unknown';
  }
};

export const withdrawalStatusToString = (status: number) => {
  /*
  UNCONFIRMED = 0,
  CONFIRMED = 1,
  EXECUTED = 2
  */
  const statuses: { [key: number]: string } = {
    0: 'Unconfirmed Withdrawal',
    1: 'Confirmed Withdrawal',
    2: 'Executed Withdrawal',
  };
  if (status in statuses) {
    return statuses[status]!;
  } else {
    return 'Unknown';
  }
};

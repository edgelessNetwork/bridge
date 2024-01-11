import { ethers } from 'ethers';
import config, { Token } from 'config/config';
import { getBalance } from 'util/erc20';
import * as notifStyles from 'misc/notifStyles';
import { toast } from 'react-toastify';
import { utils, providers } from 'ethers';
import { FetchSignerResult } from '@wagmi/core';
import { TransferType } from 'util/transferUtils';

import { BridgeConfig } from 'config/config';
import {
  L1Network,
  L2Network,
  addCustomNetwork,
  getL2Network,
  EthBridger,
  L2ToL1MessageReader,
  L2TransactionReceipt,
  L1ToL2MessageReader,
  L1TransactionReceipt,
  constants,
  Erc20Bridger,
  L2ToL1MessageStatus
} from '@arbitrum/sdk';
import { BridgeInterface, Bridge, MessageDeliveredEvent } from '@arbitrum/sdk/dist/lib/abi/Bridge'
import {L1ERC20Gateway__factory} from '@arbitrum/sdk/dist/lib/abi/factories/L1ERC20Gateway__factory'
import {L1ERC20Gateway, DepositInitiatedEvent} from '@arbitrum/sdk/dist/lib/abi/L1ERC20Gateway'
import {Bridge__factory} from '@arbitrum/sdk/dist/lib/abi/factories/Bridge__factory'
import { ArbSys, L2ToL1TransactionEvent, L2ToL1TxEvent } from '@arbitrum/sdk/dist/lib/abi/ArbSys'
import { ArbSys__factory } from '@arbitrum/sdk/dist/lib/abi/factories/ArbSys__factory'
import { getTestNetwork } from './generateNetworkConfig';
import { EthDepositMessage } from '@arbitrum/sdk/dist/lib/message/L1ToL2Message';
import { l2Networks } from '@arbitrum/sdk/dist/lib/dataEntities/networks';
import { ListBucketInventoryConfigurationsOutputFilterSensitiveLog } from '@aws-sdk/client-s3';
import { WithdrawalInitiatedEvent } from '@arbitrum/sdk/dist/lib/abi/L2ArbitrumGateway';
export class BridgeWrapper {
  ethBridger: EthBridger;
  erc20Bridger: Erc20Bridger
  l2Network: L2Network
  bridgeConfig: BridgeConfig

  constructor(bridgeConfig: BridgeConfig) {
    const networkConfig = getTestNetwork(bridgeConfig);
    const customL1Network: L1Network = networkConfig.l1Network as L1Network
    const customL2Network: L2Network = networkConfig.l2Network as L2Network
    if (!l2Networks[bridgeConfig.l2ChainId]){
      addCustomNetwork({customL1Network, customL2Network})

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
    const l1Provider = new ethers.providers.JsonRpcProvider(
      token.l1.rpcURL
    );
    const l2Provider = new ethers.providers.JsonRpcProvider(
      getReplicaUrl(token.l2.rpcURL)
    );
    const signerAddress = await signer.getAddress();

    try {
      let response;
      if (isDeposit) {
        response = token.isNative
          ? await this.ethBridger.deposit({
            amount, l1Signer: signer
          })
          : await this.erc20Bridger.deposit({
            amount,
            erc20L1Address: token.l1.address,
            l1Signer: signer,
            l2Provider,
          });
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
    return message.status === withdrawalStatusToString(L2ToL1MessageStatus.CONFIRMED)
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
    const receipt = await l2Provider.getTransactionReceipt(message.message.transactionHash)
    const l2Receipt = new L2TransactionReceipt(receipt)
    const messages = await l2Receipt.getL2ToL1Messages(l1Signer)
    const l2ToL1Msg = messages[0]
    const res = await l2ToL1Msg.execute(l2Provider)
    await res.wait()
  };

  getWithdrawalsForAddress = async (address: string, token: Token): Promise<RichBridgeMessage[]> => {
    const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
    const l2Provider = new ethers.providers.JsonRpcProvider(
      getReplicaUrl(token.l2.rpcURL)
    );
    if (token.l2.address === ethers.constants.AddressZero) {
      const withdrawalEvents = await L2ToL1MessageReader.getL2ToL1Events(
        l2Provider,
        {fromBlock: 0, toBlock: 'latest'},
        undefined,
        address
      )
      const richEthWithdrawalMessages = await Promise.all(withdrawalEvents.map(async (event)=> {
        const receipt = await l2Provider.getTransactionReceipt(event.transactionHash)
        const message = L2ToL1MessageReader.fromEvent(l1Provider, event)
        const status = withdrawalStatusToString(await message.status(l2Provider))
        const block = await l2Provider.getBlock(receipt.blockNumber)
        const amount = event.callvalue|| ethers.BigNumber.from(0)
        const richMessage: Message = {
          transactionHash: receipt.transactionHash,
          amount,
          l1Token: token.l1.address,
        }
        return {
          message: richMessage,
          status,
          block,
        };
      }))
      return richEthWithdrawalMessages;
    }
    else {
      const withdrawalEvents = await this.erc20Bridger.getL2WithdrawalEvents(
        l2Provider,
        this.l2Network.tokenBridge.l2ERC20Gateway,
        { fromBlock: 0, toBlock: 'latest'},
        token.l1.address,
        address
      )
      const richERC20WithdrawalMessages = await Promise.all(withdrawalEvents.map(async (event)=> {
        const receipt = await l2Provider.getTransactionReceipt(event.txHash)
        // const message = L2ToL1MessageReader.fromEvent(l1Provider, event)
        const l2Receipt = new L2TransactionReceipt(receipt)
        const message = (await l2Receipt.getL2ToL1Messages(l1Provider))[0]
        const status = withdrawalStatusToString(await message.status(l2Provider))
        const block = await l2Provider.getBlock(receipt.blockNumber)
        const amount = event._amount || ethers.BigNumber.from(0)
        const richMessage: Message = {
          transactionHash: receipt.transactionHash,
          amount,
          l1Token: token.l1.address,
        }
        return {
          message: richMessage,
          status,
          block,
        };
      }
      ))
      return richERC20WithdrawalMessages;
    }
  };

  getDepositsForAddress = async (address: string, token: Token) => {
    const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
    const l2Provider = new ethers.providers.JsonRpcProvider(
      getReplicaUrl(token.l2.rpcURL)
    );

    if (token.l2.address === ethers.constants.AddressZero) {
      const bridge: Bridge = Bridge__factory.connect(this.ethBridger.l2Network.ethBridge.bridge, l1Provider)
      // Note: will only return up to 10k events. Make a plan on how to deal with this.
      const allDepositEvents = await bridge.queryFilter(bridge.filters.MessageDelivered(null, null, null, null, null, null, null, null), 0, 'latest')
      // The mapping should preserve the original order
      const fromAddresses = await Promise.all(allDepositEvents.map(async (event) => {
        const tx = await l1Provider.getTransaction(event.transactionHash)
        return tx.from
      }))
      const depositEvents = allDepositEvents.filter((_, index) => {
        return fromAddresses[index] === address
      })
      const ethDeposits = depositEvents.filter((event: MessageDeliveredEvent) => {
        // See for the type number for eth deposits: https://github.com/OffchainLabs/nitro-contracts/blob/main/src/libraries/MessageTypes.sol
        return event.args.kind === 12
      })
      const richEthDepositMessages = await Promise.all(ethDeposits.map(async (event)=> {
        const receipt = await l1Provider.getTransactionReceipt(event.transactionHash)
        const l1Receipt = new L1TransactionReceipt(receipt)
        const message = (await l1Receipt.getEthDeposits(l2Provider))[0]
        const status = ethDepositStatusToString(await message.status())
        const block = await l1Provider.getBlock(receipt.blockNumber)
        const amount = message.value
        const richMessage: Message = {
          transactionHash: receipt.transactionHash,
          amount,
          l1Token: token.l1.address,
        }
        return {
          message: richMessage,
          status,
          block,
        };
      }))
      return richEthDepositMessages;
    }
    else {
      const l1ERC20Gateway: L1ERC20Gateway = L1ERC20Gateway__factory.connect(this.erc20Bridger.l2Network.tokenBridge.l1ERC20Gateway, l1Provider)
      const userERC20Deposits = await l1ERC20Gateway.queryFilter(l1ERC20Gateway.filters.DepositInitiated(null, address, null, null, null), 0, 'latest')
      const erc20Deposits = userERC20Deposits.filter((event) => {
        return event.args.l1Token === token.l1.address
      })
      const richERC20DepositMessages = await Promise.all(erc20Deposits.map(async (event)=> {
        const receipt = await l1Provider.getTransactionReceipt(event.transactionHash)
        const l1Receipt = new L1TransactionReceipt(receipt)
        const message = (await l1Receipt.getL1ToL2Messages(l2Provider))[0]
        const status = depositStatusToString(await message.status())
        const block = await l1Provider.getBlock(receipt.blockNumber)
        const amount = event.args._amount
        
        const richMessage: Message = {
          transactionHash: receipt.transactionHash,
          amount,
          l1Token: token.l1.address,
        }
        return {
          message: richMessage,
          status,
          block,
        };
      }))
      return richERC20DepositMessages;
    }
  }
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
  l1bal = parseInt(token.l1.address, 16) ? await getBalance(l1Provider, token.l1.address, address) : await l1Provider.getBalance(address);
  l2bal = parseInt(token.l2.address, 16) ? await getBalance(l2Provider, token.l2.address, address) : await l2Provider.getBalance(address);
  return [l1bal, l2bal];
};

type MessageLike = L2ToL1MessageReader | (EthDepositMessage | L1ToL2MessageReader)
export type Message = {
  transactionHash: string;
  amount: ethers.BigNumber;
  l1Token: string;
};

export type RichBridgeMessage = {
  message: Message;
  status: string;
  block: ethers.providers.Block;
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
  }
  else {
    return 'Unknown';
  }
}

export const depositStatusToString = (status: number) => {
  /*
    NOT_YET_CREATED = 1
    CREATION_FAILED = 2
    FUNDS_DEPOSITED_ON_L2 = 3
    REDEEMED = 4
    EXPIRED = 5
    */
  const statuses: { [key: number]: string } = {
    1: 'Not Yet Created',
    2: 'Creation Failed',
    3: 'Funds Deposited on L2',
    4: 'Redeemed',
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
}

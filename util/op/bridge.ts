import {BigNumber, ethers, providers, Signer, utils} from 'ethers';
import {
  BridgeAdapterData,
  CrossChainMessenger,
  ETHBridgeAdapter,
  MessageDirection,
  MessageLike,
  MessageStatus,
  StandardBridgeAdapter,
  TokenBridgeMessage,
} from '@constellation-labs/bedrock-sdk';
import {predeploys} from '@constellation-labs/contracts';
import {OpConfig, Token} from 'config/config';
import {getBalance} from 'util/erc20';
import * as notifStyles from 'misc/notifStyles';
import {toast} from 'react-toastify';
import {FetchSignerResult} from '@wagmi/core';
import {TransferType} from 'util/transferUtils';
import {BridgeInterface, MessageInterface} from "../bridgeInterface";
import {Block} from "@ethersproject/abstract-provider";

interface OpRichMessage {
  message: TokenBridgeMessage,
  status: number,
  block: ethers.providers.Block
}

class OpMessage implements MessageInterface {
  data: OpRichMessage;
  bridge: OpBridgeWrapper;


  constructor(data: OpRichMessage, bridge: OpBridgeWrapper) {
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
    return statusToString(this.data.status);
  }

  nextStepName(isDepositMode: boolean): 'prove' | 'finalize' | undefined {
    if (!isDepositMode) {
      if (this.data.status === MessageStatus.READY_TO_PROVE) {
        return 'prove'
      } else if (this.data.status === MessageStatus.READY_FOR_RELAY) {
        return 'finalize'
      }
    }
  }

  async takeNextStep(signer: Signer, token: Token, isDepositMode: boolean) {
    const nextStep = this.nextStepName(isDepositMode);
    if (nextStep === undefined) throw new Error(`invalid conditions for takeNextStep, status: ${this.getStatus()}, deposit: ${isDepositMode}`)
    if (nextStep === 'prove') {
      await this.bridge.proveWithdrawalMessage(signer, this.data.message, token);
    } else if (nextStep === 'finalize') {
      await this.bridge.finalizeWithdrawalMessage(signer, this.data.message, token)
    }
  }

}



export class OpBridgeWrapper implements BridgeInterface {
  bridgeConfig: OpConfig;
  getLogsProvider?: providers.JsonRpcProvider;

  depositCreationFailedStatus(): string {
    return statusToString(MessageStatus.FAILED_L1_TO_L2_MESSAGE);
  }

  depositDepositedStatus(): string {
    return statusToString(MessageStatus.RELAYED);
  }

  depositRedeemedStatus(): string {
    return statusToString(MessageStatus.RELAYED);
  }

  getL1BridgeAddress(token: Token): string {
    return this.bridgeConfig.l1StandardBridge;
  }

  withdrawConfirmedStatus(): string {
    return statusToString(MessageStatus.READY_TO_PROVE);
  }



  constructor(bridgeConfig: OpConfig, getLogsProviderUrl?: string) {
    this.bridgeConfig = bridgeConfig;
    this.getLogsProvider = getLogsProviderUrl
      ? new providers.JsonRpcProvider(getLogsProviderUrl)
      : undefined;
  }

    initializeMessenger = async (
    l1ProviderOrSigner: ethers.providers.Provider | ethers.Signer,
    l2ProviderOrSigner: ethers.providers.Provider | ethers.Signer,
    selectedToken: Token
  ): Promise<CrossChainMessenger> => {
    let bridgeOverrides: BridgeAdapterData;
    bridgeOverrides = {
      Standard: {
        Adapter: StandardBridgeAdapter,
        l1Bridge: this.bridgeConfig.l1StandardBridge,
        l2Bridge: predeploys.L2StandardBridge,
      },
      ETH: {
        Adapter: ETHBridgeAdapter,
        l1Bridge: this.bridgeConfig.l1StandardBridge,
        l2Bridge: predeploys.L2StandardBridge,
      },
    };
    const messenger = new CrossChainMessenger({
      bedrock: !!this.bridgeConfig.optimismPortal,
      l1SignerOrProvider: l1ProviderOrSigner,
      l2SignerOrProvider: l2ProviderOrSigner,
      l1ChainId: selectedToken.l1.chainId,
      l2ChainId: selectedToken.l2.chainId,
      contracts: {
        l1: {
          AddressManager: this.bridgeConfig.addressManager,
          L1CrossDomainMessenger: this.bridgeConfig.l1CrossDomainMessenger,
          L1StandardBridge: this.bridgeConfig.l1StandardBridge,
//        TODO: add support for ERC721 to the bedrock sdk
//        L1ERC721Bridge: this.bridgeConfig.l1ERC721Bridge,

//        bedrock addresses
          OptimismPortal: this.bridgeConfig.optimismPortal || ethers.constants.AddressZero,
          L2OutputOracle: this.bridgeConfig.l2OutputOracle || ethers.constants.AddressZero,

//        pre-bedrock addresses
          StateCommitmentChain: this.bridgeConfig.stateCommitmentChain || ethers.constants.AddressZero,
          CanonicalTransactionChain:
            this.bridgeConfig.canonicalTransactionChain || ethers.constants.AddressZero,
          BondManager: this.bridgeConfig.bondManager || ethers.constants.AddressZero,
        },
      },
      bridges: bridgeOverrides,
      depositConfirmationBlocks: 0, // TODO: make sure this is safe?
//    TODO: add support for getLogsProvider to the bedrock sdk
//    getLogsProvider: this.getLogsProvider,
    });
    return messenger;
  };

  transferToken = async (
    amount: ethers.BigNumber, // This should be parsed and formatted before using it as an argument
    signer: ethers.Signer, // l1 signer for deposit, l2 signer for withdrawal
    token: Token,
    transferType: TransferType
  ) => {
    const isDeposit = transferType === TransferType.Deposit;
    const provider = new ethers.providers.JsonRpcProvider(
      isDeposit ? token.l2.rpcURL : token.l1.rpcURL
    );

    try {
      const messenger = isDeposit
        ? await this.initializeMessenger(signer, provider, token)
        : await this.initializeMessenger(provider, signer, token);
      let response;
      if (isDeposit) {
        response = token.isNative
          ? await messenger.depositETH(amount)
          : await messenger.depositERC20(
              token.l1.address,
              token.l2.address,
              amount
            );
      } else {
        response = token.isNative
          ? await messenger.withdrawETH(amount)
          : await messenger.withdrawERC20(
              token.l1.address,
              token.l2.address,
              amount
            );
      }

      toast.info(
        notifStyles.msg.submitted(
          response.hash,
          isDeposit ? token.l1.rpcURL : token.l2.rpcURL
        ),
        notifStyles.standard
      );

      const receipt = await messenger.waitForMessageReceipt(response);
      if (receipt.transactionReceipt.confirmations > 0) {
        toast.success(notifStyles.msg.confirmed, notifStyles.standard);
      } else {
        throw '';
      }
    } catch (e) {
      console.log(e);
      toast.warn(notifStyles.msg.failed, notifStyles.standard);
    }
  };

  proveWithdrawalMessage = async (
    l1Signer: ethers.Signer,
    tx: MessageLike,
    token: Token
  ) => {
    const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
    const l2Provider = new ethers.providers.JsonRpcProvider(token.l2.rpcURL);
    const readOnlyMessenger = await this.initializeMessenger(
      l1Provider,
      l2Provider,
      token
    );
    const messageStatus = await readOnlyMessenger.getMessageStatus(tx);
    if (messageStatus !== MessageStatus.READY_TO_PROVE) {
      throw 'Message not ready to prove';
    }
    await readOnlyMessenger.proveMessage(tx, {
      signer: l1Signer,
    });
  }

  finalizeWithdrawalMessage = async (
    l1Signer: ethers.Signer,
    tx: MessageLike,
    token: Token
  ) => {
    const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
    const l2Provider = new ethers.providers.JsonRpcProvider(token.l2.rpcURL);
    const readOnlyMessenger = await this.initializeMessenger(
      l1Provider,
      l2Provider,
      token
    );
    const messageStatus = await readOnlyMessenger.getMessageStatus(tx);
    if (messageStatus !== MessageStatus.READY_FOR_RELAY) {
      throw 'Message not ready for relay';
    }
    await readOnlyMessenger.finalizeMessage(tx, {
      signer: l1Signer,
    });
  };

  createRichBridgeMessage = async (message: TokenBridgeMessage, token: Token): Promise<OpRichMessage> => {
    const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
    const l2Provider = new ethers.providers.JsonRpcProvider(
      getReplicaUrl(token.l2.rpcURL)
    );
    const messenger = await this.initializeMessenger(
      l1Provider,
      l2Provider,
      token
    );

    return {
      message,
      status: await getMessageStatusWrapper(message, messenger),
      block:
        message.direction === MessageDirection.L1_TO_L2
          ? await l1Provider.getBlock(message.blockNumber)
          : await l2Provider.getBlock(message.blockNumber),
    };
  };

  getWithdrawalsForAddress = async (address: string, token: Token, amount: number, offset: number) => {
    const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
    const l2Provider = new ethers.providers.JsonRpcProvider(
      getReplicaUrl(token.l2.rpcURL)
    );
    const messenger = await this.initializeMessenger(
      l1Provider,
      l2Provider,
      token
    );
    const messages = await messenger.getWithdrawalsByAddress(address);
    const out = messages.slice(offset, offset + amount).map((message) =>
      this.createRichBridgeMessage(message, token)
    );
    return (await Promise.all(out)).map((msg) => new OpMessage(msg, this))
  };

  getDepositsForAddress = async (address: string, token: Token, amount: number, offset: number) => {
    const l1Provider = new ethers.providers.JsonRpcProvider(token.l1.rpcURL);
    const l2Provider = new ethers.providers.JsonRpcProvider(
      getReplicaUrl(token.l2.rpcURL)
    );
    const messenger = await this.initializeMessenger(
      l1Provider,
      l2Provider,
      token
    );
    const messages = await messenger.getDepositsByAddress(address);
    const out = messages.slice(offset, offset + amount).map((message) =>
      this.createRichBridgeMessage(message, token)
    );

    return (await Promise.all(out)).map((msg) => new OpMessage(msg, this))
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
  l1bal = parseInt(token.l1.address, 16) ? await getBalance(l1Provider, token.l1.address, address) : await l1Provider.getBalance(address);
  l2bal = parseInt(token.l2.address, 16) ? await getBalance(l2Provider, token.l2.address, address) : await l2Provider.getBalance(address);
  return [l1bal, l2bal];
};

// Graceful error handler for getting message status
// Because ETH logs might fail for old messages
const getMessageStatusWrapper = async (
  message: TokenBridgeMessage,
  messenger: CrossChainMessenger
) => {
  try {
    return await messenger.getMessageStatus(message);
  } catch (error) {
    console.log(error);
    return -1;
  }
};

const statusToString = (status: number) => {
  /*
    UNCONFIRMED_L1_TO_L2_MESSAGE = 0,
    FAILED_L1_TO_L2_MESSAGE = 1,
    STATE_ROOT_NOT_PUBLISHED = 2,
    READY_TO_PROVE = 3,
    IN_CHALLENGE_PERIOD = 4,
    READY_FOR_RELAY = 5,
    RELAYED = 6
    */
  const statuses: { [key: number]: string } = {
    0: 'Unconfirmed Deposit',
    1: 'Failed Deposit',
    2: 'Awaiting state root',
    3: 'Ready to prove',
    4: 'In challenge period',
    5: 'Ready for relay',
    6: 'Finalized',
  };
  if (status in statuses) {
    return statuses[status]!;
  } else {
    return 'Unknown';
  }
};

const stringToStatus = (statusString: string) => {
  const validStringStatuses: Record<string, number> = {
    'Unconfirmed Deposit': 0,
    'Failed Deposit': 1,
    'Awaiting state root': 2,
    'Ready to prove': 3,
    'In challenge period': 4,
    'Ready for relay': 5,
    'Finalized': 6,
  };
  if (statusString in validStringStatuses) {
    return validStringStatuses[statusString]
  } else throw new Error(`invalid status string: ${statusString}`)
}

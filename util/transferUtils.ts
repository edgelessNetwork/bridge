import { Token, TokenInfo } from 'config/config';
import { Dispatch, SetStateAction, useState, Fragment } from 'react';
import { ConnectArgs } from '@wagmi/core/dist/declarations/src/actions/accounts/connect';

import { getTransferAmountAndErrorCheck, BridgeWrapper, RichBridgeMessage, depositStatusToString, withdrawalStatusToString, ethDepositStatusToString } from 'util/bridge';
import { toast } from 'react-toastify';
import * as notifStyles from 'misc/notifStyles';
import config from 'config/config';
import { approve } from 'util/erc20';
import { getDecimals } from "util/tokenUtils"
import { ethers } from 'ethers';
import { EthDepositStatus, L1ToL2MessageStatus, L2ToL1MessageStatus } from '@arbitrum/sdk';

enum WalletState {
  Disonnected,
  IncorrectNetwork,
  Connected,
}

enum TransferType {
  Deposit,
  Withdraw,
}

// Gets the current from/source token balance based on transferType
function parseFromToken(token: Token, transferType: TransferType) {
  return transferType === TransferType.Deposit ? token.l1 : token.l2;
}

const buttonMessage = (
  walletState: WalletState,
  amount: string,
  balance: string,
  selectedTokenIsApproved: boolean,
  transferType: TransferType
) => {
  if (walletState === WalletState.Disonnected) {
    return 'Connect Wallet';
  } else if (walletState === WalletState.IncorrectNetwork) {
    return 'Switch Network';
  } else {
    // WalletState === Connected
    if (amount && balance === '') {
      return 'Fetching Balance...';
    }
    if (Number(amount) > Number(balance)) {
      return 'Insufficient Balance';
    }
    if (selectedTokenIsApproved) {
      return transferType === TransferType.Deposit ? 'Deposit' : 'Withdraw';
    } else {
      return 'Approve';
    }
  }
};

const transferNative = async (
  signer: any,
  amount: string,
  decimals: number,
  transferType: TransferType,
  selectedToken: Token,
  bridgeWrapper: BridgeWrapper,
  setDepositLoadingOpen: any,
  setDepositSuccessfulOpen: any,
  setDepositFailedOpen: any,
  setWithdrawLoadingOpen: any,
  setWithdrawSuccessfulOpen: any
) => {
  // TODO: check balance and surface errors
  const transferAmount = getTransferAmountAndErrorCheck(
    signer,
    amount,
    decimals
  );
  if (!transferAmount) {
    return;
  }

  bridgeWrapper.transferToken(
    transferAmount,
    signer,
    selectedToken,
    transferType
  );
  if (transferType === TransferType.Deposit) {
    setDepositLoadingOpen(true);
    let intervalId = setInterval(async function () {
      const address = await signer.getAddress();
      const deposits = await bridgeWrapper.getDepositsForAddress(
        address,
        selectedToken
      );
      if (deposits[0].status ===  ethDepositStatusToString(EthDepositStatus.DEPOSITED)) {
        setDepositLoadingOpen(false);
        setDepositSuccessfulOpen(true);
        clearInterval(intervalId);
      }
    }, 10000);  
  } else if (transferType === TransferType.Withdraw) {
    setWithdrawLoadingOpen(true);
    let intervalId = setInterval(async function () {
      const address = await signer.getAddress();
      const withdrawals = await bridgeWrapper.getWithdrawalsForAddress(
        address,
        selectedToken
      );
      if (withdrawals[0].status === withdrawalStatusToString(L2ToL1MessageStatus.CONFIRMED)) {
        setWithdrawLoadingOpen(false);
        setWithdrawSuccessfulOpen(true);
        clearInterval(intervalId);
      }
    }, 10000);
  }
};

const transferERC = async (
  signer: any,
  amount: string,
  selectedToken: Token,
  transferType: TransferType,
  bridgeWrapper: BridgeWrapper,
  setDepositLoadingOpen: any,
  setDepositSuccessfulOpen: any,
  setDepositFailedOpen: any,
  setWithdrawLoadingOpen: any,
  setWithdrawSuccessfulOpen: any
) => {
  const fromToken = parseFromToken(selectedToken, transferType);
  // TODO: check balance and surface errors
  const transferAmount = getTransferAmountAndErrorCheck(
    signer,
    amount,
    getDecimals(selectedToken, transferType === TransferType.Deposit)
  );
  if (!transferAmount) {
    return;
  }

  if (!fromToken.address) {
    toast.error(notifStyles.msg.no_l1_addr, notifStyles.standard);
    return;
  }
  if (!fromToken.address) {
    toast.error(notifStyles.msg.no_l2_addr, notifStyles.standard);
    return;
  }

  bridgeWrapper.transferToken(
    transferAmount,
    signer,
    selectedToken,
    transferType
  );

  if (transferType === TransferType.Deposit) {
    setDepositLoadingOpen(true);
    let intervalId = setInterval(async function () {
      const address = await signer.getAddress();
      const deposits = await bridgeWrapper.getDepositsForAddress(
        address,
        selectedToken
      );
      if (deposits[0].status === depositStatusToString(L1ToL2MessageStatus.REDEEMED) ) {
        setDepositLoadingOpen(false);
        setDepositSuccessfulOpen(true);
        clearInterval(intervalId);
      } else if (deposits[0].status === depositStatusToString(L1ToL2MessageStatus.CREATION_FAILED)) {
        setDepositLoadingOpen(false);
        setDepositFailedOpen(true);
        clearInterval(intervalId);
      }
    }, 10000);  
  } else if (transferType === TransferType.Withdraw) {
    setWithdrawLoadingOpen(true);
    let intervalId = setInterval(async function () {
      const address = await signer.getAddress();
      const withdrawals = await bridgeWrapper.getWithdrawalsForAddress(
        address,
        selectedToken
      );
      if (withdrawals[0].status === withdrawalStatusToString(L2ToL1MessageStatus.CONFIRMED)) {
        setWithdrawLoadingOpen(false);
        setWithdrawSuccessfulOpen(true);
        clearInterval(intervalId);
      }
    }, 10000);
  }

};

const transferButton = async (
  walletState: WalletState,
  connect: (args?: Partial<ConnectArgs> | undefined) => void,
  switchNetwork: ((chainId_?: number | undefined) => void) | undefined,
  selectedToken: Token,
  selectedTokenIsApproved: boolean,
  setSelectedTokenIsApproved: any,
  signer: any,
  amount: string,
  transferType: TransferType,
  bridgeWrapper: BridgeWrapper,
  setDepositLoadingOpen: any,
  setDepositSuccessfulOpen: any,
  setDepositFailedOpen: any,
  setWithdrawLoadingOpen: any,
  setWithdrawSuccessfulOpen: any

) => {
  const fromToken = parseFromToken(selectedToken, transferType);
  if (walletState === WalletState.Disonnected) {
    connect({ chainId: fromToken.chainId });
  } else if (walletState === WalletState.IncorrectNetwork) {
    switchNetwork?.(fromToken.chainId);
  } else {
    // WalletState === Connected
    if (selectedTokenIsApproved) {
      if (selectedToken.isNative) {
        transferNative(
          signer,
          amount,
          getDecimals(selectedToken, transferType === TransferType.Deposit),
          transferType,
          selectedToken,
          bridgeWrapper,
          setDepositLoadingOpen,
          setDepositSuccessfulOpen,
          setDepositFailedOpen,
          setWithdrawLoadingOpen,
          setWithdrawSuccessfulOpen
        );
      } else {
        transferERC(signer, amount, selectedToken, transferType, bridgeWrapper, setDepositLoadingOpen, setDepositSuccessfulOpen, setDepositFailedOpen, setWithdrawLoadingOpen, setWithdrawSuccessfulOpen);
      }
    } else {
      try {
        await approveBridgeTransfer(
          signer,
          parseFromToken(selectedToken, transferType),
          bridgeWrapper.bridgeConfig.l1ERC20Gateway
        );
        setSelectedTokenIsApproved(true);
      } catch (error) {
        
      }
    }
  }
};

const approveBridgeTransfer = async (
  signer: any,
  fromToken: TokenInfo,
  l1GatewayAddress: string
) => {
  if (!signer) {
    toast.error(notifStyles.msg.sig, notifStyles.standard); // TODO: cleaner
  }
  await approve(signer!, fromToken.address, l1GatewayAddress);
};

async function addChainToMetamask(chain: any, decimals: Number, tokenName: String) {
  // @ts-ignore
  let ethereum: any = window.ethereum!;
  let chainIdHex = ethers.utils.hexValue(BigInt((chain.chainId).toString()))
  try {
    await ethereum!.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError: any) {
    console.log(switchError)
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainIdHex,
              chainName: chain.name,
              rpcUrls: [chain.rpcURL],
              nativeCurrency: {
                name: tokenName,
                symbol: tokenName, // 2-6 characters long
                decimals: decimals,
              },
            },
          ],
        });
      } catch (addError) {
        toast.error("Could not add rollup to wallet. Please contact us for help.");
      }
    }
  }
};

export {
  WalletState,
  TransferType,
  buttonMessage,
  transferButton,
  parseFromToken,
  addChainToMetamask,
};

import { Token, TokenInfo } from 'config/config';
import { ConnectArgs } from '@wagmi/core/dist/declarations/src/actions/accounts/connect';

import { getTransferAmountAndErrorCheck } from 'util/op/bridge';
import { toast } from 'react-toastify';
import * as notifStyles from 'misc/notifStyles';
import { approve } from 'util/erc20';
import { getDecimals } from "util/tokenUtils"
import { ethers } from 'ethers';
import {BridgeInterface} from "./bridgeInterface";

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
  bridgeWrapper: BridgeInterface,
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
};

const transferERC = async (
  signer: any,
  amount: string,
  selectedToken: Token,
  transferType: TransferType,
  bridgeWrapper: BridgeInterface,
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
  bridgeWrapper: BridgeInterface,

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
        );
      } else {
        transferERC(signer, amount, selectedToken, transferType, bridgeWrapper);
      }
    } else {
      try {
        const transferAmount = getTransferAmountAndErrorCheck(signer, amount, getDecimals(selectedToken, transferType === TransferType.Deposit));
        if (!transferAmount) {
          throw new Error('Invalid transfer amount');
        }
        await approveBridgeTransfer(
          signer,
          parseFromToken(selectedToken, transferType),
          bridgeWrapper.getL1BridgeAddress(selectedToken),
          transferAmount,
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
  l1StandardBridge: string,
  amount: ethers.BigNumber,
) => {
  if (!signer) {
    toast.error(notifStyles.msg.sig, notifStyles.standard); // TODO: cleaner
  }
  await approve(signer!, fromToken.address, l1StandardBridge, amount);
};

async function addChainToMetamask(chain: any, decimals: Number, tokenName: String, tokenSymbol: String) {
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
                symbol: tokenSymbol, // 2-6 characters long
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

import {ethers} from "ethers";
import {Token} from "../config/config";
import {TransferType} from "./transferUtils";

export interface MessageInterface {
  getStatus(): string;
  getHash(): string;
  getL1Token(): string;
  getAmount(): ethers.BigNumber;
  getBlock(): ethers.providers.Block;

  nextStepName(isDepositMode: boolean): string | undefined;
  takeNextStep(signer: ethers.Signer, token: Token, isDepositMode: boolean): Promise<void>
}

export interface BridgeInterface {
  transferToken (
    amount: ethers.BigNumber, // This should be parsed and formatted before using it as an argument
    signer: ethers.Signer, // l1 signer for deposit, l2 signer for withdrawal
    token: Token,
    transferType: TransferType
  ): Promise<void>;

  getWithdrawalsForAddress (address: string, token: Token, amount: number, offset: number): Promise<MessageInterface[]>;

  getDepositsForAddress (address: string, token: Token, amount: number, offset: number): Promise<MessageInterface[]>;

  getL1BridgeAddress(token: Token): string;
  withdrawConfirmedStatus(): string;
  depositCreationFailedStatus(): string;
  depositRedeemedStatus(): string;
  depositDepositedStatus(): string;
}

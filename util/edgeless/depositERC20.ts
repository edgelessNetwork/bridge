import { TransferType } from '../types';
import ERC20InboxJSON from './ERC20Inbox.json';
import { Token, TokenInfo } from 'config/config';
import { BigNumber, Contract, Signer, ethers } from 'ethers';

const erc20Inbox = ERC20InboxJSON.address;
const contract = new Contract(erc20Inbox, ERC20InboxJSON.abi);

export async function depositErc20(
  amount: BigNumber, // This should be parsed and formatted before using it as an argument
  signer: Signer, // l1 signer for deposit, l2 signer for withdrawal
  transferType: TransferType
): Promise<ethers.ContractTransaction> {
  const isDeposit = transferType === TransferType.Deposit;
  return await contract.connect(signer).depositERC20(amount);
}

import { approve } from 'util/erc20';
import { TransferType } from '../types';
import { abi, address } from './EdgelessDeposit.json';
import {
  abi as ERC20InboxABI,
  address as ERC20InboxAddress,
} from './ERC20Inbox.json';

import { abi as EwEthABI, address as EwEthAddress } from './EwEth.json';

import { Token } from 'config/config';
import { BigNumber, Contract, Signer, ethers } from 'ethers';
import { depositErc20 } from './depositERC20';

const EdgelessDeposit = new Contract(address, abi);
const ERC20Inbox = new Contract(ERC20InboxAddress, ERC20InboxABI);
const EwETH = new Contract(EwEthAddress, EwEthABI);

export async function depositEth(
  amount: BigNumber, // This should be parsed and formatted before using it as an argument
  signer: Signer, // l1 signer for deposit, l2 signer for withdrawal
  token: Token,
  transferType: TransferType
): Promise<ethers.ContractTransaction> {
  const isDeposit = transferType === TransferType.Deposit;
  const provider = new ethers.providers.JsonRpcProvider(
    isDeposit ? token.l2.rpcURL : token.l1.rpcURL
  );
  const userAddress = await signer.getAddress();
  await EdgelessDeposit.connect(signer).depositEth(userAddress, {
    value: amount,
  });
  await approve(signer, EwETH.address, ERC20Inbox.address, amount);
  return await depositErc20(amount, signer, transferType);
}

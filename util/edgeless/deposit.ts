import { TransferType } from '../types';
import { abi, address } from './EdgelessDeposit.json';
import { Token, TokenInfo } from 'config/config';
import { BigNumber, Contract, Signer, ethers } from 'ethers';

const edgelessDepositAddress = address;
const contract = new Contract(edgelessDepositAddress, abi);

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

  return await contract
    .connect(signer)
    .depositEth(userAddress, { value: amount });
}

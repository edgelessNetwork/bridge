import { ethers } from 'ethers';
import ERC20abi from 'misc/erc20abi.json';

export const getApprovalAmount = async (
  provider: ethers.providers.Provider,
  erc20Address: string,
  owner: string,
  spender: string
) => {
  const ERC20 = new ethers.Contract(erc20Address, ERC20abi, provider);
  return ERC20.allowance(owner, spender);
};

export const getBalance = async (
  provider: ethers.providers.Provider,
  erc20Address: string,
  address: string
) => {
  const ERC20 = new ethers.Contract(erc20Address, ERC20abi, provider);
  return ERC20.balanceOf(address);
};

export const approve = async (
  signer: ethers.Signer,
  erc20Address: string,
  spender: string,
  amount: ethers.BigNumber = ethers.constants.MaxUint256
) => {
  const ERC20 = new ethers.Contract(erc20Address, ERC20abi, signer);
  return ERC20.approve(spender, amount);
};

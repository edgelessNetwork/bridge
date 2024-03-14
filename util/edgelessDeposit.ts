import { ethers } from 'ethers';
import edgelessDepositAbi from 'misc/edgelessDepositAbi.json';

const EDGELESS_DEPOSIT_ADDRESS = '0xC2342d7A4852006a9FD0f85Cf4D0F79faaa20A2f';

export const depositEthTransaction = async (
  provider: ethers.providers.Provider,
  to: string,
  amount: ethers.BigNumber
) => {
  const EdgelessDeposit = new ethers.Contract(
    EDGELESS_DEPOSIT_ADDRESS,
    edgelessDepositAbi,
    provider
  );
  return await EdgelessDeposit.depositEth(to, { value: amount });
};

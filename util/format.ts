import { ethers } from 'ethers';

export const cleanNumString = (s: string) => {
  let out = '';
  let decimalSeen = false;
  s.split('').forEach((c: string) => {
    if (c === '.' && !decimalSeen) {
      out += c;
      decimalSeen = true;
      return;
    }
    if ('0123456789'.includes(c)) {
      out += c;
    }
  });
  return out;
};

export const numStringToBigNumber = (
  ns: string,
  units: ethers.BigNumberish
) => {
  if (!ns) {
    return ethers.BigNumber.from(0);
  }
  return ethers.utils.parseUnits(ns, units);
};

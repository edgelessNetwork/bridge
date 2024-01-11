import { Token } from 'config/config';

// Gets the decimals for a token, accounting for any L1/L2-specific overrides
export const getDecimals = (token: Token, isL1: boolean) => {
    if (token) {
      const possibleTokenOverride = isL1 ? token.l1.decimals : token.l2.decimals;
      return possibleTokenOverride ?? token.decimals;
    } else {
      return 18;
    }
};

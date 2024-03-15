export const GAS_PER_NATIVE_DEPOSIT = 142589;

export interface TokenInfo {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  logoURI: string;
  rpcURL: string;
  decimals?: number; // overrides the decimals set in Token for a specific L1/L2 pair
}

export interface Token {
  tokenName: string;
  l1: TokenInfo;
  l2: TokenInfo;
  decimals: number;
  isNative: boolean;
}

export interface OpConfig {
  optimismPortal?: string,
  l2OutputOracle?: string,
  addressManager: string;
  l1CrossDomainMessenger: string;
  l1StandardBridge: string;
  l1ERC721Bridge?: string;
  stateCommitmentChain?: string;
  canonicalTransactionChain?: string;
  bondManager?: string;
  l1RPCUrl?: string;
  l2RPCUrl?: string;
  type: 'op'
}

export interface NitroBridgeConfig {
  l1ChainId: number;
  l2ChainId: number;
  l1RPCUrl: string;
  l2RPCUrl: string;
  nativeToken?: string;
  bridge: string;
  inbox: string;
  outbox: string;
  rollup: string;
  sequencerInbox: string;
  l1CustomGateway: string;
  l1ERC20Gateway: string;
  l1GatewayRouter: string;
  l1MultiCall: string;
  l1ProxyAdmin: string;
  l1Weth: string;
  l1WethGateway: string;
  l2CustomGateway: string;
  l2ERC20Gateway: string;
  l2GatewayRouter: string;
  l2Multicall: string;
  l2ProxyAdmin: string;
  l2Weth: string;
  l2WethGateway: string;
  type: 'nitro'
}

export type BridgeConfig = OpConfig | NitroBridgeConfig;

interface configFile {
  tokens: Token[];
  bridgeConfig: BridgeConfig;
}
// updated in [site].tsx
var config = {
  tokens: [],
  bridgeConfig: {
    optimismPortal: '',
    l2OutputOracle: '',
    addressManager: '',
    l1CrossDomainMessenger: '',
    l1StandardBridge: '',
    l1ERC721Bridge: '',
    stateCommitmentChain: '',
    canonicalTransactionChain: '',
    bondManager: '',
    l1RPCUrl: '',
    l2RPCUrl: '',
    type: 'op',
},
} as configFile;
export default config;

// set in globals.css, and in tailwind.config.js, and used by clientConfigProps
export const customColorNames = [
  'colorOne',
  'colorTwo',
  'colorThree',
  'colorFour',
  'colorFive',
  'colorSix',
  'colorSeven',
  'colorEight',
];

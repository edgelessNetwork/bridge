import { UseBlockNumberConfig } from "wagmi/dist/declarations/src/hooks/network-status/useBlockNumber";

export const GAS_PER_NATIVE_DEPOSIT = 142589;

export interface TokenInfo {
  // TODO: remove this field
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  logoURI: string;
  // TODO: remove this field
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

export interface BridgeConfig {
  l1ChainId: number;
  l2ChainId: number;
  l1RPCUrl: string;
  l2RPCUrl: string;
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
}

interface configFile {
  tokens: Token[];
  bridgeConfig: BridgeConfig;
}
// updated in [site].tsx
var config = {
  tokens: [],
  bridgeConfig: {
    l1ChainId: 0,
    l2ChainId: 0,
    l1RPCUrl: '',
    l2RPCUrl: '',
    bridge: '',
    inbox: '',
    outbox: '',
    rollup: '',
    sequencerInbox: '',
    l1CustomGateway: '',
    l1ERC20Gateway: '',
    l1GatewayRouter: '',
    l1MultiCall: '',
    l1ProxyAdmin: '',
    l1Weth: '',
    l1WethGateway: '',
    l2CustomGateway: '',
    l2ERC20Gateway: '',
    l2GatewayRouter: '',
    l2Multicall: '',
    l2ProxyAdmin: '',
    l2Weth: '',
    l2WethGateway: '',
  }
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

import Home from 'pages';
import React from 'react';
import config from 'config/config';

export interface clientConfigProps {
  id: string;
  faviconUrl: string | null;
  logo: string;
  wordmark: string;
  config: any; // Prisma.JsonValue;
  colorOne: string;
  colorTwo: string;
  colorThree: string;
  colorFour: string;
  colorFive: string;
  colorSix: string;
  colorSeven: string;
  colorEight: string;
  type: string; // 'nitro' | 'op';
}

const arbitrumNitroConfig: string = JSON.stringify({
  tokens: [
    {
      tokenName: 'Edgeless Wrapped Eth',
      l1: {
        chainId: 11155111,
        address: '0x0000000000000000000000000000000000000000',
        name: 'Sepolia',
        symbol: 'Eth',
        decimals: 18,
        logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      },
      l2: {
        chainId: 202,
        address: '0x0000000000000000000000000000000000000000',
        name: 'edgeless-testnet',
        symbol: 'Eth',
        logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      },
      decimals: 18,
      isNative: true,
    },
    {
      tokenName: 'Edgeless Wrapped Eth',
      l1: {
        chainId: 11155111,
        address: '0x2f1db8689e9E3870CD8928e58bf2bC7C02fF44fb',
        name: 'Sepolia',
        symbol: 'ewEth',
        decimals: 18,
        logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      },
      l2: {
        chainId: 202,
        address: '0x0000000000000000000000000000000000000000',
        name: 'edgeless-testnet',
        symbol: 'Eth',
        logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      },
      decimals: 18,
      isNative: false,
    },
  ],
  bridgeConfig: {
    bridge: '0xA0E7C119f6367B3209536dbc6b0A012B39df9aCF',
    inbox: '0x7076291CF598cc12aa162c36c47dbC5C971EAF95',
    outbox: '0x9089E5A5dC28786BE8Ad2A27da02CeE14aD78227',
    rollup: '0x46d1f2e4e2c13cED3Bdbe7571856EdeCE7b7c324',
    sequencerInbox: '0x7eB0e67A4357c71DA2A51D835916F9D719fC3a18',
    l1CustomGateway: '0xdE55eBBA2AA1648E94833D5f88CeD57AaF278E83',
    l1ERC20Gateway: '0x6B04eD59F69437fA2D4f0035c96A401f3bae89Fa',
    l1GatewayRouter: '0x3E42A60209f81861632eFfE79A020dE134ddC939',
    l1MultiCall: '0xb80931C59150f5bbeAa1D8989Da783637b4bA005',
    l1ProxyAdmin: '0x13194E41d97DC593D80fc92aabB14ada138da4E4',
    l1Weth: '0x0000000000000000000000000000000000000000',
    l1WethGateway: '0x0000000000000000000000000000000000000000',
    l2CustomGateway: '0xE13Cb7EeF91931bCFEa8672201274A5866F7a9e4',
    l2ERC20Gateway: '0x791E3d73a79ddbFA9BD1b4D1BF1CD7605da06C42',
    l2GatewayRouter: '0x901E3fcA1f3AD914ec3184f5b543a93f7F36d25b',
    l2Multicall: '0xDc0C98dA6CeC39d516549Cb61509cABfb9Fc79e0',
    l2ProxyAdmin: '0xcE48BF3E04C598e8C5FFDed70131b9E1aA41F9D6',
    l2Weth: '0x0000000000000000000000000000000000000000',
    l2WethGateway: '0x0000000000000000000000000000000000000000',
    l1ChainId: 11155111,
    l2ChainId: 202,
    l1RPCUrl:
      'https://eth-sepolia.g.alchemy.com/v2/BQ43RWiHw-hqyM4NVLrzcYSm-ybT5tYN',
    l2RPCUrl: 'https://edgeless-testnet.rpc.caldera.xyz/http',
    nativeToken: '0x2f1db8689e9E3870CD8928e58bf2bC7C02fF44fb',
  },
});

const optimismConfig: string = JSON.stringify({
  tokens: [
    {
      tokenName: 'Ether',
      l1: {
        chainId: 11155111,
        address: '0x0000000000000000000000000000000000000000',
        name: 'sepolia',
        symbol: 'ETH',
        decimals: 18,
        logoURI: 'https://dashboard.caldera.xyz/svgs/tokens/ETH.svg',
      },
      l2: {
        chainId: 202,
        address: '0x0000000000000000000000000000000000000000',
        name: 'edgeless-testnet',
        symbol: 'ETH',
        logoURI: 'https://dashboard.caldera.xyz/svgs/tokens/ETH.svg',
      },
      decimals: 18,
      isNative: true,
    },
    {
      tokenName: 'Edgeless Wrapped Eth',
      l1: {
        chainId: 11155111,
        address: '0x15353d8e704d218280e7a3f5563df4e4149f040b',
        name: 'sepolia',
        symbol: 'ewEth',
        decimals: 18,
        logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      },
      l2: {
        chainId: 202,
        address: '0x0000000000000000000000000000000000000000',
        name: 'edgeless-testnet',
        symbol: 'ewEth',
        logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      },
      decimals: 18,
      isNative: false,
    },
  ],
  bridgeConfig: {
    addressManager: '0x2a583c340Ff65f0c7634761ea596Ec73339DFA99',
    l1CrossDomainMessenger: '0x6088bf5Fd588B89358CdF794c4316cBD8a6D79F7',
    l1StandardBridge: '0xfF591f2f96697F4D852C775B74830282d97D2c37',
    optimismPortal: '0x90690CDEC37DC6C3a6B54514d39122680B238dD5',
    l2OutputOracle: '0xE26E51C2D3a6e9a29a892E52B7694469d038bCF1',
    l1RPCUrl:
      'https://eth-sepolia.g.alchemy.com/v2/BQ43RWiHw-hqyM4NVLrzcYSm-ybT5tYN',
    l2RPCUrl: 'https://edgeless-testnet.rpc.caldera.xyz/http',
  },
});

export const getServerSideProps = async (context: {
  params: { site: string };
}) => {
  const nitroConfig = {
    id: 'edgeless-nitro',
    logo: { $binary: { base64: '', subType: '00' } },
    wordmark: { $binary: { base64: '', subType: '00' } },
    config: arbitrumNitroConfig,
    colorOne: 'rgb(255, 255, 255)',
    colorTwo: 'rgb(249, 250, 251)',
    colorThree: 'rgb(229, 231, 235)',
    colorFour: 'rgb(209, 213, 219)',
    colorFive: 'rgb(17, 24, 39)',
    colorSix: 'rgb(156, 163, 175)',
    colorSeven: 'rgb(0, 0, 0)',
    colorEight: 'rgba(255, 255, 255, 0.5)',
    type: 'nitro',
  };

  const opConfig = {
    id: 'edgeless-op',
    logo: { $binary: { base64: '', subType: '00' } },
    wordmark: { $binary: { base64: '', subType: '00' } },
    config: optimismConfig,
    colorOne: 'rgb(255, 255, 255)',
    colorTwo: 'rgb(249, 250, 251)',
    colorThree: 'rgb(229, 231, 235)',
    colorFour: 'rgb(209, 213, 219)',
    colorFive: 'rgb(17, 24, 39)',
    colorSix: 'rgb(156, 163, 175)',
    colorSeven: 'rgb(0, 0, 0)',
    colorEight: 'rgba(255, 255, 255, 0.5)',
    type: 'op',
  };

  // show 404 if the user is accessing an invalid subdomain
  if (!nitroConfig) {
    return {
      notFound: true,
    };
  }

  const configProps: clientConfigProps = {
    id: nitroConfig.id,
    faviconUrl: '',
    logo: nitroConfig.logo.toString(),
    config: nitroConfig.config,
    wordmark: nitroConfig.wordmark.toString(),
    colorOne: nitroConfig.colorOne,
    colorTwo: nitroConfig.colorTwo,
    colorThree: nitroConfig.colorThree,
    colorFour: nitroConfig.colorFour,
    colorFive: nitroConfig.colorFive,
    colorSix: nitroConfig.colorSix,
    colorSeven: nitroConfig.colorSeven,
    colorEight: nitroConfig.colorEight,
    type: nitroConfig.type,
  };

  return {
    props: configProps,
  };
};

export default function Index(props: clientConfigProps) {
  // set config for subdomain — must be done be done client-side because config variables, i.e. chain.id, change render output
  let dbConfig = JSON.parse(props.config);
  // TODO: refactor code to use bridgeConfig.l1RPCUrl and bridgeConfig.l2RPCUrl instead of
  // token.l1.rpcURL, token.l2.rpcURL.
  for (let tok of dbConfig.tokens) {
    tok.l1.rpcURL ||= dbConfig.bridgeConfig.l1RPCUrl;
    tok.l2.rpcURL ||= dbConfig.bridgeConfig.l2RPCUrl;
  }
  config.bridgeConfig = dbConfig.bridgeConfig;
  config.tokens = dbConfig.tokens;

  return <Home {...props} />;
}

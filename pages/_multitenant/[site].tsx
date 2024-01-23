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
  type: "op" | "nitro";
}

const arbitrumNitroConfig: string = JSON.stringify({
  tokens: [
    {
      tokenName: 'Ether',
      l1: {
        chainId: 11155111,
        address: '0x0000000000000000000000000000000000000000',
        name: 'arbitrum-sepolia',
        symbol: 'ETH',
        decimals: 18,
        logoURI: 'https://dashboard.caldera.xyz/svgs/tokens/ETH.svg',
      },
      l2: {
        chainId: 7557973,
        address: '0x0000000000000000000000000000000000000000',
        name: 'edgeless-op',
        symbol: 'ETH',
        logoURI: 'https://dashboard.caldera.xyz/svgs/tokens/ETH.svg',
      },
      decimals: 18,
      isNative: true,
    },
    {
      tokenName: 'Dai',
      l1: {
        chainId: 11155111,
        address: '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6',
        name: 'arbitrum-sepolia',
        symbol: 'DAI',
        decimals: 18,
        logoURI: 'https://dashboard.caldera.xyz/svgs/tokens/DAI.svg',
      },
      l2: {
        chainId: 7557973,
        address: '0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6',
        name: 'edgeless-op',
        symbol: 'DAI',
        logoURI: 'https://dashboard.caldera.xyz/svgs/tokens/DAI.svg',
      },
      decimals: 18,
      isNative: true,
    },
  ],
  bridgeConfig: {
    bridge: '0x84C9B522c53499F849f2976B5bC0e885556C3F48',
    inbox: '0x223FD7011EB3AAB20879A552a0a0A28dC53A662B',
    outbox: '0x67d515F7Cb3A6DcE93051cB3E768426C4B94C73a',
    rollup: '0x078fD297e9cff77Cfc46d26105B1133951494259',
    sequencerInbox: '0x14E766EE853C7CA1C951Ac8c9B453a003B1CaF68',
    l1CustomGateway: '0xD49C075C48c67b945AF7ed5d7E1a3bCfb3eC1B87',
    l1ERC20Gateway: '0x1719768c49Be4FAFBbd1FC36B36992Cf54afCD41',
    l1GatewayRouter: '0x1701303840e8ed23354a4b6A2f7B734908b6f19d',
    l1MultiCall: '0x3AFeb1Ea760EED35D224C531D531C30eC6aE13e5',
    l1ProxyAdmin: '0x08D81f3E8Fc4696Ed025D64228D282aaf68a3302',
    l1Weth: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
    l1WethGateway: '0xd122128dF3A81835Ff47c16D1a9B4c2c30FdB4Ad',
    l2CustomGateway: '0x63B28E6642165F9504dD16140C22C10de9eD3974',
    l2ERC20Gateway: '0x0B37BFC31A8E6bce7A43a09f2a883d634A84cE54',
    l2GatewayRouter: '0xcF820D1d00610705d65370f5D745D0006E54D9A2',
    l2Multicall: '0xf8336fEd8CE0cB0c87fd8993F3C311a881e426fB',
    l2ProxyAdmin: '0x2Be4f31e09f3371023C67Aa7CeEdFdc08dD615ED',
    l2Weth: '0x2feaff0FC9450a04ACf745d3a76e1c3c637e8eF2',
    l2WethGateway: '0x8a6F1f69D53Bbc19148c8fBb04128c8564eE3C40',
    l1ChainId: 11155111,
    l2ChainId: 7557973,
    l1RPCUrl:
      'https://arb-sepolia.g.alchemy.com/v2/sWZV3jk4tyKBR2bEqmjJ0St0eFn29aQP',
    l2RPCUrl: 'https://edgeless-op.rpc.caldera.xyz/http',
  },
});

const optimismConfig: string = JSON.stringify({
  "tokens": [
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
      "tokenName": "Edgeless Wrapped Eth",
      "l1": {
        "chainId": 11155111,
        "address": "0x15353d8e704d218280e7a3f5563df4e4149f040b",
        "name": "sepolia",
        "symbol": "ewEth",
        "decimals": 18,
        "logoURI": "https://cryptologos.cc/logos/ethereum-eth-logo.png"
      },
      "l2": {
        "chainId": 202,
        "address": "0x0000000000000000000000000000000000000000",
        "name": "edgeless-testnet",
        "symbol": "ewEth",
        "logoURI": "https://cryptologos.cc/logos/ethereum-eth-logo.png"
      },
      "decimals": 18,
      "isNative": false
    }
  ],
  "bridgeConfig": {
    "addressManager": "0x2a583c340Ff65f0c7634761ea596Ec73339DFA99",
    "l1CrossDomainMessenger": "0x6088bf5Fd588B89358CdF794c4316cBD8a6D79F7",
    "l1StandardBridge": "0xfF591f2f96697F4D852C775B74830282d97D2c37",
    "optimismPortal": "0x90690CDEC37DC6C3a6B54514d39122680B238dD5",
    "l2OutputOracle": "0xE26E51C2D3a6e9a29a892E52B7694469d038bCF1",
    "l1RPCUrl": "https://eth-sepolia.g.alchemy.com/v2/BQ43RWiHw-hqyM4NVLrzcYSm-ybT5tYN",
    "l2RPCUrl": "https://edgeless-testnet.rpc.caldera.xyz/http"
  }
});

export const getServerSideProps = async (context: {
  params: { site: string };
}) => {
  const nitroConfig = {
    id: 'edgeless-op',
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
  if (!opConfig) {
    return {
      notFound: true,
    };
  }

  const configProps: clientConfigProps = {
    id: opConfig.id,
    faviconUrl: '',
    logo: opConfig.logo.toString(),
    config: opConfig.config,
    wordmark: opConfig.wordmark.toString(),
    colorOne: opConfig.colorOne,
    colorTwo: opConfig.colorTwo,
    colorThree: opConfig.colorThree,
    colorFour: opConfig.colorFour,
    colorFive: opConfig.colorFive,
    colorSix: opConfig.colorSix,
    colorSeven: opConfig.colorSeven,
    colorEight: opConfig.colorEight,
    type: 'op',
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

import {NitroBridgeConfig} from 'config/config';

const template = {
  "l1Network": {
      "blockTime": 10,
      "chainID": 421613,
      "explorerUrl": "",
      "isCustom": true,
      "name": "ArbGoerli",
      "isArbitrum": false,
      "partnerChainIDs": [
          412346
      ],
  },
  "l2Network": {
      "nativeToken": undefined as string | undefined,
      "chainID": 0,
      "confirmPeriodBlocks": 20,
      "ethBridge": {
          "bridge": "",
          "inbox": "",
          "outbox": "",
          "rollup": "",
          "sequencerInbox": ""
      },
      "explorerUrl": "",
      "isArbitrum": true,
      "isCustom": true,
      "name": "ArbLocal",
      "partnerChainID": 0,
      "retryableLifetimeSeconds": 604800,
      "nitroGenesisBlock": 0,
      "depositTimeout": 900000,
      "nitroGenesisL1Block": 0,
      "tokenBridge": {
          "l1CustomGateway": "",
          "l1ERC20Gateway": "",
          "l1GatewayRouter": "",
          "l1MultiCall": "",
          "l1ProxyAdmin": "",
          "l1Weth": "",
          "l1WethGateway": "",
          "l2CustomGateway": "",
          "l2ERC20Gateway": "",
          "l2GatewayRouter": "",
          "l2Multicall": "",
          "l2ProxyAdmin": "",
          "l2Weth": "",
          "l2WethGateway": ""
      }
  }
}
export const getTestNetwork = (config: NitroBridgeConfig) => {
  const testNetwork = template;
  testNetwork.l1Network.chainID = config.l1ChainId;
  testNetwork.l2Network.nativeToken = config.nativeToken;
  testNetwork.l2Network.chainID = config.l2ChainId;
  testNetwork.l2Network.partnerChainID = config.l1ChainId;
  testNetwork.l2Network.ethBridge.bridge = config.bridge;
  testNetwork.l2Network.ethBridge.inbox = config.inbox;
  testNetwork.l2Network.ethBridge.outbox = config.outbox;
  testNetwork.l2Network.ethBridge.rollup = config.rollup;
  testNetwork.l2Network.ethBridge.sequencerInbox = config.sequencerInbox;
  testNetwork.l2Network.tokenBridge.l1CustomGateway = config.l1CustomGateway;
  testNetwork.l2Network.tokenBridge.l1ERC20Gateway = config.l1ERC20Gateway;
  testNetwork.l2Network.tokenBridge.l1GatewayRouter = config.l1GatewayRouter;
  testNetwork.l2Network.tokenBridge.l1MultiCall = config.l1MultiCall;
  testNetwork.l2Network.tokenBridge.l1ProxyAdmin = config.l1ProxyAdmin;
  testNetwork.l2Network.tokenBridge.l1Weth = config.l1Weth;
  testNetwork.l2Network.tokenBridge.l1WethGateway = config.l2WethGateway;
  testNetwork.l2Network.tokenBridge.l2CustomGateway = config.l2CustomGateway;
  testNetwork.l2Network.tokenBridge.l2ERC20Gateway = config.l2ERC20Gateway;
  testNetwork.l2Network.tokenBridge.l2GatewayRouter = config.l2GatewayRouter;
  testNetwork.l2Network.tokenBridge.l2Multicall = config.l2Multicall;
  testNetwork.l2Network.tokenBridge.l2ProxyAdmin = config.l2ProxyAdmin;
  testNetwork.l2Network.tokenBridge.l2Weth = config.l2Weth;
  testNetwork.l2Network.tokenBridge.l2WethGateway = config.l2WethGateway;
  return testNetwork;
}

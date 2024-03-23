import { useState, useEffect } from 'react';
import TokenSelectorModal from 'components/TokenSelectorModal';

import config, {
  GAS_PER_NATIVE_DEPOSIT,
  Token,
  TokenInfo,
} from 'config/config';
import {
  buttonMessage,
  transferButton,
  TransferType,
  WalletState,
  addChainToMetamask,
} from 'util/transferUtils';
import { getTokenBalance, OpBridgeWrapper } from 'util/op/bridge';
import { getApprovalAmount } from 'util/erc20';
import { getDecimals } from 'util/tokenUtils';
import { ethers } from 'ethers';
import { useSigner, useConnect, useSwitchNetwork, chain } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { cleanNumString, numStringToBigNumber } from 'util/format';
import { BridgeConfig } from 'config/config';
import { BridgeInterface } from '../util/bridgeInterface';
import { NitroBridgeWrapper } from '../util/nitro/nitroBridge';

interface BridgeProps {
  transferType: TransferType;
  bridgeConfig: BridgeConfig;
  switchToAccount: any;
  l1AlternativeLogsProvider?: string;
}

const Deposit = (props: BridgeProps) => {
  const { transferType, bridgeConfig } = props;
  const { tokens } = config;

  const [selectedToken, setSelectedToken] = useState<Token>(tokens[0]);
  const [selectedTokenIsApproved, setSelectedTokenIsApproved] =
    useState<boolean>(true); // FIXME: assumes all tokens are approved, is this the case?
  // Talked to Parker, seems like we dont need to do approvals for L2 bridged assets. Keeping logic here for now in case that changes...

  const [amount, setAmount] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [walletState, setWalletState] = useState(WalletState.Disonnected);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [gasPriceWei, setGasPriceWei] = useState<ethers.BigNumber | undefined>(
    undefined
  );
  const [nativeCurrencyPriceUSD, setNativeCurrenyPriceUSD] = useState<
    number | undefined
  >(100); // TODO: get native price

  const { data: signer, isError, isLoading } = useSigner();
  const { switchNetwork } = useSwitchNetwork();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });

  // Track whether from and to token is L1 or L2
  const [fromToken, setFromToken] = useState<TokenInfo>(selectedToken.l1);
  const [toToken, setToToken] = useState<TokenInfo>(selectedToken.l2);
  const [fromBalance, setFromBalance] = useState<string>('');
  const [toBalance, setToBalance] = useState<string>('');

  const bridgeWrapper: BridgeInterface =
    bridgeConfig.type === 'op'
      ? new OpBridgeWrapper(bridgeConfig, props.l1AlternativeLogsProvider)
      : new NitroBridgeWrapper(bridgeConfig);

  // Update chain Id
  useEffect(() => {
    const main = async () => {
      if (signer?.getChainId) {
        setChainId(await signer?.getChainId());
      }
    };
    main();
  }, [setChainId, signer]);

  // Update wallet state
  useEffect(() => {
    if (isLoading || isError || !signer) {
      setWalletState(WalletState.Disonnected);
    } else if (!chainId || fromToken.chainId !== chainId) {
      setWalletState(WalletState.IncorrectNetwork);
    } else {
      setWalletState(WalletState.Connected);
    }
  }, [chainId, fromToken.chainId, isError, isLoading, signer]);

  useEffect(() => {
    const main = async () => {
      if (!signer) return;
      const gasPrice = await signer.getGasPrice();
      setGasPriceWei(gasPrice);
    };
    main();
  }, [setGasPriceWei, signer]);

  // Updates from/to tokens and token balances
  useEffect(() => {
    // Do not refresh upon switching networks as refresh was already triggered by transferType change
    // if (walletState === WalletState.IncorrectNetwork) return;

    setFromBalance('');
    setToBalance('');
    if (transferType === TransferType.Deposit) {
      setFromToken(selectedToken.l1);
      setToToken(selectedToken.l2);
    } else {
      setFromToken(selectedToken.l2);
      setToToken(selectedToken.l1);
    }

    const main = async () => {
      const addr = await signer?.getAddress();
      if (!addr) return;

      const [l1bal, l2bal] = await getTokenBalance(addr, selectedToken);
      if (transferType === TransferType.Deposit) {
        setFromBalance(
          ethers.utils.formatUnits(l1bal, getDecimals(selectedToken, true))
        );
        setToBalance(
          ethers.utils.formatUnits(l2bal, getDecimals(selectedToken, false))
        );
      } else {
        setFromBalance(
          ethers.utils.formatUnits(l2bal, getDecimals(selectedToken, false))
        );
        setToBalance(
          ethers.utils.formatUnits(l1bal, getDecimals(selectedToken, true))
        );
      }
    };
    main();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer, selectedToken, transferType]);

  // Check if selected token is approved
  useEffect(() => {
    const main = async () => {
      if (
        parseInt(selectedToken.l1.address, 16) === 0 ||
        transferType === TransferType.Withdraw
      ) {
        setSelectedTokenIsApproved(true);
      } else {
        setSelectedTokenIsApproved(false);
        const selectedTokenAddress = selectedToken.l1.address;
        const l1StandardBridgeAddress =
          bridgeWrapper.getL1BridgeAddress(selectedToken);
        const userAddress = await signer?.getAddress();
        const provider = new ethers.providers.JsonRpcProvider(
          selectedToken.l1.rpcURL
        );
        if (!provider || !userAddress) {
          return;
        }
        const approvalAmount = await getApprovalAmount(
          provider,
          selectedTokenAddress,
          userAddress,
          l1StandardBridgeAddress
        );
        if (
          Number(approvalAmount) >=
          Number(
            numStringToBigNumber(
              amount,
              ethers.BigNumber.from(getDecimals(selectedToken, true))
            )
          )
        ) {
          setSelectedTokenIsApproved(true);
        } else {
          setSelectedTokenIsApproved(false);
        }
      }
    };
    main();
  }, [signer, selectedToken, amount, setSelectedTokenIsApproved]);

  const displayAddChainButton =
    walletState === WalletState.Connected &&
    chainId !== tokens[0].l1.chainId &&
    chainId !== tokens[0].l2.chainId;

  return (
    <>
      <TokenSelectorModal
        isOpen={modalIsOpen}
        setIsOpen={setModalIsOpen}
        setSelectedToken={setSelectedToken}
        transferType={transferType}
      />
      <div className="flex flex-col justify-between gap-2">
        <div className="flex flex-col bg-colorTwo h-36 shadow-xl rounded-lg p-4">
          <div className="flex justify-between pb-4">
            <div className=" font-colorSeven font-bridge text-colorSix">
              From
            </div>
            <div className=" font-colorSeven font-bridge text-colorSix">
              Network: {fromToken.name}
            </div>
          </div>
          <div className="flex justify-between items-center h-full">
            <input
              className="bg-transparent text-4xl w-1/2 sm:w-full text-white focus:outline-none focus:ring-0 text-start"
              onChange={(e) => setAmount(cleanNumString(e.target.value))}
              placeholder="0.00"
              style={{ maxWidth: '70%' }}
              value={amount}
            />
            <div
              className="text-2xl sm:ml-6 flex bg-primaryBg text-white p-2 shadow-xl rounded-full cursor-pointer hover:bg-colorFour"
              onClick={() => setModalIsOpen(true)}
            >
              <img
                alt=""
                className="h-4 w-4 my-auto mx-2"
                src={fromToken.logoURI}
              />
              <div className="my-auto px-1 text-base">{fromToken.symbol}</div>
              <img
                alt=""
                className="h-4 w-4 my-auto text-white"
                src="/icons/chevron-down.svg"
              />
            </div>
          </div>
        </div>
        {/* Section two */}
        <div className="bg-colorTwo shadow-xl rounded-lg h-36 p-4">
          <div className="flex justify-between pb-4">
            <div className="pb-4 font-colorSeven font-bridge text-colorSix">
              You receive
            </div>
            <div className=" font-colorSeven font-bridge text-colorSix">
              Network: {toToken.name}
            </div>
          </div>
          <div className="flex justify-between items-center h-[72px]">
            <div className="text-4xl text-colorSix">{`${amount || 0.0}`}</div>
            <div className="text-2xl ml-6 flex h-10 bg-primaryBg text-white p-2 shadow-xl rounded-full cursor-pointer hover:bg-colorFour">
              <img
                alt=""
                className="h-4 w-4 my-auto mx-2"
                src={toToken.logoURI}
              />
              <div className="my-auto px-1 text-base">{toToken.symbol}</div>
            </div>
          </div>
        </div>
        <button
          className="mt-2 transition-all duration-300 font-custom text-[28px] inline-flex items-center justify-center px-5 py-2 bg-primaryGreen
                border border-colorFive
                rounded-xl
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-colorFive
                        hover:brightness-125 hover:text-colorOne
                        "
          onClick={() =>
            transferButton(
              walletState,
              connect,
              switchNetwork,
              selectedToken,
              selectedTokenIsApproved,
              setSelectedTokenIsApproved,
              signer,
              amount,
              transferType,
              bridgeWrapper
            )
          }
        >
          {buttonMessage(
            walletState,
            amount,
            fromBalance,
            selectedTokenIsApproved,
            transferType
          )}
        </button>
        {displayAddChainButton && (
          <div className="flex justify-center">
            <button
              className="justify-center items-center self-stretch px-16 py-4 text-sm font-semibold tracking-tight leading-3 uppercase whitespace-nowrap bg-gray-200 rounded-xl w-full text-zinc-900 max-md:px-5"
              onClick={() => {
                if (transferType === TransferType.Deposit) {
                  addChainToMetamask(
                    tokens[0].l1,
                    tokens[0].l1.decimals || 18,
                    tokens[0].l1.name,
                    tokens[0].l1.symbol
                  );
                } else {
                  // FIXME: we assume all chains use tokens[0].l1.decimals || 18 decimals for their native token
                  addChainToMetamask(
                    tokens[0].l2,
                    tokens[0].l1.decimals || 18,
                    tokens[0].tokenName,
                    tokens[0].l2.symbol
                  );
                }
              }}
            >
              Add chain to Metamask
            </button>
          </div>
        )}
        <h2 className="font-custom text-sm text-center text-colorSix mt-8">
          Note: You need to add the chain to Metamask before bridging from the
          chain.
        </h2>
        {walletState === WalletState.Connected && amount && (
          <div className="mt-6">
            <div className="flex text-colorSix">
              Estimated gas usage:{' '}
              <span className="ml-auto">{GAS_PER_NATIVE_DEPOSIT}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Deposit;

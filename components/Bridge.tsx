import { useState, useEffect } from 'react';
import TokenSelectorModal from 'components/TokenSelectorModal';
import DepositLoading from 'components/DepositLoading';
import DepositSuccessful from 'components/DepositSuccessful';
import DepositFailed from 'components/DepositFailed';
import WithdrawLoading from 'components/WithdrawLoading';
import WithdrawSuccessful from 'components/WithdrawSuccessful';

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
import { getTokenBalance, calculateGasPrice, BridgeWrapper } from 'util/bridge';
import { getApprovalAmount, getBalance } from 'util/erc20';
import { getDecimals } from 'util/tokenUtils';
import { ethers } from 'ethers';
import { useSigner, useConnect, useSwitchNetwork, chain } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { cleanNumString, numStringToBigNumber } from 'util/format';
import { BridgeConfig } from 'config/config';

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

  const bridgeWrapper = new BridgeWrapper(
    bridgeConfig
  );

  const [depositLoadingOpen, setDepositLoadingOpen] = useState(false);
  const [depositSuccessfulOpen, setDepositSuccessfulOpen] = useState(false);
  const [DepositFailedOpen, setDepositFailedOpen] = useState(false);
  const [withdrawLoadingOpen, setWithdrawLoadingOpen] = useState(false);
  const [withdrawSuccessfulOpen, setWithdrawSuccessulOpen] = useState(false);

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
        setFromBalance(ethers.utils.formatUnits(l1bal, getDecimals(selectedToken, true)));
        setToBalance(ethers.utils.formatUnits(l2bal, getDecimals(selectedToken, false)));
      } else {
        setFromBalance(ethers.utils.formatUnits(l2bal, getDecimals(selectedToken, false)));
        setToBalance(ethers.utils.formatUnits(l1bal, getDecimals(selectedToken, true)));
      }
    };
    main();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer, selectedToken, transferType]);

  // Check if selected token is approved
  useEffect(() => {
    const main = async () => {
      if (parseInt(selectedToken.l1.address, 16) === 0 || transferType === TransferType.Withdraw) {
        setSelectedTokenIsApproved(true);
      } else {
        setSelectedTokenIsApproved(false);
        const selectedTokenAddress = selectedToken.l1.address;
        const l1GatewayAddress = config.bridgeConfig.l1ERC20Gateway;
        const userAddress = await signer?.getAddress();
        const provider = signer?.provider;
        if (!provider || !userAddress) {
          return;
        }
        const approvalAmount = await getApprovalAmount(
          provider,
          selectedTokenAddress,
          userAddress,
          l1GatewayAddress
        );
        if (
          Number(approvalAmount) >=
          Number(numStringToBigNumber(
            amount,
            ethers.BigNumber.from(getDecimals(selectedToken, true))
          ))
        ) {
          setSelectedTokenIsApproved(true);
        } else {
          setSelectedTokenIsApproved(false);
        }
      }
    };
    main();
  }, [signer, selectedToken, amount, setSelectedTokenIsApproved]);

  return (
    <>
      <TokenSelectorModal
        isOpen={modalIsOpen}
        setIsOpen={setModalIsOpen}
        setSelectedToken={setSelectedToken}
        transferType={transferType}
      />
      <DepositLoading
        open={depositLoadingOpen}
        setOpen={setDepositLoadingOpen}
      />
      <DepositSuccessful
        open={depositSuccessfulOpen}
        setOpen={setDepositSuccessfulOpen}
      />
      <DepositFailed open={DepositFailedOpen} setOpen={setDepositFailedOpen} />
      <WithdrawLoading
        open={withdrawLoadingOpen}
        setOpen={setWithdrawLoadingOpen}
      />
      <WithdrawSuccessful
        open={withdrawSuccessfulOpen}
        selectedToken={selectedToken}
        setOpen={setWithdrawSuccessulOpen}
        switchNetwork={switchNetwork}
        switchToAccount={props.switchToAccount}
      />
      <div className="mt-6 flex flex-col justify-between">
        <div className="flex flex-col bg-colorTwo h-36 shadow-xl rounded-lg">
          <div className="p-4 font-colorSeven font-bridge text-colorSix">
            From: {fromToken.name}
          </div>
          <div className="p-4 flex">
            <input
              className="mt-auto bg-transparent text-4xl text-right"
              onChange={(e) => setAmount(cleanNumString(e.target.value))}
              placeholder="0.00"
              style={{ maxWidth: '70%' }}
              value={amount}
            />
            <div
              className="text-2xl ml-6 flex bg-colorThree p-2 shadow-xl rounded cursor-pointer hover:bg-colorFour"
              onClick={() => setModalIsOpen(true)}
            >
              <img alt="" className="h-8 w-8 my-auto" src={fromToken.logoURI} />
              <div className="my-auto">{fromToken.symbol}</div>
              <img
                alt=""
                className="h-4 w-4 my-auto"
                src="/icons/chevron-down.svg"
              />
            </div>
          </div>
        </div>
        <div className="text-center text-xl py-4">▼</div>
        <div className="bg-colorTwo shadow-xl rounded-lg">
          <div className="p-4 font-colorSeven font-bridge text-colorSix">
            To: {toToken.name}
          </div>
          <div className="pl-4 text-colorSix">
            You will receive: {`${amount || 0} ${toToken.symbol}`}
          </div>
          <div className="pl-4 pb-4 text-colorSix">
            {toBalance &&
              `Current balance on ${
                transferType === TransferType.Deposit ? 'L2' : 'L1'
              }: ${toBalance} ${toToken.symbol}`}
          </div>
        </div>
        <button
          className="mt-16 transition-all duration-300 font-custom text-[28px] italic font-bold inline-flex items-center justify-center px-5 py-2 bg-transparent
                border border-colorFive
                rounded-xl
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-colorFive
                        hover:bg-colorFive hover:text-colorOne
                        focus:bg-colorFive focus:text-colorOne"
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
              bridgeWrapper,
              setDepositLoadingOpen,
              setDepositSuccessfulOpen,
              setDepositFailedOpen,
              setWithdrawLoadingOpen,
              setWithdrawSuccessulOpen
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
        <div className="flex justify-center">
          <button
          className="text-[18px] font-custom text-colorSix font-medium mt-6 hover:text-colorSeven hover:font-medium"
          onClick={() =>
            {if (transferType === TransferType.Deposit) {
              // FIXME: we assume all chains use 18 decimals for their native token
              addChainToMetamask(tokens[0].l1, 18, tokens[0].tokenName);
            } else {
              // FIXME: we assume all chains use 18 decimals for their native token
              addChainToMetamask(tokens[0].l2, 18, tokens[0].tokenName);
            }}
          }
        >
            Add chain to Metamask
          </button>
        </div>
        <h2 className="font-custom text-sm text-center text-colorSix mt-8">Note: You need to add the chain to Metamask before bridging from the chain.</h2>
        {walletState === WalletState.Connected && amount && (
          <div className="mt-6">
            <div className="flex">
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

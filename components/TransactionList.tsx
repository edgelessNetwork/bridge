import { useEffect, useMemo, useState } from 'react';
import { OpBridgeWrapper } from 'util/op/bridge';
import { getDecimals } from 'util/tokenUtils';
import { useSigner, useSwitchNetwork, useNetwork } from 'wagmi';
import moment from 'moment';
import { ethers } from 'ethers';

import config, { Token } from 'config/config';
import { BridgeConfig } from 'config/config';
import { BridgeInterface, MessageInterface } from '../util/bridgeInterface';
import { NitroBridgeWrapper } from '../util/nitro/nitroBridge';
import { Paginator } from './Paginator';

const DEFAULT_NUM_MESSAGES = 5;

// Table of user's past transactions
// Lists deposits if isDepositMode === true, else lists withdrawals
const TransactionList = ({
  isDepositMode,
  selectedToken,
  bridgeConfig,
  l1ChainId,
  l1AlternativeLogsProvider,
}: {
  isDepositMode: boolean;
  selectedToken: Token;
  bridgeConfig: BridgeConfig;
  l1ChainId: number;
  l1AlternativeLogsProvider?: string;
}) => {
  const { data: signer } = useSigner();
  const { chain, chains } = useNetwork();

  const [withdrawals, setWithdrawals] = useState<Array<MessageInterface>>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);

  const [deposits, setDeposits] = useState<Array<MessageInterface>>([]);
  const [depositsLoading, setDepositsLoading] = useState(true);

  const { switchNetwork } = useSwitchNetwork();

  const [numMessages, setNumMessages] = useState<number>(DEFAULT_NUM_MESSAGES);
  const [messageOffset, setMessageOffset] = useState<number>(0);

  const bridgeWrapper: BridgeInterface = useMemo(() => {
    return bridgeConfig.type === 'op'
      ? new OpBridgeWrapper(bridgeConfig, l1AlternativeLogsProvider)
      : new NitroBridgeWrapper(bridgeConfig);
  }, [bridgeConfig, l1AlternativeLogsProvider]);

  // Get withdrawals for current address
  useEffect(() => {
    const main = async () => {
      if (signer && !isDepositMode) {
        setWithdrawalsLoading(true);
        try {
          const address = await signer.getAddress();
          const withdrawals = await bridgeWrapper.getWithdrawalsForAddress(
            address,
            selectedToken,
            numMessages + 1,
            messageOffset
          );
          setWithdrawals(withdrawals);
        } catch (error) {
          setWithdrawals([]);
        }
        setWithdrawalsLoading(false);
      }
    };
    main();
  }, [
    selectedToken,
    signer,
    isDepositMode,
    bridgeWrapper,
    numMessages,
    messageOffset,
  ]);

  // Get deposits for current address
  useEffect(() => {
    const main = async () => {
      setDepositsLoading(true);
      if (signer && isDepositMode) {
        try {
          const address = await signer.getAddress();
          const deposits = await bridgeWrapper.getDepositsForAddress(
            address,
            selectedToken,
            numMessages + 1,
            messageOffset
          );
          console.log(deposits);
          setDeposits(deposits);
        } catch {
          setDeposits([]);
        }
        setDepositsLoading(false);
      }
    };
    main();
  }, [
    selectedToken,
    signer,
    isDepositMode,
    bridgeWrapper,
    numMessages,
    messageOffset,
  ]);

  const formatAmount = (
    amount: ethers.BigNumberish,
    l1TokenAddress: string
  ) => {
    const token = config.tokens.find(
      (t) => t.l1.address.toLowerCase() === l1TokenAddress.toLowerCase()
    );
    return `${ethers.utils.formatUnits(
      amount,
      getDecimals(token!, isDepositMode)
    )} ${token?.l1.symbol}`;
  };

  const messages = isDepositMode ? deposits : withdrawals;
  const isMessagesLoading = isDepositMode
    ? depositsLoading
    : withdrawalsLoading;

  if (!signer) {
    return <div>Please connect your wallet to view account information</div>;
  }

  if (isMessagesLoading) {
    return <div>Loading...</div>;
  }

  const takeNextStep = async (message: MessageInterface) => {
    if (chain?.id !== l1ChainId) {
      switchNetwork?.(l1ChainId);
    } else {
      await message.takeNextStep(signer!, selectedToken, isDepositMode);
    }
  };

  return (
    <>
      <table className="table-auto min-w-full font-bridge">
        <thead>
          <tr className="text-[var(--grey,#D0DAD8)] leading-[132%] font-[600] text-[12px] uppercase tracking-[-0.288px]">
            <th className="text-left font-[Neue Regrade]">Time</th>
            <th className="font-[Neue Regrade]">Transaction</th>
            <th className="font-[Neue Regrade]">Amount</th>
            <th className="text-right font-[Neue Regrade]">Status</th>
          </tr>
        </thead>
        <tbody>
          {messages.length === 0 && <span>No events found!</span>}
          {messages.slice(0, numMessages).map((message, i) => (
            <tr
              className={`${i % 2 === 0 ? 'bg-[#171D1F]' : ''} rounded-lg`}
              key={message.getHash()}
            >
              <td className="pl-2 py-2 rounded-l-lg">
                {moment.unix(message.getBlock().timestamp).fromNow()}
              </td>
              <td className="text-center">
                {message.getHash().substring(0, 8)}...
              </td>
              <td className="text-center">
                {formatAmount(
                  // TODO: fix types so this is not needed, this hack should be fie as long as all bridge messages are for fungible tokens, not NFTs
                  message.getAmount(),
                  message.getL1Token()
                )}
              </td>
              <td className="pr-2 py-2 rounded-r-lg">
                <div className="flex justify-end">
                  <div
                    className={`${
                      message.getStatus() === 'success'
                        ? 'bg-[#A0EB671F] text-primaryGreen'
                        : message.getStatus() === 'failed'
                        ? 'bg-[#FF47471F] text-[#FF4747]'
                        : 'text-[#87A397] bg-[#87A3971F]'
                    } rounded-full px-2 py-[1px] w-fit`}
                  >
                    {message.getStatus()}
                    {message.nextStepName(isDepositMode) !== undefined && (
                      <span
                        className="ml-1 cursor-pointer underline"
                        onClick={() => takeNextStep(message)}
                      >
                        (
                        {chain?.id === l1ChainId
                          ? message.nextStepName(isDepositMode)
                          : 'switch network'}
                        )
                      </span>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <br />
      <Paginator
        hasMore={messages.length === numMessages + 1}
        messageOffset={messageOffset}
        numMessages={numMessages}
        setMessageOffset={setMessageOffset}
        setNumMessages={setNumMessages}
      />
    </>
  );
};

export default TransactionList;

import { useEffect, useState } from 'react';
import { BridgeWrapper, RichBridgeMessage, withdrawalStatusToString } from 'util/bridge';
import { getDecimals } from 'util/tokenUtils';
import { useSigner, useSwitchNetwork, useNetwork } from 'wagmi';
import moment from 'moment';
import { ethers } from 'ethers';
import { L2ToL1MessageStatus } from '@arbitrum/sdk';

import config, { Token } from 'config/config';
import { BridgeConfig } from 'config/config';

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

  const [withdrawals, setWithdrawals] = useState<Array<RichBridgeMessage>>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);

  const [deposits, setDeposits] = useState<Array<RichBridgeMessage>>([]);
  const [depositsLoading, setDepositsLoading] = useState(true);

  const { switchNetwork } = useSwitchNetwork();

  const bridgeWrapper = new BridgeWrapper(
    bridgeConfig
  );

  // Get withdrawals for current address
  useEffect(() => {
    const main = async () => {
      if (signer && !isDepositMode) {
        try {
          const address = await signer.getAddress();
          const withdrawals = await bridgeWrapper.getWithdrawalsForAddress(
            address,
            selectedToken
          );
          setWithdrawals(withdrawals);
        } catch (error) {
          setWithdrawals([]);
        }
        setWithdrawalsLoading(false);
      }
    };
    main();
  }, [selectedToken, signer, isDepositMode]);

  // Get deposits for current address
  useEffect(() => {
    const main = async () => {
      if (signer && isDepositMode) {
        try {
          const address = await signer.getAddress();
          const deposits = await bridgeWrapper.getDepositsForAddress(
            address,
            selectedToken
          );
          setDeposits(deposits);
        } catch {
          setDeposits([]);
        }
        setDepositsLoading(false);
      }
    };
    main();
  }, [selectedToken, signer, isDepositMode]);

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

  const withdrawButton = async (message: RichBridgeMessage) => {
    if (chain?.id !== l1ChainId) {
      switchNetwork?.(l1ChainId);
    } else {
      bridgeWrapper.finalizeWithdrawalMessage(
        signer!,
        message,
        selectedToken
      );
    }
  };

  return (
    <table className="table-auto min-w-full text-left">
      <thead>
        <tr>
          <th>Time</th>
          <th>Amount</th>
          <th>Transaction</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {messages.length === 0 && <span>No events found!</span>}
        {messages.map((message) => (
          <tr key={message.message.transactionHash}>
            <td>{moment.unix(message.block.timestamp).fromNow()}</td>
            <td>
              {formatAmount(
                message.message.amount,
                message.message.l1Token
              )}
            </td>
            <td>{message.message.transactionHash.substring(0, 8)}...</td>
            <td>
              <>{message.status}</>
              {bridgeWrapper.isReadyForFinalization(message) && (
                <span
                  className="ml-1 cursor-pointer underline"
                  onClick={() => withdrawButton(message)}
                >
                  ({chain?.id === l1ChainId ? 'finalize' : 'switch network'})
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TransactionList;

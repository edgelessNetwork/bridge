import { useState } from 'react';
import config, { Token } from 'config/config';
import TransactionList from 'components/TransactionList';
import { BridgeConfig } from 'config/config';

const MyAccount = ({
  switchToMain,
  bridgeConfig,
  l1ChainId,
  l1AlternativeLogsProvider,
}: {
  switchToMain: Function;
  bridgeConfig: BridgeConfig;
  l1ChainId: number;
  l1AlternativeLogsProvider?: string;
}) => {
  const { tokens } = config;
  const [selectedToken, setSelectedToken] = useState<Token>(tokens[0]); // ToDo: create token selector
  const [showDeposits, setShowDeposits] = useState(true); // false if on withdraw mode

  return (
    <div className="flex">
      <div className="text-white w-full max-w-screen-lg mx-auto mt-16 shadow-xl rounded-md p-6">
        <div className="p-2 text-secondaryGreenText">
          <span
            className={`${
              showDeposits && 'text-white font-semibold'
            } mr-4 cursor-pointer`}
            onClick={() => setShowDeposits(true)}
          >
            <span className=" text-[36px] sm:text-[56px]">Deposits</span>
          </span>
          <span
            className={`${
              !showDeposits && 'text-white font-semibold'
            } mr-4 cursor-pointer `}
            onClick={() => setShowDeposits(false)}
          >
            <span className=" text-[36px] sm:text-[56px]">Withdrawals</span>
          </span>
        </div>
        <div className="p-2">
          <TransactionList
            bridgeConfig={bridgeConfig}
            isDepositMode={showDeposits}
            l1AlternativeLogsProvider={l1AlternativeLogsProvider}
            l1ChainId={l1ChainId}
            selectedToken={selectedToken}
          />
        </div>
      </div>
    </div>
  );
};

export default MyAccount;



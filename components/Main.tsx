import React, { useState } from 'react';
import Bridge from 'components/Bridge';

import { BridgeConfig } from 'config/config';
import { TransferType } from 'util/transferUtils';

const Main = ({
  switchToAccount,
  bridgeConfig,
  l1AlternativeLogsProvider,
}: {
  switchToAccount: Function;
  bridgeConfig: BridgeConfig;
  l1AlternativeLogsProvider?: string;
}) => {
  const [transferType, setTransferType] = useState<TransferType>(
    TransferType.Deposit
  );

  return (
    <div className="flex">
      <div className="bg-colorOne w-[36rem] mx-auto mt-16 shadow-xl rounded-md p-6">
        <div className="p-2 flex text-[26px] font-custom text-colorSix font-extralight">
          <span
            className={`${
              transferType === TransferType.Deposit &&
              'text-colorSeven font-extrabold'
            } mr-4 cursor-pointer`}
            onClick={() => setTransferType(TransferType.Deposit)}
          >
            Deposit
          </span>
          <span
            className={`${
              transferType !== TransferType.Deposit &&
              'text-colorSeven font-extrabold'
            } mr-4 cursor-pointer`}
            onClick={() => setTransferType(TransferType.Withdraw)}
          >
            Withdraw
          </span>
          <span
            className="tab-unselected ml-auto cursor-pointer"
            onClick={() => switchToAccount()}
          >
            Account
          </span>
        </div>
        <Bridge
          bridgeConfig={bridgeConfig}
          l1AlternativeLogsProvider={l1AlternativeLogsProvider}
          switchToAccount={switchToAccount}
          transferType={transferType}
        />
      </div>
    </div>
  );
};

export default Main;

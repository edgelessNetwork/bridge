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
//w-[36rem]
  return (
    <div className="flex flex-col">
      <div className="bg-primaryBg  mx-auto mt-2 sm:mt-16 shadow-xl rounded-md p-6"> 
        <div className="p-2 flex justify-between text-[26px]   sm:text-[52px] font-custom text-colorSix font-extralight">
          <span
            className={`${
              transferType === TransferType.Deposit &&
              'text-white'
            } mr-4 cursor-pointer font-semibold`}
            onClick={() => setTransferType(TransferType.Deposit)}
          >
            Deposit
          </span>
          <span
            className={`${
              transferType !== TransferType.Deposit &&
              'text-white'
            } mr-4 cursor-pointer font-semibold`}
            onClick={() => setTransferType(TransferType.Withdraw)}
          >
            Withdraw
          </span>
          {/* <span
            className="tab-unselected ml-auto cursor-pointer"
            onClick={() => switchToAccount()}
          >
            Account
          </span> */}
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

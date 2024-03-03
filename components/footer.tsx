import { useAccount, useNetwork } from 'wagmi';

export const BridgeFooter = () => {
  const { address } = useAccount();
  const {chain} = useNetwork();
  return (
    <footer className="flex justify-between items-center p-4 w-full">
      <div className="flex items-center">
        {address && (
          <>
            <div className="w-2 h-2 bg-primaryGreen rounded-full mr-2" />
            <span className="text-primaryGreen">Connected</span>
          </>
        )}
      </div>
      <div className=" text-xs font-semibold tracking-tight leading-3 text-neutral-400">
        <span className="text-gray-300">Privacy Policy</span> and{' '}
        <span className="text-gray-300">Terms of Service.</span>
      </div>
      <div> </div>
    </footer>
  );
};

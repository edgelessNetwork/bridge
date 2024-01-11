import 'styles/globals.css';
import type { AppProps } from 'next/app';

import { WagmiConfig, createClient } from 'wagmi';
import { getDefaultProvider } from 'ethers';
import { ConnectKitProvider } from 'connectkit';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const client = createClient({
  autoConnect: false,
  provider: getDefaultProvider(),
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider>
        <Component {...pageProps} />
        <ToastContainer />
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

export default MyApp;

import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';

import Navbar from 'components/Navbar';
import Main from 'components/Main';
import Account from 'components/Account';
import {
  clientConfigProps,
  getServerSideProps as GSSP,
} from 'pages/_multitenant/[site]';
import { BridgeConfig, customColorNames } from 'config/config';

enum Page {
  MAIN,
  ACCOUNT,
}

export async function getServerSideProps(context: any) {
  return GSSP(context);
}

const Home: NextPage<clientConfigProps> = (props) => {
  const [page, setPage] = useState(Page.MAIN);

  const switchToMain = () => {
    setPage(Page.MAIN);
  };

  const switchToAccount = () => {
    setPage(Page.ACCOUNT);
  };

  const config = JSON.parse(props.config);

  const bridgeConfig: BridgeConfig = config.bridgeConfig;
  bridgeConfig.type = props.type;
  const l1ChainId = config.tokens[0]?.l1?.chainId!;
  const l1AlternativeLogsProvider: string | undefined =
    config.tokens[0]?.l1?.getLogsProvider;

  console.log('Alternative logs provider', l1AlternativeLogsProvider);
  // Set colors from the subdomain config fetched from db client-side
  useEffect(() => {
    // colors
    const root = document.documentElement;
    for (const colorVarName of customColorNames) {
      root.style.setProperty(
        `--${colorVarName}`,
        props[colorVarName as keyof clientConfigProps]
      );
    }

    // favicon
    var faviconUrl = props.faviconUrl;
    if (!faviconUrl) return;
    var link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
    link.href = faviconUrl;
  });

  return (
    <div className="min-h-screen bg-colorOne">
      <>
        <Head>
          <title>Bridge</title>
          <meta
            content="Enables users to transfer their
                    tokens between the layer-1 and layer-2 chains."
            name="description"
          />
          <link href="/favicon.png" rel="icon" />
        </Head>
        <Navbar {...props} />
        {page === Page.MAIN ? (
          <Main
            bridgeConfig={bridgeConfig}
            l1AlternativeLogsProvider={l1AlternativeLogsProvider}
            switchToAccount={switchToAccount}
          />
        ) : (
          <Account
            bridgeConfig={bridgeConfig}
            l1AlternativeLogsProvider={l1AlternativeLogsProvider}
            l1ChainId={l1ChainId}
            switchToMain={switchToMain}
          />
        )}
      </>
    </div>
  );
};

export default Home;

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useNetwork } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { useModal } from 'connectkit';
import config from 'config/config';
import { clientConfigProps } from 'pages/_multitenant/[site]';
import Link from 'next/link';

interface Link {
  title: string;
  href: string;
}
const LINKS = [
  {
    title: 'About',
    href: 'https://caldera.xyz/',
  },
  {
    title: 'Docs',
    href: 'https://calderaxyz.gitbook.io/caldera-documentation/getting-started/overview/',
  },
  {
    title: 'Twitter',
    href: 'https://twitter.com/Calderaxyz',
  },
  {
    title: 'Discord',
    href: 'https://discord.gg/0xconstellation',
  },
];

interface NavBarProps {
  config: clientConfigProps,
  switchToAccount: () => void,
  switchToMain: () => void,
};

const Navbar = ({config, switchToAccount, switchToMain}: NavBarProps) => {
  const [expanded, setExpanded] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();
  const { open, setOpen } = useModal();
  const { chain } = useNetwork();

  const SUPPORTED_NETWORKS = config.config
    ? JSON.parse(config.config).tokens.flatMap((token: any) => [
        token.l1.chainId,
        token.l2.chainId,
      ])
    : [];

  return (
    <header className="py-4 w-full bg-primaryBg shadow text-white">
      <div className="px-4 mx-auto sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <span className="inline-block lg:hidden mr-4">
              <button
                className="text-white"
                onClick={() => setExpanded(!expanded)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={expanded ? 'hidden' : 'visible'}
                >
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 6h16M4 12h16M4 18h16"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </span>
                <span
                  aria-hidden="true"
                  className={expanded ? 'visible' : 'hidden'}
                >
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 18L18 6M6 6l12 12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </span>
              </button>
            </span>
            <div 
            className="max-lg:hidden"
            onClick={switchToMain}>
              <div className='cursor-pointer flex flex-nowrap gap-4'>
                <img
                alt="Edgeless Network"
                className="max-w-full aspect-[3.57] w-[108px] "
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/33249cd15af91da23f6148bb8f3775f76a32f5e469e401b8e3cb7d4815fc676f?"
              />
                <div className="text-lg font-bold pt-[1px]">Bridge</div>
              </div>
            </div>
            <div className="flex cursor-pointer max-lg:hidden" onClick={switchToAccount}>
              <div className="text-lg font-bold pt-[1px]">Transactions</div>
            </div>
          </div>
          <nav className="lg:flex lg:items-center lg:justify-end lg:space-x-6">
            
            <a
              className="
                        inline-flex
                        items-center
                        justify-center
                        px-5
                        py-2
                        text-base
                        font-semibold
                        leading-7
                        text-colorFive
                        transition-all
                        duration-200
                        bg-primaryGreen
                        border border-colorFive
                        rounded-xl
                        font-pj
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-colorFive
                        hover:bg-colorFive hover:text-colorOne
                        focus:bg-colorFive focus:text-colorOne
                    "
              href="#"
              onClick={() => (isConnected ? switchToAccount() : connect())}
              role="button"
              title=""
            >
              {isConnected
                ? `Connected: ${address?.slice(0, 8)}...`
                : 'Connect Wallet'}
            </a>
          </nav>
        </div>
        <nav className={expanded ? 'visible' : 'hidden'}>
          <div className="px-1 py-8">
            <div className="grid gap-y-7">
              {LINKS.map((link: Link, i) => (
                <a
                  className="flex items-center p-3 -m-3 text-base font-medium text-white transition-all duration-200 rounded-xl hover:bg-colorTwo focus:outline-none font-pj focus:ring-1 focus:ring-colorFive focus:ring-offset-2"
                  href={link.href}
                  key={`nav-link-expanded-${i}`}
                  rel="noopener noreferrer"
                  target="_blank"
                  title=""
                >
                  {link.title}
                </a>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

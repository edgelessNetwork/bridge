import { Dispatch, SetStateAction, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

import config, { Token } from 'config/config';
import { parseFromToken, TransferType } from 'util/transferUtils';

const { tokens } = config;

const TokenSelectorModal = ({
  transferType,
  isOpen,
  setIsOpen,
  setSelectedToken,
}: {
  transferType: TransferType;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedToken: Dispatch<SetStateAction<Token>>;
}) => {
  const [search, setSearch] = useState('');

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  function setTokenAndClose(token: Token) {
    setSelectedToken(token);
    setIsOpen(false);
  }

  return (
    <>
      <Transition appear as={Fragment} show={isOpen}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-colorEight" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center pb-64">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-colorOne p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-colorFive"
                  >
                    Select Token
                  </Dialog.Title>
                  <div className="mt-2">
                    <div>
                      <input
                        className="w-full text-xl p-2"
                        onChange={(e) =>
                          setSearch(e.target.value.toLowerCase())
                        }
                        placeholder="Enter token name or paste address"
                        value={search}
                      />
                    </div>
                    <div className="h-80 overflow-y-scroll py-4">
                      {config.tokens
                        .filter((token: Token) => {
                          const fromToken = parseFromToken(token, transferType);
                          return (
                            fromToken.symbol.toLowerCase().includes(search) ||
                            fromToken.address.toLowerCase().includes(search)
                          );
                        })
                        .map((token: Token) => {
                          const fromToken = parseFromToken(token, transferType);
                          return (
                            <div
                              className="py-4 flex hover:bg-colorThree rounded cursor-pointer"
                              key={`token-item-${fromToken.symbol}`}
                              onClick={() => setTokenAndClose(token)}
                            >
                              <img
                                alt=""
                                className="h-10 w-10 ml-4 mt-1"
                                src={fromToken.logoURI}
                              />
                              <div className="ml-4">
                                <div className="font-semibold">
                                  {fromToken.symbol}
                                </div>
                                <div className="text-colorSix">
                                  {fromToken.name}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      className="inline-flex justify-center rounded-md border border-transparent bg-colorThree px-4 py-2 text-sm font-medium text-colorSeven hover:bg-colorFour focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                      type="button"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default TokenSelectorModal;

import Link from 'next/link';
import { ToastContainer, ToastOptions } from 'react-toastify';
import { getTxUrl } from '../util/op/bridge';

const submitted = (hash: string, rpcURL: string) => {
  hash = hash.slice(0, 6) + '...' + hash.slice(-4);
  return <a href={getTxUrl(hash, rpcURL)}>Transaction submitted: {hash}</a>;
};

const msg = {
  nonzero: 'Please enter a non-zero value',
  sig: 'There was an error signing the transaction',
  no_l1_addr: 'No L1 token address found',
  no_l2_addr: 'No L2 token address found',
  failed: 'Transaction failed',
  submitted,
  confirmed: 'Transaction confirmed',
  depositConfirmed: 'Deposit confirmed, check the Transactions page for status',
};

const standard: ToastOptions = {
  position: 'bottom-left',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
};

export { msg, standard };

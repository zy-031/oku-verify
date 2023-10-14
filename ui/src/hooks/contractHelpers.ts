import { networkConfig } from '@config/network';
import { toHex } from '@utils/wallet';
import { ethers } from 'ethers';

import OkuCheckContract from '../abi/OkuCheck.json';
import { OkuCheck } from '../types/contracts/OkuCheck';
import { getOkuCheckAddress } from './addressHelpers';

export const getRpcUrlByChainId = (chainId: number): string => {
  const networkRpc = networkConfig[toHex(chainId).toString()].rpcUrls[0];
  return networkRpc;
};

export const getRpcProviderByChainId = (chainId: number) => {
  return new ethers.providers.JsonRpcProvider(getRpcUrlByChainId(chainId));
};

const getContract = (abi: any, address: string, chainId: number) => {
  const signerOrProvider = getRpcProviderByChainId(chainId);
  return new ethers.Contract(address, abi, signerOrProvider);
};

export const getOkuCheckContract = (chainId: number) => {
  try {
    const contractAddr = getOkuCheckAddress(chainId);

    return getContract(OkuCheckContract.abi, contractAddr, chainId) as OkuCheck;
  } catch (e) {
    console.log(`Error getting contract for the chainId ${chainId}`);
  }
  return undefined;
};

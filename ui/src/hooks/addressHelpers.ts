import { contractAddresses } from '@config/constants';

export const getOkuCheckAddress = (selectedChainId: number): string => {
  return contractAddresses.okuCheck?.[selectedChainId.toString()] as string;
};
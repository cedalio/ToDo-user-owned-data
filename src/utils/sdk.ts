import CedalioSDK from '@cedalio/sdk-js';
import { CEDALIO_PROJECT_ID } from './envs';
import { disconnect } from '@wagmi/core';

export const cedalioSdk = new CedalioSDK({ projectId: CEDALIO_PROJECT_ID });

export const validateJwt = (token: string) => {
  try {
    const buffer = Buffer.from(token.split('.')[1], 'base64');
    const decoded = JSON.parse(buffer.toString());
    return decoded.exp * 1000 >= Date.now();
  } catch (e) {
    return false;
  }
};

export const loginToCedalio = async (address: string) => {
  const response = await cedalioSdk?.login({ address });

  if (response?.ok) {
    localStorage.setItem('token', response.data.token);
    return response.data.token;
  }
  return undefined;
};

export const logoutFromCedalio = async () => {
  cedalioSdk?.logout();
  localStorage.removeItem('token');
  await disconnect();
};

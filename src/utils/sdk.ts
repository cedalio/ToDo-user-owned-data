import CedalioSDK from '@cedalio/sdk-js';
import { CEDALIO_PROJECT_ID } from './envs';

export const cedalioSdk = new CedalioSDK({ projectId: CEDALIO_PROJECT_ID });

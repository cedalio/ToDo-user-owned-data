import { useCallback, useState } from 'react';
import { cedalioSdk } from '../../../../utils/sdk';
import { GetAccessModeResponse, AccessMode } from '@cedalio/sdk-js';

export const useGetAccessMode = () => {
  const [state, setState] = useState<{ loading: boolean; error?: string; data?: GetAccessModeResponse }>({
    loading: false,
    error: undefined,
    data: undefined
  });

  const request = useCallback(async () => {
    setState({ loading: false, data: undefined, error: undefined });

    const deploymentId = localStorage.getItem('deploymentId') as string;
    const response = await cedalioSdk.getAccessMode({ deploymentId });

    if (response.ok) {
      setState({ loading: false, data: response.data });
    } else {
      setState({ loading: false, error: response.error.message });
    }
  }, []);

  return { request, ...state };
};

export const useUpdateAccessMode = () => {
  const [state, setState] = useState<{ loading: boolean; error?: string }>({
    loading: false,
    error: undefined
  });

  const request = useCallback(async (accessMode: AccessMode) => {
    setState({ loading: true, error: undefined });

    const deploymentId = localStorage.getItem('deploymentId') as string;
    const response = await cedalioSdk.setAccessMode({ deploymentId, accessMode });

    if (response.ok) {
      setState({ loading: false });
    } else {
      setState({ loading: false, error: response.error.message });
    }
  }, []);

  return { request, ...state };
};

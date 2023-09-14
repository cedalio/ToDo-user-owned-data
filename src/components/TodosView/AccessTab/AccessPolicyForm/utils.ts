import {
  AccessPolicyType,
  AccessRule,
  SetAccessPolicy,
  AccessPolicy,
  ErrorApiResponse,
  SuccessApiResponse,
  ApiResponse
} from '@cedalio/sdk-js';
import { useCallback, useState } from 'react';
import { cedalioSdk } from '../../../../utils/sdk';

export interface FormPolicy {
  address: string;
  policyType: AccessPolicyType;
  accessRules: AccessRule[];
}

// In this database, Todo is the only Model. There could be more.
// There are more fields in the Todo model. For simplicity we're just showing these three.
export const OBJECT_TYPE_FIELDS: Record<string, string[]> = {
  Todo: ['id', 'title', 'description']
};

// Receives an array of functions executing promises and it runs them sequentially
async function chainPromises<SuccessData>(
  promises: (() => Promise<ApiResponse<SuccessData>>)[]
): Promise<
  { error: false; result: SuccessApiResponse<SuccessData>[] } | { error: true; result: ErrorApiResponse }
> {
  const successResponses = [];
  for (const promise of promises) {
    try {
      const res = await promise();
      if (!res.ok) {
        return { error: true, result: res };
      }
      successResponses.push(res);
    } catch (error) {
      // Handle the error here
      return {
        error: true,
        result: {
          ok: false,
          status: 500,
          error: {
            payload: {},
            message: 'Unknown error'
          }
        }
      };
    }
  }

  return { error: false, result: successResponses };
}

export const useRequestUpdateAccessPolicies = () => {
  const [state, setState] = useState<{
    loading: boolean;
    error?: string;
  }>({ loading: false, error: undefined });

  const request = async ({ policies }: { policies: SetAccessPolicy[] }) => {
    const deploymentId = localStorage.getItem('deploymentId') as string;

    setState({ loading: true, error: undefined });

    const response = await cedalioSdk.setAccessPolicies({
      deploymentId,
      policies
    });

    if (response.ok) {
      setState((prevState) => ({ ...prevState, loading: false }));
    } else {
      setState({ loading: false, error: response.error.message });
    }

    return response;
  };

  return { ...state, request };
};

// Endpoint to get all policies does not exist yet
// For the time being I save the addresses to LocalStorage and request each one separately
export const useGetPoliciesRequest = () => {
  const [state, setState] = useState<{
    loading: boolean;
    error?: string;
    data: { address: string; policy: AccessPolicy }[] | undefined;
  }>({ loading: false, error: undefined, data: undefined });

  const request = useCallback(async () => {
    const deploymentId = localStorage.getItem('deploymentId') as string;
    const addresses: Record<string, boolean> =
      JSON.parse(localStorage.getItem('policyAddresses') || '{}') ?? {};

    setState({ loading: true, error: undefined, data: undefined });

    const requests = Object.keys(addresses)
      .filter(Boolean)
      .map((address) => {
        return cedalioSdk.getAccessPolicyForUser({ deploymentId, address });
      });
    const responses = await Promise.all(requests);
    const errorResponse = responses.find((res) => !res.ok) as ErrorApiResponse | undefined;

    if (errorResponse) {
      setState({ loading: false, error: errorResponse.error.message, data: undefined });
      return errorResponse;
    }

    const successResponses = responses as SuccessApiResponse<AccessPolicy>[];
    const data = successResponses.map((r, index) => ({
      address: Object.keys(addresses)[index],
      policy: r.data
    }));
    setState({ error: undefined, loading: false, data });
    return {
      ok: true,
      status: 200,
      data: successResponses.map((r, index) => ({ address: Object.keys(addresses)[index], policy: r.data }))
    };
  }, []);

  return { ...state, request };
};

// Endpoint to delete user policy does not exist yet so I delete in batch
export const useDeleteUserPolicyRequest = () => {
  const [state, setState] = useState<{
    loading: boolean;
    error?: string;
  }>({ loading: false, error: undefined });

  const request = async ({ addresses }: { addresses: string[] }) => {
    const deploymentId = localStorage.getItem('deploymentId') as string;

    setState({ loading: true, error: undefined });

    const requests = addresses.map((address) => {
      return () => cedalioSdk.resetAccessPolicyForUser({ deploymentId, address });
    });

    const { error, result } = await chainPromises(requests);

    if (error) {
      setState({ loading: false, error: result.error.message });
      return result;
    }

    setState({ error: undefined, loading: false });
    return {
      ok: true,
      status: 204
    };
  };

  return { ...state, request };
};

export const getAddressesWithDeletedPolicies = ({
  databasePolicies,
  formPolicies
}: {
  databasePolicies: {
    address: string;
    policy: AccessPolicy;
  }[];
  formPolicies: SetAccessPolicy[];
}) => {
  return databasePolicies.reduce<string[]>((result, policy) => {
    if (!formPolicies.find((formPolicy) => formPolicy.address === policy.address)) {
      result.push(policy.address);
    }
    return result;
  }, []);
};

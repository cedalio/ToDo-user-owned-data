import { useEffect, useMemo } from 'react';
import Button from '../../../shared/Button';
import { useForm, FormProvider } from 'react-hook-form';

import styles from './styles.module.css';
import { FormPolicy, useGetPoliciesRequest, useRequestSetAccessControl } from './utils';
import PolicyFormArray from './PolicyFormArray';
import Spinner from '../../../shared/Spinner';

function AccessPolicyForm() {
  const { request: getPoliciesRequest, data, loading: getPoliciesLoading } = useGetPoliciesRequest();

  const defaultPolicies = useMemo(
    () =>
      data?.map((userPolicy) => ({
        policyType: userPolicy.policy.policyType,
        address: userPolicy.address,
        accessRules: userPolicy.policy.policyType === 'ALLOW_FULL_ACCESS' ? [] : userPolicy.policy.accessRules
      })) ?? [
        {
          policyType: 'ALLOW_FULL_ACCESS' as const,
          address: '',
          accessRules: []
        }
      ],
    [data]
  );

  const methods = useForm<{ policies: FormPolicy[] }>({
    defaultValues: {
      policies: defaultPolicies
    }
  });

  useEffect(() => {
    getPoliciesRequest();
  }, [getPoliciesRequest]);

  useEffect(() => {
    methods.reset({ policies: defaultPolicies });
  }, [methods, defaultPolicies]);

  const { request: updatePoliciesRequest, loading, error } = useRequestSetAccessControl();

  const onSubmit = async ({ policies }: { policies: FormPolicy[] }) => {
    const response = await updatePoliciesRequest({ policies });
    if (response.ok) {
      const addressesMap = policies.reduce<Record<string, boolean>>((acc, policy) => {
        acc[policy.address] = true;
        return acc;
      }, {});

      // Temporary until there's an endpoint to get policies for all addresses
      const currentAddressesWithPolicies = JSON.parse(localStorage.getItem('policyAddresses') || '{}') ?? {};
      localStorage.setItem(
        'policyAddresses',
        JSON.stringify({ ...currentAddressesWithPolicies, ...addressesMap })
      );
    }

    // Update policies
    getPoliciesRequest();
  };

  if (getPoliciesLoading) {
    return <Spinner size="50px" className={styles.spinner} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.explanation}>
        <p>
          Policies define permissions for an address to certain Object Fields. There are two Policy Types:{' '}
          <strong>ALLOW_FULL_ACCESS</strong> and <strong>FIELD_BASED</strong>.
        </p>
        <ul className={styles.permissionItems}>
          <li>
            <strong>ALLOW_FULL_ACCESS</strong>: The address has full access to all schema Object Fields.
          </li>
          <li>
            <strong>FIELD_BASED</strong>: The address will have specific permissions for the defined Objects
            and Object Fields
          </li>
        </ul>
      </div>
      <FormProvider {...methods}>
        <form className={styles.setPolicyContainer} onSubmit={methods.handleSubmit(onSubmit)}>
          <PolicyFormArray />
          <Button type="submit" loading={loading || getPoliciesLoading}>
            Update Policies
          </Button>
          {error && <div className={styles.requestError}>{error}</div>}
        </form>
      </FormProvider>
    </div>
  );
}

export default AccessPolicyForm;

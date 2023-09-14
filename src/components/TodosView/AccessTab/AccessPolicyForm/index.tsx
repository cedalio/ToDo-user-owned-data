import { useEffect, useMemo, useState } from 'react';
import Button from '../../../shared/Button';
import { useForm, FormProvider } from 'react-hook-form';

import styles from './styles.module.css';
import {
  FormPolicy,
  getAddressesWithDeletedPolicies,
  useDeleteUserPolicyRequest,
  useGetPoliciesRequest,
  useRequestUpdateAccessPolicies
} from './utils';
import PolicyFormArray from './PolicyFormArray';
import Spinner from '../../../shared/Spinner';
import DeletePolicyDialog from './DeletePolicyModal';

function AccessPolicyForm() {
  const [deletedAddresses, setDeletedAddresses] = useState<string[]>([]);
  const { request: getPoliciesRequest, data, loading: getPoliciesLoading } = useGetPoliciesRequest();
  const { request: deletePoliciesRequest, loading: deletePoliciesLoading } = useDeleteUserPolicyRequest();

  const defaultPolicies = useMemo(
    () =>
      (data &&
        data.length > 0 &&
        data.map((userPolicy) => ({
          policyType: userPolicy.policy.policyType,
          address: userPolicy.address,
          accessRules:
            userPolicy.policy.policyType === 'ALLOW_FULL_ACCESS' ? [] : userPolicy.policy.accessRules
        }))) || [
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

  const { request: updatePoliciesRequest, loading, error } = useRequestUpdateAccessPolicies();

  const onSubmit = ({ policies }: { policies: FormPolicy[] }) => {
    const addressesToRemove = getAddressesWithDeletedPolicies({
      formPolicies: policies,
      databasePolicies: data ?? []
    });
    if (addressesToRemove.length > 0) {
      setDeletedAddresses(addressesToRemove);
    } else {
      onUpdatePolicies({ policies });
    }
  };

  const onConfirmDeletePolicies = async () => {
    const formValues = methods.getValues();
    const addresses = deletedAddresses;
    setDeletedAddresses([]);
    await deletePoliciesRequest({ addresses });

    const currentAddressesWithPolicies: Record<string, boolean> =
      JSON.parse(localStorage.getItem('policyAddresses') || '{}') ?? {};
    for (const address of addresses) {
      delete currentAddressesWithPolicies[address];
    }
    localStorage.setItem('policyAddresses', JSON.stringify(currentAddressesWithPolicies));

    onUpdatePolicies(formValues);
  };

  const onCancelDeletePolicies = () => setDeletedAddresses([]);

  const onUpdatePolicies = async ({ policies }: { policies: FormPolicy[] }) => {
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

      // Update policies
      getPoliciesRequest();
    }
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
      <DeletePolicyDialog
        addressesToDelete={deletedAddresses}
        onConfirm={onConfirmDeletePolicies}
        onCancel={onCancelDeletePolicies}
      />
      <FormProvider {...methods}>
        <form className={styles.setPolicyContainer} onSubmit={methods.handleSubmit(onSubmit)}>
          <PolicyFormArray />
          {methods.formState.isDirty && (
            <Button type="submit" loading={loading || getPoliciesLoading || deletePoliciesLoading}>
              Update Policies
            </Button>
          )}
          {error && <div className={styles.requestError}>{error}</div>}
        </form>
      </FormProvider>
    </div>
  );
}

export default AccessPolicyForm;

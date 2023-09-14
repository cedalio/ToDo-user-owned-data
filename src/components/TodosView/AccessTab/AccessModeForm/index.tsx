import styles from './styles.module.css';

import { useForm } from 'react-hook-form';
import { useController } from 'react-hook-form';
import Button from '../../../shared/Button';
import Select from '../../../shared/Select';
import { useEffect } from 'react';
import { AccessMode } from '@cedalio/sdk-js';
import Spinner from '../../../shared/Spinner';
import { useGetAccessMode, useUpdateAccessMode } from './utils';

const ACCESS_MODES = ['PUBLIC', 'PUBLIC_READ', 'PRIVATE'];

function AccessModeForm() {
  const { handleSubmit, control, watch, reset } = useForm<{ accessMode: AccessMode }>({
    defaultValues: {
      accessMode: 'PRIVATE'
    }
  });

  const {
    field: { ref, ...selectField }
  } = useController({ name: 'accessMode', control });

  const { request: getAccessModeRequest, data, loading: getAccessModeLoading } = useGetAccessMode();
  const { request: updateAccessModeRequest, loading: updateAccessModeLoading, error } = useUpdateAccessMode();

  useEffect(() => {
    getAccessModeRequest();
  }, [getAccessModeRequest]);

  useEffect(() => {
    if (data?.accessMode) {
      reset({ accessMode: data?.accessMode });
    }
  }, [reset, data?.accessMode]);

  const onSubmit = async ({ accessMode }: { accessMode: AccessMode }) => {
    await updateAccessModeRequest(accessMode);
    getAccessModeRequest();
  };

  const accessMode = watch('accessMode');
  const currentAccessMode = data?.accessMode;

  return (
    <div className={styles.container}>
      <div className={styles.explanation}>
        <p>The deployment's Access Mode are permission presets for all users. These presets are:</p>
        <ul className={styles.permissionItems}>
          <li>
            <strong>PUBLIC</strong>: Allows all users that have the deployment's URL to write, read, create,
            and delete entities.
          </li>
          <li>
            <strong>PUBLIC_READ</strong>: Only allows non owner addresses that have the deployment's URL to
            read entities.
          </li>
          <li>
            <strong>PRIVATE</strong>: Only the owner can write, read, create, or delete entities.
          </li>
        </ul>
      </div>
      {getAccessModeLoading && <Spinner size="50px" className={styles.spinner} />}
      {!getAccessModeLoading && (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <Select
            options={ACCESS_MODES}
            getValue={(v) => v}
            label="Access Mode"
            {...selectField}
            disabled={updateAccessModeLoading}
          />
          <Button
            type="submit"
            loading={updateAccessModeLoading || getAccessModeLoading}
            disabled={accessMode === currentAccessMode}
          >
            Update Access Mode
          </Button>
          {error && <div className={styles.requestError}>{error}</div>}
        </form>
      )}
    </div>
  );
}

export default AccessModeForm;

import { useFieldArray, Controller, useFormContext } from 'react-hook-form';
import Select from '../../../../shared/Select';
import TextField from '@mui/material/TextField';

import styles from './style.module.css';
import { FormPolicy } from '../utils';
import RuleFormFieldArray from '../RuleFormFieldArray';
import FormFieldButtons from '../../../../shared/FormFieldButtons';
import Button from '../../../../shared/Button';

const POLICY_TYPES = ['ALLOW_FULL_ACCESS', 'FIELD_BASED'];

function PolicyFormArray() {
  const {
    control,
    formState: { errors }
  } = useFormContext<{ policies: FormPolicy[] }>();
  const { fields, append, remove } = useFieldArray({
    name: 'policies'
  });

  const onAdd = () =>
    append({
      policyType: 'ALLOW_FULL_ACCESS',
      address: ''
    });
  const onRemove = (index: number) => remove(index);

  return (
    <div className={styles.container}>
      {!fields.length && <Button onClick={onAdd}>Add Policy</Button>}
      {fields.map((field, index) => (
        <div key={field.id} className={styles.policyContainer}>
          <div className={styles.titleContainer}>
            <h2 className={styles.policyTitle}>Policy {index + 1}</h2>
            <FormFieldButtons
              count={fields.length}
              fieldIndex={index}
              onAdd={onAdd}
              onRemove={onRemove}
              allowEmpty
            />
          </div>
          <div className={styles.firstRow}>
            <Controller
              render={({ field: { ref, ...selectField } }) => (
                <Select
                  options={POLICY_TYPES}
                  label="Policy Type"
                  getValue={(v) => v}
                  {...selectField}
                  className={styles.policyType}
                />
              )}
              name={`policies.${index}.policyType`}
              control={control}
            />

            <Controller
              rules={{ pattern: /^0x[a-fA-F0-9]{40}$/g, required: 'Required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Address"
                  className={styles.address}
                  error={!!errors.policies?.[index]?.address}
                  helperText={errors.policies?.[index]?.address?.message}
                />
              )}
              name={`policies.${index}.address`}
              control={control}
            />
          </div>
          <RuleFormFieldArray policyIndex={index} />
        </div>
      ))}
    </div>
  );
}

export default PolicyFormArray;

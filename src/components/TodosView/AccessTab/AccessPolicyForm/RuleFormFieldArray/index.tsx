import { useFieldArray, Controller, useFormContext } from 'react-hook-form';
import Select from '../../../../shared/Select';
import { FormPolicy, OBJECT_TYPE_FIELDS } from '../utils';
import { useEffect, useMemo } from 'react';
import FieldFormFieldArray from '../FieldFormFieldArray';

import styles from './styles.module.css';
import FormFieldButtons from '../../../../shared/FormFieldButtons';

interface Props {
  policyIndex: number;
}

function RuleFormFieldArray({ policyIndex }: Props) {
  const fieldNamePrefix = `policies.${policyIndex}.accessRules` as const;
  const objectTypes = useMemo(() => Object.keys(OBJECT_TYPE_FIELDS), []);

  const { control, watch } = useFormContext<{ policies: FormPolicy[] }>();
  const {
    fields: accessRules,
    remove,
    append
  } = useFieldArray<{ policies: FormPolicy[] }>({
    name: fieldNamePrefix
  });

  // Only show Access Rules if policy type is FIELD_BASED
  const policyType = watch(`policies.${policyIndex}.policyType`);
  useEffect(() => {
    if (policyType === 'FIELD_BASED' && accessRules.length === 0) {
      append({
        objectTypeName: Object.keys(OBJECT_TYPE_FIELDS)[0],
        fields: [{ fieldName: 'id', read: false, write: false }]
      });
    }
    if (policyType === 'ALLOW_FULL_ACCESS') {
      remove();
    }
  }, [accessRules.length, policyType, append, remove]);

  const onAdd = () =>
    append({
      objectTypeName: Object.keys(OBJECT_TYPE_FIELDS)[0],
      fields: [{ fieldName: 'id', read: false, write: false }]
    });
  const onRemove = (index: number) => remove(index);

  if (policyType !== 'FIELD_BASED') {
    return null;
  }

  return (
    <div className={styles.container}>
      {accessRules.map((field, index) => (
        <div key={field.id} className={styles.ruleContainer}>
          <div className={styles.objectTypeContainer}>
            <Controller
              render={({ field: { ref, ...selectField } }) => (
                <Select
                  options={objectTypes}
                  label="Object Type Name"
                  getValue={(v) => v}
                  {...selectField}
                  className={styles.objectTypeName}
                />
              )}
              name={`${fieldNamePrefix}.${index}.objectTypeName`}
              control={control}
            />
            <FormFieldButtons
              count={accessRules.length}
              fieldIndex={index}
              onAdd={onAdd}
              onRemove={onRemove}
              max={objectTypes.length}
            />
          </div>

          <FieldFormFieldArray policyIndex={policyIndex} ruleIndex={index} />
        </div>
      ))}
    </div>
  );
}

export default RuleFormFieldArray;

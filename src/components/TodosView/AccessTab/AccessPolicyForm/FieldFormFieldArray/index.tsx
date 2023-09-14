import { useFieldArray, Controller, useFormContext } from 'react-hook-form';
import Select from '../../../../shared/Select';
import Checkbox from '../../../../shared/Checkbox';

import styles from './styles.module.css';
import { FormPolicy, OBJECT_TYPE_FIELDS } from '../utils';
import FormFieldButtons from '../../../../shared/FormFieldButtons';

interface Props {
  policyIndex: number;
  ruleIndex: number;
  loading: boolean;
}

function FieldFormFieldArray({ policyIndex, ruleIndex, loading }: Props) {
  const fieldNamePrefix = `policies.${policyIndex}.accessRules.${ruleIndex}` as const;

  const { watch, control, getValues } = useFormContext<{ policies: FormPolicy[] }>();
  const {
    fields: accessRulesFields,
    append,
    remove
  } = useFieldArray<{ policies: FormPolicy[] }>({
    name: `${fieldNamePrefix}.fields`
  });

  const objectType = watch(`${fieldNamePrefix}.objectTypeName`);

  const getUnusedFieldNames = () => {
    const accessRuleValue = getValues(fieldNamePrefix);
    const allFieldNames = OBJECT_TYPE_FIELDS[objectType];
    return allFieldNames.filter(
      (fieldName) => !accessRuleValue.fields.find((f) => f.fieldName === fieldName)
    );
  };

  const onAdd = () => {
    const nextUnusedFieldName = getUnusedFieldNames()?.[0];

    if (nextUnusedFieldName) {
      append({ fieldName: nextUnusedFieldName, read: false, write: false });
    }
  };

  const onRemove = (index: number) => {
    remove(index);
  };

  // Select options will show the currently selected value and the unselected values to avoid repetition
  const getFieldOptions = (field: { value: string }) => {
    const unusedFieldNames = getUnusedFieldNames();
    return [field.value, ...unusedFieldNames];
  };

  return (
    <div className={styles.container}>
      {accessRulesFields.map((field, index) => (
        <div key={field.id} className={styles.fieldContainer}>
          <Controller
            render={({ field: { ref, ...selectField } }) => (
              <Select
                options={getFieldOptions(selectField)}
                label="Field Name"
                getValue={(v) => v}
                {...selectField}
                disabled={loading}
              />
            )}
            name={`${fieldNamePrefix}.fields.${index}.fieldName`}
            control={control}
          />
          <div className={styles.checkboxContainer}>
            <Controller
              render={({ field: { ref, value, ...checkboxField } }) => (
                <Checkbox label="Read" {...checkboxField} inputRef={ref} checked={value} disabled={loading} />
              )}
              name={`${fieldNamePrefix}.fields.${index}.read`}
              control={control}
            />
            <Controller
              render={({ field: { ref, value, ...checkboxField } }) => (
                <Checkbox
                  label="Write"
                  {...checkboxField}
                  inputRef={ref}
                  checked={value}
                  disabled={loading}
                />
              )}
              name={`${fieldNamePrefix}.fields.${index}.write`}
              control={control}
            />
          </div>
          <FormFieldButtons
            count={accessRulesFields.length}
            fieldIndex={index}
            onAdd={onAdd}
            onRemove={onRemove}
            max={OBJECT_TYPE_FIELDS[objectType].length}
            disabled={loading}
          />
        </div>
      ))}
    </div>
  );
}

export default FieldFormFieldArray;

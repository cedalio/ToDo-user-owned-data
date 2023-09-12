import TextField, { TextFieldProps } from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import styles from './styles.module.css';

type Props<T> = TextFieldProps & {
  options: T[];
  getValue: (option: T) => string;
};

function Select<T>({ id, options, getValue, inputRef, ...selectProps }: Props<T>) {
  return (
    <TextField className={styles.ruleFieldContainer} {...selectProps} select>
      {options.map((option) => {
        const value = getValue(option);
        return (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        );
      })}
    </TextField>
  );
}

export default Select;

import FormControlLabel from '@mui/material/FormControlLabel';
import MuiCheckbox from '@mui/material/Checkbox';

import styles from './styles.module.css';
import { ComponentProps } from 'react';

interface Props extends ComponentProps<typeof MuiCheckbox> {
  label: string;
}

function Checkbox({ label, ...checkboxProps }: Props) {
  return (
    <FormControlLabel
      className={styles.checkboxLabel}
      control={<MuiCheckbox size="small" className={styles.checkbox} {...checkboxProps} />}
      label={label}
    />
  );
}

export default Checkbox;

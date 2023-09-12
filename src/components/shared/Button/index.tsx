import { ComponentProps } from 'react';
import MuiButton from '@mui/material/Button';

import styles from './styles.module.css';
import Spinner from '../Spinner';

interface Props extends ComponentProps<typeof MuiButton> {
  loading?: boolean;
}

function Button({ loading, children, ...buttonProps }: Props) {
  return (
    <MuiButton variant="outlined" {...buttonProps} className={styles.submitButton}>
      {loading ? <Spinner className={styles.spinner} size="20px" /> : children}
    </MuiButton>
  );
}

export default Button;

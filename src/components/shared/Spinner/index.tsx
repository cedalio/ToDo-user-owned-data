import { CircularProgress, CircularProgressProps } from '@mui/material';

import styles from './styles.module.css';
import cn from 'classnames';

function Spinner({ className, size = '20px', ...props }: CircularProgressProps) {
  return <CircularProgress className={cn(styles.spinner, className)} size={size} {...props} />;
}

export default Spinner;

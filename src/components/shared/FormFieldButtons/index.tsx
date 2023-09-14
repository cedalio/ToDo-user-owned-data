import IconButton from '@mui/material/IconButton';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';

import styles from './styles.module.css';

interface Props {
  count: number;
  fieldIndex: number;
  max?: number;
  onAdd: () => void;
  onRemove: (index: number) => void;
  allowEmpty?: boolean;
  disabled?: boolean;
}

function FormFieldButtons({ count, fieldIndex, max, onAdd, onRemove, allowEmpty, disabled }: Props) {
  return (
    <div className={styles.actionButtons}>
      {fieldIndex === count - 1 && (
        <IconButton
          aria-label="Add"
          onClick={onAdd}
          className={styles.addButton}
          disabled={disabled || (!!max && fieldIndex >= max - 1)}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      )}
      {(allowEmpty || fieldIndex !== 0 || count > 1) && (
        <IconButton
          disabled={disabled}
          aria-label="Remove"
          onClick={() => onRemove(fieldIndex)}
          className={styles.removeButton}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
      )}
    </div>
  );
}

export default FormFieldButtons;

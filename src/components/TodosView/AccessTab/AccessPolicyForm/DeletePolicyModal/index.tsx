import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface Props {
  addressesToDelete: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

function DeletePolicyDialog({ addressesToDelete, onConfirm, onCancel }: Props) {
  return (
    <div>
      <Dialog
        open={addressesToDelete.length > 0}
        aria-labelledby="delete-policies-title"
        aria-describedby="delete-policies-description"
      >
        <DialogTitle id="delete-policies-title">Delete Access Policy</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-policies-description">
            The following addresses will have their Access Policy removed:
            <ul>
              {addressesToDelete.map((address) => (
                <li>{address}</li>
              ))}
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default DeletePolicyDialog;

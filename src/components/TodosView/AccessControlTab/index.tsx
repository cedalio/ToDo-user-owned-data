import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { cedalioSdk } from '../../../utils/sdk';
import { useMemo, useState } from 'react';
import { AccessRules } from '@cedalio/sdk-js/dist/utils/RestApi/sdkApiTypes';

import styles from './styles.module.css';
import cn from 'classnames';

interface RuleField {
  fieldName: string;
  read: boolean;
  write: boolean;
}

const ACCESS_CONTROL_VALUES = ['PRIVATE', 'PUBLIC', 'PUBLIC_READ', 'ALLOW_FULL_ACCESS', 'RULE_BASED'];

const FIELDS_NAMES = ['id', 'title', 'description'];

const OBJECT_TYPE = 'Todo';

const useRequestSetAccessControl = () => {
  const [state, setState] = useState<{
    loading: boolean;
    error?: string;
  }>({ loading: false, error: undefined });

  const request = async ({ deploymentId, rules }: { deploymentId: string; rules: AccessRules[] }) => {
    if (!rules.length) {
      setState({
        ...state,
        loading: false,
        error: 'Please select a valid rule'
      });
      return;
    }
    setState({ loading: true, error: undefined });
    const response = await cedalioSdk.setAccessRules({
      deploymentId,
      rules
    });
    if (response.ok) {
      setState((prevState) => ({
        ...prevState,
        loading: false
      }));
    } else {
      setState({
        loading: false,
        error: response.error.message
      });
    }
  };

  return { ...state, request };
};

// For simplicity, this form only adds one access control rule at a time
// But you can add N access control rules at the same time.
function AccessControlTab() {
  const [accessControl, setAccessControl] = useState('');
  const [address, setAddress] = useState<string>('');
  const [ruleFields, setRuleFields] = useState<Record<string, RuleField>>({
    '0': {
      fieldName: 'id',
      read: false,
      write: false
    }
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const { loading, error, request } = useRequestSetAccessControl();

  const handleSetAccessRule = async () => {
    const deploymentId = localStorage.getItem('deploymentId');
    if (!deploymentId) {
      return;
    }

    let rule: AccessRules | undefined;

    switch (accessControl) {
      case 'RULE_BASED': {
        rule = {
          accessControl,
          address,
          accessRules: [{ objectTypeName: OBJECT_TYPE, fields: Object.values(ruleFields) }]
        };
        break;
      }
      case 'ALLOW_FULL_ACCESS': {
        rule = {
          accessControl,
          address
        };
        break;
      }
      case 'PRIVATE':
      case 'PUBLIC':
      case 'PUBLIC_READ': {
        rule = { accessControl };
        break;
      }
      default: {
        rule = undefined;
      }
    }
    request({ deploymentId, rules: rule ? [rule] : [] });
  };

  const handleChangeAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(e.target.value);
    if (!!newAddress.length && !/^0x[a-fA-F0-9]{40}$/g.test(newAddress)) {
      setFieldErrors({ ...fieldErrors, address: 'Invalid address' });
    } else {
      setFieldErrors({ ...fieldErrors, address: undefined });
    }
  };

  const handleAddRuleField = () => {
    const lastRuleId = Object.keys(ruleFields).at(-1) ?? '0';
    const newRuleId = String(parseInt(lastRuleId, 10) + 1);
    setRuleFields({
      ...ruleFields,
      [newRuleId]: {
        fieldName: 'id',
        read: false,
        write: false
      }
    });
  };

  const handleRemoveRuleField = (id: string) => {
    const newRuleFields = { ...ruleFields };
    delete newRuleFields[id];
    setRuleFields(newRuleFields);
  };

  const handleChangeFieldName = (index: string, value: string) => {
    setRuleFields({ ...ruleFields, [index]: { ...ruleFields[index], fieldName: value } });
  };

  const handleChangeRead = (index: string, value: boolean) => {
    setRuleFields({ ...ruleFields, [index]: { ...ruleFields[index], read: value } });
  };

  const handleChangeWrite = (index: string, value: boolean) => {
    setRuleFields({ ...ruleFields, [index]: { ...ruleFields[index], write: value } });
  };

  const hasFieldErrors = useMemo(() => {
    const fieldErrorValues = Object.values(fieldErrors);
    return fieldErrorValues.reduce((result, value) => {
      return result || !!value;
    }, false);
  }, [fieldErrors]);
  const disableSubmit =
    (accessControl === 'RULE_BASED' || accessControl === 'ALLOW_FULL_ACCESS') && (!address || hasFieldErrors);
  const hasAddress = accessControl === 'ALLOW_FULL_ACCESS' || accessControl === 'RULE_BASED';

  return (
    <div className={styles.container}>
      <div className={styles.explanation}>
        <p>
          There are three types of permissions: <strong>global, per-user and field-level</strong>.
        </p>
        <ul className={styles.permissionItems}>
          <li>
            <strong>Global</strong>: The permission will be applied to all users. Its access control value can
            be <i>PUBLIC, PUBLIC_READ or PRIVATE</i>.
          </li>
          <li>
            <strong>Per-user</strong>: The permission will be applied to a specific user. Its access control
            value is <i>ALLOW_FULL_ACCESS</i>
          </li>
          <li>
            <strong>Field-level</strong>: The permission will be applied to a specific user and for specific
            database models and fields. Its access control value is <i>RULE_BASED</i>
          </li>
        </ul>
      </div>
      <div className={styles.accessControlRow}>
        <FormControl className={cn(styles.accessControlField, { [styles.noAddress]: !hasAddress })}>
          <InputLabel id="accessControl">Access control</InputLabel>
          <Select
            labelId="accessControl"
            id="accessControl"
            value={accessControl}
            label="Access Control"
            defaultValue={accessControl}
            onChange={(e) => setAccessControl(e.target.value)}
          >
            {ACCESS_CONTROL_VALUES.map((value) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {hasAddress && (
          <TextField
            id="address"
            label="Address"
            value={address}
            onChange={handleChangeAddress}
            className={styles.addressInput}
            error={!!fieldErrors.address}
            helperText={fieldErrors.address}
          />
        )}
      </div>

      {accessControl === 'RULE_BASED' &&
        Object.entries(ruleFields).map(([id, ruleField]) => (
          <div key={id} className={styles.ruleRow}>
            <div className={styles.leftRuleContainer}>
              <div className={styles.ruleContainer}>
                <FormControl className={cn(styles.ruleFieldContainer, { [styles.noAddress]: !hasAddress })}>
                  <InputLabel id={`fieldName${id}`}>Field</InputLabel>
                  <Select
                    labelId={`fieldName${id}`}
                    id={`fieldName${id}`}
                    value={ruleField.fieldName}
                    label="Rule Field"
                    defaultValue={ruleField.fieldName}
                    onChange={(e) => handleChangeFieldName(id, e.target.value)}
                  >
                    {FIELDS_NAMES.map((value) => (
                      <MenuItem key={value} value={value}>
                        {value}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <div className={styles.checkboxContainer}>
                  <FormControlLabel
                    className={styles.checkboxLabel}
                    control={
                      <Checkbox
                        id={`read${id}`}
                        onChange={(e) => handleChangeRead(id, e.target.value === 'on')}
                        size="small"
                        className={styles.checkbox}
                      />
                    }
                    label="Read"
                  />
                  <FormControlLabel
                    className={styles.checkboxLabel}
                    control={
                      <Checkbox
                        id={`read${id}`}
                        onChange={(e) => handleChangeWrite(id, e.target.value === 'on')}
                        size="small"
                        className={styles.checkbox}
                      />
                    }
                    label="Write"
                  />
                </div>
              </div>
            </div>
            <div className={styles.actionButtons}>
              <IconButton aria-label="Add" onClick={() => handleAddRuleField()} className={styles.addButton}>
                <AddIcon fontSize="small" />
              </IconButton>

              {id !== '0' && (
                <IconButton
                  aria-label="Remove"
                  onClick={() => handleRemoveRuleField(id)}
                  className={styles.removeButton}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
              )}
            </div>
          </div>
        ))}
      <Button
        onClick={handleSetAccessRule}
        disabled={disableSubmit}
        variant="outlined"
        className={styles.submitButton}
      >
        {loading ? <CircularProgress size="20px" className={styles.spinner} /> : 'Create Access Rule'}
      </Button>
      {error && <div className={styles.requestError}>{error}</div>}
    </div>
  );
}

export default AccessControlTab;

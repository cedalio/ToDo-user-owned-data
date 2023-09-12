import styles from './styles.module.css';
import AccessModeForm from './AccessModeForm';
import AccessPolicyForm from './AccessPolicyForm';

function AccessTab() {
  return (
    <div className={styles.container}>
      <AccessModeForm />
      <AccessPolicyForm />
    </div>
  );
}

export default AccessTab;

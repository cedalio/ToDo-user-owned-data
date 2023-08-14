import { Web3Button } from '@web3modal/react';

import styles from './styles.module.css';

function Login() {
  return (
    <div className={styles.container}>
      <div className="button-container">
        <Web3Button />
      </div>
      <div className="web">
        <img className="gif" src="home-gif.gif" alt="explained gif" />
      </div>
    </div>
  );
}

export default Login;

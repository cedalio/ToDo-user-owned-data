import { Web3Button } from '@web3modal/react';

interface Props {
  isLoggedIn: boolean;
}

export default function Header({ isLoggedIn }: Props) {
  return (
    <div className="App-header">
      <h1 className="title">Daily Todo</h1>
      <div className="powered-by">
        Powered By <img src="cedalio-icon.png" alt="" />
      </div>
      {isLoggedIn && (
        <div className={`button-container connected`}>
          <Web3Button />
        </div>
      )}
    </div>
  );
}

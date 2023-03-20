import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { HttpLink } from '@apollo/client';
import { PrivyProvider } from '@privy-io/react-auth';

const link = new HttpLink({
  uri: String(process.env.REACT_APP_GRAPHQL_URL),
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  }
});
const client = new ApolloClient({
  link: link,
  cache: new InMemoryCache({
    addTypename: false,
  }),
});
const privyAppId = String(process.env.REACT_APP_PRIVY_APP_ID)
const handleLogin = async (e: any) => {
  console.log(e)
}
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <PrivyProvider appId={privyAppId} onSuccess={handleLogin}>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </PrivyProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

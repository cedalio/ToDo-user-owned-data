# Cedalio ⨯ To-Do dApp Multi-Database Example

[Join our Discord Community](https://discord.gg/kSdhmb9UUT)

</br>

## Getting Started

Step 1: Go to our [studio](https://studio.cedalio.com) and follow these steps:

A. Create a project with the "todo" schema from the Cedalio Template Library.

B. Deploy the schema.

C. Copy the Project ID and set it as `REACT_APP_CEDALIO_PROJECT_ID` in the `.env.development` file.

Step 2: Create a `.env.development` file with the following variables:

```
REACT_APP_WC_PROJECT_ID=WALLET-CONNECT-ID
GENERATE_SOURCEMAP=false
REACT_APP_NET_SCAN_BASE=https://mumbai.polygonscan.com/address/ (or your selected network scan)
REACT_APP_CEDALIO_PROJECT_ID= the project id you get from the studio
```


Step 3: Run `npm start`

**Note**: We are using our gateway to deploy and interact with the blockchain using GraphQL.

## Learn More About Cedalio

To learn more about Cedalio, take a look at the following resources:

- [Cedalio](https://cedalio.com/) - Learn about Cedalio Features and Roadmap.

- [Cedalio Docs](https://docs.cedalio.com/) - Learn about Cedalio Architecture and CLI.

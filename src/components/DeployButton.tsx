import axios from "axios";

export default function DeployButton() {
    function requestDeployToGateway() {
        const url = `${process.env.REACT_APP_GRAPHQL_GATEWAY_BASE_URL}/deploy`
        const payload = {
            email: "example.com",
            schema: `type Todo {
                id: UUID!
                title: String!
                description: String
                priority: Int!
                owner: String!
                tags: [String!]
                status: String
              }
              
              `,
            schema_owner: "0x335cbdd25276f29f5d85db13390253a8f201ac48",
            network: "polygon:mumbai"
        }
        axios.post(
            url, payload
        ).then(function (response: any) {
            localStorage.setItem('deploymentId', response.data.deployment_id);
            localStorage.setItem('contractAddress', response.data.contract_address);
        })
            .catch(function (error: any) {
                console.log(error);
            })
    }

    return (
        <button>
            DEPLOY YOUR SCHEMA
        </button>

    )
}
export default function Footer(props:{ contractAddress: string | undefined}) {
    const contractUrl = `${String(process.env.REACT_APP_NET_SCAN_BASE)}${props.contractAddress}`
    return (
        <footer>
            <div className="App-footer">
                <div className="line">
                </div>
                <div className="texts">
                    <p>This is a example ToDo app that show the power of Cedalio's technology. This is only a demo app using a Testnet. <strong>All the information here is stored in a smart contract</strong>. If you want to learn more please clic here. Or if you have some feedback please feel free to reach out us!</p>
                    {props.contractAddress ?
                        <div className="address">
                            <p>Smart Contract Address:  <a href={contractUrl} target='_blank' rel="noreferrer">0xdd86a634c8448e2c60984d7b74e42017293b8caf</a></p>
                            <img src="polygon.png" alt="polygon icon" />
                        </div>
                    : null}
                </div>
                <div className="branding">
                    <div className="logo">
                        <img src="favicon-32x32.png" alt="cedalio" />
                        <h4>DECENTRALIZED
                            TODO DAPP</h4>
                    </div>
                    <div className="rights">
                        <img src="cedalio-icon.png" alt="cedalio" /> 2023 All Rights Reserved.
                    </div>
                    <div className="social">
                        <a href="https://discord.gg/kSdhmb9UUT" target='_blank' rel="noreferrer"><img src="discord.png" alt="discord" /></a>
                        <a href="https://github.com/cedalio" target='_blank' rel="noreferrer"><img src="github.png" alt="github" /></a>
                        <a href="https://www.linkedin.com/company/cedalio" target='_blank' rel="noreferrer"><img src="linkedin.png" alt="linkedin" /></a>
                        <a href="https://medium.com/@cedalio" target='_blank' rel="noreferrer"><img src="medium.png" alt="medium" /></a>
                        <a href="https://twitter.com/CedalioTech" target='_blank' rel="noreferrer"><img src="twitter.png" alt="twitter" /></a>
                        <a href="https://www.youtube.com/channel/UCvhpGZRV9O4tydT3A53CmiQ/featured" target='_blank' rel="noreferrer"><img src="youtube.png" alt="youtube" /></a>
                    </div>
                </div>
            </div>
        </footer>

    )
}
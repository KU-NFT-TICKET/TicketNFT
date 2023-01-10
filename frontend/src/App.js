import './App.css'

import React from 'react'
import { ethers } from 'ethers'
import {
  Route,
  NavLink,
  HashRouter,
  Routes,
  useParams
} from "react-router-dom";

import Home from "./js/Home";
import Create from "./js/Create";
import Detail from "./js/Detail";

// Import App components
import { OnboardingButton } from './components/Onboarding'

// Import contract address and artifact
// import ArtifactAccount from './contracts/Account.json'
// import ArtifactEvent from './contracts/Event.json'
// import contractTicketPlace from './contracts/TicketMaketPlace.json'
// import addressContract from './contracts/addressContract';

class App extends React.Component {
  constructor() {
    super()

    this.state = {
      isConnected: false,
      contractMaket: null,
      contractAccount: null, 
      contractEvent: null,
    }

    this.onConnected = this.onConnected.bind(this)
    // this.isExistAccount = this.isExistAccount.bind(this)
  
  }

  componentWillUnmount() {
    if (this.state.messageInterval) {
      clearInterval(this.state.messageInterval)
    }
  }

  async onConnected() {
    // Use the MetaMask wallet as ethers provider
    // const provider = new ethers.providers.Web3Provider(window.ethereum)
    // await provider.send("eth_requestAccounts", []);

    // const contractMaket = new ethers.Contract(
    //   addressContract.market,
    //   contractTicketPlace.output.abi,
    //   provider.getSigner(),
    // )
    // console.log(await contractMaket.name())

    // const contractAccount = new ethers.Contract(
    //   addressContract.account,
    //   ArtifactAccount.output.abi,
    //   provider.getSigner(),
    // )
    // console.log(await contractAccount.isExistAccount())

    // const contractEvent = new ethers.Contract(
    //   addressContract.event,
    //   ArtifactEvent.output.abi,
    //   provider.getSigner(),
    // )
    // // console.log(await contractEvent.ListAllEvents())

    this.setState({
      isConnected: true,
      // contractMaket: contractMaket,
      // contractAccount: contractAccount, 
      // contractEvent: contractEvent,
      // Start fetching the contract's message every 30 seconds
      // messageInterval: setInterval(this.fetchMessage, 30000)
    })
    // console.log("in")
    // await this.isExistAccount()

  }

  
  // async isExistAccount () {
  //   // console.log(this.state.contractAccount)
  //   var isexist = await this.state.contractAccount.isExistAccount()
  //   console.log('contract Account: isExistAccount '+isexist)
  //   this.setState({ isExist: isexist })
  // }

  // async setAccount() {
  //   var tx_account = await this.state.contractAccount.createAccount("Jesper", 20220713, "patcharapornsombat@gmail.com")
  //   console.log(tx_account.hash);
  //   await tx_account.wait();
  //   console.log(await this.isExistAccount())
  // }

  render() {
    return (
      <HashRouter>
      <div className="App">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container-fluid">
            <a className="navbar-brand" href="#">
              <img style={{width: 4 +'rem'}} src={require('./img/brand_ticket.png')} />
            </a>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarText"
              aria-controls="navbarText"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarText">
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                <NavLink to="/" className="nav-link">Home</NavLink>
                </li>
                <li className="nav-item">
                <NavLink to="/create" className="nav-link">Create</NavLink>
                </li>
              </ul>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <OnboardingButton onConnected={this.onConnected} />
                </a>
                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li><a className="dropdown-item" href="#">Action</a></li>
                  <li><a className="dropdown-item" href="#">Another action</a></li>
                  <li><a className="dropdown-item" href="#">Something else here</a></li>
                </ul>
              </li>
              
            </div>
          </div>
        </nav>
        <div className="content container">
          <Routes>
            <Route exact path="/" element={<Home/>}/>
            <Route path="/create" element={<Create/>}/>
            <Route path="/detail/:id" element={<Detail/>}/>
          </Routes>
        </div>
      </div>
      </HashRouter>
    )
  }
}

export default App

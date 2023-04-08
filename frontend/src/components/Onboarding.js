import React from 'react'
import $ from 'jquery';
import MetaMaskOnboarding from '@metamask/onboarding'
import { ethers } from 'ethers'
import axios from "axios"
import Swal from 'sweetalert2'
import CryptoJS from 'crypto-js'
import { connect } from "react-redux";
import { changeWalletAccount, changeChainId, checkMetaMaskInstalled, setMMInstalledFlag, setConnectFlag, setLoginFlag, setUsername, setThaiID } from '../features/account/accountSlicer';
import { decode_thaiID } from '../features/function'
import 'bootstrap/dist/js/bootstrap.bundle';
import SignupForm from './SignupForm'
import AccountTab from './AccountTab'


class OnboardingButton extends React.Component {
  constructor () {
    super()

    this.state = {
      onboarding: new MetaMaskOnboarding()
    }

    this.connectMetaMask = this.connectMetaMask.bind(this)
    this.switchToAvalancheChain = this.switchToAvalancheChain.bind(this)
    this.check_available_walletaddress = this.check_available_walletaddress.bind(this)
  }

  async check_available_walletaddress(address) {
    var q = {query: "select * from Accounts where address = ?", 
    bind: [address]}
    const address_q_rst = await axios.post("http://localhost:8800/select", q)
    console.log("check_address")
    console.log(address_q_rst)

    if (address_q_rst.data.length > 0) {
      this.props.dispatch(setLoginFlag(true))
      this.props.dispatch(setUsername(address_q_rst.data[0]['username']))
      this.props.dispatch(setThaiID(address_q_rst.data[0]["thai_id"]))
      return true
    } else {
      this.props.dispatch(setLoginFlag(false))
      return false
    }
  }

  componentDidMount () {
    console.log("(DidMount)")
    // console.log(this.props.account_detail.MetaMaskIsInstalled)
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      this.props.dispatch(setMMInstalledFlag(true))
      this.connectMetaMask()

      // chain
      const chainId = window.ethereum.networkVersion
      this.props.dispatch(changeChainId(chainId))

      // Reload the site if the user selects a different chain
      window.ethereum.on('chainChanged', (chainId) => {
        this.props.dispatch(changeChainId(chainId))
        // window.location.reload()
      })  

      // Set the chain id once the MetaMask wallet is connected
      window.ethereum.on('connect', (connectInfo) => {
        const chainId = connectInfo.chainId
        this.props.dispatch(changeChainId(chainId))
      })

      // Update the list of accounts if the user switches accounts in MetaMask
      console.log("get accounts!! (DidMount)")
      window.ethereum.on('accountsChanged', accounts => {
        console.log("account did mount")
        this.props.dispatch(changeWalletAccount(accounts))
        if (accounts.length > 0) {
          this.check_available_walletaddress(accounts[0])
        }
      })

    } else {
      this.props.dispatch(setMMInstalledFlag(false))
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.isShowLogin !== this.state.isShowLogin) {
      console.log('isShowLogin state has changed to ', this.state.isShowLogin.toString())
    }

    if (prevProps.account_detail != this.props.account_detail) {
      console.log(this.props.account_detail)
    }

  }

  connectMetaMask () {
    // Request to connect to the MetaMask wallet
    window.ethereum
      .request({ method: 'eth_requestAccounts' })
      .then(accounts => {
        this.props.dispatch(changeWalletAccount(accounts))
        if (accounts.length > 0) {
          this.check_available_walletaddress(accounts[0])
        }
      })
  }

  switchToAvalancheChain () {
    // Request to switch to the selected Avalanche network
    window.ethereum
      .request({
        method: 'wallet_addEthereumChain',
        params: [this.props.account_detail.AvalancheChain]
      })
  }

  getAccount () {
    return this.props.account_detail.wallet_accounts[0]
  }



  render () {
    console.log("get accounts!! (Render)")
    if (this.props.account_detail.MetaMaskIsInstalled) {
      if (this.props.account_detail.wallet_accounts.length > 0) {
        // If the user is connected to MetaMask, stop the onboarding process.
        this.state.onboarding.stopOnboarding()
      }
    }
    
    if (!this.props.account_detail.MetaMaskIsInstalled) {
      // If MetaMask is not yet installed, ask the user to start the MetaMask onboarding process
      // (install the MetaMask browser extension).
      return (
        <div>
          <div>To run this dApp you need the MetaMask Wallet installed.</div>
          <button onClick={this.state.onboarding.startOnboarding}>
            Install MetaMask
          </button>
        </div>
      )
    } else if (this.props.account_detail.wallet_accounts.length === 0) {
      // If accounts is empty the user is not yet connected to the MetaMask wallet.
      // Ask the user to connect to MetaMask.
      return (
        <div>
          <div>To run this dApp you need to connect your MetaMask Wallet.</div>
          <button onClick={this.connectMetaMask}>
            Connect your Wallet
          </button>
        </div>
      )
    } else if (!this.props.account_detail.isAvalancheChain) {
      // If the selected chain id is not the Avalanche chain id, ask the user to switch
      // to Avalanche.
      return (
        <div>
          <div>Account: {this.props.account_detail.wallet_accounts[0]}</div>
          <div>To run this dApp you need to switch to the {this.props.account_detail.AvalancheChain.chainName} chain</div>
          <button onClick={this.switchToAvalancheChain}>
            Switch to the {this.props.account_detail.AvalancheChain.chainName} chain
          </button>
        </div>
      )
    } else if (this.props.account_detail.isLogin) {
      return (
        <div>
          <AccountTab />
        </div>
      )
    } else {
      // The user is connected to the MetaMask wallet and has the Avalanche chain selected.
      return (
        <div>
          <SignupForm />
        </div>
      )
    }
  }
}


const mapStateToProps = (state) => ({
  account_detail: state.account
});

export default connect(mapStateToProps)(OnboardingButton);
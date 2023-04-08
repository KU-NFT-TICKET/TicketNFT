import React from 'react'
import $ from 'jquery';
import {
  Route,
  NavLink,
  HashRouter,
  Routes,
  useParams
} from "react-router-dom";
import { connect } from "react-redux";
// import CryptoJS from 'crypto-js'
import axios from "axios"
import { decode_thaiID } from '../features/function'


export class AccountTab extends React.Component {
  constructor () {
    super()
    this.state = {}
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.account_detail.wallet_accounts != this.props.account_detail.wallet_accounts) {

    }
  }

  render () {
   	const account_style = {
        color: 'white',
        border: '1px solid white',
        borderRadius: '10px',
        padding: '10px 20px',
        margin: '0 20px'
      };
    const account_shown = this.props.account_detail.wallet_accounts[0].substring(0, 6) + "..." + this.props.account_detail.wallet_accounts[0].slice(-6)
    const decrypt_thaiID = decode_thaiID(this.props.account_detail.thai_id, this.props.account_detail.wallet_accounts[0])
    console.log("account thaiID = " + this.props.account_detail.thai_id)
   	return (
		<div>
			<NavLink to="/profile" className="nav-link">
		          <div style={account_style}>
		          	<span style={{fontSize: 25}}><b>{this.props.account_detail.username}</b></span>
		          	<br/>
		          	<span style={{fontSize: 12}}>{account_shown}</span>
		          	{/*<br/>
		          	<span style={{fontSize: 12}}>thai_id: {decrypt_thaiID}</span>*/}
		          </div>
		    </NavLink>
        </div>
	)
  }

}

const mapStateToProps = (state) => ({
  account_detail: state.account
});

export default connect(mapStateToProps)(AccountTab);
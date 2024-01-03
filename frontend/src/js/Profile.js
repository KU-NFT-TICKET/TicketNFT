import React from 'react'
import $ from 'jquery';
import { connect } from "react-redux";
import { changeWalletAccount, changeChainId, checkMetaMaskInstalled, setMMInstalledFlag, setConnectFlag, setLoginFlag } from '../features/account/accountSlice';
import { decode_thaiID } from '../features/function'
// import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

class Profile extends React.Component {
	  constructor () {
    super()

    this.state = {
    }
  }

  render () {
  	const user_detail_style = {
  		// color: 'snow',
  		backgroundColor: "#ffffff",
  		textAlign: 'left',
  		padding: "20px"
  	}
  	const history_detail_style = {
  		// color: 'snow',
  		backgroundColor: "#ffffff",
  		textAlign: 'left',
  		padding: "20px"
  	}
  	const history_table_style = {
  		// color: 'snow',
  		// backgroundColor: "#ffffff",
  		textAlign: 'center',
  		padding: "20px"
  	}
  	const decrypt_thaiID = decode_thaiID(this.props.account_detail.thai_id, this.props.account_detail.wallet_accounts[0])
    return (
    	<div>
    		<h1 style={{color: 'snow', marginBottom: '40px'}}>Profile</h1>
    		<div className="row">
	    		<div className="col-sm-4" style={user_detail_style}>
	    			<h2 style={{marginBottom: '30px'}}>{this.props.account_detail.username}</h2>
	    			<h5>Citizen ID:</h5>
	    			<p>{decrypt_thaiID}</p>
	    			<h5>Wallet Account:</h5>
	    			<p>{this.props.account_detail.wallet_accounts[0]}</p>
	    		</div>
	    		<div className="col-sm-1">
	    		</div>
	    		<div className="col-sm-7" style={history_detail_style}>
	    			<h2 style={{marginBottom: '30px', textAlign: 'center'}}>History</h2>
	    			<div className="row" style={history_table_style}>
	    			</div>
	    		</div>
    		</div>
    	</div>


    )
  }
}


const mapStateToProps = (state) => ({
  account_detail: state.account
});

export default connect(mapStateToProps)(Profile);
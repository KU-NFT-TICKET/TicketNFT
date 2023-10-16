import React from 'react'
import $ from 'jquery';
import MetaMaskOnboarding from '@metamask/onboarding'
import Swal from 'sweetalert2'
import { connect } from "react-redux";
import 'bootstrap/dist/js/bootstrap.bundle';
import axios from "axios"
import { check_format_thaiID, encode_thaiID, decode_thaiID } from '../features/function'

axios.defaults.headers.common['Authorization'] = process.env.REACT_APP_API_TOKEN

export class SignupForm extends React.Component {
  constructor () {
    super()

    this.state = {
    }

    this.handleLoginClick = this.handleLoginClick.bind(this)
  }

  async check_available_thaiID(thai_id) {
    const thai_id_rst = await axios.get(process.env.REACT_APP_API_BASE_URL+"/accounts/all")
    console.log("find_thai_id")
    console.log(thai_id_rst)

    var decrypted_thaiID = [];
    for (const data of thai_id_rst.data) {
      var thai_id_row = decode_thaiID(data['thai_id'], data['Address'])
      decrypted_thaiID.push(thai_id_row);
    }
    var id_flag = decrypted_thaiID.includes(thai_id)
    return id_flag
  }

  async check_available_username(username) {
    const username_q_rst = await axios.get(process.env.REACT_APP_API_BASE_URL+"/account?username="+username)
    console.log("check_username")
    console.log(username_q_rst)

    if (username_q_rst.data.length > 0) {
      return true
    } else {
      return false
    }
  }

  async handleLoginClick () {
    const { value: formValues } = await Swal.fire({
      title: 'Sign Up',
      html: '<form style="text-align: left;">                                                                                            ' +
'  <div class="mb-3">                                                                              ' +
'    <label for="exampleInputAddress1" class="form-label">Address: <span class="metamask-address">' + this.props.account_detail.wallet_accounts[0] + '<span></label>                        ' +
// '    <input type="text" class="form-control signup-form" id="signUpAddress" name="Address" >                       ' +
'  </div>                                                                                          ' +
'  <div class="mb-3">                                                                              ' +
'    <label for="exampleInputUsername1" class="form-label" >Username</label>                        ' +
'    <input type="text" class="form-control signup-form" id="signUpUsername" name="username" >                       ' +
'  </div>                                                                                          ' +
'  <div class="mb-3">                                                                              ' +
'    <label for="exampleInputThaiID1" class="form-label" >Citizen ID</label>                        ' +
'    <input type="text" class="form-control signup-form" id="signUpThaiID" name="thai_id" >                       ' +
'  </div>                                                                                          ' +
// '  <div class="mb-3">                                                                              ' +
// '    <label for="exampleInputEmail1" class="form-label">Email address</label>                      ' +
// '    <input type="email" class="form-control signup-form" id="signUpEmail" name="email" aria-describedby="emailHelp" >' +
// '    <div id="emailHelp" class="form-text">We\'ll never share your email with anyone else.</div>    ' +
// '  </div>                                                                                          ' +
// '  <div class="mb-3 form-check">                                                                   ' +
// '    <input type="checkbox" class="form-check-input" id="exampleCheck1">                           ' +
// '    <label class="form-check-label" for="exampleCheck1">Check me out</label>                      ' +
// '  </div>                                                                                          ' +
'</form>',
      focusConfirm: false,
      confirmButtonText: 'Register',
      confirmButtonColor: '#ffcc00',
      customClass: {
        validationMessage: 'my-validation-message'
      },
      // width: '80%',
      preConfirm: async () => {
        console.time('insert Account');
        var signup_username = $(".signup-form[name=username]").val().trim()
        var signup_thaiID = $(".signup-form[name=thai_id]").val().trim()
        // var signup_email = $(".signup-form[name=email]").val().trim()
        var signup_dict = {}
        var error_msg = [];
        var check_username_rst = await this.check_available_username(signup_username)
        console.log(error_msg.length)
        // check user
        if (signup_username === "") {
          console.log("null username.")
          error_msg.push("Username cannot be null");
          // Swal.showValidationMessage(
          //   '<i class="fa fa-info-circle"></i> Username cannot be null'
          // )
          $(".signup-form[name=username]").addClass("input-error");
          // flag += 1
        } else if (check_username_rst) {
          console.log("registered username.")
          // Swal.showValidationMessage(
          //   '<i class="fa fa-info-circle"></i><span> Username: <b>' + signup_username + '</b> is already used!</span>'
          // )
          error_msg.push("Username: <b>" + signup_username + "</b> is already used!");
          $(".signup-form[name=username]").addClass("input-error");
          // flag += 1
        } else {
          signup_dict["username"] = signup_username
          $(".signup-form[name=username]").removeClass("input-error");
        } 

        // check thai_id
        var encrypted_thai_id = encode_thaiID(signup_thaiID, this.props.account_detail.wallet_accounts[0])
        if (signup_thaiID === "") {
          $(".signup-form[name=thai_id]").addClass("input-error");
          console.log("null thai_id.")
          error_msg.push("Citizen ID cannot be null");
        } else if (!check_format_thaiID(signup_thaiID)) {
          $(".signup-form[name=thai_id]").addClass("input-error");
          console.log("wrong thai_id form.")
          error_msg.push("Citizen ID wrong format.");
        } else {
          var check_thaiID_rst = await this.check_available_thaiID(signup_thaiID)
          if (check_thaiID_rst) {
            console.log("registered thai_id.")
            error_msg.push("Citizen ID: " + signup_thaiID + " is already used!");
            $(".signup-form[name=thai_id]").addClass("input-error");
          } else {
            signup_dict["thai_id"] = signup_thaiID
            $(".signup-form[name=thai_id]").removeClass("input-error");
          }
        }
        console.log(error_msg.length)
        
        //return
        console.log("flag: " , error_msg.length)
        if (error_msg.length === 0) {
          console.time('insert new account.');
          var cipher_thaiID = encode_thaiID(signup_dict["thai_id"], this.props.account_detail.wallet_accounts[0])
          console.log("encode_thai_id: ", cipher_thaiID)
          var insertItem = await axios.post(process.env.REACT_APP_API_BASE_URL+"/account", {
            address: this.props.account_detail.wallet_accounts[0],
            username: signup_dict["username"],
            thai_id: cipher_thaiID
          });
          console.log(insertItem);
          if (insertItem.data.affectedRows !== undefined) {
            console.timeEnd('insert Account')
            return {err: 0, msg: "insert success"}
          } else {
            alert("db error")
            return {err: 1, msg: "DB Error:" + insertItem.err}
          }
        } else {
          for (var i = 0; i < error_msg.length; i++) { error_msg[i] = "• " + error_msg[i] }
          Swal.showValidationMessage(
            "<span>" + error_msg.join("<br>") + "</span>"
          )
        } 
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (result.value.err === 0) {
          Swal.fire('Insert Account: success', '', 'success')
          // window.location.assign("/#");
          window.location.reload()
        } else {
          Swal.fire('Error', result.value.msg, 'error')
        }
      }
    })

    console.log(formValues);
    if (formValues !== null) {
      console.log("final fire");
      
      Swal.fire(JSON.stringify(formValues))
    } 
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.account_detail.wallet_accounts !== this.props.account_detail.wallet_accounts) {
      $(".metamask-address").text(this.props.account_detail.wallet_accounts[0])
    }
  }



   render () {
   	const account_style = {
        color: 'white',
        border: '1px solid white',
        borderRadius: '10px',
        padding: '10px',
        margin: '10px'
      };
    const account_shown = this.props.account_detail.wallet_accounts[0].substring(0, 6) + "..." + this.props.account_detail.wallet_accounts[0].slice(-6)
   	return (
		<div>
          <button type="button" onClick={this.handleLoginClick} className="btn btn-primary" >
		   Sign Up
		  </button>
          <div style={account_style}>
          	Account: {account_shown}
          </div>
        </div>
	)
  }
}



const mapStateToProps = (state) => ({
  account_detail: state.account
});

export default connect(mapStateToProps)(SignupForm);
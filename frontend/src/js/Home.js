import React from "react";
import { ethers } from 'ethers'
import Web3 from 'web3';
import {BrowserRouter as Router, Link} from 'react-router-dom'
import Resizer from "react-image-file-resizer";
import {scanData, getData, putData} from './dynamoDB';
import { AlexaForBusiness } from "aws-sdk";
import axios from "axios"

class Home extends React.Component {

  componentDidMount() {
    this.onConnected()
  }

  constructor(props) {
    super(props)

    this.state = {
      isConnected: false,
      ownEvent: null,
      htmlListEvent: null
    }
    this.onConnected = this.onConnected.bind(this)
    this.setListEvent = this.setListEvent.bind(this)

    
  }

  async onConnected() {
    // Use the MetaMask wallet as ethers provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);
    const accounts = await provider.listAccounts();
    // console.log(accounts[0])

    var html = []
    try{
      var q = {query: "select event_id, event_name, DATE_FORMAT(date_sell, '%d %b %Y %T') as date_sell from Events where creator = ?", bind: [accounts[0]]}
      const ownEvent = await axios.post("http://localhost:8800/select", q)
      console.log(ownEvent)
      for (const data of ownEvent.data) {
        console.log(data)
        let link = "/detail/"+data['event_id'];
        var url = "https://nft-event-picture.s3.ap-northeast-1.amazonaws.com/poster/"+data['event_id']+".png";
        html.push((
          <div className="col-sm-3"><div className="card card-style">
            <img src={url} className="card-img-top card-img" alt="..." />
            <div className="card-body">
              <h5 className="card-title">{data['event_name']}</h5>
              <p className="card-text">{data['date_sell']}</p>
              <Link to={{pathname: link, state: data['event_id']}}>click</Link>
            </div>
          </div></div>
        ))
      }
      if (html.length === 0) {
        html.push((
          <div className="card mb-3 panel-style">
            <div className="card-body">
              <h5 className="card-title">Welcome to NFT Ticket</h5>
              <p className="card-text">Try to create your first Event go to Create tab.</p>
            </div>
          </div>
        ))
      }
      this.setState({
        isConnected: true,
        ownEvent: ownEvent,
        htmlListEvent: html
      })
    } catch(err){
      console.log(err)
    }
    
  }

  async setListEvent(){
    console.log("in this"+ this.state.ownEvent)
    let re = []
    this.state.ownEvent.forEach((data) => {
      this.getDetailEvent(data).then(function(tx) {
        re.push(tx[0])
      })
    })
    if (this.state.htmlListEvent !== re) {
      this.setState({htmlListEvent: re})
    }
    console.log(this.state.htmlListEvent)
  }

  render() {
    return (
      <div>
        <h1 style={{color: 'snow'}}>ALL EVENT</h1>
        <div className="row">
          {this.state.htmlListEvent}
        </div>
      </div>
    );
  }
  
  componentDidUpdate(_, prevState) {
    
  }

}
 
export default Home;
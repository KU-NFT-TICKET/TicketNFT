import React from 'react'
import { ethers } from 'ethers'
import $ from 'jquery';
import axios from "axios"
import contractTicketPlace from '../contracts/ticketMarketPlace.json'
import format from 'date-fns/format';
import { connect } from "react-redux";
import { updateAllEvents } from '../features/events/eventSlice';

export class Buy_Test extends React.Component {
  constructor () {
    super()
    this.state = {}

    this.buy_ticket = this.buy_ticket.bind(this)
  }

  async buy_ticket() {

    let ticket_id = "540"
    let event_id = "3"
    let event_name = "Red Velvet 4th Concert : R to V' in BANGKOK"
    let zone = "A"
    let seat = "A5"
    let price = "3239603995954389500"
    let limit = "4"
    let metadata = "1f80582032d703f5a0688858f57442f1726f74cb"
    let owner = "0xd2a6B642e2A53dE2Ea40D6B54Ce5e7DA1E51b4D5"
    let isHold = ""


    // let date_event = format(new Date(event_detail["date_event"]), 'yyyyMMddHHmm')
    // let date_sell = format(new Date(event_detail["date_sell"]), 'yyyyMMddHHmm')
    // let date_buy = format(new Date(), 'yyyyMMddHHmm')
    let date_event = "202312011812"
    let date_sell = "202310261010"
    let date_buy = format(new Date(), 'yyyyMMddHHmm')
    let date = [date_event, date_sell, date_buy]

    console.log(
      {
        ticket_id: ticket_id,
        event_id: event_id,
        event_name: event_name,
        date: date,
        zone: zone,
        seat: seat,
        price: price,
        limit: limit,
        metadata: metadata,
        owner: owner,
        isHold: isHold,
      }
    )

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);

    // const balance = await provider.getBalance(this.props.account_detail.wallet_accounts[0]);

    const contractMaket = await new ethers.Contract(
      process.env.REACT_APP_TICKET_ADDRESS,
      contractTicketPlace.output.abi,
      provider.getSigner(),
    )

    console.log(process.env.REACT_APP_TICKET_ADDRESS)
    console.log(contractMaket);

    // const nft_ticket_resp = await contractMaket.getListing()
    // console.log(nft_ticket_resp);

    const createTicket_resp = await contractMaket.createTicket(ticket_id, event_id, event_name, date, zone, seat, price, limit, metadata, owner, isHold)

    console.log(createTicket_resp)

    // contractMaket.on('createTicket', (ticket_id, event_id, event_name, date, zone, seat, price, limit, metadata, owner, isHold, event) => {
    //   // Handle the event emitted by the smart contract
    //   let info = {
    //     _TicketID: ticket_id,
    //     _EventID: event_id,
    //     _EventName: event_name,
    //     _date: date,
    //     _zone: zone,
    //     _seat: seat,
    //     _priceSeat: price,
    //     _limit: limit,
    //     _metadata: metadata,
    //     _owner: owner,
    //     _isHold: isHold
    //   }
    //   console.log(event);
    //   console.log(JSON.stringify(info, null, 4));
    // });
    // console.log("smart contract = ")
    // console.log(process.env.REACT_APP_TICKET_ADDRESS)
    // console.log(await contractMaket.name())
  }

  componentDidMount() {
    // this.get_events()
  }

  render () {
    return (
      <div>
        <button type="button" onClick={this.buy_ticket} className="btn btn-primary" >
          buy_test!
        </button>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  account_detail: state.account,
  events: state.events
});

export default connect(mapStateToProps)(Buy_Test);


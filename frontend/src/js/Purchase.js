import React from "react";
import { ethers } from 'ethers'
import Web3 from 'web3';
import $ from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faLocationDot, faClock, faCalendarPlus, faCircleDollarToSlot, faTicket } from '@fortawesome/free-solid-svg-icons'
import DatePicker from 'react-datepicker';
import setHours from "date-fns/setHours";
import setMinutes from "date-fns/setMinutes";
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import addDays from "date-fns/addDays";
import { FileUploader } from "react-drag-drop-files";
import Resizer from "react-image-file-resizer";
import { Buffer } from 'buffer';
import { uploadPic, deletePic } from './fileS3';
import Swal from 'sweetalert2'
import withRouter from './withRouter';
import axios from "axios"
import Select from 'react-select'
import CryptoJS from 'crypto-js'
import {BrowserRouter as Router, Link} from 'react-router-dom'
import "react-datepicker/dist/react-datepicker.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { compose } from "redux";
import { connect } from "react-redux";
import { updateAllEvents } from '../features/events/eventSlice';
import { updateEventDetail, updateSeatDetail } from '../features/purchase/purchaseSlice';
import { is_ticket_available } from '../features/function'
import contractTicketPlace from '../contracts/ticketMarketPlace.json'
import ZoneAvailabilityBox from '../components/ZoneAvailabilityBox'
import SeatSelection from '../components/SeatSelection'
import BookingBox from '../components/BookingBox'

export class Purchase extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      sdate: setHours(setMinutes(addDays(new Date(), 1), 0), 8),
      edate: setHours(setMinutes(addDays(new Date(), 30), 0), 18),
      fp: null,
      fs: null,
      filePoster: null,
      fileSeat: null,
      bufferP: null,
      bufferS: null,
      id: this.props.params.id,
      holdTicket: [],
      htmlUse: [],
      allSeatDetail: [],
      zoneAvailability:{},
      zoneSelectorHTML:[],
      selectedZone: "",
      selectTicket: [],
      ZoneContentHTML: [],
      imgurl_seat: "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/seat/" + this.props.id + ".png",
    }

    this.baseState = this.state

    this.setImageP = this.setImageP.bind(this)
    this.setImageS = this.setImageS.bind(this)
    this.onConnected = this.onConnected.bind(this)
    this.selectZone = this.selectZone.bind(this)
  }

  listenBuying() {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const contractMaket = new ethers.Contract(
      process.env.REACT_APP_TICKET_ADDRESS,
      contractTicketPlace.output.abi,
      // provider.getSigner(),
      provider,
    )
    contractMaket.on('createTicket', (event) => {
      // Extract the relevant data from the event object
      const { eventName, args, blockNumber, blockHash, transactionHash } = event;

      // Access the event data using the event name and the event object
      console.log('Event Name:', eventName);
      console.log('Event Args:', args);
      console.log('Block Number:', blockNumber);
      console.log('Block Hash:', blockHash);
      console.log('Transaction Hash:', transactionHash);
      this.get_seats_detail(this.props.id)
      // Update your UI or trigger other actions based on the emitted event
      // ...
    });
  }

  async buy_ticket(event_detail, ticket_detail) {

    let ticket_id = ticket_detail["ticket_id"]
    let event_id = event_detail["event_id"]
    let event_name = event_detail["event_name"]
    let zone = ticket_detail["zone"]
    let seat = ticket_detail["seat_row"] + ticket_detail["seat_id"]
    let price = ticket_detail["price"]
    let limit = event_detail["purchase_limit"]
    let metadata = ticket_detail["metadata"]
    let owner = ticket_detail["owner"]
    let isHold = ticket_detail["is_hold"]


    let date_event = format(new Date(event_detail["date_event"]), 'yyyyMMddHHmm')
    let date_sell = format(new Date(event_detail["date_sell"]), 'yyyyMMddHHmm')
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

    const contractMaket = new ethers.Contract(
      process.env.REACT_APP_TICKET_ADDRESS,
      contractTicketPlace.output.abi,
      provider.getSigner(),
    )

    contractMaket.on('createTicket', (ticket_id, event_id, event_name, date, zone, seat, price, limit, metadata, owner, isHold, event) => {
      // Handle the event emitted by the smart contract
      let info = {
        _TicketID: ticket_id,
        _EventID: event_id,
        _EventName: event_name,
        _date: date,
        _zone: zone,
        _seat: seat,
        _priceSeat: price,
        _limit: limit,
        _metadata: metadata,
        _owner: owner,
        _isHold: isHold
      }
      console.log(event);
      console.log(JSON.stringify(info, null, 4));
    });
    console.log("smart contract = ")
    console.log(process.env.REACT_APP_TICKET_ADDRESS)
    console.log(await contractMaket.name())
  }

  async get_seats_detail(event_id) {
    const seats_detail = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + this.props.id + "/seats")

    // var q = {
    //   query: "select * from Seats where event_id = ? order by zone, seat_row, seat_id",
    //   bind: [this.props.id]
    // }
    // const seats_detail = await axios.post("http://localhost:8800/select", q)
    console.log("Seat Detail:")
    console.log(seats_detail)
    this.setState({allSeatDetail: seats_detail.data})

    var zone_available = {}
    var zone_seat = {}
    for (const data of seats_detail.data) {
      if (!zone_available.hasOwnProperty(data['zone'])) {
        zone_available[data['zone']] = 0
      }
      if (is_ticket_available(data)) {
        zone_available[data['zone']] += 1
      }

      if (!zone_seat.hasOwnProperty(data['zone'])) {
        zone_seat[data['zone']] = {}
      }
      zone_seat[data['zone']][data['ticket_id']] = data
    }
    
    // selector
    var zone_selector_html = []
    var zone_options = [<option value=""></option>]
    for (const zone_name of Object.keys(zone_available)) {
      zone_options.push(<option value={zone_name}>{zone_name}</option>)
    }
    zone_selector_html.push((
      <select id="zoneSelector" onChange={this.selectZone}>
        {zone_options}
      </select>
    ))

    this.setState({
      zoneAvailability: zone_available,
      zoneSelectorHTML: zone_selector_html
    })
    this.props.dispatch(updateSeatDetail(zone_seat))
    console.log(this.state.zoneAvailability)
  }


  setImageP(event) {
    var fileInput = false;
    if (event[0]) {
      fileInput = true;
      this.setState({ fp: event });
      const readerP = new window.FileReader();
      readerP.readAsArrayBuffer(event[0]);
      readerP.onloadend = () => {
        this.setState({ bufferP: Buffer(readerP.result) })
        console.log("BufferP data: ", Buffer(readerP.result));
      }
    }
    if (fileInput) {
      try {
        Resizer.imageFileResizer(
          event[0],
          300,
          300,
          "PNG",
          100,
          0,
          (uri) => {
            this.setState({ filePoster: uri });
          },
          "base64",
          200,
          200
        );
      } catch (err) {
        console.log(err);
      }
    }
  }

  setImageS(event) {
    var fileInput = false;
    if (event[0]) {
      fileInput = true;
      this.setState({ fs: event });
      const readerS = new window.FileReader();
      readerS.readAsArrayBuffer(event[0]);
      readerS.onloadend = () => {
        this.setState({ bufferS: Buffer(readerS.result) })
        console.log("BufferS data: ", Buffer(readerS.result));
      }
    }
    if (fileInput) {
      try {
        Resizer.imageFileResizer(
          event[0],
          300,
          300,
          "PNG",
          100,
          0,
          (uri) => {
            this.setState({ fileSeat: uri });
          },
          "base64",
          200,
          200
        );
      } catch (err) {
        console.log(err);
      }
    }
  }

  selectZone(event) {
    var zone_input = event.target.value
    let zoneContent = []
    if (zone_input === "") {
      zoneContent.push(
        <div className="row">
          <div className="col-sm-10 offset-sm-1">
            <div style={{
              "backgroundImage": "url(" + this.state.imgurl_seat + ")",
              backgroundSize: "contain", "width": "100%", "height": 500 + "px", backgroundRepeat: 'no-repeat', backgroundPosition: 'center'
            }}>
            </div>
          </div>
        </div>
      )
    } else {
      zoneContent.push(
        <div className="row">
          <div className="tab-content col-sm-9" id="zoneContent">
            <SeatSelection zone={zone_input} event_id={this.props.id}/>
          </div>
          <div className="tab-content col-sm-3">
            <BookingBox zone={zone_input} event_id={this.props.id}/>
          </div>
        </div>
      )
    }

    this.setState({
      selectedZone: zone_input,
      ZoneContentHTML: zoneContent
    })
  }

  async onConnected() {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);
    const accounts = await provider.listAccounts();

    var data_detail = {}
    try {
      // var q = {
      //   query: "select event_id, event_name, date_format(date_sell, '%m/%d/%Y %H:%i') as date_sell, date_format(date_event, '%m/%d/%Y %H:%i') as date_event, date_format(date_sell, '%W %d %M %Y %H:%i') as show_date_sell, date_format(date_event, '%W %d %M %Y') as show_date_event, date_format(date_event, '%H:%i') as show_time_event, detail, purchase_limit, venue from Events where creator = ? and event_id = ?",
      //   bind: [accounts[0], this.state.id]
      // }
      // var q = {
      //   query: "select event_id, event_name, creator, date_format(date_sell, '%m/%d/%Y %H:%i') as date_sell, date_format(date_event, '%m/%d/%Y %H:%i') as date_event, date_format(date_sell, '%W %d %M %Y %H:%i') as show_date_sell, date_format(date_event, '%W %d %M %Y') as show_date_event, date_format(date_event, '%H:%i') as show_time_event, detail, purchase_limit, venue from Events where event_id = ?",
      //   bind: [this.props.id]
      // }
      // const ownEvent = await axios.post("http://localhost:8800/select", q)
      const events_details = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + this.props.id)
      data_detail = events_details.data[0]
      data_detail = {
        'event_id': data_detail.event_id,
        'event_name': data_detail.event_name,
        'date_sell': format(new Date(data_detail.date_sell), 'MM/dd/yyyy HH:mm'),
        'date_event': format(new Date(data_detail.date_event), 'MM/dd/yyyy HH:mm'),
        'show_date_sell': format(new Date(data_detail.date_sell), 'iiii d MMMM yyyy HH:mm'),
        'show_date_event': format(new Date(data_detail.date_event), 'iiii d MMMM yyyy'),
        'show_time_event': format(new Date(data_detail.date_event), 'HH:mm'),
        'detail': data_detail.detail,
        'purchase_limit': data_detail.purchase_limit,
        'venue': data_detail.venue
      }
      this.props.dispatch(updateEventDetail(data_detail))
    } catch (err) {
      console.log(err)
    }

    var seat_count = {}
    var price_detail = []
    try {
      var seats_of_event_recs = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + this.props.id + "/seats")
      seat_count = {'seat_count': 0 }
      for (let seat_detail of seats_of_event_recs.data) {
        let seat_eth_price = Math.round(ethers.utils.formatEther(seat_detail.price) * 1e2) / 1e2;
          if (seat_detail.owner === null) { seat_count.seat_count += 1 }
          if (!price_detail.includes(seat_eth_price)) { price_detail.push(seat_eth_price) }
      }
      price_detail.sort().reverse();
      // seat_count = {'seat_count': seats_of_event_recs.data.map(function (s_row) { if (s_row.owner === null) return s_row; }).length};
      // seat_count = {'seat_count': seats_of_event_recs.data.length}

    } catch (err) {
      console.log(err)
    }

    // var price_detail = []
    // try {
    //   var q = {
    //     query: "select distinct ROUND(price/1000000000000000000, 2) as price from Seats where event_id = ? order by ROUND(price/1000000000000000000, 2) desc",
    //     bind: [this.props.id]
    //   }
    //   const ownPrice = await axios.post("http://localhost:8800/select", q)
    //   price_detail = ownPrice.data
    // } catch (err) {
    //   console.log(err)
    // }

    // var seat_count = {}
    // try {
    //   var q = {
    //     query: "select count(*) seat_count from Seats where owner is null and event_id = ?",
    //     bind: [this.props.id]
    //   }
    //   const ownSeatCount = await axios.post("http://localhost:8800/select", q)
    //   seat_count = ownSeatCount.data[0]
    // } catch (err) {
    //   console.log(err)
    // }

    this.setState({
      data_detail: data_detail,
      price_detail: price_detail,
      seat_count: seat_count,
      sdate: new Date(data_detail.date_sell),
      edate: new Date(data_detail.date_event)
    })
  }

  componentDidMount() {
    // set default
    this.setState({
      ZoneContentHTML: <div className="row">
          <div className="col-sm-10 offset-sm-1">
            <div style={{
              "backgroundImage": "url(" + this.state.imgurl_seat + ")",
              backgroundSize: "contain", "width": "100%", "height": 500 + "px", backgroundRepeat: 'no-repeat', backgroundPosition: 'center'
            }}>
            </div>
          </div>
        </div>
    })

    this.onConnected()
    this.get_seats_detail(this.props.id)
  }

  componentDidUpdate(prevProps, prevState) {
    // console.log("zone = " + this.state.selectedZone)
  }

  render() {
    if (this.props.account_detail.isLogin && this.props.purchase.seatDetail) {
      var purchase_link = "/event_detail/"+this.props.id+"/purchase";
      var imgurl = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/poster/" + this.props.id + ".png"
      let date_ob = new Date();
      if (this.state.data_detail !== undefined && this.state.data_detail.event_name !== undefined && this.state.price_detail !== undefined) {
        var price_detail = []
        for (var i = 0; i < this.state.price_detail.length; i++) {
          price_detail.push(this.state.price_detail[i]['price'])
        }
        var price_show = '~' + price_detail.join(', ~') + ' AVAX'
        var status_event = ''
        var status_txt = ''
        var show_edit = false
        var display = {}
        var display_trans = {}
        if (date_ob >= new Date(this.state.data_detail.date_event)) {
          display_trans = { 'display': 'none' }
        }
        if (date_ob <= new Date(this.state.data_detail.date_event)) {
          if (this.state.seat_count.seat_count > 0) {
            if (date_ob >= new Date(this.state.data_detail.date_sell)) {
              // ticket on sell
              status_event = 'status-event status-on'
              status_txt = 'ON SELL'
              show_edit = true
              display = { 'display': 'none' }
            } else {
              status_event = 'status-event status-hold'
              status_txt = 'NOT AVAILABLE'
            }
          } else {
            status_event = 'status-event status-off'
            status_txt = 'SOLD OUT'
            show_edit = true
            display = { 'display': 'none' }
          }
        } else {
          status_event = 'status-event status-off'
          status_txt = 'EVENT CLOSE'
          show_edit = true
          display = { 'display': 'none' }
        }
        return (
          <div>
            <br />
            <div className="row" style={{ color: 'white' }}>
              {/*<div className="col-sm-8" style={{ textAlign: 'left', 'position': 'relative' }}>*/}
              <div className="col-sm-7" style={{ textAlign: 'left'}}>
                {/*<span>{this.state.data_detail.detail}</span>*/}
                <div className="row div-event">
                  <div className="col-sm-12">
                    <ul className="event-ul">
                      <li className="row">
                        <h1>{this.state.data_detail.event_name}</h1>
                      </li>
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarDays} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                        <div className="col-sm-11">
                          <small className="small-color">Show Date</small>
                          <div>{this.state.data_detail.show_date_event}, {this.state.data_detail.show_time_event}</div>
                        </div>
                      </li>
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faLocationDot} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                        <div className="col-sm-11">
                          <small className="small-color">Venue</small>
                          <div>{this.state.data_detail.venue}</div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-sm-4 offset-sm-1">
                <div className="row div-event" style={{'padding': '20px'}}>
                  <div className="col-sm-12">
                    <ZoneAvailabilityBox zoneAvailability={this.state.zoneAvailability} />
                  </div>
                </div>
              </div>
            </div>
            <br />
            <div className="row">
              <div className="form-style">
                <div className="row">
                  {this.state.zoneSelectorHTML}
                </div>
                <br />
                {this.state.ZoneContentHTML}
              </div>
            </div>
          </div>
        )
      } else {
        return <img src={require('../img/loading.gif')} />
      }
    } else {
      return (
        <div className="card mb-3 panel-style">
          <div className="card-body">
            <h5 className="card-title">Login Required.</h5>
            <p className="card-text">Please login before proceed to Purchase Page.</p>
          </div>
        </div>
      )
    }
  }
}

const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  purchase: state.purchase,
  events: state.events,
  id: ownProps.params.id
});

// export default withRouter(Event_Detail);
export default compose(
  withRouter,
  connect(mapStateToProps)
)(Purchase);

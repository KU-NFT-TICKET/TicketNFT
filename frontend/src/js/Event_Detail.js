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

class Event_Detail extends React.Component {
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
      htmlUse: []
    }

    this.baseState = this.state

    this.setImageP = this.setImageP.bind(this)
    this.setImageS = this.setImageS.bind(this)
    this.onConnected = this.onConnected.bind(this)
  }

  async onConnected() {

    var data_detail = {}
    try {
      // var q = {
      //   query: "select event_id, event_name, date_format(date_sell, '%m/%d/%Y %H:%i') as date_sell, date_format(date_event, '%m/%d/%Y %H:%i') as date_event, date_format(date_sell, '%W %d %M %Y %H:%i') as show_date_sell, date_format(date_event, '%W %d %M %Y') as show_date_event, date_format(date_event, '%H:%i') as show_time_event, detail, purchase_limit, venue from Events where creator = ? and event_id = ?",
      //   bind: [accounts[0], this.state.id]
      // }

      var events_details = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events/" + this.props.id)
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

      // var q = {
      //   query: "select event_id, event_name, date_format(date_sell, '%m/%d/%Y %H:%i') as date_sell, date_format(date_event, '%m/%d/%Y %H:%i') as date_event, date_format(date_sell, '%W %d %M %Y %H:%i') as show_date_sell, date_format(date_event, '%W %d %M %Y') as show_date_event, date_format(date_event, '%H:%i') as show_time_event, detail, purchase_limit, venue from Events where event_id = ?",
      //   bind: [this.props.id]
      // }
      // const ownEvent = await axios.post("http://localhost:8800/select", q)
      // data_detail = ownEvent.data[0]
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
    console.log(price_detail)



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


  componentDidMount() {
    this.onConnected()
  }

  componentDidUpdate(prevProps, prevState) {
  }

  render() {
    var purchase_link = "/event_detail/"+this.props.id+"/purchase";
    var imgurl = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/poster/" + this.props.id + ".png"
    // var imgurl = "https://nft-event-picture.s3.ap-northeast-1.amazonaws.com/poster/" + this.props.id + ".png"
    var imgurl_seat = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/seat/" + this.props.id + ".png"
    // var imgurl_seat = "https://nft-event-picture.s3.ap-northeast-1.amazonaws.com/seat/" + this.props.id + ".png"
    let date_ob = new Date();
    if (this.state.data_detail !== undefined && this.state.data_detail.event_name !== undefined && this.state.price_detail !== undefined) {
      // var price_detail = []
      // for (var i = 0; i < this.state.price_detail.length; i++) {
      //   price_detail.push(this.state.price_detail[i]['price'])
      // }
      // var price_show = '~' + price_detail.join(', ~') + ' AVAX'
      var price_show = '~' + this.state.price_detail.join(', ~') + ' AVAX'
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
            <div className="col-sm-8" style={{ textAlign: 'left', 'position': 'relative' }}>
              <h1>{this.state.data_detail.event_name}</h1>
              <span>{this.state.data_detail.detail}</span>
              <div className="row div-event" style={{ 'position': 'absolute', 'bottom': '0px' }}>
                <div className="col-sm-6">
                  <ul className="event-ul">
                    <li className="row">
                      <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarDays} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                      <div className="col-sm-11">
                        <small className="small-color">Show Date</small>
                        <div>{this.state.data_detail.show_date_event}</div>
                      </div>
                    </li>
                    <li className="row">
                      <div className="col-sm-1"><FontAwesomeIcon icon={faLocationDot} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                      <div className="col-sm-11">
                        <small className="small-color">Venue</small>
                        <div>{this.state.data_detail.venue}</div>
                      </div>
                    </li>
                    <li className="row">
                      <div className="col-sm-1"><FontAwesomeIcon icon={faClock} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                      <div className="col-sm-11">
                        <small className="small-color">Show Time</small>
                        <div>{this.state.data_detail.show_time_event}</div>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="col-sm-6">
                  <ul className="event-ul">
                    <li className="row">
                      <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarPlus} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                      <div className="col-sm-11">
                        <small className="small-color">Public Sale</small>
                        <div>{this.state.data_detail.show_date_sell}</div>
                      </div>
                    </li>
                    <li className="row">
                      <div className="col-sm-1"><FontAwesomeIcon icon={faCircleDollarToSlot} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                      <div className="col-sm-11">
                        <small className="small-color">Ticket Price</small>
                        <div>{price_show}</div>
                      </div>
                    </li>
                    <li className="row">
                      <div className="col-sm-1"><FontAwesomeIcon icon={faTicket} style={{ height: 20, marginTop: 10 + 'px' }} /></div>
                      <div className="col-sm-11">
                        <small className="small-color">Ticket Status</small><br />
                        <span className={status_event}><span>{status_txt}</span></span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-sm-4">
              <div style={{
                "backgroundImage": "url(" + imgurl + ")",
                backgroundSize: "contain", "width": "100%", "height": 300 + "px", backgroundRepeat: 'no-repeat'
              }}></div>
            </div>
          </div>
          <br />
          <div className="form-style">
            <div>
                <div className="row" style={{'marginTop': '20px'}}>
                  <Link to={{pathname: purchase_link, state: this.props.id}}>
                    <button type="button" className="btn btn-danger col-sm-2 offset-sm-9">BUY TICKETS</button>
                  </Link>
                </div>
                <br />
                <br />
                <div className="row box-create">
                  <div className="row" style={{'margin': '20px'}}>
                    <div className="col-sm-5" >
                      <h2 style={{ 'textAlign': 'left' }}>Seating Plan</h2>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-sm-10 offset-sm-1">
                      <div style={{
                        "backgroundImage": "url(" + imgurl_seat + ")",
                        backgroundSize: "contain", "width": "100%", "height": 500 + "px", backgroundRepeat: 'no-repeat', backgroundPosition: 'center'
                      }}>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      )
    } else {
      return <img src={require('../img/loading.gif')} />
    }
  }
}

const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  id: ownProps.params.id
});

// export default withRouter(Event_Detail);
export default compose(
  withRouter,
  connect(mapStateToProps)
)(Event_Detail);


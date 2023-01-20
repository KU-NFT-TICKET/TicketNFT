import React from "react";
import { ethers } from 'ethers'
import Web3 from 'web3';
import $ from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faPlus, faCirclePlus, faCircleMinus, faCalendarDays, faLocationDot, faClock, faCalendarPlus, faCircleDollarToSlot } from '@fortawesome/free-solid-svg-icons'
import DatePicker from 'react-datepicker';
import setHours from "date-fns/setHours";
import setMinutes from "date-fns/setMinutes";
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import addDays from "date-fns/addDays";
import { FileUploader } from "react-drag-drop-files";
import Resizer from "react-image-file-resizer";
import { create } from "ipfs-http-client";
import {Buffer} from 'buffer';
import {scanData, getData, putData, queryData} from './dynamoDB';
import {uploadPic} from './fileS3';
import Swal from 'sweetalert2'
import withRouter from './withRouter';
import axios from "axios"

import "react-datepicker/dist/react-datepicker.css";
import 'bootstrap/dist/css/bootstrap.min.css';

// Import contract address and artifact
import contractTicketPlace from '../contracts/TicketMarketplace.json'
import addressContract from '../contracts/addressContract';



class Detail extends React.Component {
    constructor(props) {
      super(props)

      this.state = {
        zone: null,
        zoneseat: null,
        number: null,
        price: null,
        listzone: [],
        listzoneseat: [],
        listnumber: [],
        listprice: [], 
        sdate: setHours(setMinutes(addDays(new Date(), 1), 0), 8),
        edate: setHours(setMinutes(addDays(new Date(), 30), 0), 18),
        fp: null,
        fs: null,
        filePoster: null,
        fileSeat: null,
        bufferP: null,
        bufferS: null,
        id: this.props.params.id
      }
  
      this.baseState = this.state 
  
      this.addElement = this.addElement.bind(this)
      this.removeElement = this.removeElement.bind(this)
      this.setImageP = this.setImageP.bind(this)
      this.setImageS = this.setImageS.bind(this)
      this.clearForm = this.clearForm.bind(this)
      this.handleSubmit = this.handleSubmit.bind(this)
      this.onConnected = this.onConnected.bind(this)
      this.fileChangedHandler = this.fileChangedHandler.bind(this)
    }

    componentDidMount() {
      this.onConnected()
    }
  
    async onConnected() {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", []);
      const accounts = await provider.listAccounts();

      var data_detail = {}
      try {
        var q = {query: "select event_id, event_name, date_format(date_sell, '%W %d %M %Y %H:%i') as show_date_sell, date_format(date_event, '%W %d %M %Y') as show_date_event, date_format(date_event, '%H:%i') as show_time_event, detail, purchase_limit, venue from Events where creator = ? and event_id = ?", 
        bind: [accounts[0], this.state.id]}
        const ownEvent = await axios.post("http://localhost:8800/select", q)
        data_detail = ownEvent.data[0]
      } catch(err){
        console.log(err)
      }
      var ticket_detail = []
      try {
        var q = {query: "select ticket_id, price, seat_id, seat_row, zone from Seats where creator = ? and event_id = ?", 
        bind: [accounts[0], this.state.id]}
        const ownTickett = await axios.post("http://localhost:8800/select", q)
        ticket_detail = ownTickett.data
      } catch(err){
        console.log(err)
      }
      var price_detail = []
      try {
        var q = {query: "select distinct ROUND(price/1000000000000000000, 2) as price from Seats where event_id = ? order by ROUND(price/1000000000000000000, 2) desc", 
        bind: [this.state.id]}
        const ownPrice = await axios.post("http://localhost:8800/select", q)
        price_detail = ownPrice.data
      } catch(err){
        console.log(err)
      }

      var seat_count = {}
      try {
        var q = {query: "select count(*) seat_count from Seats where owner is null and event_id = ?", 
        bind: [this.state.id]}
        const ownPrice = await axios.post("http://localhost:8800/select", q)
        seat_count = ownPrice.data[0]
      } catch(err){
        console.log(err)
      }
      

      this.setState({
        isConnected: true,
        data_detail: data_detail,
        ticket_detail: ticket_detail,
        price_detail: price_detail,
        seat_count: seat_count
      })
    }

    async handleSubmit() {
      const web3 = new Web3(window.ethereum);
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", []);
      const accounts = await provider.listAccounts();
  
      const detailAccount = await getData("Accounts", {address: accounts[0]});
  
      const contractMarket = new ethers.Contract(
        addressContract.market,
        contractTicketPlace.output.abi,
        provider.getSigner(),
      )
      console.log(await contractMarket.name())
  
      if(!detailAccount.Item) {
        console.log("Need to Activate Account")
        alert("Need to Activate Account!!!")
      } else {
        console.log("-_-")
        var name = $("input[name=name]").val()
        var sdate = new Date(this.state.sdate).toISOString()
        var sdate_e = format(parseISO(sdate), 'yyyyMMddHHMMss')
        sdate = format(parseISO(sdate), 'yyyy-MM-dd HH:MM:ss')
        var edate = new Date(this.state.edate).toISOString()
        var edate_e = format(parseISO(edate), 'yyyyMMddHHMMss')
        edate = format(parseISO(edate), 'yyyy-MM-dd HH:MM:ss')
        var detail = $("#des").val()
        var zone = this.state.listzone
        var zoneseat = this.state.listzoneseat
        var number = this.state.listnumber
        var price = this.state.listprice
        var bfP = this.state.bufferP
        var bfS = this.state.bufferS
        var limit = $("input[name=limit]").val()
        const countItems = await scanData('Events', '', 'COUNT');
        var index = countItems.Count;
        // var index = countItems.Count + 1;
        console.log(index);
        if (name && sdate && edate && detail && zone.length > 0 && zoneseat.length > 0 && number.length > 0 && price.length > 0 && bfP && bfS) {
          var _priceGas = await provider.getGasPrice();
          var all_seat = 0;
          for (var z = 0; z <zone.length; z++){
            all_seat += ((parseInt(zoneseat[z].charCodeAt(0)) - 65) + 1 ) * number[z];
          }
          var sent_price = _priceGas * all_seat;
          Swal.fire({
            title: 'Are you sure?',
            text: "Create Event '" + name + "' " + all_seat + " seats with \n" + ((sent_price / 1000000000000000000)).toString() + " Avax \n (gas/ticket = " + ((_priceGas / 1000000000000000000)).toString()  + " Avax)",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Create Event!'
          }).then(async (result) => {
            if (result.isConfirmed) {
              const params = [{
                  from: accounts[0],
                  to: process.env.REACT_APP_ACCOUNT,
                  value: ethers.utils.parseUnits(sent_price.toString(), "wei").toHexString()
              }];
          
              const transactionHash = await provider.send('eth_sendTransaction', params)
              console.log('transactionHash is ' + transactionHash);
              console.timeEnd('create NFT')
            }
          })
        } else {
          alert("Plese fill all the information")
        }
      }
    }
  
    setImageP(event) {
      // console.log(event)
      var fileInput = false;
      if (event[0]) {
        fileInput = true;
        this.setState({ fp: event });
        const readerP = new window.FileReader();
        readerP.readAsArrayBuffer(event[0]);
        readerP.onloadend = () => {
          this.setState({bufferP: Buffer(readerP.result)})
          console.log("BufferP data: ", Buffer(readerP.result));
        }
      }
      if (fileInput) {
        try {
          Resizer.imageFileResizer(
            event[0],
            300,
            300,
            "JPEG",
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
          this.setState({bufferS: Buffer(readerS.result)})
          console.log("BufferS data: ", Buffer(readerS.result));
        }
      }
      if (fileInput) {
        try {
          Resizer.imageFileResizer(
            event[0],
            300,
            300,
            "JPEG",
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
    
    clearForm() {
      let z = []
      this.setState(this.baseState)
      this.setState({
        listzone: z,
        listzoneseat: z,
        listnumber: z,
        listprice: z,
      })
      $("input[name=zone]").val("")
      $("input[name=zoneseat]").val("")
      $("input[name=number]").val("")
      $("input[name=price]").val("")
      $("input[name=name]").val("")
      $("#des").val("")
    }
  
    addElement() {
      console.log(this.state.zone)
      if (this.state.zone != undefined && this.state.zoneseat != undefined && this.state.number != undefined && this.state.price != undefined) {
        let z = this.state.listzone
        let zs = this.state.listzoneseat
        let n = this.state.listnumber
        let p = this.state.listprice
        z.push(this.state.zone)
        zs.push(this.state.zoneseat)
        n.push(this.state.number)
        p.push(this.state.price)
  
        this.setState({
          listzone: z,
          listzoneseat: zs,
          listnumber: n,
          listprice: p,
          zone: null,
          zoneseat: null,
          number: null,
          price: null
        })
        $("input[name=zone]").val("")
        $("input[name=zoneseat]").val("")
        $("input[name=number]").val("")
        $("input[name=price]").val("")
        // console.log(this.state.listzone)
        // console.log(this.state.listnumber)
        // console.log(this.state.listprice)
      }
  
    }
  
    removeElement(k) {
      console.log(k)
      let z = this.state.listzone
      let zs = this.state.listzoneseat
      let n = this.state.listnumber
      let p = this.state.listprice
      z.splice(k, 1)
      zs.splice(k, 1)
      n.splice(k, 1)
      p.splice(k, 1)
  
      this.setState({
        listzone: z,
        listzoneseat: zs,
        listnumber: n,
        listprice: p,
        zone: null,
        zoneseat: null,
        number: null,
        price: null
      })
  
      // console.log(this.state.listzone)
      // console.log(this.state.listnumber)
      // console.log(this.state.listprice)
    }

    fileChangedHandler(event) {
      console.log(event)
      console.log("in")
      var fileInput = false;
      if (event.target.files[0]) {
        fileInput = true;
      }
      if (fileInput) {
        try {
          Resizer.imageFileResizer(
            event.target.files[0],
            300,
            300,
            "JPEG",
            100,
            0,
            (uri) => {
              console.log(uri);
              this.setState({ newImage: uri });
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
    
    render() {
      const {listzone, listzoneseat, listnumber, listprice} = this.state;
      const fileTypes = ["JPEG", "PNG", "GIF", "JPG"]
      var imgurl =  "https://nft-event-picture.s3.ap-northeast-1.amazonaws.com/poster/"+this.state.id+".png"
      console.log(this.state)
      
      if (this.state.data_detail !== undefined && this.state.data_detail.event_name !== undefined && this.state.price_detail !== undefined) {
        var price_detail = []
        for (var i = 0; i < this.state.price_detail.length; i++) {
          price_detail.push(this.state.price_detail[i]['price'])
        }
        var price_show = '~' + price_detail.join(', ~') + ' AVAX'
        if (this.data_detail) {
          // check status sell 
        }
        return (
          <div style={{color: 'white'}}>
            <br/>
            <div className="row">
              <div className="col-sm-8" style={{'text-align': 'left'}}>
                <h1>{this.state.data_detail.event_name}</h1>
                <span>{this.state.data_detail.detail}</span>
                <div className="row">
                  <div className="col-sm-6">
                    <ul className="event-ul">
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarDays} style={{height: 20, marginTop: 10+'px'}}/></div>
                        <div className="col-sm-11">
                          <small>Show Date</small>
                          <div>{this.state.data_detail.show_date_event}</div>
                        </div>
                      </li>
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faLocationDot} style={{height: 20, marginTop: 10+'px'}}/></div>
                          <div className="col-sm-11">
                          <small>Venue</small>
                          <div>{this.state.data_detail.venue}</div>
                        </div>
                      </li>
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faClock} style={{height: 20, marginTop: 10+'px'}}/></div>
                          <div className="col-sm-11">
                          <small>Show Time</small>
                          <div>{this.state.data_detail.show_time_event}</div>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="col-sm-6">
                  <ul className="event-ul">
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarPlus} style={{height: 20, marginTop: 10+'px'}}/></div>
                        <div className="col-sm-11">
                          <small>Public Sale</small>
                          <div>{this.state.data_detail.show_date_sell}</div>
                        </div>
                      </li>
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faCircleDollarToSlot} style={{height: 20, marginTop: 10+'px'}}/></div>
                          <div className="col-sm-11">
                          <small>Ticket Price</small>
                          <div>{price_show}</div>
                        </div>
                      </li>
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faClock} style={{height: 20, marginTop: 10+'px'}}/></div>
                          <div className="col-sm-11">
                          <small>Ticket Status</small>
                          <div>{this.state.data_detail.show_time_event}</div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-sm-4">
                <div style={{"background-image": "url("+imgurl+")", 
                "background-size": "contain","width": "100%","height": 300+"px","background-repeat": 'no-repeat'}}></div>
              </div>
            </div>

            <br/>
            <form className="row g-3 needs-validation" noValidate >
              <div className="col-sm-6 box-create">
                <div className="mb-3 row">
                  <label htmlFor="name" className="col-sm-2 col-form-label">Event Name:</label>
                  <div className="col-sm-10">
                    <input type="text" className="form-control" id="name" name="name" />
                  </div>
                </div>
                <div className="mb-3 row">
                  <label htmlFor="des" className="col-sm-2 col-form-label">Description:</label>
                  <div className="col-sm-10">
                    <textarea className="form-control" id="des" name="des" ></textarea>
                  </div>
                </div>
                <div className="mb-3 row">
                  <label htmlFor="limit" className="col-sm-2 col-form-label">User limit buy:</label>
                  <div className="col-sm-10">
                    <input type="text" className="form-control" style={{width: 100+'px'}} onKeyPress={(event) => { if (!/[0-9 .]/.test(event.key)) { event.preventDefault(); }}} id="limit" name="limit" />
                  </div>
                </div>
                <div className="mb-3 row">
                  <label htmlFor="sdate" className="col-sm-2 col-form-label">Sell date:</label>
                  <div className="col-sm-4">
                    <div className='form-group' id='sdate'>
                    <DatePicker
                      selected={this.state.sdate}
                      onChange={(e)=> this.setState({sdate: e})}
                      showTimeSelect
                      dateFormat="MMM d, yyyy HH:mm"
                      timeFormat="HH:mm"
                      minDate={addDays(new Date(), 1)}
                      name="sdate"
                      className="form-control"
                    />
                    </div>
                  </div>
                  <label htmlFor="edate" className="col-sm-2 col-form-label">Event date:</label>
                  <div className="col-sm-4">
                    <div className='form-group' id='edate'>
                    <DatePicker
                      selected={this.state.edate}
                      onChange={(e)=> this.setState({edate: e})}
                      showTimeSelect
                      dateFormat="MMM d, yyyy HH:mm"
                      timeFormat="HH:mm"
                      minDate={addDays(new Date(), 2)}
                      name="edate"
                      className="form-control"
                    />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-sm-5 box-create">
                <div className="mb-3 row">
                  <div className="col-sm-10 row">
                    <div className="col-sm-6 row">
                      <div className="col-sm-3">
                        <label htmlFor="zone" className="col-form-label">Zone:</label>
                      </div>
                      <div className="col-sm-9">
                        <input type="text" className="form-control" id="zone" name="zone" value={this.state.zone} onChange={(e)=> this.setState({zone: e.target.value})} />
                      </div>
                    </div>
                    <div className="col-sm-6 row">
                      <div className="col-sm-4">
                        <label htmlFor="zoneseat" className="col-sm-2 col-form-label">Seat:</label>
                      </div>
                      <div className="col-sm-8">
                        <input type="text" className="form-control" id="zoneseat" name="zoneseat" value={this.state.zoneseat} onChange={(e)=> this.setState({zoneseat: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-3 row">
                  <div className="col-sm-10 row">
                    <div className="col-sm-6 row">
                      <div className="col-sm-3"><label htmlFor="number" className="col-form-label">No.:</label></div>
                      <div className="col-sm-9">
                        <input type="text" className="form-control" onKeyPress={(event) => { if (!/[0-9 .]/.test(event.key)) { event.preventDefault(); }}} id="number" name="number" value={this.state.number} onChange={(e)=> this.setState({number: e.target.value})} />
                      </div>
                    </div>
                    <div className="col-sm-6 row">
                    <div className="col-sm-4"><label htmlFor="price" className="col-sm-1 col-form-label">Price:</label></div>
                      <div className="col-sm-8">
                        <input type="text" className="form-control" id="price" onKeyPress={(event) => { if (!/[0-9 .]/.test(event.key)) { event.preventDefault(); }}} name="price" value={this.state.price} onChange={(e)=> this.setState({price: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-2">
                    <FontAwesomeIcon onClick={this.addElement} icon={faCirclePlus} style={{cursor: "pointer", height: 20, marginTop: 10+'px'}} />
                  </div>
                </div>
                <hr/>
                {listzone.map((val, key) => {
                  return (
                    <div className="mb-3 row">
                      <div className="col-sm-2">
                        Zone: {val}
                      </div>
                      <div className="col-sm-3">
                        ZoneSeat: {listzoneseat[key]} 
                      </div>
                      <div className="col-sm-2">
                        Seat: {listnumber[key]} 
                      </div>
                      <div className="col-sm-3">
                        Price: {listprice[key]} 
                      </div>
                      <div className="col-sm-2"><FontAwesomeIcon onClick={(e)=> this.removeElement(key)} icon={faCircleMinus} style={{cursor: "pointer", height: 20}} /></div>
                    </div>
                  )
                })}
                  
              </div>
              <br/><br/>
              <div className="row box-create">
                <div className="col-sm-6">
                  <div className="dragdropimg">
                    <h3>Drop Your Poster</h3>
                    <FileUploader
                      multiple={true}
                      handleChange={this.setImageP}
                      name="fileposter"
                      types={fileTypes}
                    />
                    <p>{this.state.fp ? `File name: ${this.state.fp[0].name}` : "no files uploaded yet"}</p>
                    <img src={this.state.filePoster} />
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="dragdropimg">
                    <h3>Drop Your Seat</h3>
                    <FileUploader
                      multiple={true}
                      handleChange={this.setImageS}
                      name="fileseat"
                      types={fileTypes}
                    />
                    <p>{this.state.fs ? `File name: ${this.state.fs[0].name}` : "no files uploaded yet"}</p>
                    <img src={this.state.fileSeat} />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-sm-2"><button type="button" onClick={this.clearForm} className="btn btn-primary">Clear</button></div>
                <div className="offset-sm-8 col-sm-2"><button type="button" onClick={this.handleSubmit}  className="btn btn-success">Submit</button></div>
              </div>
            </form>
          </div>
        );
      } else {
        return <img src={require('../img/loading.gif')}/>
      }
    }
  }
   
  export default withRouter(Detail);
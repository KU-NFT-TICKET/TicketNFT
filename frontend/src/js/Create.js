import React from "react";
import ReactDOM from 'react-dom';
import { ethers } from 'ethers'
import Web3 from 'web3';
import $ from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faPlus, faCirclePlus, faCircleMinus} from '@fortawesome/free-solid-svg-icons'
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
import axios from "axios"

import "react-datepicker/dist/react-datepicker.css";
import 'bootstrap/dist/css/bootstrap.min.css';

var hash = require('object-hash');

class Create extends React.Component {
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
      bufferS: null
    }

    this.baseState = this.state 

    this.addElement = this.addElement.bind(this)
    this.removeElement = this.removeElement.bind(this)
    this.setImageP = this.setImageP.bind(this)
    this.setImageS = this.setImageS.bind(this)
    this.clearForm = this.clearForm.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    // this.getEvent = this.getEvent.bind(this)
  }

  async handleSubmit() {
    const web3 = new Web3(window.ethereum);
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);
    const accounts = await provider.listAccounts();

    var q = {query: "select * from Accounts where address = ? and remove_date is null", bind: [accounts[0]]}
    const detailAccount = await axios.post("http://localhost:8800/select", q);

    if(!detailAccount.data) {
      console.log("Need to Activate Account")
      alert("Need to Activate Account!!!")
    } else {
      
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
      // var filePoster = this.state.filePoster
      // var fileSeat = this.state.fileSeat
      var limit = $("input[name=limit]").val()
      var venue = $("input[name=venue]").val()
      if (name && sdate && edate && detail && venue && limit && zone.length > 0 && zoneseat.length > 0 && number.length > 0 && price.length > 0 && bfP && bfS) {
        var all_seat = 0;
        for (var z = 0; z <zone.length; z++){
          all_seat += ((parseInt(zoneseat[z].charCodeAt(0)) - 65) + 1 ) * number[z];
        }
        Swal.fire({
          title: 'Are you sure?',
          text: "Create Event '" + name + "' " + all_seat + " seats",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, Create Event!',
          showLoaderOnConfirm: true,
          preConfirm: async () => {
            console.time('create Event');
            q = {query: "insert into Events (creator, date_event, date_sell, detail, event_name, purchase_limit, venue) values (?, STR_TO_DATE(?,'%Y-%m-%d %H:%i:%s'), STR_TO_DATE(?,'%Y-%m-%d %H:%i:%s'), ?, ?, ?, ?)", 
            bind: [accounts[0], edate, sdate, detail, name, limit, venue]}
            var putItem = await axios.post("http://localhost:8800/insert", q);
            console.log(putItem);
            // var putItem = {data: {insertId: 10}}
            if (putItem.data.insertId !== undefined) {
              var putPoster = uploadPic(bfP, putItem.data.insertId+'.png', 'poster');
              console.log(putPoster);
              var putSeat = uploadPic(bfS, putItem.data.insertId+'.png', '');
              console.log(putSeat);
              for (var z = 0; z < zone.length; z++) {
                for (var i = 65; i <= zoneseat[z].charCodeAt(0); i++) {
                  for (var n = 1; n <= number[z]; n++) {
                    var _priceGas = await provider.getGasPrice();
                    _priceGas = ethers.utils.formatUnits(_priceGas, "wei")
                    var wei_price = price[z] * 1000000000000000000
                    var _metadata = hash({
                        EventName: name, 
                        dateEvent: edate_e,
                        seat: zone[z] + "/" + String.fromCharCode(i) + n.toString(), 
                        price: wei_price, 
                        creater: accounts[0]
                    });
                    try {
                      q = {query: "insert into Seats (event_id, gas, price, seat_id, seat_row, zone, metadata, creator) values (?, ?, ?, ?, ?, ?, ?, ?)", 
                      bind: [putItem.data.insertId, _priceGas, wei_price, n, String.fromCharCode(i), zone[z], _metadata, accounts[0]]}
                      var putTicket = await axios.post("http://localhost:8800/insert", q);
                      console.log(putTicket)
                    } catch (e) {
                      console.log(e)
                    }
                  }
                }
              }
              console.timeEnd('create Event')
              return {err: 0, msg: "insert success"}
            } else {
              alert("db error")
              return {err: 1, msg: "DB Error:" + putItem.err}
            }
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            if (result.value.err === 0) {
              Swal.fire('Create Event: '+ name + ' success', '', 'success')
              window.location.assign("/#");
            } else {
              Swal.fire('Error', result.value.msg, 'error')
            }
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
  }

  componentDidUpdate() {

  }
  
  render() {
    const {listzone, listzoneseat, listnumber, listprice} = this.state;
    const fileTypes = ["JPEG", "PNG", "GIF", "JPG"]
    return (
      <div>
        <h2 style={{color: 'snow'}}>Create Event</h2>
        <br/>
        <form className="row g-3 needs-validation form-style" noValidate >
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
            <div className="mb-3 row">
              <label htmlFor="venue" className="col-sm-2 col-form-label">Venue:</label>
              <div className="col-sm-10">
                <input type="text" className="form-control" id="venue" name="venue"/>
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
  }
}
 
export default Create;
import React from "react";
import { ethers } from 'ethers'
import Web3 from 'web3';
import $ from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCalendarDays, faLocationDot, faClock, faCalendarPlus, faCircleDollarToSlot, faTicket} from '@fortawesome/free-solid-svg-icons'
import DatePicker from 'react-datepicker';
import setHours from "date-fns/setHours";
import setMinutes from "date-fns/setMinutes";
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import addDays from "date-fns/addDays";
import { FileUploader } from "react-drag-drop-files";
import Resizer from "react-image-file-resizer";
import {Buffer} from 'buffer';
import {uploadPic, deletePic} from './fileS3';
import Swal from 'sweetalert2'
import withRouter from './withRouter';
import axios from "axios"
import "react-datepicker/dist/react-datepicker.css";
import 'bootstrap/dist/css/bootstrap.min.css';

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
      this.deleteEvent = this.deleteEvent.bind(this)
      this.seat_check = this.seat_check.bind(this)
    }

    componentDidMount() {
      this.onConnected()
    }
    
    seat_check(event) {
      var is_ck = $(event.target).is(':checked')
      if (is_ck) {
        $(event.target).parent().children("label").children("div").hide()
        $(event.target).parent().children("label").children("img").show()
      } else {
        $(event.target).parent().children("label").children("div").show()
        $(event.target).parent().children("label").children("img").hide()
      }
    }

    async onConnected() {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", []);
      const accounts = await provider.listAccounts();

      var data_detail = {}
      try {
        var q = {query: "select event_id, event_name, date_format(date_sell, '%m/%d/%Y %H:%i') as date_sell, date_format(date_event, '%m/%d/%Y %H:%i') as date_event, date_format(date_sell, '%W %d %M %Y %H:%i') as show_date_sell, date_format(date_event, '%W %d %M %Y') as show_date_event, date_format(date_event, '%H:%i') as show_time_event, detail, purchase_limit, venue from Events where creator = ? and event_id = ?", 
        bind: [accounts[0], this.state.id]}
        const ownEvent = await axios.post("http://localhost:8800/select", q)
        data_detail = ownEvent.data[0]
      } catch(err){
        console.log(err)
      }
      var ticket_detail = []
      var holdseathtml = []
      try {
        var q = {query: "select ticket_id, price, seat_id, seat_row, zone from Seats where creator = ? and event_id = ? order by zone, seat_row, seat_id", 
        bind: [accounts[0], this.state.id]}
        const ownTickett = await axios.post("http://localhost:8800/select", q)
        ticket_detail = ownTickett.data
        var z = ''
        var s = ''
        var head = []
        var row = []
        var body = []
        var col = []
        for (var i = 0; i < ticket_detail.length; i++) {
          if (z !== ticket_detail[i].zone) {
            if (z !== '') {
              row.push((<tr zone={z}><td>{z+s}</td>{col}<td>{z+s}</td></tr>))
              body.push((<div className="tab-pane fade show scrollbar" id={z} role="tabpanel" aria-labelledby="pills-home-tab" tabindex="0">
                          <table className="table table-borderless tableseat">
                            {row}
                          </table>
                        </div>))
              row = []
              col = []
              s = ''
              console.log(body)
            }
            z = ticket_detail[i].zone
            head.push((<li className="nav-item" role="presentation"><button id={z+'_tab'} className="nav-link" data-bs-toggle="pill" data-bs-target={'#'+z} type="button" role="tab" aria-controls={z} aria-expanded="false">Zone: {z}</button></li>))
          } 
          if (s !== ticket_detail[i].seat_row) {
            if (s !== '') {
              row.push((<tr zone={z}><td>{z+s}</td>{col}<td>{z+s}</td></tr>))
              col = []
            }
            s = ticket_detail[i].seat_row
          }
          var s_id = z+''+s+''+ticket_detail[i].ticket_id
          var l_id = 'key:'+z+''+s+''+ticket_detail[i].ticket_id
          col.push((<td>
                  <input className="seat-check" onChange={this.seat_check} name="hold[]" type="checkbox" id={s_id} value={ticket_detail[i].ticket_id}/>
                  <label id={l_id} for={s_id}>
                    <div className="label-seat">{ticket_detail[i].seat_id}</div>
                    <img className="label-seat seat-img-check" src={require('../img/Sign-check-icon.png')} style={{'display': 'none'}}/>
                  </label>
                </td>))
        }
        row.push((<tr zone={z}><td>{z+s}</td>{col}<td>{z+s}</td></tr>))
        body.push((<div className="tab-pane fade show scrollbar" id={z} role="tabpanel" aria-labelledby="pills-home-tab" tabindex="0">
                          <table className="table table-borderless tableseat">
                            {row}
                          </table>
                        </div>))
        holdseathtml.push((
          <ul className="nav nav-pills mb-3" style={{'marginTop': '5px'}} id="pills-tab" role="tablist">
            {head}
          </ul>
        ))
        holdseathtml.push((
          <div className="tab-content" id="pills-tabContent">
            {body}
          </div>
        ))
        console.log(holdseathtml)
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
        seat_count: seat_count,
        sdate: new Date(data_detail.date_sell),
        edate: new Date(data_detail.date_event),
        holdseathtml: holdseathtml
      })
    }
    
    async deleteEvent() {
      const web3 = new Web3(window.ethereum);
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", []);
      const accounts = await provider.listAccounts();
      
      var q = {query: "select * from Accounts as a join Events as e on (a.address = e.creator) where a.address = ? and a.remove_date is null and e.event_id = ?", bind: [accounts[0], this.state.id]}
      const detailAccount = await axios.post("http://localhost:8800/select", q);
  
      if(!detailAccount.data) {
        console.log("Only Creator can Delete Event")
        Swal.fire('Error', "Only Creator can Delete Event", 'error')
      } else {
        var name = $("input[name=name]").val()
        Swal.fire({
          title: 'Are you sure?',
          text: "DELETE Event '" + name + "'",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, Delete Event!',
          showLoaderOnConfirm: true,
          preConfirm: async () => {
            try {
              var q = {query: "delete from Hold_transfer where event_id = ?", 
              bind: [this.state.id]}
              var delHold = await axios.post("http://localhost:8800/insert", q);
              console.log(delHold);

              var q = {query: "delete from Seats where event_id = ?", 
              bind: [this.state.id]}
              var delHold = await axios.post("http://localhost:8800/insert", q);
              console.log(delHold);

              var q = {query: "delete from Events where event_id = ?", 
              bind: [this.state.id]}
              var delHold = await axios.post("http://localhost:8800/insert", q);
              console.log(delHold);

              var delPoster = deletePic(this.state.id+'.png', 'poster');
              console.log(delPoster);
              var delSeat = deletePic(this.state.id+'.png', '');
              console.log(delSeat);
              return {err: 0, msg: 'Delete success'}
            } catch (err) {
              return {err: 1, msg: err}
            }
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            if (result.value.err === 0) {
              Swal.fire('Delete Event: '+ name + ' success', '', 'success')
              window.location.assign("/#");
            } else {
              Swal.fire('Error', result.value.msg, 'error')
            }
          }
        })
      }
    }

    async handleSubmit() {
      const web3 = new Web3(window.ethereum);
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", []);
      const accounts = await provider.listAccounts();
      
      var q = {query: "select * from Accounts as a join Events as e on (a.address = e.creator) where a.address = ? and a.remove_date is null and e.event_id = ?", bind: [accounts[0], this.state.id]}
      const detailAccount = await axios.post("http://localhost:8800/select", q);
  
      if(!detailAccount.data) {
        console.log("Only Creator can edit Event")
        Swal.fire('Error', "Only Creator can edit Event", 'error')
      } else {
        var name = $("input[name=name]").val()
        var sdate = new Date(this.state.sdate).toISOString()
        sdate = format(parseISO(sdate), 'yyyy-MM-dd HH:MM:ss')
        var edate = new Date(this.state.edate).toISOString()
        edate = format(parseISO(edate), 'yyyy-MM-dd HH:MM:ss')
        var detail = $("#des").val()
        var bfP = this.state.bufferP
        var bfS = this.state.bufferS
        var limit = $("input[name=limit]").val()
        var venue = $("input[name=venue]").val()
        if (name && sdate && edate && detail && limit && venue) {
          Swal.fire({
            title: 'Are you sure?',
            text: "Edit Event '" + name + "'",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Edit Event!',
            showLoaderOnConfirm: true,
            preConfirm: async () => {
              console.time('edit Event');
              var q = {query: "update Events set date_event = STR_TO_DATE(?,'%Y-%m-%d %H:%i:%s'), date_sell = STR_TO_DATE(?,'%Y-%m-%d %H:%i:%s'), detail = ?, event_name = ?, purchase_limit = ?, venue = ? where event_id = ? and creator = ?", 
              bind: [edate, sdate, detail, name, limit, venue, this.state.id, accounts[0]]}
              var updateItem = await axios.post("http://localhost:8800/insert", q);
              console.log(updateItem);
              // var putItem = {data: {insertId: 10}}
              if (updateItem.data.affectedRows !== undefined) {
                if (bfP !== null) {
                  var delPoster = deletePic(this.state.id+'.png', 'poster');
                  console.log(delPoster);
                  var putPoster = uploadPic(bfP, this.state.id+'.png', 'poster');
                  console.log(putPoster);
                }
                if (bfS !== null) {
                  console.log('in seat')
                  var delSeat = deletePic(this.state.id+'.png', '');
                  console.log(delSeat);
                  var putSeat = uploadPic(bfS, this.state.id+'.png', '');
                  console.log(putSeat);
                }
                console.timeEnd('edit Event')
                return {err: 0, msg: "edit success"}
              } else {
                alert("db error")
                return {err: 1, msg: "DB Error:" + updateItem.err}
              }
            }
          }).then(async (result) => {
            if (result.isConfirmed) {
              if (result.value.err === 0) {
                Swal.fire('Edit Event: '+ name + ' success', '', 'success')
                window.location.reload(false);
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
    }
    
    render() {
      const {listzone, listzoneseat, listnumber, listprice} = this.state;
      const fileTypes = ["JPEG", "PNG", "GIF", "JPG"]
      var imgurl =  "https://nft-event-picture.s3.ap-northeast-1.amazonaws.com/poster/"+this.state.id+".png"
      var imgurl_seat = "https://nft-event-picture.s3.ap-northeast-1.amazonaws.com/seat/"+this.state.id+".png"
      console.log(this.state)
      let date_ob = new Date();

      if (this.state.data_detail !== undefined && this.state.data_detail.event_name !== undefined && this.state.price_detail !== undefined) {
        var price_detail = []
        for (var i = 0; i < this.state.price_detail.length; i++) {
          price_detail.push(this.state.price_detail[i]['price'])
        }
        var price_show = '~' + price_detail.join(', ~') + ' AVAX'
        var status_event = ''
        var status_txt = ''
        var show_edit = ''
        var display = {}
        if (date_ob <= new Date(this.state.data_detail.date_event)) {
          if (this.state.seat_count.seat_count > 0) {
            if (date_ob >= new Date(this.state.data_detail.date_sell) ) {
              // ticket on sell
              status_event = 'status-event status-on'
              status_txt = 'ON SELL'
              show_edit = 'disabled'
              display = {'display': 'none'}
            } else {
              status_event = 'status-event status-hold'
              status_txt = 'NOT AVAILABLE'
            }
          } else {
            status_event = 'status-event status-off'
            status_txt = 'SOLD OUT'
            show_edit = 'disabled'
            display = {'display': 'none'}
          }
        } else {
          status_event = 'status-event status-off'
          status_txt = 'EVENT CLOSE'
          show_edit = 'disabled'
          display = {'display': 'none'}
        }
        return (
          <div>
            <br/>
            <div className="row" style={{color: 'white'}}>
              <div className="col-sm-8" style={{'text-align': 'left', 'position': 'relative'}}>
                <h1>{this.state.data_detail.event_name}</h1>
                <span>{this.state.data_detail.detail}</span>
                <div className="row div-event" style={{'position': 'absolute', 'bottom': '0px'}}>
                  <div className="col-sm-6">
                    <ul className="event-ul">
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarDays} style={{height: 20, marginTop: 10+'px'}}/></div>
                        <div className="col-sm-11">
                          <small className="small-color">Show Date</small>
                          <div>{this.state.data_detail.show_date_event}</div>
                        </div>
                      </li>
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faLocationDot} style={{height: 20, marginTop: 10+'px'}}/></div>
                          <div className="col-sm-11">
                          <small className="small-color">Venue</small>
                          <div>{this.state.data_detail.venue}</div>
                        </div>
                      </li>
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faClock} style={{height: 20, marginTop: 10+'px'}}/></div>
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
                        <div className="col-sm-1"><FontAwesomeIcon icon={faCalendarPlus} style={{height: 20, marginTop: 10+'px'}}/></div>
                        <div className="col-sm-11">
                          <small className="small-color">Public Sale</small>
                          <div>{this.state.data_detail.show_date_sell}</div>
                        </div>
                      </li>
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faCircleDollarToSlot} style={{height: 20, marginTop: 10+'px'}}/></div>
                          <div className="col-sm-11">
                          <small className="small-color">Ticket Price</small>
                          <div>{price_show}</div>
                        </div>
                      </li>
                      <li className="row">
                        <div className="col-sm-1"><FontAwesomeIcon icon={faTicket} style={{height: 20, marginTop: 10+'px'}}/></div>
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
                <div style={{"backgroundImage": "url("+imgurl+")", 
                "background-size": "contain","width": "100%","height": 300+"px","background-repeat": 'no-repeat'}}></div>
              </div>
            </div>
            <br/>
            <div className="form-style">
              <ul class="nav nav-tabs" id="event" role="tablist">
                <li class="nav-item" role="presentation">
                  <button className="nav-link active" id="detail-tab" data-bs-toggle="tab" data-bs-target="#detail-tab-pane" type="button" role="tab" aria-controls="home-tab-pane" aria-selected="true">Detail</button>
                </li>
                <li class="nav-item" role="presentation">
                  <button className="nav-link"  id="ticket-tab" data-bs-toggle="tab" data-bs-target="#ticket-tab-pane" type="button" role="tab" aria-controls="profile-tab-pane" aria-selected="false">Tickets</button>
                </li>
              </ul>
              <div className="tab-content" id="eventContent">
                <div className="tab-pane fade show active" id="detail-tab-pane" role="tabpanel" aria-labelledby="detail-tab" tabIndex="0">
                  <br />
                  <div className="row">
                    <button type="button" onClick={this.deleteEvent}  className="btn btn-danger col-sm-2 offset-sm-10">DELETE EVENT</button>
                  </div>
                  <br />
                  <form className="row g-3 needs-validation" noValidate >
                    <div className="col-sm-6 box-create">
                      <div className="mb-3 row">
                        <label htmlFor="name" className="col-sm-2 col-form-label">Event Name:</label>
                        <div className="col-sm-10">
                          <input type="text" className="form-control" id="name" name="name" defaultValue={this.state.data_detail.event_name} disabled={show_edit}/>
                        </div>
                      </div>
                      <div className="mb-3 row">
                        <label htmlFor="des" className="col-sm-2 col-form-label">Description:</label>
                        <div className="col-sm-10">
                          <textarea className="form-control" id="des" name="des" disabled={show_edit} defaultValue={this.state.data_detail.detail}></textarea>
                        </div>
                      </div>
                      <div className="mb-3 row">
                        <label htmlFor="limit" className="col-sm-2 col-form-label">User limit buy:</label>
                        <div className="col-sm-10">
                          <input type="text" className="form-control" disabled={show_edit} defaultValue={this.state.data_detail.purchase_limit} style={{width: 100+'px'}} onKeyPress={(event) => { if (!/[0-9 .]/.test(event.key)) { event.preventDefault(); }}} id="limit" name="limit"/>
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
                            disabled={show_edit}
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
                            disabled={show_edit}
                          />
                          </div>
                        </div>
                      </div>
                      <div className="mb-3 row">
                        <label htmlFor="venue" className="col-sm-2 col-form-label">Venue:</label>
                        <div className="col-sm-10">
                          <input type="text" className="form-control" disabled={show_edit} defaultValue={this.state.data_detail.venue} id="venue" name="venue"/>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-5 box-create">
                      <h3 style={{'textAlign': 'left'}}>Seat</h3>
                      <div style={{"backgroundImage": "url("+imgurl_seat+")", 
                        "background-size": "contain","width": "100%","height": 300+"px","background-repeat": 'no-repeat'}}>
                      </div>
                    </div>
                    <br/><br/>
                    <div className="row box-create" style={display}>
                      <div className="col-sm-6">
                        <div className="dragdropimg">
                          <h3>Drop Your New Poster</h3>
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
                          <h3>Drop Your New Seat</h3>
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
                    <div className="row" style={display}>
                      <div className="col-sm-2"><button type="button" onClick={this.clearForm} className="btn btn-primary">Clear</button></div>
                      <div className="offset-sm-8 col-sm-2"><button type="button" onClick={this.handleSubmit}  className="btn btn-success">Submit</button></div>
                    </div>
                  </form>
                </div>
                <div className="tab-pane fade" id="ticket-tab-pane" role="tabpanel" aria-labelledby="ticket-tab" tabIndex="0">
                  <div style={{'backgroundColor': 'black'}}>
                    {this.state.holdseathtml}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        return <img src={require('../img/loading.gif')}/>
      }
    }
  }
   
  export default withRouter(Detail);
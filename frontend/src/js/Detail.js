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
import "react-datepicker/dist/react-datepicker.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { compose } from "redux";
import { connect } from "react-redux";
import { decode_thaiID } from '../features/function'

axios.defaults.headers.common['Authorization'] = process.env.REACT_APP_API_TOKEN

class Detail extends React.Component {
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
    this.clearForm = this.clearForm.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.onConnected = this.onConnected.bind(this)
    this.deleteEvent = this.deleteEvent.bind(this)
    this.seat_check = this.seat_check.bind(this)
    this.actionHold = this.actionHold.bind(this)
    this.actionTransfer = this.actionTransfer.bind(this)
    this.searchUser =this.searchUser.bind(this)
  }

  componentDidMount() {
    this.onConnected()
    console.log(this.props)
  }

  async searchUser(event) {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);
    const accounts = await provider.listAccounts();
    var card = $("input[name='id_card']").val()
    var ck = false
    var use_list = {}
    var seat_use = {}
    var code_thai_id = this.state.thaiID[card]
    if (code_thai_id in this.state.use_list) {
      var _ticket = this.state.use_list[code_thai_id]
      ck = true
      let html_table = '<table class="table"><thead><tr><th>Zone</th><th>Row</th><th>Seat</th></tr></thead><tbody>'
      for (var j = 0; j < _ticket.length; j++) {
        html_table += '<tr><td>'+_ticket[j].zone+'</td><td>'+_ticket[j].seat_row+'</td><td>'+_ticket[j].zone+_ticket[j].seat_row+_ticket[j].seat_id+'</td></tr>'
      }
      html_table += '</tbody></table>'
      Swal.fire({
        title: 'Confirm use all Tickets',
        text: "You won't be able to revert this!",
        icon: 'warning',
        html: html_table,
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Use it!'
      }).then(async (result) => {
        if (result.isConfirmed) {
          var q = {
            query: "update Seats set is_use = ? where transaction is not null and is_use is null and event_id = ? and owner = (select Address from Accounts where thai_id = ?)",
            bind: ['U', this.state.id, code_thai_id]
          }
          var use_ticket = await axios.post(process.env.REACT_APP_API_BASE_URL+"/select", q)
          var q = {
            query: "select s.ticket_id, s.seat_id, s.seat_row, s.zone, s.owner, s.is_use, a.thai_id from Seats s left join Accounts a on (s.owner = a.address) where s.event_id = ? and s.creator = ? and s.transaction is not null and s.is_use is null order by s.zone, s.seat_row, s.seat_id",
            bind: [this.state.id, accounts[0]]
          }
          const ownSeatUse = await axios.post(process.env.REACT_APP_API_BASE_URL+"/select", q)
          seat_use = ownSeatUse.data
          for (var i = 0; i < seat_use.length; i++) {
            if (use_list[seat_use[i].thai_id] === undefined) {
              use_list[seat_use[i].thai_id] = []
            }
            use_list[seat_use[i].thai_id].push(seat_use[i])
          }
          this.setState({
            use_list: use_list
          })
          Swal.fire(
            'Used it!',
            'Your Tickets has been used.',
            'success'
          )
        }
      })
    } else {
      console.log("this id card don't have ticket for this event")
      Swal.fire('This Id card don\'t have ticket in this event', '', 'warning')
    }
  }

  actionTransfer(event) {
    var values = []
    $("input[name='reciever[]']").each(function () {
      if ($(this)[0].value !== "" && $(this)[0].value !== undefined) {
        values.push({ id: $(this).parent()[0].id, val: $(this)[0].value })
      }
    });
    if (values.length === 0) {
      Swal.fire('Please enter the username', '', 'warning')
    } else {
      Swal.fire({
        title: 'Are you sure?',
        html: 'Confirm to transfer tickets of Event <br/><p style="color: red;">**after confirm can\'t change anything**</p>',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Transfer Tickets!',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            for (var i = 0; i < values.length; i++) {
              var q = {bind: [values[i].val, values[i].id, this.state.id]}
              var transferHold = await axios.post(process.env.REACT_APP_API_BASE_URL+"/update_hold_transfer", q)
            }
            return { err: 0, msg: 'Insert success' }
          } catch (err) {
            return { err: 1, msg: err }
          }
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          if (result.value.err === 0) {
            Swal.fire('Transfer Ticket:  success', '', 'success')
            window.location.reload(false);
          } else {
            Swal.fire('Error', result.value.msg, 'error')
          }
        }
      })
    }
  }

  actionHold(event) {
    // เหลือ check ว่ามี reciever แล้วต้องไม่สามารถ unhold ได้
    var text = []
    if (this.state.holdTicket.length === 0) {
      Swal.fire('Please select at least one ticket to hold', '', 'warning')
    } else {
      for (var i = 0; i < this.state.holdTicket.length; i++) {
        text.push(this.state.tickets[this.state.holdTicket[i]].id)
      }
      text.sort()
      Swal.fire({
        title: 'Are you sure?',
        text: "Confirm hold ticket Event \n[" + text.join(', ') + "]",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Hold Ticket!',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            var q = {bind: [this.state.id]}
            var updateHold = await axios.post(process.env.REACT_APP_API_BASE_URL+"/unhold_tickets_of_event", q)
            var q = {bind: [this.state.id]}
            var delHold = await axios.post(process.env.REACT_APP_API_BASE_URL+"/delete_hold_of_event", q)
            for (var i = 0; i < this.state.holdTicket.length; i++) {
              var q = {bind: [this.state.holdTicket[i], this.state.id, this.state.tickets[this.state.holdTicket[i]].zone]}
              var insertHold = await axios.post(process.env.REACT_APP_API_BASE_URL+"/create_holdTicket_of_event", q)
            }
            var q = {bind: [this.state.id]}
            var updateHold = await axios.post(process.env.REACT_APP_API_BASE_URL+"/update_holdSeats_of_event", q)
            return { err: 0, msg: 'Insert success' }
          } catch (err) {
            return { err: 1, msg: err }
          }
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          if (result.value.err === 0) {
            Swal.fire('Insert Hold:  success', '', 'success')
            window.location.reload(false);
          } else {
            Swal.fire('Error', result.value.msg, 'error')
          }
        }
      })
    }
  }

  seat_check(event) {
    var is_ck = $(event.target).is(':checked')
    let temp = this.state.holdTicket
    if (is_ck) {
      $(event.target).parent().children("label").children("div").hide()
      $(event.target).parent().children("label").children("img").show()
      temp.push($(event.target).val())
    } else {
      $(event.target).parent().children("label").children("div").show()
      $(event.target).parent().children("label").children("img").hide()
      const index = temp.indexOf($(event.target).val());
      if (index > -1) { // only splice array when item is found
        temp.splice(index, 1); // 2nd parameter means remove one item only
      }
      console.log(temp)
    }
    this.setState({ holdTicket: temp })
  }

  async onConnected() {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);
    const accounts = await provider.listAccounts();

    var data_detail = {}
    try {
      var q = {bind: [accounts[0], this.state.id]}
      const ownEvent = await axios.post(process.env.REACT_APP_API_BASE_URL+"/event_of_account", q)
      data_detail = ownEvent.data[0]
    } catch (err) {
      console.log(err)
    }
    var ticket_detail = []
    var holdseathtml = []
    var _holdticket = []
    try {
      var q = {bind: [accounts[0], this.state.id]}
      const ownTickett = await axios.post(process.env.REACT_APP_API_BASE_URL+"/my_hold_seats", q)
      ticket_detail = ownTickett.data
      var z = ''
      var s = ''
      var head = []
      var row = []
      var body = []
      var col = []
      var show = 'active show'
      var key = {}
      for (var i = 0; i < ticket_detail.length; i++) {
        if (z !== ticket_detail[i].zone) {
          if (z !== '') {
            row.push((<tr zone={z}><td>{z + s}</td>{col}<td>{z + s}</td></tr>))
            body.push((<div className={"tab-pane fade scrollbar " + show} style={{ 'height': '300px' }} id={z} role="tabpanel" aria-labelledby="pills-home-tab" tabIndex="0">
              <table className="table table-borderless tableseat">
                {row}
              </table>
            </div>))
            show = ''
            row = []
            col = []
            s = ''
          }
          z = ticket_detail[i].zone
          head.push((<li className="nav-item" role="presentation"><button id={z + '_tab'} className={"nav-link " + show} data-bs-toggle="pill" data-bs-target={'#' + z} type="button" role="tab" aria-controls={z} aria-expanded="false">Zone: {z}</button></li>))
        }
        if (s !== ticket_detail[i].seat_row) {
          if (s !== '') {
            row.push((<tr zone={z}><td>{z + s}</td>{col}<td>{z + s}</td></tr>))
            col = []
          }
          s = ticket_detail[i].seat_row
        }
        var s_id = z + '' + s + '' + ticket_detail[i].ticket_id
        var l_id = 'key:' + z + '' + s + '' + ticket_detail[i].ticket_id
        key[ticket_detail[i].ticket_id] = { id: z + '' + s + '' + ticket_detail[i].seat_id, zone: z }
        var disabled = ''
        var display_div = { 'display': 'none' }
        var display_img = { 'display': 'none' }
        var checked = false
        if (ticket_detail[i].reciever) {
          disabled = 'disabled'
        }
        if (ticket_detail[i].eventid) {
          display_img = {}
          _holdticket.push(ticket_detail[i].ticket_id.toString())
          checked = true
        } else {
          display_div = {}
          checked = false
        }
        col.push((<td>
          <input className="seat-check" defaultChecked={checked} disabled={disabled} onChange={this.seat_check} name="hold" type="checkbox" id={s_id} value={ticket_detail[i].ticket_id} />
          <label id={l_id} htmlFor={s_id}>
            <div className="label-seat" style={display_div}>{ticket_detail[i].seat_id}</div>
            <img className="label-seat seat-img-check" src={require('../img/Sign-check-icon.png')} style={display_img} />
          </label>
        </td>))
      }
      row.push((<tr zone={z}><td>{z + s}</td>{col}<td>{z + s}</td></tr>))
      body.push((<div className="tab-pane fade show scrollbar" id={z} role="tabpanel" aria-labelledby="pills-home-tab" tabIndex="0">
        <table className="table table-borderless tableseat">
          {row}
        </table>
      </div>))
      holdseathtml.push((
        <ul className="nav nav-pills mb-3" style={{ 'marginTop': '5px' }} id="pills-tab" role="tablist">
          {head}
        </ul>
      ))
      holdseathtml.push((
        <div className="tab-content bg-black" id="pills-tabContent">
          {body}
        </div>
      ))
    } catch (err) {
      console.log(err)
    }

    var htmlTran = []
    try {
      var q = {bind: [accounts[0]]}
      const ownUser = await axios.post(process.env.REACT_APP_API_BASE_URL+"/all_accounts_except", q)
      var user_app = ownUser.data
      const options = []
      for (var i = 0; i < user_app.length; i++) {
        options.push({ value: user_app[i].address, label: user_app[i].username })
      }
      var q = {bind: [this.state.id]}
      const ownTrans = await axios.post(process.env.REACT_APP_API_BASE_URL+"/giveAway_seats_of_event", q)
      var transfer_data = ownTrans.data
      var thead = [<thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Ticket</th>
          <th scope="col">reciever</th>
        </tr>
      </thead>]
      var body = []
      for (var i = 0; i < transfer_data.length; i++) {
        if (transfer_data[i].username == null) {
          body.push(<tr>
            <td>{i + 1}</td>
            <td>{transfer_data[i].zone + transfer_data[i].seat_row + transfer_data[i].seat_id}</td>
            <td><Select
              className="basic-single"
              classNamePrefix="select"
              isSearchable="true"
              isClearable="true"
              name="reciever[]"
              id={transfer_data[i].ticket_id.toString()}
              options={options}
            />
            </td>
          </tr>)
        } else {
          body.push(<tr>
            <td>{i + 1}</td>
            <td>{transfer_data[i].zone + transfer_data[i].seat_row + transfer_data[i].seat_id}</td>
            <td><Select
              value={{ value: transfer_data[i].reciever, label: transfer_data[i].username }}
              className="basic-single"
              classNamePrefix="select"
              isDisabled="true"
              options={options}
            />
            </td>
          </tr>)
        }
      }
      var tbody = <tbody>{body}</tbody>
      htmlTran.push(<table className="table" style={{ "width": "60%", 'margin': 'auto' }}>
        {thead}
        {tbody}
      </table>)

    } catch (err) {
      console.log(err)
    }

    var price_detail = []
    try {
      var q = {bind: [this.state.id]}
      const ownPrice = await axios.post(process.env.REACT_APP_API_BASE_URL+"/seat_prices_of_event", q)
      price_detail = ownPrice.data
    } catch (err) {
      console.log(err)
    }

    var seat_count = {}
    try {
      var q = {bind: [this.state.id]}
      const ownSeatCount = await axios.post(process.env.REACT_APP_API_BASE_URL+"/available_seatCount_of_event", q)
      seat_count = ownSeatCount.data[0]
    } catch (err) {
      console.log(err)
    }

    var seat_use = {}
    var address = []
    var use_list = {}
    try {
      var q = {bind: [this.state.id, accounts[0]]}
      const ownSeatUse = await axios.post(process.env.REACT_APP_API_BASE_URL+"/available_seats_of_event", q)
      seat_use = ownSeatUse.data
      for (var i = 0; i < seat_use.length; i++) {
        if (seat_use[i].owner !== null && !address.includes(seat_use[i].owner)) {
          address.push(seat_use[i].owner)
        }
        if (use_list[seat_use[i].thai_id] === undefined) {
          use_list[seat_use[i].thai_id] = []
        }
        use_list[seat_use[i].thai_id].push(seat_use[i])
      }
    } catch (err) {
      console.log(err)
    }

    try {
      const thai_id_rst = await axios.get(process.env.REACT_APP_API_BASE_URL+"/accounts/all", q)
      console.log("find_thai_id")
      console.log(thai_id_rst)

      var decrypted_thaiID = {};
      for (const data of thai_id_rst.data) {
        var thai_id_row = decode_thaiID(data['thai_id'], data['Address'])
        decrypted_thaiID[thai_id_row] = data['thai_id'];
      }
      console.log(decrypted_thaiID)
    } catch (err) {
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
      holdseathtml: holdseathtml,
      tickets: key,
      holdTicket: _holdticket,
      htmlTran: htmlTran,
      address: address,
      use_list: use_list,
      thaiID: decrypted_thaiID
    })
  }

  async deleteEvent() {
    const web3 = new Web3(window.ethereum);
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);
    const accounts = await provider.listAccounts();

    var q = {bind: [accounts[0], this.state.id]}
    const detailAccount = await axios.post(process.env.REACT_APP_API_BASE_URL+"/is_event_owner", q);

    if (!detailAccount.data) {
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
            var q = {bind: [this.state.id]}
            var delHold = await axios.post(process.env.REACT_APP_API_BASE_URL+"/delete_event", q);
            console.log(delHold);

            var delPoster = deletePic(this.state.id + '.png', 'poster');
            console.log(delPoster);
            var delSeat = deletePic(this.state.id + '.png', '');
            console.log(delSeat);
            return { err: 0, msg: 'Delete success' }
          } catch (err) {
            return { err: 1, msg: err }
          }
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          if (result.value.err === 0) {
            Swal.fire('Delete Event: ' + name + ' success', '', 'success')
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

    var q = {bind: [accounts[0], this.state.id]}
    const detailAccount = await axios.post(process.env.REACT_APP_API_BASE_URL+"/is_event_owner", q);

    if (!detailAccount.data) {
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
            var q = {bind: [edate, sdate, detail, name, limit, venue, this.state.id, accounts[0]]}
            var updateItem = await axios.post(process.env.REACT_APP_API_BASE_URL+"/update_event", q);
            console.log(updateItem);
            // var putItem = {data: {insertId: 10}}
            if (updateItem.data.affectedRows !== undefined) {
              if (bfP !== null) {
                var delPoster = deletePic(this.state.id + '.png', 'poster');
                console.log(delPoster);
                var putPoster = uploadPic(bfP, this.state.id + '.png', 'poster');
                console.log(putPoster);
              }
              if (bfS !== null) {
                var delSeat = deletePic(this.state.id + '.png', '');
                console.log(delSeat);
                var putSeat = uploadPic(bfS, this.state.id + '.png', '');
                console.log(putSeat);
              }
              console.timeEnd('edit Event')
              return { err: 0, msg: "edit success" }
            } else {
              alert("db error")
              return { err: 1, msg: "DB Error:" + updateItem.err }
            }
          }
        }).then(async (result) => {
          if (result.isConfirmed) {
            if (result.value.err === 0) {
              Swal.fire('Edit Event: ' + name + ' success', '', 'success')
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

  render() {
    const { listzone, listzoneseat, listnumber, listprice } = this.state;
    const fileTypes = ["JPEG", "PNG", "GIF", "JPG"]
    var imgurl = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/poster/" + this.state.id + ".png"
    var imgurl_seat = "https://"+process.env.REACT_APP_S3_BUCKET+".s3."+process.env.REACT_APP_S3_REGION+".amazonaws.com/seat/" + this.state.id + ".png"
    console.log(this.state)
    let date_ob = new Date();
    if (this.props.account_detail.isLogin) {
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
              <h1>{this.state.data_detail.event_name}</h1>
              <span>{this.state.data_detail.detail}</span>
            </div>
            <div className="row" style={{ color: 'white' }}>
              <div className="col-sm-6 offset-sm-1" style={{ textAlign: 'left', 'position': 'relative' }}>  
                <div className="row div-event" style={{ 'position': 'absolute'}}>
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
              <div className="col-sm-4 offset-sm-1">
                <div style={{
                  "backgroundImage": "url(" + imgurl + ")",
                  backgroundSize: "contain", "width": "100%", "height": 300 + "px", backgroundRepeat: 'no-repeat'
                }}></div>
              </div>
            </div>
            <br />
            <div className="form-style">
              <ul className="nav nav-tabs" id="event" role="tablist">
                <li className="nav-item" role="presentation">
                  <button className="nav-link active" id="detail-tab" data-bs-toggle="tab" data-bs-target="#detail-tab-pane" type="button" role="tab" aria-controls="home-tab-pane" aria-selected="true">Detail</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link" id="ticket-tab" data-bs-toggle="tab" data-bs-target="#hold-ticket-tab-pane" type="button" role="tab" aria-controls="ticket-tab-pane" aria-selected="false">Hold Tickets</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link" id="transfer-tab" data-bs-toggle="tab" data-bs-target="#transfer-ticket-tab-pane" type="button" role="tab" aria-controls="transfer-tab-pane" aria-selected="false">Transfer Ticket</button>
                </li>
                <li className="nav-item" role="presentation">
                  <button className="nav-link" id="use-tab" data-bs-toggle="tab" data-bs-target="#use-ticket-tab-pane" type="button" role="tab" aria-controls="use-tab-pane" aria-selected="false">Use Ticket</button>
                </li>
              </ul>
              <div className="tab-content" id="eventContent">
                <div className="tab-pane fade show active" id="detail-tab-pane" role="tabpanel" aria-labelledby="detail-tab" tabIndex="0">
                  <br />
                  <div className="row">
                    <button type="button" onClick={this.deleteEvent} className="btn btn-danger col-sm-2 offset-sm-10">DELETE EVENT</button>
                  </div>
                  <br />
                  <form className="row g-3 needs-validation" noValidate >
                    <div className="col-sm-6 box-create">
                      <div className="mb-3 row">
                        <label htmlFor="name" className="col-sm-2 col-form-label">Event Name:</label>
                        <div className="col-sm-10">
                          <input type="text" className="form-control" id="name" name="name" defaultValue={this.state.data_detail.event_name} disabled={show_edit} />
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
                          <input type="text" className="form-control" disabled={show_edit} defaultValue={this.state.data_detail.purchase_limit} style={{ width: 100 + 'px' }} onKeyPress={(event) => { if (!/[0-9 .]/.test(event.key)) { event.preventDefault(); } }} id="limit" name="limit" />
                        </div>
                      </div>
                      <div className="mb-3 row">
                        <label htmlFor="sdate" className="col-sm-2 col-form-label">Sell date:</label>
                        <div className="col-sm-4">
                          <div className='form-group' id='sdate'>
                            <DatePicker
                              selected={this.state.sdate}
                              onChange={(e) => this.setState({ sdate: e })}
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
                              onChange={(e) => this.setState({ edate: e })}
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
                          <input type="text" className="form-control" disabled={show_edit} defaultValue={this.state.data_detail.venue} id="venue" name="venue" />
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-5 box-create">
                      <h3 style={{ 'textAlign': 'left' }}>Seat</h3>
                      <div style={{
                        "backgroundImage": "url(" + imgurl_seat + ")",
                        backgroundSize: "contain", "width": "100%", "height": 300 + "px", backgroundRepeat: 'no-repeat'
                      }}>
                      </div>
                    </div>
                    <br /><br />
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
                          <p>{this.state.fs ? `File bottonname: ${this.state.fs[0].name}` : "no files uploaded yet"}</p>
                          <img src={this.state.fileSeat} />
                        </div>
                      </div>
                    </div>
                    <div className="row" style={display}>
                      <div className="col-sm-2"><button type="button" onClick={this.clearForm} className="btn btn-primary">Clear</button></div>
                      <div className="offset-sm-8 col-sm-2"><button type="button" onClick={this.handleSubmit} className="btn btn-success">Submit</button></div>
                    </div>
                  </form>
                </div>
                <div className="tab-pane fade" id="hold-ticket-tab-pane" role="tabpanel" aria-labelledby="ticket-tab" tabIndex="0">
                  <div>
                    <form>
                      {this.state.holdseathtml}
                      <br />
                      <button type="button" onClick={this.actionHold} style={display} className="btn btn-warning col-sm-2 offset-sm-10">Confirm Hold</button>
                    </form>
                  </div>
                </div>
                <div className="tab-pane fade" id="transfer-ticket-tab-pane" role="tabpanel" aria-labelledby="ticket-tab" tabIndex="0">
                  <div style={{ 'height': '400px', 'overflow': 'auto' }}>
                    {this.state.htmlTran}
                    <br />
                  </div>
                  <button type="button" onClick={this.actionTransfer} style={display_trans} className="btn btn-warning col-sm-2 offset-sm-10">Confirm Transfer</button>
                </div>
                <div className="tab-pane fade" id="use-ticket-tab-pane" role="tabpanel" aria-labelledby="ticket-tab" tabIndex="0">
                  <div className="search_user">
                    <form>
                      <div className="input-group">
                        <input type="text" className="form-control" name="id_card" id="id_card" placeholder="ID Card..." />
                      </div>
                      <br/>
                      <div>
                        <button type="button" onClick={this.searchUser} className="btn btn-primary">Search...</button>
                      </div>
                    </form>
                  </div>
                  <div>
                    {this.state.htmlUse}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        return <img src={require('../img/loading.gif')} />
      }
    } else {
      return (
        <div className="card mb-3 panel-style">
          <div className="card-body">
            <h5 className="card-title">Welcome to NFT Ticket</h5>
            <p className="card-text">Please Login manage your events.</p>
          </div>
        </div>
      );
    }
  }
}

const mapStateToProps = (state, ownProps) => ({
  account_detail: state.account,
  id: ownProps.params.id
});

export default compose(
  withRouter,
  connect(mapStateToProps)
)(Detail);
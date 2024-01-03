import React from 'react'
import $ from 'jquery';
import axios from "axios"
import { connect } from "react-redux";
import { updateAllEvents } from '../features/events/eventSlice';
import EventBox from '../components/EventBox'

export class Events extends React.Component {
  constructor () {
    super()
    this.state = {}
  }

  async get_events() {
    // const allEvent = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events")
    const allEvent = await axios.get(process.env.REACT_APP_API_BASE_URL+"/events?is_selling=true")
    console.log("allEvent:")
    console.log(allEvent)
    this.props.dispatch(updateAllEvents(allEvent.data))
  }

  componentDidMount() {
    this.get_events()
  }

  render () {
    if (Object.keys(this.props.events.all_events).length > 0) {
      let eventBoxList = Object.keys(this.props.events.all_events).map((event_id)=>{
        return <EventBox detail={this.props.events.all_events[event_id]} />
      })
      return (
        <div>
          <h1 style={{color: 'snow'}}>EVENTS</h1>
          <div className="row">
          {eventBoxList}
          </div>
        </div>
      )
    } else {
      return (
        <div>
          <h1 style={{color: 'snow'}}>EVENTS</h1>
          <div className="card mb-3 panel-style">
            <div className="card-body">
              <h5 className="card-title">Welcome to NFT Ticket</h5>
              <p className="card-text">There are no available events at the moment.</p>
            </div>
          </div>
        </div>
      )
    }
  }

}

const mapStateToProps = (state) => ({
  account_detail: state.account,
  events: state.events
});

export default connect(mapStateToProps)(Events);


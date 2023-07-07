import './App.css'

import React from 'react'
import { ethers } from 'ethers'
import {
  Route,
  NavLink,
  HashRouter,
  Routes,
  useParams
} from "react-router-dom";
import 'bootstrap/dist/js/bootstrap.bundle';

import Home from "./js/Home";
import Create from "./js/Create";
import Detail from "./js/Detail";
import Profile from "./js/Profile";

// Import App components
import OnboardingButton from './components/Onboarding'

class App extends React.Component {
  constructor() {
    super()

    this.state = {
      contractMaket: null,
      contractAccount: null, 
      contractEvent: null,
    }

    // this.isExistAccount = this.isExistAccount.bind(this)
  
  }

  componentWillUnmount() {
    if (this.state.messageInterval) {
      clearInterval(this.state.messageInterval)
    }
  }


  render() {
    return (
      <HashRouter>
      <div className="App body-style">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container-fluid">
            <a className="navbar-brand" href="#">
              <img style={{width: 4 +'rem'}} src={require('./img/brand_ticket.png')} />
            </a>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarText"
              aria-controls="navbarText"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarText">
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                <NavLink to="/" className="nav-link">Home</NavLink>
                </li>
                <li className="nav-item">
                <NavLink to="/create" className="nav-link">Create</NavLink>
                </li>
              </ul>
              <OnboardingButton/>
            </div>
          </div>
        </nav>
        <div className="content container">
          <Routes>
            <Route exact path="/" element={<Home/>}/>
            <Route path="/create" element={<Create/>}/>
            <Route path="/detail/:id" element={<Detail/>}/>
            <Route path="/profile" element={<Profile/>}/>
          </Routes>
        </div>
      </div>
      </HashRouter>
    )
  }
}

export default App

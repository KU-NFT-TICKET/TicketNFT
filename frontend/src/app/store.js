import { configureStore } from '@reduxjs/toolkit'
import counterReducer from '../features/counter/counterSlice'
import accountSlicer from '../features/account/accountSlicer'
import eventSlicer from '../features/events/eventSlicer'

export default configureStore({
  reducer: {
  	counter: counterReducer,
  	account: accountSlicer,
  	events: eventSlicer
  }
})
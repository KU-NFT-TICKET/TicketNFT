import { createSlice } from '@reduxjs/toolkit'

export const eventSlice = createSlice({
  name: 'events',
  initialState: {
    all_events: [],
  },
  reducers: {
    updateAllEvents: (state, action) => {
      state.all_events = action.payload
    }
    
  }
})

// Action creators are generated for each case reducer function
export const { 
  updateAllEvents
} = eventSlice.actions

export default eventSlice.reducer
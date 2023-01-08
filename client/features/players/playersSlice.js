import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const playersFromServer = createAsyncThunk('/api/players', async(playerName)=>{
    try {
        const response = await axios.put('/api/players',{playerName})
        //console.log('axios:',response.data)
        return response.data
    }
    catch (err) {

    }
})

export const logoutFromServer = createAsyncThunk('/api/players/logout', async(playerName)=>{
  try {
      const response = await axios.put('/api/players/logout',{playerName})
      console.log('axios:',response.data)
      return response.data
  }
  catch (err) {

  }
})

export const queueGameRequest = createAsyncThunk('/api/players/gameRequest', async(gameInfo)=>{

  //console.log('zzzzzzzzzzzzzzz', gameInfo)
  try {
    const response = await axios.put('/api/players/gameRequest',{gameInfo})

    //console.log(response.data)
    return response.data
  }
  catch (err) {

  }
})

export const playGame = createAsyncThunk('/api/players/playGame', async (playerName)=>{
  try {
    const response = await axios.put('/api/players/playGame',{playerName})
    //console.log('zzzzzzzzzzzz',response.data)
    return response.data
  }
  catch (err) {

  }
}) 

export const cancelRequest = createAsyncThunk('/api/players/cancelRequest', async(playerName)=>{
  try {
    const response = await axios.put('/api/players/cancelRequest',{playerName})
    return response.data
  }
  catch (err) {

  }

} )

export const executeTurn = createAsyncThunk('/api/players/executeTurn', async(obj)=>{

  try {
    console.log('playerSlice',obj)
    const response = await axios.put('/api/players/executeTurn',obj)
    return response.data
  } 
  catch(err) {

  }   
})

export const endGame  = createAsyncThunk('/api/players/endGame', async(obj)=>{
  try {
    const response = await axios.put('/api/players/endGame',obj)
    console.log('zzzzzzzzzz endGame',response.data)
    return response.data
  } 
  catch(err) {

  }   
})

export const playersSlice = createSlice({
  name: 'players',
  initialState: {
    loggedInPlayers: {}
  },
  reducers: {

  },

  extraReducers: (builder) => {
    builder.addCase(playersFromServer.fulfilled,(state,action)=>{
      state.loggedInPlayers = action.payload
    }),
    builder.addCase(logoutFromServer.fulfilled,(state,action)=>{
      state.loggedInPlayers = action.payload
    })
    builder.addCase(queueGameRequest.fulfilled,(state,action)=>{
      state.loggedInPlayers = action.payload
    })
    builder.addCase(playGame.fulfilled,(state,action)=>{
      state.loggedInPlayers = action.payload
    })
    builder.addCase(executeTurn.fulfilled,(state,action)=>{
      state.loggedInPlayers = action.payload
    })
    builder.addCase(endGame.fulfilled,(state,action)=>{
      state.loggedInPlayers = action.payload
    })
    builder.addCase(cancelRequest.fulfilled,(state,action)=>{
      state.loggedInPlayers = action.payload
    })

  },

});

export default playersSlice.reducer;

import { configureStore } from '@reduxjs/toolkit';
import logger from 'redux-logger';
import authReducer from '../features/auth/authSlice';
import playersReducers from '../features/players/playersSlice'

const store = configureStore({
  reducer: { 
    auth: authReducer,
    players: playersReducers,
  },
  //middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
});

export default store;
export * from '../features/auth/authSlice';

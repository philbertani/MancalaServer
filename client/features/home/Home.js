import React from 'react';
import { useSelector } from 'react-redux';
import Players from '../players/Players'

const Home = (props) => {
  const username = useSelector((state) => state.auth.me.username);

  return ( [
    <div key='PlayersDiv'>
      <h3>Welcome, {username}</h3>
    </div>,

    <Players key='Players' playerName={username} />

  ]);
};

export default Home;

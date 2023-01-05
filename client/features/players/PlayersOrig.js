import React, {useEffect, useState, useLayoutEffect} from "react";
import { useDispatch, useSelector } from "react-redux";
import { playersFromServer, queueGameRequest, playGame, endGame } from "./playersSlice";
import {v4 } from "uuid"
import Play, {boardConfig} from "../activeGame/Play"

let renderCount = 0

const Players = (props) => {

  //console.log("rendering Players",renderCount)

  const dispatch = useDispatch();
  const { playerName } = props

  useEffect(() => {

    const interval = setInterval(()=>{
        //setCounter(x=>x+1)
        dispatch( playersFromServer(playerName) );
    },1000)

    console.log('setinterval',interval)
    return () => clearInterval(interval);

  }, []);

  const {loggedInPlayers} = useSelector(state=>state.players)
  const playerList = Object.keys(loggedInPlayers)

  const requestGame =(ev,opponentName) => {
    const gameInfo = {id:v4(),time:Date.now(),playerName,opponentName,boardConfig}
    dispatch(queueGameRequest(gameInfo)) 
  }

  const dispatchPlayGame = (ev,playerName) => {
    dispatch(playGame(playerName))
  }

  if (playerList.length > 0 && playerName) {

    let playersOutput = []

    for (const [key,value] of Object.entries(loggedInPlayers)) {
      const playerName = key
      const {heartbeat} = value
      const timeDiff = 1e-3 * (Date.now()-heartbeat)  //milliseconds

      const disconnectedMessage = timeDiff > 10 ? 'Disconnected' : null
      playersOutput.push(
        <p key={playerName}>{playerName}</p>,
        <button key={key+'requestGame'} onClick={(ev)=>{requestGame(ev,playerName)}}>Request Game</button>
      )
    }

    //<p key={playerName}>{playerName} {heartbeat} {timeDiff} {JSON.stringify(value)} {disconnectedMessage}</p>

    let gameRequestOutput = []
    let activeGameOutput = []

    if (loggedInPlayers.hasOwnProperty(playerName)) {
      if (loggedInPlayers[playerName].hasOwnProperty("challengeStatus")) {
        const { challengeStatus, opponent } =
          loggedInPlayers[playerName];
        
        if (challengeStatus == "respond") {
          gameRequestOutput.push(
            <button
              key="playGame"
              onClick={(ev) => {
                dispatchPlayGame(ev, playerName);
              }}
            >
              Play {opponent}
            </button>,
            <button key="denyGame">Deny {opponent}</button>
          );
        } else if (challengeStatus == "waiting") {
          gameRequestOutput.push(
            <p key="waiting">Waiting for {opponent} to respond</p>
          );
        } else if (challengeStatus == 'accepted') {
          gameRequestOutput.push(
            <p key="playing">Currently Playing {opponent} </p>
          );
        }

      }


      if (loggedInPlayers[playerName].hasOwnProperty('activeGameId')) {
        if ( loggedInPlayers[playerName].hasOwnProperty('opponentDisconnected')) {
          if ( loggedInPlayers[playerName].opponentDisconnected) {
            gameRequestOutput.push(
              <p key='opp-discon'>{loggedInPlayers[playerName].opponent} seems to be Disconnected</p>
            )
          }
        }

        activeGameOutput.push(<Play key='mainPlay' playerName={playerName} />)
      }
    }

    //activeGameOutput.push(<Play key='mainPlay' playerName={playerName} gameId={loggedInPlayers[playerName].activeGameId}/>)

    return ( [
      <div key='playerList'>
        {playersOutput}
      </div>,

      <div key='gameRequests'>
        <h3>Game Status</h3>
        {gameRequestOutput}
      </div>,

      <div key='activeGame'>
        <h3>Active Game Here</h3>
        {activeGameOutput}
      </div>
    ]
    
    );
  }
};

export default Players;

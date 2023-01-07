import React, {useEffect, useState, useLayoutEffect} from "react";
import { useDispatch, useSelector } from "react-redux";
import { playersFromServer, queueGameRequest, playGame, cancelRequest } from "./playersSlice";
import {v4 } from "uuid"
import Play, {boardConfig} from "../activeGame/Play"

let renderCount = 0

const Players = (props) => {

  //console.log("rendering Players",renderCount)

  const dispatch = useDispatch();
  const { playerName } = props

  const [requested,setRequested] = useState("")

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
    if (requested == "") {
      setRequested(opponentName) //only 1 request at a time  
    } 
    dispatch(queueGameRequest(gameInfo))
  }

  const dispatchPlayGame = (ev,playerName) => {
    dispatch(playGame(playerName))
  }

  const dispatchDenyGame = (ev,playerName) => {
   
    setRequested("") 

    dispatch(cancelRequest(playerName))
  
  }

  if (playerList.length > 0 && playerName) {

    let playersOutput = []

    for (const [key,value] of Object.entries(loggedInPlayers)) {
      const opponentName = key
      const {heartbeat} = value
      const timeDiff = 1e-3 * (Date.now()-heartbeat)  //milliseconds

      const disconnectedMessage = timeDiff > 10 ? 'Disconnected' : null

      const thisPlayer = loggedInPlayers[opponentName]
      const playCheck = thisPlayer.hasOwnProperty('activeGame')
      const preGameCheck = thisPlayer.playStatus == "preGame"
      const cancelCheck = preGameCheck || playCheck

      //if the challenger already has an activeGame object don't change status of other
      //opponents
      //const challengerCheck = loggedInPlayers[playerName].hasOwnProperty('activeGame') 

      //if someone gets disconnected we need the following:
      const acceptedCheck = (loggedInPlayers[playerName].challengeStatus || false)
        && loggedInPlayers[playerName].challengeStatus =='accepted' 
        && loggedInPlayers[playerName].opponent == opponentName

      if (  (requested == opponentName && cancelCheck) || acceptedCheck ) {
        let message = ""
        if (preGameCheck) {message = "Cancel Request"}
        else if (playCheck) {message = "Cancel Game" }
        playersOutput.push(
          <p key={opponentName+"cancel"}>{opponentName}</p>,
          <button key={key+'cancelGame'} onClick={(ev)=>{dispatchDenyGame(ev,opponentName)}}>{message}</button>   
        )
      }
      else {
        let message = ""
        message = "Request Game"
        playersOutput.push(
          <p key={opponentName+"request"}>{opponentName}</p>,
          <button key={key+'requestGame'} onClick={(ev)=>{requestGame(ev,opponentName)}}>{message}</button>
        )
      }
    }

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
            <button 
              key="denyGame"
              onClick={(ev) => {
                dispatchDenyGame(ev, playerName)  
              }}
            >
              Deny {opponent}
            </button>
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

            if ( loggedInPlayers[playerName].playStatus=='preGame') {
              gameRequestOutput.push(
                <h3 key="cancelling">Cancelling Game Request</h3>
              )
              setTimeout(()=>{dispatch(cancelRequest(playerName))},2000)
            }
          }
        }
      }
    }

    activeGameOutput.push(
      <Play
        key="mainPlay"
        setRequested={setRequested}
        loggedInPlayers={loggedInPlayers}
        playerName={playerName}
      />
    );   

    return ( [
      <div key='playerList'>
        {playersOutput}
      </div>,

      <div key='gameRequests'>
        <h3>Game Status</h3>
        {gameRequestOutput}
      </div>,

      <div key='activeGame'>
        <h3>Game Board</h3>
        {activeGameOutput}
      </div>
    ]
    
    );
  }
};

export default Players;

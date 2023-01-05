import React, {useEffect,  useRef, useState} from "react";
import { useDispatch, useSelector } from "react-redux";

import { playersFromServer, executeTurn, endGame } from "../players/playersSlice";

let initializedBoard = false //sorry useEffect and useState was blowing up so...
let renderCount = 0

//P0, P1  are Player0 and Player1
//Player 0 is on the Top Row and moves Left with HomeBase0 (bin0)
//Player 1 is on the Bottom Row and movers Right with HomeBase1 (bin7)

const nextBin = [
//hb0                   hb1
//  0, 1, 2, 3, 4, 5, 6,  7, 8,  9, 10, 11, 12,13
  [ 8, 0, 1, 2, 3, 4, 5, -1, 9, 10, 11, 12, 13, 6], //P0 skips hb1
  [-1, 8, 1, 2, 3, 4, 5,  6, 9, 10, 11, 12, 13, 7]  //P1 skips hb0
]
let initialStones = Array(14).fill(1);
initialStones[0] = 0;
initialStones[7] = 0;

const playerBins = [
  //giving the [min,max] inclusive
  [1,6],  //player 0 can only choose these bins
  [8,13]  //player 1 can only choose these bins
]
const homeBase = [0,7]
export const boardConfig = { nextBin, stones:[...initialStones], homeBase, playerBins};

const Play = (props) => {

//React.memo(ization) is doing nothing to prevent needless rendering here
//const Play = React.memo(function Play(props) {

  const dispatch = useDispatch();
  const { playerName } = props;

  const { loggedInPlayers } = useSelector((state) => state.players);
  const playerList = Object.keys(loggedInPlayers);

  useEffect(()=>{
    console.log('kicking off useEffect to run an extra dispatch')
    dispatch( playersFromServer(playerName) )
  },[])

  useEffect(() => {
 
    if (loggedInPlayers && loggedInPlayers[playerName] && loggedInPlayers[playerName].activeGame) {   
      const { id, gameState, winnerInfo } =
        loggedInPlayers[playerName].activeGame;

      //console.log('useEffect called, checking winner')
      if (gameState && gameState === "winner") {
        console.log("game over!!");
        dispatch(endGame({ id, gameState, winnerInfo }));
      }
    }
  },[loggedInPlayers]);

  //const [stones,setStones] = useState(initialStones)

  const gameBoardRef = useRef()

  let binRefs = []
  for (let i=0; i<14; i++) { //12 regular bins  + 2 home bases
    const binRef = useRef()
    binRefs.push(binRef)
  }

  const dispatchExecuteTurn = (ev, gameId, myTurn, gameState) => {
    if (ev && gameId && myTurn && gameState!=='winner') {
      //console.log(ev.clientX, gameId, myTurn, ev.target);
      if (myTurn && String(ev.target.id).includes('bin')  ) {
        const binNum = String(ev.target.id).replace(/bin/,'')
        const {myBins} = loggedInPlayers[playerName]

        //one more check to see if we are in the range of bins for this player
        if ( binNum >= myBins[0] && binNum <= myBins[1]) {
          dispatch(executeTurn({playerName,binNum}));
        }
      }
    }
  };

  let gameOutput = []
  let gameBoard = []
  if (playerList.length > 0 && playerName) {

    const { activeGame, previousGame } = loggedInPlayers[playerName]
    const hasActiveGame =  activeGame.hasOwnProperty('display') && activeGame.display 
    const hasPreviousGame = typeof previousGame !== "undefined"

    if (loggedInPlayers[playerName].hasOwnProperty("activeGameId") || hasPreviousGame) {
    
      if (loggedInPlayers[playerName].playStatus == "playing") {
        //gameOutput.push(<h4 key="playing">Playing a Game here</h4>);
        if (loggedInPlayers[playerName].hasOwnProperty("myTurn")) {
          if (loggedInPlayers[playerName].myTurn) {
            const {playerNum} = loggedInPlayers[playerName]
            gameOutput.push(<p key="yourTurn">Your Turn, Player {playerNum} </p>)
          } else {
            gameOutput.push(
              <p key="otherTurn">
                {loggedInPlayers[playerName].opponent}'s turn
              </p>
            )
          }
        }
      }

      const bgcolors = ['purple','yellow']
      const colors = ['yellow','purple']

      if ( hasActiveGame || hasPreviousGame) {

        let gameToDisplay = null

        if ( hasActiveGame ) {
          gameToDisplay = activeGame
        }
        else if ( hasPreviousGame ) { 
          gameToDisplay = previousGame
        }
        else {
          throw new Error ('weird - got into game display loop but nothing to display')
        }

        //console.log('zzzzzzzzzzzz',gameToDisplay)

        //the checks for undefined just never end... I would have expected stones to be defined already if we 
        //got into this loop
        const stones = gameToDisplay.boardConfig.hasOwnProperty('stones') ? gameToDisplay.boardConfig.stones : [...initialStones]

        let binOutput = []
        const topOfBoard = 10
        const leftMargin = 4
        const leftMostBin = 12

        const leftEdge = leftMargin + leftMostBin
        const rightEdge = 6 * 13 + 10

        const homeBaseLeft = [leftMargin, rightEdge]

        //this is being rendered every time we check players -- too much
        //console.log('rendering',renderCount++)

        const {myTurn, myBins} = loggedInPlayers[playerName]

        let binNum = 0
        for (let j=0; j<2; j++) {
          const topOfBin = 30*j  //2 rows of 6 divs

          binOutput.push(
            <div
              ref={binRefs[binNum]}
              key={"bin"+binNum}
              id={"homebase"+j}
              className="homeBase"
              style={{left:`${homeBaseLeft[j]}%`,top:`${topOfBoard}%`}}
            >
              {-stones[binNum]}
            </div>
          )
          binNum ++

          for (let i=0; i<6; i++) {

            const myBin = binNum >= myBins[0] && binNum <= myBins[1]

            binOutput.push(
              <div 
                ref={binRefs[binNum]}
                key={"bin"+binNum}
                id={"bin"+binNum}
                className="bin"
                style={{left:`${leftEdge+i*12}%`,top:`${topOfBin+topOfBoard}%`,
                  backgroundColor:bgcolors[j],color:colors[j]}}
              >
                {stones[binNum]}
              </div>
            )
            binNum++
          }
        }

        //const {gameState, winnerInfo} = loggedInPlayers[playerName].activeGame
        const {gameState, winnerInfo} = gameToDisplay
        gameBoard.push( [
          <div key="winnerDiv">{gameState} {JSON.stringify(winnerInfo)} </div>,
          <div 
            ref={gameBoardRef}
            onClick = { (gameState!=='winner') 
              ? (ev)=>{dispatchExecuteTurn(ev,gameToDisplay.id,myTurn,gameState)} : undefined }

            key="gameBoard"
            className="gameBoard"
          >
            {binOutput}
          </div>
        ])

      }

    }
  }

  return [
    <div key="gameDiv">{gameOutput}</div>,

    <div key="gameContainer">{gameBoard}</div>
    
  ];

};

export default Play;

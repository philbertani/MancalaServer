import React, {useEffect,  useRef, useState} from "react";
import { useDispatch } from "react-redux";
import * as THREE from "three"
import GPU from  "./GPU"

import { executeTurn, endGame } from "../players/playersSlice";

let renderCount = 0

const initStonesPerBin = 3
let initialStones = Array(14).fill(initStonesPerBin);
initialStones[0] = 0;
initialStones[7] = 0;

//P0, P1  are Player0 and Player1
//Player 0 is on the Top Row and moves Left with HomeBase0 (bin0)
//Player 1 is on the Bottom Row and movers Right with HomeBase1 (bin7)

const nextBin = [
//hb0                   hb1
//  0, 1, 2, 3, 4, 5, 6,  7, 8,  9, 10, 11, 12,13
  [ 8, 0, 1, 2, 3, 4, 5, -1, 9, 10, 11, 12, 13, 6], //P0 skips hb1
  [-1, 8, 1, 2, 3, 4, 5,  6, 9, 10, 11, 12, 13, 7]  //P1 skips hb0
]

const playerBins = [
  //giving the [min,max] inclusive
  [1,6],  //player 0 can only choose these bins
  [8,13]  //player 1 can only choose these bins
]
const homeBase = [0,7]
export const boardConfig = { nextBin, stones:[...initialStones], homeBase, playerBins};

const Play = (props) => {

  const dispatch = useDispatch();
  const { playerName, loggedInPlayers } = props;
  const [gameOutput, setGameOutput] = useState([])
  const [gameBoard, setGameBoard] = useState([])
  const [gameForGPU,setGameForGPU] = useState({})
  const [GPUplayerNum,setGPUplayerNum] = useState()
  const [myTurn, setMyTurn] = useState()

  const gameBoardRef = useRef()

  let binRefs = []
  for (let i=0; i<14; i++) { //12 regular bins  + 2 home bases
    const binRef = useRef()
    binRefs.push(binRef)
  }

  useEffect(() => {
 
    if (loggedInPlayers && loggedInPlayers[playerName] && loggedInPlayers[playerName].activeGame) {   

      const { id, gameState, winnerInfo } =
        loggedInPlayers[playerName].activeGame;

      //console.log('Play - useEffect called', gameState)
      if (gameState && gameState === "winner") {
        console.log("game over!!");
        props.setRequested("")
        dispatch(endGame({ id, gameState, winnerInfo }));
      }
    }

    let newGameOutput = []
    let newGameBoard = []

    if ( playerName && loggedInPlayers.hasOwnProperty(playerName)) {
  
      //we would like the board to show the previous game until new one is
      //requested

      const { activeGame, previousGame } = loggedInPlayers[playerName]
      const hasActiveGame =  activeGame && activeGame.hasOwnProperty('display') && activeGame.display 
      const hasPreviousGame = typeof previousGame !== "undefined"

      if (loggedInPlayers[playerName].hasOwnProperty("activeGameId") || hasPreviousGame) {
      
        if (loggedInPlayers[playerName].playStatus == "playing") {
          
          if (loggedInPlayers[playerName].hasOwnProperty("myTurn")) {

            const {playerNum} = loggedInPlayers[playerName]
            setGPUplayerNum(playerNum)
            setMyTurn(loggedInPlayers[playerName].myTurn)

            if ( activeGame.winnerInfo.winnerName ) { }  //do something??
            else if (loggedInPlayers[playerName].myTurn) {
              newGameOutput.push(<p key="yourTurn">Your Turn, Player {playerNum} </p>)
            } else {
              newGameOutput.push(
                <p key="otherTurn">
                  {loggedInPlayers[playerName].opponent}'s turn
                </p>
              )
            }
            setGameOutput(newGameOutput)
          }
        }
  
        const bgcolors = ['rgba(150,0,150,1)','(255,255,0,1']
        const colors = ['yellow','purple']

        const playingGame = activeGame ? (activeGame.gameState=='playing' || activeGame.gameState=='winner') : false 

        if ( (hasActiveGame&&playingGame) || hasPreviousGame) {
  
          let gameToDisplay = null
  
          if ( hasActiveGame&&playingGame  ) {
            gameToDisplay = activeGame
          }
          else if ( hasPreviousGame ) { 
            gameToDisplay = previousGame
          }
          else {
            console.log ('weird - got into game display loop but nothing to display')
          }

          //the checks for undefined just never end... I would have expected stones to be defined already if we 
          //got into this loop
          const stones = gameToDisplay.boardConfig.hasOwnProperty('stones') ? gameToDisplay.boardConfig.stones : [...initialStones]
  
          setGameForGPU(gameToDisplay)
          //console.log('zzzzzzzzzz',playingGame, stones)

          let binOutput = []
          const topOfBoard = 10
          const leftMargin = 8
          const leftMostBin = 12
  
          const leftEdge = leftMargin + leftMostBin
          const rightEdge = 6 * 13 + 14
  
          const homeBaseLeft = [leftMargin, rightEdge]
  
          //this is being rendered every time we check players -- too much
          //console.log('rendering',renderCount++)
  
          const {myTurn} = loggedInPlayers[playerName]
  
          //myBins is wiped out after game ends so default to [0,14]
          const myBins = hasActiveGame ? loggedInPlayers[playerName].myBins : [0,14]

          let binNum = 0
          for (let j=0; j<2; j++) {
            const topOfBin = 45*j  //2 rows of 6 divs
  
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
                    backgroundColor:bgcolors[j],color:"white"}}
                >
                  {stones[binNum]}
                </div>
              )
              binNum++
            }
          }
  
          const {gameState, winnerInfo} = gameToDisplay

          if ( winnerInfo.winnerName ) {
            setGameOutput("")  //blank out the Your Turn messages
            newGameBoard.push(
              <div style={{ position:"absolute", left:"50%",transform:"translate(-50%,0)",
                top:"25vh",wordBreak:"break-all",fontSize:"1.7em" }} key="winnerDiv">
                {gameState} {JSON.stringify(winnerInfo)}
              </div> 
            )
          }

          newGameBoard.push([
            <div
              ref={gameBoardRef}
              onClick={
                gameState !== "winner"
                  ? (ev) => {
                      dispatchExecuteTurn(
                        ev,
                        gameToDisplay,
                        myTurn,
                        myBins
                      );
                    }
                  : undefined
              }
              key="gameBoard"
              className="gameBoard"
            >
              {binOutput}
            </div>,
          ]);

          setGameBoard(newGameBoard);
        }
  
      }
    }

  },[loggedInPlayers]);  //loggedInPlayers gets updated by setInterval from parent: Players

  //const dispatchExecuteTurn = (ev, gameToDisplay, gameId, myTurn, myBins, gameState) => {
  const dispatchExecuteTurn = (ev, gameToDisplay, myTurn, myBins ) => {

    const {id, gameState} = gameToDisplay
    const gameId = id

    console.log(ev.target.id, gameId, myTurn, gameState)
    if (ev && gameId && myTurn && gameState!=='winner') {

      if (myTurn && String(ev.target.id).includes('bin')  ) {
        const  binNumPre = String(ev.target.id).replace(/bin/,'')
        const binNum = String(binNumPre).replace(/GPUNum/,'')

        console.log('in dispatch turn',ev.target.id,binNum,binNumPre,myBins)
        //only dispatch if we are in the range of bins for this player

        if ( binNum >= myBins[0] && binNum <= myBins[1] ) {
          console.log('got to executeTurn finally')
          const stones = gameToDisplay.boardConfig.stones
          if ( stones[binNum] <= 0 ) {
            console.log('you must pick a bin that has stones')
          }
          else {
            dispatch(executeTurn({playerName,binNum}));
          }
        }
      }
    }
  };

  const canvasRef = useRef()
  const labelsRef = useRef()
  const GPUcontainerRef = useRef()

  //this was right before GPUdiv
  //<div key="labelsDiv" id="labels" ref={labelsRef} ></div>,
  return [

    <div key="gameContainer" id="gameContainer">

      <div style={{margin:"0"}} key="gameContainer">{gameBoard}</div>

      <div style={{position:"absolute",top:"17vh",left:"50%",transform:"translate(-50%,0)",fontSize:"1.5em"}} 
        key="gameDiv">{gameOutput}</div>

      <div key="GPUdiv" style={{position:"absolute",top:"37vh"}}>
        {gameForGPU.boardConfig && [
          <GPU
            key="GPU"
            dispatchExecuteTurn={dispatchExecuteTurn}
            playerData={loggedInPlayers[playerName]}
            gameToDisplay={gameForGPU}
            canvasRef={canvasRef}
            binRefs={binRefs}
            labelsRef={labelsRef}
            playerNum={GPUplayerNum}
            myTurn={myTurn}
          />
        ]}
      </div>

    </div>
  ];

};

export default Play;

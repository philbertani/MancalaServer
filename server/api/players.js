const router = require("express").Router();
const fs = require("fs")
module.exports = router;

//const players = { nobody: { heartbeat: 0 } };
const players = {}
const games = {}
let LOGFILE = [];

//this  writeStream thing is NOT working - causing game play to hang
const writeStream = fs.createWriteStream('./logfile.txt', {flags:'a'});

//fs.createWriteStream to keep a file open and append to it
//apparently appendFile opens a new instance each time

router.put("/", async (req, res, next) => {
  try {
    //just use this to serve player list info
    //no need for db

    const { playerName } = req.body;

    if (!players.hasOwnProperty(playerName)) {
      players[playerName] = {};
    }

    const now = Date.now()
    players[playerName].heartbeat = now
    players[playerName].loggedIn = true

    //if we currently have an opponent check if they are still connected
    if ( players[playerName].hasOwnProperty('activeGameId')) {
      const opponentName = players[playerName].opponent
      const timeDiff = 1e-3 * (now - players[opponentName].heartbeat)
      //console.log('zz',timeDiff, 'zz', now, 'zz',players[opponentName].heartbeat,'zz',opponentName)
      if ( timeDiff > 10 ) {
        players[opponentName].disconnected = true
        players[playerName].opponentDisconnected = true
      }
      else {
        players[opponentName].disconnected = false
        players[playerName].opponentDisconnected = false        
      }

      const {activeGameId} = players[playerName]

      if (players[playerName].playStatus=='playing') {
        setCurrentPlayer(activeGameId)
      }

    }

    res.json(players);
  } catch (err) {
    next(err);
  }
});

//id is activeGameId
function setCurrentPlayer(id) {

  if ( games.hasOwnProperty(id) && games[id].players.length==2) {
    
    const {currentPlayerNum} = games[id]
    const nextPlayerNum = (currentPlayerNum+1)%2

    const currentPlayer = games[id].players[currentPlayerNum]
    const nextPlayer = games[id].players[nextPlayerNum]

    players[currentPlayer].myTurn = true
    players[currentPlayer].currentPlayer = currentPlayer

    players[nextPlayer].myTurn = false
    if ( players[currentPlayer].playingSelf ) {
      //if we are playing self the bottom row  goes first - oh well
      players[currentPlayer].myTurn = true
      players[currentPlayer].playerNum = nextPlayerNum
      players[currentPlayer].myBins = games[id].boardConfig.playerBins[nextPlayerNum]
    }

    players[nextPlayer].currentPlayer = currentPlayer

  }
}

router.put("/endGame", async(req,res,next)=>{
  try {
    const {id,gameState,winnerInfo} = req.body
    const {playerName,opponentName} = games[id]
    players[playerName] = {}
    players[playerName].previousGame = games[id]
    players[opponentName] = {}
    players[opponentName].previousGame = games[id]

    res.json(players)
  } 
  catch (err) {

  } 
})

router.put("/executeTurn", async(req,res,next)=> {
  try {
    const {playerName,binNum} = req.body
    const {activeGameId,playerNum} = players[playerName]

    let stones = games[activeGameId].boardConfig.stones
    const {nextBin, homeBase} = games[activeGameId].boardConfig
    
    //****** */  Mancala Game Mechanic Finally Here *******
    const myHomeBase = homeBase[playerNum]

    //each player has a slightly different path
    //provided by nextBin
    const myNextBin = nextBin[playerNum]  

    const otherHomeBase = homeBase[(playerNum+1)%2]
    let currentBin = binNum

    let anotherTurn = false
    const stonesToSow = stones[binNum]
    stones[binNum] = 0

    for (let i=0; i<stonesToSow;i++) {

      currentBin = myNextBin[currentBin]

      if ( currentBin === myHomeBase && i === stonesToSow-1 ) {
        anotherTurn = true
        //player goes again if last stone lands in home base
      }
 
      stones[currentBin] ++
    
    }

    if ( !anotherTurn ) {
      games[activeGameId].currentPlayerNum = 
        (games[activeGameId].currentPlayerNum+1)%2
      setCurrentPlayer(activeGameId)
    }
    //********* End of Mancala Game Mechanic ***************

    players[playerName].anotherTurn = anotherTurn

    games[activeGameId].moves.push({playerNum,binNum})
    games[activeGameId].gameState = "playing"

    const {gameOver,winnerName,winnerNum} = checkWinner(activeGameId)
    if (gameOver) {
      games[activeGameId].gameState = "winner"
      games[activeGameId].winnerInfo = {winnerName,winnerNum}
    }

    //writeStream.write(Data.now(),JSON.stringify(games[activeGameId]) )
    res.json(players)

  }
  catch (err) {

  }
})

function checkWinner(gameId) {

  const {stones, playerBins } = games[gameId].boardConfig

  let [gameOver,winnerNum,winnerName] = [false,-1,'']
  let sumBins = Array(2).fill(0) //make it easier to expand to n players at some point
  for (let playerNum=0; playerNum<2; playerNum++) {
    const thisPlayerBins = playerBins[playerNum]
    for (let i=thisPlayerBins[0]; i<=thisPlayerBins[1];i++) {
      sumBins[playerNum] += stones[i]
    }

    if (sumBins[playerNum] === 0 ) {
      gameOver = true
      winnerNum = playerNum
      winnerName = games[gameId].players[playerNum]
    }
  }

  console.log('zzzzzzzzzzzz sumBins',sumBins)

  return {gameOver,winnerNum,winnerName}

}

router.put("/logout", async (req, res, next) => {
  try {
    const { playerName } = req.body;
  
    if ( players[playerName].hasOwnProperty('activeGameId') ) {
      //do not delete in case she reconnects soon enough to resume
      //game
      players[playerName].loggedIn  = false
    }
    else {
      LOGFILE.push(`{Date.now()}, logging out player:${playerName}`);
      delete players[playerName];
    }
    res.json(players)
  } catch (err) {}
});

router.put("/playGame", async(req,res,next)=>{

  const {playerName} = req.body
  const opponentName = players[playerName].opponent
  try {
    players[playerName].playStatus = 'playing'
    players[opponentName].playStatus = 'playing'
    players[playerName].challengeStatus = 'accepted'
    players[opponentName].challengeStatus = 'accepted'
    
    const game = players[playerName].activeGame
    game.display = true
    game.gameState = "playing"

    //writeStream.write(Date.now(),JSON.stringify(game))
    //console.log('zzzzzzzzz',game)

    res.json(players)
  }
  catch (err) {

  }
})

router.put("/cancelRequest", async (req, res, next) => {
  try {
    const {playerName} = req.body
    const opponentName = players[playerName].opponent

    if ( players[playerName].activeGame) {
      console.log('zzzzzzzzzzzzz cancelling a game')
      players[playerName].activeGame.gameState = "Cancelled"
    }

    if ( playerName) players[playerName] = {}
    if ( opponentName ) players[opponentName] = {}
    
    res.json(players)
  }
  catch (err) {

  }
})

router.put("/gameRequest", async (req, res, next) => {
  try {
    const { gameInfo } =  req.body
    //console.log('game request',gameInfo)
    if ( !games.hasOwnProperty(gameInfo.id) ) {
      games[gameInfo.id] = gameInfo
      games[gameInfo.id].players = []
    }

    if ( players[gameInfo.playerName].hasOwnProperty('activeGameId') ) {

    }
    else if ( players[gameInfo.opponentName].hasOwnProperty('activeGameId')) {
      
    }
    else {

      const {playerName,opponentName} = gameInfo

      //console.log('zzzzzzzzzz',gameInfo.boardConfig)
      players[playerName].activeGameId = gameInfo.id
      players[playerName].opponent = gameInfo.opponentName
      players[playerName].challengeStatus = 'waiting'
      players[playerName].playStatus = 'preGame'
      players[playerName].playerNum = 1
      players[playerName].myBins = gameInfo.boardConfig.playerBins[1]
      players[playerName].anotherTurn = false
      players[playerName].playingSelf = false


      players[opponentName].activeGameId = gameInfo.id
      players[opponentName].opponent = gameInfo.playerName
      players[opponentName].challengeStatus = 'respond'
      players[opponentName].playStatus = 'preGame'
      players[opponentName].playerNum = 0  //challenged  opponent goes first
      players[opponentName].myBins = gameInfo.boardConfig.playerBins[0]
      players[opponentName].anotherTurn = false
      players[opponentName].playingSelf = false

      players[playerName].activeGame = gameInfo
      players[opponentName].activeGame = gameInfo
 
      //games[gameInfo.id].players.push(opponentName)
      //as courtesy the challenged player goes first
      games[gameInfo.id].currentPlayerNum = 0
      games[gameInfo.id].players.push(opponentName)
      games[gameInfo.id].players.push(playerName)
      games[gameInfo.id].moves = []
      games[gameInfo.id].gameState = "negotiating"
      games[gameInfo.id].display = "false"
      games[gameInfo.id].winnerInfo = ""
      
      if ( playerName === opponentName ) {
        players[playerName].playingSelf = true
      }

      console.log(games[gameInfo.id].gameState,Date.now())
    }
    
    res.json(players)
  
  }
  catch (err) {

  }
});

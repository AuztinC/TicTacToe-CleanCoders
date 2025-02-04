import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

function App() {
  const displayWinner = useRef<HTMLDivElement>(null);
  const cellDivRef = useRef<HTMLDivElement[]>([]);
  const difficultyRef = useRef<HTMLSelectElement | null>(null)
  // decide whos turn it is currently in the game.
  const [playerTurn, setPlayerTurn] = useState(1);
  // create a 2d array to map through and create our divs.
  const [board, setBoard] = useState(Array(3).fill("").map(() => Array(3).fill("")));
  // set default difficulty to hard
  const [difficulty, setDifficulty] = useState(window.location.hash.slice(1,window.location.hash.length) || "hard")
  const [inGame, setInGame] = useState(false)

  // set our players markers.
  const bot = "O"
  const player = "X"

  // pass in rowIndex and colIndex of event space clicked.
  function handleClick(e: any, row: number, col: number) {
    // check if current space is occupied or if the game has been won or tied.
    if (board[row][col] || checkWinner(board)) return;

    // create a copy of board for immutablilty; set player icon in space
    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((r) => [...r]);
      newBoard[row][col] = player;
      return newBoard;
    });
    // set className for text color
    e.target.className = `${e.target.className} ${player}`
    setPlayerTurn(2)
}  

// Pick and return a random space from all empty available spaces.
function easyMove() {
  const emptySpaces = []
  for(let i =0; i < 3; i++){
    for(let j = 0; j < 3; j++){
      if(!board[i][j]){
        emptySpaces.push({row: i, col: j})
      }
    }
  }
  const ranIdx = Math.floor(Math.random() * emptySpaces.length)
  return {row: emptySpaces[ranIdx].row, col: emptySpaces[ranIdx].col}
}

// Find and return the best move
function hardMove() {
  let bestScore = -Infinity;
  let move = {row: -1, col: -1}
    
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (!board[i][j]) {
        const tempBoard = board.map((r) => [...r]);
        tempBoard[i][j] = bot
        const score = minimax(tempBoard, 0, false);
        if (score > bestScore) {
          bestScore = score;
          move = { row: i, col: j };
        }
      }
    }
  }
  return move
}

const botTurn = useCallback(() => {
  let bestMove = { row: -1, col: -1 };

  // "Easy" difficulty
  // create a temp array of all possible spaces, pick one randomly
  if(difficulty === "easy") {
    // console.log("easy AI")
    bestMove = easyMove()

  } else if (difficulty === "medium") {
    // 50% chance to play a random space or the best move
    if(Math.random() < 0.5){
      bestMove = easyMove()
    } else {
      bestMove = hardMove()
    }
  } else {

    // "Hard" difficulty, always choose best move.
    bestMove = hardMove()
  
  }
  // Once we find the best possible position for both Row & Col
  // set our Board state with an immutible copy of previous state.
  if (bestMove.row !== -1 && bestMove.col !== -1) {
    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((r) => [...r]);
      newBoard[bestMove.row][bestMove.col] = bot;
      return newBoard;
    });

  }
  setPlayerTurn(1);
  setInGame(true);
  

}, [board, difficulty]);

// create a set of winning patters to avoid checking redundent spaces
const WINNING_PATTERNS = [
  [[0, 0], [0, 1], [0, 2]], //->
  [[1, 0], [1, 1], [1, 2]], //->
  [[2, 0], [2, 1], [2, 2]], //->
  [[0, 0], [1, 0], [2, 0]], //v
  [[0, 1], [1, 1], [2, 1]], // v
  [[0, 2], [1, 2], [2, 2]], //  v
  [[0, 0], [1, 1], [2, 2]], // \
  [[0, 2], [1, 1], [2, 0]], // /
];

const checkWinner = (board: string[][]): string | null => {
  // loop through each WINNING_PATTERN
  for (const pattern of WINNING_PATTERNS) {
    // parse line of pattern to compare if both B & C are equal to A, from the board we sent in.
    const [a, b, c] = pattern;
    if (board[a[0]][a[1]] && board[a[0]][a[1]] === board[b[0]][b[1]] && board[a[0]][a[1]] === board[c[0]][c[1]]) {
      return board[a[0]][a[1]];
    }
  }
  // concat our 2d array to avoid redundent loop
  // check for empty spaces, if we find any return null(continue game)
  // if all spaces are occupied 
  for (let row of board) {
    for (let cell of row) {
      if (cell === "") return null;
    }
  }
  return "tie";
  // return board.flat().includes("") ? null : "tie"; 
};

// scores based on the outcome of checkWinner. "X", "O", "tie"
// using Record to extend string types as keys from [player], [bot], "tie" assigning their value as numbers
const scores: Record<string, number> = { [player]: -1, [bot]: 1, tie: 0 };
 
const minimax = (board: string[][], depth: number, isMax: boolean): number => {
  // if checkWinner returns "X", "O", or "tie" return that result.
  // else if result === null, continue minimax
  const result = checkWinner(board);
  if (result) return scores[result];

  // using our maximizing player(isMax) variable properly 
  // reduced redundent code by checking its state and flipping it accordingly
  let bestScore = isMax ? -Infinity : Infinity;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (!board[i][j]) {
        board[i][j] = isMax ? bot : player;
        const score = minimax(board, depth + 1, !isMax);
        board[i][j] = "";
        bestScore = isMax ? Math.max(score, bestScore) : Math.min(score, bestScore);
      }
    }
  }
  return bestScore;
};

// ever turn, check for winner or tie to display
// if no winner is found check if it is Bot's turn
// give the bot a 500ms "think" time before acting
useEffect(() => {
  const result = checkWinner(board);
  if (result && displayWinner.current) {
    displayWinner.current.innerHTML = result === "tie" ? "It's a Tie!" : `${result} Wins!`;
    setInGame(false);
  } else if (playerTurn === 2) {
    setTimeout(() => botTurn(), 500);
  }
}, [board, playerTurn, inGame]);

useEffect(()=>{
  window.location.hash = difficulty
}, [difficulty])

// recreate board array
// create array from HTMLNodeList and reset classes for colors
// set player turn and reset inGame + winner Div Content
function resetGame() {
  setBoard(Array(3).fill("").map(()=>Array(3).fill("")))
  const cellArr = Array.from(cellDivRef.current)
  cellArr.forEach((div:HTMLDivElement)=>{
    div.classList.remove("X")
  })
  setPlayerTurn(1)
  setInGame(false)
  if (displayWinner.current) displayWinner.current.innerHTML = "";
}

// index used to add all 9 cells to cellDivRef
let idx = 0
  return (
    <>
      <div id="displayWinner" ref={displayWinner}></div>
      <select name="difficulty" ref={difficultyRef} value={difficulty} onChange={(e)=>setDifficulty(e.target.value)}>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
      <div className="board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`} ref={(el) => { if (el) cellDivRef.current[idx] = el; idx++; }} className="cell" onClick={(e) => handleClick(e, rowIndex, colIndex)}>
              {cell}
            </div>
          ))
        )}
      </div>
      {inGame && <button onClick={resetGame}>Reset</button>}
    </>
  )
}

export default App
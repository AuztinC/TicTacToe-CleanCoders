import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

function App() {
  const displayWinner = useRef<HTMLDivElement>(null);
  // decide whos turn it is currently in the game.
  const [playerTurn, setPlayerTurn] = useState(1);
  // create a 2d array to map through and create our divs.
  const [board, setBoard] = useState(Array(3).fill("").map(() => Array(3).fill("")));
  const [inGame, setInGame] = useState(false)

  // set our players markers.
  const bot = "O"
  const player = "X"

  // pass in rowIndex and colIndex of event space clicked.
  function handleClick(row: number, col: number) {
    // check if current space is occupied or if the game has been won or tied.
    if (board[row][col] || checkWinner(board)) return;

    // create a copy of board for immutablilty; set player icon in space
    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((r) => [...r]);
      newBoard[row][col] = player;
      return newBoard;
    });

    setPlayerTurn(2)
}  
useEffect(()=>{
  if(playerTurn == 2){
    botTurn();
  } else return 
}, [playerTurn])

const WINNING_PATTERNS = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

const checkWinner = (board: string[][]): string | null => {
  // loop through each WINNING_PATTERN
  for (const pattern of WINNING_PATTERNS) {
    // parse line of pattern to compare if both B & C are equal to A.
    const [a, b, c] = pattern;
    if (board[a[0]][a[1]] && board[a[0]][a[1]] === board[b[0]][b[1]] && board[a[0]][a[1]] === board[c[0]][c[1]]) {
      return board[a[0]][a[1]];
    }
  }
  // concat our 2d array to avoid redundent loop
  // check for empty spaces, if we find any return null(continue game)
  // if all spaces are occupied 
  return board.flat().includes("") ? null : "tie"; 
};

const botTurn = useCallback(() => {
  
  let bestScore = -Infinity;
  let bestMove = { row: -1, col: -1 };

  // Finding the best move
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (!board[i][j]) {
        const tempBoard = board.map((r) => [...r]);
        tempBoard[i][j] = bot
        const score = minimax(tempBoard, 0, false);
        if (score > bestScore) {
          bestScore = score;
          bestMove = { row: i, col: j };
        }
      }
    }
  }

  // Update board if AI finds a move
  if (bestMove.row !== -1 && bestMove.col !== -1) {
    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((r) => [...r]);
      newBoard[bestMove.row][bestMove.col] = bot;
      return newBoard;
    });

    setPlayerTurn(1);
    setInGame(true);
  }
}, [board]);

const scores: Record<string, number> = { [player]: -1, [bot]: 1, tie: 0 };

const minimax = (board: string[][], depth: number, isMax: boolean): number => {
  const result = checkWinner(board);
  if (result) return scores[result];

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

useEffect(() => {
  const result = checkWinner(board);
  if (result && displayWinner.current) {
    displayWinner.current.innerHTML = result === "tie" ? "It's a Tie!" : `${result} Wins!`;
    setInGame(false);
  } else if (playerTurn === 2 && inGame) {
    setTimeout(() => botTurn(), 500);
  }
}, [board, playerTurn, botTurn, inGame]);

function resetGame() {
  setBoard(Array(3).fill("").map(()=>Array(3).fill("")))
  setPlayerTurn(1)
  setInGame(false)
  if (displayWinner.current) displayWinner.current.innerHTML = "";
}

  return (
    <>
      <div id="displayWinner" ref={displayWinner}></div>

      <div className="board">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`} className="cell" onClick={() => handleClick(rowIndex, colIndex)}>
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
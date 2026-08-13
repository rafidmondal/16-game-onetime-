import React, { useState, useEffect, useCallback } from 'react';

// Standard Board Coordinates (37 Points)
const COORDS = [
  // Top Triangle Head (0 to 5)
  { l: 32, t: 3 }, { l: 50, t: 3 }, { l: 68, t: 3 },
  { l: 41, t: 14 }, { l: 50, t: 14 }, { l: 59, t: 14 },

  // 5x5 Main Grid (6 to 30)
  { l: 5, t: 25 }, { l: 27.5, t: 25 }, { l: 50, t: 25 }, { l: 72.5, t: 25 }, { l: 95, t: 25 }, // Row 0
  { l: 5, t: 37.5 }, { l: 27.5, t: 37.5 }, { l: 50, t: 37.5 }, { l: 72.5, t: 37.5 }, { l: 95, t: 37.5 }, // Row 1
  { l: 5, t: 50 }, { l: 27.5, t: 50 }, { l: 50, t: 50 }, { l: 72.5, t: 50 }, { l: 95, t: 50 }, // Row 2 (Center)
  { l: 5, t: 62.5 }, { l: 27.5, t: 62.5 }, { l: 50, t: 62.5 }, { l: 72.5, t: 62.5 }, { l: 95, t: 62.5 }, // Row 3
  { l: 5, t: 75 }, { l: 27.5, t: 75 }, { l: 50, t: 75 }, { l: 72.5, t: 75 }, { l: 95, t: 75 }, // Row 4

  // Bottom Triangle Head (31 to 36)
  { l: 41, t: 86 }, { l: 50, t: 86 }, { l: 59, t: 86 },
  { l: 32, t: 97 }, { l: 50, t: 97 }, { l: 68, t: 97 }
];

// Board Connections (Lines)
const LINE_PAIRS: [number, number][] = [
  // Top Head
  [0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [3, 8], [1, 4], [4, 8], [2, 5], [5, 8],

  // 5x5 Grid Horizontals
  [6, 7], [7, 8], [8, 9], [9, 10],
  [11, 12], [12, 13], [13, 14], [14, 15],
  [16, 17], [17, 18], [18, 19], [19, 20],
  [21, 22], [22, 23], [23, 24], [24, 25],
  [26, 27], [27, 28], [28, 29], [29, 30],

  // 5x5 Grid Verticals
  [6, 11], [11, 16], [16, 21], [21, 26],
  [7, 12], [12, 17], [17, 22], [22, 27],
  [8, 13], [13, 18], [18, 23], [23, 28],
  [9, 14], [14, 19], [19, 24], [24, 29],
  [10, 15], [15, 20], [20, 25], [25, 30],

  // 5x5 Grid Diagonals
  [6, 12], [12, 18], [8, 12], [12, 16],
  [8, 14], [14, 20], [10, 14], [14, 18],
  [16, 22], [22, 28], [18, 22], [22, 26],
  [18, 24], [24, 30], [20, 24], [24, 28],

  // Bottom Head
  [28, 31], [31, 34], [28, 32], [32, 35], [28, 33], [33, 36],
  [31, 32], [32, 33], [34, 35], [35, 36]
];

// Jump Triples [A, B, C]
const TRIPLES: [number, number, number][] = [
  // Horizontals
  [0, 1, 2], [3, 4, 5],
  [6, 7, 8], [7, 8, 9], [8, 9, 10],
  [11, 12, 13], [12, 13, 14], [13, 14, 15],
  [16, 17, 18], [17, 18, 19], [18, 19, 20],
  [21, 22, 23], [22, 23, 24], [23, 24, 25],
  [26, 27, 28], [27, 28, 29], [28, 29, 30],
  [31, 32, 33], [34, 35, 36],

  // Verticals
  [1, 4, 8], [4, 8, 13],
  [6, 11, 16], [11, 16, 21], [16, 21, 26],
  [7, 12, 17], [12, 17, 22], [17, 22, 27],
  [8, 13, 18], [13, 18, 23], [18, 23, 28],
  [9, 14, 19], [14, 19, 24], [19, 24, 29],
  [10, 15, 20], [15, 20, 25], [20, 25, 30],
  [23, 28, 32], [28, 32, 35],

  // Diagonals
  [0, 3, 8], [2, 5, 8],
  [28, 31, 34], [28, 33, 36],
  [6, 12, 18], [8, 12, 16],
  [8, 14, 20], [10, 14, 18],
  [16, 22, 28], [18, 22, 26],
  [18, 24, 30], [20, 24, 28]
];

// Generate Adjacency Graph
const ADJ: number[][] = Array.from({ length: 37 }, () => []);
LINE_PAIRS.forEach(([u, v]) => {
  if (!ADJ[u].includes(v)) ADJ[u].push(v);
  if (!ADJ[v].includes(u)) ADJ[v].push(u);
});

// Generate Jump Map
interface Jump {
  over: number;
  to: number;
}
const JUMPS: Jump[][] = Array.from({ length: 37 }, () => []);
TRIPLES.forEach(([a, b, c]) => {
  JUMPS[a].push({ over: b, to: c });
  JUMPS[c].push({ over: b, to: a });
});

function createInitialBoard(): number[] {
  const b = new Array(37).fill(0);
  for (let i = 0; i <= 15; i++) b[i] = 2; // Black / AI Beads
  for (let i = 21; i <= 36; i++) b[i] = 1; // Ivory / Player Beads
  return b;
}

type GameMode = 'vs_computer' | 'vs_friend';

// Premium SVG Icons
const HomeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const SingleUserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold-bright)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const TwoUsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold-bright)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M9 21v-2a4 4 0 0 0-4-4H3a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default function App() {
  const [showMenu, setShowMenu] = useState<boolean>(true);
  const [gameMode, setGameMode] = useState<GameMode>('vs_computer');
  const [board, setBoard] = useState<number[]>(() => createInitialBoard());
  const [turn, setTurn] = useState<number>(1); // 1 = Ivory, 2 = Black
  const [selected, setSelected] = useState<number>(-1);
  const [hasBonusTurn, setHasBonusTurn] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('Your Move');
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Helper functions
  const getLegalJumps = useCallback((pos: number, playerTurn: number, currentBoard: number[]) => {
    const opp = playerTurn === 1 ? 2 : 1;
    return JUMPS[pos].filter(j => currentBoard[j.over] === opp && currentBoard[j.to] === 0);
  }, []);

  const getLegalMoves = useCallback((pos: number, currentBoard: number[]) => {
    return ADJ[pos].filter(to => currentBoard[to] === 0);
  }, []);

  const hasAnyLegalMoves = useCallback((playerTurn: number, currentBoard: number[]) => {
    for (let i = 0; i < 37; i++) {
      if (currentBoard[i] === playerTurn) {
        if (getLegalJumps(i, playerTurn, currentBoard).length > 0) return true;
        if (getLegalMoves(i, currentBoard).length > 0) return true;
      }
    }
    return false;
  }, [getLegalJumps, getLegalMoves]);

  const checkWinCondition = useCallback((currentBoard: number[], currentTurn: number, mode: GameMode): boolean => {
    const p1Count = currentBoard.filter(v => v === 1).length;
    const p2Count = currentBoard.filter(v => v === 2).length;

    if (p2Count === 0) {
      if (mode === 'vs_computer') {
        setStatusText('Victory! You captured all 16 opponent beads!');
      } else {
        setStatusText('Player 1 (Ivory) Wins! All opponent beads captured!');
      }
      setGameOver(true);
      return true;
    } else if (p1Count === 0) {
      if (mode === 'vs_computer') {
        setStatusText('Computer Won!');
      } else {
        setStatusText('Player 2 (Black) Wins! All opponent beads captured!');
      }
      setGameOver(true);
      return true;
    } else if (!hasAnyLegalMoves(currentTurn, currentBoard)) {
      if (mode === 'vs_computer') {
        if (currentTurn === 1) {
          setStatusText('No moves available! Computer Wins!');
        } else {
          setStatusText('Computer is completely blocked! You Win!');
        }
      } else {
        if (currentTurn === 1) {
          setStatusText('Player 1 is completely blocked! Player 2 Wins!');
        } else {
          setStatusText('Player 2 is completely blocked! Player 1 Wins!');
        }
      }
      setGameOver(true);
      return true;
    }
    return false;
  }, [hasAnyLegalMoves]);

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setShowMenu(false);
    const newB = createInitialBoard();
    setBoard(newB);
    setTurn(1);
    setSelected(-1);
    setHasBonusTurn(false);
    setGameOver(false);
    setStatusText(mode === 'vs_computer' ? 'Your Move' : 'Player 1 Turn (Ivory)');
  };

  const initGame = () => {
    const newB = createInitialBoard();
    setBoard(newB);
    setTurn(1);
    setSelected(-1);
    setHasBonusTurn(false);
    setGameOver(false);
    setStatusText(gameMode === 'vs_computer' ? 'Your Move' : 'Player 1 Turn (Ivory)');
  };

  // Execute a Capture Jump Move (Awards Bonus Turn)
  const executeCapture = useCallback((from: number, over: number, to: number, playerTurn: number) => {
    setBoard(prevBoard => {
      const nextBoard = [...prevBoard];
      nextBoard[to] = playerTurn;
      nextBoard[from] = 0;
      nextBoard[over] = 0;

      setSelected(-1);
      setHasBonusTurn(true);

      const isEnded = checkWinCondition(nextBoard, playerTurn, gameMode);
      if (!isEnded) {
        if (gameMode === 'vs_computer') {
          if (playerTurn === 1) {
            setStatusText('Free Bonus Move! Capture again or make a move.');
          } else {
            setStatusText('Computer Bonus Turn...');
          }
        } else {
          setStatusText(
            playerTurn === 1
              ? 'Player 1 Bonus Turn! Move or capture again.'
              : 'Player 2 Bonus Turn! Move or capture again.'
          );
        }
      }

      return nextBoard;
    });
  }, [checkWinCondition, gameMode]);

  // Execute a Simple Step Move (Consumes Turn)
  const executeSimpleMove = useCallback((from: number, to: number, playerTurn: number) => {
    setBoard(prevBoard => {
      const nextBoard = [...prevBoard];
      nextBoard[to] = playerTurn;
      nextBoard[from] = 0;

      setSelected(-1);
      setHasBonusTurn(false);

      const nextTurn = playerTurn === 1 ? 2 : 1;
      setTurn(nextTurn);

      const isEnded = checkWinCondition(nextBoard, nextTurn, gameMode);
      if (!isEnded) {
        if (gameMode === 'vs_computer') {
          setStatusText(nextTurn === 1 ? 'Your Move' : 'Computer Thinking...');
        } else {
          setStatusText(nextTurn === 1 ? 'Player 1 Turn (Ivory)' : 'Player 2 Turn (Black)');
        }
      }

      return nextBoard;
    });
  }, [checkWinCondition, gameMode]);

  // AI Computer Turn (only active in vs_computer mode)
  useEffect(() => {
    if (showMenu || gameOver || gameMode !== 'vs_computer' || turn !== 2) return;

    const timer = setTimeout(() => {
      // 1. Priority 1: Captures (Gives another bonus turn)
      const captureMoves: { from: number; over: number; to: number }[] = [];
      for (let i = 0; i < 37; i++) {
        if (board[i] === 2) {
          const jumps = getLegalJumps(i, 2, board);
          jumps.forEach(j => captureMoves.push({ from: i, over: j.over, to: j.to }));
        }
      }

      if (captureMoves.length > 0) {
        const move = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        executeCapture(move.from, move.over, move.to, 2);
        return;
      }

      // 2. Priority 2: Simple Moves (Consumes turn & bonus turn)
      const simpleMoves: { from: number; to: number }[] = [];
      for (let i = 0; i < 37; i++) {
        if (board[i] === 2) {
          const steps = getLegalMoves(i, board);
          steps.forEach(to => simpleMoves.push({ from: i, to }));
        }
      }

      if (simpleMoves.length > 0) {
        const move = simpleMoves[Math.floor(Math.random() * simpleMoves.length)];
        executeSimpleMove(move.from, move.to, 2);
      } else {
        checkWinCondition(board, 2, 'vs_computer');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    turn,
    hasBonusTurn,
    board,
    gameOver,
    gameMode,
    showMenu,
    getLegalJumps,
    getLegalMoves,
    executeCapture,
    executeSimpleMove,
    checkWinCondition
  ]);

  // Player Tap Handler
  const handleTap = (i: number) => {
    if (gameOver || showMenu) return;
    if (gameMode === 'vs_computer' && turn === 2) return; // Computer thinking

    // Select Player's Bead
    if (board[i] === turn) {
      setSelected(i);
      return;
    }

    // Execute Move
    if (selected !== -1 && board[i] === 0) {
      const jumps = getLegalJumps(selected, turn, board);
      const matchedJump = jumps.find(j => j.to === i);

      if (matchedJump) {
        executeCapture(selected, matchedJump.over, matchedJump.to, turn);
      } else if (ADJ[selected].includes(i)) {
        executeSimpleMove(selected, i, turn);
      }
    }
  };

  const p1Count = board.filter(v => v === 1).length;
  const p2Count = board.filter(v => v === 2).length;

  const currentJumps = selected !== -1 ? getLegalJumps(selected, turn, board) : [];
  const currentSteps = selected !== -1 ? getLegalMoves(selected, board) : [];

  return (
    <div className="game-wrapper">
      <style>{`
        :root {
          --bg-dark:       #060403;
          --gold-line:     #e2b453;
          --gold-bright:   #fce49c;
          --gold-border:   #5e441f;
          --gold-frame:    #b88d3b;
          --serif-font:    'Georgia', 'Times New Roman', serif;
          --sans-font:     -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        * { 
          box-sizing: border-box; 
          -webkit-tap-highlight-color: transparent; 
        }

        .game-wrapper {
          margin: 0; 
          padding: 0; 
          width: 100vw; 
          height: 100vh;
          background-color: var(--bg-dark);
          color: #ffffff;
          font-family: var(--sans-font);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          -webkit-user-select: none; 
          user-select: none;
          position: relative;
        }

        /* HOME / MENU OVERLAY */
        .menu-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, #18110a 0%, #060403 100%);
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          text-align: center;
        }

        .menu-title {
          font-family: var(--serif-font);
          font-size: 2.2rem;
          font-weight: bold;
          color: var(--gold-bright);
          text-shadow: 0 2px 10px rgba(226, 180, 83, 0.4);
          margin: 0 0 4px 0;
          letter-spacing: 0.05em;
        }

        .menu-subtitle {
          font-size: 0.85rem;
          color: var(--gold-line);
          margin-bottom: 32px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .mode-cards-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          max-width: 320px;
        }

        .mode-card {
          background: linear-gradient(180deg, #22180f 0%, #110a05 100%);
          border: 1.5px solid var(--gold-frame);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          box-shadow: 0 6px 16px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1);
          text-align: left;
        }

        .mode-card:hover, .mode-card:active {
          transform: translateY(-2px) scale(1.02);
          border-color: var(--gold-bright);
          box-shadow: 0 10px 24px rgba(226, 180, 83, 0.25), inset 0 1px 2px rgba(255,255,255,0.2);
        }

        .mode-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(184, 141, 59, 0.15);
          border: 1px solid var(--gold-border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .mode-info .mode-name {
          font-family: var(--serif-font);
          font-size: 1.1rem;
          font-weight: bold;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .mode-info .mode-desc {
          font-size: 0.75rem;
          color: #a89474;
          line-height: 1.2;
        }

        .rule-preview {
          margin-top: 36px;
          max-width: 320px;
          background: rgba(18, 12, 7, 0.7);
          border: 1px solid var(--gold-border);
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 0.75rem;
          color: #c7b599;
          line-height: 1.45;
          text-align: left;
        }

        .rule-preview-title {
          font-family: var(--serif-font);
          color: var(--gold-bright);
          font-weight: bold;
          font-size: 0.82rem;
          margin-bottom: 4px;
          letter-spacing: 0.05em;
        }

        /* TOP HEADER */
        .top-container {
          width: 100%;
          max-width: 430px;
          padding: 10px 16px 2px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .nav-bar {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .nav-btn {
          background: linear-gradient(180deg, #1d140b, #0c0804);
          border: 1px solid var(--gold-border);
          color: var(--gold-bright);
          font-size: 0.72rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          letter-spacing: 0.03em;
        }

        .nav-btn:active {
          transform: scale(0.96);
        }

        .players-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .player-card {
          flex: 1;
          background: linear-gradient(180deg, #18110a 0%, #0c0804 100%);
          border: 1.2px solid var(--gold-border);
          border-radius: 12px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.05), 0 4px 8px rgba(0,0,0,0.6);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .player-card.active-turn {
          border-color: var(--gold-bright);
          box-shadow: 0 0 10px rgba(252, 228, 156, 0.25);
        }

        .player-card.right {
          justify-content: flex-end;
          text-align: right;
        }

        .player-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .player-avatar.ivory-icon {
          background: radial-gradient(circle at 35% 30%, #ffffff 0%, #eae0d0 35%, #bca98b 70%, #736248 100%);
          border: 1px solid #7a664d;
        }

        .player-avatar.black-icon {
          background: radial-gradient(circle at 35% 30%, #808080 0%, #3e3e3e 35%, #1c1c1c 70%, #050505 100%);
          border: 1.2px solid #a89163;
        }

        .player-info .name {
          font-family: var(--serif-font);
          font-size: 0.85rem;
          font-weight: 600;
          color: #f0e8dc;
        }

        .player-info .sub {
          font-size: 0.55rem;
          letter-spacing: 0.1em;
          color: var(--gold-line);
          font-weight: 600;
          text-transform: uppercase;
        }

        .vs-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #060403;
          border: 1.2px solid var(--gold-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          color: var(--gold-bright);
          font-weight: bold;
          margin: 0 4px;
        }

        .score-bars-row {
          width: 100%;
          display: flex;
          justify-content: space-between;
          padding: 0 2px;
        }

        .pips-group {
          display: flex;
          gap: 3px;
          max-width: 150px;
          flex-wrap: wrap;
        }

        .pip {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #181108;
        }

        .pip.ivory-pip { background: radial-gradient(circle at 35% 30%, #ffffff, #c7b599); }
        .pip.black-pip { background: radial-gradient(circle at 35% 30%, #888888, #222222); border: 0.5px solid #aaa; }

        .turn-pill {
          padding: 5px 18px;
          border-radius: 12px;
          background: linear-gradient(180deg, #150e08, #090503);
          border: 1px solid var(--gold-border);
          font-family: var(--serif-font);
          font-size: 0.78rem;
          color: var(--gold-bright);
          text-align: center;
          letter-spacing: 0.03em;
        }

        /* BOARD CONTAINER */
        .board-wrap {
          position: relative;
          width: 95vw;
          max-width: 420px;
          flex: 1;
          margin: 6px 0 10px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .board-slab {
          position: absolute; 
          inset: 0;
          border-radius: 20px;
          background: repeating-linear-gradient(135deg, #19110a 0px, #19110a 3px, #110b06 3px, #110b06 8px);
          border: 2px solid var(--gold-frame);
          box-shadow: 0 0 0 3px #080503, 0 0 0 4.5px var(--gold-border), inset 0 0 30px rgba(0,0,0,0.9);
        }

        .grid-square {
          position: absolute;
          inset: 12px 8px;
          z-index: 1;
        }

        svg.lines {
          position: absolute; 
          inset: 0; 
          width: 100%; 
          height: 100%;
          pointer-events: none;
        }

        svg.lines line {
          stroke: var(--gold-line);
          stroke-width: 1.8px;
          vector-effect: non-scaling-stroke;
          stroke-linecap: round;
        }

        .points-layer { 
          position: absolute; 
          inset: 0; 
        }

        .spot {
          position: absolute;
          width: 10%; 
          height: 6%;
          transform: translate(-50%,-50%);
          display: flex; 
          align-items: center; 
          justify-content: center;
          cursor: pointer;
          z-index: 2;
        }

        .spot .node {
          width: 10px; 
          height: 10px;
          border-radius: 50%;
          background: transparent;
          border: 1.5px solid #d8a846;
        }

        .spot.hint .node {
          border: 2px dashed var(--gold-bright);
          animation: hintPulse 1.2s ease-in-out infinite;
        }

        .spot.capture-hint .node {
          border: 2px solid #ff4d4d;
          background: rgba(255, 77, 77, 0.4);
          animation: hintPulse 0.8s ease-in-out infinite;
        }

        @keyframes hintPulse {
          0%, 100% { transform: scale(0.85); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
        }

        .bead {
          position: absolute;
          width: min(6.8vw, 27px); 
          height: min(6.8vw, 27px);
          border-radius: 50%;
          display: none;
          transition: transform .15s ease;
        }

        .bead.p1 {
          display: block;
          background: radial-gradient(circle at 35% 30%, #ffffff 0%, #eae0d0 35%, #bca98b 70%, #736248 100%);
          box-shadow: inset 0 -2px 3px rgba(0,0,0,0.4), inset 0 1.5px 2px rgba(255,255,255,0.9), 0 3px 6px rgba(0,0,0,0.75);
        }

        .bead.p2 {
          display: block;
          background: radial-gradient(circle at 32% 28%, #808080 0%, #3e3e3e 35%, #1c1c1c 70%, #050505 100%);
          border: 1.2px solid #cbb27d;
          box-shadow: 0 0 6px rgba(0,0,0,0.95);
        }

        .spot.selected .bead {
          transform: scale(1.2) translateY(-3px);
          box-shadow: 0 8px 14px rgba(0,0,0,0.85), 0 0 0 2.5px var(--gold-bright);
        }

        .action-btns {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .restart-btn {
          padding: 6px 14px;
          font-size: 0.75rem;
          background: linear-gradient(180deg, #b88d3b, #5e441f);
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }
      `}</style>

      {/* HOME / MENU OVERLAY */}
      {showMenu && (
        <div className="menu-overlay">
          <h1 className="menu-title">SHOLO GUTI</h1>
          <div className="menu-subtitle">16 BEAD STRATEGY BOARD GAME</div>

          <div className="mode-cards-container">
            <div className="mode-card" onClick={() => startGame('vs_computer')}>
              <div className="mode-icon">
                <SingleUserIcon />
              </div>
              <div className="mode-info">
                <div className="mode-name">Play vs Computer</div>
                <div className="mode-desc">Single player game against intelligent AI Bot</div>
              </div>
            </div>

            <div className="mode-card" onClick={() => startGame('vs_friend')}>
              <div className="mode-icon">
                <TwoUsersIcon />
              </div>
              <div className="mode-info">
                <div className="mode-name">Pass & Play (vs Friend)</div>
                <div className="mode-desc">2 Players on same device, take turns tapping</div>
              </div>
            </div>
          </div>

          <div className="rule-preview">
            <div className="rule-preview-title">GAME RULES</div>
            Jump over an adjacent opponent bead onto an empty node to capture it. Every capture awards a Free Bonus Move allowing you to capture again or move any bead. Eliminate all 16 opponent beads or block their legal moves to win!
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="top-container">
        <div className="nav-bar">
          <button className="nav-btn" onClick={() => setShowMenu(true)}>
            <HomeIcon /> MODES
          </button>
          <button className="nav-btn" onClick={initGame}>
            <RefreshIcon /> RESTART
          </button>
        </div>

        <div className="players-row">
          <div className={`player-card ${turn === 1 ? 'active-turn' : ''}`}>
            <div className="player-avatar ivory-icon"></div>
            <div className="player-info">
              <div className="name">{gameMode === 'vs_computer' ? 'You' : 'Player 1'}</div>
              <div className="sub">IVORY</div>
            </div>
          </div>

          <div className="vs-badge">VS</div>

          <div className={`player-card right ${turn === 2 ? 'active-turn' : ''}`}>
            <div className="player-info">
              <div className="name">{gameMode === 'vs_computer' ? 'Computer' : 'Player 2'}</div>
              <div className="sub">BLACK</div>
            </div>
            <div className="player-avatar black-icon"></div>
          </div>
        </div>

        <div className="score-bars-row">
          <div className="pips-group">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className={`pip ${i < p1Count ? 'ivory-pip' : ''}`} />
            ))}
          </div>
          <div className="pips-group">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className={`pip ${i < p2Count ? 'black-pip' : ''}`} />
            ))}
          </div>
        </div>

        <div className="turn-pill">{statusText}</div>

        {gameOver && (
          <div className="action-btns">
            <button className="restart-btn" onClick={initGame}>
              <RefreshIcon /> Play Again
            </button>
            <button className="restart-btn" onClick={() => setShowMenu(true)}>
              <HomeIcon /> Change Mode
            </button>
          </div>
        )}
      </div>

      {/* BOARD CONTAINER */}
      <div className="board-wrap">
        <div className="board-slab"></div>
        <div className="grid-square">
          <svg className="lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            {LINE_PAIRS.map(([u, v], idx) => (
              <line
                key={idx}
                x1={`${COORDS[u].l}%`}
                y1={`${COORDS[u].t}%`}
                x2={`${COORDS[v].l}%`}
                y2={`${COORDS[v].t}%`}
              />
            ))}
          </svg>

          <div className="points-layer">
            {COORDS.map((coord, i) => {
              const isSelected = selected === i;
              const isHint = currentSteps.includes(i);
              const isCaptureHint = currentJumps.some(j => j.to === i);

              return (
                <div
                  key={i}
                  className={`spot ${isSelected ? 'selected' : ''} ${isHint ? 'hint' : ''} ${isCaptureHint ? 'capture-hint' : ''}`}
                  style={{ top: `${coord.t}%`, left: `${coord.l}%` }}
                  onClick={() => handleTap(i)}
                >
                  <div
                    className="node"
                    id={`node-${i}`}
                    style={{ display: board[i] !== 0 ? 'none' : 'block' }}
                  />
                  <div
                    className={`bead ${board[i] === 1 ? 'p1' : ''} ${board[i] === 2 ? 'p2' : ''}`}
                    id={`bead-${i}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

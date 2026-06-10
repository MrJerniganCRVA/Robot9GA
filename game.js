// ============================================================
// DUNGEON ESCAPE — game.js
// ============================================================
// Tile types
const T = {
  FLOOR: 'F',
  WALL:  'W',
  TRAP:  'T',
  HOLE:  'H',
  EXIT:  'E',
};

// Directions
const DIR = {
  move_up:    { dr: -1, dc:  0, img: 'knight_up.png'    },
  move_down:  { dr:  1, dc:  0, img: 'knight_down.png'  },
  move_left:  { dr:  0, dc: -1, img: 'knight_left.png'  },
  move_right: { dr:  0, dc:  1, img: 'knight_right.png' },
  jump_up:    { dr: -2, dc:  0, img: 'knight_up.png',    jump: true },
  jump_down:  { dr:  2, dc:  0, img: 'knight_down.png',  jump: true },
  jump_left:  { dr:  0, dc: -2, img: 'knight_left.png',  jump: true },
  jump_right: { dr:  0, dc:  2, img: 'knight_right.png', jump: true },
};

// Command display labels
const CMD_LABELS = {
  move_up:    'Move Forward (Up)',
  move_down:  'Move Back (Down)',
  move_left:  'Move Left',
  move_right: 'Move Right',
  jump_up:    'Jump Up',
  jump_down:  'Jump Down',
  jump_left:  'Jump Left',
  jump_right: 'Jump Right',
};

const LEVEL_1 = {
  title: 'Level I — The Depths',
  subtitle: 'Guide Sir Aldric to the dungeon exit.',
  showJump: false,
  grid: [
    ['W','W','W','W','W','W','W'],
    ['W','K','F','F','W','F','W'],
    ['W','W','W','F','W','F','W'],
    ['W','F','F','F','F','F','W'],
    ['W','F','W','W','W','T','W'],
    ['W','F','F','F','F','F','W'],
    ['W','W','W','W','E','W','W'],
  ],
  successMsg: 'Sir Aldric emerges from the depths. A bonus challenge awaits…',
};

// Level 2: 9x9, has holes, requires jump commands
const LEVEL_2 = {
  title: 'Level II — The Abyss',
  subtitle: 'New danger: holes in the floor. Use Jump to cross them.',
  showJump: true,
  grid: [
    ['W','W','W','W','W','W','W','W','W'],
    ['W','K','F','F','W','F','F','F','W'],
    ['W','W','W','H','W','F','W','F','W'],
    ['W','F','F','F','H','F','W','F','W'],
    ['W','F','W','W','W','F','W','T','W'],
    ['W','F','F','F','F','F','F','F','W'],
    ['W','W','W','T','W','W','W','F','W'],
    ['W','F','F','F','F','F','F','E','W'],
    ['W','W','W','W','W','W','W','W','W'],
  ],
  successMsg: 'Sir Aldric escapes Eldenveil forever. The dungeon crumbles behind him.',
};
const LEVEL_3 = {
  title: 'Wide Open Spaces',
  subtitle: 'Just a large room',
  showJump:true,
  grid:[
    ['K', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F'],
    ['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F'],
    ['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F'],
    ['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F'],
    ['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F'],
    ['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F'],
    ['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F'],
    ['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F'],
    ['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F'],
    ['F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'E'],
    ],
  successMsg: 'You didn\'t fall into any of those traps..good for you!'
};
const LEVELS = [LEVEL_1, LEVEL_2];

// ── STATE ────────────────────────────────────────────────────
let state = {
  levelIndex:   0,
  knightRow:    0,
  knightCol:    0,
  commands:     [],
  running:      false,
  hasRun:       false,
  currentLevel: null,
  gridData:     [],
};

// ── DOM REFS ─────────────────────────────────────────────────
const screens = {
  intro:    document.getElementById('screen-intro'),
  game:     document.getElementById('screen-game'),
  success:  document.getElementById('screen-success'),
  failure:  document.getElementById('screen-failure'),
  complete: document.getElementById('screen-complete'),
};

const elGrid        = document.getElementById('dungeon-grid');
const elCmdList     = document.getElementById('command-list');
const elLevelTitle  = document.getElementById('level-title');
const elLevelSub    = document.getElementById('level-subtitle');
const elStatusBar   = document.getElementById('status-bar');
const elStatusMsg   = document.getElementById('status-message');
const elBtnRun      = document.getElementById('btn-run');
const elBtnClear    = document.getElementById('btn-clear');
const elJumpLabel   = document.getElementById('jump-label');
const elSpecialBtns = document.getElementById('special-btns');
const elSuccessMsg  = document.getElementById('success-message');
const elSuccessTitle= document.getElementById('success-title');

// ── SCREEN MANAGEMENT ────────────────────────────────────────
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ── LEVEL INIT ───────────────────────────────────────────────
function loadLevel(index) {
  const level = LEVELS[index];
  state.levelIndex   = index;
  state.currentLevel = level;
  state.commands     = [];
  state.running      = false;
  state.hasRun       = false;

  // Parse grid, find knight start
  state.gridData = level.grid.map(row => [...row]);
  for (let r = 0; r < state.gridData.length; r++) {
    for (let c = 0; c < state.gridData[r].length; c++) {
      if (state.gridData[r][c] === 'K') {
        state.knightRow = r;
        state.knightCol = c;
        state.gridData[r][c] = 'F'; // treat start as floor
      }
    }
  }

  // UI
  elLevelTitle.textContent = level.title;
  elLevelSub.textContent   = level.subtitle;

  // Show/hide jump buttons
  elJumpLabel.style.display   = level.showJump ? '' : 'none';
  elSpecialBtns.style.display = level.showJump ? '' : 'none';

  renderGrid();
  renderCommands();
  setControlsEnabled(true);
  hideStatus();
}

// ── GRID RENDER ──────────────────────────────────────────────
function renderGrid() {
  const rows = state.gridData.length;
  const cols = state.gridData[0].length;

  elGrid.style.gridTemplateColumns = `repeat(${cols}, var(--cell))`;
  elGrid.style.gridTemplateRows    = `repeat(${rows}, var(--cell))`;
  elGrid.innerHTML = '';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.id = `cell-${r}-${c}`;

      const tile = state.gridData[r][c];

      // Background tile image
      const bg = document.createElement('img');
      bg.alt = tile;

      switch (tile) {
        case T.WALL:  bg.src = 'assets/wall.png';  break;
        case T.TRAP:  bg.src = 'assets/trap.png';  break;
        case T.HOLE:  bg.src = 'assets/hole.png';  break;
        case T.EXIT:  bg.src = 'assets/exit.png';  break;
        default:      bg.src = 'assets/floor.png'; break;
      }

      cell.appendChild(bg);

      // Knight on starting cell
      if (r === state.knightRow && c === state.knightCol) {
        placeKnightOnCell(cell, 'knight_down.png');
      }

      elGrid.appendChild(cell);
    }
  }
}

function placeKnightOnCell(cell, imgSrc) {
  // Remove any existing knight image
  const existing = cell.querySelector('.knight-img');
  if (existing) existing.remove();

  const k = document.createElement('img');
  k.src = `assets/${imgSrc}`;
  k.alt = 'knight';
  k.classList.add('knight-img');
  cell.appendChild(k);
}

function removeKnightFromCell(row, col) {
  const cell = document.getElementById(`cell-${row}-${col}`);
  if (!cell) return;
  const k = cell.querySelector('.knight-img');
  if (k) k.remove();
}

// ── COMMAND QUEUE ─────────────────────────────────────────────
function renderCommands() {
  elCmdList.innerHTML = '';
  if (state.commands.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.classList.add('command-placeholder');
    placeholder.textContent = 'No commands yet…';
    elCmdList.appendChild(placeholder);
    return;
  }
  state.commands.forEach((cmd, i) => {
    const li = document.createElement('li');
    li.classList.add('command-item');
    li.id = `cmd-item-${i}`;
    if (DIR[cmd]?.jump) li.classList.add('jump-item');

    const num = document.createElement('span');
    num.classList.add('cmd-num');
    num.textContent = `${i + 1}.`;

    const label = document.createElement('span');
    label.textContent = CMD_LABELS[cmd] || cmd;

    li.appendChild(num);
    li.appendChild(label);
    elCmdList.appendChild(li);
  });
  // Scroll to bottom
  elCmdList.scrollTop = elCmdList.scrollHeight;
}

function addCommand(cmd) {
  if (state.hasRun || state.running) return;
  state.commands.push(cmd);
  renderCommands();
}

function clearCommands() {
  if (state.hasRun || state.running) return;
  state.commands = [];
  renderCommands();
}

// ── STATUS BAR ────────────────────────────────────────────────
function showStatus(msg, type) {
  elStatusBar.className = `status-bar ${type}`;
  elStatusMsg.textContent = msg;
}
function hideStatus() {
  elStatusBar.className = 'status-bar hidden';
  elStatusMsg.textContent = '';
}

// ── CONTROLS ENABLE/DISABLE ───────────────────────────────────
function setControlsEnabled(enabled) {
  document.querySelectorAll('.btn-cmd').forEach(b => b.disabled = !enabled);
  elBtnRun.disabled   = !enabled;
  elBtnClear.disabled = !enabled;
}

// ── RUN COMMANDS ──────────────────────────────────────────────
async function runCommands() {
  if (state.hasRun || state.running || state.commands.length === 0) return;

  state.running = true;
  state.hasRun  = true;
  setControlsEnabled(false);

  let row = state.knightRow;
  let col = state.knightCol;
  let currentKnightImg = 'knight_down.png';

  for (let i = 0; i < state.commands.length; i++) {
    const cmd = state.commands[i];
    const dir = DIR[cmd];
    if (!dir) continue;

    // Highlight current command in queue
    document.querySelectorAll('.command-item').forEach(el => el.classList.remove('executing'));
    const cmdEl = document.getElementById(`cmd-item-${i}`);
    if (cmdEl) {
      cmdEl.classList.add('executing');
      cmdEl.scrollIntoView({ block: 'nearest' });
    }

    // Face the knight
    currentKnightImg = dir.img;

    // ── JUMP: check middle cell isn't a wall, land on destination ──
    if (dir.jump) {
      const midRow = row + Math.sign(dir.dr);
      const midCol = col + Math.sign(dir.dc);
      const destRow = row + dir.dr;
      const destCol = col + dir.dc;

      // Update knight facing on current cell
      const fromCell = document.getElementById(`cell-${row}-${col}`);
      if (fromCell) placeKnightOnCell(fromCell, currentKnightImg);

      await sleep(280);

      // Bounds check
      if (!inBounds(destRow, destCol)) {
        await animateFailure(row, col);
        showScreen('failure');
        document.getElementById('failure-message').textContent =
          'Sir Aldric leapt into the dungeon wall and was never seen again.';
        return;
      }

      // Can't jump over a wall (mid cell)
      if (inBounds(midRow, midCol) && state.gridData[midRow][midCol] === T.WALL) {
        await animateFailure(row, col);
        showScreen('failure');
        document.getElementById('failure-message').textContent =
          'Sir Aldric crashed into a wall mid-jump. Walls cannot be leapt over.';
        return;
      }

      const destTile = state.gridData[destRow][destCol];

      // Move knight
      removeKnightFromCell(row, col);
      row = destRow;
      col = destCol;
      const toCell = document.getElementById(`cell-${row}-${col}`);
      if (toCell) {
        placeKnightOnCell(toCell, currentKnightImg);
        toCell.querySelector('.knight-img').classList.add('moving');
      }
      await sleep(320);

      if (destTile === T.WALL) {
        await animateFailure(row, col);
        showScreen('failure');
        document.getElementById('failure-message').textContent =
          'Sir Aldric landed inside a wall. That should not be possible.';
        return;
      }
      if (destTile === T.TRAP) {
        flashTrap(row, col);
        await sleep(500);
        showScreen('failure');
        document.getElementById('failure-message').textContent =
          'Sir Aldric landed on a trap after jumping. Plan more carefully next time.';
        return;
      }
      if (destTile === T.HOLE) {
        await animateFailure(row, col);
        showScreen('failure');
        document.getElementById('failure-message').textContent =
          'Sir Aldric landed in a hole. A jump must clear the hole entirely.';
        return;
      }
      if (destTile === T.EXIT) {
        await sleep(200);
        handleSuccess();
        return;
      }

    } else {
      // ── NORMAL MOVE ──────────────────────────────────────────
      const destRow = row + dir.dr;
      const destCol = col + dir.dc;

      // Update facing on current cell first
      const fromCell = document.getElementById(`cell-${row}-${col}`);
      if (fromCell) placeKnightOnCell(fromCell, currentKnightImg);

      await sleep(280);

      // Bounds check
      if (!inBounds(destRow, destCol)) {
        await animateFailure(row, col);
        showScreen('failure');
        document.getElementById('failure-message').textContent =
          'Sir Aldric walked into the dungeon wall and could not escape.';
        return;
      }

      const destTile = state.gridData[destRow][destCol];

      if (destTile === T.WALL) {
        await animateFailure(row, col);
        showScreen('failure');
        document.getElementById('failure-message').textContent =
          'Sir Aldric walked into a wall. His armor did not save him. Check your path and try again.';
        return;
      }
      if (destTile === T.HOLE) {
        await animateFailure(row, col);
        showScreen('failure');
        document.getElementById('failure-message').textContent =
          'Sir Aldric fell into a hole in the floor. Use the Jump command to cross holes.';
        return;
      }

      // Move knight
      removeKnightFromCell(row, col);
      row = destRow;
      col = destCol;

      const toCell = document.getElementById(`cell-${row}-${col}`);
      if (toCell) {
        placeKnightOnCell(toCell, currentKnightImg);
        toCell.querySelector('.knight-img').classList.add('moving');
      }
      await sleep(320);

      if (destTile === T.TRAP) {
        flashTrap(row, col);
        await sleep(500);
        showScreen('failure');
        document.getElementById('failure-message').textContent =
          'Sir Aldric stepped on a trap. Study the dungeon more carefully.';
        return;
      }
      if (destTile === T.EXIT) {
        await sleep(200);
        handleSuccess();
        return;
      }
    }
  }

  // Ran out of commands without reaching exit
  state.running = false;
  showStatus('Commands complete — but Sir Aldric has not reached the exit yet.', 'info');
  // NOTE: hasRun stays true — they cannot run again
}

// ── SUCCESS HANDLER ───────────────────────────────────────────
function handleSuccess() {
  const level = state.currentLevel;
  if (state.levelIndex < LEVELS.length - 1) {
    // More levels
    elSuccessTitle.textContent = 'Sir Aldric Escapes!';
    elSuccessMsg.textContent   = level.successMsg;
    document.getElementById('btn-next').style.display = '';
    showScreen('success');
  } else {
    // Final level complete
    showScreen('complete');
  }
}

// ── ANIMATIONS ────────────────────────────────────────────────
function flashTrap(row, col) {
  const cell = document.getElementById(`cell-${row}-${col}`);
  if (cell) {
    cell.classList.add('trap-flash');
    cell.addEventListener('animationend', () => cell.classList.remove('trap-flash'), { once: true });
  }
}

async function animateFailure(row, col) {
  const cell = document.getElementById(`cell-${row}-${col}`);
  if (cell) {
    cell.classList.add('trap-flash');
    await sleep(450);
    cell.classList.remove('trap-flash');
  }
}

// ── HELPERS ───────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function inBounds(r, c) {
  return r >= 0 && r < state.gridData.length && c >= 0 && c < state.gridData[0].length;
}

// ── EVENT LISTENERS ───────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', () => {
  loadLevel(0);
  showScreen('game');
});

elBtnRun.addEventListener('click', runCommands);

elBtnClear.addEventListener('click', clearCommands);

document.querySelectorAll('.btn-cmd').forEach(btn => {
  btn.addEventListener('click', () => {
    const cmd = btn.dataset.cmd;
    if (cmd) addCommand(cmd);
  });
});

document.getElementById('btn-next').addEventListener('click', () => {
  loadLevel(state.levelIndex + 1);
  showScreen('game');
});

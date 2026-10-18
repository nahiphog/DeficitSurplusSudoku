const regionMap = [
  [1, 1, 2, 2, 3, 3, 3],
  [1, 1, 2, 2, 3, 3, 3],
  [1, 1, 2, 2, 4, 4, 4],
  [5, 5, 5, 9, 4, 4, 4],
  [5, 5, 5, 7, 7, 8, 8],
  [6, 6, 6, 7, 7, 8, 8],
  [6, 6, 6, 7, 7, 8, 8],
];

const finalBoard = document.querySelector('#final-board');
const completedBoard = document.querySelector('#completed-board');
const button = document.querySelector('#generate');
const status = document.querySelector('#status');
const clueCount = document.querySelector('#clue-count');
const timing = document.querySelector('#timing');
const diggingMethod = document.querySelector('#digging-method');
const numbers = [1, 2, 3, 4, 5, 6, 7];

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generate() {
  const grid = Array.from({ length: 7 }, () => Array(7).fill(0));
  const rowUsed = Array.from({ length: 7 }, () => new Set());
  const columnUsed = Array.from({ length: 7 }, () => new Set());
  const regionUsed = Array.from({ length: 10 }, () => new Set());

  function solve(filled) {
    if (filled === 49) return true;
    let target;
    let targetOptions = [];
    for (let row = 0; row < 7; row += 1) for (let col = 0; col < 7; col += 1) {
      if (grid[row][col]) continue;
      const region = regionMap[row][col];
      const options = shuffled(numbers.filter(n => !rowUsed[row].has(n) && !columnUsed[col].has(n) && !regionUsed[region].has(n)));
      if (!target || options.length < targetOptions.length) { target = [row, col]; targetOptions = options; }
      if (targetOptions.length <= 1) break;
    }
    if (!target || targetOptions.length === 0) return false;
    const [row, col] = target;
    const region = regionMap[row][col];
    for (const value of targetOptions) {
      grid[row][col] = value; rowUsed[row].add(value); columnUsed[col].add(value); regionUsed[region].add(value);
      if (solve(filled + 1)) return true;
      grid[row][col] = 0; rowUsed[row].delete(value); columnUsed[col].delete(value); regionUsed[region].delete(value);
    }
    return false;
  }
  if (!solve(0)) throw new Error('No valid board found.');
  return grid;
}

function countSolutions(puzzle, limit = 2) {
  const grid = puzzle.map(row => [...row]);
  const rowUsed = Array.from({ length: 7 }, () => new Set());
  const columnUsed = Array.from({ length: 7 }, () => new Set());
  const regionUsed = Array.from({ length: 10 }, () => new Set());
  let filled = 0;
  for (let row = 0; row < 7; row += 1) for (let col = 0; col < 7; col += 1) {
    const value = grid[row][col];
    if (!value) continue;
    const region = regionMap[row][col];
    if (rowUsed[row].has(value) || columnUsed[col].has(value) || regionUsed[region].has(value)) return 0;
    rowUsed[row].add(value); columnUsed[col].add(value); regionUsed[region].add(value); filled += 1;
  }
  let solutions = 0;
  function solve(placed) {
    if (solutions >= limit) return;
    if (placed === 49) { solutions += 1; return; }
    let target;
    let targetOptions = [];
    for (let row = 0; row < 7; row += 1) for (let col = 0; col < 7; col += 1) {
      if (grid[row][col]) continue;
      const region = regionMap[row][col];
      const options = numbers.filter(n => !rowUsed[row].has(n) && !columnUsed[col].has(n) && !regionUsed[region].has(n));
      if (!target || options.length < targetOptions.length) { target = [row, col]; targetOptions = options; }
      if (targetOptions.length <= 1) break;
    }
    if (!target || !targetOptions.length) return;
    const [row, col] = target;
    const region = regionMap[row][col];
    for (const value of targetOptions) {
      grid[row][col] = value; rowUsed[row].add(value); columnUsed[col].add(value); regionUsed[region].add(value);
      solve(placed + 1);
      grid[row][col] = 0; rowUsed[row].delete(value); columnUsed[col].delete(value); regionUsed[region].delete(value);
      if (solutions >= limit) return;
    }
  }
  solve(filled);
  return solutions;
}

function digSingle(completed) {
  const puzzle = completed.map(row => [...row]);
  for (const index of shuffled(Array.from({ length: 49 }, (_, i) => i))) {
    const row = Math.floor(index / 7);
    const col = index % 7;
    const saved = puzzle[row][col];
    puzzle[row][col] = 0;
    if (countSolutions(puzzle) !== 1) puzzle[row][col] = saved;
  }
  return puzzle;
}

function digDual(completed) {
  const puzzle = completed.map(row => [...row]);
  const visited = new Set();
  for (const index of shuffled(Array.from({ length: 49 }, (_, i) => i))) {
    const row = Math.floor(index / 7);
    const col = index % 7;
    const pairedRow = 6 - row;
    const pairedCol = 6 - col;
    if (row === pairedRow && col === pairedCol) continue;
    const key = [`${row}:${col}`, `${pairedRow}:${pairedCol}`].sort().join('|');
    if (visited.has(key)) continue;
    visited.add(key);
    const first = puzzle[row][col];
    const second = puzzle[pairedRow][pairedCol];
    puzzle[row][col] = 0;
    puzzle[pairedRow][pairedCol] = 0;
    if (countSolutions(puzzle) !== 1) { puzzle[row][col] = first; puzzle[pairedRow][pairedCol] = second; }
  }
  return puzzle;
}

function draw(targetBoard, grid, isFinal, finalGrid = null) {
  targetBoard.replaceChildren();
  for (let row = 0; row < 7; row += 1) for (let col = 0; col < 7; col += 1) {
    const current = regionMap[row][col];
    const right = col === 6 || regionMap[row][col + 1] !== current;
    const bottom = row === 6 || regionMap[row + 1][col] !== current;
    const cell = document.createElement('div');
    const value = grid[row][col];
    const completedColor = !isFinal && value ? (finalGrid[row][col] ? 'completed-clue' : 'completed-dug') : '';
    cell.className = `cell ${!value ? 'empty' : ''} ${completedColor} ${right ? 'edge-right' : ''} ${bottom ? 'edge-bottom' : ''}`;
    cell.textContent = value ? String(value) : '·';
    cell.style.animationDelay = `${(row * 7 + col) * 8}ms`;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}: ${value || 'empty'}`);
    targetBoard.append(cell);
  }
}

function refresh() {
  button.disabled = true;
  status.textContent = 'Searching the constraint space…';
  requestAnimationFrame(() => {
    const startedAt = performance.now();
    const completed = generate();
    const method = diggingMethod.value;
    const final = method === 'dual' ? digDual(completed) : digSingle(completed);
    const elapsed = performance.now() - startedAt;
    draw(finalBoard, final, true);
    draw(completedBoard, completed, false, final);
    const clues = final.flat().filter(Boolean).length;
    clueCount.textContent = `${clues} CLUES`;
    timing.textContent = `Generated and ${method === 'dual' ? 'dual-cell' : 'single-cell'} dug in ${elapsed.toFixed(1)} ms`;
    status.textContent = `Ready — ${method === 'dual' ? 'rotationally symmetric ' : ''}final grid has ${clues} clues and one solution.`;
    button.disabled = false;
  });
}

button.addEventListener('click', refresh);
refresh();

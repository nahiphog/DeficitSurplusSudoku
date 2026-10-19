const variant = document.body.dataset.variant ?? 'deficit';

const variants = {
  deficit: {
    name: 'Deficit Sudoku',
    size: 7,
    numbers: [1, 2, 3, 4, 5, 6, 7],
    regions: [[1,1,2,2,3,3,3],[1,1,2,2,3,3,3],[1,1,2,2,4,4,4],[5,5,5,9,4,4,4],[5,5,5,7,7,8,8],[6,6,6,7,7,8,8],[6,6,6,7,7,8,8]],
    generate() { return solveCompleted(this); },
    requiresRegionCoverage: false,
    maxPerUnit: 1,
  },
  surplus: {
    name: 'Surplus Sudoku',
    size: 8,
    numbers: [1, 2, 3, 4, 5, 6, 7],
    regions: Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => Math.floor(row / 2) * 2 + Math.floor(col / 4) + 1)),
    generate() {
      const shifts = [0, 4, 1, 5, 2, 6, 3, 7];
      const rowBands = shuffled([[0, 1], [2, 3], [4, 5], [6, 7]]).flatMap(shuffled);
      const colStacks = shuffled([[0, 1, 2, 3], [4, 5, 6, 7]]).flatMap(shuffled);
      const digits = shuffled(this.numbers);
      return rowBands.map(row => colStacks.map(col => digits[(col + shifts[row]) % 7]));
    },
    requiresRegionCoverage: true,
    maxPerUnit: 2,
  },
};

const config = variants[variant] ?? variants.deficit;
const finalBoard = document.querySelector('#final-board');
const completedBoard = document.querySelector('#completed-board');
const button = document.querySelector('#generate');
const status = document.querySelector('#status');
const clueCount = document.querySelector('#clue-count');
const timing = document.querySelector('#timing');
const diggingMethod = document.querySelector('#digging-method');

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeUnitState(grid, validatePuzzle) {
  const { size, regions } = config;
  const regionCount = Math.max(...regions.flat());
  const counts = Array.from({ length: size * 2 + regionCount }, () => new Map());
  let filled = 0;
  for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) {
    const value = grid[row][col];
    if (!value) continue;
    const ids = [row, size + col, size * 2 + regions[row][col] - 1];
    for (const id of ids) counts[id].set(value, (counts[id].get(value) ?? 0) + 1);
    filled += 1;
  }
  const idsFor = (row, col) => [row, size + col, size * 2 + regions[row][col] - 1];
  if (validatePuzzle) {
    for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) {
      const value = grid[row][col];
      if (value && idsFor(row, col).some(id => (counts[id].get(value) ?? 0) > config.maxPerUnit)) return null;
    }
  }
  const unitLength = id => id >= size * 2 ? (size === 8 ? 8 : counts.length === 23 && id === 22 ? 1 : 6) : size;
  return {
    filled,
    allowed: (row, col, value) => idsFor(row, col).every(id => (counts[id].get(value) ?? 0) < config.maxPerUnit),
    set: (row, col, value, direction) => {
      grid[row][col] = direction > 0 ? value : 0;
      for (const id of idsFor(row, col)) {
        const next = (counts[id].get(value) ?? 0) + direction;
        if (next) counts[id].set(value, next); else counts[id].delete(value);
      }
    },
    coversAll: () => !config.requiresRegionCoverage || counts.every(unit => config.numbers.every(value => unit.has(value))),
    canStillCover: () => !config.requiresRegionCoverage || counts.every((unit, id) => {
      const missing = config.numbers.filter(value => !unit.has(value)).length;
      const blank = unitLength(id) - [...unit.values()].reduce((sum, count) => sum + count, 0);
      return missing <= blank;
    }),
  };
}

function solveCompleted(deficitConfig) {
  const grid = Array.from({ length: deficitConfig.size }, () => Array(deficitConfig.size).fill(0));
  const state = makeUnitState(grid, false);
  function search(filled) {
    if (filled === deficitConfig.size * deficitConfig.size) return true;
    let target; let options = [];
    for (let row = 0; row < deficitConfig.size; row += 1) for (let col = 0; col < deficitConfig.size; col += 1) {
      if (grid[row][col]) continue;
      const choices = shuffled(deficitConfig.numbers.filter(value => state.allowed(row, col, value)));
      if (!target || choices.length < options.length) { target = [row, col]; options = choices; }
      if (options.length <= 1) break;
    }
    if (!target || !options.length) return false;
    const [row, col] = target;
    for (const value of options) {
      state.set(row, col, value, 1);
      if (search(filled + 1)) return true;
      state.set(row, col, value, -1);
    }
    return false;
  }
  if (!search(0)) throw new Error('No completed grid found.');
  return grid;
}

function countSolutions(puzzle, limit = 2) {
  const grid = puzzle.map(row => [...row]);
  const state = makeUnitState(grid, true);
  if (!state || !state.canStillCover()) return 0;
  let solutions = 0;
  function search(filled) {
    if (solutions >= limit) return;
    if (filled === config.size ** 2) { if (state.coversAll()) solutions += 1; return; }
    let target; let options = [];
    for (let row = 0; row < config.size; row += 1) for (let col = 0; col < config.size; col += 1) {
      if (grid[row][col]) continue;
      const choices = config.numbers.filter(value => state.allowed(row, col, value));
      if (!target || choices.length < options.length) { target = [row, col]; options = choices; }
      if (options.length <= 1) break;
    }
    if (!target || !options.length) return;
    const [row, col] = target;
    for (const value of options) {
      state.set(row, col, value, 1);
      if (state.canStillCover()) search(filled + 1);
      state.set(row, col, value, -1);
      if (solutions >= limit) return;
    }
  }
  search(state.filled);
  return solutions;
}

function digSingle(completed) {
  const puzzle = completed.map(row => [...row]);
  const cells = shuffled(Array.from({ length: config.size ** 2 }, (_, i) => i));
  // Surplus Sudoku's permissive units create a much wider solution space than
  // a Latin square. A focused pass keeps interaction responsive while each
  // removed clue is still verified with the same unique-solution solver.
  for (const index of config.size === 8 ? cells.slice(0, 12) : cells) {
    const row = Math.floor(index / config.size); const col = index % config.size;
    const saved = puzzle[row][col]; puzzle[row][col] = 0;
    if (countSolutions(puzzle) !== 1) puzzle[row][col] = saved;
  }
  return puzzle;
}

function digDual(completed) {
  const puzzle = completed.map(row => [...row]); const visited = new Set();
  const cells = shuffled(Array.from({ length: config.size ** 2 }, (_, i) => i));
  for (const index of config.size === 8 ? cells.slice(0, 12) : cells) {
    const row = Math.floor(index / config.size); const col = index % config.size;
    const pairedRow = config.size - 1 - row; const pairedCol = config.size - 1 - col;
    const key = [`${row}:${col}`, `${pairedRow}:${pairedCol}`].sort().join('|');
    if (visited.has(key)) continue;
    visited.add(key);
    const first = puzzle[row][col]; const second = puzzle[pairedRow][pairedCol];
    puzzle[row][col] = 0; puzzle[pairedRow][pairedCol] = 0;
    if (countSolutions(puzzle) !== 1) { puzzle[row][col] = first; puzzle[pairedRow][pairedCol] = second; }
  }
  return puzzle;
}

function draw(targetBoard, grid, isFinal, finalGrid = null) {
  targetBoard.replaceChildren(); targetBoard.style.setProperty('--board-size', String(config.size));
  for (let row = 0; row < config.size; row += 1) for (let col = 0; col < config.size; col += 1) {
    const current = config.regions[row][col];
    const right = col === config.size - 1 || config.regions[row][col + 1] !== current;
    const bottom = row === config.size - 1 || config.regions[row + 1][col] !== current;
    const cell = document.createElement('div'); const value = grid[row][col];
    const completedColor = !isFinal && value ? (finalGrid[row][col] ? 'completed-clue' : 'completed-dug') : '';
    cell.className = `cell ${!value ? 'empty' : ''} ${completedColor} ${right ? 'edge-right' : ''} ${bottom ? 'edge-bottom' : ''}`;
    cell.textContent = value ? String(value) : '·'; cell.style.animationDelay = `${(row * config.size + col) * 8}ms`;
    cell.setAttribute('role', 'gridcell'); cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}: ${value || 'empty'}`);
    targetBoard.append(cell);
  }
}

function refresh() {
  button.disabled = true; status.textContent = 'Searching the constraint space…';
  requestAnimationFrame(() => {
    const startedAt = performance.now(); const completed = config.generate();
    const method = diggingMethod.value; const final = method === 'dual' ? digDual(completed) : digSingle(completed);
    const elapsed = performance.now() - startedAt;
    draw(finalBoard, final, true); draw(completedBoard, completed, false, final);
    const clues = final.flat().filter(Boolean).length;
    clueCount.textContent = `${clues} CLUES`;
    timing.textContent = `Generated and ${method === 'dual' ? 'dual-cell' : 'single-cell'} dug in ${elapsed.toFixed(1)} ms`;
    status.textContent = `Ready — ${method === 'dual' ? 'rotationally symmetric ' : ''}final grid has ${clues} clues and one solution.`;
    button.disabled = false;
  });
}

button.addEventListener('click', refresh);
refresh();

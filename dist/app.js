const requestedVersion = new URLSearchParams(window.location.search).get('version');
const variant = document.body.dataset.variant === 'deficit' && ['2', '3', '4'].includes(requestedVersion) ? `deficit${requestedVersion}` : (document.body.dataset.variant ?? 'deficit');

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
  deficit2: {
    name: 'Deficit Sudoku V2',
    size: 6,
    numbers: [1, 2, 3, 4, 5, 6, 7],
    regions: Array.from({ length: 6 }, (_, row) => Array.from({ length: 6 }, (_, col) => Math.floor(row / 2) * 2 + Math.floor(col / 3) + 1)),
    generate() {
      const shifts = [0, 3, 1, 4, 2, 5];
      const rowBands = shuffled([[0, 1], [2, 3], [4, 5]]).flatMap(shuffled);
      const colStacks = shuffled([[0, 1, 2], [3, 4, 5]]).flatMap(shuffled);
      const digits = shuffled(this.numbers);
      return rowBands.map(row => colStacks.map(col => digits[(col + shifts[row]) % 7]));
    },
    requiresRegionCoverage: false,
    maxPerUnit: 1,
  },
  deficit3: {
    name: 'Deficit Sudoku V3', size: 8, numbers: [1,2,3,4,5,6,7,8,9],
    regions: Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => Math.floor(row / 2) * 2 + Math.floor(col / 4) + 1)),
    generate() {
      const shifts = [0,4,1,5,2,6,3,7];
      const rows = shuffled([[0,1],[2,3],[4,5],[6,7]]).flatMap(shuffled);
      const cols = shuffled([[0,1,2,3],[4,5,6,7]]).flatMap(shuffled);
      const digits = shuffled(this.numbers);
      return rows.map(row => cols.map(col => digits[(col + shifts[row]) % 9]));
    },
    requiresRegionCoverage: false, maxPerUnit: 1,
  },
  deficit4: {
    name: 'Deficit Sudoku V4', size: 9, numbers: [0,1,2,3,4,5,6,7,8,9],
    regions: Array.from({length:9}, (_, row) => Array.from({length:9}, (_, col) => Math.floor(row / 3) * 3 + Math.floor(col / 3) + 1)),
    generate() {
      const shifts = [0,3,6,1,4,7,2,5,8];
      const rows = shuffled([[0,1,2],[3,4,5],[6,7,8]]).flatMap(shuffled);
      const cols = shuffled([[0,1,2],[3,4,5],[6,7,8]]).flatMap(shuffled);
      const digits = shuffled(this.numbers);
      return rows.map(row => cols.map(col => digits[(col + shifts[row]) % 10]));
    },
    requiresRegionCoverage: false, maxPerUnit: 1,
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
const versionSelect = document.querySelector('#deficit-version');

if (['deficit2', 'deficit3', 'deficit4'].includes(variant)) {
  const version = variant.slice(-1);
  document.title = `Generate · Deficit Sudoku V${version}`;
  document.querySelector('#version-eyebrow').textContent = `DEFICIT V${version} · 0${config.size} × 0${config.size}`;
  document.querySelector('#title').innerHTML = `Deficit<br /><em>Sudoku V${version}</em>`;
  document.querySelector('#variant-intro').textContent = version === '2' ? 'A 6×6 grid with six outlined 2×3 regions. Choose digits 1–7 so every row, column, and region has no repeated digit.' : version === '3' ? 'An 8×8 grid with eight outlined 2×4 regions. Choose digits 1–9 so every row, column, and region has no repeated digit.' : 'A 9×9 grid with nine outlined 3×3 regions. Choose digits 0–9 so every row, column, and region has no repeated digit.';
  document.querySelector('#completed-dimensions').textContent = `${config.size} × ${config.size}`;
  finalBoard.setAttribute('aria-label', `Final Deficit Sudoku V${version} puzzle`);
  completedBoard.setAttribute('aria-label', `Completed Deficit Sudoku V${version} solution`);
  if (versionSelect) versionSelect.value = version;
  document.querySelector('#version-1')?.classList.remove('active');
  document.querySelector(`#version-${version}`)?.classList.add('active');
}

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
    if (value === null) continue;
    const ids = [row, size + col, size * 2 + regions[row][col] - 1];
    for (const id of ids) counts[id].set(value, (counts[id].get(value) ?? 0) + 1);
    filled += 1;
  }
  const idsFor = (row, col) => [row, size + col, size * 2 + regions[row][col] - 1];
  if (validatePuzzle) {
    for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) {
      const value = grid[row][col];
      if (value !== null && idsFor(row, col).some(id => (counts[id].get(value) ?? 0) > config.maxPerUnit)) return null;
    }
  }
  const unitLength = id => id >= size * 2 ? (size === 8 ? 8 : counts.length === 23 && id === 22 ? 1 : 6) : size;
  return {
    filled,
    allowed: (row, col, value) => idsFor(row, col).every(id => (counts[id].get(value) ?? 0) < config.maxPerUnit),
    set: (row, col, value, direction) => {
      grid[row][col] = direction > 0 ? value : null;
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
  const grid = Array.from({ length: deficitConfig.size }, () => Array(deficitConfig.size).fill(null));
  const state = makeUnitState(grid, false);
  function search(filled) {
    if (filled === deficitConfig.size * deficitConfig.size) return true;
    let target; let options = [];
    for (let row = 0; row < deficitConfig.size; row += 1) for (let col = 0; col < deficitConfig.size; col += 1) {
      if (grid[row][col] !== null) continue;
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
      if (grid[row][col] !== null) continue;
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
  for (const index of variant === 'surplus' ? cells.slice(0, 12) : cells) {
    const row = Math.floor(index / config.size); const col = index % config.size;
    const saved = puzzle[row][col]; puzzle[row][col] = null;
    if (countSolutions(puzzle) !== 1) puzzle[row][col] = saved;
  }
  return puzzle;
}

function digDual(completed) {
  const puzzle = completed.map(row => [...row]); const visited = new Set();
  const cells = shuffled(Array.from({ length: config.size ** 2 }, (_, i) => i));
  for (const index of variant === 'surplus' ? cells.slice(0, 12) : cells) {
    const row = Math.floor(index / config.size); const col = index % config.size;
    const pairedRow = config.size - 1 - row; const pairedCol = config.size - 1 - col;
    const key = [`${row}:${col}`, `${pairedRow}:${pairedCol}`].sort().join('|');
    if (visited.has(key)) continue;
    visited.add(key);
    const first = puzzle[row][col]; const second = puzzle[pairedRow][pairedCol];
    puzzle[row][col] = null; puzzle[pairedRow][pairedCol] = null;
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
    const completedColor = !isFinal && value !== null ? (finalGrid[row][col] !== null ? 'completed-clue' : 'completed-dug') : '';
    cell.className = `cell ${value === null ? 'empty' : ''} ${completedColor} ${right ? 'edge-right' : ''} ${bottom ? 'edge-bottom' : ''}`;
    cell.textContent = value === null ? '·' : String(value); cell.style.animationDelay = `${(row * config.size + col) * 8}ms`;
    cell.setAttribute('role', 'gridcell'); cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}: ${value === null ? 'empty' : value}`);
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
    const clues = final.flat().filter(value => value !== null).length;
    clueCount.textContent = `${clues} CLUES`;
    timing.textContent = `Generated and ${method === 'dual' ? 'dual-cell' : 'single-cell'} dug in ${elapsed.toFixed(1)} ms`;
    status.textContent = `Ready — ${method === 'dual' ? 'rotationally symmetric ' : ''}final grid has ${clues} clues and one solution.`;
    button.disabled = false;
  });
}

button.addEventListener('click', refresh);
versionSelect?.addEventListener('change', () => {
  const url = new URL(window.location.href);
  if (versionSelect.value === '2') url.searchParams.set('version', '2'); else url.searchParams.delete('version');
  window.location.assign(url);
});
refresh();

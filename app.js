const regionMap = [
  [1, 1, 2, 2, 3, 3, 3],
  [1, 1, 2, 2, 3, 3, 3],
  [1, 1, 2, 2, 4, 4, 4],
  [5, 5, 5, 9, 4, 4, 4],
  [5, 5, 5, 7, 7, 8, 8],
  [6, 6, 6, 7, 7, 8, 8],
  [6, 6, 6, 7, 7, 8, 8],
];

const board = document.querySelector('#board');
const button = document.querySelector('#generate');
const status = document.querySelector('#status');
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

function draw(grid) {
  board.replaceChildren();
  for (let row = 0; row < 7; row += 1) for (let col = 0; col < 7; col += 1) {
    const current = regionMap[row][col];
    const right = col === 6 || regionMap[row][col + 1] !== current;
    const bottom = row === 6 || regionMap[row + 1][col] !== current;
    const cell = document.createElement('div');
    cell.className = `cell ${current % 2 === 0 ? 'region-even' : ''} ${right ? 'edge-right' : ''} ${bottom ? 'edge-bottom' : ''}`;
    cell.textContent = String(grid[row][col]);
    cell.style.animationDelay = `${(row * 7 + col) * 8}ms`;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}: ${grid[row][col]}`);
    board.append(cell);
  }
}

function refresh() {
  button.disabled = true;
  status.textContent = 'Searching the constraint space…';
  requestAnimationFrame(() => {
    draw(generate());
    status.textContent = 'Complete — every constraint is satisfied.';
    button.disabled = false;
  });
}

button.addEventListener('click', refresh);
refresh();

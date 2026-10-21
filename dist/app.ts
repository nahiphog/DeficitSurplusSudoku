const requestedVersion = new URLSearchParams(window.location.search).get('version');
const baseVariant = document.body.dataset.variant ?? 'deficit';
const variant = baseVariant === 'deficit' && ['2', '3', '4', '5'].includes(requestedVersion) ? `deficit${requestedVersion}` : baseVariant === 'surplus' && ['2', '3', '4'].includes(requestedVersion) ? `surplus${requestedVersion}` : baseVariant;

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
  deficit5: {
    name: 'Deficit Sudoku V5', size: 4, numbers: [1,2,3,4,5],
    regions: Array.from({length:4}, (_, row) => Array.from({length:4}, (_, col) => Math.floor(row / 2) * 2 + Math.floor(col / 2) + 1)),
    generate() {
      const shifts = [0,2,1,3];
      const rows = shuffled([[0,1],[2,3]]).flatMap(shuffled);
      const cols = shuffled([[0,1],[2,3]]).flatMap(shuffled);
      const digits = shuffled(this.numbers);
      return rows.map(row => cols.map(col => digits[(col + shifts[row]) % 5]));
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
  surplus4: {
    name: 'Surplus Sudoku V4', size: 4, numbers: [1,2,3],
    regions: Array.from({length:4}, (_, row) => Array.from({length:4}, (_, col) => Math.floor(row / 2) * 2 + Math.floor(col / 2) + 1)),
    generate() {
      const shifts = [0,2,1,3];
      const rows = shuffled([[0,1],[2,3]]).flatMap(shuffled);
      const cols = shuffled([[0,1],[2,3]]).flatMap(shuffled);
      const digits = shuffled(this.numbers);
      return rows.map(row => cols.map(col => digits[(col + shifts[row]) % 3]));
    },
    requiresRegionCoverage: true, maxPerUnit: 2,
  },
  surplus3: {
    name: 'Surplus Sudoku V3', size: 6, numbers: [1,2,3,4,5],
    regions: Array.from({length:6}, (_, row) => Array.from({length:6}, (_, col) => Math.floor(row / 2) * 2 + Math.floor(col / 3) + 1)),
    generate() {
      const shifts = [0,3,1,4,2,5];
      const rows = shuffled([[0,1],[2,3],[4,5]]).flatMap(shuffled);
      const cols = shuffled([[0,1,2],[3,4,5]]).flatMap(shuffled);
      const digits = shuffled(this.numbers);
      return rows.map(row => cols.map(col => digits[(col + shifts[row]) % 5]));
    },
    requiresRegionCoverage: true, maxPerUnit: 2,
  },
  surplus2: {
    name: 'Surplus Sudoku V2', size: 9, numbers: [1,2,3,4,5,6,7,8],
    regions: Array.from({length:9}, (_, row) => Array.from({length:9}, (_, col) => Math.floor(row / 3) * 3 + Math.floor(col / 3) + 1)),
    generate() {
      const shifts = [0,3,6,1,4,7,2,5,8];
      const rows = shuffled([[0,1,2],[3,4,5],[6,7,8]]).flatMap(shuffled);
      const cols = shuffled([[0,1,2],[3,4,5],[6,7,8]]).flatMap(shuffled);
      const digits = shuffled(this.numbers);
      return rows.map(row => cols.map(col => digits[(col + shifts[row]) % 8]));
    },
    requiresRegionCoverage: true, maxPerUnit: 2,
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

if (['deficit2', 'deficit3', 'deficit4', 'deficit5'].includes(variant)) {
  const version = variant.slice(-1);
  document.title = `Generate · Deficit Sudoku V${version}`;
  document.querySelector('#version-eyebrow').textContent = `DEFICIT V${version} · 0${config.size} × 0${config.size}`;
  document.querySelector('#title').innerHTML = `Deficit<br /><em>Sudoku V${version}</em>`;
  document.querySelector('#variant-intro').textContent = version === '2' ? 'A 6×6 grid with six outlined 2×3 regions. Choose digits 1–7 so every row, column, and region has no repeated digit.' : version === '3' ? 'An 8×8 grid with eight outlined 2×4 regions. Choose digits 1–9 so every row, column, and region has no repeated digit.' : version === '4' ? 'A 9×9 grid with nine outlined 3×3 regions. Choose digits 0–9 so every row, column, and region has no repeated digit.' : 'A 4×4 grid with four outlined 2×2 regions. Choose digits 1–5 so every row, column, and region has no repeated digit.';
  document.querySelector('#completed-dimensions').textContent = `${config.size} × ${config.size}`;
  finalBoard.setAttribute('aria-label', `Final Deficit Sudoku V${version} puzzle`);
  completedBoard.setAttribute('aria-label', `Completed Deficit Sudoku V${version} solution`);
  if (versionSelect) versionSelect.value = version;
  document.querySelector('#version-1')?.classList.remove('active');
  document.querySelector(`#version-${version}`)?.classList.add('active');
}

if (['surplus2', 'surplus3', 'surplus4'].includes(variant)) {
  const version = variant.slice(-1);
  document.title = `Generate · Surplus Sudoku V${version}`;
  document.querySelector('#version-eyebrow').textContent = `SURPLUS V${version} · 0${config.size} × 0${config.size}`;
  document.querySelector('#title').innerHTML = `Surplus<br /><em>Sudoku V${version}</em>`;
  document.querySelector('#variant-intro').textContent = version === '2' ? 'A 9×9 grid with nine 3×3 regions. Each row, column, and region contains every digit from 1–8 at least once.' : version === '3' ? 'A 6×6 grid with six 2×3 regions. Each row, column, and region contains every digit from 1–5 at least once.' : 'A 4×4 grid with four 2×2 regions. Each row, column, and region contains every digit from 1–3 at least once.';
  document.querySelector('#completed-dimensions').textContent = `${config.size} × ${config.size}`;
  finalBoard.setAttribute('aria-label', `Final Surplus Sudoku V${version} puzzle`);
  completedBoard.setAttribute('aria-label', `Completed Surplus Sudoku V${version} solution`);
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
  const unitLength = id => id >= size * 2 ? regions.flat().filter(region => region === id - size * 2 + 1).length : size;
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
  for (const index of baseVariant === 'surplus' ? cells.slice(0, 12) : cells) {
    const row = Math.floor(index / config.size); const col = index % config.size;
    const saved = puzzle[row][col]; puzzle[row][col] = null;
    if (countSolutions(puzzle) !== 1) puzzle[row][col] = saved;
  }
  return puzzle;
}

function digDual(completed) {
  const puzzle = completed.map(row => [...row]); const visited = new Set();
  const cells = shuffled(Array.from({ length: config.size ** 2 }, (_, i) => i));
  for (const index of baseVariant === 'surplus' ? cells.slice(0, 12) : cells) {
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

function walkthroughSteps(puzzle, solution) {
  const result = singleWalkthrough(puzzle, [config.size, config.numbers, config.regions, config.requiresRegionCoverage]);
  const board = puzzle.map(row => [...row]);
  const steps = [];
  for (const step of result.steps) {
    if(step.eliminations){
      if(step.eliminations.some(({row,col,value})=>board[row][col]!==null||solution[row][col]===value))throw new Error('Invalid logical elimination.');
      steps.push(step);continue;
    }
    if (board[step.row][step.col] !== null || solution[step.row][step.col] !== step.value) throw new Error('Invalid logical walkthrough step.');
    board[step.row][step.col] = step.value;
    steps.push(step);
  }
  // The completed grid is already known to be the unique solution. When the
  // current logical subset is exhausted, disclose that we use that solution.
  for (let row=0;row<config.size;row++) for(let col=0;col<config.size;col++) if(board[row][col]===null){
    const value=solution[row][col];
    steps.push({technique:'Solver fallback',row,col,value,reason:'the supported logical techniques stopped; this value comes from the uniquely verified solution'});
    board[row][col]=value;
  }
  return steps;
}

function tallyWalkthrough(steps) {
  const tally = new Map();
  steps.forEach((step,index) => {
    if (!tally.has(step.technique)) tally.set(step.technique, []);
    tally.get(step.technique).push(index + 1);
  });
  return tally;
}

function mountWalkthrough(puzzle, solution) {
  const host=document.querySelector('#walkthrough-host');
  if(!host)return;
  host.replaceChildren();
  let steps;
  try { steps=walkthroughSteps(puzzle,solution); } catch { host.textContent='A validated walkthrough is unavailable for this puzzle.';return; }
  let current=0;
  const title=document.createElement('h2');title.textContent='Solution walkthrough';
  const note=document.createElement('p');note.className='walkthrough-note';
  const fallback=steps.filter(step=>step.technique==='Solver fallback').length;
  note.textContent=fallback?`${fallback} step${fallback===1?' uses':'s use'} the uniquely verified solution after the supported logical techniques stop.`:'All steps use the supported logical techniques.';
  const tallyTable=document.createElement('table');tallyTable.className='walkthrough-tally';
  const caption=document.createElement('caption');caption.textContent='Technique tally';tallyTable.append(caption);
  const head=document.createElement('thead'),headRow=document.createElement('tr');
  for(const label of ['Technique','Count','Steps']){const th=document.createElement('th');th.scope='col';th.textContent=label;headRow.append(th);}head.append(headRow);tallyTable.append(head);
  const body=document.createElement('tbody');
  for(const [technique,indices] of tallyWalkthrough(steps)){
    const row=document.createElement('tr');
    for(const value of [technique,String(indices.length),indices.join(', ')]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}
    body.append(row);
  }
  if(!steps.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=3;cell.textContent='No placements needed.';row.append(cell);body.append(row);}
  tallyTable.append(body);
  const board=document.createElement('div');board.className='board walkthrough-board';board.setAttribute('role','grid');board.setAttribute('aria-label','Solution walkthrough grid');
  const description=document.createElement('p');description.className='walkthrough-description';description.setAttribute('aria-live','polite');
  const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max=String(steps.length);slider.value='0';slider.setAttribute('aria-label','Walkthrough step');slider.className='walkthrough-slider';slider.disabled=steps.length===0;
  const controls=document.createElement('div');controls.className='walkthrough-controls';
  const counter=document.createElement('span');counter.className='step-counter';
  const buttons=[];
  function render(){
    const state=puzzle.map(row=>[...row]);
    const excluded=Array.from({length:config.size},()=>Array.from({length:config.size},()=>new Set()));
    for(let i=0;i<current;i++){const step=steps[i];if(step.eliminations){for(const {row,col,value} of step.eliminations)excluded[row][col].add(value);}else state[step.row][step.col]=step.value;}
    board.replaceChildren();board.style.setProperty('--board-size',String(config.size));
    for(let row=0;row<config.size;row++)for(let col=0;col<config.size;col++){
      const cell=document.createElement('div'),value=state[row][col],region=config.regions[row][col];
      const right=col===config.size-1||config.regions[row][col+1]!==region,bottom=row===config.size-1||config.regions[row+1][col]!==region;
      const last=current>0?steps[current-1]:null;
      cell.className=`cell ${right?'edge-right':''} ${bottom?'edge-bottom':''} ${value!==null?(puzzle[row][col]!==null?'walk-given':'walk-solved'):'walk-candidates'} ${last&&((last.row===row&&last.col===col)||last.eliminations?.some(item=>item.row===row&&item.col===col))?'walk-current':''}`;
      cell.setAttribute('role','gridcell');
      if(value!==null){cell.textContent=String(value);cell.setAttribute('aria-label',`Row ${row+1}, column ${col+1}: ${value}`);}
      else {
        const unit=makeUnitState(state,false),choices=config.numbers.filter(v=>unit.allowed(row,col,v)&&!excluded[row][col].has(v));
        for(const digit of choices){const mark=document.createElement('span');mark.textContent=String(digit);cell.append(mark);}
        cell.setAttribute('aria-label',`Row ${row+1}, column ${col+1}: empty; candidates ${choices.join(', ')||'none'}`);
      }
      board.append(cell);
    }
    const step=current?steps[current-1]:null;
    description.textContent=step?`${step.technique}: ${step.eliminations?step.eliminations.map(({row,col,value})=>`remove ${value} from R${row+1}C${col+1}`).join(', '):`R${step.row+1}C${step.col+1} = ${step.value}`} — ${step.reason}.`:'Step 0: the starting puzzle and its currently allowed candidates.';
    slider.value=String(current);counter.textContent=`Step ${current} of ${steps.length}`;
    buttons[0].disabled=buttons[1].disabled=current===0;buttons[2].disabled=buttons[3].disabled=current===steps.length;
  }
  [['First',()=>0],['Previous',()=>Math.max(0,current-1)],['Next',()=>Math.min(steps.length,current+1)],['Last',()=>steps.length]].forEach(([label,target])=>{const control=document.createElement('button');control.type='button';control.className='secondary-button';control.textContent=label;control.addEventListener('click',()=>{current=target();render();});buttons.push(control);controls.append(control);});
  slider.addEventListener('input',()=>{current=Number(slider.value);render();});
  host.append(title,note,tallyTable,board,description,slider,controls,counter);render();
}

let currentFinal = null, currentCompleted = null;
function gridString(grid) { return grid.flat().map(value => value === null ? '.' : String(value)).join(''); }
async function copyGrid(grid, label) {
  if (!grid) return;
  try { await navigator.clipboard.writeText(gridString(grid)); status.textContent = `${label} copied to clipboard.`; }
  catch { status.textContent = 'Clipboard access failed. Please allow clipboard access and try again.'; }
}
document.querySelector('#copy-final')?.addEventListener('click', () => copyGrid(currentFinal, 'Final grid'));
document.querySelector('#copy-completed')?.addEventListener('click', () => copyGrid(currentCompleted, 'Completed grid'));

function refresh() {
  button.disabled = true; status.textContent = 'Searching the constraint space…';
  document.querySelector('#walkthrough-host')?.replaceChildren();
  requestAnimationFrame(() => {
    const startedAt = performance.now(); const completed = config.generate();
    const method = diggingMethod.value; const final = method === 'dual' ? digDual(completed) : digSingle(completed);
    currentFinal = final; currentCompleted = completed;
    const elapsed = performance.now() - startedAt;
    draw(finalBoard, final, true); draw(completedBoard, completed, false, final);
    const clues = final.flat().filter(value => value !== null).length;
    clueCount.textContent = `${clues} CLUES`;
    timing.textContent = `Generated and ${method === 'dual' ? 'dual-cell' : 'single-cell'} dug in ${elapsed.toFixed(1)} ms`;
    status.textContent = `Ready — ${method === 'dual' ? 'rotationally symmetric ' : ''}final grid has ${clues} clues and one solution.`;
    mountWalkthrough(final, completed);
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

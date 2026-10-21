const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

function context(source, version, simulation = false, variant = 'deficit') {
  const element = () => ({ value: 'single', textContent: '', innerHTML: '', disabled: false, classList: { add() {}, remove() {} }, setAttribute() {}, addEventListener() {}, replaceChildren() {}, append() {}, style: { setProperty() {} } });
  const nodes = new Map();
  const document = { body: { dataset: { variant } }, querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, element()); return nodes.get(selector); }, createElement: element };
  const sandbox = { document, window: { location: { search: version === 1 ? '' : `?version=${version}` } }, URLSearchParams, performance, Math, setTimeout() {}, requestAnimationFrame() {} };
  const cutoff = simulation ? "runButton.addEventListener('click'" : "button.addEventListener('click'";
  const code = fs.readFileSync(source, 'utf8').split(cutoff)[0];
  vm.createContext(sandbox);
  if (!simulation) vm.runInContext(fs.readFileSync('src/techniques.ts', 'utf8'), sandbox);
  vm.runInContext(code + (simulation ? `\nsettings = configurations.${version === 1 ? variant : `${variant}${version}`};` : ''), sandbox);
  return sandbox;
}
for (const simulation of [false, true]) {
  const ctx = context(simulation ? 'src/simulation.ts' : 'src/app.ts', 4, simulation, 'surplus');
  for (let attempt = 0; attempt < 20; attempt++) {
    const grid = vm.runInContext(simulation ? 'completedGrid()' : 'config.generate()', ctx);
    assert.equal(grid.length, 4);
    const units = [...grid, ...Array.from({length:4}, (_,c)=>grid.map(row=>row[c]))];
    for(let r=0;r<4;r+=2) for(let c=0;c<4;c+=2) units.push(grid.slice(r,r+2).flatMap(row=>row.slice(c,c+2)));
    for(const unit of units) { assert.equal(unit.length, 4); assert.deepEqual([...new Set(unit)].sort(), [1,2,3]); }
    ctx.board = grid;
    assert.equal(vm.runInContext('countSolutions(board)', ctx), 1);
    for(const method of ['digSingle','digDual']) {
      ctx.puzzle = vm.runInContext(`${method}(board.map(row => [...row]))`, ctx);
      assert.equal(vm.runInContext('countSolutions(puzzle)', ctx), 1);
    }
  }
  console.log(`Surplus V4 ${simulation ? 'simulation' : 'generation'}: valid and unique`);
}
for (const simulation of [false, true]) {
  const ctx = context(simulation ? 'src/simulation.ts' : 'src/app.ts', 2, simulation, 'surplus');
  const grid = vm.runInContext(simulation ? 'completedGrid()' : 'config.generate()', ctx);
  const units = [...grid, ...Array.from({length:9}, (_,c)=>grid.map(row=>row[c]))];
  for(let r=0;r<9;r+=3) for(let c=0;c<9;c+=3) units.push(grid.slice(r,r+3).flatMap(row=>row.slice(c,c+3)));
  for(const unit of units) assert.deepEqual([...new Set(unit)].sort(), [1,2,3,4,5,6,7,8]);
  ctx.board = grid;
  assert.equal(vm.runInContext('countSolutions(board)', ctx), 1);
  for(const method of ['digSingle','digDual']) {
    ctx.puzzle = vm.runInContext(`${method}(board.map(row => [...row]))`, ctx);
    assert.equal(vm.runInContext('countSolutions(puzzle)', ctx), 1);
  }
  if (!simulation) assert.equal(vm.runInContext('gridString([[0,null,2],[3,4,5]])',ctx), '0.2345');
  console.log(`Surplus V2 ${simulation ? 'simulation' : 'generation'}: valid and unique`);
}
for (const simulation of [false, true]) {
  const ctx = context(simulation ? 'src/simulation.ts' : 'src/app.ts', 3, simulation, 'surplus');
  for (let attempt = 0; attempt < 5; attempt++) {
    const grid = vm.runInContext(simulation ? 'completedGrid()' : 'config.generate()', ctx);
    const units = [...grid, ...Array.from({length:6}, (_,c)=>grid.map(row=>row[c]))];
    for(let r=0;r<6;r+=2) for(let c=0;c<6;c+=3) units.push(grid.slice(r,r+2).flatMap(row=>row.slice(c,c+3)));
    for(const unit of units) assert.deepEqual([...new Set(unit)].sort(), [1,2,3,4,5]);
    ctx.board = grid;
    assert.equal(vm.runInContext('countSolutions(board)', ctx), 1);
    for(const method of ['digSingle','digDual']) {
      ctx.puzzle = vm.runInContext(`${method}(board.map(row => [...row]))`, ctx);
      assert.equal(vm.runInContext('countSolutions(puzzle)', ctx), 1);
    }
  }
  console.log(`Surplus V3 ${simulation ? 'simulation' : 'generation'}: valid and unique`);
}
for (const [variant, versions] of [['deficit',[1,2,3,4,5]],['surplus',[1,2,3,4]]]) {
  for (const version of versions) {
    const ctx=context('src/app.ts',version,false,variant);
    vm.runInContext('var solution=config.generate(); var puzzle=digSingle(solution); var steps=walkthroughSteps(puzzle,solution); var replay=puzzle.map(row=>[...row]); for(const s of steps){if(replay[s.row][s.col]!==null || solution[s.row][s.col]!==s.value) throw Error("Invalid step"); replay[s.row][s.col]=s.value;}',ctx);
    assert.equal(vm.runInContext('JSON.stringify(replay)===JSON.stringify(solution)',ctx),true,`${variant} V${version} walkthrough`);
    console.log(`${variant} V${version}: walkthrough reaches verified solution`);
  }
}
function validate(grid, size, regionWidth, digits, minimum = 1) {
  assert.equal(grid.length, size);
  const distinct = values => { assert.equal(values.length, size); assert.equal(new Set(values).size, size); assert.ok(values.every(v => v >= minimum && v <= digits)); };
  grid.forEach(distinct);
  for (let c = 0; c < size; c++) distinct(grid.map(row => row[c]));
  const regionHeight = size / regionWidth;
  if (regionWidth) for (let r = 0; r < size; r += regionHeight) for (let c = 0; c < size; c += regionWidth) distinct(grid.slice(r, r + regionHeight).flatMap(row => row.slice(c, c + regionWidth)));
}
for (const version of [1, 2, 3, 4, 5]) {
  const size = [0, 7, 6, 8, 9, 4][version], width = [0, 0, 3, 4, 3, 2][version], digits = version === 5 ? 5 : version >= 3 ? 9 : 7;
  for (const simulation of [false, true]) {
    const ctx = context(simulation ? 'src/simulation.ts' : 'src/app.ts', version, simulation);
    const board = vm.runInContext(simulation ? 'completedGrid()' : 'config.generate()', ctx);
    validate(board, size, width, digits, version === 4 ? 0 : 1);
    ctx.board = board;
    if (version === 4) {
      assert.ok(board.flat().includes(0));
      assert.equal(vm.runInContext('countSolutions(board)', ctx), 1);
      const invalid = board.map(row => [...row]);
      const zeroRow = invalid.find(row => row.includes(0));
      zeroRow[zeroRow.findIndex(value => value !== 0)] = 0;
      ctx.invalid = invalid;
      assert.equal(vm.runInContext('countSolutions(invalid)', ctx), 0);
    }
    for (const method of ['digSingle', 'digDual']) {
      const puzzle = vm.runInContext(`${method}(board.map(row => [...row]))`, ctx);
      ctx.puzzle = puzzle;
      assert.equal(vm.runInContext('countSolutions(puzzle)', ctx), 1);
    }
    console.log(`Version ${version} ${simulation ? 'simulation' : 'generation'}: valid and unique`);
  }
}

const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

function context(source, version, simulation = false) {
  const element = () => ({ value: 'single', textContent: '', innerHTML: '', disabled: false, classList: { add() {}, remove() {} }, setAttribute() {}, addEventListener() {}, replaceChildren() {}, append() {}, style: { setProperty() {} } });
  const nodes = new Map();
  const document = { body: { dataset: { variant: 'deficit' } }, querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, element()); return nodes.get(selector); }, createElement: element };
  const sandbox = { document, window: { location: { search: version === 1 ? '' : `?version=${version}` } }, URLSearchParams, performance, Math, setTimeout() {}, requestAnimationFrame() {} };
  const cutoff = simulation ? "runButton.addEventListener('click'" : "button.addEventListener('click'";
  const code = fs.readFileSync(source, 'utf8').split(cutoff)[0];
  vm.createContext(sandbox);
  vm.runInContext(code + (simulation ? `\nsettings = configurations.${version === 1 ? 'deficit' : `deficit${version}`};` : ''), sandbox);
  return sandbox;
}
function validate(grid, size, regionWidth, digits, minimum = 1) {
  assert.equal(grid.length, size);
  const distinct = values => { assert.equal(values.length, size); assert.equal(new Set(values).size, size); assert.ok(values.every(v => v >= minimum && v <= digits)); };
  grid.forEach(distinct);
  for (let c = 0; c < size; c++) distinct(grid.map(row => row[c]));
  const regionHeight = size / regionWidth;
  if (regionWidth) for (let r = 0; r < size; r += regionHeight) for (let c = 0; c < size; c += regionWidth) distinct(grid.slice(r, r + regionHeight).flatMap(row => row.slice(c, c + regionWidth)));
}
for (const version of [1, 2, 3, 4]) {
  const size = [0, 7, 6, 8, 9][version], width = [0, 0, 3, 4, 3][version], digits = version >= 3 ? 9 : 7;
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

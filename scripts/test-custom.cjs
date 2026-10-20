const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const sandbox = { Math, self: { postMessage(message) { sandbox.messages.push(message); } }, messages: [] };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('src/custom-worker.ts', 'utf8'), sandbox);
for (const variant of ['deficit','deficit2','deficit3','deficit4','deficit5','surplus','surplus2','surplus3','surplus4']) {
  sandbox.variant = variant;
  vm.runInContext('var cfg = configs[variant]; var board = completed(cfg);', sandbox);
  assert.equal(vm.runInContext('solve(board, cfg, 2).length', sandbox), 1, `${variant} completed grid`);
  assert.equal(vm.runInContext('solve(board.map(row=>row.map(v=>v===cfg[1][0]||v===cfg[1][1]?null:v)), cfg, 2).length', sandbox), 2, `${variant} ambiguous grid`);
  vm.runInContext('var invalid = board.map(row=>[...row]); invalid[0].fill(cfg[1][0]);', sandbox);
  assert.equal(vm.runInContext('solve(invalid, cfg, 2).length', sandbox), 0, `${variant} invalid grid`);
  sandbox.messages = [];
  vm.runInContext('self.onmessage({data:{variant,selected:Array.from({length:cfg[0]**2},(_,i)=>i)}})', sandbox);
  assert.equal(sandbox.messages.at(-1).type, 'found');
  console.log(`${variant}: completed, ambiguous, invalid and custom build checks passed`);
}

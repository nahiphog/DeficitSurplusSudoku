const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const sandbox = { Math, self: { postMessage(message) { sandbox.messages.push(message); } }, messages: [] };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('src/techniques.ts', 'utf8'), sandbox);
sandbox.importScripts = () => {};
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
  sandbox.messages = [];
  vm.runInContext('self.onmessage({data:{action:"verify",variant,puzzle:board}})', sandbox);
  assert.equal(sandbox.messages.at(-1).count, 1, `${variant} verify unique`);
  for(let sample=0; sample<8; sample++) {
    vm.runInContext('var partial=board.map(row=>[...row]); for(let i=0;i<6;i++){const n=Math.floor(Math.random()*cfg[0]**2);partial[Math.floor(n/cfg[0])][n%cfg[0]]=null;} var walk=singleWalkthrough(partial,cfg);',sandbox);
    const steps=vm.runInContext('walk.steps',sandbox);
    for(const step of steps) {
      sandbox.step=step;
      assert.equal(step.value,vm.runInContext('board[step.row][step.col]',sandbox),`${variant} step matches solution`);
      const alternatives=vm.runInContext('cfg[1].filter(v=>v!==step.value)',sandbox);
      for(const alternative of alternatives){sandbox.alternative=alternative;assert.equal(vm.runInContext('var check=partial.map(row=>[...row]);check[step.row][step.col]=alternative;solve(check,cfg,1).length',sandbox),0,`${variant} ${step.technique} excludes alternatives`);}
      vm.runInContext('partial[step.row][step.col]=step.value',sandbox);
    }
  }
  sandbox.messages = [];
  vm.runInContext('self.onmessage({data:{action:"verify",variant,puzzle:invalid}})', sandbox);
  assert.equal(sandbox.messages.at(-1).count, 0, `${variant} verify invalid`);
  sandbox.messages = [];
  vm.runInContext('self.onmessage({data:{action:"verify",variant,puzzle:board.map(row=>row.map(v=>v===cfg[1][0]||v===cfg[1][1]?null:v))}})', sandbox);
  assert.equal(sandbox.messages.at(-1).count, 2, `${variant} verify multiple`);
  console.log(`${variant}: completed, ambiguous, invalid and custom build checks passed`);
}
const verifySource = fs.readFileSync('src/verify.ts', 'utf8');
const parser = verifySource.slice(verifySource.indexOf('const dimensions ='), verifySource.indexOf('function stop()'));
vm.runInContext(parser, sandbox);
assert.deepEqual(Array.from(vm.runInContext("parseGrid('0........ '.repeat(9), 'deficit4')[0]", sandbox)), [0,null,null,null,null,null,null,null,null]);
assert.throws(() => vm.runInContext("parseGrid('0'.repeat(16), 'surplus4')", sandbox), /Only digits/);
assert.throws(() => vm.runInContext("parseGrid('...', 'deficit5')", sandbox), /exactly 16/);

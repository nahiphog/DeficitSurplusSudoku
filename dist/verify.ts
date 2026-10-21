const select = document.querySelector('#verify-version');
const input = document.querySelector('#grid-input');
const button = document.querySelector('#verify-grid');
const cancel = document.querySelector('#cancel-verify');
const status = document.querySelector('#verify-status');
const grid = document.querySelector('#verify-board');
const output = document.querySelector('#verify-result');
const walkthrough = document.createElement('section');
walkthrough.className = 'walkthrough';
walkthrough.setAttribute('aria-label', 'Logical solving steps');
output.append(walkthrough);
const dimensions = {
  deficit: [7,'1234567'], deficit2: [6,'1234567'], deficit3: [8,'123456789'], deficit4: [9,'0123456789'], deficit5: [4,'12345'],
  surplus: [8,'1234567'], surplus2: [9,'12345678'], surplus3: [6,'12345'], surplus4: [4,'123'],
};
let worker = null;
function parseGrid(value, version) {
  const [size, digits] = dimensions[version];
  const cleaned = value.replace(/\s/g, '');
  if (cleaned.length !== size * size) throw new Error(`Enter exactly ${size * size} cells for this ${size}×${size} grid (use . for an empty cell).`);
  if ([...cleaned].some(character => character !== '.' && !digits.includes(character))) throw new Error(`Only digits ${digits.split('').join(', ')} and . are allowed for this version.`);
  return Array.from({length:size}, (_,row) => [...cleaned.slice(row*size,(row+1)*size)].map(character => character === '.' ? null : Number(character)));
}
function stop() { if (worker) worker.terminate(); worker=null; button.disabled=false; cancel.disabled=true; select.disabled=false; input.disabled=false; }
function showWalkthrough(result) {
  walkthrough.replaceChildren();
  if(!result)return;
  const heading=document.createElement('h2');heading.textContent='Logical solving steps';
  const summary=document.createElement('p');summary.textContent=result.solved?'Solved using Full House, Naked Single and Hidden Single.':`Stopped after ${result.steps.length} step${result.steps.length===1?'':'s'}: no further single was found. Other techniques are not yet supported.`;
  walkthrough.append(heading,summary);
  if(result.steps.length){const list=document.createElement('ol');for(const step of result.steps){const item=document.createElement('li');item.textContent=`${step.technique}: R${step.row+1}C${step.col+1} = ${step.value} — ${step.reason}.`;list.append(item);}walkthrough.append(list);}
}
function draw(board, version) {
  const [size] = dimensions[version];
  const irregular = [[1,1,2,2,3,3,3],[1,1,2,2,3,3,3],[1,1,2,2,4,4,4],[5,5,5,9,4,4,4],[5,5,5,7,7,8,8],[6,6,6,7,7,8,8],[6,6,6,7,7,8,8]];
  const h=size===9?3:2, w=size===9?3:size===8?4:size===6?3:2;
  const region = (r,c) => size===7 ? irregular[r][c] : Math.floor(r/h)*(size/w)+Math.floor(c/w);
  grid.replaceChildren();grid.style.setProperty('--board-size',String(size));
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const cell=document.createElement('div'), value=board[r][c];
    cell.className=`cell ${c===size-1||region(r,c+1)!==region(r,c)?'edge-right':''} ${r===size-1||region(r+1,c)!==region(r,c)?'edge-bottom':''}`;
    cell.textContent=value===null?'':String(value);cell.setAttribute('role','gridcell');cell.setAttribute('aria-label',`Row ${r+1}, column ${c+1}: ${value===null?'empty':value}`);grid.append(cell);
  }
}
select.addEventListener('change',()=>{output.hidden=true;status.textContent='Paste a grid string and choose Verify.';});
input.addEventListener('input',()=>{output.hidden=true;status.textContent='Paste a grid string and choose Verify.';});
cancel.addEventListener('click',()=>{stop();status.textContent='Verification cancelled.';});
button.addEventListener('click',()=>{
  let puzzle; try { puzzle=parseGrid(input.value,select.value); } catch(error) { output.hidden=true;status.textContent=error.message;return; }
  const version=select.value;draw(puzzle,version);walkthrough.replaceChildren();output.hidden=false;button.disabled=true;cancel.disabled=false;select.disabled=true;input.disabled=true;status.textContent='Checking solutions…';
  worker=new Worker(new URL('./custom-worker.js',import.meta.url));
  worker.onmessage=({data})=>{stop();if(data.type==='verified'){status.textContent=data.count===0?'No solution: this grid cannot be completed under the selected rules.':data.count===1?'Unique solution: this grid has exactly one solution.':'Not unique: this grid has at least two solutions.';showWalkthrough(data.walkthrough);}else status.textContent=`Verification failed: ${data.message}`;};
  worker.onerror=()=>{stop();status.textContent='Verification could not start. Please try again.';};
  worker.postMessage({action:'verify',variant:version,puzzle});
});

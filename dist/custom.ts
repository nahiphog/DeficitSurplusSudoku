const type = document.body.dataset.variant;
const selector = document.querySelector('#custom-version');
const grid = document.querySelector('#custom-grid');
const builtGrid = document.querySelector('#built-grid');
const result = document.querySelector('#built-result');
const status = document.querySelector('#build-status');
const count = document.querySelector('#filled-count');
const coordinates = document.querySelector('#highlighted-cells');
const build = document.querySelector('#build-now');
const halt = document.querySelector('#halt-build');
const clear = document.querySelector('#clear-highlights');
const rectangular = (size,h,w) => Array.from({length:size},(_,r)=>Array.from({length:size},(_,c)=>Math.floor(r/h)*(size/w)+Math.floor(c/w)+1));
const configs = {
  deficit: {size:7,regions:[[1,1,2,2,3,3,3],[1,1,2,2,3,3,3],[1,1,2,2,4,4,4],[5,5,5,9,4,4,4],[5,5,5,7,7,8,8],[6,6,6,7,7,8,8],[6,6,6,7,7,8,8]]},
  deficit2: {size:6,regions:rectangular(6,2,3)}, deficit3: {size:8,regions:rectangular(8,2,4)}, deficit4: {size:9,regions:rectangular(9,3,3)}, deficit5: {size:4,regions:rectangular(4,2,2)},
  surplus: {size:8,regions:rectangular(8,2,4)}, surplus2: {size:9,regions:rectangular(9,3,3)}, surplus3: {size:6,regions:rectangular(6,2,3)},
};
let selected=new Set(), worker=null, latest=null, attempts=0;
function config(){return configs[selector.value];}
function updateCount(){const size=config().size;count.textContent=`${selected.size} cells selected`;coordinates.textContent=`Highlighted cells: ${[...selected].sort((a,b)=>a-b).map(i=>`R${Math.floor(i/size)+1}C${i%size+1}`).join(', ')||'none'}`;}
function render(target, puzzle=null){
  const {size,regions}=config();target.replaceChildren();target.style.setProperty('--board-size',String(size));
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){
    const index=r*size+c,value=puzzle?.[r][c],cell=document.createElement(puzzle?'div':'button');
    cell.className=`cell ${c===size-1||regions[r][c+1]!==regions[r][c]?'edge-right':''} ${r===size-1||regions[r+1][c]!==regions[r][c]?'edge-bottom':''}`;
    if(puzzle){cell.textContent=value===null?'':String(value);cell.setAttribute('role','gridcell');cell.setAttribute('aria-label',`Row ${r+1}, column ${c+1}: ${value===null?'empty':value}`);}
    else {cell.type='button';cell.classList.add('custom-cell');cell.setAttribute('aria-label',`Row ${r+1}, column ${c+1}`);cell.setAttribute('aria-pressed',String(selected.has(index)));if(selected.has(index))cell.classList.add('highlighted');cell.addEventListener('click',()=>{if(worker)return;if(selected.has(index))selected.delete(index);else selected.add(index);cell.classList.toggle('highlighted',selected.has(index));cell.setAttribute('aria-pressed',String(selected.has(index)));updateCount();});}
    target.append(cell);
  }
}
function stop(){if(worker){worker.terminate();worker=null;}build.disabled=false;halt.disabled=true;clear.disabled=false;selector.disabled=false;}
function reset(){stop();selected.clear();latest=null;result.hidden=true;render(grid);updateCount();status.textContent='Choose the clue positions, then build.';}
selector.addEventListener('change',reset);
clear.addEventListener('click',reset);
halt.addEventListener('click',()=>{stop();status.textContent=`Stopped after ${attempts} checked attempts.`;});
build.addEventListener('click',()=>{
  if(!selected.size){status.textContent='Highlight at least one clue position before building.';return;}
  result.hidden=true;latest=null;attempts=0;build.disabled=true;halt.disabled=false;clear.disabled=true;selector.disabled=true;status.textContent='Searching for a unique puzzle. Some clue patterns may never yield one; you can halt the search.';
  worker=new Worker(new URL('./custom-worker.js',import.meta.url));
  worker.onmessage=({data})=>{if(data.type==='progress'){attempts=data.attempts;status.textContent=`Building… ${attempts} attempts checked.`;}else if(data.type==='found'){attempts=data.attempts;latest=data.puzzle;render(builtGrid,latest);result.hidden=false;stop();status.textContent=`Found a unique puzzle in ${attempts} attempt${attempts===1?'':'s'}.`;}else{stop();status.textContent=`Build failed: ${data.message}`;}};
  worker.onerror=()=>{stop();status.textContent='The search could not start. Please try again.';};
  worker.postMessage({variant:selector.value,selected:[...selected]});
});
document.querySelector('#copy-built').addEventListener('click',async()=>{if(!latest)return;try{await navigator.clipboard.writeText(latest.flat().map(v=>v===null?'.':String(v)).join(''));status.textContent='Grid copied to clipboard.';}catch{status.textContent='Clipboard access failed. Please allow clipboard access and try again.';}});
document.querySelector('#image-built').addEventListener('click',()=>{if(!latest)return;const {size,regions}=config(),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),cell=80,pad=8;canvas.width=canvas.height=size*cell+pad*2;ctx.fillStyle='#fffdf8';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 42px Times New Roman';ctx.fillStyle='#0c1b33';for(let r=0;r<size;r++)for(let c=0;c<size;c++){const x=pad+c*cell,y=pad+r*cell;ctx.strokeStyle='#aeb4bc';ctx.lineWidth=1;ctx.strokeRect(x,y,cell,cell);ctx.strokeStyle='#0c1b33';ctx.lineWidth=3;ctx.beginPath();if(c===size-1||regions[r][c+1]!==regions[r][c]){ctx.moveTo(x+cell,y);ctx.lineTo(x+cell,y+cell);}if(r===size-1||regions[r+1][c]!==regions[r][c]){ctx.moveTo(x,y+cell);ctx.lineTo(x+cell,y+cell);}ctx.stroke();if(latest[r][c]!==null)ctx.fillText(String(latest[r][c]),x+cell/2,y+cell/2);}ctx.strokeRect(pad,pad,size*cell,size*cell);const link=document.createElement('a');link.download=`${type}-custom-build.png`;link.href=canvas.toDataURL('image/png');link.click();});
reset();

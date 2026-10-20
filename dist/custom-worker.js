// Custom pattern search runs off the UI thread so even difficult searches can be halted.
const configs = {
  deficit: [7, [1,2,3,4,5,6,7], [[1,1,2,2,3,3,3],[1,1,2,2,3,3,3],[1,1,2,2,4,4,4],[5,5,5,9,4,4,4],[5,5,5,7,7,8,8],[6,6,6,7,7,8,8],[6,6,6,7,7,8,8]], false],
  deficit2: [6, [1,2,3,4,5,6,7], regions(6,2,3), false],
  deficit3: [8, [1,2,3,4,5,6,7,8,9], regions(8,2,4), false],
  deficit4: [9, [0,1,2,3,4,5,6,7,8,9], regions(9,3,3), false],
  surplus: [8, [1,2,3,4,5,6,7], regions(8,2,4), true],
  surplus2: [9, [1,2,3,4,5,6,7,8], regions(9,3,3), true],
  surplus3: [6, [1,2,3,4,5], regions(6,2,3), true],
};
function regions(size, height, width) { return Array.from({length:size}, (_,r) => Array.from({length:size}, (_,c) => Math.floor(r/height)*(size/width)+Math.floor(c/width)+1)); }
function shuffle(items) { const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

function solve(puzzle, cfg, limit, randomize = false) {
  const [size, numbers, region, surplus] = cfg, board=puzzle.map(row=>[...row]);
  const regionCount=Math.max(...region.flat()), units=Array.from({length:2*size+regionCount},()=>new Map());
  const lengths=Array.from({length:2*size+regionCount},(_,i)=>i<2*size?size:region.flat().filter(v=>v===i-2*size+1).length);
  const ids=(r,c)=>[r,size+c,2*size+region[r][c]-1];
  const change=(r,c,v,d)=>{board[r][c]=d>0?v:null;for(const id of ids(r,c)){const n=(units[id].get(v)||0)+d;if(n)units[id].set(v,n);else units[id].delete(v);}};
  for(let r=0;r<size;r++)for(let c=0;c<size;c++){const v=board[r][c];if(v!==null){if(!numbers.includes(v)||ids(r,c).some(id=>(units[id].get(v)||0)>=(surplus?2:1)))return [];change(r,c,v,1);}}
  const possible=()=>!surplus||units.every((u,i)=>numbers.filter(v=>!u.has(v)).length<=lengths[i]-[...u.values()].reduce((a,b)=>a+b,0));
  const results=[];
  function search(){
    if(results.length>=limit||!possible())return;
    let target=null, choices=[];
    for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(board[r][c]===null){const options=numbers.filter(v=>ids(r,c).every(id=>(units[id].get(v)||0)<(surplus?2:1)));if(!target||options.length<choices.length){target=[r,c];choices=options;}if(!choices.length)return;}
    if(!target){results.push(board.map(row=>[...row]));return;}
    const [r,c]=target;for(const v of randomize?shuffle(choices):choices){change(r,c,v,1);search();change(r,c,v,-1);if(results.length>=limit)return;}
  }
  search(); return results;
}
function completed(cfg) {
  const [size,numbers]=cfg;
  if(size===7)return solve(Array.from({length:7},()=>Array(7).fill(null)),cfg,1,true)[0];
  const h=size===9?3:2,w=size/h,shifts=size===9?[0,3,6,1,4,7,2,5,8]:size===8?[0,4,1,5,2,6,3,7]:[0,3,1,4,2,5];
  const rows=shuffle(Array.from({length:size/h},(_,i)=>Array.from({length:h},(_,j)=>i*h+j))).flatMap(shuffle);
  const cols=shuffle(Array.from({length:size/w},(_,i)=>Array.from({length:w},(_,j)=>i*w+j))).flatMap(shuffle), digits=shuffle(numbers);
  return rows.map(r=>cols.map(c=>digits[(c+shifts[r])%digits.length]));
}
self.onmessage = event => {
  const {variant, selected}=event.data, cfg=configs[variant], chosen=new Set(selected); let attempts=0;
  try { for(;;) { attempts++; const solution=completed(cfg); const puzzle=solution.map((row,r)=>row.map((v,c)=>chosen.has(r*cfg[0]+c)?v:null));
    if(solve(puzzle,cfg,2).length===1){self.postMessage({type:'found',puzzle,solution,attempts});return;}
    if(attempts%10===0)self.postMessage({type:'progress',attempts});
  }} catch(error) { self.postMessage({type:'error',message:String(error)}); }
};

// Adapted from AImenes/sudokUI src/engine/techniques/singles.ts, commit
// 6ced3d8f289c9518dad9d3677c69a4c108ab8d47, GPL-3.0. See
// third-party/sudokui/NOTICE.md and LICENSE. The fixed 9x9 house/candidate
// assumptions are replaced with the rules of the selected variant.
function singleWalkthrough(puzzle, cfg) {
  const [size, digits, regions, surplus] = cfg;
  const board = puzzle.map(row => [...row]);
  const units = [];
  for (let r = 0; r < size; r++) units.push({name:`row ${r+1}`,cells:Array.from({length:size},(_,c)=>[r,c])});
  for (let c = 0; c < size; c++) units.push({name:`column ${c+1}`,cells:Array.from({length:size},(_,r)=>[r,c])});
  for (const id of [...new Set(regions.flat())]) {
    const cells=[]; for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(regions[r][c]===id)cells.push([r,c]);
    units.push({name:`region ${id}`,cells});
  }
  const candidates=(r,c)=>digits.filter(value=>units.filter(unit=>unit.cells.some(([ur,uc])=>ur===r&&uc===c)).every(unit=>unit.cells.filter(([ur,uc])=>board[ur][uc]===value).length<(surplus?2:1)));
  const steps=[];
  for (;;) {
    let step=null;
    // Full house is safe only when its remaining cell has one candidate;
    // a deficit unit can omit a digit and a surplus unit can repeat one.
    for (const unit of units) {
      const empty=unit.cells.filter(([r,c])=>board[r][c]===null);
      if(empty.length!==1)continue;
      const [r,c]=empty[0], options=candidates(r,c);
      if(options.length===1){step={technique:'Full House',row:r,col:c,value:options[0],reason:`the last cell in ${unit.name} has only one allowed digit`};break;}
    }
    // Adapted from sudokUI's findNakedSingle: scan empty cells for one candidate.
    if(!step) for(let r=0;r<size&&!step;r++)for(let c=0;c<size;c++)if(board[r][c]===null){const options=candidates(r,c);if(options.length===1){step={technique:'Naked Single',row:r,col:c,value:options[0],reason:'this cell has only one allowed digit'};break;}}
    // Hidden singles require the digit to be mandatory in the unit and absent
    // already. This excludes deficit units shorter than the digit alphabet.
    if(!step) for(const unit of units){
      if(!surplus && unit.cells.length!==digits.length)continue;
      for(const value of digits){
        if(unit.cells.some(([r,c])=>board[r][c]===value))continue;
        const positions=unit.cells.filter(([r,c])=>board[r][c]===null&&candidates(r,c).includes(value));
        if(positions.length===1){const [r,c]=positions[0];step={technique:'Hidden Single',row:r,col:c,value,reason:`${value} must appear in ${unit.name} and has only one possible cell`};break;}
      }
      if(step)break;
    }
    if(!step)break;
    board[step.row][step.col]=step.value;steps.push(step);
  }
  return {steps,solved:board.every(row=>row.every(value=>value!==null))};
}

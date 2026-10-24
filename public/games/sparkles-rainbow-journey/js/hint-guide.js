// Hint state stays with the host. Public views never include expected answers.
const places=['ones','tens','hundreds','thousands','ten-thousands'];
export function createGuide(q){
 const g={mode:'text',text:'Read the problem slowly. Find what you know and what you need to find. Try a drawing or objects to model it.',revision:0,feedback:''};
 if(q.track==='reading'){g.text=q.type==='phrase'?'Point to each word. Sound out unfamiliar words, blend their sounds, then reread the sentence smoothly.':'Look at the letters from left to right. Say each sound slowly, blend the sounds together, then try the whole word.';return g;}
 const part=q.kind==='word'&&q.steps?.length===1?q.steps[0]:null;
 const op=part?.op||q.op,a=part?.a??q.a,b=part?.b??q.b;
 if(['+','-'].includes(op)&&Number.isSafeInteger(a)&&Number.isSafeInteger(b)&&a>=0&&b>=0){
  if(a<=10&&b<=10){g.mode='dots';g.a=a;g.b=b;g.op=op;g.text=op==='+'?'Count the dots in both groups. Add them together, then enter your answer above.':'Start with the first group. Cross out one dot for each dot in the second group. Count the dots you did not cross out, then enter your answer above.';return g;}
  if(op==='+'||a>=b){g.mode='columns';g.a=a;g.b=b;g.op=op;g.column=0;g.carry=0;g.borrow=0;g.digits=String(a).split('').reverse().map(Number);g.count=Math.max(String(a).length,String(b).length);g.entries=[];return g;}
 }
 const tips={count:'Touch each object once as you count. Move from left to right so you do not count one twice.',missing:'Start at the number you know. Count forward to the total, keeping track of how many steps you take.',place:q.mode==='build'?'Draw one bundle for each ten and one dot for each one. Put the tens digit to the left of the ones digit.':'Write the number in a tens-and-ones chart. Change the tens by one; keep the ones the same.',mul:'Draw one group for each of the first number. Put the second number of dots in every group. Count all the dots, or skip-count equal groups.',div:'Draw the number of equal groups named in the problem. Share the objects one at a time so every group has the same amount. Count the objects in one group.',frac:'Split the total into the number of equal groups shown by the bottom number. Keep the number of groups shown by the top number. Count only those groups.'};
 g.text=tips[q.kind]||({'×':tips.mul,'÷':tips.div}[op])||g.text;
 if(q.kind==='word'&&q.steps?.length>1)g.text='Draw the story in order. First '+(q.steps[0].op==='×'?'make the equal groups.':'combine the starting group and the group added.')+' Then '+(q.steps[1].op==='-'?'cross out what was taken away.':'add the extra objects.')+' Count what remains in your drawing.';
 return g;
}
function column(g){
 const place=10**g.column,b=Math.floor(g.b/place)%10;
 if(g.op==='+'){const a=Math.floor(g.a/place)%10;return {expected:a+b+g.carry,prompt:`${places[g.column]||'Next'} column: ${a} + ${b}${g.carry?' + '+g.carry+' carried':''} = ?`,note:g.carry?'Include the ten you carried from the column to the right.':'Start at the right. Add only the highlighted column.'};}
 let a=g.digits[g.column]||0,note='Subtract only the highlighted column.';
 if(a<b){let k=g.column+1;while(g.digits[k]===0)k++;g.digits[k]--;for(let i=k-1;i>g.column;i--)g.digits[i]=9;g.digits[g.column]=a+10;a+=10;g.regroupColumn=g.column;note='The top digit is too small. Exchange one unit from a place to the left for ten in this place. The regrouped top row is shown below.';}
 if(g.regroupColumn===g.column)note='Exchange one unit from a place to the left for ten in this place. The regrouped top row is shown below.';
 return {expected:a-b,prompt:`${places[g.column]||'Next'} column: ${a} − ${b} = ?`,note};
}
export function guideView(g){
 if(!g)return null;
 if(g.mode!=='columns')return {mode:g.mode,text:g.text,a:g.a,b:g.b,op:g.op,revision:g.revision,feedback:g.feedback};
 if(g.column>=g.count)return {mode:'done',text:'You worked through every column! Read the digits you wrote from left to right. Enter your whole answer above to make your move.',entries:g.entries,revision:g.revision,feedback:g.feedback};
 const c=column(g);return {mode:'columns',a:String(g.a),b:String(g.b),op:g.op,column:g.column,count:g.count,top:g.op==='-'?g.digits.slice(0,g.count).reverse().map(String):String(g.a),entries:g.entries,prompt:c.prompt,text:c.note,revision:g.revision,feedback:g.feedback};
}
export function submitGuide(g,value){
 if(g?.mode!=='columns'||g.column>=g.count)return false;
 const c=column(g);g.revision++;
 if(!/^\d+$/.test(String(value).trim())||Number(value)!==c.expected){g.feedback='Try this column again. Use dots or count on your fingers. Your turn stays with you.';return false;}
 const n=Number(value);g.entries[g.column]=String(n%10);g.carry=g.op==='+'?Math.floor(n/10):0;g.column++;g.feedback='Good work on that column.';
 if(g.column===g.count&&g.carry)g.count++;
 return true;
}

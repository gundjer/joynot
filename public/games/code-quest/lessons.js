// Beep's Code Quest — lessons. Real computer-science ideas, told with everyday examples.
import { note, stack, pics, eq } from '../_joy/js/lesson.js';
const code = t => `<pre class="cq-code" style="margin:0;max-width:100%">${t}</pre>`;

export const LESSONS = {
  1: [
    { title: 'What is coding?', text: 'Computers and robots can’t think for themselves. They only do exactly what we tell them. CODING means writing instructions for a computer.', art: pics([['👩‍💻', 'you write code'], ['➜'], ['🤖', 'robot follows it']]) },
    { title: 'Commands', text: 'Each block is one COMMAND — one thing to do. ⬆️ means move up one square. ➡️ means move right one square.', art: pics([['⬆️', 'up'], ['➡️', 'right'], ['⬇️', 'down'], ['⬅️', 'left']]) },
    { title: 'Run it', text: 'Put the blocks in, then press Run. Beep does them one at a time, in order. To go 3 squares right, use ➡️ ➡️ ➡️.', art: pics([['🤖'], ['➡️'], ['➡️'], ['➡️'], ['🔋']]) },
  ],
  2: [
    { title: 'Algorithms', text: 'A list of steps in order is called an ALGORITHM. A recipe is an algorithm. So is brushing your teeth: wet brush, add paste, brush, rinse.', art: pics([['🦷', '1. wet brush'], ['🧴', '2. paste'], ['😁', '3. brush'], ['💧', '4. rinse']]) },
    { title: 'Order matters', text: 'If the steps are in the wrong order, the result is wrong. Put your shoes on BEFORE you tie them! Plan Beep’s whole path, then add the blocks in order.', art: pics([['🧦', '1'], ['👟', '2'], ['🎀', '3 tie']]) },
  ],
  3: [
    { title: 'Facing matters', text: 'Now Beep moves the way it is FACING. “Forward” moves one square ahead. “Turn left” and “Turn right” spin Beep in place — they don’t move it.', art: pics([['⬆', 'Forward'], ['↰', 'Turn left'], ['↱', 'Turn right']]) },
    { title: 'Be the robot', text: 'Pretend you are Beep! Point the way Beep faces. Turning right is the way a clock’s hands go. Turning left is the other way.', art: note('🧒 Face up → ↱ turn right → now you face right ➡️') },
  ],
  4: [
    { title: 'Jump', text: 'Rocks block the path. The Jump command hops over one square — it moves Beep 2 squares forward.', art: pics([['🤖'], ['⤴'], ['⛰️'], ['⭐']]) },
  ],
  5: [
    { title: 'Read the code', text: 'Programmers READ code to predict what it will do before they run it. Follow each block with your finger, one at a time, and keep track of which way Beep faces.', art: stack(code('forward();\nforward();\nturnRight();\nforward();'), note('👉 Trace it step by step')) },
  ],
  6: [
    { title: 'Bugs', text: 'A mistake in code is called a BUG. Fixing it is called DEBUGGING. The first “bug” was a real moth stuck inside a computer in 1947!', art: pics([['🐛', 'bug'], ['🔍', 'find it'], ['🔧', 'fix it']]) },
    { title: 'How to debug', text: '1. Run the code and watch. 2. Find the first moment it goes wrong. 3. Look at the block right there. 4. Change ONE thing and test again.', art: note('▶ Run → 👀 Watch → 🎯 Find → 🔧 Fix → ▶ Test') },
  ],
  7: [
    { title: 'Loops', text: 'Writing Forward 6 times is a lot of blocks! A LOOP repeats blocks for you. “Repeat 6 [Forward]” does the same thing with just 2 blocks.', art: stack(code('forward(); forward(); forward();\nforward(); forward(); forward();'), eq('= repeat (6) { forward(); }')) },
    { title: 'Loops are everywhere', text: 'Games use loops to move every character many times a second. Your washing machine repeats spin cycles. Loops make code short and easy to change.', art: pics([['🎮', 'games'], ['🌀', 'washer'], ['🎵', 'music chorus']]) },
    { title: 'How to use Repeat', text: 'Tap 🔁 Repeat. Then tap the blocks that go INSIDE it. Use − and + to change how many times it repeats. Tap the program area to go back outside the loop.', art: note('🔁 ×3 [ ⬆ ⬆ ↱ ]') },
  ],
  8: [
    { title: 'Find the pattern', text: 'Look for a part of the path that repeats, like a staircase: forward, turn, forward, turn. Put just ONE copy of the pattern inside a Repeat.', art: stack(note('⬆ ↱ ⬆ ↰ | ⬆ ↱ ⬆ ↰ | ⬆ ↱ ⬆ ↰'), eq('repeat (3) { ⬆ ↱ ⬆ ↰ }')) },
  ],
  9: [
    { title: 'If / else', text: 'A CONDITIONAL lets code make a choice. IF it is raining, take an umbrella, ELSE wear sunglasses. Beep’s ❓ block: IF there is a rock ahead, jump, ELSE step forward.', art: stack(code('if (rockAhead) {\n  jump();\n} else {\n  forward();\n}'), pics([['☔', 'if rain'], ['😎', 'else sun']])) },
    { title: 'Why it’s powerful', text: 'With if/else, the SAME code works on many different paths, because the robot checks for itself. Self-driving cars use millions of if-then checks!', art: pics([['🚗', 'if red light → stop'], ['🚦', 'else → go']]) },
  ],
  10: [
    { title: 'Loops + conditionals', text: 'Put an if/else INSIDE a loop and Beep checks every single step. “Repeat 6 [ if rock: jump else forward ]” crosses any rocky path!', art: code('repeat (6) {\n  if (rockAhead) jump();\n  else forward();\n}') },
    { title: 'You are coding!', text: 'Sequences, loops and conditionals are the building blocks of EVERY app, game and website. Real languages like Python and JavaScript use these same ideas.', art: pics([['🐍', 'Python'], ['🌐', 'JavaScript'], ['📱', 'apps']]) },
  ],
};

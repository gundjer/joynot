// Feelings Detective — lessons. Social-emotional learning: name it, notice it, calm it, solve it.
import { note, stack, pics } from '../_joy/js/lesson.js';

export const LESSONS = {
  1: [
    { title: 'Feelings have names', text: 'Everyone has feelings. Four big ones are HAPPY, SAD, MAD and SCARED. All feelings are OK — what matters is what we do with them.', art: pics([['😀', 'happy'], ['😢', 'sad'], ['😠', 'mad'], ['😨', 'scared']]) },
    { title: 'Be a face detective', text: 'Look at the EYES, EYEBROWS and MOUTH. A smile means happy. Tears mean sad. Squeezed eyebrows mean mad. Wide eyes can mean scared.', art: pics([['👀', 'eyes'], ['🤨', 'eyebrows'], ['👄', 'mouth']]) },
  ],
  2: [
    { title: 'More feelings', text: 'SURPRISED (eyebrows up, mouth like an O), TIRED (yawning), SILLY, WORRIED, EXCITED and CALM are feelings too.', art: pics([['😲', 'surprised'], ['😴', 'tired'], ['😜', 'silly'], ['😟', 'worried'], ['🤩', 'excited'], ['😌', 'calm']]) },
  ],
  3: [
    { title: 'Feelings come from what happens', text: 'What happens to us can cause feelings. Losing a toy can make us sad. A surprise party can make us excited. Ask: "What happened?"', art: pics([['🍦⬇️', 'sad'], ['🎁', 'excited']]) },
  ],
  4: [
    { title: 'Calm-down tools', text: 'Big feelings make our bodies feel hot, fast or shaky. Calm-down tools help: take slow breaths, count to 10, take a break, or talk to a grown-up.', art: pics([['🌬️', 'deep breaths'], ['🔢', 'count to 10'], ['🧘', 'take a break'], ['🗣️', 'talk to a grown-up']]) },
    { title: 'Belly breathing', text: 'Breathe in through your nose for 4 counts like smelling a flower. Breathe out slowly for 4 counts like blowing out a candle. Try it 3 times!', art: pics([['🌸', 'smell the flower'], ['🕯️', 'blow out the candle']]) },
  ],
  5: [
    { title: 'Empathy', text: 'EMPATHY means understanding how someone else feels. Good friends notice, ask "Are you OK?", and help.', art: pics([['👀', 'notice'], ['❓', 'ask'], ['🤝', 'help']]) },
  ],
  6: [
    { title: 'Big feeling words', text: 'Exact words help people understand you. Frustrated, disappointed, embarrassed, proud, jealous, nervous, lonely and grateful are all more exact than "bad" or "good."', art: note('😤 frustrated · 😞 disappointed · 😳 embarrassed · 😊 proud<br>😒 jealous · 😬 nervous · 😔 lonely · 🥰 grateful') },
  ],
  7: [
    { title: 'Solve a problem in 4 steps', text: '1. Stop and calm down. 2. Say the problem. 3. Think of ideas that are fair for everyone. 4. Pick one and try it.', art: note('🛑 Calm → 🗣️ Say it → 💡 Ideas → ✅ Try one') },
    { title: 'I-statements', text: 'Say how you feel without blaming: "I feel ___ when ___. Please ___." It helps people listen instead of argue.', art: note('“I feel <b>upset</b> when <b>you take my pencil</b>. Please <b>ask first</b>.”') },
  ],
  8: [
    { title: 'Mixed feelings', text: 'We can feel two things at once. Moving to a new town can feel sad AND exciting. That is normal.', art: pics([['😢', 'sad'], ['➕', ''], ['🤩', 'excited']]) },
  ],
  9: [
    { title: 'Walk in their shoes', text: 'PERSPECTIVE means imagining how a situation looks to someone else. Look at their body language and think: "How would I feel if that happened to me?"', art: pics([['👟', 'their shoes'], ['🧠', 'think'], ['💛', 'act kindly']]) },
  ],
};

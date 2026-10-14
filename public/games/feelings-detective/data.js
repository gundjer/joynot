// Feelings Detective data: faces, cases and the challenge for each level.
import { pick, sample, shuffle } from '../_joy/js/util.js';
import { addFeelingsBanks } from './more.js';

export const FACES1 = { happy: '😀', sad: '😢', mad: '😠', scared: '😨' };
export const FACES2 = { surprised: '😲', tired: '😴', silly: '😜', worried: '😟', excited: '🤩', calm: '😌', ...FACES1 };
export const FACE_TIP = {
  happy: 'A big smile and bright eyes mean happy.', sad: 'Tears and a frown mean sad.', mad: 'Squeezed eyebrows and a tight mouth mean mad.',
  scared: 'Wide eyes and an open mouth with raised eyebrows can mean scared.', surprised: 'Eyebrows up high and a round “O” mouth mean surprised.',
  tired: 'Closed eyes and a yawn mean tired.', silly: 'A tongue out and a wink mean silly.', worried: 'A small frown and eyebrows pushed together mean worried.',
  excited: 'Star eyes and a huge grin mean excited!', calm: 'Relaxed eyes and a soft smile mean calm.',
};
// [scenario, feeling, why]
export const HOW = [
  ['Your ice cream falls on the ground.', 'sad', 'Losing something you were enjoying can make you feel sad.'],
  ['You get a puppy for your birthday!', 'happy', 'Getting something you love makes most people feel happy!'],
  ['A big dog runs at you, barking loudly.', 'scared', 'Something loud and fast coming at you can feel scary.'],
  ['Your friend grabs your toy without asking.', 'mad', 'When someone takes your things, it is normal to feel mad.'],
  ['You stayed up really late and now it is morning.', 'tired', 'Not enough sleep makes your body feel tired.'],
  ['Your family is going to the beach tomorrow!', 'excited', 'Looking forward to something fun feels exciting.'],
  ['You open a box and a toy snake pops out!', 'surprised', 'Something you did not expect can make you feel surprised.'],
  ['You can’t find your mom in the big store.', 'worried', 'Not knowing where your grown-up is can make you feel worried.'],
  ['Your best friend moves to another town.', 'sad', 'Missing someone you care about can feel sad.'],
  ['Someone knocks down the tower you built on purpose.', 'mad', 'When someone wrecks your work on purpose, feeling mad makes sense.'],
  ['You are lying in a hammock listening to birds.', 'calm', 'Quiet, peaceful places help our bodies feel calm.'],
  ['You hear thunder while the lights go out.', 'scared', 'Storms and the dark can feel scary — and that is OK.'],
];
// [situation, best tool, [not-helpful choices], why]
export const CALM = [
  ['You feel really angry.', 'Take three slow, deep breaths', ['Hit something', 'Yell at your friend'], 'Deep breaths slow your heart down and help your brain think.'],
  ['You feel worried about a test tomorrow.', 'Tell a grown-up how you feel', ['Keep it a secret forever', 'Stay up all night'], 'Talking about worries makes them feel smaller.'],
  ['You are so frustrated with your homework.', 'Take a short break, then try again', ['Rip up the paper', 'Give up for good'], 'A short break helps your brain reset.'],
  ['You feel sad because your friend can’t play.', 'Draw a picture or play something else', ['Throw your toys', 'Be mean to your sister'], 'Doing something you enjoy can lift your mood.'],
  ['Your body feels wiggly and you can’t sit still.', 'Stretch or do ten jumping jacks', ['Run around the classroom', 'Kick the chair'], 'Moving your body in a safe way gets the wiggles out.'],
  ['You feel scared of the dark at bedtime.', 'Hug a stuffed animal and use a night light', ['Scream until morning', 'Hide under the bed'], 'Comfort things help you feel safe.'],
  ['You feel so mad your face is hot.', 'Count slowly to ten', ['Say something mean', 'Slam the door'], 'Counting gives your feelings time to cool down.'],
  ['You feel nervous before your soccer game.', 'Think “I can do this!” and breathe slowly', ['Pretend to be sick', 'Cry and refuse to go'], 'Brave self-talk helps nervous feelings.'],
];
export const FRIEND = [
  ['Your friend falls and scrapes her knee.', 'Ask, “Are you OK? Can I help?”', ['Laugh at her', 'Walk away'], 'Checking on someone shows you care.'],
  ['A new kid is sitting alone at lunch.', 'Invite them to sit with you', ['Point and whisper', 'Ignore them'], 'Including someone new helps them feel welcome.'],
  ['Your friend is sad because his fish died.', 'Say, “I’m sorry. That must feel really sad.”', ['Say, “It’s just a fish.”', 'Change the subject to your toys'], 'Naming their feeling shows you understand.'],
  ['Your friend made a mistake reading out loud.', 'Say, “That’s OK — you’re getting better!”', ['Laugh loudly', 'Tell everyone'], 'Kind words help people keep trying.'],
  ['Your sister won a prize and you didn’t.', 'Say, “Congratulations! You worked hard.”', ['Say, “That’s not fair!”', 'Hide her prize'], 'Being happy for others is a big-kid skill.'],
  ['A classmate drops all of their crayons.', 'Help pick them up', ['Step on them', 'Keep one for yourself'], 'Helping shows kindness.'],
  ['Your friend is scared to go down the big slide.', 'Say, “You can go when you’re ready. I’ll wait.”', ['Push them down', 'Call them a baby'], 'Patience and kind words help scared feelings.'],
  ['Your friend tells you a secret that they are being hurt.', 'Tell a trusted grown-up right away', ['Keep the secret', 'Tell kids at recess'], 'Some secrets are not safe to keep. Grown-ups can help.'],
];
export const WORDS = {
  frustrated: ['😤', 'Your puzzle piece just won’t fit, no matter how you turn it.', 'Frustrated means upset because something is hard or not working.'],
  disappointed: ['😞', 'It rains and your picnic is cancelled.', 'Disappointed means sad because something you hoped for didn’t happen.'],
  embarrassed: ['😳', 'You trip and fall in front of the whole class.', 'Embarrassed means feeling shy or awkward when others see something happen.'],
  proud: ['😊', 'You finally ride your bike without training wheels!', 'Proud means feeling good about something you worked hard to do.'],
  jealous: ['😒', 'Your friend gets the exact toy you really wanted.', 'Jealous means wanting what someone else has.'],
  nervous: ['😬', 'It is your first day at a brand-new school.', 'Nervous means a jumpy, worried feeling before something new.'],
  lonely: ['😔', 'Nobody plays with you at recess.', 'Lonely means sad because you feel alone.'],
  grateful: ['🥰', 'Your neighbor helps you fix your broken bike.', 'Grateful means thankful for something someone did.'],
};
export const SOLVE = [
  ['You and your brother both want the last cookie.', 'Split it in half or take turns choosing', ['Grab it and run', 'Cry until you get it'], 'Sharing and taking turns are fair ways to solve problems.'],
  ['Someone cuts in front of you in line.', 'Calmly say, “Please go to the back of the line.”', ['Push them out of line', 'Cut in front of someone else'], 'Using calm words tells them what you need.'],
  ['A friend says something unkind to you.', 'Say, “I feel hurt when you say that. Please stop.”', ['Say something meaner back', 'Never talk to them again'], 'An “I feel” sentence tells people how their words affect you.'],
  ['Two friends want to play different games.', 'Play one game now and the other game next', ['Play alone and pout', 'Tell them both no'], 'Compromise means everyone gets a turn.'],
  ['You broke your friend’s toy by accident.', 'Say sorry and offer to help fix it', ['Hide it and say nothing', 'Blame someone else'], 'Owning up and making it right builds trust.'],
  ['Kids keep leaving one boy out of the game.', 'Invite him to play and tell the group to include him', ['Join in leaving him out', 'Laugh about it'], 'Standing up for others is brave and kind.'],
  ['Your team lost the game.', 'Shake hands and say, “Good game!”', ['Yell at the referee', 'Throw the ball'], 'Being a good sport matters whether you win or lose.'],
  ['You and a classmate disagree about a project idea.', 'Listen to their idea, then share yours and find a mix', ['Do it your way without asking', 'Quit the project'], 'Listening first helps you find a solution together.'],
];
export const MIXED = [
  ['It is your last day at your old school before you move to a new town.', 'Sad and excited', ['Angry and bored', 'Only silly'], 'You can be sad to leave and excited for something new at the same time.'],
  ['You win the race, but your best friend trips and gets hurt.', 'Proud and worried', ['Bored and sleepy', 'Only happy'], 'You can be proud of yourself and worried about your friend at once.'],
  ['You are about to ride the biggest roller coaster for the first time.', 'Nervous and excited', ['Calm and bored', 'Only sad'], 'Nervous and excited often go together before new adventures!'],
  ['Grandma visits, but she can only stay for one day.', 'Happy and sad', ['Angry and scared', 'Only bored'], 'You can be happy she came and sad she has to go.'],
  ['You get a big part in the school play, but you have to sing alone.', 'Proud and nervous', ['Jealous and tired', 'Only mad'], 'Being chosen feels great — and singing alone can feel scary too.'],
  ['Your little brother breaks your toy, but he says he’s really sorry.', 'Upset and forgiving', ['Silly and excited', 'Only proud'], 'You can still be upset and also choose to forgive.'],
  ['You finally finish a very hard book.', 'Proud and a little sad it’s over', ['Scared and angry', 'Only jealous'], 'Finishing something big can feel proud and a little sad.'],
];
export const SHOES = [
  ['Maya didn’t get picked for the team. She walks away quietly.', 'She may feel left out — ask her to play with you', ['She feels great — leave her alone', 'She is mad at you — stay away'], 'Noticing body language helps you understand others.'],
  ['A new student doesn’t speak much English yet.', 'He may feel nervous — smile and show him around', ['He doesn’t want friends', 'He feels silly — make jokes about him'], 'Imagining how it feels to be new helps you be kind.'],
  ['Your teacher looks tired after recess duty in the cold rain.', 'She may feel tired — help clean up without being asked', ['She is bored — talk louder', 'She is happy — nothing to do'], 'Small kind acts make a big difference.'],
  ['Your friend’s grandpa is in the hospital. He is quiet today.', 'He may feel worried — ask if he wants to talk or play', ['He is bored — tease him to cheer up', 'He is mad at you'], 'Asking what someone needs shows empathy.'],
  ['Your little cousin cries when you won’t share your tablet.', 'She may feel left out — let her have a turn or play together', ['She is just being silly', 'She feels proud'], 'Thinking about her point of view helps you choose kindly.'],
  ['A classmate forgot his lunch and is staring at the floor.', 'He may feel embarrassed and hungry — tell a grown-up or share', ['He is excited — say nothing', 'He feels proud'], 'Sometimes people need help but feel too shy to ask.'],
  ['Everyone laughed when Zoe answered wrong in class.', 'She may feel embarrassed — say something kind to her', ['She feels proud — laugh too', 'She is bored'], 'Kindness helps people feel safe to try again.'],
];

addFeelingsBanks({ HOW, CALM, FRIEND, WORDS, SOLVE, MIXED, SHOES });

export function makeQ(level) {
    if (level === 1 || level === 2) {
      const set = level === 1 ? FACES1 : FACES2;
      const keys = Object.keys(set), f = pick(level === 2 ? keys.filter(k => !FACES1[k]).concat(pick(Object.keys(FACES1))) : keys);
      const opts = shuffle([f, ...sample(keys.filter(k => k !== f), 3)]);
      if (Math.random() < 0.5) return { kind: 'face2word', key: 'fw' + f, f, face: set[f], opts, ans: f, prompt: 'How does this face feel?', expected: f, explain: FACE_TIP[f] };
      return { kind: 'word2face', key: 'wf' + f, f, faces: opts.map(k => [k, set[k]]), ans: f, prompt: `Which face looks ${f.toUpperCase()}?`, say: `Which face looks ${f}?`, expected: f, explain: FACE_TIP[f] };
    }
    if (level === 3) {
      const [s, f, why] = pick(HOW);
      const opts = shuffle([f, ...sample(Object.keys(FACES2).filter(k => k !== f && !(f === 'scared' && k === 'worried') && !(f === 'worried' && k === 'scared') && !(f === 'happy' && k === 'excited') && !(f === 'excited' && k === 'happy') && !(f === 'surprised' && k === 'scared')), 3)]);
      return { kind: 'scene', key: 'h' + s.slice(0, 20), scene: s, opts: opts.map(k => ({ value: k, html: `<span class="emo">${FACES2[k]}</span> ${k}`, label: k })), ans: f, prompt: `${s} How would you feel?`, expected: f, explain: why };
    }
    const fromList = (list, tag) => { const [s, right, wrong, why] = pick(list); return { kind: 'scene', key: tag + s.slice(0, 24), scene: s, opts: shuffle([right, ...wrong]).map(o => ({ value: o, label: o })), ans: right, text: true, expected: right, explain: why }; };
    if (level === 4) { const q = fromList(CALM, 'c'); q.prompt = `${q.scene} What is a good thing to do?`; return q; }
    if (level === 5) { const q = fromList(FRIEND, 'f'); q.prompt = `${q.scene} What could you do or say?`; return q; }
    if (level === 6) {
      const keys = Object.keys(WORDS), w = pick(keys), [ic, s, why] = WORDS[w];
      if (Math.random() < 0.5) return { kind: 'scene', key: 'w' + w, scene: s, emoji: ic, opts: shuffle([w, ...sample(keys.filter(k => k !== w), 3)]).map(k => ({ value: k, label: k })), ans: w, prompt: `${s} Which feeling word fits best?`, expected: w, explain: why };
      const others = sample(keys.filter(k => k !== w), 2);
      return { kind: 'scene', key: 'wd' + w, scene: `What does “${w.toUpperCase()}” mean?`, emoji: ic, text: true, opts: shuffle([why, ...others.map(o => WORDS[o][2])]).map(o => ({ value: o, label: o.replace(/^\w+ means /, 'Feeling ') })), ans: why, prompt: `What does the word ${w} mean?`, expected: why.replace(/^\w+ means /, 'Feeling '), explain: `Example: ${s}` };
    }
    if (level === 7) { const q = fromList(SOLVE, 's'); q.prompt = `${q.scene} What is the best way to solve it?`; return q; }
    if (level === 8) { const q = fromList(MIXED, 'm'); q.prompt = `${q.scene} Which TWO feelings might you have?`; return q; }
    const q = fromList(SHOES, 'p'); q.prompt = `${q.scene} How might they feel, and what could you do?`; return q;
  }

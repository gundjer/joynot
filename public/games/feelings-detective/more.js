// Feelings Detective: more real-life scenes for every level, so kids practice many situations.
export function addFeelingsBanks({ HOW, CALM, FRIEND, WORDS, SOLVE, MIXED, SHOES }) {
  HOW.push(
    ['Your best friend is coming over to play today!', 'excited', 'Looking forward to something fun feels exciting.'],
    ['You hear a loud BANG in the dark.', 'scared', 'Sudden loud noises can make our bodies feel scared.'],
    ['Your little brother scribbles on your drawing.', 'mad', 'When someone wrecks something you made, you might feel mad.'],
    ['You stayed up late, and now it’s morning.', 'tired', 'Not enough sleep makes us feel tired.'],
    ['You open the door and everyone shouts “SURPRISE!”', 'surprised', 'Something you didn’t expect can make you surprised.'],
    ['Your grandma moved far away.', 'sad', 'Missing someone you love can make you sad.'],
    ['Tomorrow is your first day at a new school.', 'worried', 'New things we don’t know yet can make us feel worried.'],
    ['You are lying in the grass, watching clouds float by.', 'calm', 'Quiet, peaceful moments help us feel calm.'],
    ['You put on a funny hat and make goofy faces.', 'silly', 'Being goofy and playful feels silly!'],
    ['You finally learned to ride your bike!', 'happy', 'Doing something you worked hard on feels great.'],
  );
  CALM.push(
    ['You feel so mad you want to throw your toy.', 'Squeeze a pillow or stress ball instead', ['Throw the toy at a wall', 'Kick your sister'], 'Squeezing something soft lets the mad energy out safely.'],
    ['You feel nervous before your soccer game.', 'Take slow “smell the flower, blow out the candle” breaths', ['Run away from the field', 'Yell at the coach'], 'Slow breathing tells your body it is safe.'],
    ['You feel sad because your friend moved away.', 'Draw a picture or write a letter to them', ['Break something', 'Never talk to anyone again'], 'Creating something helps big feelings come out in a good way.'],
    ['You feel frustrated with your homework.', 'Take a short break, then try one step at a time', ['Rip up the paper', 'Give up forever'], 'Breaks help your brain reset.'],
    ['You feel scared during a thunderstorm.', 'Hug a stuffed animal and talk to a grown-up', ['Hide alone and stay quiet', 'Go outside to look'], 'Comfort and talking help scary feelings shrink.'],
    ['You feel too wiggly to sit still in class.', 'Ask for a quick stretch or water break', ['Bounce off the walls', 'Bother your neighbor'], 'Moving your body for a minute can help you focus again.'],
  );
  FRIEND.push(
    ['Your friend falls and scrapes their knee.', 'Ask “Are you OK?” and help them find a grown-up', ['Laugh at them', 'Keep playing without them'], 'Helping when someone is hurt shows you care.'],
    ['A classmate is sitting alone at lunch.', 'Ask if they want to sit with you', ['Ignore them', 'Point and whisper'], 'Including others makes everyone feel like they belong.'],
    ['Your friend shows you their drawing.', 'Say something kind about it, like “I love the colors!”', ['Say it looks bad', 'Walk away'], 'Kind words make friends feel good.'],
    ['You accidentally knock over your friend’s block tower.', 'Say sorry and help build it again', ['Pretend you didn’t do it', 'Knock over more'], 'A real sorry plus fixing it repairs friendships.'],
    ['Your friend wins the game you both played.', 'Say “Good game!”', ['Say “That’s not fair!”', 'Quit and stomp away'], 'Being a good sport keeps games fun for everyone.'],
    ['A friend has a different idea for what to play.', 'Take turns: play their game, then yours', ['Only play your game', 'Tell them their idea is dumb'], 'Taking turns is fair and keeps everyone happy.'],
  );
  Object.assign(WORDS, {
    lonely: ['🥺', 'Everyone at recess is playing, but no one asked you to join.', 'Lonely means sad because you feel alone or left out.'],
    grateful: ['🙏', 'Your neighbor helps you find your lost cat.', 'Grateful means thankful for something someone did.'],
    confident: ['😎', 'You practiced your speech and know it really well.', 'Confident means sure you can do it.'],
    jealous: ['😒', 'Your friend gets a new bike, and you wish it were yours.', 'Jealous means wanting what someone else has.'],
    curious: ['🤔', 'You find a strange bug and want to learn all about it.', 'Curious means wanting to find out more.'],
    overwhelmed: ['😵', 'You have homework, chores and practice all at the same time.', 'Overwhelmed means feeling like there is too much to handle.'],
  });
  SOLVE.push(
    ['Two friends both want to be the leader of the game.', 'Take turns being the leader', ['The loudest one wins', 'Stop being friends'], 'Taking turns gives everyone a fair chance.'],
    ['Your friend borrowed your pencil and hasn’t given it back.', 'Politely ask, “Can I have my pencil back, please?”', ['Grab it out of their hand', 'Take their eraser instead'], 'Asking calmly is the first step.'],
    ['Your team can’t agree on a name for your project.', 'Everyone shares ideas, then vote', ['One person decides alone', 'Give up on the project'], 'Voting is a fair way to decide together.'],
    ['Someone keeps bumping your desk while you work.', 'Kindly ask them to stop, and tell the teacher if it keeps happening', ['Bump them back harder', 'Cry and say nothing'], 'Calm words first; a grown-up can help if it doesn’t stop.'],
    ['You and a friend broke a vase while playing.', 'Tell a grown-up the truth together', ['Hide the pieces', 'Blame the dog'], 'Telling the truth builds trust, even when it’s hard.'],
  );
  MIXED.push(
    ['You get a shot at the doctor, then a sticker and a treat.', 'Scared and proud', ['Bored and silly', 'Only angry'], 'You can be scared of the shot and proud you were brave.'],
    ['Your big sister leaves for college.', 'Sad and proud', ['Only bored', 'Angry and sleepy'], 'You can miss someone and be proud of them at the same time.'],
    ['You are about to sing on stage for the first time.', 'Nervous and excited', ['Bored and tired', 'Only sad'], 'Butterflies in your tummy can be both nerves and excitement!'],
    ['Your friend gets a puppy, but you can’t have one.', 'Happy for them and a little jealous', ['Only angry', 'Bored and silly'], 'It’s normal to feel two feelings. Being happy for others is a strength.'],
  );
  SHOES.push(
    ['Leo’s drawing was torn by accident. He has his head down.', 'He may feel sad: tell him you’re sorry and help fix it', ['He feels happy: ignore it', 'He is fine: laugh about it'], 'Noticing faces and bodies helps you understand feelings.'],
    ['Ava keeps looking at the door on the first day of school.', 'She may feel nervous: say hi and invite her to play', ['She feels bored: walk away', 'She is mad: stay away'], 'Kindness helps new kids feel safe.'],
    ['Sam struck out and his team lost the game.', 'He may feel disappointed: say “You’ll get it next time!”', ['He feels great: cheer loudly', 'Tell him it was all his fault'], 'Encouraging words help after a hard moment.'],
    ['Grandpa is moving slowly and holding his back.', 'He may be in pain: ask if you can help carry something', ['He is being lazy: hurry him', 'He wants to race: run ahead'], 'Paying attention to others shows care.'],
  );
}

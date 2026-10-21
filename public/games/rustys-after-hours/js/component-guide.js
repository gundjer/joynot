import { drawComponentPreview } from './scene3d.js';

export const COMPONENTS = {
  legs: { name: 'Servo drive & legs', action: 'Test the servo', what: 'A servo is a motor with gears and position feedback. The controller tells it which angle to hold.', fit: 'Fasten the servo bracket to the leg frame. The shaft turns the joint; the wide feet support the robot.', demo: 'Watch the servo shaft move the leg joint back and forth. Gears trade speed for turning force.' },
  body: { name: 'Frame & controller board', action: 'Send a movement signal', what: 'The metal frame supports the parts. The controller board runs a sequence of instructions for the motors and lights.', fit: 'Mount the board on spacers inside the chest. Spacers keep the board away from the metal frame. The colored lines show separate signal and power connections.', demo: 'The board sends an instruction. Motors move only when they receive a signal; the frame holds everything in place.' },
  arms: { name: 'Linkage & arm joints', action: 'Move the linkage', what: 'A linkage is a group of rods joined by pivots. It carries movement from a motor to another part, such as an arm or a jaw.', fit: 'Connect the rod to the elbow pivot and motor arm. The pivot lets it turn instead of bending the metal.', demo: 'The motor moves one end of the rod. The joint at the other end moves the hand. This is how stage robots wave.' },
  head: { name: 'Head shell & jaw hinge', action: 'Open the jaw', what: 'The outer shell makes the character recognizable. A hinge lets the lower jaw rotate around a fixed pin.', fit: 'Attach the neck bracket to the frame, then fit the jaw hinge. Leave room inside the shell for the mechanism to move.', demo: 'Watch the lower jaw rotate. A real animatronic uses a motor and linkage to make it look as though the character is talking.' },
  eyes: { name: 'Optical sensors & eye lights', action: 'Try the sensor', what: 'A light sensor measures incoming light. An LED gives off light. They do different jobs: sensing and shining.', fit: 'Mount the sensors beside the eye lights and connect their signals to the controller. A sensor does not understand a whole room like a person.', demo: 'The sensor reports a light change to the controller. The eye LEDs glow to show that the signal was received.' },
  bow: { name: 'Power pack & switch', action: 'Power the circuit', what: 'A battery stores energy. A switch completes or breaks the circuit. The controller and motors need a suitable power supply to work.', fit: 'Secure the power pack in its bracket. The switch and power leads connect the supply to the controller and motor circuits.', demo: 'Switch on: energy flows through the circuit and the indicator lights. Switch off: the circuit opens and the mechanism stops.' },
};

export class ComponentGuide {
  constructor(bot, say) {
    this.bot = bot; this.say = say; this.running = false; this.frame = 0;
    this.dialog = document.createElement('dialog'); this.dialog.className = 'component-guide';
    this.dialog.innerHTML = `<small>RUSTY'S PARTS & SERVICE</small><h2></h2><canvas width="600" height="360" aria-label="Animated 3D mechanical part"></canvas><p data-what></p><p data-fit></p><p data-demo role="status"></p><div><button type="button" data-test></button><button type="button" data-fit-button>Fit this part →</button></div>`;
    if (!document.getElementById('componentGuideStyle')) {
      const style = document.createElement('style'); style.id = 'componentGuideStyle'; style.textContent = `.component-guide{box-sizing:border-box;width:min(690px,94vw);max-height:94dvh;overflow:auto;border:1px solid #c5a66b;border-radius:20px;padding:24px;background:#142735;color:#eaf0e9;font-family:Andika,system-ui}.component-guide::backdrop{background:#030a14e8}.component-guide small{color:#eac477;letter-spacing:2px}.component-guide h2{font:700 28px Fredoka,system-ui;margin:10px 0}.component-guide canvas{display:block;width:100%;height:min(30vh,260px);object-fit:contain;background:radial-gradient(ellipse,#3c5360,#13232f);border-radius:12px}.component-guide p{line-height:1.55;font-size:15px;margin:12px 0}.component-guide [data-fit]{color:#b8d7df}.component-guide [data-demo]{color:#ffe2a1;min-height:24px}.component-guide>div{display:flex;gap:10px;flex-wrap:wrap}.component-guide button{font:700 16px Andika,system-ui;padding:12px 18px;border:0;border-radius:10px;background:#efc879;color:#142735}.component-guide [data-test]{background:#34556a;color:#eaf3ed}`; document.head.appendChild(style);
    }
    document.body.appendChild(this.dialog);
    this.dialog.querySelector('[data-test]').onclick = () => {
      this.running = !this.running;
      const part = COMPONENTS[this.id]; this.dialog.querySelector('[data-demo]').textContent = this.running ? part.demo : 'Mechanism stopped. Press the test button to run it again.';
      this.dialog.querySelector('[data-test]').textContent = this.running ? 'Stop mechanism' : part.action;
      if (this.running) this.say(part.demo);
    };
    this.dialog.querySelector('[data-fit-button]').onclick = () => this.dialog.close();
    this.dialog.addEventListener('close', () => cancelAnimationFrame(this.frame));
  }
  show(id) {
    this.id = id; this.running = false; const part = COMPONENTS[id];
    this.dialog.querySelector('h2').textContent = part.name;
    this.dialog.querySelector('[data-what]').textContent = part.what;
    this.dialog.querySelector('[data-fit]').textContent = part.fit;
    this.dialog.querySelector('[data-demo]').textContent = 'Inspect the part, then test what it does.';
    this.dialog.querySelector('[data-test]').textContent = part.action;
    this.dialog.showModal(); this.say(`${part.name}. ${part.what} ${part.fit}`);
    const canvas = this.dialog.querySelector('canvas'), ctx = canvas.getContext('2d');
    let time = 0, last = 0;
    const draw = stamp => {
      if (!this.dialog.open) return;
      if (this.running) time += Math.min(.05, (stamp - (last || stamp)) / 1000); last = stamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawComponentPreview(ctx, this.bot, id, 300, 180, 440, time, this.running);
      this.frame = requestAnimationFrame(draw);
    };
    cancelAnimationFrame(this.frame); this.frame = requestAnimationFrame(draw);
  }
  dispose() { cancelAnimationFrame(this.frame); this.dialog.close(); this.dialog.remove(); }
}

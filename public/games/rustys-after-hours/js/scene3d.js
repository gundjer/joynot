// Small local WebGL renderer: solid geometry, depth testing, directional light and a real flashlight.
// No downloads or external graphics services are needed while the child plays.
const rgb = hex => { const n = parseInt(hex.replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => v / 255); };
const norm = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
export function cameraMatrix(eye, target, aspect, fov = 1.15) {
  const z = norm(eye.map((v, i) => v - target[i])), x = norm(cross([0, 1, 0], z)), y = cross(z, x);
  const view = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
  const f = 1 / Math.tan(fov / 2), near = .035, far = 70;
  const p = [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0];
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c * 4 + r] += p[k * 4 + r] * view[c * 4 + k];
  return out;
}

export class Mesh {
  constructor() { this.data = []; this.transform(); }
  transform(x = 0, y = 0, z = 0, yaw = 0, scale = 1) { this.root = [x, y, z, Math.cos(yaw), Math.sin(yaw), scale]; return this; }
  vertex(p, n, color, glow) {
    const [x, y, z, c, s, k] = this.root;
    this.data.push(x + (p[0] * c + p[2] * s) * k, y + p[1] * k, z + (-p[0] * s + p[2] * c) * k,
      n[0] * c + n[2] * s, n[1], -n[0] * s + n[2] * c, ...color, glow);
  }
  box(x, y, z, w, h, d, hex, glow = 0) {
    const col = rgb(hex), X = w / 2, Y = h / 2, Z = d / 2;
    const faces = [
      [[0, 0, 1], [[-X, -Y, Z], [X, -Y, Z], [X, Y, Z], [-X, Y, Z]]],
      [[0, 0, -1], [[X, -Y, -Z], [-X, -Y, -Z], [-X, Y, -Z], [X, Y, -Z]]],
      [[1, 0, 0], [[X, -Y, Z], [X, -Y, -Z], [X, Y, -Z], [X, Y, Z]]],
      [[-1, 0, 0], [[-X, -Y, -Z], [-X, -Y, Z], [-X, Y, Z], [-X, Y, -Z]]],
      [[0, 1, 0], [[-X, Y, Z], [X, Y, Z], [X, Y, -Z], [-X, Y, -Z]]],
      [[0, -1, 0], [[-X, -Y, -Z], [X, -Y, -Z], [X, -Y, Z], [-X, -Y, Z]]],
    ];
    for (const [n, ps] of faces) for (const i of [0, 1, 2, 0, 2, 3]) this.vertex([ps[i][0] + x, ps[i][1] + y, ps[i][2] + z], n, col, glow);
  }
  ellipsoid(x, y, z, rx, ry, rz, hex, glow = 0) {
    const col = rgb(hex), rings = 7, sides = 12;
    const v = (a, b) => { const p = [Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b)]; return [[x + p[0] * rx, y + p[1] * ry, z + p[2] * rz], norm([p[0] / rx, p[1] / ry, p[2] / rz])]; };
    for (let a = 0; a < rings; a++) for (let b = 0; b < sides; b++) {
      const ps = [v(a * Math.PI / rings, b * 2 * Math.PI / sides), v((a + 1) * Math.PI / rings, b * 2 * Math.PI / sides), v((a + 1) * Math.PI / rings, (b + 1) * 2 * Math.PI / sides), v(a * Math.PI / rings, (b + 1) * 2 * Math.PI / sides)];
      for (const i of [0, 1, 2, 0, 2, 3]) this.vertex(ps[i][0], ps[i][1], col, glow);
    }
  }
  cylinder(x, y, z, radius, h, hex, glow = 0) {
    const col = rgb(hex);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, b = (i + 1) * Math.PI / 6;
      const p = [x + Math.cos(a) * radius, z + Math.sin(a) * radius], q = [x + Math.cos(b) * radius, z + Math.sin(b) * radius];
      const ps = [[p[0], y - h / 2, p[1]], [q[0], y - h / 2, q[1]], [q[0], y + h / 2, q[1]], [p[0], y + h / 2, p[1]]];
      for (const j of [0, 1, 2, 0, 2, 3]) this.vertex(ps[j], [Math.cos((a + b) / 2), 0, Math.sin((a + b) / 2)], col, glow);
      for (const sign of [-1, 1]) for (const pp of [[x, y + sign * h / 2, z], [p[0], y + sign * h / 2, p[1]], [q[0], y + sign * h / 2, q[1]]]) this.vertex(pp, [0, sign, 0], col, glow);
    }
  }
}

export class Scene3D {
  constructor() {
    this.canvas = document.createElement('canvas');
    const gl = this.gl = this.canvas.getContext('webgl', { alpha: true, antialias: true, preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL unavailable');
    const shader = (type, source) => { const sh = gl.createShader(type); gl.shaderSource(sh, source); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
    const vs = shader(gl.VERTEX_SHADER, `attribute vec3 aPosition,aNormal,aColor;attribute float aGlow;uniform mat4 uMatrix;varying vec3 pos,norm,col;varying float glow;void main(){pos=aPosition;norm=aNormal;col=aColor;glow=aGlow;gl_Position=uMatrix*vec4(pos,1.0);}`);
    const fs = shader(gl.FRAGMENT_SHADER, `precision mediump float;varying vec3 pos,norm,col;varying float glow;uniform vec3 uEye,uDirection;uniform float uAmbient,uFlash,uFog;void main(){vec3 ray=pos-uEye;float d=length(ray);vec3 n=normalize(norm);float sun=.25+.75*max(0.,dot(n,normalize(vec3(-.4,1.,.3))));float cone=smoothstep(.77,.97,dot(normalize(ray),uDirection));float torch=uFlash*cone*max(0.,1.-d/11.)*(.35+.65*max(0.,dot(n,-normalize(ray))));float lamp=.07*max(0.,n.y)+.11;float light=clamp(uAmbient*sun+lamp+torch+glow,0.,1.4);vec3 color=col*light;float fog=1.-exp(-d*uFog);color=mix(color,vec3(.035,.045,.07),fog);gl_FragColor=vec4(color,1.);}`);
    const prog = this.program = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    this.attrs = ['aPosition', 'aNormal', 'aColor', 'aGlow'].map(name => gl.getAttribLocation(prog, name));
    this.uniforms = Object.fromEntries(['uMatrix', 'uEye', 'uDirection', 'uAmbient', 'uFlash', 'uFog'].map(name => [name, gl.getUniformLocation(prog, name)]));
    this.dynamic = gl.createBuffer(); this.static = gl.createBuffer(); this.staticCount = 0;
  }
  resize(w, h) { const s = Math.min(1.5, window.devicePixelRatio || 1, 1500 / Math.max(w, h)); const W = Math.round(w * s), H = Math.round(h * s); if (this.canvas.width !== W || this.canvas.height !== H) { this.canvas.width = W; this.canvas.height = H; } }
  setStatic(mesh) { const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, this.static); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.data), gl.STATIC_DRAW); this.staticCount = mesh.data.length / 10; }
  batch(buffer, count) { const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, buffer); for (let i = 0; i < 4; i++) { gl.enableVertexAttribArray(this.attrs[i]); gl.vertexAttribPointer(this.attrs[i], i === 3 ? 1 : 3, gl.FLOAT, false, 40, i * 12); } gl.drawArrays(gl.TRIANGLES, 0, count); }
  render({ eye, target, tier = 0, flash = 0, mesh, transparent = false, fov = 1.15 }) {
    const gl = this.gl, u = this.uniforms;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.clearColor(transparent ? 0 : .035, transparent ? 0 : .045, transparent ? 0 : .07, transparent ? 0 : 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.useProgram(this.program);
    this.matrix = cameraMatrix(eye, target, this.canvas.width / this.canvas.height, fov);
    gl.uniformMatrix4fv(u.uMatrix, false, this.matrix); gl.uniform3fv(u.uEye, eye); gl.uniform3fv(u.uDirection, norm(target.map((v, i) => v - eye[i])));
    gl.uniform1f(u.uAmbient, transparent ? 1.05 : [.82, .46, .24][tier]); gl.uniform1f(u.uFlash, flash); gl.uniform1f(u.uFog, transparent ? 0 : [.018, .035, .05][tier]);
    if (this.staticCount) this.batch(this.static, this.staticCount);
    if (mesh && mesh.data.length) { gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamic); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.data), gl.DYNAMIC_DRAW); this.batch(this.dynamic, mesh.data.length / 10); }
    return this.canvas;
  }
  project(x, y, z, w, h) {
    const m = this.matrix, v = [x, y, z, 1], clip = [0, 0, 0, 0];
    for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) clip[r] += m[i * 4 + r] * v[i];
    if (clip[3] <= .05 || Math.abs(clip[0] / clip[3]) > 1.2 || Math.abs(clip[1] / clip[3]) > 1.2) return null;
    return { x: (clip[0] / clip[3] + 1) * w / 2, y: (1 - clip[1] / clip[3]) * h / 2, depth: clip[3] };
  }
}

// The same assembled machinery is used in the workshop, on stage and in the chase.
export function robotMesh(m, bot = {}, time = 0, has = null, walking = false, inspect = false) {
  const color = bot.color || '#ad7655', metal = bot.finish === 'chrome' ? '#d5e5ed' : '#8797a7';
  const present = id => !has || has.has(id), swing = walking ? Math.sin(time * 8) * .07 : Math.sin(time * 1.6) * .008;
  const joint = (x, y, z, r = .045) => m.ellipsoid(x, y, z, r, r, r, '#cad2db');
  if (present('legs')) for (const side of [-1, 1]) {
    m.box(side * .115, .39, -.02, .11, .1, .12, '#34465b');
    m.box(side * .115, .27, side * swing, .085, .33, .09, metal); joint(side * .115, .27, side * swing, .06);
    m.box(side * .115, .055, -.045 + side * swing, .16, .1, .24, color);
    m.cylinder(side * .115, .4, 0, .055, .08, '#e4b54b');
    // Visible servo output gear, motor case and the linkage that moves the knee.
    m.cylinder(side * .115, .447, 0, .063, .016, '#c5d0d9');
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5 + time * (walking ? 1.5 : .05);
      m.box(side * .115 + Math.cos(a) * .061, .447, Math.sin(a) * .061, .024, .023, .024, '#b3c2cc');
    }
    m.box(side * .115 + .035, .25, -.058, .018, .23, .018, '#d6c49c');
  }
  if (present('body')) {
    m.box(0, .6, 0, .31, .35, .2, metal);
    m.box(0, .63, .105, .33, .28, .04, color);
    // Open front panel: controller, power pack, wiring and mounting screws remain visible.
    m.box(0, .6, -.112, .255, .25, .025, '#182537');
    m.box(-.05, .65, -.132, .11, .1, .025, '#2e885f');
    m.box(-.05, .65, -.15, .045, .04, .012, '#131b25');
    for (let i = 0; i < 3; i++) m.box(-.085 + i * .033, .69, -.15, .013, .012, .01, '#7de7be', walking ? .5 + Math.sin(time * 5 - i) * .4 : .05);
    for (let i = 0; i < 4; i++) m.box(-.09 + i * .025, .59, -.143, .009, .02, .012, '#e6bf51');
    m.box(.065, .56, -.137, .065, .12, .045, '#424f65');
    for (const side of [-1, 1]) for (const top of [.49, .71]) joint(side * .12, top, -.14, .012);
    m.box(.035, .63, -.16, .012, .12, .012, '#e65f4c'); m.box(.055, .65, -.16, .012, .1, .012, '#68b4ef');
    if (!inspect) { m.ellipsoid(0, .59, -.105, .18, .18, .09, color); m.ellipsoid(0, .58, -.174, .115, .13, .025, '#e0cfad'); }
  }
  if (present('arms')) for (const side of [-1, 1]) {
    joint(side * .21, .73, 0, .065); m.box(side * .235, .58, side * swing, .08, .25, .08, metal);
    joint(side * .235, .48, side * swing); m.box(side * .24, .38, side * swing, .1, .16, .1, color);
    for (let i = 0; i < 3; i++) m.box(side * .24 + (i - 1) * .029, .28, -.025 + side * swing, .022, .075, .035, metal);
  }
  if (present('head')) {
    m.cylinder(0, .82, 0, .065, .1, metal);
    m.ellipsoid(0, 1., 0, .19, .19, .16, color);
    if (bot.kind === 'raccoon') for (const side of [-1, 1]) m.ellipsoid(side * .075, 1.045, -.13, .092, .075, .045, '#343c45');
    if (bot.kind === 'owl') for (const side of [-1, 1]) m.ellipsoid(side * .078, 1.045, -.12, .098, .105, .045, '#d5c5a5');
    m.ellipsoid(0, .95, bot.kind === 'gator' ? -.2 : -.14, bot.kind === 'gator' ? .15 : .125, .08, bot.kind === 'gator' ? .16 : .075, bot.kind === 'gator' ? color : '#e7d8be');
    m.box(0, .897, -.165, .17, .017, .07, '#1c2330');
    m.box(0, .875 - (walking ? (1 + Math.sin(time * 3)) * .02 : 0), -.14, .16, .025, .08, metal);
    m.ellipsoid(0, .99, -.205, .035, .026, .023, '#232933');
    for (const side of [-1, 1]) {
      if (bot.kind === 'owl') m.ellipsoid(side * .14, 1.14, .01, .06, .09, .055, color);
      else m.ellipsoid(side * .14, bot.kind === 'bunny' ? 1.24 : bot.kind === 'pup' ? 1.03 : 1.16, 0, .06, bot.kind === 'bunny' ? .19 : bot.kind === 'pup' ? .16 : .07, .045, color);
      if (bot.kind === 'moose') { m.box(side * .17, 1.23, .015, .035, .2, .035, '#cfac74'); m.box(side * .22, 1.29, .015, .13, .03, .035, '#cfac74'); for (let i = 0; i < 3; i++) m.box(side * (.17 + i * .045), 1.33, .015, .023, .1, .025, '#cfac74'); }
      joint(side * .17, .91, -.015, .022);
    }
  }
  if (present('eyes')) for (const side of [-1, 1]) {
    m.ellipsoid(side * .08, 1.04, -.138, .057, .063, .038, '#f2eee0');
    m.ellipsoid(side * .08, 1.04, -.172, .027, .032, .012, '#6ed5de', bot.chase ? .9 : walking ? .5 + Math.sin(time * 3) * .4 : .15);
    m.ellipsoid(side * .08, 1.04, -.182, .012, .018, .006, '#122030');
  }
  if (present('bow')) {
    m.box(0, .77, -.15, .15, .08, .06, '#3b4b60');
    for (let i = 0; i < 3; i++) m.box(-.045 + i * .045, .77, -.186, .03, .05, .016, '#d7b86a');
    m.box(0, .83, -.15, .06, .025, .04, '#e19c46');
    m.box(.047, .78, -.201, .02, .02, .012, '#83e2cd', .6 + Math.sin(time * 4) * .3);
  }
  if (inspect && has && !has.size) { // assembly jig before any parts are fitted
    m.box(0, .58, .1, .035, 1., .035, '#738292'); m.box(0, .06, 0, .48, .08, .38, '#293a50');
  }
}

let preview;
export function drawRobotPreview(ctx, bot, cx, cy, size, t, options = {}) {
  try {
    preview ||= new Scene3D(); preview.resize(400, 540);
    const mesh = new Mesh(), yaw = options.yaw ?? Math.sin(t * .35) * .35;
    mesh.transform(0, 0, 0, yaw); robotMesh(mesh, bot, t, options.has, options.walking, true);
    preview.render({ eye: [1.3, 1.02, -2.5], target: [0, .63, 0], mesh, transparent: true, fov: .68 });
    ctx.drawImage(preview.canvas, cx - size * .65, cy - size * .74, size * 1.3, size * 1.74);
    return true;
  } catch (e) { return false; }
}

export function drawComponentPreview(ctx, bot, id, cx, cy, size, t, running = true) {
  try {
    preview ||= new Scene3D(); preview.resize(420, 320);
    const mesh = new Mesh(); mesh.transform(0, 0, 0, Math.sin(t * .45) * .35);
    robotMesh(mesh, bot, running ? t : 0, new Set([id]), running, true);
    const y = { legs: .24, body: .61, arms: .5, head: 1.02, eyes: 1.04, bow: .77 }[id] || .6;
    const dist = id === 'arms' ? 1.4 : id === 'legs' || id === 'head' ? 1.1 : .8;
    preview.render({ eye: [.35, y + .16, -dist], target: [0, y, 0], mesh, transparent: true, fov: .7 });
    ctx.drawImage(preview.canvas, cx - size / 2, cy - size * .38, size, size * .76); return true;
  } catch (e) { return false; }
}

let workshopRoom;
export function drawWorkshopRoom(ctx, width, height) {
  try {
    if (!workshopRoom) {
      workshopRoom = new Scene3D(); const m = new Mesh();
      m.box(0, 1.45, -2.55, 8, 3, .15, '#304555');
      m.box(-4, 1.4, 0, .15, 3, 5.3, '#233746'); m.box(4, 1.4, 0, .15, 3, 5.3, '#233746');
      m.box(0, 2.95, 0, 8, .1, 5.3, '#192d3c');
      for (let x = -4; x < 4; x++) for (let z = -3; z < 5; z++) m.box(x + .5, -.07, z + .5, 1, .1, 1, (x + z) % 2 ? '#45596b' : '#6b7981');
      m.box(0, 1.55, -2.43, 4.6, 1.65, .08, '#a48359');
      for (let x = -2; x <= 2; x += .2) for (let y = .9; y < 2.3; y += .2) m.box(x, y, -2.378, .022, .022, .008, '#514738');
      for (const side of [-1, 1]) {
        const x = side * 2.5;
        m.box(x, .38, -1.65, 1.7, .76, 1, '#405a6b'); m.box(x, .8, -1.65, 1.8, .1, 1.1, '#bd9260');
        for (const y of [.2, .47, .65]) { m.box(x, y, -1.13, 1.48, .19, .025, '#527183'); m.box(x, y, -1.1, .35, .025, .04, '#c7cfd0'); }
        m.box(x + side * .3, 1.06, -1.6, .5, .42, .2, '#253744'); m.box(x + side * .3, 1.08, -1.715, .4, .24, .025, '#69c6b6', .6);
        m.box(side * 1.8, 2.65, -.8, 1.5, .1, .5, '#9aa9ac'); m.box(side * 1.8, 2.58, -.8, 1.3, .03, .38, '#ffe9ae', .7);
        // Mounted spanners, screwdrivers and service tools on the pegboard.
        for (let i = 0; i < 4; i++) { const tx = side * (.8 + i * .27); m.box(tx, 1.55, -2.31, .04, .44, .035, '#c8d1d4'); m.box(tx, 1.35, -2.31, .08, .2, .06, i % 2 ? '#c9784d' : '#4f9b9f'); }
      }
      m.box(0, 2.5, -2.36, 2.3, .22, .06, '#213541');
      m.box(0, .08, -.3, 2, .16, 1.8, '#273b4e');
      workshopRoom.setStatic(m);
    }
    workshopRoom.resize(width, height);
    const canvas = workshopRoom.render({ eye: [0, 1.45, 4.2], target: [0, 1.32, -2], tier: 0 });
    ctx.drawImage(canvas, 0, 0, width, height);
    ctx.save(); ctx.font = `700 ${Math.max(12, Math.min(23, width * .023))}px Andika, sans-serif`; ctx.fillStyle = '#edd3a0'; ctx.textAlign = 'center'; ctx.fillText('PARTS & SERVICE  /  ASSEMBLY BAY 01', width / 2, height * .18); ctx.restore();
    return true;
  } catch (e) { return false; }
}

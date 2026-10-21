// Tabletop rendering stays local: soft shadows, varnished pieces and printed tiles.
import { Mesh, cameraMatrix } from '../../rustys-after-hours/js/scene3d.js';
import { tilePoint, CANDY } from './board.js';
const normalize = v => { const d = Math.hypot(...v) || 1; return v.map(n => n / d); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const color = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => v / 255); };

export class ToyMesh extends Mesh {
  ellipsoid(x, y, z, rx, ry, rz, hex, material = 1) {
    const col = color(hex), rings = 12, sides = 20;
    const point = (a, b) => { const p = [Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)]; return [[x+p[0]*rx,y+p[1]*ry,z+p[2]*rz],normalize([p[0]/rx,p[1]/ry,p[2]/rz])]; };
    for (let a = 0; a < rings; a++) for (let b = 0; b < sides; b++) {
      const ps = [point(a*Math.PI/rings,b*Math.PI*2/sides),point((a+1)*Math.PI/rings,b*Math.PI*2/sides),point((a+1)*Math.PI/rings,(b+1)*Math.PI*2/sides),point(a*Math.PI/rings,(b+1)*Math.PI*2/sides)];
      for (const i of [0,1,2,0,2,3]) this.vertex(ps[i][0],ps[i][1],col,material);
    }
  }
  roundedBox(x, y, z, w, h, d, radius, hex, material = 1) {
    const r = Math.min(radius, w / 2, d / 2), bevel = Math.min(.045, h / 3, r / 2), col = color(hex), points = [];
    for (let c = 0; c < 4; c++) for (let s = 0; s <= 4; s++) {
      const angle = c * Math.PI / 2 + s * Math.PI / 8;
      points.push({ cx: Math.cos(c * Math.PI / 2 + Math.PI / 4) > 0 ? w / 2 - r : -w / 2 + r, cz: Math.sin(c * Math.PI / 2 + Math.PI / 4) > 0 ? d / 2 - r : -d / 2 + r, nx: Math.cos(angle), nz: Math.sin(angle) });
    }
    const levels = [[-h / 2, bevel], [-h / 2 + bevel, 0], [h / 2 - bevel, 0], [h / 2, bevel]];
    const vertex = (i, level, band) => {
      const p = points[i % points.length], [Y, inset] = levels[level];
      this.vertex([x + p.cx + p.nx * (r - inset), y + Y, z + p.cz + p.nz * (r - inset)], normalize([p.nx, band === 0 ? -1 : band === 2 ? 1 : 0, p.nz]), col, material);
    };
    for (let band = 0; band < 3; band++) for (let i = 0; i < points.length; i++) for (const [p, level] of [[i, band], [i + 1, band], [i + 1, band + 1], [i, band], [i + 1, band + 1], [i, band + 1]]) vertex(p, level, band);
    for (const top of [0, 3]) for (let i = 0; i < points.length; i++) {
      const Y = y + levels[top][0], inset = levels[top][1], n = [0, top ? 1 : -1, 0];
      this.vertex([x, Y, z], n, col, material);
      for (const index of [i, (i + 1) % points.length]) { const p = points[index]; this.vertex([x + p.cx + p.nx * (r - inset), Y, z + p.cz + p.nz * (r - inset)], n, col, material); }
    }
  }
  tube(path, radius, hex, material = 1, sides = 8) {
    const col = color(hex);
    const ring = (i, a) => {
      const p = path[i], before = path[Math.max(0, i - 1)], after = path[Math.min(path.length - 1, i + 1)];
      const tangent = normalize(after.map((v, n) => v - before[n]));
      const u = normalize(cross(tangent, Math.abs(tangent[1]) > .95 ? [1, 0, 0] : [0, 1, 0])), v = cross(tangent, u);
      const normal = u.map((n, k) => n * Math.cos(a) + v[k] * Math.sin(a));
      return [p.map((n, k) => n + normal[k] * radius), normal];
    };
    for (let i = 0; i < path.length - 1; i++) for (let s = 0; s < sides; s++) {
      const a = s * Math.PI * 2 / sides, b = (s + 1) * Math.PI * 2 / sides;
      for (const [index, angle] of [[i, a], [i + 1, a], [i + 1, b], [i, a], [i + 1, b], [i, b]]) { const [p, n] = ring(index, angle); this.vertex(p, n, col, material); }
    }
  }
  cone(x, y, z, radius, height, hex) {
    const col = color(hex);
    for (let i = 0; i < 24; i++) {
      const a = i * Math.PI / 12, b = (i + 1) * Math.PI / 12;
      for (const [angle, top] of [[a, false], [b, false], [(a + b) / 2, true]]) this.vertex([x + (top ? 0 : Math.cos(angle) * radius), y + (top ? height / 2 : -height / 2), z + (top ? 0 : Math.sin(angle) * radius)], normalize([Math.cos(angle), radius / height, Math.sin(angle)]), col, 1);
    }
  }
}

export class BoardScene {
  constructor() {
    this.canvas = document.createElement('canvas');
    const gl = this.gl = this.canvas.getContext('webgl', { alpha: true, antialias: true, preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL unavailable');
    const shader = (type, source) => { const sh = gl.createShader(type); gl.shaderSource(sh, source); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
    const program = (v, f) => { const p = gl.createProgram(); gl.attachShader(p, shader(gl.VERTEX_SHADER, v)); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, f)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
    const pack = `vec4 pack(float d){vec4 v=fract(d*vec4(16777216.,65536.,256.,1.));return v-v.xxyz*vec4(0.,.00390625,.00390625,.00390625);}`;
    this.depthProgram = program(`attribute vec3 aPosition;uniform mat4 uMatrix;void main(){gl_Position=uMatrix*vec4(aPosition,1.);}`, `precision highp float;${pack}void main(){gl_FragColor=pack(gl_FragCoord.z);}`);
    this.program = program(`attribute vec3 aPosition,aNormal,aColor;attribute float aGlow;uniform mat4 uMatrix,uLight;varying vec3 pos,norm,col;varying float material;varying vec4 shadow;void main(){pos=aPosition;norm=aNormal;col=aColor;material=aGlow;shadow=uLight*vec4(pos,1.);gl_Position=uMatrix*vec4(pos,1.);}`, `precision highp float;varying vec3 pos,norm,col;varying float material;varying vec4 shadow;uniform vec3 uEye;uniform sampler2D uShadow;
      float depth(vec2 uv){return dot(texture2D(uShadow,uv),vec4(1./16777216.,1./65536.,1./256.,1.));}
      uniform float uNature,uUV;float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){if(material>8.5&&uUV<.5)discard;vec3 n=normalize(norm),sun=normalize(vec3(-.55,1.,.45)),view=normalize(uEye-pos);vec3 s=shadow.xyz/shadow.w*.5+.5;float lit=0.;float bias=max(.0012*(1.-dot(n,sun)),.00045);for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){lit+=s.z-bias<=depth(s.xy+vec2(float(x),float(y))/1024.)?1.:0.;}lit/=9.;if(s.x<0.||s.x>1.||s.y<0.||s.y>1.)lit=1.;
      vec3 base=pow(col,vec3(2.2));float grain=sin(pos.x*38.+sin(pos.z*2.)*2.)*.025+sin(pos.x*135.+pos.z*3.)*.012;if(material>1.5&&material<2.5)base*=.92+grain;
      if(material>2.5&&material<3.5)base*=.7+.3*sin(pos.x*55.+pos.z*49.+sin(pos.y*3.)*1.7);
      if(material>3.5&&material<4.5){float fleck=noise(floor(pos.xz*65.));base*=.72+fleck*.52;float soil=smoothstep(.65,.94,sin(pos.x*.7+sin(pos.z*.3))*sin(pos.z*.9));base=mix(base,vec3(.085,.055,.026),soil*.6);}
      if(material>4.5&&material<6.5)base*=.88+.12*sin(pos.x*20.+pos.y*22.+pos.z*15.);
      float diffuse=max(0.,dot(n,sun));float gloss=material>6.5?.5:material>.5&&material<1.5?.22:.055;float spec=pow(max(0.,dot(n,normalize(sun+view))),material>6.5?95.:material>.5&&material<1.5?65.:22.)*gloss*lit;
      float ao=.88+.12*smoothstep(-.25,.6,pos.y);float ambient=uNature>.5?.25:.48;vec3 lighting=base*(ambient+.16*max(n.y,0.)+1.02*diffuse*lit)*ao+vec3(1.,.95,.85)*spec;
      if(material>4.5&&material<6.5)lighting+=base*.24*max(0.,dot(-n,sun));if(material>8.5)lighting=vec3(.65,.15,1.);
      vec3 outColor=pow(lighting/(lighting+vec3(uNature>.5?.55:.38)),vec3(1./2.2));float fog=uNature>.5?smoothstep(14.,45.,length(uEye-pos))*.7:0.;outColor=mix(outColor,vec3(.72,.83,.78),fog);gl_FragColor=vec4(outColor,material>7.5&&material<8.5?.4:1.);}`);
    this.labelProgram = program(`attribute vec3 aPosition;attribute vec2 aUV;uniform mat4 uMatrix;varying vec2 uv;void main(){uv=aUV;gl_Position=uMatrix*vec4(aPosition,1.);}`, `precision mediump float;varying vec2 uv;uniform sampler2D uAtlas;void main(){vec4 c=texture2D(uAtlas,uv);if(c.a<.03)discard;gl_FragColor=c;}`);
    this.static = gl.createBuffer(); this.dynamic = gl.createBuffer(); this.labels = gl.createBuffer(); this.staticCount = 0;
    // Orthographic light keeps shadow precision consistent over the whole board.
    const lightView = cameraMatrix([-11, 20, 12], [0, 0, 0], 1, Math.PI / 2);
    this.light = new Float32Array(16);
    for (let c = 0; c < 4; c++) { this.light[c * 4] = lightView[c * 4] / 10; this.light[c * 4 + 1] = lightView[c * 4 + 1] / 10; this.light[c * 4 + 2] = lightView[c * 4 + 3] / 30; }
    this.light[14] -= 1; this.light[15] = 1;
    this.shadowTexture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.shadowTexture); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1024, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); for (const direction of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, direction, gl.CLAMP_TO_EDGE);
    this.framebuffer = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.shadowTexture, 0);
    const rb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 1024, 1024); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Shadow framebuffer unavailable'); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const atlas = document.createElement('canvas'); atlas.width = atlas.height = 1024; const ctx = atlas.getContext('2d');
    for (let n = 1; n <= 60; n++) { const x = (n - 1) % 8 * 128, y = Math.floor((n - 1) / 8) * 128;
      ctx.fillStyle = '#403854'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 65px Trebuchet MS,sans-serif'; ctx.fillText(String(n), x + 64, y + 58);
      if (CANDY.includes(n)) { ctx.fillStyle = '#b05376'; ctx.font = 'bold 15px sans-serif'; ctx.fillText('CANDY', x + 64, y + 100); }
      if (n === 60) { ctx.fillStyle = '#b4943b'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('FINISH', x + 64, y + 100); }
    }
    this.atlas = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.atlas); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  resize(w, h) { const s = Math.min(1.7, devicePixelRatio || 1, 1800 / Math.max(w, h)),width=Math.round(w*s),height=Math.round(h*s);if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;} }
  setStatic(mesh) { const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, this.static); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.data), gl.STATIC_DRAW); this.staticCount = mesh.data.length / 10; this.shadowSkip = mesh.shadowSkip || 0; }
  batch(program, buffer, count, depth = false, first = 0) {
    const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    for (const [i, name] of (depth ? ['aPosition'] : ['aPosition', 'aNormal', 'aColor', 'aGlow']).entries()) { const loc = gl.getAttribLocation(program, name); if (loc < 0) continue; gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, i === 3 ? 1 : 3, gl.FLOAT, false, 40, i * 12); }
    gl.drawArrays(gl.TRIANGLES, first, count);
  }
  render({ eye, target, mesh, fov = .9, labelAngle = 0, labels: showLabels = true, nature = false, uv = false, lightTarget = null }) {
    const gl = this.gl, count = (mesh?.data.length || 0) / 10;
    if (lightTarget) {
      const view = cameraMatrix([lightTarget[0]-11,20,lightTarget[2]+12],lightTarget,1,Math.PI/2);
      for(let c=0;c<4;c++){this.light[c*4]=view[c*4]/12;this.light[c*4+1]=view[c*4+1]/12;this.light[c*4+2]=view[c*4+3]/30;}this.light[14]-=1;this.light[15]=1;
    }
    if (count) { gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamic); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.data), gl.DYNAMIC_DRAW); }
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer); gl.viewport(0, 0, 1024, 1024); gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.useProgram(this.depthProgram); gl.uniformMatrix4fv(gl.getUniformLocation(this.depthProgram, 'uMatrix'), false, this.light);
    this.batch(this.depthProgram, this.static, this.staticCount - this.shadowSkip, true, this.shadowSkip); if (count) this.batch(this.depthProgram, this.dynamic, count, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.canvas.width, this.canvas.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.useProgram(this.program);
    this.matrix = cameraMatrix(eye, target, this.canvas.width / this.canvas.height, fov);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'uMatrix'), false, this.matrix); gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'uLight'), false, this.light); gl.uniform3fv(gl.getUniformLocation(this.program, 'uEye'), eye);
    gl.uniform1f(gl.getUniformLocation(this.program,'uNature'),nature?1:0);gl.uniform1f(gl.getUniformLocation(this.program,'uUV'),uv?1:0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.shadowTexture); gl.uniform1i(gl.getUniformLocation(this.program, 'uShadow'), 0);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    this.batch(this.program, this.static, this.staticCount); if (count) this.batch(this.program, this.dynamic, count);
    gl.disable(gl.BLEND);
    if (!showLabels) return this.canvas;
    const labels = [], c = Math.cos(labelAngle), s = Math.sin(labelAngle);
    for (let n = 1; n <= 60; n++) { const p = tilePoint(n), u = (n - 1) % 8 / 8, v = Math.floor((n - 1) / 8) / 8;
      for (const [x, z, U, V] of [[-.32,-.32,0,0],[.32,-.32,1,0],[.32,.32,1,1],[-.32,-.32,0,0],[.32,.32,1,1],[-.32,.32,0,1]]) labels.push(p.x + x * c + z * s, .309, p.z - x * s + z * c, u + U / 8, v + V / 8);
    }
    gl.useProgram(this.labelProgram); gl.uniformMatrix4fv(gl.getUniformLocation(this.labelProgram, 'uMatrix'), false, this.matrix); gl.bindTexture(gl.TEXTURE_2D, this.atlas); gl.uniform1i(gl.getUniformLocation(this.labelProgram, 'uAtlas'), 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.labels); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(labels), gl.DYNAMIC_DRAW);
    for (const [name, size, offset] of [['aPosition',3,0],['aUV',2,12]]) { const loc = gl.getAttribLocation(this.labelProgram, name); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,size,gl.FLOAT,false,20,offset); }
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.drawArrays(gl.TRIANGLES, 0, labels.length / 5); gl.disable(gl.BLEND);
    return this.canvas;
  }
  project(x, y, z, w, h) {
    const m = this.matrix, W = m[3]*x+m[7]*y+m[11]*z+m[15]; if (W <= 0) return null;
    return { x: ((m[0]*x+m[4]*y+m[8]*z+m[12])/W+1)*w/2, y: (1-(m[1]*x+m[5]*y+m[9]*z+m[13])/W)*h/2 };
  }
}

// ============================================================
// bg.js — Background Effects
// ============================================================

import * as THREE from 'three';

const canvas   = document.querySelector('#bgCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight, true);
renderer.setClearColor(0x000000, 0);

const scene  = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

let currentEffect = 'none';
let sceneObjects  = [];
let clock         = new THREE.Clock();

function addObj(obj) { scene.add(obj); sceneObjects.push(obj); return obj; }

const EFFECTS = {

  none: {
    label: 'Mặc định', icon: '◯',
    init() {
      scene.background = null;
      document.body.style.background = 'radial-gradient(ellipse at center, #fedcfd 0%, #8b4fc0 50%, #4f39a8 100%)';
      document.body.style.backgroundAttachment = 'fixed';
    },
    update() {},
  },

// ── VŨ TRỤ ──────────────────────────────────────────────
  space: {
    label: 'Vũ trụ', icon: '🌌',
    init() {
      scene.background = new THREE.Color(0x0d0018);
      document.body.style.background = '';
      const N1 = 1500, g1 = new THREE.BufferGeometry();
      const p1 = new Float32Array(N1*3), c1 = new Float32Array(N1*3), s1 = new Float32Array(N1);
      for (let i = 0; i < N1; i++) {
        p1[i*3]=(Math.random()-.5)*2.2; p1[i*3+1]=(Math.random()-.5)*2.2; p1[i*3+2]=0;
        const r=Math.random();
        if(r<.45){c1[i*3]=1;c1[i*3+1]=.92;c1[i*3+2]=.98;}     // trắng hồng
        else if(r<.72){c1[i*3]=.85;c1[i*3+1]=.6;c1[i*3+2]=1;}   // tím
        else{c1[i*3]=1;c1[i*3+1]=.55;c1[i*3+2]=.8;}             // hồng
        s1[i]=Math.pow(Math.random(),2.5)*5+.8;
      }
      g1.setAttribute('position',new THREE.BufferAttribute(p1,3));
      g1.setAttribute('color',new THREE.BufferAttribute(c1,3));
      g1.setAttribute('size',new THREE.BufferAttribute(s1,1));
      const m1=new THREE.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,
        uniforms:{uTime:{value:0}},
        vertexShader:`attribute float size;varying vec3 vColor;uniform float uTime;
          void main(){vColor=color;float t=.6+.4*sin(uTime*1.5+position.x*12.+position.y*9.);
          gl_PointSize=size*t;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.;
          float a=(1.-smoothstep(0.,.4,d))+(1.-smoothstep(.4,1.,d))*.4;
          gl_FragColor=vec4(vColor,a);}`});
      const s=addObj(new THREE.Points(g1,m1));s.userData={mat:m1};

      const N2=80,g2=new THREE.BufferGeometry();
      const p2=new Float32Array(N2*3),c2=new Float32Array(N2*3),s2=new Float32Array(N2),v2=new Float32Array(N2*2);
      for(let i=0;i<N2;i++){
        p2[i*3]=(Math.random()-.5)*2.2;p2[i*3+1]=(Math.random()-.5)*2.2;p2[i*3+2]=0;
        const r=Math.random();
        if(r<.4){c2[i*3]=1;c2[i*3+1]=.95;c2[i*3+2]=.8;}
        else if(r<.7){c2[i*3]=.8;c2[i*3+1]=.9;c2[i*3+2]=1;}
        else{c2[i*3]=1;c2[i*3+1]=.7;c2[i*3+2]=.9;}
        s2[i]=Math.random()*8+4;v2[i*2]=(Math.random()-.5)*.001;v2[i*2+1]=(Math.random()-.5)*.0008; // nhanh hơn 3x
      }
      g2.setAttribute('position',new THREE.BufferAttribute(p2,3));
      g2.setAttribute('color',new THREE.BufferAttribute(c2,3));
      g2.setAttribute('size',new THREE.BufferAttribute(s2,1));
      const m2=new THREE.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,
        uniforms:{uTime:{value:0}},
        vertexShader:`attribute float size;varying vec3 vColor;uniform float uTime;
          void main(){vColor=color;float p=.75+.25*sin(uTime*.8+position.x*5.);
          gl_PointSize=size*p;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying vec3 vColor;void main(){vec2 uv=gl_PointCoord-.5;float d=length(uv)*2.;
          float c=1.-smoothstep(0.,.3,d);float g=(1.-smoothstep(.3,1.,d))*.6;
          float r=max(exp(-abs(uv.x)*18.)*exp(-abs(uv.y)*3.),exp(-abs(uv.y)*18.)*exp(-abs(uv.x)*3.))*.5;
          gl_FragColor=vec4(vColor,min(c+g+r,1.));}`});
      const s2o=addObj(new THREE.Points(g2,m2));s2o.userData={mat:m2,pos:p2,vel:v2,N:N2};

      // Lớp 3: sao loé sáng 4 tia — to, nhấp nháy mạnh
      const N3=40,g3=new THREE.BufferGeometry();
      const p3=new Float32Array(N3*3),c3=new Float32Array(N3*3),s3=new Float32Array(N3),ph3=new Float32Array(N3);
      for(let i=0;i<N3;i++){
        p3[i*3]=(Math.random()-.5)*2.2;p3[i*3+1]=(Math.random()-.5)*2.2;p3[i*3+2]=0;
        const r=Math.random();
        // Màu: trắng xanh lạnh hoặc vàng ấm
        if(r<.5){c3[i*3]=.9;c3[i*3+1]=.95;c3[i*3+2]=1;}
        else{c3[i*3]=1;c3[i*3+1]=.97;c3[i*3+2]=.8;}
        s3[i]=Math.random()*12+8; // to hơn để thấy tia
        ph3[i]=Math.random()*Math.PI*2; // phase nhấp nháy độc lập
      }
      g3.setAttribute('position',new THREE.BufferAttribute(p3,3));
      g3.setAttribute('color',new THREE.BufferAttribute(c3,3));
      g3.setAttribute('size',new THREE.BufferAttribute(s3,1));
      g3.setAttribute('phase',new THREE.BufferAttribute(ph3,1));
      const m3=new THREE.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,
        blending:THREE.AdditiveBlending,
        uniforms:{uTime:{value:0}},
        vertexShader:`attribute float size;attribute float phase;varying vec3 vColor;varying float vPulse;uniform float uTime;
          void main(){
            vColor=color;
            // Nhấp nháy nhanh và mạnh — lúc sáng lúc tắt
            float pulse=pow(max(0.,sin(uTime*3.+phase)),3.);
            vPulse=pulse;
            gl_PointSize=size*(0.3+pulse*1.2);
            gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying vec3 vColor;varying float vPulse;
          void main(){
            vec2 uv=gl_PointCoord-.5;
            float d=length(uv)*2.;
            // Lõi sáng
            float core=1.-smoothstep(0.,.2,d);
            // 4 tia sáng theo trục X và Y
            float ray4=max(
              exp(-abs(uv.x)*25.)*exp(-abs(uv.y)*4.),
              exp(-abs(uv.y)*25.)*exp(-abs(uv.x)*4.)
            );
            // 4 tia chéo 45°
            vec2 r45=vec2((uv.x+uv.y)*.707,(uv.x-uv.y)*.707);
            float ray4b=max(
              exp(-abs(r45.x)*25.)*exp(-abs(r45.y)*6.),
              exp(-abs(r45.y)*25.)*exp(-abs(r45.x)*6.)
            )*.5;
            float alpha=(core+(ray4+ray4b)*0.8)*(0.2+vPulse*0.9);
            gl_FragColor=vec4(vColor,min(alpha,1.));
          }`});
      const s3o=addObj(new THREE.Points(g3,m3));s3o.userData={mat:m3,phase:ph3};

      // Lớp 4: sao băng — sinh ra định kỳ, bay qua màn hình
      // Dùng LineSegments, mỗi sao băng là 1 vạch sáng dài
      const MAX_SHOOT = 6;
      const shootPos  = new Float32Array(MAX_SHOOT * 6); // 2 điểm × 3
      const shootData = []; // {active, x, y, vx, vy, life, maxLife, len}
      for(let i=0;i<MAX_SHOOT;i++){
        shootData.push({active:false,x:0,y:0,vx:0,vy:0,life:0,maxLife:1,len:.12});
        shootPos[i*6]=shootPos[i*6+3]=shootPos[i*6+1]=shootPos[i*6+4]=10; // ngoài màn
      }
      const shootGeo = new THREE.BufferGeometry();
      shootGeo.setAttribute('position',new THREE.BufferAttribute(shootPos,3));
      const shootMat = new THREE.ShaderMaterial({
        transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
        vertexShader:`void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`void main(){gl_FragColor=vec4(1.,0.95,1.,0.9);}`
      });
      const shootObj = addObj(new THREE.LineSegments(shootGeo,shootMat));
      shootObj.userData = {shootPos,shootData,MAX_SHOOT,nextShoot:4+Math.random()*6};
    },
    update(t){
      sceneObjects.forEach(o=>{
        if(o.userData.mat)o.userData.mat.uniforms.uTime.value=t;
        if(o.userData.vel){
          const{pos,vel,N}=o.userData;
          for(let i=0;i<N;i++){
            pos[i*3]+=vel[i*2];pos[i*3+1]+=vel[i*2+1];
            if(pos[i*3]>1.15)pos[i*3]=-1.15;if(pos[i*3]<-1.15)pos[i*3]=1.15;
            if(pos[i*3+1]>1.15)pos[i*3+1]=-1.15;if(pos[i*3+1]<-1.15)pos[i*3+1]=1.15;
            o.geometry.attributes.position.needsUpdate=true;
          }
        }
        // Sao băng update
        if(o.userData.shootData){
          const {shootPos,shootData,MAX_SHOOT} = o.userData;
          o.userData.nextShoot -= 0.016;
          // Spawn sao băng mới
          if(o.userData.nextShoot <= 0){
            const idx = shootData.findIndex(s=>!s.active);
            if(idx>=0){
              const s=shootData[idx];
              s.active=true; s.life=0; s.maxLife=0.6+Math.random()*0.5;
              s.len=0.1+Math.random()*0.15;
              // Spawn từ trên-phải, bay sang dưới-trái
              s.x=0.2+Math.random()*0.9; s.y=0.3+Math.random()*0.7;
              const angle=Math.PI*(0.55+Math.random()*0.2); // ~200-215°
              const spd=0.018+Math.random()*0.015;
              s.vx=Math.cos(angle)*spd; s.vy=Math.sin(angle)*spd;
            }
            o.userData.nextShoot = 3+Math.random()*8;
          }
          // Update từng sao băng
          for(let i=0;i<MAX_SHOOT;i++){
            const s=shootData[i];
            if(!s.active){shootPos[i*6]=shootPos[i*6+3]=10;continue;}
            s.x+=s.vx; s.y+=s.vy; s.life+=0.016;
            const fade=1-s.life/s.maxLife;
            // Đầu sao băng
            shootPos[i*6]  =s.x;      shootPos[i*6+1]=s.y;      shootPos[i*6+2]=0;
            // Đuôi sao băng (ngược hướng bay)
            shootPos[i*6+3]=s.x-s.vx/0.016*s.len; shootPos[i*6+4]=s.y-s.vy/0.016*s.len; shootPos[i*6+5]=0;
            if(s.life>=s.maxLife||s.x<-1.3||s.y<-1.3) s.active=false;
          }
          o.geometry.attributes.position.needsUpdate=true;
        }
      });
    },
  },

// ── MƯA — gió thay đổi góc, đan xen hạt ngắn/dài ──────
  rain: {
    label: 'Mưa', icon: '🌧',
    init() {
      scene.background = new THREE.Color(0x05080f);
      document.body.style.background = '';
      const COUNT = 700;
      const positions = new Float32Array(COUNT * 6); // 2 điểm × 3 xyz
      const vel       = new Float32Array(COUNT);     // tốc độ rơi
      const lenArr    = new Float32Array(COUNT);     // chiều dài giọt
      const isLong    = new Uint8Array(COUNT);       // 1=dài, 0=ngắn

      // windX: góc gió thay đổi theo thời gian
      let windX = -0.006; // bắt đầu nghiêng trái

      const reset = (i, fromTop) => {
        const x = (Math.random() - 0.5) * 2.8;
        const y = fromTop ? 1.3 + Math.random() * 0.4 : (Math.random() - 0.5) * 2.4;
        // Đan xen: 60% ngắn, 40% dài
        const long    = Math.random() > 0.6;
        isLong[i]     = long ? 1 : 0;
        const len     = long ? (0.06 + Math.random() * 0.08) : (0.015 + Math.random() * 0.025);
        lenArr[i]     = len;
        vel[i]        = long ? (0.014 + Math.random() * 0.012) : (0.010 + Math.random() * 0.010);

        // Điểm trên của giọt
        positions[i*6]   = x;
        positions[i*6+1] = y;
        positions[i*6+2] = 0;
        // Điểm dưới: nghiêng theo windX hiện tại
        positions[i*6+3] = x + windX * len * 12;
        positions[i*6+4] = y - len;
        positions[i*6+5] = 0;
      };

      for (let i = 0; i < COUNT; i++) reset(i, false);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(0.85, 0.93, 1.0),
        transparent: true, opacity: 0.75, depthWrite: false
      });

      const lines = addObj(new THREE.LineSegments(geo, mat));
      lines.userData = { positions, vel, lenArr, isLong, COUNT, reset, windX: { val: windX } };
    },
    update(t) {
      const o = sceneObjects[0]; if (!o) return;
      const { positions, vel, lenArr, COUNT, reset, windX } = o.userData;

      // Gió thay đổi chậm theo sin — lúc nghiêng trái, lúc nghiêng phải
      windX.val = Math.sin(t * 0.18) * 0.012;

      for (let i = 0; i < COUNT; i++) {
        const dy  = vel[i];
        const dx  = windX.val; // drift ngang theo gió

        // Di chuyển cả 2 điểm
        positions[i*6]   += dx;
        positions[i*6+1] -= dy;
        positions[i*6+3] += dx;
        positions[i*6+4] -= dy;

        // Cập nhật góc nghiêng của giọt theo gió hiện tại
        const len = lenArr[i];
        positions[i*6+3] = positions[i*6] + windX.val * len * 12;
        positions[i*6+4] = positions[i*6+1] - len;

        // Reset khi ra ngoài màn hình
        if (positions[i*6+4] < -1.3 || positions[i*6] > 1.4 || positions[i*6] < -1.4) {
          reset(i, true);
        }
      }
      o.geometry.attributes.position.needsUpdate = true;
    },
  },

// ── TUYẾT — bông tuyết xoay khi rơi ─────────────────────
  snow: {
    label: 'Tuyết', icon: '❄️',
    init() {
      scene.background = new THREE.Color(0x08101a);
      document.body.style.background = '';
      // Lớp 1: hạt tròn
      const N1=200,g1=new THREE.BufferGeometry();
      const p1=new Float32Array(N1*3),s1=new Float32Array(N1),ph1=new Float32Array(N1),v1=new Float32Array(N1);
      for(let i=0;i<N1;i++){
        p1[i*3]=(Math.random()-.5)*2.4;p1[i*3+1]=Math.random()*2.4-1.2;p1[i*3+2]=0;
        s1[i]=Math.random()*10+5;ph1[i]=Math.random()*Math.PI*2;v1[i]=.0008+Math.random()*.002;
      }
      g1.setAttribute('position',new THREE.BufferAttribute(p1,3));
      g1.setAttribute('size',new THREE.BufferAttribute(s1,1));
      const m1=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
        uniforms:{uTime:{value:0}},
        vertexShader:`attribute float size;uniform float uTime;
          void main(){gl_PointSize=size;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`void main(){vec2 uv=gl_PointCoord-.5;float d=length(uv)*2.;
          float a=1.-smoothstep(.5,1.,d);float c=1.-smoothstep(0.,.35,d);
          vec3 col=mix(vec3(.75,.88,1.),vec3(1.),c);gl_FragColor=vec4(col,a*.9);}`});
      const snow1=addObj(new THREE.Points(g1,m1));snow1.userData={mat:m1,pos:p1,phase:ph1,vel:v1,N:N1};

      // Lớp 2: bông tuyết 6 cánh — XoAY theo thời gian
      const N2=80,g2=new THREE.BufferGeometry();
      const p2=new Float32Array(N2*3),s2=new Float32Array(N2),ph2=new Float32Array(N2);
      const v2=new Float32Array(N2),rot=new Float32Array(N2),rotSpd=new Float32Array(N2);
      for(let i=0;i<N2;i++){
        p2[i*3]=(Math.random()-.5)*2.4;p2[i*3+1]=Math.random()*2.4-1.2;p2[i*3+2]=0;
        s2[i]=Math.random()*18+12;ph2[i]=Math.random()*Math.PI*2;
        v2[i]=.0004+Math.random()*.001;
        rot[i]=Math.random()*Math.PI*2;           // góc ban đầu
        rotSpd[i]=(Math.random()<.5?1:-1)*(.03+Math.random()*.05); // tốc độ xoay rõ ràng hơn
      }
      g2.setAttribute('position',new THREE.BufferAttribute(p2,3));
      g2.setAttribute('size',new THREE.BufferAttribute(s2,1));
      // rotation attribute để truyền vào shader
      g2.setAttribute('rotation',new THREE.BufferAttribute(rot,1));

      const m2=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
        uniforms:{uTime:{value:0}},
        vertexShader:`attribute float size;attribute float rotation;varying float vRot;uniform float uTime;
          void main(){vRot=rotation;gl_PointSize=size;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying float vRot;
          void main(){
            vec2 uv=gl_PointCoord-.5;
            // Xoay UV theo vRot
            float c=cos(vRot),s=sin(vRot);
            vec2 ruv=vec2(c*uv.x-s*uv.y,s*uv.x+c*uv.y);
            float angle=atan(ruv.y,ruv.x);
            float r=length(ruv);
            float petal=abs(cos(angle*3.));
            float shape=step(r,petal*.45);
            float inner=step(r,petal*.22)*step(.08,r);
            float axis=max(
              exp(-abs(ruv.x*cos(0.)-ruv.y*sin(0.))*40.),
              max(exp(-abs(ruv.x*cos(1.047)-ruv.y*sin(1.047))*40.),
                  exp(-abs(ruv.x*cos(2.094)-ruv.y*sin(2.094))*40.))
            )*step(r,.46);
            float alpha=clamp(shape+inner*.5+axis*.7,0.,1.)*step(r,.48);
            vec3 col=mix(vec3(.7,.88,1.),vec3(1.),1.-r*2.);
            gl_FragColor=vec4(col,alpha*.88);}`});
      const snow2=addObj(new THREE.Points(g2,m2));
      snow2.userData={mat:m2,pos:p2,phase:ph2,vel:v2,N:N2,rot,rotSpd};
    },
    update(t){
      sceneObjects.forEach(o=>{
        if(!o.userData.pos)return;
        const{mat,pos,phase,vel,N}=o.userData;
        if(mat)mat.uniforms.uTime.value=t;
        // Xoay bông tuyết
        if(o.userData.rot){
          const{rot,rotSpd}=o.userData;
          for(let i=0;i<N;i++) rot[i]+=rotSpd[i];
          o.geometry.attributes.rotation.needsUpdate=true;
        }
        for(let i=0;i<N;i++){
          pos[i*3+1]-=vel[i];
          pos[i*3]+=Math.sin(t*.6+phase[i])*.0006;
          if(pos[i*3+1]<-1.25){pos[i*3+1]=1.25;pos[i*3]=(Math.random()-.5)*2.4;}
        }
        o.geometry.attributes.position.needsUpdate=true;
      });
    },
  },
};

function clearScene() {
  if (EFFECTS[currentEffect] && EFFECTS[currentEffect].cleanup) {
    EFFECTS[currentEffect].cleanup();
  }
  sceneObjects.forEach(o => {
    scene.remove(o);
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  sceneObjects = [];
}

function setEffect(name) {
  clearScene();
  currentEffect = name;
  clock.start();
  if (EFFECTS[name]) EFFECTS[name].init();
  document.querySelectorAll('.bg-option').forEach(b => {
    b.classList.toggle('active', b.dataset.effect === name);
  });
  localStorage.setItem('focusroom_bg', name);
}

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  if (EFFECTS[currentEffect]) EFFECTS[currentEffect].update(t);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => renderer.setSize(window.innerWidth, window.innerHeight, true));

// ===== UI =====
const toggleBtn   = document.getElementById('bgToggleBtn');
const switcher    = document.getElementById('bgSwitcher');
const optionPanel = document.getElementById('bgOptionPanel');

toggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  optionPanel.classList.toggle('open');
  toggleBtn.classList.toggle('active');
});

document.addEventListener('click', (e) => {
  if (!switcher.contains(e.target)) {
    optionPanel.classList.remove('open');
    toggleBtn.classList.remove('active');
  }
});

document.querySelectorAll('.bg-option').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setEffect(btn.dataset.effect);
    optionPanel.classList.remove('open');
    toggleBtn.classList.remove('active');
  });
});

const savedBg = localStorage.getItem('focusroom_bg') || 'none';
setEffect(savedBg);
console.log('bg.js started | effect:', savedBg);
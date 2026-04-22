// ============================================================
// bg.js — Background Effects + Custom Color
// ============================================================

import * as THREE from 'three';

// ===== RENDERER =====
const canvas   = document.querySelector('#bgCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight, true);

const scene  = new THREE.Scene();
scene.background = new THREE.Color(0x1a0f0a);
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

let currentEffect = 'none';
let sceneObjects  = [];
let clock         = new THREE.Clock();

function addObj(obj) { scene.add(obj); sceneObjects.push(obj); return obj; }

// ===== EFFECTS =====
const EFFECTS = {

  // ── NONE ────────────────────────────────────────────────
  none: {
    label: 'Mặc định', icon: '◯',
    init() { scene.background = new THREE.Color(0x1a0f0a); },
    update() {},
  },

  // ── VŨ TRỤ ──────────────────────────────────────────────
  space: {
    label: 'Vũ trụ', icon: '🌌',
    init() {
      scene.background = new THREE.Color(0x00000f);
      const N1 = 1500, g1 = new THREE.BufferGeometry();
      const p1 = new Float32Array(N1*3), c1 = new Float32Array(N1*3), s1 = new Float32Array(N1);
      for (let i = 0; i < N1; i++) {
        p1[i*3]=(Math.random()-.5)*2.2; p1[i*3+1]=(Math.random()-.5)*2.2; p1[i*3+2]=0;
        const r=Math.random();
        if(r<.55){c1[i*3]=1;c1[i*3+1]=1;c1[i*3+2]=1;}
        else if(r<.78){c1[i*3]=.6;c1[i*3+1]=.8;c1[i*3+2]=1;}
        else{c1[i*3]=.85;c1[i*3+1]=.6;c1[i*3+2]=1;}
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
      });
    },
  },

  // ── MƯA ─────────────────────────────────────────────────
  rain: {
    label: 'Mưa', icon: '🌧',
    init() {
      scene.background = new THREE.Color(0x05080f);
      const COUNT=600,positions=new Float32Array(COUNT*6),vel=new Float32Array(COUNT),lenArr=new Float32Array(COUNT);
      const reset=(i)=>{
        const x=(Math.random()-.5)*2.6,y=1.2+Math.random()*.5,len=.03+Math.random()*.06,sl=.008;
        lenArr[i]=len;positions[i*6]=x;positions[i*6+1]=y;positions[i*6+2]=0;
        positions[i*6+3]=x-sl;positions[i*6+4]=y-len;positions[i*6+5]=0;
        vel[i]=.012+Math.random()*.018;
      };
      for(let i=0;i<COUNT;i++){reset(i);positions[i*6+1]=(Math.random()-.5)*2.2;positions[i*6+4]=positions[i*6+1]-lenArr[i];}
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
      const mat=new THREE.LineBasicMaterial({color:new THREE.Color(.85,.93,1),transparent:true,opacity:.8,depthWrite:false});
      const lines=addObj(new THREE.LineSegments(geo,mat));
      lines.userData={positions,vel,lenArr,COUNT,reset};
    },
    update(){
      const o=sceneObjects[0];if(!o)return;
      const{positions,vel,lenArr,COUNT,reset}=o.userData;const sl=.008;
      for(let i=0;i<COUNT;i++){
        const dy=vel[i];positions[i*6+1]-=dy;positions[i*6+4]-=dy;
        positions[i*6]-=sl*.3;positions[i*6+3]-=sl*.3;
        if(positions[i*6+4]<-1.2)reset(i);
      }
      o.geometry.attributes.position.needsUpdate=true;
    },
  },

  // ── TUYẾT — bông tuyết xoay khi rơi ─────────────────────
  snow: {
    label: 'Tuyết', icon: '❄️',
    init() {
      scene.background = new THREE.Color(0x08101a);
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

  // ── ĐẠI DƯƠNG ────────────────────────────────────────────
  ocean: {
    label: 'Đại dương', icon: '🌊',
    init() {
      scene.background = new THREE.Color(0x021428);
      const N1=300,g1=new THREE.BufferGeometry();
      const p1=new Float32Array(N1*3),s1=new Float32Array(N1),ph1=new Float32Array(N1),v1=new Float32Array(N1);
      for(let i=0;i<N1;i++){
        p1[i*3]=(Math.random()-.5)*2.2;p1[i*3+1]=(Math.random()-.5)*2.2;p1[i*3+2]=0;
        s1[i]=Math.random()*14+4;ph1[i]=Math.random()*Math.PI*2;v1[i]=.0015+Math.random()*.004;
      }
      g1.setAttribute('position',new THREE.BufferAttribute(p1,3));
      g1.setAttribute('size',new THREE.BufferAttribute(s1,1));
      const m1=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
        uniforms:{uTime:{value:0}},
        vertexShader:`attribute float size;uniform float uTime;
          void main(){float p=1.+.1*sin(uTime*2.+position.x*5.);gl_PointSize=size*p;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`void main(){vec2 uv=gl_PointCoord-.5;float d=length(uv)*2.;
          float rim=smoothstep(.65,.85,d)*(1.-smoothstep(.85,1.,d));
          float inner=(1.-smoothstep(0.,.65,d))*.15;
          float spec=exp(-length(uv-vec2(-.15,.15))*20.)*.8;
          vec3 col=mix(vec3(.3,.7,1.),vec3(.8,.95,1.),spec+rim*.5);
          gl_FragColor=vec4(col,rim*.85+inner+spec);}`});
      const b=addObj(new THREE.Points(g1,m1));b.userData={mat:m1,pos:p1,phase:ph1,vel:v1,N:N1};

      const N2=500,g2=new THREE.BufferGeometry();
      const p2=new Float32Array(N2*3),s2=new Float32Array(N2),ph2=new Float32Array(N2),v2=new Float32Array(N2);
      for(let i=0;i<N2;i++){
        p2[i*3]=(Math.random()-.5)*2.2;p2[i*3+1]=(Math.random()-.5)*2.2;p2[i*3+2]=0;
        s2[i]=Math.random()*3+1;ph2[i]=Math.random()*Math.PI*2;v2[i]=.0005+Math.random()*.002;
      }
      g2.setAttribute('position',new THREE.BufferAttribute(p2,3));
      g2.setAttribute('size',new THREE.BufferAttribute(s2,1));
      const m2=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
        uniforms:{uTime:{value:0}},
        vertexShader:`attribute float size;uniform float uTime;
          void main(){float t=.5+.5*sin(uTime*3.+position.x*8.+position.y*6.);gl_PointSize=size*t;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`void main(){float d=length(gl_PointCoord-.5)*2.;float a=1.-smoothstep(.3,1.,d);gl_FragColor=vec4(.4,.8,1.,a*.7);}`});
      const pl=addObj(new THREE.Points(g2,m2));pl.userData={mat:m2,pos:p2,phase:ph2,vel:v2,N:N2};
    },
    update(t){
      sceneObjects.forEach(o=>{
        if(!o.userData.pos)return;
        const{mat,pos,phase,vel,N}=o.userData;
        if(mat)mat.uniforms.uTime.value=t;
        for(let i=0;i<N;i++){
          pos[i*3+1]+=vel[i];pos[i*3]+=Math.sin(t*.4+phase[i])*.0007;
          if(pos[i*3+1]>1.2){pos[i*3+1]=-1.2;pos[i*3]=(Math.random()-.5)*2.2;}
        }
        o.geometry.attributes.position.needsUpdate=true;
      });
    },
  },

  // ── CUSTOM COLOR — gradient + dust particles ────────────
  custom: {
    label: 'Tuỳ chỉnh', icon: '🎨',
    init() {
      const saved = JSON.parse(localStorage.getItem('focusroom_bg_custom') || '{"h":20,"s":44,"l":7}'); // hsl của #1a0f0a);
      applyCustomColor(saved.h, saved.s, saved.l);
      showColorPicker(saved);

      // Thêm dust particles nhẹ để tạo chiều sâu
      const N=180, geo=new THREE.BufferGeometry();
      const pos=new Float32Array(N*3), spd=new Float32Array(N), ph=new Float32Array(N), sz=new Float32Array(N);
      for(let i=0;i<N;i++){
        pos[i*3]=(Math.random()-.5)*2.2; pos[i*3+1]=(Math.random()-.5)*2.2; pos[i*3+2]=0;
        spd[i]=.0003+Math.random()*.001; ph[i]=Math.random()*Math.PI*2; sz[i]=Math.random()*3+.5;
      }
      geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
      geo.setAttribute('size',new THREE.BufferAttribute(sz,1));
      const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
        uniforms:{uTime:{value:0}},
        vertexShader:`attribute float size;uniform float uTime;
          void main(){float t=.4+.6*sin(uTime*.8+position.x*4.+position.y*3.);
          gl_PointSize=size*t;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`void main(){float d=length(gl_PointCoord-.5)*2.;
          float a=1.-smoothstep(.3,1.,d);gl_FragColor=vec4(1.,1.,1.,a*.18);}`});
      const dust=addObj(new THREE.Points(geo,mat));
      dust.userData={mat,pos,spd,ph,N};
    },
    update(t){
      if(sceneObjects.length===0)return;
      const o=sceneObjects[0]; if(!o.userData.pos)return;
      const{mat,pos,spd,ph,N}=o.userData;
      mat.uniforms.uTime.value=t;
      for(let i=0;i<N;i++){
        pos[i*3+1]+=spd[i];
        pos[i*3]+=Math.sin(t*.3+ph[i])*.0004;
        if(pos[i*3+1]>1.15){pos[i*3+1]=-1.15;pos[i*3]=(Math.random()-.5)*2.2;}
      }
      o.geometry.attributes.position.needsUpdate=true;
    },
    cleanup() { hideColorPicker(); },
  },
};

// ===== CUSTOM COLOR PICKER =====
function hslToHex(h, s, l) {
  const c = new THREE.Color();
  c.setHSL(h/360, s/100, l/100);
  return c;
}

// Mesh quad gradient: màu chính ở trung tâm, tối hơn ở viền
let gradientMesh = null;

function applyCustomColor(h, s, l) {
  // Màu nền chính (tối)
  const base = new THREE.Color().setHSL(h/360, (s/100)*0.6, Math.max((l/100)*0.5, 0.02));
  scene.background = base;

  // Tạo/cập nhật gradient vignette quad
  if (gradientMesh) { scene.remove(gradientMesh); gradientMesh.geometry.dispose(); gradientMesh.material.dispose(); }

  const c1 = new THREE.Color().setHSL(h/360, s/100, l/100);          // tâm sáng hơn
  const c2 = new THREE.Color().setHSL((h+30)/360, s/100*0.7, l/100*0.3); // viền hơi lệch màu
  const geo = new THREE.PlaneGeometry(2, 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uC1: {value: c1}, uC2: {value: c2} },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `uniform vec3 uC1;uniform vec3 uC2;varying vec2 vUv;
      void main(){
        vec2 uv=vUv*2.-1.;
        float d=length(uv);
        // Gradient tâm → viền
        float t=smoothstep(0.,.85,d);
        vec3 col=mix(uC1,uC2,t);
        // Vignette thêm
        float vig=1.-smoothstep(.4,1.2,d)*.5;
        gl_FragColor=vec4(col*vig,1.);
      }`
  });
  gradientMesh = new THREE.Mesh(geo, mat);
  gradientMesh.renderOrder = -1;
  scene.add(gradientMesh);
}

function showColorPicker(vals) {
  const panel = document.getElementById('colorPickerPanel');
  panel.classList.add('open');
  document.getElementById('cpHue').value = vals.h;
  document.getElementById('cpSat').value = vals.s;
  document.getElementById('cpLit').value = vals.l;
  document.getElementById('cpHueVal').textContent = vals.h + '°';
  document.getElementById('cpSatVal').textContent = vals.s + '%';
  document.getElementById('cpLitVal').textContent = vals.l + '%';
  updatePickerPreview(vals.h, vals.s, vals.l);
}

function hideColorPicker() {
  const panel = document.getElementById('colorPickerPanel');
  if (panel) panel.classList.remove('open');
}

function updatePickerPreview(h, s, l) {
  document.getElementById('cpPreview').style.background = `hsl(${h},${s}%,${l}%)`;
}

// Gán event color picker
['cpHue','cpSat','cpLit'].forEach(id => {
  const el  = document.getElementById(id);
  const val = document.getElementById(id+'Val');
  el.addEventListener('input', () => {
    const h = +document.getElementById('cpHue').value;
    const s = +document.getElementById('cpSat').value;
    const l = +document.getElementById('cpLit').value;
    val.textContent = el.value + (id === 'cpHue' ? '°' : '%');
    applyCustomColor(h, s, l);
    updatePickerPreview(h, s, l);
    localStorage.setItem('focusroom_bg_custom', JSON.stringify({h,s,l}));
  });
});

// ===== SWITCH =====
function clearScene() {
  if (EFFECTS[currentEffect]?.cleanup) EFFECTS[currentEffect].cleanup();
  sceneObjects.forEach(o => {
    scene.remove(o);
    if(o.geometry)o.geometry.dispose();
    if(o.material)o.material.dispose();
  });
  sceneObjects = [];
  // Xoá gradient mesh nếu tồn tại
  if (gradientMesh) {
    scene.remove(gradientMesh);
    gradientMesh.geometry.dispose();
    gradientMesh.material.dispose();
    gradientMesh = null;
  }
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

// ===== RENDER LOOP =====
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  if (EFFECTS[currentEffect]) EFFECTS[currentEffect].update(t);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => renderer.setSize(window.innerWidth, window.innerHeight, true));

// ===== UI =====
const toggleBtn     = document.getElementById('bgToggleBtn');
const switcher      = document.getElementById('bgSwitcher');
const optionPanel   = document.getElementById('bgOptionPanel');
const colorPanel    = document.getElementById('colorPickerPanel');

function closePanels() {
  optionPanel.classList.remove('open');
  toggleBtn.classList.remove('active');
  hideColorPicker();
}

toggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const opening = !optionPanel.classList.contains('open');
  optionPanel.classList.toggle('open');
  toggleBtn.classList.toggle('active');
  // Đóng color picker khi đóng option panel
  if (!opening) hideColorPicker();
});

// Click ngoài cả 2 panel → đóng hết
document.addEventListener('click', (e) => {
  const inSwitcher = switcher.contains(e.target);
  const inColorPanel = colorPanel.contains(e.target);
  if (!inSwitcher && !inColorPanel) {
    closePanels();
  }
});

// Reset về default
document.getElementById('cpResetBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const def = {h:20, s:44, l:7}; // màu nền mặc định app #1a0f0a
  localStorage.setItem('focusroom_bg_custom', JSON.stringify(def));
  showColorPicker(def);
  applyCustomColor(def.h, def.s, def.l);
});

document.querySelectorAll('.bg-option').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setEffect(btn.dataset.effect);
    // Chỉ giữ option panel mở khi chọn custom (để xem color picker)
    if (btn.dataset.effect !== 'custom') {
      optionPanel.classList.remove('open');
      toggleBtn.classList.remove('active');
    }
  });
});

// ===== INIT =====
const savedBg = localStorage.getItem('focusroom_bg') || 'none';
setEffect(savedBg);
console.log('🎨 bg.js | effect:', savedBg);
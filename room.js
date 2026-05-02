// ============================================================
// room.js — Render căn phòng GLB làm background
// Controls: giữ chuột trái để xoay, scroll để zoom
// ============================================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { setupLighting, enableModelShadow, updateLightTarget } from "./lighting.js";

// ===== PATH =====
const GLB_PATH = './gkuet.glb';

// ===== RENDERER =====
const canvas = document.querySelector('#roomCanvas');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, true);
renderer.setClearColor(0x000000, 0); // alpha=0: trong suốt hoàn toàn → gradient CSS hiện qua
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;

// ===== SCENE =====
const scene = new THREE.Scene();

// ===== CAMERA =====
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);
camera.position.set(6.35, 2.45, 30);

// ===== ÁNH SÁNG — dùng lighting.js =====
setupLighting(scene, renderer);

// ===== CAMERA ORBIT STATE =====
// Dùng spherical coordinates để xoay quanh target
let target  = new THREE.Vector3(6.35, 2.45, 0); // điểm nhìn
let radius  = 25;     // khoảng cách camera → target (zoom)
let theta   = 0;      // góc ngang (azimuth), radian
let phi     = 0.1;    // góc dọc (polar), radian — 0=nhìn thẳng

// Giới hạn xoay và zoom
const PHI_MIN    = -0.5;   // không xoay quá lên trên
const PHI_MAX    =  0.5;   // không xoay quá xuống dưới
const THETA_MIN  = -0.6;   // giới hạn xoay trái
const THETA_MAX  =  0.6;   // giới hạn xoay phải
const RADIUS_MIN =  4;     // zoom in tối đa
const RADIUS_MAX = 35;     // zoom out tối đa

// Tốc độ
const ROTATE_SPEED = 0.005; // radian / pixel kéo chuột
const ZOOM_SPEED   = 1.5;   // đơn vị / scroll tick
const EASE         = 0.1;   // easing mượt (0=đứng im, 1=tức thì)

// Target values (eased dần về đây)
let tTheta  = theta;
let tPhi    = phi;
let tRadius = radius;

// ===== ZOOM INTRO =====
let isZooming  = false;
let zoomStart  = 0;
const ZOOM_DUR = 2200;

// ===== MOUSE DRAG =====
let isDragging  = false;
let lastMouseX  = 0;
let lastMouseY  = 0;

// Chỉ lắng nghe drag trên canvas background (z-index 0)
// pointer-events: none trên canvas nên dùng window với check
canvas.style.pointerEvents = 'auto'; // bật tạm để nhận drag

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; // chỉ chuột trái
  isDragging = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  canvas.style.cursor = 'grabbing';
  e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  // Cập nhật target theta/phi
  tTheta -= dx * ROTATE_SPEED;
  tPhi   += dy * ROTATE_SPEED;

  // Clamp giới hạn xoay
  tTheta = Math.max(THETA_MIN, Math.min(THETA_MAX, tTheta));
  tPhi   = Math.max(PHI_MIN,   Math.min(PHI_MAX,   tPhi));
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  canvas.style.cursor = 'default';
});

// ===== SCROLL ZOOM =====
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  // deltaY dương = scroll xuống = zoom out (radius tăng)
  tRadius += e.deltaY * 0.01 * ZOOM_SPEED;
  tRadius = Math.max(RADIUS_MIN, Math.min(RADIUS_MAX, tRadius));
}, { passive: false });

// ===== TOUCH SUPPORT =====
let lastTouchDist = 0;
let lastTouchX = 0;
let lastTouchY = 0;

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    isDragging = false;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    lastTouchDist = Math.sqrt(dx*dx + dy*dy);
  }
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1 && isDragging) {
    const dx = e.touches[0].clientX - lastTouchX;
    const dy = e.touches[0].clientY - lastTouchY;
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
    tTheta -= dx * ROTATE_SPEED;
    tPhi   += dy * ROTATE_SPEED;
    tTheta = Math.max(THETA_MIN, Math.min(THETA_MAX, tTheta));
    tPhi   = Math.max(PHI_MIN,   Math.min(PHI_MAX,   tPhi));
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    tRadius += (lastTouchDist - dist) * 0.05;
    tRadius = Math.max(RADIUS_MIN, Math.min(RADIUS_MAX, tRadius));
    lastTouchDist = dist;
  }
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', () => { isDragging = false; });

// ===== LOAD GLB =====
const loader = new GLTFLoader();

loader.load(
  GLB_PATH,
  (gltf) => {
    scene.add(gltf.scene);

    const box    = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());

    // Bật shadow
    enableModelShadow(gltf.scene);

    // Đặt spotlight đúng trên tâm model thực
    updateLightTarget(center);

    // Convert material để nhận ánh sáng
    gltf.scene.traverse((child) => {
      if (!child.isMesh) return;
      const mats = Array.isArray(child.material)
        ? child.material
        : [child.material];

      const converted = mats.map((mat) => {
        if (!mat.isMeshBasicMaterial) return mat; // giữ nguyên nếu không phải Basic
        const std = new THREE.MeshStandardMaterial({
          color:       mat.color,
          map:         mat.map       ?? null,
          transparent: mat.transparent,
          opacity:     mat.opacity,
          side:        mat.side,
          roughness:   0.85,
          metalness:   0.05,
        });
        mat.dispose();
        return std;
      });

      child.material = Array.isArray(child.material) ? converted : converted[0];
      child.material.needsUpdate = true;
    });

    // Cập nhật camera target
    target.copy(center);

    // Zoom intro: bắt đầu từ xa
    tRadius   = 8;         // vị trí cuối sau zoom
    radius    = 30;        // bắt đầu xa
    tRadius   = 8;

    zoomStart = performance.now();
    isZooming = true;

    console.log('✅ Room loaded | size:', size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2));
    console.log('   Center:', center.x.toFixed(2), center.y.toFixed(2), center.z.toFixed(2));
  },
  undefined,
  (err) => console.error('❌ Load error:', err?.message || err)
);

// ===== EASING =====
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ===== RESIZE =====
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight, true);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ===== RENDER LOOP =====
function animate() {
  requestAnimationFrame(animate);

  // Zoom intro animation (radius từ xa → gần)
  if (isZooming) {
    const t = Math.min((performance.now() - zoomStart) / ZOOM_DUR, 1);
    radius = 30 + (8 - 30) * easeOutCubic(t);
    if (t >= 1) {
      isZooming = false;
      radius = 8;
      tRadius = 8;
    }
  } else {
    // Easing mượt radius về target
    radius += (tRadius - radius) * EASE;
  }

  // Easing mượt theta/phi về target
  theta += (tTheta - theta) * EASE;
  phi   += (tPhi   - phi)   * EASE;

  // Spherical → Cartesian: tính vị trí camera từ target
  // phi=0: nhìn ngang, phi>0: nhìn từ trên xuống
  camera.position.x = target.x + radius * Math.sin(theta) * Math.cos(phi);
  camera.position.y = target.y + radius * Math.sin(phi);
  camera.position.z = target.z + radius * Math.cos(theta) * Math.cos(phi);
  camera.lookAt(target);

  renderer.render(scene, camera);
}

animate();
console.log('🎬 room.js started');

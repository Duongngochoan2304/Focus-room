// ============================================================
// lighting.js — Hệ thống ánh sáng cho Focus Room
// Visual: phòng tối cozy, spotlight từ trần chiếu xuống
// ============================================================

import * as THREE from "three";

// Export mainLight ra ngoài để room.js update target sau khi load GLB
export let mainLight = null;

export function setupLighting(scene, renderer) {

  // =====================================================
  // RENDERER SHADOW
  // =====================================================

  renderer.shadowMap.enabled = true;                // bật shadow
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // shadow mềm, không răng cưa


  // =====================================================
  // AMBIENT LIGHT — ánh sáng phụ nền
  // Giữ phòng không bị tối đen hoàn toàn
  // =====================================================

  const ambientLight = new THREE.AmbientLight(
    0xffd6f0, // MÀU ÁNH SÁNG PHỤ — đổi màu tại đây
              // gợi ý: 0xffe6c4 vàng ấm | 0xffd6f0 tím hồng | 0xffffff trắng
    0.5       // CƯỜNG ĐỘ ÁNH SÁNG PHỤ — tăng giảm tại đây
              // 0.0 = tối hoàn toàn | 0.5 = sáng vừa | 1.0+ = sáng nhiều
  );
  scene.add(ambientLight);


  // =====================================================
  // MAIN CEILING SPOTLIGHT — đèn trần chính
  // Hình nón sáng từ trên chiếu xuống như đèn đường / spotlight sân khấu
  // Trung tâm sáng rõ, càng ra xa càng tối dần
  // =====================================================

  mainLight = new THREE.SpotLight(
    0xfff2cc,    // MÀU ÁNH SÁNG CHÍNH — đổi màu tại đây
                 // gợi ý: 0xfff2cc vàng ấm | 0xffffff trắng | 0xffe0b2 cam nhẹ

    2,           // CƯỜNG ĐỘ ÁNH SÁNG — tăng giảm tại đây
                 // 2 = yếu | 5 = vừa | 10 = rất sáng

    10,          // KHOẢNG CÁCH CHIẾU XA — ánh sáng đi được bao xa (world units)
                 // 10 = gần | 25 = vừa | 50 = rất xa

    Math.PI / 3, // ĐỘ TO CỦA VÒNG TRÒN HẮT XUỐNG NỀN (góc hình nón, radians)
                 // Math.PI / 8  (~22°) = vòng nhỏ, tập trung
                 // Math.PI / 6  (~30°) = vòng vừa  <-- hiện tại
                 // Math.PI / 4  (~45°) = vòng rộng
                 // Math.PI / 3  (~60°) = rất rộng

    0.4,         // ĐỘ MỀM CỦA MÉP ÁNH SÁNG (penumbra)
                 // 0.0 = mép cứng, rõ nét
                 // 0.4 = mép mờ dần tự nhiên  <-- hiện tại
                 // 1.0 = mép rất mờ

    2          // SUY GIẢM ÁNH SÁNG (decay)
                 // 1 = suy giảm tuyến tính
                 // 2 = suy giảm vật lý thực (chuẩn)
  );

  // TOẠ ĐỘ ĐÈN TRẦN — placeholder, sẽ được update sau khi load GLB
  // room.js sẽ gọi updateLightTarget(center) để đặt đèn đúng trên model
  mainLight.position.set(
    0,  // X: trái (-) / phải (+)
    8,  // Y: cao thấp — nên để cao hơn model (thường 6–12)
    0   // Z: trước (+) / sau (-)
  );

  // ĐIỂM ĐÈN CHIẾU TỚI — placeholder, được cập nhật sau khi load GLB
  mainLight.target.position.set(0, 0, 0);
  scene.add(mainLight.target);

  // BẬT BÓNG ĐỔ cho spotlight
  mainLight.castShadow            = true;
  mainLight.shadow.mapSize.width  = 2048; // tăng để bóng nét hơn (512/1024/2048/4096)
  mainLight.shadow.mapSize.height = 2048;
  mainLight.shadow.camera.near    = 0.5;
  mainLight.shadow.camera.far     = 35;
  mainLight.shadow.bias           = -0.001; // tránh shadow acne

  scene.add(mainLight);
}


// ============================================================
// updateLightTarget — gọi sau khi load GLB xong
// Đặt đèn ngay trên tâm model, chiếu thẳng xuống
// ============================================================

export function updateLightTarget(center) {
  if (!mainLight) return;

  // TOẠ ĐỘ ĐÈN — đặt ngay trên tâm model
  mainLight.position.set(
    center.x,       // X: bằng tâm model
    center.y + 1,   // Y: cao hơn tâm 8 đơn vị — chỉnh con số này nếu muốn đèn cao/thấp hơn
    center.z        // Z: bằng tâm model
  );

  // ĐIỂM CHIẾU TỚI — chính giữa model
  mainLight.target.position.set(center.x, center.y, center.z);
  mainLight.target.updateMatrixWorld(); // bắt buộc sau khi đổi target position

  // Cập nhật shadow camera theo vị trí mới
  mainLight.shadow.camera.updateProjectionMatrix();
}


// ============================================================
// enableModelShadow — bật bóng đổ cho toàn bộ mesh trong model
// Gọi sau khi load GLB xong: enableModelShadow(gltf.scene)
// ============================================================

export function enableModelShadow(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow    = true; // model đổ bóng lên các vật khác
      child.receiveShadow = true; // model nhận bóng từ các vật khác
    }
  });
}
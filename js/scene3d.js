// Procedural 3D Cranial Nerve Exam Patient & Extraocular Muscle Biomechanics Engine (Three.js)
// Coordinate convention: Patient faces +Z toward examiner.
// Patient's RIGHT (OD) = -X (viewer's left). Patient's LEFT (OS) = +X (viewer's right).

window.CNScene3D = (function () {
  class SimulatorScene {
    constructor(container, onTelemetry) {
      this.container = container;
      this.onTelemetry = onTelemetry || function () {};
      this.clock = new THREE.Clock();

      // Active exam & pathology state (NORMAL by default!)
      this.pathology = {};
      this.activeTool = 'finger'; // 'finger' | 'penlight' | 'orbit'
      this.xrayMode = false;
      this.liftRightLid = false;
      this.liftLeftLid = false;
      this.showDermatomes = false;

      // Target gaze in normalized [-1, 1] examiner-relative coordinates:
      // gazeX > 0 => patient's LEFT (+X); gazeX < 0 => patient's RIGHT (-X)
      // gazeY > 0 => UP (+Y); gazeY < 0 => DOWN (-Y)
      this.targetGaze = { x: 0, y: 0, convergence: 0 };
      this.autoHActive = false;
      this.autoHT = 0;

      // Penlight state
      this.penlightOn = false;
      this.penlightSide = null; // 'right' | 'left' | null
      this.penlightPos = new THREE.Vector3(0, 0.32, 2.2);
      this.swingActive = false;
      this.swingTimer = 0;

      // Pupil diameters (mm)
      this.pupilRightMm = 3.5;
      this.pupilLeftMm = 3.5;

      // Head tilt (degrees: >0 = tilt to patient's RIGHT, <0 = tilt to patient's LEFT)
      this.headTiltDeg = 0;
      this.targetHeadTiltDeg = 0;
      this.headYawDeg = 0;
      this.targetHeadYawDeg = 0;

      // HINTS exam state (Head Impulse, Nystagmus, Test of Skew / cover test)
      this.hit = null;            // { dir: +1 (head to patient's LEFT) | -1 (to RIGHT), t }
      this.hitHeadYawDeg = 0;
      this.hitTimeScale = 0.4;    // slow-motion factor so the catch-up saccade is easy to see
      this.vorOffset = 0;
      this.nystagmusOffset = { yaw: 0, pitch: 0 };
      this.coverMode = 'none';    // 'none' | 'right' | 'left' | 'alternate'
      this.coveredEye = null;     // 'right' | 'left' | null (resolved each frame)
      this.coverTimer = 0;
      this.coverX = 0;

      // Facial / Oral / Neck maneuver states
      this.maneuver = {
        raiseBrows: 0,
        squeezeEyes: 0,
        smile: 0,
        jawOpen: 0,
        sayAhh: 0,
        tongueOut: 0,
        shrug: 0,
        blinkRight: 0,
        blinkLeft: 0
      };
      this.autoBlinkTimer = 2.8;

      // Camera orbit parameters
      this.camSpherical = { theta: 0, phi: Math.PI / 2 - 0.04, radius: 4.45 };
      this.camTarget = new THREE.Vector3(0, 0.16, 0);
      this.desiredCam = {
        theta: 0,
        phi: Math.PI / 2 - 0.04,
        radius: 4.45,
        target: new THREE.Vector3(0, 0.16, 0)
      };

      // Pointer drag state
      this.isPointerDown = false;
      this.isRightDrag = false;
      this.lastPointer = { x: 0, y: 0 };

      // Live EOM telemetry
      this.eomActivity = {
        right: { LR: 0, MR: 0, SR: 0, IR: 0, SO: 0, IO: 0 },
        left: { LR: 0, MR: 0, SR: 0, IR: 0, SO: 0, IO: 0 }
      };
      this.eyeAngles = {
        right: { yaw: 0, pitch: 0, roll: 0 },
        left: { yaw: 0, pitch: 0, roll: 0 }
      };

      // Smooth lip smile/open interpolation values
      this._curJawOpen = 0;
      this._curSmileR = 0;
      this._curSmileL = 0;
      this._curDroopR = 0;
      this._curDroopL = 0;

      this._initRenderer();
      this._initLights();
      this._buildPatient();
      this._buildTools();
      this._bindEvents();
      this._animate();
    }

    _initRenderer() {
      const w = this.container.clientWidth || 800;
      const h = this.container.clientHeight || 600;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x090f1a);
      this.scene.fog = new THREE.FogExp2(0x090f1a, 0.042);

      this.camera = new THREE.PerspectiveCamera(33, w / h, 0.1, 60);
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.0;

      this.container.innerHTML = '';
      this.container.appendChild(this.renderer.domElement);
    }

    _initLights() {
      const hemi = new THREE.HemisphereLight(0xfff6ee, 0x3b2a24, 0.62);
      this.scene.add(hemi);

      const key = new THREE.DirectionalLight(0xfff1e2, 1.22);
      key.position.set(2.4, 3.4, 4.6);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.bias = -0.0006;
      key.shadow.normalBias = 0.02;
      this.scene.add(key);

      const fill = new THREE.DirectionalLight(0xffe6d5, 0.38);
      fill.position.set(-3.0, 1.4, 3.2);
      this.scene.add(fill);

      const rim = new THREE.DirectionalLight(0x7dd3fc, 0.32);
      rim.position.set(0, 2.2, -3.8);
      this.scene.add(rim);

      // Penlight spotlight
      this.penSpot = new THREE.SpotLight(0xfffbeb, 0, 5.5, Math.PI / 11, 0.45, 1.5);
      this.penSpot.position.set(0, 0.32, 2.2);
      this.penSpotTarget = new THREE.Object3D();
      this.penSpotTarget.position.set(0, 0.32, 0.8);
      this.scene.add(this.penSpot);
      this.scene.add(this.penSpotTarget);
      this.penSpot.target = this.penSpotTarget;

      // Dedicated subtle oropharynx exam light (activates when mouth opens so palate/uvula/tongue shine clearly!)
      this.oralLight = new THREE.PointLight(0xfff1f2, 0, 2.2, 2.0);
      this.oralLight.position.set(0, -0.22, 1.35);
      this.scene.add(this.oralLight);
    }

    _createIrisTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      const cx = 256, cy = 256, r = 246;

      const bg = ctx.createRadialGradient(cx, cy, 42, cx, cy, r);
      bg.addColorStop(0.0, '#1e3a5f');
      bg.addColorStop(0.30, '#2563eb');
      bg.addColorStop(0.62, '#3b82f6');
      bg.addColorStop(0.84, '#1d4ed8');
      bg.addColorStop(0.95, '#0f172a');
      bg.addColorStop(1.0, '#090d16');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 240; i++) {
        const a = (i / 240) * Math.PI * 2;
        const len = 100 + Math.random() * 130;
        ctx.strokeStyle = i % 3 === 0 ? 'rgba(186,230,253,0.32)' : 'rgba(15,23,42,0.22)';
        ctx.lineWidth = 1 + Math.random() * 1.6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 46, cy + Math.sin(a) * 46);
        ctx.lineTo(cx + Math.cos(a + (Math.random() - 0.5) * 0.04) * (46 + len), cy + Math.sin(a + (Math.random() - 0.5) * 0.04) * (46 + len));
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(217, 169, 98, 0.34)';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(cx, cy, 108, 0, Math.PI * 2);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }

    _createScleraTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 256);

      const grad = ctx.createLinearGradient(0, 0, 512, 0);
      grad.addColorStop(0, 'rgba(244,180,180,0.20)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0)');
      grad.addColorStop(1, 'rgba(244,180,180,0.20)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = 'rgba(220, 95, 95, 0.14)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 32; i++) {
        ctx.beginPath();
        let x = Math.random() * 512;
        let y = 30 + Math.random() * 196;
        ctx.moveTo(x, y);
        for (let s = 0; s < 4; s++) {
          x += (Math.random() - 0.5) * 32;
          y += (Math.random() - 0.5) * 18;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }

    _buildPatient() {
      const SKIN_HEX = 0xd49c7c;
      this.patientRoot = new THREE.Group();
      this.scene.add(this.patientRoot);

      this.skinMaterials = [];

      // Head uses vertexColors so the recessed inner mouth opening shades naturally into dark throat cavity!
      const headSkinMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        vertexColors: true,
        roughness: 0.62,
        metalness: 0.03,
        transparent: true,
        opacity: 1.0
      });
      this.skinMaterials.push(headSkinMat);

      const skinMat = new THREE.MeshStandardMaterial({
        color: SKIN_HEX,
        roughness: 0.62,
        metalness: 0.03,
        transparent: true,
        opacity: 1.0
      });
      this.skinMaterials.push(skinMat);

      const lipMat = new THREE.MeshStandardMaterial({
        color: 0xa95a52,
        roughness: 0.48,
        metalness: 0.02,
        transparent: true,
        opacity: 1.0
      });
      this.skinMaterials.push(lipMat);

      const hairMat = new THREE.MeshStandardMaterial({
        color: 0x3a2a20,
        roughness: 0.84,
        transparent: true,
        opacity: 1.0
      });
      this.skinMaterials.push(hairMat);

      const scrubMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a5f,
        roughness: 0.78,
        metalness: 0.05,
        transparent: true,
        opacity: 1.0
      });
      this.skinMaterials.push(scrubMat);

      // === TORSO & SHOULDERS (CN XI Trapezius elevation) ===
      this.torsoGroup = new THREE.Group();
      this.torsoGroup.position.set(0, -1.62, -0.05);
      this.patientRoot.add(this.torsoGroup);

      const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.10, 1.32, 32), scrubMat);
      chest.scale.set(1.36, 1.0, 0.62);
      chest.position.y = -0.35;
      this.torsoGroup.add(chest);

      // Right Shoulder (-X)
      this.rightShoulder = new THREE.Group();
      this.rightShoulder.position.set(-1.10, 0.16, 0);
      const rShMesh = new THREE.Mesh(new THREE.SphereGeometry(0.40, 24, 20), scrubMat);
      rShMesh.scale.set(1.24, 0.76, 0.90);
      this.rightShoulder.add(rShMesh);
      this.rightTrapMat = new THREE.MeshStandardMaterial({ color: SKIN_HEX, roughness: 0.62, transparent: true, opacity: 1 });
      this.skinMaterials.push(this.rightTrapMat);
      const rTrap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.27, 0.70, 16), this.rightTrapMat);
      rTrap.position.set(0.42, 0.14, -0.04);
      rTrap.rotation.z = -0.92;
      this.rightShoulder.add(rTrap);
      this.torsoGroup.add(this.rightShoulder);

      // Left Shoulder (+X)
      this.leftShoulder = new THREE.Group();
      this.leftShoulder.position.set(1.10, 0.16, 0);
      const lShMesh = new THREE.Mesh(new THREE.SphereGeometry(0.40, 24, 20), scrubMat);
      lShMesh.scale.set(1.24, 0.76, 0.90);
      this.leftShoulder.add(lShMesh);
      this.leftTrapMat = new THREE.MeshStandardMaterial({ color: SKIN_HEX, roughness: 0.62, transparent: true, opacity: 1 });
      this.skinMaterials.push(this.leftTrapMat);
      const lTrap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.27, 0.70, 16), this.leftTrapMat);
      lTrap.position.set(-0.42, 0.14, -0.04);
      lTrap.rotation.z = 0.92;
      this.leftShoulder.add(lTrap);
      this.torsoGroup.add(this.leftShoulder);

      // === NECK & STERNOCLEIDOMASTOID MUSCLES (CN XI) ===
      const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.92, 28), skinMat);
      neckMesh.position.set(0, -1.00, -0.06);
      this.patientRoot.add(neckMesh);

      this.rightSCMMat = new THREE.MeshStandardMaterial({ color: SKIN_HEX, roughness: 0.62, transparent: true, opacity: 1 });
      this.leftSCMMat = new THREE.MeshStandardMaterial({ color: SKIN_HEX, roughness: 0.62, transparent: true, opacity: 1 });
      this.skinMaterials.push(this.rightSCMMat, this.leftSCMMat);

      this.rightSCM = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.072, 0.90, 14), this.rightSCMMat);
      this.rightSCM.position.set(-0.24, -0.98, 0.14);
      this.rightSCM.rotation.set(0.32, 0, -0.34);
      this.patientRoot.add(this.rightSCM);

      this.leftSCM = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.072, 0.90, 14), this.leftSCMMat);
      this.leftSCM.position.set(0.24, -0.98, 0.14);
      this.leftSCM.rotation.set(0.32, 0, 0.34);
      this.patientRoot.add(this.leftSCM);

      // === HEAD PIVOT GROUP (for head yaw & Bielschowsky head tilt) ===
      this.headGroup = new THREE.Group();
      this.headGroup.position.set(0, 0.20, 0);
      this.patientRoot.add(this.headGroup);

      // Sculpted Cranium & Face Mesh. The oral cavity is a pocket pushed into the head; a skin
      // "mouth cover" built from the un-recessed surface hides it and opens only between the lips.
      const baseSkinColor = new THREE.Color(SKIN_HEX);
      const blushColor = new THREE.Color(0xc77c68);
      const shadeColor = new THREE.Color(0xa8705a);
      const darkOralColor = new THREE.Color(0x280910);
      const tmpColor = new THREE.Color();
      const v = new THREE.Vector3();

      // Deforms a unit-sphere vertex into the head shape; returns the oral-cavity darkness (0..1).
      const sculpt = (vec, withOralPocket) => {
        vec.x *= 0.80;
        vec.y *= 1.04;
        vec.z *= 0.92;
        if (vec.y < -0.10) {
          const t = Math.min(1, (-0.10 - vec.y) / 0.92);
          vec.x *= (1 - t * 0.34);
          if (vec.z > 0) vec.z *= (1 - t * 0.09);
        }
        if (Math.abs(vec.x) > 0.62 && vec.y > 0.05 && vec.y < 0.62) vec.x *= 0.965;
        // Cheekbone fullness
        if (vec.z > 0.25 && vec.y < 0.06 && vec.y > -0.34 && Math.abs(vec.x) > 0.30 && Math.abs(vec.x) < 0.70) {
          const zf = Math.exp(-Math.pow((vec.y + 0.10) / 0.22, 2)) * Math.exp(-Math.pow((Math.abs(vec.x) - 0.47) / 0.20, 2));
          vec.z += zf * 0.045;
          vec.x += Math.sign(vec.x) * zf * 0.02;
        }
        // Supraorbital brow ridge
        if (vec.z > 0.40 && vec.y > 0.24 && vec.y < 0.48 && Math.abs(vec.x) < 0.58) {
          const bf = Math.exp(-Math.pow((vec.y - 0.35) / 0.09, 2)) * Math.exp(-Math.pow(vec.x / 0.48, 2));
          vec.z += bf * 0.052;
        }
        // Orbital sockets centered at (±0.31, 0.14)
        if (vec.z > 0.35) {
          const dR = Math.hypot((vec.x + 0.31) / 0.20, (vec.y - 0.14) / 0.155);
          const dL = Math.hypot((vec.x - 0.31) / 0.20, (vec.y - 0.14) / 0.155);
          vec.z -= (Math.exp(-dR * dR * 1.55) + Math.exp(-dL * dL * 1.55)) * 0.16;
        }
        // Chin: forward mental protuberance, a little downward length, soft mentolabial sulcus
        if (vec.z > 0.2 && Math.abs(vec.x) < 0.45) {
          const cx = Math.exp(-Math.pow(vec.x / 0.27, 2));
          const chin = cx * Math.exp(-Math.pow((vec.y + 0.80) / 0.15, 2));
          vec.z += chin * 0.21;
          vec.y -= chin * 0.05;
          vec.z -= cx * Math.exp(-Math.pow((vec.y + 0.66) / 0.04, 2)) * 0.015;
        }
        // Philtrum / upper-lip fullness (gentle forward roll above the mouth)
        if (vec.z > 0.4 && Math.abs(vec.x) < 0.25) {
          vec.z += Math.exp(-Math.pow(vec.x / 0.15, 2)) * Math.exp(-Math.pow((vec.y + 0.33) / 0.08, 2)) * 0.02;
        }
        let oral = 0;
        if (withOralPocket && vec.z > 0.40 && vec.y < -0.26 && vec.y > -0.70 && Math.abs(vec.x) < 0.34) {
          const om = Math.hypot(vec.x / 0.21, (vec.y + 0.48) / 0.14);
          if (om < 1.35) {
            const fade = 1 - THREE.MathUtils.smoothstep(om, 0.8, 1.15);
            vec.z -= Math.exp(-Math.pow(om, 2.6)) * 0.34 * fade;
            oral = THREE.MathUtils.clamp(Math.exp(-Math.pow(om / 0.85, 4.0)), 0, 1);
          }
        }
        return oral;
      };
      // Subtle natural skin variation: warmer cheeks/nose, slightly darker around the eyes.
      const skinTone = (vec, out) => {
        out.copy(baseSkinColor);
        if (vec.z > 0.2) {
          const ax = Math.abs(vec.x);
          const cheek = Math.exp(-Math.pow((ax - 0.42) / 0.16, 2)) * Math.exp(-Math.pow((vec.y + 0.16) / 0.15, 2));
          const chin = Math.exp(-Math.pow(vec.x / 0.16, 2)) * Math.exp(-Math.pow((vec.y + 0.80) / 0.10, 2));
          out.lerp(blushColor, Math.min(0.45, cheek * 0.42 + chin * 0.18));
          const orbit = Math.exp(-Math.pow(Math.hypot((ax - 0.31) / 0.24, (vec.y - 0.12) / 0.18), 2));
          out.lerp(shadeColor, orbit * 0.30);
        }
        return out;
      };
      const buildHeadGeo = (withOralPocket) => {
        const g = new THREE.SphereGeometry(1.0, 72, 56);
        const gp = g.attributes.position;
        const cols = new Float32Array(gp.count * 3);
        for (let i = 0; i < gp.count; i++) {
          v.fromBufferAttribute(gp, i);
          const oral = sculpt(v, withOralPocket);
          gp.setXYZ(i, v.x, v.y, v.z);
          skinTone(v, tmpColor).lerp(darkOralColor, oral);
          cols[i * 3] = tmpColor.r;
          cols[i * 3 + 1] = tmpColor.g;
          cols[i * 3 + 2] = tmpColor.b;
        }
        g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
        g.computeVertexNormals();
        return g;
      };

      const headGeo = buildHeadGeo(true);
      this.headSkinMat = headSkinMat;
      this.headMesh = new THREE.Mesh(headGeo, headSkinMat);
      this.headMesh.castShadow = true;
      this.headMesh.receiveShadow = true;
      this.headGroup.add(this.headMesh);
      // Un-recessed copy (never rendered) used to build the closed-mouth skin cover.
      this._smoothHeadGeo = buildHeadGeo(false);

      // === CLEAN HIGH-HAIRLINE CAP (Strictly above forehead y >= 0.68 in front! ZERO eye overlap!) ===
      const hairGeo = new THREE.SphereGeometry(1.018, 42, 24, 0, Math.PI * 2, 0, Math.PI * 0.40);
      const hairPos = hairGeo.attributes.position;
      for (let i = 0; i < hairPos.count; i++) {
        v.fromBufferAttribute(hairPos, i);
        // Scale to match cranium slightly oversized
        v.x *= 0.82;
        v.y *= 1.055;
        v.z *= 0.935;
        hairPos.setXYZ(i, v.x, v.y, v.z);
      }
      hairGeo.computeVertexNormals();
      const hairMesh = new THREE.Mesh(hairGeo, hairMat);
      // Tilt backward by -0.48 rad (-27.5 deg): front hairline sits cleanly at y = +0.72, back covers occiput!
      hairMesh.rotation.x = -0.48;
      hairMesh.position.set(0, 0.02, -0.02);
      this.headGroup.add(hairMesh);

      // Sculpted nose: one deformed sphere (narrow bridge widening to a rounded tip) plus soft alae.
      const noseGroup = new THREE.Group();
      const noseGeo = new THREE.SphereGeometry(1, 40, 40);
      const np = noseGeo.attributes.position;
      for (let i = 0; i < np.count; i++) {
        v.fromBufferAttribute(np, i);
        // u = 0 at the root between the eyes, 1 at the base above the lip. Each ring gets an
        // explicit half-width (ax) and projection (az): a straight dorsum rising to the tip,
        // then an elliptical underside that closes back into the face.
        const u = (1 - v.y) / 2;
        const ring = Math.sqrt(Math.max(0, 1 - v.y * v.y));
        const uTip = 0.72, tipProj = 0.30;
        const under = u > uTip ? Math.sqrt(Math.max(0, 1 - Math.pow((u - uTip) / (1 - uTip), 2))) : 1;
        const tipBulb = Math.exp(-Math.pow((u - 0.78) / 0.10, 2));
        // Soft minimum of the straight dorsum line and the rounded underside -> rounded tip
        const dorsum = 0.035 + (tipProj - 0.035) * (u / 0.84);
        const kS = 0.035;
        const az = -kS * Math.log(Math.exp(-dorsum / kS) + Math.exp(-(tipProj * under) / kS)) + tipBulb * 0.012;
        const ax = (0.040 + 0.045 * u + tipBulb * 0.030) * Math.sqrt(under);
        const y = 0.20 - 0.42 * u;
        const k = ring > 1e-4 ? 1 / ring : 0;
        const x = v.x * k * ax;
        const z = v.z > 0 ? 0.86 + v.z * k * az : 0.86 + v.z * k * 0.06;
        np.setXYZ(i, x, y, z);
      }
      noseGeo.computeVertexNormals();
      const noseMesh = new THREE.Mesh(noseGeo, skinMat);
      noseMesh.castShadow = true;
      noseGroup.add(noseMesh);
      const alaGeo = new THREE.SphereGeometry(0.056, 20, 16);
      alaGeo.scale(0.85, 0.75, 1.0);
      const alaR = new THREE.Mesh(alaGeo, skinMat);
      alaR.position.set(-0.088, -0.168, 0.915);
      const alaL = alaR.clone();
      alaL.position.x = 0.068;
      noseGroup.add(alaR, alaL);
      // Nostrils: small dark ovals on the underside
      const nostrilMat = new THREE.MeshStandardMaterial({ color: 0x4a2a22, roughness: 0.9, transparent: true, opacity: 1 });
      this.skinMaterials.push(nostrilMat);
      const nostrilGeo = new THREE.SphereGeometry(0.025, 12, 8);
      nostrilGeo.scale(1.15, 0.35, 0.75);
      [-1, 1].forEach((sgn) => {
        const n = new THREE.Mesh(nostrilGeo, nostrilMat);
        n.position.set(sgn * 0.046, -0.192, 1.0);
        n.rotation.y = sgn * 0.5;
        noseGroup.add(n);
      });
      this.headGroup.add(noseGroup);

      // Ears (CN VIII landmarks)
      const earGeo = new THREE.SphereGeometry(0.165, 16, 14);
      earGeo.scale(0.36, 1.24, 0.70);
      const earR = new THREE.Mesh(earGeo, skinMat);
      earR.position.set(-0.80, 0.03, -0.05);
      earR.rotation.y = -0.22;
      const earL = new THREE.Mesh(earGeo, skinMat);
      earL.position.set(0.80, 0.03, -0.05);
      earL.rotation.y = 0.22;
      this.headGroup.add(earR, earL);

      // === EYEBROWS & FOREHEAD WRINKLES (CN VII Forehead Sparing Test!) ===
      const browMat = new THREE.MeshStandardMaterial({ color: 0x4a3426, roughness: 0.9, transparent: true, opacity: 1 });
      this.skinMaterials.push(browMat);
      this.rightBrow = this._createEyebrow(browMat, -1);
      this.leftBrow = this._createEyebrow(browMat, 1);
      this.headGroup.add(this.rightBrow, this.leftBrow);

      this.rightWrinkles = this._createForeheadWrinkles(-1);
      this.leftWrinkles = this._createForeheadWrinkles(1);
      this.headGroup.add(this.rightWrinkles, this.leftWrinkles);

      // === 3D EYEBALLS, PUPILS, EYELIDS & 12 EXTRAOCULAR MUSCLES ===
      this.irisTex = this._createIrisTexture();
      this.scleraTex = this._createScleraTexture();

      this.eyes = {
        right: this._buildEyeUnit('right', -0.31, 0.14, 0.74, skinMat),
        left: this._buildEyeUnit('left', 0.31, 0.14, 0.74, skinMat)
      };

      // === ALIGNED LIPS, OPENABLE JAW, ILLUMINATED SOFT PALATE, UVULA & TONGUE ===
      this._buildOralAndFacialRig(skinMat, lipMat);

      // === 3D TRIGEMINAL DERMATOME ZONES (V1, V2, V3) ===
      this._buildDermatomeMarkers();
    }

    _createEyebrow(mat, sideSign) {
      const group = new THREE.Group();
      const pts = [
        new THREE.Vector3(sideSign * 0.11, 0.34, 0.87),
        new THREE.Vector3(sideSign * 0.29, 0.385, 0.845),
        new THREE.Vector3(sideSign * 0.47, 0.345, 0.765)
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      // Thicker at the head of the brow, tapering to a fine tail; flattened against the skin.
      const profile = (u) => (1 - 0.65 * u) * (u < 0.08 ? 0.6 + 5 * u : 1);
      const tube = new THREE.Mesh(this._shapedTube(curve, 24, 0.026, 10, profile, 0.35), mat);
      group.add(tube);
      return group;
    }

    _createForeheadWrinkles(sideSign) {
      const group = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ color: 0x8b5a3c, transparent: true, opacity: 0 });
      for (let row = 0; row < 2; row++) {
        const y = 0.49 + row * 0.085;
        const pts = [
          new THREE.Vector3(sideSign * 0.07, y, 0.84 - row * 0.03),
          new THREE.Vector3(sideSign * 0.26, y + 0.015, 0.805 - row * 0.03),
          new THREE.Vector3(sideSign * 0.45, y - 0.01, 0.71 - row * 0.03)
        ];
        const curve = new THREE.CatmullRomCurve3(pts);
        const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.008, 6, false), mat);
        group.add(m);
      }
      group.userData.mat = mat;
      return group;
    }

    _buildEyeUnit(side, x, y, z, skinMat) {
      const sideSign = side === 'left' ? 1 : -1;
      const socket = new THREE.Group();
      socket.position.set(x, y, z);
      this.headGroup.add(socket);

      const R = 0.145;

      const globeGroup = new THREE.Group();
      socket.add(globeGroup);

      // Sclera sphere with flattened anterior chamber plane behind cornea
      const scleraGeo = new THREE.SphereGeometry(R, 32, 24);
      const sPos = scleraGeo.attributes.position;
      for (let i = 0; i < sPos.count; i++) {
        const sz = sPos.getZ(i);
        if (sz > R * 0.875) sPos.setZ(i, R * 0.875);
      }
      scleraGeo.computeVertexNormals();
      const scleraMat = new THREE.MeshStandardMaterial({
        map: this.scleraTex,
        roughness: 0.15,
        metalness: 0.02
      });
      const sclera = new THREE.Mesh(scleraGeo, scleraMat);
      globeGroup.add(sclera);

      // Iris disc in anterior chamber plane
      const irisMat = new THREE.MeshStandardMaterial({
        map: this.irisTex,
        roughness: 0.24,
        metalness: 0.05
      });
      const iris = new THREE.Mesh(new THREE.CircleGeometry(R * 0.49, 36), irisMat);
      iris.position.z = R * 0.885;
      globeGroup.add(iris);

      // Dynamic Pupil
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x05070a });
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(R * 0.20, 32), pupilMat);
      pupil.position.z = R * 0.896;
      globeGroup.add(pupil);

      // Glossy Cornea dome flush with limbus (Hirschberg corneal reflex)
      const corneaMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.04,
        metalness: 0.0,
        transparent: true,
        opacity: 0.22,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03
      });
      const cornea = new THREE.Mesh(new THREE.SphereGeometry(R * 0.68, 24, 16, 0, Math.PI * 2, 0, 0.80), corneaMat);
      cornea.rotation.x = Math.PI / 2;
      cornea.position.z = R * 0.411;
      globeGroup.add(cornea);

      // Torsion reference marker on top of iris (visible in X-Ray mode)
      const torsionTick = new THREE.Mesh(
        new THREE.BoxGeometry(0.011, 0.042, 0.008),
        new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0 })
      );
      torsionTick.position.set(0, R * 0.42, R * 0.906);
      globeGroup.add(torsionTick);

      // Articulated Upper & Lower Eyelids (thin contoured shells wrapping cleanly over cornea)
      const lidRadius = R * 1.095;
      const upperLidPivot = new THREE.Group();
      const upperLidGeo = new THREE.SphereGeometry(lidRadius, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.50);
      const upperLidMat = skinMat.clone();
      upperLidMat.side = THREE.DoubleSide;
      this.skinMaterials.push(upperLidMat);
      const upperLidMesh = new THREE.Mesh(upperLidGeo, upperLidMat);

      const lashMat = new THREE.MeshStandardMaterial({ color: 0x1e1612, roughness: 0.85, transparent: true, opacity: 1 });
      this.skinMaterials.push(lashMat);
      const upperLash = new THREE.Mesh(new THREE.TorusGeometry(lidRadius * 1.004, 0.0042, 8, 32, Math.PI), lashMat);
      upperLash.rotation.x = Math.PI / 2;
      upperLidPivot.add(upperLidMesh, upperLash);
      upperLidPivot.rotation.x = -0.50; // Upper lid rests just over the top of the iris
      socket.add(upperLidPivot);

      const lowerLidPivot = new THREE.Group();
      const lowerLidGeo = new THREE.SphereGeometry(lidRadius * 0.99, 24, 12, 0, Math.PI * 2, Math.PI * 0.50, Math.PI * 0.48);
      const lowerLidMesh = new THREE.Mesh(lowerLidGeo, upperLidMat);
      lowerLidPivot.add(lowerLidMesh);
      lowerLidPivot.rotation.x = 0.50; // Lower lid at the lower limbus
      socket.add(lowerLidPivot);

      // === 3D EXTRAOCULAR MUSCLES + TROCHLEA + OPTIC NERVE (X-Ray Layer!) ===
      const orbitGroup = new THREE.Group();
      orbitGroup.visible = false;
      socket.add(orbitGroup);

      const rimRing = new THREE.Mesh(
        new THREE.TorusGeometry(R * 1.48, 0.008, 10, 36),
        new THREE.MeshBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.45 })
      );
      rimRing.position.z = 0.04;
      orbitGroup.add(rimRing);

      const apex = new THREE.Vector3(-sideSign * 0.13, 0.02, -0.66);
      const apexMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.052, 0.011, 10, 20),
        new THREE.MeshStandardMaterial({ color: 0xcbd5e1, emissive: 0x334155, roughness: 0.4 })
      );
      apexMesh.position.copy(apex);
      orbitGroup.add(apexMesh);

      const opticCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-sideSign * 0.02, 0, -R),
        new THREE.Vector3(-sideSign * 0.08, 0.01, -0.44),
        apex,
        new THREE.Vector3(-sideSign * 0.31, 0.02, -0.90)
      ]);
      const opticMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0x713f12,
        emissiveIntensity: 0.35,
        roughness: 0.4
      });
      const opticMesh = new THREE.Mesh(new THREE.TubeGeometry(opticCurve, 20, 0.022, 10, false), opticMat);
      orbitGroup.add(opticMesh);

      // Trochlea pulley (superomedial orbital rim) for Superior Oblique
      const trochleaPos = new THREE.Vector3(-sideSign * 0.168, 0.178, 0.095);
      const trochleaMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.025, 0.008, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x9d174d, emissiveIntensity: 0.65 })
      );
      trochleaMesh.position.copy(trochleaPos);
      trochleaMesh.rotation.y = sideSign * 0.6;
      orbitGroup.add(trochleaMesh);

      const ioOrigin = new THREE.Vector3(-sideSign * 0.168, -0.172, 0.085);

      const insertions = {
        LR: new THREE.Vector3(sideSign * R * 0.98, 0, R * 0.25),
        MR: new THREE.Vector3(-sideSign * R * 0.98, 0, R * 0.28),
        SR: new THREE.Vector3(0, R * 0.98, R * 0.24),
        IR: new THREE.Vector3(0, -R * 0.98, R * 0.24),
        SO: new THREE.Vector3(sideSign * R * 0.42, R * 0.90, -R * 0.26),
        IO: new THREE.Vector3(sideSign * R * 0.58, -R * 0.72, -R * 0.36)
      };

      const muscleSpecs = {
        LR: { origin: apex, color: 0x38bdf8 },
        MR: { origin: apex, color: 0x22d3ee },
        SR: { origin: apex, color: 0x34d399 },
        IR: { origin: apex, color: 0xfbbf24 },
        SO: { origin: apex, via: trochleaPos, color: 0xf472b6 },
        IO: { origin: ioOrigin, color: 0xa78bfa }
      };

      const muscles = {};
      Object.keys(muscleSpecs).forEach((code) => {
        const spec = muscleSpecs[code];
        const mat = new THREE.MeshStandardMaterial({
          color: spec.color,
          emissive: spec.color,
          emissiveIntensity: 0.22,
          roughness: 0.38,
          metalness: 0.08
        });
        const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.021, 1, 10), mat);
        orbitGroup.add(seg1);
        let seg2 = null;
        if (spec.via) {
          seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.014, 1, 10), mat);
          orbitGroup.add(seg2);
        }
        muscles[code] = {
          code,
          mat,
          baseColor: new THREE.Color(spec.color),
          origin: spec.origin.clone(),
          via: spec.via ? spec.via.clone() : null,
          insertionLocal: insertions[code].clone(),
          seg1,
          seg2
        };
      });

      return {
        side,
        sideSign,
        socket,
        globeGroup,
        pupil,
        cornea,
        torsionTick,
        upperLidPivot,
        lowerLidPivot,
        orbitGroup,
        opticMat,
        muscles
      };
    }

    _buildOralAndFacialRig(skinMat, lipMat) {
      // Mouth Anchor sitting flush at the oral recess rim (y = -0.44, z = 0.76)
      this.mouthGroup = new THREE.Group();
      this.mouthGroup.position.set(0, -0.44, 0.76);
      this.headGroup.add(this.mouthGroup);

      // === INTERIOR OROPHARYNX (Clearly visible whenever mouth opens!) ===
      this.oralInterior = new THREE.Group();
      this.oralInterior.visible = false;
      this.mouthGroup.add(this.oralInterior);

      // Posterior pharyngeal dark wall behind uvula
      const throatWall = new THREE.Mesh(
        new THREE.CircleGeometry(0.185, 24),
        new THREE.MeshStandardMaterial({ color: 0x3b0d17, roughness: 0.9 })
      );
      throatWall.scale.set(1.15, 0.92, 1);
      throatWall.position.set(0, -0.04, -0.14);
      this.oralInterior.add(throatWall);

      // Upper & Lower Teeth Rows
      const teethMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.22 });
      this.upperTeeth = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.036, 0.04), teethMat);
      this.upperTeeth.position.set(0, 0.035, 0.02);
      this.oralInterior.add(this.upperTeeth);

      this.lowerTeeth = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.032, 0.04), teethMat);
      this.lowerTeeth.position.set(0, -0.145, 0.015);
      this.oralInterior.add(this.lowerTeeth);

      // Soft Palate Right & Left Faucial Arches (bright coral pink for unmistakable contrast!)
      const palateMat = new THREE.MeshStandardMaterial({
        color: 0xf07a8a,
        emissive: 0x4c111b,
        emissiveIntensity: 0.35,
        roughness: 0.38
      });
      // Right Arch (-X)
      const rArchCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.145, -0.075, -0.06),
        new THREE.Vector3(-0.10, 0.005, -0.055),
        new THREE.Vector3(-0.015, 0.022, -0.055)
      ]);
      this.palateRight = new THREE.Mesh(new THREE.TubeGeometry(rArchCurve, 14, 0.022, 10, false), palateMat);
      this.oralInterior.add(this.palateRight);

      // Left Arch (+X)
      const lArchCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.015, 0.022, -0.055),
        new THREE.Vector3(0.10, 0.005, -0.055),
        new THREE.Vector3(0.145, -0.075, -0.06)
      ]);
      this.palateLeft = new THREE.Mesh(new THREE.TubeGeometry(lArchCurve, 14, 0.022, 10, false), palateMat);
      this.oralInterior.add(this.palateLeft);

      // Hanging Uvula (pivots cleanly at top of palatal arch!)
      this.uvulaPivot = new THREE.Group();
      this.uvulaPivot.position.set(0, 0.022, -0.052);
      const uvulaMat = new THREE.MeshStandardMaterial({
        color: 0xfb8595,
        emissive: 0x6b1424,
        emissiveIntensity: 0.42,
        roughness: 0.32
      });
      const uvulaDrop = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 12), uvulaMat);
      uvulaDrop.scale.set(0.88, 2.15, 0.88);
      uvulaDrop.position.y = -0.045;
      this.uvulaPivot.add(uvulaDrop);
      this.oralInterior.add(this.uvulaPivot);

      // 3D Sculpted Tongue (CN XII — visible resting inside mouth floor & protruding cleanly outward!)
      this.tonguePivot = new THREE.Group();
      this.tonguePivot.position.set(0, -0.105, -0.21);
      const tongueMat = new THREE.MeshStandardMaterial({
        color: 0xe26978,
        emissive: 0x3b0f17,
        emissiveIntensity: 0.25,
        roughness: 0.36
      });
      this.tongueMesh = new THREE.Mesh(new THREE.SphereGeometry(0.098, 24, 18), tongueMat);
      this.tongueMesh.scale.set(1.06, 0.38, 2.05);
      this.tongueMesh.position.set(0, 0, 0.02);
      // Subtle midline tongue groove
      const groove = new THREE.Mesh(
        new THREE.BoxGeometry(0.011, 0.011, 0.22),
        new THREE.MeshBasicMaterial({ color: 0xb04856 })
      );
      groove.position.set(0, 0.035, 0.05);
      this.tongueMesh.add(groove);
      this.tonguePivot.add(this.tongueMesh);
      this.oralInterior.add(this.tonguePivot);

      // === NATURAL ALIGNED CLOSED LIPS (Built from 5-point deformable curves!) ===
      this.lipMat = lipMat;
      this.upperLipMesh = null;
      this.lowerLipMesh = null;
      this.mouthCoverMat = skinMat;

      // Skin cover over the oral pocket, sampled from the un-recessed face so it blends seamlessly.
      // Triangles between the lips are dropped as the mouth opens (see _updateMouthCover).
      this._buildMouthCover();

      this._rebuildLips(0, 0, 0, 0, 0, 0);

      // Nasolabial Fold shadow lines (flattened on affected side in CN VII palsy!)
      const nlfMatR = new THREE.MeshBasicMaterial({ color: 0x9c6b4e, transparent: true, opacity: 0.22 });
      const nlfMatL = new THREE.MeshBasicMaterial({ color: 0x9c6b4e, transparent: true, opacity: 0.22 });
      const nlfCurveR = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.12, -0.17, 0.855),
        new THREE.Vector3(-0.22, -0.30, 0.835),
        new THREE.Vector3(-0.25, -0.43, 0.785)
      ]);
      const nlfCurveL = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.12, -0.17, 0.855),
        new THREE.Vector3(0.22, -0.30, 0.835),
        new THREE.Vector3(0.25, -0.43, 0.785)
      ]);
      this.nlfRight = new THREE.Mesh(new THREE.TubeGeometry(nlfCurveR, 12, 0.009, 6, false), nlfMatR);
      this.nlfLeft = new THREE.Mesh(new THREE.TubeGeometry(nlfCurveL, 12, 0.009, 6, false), nlfMatL);
      this.headGroup.add(this.nlfRight, this.nlfLeft);
    }

    _buildMouthCover() {
      const src = new THREE.Mesh(this._smoothHeadGeo, new THREE.MeshBasicMaterial());
      src.updateMatrixWorld(true);
      const srcPos = this._smoothHeadGeo.attributes.position;
      const srcNrm = this._smoothHeadGeo.attributes.normal;
      const srcCol = this._smoothHeadGeo.attributes.color;
      const off = this.mouthGroup.position;
      const NX = 96, NY = 68;
      const x0 = -0.40, x1 = 0.40, y0 = -0.76, y1 = -0.20;
      const ray = new THREE.Raycaster();
      const dir = new THREE.Vector3(0, 0, -1);
      const origin = new THREE.Vector3();
      const tri = new THREE.Triangle();
      const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), bary = new THREE.Vector3();
      const positions = [], normals = [], colors = [], valid = [];
      for (let j = 0; j <= NY; j++) {
        for (let i = 0; i <= NX; i++) {
          const x = x0 + (x1 - x0) * i / NX;
          const y = y0 + (y1 - y0) * j / NY;
          origin.set(x, y, 3);
          ray.set(origin, dir);
          const hit = ray.intersectObject(src, false)[0];
          if (!hit) { positions.push(0, 0, 0); normals.push(0, 0, 1); colors.push(0, 0, 0); valid.push(false); continue; }
          const f = hit.face;
          a.fromBufferAttribute(srcPos, f.a); b.fromBufferAttribute(srcPos, f.b); c.fromBufferAttribute(srcPos, f.c);
          tri.set(a, b, c).getBarycoord(hit.point, bary);
          const n = new THREE.Vector3();
          [[f.a, bary.x], [f.b, bary.y], [f.c, bary.z]].forEach(([k, w]) => {
            n.x += srcNrm.getX(k) * w; n.y += srcNrm.getY(k) * w; n.z += srcNrm.getZ(k) * w;
          });
          n.normalize();
          let cr = 0, cg = 0, cb = 0;
          [[f.a, bary.x], [f.b, bary.y], [f.c, bary.z]].forEach(([k, w]) => {
            cr += srcCol.getX(k) * w; cg += srcCol.getY(k) * w; cb += srcCol.getZ(k) * w;
          });
          positions.push(hit.point.x - off.x, hit.point.y - off.y, hit.point.z - off.z + 0.0015);
          normals.push(n.x, n.y, n.z);
          colors.push(cr, cg, cb);
          // Keep an elliptical patch so its outline lies where the head is already un-recessed.
          valid.push(Math.hypot(x / 0.38, (y + 0.48) / 0.27) < 1.0);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      // Candidate triangles (with their centroid in mouthGroup coords) for fast re-indexing.
      const tris = [];
      const idx = (i, j) => j * (NX + 1) + i;
      for (let j = 0; j < NY; j++) {
        for (let i = 0; i < NX; i++) {
          const q = [idx(i, j), idx(i + 1, j), idx(i + 1, j + 1), idx(i, j + 1)];
          if (!q.every((k) => valid[k])) continue;
          [[q[0], q[1], q[2]], [q[0], q[2], q[3]]].forEach((t) => {
            let cx = 0, cy = 0;
            t.forEach((k) => { cx += positions[k * 3]; cy += positions[k * 3 + 1]; });
            tris.push({ t, cx: cx / 3, cy: cy / 3 });
          });
        }
      }
      this._mouthCoverTris = tris;
      this.mouthCover = new THREE.Mesh(geo, this.headSkinMat);
      this.mouthCover.receiveShadow = true;
      this.mouthCover.castShadow = true;
      this.mouthGroup.add(this.mouthCover);
      src.material.dispose();
    }

    // Opens a hole in the skin cover between the upper and lower lip curves.
    _updateMouthCover(upperCurve, lowerCurve, rx, lx) {
      if (!this.mouthCover) return;
      const sample = (curve) => curve.getPoints(48);
      const up = sample(upperCurve), lo = sample(lowerCurve);
      const yAt = (pts, x) => {
        for (let k = 0; k < pts.length - 1; k++) {
          const p0 = pts[k], p1 = pts[k + 1];
          if ((x >= p0.x && x <= p1.x) || (x <= p0.x && x >= p1.x)) {
            const t = Math.abs(p1.x - p0.x) < 1e-6 ? 0 : (x - p0.x) / (p1.x - p0.x);
            return p0.y + (p1.y - p0.y) * t;
          }
        }
        return null;
      };
      const index = [];
      for (const tr of this._mouthCoverTris) {
        let inside = false;
        if (tr.cx > rx && tr.cx < lx) {
          const uy = yAt(up, tr.cx), ly = yAt(lo, tr.cx);
          if (uy !== null && ly !== null && tr.cy < uy - 0.006 && tr.cy > ly + 0.006) inside = true;
        }
        if (!inside) index.push(tr.t[0], tr.t[1], tr.t[2]);
      }
      this.mouthCover.geometry.setIndex(index);
    }

    // Tube whose radius follows profile(u) (u = 0..1 along the curve); squash scales depth (z).
    _shapedTube(curve, segments, radius, radial, profile, squashZ) {
      const geo = new THREE.TubeGeometry(curve, segments, radius, radial, false);
      const pos = geo.attributes.position;
      const pt = new THREE.Vector3();
      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        curve.getPointAt(u, pt);
        const f = profile(u);
        for (let j = 0; j <= radial; j++) {
          const k = i * (radial + 1) + j;
          const dx = (pos.getX(k) - pt.x) * f;
          const dy = (pos.getY(k) - pt.y) * f;
          const dz = (pos.getZ(k) - pt.z) * f * (squashZ || 1);
          pos.setXYZ(k, pt.x + dx, pt.y + dy, pt.z + dz);
        }
      }
      geo.computeVertexNormals();
      return geo;
    }

    _rebuildLips(openAmt, smileR, smileL, droopR, droopL, jawDevX) {
      if (this.upperLipMesh) {
        this.mouthGroup.remove(this.upperLipMesh);
        this.upperLipMesh.geometry.dispose();
      }
      if (this.lowerLipMesh) {
        this.mouthGroup.remove(this.lowerLipMesh);
        this.lowerLipMesh.geometry.dispose();
      }

      // Corner coordinates (Right = -X, Left = +X)
      const rx = -0.205 - smileR * 0.042;
      const lx = 0.205 + smileL * 0.042;
      const ry = smileR * 0.055 - droopR * 0.045 - openAmt * 0.025;
      const ly = smileL * 0.055 - droopL * 0.045 - openAmt * 0.025;

      // Upper lip curve (subtle natural cupid's bow; lifts slightly on open)
      const upY = 0.018 + openAmt * 0.045;
      const upperPts = [
        new THREE.Vector3(rx, ry, 0.025),
        new THREE.Vector3(rx * 0.45, upY + 0.010 + (ry * 0.35), 0.070),
        new THREE.Vector3(0, upY + 0.002, 0.080),
        new THREE.Vector3(lx * 0.45, upY + 0.010 + (ly * 0.35), 0.070),
        new THREE.Vector3(lx, ly, 0.025)
      ];
      const upperCurve = new THREE.CatmullRomCurve3(upperPts);
      const lipProfile = (u) => 0.22 + 0.78 * Math.pow(Math.sin(Math.PI * u), 0.75);
      this.upperLipMesh = new THREE.Mesh(this._shapedTube(upperCurve, 32, 0.024, 12, lipProfile, 0.75), this.lipMat);
      this.mouthGroup.add(this.upperLipMesh);

      // Lower lip curve (meets upper lip flush when openAmt=0; drops smoothly to expose open oral cavity!)
      const lowY = -0.020 - openAmt * 0.165;
      const lowerPts = [
        new THREE.Vector3(rx, ry - 0.004, 0.024),
        new THREE.Vector3(rx * 0.45 + jawDevX * 0.7, lowY + 0.005 + (ry * 0.25), 0.068 - openAmt * 0.01),
        new THREE.Vector3(jawDevX, lowY - 0.006, 0.078 - openAmt * 0.01),
        new THREE.Vector3(lx * 0.45 + jawDevX * 0.7, lowY + 0.005 + (ly * 0.25), 0.068 - openAmt * 0.01),
        new THREE.Vector3(lx, ly - 0.004, 0.024)
      ];
      const lowerCurve = new THREE.CatmullRomCurve3(lowerPts);
      this.lowerLipMesh = new THREE.Mesh(this._shapedTube(lowerCurve, 32, 0.029, 12, lipProfile, 0.75), this.lipMat);
      this.mouthGroup.add(this.lowerLipMesh);

      this._updateMouthCover(upperCurve, lowerCurve, rx, lx);
    }

    _buildDermatomeMarkers() {
      this.dermatomeGroup = new THREE.Group();
      this.dermatomeGroup.visible = false;
      this.headGroup.add(this.dermatomeGroup);

      const zones = [
        { id: 'V1_R', pos: [-0.28, 0.54, 0.80], color: 0x38bdf8 },
        { id: 'V1_L', pos: [0.28, 0.54, 0.80], color: 0x38bdf8 },
        { id: 'V2_R', pos: [-0.38, -0.10, 0.80], color: 0x34d399 },
        { id: 'V2_L', pos: [0.38, -0.10, 0.80], color: 0x34d399 },
        { id: 'V3_R', pos: [-0.33, -0.52, 0.70], color: 0xfbbf24 },
        { id: 'V3_L', pos: [0.33, -0.52, 0.70], color: 0xfbbf24 }
      ];

      zones.forEach((z) => {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.052, 0.080, 24),
          new THREE.MeshBasicMaterial({ color: z.color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
        );
        ring.position.set(z.pos[0], z.pos[1], z.pos[2]);
        ring.lookAt(z.pos[0] * 2.2, z.pos[1] * 1.4, z.pos[2] + 1.5);
        this.dermatomeGroup.add(ring);
      });
    }

    _buildTools() {
      // 1) Interactive Red Fixation Target / Examiner Finger
      this.fingerGroup = new THREE.Group();
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.010, 0.014, 0.62, 14),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.3 })
      );
      rod.position.y = -0.32;
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 20, 16),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.45, roughness: 0.2 })
      );
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.044, 0.052, 24),
        new THREE.MeshBasicMaterial({ color: 0xfca5a5, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
      );
      this.fingerGroup.add(rod, tip, halo);
      this.fingerGroup.position.set(0, 0.34, 1.85);
      this.scene.add(this.fingerGroup);

      // 2) Interactive 3D Penlight
      this.penlightGroup = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.030, 0.034, 0.70, 16),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.25 })
      );
      body.rotation.x = Math.PI / 2;
      body.position.z = 0.35;
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.030, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xfef9c3 })
      );
      const beamCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 1.32, 24, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0.16,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      beamCone.rotation.x = Math.PI / 2;
      beamCone.position.z = -0.66;
      this.penlightBeam = beamCone;
      this.penlightGroup.add(body, bulb, beamCone);
      this.penlightGroup.visible = false;
      this.scene.add(this.penlightGroup);

      // 3) Cotton Wisp (Corneal Reflex)
      this.cottonGroup = new THREE.Group();
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xd6b588 })
      );
      stick.rotation.z = Math.PI / 2;
      stick.position.x = 0.25;
      const wisp = new THREE.Mesh(
        new THREE.SphereGeometry(0.034, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 })
      );
      wisp.scale.set(1.4, 0.7, 0.7);
      this.cottonGroup.add(stick, wisp);
      this.cottonGroup.visible = false;
      this.scene.add(this.cottonGroup);

      // 4) Translucent Occluder Paddle (Cover / Alternate Cover test, Test of Skew)
      this.occluderGroup = new THREE.Group();
      const paddle = new THREE.Mesh(
        new THREE.CircleGeometry(0.15, 32),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, transparent: true, opacity: 0.62, roughness: 0.6, side: THREE.DoubleSide })
      );
      const rim = new THREE.Mesh(
        new THREE.RingGeometry(0.145, 0.158, 32),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide })
      );
      rim.position.z = 0.001;
      const paddleHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.42, 10),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
      );
      paddleHandle.position.y = -0.36;
      this.occluderGroup.add(paddle, rim, paddleHandle);
      this.occluderGroup.position.set(0, 0.34, 1.13);
      this.occluderGroup.visible = false;
      this.scene.add(this.occluderGroup);
    }

    _bindEvents() {
      const dom = this.renderer.domElement;

      const getNormCoords = (e) => {
        const rect = dom.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        const nx = ((cx - rect.left) / rect.width) * 2 - 1;
        const ny = -(((cy - rect.top) / rect.height) * 2 - 1);
        return { cx, cy, nx, ny };
      };

      const onDown = (e) => {
        this.isPointerDown = true;
        this.isRightDrag = e.button === 2 || e.shiftKey || this.activeTool === 'orbit';
        const p = getNormCoords(e);
        this.lastPointer = { x: p.cx, y: p.cy };
        if (!this.isRightDrag) this._applyToolPointer(p.nx, p.ny);
      };

      const onMove = (e) => {
        if (!this.isPointerDown) return;
        const p = getNormCoords(e);
        if (this.isRightDrag) {
          const dx = p.cx - this.lastPointer.x;
          const dy = p.cy - this.lastPointer.y;
          this.desiredCam.theta -= dx * 0.007;
          this.desiredCam.phi = THREE.MathUtils.clamp(this.desiredCam.phi - dy * 0.007, 0.55, 2.35);
        } else {
          this._applyToolPointer(p.nx, p.ny);
        }
        this.lastPointer = { x: p.cx, y: p.cy };
      };

      const onUp = () => {
        this.isPointerDown = false;
        this.isRightDrag = false;
      };

      dom.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      dom.addEventListener('contextmenu', (e) => e.preventDefault());

      dom.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e); }, { passive: false });
      dom.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
      window.addEventListener('touchend', onUp);

      dom.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.desiredCam.radius = THREE.MathUtils.clamp(this.desiredCam.radius + e.deltaY * 0.0025, 1.85, 6.8);
      }, { passive: false });

      window.addEventListener('resize', () => this.resize());
    }

    _applyToolPointer(nx, ny) {
      if (this.activeTool === 'finger') {
        this.autoHActive = false;
        this.targetGaze.x = THREE.MathUtils.clamp(nx * 1.35, -1, 1);
        this.targetGaze.y = THREE.MathUtils.clamp(ny * 1.35, -1, 1);
        this.targetGaze.convergence = 0;
      } else if (this.activeTool === 'penlight') {
        this.swingActive = false;
        this.penlightOn = true;
        this.penlightPos.set(
          THREE.MathUtils.clamp(nx * 1.2, -0.85, 0.85),
          THREE.MathUtils.clamp(0.34 + ny * 0.65, -0.15, 0.85),
          2.05
        );
        if (this.penlightPos.x < -0.10) this.penlightSide = 'right';
        else if (this.penlightPos.x > 0.10) this.penlightSide = 'left';
        else this.penlightSide = null;
      }
    }

    resize() {
      const w = this.container.clientWidth || 800;
      const h = this.container.clientHeight || 600;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }

    // === PUBLIC CONTROLS API ===
    setPathology(pathologyState) {
      this.pathology = Object.assign({}, pathologyState || {});
      this.targetHeadTiltDeg = this.pathology.defaultHeadTilt || 0;
      this.liftRightLid = false;
      this.liftLeftLid = false;
      this.hit = null;
      this.hitHeadYawDeg = 0;
      this.setCover('none');
      this.resetManeuvers();
    }

    setTool(tool) {
      this.activeTool = tool;
      this.fingerGroup.visible = (tool === 'finger');
      this.penlightGroup.visible = (tool === 'penlight');
      if (tool !== 'penlight') {
        this.penlightOn = false;
        this.penlightSide = null;
        this.swingActive = false;
      } else {
        this.penlightOn = true;
      }
    }

    setXRay(enabled) {
      this.xrayMode = !!enabled;
      this.eyes.right.orbitGroup.visible = this.xrayMode;
      this.eyes.left.orbitGroup.visible = this.xrayMode;
      this.eyes.right.torsionTick.material.opacity = this.xrayMode ? 0.95 : 0;
      this.eyes.left.torsionTick.material.opacity = this.xrayMode ? 0.95 : 0;
    }

    // === HINTS: Head Impulse Test ===
    // dir: 'right' = examiner thrusts head quickly toward patient's RIGHT; 'left' = toward patient's LEFT.
    startHeadImpulse(dir) {
      this.setTool('finger');
      this.autoHActive = false;
      this.targetGaze = { x: 0, y: 0, convergence: 0 };
      this.targetHeadYawDeg = 0;
      this.hit = { dir: dir === 'left' ? 1 : -1, t: 0 };
    }

    setHitSlowMotion(on) {
      this.hitTimeScale = on ? 0.4 : 1.0;
    }

    // === HINTS: Cover / Alternate Cover ===
    setCover(mode) {
      this.coverMode = mode || 'none';
      this.coverTimer = 0;
      if (this.coverMode !== 'none') {
        this.setTool('finger');
        this.autoHActive = false;
      }
    }

    setLiftLid(side, lift) {
      if (side === 'right') this.liftRightLid = !!lift;
      if (side === 'left') this.liftLeftLid = !!lift;
    }

    setHeadTilt(deg) {
      this.targetHeadTiltDeg = THREE.MathUtils.clamp(deg, -28, 28);
    }

    setShowDermatomes(show) {
      this.showDermatomes = !!show;
      this.dermatomeGroup.visible = this.showDermatomes;
    }

    setGaze(x, y, convergence = 0) {
      this.autoHActive = false;
      this.targetGaze = { x, y, convergence };
      if (this.activeTool !== 'finger') this.setTool('finger');
    }

    startAutoHTest() {
      this.setTool('finger');
      this.autoHActive = true;
      this.autoHT = 0;
      this.targetGaze.convergence = 0;
    }

    stopAutoHTest() {
      this.autoHActive = false;
    }

    triggerConvergence() {
      this.setTool('finger');
      this.autoHActive = false;
      this.targetGaze = { x: 0, y: -0.06, convergence: 1.0 };
    }

    startSwingingFlashlight() {
      this.setTool('penlight');
      this.setCameraPreset('eyes');
      this.penlightOn = true;
      this.swingActive = true;
      this.swingTimer = 0;
    }

    setCameraPreset(preset) {
      if (preset === 'front') {
        this.desiredCam = { theta: 0, phi: Math.PI / 2 - 0.04, radius: 4.45, target: new THREE.Vector3(0, 0.16, 0) };
      } else if (preset === 'eyes') {
        this.desiredCam = { theta: 0, phi: Math.PI / 2 - 0.02, radius: 2.38, target: new THREE.Vector3(0, 0.34, 0.56) };
      } else if (preset === 'xray') {
        this.setXRay(true);
        this.desiredCam = { theta: 0.42, phi: Math.PI / 2 - 0.22, radius: 2.75, target: new THREE.Vector3(0, 0.34, 0.35) };
      } else if (preset === 'mouth') {
        // Close-up right into the illuminated open oral cavity!
        this.desiredCam = { theta: 0, phi: Math.PI / 2 + 0.02, radius: 1.95, target: new THREE.Vector3(0, -0.26, 0.65) };
      } else if (preset === 'neck') {
        this.desiredCam = { theta: 0, phi: Math.PI / 2 + 0.05, radius: 4.70, target: new THREE.Vector3(0, -0.52, 0) };
      }
    }

    resetManeuvers() {
      this.maneuver.raiseBrows = 0;
      this.maneuver.squeezeEyes = 0;
      this.maneuver.smile = 0;
      this.maneuver.jawOpen = 0;
      this.maneuver.sayAhh = 0;
      this.maneuver.tongueOut = 0;
      this.maneuver.shrug = 0;
      this.targetHeadYawDeg = 0;
      this.cottonGroup.visible = false;
    }

    triggerManeuver(name) {
      this.resetManeuvers();
      if (name === 'raise_brows') {
        this.setCameraPreset('front');
        this.maneuver.raiseBrows = 1;
      } else if (name === 'close_eyes') {
        this.setCameraPreset('eyes');
        this.maneuver.squeezeEyes = 1;
      } else if (name === 'smile_test') {
        this.setCameraPreset('front');
        this.maneuver.smile = 1;
      } else if (name === 'jaw_open') {
        this.setCameraPreset('mouth');
        this.maneuver.jawOpen = 1;
      } else if (name === 'say_ahh') {
        this.setCameraPreset('mouth');
        this.maneuver.jawOpen = 1;
        this.maneuver.sayAhh = 1;
      } else if (name === 'tongue_out') {
        this.setCameraPreset('mouth');
        this.maneuver.jawOpen = 0.92;
        this.maneuver.tongueOut = 1;
      } else if (name === 'head_turn_left') {
        this.setCameraPreset('neck');
        this.targetHeadYawDeg = this.pathology.rightCN11 ? 9 : 34;
      } else if (name === 'head_turn_right') {
        this.setCameraPreset('neck');
        this.targetHeadYawDeg = this.pathology.leftCN11 ? -9 : -34;
      } else if (name === 'shrug_shoulders') {
        this.setCameraPreset('neck');
        this.maneuver.shrug = 1;
      } else if (name === 'corneal_right' || name === 'corneal_left') {
        this.setCameraPreset('eyes');
        const side = name === 'corneal_right' ? 'right' : 'left';
        this._animateCornealReflex(side);
      }
    }

    _animateCornealReflex(side) {
      this.cottonGroup.visible = true;
      const sideSign = side === 'left' ? 1 : -1;
      this.cottonGroup.position.set(sideSign * 0.42, 0.30, 1.04);
      const afferentIntact = (side === 'right') ? !this.pathology.rightCN5_sensory : !this.pathology.leftCN5_sensory;
      setTimeout(() => {
        if (afferentIntact) {
          const rightEfferent = !this.pathology.rightCN7_LMN;
          const leftEfferent = !this.pathology.leftCN7_LMN;
          if (rightEfferent) this.maneuver.blinkRight = 1.0;
          if (leftEfferent) this.maneuver.blinkLeft = 1.0;
        }
        setTimeout(() => {
          this.cottonGroup.visible = false;
        }, 550);
      }, 300);
    }

    // === BIOMECHANICAL OCULAR MOTOR SOLVER ===
    _solveEyePhysics(dt, elapsed) {
      const p = this.pathology;

      if (this.autoHActive) {
        this.autoHT += dt * 0.42;
        const waypoints = [
          [0, 0],
          [-1, 0], [-1, 0.92], [-1, -0.92], [-1, 0],
          [0, 0],
          [1, 0], [1, 0.92], [1, -0.92], [1, 0],
          [0, 0]
        ];
        const totalSegs = waypoints.length - 1;
        const posT = (this.autoHT % totalSegs);
        const idx = Math.floor(posT);
        const frac = posT - idx;
        const smooth = frac * frac * (3 - 2 * frac);
        const a = waypoints[idx];
        const b = waypoints[idx + 1];
        this.targetGaze.x = THREE.MathUtils.lerp(a[0], b[0], smooth);
        this.targetGaze.y = THREE.MathUtils.lerp(a[1], b[1], smooth);
      }

      const gx = this.targetGaze.x;
      const gy = this.targetGaze.y;
      const conv = this.targetGaze.convergence;

      const maxYaw = 0.56;
      const maxPitch = 0.42;

      let rYaw = gx * maxYaw + conv * 0.36;
      let lYaw = gx * maxYaw - conv * 0.36;
      let rPitch = -gy * maxPitch;
      let lPitch = -gy * maxPitch;
      let rRoll = 0;
      let lRoll = 0;

      const tiltRad = THREE.MathUtils.degToRad(this.headTiltDeg);
      rRoll -= tiltRad * 0.16;
      lRoll -= tiltRad * 0.16;

      if (p.rightCN3) {
        rYaw = Math.min(rYaw, -0.34);
        rPitch = Math.max(rPitch, 0.14);
        rRoll = -0.14;
      }
      if (p.leftCN3) {
        lYaw = Math.max(lYaw, 0.34);
        lPitch = Math.max(lPitch, 0.14);
        lRoll = 0.14;
      }
      if (p.rightCN4) {
        const adductFactor = THREE.MathUtils.clamp((gx + 0.35) / 1.35, 0, 1);
        const downFactor = THREE.MathUtils.clamp((-gy + 0.3) / 1.3, 0, 1);
        const rightTiltFactor = THREE.MathUtils.clamp((this.headTiltDeg + 14) / 36, 0, 1.3);
        const hypertropia = 0.06 + 0.14 * adductFactor * downFactor + 0.11 * rightTiltFactor;
        if (gx > 0 && gy < 0) rPitch = Math.min(rPitch, 0.02);
        rPitch -= hypertropia;
        rRoll += 0.18;
      }
      if (p.leftCN4) {
        const adductFactor = THREE.MathUtils.clamp((-gx + 0.35) / 1.35, 0, 1);
        const downFactor = THREE.MathUtils.clamp((-gy + 0.3) / 1.3, 0, 1);
        const leftTiltFactor = THREE.MathUtils.clamp((-this.headTiltDeg + 14) / 36, 0, 1.3);
        const hypertropia = 0.06 + 0.14 * adductFactor * downFactor + 0.11 * leftTiltFactor;
        if (gx < 0 && gy < 0) lPitch = Math.min(lPitch, 0.02);
        lPitch -= hypertropia;
        lRoll -= 0.18;
      }
      // CN VI: esotropia in primary gaze that grows toward the palsied side (abduction capped)
      // and fades smoothly to orthotropia on gaze AWAY from the lesion (incomitant deviation).
      const smooth01 = (t) => { const c = THREE.MathUtils.clamp(t, 0, 1); return c * c * (3 - 2 * c); };
      if (p.leftCN6) {
        lYaw -= 0.18 * smooth01((gx + 0.75) / 0.75);
        lYaw = Math.min(lYaw, -0.02);
      }
      if (p.rightCN6) {
        rYaw += 0.18 * smooth01((-gx + 0.75) / 0.75);
        rYaw = Math.max(rYaw, 0.02);
      }
      if (p.leftINO && conv < 0.3 && gx < 0) {
        lYaw = Math.max(lYaw, -0.04);
        rYaw += Math.sin(elapsed * 22) * 0.055 * Math.min(1, Math.abs(gx) * 1.4);
      }
      if (p.rightINO && conv < 0.3 && gx > 0) {
        rYaw = Math.min(rYaw, 0.04);
        lYaw += Math.sin(elapsed * 22) * 0.055 * Math.min(1, Math.abs(gx) * 1.4);
      }

      // --- Test of Skew: vertical misalignment (ipsilesional hypotropia) from central otolith-pathway lesion ---
      if (p.skewLeftHypo) lPitch += p.skewLeftHypo;
      if (p.skewRightHypo) rPitch += p.skewRightHypo;

      // --- Cover / Alternate cover: the uncovered eye must take up fixation (Hering's law moves both eyes) ---
      this._updateCover(dt);
      if (this.coveredEye) {
        const rTargetYaw = gx * maxYaw + conv * 0.36;
        const lTargetYaw = gx * maxYaw - conv * 0.36;
        const targetPitch = -gy * maxPitch;
        const rDev = Math.hypot(rYaw - rTargetYaw, rPitch - targetPitch);
        const lDev = Math.hypot(lYaw - lTargetYaw, lPitch - targetPitch);
        const habitualFixer = rDev <= lDev ? 'right' : 'left';
        if (this.coveredEye === habitualFixer) {
          const viewer = habitualFixer === 'right' ? 'left' : 'right';
          const paralysed = viewer === 'right' ? p.rightCN3 : p.leftCN3;
          if (!paralysed) {
            const dYaw = viewer === 'right' ? (rTargetYaw - rYaw) : (lTargetYaw - lYaw);
            const dPitch = targetPitch - (viewer === 'right' ? rPitch : lPitch);
            rYaw += dYaw; lYaw += dYaw;
            rPitch += dPitch; lPitch += dPitch;
          }
        }
      }

      const lerpF = Math.min(1, dt * 11);
      this.eyeAngles.right.yaw = THREE.MathUtils.lerp(this.eyeAngles.right.yaw, rYaw, lerpF);
      this.eyeAngles.right.pitch = THREE.MathUtils.lerp(this.eyeAngles.right.pitch, rPitch, lerpF);
      this.eyeAngles.right.roll = THREE.MathUtils.lerp(this.eyeAngles.right.roll, rRoll, lerpF);

      this.eyeAngles.left.yaw = THREE.MathUtils.lerp(this.eyeAngles.left.yaw, lYaw, lerpF);
      this.eyeAngles.left.pitch = THREE.MathUtils.lerp(this.eyeAngles.left.pitch, lPitch, lerpF);
      this.eyeAngles.left.roll = THREE.MathUtils.lerp(this.eyeAngles.left.roll, lRoll, lerpF);

      // Fast, unsmoothed components: VOR during head impulse + vestibular nystagmus (conjugate)
      this._solveHeadImpulse(dt);
      this._solveNystagmus(gx, elapsed);
      const fastYaw = this.vorOffset + this.nystagmusOffset.yaw;
      const fastPitch = this.nystagmusOffset.pitch;

      this.eyes.right.globeGroup.rotation.set(this.eyeAngles.right.pitch + fastPitch, this.eyeAngles.right.yaw + fastYaw, this.eyeAngles.right.roll, 'YXZ');
      this.eyes.left.globeGroup.rotation.set(this.eyeAngles.left.pitch + fastPitch, this.eyeAngles.left.yaw + fastYaw, this.eyeAngles.left.roll, 'YXZ');

      this._computeMuscleActivities(gx, gy, conv);
      if (this.xrayMode) this._updateOrbitalMuscles3D(elapsed);

      const zDist = THREE.MathUtils.lerp(1.85, 1.12, conv);
      this.fingerGroup.position.lerp(new THREE.Vector3(gx * 1.30, 0.34 + gy * 0.80, zDist), Math.min(1, dt * 14));
    }

    _updateCover(dt) {
      if (this.coverMode === 'alternate') {
        this.coverTimer += dt;
        this.coveredEye = (Math.floor(this.coverTimer / 1.4) % 2 === 0) ? 'right' : 'left';
      } else if (this.coverMode === 'right' || this.coverMode === 'left') {
        this.coveredEye = this.coverMode;
      } else {
        this.coveredEye = null;
      }
      this.occluderGroup.visible = !!this.coveredEye;
      if (this.coveredEye) {
        const tx = this.coveredEye === 'right' ? -0.31 : 0.31;
        // paddle sweeps quickly across the nose bridge, like a real alternate cover
        this.coverX = THREE.MathUtils.lerp(this.coverX, tx, Math.min(1, dt * 16));
        this.occluderGroup.position.set(this.coverX, 0.34, 1.13);
      }
    }

    // Head Impulse Test (Halmagyi-Curthoys). Head yaw is set directly (no smoothing) so the impulse is
    // abrupt; eyes counter-rotate in the head (VOR) to stay on target. A peripheral vestibular lesion gives
    // a deficient VOR for impulses TOWARD the lesioned side -> eyes are dragged off target -> catch-up saccade.
    _solveHeadImpulse(dt) {
      if (!this.hit) {
        this.vorOffset = THREE.MathUtils.lerp(this.vorOffset, 0, Math.min(1, dt * 12));
        return;
      }
      const h = this.hit;
      h.t += dt * this.hitTimeScale;
      const AMP = 18; // degrees
      const ss = (x) => { const c = THREE.MathUtils.clamp(x, 0, 1); return c * c * (3 - 2 * c); };
      let headDeg;
      if (h.t < 0.12) headDeg = h.dir * AMP * ss(h.t / 0.12);
      else if (h.t < 0.9) headDeg = h.dir * AMP;
      else if (h.t < 1.7) headDeg = h.dir * AMP * (1 - ss((h.t - 0.9) / 0.8));
      else {
        this.hit = null;
        this.hitHeadYawDeg = 0;
        this.vorOffset = 0;
        return;
      }
      this.hitHeadYawDeg = headDeg;

      const ideal = -THREE.MathUtils.degToRad(headDeg);
      const v = this.pathology.vestibular;
      const deficient = (v === 'peripheral_right' && h.dir === -1) || (v === 'peripheral_left' && h.dir === 1);
      if (!deficient || h.t >= 0.9) {
        this.vorOffset = ideal;
      } else if (h.t < 0.2) {
        this.vorOffset = ideal * 0.15; // VOR gain ~0.15: eyes travel with the head, off target
      } else {
        // corrective (overt) catch-up saccade back to the target
        const k = ss((h.t - 0.2) / 0.045);
        this.vorOffset = THREE.MathUtils.lerp(ideal * 0.15, ideal, k);
      }
    }

    // Jerk nystagmus: slow drift away, fast phase in the beat direction. Positive yaw = toward patient's LEFT.
    _solveNystagmus(gx, elapsed) {
      const v = this.pathology.vestibular;
      let beat = 0;
      let amp = 0;
      let freq = 2.6;
      if (v === 'peripheral_right' || v === 'peripheral_left') {
        // Unidirectional: beats AWAY from lesion in every gaze; Alexander's law (stronger looking toward fast phase)
        beat = v === 'peripheral_right' ? 1 : -1;
        amp = 0.034 * THREE.MathUtils.clamp(1 + 1.1 * gx * beat, 0.3, 2.1);
      } else if (v === 'central_left' || v === 'central_right') {
        // Gaze-evoked, direction-changing: beats toward the direction of gaze; minimal in primary position
        freq = 2.1;
        const ag = Math.abs(gx);
        if (ag > 0.25) {
          beat = Math.sign(gx);
          const c = THREE.MathUtils.clamp((ag - 0.25) / 0.5, 0, 1);
          amp = 0.05 * c * c * (3 - 2 * c);
        }
      }
      if (!beat || amp <= 0) {
        this.nystagmusOffset.yaw = 0;
        return;
      }
      const ph = (elapsed * freq) % 1;
      const w = ph < 0.84 ? (0.5 - ph / 0.84) : (-0.5 + (ph - 0.84) / 0.16);
      this.nystagmusOffset.yaw = beat * amp * w;
    }

    _computeMuscleActivities(gx, gy, conv) {
      const calcForEye = (side) => {
        const isRight = side === 'right';
        const abduct = isRight ? Math.max(0, -gx) : Math.max(0, gx);
        const adduct = isRight ? Math.max(0, gx) + conv : Math.max(0, -gx) + conv;
        const elev = Math.max(0, gy);
        const depr = Math.max(0, -gy);

        const abWeight = THREE.MathUtils.clamp(0.55 + (abduct - adduct) * 0.45, 0.15, 1.0);
        const adWeight = THREE.MathUtils.clamp(0.55 + (adduct - abduct) * 0.45, 0.15, 1.0);

        return {
          LR: THREE.MathUtils.clamp(0.15 + abduct * 0.85, 0, 1),
          MR: THREE.MathUtils.clamp(0.15 + adduct * 0.85, 0, 1),
          SR: THREE.MathUtils.clamp(0.1 + elev * abWeight * 0.95, 0, 1),
          IR: THREE.MathUtils.clamp(0.1 + depr * abWeight * 0.95, 0, 1),
          SO: THREE.MathUtils.clamp(0.1 + depr * adWeight * 0.95, 0, 1),
          IO: THREE.MathUtils.clamp(0.1 + elev * adWeight * 0.95, 0, 1)
        };
      };

      this.eomActivity.right = calcForEye('right');
      this.eomActivity.left = calcForEye('left');
    }

    _isMusclePalsied(side, code) {
      const p = this.pathology;
      if (side === 'right') {
        if (p.rightCN3 && (code === 'MR' || code === 'SR' || code === 'IR' || code === 'IO')) return true;
        if (p.rightCN4 && code === 'SO') return true;
        if (p.rightCN6 && code === 'LR') return true;
        if (p.rightINO && code === 'MR' && this.targetGaze.convergence < 0.3 && this.targetGaze.x > 0.1) return true;
      } else {
        if (p.leftCN3 && (code === 'MR' || code === 'SR' || code === 'IR' || code === 'IO')) return true;
        if (p.leftCN4 && code === 'SO') return true;
        if (p.leftCN6 && code === 'LR') return true;
        if (p.leftINO && code === 'MR' && this.targetGaze.convergence < 0.3 && this.targetGaze.x < -0.1) return true;
      }
      return false;
    }

    _alignCylinder(mesh, pA, pB, radiusScale) {
      const dir = new THREE.Vector3().subVectors(pB, pA);
      const len = dir.length();
      mesh.position.copy(pA).addScaledVector(dir, 0.5);
      mesh.scale.set(radiusScale, len, radiusScale);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    }

    _updateOrbitalMuscles3D(elapsed) {
      const redPulse = 0.55 + 0.45 * Math.sin(elapsed * 8);
      ['right', 'left'].forEach((side) => {
        const eye = this.eyes[side];
        const actMap = this.eomActivity[side];
        eye.globeGroup.updateMatrix();

        const isOpticLesion = (side === 'left' && this.pathology.leftRAPD) || (side === 'right' && this.pathology.rightRAPD);
        eye.opticMat.color.setHex(isOpticLesion ? 0xef4444 : 0xfef08a);
        eye.opticMat.emissive.setHex(isOpticLesion ? 0x991b1b : 0x713f12);
        eye.opticMat.emissiveIntensity = isOpticLesion ? (0.4 + 0.6 * redPulse) : 0.3;

        Object.keys(eye.muscles).forEach((code) => {
          const m = eye.muscles[code];
          const insInSocket = m.insertionLocal.clone().applyMatrix4(eye.globeGroup.matrix);
          const palsied = this._isMusclePalsied(side, code);
          const act = actMap[code];

          const thickness = palsied ? 0.72 : (0.85 + act * 0.62);
          if (m.via) {
            this._alignCylinder(m.seg1, m.origin, m.via, thickness);
            this._alignCylinder(m.seg2, m.via, insInSocket, thickness * 0.9);
          } else {
            this._alignCylinder(m.seg1, m.origin, insInSocket, thickness);
          }

          if (palsied) {
            m.mat.color.setHex(0xef4444);
            m.mat.emissive.setHex(0xdc2626);
            m.mat.emissiveIntensity = 0.4 + 0.7 * redPulse;
          } else {
            m.mat.color.copy(m.baseColor);
            m.mat.emissive.copy(m.baseColor);
            m.mat.emissiveIntensity = 0.12 + act * 0.85;
          }
        });
      });
    }

    // === PUPILLARY LIGHT REFLEX & SWINGING FLASHLIGHT (RAPD) ===
    _solvePupils(dt) {
      const p = this.pathology;

      if (this.swingActive) {
        this.swingTimer += dt;
        const phase = (this.swingTimer % 4.4);
        if (phase < 2.2) {
          this.penlightSide = 'right';
          this.penlightPos.lerp(new THREE.Vector3(-0.32, 0.34, 1.92), Math.min(1, dt * 12));
        } else {
          this.penlightSide = 'left';
          this.penlightPos.lerp(new THREE.Vector3(0.32, 0.34, 1.92), Math.min(1, dt * 12));
        }
      }

      this.penlightGroup.position.copy(this.penlightPos);
      this.penlightGroup.lookAt(this.penlightPos.x * 0.92, 0.34, 0.74);
      this.penSpot.position.copy(this.penlightPos);
      this.penSpotTarget.position.set(this.penlightPos.x * 0.92, 0.34, 0.74);
      this.penSpot.intensity = (this.activeTool === 'penlight' && this.penlightOn) ? 3.2 : 0;
      this.penlightBeam.visible = (this.activeTool === 'penlight' && this.penlightOn);

      let afferentSignal = 0;
      if (this.activeTool === 'penlight' && this.penlightOn) {
        if (this.penlightSide === 'right') afferentSignal = p.rightRAPD ? 0.22 : 1.0;
        else if (this.penlightSide === 'left') afferentSignal = p.leftRAPD ? 0.22 : 1.0;
      }
      const nearMiosis = this.targetGaze.convergence * 0.75;

      let targetR = 3.5 - afferentSignal * 1.6 - nearMiosis;
      let targetL = 3.5 - afferentSignal * 1.6 - nearMiosis;

      if (p.rightPupilBlown) targetR = 6.5;
      if (p.leftPupilBlown) targetL = 6.5;
      if (p.rightHorner) targetR = Math.min(targetR, 2.2 - afferentSignal * 0.35);
      if (p.leftHorner) targetL = Math.min(targetL, 2.2 - afferentSignal * 0.35);

      const speed = dt * 5.2;
      this.pupilRightMm = THREE.MathUtils.lerp(this.pupilRightMm, targetR, Math.min(1, speed));
      this.pupilLeftMm = THREE.MathUtils.lerp(this.pupilLeftMm, targetL, Math.min(1, speed));

      const sR = THREE.MathUtils.clamp(this.pupilRightMm / 3.5, 0.48, 1.92);
      const sL = THREE.MathUtils.clamp(this.pupilLeftMm / 3.5, 0.48, 1.92);
      this.eyes.right.pupil.scale.set(sR, sR, 1);
      this.eyes.left.pupil.scale.set(sL, sL, 1);
    }

    // === EYELIDS, FACE, ORAL CAVITY, PALATE, TONGUE & NECK ANIMATION ===
    _solveFaceAndNeck(dt, elapsed) {
      const p = this.pathology;
      const m = this.maneuver;
      const lerpF = Math.min(1, dt * 8.5);

      // Spontaneous blinking
      this.autoBlinkTimer -= dt;
      if (this.autoBlinkTimer <= 0) {
        this.autoBlinkTimer = 2.6 + Math.random() * 2.8;
        if (!p.rightCN7_LMN) m.blinkRight = 1.0;
        if (!p.leftCN7_LMN) m.blinkLeft = 1.0;
      }
      m.blinkRight = Math.max(0, m.blinkRight - dt * 5.5);
      m.blinkLeft = Math.max(0, m.blinkLeft - dt * 5.5);

      const calcUpperLid = (side) => {
        const isRight = side === 'right';
        const ptosis = isRight ? (p.rightPtosis || 0) : (p.leftPtosis || 0);
        const lifted = isRight ? this.liftRightLid : this.liftLeftLid;
        const lmn7 = isRight ? p.rightCN7_LMN : p.leftCN7_LMN;
        const mild7 = isRight ? p.rightCN7_mild : p.leftCN7_mild;
        const blink = isRight ? m.blinkRight : m.blinkLeft;

        // Lid follows the eye: lifts in upgaze, lowers in downgaze
        let openAngle = -0.50 - Math.max(0, this.targetGaze.y) * 0.42 + Math.max(0, -this.targetGaze.y) * 0.22;
        if (ptosis > 0 && !lifted) openAngle = THREE.MathUtils.lerp(openAngle, -0.06, ptosis);
        if (lifted) openAngle = -1.04;
        if (m.squeezeEyes > 0.1) {
          if (lmn7) return -0.54;
          if (mild7) return -0.20;
          return 0.05;
        }
        return THREE.MathUtils.lerp(openAngle, 0.03, blink);
      };

      this.eyes.right.upperLidPivot.rotation.x = THREE.MathUtils.lerp(this.eyes.right.upperLidPivot.rotation.x, calcUpperLid('right'), Math.min(1, dt * 14));
      this.eyes.left.upperLidPivot.rotation.x = THREE.MathUtils.lerp(this.eyes.left.upperLidPivot.rotation.x, calcUpperLid('left'), Math.min(1, dt * 14));

      // Eyebrows & Forehead Wrinkling (CN VII Forehead Sparing Rule!)
      const rBrowLift = m.raiseBrows * (p.rightCN7_LMN ? 0.0 : (p.rightCN7_mild ? 0.55 : 1.0));
      const lBrowLift = m.raiseBrows * (p.leftCN7_LMN ? 0.0 : (p.leftCN7_mild ? 0.55 : 1.0));
      this.rightBrow.position.y = THREE.MathUtils.lerp(this.rightBrow.position.y, rBrowLift * 0.09, lerpF);
      this.leftBrow.position.y = THREE.MathUtils.lerp(this.leftBrow.position.y, lBrowLift * 0.09, lerpF);
      this.rightWrinkles.userData.mat.opacity = THREE.MathUtils.lerp(this.rightWrinkles.userData.mat.opacity, rBrowLift * 0.55, lerpF);
      this.leftWrinkles.userData.mat.opacity = THREE.MathUtils.lerp(this.leftWrinkles.userData.mat.opacity, lBrowLift * 0.55, lerpF);

      // Smooth Lip Geometry Update (Smile, Facial Droop, Open Mouth, Jaw Deviation!)
      const rFaceWeak = p.rightCN7_LMN ? 1.0 : (p.rightCN7_UMN ? 0.85 : (p.rightCN7_mild ? 0.42 : 0));
      const lFaceWeak = p.leftCN7_LMN ? 1.0 : (p.leftCN7_UMN ? 0.85 : (p.leftCN7_mild ? 0.42 : 0));

      const targetSmileR = m.smile * (1 - rFaceWeak * 0.90);
      const targetSmileL = m.smile * (1 - lFaceWeak * 0.90);
      const targetOpen = m.jawOpen;
      const jawDevX = targetOpen * (p.rightCN5_motor ? -0.055 : (p.leftCN5_motor ? 0.055 : 0));

      const prevSum = this._curJawOpen + this._curSmileR + this._curSmileL + this._curDroopR + this._curDroopL;
      this._curJawOpen = THREE.MathUtils.lerp(this._curJawOpen, targetOpen, lerpF);
      this._curSmileR = THREE.MathUtils.lerp(this._curSmileR, targetSmileR, lerpF);
      this._curSmileL = THREE.MathUtils.lerp(this._curSmileL, targetSmileL, lerpF);
      this._curDroopR = THREE.MathUtils.lerp(this._curDroopR, rFaceWeak, lerpF);
      this._curDroopL = THREE.MathUtils.lerp(this._curDroopL, lFaceWeak, lerpF);
      const nextSum = this._curJawOpen + this._curSmileR + this._curSmileL + this._curDroopR + this._curDroopL;

      if (Math.abs(nextSum - prevSum) > 0.0008 || Math.abs(jawDevX) > 0.001) {
        this._rebuildLips(this._curJawOpen, this._curSmileR, this._curSmileL, this._curDroopR, this._curDroopL, jawDevX);
      }

      // Nasolabial folds
      this.nlfRight.material.opacity = (1 - rFaceWeak * 0.85) * (0.10 + m.smile * 0.35);
      this.nlfLeft.material.opacity = (1 - lFaceWeak * 0.85) * (0.10 + m.smile * 0.35);

      // Show illuminated oral cavity (palate, uvula, teeth, tongue) cleanly when mouth opens!
      const isOpen = this._curJawOpen > 0.14;
      this.oralInterior.visible = isOpen;
      this.oralLight.intensity = THREE.MathUtils.lerp(this.oralLight.intensity, isOpen ? 1.5 : 0, lerpF);

      // Soft Palate & Uvula (CN IX & X: Say "Ahh" -> uvula deviates AWAY from lesion!)
      const ahh = m.sayAhh;
      const rPalateLift = ahh * (p.rightCN9_10 ? 0.0 : 0.042);
      const lPalateLift = ahh * (p.leftCN9_10 ? 0.0 : 0.042);
      this.palateRight.position.y = THREE.MathUtils.lerp(this.palateRight.position.y, rPalateLift - (p.rightCN9_10 ? 0.028 : 0), lerpF);
      this.palateLeft.position.y = THREE.MathUtils.lerp(this.palateLeft.position.y, lPalateLift - (p.leftCN9_10 ? 0.028 : 0), lerpF);

      let uvulaTilt = 0;
      let uvulaShiftX = 0;
      if (p.rightCN9_10) {
        uvulaTilt = 0.50 * (0.45 + ahh * 0.80);
        uvulaShiftX = 0.042 * (0.45 + ahh * 0.80);
      } else if (p.leftCN9_10) {
        uvulaTilt = -0.50 * (0.45 + ahh * 0.80);
        uvulaShiftX = -0.042 * (0.45 + ahh * 0.80);
      }
      this.uvulaPivot.rotation.z = THREE.MathUtils.lerp(this.uvulaPivot.rotation.z, uvulaTilt, lerpF);
      this.uvulaPivot.position.x = THREE.MathUtils.lerp(this.uvulaPivot.position.x, uvulaShiftX, lerpF);
      this.uvulaPivot.position.y = THREE.MathUtils.lerp(this.uvulaPivot.position.y, 0.022 + Math.max(rPalateLift, lPalateLift) * 0.65, lerpF);

      // 3D Tongue Protrusion & Deviation (CN XII -> deviates TOWARD lesion!)
      const tOut = m.tongueOut;
      this.tonguePivot.position.z = THREE.MathUtils.lerp(this.tonguePivot.position.z, -0.21 + tOut * 0.24, lerpF);
      this.tonguePivot.position.y = THREE.MathUtils.lerp(this.tonguePivot.position.y, -0.105 - tOut * 0.015, lerpF);
      let tongueYaw = 0;
      if (p.rightCN12) tongueYaw = -0.38 * tOut;
      if (p.leftCN12) tongueYaw = 0.38 * tOut;
      this.tonguePivot.rotation.y = THREE.MathUtils.lerp(this.tonguePivot.rotation.y, tongueYaw, lerpF);

      // Resting tongue fasciculations if LMN CN XII
      if ((p.rightCN12 || p.leftCN12) && isOpen && tOut < 0.2) {
        this.tongueMesh.position.y = Math.sin(elapsed * 26) * 0.005;
      } else {
        this.tongueMesh.position.y = 0;
      }

      // Head Tilt (Bielschowsky) & Head Yaw (CN XI SCM!)
      this.headTiltDeg = THREE.MathUtils.lerp(this.headTiltDeg, this.targetHeadTiltDeg, lerpF);
      if (this.hit) this.headYawDeg = this.hitHeadYawDeg;
      else this.headYawDeg = THREE.MathUtils.lerp(this.headYawDeg, this.targetHeadYawDeg, lerpF);
      this.headGroup.rotation.z = THREE.MathUtils.degToRad(this.headTiltDeg);
      this.headGroup.rotation.y = THREE.MathUtils.degToRad(this.headYawDeg);

      const rightSCMEngaged = this.targetHeadYawDeg > 4 && !p.rightCN11;
      const leftSCMEngaged = this.targetHeadYawDeg < -4 && !p.leftCN11;
      this.rightSCM.scale.x = THREE.MathUtils.lerp(this.rightSCM.scale.x, rightSCMEngaged ? 1.45 : 1.0, lerpF);
      this.leftSCM.scale.x = THREE.MathUtils.lerp(this.leftSCM.scale.x, leftSCMEngaged ? 1.45 : 1.0, lerpF);
      this.rightSCMMat.emissive.setHex(rightSCMEngaged ? 0x0ea5e9 : (this.targetHeadYawDeg > 4 && p.rightCN11 ? 0xef4444 : 0x000000));
      this.rightSCMMat.emissiveIntensity = rightSCMEngaged ? 0.35 : (this.targetHeadYawDeg > 4 && p.rightCN11 ? 0.45 : 0);
      this.leftSCMMat.emissive.setHex(leftSCMEngaged ? 0x0ea5e9 : (this.targetHeadYawDeg < -4 && p.leftCN11 ? 0xef4444 : 0x000000));
      this.leftSCMMat.emissiveIntensity = leftSCMEngaged ? 0.35 : (this.targetHeadYawDeg < -4 && p.leftCN11 ? 0.45 : 0);

      const rShrugY = 0.16 + m.shrug * (p.rightCN11 ? 0.03 : 0.24) - (p.rightCN11 ? 0.07 : 0);
      const lShrugY = 0.16 + m.shrug * (p.leftCN11 ? 0.03 : 0.24) - (p.leftCN11 ? 0.07 : 0);
      this.rightShoulder.position.y = THREE.MathUtils.lerp(this.rightShoulder.position.y, rShrugY, lerpF);
      this.leftShoulder.position.y = THREE.MathUtils.lerp(this.leftShoulder.position.y, lShrugY, lerpF);

      // X-Ray Ghost Skin Opacity
      const targetOpacity = this.xrayMode ? 0.15 : 1.0;
      for (let i = 0; i < this.skinMaterials.length; i++) {
        const sm = this.skinMaterials[i];
        sm.opacity = THREE.MathUtils.lerp(sm.opacity, targetOpacity, Math.min(1, dt * 8));
        sm.depthWrite = sm.opacity > 0.65;
      }
      // The mouth cover overlaps the head; while the skin is translucent its outline would show.
      if (this.mouthCover) this.mouthCover.visible = this.headSkinMat.opacity > 0.9;
    }

    _updateCamera(dt) {
      const f = Math.min(1, dt * 6.5);
      this.camSpherical.theta = THREE.MathUtils.lerp(this.camSpherical.theta, this.desiredCam.theta, f);
      this.camSpherical.phi = THREE.MathUtils.lerp(this.camSpherical.phi, this.desiredCam.phi, f);
      this.camSpherical.radius = THREE.MathUtils.lerp(this.camSpherical.radius, this.desiredCam.radius, f);
      this.camTarget.lerp(this.desiredCam.target, f);

      const { theta, phi, radius } = this.camSpherical;
      this.camera.position.set(
        this.camTarget.x + radius * Math.sin(phi) * Math.sin(theta),
        this.camTarget.y + radius * Math.cos(phi),
        this.camTarget.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      this.camera.lookAt(this.camTarget);
    }

    _animate() {
      requestAnimationFrame(() => this._animate());
      const dt = Math.min(0.05, this.clock.getDelta());
      const elapsed = this.clock.elapsedTime;

      this._solveEyePhysics(dt, elapsed);
      this._solvePupils(dt);
      this._solveFaceAndNeck(dt, elapsed);
      this._updateCamera(dt);

      this.renderer.render(this.scene, this.camera);

      if (!this._lastEmit || elapsed - this._lastEmit > 0.07) {
        this._lastEmit = elapsed;
        this.onTelemetry({
          pupilRightMm: this.pupilRightMm,
          pupilLeftMm: this.pupilLeftMm,
          headTiltDeg: this.headTiltDeg,
          gaze: this.targetGaze,
          eyeAngles: this.eyeAngles,
          eomActivity: this.eomActivity,
          penlightSide: this.penlightOn ? this.penlightSide : null,
          coveredEye: this.coveredEye,
          headImpulseActive: !!this.hit
        });
      }
    }
  }

  return SimulatorScene;
})();

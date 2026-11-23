// Main application controller for NeuroSim 3D — Cranial Nerve Exam Simulator
(function () {
  const DATA = window.CN_DATA;

  const state = {
    mode: 'guided', // 'guided' | 'eyelab' | 'drills' | 'cases'
    selectedCN: 1,

    // Mode 1: Normal by default! User introduces nerve deficits intentionally or randomly.
    activeDeficits: new Set(),
    mysteryDeficit: null, // Holds a NERVE_DEFICITS object when randomized secretly
    mysteryRevealed: false,

    // Mode 2: Eye Lab starts NORMAL by default!
    eyeLabPreset: 'normal',
    eyeLabBlindMystery: null,
    eyeLabMysteryRevealed: false,
    selectedMuscle: 'SO',
    hintsSlowMo: true,

    // Mode 3: Drills state
    drillTab: 'sequence', // 'sequence' | 'flow' | 'quiz'
    seqNextIndex: 0,
    seqMistakes: 0,
    seqBank: [],
    quizIndex: 0,
    quizAnswered: null,
    quizScore: 0,

    // Mode 4: Cases state
    activeCaseIndex: 0,
    caseFindingsLog: [],
    caseSelectedNerves: new Set(),
    caseSelectedDiagnosis: null,
    caseSubmitted: false,
    solvedCases: new Set(JSON.parse(localStorage.getItem('neurosim_solved_cases') || '[]'))
  };

  // DOM References
  const rightPanel = document.getElementById('rightPanel');
  const hudPupilR = document.getElementById('hudPupilR');
  const hudPupilL = document.getElementById('hudPupilL');
  const hudHeadTilt = document.getElementById('hudHeadTilt');
  const hudActiveCasePill = document.getElementById('hudActiveCasePill');
  const hudActiveStatus = document.getElementById('hudActiveStatus');
  const findingToast = document.getElementById('findingToast');
  const toastTitle = document.getElementById('toastTitle');
  const toastBody = document.getElementById('toastBody');
  const casesSolvedBadge = document.getElementById('casesSolvedBadge');
  const headTiltSlider = document.getElementById('headTiltSlider');

  let scene3d = null;
  let toastTimer = null;

  function showToast(title, body, sticky = false) {
    toastTitle.textContent = title;
    toastBody.textContent = body;
    findingToast.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    if (!sticky) {
      toastTimer = setTimeout(() => findingToast.classList.add('hidden'), 6800);
    }
  }

  function logCaseFinding(entry) {
    if (state.mode !== 'cases') return;
    if (!state.caseFindingsLog.includes(entry)) {
      state.caseFindingsLog.unshift(entry);
      const ul = document.getElementById('caseFindingsList');
      if (ul) {
        ul.innerHTML = state.caseFindingsLog.map((f) => `<li>${escapeHtml(f)}</li>`).join('');
      }
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Gaze sweep for nystagmus inspection: left -> center -> right -> center
  let gazeSweepTimers = [];
  function cancelGazeSweep() {
    gazeSweepTimers.forEach((t) => clearTimeout(t));
    gazeSweepTimers = [];
  }
  function runGazeSweep() {
    cancelGazeSweep();
    const seq = [[0.75, 0], [0, 0], [-0.75, 0], [0, 0]];
    seq.forEach((g, i) => {
      gazeSweepTimers.push(setTimeout(() => scene3d.setGaze(g[0], g[1], 0), i * 2600));
    });
  }

  // What the examiner sees on cover / alternate cover in primary gaze
  function describeCoverTest(p, type) {
    if (p.skewLeftHypo || p.skewRightHypo) {
      const low = p.skewLeftHypo ? 'LEFT' : 'RIGHT';
      const high = low === 'LEFT' ? 'RIGHT' : 'LEFT';
      return `VERTICAL refixation: as the occluder moves, the uncovering ${high} eye moves DOWN and the uncovering ${low} eye moves UP to take up fixation. ${low} hypotropia = SKEW DEVIATION (central sign: "Refixation on Cover Test" in INFARCT).`;
    }
    if (p.rightCN3 || p.leftCN3) {
      const side = p.rightCN3 ? 'right' : 'left';
      return `The ${side} eye sits down-and-out (exo- and hypotropia). When the healthy eye is covered, the paretic ${side} eye cannot take up fixation (complete CN III palsy). Not a skew.`;
    }
    if (p.rightCN4 || p.leftCN4) {
      const side = p.rightCN4 ? 'RIGHT' : 'LEFT';
      return `${side} hypertropia: covering the fellow eye makes the ${side} eye move DOWN to fixate. Vertical deviation that worsens on contralateral gaze and ipsilateral head tilt = CN IV palsy (a vertical tropia is not automatically skew — check the 3-step test).`;
    }
    if (p.rightCN6 || p.leftCN6) {
      const side = p.rightCN6 ? 'RIGHT' : 'LEFT';
      return `${side} esotropia: covering the fellow eye makes the ${side} eye move OUT (abduct) to fixate. Horizontal refixation only — no vertical (skew) component.`;
    }
    return type === 'cover_alt'
      ? 'No refixation movement of either eye as the occluder alternates: orthophoric, NO skew deviation (peripheral-compatible).'
      : 'Uncovered eye stays steady on target: no manifest tropia.';
  }

  function updateSolvedBadge() {
    casesSolvedBadge.textContent = `${state.solvedCases.size}/${DATA.CLINICAL_CASES.length}`;
  }

  // Merge all active custom deficits (or mystery deficit) into scene3d.pathology
  function applySandboxDeficits() {
    const merged = {};
    if (state.mysteryDeficit) {
      Object.assign(merged, state.mysteryDeficit.state);
    } else {
      state.activeDeficits.forEach((id) => {
        const def = DATA.NERVE_DEFICITS.find((d) => d.id === id);
        if (def) Object.assign(merged, def.state);
      });
    }
    scene3d.setPathology(merged);
    headTiltSlider.value = -(merged.defaultHeadTilt || 0);
    syncLidButtons();
  }

  // === INITIALIZE 3D ENGINE ===
  function init3D() {
    const container = document.getElementById('scene3dContainer');
    if (typeof window.THREE === 'undefined') {
      container.innerHTML = '<div style="padding:28px;color:#fda4af;font-size:14px;">Unable to load Three.js (js/vendor/three.min.js). Make sure the js/vendor folder sits next to index.html.</div>';
      return;
    }
    scene3d = new window.CNScene3D(container, onTelemetry);
  }

  function onTelemetry(t) {
    hudPupilR.textContent = t.pupilRightMm.toFixed(1);
    hudPupilL.textContent = t.pupilLeftMm.toFixed(1);

    const deg = Math.round(t.headTiltDeg);
    if (Math.abs(deg) <= 1) hudHeadTilt.textContent = '0° Neutral';
    else if (deg > 0) hudHeadTilt.textContent = `${deg}° Right Tilt`;
    else hudHeadTilt.textContent = `${Math.abs(deg)}° Left Tilt`;

    if (state.mode === 'eyelab') {
      updateEyeLabTelemetry(t);
    }
  }

  // === BEDSIDE MANEUVER DISPATCHER ===
  function performManeuver(type) {
    const p = scene3d.pathology || {};
    scene3d.setShowDermatomes(false);

    if (type === 'smell') {
      const r = (p.smell && p.smell.right) || 'Normal (identifies coffee)';
      const l = (p.smell && p.smell.left) || 'Normal (identifies coffee)';
      const msg = `Right nostril: ${r}\nLeft nostril: ${l}`;
      showToast('CN I — Olfaction Test', msg);
      logCaseFinding(`CN I Smell: R ${r}, L ${l}`);
      return;
    }

    if (type === 'fields') {
      const acR = (p.acuity && p.acuity.right) || '20/20';
      const acL = (p.acuity && p.acuity.left) || (p.leftAcuity || '20/20');
      const fR = (p.fields && p.fields.right) || 'Full to confrontation';
      const fL = (p.fields && p.fields.left) || (p.leftFieldDefect === 'central_scotoma' ? 'Dense central scotoma' : 'Full to confrontation');
      const fnR = (p.fundus && p.fundus.right) || 'Sharp pink optic disc, normal cup';
      const fnL = (p.fundus && p.fundus.left) || (p.fundusLeft || 'Sharp pink optic disc, normal cup');
      const msg = `Acuity: OD ${acR} | OS ${acL}\nVisual Fields: OD ${fR} | OS ${fL}\nFundoscopy: OD ${fnR} | OS ${fnL}`;
      showToast('CN II — Visual Acuity, Fields & Fundoscopy', msg, true);
      logCaseFinding(`CN II: Acuity OD ${acR}/OS ${acL}; Fields OD ${fR}/OS ${fL}; Fundus OD ${fnR}/OS ${fnL}`);
      return;
    }

    // === HINTS (acute vestibular syndrome): Head Impulse, Nystagmus, Test of Skew ===
    if (type === 'hit_right' || type === 'hit_left') {
      const dir = type === 'hit_right' ? 'right' : 'left';
      cancelGazeSweep();
      scene3d.setCover('none');
      scene3d.setCameraPreset('eyes');
      scene3d.startHeadImpulse(dir);
      syncToolButtons();
      const v = p.vestibular;
      const lesionSide = v === 'peripheral_right' ? 'right' : (v === 'peripheral_left' ? 'left' : null);
      let msg;
      if (lesionSide === dir) {
        msg = `Rapid head thrust to the patient's ${dir.toUpperCase()}: the eyes move WITH the head, then a corrective CATCH-UP SACCADE brings them back to the target. ABNORMAL impulse = ${dir} peripheral vestibular hypofunction (reassuring in AVS).`;
      } else if (lesionSide) {
        msg = `Rapid head thrust to the patient's ${dir.toUpperCase()}: eyes stay locked on target, no corrective saccade (normal VOR toward the healthy side). Now test the other direction.`;
      } else if (v && v.indexOf('central') === 0) {
        msg = `Rapid head thrust to the patient's ${dir.toUpperCase()}: eyes stay locked on target — NORMAL impulse. In a patient with continuous acute vertigo, a normal impulse is a DANGEROUS (central) sign: "Impulse Normal" in INFARCT.`;
      } else {
        msg = `Rapid head thrust to the patient's ${dir.toUpperCase()}: eyes stay locked on target, no catch-up saccade (normal VOR). Remember: HINTS is only interpreted in acute continuous vertigo with spontaneous nystagmus.`;
      }
      showToast(`HINTS — Head Impulse (${dir === 'right' ? 'to R' : 'to L'})`, msg, true);
      logCaseFinding(`Head Impulse to ${dir.toUpperCase()}: ${lesionSide === dir ? 'ABNORMAL (catch-up saccade)' : 'Normal (no catch-up saccade)'}`);
      return;
    }

    if (type === 'hints_nystagmus') {
      scene3d.setCover('none');
      scene3d.setCameraPreset('eyes');
      runGazeSweep();
      syncToolButtons();
      const v = p.vestibular;
      let msg;
      if (v === 'peripheral_right' || v === 'peripheral_left') {
        const beat = v === 'peripheral_right' ? 'LEFT' : 'RIGHT';
        msg = `Spontaneous horizontal(-torsional) ${beat}-beating nystagmus in primary gaze. It INCREASES looking ${beat} and decreases — but stays ${beat}-beating — looking the other way (unidirectional, Alexander law). Peripheral pattern. Suppressed by visual fixation.`;
      } else if (v === 'central_left' || v === 'central_right') {
        msg = 'Little nystagmus in primary gaze, but RIGHT-beating on right gaze and LEFT-beating on left gaze: gaze-evoked, DIRECTION-CHANGING nystagmus = CENTRAL sign ("Fast-phase Alternating" in INFARCT).';
      } else {
        msg = 'No spontaneous or gaze-evoked nystagmus (a few unsustained beats at extreme end-gaze can be physiologic).';
      }
      showToast('HINTS — Nystagmus (gaze L → center → R)', msg, true);
      logCaseFinding(`Nystagmus: ${v === 'peripheral_right' ? 'Unidirectional left-beating' : v === 'peripheral_left' ? 'Unidirectional right-beating' : (v && v.indexOf('central') === 0) ? 'Direction-changing gaze-evoked' : 'None'}`);
      return;
    }

    if (type === 'cover_alt' || type === 'cover_right' || type === 'cover_left' || type === 'uncover') {
      cancelGazeSweep();
      if (type === 'uncover') {
        scene3d.setCover('none');
        showToast('Cover Test', 'Occluder removed.');
        return;
      }
      scene3d.setCameraPreset('eyes');
      scene3d.setGaze(0, 0, 0);
      scene3d.setCover(type === 'cover_alt' ? 'alternate' : (type === 'cover_right' ? 'right' : 'left'));
      syncToolButtons();
      const msg = describeCoverTest(p, type);
      showToast(type === 'cover_alt' ? 'HINTS — Test of Skew (Alternate Cover)' : `Cover Test (${type === 'cover_right' ? 'OD' : 'OS'} covered)`, msg, true);
      logCaseFinding(`Cover test: ${msg}`);
      return;
    }

    if (type === 'v_sensory') {
      scene3d.setCameraPreset('front');
      scene3d.setShowDermatomes(true);
      let msg = 'Symmetric light touch & pinprick across V1 (forehead), V2 (cheek), and V3 (jaw) bilaterally.';
      if (p.rightCN5_sensory) {
        msg = 'REDUCED light touch & pinprick across RIGHT V1 and V2 dermatomes (forehead & cheek). Left side normal.';
      } else if (p.leftCN5_sensory) {
        msg = 'REDUCED light touch & pinprick across LEFT V1–V3 dermatomes. Right side normal.';
      }
      showToast('CN V — Facial Sensation (V1/V2/V3)', msg);
      logCaseFinding(`CN V Sensation: ${msg}`);
      return;
    }

    if (type === 'corneal_right' || type === 'corneal_left') {
      scene3d.triggerManeuver(type);
      const isRight = type === 'corneal_right';
      const affIntact = isRight ? !p.rightCN5_sensory : !p.leftCN5_sensory;
      const effR = !p.rightCN7_LMN;
      const effL = !p.leftCN7_LMN;
      let msg = '';
      if (!affIntact) {
        msg = `Touching ${isRight ? 'RIGHT' : 'LEFT'} cornea: NO direct blink AND NO consensual blink (CN V1 afferent lesion on ${isRight ? 'right' : 'left'}!).`;
      } else if (!effR && effL) {
        msg = `Touching ${isRight ? 'RIGHT' : 'LEFT'} cornea: Right eye fails to blink, LEFT eye blinks briskly (Right CN VII efferent lesion; V1 afferent intact!).`;
      } else if (effR && !effL) {
        msg = `Touching ${isRight ? 'RIGHT' : 'LEFT'} cornea: Left eye fails to blink, RIGHT eye blinks briskly (Left CN VII efferent lesion).`;
      } else {
        msg = `Touching ${isRight ? 'RIGHT' : 'LEFT'} cornea: Brisk bilateral direct & consensual blink (CN V1 afferent + bilateral CN VII efferent intact).`;
      }
      showToast(`Corneal Reflex (${isRight ? 'OD Right' : 'OS Left'})`, msg);
      logCaseFinding(`Corneal (${isRight ? 'R' : 'L'}): ${msg}`);
      return;
    }

    if (type === 'jaw_open') {
      scene3d.triggerManeuver('jaw_open');
      let msg = 'Jaw opens straight midline; masseter and temporalis bulk symmetric on clench.';
      if (p.rightCN5_motor) msg = 'Jaw deviates to the RIGHT (toward lesion!) on opening; weak right masseter.';
      else if (p.leftCN5_motor) msg = 'Jaw deviates to the LEFT (toward lesion!) on opening; weak left masseter.';
      showToast('CN V3 — Muscles of Mastication', msg);
      logCaseFinding(`CN V3 Motor: ${msg}`);
      return;
    }

    if (type === 'raise_brows') {
      scene3d.triggerManeuver('raise_brows');
      let msg = 'Both eyebrows elevate symmetrically with equal forehead wrinkling.';
      if (p.rightCN7_LMN) msg = 'RIGHT forehead remains completely smooth and brow fails to elevate! (Upper face INVOLVED -> LMN CN VII).';
      else if (p.rightCN7_UMN) msg = 'FOREHEAD SPARING! Both eyebrows elevate symmetrically despite lower facial droop (-> UMN central lesion!).';
      else if (p.rightCN7_mild) msg = 'Mildly reduced right eyebrow elevation and shallower right forehead creases.';
      showToast('CN VII — Raise Eyebrows (Forehead Test)', msg);
      logCaseFinding(`CN VII Forehead: ${msg}`);
      return;
    }

    if (type === 'close_eyes') {
      scene3d.triggerManeuver('close_eyes');
      let msg = 'Bilateral eyes squeeze tightly shut against resistance (eyelashes buried).';
      if (p.rightCN7_LMN) msg = 'RIGHT eye fails to close completely (lagophthalmos, sclera exposed) — orbicularis oculi paralyzed!';
      else if (p.rightCN7_mild) msg = 'Slightly weaker right eye closure (eyelashes less buried on right).';
      showToast('CN VII — Forced Eye Closure', msg);
      logCaseFinding(`CN VII Eye Closure: ${msg}`);
      return;
    }

    if (type === 'smile_test') {
      scene3d.triggerManeuver('smile_test');
      let msg = 'Symmetric smile with equal nasolabial folds bilaterally.';
      if (p.rightCN7_LMN || p.rightCN7_UMN) {
        msg = 'Marked RIGHT lower facial droop & flattened right nasolabial fold; mouth pulls toward the healthy LEFT side.';
      } else if (p.rightCN7_mild) {
        msg = 'Subtle right lower facial asymmetry and mild flattening of the right nasolabial fold.';
      }
      showToast('CN VII — Smile / Lower Face', msg);
      logCaseFinding(`CN VII Smile: ${msg}`);
      return;
    }

    if (type === 'weber_rinne') {
      scene3d.setCameraPreset('front');
      const h = p.hearing || {
        right: p.rightCN8_SNHL ? 'Markedly reduced' : 'Normal',
        left: 'Normal',
        weber: p.rightCN8_SNHL ? 'Lateralizes to LEFT (normal ear)' : 'Midline (equal both ears)',
        rinneR: p.rightCN8_SNHL ? 'AC > BC (both diminished)' : 'AC > BC (Normal)',
        rinneL: 'AC > BC (Normal)'
      };
      const msg = `Finger Rub: Right = ${h.right} | Left = ${h.left}\n512 Hz Weber: ${h.weber}\n512 Hz Rinne: Right ${h.rinneR} | Left ${h.rinneL}`;
      showToast('CN VIII — Auditory & 512 Hz Tuning Fork', msg, true);
      logCaseFinding(`CN VIII Hearing: R ${h.right}, Weber ${h.weber}, Rinne R ${h.rinneR}`);
      return;
    }

    if (type === 'say_ahh') {
      scene3d.triggerManeuver('say_ahh');
      let msg = 'Soft palate arches elevate symmetrically; uvula stays strictly midline. Voice clear.';
      if (p.rightCN9_10) {
        msg = 'RIGHT soft palate droops and fails to rise; UVULA DEVIATES TO THE LEFT (away from right CN X lesion!). Absent right gag; hoarse voice.';
      }
      showToast('CN IX & X — Soft Palate & Uvula ("Say Ahh")', msg);
      logCaseFinding(`CN IX/X Palate: ${msg}`);
      return;
    }

    if (type === 'head_turn_left') {
      scene3d.triggerManeuver('head_turn_left');
      let msg = 'Strong head turn to the LEFT against resistance — RIGHT Sternocleidomastoid (SCM) bulges firmly (5/5).';
      if (p.rightCN11) msg = 'WEAK head turn to the LEFT (2/5) — RIGHT Sternocleidomastoid fails to contract! (Right CN XI lesion).';
      showToast('CN XI — Turn Head LEFT (Tests RIGHT SCM!)', msg);
      logCaseFinding(`CN XI Right SCM (turn L): ${msg}`);
      return;
    }

    if (type === 'head_turn_right') {
      scene3d.triggerManeuver('head_turn_right');
      let msg = 'Strong head turn to the RIGHT against resistance — LEFT Sternocleidomastoid (SCM) bulges firmly (5/5).';
      if (p.leftCN11) msg = 'WEAK head turn to the RIGHT (2/5) — LEFT SCM weak.';
      showToast('CN XI — Turn Head RIGHT (Tests LEFT SCM!)', msg);
      logCaseFinding(`CN XI Left SCM (turn R): ${msg}`);
      return;
    }

    if (type === 'shrug_shoulders') {
      scene3d.triggerManeuver('shrug_shoulders');
      let msg = 'Symmetric strong bilateral shoulder shrug (Trapezius 5/5).';
      if (p.rightCN11) msg = 'RIGHT shoulder droops and fails to elevate against resistance (Right Trapezius 2/5 -> Right CN XI lesion).';
      showToast('CN XI — Shoulder Shrug (Ipsilateral Trapezius)', msg);
      logCaseFinding(`CN XI Trapezius: ${msg}`);
      return;
    }

    if (type === 'tongue_out') {
      scene3d.triggerManeuver('tongue_out');
      let msg = 'Tongue protrudes straight midline; no atrophy or resting fasciculations.';
      if (p.rightCN12) msg = 'Tongue protrudes and DEVIATES TO THE RIGHT ("licks the lesion" -> Right CN XII!). Mild right hemiglossal atrophy & fasciculations.';
      showToast('CN XII — Tongue Protrusion', msg);
      logCaseFinding(`CN XII Tongue: ${msg}`);
    }
  }

  // === MODE 1: GUIDED CN I-XII EXAM + NERVE-BY-NERVE DEFICIT SANDBOX ===
  function renderGuidedMode() {
    const cn = DATA.CRANIAL_NERVES.find((c) => c.num === state.selectedCN) || DATA.CRANIAL_NERVES[0];

    let bannerHtml = '';
    if (state.mysteryDeficit) {
      hudActiveCasePill.style.display = 'flex';
      hudActiveStatus.textContent = state.mysteryRevealed ? 'Mystery Revealed' : 'Mystery Deficit (Hidden)';
      bannerHtml = `
        <div class="status-banner status-mystery">
          <span>🎲 ${state.mysteryRevealed ? `Revealed: ${state.mysteryDeficit.short}` : 'Random Mystery Deficit Active (Hidden!)'}</span>
          ${!state.mysteryRevealed ? '<button class="btn btn-sm btn-primary" id="btnRevealMystery">👁 Reveal</button>' : ''}
        </div>
        ${state.mysteryRevealed ? `
          <div class="callout callout-tip" style="margin-top:8px;">
            <strong>${state.mysteryDeficit.title}</strong>
            ${state.mysteryDeficit.explanation}<br/>
            <span style="color:#a7f3d0; font-size:11.8px; display:block; margin-top:4px;"><b>Confirm with:</b> ${state.mysteryDeficit.howToTest}</span>
          </div>
        ` : `
          <p style="font-size:11.8px; color:#cbd5e1; margin-top:6px;">
            Examine the 3D patient from CN I–XII using the Target (H-test), Convergence, Penlight (Swing Light), Head Tilt, and Bedside Maneuvers below to discover which nerve is abnormal!
          </p>
        `}
      `;
    } else if (state.activeDeficits.size > 0) {
      hudActiveCasePill.style.display = 'flex';
      hudActiveStatus.textContent = `${state.activeDeficits.size} Custom Deficit(s)`;
      const labels = Array.from(state.activeDeficits)
        .map((id) => DATA.NERVE_DEFICITS.find((d) => d.id === id)?.short)
        .filter(Boolean)
        .join(' + ');
      bannerHtml = `
        <div class="status-banner status-abnormal">
          <span>Active Abnormalities: ${labels}</span>
        </div>
      `;
    } else {
      hudActiveCasePill.style.display = 'none';
      bannerHtml = `
        <div class="status-banner status-normal">
          <span>✓ Normal Baseline Exam (All CN I–XII Intact)</span>
        </div>
      `;
    }

    rightPanel.innerHTML = `
      <div class="section-head">
        <h2>Guided Exam &amp; Deficit Sandbox</h2>
        <div class="btn-row" style="margin:0;">
          <button class="btn btn-sm" id="btnResetNormal">✓ Reset Normal</button>
          <button class="btn btn-sm btn-primary" id="btnRandomMystery">🎲 Random Mystery</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Introduce Abnormalities (Nerve-by-Nerve)</span>
          <span>Click to toggle on/off</span>
        </div>
        ${bannerHtml}
        ${!state.mysteryDeficit || state.mysteryRevealed ? `
          <div class="deficit-grid">
            ${DATA.NERVE_DEFICITS.map((def) => {
              const isOn = state.mysteryDeficit
                ? (state.mysteryDeficit.id === def.id)
                : state.activeDeficits.has(def.id);
              return `
                <button class="deficit-chip ${isOn ? 'active' : ''}" data-defid="${def.id}" title="${def.howToTest}">
                  ${isOn ? '● ' : ''}${def.short}
                </button>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>

      <div class="card">
        <div class="card-title">
          <span>CN I–XII Reference &amp; Technique</span>
          <div style="display:flex; gap:4px;">
            <button class="btn btn-sm" id="btnPrevCN" ${cn.num === 1 ? 'disabled' : ''}>←</button>
            <button class="btn btn-sm" id="btnNextCN" ${cn.num === 12 ? 'disabled' : ''}>→</button>
          </div>
        </div>
        <div class="cn-grid">
          ${DATA.CRANIAL_NERVES.map((item) => `
            <button class="cn-pill ${item.num === cn.num ? 'active' : ''}" data-cn="${item.num}">
              <span class="roman">${item.roman}</span>
              <span class="mod-dot mod-${item.modality}">${item.modality}</span>
            </button>
          `).join('')}
        </div>

        <div class="section-head" style="margin-top:12px; margin-bottom:6px;">
          <h3 style="color:var(--cyan); font-size:15px;">CN ${cn.roman} — ${cn.name} Nerve</h3>
          <span class="mod-dot mod-${cn.modality}" style="padding:2px 8px; font-size:10.5px;">${cn.modalityLabel}</span>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span>Brainstem / CNS Origin</span>
            <strong>${cn.brainstem}</strong>
          </div>
          <div class="meta-item">
            <span>Skull Base Exit</span>
            <strong>${cn.foramen}</strong>
          </div>
        </div>

        <div class="callout callout-info">
          <strong>Bedside Technique (How to Do It Properly)</strong>
          ${cn.bedsideTest}
        </div>

        <div class="callout callout-warn">
          <strong>⚠ Common Physician Mistake</strong>
          ${cn.commonMistake}
        </div>

        <div style="margin-top:10px;">
          <div class="card-title">Clinical Pearls</div>
          <ul class="pearl-list">
            ${cn.clinicalPearls.map((pl) => `<li>${pl}</li>`).join('')}
          </ul>
        </div>

        <div class="btn-row" style="margin-top:12px;">
          ${getGuidedPracticeButtons(cn.num)}
        </div>
      </div>
    `;

    // Bind Reset Normal & Random Mystery
    document.getElementById('btnResetNormal')?.addEventListener('click', () => {
      state.activeDeficits.clear();
      state.mysteryDeficit = null;
      state.mysteryRevealed = false;
      applySandboxDeficits();
      scene3d.setCameraPreset('front');
      showToast('Normal Baseline Restored', 'All Cranial Nerves I–XII are now completely normal.');
      renderGuidedMode();
    });

    document.getElementById('btnRandomMystery')?.addEventListener('click', () => {
      state.activeDeficits.clear();
      const pick = DATA.NERVE_DEFICITS[Math.floor(Math.random() * DATA.NERVE_DEFICITS.length)];
      state.mysteryDeficit = pick;
      state.mysteryRevealed = false;
      applySandboxDeficits();
      scene3d.setXRay(false);
      syncXrayBtn();
      scene3d.setCameraPreset('front');
      showToast('🎲 Random Mystery Deficit Loaded', 'One cranial nerve deficit has been secretly introduced. Examine the 3D patient to find it, then click Reveal!');
      renderGuidedMode();
    });

    document.getElementById('btnRevealMystery')?.addEventListener('click', () => {
      state.mysteryRevealed = true;
      renderGuidedMode();
    });

    // Bind Nerve-by-Nerve Deficit Chips
    rightPanel.querySelectorAll('.deficit-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const id = chip.dataset.defid;
        state.mysteryDeficit = null;
        state.mysteryRevealed = false;
        if (state.activeDeficits.has(id)) {
          state.activeDeficits.delete(id);
        } else {
          // Mutually exclusive LMN vs UMN CN VII on same side
          if (id === 'cn7_lmn_right') state.activeDeficits.delete('cn7_umn_right');
          if (id === 'cn7_umn_right') state.activeDeficits.delete('cn7_lmn_right');
          state.activeDeficits.add(id);
          const def = DATA.NERVE_DEFICITS.find((d) => d.id === id);
          if (def) {
            showToast(`Introduced: ${def.short}`, `${def.howToTest}\n\n${def.explanation}`, false);
          }
        }
        applySandboxDeficits();
        renderGuidedMode();
      });
    });

    // Bind CN selector pills (does NOT overwrite user's chosen deficits!)
    rightPanel.querySelectorAll('.cn-pill').forEach((btn) => {
      btn.addEventListener('click', () => selectGuidedCN(Number(btn.dataset.cn)));
    });
    document.getElementById('btnPrevCN')?.addEventListener('click', () => {
      if (state.selectedCN > 1) selectGuidedCN(state.selectedCN - 1);
    });
    document.getElementById('btnNextCN')?.addEventListener('click', () => {
      if (state.selectedCN < 12) selectGuidedCN(state.selectedCN + 1);
    });

    // Bind Practice Maneuver Buttons (runs on current patient state!)
    rightPanel.querySelectorAll('[data-practice]').forEach((btn) => {
      btn.addEventListener('click', () => runPracticeManeuver(btn.dataset.practice));
    });
  }

  function getGuidedPracticeButtons(num) {
    const map = {
      1: `<button class="btn btn-primary" data-practice="smell">Test Smell (CN I)</button>`,
      2: `<button class="btn btn-primary" data-practice="swing_light">Swinging Flashlight (RAPD)</button>
          <button class="btn" data-practice="fields">Check Visual Fields & Fundus</button>`,
      3: `<button class="btn btn-primary" data-practice="auto_h">Run H-Test</button>
          <button class="btn" data-practice="convergence">Test Convergence</button>
          <button class="btn" data-practice="open_eyelab">Open Eye Muscle Lab →</button>`,
      4: `<button class="btn btn-primary" data-practice="look_down_in">Test Down & In (OD SO)</button>
          <button class="btn" data-practice="xray_on">Inspect 3D Superior Oblique Trochlea</button>`,
      5: `<button class="btn btn-primary" data-practice="v_sensory">Test V1–V3 Touch</button>
          <button class="btn" data-practice="corneal_right">Corneal Reflex (R)</button>
          <button class="btn" data-practice="jaw_open">Open Jaw (V3)</button>`,
      6: `<button class="btn btn-primary" data-practice="auto_h">Run H-Test (Lateral Gaze)</button>`,
      7: `<button class="btn btn-primary" data-practice="raise_brows">Raise Eyebrows</button>
          <button class="btn" data-practice="close_eyes">Squeeze Eyes</button>
          <button class="btn" data-practice="smile_test">Smile</button>`,
      8: `<button class="btn btn-primary" data-practice="weber_rinne">512 Hz Weber & Rinne</button>
          <button class="btn" data-practice="hit_right">HINTS: Head Impulse R</button>
          <button class="btn" data-practice="hints_nystagmus">HINTS: Nystagmus</button>
          <button class="btn" data-practice="cover_alt">HINTS: Alternate Cover</button>`,
      9: `<button class="btn btn-primary" data-practice="say_ahh">Inspect Palate & Uvula ("Say Ahh")</button>`,
      10: `<button class="btn btn-primary" data-practice="say_ahh">Inspect Palate & Uvula ("Say Ahh")</button>`,
      11: `<button class="btn btn-primary" data-practice="head_turn_left">Turn Head LEFT (R SCM)</button>
           <button class="btn" data-practice="shrug_shoulders">Shrug Shoulders (Trapezius)</button>`,
      12: `<button class="btn btn-primary" data-practice="tongue_out">Protrude Tongue (CN XII)</button>
           <button class="btn" data-practice="jaw_open">Inspect Resting Tongue</button>`
    };
    return map[num] || '';
  }

  function selectGuidedCN(num) {
    state.selectedCN = num;
    const cn = DATA.CRANIAL_NERVES.find((c) => c.num === num);
    scene3d.resetManeuvers();
    scene3d.setCameraPreset(cn.camera || 'front');
    if (cn.camera === 'mouth') {
      scene3d.maneuver.jawOpen = 1;
      scene3d.maneuver.sayAhh = 0.25;
    }
    renderGuidedMode();
  }

  function runPracticeManeuver(action) {
    if (action === 'open_eyelab') {
      switchMode('eyelab');
      return;
    }
    if (action === 'auto_h') {
      scene3d.setCameraPreset('eyes');
      scene3d.startAutoHTest();
      return;
    }
    if (action === 'convergence') {
      scene3d.setCameraPreset('eyes');
      scene3d.triggerConvergence();
      return;
    }
    if (action === 'swing_light') {
      scene3d.startSwingingFlashlight();
      syncToolButtons();
      return;
    }
    if (action === 'look_down_in') {
      scene3d.setCameraPreset('eyes');
      scene3d.setGaze(1, -0.95, 0);
      return;
    }
    if (action === 'xray_on') {
      scene3d.setCameraPreset('xray');
      syncXrayBtn();
      return;
    }
    performManeuver(action);
  }

  // === MODE 2: EYE MUSCLE MASTERY LAB (STARTS NORMAL BY DEFAULT!) ===
  function renderEyeLabMode() {
    const presets = Object.values(DATA.PATHOLOGY_PRESETS).filter((p) => p.eyeLab);
    const active = state.eyeLabBlindMystery
      ? state.eyeLabBlindMystery
      : (DATA.PATHOLOGY_PRESETS[state.eyeLabPreset] || DATA.PATHOLOGY_PRESETS.normal);
    const muscleInfo = DATA.EOM_MUSCLES[state.selectedMuscle];
    const isHidden = state.eyeLabBlindMystery && !state.eyeLabMysteryRevealed;

    if (isHidden) {
      hudActiveCasePill.style.display = 'flex';
      hudActiveStatus.textContent = 'Blind Eye Palsy Drill';
    } else {
      hudActiveCasePill.style.display = 'none';
    }

    rightPanel.innerHTML = `
      <div class="section-head">
        <h2>Eye Muscle Mastery Lab</h2>
        <div class="btn-row" style="margin:0;">
          <button class="btn btn-sm" id="btnLabXray">⚡ X-Ray</button>
          <button class="btn btn-sm btn-primary" id="btnRandomEye">🎲 Random Eye</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Select Eye State (Normal by Default)</span>
          ${isHidden ? '<button class="btn btn-sm btn-emerald" id="btnRevealEye">👁 Reveal Answer</button>' : ''}
        </div>

        ${isHidden ? `
          <div class="status-banner status-mystery" style="margin-bottom:8px;">
            <span>🎲 Mystery Eye Deficit Active — Examine H-Test, Convergence, Penlight &amp; Head Tilt!</span>
          </div>
        ` : `
          <div class="preset-grid">
            ${presets.map((pr) => `
              <button class="preset-btn ${pr.id === active.id ? 'active' : ''}" data-preset="${pr.id}">
                ${pr.shortLabel}
              </button>
            `).join('')}
          </div>

          <div class="callout ${active.id === 'normal' ? 'callout-tip' : 'callout-info'}" style="margin-top:11px;">
            <strong>${active.title}</strong>
            ${active.description}
          </div>
          <div class="callout callout-tip" style="margin-top:8px;">
            <strong>Neuroanatomical Mechanism</strong>
            ${active.keyMechanism}
          </div>
        `}
      </div>

      <div class="card">
        <div class="card-title">
          <span>Patient's Subjective Diplopia View</span>
          <span style="color:var(--amber); font-size:10.5px;">Live Double-Vision Simulator</span>
        </div>
        <canvas id="diplopiaCanvas" class="diplopia-canvas" width="380" height="120"></canvas>
        <p style="font-size:11.8px; color:var(--text-dim); margin-top:6px;">
          <strong style="color:var(--cyan);">Cyan</strong> = Right Eye (OD) image ·
          <strong style="color:var(--rose);">Red</strong> = Left Eye (OS) image.
          ${isHidden ? 'Watch how images separate in different directions of gaze!' : active.diplopiaNote}
        </p>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Live 12-Muscle Contraction Telemetry</span>
          <span>${isHidden ? 'Active Recruitment' : 'Red = Palsied'}</span>
        </div>
        <div class="eom-bars-wrap">
          <div class="eom-col">
            <h4>Right Eye (OD)</h4>
            ${renderMuscleBarSkeleton('right')}
          </div>
          <div class="eom-col">
            <h4>Left Eye (OS)</h4>
            ${renderMuscleBarSkeleton('left')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>HINTS Exam — Acute Vestibular Syndrome</span>
          <label style="font-size:10.5px; color:var(--text-dim); display:flex; gap:5px; align-items:center; text-transform:none; letter-spacing:0;">
            <input type="checkbox" id="chkHitSlow" ${state.hintsSlowMo ? 'checked' : ''}/> Slow-motion impulse
          </label>
        </div>
        <div class="btn-row" style="margin-top:0;">
          <button class="btn btn-sm" data-hints="hit_right">⇠ Head Impulse to R</button>
          <button class="btn btn-sm" data-hints="hit_left">Head Impulse to L ⇢</button>
          <button class="btn btn-sm" data-hints="hints_nystagmus">Nystagmus (gaze sweep)</button>
        </div>
        <div class="btn-row">
          <button class="btn btn-sm" data-hints="cover_alt">Alternate Cover (Skew)</button>
          <button class="btn btn-sm" data-hints="cover_right">Cover OD</button>
          <button class="btn btn-sm" data-hints="cover_left">Cover OS</button>
          <button class="btn btn-sm" data-hints="uncover">Uncover</button>
        </div>
        <div style="font-size:12px; color:var(--text-dim); margin-top:8px; line-height:1.5;">
          Only for <strong style="color:#e2e8f0;">continuous</strong> acute vertigo with spontaneous nystagmus.
          <strong style="color:var(--rose);">INFARCT</strong> = <strong>I</strong>mpulse <strong>N</strong>ormal, <strong>F</strong>ast-phase <strong>A</strong>lternating, <strong>R</strong>efixation on <strong>C</strong>over <strong>T</strong>est — any one = central until proven otherwise.
          Reassuring peripheral pattern needs all three: abnormal impulse, unidirectional nystagmus, no skew. New hearing loss = "HINTS plus" (think AICA stroke).
        </div>
      </div>

      <div class="card">
        <div class="card-title">Why the H-Test Works — 6-Muscle Biomechanics</div>
        <div class="muscle-pills">
          ${Object.keys(DATA.EOM_MUSCLES).map((code) => `
            <button class="muscle-pill ${code === state.selectedMuscle ? 'active' : ''}" data-mcode="${code}">${code}</button>
          `).join('')}
        </div>
        <div style="font-size:12.5px;">
          <div style="font-weight:700; color:var(--cyan); margin-bottom:4px;">${muscleInfo.name} — ${muscleInfo.nerve}</div>
          <div style="color:#e2e8f0; margin-bottom:4px;"><strong>Bedside Isolation:</strong> ${muscleInfo.clinicalTest}</div>
          <div style="color:var(--text-dim); margin-bottom:4px;"><strong>Actions:</strong> 1° ${muscleInfo.primary} · 2° ${muscleInfo.secondary} · 3° ${muscleInfo.tertiary}</div>
          <div style="color:var(--text-dim); margin-bottom:4px;"><strong>Yoke Muscle Pair:</strong> ${muscleInfo.yoke}</div>
          <div style="color:#cbd5e1; background:#0b1322; padding:7px 9px; border-radius:7px; border:1px solid var(--border); margin-top:6px;">
            ${muscleInfo.axisNote}
          </div>
        </div>
      </div>
    `;

    // Bind preset clicks
    rightPanel.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.eyeLabBlindMystery = null;
        state.eyeLabMysteryRevealed = false;
        state.eyeLabPreset = btn.dataset.preset;
        const preset = DATA.PATHOLOGY_PRESETS[state.eyeLabPreset];
        scene3d.setPathology(preset.state);
        headTiltSlider.value = -(preset.state.defaultHeadTilt || 0);
        if (preset.id === 'cn3_surgical_right') {
          scene3d.setLiftLid('right', true);
          syncLidButtons();
        } else if (preset.id === 'cn3_microvascular_left') {
          scene3d.setLiftLid('left', true);
          syncLidButtons();
        } else {
          syncLidButtons();
        }
        if (preset.id === 'rapd_left') {
          scene3d.startSwingingFlashlight();
        } else {
          scene3d.setTool('finger');
          syncToolButtons();
        }
        renderEyeLabMode();
      });
    });

    document.getElementById('btnRandomEye')?.addEventListener('click', () => {
      const abnormalEyePresets = presets.filter((p) => p.id !== 'normal');
      const pick = abnormalEyePresets[Math.floor(Math.random() * abnormalEyePresets.length)];
      state.eyeLabBlindMystery = pick;
      state.eyeLabMysteryRevealed = false;
      scene3d.setPathology(pick.state);
      headTiltSlider.value = -(pick.state.defaultHeadTilt || 0);
      scene3d.setXRay(false);
      syncXrayBtn();
      syncLidButtons();
      scene3d.setCameraPreset('eyes');
      scene3d.setTool('finger');
      syncToolButtons();
      showToast('🎲 Mystery Eye Deficit Loaded', 'Test H-pattern, Convergence, Swinging Flashlight, Lift Lid, and Head Tilt — then click Reveal Answer!');
      renderEyeLabMode();
    });

    document.getElementById('btnRevealEye')?.addEventListener('click', () => {
      state.eyeLabMysteryRevealed = true;
      state.eyeLabPreset = state.eyeLabBlindMystery.id;
      renderEyeLabMode();
    });

    rightPanel.querySelectorAll('[data-hints]').forEach((btn) => {
      btn.addEventListener('click', () => performManeuver(btn.dataset.hints));
    });
    document.getElementById('chkHitSlow')?.addEventListener('change', (e) => {
      state.hintsSlowMo = e.target.checked;
      scene3d.setHitSlowMotion(state.hintsSlowMo);
    });

    document.getElementById('btnLabXray')?.addEventListener('click', () => {
      scene3d.setXRay(!scene3d.xrayMode);
      syncXrayBtn();
    });

    rightPanel.querySelectorAll('.muscle-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.selectedMuscle = btn.dataset.mcode;
        renderEyeLabMode();
        const isoMap = {
          LR: [-1, 0],
          MR: [1, 0],
          SR: [-1, 1],
          IR: [-1, -1],
          SO: [1, -1],
          IO: [1, 1]
        };
        const g = isoMap[state.selectedMuscle];
        if (g) scene3d.setGaze(g[0], g[1], 0);
      });
    });
  }

  function renderMuscleBarSkeleton(side) {
    const codes = ['LR', 'MR', 'SR', 'IR', 'SO', 'IO'];
    return codes.map((c) => `
      <div class="eom-bar-row">
        <strong style="color:${DATA.EOM_MUSCLES[c].color}">${c}</strong>
        <div class="eom-track"><div class="eom-fill" id="bar_${side}_${c}" style="width:15%; background:${DATA.EOM_MUSCLES[c].color};"></div></div>
        <span id="pct_${side}_${c}" style="font-variant-numeric:tabular-nums; color:var(--text-dim);">15%</span>
      </div>
    `).join('');
  }

  function updateEyeLabTelemetry(t) {
    const isHidden = state.eyeLabBlindMystery && !state.eyeLabMysteryRevealed;
    const codes = ['LR', 'MR', 'SR', 'IR', 'SO', 'IO'];
    ['right', 'left'].forEach((side) => {
      codes.forEach((c) => {
        const bar = document.getElementById(`bar_${side}_${c}`);
        const pct = document.getElementById(`pct_${side}_${c}`);
        if (!bar || !pct) return;
        const val = Math.round((t.eomActivity[side][c] || 0) * 100);
        const palsied = !isHidden && scene3d._isMusclePalsied(side, c);
        bar.style.width = `${palsied ? 100 : val}%`;
        bar.style.background = palsied ? '#ef4444' : DATA.EOM_MUSCLES[c].color;
        pct.textContent = palsied ? 'PALSY' : `${val}%`;
        pct.style.color = palsied ? '#fb7185' : 'var(--text-dim)';
      });
    });

    const canvas = document.getElementById('diplopiaCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(148,163,184,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H);
    ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
    ctx.stroke();

    const convOffset = t.gaze.convergence * 0.72;
    const dYaw = (t.eyeAngles.left.yaw - t.eyeAngles.right.yaw) + convOffset;
    const dPitch = (t.eyeAngles.left.pitch - t.eyeAngles.right.pitch);
    const dRollR = t.eyeAngles.right.roll;
    const dRollL = t.eyeAngles.left.roll;

    const sepX = Math.max(-130, Math.min(130, dYaw * 150));
    const sepY = Math.max(-42, Math.min(42, dPitch * 140));
    const isDiplopic = Math.hypot(sepX, sepY) > 7 || Math.abs(dRollR - dRollL) > 0.08;

    const drawCrosshair = (cx, cy, rot, color, label) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.moveTo(-22, 0); ctx.lineTo(22, 0);
      ctx.moveTo(0, -22); ctx.lineTo(0, 22);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(label, 17, -12);
      ctx.restore();
    };

    if (t.coveredEye) {
      const seeing = t.coveredEye === 'right' ? 'left' : 'right';
      drawCrosshair(W / 2, H / 2, 0, seeing === 'right' ? '#38bdf8' : '#fb7185', seeing === 'right' ? 'OD' : 'OS');
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText(`${t.coveredEye === 'right' ? 'OD' : 'OS'} occluded — monocular view (no diplopia possible)`, 10, 18);
    } else if (!isDiplopic) {
      drawCrosshair(W / 2, H / 2, 0, '#34d399', 'FUSED');
      ctx.fillStyle = '#6ee7b7';
      ctx.font = '11px sans-serif';
      ctx.fillText('Single binocular vision (conjugate alignment)', 10, 18);
    } else {
      drawCrosshair(W / 2 - sepX * 0.5, H / 2 - sepY * 0.5, -dRollR * 1.4, '#38bdf8', 'OD');
      drawCrosshair(W / 2 + sepX * 0.5, H / 2 + sepY * 0.5, -dRollL * 1.4, '#fb7185', 'OS');
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px sans-serif';
      const typeLabel = Math.abs(sepY) > Math.abs(sepX) ? 'VERTICAL / TORSIONAL DIPLOPIA' : 'HORIZONTAL DIPLOPIA';
      ctx.fillText(typeLabel, 10, 18);
    }
  }

  // === MODE 3: ORDER & MEMORIZATION DRILLS ===
  function initSequenceDrill() {
    state.seqNextIndex = 0;
    state.seqMistakes = 0;
    state.seqBank = DATA.CRANIAL_NERVES.slice().sort(() => Math.random() - 0.5);
  }

  function renderDrillsMode() {
    hudActiveCasePill.style.display = 'none';
    if (state.seqBank.length === 0) initSequenceDrill();

    rightPanel.innerHTML = `
      <div class="section-head">
        <h2>Order &amp; Memorization Trainer</h2>
      </div>

      <div class="subtab-bar">
        <button class="subtab ${state.drillTab === 'sequence' ? 'active' : ''}" data-dtab="sequence">1. CN I–XII Order</button>
        <button class="subtab ${state.drillTab === 'flow' ? 'active' : ''}" data-dtab="flow">2. Bedside Flow</button>
        <button class="subtab ${state.drillTab === 'quiz' ? 'active' : ''}" data-dtab="quiz">3. Eye &amp; CN Quiz</button>
      </div>

      <div id="drillBody"></div>
    `;

    rightPanel.querySelectorAll('.subtab').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.drillTab = btn.dataset.dtab;
        renderDrillsMode();
      });
    });

    const body = document.getElementById('drillBody');
    if (state.drillTab === 'sequence') renderSequenceDrill(body);
    else if (state.drillTab === 'flow') renderBedsideFlow(body);
    else renderRapidQuiz(body);
  }

  function renderSequenceDrill(container) {
    const done = state.seqNextIndex >= 12;
    container.innerHTML = `
      <div class="card">
        <div class="card-title">
          <span>Assemble CN I → XII in Exact Order</span>
          <span>Mistakes: <strong style="color:${state.seqMistakes ? 'var(--rose)' : 'var(--emerald)'}">${state.seqMistakes}</strong></span>
        </div>

        <div class="seq-slots">
          ${DATA.CRANIAL_NERVES.map((cn, idx) => {
            const filled = idx < state.seqNextIndex;
            const isNext = idx === state.seqNextIndex;
            return `
              <div class="seq-slot ${filled ? 'filled' : ''} ${isNext ? 'next-slot' : ''}">
                <span style="font-size:10px; color:var(--text-muted); font-weight:700;">CN ${cn.roman}</span>
                <strong>${filled ? `${cn.name} (${cn.modality})` : (isNext ? 'Tap next...' : '—')}</strong>
              </div>
            `;
          }).join('')}
        </div>

        ${done ? `
          <div class="callout callout-tip">
            <strong>Mastery Complete!</strong>
            You assembled all 12 Cranial Nerves in order with ${state.seqMistakes} mistake(s)!
          </div>
          <div class="btn-row"><button class="btn btn-primary" id="btnRestartSeq">Shuffle &amp; Drill Again</button></div>
        ` : `
          <div class="card-title" style="margin-top:10px;">Tap the name for <strong>CN ${DATA.CRANIAL_NERVES[state.seqNextIndex].roman}</strong>:</div>
          <div class="seq-bank">
            ${state.seqBank.map((cn) => `
              <button class="bank-chip" data-pick="${cn.num}">${cn.name}</button>
            `).join('')}
          </div>
        `}
      </div>

      <div class="card" style="margin-top:12px;">
        <div class="card-title">Classic Mnemonics (Name &amp; Modality)</div>
        <p style="font-size:12.5px; color:#e2e8f0; margin-bottom:6px;">
          <strong style="color:var(--cyan);">Names (I–XII):</strong> "<strong>O</strong>h, <strong>O</strong>h, <strong>O</strong>h, <strong>T</strong>o <strong>T</strong>ouch <strong>A</strong>nd <strong>F</strong>eel <strong>V</strong>ery <strong>G</strong>ood <strong>V</strong>elvet, <strong>A</strong>H!"
        </p>
        <p style="font-size:12.5px; color:#e2e8f0; margin-bottom:6px;">
          <strong style="color:var(--violet);">Sensory / Motor / Both:</strong> "<strong>S</strong>ome <strong>S</strong>ay <strong>M</strong>arry <strong>M</strong>oney, <strong>B</strong>ut <strong>M</strong>y <strong>B</strong>rother <strong>S</strong>ays <strong>B</strong>ig <strong>B</strong>rains <strong>M</strong>atter <strong>M</strong>ost"
        </p>
        <p style="font-size:12.5px; color:#e2e8f0;">
          <strong style="color:var(--amber);">Eye Muscles Formula:</strong> <strong>LR<sub>6</sub> SO<sub>4</sub> R<sub>3</sub></strong> (Lateral Rectus = VI, Superior Oblique = IV, Rest = III) &amp; <strong>SIN</strong> (<strong>S</strong>uperiors <strong>IN</strong>tort!)
        </p>
      </div>
    `;

    container.querySelectorAll('.bank-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const picked = Number(chip.dataset.pick);
        const expected = DATA.CRANIAL_NERVES[state.seqNextIndex].num;
        if (picked === expected) {
          state.seqBank = state.seqBank.filter((c) => c.num !== picked);
          state.seqNextIndex++;
          renderSequenceDrill(container);
        } else {
          state.seqMistakes++;
          chip.classList.add('wrong-flash');
          setTimeout(() => chip.classList.remove('wrong-flash'), 400);
          renderSequenceDrill(container);
        }
      });
    });

    document.getElementById('btnRestartSeq')?.addEventListener('click', () => {
      initSequenceDrill();
      renderSequenceDrill(container);
    });
  }

  function renderBedsideFlow(container) {
    container.innerHTML = `
      <div class="card">
        <div class="card-title">How Neurologists Actually Flow at the Bedside (8 Smooth Steps)</div>
        <p style="font-size:12.2px; color:var(--text-dim); margin-bottom:10px;">
          Memorize I–XII for charting, but examine spatially top-to-bottom so you only pick up each tool once!
        </p>
        ${DATA.BEDSIDE_FLOW.map((s) => `
          <div class="flow-step">
            <div class="flow-num">${s.step}</div>
            <div>
              <div style="font-weight:700; font-size:13px;">${s.title} <span style="color:var(--cyan); font-weight:600; font-size:11.5px;">(${s.nerves})</span></div>
              <div style="font-size:12.2px; color:#cbd5e1; margin-top:2px;">${s.detail}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderRapidQuiz(container) {
    const q = DATA.RAPID_FIRE_QUESTIONS[state.quizIndex];
    const total = DATA.RAPID_FIRE_QUESTIONS.length;

    container.innerHTML = `
      <div class="card">
        <div class="card-title">
          <span>Question ${state.quizIndex + 1} of ${total}</span>
          <span>Score: <strong style="color:var(--emerald)">${state.quizScore}/${total}</strong></span>
        </div>
        <p style="font-size:13.5px; font-weight:600; color:#f8fafc; margin-bottom:8px;">${q.q}</p>

        ${q.options.map((opt, idx) => {
          let cls = 'quiz-opt';
          if (state.quizAnswered !== null) {
            if (idx === q.answer) cls += ' correct';
            else if (idx === state.quizAnswered) cls += ' incorrect';
          }
          return `<button class="${cls}" data-qopt="${idx}" ${state.quizAnswered !== null ? 'disabled' : ''}>${opt}</button>`;
        }).join('')}

        ${state.quizAnswered !== null ? `
          <div class="callout ${state.quizAnswered === q.answer ? 'callout-tip' : 'callout-warn'}" style="margin-top:11px;">
            <strong>${state.quizAnswered === q.answer ? '✓ Correct!' : '✕ Clinical Explanation'}</strong>
            ${q.why}
          </div>
          <div class="btn-row">
            <button class="btn btn-primary" id="btnNextQuiz">
              ${state.quizIndex + 1 < total ? 'Next Question →' : 'Restart Quiz'}
            </button>
          </div>
        ` : ''}
      </div>
    `;

    container.querySelectorAll('[data-qopt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.qopt);
        state.quizAnswered = idx;
        if (idx === q.answer) state.quizScore++;
        renderRapidQuiz(container);
      });
    });

    document.getElementById('btnNextQuiz')?.addEventListener('click', () => {
      if (state.quizIndex + 1 < total) {
        state.quizIndex++;
      } else {
        state.quizIndex = 0;
        state.quizScore = 0;
      }
      state.quizAnswered = null;
      renderRapidQuiz(container);
    });
  }

  // === MODE 4: CLINICAL CASES SIMULATOR ===
  function loadClinicalCase(index) {
    state.activeCaseIndex = index;
    state.caseFindingsLog = [];
    state.caseSelectedNerves = new Set();
    state.caseSelectedDiagnosis = null;
    state.caseSubmitted = false;

    const c = DATA.CLINICAL_CASES[index];
    scene3d.setPathology(c.pathology);
    scene3d.setXRay(false);
    syncXrayBtn();
    syncLidButtons();
    scene3d.setCameraPreset('front');
    scene3d.setTool('finger');
    syncToolButtons();
    headTiltSlider.value = -(c.pathology.defaultHeadTilt || 0);

    hudActiveCasePill.style.display = 'flex';
    hudActiveStatus.textContent = `Case ${c.number}/${DATA.CLINICAL_CASES.length} · Blind Exam`;

    showToast(`Case ${c.number}: ${c.title}`, 'Examine the 3D patient using Target (H-test), Penlight (RAPD), Head Tilt, and the Bedside Maneuvers below!', false);
    renderCasesMode();
  }

  function renderCasesMode() {
    const c = DATA.CLINICAL_CASES[state.activeCaseIndex];

    rightPanel.innerHTML = `
      <div class="section-head">
        <h2>Clinical Cases Simulator</h2>
        <span class="badge-pill">${state.solvedCases.size}/${DATA.CLINICAL_CASES.length} Mastered</span>
      </div>

      <div class="card">
        <div class="card-title">Select Case (1–${DATA.CLINICAL_CASES.length})</div>
        <div class="case-selector">
          ${DATA.CLINICAL_CASES.map((item, idx) => `
            <button class="case-num-btn ${idx === state.activeCaseIndex ? 'active' : ''} ${state.solvedCases.has(item.id) ? 'solved' : ''}" data-cidx="${idx}">
              #${item.number} ${state.solvedCases.has(item.id) ? '✓' : ''}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Case #${c.number} · ${c.patient}</span>
          <span style="color:var(--amber);">${c.difficulty}</span>
        </div>
        <h3 style="font-size:14.5px; margin-bottom:6px; color:#f8fafc;">${c.title}</h3>
        <p style="font-size:13px; color:#e2e8f0; font-style:italic; margin-bottom:7px;">${c.chiefComplaint}</p>
        <div style="font-size:11.5px; color:var(--text-dim); background:#0b1322; padding:6px 9px; border-radius:7px; border:1px solid var(--border);">
          <strong>Vitals / Context:</strong> ${c.vitals}
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Your Exam Log</span>
          <span style="font-size:10.5px; color:var(--cyan);">Use 3D tools &amp; maneuvers on left</span>
        </div>
        <ul class="findings-log" id="caseFindingsList">
          ${state.caseFindingsLog.length === 0
            ? '<li style="color:var(--text-muted);">No maneuvers logged yet. Try Auto H-Test, Convergence, Swing Light, Head Tilt, Lift Lid, or Bedside Maneuvers below the 3D patient!</li>'
            : state.caseFindingsLog.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}
        </ul>
      </div>

      ${!state.caseSubmitted ? renderCaseDiagnosisForm(c) : renderCaseDebrief(c)}
    `;

    rightPanel.querySelectorAll('.case-num-btn').forEach((btn) => {
      btn.addEventListener('click', () => loadClinicalCase(Number(btn.dataset.cidx)));
    });

    if (!state.caseSubmitted) {
      rightPanel.querySelectorAll('.nerve-pick-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const r = btn.dataset.roman;
          if (state.caseSelectedNerves.has(r)) state.caseSelectedNerves.delete(r);
          else state.caseSelectedNerves.add(r);
          renderCasesMode();
        });
      });

      rightPanel.querySelectorAll('[data-diag]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.caseSelectedDiagnosis = btn.dataset.diag;
          renderCasesMode();
        });
      });

      document.getElementById('btnSubmitCase')?.addEventListener('click', () => {
        if (!state.caseSelectedDiagnosis) {
          showToast('Select Diagnosis', 'Please pick the most likely localization & diagnosis before submitting.');
          return;
        }
        state.caseSubmitted = true;
        const chosen = c.diagnosisOptions.find((o) => o.id === state.caseSelectedDiagnosis);
        if (chosen && chosen.correct) {
          state.solvedCases.add(c.id);
          localStorage.setItem('neurosim_solved_cases', JSON.stringify(Array.from(state.solvedCases)));
          updateSolvedBadge();
        }
        hudActiveStatus.textContent = `Case ${c.number}/${DATA.CLINICAL_CASES.length} · Debrief`;
        renderCasesMode();
      });
    } else {
      document.getElementById('btnDebriefXray')?.addEventListener('click', () => {
        scene3d.setCameraPreset('xray');
        syncXrayBtn();
      });
      document.getElementById('btnNextCase')?.addEventListener('click', () => {
        const next = (state.activeCaseIndex + 1) % DATA.CLINICAL_CASES.length;
        loadClinicalCase(next);
      });
      document.getElementById('btnRetryCase')?.addEventListener('click', () => {
        loadClinicalCase(state.activeCaseIndex);
      });
    }
  }

  function renderCaseDiagnosisForm(c) {
    return `
      <div class="card">
        <div class="card-title">Step 1: Which Cranial Nerve(s) Are Abnormal?</div>
        <div class="nerve-pick-grid">
          ${DATA.CRANIAL_NERVES.map((cn) => `
            <button class="nerve-pick-btn ${state.caseSelectedNerves.has(cn.roman) ? 'selected' : ''}" data-roman="${cn.roman}">
              ${cn.roman}
            </button>
          `).join('')}
        </div>

        <div class="card-title" style="margin-top:8px;">Step 2: Select Localization &amp; Primary Diagnosis</div>
        ${c.diagnosisOptions.map((opt) => `
          <button class="quiz-opt ${state.caseSelectedDiagnosis === opt.id ? 'selected' : ''}" data-diag="${opt.id}">
            ${opt.label}
          </button>
        `).join('')}

        <div class="btn-row" style="margin-top:12px;">
          <button class="btn btn-primary" id="btnSubmitCase" style="width:100%;">Submit Diagnosis &amp; View Explanation</button>
        </div>
      </div>
    `;
  }

  function renderCaseDebrief(c) {
    const chosen = c.diagnosisOptions.find((o) => o.id === state.caseSelectedDiagnosis);
    const isCorrect = chosen && chosen.correct;
    const pickedNerves = Array.from(state.caseSelectedNerves).join(', ') || 'None selected';
    const expectedNerves = c.correctNerves.join(', ');

    return `
      <div class="card">
        <div class="callout ${isCorrect ? 'callout-tip' : 'callout-warn'}" style="margin-top:0;">
          <strong>${isCorrect ? '✓ Correct Localization & Diagnosis!' : '✕ Incorrect — Attending Neurologist Review'}</strong>
          ${c.explanation.summary.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}
        </div>

        <div class="meta-grid" style="margin-top:10px;">
          <div class="meta-item">
            <span>Your Selected CN(s)</span>
            <strong>${pickedNerves}</strong>
          </div>
          <div class="meta-item">
            <span>Affected CN(s)</span>
            <strong style="color:var(--emerald);">${expectedNerves} (${c.correctSide.toUpperCase()})</strong>
          </div>
        </div>

        <div style="margin-top:10px;">
          <div class="card-title">Key Exam Findings to Look For</div>
          <ul class="pearl-list">
            ${c.expectedFindings.map((ef) => `<li>${ef}</li>`).join('')}
          </ul>
        </div>

        <div class="callout callout-info">
          <strong>Neuroanatomy Pathway</strong>
          ${c.explanation.anatomy.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>')}
        </div>

        <div style="margin-top:10px;">
          <div class="card-title">Why Other Options Are Ruled Out</div>
          <ul class="pearl-list">
            ${c.explanation.whyNotOthers.map((w) => `<li>${w}</li>`).join('')}
          </ul>
        </div>

        <div class="callout callout-tip">
          <strong>Next Clinical Step</strong>
          ${c.explanation.nextStep}
        </div>

        <div class="btn-row">
          <button class="btn" id="btnDebriefXray">⚡ Reveal 3D Muscle X-Ray</button>
          <button class="btn" id="btnRetryCase">Re-examine Case</button>
          <button class="btn btn-primary" id="btnNextCase">Next Case →</button>
        </div>
      </div>
    `;
  }

  // === GLOBAL HUD & TOOLBAR BINDINGS ===
  function syncXrayBtn() {
    const btn = document.getElementById('btnToggleXray');
    btn.classList.toggle('active', scene3d.xrayMode);
  }

  function syncToolButtons() {
    document.querySelectorAll('.tool-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.tool === scene3d.activeTool);
    });
  }

  function syncLidButtons() {
    document.getElementById('btnLiftRLid').classList.toggle('active', scene3d.liftRightLid);
    document.getElementById('btnLiftLLid').classList.toggle('active', scene3d.liftLeftLid);
  }

  function switchMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.mode-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.mode === mode);
    });

    if (mode === 'guided') {
      applySandboxDeficits();
      scene3d.setXRay(false);
      syncXrayBtn();
      scene3d.setCameraPreset('front');
      renderGuidedMode();
    } else if (mode === 'eyelab') {
      state.eyeLabBlindMystery = null;
      state.eyeLabMysteryRevealed = false;
      const preset = DATA.PATHOLOGY_PRESETS[state.eyeLabPreset] || DATA.PATHOLOGY_PRESETS.normal;
      scene3d.setPathology(preset.state);
      headTiltSlider.value = -(preset.state.defaultHeadTilt || 0);
      scene3d.setCameraPreset('eyes');
      scene3d.setXRay(false);
      syncXrayBtn();
      renderEyeLabMode();
    } else if (mode === 'drills') {
      scene3d.setPathology({});
      scene3d.setXRay(false);
      syncXrayBtn();
      scene3d.setCameraPreset('front');
      renderDrillsMode();
    } else if (mode === 'cases') {
      loadClinicalCase(state.activeCaseIndex);
    }
  }

  function bindGlobalControls() {
    document.querySelectorAll('.mode-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchMode(tab.dataset.mode));
    });

    // Camera presets (Mouth button opens mouth cleanly to reveal soft palate, uvula, and tongue!)
    document.querySelectorAll('[data-cam]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-cam]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const cam = btn.dataset.cam;
        scene3d.setCameraPreset(cam);
        if (cam === 'mouth') {
          scene3d.maneuver.jawOpen = 1;
          scene3d.maneuver.sayAhh = 0.25;
        } else if (cam === 'front' || cam === 'eyes') {
          scene3d.maneuver.jawOpen = 0;
          scene3d.maneuver.sayAhh = 0;
          scene3d.maneuver.tongueOut = 0;
        }
      });
    });

    document.getElementById('btnToggleXray').addEventListener('click', () => {
      scene3d.setXRay(!scene3d.xrayMode);
      syncXrayBtn();
      if (scene3d.xrayMode) scene3d.setCameraPreset('xray');
    });

    document.querySelectorAll('.tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        scene3d.setTool(btn.dataset.tool);
        syncToolButtons();
      });
    });

    document.getElementById('btnAutoH').addEventListener('click', () => {
      cancelGazeSweep();
      if (scene3d.autoHActive) {
        scene3d.stopAutoHTest();
        document.getElementById('btnAutoH').classList.remove('active');
      } else {
        scene3d.setCameraPreset('eyes');
        scene3d.startAutoHTest();
        document.getElementById('btnAutoH').classList.add('active');
        syncToolButtons();
        logCaseFinding('Performed H-Pattern EOM tracking across all 6 cardinal gazes.');
      }
    });

    document.getElementById('btnConvergence').addEventListener('click', () => {
      scene3d.setCameraPreset('eyes');
      scene3d.triggerConvergence();
      document.getElementById('btnAutoH').classList.remove('active');
      syncToolButtons();
      const p = scene3d.pathology;
      if (p.leftINO || p.rightINO) {
        showToast('Convergence Test (CN III vs MLF)', 'BOTH eyes adduct smoothly during convergence! This proves Medial Rectus & CN III are intact -> localizes to MLF (INO)!', true);
        logCaseFinding('Convergence: INTACT bilaterally (both eyes adduct smoothly to nose!).');
      } else if (p.rightCN3 || p.leftCN3) {
        showToast('Convergence Test', 'Affected eye fails to adduct during convergence (CN III medial rectus denervated).');
        logCaseFinding('Convergence: Impaired adduction on affected side.');
      } else {
        showToast('Convergence Test', 'Both eyes adduct smoothly with bilateral near-triad pupillary miosis.');
        logCaseFinding('Convergence: Intact bilaterally with near miosis.');
      }
    });

    document.getElementById('btnSwingLight').addEventListener('click', () => {
      scene3d.startSwingingFlashlight();
      syncToolButtons();
      const p = scene3d.pathology;
      let msg = 'Swinging OD ↔ OS: Both pupils stay briskly constricted in either eye (NO RAPD).';
      if (p.leftRAPD) msg = 'POSITIVE LEFT RAPD (Marcus Gunn Pupil)! Light in OD constricts both pupils; swinging to OS causes BOTH pupils to paradoxically DILATE!';
      else if (p.rightPupilBlown) msg = 'Right pupil remains fixed & dilated at 6.5 mm regardless of which eye is illuminated (Right efferent CN III defect; left pupil reacts both directly & consensually).';
      showToast('Swinging Flashlight Test (CN II / III)', msg, true);
      logCaseFinding(`Swinging Flashlight: ${msg}`);
    });

    document.getElementById('btnLiftRLid').addEventListener('click', () => {
      scene3d.setLiftLid('right', !scene3d.liftRightLid);
      syncLidButtons();
    });

    document.getElementById('btnLiftLLid').addEventListener('click', () => {
      scene3d.setLiftLid('left', !scene3d.liftLeftLid);
      syncLidButtons();
    });

    document.querySelectorAll('#gazeGrid button').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#gazeGrid button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('btnAutoH').classList.remove('active');
        cancelGazeSweep();
        scene3d.setGaze(Number(btn.dataset.gx), Number(btn.dataset.gy), 0);
        syncToolButtons();
      });
    });

    headTiltSlider.addEventListener('input', () => {
      const deg = -Number(headTiltSlider.value);
      scene3d.setHeadTilt(deg);
      if (scene3d.pathology.rightCN4 && deg > 8) {
        showToast('Parks-Bielschowsky Head Tilt (+)', 'Tilting head toward patient\'s RIGHT shoulder WORSENS the Right hypertropia — diagnostic of Right Superior Oblique (CN IV) palsy!');
        logCaseFinding('Head Tilt Test: Right hypertropia WORSENS on Right head tilt (Bielschowsky positive!).');
      }
    });

    document.getElementById('btnResetTilt').addEventListener('click', () => {
      headTiltSlider.value = 0;
      scene3d.setHeadTilt(0);
    });

    document.querySelectorAll('.m-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.m-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        performManeuver(chip.dataset.maneuver);
      });
    });

    document.getElementById('toastClose').addEventListener('click', () => {
      findingToast.classList.add('hidden');
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    updateSolvedBadge();
    init3D();
    bindGlobalControls();
    switchMode('guided');
  });
})();

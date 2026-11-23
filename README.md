# NeuroSim 3D — Cranial Nerves Exam Lab

A zero-build, fully offline 3D simulator of the cranial nerve I–XII exam, ocular motility, and the HINTS exam, with blind clinical cases. Pure HTML/CSS/vanilla JS + Three.js r128 (bundled in `js/vendor/`).

## Run
Open `index.html` in any modern browser (works from `file://`, no server or internet needed), or enable GitHub Pages on this repo.

## Modes
1. **Guided CN I–XII** — normal baseline exam, nerve-by-nerve deficit injector, random mystery deficit.
2. **Eye Muscle Lab** — 9-gaze pad, auto H-test, convergence, swinging flashlight (RAPD), Parks-Bielschowsky head tilt, 3D orbital muscle X-ray, live diplopia view, and the **HINTS exam**:
   - **Head Impulse** to either side (optional slow motion) with corrective catch-up saccade toward a peripheral lesion
   - **Nystagmus** gaze sweep: unidirectional (peripheral, Alexander law) vs gaze-evoked direction-changing (central)
   - **Test of Skew** with a translucent occluder: alternate cover, cover OD / OS
3. **Order & Memory** — CN sequence builder, 8-step bedside flow, rapid-fire quiz.
4. **Clinical Cases** — 12 blind cases (incl. vestibular neuritis vs. PICA-territory stroke) with findings log and debrief.

## Files
- `index.html` — shell, HUD, gaze pad, head-tilt slider, bedside maneuver chips
- `styles.css` — dark clinical UI
- `js/data.js` — clinical content (nerves, EOMs, presets, deficits, cases, quiz, bedside flow)
- `js/scene3d.js` — procedural 3D patient, eye/pupil/lid physics, HINTS engine (VOR, nystagmus, cover test), face/mouth/neck rigs
- `js/app.js` — UI controller and maneuver findings
- `js/vendor/three.min.js` — Three.js r128 (MIT, see `three.LICENSE`)

## Coordinate convention
Patient faces +Z. Patient's RIGHT (OD) = −X (screen left). `+yaw` rotates an eye toward the patient's LEFT; `−pitch` elevates. Head tilt `+deg` = toward patient's right shoulder; head yaw `+deg` = face turns to patient's left.

## Disclaimer
Educational simulator only — not for clinical decision-making.

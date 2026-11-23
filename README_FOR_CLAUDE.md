# NeuroSim 3D — Cranial Nerve Exam & Ocular Motility Simulator

## Overview
A zero-build, pure client-side 3D medical simulator built with HTML, CSS, vanilla JavaScript, and Three.js (`r128`) designed to help physicians and medical trainees master:
1. **The Cranial Nerve I–XII Exam** (normal baseline by default, plus nerve-by-nerve deficit injection and random mystery exam drills).
2. **Extraocular Muscle Biomechanics (CN III, IV, VI, MLF/INO, Horner, RAPD)** with a **3D Orbital Muscle X-Ray** showing all 12 muscles + trochlea pulley + optic nerves dynamically contracting/stretching, plus a **Live Patient Diplopia Simulator** and **Parks-Bielschowsky Head Tilt**.
3. **Order & Memorization Drills** (CN I–XII sequence builder, 8-step bedside spatial flow, 12-question rapid-fire quiz).
4. **12 Blind Clinical Cases** with automated exam logging, localization/diagnosis submission, and full neuroanatomical debriefs.

## File Structure
- `index.html` — Application shell, 3D viewport HUD, 9-gaze pad, Bielschowsky head-tilt slider, and bedside maneuver chips.
- `styles.css` — Dark clinical telemetry UI theme.
- `js/data.js` — Clinical reference data (`CRANIAL_NERVES`, `EOM_MUSCLES`, `PATHOLOGY_PRESETS`, `NERVE_DEFICITS`, `CLINICAL_CASES`, `RAPID_FIRE_QUESTIONS`, `BEDSIDE_FLOW`).
- `js/scene3d.js` — HINTS engine (VOR head impulse, jerk nystagmus, cover/alternate-cover), procedural Three.js 3D patient bust, eye/pupil/eyelid/cornea physics, 12-muscle orbital X-ray rig, facial expression & oral cavity (soft palate, uvula, tongue) rig, neck SCM/trapezius rig, and 3D exam tools (fixation target, penlight, cotton wisp).
- `js/app.js` — UI controller for all 4 modes, live telemetry/diplopia canvas rendering, maneuver evaluation, mystery deficit randomizer, and case grading.

## Coordinate Convention (`js/scene3d.js`)
- Patient faces `+Z` toward the examiner/camera.
- **Patient's RIGHT (OD)** = `-X` (screen left).
- **Patient's LEFT (OS)** = `+X` (screen right).
- Eye rotations (`YXZ` Euler): `+yaw` rotates toward Patient's LEFT (`+X`); `-pitch` elevates (`+Y`); `+pitch` depresses (`-Y`).
- Head tilt (`headGroup.rotation.z`): `+deg` tilts toward Patient's RIGHT shoulder (`-X`); `-deg` tilts toward Patient's LEFT shoulder (`+X`).

## Suggested Areas for Review & Improvement
1. **3D Anatomical Realism:** Upgrade the procedural head/face geometry (or load an open-license anatomically rigged GLTF head mesh with blendshapes/morph targets for brows, eyelids, smile, jaw, palate, and tongue) for more lifelike facial landmarks.
2. **Advanced Eye Exam Maneuvers:**
   - Add an interactive **Cover / Uncover & Alternate Cover Test** (3D occluder paddle) to distinguish tropias vs. phorias and manifest skew deviation.
   - Add **Myasthenia Gravis** fatigable ptosis (sustained upgaze worsening + Cogan lid twitch) and **One-and-a-Half Syndrome**.
   - Add left/right side toggles for every single nerve deficit in `NERVE_DEFICITS`.
3. **Interactive Visual Fields & Fundoscopy Visuals:** Render an interactive 2D/3D visual field map and realistic fundoscopic disc viewer (normal, papilledema, optic atrophy) instead of text-only toast output.

## Done
- HINTS exam (head impulse with catch-up saccade, unidirectional vs direction-changing nystagmus, test of skew with occluder) + cases 11–12.
- More natural face: warm skin lighting, almond eyelid fissure, sculpted nose, tapered lips with a seamless skin cover over the oral cavity (no dark ring around the mouth).
- Three.js bundled locally (`js/vendor/three.min.js`) — runs fully offline.
- Clinical content review: imaging for all acute CN III palsies, INO localized to MLF, ONTT steroid nuance, consistent pupil sizes, incomitant CN VI deviation.

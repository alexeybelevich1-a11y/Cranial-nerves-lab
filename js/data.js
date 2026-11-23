// Clinical reference data for Cranial Nerves I–XII, Extraocular Muscle Biomechanics,
// Memorization Drills, and 10 Diagnostic Clinical Cases.

window.CN_DATA = (function () {
  const CRANIAL_NERVES = [
    {
      num: 1,
      roman: 'I',
      name: 'Olfactory',
      modality: 'S',
      modalityLabel: 'Special Sensory (Smell)',
      brainstem: 'Cerebrum (Olfactory Bulb)',
      foramen: 'Cribriform plate of ethmoid',
      bedsideGroup: 'Smell & Vision',
      camera: 'front',
      primaryAction: 'Smell',
      bedsideTest: 'Occlude one nostril at a time; present non-irritating odorant (coffee, vanilla, soap) with eyes closed.',
      commonMistake: 'Using ammonia or alcohol swabs—those stimulate CN V (trigeminal nociceptors), NOT CN I!',
      clinicalPearls: [
        'Often deferred in routine screening unless head trauma, frontal lobe tumor (Foster Kennedy syndrome), or early Parkinson/Alzheimer workup.',
        'Anosmia after minor head trauma results from shearing of olfactory fila across the cribriform plate.'
      ],
      maneuvers: ['smell_test']
    },
    {
      num: 2,
      roman: 'II',
      name: 'Optic',
      modality: 'S',
      modalityLabel: 'Special Sensory (Vision)',
      brainstem: 'Diencephalon (LGN)',
      foramen: 'Optic canal',
      bedsideGroup: 'Smell & Vision',
      camera: 'eyes',
      primaryAction: 'Visual acuity, visual fields, afferent pupillary light reflex',
      bedsideTest: 'Check visual acuity (Snellen/near card with glasses), confrontation visual fields in all 4 quadrants per eye, swinging flashlight test (RAPD), and fundoscopy.',
      commonMistake: 'Skipping the swinging flashlight test or moving the penlight too slowly between eyes, missing a Relative Afferent Pupillary Defect (Marcus Gunn pupil).',
      clinicalPearls: [
        'RAPD is the single most objective bedside sign of unilateral optic nerve (pre-chiasmal) disease.',
        'Bitemporal hemianopia = optic chiasm (pituitary adenoma); Homonymous hemianopia = retrochiasmal (optic tract/radiation/occipital cortex).',
        'Afferent limb of pupillary light reflex is CN II; efferent limb is bilateral CN III parasympathetic fibers.'
      ],
      maneuvers: ['visual_fields', 'penlight_swing', 'fundoscopy']
    },
    {
      num: 3,
      roman: 'III',
      name: 'Oculomotor',
      modality: 'M',
      modalityLabel: 'Somatic Motor + Parasympathetic',
      brainstem: 'Midbrain (Superior colliculus)',
      foramen: 'Superior orbital fissure',
      bedsideGroup: 'Ocular Motility & Pupils',
      camera: 'eyes',
      primaryAction: 'SR, IR, MR, IO + Levator palpebrae + Pupillary constriction (Edinger-Westphal)',
      bedsideTest: 'Inspect lid height (ptosis) & pupil size; test H-pattern (adduction, elevation in abduction & adduction, depression in abduction), convergence, and direct/consensual light reflexes.',
      commonMistake: 'Assuming a pupil-sparing CN III palsy is "just microvascular" and skipping vascular imaging. A blown pupil is a red flag for PCom aneurysm, but pupil sparing does NOT rule it out—image every acute CN III palsy.',
      clinicalPearls: [
        'Classic complete CN III palsy: severe ptosis + eye "down and out" (unopposed LR [VI] and SO [IV]) + dilated unreactive pupil.',
        'Parasympathetic fibers run superficially on the dorsomedial nerve -> vulnerable to external compression (PCom aneurysm, uncal herniation).',
        'A dilated/sluggish pupil in acute CN III palsy makes PCom aneurysm likely and is an emergency—but current practice is urgent CTA/MRA for ALL acute CN III palsies, pupil-involving or not.'
      ],
      maneuvers: ['h_test', 'convergence', 'penlight_swing', 'ptosis_check']
    },
    {
      num: 4,
      roman: 'IV',
      name: 'Trochlear',
      modality: 'M',
      modalityLabel: 'Somatic Motor',
      brainstem: 'Midbrain (Dorsal exit! Inferior colliculus)',
      foramen: 'Superior orbital fissure',
      bedsideGroup: 'Ocular Motility & Pupils',
      camera: 'eyes',
      primaryAction: 'Superior Oblique (Intorsion + Depression in adduction)',
      bedsideTest: 'Have patient adduct the eye (look medially) and then look DOWN ("down and in"). Perform Parks-Bielschowsky head-tilt test: tilt head toward affected eye -> hypertropia worsens.',
      commonMistake: 'Asking the patient to look down and OUT, or missing subtle vertical diplopia because the patient unconsciously tilts their head to the opposite shoulder.',
      clinicalPearls: [
        'Only cranial nerve that exits dorsally from the brainstem and completely decussates (right nucleus innervates left SO).',
        'Longest intracranial course and thinnest caliber -> most vulnerable to closed head trauma.',
        'Patients report double vision walking downstairs or reading in bed, and adopt a compensatory head tilt AWAY from the affected eye.'
      ],
      maneuvers: ['h_test', 'head_tilt']
    },
    {
      num: 5,
      roman: 'V',
      name: 'Trigeminal',
      modality: 'B',
      modalityLabel: 'General Sensory (V1-V3) + Motor (V3 Mastication)',
      brainstem: 'Pons (Lateral)',
      foramen: 'V1: SOF | V2: F. rotundum | V3: F. ovale',
      bedsideGroup: 'Face & Cornea',
      camera: 'front',
      primaryAction: 'Facial sensation (V1/V2/V3), corneal reflex afferent, muscles of mastication',
      bedsideTest: 'Test light touch & pinprick symmetrically across V1 (forehead), V2 (cheek), V3 (jaw, sparing jaw angle = C2/C3). Test corneal blink reflex (afferent V1). Palpate masseter/temporalis clench & open jaw against resistance.',
      commonMistake: 'Testing the angle of the mandible as V3 (it is innervated by C2/C3 great auricular nerve!) or touching the sclera instead of the cornea during corneal reflex.',
      clinicalPearls: [
        'On jaw opening, the lateral pterygoids push the mandible forward; unilateral V3 weakness causes the jaw to deviate TOWARD the weak side.',
        'Diminished corneal reflex is often the earliest sign of a cerebellopontine angle (CPA) tumor compressing CN V.'
      ],
      maneuvers: ['v_sensory', 'corneal_reflex', 'jaw_open']
    },
    {
      num: 6,
      roman: 'VI',
      name: 'Abducens',
      modality: 'M',
      modalityLabel: 'Somatic Motor',
      brainstem: 'Pontomedullary junction (Medial)',
      foramen: 'Superior orbital fissure',
      bedsideGroup: 'Ocular Motility & Pupils',
      camera: 'eyes',
      primaryAction: 'Lateral Rectus (Abduction)',
      bedsideTest: 'Have patient look fully laterally to each side; observe if sclera disappears completely at the lateral canthus ("buried sclera"). Ask about horizontal diplopia worse at distance.',
      commonMistake: 'Confusing a CN VI fascicular/nerve palsy (isolated abduction deficit) with a CN VI nuclear lesion (causes an ipsilateral horizontal conjugate gaze palsy affecting BOTH eyes via PPRF/MLF!).',
      clinicalPearls: [
        'Classic "false localizing sign" of elevated intracranial pressure (stretched over the petrous apex in Dorello canal).',
        'Horizontal diplopia is binocular, maximal on ipsilateral gaze and when viewing distant objects.'
      ],
      maneuvers: ['h_test']
    },
    {
      num: 7,
      roman: 'VII',
      name: 'Facial',
      modality: 'B',
      modalityLabel: 'Motor (Facial expression, stapedius) + Taste (ant 2/3) + Parasympathetic',
      brainstem: 'Pontomedullary junction (CPA)',
      foramen: 'Internal acoustic meatus -> Stylomastoid foramen',
      bedsideGroup: 'Face & Cornea',
      camera: 'front',
      primaryAction: 'Forehead wrinkle, eye closure, smile, buccinator, corneal reflex efferent',
      bedsideTest: 'Inspect resting symmetry (nasolabial folds, blink). Ask patient to raise eyebrows (frontalis), squeeze eyes tightly shut (orbicularis oculi), puff cheeks, and show teeth/smile.',
      commonMistake: 'Forgetting to test the FOREHEAD! Upper Motor Neuron (cortical stroke) spares the forehead due to bilateral corticobulbar input; Lower Motor Neuron (Bell palsy) paralyzes both upper and lower face.',
      clinicalPearls: [
        'Efferent limb of the corneal reflex: V1 afferent -> bilateral VII efferent blink.',
        'Subtle UMN facial weakness can be revealed by asymmetric blink speed or flattening of the nasolabial fold before frank droop.'
      ],
      maneuvers: ['raise_brows', 'close_eyes', 'smile_test', 'corneal_reflex']
    },
    {
      num: 8,
      roman: 'VIII',
      name: 'Vestibulocochlear',
      modality: 'S',
      modalityLabel: 'Special Sensory (Hearing & Equilibrium)',
      brainstem: 'Pontomedullary junction (CPA)',
      foramen: 'Internal acoustic meatus',
      bedsideGroup: 'Hearing & Balance',
      camera: 'front',
      primaryAction: 'Audition (cochlear) & Balance/VOR (vestibular)',
      bedsideTest: 'Finger rub / whispered voice each ear. If asymmetric, perform 512 Hz Weber (midline forehead) & Rinne (mastoid BC vs ear canal AC) tests. Assess nystagmus and Head Impulse Test (VOR).',
      commonMistake: 'Using a 128 Hz tuning fork (for vibration sense!) instead of a 512 Hz tuning fork for Weber and Rinne.',
      clinicalPearls: [
        'Sensorineural hearing loss (CN VIII): Weber lateralizes to the NORMAL ear; Rinne remains positive (AC > BC) bilaterally.',
        'Conductive hearing loss: Weber lateralizes to the AFFECTED ear; Rinne becomes negative (BC >= AC) on the affected side.'
      ],
      maneuvers: ['hearing_test', 'weber_rinne']
    },
    {
      num: 9,
      roman: 'IX',
      name: 'Glossopharyngeal',
      modality: 'B',
      modalityLabel: 'Sensory (post 1/3 tongue, pharynx, carotid body) + Motor (stylopharyngeus) + Parotid',
      brainstem: 'Medulla (Postolivary sulcus)',
      foramen: 'Jugular foramen',
      bedsideGroup: 'Oropharynx & Bulbar',
      camera: 'mouth',
      primaryAction: 'Afferent limb of gag reflex, pharyngeal sensation, posterior 1/3 taste',
      bedsideTest: 'Tested together with CN X: assess posterior pharyngeal sensation and afferent gag reflex bilaterally (light touch to tonsillar pillar).',
      commonMistake: 'Assuming an absent gag reflex alone is always pathologic—up to 20–30% of healthy adults have a minimal/absent gag reflex; ASYMMETRY is what matters.',
      clinicalPearls: [
        'CN IX is the afferent (sensory) limb of the gag reflex; CN X is the efferent (motor) limb.',
        'Exits through the jugular foramen alongside CN X and CN XI (Jugular Foramen / Vernet syndrome).'
      ],
      maneuvers: ['say_ahh', 'gag_reflex']
    },
    {
      num: 10,
      roman: 'X',
      name: 'Vagus',
      modality: 'B',
      modalityLabel: 'Motor (palate, pharynx, larynx) + Visceral Parasympathetic + Sensory',
      brainstem: 'Medulla (Postolivary sulcus)',
      foramen: 'Jugular foramen',
      bedsideGroup: 'Oropharynx & Bulbar',
      camera: 'mouth',
      primaryAction: 'Soft palate elevation, phonation/cough, efferent gag reflex',
      bedsideTest: 'Listen to voice quality (hoarseness/nasal speech) and cough. Open mouth with penlight and ask patient to say "Ahh"—watch symmetrical soft palate elevation and midline uvula.',
      commonMistake: 'Getting uvula deviation backwards: in unilateral CN X palsy, the healthy side pulls up, so the uvula deviates AWAY from the lesion!',
      clinicalPearls: [
        'Curtain sign: the affected palatal arch droops and fails to rise during phonation while the uvula swings toward the intact side.',
        'Recurrent laryngeal nerve injury causes hoarseness and a "bovine" (weak, non-explosive) cough.'
      ],
      maneuvers: ['say_ahh', 'gag_reflex']
    },
    {
      num: 11,
      roman: 'XI',
      name: 'Spinal Accessory',
      modality: 'M',
      modalityLabel: 'Somatic Motor',
      brainstem: 'Cervical spinal cord C1–C5 (enters foramen magnum, exits jugular foramen)',
      foramen: 'Jugular foramen',
      bedsideGroup: 'Neck & Tongue',
      camera: 'neck',
      primaryAction: 'Sternocleidomastoid (contralateral head turn) & Trapezius (ipsilateral shoulder shrug)',
      bedsideTest: 'Resist head turning to the LEFT to test the RIGHT SCM (palpate muscle belly!). Resist head turn to RIGHT for LEFT SCM. Resist shoulder shrug symmetrically for Trapezius.',
      commonMistake: 'Thinking turning the head to the right tests the right SCM! The right SCM inserts on the right mastoid and pulls it forward/medially, turning the chin to the LEFT.',
      clinicalPearls: [
        'Mnemonic: "Turn AWAY from the SCM you test; Shrug on the SAME side as the Trapezius."',
        'Commonly injured iatrogenically during posterior triangle lymph node biopsy.'
      ],
      maneuvers: ['head_turn_left', 'head_turn_right', 'shrug_shoulders']
    },
    {
      num: 12,
      roman: 'XII',
      name: 'Hypoglossal',
      modality: 'M',
      modalityLabel: 'Somatic Motor',
      brainstem: 'Medulla (Preolivary sulcus)',
      foramen: 'Hypoglossal canal',
      bedsideGroup: 'Neck & Tongue',
      camera: 'mouth',
      primaryAction: 'Intrinsic & extrinsic tongue muscles (genioglossus protrudes tongue)',
      bedsideTest: 'Inspect tongue AT REST inside the mouth first (atrophy, fasciculations!). Then ask patient to protrude tongue straight out and push against each cheek.',
      commonMistake: 'Checking for fasciculations while the tongue is protruded—normal protruded tongues quiver! True fasciculations MUST be inspected with the tongue resting quietly on the floor of the mouth.',
      clinicalPearls: [
        'Genioglossus pushes the tongue forward and contralaterally. In a LMN CN XII lesion, the intact contralateral genioglossus pushes the tongue TOWARD the lesion ("licks the lesion").',
        'Compare: Palate/Uvula deviates AWAY from CN X lesion; Tongue & Jaw deviate TOWARD CN XII and CN V3 lesions.'
      ],
      maneuvers: ['tongue_out']
    }
  ];

  // Extraocular Muscle Biomechanics Reference
  const EOM_MUSCLES = {
    LR: {
      code: 'LR',
      name: 'Lateral Rectus',
      nerve: 'CN VI (Abducens)',
      primary: 'Abduction',
      secondary: 'None',
      tertiary: 'None',
      clinicalTest: 'Look straight LATERALLY (outward)',
      yoke: 'Contralateral Medial Rectus',
      axisNote: 'Pulls directly in the horizontal plane along the lateral globe equator.',
      color: '#38bdf8'
    },
    MR: {
      code: 'MR',
      name: 'Medial Rectus',
      nerve: 'CN III (Oculomotor)',
      primary: 'Adduction',
      secondary: 'None',
      tertiary: 'None',
      clinicalTest: 'Look straight MEDIALLY (inward) + test Convergence',
      yoke: 'Contralateral Lateral Rectus',
      axisNote: 'Largest and strongest extraocular muscle; also mediates convergence independently of MLF.',
      color: '#22d3ee'
    },
    SR: {
      code: 'SR',
      name: 'Superior Rectus',
      nerve: 'CN III (Oculomotor)',
      primary: 'Elevation (maximal in abduction)',
      secondary: 'Intorsion',
      tertiary: 'Adduction',
      clinicalTest: 'ABDUCT eye first (23 deg), then look UP ("up and out")',
      yoke: 'Contralateral Inferior Oblique',
      axisNote: 'Orbital axis sits 23 deg temporal to primary gaze -> abducting aligns visual axis with SR pull for pure elevation.',
      color: '#34d399'
    },
    IR: {
      code: 'IR',
      name: 'Inferior Rectus',
      nerve: 'CN III (Oculomotor)',
      primary: 'Depression (maximal in abduction)',
      secondary: 'Extorsion',
      tertiary: 'Adduction',
      clinicalTest: 'ABDUCT eye first (23 deg), then look DOWN ("down and out")',
      yoke: 'Contralateral Superior Oblique',
      axisNote: 'Aligns with visual axis in 23 deg abduction -> pure depressor in abducted gaze.',
      color: '#fbbf24'
    },
    SO: {
      code: 'SO',
      name: 'Superior Oblique',
      nerve: 'CN IV (Trochlear)',
      primary: 'Intorsion (in primary/abducted gaze)',
      secondary: 'Depression (maximal in adduction!)',
      tertiary: 'Abduction',
      clinicalTest: 'ADDUCT eye first, then look DOWN ("down and in") + Bielschowsky Head Tilt',
      yoke: 'Contralateral Inferior Rectus',
      axisNote: 'Routes anteriorly through the trochlea pulley, then angles 51 deg posterolaterally to insert behind the equator. Adduction aligns the globe so SO pulls the back of the eye UP, rotating the cornea DOWN.',
      color: '#f472b6'
    },
    IO: {
      code: 'IO',
      name: 'Inferior Oblique',
      nerve: 'CN III (Oculomotor)',
      primary: 'Extorsion',
      secondary: 'Elevation (maximal in adduction!)',
      tertiary: 'Abduction',
      clinicalTest: 'ADDUCT eye first, then look UP ("up and in")',
      yoke: 'Contralateral Superior Rectus',
      axisNote: 'Originates at anteromedial orbital floor and runs posterolaterally beneath IR at 51 deg. Adduction turns IO into a pure elevator.',
      color: '#a78bfa'
    }
  };

  // Pathology presets for Eye Muscle Lab AND Clinical Cases
  // NOTE: 'right' = Patient's Right (OD, viewer's left on screen), 'left' = Patient's Left (OS, viewer's right on screen)
  const PATHOLOGY_PRESETS = {
    normal: {
      id: 'normal',
      title: 'Normal Neurologic Exam',
      shortLabel: 'Normal',
      eyeLab: true,
      description: 'Intact CN I–XII. Full conjugate extraocular motility in all 9 cardinal positions, equal round reactive pupils (3.5 mm), no ptosis, no RAPD.',
      keyMechanism: 'Symmetric bilateral innervation across all cranial nerve nuclei, fascicles, and peripheral nerves.',
      diplopiaNote: 'Single binocular vision in all fields of gaze.',
      state: {}
    },
    cn3_surgical_right: {
      id: 'cn3_surgical_right',
      title: 'Right CN III Palsy (Pupil-Involving / Compressive)',
      shortLabel: 'CN III (Pupil-Involving)',
      eyeLab: true,
      side: 'right',
      description: 'Severe right ptosis, right eye deviated "down and out" at rest, impaired adduction/elevation/depression, and a dilated (6.5 mm) unreactive right pupil.',
      keyMechanism: 'External compression (classic PCom aneurysm) damages superficial dorsomedial parasympathetic pupillomotor fibers AND deep somatic motor fibers (SR, IR, MR, IO, levator palpebrae).',
      diplopiaNote: 'Binocular oblique/horizontal + vertical diplopia (often masked until examiner lifts the ptotic lid!). Worse looking left (adduction) and up/down.',
      state: {
        rightCN3: true,
        rightPupilBlown: true,
        rightPtosis: 0.85
      }
    },
    cn3_microvascular_left: {
      id: 'cn3_microvascular_left',
      title: 'Left CN III Palsy (Pupil-Sparing / Microvascular)',
      shortLabel: 'CN III (Pupil-Sparing)',
      eyeLab: true,
      side: 'left',
      description: 'Left ptosis and "down and out" eye with impaired adduction, elevation, and depression, BUT left pupil remains 3.5 mm and briskly reactive!',
      keyMechanism: 'Microvascular ischemia (diabetes, hypertension) infarcts the central vasa nervorum supplying deep somatic motor fibers while sparing the pial-supplied outer parasympathetic fibers.',
      diplopiaNote: 'Binocular horizontal & vertical diplopia on lifting left lid; intact accommodation and pupillary light reflex.',
      state: {
        leftCN3: true,
        leftPupilBlown: false,
        leftPtosis: 0.78
      }
    },
    cn4_right: {
      id: 'cn4_right',
      title: 'Right CN IV (Trochlear) Palsy',
      shortLabel: 'CN IV (Trochlear)',
      eyeLab: true,
      side: 'right',
      description: 'Right eye sits slightly higher (right hypertropia), fails to depress in adduction (looking down and left), and hypertropia WORSENS on right head tilt (Parks-Bielschowsky). Patient prefers tilting head to the LEFT.',
      keyMechanism: 'Right Superior Oblique denervation removes depression in adduction and intorsion. Tilting head RIGHT requires right intorsion -> SR fires to compensate for weak SO -> elevates eye even further!',
      diplopiaNote: 'Vertical & torsional (tilted) diplopia, worst looking down and left (reading, walking downstairs). Relieved by left head tilt.',
      state: {
        rightCN4: true,
        defaultHeadTilt: -14 // compensatory left tilt (patient's left)
      }
    },
    cn6_left: {
      id: 'cn6_left',
      title: 'Left CN VI (Abducens) Palsy',
      shortLabel: 'CN VI (Abducens)',
      eyeLab: true,
      side: 'left',
      description: 'Left esotropia (inward deviation) in primary gaze and inability to abduct the left eye past midline on leftward gaze. Pupils and lids completely normal.',
      keyMechanism: 'Left Lateral Rectus denervation leaves the Medial Rectus unopposed -> inward drift (esotropia) and failure of abduction.',
      diplopiaNote: 'Binocular, uncrossed horizontal diplopia (two side-by-side images), maximal on LEFT gaze and at distance; resolves on right gaze.',
      state: {
        leftCN6: true
      }
    },
    ino_left: {
      id: 'ino_left',
      title: 'Left Internuclear Ophthalmoplegia (INO)',
      shortLabel: 'Left INO (MLF)',
      eyeLab: true,
      side: 'left',
      description: 'On rightward gaze: LEFT eye fails to adduct while RIGHT eye shows abducting nystagmus! Crucially, on CONVERGENCE both eyes adduct normally!',
      keyMechanism: 'Lesion of the Left Medial Longitudinal Fasciculus (MLF) disconnects the right CN VI nucleus (PPRF) from the left CN III medial rectus subnucleus. Convergence bypasses MLF via separate midbrain vergence centers.',
      diplopiaNote: 'Horizontal diplopia specifically on RIGHT lateral gaze; single vision in primary gaze and during near convergence.',
      state: {
        leftINO: true
      }
    },
    horner_right: {
      id: 'horner_right',
      title: 'Right Horner Syndrome (Oculosympathetic Palsy)',
      shortLabel: 'Horner Syndrome',
      eyeLab: true,
      side: 'right',
      description: 'Mild right ptosis (1–2 mm, Müller muscle) + right miosis (small 2.2 mm pupil, anisocoria greater in dim light) with COMPLETELY FULL extraocular movements!',
      keyMechanism: 'Disruption of 3-neuron oculosympathetic pathway (hypothalamus -> T1 ciliospinal center -> superior cervical ganglion -> carotid plexus -> pupil dilator & Müller muscle).',
      diplopiaNote: 'NO diplopia! Full EOM distinguishes Horner ptosis from CN III palsy immediately.',
      state: {
        rightHorner: true,
        rightPtosis: 0.28
      }
    },
    rapd_left: {
      id: 'rapd_left',
      title: 'Left Optic Neuropathy (Left RAPD / Marcus Gunn Pupil)',
      shortLabel: 'Left CN II (RAPD)',
      eyeLab: true,
      side: 'left',
      description: 'Equal pupils at rest! Shine penlight in Right eye -> BOTH pupils constrict briskly. Swing to Left eye -> BOTH pupils paradoxically DILATE!',
      keyMechanism: 'Impaired afferent conduction in the Left CN II sends weaker luminance signal to pretectal nuclei than the healthy Right eye; swinging from strong signal (OD) to weak signal (OS) causes bilateral release dilation.',
      diplopiaNote: 'Monocular blurred vision / central scotoma & color desaturation OS; NO diplopia, full EOM.',
      state: {
        leftRAPD: true,
        leftAcuity: '20/200 (red desaturation)',
        leftFieldDefect: 'central_scotoma',
        fundusLeft: 'Optic disc edema / mild temporal pallor'
      }
    },
    hints_peripheral_right: {
      id: 'hints_peripheral_right',
      title: 'HINTS — Right Vestibular Neuritis (Peripheral Pattern)',
      shortLabel: 'HINTS: Peripheral (R)',
      eyeLab: true,
      side: 'right',
      description: 'Acute vestibular syndrome. Head impulse to the RIGHT -> eyes are dragged off target, then a corrective catch-up saccade (ABNORMAL impulse). Left-beating nystagmus in every gaze, strongest looking LEFT (Alexander law). Alternate cover: no vertical refixation (no skew).',
      keyMechanism: 'Loss of right horizontal semicircular canal input lowers right-sided VOR gain; the resulting vestibular tone imbalance drives a slow phase toward the lesion with fast phases beating away. Impulse ABNORMAL + Nystagmus UNIDIRECTIONAL + Test of skew NEGATIVE = reassuring peripheral pattern.',
      diplopiaNote: 'No diplopia — oscillopsia and vertigo only. Nystagmus is suppressed by visual fixation (check with Frenzel goggles or by covering one eye during fundoscopy).',
      state: { vestibular: 'peripheral_right' }
    },
    hints_central_left: {
      id: 'hints_central_left',
      title: 'HINTS — Left Cerebellar/Medullary Stroke (Central Pattern)',
      shortLabel: 'HINTS: Central (L)',
      eyeLab: true,
      side: 'left',
      description: 'Acute vestibular syndrome with a NORMAL head impulse both ways (no catch-up saccade), gaze-evoked DIRECTION-CHANGING nystagmus (right-beating on right gaze, left-beating on left gaze), and SKEW deviation (left hypotropia: vertical refixation on alternate cover).',
      keyMechanism: 'The vestibular nerve and VOR are intact, so the impulse is normal. Damage to the cerebellar/brainstem neural integrator causes gaze-evoked nystagmus; injury to utricular (otolith) graviceptive pathways causes vertical skew. Any ONE central sign = stroke until proven otherwise (INFARCT).',
      diplopiaNote: 'Small vertical diplopia from skew deviation (left eye lower). Alternate-cover the eyes to see vertical refixation.',
      state: { vestibular: 'central_left', skewLeftHypo: 0.075 }
    }
  };

  // 10 Clinical Cases for Mode 4
  const CLINICAL_CASES = [
    {
      id: 'case_1',
      number: 1,
      difficulty: 'High-Yield Emergency',
      title: 'Sudden Diplopia & Worst Headache',
      patient: '54-year-old woman',
      chiefComplaint: '"My right eyelid suddenly drooped after a severe headache behind my right eye this morning. When I lift my lid, everything is double."',
      vitals: 'BP 168/94 | HR 92 | Alert, photophobic',
      pathology: {
        rightCN3: true,
        rightPupilBlown: true,
        rightPtosis: 0.85,
        smell: { right: 'Normal', left: 'Normal' },
        acuity: { right: '20/25', left: '20/25' },
        fields: { right: 'Full', left: 'Full' },
        fundus: { right: 'Normal disc', left: 'Normal disc' },
        hearing: { right: 'Normal', left: 'Normal', weber: 'Midline', rinneR: 'AC > BC', rinneL: 'AC > BC' }
      },
      correctNerves: ['III'],
      correctSide: 'right',
      expectedFindings: [
        'Right severe ptosis',
        'Right eye deviated down and out',
        'Right dilated unreactive pupil (6.5 mm)',
        'Impaired right adduction, elevation, and depression'
      ],
      diagnosisOptions: [
        { id: 'pcom', label: 'Right Posterior Communicating (PCom) Artery Aneurysm (Compressive CN III Palsy)', correct: true },
        { id: 'dm3', label: 'Microvascular Diabetic Right CN III Palsy', correct: false },
        { id: 'horner', label: 'Right Horner Syndrome from Carotid Dissection', correct: false },
        { id: 'myasthenia', label: 'Ocular Myasthenia Gravis', correct: false }
      ],
      explanation: {
        summary: 'This is a classic **pupil-involving (surgical) Right CN III palsy** caused by compression from a **Posterior Communicating (PCom) artery aneurysm**—a neurosurgical emergency.',
        anatomy: 'In CN III, parasympathetic pupillomotor fibers from the Edinger-Westphal nucleus travel superficially along the dorsomedial perimeter of the nerve. An expanding PCom aneurysm compresses these outer fibers first (causing a blown, unreactive pupil) along with the deeper somatic motor fibers to Levator palpebrae (ptosis) and SR, IR, MR, IO (leaving LR [CN VI] and SO [CN IV] unopposed -> "down and out").',
        whyNotOthers: [
          'Microvascular/diabetic CN III palsy usually spares the pupil (central nerve ischemia spares pial-supplied outer parasympathetic fibers)—a blown pupil makes it unlikely here.',
          'Horner syndrome causes Miosis (small pupil) and mild ptosis with FULL extraocular motility.',
          'Myasthenia gravis NEVER affects the pupil.'
        ],
        nextStep: 'Immediate stat CT Angiography (CTA) or MRA of the head and urgent neurosurgical consultation.'
      }
    },
    {
      id: 'case_2',
      number: 2,
      difficulty: 'Core Ocular Motility',
      title: 'Double Vision Walking Downstairs',
      patient: '39-year-old man',
      chiefComplaint: '"Ever since I hit my forehead in a bicycle fall last week, I see two stacked images whenever I walk downstairs or read a book. Tilting my head helps."',
      vitals: 'BP 124/76 | HR 70 | Resting head tilted slightly to his LEFT',
      pathology: {
        rightCN4: true,
        defaultHeadTilt: -14,
        smell: { right: 'Normal', left: 'Normal' },
        acuity: { right: '20/20', left: '20/20' },
        fields: { right: 'Full', left: 'Full' },
        fundus: { right: 'Normal disc', left: 'Normal disc' },
        hearing: { right: 'Normal', left: 'Normal', weber: 'Midline', rinneR: 'AC > BC', rinneL: 'AC > BC' }
      },
      correctNerves: ['IV'],
      correctSide: 'right',
      expectedFindings: [
        'Right hypertropia (right eye sits higher)',
        'Impaired right eye depression in adduction (down and left)',
        'Hypertropia worsens on RIGHT head tilt (Bielschowsky positive)',
        'Compensatory head tilt to the LEFT'
      ],
      diagnosisOptions: [
        { id: 'cn4_trauma', label: 'Traumatic Right CN IV (Trochlear) Palsy (Right Superior Oblique)', correct: true },
        { id: 'cn3_ir', label: 'Isolated Right Inferior Rectus Palsy (CN III)', correct: false },
        { id: 'cn6', label: 'Right CN VI (Abducens) Palsy', correct: false },
        { id: 'ino', label: 'Right Internuclear Ophthalmoplegia', correct: false }
      ],
      explanation: {
        summary: 'Classic **Right CN IV (Trochlear) palsy** following closed head trauma—the single most commonly missed ocular motor palsy in clinical practice.',
        anatomy: 'CN IV innervates only the Superior Oblique (SO). It is uniquely vulnerable to blunt head trauma because it exits dorsally from the midbrain, decussates completely in the superior medullary velum, and has the longest intracranial course. In adduction, the SO is a pure depressor; in primary gaze, it intorts the eye. Loss of SO causes right hypertropia worse in left gaze and on RIGHT head tilt (Parks-Bielschowsky 3-step test).',
        whyNotOthers: [
          'Right Inferior Rectus palsy would worsen on DOWN and RIGHT (abducted) gaze, not down and left.',
          'CN VI palsy causes horizontal (side-by-side) diplopia worse on lateral gaze, not vertical diplopia going downstairs.',
          'INO causes horizontal diplopia on lateral gaze due to failed adduction, not vertical hypertropia.'
        ],
        nextStep: 'Brain MRI to exclude brainstem/tentorial pathology; prism glasses or patching while monitoring for spontaneous recovery over 3–6 months.'
      }
    },
    {
      id: 'case_3',
      number: 3,
      difficulty: 'Board Classic',
      title: 'Horizontal Diplopia While Driving',
      patient: '28-year-old woman',
      chiefComplaint: '"For 3 weeks I have had daily morning headaches, brief graying out of vision when I bend over, and double vision looking to the left while driving."',
      vitals: 'BP 132/82 | HR 78 | BMI 34',
      pathology: {
        leftCN6: true,
        smell: { right: 'Normal', left: 'Normal' },
        acuity: { right: '20/25', left: '20/25' },
        fields: { right: 'Enlarged blind spot', left: 'Enlarged blind spot' },
        fundus: { right: 'Frisén Grade 3 Papilledema (blurred disc margins, venous engorgement)', left: 'Frisén Grade 3 Papilledema (blurred disc margins, venous engorgement)' },
        hearing: { right: 'Normal (pulsatile tinnitus)', left: 'Normal', weber: 'Midline', rinneR: 'AC > BC', rinneL: 'AC > BC' }
      },
      correctNerves: ['VI', 'II'],
      correctSide: 'left',
      expectedFindings: [
        'Left esotropia at rest',
        'Inability to abduct the LEFT eye past midline',
        'Bilateral papilledema on fundoscopy',
        'Normal pupils and normal lid elevation'
      ],
      diagnosisOptions: [
        { id: 'iih_cn6', label: 'Idiopathic Intracranial Hypertension causing Left CN VI Palsy (False Localizing Sign)', correct: true },
        { id: 'left_ino', label: 'Left Internuclear Ophthalmoplegia (MLF lesion)', correct: false },
        { id: 'cn3_left', label: 'Left CN III Palsy', correct: false },
        { id: 'gaze_palsy', label: 'Left Pontine Gaze Palsy (PPRF lesion)', correct: false }
      ],
      explanation: {
        summary: '**Left CN VI (Abducens) palsy** accompanied by **bilateral papilledema** due to elevated intracranial pressure (Idiopathic Intracranial Hypertension / pseudotumor cerebri).',
        anatomy: 'CN VI exits the pontomedullary junction, ascends sharply along the clivus, and passes over the petrous ridge under the petrosphenoidal ligament (Dorello canal). Elevated ICP pushes the brainstem downward, stretching CN VI over the petrous apex—making it the classic "false localizing sign" of raised ICP.',
        whyNotOthers: [
          'A pontine PPRF/CN VI nuclear lesion impairs conjugate gaze of BOTH eyes to the left; here the right eye adducts normally on left gaze.',
          'INO impairs ADduction, whereas here ABduction of the left eye is lost.',
          'Pupils and eyelids are completely intact, ruling out CN III palsy.'
        ],
        nextStep: 'Urgent MRI/MRV brain (to rule out mass lesion and venous sinus thrombosis), followed by lumbar puncture with opening pressure and acetazolamide.'
      }
    },
    {
      id: 'case_4',
      number: 4,
      difficulty: 'Advanced Eye Exam',
      title: 'Double Vision on Right Gaze — Intact Convergence!',
      patient: '26-year-old woman',
      chiefComplaint: '"Over the past 4 days, whenever I glance to my right I get horizontal double vision and things jump briefly. Looking straight ahead or reading up close is totally fine!"',
      vitals: 'BP 116/72 | HR 68 | History of transient blurred vision 1 year ago',
      pathology: {
        leftINO: true,
        smell: { right: 'Normal', left: 'Normal' },
        acuity: { right: '20/20', left: '20/25' },
        fields: { right: 'Full', left: 'Full' },
        fundus: { right: 'Normal disc', left: 'Mild temporal disc pallor (prior neuritis)' },
        hearing: { right: 'Normal', left: 'Normal', weber: 'Midline', rinneR: 'AC > BC', rinneL: 'AC > BC' }
      },
      correctNerves: ['MLF (CN III & VI nerves intact)'],
      correctSide: 'left',
      expectedFindings: [
        'LEFT eye fails to adduct on rightward gaze',
        'RIGHT eye exhibits horizontal abducting nystagmus on rightward gaze',
        'CONVERGENCE IS INTACT (both eyes adduct smoothly to nose!)',
        'Normal pupils and no ptosis'
      ],
      diagnosisOptions: [
        { id: 'left_ino', label: 'Left Internuclear Ophthalmoplegia (Left MLF Demyelination — Multiple Sclerosis)', correct: true },
        { id: 'left_cn3', label: 'Partial Left CN III (Medial Rectus) Palsy', correct: false },
        { id: 'right_cn6', label: 'Right CN VI Palsy', correct: false },
        { id: 'mg', label: 'Ocular Myasthenia Gravis', correct: false }
      ],
      explanation: {
        summary: '**Left Internuclear Ophthalmoplegia (INO)** caused by a demyelinating plaque in the **Left Medial Longitudinal Fasciculus (MLF)**—classic for Multiple Sclerosis in a young adult.',
        anatomy: 'To look right, the right PPRF activates the right CN VI nucleus (abducting the right eye) AND sends interneurons across midline up the LEFT MLF to the left CN III medial rectus subnucleus. A left MLF lesion blocks conjugate adduction of the left eye, while increased neural drive (Hering law) causes overshoot/abducting nystagmus in the right eye. **Testing convergence is the diagnostic clincher**: convergence pathways enter the CN III nucleus directly from the midbrain without using the MLF, so the left medial rectus works perfectly during convergence!',
        whyNotOthers: [
          'A partial Left CN III medial rectus palsy would ALSO fail during convergence!',
          'INO is always named for the side of the eye that FAILS TO ADDUCT (here, the Left eye = Left MLF).'
        ],
        nextStep: 'MRI brain & brainstem with gadolinium (look for periventricular/brainstem demyelinating lesions); IV methylprednisolone for acute relapse.'
      }
    },
    {
      id: 'case_5',
      number: 5,
      difficulty: 'Must-Know Differentiator',
      title: 'Painless Droopy Eyelid in a Diabetic Patient',
      patient: '67-year-old man',
      chiefComplaint: '"I woke up yesterday with my left eyelid drooping and double vision. No thunderclap headache, just mild ache around my brow. I have had type 2 diabetes for 18 years."',
      vitals: 'BP 152/86 | HR 74 | HbA1c 9.4%',
      pathology: {
        leftCN3: true,
        leftPupilBlown: false,
        leftPtosis: 0.78,
        smell: { right: 'Normal', left: 'Normal' },
        acuity: { right: '20/30', left: '20/30' },
        fields: { right: 'Full', left: 'Full' },
        fundus: { right: 'Mild non-proliferative diabetic retinopathy', left: 'Mild non-proliferative diabetic retinopathy' },
        hearing: { right: 'Normal', left: 'Normal', weber: 'Midline', rinneR: 'AC > BC', rinneL: 'AC > BC' }
      },
      correctNerves: ['III'],
      correctSide: 'left',
      expectedFindings: [
        'Left ptosis',
        'Left eye deviated down and out',
        'LEFT PUPIL IS SPARED (3.5 mm, briskly reactive to light!)',
        'Impaired left adduction, elevation, and depression'
      ],
      diagnosisOptions: [
        { id: 'microvascular_cn3', label: 'Microvascular (Diabetic Ischemic) Pupil-Sparing Left CN III Palsy', correct: true },
        { id: 'pcom_left', label: 'Compressive Left PCom Aneurysm (Pupil-Involving)', correct: false },
        { id: 'horner_left', label: 'Left Horner Syndrome', correct: false },
        { id: 'cn4_left', label: 'Left CN IV Palsy', correct: false }
      ],
      explanation: {
        summary: '**Pupil-sparing Left CN III palsy** secondary to **diabetic microvascular ischemia** of the nerve core.',
        anatomy: 'Deep somatic motor axons of CN III are supplied by endoneurial vasa nervorum prone to diabetic/hypertensive occlusion, whereas the superficial parasympathetic pupillomotor fibers enjoy collateral supply from pial blood vessels. Thus complete external ophthalmoplegia + ptosis with a strictly normal, briskly reactive pupil points strongly to microvascular ischemia.',
        whyNotOthers: [
          'A Left PCom aneurysm cannot be excluded by pupil sparing alone: compressive palsies can spare the pupil early or present as a partial palsy, so the "rule of the pupil" is no longer used to skip vascular imaging.',
          'Microvascular palsies typically recover over 8–12 weeks; failure to improve by 3 months, aberrant regeneration, or any new neurologic deficit demands repeat workup.',
          'Horner syndrome has miosis and intact EOM.'
        ],
        nextStep: 'Urgent vascular imaging (CTA or MRA head) plus MRI brain for EVERY acute CN III palsy—pupil sparing does not exclude aneurysm. Age >50: check ESR/CRP (and ask about jaw claudication, scalp tenderness) to screen for giant cell arteritis. Then aggressive glycemic/BP/lipid control and serial exams.'
      }
    },
    {
      id: 'case_6',
      number: 6,
      difficulty: 'Swinging Flashlight Mastery',
      title: 'Painful Monocular Vision Loss',
      patient: '31-year-old woman',
      chiefComplaint: '"Over 3 days my left eye vision became washed out—red stop signs look dull pink—and it aches right behind my eye when I move my eyes."',
      vitals: 'BP 118/74 | HR 72 | Afebrile',
      pathology: {
        leftRAPD: true,
        smell: { right: 'Normal', left: 'Normal' },
        acuity: { right: '20/20', left: '20/200 (red desaturation)' },
        fields: { right: 'Full', left: 'Dense central scotoma' },
        fundus: { right: 'Normal sharp disc', left: 'Normal disc ("patient sees nothing, doctor sees nothing" — retrobulbar!)' },
        hearing: { right: 'Normal', left: 'Normal', weber: 'Midline', rinneR: 'AC > BC', rinneL: 'AC > BC' }
      },
      correctNerves: ['II'],
      correctSide: 'left',
      expectedFindings: [
        'Equal pupils at rest (NO anisocoria!)',
        'Positive LEFT RAPD on Swinging Flashlight Test (left pupil dilates when light swings from OD to OS)',
        'Reduced left visual acuity (20/200) & central scotoma',
        'Full extraocular movements (painful but full)'
      ],
      diagnosisOptions: [
        { id: 'optic_neuritis', label: 'Left Retrobulbar Optic Neuritis (Left CN II Afferent Defect / RAPD)', correct: true },
        { id: 'cn3_eff', label: 'Left CN III Efferent Pupillary Defect', correct: false },
        { id: 'chiasm', label: 'Pituitary Adenoma Compressing Optic Chiasm', correct: false },
        { id: 'horner', label: 'Left Horner Syndrome', correct: false }
      ],
      explanation: {
        summary: '**Left Retrobulbar Optic Neuritis (CN II lesion)** identified objectively by a **Left Relative Afferent Pupillary Defect (Marcus Gunn pupil)** on the swinging flashlight test.',
        anatomy: 'Because CN II is strictly afferent and projects bilaterally to both Edinger-Westphal nuclei, a unilateral optic nerve lesion NEVER causes anisocoria at rest! When you shine the penlight into the healthy Right eye, both pupils constrict briskly. When you swing rapidly to the diseased Left eye, the reduced afferent input makes the brain think the ambient light dimmed—so BOTH pupils paradoxically dilate!',
        whyNotOthers: [
          'An efferent CN III defect causes resting anisocoria (one pupil stays big regardless of which eye is illuminated).',
          'A chiasmal lesion produces bitemporal hemianopia, not a monocular central scotoma with pain on eye movement.'
        ],
        nextStep: 'MRI brain & orbits with contrast (MS risk stratification) and AQP4/MOG antibodies if atypical. Consider high-dose IV methylprednisolone: in the Optic Neuritis Treatment Trial it sped visual recovery but did not change final acuity. Avoid oral prednisone alone at standard doses (higher recurrence in ONTT).'
      }
    },
    {
      id: 'case_7',
      number: 7,
      difficulty: 'Forehead Rule Classic',
      title: 'Woke Up Unable to Close Right Eye',
      patient: '42-year-old man',
      chiefComplaint: '"I woke up this morning and my coffee dribbled out the right side of my mouth. My right eye burns because it won\'t close fully, and loud sounds hurt my right ear."',
      vitals: 'BP 128/78 | HR 76 | No limb weakness or numbness',
      pathology: {
        rightCN7_LMN: true,
        smell: { right: 'Normal', left: 'Normal' },
        acuity: { right: '20/20', left: '20/20' },
        fields: { right: 'Full', left: 'Full' },
        fundus: { right: 'Normal disc', left: 'Normal disc' },
        hearing: { right: 'Normal (hyperacusis to loud noise)', left: 'Normal', weber: 'Midline', rinneR: 'AC > BC', rinneL: 'AC > BC' }
      },
      correctNerves: ['VII'],
      correctSide: 'right',
      expectedFindings: [
        'Right FOREHEAD fails to wrinkle (upper face INVOLVED)',
        'Right lagophthalmos (inability to close right eye completely)',
        'Right nasolabial fold flattened & right mouth droop on smile',
        'Right corneal reflex: intact sensation, absent right blink (intact left consensual blink!)'
      ],
      diagnosisOptions: [
        { id: 'bells', label: 'Right Bell Palsy (Idiopathic Lower Motor Neuron CN VII Palsy)', correct: true },
        { id: 'left_mca', label: 'Left MCA Cortical Stroke (Upper Motor Neuron CN VII Palsy)', correct: false },
        { id: 'cn5', label: 'Right Trigeminal Neuropathy (CN V)', correct: false },
        { id: 'horner', label: 'Right Horner Syndrome', correct: false }
      ],
      explanation: {
        summary: '**Right Lower Motor Neuron (LMN) CN VII Palsy (Bell Palsy)** — involvement of the **ipsilateral forehead** localizes the lesion to the facial nucleus or peripheral CN VII.',
        anatomy: 'The upper facial motor nucleus (frontalis & orbicularis oculi) receives BILATERAL corticobulbar projections, whereas the lower facial nucleus receives only CONTRALATERAL input. Once the signal exits the facial nucleus as the peripheral CN VII nerve, a lesion knocks out BOTH upper and lower ipsilateral face, plus nerve to stapedius (hyperacusis) and chorda tympani (anterior 2/3 taste). Notice the corneal reflex dissociation: touching right cornea triggers a LEFT blink (proving V1 afferent is intact!) but NO right blink (proving right VII efferent is broken).',
        whyNotOthers: [
          'A Left MCA stroke (UMN CN VII) SPARES the right forehead because of intact right-hemisphere corticobulbar input.',
          'CN V controls facial sensation and mastication, not facial expression.'
        ],
        nextStep: 'Inspect external auditory canal for vesicles (Ramsay Hunt), start early oral prednisone (within 72h), and aggressive corneal lubrication/eye taping at night to prevent exposure keratitis.'
      }
    },
    {
      id: 'case_8',
      number: 8,
      difficulty: 'Stroke Localization',
      title: 'Acute Facial Droop With Intact Forehead',
      patient: '71-year-old man',
      chiefComplaint: '"My wife noticed my right smile drooping suddenly 90 minutes ago and my speech feels slightly slurred. My eyes close fine."',
      vitals: 'BP 178/96 | HR 88 (irregularly irregular — AFib)',
      pathology: {
        rightCN7_UMN: true,
        smell: { right: 'Normal', left: 'Normal' },
        acuity: { right: '20/30', left: '20/30' },
        fields: { right: 'Full', left: 'Full' },
        fundus: { right: 'Mild hypertensive arteriolar narrowing', left: 'Mild hypertensive arteriolar narrowing' },
        hearing: { right: 'Normal', left: 'Normal', weber: 'Midline', rinneR: 'AC > BC', rinneL: 'AC > BC' }
      },
      correctNerves: ['VII'],
      correctSide: 'right',
      expectedFindings: [
        'Right lower facial droop & flattened right nasolabial fold',
        'FOREHEAD SPARING — both eyebrows raise symmetrically!',
        'Strong bilateral eye closure',
        'Intact bilateral corneal reflex and facial sensation'
      ],
      diagnosisOptions: [
        { id: 'umn_stroke', label: 'Left Cerebral Hemisphere (MCA) Ischemic Stroke causing Right UMN CN VII Weakness', correct: true },
        { id: 'bells_right', label: 'Right Bell Palsy (Peripheral LMN CN VII)', correct: false },
        { id: 'right_stroke', label: 'Right MCA Stroke causing Ipsilateral UMN CN VII Weakness', correct: false },
        { id: 'cn12', label: 'Isolated Right CN XII Palsy', correct: false }
      ],
      explanation: {
        summary: '**Right Upper Motor Neuron (Central) CN VII weakness** from an acute **Left MCA territory ischemic stroke**.',
        anatomy: 'Always test the forehead! Because the upper face gets bilateral cortical innervation from both hemispheres, a left corticobulbar tract/motor cortex stroke leaves the right forehead intact while paralyzing the contralateral (right) lower face.',
        whyNotOthers: [
          'Bell palsy paralyzes the ipsilateral forehead and eye closure—misdiagnosing a central stroke as Bell palsy is a catastrophic bedside error!',
          'Corticobulbar fibers for the lower face decussate, so a right lower facial droop localizes to the LEFT cerebral hemisphere.'
        ],
        nextStep: 'Activate Code Stroke immediately! Stat non-contrast Head CT & CTA to evaluate for IV thrombolysis (within 4.5h window) and mechanical thrombectomy.'
      }
    },
    {
      id: 'case_9',
      number: 9,
      difficulty: 'Multi-Nerve Localization',
      title: 'Progressive Hearing Loss & Cheek Tingling',
      patient: '58-year-old woman',
      chiefComplaint: '"Over the past year I\'ve had to switch the phone to my left ear because my right ear sounds muffled with constant ringing. Lately my right cheek feels slightly numb."',
      vitals: 'BP 126/78 | HR 70 | Mild unsteadiness on tandem gait',
      pathology: {
        rightCN8_SNHL: true,
        rightCN5_sensory: true,
        rightCN7_mild: true,
        smell: { right: 'Normal', left: 'Normal' },
        acuity: { right: '20/20', left: '20/20' },
        fields: { right: 'Full', left: 'Full' },
        fundus: { right: 'Normal disc', left: 'Normal disc' },
        hearing: { right: 'Markedly reduced', left: 'Normal', weber: 'Lateralizes to LEFT (normal ear)', rinneR: 'AC > BC (both reduced)', rinneL: 'AC > BC (normal)' }
      },
      correctNerves: ['VIII', 'V', 'VII'],
      correctSide: 'right',
      expectedFindings: [
        'Right sensorineural hearing loss (Weber lateralizes LEFT; Rinne AC > BC)',
        'Absent/diminished RIGHT corneal reflex (both direct & consensual absent when touching right cornea!)',
        'Decreased sensation over right V1/V2 face',
        'Subtle right facial asymmetry / mild LMN CN VII weakness'
      ],
      diagnosisOptions: [
        { id: 'cpa_schwannoma', label: 'Right Cerebellopontine Angle (CPA) Tumor — Vestibular Schwannoma (CN VIII + V + VII)', correct: true },
        { id: 'conductive_otitis', label: 'Right Conductive Hearing Loss from Otitis Media', correct: false },
        { id: 'bells', label: 'Isolated Right Bell Palsy', correct: false },
        { id: 'jugular', label: 'Right Jugular Foramen Syndrome (CN IX, X, XI)', correct: false }
      ],
      explanation: {
        summary: '**Right Cerebellopontine Angle (CPA) Syndrome**, classically caused by a **Vestibular Schwannoma (Acoustic Neuroma)** compressing CN VIII, CN V, and CN VII.',
        anatomy: 'The tumor arises from Schwann cells of the vestibular division of CN VIII inside the internal acoustic meatus, causing asymmetric sensorineural hearing loss (Weber to the healthy LEFT ear, Rinne positive AC > BC). As it expands into the CPA cistern, it stretches CN V superiorly (diminished right corneal reflex—often the earliest non-auditory sign!) and CN VII anteriorly (subtle facial weakness).',
        whyNotOthers: [
          'In conductive hearing loss, Weber lateralizes to the AFFECTED (right) ear and Rinne becomes negative (BC > AC).',
          'Jugular foramen syndrome affects CN IX, X, and XI (palate, voice, shoulder), NOT CN V/VII/VIII.'
        ],
        nextStep: 'Formal audiometry and MRI Brain / Internal Auditory Canals (IAC) with gadolinium contrast.'
      }
    },
    {
      id: 'case_10',
      number: 10,
      difficulty: 'Lower Cranial Nerves',
      title: 'Hoarseness, Dysphagia & Crooked Tongue',
      patient: '61-year-old man',
      chiefComplaint: '"After a neck mass biopsy and worsening neck pain, my voice became hoarse, liquids go down the wrong pipe, my right shoulder droops, and my tongue feels thick."',
      vitals: 'BP 134/80 | HR 78 | Hoarse, breathy voice',
      pathology: {
        rightCN9_10: true,
        rightCN11: true,
        rightCN12: true,
        smell: { right: 'Normal', left: 'Normal' },
        acuity: { right: '20/25', left: '20/25' },
        fields: { right: 'Full', left: 'Full' },
        fundus: { right: 'Normal disc', left: 'Normal disc' },
        hearing: { right: 'Normal', left: 'Normal', weber: 'Midline', rinneR: 'AC > BC', rinneL: 'AC > BC' }
      },
      correctNerves: ['IX', 'X', 'XI', 'XII'],
      correctSide: 'right',
      expectedFindings: [
        'On "Ahh": right soft palate droops, UVULA DEVIATES TO THE LEFT (away from lesion!)',
        'Absent right gag reflex & hoarse voice',
        'Weak RIGHT shoulder shrug (Right Trapezius) & weak head turn TO THE LEFT (Right SCM!)',
        'Tongue protrudes and DEVIATES TO THE RIGHT (toward lesion!) with right atrophy/fasciculations'
      ],
      diagnosisOptions: [
        { id: 'collet_sicard', label: 'Right Collet-Sicard Syndrome (Jugular Foramen + Hypoglossal Canal: CN IX, X, XI, XII)', correct: true },
        { id: 'left_bulbar', label: 'Left Lower Cranial Neuropathy (Left CN IX, X, XI, XII)', correct: false },
        { id: 'cpa_right', label: 'Right Cerebellopontine Angle Lesion (CN V, VII, VIII)', correct: false },
        { id: 'myasthenia', label: 'Isolated Bulbar Myasthenia Gravis', correct: false }
      ],
      explanation: {
        summary: '**Right Collet-Sicard Syndrome** (skull base / retroparotid space mass or internal carotid dissection compressing **Right CN IX, X, XI, and XII**).',
        anatomy: 'This case tests the **directional rules** of the lower cranial nerves that trip up even experienced physicians:\n• **CN X (Vagus):** Uvula deviates **AWAY** from the lesion (to the LEFT) because the healthy left levator veli palatini pulls it up.\n• **CN XI (Accessory):** Right Trapezius shrugs the RIGHT shoulder (ipsilateral), while Right SCM turns the chin to the **LEFT** (contralateral)!\n• **CN XII (Hypoglossal):** Tongue deviates **TOWARD** the lesion (to the RIGHT, "licks the lesion") because the healthy left genioglossus pushes it rightward.',
        whyNotOthers: [
          'Do not be fooled by leftward uvula deviation and weak leftward head turn—both localize to the RIGHT side!',
          'Unilateral tongue atrophy/fasciculations are LMN CN XII signs, ruling out myasthenia gravis.'
        ],
        nextStep: 'Urgent MRI/MRA skull base and neck (evaluate skull base neoplasm, glomus jugulare tumor, or internal carotid artery dissection) + swallow safety evaluation.'
      }
    },
    {
      id: 'case_11',
      number: 11,
      difficulty: 'HINTS — Acute Vestibular Syndrome',
      title: 'Room Spinning Since Yesterday',
      patient: '44-year-old woman',
      chiefComplaint: '"I woke up yesterday with the room spinning nonstop. I have thrown up six times and every head movement makes it worse. I had a cold last week. My hearing is fine."',
      vitals: 'BP 132/84 | HR 96 | Walks with a wide base but can stand unassisted',
      pathology: {
        vestibular: 'peripheral_right',
        smell: { right: 'Normal', left: 'Normal' },
        acuity: { right: '20/20', left: '20/20' },
        fields: { right: 'Full', left: 'Full' },
        fundus: { right: 'Normal disc', left: 'Normal disc' },
        hearing: { right: 'Normal', left: 'Normal', weber: 'Midline', rinneR: 'AC > BC', rinneL: 'AC > BC' }
      },
      correctNerves: ['VIII (vestibular division)'],
      correctSide: 'right',
      expectedFindings: [
        'Head impulse to the RIGHT: eyes dragged off target, then corrective catch-up saccade (ABNORMAL = peripheral)',
        'Head impulse to the LEFT: normal',
        'Left-beating horizontal nystagmus in all gaze positions, strongest on LEFT gaze (unidirectional, Alexander law)',
        'Alternate cover test: no vertical refixation (no skew); hearing normal'
      ],
      diagnosisOptions: [
        { id: 'vn_right', label: 'Right Vestibular Neuritis (Peripheral — reassuring HINTS)', correct: true },
        { id: 'pica_stroke', label: 'Posterior Circulation (PICA) Stroke', correct: false },
        { id: 'bppv', label: 'Benign Paroxysmal Positional Vertigo (BPPV)', correct: false },
        { id: 'labyrinthitis', label: 'Right Labyrinthitis', correct: false }
      ],
      explanation: {
        summary: '**Right Vestibular Neuritis** — continuous vertigo with a fully **peripheral HINTS pattern**: abnormal impulse to the right, unidirectional left-beating nystagmus, and no skew.',
        anatomy: 'Inflammation of the right superior vestibular nerve removes input from the right horizontal canal. During a rapid head turn to the right, the right canal should drive the VOR; with it lost the eyes move with the head and must jump back to the target (overt catch-up saccade). The tone imbalance between the two vestibular nuclei produces a slow drift to the right with fast phases beating LEFT, away from the lesion, in every direction of gaze.',
        whyNotOthers: [
          'Stroke: HINTS is only reassuring when ALL THREE components are peripheral. One central sign (normal impulse, direction-changing nystagmus, or skew) mandates stroke workup.',
          'BPPV causes brief positional episodes lasting seconds, not continuous vertigo for a day; diagnose with Dix-Hallpike, not HINTS.',
          'Labyrinthitis adds sensorineural hearing loss; new hearing loss in acute vertigo can also be AICA stroke (HINTS "plus").'
        ],
        nextStep: 'HINTS is validated only in continuous acute vestibular syndrome with spontaneous nystagmus, performed by a trained examiner. Short course of antiemetics/vestibular suppressants (≤3 days), consider early oral corticosteroids, and start vestibular rehabilitation. Imaging is not required when the full peripheral pattern is present and no other neurologic deficits exist.'
      }
    },
    {
      id: 'case_12',
      number: 12,
      difficulty: 'HINTS — Do Not Miss',
      title: 'Vertigo That Looks Like Neuritis',
      patient: '63-year-old man',
      chiefComplaint: '"The room started spinning three hours ago while I was watching TV, and it has not stopped. I feel sick and keep falling to the left. No headache, no weakness, no numbness."',
      vitals: 'BP 172/98 | HR 84 | Diabetic smoker | Cannot walk without assistance',
      pathology: {
        vestibular: 'central_left',
        skewLeftHypo: 0.075,
        smell: { right: 'Normal', left: 'Normal' },
        acuity: { right: '20/25', left: '20/25' },
        fields: { right: 'Full', left: 'Full' },
        fundus: { right: 'Mild hypertensive arteriolar narrowing', left: 'Mild hypertensive arteriolar narrowing' },
        hearing: { right: 'Normal', left: 'Normal', weber: 'Midline', rinneR: 'AC > BC', rinneL: 'AC > BC' }
      },
      correctNerves: ['None — CN VIII intact (central vestibular pathways)'],
      correctSide: 'left',
      expectedFindings: [
        'Head impulse NORMAL in both directions (no catch-up saccade) — dangerous in acute vestibular syndrome!',
        'Direction-changing gaze-evoked nystagmus: RIGHT-beating on right gaze, LEFT-beating on left gaze',
        'Skew deviation: left hypotropia with vertical refixation on alternate cover',
        'Severe truncal ataxia (cannot walk unaided); other cranial nerves normal'
      ],
      diagnosisOptions: [
        { id: 'pica_stroke', label: 'Left Cerebellar / Lateral Medullary (PICA Territory) Ischemic Stroke', correct: true },
        { id: 'vn_left', label: 'Left Vestibular Neuritis', correct: false },
        { id: 'menieres', label: 'Ménière Disease', correct: false },
        { id: 'bppv', label: 'Posterior Canal BPPV', correct: false }
      ],
      explanation: {
        summary: '**Central acute vestibular syndrome** from a **left PICA-territory (cerebellar/lateral medullary) stroke** — all three HINTS components point central (INFARCT: **I**mpulse **N**ormal, **F**ast-phase **A**lternating, **R**efixation on **C**over **T**est).',
        anatomy: 'The vestibular nerve and VOR arc are intact, so the head impulse is NORMAL — paradoxically the most worrying finding in a patient with continuous vertigo. Damage to the cerebellar flocculus/nucleus prepositus (the gaze-holding neural integrator) causes gaze-evoked nystagmus whose fast phase beats toward the direction of gaze. Injury to utricular graviceptive pathways crossing the medulla creates a vertical skew deviation with the ipsilesional eye lower.',
        whyNotOthers: [
          'Vestibular neuritis would give an ABNORMAL impulse toward the lesion and unidirectional nystagmus, with no skew.',
          'Early MRI with DWI misses roughly 10–20% of posterior circulation strokes in the first 24–48 h (especially small ones); a central HINTS exam in AVS is more sensitive than early MRI.',
          'Ménière disease presents with episodic vertigo lasting hours plus fluctuating hearing loss, tinnitus, and aural fullness.'
        ],
        nextStep: 'Activate stroke pathway: urgent CTA head/neck (vertebral dissection/occlusion) and MRI brain with DWI (repeat if negative and suspicion persists); evaluate for thrombolysis within the time window; monitor for cerebellar edema and brainstem compression (neurosurgical backup).'
      }
    }
  ];

  // Memorization / Rapid-Fire Questions for Mode 3
  const RAPID_FIRE_QUESTIONS = [
    {
      q: 'To isolate the Superior Oblique (CN IV) as a pure depressor, which direction must the eye move FIRST?',
      options: ['Adduct (look inward), then look down', 'Abduct (look outward), then look down', 'Look straight down in primary gaze', 'Abduct, then look up'],
      answer: 0,
      why: 'The SO tendon angles 51 deg from the nasal trochlea. Adducting aligns the visual axis with the SO pull, turning it into a pure depressor ("down and in").'
    },
    {
      q: 'To isolate the Superior Rectus (CN III) as a pure elevator, which direction must the patient look?',
      options: ['Up and OUT (abducted)', 'Up and IN (adducted)', 'Down and OUT (abducted)', 'Straight up only'],
      answer: 0,
      why: 'The orbital axis sits 23 deg lateral to primary gaze. Abducting aligns the visual axis with the SR/IR plane -> SR elevates purely when abducted ("up and out").'
    },
    {
      q: 'A patient has a RIGHT CN IV (Trochlear) palsy. Which way do they tilt their head to minimize double vision?',
      options: ['Tilt head to the LEFT (away from lesion)', 'Tilt head to the RIGHT (toward lesion)', 'Chin down only', 'Head turn to the right'],
      answer: 0,
      why: 'Right SO intorts the right eye. Tilting to the RIGHT demands right intorsion, worsening hypertropia (Bielschowsky positive). Patients tilt AWAY (LEFT) to relax the right SO.'
    },
    {
      q: 'During the Swinging Flashlight Test, swinging from OD to OS causes the LEFT pupil to dilate. Where is the lesion?',
      options: ['Left CN II (Optic nerve — afferent defect)', 'Left CN III (Oculomotor — efferent defect)', 'Right CN II (Optic nerve)', 'Left sympathetic chain (Horner)'],
      answer: 0,
      why: 'Paradoxical dilation when swinging light to OS is a Left RAPD (Marcus Gunn pupil), localizing to impaired afferent input in the Left CN II.'
    },
    {
      q: 'On rightward gaze, the LEFT eye fails to adduct and the RIGHT eye has abducting nystagmus. Convergence is INTACT. What is the lesion?',
      options: ['Left MLF (Left INO)', 'Right MLF (Right INO)', 'Left CN III medial rectus branch', 'Right CN VI nucleus'],
      answer: 0,
      why: 'INO is named for the side of the eye that fails to adduct (Left eye = Left MLF). Preserved convergence rules out a CN III medial rectus lesion.'
    },
    {
      q: 'Which cranial nerve exits DORSALLY from the brainstem and completely decussates?',
      options: ['CN IV (Trochlear)', 'CN VI (Abducens)', 'CN III (Oculomotor)', 'CN XII (Hypoglossal)'],
      answer: 0,
      why: 'CN IV is the only cranial nerve exiting the dorsal midbrain (just below the inferior colliculi) and decussating completely.'
    },
    {
      q: 'To test the RIGHT Sternocleidomastoid (CN XI), you ask the patient to turn their head against resistance to the:',
      options: ['LEFT', 'RIGHT', 'Straight down', 'Tilt ear to right shoulder'],
      answer: 0,
      why: 'The right SCM pulls the right mastoid anteriorly/medially, rotating the chin to the CONTRALATERAL (left) side.'
    },
    {
      q: 'In a unilateral RIGHT CN X (Vagus) lesion, saying "Ahh" causes the uvula to deviate:',
      options: ['To the LEFT (away from lesion)', 'To the RIGHT (toward lesion)', 'Downward symmetrically', 'Uvula does not move'],
      answer: 0,
      why: 'The intact left palatal musculature contracts and pulls the uvula AWAY from the weak right side.'
    },
    {
      q: 'In a unilateral RIGHT LMN CN XII (Hypoglossal) lesion, protruding the tongue causes it to deviate:',
      options: ['To the RIGHT (toward lesion)', 'To the LEFT (away from lesion)', 'Straight midline with no change', 'Upward toward palate'],
      answer: 0,
      why: 'The intact left genioglossus pushes the tongue forward and rightward -> the tongue "licks the lesion" (deviates toward the weak side).'
    },
    {
      q: 'Which cranial nerve palsy is most famously the "false localizing sign" of elevated intracranial pressure?',
      options: ['CN VI (Abducens)', 'CN IV (Trochlear)', 'CN III (Oculomotor)', 'CN VII (Facial)'],
      answer: 0,
      why: 'CN VI is stretched downward over the petrous apex (Dorello canal) when intracranial pressure rises.'
    },
    {
      q: 'Which muscle is the YOKE muscle (paired for conjugate gaze) of the Right Superior Oblique?',
      options: ['Left Inferior Rectus', 'Left Superior Rectus', 'Left Inferior Oblique', 'Left Lateral Rectus'],
      answer: 0,
      why: 'When looking down and left, the Right eye adducts & depresses via Right SO while the Left eye abducts & depresses via Left IR -> yoke pair!'
    },
    {
      q: 'What is the AFFERENT and EFFERENT limb of the Corneal Blink Reflex?',
      options: ['Afferent: CN V1 | Efferent: Bilateral CN VII', 'Afferent: CN II | Efferent: CN III', 'Afferent: CN VII | Efferent: CN V1', 'Afferent: CN V2 | Efferent: Ipsilateral CN VII only'],
      answer: 0,
      why: 'Touching the cornea activates CN V1 (ophthalmic division), which signals BOTH facial nuclei (CN VII) to produce direct and consensual blinking.'
    },
    {
      q: 'A patient with continuous vertigo has a NORMAL head impulse test in both directions. What does this suggest?',
      options: ['Central cause (e.g. cerebellar stroke) — VOR is intact', 'Peripheral vestibular neuritis', 'Benign positional vertigo', 'The test was done incorrectly; it is always abnormal in vertigo'],
      answer: 0,
      why: 'In acute vestibular syndrome, a normal impulse means the peripheral VOR arc works — so the lesion is likely central. The "I" in INFARCT = Impulse Normal.'
    },
    {
      q: 'Which nystagmus pattern is reassuringly PERIPHERAL in acute vestibular syndrome?',
      options: ['Unidirectional horizontal nystagmus beating away from the lesion in all gaze positions', 'Right-beating on right gaze, left-beating on left gaze', 'Pure vertical downbeat nystagmus', 'Pure torsional nystagmus'],
      answer: 0,
      why: 'Peripheral nystagmus keeps the same fast-phase direction in every gaze (stronger toward the fast phase — Alexander law). Direction-changing, pure vertical, or pure torsional nystagmus is central.'
    }
  ];

  // Optimal Bedside Clinical Grouping Order (How Neurologists Actually Examine CN I-XII Smoothly)
  const BEDSIDE_FLOW = [
    { step: 1, title: 'Inspection at Rest', nerves: 'CN III, VII, XI, XII', detail: 'Check lid height (ptosis), pupil size (anisocoria), resting eye alignment, nasolabial folds, and head tilt before touching the patient.' },
    { step: 2, title: 'Vision & Pupils (II, III)', nerves: 'CN II, III', detail: 'Acuity, 4-quadrant confrontation fields, direct/consensual light reflex, SWINGING FLASHLIGHT (RAPD), and fundoscopy.' },
    { step: 3, title: 'Ocular Motility — The H-Test (III, IV, VI)', nerves: 'CN III, IV, VI', detail: 'Trace wide H (abduct/adduct fully, then UP & DOWN at lateral extremes -> isolates SR/IR in abduction & IO/SO in adduction!). Check convergence, saccades, and head-tilt if vertical diplopia.' },
    { step: 4, title: 'Face Sensation, Cornea & Jaw (V)', nerves: 'CN V', detail: 'Light touch/pinprick V1-V2-V3 (skip jaw angle!), corneal blink reflex, clench masseters, open jaw (watch for deviation).' },
    { step: 5, title: 'Facial Expression (VII)', nerves: 'CN VII', detail: 'Raise eyebrows (FOREHEAD SPARING!), squeeze eyes shut, puff cheeks, show teeth/smile.' },
    { step: 6, title: 'Hearing & Balance (VIII)', nerves: 'CN VIII', detail: 'Finger rub per ear; if asymmetric, 512 Hz Weber & Rinne tuning fork tests. In continuous acute vertigo with nystagmus: HINTS (Head Impulse, Nystagmus, Test of Skew).' },
    { step: 7, title: 'Oropharynx & Tongue (IX, X, XII)', nerves: 'CN IX, X, XII', detail: 'Listen to voice. Say "Ahh" (palate elevation & midline uvula). Inspect tongue AT REST (fasciculations), then protrude (deviation).' },
    { step: 8, title: 'Neck & Shoulders (XI) + Smell (I)', nerves: 'CN XI (+ CN I if indicated)', detail: 'Turn head against resistance (contralateral SCM), shrug shoulders (ipsilateral Trapezius). Test CN I per nostril if trauma/cognitive/frontal concern.' }
  ];

  // Individual composable nerve deficits for Nerve-by-Nerve Injector & Random Mystery Mode
  const NERVE_DEFICITS = [
    {
      id: 'cn2_rapd_left',
      cn: 'II',
      short: 'CN II: Left RAPD',
      title: 'Left Optic Neuropathy (CN II — Left RAPD)',
      howToTest: 'Use Penlight -> Swing Light (OD ↔ OS) and check CN II Fields & Fundus.',
      explanation: 'Afferent CN II lesion causes NO resting anisocoria, but swinging light from OD to OS causes both pupils to paradoxically dilate (Marcus Gunn pupil) with reduced OS acuity and central scotoma.',
      state: { leftRAPD: true, leftAcuity: '20/200 (red desaturation)', leftFieldDefect: 'central_scotoma', fundusLeft: 'Optic disc edema / mild pallor' }
    },
    {
      id: 'cn3_surg_right',
      cn: 'III',
      short: 'CN III: R Surgical (Pupil+)',
      title: 'Right Pupil-Involving CN III Palsy (Compressive / PCom)',
      howToTest: 'Inspect right lid (ptosis), click "Lift R Lid", run Auto H-Test, and check pupils with Penlight.',
      explanation: 'External compression damages superficial parasympathetic fibers (6.5 mm unreactive pupil) + somatic motor fibers (ptosis + "down and out" eye). Surgical emergency!',
      state: { rightCN3: true, rightPupilBlown: true, rightPtosis: 0.85 }
    },
    {
      id: 'cn3_micro_left',
      cn: 'III',
      short: 'CN III: L Microvascular',
      title: 'Left Pupil-Sparing CN III Palsy (Diabetic Microvascular)',
      howToTest: 'Click "Lift L Lid", run Auto H-Test, and shine Penlight to verify briskly reactive 3.5 mm pupil.',
      explanation: 'Central vasa nervorum ischemia paralyzes levator & SR/IR/MR/IO ("down and out" + ptosis) while sparing outer pial-supplied pupillomotor fibers.',
      state: { leftCN3: true, leftPupilBlown: false, leftPtosis: 0.78 }
    },
    {
      id: 'cn4_right',
      cn: 'IV',
      short: 'CN IV: R Trochlear (SO)',
      title: 'Right CN IV (Trochlear) Palsy — Superior Oblique',
      howToTest: 'Look Down & Left (↘ on 9-Gaze Pad) and slide Bielschowsky Head Tilt toward R Tilt vs L Tilt.',
      explanation: 'Right Superior Oblique weakness impairs depression in adduction ("down and in") and intorsion -> right hypertropia worse on RIGHT head tilt; patient tilts head LEFT to compensate.',
      state: { rightCN4: true, defaultHeadTilt: -14 }
    },
    {
      id: 'cn5_sens_right',
      cn: 'V',
      short: 'CN V: R Sensory / Corneal',
      title: 'Right Trigeminal Sensory Loss (CN V1–V2 + Absent Corneal)',
      howToTest: 'Click "CN V Touch" and test "Corneal R" vs "Corneal L".',
      explanation: 'Right CN V1 afferent loss abolishes BOTH direct (right) and consensual (left) blinks when touching the right cornea, while touching the left cornea triggers a normal bilateral blink.',
      state: { rightCN5_sensory: true }
    },
    {
      id: 'cn5_motor_right',
      cn: 'V',
      short: 'CN V3: R Jaw Deviation',
      title: 'Right Trigeminal Motor Weakness (CN V3)',
      howToTest: 'Click "CN V Jaw" to watch the mandible deviate on opening.',
      explanation: 'The unopposed healthy left lateral pterygoid pushes the jaw toward the weak side -> jaw deviates TO THE RIGHT (toward the lesion).',
      state: { rightCN5_motor: true }
    },
    {
      id: 'cn6_left',
      cn: 'VI',
      short: 'CN VI: L Abducens (LR)',
      title: 'Left CN VI (Abducens) Palsy — Lateral Rectus',
      howToTest: 'Click → (Left Gaze) on 9-Gaze Pad or run Auto H-Test.',
      explanation: 'Left Lateral Rectus paralysis causes resting left esotropia and inability to abduct the left eye past midline with normal pupils and lids.',
      state: { leftCN6: true }
    },
    {
      id: 'ino_left',
      cn: 'MLF',
      short: 'MLF: Left INO',
      title: 'Left Internuclear Ophthalmoplegia (Left MLF Lesion)',
      howToTest: 'Click ← (Right Gaze) to see failed left adduction + right nystagmus, THEN click "◎ Converge"!',
      explanation: 'Left MLF disconnection blocks conjugate left adduction on rightward gaze with contralateral abducting nystagmus, while CONVERGENCE stays completely intact!',
      state: { leftINO: true }
    },
    {
      id: 'horner_right',
      cn: 'Symp',
      short: 'Horner: Right Miosis+Ptosis',
      title: 'Right Horner Syndrome (Oculosympathetic Palsy)',
      howToTest: 'Inspect mild right ptosis + small 2.2 mm right pupil; run Auto H-Test to confirm FULL EOM.',
      explanation: 'Loss of sympathetic tone to Müller muscle (mild 1–2 mm ptosis) and iris dilator (miosis). Completely full extraocular motility distinguishes it from CN III palsy.',
      state: { rightHorner: true, rightPtosis: 0.28 }
    },
    {
      id: 'cn7_lmn_right',
      cn: 'VII',
      short: 'CN VII: R Bell (LMN)',
      title: 'Right Lower Motor Neuron CN VII Palsy (Bell Palsy)',
      howToTest: 'Click "CN VII Brows", "CN VII Close Eyes", "CN VII Smile", and "Corneal R".',
      explanation: 'Peripheral CN VII lesion paralyzes BOTH upper (no right forehead wrinkling, lagophthalmos) and lower right face. Corneal touch on right triggers consensual left blink only.',
      state: { rightCN7_LMN: true }
    },
    {
      id: 'cn7_umn_right',
      cn: 'VII',
      short: 'CN VII: R Stroke (UMN)',
      title: 'Right Upper Motor Neuron CN VII Weakness (Left MCA Stroke)',
      howToTest: 'Click "CN VII Brows" (FOREHEAD SPARED!) then "CN VII Smile" (right lower droop!).',
      explanation: 'Upper facial motor nucleus gets bilateral cortical input, so a left hemispheric stroke spares the right forehead while drooping the right lower face.',
      state: { rightCN7_UMN: true }
    },
    {
      id: 'cn8_snhl_right',
      cn: 'VIII',
      short: 'CN VIII: R SNHL',
      title: 'Right Sensorineural Hearing Loss (CN VIII)',
      howToTest: 'Click "CN VIII Weber/Rinne".',
      explanation: 'In right CN VIII sensorineural loss, 512 Hz Weber lateralizes to the HEALTHY LEFT ear, and Rinne stays positive (AC > BC) bilaterally.',
      state: { rightCN8_SNHL: true }
    },
    {
      id: 'cn9_10_right',
      cn: 'IX/X',
      short: 'CN IX/X: R Palate/Uvula',
      title: 'Right Vagal / Bulbar Palsy (CN IX & X)',
      howToTest: 'Click "CN IX/X \'Ahh\'" to zoom into the open mouth and watch the soft palate & uvula.',
      explanation: 'Right palatal arch droops while the healthy left palate elevates, pulling the uvula AWAY from the lesion (to the LEFT!).',
      state: { rightCN9_10: true }
    },
    {
      id: 'cn11_right',
      cn: 'XI',
      short: 'CN XI: R SCM & Shrug',
      title: 'Right Spinal Accessory Palsy (CN XI)',
      howToTest: 'Click "CN XI Turn L (R SCM)" and "CN XI Shrug".',
      explanation: 'Right SCM turns the chin CONTRALATERALLY (weak turn to the LEFT), while Right Trapezius shrugs the IPSILATERAL (right) shoulder!',
      state: { rightCN11: true }
    },
    {
      id: 'cn12_right',
      cn: 'XII',
      short: 'CN XII: R Tongue Dev',
      title: 'Right Hypoglossal Palsy (CN XII)',
      howToTest: 'Click "CN XII Tongue" (and inspect resting tongue inside open mouth for fasciculations!).',
      explanation: 'The healthy left genioglossus pushes the protruded tongue TOWARD the weak side ("licks the lesion" -> deviates to the RIGHT).',
      state: { rightCN12: true }
    },
    {
      id: 'vest_periph_right',
      cn: 'VIII',
      short: 'CN VIII: R Vestibular Neuritis',
      title: 'Right Vestibular Neuritis (HINTS Peripheral Pattern)',
      howToTest: 'Click "HINTS Impulse R" and "HINTS Impulse L", then "HINTS Nystagmus" and "HINTS Alt Cover".',
      explanation: 'Abnormal head impulse to the RIGHT (catch-up saccade), unidirectional LEFT-beating nystagmus, no skew = peripheral right vestibular lesion.',
      state: { vestibular: 'peripheral_right' }
    },
    {
      id: 'vest_central_left',
      cn: 'Central',
      short: 'Central AVS: L Cerebellar Stroke',
      title: 'Left Cerebellar/Medullary Stroke (HINTS Central Pattern)',
      howToTest: 'Click "HINTS Impulse R/L" (both NORMAL!), "HINTS Nystagmus" (direction-changing) and "HINTS Alt Cover" (skew).',
      explanation: 'Normal head impulse + direction-changing nystagmus + skew deviation: any one of these in acute vestibular syndrome = INFARCT (Impulse Normal, Fast-phase Alternating, Refixation on Cover Test).',
      state: { vestibular: 'central_left', skewLeftHypo: 0.075 }
    }
  ];

  return {
    CRANIAL_NERVES,
    EOM_MUSCLES,
    PATHOLOGY_PRESETS,
    NERVE_DEFICITS,
    CLINICAL_CASES,
    RAPID_FIRE_QUESTIONS,
    BEDSIDE_FLOW
  };
})();

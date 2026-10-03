# PETRADOC — COMPACT MASTER BUILD PROMPT

You are building **PetraDOC**, a premium cross-platform **Doctor Practice, Patient Record, Consultation, Prescription & Follow-up Management System**.

## 1. CORE REQUIREMENT

Build the complete project directly inside the **blank GitHub repository**.

You must:

* Create the project structure.
* Implement the application.
* Create required documentation.
* Keep architecture production-ready and extensible.
* Run/verify `npm install`, `npm run dev`, and `npm run build`.
* Commit and push completed work to GitHub.
* Do not create fake/mock functionality that is presented as real.

Current development is **WEB/NPM ONLY**.

Do **NOT** build APK or EXE now.

Future architecture must support:

`React/Web → Capacitor → Android APK`

`React/Web → Tauri → Windows EXE`

---

# 2. TECH STACK

Use:

* Next.js + React + TypeScript
* Tailwind CSS
* Prisma + PostgreSQL architecture
* Modular, maintainable code
* Responsive mobile-first UI
* Repository/service abstraction for future local-first/native storage

Avoid unnecessary dependencies.

---

# 3. CORE MODULES

Implement:

### Dashboard

* Today's appointments
* Patient count
* Recent consultations
* Follow-ups
* Quick actions

### Patients

* Name, photo
* Patient ID
* DOB/age, gender
* Mobile, address
* Blood group
* Occupation
* Emergency contact
* Allergies
* Medical history
* Notes
* Search by name/mobile/ID
* Complete patient history timeline

### Consultation

Workflow:

`Patient → Consultation → Diagnosis → Prescription → Tests → Advice → Follow-up → Save → Print/PDF`

Include:

* Chief complaint
* History
* Vitals
* Examination
* Diagnosis/clinical impression
* Prescription
* Investigations
* Advice
* Follow-up date/notes

Vitals:
BP, pulse, temperature, SpO₂, respiratory rate, weight, height, BMI.

---

# 4. MEDICINE & TESTS

Medicine database:

* Generic
* Brand
* Strength
* Dosage form
* Route
* Manufacturer

Prescription:

* Medicine
* Strength
* Dose
* Frequency
* Route
* Duration
* Instructions

Include:

* Favourite medicines
* Quick prescription templates
* Previous prescription → **Use as New Prescription**
* Manual medicine entry

Investigation system:

* Test database
* Test categories
* Custom test panels
* Manual test entry

---

# 5. DOCTOR PROFILE

Doctor must be able to create/edit their own profile.

Include:

**Personal**

* Name, photo
* Gender
* Phone/email
* Address

**Professional**

* Professional title
* Specialty/sub-specialty
* BMDC registration number
* Experience
* Position/department
* Expertise
* Languages

**Education**
Unlimited entries:

* Degree
* Institution
* Passing year
* Specialty

**Training/Certification**

* Training
* Institution
* Duration
* Year
* Certification

**Experience**

* Position
* Hospital/institution
* Department
* From/to
* Description

**Chambers**
Multiple chambers:

* Name
* Address
* Phone
* Visiting hours
* Consultation fee

---

# 6. PRESCRIPTION

Create professional prescription output with:

* Doctor name/photo/logo
* Degree
* Specialty
* BMDC number
* Chamber
* Contact information
* Patient information
* Diagnosis
* Medicines
* Investigations
* Advice
* Follow-up
* Doctor signature
* Prescription ID
* Footer/custom advice

Provide:

* Live prescription header preview
* PDF generation
* A4 printing
* Normal printer support
* 58mm/80mm thermal-printer-ready architecture

Do not fake Bluetooth/USB/network printer integration. Create proper abstraction for future native implementation.

---

# 7. APPOINTMENT & PRACTICE

Include:

* Appointment management
* Token/queue
* Follow-up tracking
* Multiple doctors
* Multiple chambers
* Doctor dashboard

---

# 8. LOCAL-FIRST & BACKUP

Architecture must support offline/local-first operation.

Future storage targets:

* Web: IndexedDB/Dexie
* Android/Desktop: SQLite
* Server: PostgreSQL

Create backup/restore architecture.

Google Drive should be treated as a **backup/sync destination**, not the primary database.

---

# 9. LICENSING

Build a proper licensing architecture for commercial software:

States:

* Unactivated
* Trial
* Active
* Expired
* Revoked
* Invalid

Use service/repository/validator abstraction.

Do not hardcode a permanent license key.

Prepare for future license-server and cryptographically signed license information.

Keep product activation separate from Doctor Profile.

---

# 10. SECURITY & ROLES

Roles:

* Doctor
* Receptionist
* Assistant
* Admin

Protect patient data and separate permissions properly.

Doctor-entered BMDC/qualification information must be treated as **user-provided information**, not externally verified unless actual verification exists.

Any future AI feature must only assist with documentation/formatting/summarization and must never autonomously diagnose or prescribe.

---

# 11. UI/UX

Create a premium medical SaaS interface.

Colors:

```text
Primary: #0F766E
Primary Dark: #115E59
Accent: #F97316
Background: #F8FAFC
Surface: #FFFFFF
Surface-2: #F1F5F9
Border: #E2E8F0
Text: #0F172A
Muted: #64748B
Success: #16A34A
Warning: #D97706
Danger: #DC2626
```

Fonts:

* Inter
* Plus Jakarta Sans
* Noto Sans Bengali

Design requirements:

* Clean
* Premium
* Fast
* Responsive
* Touch-friendly
* Keyboard-friendly
* Accessible
* Professional medical appearance

Avoid excessive gradients, glassmorphism, animations, shadows and decorative elements.

Mobile browser must feel like a proper touch-first application, not simply a shrunk desktop layout.

---

# 12. FUTURE APK / EXE DOCUMENTATION ONLY

Create:

```text
docs/ANDROID-APK-BUILD.md
docs/WINDOWS-EXE-BUILD.md
docs/NATIVE-INTEGRATION.md
```

Document future:

### Android

Capacitor setup, Android project, debug/release APK, signing, icons/name, permissions, SQLite/native storage, thermal printer, Bluetooth/USB, Google Drive, troubleshooting.

### Windows

Tauri setup, Rust requirements, build process, EXE/installer, icons/name, storage, printer integration, troubleshooting.

### Native Integration

Future Bluetooth/USB thermal printer, filesystem, local backup, Google Drive, secure storage, notifications and sharing.

**Do not actually build APK/EXE now.**

---

# 13. PROJECT DOCUMENTATION

Create and continuously maintain:

```text
PROJECT-CONTRACT.md
PROJECT-STATE.md
AUDIT.md
docs/
```

`PROJECT-STATE.md` must record:

* Current phase
* Completed work
* Remaining work
* Known issues
* Architecture decisions
* Next steps

---

# 14. DEVELOPMENT PHASES

Work incrementally:

**Phase 1:** Foundation + premium UI + dashboard
**Phase 2:** Doctor Profile + Chambers
**Phase 3:** Patients + history
**Phase 4:** Consultation + vitals
**Phase 5:** Medicines + prescription
**Phase 6:** Investigations + tests
**Phase 7:** Appointments + follow-ups
**Phase 8:** PDF + printing + thermal architecture
**Phase 9:** Local-first + backup + licensing + security
**Phase 10:** Final integration, audit, polish and production readiness

After every phase:

* Update `PROJECT-STATE.md`
* Update `AUDIT.md`
* Keep previous functionality working
* Fix regressions
* Commit changes

---

# 15. IMPORTANT RULES

* Do not over-engineer.
* Do not create duplicate business logic for platforms.
* Do not fake APIs, authentication, sync, printers, payments or verification.
* Do not add unnecessary native dependencies now.
* Keep future Capacitor/Tauri compatibility.
* Use real working UI and workflows.
* Maintain clean architecture.
* Keep the project runnable with:

```bash
npm install
npm run dev
npm run build
```

## START NOW

First inspect the blank repository, establish the project foundation and documentation, then begin **Phase 1**.

Do not stop at planning. **Implement the code, verify it, update project state/audit, and push the work to GitHub.**

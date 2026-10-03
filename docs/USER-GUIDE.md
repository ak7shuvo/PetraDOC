# PetraDOC: quick guide for doctors

PetraDOC keeps your patients, consultations and prescriptions **on this device, inside this browser**. There is no cloud account. That makes it fast and private, but it also means **you are responsible for backups** (see section 6).

## 1. First-time setup (about 10 minutes)
1. Open the app. At the top you will see a license banner. Press **Start 30-day trial** (or activate a license key in **Settings**). Until then the app is read-only.
2. Go to **Profile**. Fill in your name, title, specialty and your BMDC number. *The BMDC number and your degrees are printed on prescriptions exactly as you type them; PetraDOC does not verify them.* Add your degrees under **Education**.
3. Add at least one **chamber** (name, address, phone, visiting hours, fee). Pick it in the preview to see how your prescription header will look. Press **Save profile**.
4. Optional: in **Settings** set a **prescription footer** (standing advice printed on every prescription) and add the **starter lists** of common medicine and test names. *The starter list is only a convenience: verify everything before use.* You can also import your own medicine/test lists (CSV or JSON) from the Medicines and Investigations pages; a sample file is available there.
5. Make a first **backup** (section 6) so you know how it works.

Receptionists and assistants: use the **Active role** selector (side menu, or *More* on a phone). It switches what is visible. *It is not a login:* anyone using the device can change it. Real accounts are not available yet.

## 2. Adding a patient
**Patients > New patient.** Name and mobile are required; everything else is optional (date of birth or approximate age, gender, blood group, address, emergency contact, allergies, medical history, photo). The Patient ID (`PD-000001`...) is created automatically. Find patients later by name, mobile number or ID.

## 3. Running a consultation
1. Open the patient and press **New consultation** (or start it from the **Appointments** queue).
2. Record complaint, history, vitals (BMI is calculated for you), examination and diagnosis.
3. **Prescription:** search your medicine list, tap a favourite, type a medicine by hand, apply a **template**, or copy an earlier prescription with **Use previous prescription as new**. Check every line yourself.
4. **Investigations:** search tests, add a panel, or type a test.
5. Add advice and, if needed, a follow-up date. Press **Save consultation**. A Prescription ID (`RX-000001`...) is assigned.
Follow-ups appear in **Appointments > Follow-ups to book**; press **Book** to create the appointment.

## 4. Printing and PDF
Open the prescription (Prescriptions list, or right after saving). Choose the paper: **A4**, **Thermal 58 mm** or **Thermal 80 mm**.
- **Print** opens your browser's print dialog. Choose your printer there. Thermal printers must be installed on the computer/phone like any normal printer.
- **Download PDF** saves a file you can share or print later (it is a picture of the page, so text cannot be selected).
Direct Bluetooth/USB thermal printing is **not** part of the web app.

## 5. Appointments and queue
**Appointments** shows the day's queue with tokens per doctor and chamber. Use *Check in*, *Start consultation*, or *Cancel*. Finishing a consultation marks the appointment done.

## 6. Backup and restore (important)
Go to **Settings > Backup & restore**.
- **Export encrypted backup** (recommended): choose a passphrase (8+ characters). **If you forget it, the backup cannot be opened by anyone.** Keep the file somewhere safe (another device, USB drive, email to yourself).
- **Export unencrypted backup** is readable by anyone who gets the file. Avoid it unless needed.
- **Restore from file** replaces *all* data on this device with the backup. The app will ask for the passphrase of an encrypted file and shows what will be replaced before you confirm.
- The **dashboard reminds you** if you have not backed up for 7 days.
- **Storage protection** shows whether the browser has agreed not to delete your data automatically. Even when it says "Protected", clearing browser data, uninstalling the browser, or losing the device deletes everything. Backups are the only safety net.
- Deleting a patient (or a doctor) is permanent unless you restore a backup.

## 7. What the license states mean
| State | Meaning | What you can do |
|---|---|---|
| Unactivated | No license or trial yet | Read-only. Start the trial or activate a key. |
| Trial | 30-day local trial | Everything. The trial is local to this browser. |
| Active | A valid signed license key is installed | Everything. |
| Expired | Trial or license ended | Read-only; you can still view data and export backups. |
| Revoked | The license was withdrawn by the vendor | Read-only; backups still work. |
| Invalid | The key could not be verified (wrong key, damaged key, or this build has no verification key) | Read-only; contact the vendor. |
Your data is never deleted by a license change.

## 8. Good to know
- Works offline once loaded; data never leaves the device unless you export it.
- Add to home screen from your phone browser's menu to open it like an app.
- Tested only in desktop Chrome so far; try your own phone and printer before relying on it in clinic.

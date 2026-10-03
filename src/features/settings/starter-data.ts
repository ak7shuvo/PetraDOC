/**
 * Optional STARTER LIST. Common generic names only: no strengths, doses, indications or clinical claims.
 * Starter list, verify before use. The doctor remains responsible for every prescription.
 */
export const STARTER_MEDICINES: { generic: string; form: string }[] = [
  ["Paracetamol", "Tablet"], ["Ibuprofen", "Tablet"], ["Diclofenac", "Tablet"], ["Aspirin", "Tablet"],
  ["Amoxicillin", "Capsule"], ["Azithromycin", "Tablet"], ["Ciprofloxacin", "Tablet"], ["Cefixime", "Capsule"], ["Metronidazole", "Tablet"],
  ["Omeprazole", "Capsule"], ["Esomeprazole", "Tablet"], ["Domperidone", "Tablet"], ["Ondansetron", "Tablet"],
  ["Cetirizine", "Tablet"], ["Loratadine", "Tablet"], ["Montelukast", "Tablet"], ["Salbutamol", "Inhaler"],
  ["Metformin", "Tablet"], ["Gliclazide", "Tablet"], ["Amlodipine", "Tablet"], ["Losartan", "Tablet"], ["Atenolol", "Tablet"],
  ["Atorvastatin", "Tablet"], ["Clopidogrel", "Tablet"], ["Furosemide", "Tablet"], ["Prednisolone", "Tablet"], ["Levothyroxine", "Tablet"],
  ["Folic acid", "Tablet"], ["Vitamin D3", "Capsule"], ["Oral rehydration salts", "Sachet"], ["Hydrocortisone", "Cream"],
].map(([generic, form]) => ({ generic, form }));

export const STARTER_TESTS: { name: string; category: string }[] = [
  ["Complete blood count (CBC)", "Haematology"], ["Hemoglobin", "Haematology"], ["ESR", "Haematology"], ["Platelet count", "Haematology"],
  ["Blood group and Rh factor", "Haematology"], ["Peripheral blood film", "Haematology"],
  ["Fasting blood glucose", "Biochemistry"], ["Random blood glucose", "Biochemistry"], ["HbA1c", "Biochemistry"], ["Serum creatinine", "Biochemistry"],
  ["Blood urea", "Biochemistry"], ["Serum electrolytes", "Biochemistry"], ["SGPT (ALT)", "Biochemistry"], ["SGOT (AST)", "Biochemistry"],
  ["Serum bilirubin", "Biochemistry"], ["Lipid profile", "Biochemistry"], ["Serum uric acid", "Biochemistry"], ["TSH", "Biochemistry"], ["Serum calcium", "Biochemistry"],
  ["Urine routine examination", "Urine/Stool"], ["Urine culture and sensitivity", "Microbiology"], ["Stool routine examination", "Urine/Stool"], ["Blood culture", "Microbiology"],
  ["CRP", "Serology"], ["HBsAg", "Serology"], ["Anti-HCV", "Serology"], ["Dengue NS1 antigen", "Serology"], ["Malaria parasite", "Serology"],
  ["Chest X-ray", "Imaging"], ["Ultrasonography of abdomen", "Imaging"], ["ECG", "Cardiology"], ["Echocardiogram", "Cardiology"],
].map(([name, category]) => ({ name, category }));

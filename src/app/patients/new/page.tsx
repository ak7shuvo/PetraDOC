import { PatientForm } from "@/features/patients/PatientForm";

export default function NewPatientPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">New patient</h1>
      <PatientForm />
    </div>
  );
}

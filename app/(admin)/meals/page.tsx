import { ScannerPanel } from "@/components/ScannerPanel";
import { activeMealFor, meals, todayInCampTimezone } from "@/lib/camp";

export default function MealsPage() {
  const today = todayInCampTimezone().toISOString().slice(0, 10);
  const meal = activeMealFor();
  return (
    <ScannerPanel
      title="Meal QR Scanner"
      endpoint="/api/meals"
      action="meal"
      confirmLabel="Record Meal"
      manualMode="participant-number"
      controls={
        <>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600">Camp date</span>
            <input name="date" type="date" className="field" defaultValue={today} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-600">Meal</span>
            <select name="meal" className="field select-premium" defaultValue={meal}>
              {meals.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </>
      }
    />
  );
}

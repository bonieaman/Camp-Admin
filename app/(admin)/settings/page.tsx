import { SettingsManager } from "@/components/SettingsManager";
import { ensureSettings } from "@/lib/camp";

export default async function SettingsPage() {
  const settings = await ensureSettings();
  return <SettingsManager settings={settings} />;
}

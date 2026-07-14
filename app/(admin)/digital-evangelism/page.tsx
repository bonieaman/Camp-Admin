import { TeamActivityPanel } from "@/components/TeamActivityPanel";
import { getTeamActivityPage } from "@/lib/data";

export default async function DigitalEvangelismPage() {
  const data = await getTeamActivityPage("DIGITAL_EVANGELISM");
  return (
    <TeamActivityPanel
      title="Digital Evangelism"
      activityType="DIGITAL_EVANGELISM"
      confirmLabel="Record Digital Evangelism"
      teams={data.teams}
      history={data.history}
      today={data.today.toISOString().slice(0, 10)}
    />
  );
}

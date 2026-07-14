import { TeamActivityPanel } from "@/components/TeamActivityPanel";
import { getTeamActivityPage } from "@/lib/data";

export default async function OutreachPage() {
  const data = await getTeamActivityPage("OUTREACH");
  return (
    <TeamActivityPanel
      title="Outreach Management"
      activityType="OUTREACH"
      confirmLabel="Record Outreach"
      teams={data.teams}
      history={data.history}
      today={data.today.toISOString().slice(0, 10)}
    />
  );
}

import { getPinterestScheduleDashboard } from "@/lib/pinterest-schedule";

import PinterestScheduleClient from "./pinterest-schedule-client";

export const dynamic = "force-dynamic";

export default async function PinterestSchedulePage() {
  return <PinterestScheduleClient initialDashboard={await getPinterestScheduleDashboard()} />;
}

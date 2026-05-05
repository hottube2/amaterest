import { getPinterestOpsSummary } from "@/lib/pinterest-ops";
import { getPinterestLiveDashboard } from "@/lib/pinterest-live";

import PinterestOpsClient from "./pinterest-ops-client";

export const dynamic = "force-dynamic";

export default async function PinterestOpsPage() {
  const [initialData, initialCanary] = await Promise.all([getPinterestOpsSummary(), getPinterestLiveDashboard()]);

  return <PinterestOpsClient initialData={initialData} initialCanary={initialCanary} />;
}

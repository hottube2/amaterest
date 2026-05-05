import { getPinterestLibraryData } from "@/lib/pinterest-library";

import PinterestLibraryClient from "./pinterest-library-client";

export const dynamic = "force-dynamic";

export default async function PinterestLibraryPage() {
  return <PinterestLibraryClient initialData={await getPinterestLibraryData()} />;
}

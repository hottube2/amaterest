import { Suspense } from "react";

import { getDefaultAmazonTestLink } from "@/lib/amazon";
import { env } from "@/lib/env";

import PinterestDemoClient from "./pinterest-demo-client";

export default function PinterestDemoPage() {
  return (
    <Suspense fallback={null}>
      <PinterestDemoClient
        defaults={{
          boardId: env.PINTEREST_TEST_BOARD_ID,
          title: "Amazon Finds Organisation Maison",
          description:
            "Demo Pinterest OAuth flow for the Amaterest Standard Access review. This test pin links to an Amazon product and uses a local demo image when needed.",
          link: getDefaultAmazonTestLink() || "https://www.amazon.ca/",
          imageUrl: env.PINTEREST_TEST_IMAGE_URL || "/icon-512.png"
        }}
      />
    </Suspense>
  );
}

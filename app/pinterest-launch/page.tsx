import {
  getPreparedPinterestLaunchPins
} from "@/lib/pinterest-content";
import { isPinterestPublishEnabled } from "@/lib/pinterest-launch";

import PinterestLaunchClient from "./pinterest-launch-client";

export default function PinterestLaunchPage() {
  return (
    <PinterestLaunchClient
      initialPins={getPreparedPinterestLaunchPins()}
      publishEnabled={isPinterestPublishEnabled()}
    />
  );
}

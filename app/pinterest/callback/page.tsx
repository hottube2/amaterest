import { Suspense } from "react";

import CallbackClient from "./callback-client";

export default function PinterestCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackClient />
    </Suspense>
  );
}

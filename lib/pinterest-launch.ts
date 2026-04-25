import { env } from "@/lib/env";
import {
  getPreparedPinterestLaunchPins,
  type PinterestLaunchImageSourceType,
  type PinterestLaunchMode,
  type PinterestLaunchStatus,
  type PreparedPinterestLaunchPin
} from "@/lib/pinterest-content";
import { getMissingPinterestDemoScopes } from "@/lib/pinterest-oauth";
import { createPin, type CreatePinInput } from "@/lib/pinterest";

export type PinterestLaunchResult = {
  pinId: string;
  success: boolean;
  pinTitle: string;
  productKey: PreparedPinterestLaunchPin["productKey"];
  boardId: string;
  link?: string;
  imageUrl: string;
  imageAssetPath: string;
  imageSourceType: PinterestLaunchImageSourceType;
  isFallback: boolean;
  mode: PinterestLaunchMode;
  requestedMode: PinterestLaunchMode;
  status: PinterestLaunchStatus;
  error?: string;
  remotePinId?: string;
  payload?: CreatePinInput;
};

export type PinterestLaunchReport = {
  ok: boolean;
  requestedMode: PinterestLaunchMode;
  effectiveMode: PinterestLaunchMode;
  publishEnabled: boolean;
  publishBlocked: boolean;
  warning?: string;
  totalPins: number;
  counts: {
    success: number;
    failed: number;
    dryRunOk: number;
    published: number;
    blocked: number;
  };
  results: PinterestLaunchResult[];
};

export function isPinterestPublishEnabled() {
  return env.PINTEREST_ENABLE_PUBLISH === "true";
}

export function getPreparedPinterestLaunchJson(origin?: string) {
  return JSON.stringify(getPreparedPinterestLaunchPins(origin), null, 2);
}

function escapeCsvValue(value: string) {
  const escapedValue = value.replace(/"/g, '""');
  return `"${escapedValue}"`;
}

export function getPreparedPinterestLaunchCsv(origin?: string) {
  const pins = getPreparedPinterestLaunchPins(origin);
  const header = [
    "pinId",
    "productKey",
    "category",
    "internalTitle",
    "pinTitle",
    "pinDescription",
    "amazonUrl",
    "imageUrl",
    "imageAssetPath",
    "imageSourceType",
    "isFallback",
    "boardId",
    "mode",
    "status"
  ];
  const rows = pins.map((pin) =>
    [
      pin.pinId,
      pin.productKey,
      pin.category,
      pin.internalTitle,
      pin.pinTitle,
      pin.pinDescription,
      pin.amazonUrl || "",
      pin.imageUrl,
      pin.imageAssetPath,
      pin.imageSourceType,
      pin.isFallback,
      pin.boardId,
      pin.mode,
      pin.status
    ]
      .map((value) => escapeCsvValue(String(value)))
      .join(",")
  );

  return [header.join(","), ...rows].join("\n");
}

type RunPinterestLaunchOptions = {
  requestedMode: PinterestLaunchMode;
  origin: string;
  pinIds?: string[];
  accessToken?: string;
  sessionScopes?: string[];
};

function buildPinPayload(pin: PreparedPinterestLaunchPin): CreatePinInput {
  return {
    boardId: pin.boardId,
    title: pin.pinTitle,
    description: pin.pinDescription,
    link: pin.amazonUrl || "",
    imageUrl: pin.imageUrl,
    altText: pin.internalTitle
  };
}

function getFilteredPins(origin: string, pinIds?: string[]) {
  const preparedPins = getPreparedPinterestLaunchPins(origin);

  if (!pinIds || pinIds.length === 0) {
    return preparedPins;
  }

  const pinIdSet = new Set(pinIds);

  return preparedPins.filter((pin) => pinIdSet.has(pin.pinId));
}

function buildResult(
  pin: PreparedPinterestLaunchPin,
  requestedMode: PinterestLaunchMode,
  mode: PinterestLaunchMode,
  overrides: Partial<PinterestLaunchResult>
): PinterestLaunchResult {
  return {
    pinId: pin.pinId,
    success: false,
    pinTitle: pin.pinTitle,
    productKey: pin.productKey,
    boardId: pin.boardId,
    link: pin.amazonUrl,
    imageUrl: pin.imageUrl,
    imageAssetPath: pin.imageAssetPath,
    imageSourceType: pin.imageSourceType,
    isFallback: pin.isFallback,
    mode,
    requestedMode,
    status: "ready",
    ...overrides
  };
}

export async function runPinterestLaunch({
  requestedMode,
  origin,
  pinIds,
  accessToken,
  sessionScopes = []
}: RunPinterestLaunchOptions): Promise<PinterestLaunchReport> {
  const publishEnabled = isPinterestPublishEnabled();
  const publishBlocked = requestedMode === "publish" && !publishEnabled;
  const effectiveMode = publishBlocked ? "dryRun" : requestedMode;
  const warning = publishBlocked
    ? "PINTEREST_ENABLE_PUBLISH=false. The publish route stayed visible, but a safe dry-run was executed instead."
    : undefined;
  const missingWriteScopes =
    requestedMode === "publish" && accessToken
      ? getMissingPinterestDemoScopes(sessionScopes).filter(
          (scope) => scope === "boards:write" || scope === "pins:write"
        )
      : [];
  const pins = getFilteredPins(origin, pinIds);
  const results: PinterestLaunchResult[] = [];

  for (const pin of pins) {
    const payload = buildPinPayload(pin);

    if (!pin.boardId) {
      results.push(
        buildResult(pin, requestedMode, effectiveMode, {
          status: "error",
          error:
            "Missing boardId. Add PINTEREST_LAUNCH_BOARD_ID or PINTEREST_TEST_BOARD_ID to .env.local."
        })
      );
      continue;
    }

    if (!pin.amazonUrl) {
      results.push(
        buildResult(pin, requestedMode, effectiveMode, {
          status: "error",
          error: `Missing Amazon URL for ${pin.productKey}. Fill the matching AMAZON_PRODUCT_URL_* variable in .env.local.`
        })
      );
      continue;
    }

    if (effectiveMode === "dryRun") {
      results.push(
        buildResult(pin, requestedMode, effectiveMode, {
          success: true,
          status: publishBlocked ? "publish blocked" : "dry-run ok",
          error: publishBlocked ? warning : undefined,
          payload
        })
      );
      continue;
    }

    if (missingWriteScopes.length > 0) {
      results.push(
        buildResult(pin, requestedMode, effectiveMode, {
          status: "publish blocked",
          error: `Pinterest OAuth connected, but the token is missing required write scopes: ${missingWriteScopes.join(
            ", "
          )}.`
        })
      );
      continue;
    }

    try {
      const remotePin = await createPin(payload, accessToken);

      results.push(
        buildResult(pin, requestedMode, effectiveMode, {
          success: true,
          status: "published",
          remotePinId: remotePin.id,
          payload
        })
      );
    } catch (error) {
      results.push(
        buildResult(pin, requestedMode, effectiveMode, {
          status: "error",
          error: error instanceof Error ? error.message : "Unable to publish this Pinterest pin.",
          payload
        })
      );
    }
  }

  const counts = results.reduce(
    (accumulator, result) => {
      if (result.success) {
        accumulator.success += 1;
      } else {
        accumulator.failed += 1;
      }

      if (result.status === "dry-run ok") {
        accumulator.dryRunOk += 1;
      }

      if (result.status === "published") {
        accumulator.published += 1;
      }

      if (result.status === "publish blocked") {
        accumulator.blocked += 1;
      }

      return accumulator;
    },
    {
      success: 0,
      failed: 0,
      dryRunOk: 0,
      published: 0,
      blocked: 0
    }
  );

  return {
    ok: true,
    requestedMode,
    effectiveMode,
    publishEnabled,
    publishBlocked,
    warning,
    totalPins: pins.length,
    counts,
    results
  };
}

import fs from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";
import { type LibraryPin } from "@/lib/pinterest-library";
import { isPinterestPublishEnabled } from "@/lib/pinterest-launch";
import { getMissingPinterestDemoScopes } from "@/lib/pinterest-oauth";
import { getPinterestOpsSummary } from "@/lib/pinterest-ops";
import { createPin, getPinAnalytics, type CreatePinInput } from "@/lib/pinterest";
import { getPinterestScheduleDashboard } from "@/lib/pinterest-schedule";

const STORE_VERSION = 1;

export type PinterestPublishMode = "canary" | "live";
export type PinterestPublishResult = "success" | "error" | "blocked" | "preview";

export type PinterestPublishedPin = {
  internalPinId: string;
  pinterestPinId?: string;
  productKey: string;
  boardId: string;
  title: string;
  description: string;
  link: string;
  affiliateUrl?: string;
  imageUrl: string;
  imageAssetPath?: string;
  publishedAt: string;
  publishMode: PinterestPublishMode;
  result: PinterestPublishResult;
  errorMessage?: string;
  dryRun?: boolean;
  validationOk?: boolean;
  canPublishLive?: boolean;
  liveBlockers?: string[];
  blockers?: string[];
  warnings?: string[];
  usesPublicBaseUrl?: boolean;
  publicBaseUrl?: string;
  saves?: number;
  outboundClicks?: number;
  ctr?: number;
  impressions?: number;
  closeups?: number;
  engagementSummary?: string;
  lastAnalyticsSyncAt?: string;
  analyticsRaw?: unknown;
  winnerCandidate?: boolean;
  confirmedWinner?: boolean;
  generateVariantsReady?: boolean;
};

export type PinterestLiveDashboard = {
  ok: true;
  publishEnabled: boolean;
  canaryBoardId?: string;
  publishReadyCount: number;
  livePublishLimit: number;
  analyticsLookbackDays: number;
  schedulerCoverageRemaining: number;
  published: PinterestPublishedPin[];
  recentlyPublished: PinterestPublishedPin[];
  topPerformers: PinterestPublishedPin[];
  needsReview: PinterestPublishedPin[];
  winnerCandidates: PinterestPublishedPin[];
  confirmedWinners: PinterestPublishedPin[];
  lastCanary?: PinterestPublishedPin;
  checklist: Array<{ label: string; ready: boolean; note: string }>;
};

type Store = {
  version: number;
  updatedAt: string;
  items: PinterestPublishedPin[];
};

type CanaryOptions = {
  origin: string;
  boardId?: string;
  internalPinId?: string;
  dryRun?: boolean;
  accessToken?: string;
  sessionScopes?: string[];
};

type AnalyticsSyncOptions = {
  accessToken?: string;
  internalPinIds?: string[];
  pinterestPinIds?: string[];
};

type CanaryCandidate = {
  internalPinId: string;
  productKey: string;
  boardId: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  imageAssetPath: string;
  internalTitle: string;
  productName: string;
  brand: string;
  category: string;
  usesPublicBaseUrl: boolean;
  publicBaseUrl?: string;
  warnings: string[];
};

type CanaryLookup = {
  pin?: CanaryCandidate;
  error?: string;
};

type OpsProduct = Awaited<ReturnType<typeof getPinterestOpsSummary>>["products"][number];

function getStorePath() {
  return path.join(process.cwd(), "data", "pinterest-published.json");
}

function createInitialStore(): Store {
  return {
    version: STORE_VERSION,
    updatedAt: new Date().toISOString(),
    items: []
  };
}

async function ensureStoreFile() {
  const storePath = getStorePath();
  await fs.mkdir(path.dirname(storePath), { recursive: true });

  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, `${JSON.stringify(createInitialStore(), null, 2)}\n`, "utf8");
  }
}

async function readStore() {
  await ensureStoreFile();

  try {
    const rawText = await fs.readFile(getStorePath(), "utf8");
    const parsed = JSON.parse(rawText) as Partial<Store> | null;

    if (!parsed || !Array.isArray(parsed.items)) {
      return createInitialStore();
    }

    return {
      version: typeof parsed.version === "number" ? parsed.version : STORE_VERSION,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      items: parsed.items
    };
  } catch {
    return createInitialStore();
  }
}

async function writeStore(items: PinterestPublishedPin[]) {
  await ensureStoreFile();
  await fs.writeFile(
    getStorePath(),
    `${JSON.stringify({ version: STORE_VERSION, updatedAt: new Date().toISOString(), items }, null, 2)}\n`,
    "utf8"
  );
}

function getNumberEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getLivePublishLimit() {
  const parsed = Number(env.PINTEREST_LIVE_PUBLISH_LIMIT);
  return Number.isFinite(parsed) ? parsed : 1;
}

function getAnalyticsLookbackDays() {
  return getNumberEnv(env.PINTEREST_ANALYTICS_LOOKBACK_DAYS, 30);
}

function resolvePinterestCanaryBoardId(explicitBoardId?: string) {
  return (
    env.PINTEREST_CANARY_BOARD_ID ||
    env.PINTEREST_LAUNCH_BOARD_ID ||
    env.PINTEREST_LIBRARY_DEFAULT_BOARD_ID ||
    env.PINTEREST_TEST_BOARD_ID ||
    explicitBoardId ||
    ""
  );
}

function normalizePublicBaseUrl() {
  const raw = env.PINTEREST_PUBLIC_BASE_URL;

  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return "";
  }
}

function isLocalhostUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
  } catch {
    return /localhost|127\.0\.0\.1|\[::1\]/i.test(value);
  }
}

function buildCanaryImageDiagnostics(imageAssetPath: string) {
  const publicBaseUrl = normalizePublicBaseUrl();
  const warnings: string[] = [];
  const imageUrl = publicBaseUrl ? new URL(imageAssetPath, `${publicBaseUrl}/`).toString() : imageAssetPath;

  if (!publicBaseUrl) {
    warnings.push("missing_public_base_url");
  }

  if (isLocalhostUrl(imageUrl)) {
    warnings.push("localhost_image_url");
  }

  return {
    imageUrl,
    imageAssetPath,
    usesPublicBaseUrl: Boolean(publicBaseUrl),
    publicBaseUrl: publicBaseUrl || undefined,
    warnings
  };
}

function expectedCategoryFromProductKey(productKey: string) {
  if (productKey.startsWith("pantry_")) return "pantry";
  if (productKey.startsWith("under_sink_")) return "under_sink";
  if (productKey.startsWith("entryway_")) return "entryway";
  if (productKey.startsWith("closet_")) return "closet";
  if (productKey.startsWith("vanity_")) return "vanity_bathroom";
  if (productKey.startsWith("beauty_")) return "beauty_high_ticket";
  return "";
}

function validateCanaryCoherence(pin: CanaryCandidate) {
  const blockers: string[] = [];
  const expectedCategory = expectedCategoryFromProductKey(pin.productKey);
  const title = pin.title.toLowerCase();
  const fullText = `${pin.title} ${pin.description}`.toLowerCase();
  const productName = pin.productName.toLowerCase();
  const brand = pin.brand.toLowerCase();
  const disallowedTermsByCategory: Record<string, string[]> = {
    pantry: ["under-sink", "under sink", "shoe bench", "entryway", "vanity", "closet", "hair styling"],
    under_sink: ["pantry container", "shoe bench", "entryway", "vanity", "closet", "hair styling"],
    entryway: ["under-sink", "under sink", "pantry container", "vanity", "closet", "hair styling"],
    closet: ["under-sink", "under sink", "pantry container", "shoe bench", "vanity", "hair styling"],
    vanity_bathroom: ["under-sink", "under sink", "pantry container", "shoe bench", "entryway"],
    beauty_high_ticket: ["under-sink", "under sink", "pantry container", "shoe bench", "entryway", "closet"]
  };

  if (expectedCategory && pin.category !== expectedCategory) {
    blockers.push(`category_mismatch:${expectedCategory}->${pin.category}`);
  }

  if (!fullText.includes(productName) && !fullText.includes(brand)) {
    blockers.push("content_product_mismatch");
  }

  for (const term of disallowedTermsByCategory[expectedCategory] || []) {
    if (title.includes(term)) {
      blockers.push(`title_cross_category_term:${term}`);
    }
  }

  return blockers;
}

function buildPayload(pin: CanaryCandidate, boardId: string): CreatePinInput {
  return {
    boardId,
    title: pin.title,
    description: pin.description,
    link: pin.link,
    imageUrl: pin.imageUrl,
    altText: pin.internalTitle
  };
}

function isValidBoardId(boardId: string) {
  return /^\d+$/.test(boardId);
}

async function hasValidLocalImage(pin: CanaryCandidate) {
  if (!pin.imageAssetPath.startsWith("/")) {
    return true;
  }

  try {
    await fs.access(path.join(process.cwd(), "public", pin.imageAssetPath.replace(/^\/+/, "")));
    return true;
  } catch {
    return false;
  }
}

async function validatePublishReady(pin: CanaryCandidate, boardId: string) {
  const blockers: string[] = [];

  if (!pin.link) {
    blockers.push("missing_affiliate_url");
  }

  try {
    new URL(pin.link);
  } catch {
    blockers.push("invalid_affiliate_url");
  }

  if (!pin.imageUrl) {
    blockers.push("missing_image_url");
  }

  if (!pin.usesPublicBaseUrl) {
    blockers.push("missing_public_base_url");
  }

  if (isLocalhostUrl(pin.imageUrl)) {
    blockers.push("localhost_image_url");
  }

  if (!(await hasValidLocalImage(pin))) {
    blockers.push(`missing_local_image:${pin.imageAssetPath}`);
  }

  if (!boardId || !isValidBoardId(boardId)) {
    blockers.push("missing_board");
  }

  return [...blockers, ...validateCanaryCoherence(pin)];
}

function buildPublishedRecord(
  pin: CanaryCandidate,
  boardId: string,
  publishMode: PinterestPublishMode,
  overrides: Partial<PinterestPublishedPin>
): PinterestPublishedPin {
  return {
    internalPinId: pin.internalPinId,
    productKey: pin.productKey,
    boardId,
    title: pin.title,
    description: pin.description,
    link: pin.link,
    affiliateUrl: pin.link,
    imageUrl: pin.imageUrl,
    imageAssetPath: pin.imageAssetPath,
    publishedAt: new Date().toISOString(),
    publishMode,
    warnings: pin.warnings,
    usesPublicBaseUrl: pin.usesPublicBaseUrl,
    publicBaseUrl: pin.publicBaseUrl,
    result: "blocked",
    ...overrides
  };
}

function toCanaryCandidate(pin: LibraryPin, product: OpsProduct): CanaryCandidate {
  const image = buildCanaryImageDiagnostics(pin.imageAssetPath);

  return {
    internalPinId: pin.pinId,
    productKey: pin.productKey,
    boardId: resolvePinterestCanaryBoardId(pin.boardId),
    title: pin.pinTitle,
    description: pin.pinDescription,
    link: product.amazonAffiliateUrl || "",
    imageUrl: image.imageUrl,
    imageAssetPath: image.imageAssetPath,
    internalTitle: product.productName ?? pin.pinTitle,
    productName: product.productName ?? pin.pinTitle,
    brand: product.brand ?? "",
    category: product.category ?? "",
    usesPublicBaseUrl: image.usesPublicBaseUrl,
    publicBaseUrl: image.publicBaseUrl,
    warnings: image.warnings
  };
}

async function findCanaryPin(origin: string, store: Store, internalPinId?: string): Promise<CanaryLookup> {
  const summary = await getPinterestOpsSummary(origin);
  const productMap = new Map(summary.products.map((item) => [item.productKey, item]));
  const publishReadyPinIds = new Set(
    summary.qaResults
      .filter((item) => item.publishReady)
      .map((item) => item.pinId)
  );
  const publishedIds = new Set(
    store.items
      .filter((item) => item.result === "success")
      .map((item) => item.internalPinId)
  );

  const isEligiblePin = (candidate: LibraryPin) => {
    const product = productMap.get(candidate.productKey);

    return (
      publishReadyPinIds.has(candidate.pinId) &&
      product?.activeStatus === "active" &&
      Boolean(product.amazonAffiliateUrl) &&
      !publishedIds.has(candidate.pinId)
    );
  };

  if (internalPinId) {
    const exactPin = summary.pins.find((candidate: LibraryPin) => candidate.pinId === internalPinId);

    if (!exactPin) {
      return { error: `pin_not_found: ${internalPinId}` };
    }

    if (publishedIds.has(exactPin.pinId)) {
      return { error: `pin_already_published: ${internalPinId}` };
    }

    if (!isEligiblePin(exactPin)) {
      return { error: `no_publish_ready_pin: ${internalPinId}` };
    }

    const product = productMap.get(exactPin.productKey);
    return product ? { pin: toCanaryCandidate(exactPin, product) } : { error: `product_not_found: ${exactPin.productKey}` };
  }

  const pin = summary.pins.find((candidate: LibraryPin) => isEligiblePin(candidate));

  if (!pin) {
    return { error: "no_publish_ready_pin" };
  }

  const product = productMap.get(pin.productKey);
  return product ? { pin: toCanaryCandidate(pin, product) } : { error: `product_not_found: ${pin.productKey}` };
}

function normalizeMetricValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function findMetric(payload: unknown, names: string[]): number | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const record = payload as Record<string, unknown>;

  for (const name of names) {
    const direct = normalizeMetricValue(record[name]);

    if (typeof direct === "number") {
      return direct;
    }
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        const nested = findMetric(entry, names);

        if (typeof nested === "number") {
          return nested;
        }
      }
    }

    if (value && typeof value === "object") {
      const nested = findMetric(value, names);

      if (typeof nested === "number") {
        return nested;
      }
    }
  }

  return undefined;
}

function applyWinnerRules(pin: PinterestPublishedPin): PinterestPublishedPin {
  const impressions = pin.impressions || 0;
  const saves = pin.saves || 0;
  const outboundClicks = pin.outboundClicks || 0;
  const ctr = pin.ctr || 0;
  const daysLive = Math.max(0, (Date.now() - Date.parse(pin.publishedAt)) / 86_400_000);
  const winnerCandidate = impressions >= 100 && (saves >= 2 || outboundClicks >= 1 || ctr >= 0.01);
  const confirmedWinner = winnerCandidate && daysLive >= 2 && impressions >= 250 && (saves >= 5 || outboundClicks >= 3 || ctr >= 0.015);

  return {
    ...pin,
    winnerCandidate,
    confirmedWinner,
    generateVariantsReady: confirmedWinner
  };
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getAnalyticsRange() {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - getAnalyticsLookbackDays());

  return {
    startDate: toDateOnly(start),
    endDate: toDateOnly(end)
  };
}

function sortPublished(items: PinterestPublishedPin[]) {
  return [...items].sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));
}

export async function listPinterestPublishedPins() {
  const store = await readStore();
  return sortPublished(store.items.map(applyWinnerRules));
}

export async function runPinterestCanaryPublish({
  origin,
  boardId,
  internalPinId,
  dryRun = false,
  accessToken,
  sessionScopes = []
}: CanaryOptions) {
  const publishEnabled = isPinterestPublishEnabled();
  const requestedBoardId = resolvePinterestCanaryBoardId(boardId);
  const store = await readStore();
  const liveLimit = getLivePublishLimit();
  const lookup = await findCanaryPin(origin, store, internalPinId);
  const pin = lookup.pin;

  if (!pin) {
    throw new Error(lookup.error || (internalPinId ? `no_publish_ready_pin: ${internalPinId}` : "no_publish_ready_pin"));
  }

  const existingCanaryCount = store.items.filter(
    (item) => item.publishMode === "canary" && item.result === "success"
  ).length;
  const validationBlockers = await validatePublishReady(pin, requestedBoardId);
  const liveBlockers: string[] = [];

  if (!publishEnabled) {
    liveBlockers.push("publish_disabled");
  }

  if (liveLimit !== 1) {
    liveBlockers.push("invalid_live_publish_limit");
  }

  if (existingCanaryCount >= liveLimit) {
    liveBlockers.push("canary_limit_reached");
  }

  if (dryRun) {
    return buildPublishedRecord(pin, requestedBoardId, "canary", {
      result: "preview",
      dryRun: true,
      validationOk: validationBlockers.length === 0,
      canPublishLive: validationBlockers.length === 0 && liveBlockers.length === 0,
      blockers: validationBlockers,
      liveBlockers
    });
  }

  if (liveLimit !== 1) {
    const blockedRecord = buildPublishedRecord(pin, requestedBoardId, "canary", {
      result: "blocked",
      validationOk: validationBlockers.length === 0,
      canPublishLive: false,
      blockers: validationBlockers,
      liveBlockers,
      errorMessage: `invalid_live_publish_limit: PINTEREST_LIVE_PUBLISH_LIMIT must be 1 for canary publish. Current value: ${liveLimit}.`
    });
    await writeStore(sortPublished([blockedRecord, ...store.items]));
    return blockedRecord;
  }

  if (existingCanaryCount >= liveLimit) {
    const blockedRecord = buildPublishedRecord(pin, requestedBoardId, "canary", {
      result: "blocked",
      validationOk: validationBlockers.length === 0,
      canPublishLive: false,
      blockers: validationBlockers,
      liveBlockers,
      errorMessage: `PINTEREST_LIVE_PUBLISH_LIMIT=${liveLimit}. Canary publish refused to prevent accidental volume.`
    });
    await writeStore(sortPublished([blockedRecord, ...store.items]));
    return blockedRecord;
  }

  if (!publishEnabled) {
    const blockedRecord = buildPublishedRecord(pin, requestedBoardId, "canary", {
      result: "blocked",
      validationOk: validationBlockers.length === 0,
      canPublishLive: false,
      blockers: validationBlockers,
      liveBlockers,
      errorMessage: "publish_disabled: PINTEREST_ENABLE_PUBLISH=false. Canary publish refused before calling Pinterest."
    });
    await writeStore(sortPublished([blockedRecord, ...store.items]));
    return blockedRecord;
  }

  const missingWriteScopes =
    accessToken
      ? getMissingPinterestDemoScopes(sessionScopes).filter((scope) => scope === "boards:write" || scope === "pins:write")
      : [];

  if (missingWriteScopes.length > 0) {
    const blockedRecord = buildPublishedRecord(pin, requestedBoardId, "canary", {
      result: "blocked",
      validationOk: validationBlockers.length === 0,
      canPublishLive: false,
      blockers: validationBlockers,
      liveBlockers: [...liveBlockers, "missing_write_scopes"],
      errorMessage: `Pinterest OAuth token is missing required write scopes: ${missingWriteScopes.join(", ")}.`
    });
    await writeStore(sortPublished([blockedRecord, ...store.items]));
    return blockedRecord;
  }

  if (validationBlockers.length > 0) {
    const blockedRecord = buildPublishedRecord(pin, requestedBoardId, "canary", {
      result: "blocked",
      validationOk: false,
      canPublishLive: false,
      blockers: validationBlockers,
      liveBlockers,
      errorMessage: validationBlockers.join(", ")
    });
    await writeStore(sortPublished([blockedRecord, ...store.items]));
    return blockedRecord;
  }

  try {
    const remotePin = await createPin(buildPayload(pin, requestedBoardId), accessToken);
    const record = buildPublishedRecord(pin, requestedBoardId, "canary", {
      pinterestPinId: remotePin.id,
      result: "success",
      validationOk: true,
      canPublishLive: true,
      blockers: [],
      liveBlockers: []
    });

    await writeStore(sortPublished([record, ...store.items]));
    return record;
  } catch (error) {
    const record = buildPublishedRecord(pin, requestedBoardId, "canary", {
      result: "error",
      validationOk: true,
      canPublishLive: false,
      blockers: [],
      liveBlockers,
      errorMessage: error instanceof Error ? error.message : "Pinterest publish failed."
    });

    await writeStore(sortPublished([record, ...store.items]));
    return record;
  }
}

function extractPinAnalytics(raw: unknown) {
  const impressions = findMetric(raw, ["IMPRESSION", "impression", "impressions"]);
  const outboundClicks = findMetric(raw, ["OUTBOUND_CLICK", "outbound_click", "outbound_clicks"]);
  const closeups = findMetric(raw, ["PIN_CLICK", "pin_click", "pin_clicks", "closeups"]);
  const saves = findMetric(raw, ["SAVE", "save", "saves"]);
  const ctr =
    impressions && impressions > 0 ? Number((((outboundClicks || 0) / impressions) * 100).toFixed(2)) : undefined;

  return {
    impressions,
    outboundClicks,
    closeups,
    saves,
    ctr,
    engagementSummary: `${impressions || 0} impressions, ${saves || 0} saves, ${outboundClicks || 0} outbound clicks`
  };
}

export async function syncPinterestAnalytics({ accessToken, internalPinIds, pinterestPinIds }: AnalyticsSyncOptions = {}) {
  const store = await readStore();
  const syncable = store.items.filter((item) => {
    if (item.result !== "success" || !item.pinterestPinId) {
      return false;
    }

    if (internalPinIds?.length && !internalPinIds.includes(item.internalPinId)) {
      return false;
    }

    if (pinterestPinIds?.length && !pinterestPinIds.includes(item.pinterestPinId)) {
      return false;
    }

    return true;
  });

  if (!env.PINTEREST_AD_ACCOUNT_ID) {
    return {
      ok: false,
      synced: 0,
      error: "Missing PINTEREST_AD_ACCOUNT_ID. Pinterest pin analytics requires an ad account analytics context.",
      items: store.items
    };
  }

  const { startDate, endDate } = getAnalyticsRange();
  const now = new Date().toISOString();
  const updatedItems = [...store.items];
  const results: Array<{ pinterestPinId: string; success: boolean; errorMessage?: string }> = [];

  for (const item of syncable) {
    try {
      const raw = await getPinAnalytics(
        {
          adAccountId: env.PINTEREST_AD_ACCOUNT_ID,
          pinIds: [item.pinterestPinId as string],
          startDate,
          endDate
        },
        accessToken
      );
      const metrics = extractPinAnalytics(raw);
      const nextItem = applyWinnerRules({
        ...item,
        ...metrics,
        analyticsRaw: raw,
        lastAnalyticsSyncAt: now,
        errorMessage: undefined
      });
      const index = updatedItems.findIndex(
        (candidate) => candidate.internalPinId === item.internalPinId && candidate.pinterestPinId === item.pinterestPinId
      );

      if (index >= 0) {
        updatedItems[index] = nextItem;
      }

      results.push({ pinterestPinId: item.pinterestPinId as string, success: true });
    } catch (error) {
      const index = updatedItems.findIndex(
        (candidate) => candidate.internalPinId === item.internalPinId && candidate.pinterestPinId === item.pinterestPinId
      );

      if (index >= 0) {
        updatedItems[index] = {
          ...updatedItems[index],
          lastAnalyticsSyncAt: now,
          errorMessage: error instanceof Error ? error.message : "Pinterest analytics sync failed."
        };
      }

      results.push({
        pinterestPinId: item.pinterestPinId as string,
        success: false,
        errorMessage: error instanceof Error ? error.message : "Pinterest analytics sync failed."
      });
    }
  }

  await writeStore(sortPublished(updatedItems));

  return {
    ok: true,
    synced: results.filter((result) => result.success).length,
    failed: results.filter((result) => !result.success).length,
    results,
    items: sortPublished(updatedItems.map(applyWinnerRules))
  };
}

export async function getPinterestLiveDashboard(origin?: string): Promise<PinterestLiveDashboard> {
  const [published, schedule, opsSummary] = await Promise.all([
    listPinterestPublishedPins(),
    getPinterestScheduleDashboard(origin),
    getPinterestOpsSummary(origin)
  ]);
  const successPins = published.filter((pin) => pin.result === "success");
  const canaryPins = published.filter((pin) => pin.publishMode === "canary");
  const recentlyPublished = successPins.slice(0, 6);
  const topPerformers = [...successPins]
    .sort((left, right) => (right.outboundClicks || 0) - (left.outboundClicks || 0) || (right.saves || 0) - (left.saves || 0))
    .slice(0, 6);
  const needsReview = published
    .filter((pin) => pin.result !== "success" || !pin.lastAnalyticsSyncAt || (pin.impressions || 0) < 50)
    .slice(0, 8);

  return {
    ok: true,
    publishEnabled: isPinterestPublishEnabled(),
    canaryBoardId: resolvePinterestCanaryBoardId(),
    publishReadyCount: opsSummary.counts.pinsReadyForScheduler,
    livePublishLimit: getLivePublishLimit(),
    analyticsLookbackDays: getAnalyticsLookbackDays(),
    schedulerCoverageRemaining: schedule.summary.estimatedDaysRemaining,
    published,
    recentlyPublished,
    topPerformers,
    needsReview,
    winnerCandidates: published.filter((pin) => pin.winnerCandidate && !pin.confirmedWinner),
    confirmedWinners: published.filter((pin) => pin.confirmedWinner),
    lastCanary: canaryPins[0],
    checklist: [
      { label: "Website claimed", ready: false, note: "Manual Pinterest Business check." },
      { label: "Amazon Storefront linked", ready: false, note: "Manual business setup if Storefront is used." },
      { label: "Board live ready", ready: Boolean(resolvePinterestCanaryBoardId()), note: "Set canary/launch/library/test board id." },
      { label: "Publish enabled", ready: isPinterestPublishEnabled(), note: "PINTEREST_ENABLE_PUBLISH must be true only during controlled tests." },
      { label: "Write scopes active", ready: false, note: "Confirm OAuth has boards:write and pins:write." },
      { label: "Canary publish validated", ready: successPins.some((pin) => pin.publishMode === "canary"), note: "One successful live test pin stored locally." },
      { label: "Analytics sync validated", ready: published.some((pin) => pin.lastAnalyticsSyncAt), note: "Requires Pinterest analytics access and PINTEREST_AD_ACCOUNT_ID." }
    ]
  };
}

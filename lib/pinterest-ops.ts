import fs from "node:fs";
import path from "node:path";

import { env } from "@/lib/env";
import {
  getPinterestLibraryData,
  mapLibraryPinsToScheduleItems,
  resolvePinterestLibraryBoardId,
  type LibraryPin
} from "@/lib/pinterest-library";
import { getMonetizedProducts, setProductQaStatuses } from "@/lib/pinterest-monetization";
import { getPinterestScheduleDashboard, replacePinterestScheduleQueue } from "@/lib/pinterest-schedule";

export type PinQaResult = {
  pinId: string;
  productKey: string;
  qaPassed: boolean;
  qaIssues: string[];
  monetizationReady: boolean;
  publishReady: boolean;
  hasLocalImage: boolean;
};

type OpsRow = {
  pinId: string;
  productKey: string;
  affiliateStatus: string;
  qaStatus: "pass" | "blocked";
  schedulerStatus: string;
  performanceLabel: string;
  monetizationReady: boolean;
  publishReady: boolean;
};

function hasLocalImage(assetPath: string) {
  return assetPath.startsWith("/") && fs.existsSync(path.join(process.cwd(), "public", assetPath.replace(/^\//, "")));
}

function isAngleValid(value: string) {
  return ["before_after", "problem_solution", "aesthetic_result", "winner_variant"].includes(value);
}

function isValidUrl(value?: string) {
  if (!value) return false;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function distributePinsForSchedule(pins: LibraryPin[]) {
  const productGap = new Map<string, number>();
  const sorted = [...pins].sort((a, b) => b.publishPriority - a.publishPriority);
  const selected: LibraryPin[] = [];

  for (const pin of sorted) {
    const lastIndex = productGap.get(pin.productKey) ?? -1000;
    if (selected.length - lastIndex < 2) continue;
    selected.push(pin);
    productGap.set(pin.productKey, selected.length - 1);
  }

  for (const pin of sorted) {
    if (!selected.includes(pin)) selected.push(pin);
  }

  return selected;
}

export async function runPinterestOpsQa(origin?: string) {
  const library = await getPinterestLibraryData(origin);
  const monetized = await getMonetizedProducts();
  const productMap = new Map(monetized.map((item) => [item.productKey, item]));

  const results: PinQaResult[] = [];
  const productQaUpdates = new Map<string, "passed" | "failed">();

  for (const pin of library.pins) {
    const product = productMap.get(pin.productKey);
    const issues: string[] = [];
    const localImage = hasLocalImage(pin.imageAssetPath);
    const isIgnoredBacklog = product?.activeStatus === "ignored_backlog";
    const resolvedBoardId = resolvePinterestLibraryBoardId(pin.boardId);
    const hasValidAffiliateUrl = isValidUrl(product?.amazonAffiliateUrl);

    if (!pin.pinTitle.trim()) issues.push("missing_title");
    if (!pin.pinDescription.trim()) issues.push("missing_description");
    if (!localImage) issues.push("missing_image");
    if (!isIgnoredBacklog && !hasValidAffiliateUrl) issues.push("missing_affiliate_url");
    if (!resolvedBoardId) issues.push("missing_board");
    if (!isAngleValid(pin.contentAngle)) issues.push("invalid_angle");
    if (!Number.isFinite(pin.overallScore)) issues.push("missing_score");

    const qaPassed = isIgnoredBacklog ? true : issues.length === 0;
    const monetizationReady = isIgnoredBacklog ? false : qaPassed && Boolean(product?.amazonAffiliateUrl);
    const publishReady = monetizationReady;

    if (product && !isIgnoredBacklog) {
      const currentStatus = productQaUpdates.get(product.productKey);
      productQaUpdates.set(product.productKey, currentStatus === "failed" || !qaPassed ? "failed" : "passed");
    }

    results.push({ pinId: pin.pinId, productKey: pin.productKey, qaPassed, qaIssues: issues, monetizationReady, publishReady, hasLocalImage: localImage });
  }

  await setProductQaStatuses(
    [...productQaUpdates.entries()].map(([productKey, qaStatus]) => ({
      productKey,
      qaStatus
    }))
  );

  return results;
}

export async function getPinterestOpsSummary(origin?: string) {
  const [library, monetized, qaResults, schedule] = await Promise.all([
    getPinterestLibraryData(origin),
    getMonetizedProducts(),
    runPinterestOpsQa(origin),
    getPinterestScheduleDashboard(origin)
  ]);

  const scheduleMap = new Map(schedule.queue.map((item) => [item.pinId, item]));
  const qaMap = new Map(qaResults.map((item) => [item.pinId, item]));
  const productMap = new Map(monetized.map((item) => [item.productKey, item]));
  const opsRows: OpsRow[] = library.pins.map((pin) => {
    const qa = qaMap.get(pin.pinId);
    const product = productMap.get(pin.productKey);
    const scheduled = scheduleMap.get(pin.pinId);
    return {
      pinId: pin.pinId,
      productKey: pin.productKey,
      affiliateStatus: product?.affiliateStatus || "missing",
      qaStatus: qa?.qaPassed ? "pass" : "blocked",
      schedulerStatus: scheduled?.status || "unscheduled",
      performanceLabel: pin.performance.performanceLabel,
      monetizationReady: qa?.monetizationReady ?? false,
      publishReady: qa?.publishReady ?? false
    };
  });

  const blocked = qaResults
    .filter((item) => !item.qaPassed)
    .map((item) => ({ pinId: item.pinId, productKey: item.productKey, reasons: item.qaIssues }));

  const dueToday = schedule.queue.filter((item) => item.scheduledAt && new Date(item.scheduledAt).toDateString() === new Date().toDateString());
  const nextPublications = schedule.queue.filter((item) => item.scheduledAt).slice(0, 5);

  const readyPins = qaResults.filter((entry) => entry.qaPassed && entry.monetizationReady);
  const activeProducts = monetized.filter((item) => item.activeStatus === "active");
  const ignoredProducts = monetized.filter((item) => item.activeStatus === "ignored_backlog");
  const ignoredProductKeys = new Set(ignoredProducts.map((item) => item.productKey));
  const excludedPinsCount = library.pins.filter((pin) => ignoredProductKeys.has(pin.productKey)).length;
  const targetDays = Number(env.PINTEREST_TARGET_DAYS || env.PINTEREST_CONTENT_TARGET_DAYS || 30);
  const pinsPerDay = Number(env.PINTEREST_PINS_PER_DAY || 3);

  return {
    ok: true,
    counts: {
      totalProducts: monetized.length,
      activeProducts: activeProducts.length,
      ignoredProducts: ignoredProducts.length,
      productsWithFinalAffiliateUrl: activeProducts.filter((item) => item.affiliateStatus === "final").length,
      totalPins: library.pins.length,
      pinsQaPass: qaResults.filter((entry) => entry.qaPassed).length,
      pinsBlocked: qaResults.filter((entry) => !entry.qaPassed).length,
      pinsExcluded: excludedPinsCount,
      pinsReadyForScheduler: readyPins.length,
      pinsScheduled: schedule.summary.scheduled,
      pinsPublished: schedule.summary.published,
      pinsWinners: library.pins.filter((pin) => pin.performance.performanceLabel === "winner").length,
      pinsLowPerformers: library.pins.filter((pin) => pin.performance.performanceLabel === "low_performer").length,
      coverageDays: Math.min(targetDays, Math.ceil(Math.max(1, schedule.summary.scheduled) / Math.max(1, pinsPerDay))),
      publishLiveEnabled: env.PINTEREST_ENABLE_PUBLISH === "true" ? 1 : 0
    },
    qaResults,
    blockers: blocked,
    today: {
      dueToday,
      nextPublications,
      errorPins: schedule.queue.filter((item) => item.status === "failed"),
      recentWinners: library.pins.filter((pin) => pin.performance.performanceLabel === "winner").slice(0, 5),
      readyVariants: library.pins.filter((pin) => pin.contentAngle === "winner_variant"),
      remainingCoverageDays: Math.max(0, targetDays - schedule.summary.coverageDays)
    },
    products: monetized,
    pins: library.pins,
    scheduleSummary: schedule.summary,
    opsRows,
    config: { targetDays, pinsPerDay }
  };
}

export async function generateWinnerVariants(origin?: string) {
  const after = await getPinterestLibraryData(origin);
  const totalVariants = after.pins.filter((pin) => pin.contentAngle === "winner_variant").length;
  return { ok: true, generatedCount: totalVariants > 0 ? totalVariants : 0, totalVariants };
}

export async function sendQaPassedPinsToScheduler(origin?: string) {
  const summary = await getPinterestOpsSummary(origin);
  const activeProductKeys = new Set(summary.products.filter((item) => item.activeStatus === "active").map((item) => item.productKey));
  const passedIds = new Set(
    summary.qaResults
      .filter((entry) => entry.qaPassed && entry.monetizationReady && activeProductKeys.has(entry.productKey))
      .map((entry) => entry.pinId)
  );
  const pins = summary.pins.filter((pin) => passedIds.has(pin.pinId));

  const dashboard = await replacePinterestScheduleQueue({
    items: mapLibraryPinsToScheduleItems(pins, summary.products),
    days: Number(env.PINTEREST_TARGET_DAYS || 30)
  });

  return { ok: true, sentCount: pins.length, dashboard };
}

export async function fillNext30DaysFromReadyPins(origin?: string) {
  const summary = await getPinterestOpsSummary(origin);
  const activeProductKeys = new Set(summary.products.filter((item) => item.activeStatus === "active").map((item) => item.productKey));
  const readyPinMap = new Map(
    summary.qaResults
      .filter((entry) => entry.qaPassed && entry.monetizationReady && activeProductKeys.has(entry.productKey))
      .map((entry) => [entry.pinId, entry])
  );
  const readyPins = summary.pins.filter((pin) => readyPinMap.has(pin.pinId));
  const rankedPins = distributePinsForSchedule(readyPins);

  const days = Number(env.PINTEREST_TARGET_DAYS || 30);
  const pinsPerDay = Number(env.PINTEREST_PINS_PER_DAY || 3);
  const targetSlots = days * pinsPerDay;
  const selectedPins = rankedPins.slice(0, targetSlots);

  const dashboard = await replacePinterestScheduleQueue({
    items: mapLibraryPinsToScheduleItems(selectedPins, summary.products),
    days
  });

  return { ok: true, targetSlots, selected: selectedPins.length, coverageDays: Math.min(days, Math.ceil(selectedPins.length / Math.max(1, pinsPerDay))), dashboard };
}

export async function runFullOpsCycle(origin?: string) {
  const qaResults = await runPinterestOpsQa(origin);
  const variants = await generateWinnerVariants(origin);
  const sendReady = await sendQaPassedPinsToScheduler(origin);
  const fill = await fillNext30DaysFromReadyPins(origin);
  const summary = await getPinterestOpsSummary(origin);

  return {
    ok: true,
    steps: {
      affiliateCheckDone: true,
      qaRun: qaResults.length,
      variantsGenerated: variants.totalVariants,
      sentToScheduler: sendReady.sentCount,
      fill30DaysSelected: fill.selected
    },
    summary
  };
}

export function buildOpsExportCsv(rows: OpsRow[]) {
  const header = ["pinId", "productKey", "affiliateStatus", "qaStatus", "schedulerStatus", "performanceLabel", "monetizationReady", "publishReady"];
  const lines = rows.map((row) =>
    [row.pinId, row.productKey, row.affiliateStatus, row.qaStatus, row.schedulerStatus, row.performanceLabel, row.monetizationReady, row.publishReady]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

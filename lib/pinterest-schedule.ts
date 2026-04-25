import fs from "node:fs/promises";
import path from "node:path";

import {
  getPreparedPinterestLaunchPins,
  type PinterestLaunchImageSourceType,
  type PinterestLaunchMode,
  type PreparedPinterestLaunchPin
} from "@/lib/pinterest-content";
import { env } from "@/lib/env";
import { createPin, type CreatePinInput } from "@/lib/pinterest";
import { isPinterestPublishEnabled } from "@/lib/pinterest-launch";
import { getMissingPinterestDemoScopes } from "@/lib/pinterest-oauth";

const DEFAULT_TIMEZONE = "America/Toronto";
const DEFAULT_DAILY_SLOTS = ["09:00", "14:00", "20:00"];
const STORE_VERSION = 1;

export type PinterestScheduleStatus =
  | "draft"
  | "ready"
  | "scheduled"
  | "published"
  | "failed"
  | "dry-run ok"
  | "blocked";

export type PinterestScheduleRunMode = PinterestLaunchMode | "auto";

export type PinterestScheduleItem = {
  id: string;
  pinId: string;
  pinNumber: number;
  productKey: PreparedPinterestLaunchPin["productKey"];
  relatedProductKeys?: PreparedPinterestLaunchPin["relatedProductKeys"];
  category: PreparedPinterestLaunchPin["category"];
  internalTitle: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAssetPath: string;
  imageSourceType: PinterestLaunchImageSourceType;
  isFallback: boolean;
  link?: string;
  boardId: string;
  status: PinterestScheduleStatus;
  scheduledAt?: string;
  publishedAt?: string;
  mode: PinterestLaunchMode;
  errorMessage?: string;
  lastAttemptAt?: string;
};

type PinterestScheduleStore = {
  version: number;
  updatedAt: string;
  items: PinterestScheduleItem[];
};

export type PinterestScheduleSummary = {
  totalPins: number;
  ready: number;
  scheduled: number;
  published: number;
  failed: number;
  dryRunOk: number;
  blocked: number;
  draft: number;
  dueNow: number;
  nextPublicationAt?: string;
  coverageDays: number;
  scheduleCoverageLabel: string;
  publishEnabled: boolean;
  timezone: string;
  dailySlots: string[];
  estimatedDaysRemaining: number;
};

export type PinterestScheduleRunResult = {
  id: string;
  pinId: string;
  pinNumber: number;
  success: boolean;
  pinTitle: string;
  boardId: string;
  link?: string;
  imageUrl: string;
  scheduledAt?: string;
  publishedAt?: string;
  mode: PinterestLaunchMode;
  requestedMode: PinterestScheduleRunMode;
  status: PinterestScheduleStatus;
  errorMessage?: string;
  lastAttemptAt?: string;
  remotePinId?: string;
};

export type PinterestScheduleRunReport = {
  ok: boolean;
  requestedMode: PinterestScheduleRunMode;
  effectiveMode: PinterestScheduleRunMode;
  publishEnabled: boolean;
  publishBlocked: boolean;
  warning?: string;
  totalDue: number;
  processed: number;
  counts: {
    success: number;
    failed: number;
    dryRunOk: number;
    published: number;
    blocked: number;
  };
  results: PinterestScheduleRunResult[];
};

export type PinterestScheduleDashboard = {
  ok: boolean;
  queue: PinterestScheduleItem[];
  summary: PinterestScheduleSummary;
  report?: PinterestScheduleRunReport;
  message?: string;
  filledCount?: number;
  clearedCount?: number;
};

type RunOptions = {
  requestedMode: PinterestScheduleRunMode;
  origin: string;
  accessToken?: string;
  sessionScopes?: string[];
};

type FillOptions = {
  origin?: string;
  days?: number;
};

function getScheduleStorePath() {
  return path.join(process.cwd(), "data", "pinterest-schedule-queue.json");
}

function getDefaultScheduleMode(): PinterestLaunchMode {
  return isPinterestPublishEnabled() ? "publish" : "dryRun";
}

export function getPinterestScheduleTimezone() {
  return env.PINTEREST_SCHEDULE_TIMEZONE || DEFAULT_TIMEZONE;
}

export function getPinterestDailySlots() {
  const rawValue = env.PINTEREST_DAILY_SLOTS;

  if (!rawValue) {
    return [...DEFAULT_DAILY_SLOTS];
  }

  const slots = rawValue
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(entry))
    .sort((left, right) => left.localeCompare(right));

  return slots.length > 0 ? Array.from(new Set(slots)) : [...DEFAULT_DAILY_SLOTS];
}

function createInitialStore(): PinterestScheduleStore {
  return {
    version: STORE_VERSION,
    updatedAt: new Date().toISOString(),
    items: []
  };
}

async function ensureStoreFile() {
  const storePath = getScheduleStorePath();
  await fs.mkdir(path.dirname(storePath), { recursive: true });

  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, `${JSON.stringify(createInitialStore(), null, 2)}\n`, "utf8");
  }
}

async function readStore() {
  await ensureStoreFile();
  const storePath = getScheduleStorePath();

  try {
    const rawText = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(rawText) as Partial<PinterestScheduleStore> | null;

    if (!parsed || !Array.isArray(parsed.items)) {
      return createInitialStore();
    }

    return {
      version: typeof parsed.version === "number" ? parsed.version : STORE_VERSION,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      items: parsed.items as PinterestScheduleItem[]
    };
  } catch {
    return createInitialStore();
  }
}

async function writeStore(items: PinterestScheduleItem[]) {
  await ensureStoreFile();
  const storePath = getScheduleStorePath();
  const payload: PinterestScheduleStore = {
    version: STORE_VERSION,
    updatedAt: new Date().toISOString(),
    items
  };

  await fs.writeFile(storePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function isValidDateString(value?: string) {
  return Boolean(value && !Number.isNaN(Date.parse(value)));
}

function cleanDateString(value?: string) {
  return isValidDateString(value) ? value : undefined;
}

function resolveScheduleBoardId(explicitBoardId?: string) {
  return env.PINTEREST_LAUNCH_BOARD_ID || env.PINTEREST_TEST_BOARD_ID || explicitBoardId || "";
}

function hasRequiredQueueFields(item: Pick<PinterestScheduleItem, "boardId" | "link">) {
  return Boolean(item.boardId && item.link);
}

function isEligibleForScheduling(item: PinterestScheduleItem) {
  if (item.publishedAt || item.scheduledAt) {
    return false;
  }

  if (!hasRequiredQueueFields(item)) {
    return false;
  }

  return item.status === "ready" || item.status === "dry-run ok" || item.status === "failed" || item.status === "blocked";
}

function isDueNow(item: PinterestScheduleItem) {
  return Boolean(item.scheduledAt && Date.parse(item.scheduledAt) <= Date.now() && !item.publishedAt);
}

function getScheduleParts(value: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const partMap = Object.fromEntries(
    formatter
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  ) as Record<string, string>;
  const year = Number(partMap.year);
  const month = Number(partMap.month);
  const day = Number(partMap.day);
  const rawHour = Number(partMap.hour);
  const hour = rawHour === 24 ? 0 : rawHour;
  const minute = Number(partMap.minute);
  const second = Number(partMap.second);

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dayKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  };
}

function getTimeZoneOffsetMs(value: Date, timeZone: string) {
  const parts = getScheduleParts(value, timeZone);
  const utcTimestamp = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);

  return utcTimestamp - value.getTime();
}

function zonedDateTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string) {
  const wallClockTimestamp = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guess = wallClockTimestamp;

  for (let index = 0; index < 4; index += 1) {
    const offset = getTimeZoneOffsetMs(new Date(guess), timeZone);
    const adjusted = wallClockTimestamp - offset;

    if (adjusted === guess) {
      break;
    }

    guess = adjusted;
  }

  return new Date(guess);
}

function getBaseStatus(pin: PreparedPinterestLaunchPin) {
  return resolveScheduleBoardId(pin.boardId) && pin.amazonUrl ? ("ready" as const) : ("draft" as const);
}

function createQueueItemFromPin(pin: PreparedPinterestLaunchPin): PinterestScheduleItem {
  return {
    id: pin.pinId,
    pinId: pin.pinId,
    pinNumber: pin.order,
    productKey: pin.productKey,
    relatedProductKeys: pin.relatedProductKeys,
    category: pin.category,
    internalTitle: pin.internalTitle,
    title: pin.pinTitle,
    description: pin.pinDescription,
    imageUrl: pin.imageUrl,
    imageAssetPath: pin.imageAssetPath,
    imageSourceType: pin.imageSourceType,
    isFallback: pin.isFallback,
    link: pin.amazonUrl,
    boardId: resolveScheduleBoardId(pin.boardId),
    status: getBaseStatus(pin),
    mode: getDefaultScheduleMode()
  };
}

function normalizeQueueItem(item: PinterestScheduleItem): PinterestScheduleItem {
  const normalized: PinterestScheduleItem = {
    ...item,
    boardId: resolveScheduleBoardId(item.boardId),
    link: item.link || undefined,
    scheduledAt: cleanDateString(item.scheduledAt),
    publishedAt: cleanDateString(item.publishedAt),
    lastAttemptAt: cleanDateString(item.lastAttemptAt),
    errorMessage: item.errorMessage || undefined,
    mode: item.mode === "publish" ? "publish" : "dryRun"
  };

  if (!hasRequiredQueueFields(normalized)) {
    return {
      ...normalized,
      status: "draft",
      scheduledAt: undefined
    };
  }

  if (normalized.publishedAt) {
    return {
      ...normalized,
      status: "published",
      scheduledAt: undefined,
      errorMessage: undefined
    };
  }

  if (normalized.scheduledAt) {
    if (normalized.status !== "failed" && normalized.status !== "blocked") {
      return {
        ...normalized,
        status: "scheduled"
      };
    }

    return normalized;
  }

  if (normalized.status === "dry-run ok" || normalized.status === "failed" || normalized.status === "blocked") {
    return normalized;
  }

  return {
    ...normalized,
    status: "ready"
  };
}

function sortQueue(queue: PinterestScheduleItem[]) {
  return [...queue].sort((left, right) => {
    if (left.scheduledAt && right.scheduledAt) {
      return Date.parse(left.scheduledAt) - Date.parse(right.scheduledAt);
    }

    if (left.scheduledAt) {
      return -1;
    }

    if (right.scheduledAt) {
      return 1;
    }

    if (left.publishedAt && right.publishedAt) {
      return Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
    }

    if (left.publishedAt) {
      return 1;
    }

    if (right.publishedAt) {
      return -1;
    }

    return left.pinNumber - right.pinNumber;
  });
}

async function syncQueue(origin?: string) {
  const store = await readStore();
  const storedMap = new Map(store.items.map((item) => [item.id, item]));
  const queue: PinterestScheduleItem[] = getPreparedPinterestLaunchPins(origin).map((pin): PinterestScheduleItem => {
    const baseItem = createQueueItemFromPin(pin);
    const storedItem = storedMap.get(baseItem.id);

    if (!storedItem) {
      return baseItem;
    }

    const mergedItem: PinterestScheduleItem = {
      ...baseItem,
      scheduledAt: storedItem.scheduledAt,
      publishedAt: storedItem.publishedAt,
      status: storedItem.status,
      mode: storedItem.mode,
      errorMessage: storedItem.errorMessage,
      lastAttemptAt: storedItem.lastAttemptAt
    };

    return normalizeQueueItem(mergedItem);
  });
  const sortedQueue = sortQueue(queue);

  await writeStore(sortedQueue);

  return sortedQueue;
}

function buildDashboard(queue: PinterestScheduleItem[], report?: PinterestScheduleRunReport, message?: string) {
  const timeZone = getPinterestScheduleTimezone();
  const dailySlots = getPinterestDailySlots();
  const nextPublicationAt = queue
    .filter((item) => item.scheduledAt)
    .map((item) => item.scheduledAt as string)
    .sort((left, right) => Date.parse(left) - Date.parse(right))[0];
  const coverageDays = new Set(
    queue
      .filter((item) => item.scheduledAt)
      .map((item) => getScheduleParts(new Date(item.scheduledAt as string), timeZone).dayKey)
  ).size;
  const scheduleableRemaining = queue.filter(
    (item) => !item.publishedAt && (item.status === "ready" || item.status === "dry-run ok" || item.status === "scheduled")
  ).length;
  const summary = queue.reduce(
    (accumulator, item) => {
      accumulator.totalPins += 1;

      if (item.status === "ready") {
        accumulator.ready += 1;
      }

      if (item.status === "scheduled") {
        accumulator.scheduled += 1;
      }

      if (item.status === "published") {
        accumulator.published += 1;
      }

      if (item.status === "failed") {
        accumulator.failed += 1;
      }

      if (item.status === "dry-run ok") {
        accumulator.dryRunOk += 1;
      }

      if (item.status === "blocked") {
        accumulator.blocked += 1;
      }

      if (item.status === "draft") {
        accumulator.draft += 1;
      }

      if (isDueNow(item)) {
        accumulator.dueNow += 1;
      }

      return accumulator;
    },
    {
      totalPins: 0,
      ready: 0,
      scheduled: 0,
      published: 0,
      failed: 0,
      dryRunOk: 0,
      blocked: 0,
      draft: 0,
      dueNow: 0
    }
  );

  return {
    ok: true,
    queue,
    summary: {
      ...summary,
      nextPublicationAt,
      coverageDays,
      scheduleCoverageLabel: coverageDays === 1 ? "1 day covered" : `${coverageDays} days covered`,
      publishEnabled: isPinterestPublishEnabled(),
      timezone: timeZone,
      dailySlots,
      estimatedDaysRemaining:
        scheduleableRemaining === 0 ? 0 : Math.ceil(scheduleableRemaining / Math.max(1, dailySlots.length))
    },
    report,
    message
  } satisfies PinterestScheduleDashboard;
}

function buildPayload(item: PinterestScheduleItem): CreatePinInput {
  return {
    boardId: item.boardId,
    title: item.title,
    description: item.description,
    link: item.link || "",
    imageUrl: item.imageUrl,
    altText: item.internalTitle
  };
}

function buildRunResult(
  item: PinterestScheduleItem,
  requestedMode: PinterestScheduleRunMode,
  mode: PinterestLaunchMode,
  overrides: Partial<PinterestScheduleRunResult>
): PinterestScheduleRunResult {
  return {
    id: item.id,
    pinId: item.pinId,
    pinNumber: item.pinNumber,
    success: false,
    pinTitle: item.title,
    boardId: item.boardId,
    link: item.link,
    imageUrl: item.imageUrl,
    scheduledAt: item.scheduledAt,
    publishedAt: item.publishedAt,
    mode,
    requestedMode,
    status: item.status,
    errorMessage: item.errorMessage,
    lastAttemptAt: item.lastAttemptAt,
    ...overrides
  };
}

function getUpcomingScheduleSlots(days: number, occupiedSlots: Set<string>) {
  const now = new Date();
  const timeZone = getPinterestScheduleTimezone();
  const dailySlots = getPinterestDailySlots();
  const { year, month, day } = getScheduleParts(now, timeZone);
  const upcomingSlots: string[] = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    for (const slot of dailySlots) {
      const [hour, minute] = slot.split(":").map(Number);
      const slotDate = zonedDateTimeToUtc(year, month, day + dayOffset, hour, minute, timeZone);
      const isoValue = slotDate.toISOString();

      if (slotDate.getTime() <= now.getTime()) {
        continue;
      }

      if (occupiedSlots.has(isoValue)) {
        continue;
      }

      upcomingSlots.push(isoValue);
    }
  }

  return upcomingSlots.sort((left, right) => Date.parse(left) - Date.parse(right));
}

export async function getPinterestScheduleDashboard(origin?: string) {
  const queue = await syncQueue(origin);

  return buildDashboard(queue);
}

export async function fillPinterestSchedule({ origin, days = 7 }: FillOptions = {}) {
  const queue = await syncQueue(origin);
  const occupiedSlots = new Set(queue.filter((item) => item.scheduledAt).map((item) => item.scheduledAt as string));
  const availableSlots = getUpcomingScheduleSlots(days, occupiedSlots);
  let filledCount = 0;

  for (const item of queue) {
    if (!isEligibleForScheduling(item)) {
      continue;
    }

    const nextSlot = availableSlots.shift();

    if (!nextSlot) {
      break;
    }

    item.scheduledAt = nextSlot;
    item.status = "scheduled";
    item.errorMessage = undefined;
    item.lastAttemptAt = undefined;
    item.mode = getDefaultScheduleMode();
    filledCount += 1;
  }

  const nextQueue = sortQueue(queue);
  await writeStore(nextQueue);

  return {
    ...buildDashboard(nextQueue, undefined, filledCount > 0 ? `${filledCount} pins scheduled.` : "No ready pins were available to schedule."),
    filledCount
  } satisfies PinterestScheduleDashboard;
}

export async function clearPinterestSchedule(origin?: string) {
  const queue = await syncQueue(origin);
  let clearedCount = 0;

  for (const item of queue) {
    if (item.publishedAt) {
      continue;
    }

    if (item.scheduledAt) {
      clearedCount += 1;
    }

    item.scheduledAt = undefined;
    item.lastAttemptAt = undefined;
    item.errorMessage = undefined;
    item.mode = getDefaultScheduleMode();
    item.status = hasRequiredQueueFields(item) ? "ready" : "draft";
  }

  const nextQueue = sortQueue(queue);
  await writeStore(nextQueue);

  return {
    ...buildDashboard(nextQueue, undefined, clearedCount > 0 ? `${clearedCount} scheduled pins cleared.` : "No scheduled pins needed to be cleared."),
    clearedCount
  } satisfies PinterestScheduleDashboard;
}

export async function runPinterestScheduleDue({
  requestedMode,
  origin,
  accessToken,
  sessionScopes = []
}: RunOptions) {
  const queue = await syncQueue(origin);
  const dueItems = queue.filter((item) => isDueNow(item) && item.status !== "published");
  const publishEnabled = isPinterestPublishEnabled();
  const publishBlocked = requestedMode === "publish" && !publishEnabled;
  const reportWarning =
    publishBlocked && requestedMode === "publish"
      ? "PINTEREST_ENABLE_PUBLISH=false. Safe dry-runs were executed instead of live publishing."
      : dueItems.length === 0
        ? "No scheduled pins are due right now."
        : undefined;
  const missingWriteScopes =
    requestedMode === "publish" && accessToken
      ? getMissingPinterestDemoScopes(sessionScopes).filter(
          (scope) => scope === "boards:write" || scope === "pins:write"
        )
      : [];
  const results: PinterestScheduleRunResult[] = [];

  for (const item of dueItems) {
    const desiredMode = requestedMode === "auto" ? item.mode : requestedMode;
    const safeDryRun = desiredMode === "publish" && !publishEnabled;
    const effectiveMode = safeDryRun ? "dryRun" : desiredMode;
    const attemptAt = new Date().toISOString();

    if (!hasRequiredQueueFields(item)) {
      item.status = "failed";
      item.lastAttemptAt = attemptAt;
      item.errorMessage = "This pin is missing a board or Amazon link and cannot run yet.";
      results.push(
        buildRunResult(item, requestedMode, effectiveMode, {
          status: item.status,
          errorMessage: item.errorMessage,
          lastAttemptAt: item.lastAttemptAt
        })
      );
      continue;
    }

    if (effectiveMode === "dryRun") {
      item.status = "dry-run ok";
      item.scheduledAt = undefined;
      item.lastAttemptAt = attemptAt;
      item.errorMessage = safeDryRun ? "Live publish is disabled. Safe dry-run executed instead." : undefined;
      item.mode = effectiveMode;
      results.push(
        buildRunResult(item, requestedMode, effectiveMode, {
          success: true,
          status: item.status,
          errorMessage: item.errorMessage,
          scheduledAt: item.scheduledAt,
          lastAttemptAt: item.lastAttemptAt
        })
      );
      continue;
    }

    if (missingWriteScopes.length > 0) {
      item.status = "blocked";
      item.lastAttemptAt = attemptAt;
      item.errorMessage = `Pinterest OAuth connected, but the token is missing required write scopes: ${missingWriteScopes.join(
        ", "
      )}.`;
      results.push(
        buildRunResult(item, requestedMode, effectiveMode, {
          status: item.status,
          errorMessage: item.errorMessage,
          lastAttemptAt: item.lastAttemptAt
        })
      );
      continue;
    }

    try {
      const remotePin = await createPin(buildPayload(item), accessToken);

      item.status = "published";
      item.scheduledAt = undefined;
      item.publishedAt = attemptAt;
      item.lastAttemptAt = attemptAt;
      item.errorMessage = undefined;
      item.mode = effectiveMode;
      results.push(
        buildRunResult(item, requestedMode, effectiveMode, {
          success: true,
          status: item.status,
          publishedAt: item.publishedAt,
          scheduledAt: item.scheduledAt,
          lastAttemptAt: item.lastAttemptAt,
          remotePinId: remotePin.id
        })
      );
    } catch (error) {
      item.status = "failed";
      item.lastAttemptAt = attemptAt;
      item.errorMessage = error instanceof Error ? error.message : "Unable to publish this scheduled Pinterest pin.";
      results.push(
        buildRunResult(item, requestedMode, effectiveMode, {
          status: item.status,
          errorMessage: item.errorMessage,
          lastAttemptAt: item.lastAttemptAt
        })
      );
    }
  }

  const nextQueue = sortQueue(queue);
  await writeStore(nextQueue);

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

      if (result.status === "blocked") {
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
  const report: PinterestScheduleRunReport = {
    ok: true,
    requestedMode,
    effectiveMode: publishBlocked && requestedMode === "publish" ? "dryRun" : requestedMode,
    publishEnabled,
    publishBlocked,
    warning: reportWarning,
    totalDue: dueItems.length,
    processed: results.length,
    counts,
    results
  };

  return buildDashboard(nextQueue, report, reportWarning);
}

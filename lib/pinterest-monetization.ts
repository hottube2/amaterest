import fs from "node:fs/promises";
import path from "node:path";

import { premiumProducts, type PremiumProduct } from "@/lib/premium-products";

export type AffiliateStatus = "missing" | "raw_only" | "final";
export type QaStatus = "pending" | "passed" | "failed";

export type MonetizedProduct = PremiumProduct & {
  amazonUrlRaw: string;
  amazonAffiliateUrl: string;
  affiliateStatus: AffiliateStatus;
  qaStatus: QaStatus;
  monetizationReady: boolean;
  activeStatus: "active" | "ignored_backlog";
};

export const IGNORED_BACKLOG_PRODUCT_KEYS = new Set([
  "closet_closetmaid_starter_kit_01",
  "closet_closetmaid_organizer_kit_01",
  "closet_closetmaid_tower_drawers_01"
]);

type MonetizationStore = {
  version: number;
  products: Record<string, { amazonUrlRaw?: string; amazonAffiliateUrl?: string; affiliateStatus?: AffiliateStatus; qaStatus?: QaStatus; monetizationReady?: boolean }>;
  updatedAt: string;
};

const STORE_VERSION = 1;

function getStorePath() {
  return path.join(process.cwd(), "data", "pinterest-affiliate-links.json");
}

async function ensureStore() {
  await fs.mkdir(path.dirname(getStorePath()), { recursive: true });
  try {
    await fs.access(getStorePath());
  } catch {
    await fs.writeFile(
      getStorePath(),
      `${JSON.stringify({ version: STORE_VERSION, products: {}, updatedAt: new Date().toISOString() }, null, 2)}\n`,
      "utf8"
    );
  }
}

async function readStore(): Promise<MonetizationStore> {
  await ensureStore();
  try {
    const raw = await fs.readFile(getStorePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<MonetizationStore>;
    return { version: STORE_VERSION, products: parsed.products ?? {}, updatedAt: parsed.updatedAt ?? new Date().toISOString() };
  } catch {
    return { version: STORE_VERSION, products: {}, updatedAt: new Date().toISOString() };
  }
}

async function writeStore(store: MonetizationStore) {
  await ensureStore();
  await fs.writeFile(getStorePath(), `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function toMonetizedProduct(product: PremiumProduct, override?: MonetizationStore["products"][string]): MonetizedProduct {
  const amazonUrlRaw = override?.amazonUrlRaw || product.amazonUrl;
  const amazonAffiliateUrl = override?.amazonAffiliateUrl || "";
  const affiliateStatus: AffiliateStatus = override?.affiliateStatus || (amazonAffiliateUrl ? "final" : amazonUrlRaw ? "raw_only" : "missing");
  const qaStatus = override?.qaStatus || "pending";
  const monetizationReady = override?.monetizationReady ?? Boolean(amazonAffiliateUrl && affiliateStatus === "final" && qaStatus === "passed");
  const activeStatus = IGNORED_BACKLOG_PRODUCT_KEYS.has(product.productKey) ? "ignored_backlog" : "active";
  return { ...product, amazonUrlRaw, amazonAffiliateUrl, affiliateStatus, qaStatus, monetizationReady, activeStatus };
}

export async function getMonetizedProducts() {
  const store = await readStore();
  return premiumProducts.map((product) => toMonetizedProduct(product, store.products[product.productKey]));
}

export async function upsertAffiliateUrl(input: { productKey: string; amazonUrlRaw?: string; amazonAffiliateUrl: string }) {
  const store = await readStore();
  const productExists = premiumProducts.some((item) => item.productKey === input.productKey);
  if (!productExists) {
    throw new Error(`Unknown productKey: ${input.productKey}`);
  }

  const current = store.products[input.productKey] ?? {};
  const nextRaw = input.amazonUrlRaw ?? current.amazonUrlRaw;
  const affiliateUrlChanged = current.amazonAffiliateUrl !== input.amazonAffiliateUrl;
  store.products[input.productKey] = {
    ...current,
    amazonUrlRaw: nextRaw,
    amazonAffiliateUrl: input.amazonAffiliateUrl,
    affiliateStatus: input.amazonAffiliateUrl ? "final" : nextRaw ? "raw_only" : "missing",
    monetizationReady: false,
    qaStatus: affiliateUrlChanged ? "pending" : current.qaStatus ?? "pending"
  };
  store.updatedAt = new Date().toISOString();
  await writeStore(store);

  const base = premiumProducts.find((item) => item.productKey === input.productKey) as PremiumProduct;
  return toMonetizedProduct(base, store.products[input.productKey]);
}

export async function bulkUpsertAffiliateUrls(input: Array<{ productKey: string; amazonAffiliateUrl: string; amazonUrlRaw?: string }>) {
  const report = { updated: 0, skipped: 0, missingProductKey: [] as string[], invalidUrl: [] as string[] };

  for (const entry of input) {
    if (!entry.productKey) {
      report.skipped += 1;
      report.missingProductKey.push("(empty)");
      continue;
    }

    const productExists = premiumProducts.some((item) => item.productKey === entry.productKey);
    if (!productExists) {
      report.skipped += 1;
      report.missingProductKey.push(entry.productKey);
      continue;
    }

    try {
      new URL(entry.amazonAffiliateUrl);
    } catch {
      report.skipped += 1;
      report.invalidUrl.push(entry.productKey);
      continue;
    }

    await upsertAffiliateUrl(entry);
    report.updated += 1;
  }

  return report;
}

export function parseBulkAffiliateInput(raw: string, format: "json" | "csv" | "auto" = "auto") {
  const text = raw.trim();
  if (!text) return [] as Array<{ productKey: string; amazonAffiliateUrl: string; amazonUrlRaw?: string }>;

  const effectiveFormat =
    format === "auto" ? (text.startsWith("[") || text.startsWith("{") ? "json" : "csv") : format;

  if (effectiveFormat === "json") {
    const parsed = JSON.parse(text) as Array<{ productKey: string; amazonAffiliateUrl: string; amazonUrlRaw?: string }>;
    return Array.isArray(parsed) ? parsed : [];
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line, index) => !(index === 0 && /^productKey\s*,\s*amazonAffiliateUrl/i.test(line)))
    .map((line) => {
      const [productKey, amazonAffiliateUrl, amazonUrlRaw] = line.split(",").map((entry) => entry.trim());
      return { productKey, amazonAffiliateUrl, amazonUrlRaw };
    });
}

export async function setProductQaStatus(productKey: string, qaStatus: QaStatus) {
  const store = await readStore();
  const current = store.products[productKey] ?? {};
  store.products[productKey] = {
    ...current,
    qaStatus,
    monetizationReady: qaStatus === "passed" && Boolean(current.amazonAffiliateUrl)
  };
  store.updatedAt = new Date().toISOString();
  await writeStore(store);
}

export async function setProductQaStatuses(updates: Array<{ productKey: string; qaStatus: QaStatus }>) {
  const store = await readStore();

  for (const update of updates) {
    const current = store.products[update.productKey] ?? {};
    store.products[update.productKey] = {
      ...current,
      qaStatus: update.qaStatus,
      monetizationReady: update.qaStatus === "passed" && Boolean(current.amazonAffiliateUrl)
    };
  }

  store.updatedAt = new Date().toISOString();
  await writeStore(store);
}

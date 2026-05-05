import fs from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";
import { getPinterestDailySlots, type PinterestScheduleItem } from "@/lib/pinterest-schedule";
import { premiumProducts, type PremiumProduct, type PremiumProductCategory } from "@/lib/premium-products";

export type ContentAngle = "before_after" | "problem_solution" | "aesthetic_result" | "winner_variant";

export type PinPerformance = {
  pinId: string;
  impressions: number;
  clicks: number;
  outboundClicks: number;
  saves: number;
  ctr: number;
  publishDate?: string;
  lastUpdated: string;
  performanceNotes?: string;
  performanceLabel: "low_performer" | "stable" | "winner";
  winningPin: boolean;
};

export type LibraryPin = {
  pinId: string;
  productKey: string;
  pinTitle: string;
  pinDescription: string;
  imageAssetPath: string;
  imageUrl: string;
  boardId: string;
  status: "ready" | "draft";
  mode: "dryRun" | "publish";
  tags: string[];
  keywords: string[];
  contentAngle: ContentAngle;
  publishPriority: number;
  overallScore: number;
  priorityTier: "A" | "B" | "C";
  performance: PinPerformance;
};

export type ProductWithScore = PremiumProduct & {
  overallScore: number;
  priorityTier: "A" | "B" | "C";
};

type LibraryStore = {
  version: number;
  performance: Record<string, PinPerformance>;
  generatedVariants: string[];
  updatedAt: string;
};

const STORE_VERSION = 1;
const DEFAULT_TARGET_DAYS = 30;
const PRODUCT_IMAGE_ASSET_PATHS: Record<string, string> = {
  pantry_oxo_pop_5pc_01: "/pinterest-launch/pin-01.jpg",
  pantry_oxo_steel_6pc_01: "/pinterest-launch/pin-02.jpg",
  pantry_rubbermaid_brilliance_10pc_01: "/pinterest-launch/pin-03.jpg",
  pantry_rubbermaid_brilliance_20pc_01: "/pinterest-launch/pin-04.jpg",
  pantry_progressive_prokeeper_6pc_01: "/pinterest-launch/pin-05.jpg",
  pantry_vtopmart_24pc_01: "/pinterest-launch/pin-06.jpg",
  under_sink_yamazaki_pullout_01: "/pinterest-launch/pin-07.jpg",
  under_sink_yamazaki_pan_pot_01: "/pinterest-launch/pin-08.jpg",
  under_sink_delamu_clear_2tier_01: "/pinterest-launch/pin-09.jpg",
  under_sink_delamu_clear_4pc_01: "/pinterest-launch/pin-10.jpg",
  under_sink_iris_drawer_2pack_01: "/pinterest-launch/pin-07.jpg",
  under_sink_iris_drawer_3pack_01: "/pinterest-launch/pin-08.jpg",
  entryway_songmics_bamboo_bench_01: "/pinterest-launch/pin-09.jpg",
  entryway_songmics_storage_bench_01: "/pinterest-launch/pin-10.jpg",
  entryway_songmics_modern_bench_01: "/pinterest-launch/pin-09.jpg",
  vanity_cq_acrylic_3pack_01: "/pinterest-launch/pin-04.jpg",
  vanity_bino_5drawer_01: "/pinterest-launch/pin-05.jpg",
  beauty_shark_flexstyle_hd430c_01: "/pinterest-launch/pin-06.jpg",
  closet_closetmaid_starter_kit_01: "/pinterest-launch/pin-02.jpg",
  closet_closetmaid_organizer_kit_01: "/pinterest-launch/pin-03.jpg",
  closet_closetmaid_tower_drawers_01: "/pinterest-launch/pin-04.jpg"
};

export function resolvePinterestLibraryBoardId(pinBoardId?: string) {
  return (
    env.PINTEREST_LAUNCH_BOARD_ID ||
    env.PINTEREST_LIBRARY_DEFAULT_BOARD_ID ||
    env.PINTEREST_TEST_BOARD_ID ||
    pinBoardId ||
    ""
  );
}

function getLibraryStorePath() {
  return path.join(process.cwd(), "data", "pinterest-library.json");
}

function withOrigin(assetPath: string, origin?: string) {
  return origin ? new URL(assetPath, origin).toString() : assetPath;
}

function getProductImageAssetPath(productKey: string) {
  return PRODUCT_IMAGE_ASSET_PATHS[productKey] || "/pinterest-launch/pin-01.jpg";
}

function scoreToTier(score: number): "A" | "B" | "C" {
  if (score >= 80) {
    return "A";
  }

  if (score >= 65) {
    return "B";
  }

  return "C";
}

function computeOverallScore(product: PremiumProduct) {
  const highTicketBonus = product.highTicket ? 10 : 0;
  return Math.min(
    100,
    Math.round(
      product.aestheticScore * 0.25 +
        product.problemSolutionScore * 0.25 +
        product.commissionPriority * 0.25 +
        product.evergreenScore * 0.25 +
        highTicketBonus
    )
  );
}

function getDefaultMode(): "dryRun" | "publish" {
  return env.PINTEREST_ENABLE_PUBLISH === "true" ? "publish" : "dryRun";
}

function makeBasePins(products: ProductWithScore[], origin?: string) {
  const defaultMode = getDefaultMode();
  const boardId = resolvePinterestLibraryBoardId();

  return products.flatMap((product) => {
    const base = {
      productKey: product.productKey,
      boardId,
      status: boardId && product.amazonUrl ? ("ready" as const) : ("draft" as const),
      mode: defaultMode,
      overallScore: product.overallScore,
      priorityTier: product.priorityTier,
      tags: [product.category, product.brand.toLowerCase(), "home-organization"],
      keywords: [product.productName, product.visualHook, product.category],
      imageAssetPath: getProductImageAssetPath(product.productKey)
    };

    const imageUrl = withOrigin(base.imageAssetPath, origin);

    return [
      {
        ...base,
        pinId: `lib-${product.productKey}-before-after`,
        pinTitle: `Avant / Après: ${product.productName}`,
        pinDescription: `Avant/après ultra visuel avec ${product.productName}. ${product.visualHook}. Voir le produit sur Amazon.`,
        imageUrl,
        contentAngle: "before_after" as const,
        publishPriority: Math.min(100, product.overallScore + 5)
      },
      {
        ...base,
        pinId: `lib-${product.productKey}-problem-solution`,
        pinTitle: `Problème / Solution: ${product.productName}`,
        pinDescription: `Si tu galères avec ${product.category}, cette solution aide vite: ${product.productName}.`,
        imageUrl,
        contentAngle: "problem_solution" as const,
        publishPriority: product.overallScore
      },
      {
        ...base,
        pinId: `lib-${product.productKey}-aesthetic`,
        pinTitle: `Résultat esthétique avec ${product.brand}`,
        pinDescription: `Objectif rendu final propre et premium: ${product.productName}. ${product.notes}.`,
        imageUrl,
        contentAngle: "aesthetic_result" as const,
        publishPriority: Math.max(40, product.overallScore - 4)
      }
    ];
  });
}

async function ensureStore() {
  const storePath = getLibraryStorePath();
  await fs.mkdir(path.dirname(storePath), { recursive: true });

  try {
    await fs.access(storePath);
  } catch {
    const payload: LibraryStore = {
      version: STORE_VERSION,
      performance: {},
      generatedVariants: [],
      updatedAt: new Date().toISOString()
    };
    await fs.writeFile(storePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  }
}

async function readStore(): Promise<LibraryStore> {
  await ensureStore();
  const storePath = getLibraryStorePath();

  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LibraryStore>;
    return {
      version: STORE_VERSION,
      performance: parsed.performance ?? {},
      generatedVariants: parsed.generatedVariants ?? [],
      updatedAt: parsed.updatedAt ?? new Date().toISOString()
    };
  } catch {
    return {
      version: STORE_VERSION,
      performance: {},
      generatedVariants: [],
      updatedAt: new Date().toISOString()
    };
  }
}

async function writeStore(store: LibraryStore) {
  await ensureStore();
  await fs.writeFile(getLibraryStorePath(), `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function createDefaultPerformance(pinId: string): PinPerformance {
  return {
    pinId,
    impressions: 0,
    clicks: 0,
    outboundClicks: 0,
    saves: 0,
    ctr: 0,
    lastUpdated: new Date().toISOString(),
    performanceLabel: "stable",
    winningPin: false
  };
}

function buildWinnerVariants(pin: LibraryPin, count = 2): LibraryPin[] {
  return Array.from({ length: count }).map((_, index) => ({
    ...pin,
    pinId: `${pin.pinId}-winner-v${index + 1}`,
    pinTitle: `${pin.pinTitle} · Variante #${index + 1}`,
    pinDescription: `${pin.pinDescription} Variante winner ${index + 1} pour retester un angle performant.`,
    contentAngle: "winner_variant",
    publishPriority: Math.min(100, pin.publishPriority + 3 + index),
    performance: createDefaultPerformance(`${pin.pinId}-winner-v${index + 1}`)
  }));
}

function mapToScheduleCategory(category?: PremiumProductCategory) {
  if (category === "pantry" || category === "under_sink" || category === "closet") {
    return category;
  }

  if (category === "entryway") {
    return "shoes" as const;
  }

  return "mix" as const;
}

export async function getPinterestLibraryData(origin?: string) {
  const store = await readStore();
  const products: ProductWithScore[] = premiumProducts.map((product) => {
    const overallScore = computeOverallScore(product);
    return {
      ...product,
      overallScore,
      priorityTier: scoreToTier(overallScore)
    };
  });

  const basePins = makeBasePins(products, origin);
  const pinsWithPerformance: LibraryPin[] = basePins.map((pin) => ({
    ...pin,
    performance: {
      ...createDefaultPerformance(pin.pinId),
      ...(store.performance[pin.pinId] ?? {})
    }
  }));

  const winners = pinsWithPerformance.filter(
    (pin) => pin.performance.winningPin || pin.performance.performanceLabel === "winner"
  );
  const winnerVariants = winners.flatMap((winner) => buildWinnerVariants(winner, 3));

  if (winnerVariants.length > 0) {
    const nextStore: LibraryStore = {
      ...store,
      generatedVariants: [...store.generatedVariants, ...winnerVariants.map((variant) => variant.pinId)],
      updatedAt: new Date().toISOString()
    };
    await writeStore(nextStore);
  }

  const allPins = [...pinsWithPerformance, ...winnerVariants].sort((a, b) => b.publishPriority - a.publishPriority);

  return {
    products,
    pins: allPins,
    config: {
      targetDays: Number(env.PINTEREST_CONTENT_TARGET_DAYS || DEFAULT_TARGET_DAYS),
      pinsPerDay: Number(env.PINTEREST_PINS_PER_DAY || getPinterestDailySlots().length || 3),
      boardId: resolvePinterestLibraryBoardId()
    }
  };
}

export async function updatePinPerformance(input: {
  pinId: string;
  impressions?: number;
  clicks?: number;
  outboundClicks?: number;
  saves?: number;
  publishDate?: string;
  performanceNotes?: string;
  performanceLabel?: "low_performer" | "stable" | "winner";
  winningPin?: boolean;
}) {
  const store = await readStore();
  const current = store.performance[input.pinId] ?? createDefaultPerformance(input.pinId);

  const impressions = input.impressions ?? current.impressions;
  const clicks = input.clicks ?? current.clicks;
  const outboundClicks = input.outboundClicks ?? current.outboundClicks ?? 0;
  const ctr = impressions > 0 ? Number((((clicks + outboundClicks) / impressions) * 100).toFixed(2)) : 0;
  const performanceLabel = input.performanceLabel ?? current.performanceLabel;
  const winningPin = input.winningPin ?? current.winningPin ?? performanceLabel === "winner";

  store.performance[input.pinId] = {
    ...current,
    impressions,
    clicks,
    outboundClicks,
    saves: input.saves ?? current.saves,
    ctr,
    publishDate: input.publishDate ?? current.publishDate,
    performanceNotes: input.performanceNotes ?? current.performanceNotes,
    performanceLabel,
    winningPin,
    lastUpdated: new Date().toISOString()
  };
  store.updatedAt = new Date().toISOString();

  await writeStore(store);

  return store.performance[input.pinId];
}

export function mapLibraryPinsToScheduleItems(
  pins: LibraryPin[],
  products: Array<Pick<ProductWithScore, "productKey" | "category" | "productName" | "amazonUrl"> & { amazonAffiliateUrl?: string }>
): PinterestScheduleItem[] {
  const productMap = new Map(products.map((product) => [product.productKey, product]));

  return pins.map((pin, index) => {
    const product = productMap.get(pin.productKey);
    const link = product?.amazonAffiliateUrl || product?.amazonUrl;
    const boardId = resolvePinterestLibraryBoardId(pin.boardId);
    return {
      id: pin.pinId,
      pinId: pin.pinId,
      pinNumber: 1000 + index,
      productKey: pin.productKey,
      relatedProductKeys: undefined,
      category: mapToScheduleCategory(product?.category),
      internalTitle: product?.productName ?? pin.pinTitle,
      title: pin.pinTitle,
      description: pin.pinDescription,
      imageUrl: pin.imageUrl,
      imageAssetPath: pin.imageAssetPath,
      imageSourceType: "local",
      isFallback: false,
      link,
      boardId,
      status: boardId && link ? "ready" : pin.status,
      mode: pin.mode
    };
  });
}

export function buildLibraryCsv(pins: LibraryPin[]) {
  const header = [
    "pinId",
    "productKey",
    "pinTitle",
    "contentAngle",
    "publishPriority",
    "overallScore",
    "priorityTier",
    "status",
    "mode",
    "impressions",
    "clicks",
    "outboundClicks",
    "ctr",
    "saves",
    "performanceLabel",
    "winningPin"
  ];

  const rows = pins.map((pin) =>
    [
      pin.pinId,
      pin.productKey,
      pin.pinTitle,
      pin.contentAngle,
      pin.publishPriority,
      pin.overallScore,
      pin.priorityTier,
      pin.status,
      pin.mode,
      pin.performance.impressions,
      pin.performance.clicks,
      pin.performance.outboundClicks,
      pin.performance.ctr,
      pin.performance.saves,
      pin.performance.performanceLabel,
      pin.performance.winningPin
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  );

  return [header.join(","), ...rows].join("\n");
}

export function filterLibraryPins(
  pins: LibraryPin[],
  filters: { category?: PremiumProductCategory | "all"; angle?: ContentAngle | "all"; minScore?: number }
) {
  return pins.filter((pin) => {
    if (filters.angle && filters.angle !== "all" && pin.contentAngle !== filters.angle) {
      return false;
    }

    if (typeof filters.minScore === "number" && pin.overallScore < filters.minScore) {
      return false;
    }

    if (!filters.category || filters.category === "all") {
      return true;
    }

    return pin.tags.includes(filters.category);
  });
}

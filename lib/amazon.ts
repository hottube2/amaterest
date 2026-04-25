import { env } from "@/lib/env";

export type AmazonCategory = "drawer" | "under_sink" | "pantry" | "closet" | "shoes";

export type AmazonProduct = {
  id: string;
  category: AmazonCategory;
  slot: 1 | 2;
  name: string;
  rawUrl?: string;
  url?: string;
  marketplace: string;
  currency: string;
};

const productCatalog: Array<Omit<AmazonProduct, "rawUrl" | "url" | "marketplace" | "currency"> & { envKey: keyof typeof env }> =
  [
    { id: "drawer_1", category: "drawer", slot: 1, name: "Vtopmart 25 PCS Clear Drawer Organizer", envKey: "AMAZON_PRODUCT_URL_DRAWER_1" },
    { id: "drawer_2", category: "drawer", slot: 2, name: "Amazon Basics 6-Pack Cloth Drawer Organizer Boxes", envKey: "AMAZON_PRODUCT_URL_DRAWER_2" },
    { id: "under_sink_1", category: "under_sink", slot: 1, name: "Vtopmart 2 Tier Under Sink Organizer", envKey: "AMAZON_PRODUCT_URL_UNDER_SINK_1" },
    { id: "under_sink_2", category: "under_sink", slot: 2, name: "Sevenblue 2 Pack Under Sink Organizer", envKey: "AMAZON_PRODUCT_URL_UNDER_SINK_2" },
    { id: "pantry_1", category: "pantry", slot: 1, name: "Rubbermaid Brilliance Food Storage Containers", envKey: "AMAZON_PRODUCT_URL_PANTRY_1" },
    { id: "pantry_2", category: "pantry", slot: 2, name: "Vtopmart 24 pcs Pantry Storage Containers", envKey: "AMAZON_PRODUCT_URL_PANTRY_2" },
    { id: "closet_1", category: "closet", slot: 1, name: "Amazon Basics Extra Wide Fabric 5-Drawer Storage Organizer", envKey: "AMAZON_PRODUCT_URL_CLOSET_1" },
    { id: "closet_2", category: "closet", slot: 2, name: "YOUDENOVA Hanging Closet Organizer", envKey: "AMAZON_PRODUCT_URL_CLOSET_2" },
    { id: "shoes_1", category: "shoes", slot: 1, name: "Kitsure Shoe Rack", envKey: "AMAZON_PRODUCT_URL_SHOES_1" },
    { id: "shoes_2", category: "shoes", slot: 2, name: "SONGMICS Shoe Rack Bench", envKey: "AMAZON_PRODUCT_URL_SHOES_2" }
  ];

export function attachAssociateTag(url: string) {
  const associateTag = env.AMAZON_ASSOCIATE_TAG;

  if (!associateTag) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname === "amzn.to") {
      return url;
    }

    if (!parsedUrl.hostname.includes("amazon.")) {
      return url;
    }

    parsedUrl.searchParams.set("tag", associateTag);
    return parsedUrl.toString();
  } catch {
    return url;
  }
}

export function getAmazonProducts(): AmazonProduct[] {
  return productCatalog.map((product) => {
    const rawUrl = env[product.envKey];

    return {
      id: product.id,
      category: product.category,
      slot: product.slot,
      name: product.name,
      rawUrl,
      url: rawUrl ? attachAssociateTag(rawUrl) : undefined,
      marketplace: env.AMAZON_MARKETPLACE,
      currency: env.AMAZON_DEFAULT_CURRENCY
    };
  });
}

export function getAmazonProductByCategory(category: AmazonCategory) {
  return getAmazonProducts().filter((product) => product.category === category);
}

export function getDefaultAmazonTestLink() {
  return getAmazonProducts().find((product) => product.url)?.url;
}

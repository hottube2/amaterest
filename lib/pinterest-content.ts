import fs from "node:fs";
import path from "node:path";

import { getAmazonProducts, type AmazonCategory } from "@/lib/amazon";
import { env } from "@/lib/env";

export type PinterestLaunchProductKey =
  | "drawer_1"
  | "drawer_2"
  | "under_sink_1"
  | "under_sink_2"
  | "pantry_1"
  | "pantry_2"
  | "closet_1"
  | "closet_2"
  | "shoes_1"
  | "shoes_2";

export type PinterestLaunchPinProductKey = PinterestLaunchProductKey | "mix_top_products";
export type PinterestLaunchImageSourceType = "local" | "fallback" | "test";
export type PinterestLaunchStatus =
  | "ready"
  | "dry-run ok"
  | "publish blocked"
  | "published"
  | "error";
export type PinterestLaunchMode = "dryRun" | "publish";

export type PinterestCatalogProduct = {
  productKey: PinterestLaunchProductKey;
  category: AmazonCategory;
  amazonUrl?: string;
  internalTitle: string;
  pinTitle: string;
  pinDescription: string;
  imageUrl: string;
  imageAssetPath: string;
  imageSourceType: PinterestLaunchImageSourceType;
  isFallback: boolean;
  boardId: string;
  status: PinterestLaunchStatus;
  mode: PinterestLaunchMode;
};

export type PreparedPinterestLaunchPin = {
  pinId: string;
  order: number;
  productKey: PinterestLaunchPinProductKey;
  relatedProductKeys?: PinterestLaunchProductKey[];
  category: AmazonCategory | "mix";
  amazonUrl?: string;
  internalTitle: string;
  pinTitle: string;
  pinDescription: string;
  imageUrl: string;
  imageAssetPath: string;
  imageSourceType: PinterestLaunchImageSourceType;
  isFallback: boolean;
  boardId: string;
  status: PinterestLaunchStatus;
  mode: PinterestLaunchMode;
};

const launchProductMeta: Record<
  PinterestLaunchProductKey,
  {
    internalTitle: string;
    pinTitle: string;
    pinDescription: string;
  }
> = {
  drawer_1: {
    internalTitle: "Clear drawer organizers",
    pinTitle: "Rangements transparents pour tiroirs",
    pinDescription:
      "Des compartiments simples pour garder les petits objets visibles et faciles a retrouver. Voir le produit."
  },
  drawer_2: {
    internalTitle: "Fabric drawer boxes",
    pinTitle: "Boites souples pour tiroirs",
    pinDescription:
      "Une solution rapide pour separer sous-vetements, accessoires ou petits textiles sans encombrer. Voir le produit."
  },
  under_sink_1: {
    internalTitle: "2-tier under sink rack",
    pinTitle: "Rangement sous evier 2 niveaux",
    pinDescription:
      "Un format vertical pratique pour exploiter la hauteur et calmer le desordre sous l'evier. Voir le produit."
  },
  under_sink_2: {
    internalTitle: "Compact under sink set",
    pinTitle: "Petit rangement sous evier",
    pinDescription:
      "Une facon simple de mieux separer produits menagers, eponges et accessoires du quotidien. Voir le produit."
  },
  pantry_1: {
    internalTitle: "Clear pantry containers",
    pinTitle: "Contenants clairs pour garde-manger",
    pinDescription:
      "Un garde-manger plus lisible aide a voir ce qu'il reste et a garder la cuisine plus nette. Voir le produit."
  },
  pantry_2: {
    internalTitle: "Stackable pantry set",
    pinTitle: "Set empilable pour cuisine",
    pinDescription:
      "Des contenants simples et empilables pour une cuisine plus ordonnee et plus facile a entretenir. Voir le produit."
  },
  closet_1: {
    internalTitle: "5-drawer closet organizer",
    pinTitle: "Organisateur 5 tiroirs pour placard",
    pinDescription:
      "Une structure verticale qui aide a ranger plus proprement les petits espaces et les garde-robes. Voir le produit."
  },
  closet_2: {
    internalTitle: "Hanging closet organizer",
    pinTitle: "Rangement suspendu pour penderie",
    pinDescription:
      "Une option facile pour gagner des sections utiles sans refaire tout le placard. Voir le produit."
  },
  shoes_1: {
    internalTitle: "Open shoe rack",
    pinTitle: "Range-chaussures simple",
    pinDescription:
      "Un rangement d'entree qui aide a limiter le bazar visuel et a garder les paires accessibles. Voir le produit."
  },
  shoes_2: {
    internalTitle: "Shoe bench rack",
    pinTitle: "Banc range-chaussures",
    pinDescription:
      "Un banc compact avec rangement integre pour rendre l'entree plus pratique au quotidien. Voir le produit."
  }
};

const launchPinContent: Array<{
  pinId: string;
  order: number;
  productKey: PinterestLaunchPinProductKey;
  relatedProductKeys?: PinterestLaunchProductKey[];
  category: AmazonCategory | "mix";
  internalTitle: string;
  pinTitle: string;
  pinDescription: string;
  imageAssetName: string;
}> = [
  {
    pinId: "pin_1",
    order: 1,
    productKey: "drawer_1",
    category: "drawer",
    internalTitle: "Drawer chaos reset",
    pinTitle: "Ce tiroir était un cauchemar… regarde ça 😳",
    pinDescription:
      "Des compartiments simples peuvent rendre un tiroir plus clair et plus facile à utiliser chaque jour. Voir le produit.",
    imageAssetName: "pin-01"
  },
  {
    pinId: "pin_2",
    order: 2,
    productKey: "under_sink_1",
    category: "under_sink",
    internalTitle: "Under-sink clutter fix",
    pinTitle: "Le coin le plus chaotique de la maison 😬",
    pinDescription:
      "Sous l’évier, un rangement vertical aide à mieux séparer les produits et à retrouver plus vite ce qu’il faut. Voir le produit.",
    imageAssetName: "pin-02"
  },
  {
    pinId: "pin_3",
    order: 3,
    productKey: "pantry_1",
    category: "pantry",
    internalTitle: "Clean pantry look",
    pinTitle: "Une cuisine simple et propre, ça change tout 😍",
    pinDescription:
      "Quelques contenants bien choisis peuvent rendre une cuisine plus nette et plus agréable à utiliser. Voir le produit.",
    imageAssetName: "pin-03"
  },
  {
    pinId: "pin_4",
    order: 4,
    productKey: "mix_top_products",
    relatedProductKeys: ["drawer_1", "under_sink_1", "pantry_1", "closet_1", "shoes_1"],
    category: "mix",
    internalTitle: "Top 5 home organizers",
    pinTitle: "5 produits simples qui améliorent une maison",
    pinDescription:
      "Du tiroir à l’entrée, voici 5 produits simples pour rendre les petits espaces plus faciles à garder en ordre. Voir la sélection.",
    imageAssetName: "pin-04"
  },
  {
    pinId: "pin_5",
    order: 5,
    productKey: "closet_1",
    category: "closet",
    internalTitle: "Small closet structure",
    pinTitle: "Petit espace = vite désorganisé 😤",
    pinDescription:
      "Quand l’espace manque, une structure verticale aide vite à remettre un peu d’ordre sans tout refaire. Voir le produit.",
    imageAssetName: "pin-05"
  },
  {
    pinId: "pin_6",
    order: 6,
    productKey: "shoes_1",
    category: "shoes",
    internalTitle: "Entry shoe control",
    pinTitle: "L’entrée peut vite devenir un désordre total 😂",
    pinDescription:
      "Un rangement ouvert pour chaussures peut calmer l’entrée et rendre les allers-retours plus simples. Voir le produit.",
    imageAssetName: "pin-06"
  },
  {
    pinId: "pin_7",
    order: 7,
    productKey: "drawer_2",
    category: "drawer",
    internalTitle: "Soft drawer organizer",
    pinTitle: "Un petit produit qui change beaucoup",
    pinDescription:
      "Un organisateur discret peut aider à garder les choses triées, visibles et faciles à remettre à leur place. Voir le produit.",
    imageAssetName: "pin-07"
  },
  {
    pinId: "pin_8",
    order: 8,
    productKey: "under_sink_2",
    category: "under_sink",
    internalTitle: "Simple under-sink reset",
    pinTitle: "Une maison organisée, c’est plus simple",
    pinDescription:
      "Un petit rangement sous l’évier peut rendre le coin ménage plus lisible et plus pratique au quotidien. Voir le produit.",
    imageAssetName: "pin-08"
  },
  {
    pinId: "pin_9",
    order: 9,
    productKey: "under_sink_1",
    category: "under_sink",
    internalTitle: "Messy cleaning corner fix",
    pinTitle: "Si ça ressemble à ça… il y a une solution",
    pinDescription:
      "Quand le coin entretien s’accumule, un système simple peut remettre un peu d’ordre sans compliquer la routine. Voir le produit.",
    imageAssetName: "pin-09"
  },
  {
    pinId: "pin_10",
    order: 10,
    productKey: "pantry_2",
    category: "pantry",
    internalTitle: "Satisfying pantry containers",
    pinTitle: "C’est simple… mais très satisfaisant 😍",
    pinDescription:
      "Des contenants propres et empilables peuvent rendre le garde-manger plus net en un coup d’œil. Voir le produit.",
    imageAssetName: "pin-10"
  }
];

function getLaunchMode(): PinterestLaunchMode {
  return env.PINTEREST_ENABLE_PUBLISH === "true" ? "publish" : "dryRun";
}

export function getPinterestLaunchBoardId() {
  return env.PINTEREST_LAUNCH_BOARD_ID || env.PINTEREST_TEST_BOARD_ID || "";
}

function getPublicLaunchAssetPath(assetBaseName: string) {
  const assetDirectory = path.join(process.cwd(), "public", "pinterest-launch");
  const supportedExtensions = ["png", "jpg", "jpeg", "webp"];

  for (const extension of supportedExtensions) {
    const absolutePath = path.join(assetDirectory, `${assetBaseName}.${extension}`);

    if (fs.existsSync(absolutePath)) {
      return `/pinterest-launch/${assetBaseName}.${extension}`;
    }
  }

  return null;
}

function withOrigin(assetPath: string, origin?: string) {
  return origin ? new URL(assetPath, origin).toString() : assetPath;
}

function resolveLaunchImage(assetBaseName: string, origin?: string) {
  const specificAsset = getPublicLaunchAssetPath(assetBaseName);

  if (specificAsset) {
    return {
      imageUrl: withOrigin(specificAsset, origin),
      imageAssetPath: specificAsset,
      imageSourceType: "local" as const,
      isFallback: false
    };
  }

  if (env.PINTEREST_FALLBACK_IMAGE_URL) {
    return {
      imageUrl: env.PINTEREST_FALLBACK_IMAGE_URL,
      imageAssetPath: env.PINTEREST_FALLBACK_IMAGE_URL,
      imageSourceType: "fallback" as const,
      isFallback: true
    };
  }

  if (env.PINTEREST_TEST_IMAGE_URL) {
    return {
      imageUrl: env.PINTEREST_TEST_IMAGE_URL,
      imageAssetPath: env.PINTEREST_TEST_IMAGE_URL,
      imageSourceType: "test" as const,
      isFallback: true
    };
  }

  return {
    imageUrl: withOrigin("/icon-512.png", origin),
    imageAssetPath: "/icon-512.png",
    imageSourceType: "fallback" as const,
    isFallback: true
  };
}

function getProductMap() {
  return new Map(
    getAmazonProducts()
      .filter((product): product is typeof product & { id: PinterestLaunchProductKey } =>
        Boolean(launchProductMeta[product.id as PinterestLaunchProductKey])
      )
      .map((product) => [product.id as PinterestLaunchProductKey, product])
  );
}

function getFirstAvailableAmazonUrl(productKeys: PinterestLaunchProductKey[]) {
  const productMap = getProductMap();

  return productKeys
    .map((productKey) => productMap.get(productKey)?.url)
    .find((amazonUrl): amazonUrl is string => Boolean(amazonUrl));
}

export function getPinterestLaunchCatalog(origin?: string): PinterestCatalogProduct[] {
  const productMap = getProductMap();
  const boardId = getPinterestLaunchBoardId();
  const mode = getLaunchMode();
  const productPreviewPin = new Map<PinterestLaunchProductKey, string>([
    ["drawer_1", "pin-01"],
    ["drawer_2", "pin-07"],
    ["under_sink_1", "pin-02"],
    ["under_sink_2", "pin-08"],
    ["pantry_1", "pin-03"],
    ["pantry_2", "pin-10"],
    ["closet_1", "pin-05"],
    ["closet_2", "pin-05"],
    ["shoes_1", "pin-06"],
    ["shoes_2", "pin-06"]
  ]);

  return (Object.keys(launchProductMeta) as PinterestLaunchProductKey[]).map((productKey) => {
    const product = productMap.get(productKey);
    const meta = launchProductMeta[productKey];
    const launchImage = resolveLaunchImage(productPreviewPin.get(productKey) || "pin-01", origin);

    return {
      productKey,
      category: product?.category || "drawer",
      amazonUrl: product?.url,
      internalTitle: meta.internalTitle,
      pinTitle: meta.pinTitle,
      pinDescription: meta.pinDescription,
      imageUrl: launchImage.imageUrl,
      imageAssetPath: launchImage.imageAssetPath,
      imageSourceType: launchImage.imageSourceType,
      isFallback: launchImage.isFallback,
      boardId,
      status: "ready",
      mode
    };
  });
}

export function getPreparedPinterestLaunchPins(origin?: string): PreparedPinterestLaunchPin[] {
  const catalog = getPinterestLaunchCatalog(origin);
  const catalogMap = new Map(catalog.map((product) => [product.productKey, product]));
  const mode = getLaunchMode();
  const boardId = getPinterestLaunchBoardId();

  return launchPinContent.map((pin) => {
    const primaryProduct =
      pin.productKey === "mix_top_products" ? catalogMap.get("drawer_1") : catalogMap.get(pin.productKey);
    const relatedProductKeys = pin.relatedProductKeys;
    const amazonUrl =
      pin.productKey === "mix_top_products"
        ? getFirstAvailableAmazonUrl(relatedProductKeys || [])
        : primaryProduct?.amazonUrl;
    const launchImage = resolveLaunchImage(pin.imageAssetName, origin);

    return {
      pinId: pin.pinId,
      order: pin.order,
      productKey: pin.productKey,
      relatedProductKeys,
      category: pin.category,
      amazonUrl,
      internalTitle: pin.internalTitle,
      pinTitle: pin.pinTitle,
      pinDescription: pin.pinDescription,
      imageUrl: launchImage.imageUrl,
      imageAssetPath: launchImage.imageAssetPath,
      imageSourceType: launchImage.imageSourceType,
      isFallback: launchImage.isFallback,
      boardId: primaryProduct?.boardId || boardId,
      status: "ready",
      mode
    };
  });
}

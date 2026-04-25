import { z } from "zod";

const optionalString = z.string().optional();

const envSchema = z
  .object({
    PINTEREST_APP_ID: optionalString,
    PINTEREST_APP_SECRET: optionalString,
    PINTEREST_REDIRECT_URI: optionalString,
    PINTEREST_ACCESS_TOKEN: optionalString,
    PINTEREST_ENABLE_PUBLISH: optionalString,
    PINTEREST_LAUNCH_BOARD_ID: optionalString,
    PINTEREST_SCHEDULE_TIMEZONE: optionalString,
    PINTEREST_DAILY_SLOTS: optionalString,
    PINTEREST_FALLBACK_IMAGE_URL: optionalString,
    PINTEREST_TEST_BOARD_ID: optionalString,
    PINTEREST_TEST_IMAGE_URL: optionalString,
    AMAZON_ASSOCIATE_TAG: optionalString,
    AMAZON_MARKETPLACE: optionalString,
    AMAZON_DEFAULT_CURRENCY: optionalString,
    AMAZON_PRODUCT_URL_DRAWER_1: optionalString,
    AMAZON_PRODUCT_URL_DRAWER_2: optionalString,
    AMAZON_PRODUCT_URL_UNDER_SINK_1: optionalString,
    AMAZON_PRODUCT_URL_UNDER_SINK_2: optionalString,
    AMAZON_PRODUCT_URL_PANTRY_1: optionalString,
    AMAZON_PRODUCT_URL_PANTRY_2: optionalString,
    AMAZON_PRODUCT_URL_CLOSET_1: optionalString,
    AMAZON_PRODUCT_URL_CLOSET_2: optionalString,
    AMAZON_PRODUCT_URL_SHOES_1: optionalString,
    AMAZON_PRODUCT_URL_SHOES_2: optionalString
  })
  .strict();

function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

const parsedEnv = envSchema.parse({
  PINTEREST_APP_ID: cleanEnvValue(process.env.PINTEREST_APP_ID),
  PINTEREST_APP_SECRET: cleanEnvValue(process.env.PINTEREST_APP_SECRET),
  PINTEREST_REDIRECT_URI: cleanEnvValue(process.env.PINTEREST_REDIRECT_URI),
  PINTEREST_ACCESS_TOKEN: cleanEnvValue(process.env.PINTEREST_ACCESS_TOKEN),
  PINTEREST_ENABLE_PUBLISH: cleanEnvValue(process.env.PINTEREST_ENABLE_PUBLISH),
  PINTEREST_LAUNCH_BOARD_ID: cleanEnvValue(process.env.PINTEREST_LAUNCH_BOARD_ID),
  PINTEREST_SCHEDULE_TIMEZONE: cleanEnvValue(process.env.PINTEREST_SCHEDULE_TIMEZONE),
  PINTEREST_DAILY_SLOTS: cleanEnvValue(process.env.PINTEREST_DAILY_SLOTS),
  PINTEREST_FALLBACK_IMAGE_URL: cleanEnvValue(process.env.PINTEREST_FALLBACK_IMAGE_URL),
  PINTEREST_TEST_BOARD_ID: cleanEnvValue(process.env.PINTEREST_TEST_BOARD_ID),
  PINTEREST_TEST_IMAGE_URL: cleanEnvValue(process.env.PINTEREST_TEST_IMAGE_URL),
  AMAZON_ASSOCIATE_TAG: cleanEnvValue(process.env.AMAZON_ASSOCIATE_TAG),
  AMAZON_MARKETPLACE: cleanEnvValue(process.env.AMAZON_MARKETPLACE),
  AMAZON_DEFAULT_CURRENCY: cleanEnvValue(process.env.AMAZON_DEFAULT_CURRENCY),
  AMAZON_PRODUCT_URL_DRAWER_1: cleanEnvValue(process.env.AMAZON_PRODUCT_URL_DRAWER_1),
  AMAZON_PRODUCT_URL_DRAWER_2: cleanEnvValue(process.env.AMAZON_PRODUCT_URL_DRAWER_2),
  AMAZON_PRODUCT_URL_UNDER_SINK_1: cleanEnvValue(process.env.AMAZON_PRODUCT_URL_UNDER_SINK_1),
  AMAZON_PRODUCT_URL_UNDER_SINK_2: cleanEnvValue(process.env.AMAZON_PRODUCT_URL_UNDER_SINK_2),
  AMAZON_PRODUCT_URL_PANTRY_1: cleanEnvValue(process.env.AMAZON_PRODUCT_URL_PANTRY_1),
  AMAZON_PRODUCT_URL_PANTRY_2: cleanEnvValue(process.env.AMAZON_PRODUCT_URL_PANTRY_2),
  AMAZON_PRODUCT_URL_CLOSET_1: cleanEnvValue(process.env.AMAZON_PRODUCT_URL_CLOSET_1),
  AMAZON_PRODUCT_URL_CLOSET_2: cleanEnvValue(process.env.AMAZON_PRODUCT_URL_CLOSET_2),
  AMAZON_PRODUCT_URL_SHOES_1: cleanEnvValue(process.env.AMAZON_PRODUCT_URL_SHOES_1),
  AMAZON_PRODUCT_URL_SHOES_2: cleanEnvValue(process.env.AMAZON_PRODUCT_URL_SHOES_2)
});

export const env = {
  ...parsedEnv,
  PINTEREST_ENABLE_PUBLISH: parsedEnv.PINTEREST_ENABLE_PUBLISH || "false",
  AMAZON_MARKETPLACE: parsedEnv.AMAZON_MARKETPLACE || "CA",
  AMAZON_DEFAULT_CURRENCY: parsedEnv.AMAZON_DEFAULT_CURRENCY || "CAD"
};

export type EnvKey = keyof typeof env;

export function getRequiredEnv(name: EnvKey) {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing environment variable ${name}. Add it to .env.local before testing this feature.`);
  }

  return value;
}

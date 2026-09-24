import { describe, expect, it } from "vitest";
import { CIRCLE_ERROR_CODE } from "@zikirmatik/shared";
import trCircle from "../../../i18n/locales/tr/circle.json";
import enCircle from "../../../i18n/locales/en/circle.json";

// CIRCLE_ERROR_CODE.* -> circle.json "errors.*" anahtar eşlemesi
// circle-api-client.ts#CIRCLE_ERROR_MESSAGE_KEY ile aynı olmalı.
const CIRCLE_ERROR_MESSAGE_KEY: Record<string, string> = {
  [CIRCLE_ERROR_CODE.PREMIUM_REQUIRED]: "premiumRequired",
  [CIRCLE_ERROR_CODE.NOT_FOUND]: "notFound",
  [CIRCLE_ERROR_CODE.NOT_ACTIVE]: "notActive",
  [CIRCLE_ERROR_CODE.FULL]: "full",
  [CIRCLE_ERROR_CODE.MAX_ACTIVE]: "maxActive",
  [CIRCLE_ERROR_CODE.NOT_MEMBER]: "notMember",
  [CIRCLE_ERROR_CODE.DHIKR_MISMATCH]: "dhikrMismatch",
  [CIRCLE_ERROR_CODE.CREATOR_ONLY]: "creatorOnly"
};

describe("circle error code i18n key coverage", () => {
  it.each(Object.values(CIRCLE_ERROR_CODE))("has a tr and en errors.* key for %s", (code) => {
    const key = CIRCLE_ERROR_MESSAGE_KEY[code];
    expect(key).toBeDefined();
    expect((trCircle.errors as Record<string, string>)[key!]).toBeTypeOf("string");
    expect((enCircle.errors as Record<string, string>)[key!]).toBeTypeOf("string");
  });
});

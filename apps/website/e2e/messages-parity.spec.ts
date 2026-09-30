import { test, expect } from "@playwright/test";
import en from "../src/messages/en.json";
import tr from "../src/messages/tr.json";

function keys(value: unknown, prefix = ""): string[] {
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => keys(v, `${prefix}${k}.`));
  }
  return [prefix.slice(0, -1)];
}

test("en.json and tr.json have identical key sets", () => {
  expect(keys(en).sort()).toEqual(keys(tr).sort());
});

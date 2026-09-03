import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, locales } from "./index";

describe("i18n", () => {
  it("defaults to English", () => {
    expect(defaultLocale).toBe("en");
  });

  it("contains both locales", () => {
    expect(locales).toEqual(["en", "es"]);
  });

  it("recognizes valid locales", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
});

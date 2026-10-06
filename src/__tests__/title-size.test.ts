import { describe, expect, it } from "vitest";
import { titleWidth, tonightTitleSize } from "@/lib/title-size";

describe("titleWidth", () => {
  it("全形字算 1、半形字算 0.55", () => {
    expect(titleWidth("寄生上流")).toBe(4);
    expect(titleWidth("Up")).toBeCloseTo(1.1);
    expect(titleWidth("殺手：零")).toBe(4);
  });
});

describe("tonightTitleSize", () => {
  it("短片名放大一檔", () => {
    expect(tonightTitleSize("寄生上流")).toContain("6.25rem");
    expect(tonightTitleSize("Parasite")).toContain("6.25rem");
    expect(tonightTitleSize("瞬息全宇宙")).toContain("6.25rem");
  });

  it("中等長度維持原本字級", () => {
    expect(tonightTitleSize("神鬼認證：最後通牒")).toContain("4.75rem");
    expect(tonightTitleSize("The Godfather")).toContain("4.75rem");
  });

  it("長片名縮一檔，避免斷成三四行", () => {
    expect(
      tonightTitleSize("Everything Everywhere All at Once"),
    ).toContain("3.5rem");
    expect(tonightTitleSize("魔戒首部曲：魔戒現身（加長版）")).toContain("3.5rem");
  });
});

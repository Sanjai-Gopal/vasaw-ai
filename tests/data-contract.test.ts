import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime, formatRelative, formatTime } from "@/lib/utils";
import { getLeads } from "@/lib/data/leads";
import { getWebsites } from "@/lib/data/websites";
import { getMessages } from "@/lib/data/messages";

describe("Frontend Data Contract & Utility Formatting", () => {
  describe("Date Utility Formatters Robustness", () => {
    it("should safely format valid ISO string", () => {
      const result = formatDate("2026-08-28T10:00:00.000Z");
      expect(result).not.toBe("—");
      expect(result).not.toBe("Invalid Date");
    });

    it("should safely format valid Date object", () => {
      const date = new Date(2026, 7, 28);
      const result = formatDate(date);
      expect(result).not.toBe("—");
      expect(result).not.toBe("Invalid Date");
    });

    it("should safely return fallback for undefined, null, and empty string without throwing", () => {
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate(null)).toBe("—");
      expect(formatDate("")).toBe("—");

      expect(formatDateTime(undefined)).toBe("—");
      expect(formatDateTime(null)).toBe("—");
      expect(formatDateTime("")).toBe("—");

      expect(formatRelative(undefined)).toBe("—");
      expect(formatRelative(null)).toBe("—");
      expect(formatRelative("")).toBe("—");

      expect(formatTime(undefined)).toBe("—");
      expect(formatTime(null)).toBe("—");
      expect(formatTime("")).toBe("—");
    });

    it("should safely return fallback for invalid date strings without throwing", () => {
      expect(formatDate("not-a-valid-date")).toBe("—");
      expect(formatDateTime("invalid-timestamp")).toBe("—");
      expect(formatRelative("gibberish")).toBe("—");
      expect(formatTime("invalid-time")).toBe("—");
    });
  });

  describe("API Data Layer Contract Mapping", () => {
    it("should export getLeads, getWebsites, getMessages helper functions", () => {
      expect(typeof getLeads).toBe("function");
      expect(typeof getWebsites).toBe("function");
      expect(typeof getMessages).toBe("function");
    });
  });
});

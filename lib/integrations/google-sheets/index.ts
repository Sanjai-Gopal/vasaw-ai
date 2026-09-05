import { GoogleSheetsProvider } from "./provider";
import { MockGoogleSheetsProvider } from "./mock-provider";
import { GoogleSheetsApiProvider } from "./api-provider";

export * from "./types";
export * from "./provider";
export * from "./mock-provider";
export * from "./api-provider";

export function getGoogleSheetsProvider(mode: "mock" | "real" = "mock"): GoogleSheetsProvider {
  if (mode === "real") {
    return new GoogleSheetsApiProvider();
  }
  return new MockGoogleSheetsProvider();
}

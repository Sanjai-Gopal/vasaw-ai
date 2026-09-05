import * as crypto from "crypto";

export interface GoogleServiceAccountCredentials {
  clientEmail: string;
  privateKey: string;
}

/**
 * Creates a signed Google OAuth2 JWT for Google Sheets API scope.
 */
function createGoogleJwt(credentials: GoogleServiceAccountCredentials): string {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: credentials.clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const base64Claim = Buffer.from(JSON.stringify(claimSet)).toString("base64url");
  const signatureInput = `${base64Header}.${base64Claim}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signatureInput);

  // Normalize PEM format (replace escaped newlines if passed in single-line env)
  let pemKey = credentials.privateKey;
  if (!pemKey.includes("\n") && pemKey.includes("\\n")) {
    pemKey = pemKey.replace(/\\n/g, "\n");
  }

  const signature = signer.sign(pemKey, "base64url");
  return `${signatureInput}.${signature}`;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Exchanges JWT for a short-lived Google Access Token.
 */
export async function getGoogleAccessToken(credentials: GoogleServiceAccountCredentials): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60000) {
    return cachedAccessToken.token;
  }

  const jwt = createGoogleJwt(credentials);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Failed to obtain Google OAuth2 token: HTTP ${res.status} - ${errorText}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Appends row values to a Google Sheet range.
 */
export async function appendSheetValues(
  credentials: GoogleServiceAccountCredentials,
  spreadsheetId: string,
  range: string,
  values: unknown[][]
): Promise<{ updatedRange: string; updatedRows: number }> {
  const token = await getGoogleAccessToken(credentials);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range,
      majorDimension: "ROWS",
      values,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Google Sheets append failed (HTTP ${res.status}): ${errText}`);
  }

  const data = (await res.json()) as {
    updates?: { updatedRange?: string; updatedRows?: number };
  };

  return {
    updatedRange: data.updates?.updatedRange || range,
    updatedRows: data.updates?.updatedRows || values.length,
  };
}

/**
 * Checks spreadsheet connection and tab existence.
 */
export async function testSpreadsheetConnection(
  credentials: GoogleServiceAccountCredentials,
  spreadsheetId: string
): Promise<{ success: boolean; title?: string; sheets?: string[]; error?: string }> {
  try {
    const token = await getGoogleAccessToken(credentials);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=properties.title,sheets.properties.title`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        success: false,
        error: `Google Sheets API error HTTP ${res.status}: ${errText}`,
      };
    }

    const data = (await res.json()) as {
      properties?: { title?: string };
      sheets?: Array<{ properties?: { title?: string } }>;
    };

    return {
      success: true,
      title: data.properties?.title || "Spreadsheet",
      sheets: data.sheets?.map((s) => s.properties?.title || "").filter(Boolean) || [],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

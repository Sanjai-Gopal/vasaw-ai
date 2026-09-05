export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(message: string, status = 500, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  let responseData: unknown = null;

  if (contentType && contentType.includes("application/json")) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      responseData && typeof responseData === "object" && "error" in responseData
        ? String((responseData as { error: unknown }).error)
        : `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, responseData);
  }

  return responseData as T;
}

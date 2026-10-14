/** Fetches `url`; a non-2xx response throws an Error carrying its HTTP `status`. */
export const fetchOrThrow = async (
  url: string,
  source: string,
): Promise<Response> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw Object.assign(
      new Error(
        `${source} request ${url} failed with status ${response.status}: ${await response.text()}`,
      ),
      { status: response.status },
    );
  }
  return response;
};

/** A failure another lookup may get past: a rate limit (429) or an outage (5xx), read from the error's `status`. */
export const isTransient = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return false;
  }
  const { status } = error;
  return typeof status === "number" && (status === 429 || status >= 500);
};

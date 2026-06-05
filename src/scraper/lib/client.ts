const BASE_URL = 'https://lr2ir.com';
const MIN_INTERVAL_MS = 200;
const MAX_BACKOFF_MS = 60_000;
const RATE_LIMIT_PAUSE_MS = 5 * 60 * 1000;

let lastRequestTime = 0;

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await wait(MIN_INTERVAL_MS - elapsed);
  }
  lastRequestTime = Date.now();
}

export async function fetchPage(path: string, maxRetries = 5): Promise<string> {
  let retryCount = 0;
  let backoff = 1000;

  while (true) {
    await throttle();
    const url = `${BASE_URL}${path}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (lr2ir-miuchi scraper)',
      },
    });

    if (response.ok) {
      return response.text();
    }

    if (response.status === 429 || response.status === 503) {
      console.warn(
        `[${response.status}] Rate limited on ${path}. Pausing ${RATE_LIMIT_PAUSE_MS / 1000}s...`,
      );
      await wait(RATE_LIMIT_PAUSE_MS);
      continue;
    }

    retryCount++;
    if (retryCount > maxRetries) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    console.warn(
      `[${response.status}] Retrying ${path} in ${backoff}ms (attempt ${retryCount}/${maxRetries})`,
    );
    await wait(backoff);
    backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
  }
}

export async function fetchJson<T>(path: string, maxRetries = 5): Promise<T> {
  let retryCount = 0;
  let backoff = 1000;

  while (true) {
    await throttle();
    const url = `${BASE_URL}${path}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (lr2ir-miuchi scraper)',
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    if (response.status === 429 || response.status === 503) {
      console.warn(
        `[${response.status}] Rate limited on ${path}. Pausing ${RATE_LIMIT_PAUSE_MS / 1000}s...`,
      );
      await wait(RATE_LIMIT_PAUSE_MS);
      continue;
    }

    retryCount++;
    if (retryCount > maxRetries) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    console.warn(
      `[${response.status}] Retrying ${path} in ${backoff}ms (attempt ${retryCount}/${maxRetries})`,
    );
    await wait(backoff);
    backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
  }
}

export async function fetchBinary(path: string, maxRetries = 5): Promise<Buffer> {
  let retryCount = 0;
  let backoff = 1000;

  while (true) {
    await throttle();
    const url = `${BASE_URL}${path}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (lr2ir-miuchi scraper)',
      },
    });

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    if (response.status === 429 || response.status === 503) {
      console.warn(
        `[${response.status}] Rate limited on ${path}. Pausing ${RATE_LIMIT_PAUSE_MS / 1000}s...`,
      );
      await wait(RATE_LIMIT_PAUSE_MS);
      continue;
    }

    retryCount++;
    if (retryCount > maxRetries) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    console.warn(
      `[${response.status}] Retrying ${path} in ${backoff}ms (attempt ${retryCount}/${maxRetries})`,
    );
    await wait(backoff);
    backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
  }
}

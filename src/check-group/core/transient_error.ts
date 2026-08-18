/**
 * Helpers for surviving GitHub API errors that say nothing about the PR being
 * checked — 5xx during an incident, rate limiting, or a dropped connection.
 */
import * as core from '@actions/core';

/**
 * Several copies of `@octokit/request-error` end up installed side by side, so
 * the class an octokit error is an instance of depends on which copy threw it
 * and `instanceof RequestError` can't be relied on. The `status` property is
 * stable across all of them.
 */
export const httpStatus = (error: unknown): number | undefined => {
  const status = (error as {status?: unknown})?.status;
  return typeof status === 'number' ? status : undefined;
};

const TRANSIENT_NETWORK_CODES = new Set([
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EPIPE',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET'
]);

export const isTransientError = (error: unknown): boolean => {
  const status = httpStatus(error);
  if (status !== undefined) {
    // 408 request timeout, 429 rate/abuse limit, 5xx server or gateway failure
    return status >= 500 || status === 408 || status === 429;
  }
  const code = (error as {code?: unknown})?.code;
  if (typeof code === 'string' && TRANSIENT_NETWORK_CODES.has(code)) {
    return true;
  }
  const message = (error as {message?: unknown})?.message;
  return typeof message === 'string' && /socket hang up|network timeout|request to .* failed/i.test(message);
};

export const describeError = (error: unknown): string => {
  const status = httpStatus(error);
  const message = (error as {message?: unknown})?.message ?? String(error);
  return status === undefined ? `${message}` : `[HTTP ${status}] ${message}`;
};

/**
 * Runs `operation`, retrying it on transient failures. Used for the one-shot
 * calls made before the check loop starts, which have no later poll to fall
 * back on.
 */
export const withTransientRetry = async <T>(
  description: string,
  operation: () => Promise<T>,
  attempts = 5,
  delayMs = 5000
): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= attempts || !isTransientError(error)) {
        throw error;
      }
      const backoffMs = delayMs * attempt;
      core.warning(
        `${description} failed with a transient error, retrying in ${backoffMs / 1000}s`
          + ` (attempt ${attempt}/${attempts}): ${describeError(error)}`
      );
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
};

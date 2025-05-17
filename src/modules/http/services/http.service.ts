"use server";

type Url = `/${string}`;

import { SERVER_API } from "@kristall/http/constants";

import { getCookie, isDev, loadConfig } from "@kristall/http/utils";

import type { KristallConfig, ServerResponse } from "../interfaces";

let config: KristallConfig | null = null;

(async () => {
	config = await loadConfig();
})();

const createHeaders = async (isAuth?: boolean): Promise<HeadersInit> => {
	if (!config) {
		config = await loadConfig();
	}

	const __SESSION_COOKIE__ = config.sessionCookieName as string;
	const __DEFAULT_AUTH_REQUESTS__ = config.defaultAuthRequests as boolean;

	const access_token = await getCookie(__SESSION_COOKIE__);

	if ((isAuth || __DEFAULT_AUTH_REQUESTS__) && !access_token) {
		throw new Error("No access token found");
	}

	return {
		Authorization: `Bearer ${access_token}`,
		Cookie: `session=${access_token}`,
		"Content-Type": "application/json",
	};
};

interface FetchOptions {
	/**
	 * NextJS cache tags
	 */
	tags: string[];
	/**
	 * NextJS cache strategy
	 */
	cache?: RequestCache;
	/**
	 * NextJS revalidation time
	 */
	revalidate?: false | 0 | number | undefined;
	/**
	 * If true, the request **NEEDS** to be authenticated, authorization cookie and header are required
	 * 
	 * You can configure the default behavior by setting `defaultAuthRequests` in your `kristall.config.ts` file,
	 * by default it's `true` and it will throw an error if no access token is found
	 */
	auth?: boolean;
	/**
	 * Retry configuration for failed requests
	 */
	retry?: {
		/**
		 * Number of attempts to retry the request
		 */
		attempts: number;
		/**
		 * Initial delay between retries in milliseconds
		 * @default 1000
		 */
		initialDelay?: number;
		/**
		 * Factor by which the delay increases with each retry (for exponential backoff)
		 * @default 2
		 */
		backoffFactor?: number;
		/**
		 * Maximum delay between retries in milliseconds
		 * @default 30000
		 */
		maxDelay?: number;
		/**
		 * HTTP status codes that should trigger a retry
		 * @default [408, 429, 500, 502, 503, 504]
		 */
		retryableStatusCodes?: number[];
	};
	/** 
	 * @deprecated
	 */
	toJSON?: boolean;
	/**
	 * @deprecated
	 */
	safe?: boolean;
}

/**
 * Helper function to determine if a request should be retried based on the error or response
 */
const shouldRetry = (
	statusCode: number | undefined,
	retryableStatusCodes: number[] = [408, 429, 500, 502, 503, 504]
): boolean => {
	if (!statusCode) return true;
	return retryableStatusCodes.includes(statusCode);
};

/**
 * Calculate delay with exponential backoff
 */
export const calculateDelay = (
	attempt: number,
	initialDelay = 1000,
	backoffFactor = 2,
	maxDelay = 30000
): number => {
	const delay = initialDelay * backoffFactor ** attempt;
	return Math.min(delay, maxDelay);
};

/**
 * Handles retrying a request with exponential backoff
 */
const retryFetch = async <T>(
	fetchFn: () => Promise<ServerResponse<T>>,
	retryConfig: NonNullable<FetchOptions['retry']>,
	url: string
): Promise<ServerResponse<T>> => {
	const {
		attempts,
		initialDelay = 1000,
		backoffFactor = 2,
		maxDelay = 30000,
		retryableStatusCodes = [408, 429, 500, 502, 503, 504]
	} = retryConfig;

	let lastResponse: ServerResponse<T> | null = null;

	for (let attempt = 0; attempt < attempts; attempt++) {
		try {
			const response = await fetchFn();

			if (response.status === 200 || response.status === 201) {
				return response;
			}

			lastResponse = response;

			if (!shouldRetry(response.status, retryableStatusCodes)) {
				isDev && console.log(`⚠️ Request failed with non-retriable status ${response.status}, not retrying: ${url}`);
				return response;
			}

			if (attempt < attempts - 1) {
				const delay = calculateDelay(attempt, initialDelay, backoffFactor, maxDelay);
				isDev && console.log(`🔄 Retrying request (${attempt + 1}/${attempts}) after ${delay}ms: ${url}`);
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		} catch (error: any) {
			lastResponse = {
				message: error?.message ?? "Internal server error",
				status: error?.statusCode ?? error?.status ?? 500,
				data: null as T
			};

			if (attempt < attempts - 1) {
				const delay = calculateDelay(attempt, initialDelay, backoffFactor, maxDelay);
				isDev && console.log(`🔄 Retrying request after error (${attempt + 1}/${attempts}) after ${delay}ms: ${url}`);
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}
	}

	isDev && console.error(`❌ Request failed after ${attempts} attempts: ${url}`);
	return lastResponse as ServerResponse<T>;
};

/**
 * GET request handler
 *
 * Cache is set by {@link https://nextjs.org/docs/app/building-your-application/caching#fetch|NextJS default cache} value `no-store`
 *
 * @param url URL to fetch
 * @param options FetchOptions
 */
export const GET = async <T>(
	url: Url,
	options: FetchOptions = {
		auth: undefined,
		tags: [],
		safe: true,
		cache: undefined,
		revalidate: undefined,
	},
): Promise<ServerResponse<T>> => {
	const { tags, toJSON } = options;

	if (isDev) {
		if (tags.length === 0) {
			console.warn("⚠️ No tags provided for GET request: ", url);
		}
		if (toJSON) {
			console.warn(
				"⚠️ toJSON is deprecated, its not longer necessary on: ",
				url,
			);
		}
		if ("safe" in options) {
			console.warn("⚠️ safe is deprecated, its not longer necessary on: ", url);
		}
	}

	const fetchFn = async (): Promise<ServerResponse<T>> => {
		try {
			const headers = await createHeaders(options?.auth);

			const response = await fetch(`${SERVER_API}${url}`, {
				method: "GET",
				headers,
				next: {
					tags: options?.tags,
					revalidate: options?.revalidate,
				},
				cache: options?.cache,
			});

			if (!response.ok) {
				isDev && console.error("❌ Error fetching data at: ", url);
				try {
					const error = await response.json();
					return {
						message: error.message,
						status: error.statusCode ?? error.status,
						data: null as T,
					};
				} catch (error) {
					return response.text() as any;
				}
			}

			try {
				return response.json();
			} catch (error) {
				return response.text() as any;
			}
		} catch (error: any) {
			return {
				message: error?.message ?? "Internal server error",
				status: error?.statusCode ?? error?.status ?? 500,
				data: null as T,
			};
		}
	};

	if (options?.retry) {
		return retryFetch<T>(fetchFn, options.retry, url.toString());
	}

	return fetchFn();
};

export const POST = async <T, R = unknown>(
	url: Url,
	body: T,
): Promise<ServerResponse<R>> => {
	try {
		const response = await fetch(`${SERVER_API}${url}`, {
			method: "POST",
			headers: await createHeaders(),
			body: JSON.stringify(body),
		});
		if (!body || Object.keys(body).length === 0) {
			isDev && console.warn("⚠️ No data provided for POST request: ", url);
		}
		if (!response.ok) {
			const error = await response.json();
			isDev && console.error("❌ Error pushing data at: ", url);
			return {
				message: error.message,
				status: error.statusCode ?? error.status,
				data: null as R,
			};
		}
		try {
			return response.json();
		} catch (error) {
			return response.text() as any;
		}
	} catch (error: any) {
		return {
			message: error?.message ?? "Internal server error",
			status: error?.statusCode ?? error?.status ?? 500,
			data: null as R,
		};
	}
};

export const PUT = async <T, R = unknown>(
	url: Url,
	body: T,
	{ safe = true } = {
		safe: true,
	},
): Promise<ServerResponse<R>> => {
	try {
		const response = await fetch(`${SERVER_API}${url}`, {
			method: "PUT",
			headers: await createHeaders(),
			body: JSON.stringify(body),
		});
		if (!response.ok) {
			if (!safe) throw new Error(response.statusText);
			const error = await response.json();
			return {
				message: error.message,
				status: error.statusCode ?? error.status,
				data: null as R,
			};
		}
		try {
			return await response.json();
		} catch (error) {
			return response.text() as any;
		}
	}
	catch (error: any) {
		return {
			message: error?.message ?? "Internal server error",
			status: error?.statusCode ?? error?.status ?? 500,
			data: null as R,
		}
	}
};

export const PATCH = async <T, R = unknown>(
	url: Url,
	body: T,
	{ safe = true } = {
		safe: true,
	},
): Promise<ServerResponse<R>> => {
	try {
		const response = await fetch(`${SERVER_API}${url}`, {
			method: "PATCH",
			headers: await createHeaders(),
			body: JSON.stringify(body),
		});
		if (!response.ok) {
			if (!safe) throw new Error(response.statusText);
			const error = await response.json();
			return {
				message: error.message,
				status: error.statusCode ?? error.status,
				data: null as R,
			};
		}
		try {
			return await response.json();
		} catch (error) {
			return response.text() as any;
		}
	}
	catch (error: any) {
		return {
			message: error?.message ?? "Internal server error",
			status: error?.statusCode ?? error?.status ?? 500,
			data: null as R,
		}
	}
};

export const DELETE = async (
	url: Url,
	{ safe = true } = {
		safe: true,
	},
): Promise<ServerResponse<null>> => {
	try {
		const response = await fetch(`${SERVER_API}${url}`, {
			method: "DELETE",
			headers: await createHeaders(),
		});
		if (!response.ok) {
			if (!safe) {
				throw new Error(response.statusText);
			}
			const error = await response.json();
			return {
				message: error.message,
				status: error.statusCode ?? error.status,
				data: null as null,
			};
		}
		return await response.json();
	}
	catch (error: any) {
		return {
			message: error?.message ?? "Internal server error",
			status: error?.statusCode ?? error?.status ?? 500,
			data: null as null,
		}
	}
};

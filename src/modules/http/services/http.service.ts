"use server";

type Url = `/${string}`;

import { SERVER_API } from "@kristall/http/constants";

import { getCookie, isDev } from "@kristall/http/utils";
import type { ServerResponse } from "../interfaces";

const createHeaders = async (): Promise<HeadersInit> => {
	const access_token = await getCookie("session");
	return {
		Authorization: `Bearer ${access_token}`,
		Cookie: `session=${access_token}`,
		"Content-Type": "application/json",
	};
};

interface FetchOptions {
	tags: string[];
	cache?: RequestCache;
	revalidate?: false | 0 | number | undefined;
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
	try {
		const response = await fetch(`${SERVER_API}${url}`, {
			method: "GET",
			headers: await createHeaders(),
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
};

export const PATCH = async <T, R = unknown>(
	url: Url,
	body: T,
	{ safe = true } = {
		safe: true,
	},
): Promise<ServerResponse<R>> => {
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
};

export const DELETE = async (
	url: Url,
	{ safe = true } = {
		safe: true,
	},
): Promise<ServerResponse<null>> => {
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
};

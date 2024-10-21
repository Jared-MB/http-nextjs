"use server";

type Url = `/${string}`;

import { environment } from "@kristall/core/constants";

import { getCookie, isDev } from "@kristall/core/utils";
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
	/**
	 * @deprecated
	 */
	toJSON?: boolean;
}

export const GET = async <T>(
	url: Url,
	options: FetchOptions = {
		tags: [],
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
	}
	const response = await fetch(`${environment.SERVER_API}${url}`, {
		method: "GET",
		headers: await createHeaders(),
		next: {
			tags: options?.tags,
		},
	});
	if (!response.ok) {
		isDev && console.error("❌ Error fetching data at: ", url);
		throw new Error(response.statusText);
	}
	try {
		return response.json();
	} catch (error) {
		return response.text() as any;
	}
};

export const POST = async <T, R = unknown>(
	url: Url,
	body: T,
): Promise<ServerResponse<R>> => {
	const response = await fetch(`${environment.SERVER_API}${url}`, {
		method: "POST",
		headers: await createHeaders(),
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		const error = await response.json();
		return {
			message: error.message,
			status: error.status,
			data: null as R,
		};
	}
	return await response.json();
};

export const PUT = async <T, R = unknown>(
	url: Url,
	body: T,
): Promise<ServerResponse<R>> => {
	const response = await fetch(`${environment.SERVER_API}${url}`, {
		method: "PUT",
		headers: await createHeaders(),
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		throw new Error(response.statusText);
	}
	return await response.json();
};

export const PATCH = async <T, R = unknown>(
	url: Url,
	body: T,
): Promise<ServerResponse<R>> => {
	const response = await fetch(`${environment.SERVER_API}${url}`, {
		method: "PATCH",
		headers: await createHeaders(),
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		throw new Error(response.statusText);
	}
	return await response.json();
};

export const DELETE = async (url: Url): Promise<ServerResponse<null>> => {
	const response = await fetch(`${environment.SERVER_API}${url}`, {
		method: "DELETE",
		headers: await createHeaders(),
	});
	if (!response.ok) {
		throw new Error(response.statusText);
	}
	return await response.json();
};

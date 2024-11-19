import { describe, expect, test, vi } from "vitest";

import { DELETE, GET, PATCH, POST, PUT } from "./http.service";

vi.mock("@kristall/http/utils", () => {
	return {
		isDev: true,
		getCookie: vi.fn((name: string) => "wa"),
	};
});

vi.mock("next/headers", async () => ({
	cookies: vi.fn(() => {
		return {
			get: vi.fn(() => null),
		};
	}),
}));

vi.spyOn(global, "fetch").mockImplementation((url, options) => {
	let data = null;
	if (options?.body) {
		data = JSON.parse(options.body.toString());
	}
	if (url.toString().includes("/success")) {
		return Promise.resolve({
			ok: true,
			json: () =>
				Promise.resolve({
					data: data ?? { success: true },
					message: "Success",
					status: 200,
				}),
			status: 200,
		} as Response);
	}

	if (url.toString().includes("/error")) {
		return Promise.resolve({
			ok: false,
			json: () =>
				Promise.resolve({
					data: null,
					message: "Error",
					status: 500,
				}),
			status: 500,
		} as Response);
	}

	if (url.toString().includes("/text-error")) {
		return Promise.resolve({
			ok: false,
			text: () =>
				Promise.resolve({
					data: null,
					message: "Internal Server Error",
					status: 500,
				}),
		} as unknown as Response);
	}

	if (url.toString().includes("/text")) {
		return Promise.resolve({
			ok: true,
			text: () =>
				Promise.resolve({
					data: "text",
					message: "Success",
					status: 200,
				}),
			status: 200,
		} as unknown as Response);
	}

	return Promise.reject(new Error("Not mocked"));
});

describe("GET", () => {
	test("Should get data successfully", async () => {
		const { data, message, status } = await GET<string>("/success");

		expect(data).toHaveProperty("success");
		expect(message).toBe("Success");
		expect(status).toBe(200);
	});

	test("Should get error data successfully", async () => {
		const { data, message, status } = await GET<string>("/error");

		expect(data).toBeNull();
		expect(message).toBe("Error");
		expect(status).toBe(500);
	});

	test("Should return data text if response is not JSON", async () => {
		const { data, message, status } = await GET<string>("/text");

		expect(data).toBe("text");
		expect(message).toBe("Success");
		expect(status).toBe(200);
	});

	test("Should return null if response is not JSON an something goes wrong on server", async () => {
		const { data, message, status } = await GET<string>("/text-error");

		expect(data).toBeNull();
		expect(message).toBe("Internal Server Error");
		expect(status).toBe(500);
	});
});

describe("POST", () => {
	test("Should post data successfully", async () => {
		const { data, message, status } = await POST("/success", {
			data: "data",
		});

		expect(data).haveOwnProperty("data");
		expect(message).toBe("Success");
		expect(status).toBe(200);
	});

	test("Should post data successfully with no data", async () => {
		const { data, message, status } = await POST("/success", {});

		console.warn(
			"⚠️ Should warn or throw about no data provided for POST request: ",
		);

		expect(data).toMatchObject({});
		expect(message).toBe("Success");
		expect(status).toBe(200);
	});

	test("Should get error data successfully", async () => {
		const { data, message, status } = await POST<string, string>(
			"/error",
			"data",
		);

		expect(data).toBeNull();
		expect(message).toBe("Error");
		expect(status).toBe(500);
	});

	test("Should get data successfully even if data is a string", async () => {
		const { data, message, status } = await POST<string, string>(
			"/text",
			"data",
		);

		expect(data).toBe("text");
		expect(message).toBe("Success");
		expect(status).toBe(200);
	});
});

describe("PUT", () => {
	test("Should put data successfully", async () => {
		const { data, message, status } = await PUT("/success", {
			data: {
				success: true,
			},
		});

		expect(data).haveOwnProperty("data");
		expect(message).toBe("Success");
		expect(status).toBe(200);
	});

	test("Should put data successfully with no data", async () => {
		const { data, message, status } = await PUT("/success", {});

		console.warn(
			"⚠️ Should warn or throw about no data provided for PUT request: ",
		);

		expect(data).toMatchObject({});
		expect(message).toBe("Success");
		expect(status).toBe(200);
	});

	test("Should get error data successfully", async () => {
		const { data, message, status } = await PUT<string, string>(
			"/error",
			"data",
		);

		expect(data).toBeNull();
		expect(message).toBe("Error");
		expect(status).toBe(500);
	});

	test("Should get data successfully even if data is a string", async () => {
		const { data, message, status } = await PUT<string, string>(
			"/text",
			"data",
		);

		expect(data).toBe("text");
		expect(message).toBe("Success");
		expect(status).toBe(200);
	});
});

describe("PATCH", () => {
	test("Should patch data successfully", async () => {
		const { data, message, status } = await PATCH("/success", {
			success: true,
		});

		expect(data).haveOwnProperty("success");
		expect(message).toBe("Success");
		expect(status).toBe(200);
	});

	test("Should patch data successfully with no data", async () => {
		const { data, message, status } = await PATCH("/success", {});

		console.warn(
			"⚠️ Should warn or throw about no data provided for PATCH request: ",
		);

		expect(data).toMatchObject({});
		expect(message).toBe("Success");
		expect(status).toBe(200);
	});

	test("Should get error data successfully", async () => {
		const { data, message, status } = await PATCH<string, string>(
			"/error",
			"data",
		);

		expect(data).toBeNull();
		expect(message).toBe("Error");
		expect(status).toBe(500);
	});

	test("Should get data successfully even if data is a string", async () => {
		const { data, message, status } = await PATCH<string, string>(
			"/text",
			"data",
		);

		expect(data).toBe("text");
		expect(message).toBe("Success");
		expect(status).toBe(200);
	});
});

describe("DELETE", () => {
	test("Should delete data successfully", async () => {
		const { data, message, status } = await DELETE("/success");

		expect(data).haveOwnProperty("success");
		expect(message).toBe("Success");
		expect(status).toBe(200);
	});

	test("Should get error data successfully", async () => {
		const { data, message, status } = await DELETE("/error");

		expect(data).toBeNull();
		expect(message).toBe("Error");
		expect(status).toBe(500);
	});

	test("Should get data successfully even if data is a string", async () => {
		const { data, message, status } = await DELETE("/success");

		expect(data).haveOwnProperty("success");
		expect(message).toBe("Success");
		expect(status).toBe(200);
	});
});

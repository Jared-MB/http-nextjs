import { describe, expect, test, vi } from "vitest";

import { DELETE, GET, PATCH, POST, PUT } from "./http.service";

vi.mock("../../../utils", () => {
    return {
        isDev: true,
        getCookie: vi.fn(async (name: string) => null),
        loadConfig: vi.fn(async () => ({ sessionCookieName: "session", defaultAuthRequests: true })),
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

describe('Authorized requests', () => {
    describe('Should give an error response when there is no session cookie and defaultAuthRequests is true', () => {

        describe("GET", () => {
            test("Should get error data successfully", async () => {
                const { data, message, status } = await GET<string>("/success");

                expect(data).toBeNull();
                expect(message).toBe("No access token found");
                expect(status).toBe(500);
            });
        });

        describe("POST", () => {
            test("Should get error data successfully", async () => {
                const { data, message, status } = await POST("/success", {});

                expect(data).toBeNull();
                expect(message).toBe("No access token found");
                expect(status).toBe(500);
            });
        });

        describe("PUT", () => {
            test("Should get error data successfully", async () => {
                const { data, message, status } = await PUT("/success", {});

                expect(data).toBeNull();
                expect(message).toBe("No access token found");
                expect(status).toBe(500);
            });
        });


        describe("PATCH", () => {
            test("Should get error data successfully", async () => {
                const { data, message, status } = await PATCH("/success", {});

                expect(data).toBeNull();
                expect(message).toBe("No access token found");
                expect(status).toBe(500);
            });
        });

        describe("DELETE", () => {
            test("Should get error data successfully", async () => {
                const { data, message, status } = await DELETE("/success");

                expect(data).toBeNull();
                expect(message).toBe("No access token found");
                expect(status).toBe(500);
            });
        });
    })
})
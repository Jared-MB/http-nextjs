import { cosmiconfig } from "cosmiconfig";
import { TypeScriptLoader } from "cosmiconfig-typescript-loader";

import type { KristallConfig } from "../modules/http/interfaces";

const __MODULE_NAME__ = "kristall";

export const __DEFAULT_CONFIG__: KristallConfig = {
	sessionCookieName: "session",
	defaultAuthRequests: true,
	serverUrl: process.env.SERVER_API,
};

export async function loadConfig(): Promise<KristallConfig> {
	try {
		const explorer = cosmiconfig(__MODULE_NAME__, {
			searchPlaces: [`${__MODULE_NAME__}.config.ts`],
			loaders: {
				".ts": TypeScriptLoader(),
			},
		});

		const result = await explorer.search();

		if (result?.config) {
			return { ...__DEFAULT_CONFIG__, ...result.config };
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.warn(
				`Error al cargar la configuración de ${__MODULE_NAME__}:`,
				error.message,
			);
		} else {
			console.warn(
				`Error al cargar la configuración de ${__MODULE_NAME__}:`,
				error,
			);
		}
	}

	return __DEFAULT_CONFIG__;
}

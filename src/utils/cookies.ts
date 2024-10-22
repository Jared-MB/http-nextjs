"use server";

import { cookies } from "next/headers";

export const getCookie = async (key: string) => {
	const cookie = (await cookies()).get(key);
	return cookie?.value;
};

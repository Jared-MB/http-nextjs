export interface ServerResponse<T> {
	message: string;
	data: T;
	status: number;
}

export type ServiceResponse<T> = Promise<ServerResponse<T>>;

export interface Pagination<T> {
	entities: T[];
	next: number | null;
	previous: number | null;
	page: number;
	hasMore: boolean;
	totalPages: number;
}

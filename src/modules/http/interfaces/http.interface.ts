export interface ServerResponse<T> {
	message: string;
	data: T;
	status: number;
}

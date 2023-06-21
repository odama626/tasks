import type { ZodError } from 'zod';
import { nanoid } from 'nanoid';

export const collectFormData = (callback) => (e) => {
	const data = new FormData(e.target);
	return callback(Object.fromEntries(data.entries()), e);
};

export function convertPbErrorToZod(result) {
	if (result.response.code !== 400) throw result;
	const { data } = result.response;
	return {
		success: false,
		error: {
			issues: Object.entries(data).map(([name, error]) => {
				return {
					path: [name],
					...error
				};
			})
		}
	};
}

export function createId() {
	return nanoid(15);
}

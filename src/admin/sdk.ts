import type {
	CountArgs,
	CreateArgs,
	CreateManyArgs,
	DeleteArgs,
	DeleteManyArgs,
	FindFirstArgs,
	FindManyArgs,
	FindUniqueArgs,
	QueryOptions,
	SelectIncludeOmit,
	SimplifiedPlainResult,
	UpdateArgs,
	UpdateManyArgs,
	UpsertArgs,
} from '@zenstackhq/orm';
import type { GetModels, SchemaDef } from '@zenstackhq/schema';

export type ApiSchema = SchemaDef;
export type ApiModelName<Schema extends ApiSchema = ApiSchema> = Extract<GetModels<Schema>, string>;

export type ApiResult<Schema extends ApiSchema, M extends ApiModelName<Schema>, A> = A extends SelectIncludeOmit<Schema, M, true>
	? SimplifiedPlainResult<Schema, M, A, QueryOptions<Schema>>
	: SimplifiedPlainResult<Schema, M, {}, QueryOptions<Schema>>;

export type FindManyPagination = {
	page?: number;
	limit?: number;
};

export type ApiModelClient<Schema extends ApiSchema, M extends ApiModelName<Schema>> = {
	findMany: <Args extends FindManyArgs<Schema, M>>(args?: Args, pagination?: FindManyPagination) => Promise<ApiResult<Schema, M, Args>[]>;
	findFirst: <Args extends FindFirstArgs<Schema, M>>(args?: Args) => Promise<ApiResult<Schema, M, Args> | null>;
	findUnique: <Args extends FindUniqueArgs<Schema, M>>(args: Args) => Promise<ApiResult<Schema, M, Args> | null>;
	create: <Args extends CreateArgs<Schema, M>>(args: Args) => Promise<ApiResult<Schema, M, Args>>;
	update: <Args extends UpdateArgs<Schema, M>>(args: Args) => Promise<ApiResult<Schema, M, Args>>;
	upsert: <Args extends UpsertArgs<Schema, M>>(args: Args) => Promise<ApiResult<Schema, M, Args>>;
	delete: <Args extends DeleteArgs<Schema, M>>(args: Args) => Promise<void>;
	count: <Args extends CountArgs<Schema, M>>(args?: Args) => Promise<number>;
	createMany: <Args extends CreateManyArgs<Schema, M>>(args: Args) => Promise<{ count: number }>;
	updateMany: <Args extends UpdateManyArgs<Schema, M>>(args: Args) => Promise<{ count: number }>;
	deleteMany: <Args extends DeleteManyArgs<Schema, M>>(args: Args) => Promise<{ count: number }>;
	upload: (file: File, options?: { driver?: string }) => Promise<{ id: string; filename: string; type: string; url: string }>;
};

export type ApiModelsClient<Schema extends ApiSchema = ApiSchema> = {
	[M in ApiModelName<Schema>]: ApiModelClient<Schema, M>;
};

type ListResponse<T> = T[];

type ApiClientOptions<Schema extends ApiSchema> = {
	basePath?: string;
	fetcher?: typeof fetch;
	resolveCollection?: (model: ApiModelName<Schema>) => string;
};

const defaultCollectionResolver = <Schema extends ApiSchema>(model: ApiModelName<Schema>) =>
	model.charAt(0).toLowerCase() + model.slice(1);

export const createApiClient = <Schema extends ApiSchema = ApiSchema>(options: ApiClientOptions<Schema> = {}): ApiModelsClient<Schema> => {
	const basePath = options.basePath ?? '/api';
	const fetcher = options.fetcher ?? fetch;
	const resolveCollection = options.resolveCollection ?? defaultCollectionResolver<Schema>;

	const request = async <T>(url: string, init: RequestInit): Promise<T> => {
		const headers = new Headers(init.headers);

		if (!(init.body instanceof FormData) && !headers.has('content-type')) {
			headers.set('content-type', 'application/json');
		}

		const response = await fetcher(url, {
			...init,
			headers,
		});

		if (!response.ok) {
			let message = `${response.status} ${response.statusText}`;

			try {
				const payload = await response.json();
				if (payload?.error) {
					message = payload.error;
				}
			} catch {
				// Ignore non-JSON error responses.
			}

			throw new ApiRequestError(message, response.status);
		}

		if (response.status === 204) {
			return undefined as T;
		}

		return response.json() as Promise<T>;
	};

	const makeFindManyQuery = <M extends ApiModelName<Schema>>(args: FindManyArgs<Schema, M> = {}, pagination?: FindManyPagination) => {
		const params = new URLSearchParams();

		params.set('q', JSON.stringify(args));

		if (pagination?.limit) {
			params.set('limit', String(pagination.limit));
		}

		if (pagination?.page) {
			params.set('page', String(pagination.page));
		}

		return params.toString();
	};

	const getIdFromWhere = (where: { id?: string } | undefined) => where?.id;

	const requireIdFromWhere = (where: { id?: string } | undefined) => {
		const id = getIdFromWhere(where);
		if (!id) {
			throw new Error('This API client currently supports id-based operations only. Provide where.id.');
		}

		return id;
	};

	const model = <M extends ApiModelName<Schema>>(modelName: M): ApiModelClient<Schema, M> => {
		const collection = resolveCollection(modelName);
		const baseUrl = `${basePath}/${collection}`;

		return {
			findMany: async <Args extends FindManyArgs<Schema, M>>(args?: Args, pagination?: FindManyPagination): Promise<ApiResult<Schema, M, Args>[]> => {
				const response = await request<ListResponse<ApiResult<Schema, M, Args>>>(
					`${baseUrl}?${makeFindManyQuery(args, pagination)}`,
					{ method: 'GET' }
				);

				return response;
			},

			findFirst: async <Args extends FindFirstArgs<Schema, M>>(args?: Args): Promise<ApiResult<Schema, M, Args> | null> => {
				const list = await model(modelName).findMany({ ...(args as object), take: 1 } as FindManyArgs<Schema, M>);
				return (list[0] as ApiResult<Schema, M, Args> | undefined) ?? null;
			},

			findUnique: async <Args extends FindUniqueArgs<Schema, M>>(args: Args): Promise<ApiResult<Schema, M, Args> | null> => {
				const id = getIdFromWhere((args as { where?: { id?: string } }).where);
				if (!id) return null;

				try {
					return await request<ApiResult<Schema, M, Args>>(`${baseUrl}/${id}?${makeFindManyQuery(args)}`, { method: 'GET' });
				} catch (error) {
					if (error instanceof ApiRequestError && error.status === 404) {
						return null;
					}

					throw error;
				}
			},

			create: async <Args extends CreateArgs<Schema, M>>(args: Args): Promise<ApiResult<Schema, M, Args>> => {
				return request<ApiResult<Schema, M, Args>>(baseUrl, {
					method: 'POST',
					body: JSON.stringify(args.data),
				});
			},

			update: async <Args extends UpdateArgs<Schema, M>>(args: Args): Promise<ApiResult<Schema, M, Args>> => {
				const id = requireIdFromWhere((args as { where?: { id?: string } }).where);

				return request<ApiResult<Schema, M, Args>>(`${baseUrl}/${id}`, {
					method: 'PUT',
					body: JSON.stringify(args.data),
				});
			},

			upsert: async <Args extends UpsertArgs<Schema, M>>(args: Args): Promise<ApiResult<Schema, M, Args>> => {
				const id = requireIdFromWhere((args as { where?: { id?: string } }).where);
				const existing = await model(modelName).findUnique({ where: { id } } as FindUniqueArgs<Schema, M>);

				if (existing) {
					return model(modelName).update({ where: { id }, data: args.update } as UpdateArgs<Schema, M>) as Promise<ApiResult<Schema, M, Args>>;
				}

				return model(modelName).create({ data: args.create } as CreateArgs<Schema, M>) as Promise<ApiResult<Schema, M, Args>>;
			},

			delete: async <Args extends DeleteArgs<Schema, M>>(args: Args): Promise<void> => {
				const id = requireIdFromWhere((args as { where?: { id?: string } }).where);
				await request(`${baseUrl}/${id}`, { method: 'DELETE' });
			},

			count: async <Args extends CountArgs<Schema, M>>(args?: Args): Promise<number> => {
				const response = await request<string>(
					`${baseUrl}/count?${makeFindManyQuery({ where: args?.where } as FindManyArgs<Schema, M>)}`,
					{ method: 'GET' }
				);

				return parseInt(response);
			},

			createMany: async <Args extends CreateManyArgs<Schema, M>>(args: Args): Promise<{ count: number }> => {
				const data = (args as { data: unknown | unknown[] }).data;
				const rows = Array.isArray(data) ? data : [data];

				await Promise.all(rows.map((row) => model(modelName).create({ data: row } as CreateArgs<Schema, M>)));
				return { count: rows.length };
			},

			updateMany: async <Args extends UpdateManyArgs<Schema, M>>(args: Args): Promise<{ count: number }> => {
				const rows = await model(modelName).findMany({ where: args.where } as FindManyArgs<Schema, M>);

				await Promise.all(
					rows
						.map((row) => (row as { id?: string }).id)
						.filter((id): id is string => typeof id === 'string' && id.length > 0)
						.map((id) => model(modelName).update({ where: { id }, data: args.data } as UpdateArgs<Schema, M>))
				);

				return { count: rows.length };
			},

			deleteMany: async <Args extends DeleteManyArgs<Schema, M>>(args: Args): Promise<{ count: number }> => {
				const rows = await model(modelName).findMany({ where: args.where } as FindManyArgs<Schema, M>);

				await Promise.all(
					rows
						.map((row) => (row as { id?: string }).id)
						.filter((id): id is string => typeof id === 'string' && id.length > 0)
						.map((id) => model(modelName).delete({ where: { id } } as DeleteArgs<Schema, M>))
				);

				return { count: rows.length };
			},

			async upload(file: File, options?: { driver?: string }) {
				const formData = new FormData();
				formData.set('file', file);
				if (options?.driver) {
					formData.set('driver', options.driver);
				}

				return request<{ id: string; filename: string; type: string; url: string }>(baseUrl, {
					method: 'POST',
					body: formData,
				});
			},
		};
	};

	const models = new Proxy({} as ApiModelsClient<Schema>, {
		get: (_target, modelName) => model(modelName as ApiModelName<Schema>),
	});

	return models;
};

export class ApiRequestError extends Error {
	constructor(
		message: string,
		public readonly status: number
	) {
		super(message);
		this.name = 'ApiRequestError';
	}
}

export const api = createApiClient();

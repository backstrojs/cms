import type { APIContext } from 'astro';
import createStorage from './storage';
import { upperCaseFirst } from '@zenstackhq/common-helpers';
import { Collection } from './collections';
import { Config } from './config';

type CmsCrudContext<TContext extends APIContext = APIContext, TDb = unknown> = TContext & {
	locals: TContext['locals'] & {
		db?: TDb;
	};
	params: Record<string, string | undefined> & {
		all?: string;
		collection: string;
		id?: string;
	};
};

type CmsRouteMatch = {
	collection: string;
	actionOrId?: string;
	id?: string;
};

function notFound() {
	return Response.json({ error: 'Collection not found' }, { status: 404 });
}

function normalizeApiPath(apiPath = '/api/') {
	const trimmedPath = apiPath.trim();
	const pathWithLeadingSlash = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
	const normalizedPath = pathWithLeadingSlash.replace(/\/+$/, '');

	return normalizedPath || '/';
}

function resolveRouteMatch(pathname: string, apiPath = '/api/'): CmsRouteMatch | null {
	const normalizedApiPath = normalizeApiPath(apiPath);
	const relativePath = pathname === normalizedApiPath ? '' : pathname.slice(normalizedApiPath.length);
	const segments = relativePath.split('/').filter(Boolean);

	if (segments.length === 0 || segments.length > 2) {
		return null;
	}

	const [collection, actionOrId] = segments;

	if (!collection) {
		return null;
	}

	return {
		collection,
		actionOrId,
		id: actionOrId && actionOrId !== 'count' ? actionOrId : undefined,
	};
}

function withRouteParams<TContext extends APIContext, TDb>(
	context: TContext,
	routeMatch: CmsRouteMatch,
): CmsCrudContext<TContext, TDb> {
	const routeContext = context as CmsCrudContext<TContext, TDb>;

	return {
		...routeContext,
		params: {
			...(routeContext.params || {}),
			collection: routeMatch.collection,
			id: routeMatch.id,
		},
	};
}

function resolveModel<TContext extends APIContext, TDb>(
	context: CmsCrudContext<TContext, TDb>,
	collections: Record<string, Collection>
) {
	const slug = context.params.collection;
	const modelName = upperCaseFirst(slug);
	const collection = collections[modelName] || Object.values(collections).find(c => c.slug === slug);

	if (!collection) {
		throw new Error(`Model not found for collection: ${collection}`);
	}

	return context.locals.db![collection.name as keyof typeof context.locals.db];
}

const collectionIndexHandlers = {
	GET: async <TContext extends APIContext = APIContext, TDb = unknown>(routeContext: CmsCrudContext<TContext, TDb>, model: any) => {
		const searchParams = new URL(routeContext.url).searchParams;
		const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
		const query = JSON.parse(searchParams.get('q') ?? '{}');

		const data = await model.findMany({ skip: (page - 1) * limit, take: limit, ...query });

		return Response.json(data);
	},
	POST: async <TContext extends APIContext = APIContext, TDb = unknown>(routeContext: CmsCrudContext<TContext, TDb>, model: any, storage: any) => {
		let data;

		if (routeContext.request.headers.get('content-type')?.startsWith('multipart/form-data')) {
			const formData = await routeContext.request.formData();
			const file = formData.get('file');
			const driver = formData.get('driver');

			if (!(file instanceof File)) {
				throw new Error('Missing file upload');
			}

			data = await storage.upload(typeof driver === 'string' ? driver : 'local', file);
		} else {
			data = await routeContext.request.json();
		}

		const created = await model.create({ data });

		return Response.json(created, { status: 201 });
	},
};

const collectionItemHandlers = {
	GET: async <TContext extends APIContext = APIContext, TDb = unknown>(routeContext: CmsCrudContext<TContext, TDb>, model: any) => {
		if (!routeContext.params.id) {
			return notFound();
		}

		const searchParams = new URL(routeContext.url).searchParams;
		const query = JSON.parse(searchParams.get('q') ?? '{}');
		const record = await model.findUnique({ ...query, where: { id: routeContext.params.id } });

		if (!record) {
			return Response.json({ error: 'Not found' }, { status: 404 });
		}

		return Response.json(record);
	},
	PUT: async <TContext extends APIContext = APIContext, TDb = unknown>(routeContext: CmsCrudContext<TContext, TDb>, model: any) => {
		if (!routeContext.params.id) {
			return notFound();
		}

		const data = await routeContext.request.json();
		const updated = await model.update({ where: { id: routeContext.params.id }, data });
		return Response.json(updated);
	},
	DELETE: async <TContext extends APIContext = APIContext, TDb = unknown>(routeContext: CmsCrudContext<TContext, TDb>, model: any) => {
		if (!routeContext.params.id) {
			return notFound();
		}

		await model.delete({ where: { id: routeContext.params.id } });
		return new Response(null, { status: 204 });
	},
};

const collectionCountHandler = async <TContext extends APIContext = APIContext, TDb = unknown>(routeContext: CmsCrudContext<TContext, TDb>, model: any) => {
	const searchParams = new URL(routeContext.url).searchParams;
	const query = JSON.parse(searchParams.get('q') ?? '{}');

	const data = await model.count(query);

	return Response.json(data);
}

export async function restApiHandler<TContext extends APIContext = APIContext, TDb = unknown>(
	config: Config,
	context: TContext,
	collections: Record<string, Collection>
) {
	const routeMatch = resolveRouteMatch(context.url.pathname, config.apiPath || '/api/');
	const storage = createStorage(config);

	if (!routeMatch) {
		return notFound();
	}

	const routeContext = withRouteParams<TContext, TDb>(context, routeMatch);
	const method = context.request.method.toUpperCase();
	const model = resolveModel(routeContext, collections);

	try {
		if (method === 'GET' && routeMatch.actionOrId === 'count') {
			return collectionCountHandler<TContext, TDb>(routeContext, model);
		}

		if (!routeMatch.actionOrId && collectionIndexHandlers[method as keyof typeof collectionIndexHandlers]) {
			return collectionIndexHandlers[method as keyof typeof collectionIndexHandlers]<TContext, TDb>(routeContext, model, storage);
		}

		if (routeMatch.id && collectionItemHandlers[method as keyof typeof collectionItemHandlers]) {
			return collectionItemHandlers[method as keyof typeof collectionItemHandlers]<TContext, TDb>(routeContext, model);
		}
	} catch (error) {
		console.error(error);

		return Response.json(
			{error: error instanceof Error ? error.message : 'Internal error' },
			{ status: 500 }
		);
	}

	return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

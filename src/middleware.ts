import type { APIContext } from 'astro';
import { defineMiddleware } from 'astro:middleware';
import { restApiHandler } from './crud';
import type { defineAuth } from './auth';
import { Config } from './config';
import { Collection } from './collections';
import withContext from './db/api';

type CreateCmsMiddlewareArgs<TContext extends APIContext = APIContext, TDb = unknown> = {
	config: Config;
	auth: ReturnType<typeof defineAuth>;
	collections: Record<string, Collection>;
	db?: TDb;
	apiPath?: string;
	privatePaths?: string[];
	redirectTo?: string;
};

export function createCmsMiddleware<TContext extends APIContext = APIContext, TDb = unknown>({
	config,
	auth,
	collections,
	db,
	apiPath = '/api/',
	privatePaths = ['/admin'],
	redirectTo = '/admin/login',
}: CreateCmsMiddlewareArgs<TContext, TDb>) {
	return defineMiddleware(async (context, next) => {
		const headers = new Headers();

		if (config.cors) {
			const origin = context.request.headers.get("origin");
			const corsOptions: Record<string, any> = config.cors === true ? {
				origin,
				credentials: true,
				maxAge: 86_400,
			} : config.cors;

			corsOptions.methods = corsOptions.methods || 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
			corsOptions.allowedHeaders = corsOptions.allowedHeaders || 'Content-Type,Authorization';

			headers.set("Access-Control-Allow-Origin", corsOptions.origin);

			if (context.request.method === 'OPTIONS') {
				headers.set("Access-Control-Allow-Methods", Array.isArray(corsOptions.methods) ? corsOptions.methods.join(',') : corsOptions.methods);
				headers.set("Access-Control-Allow-Headers", Array.isArray(corsOptions.allowedHeaders) ? corsOptions.allowedHeaders.join(',') : corsOptions.allowedHeaders || 'Content-Type,Authorization');

				if (corsOptions.credentials) {
					headers.set("Access-Control-Allow-Credentials", "true");
				}
				if (corsOptions.maxAge) {
					headers.set("Access-Control-Max-Age", corsOptions.maxAge.toString());
				}

				return new Response(null, { status: 204, headers });
			}
		}

		const session = await auth.api.getSession({
			headers: context.request.headers,
		});

		if (session) {
			context.locals.user = session.user;
			context.locals.session = session.session;
		}

		context.locals.db = withContext(db, context);

		const pathname = context.url.pathname;

		if (pathname.startsWith(auth.options.basePath!)) {
			const forwardedForHeader = 'x-forwarded-for';

			if (!context.request.headers.has(forwardedForHeader) && context.clientAddress) {
				context.request.headers.set(forwardedForHeader, context.clientAddress);
			}

			return auth.handler(context.request);
		}

		if (pathname.startsWith(apiPath)) {
			return restApiHandler(config, context, collections);
		}

		if (privatePaths.includes(pathname) && !session) {
			return context.redirect(redirectTo);
		}

		const response = await next();

		if (config.cors) {
			response.headers.set('Access-Control-Allow-Origin', headers.get('Access-Control-Allow-Origin'));
		}

		return response;
	});
}

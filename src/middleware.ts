import type { APIContext } from 'astro';
import { defineMiddleware } from 'astro:middleware';
import { restApiHandler } from './crud';
import db from './db/api';
import type { defineAuth } from './auth';

	type CreateCmsMiddlewareArgs<TContext extends APIContext = APIContext, TDb = unknown> = {
	auth: ReturnType<typeof defineAuth>;
	apiPath?: string;
	privatePaths?: string[];
	redirectTo?: string;
};

export function createCmsMiddleware<TContext extends APIContext = APIContext, TDb = unknown>({
	auth,
	apiPath = '/api/',
	privatePaths = ['/admin'],
	redirectTo = '/admin/login',
}: CreateCmsMiddlewareArgs<TContext, TDb>) {
	return defineMiddleware(async (context, next) => {
		const session = await auth.api.getSession({
			headers: context.request.headers,
		});

		if (session) {
			context.locals.user = session.user;
			context.locals.session = session.session;
			context.locals.db = db.$setRequest(context as TContext);
		}

		const pathname = context.url.pathname;

		if (pathname.startsWith(auth.options.basePath!)) {
			const forwardedForHeader = 'x-forwarded-for';

			if (!context.request.headers.has(forwardedForHeader) && context.clientAddress) {
				context.request.headers.set(forwardedForHeader, context.clientAddress);
			}

			return auth.handler(context.request);
		}

		if (pathname.startsWith(apiPath)) {
			return restApiHandler(apiPath, context);
		}

		if (privatePaths.includes(pathname) && !session) {
			return context.redirect(redirectTo);
		}

		return next();
	});
}

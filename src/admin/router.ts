import { createRouter, type RouterApi, type Routes } from 'sv-router';
import * as Pages from './pages';

let router: RouterApi<Routes>;

const defineRouter = (routes: Record<string, any> = {}) => {
	router = createRouter({
		'/': Pages.Home,
		'/:collection': Pages.List,
		'/user/:id': Pages.User,
		'/:collection/:id': Pages.Single,
		...routes,
	});
}

defineRouter();

export { router, defineRouter };

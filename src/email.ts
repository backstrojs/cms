import { render} from '@backstro/email/render';
import type Mail from 'nodemailer/lib/mailer';
import { config } from './config';

export const send = async (template: any, data: Record<string, any>, options: Mail.Options) => {
	if (typeof template === 'string') {
		template = await import(/* @vite-ignore */template);
	}

	const html = await render(template, data, { tailwind: config!.email.tailwind });

	await config!.email.transport.sendMail({
		from: config!.email.from,
		...options,
		html,
	})
}


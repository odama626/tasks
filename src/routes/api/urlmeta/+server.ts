import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

function extractHtmlElementAttributes(content = '') {
	return Object.fromEntries(
		[...content.matchAll(/([a-zA-Z].*?)="(.*?)"/g)].map(([_, key, value]) => [key, value])
	);
}

export async function GET(args) {
	let link = args.url.searchParams.get('url');
	if (!link || link.startsWith('mailto:')) return error(404);
	if (!link.includes('://')) link = `https://${link}`;

	const html = await fetch(link, {
		headers: { Range: 'bytes=0-2000', Accept: 'text/html' }
	}).then((r) => r.text());

	const content = [...html.matchAll(/<meta(.+?)>/g)].reduce((result, match) => {
		const content = match[1].trim();
		const attributes = extractHtmlElementAttributes(content);
		result[attributes.property] = String(attributes.content).replace(/\&.+\;/g, '');
		return result;
	}, {});

	content.title = content.title ?? html.match(/<title>(.+?)<\/title>/)?.[1];

	if (!content['og:image']) {
		const favicon = extractHtmlElementAttributes(
			html.match(/<link([\s\d\w=\\\/"':\.\-~?]*?rel="?icon"?[\s\d\w=\\\/"':\.\-~?]*?)>/)?.[1]
		);
		if (favicon.href) content['og:image'] = new URL(favicon.href, link).toString();
	}
	return json(
		{
			href: link,
			title: content['og:title'] ?? content['twitter:title'] ?? content.title,
			description: content['og:description'],
			imageUrl: content['og:image']
		},
		{
			'cache-control': 'max-age=259200'
		}
	);
}

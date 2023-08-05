import { json } from '@sveltejs/kit';

function extractHtmlElementAttributes(content = '') {
	return Object.fromEntries(
		[...content.matchAll(/([a-zA-Z].*?)="(.*?)"/g)].map(([_, key, value]) => [key, value])
	);
}

export async function GET(args) {
	let link = args.url.searchParams.get('url');
	if (!link) return json({ success: 0 })
	if (!link.includes('://')) link = `https://${link}`;

	const html = await fetch(link, { headers: { Range: 'bytes=0-300' } }).then((r) => r.text());

	const content = [...html.matchAll(/<meta(.*?)>/g)].reduce((result, match) => {
		const content = match[1].trim();
		const attributes = extractHtmlElementAttributes(content);
		result[attributes.property] = attributes.content;
		return result;
	}, {});

	if (!content['og:image']) {
		const favicon = extractHtmlElementAttributes(
			html.match(/<link([\s\d\w=\\\/"':\.\-~?]*?rel="icon"[\s\d\w=\\\/"':\.\-~?]*?)>/)?.[0]
		);
		content['og:image'] = new URL(favicon.href, link).toString();
	}
	return json({
		success: 1,
		link,
		meta: {
			...content,
			url: link,
			title: content['og:title'],
			description: content['og:description'],
			image: {
				url: content['og:image']
			}
		},
		html
	});
}

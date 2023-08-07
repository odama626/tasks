import PocketBase from 'pocketbase';
import 'dotenv/config';
import { Collections } from '$lib/db.types';
import { error, type Actions } from '@sveltejs/kit';
import { pick } from 'lodash-es';
import { getHash } from '$lib/utils';

export let ssr = true;
export let csr = false;

const pb = new PocketBase(import.meta.env.VITE_SERVER_URL);

const allowedFields = [
	'expand.createdBy.name',
	'expand.createdBy.username',
	'expand.project.name',
	'expand.doc.title'
];

export async function load({ params, url, ...rest }) {
	const admin = await pb.admins.authWithPassword(
		process.env.POCKETBASE_SERVICE_USER,
		process.env.POCKETBASE_SERVICE_PASSWORD
	);

	const invite = await pb.collection(Collections.Invites).getOne(params.invite, {
		expand: 'createdBy,project,document',
		fields: 'id,secret, expand.createdBy.name,expand.createdBy.username, expand.project.name,'
	});

	const newHash = await getHash(pick(invite, ['id', 'secret']));
	const hash = url.searchParams.get('hash');

	const valid = newHash === hash;

	if (!valid) throw error(404, 'Not Found');

	const record = invite.export();

	return {
		...record.expand,
		inviteId: params.invite,
		hash
	};
}

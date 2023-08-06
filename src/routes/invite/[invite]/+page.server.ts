import PocketBase from 'pocketbase';
import 'dotenv/config';
import { Collections } from '$lib/db.types';
import type { Actions } from '@sveltejs/kit';

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
		fields: 'expand.createdBy.name,expand.createdBy.username, expand.project.name,'
	});

	console.log({ params, rest });
	console.log(url.searchParams);

	const record = invite.export();

	return {
		...record.export,
		inviteId: params.invite,
		hash: url.searchParams.get('phrase')
	};
}

export const actions = {
	async accept(event) {
		// TODO: need to ensure logged in first
		console.log({ event });
	}
} satisfies Actions;

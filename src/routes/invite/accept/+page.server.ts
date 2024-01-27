import PocketBase, { type RecordQueryParams } from 'pocketbase';
import 'dotenv/config';
import {
	Collections,
	type InvitesRecord,
	type InvitesResponse,
	type UsersResponse
} from '$lib/db.types';
import { getHash } from '$lib/utils';
import { pick } from 'lodash-es';
import type { ValueOf } from '$lib/modelEvent';
import { error, redirect } from '@sveltejs/kit';

const pb = new PocketBase(import.meta.env.VITE_SERVER_URL);

async function acceptInvite(
	invite: InvitesRecord,
	user: UsersResponse,
	collection: ValueOf<Collections>,
	field: keyof InvitesRecord,
	queryParams?: RecordQueryParams
) {
	const results = await pb
		.collection(collection as string)
		.getList(0, 1, { filter: `user = "${user.id}" && ${field} = "${invite[field]}"` });
	if (results.totalItems)
		return { message: `You've already accepted this invite`, record: results.items[0] };

	const record = await pb.collection(collection as string).create(
		{
			[field]: invite[field],
			user: user.id,
			access: invite.access
		},
		queryParams
	);

	return {
		record,
		message: `Successfully joined`
	};
}

export async function load({ params, url, cookies }) {
	const { token, record: user } = JSON.parse(cookies.get('auth'));
	pb.authStore.save(token, user);

	// this shouldn't be possible, layout should ensure authenticated
	if (!pb.authStore.isValid) return error(401, 'Not Authorized');
	pb.authStore.clear();

	await pb.admins.authWithPassword(
		process.env.POCKETBASE_SERVICE_USER,
		process.env.POCKETBASE_SERVICE_PASSWORD
	);
	const invite = await pb
		.collection(Collections.Invites)
		.getOne<InvitesRecord>(url.searchParams.get('id'));

	const newHash = await getHash(pick(invite, ['id', 'secret']));
	const hash = url.searchParams.get('hash');
	const valid = newHash === hash;
	if (!valid) return error(404, 'Not Found');

	const isProject = !!invite.project;

	let result;
	if (isProject) {
		result = await acceptInvite(invite, user, Collections.ProjectsUsers, 'project');
		result.location = `/projects/${result.record.project}`;
	} else {
		result = await acceptInvite(invite, user, Collections.DocsUsers, 'doc', { expand: 'doc' });
		result.location = `/projects/${result.record.expand.doc.project}/docs/${result.record.doc}`;
	}
	return redirect(307, result.location);
}

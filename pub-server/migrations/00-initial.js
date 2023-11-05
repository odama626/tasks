export const name = 'initialize';

export const description = `
  create initial tables
`;

export async function transaction(sql) {
	await sql`
    create table test(
      a int
    );
  `;
}

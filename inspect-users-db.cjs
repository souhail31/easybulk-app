const { Client } = require('pg');
const c = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: 'mliki', database: 'easybulk' });
async function run() {
  await c.connect();
  const queries = {
    organizations: 'SELECT id, name FROM organization ORDER BY id LIMIT 20',
    roles: 'SELECT id, name, value FROM role ORDER BY id LIMIT 20',
    statuses: 'SELECT id, code, value, type FROM prm_status ORDER BY id LIMIT 50',
    groupes: 'SELECT id, name, organization_id FROM groupe ORDER BY id LIMIT 20',
    users: 'SELECT id, user_name, first_name, last_name, email, is_local FROM users ORDER BY id LIMIT 20',
    memberships: 'SELECT id, user_id, organization_id, status_id FROM membership ORDER BY id LIMIT 20'
  };
  for (const [key, sql] of Object.entries(queries)) {
    const r = await c.query(sql);
    console.log('##' + key + '##');
    console.log(JSON.stringify(r.rows, null, 2));
  }
  await c.end();
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});

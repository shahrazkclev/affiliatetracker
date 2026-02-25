const fs = require('fs');

const API_KEY = "pk_6wfRbj3nYEhiyHGh7C47dS";
const BASE_URL = "https://www.promotekit.com/api/v1";

async function fetchAll(endpoint) {
    let allData = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const res = await fetch(`${BASE_URL}${endpoint}?page=${page}&limit=50`, {
            headers: { "Authorization": `Bearer ${API_KEY}` }
        });
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
            allData.push(...json.data);
        }
        hasMore = json.pagination?.has_more || false;
        page++;
    }
    return allData;
}

function escapeSql(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
}

async function run() {
    console.log("Fetching campaigns...");
    const campaigns = await fetchAll("/campaigns");
    console.log(`Fetched ${campaigns.length} campaigns.`);

    console.log("Fetching affiliates...");
    const affiliates = await fetchAll("/affiliates");
    console.log(`Fetched ${affiliates.length} affiliates.`);

    let sql = `
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Assume inserting into the first organization
    SELECT id INTO v_org_id FROM organizations LIMIT 1;

    IF v_org_id IS NULL THEN
        INSERT INTO organizations (name) VALUES ('PromoteKit Org') RETURNING id INTO v_org_id;
    END IF;

    -- Upsert Campaigns
`;

    for (const c of campaigns) {
        const id = escapeSql(c.id);
        const name = escapeSql(c.name);
        const pct = c.commission_type === 'percentage' ? c.commission_amount : 0;
        const isDef = c.is_default ? 'true' : 'false';
        const ca = escapeSql(c.created_at);

        sql += `    INSERT INTO campaigns (id, org_id, name, default_commission_percent, is_default, created_at)
    VALUES (${id}, v_org_id, ${name}, ${pct}, ${isDef}, ${ca})
    ON CONFLICT DO NOTHING;\n`;
    }

    sql += `\n    -- Upsert Affiliates\n`;

    for (const a of affiliates) {
        const id = escapeSql(a.id);
        const camp_id = a.campaign?.id ? escapeSql(a.campaign.id) : 'NULL';
        const name = escapeSql((a.first_name || '') + ' ' + (a.last_name || '')).trim();
        const email = escapeSql(a.email);
        const payout_email = escapeSql(a.payout_email || a.email);
        const code = a.links && a.links.length > 0 ? escapeSql(a.links[0].code) : escapeSql('ref_' + a.id.substring(0, 6));
        const clicks = Number(a.clicks) || 0;
        const isApp = a.approved ? "'active'" : "'pending'";
        const comm = a.campaign?.commission_amount || 0;
        const ca = escapeSql(a.created_at);

        sql += `    INSERT INTO affiliates (id, org_id, campaign_id, name, email, payout_email, referral_code, status, clicks, total_commission, created_at)
    VALUES (${id}, v_org_id, ${camp_id}, ${name}, ${email}, ${payout_email}, ${code}, ${isApp}, ${clicks}, ${comm}, ${ca})
    ON CONFLICT DO NOTHING;\n`;
    }

    sql += `END $$;\n`;

    fs.writeFileSync('migration_payload.sql', sql);
    console.log("Generated migration_payload.sql");
}

run().catch(console.error);

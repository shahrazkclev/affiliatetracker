const API_KEY = "pk_6wfRbj3nYEhiyHGh7C47dS";
const BASE_URL = "https://www.promotekit.com/api/v1";

async function fetchEndpoint(endpoint) {
    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        console.log(`--- ${endpoint} ---`);
        if (data.data && data.data.length > 0) {
            console.log(JSON.stringify(data.data[0], null, 2));
        } else {
            console.log(data);
        }
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    await fetchEndpoint("/campaigns");
    await fetchEndpoint("/affiliates");
    await fetchEndpoint("/referrals");
    await fetchEndpoint("/commissions");
}

run();

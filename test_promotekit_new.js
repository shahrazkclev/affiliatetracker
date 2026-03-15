const API_KEY = "pk_7fgiE9xvZRZiQusxvYujJM";
const BASE_URL = "https://www.promotekit.com/api/v1";

async function fetchEndpoint(endpoint) {
    console.log(`Fetching ${endpoint}...`);
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        console.log(`Status (${endpoint}):`, res.status);
        const data = await res.json();

        console.log(`--- ${endpoint} ---`);
        if (data.data && data.data.length > 0) {
            console.log(JSON.stringify(data.data[0], null, 2));
            console.log(`Total returned items: ${data.data.length}`);
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error(`Error fetching ${endpoint}:`, e.message);
    }
}

async function run() {
    await fetchEndpoint("/campaigns");
    await fetchEndpoint("/affiliates");
    await fetchEndpoint("/commissions");
}

run();

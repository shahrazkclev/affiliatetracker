const API_KEY = "pk_7fgiE9xvZRZiQusxvYujJM";

async function checkURL(url) {
    try {
        console.log("Checking", url);
        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${API_KEY}` },
            signal: AbortSignal.timeout(5000)
        });
        console.log(url, "->", res.status);
        const data = await res.json();
        console.log(data);
    } catch (e) {
        console.log(url, "-> ERROR:", e.message);
    }
}

async function run() {
    await checkURL("https://www.promotekit.com/api/v1/campaigns");
    await checkURL("https://api.promotekit.com/v1/campaigns");
}

run();

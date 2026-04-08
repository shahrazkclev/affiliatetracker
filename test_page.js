const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log("Navigating to page with ?ref=shahraz...");
    await page.goto('https://affiliatemango.com/the-lazy-motion-library-test?ref=shahraz', { waitUntil: 'networkidle', timeout: 30000 });
    
    await page.waitForTimeout(2000); // Wait 2 seconds for scripts/observer to settle
    
    const affiliateLogs = [];
    page.on('console', msg => {
        if (msg.text().includes('CP Affiliate') || msg.text().includes('Smart Btn') || msg.text().includes('tracker')) {
            affiliateLogs.push(msg.text());
        }
    });

    console.log("Evaluating buttons on page...");
    const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*="buy.stripe.com"]')).map(el => ({
            text: el.innerText.trim(),
            classes: el.className,
            href: el.getAttribute('href'),
            id: el.id || 'none'
        }));
    });
    
    console.log("Console Logs:", affiliateLogs);
    console.log("\nStripe Links Found:", JSON.stringify(buttons, null, 2));

    await browser.close();
})();

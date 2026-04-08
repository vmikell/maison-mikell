import { chromium } from 'playwright';

const url = 'https://maison-reset-planner.netlify.app';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
await page.screenshot({ path: '/home/vboxuser/.openclaw/workspace/maison-reset-netlify-deep-smoke.png', fullPage: true });

const statusBanner = await page.locator('.status-banner').innerText().catch(() => null);
const title = await page.locator('h1').first().innerText().catch(() => null);
const stats = await page.locator('.stat-card strong').allInnerTexts().catch(() => []);
const overdueTitle = await page.locator('.spotlight-item strong').first().innerText().catch(() => null);
const taskCount = await page.locator('.task-card').count().catch(() => 0);
const shoppingCount = await page.locator('.shopping-card').count().catch(() => 0);

console.log(JSON.stringify({ statusBanner, title, stats, overdueTitle, taskCount, shoppingCount }, null, 2));
await browser.close();

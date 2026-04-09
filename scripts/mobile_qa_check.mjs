import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const issues = []

function note(ok, message) {
  if (!ok) issues.push(message)
}

await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle', timeout: 120000 })
await page.screenshot({ path: '/home/vboxuser/.openclaw/workspace/maison_mobile_qa_home.png', fullPage: true })

const tabCount = await page.locator('.top-tab').count().catch(() => 0)
note(tabCount >= 3, 'Top tabs did not render correctly on mobile.')

const heroBox = await page.locator('.hero-card').boundingBox()
note(Boolean(heroBox && heroBox.width <= 390), 'Hero card appears wider than viewport.')

await page.getByRole('button', { name: 'Calendar' }).click()
await page.waitForLoadState('networkidle')
await page.screenshot({ path: '/home/vboxuser/.openclaw/workspace/maison_mobile_qa_calendar.png', fullPage: true })
const calendarCards = await page.locator('.calendar-day-card').count().catch(() => 0)
note(calendarCards > 0, 'Calendar view did not render day cards.')

await page.getByRole('button', { name: 'Shopping' }).click()
await page.waitForLoadState('networkidle')
await page.screenshot({ path: '/home/vboxuser/.openclaw/workspace/maison_mobile_qa_shopping.png', fullPage: true })
const shoppingTabs = await page.locator('.shopping-tab').count().catch(() => 0)
note(shoppingTabs >= 2, 'Shopping tabs did not render.')

const shoppingOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
note(!shoppingOverflow, 'Shopping view causes horizontal overflow on mobile.')

const firstTask = page.locator('.compact-task-card').first()
if (await firstTask.count()) {
  await page.getByRole('button', { name: 'Planner' }).click()
  await firstTask.click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: '/home/vboxuser/.openclaw/workspace/maison_mobile_qa_modal.png', fullPage: true })
  const modalBox = await page.locator('.task-modal').boundingBox()
  note(Boolean(modalBox && modalBox.width <= 390), 'Task modal appears wider than viewport.')
}

console.log(JSON.stringify({ issues }, null, 2))
await browser.close()

import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
page.on('console', (msg) => console.log('CONSOLE', msg.type(), msg.text()))
page.on('pageerror', (err) => console.log('PAGEERROR', err.message))
page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) console.log('NAV', frame.url()) })
page.on('response', (res) => {
  const url = res.url()
  if (url.includes('/__/auth/') || url.includes('accounts.google.com') || url.includes('identitytoolkit')) {
    console.log('RESP', res.status(), url)
  }
})
await page.goto('https://maison-reset.firebaseapp.com', { waitUntil: 'networkidle', timeout: 90000 })
console.log('INITIAL', page.url())
console.log('TITLE', await page.title())
console.log('BODY', (await page.locator('body').innerText()).slice(0, 1500))
await page.getByRole('button', { name: /sign in or sign up with google/i }).click()
await page.waitForTimeout(7000)
console.log('FINAL', page.url())
console.log('FINALTITLE', await page.title())
console.log('FINALBODY', (await page.locator('body').innerText()).slice(0, 2000))
await browser.close()

import { chromium } from 'playwright'

const urls = [
  'https://maison-reset.firebaseapp.com',
  'https://maison-reset.web.app',
  'https://maison-mikell.netlify.app',
]

for (const url of urls) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const events = []
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) events.push(`NAV ${frame.url()}`)
  })
  page.on('response', (res) => {
    const rurl = res.url()
    if (rurl.includes('/__/auth/') || rurl.includes('accounts.google.com') || rurl.includes('identitytoolkit')) {
      events.push(`RESP ${res.status()} ${rurl}`)
    }
  })
  page.on('console', (msg) => events.push(`CONSOLE ${msg.type()} ${msg.text()}`))
  page.on('pageerror', (err) => events.push(`PAGEERROR ${err.message}`))

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 })
    const title = await page.title()
    const body = (await page.locator('body').innerText()).slice(0, 1200)
    const button = page.getByRole('button', { name: /sign in or sign up with google/i })
    const buttonCount = await button.count()
    if (buttonCount > 0) {
      await button.click()
      await page.waitForTimeout(7000)
    }
    console.log(`=== ${url} ===`)
    console.log(`TITLE ${title}`)
    console.log(`FINAL ${page.url()}`)
    console.log(`BODY ${body}`)
    console.log(events.join('\n'))
  } catch (error) {
    console.log(`=== ${url} ===`)
    console.log(`ERROR ${error.message}`)
    console.log(events.join('\n'))
  }

  await browser.close()
}

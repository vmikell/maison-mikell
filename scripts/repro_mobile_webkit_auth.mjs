import { webkit, devices, chromium } from 'playwright'

async function runWith(browserType, label, device = null) {
  let browser
  try {
    browser = await browserType.launch({ headless: true })
  } catch (error) {
    console.log(`=== ${label} ===`)
    console.log(`LAUNCH_ERROR ${error.message}`)
    return
  }
  const context = await browser.newContext(device ? { ...device } : {})
  const page = await context.newPage()
  page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) console.log(`[${label}] NAV ${frame.url()}`) })
  page.on('response', (res) => {
    const url = res.url()
    if (url.includes('/__/auth/') || url.includes('accounts.google.com') || url.includes('identitytoolkit')) {
      console.log(`[${label}] RESP ${res.status()} ${url}`)
    }
  })
  page.on('console', (msg) => console.log(`[${label}] CONSOLE ${msg.type()} ${msg.text()}`))
  page.on('pageerror', (err) => console.log(`[${label}] PAGEERROR ${err.message}`))

  try {
    await page.goto('https://maison-mikell.netlify.app', { waitUntil: 'networkidle', timeout: 90000 })
    const body = (await page.locator('body').innerText()).slice(0, 800)
    console.log(`=== ${label} ===`)
    console.log(`START ${page.url()}`)
    console.log(`BODY ${body}`)
    const fullPage = page.getByRole('button', { name: /use full-page sign-in/i })
    const main = page.getByRole('button', { name: /sign in or sign up with google/i })
    console.log(`BUTTONS main=${await main.count()} full=${await fullPage.count()}`)
    if (await fullPage.count()) {
      await fullPage.click()
      await page.waitForTimeout(12000)
    } else if (await main.count()) {
      await main.click()
      await page.waitForTimeout(12000)
    }
    console.log(`FINAL ${page.url()}`)
    console.log(`TITLE ${await page.title()}`)
  } catch (error) {
    console.log(`=== ${label} ===`)
    console.log(`RUN_ERROR ${error.message}`)
  }

  await browser.close()
}

await runWith(webkit, 'webkit-iphone', devices['iPhone 13'])
await runWith(chromium, 'chromium-iphone', devices['iPhone 13'])

import { chromium } from 'playwright'

const urls = [
  'https://maison-mikell.netlify.app',
  'https://maison-reset.web.app',
]

for (const url of urls) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 })
    console.log(url)
    console.log('FINAL', page.url())
    console.log('TITLE', await page.title())
  } catch (error) {
    console.log(url)
    console.log('ERROR', error.message)
  }
  await browser.close()
}

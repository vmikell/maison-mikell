const { chromium } = await import('playwright')

const baseUrl = process.argv[2] || 'https://maison-mikell.netlify.app'
const email = `maison.test+${Date.now()}@example.com`
const password = 'MaisonTest123!'
const accountName = 'Maison Test'
const householdName = `Maison Test Home ${Date.now().toString().slice(-5)}`

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } })

async function clickIfVisible(locator) {
  if (await locator.count()) {
    const first = locator.first()
    if (await first.isVisible()) {
      await first.click()
      return true
    }
  }
  return false
}

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })

  const authCard = page.locator('.maison-auth-card').last()
  await authCard.getByRole('button', { name: 'Create an email account' }).click()
  await authCard.getByPlaceholder('Your name').fill(accountName)
  await authCard.getByPlaceholder('Email address').fill(email)
  await authCard.getByPlaceholder('Password').fill(password)
  await authCard.getByRole('button', { name: 'Create email account' }).click()

  await page.getByRole('heading', { name: 'Start your household' }).waitFor({ timeout: 30000 })
  await page.getByPlaceholder('Household name (optional)').fill(householdName)
  await page.getByRole('button', { name: 'Create household' }).click()

  await page.getByRole('heading', { name: 'Set up your home' }).waitFor({ timeout: 30000 })
  await page.getByPlaceholder('Home name').fill(householdName)
  await page.getByPlaceholder('Home type (apartment, condo, house)').fill('Apartment')
  await page.getByPlaceholder('Square feet').fill('900')
  await page.getByPlaceholder('Levels').fill('1')
  await page.getByPlaceholder('Bedrooms').fill('1')
  await page.getByPlaceholder('Bathrooms').fill('1')
  await page.getByRole('button', { name: 'Save home setup' }).click()

  await page.waitForLoadState('networkidle')
  await clickIfVisible(page.getByRole('button', { name: 'Continue to app' }))

  await page.getByRole('button', { name: 'Admin' }).waitFor({ timeout: 30000 })
  await page.getByRole('button', { name: 'Admin' }).click()

  await page.getByRole('heading', { name: 'Leave Maison cleanly' }).waitFor({ timeout: 30000 })

  const passwordInput = page.getByPlaceholder('Current password to confirm deletion')
  if (await passwordInput.count()) await passwordInput.fill(password)
  await page.getByPlaceholder('Type DELETE to confirm').fill('DELETE')

  const destructiveButton = page.getByRole('button', { name: /Delete household and account|Delete my account/ })
  await destructiveButton.click()

  await page.getByRole('heading', { name: 'Goodbye for now.' }).waitFor({ timeout: 30000 })
  await page.getByText('Maison closed the loop cleanly.').waitFor({ timeout: 30000 })

  const postDeleteAuthCard = page.locator('.maison-auth-card').last()

  if (await clickIfVisible(postDeleteAuthCard.getByRole('button', { name: 'I already have an account' }))) {
    await page.waitForTimeout(250)
  }

  await postDeleteAuthCard.getByPlaceholder('Email address').fill(email)
  await postDeleteAuthCard.getByPlaceholder('Password').fill(password)
  await postDeleteAuthCard.getByRole('button', { name: 'Sign in with email' }).click()
  await page.getByText('That email or password did not match an account.').waitFor({ timeout: 30000 })

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    email,
    householdName,
    verified: [
      'created sacrificial account',
      'created household',
      'completed setup',
      'deleted last-member owner account',
      'landed on web goodbye page',
      'confirmed deleted credentials no longer sign in',
    ],
  }, null, 2))
} finally {
  await browser.close()
}

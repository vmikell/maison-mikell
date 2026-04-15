import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.MAISON_BASE_URL || 'https://maison-mikell.netlify.app'
const stamp = Date.now()
const password = 'MaisonTest123!'
const ownerEmail = `maison-smoke-owner-${stamp}@example.com`
const memberEmail = `maison-smoke-member-${stamp}@example.com`
const deleteEmail = `maison-smoke-delete-${stamp}@example.com`
const artifactDir = path.resolve(process.cwd(), 'tmp', 'live-smoke')

mkdirSync(artifactDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const results = {
  baseUrl,
  deploy: {},
  googleRedirect: {},
  createJoin: {},
  passwordReset: {},
  deleteSoloOwner: {},
  issues: [],
}

function noteIssue(message) {
  results.issues.push(message)
}

async function captureFailure(page, label) {
  if (!page || page.isClosed()) return
  const file = path.join(artifactDir, `${label}-${Date.now()}.png`)
  try {
    await page.screenshot({ path: file, fullPage: true })
    noteIssue(`Saved failure screenshot: ${file}`)
  } catch {}
}

async function gotoLanding(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120000 })
  await page.getByRole('heading', { name: /welcome home/i }).waitFor({ timeout: 30000 })
}

async function switchToEmailSignup(page) {
  await page.getByRole('button', { name: /^create an email account$/i }).click()
  await page.getByRole('heading', { name: /create your maison account/i }).waitFor({ timeout: 30000 })
}

async function signUpWithEmail(page, { name, email, password }) {
  await gotoLanding(page)
  await switchToEmailSignup(page)
  await page.getByPlaceholder('Your name').fill(name)
  await page.getByPlaceholder('Email address').fill(email)
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: /^create email account$/i }).click()
  await page.getByRole('heading', { name: /start your household/i }).waitFor({ timeout: 60000 })
}

async function createHouseholdAndSetup(page, householdName) {
  await page.getByPlaceholder('Household name (optional)').fill(householdName)
  await page.getByRole('button', { name: /^create household$/i }).click()
  await page.getByRole('heading', { name: /set up your home/i }).waitFor({ timeout: 60000 })
  await page.getByPlaceholder('Home name').fill(householdName)
  await page.getByPlaceholder('Home type (apartment, condo, house)').fill('Condo')
  await page.getByPlaceholder('Square feet').fill('900')
  await page.getByPlaceholder('Levels').fill('1')
  await page.getByPlaceholder('Bedrooms').fill('2')
  await page.getByPlaceholder('Bathrooms').fill('1')
  await page.getByPlaceholder('HVAC system').fill('Mini split')
  await page.getByPlaceholder('HVAC heads / zones (optional)').fill('2')
  await page.getByRole('button', { name: /^save home setup$/i }).click()
  await page.getByRole('heading', { name: /your household is ready/i }).waitFor({ timeout: 60000 })
  const code = (await page.locator('.invite-code-panel strong').innerText()).trim()
  if (!code) throw new Error('Invite code did not render after setup.')
  return code
}

async function joinHousehold(page, inviteCode) {
  await page.getByRole('button', { name: /i already have an invite code/i }).click()
  await page.getByRole('heading', { name: /join your household/i }).waitFor({ timeout: 30000 })
  await page.getByPlaceholder('Enter invite code').fill(inviteCode)
  await page.getByRole('button', { name: /^join household$/i }).click()
  await page.locator('text=Joined successfully').first().waitFor({ timeout: 60000 })
}

try {
  const landingPage = await browser.newPage()
  landingPage.setDefaultTimeout(30000)
  try {
    await gotoLanding(landingPage)
    results.deploy = {
      resetPasswordButton: await landingPage.getByRole('button', { name: /reset password/i }).count() > 0,
      emailAuthSection: await landingPage.getByText(/email and password/i).count() > 0,
      authConfiguredMessageVisible: await landingPage.getByText(/auth is not configured/i).count() > 0,
    }
    if (!results.deploy.resetPasswordButton) noteIssue('Landing page does not show the reset password control.')
    if (!results.deploy.emailAuthSection) noteIssue('Landing page does not show the email auth section.')
    if (results.deploy.authConfiguredMessageVisible) noteIssue('Landing page still says auth is not configured.')
  } catch (error) {
    noteIssue(`Deploy check failed: ${error?.message || error}`)
    await captureFailure(landingPage, 'deploy-check')
  } finally {
    await landingPage.close()
  }

  const googlePage = await browser.newPage()
  googlePage.setDefaultTimeout(30000)
  try {
    const navs = []
    googlePage.on('framenavigated', (frame) => {
      if (frame === googlePage.mainFrame()) navs.push(frame.url())
    })
    await gotoLanding(googlePage)
    await googlePage.getByRole('button', { name: /continue with google/i }).click()
    try {
      await googlePage.waitForURL(
        (url) => url.hostname.includes('accounts.google.com') || url.pathname.includes('/__/auth/handler'),
        { timeout: 15000 },
      )
    } catch {}
    results.googleRedirect = {
      finalUrl: googlePage.url(),
      touchedFirebaseHandler: navs.some((url) => url.includes('/__/auth/handler')),
      touchedGoogle: navs.some((url) => url.includes('accounts.google.com')),
    }
    if (!results.googleRedirect.touchedFirebaseHandler) noteIssue('Google sign-in did not reach the Firebase auth redirect handler.')
  } catch (error) {
    noteIssue(`Google redirect check failed: ${error?.message || error}`)
    await captureFailure(googlePage, 'google-redirect')
  } finally {
    await googlePage.close()
  }

  const ownerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const ownerPage = await ownerContext.newPage()
  ownerPage.setDefaultTimeout(30000)
  try {
    await signUpWithEmail(ownerPage, { name: 'Smoke Owner', email: ownerEmail, password })
    const inviteCode = await createHouseholdAndSetup(ownerPage, `Smoke Household ${stamp}`)
    results.createJoin.owner = { email: ownerEmail, inviteCode }

    const memberContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const memberPage = await memberContext.newPage()
    memberPage.setDefaultTimeout(30000)
    try {
      await signUpWithEmail(memberPage, { name: 'Smoke Member', email: memberEmail, password })
      await joinHousehold(memberPage, inviteCode)
      results.createJoin.member = {
        email: memberEmail,
        joinedSuccess: true,
        currentViewHasPlannerButton:
          await memberPage.getByRole('button', { name: /^open planner$/i }).count() > 0
          || await memberPage.getByRole('button', { name: /^planner$/i }).count() > 0,
      }
    } catch (error) {
      noteIssue(`Create/join flow failed: ${error?.message || error}`)
      await captureFailure(memberPage, 'create-join-member')
    } finally {
      await memberContext.close()
    }

    const resetContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const resetPage = await resetContext.newPage()
    resetPage.setDefaultTimeout(30000)
    try {
      await gotoLanding(resetPage)
      await resetPage.getByPlaceholder('Email address').fill(memberEmail)
      await resetPage.getByRole('button', { name: /reset password/i }).click()
      await resetPage.getByText(/password reset email sent/i).waitFor({ timeout: 30000 })
      results.passwordReset = { email: memberEmail, success: true }
    } catch (error) {
      noteIssue(`Password reset flow failed: ${error?.message || error}`)
      await captureFailure(resetPage, 'password-reset')
    } finally {
      await resetContext.close()
    }
  } catch (error) {
    noteIssue(`Owner onboarding failed: ${error?.message || error}`)
    await captureFailure(ownerPage, 'owner-onboarding')
  } finally {
    await ownerContext.close()
  }

  const deleteContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const deletePage = await deleteContext.newPage()
  deletePage.setDefaultTimeout(30000)
  deletePage.on('dialog', async (dialog) => {
    await dialog.accept()
  })
  try {
    await signUpWithEmail(deletePage, { name: 'Delete Owner', email: deleteEmail, password })
    await createHouseholdAndSetup(deletePage, `Delete Smoke ${stamp}`)
    const continueButton = deletePage.getByRole('button', { name: /continue to app/i })
    if (await continueButton.count()) await continueButton.click()
    await deletePage.getByRole('button', { name: /^admin$/i }).click()
    await deletePage.getByPlaceholder('Current password to confirm deletion').fill(password)
    await deletePage.getByRole('button', { name: /^delete my account$/i }).click()
    await deletePage.getByRole('heading', { name: /goodbye for now/i }).waitFor({ timeout: 60000 })
    results.deleteSoloOwner = { email: deleteEmail, success: true }
  } catch (error) {
    noteIssue(`Solo-owner delete flow failed: ${error?.message || error}`)
    await captureFailure(deletePage, 'delete-flow')
  } finally {
    await deleteContext.close()
  }
} finally {
  await browser.close()
}

console.log(JSON.stringify(results, null, 2))
if (results.issues.length) process.exitCode = 1

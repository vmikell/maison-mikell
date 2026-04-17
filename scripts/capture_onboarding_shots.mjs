import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const outDir = '/home/vboxuser/.openclaw/workspace/tmp/maison-onboarding-shots'
await mkdir(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle', timeout: 120000 })
await page.screenshot({ path: `${outDir}/01-landing.png`, fullPage: true })

await page.evaluate(() => {
  const shell = document.querySelector('.shell')
  if (shell) {
    shell.innerHTML = `
      <section class="hero-card auth-landing-card onboarding-card">
        <div>
          <p class="eyebrow">Maison</p>
          <h1>Start your household</h1>
          <p class="hero-copy">Create the household first, then Maison walks you straight into setup and partner invite handoff.</p>
          <div class="onboarding-bullet-list"><span>Create the household in one step</span><span>Finish setup right after, without losing momentum</span><span>Invite your partner as soon as the home is ready</span></div>
        </div>
        <form class="auth-landing-actions onboarding-actions">
          <input class="invite-code-input no-caps-input" placeholder="Household name (optional)" value="Mikell Home" />
          <div class="auth-landing-note onboarding-note-card"><strong>What happens next</strong><span>Create the household first, then Maison immediately walks you into home setup and gives you an invite code for your partner.</span></div>
          <button class="primary-button" type="button">Create household</button>
          <button class="secondary-button" type="button">I already have an invite code</button>
          <button class="secondary-button" type="button">Use a different Google account</button>
        </form>
      </section>`
  }
})
await page.screenshot({ path: `${outDir}/02-create-household.png`, fullPage: true })

await page.evaluate(() => {
  const shell = document.querySelector('.shell')
  if (shell) {
    shell.innerHTML = `
      <section class="hero-card auth-landing-card onboarding-card">
        <div>
          <p class="eyebrow">Maison</p>
          <h1>Set up your home</h1>
          <p class="hero-copy">Shape Maison around the real home, so the planner starts feeling useful immediately.</p>
          <div class="onboarding-bullet-list"><span>Home profile first</span><span>Starter planner already waiting behind it</span><span>Invite your partner right after setup</span></div>
        </div>
        <form class="auth-landing-actions onboarding-actions setup-form-grid">
          <div class="onboarding-section-block">
            <div><p class="panel-label">Step 1</p><h3>Home basics</h3><p class="hero-copy">Give Maison the shape of the home so the planner feels like yours from day one.</p></div>
            <input class="invite-code-input no-caps-input" value="Mikell Home" />
            <input class="invite-code-input no-caps-input" value="Condo" />
            <input class="invite-code-input no-caps-input" value="1200" />
            <div class="setup-form-split"><input class="invite-code-input no-caps-input" value="2" /><input class="invite-code-input no-caps-input" value="2" /></div>
            <input class="invite-code-input no-caps-input" value="1.5" />
          </div>
          <div class="onboarding-section-block">
            <div><p class="panel-label">Step 2</p><h3>Systems and routine fit</h3><p class="hero-copy">Optional, but worth it. This helps Maison fit the planner to the systems you actually live with.</p></div>
            <input class="invite-code-input no-caps-input" value="Mini split heat pump" />
            <input class="invite-code-input no-caps-input" value="4" />
          </div>
          <div class="auth-landing-note onboarding-note-card onboarding-preview-card"><strong>Mikell Home</strong><span>condo · 2-level · 2 bedrooms · 1 baths</span><span>Mini split heat pump · 4 zones</span></div>
          <div class="auth-landing-note onboarding-note-card"><strong>What happens after setup</strong><span>Maison saves the home, keeps your starter planner in place, and then gives you the invite code so your partner can join cleanly.</span></div>
          <button class="primary-button" type="button">Save home setup</button>
        </form>
      </section>`
  }
})
await page.screenshot({ path: `${outDir}/03-home-setup.png`, fullPage: true })

await page.evaluate(() => {
  const shell = document.querySelector('.shell')
  if (shell) {
    shell.innerHTML = `
      <section class="panel remote-warning-panel">
        <div class="section-head"><div><p class="panel-label">Invite your partner</p><h2>Your household is ready</h2><p class="hero-copy">Share this invite code with your partner so they can join the household, then continue into the planner once you’re ready.</p></div><div class="planner-actions"><button class="secondary-button" type="button">Copy code</button><button class="secondary-button" type="button">Continue to app</button></div></div>
        <div class="invite-code-panel"><p class="hero-copy"><strong>MKL42Q</strong></p><div class="onboarding-bullet-list compact"><span>Partner signs in with Google</span><span>They tap “I already have an invite code”</span><span>They enter this code and land in your shared home</span></div></div>
      </section>`
  }
})
await page.screenshot({ path: `${outDir}/04-invite-handoff.png`, fullPage: true })

await browser.close()
console.log(outDir)

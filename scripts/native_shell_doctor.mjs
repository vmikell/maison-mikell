import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath))
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))
}

function run(command, args = []) {
  try {
    const result = spawnSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return {
      ok: result.status === 0,
      status: result.status,
      stdout: result.stdout?.trim() || '',
      stderr: result.stderr?.trim() || '',
      error: result.error?.message || '',
    }
  } catch (error) {
    return {
      ok: false,
      status: null,
      stdout: '',
      stderr: '',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function formatCheck(check) {
  return `${check.ok ? 'PASS' : check.level === 'warn' ? 'WARN' : 'FAIL'}  ${check.label}: ${check.detail}`
}

function buildChecks() {
  const checks = []
  const capacitorConfig = readJson('capacitor.config.json')
  const packageJson = readJson('package.json')
  const hasAndroid = exists('android/app/build.gradle')
  const hasIos = exists('ios/App/App.xcodeproj/project.pbxproj')
  const hasWebBuild = exists(path.join(capacitorConfig.webDir || 'dist', 'index.html'))
  const hasGradleWrapper = exists('android/gradlew')
  const hasCapacitorAppPlugin = Boolean(packageJson.dependencies?.['@capacitor/app'])

  checks.push({ ok: Boolean(capacitorConfig.appId), level: 'fail', label: 'Capacitor app id', detail: capacitorConfig.appId || 'Missing appId in capacitor.config.json' })
  checks.push({ ok: Boolean(capacitorConfig.appName), level: 'fail', label: 'Capacitor app name', detail: capacitorConfig.appName || 'Missing appName in capacitor.config.json' })
  checks.push({ ok: Boolean(capacitorConfig.webDir), level: 'fail', label: 'Capacitor webDir', detail: capacitorConfig.webDir || 'Missing webDir in capacitor.config.json' })
  checks.push({ ok: hasAndroid, level: 'fail', label: 'Android shell', detail: hasAndroid ? 'android/ is present' : 'Android shell is missing' })
  checks.push({ ok: hasIos, level: 'fail', label: 'iOS shell', detail: hasIos ? 'ios/ is present' : 'iOS shell is missing' })
  checks.push({ ok: hasGradleWrapper, level: 'fail', label: 'Gradle wrapper', detail: hasGradleWrapper ? 'android/gradlew is present' : 'android/gradlew is missing' })
  checks.push({ ok: hasWebBuild, level: 'warn', label: 'Web build output', detail: hasWebBuild ? `${capacitorConfig.webDir}/index.html is present` : `Missing ${capacitorConfig.webDir}/index.html. Run npm run build before syncing.` })
  checks.push({ ok: hasCapacitorAppPlugin, level: 'warn', label: '@capacitor/app plugin', detail: hasCapacitorAppPlugin ? 'Installed for lifecycle and appUrlOpen diagnostics' : 'Missing @capacitor/app dependency' })

  const javaResult = run('java', ['-version'])
  const hasJavaHome = Boolean(process.env.JAVA_HOME)
  checks.push({
    ok: javaResult.ok,
    level: 'fail',
    label: 'Java / JDK',
    detail: javaResult.ok
      ? (javaResult.stderr.split('\n')[0] || javaResult.stdout.split('\n')[0] || 'java is available')
      : `Java is unavailable${hasJavaHome ? ` even though JAVA_HOME=${process.env.JAVA_HOME}` : ' and JAVA_HOME is unset'}`,
  })

  const androidSdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || ''
  checks.push({
    ok: Boolean(androidSdkRoot),
    level: 'fail',
    label: 'Android SDK env',
    detail: androidSdkRoot || 'ANDROID_HOME / ANDROID_SDK_ROOT is not set',
  })

  if (process.platform === 'darwin') {
    const xcodeResult = run('xcodebuild', ['-version'])
    checks.push({
      ok: xcodeResult.ok,
      level: 'fail',
      label: 'Xcode',
      detail: xcodeResult.ok ? xcodeResult.stdout.split('\n')[0] : 'xcodebuild is unavailable',
    })
  } else {
    checks.push({
      ok: true,
      level: 'warn',
      label: 'Xcode',
      detail: `Not checked on ${process.platform}`,
    })
  }

  return checks
}

const checks = buildChecks()
const failedChecks = checks.filter((check) => !check.ok && check.level !== 'warn')
const warningChecks = checks.filter((check) => !check.ok && check.level === 'warn')

console.log('Maison native shell doctor')
console.log(`Repo: ${repoRoot}`)
console.log(`Platform: ${process.platform}`)
console.log('')
for (const check of checks) {
  console.log(formatCheck(check))
}
console.log('')
console.log(`Readiness: ${failedChecks.length ? 'blocked' : warningChecks.length ? 'needs-attention' : 'ready'}`)
if (failedChecks.length) {
  console.log('Blockers:')
  for (const check of failedChecks) {
    console.log(`- ${check.label}`)
  }
}
if (warningChecks.length) {
  console.log('Warnings:')
  for (const check of warningChecks) {
    console.log(`- ${check.label}`)
  }
}

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

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function readOptionalText(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) return ''
  return fs.readFileSync(fullPath, 'utf8')
}

function parseEnvVar(text, key) {
  const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'))
  if (!match) return ''
  return match[1].trim().replace(/^['"]|['"]$/g, '')
}

function readNativeAuthModeHint() {
  const directEnv = process.env.VITE_NATIVE_GOOGLE_AUTH_MODE?.trim()
  if (directEnv) {
    return { value: directEnv, source: 'process.env' }
  }

  const candidateFiles = ['.env.production', '.env', '.env.local']
  for (const relativePath of candidateFiles) {
    const text = readOptionalText(relativePath)
    const value = parseEnvVar(text, 'VITE_NATIVE_GOOGLE_AUTH_MODE')
    if (value) return { value, source: relativePath }
  }

  return { value: '', source: '' }
}

function extractPlistValue(plistText, key) {
  if (!plistText) return ''
  const match = plistText.match(new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`))
  return match?.[1] || ''
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
  const reservedCallbackScheme = capacitorConfig.appId
  const reservedCallbackHost = 'auth'
  const reservedCallbackUrl = `${reservedCallbackScheme}://${reservedCallbackHost}`
  const hasAndroid = exists('android/app/build.gradle')
  const hasIos = exists('ios/App/App.xcodeproj/project.pbxproj')
  const hasWebBuild = exists(path.join(capacitorConfig.webDir || 'dist', 'index.html'))
  const hasGradleWrapper = exists('android/gradlew')
  const hasCapacitorAppPlugin = Boolean(packageJson.dependencies?.['@capacitor/app'])
  const hasCapacitorFirebaseAuthPlugin = Boolean(packageJson.dependencies?.['@capacitor-firebase/authentication'])
  const firebaseAuthenticationPluginConfig = capacitorConfig.plugins?.FirebaseAuthentication || {}
  const hasGoogleProviderConfig = Array.isArray(firebaseAuthenticationPluginConfig.providers)
    && firebaseAuthenticationPluginConfig.providers.includes('google.com')
  const hasSkipNativeAuthConfig = firebaseAuthenticationPluginConfig.skipNativeAuth === true
  const androidManifest = hasAndroid ? readText('android/app/src/main/AndroidManifest.xml') : ''
  const iosInfoPlist = hasIos ? readText('ios/App/App/Info.plist') : ''
  const iosAppDelegate = hasIos ? readText('ios/App/App/AppDelegate.swift') : ''
  const androidGoogleServicesRelativePath = 'android/app/google-services.json'
  const iosGoogleServiceInfoRelativePath = 'ios/App/App/GoogleService-Info.plist'
  const hasAndroidGoogleServices = exists(androidGoogleServicesRelativePath)
  const hasIosGoogleServiceInfo = exists(iosGoogleServiceInfoRelativePath)
  const iosGoogleServiceInfoText = hasIosGoogleServiceInfo ? readText(iosGoogleServiceInfoRelativePath) : ''
  const iosReversedClientId = extractPlistValue(iosGoogleServiceInfoText, 'REVERSED_CLIENT_ID')
  const nativeAuthModeHint = readNativeAuthModeHint()

  const hasAndroidViewIntentFilter = androidManifest.includes('android.intent.action.VIEW')
  const hasAndroidDefaultCategory = androidManifest.includes('android.intent.category.DEFAULT')
  const hasAndroidBrowsableCategory = androidManifest.includes('android.intent.category.BROWSABLE')
  const hasAndroidCallbackScheme = androidManifest.includes('android:scheme="@string/custom_url_scheme"') || androidManifest.includes(`android:scheme="${reservedCallbackScheme}"`)
  const hasAndroidCallbackHost = androidManifest.includes(`android:host="${reservedCallbackHost}"`)
  const hasAndroidCallbackIntentFilter = hasAndroidViewIntentFilter && hasAndroidDefaultCategory && hasAndroidBrowsableCategory && hasAndroidCallbackScheme && hasAndroidCallbackHost
  const hasAndroidSingleTaskLaunchMode = androidManifest.includes('android:launchMode="singleTask"')
  const hasIosUrlTypes = iosInfoPlist.includes('CFBundleURLTypes')
  const hasIosCallbackScheme = iosInfoPlist.includes(`<string>${reservedCallbackScheme}</string>`)
  const hasIosUniversalLinkForwarder = iosAppDelegate.includes('continue userActivity')
  const hasIosOpenUrlForwarder = iosAppDelegate.includes('open url: URL')
  const hasIosReversedClientIdScheme = Boolean(iosReversedClientId) && iosInfoPlist.includes(`<string>${iosReversedClientId}</string>`)

  let androidGoogleServicesPackageName = ''
  if (hasAndroidGoogleServices) {
    try {
      const googleServices = readJson(androidGoogleServicesRelativePath)
      androidGoogleServicesPackageName = googleServices.client
        ?.map((client) => client?.client_info?.android_client_info?.package_name || '')
        .find(Boolean) || ''
    } catch {
      androidGoogleServicesPackageName = ''
    }
  }

  checks.push({ ok: Boolean(capacitorConfig.appId), level: 'fail', label: 'Capacitor app id', detail: capacitorConfig.appId || 'Missing appId in capacitor.config.json' })
  checks.push({ ok: Boolean(capacitorConfig.appName), level: 'fail', label: 'Capacitor app name', detail: capacitorConfig.appName || 'Missing appName in capacitor.config.json' })
  checks.push({ ok: Boolean(capacitorConfig.webDir), level: 'fail', label: 'Capacitor webDir', detail: capacitorConfig.webDir || 'Missing webDir in capacitor.config.json' })
  checks.push({ ok: hasAndroid, level: 'fail', label: 'Android shell', detail: hasAndroid ? 'android/ is present' : 'Android shell is missing' })
  checks.push({ ok: hasIos, level: 'fail', label: 'iOS shell', detail: hasIos ? 'ios/ is present' : 'iOS shell is missing' })
  checks.push({ ok: hasGradleWrapper, level: 'fail', label: 'Gradle wrapper', detail: hasGradleWrapper ? 'android/gradlew is present' : 'android/gradlew is missing' })
  checks.push({ ok: hasWebBuild, level: 'warn', label: 'Web build output', detail: hasWebBuild ? `${capacitorConfig.webDir}/index.html is present` : `Missing ${capacitorConfig.webDir}/index.html. Run npm run build before syncing.` })
  checks.push({ ok: hasCapacitorAppPlugin, level: 'warn', label: '@capacitor/app plugin', detail: hasCapacitorAppPlugin ? 'Installed for lifecycle and appUrlOpen diagnostics' : 'Missing @capacitor/app dependency' })
  checks.push({ ok: hasCapacitorFirebaseAuthPlugin, level: 'warn', label: '@capacitor-firebase/authentication plugin', detail: hasCapacitorFirebaseAuthPlugin ? 'Installed for native Google auth bridge mode' : 'Missing @capacitor-firebase/authentication dependency' })
  checks.push({ ok: hasGoogleProviderConfig && hasSkipNativeAuthConfig, level: 'warn', label: 'FirebaseAuthentication Capacitor config', detail: hasGoogleProviderConfig && hasSkipNativeAuthConfig ? 'capacitor.config.json enables google.com with skipNativeAuth=true' : 'capacitor.config.json is missing FirebaseAuthentication google.com + skipNativeAuth=true config' })
  checks.push({ ok: hasAndroidSingleTaskLaunchMode, level: 'warn', label: 'Android singleTask activity', detail: hasAndroidSingleTaskLaunchMode ? 'MainActivity is configured with singleTask launchMode' : 'MainActivity is not configured with singleTask launchMode' })
  checks.push({ ok: hasAndroidCallbackIntentFilter, level: 'warn', label: 'Android callback intent filter', detail: hasAndroidCallbackIntentFilter ? `AndroidManifest declares VIEW/BROWSABLE callback routing for ${reservedCallbackUrl}` : `AndroidManifest is missing a VIEW/BROWSABLE callback filter for ${reservedCallbackUrl}` })
  checks.push({ ok: hasAndroidGoogleServices, level: 'warn', label: 'Android google-services.json', detail: hasAndroidGoogleServices ? `${androidGoogleServicesRelativePath} is present` : `Missing ${androidGoogleServicesRelativePath}. Native Google auth cannot start on Android until this file is added.` })
  checks.push({ ok: !hasAndroidGoogleServices || androidGoogleServicesPackageName === reservedCallbackScheme, level: 'warn', label: 'Android Firebase package name', detail: hasAndroidGoogleServices ? (androidGoogleServicesPackageName === reservedCallbackScheme ? `${androidGoogleServicesRelativePath} matches ${reservedCallbackScheme}` : `${androidGoogleServicesRelativePath} targets ${androidGoogleServicesPackageName || 'unknown package'}, expected ${reservedCallbackScheme}`) : `Waiting on ${androidGoogleServicesRelativePath} before package-name validation.` })
  checks.push({ ok: hasIosOpenUrlForwarder, level: 'warn', label: 'iOS openURL forwarder', detail: hasIosOpenUrlForwarder ? 'AppDelegate forwards openURL calls into Capacitor' : 'AppDelegate is missing the Capacitor openURL forwarder' })
  checks.push({ ok: hasIosUniversalLinkForwarder, level: 'warn', label: 'iOS universal-link forwarder', detail: hasIosUniversalLinkForwarder ? 'AppDelegate forwards universal links into Capacitor' : 'AppDelegate is missing the universal-link forwarder' })
  checks.push({ ok: hasIosUrlTypes && hasIosCallbackScheme, level: 'warn', label: 'iOS callback URL scheme', detail: hasIosUrlTypes && hasIosCallbackScheme ? `Info.plist declares CFBundleURLTypes for ${reservedCallbackScheme}` : `Info.plist is missing CFBundleURLTypes for ${reservedCallbackScheme}` })
  checks.push({ ok: hasIosGoogleServiceInfo, level: 'warn', label: 'iOS GoogleService-Info.plist', detail: hasIosGoogleServiceInfo ? `${iosGoogleServiceInfoRelativePath} is present` : `Missing ${iosGoogleServiceInfoRelativePath}. Native Google auth cannot start on iPhone until this file is added.` })
  checks.push({ ok: !hasIosGoogleServiceInfo || hasIosReversedClientIdScheme, level: 'warn', label: 'iOS reversed client ID URL scheme', detail: hasIosGoogleServiceInfo ? (hasIosReversedClientIdScheme ? `Info.plist includes REVERSED_CLIENT_ID ${iosReversedClientId}` : `Info.plist is missing REVERSED_CLIENT_ID ${iosReversedClientId || '(not found in GoogleService-Info.plist)'}`) : `Waiting on ${iosGoogleServiceInfoRelativePath} before reversed-client-id validation.` })
  checks.push({ ok: nativeAuthModeHint.value === 'native-bridge', level: 'warn', label: 'Native bridge auth mode hint', detail: nativeAuthModeHint.value ? `VITE_NATIVE_GOOGLE_AUTH_MODE=${nativeAuthModeHint.value} (${nativeAuthModeHint.source})` : 'No VITE_NATIVE_GOOGLE_AUTH_MODE value found in process.env, .env.production, .env, or .env.local. Native bridge mode will stay off until this is set for the native build.' })

  const javaResult = run('java', ['-version'])
  const hasJavaHome = Boolean(process.env.JAVA_HOME)
  const androidSdkCandidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.HOME ? path.join(process.env.HOME, '.local/share/android/sdk') : '',
    process.env.HOME ? path.join(process.env.HOME, 'Android/Sdk') : '',
  ].filter(Boolean)
  const androidSdkRoot = androidSdkCandidates.find((candidate) => fs.existsSync(candidate)) || ''
  checks.push({
    ok: javaResult.ok,
    level: 'fail',
    label: 'Java / JDK',
    detail: javaResult.ok
      ? (javaResult.stderr.split('\n')[0] || javaResult.stdout.split('\n')[0] || 'java is available')
      : `Java is unavailable${hasJavaHome ? ` even though JAVA_HOME=${process.env.JAVA_HOME}` : ' and JAVA_HOME is unset'}`,
  })

  checks.push({
    ok: Boolean(androidSdkRoot),
    level: 'fail',
    label: 'Android SDK',
    detail: androidSdkRoot || 'No Android SDK found in ANDROID_HOME, ANDROID_SDK_ROOT, ~/.local/share/android/sdk, or ~/Android/Sdk',
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

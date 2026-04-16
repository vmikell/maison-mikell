import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname)
const capacitorConfigPath = path.join(repoRoot, 'capacitor.config.json')
const capacitorConfig = JSON.parse(fs.readFileSync(capacitorConfigPath, 'utf8'))
const appId = capacitorConfig.appId
const callbackHost = 'auth'
const callbackUrl = `${appId}://${callbackHost}?source=adb`
const apkPath = path.join(repoRoot, 'android/app/build/outputs/apk/debug/app-debug.apk')

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  })
}

function resolveAdb() {
  const sdkRoots = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(os.homedir(), '.local/share/android/sdk'),
    path.join(os.homedir(), 'Android/Sdk'),
  ].filter(Boolean)

  for (const sdkRoot of sdkRoots) {
    const adbPath = path.join(sdkRoot, 'platform-tools', 'adb')
    if (fs.existsSync(adbPath)) {
      return adbPath
    }
  }

  return 'adb'
}

function parseArgs(argv) {
  const options = {
    install: false,
    serial: '',
    help: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--install') {
      options.install = true
      continue
    }
    if (value === '--help' || value === '-h') {
      options.help = true
      continue
    }
    if (value === '--serial') {
      options.serial = argv[index + 1] || ''
      index += 1
      continue
    }
    throw new Error(`Unknown argument: ${value}`)
  }

  return options
}

function printHelp() {
  console.log('Maison Android callback smoke helper')
  console.log('')
  console.log('Usage:')
  console.log('  node scripts/native_android_callback_smoke.mjs [--install] [--serial <device-id>]')
  console.log('')
  console.log('What it does:')
  console.log(`  - targets callback URL: ${callbackUrl}`)
  console.log('  - optionally installs the debug APK first')
  console.log('  - launches the callback route over adb')
}

function getOnlineDevices(adbPath) {
  const result = run(adbPath, ['devices'])
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || 'adb devices failed')
  }

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('List of devices attached'))
    .map((line) => line.split(/\s+/))
    .filter((parts) => parts[1] === 'device')
    .map((parts) => parts[0])
}

function requireTargetDevice(devices, requestedSerial) {
  if (requestedSerial) {
    if (!devices.includes(requestedSerial)) {
      throw new Error(`Requested device not found or not ready: ${requestedSerial}`)
    }
    return requestedSerial
  }

  if (devices.length === 0) {
    throw new Error('No online Android devices found. Connect a device with USB debugging enabled, then retry.')
  }

  if (devices.length > 1) {
    throw new Error(`Multiple Android devices found (${devices.join(', ')}). Re-run with --serial <device-id>.`)
  }

  return devices[0]
}

function ensureApkExists() {
  if (!fs.existsSync(apkPath)) {
    throw new Error(`Debug APK not found at ${apkPath}. Run npm run native:android:build-debug first.`)
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  const adbPath = resolveAdb()
  const devices = getOnlineDevices(adbPath)
  const serial = requireTargetDevice(devices, options.serial)

  console.log('Maison Android callback smoke helper')
  console.log(`ADB: ${adbPath}`)
  console.log(`Device: ${serial}`)
  console.log(`Callback URL: ${callbackUrl}`)

  if (options.install) {
    ensureApkExists()
    console.log(`Installing debug APK: ${apkPath}`)
    const installResult = run(adbPath, ['-s', serial, 'install', '-r', apkPath])
    if (installResult.status !== 0) {
      throw new Error(installResult.stderr.trim() || installResult.stdout.trim() || 'adb install failed')
    }
    console.log(installResult.stdout.trim() || 'Install complete.')
  }

  console.log('Launching reserved callback route...')
  const launchResult = run(adbPath, [
    '-s',
    serial,
    'shell',
    'am',
    'start',
    '-W',
    '-a',
    'android.intent.action.VIEW',
    '-d',
    callbackUrl,
    appId,
  ])

  if (launchResult.status !== 0) {
    throw new Error(launchResult.stderr.trim() || launchResult.stdout.trim() || 'adb deep-link launch failed')
  }

  if (launchResult.stdout.trim()) {
    console.log(launchResult.stdout.trim())
  }

  console.log('')
  console.log('Next check inside the app:')
  console.log('- expand Native diagnostics')
  console.log('- confirm an appUrlOpen event was captured')
  console.log(`- confirm the opened URL includes ${callbackUrl}`)
}

try {
  main()
} catch (error) {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

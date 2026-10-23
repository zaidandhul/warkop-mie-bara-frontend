import { Builder, By, Key, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome.js'
import { config, url } from './config.js'

export const DEFAULT_WAIT = 10000
export const DASHBOARD_WAIT = 20000 // dashboard memuat ulang tiap 10 detik

// Driver yang sedang hidup; hooks.js mengambil screenshot dari sini saat test gagal.
export const activeDrivers = new Set()

export async function buildDriver() {
  const options = new chrome.Options()
  // Ukuran tablet landscape (dashboard); halaman pelanggan tetap tampil di kolom max-w-md.
  options.addArguments('--window-size=1280,900', '--lang=id-ID')
  if (config.headless) options.addArguments('--headless=new')
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
  activeDrivers.add(driver)
  return driver
}

export async function quitDriver(driver) {
  if (!driver) return
  activeDrivers.delete(driver)
  await driver.quit()
}

export const byTestId = (id) => By.css(`[data-testid="${id}"]`)
export const orderCard = (code, scope = '') => By.css(`${scope} [data-testid="order-card"][data-order-id="${code}"]`.trim())
export const column = (status) => `[data-testid="column-${status}"]`

export async function waitVisible(driver, locator, timeout = DEFAULT_WAIT) {
  const element = await driver.wait(until.elementLocated(locator), timeout)
  await driver.wait(until.elementIsVisible(element), timeout)
  return element
}

// textContent juga terbaca untuk elemen yang tergulung keluar layar (mis. kartu menu horizontal).
export async function textOf(element) {
  return ((await element.getAttribute('textContent')) ?? '').replace(/\s+/g, ' ').trim()
}

// Menunggu sampai teks elemen memenuhi syarat; mengembalikan teks terakhir.
export async function waitText(driver, locator, predicate, timeout = DEFAULT_WAIT, message) {
  let last = ''
  await driver.wait(async () => {
    const elements = await driver.findElements(locator)
    if (!elements.length) return false
    last = await textOf(elements[0])
    return predicate(last)
  }, timeout, message ?? `Teks tidak sesuai (terakhir: "${last}")`)
  return last
}

export async function waitAbsent(driver, locator, timeout = DEFAULT_WAIT, message) {
  await driver.wait(async () => (await driver.findElements(locator)).length === 0, timeout, message)
}

export async function click(driver, element) {
  await driver.executeScript('arguments[0].scrollIntoView({ block: "center", inline: "center" })', element)
  await driver.wait(until.elementIsEnabled(element), DEFAULT_WAIT)
  await element.click()
}

export async function clickTestId(driver, id, timeout = DEFAULT_WAIT) {
  const element = await driver.wait(until.elementLocated(byTestId(id)), timeout)
  await click(driver, element)
  return element
}

export async function typeInto(element, value) {
  // Pilih semua lalu ketik: tetap memicu onChange React (clear() saja tidak).
  await element.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE)
  if (value) await element.sendKeys(value)
}

export async function waitUrl(driver, part, timeout = DEFAULT_WAIT) {
  await driver.wait(until.urlContains(part), timeout, `URL tidak berisi "${part}"`)
}

// Login lewat form. Dengan password benar, menunggu sampai dashboard (header staf) tampil,
// jadi cookie sesi sudah terpasang sebelum langkah berikutnya.
export async function loginUi(driver, password = config.adminPass) {
  await driver.get(url('/admin/login'))
  await typeInto(await waitVisible(driver, By.css('input[autocomplete="username"]')), config.adminUser)
  await typeInto(await waitVisible(driver, By.css('input[autocomplete="current-password"]')), password)
  await click(driver, await driver.findElement(By.css('button[type="submit"]')))
  if (password === config.adminPass) await waitVisible(driver, byTestId('staff-label'))
}

export { By, Key, until }

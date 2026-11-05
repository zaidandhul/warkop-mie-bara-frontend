import assert from 'node:assert/strict'
import { createOrder } from '../support/api.js'
import { buildDriver, byTestId, quitDriver, waitText } from '../support/browser.js'
import { runId, url } from '../support/config.js'

const HISTORY_KEY = 'mie-bara-order-history'
const codesOnPage = async (driver) => Promise.all((await driver.findElements(byTestId('history-order-code'))).map((el) => el.getText()))

describe('N. Riwayat pesanan dan profil pelanggan', function () {
  let driver
  let code

  before(async function () {
    code = (await createOrder({ name: `E2E Riwayat ${runId}`, items: [{ itemId: 'milo', qty: 1 }] })).id
    driver = await buildDriver()
  })

  after(async function () {
    await quitDriver(driver)
  })

  it('riwayat disimpan di localStorage: tetap terlihat di tab baru', async function () {
    await driver.get(url('/history'))
    await driver.executeScript(
      'localStorage.setItem(arguments[0], JSON.stringify([{ id: arguments[1], at: Date.now() }]))', HISTORY_KEY, code
    )
    await driver.switchTo().newWindow('tab')
    await driver.get(url('/history'))
    await waitText(driver, byTestId('history-order-code'), (text) => text === code)
  })

  it('entri lebih dari 24 jam dibuang; kode lama di sessionStorage dipindahkan', async function () {
    await driver.executeScript(`
      localStorage.setItem(arguments[0], JSON.stringify([{ id: arguments[1], at: Date.now() - 25 * 3600 * 1000 }]))
      sessionStorage.setItem(arguments[0], JSON.stringify([arguments[1]]))`, HISTORY_KEY, code)
    await driver.navigate().refresh()
    await waitText(driver, byTestId('history-order-code'), (text) => text === code)
    const stored = await driver.executeScript('return [localStorage.getItem(arguments[0]), sessionStorage.getItem(arguments[0])]', HISTORY_KEY)
    assert.equal(stored[1], null, 'sessionStorage lama tidak dibersihkan')
    assert.equal(JSON.parse(stored[0]).length, 1)

    await driver.executeScript(
      'localStorage.setItem(arguments[0], JSON.stringify([{ id: arguments[1], at: Date.now() - 25 * 3600 * 1000 }]))', HISTORY_KEY, code
    )
    await driver.navigate().refresh()
    await waitText(driver, { css: 'body' }, (text) => text.includes('Belum ada pesanan dari perangkat ini'))
    assert.deepEqual(await codesOnPage(driver), [])
    assert.equal(await driver.executeScript('return localStorage.getItem(arguments[0])', HISTORY_KEY), '[]')
  })
})

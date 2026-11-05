import assert from 'node:assert/strict'
import { adminLogin, ordersByName, publicMenu } from '../support/api.js'
import {
  By, buildDriver, byTestId, click, clickTestId, quitDriver, textOf, typeInto, until, waitText, waitUrl, waitVisible,
} from '../support/browser.js'
import { rupiah, runId, url } from '../support/config.js'

const dialog = (name) => By.css(`[role="dialog"][aria-label="${name}"]`)

async function openItem(driver, id, name) {
  await clickTestId(driver, `menu-add-${id}`)
  return waitVisible(driver, dialog(name))
}

async function saveItem(driver, sheet) {
  await click(driver, await sheet.findElement(byTestId('item-save')))
  await driver.wait(until.stalenessOf(sheet), 5000)
}

async function goToPayment(driver) {
  await clickTestId(driver, 'cart-button')
  await waitUrl(driver, '/view-order')
  await clickTestId(driver, 'checkout-button')
  await waitUrl(driver, '/payment')
}

async function fillCustomer(driver, name, phone) {
  await typeInto(await waitVisible(driver, byTestId('customer-name')), name)
  await typeInto(await waitVisible(driver, byTestId('customer-phone')), phone)
}

describe('B. Pesanan pelanggan', function () {
  let driver
  let cookie

  before(async function () {
    cookie = await adminLogin()
    driver = await buildDriver()
  })

  after(async function () {
    await quitDriver(driver)
  })

  it('/?tableNumber=05 ditampilkan sebagai meja 5', async function () {
    await driver.get(url('/?tableNumber=05'))
    const select = await waitVisible(driver, byTestId('table-select'))
    await driver.wait(async () => (await select.getAttribute('value')) === '5', 5000, 'Meja tidak menjadi 5')
    const selectedText = await driver.executeScript('return arguments[0].selectedOptions[0].textContent', select)
    assert.equal(selectedText.trim(), 'Meja 5')
  })

  it('Mie Bangladesh level 2 + topping telur: harga di keranjang = 13.000 + 3.500', async function () {
    // Harga diharapkan dihitung dari menu API (backend yang menentukan), lalu dicocokkan dengan spesifikasi.
    const menu = await publicMenu()
    const mie = menu.categories.flatMap((c) => c.items).find((item) => item.id === 'mie-bangladesh')
    const telur = menu.toppings.find((topping) => topping.id === 'telur')
    const expected = mie.price + (2 - 1) * menu.levelPriceStep + telur.price
    assert.equal(expected, 13000 + 3500, 'Data uji tidak sesuai spesifikasi (harga/level step/topping berubah)')

    const sheet = await openItem(driver, 'mie-bangladesh', 'Mie Bangladesh')
    const level2 = await sheet.findElement(By.xpath('.//button[normalize-space()="Level 2"]'))
    await click(driver, level2)
    const egg = await sheet.findElement(By.xpath('.//button[starts-with(normalize-space(), "Telur")]'))
    await click(driver, egg)
    assert.equal(await level2.getAttribute('aria-pressed'), 'true')
    assert.equal(await egg.getAttribute('aria-pressed'), 'true')
    await saveItem(driver, sheet)

    await clickTestId(driver, 'cart-button')
    await waitUrl(driver, '/view-order')
    const line = await waitVisible(driver, By.css('[data-testid="cart-line"][data-item-id="mie-bangladesh"]'))
    assert.match(await textOf(line), /Level 2/)
    assert.equal(await textOf(await line.findElement(byTestId('cart-line-price'))), rupiah(expected))
  })

  it('item tanpa level (siomay) tidak menampilkan pilihan level', async function () {
    await driver.get(url('/order'))
    const sheet = await openItem(driver, 'siomay-ayam-sosis', 'Siomay Ayam Sosis')
    assert.equal((await sheet.findElements(byTestId('level-options'))).length, 0, 'Pilihan level tampil')
    assert.equal((await sheet.findElements(byTestId('topping-options'))).length, 0, 'Pilihan topping tampil')
  })

  it('nomor HP tidak valid ("0812") menampilkan error dan pesanan tidak terkirim', async function () {
    const name = `E2E HP ${runId}`
    await driver.get(url('/payment')) // keranjang (Mie Bangladesh) tersimpan di sessionStorage
    await fillCustomer(driver, name, '0812')
    await clickTestId(driver, 'submit-order')
    const error = await waitVisible(driver, byTestId('payment-error'))
    assert.match(await textOf(error), /Nomor HP tidak valid/)
    assert.match(await driver.getCurrentUrl(), /\/payment$/)
    assert.equal((await ordersByName(cookie, name)).length, 0, 'Pesanan tetap tercipta')
  })

  it('pesanan valid berhasil dan menampilkan kode pesanan MB-…', async function () {
    const name = `E2E Valid ${runId}`
    await fillCustomer(driver, name, '081234567890')
    await clickTestId(driver, 'submit-order')
    await waitUrl(driver, '/history')
    const code = await waitText(driver, byTestId('history-order-code'), (text) => text.length > 0)
    assert.match(code, /^MB-[0-9A-F]{20}$/)
    // Riwayat disimpan di localStorage (bukan sessionStorage), dengan waktu simpan untuk TTL 24 jam.
    const stored = JSON.parse(await driver.executeScript("return localStorage.getItem('mie-bara-order-history')"))
    assert.equal(stored[0].id, code)
    assert.ok(Date.now() - stored[0].at < 60_000)
    const saved = await ordersByName(cookie, name)
    assert.equal(saved.length, 1)
    assert.equal(saved[0].id, code)
  })

  it('klik tombol pesan dua kali dengan cepat hanya membuat SATU pesanan', async function () {
    const name = `E2E Dobel ${runId}`
    await driver.get(url('/?tableNumber=5'))
    const sheet = await openItem(driver, 'milo', 'Milo')
    await saveItem(driver, sheet)
    await goToPayment(driver)
    await fillCustomer(driver, name, '')

    const submit = await waitVisible(driver, byTestId('submit-order'))
    await driver.executeScript('arguments[0].scrollIntoView({ block: "center" })', submit)
    await driver.actions().doubleClick(submit).perform()

    await waitUrl(driver, '/history')
    await waitText(driver, byTestId('history-order-code'), (text) => text.startsWith('MB-'))
    const saved = await ordersByName(cookie, name)
    assert.equal(saved.length, 1, `Tercipta ${saved.length} pesanan`)
  })
})

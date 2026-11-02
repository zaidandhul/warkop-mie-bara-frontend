import assert from 'node:assert/strict'
import { adminLogin, adminMenuItem, patchMenu, publicMenu } from '../support/api.js'
import {
  By, buildDriver, byTestId, click, clickTestId, loginUi, quitDriver, textOf, typeInto, until, waitAbsent, waitText, waitVisible,
} from '../support/browser.js'
import { rupiah, url } from '../support/config.js'

const TOGGLE_ITEM = 'milo'
const PRICE_ITEM = 'vanilla-latte'

async function openAdminMenu(driver) {
  await driver.get(url('/admin/menu'))
  return waitVisible(driver, byTestId(`menu-switch-${TOGGLE_ITEM}`))
}

async function openCustomerMenu(driver) {
  await driver.get(url('/?tableNumber=5'))
  await driver.wait(async () => (await driver.findElements(byTestId('menu-add-mie-bangladesh'))).length > 0, 10000, 'Menu pelanggan tidak termuat')
}

async function setSwitch(driver, wanted) {
  const toggle = await openAdminMenu(driver)
  if ((await toggle.getAttribute('aria-checked')) !== String(wanted)) await click(driver, toggle)
  await driver.wait(async () => (await toggle.getAttribute('aria-checked')) === String(wanted), 5000, 'Saklar tidak berubah')
}

async function editPrice(driver, price) {
  await openAdminMenu(driver)
  await clickTestId(driver, `price-edit-${PRICE_ITEM}`)
  await typeInto(await waitVisible(driver, byTestId('price-input')), String(price))
  await clickTestId(driver, 'price-save')
  await waitText(driver, byTestId(`price-edit-${PRICE_ITEM}`), (text) => text.startsWith(rupiah(price)))
}

describe('D. Kelola menu', function () {
  let driver
  let cookie
  let original

  before(async function () {
    cookie = await adminLogin()
    original = {
      toggle: await adminMenuItem(cookie, TOGGLE_ITEM),
      price: await adminMenuItem(cookie, PRICE_ITEM),
    }
    // Mulai dari keadaan yang diketahui: Milo tersedia.
    if (!original.toggle.isActive) await patchMenu(cookie, TOGGLE_ITEM, { isActive: true })
    driver = await buildDriver()
    await loginUi(driver)
  })

  // Kembalikan data yang diubah test, apa pun hasilnya.
  after(async function () {
    await patchMenu(cookie, TOGGLE_ITEM, { isActive: original.toggle.isActive })
    await patchMenu(cookie, PRICE_ITEM, { price: original.price.price, isActive: original.price.isActive })
    await quitDriver(driver)
  })

  it('Milo dibuat Habis: setelah reload, Milo tidak muncul di halaman pelanggan', async function () {
    await setSwitch(driver, false)
    assert.equal((await adminMenuItem(cookie, TOGGLE_ITEM)).isActive, false, 'Perubahan tidak tersimpan di server')
    await openCustomerMenu(driver)
    await waitAbsent(driver, byTestId(`menu-card-${TOGGLE_ITEM}`), 5000, 'Milo masih tampil di menu pelanggan')
  })

  it('Milo dikembalikan menjadi Tersedia: Milo muncul lagi', async function () {
    await setSwitch(driver, true)
    await openCustomerMenu(driver)
    await waitVisible(driver, byTestId(`menu-card-${TOGGLE_ITEM}`))
  })

  it('ubah harga lewat ✎: harga baru tampil di halaman pelanggan, lalu dikembalikan', async function () {
    const originalPrice = original.price.price
    const newPrice = originalPrice + 1000

    await editPrice(driver, newPrice)
    await openCustomerMenu(driver)
    assert.equal(await textOf(await driver.findElement(byTestId(`menu-price-${PRICE_ITEM}`))), rupiah(newPrice))

    await editPrice(driver, originalPrice)
    await openCustomerMenu(driver)
    assert.equal(await textOf(await driver.findElement(byTestId(`menu-price-${PRICE_ITEM}`))), rupiah(originalPrice))
  })

  it('harga berubah setelah masuk keranjang: halaman pembayaran memakai harga baru; menu habis dikeluarkan', async function () {
    const originalPrice = original.price.price
    const newPrice = originalPrice + 2000
    const { fee } = await publicMenu()

    await openCustomerMenu(driver)
    await clickTestId(driver, `menu-add-${PRICE_ITEM}`)
    const sheet = await waitVisible(driver, By.css('[role="dialog"]'))
    await click(driver, await sheet.findElement(byTestId('item-save')))
    await driver.wait(until.stalenessOf(sheet), 5000)

    await patchMenu(cookie, PRICE_ITEM, { price: newPrice })
    await driver.get(url('/payment'))
    await waitText(driver, byTestId('cart-sync-notice'), (text) => text.includes('Harga diperbarui'))
    await waitText(driver, byTestId('payment-total'), (text) => text === rupiah(newPrice + fee))

    await patchMenu(cookie, PRICE_ITEM, { price: originalPrice, isActive: false })
    await driver.navigate().refresh()
    await waitText(driver, byTestId('cart-sync-notice'), (text) => text.includes('Dikeluarkan dari keranjang'))
    assert.equal(await (await driver.findElement(byTestId('submit-order'))).isEnabled(), false, 'Tombol pesan masih aktif')
  })
})

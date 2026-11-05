import assert from 'node:assert/strict'
import { adminLogin, api, publicMenu, setStatus } from '../support/api.js'
import {
  By, buildDriver, byTestId, click, clickTestId, quitDriver, textOf, typeInto, until, waitUrl, waitVisible,
} from '../support/browser.js'
import { runId, url } from '../support/config.js'

// Urutan default = urutan GET /api/menu (kategori lalu item), lengkap dengan kategorinya.
const flatten = (menu) => menu.categories.flatMap((category) => category.items.map((item) => ({ ...item, categoryId: category.id })))

// Pesanan lewat rute kasir: ikut dihitung penjualan, tetapi tidak terkena batas pesanan per meja.
async function cashierOrder(cookie, items) {
  const result = await api('/admin/orders', {
    method: 'POST', cookie, headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: { tableNumber: '3', customer: { name: `E2E Terlaris ${runId}` }, items },
  })
  assert.equal(result.status, 201, result.text)
  return result.json.id
}

async function cardIds(driver, scope) {
  const cards = await driver.findElements(By.css(`${scope} [data-testid^="menu-card-"]`))
  return Promise.all(cards.map(async (card) => (await card.getAttribute('data-testid')).replace('menu-card-', '')))
}

async function openMenu(driver) {
  await driver.get(url('/?tableNumber=3'))
  await waitVisible(driver, byTestId('menu-search'))
  await driver.wait(async () => (await driver.findElements(By.css('[data-testid^="menu-card-"]'))).length > 0, 10000, 'Menu tidak termuat')
}

describe('K. Filter, pencarian, dan urutan menu', function () {
  let cookie
  let driver

  before(async function () {
    cookie = await adminLogin()
    // Data penjualan uji: teh 9 dan lychee-tea 6 (dihitung); coklat-milkshake 50 dibatalkan (tidak dihitung).
    await cashierOrder(cookie, [{ itemId: 'teh', qty: 9 }])
    await cashierOrder(cookie, [{ itemId: 'lychee-tea', qty: 6 }])
    const cancelled = await cashierOrder(cookie, [{ itemId: 'coklat-milkshake', qty: 50 }])
    assert.equal((await setStatus(cookie, cancelled, 'dibatalkan')).status, 200)
    driver = await buildDriver()
  })

  after(async function () {
    await quitDriver(driver)
  })

  it('API publik: hanya peringkat terlaris (1..n), tanpa angka penjualan', async function () {
    const response = await api('/menu')
    const items = flatten(response.json)
    for (const item of items) {
      assert.ok('bestSellerRank' in item, `${item.id} tanpa bestSellerRank`)
      assert.ok(item.bestSellerRank === null || Number.isInteger(item.bestSellerRank), `${item.id}: ${item.bestSellerRank}`)
    }
    const ranks = items.map((item) => item.bestSellerRank).filter((rank) => rank !== null).sort((a, b) => a - b)
    assert.deepEqual(ranks, ranks.map((_, index) => index + 1), 'Peringkat tidak berurutan 1..n')
    assert.doesNotMatch(response.text, /"(sold|qty|quantity|terjual|jumlah|count|totalSold)"/i, 'Respons memuat field jumlah penjualan')
  })

  it('urutan terlaris sesuai data pesanan uji (30 hari, tanpa pesanan dibatalkan)', async function () {
    const items = flatten(await publicMenu())
    const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10)
    const from = new Date(Date.now() + 7 * 3600 * 1000 - 29 * 86400 * 1000).toISOString().slice(0, 10)
    // Laporan admin (juga tanpa pesanan dibatalkan) sebagai sumber jumlah terjual.
    const report = (await api(`/admin/reports/sales?from=${from}&to=${today}`, { cookie })).json
    const sold = new Map(report.topItems.map((item) => [item.itemId, item.qty]))
    const expected = items
      .map((item, index) => ({ id: item.id, index, sold: sold.get(item.id) ?? 0 }))
      .filter((entry) => entry.sold > 0)
      .sort((a, b) => b.sold - a.sold || a.index - b.index)
      .map((entry) => entry.id)
    const actual = items.filter((item) => item.bestSellerRank).sort((a, b) => a.bestSellerRank - b.bestSellerRank).map((item) => item.id)
    assert.deepEqual(actual, expected)
    assert.ok(actual.includes('teh') && actual.includes('lychee-tea'), 'Pesanan uji tidak terhitung')
    assert.ok(!actual.includes('coklat-milkshake'), 'Pesanan dibatalkan ikut terhitung')

    // UI: urutan Terlaris = yang terjual sesuai peringkat, lalu sisanya dalam urutan default.
    await openMenu(driver)
    await driver.findElement(byTestId('menu-sort')).sendKeys('Terlaris')
    await waitVisible(driver, byTestId('menu-results'))
    const rest = items.filter((item) => !item.bestSellerRank).map((item) => item.id)
    assert.deepEqual(await cardIds(driver, '[data-testid="menu-results"]'), [...actual, ...rest])
  })

  it('kombinasi kategori + pencarian (huruf besar, nama/deskripsi) + urutan termahal', async function () {
    const items = flatten(await publicMenu())
    await openMenu(driver)
    await clickTestId(driver, 'category-filter-all-variant-drink')
    await typeInto(await driver.findElement(byTestId('menu-search')), 'CHOCO')
    await driver.findElement(byTestId('menu-sort')).sendKeys('Termahal')
    await waitVisible(driver, byTestId('menu-results'))

    const expected = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.categoryId === 'all-variant-drink'
        && `${item.name} ${item.desc ?? ''}`.toLowerCase().includes('choco'))
      .sort((a, b) => b.item.price - a.item.price || a.index - b.index)
      .map(({ item }) => item.id)
    assert.ok(expected.length >= 2, 'Data uji kurang')
    assert.deepEqual(await cardIds(driver, '[data-testid="menu-results"]'), expected)

    // Pencarian mencocokkan deskripsi: "creamy" hanya ada di deskripsi Mie Singapore.
    await clickTestId(driver, 'category-filter-semua')
    await driver.findElement(byTestId('menu-sort')).sendKeys('Urutan menu')
    await typeInto(await driver.findElement(byTestId('menu-search')), 'CREAMY')
    await driver.wait(async () => (await cardIds(driver, 'body')).join() === 'mie-singapore', 5000,
      `Hasil "CREAMY" bukan hanya mie-singapore: ${(await cardIds(driver, 'body')).join(', ')}`)
  })

  it('filter, pencarian, dan urutan tetap tersimpan setelah ke keranjang dan kembali', async function () {
    await openMenu(driver)
    await clickTestId(driver, 'category-filter-signature-drink')
    await typeInto(await driver.findElement(byTestId('menu-search')), 'te')
    await driver.findElement(byTestId('menu-sort')).sendKeys('Termurah')
    await waitVisible(driver, byTestId('menu-results'))
    const before = await cardIds(driver, '[data-testid="menu-results"]')

    await clickTestId(driver, `menu-add-${before[0]}`)
    const sheet = await waitVisible(driver, By.css('[role="dialog"]'))
    await click(driver, await sheet.findElement(byTestId('item-save')))
    await driver.wait(until.stalenessOf(sheet), 5000)
    await clickTestId(driver, 'cart-button')
    await waitUrl(driver, '/view-order')
    await click(driver, await driver.findElement(By.xpath('//a[contains(., "Tambah Item")]')))
    await waitVisible(driver, byTestId('menu-results'))

    assert.equal(await driver.findElement(byTestId('menu-search')).getAttribute('value'), 'te')
    assert.equal(await driver.findElement(byTestId('menu-sort')).getAttribute('value'), 'termurah')
    assert.equal(await driver.findElement(byTestId('category-filter-signature-drink')).getAttribute('aria-pressed'), 'true')
    assert.deepEqual(await cardIds(driver, '[data-testid="menu-results"]'), before)
  })

  it('pencarian tanpa hasil: keadaan kosong jelas, "Hapus filter" mengembalikan semua menu', async function () {
    await openMenu(driver)
    await typeInto(await driver.findElement(byTestId('menu-search')), 'zzzz')
    const empty = await waitVisible(driver, byTestId('menu-empty'))
    assert.match(await textOf(empty), /Tidak ada menu yang cocok dengan "zzzz"/)

    await clickTestId(driver, 'clear-filters')
    await driver.wait(async () => (await driver.findElements(byTestId('menu-empty'))).length === 0, 5000)
    assert.equal(await driver.findElement(byTestId('menu-search')).getAttribute('value'), '')
    assert.equal(await driver.findElement(byTestId('menu-sort')).getAttribute('value'), 'default')
    assert.equal(await driver.findElement(byTestId('category-filter-semua')).getAttribute('aria-pressed'), 'true')
    const total = flatten(await publicMenu()).length
    assert.equal((await cardIds(driver, 'body')).length, total)
  })
})

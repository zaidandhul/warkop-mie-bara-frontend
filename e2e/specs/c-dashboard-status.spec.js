import assert from 'node:assert/strict'
import { createOrder } from '../support/api.js'
import {
  By, DASHBOARD_WAIT, buildDriver, byTestId, click, column, loginUi, orderCard, quitDriver, textOf,
  waitAbsent, waitText, waitVisible,
} from '../support/browser.js'
import { runId, url } from '../support/config.js'

const cancelledCount = async (driver) =>
  Number(await (await driver.findElement(byTestId('toggle-cancelled'))).getAttribute('data-count'))

async function clickAction(driver, code, from, action) {
  const card = await waitVisible(driver, orderCard(code, column(from)), DASHBOARD_WAIT)
  await click(driver, await card.findElement(byTestId(`action-${action}`)))
}

describe('C. Status pesanan di dashboard', function () {
  let driver
  let completedCode
  let cancelledCode

  before(async function () {
    driver = await buildDriver()
    await loginUi(driver)
    await waitVisible(driver, By.css(column('menunggu')))
    // Tunggu pemuatan pertama selesai, supaya pesanan berikutnya terdeteksi sebagai "baru".
    await waitVisible(driver, By.xpath('//p[contains(., "Diperbarui")]'), DASHBOARD_WAIT)
  })

  after(async function () {
    await quitDriver(driver)
  })

  it('pesanan baru muncul di kolom Menunggu dengan label BARU dalam 20 detik', async function () {
    const order = await createOrder({
      name: `E2E Kanban ${runId}`,
      table: '7',
      items: [{ itemId: 'mie-bangladesh', qty: 1, options: { level: 1, toppings: [], note: 'E2E' } }],
    })
    completedCode = order.id
    const card = await waitVisible(driver, orderCard(completedCode, column('menunggu')), DASHBOARD_WAIT)
    assert.equal((await card.findElements(byTestId('badge-new'))).length, 1, 'Label BARU tidak tampil')
    assert.match(await textOf(card), /Meja 7/)
  })

  it('Proses → Siap → Selesai memindahkan kartu ke kolom yang sesuai', async function () {
    for (const [from, to] of [['menunggu', 'diproses'], ['diproses', 'siap'], ['siap', 'selesai']]) {
      await clickAction(driver, completedCode, from, to)
      await waitVisible(driver, orderCard(completedCode, column(to)))
      await waitAbsent(driver, orderCard(completedCode, column(from)), undefined, `Kartu masih di kolom ${from}`)
    }
  })

  it('pesanan kedua: Batalkan → Ya, batalkan masuk ke Dibatalkan dan hitungannya bertambah', async function () {
    const order = await createOrder({ name: `E2E Batal ${runId}`, table: '8', items: [{ itemId: 'milo', qty: 1 }] })
    cancelledCode = order.id
    await waitVisible(driver, orderCard(cancelledCode, column('menunggu')), DASHBOARD_WAIT)
    const before = await cancelledCount(driver)

    await clickAction(driver, cancelledCode, 'menunggu', 'dibatalkan')
    const card = await waitVisible(driver, orderCard(cancelledCode, column('menunggu')))
    await click(driver, await card.findElement(byTestId('confirm-cancel')))

    await waitAbsent(driver, orderCard(cancelledCode, column('menunggu')), undefined, 'Kartu masih di Menunggu')
    await driver.wait(async () => (await cancelledCount(driver)) === before + 1, 5000, 'Hitungan Dibatalkan tidak bertambah')
    await click(driver, await driver.findElement(byTestId('toggle-cancelled')))
    await waitVisible(driver, orderCard(cancelledCode, '[data-testid="cancelled-panel"]'))
  })

  it('halaman status pelanggan untuk pesanan yang dibatalkan menampilkan status terbaru', async function () {
    await driver.get(url(`/status/${cancelledCode}`))
    await waitText(driver, byTestId('status-title'), (text) => text === 'Pesanan dibatalkan')
    const notice = await waitVisible(driver, byTestId('status-cancelled'))
    assert.match(await textOf(notice), /hubungi kasir/)
    assert.equal((await driver.findElements(byTestId('status-steps'))).length, 0, 'Langkah progres masih tampil untuk pesanan dibatalkan')
  })

  it('halaman status pelanggan untuk pesanan yang selesai menampilkan "Selesai"', async function () {
    await driver.get(url(`/status/${completedCode}`))
    await waitVisible(driver, By.xpath('//p[contains(., "Total:")]')) // data pesanan sudah dimuat
    const page = await textOf(await driver.findElement(By.css('body')))
    assert.match(page, /Selesai/, `Halaman status tidak menampilkan "Selesai". Isi langkah: "${await textOf(await driver.findElement(byTestId('status-steps')))}"`)
    assert.equal(await (await driver.findElement(byTestId('status-step-selesai'))).getAttribute('aria-current'), 'step')
  })

  it('polling berhenti untuk status selesai/dibatalkan, tetap berjalan untuk pesanan aktif', async function () {
    // Jumlah request GET /api/orders/<kode> yang dikirim halaman dalam ~6 detik (polling tiap 5 detik).
    const pollsDuring = async (code) => {
      await driver.get(url(`/status/${code}`))
      await waitVisible(driver, By.xpath('//p[contains(., "Total:")]'))
      const count = () => driver.executeScript(
        'return performance.getEntriesByType("resource").filter((e) => e.name.includes("/api/orders/")).length'
      )
      const before = await count()
      await driver.sleep(6500)
      return (await count()) - before
    }
    assert.equal(await pollsDuring(completedCode), 0, 'Masih polling untuk pesanan selesai')
    assert.equal(await pollsDuring(cancelledCode), 0, 'Masih polling untuk pesanan dibatalkan')

    const active = await createOrder({ name: `E2E Polling ${runId}`, items: [{ itemId: 'milo', qty: 1 }] })
    assert.ok(await pollsDuring(active.id) >= 1, 'Tidak polling untuk pesanan yang masih menunggu')
    assert.equal(await (await driver.findElement(byTestId('status-page'))).getAttribute('data-polling'), 'true')
  })
})

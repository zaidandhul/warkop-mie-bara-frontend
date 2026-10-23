import assert from 'node:assert/strict'
import { By, buildDriver, byTestId, click, loginUi, quitDriver, textOf, waitText, waitUrl, waitVisible } from '../support/browser.js'
import { config, url } from '../support/config.js'

describe('A. Login admin', function () {
  let driver

  before(async function () {
    driver = await buildDriver()
  })

  after(async function () {
    await quitDriver(driver)
  })

  it('membuka /admin tanpa login diarahkan ke /admin/login', async function () {
    await driver.get(url('/admin'))
    await waitUrl(driver, '/admin/login')
  })

  it('password salah menampilkan pesan error', async function () {
    await loginUi(driver, `salah-${Date.now()}`)
    const alert = await waitVisible(driver, By.css('[role="alert"]'))
    assert.match(await textOf(alert), /Username atau password salah/)
    assert.match(await driver.getCurrentUrl(), /\/admin\/login$/)
  })

  it('login benar menampilkan "<username> · Admin", menu Pesanan dan Menu, serta "Suara aktif"', async function () {
    await loginUi(driver)
    const label = await waitText(driver, byTestId('staff-label'), (text) => text.length > 0)
    assert.equal(label, `${config.adminUser} · Admin`)
    await waitVisible(driver, By.xpath('//header//nav//a[normalize-space()="Pesanan"]'))
    await waitVisible(driver, By.xpath('//header//nav//a[normalize-space()="Menu"]'))
    const sound = await waitVisible(driver, byTestId('sound-status'))
    assert.match(await textOf(sound), /Suara aktif/)
  })

  it('logout lalu membuka /admin kembali diarahkan ke login', async function () {
    await click(driver, await waitVisible(driver, byTestId('logout')))
    await waitUrl(driver, '/admin/login')
    await driver.get(url('/admin'))
    await waitUrl(driver, '/admin/login')
  })
})

import assert from 'node:assert/strict'
import { adminLogin, api } from '../support/api.js'
import { By, buildDriver, byTestId, click, clickTestId, loginUi, quitDriver, typeInto, waitText, waitVisible } from '../support/browser.js'
import { config, runId } from '../support/config.js'

const username = `e2e-staf-${runId.toLowerCase()}`
const uiUsername = `e2e-ui-${runId.toLowerCase()}`
const firstPassword = `Awal-${runId}-sandi`

async function loginAs(name, password) {
  const result = await api('/auth/login', { method: 'POST', body: { username: name, password } })
  const cookie = result.headers.getSetCookie?.().find((c) => c.startsWith('mb_staff='))?.split(';')[0]
  return { status: result.status, cookie, staff: result.json?.staff }
}

describe('M. Kelola staf', function () {
  let adminCookie
  let staffId
  let driver

  before(async function () {
    adminCookie = await adminLogin()
  })

  after(async function () {
    const list = (await api('/admin/staff', { cookie: adminCookie })).json?.staff ?? []
    for (const member of list.filter((m) => [username, uiUsername].includes(m.username) && m.isActive)) {
      await api(`/admin/staff/${member.id}`, { method: 'PATCH', cookie: adminCookie, body: { isActive: false } })
    }
    await quitDriver(driver)
  })

  it('admin membuat staf; staf bisa login tetapi tidak bisa mengelola staf (403)', async function () {
    const created = await api('/admin/staff', { method: 'POST', cookie: adminCookie, body: { username, password: firstPassword, isAdmin: false } })
    assert.equal(created.status, 201, created.text)
    assert.equal(created.json.isAdmin, false)
    staffId = created.json.id
    assert.equal((await api('/admin/staff', { method: 'POST', cookie: adminCookie, body: { username, password: firstPassword } })).status, 409)
    assert.equal((await api('/admin/staff', { method: 'POST', cookie: adminCookie, body: { username: 'x y', password: 'pendek' } })).status, 400)

    const staf = await loginAs(username, firstPassword)
    assert.equal(staf.status, 200)
    assert.equal(staf.staff.isAdmin, false)
    assert.equal((await api('/admin/staff', { cookie: staf.cookie })).status, 403)
    assert.equal((await api('/admin/orders', { cookie: staf.cookie })).status, 200, 'staf tetap bisa memakai dashboard')
  })

  it('staf ganti password sendiri: wajib password lama; sesi lain berakhir, sesi ini tetap', async function () {
    const sessionA = await loginAs(username, firstPassword)
    const sessionB = await loginAs(username, firstPassword)
    const wrong = await api('/admin/me/password', { method: 'POST', cookie: sessionA.cookie, body: { currentPassword: 'salah-salah', newPassword: 'BaruSekali-123' } })
    assert.equal(wrong.status, 400)
    assert.match(wrong.json.error, /Password lama salah/)

    const changed = await api('/admin/me/password', { method: 'POST', cookie: sessionA.cookie, body: { currentPassword: firstPassword, newPassword: 'BaruSekali-123' } })
    assert.equal(changed.status, 204)
    const renewed = changed.headers.getSetCookie().find((c) => c.startsWith('mb_staff=')).split(';')[0]
    assert.equal((await api('/admin/me', { cookie: renewed })).status, 200, 'sesi yang mengganti password tetap login')
    assert.equal((await api('/admin/me', { cookie: sessionB.cookie })).status, 401, 'sesi lain berakhir')
    assert.equal((await loginAs(username, firstPassword)).status, 401)
    assert.equal((await loginAs(username, 'BaruSekali-123')).status, 200)
  })

  it('admin reset password staf (sesi lama berakhir), lalu menonaktifkan staf (login ditolak)', async function () {
    const oldSession = await loginAs(username, 'BaruSekali-123')
    assert.equal((await api(`/admin/staff/${staffId}/password`, { method: 'POST', cookie: adminCookie, body: { password: 'DariAdmin-456' } })).status, 204)
    assert.equal((await api('/admin/me', { cookie: oldSession.cookie })).status, 401)
    assert.equal((await loginAs(username, 'DariAdmin-456')).status, 200)

    const disabled = await api(`/admin/staff/${staffId}`, { method: 'PATCH', cookie: adminCookie, body: { isActive: false } })
    assert.equal(disabled.status, 200)
    assert.equal(disabled.json.isActive, false)
    assert.equal((await loginAs(username, 'DariAdmin-456')).status, 401)
  })

  it('admin tidak bisa menonaktifkan atau menurunkan dirinya sendiri', async function () {
    const me = (await api('/admin/me', { cookie: adminCookie })).json.staff
    for (const body of [{ isActive: false }, { isAdmin: false }]) {
      const result = await api(`/admin/staff/${me.id}`, { method: 'PATCH', cookie: adminCookie, body })
      assert.equal(result.status, 400)
      assert.match(result.json.error, /akun sendiri/)
    }
  })

  it('UI: admin menambah staf lewat halaman Staf; menu Staf tidak tampil untuk staf biasa', async function () {
    driver = await buildDriver()
    await loginUi(driver)
    await driver.get(`${config.baseUrl}/admin/staf`)
    await typeInto(await waitVisible(driver, byTestId('staff-new-username')), uiUsername)
    await typeInto(await driver.findElement(byTestId('staff-new-password')), firstPassword)
    await clickTestId(driver, 'staff-add')
    await waitText(driver, byTestId('staff-notice'), (text) => text.includes(`Akun "${uiUsername}" dibuat`))
    await waitVisible(driver, byTestId(`staff-row-${uiUsername}`))

    await click(driver, await driver.findElement(byTestId('logout')))
    await loginUi(driver, firstPassword, uiUsername)
    await waitText(driver, byTestId('staff-label'), (text) => text.endsWith('· Staf'))
    assert.equal((await driver.findElements(By.xpath('//nav//a[normalize-space()="Staf"]'))).length, 0)
  })

  it('UI: halaman Akun memeriksa ulangi password, lalu mengganti password staf', async function () {
    await click(driver, await driver.findElement(byTestId('staff-label')))
    const fill = async (current, next, repeat) => {
      await typeInto(await waitVisible(driver, byTestId('account-current')), current)
      await typeInto(await driver.findElement(byTestId('account-new')), next)
      await typeInto(await driver.findElement(byTestId('account-repeat')), repeat)
      await clickTestId(driver, 'account-submit')
    }
    await fill(firstPassword, 'GantiDariUI-789', 'Beda-sekali-789')
    await waitText(driver, byTestId('account-message'), (text) => text.includes('Ulangi password baru'))
    await fill(firstPassword, 'GantiDariUI-789', 'GantiDariUI-789')
    await waitText(driver, byTestId('account-message'), (text) => text.includes('berhasil diganti'))
    assert.equal((await loginAs(uiUsername, 'GantiDariUI-789')).status, 200)
  })
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterMenu } from '../../src/store/menuViewStore.js'
import { keyOf, normalizeTableNumber, useCartStore } from '../../src/store/cartStore.js'
import { priceFor, rupiah } from '../../src/utils/price.js'

const categories = [
  { id: 'mie', name: 'Mie', items: [
    { id: 'mie-a', name: 'Mie Pedas', desc: 'Kuah creamy', price: 13000, bestSellerRank: 2 },
    { id: 'mie-b', name: 'Mie Goreng', desc: null, price: 10000, bestSellerRank: null },
  ] },
  { id: 'minum', name: 'Minuman', items: [
    { id: 'teh', name: 'Teh', desc: 'Manis', price: 5000, bestSellerRank: 1 },
    { id: 'kopi', name: 'Kopi', desc: 'Pahit', price: 10000, bestSellerRank: null },
  ] },
]
const ids = (view) => (view.grouped ? view.sections.flatMap((s) => s.items) : view.items).map((item) => item.id)

test('filterMenu: urutan default per kategori; pencarian nama/deskripsi tanpa beda huruf besar/kecil', () => {
  const all = filterMenu(categories, { categoryId: '', query: '', sort: 'default' })
  assert.equal(all.grouped, true)
  assert.deepEqual(ids(all), ['mie-a', 'mie-b', 'teh', 'kopi'])
  assert.deepEqual(ids(filterMenu(categories, { categoryId: '', query: 'CREAMY', sort: 'default' })), ['mie-a'])
  assert.deepEqual(ids(filterMenu(categories, { categoryId: 'minum', query: 'e', sort: 'default' })), ['teh'])
  assert.equal(filterMenu(categories, { categoryId: '', query: 'zzz', sort: 'default' }).count, 0)
})

test('filterMenu: termurah/termahal lintas kategori, seri ikut urutan default; terlaris tanpa data di belakang', () => {
  assert.deepEqual(ids(filterMenu(categories, { categoryId: '', query: '', sort: 'termurah' })), ['teh', 'mie-b', 'kopi', 'mie-a'])
  assert.deepEqual(ids(filterMenu(categories, { categoryId: '', query: '', sort: 'termahal' })), ['mie-a', 'mie-b', 'kopi', 'teh'])
  assert.deepEqual(ids(filterMenu(categories, { categoryId: '', query: '', sort: 'terlaris' })), ['teh', 'mie-a', 'mie-b', 'kopi'])
  assert.equal(filterMenu(categories, { categoryId: '', query: '', sort: 'termurah' }).grouped, false)
})

test('priceFor dan rupiah', () => {
  const toppings = [{ id: 'telur', price: 3500 }]
  assert.equal(priceFor({ price: 13000 }, { level: 2, toppings: ['telur'] }, toppings, 1000), 17500)
  assert.equal(priceFor({ price: 13000 }, { toppings: ['tidak-ada'] }, toppings), 13000)
  assert.equal(rupiah(17500), 'Rp17.500')
})

test('normalizeTableNumber dan keyOf (konfigurasi sama digabung, urutan topping tidak berpengaruh)', () => {
  assert.equal(normalizeTableNumber(' 07 '), '7')
  assert.equal(normalizeTableNumber('12', 10), null)
  assert.equal(keyOf({ id: 'mie' }, { level: 2, toppings: ['sosis', 'telur'] }), keyOf({ id: 'mie' }, { level: 2, toppings: ['telur', 'sosis'] }))
  assert.notEqual(keyOf({ id: 'mie' }, { note: 'pedas' }), keyOf({ id: 'mie' }, { note: '' }))
})

test('syncWithMenu: harga dihitung ulang, item habis/opsi tidak sah dibuang, meja di luar tableCount dikosongkan', () => {
  const store = useCartStore
  store.setState({ tableNumber: '12', lines: [] })
  store.getState().add({ id: 'mie-a', name: 'Mie Pedas', price: 12000 }, { level: 2, toppings: ['telur'] }, 15500)
  store.getState().add({ id: 'hilang', name: 'Menu Lama', price: 8000 }, {}, 8000)
  store.getState().add({ id: 'mie-b', name: 'Mie Goreng', price: 10000 }, { level: 9 }, 10000)
  const menu = {
    categories: [{ id: 'mie', items: [
      { id: 'mie-a', name: 'Mie Pedas', price: 13000, levels: [1, 2], options: [], toppings: ['telur'] },
      { id: 'mie-b', name: 'Mie Goreng', price: 10000, levels: [1, 2], options: [], toppings: [] },
    ] }],
    toppings: [{ id: 'telur', price: 3500 }], levelPriceStep: 1000, fee: 2000, tableCount: 10,
  }
  const changes = store.getState().syncWithMenu(menu)
  assert.deepEqual(changes, { removed: ['Menu Lama', 'Mie Goreng'], repriced: ['Mie Pedas'] })
  const state = store.getState()
  assert.deepEqual(state.lines.map((line) => [line.item.id, line.unitPrice]), [['mie-a', 17500]])
  assert.equal(state.fee, 2000)
  assert.equal(state.tableNumber, null)
  assert.equal(state.grandTotal(), 19500)
})

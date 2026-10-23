// Sumber: foto menu fisik Warkop Mie Bara. Harga dalam rupiah.
// Item bertanda `check: true` = harga dari foto yang kurang jelas, cek ulang.

export const LEVELS = [1, 2, 3, 4]
export const LEVEL_PRICE_STEP = 0 // TODO: isi tambahan harga per level (menu: "Tambah Level Tambah Harga")

export const TOPPINGS = [
  { id: 'telur', name: 'Telur (rebus/goreng)', price: 3500 },
  { id: 'sosis', name: 'Sosis', price: 3000 },
]

const m = (id, name, price, extra = {}) => ({ id, name, price, ...extra })
const mie = (id, name, price, desc, extra = {}) =>
  m(id, name, price, { desc, levels: LEVELS, toppings: TOPPINGS.map((t) => t.id), ...extra })

export const CATEGORIES = [
  {
    id: 'varian-mie', name: 'Varian Mie Bara',
    items: [
      mie('mie-bangladesh', 'Mie Bangladesh', 13000, 'Bumbu mie instan, rempah khas Medan, dan chilli oil Warkop Mie Bara. Nyemek, medok, gurih, nagih.', { bestSeller: true }),
      mie('mie-palestine', 'Mie Palestine', 13000, 'Bumbu mie instan dan sambal Palestine yang super pedas, gurih, dan nendang.'),
      mie('mie-pakistan', 'Mie Pakistan', 10000, 'Bumbu mie instan dan sambal Pakistan, pedas pas dan sensasional.'),
      mie('mie-singapore', 'Mie Singapore', 10000, 'Mie berkuah creamy kental dan chilli oil, pedas dan gurih.'),
      mie('mie-prindavan', 'Mie Prindavan', 10000, 'Bumbu mie instan kuah, bumbu Prindavan, dan topping sayur segar.'),
      mie('mie-china', 'Mie China', 10000, 'Bumbu mie instan dan pedasnya chilli oil yang gurih dan nagih.'),
      mie('mie-indonesia', 'Mie Indonesia', 10000, 'Mie goreng khas Indonesia dengan kualitas rasa Nusantara.'),
    ],
  },
  {
    id: 'special', name: 'Special Menu',
    items: [m('bakmie-bara', 'Bakmie Bara', 18000), m('seblak-nusantara', 'Seblak Nusantara', 16000), m('nasi-bara-bere', 'Nasi Bara-Bere', 10000)],
  },
  {
    id: 'bara-nusantara', name: 'Bara Nusantara',
    items: [
      m('ayam-nusantara', 'Ayam Nusantara', 13000), m('lele-nusantara', 'Lele Nusantara', 12000),
      m('ayam-rempah', 'Ayam Rempah Ketumbar', 17000), m('lele-rempah', 'Lele Rempah Ketumbar', 15000),
      m('nasi', 'Nasi', 4000), m('sambal-penyet', 'Sambal Penyet', 3000),
      m('tempe-goreng', 'Tempe Goreng', 2000), m('tahu-goreng', 'Tahu Goreng', 2000),
    ],
  },
  {
    id: 'camilan', name: 'Camilan Bara',
    items: [
      m('siomay-ayam-sosis', 'Siomay Ayam Sosis', 16000, { check: true }), m('siomay-ayam-udang', 'Siomay Ayam Udang', 16000, { check: true }),
      m('tim-tahu', 'Tim Tahu', 17000, { check: true }), m('lumpia-ayam-udang', 'Lumpia Ayam Udang', 17000, { check: true }),
      m('cakwe-ayam-udang', 'Cakwe Ayam Udang', 15000, { check: true }), m('bola-rambutan', 'Bola Rambutan', 17000, { check: true }),
      m('siomay-au-spesial', 'Siomay Ayam Udang Spesial', 15000, { check: true }), m('siomay-as-spesial', 'Siomay Ayam Sosis Spesial', 15000, { check: true }),
      m('siomay-crabstik', 'Siomay Crabstik Spesial', 15000, { check: true }), m('siomay-jamur', 'Siomay Jamur Spesial', 15000, { check: true }),
      m('gyoza-spesial', 'Gyoza Spesial', 15000, { check: true }), m('bola-udang-spesial', 'Bola Udang Spesial', 15000, { check: true }),
      m('basreng', 'Basreng Chilli Oil', 7000), m('cireng-co', 'Cireng Chilli Oil', 9000), m('cibay-co', 'Cibay Chilli Oil', 8000),
      m('cilok-moza', 'Cilok Moza Chilli Oil', 7000), m('wonton-co', 'Wonton Chilli Oil', 8000),
      m('mendoan', 'Mendoan', 2000), m('cemal-cemil', 'Cemal Cemil', 2500), m('pisang-cokelat', 'Pisang Cokelat', 10000),
      m('risoles', 'Risoles', 10000), m('cireng-salju', 'Cireng Salju', 10000),
      m('french-fries', 'French Fries', 9000), m('sosis-ceria', 'Sosis Ceria', 9000),
    ],
  },
  {
    id: 'signature-drink', name: 'Signature Drink',
    items: [
      m('vanilla-latte', 'Vanilla Latte', 15000, { cold: true }), m('kopi-susu-aren', 'Kopi Susu Gula Aren', 14000, { cold: true }),
      m('lychee-tea', 'Lychee Tea', 13000, { cold: true }), m('lychee-ice', 'Lychee Ice', 12000, { cold: true }),
      m('teh-tarik', 'Teh Tarik', 12000, { cold: true }), m('coklat-milkshake', 'Coklat Milkshake', 12000, { cold: true }),
      m('choco-drink', 'Choco Drink', 9000, { cold: true }),
    ],
  },
  {
    id: 'all-variant-drink', name: 'All Variant Drink',
    items: [
      m('teh', 'Teh', 5000), m('milo', 'Milo', 7000), m('chocolatos-coklat', 'Chocolatos Coklat', 7000), m('chocolatos-matcha', 'Chocolatos Matcha', 7000),
      m('beng-beng', 'Drink Beng-Beng', 7000), m('gd-cappucino', 'Good Day Cappucino', 7000), m('gd-freeze', 'Good Day Freeze', 7000),
      m('josua', 'Josua', 7000, { check: true }), m('extra-joss', 'Extra Joss', 6000, { check: true }),
      m('nutrisari-jeruk', 'Nutri Sari Jeruk', 6000, { check: true }), m('nutrisari-milky', 'Nutri Sari Milky Orange', 6000, { check: true }),
      m('kopi-hitam', 'Kopi Hitam', 5000), m('kopi-susu', 'Kopi Susu', 7000), m('es-kopi-susu', 'Es Kopi Susu', 9000),
      m('kopi-jahe', 'Kopi Jahe', 6000), m('jahe-susu', 'Jahe Susu', 6000), m('wedang-jahe', 'Wedang Jahe', 5000),
      m('dancow', 'Dancow (Putih/Coklat)', 8000, { options: ['Putih', 'Coklat'] }),
      m('energen', 'Energen (Vanilla/Coklat)', 7000, { options: ['Vanilla', 'Coklat'] }),
      m('susu', 'Susu (Putih/Coklat)', 5000, { options: ['Putih', 'Coklat'] }),
      m('luwak-white', 'Luwak White Coffee', 7000),
    ],
  },
]

// ---- helper harga & opsi ----
export const OTHER_FEE = 0 // TODO: biaya lain (jika ada). Baris "Biaya lain" otomatis tampil bila > 0
export const rupiah = (n) => 'Rp' + n.toLocaleString('id-ID')
export const isConfigurable = (i) => Boolean(i.levels || i.options)
export const priceFor = (item, o = {}, toppingCatalog = TOPPINGS, levelPriceStep = LEVEL_PRICE_STEP) =>
  item.price +
  (o.level ? (o.level - 1) * levelPriceStep : 0) +
  (o.toppings ?? []).reduce((s, id) => s + (toppingCatalog.find((t) => t.id === id)?.price ?? 0), 0)
export const describeOpts = (o = {}) =>
  [o.level && `Level ${o.level}`, o.variant, ...(o.toppings ?? []).map((id) => TOPPINGS.find((t) => t.id === id)?.name)]
    .filter(Boolean)
    .join(' · ')

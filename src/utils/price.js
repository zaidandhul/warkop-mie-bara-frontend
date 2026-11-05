// Format Rupiah dan perkiraan harga di klien. Harga resmi selalu dihitung ulang oleh server.
export const rupiah = (n) => 'Rp' + n.toLocaleString('id-ID')

// Harga satuan item dengan opsi: harga dasar + (level - 1) * kenaikan per level + harga topping.
// toppingCatalog dan levelPriceStep berasal dari GET /api/menu.
export const priceFor = (item, o = {}, toppingCatalog = [], levelPriceStep = 0) =>
  item.price +
  (o.level ? (o.level - 1) * levelPriceStep : 0) +
  (o.toppings ?? []).reduce((s, id) => s + (toppingCatalog.find((t) => t.id === id)?.price ?? 0), 0)

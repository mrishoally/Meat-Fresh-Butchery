/**
 * Factory functions for Product and Order entities
 */

/**
 * Creates a unique identifier (falls back to random string if crypto.randomUUID isn't available)
 * @returns {string}
 */
export function generateId(prefix = '') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    const uuid = crypto.randomUUID();
    return prefix ? `${prefix}_${uuid.slice(0, 8)}` : uuid;
  }
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return prefix ? `${prefix}_${time}_${rand}` : `${time}_${rand}`;
}

/**
 * Creates a new Product entity
 * @param {Object} data
 * @param {string} data.name
 * @param {string} [data.description]
 * @param {number} data.price
 * @param {number} data.quantity
 * @param {string} [data.category]
 * @param {string} [data.imageUrl]
 * @param {string} [data.id]
 * @returns {Object} Product object
 */
export function createProduct({
  id,
  name,
  description = '',
  price,
  quantity,
  category = 'General',
  imageUrl = '',
  createdAt,
}) {
  return {
    id: id || generateId('prod'),
    name: String(name).trim(),
    description: String(description || '').trim(),
    price: Math.max(0, Number(price) || 0),
    quantity: Math.max(0, parseInt(quantity, 10) || 0),
    category: String(category || 'General').trim(),
    imageUrl: String(imageUrl || '').trim(),
    createdAt: createdAt || new Date().toISOString(),
  };
}

/**
 * Creates a new Pre-Order entity
 * @param {Object} data
 * @param {string} data.customerName
 * @param {string} data.contact
 * @param {Array<{ productId: string, name: string, qty: number, priceEach: number }>} data.items
 * @param {string} [data.notes]
 * @param {string} [data.status]
 * @returns {Object} Order object
 */
export function createOrder({
  id,
  customerName,
  contact,
  items = [],
  notes = '',
  status = 'pending',
  createdAt,
}) {
  const total = items.reduce((sum, item) => sum + (Number(item.priceEach) || 0) * (Number(item.qty) || 0), 0);
  return {
    id: id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: String(customerName).trim(),
    contact: String(contact).trim(),
    notes: String(notes || '').trim(),
    items: items.map(item => ({
      productId: item.productId,
      name: item.name,
      qty: Number(item.qty),
      priceEach: Number(item.priceEach),
    })),
    total,
    status: status === 'fulfilled' ? 'fulfilled' : 'pending',
    createdAt: createdAt || new Date().toISOString(),
  };
}

/**
 * Returns default sample products reflecting Nyama Fresh Butchery
 * @returns {Array<Object>}
 */
export function getSampleProducts() {
  return [
    createProduct({
      id: 'prod_1',
      name: "T-Bone Steak (Nyama ya Ng'ombe)",
      description: "Steki nene safi ya ng'ombe yenye mfupa wa T. Inafaa kuchoma au kukaanga.",
      price: 18000,
      quantity: 12,
      category: "Nyama ya Ng'ombe",
      imageUrl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80",
    }),
    createProduct({
      id: 'prod_2',
      name: "Mbuzi Choma Cut (Mguu & Mbavu)",
      description: "Nyama laini ya mbuzi kijana, iliyokatwa tayari kwa supu au nyama choma ya wikendi.",
      price: 22000,
      quantity: 4, // Low stock example (< 5)
      category: "Nyama ya Mbuzi",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    }),
    createProduct({
      id: 'prod_3',
      name: "Kuku wa Kienyeji (Mzima aliyesafishwa)",
      description: "Kuku safi wa kienyeji aliyekatwa na kusafishwa tayari kupikwa.",
      price: 25000,
      quantity: 8,
      category: "Kuku wa Kienyeji",
      imageUrl: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80",
    }),
    createProduct({
      id: 'prod_4',
      name: "Maini Safi ya Ng'ombe (1kg)",
      description: "Maini laini na yenye virutubisho vingi, fresh kutoka machinjioni asubuhi.",
      price: 16000,
      quantity: 2, // Low stock example
      category: "Nyama ya Ng'ombe",
      imageUrl: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80",
    }),
    createProduct({
      id: 'prod_5',
      name: "Mkia wa Ng'ombe (Oxtail)",
      description: "Mkia mnono wa ng'ombe uliokatwa vipande vipande kwa ajili ya supu mzito na rosti.",
      price: 24000,
      quantity: 0, // Out of stock example
      category: "Oda Maalumu",
      imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80",
    }),
    createProduct({
      id: 'prod_6',
      name: "Nyama ya Kusaga (Beef Mince 1kg)",
      description: "Nyama laini iliyosagwa vizuri bila mafuta mengi kwa ajili ya sambusa, burger au pasta.",
      price: 15000,
      quantity: 15,
      category: "Nyama ya Ng'ombe",
      imageUrl: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=600&q=80",
    }),
  ];
}

/**
 * Returns default sample pre-orders for demo testing
 * @returns {Array<Object>}
 */
export function getSampleOrders() {
  return [
    createOrder({
      id: 'ORD-9201',
      customerName: 'Juma Shabani',
      contact: '0712345678',
      notes: 'Tafadhali katia vipande vidogo vya supu. Nitachukua saa 11 jioni.',
      items: [
        { productId: 'prod_2', name: 'Mbuzi Choma Cut (Mguu & Mbavu)', qty: 2, priceEach: 22000 },
        { productId: 'prod_1', name: "T-Bone Steak (Nyama ya Ng'ombe)", qty: 1, priceEach: 18000 },
      ],
      status: 'pending',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    }),
    createOrder({
      id: 'ORD-8942',
      customerName: 'Amina Salum',
      contact: 'amina.salum@gmail.com',
      notes: 'M-Pesa payment on collection.',
      items: [
        { productId: 'prod_3', name: 'Kuku wa Kienyeji (Mzima aliyesafishwa)', qty: 1, priceEach: 25000 },
      ],
      status: 'fulfilled',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }),
  ];
}

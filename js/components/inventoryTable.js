/**
 * Inventory Table & Mobile Card List Component for Admin Dashboard
 * Fully responsive across desktops, tablets, and mobile devices
 */
import { createEl } from '../utils/dom.js';
import { formatCurrency } from '../utils/format.js';

export function renderInventoryTable(products, dispatch) {
  if (!products || products.length === 0) {
    return createEl('div', { className: 'empty-table-state' }, [
      createEl('span', { className: 'material-symbols-outlined empty-icon' }, ['inventory_2']),
      createEl('h3', { className: 'text-lg font-bold' }, ['Hakuna bidhaa kwenye orodha']),
      createEl('p', { className: 'text-sm text-neutral-500' }, ['Bofya kitufe cha "+ Ongeza Bidhaa Mpya" kuanza.']),
    ]);
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=120&q=80';

  // Helper to generate status badge
  function getStatusBadge(prod) {
    const isOut = prod.quantity <= 0;
    const isLow = prod.quantity > 0 && prod.quantity < 5;
    if (isOut) {
      return createEl('span', { className: 'badge badge--out-of-stock' }, ['Imeisha (0)']);
    } else if (isLow) {
      return createEl('span', { className: 'badge badge--low-stock' }, [`Zimebaki ${prod.quantity} kg`]);
    } else {
      return createEl('span', { className: 'badge badge--in-stock' }, ['Ipo ya Kutosha']);
    }
  }

  // =========================================================================
  // 1. Desktop & Tablet Table (Visible on screens >= 768px)
  // =========================================================================
  const thead = createEl('thead', {}, [
    createEl('tr', {}, [
      createEl('th', {}, ['Bidhaa (Product)']),
      createEl('th', {}, ['Aina (Category)']),
      createEl('th', {}, ['Bei (Price)']),
      createEl('th', {}, ['Kiasi (Stock)']),
      createEl('th', {}, ['Hali (Status)']),
      createEl('th', { className: 'text-right' }, ['Vitendo (Actions)']),
    ]),
  ]);

  const tbody = createEl('tbody', {},
    products.map(prod => {
      const isOut = prod.quantity <= 0;
      const statusBadge = getStatusBadge(prod);

      return createEl('tr', { className: isOut ? 'row--dimmed' : '' }, [
        // Product info
        createEl('td', {}, [
          createEl('div', { className: 'flex items-center gap-3' }, [
            createEl('img', {
              src: prod.imageUrl || fallbackImage,
              alt: prod.name,
              className: 'table-thumb',
              onError: (e) => { e.target.src = fallbackImage; },
            }),
            createEl('div', {}, [
              createEl('div', { className: 'font-bold text-sm' }, [prod.name]),
              createEl('div', { className: 'text-xs text-neutral-500 line-clamp-1 max-w-xs' }, [
                prod.description || 'Hakuna maelezo'
              ]),
            ]),
          ]),
        ]),

        // Category
        createEl('td', {}, [
          createEl('span', { className: 'category-pill' }, [prod.category || 'General']),
        ]),

        // Price
        createEl('td', { className: 'font-semibold' }, [formatCurrency(prod.price)]),

        // Quantity
        createEl('td', { className: 'font-bold' }, [`${prod.quantity} kg/units`]),

        // Status
        createEl('td', {}, [statusBadge]),

        // Actions
        createEl('td', { className: 'text-right' }, [
          createEl('div', { className: 'flex items-center justify-end gap-2' }, [
            createEl('button', {
              type: 'button',
              className: 'btn-icon-subtle',
              title: 'Hariri (Edit Product)',
              onClick: () => dispatch({ type: 'OPEN_PRODUCT_MODAL', payload: prod }),
            }, [
              createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['edit'])
            ]),
            createEl('button', {
              type: 'button',
              className: 'btn-icon-subtle text-danger',
              title: 'Futa (Delete Product)',
              onClick: () => {
                if (window.confirm(`Una uhakika unataka kufuta "${prod.name}" kutoka kwenye orodha?`)) {
                  dispatch({ type: 'DELETE_PRODUCT', payload: { id: prod.id } });
                }
              },
            }, [
              createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['delete'])
            ]),
          ]),
        ]),
      ]);
    })
  );

  const desktopTable = createEl('div', { className: 'table-responsive inventory-table-desktop' }, [
    createEl('table', { className: 'data-table' }, [thead, tbody]),
  ]);

  // =========================================================================
  // 2. Mobile-Optimized Inventory Cards (Visible on screens < 768px)
  // =========================================================================
  const mobileCards = createEl('div', { className: 'inventory-cards-mobile' },
    products.map(prod => {
      const isOut = prod.quantity <= 0;
      const statusBadge = getStatusBadge(prod);

      return createEl('div', {
        className: `inventory-mobile-card ${isOut ? 'inventory-mobile-card--out' : ''}`,
      }, [
        createEl('div', { className: 'flex items-start gap-3' }, [
          createEl('img', {
            src: prod.imageUrl || fallbackImage,
            alt: prod.name,
            className: 'inventory-mobile-card__img',
            onError: (e) => { e.target.src = fallbackImage; },
          }),
          createEl('div', { className: 'flex-1 min-w-0' }, [
            createEl('div', { className: 'flex items-center justify-between gap-1 flex-wrap' }, [
              createEl('h4', { className: 'font-bold text-sm text-slate-900 truncate' }, [prod.name]),
              createEl('span', { className: 'category-pill text-[10px]' }, [prod.category || 'Nyama']),
            ]),
            createEl('p', { className: 'text-xs text-neutral-500 line-clamp-1 mt-0.5' }, [
              prod.description || 'Hakuna maelezo'
            ]),
            createEl('div', { className: 'flex items-center justify-between mt-2 pt-1 border-t border-neutral-100 flex-wrap gap-2' }, [
              createEl('div', { className: 'flex items-baseline gap-1.5' }, [
                createEl('span', { className: 'text-sm font-extrabold text-primary font-heading' }, [
                  formatCurrency(prod.price)
                ]),
                createEl('span', { className: 'text-[11px] text-neutral-500 font-semibold' }, [
                  `• Stoo: ${prod.quantity} kg`
                ]),
              ]),
              statusBadge,
            ]),
          ]),
        ]),

        // Mobile Action Row
        createEl('div', { className: 'inventory-mobile-card__actions' }, [
          createEl('button', {
            type: 'button',
            className: 'btn btn--secondary btn--sm flex-1',
            onClick: () => dispatch({ type: 'OPEN_PRODUCT_MODAL', payload: prod }),
          }, [
            createEl('span', { className: 'material-symbols-outlined text-[16px]' }, ['edit']),
            createEl('span', {}, ['Hariri']),
          ]),
          createEl('button', {
            type: 'button',
            className: 'btn btn--secondary btn--sm text-danger',
            title: 'Futa',
            onClick: () => {
              if (window.confirm(`Una uhakika unataka kufuta "${prod.name}"?`)) {
                dispatch({ type: 'DELETE_PRODUCT', payload: { id: prod.id } });
              }
            },
          }, [
            createEl('span', { className: 'material-symbols-outlined text-[16px]' }, ['delete']),
          ]),
        ]),
      ]);
    })
  );

  return createEl('div', { className: 'inventory-container' }, [
    desktopTable,
    mobileCards,
  ]);
}

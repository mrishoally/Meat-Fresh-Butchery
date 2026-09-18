/**
 * Modern High-Craft Product Card Component for Customer Storefront
 */
import { createEl } from '../utils/dom.js';
import { formatCurrency } from '../utils/format.js';

export function renderProductCard(product, dispatch) {
  const isOutOfStock = product.quantity <= 0;
  const isLowStock = product.quantity > 0 && product.quantity < 5;

  let stockBadge;
  if (isOutOfStock) {
    stockBadge = createEl('span', { className: 'badge badge--out-of-stock shadow-sm' }, ['Imeisha (Out of Stock)']);
  } else if (isLowStock) {
    stockBadge = createEl('span', { className: 'badge badge--low-stock shadow-sm animate-pulse' }, [
      `Zimebaki ${product.quantity} kg tu!`
    ]);
  } else {
    stockBadge = createEl('span', { className: 'badge badge--in-stock shadow-sm' }, [
      `✓ Ipo Stoo (${product.quantity} kg)`
    ]);
  }

  const fallbackImage = 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80';

  const imageEl = createEl('div', { className: 'product-card__image-wrap relative overflow-hidden' }, [
    createEl('img', {
      src: product.imageUrl || fallbackImage,
      alt: product.name,
      className: 'product-card__image transition-transform duration-500 hover:scale-105',
      loading: 'lazy',
      onError: (e) => { e.target.src = fallbackImage; },
    }),
    createEl('div', { className: 'product-card__badge-overlay absolute top-3 left-3 flex flex-col gap-1.5' }, [
      stockBadge,
    ]),
    createEl('div', { className: 'absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-900 border border-amber-200/60 shadow-xs' }, [
      '★ Halal 100%'
    ]),
  ]);

  const bodyEl = createEl('div', { className: 'product-card__body p-5 flex flex-col gap-3 flex-1' }, [
    createEl('div', { className: 'flex items-center justify-between' }, [
      createEl('span', { className: 'category-pill text-xs font-bold text-primary bg-red-50 px-2.5 py-1 rounded-full border border-red-100' }, [
        product.category || 'Nyama Safi'
      ]),
      createEl('span', { className: 'text-[11px] text-neutral-400 font-medium' }, ['Chilled Fresh']),
    ]),

    createEl('h3', { className: 'product-card__title text-lg font-bold text-slate-900 font-heading leading-snug' }, [
      product.name
    ]),

    createEl('p', { className: 'product-card__desc text-xs text-neutral-600 line-clamp-2 leading-relaxed flex-1' }, [
      product.description || 'Nyama safi ya kiwango cha juu, iliyoandaliwa kwa usafi wa hali ya juu kaunta.'
    ]),

    createEl('div', { className: 'product-card__footer pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto' }, [
      createEl('div', { className: 'product-card__price-wrap flex flex-col' }, [
        createEl('span', { className: 'text-[10px] uppercase font-bold text-neutral-400 tracking-wider' }, ['Bei ya Kilo']),
        createEl('div', { className: 'flex items-baseline gap-1' }, [
          createEl('span', { className: 'product-card__price text-xl font-extrabold text-slate-900 font-heading' }, [
            formatCurrency(product.price)
          ]),
          createEl('span', { className: 'text-xs text-neutral-500 font-semibold' }, ['/ kg']),
        ]),
      ]),

      createEl('button', {
        className: `btn btn--sm ${isOutOfStock ? 'btn--disabled opacity-50 cursor-not-allowed' : 'btn--primary'} product-card__btn font-heading font-bold shadow-sm`,
        disabled: isOutOfStock,
        onClick: () => {
          if (!isOutOfStock) {
            dispatch({ type: 'ADD_TO_CART', payload: { productId: product.id, qty: 1 } });
          }
        },
      }, [
        createEl('span', { className: 'material-symbols-outlined text-[17px]' }, [
          isOutOfStock ? 'block' : 'shopping_bag'
        ]),
        createEl('span', {}, [isOutOfStock ? 'Zimeisha' : '+ Weka Kapuni']),
      ]),
    ]),
  ]);

  return createEl('article', {
    className: `product-card ${isOutOfStock ? 'product-card--out-of-stock opacity-90' : ''} bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-slate-300`,
    dataset: { productId: product.id },
  }, [imageEl, bodyEl]);
}

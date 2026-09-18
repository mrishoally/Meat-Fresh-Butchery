/**
 * Customer Storefront View
 */
import { createEl, clearEl, qs } from '../utils/dom.js';
import { formatCurrency, formatDate } from '../utils/format.js';
import { renderProductCard } from '../components/productCard.js';
import { renderCartDrawer } from '../components/cart.js';
import { renderToast } from '../components/toast.js';

// Attach global '/' shortcut listener once
if (typeof window !== 'undefined' && !window._searchKeydownAttached) {
  window._searchKeydownAttached = true;
  window.addEventListener('keydown', (e) => {
    if (
      e.key === '/' &&
      document.activeElement?.tagName !== 'INPUT' &&
      document.activeElement?.tagName !== 'TEXTAREA'
    ) {
      e.preventDefault();
      const input = document.getElementById('header-search-input');
      if (input) {
        input.focus();
        input.select();
      }
    }
  });
}

export function renderCustomerView(state, dispatch) {
  const root = document.getElementById('app');
  if (!root) return;

  // Preserve search input focus & cursor position across state re-renders
  const activeEl = document.activeElement;
  const isSearchFocused = activeEl && activeEl.id === 'header-search-input';
  const cursorStart = isSearchFocused ? activeEl.selectionStart : null;
  const cursorEnd = isSearchFocused ? activeEl.selectionEnd : null;

  clearEl(root);

  const { inventory, cart, searchQuery, selectedCategory, latestOrder, toast, settings } = state;
  const currentCurrency = settings?.currency || 'TZS';

  // Cart totals
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.priceEach * item.qty, 0);

  // 1. Navigation Header
  const searchInput = createEl('input', {
    id: 'header-search-input',
    type: 'text',
    className: 'header-search-input',
    placeholder: "Tafuta nyama ya mbuzi, ng'ombe, au kuku...",
    value: searchQuery,
    autocomplete: 'off',
    onInput: (e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value }),
  });

  // Clear button or Kbd shortcut badge
  const searchActionEl = searchQuery
    ? createEl('button', {
        type: 'button',
        className: 'header-search-clear',
        title: 'Futa utafutaji (Clear)',
        onClick: () => {
          dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
          setTimeout(() => {
            const el = document.getElementById('header-search-input');
            if (el) el.focus();
          }, 0);
        },
      }, ['✕'])
    : createEl('kbd', { className: 'header-search-kbd', title: 'Bonyeza / kutafuta' }, ['/']);

  const nav = createEl('header', { className: 'store-header' }, [
    createEl('div', { className: 'store-header__inner container' }, [
      // Logo
      createEl('a', {
        href: '#/shop',
        className: 'brand-logo',
      }, [
        createEl('span', { className: 'brand-logo__icon' }, ['🥩']),
        createEl('div', {}, [
          createEl('span', { className: 'brand-logo__title' }, [settings?.storeName || 'Nyama Fresh']),
          createEl('span', { className: 'brand-logo__tag' }, [settings?.storeTagline || 'Butchery Kariakoo']),
        ]),
      ]),

      // Search bar
      createEl('div', { className: 'header-search-wrap' }, [
        createEl('span', { className: 'material-symbols-outlined search-icon' }, ['search']),
        searchInput,
        searchActionEl,
      ]),

      // Actions (Auth / Profile + Admin link for staff + Cart button)
      createEl('div', { className: 'header-actions' }, [
        settings?.isAuthenticated ? createEl('div', { className: 'flex items-center gap-2' }, [
          createEl('div', { className: 'px-2.5 py-1 bg-rose-900/10 border border-rose-900/20 text-rose-950 rounded-full text-xs font-extrabold flex items-center gap-1' }, [
            createEl('span', { className: 'material-symbols-outlined text-[15px]' }, ['person']),
            `${settings.currentStaffName || 'Mteja'}`
          ]),
          createEl('button', {
            type: 'button',
            className: 'btn btn--ghost text-xs px-2.5 py-1 text-rose-900 hover:bg-rose-50',
            title: 'Toka kwenye akaunti',
            onClick: () => {
              dispatch({
                type: 'UPDATE_SETTINGS',
                payload: { isAuthenticated: false, currentRole: 'customer', currentStaffName: '', currentUserEmail: '', userType: 'guest' }
              });
              dispatch({
                type: 'SHOW_TOAST',
                payload: { message: 'Umeondoka kwenye akaunti yako kikamilifu.', type: 'info', id: Date.now() }
              });
              window.location.hash = '#/login';
            }
          }, [
            createEl('span', { className: 'material-symbols-outlined text-[16px]' }, ['logout']),
            createEl('span', { className: 'hidden sm:inline' }, ['Toka']),
          ])
        ]) : createEl('a', {
          href: '#/login',
          className: 'btn btn--ghost header-auth-link',
          title: 'Ingia kwenye Akaunti',
        }, [
          createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['login']),
          createEl('span', { className: 'hidden md:inline' }, ['Ingia']),
        ]),

        // Show Admin Portal button ONLY if logged in as staff (not customer)
        settings?.isAuthenticated && settings?.currentRole !== 'customer' ? createEl('a', {
          href: '#/admin',
          className: 'btn btn--ghost header-admin-link',
          title: 'Nenda kwenye Dashibodi ya Staff',
        }, [
          createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['storefront']),
          createEl('span', { className: 'hidden md:inline' }, ['Staff Portal']),
        ]) : null,

        createEl('button', {
          type: 'button',
          className: 'btn btn--primary header-cart-btn',
          onClick: () => dispatch({ type: 'TOGGLE_CART', payload: true }),
        }, [
          createEl('span', { className: 'material-symbols-outlined text-[20px]' }, ['shopping_bag']),
          createEl('span', { className: 'cart-badge' }, [String(cartItemCount)]),
          createEl('span', { className: 'hidden sm:inline font-bold ml-1' }, [
            cartSubtotal > 0 ? formatCurrency(cartSubtotal, currentCurrency) : 'Kapu'
          ]),
        ]),
      ]),
    ]),
  ]);

  // 2. Luxury 2-Column Hero Section
  const branches = settings?.branches || [];
  const activeBranch = branches.find(b => b.id === settings?.activeBranchId) || branches[0] || { name: 'Kariakoo Main Duka' };
  const waContact = settings?.storeWhatsapp || '255712345678';
  const cleanWa = waContact.replace(/[^0-9]/g, '');

  const hero = createEl('section', { className: 'hero-section' }, [
    createEl('div', { className: 'container hero-content-grid' }, [
      // Left Column: Editorial Pitch
      createEl('div', { className: 'hero-text flex flex-col gap-3.5' }, [
        createEl('div', { className: 'hero-badge' }, [
          createEl('span', { className: 'pulse-dot' }),
          createEl('span', {}, [`${activeBranch.name} • Mzigo Mpya wa Leo`]),
        ]),
        createEl('h1', { className: 'hero-title' }, [
          'Nyama Safi ya Kuchagua — ',
          createEl('span', { className: 'text-primary-accent' }, ['Pre-Order Bila Malipo ya Awali']),
        ]),
        createEl('p', { className: 'hero-subtitle' }, [
          `Tenga vipande bora vya nyama ya ng'ombe, mbuzi, na kuku wa kienyeji mapema. Duka linakuhifadhia kwenye ubaridi safi (-4°C) bila malipo ya awali hadi utakapofika kuchukua.`
        ]),
        createEl('div', { className: 'hero-pills' }, [
          createEl('div', { className: 'feature-pill' }, [
            createEl('span', { className: 'material-symbols-outlined text-success' }, ['verified']),
            createEl('span', {}, ['Zero Upfront Payment']),
          ]),
          createEl('div', { className: 'feature-pill' }, [
            createEl('span', { className: 'material-symbols-outlined text-info' }, ['ac_unit']),
            createEl('span', {}, ['Chilled Cold-Chain']),
          ]),
          createEl('div', { className: 'feature-pill' }, [
            createEl('span', { className: 'material-symbols-outlined text-amber-700' }, ['workspace_premium']),
            createEl('span', {}, ['100% Halal & TBS']),
          ]),
        ]),
      ]),

      // Right Column: Live Counter Interactive Showcase Card
      createEl('div', { className: 'hero-counter-card animate-scale-in' }, [
        createEl('div', { className: 'flex items-center justify-between border-b border-slate-100 pb-3' }, [
          createEl('div', { className: 'flex items-center gap-2' }, [
            createEl('span', { className: 'text-2xl' }, ['🥩']),
            createEl('div', {}, [
              createEl('h3', { className: 'font-bold text-sm text-slate-900 font-heading leading-tight' }, [
                settings?.storeName || 'Nyama Fresh Butchery'
              ]),
              createEl('span', { className: 'text-[11px] text-neutral-500 font-semibold flex items-center gap-1' }, [
                createEl('span', { className: 'text-primary' }, ['📍']),
                `${activeBranch.name}`
              ]),
            ]),
          ]),
          createEl('span', { className: 'badge badge--in-stock text-[10px]' }, ['Kaunta Iko Wazi']),
        ]),

        createEl('div', { className: 'grid grid-cols-2 gap-3 py-1' }, [
          createEl('div', { className: 'p-2.5 bg-slate-50 rounded-xl border border-slate-100' }, [
            createEl('span', { className: 'text-[10px] text-neutral-500 uppercase font-bold tracking-wide block' }, ['Katalogi ya Leo']),
            createEl('span', { className: 'text-lg font-extrabold text-slate-900 font-heading' }, [`${inventory.length} Aina`]),
            createEl('span', { className: 'text-[10px] text-emerald-700 font-semibold block' }, ['Zilizopo stoo']),
          ]),
          createEl('div', { className: 'p-2.5 bg-slate-50 rounded-xl border border-slate-100' }, [
            createEl('span', { className: 'text-[10px] text-neutral-500 uppercase font-bold tracking-wide block' }, ['Masaa ya Leo']),
            createEl('span', { className: 'text-xs font-extrabold text-slate-900 font-heading' }, ['06:30 - 20:00']),
            createEl('span', { className: 'text-[10px] text-neutral-500 font-semibold block' }, ['Kila Siku']),
          ]),
        ]),

        createEl('div', { className: 'flex items-center justify-between gap-2 pt-1' }, [
          createEl('a', {
            href: `https://wa.me/${cleanWa}?text=${encodeURIComponent('Habari Nyama Fresh, nahitaji kuulizia upatikanaji wa nyama leo.')}`,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'btn btn--secondary btn--sm flex-1 text-emerald-800 border-emerald-200 hover:bg-emerald-50',
          }, [
            createEl('span', { className: 'material-symbols-outlined text-[16px] text-emerald-600' }, ['chat']),
            createEl('span', {}, ['WhatsApp Kaunta']),
          ]),
          createEl('button', {
            type: 'button',
            className: 'btn btn--primary btn--sm flex-1',
            onClick: () => {
              const el = document.getElementById('header-search-input');
              if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth' }); }
            },
          }, [
            createEl('span', { className: 'material-symbols-outlined text-[16px]' }, ['shopping_bag']),
            createEl('span', {}, ['Agiza Nyama']),
          ]),
        ]),
      ]),
    ]),
  ]);

  // 3. Category Filter Tabs & Search Indicator
  const categories = [
    'All',
    "Nyama ya Ng'ombe",
    "Nyama ya Mbuzi",
    "Kuku wa Kienyeji",
    "Oda Maalumu",
  ];

  // Filter products
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = inventory.filter(prod => {
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesSearch =
      !normalizedQuery ||
      (prod.name && prod.name.toLowerCase().includes(normalizedQuery)) ||
      (prod.description && prod.description.toLowerCase().includes(normalizedQuery)) ||
      (prod.category && prod.category.toLowerCase().includes(normalizedQuery));
    return matchesCategory && matchesSearch;
  });

  const categoryBar = createEl('div', { className: 'category-bar container' }, [
    createEl('div', { className: 'category-pills-list' },
      categories.map(cat => createEl('button', {
        type: 'button',
        className: `cat-pill ${selectedCategory === cat ? 'cat-pill--active' : ''}`,
        onClick: () => dispatch({ type: 'SET_CATEGORY', payload: cat }),
      }, [cat === 'All' ? 'Nyama Zote' : cat]))
    ),
  ]);

  // Optional search indicator banner when active
  let searchStatusBanner = null;
  if (normalizedQuery) {
    searchStatusBanner = createEl('div', { className: 'container search-status-banner' }, [
      createEl('span', { className: 'text-sm text-neutral-600' }, [
        `Umetafuta: `,
        createEl('strong', { className: 'text-slate-900' }, [`"${searchQuery}"`]),
        ` (${filteredProducts.length} matokeo yamepatikana)`
      ]),
      createEl('button', {
        type: 'button',
        className: 'btn btn--ghost btn--sm text-primary font-bold',
        onClick: () => dispatch({ type: 'SET_SEARCH_QUERY', payload: '' }),
      }, ['✕ Ondoa Utafutaji']),
    ]);
  }

  // 4. Product Catalog Grid
  let productContent;
  if (filteredProducts.length === 0) {
    productContent = createEl('div', { className: 'empty-catalog container' }, [
      createEl('span', { className: 'material-symbols-outlined text-5xl text-neutral-400' }, ['search_off']),
      createEl('h3', { className: 'text-lg font-bold mt-3' }, ['Hakuna bidhaa inayolingana na utafutaji wako']),
      createEl('p', { className: 'text-sm text-neutral-500 max-w-md mt-1' }, [
        `Hakuna kipande cha nyama kilichopatikana kwa "${searchQuery}". Jaribu neno lingine au badilisha kundi la nyama.`
      ]),
      createEl('button', {
        type: 'button',
        className: 'btn btn--primary mt-4',
        onClick: () => {
          dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
          dispatch({ type: 'SET_CATEGORY', payload: 'All' });
        },
      }, ['Onyesha Nyama Zote']),
    ]);
  } else {
    productContent = createEl('div', { className: 'container products-grid' },
      filteredProducts.map(p => renderProductCard(p, dispatch))
    );
  }

  // 5. Order Confirmation Receipt Modal (if an order was just placed)
  let receiptModal = null;
  if (latestOrder) {
    receiptModal = renderReceiptModal(latestOrder, dispatch, currentCurrency);
  }

  // 6. Cart Drawer
  const cartDrawer = renderCartDrawer(state, dispatch);

  // 7. Toast
  const toastEl = renderToast(toast, dispatch);

  // Main Container
  const main = createEl('main', { className: 'customer-main' }, [
    hero,
    categoryBar,
    searchStatusBanner,
    productContent,
  ]);

  // Footer (Clean, professional, without the unwanted phrase)
  const footer = createEl('footer', { className: 'store-footer' }, [
    createEl('div', { className: 'container store-footer__inner' }, [
      createEl('div', {}, [
        createEl('h4', { className: 'font-bold text-base text-slate-900' }, [
          settings?.storeName || 'Nyama Fresh Butchery'
        ]),
        createEl('p', { className: 'text-xs text-neutral-500 mt-1' }, [
          `${settings?.storeTagline || 'Kariakoo Msimbazi, Dar es Salaam'} • Simu: ${settings?.storePhone || '0712 345 678'} • ${settings?.openingHours || 'Jumanne - Jumapili 06:00 - 19:00'}`
        ]),
      ]),
      createEl('div', { className: 'flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200' }, [
        createEl('span', { className: 'material-symbols-outlined text-[16px] text-success' }, ['verified']),
        createEl('span', {}, ['Uhakiki wa Ubora 100% (Halal & TBS Certified)']),
      ]),
    ]),
  ]);

  root.appendChild(nav);
  root.appendChild(main);
  root.appendChild(footer);
  if (cartDrawer) root.appendChild(cartDrawer);
  if (receiptModal) root.appendChild(receiptModal);
  if (toastEl) root.appendChild(toastEl);

  // Restore focus & cursor position if search was focused
  if (isSearchFocused) {
    const newSearchEl = document.getElementById('header-search-input');
    if (newSearchEl) {
      newSearchEl.focus();
      if (cursorStart !== null && cursorEnd !== null) {
        newSearchEl.setSelectionRange(cursorStart, cursorEnd);
      }
    }
  }
}

/**
 * Renders the order receipt/confirmation modal
 */
function renderReceiptModal(order, dispatch, currency = 'TZS') {
  const backdrop = createEl('div', { className: 'modal-backdrop' });

  const modal = createEl('div', { className: 'modal-dialog receipt-dialog animate-scale-in' }, [
    // Header
    createEl('div', { className: 'receipt-header' }, [
      createEl('div', { className: 'receipt-success-icon' }, ['✓']),
      createEl('h2', { className: 'receipt-title' }, ['Oda Yako Imepokelewa!']),
      createEl('p', { className: 'receipt-subtitle' }, [
        'Asante! Nyama yako imetengwa tayari kutoka kwenye mzigo wa leo.'
      ]),
    ]),

    // Voucher card
    createEl('div', { className: 'receipt-card' }, [
      createEl('div', { className: 'receipt-card__top' }, [
        createEl('span', { className: 'receipt-id' }, [`#${order.id}`]),
        createEl('span', { className: 'text-xs text-neutral-500' }, [formatDate(order.createdAt)]),
      ]),
      createEl('div', { className: 'receipt-card__customer' }, [
        createEl('strong', {}, [order.customerName]),
        createEl('span', { className: 'text-xs text-neutral-600' }, [` (${order.contact})`]),
      ]),
      createEl('hr', { className: 'receipt-divider' }),
      createEl('div', { className: 'receipt-items' },
        order.items.map(item => createEl('div', { className: 'receipt-item-row' }, [
          createEl('span', {}, [`${item.qty}x ${item.name}`]),
          createEl('span', { className: 'font-bold' }, [formatCurrency(item.priceEach * item.qty, currency)]),
        ]))
      ),
      createEl('hr', { className: 'receipt-divider' }),
      createEl('div', { className: 'receipt-total-row' }, [
        createEl('span', { className: 'font-bold' }, ['Jumla ya Kulipa Dukani:']),
        createEl('span', { className: 'receipt-total-price' }, [formatCurrency(order.total, currency)]),
      ]),
    ]),

    // Instructions
    createEl('div', { className: 'receipt-notice' }, [
      createEl('span', { className: 'material-symbols-outlined text-primary' }, ['storefront']),
      createEl('span', { className: 'text-xs text-slate-800' }, [
        'Onyesha namba hii ya oda ukifika dukani Kariakoo ili uchukue nyama yako na ukamilishe malipo.'
      ]),
    ]),

    // Actions
    createEl('div', { className: 'modal-actions mt-4' }, [
      createEl('button', {
        type: 'button',
        className: 'btn btn--primary btn--full',
        onClick: () => dispatch({ type: 'DISMISS_CONFIRMATION' }),
      }, ['Funga & Endelea na Ununuzi (Done)']),
    ]),
  ]);

  backdrop.appendChild(modal);
  return backdrop;
}

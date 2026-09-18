/**
 * Modern Stylish Pre-Orders Management Component for Admin
 * Inspired by Stitch Butchery Operations Design
 */
import { createEl } from '../utils/dom.js';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/format.js';

/**
 * Extract 2-letter initials from customer name
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  if (!name) return 'NF';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Clean phone number for tel/wa.me link
 * @param {string} phone
 * @returns {string}
 */
function cleanPhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '255' + cleaned.slice(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Export orders array to CSV file
 * @param {Array} orders
 */
function exportOrdersToCSV(orders) {
  if (!orders || orders.length === 0) return;
  const headers = ['Order ID', 'Customer Name', 'Phone', 'Items Count', 'Total TZS', 'Status', 'Notes', 'Created At'];
  const rows = orders.map(o => [
    o.id,
    `"${(o.customerName || '').replace(/"/g, '""')}"`,
    `"${o.contact || ''}"`,
    o.items ? o.items.reduce((s, i) => s + i.qty, 0) : 0,
    o.total,
    o.status,
    `"${(o.notes || '').replace(/"/g, '""')}"`,
    o.createdAt
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `nyamafresh_oda_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function renderOrderList(orders, state, dispatch) {
  const currency = state?.settings?.currency || 'TZS';
  const filterStatus = state?.orderFilterStatus || 'all';
  const searchQuery = (state?.orderSearchQuery || '').trim().toLowerCase();

  // 1. Calculate Metrics
  const totalOrdersCount = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const fulfilledOrders = orders.filter(o => o.status === 'fulfilled');
  const pendingCount = pendingOrders.length;
  const fulfilledCount = fulfilledOrders.length;
  const pendingTotal = pendingOrders.reduce((sum, o) => sum + o.total, 0);
  const fulfilledTotal = fulfilledOrders.reduce((sum, o) => sum + o.total, 0);

  // 2. Filter Orders
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (filterStatus === 'pending' && order.status !== 'pending') return false;
    if (filterStatus === 'fulfilled' && order.status !== 'fulfilled') return false;

    // Search query filter
    if (searchQuery) {
      const matchId = order.id && order.id.toLowerCase().includes(searchQuery);
      const matchName = order.customerName && order.customerName.toLowerCase().includes(searchQuery);
      const matchContact = order.contact && order.contact.toLowerCase().includes(searchQuery);
      const matchNotes = order.notes && order.notes.toLowerCase().includes(searchQuery);
      const matchItems = order.items && order.items.some(i => i.name && i.name.toLowerCase().includes(searchQuery));
      return matchId || matchName || matchContact || matchNotes || matchItems;
    }
    return true;
  });

  // Preserve search input focus across renders
  const activeEl = document.activeElement;
  const isOrderSearchFocused = activeEl && activeEl.id === 'admin-order-search-input';
  const cursorStart = isOrderSearchFocused ? activeEl.selectionStart : null;
  const cursorEnd = isOrderSearchFocused ? activeEl.selectionEnd : null;

  // Root container
  const container = createEl('div', { className: 'order-management-wrapper flex flex-col gap-6' });

  // =========================================================================
  // A. Top Ambient Banner & Metric Ribbon (Stitch Screen 6)
  // =========================================================================
  const topBanner = createEl('div', { className: 'order-ambient-banner' }, [
    createEl('div', { className: 'order-ambient-banner__inner' }, [
      // Left: Operational Title & Badge
      createEl('div', { className: 'flex items-start gap-3.5' }, [
        createEl('div', { className: 'order-ambient-icon-box' }, [
          createEl('span', { className: 'material-symbols-outlined text-[26px]' }, ['inventory_2']),
        ]),
        createEl('div', {}, [
          createEl('div', { className: 'flex items-center gap-2 flex-wrap mb-0.5' }, [
            createEl('span', { className: 'order-ops-chip' }, [`${state?.settings?.storeTagline || 'Kariakoo Msimbazi'} • Butchery Ops`]),
            createEl('span', { className: 'ops-dot' }),
            createEl('span', { className: 'text-xs text-neutral-500 font-semibold' }, ['Kitengo cha Maandalizi']),
          ]),
          createEl('h1', { className: 'order-page-title' }, ['Foleni ya Oda za Pre-Order']),
          createEl('p', { className: 'order-page-subtitle' }, [
            'Fuatilia, thibitisha, na ukamilishe maombi ya wateja walioweka akiba ya nyama kabla hawajafika dukani.'
          ]),
        ]),
      ]),

      // Right: 3 Quick Metric Bento Badges
      createEl('div', { className: 'order-metric-ribbon' }, [
        // Metric 1: Pending Count
        createEl('div', { className: 'order-metric-badge order-metric-badge--pending' }, [
          createEl('span', { className: 'metric-pulse-dot' }),
          createEl('span', { className: 'font-bold uppercase tracking-wide text-xs' }, [
            `Leo: ${pendingCount} Zinazosubiri`
          ]),
        ]),

        // Metric 2: Queue Value
        createEl('div', { className: 'order-metric-card' }, [
          createEl('span', { className: 'order-metric-label' }, ['Thamani ya Foleni']),
          createEl('span', { className: 'order-metric-numeral text-primary' }, [formatCurrency(pendingTotal, currency)]),
        ]),

        // Metric 3: Fulfilled Value
        createEl('div', { className: 'order-metric-card' }, [
          createEl('span', { className: 'order-metric-label text-success' }, [`Zilizokamilika (${fulfilledCount})`]),
          createEl('span', { className: 'order-metric-numeral text-success' }, [formatCurrency(fulfilledTotal, currency)]),
        ]),
      ]),
    ]),
  ]);

  container.appendChild(topBanner);

  // =========================================================================
  // B. Interactive Action Bar & Filter Toolbar
  // =========================================================================
  const filterTabs = createEl('div', { className: 'order-filter-tabs' }, [
    createEl('button', {
      type: 'button',
      className: `order-tab-pill ${filterStatus === 'all' ? 'order-tab-pill--active' : ''}`,
      onClick: () => dispatch({ type: 'SET_ORDER_FILTER_STATUS', payload: 'all' }),
    }, [
      createEl('span', {}, ['Oda Zote']),
      createEl('span', { className: 'order-tab-count' }, [String(totalOrdersCount)]),
    ]),

    createEl('button', {
      type: 'button',
      className: `order-tab-pill ${filterStatus === 'pending' ? 'order-tab-pill--active' : ''}`,
      onClick: () => dispatch({ type: 'SET_ORDER_FILTER_STATUS', payload: 'pending' }),
    }, [
      createEl('span', { className: 'tab-status-dot bg-amber-500' }),
      createEl('span', {}, ['Zinazosubiri']),
      createEl('span', { className: 'order-tab-count' }, [String(pendingCount)]),
    ]),

    createEl('button', {
      type: 'button',
      className: `order-tab-pill ${filterStatus === 'fulfilled' ? 'order-tab-pill--active' : ''}`,
      onClick: () => dispatch({ type: 'SET_ORDER_FILTER_STATUS', payload: 'fulfilled' }),
    }, [
      createEl('span', { className: 'tab-status-dot bg-emerald-500' }),
      createEl('span', {}, ['Zilizokamilika']),
      createEl('span', { className: 'order-tab-count' }, [String(fulfilledCount)]),
    ]),
  ]);

  const quickUtilities = createEl('div', { className: 'order-quick-utilities' }, [
    createEl('button', {
      type: 'button',
      className: 'btn btn--secondary btn--sm',
      title: 'Sajili Oda ya Simu au Kaunta',
      onClick: () => dispatch({ type: 'OPEN_MANUAL_ORDER_MODAL' }),
    }, [
      createEl('span', { className: 'material-symbols-outlined text-[18px] text-primary' }, ['add_circle']),
      createEl('span', {}, ['+ Sajili Oda ya Simu']),
    ]),

    createEl('button', {
      type: 'button',
      className: 'btn btn--secondary btn--sm',
      title: 'Pakua Orodha kama CSV',
      onClick: () => exportOrdersToCSV(orders),
    }, [
      createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['download']),
      createEl('span', {}, ['Hamisha CSV']),
    ]),

    createEl('button', {
      type: 'button',
      className: 'btn btn--secondary btn--sm',
      title: 'Chapisha Orodha ya Maandalizi ya Leo',
      onClick: () => window.print(),
    }, [
      createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['print']),
      createEl('span', {}, ['Chapisha']),
    ]),
  ]);

  const toolbar = createEl('div', { className: 'order-toolbar-card' }, [
    filterTabs,
    quickUtilities,
  ]);

  container.appendChild(toolbar);

  // =========================================================================
  // C. Live Search & Location Indicators
  // =========================================================================
  const searchInput = createEl('input', {
    id: 'admin-order-search-input',
    type: 'text',
    className: 'order-live-search-input',
    placeholder: "Tafuta kwa jina la mteja, simu, au namba ya oda (#NF-...)...",
    value: state?.orderSearchQuery || '',
    autocomplete: 'off',
    onInput: (e) => dispatch({ type: 'SET_ORDER_SEARCH_QUERY', payload: e.target.value }),
  });

  const searchClearBtn = searchQuery ? createEl('button', {
    type: 'button',
    className: 'order-search-clear-btn',
    title: 'Futa utafutaji',
    onClick: () => {
      dispatch({ type: 'SET_ORDER_SEARCH_QUERY', payload: '' });
      setTimeout(() => {
        const el = document.getElementById('admin-order-search-input');
        if (el) el.focus();
      }, 0);
    },
  }, ['✕']) : null;

  const searchBarWrap = createEl('div', { className: 'order-search-row' }, [
    createEl('div', { className: 'order-search-input-wrap' }, [
      createEl('span', { className: 'material-symbols-outlined text-neutral-400 text-[20px] pointer-events-none' }, ['search']),
      searchInput,
      searchClearBtn,
    ]),

    createEl('div', { className: 'order-info-chip' }, [
      createEl('span', { className: 'material-symbols-outlined text-amber-700 text-[18px]' }, ['calendar_today']),
      createEl('div', { className: 'flex flex-col text-left leading-tight' }, [
        createEl('span', { className: 'text-[9px] uppercase font-bold text-neutral-500' }, ['Kipindi']),
        createEl('span', { className: 'text-xs font-bold text-slate-800' }, [
          `Leo (${formatDate(new Date().toISOString()).split(',')[0] || 'Leo'})`
        ]),
      ]),
    ]),

    createEl('div', { className: 'order-info-chip' }, [
      createEl('span', { className: 'material-symbols-outlined text-primary text-[18px]' }, ['storefront']),
      createEl('div', { className: 'flex flex-col text-left leading-tight' }, [
        createEl('span', { className: 'text-[9px] uppercase font-bold text-neutral-500' }, ['Kituo']),
        createEl('span', { className: 'text-xs font-bold text-slate-800' }, [
          state?.settings?.storeTagline?.split(',')[0] || 'Kariakoo'
        ]),
      ]),
    ]),
  ]);

  container.appendChild(searchBarWrap);

  // =========================================================================
  // D. Active Orders Cards Grid
  // =========================================================================
  if (filteredOrders.length === 0) {
    const emptyBox = createEl('div', { className: 'order-empty-state' }, [
      createEl('div', { className: 'order-empty-state__icon-wrap' }, [
        createEl('span', { className: 'material-symbols-outlined text-[42px] text-neutral-400' }, ['receipt_long']),
      ]),
      createEl('h3', { className: 'text-lg font-bold text-slate-800 mt-2' }, [
        searchQuery || filterStatus !== 'all' ? 'Hakuna oda inayolingana na vigezo ulivyochagua' : 'Hakuna oda zilizopokelewa bado'
      ]),
      createEl('p', { className: 'text-sm text-neutral-500 max-w-md mt-1' }, [
        searchQuery || filterStatus !== 'all'
          ? 'Jaribu kufuta utafutaji au kubadili kichujio cha oda kuona rekodi zote.'
          : 'Wateja wanapoweka oda kupitia duka la mtandaoni au ukisajili oda ya simu, zitaonekana hapa moja kwa moja.'
      ]),
      (searchQuery || filterStatus !== 'all') ? createEl('button', {
        type: 'button',
        className: 'btn btn--secondary btn--sm mt-4',
        onClick: () => {
          dispatch({ type: 'SET_ORDER_FILTER_STATUS', payload: 'all' });
          dispatch({ type: 'SET_ORDER_SEARCH_QUERY', payload: '' });
        },
      }, ['Onyesha Oda Zote']) : null,
    ]);

    container.appendChild(emptyBox);
  } else {
    const ordersGrid = createEl('div', { className: 'order-cards-list' },
      filteredOrders.map(order => {
        const isPending = order.status === 'pending';
        const rawPhone = order.contact || '';
        const cleanPhoneNum = cleanPhone(rawPhone);

        // Customizable WhatsApp Notification Template
        const template = state?.settings?.whatsappTemplate || 'Habari {customer}, oda yako ya nyama #{orderId} kutoka {storeName} ({branch}) ipo tayari kwa ajili ya kuchukuliwa! Jumla ni {total}. Karibu sana!';
        const formattedMsg = template
          .replace('{customer}', order.customerName || 'Mteja')
          .replace('{orderId}', order.id)
          .replace('{storeName}', state?.settings?.storeName || 'Nyama Fresh')
          .replace('{branch}', order.branchName || state?.settings?.storeTagline?.split(',')[0] || 'Kariakoo')
          .replace('{total}', formatCurrency(order.total, currency));
        const waText = encodeURIComponent(formattedMsg);

        // Card Container
        const card = createEl('div', {
          className: `order-card-modern ${isPending ? 'order-card-modern--pending' : 'order-card-modern--fulfilled'}`,
        });

        // 1. Status Accent Stripe
        const topStripe = createEl('div', {
          className: `order-card-top-stripe ${isPending ? 'bg-amber-500' : 'bg-emerald-600'}`
        });
        card.appendChild(topStripe);

        // 2. Card Header
        const header = createEl('div', { className: 'order-card-modern__header' }, [
          createEl('div', { className: 'flex flex-wrap items-center gap-2' }, [
            // Order ID Badge with Copy button
            createEl('div', { className: 'order-id-chip' }, [
              createEl('span', { className: 'font-mono font-extrabold text-primary' }, [`#${order.id}`]),
              createEl('button', {
                type: 'button',
                className: 'order-id-copy-btn',
                title: 'Nakili namba ya oda',
                onClick: () => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(order.id);
                    dispatch({ type: 'SHOW_TOAST', payload: { message: `Namba ya oda #${order.id} imenakiliwa!`, type: 'info', id: Date.now() } });
                  }
                },
              }, [
                createEl('span', { className: 'material-symbols-outlined text-[15px]' }, ['content_copy']),
              ]),
            ]),

            createEl('span', { className: 'text-neutral-400 font-bold' }, ['•']),

            // Timestamp
            createEl('span', { className: 'text-xs text-neutral-500 flex items-center gap-1 font-medium' }, [
              createEl('span', { className: 'material-symbols-outlined text-[15px] text-amber-600' }, ['schedule']),
              createEl('span', {}, [
                `${formatDate(order.createdAt)} `
              ]),
              createEl('strong', { className: 'text-slate-700 ml-1' }, [
                `(${formatRelativeTime(order.createdAt)})`
              ]),
            ]),
          ]),

          // Status Badge Pill
          isPending
            ? createEl('div', { className: 'order-status-pill order-status-pill--pending' }, [
                createEl('span', { className: 'status-pill-dot bg-amber-500 animate-pulse' }),
                createEl('span', {}, ['Inasubiri Kuchukuliwa (Pending)']),
              ])
            : createEl('div', { className: 'order-status-pill order-status-pill--fulfilled' }, [
                createEl('span', { className: 'material-symbols-outlined text-[15px] text-emerald-700' }, ['check_circle']),
                createEl('span', {}, ['✓ Imekamilika na Kuchukuliwa']),
              ])
        ]);

        card.appendChild(header);

        // 3. Customer Profile & Cutting Instructions Grid
        const customerGrid = createEl('div', { className: 'order-customer-section' }, [
          // Left: Profile Info
          createEl('div', { className: 'order-customer-profile' }, [
            createEl('div', { className: `customer-avatar ${isPending ? 'bg-primary' : 'bg-emerald-800'}` }, [
              getInitials(order.customerName)
            ]),
            createEl('div', { className: 'flex flex-col gap-0.5' }, [
              createEl('div', { className: 'flex items-center gap-2 flex-wrap' }, [
                createEl('h3', { className: 'font-bold text-slate-900 text-base' }, [order.customerName]),
                createEl('span', { className: 'customer-type-badge' }, ['Mteja wa Duka']),
              ]),
              createEl('div', { className: 'flex items-center gap-2 mt-1' }, [
                createEl('span', { className: 'text-xs font-semibold text-slate-800' }, [rawPhone]),
                cleanPhoneNum ? createEl('a', {
                  href: `tel:${cleanPhoneNum}`,
                  className: 'contact-action-btn',
                  title: 'Piga Simu',
                }, [
                  createEl('span', { className: 'material-symbols-outlined text-[14px]' }, ['call']),
                ]) : null,
                cleanPhoneNum ? createEl('a', {
                  href: `https://wa.me/${cleanPhoneNum}?text=${waText}`,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  className: 'contact-action-btn contact-action-btn--wa',
                  title: 'Tuma Ujumbe WhatsApp',
                }, [
                  createEl('span', { className: 'material-symbols-outlined text-[14px]' }, ['chat']),
                ]) : null,
              ]),
              createEl('p', { className: 'text-xs text-neutral-500 flex items-center gap-1 mt-0.5' }, [
                createEl('span', { className: 'material-symbols-outlined text-[15px] text-primary' }, ['location_on']),
                createEl('span', {}, [`${state?.settings?.storeTagline?.split(',')[0] || 'Kariakoo'} • Kaunta ya Kuchukulia`]),
              ]),
            ]),
          ]),

          // Right: Cutting Instructions Box
          createEl('div', { className: 'order-notes-callout' }, [
            createEl('div', { className: 'flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase' }, [
              createEl('span', { className: 'material-symbols-outlined text-[16px]' }, ['content_cut']),
              createEl('span', {}, ['Maelekezo Maalumu ya Ukataji']),
            ]),
            createEl('p', { className: 'text-xs text-slate-800 italic mt-1 leading-relaxed pl-1' }, [
              order.notes ? `“${order.notes}”` : '“Ufungashaji wa Kawaida wa Buchery (Chilled & Clean Wrap).”'
            ]),
            createEl('div', { className: 'flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-800 font-semibold' }, [
              createEl('span', { className: 'material-symbols-outlined text-[14px]' }, ['ac_unit']),
              createEl('span', {}, ['Kifurushi: Ufungashaji wa Usafi (Bure)']),
            ]),
          ]),
        ]);

        card.appendChild(customerGrid);

        // 4. Meat Items Breakdown
        const itemsSection = createEl('div', { className: 'order-items-breakdown' }, [
          createEl('div', { className: 'order-items-breakdown__header' }, [
            createEl('span', { className: 'text-[11px] uppercase font-bold text-neutral-500 tracking-wider' }, [
              `Vipande Vilivyotengwa (${order.items.length} Aina)`
            ]),
            createEl('span', { className: 'text-[11px] uppercase font-bold text-neutral-500' }, ['Bei']),
          ]),

          createEl('div', { className: 'flex flex-col gap-1.5' },
            order.items.map(item => createEl('div', { className: 'order-item-chip-row' }, [
              createEl('div', { className: 'flex items-center gap-2.5' }, [
                createEl('div', { className: 'order-item-icon' }, ['🥩']),
                createEl('div', { className: 'flex flex-col' }, [
                  createEl('span', { className: 'font-bold text-sm text-slate-900' }, [item.name]),
                  createEl('span', { className: 'text-xs text-neutral-500' }, [
                    `Kiasi: ${item.qty} @ ${formatCurrency(item.priceEach, currency)}`
                  ]),
                ]),
              ]),
              createEl('div', { className: 'flex items-center gap-3' }, [
                createEl('span', { className: 'order-item-qty-badge' }, [`${item.qty} ${item.unit || 'kilo'}`]),
                createEl('span', { className: 'font-extrabold text-sm text-slate-900' }, [
                  formatCurrency(item.priceEach * item.qty, currency)
                ]),
              ]),
            ]))
          ),
        ]);

        card.appendChild(itemsSection);

        // 5. Financial Summary & Actions
        const footer = createEl('div', { className: 'order-card-modern__footer' }, [
          // Total amount + payment status
          createEl('div', { className: 'flex flex-col' }, [
            createEl('span', { className: 'text-[11px] uppercase font-bold text-neutral-500 tracking-wider' }, ['Jumla ya Kulipa Dukani']),
            createEl('div', { className: 'flex items-baseline gap-2 mt-0.5' }, [
              createEl('span', { className: 'text-xl font-extrabold text-primary font-heading' }, [
                formatCurrency(order.total, currency)
              ]),
              isPending
                ? createEl('span', { className: 'payment-status-badge payment-status-badge--unpaid' }, ['Bado Hayajalipwa — Kaunta'])
                : createEl('span', { className: 'payment-status-badge payment-status-badge--paid' }, ['Imelipwa Kamili'])
            ]),
          ]),

          // Action Buttons
          createEl('div', { className: 'order-card-actions-group' }, [
            // Status Toggle (Fulfilled / Pending)
            createEl('button', {
              type: 'button',
              className: `btn btn--sm ${isPending ? 'btn--success' : 'btn--secondary'}`,
              onClick: () => dispatch({
                type: 'SET_ORDER_STATUS',
                payload: { orderId: order.id, status: isPending ? 'fulfilled' : 'pending' }
              }),
            }, [
              createEl('span', { className: 'material-symbols-outlined text-[16px]' }, [
                isPending ? 'check_circle' : 'undo'
              ]),
              createEl('span', {}, [isPending ? '✓ Weka Imekamilika' : 'Rudisha Kama Inasubiri']),
            ]),

            // View Receipt Voucher Button
            createEl('button', {
              type: 'button',
              className: 'btn btn--secondary btn--sm',
              title: 'Tazama Risiti ya Oda',
              onClick: () => dispatch({ type: 'VIEW_ADMIN_RECEIPT', payload: order }),
            }, [
              createEl('span', { className: 'material-symbols-outlined text-[16px] text-neutral-600' }, ['receipt_long']),
              createEl('span', { className: 'hidden sm:inline' }, ['Risiti']),
            ]),

            // WhatsApp Reminder Button
            cleanPhoneNum ? createEl('a', {
              href: `https://wa.me/${cleanPhoneNum}?text=${waText}`,
              target: '_blank',
              rel: 'noopener noreferrer',
              className: 'btn btn--secondary btn--sm text-emerald-700',
              title: 'Tuma Taarifa WhatsApp',
            }, [
              createEl('span', { className: 'material-symbols-outlined text-[16px]' }, ['chat']),
              createEl('span', { className: 'hidden md:inline' }, ['WhatsApp']),
            ]) : null,

            // Delete Button
            createEl('button', {
              type: 'button',
              className: 'order-delete-btn',
              title: 'Futa Rekodi ya Oda',
              onClick: () => {
                if (window.confirm(`Una uhakika unataka kufuta rekodi ya oda #${order.id} ya ${order.customerName}?`)) {
                  dispatch({ type: 'DELETE_ORDER', payload: { orderId: order.id } });
                }
              },
            }, [
              createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['delete']),
            ]),
          ]),
        ]);

        card.appendChild(footer);

        return card;
      })
    );

    container.appendChild(ordersGrid);
  }

  // =========================================================================
  // E. Cold-Chain Standard Counter Banner (Stitch Screen 6)
  // =========================================================================
  const guidanceBanner = createEl('div', { className: 'cold-chain-banner' }, [
    createEl('span', { className: 'material-symbols-outlined text-primary text-[32px] shrink-0' }, ['notification_important']),
    createEl('div', { className: 'flex flex-col gap-1' }, [
      createEl('h4', { className: 'font-bold text-sm text-slate-900 uppercase tracking-wide' }, [
        'Mwongozo wa Kaunta: Uhifadhi wa Akiba ya Wateja (Cold-Chain Assurance)'
      ]),
      createEl('p', { className: 'text-xs text-neutral-600 leading-relaxed' }, [
        '📌 Oda zote za pre-order zilizowekwa zinapaswa kuwa zimekatwa na kuhifadhiwa kwenye friji ya ubaridi (-4°C) mara baada ya kuingia mfumo. Wateja wanapofika kaunta, thibitisha namba ya simu au namba ya oda kabla ya kutoa kifurushi na kupokea malipo ya dukani.'
      ]),
    ]),
  ]);

  container.appendChild(guidanceBanner);

  // Restore cursor if search input was active
  setTimeout(() => {
    if (isOrderSearchFocused) {
      const el = document.getElementById('admin-order-search-input');
      if (el) {
        el.focus();
        if (cursorStart !== null && cursorEnd !== null) {
          el.setSelectionRange(cursorStart, cursorEnd);
        }
      }
    }
  }, 0);

  return container;
}

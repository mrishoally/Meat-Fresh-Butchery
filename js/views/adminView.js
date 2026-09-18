/**
 * Comprehensive Professional Admin Dashboard View
 * Features 7 Enterprise Settings Sub-Panels:
 * 1. Business Profile & Multi-branch Management
 * 2. Staff Roles (Mmiliki, Mhudumu, Mchinjaji), PIN Protection & Audit Log
 * 3. Payments (Cash, M-Pesa, Tigo, Airtel) & Snippe API (2026-01-25 Spec)
 * 4. Order & Pickup Rules (Hold Time, Cutoff, Auto-cancel)
 * 5. WhatsApp/SMS Notifications & Category Low-Stock Thresholds
 * 6. Receipts & ESC/POS Thermal Printing (TIN Number, 58mm/80mm)
 * 7. Swahili/English & Dynamic Theme Accent Color
 */
import { createEl, clearEl } from '../utils/dom.js';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/format.js';
import { renderInventoryTable } from '../components/inventoryTable.js';
import { renderOrderList } from '../components/orderList.js';
import { renderProductModal } from '../components/productForm.js';
import { renderToast } from '../components/toast.js';
import { testSnippeConnection } from '../utils/snippe.js';

let activeSettingsTab = 'business'; // 'business' | 'staff' | 'payments' | 'rules' | 'notifications' | 'receipts' | 'appearance' | 'data'
let activePinModal = null; // Holds active PIN verification state

export function renderAdminView(state, dispatch) {
  const root = document.getElementById('app');
  if (!root) return;
  clearEl(root);

  const { inventory, orders, currentView, toast, settings, adminReceiptOrder, isManualOrderModalOpen } = state;

  // Role Access Guard: Customers and unauthenticated users cannot access Staff Dashboard
  if (settings?.currentRole === 'customer' || !settings?.isAuthenticated) {
    setTimeout(() => {
      dispatch({
        type: 'SHOW_TOAST',
        payload: { message: 'Huna ruhusa ya kufikia sehemu ya Staff. Tafadhali ingia kama mfanyakazi.', type: 'warning', id: Date.now() }
      });
      window.location.hash = settings?.isAuthenticated ? '#/shop' : '#/login';
    }, 0);
    return;
  }

  const currency = settings?.currency || 'TZS';

  // Role details
  const currentRole = settings?.currentRole || 'owner';
  const roleNameMap = {
    owner: 'Mmiliki (Admin)',
    cashier: 'Mhudumu (Cashier)',
    butcher: 'Mchinjaji (Butcher)',
  };

  // Active Branch details
  const branches = settings?.branches || [];
  const activeBranchId = settings?.activeBranchId || (branches[0] ? branches[0].id : 'br_1');
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0] || { name: 'Duka Kuu' };

  // KPIs
  const totalProducts = inventory.length;
  const totalStockUnits = inventory.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockThreshold = settings?.lowStockThreshold || 5;
  const lowStockCount = inventory.filter(p => p.quantity > 0 && p.quantity <= lowStockThreshold).length;
  const outOfStockCount = inventory.filter(p => p.quantity <= 0).length;
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const pendingOrdersCount = pendingOrders.length;
  const pendingOrdersTotal = pendingOrders.reduce((sum, o) => sum + o.total, 0);

  // 1. Admin Top Navbar
  const nav = createEl('header', { className: 'admin-header' }, [
    createEl('div', { className: 'container admin-header__inner flex flex-wrap items-center justify-between gap-4' }, [
      // Left: Logo, Branch, & Active Staff Role Badge
      createEl('div', { className: 'flex items-center gap-3' }, [
        createEl('a', { href: '#/admin', className: 'brand-logo' }, [
          settings?.logoUrl
            ? createEl('img', { src: settings.logoUrl, alt: 'Shop Logo', className: 'w-8 h-8 object-cover rounded-full border border-amber-300' })
            : createEl('span', { className: 'brand-logo__icon' }, ['🥩']),
          createEl('div', {}, [
            createEl('span', { className: 'brand-logo__title' }, [settings?.storeName || 'Nyama Fresh']),
            createEl('div', { className: 'flex items-center gap-1.5' }, [
              createEl('span', { className: 'admin-badge' }, [roleNameMap[currentRole] || 'Staff Manager']),
              createEl('span', { className: 'text-[10px] text-amber-200 font-bold bg-black/30 px-1.5 py-0.5 rounded' }, [
                `📍 ${activeBranch.name}`
              ]),
            ]),
          ]),
        ]),
      ]),

      // Navigation tabs (Permission Aware)
      createEl('nav', { className: 'admin-nav-tabs' }, [
        createEl('a', {
          href: '#/admin',
          className: `admin-nav-tab ${currentView === 'admin' ? 'admin-nav-tab--active' : ''}`,
        }, [
          createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['inventory_2']),
          createEl('span', {}, [`Orodha ya Nyama (${totalProducts})`]),
        ]),

        createEl('a', {
          href: '#/admin/orders',
          className: `admin-nav-tab ${currentView === 'admin-orders' ? 'admin-nav-tab--active' : ''}`,
        }, [
          createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['receipt_long']),
          createEl('span', {}, ['Oda za Wateja']),
          pendingOrdersCount > 0 ? createEl('span', { className: 'tab-counter' }, [String(pendingOrdersCount)]) : null,
        ]),

        // Settings tab (Disabled for Butcher role)
        currentRole !== 'butcher' ? createEl('a', {
          href: '#/admin/settings',
          className: `admin-nav-tab ${currentView === 'admin-settings' ? 'admin-nav-tab--active' : ''}`,
        }, [
          createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['settings']),
          createEl('span', {}, ['Mipangilio']),
        ]) : null,
      ]),

      // Right: Branch Quick Switcher & Logout
      createEl('div', { className: 'admin-header__actions flex items-center gap-2' }, [
        // Branch selector if multi-branch enabled
        branches.length > 1 ? createEl('select', {
          className: 'input select text-xs py-1 px-2.5 bg-white/10 text-white border-white/20 rounded-lg cursor-pointer font-bold',
          value: activeBranchId,
          onChange: (e) => dispatch({ type: 'SWITCH_BRANCH', payload: { branchId: e.target.value } }),
        }, branches.map(b => createEl('option', { value: b.id, selected: b.id === activeBranchId, className: 'text-slate-900 font-normal' }, [
          `📍 ${b.name}`
        ]))) : null,

        createEl('button', {
          type: 'button',
          className: 'btn btn--ghost btn--sm text-amber-200 hover:text-white hover:bg-white/10 flex items-center gap-1',
          title: 'Toka kwenye mfumo wa Staff',
          onClick: () => {
            dispatch({
              type: 'UPDATE_SETTINGS',
              payload: { isAuthenticated: false, currentRole: 'customer', currentStaffName: '', currentUserEmail: '', userType: 'guest' }
            });
            dispatch({
              type: 'SHOW_TOAST',
              payload: { message: 'Umeondoka kwenye portal ya Staff kikamilifu.', type: 'info', id: Date.now() }
            });
            window.location.hash = '#/login';
          }
        }, [
          createEl('span', { className: 'material-symbols-outlined text-[16px]' }, ['logout']),
          createEl('span', { className: 'hidden sm:inline' }, ['Toka (Logout)']),
        ]),
      ]),
    ]),
  ]);

  // 2. Main Content based on active admin tab
  let contentEl;

  if (currentView === 'admin-orders') {
    contentEl = renderAdminOrdersSection(state, dispatch);
  } else if (currentView === 'admin-settings') {
    contentEl = renderAdminSettingsSection(state, dispatch);
  } else {
    // Default: Inventory Management
    contentEl = renderAdminInventorySection({
      inventory,
      totalProducts,
      totalStockUnits,
      lowStockCount,
      outOfStockCount,
      pendingOrdersCount,
      pendingOrdersTotal,
      currency,
      currentRole,
    }, dispatch);
  }

  // Modals & Toasts
  const productModal = renderProductModal(state, dispatch);
  const receiptModal = adminReceiptOrder ? renderAdminReceiptDialog(adminReceiptOrder, dispatch, currency, settings) : null;
  const manualOrderModal = isManualOrderModalOpen ? renderManualOrderModal(state, dispatch) : null;
  const pinModal = activePinModal ? renderPinVerificationModal(activePinModal, dispatch) : null;
  const toastEl = renderToast(toast, dispatch);

  root.appendChild(nav);
  root.appendChild(contentEl);
  if (productModal) root.appendChild(productModal);
  if (receiptModal) root.appendChild(receiptModal);
  if (manualOrderModal) root.appendChild(manualOrderModal);
  if (pinModal) root.appendChild(pinModal);
  if (toastEl) root.appendChild(toastEl);
}

/**
 * Inventory sub-section with Role Enforcement
 */
function renderAdminInventorySection(stats, dispatch) {
  const {
    inventory,
    totalProducts,
    totalStockUnits,
    lowStockCount,
    outOfStockCount,
    pendingOrdersCount,
    pendingOrdersTotal,
    currency,
    currentRole,
  } = stats;

  return createEl('main', { className: 'admin-main container' }, [
    // KPI Cards
    createEl('section', { className: 'kpi-grid' }, [
      createEl('div', { className: 'kpi-card' }, [
        createEl('div', { className: 'kpi-card__header' }, [
          createEl('span', { className: 'kpi-card__label' }, ['Jumla ya Bidhaa']),
          createEl('div', { className: 'kpi-card__icon-box kpi-icon--slate' }, [
            createEl('span', { className: 'material-symbols-outlined text-[20px]' }, ['inventory_2'])
          ]),
        ]),
        createEl('span', { className: 'kpi-card__value' }, [String(totalProducts)]),
        createEl('span', { className: 'kpi-card__hint' }, ['Aina za nyama stoo']),
      ]),

      createEl('div', { className: 'kpi-card' }, [
        createEl('div', { className: 'kpi-card__header' }, [
          createEl('span', { className: 'kpi-card__label' }, ['Jumla ya Kilo/Vipande']),
          createEl('div', { className: 'kpi-card__icon-box kpi-icon--emerald' }, [
            createEl('span', { className: 'material-symbols-outlined text-[20px]' }, ['scale'])
          ]),
        ]),
        createEl('span', { className: 'kpi-card__value' }, [`${totalStockUnits} kg`]),
        createEl('span', { className: 'kpi-card__hint text-success font-semibold' }, ['Zilizopo tayari kuuzwa']),
      ]),

      createEl('div', { className: 'kpi-card kpi-card--warning' }, [
        createEl('div', { className: 'kpi-card__header' }, [
          createEl('span', { className: 'kpi-card__label' }, ['Tahadhari ya Kuisha']),
          createEl('div', { className: 'kpi-card__icon-box kpi-icon--amber' }, [
            createEl('span', { className: 'material-symbols-outlined text-[20px]' }, ['warning'])
          ]),
        ]),
        createEl('span', { className: 'kpi-card__value text-warning' }, [String(lowStockCount + outOfStockCount)]),
        createEl('span', { className: 'kpi-card__hint text-amber-700 font-semibold' }, [
          `${lowStockCount} zimebaki kidogo, ${outOfStockCount} zimeisha`
        ]),
      ]),

      createEl('div', { className: 'kpi-card kpi-card--info' }, [
        createEl('div', { className: 'kpi-card__header' }, [
          createEl('span', { className: 'kpi-card__label' }, ['Oda Zinazosubiri']),
          createEl('div', { className: 'kpi-card__icon-box kpi-icon--primary' }, [
            createEl('span', { className: 'material-symbols-outlined text-[20px]' }, ['receipt_long'])
          ]),
        ]),
        createEl('span', { className: 'kpi-card__value text-primary' }, [String(pendingOrdersCount)]),
        createEl('span', { className: 'kpi-card__hint text-primary font-semibold' }, [
          `Thamani: ${formatCurrency(pendingOrdersTotal, currency)}`
        ]),
      ]),
    ]),

    // Action Bar (Only Owner & Cashier can add products)
    createEl('section', { className: 'admin-action-bar' }, [
      createEl('div', { className: 'flex-1' }, [
        createEl('h2', { className: 'text-xl font-bold text-slate-800' }, ['Usimamizi wa Orodha ya Nyama']),
        createEl('p', { className: 'text-xs text-neutral-500' }, [
          currentRole === 'cashier'
            ? 'Unaweza kuona nyama zilizopo stoo. Mhudumu hana ruhusa ya kufuta bidhaa.'
            : currentRole === 'butcher'
            ? 'Tazama kiwango cha nyama kilichobaki stoo kujiandaa na ukataji.'
            : 'Ongeza, rekebisha bei au kiasi cha nyama. Mabadiliko yanaonekana papo hapo kwa wateja.'
        ]),
      ]),
      currentRole === 'owner' ? createEl('button', {
        type: 'button',
        className: 'btn btn--primary',
        onClick: () => dispatch({ type: 'OPEN_PRODUCT_MODAL' }),
      }, [
        createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['add']),
        createEl('span', {}, ['+ Ongeza Bidhaa Mpya']),
      ]) : null,
    ]),

    // Inventory Table
    renderInventoryTable(inventory, dispatch),
  ]);
}

/**
 * Orders sub-section
 */
function renderAdminOrdersSection(state, dispatch) {
  return createEl('main', { className: 'admin-main container' }, [
    renderOrderList(state.orders, state, dispatch),
  ]);
}

/**
 * Enterprise Settings Section with 8 Tabbed Categories
 */
function renderAdminSettingsSection(state, dispatch) {
  const { inventory, orders, settings } = state;
  const currentSettings = { ...settings };
  const currentRole = settings?.currentRole || 'owner';
  const branches = settings?.branches || [];
  const activeBranchId = settings?.activeBranchId || (branches[0] ? branches[0].id : 'br_1');
  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0] || { name: 'Duka Kuu' };

  // Calculate LocalStorage usage
  let totalLength = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      for (let x in window.localStorage) {
        if (window.localStorage.hasOwnProperty(x)) {
          totalLength += ((window.localStorage[x].length + x.length) * 2);
        }
      }
    } catch (e) {
      totalLength = 10240;
    }
  }
  const kbUsed = (totalLength / 1024).toFixed(1);
  const percentUsed = Math.min(100, Math.max(0.2, ((totalLength / 1024) / 5120 * 100))).toFixed(1);

  // Hidden File Input for JSON Restore
  const fileInput = createEl('input', {
    type: 'file',
    accept: '.json',
    className: 'hidden',
    id: 'admin-restore-file-input',
    onChange: (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.inventory || parsed.orders || parsed.settings) {
            dispatch({
              type: 'IMPORT_BACKUP',
              payload: {
                inventory: parsed.inventory || inventory,
                orders: parsed.orders || orders,
                settings: parsed.settings || settings,
              }
            });
          } else {
            alert('Faili la JSON halina taarifa sahihi za Nyama Fresh.');
          }
        } catch (err) {
          alert('Hitilafu wakati wa kusoma faili la JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  });

  // Settings Tab Navigation Menu with Rich Subtitles
  const tabsList = [
    { id: 'business', label: 'Profile ya Duka', icon: 'storefront', subtitle: 'Jina, anwani, logo, masaa & matawi' },
    { id: 'staff', label: 'Wafanyakazi & Ruhusa', icon: 'badge', subtitle: 'Mmiliki, Mhudumu, PIN, log ya matukio' },
    { id: 'payments', label: 'Malipo & Snippe API', icon: 'payments', subtitle: 'M-Pesa, Tigo, Airtel & USSD Push' },
    { id: 'rules', label: 'Sheria za Pre-Order', icon: 'timer', subtitle: 'Holding time, min order, auto-cancel' },
    { id: 'notifications', label: 'Ujumbe wa Wateja', icon: 'notifications_active', subtitle: 'WhatsApp alerts & viwango vya stoo' },
    { id: 'receipts', label: 'Risiti & Printers', icon: 'print', subtitle: 'TIN number, 58mm/80mm thermal' },
    { id: 'appearance', label: 'Lugha & Muonekano', icon: 'palette', subtitle: 'Swahili/English & theme colors' },
    { id: 'data', label: 'Data & Backup', icon: 'database', subtitle: 'JSON export/import & factory reset' },
  ];

  const sidebar = createEl('aside', { className: 'settings-sidebar' }, [
    createEl('nav', { className: 'settings-sidebar-nav' },
      tabsList.map(tab => createEl('button', {
        type: 'button',
        className: `settings-nav-btn ${activeSettingsTab === tab.id ? 'settings-nav-btn--active' : ''}`,
        onClick: () => {
          activeSettingsTab = tab.id;
          dispatch({ type: 'RENDER' });
        },
      }, [
        createEl('span', { className: 'material-symbols-outlined settings-nav-icon' }, [tab.icon]),
        createEl('div', { className: 'flex flex-col text-left' }, [
          createEl('span', { className: 'font-bold leading-tight' }, [tab.label]),
          createEl('span', { className: 'text-[10px] text-neutral-400 font-normal leading-tight mt-0.5' }, [tab.subtitle]),
        ]),
      ]))
    ),

    // Quick System Diagnostic mini card
    createEl('div', { className: 'p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-2 text-xs' }, [
      createEl('div', { className: 'flex items-center justify-between font-bold text-slate-700' }, [
        createEl('span', {}, ['Hali ya Mfumo:']),
        createEl('span', { className: 'text-success font-bold flex items-center gap-1.5' }, [
          createEl('span', { className: 'pulse-dot' }),
          'Salama 100%'
        ]),
      ]),
      createEl('div', { className: 'text-[11px] text-neutral-500' }, [
        `Nafasi: `,
        createEl('strong', { className: 'text-slate-800' }, [currentRole.toUpperCase()]),
        ` • `,
        createEl('span', {}, [activeBranch.name]),
      ]),
    ]),
  ]);

  // Tab Content Container
  let tabContentEl;

  switch (activeSettingsTab) {
    case 'business':
      tabContentEl = renderBusinessProfileTab(currentSettings, dispatch);
      break;
    case 'staff':
      tabContentEl = renderStaffPermissionsTab(currentSettings, dispatch);
      break;
    case 'payments':
      tabContentEl = renderPaymentsSnippeTab(currentSettings, dispatch);
      break;
    case 'rules':
      tabContentEl = renderOrderRulesTab(currentSettings, dispatch);
      break;
    case 'notifications':
      tabContentEl = renderNotificationsTab(currentSettings, dispatch);
      break;
    case 'receipts':
      tabContentEl = renderReceiptsThermalTab(currentSettings, dispatch);
      break;
    case 'appearance':
      tabContentEl = renderAppearanceThemeTab(currentSettings, dispatch);
      break;
    case 'data':
    default:
      tabContentEl = renderDataManagementTab({ inventory, orders, settings: currentSettings, kbUsed, percentUsed }, dispatch);
      break;
  }

  return createEl('main', { className: 'admin-main container flex flex-col gap-6' }, [
    fileInput,

    // Header Title Banner
    createEl('div', { className: 'settings-header-banner flex items-center justify-between flex-wrap gap-4' }, [
      createEl('div', {}, [
        createEl('div', { className: 'flex items-center gap-2 text-xs font-bold text-primary uppercase mb-1' }, [
          createEl('span', { className: 'material-symbols-outlined text-[16px]' }, ['settings']),
          createEl('span', {}, ['Usimamizi wa Duka']),
          createEl('span', {}, ['•']),
          createEl('span', { className: 'text-neutral-500' }, ['Enterprise Command Center']),
        ]),
        createEl('h1', { className: 'text-2xl font-extrabold text-slate-900 font-heading' }, [
          'Mipangilio ya Mfumo wa Duka'
        ]),
        createEl('p', { className: 'text-sm text-neutral-600 mt-0.5' }, [
          'Weka taarifa za duka, Snippe API ya M-Pesa/Tigo Pesa, ruhusa za wafanyakazi, na sheria za pre-orders.'
        ]),
      ]),
      createEl('div', { className: 'flex items-center gap-2' }, [
        createEl('span', { className: 'badge badge--in-stock font-bold' }, ['✓ Mfumo Salama']),
      ]),
    ]),

    // 2-Column Responsive Layout (Sidebar Navigation + Workspace Content)
    createEl('div', { className: 'settings-layout-grid' }, [
      sidebar,
      createEl('div', { className: 'settings-workspace-wrap' }, [tabContentEl]),
    ]),
  ]);
}

/**
 * TAB 1: Business Profile & Multi-Branch Support
 */
function renderBusinessProfileTab(settings, dispatch) {
  const hours = settings.operatingHoursPerDay || {};
  const branches = settings.branches || [];

  return createEl('div', { className: 'settings-panel flex flex-col gap-6' }, [
    createEl('div', { className: 'border-b border-neutral-200 pb-3' }, [
      createEl('h2', { className: 'text-lg font-bold text-slate-900 flex items-center gap-2' }, [
        createEl('span', { className: 'material-symbols-outlined text-primary' }, ['storefront']),
        createEl('span', {}, ['1. Profile ya Duka, Logo, na Masaa ya Kazi']),
      ]),
      createEl('p', { className: 'text-xs text-neutral-500' }, ['Taarifa hizi zinaonekana kwenye duka la wateja, risiti, na mawasiliano.']),
    ]),

    createEl('form', {
      className: 'flex flex-col gap-5',
      onSubmit: (e) => {
        e.preventDefault();
        const form = e.target;
        const updatedHours = {
          Mon: form.hours_Mon.value.trim(),
          Tue: form.hours_Tue.value.trim(),
          Wed: form.hours_Wed.value.trim(),
          Thu: form.hours_Thu.value.trim(),
          Fri: form.hours_Fri.value.trim(),
          Sat: form.hours_Sat.value.trim(),
          Sun: form.hours_Sun.value.trim(),
        };

        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: {
            storeName: form.storeName.value.trim(),
            storeTagline: form.storeTagline.value.trim(),
            storeAddress: form.storeAddress.value.trim(),
            storePhone: form.storePhone.value.trim(),
            storeWhatsapp: form.storeWhatsapp.value.trim(),
            storeEmail: form.storeEmail.value.trim(),
            tinNumber: form.tinNumber.value.trim(),
            operatingHoursPerDay: updatedHours,
          }
        });
      },
    }, [
      // Logo Upload Row
      createEl('div', { className: 'p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-4' }, [
        createEl('div', { className: 'w-20 h-20 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300 shrink-0' }, [
          settings.logoUrl
            ? createEl('img', { src: settings.logoUrl, alt: 'Logo Preview', className: 'w-full h-full object-cover' })
            : createEl('span', { className: 'text-3xl' }, ['🥩'])
        ]),
        createEl('div', { className: 'flex-1 flex flex-col gap-1 text-center sm:text-left' }, [
          createEl('label', { className: 'font-bold text-sm text-slate-800' }, ['Logo ya Duka (Shop Logo Upload)']),
          createEl('p', { className: 'text-xs text-neutral-500' }, ['Pakia picha ya logo ya duka lako (PNG/JPG). Inahifadhiwa moja kwa moja kwenye duka.']),
          createEl('input', {
            type: 'file',
            accept: 'image/*',
            className: 'text-xs mt-1',
            onChange: (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  payload: { logoUrl: event.target.result }
                });
              };
              reader.readAsDataURL(file);
            },
          }),
        ]),
        settings.logoUrl ? createEl('button', {
          type: 'button',
          className: 'btn btn--secondary btn--sm text-danger',
          onClick: () => dispatch({ type: 'UPDATE_SETTINGS', payload: { logoUrl: '' } }),
        }, ['Ondoa Logo']) : null,
      ]),

      createEl('div', { className: 'form-grid-2' }, [
        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Jina Rasmi la Duka']),
          createEl('input', { name: 'storeName', type: 'text', className: 'input', defaultValue: settings.storeName, required: true }),
        ]),

        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Kaulimbiu / Eneo Kuu (Tagline)']),
          createEl('input', { name: 'storeTagline', type: 'text', className: 'input', defaultValue: settings.storeTagline, required: true }),
        ]),
      ]),

      createEl('div', { className: 'form-group' }, [
        createEl('label', { className: 'label' }, ['Anwani ya Eneo la Duka (Physical Address)']),
        createEl('input', { name: 'storeAddress', type: 'text', className: 'input', defaultValue: settings.storeAddress || '', placeholder: 'Plot 42, Mtaa wa Msimbazi, Kariakoo' }),
      ]),

      createEl('div', { className: 'form-grid-3' }, [
        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Namba ya Simu Kaunta']),
          createEl('input', { name: 'storePhone', type: 'text', className: 'input', defaultValue: settings.storePhone, required: true }),
        ]),

        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Namba ya WhatsApp Kuu']),
          createEl('input', { name: 'storeWhatsapp', type: 'text', className: 'input', defaultValue: settings.storeWhatsapp || '255712345678', placeholder: '2557XXXXXXXX' }),
        ]),

        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Namba ya TIN (Business TIN)']),
          createEl('input', { name: 'tinNumber', type: 'text', className: 'input', defaultValue: settings.tinNumber || '123-456-789', placeholder: '123-456-789' }),
        ]),
      ]),

      createEl('div', { className: 'form-group' }, [
        createEl('label', { className: 'label' }, ['Barua Pepe ya Huduma kwa Wateja']),
        createEl('input', { name: 'storeEmail', type: 'email', className: 'input', defaultValue: settings.storeEmail }),
      ]),

      // Operating Hours per Day
      createEl('div', { className: 'p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3' }, [
        createEl('h3', { className: 'font-bold text-sm text-slate-900 flex items-center gap-1.5' }, [
          createEl('span', { className: 'material-symbols-outlined text-primary text-[18px]' }, ['schedule']),
          createEl('span', {}, ['Masaa ya Kazi ya Kila Siku (Per Day Operating Hours)']),
        ]),

        createEl('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs' }, [
          ['Mon', 'Jumatatu'],
          ['Tue', 'Jumanne'],
          ['Wed', 'Jumatano'],
          ['Thu', 'Alhamisi'],
          ['Fri', 'Ijumaa'],
          ['Sat', 'Jumamosi'],
          ['Sun', 'Jumapili'],
        ].map(([dayKey, dayLabel]) => createEl('div', { className: 'flex flex-col gap-1 p-2 bg-white rounded border border-slate-200' }, [
          createEl('span', { className: 'font-bold text-slate-700' }, [dayLabel]),
          createEl('input', {
            name: `hours_${dayKey}`,
            type: 'text',
            className: 'input text-xs py-1 px-2',
            defaultValue: hours[dayKey] || '06:30 - 20:00',
          }),
        ]))),
      ]),

      createEl('div', { className: 'flex justify-end pt-2' }, [
        createEl('button', { type: 'submit', className: 'btn btn--primary' }, [
          createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['save']),
          createEl('span', {}, ['Hifadhi Taarifa za Duka']),
        ]),
      ]),
    ]),

    // Multi-Branch Management Box
    createEl('div', { className: 'p-5 bg-white border border-slate-200 rounded-xl flex flex-col gap-4 mt-4' }, [
      createEl('div', { className: 'flex items-center justify-between flex-wrap gap-2' }, [
        createEl('div', {}, [
          createEl('h3', { className: 'font-bold text-base text-slate-900 flex items-center gap-2' }, [
            createEl('span', { className: 'material-symbols-outlined text-primary' }, ['domain']),
            createEl('span', {}, ['Usimamizi wa Matawi ya Duka (Multi-Branch Support)']),
          ]),
          createEl('p', { className: 'text-xs text-neutral-500' }, ['Sajili matawi ya duka lako kama una maduka zaidi ya moja.']),
        ]),
      ]),

      createEl('div', { className: 'flex flex-col gap-2' }, branches.map(b => createEl('div', { className: 'flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs' }, [
        createEl('div', { className: 'flex items-center gap-3' }, [
          createEl('span', { className: 'text-lg' }, ['📍']),
          createEl('div', {}, [
            createEl('div', { className: 'flex items-center gap-2' }, [
              createEl('span', { className: 'font-bold text-slate-900 text-sm' }, [b.name]),
              b.id === settings.activeBranchId ? createEl('span', { className: 'badge badge--in-stock text-[10px]' }, ['Duka Linalotumika']) : null,
            ]),
            createEl('span', { className: 'text-neutral-500' }, [`${b.address} • Simu: ${b.phone}`]),
          ]),
        ]),
        createEl('div', { className: 'flex items-center gap-2' }, [
          b.id !== settings.activeBranchId ? createEl('button', {
            type: 'button',
            className: 'btn btn--secondary btn--sm',
            onClick: () => dispatch({ type: 'SWITCH_BRANCH', payload: { branchId: b.id } }),
          }, ['Tumia Duka Hili']) : null,
          branches.length > 1 ? createEl('button', {
            type: 'button',
            className: 'btn btn--secondary btn--sm text-danger',
            onClick: () => dispatch({ type: 'DELETE_BRANCH', payload: { branchId: b.id } }),
          }, ['Futa']) : null,
        ]),
      ]))),

      // Add New Branch Form
      createEl('form', {
        className: 'flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200',
        onSubmit: (e) => {
          e.preventDefault();
          const form = e.target;
          if (!form.branchName.value.trim()) return;
          dispatch({
            type: 'ADD_BRANCH',
            payload: {
              name: form.branchName.value.trim(),
              address: form.branchAddress.value.trim(),
              phone: form.branchPhone.value.trim(),
            }
          });
          form.reset();
        },
      }, [
        createEl('input', { name: 'branchName', type: 'text', placeholder: 'Jina la Tawi (mf. Kinondoni Duka)', className: 'input text-xs flex-1', required: true }),
        createEl('input', { name: 'branchAddress', type: 'text', placeholder: 'Anwani / Mtaa', className: 'input text-xs flex-1' }),
        createEl('input', { name: 'branchPhone', type: 'text', placeholder: 'Simu ya Tawi', className: 'input text-xs w-36' }),
        createEl('button', { type: 'submit', className: 'btn btn--secondary btn--sm shrink-0' }, ['+ Ongeza Tawi']),
      ]),
    ]),
  ]);
}

/**
 * TAB 2: Staff Roles, Permissions, PIN Protection, & Audit Log
 */
function renderStaffPermissionsTab(settings, dispatch) {
  const currentRole = settings.currentRole || 'owner';
  const staffList = settings.staffList || [];
  const auditLog = settings.auditLog || [];

  return createEl('div', { className: 'settings-panel flex flex-col gap-6' }, [
    createEl('div', { className: 'border-b border-neutral-200 pb-3' }, [
      createEl('h2', { className: 'text-lg font-bold text-slate-900 flex items-center gap-2' }, [
        createEl('span', { className: 'material-symbols-outlined text-primary' }, ['badge']),
        createEl('span', {}, ['2. Usimamizi wa Wafanyakazi, Ruhusa, PIN, na Log ya Matukio']),
      ]),
      createEl('p', { className: 'text-xs text-neutral-500' }, ['Gawa majukumu ya kazi na kuzuia wafanyakazi kufuta au kubadili bei bila idhini.']),
    ]),

    // Active Role Switcher Widget
    createEl('div', { className: 'p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4' }, [
      createEl('div', { className: 'flex items-center gap-3' }, [
        createEl('div', { className: 'w-12 h-12 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xl' }, ['👑']),
        createEl('div', {}, [
          createEl('div', { className: 'flex items-center gap-2' }, [
            createEl('span', { className: 'text-xs uppercase font-bold text-amber-900' }, ['Nafasi Inayotumika Sasa:']),
            createEl('span', { className: 'badge badge--primary text-xs font-bold' }, [
              currentRole === 'owner' ? 'Mmiliki (Owner/Admin)' : currentRole === 'cashier' ? 'Mhudumu (Cashier)' : 'Mchinjaji (Butcher)'
            ]),
          ]),
          createEl('p', { className: 'text-xs text-amber-950 mt-0.5' }, [
            currentRole === 'owner'
              ? 'Mmiliki ana ruhusa zote (hariri bei, futa bidhaa, futa data yote, rekebisha mipangilio).'
              : currentRole === 'cashier'
              ? 'Mhudumu anaweza kupokea oda na kukamilisha malipo. HANA RUHUSA ya kufuta bidhaa au data.'
              : 'Mchinjaji anaweza kuona foleni ya ukataji na kuweka oda tayari.'
          ]),
        ]),
      ]),

      // Switcher Buttons
      createEl('div', { className: 'flex items-center gap-1.5 shrink-0' }, [
        createEl('button', {
          type: 'button',
          className: `btn btn--sm ${currentRole === 'owner' ? 'btn--primary' : 'btn--secondary'}`,
          onClick: () => {
            activePinModal = {
              title: 'Thibitisha PIN ya Admin',
              prompt: 'Weka PIN yako ya Mfanyakazi kurejea kama Mmiliki',
              requiredPin: settings.securityPin || '1234',
              onSuccess: () => dispatch({ type: 'SET_STAFF_ROLE', payload: { role: 'owner', staffName: settings.currentStaffName } }),
            };
            dispatch({ type: 'RENDER' });
          },
        }, ['Mmiliki']),

        createEl('button', {
          type: 'button',
          className: `btn btn--sm ${currentRole === 'cashier' ? 'btn--primary' : 'btn--secondary'}`,
          onClick: () => dispatch({ type: 'SET_STAFF_ROLE', payload: { role: 'cashier', staffName: 'Amina (Cashier)' } }),
        }, ['Mhudumu']),

        createEl('button', {
          type: 'button',
          className: `btn btn--sm ${currentRole === 'butcher' ? 'btn--primary' : 'btn--secondary'}`,
          onClick: () => dispatch({ type: 'SET_STAFF_ROLE', payload: { role: 'butcher', staffName: 'Juma (Butcher)' } }),
        }, ['Mchinjaji']),
      ]),
    ]),

    // Security PIN Config
    createEl('form', {
      className: 'p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3',
      onSubmit: (e) => {
        e.preventDefault();
        const pin = e.target.securityPin.value.trim();
        if (!pin || pin.length < 4) {
          alert('PIN lazima iwe na tarakimu 4 au zaidi');
          return;
        }
        dispatch({ type: 'UPDATE_SETTINGS', payload: { securityPin: pin } });
      },
    }, [
      createEl('div', { className: 'flex items-center justify-between flex-wrap gap-2' }, [
        createEl('div', {}, [
          createEl('h3', { className: 'font-bold text-sm text-slate-900 flex items-center gap-1.5' }, [
            createEl('span', { className: 'material-symbols-outlined text-primary text-[18px]' }, ['lock']),
            createEl('span', {}, ['PIN ya Usalama ya Admin (Security PIN Protection)']),
          ]),
          createEl('p', { className: 'text-xs text-neutral-500' }, ['PIN hii inatakiwa wakati wa kufuta data zote, kubadili mifumo ya malipo, au kuingia kama Mmiliki.']),
        ]),
        createEl('div', { className: 'flex items-center gap-2' }, [
          createEl('input', {
            name: 'securityPin',
            type: 'password',
            className: 'input text-xs w-32 font-mono font-bold text-center',
            defaultValue: settings.securityPin || '1234',
            maxLength: 8,
            required: true,
          }),
          createEl('button', { type: 'submit', className: 'btn btn--secondary btn--sm' }, ['Badili PIN']),
        ]),
      ]),
    ]),

    // Staff Roster Management
    createEl('div', { className: 'p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-4' }, [
      createEl('h3', { className: 'font-bold text-sm text-slate-900 flex items-center gap-1.5' }, [
        createEl('span', { className: 'material-symbols-outlined text-primary text-[18px]' }, ['group']),
        createEl('span', {}, ['Orodha ya Wafanyakazi wa Duka']),
      ]),

      createEl('div', { className: 'flex flex-col gap-2' }, staffList.map(st => createEl('div', { className: 'flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs' }, [
        createEl('div', { className: 'flex items-center gap-3' }, [
          createEl('div', { className: 'w-8 h-8 rounded-full bg-slate-200 font-bold flex items-center justify-center text-slate-700' }, [
            st.name[0] || 'W'
          ]),
          createEl('div', {}, [
            createEl('div', { className: 'flex items-center gap-2' }, [
              createEl('span', { className: 'font-bold text-slate-900 text-sm' }, [st.name]),
              createEl('span', { className: 'badge badge--neutral text-[10px]' }, [st.role.toUpperCase()]),
            ]),
            createEl('span', { className: 'text-neutral-500' }, [`Simu: ${st.phone || 'N/A'} • PIN: ****`]),
          ]),
        ]),
        staffList.length > 1 ? createEl('button', {
          type: 'button',
          className: 'btn btn--secondary btn--sm text-danger',
          onClick: () => dispatch({ type: 'DELETE_STAFF', payload: { staffId: st.id } }),
        }, ['Ondoa']) : null,
      ]))),

      // Add Staff Form
      createEl('form', {
        className: 'flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200',
        onSubmit: (e) => {
          e.preventDefault();
          const form = e.target;
          if (!form.staffName.value.trim() || !form.staffEmail.value.trim()) return;
          dispatch({
            type: 'ADD_STAFF',
            payload: {
              name: form.staffName.value.trim(),
              email: form.staffEmail.value.trim().toLowerCase(),
              role: form.staffRole.value,
              phone: form.staffPhone.value.trim(),
            }
          });
          form.reset();
        },
      }, [
        createEl('input', { name: 'staffName', type: 'text', placeholder: 'Jina la Mfanyakazi', className: 'input text-xs flex-1', required: true }),
        createEl('input', { name: 'staffEmail', type: 'email', placeholder: 'Barua Pepe (Email)', className: 'input text-xs flex-1', required: true }),
        createEl('select', { name: 'staffRole', className: 'input select text-xs w-36' }, [
          createEl('option', { value: 'cashier' }, ['Mhudumu (Cashier)']),
          createEl('option', { value: 'butcher' }, ['Mchinjaji (Butcher)']),
          createEl('option', { value: 'owner' }, ['Mmiliki (Admin)']),
        ]),
        createEl('input', { name: 'staffPhone', type: 'text', placeholder: 'Simu', className: 'input text-xs w-32' }),
        createEl('button', { type: 'submit', className: 'btn btn--secondary btn--sm shrink-0' }, ['+ Ongeza']),
      ]),
    ]),

    // Staff Activity Log (Audit Trail)
    createEl('div', { className: 'p-4 bg-slate-900 text-white rounded-xl flex flex-col gap-3' }, [
      createEl('div', { className: 'flex items-center justify-between' }, [
        createEl('h3', { className: 'font-bold text-sm text-amber-400 flex items-center gap-1.5' }, [
          createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['history']),
          createEl('span', {}, ['Log ya Matukio na Wafanyakazi (Staff Activity Log / Audit Trail)']),
        ]),
        createEl('span', { className: 'text-xs text-slate-400' }, [`Jumla: ${auditLog.length} Rekodi`]),
      ]),

      createEl('div', { className: 'max-h-64 overflow-y-auto flex flex-col gap-1.5 pr-1 font-mono text-xs' },
        auditLog.length === 0
          ? [createEl('div', { className: 'text-slate-500 italic py-2' }, ['Hakuna rekodi za matukio bado.'])]
          : auditLog.map(log => createEl('div', { className: 'p-2 bg-slate-800/80 rounded border border-slate-700 flex items-center justify-between gap-3' }, [
              createEl('div', { className: 'flex items-center gap-2 flex-1 overflow-hidden' }, [
                createEl('span', { className: 'text-amber-400 font-bold shrink-0' }, [`[${log.staffName || 'Staff'}]`]),
                createEl('span', { className: 'text-slate-200 truncate' }, [log.action]),
              ]),
              createEl('span', { className: 'text-[10px] text-slate-400 shrink-0 font-sans' }, [formatRelativeTime(log.timestamp)]),
            ]))
      ),
    ]),
  ]);
}

/**
 * TAB 3: Payments & Snippe API Integration (2026-01-25 API Spec)
 */
function renderPaymentsSnippeTab(settings, dispatch) {
  const methods = settings.acceptedPaymentMethods || {};
  const tills = settings.paymentTills || {};
  const snippe = settings.snippeConfig || {};

  return createEl('div', { className: 'settings-panel flex flex-col gap-6' }, [
    createEl('div', { className: 'border-b border-neutral-200 pb-3' }, [
      createEl('h2', { className: 'text-lg font-bold text-slate-900 flex items-center gap-2' }, [
        createEl('span', { className: 'material-symbols-outlined text-primary' }, ['payments']),
        createEl('span', {}, ['3. Njia za Malipo na Muunganisho wa Snippe Payments API']),
      ]),
      createEl('p', { className: 'text-xs text-neutral-500' }, ['Configures accepted payment channels (M-Pesa, Tigo, Airtel, Cash) and direct USSD payment API via Snippe.sh (2026-01-25 spec).']),
    ]),

    createEl('form', {
      className: 'flex flex-col gap-6',
      onSubmit: (e) => {
        e.preventDefault();
        const form = e.target;
        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: {
            acceptedPaymentMethods: {
              cash: form.pay_cash.checked,
              mpesa: form.pay_mpesa.checked,
              tigopesa: form.pay_tigopesa.checked,
              airtel: form.pay_airtel.checked,
            },
            paymentTills: {
              mpesaTill: form.mpesaTill.value.trim(),
              mpesaPaybill: form.mpesaPaybill.value.trim(),
              tigopesaLipa: form.tigopesaLipa.value.trim(),
              airtelLipa: form.airtelLipa.value.trim(),
            },
            snippeConfig: {
              apiKey: form.snippeApiKey.value.trim(),
              webhookUrl: form.snippeWebhookUrl.value.trim(),
              liveMode: form.snippeLiveMode.checked,
            }
          }
        });
      },
    }, [
      // Section A: Accepted Payment Methods Checkboxes
      createEl('div', { className: 'p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3' }, [
        createEl('h3', { className: 'font-bold text-sm text-slate-900 flex items-center gap-1.5' }, [
          createEl('span', { className: 'material-symbols-outlined text-primary text-[18px]' }, ['check_circle']),
          createEl('span', {}, ['Njia za Malipo Zilizokubaliwa (Accepted Payment Channels)']),
        ]),

        createEl('div', { className: 'grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold' }, [
          createEl('label', { className: 'flex items-center gap-2 p-2.5 bg-white rounded border border-slate-200 cursor-pointer' }, [
            createEl('input', { type: 'checkbox', name: 'pay_cash', defaultChecked: methods.cash !== false, className: 'accent-primary w-4 h-4' }),
            createEl('span', {}, ['💵 Pesa Taslimu (Cash)']),
          ]),
          createEl('label', { className: 'flex items-center gap-2 p-2.5 bg-white rounded border border-slate-200 cursor-pointer text-red-700' }, [
            createEl('input', { type: 'checkbox', name: 'pay_mpesa', defaultChecked: methods.mpesa !== false, className: 'accent-red-600 w-4 h-4' }),
            createEl('span', {}, ['🔴 Vodacom M-Pesa']),
          ]),
          createEl('label', { className: 'flex items-center gap-2 p-2.5 bg-white rounded border border-slate-200 cursor-pointer text-blue-700' }, [
            createEl('input', { type: 'checkbox', name: 'pay_tigopesa', defaultChecked: methods.tigopesa !== false, className: 'accent-blue-600 w-4 h-4' }),
            createEl('span', {}, ['🔵 Tigo Pesa']),
          ]),
          createEl('label', { className: 'flex items-center gap-2 p-2.5 bg-white rounded border border-slate-200 cursor-pointer text-red-600' }, [
            createEl('input', { type: 'checkbox', name: 'pay_airtel', defaultChecked: methods.airtel !== false, className: 'accent-red-500 w-4 h-4' }),
            createEl('span', {}, ['🔴 Airtel Money']),
          ]),
        ]),
      ]),

      // Section B: Till / Paybill / Lipa Namba Fields
      createEl('div', { className: 'p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3' }, [
        createEl('h3', { className: 'font-bold text-sm text-slate-900 flex items-center gap-1.5' }, [
          createEl('span', { className: 'material-symbols-outlined text-primary text-[18px]' }, ['pin']),
          createEl('span', {}, ['Namba za Till / Paybill / Lipa Namba za Kaunta']),
        ]),

        createEl('div', { className: 'form-grid-2' }, [
          createEl('div', { className: 'form-group' }, [
            createEl('label', { className: 'label' }, ['M-Pesa Till Number / Lipa Namba']),
            createEl('input', { name: 'mpesaTill', type: 'text', className: 'input font-mono', defaultValue: tills.mpesaTill || '554433', placeholder: '554433' }),
          ]),

          createEl('div', { className: 'form-group' }, [
            createEl('label', { className: 'label' }, ['M-Pesa Business Paybill Number']),
            createEl('input', { name: 'mpesaPaybill', type: 'text', className: 'input font-mono', defaultValue: tills.mpesaPaybill || '400200', placeholder: '400200' }),
          ]),

          createEl('div', { className: 'form-group' }, [
            createEl('label', { className: 'label' }, ['Tigo Pesa Lipa Namba']),
            createEl('input', { name: 'tigopesaLipa', type: 'text', className: 'input font-mono', defaultValue: tills.tigopesaLipa || '887766', placeholder: '887766' }),
          ]),

          createEl('div', { className: 'form-group' }, [
            createEl('label', { className: 'label' }, ['Airtel Money Lipa Namba']),
            createEl('input', { name: 'airtelLipa', type: 'text', className: 'input font-mono', defaultValue: tills.airtelLipa || '991122', placeholder: '991122' }),
          ]),
        ]),
      ]),

      // Section C: Snippe API Settings (2026-01-25 Specs)
      createEl('div', { className: 'p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl flex flex-col gap-4' }, [
        createEl('div', { className: 'flex items-center justify-between flex-wrap gap-2' }, [
          createEl('div', {}, [
            createEl('div', { className: 'flex items-center gap-2' }, [
              createEl('h3', { className: 'font-bold text-base text-amber-400 flex items-center gap-2' }, [
                createEl('span', { className: 'material-symbols-outlined' }, ['api']),
                createEl('span', {}, ['Snippe Payments API Integration (2026-01-25 Specification)']),
              ]),
              createEl('span', { className: 'bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30' }, ['USSD Push Ready']),
            ]),
            createEl('p', { className: 'text-xs text-slate-300 mt-1' }, [
              'Inasababisha simu ya mteja kuonyesha popup ya kuweka PIN mara tu anapoweka pre-order (POST https://api.snippe.sh/v1/payments).'
            ]),
          ]),
          createEl('a', { href: 'https://docs.snippe.sh/docs/2026-01-25', target: '_blank', className: 'text-xs text-amber-300 underline font-semibold' }, ['Soma API Docs ↗']),
        ]),

        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'text-xs font-bold text-slate-300 mb-1 block' }, ['Snippe API Key (Bearer Secret Token)']),
          createEl('div', { className: 'flex items-center gap-2' }, [
            createEl('input', {
              name: 'snippeApiKey',
              id: 'snippe-api-key-input',
              type: 'password',
              className: 'input text-xs font-mono bg-slate-950 text-amber-300 border-slate-700 flex-1',
              defaultValue: snippe.apiKey || '',
              placeholder: 'sn_live_xxxxxxxxxxxxxxxxxxxxxxxx',
            }),
            createEl('button', {
              type: 'button',
              className: 'btn btn--secondary btn--sm shrink-0',
              onClick: () => {
                const el = document.getElementById('snippe-api-key-input');
                if (el) el.type = el.type === 'password' ? 'text' : 'password';
              },
            }, ['👁 Onyesha']),
            createEl('button', {
              type: 'button',
              className: 'btn btn--primary btn--sm shrink-0 bg-amber-600 hover:bg-amber-700 text-white',
              onClick: async () => {
                const key = document.getElementById('snippe-api-key-input')?.value.trim();
                const res = await testSnippeConnection(key);
                alert(res.message);
              },
            }, ['🧪 Jaribu Muunganisho']),
          ]),
        ]),

        createEl('div', { className: 'form-grid-2' }, [
          createEl('div', { className: 'form-group' }, [
            createEl('label', { className: 'text-xs font-bold text-slate-300 mb-1 block' }, ['Webhook Notification URL']),
            createEl('input', {
              name: 'snippeWebhookUrl',
              type: 'text',
              className: 'input text-xs font-mono bg-slate-950 text-slate-200 border-slate-700',
              defaultValue: snippe.webhookUrl || 'https://api.nyamafresh.co.tz/webhook/snippe',
            }),
          ]),

          createEl('div', { className: 'flex items-center gap-3 pt-6' }, [
            createEl('label', { className: 'flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300' }, [
              createEl('input', { type: 'checkbox', name: 'snippeLiveMode', defaultChecked: snippe.liveMode, className: 'accent-amber-500 w-4 h-4' }),
              createEl('span', {}, ['Washa Live Mode (Prod Transactions)']),
            ]),
          ]),
        ]),
      ]),

      createEl('div', { className: 'flex justify-end pt-2' }, [
        createEl('button', { type: 'submit', className: 'btn btn--primary' }, [
          createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['save']),
          createEl('span', {}, ['Hifadhi Mipangilio ya Malipo']),
        ]),
      ]),
    ]),
  ]);
}

/**
 * TAB 4: Order & Pickup Rules
 */
function renderOrderRulesTab(settings, dispatch) {
  return createEl('div', { className: 'settings-panel flex flex-col gap-6' }, [
    createEl('div', { className: 'border-b border-neutral-200 pb-3' }, [
      createEl('h2', { className: 'text-lg font-bold text-slate-900 flex items-center gap-2' }, [
        createEl('span', { className: 'material-symbols-outlined text-primary' }, ['timer']),
        createEl('span', {}, ['4. Sheria za Oda, Reservation Holding Time, na Auto-Cancel']),
      ]),
      createEl('p', { className: 'text-xs text-neutral-500' }, ['Weka muda ambao nyama inabaki kutengewa mteja kabla haijarudishwa stoo.']),
    ]),

    createEl('form', {
      className: 'flex flex-col gap-5',
      onSubmit: (e) => {
        e.preventDefault();
        const form = e.target;
        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: {
            holdTimeHours: Number(form.holdTimeHours.value) || 3,
            minOrderKg: Number(form.minOrderKg.value) || 0.5,
            minOrderAmount: Number(form.minOrderAmount.value) || 2000,
            cutoffTime: form.cutoffTime.value.trim() || '19:30',
            autoCancelUnclaimedHours: Number(form.autoCancelUnclaimedHours.value) || 3,
          }
        });
      },
    }, [
      createEl('div', { className: 'form-grid-2' }, [
        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Muda wa Kutenga Oda (Reservation Hold Time in Hours)']),
          createEl('select', { name: 'holdTimeHours', className: 'input select' }, [
            createEl('option', { value: '1', selected: settings.holdTimeHours === 1 }, ['Saa 1 (Haraka)']),
            createEl('option', { value: '2', selected: settings.holdTimeHours === 2 }, ['Saa 2']),
            createEl('option', { value: '3', selected: (settings.holdTimeHours || 3) === 3 }, ['Saa 3 (Inayopendekezwa)']),
            createEl('option', { value: '6', selected: settings.holdTimeHours === 6 }, ['Saa 6']),
            createEl('option', { value: '12', selected: settings.holdTimeHours === 12 }, ['Saa 12']),
            createEl('option', { value: '24', selected: settings.holdTimeHours === 24 }, ['Saa 24 (Siku 1)']),
          ]),
          createEl('span', { className: 'text-[11px] text-neutral-500 mt-1' }, ['Mteja anapoweka pre-order, duka linatenga nyama kwa masaa haya.']),
        ]),

        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Kughairi Kiotomatiki Oda Isiyochukuliwa (Auto-Cancel Unclaimed)']),
          createEl('select', { name: 'autoCancelUnclaimedHours', className: 'input select' }, [
            createEl('option', { value: '2', selected: settings.autoCancelUnclaimedHours === 2 }, ['Baada ya Saa 2']),
            createEl('option', { value: '3', selected: (settings.autoCancelUnclaimedHours || 3) === 3 }, ['Baada ya Saa 3 (Default)']),
            createEl('option', { value: '5', selected: settings.autoCancelUnclaimedHours === 5 }, ['Baada ya Saa 5']),
            createEl('option', { value: '0', selected: settings.autoCancelUnclaimedHours === 0 }, ['Zima Auto-Cancel']),
          ]),
          createEl('span', { className: 'text-[11px] text-neutral-500 mt-1' }, ['Oda zisizochukuliwa zitawekwa ghairi na kurudishwa stoo kiotomatiki.']),
        ]),
      ]),

      createEl('div', { className: 'form-grid-3' }, [
        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Kiwango cha Chini cha Oda (Min Order KG)']),
          createEl('input', { name: 'minOrderKg', type: 'number', step: '0.1', min: '0.1', className: 'input', defaultValue: settings.minOrderKg || 0.5 }),
        ]),

        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Kiasi cha Chini cha Malipo (Min Amount TZS)']),
          createEl('input', { name: 'minOrderAmount', type: 'number', step: '500', min: '500', className: 'input', defaultValue: settings.minOrderAmount || 2000 }),
        ]),

        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Muda wa Mwisho wa Kupokea Oda (Cutoff Time)']),
          createEl('input', { name: 'cutoffTime', type: 'time', className: 'input', defaultValue: settings.cutoffTime || '19:30' }),
        ]),
      ]),

      createEl('div', { className: 'flex justify-end pt-2' }, [
        createEl('button', { type: 'submit', className: 'btn btn--primary' }, [
          createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['save']),
          createEl('span', {}, ['Hifadhi Sheria za Oda']),
        ]),
      ]),
    ]),
  ]);
}

/**
 * TAB 5: Notifications & Per-Category Low-Stock Thresholds
 */
function renderNotificationsTab(settings, dispatch) {
  const catT = settings.categoryThresholds || {};

  return createEl('div', { className: 'settings-panel flex flex-col gap-6' }, [
    createEl('div', { className: 'border-b border-neutral-200 pb-3' }, [
      createEl('h2', { className: 'text-lg font-bold text-slate-900 flex items-center gap-2' }, [
        createEl('span', { className: 'material-symbols-outlined text-primary' }, ['notifications_active']),
        createEl('span', {}, ['5. Ujumbe wa WhatsApp/SMS & Viwango vya Tahadhari za Stoo']),
      ]),
      createEl('p', { className: 'text-xs text-neutral-500' }, ['Tengeneza jumbe za kugawa kwa wateja na kuweka tahadhari tofauti za nyama (ng\'ombe vs kuku).']),
    ]),

    createEl('form', {
      className: 'flex flex-col gap-5',
      onSubmit: (e) => {
        e.preventDefault();
        const form = e.target;
        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: {
            whatsappTemplate: form.whatsappTemplate.value.trim(),
            categoryThresholds: {
              "Nyama ya Ng'ombe": Number(form.cat_ngombe.value) || 10,
              "Nyama ya Mbuzi": Number(form.cat_mbuzi.value) || 8,
              "Kuku wa Kienyeji": Number(form.cat_kuku.value) || 5,
              "Oda Maalumu": Number(form.cat_special.value) || 3,
            }
          }
        });
      },
    }, [
      // WhatsApp Template Editor
      createEl('div', { className: 'form-group' }, [
        createEl('label', { className: 'label font-bold text-slate-900 flex items-center justify-between' }, [
          createEl('span', {}, ['Ujumbe wa WhatsApp Mteja Oda Inapokuwa Tayari (WhatsApp Notification Template)']),
          createEl('span', { className: 'text-[11px] text-primary font-normal' }, ['Maneno Maalumu: {customer}, {orderId}, {storeName}, {branch}, {total}']),
        ]),
        createEl('textarea', {
          name: 'whatsappTemplate',
          className: 'input text-xs font-mono leading-relaxed h-24 p-3',
          defaultValue: settings.whatsappTemplate || 'Habari {customer}, oda yako ya nyama #{orderId} kutoka {storeName} ({branch}) ipo tayari kwa ajili ya kuchukuliwa! Jumla ni {total}. Karibu sana!',
        }),
      ]),

      // Category-Specific Low Stock Thresholds Box
      createEl('div', { className: 'p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3' }, [
        createEl('h3', { className: 'font-bold text-sm text-slate-900 flex items-center gap-1.5' }, [
          createEl('span', { className: 'material-symbols-outlined text-primary text-[18px]' }, ['inventory']),
          createEl('span', {}, ['Viwango vya Tahadhari ya Stoo kwa Kazi ya Aina za Nyama (Category Low-Stock Thresholds)']),
        ]),
        createEl('p', { className: 'text-xs text-neutral-500 mb-1' }, [
          'Nyama ya ng\'ombe au mbuzi inaharibika/inauzwa kwa viwango tofauti na kuku. Weka tahadhari ya kilo za chini kwa kila kundi.'
        ]),

        createEl('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs' }, [
          createEl('div', { className: 'flex flex-col gap-1 p-2.5 bg-white rounded border border-slate-200' }, [
            createEl('span', { className: 'font-bold text-slate-800' }, ['🐂 Nyama ya Ng\'ombe']),
            createEl('input', { name: 'cat_ngombe', type: 'number', className: 'input text-xs py-1', defaultValue: catT["Nyama ya Ng'ombe"] || 10 }),
            createEl('span', { className: 'text-[10px] text-neutral-400' }, ['Threshold KG']),
          ]),
          createEl('div', { className: 'flex flex-col gap-1 p-2.5 bg-white rounded border border-slate-200' }, [
            createEl('span', { className: 'font-bold text-slate-800' }, ['🐐 Nyama ya Mbuzi']),
            createEl('input', { name: 'cat_mbuzi', type: 'number', className: 'input text-xs py-1', defaultValue: catT["Nyama ya Mbuzi"] || 8 }),
            createEl('span', { className: 'text-[10px] text-neutral-400' }, ['Threshold KG']),
          ]),
          createEl('div', { className: 'flex flex-col gap-1 p-2.5 bg-white rounded border border-slate-200' }, [
            createEl('span', { className: 'font-bold text-slate-800' }, ['🐓 Kuku wa Kienyeji']),
            createEl('input', { name: 'cat_kuku', type: 'number', className: 'input text-xs py-1', defaultValue: catT["Kuku wa Kienyeji"] || 5 }),
            createEl('span', { className: 'text-[10px] text-neutral-400' }, ['Threshold Idadi']),
          ]),
          createEl('div', { className: 'flex flex-col gap-1 p-2.5 bg-white rounded border border-slate-200' }, [
            createEl('span', { className: 'font-bold text-slate-800' }, ['✨ Oda Maalumu / Sekela']),
            createEl('input', { name: 'cat_special', type: 'number', className: 'input text-xs py-1', defaultValue: catT["Oda Maalumu"] || 3 }),
            createEl('span', { className: 'text-[10px] text-neutral-400' }, ['Threshold KG']),
          ]),
        ]),
      ]),

      createEl('div', { className: 'flex justify-end pt-2' }, [
        createEl('button', { type: 'submit', className: 'btn btn--primary' }, [
          createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['save']),
          createEl('span', {}, ['Hifadhi Taarifa za Ujumbe']),
        ]),
      ]),
    ]),
  ]);
}

/**
 * TAB 6: Receipts & Thermal Printing (ESC/POS 58mm/80mm)
 */
function renderReceiptsThermalTab(settings, dispatch) {
  return createEl('div', { className: 'settings-panel flex flex-col gap-6' }, [
    createEl('div', { className: 'border-b border-neutral-200 pb-3' }, [
      createEl('h2', { className: 'text-lg font-bold text-slate-900 flex items-center gap-2' }, [
        createEl('span', { className: 'material-symbols-outlined text-primary' }, ['print']),
        createEl('span', {}, ['6. Mfumo wa Risiti, Namba ya TIN, na Printers za Kaunta (Thermal Print)']),
      ]),
      createEl('p', { className: 'text-xs text-neutral-500' }, ['Configure receipt formats, business tax numbers, and thermal paper width for counter POS printers.']),
    ]),

    createEl('form', {
      className: 'flex flex-col gap-5',
      onSubmit: (e) => {
        e.preventDefault();
        const form = e.target;
        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: {
            receiptPrefix: form.receiptPrefix.value.trim(),
            receiptFormat: form.receiptFormat.value.trim(),
            thermalWidth: form.thermalWidth.value,
            tinNumber: form.tinNumber.value.trim(),
          }
        });
      },
    }, [
      createEl('div', { className: 'form-grid-3' }, [
        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Prefix ya Namba ya Risiti']),
          createEl('input', { name: 'receiptPrefix', type: 'text', className: 'input font-mono', defaultValue: settings.receiptPrefix || 'NF' }),
        ]),

        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Ukubwa wa Karatasi ya Thermal Printer']),
          createEl('select', { name: 'thermalWidth', className: 'input select font-bold' }, [
            createEl('option', { value: '80mm', selected: (settings.thermalWidth || '80mm') === '80mm' }, ['80mm (Standard POS Counter)']),
            createEl('option', { value: '58mm', selected: settings.thermalWidth === '58mm' }, ['58mm (Mini Handheld Printer)']),
          ]),
        ]),

        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Namba ya TIN ya Duka']),
          createEl('input', { name: 'tinNumber', type: 'text', className: 'input font-mono', defaultValue: settings.tinNumber || '123-456-789' }),
        ]),
      ]),

      createEl('div', { className: 'p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between' }, [
        createEl('div', {}, [
          createEl('h4', { className: 'font-bold text-sm text-slate-900' }, ['Mhakiki wa Risiti ya Mfano (Print Receipt Preview)']),
          createEl('p', { className: 'text-xs text-neutral-500' }, ['Tazama na kujaribu kuchapisha risiti ya majaribio kwenye printer yako.']),
        ]),
        createEl('button', {
          type: 'button',
          className: 'btn btn--secondary btn--sm',
          onClick: () => {
            const sampleOrder = {
              id: `${settings.receiptPrefix || 'NF'}-2026-TEST`,
              customerName: 'Amina Baraka',
              contact: '0755 123 456',
              createdAt: new Date().toISOString(),
              items: [{ name: 'T-Bone Steak Special', qty: 2, priceEach: 18000 }],
              total: 36000,
              notes: 'Ufungaji safi wa mchuzi',
            };
            dispatch({ type: 'VIEW_ADMIN_RECEIPT', payload: sampleOrder });
          },
        }, ['🧾 Ongeza Risiti ya Mfano']),
      ]),

      createEl('div', { className: 'flex justify-end pt-2' }, [
        createEl('button', { type: 'submit', className: 'btn btn--primary' }, [
          createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['save']),
          createEl('span', {}, ['Hifadhi Mipangilio ya Risiti']),
        ]),
      ]),
    ]),
  ]);
}

/**
 * TAB 7: Swahili/English & Theme Accent Color
 */
function renderAppearanceThemeTab(settings, dispatch) {
  const currentTheme = settings.themeColor || '#700a12';

  const themePresets = [
    { name: 'Butchery Crimson', hex: '#700a12' },
    { name: 'Forest Emerald', hex: '#065f46' },
    { name: 'Royal Amber', hex: '#9a3412' },
    { name: 'Charcoal Slate', hex: '#1e293b' },
    { name: 'Deep Ocean', hex: '#1e3a8a' },
  ];

  return createEl('div', { className: 'settings-panel flex flex-col gap-6' }, [
    createEl('div', { className: 'border-b border-neutral-200 pb-3' }, [
      createEl('h2', { className: 'text-lg font-bold text-slate-900 flex items-center gap-2' }, [
        createEl('span', { className: 'material-symbols-outlined text-primary' }, ['palette']),
        createEl('span', {}, ['7. Lugha ya Mfumo na Muonekano wa Rangi (Theme Accent Color)']),
      ]),
      createEl('p', { className: 'text-xs text-neutral-500' }, ['Badili lugha kati ya Swahili na English na kuchagua rangi kuu ya muonekano wa duka.']),
    ]),

    createEl('form', {
      className: 'flex flex-col gap-5',
      onSubmit: (e) => {
        e.preventDefault();
        const form = e.target;
        const color = form.themeColor.value;
        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: {
            language: form.language.value,
            themeColor: color,
          }
        });
      },
    }, [
      createEl('div', { className: 'form-grid-2' }, [
        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Lugha ya Mfumo (System Language)']),
          createEl('select', { name: 'language', className: 'input select font-bold' }, [
            createEl('option', { value: 'sw', selected: (settings.language || 'sw') === 'sw' }, ['🇹🇿 Kiswahili (Default)']),
            createEl('option', { value: 'en', selected: settings.language === 'en' }, ['🇬🇧 English']),
          ]),
        ]),

        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label' }, ['Rangi Kuu ya Mfumo (Theme Accent Color)']),
          createEl('div', { className: 'flex items-center gap-3' }, [
            createEl('input', {
              type: 'color',
              name: 'themeColor',
              id: 'theme-color-picker',
              defaultValue: currentTheme,
              className: 'w-12 h-10 rounded border border-slate-300 cursor-pointer p-0.5',
            }),
            createEl('span', { className: 'text-xs font-mono font-bold text-slate-700' }, [currentTheme]),
          ]),
        ]),
      ]),

      // Theme Preset Color Swatches
      createEl('div', { className: 'p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3' }, [
        createEl('h4', { className: 'font-bold text-sm text-slate-900' }, ['Chagua Paleti za Rangi Zilizojiandaa (Preset Palettes)']),
        createEl('div', { className: 'flex flex-wrap items-center gap-3' },
          themePresets.map(preset => createEl('button', {
            type: 'button',
            className: `flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${currentTheme === preset.hex ? 'border-slate-900 ring-2 ring-slate-900/20 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-100'}`,
            onClick: () => {
              const picker = document.getElementById('theme-color-picker');
              if (picker) picker.value = preset.hex;
              dispatch({ type: 'UPDATE_SETTINGS', payload: { themeColor: preset.hex } });
            },
          }, [
            createEl('span', { className: 'w-4 h-4 rounded-full border border-black/20', style: `background-color: ${preset.hex};` }),
            createEl('span', {}, [preset.name]),
          ]))
        ),
      ]),

      createEl('div', { className: 'flex justify-end pt-2' }, [
        createEl('button', { type: 'submit', className: 'btn btn--primary' }, [
          createEl('span', { className: 'material-symbols-outlined text-[18px]' }, ['save']),
          createEl('span', {}, ['Hifadhi Muonekano']),
        ]),
      ]),
    ]),
  ]);
}

/**
 * TAB 8: Data Diagnostics, Backup/Restore, & PIN-Protected Clear All Data
 */
function renderDataManagementTab({ inventory, orders, settings, kbUsed, percentUsed }, dispatch) {
  return createEl('div', { className: 'settings-panel flex flex-col gap-6' }, [
    createEl('div', { className: 'border-b border-neutral-200 pb-3' }, [
      createEl('h2', { className: 'text-lg font-bold text-slate-900 flex items-center gap-2' }, [
        createEl('span', { className: 'material-symbols-outlined text-primary' }, ['database']),
        createEl('span', {}, ['8. Usimamizi wa Hifadhi na Kufuta Data (Data & Factory Reset)']),
      ]),
      createEl('p', { className: 'text-xs text-neutral-500' }, ['Pakua nakala ya akiba (JSON backup), rejesha data, au kufuta kabisa mfumo (Factory Reset).']),
    ]),

    // Storage Diagnostics (4 Metric Cards)
    createEl('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' }, [
      createEl('div', { className: 'kpi-card' }, [
        createEl('div', { className: 'kpi-card__header' }, [
          createEl('span', { className: 'kpi-card__label' }, ['Injini ya Hifadhi']),
          createEl('div', { className: 'kpi-card__icon-box kpi-icon--slate' }, [
            createEl('span', { className: 'material-symbols-outlined text-[20px]' }, ['hard_drive']),
          ]),
        ]),
        createEl('span', { className: 'text-xl font-bold text-slate-900 font-heading' }, ['LocalStorage']),
        createEl('div', { className: 'flex items-center gap-1.5 mt-1 text-xs text-success font-semibold' }, [
          createEl('span', { className: 'pulse-dot bg-emerald-600' }),
          createEl('span', {}, ['Inafanya Kazi Salama']),
        ]),
      ]),

      createEl('div', { className: 'kpi-card' }, [
        createEl('div', { className: 'kpi-card__header' }, [
          createEl('span', { className: 'kpi-card__label' }, ['Rekodi Zilizopo']),
          createEl('div', { className: 'kpi-card__icon-box kpi-icon--emerald' }, [
            createEl('span', { className: 'material-symbols-outlined text-[20px]' }, ['dataset']),
          ]),
        ]),
        createEl('span', { className: 'text-xl font-bold text-slate-900 font-heading' }, [
          `${inventory.length} Bidhaa • ${orders.length} Oda`
        ]),
        createEl('span', { className: 'kpi-card__hint' }, ['Katalogi imesawazishwa 100%']),
      ]),

      createEl('div', { className: 'kpi-card' }, [
        createEl('div', { className: 'kpi-card__header' }, [
          createEl('span', { className: 'kpi-card__label' }, ['Kumbukumbu']),
          createEl('div', { className: 'kpi-card__icon-box kpi-icon--primary' }, [
            createEl('span', { className: 'material-symbols-outlined text-[20px]' }, ['memory']),
          ]),
        ]),
        createEl('div', { className: 'flex items-baseline gap-2' }, [
          createEl('span', { className: 'text-xl font-bold text-primary font-heading' }, [`${kbUsed} KB`]),
          createEl('span', { className: 'text-xs text-neutral-500' }, ['/ 5,120 KB']),
        ]),
        createEl('div', { className: 'w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden' }, [
          createEl('div', {
            className: 'bg-emerald-600 h-full rounded-full transition-all duration-500',
            style: `width: ${percentUsed}%;`,
          }),
        ]),
      ]),

      createEl('div', { className: 'kpi-card' }, [
        createEl('div', { className: 'kpi-card__header' }, [
          createEl('span', { className: 'kpi-card__label' }, ['Usawazishaji']),
          createEl('div', { className: 'kpi-card__icon-box kpi-icon--amber' }, [
            createEl('span', { className: 'material-symbols-outlined text-[20px]' }, ['sync_saved_locally']),
          ]),
        ]),
        createEl('span', { className: 'text-xl font-bold text-slate-900 font-heading' }, ['Offline-First']),
        createEl('span', { className: 'kpi-card__hint text-neutral-600' }, ['Hakuna seva ya mbali inayohitajika']),
      ]),
    ]),

    // Data Action Cards (Bento Grid)
    createEl('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-5' }, [
      // Starter Pack
      createEl('div', { className: 'action-card-bento' }, [
        createEl('div', { className: 'action-card-bento__header' }, [
          createEl('div', { className: 'action-card-bento__icon-box bg-amber-100 text-amber-800' }, [
            createEl('span', { className: 'material-symbols-outlined text-[24px]' }, ['electric_bolt']),
          ]),
          createEl('span', { className: 'badge badge--low-stock text-[10px]' }, ['Majaribio']),
        ]),
        createEl('h3', { className: 'font-bold text-base text-slate-900 mt-2' }, ['Data za Mfano (Starter Pack)']),
        createEl('p', { className: 'text-xs text-neutral-600 leading-relaxed mt-1 flex-1' }, [
          'Inajaza mara moja nyama 6 kuu na oda za mfano ili kukusaidia kujaribu mfumo kwa haraka.'
        ]),
        createEl('button', {
          type: 'button',
          className: 'btn btn--secondary btn--full mt-4',
          onClick: () => {
            if (window.confirm('Je, unataka kuweka data za mfano za buchery sasa?')) {
              dispatch({ type: 'SEED_SAMPLE_DATA' });
            }
          },
        }, ['Pakia Data za Mfano']),
      ]),

      // Export JSON
      createEl('div', { className: 'action-card-bento' }, [
        createEl('div', { className: 'action-card-bento__header' }, [
          createEl('div', { className: 'action-card-bento__icon-box bg-emerald-100 text-emerald-800' }, [
            createEl('span', { className: 'material-symbols-outlined text-[24px]' }, ['sim_card_download']),
          ]),
          createEl('span', { className: 'badge badge--in-stock text-[10px]' }, ['Hifadhi Salama']),
        ]),
        createEl('h3', { className: 'font-bold text-base text-slate-900 mt-2' }, ['Hamisha Data (Export JSON)']),
        createEl('p', { className: 'text-xs text-neutral-600 leading-relaxed mt-1 flex-1' }, [
          'Pakua faili kamili la JSON lenye bidhaa zote, historia ya oda, na mipangilio ya sasa.'
        ]),
        createEl('button', {
          type: 'button',
          className: 'btn btn--primary btn--full mt-4',
          onClick: () => triggerExportBackup(inventory, orders, settings),
        }, ['Pakua Nakala (JSON Backup)']),
      ]),

      // Restore JSON
      createEl('div', { className: 'action-card-bento' }, [
        createEl('div', { className: 'action-card-bento__header' }, [
          createEl('div', { className: 'action-card-bento__icon-box bg-sky-100 text-sky-800' }, [
            createEl('span', { className: 'material-symbols-outlined text-[24px]' }, ['settings_backup_restore']),
          ]),
          createEl('span', { className: 'badge badge--neutral text-[10px]' }, ['Urejeshaji']),
        ]),
        createEl('h3', { className: 'font-bold text-base text-slate-900 mt-2' }, ['Rejesha Data (Restore JSON)']),
        createEl('p', { className: 'text-xs text-neutral-600 leading-relaxed mt-1 flex-1' }, [
          'Pakia faili la JSON lililohifadhiwa awali ili kurejesha bidhaa na oda zako zote.'
        ]),
        createEl('button', {
          type: 'button',
          className: 'btn btn--secondary btn--full mt-4',
          onClick: () => {
            const el = document.getElementById('admin-restore-file-input');
            if (el) el.click();
          },
        }, ['Chagua Faili la JSON...']),
      ]),
    ]),

    // PIN Protected Danger Zone (Factory Reset)
    createEl('section', { className: 'settings-danger-box mt-2' }, [
      createEl('div', { className: 'flex items-start gap-3.5' }, [
        createEl('div', { className: 'danger-icon-box' }, [
          createEl('span', { className: 'material-symbols-outlined text-[26px] text-danger' }, ['warning']),
        ]),
        createEl('div', { className: 'flex-1' }, [
          createEl('div', { className: 'flex items-center gap-2 mb-1' }, [
            createEl('h3', { className: 'font-bold text-base text-danger' }, ['Eneo la Hatari: Futa Data Zote (Factory Reset)']),
            createEl('span', { className: 'bg-red-200 text-red-900 text-[10px] font-bold px-2 py-0.5 rounded' }, ['PIN Protected']),
          ]),
          createEl('p', { className: 'text-xs text-neutral-700 leading-relaxed' }, [
            'Hatua hii itafuta kabisa bidhaa zote, oda zote, na mipangilio ya duka kutoka kwenye kivinjari. Inahitaji idhini ya Security PIN.'
          ]),

          createEl('div', { className: 'mt-3 p-3 bg-white/80 rounded-lg border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3' }, [
            createEl('label', { className: 'flex items-center gap-2.5 cursor-pointer select-none text-xs font-bold text-slate-800' }, [
              createEl('input', {
                type: 'checkbox',
                id: 'confirm-wipe-checkbox',
                className: 'w-4 h-4 text-danger rounded border-red-300 accent-red-600',
                onChange: (e) => {
                  const wipeBtn = document.getElementById('btn-execute-wipe');
                  if (wipeBtn) {
                    wipeBtn.disabled = !e.target.checked;
                    wipeBtn.className = e.target.checked ? 'btn btn--danger' : 'btn btn--danger btn--disabled';
                  }
                },
              }),
              createEl('span', {}, ['Nathibitisha kuwa ninataka kufuta kabisa data yote ya duka']),
            ]),

            createEl('button', {
              type: 'button',
              id: 'btn-execute-wipe',
              className: 'btn btn--danger btn--disabled shrink-0',
              disabled: true,
              onClick: () => {
                const check = document.getElementById('confirm-wipe-checkbox');
                if (!check || !check.checked) return;
                activePinModal = {
                  title: 'Tahadhari Kubwa: Clear All Data',
                  prompt: 'Weka Security PIN ya Admin kuthibitisha kufuta data yote ya duka:',
                  requiredPin: settings.securityPin || '1234',
                  onSuccess: () => dispatch({ type: 'RESET_ALL_DATA' }),
                };
                dispatch({ type: 'RENDER' });
              },
            }, [
              createEl('span', { className: 'material-symbols-outlined text-[16px]' }, ['delete_forever']),
              createEl('span', {}, ['Futa Data Yote Sasa']),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]);
}

/**
 * Trigger export of backup JSON
 */
function triggerExportBackup(inventory, orders, settings) {
  const payload = {
    app: 'Nyama Fresh Butchery OS',
    version: '2.5.0',
    exportDate: new Date().toISOString(),
    storeName: settings?.storeName || 'Nyama Fresh Butchery',
    inventory,
    orders,
    settings,
  };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const dl = document.createElement('a');
  dl.setAttribute('href', dataStr);
  dl.setAttribute('download', `nyamafresh_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(dl);
  dl.click();
  document.body.removeChild(dl);
}

/**
 * Security PIN Verification Dialog
 */
function renderPinVerificationModal(modalState, dispatch) {
  const backdrop = createEl('div', { className: 'modal-backdrop' });

  const dialog = createEl('div', { className: 'modal-dialog animate-scale-in max-w-sm' }, [
    createEl('div', { className: 'modal-header' }, [
      createEl('div', {}, [
        createEl('h3', { className: 'font-bold text-base text-slate-900 flex items-center gap-1.5' }, [
          createEl('span', { className: 'material-symbols-outlined text-danger' }, ['security']),
          createEl('span', {}, [modalState.title || 'Uthibitisho wa Usalama']),
        ]),
      ]),
      createEl('button', {
        type: 'button',
        className: 'btn-icon',
        onClick: () => {
          activePinModal = null;
          dispatch({ type: 'RENDER' });
        },
      }, ['✕']),
    ]),

    createEl('form', {
      className: 'modal-body flex flex-col gap-4 mt-2',
      onSubmit: (e) => {
        e.preventDefault();
        const entered = e.target.pinInput.value.trim();
        if (entered === modalState.requiredPin) {
          activePinModal = null;
          modalState.onSuccess();
        } else {
          alert('PIN siyo sahihi! Tafadhali jaribu tena.');
        }
      },
    }, [
      createEl('p', { className: 'text-xs text-neutral-600' }, [modalState.prompt || 'Ingiza PIN yako:']),

      createEl('input', {
        name: 'pinInput',
        type: 'password',
        className: 'input text-center text-lg font-mono tracking-widest font-bold py-2',
        placeholder: '••••',
        maxLength: 8,
        autoFocus: true,
        required: true,
      }),

      createEl('div', { className: 'modal-actions flex justify-end gap-2 mt-2' }, [
        createEl('button', {
          type: 'button',
          className: 'btn btn--secondary btn--sm',
          onClick: () => {
            activePinModal = null;
            dispatch({ type: 'RENDER' });
          },
        }, ['Ghairi']),

        createEl('button', {
          type: 'submit',
          className: 'btn btn--primary btn--sm',
        }, ['Thibitisha']),
      ]),
    ]),
  ]);

  backdrop.appendChild(dialog);
  return backdrop;
}

/**
 * Thermal Receipt Counter Preview Dialog (ESC/POS 58mm/80mm Compatible)
 */
function renderAdminReceiptDialog(order, dispatch, currency = 'TZS', settings = {}) {
  const backdrop = createEl('div', { className: 'modal-backdrop' });
  const widthClass = (settings?.thermalWidth === '58mm') ? 'max-w-[280px]' : 'max-w-md';

  const dialog = createEl('div', { className: `modal-dialog receipt-dialog animate-scale-in ${widthClass}` }, [
    createEl('div', { className: 'receipt-header text-center' }, [
      createEl('div', { className: 'receipt-success-icon text-3xl mb-1' }, ['🥩']),
      createEl('h2', { className: 'receipt-title text-lg font-extrabold font-mono uppercase' }, [settings.storeName || 'Nyama Fresh Butchery']),
      createEl('p', { className: 'receipt-subtitle text-[11px] text-neutral-600 font-mono' }, [
        settings.storeTagline || 'Kariakoo Msimbazi, Dar es Salaam'
      ]),
      createEl('p', { className: 'text-[10px] text-neutral-500 font-mono' }, [
        `TIN: ${settings.tinNumber || '123-456-789'} • Simu: ${settings.storePhone || '0712 345 678'}`
      ]),
    ]),

    createEl('div', { className: 'receipt-card my-3 font-mono text-xs' }, [
      createEl('div', { className: 'flex justify-between text-[11px] border-b border-dashed border-slate-400 pb-2 mb-2' }, [
        createEl('span', { className: 'font-bold' }, [`RISITI: #${order.id}`]),
        createEl('span', {}, [formatDate(order.createdAt)]),
      ]),
      createEl('div', { className: 'font-bold text-xs mb-1' }, [`MTEJA: ${order.customerName} (${order.contact})`]),
      order.notes ? createEl('div', { className: 'text-[11px] italic bg-slate-100 p-1 rounded mb-2' }, [
        `Maelekezo: "${order.notes}"`
      ]) : null,

      createEl('div', { className: 'flex flex-col gap-1 border-t border-b border-dashed border-slate-400 py-2 my-2' },
        order.items.map(item => createEl('div', { className: 'flex justify-between items-center text-[11px]' }, [
          createEl('span', {}, [`${item.qty}x ${item.name}`]),
          createEl('span', { className: 'font-bold' }, [formatCurrency(item.priceEach * item.qty, currency)]),
        ]))
      ),

      createEl('div', { className: 'flex justify-between items-center font-bold text-sm pt-1' }, [
        createEl('span', {}, ['JUMLA KUHUSIKA:']),
        createEl('span', { className: 'receipt-total-price text-primary font-extrabold' }, [formatCurrency(order.total, currency)]),
      ]),

      createEl('div', { className: 'text-center text-[10px] text-neutral-500 mt-4 border-t border-dashed border-slate-300 pt-2' }, [
        '*** Asante Kwa Kuchagua Nyama Fresh ***',
        createEl('br'),
        'Karibu Tena Duka la Nyama Safi!'
      ]),
    ]),

    createEl('div', { className: 'modal-actions mt-3 flex items-center justify-between' }, [
      createEl('button', {
        type: 'button',
        className: 'btn btn--secondary btn--sm',
        onClick: () => window.print(),
      }, [
        createEl('span', { className: 'material-symbols-outlined text-[16px]' }, ['print']),
        createEl('span', {}, ['Chapisha Risiti']),
      ]),
      createEl('button', {
        type: 'button',
        className: 'btn btn--primary btn--sm',
        onClick: () => dispatch({ type: 'CLOSE_ADMIN_RECEIPT' }),
      }, ['Funga Risiti']),
    ]),
  ]);

  backdrop.appendChild(dialog);
  return backdrop;
}

/**
 * Modal to Register Manual Phone / Walk-in Order from Counter
 */
function renderManualOrderModal(state, dispatch) {
  const { inventory, settings } = state;
  const currency = settings?.currency || 'TZS';
  const backdrop = createEl('div', { className: 'modal-backdrop' });

  const modal = createEl('div', { className: 'modal-dialog animate-scale-in max-w-lg' }, [
    createEl('div', { className: 'modal-header' }, [
      createEl('div', {}, [
        createEl('h3', { className: 'font-bold text-lg text-slate-900 flex items-center gap-2' }, [
          createEl('span', { className: 'material-symbols-outlined text-primary' }, ['add_call']),
          createEl('span', {}, ['Sajili Oda ya Simu / Kaunta']),
        ]),
        createEl('p', { className: 'text-xs text-neutral-500' }, ['Weka oda ya mteja aliyepiga simu au aliyetuma ujumbe']),
      ]),
      createEl('button', {
        type: 'button',
        className: 'btn-icon',
        onClick: () => dispatch({ type: 'CLOSE_MANUAL_ORDER_MODAL' }),
      }, ['✕']),
    ]),

    createEl('form', {
      className: 'modal-body flex flex-col gap-4',
      onSubmit: (e) => {
        e.preventDefault();
        const form = e.target;
        const prod = inventory.find(p => p.id === form.productId.value);
        if (!prod) {
          alert('Chagua nyama halisi');
          return;
        }
        const qty = Number(form.quantity.value) || 1;
        if (qty > prod.quantity) {
          alert(`Kiasi hakitoshi stoo! Kilichopo ni ${prod.quantity} kg.`);
          return;
        }

        dispatch({
          type: 'ADD_MANUAL_ORDER',
          payload: {
            customerName: form.customerName.value.trim(),
            contact: form.contact.value.trim(),
            notes: form.notes.value.trim(),
            paymentMethod: form.paymentMethod.value || 'Cash',
            items: [{
              productId: prod.id,
              name: prod.name,
              priceEach: prod.price,
              qty,
            }],
          }
        });
      },
    }, [
      createEl('div', { className: 'form-group' }, [
        createEl('label', { className: 'label', htmlFor: 'mo-customerName' }, ['Jina la Mteja']),
        createEl('input', {
          id: 'mo-customerName',
          name: 'customerName',
          type: 'text',
          className: 'input',
          placeholder: 'mf. Mama Baraka',
          required: true,
        }),
      ]),

      createEl('div', { className: 'form-grid-2' }, [
        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label', htmlFor: 'mo-contact' }, ['Namba ya Simu']),
          createEl('input', {
            id: 'mo-contact',
            name: 'contact',
            type: 'text',
            className: 'input',
            placeholder: '07XX XXX XXX',
            required: true,
          }),
        ]),

        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label', htmlFor: 'mo-payment' }, ['Njia ya Malipo']),
          createEl('select', { id: 'mo-payment', name: 'paymentMethod', className: 'input select' }, [
            createEl('option', { value: 'Cash' }, ['Cash (Pesa Taslimu)']),
            createEl('option', { value: 'M-Pesa' }, ['Vodacom M-Pesa']),
            createEl('option', { value: 'Tigo Pesa' }, ['Tigo Pesa']),
            createEl('option', { value: 'Airtel Money' }, ['Airtel Money']),
          ]),
        ]),
      ]),

      createEl('div', { className: 'form-grid-2' }, [
        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label', htmlFor: 'mo-product' }, ['Chagua Nyama']),
          createEl('select', {
            id: 'mo-product',
            name: 'productId',
            className: 'input select',
            required: true,
          }, inventory.map(p => createEl('option', { value: p.id }, [
            `${p.name} (${formatCurrency(p.price, currency)} - Stoo: ${p.quantity}kg)`
          ]))),
        ]),

        createEl('div', { className: 'form-group' }, [
          createEl('label', { className: 'label', htmlFor: 'mo-qty' }, ['Kilo / Idadi']),
          createEl('input', {
            id: 'mo-qty',
            name: 'quantity',
            type: 'number',
            step: '0.5',
            min: '0.5',
            className: 'input',
            defaultValue: '1',
            required: true,
          }),
        ]),
      ]),

      createEl('div', { className: 'form-group' }, [
        createEl('label', { className: 'label', htmlFor: 'mo-notes' }, ['Maelekezo Maalumu ya Ukataji (Hiari)']),
        createEl('input', {
          id: 'mo-notes',
          name: 'notes',
          type: 'text',
          className: 'input',
          placeholder: 'mf. Kata vipande vidogo vya mchuzi',
        }),
      ]),

      createEl('div', { className: 'modal-actions' }, [
        createEl('button', {
          type: 'button',
          className: 'btn btn--secondary',
          onClick: () => dispatch({ type: 'CLOSE_MANUAL_ORDER_MODAL' }),
        }, ['Ghairi']),
        createEl('button', {
          type: 'submit',
          className: 'btn btn--primary',
        }, [
          createEl('span', { className: 'material-symbols-outlined text-[16px]' }, ['check']),
          createEl('span', {}, ['Hifadhi Oda']),
        ]),
      ]),
    ]),
  ]);

  backdrop.appendChild(modal);
  return backdrop;
}

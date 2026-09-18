/**
 * Authentication Views System (Login, Registration, Password Recovery)
 * Uses high-character brand design with crimson butcher tones, gold accents, and tactile PIN keypad.
 */
import { createEl, clearEl } from '../utils/dom.js';
import { renderToast } from '../components/toast.js';

let registerRole = 'customer'; // 'customer' | 'cashier' | 'butcher' | 'owner'

/**
 * Common Hero Side Panel for Authentication Pages
 */
function createAuthHeroSide(settings, subtitleText) {
  return createEl('div', { className: 'auth-hero-side' }, [
    // Top Brand Header
    createEl('a', { href: '#/shop', className: 'auth-hero-brand' }, [
      createEl('div', { className: 'auth-hero-brand__icon' }, ['🥩']),
      createEl('div', {}, [
        createEl('div', { className: 'auth-hero-brand__title' }, [settings?.storeName || 'Nyama Fresh']),
        createEl('div', { className: 'auth-hero-brand__sub' }, [settings?.storeTagline || 'Kariakoo Msimbazi, Dar es Salaam']),
      ]),
    ]),

    // Center Content
    createEl('div', { className: 'auth-hero-content' }, [
      createEl('div', { className: 'auth-hero-badge' }, [
        createEl('span', { className: 'material-symbols-outlined', style: 'font-size: 1.1rem;' }, ['verified_user']),
        'Mfumo wa Uthibitisho wa Barua Pepe',
      ]),
      createEl('h2', { className: 'auth-hero-heading' }, ['Nyama Safi, Akiba ya Pre-Order & POS']),
      createEl('p', { className: 'auth-hero-desc' }, [
        subtitleText || 'Ingia kwa Barua Pepe kwenye portal ya Nyama Fresh kusimamia oda za wateja au kufanya pre-order ya steki.'
      ]),
    ]),

    // Bottom Feature Highlights
    createEl('div', { className: 'auth-hero-features' }, [
      createEl('div', { className: 'auth-hero-feature-item' }, [
        createEl('div', { className: 'auth-hero-feature-icon' }, ['✓']),
        'Uthibitisho Salama kwa Barua Pepe (Email Authentication)',
      ]),
      createEl('div', { className: 'auth-hero-feature-item' }, [
        createEl('div', { className: 'auth-hero-feature-icon' }, ['✓']),
        'Uthibitisho wa Oda na Taarifa za Wateja kwa WhatsApp & SMS',
      ]),
      createEl('div', { className: 'auth-hero-feature-item' }, [
        createEl('div', { className: 'auth-hero-feature-icon' }, ['✓']),
        'Ufikiaji Maalumu kwa Wateja na Wafanyakazi (Role Isolation)',
      ]),
    ]),
  ]);
}

/**
 * Render Login View (#login) - Email Only Authentication
 */
export function renderLoginView(state, dispatch) {
  const root = document.getElementById('app');
  if (!root) return;
  clearEl(root);

  const { settings, toast } = state;

  const emailFormSide = createEl('div', { className: 'auth-form-side' }, [
    createEl('div', { className: 'auth-header' }, [
      createEl('h1', { className: 'auth-title' }, ['Ingia Kwenye Akaunti']),
      createEl('p', { className: 'auth-subtitle' }, ['Weka barua pepe na nywila yako kuingia kwenye akaunti yako ya Nyama Fresh']),
    ]),

    createEl('form', {
      onSubmit: (e) => {
        e.preventDefault();
        const email = e.target.email.value.trim().toLowerCase();
        const password = e.target.password.value;

        const staffList = settings?.staffList || [
          { id: 'st_1', name: 'Baraka Mwangi', role: 'owner', email: 'owner@nyamafresh.co.tz' },
          { id: 'st_2', name: 'Amina Salum', role: 'cashier', email: 'cashier@nyamafresh.co.tz' },
          { id: 'st_3', name: 'Juma Mchinjaji', role: 'butcher', email: 'butcher@nyamafresh.co.tz' },
        ];

        // Check if email belongs to a registered staff member
        const matchedStaff = staffList.find(s => s.email && s.email.toLowerCase() === email);

        if (matchedStaff) {
          // Authenticate as Staff
          dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
              currentRole: matchedStaff.role,
              currentStaffName: matchedStaff.name,
              currentUserEmail: email,
              isAuthenticated: true,
              userType: 'staff'
            }
          });
          dispatch({
            type: 'ADD_AUDIT_LOG',
            payload: {
              action: `Ameingia kwenye mfumo kwa barua pepe kama ${matchedStaff.name} (${matchedStaff.role.toUpperCase()})`
            }
          });
          dispatch({
            type: 'SHOW_TOAST',
            payload: { message: `Karibu sana ${matchedStaff.name}! Umeingia kikamilifu kama Staff (${matchedStaff.role.toUpperCase()}).`, type: 'success', id: Date.now() }
          });
          window.location.hash = '#/admin';
        } else {
          // Authenticate as Customer
          const rawName = email.split('@')[0] || 'Mteja';
          const nameFromEmail = rawName.charAt(0).toUpperCase() + rawName.slice(1);
          dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
              currentRole: 'customer',
              currentStaffName: nameFromEmail,
              currentUserEmail: email,
              isAuthenticated: true,
              userType: 'customer'
            }
          });
          dispatch({
            type: 'SHOW_TOAST',
            payload: { message: `Karibu sana ${nameFromEmail}! Umeingia kikamilifu kama Mteja.`, type: 'success', id: Date.now() }
          });
          window.location.hash = '#/shop';
        }
      }
    }, [
      createEl('div', { className: 'auth-input-field' }, [
        createEl('input', {
          type: 'email',
          name: 'email',
          className: 'input',
          placeholder: 'Barua Pepe (e.g. mteja@gmail.com au owner@nyamafresh.co.tz)',
          required: true
        }),
        createEl('span', { className: 'material-symbols-outlined' }, ['mail']),
      ]),

      createEl('div', { className: 'auth-input-field' }, [
        createEl('input', {
          type: 'password',
          name: 'password',
          className: 'input',
          placeholder: 'Nywila / Password',
          required: true
        }),
        createEl('span', { className: 'material-symbols-outlined' }, ['lock']),
      ]),

      createEl('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;' }, [
        createEl('label', { style: 'display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;' }, [
          createEl('input', { type: 'checkbox', defaultChecked: true }),
          'Kumbuka barua pepe hii',
        ]),
        createEl('a', { href: '#/forgot-password', className: 'auth-link', style: 'font-size: 0.85rem;' }, ['Umesahau Nywila?']),
      ]),

      createEl('button', { type: 'submit', className: 'btn btn--primary btn--full btn--lg' }, [
        createEl('span', { className: 'material-symbols-outlined' }, ['login']),
        'Ingia Kwenye Akaunti',
      ]),
    ]),

    // Quick Demo Account Guide
    createEl('div', { className: 'mt-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600' }, [
      createEl('div', { className: 'font-bold text-slate-800 mb-1 flex items-center gap-1' }, [
        createEl('span', { className: 'material-symbols-outlined text-[15px] text-amber-600' }, ['info']),
        'Akaunti za Mfano (Demo Logins):'
      ]),
      createEl('div', { className: 'grid grid-cols-1 gap-1 text-[11px]' }, [
        createEl('span', {}, ['• Staff (Mmiliki): owner@nyamafresh.co.tz']),
        createEl('span', {}, ['• Staff (Mhudumu): cashier@nyamafresh.co.tz']),
        createEl('span', {}, ['• Staff (Mchinjaji): butcher@nyamafresh.co.tz']),
        createEl('span', {}, ['• Mteja (Customer): email yoyote (e.g. mteja@gmail.com)']),
      ]),
    ]),

    // Auth Footer
    createEl('div', { className: 'auth-footer' }, [
      createEl('span', {}, ['Huna akaunti ya Nyama Fresh? ']),
      createEl('a', { href: '#/register', className: 'auth-link' }, ['Sajili Akaunti Mpya']),
    ]),
  ]);

  // Render Full Auth Wrapper
  const wrapper = createEl('div', { className: 'auth-page-wrapper' }, [
    createEl('div', { className: 'auth-container' }, [
      createEl('div', { className: 'auth-card-layout' }, [
        createAuthHeroSide(settings, 'Ingia kwa barua pepe kwenye portal ya Nyama Fresh butchery kusimamia oda au kufanya pre-order.'),
        emailFormSide,
      ]),
    ]),
  ]);

  root.appendChild(wrapper);

  if (toast) {
    root.appendChild(renderToast(toast, dispatch));
  }
}

/**
 * Render Registration View (#register)
 */
export function renderRegisterView(state, dispatch) {
  const root = document.getElementById('app');
  if (!root) return;
  clearEl(root);

  const { settings, toast } = state;

  const roles = [
    { id: 'customer', title: 'Mteja (Customer)', desc: 'Pre-order nyama fresh & pata arifa za WhatsApp', icon: 'person' },
    { id: 'cashier', title: 'Mhudumu (Cashier)', desc: 'Pokea malipo & thibitisha oda za duka', icon: 'payments' },
    { id: 'butcher', title: 'Mchinjaji (Butcher)', desc: 'Kata steki & sasisha kiasi cha nyama', icon: 'content_cut' },
    { id: 'owner', title: 'Mmiliki (Owner)', desc: 'Ufikiaji kamili wa taarifa na ripoti', icon: 'shield' },
  ];

  const formSide = createEl('div', { className: 'auth-form-side' }, [
    createEl('div', { className: 'auth-header' }, [
      createEl('h1', { className: 'auth-title' }, ['Sajili Akaunti Mpya']),
      createEl('p', { className: 'auth-subtitle' }, ['Tengeneza akaunti ya Nyama Fresh kupata huduma za pre-order na duka']),
    ]),

    createEl('form', {
      onSubmit: (e) => {
        e.preventDefault();
        const fullName = e.target.fullName.value;
        const email = e.target.email.value;
        const phone = e.target.phone.value;

        if (registerRole === 'customer') {
          dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
              currentRole: 'customer',
              currentStaffName: fullName,
              currentUserEmail: email,
              isAuthenticated: true,
              userType: 'customer'
            }
          });
          dispatch({
            type: 'SHOW_TOAST',
            payload: { message: `Hongera ${fullName}! Akaunti yako ya Mteja imesajiliwa kikamilifu. Karibu dukani!`, type: 'success', id: Date.now() }
          });
          window.location.hash = '#/shop';
        } else {
          // Staff registration
          const newStaff = {
            id: `st_${Date.now()}`,
            name: fullName,
            role: registerRole,
            phone: phone,
            pin: '1234'
          };
          const updatedList = [...(settings?.staffList || []), newStaff];
          dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
              staffList: updatedList,
              currentRole: registerRole,
              currentStaffName: fullName,
              currentUserEmail: email,
              isAuthenticated: true,
              userType: 'staff'
            }
          });
          dispatch({
            type: 'SHOW_TOAST',
            payload: { message: `Hongera ${fullName}! Akaunti yako ya Staff (${registerRole.toUpperCase()}) imesajiliwa kikamilifu!`, type: 'success', id: Date.now() }
          });
          window.location.hash = '#/admin';
        }
      }
    }, [
      createEl('div', { className: 'auth-input-field' }, [
        createEl('input', {
          type: 'text',
          name: 'fullName',
          className: 'input',
          placeholder: 'Jina Kamili (Full Name)',
          required: true
        }),
        createEl('span', { className: 'material-symbols-outlined' }, ['badge']),
      ]),

      createEl('div', { className: 'auth-input-field' }, [
        createEl('input', {
          type: 'email',
          name: 'email',
          className: 'input',
          placeholder: 'Barua Pepe (Email Address)',
          required: true
        }),
        createEl('span', { className: 'material-symbols-outlined' }, ['mail']),
      ]),

      createEl('div', { className: 'auth-input-field' }, [
        createEl('input', {
          type: 'tel',
          name: 'phone',
          className: 'input',
          placeholder: 'Namba ya Simu (0712 345 678)',
          required: true
        }),
        createEl('span', { className: 'material-symbols-outlined' }, ['phone']),
      ]),

      // Role Selection Grid
      createEl('label', { className: 'label', style: 'margin-bottom: 0.5rem; display: block;' }, ['Chagua Aina ya Akaunti:']),
      createEl('div', { className: 'auth-role-grid' }, roles.map(r =>
        createEl('div', {
          className: `auth-role-card ${registerRole === r.id ? 'auth-role-card--active' : ''}`,
          onClick: () => {
            registerRole = r.id;
            renderRegisterView(state, dispatch);
          }
        }, [
          createEl('div', { className: 'auth-role-title' }, [
            r.title,
            createEl('span', { className: 'material-symbols-outlined', style: 'font-size: 1.1rem; color: var(--color-primary);' }, [r.icon]),
          ]),
          createEl('div', { className: 'auth-role-desc' }, [r.desc]),
        ])
      )),

      createEl('div', { className: 'auth-input-field' }, [
        createEl('input', {
          type: 'password',
          name: 'password',
          className: 'input',
          placeholder: 'Nywila (Password - angalau tarakimu 6)',
          minLength: 6,
          required: true
        }),
        createEl('span', { className: 'material-symbols-outlined' }, ['lock']),
      ]),

      createEl('button', { type: 'submit', className: 'btn btn--primary btn--full btn--lg' }, [
        createEl('span', { className: 'material-symbols-outlined' }, ['person_add']),
        'Kamilisha Usajili wa Akaunti',
      ]),
    ]),

    createEl('div', { className: 'auth-footer' }, [
      createEl('span', {}, ['Una akaunti tayari? ']),
      createEl('a', { href: '#/login', className: 'auth-link' }, ['Ingia Hapa']),
    ]),
  ]);

  const wrapper = createEl('div', { className: 'auth-page-wrapper' }, [
    createEl('div', { className: 'auth-container' }, [
      createEl('div', { className: 'auth-card-layout' }, [
        createAuthHeroSide(settings, 'Jiunge na Nyama Fresh ufurahie uwekaji wa akiba ya nyama bila malipo ya awali na kufuatilia oda zako kwa simu.'),
        formSide,
      ]),
    ]),
  ]);

  root.appendChild(wrapper);

  if (toast) {
    root.appendChild(renderToast(toast, dispatch));
  }
}

/**
 * Render Forgot Password View (#forgot-password)
 */
export function renderForgotPasswordView(state, dispatch) {
  const root = document.getElementById('app');
  if (!root) return;
  clearEl(root);

  const { settings, toast } = state;

  const formSide = createEl('div', { className: 'auth-form-side' }, [
    createEl('div', { className: 'auth-header' }, [
      createEl('h1', { className: 'auth-title' }, ['Umesahau Nywila?']),
      createEl('p', { className: 'auth-subtitle' }, ['Ingiza barua pepe yako au namba ya simu ili kupokea kiungo cha kurejesha nywila']),
    ]),

    createEl('form', {
      onSubmit: (e) => {
        e.preventDefault();
        const contact = e.target.contact.value;
        dispatch({
          type: 'SET_TOAST',
          payload: { message: `Kiungo cha kurejesha nywila kimetumwa kwa ${contact}! Check barua pepe au SMS.`, type: 'success' }
        });
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 1500);
      }
    }, [
      createEl('div', { className: 'auth-input-field' }, [
        createEl('input', {
          type: 'text',
          name: 'contact',
          className: 'input',
          placeholder: 'Barua Pepe au Namba ya Simu',
          required: true
        }),
        createEl('span', { className: 'material-symbols-outlined' }, ['contact_mail']),
      ]),

      createEl('button', { type: 'submit', className: 'btn btn--primary btn--full btn--lg' }, [
        createEl('span', { className: 'material-symbols-outlined' }, ['send']),
        'Tuma Kiungo cha Kurejesha',
      ]),
    ]),

    createEl('div', { className: 'auth-footer' }, [
      createEl('a', { href: '#/login', className: 'auth-link' }, ['← Rudi kwenye Kuingia (Back to Login)']),
    ]),
  ]);

  const wrapper = createEl('div', { className: 'auth-page-wrapper' }, [
    createEl('div', { className: 'auth-container' }, [
      createEl('div', { className: 'auth-card-layout' }, [
        createAuthHeroSide(settings, 'Ulinzi na Usalama wa Akaunti Yako ya Nyama Fresh Portal.'),
        formSide,
      ]),
    ]),
  ]);

  root.appendChild(wrapper);

  if (toast) {
    root.appendChild(renderToast(toast, dispatch));
  }
}

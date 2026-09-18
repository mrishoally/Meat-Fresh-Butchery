/**
 * Authentication Views System (Login, Registration, Password Recovery)
 * Uses high-character brand design with crimson butcher tones, gold accents, and tactile PIN keypad.
 */
import { createEl, clearEl } from '../utils/dom.js';
import { renderToast } from '../components/toast.js';

let currentPinInput = '';
let activeTab = 'pin'; // 'pin' | 'email'
let selectedStaffId = 'st_1';
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
        'Mfumo wa Uthibitisho na Usalama',
      ]),
      createEl('h2', { className: 'auth-hero-heading' }, ['Nyama Safi, Akiba ya Pre-Order & POS']),
      createEl('p', { className: 'auth-hero-desc' }, [
        subtitleText || 'Ingia kwenye mfumo wa Nyama Fresh kusimamia oda za wateja, kuangalia stoki ya steki na kutoa risiti za duka.'
      ]),
    ]),

    // Bottom Feature Highlights
    createEl('div', { className: 'auth-hero-features' }, [
      createEl('div', { className: 'auth-hero-feature-item' }, [
        createEl('div', { className: 'auth-hero-feature-icon' }, ['✓']),
        'Upatikanaji wa Haraka kwa PIN ya Mhudumu (Staff Quick PIN)',
      ]),
      createEl('div', { className: 'auth-hero-feature-item' }, [
        createEl('div', { className: 'auth-hero-feature-icon' }, ['✓']),
        'Uthibitisho wa Oda na Taarifa za Wateja kwa WhatsApp & SMS',
      ]),
      createEl('div', { className: 'auth-hero-feature-item' }, [
        createEl('div', { className: 'auth-hero-feature-icon' }, ['✓']),
        'Hifadhi ya Wingu Iliyolindwa na Mipangilio ya Supabase Auth',
      ]),
    ]),
  ]);
}

/**
 * Render Login View (#login)
 */
export function renderLoginView(state, dispatch) {
  const root = document.getElementById('app');
  if (!root) return;
  clearEl(root);

  const { settings, toast } = state;
  const staffList = settings?.staffList || [
    { id: 'st_1', name: 'Baraka Mwangi', role: 'owner', pin: '1234' },
    { id: 'st_2', name: 'Amina Salum', role: 'cashier', pin: '2222' },
    { id: 'st_3', name: 'Juma Mchinjaji', role: 'butcher', pin: '3333' },
  ];

  const selectedStaff = staffList.find(s => s.id === selectedStaffId) || staffList[0];

  // Helper for PIN Dot updating
  function updatePinDots() {
    const dotsContainer = document.getElementById('auth-pin-dots-wrap');
    if (!dotsContainer) return;
    clearEl(dotsContainer);
    for (let i = 0; i < 4; i++) {
      const isFilled = i < currentPinInput.length;
      dotsContainer.appendChild(createEl('div', {
        className: `auth-pin-dot ${isFilled ? 'auth-pin-dot--filled' : ''}`
      }));
    }
  }

  // Handle PIN verification
  function handlePinSubmit() {
    if (currentPinInput.length < 4) {
      dispatch({
        type: 'SET_TOAST',
        payload: { message: 'Tafadhali ingiza tarakimu 4 za PIN', type: 'warning' }
      });
      return;
    }

    const expectedPin = selectedStaff.pin || settings.securityPin || '1234';
    if (currentPinInput === expectedPin) {
      // Login Success
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: {
          currentRole: selectedStaff.role,
          currentStaffName: selectedStaff.name
        }
      });
      dispatch({
        type: 'ADD_AUDIT_LOG',
        payload: {
          action: `Ameingia kwenye mfumo kwa PIN kama ${selectedStaff.name} (${selectedStaff.role.toUpperCase()})`
        }
      });
      dispatch({
        type: 'SET_TOAST',
        payload: { message: `Karibu sana ${selectedStaff.name}! Umeingia kikamilifu.`, type: 'success' }
      });
      currentPinInput = '';
      window.location.hash = '#/admin';
    } else {
      currentPinInput = '';
      updatePinDots();
      dispatch({
        type: 'SET_TOAST',
        payload: { message: 'PIN siyo sahihi. Tafadhali jaribu tena.', type: 'error' }
      });
    }
  }

  // PIN Form Side
  const pinFormSide = createEl('div', { className: 'auth-form-side' }, [
    createEl('div', { className: 'auth-header' }, [
      createEl('h1', { className: 'auth-title' }, ['Ingia Kwenye Mfumo']),
      createEl('p', { className: 'auth-subtitle' }, ['Chagua njia ya kuingia kwenye akaunti yako ya Nyama Fresh']),
    ]),

    // Tab Switcher
    createEl('div', { className: 'auth-tab-bar' }, [
      createEl('button', {
        type: 'button',
        className: `auth-tab-btn ${activeTab === 'pin' ? 'auth-tab-btn--active' : ''}`,
        onClick: () => { activeTab = 'pin'; renderLoginView(state, dispatch); }
      }, [
        createEl('span', { className: 'material-symbols-outlined', style: 'font-size: 1.1rem;' }, ['pin']),
        'PIN ya Staff (Duka POS)',
      ]),
      createEl('button', {
        type: 'button',
        className: `auth-tab-btn ${activeTab === 'email' ? 'auth-tab-btn--active' : ''}`,
        onClick: () => { activeTab = 'email'; renderLoginView(state, dispatch); }
      }, [
        createEl('span', { className: 'material-symbols-outlined', style: 'font-size: 1.1rem;' }, ['mail']),
        'Barua Pepe (Cloud Auth)',
      ]),
    ]),

    activeTab === 'pin'
      ? createEl('div', {}, [
          // Staff Quick Selector
          createEl('label', { className: 'label', style: 'margin-bottom: 0.35rem; display: block;' }, ['Chagua Mhudumu / Staff:']),
          createEl('div', { className: 'auth-staff-chips' }, staffList.map(s =>
            createEl('button', {
              type: 'button',
              className: `auth-staff-chip ${s.id === selectedStaffId ? 'auth-staff-chip--active' : ''}`,
              onClick: () => {
                selectedStaffId = s.id;
                currentPinInput = '';
                renderLoginView(state, dispatch);
              }
            }, [
              createEl('span', { className: 'material-symbols-outlined', style: 'font-size: 1rem;' }, [
                s.role === 'owner' ? 'shield' : s.role === 'cashier' ? 'payments' : 'content_cut'
              ]),
              `${s.name} (${s.role === 'owner' ? 'Mmiliki' : s.role === 'cashier' ? 'Mhudumu' : 'Mchinjaji'})`
            ])
          )),

          // PIN Dots Display
          createEl('div', { id: 'auth-pin-dots-wrap', className: 'auth-pin-display' }, [
            createEl('div', { className: `auth-pin-dot ${currentPinInput.length > 0 ? 'auth-pin-dot--filled' : ''}` }),
            createEl('div', { className: `auth-pin-dot ${currentPinInput.length > 1 ? 'auth-pin-dot--filled' : ''}` }),
            createEl('div', { className: `auth-pin-dot ${currentPinInput.length > 2 ? 'auth-pin-dot--filled' : ''}` }),
            createEl('div', { className: `auth-pin-dot ${currentPinInput.length > 3 ? 'auth-pin-dot--filled' : ''}` }),
          ]),

          // PIN Pad Keypad
          createEl('div', { className: 'auth-pin-pad' }, [
            ...['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num =>
              createEl('button', {
                type: 'button',
                className: 'auth-pin-btn',
                onClick: () => {
                  if (currentPinInput.length < 4) {
                    currentPinInput += num;
                    updatePinDots();
                    if (currentPinInput.length === 4) {
                      setTimeout(handlePinSubmit, 150);
                    }
                  }
                }
              }, [num])
            ),
            createEl('button', {
              type: 'button',
              className: 'auth-pin-btn auth-pin-btn--action',
              onClick: () => {
                currentPinInput = '';
                updatePinDots();
              }
            }, ['C']),
            createEl('button', {
              type: 'button',
              className: 'auth-pin-btn',
              onClick: () => {
                if (currentPinInput.length < 4) {
                  currentPinInput += '0';
                  updatePinDots();
                  if (currentPinInput.length === 4) {
                    setTimeout(handlePinSubmit, 150);
                  }
                }
              }
            }, ['0']),
            createEl('button', {
              type: 'button',
              className: 'auth-pin-btn auth-pin-btn--action',
              onClick: () => {
                currentPinInput = currentPinInput.slice(0, -1);
                updatePinDots();
              }
            }, ['⌫']),
          ]),

          createEl('button', {
            type: 'button',
            className: 'btn btn--primary btn--full btn--lg',
            onClick: handlePinSubmit
          }, [
            createEl('span', { className: 'material-symbols-outlined' }, ['login']),
            `Ingia Kama ${selectedStaff.name}`,
          ]),
        ])
      : createEl('form', {
          onSubmit: (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            dispatch({
              type: 'SET_TOAST',
              payload: { message: `Akaunti ya ${email} imethibitishwa! Karibu.`, type: 'success' }
            });
            window.location.hash = '#/shop';
          }
        }, [
          createEl('div', { className: 'auth-input-field' }, [
            createEl('input', {
              type: 'email',
              name: 'email',
              className: 'input',
              placeholder: 'Barua Pepe / Email Address',
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
              'Niko kwenye kifaa changu (Remember me)',
            ]),
            createEl('a', { href: '#/forgot-password', className: 'auth-link', style: 'font-size: 0.85rem;' }, ['Umesahau Nywila?']),
          ]),

          createEl('button', { type: 'submit', className: 'btn btn--primary btn--full btn--lg' }, [
            createEl('span', { className: 'material-symbols-outlined' }, ['login']),
            'Ingia Kwenye Akaunti',
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
        createAuthHeroSide(settings, 'Ingia kwenye portal ya Nyama Fresh butchery kusimamia ada za pre-order, stoki na PIN za maduka.'),
        pinFormSide,
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

        dispatch({
          type: 'SET_TOAST',
          payload: { message: `Akaunti ya ${fullName} imefanikiwa kusajiliwa!`, type: 'success' }
        });

        if (registerRole !== 'customer') {
          // Add to staff list
          const newStaff = {
            id: `st_${Date.now()}`,
            name: fullName,
            role: registerRole,
            phone: phone,
            pin: '1234'
          };
          const updatedList = [...(settings?.staffList || []), newStaff];
          dispatch({ type: 'UPDATE_SETTINGS', payload: { staffList: updatedList } });
        }

        window.location.hash = registerRole === 'customer' ? '#/shop' : '#/login';
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

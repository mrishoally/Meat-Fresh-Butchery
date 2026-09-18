/**
 * Pre-Order Cart Drawer & Checkout Component
 */
import { createEl } from '../utils/dom.js';
import { formatCurrency } from '../utils/format.js';
import { validateCheckout } from '../utils/validate.js';
import { createMobilePayment } from '../utils/snippe.js';

export function renderCartDrawer(state, dispatch) {
  const { cart, isCartOpen, inventory, settings } = state;

  if (!isCartOpen) return null;

  const currency = settings?.currency || 'TZS';
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.priceEach * item.qty, 0);
  const methods = settings?.acceptedPaymentMethods || { cash: true, mpesa: true, tigopesa: true, airtel: true };
  const tills = settings?.paymentTills || {};
  const snippe = settings?.snippeConfig || {};

  // Backdrop
  const backdrop = createEl('div', {
    className: 'drawer-backdrop',
    onClick: () => dispatch({ type: 'TOGGLE_CART', payload: false }),
  });

  // Header
  const header = createEl('div', { className: 'drawer__header' }, [
    createEl('div', { className: 'flex items-center gap-2' }, [
      createEl('h2', { className: 'drawer__title' }, ['Pre-Order Basket']),
      createEl('span', { className: 'badge badge--neutral' }, [`${totalQty} items`]),
    ]),
    createEl('button', {
      className: 'btn-icon',
      type: 'button',
      onClick: () => dispatch({ type: 'TOGGLE_CART', payload: false }),
      'aria-label': 'Close Cart',
    }, ['✕']),
  ]);

  // Content body
  let bodyContent;

  if (cart.length === 0) {
    bodyContent = createEl('div', { className: 'drawer__empty' }, [
      createEl('span', { className: 'material-symbols-outlined drawer__empty-icon' }, ['shopping_basket']),
      createEl('h3', { className: 'text-lg font-bold' }, ['Kapu lako liko tupu']),
      createEl('p', { className: 'text-sm text-neutral-500' }, ['Hujaweka oda ya nyama yoyote bado.']),
      createEl('button', {
        className: 'btn btn--primary mt-4',
        onClick: () => dispatch({ type: 'TOGGLE_CART', payload: false }),
      }, ['Tazama Mzigo wa Leo']),
    ]);
  } else {
    // Items list
    const itemsList = createEl('div', { className: 'cart-items-list' },
      cart.map(item => {
        const prod = inventory.find(p => p.id === item.productId);
        const maxStock = prod ? prod.quantity : 999;

        return createEl('div', { className: 'cart-item' }, [
          createEl('img', {
            src: item.imageUrl || 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=120&q=80',
            alt: item.name,
            className: 'cart-item__image',
          }),
          createEl('div', { className: 'cart-item__details' }, [
            createEl('h4', { className: 'cart-item__title' }, [item.name]),
            createEl('span', { className: 'cart-item__unit-price' }, [
              `${formatCurrency(item.priceEach, currency)} / kg`
            ]),
            createEl('div', { className: 'cart-item__stepper' }, [
              createEl('button', {
                className: 'stepper-btn',
                type: 'button',
                onClick: () => dispatch({
                  type: 'UPDATE_CART_QTY',
                  payload: { productId: item.productId, qty: item.qty - 1 }
                }),
              }, ['-']),
              createEl('span', { className: 'stepper-val' }, [String(item.qty)]),
              createEl('button', {
                className: 'stepper-btn',
                type: 'button',
                disabled: item.qty >= maxStock,
                onClick: () => dispatch({
                  type: 'UPDATE_CART_QTY',
                  payload: { productId: item.productId, qty: item.qty + 1 }
                }),
              }, ['+']),
            ]),
          ]),
          createEl('div', { className: 'cart-item__subtotal-col' }, [
            createEl('span', { className: 'cart-item__total' }, [
              formatCurrency(item.priceEach * item.qty, currency)
            ]),
            createEl('button', {
              className: 'cart-item__remove-btn',
              title: 'Ondoa kwenye kapu',
              onClick: () => dispatch({
                type: 'REMOVE_FROM_CART',
                payload: { productId: item.productId }
              }),
            }, ['🗑']),
          ]),
        ]);
      })
    );

    // Summary Card
    const summaryCard = createEl('div', { className: 'cart-summary-card' }, [
      createEl('div', { className: 'cart-summary-row' }, [
        createEl('span', {}, ['Jumla Kuu (Total Due):']),
        createEl('span', { className: 'cart-summary-total' }, [formatCurrency(totalPrice, currency)]),
      ]),
      createEl('div', { className: 'cart-pickup-notice' }, [
        createEl('span', { className: 'material-symbols-outlined text-[16px] text-primary' }, ['storefront']),
        createEl('span', { className: 'text-xs' }, [
          `Malipo dukani kaunta (${settings?.storeTagline?.split(',')[0] || 'Kariakoo'}) au M-Pesa USSD Push.`
        ]),
      ]),
    ]);

    // Form
    let formErrorEl = createEl('div', { className: 'form-error-banner hidden' });

    const nameInput = createEl('input', {
      type: 'text',
      className: 'input',
      placeholder: 'Mfano: Baraka Mwangi',
      required: true,
      name: 'customerName',
    });

    const contactInput = createEl('input', {
      type: 'text',
      className: 'input',
      placeholder: 'Mfano: 0755 123 456',
      required: true,
      name: 'contact',
    });

    const paymentSelect = createEl('select', {
      name: 'paymentMethod',
      className: 'input select text-xs font-bold',
    }, [
      methods.cash !== false ? createEl('option', { value: 'Cash' }, ['💵 Pesa Taslimu (Cash Kaunta)']) : null,
      methods.mpesa !== false ? createEl('option', { value: 'M-Pesa' }, [`🔴 Vodacom M-Pesa (Till: ${tills.mpesaTill || '554433'})`]) : null,
      methods.tigopesa !== false ? createEl('option', { value: 'Tigo Pesa' }, [`🔵 Tigo Pesa (Lipa: ${tills.tigopesaLipa || '887766'})`]) : null,
      methods.airtel !== false ? createEl('option', { value: 'Airtel Money' }, [`🔴 Airtel Money (Lipa: ${tills.airtelLipa || '991122'})`]) : null,
    ].filter(Boolean));

    const notesInput = createEl('textarea', {
      className: 'input textarea',
      rows: 2,
      placeholder: 'Mfano: Katia vipande vidogo vya mchuzi, nitachukua saa 11.',
      name: 'notes',
    });

    const form = createEl('form', {
      className: 'cart-checkout-form flex flex-col gap-3',
      onSubmit: async (e) => {
        e.preventDefault();
        const customerName = nameInput.value.trim();
        const contact = contactInput.value.trim();
        const paymentMethod = paymentSelect.value || 'Cash';
        const notes = notesInput.value.trim();

        const validation = validateCheckout({ customerName, contact, items: cart });
        if (!validation.isValid) {
          formErrorEl.textContent = Object.values(validation.errors)[0];
          formErrorEl.classList.remove('hidden');
          return;
        }

        formErrorEl.classList.add('hidden');

        // Submit order to store state
        dispatch({
          type: 'SUBMIT_ORDER',
          payload: { customerName, contact, notes, paymentMethod },
        });

        // Trigger Snippe Mobile Money USSD Push if API Key exists and mobile payment chosen
        if (snippe.apiKey && paymentMethod !== 'Cash') {
          const latestOrd = state.latestOrder;
          const orderId = latestOrd ? latestOrd.id : `ORD-${Date.now()}`;
          const snippeRes = await createMobilePayment({
            apiKey: snippe.apiKey,
            amount: totalPrice,
            phone: contact,
            customerName,
            orderId,
          });

          if (snippeRes.success) {
            dispatch({
              type: 'SHOW_TOAST',
              payload: { message: snippeRes.message, type: 'success', id: Date.now() }
            });
          } else {
            dispatch({
              type: 'SHOW_TOAST',
              payload: { message: `Snippe Notice: ${snippeRes.message}`, type: 'info', id: Date.now() }
            });
          }
        }
      },
    }, [
      formErrorEl,
      createEl('div', { className: 'form-group' }, [
        createEl('label', { className: 'label' }, ['Jina Kamili *']),
        nameInput,
      ]),
      createEl('div', { className: 'form-group' }, [
        createEl('label', { className: 'label' }, ['Namba ya Simu ya WhatsApp *']),
        contactInput,
      ]),
      createEl('div', { className: 'form-group' }, [
        createEl('label', { className: 'label' }, ['Njia ya Malipo Unayopendelea']),
        paymentSelect,
      ]),
      createEl('div', { className: 'form-group' }, [
        createEl('label', { className: 'label' }, ['Maelekezo Maalumu ya Ukataji (Hiari)']),
        notesInput,
      ]),
      createEl('button', {
        type: 'submit',
        className: 'btn btn--primary btn--full mt-2',
      }, ['Thibitisha Oda ya Nyama (Submit Pre-Order) →']),
    ]);

    bodyContent = createEl('div', { className: 'drawer__body' }, [
      itemsList,
      summaryCard,
      form,
    ]);
  }

  const drawerPanel = createEl('aside', {
    className: 'drawer-panel animate-drawer-slide',
    role: 'dialog',
    'aria-label': 'Pre-Order Cart',
  }, [header, bodyContent]);

  return createEl('div', { className: 'drawer-container' }, [backdrop, drawerPanel]);
}

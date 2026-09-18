/**
 * Product Add / Edit Modal Component for Admin
 */
import { createEl } from '../utils/dom.js';
import { validateProduct } from '../utils/validate.js';

export function renderProductModal(state, dispatch) {
  const { isProductModalOpen, editingProduct } = state;

  if (!isProductModalOpen) return null;

  const isEditing = Boolean(editingProduct && editingProduct.id);

  // Form Fields
  const nameInput = createEl('input', {
    type: 'text',
    className: 'input',
    placeholder: "Mfano: Nyama ya Mbuzi (Choma)",
    value: editingProduct?.name || '',
    required: true,
  });

  const categorySelect = createEl('select', { className: 'input select' }, [
    createEl('option', { value: "Nyama ya Ng'ombe" }, ["Nyama ya Ng'ombe (Beef)"]),
    createEl('option', { value: "Nyama ya Mbuzi" }, ["Nyama ya Mbuzi (Goat)"]),
    createEl('option', { value: "Kuku wa Kienyeji" }, ["Kuku wa Kienyeji (Poultry)"]),
    createEl('option', { value: "Oda Maalumu" }, ["Oda Maalumu (Special Cuts)"]),
  ]);
  if (editingProduct?.category) {
    categorySelect.value = editingProduct.category;
  }

  const priceInput = createEl('input', {
    type: 'number',
    className: 'input',
    placeholder: '18000',
    min: '1',
    step: '500',
    value: editingProduct?.price || '',
    required: true,
  });

  const quantityInput = createEl('input', {
    type: 'number',
    className: 'input',
    placeholder: '10',
    min: '0',
    step: '1',
    value: editingProduct?.quantity !== undefined ? editingProduct.quantity : '',
    required: true,
  });

  const descriptionInput = createEl('textarea', {
    className: 'input textarea',
    rows: 3,
    placeholder: 'Maelezo kuhusu nyama hii, jinsi ya kuipika, au sehemu iliyotoka...',
  }, [editingProduct?.description || '']);

  const imageUrlInput = createEl('input', {
    type: 'url',
    className: 'input',
    placeholder: 'https://images.unsplash.com/...',
    value: editingProduct?.imageUrl || '',
  });

  // Image preview box
  const previewImg = createEl('img', {
    className: 'modal-image-preview',
    src: editingProduct?.imageUrl || 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=120&q=80',
    alt: 'Product preview',
  });

  imageUrlInput.addEventListener('input', () => {
    previewImg.src = imageUrlInput.value.trim() || 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=120&q=80';
  });

  const errorBanner = createEl('div', { className: 'form-error-banner hidden' });

  const form = createEl('form', {
    className: 'modal-form',
    onSubmit: (e) => {
      e.preventDefault();

      const payload = {
        name: nameInput.value.trim(),
        category: categorySelect.value,
        price: Number(priceInput.value),
        quantity: Number(quantityInput.value),
        description: descriptionInput.value.trim(),
        imageUrl: imageUrlInput.value.trim(),
      };

      const validation = validateProduct(payload);
      if (!validation.isValid) {
        errorBanner.textContent = Object.values(validation.errors)[0];
        errorBanner.classList.remove('hidden');
        return;
      }

      errorBanner.classList.add('hidden');

      if (isEditing) {
        dispatch({
          type: 'UPDATE_PRODUCT',
          payload: { ...payload, id: editingProduct.id },
        });
      } else {
        dispatch({
          type: 'ADD_PRODUCT',
          payload,
        });
      }

      dispatch({ type: 'CLOSE_PRODUCT_MODAL' });
    },
  }, [
    errorBanner,

    createEl('div', { className: 'form-group' }, [
      createEl('label', { className: 'label' }, ['Jina la Bidhaa / Aina ya Nyama *']),
      nameInput,
    ]),

    createEl('div', { className: 'form-grid-2' }, [
      createEl('div', { className: 'form-group' }, [
        createEl('label', { className: 'label' }, ['Kundi (Category)']),
        categorySelect,
      ]),
      createEl('div', { className: 'form-group' }, [
        createEl('label', { className: 'label' }, ['Bei kwa Kilo / Kipande (TZS) *']),
        priceInput,
      ]),
    ]),

    createEl('div', { className: 'form-group' }, [
      createEl('label', { className: 'label' }, ['Kiasi Kilichopo Stoo (Stock Qty) *']),
      quantityInput,
    ]),

    createEl('div', { className: 'form-group' }, [
      createEl('label', { className: 'label' }, ['Maelezo (Description)']),
      descriptionInput,
    ]),

    createEl('div', { className: 'form-group' }, [
      createEl('label', { className: 'label' }, ['Picha ya Bidhaa (Image URL)']),
      createEl('div', { className: 'flex gap-3 items-center' }, [
        createEl('div', { className: 'flex-1' }, [imageUrlInput]),
        previewImg,
      ]),
    ]),

    // Modal actions
    createEl('div', { className: 'modal-actions' }, [
      createEl('button', {
        type: 'button',
        className: 'btn btn--secondary',
        onClick: () => dispatch({ type: 'CLOSE_PRODUCT_MODAL' }),
      }, ['Ghairi (Cancel)']),
      createEl('button', {
        type: 'submit',
        className: 'btn btn--primary',
      }, [isEditing ? 'Hifadhi Mabadiliko (Save Changes)' : 'Ongeza Kwenye Stoo (Add Product)']),
    ]),
  ]);

  const modalDialog = createEl('div', {
    className: 'modal-dialog animate-scale-in',
    role: 'dialog',
    'aria-labelledby': 'modal-title',
  }, [
    createEl('div', { className: 'modal-header' }, [
      createEl('div', {}, [
        createEl('h2', { id: 'modal-title', className: 'text-xl font-bold text-slate-900' }, [
          isEditing ? `Hariri: ${editingProduct.name}` : 'Ongeza Bidhaa Mpya ya Nyama'
        ]),
        createEl('p', { className: 'text-xs text-neutral-500' }, [
          'Taarifa zitaonekana mara moja kwenye duka la wateja.'
        ]),
      ]),
      createEl('button', {
        type: 'button',
        className: 'btn-icon',
        onClick: () => dispatch({ type: 'CLOSE_PRODUCT_MODAL' }),
        'aria-label': 'Close dialog',
      }, ['✕']),
    ]),
    createEl('div', { className: 'modal-body' }, [form]),
  ]);

  const backdrop = createEl('div', {
    className: 'modal-backdrop',
    onClick: (e) => {
      if (e.target === backdrop) dispatch({ type: 'CLOSE_PRODUCT_MODAL' });
    },
  }, [modalDialog]);

  return backdrop;
}

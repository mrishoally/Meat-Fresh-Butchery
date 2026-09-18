/**
 * Validation helpers for forms and data input
 */

/**
 * Validates product creation/edit inputs
 * @param {Object} productData
 * @returns {{ isValid: boolean, errors: Object.<string, string> }}
 */
export function validateProduct(productData) {
  const errors = {};

  if (!productData.name || !productData.name.trim()) {
    errors.name = 'Product name is required';
  }

  const price = Number(productData.price);
  if (isNaN(price) || price <= 0) {
    errors.price = 'Price must be a positive number greater than 0';
  }

  const quantity = Number(productData.quantity);
  if (isNaN(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
    errors.quantity = 'Quantity must be a non-negative whole number (0 or higher)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates pre-order checkout inputs
 * @param {Object} checkoutData
 * @returns {{ isValid: boolean, errors: Object.<string, string> }}
 */
export function validateCheckout(checkoutData) {
  const errors = {};

  if (!checkoutData.customerName || !checkoutData.customerName.trim()) {
    errors.customerName = 'Please enter your full name';
  }

  if (!checkoutData.contact || !checkoutData.contact.trim()) {
    errors.contact = 'Please enter a contact phone number or email address';
  } else if (checkoutData.contact.trim().length < 5) {
    errors.contact = 'Please enter a valid phone number or email';
  }

  if (!Array.isArray(checkoutData.items) || checkoutData.items.length === 0) {
    errors.items = 'Your pre-order cart is empty';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

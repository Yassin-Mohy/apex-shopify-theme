// ==========================================================================
// APEX Variant Handling and AJAX Cart Execution Engine
// ==========================================================================

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange.bind(this));
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleLoading(true);
    this.removeErrorMessage();

    if (!this.currentVariant) {
      this.updateStatus(true, window.variantStrings.unavailable);
      this.toggleLoading(false);
    } else {
      this.updateURL();
      this.updatePrice();
      this.updateMedia();
      this.updateFormId();
      this.toggleLoading(false);
    }
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll('fieldset'));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
    });
  }

  updateMasterId() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('script[type="application/json"]').textContent);
    this.currentVariant = this.variantData.find((variant) => {
      return !variant.options.map((option, index) => {
        return this.options[index] === option;
      }).includes(false);
    });
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ path: this.dataset.url }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateFormId() {
    const formInput = document.querySelector(`.product-form-container [name="id"]`);
    if (formInput) {
      formInput.value = this.currentVariant.id;
      formInput.removeAttribute('disabled');
    }

    const submitButton = document.querySelector('.add-to-cart-submit');
    if (!submitButton) return;

    if (!this.currentVariant.available) {
      submitButton.setAttribute('disabled', 'disabled');
      submitButton.querySelector('span').textContent = window.variantStrings.soldOut;
    } else {
      submitButton.removeAttribute('disabled');
      submitButton.querySelector('span').textContent = window.variantStrings.addToCart;
    }
  }

  updatePrice() {
    const priceSection = document.getElementById(`Price-${this.dataset.section}`);
    if (!priceSection) return;

    fetch(`${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const updatedPrice = doc.getElementById(`Price-${this.dataset.section}`);
        if (updatedPrice) priceSection.innerHTML = updatedPrice.innerHTML;
      });
  }

  updateMedia() {
    if (!this.currentVariant.featured_media) return;
    const targetMediaId = this.currentVariant.featured_media.id;
    const targetElement = document.querySelector(`[data-media-id="${targetMediaId}"]`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }

  updateStatus(disabled, text) {
    const submitButton = document.querySelector('.add-to-cart-submit');
    if (!submitButton) return;
    if (disabled) {
      submitButton.setAttribute('disabled', 'disabled');
    } else {
      submitButton.removeAttribute('disabled');
    }
    submitButton.querySelector('span').textContent = text;
  }

  toggleLoading(show) {
    const spinner = document.querySelector('.loading-overlay__spinner');
    if (spinner) {
      show ? spinner.classList.remove('hidden') : spinner.classList.add('hidden');
    }
  }

  removeErrorMessage() {
    const errorWrapper = document.querySelector('.product-form__error-message-wrapper');
    if (errorWrapper) errorWrapper.setAttribute('hidden', true);
  }
}

customElements.define('variant-selects', VariantSelects);

class ProductForm extends HTMLElement {
  constructor() {
    super();
    this.form = this.querySelector('form');
    this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
    this.initQuantitySelectors();
    this.initSizeGuide();
  }

  initQuantitySelectors() {
    const decBtn = this.querySelector('.quantity-btn.decrement');
    const incBtn = this.querySelector('.quantity-btn.increment');
    const input = this.querySelector('.quantity-field');

    if (!input) return;

    decBtn?.addEventListener('click', () => {
      if (parseInt(input.value) > 1) input.value = parseInt(input.value) - 1;
    });

    incBtn?.addEventListener('click', () => {
      input.value = parseInt(input.value) + 1;
    });
  }

  initSizeGuide() {
    const trigger = document.querySelector('.size-guide-trigger');
    const modal = document.getElementById('SizeGuideModal');
    const closeBtn = document.querySelector('.size-modal__close-btn');
    const overlay = document.querySelector('.size-modal__overlay');

    if (!trigger || !modal) return;

    trigger.addEventListener('click', () => modal.classList.add('is-open'));
    closeBtn?.addEventListener('click', () => modal.classList.remove('is-open'));
    overlay?.addEventListener('click', () => modal.classList.remove('is-open'));
  }

  onSubmitHandler(e) {
    e.preventDefault();
    const submitButton = this.querySelector('.add-to-cart-submit');
    const errorWrapper = this.querySelector('.product-form__error-message-wrapper');
    const errorMessage = this.querySelector('.product-form__error-message');
    const spinner = this.querySelector('.loading-overlay__spinner');

    if (submitButton.classList.contains('loading')) return;

    submitButton.setAttribute('aria-disabled', true);
    submitButton.classList.add('loading');
    spinner?.classList.remove('hidden');
    if (errorWrapper) errorWrapper.setAttribute('hidden', true);

    const config = {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/javascript'
      }
    };

    const formData = new FormData(this.form);
    config.body = formData;

    fetch(`${window.routes.cart_add_url}.js`, config)
      .then((response) => response.json())
      .then((response) => {
        if (response.status) {
          if (errorWrapper && errorMessage) {
            errorWrapper.removeAttribute('hidden');
            errorMessage.textContent = response.description;
          }
          return;
        }
        
        // Execute dynamic global cart drawer refresh event hooks
        if (settings.enable_cart_drawer && window.ApexCartDrawer) {
          window.ApexCartDrawer.open();
          window.ApexCartDrawer.refresh();
        } else {
          window.location.href = window.routes.cart_url;
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        submitButton.removeAttribute('aria-disabled');
        submitButton.classList.remove('loading');
        spinner?.classList.add('hidden');
      });
  }
}

customElements.define('product-form', ProductForm);

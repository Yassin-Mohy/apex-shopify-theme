// ==========================================================================
// APEX Asynchronous AJAX Cart Drawer Core Component Controller
// ==========================================================================

class CartDrawerController {
  constructor() {
    this.drawer = document.getElementById('CartDrawer');
    if (!this.drawer) return;

    this.initTriggers();
    this.initEventListeners();
    this.refreshTracker();
  }

  initTriggers() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('#cart-icon-bubble') || e.target.closest('.cart-drawer-open-trigger')) {
        e.preventDefault();
        this.open();
      }
    });
  }

  initEventListeners() {
    this.drawer.querySelector('.cart-drawer__close-btn')?.addEventListener('click', () => this.close());
    this.drawer.querySelector('.cart-drawer__overlay')?.addEventListener('click', () => this.close());
    
    this.drawer.addEventListener('click', (e) => {
      if (e.target.closest('.cart-drawer__continue-shopping')) {
        this.close();
      }

      const qtyBtn = e.target.closest('.qty-change-btn');
      if (qtyBtn) {
        const itemRow = qtyBtn.closest('.cart-item-row');
        const key = itemRow.dataset.key;
        const currentQty = parseInt(itemRow.querySelector('.qty-input').value);
        const action = qtyBtn.dataset.action;
        let newQty = action === 'increment' ? currentQty + 1 : currentQty - 1;
        this.updateQuantity(key, newQty);
      }

      const removeBtn = e.target.closest('.cart-item-row__remove');
      if (removeBtn) {
        const itemRow = removeBtn.closest('.cart-item-row');
        this.updateQuantity(itemRow.dataset.key, 0);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.drawer.classList.contains('is-open')) this.close();
    });
  }

  open() {
    this.drawer.classList.add('is-open');
    this.drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.refresh();
  }

  close() {
    this.drawer.classList.remove('is-open');
    this.drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  refresh() {
    fetch(`${window.routes.cart_url}?sections=cart-drawer`)
      .then((res) => res.json())
      .then((json) => {
        const html = json['cart-drawer'];
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        document.getElementById('CartDrawerItems').innerHTML = doc.getElementById('CartDrawerItems').innerHTML;
        this.refreshTracker();
        this.updateCartCountGlobal();
      });
  }

  updateQuantity(key, quantity) {
    const config = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/javascript' },
      body: JSON.stringify({ id: key, quantity: quantity })
    };

    fetch(`${window.routes.cart_change_url}.js`, config)
      .then(() => this.refresh());
  }

  refreshTracker() {
    const trackerEl = document.querySelector('.cart-drawer__shipping-tracker');
    if (!trackerEl) return;
    
    const threshold = parseFloat(trackerEl.dataset.threshold);
    
    fetch(`${window.routes.cart_url}.js`)
      .then((res) => res.json())
      .then((cart) => {
        const total = cart.total_price / 100;
        const msgEl = document.getElementById('ShippingTrackerMessage');
        const barEl = document.getElementById('ShippingTrackerProgress');
        
        if (total >= threshold) {
          msgEl.textContent = "YOU QUALIFY FOR FREE SHIPPING";
          barEl.style.width = '100%';
        } else {
          const remaining = threshold - total;
          msgEl.textContent = `ADD ${remaining.toFixed(2)} EGP MORE FOR FREE SHIPPING`;
          barEl.style.width = `${(total / threshold) * 100}%`;
        }
      });
  }

  updateCartCountGlobal() {
    fetch(`${window.routes.cart_url}.js`)
      .then((res) => res.json())
      .then((cart) => {
        const countBubbles = document.querySelectorAll('.cart-count-bubble');
        const countTexts = document.querySelectorAll('.cart-count');
        
        countBubbles.forEach((bubble) => {
          cart.item_count === 0 ? bubble.classList.add('hidden') : bubble.classList.remove('hidden');
        });
        countTexts.forEach((text) => text.textContent = cart.item_count);
      });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.ApexCartDrawer = new CartDrawerController();
});

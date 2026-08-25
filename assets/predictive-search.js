// ==========================================================================
// APEX Live Native Storefront Predictive Search Controller API Hook
// ==========================================================================

class PredictiveSearch extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input[type="search"]');
    this.resultsContainer = document.getElementById('predictive-search-results');

    if (!this.input) return;
    this.input.addEventListener('input', this.debounce((event) => {
      this.onChange(event);
    }, 300).bind(this));
  }

  onChange() {
    const searchTerm = this.input.value.trim();
    if (!searchTerm.length) {
      this.close();
      return;
    }
    this.getSearchResults(searchTerm);
  }

  getSearchResults(searchTerm) {
    fetch(`${window.routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&resources[type]=product&section_id=predictive-search`)
      .then((response) => {
        if (!response.ok) {
          var error = new Error(response.status);
          this.close();
          throw error;
        }
        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').getElementById('shopify-section-predictive-search').innerHTML;
        this.resultsContainer.innerHTML = resultsMarkup;
        this.open();
      })
      .catch((error) => {
        this.close();
        throw error;
      });
  }

  open() {
    this.resultsContainer.removeAttribute('hidden');
  }

  close() {
    this.resultsContainer.innerHTML = '';
    this.resultsContainer.setAttribute('hidden', true);
  }

  debounce(fn, wait) {
    let delay;
    return function(...args) {
      clearTimeout(delay);
      delay = setTimeout(() => fn.apply(this, args), wait);
    };
  }
}

customElements.define('predictive-search', PredictiveSearch);

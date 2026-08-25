// ==========================================================================
// APEX Global Theme Script
// ==========================================================================

class ApexTheme {
  constructor() {
    this.initHeaderScroll();
    this.initFadeAnimations();
  }

  /**
   * Transparent to Black Header on Scroll
   */
  initHeaderScroll() {
    const header = document.querySelector('.apex-header');
    if (!header) return;

    // Check on initial load
    this.checkScrollPosition(header);

    // Check on scroll
    window.addEventListener('scroll', () => {
      this.checkScrollPosition(header);
    }, { passive: true });
  }

  checkScrollPosition(header) {
    if (window.scrollY > 50) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  /**
   * Intersection Observer for Fade-Up Animations
   */
  initFadeAnimations() {
    const fadeElements = document.querySelectorAll('.fade-up');
    
    // Check if user prefers reduced motion or animations are disabled
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animationsEnabled = document.body.classList.contains('animations-enabled');

    if (prefersReducedMotion || !animationsEnabled || fadeElements.length === 0) {
      fadeElements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    fadeElements.forEach(el => observer.observe(el));
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.Apex = new ApexTheme();
});

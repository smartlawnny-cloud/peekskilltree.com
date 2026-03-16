// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.nav-links');
  const body = document.body;

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function() {
      nav.classList.toggle('active');
      menuBtn.classList.toggle('active');
      body.classList.toggle('menu-open');
    });

    // Close menu when clicking a link
    nav.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        nav.classList.remove('active');
        menuBtn.classList.remove('active');
        body.classList.remove('menu-open');
      });
    });
  }

  // Sticky header
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-question').forEach(function(question) {
    question.addEventListener('click', function() {
      const item = this.parentElement;
      const wasActive = item.classList.contains('active');
      // Close all
      document.querySelectorAll('.faq-item').forEach(function(i) {
        i.classList.remove('active');
      });
      // Open clicked if it wasn't active
      if (!wasActive) {
        item.classList.add('active');
      }
    });
  });

  // Intersection Observer for fade-in animations
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(function(el) {
    observer.observe(el);
  });

  // Click-to-call tracking (for analytics later)
  document.querySelectorAll('a[href^="tel:"]').forEach(function(link) {
    link.addEventListener('click', function() {
      if (typeof gtag === 'function') {
        gtag('event', 'click_to_call', { event_category: 'contact' });
      }
    });
  });
});

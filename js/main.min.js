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

  // ── GA4 CONVERSION & EVENT TRACKING ──────────────────────
  if (typeof gtag === 'function') {
    var page = window.location.pathname;

    // ── LEAD EVENTS (high-intent actions) ──

    // Phone clicks — the #1 conversion
    document.querySelectorAll('a[href^="tel:"]').forEach(function(link) {
      link.addEventListener('click', function() {
        gtag('event', 'click_to_call', {
          event_category: 'lead',
          event_label: page,
          value: 1
        });
      });
    });

    // Email clicks
    document.querySelectorAll('a[href^="mailto:"]').forEach(function(link) {
      link.addEventListener('click', function() {
        gtag('event', 'email_click', {
          event_category: 'lead',
          event_label: page
        });
      });
    });

    // Contact page view — strong intent signal
    if (page.match(/contact/i)) {
      gtag('event', 'contact_page_view', { event_category: 'lead' });
    }

    // Estimate form view (Jobber iframe loaded)
    var jobberFrame = document.querySelector('iframe[src*="getjobber"]');
    if (jobberFrame) {
      gtag('event', 'estimate_form_view', { event_category: 'lead' });
    }

    // ── ENGAGEMENT EVENTS (interest signals) ──

    // CTA button clicks ("Get Free Estimate", "Get Your Free Estimate", etc.)
    document.querySelectorAll('.btn-primary, .btn[href*="contact"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        gtag('event', 'cta_click', {
          event_category: 'engagement',
          event_label: (this.textContent || '').trim().substring(0, 40) + ' | ' + page
        });
      });
    });

    // Service page views — which services get the most interest
    var servicePages = ['tree-removal', 'tree-pruning', 'stump-grinding', 'emergency-tree', 'land-clearing'];
    servicePages.forEach(function(svc) {
      if (page.indexOf(svc) !== -1) {
        gtag('event', 'service_page_view', {
          event_category: 'engagement',
          event_label: svc
        });
      }
    });

    // Town page views — which towns generate the most traffic
    if (page.match(/tree-service-.*-ny/)) {
      var town = page.replace('/tree-service-', '').replace('-ny.html', '').replace(/-/g, ' ');
      gtag('event', 'town_page_view', {
        event_category: 'engagement',
        event_label: town
      });
    }

    // Our Work / gallery page
    if (page.match(/our-work/i)) {
      gtag('event', 'gallery_view', { event_category: 'engagement' });
    }

    // ── SOCIAL LINK CLICKS ──
    document.querySelectorAll('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="yelp.com"], a[href*="youtube.com"], a[href*="x.com"], a[href*="google/m"], a[href*="nextdoor"]').forEach(function(link) {
      link.addEventListener('click', function() {
        var href = this.getAttribute('href') || '';
        var platform = 'other';
        if (href.match(/facebook/i)) platform = 'facebook';
        else if (href.match(/instagram/i)) platform = 'instagram';
        else if (href.match(/yelp/i)) platform = 'yelp';
        else if (href.match(/youtube/i)) platform = 'youtube';
        else if (href.match(/x\.com/i)) platform = 'x_twitter';
        else if (href.match(/google/i)) platform = 'google_reviews';
        else if (href.match(/nextdoor/i)) platform = 'nextdoor';
        gtag('event', 'social_click', {
          event_category: 'engagement',
          event_label: platform + ' | ' + page
        });
      });
    });

    // ── SCROLL DEPTH (25%, 50%, 75%, 100%) ──
    var scrollMarks = {25: false, 50: false, 75: false, 100: false};
    window.addEventListener('scroll', function() {
      var scrollPct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      [25, 50, 75, 100].forEach(function(mark) {
        if (scrollPct >= mark && !scrollMarks[mark]) {
          scrollMarks[mark] = true;
          gtag('event', 'scroll_depth', {
            event_category: 'engagement',
            event_label: mark + '% | ' + page
          });
        }
      });
    });

    // ── TIME ON PAGE (30s, 60s, 120s) ──
    [30, 60, 120].forEach(function(sec) {
      setTimeout(function() {
        gtag('event', 'time_on_page', {
          event_category: 'engagement',
          event_label: sec + 's | ' + page
        });
      }, sec * 1000);
    });

    // ── OUTBOUND LINK CLICKS ──
    document.querySelectorAll('a[target="_blank"]').forEach(function(link) {
      link.addEventListener('click', function() {
        var href = this.getAttribute('href') || '';
        if (!href.match(/peekskilltree\.com/i)) {
          gtag('event', 'outbound_click', {
            event_category: 'engagement',
            event_label: href.substring(0, 80)
          });
        }
      });
    });

    // ── MOBILE VS DESKTOP ──
    gtag('event', 'device_type', {
      event_category: 'info',
      event_label: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      non_interaction: true
    });
  }
});

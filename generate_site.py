import os, re

BASE = "/Users/dougbrown/Desktop/Claude/peekskilltree.com"

def webp_swap(html):
    """Replace .jpg with .webp in <img> src attributes only (not og:image, schema, poster)."""
    return re.sub(r'(<img\s[^>]*src="[^"]*?)\.jpg(")', r'\1.webp\2', html)

def write_page(filename, content):
    """Write an HTML page with WebP image swap applied."""
    with open(os.path.join(BASE, filename), "w") as f:
        f.write(webp_swap(content))

# ── Storm Mode ──────────────────────────────────────────────────────────────
# Set to True during/after a major storm to show the emergency banner sitewide
STORM_MODE = False
# ────────────────────────────────────────────────────────────────────────────

def header(title, desc, canonical, hero_img=None, h1="", breadcrumb="", active_nav="",
           og_image="images/hero-collage-background.jpg", twitter_image=None, breadcrumbs=None):
    if twitter_image is None:
        twitter_image = og_image
    storm_banner = ""
    if STORM_MODE:
        storm_banner = '''
  <div class="storm-banner">
    <div class="container">
      <strong>&#9889; Storm Damage?</strong> We&rsquo;re responding now &mdash; call <a href="tel:914-391-5233">(914) 391-5233</a> for same-day emergency tree removal. Available 24/7.
    </div>
  </div>'''
    hero_section = ""
    if hero_img:
        hero_section = f'''
  <section class="page-hero">
    <div class="hero-bg" style="background-image: url('images/{hero_img}');"></div>
    <div class="container">
      <div class="breadcrumb">{breadcrumb}</div>
      <div class="page-hero-content">
        <h1>{h1}</h1>
      </div>
    </div>
  </section>'''
    else:
        hero_section = f'''
  <section class="page-hero">
    <div class="container">
      <div class="breadcrumb">{breadcrumb}</div>
      <div class="page-hero-content">
        <h1>{h1}</h1>
      </div>
    </div>
  </section>'''

    breadcrumb_schema = ""
    if breadcrumbs and len(breadcrumbs) > 1:
        items = []
        for i, crumb in enumerate(breadcrumbs):
            url = f"https://peekskilltree.com/{crumb['url']}"
            items.append(f'{{"@type":"ListItem","position":{i+1},"name":"{crumb["name"]}","item":"{url}"}}')
        breadcrumb_schema = f'''
  <script type="application/ld+json">
  {{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{",".join(items)}]}}
  </script>'''

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="https://peekskilltree.com/{canonical}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Second Nature Tree Service">
  <meta property="og:locale" content="en_US">
  <meta property="og:url" content="https://peekskilltree.com/{canonical}">
  <meta property="og:image" content="https://peekskilltree.com/{og_image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@SNTreeNY">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="https://peekskilltree.com/{twitter_image}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="Second Nature Tree Service">
  <meta property="og:image:alt" content="{title}">
  <meta name="twitter:image:alt" content="{title}">
  <meta name="google-site-verification" content="RD7kZCLybHiOx0hw_gxchlQUnLM63C3ZZFczTqMJX5g">
  <link rel="icon" type="image/png" href="favicon.png">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">
  <link rel="stylesheet" href="css/style.min.css">
  {'<link rel="preload" as="image" href="images/' + hero_img + '" fetchpriority="high">' if hero_img else ''}
  <!-- Google Analytics GA4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-WGT87Q9KGV"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-WGT87Q9KGV');</script>
</head>
<body>
{storm_banner}
  <div class="top-bar">
    <div class="container">
      <div class="top-bar-inner">
        <div class="top-bar-left">
          <a href="tel:914-391-5233">&#9742; (914) 391-5233</a>
          <span>|</span>
          <span>Free Estimates &mdash; Peekskill, NY</span>
        </div>
        <div class="top-bar-right">
          <a href="https://facebook.com/peekskilltree" target="_blank" rel="noopener" class="social-link">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </a>
          <a href="https://instagram.com/secondnaturetree/" target="_blank" rel="noopener" class="social-link">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            Instagram
          </a>
          <a href="https://share.google/mLwSzzZXwc5fuFRU4" target="_blank" rel="noopener" class="social-link">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </a>
          <a href="https://x.com/SNTreeNY" target="_blank" rel="noopener" class="social-link">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            X
          </a>
          <a href="https://www.youtube.com/channel/UCZgv2VOA7-A__UQizOEkKZA" target="_blank" rel="noopener" class="social-link">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            YouTube
          </a>
          <a href="https://www.yelp.com/biz/second-nature-tree-peekskill" target="_blank" rel="noopener" class="social-link">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.905-4.308a1.072 1.072 0 011.596-.206 9.194 9.194 0 012.364 3.142 1.073 1.073 0 01-.694 1.569zm-3.461 5.347l-2.006-4.77c-.39-.928-1.876-.57-1.795.432l.417 5.18a1.072 1.072 0 001.141.97 9.217 9.217 0 002.67-.697 1.072 1.072 0 00.493-1.516l-.92.401zm-6.393-2.2l4.56 2.49c.885.484 1.86-.504 1.178-1.193l-3.525-3.556c-.448-.452-1.225-.14-1.27.51l-.231 3.34c-.026.38.258.71.633.736l-1.345-2.327zm-2.05-5.394c.058-.95 1.085-1.42 1.803-.826l3.71 3.073c.472.39.284 1.158-.306 1.254l-5.24.85a1.072 1.072 0 01-1.21-.926 9.194 9.194 0 01.406-3.652c.147-.427.547-.736.837-.773zM10.98 3.2L9.596 8.44c-.268.96-1.578 1.06-1.985.15L5.247 3.454A1.072 1.072 0 015.88 2.12a9.194 9.194 0 014.247-.116c.558.116.95.633.853 1.196z"/></svg>
            Yelp
          </a>
        </div>
      </div>
    </div>
  </div>

  <header class="site-header">
    <div class="container header-inner">
      <a href="index.html" class="logo">
        <div class="logo-img-wrap">
          <img src="images/logo.png" alt="Second Nature Tree Service" width="76" height="36">
        </div>
      </a>
      <ul class="nav-links">
        <li><a href="index.html">Home</a></li>
        <li class="nav-dropdown">
          <a href="services.html">Services &#9662;</a>
          <div class="dropdown-menu">
            <a href="tree-removal.html">Tree Removal</a>
            <a href="tree-pruning.html">Tree Pruning &amp; Trimming</a>
            <a href="stump-grinding.html">Stump Grinding</a>
            <a href="emergency-tree-service.html">Emergency Tree Service</a>
            <a href="land-clearing.html">Land &amp; Lot Clearing</a>
          </div>
        </li>
        <li><a href="service-areas.html">Service Areas</a></li>
        <li><a href="our-work.html">Our Work</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
      <div class="header-cta">
        <a href="https://share.google/mLwSzzZXwc5fuFRU4" target="_blank" rel="noopener" class="header-rating">
          <span class="header-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
          <span class="header-rating-text">5.0 on Google</span>
        </a>
        <a href="tel:914-391-5233" class="header-phone">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          (914) 391-5233
        </a>
        <a href="contact.html" class="btn btn-primary btn-sm">Free Estimate</a>
      </div>
      <button class="mobile-menu-btn" aria-label="Menu"><span></span><span></span><span></span></button>
    </div>
  </header>
{hero_section}
{breadcrumb_schema}
  <main>
'''

FOOTER = '''
  </main>

  <section class="cta-banner">
    <div class="container">
      <h2>Ready to Get Started? Call for Your Free Estimate</h2>
      <p>Professional tree services for homeowners across Westchester, Putnam, and Southern Dutchess Counties. Locally owned, licensed, and fully insured.</p>
      <div class="cta-btns">
        <a href="contact.html" class="btn btn-primary btn-lg">Get Free Estimate</a>
        <a href="tel:914-391-5233" class="btn btn-outline btn-lg">&#9742; (914) 391-5233</a>
      </div>
      <p style="margin-top:1rem;font-size:.92rem;opacity:.85;">&#10003; We respond to all inquiries within 2 hours during business hours</p>
    </div>
  </section>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-about">
          <img src="images/logo.png" alt="Second Nature Tree Service" class="footer-logo" width="55" height="26">
          <p>Locally owned tree service proudly based in Peekskill, NY. Serving Westchester, Putnam, and Southern Dutchess Counties with professional tree removal, pruning, stump grinding, and emergency services for over 10 years.</p>
          <div class="footer-social">
            <a href="https://facebook.com/peekskilltree" target="_blank" rel="noopener" aria-label="Facebook"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
            <a href="https://instagram.com/secondnaturetree/" target="_blank" rel="noopener" aria-label="Instagram"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
            <a href="https://share.google/mLwSzzZXwc5fuFRU4" target="_blank" rel="noopener" aria-label="Google"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg></a>
            <a href="https://x.com/SNTreeNY" target="_blank" rel="noopener" aria-label="X"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
            <a href="https://www.youtube.com/channel/UCZgv2VOA7-A__UQizOEkKZA" target="_blank" rel="noopener" aria-label="YouTube"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
            <a href="https://www.yelp.com/biz/second-nature-tree-peekskill" target="_blank" rel="noopener" aria-label="Yelp"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.905-4.308a1.072 1.072 0 011.596-.206 9.194 9.194 0 012.364 3.142 1.073 1.073 0 01-.694 1.569zm-3.461 5.347l-2.006-4.77c-.39-.928-1.876-.57-1.795.432l.417 5.18a1.072 1.072 0 001.141.97 9.217 9.217 0 002.67-.697 1.072 1.072 0 00.493-1.516l-.92.401zm-6.393-2.2l4.56 2.49c.885.484 1.86-.504 1.178-1.193l-3.525-3.556c-.448-.452-1.225-.14-1.27.51l-.231 3.34c-.026.38.258.71.633.736l-1.345-2.327zm-2.05-5.394c.058-.95 1.085-1.42 1.803-.826l3.71 3.073c.472.39.284 1.158-.306 1.254l-5.24.85a1.072 1.072 0 01-1.21-.926 9.194 9.194 0 01.406-3.652c.147-.427.547-.736.837-.773zM10.98 3.2L9.596 8.44c-.268.96-1.578 1.06-1.985.15L5.247 3.454A1.072 1.072 0 015.88 2.12a9.194 9.194 0 014.247-.116c.558.116.95.633.853 1.196z"/></svg></a>
          </div>
        </div>
        <div>
          <h3 class="footer-heading">Services</h3>
          <ul class="footer-links">
            <li><a href="tree-removal.html">Tree Removal</a></li>
            <li><a href="tree-pruning.html">Pruning &amp; Trimming</a></li>
            <li><a href="stump-grinding.html">Stump Grinding</a></li>
            <li><a href="emergency-tree-service.html">Emergency Service</a></li>
            <li><a href="land-clearing.html">Land Clearing</a></li>
            <li><a href="services.html">All Services</a></li>
          </ul>
        </div>
        <div>
          <h3 class="footer-heading">Service Areas</h3>
          <ul class="footer-links">
            <li><a href="tree-service-yorktown-ny.html">Yorktown</a></li>
            <li><a href="tree-service-cortlandt-ny.html">Cortlandt Manor</a></li>
            <li><a href="tree-service-briarcliff-manor-ny.html">Briarcliff Manor</a></li>
            <li><a href="tree-service-chappaqua-ny.html">Chappaqua</a></li>
            <li><a href="tree-service-garrison-ny.html">Garrison</a></li>
            <li><a href="tree-service-croton-on-hudson-ny.html">Croton-on-Hudson</a></li>
            <li><a href="tree-service-beacon-ny.html">Beacon</a></li>
            <li><a href="tree-service-fishkill-ny.html">Fishkill</a></li>
            <li><a href="tree-service-wappingers-falls-ny.html">Wappingers Falls</a></li>
            <li><a href="service-areas.html">All Areas &rarr;</a></li>
          </ul>
        </div>
        <div>
          <h3 class="footer-heading">Contact</h3>
          <ul class="footer-links">
            <li><strong>Phone:</strong> <a href="tel:914-391-5233">(914) 391-5233</a></li>
            <li><strong>Based in:</strong> Peekskill, NY</li>
            <li><strong>Westchester:</strong> WC-32079</li>
            <li><strong>Putnam:</strong> PC-50644</li>
            <li><a href="contact.html">Get a Free Estimate</a></li>
          </ul>
          <h3 class="footer-heading" style="margin-top:20px;">Rates</h3>
          <ul class="footer-links">
            <li><a href="rates.html">Rates</a></li>
            <li><a href="estimate.html">Field Estimate</a></li>
            <li><a href="breakeven.html">Break-Even</a></li>
            <li><a href="roi.html">Ad ROI</a></li>
          </ul>
          <h3 class="footer-heading" style="margin-top:20px;">Also Visit</h3>
          <ul class="footer-links">
            <li><a href="https://smartlawnny.com" target="_blank" rel="noopener">Smart Lawn NY</a> &mdash; Robotic Mowers</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Second Nature Tree Service. All rights reserved. Licensed &amp; Insured. Serving Westchester, Putnam &amp; Southern Dutchess Counties. <a href="privacy-policy.html" style="color:rgba(255,255,255,.85);text-decoration:underline;">Privacy Policy</a> &nbsp;|&nbsp; <a href="terms-of-service.html" style="color:rgba(255,255,255,.85);text-decoration:underline;">Terms of Service</a></p>
      </div>
    </div>
  </footer>
  <script src="js/main.min.js"></script>
</body>
</html>'''

def sidebar(active=""):
    return f'''
        <aside class="service-sidebar">
          <div class="sidebar-card" style="background:var(--green-dark);color:var(--white);text-align:center;">
            <h3 style="color:var(--white)">Get Your Free Estimate</h3>
            <p style="color:rgba(255,255,255,.85);font-size:.95rem;">Call today or request online.</p>
            <a href="tel:914-391-5233" style="display:block;font-size:1.3rem;font-weight:700;color:var(--white);margin:10px 0;">&#9742; (914) 391-5233</a>
            <a href="contact.html" class="btn btn-primary" style="width:100%;">Request Estimate</a>
          </div>
          <div class="sidebar-card">
            <h3>Our Services</h3>
            <ul class="sidebar-nav">
              <li><a href="tree-removal.html" {"class='active'" if active=="removal" else ""}>Tree Removal</a></li>
              <li><a href="tree-pruning.html" {"class='active'" if active=="pruning" else ""}>Pruning &amp; Trimming</a></li>
              <li><a href="stump-grinding.html" {"class='active'" if active=="stump" else ""}>Stump Grinding</a></li>
              <li><a href="emergency-tree-service.html" {"class='active'" if active=="emergency" else ""}>Emergency Service</a></li>
              <li><a href="land-clearing.html" {"class='active'" if active=="clearing" else ""}>Land Clearing</a></li>
            </ul>
          </div>
          <div class="sidebar-card">
            <h3 class="footer-heading">Service Areas</h3>
            <p style="font-size:.9rem;color:var(--text-light);line-height:1.8;">Peekskill &bull; Yorktown &bull; Cortlandt Manor &bull; Croton-on-Hudson &bull; Briarcliff Manor &bull; Chappaqua &bull; Ossining &bull; Garrison &bull; Cold Spring &bull; Mahopac &bull; Putnam Valley &bull; Brewster &bull; Patterson &bull; Beacon &bull; Fishkill &bull; East Fishkill &bull; Wappingers Falls &bull; Pawling &bull; Dover &bull; <a href="service-areas.html" style="color:var(--green-primary);">and more &rarr;</a></p>
          </div>
          <div class="sidebar-card" style="text-align:center;border:2px solid var(--green-primary);">
            <svg width="40" height="40" fill="none" stroke="var(--green-primary)" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            <h3 style="margin-top:10px;">Licensed &amp; Insured</h3>
            <p style="font-size:.85rem;color:var(--text-light);">Westchester: WC-32079<br>Putnam: PC-50644</p>
          </div>
        </aside>'''

def faq_html(faqs):
    items = ""
    schema_items = []
    for q, a in faqs:
        items += f'''
            <div class="faq-item">
              <div class="faq-question">{q}</div>
              <div class="faq-answer"><p>{a}</p></div>
            </div>'''
        schema_items.append(f'{{"@type":"Question","name":"{q}","acceptedAnswer":{{"@type":"Answer","text":"{a.replace(chr(34), chr(39))}"}}}}')
    schema = '{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[' + ','.join(schema_items) + ']}'
    return items, schema

# ============================================================
# INDEX.HTML - HOMEPAGE
# ============================================================
idx_faqs = [
    ("How much does tree removal cost in Peekskill, NY?",
     "Most tree removals in Westchester and Putnam Counties range from $600 to $2,500 depending on the tree's size, species, location on your property, and access. A small tree in an open yard is on the lower end; a large oak or maple close to your house requiring crane work falls on the higher end. Stump grinding typically adds $150&ndash;$400. We provide free on-site estimates so you get an exact, no-surprise price. Call (914) 391-5233 to schedule yours."),
    ("Do I need a permit to remove a tree in Westchester County?",
     "Many Westchester and Putnam County municipalities require permits for removing trees above a certain diameter. For example, some towns require permits for trees over 8 inches in diameter. Requirements vary by town and we stay current on local regulations. We advise you on what is needed during your free estimate."),
    ("What is the best time of year to remove a tree?",
     "Tree removal can be done safely year-round. Late fall and winter are often ideal because bare trees are lighter, the ground is firmer, and there is less impact on surrounding vegetation. However, hazardous or dead trees should be addressed immediately regardless of season."),
    ("Are you licensed and insured?",
     "Yes. Second Nature Tree Service is fully licensed in both Westchester County (WC-32079) and Putnam County (PC-50644). We carry full general liability and workers compensation insurance on every job and provide certificates of insurance upon request."),
    ("Do you offer emergency tree removal?",
     "Yes. We respond to emergency calls for fallen trees, storm damage, and hazardous situations as quickly as possible, including evenings and weekends. Call (914) 391-5233 for immediate assistance."),
    ("What areas do you serve?",
     "We are based in Peekskill, NY and serve Northern Westchester, Putnam County, and Southern Dutchess County. Westchester towns include Yorktown, Cortlandt Manor, Croton-on-Hudson, Briarcliff Manor, Chappaqua, Ossining, Bedford, Mount Kisco, Pound Ridge, North Salem, Armonk, and more. Putnam County towns include Garrison, Cold Spring, Mahopac, Putnam Valley, Carmel, Brewster, and Patterson. Southern Dutchess towns include Beacon, Fishkill, East Fishkill, Wappingers Falls, Pawling, and Dover."),
    ("What is the best tree service company near Peekskill, NY?",
     "Second Nature Tree Service is the top-rated tree company serving Peekskill and surrounding communities in Westchester, Putnam, and Southern Dutchess Counties. We hold a 5.0-star rating on Google with over 70 reviews, and are fully licensed (WC-32079 / PC-50644) and insured. We offer free on-site estimates and same-day emergency service."),
    ("How quickly can you respond to a tree emergency in Westchester County?",
     "We are available 24 hours a day, 7 days a week for emergency tree situations. For storm damage, fallen trees, and hazardous limbs, we typically respond same-day or within hours depending on call volume. Call (914) 391-5233 any time for emergency service."),
]
idx_faq_items, idx_faq_schema = faq_html(idx_faqs)

index_content = header(
    "Tree Removal Peekskill NY | Second Nature Tree Service | Free Estimates",
    "Professional tree removal, pruning, and stump grinding in Peekskill, NY. Locally owned, licensed and insured. Serving Westchester and Putnam Counties. Free estimates. Call (914) 391-5233.",
    "",
    None, "", "", "",
    og_image="images/hero-collage-background.jpg"
).replace('</head>', '  <link rel="preload" as="image" href="images/hero-montage-poster.jpg" fetchpriority="high">\n  <link rel="preload" as="video" href="images/hero-montage.mp4" type="video/mp4">\n</head>'
).replace('<section class="page-hero">\n    <div class="container">\n      <div class="breadcrumb"></div>\n      <div class="page-hero-content">\n        <h1></h1>\n      </div>\n    </div>\n  </section>', '') + f'''
  <section class="hero">
    <video class="hero-video" autoplay muted loop playsinline poster="images/hero-montage-poster.jpg">
      <source src="images/hero-montage.mp4" type="video/mp4">
      <track kind="captions" src="images/hero-captions.vtt" srclang="en" label="English">
    </video>
    <div class="hero-bg hero-video-overlay"></div>
    <div class="container">
      <div class="hero-content">
        <h1>Professional <span class="highlight">Tree Service</span></h1>
        <p>Trusted by homeowners across Westchester, Putnam, and Southern Dutchess Counties for safe, reliable tree removal, pruning, stump grinding, and emergency services. Locally owned and operated by a dedicated team. Licensed, insured &mdash; and always free estimates.</p>
        <div class="hero-btns">
          <a href="contact.html" class="btn btn-primary btn-lg">Get Your Free Estimate</a>
          <a href="tel:914-391-5233" class="btn btn-outline btn-lg">&#9742; Call (914) 391-5233</a>
        </div>
      </div>
    </div>
  </section>

  <div class="trust-bar">
    <div class="container">
      <div class="trust-items">
        <div class="trust-item">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
          Licensed &amp; Insured
        </div>
        <div class="trust-item">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          10+ Years Experience
        </div>
        <div class="trust-item">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          Free Estimates
        </div>
        <div class="trust-item">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          5-Star Rated
        </div>
      </div>
    </div>
  </div>

  <section class="section section-alt stats-section">
    <div class="container">
      <div class="stats-grid">
        <div class="stat-item fade-in">
          <div class="stat-number">500+</div>
          <div class="stat-label">Trees Removed</div>
        </div>
        <div class="stat-item fade-in">
          <div class="stat-number">70+</div>
          <div class="stat-label">5-Star Reviews</div>
        </div>
        <div class="stat-item fade-in">
          <div class="stat-number">10+</div>
          <div class="stat-label">Years Serving the Hudson Valley</div>
        </div>
        <div class="stat-item fade-in">
          <div class="stat-number">3</div>
          <div class="stat-label">Counties Covered</div>
        </div>
        <div class="stat-item fade-in">
          <div class="stat-number">24/7</div>
          <div class="stat-label">Emergency Response</div>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <h2 class="text-center">Professional Tree Care Services</h2>
      <p class="section-intro">From hazardous tree removal to routine pruning and stump grinding, Second Nature Tree Service delivers safe, skilled work for homeowners throughout Peekskill and Northern Westchester.</p>
      <div class="services-grid">
        <div class="service-card fade-in">
          <div class="service-card-img"><img src="images/rigging-work.jpg" alt="Professional tree removal service in Peekskill NY - Second Nature Tree Service" width="600" height="400" loading="lazy"></div>
          <div class="service-card-body">
            <h3><a href="tree-removal.html">Tree Removal</a></h3>
            <p>Safe removal of hazardous, dead, and unwanted trees. From backyard maples to large oaks near your home, our crew handles every job with precision.</p>
            <a href="tree-removal.html" class="learn-more">Learn More &rarr;</a>
          </div>
        </div>
        <div class="service-card fade-in">
          <div class="service-card-img"><img src="images/tall-tree-climbing-garrison-ny.jpg" alt="Tree pruning and trimming in Yorktown and Northern Westchester NY" width="600" height="400" loading="lazy"></div>
          <div class="service-card-body">
            <h3><a href="tree-pruning.html">Pruning &amp; Trimming</a></h3>
            <p>Keep your trees healthy, safe, and beautiful with expert crown thinning, deadwood removal, structural pruning, and seasonal maintenance.</p>
            <a href="tree-pruning.html" class="learn-more">Learn More &rarr;</a>
          </div>
        </div>
        <div class="service-card fade-in">
          <div class="service-card-img"><img src="images/stump-grinding-service-peekskill-ny.jpg" alt="Professional stump grinding service in Peekskill and Westchester County NY" width="600" height="400" loading="lazy"></div>
          <div class="service-card-body">
            <h3><a href="stump-grinding.html">Stump Grinding</a></h3>
            <p>Eliminate tripping hazards and reclaim your yard. Our professional grinders remove stumps below grade quickly and affordably.</p>
            <a href="stump-grinding.html" class="learn-more">Learn More &rarr;</a>
          </div>
        </div>
        <div class="service-card fade-in">
          <div class="service-card-img"><img src="images/storm-damage-tree-on-car-yorktown-ny.jpg" alt="Emergency tree removal after storm in Peekskill NY area" width="600" height="400" loading="lazy"></div>
          <div class="service-card-body">
            <h3><a href="emergency-tree-service.html">Emergency Tree Service</a></h3>
            <p>Storm damage and fallen trees demand a fast response. We provide emergency tree removal to restore safety when you need it most.</p>
            <a href="emergency-tree-service.html" class="learn-more">Learn More &rarr;</a>
          </div>
        </div>
        <div class="service-card fade-in">
          <div class="service-card-img"><img src="images/land-clearing.jpg" alt="Land and lot clearing service in Northern Westchester County NY" width="600" height="400" loading="lazy"></div>
          <div class="service-card-body">
            <h3><a href="land-clearing.html">Land &amp; Lot Clearing</a></h3>
            <p>Preparing land for construction, landscaping, or simply clearing overgrown brush. We handle projects of all sizes.</p>
            <a href="land-clearing.html" class="learn-more">Learn More &rarr;</a>
          </div>
        </div>
        <div class="service-card fade-in">
          <div class="service-card-img"><img src="images/bucket-truck.jpg" alt="Full service tree care company" width="600" height="400" loading="lazy"></div>
          <div class="service-card-body">
            <h3><a href="services.html">Additional Services</a></h3>
            <p>Crane-assisted removal, cabling &amp; bracing, hedge trimming, tree health assessments, and more. See our full list of services.</p>
            <a href="services.html" class="learn-more">View All Services &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  </section>


  <section class="section">
    <div class="container">
      <div class="content-split">
        <div class="content-image fade-in">
          <img src="images/teamwork.jpg" alt="Second Nature Tree Service crew at work in Northern Westchester" width="600" height="400">
        </div>
        <div class="content-text fade-in">
          <h2>A Local Company That Treats Your Property Like Our Own</h2>
          <p>Second Nature Tree Service is a small, dedicated crew based in Peekskill, NY. We are not a franchise or a call center &mdash; when you reach out, you talk to the owners. When we show up, we bring the same team every time.</p>
          <p>That personal approach means better communication, more careful work, and results that speak for themselves. Here is what you get when you hire us:</p>
          <ul>
            <li>Direct communication with the owners from estimate to cleanup</li>
            <li>Honest pricing with no hidden fees or surprise charges</li>
            <li>Experienced crew using professional-grade equipment</li>
            <li>Complete job site cleanup &mdash; we leave your property spotless</li>
            <li>Respect for your landscaping, structures, and neighbors</li>
          </ul>
          <a href="contact.html" class="btn btn-secondary mt-2">Schedule Your Free Estimate</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <h2 class="text-center">Meet the Team</h2>
      <p class="section-intro">Second Nature Tree Service is a small, tight-knit crew based in Peekskill, NY. When you call, you reach real people who know your job from estimate to cleanup.</p>
      <div class="owners-grid owners-grid-4">
        <div class="owner-card fade-in">
          <div class="owner-photo-wrap">
            <img src="images/owner-catherine.jpg" alt="Catherine Conway - Branch Manager, Second Nature Tree Service" width="300" height="300" loading="lazy" onerror="this.parentElement.style.background=\'#e8f5e9\';this.style.display=\'none\'">
          </div>
          <h3>Catherine Conway</h3>
          <p class="owner-title">Branch Manager &amp; Sales</p>
          <p>Your first point of contact. Catherine handles estimates, customer communication, making sure every project gets off to the right start and finish.</p>
        </div>
        <div class="owner-card fade-in">
          <div class="owner-photo-wrap">
            <img src="images/owner-doug.jpg" alt="Doug Brown - Operations, Second Nature Tree Service Peekskill NY" width="300" height="300" loading="lazy" onerror="this.parentElement.style.background=\'#e8f5e9\';this.style.display=\'none\'">
          </div>
          <h3>Doug Brown</h3>
          <p class="owner-title">Operations</p>
          <p>Ensures the crew runs safely, efficiently, and that every customer is taken care of.</p>
        </div>
        <div class="owner-card fade-in">
          <div class="owner-photo-wrap">
            <img src="images/owner-ryan.jpg" alt="Ryan Knapp - Lead Climber, Second Nature Tree Service" width="300" height="300" loading="lazy" onerror="this.parentElement.style.background=\'#e8f5e9\';this.style.display=\'none\'">
          </div>
          <h3>Ryan Knapp</h3>
          <p class="owner-title">Lead Climber</p>
          <p>Ryan is the one in the tree. With years of professional climbing experience, Ryan handles the technical work safely and precisely.</p>
        </div>
        <div class="owner-card owner-card-cta fade-in">
          <div style="font-size:3rem;margin-bottom:1rem;">&#127795;</div>
          <h3>Ready to Talk?</h3>
          <p>Call and speak directly with our team &mdash; no call centers, no runaround.</p>
          <a href="tel:914-391-5233" class="btn btn-primary mt-1">&#9742; (914) 391-5233</a>
          <p style="margin-top:.75rem;font-size:.85rem;color:var(--text-light);">Mon&ndash;Fri 7am&ndash;6pm | Sat 8am&ndash;2pm<br>Emergency: 24/7</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      <h2 class="text-center">What Our Customers Are Saying</h2>
      <p class="section-intro">Over 70 five-star reviews on Google. Here is what homeowners across Westchester and Putnam Counties have to say about Second Nature Tree Service.</p>
      <div class="testimonials-grid">
        <div class="testimonial-card fade-in">
          <div class="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-text">Had a massive oak taken down that was leaning toward our house. The crew was careful, professional, and cleaned up everything. The yard looked better than before they started. Highly recommend.</p>
          <div class="testimonial-author">Mark R.</div>
          <div class="testimonial-location">Yorktown Heights, NY</div>
        </div>
        <div class="testimonial-card fade-in">
          <div class="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-text">Second Nature removed three dead ash trees and ground all the stumps in one day. Prompt, fair pricing, and the owners were on site the whole time. Will definitely call again.</p>
          <div class="testimonial-author">Jennifer L.</div>
          <div class="testimonial-location">Briarcliff Manor, NY</div>
        </div>
        <div class="testimonial-card fade-in">
          <div class="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-text">A large hemlock fell during a nor&rsquo;easter and blocked our driveway. Called Second Nature and they were out that same morning. Fast, professional, and the price was very reasonable for emergency work.</p>
          <div class="testimonial-author">Tom &amp; Lisa G.</div>
          <div class="testimonial-location">Garrison, NY</div>
        </div>
        <div class="testimonial-card fade-in">
          <div class="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-text">Used Second Nature for a big pruning job on four mature maples. They were on time, worked efficiently, and the cleanup was perfect. Prices were fair and they explained everything before starting. Great local company.</p>
          <div class="testimonial-author">Patricia M.</div>
          <div class="testimonial-location">Chappaqua, NY</div>
        </div>
        <div class="testimonial-card fade-in">
          <div class="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-text">We had a dead pine hanging over our kids&rsquo; swing set. Doug came out the next day, assessed it, and his crew removed it safely by end of week. Professional, friendly, and no mess left behind.</p>
          <div class="testimonial-author">Kevin &amp; Sarah T.</div>
          <div class="testimonial-location">Cortlandt Manor, NY</div>
        </div>
        <div class="testimonial-card fade-in">
          <div class="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-text">I got three quotes for a complicated removal close to the house. Second Nature was not the cheapest but their plan was clearly the safest and most thorough. Glad I went with them &mdash; zero damage, great result.</p>
          <div class="testimonial-author">Robert C.</div>
          <div class="testimonial-location">Pound Ridge, NY</div>
        </div>
        <div class="testimonial-card fade-in">
          <div class="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-text">Hired them to clear a section of overgrown brush and small trees on our back acre. Two-man crew knocked it out in a day. Hauled everything away and left the area clean. Will use them again for more clearing next spring.</p>
          <div class="testimonial-author">Diane F.</div>
          <div class="testimonial-location">Somers, NY</div>
        </div>
        <div class="testimonial-card fade-in">
          <div class="testimonial-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-text">Called after a storm took down a large limb onto my fence. They responded quickly, assessed the rest of the tree, and handled both the cleanup and the remaining hazard. Reasonable price and great communication throughout.</p>
          <div class="testimonial-author">Angela S.</div>
          <div class="testimonial-location">Mahopac, NY</div>
        </div>
      </div>
      <div class="google-review-banner fade-in" style="margin-top:2.5rem;text-align:center;padding:2rem;background:var(--white);border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          <div>
            <div style="font-size:1.5rem;color:#f4b400;letter-spacing:2px;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p style="margin:0;font-weight:600;font-size:1.1rem;">5.0 Stars &mdash; 70+ Reviews on Google</p>
          </div>
        </div>
        <p style="margin:.75rem 0 1rem;color:var(--text-light);">See what our customers are saying about Second Nature Tree Service</p>
        <a href="https://share.google/mLwSzzZXwc5fuFRU4" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Read All 70+ Google Reviews &rarr;</a>
      </div>
    </div>
  </section>


  <section class="section section-dark">
    <div class="container">
      <h2 class="text-center">Frequently Asked Questions</h2>
      <div class="faq-list">{idx_faq_items}
      </div>
    </div>
  </section>

  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "name": "Second Nature Tree Service",
    "url": "https://peekskilltree.com",
    "telephone": "+1-914-391-5233",
    "logo": "https://peekskilltree.com/images/logo.png",
    "openingHoursSpecification": [
      {{"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "07:00", "closes": "18:00"}},
      {{"@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "08:00", "closes": "16:00"}}
    ],
    "priceRange": "$$",
    "description": "Professional tree removal, pruning, stump grinding, and emergency tree services in Peekskill, NY. Serving Westchester, Putnam, and Southern Dutchess Counties.",
    "sameAs": [
      "https://www.facebook.com/peekskilltree",
      "https://www.instagram.com/secondnaturetree/",
      "https://www.youtube.com/channel/UCZgv2VOA7-A__UQizOEkKZA",
      "https://x.com/SNTreeNY",
      "https://share.google/mLwSzzZXwc5fuFRU4"
    ],
    "address": {{"@type": "PostalAddress", "addressLocality": "Peekskill", "addressRegion": "NY", "postalCode": "10566", "addressCountry": "US"}},
    "geo": {{"@type": "GeoCoordinates", "latitude": 41.2901, "longitude": -73.9204}},
    "areaServed": [
      {{"@type": "City", "name": "Peekskill"}}, {{"@type": "City", "name": "Yorktown"}},
      {{"@type": "City", "name": "Cortlandt Manor"}}, {{"@type": "City", "name": "Briarcliff Manor"}},
      {{"@type": "City", "name": "Chappaqua"}}, {{"@type": "City", "name": "Garrison"}},
      {{"@type": "City", "name": "Croton-on-Hudson"}}, {{"@type": "City", "name": "Ossining"}},
      {{"@type": "City", "name": "Cold Spring"}}, {{"@type": "City", "name": "Mount Kisco"}},
      {{"@type": "City", "name": "Somers"}}, {{"@type": "City", "name": "Mahopac"}},
      {{"@type": "City", "name": "Bedford"}}, {{"@type": "City", "name": "Putnam Valley"}},
      {{"@type": "City", "name": "Pound Ridge"}}, {{"@type": "City", "name": "Lewisboro"}},
      {{"@type": "City", "name": "North Salem"}}, {{"@type": "City", "name": "Armonk"}},
      {{"@type": "City", "name": "Pleasantville"}},
      {{"@type": "City", "name": "Beacon"}}, {{"@type": "City", "name": "Fishkill"}},
      {{"@type": "City", "name": "East Fishkill"}}, {{"@type": "City", "name": "Wappingers Falls"}},
      {{"@type": "City", "name": "Pawling"}}, {{"@type": "City", "name": "Dover"}}
    ],
    "aggregateRating": {{
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "70",
      "bestRating": "5"
    }},
    "review": [
      {{
        "@type": "Review",
        "author": {{"@type": "Person", "name": "Mark R."}},
        "datePublished": "2025-06-15",
        "reviewRating": {{"@type": "Rating", "ratingValue": "5", "bestRating": "5"}},
        "reviewBody": "Had a massive oak taken down that was leaning toward our house. The crew was careful, professional, and cleaned up everything."
      }},
      {{
        "@type": "Review",
        "author": {{"@type": "Person", "name": "Jennifer L."}},
        "datePublished": "2025-08-22",
        "reviewRating": {{"@type": "Rating", "ratingValue": "5", "bestRating": "5"}},
        "reviewBody": "Second Nature removed three dead ash trees and ground all the stumps in one day. Prompt, fair pricing, and the owners were on site the whole time."
      }},
      {{
        "@type": "Review",
        "author": {{"@type": "Person", "name": "Tom G."}},
        "datePublished": "2026-01-14",
        "reviewRating": {{"@type": "Rating", "ratingValue": "5", "bestRating": "5"}},
        "reviewBody": "A large hemlock fell during a nor'easter and blocked our driveway. Called Second Nature and they were out that same morning. Fast, professional."
      }},
      {{
        "@type": "Review",
        "author": {{"@type": "Person", "name": "Patricia M."}},
        "datePublished": "2025-09-14",
        "reviewRating": {{"@type": "Rating", "ratingValue": "5", "bestRating": "5"}},
        "reviewBody": "Used Second Nature for a big pruning job on four mature maples. They were on time, worked efficiently, and the cleanup was perfect."
      }},
      {{
        "@type": "Review",
        "author": {{"@type": "Person", "name": "Kevin T."}},
        "datePublished": "2025-10-05",
        "reviewRating": {{"@type": "Rating", "ratingValue": "5", "bestRating": "5"}},
        "reviewBody": "We had a dead pine hanging over our kids' swing set. Doug came out the next day, assessed it, and his crew removed it safely by end of week."
      }},
      {{
        "@type": "Review",
        "author": {{"@type": "Person", "name": "Robert C."}},
        "datePublished": "2025-07-18",
        "reviewRating": {{"@type": "Rating", "ratingValue": "5", "bestRating": "5"}},
        "reviewBody": "I got three quotes for a complicated removal close to the house. Second Nature was not the cheapest but their plan was clearly the safest."
      }},
      {{
        "@type": "Review",
        "author": {{"@type": "Person", "name": "Diane F."}},
        "datePublished": "2025-10-28",
        "reviewRating": {{"@type": "Rating", "ratingValue": "5", "bestRating": "5"}},
        "reviewBody": "Hired them to clear a section of overgrown brush and small trees on our back acre. Two-man crew knocked it out in a day."
      }},
      {{
        "@type": "Review",
        "author": {{"@type": "Person", "name": "Angela S."}},
        "datePublished": "2026-02-21",
        "reviewRating": {{"@type": "Rating", "ratingValue": "5", "bestRating": "5"}},
        "reviewBody": "Called after a storm took down a large limb onto my fence. They responded quickly, assessed the rest of the tree, and handled both the cleanup and the remaining hazard."
      }}
    ],
    "priceRange": "$$",
    "openingHoursSpecification": [{{"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "07:00", "closes": "18:00"}},
      {{"@type": "OpeningHoursSpecification", "dayOfWeek": "Saturday", "opens": "08:00", "closes": "14:00"}}],
    "hasOfferCatalog": {{"@type": "OfferCatalog", "name": "Tree Services", "itemListElement": [
      {{"@type": "Offer", "itemOffered": {{"@type": "Service", "name": "Tree Removal"}}}},
      {{"@type": "Offer", "itemOffered": {{"@type": "Service", "name": "Tree Pruning"}}}},
      {{"@type": "Offer", "itemOffered": {{"@type": "Service", "name": "Stump Grinding"}}}},
      {{"@type": "Offer", "itemOffered": {{"@type": "Service", "name": "Emergency Tree Service"}}}},
      {{"@type": "Offer", "itemOffered": {{"@type": "Service", "name": "Land Clearing"}}}}
    ]}}
  }}
  </script>
  <script type="application/ld+json">
  [
    {{"@context":"https://schema.org","@type":"Person","name":"Catherine Conway","jobTitle":"Branch Manager & Sales","description":"Catherine handles estimates, customer communication, and sales for Second Nature Tree Service.","image":"https://peekskilltree.com/images/owner-catherine.jpg","worksFor":{{"@type":"Organization","name":"Second Nature Tree Service","url":"https://peekskilltree.com"}}}},
    {{"@context":"https://schema.org","@type":"Person","name":"Doug Brown","jobTitle":"Operations Manager","description":"Doug oversees every job from estimate to final cleanup, ensuring the crew runs safely and efficiently.","image":"https://peekskilltree.com/images/owner-doug.jpg","worksFor":{{"@type":"Organization","name":"Second Nature Tree Service","url":"https://peekskilltree.com"}}}},
    {{"@context":"https://schema.org","@type":"Person","name":"Ryan Knapp","jobTitle":"Lead Climber","description":"Ryan is Second Nature's lead tree climber, handling all technical climbing work with professional-grade rigging and safety equipment.","image":"https://peekskilltree.com/images/owner-ryan.jpg","worksFor":{{"@type":"Organization","name":"Second Nature Tree Service","url":"https://peekskilltree.com"}}}}
  ]
  </script>
  <script type="application/ld+json">{idx_faq_schema}</script>
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Second Nature Tree Service",
    "url": "https://peekskilltree.com",
    "description": "Professional tree removal, pruning, stump grinding, and emergency tree services in Westchester, Putnam, and Southern Dutchess Counties, NY.",
    "publisher": {{
      "@type": "Organization",
      "name": "Second Nature Tree Service",
      "url": "https://peekskilltree.com",
      "logo": {{
        "@type": "ImageObject",
        "url": "https://peekskilltree.com/images/logo.png",
        "width": 76,
        "height": 76
      }},
      "foundingDate": "2015",
      "foundingLocation": "Peekskill, NY",
      "sameAs": [
        "https://facebook.com/peekskilltree",
        "https://instagram.com/secondnaturetree/",
        "https://share.google/mLwSzzZXwc5fuFRU4",
        "https://x.com/SNTreeNY",
        "https://www.youtube.com/channel/UCZgv2VOA7-A__UQizOEkKZA",
        "https://www.yelp.com/biz/second-nature-tree-peekskill"
      ],
      "contactPoint": {{
        "@type": "ContactPoint",
        "telephone": "+1-914-391-5233",
        "contactType": "customer service",
        "areaServed": ["Westchester County", "Putnam County", "Dutchess County"],
        "availableLanguage": "English"
      }}
    }}
  }}
  </script>
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": "Second Nature Tree Service - Professional Tree Work",
    "description": "See our crew in action — tree removal, pruning, bucket truck operations, and land clearing across Westchester and Putnam Counties.",
    "thumbnailUrl": "https://peekskilltree.com/images/hero-montage-poster.jpg",
    "uploadDate": "2026-01-15",
    "contentUrl": "https://peekskilltree.com/images/hero-montage.mp4",
    "duration": "PT11S",
    "publisher": {{
      "@type": "Organization",
      "name": "Second Nature Tree Service",
      "logo": {{
        "@type": "ImageObject",
        "url": "https://peekskilltree.com/images/logo.png"
      }}
    }}
  }}
  </script>
'''

write_page("index.html", index_content + FOOTER)
print("Created index.html")

# ============================================================
# SERVICE PAGES GENERATOR
# ============================================================
service_pages = [
    {
        "file": "tree-removal.html",
        "title": "Tree Removal Peekskill NY | Second Nature Tree Service",
        "desc": "Professional tree removal in Peekskill, Yorktown, and Northern Westchester County. Hazardous tree removal, crane-assisted work, complete cleanup. Licensed, insured, free estimates. Call (914) 391-5233.",
        "h1": "Professional Tree Removal in Peekskill, NY &amp; Northern Westchester",
        "hero_img": "rigging-work.jpg",
        "og_image": "images/rigging-work.jpg",
        "active": "removal",
        "breadcrumb": '<a href="index.html">Home</a> <span>&raquo;</span> <a href="services.html">Services</a> <span>&raquo;</span> Tree Removal',
        "breadcrumbs": [{"name": "Home", "url": ""}, {"name": "Services", "url": "services.html"}, {"name": "Tree Removal", "url": "tree-removal.html"}],
        "howto": {
            "name": "How Second Nature Tree Service Removes a Tree",
            "description": "Our 4-step tree removal process ensures safety and clean results for Westchester and Putnam County homeowners.",
            "steps": [
                ("Free On-Site Assessment", "We evaluate the tree, surrounding area, and access for equipment. We discuss concerns and answer your questions."),
                ("Detailed Written Quote", "You receive a written estimate covering the full scope including cleanup and haul-away. No hidden fees."),
                ("Safe Controlled Removal", "Our crew uses climbing gear, rigging ropes, bucket trucks, or cranes as needed. Each section is lowered carefully."),
                ("Complete Cleanup", "We remove all wood, branches, and debris. When we leave, your property is spotless.")
            ]
        },
        "content": '''
          <h2>Safe, Expert Tree Removal You Can Trust</h2>
          <p>When a tree on your property becomes hazardous, diseased, or simply needs to go, you need a crew that handles the job safely and completely. Second Nature Tree Service has been removing trees across Peekskill, Yorktown, Cortlandt Manor, and the greater Northern Westchester area for over a decade. As a locally owned company with both owners on every job, we bring personal accountability and professional-grade equipment to every removal.</p>
          <p>Whether it is a dead ash tree threatening your roof, a massive oak that has outgrown its space, or storm-damaged limbs hanging over your driveway, we have the expertise and the tools to take it down safely, clean up thoroughly, and leave your property looking better than we found it.</p>

          <div class="gallery-grid" style="margin:2rem 0;">
            <div class="gallery-item"><img src="images/professional-tree-climber-rigging-westchester.jpg" alt="Professional tree climber with rigging in Westchester County NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/crane-lift.jpg" alt="Crane-assisted tree removal in Westchester County" loading="lazy"></div>
            <div class="gallery-item"><img src="images/tree-rigging-groundwork-new-castle-ny.jpg" alt="Tree rigging and ground crew working in New Castle NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/tall-tree-climbing-garrison-ny.jpg" alt="Tall tree climbing for removal in Garrison NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/dead-tree-removal-bucket-truck-lewisboro.jpg" alt="Dead tree removal with bucket truck in Lewisboro NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/tree-removal-near-house-briarcliff-manor.jpg" alt="Careful tree removal near house in Briarcliff Manor NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/large-tree-trunk-removal-north-salem.jpg" alt="Large tree trunk removal with equipment in North Salem NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/log-removal-grapple-equipment-bedford-ny.jpg" alt="Log removal with grapple equipment in Bedford NY" loading="lazy"></div>
          </div>

          <h2>When Does a Tree Need to Be Removed?</h2>
          <ul class="check-list">
            <li><strong>Dead or dying trees</strong> &mdash; Standing dead trees are unpredictable and can fall without warning, damaging property or injuring people.</li>
            <li><strong>Storm-damaged trees</strong> &mdash; Cracked trunks, split crotches, and hanging branches after severe weather create immediate hazards.</li>
            <li><strong>Dangerous lean</strong> &mdash; Trees leaning toward your home, garage, power lines, or walkways may need removal before they fail.</li>
            <li><strong>Root damage to foundations</strong> &mdash; Invasive root systems can crack foundations, lift sidewalks, and damage underground utilities.</li>
            <li><strong>Disease and infestation</strong> &mdash; Emerald ash borer, hemlock woolly adelgid, and other pests are devastating trees throughout the Hudson Valley.</li>
            <li><strong>Construction and lot clearing</strong> &mdash; Building a new addition, pool, or driveway often requires removing trees in the work area.</li>
            <li><strong>Overcrowding</strong> &mdash; Trees planted too close together compete for light and nutrients, weakening all of them over time.</li>
          </ul>

          <h2>Our Tree Removal Process</h2>
          <p>Every tree removal follows a careful, four-step process designed to protect your property and keep everyone safe:</p>
          <ol style="margin:1rem 0 1rem 1.5rem;">
            <li style="margin-bottom:1rem;"><strong>Free On-Site Assessment</strong> &mdash; We evaluate the tree, the surrounding area, and access for equipment. We discuss any concerns and answer your questions.</li>
            <li style="margin-bottom:1rem;"><strong>Detailed Quote</strong> &mdash; You receive a written estimate covering the full scope of work including cleanup and haul-away. No hidden fees, no surprises.</li>
            <li style="margin-bottom:1rem;"><strong>Safe, Controlled Removal</strong> &mdash; Our crew uses climbing gear, rigging ropes, bucket trucks, or cranes as needed. Each section is lowered carefully to prevent property damage.</li>
            <li style="margin-bottom:1rem;"><strong>Complete Cleanup</strong> &mdash; We remove all wood, branches, and debris. When we leave, the only evidence a tree was there is the extra space in your yard.</li>
          </ol>

          <h2>Types of Tree Removal We Handle</h2>
          <p><strong>Residential Tree Removal</strong> &mdash; The majority of our work involves removing trees from residential properties. Backyard maples, front-yard oaks, dead pines along property lines &mdash; we handle them all with care for your landscaping, fences, and structures.</p>
          <p><strong>Large &amp; Complex Removals</strong> &mdash; Mature hardwoods and tall pines require advanced rigging and experienced climbers. Our team routinely handles trees 80 feet and taller, even in tight spaces between homes.</p>
          <p><strong>Hazardous Tree Removal</strong> &mdash; Trees near power lines, leaning on structures, or severely decayed demand specialized safety protocols. We have the training, insurance, and equipment for high-risk situations.</p>
          <p><strong>Crane-Assisted Removal</strong> &mdash; For extremely large trees or difficult access, we bring in a crane to lift sections straight out, reducing risk and often completing the job faster.</p>
          <p><strong>Emergency Removal</strong> &mdash; When storms bring down trees, we respond quickly to restore safety. <a href="emergency-tree-service.html">Learn about our emergency services</a>.</p>

          <h2>Tree Removal Cost in Westchester County</h2>
          <p>Every tree is different, and the cost of removal depends on several factors including tree size, location on your property, proximity to structures and power lines, access for equipment, and overall complexity. Rather than quoting a generic price range, we provide free on-site estimates so you get a fair, accurate price for your specific situation.</p>
          <p><strong>Factors that affect tree removal cost:</strong></p>
          <ul class="check-list">
            <li>Tree height and trunk diameter</li>
            <li>Proximity to homes, garages, fences, and power lines</li>
            <li>Equipment access (open yard vs. narrow side yard)</li>
            <li>Need for crane or specialized rigging</li>
            <li>Stump grinding (available as an add-on)</li>
          </ul>
          <p><a href="contact.html" class="btn btn-primary mt-1">Get Your Free Tree Removal Estimate</a></p>

          <h2>Serving Northern Westchester &amp; Putnam County</h2>
          <div class="location-highlight">
            <h3><a href="tree-service-peekskill-ny.html">Tree Removal in Peekskill, NY</a></h3>
            <p>Our home base. We know every neighborhood from downtown to the waterfront. Silver maples, Norway maples, and aging white oaks are the most common species we remove here.</p>
          </div>
          <div class="location-highlight">
            <h3><a href="tree-service-yorktown-ny.html">Tree Removal in Yorktown Heights, NY</a></h3>
            <p>Large wooded lots with mature red oaks, sugar maples, and hickories. Many Yorktown properties need removal when aging hardwoods develop structural problems.</p>
          </div>
          <div class="location-highlight">
            <h3><a href="tree-service-cortlandt-ny.html">Tree Removal in Cortlandt Manor, NY</a></h3>
            <p>From suburban subdivisions to heavily wooded parcels near Bear Mountain. Hemlock woolly adelgid is a growing concern causing hemlock decline throughout Cortlandt.</p>
          </div>
          <div class="location-highlight">
            <h3><a href="tree-service-briarcliff-manor-ny.html">Tree Removal in Briarcliff Manor, NY</a></h3>
            <p>Established properties with mature canopies. We are familiar with the village tree preservation regulations and can guide you through the permitting process.</p>
          </div>
          <div class="location-highlight">
            <h3><a href="tree-service-chappaqua-ny.html">Tree Removal in Chappaqua, NY</a></h3>
            <p>Premium residential lots with towering hardwoods. Homeowners here invest in their landscapes, and careful removal around high-value landscaping is essential.</p>
          </div>
          <div class="location-highlight">
            <h3><a href="tree-service-garrison-ny.html">Tree Removal in Garrison, NY</a></h3>
            <p>Putnam County properties with steep terrain, long driveways, and dense woodland. Our equipment and crew are well suited to the challenges of working in Garrison's rugged landscape.</p>
          </div>''',
        "faqs": [
            ("How much does tree removal cost in Westchester County?", "Costs depend on tree size, location, access, and complexity. We offer free on-site estimates for accurate pricing. Call (914) 391-5233 to schedule."),
            ("Do I need a permit to remove a tree in Peekskill?", "Permit requirements vary by municipality. Many towns in Westchester require permits for trees above a certain diameter. We advise you on local regulations during your free estimate."),
            ("What is the best time of year to remove a tree?", "Tree removal can be done year-round. Winter is often ideal for deciduous trees since they are bare and lighter. Hazardous trees should be addressed immediately regardless of season."),
            ("How long does tree removal take?", "Most residential removals take a few hours to a full day depending on size and complexity. We provide time estimates during your free consultation."),
            ("Do you remove the stump too?", "Stump grinding is available as an add-on service. Many customers bundle it with removal for a complete result. See our stump grinding page for details."),
            ("Are you insured for tree removal?", "Yes. We carry full general liability and workers compensation coverage. Licensed in Westchester (WC-32079) and Putnam (PC-50644) Counties. We provide certificates of insurance on request."),
            ("Do you offer emergency tree removal?", "Yes. We respond to fallen trees, storm damage, and hazardous situations as quickly as possible. Call (914) 391-5233 for emergency service."),
            ("What happens to the wood after removal?", "All debris is hauled away for recycling. If you want firewood, we can buck it into logs and stack it on your property at no extra charge.")
        ]
    },
    {
        "file": "tree-pruning.html",
        "title": "Tree Pruning & Trimming Peekskill NY | Second Nature Tree Service",
        "desc": "Expert tree pruning and trimming in Peekskill, NY and Northern Westchester. Crown thinning, deadwood removal, structural pruning. Licensed, insured, free estimates. (914) 391-5233.",
        "h1": "Expert Tree Pruning &amp; Trimming in Peekskill, NY",
        "hero_img": "tree-pruning-climber-peekskill-ny.jpg",
        "og_image": "images/tree-pruning-climber-peekskill-ny.jpg",
        "active": "pruning",
        "breadcrumb": '<a href="index.html">Home</a> <span>&raquo;</span> <a href="services.html">Services</a> <span>&raquo;</span> Tree Pruning',
        "breadcrumbs": [{"name": "Home", "url": ""}, {"name": "Services", "url": "services.html"}, {"name": "Tree Pruning", "url": "tree-pruning.html"}],
        "howto": {
            "name": "How Second Nature Prunes Your Trees",
            "description": "Professional tree pruning process used by Second Nature Tree Service in Peekskill, NY.",
            "steps": [
                ("Free Estimate & Tree Assessment", "We evaluate the tree's structure, health, and pruning needs."),
                ("Pruning Plan", "We explain the type of pruning recommended and why."),
                ("Professional Climbing & Pruning", "Our certified climbers use proper tools to make clean cuts at the right locations."),
                ("Debris Removal & Cleanup", "All branches and debris are chipped or hauled away. Site is left clean.")
            ]
        },
        "content": '''
          <h2>Professional Tree Pruning for Healthier, Safer Trees</h2>
          <p>Regular pruning is the foundation of proper tree care. At Second Nature Tree Service, our experienced crew provides expert pruning and trimming services that promote tree health, improve structural integrity, and enhance the appearance of your landscape. Serving Peekskill and communities throughout Northern Westchester and Putnam Counties.</p>

          <h2>Types of Pruning We Provide</h2>
          <p><strong>Crown Thinning</strong> &mdash; Selective removal of interior branches to increase light penetration and air circulation, reducing wind resistance and the risk of storm damage.</p>
          <p><strong>Crown Raising</strong> &mdash; Removing lower branches to provide clearance for walkways, driveways, structures, and sight lines while maintaining the tree's natural shape.</p>
          <p><strong>Deadwood Removal</strong> &mdash; Eliminating dead, dying, and diseased branches that pose a falling hazard and can spread decay to healthy parts of the tree.</p>
          <p><strong>Structural Pruning</strong> &mdash; Training young trees to develop strong branch architecture and correcting structural defects in maturing trees before they become problems.</p>
          <p><strong>Vista Pruning</strong> &mdash; Selectively thinning branches to open up views of the Hudson River, valleys, or other scenic elements without removing the tree.</p>

          <h2>When to Prune Trees in the Hudson Valley</h2>
          <p><strong>Late Winter (January-March):</strong> Ideal for most deciduous trees. Dormant pruning promotes vigorous spring growth and makes branch structure easy to evaluate.</p>
          <p><strong>Summer:</strong> Good for controlling growth and removing water sprouts. Also the best time to evaluate and address storm damage.</p>
          <p><strong>Fall:</strong> Generally avoided for major pruning as cuts heal slowly and disease organisms are active.</p>
          <p><strong>Any Time:</strong> Dead, damaged, or hazardous branches should be removed immediately regardless of season.</p>

          <div class="gallery-grid" style="margin:2rem 0;">
            <div class="gallery-item"><img src="images/branch-pov.jpg" alt="Tree pruning from climber perspective in Northern Westchester" loading="lazy"></div>
            <div class="gallery-item"><img src="images/aerial-tree-climber-chainsaw-putnam-county.jpg" alt="Certified arborist climbing with chainsaw in Putnam County NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/tree-climber-aerial-view-pound-ridge.jpg" alt="Professional tree climber aerial view in Pound Ridge NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/hemlock-removal.jpg" alt="Careful pruning of hemlock tree in Westchester County" loading="lazy"></div>
          </div>

          <h2>Benefits of Professional Pruning</h2>
          <ul class="check-list">
            <li>Reduces risk of branch failure and storm damage</li>
            <li>Improves tree health by removing diseased wood</li>
            <li>Enhances property appearance and curb appeal</li>
            <li>Increases light to lawn and garden areas below</li>
            <li>Prevents branches from damaging roofs, gutters, and siding</li>
            <li>Maintains clear sight lines for driveways and walkways</li>
          </ul>''',
        "faqs": [
            ("How often should trees be pruned?", "Most mature trees benefit from pruning every 3-5 years. Young trees may need structural pruning more frequently. We can assess your trees and recommend a maintenance schedule."),
            ("Is winter a good time to prune trees?", "Yes. Late winter is often the best time for most deciduous trees in the Hudson Valley. The tree is dormant, branches are visible, and spring growth will quickly close pruning wounds."),
            ("Can pruning save a damaged tree?", "In many cases, yes. Removing damaged, diseased, or structurally weak branches can extend a tree's life significantly. We evaluate each tree and advise honestly on whether pruning or removal is the better option."),
            ("Do you prune large trees?", "Absolutely. Our climbers are trained and equipped to work safely in trees of any size. We use professional climbing gear, rigging, and bucket trucks to reach every branch."),
            ("How much does tree pruning cost?", "Pruning costs depend on tree size, number of trees, type of pruning needed, and access. We provide free on-site estimates. Call (914) 391-5233.")
        ]
    },
    {
        "file": "stump-grinding.html",
        "title": "Stump Grinding Peekskill NY | Fast & Affordable | Second Nature Tree Service",
        "desc": "Professional stump grinding in Peekskill, NY. Remove unsightly stumps quickly and affordably. Licensed, insured, free estimates. Serving Westchester & Putnam. (914) 391-5233.",
        "h1": "Professional Stump Grinding in Peekskill, NY",
        "hero_img": "stump-grinding-service-peekskill-ny.jpg",
        "og_image": "images/stump-grinding-service-peekskill-ny.jpg",
        "active": "stump",
        "breadcrumb": '<a href="index.html">Home</a> <span>&raquo;</span> <a href="services.html">Services</a> <span>&raquo;</span> Stump Grinding',
        "breadcrumbs": [{"name": "Home", "url": ""}, {"name": "Services", "url": "services.html"}, {"name": "Stump Grinding", "url": "stump-grinding.html"}],
        "howto": {
            "name": "How Second Nature Grinds a Tree Stump",
            "description": "Professional stump grinding process in Peekskill, Westchester, and Putnam Counties.",
            "steps": [
                ("Site Assessment", "We check for underground utilities, irrigation lines, and nearby structures."),
                ("Stump Grinding", "Using our professional-grade grinder, we grind the stump 6-12 inches below grade."),
                ("Cleanup & Fill", "Wood chips fill the hole and are mounded slightly for settling. Haul-away available.")
            ]
        },
        "content": '''
          <h2>Fast, Affordable Stump Grinding Services</h2>
          <p>After a tree is removed, the stump left behind can be an eyesore, a tripping hazard, and a magnet for pests. Second Nature Tree Service provides professional stump grinding that eliminates the stump below grade, giving you back clean, usable yard space. Serving Peekskill and all of Northern Westchester and Putnam County.</p>

          <h2>Our Stump Grinding Process</h2>
          <p><strong>1. Assessment &amp; Preparation</strong> &mdash; We check for underground utilities, irrigation lines, and nearby structures. The area around the stump is cleared of rocks and debris.</p>
          <p><strong>2. Grinding</strong> &mdash; Using our professional-grade stump grinder, we grind the stump 6 to 12 inches below ground level. The carbide-tipped cutting wheel reduces the stump to fine wood chips.</p>
          <p><strong>3. Cleanup &amp; Fill</strong> &mdash; Wood chips are used to fill the hole and mound slightly to account for settling. We can also haul chips away and backfill with topsoil if you prefer.</p>

          <h2>Why Remove Tree Stumps?</h2>
          <ul class="check-list">
            <li><strong>Trip hazard</strong> &mdash; Stumps are a liability for children, guests, and anyone walking your property</li>
            <li><strong>Pest magnet</strong> &mdash; Decaying stumps attract termites, carpenter ants, and beetles</li>
            <li><strong>Regrowth</strong> &mdash; Many species send up aggressive sprouts from stumps left in the ground</li>
            <li><strong>Curb appeal</strong> &mdash; Old stumps detract from property appearance and can lower home values</li>
            <li><strong>Lawn care</strong> &mdash; No more mowing around stumps or risking mower blade damage on hidden roots</li>
            <li><strong>Reclaim space</strong> &mdash; Use that spot for a garden, patio, or just open lawn</li>
          </ul>

          <div class="gallery-grid" style="margin:2rem 0;">
            <div class="gallery-item"><img src="images/stump-grinding-service-peekskill-ny.jpg" alt="Professional stump grinding with Bandit grinder in Peekskill NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/stump-grinder-close-up-westchester-ny.jpg" alt="Close-up of Bandit stump grinder removing tree stump in Westchester NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/bandit-stump-grinder-equipment-peekskill.jpg" alt="Bandit stump grinder equipment at Second Nature Tree in Peekskill NY" loading="lazy"></div>
          </div>

          <h2>Cost Factors for Stump Grinding</h2>
          <p>Pricing depends on stump diameter, number of stumps, wood hardness, and accessibility. Multiple stumps on the same property often qualify for volume pricing. We provide free estimates so you know the cost before we begin.</p>''',
        "faqs": [
            ("How deep does stump grinding go?", "We grind stumps 6 to 12 inches below ground level, sufficient for planting grass or garden beds. Deeper grinding is available for construction projects."),
            ("What happens to the wood chips?", "Chips are used to fill the hole by default and make excellent mulch. We can also haul them away and backfill with topsoil if you prefer."),
            ("Can you grind stumps in tight spaces?", "Yes. We have compact grinders that fit through 36-inch gates and even smaller hand-operated equipment for extremely tight areas."),
            ("How long does stump grinding take?", "Most individual stumps take 30 minutes to 2 hours depending on size and wood hardness. Small stumps can be done in as little as 15-20 minutes."),
            ("Is grinding better than chemical removal?", "Yes. Mechanical grinding is faster, more thorough, and chemical-free. Chemical methods take weeks or months and introduce chemicals into your soil.")
        ]
    },
    {
        "file": "emergency-tree-service.html",
        "title": "Emergency Tree Service Peekskill NY | 24/7 Storm Damage | Second Nature",
        "desc": "24/7 emergency tree removal in Peekskill, NY and Northern Westchester. Fast response for storm damage, fallen trees, and hazardous situations. Licensed, insured. (914) 391-5233.",
        "h1": "24/7 Emergency Tree Service in Peekskill, NY",
        "hero_img": "storm-damage-tree-on-car-yorktown-ny.jpg",
        "og_image": "images/storm-damage-tree-on-car-yorktown-ny.jpg",
        "active": "emergency",
        "breadcrumb": '<a href="index.html">Home</a> <span>&raquo;</span> <a href="services.html">Services</a> <span>&raquo;</span> Emergency Tree Service',
        "breadcrumbs": [{"name": "Home", "url": ""}, {"name": "Services", "url": "services.html"}, {"name": "Emergency Tree Service", "url": "emergency-tree-service.html"}],
        "howto": {
            "name": "How to Get Emergency Tree Service from Second Nature",
            "description": "24/7 emergency tree removal process for storm damage in Westchester and Putnam Counties.",
            "steps": [
                ("Call Us 24/7", "Call (914) 391-5233 any time. We answer emergency calls around the clock."),
                ("Same-Day Response", "We prioritize emergency calls and dispatch as quickly as possible, often same-day."),
                ("Safety Assessment", "We assess the hazard, secure the area, and develop a safe removal plan."),
                ("Emergency Removal & Cleanup", "We remove the hazard and restore safety to your property.")
            ]
        },
        "content": '''
          <h2>Fast Emergency Response When You Need It Most</h2>
          <p>Severe storms, heavy snow, and high winds can bring down trees without warning. When a fallen tree is blocking your driveway, leaning on your roof, or threatening your family's safety, Second Nature Tree Service responds quickly to restore safety and protect your property. We serve Peekskill and all of Northern Westchester and Putnam County.</p>

          <h2>Emergency Situations We Handle</h2>
          <ul class="check-list">
            <li><strong>Fallen trees on structures</strong> &mdash; Trees resting on your home, garage, or vehicles require immediate, careful removal to prevent further damage</li>
            <li><strong>Trees blocking driveways and roads</strong> &mdash; We clear access so you can get in and out of your property safely</li>
            <li><strong>Hanging branches</strong> &mdash; Partially broken branches lodged in the canopy can fall at any time and must be removed promptly</li>
            <li><strong>Leaning trees</strong> &mdash; Trees with sudden lean after a storm may have compromised root systems and could fall</li>
            <li><strong>Trees near power lines</strong> &mdash; We coordinate with utility companies when fallen or damaged trees involve electrical lines</li>
            <li><strong>Uprooted trees</strong> &mdash; Even partially uprooted trees are unstable and dangerous until properly secured or removed</li>
          </ul>

          <h2>Why Immediate Response Matters</h2>
          <p>A damaged tree is an unpredictable hazard. What looks stable after a storm can shift or fall further as conditions change. Waiting allows water intrusion where trees have damaged roofing, and secondary damage from subsequent storms becomes more likely. Our goal is to respond the same day whenever possible to stabilize the situation and begin safe removal.</p>

          <div class="gallery-grid" style="margin:2rem 0;">
            <div class="gallery-item"><img src="images/storm-damage-tree-on-car-yorktown-ny.jpg" alt="Emergency storm damage tree removal from car in Yorktown NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/emergency-tree-service-night-peekskill.jpg" alt="Emergency tree service at night with bucket truck Peekskill NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/emergency-tree-removal-peekskill.jpg" alt="Emergency fallen tree removal in Peekskill NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/big-fell.jpg" alt="Large tree felling for emergency removal" loading="lazy"></div>
          </div>

          <h2>Our Emergency Process</h2>
          <p><strong>1. Call us at <a href="tel:914-391-5233">(914) 391-5233</a></strong> &mdash; Describe the situation so we can assess urgency and dispatch the right equipment.</p>
          <p><strong>2. Rapid assessment</strong> &mdash; We arrive on site, evaluate the hazard, and determine the safest approach for removal.</p>
          <p><strong>3. Stabilize and remove</strong> &mdash; Our crew works efficiently to eliminate the immediate danger, whether that means removing a fallen tree, cutting away hanging limbs, or bracing a compromised trunk.</p>
          <p><strong>4. Full cleanup</strong> &mdash; We remove all debris and can return for stump grinding and additional cleanup once the emergency is resolved.</p>''',
        "faqs": [
            ("Do you respond to emergencies on weekends?", "Yes. Tree emergencies do not follow a schedule and neither do we. Call (914) 391-5233 and we will respond as quickly as possible."),
            ("Will my insurance cover emergency tree removal?", "Most homeowner insurance policies cover tree removal when a tree falls on a structure. We can provide detailed documentation and invoicing that makes the claims process easier."),
            ("How fast can you respond?", "For genuine emergencies threatening safety or property, we aim for same-day response. During major storm events, we prioritize by severity and work through our queue as fast as safely possible."),
            ("What should I do while waiting for you?", "Stay away from the fallen tree and any downed power lines. Do not attempt to remove the tree yourself. If power lines are involved, call your utility company. Keep people and pets away from the area."),
            ("Do you handle insurance paperwork?", "We provide complete documentation including photos, descriptions of work performed, and detailed invoices. This makes filing your insurance claim straightforward.")
        ]
    },
    {
        "file": "land-clearing.html",
        "title": "Land Clearing Peekskill NY | Lot Clearing | Second Nature Tree Service",
        "desc": "Professional land and lot clearing in Peekskill, NY. Residential and commercial clearing, brush removal, site preparation. Licensed, insured, free estimates. (914) 391-5233.",
        "h1": "Professional Land &amp; Lot Clearing in Peekskill, NY",
        "hero_img": "land-clearing.jpg",
        "og_image": "images/land-clearing.jpg",
        "active": "clearing",
        "breadcrumb": '<a href="index.html">Home</a> <span>&raquo;</span> <a href="services.html">Services</a> <span>&raquo;</span> Land Clearing',
        "breadcrumbs": [{"name": "Home", "url": ""}, {"name": "Services", "url": "services.html"}, {"name": "Land Clearing", "url": "land-clearing.html"}],
        "howto": {
            "name": "How Second Nature Clears Land and Lots",
            "description": "Land and lot clearing process for Westchester, Putnam, and Dutchess County properties.",
            "steps": [
                ("Site Walk & Assessment", "We walk the property, discuss goals, and identify any site constraints."),
                ("Written Clearing Plan", "We provide a written estimate and clearing plan including debris disposal."),
                ("Tree Removal & Clearing", "We fell, chip, and remove all vegetation according to the plan."),
                ("Debris Removal & Site Prep", "All material is hauled away or chipped on-site. Site is left ready for next steps.")
            ]
        },
        "content": '''
          <h2>Prepare Your Property for What Comes Next</h2>
          <p>Whether you are building a new home, adding an addition, installing a pool, or simply reclaiming overgrown land, Second Nature Tree Service provides thorough land and lot clearing throughout Peekskill and Northern Westchester County. We handle everything from selective tree removal to complete lot clearing, leaving your site clean and ready for the next phase.</p>

          <h2>Land Clearing Services We Provide</h2>
          <ul class="check-list">
            <li><strong>Residential lot clearing</strong> &mdash; Clearing wooded areas for new construction, landscaping, or expanded yard space</li>
            <li><strong>Commercial site preparation</strong> &mdash; Clearing land for commercial development, parking areas, and access roads</li>
            <li><strong>Selective clearing</strong> &mdash; Removing specific trees and brush while preserving desirable specimens</li>
            <li><strong>Brush and undergrowth removal</strong> &mdash; Clearing invasive species, dense brush, and overgrown vegetation</li>
            <li><strong>Stump grinding</strong> &mdash; Grinding all stumps below grade for a clean, level surface</li>
            <li><strong>Debris removal</strong> &mdash; All wood, brush, and debris hauled away for recycling</li>
          </ul>

          <div class="gallery-grid" style="margin:2rem 0;">
            <div class="gallery-item"><img src="images/land-clearing.jpg" alt="Land clearing project in Westchester County NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/land-clearing-2.jpg" alt="Lot clearing with heavy equipment in Northern Westchester" loading="lazy"></div>
            <div class="gallery-item"><img src="images/stump-removal-excavator-cortlandt-manor.jpg" alt="Excavator removing stumps during land clearing in Cortlandt Manor NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/land-clearing-lakefront-croton-on-hudson.jpg" alt="Lakefront land clearing project in Croton-on-Hudson NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/excavator-debris-removal-garrison-ny.jpg" alt="Excavator loading debris during land clearing in Garrison NY" loading="lazy"></div>
            <div class="gallery-item"><img src="images/firewood-processing-northern-westchester.jpg" alt="Firewood processing and wood splitting in Northern Westchester NY" loading="lazy"></div>
          </div>

          <h2>Why Choose Us for Land Clearing</h2>
          <p>Land clearing requires a combination of heavy equipment, careful planning, and attention to property boundaries, drainage, and local regulations. Our team has the experience and equipment to handle projects of all sizes efficiently, and we coordinate with your builder or contractor to ensure the cleared area meets their specifications exactly.</p>''',
        "faqs": [
            ("How much does land clearing cost?", "Costs depend on lot size, tree density, terrain, and accessibility. We provide free on-site estimates for all land clearing projects. Call (914) 391-5233."),
            ("Do I need permits for land clearing?", "Many municipalities require permits for clearing trees, especially for larger projects. We can advise you on local requirements and help with the permit process."),
            ("Can you clear land on a slope?", "Yes. Much of Northern Westchester and Putnam County features hilly terrain, and we have the equipment and experience to handle sloped properties safely."),
            ("Do you remove stumps during land clearing?", "Yes. Stump grinding is typically included in our land clearing proposals to leave the site clean and level.")
        ]
    }
]

for page in service_pages:
    faq_items, faq_schema = faq_html(page["faqs"])
    page_og_image = page.get("og_image", "images/hero-collage-background.jpg")
    page_breadcrumbs = page.get("breadcrumbs", None)
    content = header(page["title"], page["desc"], page["file"], page["hero_img"], page["h1"], page["breadcrumb"], page["active"],
                     og_image=page_og_image, breadcrumbs=page_breadcrumbs)
    howto_schema = ""
    if page.get("howto"):
        h = page["howto"]
        steps_json = ",".join([f'{{"@type":"HowToStep","name":"{s[0]}","text":"{s[1]}"}}' for s in h["steps"]])
        howto_schema = f'''
  <script type="application/ld+json">
  {{"@context":"https://schema.org","@type":"HowTo","name":"{h["name"]}","description":"{h["description"]}","step":[{steps_json}]}}
  </script>'''
    aggregate_rating_schema = f'''
  <script type="application/ld+json">
  {{"@context":"https://schema.org","@type":"Service","name":"{page["h1"].replace("&amp;", "&")}","provider":{{"@type":"LocalBusiness","name":"Second Nature Tree Service","url":"https://peekskilltree.com","telephone":"+1-914-391-5233"}},"areaServed":[{{"@type":"AdministrativeArea","name":"Westchester County, NY"}},{{"@type":"AdministrativeArea","name":"Putnam County, NY"}},{{"@type":"AdministrativeArea","name":"Dutchess County, NY"}}],"aggregateRating":{{"@type":"AggregateRating","ratingValue":"5.0","reviewCount":"70","bestRating":"5"}}}}
  </script>'''
    content += f'''
  <section class="section">
    <div class="container">
      <div class="service-layout">
        <div class="service-detail-content">
          {page["content"]}

          <h2 style="margin-top:2.5rem;">Frequently Asked Questions</h2>
          <div class="faq-list">{faq_items}
          </div>
        </div>
        {sidebar(page["active"])}
      </div>
    </div>
  </section>
  <script type="application/ld+json">{faq_schema}</script>
{howto_schema}
{aggregate_rating_schema}
'''
    content += FOOTER
    write_page(page["file"], content)
    print(f"Created {page['file']}")

# ============================================================
# CONTACT PAGE
# ============================================================
contact = header(
    "Contact Second Nature Tree Service | Free Estimates | Peekskill NY",
    "Get a free tree service estimate from Second Nature Tree Service in Peekskill, NY. Call (914) 391-5233 or fill out our online form. Serving Westchester and Putnam Counties.",
    "contact.html", None,
    "Get Your Free Tree Service Estimate",
    '<a href="index.html">Home</a> <span>&raquo;</span> Contact',
    "contact",
    breadcrumbs=[{"name": "Home", "url": ""}, {"name": "Contact", "url": "contact.html"}]
)
contact += '''
  <section class="section contact-page-section">
    <div class="container contact-page-container">

      <!-- Trust strip -->
      <div class="contact-trust-strip">
        <div class="contact-trust-item">
          <svg width="22" height="22" fill="none" stroke="var(--green-primary)" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          <div>
            <strong>Call or Text</strong>
            <a href="tel:914-391-5233">(914) 391-5233</a>
          </div>
        </div>
        <div class="contact-trust-divider"></div>
        <div class="contact-trust-item">
          <svg width="22" height="22" fill="none" stroke="var(--green-primary)" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <div>
            <strong>Response Time</strong>
            <span>Within 2 hours</span>
          </div>
        </div>
        <div class="contact-trust-divider"></div>
        <div class="contact-trust-item">
          <svg width="22" height="22" fill="none" stroke="var(--green-primary)" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
          <div>
            <strong>Licensed &amp; Insured</strong>
            <span>WC-32079 / PC-50644</span>
          </div>
        </div>
        <div class="contact-trust-divider"></div>
        <div class="contact-trust-item">
          <svg width="22" height="22" fill="none" stroke="#f5a623" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <div>
            <strong>5.0 Google Rating</strong>
            <span>70+ Reviews</span>
          </div>
        </div>
      </div>

      <!-- Form centered -->
      <div class="contact-form-centered">
        <p class="contact-form-note">Prefer to talk? Call <a href="tel:914-391-5233"><strong>(914) 391-5233</strong></a> &mdash; we answer every call.</p>
        <div class="jobber-form-wrapper">
          <iframe src="https://clienthub.getjobber.com/hubs/cae8fd74-1192-437e-a3f9-0e503f909d2e/public/requests/766492/new" width="100%" height="820" frameborder="0" title="Request a Free Estimate from Second Nature Tree Service"></iframe>
        </div>
        <p style="font-size:.78rem;color:var(--text-light);line-height:1.5;margin-top:.75rem;max-width:600px;margin-left:auto;margin-right:auto;">By submitting this form or contacting us, you consent to receive text messages from Second Nature Tree Service at the phone number provided. Message frequency varies. Message &amp; data rates may apply. Reply STOP to opt out at any time. Reply HELP for help. See our <a href="privacy-policy.html">Privacy Policy</a> and <a href="terms-of-service.html">Terms of Service</a>.</p>
      </div>

    </div>
  </section>

  <section class="section" style="padding-top:0;">
    <div class="container" style="max-width:900px;">
      <h2 style="text-align:center;margin-bottom:.75rem;">Our Service Area</h2>
      <p style="text-align:center;color:var(--text-light);margin-bottom:1.25rem;">Based in Peekskill, NY &mdash; serving Westchester, Putnam &amp; Southern Dutchess Counties</p>
      <div style="border-radius:12px;overflow:hidden;border:1px solid var(--border);box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <iframe src="https://www.google.com/maps?q=Second+Nature+Tree+Service,+Peekskill,+NY&output=embed" width="100%" height="350" style="border:0;display:block;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Second Nature Tree Service location - Peekskill NY"></iframe>
      </div>
    </div>
  </section>
''' + FOOTER

write_page("contact.html", contact)
print("Created contact.html")

# ============================================================
# SERVICES OVERVIEW PAGE
# ============================================================
services_overview = header(
    "Tree Services Peekskill NY | Full Service Tree Care | Second Nature",
    "Complete tree care services in Peekskill, NY. Tree removal, pruning, stump grinding, emergency service, land clearing, and more. Licensed, insured. (914) 391-5233.",
    "services.html", "bucket-truck.jpg",
    "Complete Tree Care Services in Peekskill, NY",
    '<a href="index.html">Home</a> <span>&raquo;</span> Services',
    ""
)
services_overview += '''
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://peekskilltree.com/"},{"@type":"ListItem","position":2,"name":"Services","item":"https://peekskilltree.com/services.html"}]}
  </script>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"ItemList","name":"Tree Care Services","itemListElement":[
    {"@type":"ListItem","position":1,"url":"https://peekskilltree.com/tree-removal.html","name":"Tree Removal"},
    {"@type":"ListItem","position":2,"url":"https://peekskilltree.com/tree-pruning.html","name":"Tree Pruning & Trimming"},
    {"@type":"ListItem","position":3,"url":"https://peekskilltree.com/stump-grinding.html","name":"Stump Grinding"},
    {"@type":"ListItem","position":4,"url":"https://peekskilltree.com/emergency-tree-service.html","name":"Emergency Tree Service"},
    {"@type":"ListItem","position":5,"url":"https://peekskilltree.com/land-clearing.html","name":"Land & Lot Clearing"}
  ]}
  </script>
  <section class="section">
    <div class="container">
      <p class="section-intro">Second Nature Tree Service provides a full range of professional tree care for homeowners and property managers throughout Westchester and Putnam Counties. Every service is backed by 10+ years of experience, full insurance coverage, and our commitment to doing the job right.</p>

      <div class="services-grid">
        <div class="service-card fade-in">
          <div class="service-card-img"><img src="images/rigging-work.jpg" alt="Tree removal service Peekskill" loading="lazy"></div>
          <div class="service-card-body">
            <h3><a href="tree-removal.html">Tree Removal</a></h3>
            <p>Safe removal of dead, hazardous, and unwanted trees of any size. Residential and commercial. Complete cleanup included.</p>
            <a href="tree-removal.html" class="learn-more">Learn More &rarr;</a>
          </div>
        </div>
        <div class="service-card fade-in">
          <div class="service-card-img"><img src="images/tall-tree-climbing-garrison-ny.jpg" alt="Tree pruning service" loading="lazy"></div>
          <div class="service-card-body">
            <h3><a href="tree-pruning.html">Tree Pruning &amp; Trimming</a></h3>
            <p>Crown thinning, deadwood removal, structural pruning, and seasonal maintenance. Keep your trees healthy, safe, and beautiful.</p>
            <a href="tree-pruning.html" class="learn-more">Learn More &rarr;</a>
          </div>
        </div>
        <div class="service-card fade-in">
          <div class="service-card-img"><img src="images/stump-grinding-service-peekskill-ny.jpg" alt="Professional stump grinding equipment in Peekskill NY" loading="lazy"></div>
          <div class="service-card-body">
            <h3><a href="stump-grinding.html">Stump Grinding</a></h3>
            <p>Eliminate stumps below grade quickly and affordably. Remove tripping hazards and reclaim your yard space.</p>
            <a href="stump-grinding.html" class="learn-more">Learn More &rarr;</a>
          </div>
        </div>
        <div class="service-card fade-in">
          <div class="service-card-img"><img src="images/storm-damage-tree-on-car-yorktown-ny.jpg" alt="Emergency tree service" loading="lazy"></div>
          <div class="service-card-body">
            <h3><a href="emergency-tree-service.html">Emergency Tree Service</a></h3>
            <p>Fast response for storm damage, fallen trees, and hazardous situations. Available when you need us most.</p>
            <a href="emergency-tree-service.html" class="learn-more">Learn More &rarr;</a>
          </div>
        </div>
        <div class="service-card fade-in">
          <div class="service-card-img"><img src="images/land-clearing.jpg" alt="Land clearing service" loading="lazy"></div>
          <div class="service-card-body">
            <h3><a href="land-clearing.html">Land &amp; Lot Clearing</a></h3>
            <p>Prepare your property for construction, landscaping, or expanded yard space. Residential and commercial projects of all sizes.</p>
            <a href="land-clearing.html" class="learn-more">Learn More &rarr;</a>
          </div>
        </div>
        <div class="service-card fade-in">
          <div class="service-card-img"><img src="images/slingshot.jpg" alt="Crane tree removal" loading="lazy"></div>
          <div class="service-card-body">
            <h3>Crane-Assisted Removal</h3>
            <p>For extremely large trees or difficult access, crane-assisted removal lifts sections safely up and away from structures. Faster and often safer than traditional methods.</p>
          </div>
        </div>
      </div>

      <div style="margin-top:3rem;">
        <h2>Additional Services</h2>
        <div class="content-split" style="margin-top:1.5rem;">
          <div>
            <h3>Tree Cabling &amp; Bracing</h3>
            <p>Support structurally weak trees with professional cabling and bracing systems. Extend the life of valuable trees with split crotches or heavy lateral branches without removal.</p>
            <h3 style="margin-top:1.5rem;">Hedge &amp; Shrub Trimming</h3>
            <p>Keep your hedges, ornamental shrubs, and border plantings looking sharp with professional trimming. We maintain clean lines and promote healthy, dense growth.</p>
          </div>
          <div>
            <h3>Tree Health Assessments</h3>
            <p>Not sure if a tree needs to come down? We provide honest, thorough assessments of tree health and structural integrity, giving you the information you need to make the right decision.</p>
            <h3 style="margin-top:1.5rem;">Brush Chipping &amp; Debris Removal</h3>
            <p>We chip brush on-site and haul away all debris as part of our standard service. Need brush cleared from your property? We handle that too.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
''' + FOOTER

write_page("services.html", services_overview)
print("Created services.html")

# ============================================================
# SERVICE AREAS PAGE
# ============================================================
areas = header(
    "Tree Service Areas | Westchester, Putnam & Dutchess | Second Nature Tree Service",
    "Second Nature Tree Service serves Westchester, Putnam, and Southern Dutchess Counties. Tree removal, pruning, and stump grinding in Peekskill, Yorktown, Beacon, Fishkill, Wappingers Falls, and more.",
    "service-areas.html", None,
    "Tree Service Areas &mdash; Westchester, Putnam &amp; Southern Dutchess",
    '<a href="index.html">Home</a> <span>&raquo;</span> Service Areas',
    ""
)
areas += '''
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://peekskilltree.com/"},{"@type":"ListItem","position":2,"name":"Service Areas","item":"https://peekskilltree.com/service-areas.html"}]}
  </script>
  <section class="section">
    <div class="container">
      <p class="section-intro">Based in Peekskill on the east side of the Hudson River, Second Nature Tree Service provides professional tree removal, pruning, stump grinding, and emergency services throughout Northern Westchester, Putnam County, and Southern Dutchess County. Select your town below to learn more about our services in your area.</p>

      <h2>Westchester County</h2>
      <div class="areas-grid" style="margin-bottom:2.5rem;">
        <a href="tree-service-peekskill-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Peekskill</a>
        <a href="tree-service-yorktown-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Yorktown / Yorktown Heights</a>
        <a href="tree-service-cortlandt-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Cortlandt Manor</a>
        <a href="tree-service-croton-on-hudson-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Croton-on-Hudson</a>
        <a href="tree-service-briarcliff-manor-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Briarcliff Manor</a>
        <a href="tree-service-chappaqua-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Chappaqua</a>
        <a href="tree-service-ossining-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Ossining</a>
        <a href="tree-service-buchanan-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Buchanan</a>
        <a href="tree-service-mount-kisco-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Mount Kisco</a>
        <a href="tree-service-bedford-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Bedford</a>
        <a href="tree-service-katonah-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Katonah</a>
        <a href="tree-service-somers-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Somers</a>
        <a href="tree-service-pleasantville-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Pleasantville</a>
        <a href="tree-service-pound-ridge-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Pound Ridge</a>
        <a href="tree-service-lewisboro-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Lewisboro</a>
        <a href="tree-service-north-salem-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> North Salem</a>
        <a href="tree-service-armonk-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Armonk</a>
        <a href="tree-service-new-castle-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> New Castle</a>
        <a href="tree-service-mohegan-lake-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Mohegan Lake</a>
        <a href="tree-service-shrub-oak-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Shrub Oak</a>
        <a href="tree-service-verplanck-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Verplanck</a>
        <a href="tree-service-mount-pleasant-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Mount Pleasant</a>
        <a href="tree-service-millwood-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Millwood</a>
        <a href="tree-service-cortlandt-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Lake Peekskill</a>
        <a href="tree-service-mount-pleasant-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Hawthorne</a>
        <a href="tree-service-mount-pleasant-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Thornwood</a>
        <a href="tree-service-ossining-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Scarborough</a>
        <a href="tree-service-lewisboro-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Cross River</a>
        <a href="tree-service-lewisboro-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> South Salem</a>
        <a href="tree-service-lewisboro-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Waccabuc</a>
        <a href="tree-service-lewisboro-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Goldens Bridge</a>
        <a href="tree-service-north-salem-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Croton Falls</a>
        <a href="tree-service-north-salem-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Purdys</a>
      </div>

      <h2>Putnam County</h2>
      <div class="areas-grid" style="margin-bottom:2.5rem;">
        <a href="tree-service-garrison-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Garrison</a>
        <a href="tree-service-cold-spring-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Cold Spring</a>
        <a href="tree-service-putnam-valley-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Putnam Valley</a>
        <a href="tree-service-mahopac-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Mahopac</a>
        <a href="tree-service-carmel-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Carmel</a>
        <a href="tree-service-brewster-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Brewster</a>
        <a href="tree-service-patterson-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Patterson</a>
        <a href="tree-service-garrison-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Philipstown</a>
        <a href="tree-service-cold-spring-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Nelsonville</a>
      </div>

      <h2>Southern Dutchess County</h2>
      <div class="areas-grid" style="margin-bottom:2.5rem;">
        <a href="tree-service-beacon-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Beacon</a>
        <a href="tree-service-fishkill-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Fishkill</a>
        <a href="tree-service-east-fishkill-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> East Fishkill</a>
        <a href="tree-service-wappingers-falls-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Wappingers Falls</a>
        <a href="tree-service-pawling-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Pawling</a>
        <a href="tree-service-dover-ny.html" class="area-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> Dover</a>
      </div>

      <p style="color:var(--text-light);">If you are in Westchester, Putnam, or Southern Dutchess County, we likely cover your area. <a href="contact.html">Contact us</a> to confirm.</p>
    </div>
  </section>
''' + FOOTER

write_page("service-areas.html", areas)
print("Created service-areas.html")

# ============================================================
# SERVICE AREA TOWN PAGES GENERATOR
# ============================================================
towns = [
    {"slug": "yorktown", "name": "Yorktown", "county": "Westchester", "img": "rigging-work.jpg",
     "intro": "Yorktown is home to some of Northern Westchester's most beautiful wooded properties. With large lots, mature hardwood canopies, and proximity to the Taconic Parkway corridor, Yorktown homeowners rely on professional tree services to keep their landscapes safe and well-maintained.",
     "issues": "Aging red oaks and sugar maples with structural decline, storm damage from nor'easters, emerald ash borer killing ash trees, overgrown lots needing selective clearing, root damage to driveways and foundations.",
     "nearby": "Cortlandt Manor, Mohegan Lake, Shrub Oak, Peekskill, Somers, Lake Peekskill"},
    {"slug": "cortlandt", "name": "Cortlandt Manor", "county": "Westchester", "img": "teamwork.jpg",
     "intro": "Cortlandt Manor offers a mix of suburban neighborhoods and heavily wooded parcels stretching from the Croton Reservoir area toward Bear Mountain. The diverse terrain and dense tree cover make professional tree service essential for property safety.",
     "issues": "Hemlock woolly adelgid devastating Eastern hemlocks, dead ash trees from emerald ash borer, storm damage in exposed areas near the Hudson, lot clearing for new construction in developing neighborhoods.",
     "nearby": "Peekskill, Buchanan, Croton-on-Hudson, Mohegan Lake, Yorktown, Verplanck"},
    {"slug": "briarcliff-manor", "name": "Briarcliff Manor", "county": "Westchester", "img": "residential-tree-removal-putnam-county.jpg",
     "intro": "Briarcliff Manor's tree-lined streets and established properties create one of Westchester's most scenic communities. The mature tree canopy that defines this village also requires ongoing professional care to keep residents and structures safe.",
     "issues": "Large shade trees overhanging homes and driveways, aging sugar maples and ash trees in decline, maintaining property aesthetics during removal, navigating village tree preservation regulations.",
     "nearby": "Ossining, Pleasantville, Chappaqua, Croton-on-Hudson, Scarborough"},
    {"slug": "chappaqua", "name": "Chappaqua", "county": "Westchester", "img": "bucket-truck.jpg",
     "intro": "Chappaqua's premium residential properties sit among towering hardwoods on generous, beautifully landscaped lots. Homeowners here invest significantly in their outdoor spaces, and maintaining that investment sometimes means addressing problem trees with professional care.",
     "issues": "Mature oaks and maples with structural defects, preserving specimen trees while removing hazards, careful work around high-value landscaping and close neighbors, managing fallen trees on steep terrain.",
     "nearby": "Mount Kisco, Bedford, Pleasantville, Armonk, Briarcliff Manor, Millwood"},
    {"slug": "garrison", "name": "Garrison", "county": "Putnam", "img": "hemlock-removal.jpg",
     "intro": "Garrison sits along the eastern bank of the Hudson River in Putnam County, where steep terrain, large wooded parcels, and limited road access create unique challenges for tree work. The Hudson Highlands landscape is stunning but demands expertise and the right equipment.",
     "issues": "Challenging hillside access for equipment, dense native hardwood forests (chestnut oak, red maple, hickory), hemlock and pine decline, storm damage on exposed ridgelines, fallen trees blocking long private driveways.",
     "nearby": "Cold Spring, Putnam Valley, Nelsonville, Philipstown, Peekskill"},
    {"slug": "croton-on-hudson", "name": "Croton-on-Hudson", "county": "Westchester", "img": "branch-pov.jpg",
     "intro": "Croton-on-Hudson's hillside neighborhoods, riverside properties, and proximity to the Metro-North rail corridor make tree care a necessity for many residents. Steep lots and mature trees near homes require professional attention to keep properties safe and scenic.",
     "issues": "Trees on steep hillsides requiring specialized rigging, large trees near the rail line, storm damage from Hudson River wind exposure, aging ornamental and shade trees in older neighborhoods.",
     "nearby": "Ossining, Cortlandt Manor, Buchanan, Briarcliff Manor"},
    {"slug": "ossining", "name": "Ossining", "county": "Westchester", "img": "donahue-job.jpg",
     "intro": "Ossining blends historic neighborhoods with newer developments across its village and town. From the downtown area near the Hudson to the inland residential streets, mature trees are a defining feature of the community and occasionally need professional service.",
     "issues": "Street trees interfering with power lines, backyard trees close to homes in older neighborhoods, storm damage cleanup, maintaining trees along the Croton Aqueduct trail corridor.",
     "nearby": "Briarcliff Manor, Croton-on-Hudson, Pleasantville, Chappaqua"},
    {"slug": "cold-spring", "name": "Cold Spring", "county": "Putnam", "img": "crane-tree-removal-bedford-ny.jpg",
     "intro": "Cold Spring's historic village and surrounding hillside properties in the Hudson Highlands present unique tree care challenges. Steep terrain, limited access, and proximity to historic structures all require an experienced crew with the right equipment.",
     "issues": "Large trees on historic properties requiring careful preservation and removal, steep terrain access challenges, crane work often needed, dense native hardwood forests, hemlock decline.",
     "nearby": "Garrison, Nelsonville, Putnam Valley, Beacon, Philipstown"},
    {"slug": "mount-kisco", "name": "Mount Kisco", "county": "Westchester", "img": "tree-rig.jpg",
     "intro": "Mount Kisco serves as a commercial and residential hub in Northern Westchester. Both the downtown area and surrounding residential neighborhoods feature mature trees that need regular professional attention for safety and aesthetics.",
     "issues": "Commercial property tree maintenance, residential shade tree pruning and removal, storm damage, managing trees near parking areas and storefronts, aging ornamental trees.",
     "nearby": "Bedford, Katonah, Chappaqua, Armonk"},
    {"slug": "somers", "name": "Somers", "county": "Westchester", "img": "land-clearing.jpg",
     "intro": "Somers' rural-suburban character features large lots with significant tree cover, horse properties, and estate-style homes set among mature woodlands. The town's natural beauty comes with the responsibility of maintaining safe, healthy trees.",
     "issues": "Land clearing for new construction on wooded lots, storm damage from nor'easters, managing large specimen trees on estate properties, clearing overgrown pastures and fence lines.",
     "nearby": "Yorktown, Katonah, North Salem, Mahopac, Baldwin Place"},
    {"slug": "buchanan", "name": "Buchanan", "county": "Westchester", "img": "bucket-truck-hudson-river-view-peekskill.jpg",
     "intro": "Buchanan is a small village along the Hudson River between Peekskill and Cortlandt Manor. Residential properties here benefit from professional tree care to manage mature shade trees and address storm damage common in this river-adjacent community.",
     "issues": "Wind exposure from the Hudson causing storm damage, aging shade trees near homes, clearing debris after weather events, stump grinding on small residential lots.",
     "nearby": "Peekskill, Cortlandt Manor, Croton-on-Hudson, Verplanck"},
    {"slug": "mahopac", "name": "Mahopac", "county": "Putnam", "img": "tree-rig.jpg",
     "intro": "Mahopac's lakeside properties and wooded residential areas in Putnam County create a beautiful setting that requires ongoing tree maintenance. Lake Mahopac homes, hillside properties, and large wooded lots all benefit from professional tree services.",
     "issues": "Trees overhanging lakefront properties, pine and oak forests on large residential lots, storm damage, land clearing for new construction, managing trees near docks and waterfront structures.",
     "nearby": "Carmel, Somers, Putnam Valley, Lake Mahopac, Baldwin Place"},
    {"slug": "katonah", "name": "Katonah", "county": "Westchester", "img": "tree-pruning-climber-peekskill-ny.jpg",
     "intro": "Katonah's historic hamlet and surrounding estate properties feature some of Northern Westchester's most impressive mature trees. Preserving these valuable specimens while addressing safety concerns requires experienced, careful tree care.",
     "issues": "Mature specimen trees requiring expert pruning, estate property tree management, storm damage on large lots, protecting historic structures during removal work, managing aging ornamental plantings.",
     "nearby": "Bedford, Mount Kisco, Somers, Cross River, South Salem"},
    {"slug": "pleasantville", "name": "Pleasantville", "county": "Westchester", "img": "bucket-truck.jpg",
     "intro": "Pleasantville's village setting features tight residential lots where trees grow close to homes, driveways, and neighboring properties. Professional tree work here requires precision, careful rigging, and respect for tight spaces.",
     "issues": "Trees growing too close to structures, tight access requiring compact equipment, managing shade tree canopy over driveways, pruning for power line clearance, removing aging street trees.",
     "nearby": "Chappaqua, Briarcliff Manor, Thornwood, Mount Pleasant, Hawthorne"},
    {"slug": "bedford", "name": "Bedford", "county": "Westchester", "img": "log-removal-grapple-equipment-bedford-ny.jpg",
     "intro": "Bedford's large estate properties, horse farms, and historic Bedford Village feature some of the finest mature trees in Westchester County. Maintaining these properties requires experienced tree care that balances preservation with safety.",
     "issues": "Managing large specimen trees on multi-acre estates, horse farm fence line clearing, storm damage on exposed properties, preserving historic trees while removing hazards, land clearing for estate improvements.",
     "nearby": "Katonah, Mount Kisco, Pound Ridge, Armonk, Cross River"},
    {"slug": "putnam-valley", "name": "Putnam Valley", "county": "Putnam", "img": "land-clearing.jpg",
     "intro": "Putnam Valley's rural, heavily wooded landscape features some of the most challenging terrain in our service area. Large parcels, steep hillsides, lake communities, and limited road access all demand experienced tree professionals with the right equipment.",
     "issues": "Difficult terrain requiring specialized equipment, dense forest management, storm damage on exposed hilltops, land clearing for new construction, managing trees around lake community properties.",
     "nearby": "Mahopac, Garrison, Cortlandt Manor, Lake Peekskill, Oscawana Lake"},
    {"slug": "pound-ridge", "name": "Pound Ridge", "county": "Westchester", "img": "residential-tree-removal-putnam-county.jpg",
     "intro": "Pound Ridge is one of Westchester County's most affluent and heavily wooded communities. With the lowest population density in the county, properties here feature large wooded lots, long private driveways through mature forest, and estate-level landscaping that demands professional tree care.",
     "issues": "Mature hardwoods on large estate lots, storm damage on exposed hilltop properties, managing trees along long private driveways, preserving specimen trees during selective removal, land clearing for property improvements on multi-acre parcels.",
     "nearby": "Lewisboro, North Salem, Bedford, Cross River, South Salem"},
    {"slug": "lewisboro", "name": "Lewisboro", "county": "Westchester", "img": "tree-work-hudson-valley-hillside.jpg",
     "intro": "Lewisboro's six hamlets &mdash; Goldens Bridge, Cross River, Waccabuc, South Salem, Lewisboro, and Vista &mdash; are spread across a heavily forested landscape in northeastern Westchester. With roughly 65 percent of its land still undeveloped, Lewisboro homeowners regularly need professional tree services to maintain safe, beautiful properties.",
     "issues": "Dense woodland management on large residential parcels, storm damage from nor'easters, aging hardwood trees threatening structures, managing trees near the Cross River Reservoir, clearing overgrown lots and fence lines.",
     "nearby": "Pound Ridge, North Salem, Katonah, South Salem, Cross River, Waccabuc"},
    {"slug": "north-salem", "name": "North Salem", "county": "Westchester", "img": "crane-tree-removal-bedford-ny.jpg",
     "intro": "North Salem is the northernmost town in Westchester County, known for its premier equestrian estates, large wooded parcels, and rural character. Properties here often measure in tens of acres with dense native hardwood forests that require professional management for safety and aesthetics.",
     "issues": "Managing large trees on estate and horse farm properties, clearing fence lines and pasture borders, storm damage on rural roads and long driveways, preserving mature specimen trees while removing hazards, land clearing for property improvements.",
     "nearby": "Somers, Katonah, Lewisboro, Purdys, Croton Falls"},
    {"slug": "armonk", "name": "Armonk", "county": "Westchester", "img": "community-tree-service-armonk-ny.jpg",
     "intro": "Armonk, located in the Town of North Castle, is one of Northern Westchester's most desirable communities. Home to IBM's world headquarters, Armonk features large residential properties with mature tree canopies and the kind of meticulous landscaping that requires expert tree care when problems arise.",
     "issues": "Mature shade trees over high-value homes, careful removal near premium landscaping, storm damage requiring fast response, managing tree canopy on large residential lots, pruning for property aesthetics and safety.",
     "nearby": "Mount Kisco, Chappaqua, Bedford, Pleasantville, Banksville"},
    {"slug": "new-castle", "name": "New Castle", "county": "Westchester", "img": "tree-dismantling-residential-chappaqua.jpg",
     "intro": "The Town of New Castle encompasses Chappaqua, Millwood, and surrounding areas, making it one of the wealthiest municipalities in Westchester County. Large-lot zoning, estate-style properties, and dense mature tree cover define this community, creating ongoing demand for professional tree services.",
     "issues": "Large mature hardwoods near high-value homes, storm damage on wooded estate lots, managing trees near driveways and pools, navigating local tree preservation regulations, pruning for safety and aesthetics on premium properties.",
     "nearby": "Chappaqua, Millwood, Mount Kisco, Pleasantville, Briarcliff Manor, Ossining"},
    {"slug": "peekskill", "name": "Peekskill", "county": "Westchester", "img": "bucket-truck-hudson-river-view-peekskill.jpg",
     "intro": "Peekskill is home base for Second Nature Tree Service. This historic city on the Hudson River blends revitalized downtown neighborhoods with wooded hillside properties, waterfront lots, and older residential streets lined with mature shade trees. We know every neighborhood in Peekskill and respond fast because we are right here.",
     "issues": "Aging street trees near power lines, storm damage from Hudson River wind exposure, dead ash trees from emerald ash borer, large shade trees close to homes on tight city lots, hillside trees with root instability.",
     "nearby": "Cortlandt Manor, Buchanan, Yorktown, Mohegan Lake, Verplanck, Lake Peekskill"},
    {"slug": "mohegan-lake", "name": "Mohegan Lake", "county": "Westchester", "img": "large-oak-removal-yorktown-ny.jpg",
     "intro": "Mohegan Lake is a hamlet straddling the Yorktown and Cortlandt border, centered around its namesake lake. Wooded residential properties, lakefront homes, and proximity to the Taconic Parkway corridor mean homeowners here regularly need professional tree care.",
     "issues": "Trees overhanging lakefront properties, large oaks and maples on residential lots, storm damage cleanup, managing shade canopy near homes, dead or dying ash trees requiring removal.",
     "nearby": "Yorktown, Cortlandt Manor, Shrub Oak, Peekskill, Lake Peekskill"},
    {"slug": "shrub-oak", "name": "Shrub Oak", "county": "Westchester", "img": "tree-service-crew-northern-westchester.jpg",
     "intro": "Shrub Oak is a quiet hamlet in the Town of Yorktown with a mix of established neighborhoods and newer developments surrounded by mature woodlands. Properties here feature large shade trees and wooded backyards that benefit from regular professional tree maintenance.",
     "issues": "Overgrown backyard trees near structures, storm damage from nor'easters, dead standing trees in wooded lots, root damage to driveways and walkways, managing tree canopy for sunlight.",
     "nearby": "Yorktown, Mohegan Lake, Cortlandt Manor, Somers, Lake Peekskill"},
    {"slug": "verplanck", "name": "Verplanck", "county": "Westchester", "img": "tree-work-hudson-valley-hillside.jpg",
     "intro": "Verplanck is a small Hudson River hamlet in the Town of Cortlandt, known for its waterfront character and close-knit community. Residential properties near the river are exposed to strong winds and weather that take a toll on local trees.",
     "issues": "Wind-exposed trees along the Hudson River, storm damage from coastal weather, aging shade trees on small residential lots, dead tree removal near homes and roads, stump grinding in tight spaces.",
     "nearby": "Peekskill, Buchanan, Cortlandt Manor, Croton-on-Hudson"},
    {"slug": "mount-pleasant", "name": "Mount Pleasant", "county": "Westchester", "img": "bucket-truck-tree-removal-westchester.jpg",
     "intro": "The Town of Mount Pleasant encompasses the hamlets of Thornwood, Hawthorne, and Valhalla in central Westchester. With a mix of established residential neighborhoods, commercial areas, and wooded parcels, Mount Pleasant homeowners rely on professional tree services to keep properties safe and well-maintained.",
     "issues": "Mature shade trees overhanging homes and driveways, storm damage in older neighborhoods, managing trees near commercial properties, aging ornamental trees, dead wood removal for safety.",
     "nearby": "Pleasantville, Briarcliff Manor, Chappaqua, Ossining, Thornwood, Hawthorne, Valhalla"},
    {"slug": "millwood", "name": "Millwood", "county": "Westchester", "img": "careful-tree-rigging-near-roof-westchester.jpg",
     "intro": "Millwood is a hamlet in the Town of New Castle nestled among wooded hills and the New Croton Reservoir. Properties here feature large lots with dense tree cover and the kind of mature canopy that occasionally requires professional attention for safety and property protection.",
     "issues": "Large trees on wooded residential lots, proximity to the New Croton Reservoir and protected watershed areas, storm damage on hilly terrain, managing trees near driveways and structures, selective clearing for views and sunlight.",
     "nearby": "Chappaqua, New Castle, Ossining, Briarcliff Manor, Mount Kisco"},
    {"slug": "carmel", "name": "Carmel", "county": "Putnam", "img": "aerial-tree-climber-chainsaw-putnam-county.jpg",
     "intro": "Carmel is the county seat of Putnam County, with residential neighborhoods surrounding Lake Gleneida and stretching into the wooded hills of the Hudson Highlands. The combination of lakefront properties, suburban streets, and rural wooded parcels creates diverse tree care needs.",
     "issues": "Trees overhanging lakefront properties, large oaks and pines on residential lots, storm damage on exposed hilltops, land clearing for new construction, managing trees near municipal buildings and roadways.",
     "nearby": "Mahopac, Brewster, Patterson, Putnam Valley, Lake Carmel"},
    {"slug": "brewster", "name": "Brewster", "county": "Putnam", "img": "firewood-processing-northern-westchester.jpg",
     "intro": "Brewster sits in eastern Putnam County along the Metro-North Harlem Line, with a walkable village center surrounded by wooded residential neighborhoods. Properties range from compact village lots to larger wooded parcels on the outskirts, all benefiting from professional tree care.",
     "issues": "Trees near the Metro-North rail corridor, storm damage cleanup, aging shade trees in older village neighborhoods, managing trees on sloped terrain, dead ash and hemlock removal.",
     "nearby": "Patterson, Carmel, North Salem, Croton Falls, Southeast"},
    {"slug": "patterson", "name": "Patterson", "county": "Putnam", "img": "professional-tree-climber-rigging-westchester.jpg",
     "intro": "Patterson is a rural community in eastern Putnam County known for its large wooded lots, horse properties, and quiet country roads. The heavily forested landscape provides privacy and beauty but also creates ongoing demand for professional tree maintenance and removal.",
     "issues": "Dense woodland management on large residential parcels, storm damage on rural roads and long driveways, managing trees near horse paddocks and fence lines, land clearing for property improvements, dead standing trees in wooded lots.",
     "nearby": "Brewster, Carmel, North Salem, Putnam Valley"},
    # ── Southern Dutchess County ──────────────────────────────────────────
    {"slug": "beacon", "name": "Beacon", "county": "Dutchess", "img": "bucket-truck-hudson-river-view-peekskill.jpg",
     "intro": "Beacon is a vibrant Hudson River city in southern Dutchess County, home to a thriving arts community, historic neighborhoods, and wooded hillside properties rising toward Mount Beacon. From dense residential blocks downtown to large lots on the slopes above, Beacon homeowners regularly call on professional tree services to keep properties safe and beautiful.",
     "issues": "Steep hillside terrain requiring specialized equipment, Hudson River wind exposure causing storm damage, mature trees close to historic homes and storefronts, dead ash and hemlock removal, trees near utility lines in older neighborhoods.",
     "nearby": "Fishkill, Cold Spring, Garrison, Philipstown, Newburgh"},
    {"slug": "fishkill", "name": "Fishkill", "county": "Dutchess", "img": "tree-service-crew-northern-westchester.jpg",
     "intro": "Fishkill is a fast-growing community in southern Dutchess County at the crossroads of Routes 9 and 84. A mix of established residential neighborhoods, newer subdivisions, and remaining wooded parcels creates strong demand for professional tree removal, pruning, and land clearing.",
     "issues": "Tree management in new and established subdivisions, land clearing for residential development, storm damage from Hudson Valley nor'easters, large oaks and maples on residential lots, dead standing trees in wooded back yards.",
     "nearby": "Beacon, East Fishkill, Wappingers Falls, Putnam Valley, Carmel"},
    {"slug": "east-fishkill", "name": "East Fishkill", "county": "Dutchess", "img": "land-clearing.jpg",
     "intro": "East Fishkill is a large, predominantly rural town in southern Dutchess County with a mix of country estates, horse properties, and wooded residential developments. Large lots, dense native hardwood forests, and hilly terrain make professional tree care an essential service for homeowners throughout the area.",
     "issues": "Dense woodland management on large rural parcels, land clearing for new construction and property improvements, storm damage on rural roads and long private driveways, managing trees near horse paddocks and outbuildings, large specimen trees on estate properties.",
     "nearby": "Fishkill, Wappingers Falls, Lagrange, Pawling, Carmel"},
    {"slug": "wappingers-falls", "name": "Wappingers Falls", "county": "Dutchess", "img": "bucket-truck-tree-removal-westchester.jpg",
     "intro": "Wappingers Falls and the surrounding Town of Wappinger make up one of southern Dutchess County's most populous communities. A wide range of residential properties &mdash; from compact village lots to larger suburban parcels &mdash; creates steady demand for tree removal, pruning, and stump grinding.",
     "issues": "Trees too close to homes on tighter residential lots, storm damage cleanup, aging street trees and ornamentals, stump grinding after removal, managing tree canopy near driveways and fences, dead ash tree removal.",
     "nearby": "Fishkill, East Fishkill, Beacon, Poughkeepsie, LaGrangeville"},
    {"slug": "pawling", "name": "Pawling", "county": "Dutchess", "img": "residential-tree-removal-putnam-county.jpg",
     "intro": "Pawling sits in the eastern corner of Dutchess County near the Connecticut border, known for its charming village, large horse and estate properties, and heavily wooded landscape. The rural character of the area creates ongoing demand for land management, hazardous tree removal, and storm cleanup.",
     "issues": "Dense woodland management on large rural and estate parcels, clearing fence lines and pasture borders on horse properties, storm damage on exposed ridgelines, large hardwoods near barns and outbuildings, managing trees along long private driveways.",
     "nearby": "Dover, Patterson, Brewster, East Fishkill, Southeast"},
    {"slug": "dover", "name": "Dover", "county": "Dutchess", "img": "land-clearing-2.jpg",
     "intro": "Dover is a rural town in southeastern Dutchess County, bordering Connecticut to the east and Pawling to the south. Open farm fields, wooded hillsides, and country estates define the landscape. Homeowners here rely on professional tree services to manage large wooded parcels and respond to storm damage on rural properties.",
     "issues": "Large wooded parcels requiring selective clearing and management, storm damage on exposed rural properties, managing trees near farm buildings and fences, land clearing for construction and landscaping improvements, overgrown brush and tree lines on long-unused parcels.",
     "nearby": "Pawling, Amenia, Patterson, Millbrook, Wingdale"},
]

for town in towns:
    t_faqs = [
        (f"How much does tree removal cost in {town['name']}, NY?",
         f"Tree removal costs in {town['name']} depend on tree size, location, access, and complexity. We provide free on-site estimates for accurate pricing. Call (914) 391-5233 to schedule."),
        (f"Do you offer free estimates in {town['name']}?",
         f"Yes, we provide free, no-obligation estimates for all tree services in {town['name']} and surrounding communities. Call (914) 391-5233 or fill out our online form."),
        (f"What tree services do you provide in {town['name']}?",
         f"We offer tree removal, pruning and trimming, stump grinding, emergency tree service, land clearing, crane-assisted removal, cabling and bracing, and hedge trimming in {town['name']}, NY."),
    ]
    faq_items, faq_schema = faq_html(t_faqs)

    slug = town["slug"]
    filename = f"tree-service-{slug}-ny.html"
    town_breadcrumbs = [
        {"name": "Home", "url": ""},
        {"name": "Service Areas", "url": "service-areas.html"},
        {"name": f"Tree Service {town['name']} NY", "url": filename}
    ]
    t = header(
        f"Tree Service {town['name']} NY | Tree Removal & Pruning | Second Nature",
        f"Professional tree removal, pruning, and stump grinding in {town['name']}, NY. Licensed, insured, free estimates. Serving {town['county']} County. Call (914) 391-5233.",
        filename, town["img"],
        f"Professional Tree Service in {town['name']}, NY",
        f'<a href="index.html">Home</a> <span>&raquo;</span> <a href="service-areas.html">Service Areas</a> <span>&raquo;</span> {town["name"]}',
        "",
        og_image=f"images/{town['img']}",
        breadcrumbs=town_breadcrumbs
    )
    town_schema = f'''
  <script type="application/ld+json">
  {{"@context":"https://schema.org","@type":"LocalBusiness","name":"Second Nature Tree Service","url":"https://peekskilltree.com/tree-service-{town["slug"]}-ny.html","telephone":"+1-914-391-5233","priceRange":"$$","description":"Professional tree service in {town["name"]}, {town["county"]} County NY. Tree removal, pruning, stump grinding. Licensed and insured.","address":{{"@type":"PostalAddress","addressLocality":"{town["name"]}","addressRegion":"NY","addressCountry":"US"}},"areaServed":{{"@type":"City","name":"{town["name"]}"}},"openingHoursSpecification":[{{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"07:00","closes":"18:00"}},{{"@type":"OpeningHoursSpecification","dayOfWeek":"Saturday","opens":"08:00","closes":"14:00"}}],"aggregateRating":{{"@type":"AggregateRating","ratingValue":"5.0","reviewCount":"70","bestRating":"5"}}}}
  </script>'''
    t += f'''
  <section class="section">
    <div class="container">
      <div class="service-layout">
        <div class="service-detail-content">
          <h2>Tree Care Services in {town["name"]}, NY</h2>
          <p>{town["intro"]}</p>

          <h2>Common Tree Issues in {town["name"]}</h2>
          <p>{town["issues"]}</p>

          <h2>Services Available in {town["name"]}</h2>
          <ul class="check-list">
            <li><a href="tree-removal.html"><strong>Tree Removal</strong></a> &mdash; Safe removal of hazardous, dead, and unwanted trees</li>
            <li><a href="tree-pruning.html"><strong>Tree Pruning &amp; Trimming</strong></a> &mdash; Crown thinning, deadwood removal, structural pruning</li>
            <li><a href="stump-grinding.html"><strong>Stump Grinding</strong></a> &mdash; Remove stumps below grade for clean, usable yard space</li>
            <li><a href="emergency-tree-service.html"><strong>Emergency Tree Service</strong></a> &mdash; Fast response for storm damage and fallen trees</li>
            <li><a href="land-clearing.html"><strong>Land &amp; Lot Clearing</strong></a> &mdash; Site preparation for construction and landscaping</li>
            <li><strong>Crane-Assisted Removal</strong> &mdash; For large trees and difficult access situations</li>
            <li><strong>Cabling &amp; Bracing</strong> &mdash; Support for structurally compromised trees</li>
          </ul>

          <h2>Also Serving Nearby Communities</h2>
          <p>In addition to {town["name"]}, we provide tree services in {town["nearby"]} and surrounding areas throughout {town["county"]} County.</p>

          <h2>Frequently Asked Questions</h2>
          <div class="faq-list">{faq_items}
          </div>
        </div>
        {sidebar("")}
      </div>
    </div>
  </section>
  <script type="application/ld+json">{faq_schema}</script>
{town_schema}
'''
    t += FOOTER
    write_page(filename, t)
    print(f"Created {filename}")

# ============================================================
# OUR WORK - BEFORE/AFTER GALLERY PAGE
# ============================================================
our_work = header(
    "Our Work | Tree Removal & Pruning Projects | Second Nature Tree Service",
    "See real tree removal, pruning, and stump grinding projects completed by Second Nature Tree Service in Westchester and Putnam Counties, NY. Licensed, insured. Free estimates.",
    "our-work.html", "tree-service-hudson-valley-panoramic.jpg",
    "Our Work &mdash; Recent Projects",
    '<a href="index.html">Home</a> <span>&raquo;</span> Our Work',
    ""
)

gallery_projects = [
    ("crane-tree-removal-bedford-ny.jpg",    "Crane-Assisted Removal",     "Bedford, NY",      "Large oak required crane rigging due to proximity to the home. Removed safely without damage to the roof or landscaping."),
    ("careful-tree-rigging-near-roof-westchester.jpg", "Tree Rigging Near Structure", "Westchester County", "Tight-access removal next to the roofline. Controlled piece-by-piece lowering to protect the property."),
    ("dead-tree-removal-bucket-truck-lewisboro.jpg", "Dead Tree Removal",  "Lewisboro, NY",    "Standing dead oak removed using a bucket truck. Stump ground below grade and area cleaned up same day."),
    ("stump-removal-excavator-cortlandt-manor.jpg", "Stump Removal",       "Cortlandt Manor, NY", "Multiple stumps excavated and hauled off after a lot-clearing project to prep for landscaping."),
    ("emergency-tree-removal-peekskill.jpg", "Emergency Removal",          "Peekskill, NY",    "Storm-toppled tree across a driveway. Responded same morning, cleared access and removed the full tree."),
    ("land-clearing-lakefront-croton-on-hudson.jpg", "Lakefront Lot Clearing", "Croton-on-Hudson, NY", "Overgrown tree line cleared along the waterfront to open views and prepare for deck construction."),
    ("tree-dismantling-residential-chappaqua.jpg", "Residential Dismantling", "Chappaqua, NY", "Large silver maple near a garage taken down in sections. Complete log removal and stump grinding included."),
    ("aerial-tree-climber-chainsaw-putnam-county.jpg", "Aerial Climbing Work", "Putnam County, NY", "Climbing crew handles high-elevation removals where equipment access is limited."),
    ("excavator-debris-removal-garrison-ny.jpg", "Debris &amp; Log Removal", "Garrison, NY",   "Post-clearing cleanup using excavator to remove heavy logs and root balls from a sloped property."),
    ("large-oak-removal-yorktown-ny.jpg",    "Large Oak Removal",          "Yorktown, NY",     "Towering oak removed near a pool and fence line. Careful sectioning ensured no damage to adjacent structures."),
    ("tree-removal-lakefront-property-croton.jpg", "Lakefront Tree Removal", "Croton, NY",     "Hazardous tree over the waterline removed. Debris cleared from the water and property fully restored."),
    ("community-tree-service-armonk-ny.jpg", "Neighborhood Cleanup",       "Armonk, NY",       "Multiple trees and brush cleared along a residential street. Worked around utilities and neighboring yards."),
]

gallery_items = ""
for img, title, location, desc in gallery_projects:
    gallery_items += f'''
        <div class="project-card fade-in">
          <div class="project-img">
            <img src="images/{img}" alt="{title} - {location}" loading="lazy" width="600" height="400">
          </div>
          <div class="project-body">
            <div class="project-location">&#128205; {location}</div>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        </div>'''

our_work += '''
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://peekskilltree.com/"},{"@type":"ListItem","position":2,"name":"Our Work","item":"https://peekskilltree.com/our-work.html"}]}
  </script>
'''
our_work += f'''
  <section class="section">
    <div class="container">
      <p class="section-intro">Every job is different. Here is a look at real projects we have completed for homeowners across Westchester and Putnam Counties &mdash; from tight-access removals near structures to large lot clearings and emergency storm response.</p>

      <div class="project-grid">
        {gallery_items}
      </div>

      <div style="text-align:center;margin-top:3rem;padding:2.5rem;background:var(--bg-light);border-radius:12px;">
        <h2>Ready for Your Own Project?</h2>
        <p style="color:var(--text-light);max-width:520px;margin:.75rem auto 1.5rem;">We provide free on-site estimates for any tree service job in Westchester or Putnam County. We respond within 2 hours during business hours.</p>
        <div class="cta-btns" style="justify-content:center;">
          <a href="contact.html" class="btn btn-primary btn-lg">Get Your Free Estimate</a>
          <a href="tel:914-391-5233" class="btn btn-secondary btn-lg">&#9742; (914) 391-5233</a>
        </div>
      </div>
    </div>
  </section>
''' + FOOTER

write_page("our-work.html", our_work)
print("Created our-work.html")

# ============================================================
# SUBCONTRACTOR RATES PAGE
# ============================================================
sub_page = header(
    "Job Cost Estimator | Second Nature Tree Service NY",
    "Job cost estimator for tree service operations. Calculate labor, equipment, insurance, and overhead costs for any tree job. Call (914) 391-5233.",
    "rates.html", None,
    "Job Cost Estimator",
    '<a href="index.html">Home</a> <span>&raquo;</span> Job Cost Estimator',
    "",
    breadcrumbs=[{"name": "Home", "url": ""}, {"name": "Job Cost Estimator", "url": "rates.html"}]
)
sub_page = sub_page.replace(
    '<meta name="robots" content="index, follow, max-image-preview:large">',
    '<meta name="robots" content="noindex, nofollow">'
)
sub_page += '''
  <style>
    .top-bar {display:none !important;}
    .page-hero {padding:1rem 0 .5rem !important;min-height:0 !important;background:var(--green-dark) !important;}
    .page-hero-content h1 {font-size:1.2rem !important;margin-bottom:0 !important;}
    .breadcrumb {display:none !important;}
    .section {padding-top:.75rem !important;padding-bottom:1rem !important;}
    @media(max-width:600px){
      .page-hero {padding:.6rem 0 .3rem !important;}
      .page-hero-content h1 {font-size:1.05rem !important;}
      .site-header .header-inner {padding-top:.3rem;padding-bottom:.3rem;}
    }
  </style>
  <section class="section">
    <div class="container" style="max-width:900px;">

      <!-- Calculator Nav (top) -->
      <div style="display:flex;gap:0;background:var(--bg-light);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1rem;">
        <a href="rates.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:700;text-decoration:none;color:var(--white);background:var(--green-dark);">Rates</a>
        <a href="estimate.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Field Estimate</a>
        <a href="breakeven.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Break-Even</a>
        <a href="roi.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Ad ROI</a>
      </div>

      <div id="calc-wrap" style="background:var(--bg-light);border-radius:12px;padding:1.75rem 2rem;border:1px solid var(--border);">

        <!-- Job Type Presets -->
        <div style="margin-bottom:1.25rem;">
          <div style="font-weight:700;margin-bottom:.6rem;">Quick Select</div>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem;" id="preset-btns">
            <button class="preset-btn" onclick="setPreset('removal')" style="padding:.4rem .9rem;border-radius:8px;border:1px solid var(--border);background:var(--white);cursor:pointer;font-size:.85rem;white-space:nowrap;">&#127795; Tree Removal</button>
            <button class="preset-btn" onclick="setPreset('pruning')" style="padding:.4rem .9rem;border-radius:8px;border:1px solid var(--border);background:var(--white);cursor:pointer;font-size:.85rem;white-space:nowrap;">&#9986; Pruning</button>
            <button class="preset-btn" onclick="setPreset('clearing')" style="padding:.4rem .9rem;border-radius:8px;border:1px solid var(--border);background:var(--white);cursor:pointer;font-size:.85rem;white-space:nowrap;">&#127806; Land Clearing</button>
            <button class="preset-btn" onclick="setPreset('bucket')" style="padding:.4rem .9rem;border-radius:8px;border:1px solid var(--border);background:var(--white);cursor:pointer;font-size:.85rem;white-space:nowrap;">&#128678; Bucket Job</button>
            <button class="preset-btn" onclick="setPreset('custom')" style="padding:.4rem .9rem;border-radius:8px;border:1px solid var(--border);background:var(--white);cursor:pointer;font-size:.85rem;white-space:nowrap;">&#9881; Custom</button>
          </div>
        </div>

        <!-- Rate Tier -->
        <div style="margin-bottom:1.25rem;">
          <div style="font-weight:700;margin-bottom:.6rem;">Rate Tier</div>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem;" id="tier-btns">
            <button class="tier-btn active-tier" data-tier="standard" onclick="setTier('standard')" style="padding:.4rem .9rem;border-radius:8px;border:2px solid var(--green-dark);background:var(--green-dark);color:var(--white);cursor:pointer;font-size:.85rem;font-weight:600;">Standard</button>
            <button class="tier-btn" data-tier="preferred" onclick="setTier('preferred')" style="padding:.4rem .9rem;border-radius:8px;border:2px solid var(--border);background:var(--white);cursor:pointer;font-size:.85rem;">Preferred <span style="font-size:.75rem;opacity:.7;">(-15%)</span></button>
            <button class="tier-btn" data-tier="coop" onclick="setTier('coop')" style="padding:.4rem .9rem;border-radius:8px;border:2px solid var(--border);background:var(--white);cursor:pointer;font-size:.85rem;">Co-op Member <span style="font-size:.75rem;opacity:.7;">(-25%)</span></button>
          </div>
          <p id="tier-desc" style="font-size:.8rem;color:var(--text-light);margin-top:.4rem;">Full rates &mdash; any company, no existing relationship. <a href="#industry-rates" style="color:var(--green-dark);font-weight:600;">Industry rate sources &rarr;</a></p>
        </div>

        <!-- Duration row -->
        <div style="margin-bottom:1.25rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem;flex-wrap:wrap;gap:.5rem;">
            <span style="font-weight:700;">Duration</span>
            <label style="display:flex;align-items:center;gap:.4rem;cursor:pointer;font-size:.88rem;background:#c0392b;color:white;padding:.3rem .7rem;border-radius:6px;font-weight:600;" id="emergency-label">
              <input type="checkbox" id="chk-emergency" onchange="calcUpdate()" style="width:16px;height:16px;margin:0;">
              <span>&#9889; Emergency / Storm</span>
            </label>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:.6rem;" id="dur-btns">
            <button class="dur-btn" data-val="4"  onclick="setDur(4)"  style="padding:.45rem 1.1rem;border-radius:8px;border:2px solid var(--border);background:var(--white);cursor:pointer;font-size:.95rem;">Half Day (4 hr)</button>
            <button class="dur-btn active-dur" data-val="8" onclick="setDur(8)"  style="padding:.45rem 1.1rem;border-radius:8px;border:2px solid var(--green-dark);background:var(--green-dark);color:var(--white);cursor:pointer;font-size:.95rem;font-weight:600;">Full Day (8 hr)</button>
            <span style="display:flex;align-items:center;gap:.4rem;">
              <button class="dur-btn" data-val="custom" onclick="setDur('custom')" style="padding:.45rem 1.1rem;border-radius:8px;border:2px solid var(--border);background:var(--white);cursor:pointer;font-size:.95rem;">Custom</button>
              <input type="number" id="custom-hrs" min="1" max="16" value="6"
                style="width:62px;padding:.4rem .5rem;border:2px solid var(--border);border-radius:8px;font-size:.95rem;display:none;"
                oninput="calcUpdate()">
              <span id="custom-hr-label" style="font-size:.9rem;color:var(--text-light);display:none;">hrs</span>
            </span>
          </div>
        </div>

        <!-- Labor -->
        <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1rem;">
          <div onclick="toggleSection('sec-labor',this)" style="background:var(--green-dark);color:var(--white);padding:.6rem 1rem;font-weight:700;font-size:.88rem;text-transform:uppercase;letter-spacing:.07em;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"><span>Labor</span><span class="sec-arrow" style="font-size:.7rem;">&#9660;</span></div>
          <div id="sec-labor">

          <div class="calc-row" style="padding:.7rem 1rem;">
            <label class="calc-label">
              <input type="checkbox" id="chk-climber" checked onchange="calcUpdate()">
              <span>Climber</span>
            </label>
            <span class="calc-price" id="pr-climber">$600</span>
          </div>

          <div class="calc-row" style="padding:.7rem 1rem;align-items:center;">
            <div class="calc-label" style="align-items:center;">
              <span style="margin-right:.6rem;">Groundspeople</span>
              <div style="display:flex;align-items:center;gap:.3rem;">
                <button onclick="adjGround(-1)" class="calc-adj-btn">&#8722;</button>
                <span id="ground-ct" style="min-width:22px;text-align:center;font-weight:700;">2</span>
                <button onclick="adjGround(1)"  class="calc-adj-btn">&#43;</button>
              </div>
            </div>
            <span class="calc-price" id="pr-ground">$640</span>
          </div>
          </div>
        </div>

        <!-- Equipment -->
        <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1.75rem;">
          <div onclick="toggleSection('sec-equip',this)" style="background:#4a7c59;color:var(--white);padding:.6rem 1rem;font-weight:700;font-size:.88rem;text-transform:uppercase;letter-spacing:.07em;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"><span>Equipment</span><span class="sec-arrow" style="font-size:.7rem;">&#9660;</span></div>
          <div id="sec-equip">

          <div class="calc-row" style="padding:.7rem 1rem;">
            <label class="calc-label">
              <input type="checkbox" id="chk-chipper" checked onchange="calcUpdate()">
              <span>Brush Bandit Chipper</span>
            </label>
            <span class="calc-price" id="pr-chipper">$350</span>
          </div>

          <div class="calc-row" style="padding:.7rem 1rem;">
            <label class="calc-label">
              <input type="checkbox" id="chk-chiptruck" onchange="calcUpdate()">
              <span>Chip Truck</span>
            </label>
            <span class="calc-price" id="pr-chiptruck" style="color:var(--text-light);">&mdash;</span>
          </div>

          <div class="calc-row" style="padding:.7rem 1rem;">
            <label class="calc-label">
              <input type="checkbox" id="chk-bucket" onchange="onBucketChange()">
              <span>75ft Bucket Truck</span>
            </label>
            <span class="calc-price" id="pr-bucket" style="color:var(--text-light);">&mdash;</span>
          </div>

          <div class="calc-row" style="padding:.55rem 1rem .55rem 2.25rem;background:rgba(0,0,0,.02);">
            <label class="calc-label" style="color:var(--text-light);">
              <input type="checkbox" id="chk-operator" onchange="calcUpdate()" disabled style="opacity:.45;">
              <span style="font-size:.9rem;">Operator <span style="font-size:.8rem;opacity:.75;">(req. w/ Bucket)</span></span>
            </label>
            <span class="calc-price" id="pr-operator" style="color:var(--text-light);">&mdash;</span>
          </div>

          <div class="calc-row" style="padding:.7rem 1rem;">
            <label class="calc-label">
              <input type="checkbox" id="chk-loader" onchange="onLoaderChange()">
              <span>Giant Loader</span>
            </label>
            <span class="calc-price" id="pr-loader" style="color:var(--text-light);">&mdash;</span>
          </div>

          <div class="calc-row" style="padding:.55rem 1rem .55rem 2.25rem;background:rgba(0,0,0,.02);">
            <label class="calc-label" style="color:var(--text-light);">
              <input type="checkbox" id="chk-trailer" onchange="calcUpdate()" disabled style="opacity:.45;">
              <span style="font-size:.9rem;">Trailer <span style="font-size:.8rem;opacity:.75;">(req. w/ Loader)</span></span>
            </label>
            <span class="calc-price" id="pr-trailer" style="color:var(--text-light);">&mdash;</span>
          </div>

          <div class="calc-row" style="padding:.7rem 1rem;">
            <label class="calc-label">
              <input type="checkbox" id="chk-stump" onchange="calcUpdate()">
              <span>Stump Grinder</span>
            </label>
            <span class="calc-price" id="pr-stump" style="color:var(--text-light);">&mdash;</span>
          </div>

          <div class="calc-row" style="padding:.7rem 1rem;">
            <label class="calc-label">
              <input type="checkbox" id="chk-ram" onchange="calcUpdate()">
              <span>Ram 2500 Crew Truck</span>
            </label>
            <span class="calc-price" id="pr-ram" style="color:var(--text-light);">&mdash;</span>
          </div>
          </div>
        </div>

        <!-- Add-Ons -->
        <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1.75rem;">
          <div onclick="toggleSection('sec-addons',this)" style="background:#5a7a5a;color:var(--white);padding:.6rem 1rem;font-weight:700;font-size:.88rem;text-transform:uppercase;letter-spacing:.07em;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"><span>Add-Ons</span><span class="sec-arrow" style="font-size:.7rem;">&#9660;</span></div>
          <div id="sec-addons">

          <div class="calc-row" style="padding:.7rem 1rem;align-items:center;">
            <label class="calc-label">
              <input type="checkbox" id="chk-crane" onchange="calcUpdate()">
              <span>Crane <span style="font-size:.8rem;color:var(--text-light);">(passthrough)</span></span>
            </label>
            <div style="display:flex;align-items:center;gap:.3rem;">
              <span style="font-size:.85rem;color:var(--text-light);">$</span>
              <input type="number" id="crane-cost" min="0" value="2500" step="100"
                style="width:80px;padding:.3rem .4rem;border:2px solid var(--border);border-radius:6px;font-size:.9rem;font-weight:700;text-align:center;"
                oninput="calcUpdate()">
              <span style="font-size:.78rem;color:var(--text-light);">+15%</span>
            </div>
          </div>

          <div class="calc-row" style="padding:.7rem 1rem;align-items:center;">
            <label class="calc-label">
              <input type="checkbox" id="chk-debris" onchange="calcUpdate()">
              <span>Debris Disposal</span>
            </label>
            <div style="display:flex;align-items:center;gap:.3rem;">
              <input type="number" id="debris-loads" min="1" max="10" value="1" step="1"
                style="width:50px;padding:.3rem .4rem;border:2px solid var(--border);border-radius:6px;font-size:.9rem;font-weight:700;text-align:center;"
                oninput="calcUpdate()">
              <span style="font-size:.82rem;color:var(--text-light);">loads &times; $125</span>
            </div>
          </div>

          <div class="calc-row" style="padding:.7rem 1rem;">
            <label class="calc-label">
              <input type="checkbox" id="chk-permit" onchange="calcUpdate()">
              <span>Permit Coordination</span>
            </label>
            <span class="calc-price" id="pr-permit" style="color:var(--text-light);">$75</span>
          </div>

          <div class="calc-row" style="padding:.7rem 1rem;">
            <label class="calc-label">
              <input type="checkbox" id="chk-admin" checked onchange="calcUpdate()">
              <span>Admin / Dispatch</span>
            </label>
            <span class="calc-price" id="pr-admin">$75</span>
          </div>

          <div class="calc-row" style="padding:.7rem 1rem;">
            <label class="calc-label">
              <input type="checkbox" id="chk-consumables" checked onchange="calcUpdate()">
              <span>Consumables <span style="font-size:.8rem;color:var(--text-light);">(chains, ropes, rigging)</span></span>
            </label>
            <span class="calc-price" id="pr-consumables">$50</span>
          </div>

          <div class="calc-row" style="padding:.7rem 1rem;align-items:center;">
            <label class="calc-label">
              <input type="checkbox" id="chk-depreciation" checked onchange="calcUpdate()">
              <span>Equip Wear / Depreciation</span>
            </label>
            <div style="display:flex;align-items:center;gap:.3rem;">
              <input type="number" id="deprec-pct" min="0" max="20" value="5" step="1"
                style="width:46px;padding:.3rem .4rem;border:2px solid var(--border);border-radius:6px;font-size:.9rem;font-weight:700;text-align:center;"
                oninput="calcUpdate()">
              <span style="font-size:.82rem;color:var(--text-light);">% of equip</span>
            </div>
          </div>

          <div class="calc-row" style="padding:.7rem 1rem;align-items:center;">
            <label class="calc-label">
              <input type="checkbox" id="chk-fuel-sur" onchange="calcUpdate()">
              <span>Fuel Surcharge</span>
            </label>
            <div style="display:flex;align-items:center;gap:.3rem;">
              <span style="font-size:.82rem;color:var(--text-light);">diesel $</span>
              <input type="number" id="diesel-price" min="2" max="8" value="3.60" step="0.10"
                style="width:60px;padding:.3rem .4rem;border:2px solid var(--border);border-radius:6px;font-size:.9rem;font-weight:700;text-align:center;"
                oninput="calcUpdate()">
              <span style="font-size:.78rem;color:var(--text-light);">/gal</span>
            </div>
          </div>
          </div>
        </div>

        <!-- Travel Time -->
        <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-top:1rem;">
          <div onclick="toggleSection('sec-travel',this)" style="background:#3d6b4f;color:var(--white);padding:.6rem 1rem;font-weight:700;font-size:.88rem;text-transform:uppercase;letter-spacing:.07em;cursor:pointer;display:flex;justify-content:space-between;align-items:center;"><span>Travel Time <span style="font-size:.75rem;font-weight:400;opacity:.8;text-transform:none;letter-spacing:0;"> &mdash; yard to yard from Peekskill, NY</span></span><span class="sec-arrow" style="font-size:.7rem;">&#9660;</span></div>
          <div id="sec-travel" style="padding:1rem;">
          <p style="font-size:.85rem;color:var(--text-light);margin-bottom:.9rem;">Drive time is calculated round trip plus mileage charge, added to your estimate at the crew hourly rate.</p>
          <div style="display:flex;gap:.6rem;flex-wrap:wrap;">
            <input type="text" id="job-address"
              placeholder="Job address or city, NY"
              style="flex:1;min-width:200px;padding:.5rem .8rem;border:2px solid var(--border);border-radius:8px;font-size:.95rem;"
              onkeydown="if(event.key===&apos;Enter&apos;)calcTravel()">
            <button id="travel-btn" onclick="calcTravel()"
              style="padding:.5rem 1.2rem;background:var(--green-dark);color:white;border:none;border-radius:8px;cursor:pointer;font-size:.95rem;font-weight:600;white-space:nowrap;">
              Calculate
            </button>
          </div>
          <div id="travel-error" style="color:#c0392b;font-size:.87rem;margin-top:.5rem;display:none;"></div>
          <div id="travel-map"
            style="height:240px;border-radius:8px;margin-top:1rem;display:none;border:1px solid var(--border);overflow:hidden;"></div>
          <div id="travel-result"
            style="display:none;margin-top:.9rem;padding:.85rem 1rem;background:var(--white);border:1px solid var(--border);border-radius:8px;display:none;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:.5rem;">
              <div>
                <div id="travel-summary" style="font-weight:700;font-size:.97rem;"></div>
                <div id="travel-detail"  style="font-size:.83rem;color:var(--text-light);margin-top:.2rem;"></div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:.78rem;color:var(--text-light);">Travel added to total</div>
                <div id="travel-cost" style="font-size:1.25rem;font-weight:800;color:var(--green-dark);"></div>
              </div>
            </div>
          </div>
          </div>
        </div>

        <!-- Insurance -->
        <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-top:1rem;">
          <div onclick="toggleSection('sec-insurance',this)" style="background:#2c5f3f;color:var(--white);padding:.6rem 1rem;font-weight:700;font-size:.88rem;text-transform:uppercase;letter-spacing:.07em;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
            <span>Insurance &amp; Compliance</span>
            <span class="sec-arrow" style="font-size:.7rem;">&#9660;</span>
          </div>
          <div id="sec-insurance">
          <div style="padding:.75rem 1rem;">

            <!-- Labor Insurance -->
            <div style="margin-bottom:.6rem;padding-bottom:.6rem;border-bottom:1px solid var(--border);">
              <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-weight:600;font-size:.93rem;margin-bottom:.4rem;">
                <input type="checkbox" id="chk-ins-labor" checked onchange="calcUpdate()" style="width:20px;height:20px;">
                <span>Labor &amp; Payroll</span>
                <span id="ins-labor-amt" style="margin-left:auto;font-size:.9rem;font-weight:700;color:var(--green-dark);"></span>
              </label>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.3rem .5rem;font-size:.84rem;padding-left:1.75rem;">
                <div style="display:flex;align-items:center;gap:.3rem;">
                  <span style="color:var(--text-light);white-space:nowrap;">WC:</span>
                  <input type="number" id="ins-wc-pct" min="0" max="30" value="15" step="1"
                    style="width:42px;padding:.2rem .25rem;border:2px solid var(--border);border-radius:6px;font-size:.85rem;font-weight:700;text-align:center;"
                    oninput="calcUpdate()"><span style="font-weight:700;">%</span>
                </div>
                <div style="display:flex;align-items:center;gap:.3rem;">
                  <span style="color:var(--text-light);white-space:nowrap;">Disab:</span>
                  <input type="number" id="ins-dis-pct" min="0" max="15" value="2" step="0.5"
                    style="width:42px;padding:.2rem .25rem;border:2px solid var(--border);border-radius:6px;font-size:.85rem;font-weight:700;text-align:center;"
                    oninput="calcUpdate()"><span style="font-weight:700;">%</span>
                </div>
                <div style="display:flex;align-items:center;gap:.3rem;">
                  <span style="color:var(--text-light);white-space:nowrap;">Payroll:</span>
                  <input type="number" id="ins-tax-pct" min="0" max="20" value="8" step="0.5"
                    style="width:42px;padding:.2rem .25rem;border:2px solid var(--border);border-radius:6px;font-size:.85rem;font-weight:700;text-align:center;"
                    oninput="calcUpdate()"><span style="font-weight:700;">%</span>
                </div>
              </div>
            </div>

            <!-- General Liability -->
            <div style="margin-bottom:.6rem;padding-bottom:.6rem;border-bottom:1px solid var(--border);">
              <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-weight:600;font-size:.93rem;margin-bottom:.4rem;">
                <input type="checkbox" id="chk-ins-gl" checked onchange="calcUpdate()" style="width:20px;height:20px;">
                <span>General Liability</span>
                <span id="ins-gl-amt" style="margin-left:auto;font-size:.9rem;font-weight:700;color:var(--green-dark);"></span>
              </label>
              <div style="display:flex;align-items:center;gap:.3rem;font-size:.84rem;padding-left:1.75rem;">
                <span style="color:var(--text-light);white-space:nowrap;">GL rate:</span>
                <input type="number" id="ins-gl-pct" min="0" max="30" value="5" step="1"
                  style="width:42px;padding:.2rem .25rem;border:2px solid var(--border);border-radius:6px;font-size:.85rem;font-weight:700;text-align:center;"
                  oninput="calcUpdate()"><span style="font-weight:700;">%</span>
                <span style="color:var(--text-light);font-size:.8rem;margin-left:.3rem;">of total labor cost</span>
              </div>
            </div>

            <!-- Equipment Insurance -->
            <div>
              <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-weight:600;font-size:.93rem;margin-bottom:.4rem;">
                <input type="checkbox" id="chk-ins-equip" checked onchange="calcUpdate()" style="width:20px;height:20px;">
                <span>Equipment Insurance</span>
                <span id="ins-equip-amt" style="margin-left:auto;font-size:.9rem;font-weight:700;color:var(--green-dark);"></span>
              </label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:.3rem .5rem;font-size:.84rem;padding-left:1.75rem;">
                <div style="display:flex;align-items:center;gap:.3rem;">
                  <span style="color:var(--text-light);white-space:nowrap;">Auto:</span>
                  <input type="number" id="ins-auto-pct" min="0" max="20" value="3" step="0.5"
                    style="width:42px;padding:.2rem .25rem;border:2px solid var(--border);border-radius:6px;font-size:.85rem;font-weight:700;text-align:center;"
                    oninput="calcUpdate()"><span style="font-weight:700;">%</span>
                </div>
              </div>
            </div>

            <!-- HIC Licensing -->
            <div style="margin-top:.6rem;padding-top:.6rem;border-top:1px solid var(--border);">
              <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.9rem;">
                <input type="checkbox" id="chk-hic" checked onchange="calcUpdate()" style="width:18px;height:18px;">
                <span style="font-weight:600;">HIC Licensing</span>
                <span style="font-size:.8rem;color:var(--text-light);">(WC-32079 / PC-50644) &mdash; $25</span>
              </label>
            </div>

            <div style="display:flex;justify-content:flex-end;align-items:center;margin-top:.5rem;padding-top:.5rem;border-top:1px solid var(--border);">
              <span id="ins-amount" style="font-size:1rem;font-weight:700;color:var(--green-dark);"></span>
            </div>
          </div>

          <!-- Insurance Info — combined (collapsible, bottom of section) -->
          <div style="border-top:1px solid var(--border);">
            <div onclick="var el=document.getElementById('partner-ins-info');el.style.display=el.style.display==='none'?'block':'none';this.querySelector('.p-arrow').textContent=el.style.display==='none'?'\\u25B6':'\\u25BC';"
              style="padding:.65rem 1rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:rgba(192,80,80,.06);">
              <span style="font-size:.88rem;font-weight:600;color:#c0392b;">&#9888; Why partners must provide insurance or pay under our policy</span>
              <span class="p-arrow" style="font-size:.7rem;color:#c0392b;">&#9654;</span>
            </div>
            <div id="partner-ins-info" style="display:none;padding:.85rem 1rem;font-size:.86rem;color:var(--text);line-height:1.7;background:rgba(192,80,80,.03);">
              <p style="margin:0 0 .6rem;font-weight:600;">Why is insurance charged separately?</p>
              <p style="margin:0 0 .5rem;">Tree work is one of the most dangerous trades in the country. Our insurance premiums reflect that risk and <strong>must be passed through</strong> on every job:</p>
              <ul style="margin:.4rem 0 .6rem;padding-left:1.25rem;">
                <li><strong>Workers&rsquo; Compensation</strong> &mdash; Required by NY law. Class code 0106 (tree pruning/trimming) averages ~$9 per $100 of payroll. One of the highest-rated trades due to aerial work risk.</li>
                <li><strong>General Liability</strong> &mdash; Covers property damage to the client&rsquo;s home, structures, vehicles, and landscaping. Typically $2,000&ndash;$4,000/year for tree companies (~3&ndash;5% of revenue).</li>
                <li><strong>Disability Insurance</strong> &mdash; NYS-required disability and paid family leave coverage for all employees.</li>
                <li><strong>Payroll Taxes</strong> &mdash; Employer&rsquo;s share of Social Security (6.2%), Medicare (1.45%), federal &amp; state unemployment (FUTA/SUTA). Mandatory on every dollar of labor.</li>
                <li><strong>Commercial Auto</strong> &mdash; Covers bucket truck, chip truck, and fleet. Avg $2,000&ndash;$5,000/year; bucket trucks require $1&ndash;2M liability limits adding $500&ndash;$1,000/vehicle.</li>
                <li><strong>Equipment / Inland Marine</strong> &mdash; Covers chainsaws, rigging gear, chipper, stump grinder &mdash; typically 2&ndash;5% of equipment value annually. Most tree companies have $50K&ndash;$250K in equipment.</li>
              </ul>
              <p style="margin:0 0 1rem;font-size:.84rem;font-style:italic;">These costs are real and unavoidable. We carry full coverage so you and your clients are protected.</p>
              <hr style="border:none;border-top:1px solid var(--border);margin:0 0 1rem;">
              <p style="margin:0 0 .6rem;font-weight:600;">If you don&rsquo;t carry your own insurance, we are legally liable for you.</p>
              <p style="margin:0 0 .6rem;">Under New York law, when you work on a job under our name or alongside our crew, <strong>we become the responsible party</strong> if something goes wrong. Here&rsquo;s what that means:</p>
              <ul style="margin:.4rem 0 .75rem;padding-left:1.25rem;">
                <li style="margin-bottom:.4rem;"><strong>Workers&rsquo; Comp liability:</strong> If you or your crew members get injured on the job and you don&rsquo;t have your own WC policy, <strong>NYSIF will charge the claim to our policy</strong>. Our carrier audits every year and retroactively bills us for any uninsured subcontractor payroll. A single injury claim can cost $50,000&ndash;$500,000+ and spike our experience modifier for 3 years.</li>
                <li style="margin-bottom:.4rem;"><strong>General Liability exposure:</strong> If your crew damages a client&rsquo;s property &mdash; roof, driveway, fence, vehicle, power lines &mdash; and you don&rsquo;t carry GL, the homeowner&rsquo;s claim comes to us as the general contractor. One dropped limb on a car is $5,000&ndash;$30,000. A roof hit can be $20,000+.</li>
                <li style="margin-bottom:.4rem;"><strong>NY Construction Fair Play Act:</strong> New York presumes all workers on a job are <strong>employees, not independent contractors</strong>, unless you meet strict criteria including carrying your own insurance. If you&rsquo;re working under our umbrella without your own policy, the state considers you our employee &mdash; and we owe WC, disability, unemployment, and payroll taxes on every dollar we pay you.</li>
                <li style="margin-bottom:.4rem;"><strong>NYSIF subcontractor monitoring:</strong> NYSIF actively monitors subcontractor relationships. During annual audits, they request a list of every sub used. Any sub without a valid COI on file = their payroll gets added to our premium at class code 0106 rates (~$9/$100). On a $10,000 sub job, that&rsquo;s $900 in unexpected premium.</li>
                <li style="margin-bottom:.4rem;"><strong>Criminal penalties:</strong> Knowingly allowing uninsured workers on a job site is a <strong>misdemeanor in NY</strong> (up to $50,000 fine for first offense). With 5+ uninsured workers, it becomes a <strong>felony</strong>.</li>
              </ul>
              <p style="margin:0 0 .6rem;font-weight:600;color:var(--text);">Bottom line: two options.</p>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.75rem;">
                <div style="background:var(--white);border:1px solid var(--border);border-radius:8px;padding:.75rem;">
                  <p style="margin:0 0 .3rem;font-weight:700;color:var(--green-dark);font-size:.9rem;">Option A: Bring your own</p>
                  <p style="margin:0;font-size:.82rem;">Provide current COIs for GL, WC, and Commercial Auto <strong>before</strong> the job. We verify and file them. Equipment rates only &mdash; no insurance markup.</p>
                </div>
                <div style="background:var(--white);border:1px solid var(--border);border-radius:8px;padding:.75rem;">
                  <p style="margin:0 0 .3rem;font-weight:700;color:var(--green-dark);font-size:.9rem;">Option B: Work under ours</p>
                  <p style="margin:0;font-size:.82rem;">We cover you under our policies. Insurance costs are added to your rate (see toggles above). This protects both of us and keeps the job legal.</p>
                </div>
              </div>
              <p style="margin:0;font-size:.82rem;color:var(--text-light);font-style:italic;">This isn&rsquo;t about making extra money &mdash; it&rsquo;s about not losing everything. One uninsured claim can shut down a tree company. We&rsquo;ve seen it happen.</p>
            </div>
          </div>
          </div>
        </div>

        <!-- Hidden discount field (value always 0) -->
        <input type="hidden" id="disc-pct" value="0">
        <span id="disc-amount" style="display:none;"></span>

        <!-- Total panel -->
        <div style="background:var(--green-dark);border-radius:10px;padding:1.25rem 1.5rem;color:var(--white);margin-top:.75rem;">
          <div id="calc-breakdown" style="font-size:.9rem;opacity:.8;line-height:1.9;margin-bottom:.85rem;border-bottom:1px solid rgba(255,255,255,.2);padding-bottom:.75rem;"></div>
          <div id="subtotal-row" style="display:none;font-size:.9rem;opacity:.7;margin-bottom:.4rem;display:none;">
            <span>Subtotal</span>
            <span id="calc-subtotal" style="float:right;font-weight:600;"></span>
          </div>
          <div id="discount-row" style="display:none;font-size:.9rem;color:#f9c74f;margin-bottom:.6rem;">
            <span id="disc-label"></span>
            <span id="disc-line" style="float:right;font-weight:600;"></span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:.5rem;clear:both;">
            <div>
              <span style="font-size:1.05rem;font-weight:600;" id="total-label">Estimated Total</span>
              <div id="calc-dur-note" style="font-size:.8rem;opacity:.65;margin-top:.15rem;">Full Day (8 hr)</div>
            </div>
            <span id="calc-total" style="font-size:2.4rem;font-weight:800;letter-spacing:-.02em;">$1,590</span>
          </div>
          <div id="min-notice" style="display:none;margin-top:.6rem;padding:.5rem .75rem;background:rgba(255,255,255,.15);border-radius:6px;font-size:.82rem;color:#f9c74f;">&#9888; Minimum job charge of $500 applied.</div>
          <p style="font-size:.78rem;opacity:.7;margin-top:.75rem;margin-bottom:0;">Estimate only &mdash; call to confirm current rates and availability.</p>
        </div>

        <!-- Partnering Arborist Profit -->
        <div style="margin-top:1rem;padding:1.25rem 1.5rem;background:var(--white);border:2px solid var(--green-dark);border-radius:10px;">
          <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:.5rem;">
            <label style="font-weight:700;font-size:1rem;white-space:nowrap;" for="profit-pct">Partnering Arborist Profit</label>
            <div style="display:flex;align-items:center;gap:.4rem;">
              <input type="number" id="profit-pct" min="0" max="200" value="15" step="5"
                style="width:68px;padding:.4rem .6rem;border:2px solid var(--border);border-radius:8px;font-size:1.1rem;font-weight:700;text-align:center;"
                oninput="calcUpdate()">
              <span style="font-size:1.1rem;font-weight:700;">%</span>
              <span id="profit-dollar" style="font-size:1.1rem;font-weight:700;color:var(--green-dark);margin-left:.3rem;"></span>
            </div>
            <span id="profit-amount" style="margin-left:auto;font-size:1.1rem;font-weight:700;color:var(--green-dark);"></span>
          </div>
          <p style="font-size:.82rem;color:var(--text-light);line-height:1.55;margin-bottom:.75rem;">Your markup on top of our costs for bringing the job. This is your take-home for sourcing the client, managing the relationship, and coordinating the work. Typical referral/coordination markup is 10&ndash;25%. The more you bring, the more you earn.</p>
          <div id="client-quote" style="display:none;background:var(--green-dark);border-radius:8px;padding:1rem 1.25rem;color:var(--white);">
            <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:.5rem;">
              <div>
                <div style="font-size:.85rem;opacity:.7;">Quote to your client</div>
                <div style="font-size:.95rem;font-weight:600;">Cost + Your Profit</div>
              </div>
              <span id="client-total" style="font-size:2rem;font-weight:800;letter-spacing:-.02em;"></span>
            </div>
            <div style="margin-top:.5rem;font-size:.82rem;opacity:.6;">
              Your profit on this job: <span id="profit-earned" style="font-weight:700;opacity:1;color:#f9c74f;"></span>
            </div>
          </div>
        </div>

      </div>

      <style>
        .calc-row {display:flex;justify-content:space-between;align-items:center;padding:.55rem 0;border-bottom:1px solid var(--border);}
        .calc-row:last-child {border-bottom:none;}
        .calc-label {display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.96rem;}
        .calc-label input[type="checkbox"] {width:22px;height:22px;margin:0;cursor:pointer;}
        .calc-price {font-weight:600;font-size:.95rem;white-space:nowrap;margin-left:.5rem;}
        .calc-adj-btn {width:40px;height:40px;border:1px solid var(--border);border-radius:8px;background:var(--white);cursor:pointer;font-size:1.4rem;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;user-select:none;}
        .calc-adj-btn:active {background:var(--bg-light);}
        .dur-btn {transition:all .15s;-webkit-tap-highlight-color:transparent;user-select:none;}
        .preset-btn {transition:all .15s;-webkit-tap-highlight-color:transparent;user-select:none;}
        .tier-btn {transition:all .15s;-webkit-tap-highlight-color:transparent;user-select:none;}

        /* ── Mobile: field-ready sizing ── */
        @media(max-width:600px){
          #calc-wrap {padding:.85rem !important;border-radius:10px !important;}

          /* Duration buttons: full width, big tap targets */
          #dur-btns {gap:.5rem !important;}
          .dur-btn {padding:.7rem 1rem !important;font-size:1rem !important;flex:1;min-width:0;text-align:center;}

          /* Rows: generous padding for fat-finger taps */
          .calc-row {padding:.85rem .75rem !important;min-height:48px;}
          .calc-label {font-size:1rem;gap:.55rem;}
          .calc-label input[type="checkbox"] {width:26px;height:26px;min-width:26px;}
          .calc-price {font-size:1rem;}

          /* +/- buttons: bigger on mobile */
          .calc-adj-btn {width:44px;height:44px;font-size:1.5rem;border-radius:10px;}
          #ground-ct {font-size:1.1rem;min-width:28px !important;}

          /* Total panel */
          #calc-total {font-size:2.2rem !important;}

          /* Travel section */
          #travel-map {height:180px !important;}
          #job-address {font-size:16px !important;min-width:0 !important;padding:.65rem .8rem !important;} /* 16px prevents iOS zoom */
          #travel-btn {padding:.65rem 1.2rem !important;font-size:1rem !important;min-height:48px;}


          /* Custom hours */
          #custom-hrs {font-size:16px !important;width:68px !important;padding:.5rem !important;}

          /* Insurance */
          #ins-wc-pct, #ins-gl-pct, #ins-dis-pct, #ins-tax-pct, #ins-auto-pct {font-size:16px !important;width:52px !important;padding:.4rem !important;}
          /* Profit */
          #profit-pct {font-size:16px !important;}

          /* Submit form */
          #submit-form input, #submit-form textarea {font-size:16px !important;} /* prevent iOS zoom */
          #submit-form > div > div:first-of-type {grid-template-columns:1fr !important;}

          /* Section headers */
          .calc-row + .calc-row {border-top:none;}
        }

        /* ── Extra-small phones (iPhone SE etc) ── */
        @media(max-width:375px){
          .dur-btn {padding:.6rem .5rem !important;font-size:.9rem !important;}
          .calc-label {font-size:.93rem;}
          #calc-total {font-size:1.9rem !important;}
        }

        /* Print styles */
        @media print {
          .top-bar, .site-header, .page-hero, .cta-banner, .site-footer,
          #dur-btns, #preset-btns, #emergency-label, #travel-map,
          .calc-adj-btn, button, input[type="checkbox"], input[type="number"] { display:none !important; }
          .section { padding:0 !important; }
          #calc-wrap { border:none !important; padding:.5rem !important; }
          body { background:white !important; color:black !important; }
          * { color:black !important; background:white !important; border-color:#ccc !important; }
        }
      </style>

      <script>
        /* ── Section collapse/expand ──────────────────────────────── */
        function toggleSection(id, hdr) {
          var el = document.getElementById(id);
          var arrow = hdr.querySelector('.sec-arrow');
          if (el.style.display === 'none') {
            el.style.display = '';
            if (arrow) arrow.innerHTML = '&#9660;';
          } else {
            el.style.display = 'none';
            if (arrow) arrow.innerHTML = '&#9654;';
          }
        }

        /* ── State ───────────────────────────────────────────────── */
        var gCount    = 2;
        var durHours  = 8;
        var travelMins = 30;
        var travelMiles = 20;
        var MILEAGE_LIGHT = 0.70; /* IRS rate - Ram 2500, pickups */
        var MILEAGE_HEAVY = 1.75; /* heavy truck - bucket, chip truck (fuel + wear + insurance) */
        var leafletReady = false;
        var travelMap = null;
        var routeLayer = null;

        /* Base: 1 Highland Industrial Park, Peekskill NY 10566
           Geocoded on init; fallback to town centre if lookup fails */
        var BASE_LAT = 41.2833, BASE_LNG = -73.9262;
        var BASE_ADDR = '1 Highland Industrial Park, Peekskill, NY 10566';

        /* Geocode home base once on load */
        fetch('https://nominatim.openstreetmap.org/search?q='
          + encodeURIComponent(BASE_ADDR) + '&format=json&limit=1&countrycodes=us',
          { headers: { 'Accept-Language': 'en' } })
        .then(function(r){ return r.json(); })
        .then(function(d){
          if (d.length) { BASE_LAT = parseFloat(d[0].lat); BASE_LNG = parseFloat(d[0].lon); }
        }).catch(function(){});

        /* ── Rates: [half_day, full_day, hourly] ─────────────────── */
        var RATES = {
          climber:  [200,  400,  50],
          operator: [200,  400,  50],
          ground:   [120,  240,  30],
          chipper:  [175,  350,  44],
          chiptruck:[175,  350,  44],
          bucket:   [300,  600,  75],
          loader:   [200,  400,  50],
          trailer:  [ 50,  100,  13],
          stump:    [175,  325,  41],
          ram:      [100,  200,  25]
        };

        function rate(key, h) {
          var r = RATES[key];
          if (h === 4) return r[0];
          if (h === 8) return r[1];
          /* Overtime: hours beyond 8 at 1.5x hourly */
          if (h > 8) {
            return Math.round(r[1] + (h - 8) * r[2] * 1.5);
          }
          return Math.round(r[2] * h);
        }

        /* Hourly rate for all active crew — used for travel billing */
        function crewHourly() {
          var hr = 0;
          if (document.getElementById('chk-climber').checked) hr += RATES.climber[2];
          if (document.getElementById('chk-operator').checked) hr += RATES.operator[2];
          hr += gCount * RATES.ground[2];
          if (document.getElementById('chk-chipper').checked)  hr += RATES.chipper[2];
          if (document.getElementById('chk-chiptruck').checked) hr += RATES.chiptruck[2];
          if (document.getElementById('chk-bucket').checked)  hr += RATES.bucket[2];
          if (document.getElementById('chk-loader').checked)  hr += RATES.loader[2];
          return hr;
        }

        /* ── Duration buttons ────────────────────────────────────── */
        function setDur(v) {
          durHours = (v === 'custom') ? (parseInt(document.getElementById('custom-hrs').value)||6) : v;
          var custom = (v === 'custom');
          document.getElementById('custom-hrs').style.display      = custom ? 'block' : 'none';
          document.getElementById('custom-hr-label').style.display = custom ? 'inline' : 'none';
          document.querySelectorAll('.dur-btn').forEach(function(b){
            var active = (b.dataset.val == String(v));
            b.style.border     = active ? '2px solid var(--green-dark)' : '2px solid var(--border)';
            b.style.background = active ? 'var(--green-dark)' : 'var(--white)';
            b.style.color      = active ? 'var(--white)' : '';
            b.style.fontWeight = active ? '600' : '';
          });
          calcUpdate();
        }

        /* ── Bucket / Operator link ─────────────────────────────── */
        function onBucketChange() {
          var on = document.getElementById('chk-bucket').checked;
          var o  = document.getElementById('chk-operator');
          o.checked = on; o.disabled = !on;
          o.style.opacity = on ? '1' : '.45';
          calcUpdate();
        }

        /* ── Loader / Trailer link ───────────────────────────────── */
        function onLoaderChange() {
          var on = document.getElementById('chk-loader').checked;
          var t  = document.getElementById('chk-trailer');
          t.checked = on; t.disabled = !on;
          t.style.opacity = on ? '1' : '.45';
          calcUpdate();
        }

        /* ── Groundsman counter ──────────────────────────────────── */
        function adjGround(d) {
          gCount = Math.max(0, Math.min(6, gCount + d));
          document.getElementById('ground-ct').textContent = gCount;
          calcUpdate();
        }

        /* ── Job Type Presets ──────────────────────────────────────── */
        function setPreset(type) {
          /* Reset all checkboxes */
          ['chk-climber','chk-operator','chk-chipper','chk-chiptruck','chk-bucket','chk-loader','chk-trailer','chk-stump','chk-ram'].forEach(function(id){
            var el = document.getElementById(id);
            if (el) { el.checked = false; el.disabled = false; el.style.opacity = '1'; }
          });

          switch(type) {
            case 'removal':
              document.getElementById('chk-climber').checked = true;
              document.getElementById('chk-ram').checked = true;
              gCount = 2;
              document.getElementById('chk-chipper').checked = true;
              document.getElementById('chk-chiptruck').checked = true;
              setDur(8);
              break;
            case 'pruning':
              document.getElementById('chk-climber').checked = true;
              document.getElementById('chk-ram').checked = true;
              gCount = 1;
              document.getElementById('chk-chipper').checked = true;
              setDur(4);
              break;
            case 'clearing':
              document.getElementById('chk-climber').checked = false;
              document.getElementById('chk-ram').checked = true;
              gCount = 2;
              document.getElementById('chk-chipper').checked = true;
              document.getElementById('chk-chiptruck').checked = true;
              document.getElementById('chk-loader').checked = true;
              document.getElementById('chk-trailer').checked = true;
              document.getElementById('chk-trailer').disabled = false;
              document.getElementById('chk-trailer').style.opacity = '1';
              setDur(8);
              break;
            case 'bucket':
              document.getElementById('chk-climber').checked = true;
              document.getElementById('chk-ram').checked = true;
              gCount = 2;
              document.getElementById('chk-chipper').checked = true;
              document.getElementById('chk-chiptruck').checked = true;
              document.getElementById('chk-bucket').checked = true;
              document.getElementById('chk-operator').checked = true;
              document.getElementById('chk-operator').disabled = false;
              document.getElementById('chk-operator').style.opacity = '1';
              setDur(8);
              break;
            case 'custom':
              gCount = 2;
              document.getElementById('chk-climber').checked = true;
              document.getElementById('chk-ram').checked = true;
              document.getElementById('chk-chipper').checked = true;
              break;
          }
          document.getElementById('ground-ct').textContent = gCount;

          /* Highlight active preset */
          document.querySelectorAll('.preset-btn').forEach(function(b){ b.style.border='1px solid var(--border)'; b.style.background='var(--white)'; b.style.color=''; b.style.fontWeight=''; });
          event.target.style.border = '2px solid var(--green-dark)';
          event.target.style.background = 'var(--green-dark)';
          event.target.style.color = 'white';
          event.target.style.fontWeight = '600';

          calcUpdate();
        }

        var MIN_CHARGE = 500;
        var tierDiscount = 0; /* 0 = standard, 0.15 = preferred, 0.25 = co-op */

        var TIER_DESCS = {
          standard:  'Full rates \u2014 any company, no existing relationship. <a href="#industry-rates" style="color:var(--green-dark);font-weight:600;">Industry rate sources \u2192</a>',
          preferred: '15% off equipment rates \u2014 partners who sub 3+ jobs/month.',
          coop:      '25% off equipment rates \u2014 full co-op members with buy-in.'
        };

        function setTier(tier) {
          tierDiscount = tier === 'coop' ? 0.25 : tier === 'preferred' ? 0.15 : 0;
          document.getElementById('tier-desc').innerHTML = TIER_DESCS[tier];
          document.querySelectorAll('.tier-btn').forEach(function(b){
            var active = b.dataset.tier === tier;
            b.style.border = active ? '2px solid var(--green-dark)' : '2px solid var(--border)';
            b.style.background = active ? 'var(--green-dark)' : 'var(--white)';
            b.style.color = active ? 'var(--white)' : '';
            b.style.fontWeight = active ? '600' : '';
          });
          calcUpdate();
        }

        /* ── Main calculator ─────────────────────────────────────── */
        function calcUpdate() {
          var h = (durHours === 'custom')
            ? (parseInt(document.getElementById('custom-hrs').value) || 6)
            : durHours;

          var laborLines = [], equipLines = [], total = 0;
          var isEmergency = document.getElementById('chk-emergency').checked;
          var emergMult = isEmergency ? 1.5 : 1;

          function grp(lines, id, prId, label, key, qty, isEquip) {
            qty = (qty === undefined) ? 1 : qty;
            var chk = document.getElementById(id);
            var on  = chk ? chk.checked : (qty > 0);
            if (!chk && qty === 0) { document.getElementById(prId).innerHTML = '&mdash;'; return; }
            var tierMult = (isEquip && tierDiscount > 0) ? (1 - tierDiscount) : 1;
            var v = on ? Math.round(rate(key, h) * qty * emergMult * tierMult) : 0;
            if (on && v > 0) {
              total += v;
              var lbl = qty > 1 ? qty + '&times;&nbsp;' + label : label;
              lines.push('<span style="opacity:.75">' + lbl + '</span>'
                + '<span style="float:right;font-weight:600">$' + v.toLocaleString() + '</span>');
            }
            document.getElementById(prId).innerHTML = on ? '$' + v.toLocaleString() : '&mdash;';
            document.getElementById(prId).style.color = on ? '' : 'var(--text-light)';
          }

          /* Labor */
          grp(laborLines, 'chk-climber',  'pr-climber',  'Climber',         'climber');
          grp(laborLines, 'chk-operator', 'pr-operator', 'Bucket Operator', 'operator');  /* labor cost, shown under bucket */
          var gv = Math.round(rate('ground', h) * gCount * emergMult);
          if (gCount > 0) {
            total += gv;
            laborLines.push('<span style="opacity:.75">' + gCount + '&times;&nbsp;Groundsperson</span>'
              + '<span style="float:right;font-weight:600">$' + gv.toLocaleString() + '</span>');
          }
          document.getElementById('pr-ground').innerHTML = gCount > 0 ? '$' + gv.toLocaleString() : '&mdash;';
          document.getElementById('pr-ground').style.color = gCount > 0 ? '' : 'var(--text-light)';

          /* Equipment */
          grp(equipLines, 'chk-chipper',   'pr-chipper',   'Brush Bandit Chipper', 'chipper', 1, true);
          grp(equipLines, 'chk-chiptruck', 'pr-chiptruck', 'Chip Truck',          'chiptruck', 1, true);
          grp(equipLines, 'chk-bucket',    'pr-bucket',    '75ft Bucket Truck',   'bucket', 1, true);
          grp(equipLines, 'chk-loader',   'pr-loader',  'Giant Loader',         'loader', 1, true);
          grp(equipLines, 'chk-trailer',  'pr-trailer', 'Trailer',              'trailer', 1, true);
          grp(equipLines, 'chk-stump',   'pr-stump',   'Stump Grinder',        'stump', 1, true);
          grp(equipLines, 'chk-ram',     'pr-ram',     'Ram 2500 Crew Truck',  'ram', 1, true);

          /* Equipment base cost (for depreciation + insurance calcs) */
          var eBase = 0;
          if (document.getElementById('chk-chipper').checked)   eBase += rate('chipper', h);
          if (document.getElementById('chk-chiptruck').checked) eBase += rate('chiptruck', h);
          if (document.getElementById('chk-bucket').checked)    eBase += rate('bucket', h);
          if (document.getElementById('chk-loader').checked)    eBase += rate('loader', h);
          if (document.getElementById('chk-trailer').checked)   eBase += rate('trailer', h);
          if (document.getElementById('chk-stump').checked)     eBase += rate('stump', h);
          if (document.getElementById('chk-ram').checked)       eBase += rate('ram', h);

          /* Add-ons */
          var addonLines = [];

          /* Crane passthrough */
          if (document.getElementById('chk-crane').checked) {
            var craneCost = parseInt(document.getElementById('crane-cost').value) || 0;
            var craneMarkup = Math.round(craneCost * 0.15);
            var craneTotal = craneCost + craneMarkup;
            if (craneTotal > 0) {
              total += craneTotal;
              addonLines.push('<span style="opacity:.75">Crane ($' + craneCost.toLocaleString() + ' + 15%)</span><span style="float:right;font-weight:600">$' + craneTotal.toLocaleString() + '</span>');
            }
          }

          /* Debris disposal */
          if (document.getElementById('chk-debris').checked) {
            var loads = parseInt(document.getElementById('debris-loads').value) || 1;
            var debrisCost = loads * 125;
            total += debrisCost;
            addonLines.push('<span style="opacity:.75">' + loads + ' load' + (loads>1?'s':'') + ' debris disposal</span><span style="float:right;font-weight:600">$' + debrisCost.toLocaleString() + '</span>');
          }

          /* Permit */
          if (document.getElementById('chk-permit').checked) {
            total += 75;
            addonLines.push('<span style="opacity:.75">Permit coordination</span><span style="float:right;font-weight:600">$75</span>');
          }
          document.getElementById('pr-permit').style.color = document.getElementById('chk-permit').checked ? '' : 'var(--text-light)';

          /* HIC Licensing — counted with insurance */
          var hicAmt = document.getElementById('chk-hic').checked ? 25 : 0;

          /* Admin / Dispatch */
          if (document.getElementById('chk-admin').checked) {
            total += 75;
            addonLines.push('<span style="opacity:.75">Admin / dispatch</span><span style="float:right;font-weight:600">$75</span>');
          }
          document.getElementById('pr-admin').style.color = document.getElementById('chk-admin').checked ? '' : 'var(--text-light)';

          /* Consumables */
          if (document.getElementById('chk-consumables').checked) {
            total += 50;
            addonLines.push('<span style="opacity:.75">Consumables (chains, ropes, rigging)</span><span style="float:right;font-weight:600">$50</span>');
          }
          document.getElementById('pr-consumables').style.color = document.getElementById('chk-consumables').checked ? '' : 'var(--text-light)';

          /* Equipment Wear / Depreciation — % of equipment base cost */
          if (document.getElementById('chk-depreciation').checked) {
            var depPct = Math.max(0, parseFloat(document.getElementById('deprec-pct').value) || 0);
            var depAmt = Math.round(eBase * depPct / 100);
            if (depAmt > 0) {
              total += depAmt;
              addonLines.push('<span style="opacity:.75">Equip wear/depreciation (' + depPct + '% of $' + eBase.toLocaleString() + ')</span><span style="float:right;font-weight:600">$' + depAmt.toLocaleString() + '</span>');
            }
          }

          /* Fuel Surcharge — based on diesel price vs $3.00 baseline, applied to heavy truck mileage */
          if (document.getElementById('chk-fuel-sur').checked) {
            var dieselPrice = parseFloat(document.getElementById('diesel-price').value) || 3.60;
            var baseline = 3.00; /* baseline diesel $/gal baked into heavy truck rate */
            var surchargePerGal = Math.max(0, dieselPrice - baseline);
            /* Heavy trucks ~6 MPG, light trucks ~12 MPG */
            var heavyGals = 0, lightGals = 0;
            if (document.getElementById('chk-chiptruck').checked) heavyGals += (travelMiles * 2) / 6;
            if (document.getElementById('chk-bucket').checked)    heavyGals += (travelMiles * 2) / 6;
            if (document.getElementById('chk-ram').checked)       lightGals += (travelMiles * 2) / 12;
            var fuelSurcharge = Math.round((heavyGals + lightGals) * surchargePerGal);
            if (fuelSurcharge > 0) {
              total += fuelSurcharge;
              addonLines.push('<span style="opacity:.75">Fuel surcharge ($' + dieselPrice.toFixed(2) + '/gal, +$' + surchargePerGal.toFixed(2) + ' over $' + baseline.toFixed(2) + ' base)</span><span style="float:right;font-weight:600">$' + fuelSurcharge.toLocaleString() + '</span>');
            }
          }

          /* Build grouped breakdown */
          var sep = '<div style="height:1px;background:rgba(255,255,255,.15);margin:.5rem 0;clear:both;"></div>';
          var hdr = function(t){ return '<div style="font-size:.75rem;font-weight:700;letter-spacing:.08em;'
            + 'text-transform:uppercase;opacity:.7;margin-bottom:.3rem;clear:both;">' + t + '</div>'; };
          var allLines = [];
          if (laborLines.length)  allLines.push(hdr('Labor')     + laborLines.join('<br>'));
          if (equipLines.length)  allLines.push(hdr('Equipment') + equipLines.join('<br>'));
          if (addonLines.length)  allLines.push(hdr('Add-Ons') + addonLines.join('<br>'));

          /* Travel line */
          if (travelMins > 0) {
            var rtHrs   = (travelMins * 2) / 60;
            var tCost   = Math.round(crewHourly() * rtHrs);
            total += tCost;
            var travelLines = [];
            travelLines.push('<span style="opacity:.75">Crew travel (' + formatMins(travelMins * 2) + ' round trip)</span>'
              + '<span style="float:right;font-weight:600">$' + tCost.toLocaleString() + '</span>');

            /* Mileage — count trucks dispatched × round trip miles × IRS rate */
            if (travelMiles > 0) {
              var rtMiles = travelMiles * 2;
              var lightTrucks = 0, heavyTrucks = 0;
              if (document.getElementById('chk-ram').checked)       lightTrucks++;
              if (document.getElementById('chk-chiptruck').checked) heavyTrucks++;
              if (document.getElementById('chk-bucket').checked)    heavyTrucks++;
              if (lightTrucks === 0 && heavyTrucks === 0) lightTrucks = 1; /* min 1 truck */
              var lightMileage = Math.round(rtMiles * lightTrucks * MILEAGE_LIGHT);
              var heavyMileage = Math.round(rtMiles * heavyTrucks * MILEAGE_HEAVY);
              var mileageCost = lightMileage + heavyMileage;
              total += mileageCost;
              var mileageDesc = '';
              if (lightTrucks > 0) mileageDesc += lightTrucks + ' light @ $' + MILEAGE_LIGHT.toFixed(2) + '/mi';
              if (heavyTrucks > 0) mileageDesc += (mileageDesc ? ' + ' : '') + heavyTrucks + ' heavy @ $' + MILEAGE_HEAVY.toFixed(2) + '/mi';
              travelLines.push('<span style="opacity:.75">Mileage (' + rtMiles + ' mi RT &mdash; ' + mileageDesc + ')</span>'
                + '<span style="float:right;font-weight:600">$' + mileageCost.toLocaleString() + '</span>');
            }

            allLines.push(hdr('Travel') + travelLines.join('<br>'));
            var totalTravel = tCost + (travelMiles > 0 ? mileageCost : 0);
            document.getElementById('travel-cost').textContent = '+$' + totalTravel.toLocaleString();
          }

          /* Insurance — three separate toggles */
          var insLaborOn = document.getElementById('chk-ins-labor').checked;
          var insGLOn    = document.getElementById('chk-ins-gl').checked;
          var insEquipOn = document.getElementById('chk-ins-equip').checked;
          var lSub = 0;
          if (document.getElementById('chk-climber').checked)  lSub += Math.round(rate('climber', h) * emergMult);
          if (document.getElementById('chk-operator').checked) lSub += Math.round(rate('operator', h) * emergMult);
          lSub += Math.round(rate('ground', h) * gCount * emergMult);
          var eSub = 0;
          var eTierMult = tierDiscount > 0 ? (1 - tierDiscount) : 1;
          if (document.getElementById('chk-chipper').checked)   eSub += Math.round(rate('chipper', h) * emergMult * eTierMult);
          if (document.getElementById('chk-chiptruck').checked) eSub += Math.round(rate('chiptruck', h) * emergMult * eTierMult);
          if (document.getElementById('chk-bucket').checked)    eSub += Math.round(rate('bucket', h) * emergMult * eTierMult);
          if (document.getElementById('chk-loader').checked)    eSub += Math.round(rate('loader', h) * emergMult * eTierMult);
          if (document.getElementById('chk-trailer').checked)   eSub += Math.round(rate('trailer', h) * emergMult * eTierMult);
          if (document.getElementById('chk-stump').checked)     eSub += Math.round(rate('stump', h) * emergMult * eTierMult);
          if (document.getElementById('chk-ram').checked)       eSub += Math.round(rate('ram', h) * emergMult * eTierMult);

          var wcPct  = Math.max(0, parseFloat(document.getElementById('ins-wc-pct').value) || 0);
          var glPct  = Math.max(0, parseFloat(document.getElementById('ins-gl-pct').value) || 0);
          var disPct = Math.max(0, parseFloat(document.getElementById('ins-dis-pct').value) || 0);
          var taxPct = Math.max(0, parseFloat(document.getElementById('ins-tax-pct').value) || 0);

          var autoPct = Math.max(0, parseFloat(document.getElementById('ins-auto-pct').value) || 0);
          var eqPct  = 0; /* inland marine removed */

          /* Base rates (before emergency/tier) for insurance calc — insurance premiums
             are based on actual payroll/costs, not what you charge the customer */
          var lBase = 0;
          if (document.getElementById('chk-climber').checked)  lBase += rate('climber', h);
          if (document.getElementById('chk-operator').checked) lBase += rate('operator', h);
          lBase += rate('ground', h) * gCount;
          /* eBase already computed above */

          var wcAmt   = insLaborOn ? Math.round(lBase * wcPct / 100) : 0;
          var disAmt  = insLaborOn ? Math.round(lBase * disPct / 100) : 0;
          var taxAmt  = insLaborOn ? Math.round(lBase * taxPct / 100) : 0;
          var glAmt   = insGLOn    ? Math.round(lBase * glPct / 100) : 0;
          var autoAmt = insEquipOn ? Math.round(eBase * autoPct / 100) : 0;
          var eqAmt   = insEquipOn ? Math.round(eBase * eqPct / 100) : 0;

          var laborInsTotal = wcAmt + disAmt + taxAmt;
          var glTotal       = glAmt;
          var equipInsTotal = autoAmt + eqAmt;
          var insAmt  = laborInsTotal + glTotal + equipInsTotal + hicAmt;
          if (hicAmt > 0) total += hicAmt;

          /* Show per-section totals */
          document.getElementById('ins-labor-amt').textContent = laborInsTotal > 0 ? '+$' + laborInsTotal.toLocaleString() : '';
          document.getElementById('ins-gl-amt').textContent    = glTotal > 0 ? '+$' + glTotal.toLocaleString() : '';
          document.getElementById('ins-equip-amt').textContent = equipInsTotal > 0 ? '+$' + equipInsTotal.toLocaleString() : '';

          /* Append labor insurance as sub-items under labor */
          if (laborInsTotal > 0) {
            var lIns = '<div style="font-size:.78rem;opacity:.7;margin-top:.3rem;padding-left:.5rem;border-left:2px solid rgba(255,255,255,.2);">';
            if (wcAmt > 0) lIns += 'Workers\u2019 Comp ' + wcPct + '% <span style="float:right">$' + wcAmt.toLocaleString() + '</span><br>';
            if (disAmt > 0) lIns += 'Disability ' + disPct + '% <span style="float:right">$' + disAmt.toLocaleString() + '</span><br>';
            if (taxAmt > 0) lIns += 'Payroll Tax ' + taxPct + '% <span style="float:right">$' + taxAmt.toLocaleString() + '</span><br>';
            lIns += '</div>';
            if (laborLines.length) allLines[0] += lIns;
            total += laborInsTotal;
          }

          /* GL — own line item, based on labor cost */
          if (glTotal > 0) {
            allLines.push(hdr('General Liability') + '<span style="opacity:.75">GL ' + glPct + '% on $' + lBase.toLocaleString() + ' labor</span><span style="float:right;font-weight:600">$' + glTotal.toLocaleString() + '</span>');
            total += glTotal;
          }

          /* Equipment insurance: auto + inland marine, append under equipment */
          if (equipInsTotal > 0) {
            var eIns = '<div style="font-size:.78rem;opacity:.7;margin-top:.3rem;padding-left:.5rem;border-left:2px solid rgba(255,255,255,.2);">';
            if (autoAmt > 0) eIns += 'Comm. Auto ' + autoPct + '% <span style="float:right">$' + autoAmt.toLocaleString() + '</span><br>';
            if (eqAmt > 0) eIns += 'Equip/Inland ' + eqPct + '% <span style="float:right">$' + eqAmt.toLocaleString() + '</span><br>';
            eIns += '</div>';
            if (equipLines.length && allLines.length > 1) allLines[1] += eIns;
            else if (allLines.length) allLines[allLines.length - 1] += eIns;
            total += equipInsTotal;
          }
          document.getElementById('ins-amount').textContent = insAmt > 0 ? '+$' + insAmt.toLocaleString() : '';

          /* Discount */
          var discPct  = Math.min(100, Math.max(0, parseFloat(document.getElementById('disc-pct').value) || 0));
          var subtotal = total;
          var discAmt  = discPct > 0 ? Math.round(subtotal * discPct / 100) : 0;
          var finalTotal = subtotal - discAmt;

          document.getElementById('calc-breakdown').innerHTML = allLines.join(sep);

          /* Show/hide subtotal + discount rows */
          var subRow  = document.getElementById('subtotal-row');
          var discRow = document.getElementById('discount-row');
          var discAmtEl = document.getElementById('disc-amount');
          if (discPct > 0) {
            subRow.style.display  = 'block';
            discRow.style.display = 'block';
            document.getElementById('calc-subtotal').textContent = '$' + subtotal.toLocaleString();
            document.getElementById('disc-label').textContent    = discPct + '% rate discount';
            document.getElementById('disc-line').textContent     = '\u2212$' + discAmt.toLocaleString();
            document.getElementById('total-label').textContent   = 'Customer Price';
            discAmtEl.textContent  = '\u2212$' + discAmt.toLocaleString() + ' (' + discPct + '% off)';
            discAmtEl.style.display = 'inline';
          } else {
            subRow.style.display  = 'none';
            discRow.style.display = 'none';
            document.getElementById('total-label').textContent = 'Estimated Total';
            discAmtEl.style.display = 'none';
          }

          /* Emergency label */
          var durLabel = h === 4 ? 'Half Day (4 hr)' : h === 8 ? 'Full Day (8 hr)' : 'Custom (' + h + ' hr)';
          if (isEmergency) durLabel += ' \u2014 EMERGENCY 1.5\u00D7';
          if (h > 8) durLabel += ' \u2014 OT after 8hrs @ 1.5\u00D7';

          /* Minimum charge */
          var belowMin = finalTotal > 0 && finalTotal < MIN_CHARGE;
          if (belowMin) finalTotal = MIN_CHARGE;

          document.getElementById('calc-dur-note').textContent = durLabel;
          document.getElementById('calc-total').textContent = '$' + finalTotal.toLocaleString();

          /* Min charge notice */
          var minEl = document.getElementById('min-notice');
          if (minEl) minEl.style.display = belowMin ? 'block' : 'none';

          /* Partnering Arborist Profit — applied after the total */
          var profitPct = Math.max(0, parseFloat(document.getElementById('profit-pct').value) || 0);
          var profitAmt = profitPct > 0 ? Math.round(finalTotal * profitPct / 100) : 0;
          var clientTotal = finalTotal + profitAmt;
          var profitAmtEl = document.getElementById('profit-amount');
          var clientQuoteEl = document.getElementById('client-quote');
          document.getElementById('profit-dollar').textContent = profitAmt > 0 ? '= $' + profitAmt.toLocaleString() : '';
          if (profitPct > 0) {
            profitAmtEl.textContent = '+$' + profitAmt.toLocaleString();
            profitAmtEl.style.display = 'inline';
            clientQuoteEl.style.display = 'block';
            document.getElementById('client-total').textContent = '$' + clientTotal.toLocaleString();
            document.getElementById('profit-earned').textContent = '$' + profitAmt.toLocaleString();
          } else {
            profitAmtEl.style.display = 'none';
            clientQuoteEl.style.display = 'none';
          }
        }

        /* ── Submit for Approval ──────────────────────────────── */
        function submitEstimate() {
          var name = document.getElementById('sub-name').value.trim();
          var phone = document.getElementById('sub-phone').value.trim();
          var email = document.getElementById('sub-email').value.trim();
          var company = document.getElementById('sub-company').value.trim();
          var jobDate = document.getElementById('sub-date').value;
          var notes = document.getElementById('sub-notes').value.trim();
          var errEl = document.getElementById('submit-error');
          var successEl = document.getElementById('submit-success');

          /* Validation */
          if (!name || !phone || !email) {
            errEl.textContent = 'Please fill in name, phone, and email.';
            errEl.style.display = 'block';
            return;
          }
          errEl.style.display = 'none';

          var breakdown = document.getElementById('calc-breakdown').innerText;
          var total = document.getElementById('calc-total').textContent;
          var durNote = document.getElementById('calc-dur-note').textContent;
          var addr = document.getElementById('job-address').value || 'Not specified';
          var clientTotal = document.getElementById('client-total') ? document.getElementById('client-total').textContent : '';
          var profitEarned = document.getElementById('profit-earned') ? document.getElementById('profit-earned').textContent : '';

          var message = 'ESTIMATE SUBMISSION'
            + '\\n\\nFrom: ' + name
            + (company ? ' (' + company + ')' : '')
            + '\\nPhone: ' + phone
            + '\\nEmail: ' + email
            + (jobDate ? '\\nRequested Date: ' + jobDate : '')
            + '\\nJob Address: ' + addr
            + '\\nDuration: ' + durNote
            + (notes ? '\\n\\nNotes: ' + notes : '')
            + '\\n\\n--- BREAKDOWN ---\\n' + breakdown
            + '\\n\\nOUR COST: ' + total;
          if (clientTotal) message += '\\nQUOTE TO CLIENT: ' + clientTotal;
          if (profitEarned) message += '\\nARBORIST PROFIT: ' + profitEarned;

          var btn = document.getElementById('submit-btn');
          btn.textContent = 'Sending...';
          btn.disabled = true;

          fetch('https://formsubmit.co/ajax/info@peekskilltree.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              _subject: 'Estimate for Approval - ' + name + (company ? ' / ' + company : '') + ' - ' + addr,
              _replyto: email,
              name: name,
              company: company,
              phone: phone,
              email: email,
              job_date: jobDate,
              job_address: addr,
              notes: notes,
              estimate: message
            })
          })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            btn.style.display = 'none';
            successEl.style.display = 'block';
          })
          .catch(function() {
            btn.textContent = 'Failed - try again';
            btn.disabled = false;
          });
        }

        function formatMins(m) {
          if (m < 60) return m + ' min';
          var h = Math.floor(m / 60), rm = m % 60;
          return h + 'h ' + (rm > 0 ? rm + 'm' : '');
        }

        /* ── Leaflet lazy loader ─────────────────────────────────── */
        function loadLeaflet(cb) {
          if (leafletReady) { cb(); return; }
          var css = document.createElement('link');
          css.rel = 'stylesheet';
          css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(css);
          var js = document.createElement('script');
          js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          js.onload = function() { leafletReady = true; cb(); };
          document.head.appendChild(js);
        }

        /* ── Travel calculator ───────────────────────────────────── */
        function calcTravel() {
          var addr = document.getElementById('job-address').value.trim();
          if (!addr) return;

          var btn = document.getElementById('travel-btn');
          btn.textContent = 'Calculating\u2026';
          btn.disabled = true;
          document.getElementById('travel-error').style.display  = 'none';
          document.getElementById('travel-result').style.display = 'none';

          /* Step 1: Geocode with Nominatim */
          fetch('https://nominatim.openstreetmap.org/search?q='
            + encodeURIComponent(addr) + '&format=json&limit=1&countrycodes=us',
            { headers: { 'Accept-Language': 'en' } })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (!data.length) throw new Error('Address not found. Try a city name or full address.');
            var jLat = parseFloat(data[0].lat), jLng = parseFloat(data[0].lon);

            /* Step 2: Route via OSRM (free, no key) */
            return fetch('https://router.project-osrm.org/route/v1/driving/'
              + BASE_LNG + ',' + BASE_LAT + ';'
              + jLng + ',' + jLat
              + '?overview=full&geometries=geojson')
            .then(function(r) { return r.json(); })
            .then(function(rd) {
              return { lat: jLat, lng: jLng, route: rd.routes[0] };
            });
          })
          .then(function(res) {
            travelMins = Math.ceil(res.route.duration / 60);
            travelMiles = Math.round(res.route.distance * 0.000621371);
            var miles = travelMiles;

            /* Step 3: Draw map with Leaflet */
            loadLeaflet(function() {
              var mapEl = document.getElementById('travel-map');
              mapEl.style.display = 'block';

              if (!travelMap) {
                travelMap = L.map('travel-map', { scrollWheelZoom: false });
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  { attribution: '&copy; OpenStreetMap' }).addTo(travelMap);
              }
              if (routeLayer) travelMap.removeLayer(routeLayer);

              var coords = res.route.geometry.coordinates.map(function(c){ return [c[1],c[0]]; });
              var greenIcon = { radius:9, fillColor:'#2d6a2d', color:'#fff', weight:2, fillOpacity:1 };
              var redIcon   = { radius:9, fillColor:'#c0392b', color:'#fff', weight:2, fillOpacity:1 };

              routeLayer = L.layerGroup([
                L.polyline(coords, { color:'#2d6a2d', weight:5, opacity:.8 }),
                L.circleMarker([BASE_LAT, BASE_LNG], greenIcon)
                  .bindPopup('<strong>Second Nature</strong><br>1 Highland Industrial Park<br>Peekskill, NY 10566'),
                L.circleMarker([res.lat, res.lng], redIcon)
                  .bindPopup('<strong>Job Site</strong>')
              ]).addTo(travelMap);
              travelMap.fitBounds(L.polyline(coords).getBounds(), { padding:[24,24] });
            });

            /* Step 4: Show summary */
            var rtMins = travelMins * 2;
            document.getElementById('travel-summary').textContent =
              travelMins + ' min each way  \u00b7  ' + formatMins(rtMins) + ' round trip  \u00b7  ' + miles + ' mi';
            document.getElementById('travel-detail').textContent =
              'Travel billed at crew hourly rate \u00b7 updates with crew selection';
            document.getElementById('travel-result').style.display = 'block';

            calcUpdate();
          })
          .catch(function(e) {
            travelMins = 0;
            document.getElementById('travel-error').textContent = e.message || 'Could not calculate route. Check the address and try again.';
            document.getElementById('travel-error').style.display = 'block';
          })
          .finally(function() {
            btn.textContent = 'Calculate';
            btn.disabled = false;
          });
        }

        /* custom hours live update */
        document.getElementById('custom-hrs').addEventListener('input', function() {
          if (durHours === 'custom') calcUpdate();
        });

        /* Auto-select Tree Removal preset on load */
        document.querySelector('.preset-btn').click();
      </script>
      <!-- ── End Calculator ─────────────────────────────────────────── -->

      <!-- Actions -->
      <div style="display:flex;gap:.75rem;margin-top:1.25rem;flex-wrap:wrap;justify-content:center;">
        <button onclick="window.print()" style="padding:.55rem 1.5rem;background:var(--white);border:2px solid var(--border);border-radius:8px;cursor:pointer;font-size:.9rem;font-weight:600;">&#128424; Print Quote</button>
        <button onclick="document.getElementById('submit-form').style.display=document.getElementById('submit-form').style.display==='none'?'block':'none'" style="padding:.55rem 1.5rem;background:#2c5f3f;color:white;border:none;border-radius:8px;cursor:pointer;font-size:.9rem;font-weight:600;">&#9993; Submit for Approval</button>
        <a href="tel:914-391-5233" style="display:inline-block;background:var(--green-dark);color:var(--white);font-weight:700;font-size:1rem;padding:.55rem 1.5rem;border-radius:8px;text-decoration:none;">&#9742; (914) 391-5233</a>
      </div>

      <!-- Submit Form -->
      <div id="submit-form" style="display:none;margin-top:1rem;background:var(--white);border:2px solid var(--green-dark);border-radius:10px;overflow:hidden;">
        <div style="background:var(--green-dark);color:var(--white);padding:.7rem 1rem;font-weight:700;font-size:.92rem;">&#9993; Submit Estimate for Approval</div>
        <div style="padding:1.25rem;">
          <p style="font-size:.85rem;color:var(--text-light);margin-bottom:1rem;">Fill in your details below. The estimate breakdown will be sent to Second Nature for review.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;">
            <div>
              <label style="font-size:.8rem;font-weight:600;display:block;margin-bottom:.25rem;">Your Name *</label>
              <input type="text" id="sub-name" required placeholder="Full name"
                style="width:100%;padding:.5rem .7rem;border:2px solid var(--border);border-radius:8px;font-size:.95rem;">
            </div>
            <div>
              <label style="font-size:.8rem;font-weight:600;display:block;margin-bottom:.25rem;">Company</label>
              <input type="text" id="sub-company" placeholder="Company name"
                style="width:100%;padding:.5rem .7rem;border:2px solid var(--border);border-radius:8px;font-size:.95rem;">
            </div>
            <div>
              <label style="font-size:.8rem;font-weight:600;display:block;margin-bottom:.25rem;">Phone *</label>
              <input type="tel" id="sub-phone" required placeholder="(914) 555-1234"
                style="width:100%;padding:.5rem .7rem;border:2px solid var(--border);border-radius:8px;font-size:.95rem;">
            </div>
            <div>
              <label style="font-size:.8rem;font-weight:600;display:block;margin-bottom:.25rem;">Email *</label>
              <input type="email" id="sub-email" required placeholder="you@company.com"
                style="width:100%;padding:.5rem .7rem;border:2px solid var(--border);border-radius:8px;font-size:.95rem;">
            </div>
          </div>
          <div style="margin-top:.75rem;">
            <label style="font-size:.8rem;font-weight:600;display:block;margin-bottom:.25rem;">Job Date (if known)</label>
            <input type="date" id="sub-date"
              style="width:100%;max-width:220px;padding:.5rem .7rem;border:2px solid var(--border);border-radius:8px;font-size:.95rem;">
          </div>
          <div style="margin-top:.75rem;">
            <label style="font-size:.8rem;font-weight:600;display:block;margin-bottom:.25rem;">Notes</label>
            <textarea id="sub-notes" rows="3" placeholder="Job details, special requirements, access notes..."
              style="width:100%;padding:.5rem .7rem;border:2px solid var(--border);border-radius:8px;font-size:.95rem;resize:vertical;font-family:inherit;"></textarea>
          </div>
          <div id="submit-error" style="display:none;color:#c0392b;font-size:.85rem;margin-top:.5rem;"></div>
          <div id="submit-success" style="display:none;background:#e8f5e9;border:1px solid #4caf50;border-radius:8px;padding:.75rem 1rem;margin-top:.75rem;font-size:.9rem;color:#2e7d32;font-weight:600;">&#10003; Estimate submitted! We&rsquo;ll review and get back to you within 2 hours during business hours.</div>
          <button id="submit-btn" onclick="submitEstimate()" style="margin-top:1rem;width:100%;padding:.7rem;background:var(--green-dark);color:var(--white);border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:700;">Send Estimate for Approval</button>
        </div>
      </div>

      <!-- Calculator Nav -->
      <div style="display:flex;gap:0;background:var(--bg-light);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-top:1.25rem;">
        <a href="rates.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:700;text-decoration:none;color:var(--white);background:var(--green-dark);">Rates</a>
        <a href="estimate.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Field Estimate</a>
        <a href="breakeven.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Break-Even</a>
        <a href="roi.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Ad ROI</a>
      </div>

      <!-- Rate date -->
      <p style="text-align:center;font-size:.78rem;color:var(--text-light);margin-top:.75rem;">Rates current as of March 2026. Subject to change &mdash; call to confirm.</p>

      <!-- Compact terms -->
      <div style="margin-top:.75rem;padding:.9rem 1.1rem;background:var(--bg-light);border-radius:8px;font-size:.84rem;color:var(--text-light);line-height:1.7;">
        <strong style="color:var(--text);">Terms:</strong> $500 minimum call-out &bull; Mon&ndash;Sat (emergency Sun case-by-case) &bull; Hours beyond 8 billed at 1.5&times; &bull; Westchester, Putnam &amp; Southern Dutchess &bull; Payment due on booking or within 48 hrs &bull; Our jobs come first; same/next-day when schedule permits.
      </div>

      <!-- Insurance & Coverage Info (collapsible) -->
      <div style="margin-top:1rem;border:1px solid var(--border);border-radius:10px;overflow:hidden;">
        <div onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=this.nextElementSibling.style.display==='none'?'\\u25B6':'\\u25BC';"
          style="background:var(--green-dark);color:var(--white);padding:.7rem 1rem;cursor:pointer;font-weight:700;font-size:.88rem;display:flex;justify-content:space-between;align-items:center;">
          <span>&#128737; Insurance, Licensing &amp; Requirements</span>
          <span class="arrow" style="font-size:.7rem;">&#9654;</span>
        </div>
        <div style="display:none;padding:1rem;font-size:.86rem;color:var(--text);line-height:1.7;">

          <h3 style="font-size:.92rem;margin:0 0 .5rem;color:var(--green-dark);">Our Coverage</h3>
          <table style="width:100%;font-size:.84rem;border-collapse:collapse;margin-bottom:1rem;">
            <tr style="border-bottom:1px solid var(--border);"><td style="padding:.4rem .5rem;font-weight:600;">General Liability</td><td style="padding:.4rem .5rem;">$1M per occurrence / $2M aggregate</td></tr>
            <tr style="border-bottom:1px solid var(--border);"><td style="padding:.4rem .5rem;font-weight:600;">Workers&rsquo; Comp</td><td style="padding:.4rem .5rem;">NY State compliant &mdash; NYSIF Class 0106</td></tr>
            <tr style="border-bottom:1px solid var(--border);"><td style="padding:.4rem .5rem;font-weight:600;">Commercial Auto</td><td style="padding:.4rem .5rem;">All fleet vehicles covered, $1M CSL</td></tr>
            <tr style="border-bottom:1px solid var(--border);"><td style="padding:.4rem .5rem;font-weight:600;">Disability / PFL</td><td style="padding:.4rem .5rem;">NY State compliant</td></tr>
            <tr style="border-bottom:1px solid var(--border);"><td style="padding:.4rem .5rem;font-weight:600;">Westchester License</td><td style="padding:.4rem .5rem;">WC-32079</td></tr>
            <tr style="border-bottom:1px solid var(--border);"><td style="padding:.4rem .5rem;font-weight:600;">Putnam License</td><td style="padding:.4rem .5rem;">PC-50644</td></tr>
            <tr><td style="padding:.4rem .5rem;font-weight:600;">COI Request</td><td style="padding:.4rem .5rem;">Available within 1 business day &mdash; call <a href="tel:914-391-5233">(914) 391-5233</a></td></tr>
          </table>
          <p style="font-size:.82rem;color:var(--text-light);margin-bottom:1rem;">We can provide Additional Insured endorsement for qualifying contracts.</p>

          <h3 style="font-size:.92rem;margin:0 0 .5rem;color:var(--green-dark);">What We Require Before Dispatch</h3>
          <ul style="padding-left:1.25rem;margin-bottom:1rem;font-size:.84rem;">
            <li style="margin-bottom:.3rem;"><strong>General Liability COI</strong> &mdash; min $1M per occurrence, Second Nature listed as Additional Insured</li>
            <li style="margin-bottom:.3rem;"><strong>Workers&rsquo; Comp COI</strong> &mdash; current NY State certificate, NY listed in 3A</li>
            <li style="margin-bottom:.3rem;"><strong>Commercial Auto</strong> &mdash; min $500K CSL for any vehicles on site</li>
            <li style="margin-bottom:.3rem;"><strong>Project address + scope</strong> &mdash; required before crew dispatch</li>
          </ul>
          <p style="font-size:.82rem;color:#c0392b;font-weight:600;margin-bottom:1rem;">All certificates due 24 hours before job start. No cert = no crew.</p>

          <h3 style="font-size:.92rem;margin:0 0 .5rem;color:var(--green-dark);">NY Legal Notes</h3>
          <ul style="padding-left:1.25rem;font-size:.82rem;color:var(--text-light);">
            <li style="margin-bottom:.3rem;"><strong>NY Construction Fair Play Act</strong> &mdash; all workers presumed employees unless properly documented as independent contractors</li>
            <li style="margin-bottom:.3rem;"><strong>NYSIF Monitoring</strong> &mdash; subcontractors without WC coverage will be charged back to your policy in audit</li>
            <li style="margin-bottom:.3rem;"><strong>WC Class Code 0106</strong> &mdash; Tree Pruning, Spraying, Repairing. ~$9/$100 payroll avg. Hazard Group F.</li>
            <li style="margin-bottom:.3rem;"><strong>HIC License</strong> &mdash; required for residential tree work in Westchester &amp; Putnam counties</li>
          </ul>
        </div>
      </div>

    </div>
  </section>

  <!-- Industry Rate Sources (collapsible) -->
  <section style="background:var(--bg-light);padding:1.5rem 0;">
    <div class="container" style="max-width:800px;">
      <div onclick="var el=document.getElementById('industry-rates-content');el.style.display=el.style.display==='none'?'grid':'none';this.querySelector('.ir-arrow').textContent=el.style.display==='none'?'\\u25B6':'\\u25BC';"
        style="background:var(--green-dark);color:var(--white);padding:.7rem 1rem;font-weight:700;font-size:.95rem;text-transform:uppercase;letter-spacing:.07em;cursor:pointer;display:flex;justify-content:space-between;align-items:center;border-radius:10px;">
        <span>Industry Rate Sources</span>
        <span class="ir-arrow" style="font-size:.7rem;">&#9654;</span>
      </div>
      <div id="industry-rates-content" style="display:none;gap:1rem;margin-top:1rem;">
        <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:1rem 1.25rem;">
          <h3 style="font-size:.95rem;color:var(--green-dark);margin:0 0 .5rem;">Labor Rates</h3>
          <ul style="list-style:none;padding:0;margin:0;font-size:.85rem;color:var(--text);">
            <li style="padding:.35rem 0;border-bottom:1px solid var(--bg-light);">NY tree trimmers avg <strong>$29.90/hr</strong> (national median $24.25/hr) &mdash; <a href="https://www.bls.gov/oes/current/oes373013.htm" target="_blank" rel="noopener" style="color:var(--green-dark);">BLS Occupational Employment Stats</a></li>
            <li style="padding:.35rem 0;border-bottom:1px solid var(--bg-light);">Arborist avg <strong>$29.17/hr</strong>, range $22&ndash;$33/hr &mdash; <a href="https://www.ziprecruiter.com/Salaries/Arborist-Salary" target="_blank" rel="noopener" style="color:var(--green-dark);">ZipRecruiter 2026</a></li>
            <li style="padding:.35rem 0;">Tree service contractor billing rates <strong>$75&ndash;$175/hr</strong> &mdash; <a href="https://homeguide.com/costs/tree-trimming-cost" target="_blank" rel="noopener" style="color:var(--green-dark);">HomeGuide</a></li>
          </ul>
        </div>
        <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:1rem 1.25rem;">
          <h3 style="font-size:.95rem;color:var(--green-dark);margin:0 0 .5rem;">Job Pricing</h3>
          <ul style="list-style:none;padding:0;margin:0;font-size:.85rem;color:var(--text);">
            <li style="padding:.35rem 0;border-bottom:1px solid var(--bg-light);">Tree removal avg <strong>$400&ndash;$1,200</strong> per tree, up to $3,500+ for large/difficult &mdash; <a href="https://www.angi.com/articles/how-much-does-tree-removal-cost.htm" target="_blank" rel="noopener" style="color:var(--green-dark);">Angi</a></li>
            <li style="padding:.35rem 0;border-bottom:1px solid var(--bg-light);">Tree trimming avg <strong>$430&ndash;$640</strong> per tree &mdash; <a href="https://www.lawnstarter.com/blog/cost/tree-trimming-price/" target="_blank" rel="noopener" style="color:var(--green-dark);">LawnStarter</a></li>
            <li style="padding:.35rem 0;">Stump removal avg <strong>$195&ndash;$609</strong> &mdash; <a href="https://www.homeadvisor.com/cost/lawn-and-garden/tree-removal/" target="_blank" rel="noopener" style="color:var(--green-dark);">HomeAdvisor</a></li>
          </ul>
        </div>
        <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:1rem 1.25rem;">
          <h3 style="font-size:.95rem;color:var(--green-dark);margin:0 0 .5rem;">Equipment Rental</h3>
          <ul style="list-style:none;padding:0;margin:0;font-size:.85rem;color:var(--text);">
            <li style="padding:.35rem 0;border-bottom:1px solid var(--bg-light);">Bucket truck <strong>$650&ndash;$950/day</strong> &mdash; <a href="https://quipli.com/resources/the-most-rented-pieces-of-construction-equipment/" target="_blank" rel="noopener" style="color:var(--green-dark);">Quipli</a></li>
            <li style="padding:.35rem 0;border-bottom:1px solid var(--bg-light);">12" chipper <strong>~$325/day</strong> &mdash; <a href="https://quipli.com/resources/the-most-rented-pieces-of-construction-equipment/" target="_blank" rel="noopener" style="color:var(--green-dark);">Quipli</a></li>
            <li style="padding:.35rem 0;">Stump grinder <strong>$145&ndash;$225/day</strong> (commercial) &mdash; <a href="https://homeguide.com/costs/stump-grinder-rental-cost" target="_blank" rel="noopener" style="color:var(--green-dark);">HomeGuide</a></li>
          </ul>
        </div>
        <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:1rem 1.25rem;">
          <h3 style="font-size:.95rem;color:var(--green-dark);margin:0 0 .5rem;">Insurance Costs</h3>
          <ul style="list-style:none;padding:0;margin:0;font-size:.85rem;color:var(--text);">
            <li style="padding:.35rem 0;border-bottom:1px solid var(--bg-light);">WC Class Code 0106: <strong>~$7.63 per $100 payroll</strong> (NY) &mdash; <a href="https://www.kickstandinsurance.com/blog/workers-comp-rate-for-landscaping" target="_blank" rel="noopener" style="color:var(--green-dark);">Kickstand Insurance</a></li>
            <li style="padding:.35rem 0;border-bottom:1px solid var(--bg-light);">GL median <strong>$138/mo ($1,651/yr)</strong> at $1M/$2M limits &mdash; <a href="https://www.insureon.com/landscaping-business-insurance/tree-service/cost" target="_blank" rel="noopener" style="color:var(--green-dark);">Insureon</a></li>
            <li style="padding:.35rem 0;border-bottom:1px solid var(--bg-light);">Full bundle (WC + GL + Auto): <strong>$489/mo ($5,869/yr)</strong> &mdash; <a href="https://www.moneygeek.com/insurance/business/contractor/tree-service/cost/" target="_blank" rel="noopener" style="color:var(--green-dark);">MoneyGeek</a></li>
            <li style="padding:.35rem 0;">Commercial auto avg <strong>$204/mo ($2,452/yr)</strong> &mdash; <a href="https://www.insureon.com/landscaping-business-insurance/tree-service/cost" target="_blank" rel="noopener" style="color:var(--green-dark);">Insureon</a></li>
          </ul>
        </div>
        <div style="background:var(--white);border:1px solid var(--border);border-radius:10px;padding:1rem 1.25rem;">
          <h3 style="font-size:.95rem;color:var(--green-dark);margin:0 0 .5rem;">Industry Margins</h3>
          <ul style="list-style:none;padding:0;margin:0;font-size:.85rem;color:var(--text);">
            <li style="padding:.35rem 0;border-bottom:1px solid var(--bg-light);">Net profit margins <strong>10&ndash;20%</strong> (well-run companies 20%+) &mdash; <a href="https://www.arbornote.com/how-to-price-your-tree-service-right-expert-guide-to-profitable-margins/" target="_blank" rel="noopener" style="color:var(--green-dark);">ArborNote</a></li>
            <li style="padding:.35rem 0;border-bottom:1px solid var(--bg-light);">Removal margins <strong>10&ndash;20%</strong>, pruning <strong>15&ndash;25%</strong>, emergency/storm <strong>25&ndash;40%</strong> &mdash; <a href="https://www.arbornote.com/how-to-price-your-tree-service-right-expert-guide-to-profitable-margins/" target="_blank" rel="noopener" style="color:var(--green-dark);">ArborNote</a></li>
            <li style="padding:.35rem 0;border-bottom:1px solid var(--bg-light);">U.S. tree services market <strong>$35.6 billion</strong> (2024), growing 5.8%/yr &mdash; <a href="https://turfmagazine.com/the-profitability-of-tree-care-services" target="_blank" rel="noopener" style="color:var(--green-dark);">Turf Magazine</a></li>
            <li style="padding:.35rem 0;">TCIA estimating: total expenses + target profit / crew hours = hourly rate &mdash; <a href="https://tcimag.tcia.org/sales-marketing/estimating-simplified/" target="_blank" rel="noopener" style="color:var(--green-dark);">TCIA Magazine</a></li>
          </ul>
        </div>
      </div>
      <p style="text-align:center;font-size:.78rem;color:var(--text-light);margin-top:1rem;">Sources current as of March 2026. Rates vary by region, company size, and job complexity.</p>
    </div>
  </section>
''' + FOOTER

write_page("rates.html", sub_page)
print("Created rates.html")

# ============================================================
# BREAK-EVEN CALCULATOR PAGE
# ============================================================
be_page = header(
    "Break-Even Calculator | Second Nature Tree Service",
    "Monthly break-even calculator for tree service operations. See how many work days you need to cover your costs.",
    "breakeven.html", None,
    "Break-Even Calculator",
    '<a href="index.html">Home</a> <span>&raquo;</span> Break-Even',
    "",
    breadcrumbs=[{"name": "Home", "url": ""}, {"name": "Break-Even Calculator", "url": "breakeven.html"}]
)
be_page = be_page.replace(
    '<meta name="robots" content="index, follow, max-image-preview:large">',
    '<meta name="robots" content="noindex, nofollow">'
)
be_page += '''
  <style>
    .top-bar {display:none !important;}
    .page-hero {padding:1rem 0 .5rem !important;min-height:0 !important;background:var(--green-dark) !important;}
    .page-hero-content h1 {font-size:1.2rem !important;margin-bottom:0 !important;}
    .breadcrumb {display:none !important;}
    .section {padding-top:.75rem !important;padding-bottom:1rem !important;}
    @media(max-width:600px){
      .page-hero {padding:.6rem 0 .3rem !important;}
      .page-hero-content h1 {font-size:1.05rem !important;}
    }
    .be-input {width:90px;padding:.4rem .5rem;border:2px solid var(--border);border-radius:8px;font-size:1rem;font-weight:700;text-align:right;font-family:inherit;}
    .be-input:focus {border-color:var(--green-dark);outline:none;}
    .be-row {display:flex;justify-content:space-between;align-items:center;padding:.6rem .75rem;border-bottom:1px solid var(--border);}
    .be-row:last-child {border-bottom:none;}
    .be-row label {font-size:.95rem;display:flex;align-items:center;gap:.4rem;}
    .be-section {background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1rem;}
    .be-section-hdr {padding:.55rem 1rem;font-weight:700;font-size:.85rem;text-transform:uppercase;letter-spacing:.07em;color:var(--white);}
    .be-subtotal {text-align:right;font-weight:700;font-size:.95rem;padding:.5rem .75rem;background:rgba(0,0,0,.02);border-top:1px solid var(--border);}
    @media(max-width:600px){
      .be-input {font-size:16px !important;width:85px !important;}
      .be-row {padding:.75rem .6rem !important;}
      .be-row label {font-size:1rem;}
      .job-rev, .job-labor {font-size:16px !important;}
    }
  </style>
  <section class="section">
    <div class="container" style="max-width:800px;">

      <!-- Calculator Nav (top) -->
      <div style="display:flex;gap:0;background:var(--bg-light);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1rem;">
        <a href="rates.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);">Rates</a>
        <a href="estimate.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Field Estimate</a>
        <a href="breakeven.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:700;text-decoration:none;color:var(--white);background:var(--green-dark);border-left:1px solid var(--border);">Break-Even</a>
        <a href="roi.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Ad ROI</a>
      </div>

      <p style="color:var(--text-light);margin-bottom:.75rem;font-size:.9rem;">Enter your monthly costs. See exactly how many work days it takes to break even. <a href="rates.html" style="font-weight:600;">Job Cost Calculator &rarr;</a></p>

      <div id="be-wrap" style="background:var(--bg-light);border-radius:12px;padding:1.5rem 1.75rem;border:1px solid var(--border);">

        <!-- Vehicle Payments -->
        <div class="be-section">
          <div class="be-section-hdr" style="background:var(--green-dark);">Vehicle Payments</div>
          <div class="be-row">
            <label>Bucket Truck</label>
            <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-fixed" value="1912" oninput="beCalc()"></div>
          </div>
          <div class="be-row">
            <label>Chip Truck</label>
            <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-fixed" value="0" oninput="beCalc()"></div>
          </div>
          <div class="be-row">
            <label>Pickup / Crew Truck</label>
            <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-fixed" value="1000" oninput="beCalc()"></div>
          </div>
          <div class="be-subtotal"><span id="sub-vehicles">$2,912</span></div>
        </div>

        <!-- Insurance (Fixed) -->
        <div class="be-section">
          <div class="be-section-hdr" style="background:#c0392b;">Insurance <span style="font-size:.7rem;opacity:.7;">(FIXED &mdash; owed regardless of work)</span></div>
          <div class="be-row">
            <label>General Liability</label>
            <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-fixed" value="750" oninput="beCalc()"></div>
          </div>
          <div class="be-row">
            <label>Commercial Auto</label>
            <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-fixed" value="400" oninput="beCalc()"></div>
          </div>
          <div class="be-row">
            <label>Equipment / Inland Marine</label>
            <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-fixed" value="200" oninput="beCalc()"></div>
          </div>
          <div class="be-row">
            <label>Umbrella / Excess</label>
            <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-fixed" value="0" oninput="beCalc()"></div>
          </div>
          <div class="be-subtotal"><span id="sub-insurance">$1,350</span></div>
        </div>

        <!-- Fixed Overhead -->
        <div class="be-section">
          <div class="be-section-hdr" style="background:#4a7c59;">Overhead <span style="font-size:.7rem;opacity:.7;">(FIXED &mdash; owed regardless of work)</span></div>
          <div class="be-row">
            <label>Phone / Software / Subscriptions</label>
            <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-fixed" value="200" oninput="beCalc()"></div>
          </div>
          <div class="be-row">
            <label>Yard / Storage Rent</label>
            <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-fixed" value="0" oninput="beCalc()"></div>
          </div>
          <div class="be-row">
            <label>Marketing / Advertising</label>
            <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-fixed" value="200" oninput="beCalc()"></div>
          </div>
          <div class="be-row">
            <label>Accounting / Legal</label>
            <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-fixed" value="250" oninput="beCalc()"></div>
          </div>
          <div class="be-row">
            <label>Other</label>
            <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-fixed" value="0" oninput="beCalc()"></div>
          </div>
          <div class="be-row">
            <label>Health Insurance</label>
            <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-fixed" value="0" oninput="beCalc()"></div>
          </div>
          <div class="be-subtotal"><span id="sub-overhead">$650</span></div>
        </div>

        <!-- TOTAL FIXED -->
        <div style="background:var(--green-dark);border-radius:10px;padding:.85rem 1.25rem;color:var(--white);margin-top:.5rem;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:.5rem;">
            <div>
              <span style="font-weight:700;font-size:1rem;">Fixed Monthly Costs</span>
              <div style="font-size:.75rem;opacity:.6;">Owed even with zero jobs</div>
            </div>
            <span id="be-fixed-total" style="font-size:1.8rem;font-weight:800;letter-spacing:-.02em;">$4,912</span>
          </div>
        </div>

        <!-- VARIABLE COSTS PER JOB -->
        <div style="margin-top:1.25rem;">
          <div class="be-section">
            <div class="be-section-hdr" style="background:#b5610a;">Variable Costs <span style="font-size:.7rem;opacity:.7;">(PER JOB &mdash; only when working)</span></div>
            <div class="be-row">
              <label>Workers&rsquo; Comp <span style="font-size:.75rem;color:var(--text-light);">(% of labor)</span></label>
              <div style="display:flex;align-items:center;gap:.3rem;"><input type="number" class="be-input be-var-pct" id="be-wc-pct" value="15" style="width:55px;" oninput="beCalc()"><span>%</span></div>
            </div>
            <div class="be-row">
              <label>Payroll Tax <span style="font-size:.75rem;color:var(--text-light);">(% of labor)</span></label>
              <div style="display:flex;align-items:center;gap:.3rem;"><input type="number" class="be-input be-var-pct" id="be-tax-pct" value="8" style="width:55px;" oninput="beCalc()"><span>%</span></div>
            </div>
            <div class="be-row">
              <label>Disability / PFL <span style="font-size:.75rem;color:var(--text-light);">(% of labor)</span></label>
              <div style="display:flex;align-items:center;gap:.3rem;"><input type="number" class="be-input be-var-pct" id="be-dis-pct" value="2" style="width:55px;" oninput="beCalc()"><span>%</span></div>
            </div>
            <div class="be-row">
              <label>Fuel / Diesel <span style="font-size:.75rem;color:var(--text-light);">(per job avg)</span></label>
              <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-var-flat" id="be-fuel" value="75" oninput="beCalc()"></div>
            </div>
            <div class="be-row">
              <label>Consumables <span style="font-size:.75rem;color:var(--text-light);">(per job avg)</span></label>
              <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-var-flat" id="be-cons" value="25" oninput="beCalc()"></div>
            </div>
            <div class="be-row">
              <label>Repairs / Wear <span style="font-size:.75rem;color:var(--text-light);">(per job avg)</span></label>
              <div style="display:flex;align-items:center;gap:.3rem;"><span>$</span><input type="number" class="be-input be-var-flat" id="be-repair" value="50" oninput="beCalc()"></div>
            </div>
          </div>
          <div style="font-size:.8rem;color:var(--text-light);margin-top:.4rem;padding:0 .5rem;">These costs are <strong>$0 with no work</strong>. They get added automatically to each job&rsquo;s cost based on that job&rsquo;s labor amount.</div>
        </div>

        <!-- JOB-BY-JOB P&L TABLE -->
        <div style="margin-top:1.5rem;padding-top:1.5rem;border-top:2px dashed var(--border);">
          <div style="font-weight:700;font-size:1rem;margin-bottom:.25rem;">Job-by-Job P&amp;L</div>
          <p style="font-size:.88rem;color:var(--text-light);margin-bottom:.5rem;">Enter each job&rsquo;s revenue and costs as you book them. Watch the running total climb from red to green. Use the <a href="rates.html" style="font-weight:600;">Rates</a> to price each job.</p>

          <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
            <table id="be-table" style="width:100%;border-collapse:collapse;font-size:.82rem;min-width:520px;">
              <thead>
                <tr style="background:var(--green-dark);color:white;">
                  <th style="padding:.4rem .35rem;text-align:left;font-weight:700;border-radius:6px 0 0 0;font-size:.7rem;width:50px;"></th>
                  <th style="padding:.4rem .2rem;text-align:center;font-weight:700;font-size:.7rem;">Revenue</th>
                  <th style="padding:.4rem .2rem;text-align:center;font-weight:700;font-size:.7rem;">Labor</th>
                  <th style="padding:.4rem .2rem;text-align:center;font-weight:700;font-size:.7rem;">Overhead</th>
                  <th style="padding:.4rem .2rem;text-align:center;font-weight:700;font-size:.7rem;">Net</th>
                  <th style="padding:.4rem .35rem;text-align:right;font-weight:700;font-size:.7rem;border-radius:0 6px 0 0;">P&amp;L</th>
                </tr>
              </thead>
              <tbody id="be-tbody">
                <tr id="job-row-0" style="background:#fce4e4;border-bottom:2px solid #e8c0c0;">
                  <td style="padding:.4rem .35rem;font-weight:700;font-size:.85rem;white-space:nowrap;">No work</td>
                  <td style="padding:.4rem .2rem;text-align:center;color:#666;">$0</td>
                  <td style="padding:.4rem .2rem;text-align:center;color:#666;">$0</td>
                  <td style="padding:.4rem .2rem;text-align:center;color:#666;">$0</td>
                  <td style="padding:.4rem .2rem;text-align:center;color:#666;">$0</td>
                  <td style="padding:.4rem .35rem;text-align:right;font-weight:700;color:#c0392b;" id="job0-pl">-$4,912</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style="margin-top:.5rem;text-align:center;">
            <button onclick="addJobRow()" style="padding:.4rem 1rem;background:var(--white);border:2px solid var(--border);border-radius:8px;cursor:pointer;font-size:.88rem;font-weight:600;color:var(--green-dark);">+ Add Job</button>
            <button onclick="clearJobs()" style="padding:.4rem 1rem;background:var(--white);border:2px solid var(--border);border-radius:8px;cursor:pointer;font-size:.88rem;color:var(--text-light);margin-left:.4rem;">Clear All</button>
          </div>
        </div>

        <!-- RESULT SUMMARY -->
        <div id="be-result" style="margin-top:1rem;background:linear-gradient(135deg,#1a3c12 0%,#2d5a27 100%);border-radius:12px;padding:1.25rem;color:var(--white);text-align:center;">
          <div style="font-size:.8rem;opacity:.7;text-transform:uppercase;letter-spacing:.1em;margin-bottom:.4rem;">Break-Even Job</div>
          <div style="display:flex;justify-content:center;align-items:baseline;gap:.5rem;">
            <span style="font-size:.9rem;opacity:.7;">Job</span>
            <span id="be-days" style="font-size:3rem;font-weight:900;line-height:1;">#16</span>
          </div>
          <div id="be-days-label" style="font-size:.85rem;opacity:.7;margin-top:.2rem;">of ~22 jobs/month</div>
          <div style="margin-top:.75rem;display:flex;justify-content:center;gap:1.25rem;flex-wrap:wrap;">
            <div>
              <div style="font-size:.7rem;opacity:.7;text-transform:uppercase;">Running P&amp;L</div>
              <div id="be-remaining" style="font-size:1.2rem;font-weight:700;">—</div>
            </div>
            <div>
              <div style="font-size:.7rem;opacity:.7;text-transform:uppercase;">Total Revenue</div>
              <div id="be-extra" style="font-size:1.2rem;font-weight:700;color:#4ade80;">$0</div>
            </div>
            <div>
              <div style="font-size:.7rem;opacity:.7;text-transform:uppercase;">Total Costs</div>
              <div id="be-annual" style="font-size:1.2rem;font-weight:700;color:#ef4444;">$0</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Calculator Nav -->
      <div style="display:flex;gap:0;background:var(--bg-light);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-top:1.25rem;">
        <a href="rates.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);">Rates</a>
        <a href="estimate.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Field Estimate</a>
        <a href="breakeven.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:700;text-decoration:none;color:var(--white);background:var(--green-dark);border-left:1px solid var(--border);">Break-Even</a>
        <a href="roi.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Ad ROI</a>
      </div>

    </div>
  </section>

  <script>
    var jobCount = 0;

    function getFixed() {
      /* Vehicle payments */
      var vInputs = document.querySelectorAll('.be-section:first-of-type .be-fixed');
      /* Actually just sum all .be-fixed inputs */
      var vehicleTotal = 0, insTotal = 0, overheadTotal = 0;
      var allFixed = document.querySelectorAll('.be-fixed');
      var total = 0;
      /* Count by section: vehicles(0-2), insurance(3-6), overhead(7-12) */
      allFixed.forEach(function(inp, i) {
        var v = parseFloat(inp.value) || 0;
        total += v;
        if (i <= 2) vehicleTotal += v;
        else if (i <= 6) insTotal += v;
        else overheadTotal += v;
      });
      document.getElementById('sub-vehicles').textContent = '$' + vehicleTotal.toLocaleString();
      document.getElementById('sub-insurance').textContent = '$' + insTotal.toLocaleString();
      document.getElementById('sub-overhead').textContent = '$' + overheadTotal.toLocaleString();
      document.getElementById('be-fixed-total').textContent = '$' + total.toLocaleString();
      return total;
    }

    function getVarCosts(laborAmt) {
      /* % based on labor */
      var wcPct  = parseFloat(document.getElementById('be-wc-pct').value) || 0;
      var taxPct = parseFloat(document.getElementById('be-tax-pct').value) || 0;
      var disPct = parseFloat(document.getElementById('be-dis-pct').value) || 0;
      var pctCost = Math.round(laborAmt * (wcPct + taxPct + disPct) / 100);
      /* Flat per-job */
      var fuel   = parseFloat(document.getElementById('be-fuel').value) || 0;
      var cons   = parseFloat(document.getElementById('be-cons').value) || 0;
      var repair = parseFloat(document.getElementById('be-repair').value) || 0;
      return pctCost + fuel + cons + repair;
    }

    function fmt(n) { return (n >= 0 ? '+$' : '-$') + Math.abs(n).toLocaleString(); }

    function addJobRow() {
      jobCount++;
      var tbody = document.getElementById('be-tbody');
      var tr = document.createElement('tr');
      tr.id = 'job-row-' + jobCount;
      tr.dataset.num = jobCount;
      tr.innerHTML = '<td style="padding:.35rem .4rem;font-weight:700;white-space:nowrap;font-size:.82rem;" class="job-label">Job ' + jobCount + '</td>'
        + '<td style="padding:.35rem .2rem;text-align:center;"><input type="number" class="be-input job-rev" value="0" style="width:72px;font-size:16px;text-align:right;color:#2d5a27;" oninput="beCalc()" placeholder="Rev"></td>'
        + '<td style="padding:.35rem .2rem;text-align:center;"><input type="number" class="be-input job-labor" value="0" style="width:72px;font-size:16px;text-align:right;color:#333;" oninput="beCalc()" placeholder="Labor"></td>'
        + '<td style="padding:.35rem .2rem;text-align:center;font-size:.78rem;color:var(--text-light);" class="job-var">$0</td>'
        + '<td style="padding:.35rem .2rem;text-align:center;font-weight:700;font-size:.82rem;" class="job-net">$0</td>'
        + '<td style="padding:.35rem .4rem;text-align:right;font-weight:700;font-size:.88rem;" class="job-pl">-</td>';
      tbody.appendChild(tr);
      beCalc();
      tr.querySelector('.job-rev').focus();
    }

    function clearJobs() {
      jobCount = 0;
      document.getElementById('be-tbody').innerHTML = '';
      beCalc();
    }

    function beCalc() {
      var fixedTotal = getFixed();

      /* Update Job 0 row */
      document.getElementById('job0-pl').textContent = '-$' + fixedTotal.toLocaleString();

      /* Skip row 0 (static), iterate job rows only */
      var rows = document.querySelectorAll('#be-tbody tr:not(#job-row-0)');
      var running = -fixedTotal;
      var beJob = -1;
      var totalRev = 0, totalCost = 0;

      rows.forEach(function(tr, i) {
        var revInput   = tr.querySelector('.job-rev');
        var laborInput = tr.querySelector('.job-labor');
        var varCell    = tr.querySelector('.job-var');
        var netCell    = tr.querySelector('.job-net');
        var plCell     = tr.querySelector('.job-pl');
        if (!revInput) return;

        var rev   = parseFloat(revInput.value) || 0;
        var labor = parseFloat(laborInput.value) || 0;
        var varOH = getVarCosts(labor);
        var cost  = labor + varOH;
        var net   = rev - cost;
        totalRev += rev;
        totalCost += cost;
        running += net;

        /* Variable overhead cell */
        varCell.textContent = varOH > 0 ? '+$' + varOH.toLocaleString() : '$0';

        /* Net cell */
        netCell.textContent = (net >= 0 ? '+$' : '-$') + Math.abs(net).toLocaleString();
        netCell.style.color = net >= 0 ? '#2d5a27' : '#c0392b';

        /* Running P&L */
        plCell.textContent = fmt(running);
        plCell.style.color = running >= 0 ? '#2d5a27' : '#c0392b';

        /* Row color */
        var isBreakEven = (running >= 0 && (running - net) < 0);
        if (isBreakEven && beJob < 0) beJob = i + 1;

        if (rev === 0 && cost === 0) {
          tr.style.background = '#f9f9f9';
          tr.style.borderBottom = '1px solid #eee';
        } else if (isBreakEven) {
          tr.style.background = '#d4edda';
          tr.style.borderBottom = '3px solid #27ae60';
          plCell.style.fontSize = '1rem';
          /* Update label */
          tr.querySelector('.job-label').innerHTML = '&#9733; ' + (i+1) + ' <span style="font-size:.7rem;color:#27ae60;">BE!</span>';
        } else if (running < 0) {
          tr.style.background = i % 2 === 0 ? '#fff5f5' : '#fce4e4';
          tr.style.borderBottom = '1px solid #f0d0d0';
        } else {
          tr.style.background = i % 2 === 0 ? '#f0faf0' : '#e8f5e9';
          tr.style.borderBottom = '1px solid #d0e8d0';
        }
      });

      /* Summary panel */
      var activeJobs = 0;
      rows.forEach(function(tr) {
        var r = parseFloat(tr.querySelector('.job-rev')?.value) || 0;
        var c = parseFloat(tr.querySelector('.job-labor')?.value) || 0;
        if (r > 0 || c > 0) activeJobs++;
      });

      document.getElementById('be-days').textContent = beJob > 0 ? '#' + beJob : (activeJobs > 0 ? 'Not yet' : '—');
      document.getElementById('be-days').style.color = beJob > 0 ? '#ffffff' : '#ef4444';
      document.getElementById('be-days-label').textContent = beJob > 0
        ? (activeJobs + ' jobs entered')
        : (activeJobs > 0 ? activeJobs + ' jobs entered — still in the red' : 'Add jobs below to start tracking');

      document.getElementById('be-remaining').textContent = activeJobs > 0 ? fmt(running) : '—';
      document.getElementById('be-remaining').style.color = running >= 0 ? '#4ade80' : '#ef4444';

      document.getElementById('be-extra').textContent = '$' + totalRev.toLocaleString();
      document.getElementById('be-extra').style.color = '#4ade80';
      document.getElementById('be-annual').textContent = '$' + (totalCost + fixedTotal).toLocaleString();
      document.getElementById('be-annual').style.color = '#ef4444';

      var panel = document.getElementById('be-result');
      if (activeJobs === 0) {
        panel.style.background = 'linear-gradient(135deg,#333 0%,#555 100%)';
      } else if (running < 0) {
        panel.style.background = 'linear-gradient(135deg,#7f1d1d 0%,#c0392b 100%)';
      } else {
        panel.style.background = 'linear-gradient(135deg,#1a3c12 0%,#2d5a27 100%)';
      }
    }

    /* Pre-populate with default jobs: $2,500 rev, $880 labor (1 climber + 2 ground) */
    function initJobs() {
      var fixedTotal = getFixed();
      /* Figure out how many jobs needed at default numbers */
      var defRev = 2500, defLabor = 880;
      var defVar = getVarCosts(defLabor);
      var defNet = defRev - defLabor - defVar;
      var needed = defNet > 0 ? Math.ceil(fixedTotal / defNet) : 10;
      /* Always show 15 jobs */
      var total = 15;
      for (var i = 0; i < total; i++) {
        addJobRow();
      }
      /* Fill them all with default values */
      var revs = document.querySelectorAll('.job-rev');
      var labors = document.querySelectorAll('.job-labor');
      for (var i = 0; i < revs.length; i++) {
        revs[i].value = defRev;
        labors[i].value = defLabor;
      }
      beCalc();
    }
    initJobs();
  </script>
''' + FOOTER

be_page = be_page.replace(
    '<meta name="robots" content="index, follow, max-image-preview:large">',
    '<meta name="robots" content="noindex, nofollow">'
)

write_page("breakeven.html", be_page)
print("Created breakeven.html")

# ============================================================
# ADVERTISING ROI CALCULATOR PAGE
# ============================================================
ads_page = header(
    "Advertising ROI Calculator | Second Nature Tree Service",
    "Calculate the return on investment for your tree service advertising spend. Track cost per lead, cost per job, and profit per ad dollar.",
    "roi.html", None,
    "Advertising ROI Calculator",
    '<a href="index.html">Home</a> <span>&raquo;</span> Ad ROI',
    "",
    breadcrumbs=[{"name": "Home", "url": ""}, {"name": "Ad ROI Calculator", "url": "roi.html"}]
)
ads_page = ads_page.replace(
    '<meta name="robots" content="index, follow, max-image-preview:large">',
    '<meta name="robots" content="noindex, nofollow">'
)
ads_page += '''
  <style>
    .top-bar {display:none !important;}
    .page-hero {padding:1rem 0 .5rem !important;min-height:0 !important;background:var(--green-dark) !important;}
    .page-hero-content h1 {font-size:1.2rem !important;margin-bottom:0 !important;}
    .breadcrumb {display:none !important;}
    .section {padding-top:.75rem !important;padding-bottom:1rem !important;}
    @media(max-width:600px){
      .page-hero {padding:.6rem 0 .3rem !important;}
      .page-hero-content h1 {font-size:1.05rem !important;}
    }
    .ad-input {width:90px;padding:.4rem .5rem;border:2px solid var(--border);border-radius:8px;font-size:1rem;font-weight:700;text-align:right;font-family:inherit;}
    .ad-input:focus {border-color:var(--green-dark);outline:none;}
    .ad-row {display:flex;justify-content:space-between;align-items:center;padding:.6rem .75rem;border-bottom:1px solid var(--border);}
    .ad-row:last-child {border-bottom:none;}
    .ad-section {background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1rem;}
    .ad-section-hdr {padding:.55rem 1rem;font-weight:700;font-size:.85rem;text-transform:uppercase;letter-spacing:.07em;color:var(--white);}
    .ad-metric {text-align:center;padding:1rem .5rem;flex:1;min-width:120px;}
    .ad-metric-val {font-size:1.6rem;font-weight:800;line-height:1.2;}
    .ad-metric-label {font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;opacity:.7;margin-top:.2rem;}
    @media(max-width:600px){
      .ad-input {font-size:16px !important;width:85px !important;}
      .ad-row {padding:.75rem .6rem !important;}
      .ad-metric-val {font-size:1.3rem !important;}
      .ad-metric {min-width:90px;padding:.75rem .3rem;}
    }
  </style>
  <section class="section">
    <div class="container" style="max-width:800px;">

      <!-- Calculator Nav (top) -->
      <div style="display:flex;gap:0;background:var(--bg-light);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1rem;">
        <a href="rates.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);">Rates</a>
        <a href="estimate.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Field Estimate</a>
        <a href="breakeven.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Break-Even</a>
        <a href="roi.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:700;text-decoration:none;color:var(--white);background:var(--green-dark);border-left:1px solid var(--border);">Ad ROI</a>
      </div>

      <p style="color:var(--text-light);margin-bottom:.75rem;font-size:.9rem;">Enter your ad spend, leads, and jobs. See exactly what each lead and job costs you &mdash; and whether your ads are profitable.</p>

      <div style="background:var(--bg-light);border-radius:12px;padding:1.5rem 1.75rem;border:1px solid var(--border);">

        <!-- Ad Channels -->
        <div class="ad-section">
          <div class="ad-section-hdr" style="background:#2c5f3f;">
            <span>Monthly Ad Spend by Channel</span>
          </div>
          <div class="ad-row">
            <label style="font-size:.95rem;display:flex;align-items:center;gap:.4rem;">
              <span style="font-size:1.1rem;">&#x1F50D;</span> Google Ads
            </label>
            <div style="display:flex;align-items:center;gap:.5rem;">
              <div style="display:flex;align-items:center;gap:.2rem;"><span>$</span><input type="number" class="ad-input ad-spend" id="ad-google" value="500" oninput="adCalc()"></div>
              <input type="number" class="ad-input" id="leads-google" value="15" style="width:55px;" oninput="adCalc()" title="Leads">
              <span style="font-size:.75rem;color:var(--text-light);">leads</span>
            </div>
          </div>
          <div class="ad-row">
            <label style="font-size:.95rem;display:flex;align-items:center;gap:.4rem;">
              <span style="font-size:1.1rem;">&#x1F4F1;</span> Facebook / Instagram
            </label>
            <div style="display:flex;align-items:center;gap:.5rem;">
              <div style="display:flex;align-items:center;gap:.2rem;"><span>$</span><input type="number" class="ad-input ad-spend" id="ad-fb" value="300" oninput="adCalc()"></div>
              <input type="number" class="ad-input" id="leads-fb" value="8" style="width:55px;" oninput="adCalc()" title="Leads">
              <span style="font-size:.75rem;color:var(--text-light);">leads</span>
            </div>
          </div>
          <div class="ad-row">
            <label style="font-size:.95rem;display:flex;align-items:center;gap:.4rem;">
              <span style="font-size:1.1rem;">&#x1F3E0;</span> Angi / HomeAdvisor
            </label>
            <div style="display:flex;align-items:center;gap:.5rem;">
              <div style="display:flex;align-items:center;gap:.2rem;"><span>$</span><input type="number" class="ad-input ad-spend" id="ad-angi" value="200" oninput="adCalc()"></div>
              <input type="number" class="ad-input" id="leads-angi" value="5" style="width:55px;" oninput="adCalc()" title="Leads">
              <span style="font-size:.75rem;color:var(--text-light);">leads</span>
            </div>
          </div>
          <div class="ad-row">
            <label style="font-size:.95rem;display:flex;align-items:center;gap:.4rem;">
              <span style="font-size:1.1rem;">&#x1F4E3;</span> Yard Signs / Wraps / Print
            </label>
            <div style="display:flex;align-items:center;gap:.5rem;">
              <div style="display:flex;align-items:center;gap:.2rem;"><span>$</span><input type="number" class="ad-input ad-spend" id="ad-print" value="100" oninput="adCalc()"></div>
              <input type="number" class="ad-input" id="leads-print" value="3" style="width:55px;" oninput="adCalc()" title="Leads">
              <span style="font-size:.75rem;color:var(--text-light);">leads</span>
            </div>
          </div>
          <div class="ad-row">
            <label style="font-size:.95rem;display:flex;align-items:center;gap:.4rem;">
              <span style="font-size:1.1rem;">&#x1F4AC;</span> Nextdoor / Thumbtack / Other
            </label>
            <div style="display:flex;align-items:center;gap:.5rem;">
              <div style="display:flex;align-items:center;gap:.2rem;"><span>$</span><input type="number" class="ad-input ad-spend" id="ad-other" value="0" oninput="adCalc()"></div>
              <input type="number" class="ad-input" id="leads-other" value="0" style="width:55px;" oninput="adCalc()" title="Leads">
              <span style="font-size:.75rem;color:var(--text-light);">leads</span>
            </div>
          </div>
          <div style="padding:.5rem .75rem;background:rgba(0,0,0,.02);border-top:1px solid var(--border);display:flex;justify-content:space-between;font-weight:700;font-size:.9rem;">
            <span>Total: <span id="ad-total-spend">$1,100</span></span>
            <span><span id="ad-total-leads">31</span> leads</span>
          </div>
        </div>

        <!-- Conversion & Job Value -->
        <div class="ad-section">
          <div class="ad-section-hdr" style="background:#b5610a;">Conversion &amp; Job Value</div>
          <div class="ad-row">
            <label style="font-size:.95rem;">Close rate <span style="font-size:.8rem;color:var(--text-light);">(% of leads that become jobs)</span></label>
            <div style="display:flex;align-items:center;gap:.3rem;">
              <input type="number" class="ad-input" id="ad-close-rate" value="35" style="width:65px;" oninput="adCalc()">
              <span style="font-weight:700;">%</span>
            </div>
          </div>
          <div class="ad-row">
            <label style="font-size:.95rem;">Average job revenue</label>
            <div style="display:flex;align-items:center;gap:.2rem;"><span>$</span><input type="number" class="ad-input" id="ad-avg-rev" value="2500" oninput="adCalc()"></div>
          </div>
          <div class="ad-row">
            <label style="font-size:.95rem;">Average job cost <span style="font-size:.8rem;color:var(--text-light);">(labor + equip + overhead)</span></label>
            <div style="display:flex;align-items:center;gap:.2rem;"><span>$</span><input type="number" class="ad-input" id="ad-avg-cost" value="1200" oninput="adCalc()"></div>
          </div>
        </div>

        <!-- Organic / Free Leads -->
        <div class="ad-section">
          <div class="ad-section-hdr" style="background:#4a7c59;">Free Leads <span style="font-size:.7rem;opacity:.7;">(no ad cost)</span></div>
          <div class="ad-row">
            <label style="font-size:.95rem;">Google organic / SEO</label>
            <input type="number" class="ad-input ad-free" id="leads-seo" value="10" style="width:55px;" oninput="adCalc()">
          </div>
          <div class="ad-row">
            <label style="font-size:.95rem;">Referrals / word of mouth</label>
            <input type="number" class="ad-input ad-free" id="leads-ref" value="5" style="width:55px;" oninput="adCalc()">
          </div>
          <div class="ad-row">
            <label style="font-size:.95rem;">Repeat customers</label>
            <input type="number" class="ad-input ad-free" id="leads-repeat" value="3" style="width:55px;" oninput="adCalc()">
          </div>
          <div class="ad-row">
            <label style="font-size:.95rem;">Google Business Profile</label>
            <input type="number" class="ad-input ad-free" id="leads-gbp" value="8" style="width:55px;" oninput="adCalc()">
          </div>
          <div style="padding:.5rem .75rem;background:rgba(0,0,0,.02);border-top:1px solid var(--border);font-weight:700;font-size:.9rem;">
            <span id="ad-free-total">26</span> free leads/month <span style="font-weight:400;color:var(--text-light);font-size:.82rem;">&mdash; $0 ad cost</span>
          </div>
        </div>

        <!-- RESULTS DASHBOARD -->
        <div style="background:linear-gradient(135deg,#1a3c12 0%,#2d5a27 100%);border-radius:12px;padding:1.25rem;color:var(--white);margin-top:.5rem;">
          <div style="font-size:.8rem;text-transform:uppercase;letter-spacing:.1em;opacity:.6;margin-bottom:.75rem;text-align:center;">Monthly Ad Performance</div>

          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0;margin-bottom:.75rem;">
            <div class="ad-metric">
              <div class="ad-metric-val" id="r-cpl">$35</div>
              <div class="ad-metric-label">Cost per Lead</div>
            </div>
            <div class="ad-metric">
              <div class="ad-metric-val" id="r-cpj">$101</div>
              <div class="ad-metric-label">Cost per Job</div>
            </div>
            <div class="ad-metric">
              <div class="ad-metric-val" id="r-jobs">11</div>
              <div class="ad-metric-label">Jobs from Ads</div>
            </div>
          </div>

          <div style="height:1px;background:rgba(255,255,255,.15);margin:.5rem 0;"></div>

          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0;">
            <div class="ad-metric">
              <div class="ad-metric-val" id="r-rev" style="color:#4ade80;">$27,500</div>
              <div class="ad-metric-label">Ad Revenue</div>
            </div>
            <div class="ad-metric">
              <div class="ad-metric-val" id="r-profit" style="color:#4ade80;">$13,200</div>
              <div class="ad-metric-label">Ad Profit</div>
            </div>
            <div class="ad-metric">
              <div class="ad-metric-val" id="r-roas" style="color:#fbbf24;">12.5x</div>
              <div class="ad-metric-label">ROAS</div>
            </div>
          </div>

          <div style="height:1px;background:rgba(255,255,255,.15);margin:.5rem 0;"></div>

          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0;">
            <div class="ad-metric">
              <div class="ad-metric-val" id="r-total-leads">57</div>
              <div class="ad-metric-label">Total Leads (all)</div>
            </div>
            <div class="ad-metric">
              <div class="ad-metric-val" id="r-total-jobs">20</div>
              <div class="ad-metric-label">Total Jobs (all)</div>
            </div>
            <div class="ad-metric">
              <div class="ad-metric-val" id="r-total-profit" style="color:#4ade80;">$24,900</div>
              <div class="ad-metric-label">Total Profit (all)</div>
            </div>
          </div>
        </div>

        <!-- Per-Channel Breakdown -->
        <div style="margin-top:1rem;">
          <div style="font-weight:700;font-size:.95rem;margin-bottom:.5rem;">Channel Breakdown</div>
          <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
            <table id="ad-channel-table" style="width:100%;border-collapse:collapse;font-size:.8rem;min-width:480px;">
              <thead>
                <tr style="background:var(--green-dark);color:white;">
                  <th style="padding:.4rem .5rem;text-align:left;font-size:.72rem;">Channel</th>
                  <th style="padding:.4rem .4rem;text-align:right;font-size:.72rem;">Spend</th>
                  <th style="padding:.4rem .4rem;text-align:right;font-size:.72rem;">Leads</th>
                  <th style="padding:.4rem .4rem;text-align:right;font-size:.72rem;">CPL</th>
                  <th style="padding:.4rem .4rem;text-align:right;font-size:.72rem;">Jobs</th>
                  <th style="padding:.4rem .4rem;text-align:right;font-size:.72rem;">Revenue</th>
                  <th style="padding:.4rem .4rem;text-align:right;font-size:.72rem;">Profit</th>
                  <th style="padding:.4rem .5rem;text-align:right;font-size:.72rem;">ROAS</th>
                </tr>
              </thead>
              <tbody id="ad-channel-tbody"></tbody>
            </table>
          </div>
        </div>

        <!-- What-If -->
        <div style="margin-top:1.25rem;padding:1rem;background:var(--white);border:1px solid var(--border);border-radius:10px;">
          <div style="font-weight:700;font-size:.95rem;margin-bottom:.5rem;">What If I Doubled My Best Channel?</div>
          <p id="ad-whatif" style="font-size:.9rem;color:var(--text-light);margin:0;"></p>
        </div>

        <!-- GA4 Quick Access -->
        <div style="margin-top:1.25rem;background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;">
          <div style="background:#4285f4;color:white;padding:.55rem 1rem;font-weight:700;font-size:.85rem;text-transform:uppercase;letter-spacing:.07em;display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="document.getElementById('ga-help').style.display=document.getElementById('ga-help').style.display==='none'?'block':'none';">
            <span>Google Analytics &mdash; Get Your Real Numbers</span>
            <span style="font-size:.7rem;">&#9660;</span>
          </div>
          <div id="ga-help" style="padding:1rem;font-size:.88rem;line-height:1.6;display:none;">
            <p style="margin:0 0 .75rem;"><strong>Open your GA4 dashboard to get real traffic source data:</strong></p>
            <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem;">
              <a href="https://analytics.google.com/analytics/web/#/report/acquisition-traffic-acquisition/a128398559p393249583/" target="_blank" rel="noopener" style="display:inline-block;background:#4285f4;color:white;padding:.4rem .8rem;border-radius:6px;font-size:.82rem;font-weight:600;text-decoration:none;">Open Traffic Report &rarr;</a>
              <a href="https://analytics.google.com/analytics/web/" target="_blank" rel="noopener" style="display:inline-block;background:var(--white);color:#4285f4;padding:.4rem .8rem;border-radius:6px;font-size:.82rem;font-weight:600;text-decoration:none;border:1px solid #4285f4;">GA4 Home &rarr;</a>
            </div>
            <p style="margin:0 0 .5rem;font-weight:700;">How to get the numbers:</p>
            <ol style="margin:0 0 .75rem;padding-left:1.25rem;font-size:.85rem;">
              <li>In GA4, go to <strong>Reports &rarr; Acquisition &rarr; Traffic acquisition</strong></li>
              <li>Set date range to <strong>last 30 days</strong></li>
              <li>Look at the <strong>Session source</strong> column &mdash; it shows google, facebook, instagram, yelp, direct, etc.</li>
              <li>The <strong>Sessions</strong> column = your leads from each source</li>
              <li>Check <strong>Events &rarr; click_to_call</strong> for phone call conversions by source</li>
              <li>Plug those numbers into the calculator above</li>
            </ol>
            <p style="margin:0 0 .5rem;font-weight:700;">UTM links for your ad campaigns:</p>
            <p style="margin:0 0 .3rem;font-size:.82rem;color:var(--text-light);">Use these URLs in your ads/posts so GA4 tracks each channel separately:</p>
            <div style="background:#f5f5f5;border-radius:6px;padding:.6rem .8rem;font-family:monospace;font-size:.75rem;line-height:1.8;margin-top:.4rem;overflow-x:auto;">
              <strong>Google Ads:</strong><br>
              peekskilltree.com/?utm_source=google&amp;utm_medium=cpc&amp;utm_campaign=tree_removal<br><br>
              <strong>Facebook/Instagram:</strong><br>
              peekskilltree.com/?utm_source=facebook&amp;utm_medium=social&amp;utm_campaign=spring2026<br><br>
              <strong>Yelp:</strong><br>
              peekskilltree.com/?utm_source=yelp&amp;utm_medium=referral&amp;utm_campaign=listing<br><br>
              <strong>Yard Signs / Print:</strong><br>
              peekskilltree.com/?utm_source=yard_sign&amp;utm_medium=offline&amp;utm_campaign=peekskill<br><br>
              <strong>Nextdoor:</strong><br>
              peekskilltree.com/?utm_source=nextdoor&amp;utm_medium=social&amp;utm_campaign=post
            </div>
            <p style="margin:.5rem 0 0;font-size:.8rem;color:var(--text-light);">Tip: GA4 data takes 24-48 hours to appear. Real-time data is available immediately under Reports &rarr; Realtime.</p>
          </div>
        </div>

      </div>

      <!-- Links -->
      <div style="margin-top:1rem;display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;">
        <a href="rates.html" style="display:inline-block;background:var(--green-dark);color:var(--white);font-weight:700;font-size:.9rem;padding:.5rem 1.25rem;border-radius:8px;text-decoration:none;">Rates</a>
        <a href="breakeven.html" style="display:inline-block;background:var(--white);color:var(--green-dark);font-weight:700;font-size:.9rem;padding:.5rem 1.25rem;border-radius:8px;text-decoration:none;border:2px solid var(--green-dark);">Break-Even</a>
      </div>

    </div>
  </section>

  <script>
    var channels = [
      {name:'Google Ads', spendId:'ad-google', leadsId:'leads-google', icon:'\\uD83D\\uDD0D'},
      {name:'Facebook / IG', spendId:'ad-fb', leadsId:'leads-fb', icon:'\\uD83D\\uDCF1'},
      {name:'Angi / HomeAdvisor', spendId:'ad-angi', leadsId:'leads-angi', icon:'\\uD83C\\uDFE0'},
      {name:'Signs / Print', spendId:'ad-print', leadsId:'leads-print', icon:'\\uD83D\\uDCE3'},
      {name:'Other', spendId:'ad-other', leadsId:'leads-other', icon:'\\uD83D\\uDCAC'}
    ];
    var freeChannels = [
      {name:'Google Organic', id:'leads-seo'},
      {name:'Referrals', id:'leads-ref'},
      {name:'Repeat Customers', id:'leads-repeat'},
      {name:'Google Business', id:'leads-gbp'}
    ];

    function adCalc() {
      var closeRate = (parseFloat(document.getElementById('ad-close-rate').value) || 0) / 100;
      var avgRev   = parseFloat(document.getElementById('ad-avg-rev').value) || 0;
      var avgCost  = parseFloat(document.getElementById('ad-avg-cost').value) || 0;
      var avgProfit = avgRev - avgCost;

      var totalSpend = 0, totalPaidLeads = 0;
      var channelData = [];
      var bestChannel = null, bestROAS = 0;

      channels.forEach(function(ch) {
        var spend = parseFloat(document.getElementById(ch.spendId).value) || 0;
        var leads = parseFloat(document.getElementById(ch.leadsId).value) || 0;
        totalSpend += spend;
        totalPaidLeads += leads;

        var jobs = Math.round(leads * closeRate * 10) / 10;
        var rev  = Math.round(jobs * avgRev);
        var cost = Math.round(jobs * avgCost);
        var profit = rev - cost - spend;
        var cpl  = leads > 0 ? Math.round(spend / leads) : 0;
        var roas = spend > 0 ? Math.round((rev / spend) * 10) / 10 : 0;

        channelData.push({name:ch.name, spend:spend, leads:leads, jobs:jobs, rev:rev, profit:profit, cpl:cpl, roas:roas});
        if (spend > 0 && roas > bestROAS) { bestROAS = roas; bestChannel = ch.name; }
      });

      // Free leads
      var totalFreeLeads = 0;
      freeChannels.forEach(function(ch) {
        totalFreeLeads += parseFloat(document.getElementById(ch.id).value) || 0;
      });

      var totalLeads = totalPaidLeads + totalFreeLeads;
      var paidJobs   = Math.round(totalPaidLeads * closeRate * 10) / 10;
      var freeJobs   = Math.round(totalFreeLeads * closeRate * 10) / 10;
      var totalJobs  = Math.round(totalLeads * closeRate * 10) / 10;

      var paidRev    = Math.round(paidJobs * avgRev);
      var paidProfit = Math.round(paidJobs * avgProfit) - totalSpend;
      var totalRev   = Math.round(totalJobs * avgRev);
      var totalProfit = Math.round(totalJobs * avgProfit) - totalSpend;

      var cpl  = totalPaidLeads > 0 ? Math.round(totalSpend / totalPaidLeads) : 0;
      var cpj  = paidJobs > 0 ? Math.round(totalSpend / paidJobs) : 0;
      var roas = totalSpend > 0 ? Math.round((paidRev / totalSpend) * 10) / 10 : 0;

      // Update totals
      document.getElementById('ad-total-spend').textContent = '$' + totalSpend.toLocaleString();
      document.getElementById('ad-total-leads').textContent = totalPaidLeads;
      document.getElementById('ad-free-total').textContent = totalFreeLeads;

      // Update metrics
      document.getElementById('r-cpl').textContent = '$' + cpl.toLocaleString();
      document.getElementById('r-cpj').textContent = '$' + cpj.toLocaleString();
      document.getElementById('r-jobs').textContent = Math.round(paidJobs);
      document.getElementById('r-rev').textContent = '$' + paidRev.toLocaleString();
      document.getElementById('r-profit').textContent = (paidProfit >= 0 ? '+$' : '-$') + Math.abs(paidProfit).toLocaleString();
      document.getElementById('r-profit').style.color = paidProfit >= 0 ? '#4ade80' : '#ef4444';
      document.getElementById('r-roas').textContent = roas + 'x';
      document.getElementById('r-roas').style.color = roas >= 3 ? '#4ade80' : (roas >= 1 ? '#fbbf24' : '#ef4444');

      document.getElementById('r-total-leads').textContent = Math.round(totalLeads);
      document.getElementById('r-total-jobs').textContent = Math.round(totalJobs);
      document.getElementById('r-total-profit').textContent = (totalProfit >= 0 ? '+$' : '-$') + Math.abs(totalProfit).toLocaleString();
      document.getElementById('r-total-profit').style.color = totalProfit >= 0 ? '#4ade80' : '#ef4444';

      // Channel table
      var tbody = document.getElementById('ad-channel-tbody');
      var html = '';
      channelData.forEach(function(ch, i) {
        if (ch.spend === 0 && ch.leads === 0) return;
        var bg = i % 2 === 0 ? '#fff' : '#f9f9f9';
        var profitColor = ch.profit >= 0 ? '#2d5a27' : '#c0392b';
        html += '<tr style="background:' + bg + ';border-bottom:1px solid #eee;">'
          + '<td style="padding:.4rem .5rem;font-weight:600;">' + ch.name + '</td>'
          + '<td style="padding:.4rem;text-align:right;">$' + ch.spend.toLocaleString() + '</td>'
          + '<td style="padding:.4rem;text-align:right;">' + ch.leads + '</td>'
          + '<td style="padding:.4rem;text-align:right;">$' + ch.cpl + '</td>'
          + '<td style="padding:.4rem;text-align:right;">' + Math.round(ch.jobs) + '</td>'
          + '<td style="padding:.4rem;text-align:right;">$' + ch.rev.toLocaleString() + '</td>'
          + '<td style="padding:.4rem;text-align:right;color:' + profitColor + ';font-weight:700;">'
          + (ch.profit >= 0 ? '+$' : '-$') + Math.abs(ch.profit).toLocaleString() + '</td>'
          + '<td style="padding:.4rem .5rem;text-align:right;font-weight:700;">' + ch.roas + 'x</td>'
          + '</tr>';
      });
      // Free leads row
      if (totalFreeLeads > 0) {
        html += '<tr style="background:#e8f5e9;border-bottom:1px solid #cde6cd;">'
          + '<td style="padding:.4rem .5rem;font-weight:600;color:#2d5a27;">Free (organic/referral)</td>'
          + '<td style="padding:.4rem;text-align:right;color:#2d5a27;">$0</td>'
          + '<td style="padding:.4rem;text-align:right;">' + totalFreeLeads + '</td>'
          + '<td style="padding:.4rem;text-align:right;color:#2d5a27;">$0</td>'
          + '<td style="padding:.4rem;text-align:right;">' + Math.round(freeJobs) + '</td>'
          + '<td style="padding:.4rem;text-align:right;">$' + Math.round(freeJobs * avgRev).toLocaleString() + '</td>'
          + '<td style="padding:.4rem;text-align:right;color:#2d5a27;font-weight:700;">+$' + Math.round(freeJobs * avgProfit).toLocaleString() + '</td>'
          + '<td style="padding:.4rem .5rem;text-align:right;font-weight:700;color:#2d5a27;">\\u221E</td>'
          + '</tr>';
      }
      tbody.innerHTML = html;

      // What-if
      var whatif = document.getElementById('ad-whatif');
      if (bestChannel && bestROAS > 0) {
        var bestData = channelData.find(function(c) { return c.name === bestChannel; });
        if (bestData) {
          var dblSpend = bestData.spend * 2;
          var dblJobs = bestData.jobs * 2;
          var dblRev = Math.round(dblJobs * avgRev);
          var dblCost = Math.round(dblJobs * avgCost);
          var dblProfit = dblRev - dblCost - dblSpend;
          whatif.innerHTML = '<strong>' + bestChannel + '</strong> is your best performer at <strong>' + bestROAS + 'x ROAS</strong>. '
            + 'If you doubled that spend from $' + bestData.spend.toLocaleString() + ' to $' + dblSpend.toLocaleString()
            + ', you could generate ~<strong>' + Math.round(dblJobs) + ' jobs</strong>, $' + dblRev.toLocaleString() + ' revenue, and '
            + '<strong style="color:var(--green-dark);">+$' + dblProfit.toLocaleString() + ' profit</strong> from that channel alone.';
        }
      } else {
        whatif.textContent = 'Enter ad spend above to see which channel delivers the best return.';
      }
    }
    adCalc();
  </script>

      <!-- Calculator Nav -->
      <div style="display:flex;gap:0;background:var(--bg-light);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-top:1.25rem;">
        <a href="rates.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);">Rates</a>
        <a href="estimate.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Field Estimate</a>
        <a href="breakeven.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Break-Even</a>
        <a href="roi.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:700;text-decoration:none;color:var(--white);background:var(--green-dark);border-left:1px solid var(--border);">Ad ROI</a>
      </div>
''' + FOOTER

write_page("roi.html", ads_page)
print("Created roi.html")

# ============================================================
# FIELD ESTIMATE CALCULATOR PAGE
# ============================================================
est_page = header(
    "Quick Estimate Calculator | Second Nature Tree Service",
    "Field estimate calculator for tree removal, pruning, and stump grinding. DBH-based pricing with complexity multipliers.",
    "estimate.html", None,
    "Quick Estimate",
    '<a href="index.html">Home</a> <span>&raquo;</span> Estimate',
    "",
    breadcrumbs=[{"name": "Home", "url": ""}, {"name": "Estimate Calculator", "url": "estimate.html"}]
)
est_page = est_page.replace(
    '<meta name="robots" content="index, follow, max-image-preview:large">',
    '<meta name="robots" content="noindex, nofollow">'
)
est_page += '''
  <style>
    .top-bar {display:none !important;}
    .page-hero {padding:1rem 0 .5rem !important;min-height:0 !important;background:var(--green-dark) !important;}
    .page-hero-content h1 {font-size:1.2rem !important;margin-bottom:0 !important;}
    .breadcrumb {display:none !important;}
    .section {padding-top:.75rem !important;padding-bottom:1rem !important;}
    @media(max-width:600px){
      .page-hero {padding:.6rem 0 .3rem !important;}
      .page-hero-content h1 {font-size:1.05rem !important;}
    }
    .est-input {width:80px;padding:.4rem .5rem;border:2px solid var(--border);border-radius:8px;font-size:16px;font-weight:700;text-align:center;font-family:inherit;}
    .est-input:focus {border-color:var(--green-dark);outline:none;}
    .est-row {display:flex;justify-content:space-between;align-items:center;padding:.6rem .75rem;border-bottom:1px solid var(--border);}
    .est-row:last-child {border-bottom:none;}
    .est-section {background:var(--white);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1rem;}
    .est-hdr {padding:.55rem 1rem;font-weight:700;font-size:.85rem;text-transform:uppercase;letter-spacing:.07em;color:var(--white);}
    .est-chip {display:inline-block;padding:.35rem .8rem;border-radius:20px;font-size:.85rem;font-weight:600;cursor:pointer;border:2px solid var(--border);background:var(--white);margin:.2rem;transition:all .15s;-webkit-tap-highlight-color:transparent;}
    .est-chip.active {background:var(--green-dark);color:white;border-color:var(--green-dark);}
    .est-chip:hover {border-color:var(--green-dark);}
    .mult-row {display:flex;justify-content:space-between;align-items:center;padding:.5rem .75rem;border-bottom:1px solid var(--border);}
    .mult-row:last-child {border-bottom:none;}
    .mult-label {display:flex;align-items:center;gap:.5rem;font-size:.92rem;cursor:pointer;}
    .mult-label input {width:20px;height:20px;cursor:pointer;}
    .mult-val {font-weight:700;font-size:.88rem;color:var(--green-dark);}
    @media(max-width:600px){
      .est-input {width:75px !important;}
      .est-chip {padding:.45rem .7rem;font-size:.9rem;}
      .mult-row {padding:.65rem .6rem !important;}
    }
  </style>
  <section class="section">
    <div class="container" style="max-width:800px;">

      <!-- Calculator Nav (top) -->
      <div style="display:flex;gap:0;background:var(--bg-light);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1rem;">
        <a href="rates.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);">Rates</a>
        <a href="estimate.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:700;text-decoration:none;color:var(--white);background:var(--green-dark);border-left:1px solid var(--border);">Field Estimate</a>
        <a href="breakeven.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Break-Even</a>
        <a href="roi.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Ad ROI</a>
      </div>

      <p style="color:var(--text-light);margin-bottom:.75rem;font-size:.9rem;">Quick field pricing. Enter tree details, select conditions, get an estimate. <a href="rates.html" style="font-weight:600;">Full Job Cost Calculator &rarr;</a></p>

      <div style="background:var(--bg-light);border-radius:12px;padding:1.5rem 1.75rem;border:1px solid var(--border);">

        <!-- Service Type -->
        <div style="margin-bottom:1.25rem;">
          <div style="font-weight:700;margin-bottom:.5rem;">Service Type</div>
          <div id="svc-btns">
            <span class="est-chip active" data-svc="removal" onclick="setSvc(this)">Tree Removal</span>
            <span class="est-chip" data-svc="pruning" onclick="setSvc(this)">Pruning / Trim</span>
            <span class="est-chip" data-svc="stump" onclick="setSvc(this)">Stump Grinding</span>
          </div>
        </div>

        <!-- REMOVAL SECTION -->
        <div id="sec-removal">
          <div class="est-section">
            <div class="est-hdr" style="background:var(--green-dark);">Tree Details</div>
            <div class="est-row">
              <label style="font-size:.95rem;font-weight:600;">DBH <span style="font-weight:400;font-size:.82rem;color:var(--text-light);">(diameter at breast height, inches)</span></label>
              <input type="number" class="est-input" id="est-dbh" value="24" min="1" max="120" oninput="estCalc()">
            </div>
            <div class="est-row">
              <label style="font-size:.95rem;font-weight:600;">Number of trees</label>
              <input type="number" class="est-input" id="est-qty" value="1" min="1" max="50" oninput="estCalc()">
            </div>
            <div class="est-row">
              <label style="font-size:.95rem;font-weight:600;">Crew size</label>
              <input type="number" class="est-input" id="est-crew" value="3" min="1" max="8" oninput="estCalc()">
            </div>
            <div class="est-row">
              <label style="font-size:.95rem;font-weight:600;">Estimated days</label>
              <input type="number" class="est-input" id="est-days" value="1" min="0.5" max="10" step="0.5" oninput="estCalc()">
            </div>
          </div>

          <!-- Complexity Multipliers -->
          <div class="est-section">
            <div class="est-hdr" style="background:#b5610a;">Complexity &amp; Hazards</div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" class="est-mult" data-mult="1.5" onchange="estCalc()"> Near house / structure</label>
              <span class="mult-val">1.5x</span>
            </div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" class="est-mult" data-mult="2.0" onchange="estCalc()"> Over structure (rigging required)</label>
              <span class="mult-val">2.0x</span>
            </div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" class="est-mult" data-mult="2.0" onchange="estCalc()"> Power lines nearby</label>
              <span class="mult-val">2.0x</span>
            </div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" class="est-mult" data-mult="1.3" onchange="estCalc()"> Tight access / no truck</label>
              <span class="mult-val">1.3x</span>
            </div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" class="est-mult" data-mult="1.5" onchange="estCalc()"> Hazardous / dead / leaning</label>
              <span class="mult-val">1.5x</span>
            </div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" class="est-mult" data-mult="1.3" onchange="estCalc()"> Steep slope / difficult terrain</label>
              <span class="mult-val">1.3x</span>
            </div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" class="est-mult" data-mult="2.0" onchange="estCalc()"> Emergency / storm call</label>
              <span class="mult-val">2.0x</span>
            </div>
          </div>

          <!-- Add-ons -->
          <div class="est-section">
            <div class="est-hdr" style="background:#4a7c59;">Add-ons</div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" id="est-stump-add" onchange="estCalc()"> Include stump grinding</label>
              <span style="font-size:.85rem;color:var(--text-light);">+ DBH &times; $5/inch</span>
            </div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" id="est-haul" onchange="estCalc()"> Log haul-away</label>
              <span style="font-size:.85rem;color:var(--text-light);">+ $200</span>
            </div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" id="est-crane" onchange="estCalc()"> Crane required</label>
              <span style="font-size:.85rem;color:var(--text-light);">+ $2,500</span>
            </div>
          </div>
        </div>

        <!-- PRUNING SECTION (hidden by default) -->
        <div id="sec-pruning" style="display:none;">
          <div class="est-section">
            <div class="est-hdr" style="background:var(--green-dark);">Pruning Details</div>
            <div class="est-row">
              <label style="font-size:.95rem;font-weight:600;">Number of trees</label>
              <input type="number" class="est-input" id="prune-qty" value="1" min="1" max="50" oninput="estCalc()">
            </div>
            <div class="est-row">
              <label style="font-size:.95rem;font-weight:600;">Tree size</label>
              <div>
                <select id="prune-size" onchange="estCalc()" style="padding:.4rem .6rem;border:2px solid var(--border);border-radius:8px;font-size:16px;font-weight:600;">
                  <option value="250">Small (under 25ft) — $250</option>
                  <option value="500" selected>Medium (25-50ft) — $500</option>
                  <option value="1000">Large (50-75ft) — $1,000</option>
                  <option value="1500">Extra-large (75ft+) — $1,500</option>
                </select>
              </div>
            </div>
            <div class="est-row">
              <label style="font-size:.95rem;font-weight:600;">Crew size</label>
              <input type="number" class="est-input" id="prune-crew" value="2" min="1" max="6" oninput="estCalc()">
            </div>
            <div class="est-row">
              <label style="font-size:.95rem;font-weight:600;">Estimated hours</label>
              <input type="number" class="est-input" id="prune-hrs" value="4" min="1" max="16" oninput="estCalc()">
            </div>
          </div>
          <div class="est-section">
            <div class="est-hdr" style="background:#b5610a;">Complexity</div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" class="prune-mult" data-mult="1.3" onchange="estCalc()"> Near structure</label>
              <span class="mult-val">1.3x</span>
            </div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" class="prune-mult" data-mult="1.5" onchange="estCalc()"> Power lines</label>
              <span class="mult-val">1.5x</span>
            </div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" class="prune-mult" data-mult="1.3" onchange="estCalc()"> Tight access</label>
              <span class="mult-val">1.3x</span>
            </div>
          </div>
        </div>

        <!-- STUMP SECTION (hidden by default) -->
        <div id="sec-stump" style="display:none;">
          <div class="est-section">
            <div class="est-hdr" style="background:var(--green-dark);">Stump Details</div>
            <div class="est-row">
              <label style="font-size:.95rem;font-weight:600;">Stump diameter <span style="font-weight:400;font-size:.82rem;color:var(--text-light);">(inches)</span></label>
              <input type="number" class="est-input" id="stump-dia" value="24" min="1" max="100" oninput="estCalc()">
            </div>
            <div class="est-row">
              <label style="font-size:.95rem;font-weight:600;">Number of stumps</label>
              <input type="number" class="est-input" id="stump-qty" value="1" min="1" max="20" oninput="estCalc()">
            </div>
            <div class="est-row">
              <label style="font-size:.95rem;font-weight:600;">Additional stumps discount</label>
              <span style="font-size:.85rem;color:var(--text-light);">$50 each after first</span>
            </div>
          </div>
          <div class="est-section">
            <div class="est-hdr" style="background:#b5610a;">Conditions</div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" class="stump-mult" data-mult="1.3" onchange="estCalc()"> Roots above ground / surface roots</label>
              <span class="mult-val">1.3x</span>
            </div>
            <div class="mult-row">
              <label class="mult-label"><input type="checkbox" class="stump-mult" data-mult="1.5" onchange="estCalc()"> Tight access / no machine access</label>
              <span class="mult-val">1.5x</span>
            </div>
          </div>
        </div>

        <!-- RESULT -->
        <div style="background:linear-gradient(135deg,#1a3c12 0%,#2d5a27 100%);border-radius:12px;padding:1.25rem 1.5rem;color:var(--white);margin-top:.75rem;">
          <div id="est-breakdown" style="font-size:.88rem;opacity:.8;line-height:1.9;margin-bottom:.75rem;border-bottom:1px solid rgba(255,255,255,.2);padding-bottom:.75rem;"></div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:.5rem;">
            <div>
              <div style="font-size:1rem;font-weight:600;">Estimated Quote</div>
              <div id="est-range-label" style="font-size:.78rem;opacity:.6;margin-top:.15rem;">Range based on conditions</div>
            </div>
            <div style="text-align:right;">
              <div id="est-total" style="font-size:2.2rem;font-weight:800;letter-spacing:-.02em;">$2,400</div>
              <div id="est-range" style="font-size:.85rem;opacity:.7;margin-top:.1rem;">$2,000 – $2,800</div>
            </div>
          </div>
          <div style="margin-top:.75rem;display:flex;gap:1rem;flex-wrap:wrap;font-size:.82rem;opacity:.6;">
            <span>Cost: <strong id="est-cost">$1,200</strong></span>
            <span>Profit: <strong id="est-profit" style="color:#4ade80;">$1,200</strong></span>
            <span>Margin: <strong id="est-margin">50%</strong></span>
          </div>
          <div style="font-size:.75rem;opacity:.7;margin-top:.5rem;">Minimum job charge: $500</div>
        </div>

      </div>

      <!-- Links -->
      <div style="margin-top:1rem;display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;">
        <a href="rates.html" style="display:inline-block;background:var(--green-dark);color:var(--white);font-weight:700;font-size:.9rem;padding:.5rem 1.25rem;border-radius:8px;text-decoration:none;">Rates</a>
        <a href="breakeven.html" style="display:inline-block;background:var(--white);color:var(--green-dark);font-weight:700;font-size:.9rem;padding:.5rem 1.25rem;border-radius:8px;text-decoration:none;border:2px solid var(--green-dark);">Break-Even</a>
        <a href="roi.html" style="display:inline-block;background:var(--white);color:var(--green-dark);font-weight:700;font-size:.9rem;padding:.5rem 1.25rem;border-radius:8px;text-decoration:none;border:2px solid var(--green-dark);">Ad ROI</a>
      </div>

    </div>
  </section>

  <script>
    var currentSvc = 'removal';
    var MIN_JOB = 500;
    var COST_PER_WORKER_DAY = 1000;

    function setSvc(el) {
      currentSvc = el.dataset.svc;
      document.querySelectorAll('.est-chip').forEach(function(c) { c.classList.remove('active'); });
      el.classList.add('active');
      document.getElementById('sec-removal').style.display = currentSvc === 'removal' ? 'block' : 'none';
      document.getElementById('sec-pruning').style.display = currentSvc === 'pruning' ? 'block' : 'none';
      document.getElementById('sec-stump').style.display   = currentSvc === 'stump'   ? 'block' : 'none';
      estCalc();
    }

    function getMultiplier(className) {
      var mult = 1;
      document.querySelectorAll('.' + className + ':checked').forEach(function(cb) {
        mult *= parseFloat(cb.dataset.mult) || 1;
      });
      return mult;
    }

    function estCalc() {
      var price = 0, cost = 0, lines = [];

      if (currentSvc === 'removal') {
        var dbh  = parseFloat(document.getElementById('est-dbh').value) || 0;
        var qty  = parseInt(document.getElementById('est-qty').value) || 1;
        var crew = parseInt(document.getElementById('est-crew').value) || 3;
        var days = parseFloat(document.getElementById('est-days').value) || 1;
        var mult = getMultiplier('est-mult');

        /* Base: DBH x $100 per tree */
        var basePerTree = dbh * 100;
        var baseTotal = basePerTree * qty;
        lines.push(qty > 1
          ? qty + ' trees &times; ' + dbh + '" DBH &times; $100 = $' + baseTotal.toLocaleString()
          : dbh + '" DBH &times; $100 = $' + baseTotal.toLocaleString());

        price = baseTotal;

        /* Apply multipliers */
        if (mult > 1) {
          price = Math.round(price * mult);
          lines.push('Complexity multiplier: ' + mult.toFixed(1) + 'x &rarr; $' + price.toLocaleString());
        }

        /* Add-ons */
        if (document.getElementById('est-stump-add').checked) {
          var stumpAdd = dbh * 5 * qty;
          price += stumpAdd;
          lines.push('Stump grinding: ' + qty + ' &times; ' + dbh + '" &times; $5 = +$' + stumpAdd.toLocaleString());
        }
        if (document.getElementById('est-haul').checked) {
          price += 200;
          lines.push('Log haul-away: +$200');
        }
        if (document.getElementById('est-crane').checked) {
          price += 2500;
          lines.push('Crane: +$2,500');
        }

        /* Cost estimate: $1,000/worker/day */
        cost = crew * days * COST_PER_WORKER_DAY;
        lines.push('<div style="margin-top:.3rem;padding-top:.3rem;border-top:1px solid rgba(255,255,255,.15);">Cost: ' + crew + ' crew &times; ' + days + ' day' + (days > 1 ? 's' : '') + ' &times; $1,000 = $' + cost.toLocaleString() + '</div>');

      } else if (currentSvc === 'pruning') {
        var pQty  = parseInt(document.getElementById('prune-qty').value) || 1;
        var pSize = parseInt(document.getElementById('prune-size').value) || 500;
        var pCrew = parseInt(document.getElementById('prune-crew').value) || 2;
        var pHrs  = parseFloat(document.getElementById('prune-hrs').value) || 4;
        var pMult = getMultiplier('prune-mult');

        price = pSize * pQty;
        lines.push(pQty + ' tree' + (pQty > 1 ? 's' : '') + ' &times; $' + pSize.toLocaleString() + ' = $' + price.toLocaleString());

        if (pMult > 1) {
          price = Math.round(price * pMult);
          lines.push('Complexity: ' + pMult.toFixed(1) + 'x &rarr; $' + price.toLocaleString());
        }

        /* Cost: crew x hours x $125/hr (rough) */
        cost = Math.round(pCrew * pHrs * 125);
        lines.push('<div style="margin-top:.3rem;padding-top:.3rem;border-top:1px solid rgba(255,255,255,.15);">Cost: ' + pCrew + ' crew &times; ' + pHrs + 'hr &times; $125/hr = $' + cost.toLocaleString() + '</div>');

      } else if (currentSvc === 'stump') {
        var sDia = parseFloat(document.getElementById('stump-dia').value) || 0;
        var sQty = parseInt(document.getElementById('stump-qty').value) || 1;
        var sMult = getMultiplier('stump-mult');

        /* First stump: diameter x $5, min $150. Additional: $50 each + diameter factor */
        var firstStump = Math.max(150, sDia * 5);
        var addlStumps = sQty > 1 ? (sQty - 1) * 50 : 0;
        price = firstStump + addlStumps;

        lines.push('First stump: ' + sDia + '" &times; $5 = $' + firstStump.toLocaleString());
        if (sQty > 1) lines.push('Additional ' + (sQty - 1) + ' stump' + (sQty > 2 ? 's' : '') + ' &times; $50 = +$' + addlStumps.toLocaleString());

        if (sMult > 1) {
          price = Math.round(price * sMult);
          lines.push('Conditions: ' + sMult.toFixed(1) + 'x &rarr; $' + price.toLocaleString());
        }

        /* Cost: roughly 40% of stump jobs */
        cost = Math.round(price * 0.4);
        lines.push('<div style="margin-top:.3rem;padding-top:.3rem;border-top:1px solid rgba(255,255,255,.15);">Est. cost: ~$' + cost.toLocaleString() + '</div>');
      }

      /* Apply minimum */
      if (price < MIN_JOB && price > 0) {
        price = MIN_JOB;
        lines.push('<em>Minimum job charge applied: $' + MIN_JOB + '</em>');
      }

      /* Round to nearest $50 */
      price = Math.round(price / 50) * 50;

      /* Range: -15% to +15% */
      var low  = Math.round((price * 0.85) / 50) * 50;
      var high = Math.round((price * 1.15) / 50) * 50;
      var profit = price - cost;
      var margin = price > 0 ? Math.round((profit / price) * 100) : 0;

      /* Update display */
      document.getElementById('est-breakdown').innerHTML = lines.join('<br>');
      document.getElementById('est-total').textContent = '$' + price.toLocaleString();
      document.getElementById('est-range').textContent = '$' + low.toLocaleString() + ' – $' + high.toLocaleString();
      document.getElementById('est-cost').textContent = '$' + cost.toLocaleString();
      document.getElementById('est-profit').textContent = (profit >= 0 ? '$' : '-$') + Math.abs(profit).toLocaleString();
      document.getElementById('est-profit').style.color = profit >= 0 ? '#4ade80' : '#ef4444';
      document.getElementById('est-margin').textContent = margin + '%';
    }

    estCalc();
  </script>

      <!-- Calculator Nav -->
      <div style="display:flex;gap:0;background:var(--bg-light);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-top:1.25rem;">
        <a href="rates.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);">Rates</a>
        <a href="estimate.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:700;text-decoration:none;color:var(--white);background:var(--green-dark);border-left:1px solid var(--border);">Field Estimate</a>
        <a href="breakeven.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Break-Even</a>
        <a href="roi.html" style="flex:1;padding:.6rem .5rem;text-align:center;font-size:.8rem;font-weight:600;text-decoration:none;color:var(--text);border-left:1px solid var(--border);">Ad ROI</a>
      </div>
''' + FOOTER

write_page("estimate.html", est_page)
print("Created estimate.html")

# ============================================================
# PRIVACY POLICY PAGE
# ============================================================
privacy_page = header(
    "Privacy Policy | Second Nature Tree Service",
    "Privacy policy for Second Nature Tree Service. Learn how we collect, use, and protect your personal information including phone and text communications.",
    "privacy-policy.html", None,
    "Privacy Policy",
    '<a href="index.html">Home</a> <span>&raquo;</span> Privacy Policy',
    "",
    breadcrumbs=[{"name": "Home", "url": ""}, {"name": "Privacy Policy", "url": "privacy-policy.html"}]
)
privacy_page += '''
  <section class="section">
    <div class="container" style="max-width:800px;">

      <p style="color:var(--text-light);margin-bottom:1.5rem;"><strong>Effective Date:</strong> March 17, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> March 17, 2026</p>

      <p>Second Nature Tree Service (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your privacy. This Privacy Policy explains how we collect, use, and protect information when you visit <a href="https://peekskilltree.com">peekskilltree.com</a>, call us, text us, or otherwise interact with our business.</p>

      <h2>Information We Collect</h2>
      <p>We may collect the following types of information:</p>
      <ul>
        <li><strong>Contact information</strong> you provide voluntarily, such as your name, phone number, email address, and property address when you request an estimate, call us, or fill out a form.</li>
        <li><strong>Phone call information:</strong> When you call <a href="tel:914-391-5233">(914) 391-5233</a>, your phone number and call details (date, time, duration) may be collected by our phone service provider.</li>
        <li><strong>Text/SMS messages:</strong> If you send us a text message or we communicate with you via text, your phone number and message content are collected and stored.</li>
        <li><strong>Website usage data:</strong> We may collect non-personal information such as browser type, device type, pages visited, and referring URLs through analytics tools.</li>
        <li><strong>Photos and videos:</strong> Images of your property or trees that you share with us for the purpose of providing estimates or documenting completed work.</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Respond to your inquiries and provide free estimates</li>
        <li>Schedule and perform tree services</li>
        <li>Communicate with you by phone, text message, or email about your service requests, appointments, and follow-ups</li>
        <li>Send appointment reminders and service updates via text message</li>
        <li>Process payments</li>
        <li>Improve our website and services</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>Phone &amp; Text Message (SMS) Communications</h2>
      <p><strong>Program Name:</strong> Second Nature Tree Service SMS Notifications</p>
      <p>By providing your phone number and contacting us, you consent to receive communications from Second Nature Tree Service, including:</p>
      <ul>
        <li>Return phone calls in response to your inquiries</li>
        <li>Text messages related to your estimate, appointment scheduling, service updates, and follow-ups</li>
        <li>Occasional service-related messages such as seasonal reminders or job completion notices</li>
      </ul>
      <p><strong>Message frequency varies.</strong> Message and data rates may apply depending on your mobile carrier plan.</p>
      <p><strong>Opt-Out:</strong> You can opt out of text messages at any time by replying <strong>STOP</strong> to any text message from us, or by calling us at <a href="tel:914-391-5233">(914) 391-5233</a>. After opting out, you will receive one final confirmation message and will no longer receive texts from us unless you opt back in.</p>
      <p><strong>Opt Back In:</strong> To resume receiving text messages after opting out, text <strong>START</strong> to our number or call us at <a href="tel:914-391-5233">(914) 391-5233</a>.</p>
      <p><strong>Help:</strong> For help with our messaging program, text <strong>HELP</strong> to our number or call <a href="tel:914-391-5233">(914) 391-5233</a>.</p>
      <p><strong>Carrier Disclaimer:</strong> Carriers are not liable for delayed or undelivered messages.</p>
      <p>We will never sell your phone number to third parties or use it for unsolicited telemarketing. Your phone number is only used for communications directly related to the tree services you have requested or inquired about.</p>

      <h2>Information Sharing &amp; Mobile Data</h2>
      <p>We do <strong>not</strong> sell, rent, or trade your personal information. <strong>No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.</strong></p>
      <p>Text messaging originator opt-in data and consent will not be shared with any third parties, except as required to provide our text messaging services through our service providers (e.g., messaging platform, phone carrier aggregators).</p>
      <p>We may share information only in these limited circumstances:</p>
      <ul>
        <li><strong>Service providers:</strong> With trusted third-party tools we use to operate our business (e.g., phone/messaging service, scheduling software, payment processing), who are bound to keep your information confidential and may only use it to support our services.</li>
        <li><strong>Legal requirements:</strong> When required by law, court order, or government regulation.</li>
        <li><strong>Business protection:</strong> To protect the rights, safety, or property of Second Nature Tree Service, our customers, or the public.</li>
      </ul>

      <h2>Data Security</h2>
      <p>We take reasonable precautions to protect your personal information from unauthorized access, use, or disclosure. However, no method of electronic transmission or storage is 100% secure.</p>

      <h2>Cookies &amp; Analytics</h2>
      <p>Our website may use cookies and similar technologies to analyze traffic and improve your browsing experience. You can control cookies through your browser settings. We do not use cookies for targeted advertising.</p>

      <h2>Third-Party Links</h2>
      <p>Our website may contain links to third-party sites (e.g., Google Maps, Facebook, Instagram). We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies.</p>

      <h2>Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Request access to the personal information we hold about you</li>
        <li>Request correction or deletion of your personal information</li>
        <li>Opt out of text message communications at any time</li>
        <li>Opt out of marketing emails (if any) by using the unsubscribe link</li>
      </ul>

      <h2>Children&rsquo;s Privacy</h2>
      <p>Our website and services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children.</p>

      <h2>Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.</p>

      <h2>Contact Us</h2>
      <p>If you have questions about this Privacy Policy or wish to exercise your rights, contact us:</p>
      <ul style="list-style:none;padding-left:0;">
        <li><strong>Phone:</strong> <a href="tel:914-391-5233">(914) 391-5233</a></li>
        <li><strong>Website:</strong> <a href="contact.html">peekskilltree.com/contact</a></li>
        <li><strong>Location:</strong> Peekskill, NY 10566</li>
      </ul>

    </div>
  </section>
''' + FOOTER

write_page("privacy-policy.html", privacy_page)
print("Created privacy-policy.html")

# ============================================================
# TERMS OF SERVICE PAGE
# ============================================================
tos_page = header(
    "Terms of Service | Second Nature Tree Service",
    "Terms of service for Second Nature Tree Service including SMS messaging terms, consent, and opt-out information.",
    "terms-of-service.html", None,
    "Terms of Service",
    '<a href="index.html">Home</a> <span>&raquo;</span> Terms of Service',
    "",
    breadcrumbs=[{"name": "Home", "url": ""}, {"name": "Terms of Service", "url": "terms-of-service.html"}]
)
tos_page += '''
  <section class="section">
    <div class="container" style="max-width:800px;">

      <p style="color:var(--text-light);margin-bottom:1.5rem;"><strong>Effective Date:</strong> March 17, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> March 17, 2026</p>

      <p>Welcome to <a href="https://peekskilltree.com">peekskilltree.com</a>, the website of Second Nature Tree Service (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By using our website, contacting us, or engaging our services, you agree to these Terms of Service.</p>

      <h2>Services</h2>
      <p>Second Nature Tree Service provides professional tree removal, pruning, stump grinding, land clearing, and emergency tree services throughout Westchester, Putnam, and Southern Dutchess Counties in New York. All estimates are free and subject to on-site evaluation.</p>

      <h2>SMS/Text Messaging Terms</h2>
      <p><strong>Program Name:</strong> Second Nature Tree Service SMS Notifications</p>
      <p><strong>Program Description:</strong> When you provide your phone number and request an estimate or service, you may receive text messages from Second Nature Tree Service related to:</p>
      <ul>
        <li>Estimate confirmations and follow-ups</li>
        <li>Appointment scheduling and reminders</li>
        <li>Service updates and job completion notices</li>
        <li>Seasonal service reminders</li>
      </ul>
      <p><strong>Message frequency varies</strong> based on your service needs. Typically 1&ndash;5 messages per service interaction.</p>
      <p><strong>Message and data rates may apply.</strong> Check with your mobile carrier for details about your text and data plan.</p>

      <h3>Opt-Out</h3>
      <p>You can stop receiving text messages at any time by texting <strong>STOP</strong> to our number. You will receive one final confirmation message. You will not receive any additional texts after opting out unless you choose to opt back in.</p>

      <h3>Opt Back In</h3>
      <p>To resume receiving text messages, text <strong>START</strong> to our number or call us at <a href="tel:914-391-5233">(914) 391-5233</a>.</p>

      <h3>Help</h3>
      <p>For assistance with our text messaging program, text <strong>HELP</strong> to our number or contact us at <a href="tel:914-391-5233">(914) 391-5233</a>.</p>

      <h3>Carrier Liability</h3>
      <p>Mobile carriers are not liable for delayed or undelivered messages. Message delivery is subject to effective transmission by your mobile carrier.</p>

      <h3>Privacy</h3>
      <p>Your mobile number and opt-in consent are never shared with third parties for marketing purposes. For full details, see our <a href="privacy-policy.html">Privacy Policy</a>.</p>

      <h2>Estimates &amp; Pricing</h2>
      <p>All estimates provided by Second Nature Tree Service are free and non-binding until a written agreement is signed. Final pricing may vary based on on-site conditions, scope of work, and access considerations.</p>

      <h2>Licensing &amp; Insurance</h2>
      <p>Second Nature Tree Service is fully licensed and insured:</p>
      <ul>
        <li><strong>Westchester County License:</strong> WC-32079</li>
        <li><strong>Putnam County License:</strong> PC-50644</li>
      </ul>
      <p>Certificates of insurance are available upon request.</p>

      <h2>Website Use</h2>
      <p>The content on this website is for general informational purposes only. While we strive to keep information accurate and up to date, we make no warranties about the completeness or accuracy of the content. Use of this website does not create a contractual relationship.</p>

      <h2>Intellectual Property</h2>
      <p>All content on this website, including text, images, logos, and design, is the property of Second Nature Tree Service and is protected by applicable intellectual property laws. You may not reproduce or distribute our content without written permission.</p>

      <h2>Limitation of Liability</h2>
      <p>Second Nature Tree Service is not liable for any indirect, incidental, or consequential damages arising from the use of this website or reliance on information provided herein. Our liability is limited to the amount paid for services rendered.</p>

      <h2>Governing Law</h2>
      <p>These Terms of Service are governed by the laws of the State of New York. Any disputes arising from these terms will be resolved in the courts of Westchester County, New York.</p>

      <h2>Changes to These Terms</h2>
      <p>We may update these Terms of Service from time to time. Changes will be posted on this page with an updated effective date. Continued use of our website or services after changes constitutes acceptance of the revised terms.</p>

      <h2>Compliance</h2>
      <p>Second Nature Tree Service adheres to all applicable federal, state, and industry standards for telecommunications, including TCPA regulations, CTIA guidelines, and carrier-specific messaging policies.</p>

      <h2>Contact Us</h2>
      <p>If you have questions about these Terms of Service, contact us:</p>
      <ul style="list-style:none;padding-left:0;">
        <li><strong>Phone:</strong> <a href="tel:914-391-5233">(914) 391-5233</a></li>
        <li><strong>Website:</strong> <a href="contact.html">peekskilltree.com/contact</a></li>
        <li><strong>Location:</strong> Peekskill, NY 10566</li>
      </ul>

    </div>
  </section>
''' + FOOTER

write_page("terms-of-service.html", tos_page)
print("Created terms-of-service.html")

# ============================================================
# CUSTOM 404 PAGE
# ============================================================
page_404 = header(
    "Page Not Found | Second Nature Tree Service",
    "The page you are looking for could not be found. Visit our homepage or call (914) 391-5233 for a free tree service estimate.",
    "404.html", None,
    "Page Not Found",
    "",
    ""
)
page_404 += '''
  <section class="section" style="text-align:center;padding:3rem 0;">
    <div class="container" style="max-width:600px;">
      <p style="font-size:5rem;font-weight:800;color:var(--green-dark);margin-bottom:0;line-height:1;">404</p>
      <p style="font-size:1.15rem;color:var(--text-light);margin-bottom:2rem;">Sorry, the page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.</p>
      <div class="cta-btns" style="justify-content:center;">
        <a href="index.html" class="btn btn-primary btn-lg">Go to Homepage</a>
        <a href="tel:914-391-5233" class="btn btn-secondary btn-lg">&#9742; (914) 391-5233</a>
      </div>
    </div>
  </section>
''' + FOOTER

write_page("404.html", page_404)
print("Created 404.html")

print("\n=== ALL FILES GENERATED ===")

# ============================================================
# SITEMAP.XML GENERATOR
# ============================================================
from datetime import date
today = date.today().isoformat()

sitemap_urls = [
    ("", "1.0", "weekly"),
    ("services.html", "0.9", "monthly"),
    ("service-areas.html", "0.9", "monthly"),
    ("our-work.html", "0.8", "monthly"),
    ("contact.html", "0.9", "monthly"),
    ("tree-removal.html", "0.9", "monthly"),
    ("tree-pruning.html", "0.9", "monthly"),
    ("stump-grinding.html", "0.9", "monthly"),
    ("emergency-tree-service.html", "0.9", "monthly"),
    ("land-clearing.html", "0.9", "monthly"),
    ("privacy-policy.html", "0.3", "yearly"),
    ("terms-of-service.html", "0.3", "yearly"),
]

# Add all town pages
for t in towns:
    sitemap_urls.append((f"tree-service-{t['slug']}-ny.html", "0.8", "monthly"))

sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
sitemap_xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
for url, priority, changefreq in sitemap_urls:
    full_url = f"https://peekskilltree.com/{url}"
    sitemap_xml += f"""  <url>
    <loc>{full_url}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>\n"""
sitemap_xml += '</urlset>'

with open(os.path.join(BASE, "sitemap.xml"), "w") as f:
    f.write(sitemap_xml)
print("Created sitemap.xml")

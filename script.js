(function () {
  const storageKey = 'theme-preference';
  const legacyStorageKey = 'theme';
  const root = document.documentElement;

  const getSystemTheme = () => {
    if (!window.matchMedia) return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  };

  const getStoredTheme = () => {
    try {
      const direct = localStorage.getItem(storageKey);
      if (direct === 'light' || direct === 'dark') return direct;

      const legacy = localStorage.getItem(legacyStorageKey);
      return legacy === 'light' || legacy === 'dark' ? legacy : null;
    } catch {
      return null;
    }
  };

  const setTheme = (theme) => {
    root.setAttribute('data-theme', theme);

    const toggle = document.querySelector('#theme-toggle');
    if (toggle) toggle.setAttribute('aria-label', theme);
  };

  setTheme(getStoredTheme() ?? getSystemTheme());

  document.addEventListener('click', (event) => {
    const button = event.target && event.target.closest ? event.target.closest('#theme-toggle') : null;
    if (!button) return;

    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // ignore
    }
  });

  if (window.matchMedia) {
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      if (getStoredTheme()) return;
      setTheme(getSystemTheme());
    };

    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange);
    else if (typeof mql.addListener === 'function') mql.addListener(onChange);
  }
})();

(function () {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    document.documentElement.classList.add('reduced-motion');
    return;
  }

  const elements = Array.from(document.querySelectorAll('.reveal'));
  if (!elements.length) return;

  const reveal = (el) => el.classList.add('is-visible');

  if (!('IntersectionObserver' in window)) {
    elements.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      }
    },
    {
      root: null,
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
})();

(function () {
  const breakpoint = 980;
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const isMobile = () => {
    if (window.matchMedia) return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
    return window.innerWidth <= breakpoint;
  };

  // Build .nav-links wrapper if it doesn't exist
  let navLinks = nav.querySelector('.nav-links');
  if (!navLinks) {
    navLinks = document.createElement('div');
    navLinks.className = 'nav-links';
    navLinks.id = 'nav-links';

    const directChildren = Array.from(nav.children);
    const linkNodes = directChildren.filter((el) => el && el.tagName === 'A');
    for (const link of linkNodes) navLinks.appendChild(link);
    nav.insertBefore(navLinks, nav.firstChild);
  }

  // Build burger toggle button if it doesn't exist
  let toggle = nav.querySelector('#nav-toggle');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.id = 'nav-toggle';
    toggle.setAttribute('aria-label', 'Menu');
    toggle.setAttribute('aria-controls', navLinks.id || 'nav-links');
    toggle.setAttribute('aria-expanded', 'false');

    const lines = document.createElement('span');
    lines.className = 'nav-toggle-lines';
    lines.setAttribute('aria-hidden', 'true');

    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = 'Menu';

    toggle.appendChild(lines);
    toggle.appendChild(sr);

    const themeToggle = nav.querySelector('#theme-toggle');
    if (themeToggle) nav.insertBefore(toggle, themeToggle);
    else nav.appendChild(toggle);
  }

  const setOpen = (open) => {
    if (!isMobile()) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      navLinks.removeAttribute('hidden');
      return;
    }

    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');

    if (open) navLinks.removeAttribute('hidden');
    else navLinks.setAttribute('hidden', '');
  };

  // Initial state
  setOpen(false);

  toggle.addEventListener('click', () => {
    if (!isMobile()) return;
    const next = !nav.classList.contains('is-open');
    setOpen(next);
  });

  // Close when clicking a link
  navLinks.addEventListener('click', (event) => {
    const a = event.target && event.target.closest ? event.target.closest('a') : null;
    if (!a) return;
    setOpen(false);
  });

  // Close on outside click
  document.addEventListener('click', (event) => {
    if (!isMobile()) return;
    if (!nav.classList.contains('is-open')) return;
    const inside = event.target && event.target.closest ? event.target.closest('.nav') : null;
    if (!inside) setOpen(false);
  });

  // Close on ESC
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!nav.classList.contains('is-open')) return;
    setOpen(false);
  });

  // Reset when switching to desktop
  window.addEventListener('resize', () => setOpen(nav.classList.contains('is-open')));
})();

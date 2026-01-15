(function () {
  const storageKey = 'theme-preference';
  const legacyStorageKey = 'theme';
  const root = document.documentElement;

  const defaultTheme = 'dark';

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

  setTheme(getStoredTheme() ?? defaultTheme);

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

(function () {
  const root = document.querySelector('[data-chatbot]');
  if (!root) return;

  const fab = root.querySelector('.chatbot-fab');
  const panel = root.querySelector('#chatbot-panel');
  const closeBtn = root.querySelector('.chatbot-close');
  const messages = root.querySelector('.chatbot-messages');
  const quick = root.querySelector('.chatbot-quick');
  const form = root.querySelector('.chatbot-input');
  const input = root.querySelector('#chatbot-text');

  if (!fab || !panel || !closeBtn || !messages || !quick || !form || !input) return;

  const normalizeText = (value) => {
    const raw = String(value ?? '').trim().toLowerCase();
    try {
      return raw.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    } catch {
      // Older engines: best effort without unicode property escapes
      return raw
        .normalize ? raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : raw;
    }
  };

  const elText = (text) => document.createTextNode(String(text));

  const elLink = (text, href) => {
    const a = document.createElement('a');
    a.textContent = text;
    a.href = href;
    // keep navigation inside same tab (tel: also OK)
    return a;
  };

  const addMessage = (role, parts) => {
    const bubble = document.createElement('div');
    bubble.className = `chatbot-msg chatbot-msg--${role}`;

    const list = Array.isArray(parts) ? parts : [{ type: 'text', value: String(parts ?? '') }];
    for (const part of list) {
      if (!part) continue;
      if (part.type === 'link') bubble.appendChild(elLink(part.text, part.href));
      else if (part.type === 'br') bubble.appendChild(document.createElement('br'));
      else bubble.appendChild(elText(part.value ?? ''));
    }

    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  };

  const intents = {
    adresa: {
      title: 'Adresa',
      keywords: ['adresa', 'kde', 'kde jste', 'misto', 'mapa', 'umisteni', 'lokace'],
      answer: [
        { type: 'text', value: 'Havířov: Nákupní 1/426, Havířov – Šumbark, 736 01' },
        { type: 'br' },
        { type: 'text', value: 'Doubrava: dům č. 444, Doubrava' },
        { type: 'br' },
        { type: 'link', text: 'Otevřít mapu na stránce Kontakt', href: 'kontakt.html#mapa' },
      ],
    },
    kontakt: {
      title: 'Kontakt',
      keywords: ['kontakt', 'telefon', 'cislo', 'volat', 'zpravy', 'objednani', 'leky'],
      answer: [
        { type: 'text', value: 'Havířov: ' },
        { type: 'link', text: '+420 773 595 504', href: 'tel:+420773595504' },
        { type: 'br' },
        { type: 'text', value: 'Doubrava: ' },
        { type: 'link', text: '+420 773 118 560', href: 'tel:+420773118560' },
        { type: 'br' },
        { type: 'text', value: 'Zástup: ' },
        { type: 'link', text: '+420 596 884 608', href: 'tel:+420596884608' },
        { type: 'br' },
        { type: 'br' },
        { type: 'text', value: 'Objednávání, zprávy pro lékaře a objednání léků: 10:00–11:00 a 16:00–17:00.' },
        { type: 'br' },
        { type: 'link', text: 'Detail na stránce Kontakt', href: 'kontakt.html' },
      ],
    },
    hodiny: {
      title: 'Ordinační hodiny',
      keywords: ['hodiny', 'ordinacni', 'oteviraci', 'kdy', 'kdy mate', 'provozni doba', 'odbery'],
      answer: [
        { type: 'text', value: 'Běžné ordinační hodiny jsou na stránce Ordinační hodiny.' },
        { type: 'br' },
        { type: 'text', value: 'Tip: odběry v Havířově probíhají od 7:00.' },
        { type: 'br' },
        { type: 'link', text: 'Otevřít ordinační hodiny', href: 'hodiny.html' },
      ],
    },
    sluzby: {
      title: 'Služby',
      keywords: ['sluzby', 'ockovani', 'odbery', 'preventivni', 'potvrzeni', 'vypis', 'pojistovny'],
      answer: [
        { type: 'text', value: 'Poskytujeme preventivní a léčebnou péči, laboratorní odběry, očkování a administrativu (potvrzení, výpisy…).' },
        { type: 'br' },
        { type: 'link', text: 'Zobrazit služby', href: 'sluzby.html' },
      ],
    },
    zastup: {
      title: 'Zastupování',
      keywords: ['zastup', 'zastoupeni', 'dovolena', 'klecatsky', 'doubrava'],
      answer: [
        { type: 'text', value: 'Pro Doubravu v době dovolených zastupuje MUDr. Klečatský Vladimír.' },
        { type: 'br' },
        { type: 'text', value: 'Telefon: ' },
        { type: 'link', text: '+420 596 884 608', href: 'tel:+420596884608' },
        { type: 'br' },
        { type: 'link', text: 'Detail zastupování', href: 'zastup.html' },
      ],
    },
  };

  const findIntent = (text) => {
    const t = normalizeText(text);
    if (!t) return null;

    // direct aliases
    if (t in intents) return t;

    // keyword search
    for (const [id, intent] of Object.entries(intents)) {
      if (!intent.keywords) continue;
      for (const kw of intent.keywords) {
        if (t.includes(normalizeText(kw))) return id;
      }
    }

    return null;
  };

  const answerFor = (id) => {
    const intent = intents[id];
    if (!intent) return;
    addMessage('bot', intent.answer);
  };

  const greetOnce = () => {
    if (messages.childElementCount) return;
    addMessage('bot', [
      { type: 'text', value: 'Ahoj! Rád poradím. Vyberte téma dole, nebo napište dotaz (např. „adresa“, „kontakt“, „hodiny“).' },
    ]);
  };

  const setOpen = (open) => {
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      greetOnce();
      window.setTimeout(() => input.focus(), 0);
    }
  };

  const isOpen = () => !panel.hidden;

  fab.addEventListener('click', () => setOpen(!isOpen()));
  closeBtn.addEventListener('click', () => setOpen(false));

  // Click outside closes
  document.addEventListener('click', (event) => {
    if (!isOpen()) return;
    const inside = event.target && event.target.closest ? event.target.closest('[data-chatbot]') : null;
    if (!inside) setOpen(false);
  });

  // ESC closes
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!isOpen()) return;
    setOpen(false);
    fab.focus();
  });

  quick.addEventListener('click', (event) => {
    const btn = event.target && event.target.closest ? event.target.closest('[data-chatbot-q]') : null;
    if (!btn) return;
    const q = btn.getAttribute('data-chatbot-q');
    if (!q) return;

    addMessage('user', [{ type: 'text', value: btn.textContent || q }]);
    answerFor(q);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value;
    const cleaned = String(value ?? '').trim();
    if (!cleaned) return;

    addMessage('user', [{ type: 'text', value: cleaned }]);
    input.value = '';

    const id = findIntent(cleaned);
    if (id) {
      answerFor(id);
      return;
    }

    addMessage('bot', [
      { type: 'text', value: 'Tomu zatím nerozumím. Zkuste prosím „adresa“, „kontakt“, „hodiny“, „služby“ nebo „zastupování“.' },
    ]);
  });

  // Start closed
  setOpen(false);
})();

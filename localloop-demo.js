/* LocalLoop demo services: seeded sample data, local persistence, and screen routing. */
(() => {
  const root = '../';
  const pages = {
    welcome: root + 'localloop_welcome_screen/index.html',
    role: root + 'localloop_choose_your_role_theme_dark_mode/index.html',
    home: root + 'localloop_home_feed_theme_dark_mode/index.html',
    community: root + 'localloop_campus_community_reddit/index.html',
    cafe: root + 'localloop_cafe_menu_spot_details/index.html',
    owner: root + 'localloop_business_owner_insights/index.html',
    lake: root + 'localloop_avalahalli_lake_live_status/index.html'
  };
  const route = (name, query = '') => { if (pages[name]) location.href = pages[name] + query; };
  const notify = (message) => {
    let toast = document.getElementById('localloop-demo-toast');
    if (!toast) {
      toast = document.createElement('div'); toast.id = 'localloop-demo-toast';
      toast.style.cssText = 'position:fixed;left:50%;bottom:82px;transform:translateX(-50%);z-index:9999;background:#261d1f;color:#fff;padding:10px 16px;border-radius:12px;box-shadow:0 8px 24px #0003;font:600 13px/1.4 system-ui;max-width:90vw;text-align:center';
      document.body.appendChild(toast);
    }
    toast.textContent = message; toast.hidden = false;
    clearTimeout(window.__loopToastTimer); window.__loopToastTimer = setTimeout(() => toast.hidden = true, 2400);
  };
  const on = (el, type, fn) => el && el.addEventListener(type, fn);
  const text = (el) => (el?.innerText || el?.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const screen = location.pathname.toLowerCase();

  // Welcome actions keep the original Stitch buttons and design intact.
  if (screen.includes('welcome_screen')) {
    document.querySelectorAll('a[href="#role-select"], a[href="#login"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); route('role'); }));
    document.querySelectorAll('a[href="#merchants"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); route('owner'); }));
  }
  if (screen.includes('choose_your_role')) {
    on(document.getElementById('btn-explorer'), 'click', () => { localStorage.setItem('localloop-role', 'explorer'); route('home'); });
    on(document.getElementById('btn-merchant'), 'click', () => { localStorage.setItem('localloop-role', 'merchant'); route('owner'); });
  }

  if (screen.includes('home_feed')) {
    const articles = [...document.querySelectorAll('main article')];
    // Predetermined distances in km, in the same order as the Stitch feed cards.
    const seeded = [0.15, 0.8, 1.2, 2.4];
    articles.forEach((card, i) => { card.dataset.demoDistance = seeded[i] ?? 3.8; });
    const search = document.querySelector('input[placeholder*="Search"]');
    const slider = document.querySelector('input[type="range"]');
    const chips = [...document.querySelectorAll('main section button')].filter(b => /Cafes|Badminton|Lakes|Marts|Study Spots/i.test(text(b)));
    let selectedCategory = '';
    let filterRequest = 0;
    const runFilter = async () => {
      const q = (search?.value || '').toLowerCase().trim();
      const maxKm = Number(slider?.value || 2500) / 1000;
      const category = selectedCategory.includes('cafe') ? 'cafe' : selectedCategory.includes('badminton') ? 'sports' : selectedCategory.includes('lake') ? 'outdoors' : selectedCategory.includes('mart') ? 'shopping' : '';
      const requestId = ++filterRequest;
      let apiPlaces = null;
      try {
        const params = new URLSearchParams({ q, radius: String(maxKm), category });
        const response = await fetch(`/api/places?${params}`);
        if (response.ok) apiPlaces = (await response.json()).places;
      } catch (_) { /* Direct file/Live Server preview uses seeded browser-side filtering. */ }
      if (requestId !== filterRequest) return;
      let count = 0;
      articles.forEach(card => {
        const cardText = text(card);
        const categoryOk = !selectedCategory || (selectedCategory.includes('cafe') ? /cafe|chai|coffee/.test(cardText)
          : selectedCategory.includes('badminton') ? /badminton|smashzone|sports/.test(cardText)
          : selectedCategory.includes('lake') ? /lake|hangout|trail/.test(cardText)
          : selectedCategory.includes('mart') ? /mart|mall|shopping/.test(cardText)
          : selectedCategory.includes('study') ? /study|cafe|quiet/.test(cardText) : true);
        const apiMatch = apiPlaces && apiPlaces.some(place => cardText.includes(place.name.toLowerCase()));
        const show = apiPlaces ? Boolean(apiMatch) && categoryOk : Number(card.dataset.demoDistance) <= maxKm && categoryOk && (!q || cardText.includes(q));
        card.style.display = show ? '' : 'none'; if (show) count++;
      });
      let status = document.getElementById('demo-filter-status');
      if (!status) {
        status = document.createElement('p'); status.id = 'demo-filter-status';
        status.style.cssText = 'font-size:11px;text-align:center;color:#766b64;margin:4px 0';
        const feed = articles[0]?.parentElement; feed?.insertBefore(status, articles[0]);
      }
      if (status) status.textContent = `${count} sample places within ${maxKm < 1 ? `${Math.round(maxKm * 1000)} m` : `${maxKm.toFixed(1)} km`} · seeded distances${apiPlaces ? ' · demo API' : ''}`;
    };
    on(search, 'input', runFilter); on(slider, 'input', runFilter); runFilter();
    chips.forEach(button => button.addEventListener('click', () => {
      const label = text(button);
      selectedCategory = selectedCategory === label ? '' : label;
      chips.forEach(chip => { chip.classList.toggle('bg-primary', text(chip) === selectedCategory); chip.classList.toggle('text-white', text(chip) === selectedCategory); });
      runFilter();
    }));
    const modeButtons = [...document.querySelectorAll('main > div:first-child button')];
    on(modeButtons[1], 'click', () => route('owner'));
    document.querySelectorAll('button').forEach(button => {
      const label = text(button);
      if (/post my business|business \(post\)|sample owner dashboard/.test(label)) button.addEventListener('click', () => route('owner'));
      else if (/quick order \/ menu/.test(label)) button.addEventListener('click', () => route('cafe'));
      else if (/explore stores/.test(label)) button.addEventListener('click', () => route('cafe', '?place=rmz-galleria'));
      else if (/get walking route|plan group walk/.test(label)) button.addEventListener('click', () => route('lake'));
      else if (/book court slot/.test(label)) button.addEventListener('click', () => notify('Demo booking: SmashZone has sample court slots today at 6 PM.'));
      else if (/directions/.test(label)) button.addEventListener('click', () => notify('Sample directions · distance is seeded for this demo.'));
      if (/bookmark/.test(label)) button.addEventListener('click', () => {
        const key = 'localloop-saved'; const saved = JSON.parse(localStorage.getItem(key) || '[]');
        const title = button.closest('article')?.querySelector('h2,h3')?.textContent.trim() || 'The Chai & Code Cafe';
        const idx = saved.indexOf(title); if (idx >= 0) saved.splice(idx, 1); else saved.push(title);
        localStorage.setItem(key, JSON.stringify(saved)); notify(idx >= 0 ? 'Removed from saved places.' : `${title} saved to your LocalLoop list.`);
      });
    });
    const nav = [...document.querySelectorAll('nav a')];
    nav.forEach(a => {
      const label = text(a);
      if (label.includes('discover')) a.addEventListener('click', e => { e.preventDefault(); search?.focus(); window.scrollTo({top:0,behavior:'smooth'}); });
      if (label.includes('post')) a.addEventListener('click', e => { e.preventDefault(); route('community'); });
      if (label.includes('saved')) a.addEventListener('click', e => { e.preventDefault(); const saved=JSON.parse(localStorage.getItem('localloop-saved')||'[]'); notify(saved.length ? `Saved places: ${saved.join(', ')}` : 'No saved places yet. Tap a bookmark on a place.'); });
      if (label.includes('profile')) a.addEventListener('click', e => { e.preventDefault(); route('role'); });
    });
  }

  if (screen.includes('campus_community')) {
    const search = document.querySelector('main input[type="text"]');
    const posts = [...document.querySelectorAll('main article')];
    fetch('/api/posts').catch(() => {});
    on(search, 'input', () => posts.forEach(post => post.style.display = text(post).includes(search.value.toLowerCase().trim()) ? '' : 'none'));
    document.querySelectorAll('main button').forEach(button => {
      const label = text(button);
      if (button.title === 'Upvote' || button.title === 'Downvote') button.addEventListener('click', () => {
        const score = button.parentElement?.querySelector('span'); if (!score) return;
        const step = button.title === 'Upvote' ? 1 : -1; score.textContent = String(Math.max(0, Number(score.textContent) + step));
      });
      else if (/rsvp|join collab/.test(label)) button.addEventListener('click', () => { button.disabled = true; button.innerHTML = '✓ You’re in'; notify('You joined this sample community event.'); });
      else if (/save/.test(label)) button.addEventListener('click', () => notify('Post saved to your local demo list.'));
      else if (/whatsapp share|share/.test(label)) button.addEventListener('click', () => notify('Share link copied (demo).'));
      else if (/create a post|^\+$/.test(label)) button.addEventListener('click', () => notify('Post composer is a demo placeholder.'));
    });
  }

  if (screen.includes('business_owner_insights')) {
    const main = document.querySelector('main');
    if (main && !document.getElementById('demo-data-note')) {
      const note = document.createElement('div'); note.id = 'demo-data-note'; note.textContent = 'SAMPLE OWNER PROFILE · Generic demonstration business. This is not your business account.';
      note.style.cssText = 'margin:12px 0;padding:9px 12px;border-radius:10px;background:#f3e1bc;color:#51452a;font:700 11px/1.45 system-ui;letter-spacing:.02em';
      main.prepend(note);
    }
    fetch('/api/analytics').then(response => response.ok ? response.json() : null).then(data => {
      const note = document.getElementById('demo-data-note');
      if (note && data?.demo) note.textContent = `SAMPLE OWNER PROFILE · ${data.business}. This is a preview, not your business account. Metrics below are demo data.`;
    }).catch(() => {});
    document.querySelectorAll('nav a').forEach(a => a.addEventListener('click', e => {
      const label = text(a);
      if (!label) return;
      e.preventDefault();
      if (label.includes('feed') || label.includes('discover')) route('home');
      else if (label.includes('post')) route('community');
      else if (label.includes('saved')) notify('Your saved sample places are available from the discovery screen.');
    }));
  }

  // Keep the original screens independent while making the common back controls work as expected.
  if (screen.includes('cafe_menu_spot_details') || screen.includes('avalahalli_lake')) {
    if (screen.includes('cafe_menu_spot_details') && new URLSearchParams(location.search).get('place') === 'rmz-galleria') {
      document.title = 'RMZ Galleria Mall & Supermart | LocalLoop';
      const main = document.querySelector('main');
      const sections = [...main.querySelectorAll(':scope > section')];
      const hero = sections[0], overview = sections[1];
      const heading = overview?.querySelector('h1');
      if (heading) heading.textContent = 'RMZ Galleria Mall & Supermart';
      const description = overview?.querySelector('p');
      if (description) description.textContent = 'A neighborhood shopping hub in Yelahanka New Town with everyday essentials, fashion, a multiplex and plenty of places to eat.';
      const heroTitle = hero?.querySelector('h2');
      if (heroTitle) heroTitle.textContent = 'Shop, dine & make a day of it';
      const heroImage = hero?.querySelector('img');
      if (heroImage) {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 520"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#7a1520"/><stop offset="1" stop-color="#d7aa6d"/></linearGradient></defs><rect width="1400" height="520" fill="url(#g)"/><path d="M120 430V170h1160v260M80 170l620-120 620 120" fill="#f5efe1" fill-opacity=".16" stroke="#f5efe1" stroke-opacity=".7" stroke-width="8"/><path d="M220 250h190v180H220zm270 0h190v180H490zm270 0h190v180H760zm270 0h150v180h-150z" fill="#f5efe1" fill-opacity=".26" stroke="#f5efe1" stroke-width="6"/><text x="700" y="125" text-anchor="middle" fill="#fff9eb" font-family="Arial,sans-serif" font-size="54" font-weight="700" letter-spacing="8">RMZ GALLERIA</text><text x="700" y="490" text-anchor="middle" fill="#fff9eb" font-family="Arial,sans-serif" font-size="25" letter-spacing="5">SHOP · DINE · DISCOVER</text></svg>';
        heroImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        heroImage.alt = 'Illustrated storefront facade for RMZ Galleria Mall and Supermart';
      }
      if (hero) [...hero.querySelectorAll('span')].forEach(span => {
        if (span.textContent.includes('Open Now')) span.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-600"></span> Open daily until 10:00 PM';
        if (span.textContent.includes('150m from')) span.innerHTML = '<span class="material-symbols-outlined">near_me</span> 2.4 km from BMSIT';
        if (span.textContent.includes('Trust Score:')) span.innerHTML = '<span class="material-symbols-outlined">verified</span> Local favorite · 4.5/5';
        if (span.textContent.trim() === '4.8') span.textContent = '4.5';
        if (span.textContent.includes('(640+ student reviews)')) span.textContent = '(Neighborhood rating)';
      });
      const location = document.querySelector('header span.truncate');
      if (location) location.textContent = 'Yelahanka New Town, Bengaluru';
      const phoneLink = overview?.querySelector('a[href^="tel:"]');
      if (phoneLink) { phoneLink.href = '#store-directory'; phoneLink.innerHTML = '<span class="material-symbols-outlined">storefront</span> Store directory'; }
      const orderButton = overview && [...overview.querySelectorAll('button')].find(button => text(button).includes('order to table'));
      if (orderButton) { orderButton.innerHTML = '<span class="material-symbols-outlined">shopping_bag</span> Explore stores'; orderButton.addEventListener('click', () => document.getElementById('store-directory')?.scrollIntoView({behavior:'smooth'})); }
      const perkSection = overview?.querySelector('div.mt-space-md.pt-space-md');
      if (perkSection) {
        const perkTitle = perkSection.querySelector('div'); if (perkTitle) perkTitle.textContent = 'Mall highlights';
        const perkList = perkSection.querySelector('div.flex.flex-wrap');
        const perks = perkList ? [...perkList.children] : [];
        ['🎬 INOX multiplex','🛍️ Star Bazaar','🍽️ Food court','🚌 Direct bus connection'].forEach((value, index) => { if (perks[index]) perks[index].textContent = value; });
      }
      const menuSection = sections.find(section => section.textContent.includes('Digital Food & Drink Menu'));
      if (menuSection) {
        menuSection.id = 'store-directory';
        menuSection.innerHTML = `<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div><h2 class="font-headline-md text-headline-md text-light-text-main dark:text-dark-text-main font-bold">Explore RMZ Galleria</h2><p class="font-body-sm text-body-sm text-light-text-muted dark:text-dark-text-muted">Sample places and essentials at this neighborhood destination</p></div><span class="inline-flex items-center rounded-lg bg-surface-container dark:bg-dark-surface-wine px-3 py-1.5 text-label-sm text-on-surface-variant dark:text-dark-text-muted">DEMO DIRECTORY</span></div><div class="grid grid-cols-1 md:grid-cols-2 gap-space-md mt-space-md"><article class="bg-surface-container-lowest dark:bg-dark-surface-wine rounded-xl p-space-md border border-light-surface-container dark:border-dark-border-cream/20 shadow-sm"><h3 class="font-headline-sm text-headline-sm font-bold">INOX Cinemas</h3><p class="font-body-sm text-body-sm text-light-text-muted dark:text-dark-text-muted mt-1">Catch the latest releases at the mall multiplex.</p><span class="inline-block mt-3 rounded-full bg-surface-container dark:bg-dark-surface-elevated px-3 py-1 text-label-sm">Movies · Entertainment</span></article><article class="bg-surface-container-lowest dark:bg-dark-surface-wine rounded-xl p-space-md border border-light-surface-container dark:border-dark-border-cream/20 shadow-sm"><h3 class="font-headline-sm text-headline-sm font-bold">Star Bazaar</h3><p class="font-body-sm text-body-sm text-light-text-muted dark:text-dark-text-muted mt-1">Groceries, daily needs and household essentials.</p><span class="inline-block mt-3 rounded-full bg-surface-container dark:bg-dark-surface-elevated px-3 py-1 text-label-sm">Groceries · Shopping</span></article><article class="bg-surface-container-lowest dark:bg-dark-surface-wine rounded-xl p-space-md border border-light-surface-container dark:border-dark-border-cream/20 shadow-sm"><h3 class="font-headline-sm text-headline-sm font-bold">Food Court</h3><p class="font-body-sm text-body-sm text-light-text-muted dark:text-dark-text-muted mt-1">A mix of quick bites, cafes and family dining.</p><span class="inline-block mt-3 rounded-full bg-surface-container dark:bg-dark-surface-elevated px-3 py-1 text-label-sm">Dining · Cafes</span></article><article class="bg-surface-container-lowest dark:bg-dark-surface-wine rounded-xl p-space-md border border-light-surface-container dark:border-dark-border-cream/20 shadow-sm"><h3 class="font-headline-sm text-headline-sm font-bold">Student essentials</h3><p class="font-body-sm text-body-sm text-light-text-muted dark:text-dark-text-muted mt-1">Browse stationery, fashion and everyday shopping.</p><span class="inline-block mt-3 rounded-full bg-surface-container dark:bg-dark-surface-elevated px-3 py-1 text-label-sm">Stores · Essentials</span></article></div>`;
      }
      const communityNote = sections.find(section => section.textContent.includes('Studying late for internal assessments'));
      if (communityNote) communityNote.innerHTML = '<div class="flex items-center gap-space-sm"><div class="w-12 h-12 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold"><span class="material-symbols-outlined">shopping_bag</span></div><div><h4 class="font-title-sm text-title-sm font-bold text-on-secondary-fixed dark:text-dark-text-main">A neighborhood shopping destination</h4><p class="font-body-sm text-body-sm text-on-secondary-container dark:text-dark-text-muted">Sample directory for cinemas, groceries, dining and everyday shopping at RMZ Galleria.</p></div></div><span class="shrink-0 font-label-md text-label-md text-primary-container dark:text-inverse-primary font-bold">Yelahanka New Town</span>';
      const orderDock = document.querySelector('main + aside');
      if (orderDock) orderDock.innerHTML = '<div class="max-w-[1280px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-3 flex items-center justify-between gap-3"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg bg-surface-container dark:bg-dark-surface-elevated flex items-center justify-center text-primary-container dark:text-inverse-primary"><span class="material-symbols-outlined">storefront</span></div><div><div class="font-label-md font-bold text-light-text-main dark:text-dark-text-main">RMZ Galleria</div><div class="text-body-sm text-light-text-muted dark:text-dark-text-muted">Sample store directory</div></div></div><a href="#store-directory" class="px-5 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-white font-bold">Explore stores</a></div>';
      const save = document.getElementById('bookmarkBtn'); if (save) save.setAttribute('aria-label', 'Save RMZ Galleria');
    }
    document.querySelectorAll('button[aria-label*="back" i]').forEach(button => button.addEventListener('click', () => history.length > 1 ? history.back() : route('home')));
    document.querySelectorAll('button[aria-label*="bookmark" i], #bookmarkBtn').forEach(button => button.addEventListener('click', () => {
      button.dataset.saved = button.dataset.saved === 'true' ? 'false' : 'true';
      notify(button.dataset.saved === 'true' ? 'Saved to your LocalLoop list.' : 'Removed from your saved list.');
    }));
    document.querySelectorAll('a[href="#directions"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); notify('Sample directions · location services are not connected.'); }));
    document.querySelectorAll('button').forEach(button => {
      const label = text(button);
      if (/order|claim|reserve|book|check in|join/.test(label)) button.addEventListener('click', () => notify('Demo action recorded locally. No payment or reservation is submitted.'));
      if (/share/.test(label)) button.addEventListener('click', () => notify('Share link copied (demo).'));
    });
  }
})();

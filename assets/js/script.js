$(function () {
  'use strict';

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const $win = $(window);
  const money = function (n) { return '$' + Number(n).toLocaleString('en-US'); };
  const esc = function (s) { return $('<div>').text(s == null ? '' : s).html(); };
  const bdt = function (n) { return '\u09F3' + Number(n).toLocaleString('en-IN'); };
  const pad2 = function (n) { return String(n).padStart(2, '0'); };
  const localISO = function (d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
  const addDays = function (iso, n) { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return localISO(d); };
  const prettyDate = function (iso) {
    return iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '\u2014';
  };

  /* Marks a .field / .upload-field valid or invalid. Returns true when valid. */
  function check($el, ok) {
    $el.closest('.field, .upload-field').toggleClass('is-invalid', !ok);
    return ok;
  }
  $(document).on('input change', '.field input, .field select, .field textarea', function () {
    $(this).closest('.field').removeClass('is-invalid');
  });

  function scrollToY(y, ms) {
    if (reduceMotion) { window.scrollTo(0, y); return; }
    $('html, body').stop().animate({ scrollTop: y }, ms || 450);
  }

  /* =========================================================
     Global chrome: header, progress bar, floating buttons
  ========================================================= */
  const $header = $('#siteHeader');
  const $bar = $('<div class="scroll-progress" aria-hidden="true"></div>').appendTo('body');
  $('<a class="fab fab-wa" href="https://wa.me/8801000000000" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><i class="bi bi-whatsapp"></i></a>').appendTo('body');

  /* broken image -> soft gradient placeholder instead of a broken icon */
  const fallbackImg = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0F5C5C"/><stop offset="1" stop-color="#10243B"/></linearGradient></defs><rect width="4" height="3" fill="url(#g)"/></svg>');
  document.addEventListener('error', function (e) {
    const t = e.target;
    if (t && t.tagName === 'IMG' && t.src !== fallbackImg) { t.onerror = null; t.src = fallbackImg; }
  }, true);

  

  /* mobile menu */
  const $navToggle = $('#navToggle');
  const $mobileMenu = $('#mobileMenu');
  $navToggle.on('click', function () {
    const open = !$mobileMenu.hasClass('is-open');
    $mobileMenu.toggleClass('is-open', open);
    $navToggle.toggleClass('is-open', open).attr('aria-expanded', String(open));
  });
  $mobileMenu.on('click', 'a', function () {
    $mobileMenu.removeClass('is-open');
    $navToggle.removeClass('is-open').attr('aria-expanded', 'false');
  });
  /* Book Now dropdown: tour package / hotel (hover on desktop, click everywhere) */
  const $nb = $('.nav-book');
  if ($nb.length) {
    const $nbBtn = $nb.find('.nav-book-btn');
    let nbTimer = null;
    const setNb = function (open) {
      clearTimeout(nbTimer);
      $nb.toggleClass('is-open', open);
      $nbBtn.attr('aria-expanded', String(open));
    };
    $nbBtn.on('click', function (e) { e.stopPropagation(); setNb(!$nb.hasClass('is-open')); });
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      $nb.on('mouseenter', function () { setNb(true); });
      $nb.on('mouseleave', function () { nbTimer = setTimeout(function () { setNb(false); }, 160); });
    }
    $(document).on('click', function (e) { if (!$(e.target).closest('.nav-book').length) setNb(false); });
    $(document).on('keydown', function (e) { if (e.key === 'Escape') { setNb(false); } });
  }

  $win.on('resize', function () {
    if ($win.width() >= 992) { $mobileMenu.removeClass('is-open'); $navToggle.removeClass('is-open'); }
  });

  /* smooth fade between pages */
  if (!reduceMotion) {
    $(document).on('click', 'a[href]', function (e) {
      const href = this.getAttribute('href');
      if (!href || href.charAt(0) === '#' || this.target === '_blank' ||
          e.metaKey || e.ctrlKey || e.shiftKey || /^(mailto:|tel:|https?:|javascript:)/i.test(href)) return;
      e.preventDefault();
      $('body').addClass('is-leaving');
      setTimeout(function () { window.location.href = href; }, 240);
    });
    $win.on('pageshow', function (e) {
      if (e.originalEvent && e.originalEvent.persisted) $('body').removeClass('is-leaving');
    });
  }

  /* =========================================================
     Scroll reveal (staggered)
  ========================================================= */
  (function initReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const groups = [
      '.feature-grid .feature-card', '.steps .step', '.journey-cards .journey-card',
      '.team-grid .team-card', '.visa-service-grid .visa-service', '.dest-grid .dest-card',
      '.timeline .timeline-item', '.why-list .why-item', '.photo-strip .ph', '.check-grid .check-item', '.acc-list .acc-item', '.badge-row .badge-item'
    ];
    const singles = [
      'section h2', 'section .eyebrow-plain', 'section .section-note', 'section .card-panel',
      '.contact-detail', '.filter-meta', '.stories .story-slider', '.trust-strip .col-6'
    ];
    const skip = '.hero *, .hero, .wizard-panel *, .pkg-modal *, .page-banner *, .package-card';
    const vh = window.innerHeight;
    const seen = new Set();

    function arm(el, delay, variant) {
      if (seen.has(el)) return;
      seen.add(el);
      if (el.getBoundingClientRect().top < vh * 0.9) return;   // already on screen: leave it alone
      el.classList.add('reveal');
      if (variant) el.classList.add(variant);
      el.style.setProperty('--d', delay + 's');
      el.dataset.d = delay;
      io.observe(el);
    }

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('is-visible');
        io.unobserve(el);
        // drop the reveal classes afterwards so hover transitions aren't delayed
        setTimeout(function () {
          el.classList.remove('reveal', 'reveal-left', 'reveal-right', 'reveal-zoom', 'is-visible');
          el.style.removeProperty('--d');
        }, 1000 + (parseFloat(el.dataset.d) || 0) * 1000);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    groups.forEach(function (sel) {
      $(sel).not(skip).each(function (i) { arm(this, Math.min(i % 4, 3) * 0.1, ''); });
    });
    singles.forEach(function (sel) {
      $(sel).not(skip).each(function () { arm(this, 0, ''); });
    });
    $('.row > [class*="col-"] > img').not(skip).each(function (i) { arm(this, 0, 'reveal-zoom'); });
  })();

  /* =========================================================
     Animated stat counters
  ========================================================= */
  (function initCounters() {
    const $strip = $('.trust-strip');
    if (!$strip.length) return;
    let done = false;

    function run() {
      if (done) return;
      done = true;
      $('.stat').each(function () {
        const $el = $(this);
        const target = parseInt($el.data('count'), 10) || 0;
        const suffix = $el.data('suffix') || '';
        if (reduceMotion) { $el.text(target.toLocaleString() + suffix); return; }
        const start = performance.now();
        (function tick(now) {
          const p = Math.min((now - start) / 1300, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          $el.text(Math.round(target * eased).toLocaleString() + suffix);
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { run(); io.disconnect(); }
      }, { threshold: 0.35 });
      io.observe($strip[0]);
    } else { run(); }
  })();

  /* =========================================================
     Home: trip finder -> packages search
  ========================================================= */
  $('#finderForm').on('submit', function (e) {
    e.preventDefault();
    const dest = $('#destInput').val().trim();
    const $fb = $('#finderFeedback');
    if (!dest) {
      $fb.removeClass('is-ok').text('Tell us a destination (or just a vibe) to get started.');
      $('#destInput').trigger('focus');
      return;
    }
    $fb.addClass('is-ok').text('Got it \u2014 finding matching trips\u2026');
    setTimeout(function () { window.location.href = 'packages.html?q=' + encodeURIComponent(dest); }, 450);
  });

  /* =========================================================
     Testimonial slider
  ========================================================= */
  (function initStories() {
    const $slides = $('.story-slide');
    if (!$slides.length) return;
    const $dotsWrap = $('#storyDots');
    let idx = 0, timer = null;

    $slides.each(function (i) { $dotsWrap.append('<span data-index="' + i + '"></span>'); });
    const $dots = $dotsWrap.find('span');

    function go(i) {
      idx = (i + $slides.length) % $slides.length;
      $slides.removeClass('is-active').eq(idx).addClass('is-active');
      $dots.removeClass('is-active').eq(idx).addClass('is-active');
    }
    function auto() { clearInterval(timer); timer = setInterval(function () { go(idx + 1); }, 6000); }

    $('#storyNext').on('click', function () { go(idx + 1); auto(); });
    $('#storyPrev').on('click', function () { go(idx - 1); auto(); });
    $dotsWrap.on('click', 'span', function () { go($(this).data('index')); auto(); });
    go(0); auto();
  })();

  /* =========================================================
     Packages: cards, animated tabs, search, detail modal
  ========================================================= */
  /* restart the staggered "enter" animation on a set of cards */
  function enterCards($cards) {
    $cards.each(function (i) {
      const el = this;
      el.classList.remove('is-entering', 'is-leaving');
      void el.offsetWidth;                                 // force reflow so the animation restarts
      el.style.setProperty('--d', (reduceMotion ? 0 : i * 0.09) + 's');
      el.classList.add('is-entering');
    });
  }

  /* sliding pill behind the active tab */
  function moveIndicator($bar) {
    const $active = $bar.find('.filter-btn.is-active');
    const $ind = $bar.find('.filter-indicator');
    if (!$active.length || !$ind.length) return;
    $ind.css({ width: $active.outerWidth() + 'px', transform: 'translateX(' + $active[0].offsetLeft + 'px)' });
  }

  function initBrowser(cfg) {
    const $grid = cfg.$grid;
    if (!$grid.length) return null;

    let $cards = $grid.children('.package-card');
    $cards.each(function () {
      const $c = $(this);
      $c.attr('data-search', [$c.find('h3').text(), $c.find('.package-card__badge').text(),
        $c.find('.section-note').first().text(), $c.find('.d-overview').text(), $c.find('.hc-loc').text()].join(' ').toLowerCase());
    });
    let filter = 'all', term = '', timer = null;

    function matches() {
      return $cards.filter(function () {
        const $c = $(this);
        const okCat = filter === 'all' || $c.data('category') === filter;
        const okTerm = !term || String($c.data('search')).indexOf(term) > -1;
        const okExtra = !cfg.extra || cfg.extra($c);
        return okCat && okTerm && okExtra;
      });
    }
    function target() { const $m = matches(); return cfg.limit ? $m.slice(0, cfg.limit) : $m; }
    function updateMeta(n) {
      if (cfg.$count && cfg.$count.length) cfg.$count.text('Showing ' + n + ' ' + (cfg.noun || 'trip') + (n === 1 ? '' : 's'));
      if (cfg.$empty && cfg.$empty.length) cfg.$empty.toggleClass('is-visible', n === 0);
    }
    function render() {
      clearTimeout(timer);
      const $show = target();
      const $visible = $cards.not('.is-hidden');
      function finish() {
        $cards.addClass('is-hidden').removeClass('is-leaving is-entering');
        $show.removeClass('is-hidden');
        enterCards($show);
        updateMeta($show.length);
      }
      if (reduceMotion || !$visible.length) { finish(); return; }
      $visible.addClass('is-leaving');          // fade the current cards out...
      timer = setTimeout(finish, 230);           // ...then bring the new set in, staggered
    }

    /* tabs */
    if (cfg.$bar && cfg.$bar.length) {
      cfg.$bar.prepend('<span class="filter-indicator"></span>');
      moveIndicator(cfg.$bar);
      $win.on('resize load', function () { moveIndicator(cfg.$bar); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveIndicator(cfg.$bar); });

      cfg.$bar.on('click', '.filter-btn', function () {
        if ($(this).hasClass('is-active')) return;
        cfg.$bar.find('.filter-btn').removeClass('is-active');
        $(this).addClass('is-active');
        filter = String($(this).data('filter'));
        moveIndicator(cfg.$bar);
        if (this.scrollIntoView) this.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
        render();
      });
    }

    /* search */
    if (cfg.$search && cfg.$search.length) {
      let t = null;
      cfg.$search.on('input', function () {
        const v = $(this).val().trim().toLowerCase();
        clearTimeout(t);
        t = setTimeout(function () { term = v; render(); }, 250);
      });
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) { term = q.trim().toLowerCase(); cfg.$search.val(q); }
    }

    /* sort (hotels): reorder the real DOM nodes, then re-run the animated render */
    if (cfg.$sort && cfg.$sort.length) {
      cfg.$sort.on('change', function () {
        const mode = $(this).val();
        const num = function (el, k) { return Number($(el).data(k)) || 0; };
        const arr = $cards.toArray().sort(function (a, b) {
          if (mode === 'price-asc') return num(a, 'price') - num(b, 'price');
          if (mode === 'price-desc') return num(b, 'price') - num(a, 'price');
          if (mode === 'rating') return num(b, 'rating') - num(a, 'rating');
          return num(a, 'order') - num(b, 'order');
        });
        $grid.append(arr);
        $cards = $grid.children('.package-card');
        render();
      });
    }

    /* first paint: hold cards back until the grid scrolls into view, then animate them in */
    $cards.addClass('is-hidden');
    target().removeClass('is-hidden');
    updateMeta(target().length);
    $grid.addClass('is-pending');
    function reveal() { $grid.removeClass('is-pending'); enterCards($cards.not('.is-hidden')); }
    if ('IntersectionObserver' in window && !reduceMotion) {
      const io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { reveal(); io.disconnect(); }
      }, { threshold: 0.1 });
      io.observe($grid[0]);
    } else { reveal(); }

    return { render: render };
  }

  /* packages page */
  let pkgModal = null;
  function openPackageModal(id) {
    const $c = $('#packageGrid .package-card[data-id="' + id + '"]');
    const el = document.getElementById('packageModal');
    if (!$c.length || !el || !window.bootstrap) return;
    const name = $c.find('h3').text();
    $('#pkgModalTitle').text(name);
    $('#pkgModalImg').attr('src', $c.find('.package-card__img img').attr('src')).attr('alt', name);
    $('#pkgModalOverview').text($c.find('.d-overview').text());
    $('#pkgModalPrice').html(money($c.data('price')) + ' <small>per person</small>');
    $('#pkgModalBook').attr('href', 'booking.html?package=' + id);
    $('#pkgModalHighlights').html($c.find('.d-highlights').html());
    $('#pkgModalInclusions').html($c.find('.d-inclusions').html());
    pkgModal = pkgModal || new bootstrap.Modal(el);
    pkgModal.show();
  }

  if ($('#packageGrid').length) {
    initBrowser({
      $grid: $('#packageGrid'), $bar: $('#filterBar'), $search: $('#pkgSearch'),
      $count: $('#resultCount'), $empty: $('#noResults')
    });
    $('#packageGrid').on('click', '[data-view]', function () { openPackageModal($(this).data('view')); });
    const view = new URLSearchParams(window.location.search).get('view');
    if (view) setTimeout(function () { openPackageModal(view); }, 400);
  }

  /* home page: popular packages, tab-driven */
  initBrowser({ $grid: $('#homePackageGrid'), $bar: $('#homeTabs'), limit: 3 });

  /* home: popular hotels, tab-driven */
  initBrowser({ $grid: $('#homeHotelGrid'), $bar: $('#homeHotelTabs'), limit: 3 });

  /* home hero: Trips / Hotels switch */
  (function () {
    const $tabs = $('.finder-tab');
    if (!$tabs.length) return;
    $('#hfIn').attr('min', localISO(new Date()));
    $('#hfOut').attr('min', addDays(localISO(new Date()), 1));

    $tabs.on('click', function () {
      if ($(this).hasClass('is-active')) return;
      const target = $(this).data('target');
      $tabs.removeClass('is-active').attr('aria-selected', 'false');
      $(this).addClass('is-active').attr('aria-selected', 'true');
      $('.finder').attr('hidden', true).removeClass('is-shown');
      $('.finder[data-pane="' + target + '"]').removeAttr('hidden').addClass('is-shown');
    });
    $('#hfIn').on('change', function () {
      if (!this.value) return;
      const min = addDays(this.value, 1);
      $('#hfOut').attr('min', min);
      if (!$('#hfOut').val() || $('#hfOut').val() < min) $('#hfOut').val(min);
    });
    $('#hotelFinderForm').on('submit', function (e) {
      e.preventDefault();
      const city = $('#hfCity').val(), i = $('#hfIn').val(), o = $('#hfOut').val();
      const $fb = $('#hotelFinderFeedback');
      if (i && o && o <= i) { $fb.removeClass('is-ok').text('Check-out must be after check-in.'); return; }
      const q = [];
      if (city && city !== 'all') q.push('city=' + city);
      if (i) q.push('checkin=' + i);
      if (o) q.push('checkout=' + o);
      $fb.addClass('is-ok').text('Finding hotels\u2026');
      setTimeout(function () { window.location.href = 'hotels.html' + (q.length ? '?' + q.join('&') : ''); }, 400);
    });
  })();

  /* hotels page */
  let hotelModal = null;
  function openHotelModal(id) {
    const $c = $('#hotelGrid .hotel-card[data-id="' + id + '"]');
    const el = document.getElementById('hotelModal');
    if (!$c.length || !el || !window.bootstrap) return;
    const name = $c.find('h3').text();
    $('#htlModalTitle').text(name);
    $('#htlModalImg').attr('src', $c.find('.package-card__img img').attr('src')).attr('alt', name);
    $('#htlModalOverview').text($c.find('.d-overview').text());
    $('#htlModalPrice').html(bdt($c.data('price')) + ' <small>per night</small>');
    $('#htlModalBook').attr('href', $c.find('.btn-sm-solid').attr('href'));
    $('#htlModalAmenities').html($c.find('.d-amenities').html());
    $('#htlModalRooms').html($c.find('.d-rooms').html());
    $('#htlModalPolicy').html($c.find('.d-policy').html());
    hotelModal = hotelModal || new bootstrap.Modal(el);
    hotelModal.show();
  }

  if ($('#hotelGrid').length) {
    const $city = $('#stayCity'), $in = $('#stayIn'), $out = $('#stayOut'), $guests = $('#stayGuests');
    const api = initBrowser({
      $grid: $('#hotelGrid'), $bar: $('#hotelTabs'), $search: $('#hotelSearch'),
      $count: $('#resultCount'), $empty: $('#noResults'), $sort: $('#hotelSort'), noun: 'hotel',
      extra: function ($c) { return Number($c.data('stars')) >= (parseInt($('#hotelStars').val(), 10) || 0); }
    });
    $('#hotelStars').on('change', function () { api.render(); });

    /* destination select <-> tabs */
    $('#hotelTabs').on('click', '.filter-btn', function () { $city.val(String($(this).data('filter'))); });
    $city.on('change', function () { $('#hotelTabs .filter-btn[data-filter="' + $(this).val() + '"]').trigger('click'); });

    /* dates + guests are carried into the booking link */
    $in.attr('min', localISO(new Date()));
    $out.attr('min', addDays(localISO(new Date()), 1));
    function stayQuery() {
      const p = [];
      if ($in.val()) p.push('checkin=' + $in.val());
      if ($out.val()) p.push('checkout=' + $out.val());
      if ($guests.val()) p.push('guests=' + $guests.val());
      return p.length ? '&' + p.join('&') : '';
    }
    function updateBookLinks() {
      const q = stayQuery();
      $('#hotelGrid .hotel-card').each(function () {
        $(this).find('.btn-sm-solid').attr('href', 'hotel-booking.html?hotel=' + $(this).data('id') + q);
      });
    }
    $in.on('change', function () {
      if (!this.value) return;
      const min = addDays(this.value, 1);
      $out.attr('min', min);
      if (!$out.val() || $out.val() < min) $out.val(min);
      updateBookLinks();
    });
    $out.add($guests).on('change', updateBookLinks);

    $('#staySearch').on('submit', function (e) {
      e.preventDefault();
      const $fb = $('#stayFeedback');
      if ($in.val() && $out.val() && $out.val() <= $in.val()) { $fb.text('Check-out must be after check-in.'); return; }
      $fb.text('');
      updateBookLinks();
      scrollToY($('#hotelTabs').offset().top - 150, 450);
    });

    $('#hotelGrid').on('click', '[data-view]', function () { openHotelModal($(this).data('view')); });

    /* URL params: ?city= &checkin= &checkout= &guests= &view= */
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('checkin')) $in.val(qs.get('checkin')).trigger('change');
    if (qs.get('checkout')) $out.val(qs.get('checkout'));
    if (qs.get('guests')) $guests.val(qs.get('guests'));
    updateBookLinks();
    if (qs.get('city')) $('#hotelTabs .filter-btn[data-filter="' + qs.get('city') + '"]').trigger('click');
    if (qs.get('view')) setTimeout(function () { openHotelModal(qs.get('view')); }, 400);
  }

  /* =========================================================
     FAQ accordion
  ========================================================= */
  $('.acc-head').on('click', function () {
    const $item = $(this).closest('.acc-item');
    const wasOpen = $item.hasClass('is-open');
    $item.siblings('.acc-item').removeClass('is-open').find('.acc-body').css('max-height', 0);
    if (wasOpen) {
      $item.removeClass('is-open').find('.acc-body').css('max-height', 0);
    } else {
      $item.addClass('is-open');
      const $body = $item.find('.acc-body');
      $body.css('max-height', $body.find('.acc-body-inner')[0].scrollHeight + 'px');
    }
  });
  $('.acc-item.is-open .acc-body').each(function () {
    $(this).css('max-height', $(this).find('.acc-body-inner')[0].scrollHeight + 'px');
  });

  /* =========================================================
     Contact form
  ========================================================= */
  $('#contactForm').on('submit', function (e) {
    e.preventDefault();
    const $name = $('#nameField'), $email = $('#emailField'), $msg = $('#messageField');
    let ok = true;
    ok = check($name, $name.val().trim().length > 1) && ok;
    ok = check($email, emailPattern.test($email.val().trim())) && ok;
    ok = check($msg, $msg.val().trim().length > 4) && ok;
    if (!ok) return;

    const $btn = $(this).find('button[type="submit"]').prop('disabled', true).text('Sending\u2026');
    setTimeout(() => {
      // TODO: POST to the agency backend / email service here
      $('#formSuccess').addClass('is-visible');
      this.reset();
      $btn.prop('disabled', false).text('Send it over');
    }, 700);
  });

  /* newsletter */
  $('#newsletterForm').on('submit', function (e) {
    e.preventDefault();
    const $input = $(this).find('input');
    const $note = $('#newsletterNote');
    if (!emailPattern.test($input.val().trim())) { $note.text('That email doesn\u2019t look right.'); return; }
    $note.text('Subscribed \u2014 welcome aboard.');
    $input.val('');
  });

  $('#year').text(new Date().getFullYear());

  /* =========================================================
     Visa application + FilePond uploads
  ========================================================= */
  const visaPonds = {};
  if (typeof FilePond !== 'undefined' && $('input.filepond').length) {
    const plugins = [window.FilePondPluginFileValidateType, window.FilePondPluginFileValidateSize, window.FilePondPluginImagePreview]
      .filter(Boolean);
    FilePond.registerPlugin.apply(FilePond, plugins);

    $('input.filepond').each(function () {
      const multiple = this.hasAttribute('multiple');
      const $wrap = $(this).closest('.upload-field');
      visaPonds[this.dataset.key] = FilePond.create(this, {
        allowMultiple: multiple,
        maxFiles: multiple ? 8 : 1,
        maxFileSize: '5MB',
        acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        storeAsFile: true,           // files stay inside the real <input>, so a normal form POST carries them
        credits: false,
        labelIdle: (this.dataset.idle || 'Drag & drop files or') + ' <span class="filepond--label-action">Browse</span>',
        labelFileTypeNotAllowed: 'Only PDF, JPG or PNG files',
        fileValidateTypeLabelExpectedTypes: 'PDF, JPG or PNG',
        labelMaxFileSizeExceeded: 'File is too large',
        labelMaxFileSize: 'Maximum size is {filesize}',
        // For an async upload API instead of a form POST, add:  server: '/api/visa-upload'
        onaddfile: function () { $wrap.removeClass('is-invalid'); }
      });
    });
  }

  $('#visaForm').on('submit', function (e) {
    e.preventDefault();
    const $name = $('#visaName'), $email = $('#visaEmail'), $phone = $('#visaPhone'), $country = $('#visaCountry');
    let ok = true;
    ok = check($name, $name.val().trim().length > 1) && ok;
    ok = check($email, emailPattern.test($email.val().trim())) && ok;
    ok = check($phone, $phone.val().replace(/\D/g, '').length >= 7) && ok;
    ok = check($country, $country.val().trim().length > 1) && ok;

    const passportOk = !visaPonds.passport || visaPonds.passport.getFiles().length > 0;
    $('#passportField').toggleClass('is-invalid', !passportOk);
    ok = passportOk && ok;

    if (!ok) {
      const $first = $('.field.is-invalid, .upload-field.is-invalid').first();
      if ($first.length) scrollToY($first.offset().top - 130, 350);
      return;
    }

    let files = 0;
    Object.keys(visaPonds).forEach(function (k) { files += visaPonds[k].getFiles().length; });

    const $btn = $(this).find('button[type="submit"]').prop('disabled', true).text('Submitting\u2026');
    setTimeout(() => {
      // TODO: send form + files to the visa desk (form POST or API)
      $('#visaSuccess').addClass('is-visible')
        .find('.msg').text('Received with ' + files + ' document' + (files === 1 ? '' : 's') + '. We\'ll email your checklist within a day.');
      this.reset();
      Object.keys(visaPonds).forEach(function (k) { visaPonds[k].removeFiles(); });
      $btn.prop('disabled', false).text('Submit application');
    }, 800);
  });

  /* =========================================================
     Booking wizard
  ========================================================= */
  const $bk = $('#bookingForm');
  if ($bk.length) {
    const $pkg = $('#bkPackage'), $date = $('#bkDate'), $trav = $('#bkTravelers');
    const MAX_TRAVELERS = 10;

    document.body.classList.add('has-mobile-total');

    /* package data comes from the <option data-*> attributes in booking.html */
    function findPkg(id) {
      const $o = id ? $pkg.find('option[value="' + id + '"]') : $();
      if (!$o.length) return null;
      return { id: id, name: $o.data('name'), price: Number($o.data('price')), image: $o.data('image'),
               duration: $o.data('duration'), categoryLabel: $o.data('category') };
    }
    $date.attr('min', addDays(localISO(new Date()), 1));

    const preset = new URLSearchParams(window.location.search).get('package');
    if (preset && findPkg(preset)) $pkg.val(preset);

    /* ---- travelers ---- */
    function fieldHtml(icon, cls, label, error, opts) {
      opts = opts || {};
      const type = opts.type || 'text';
      return (
        '<div class="col-md-6"><div class="field' + (opts.static ? ' field--static' : '') + '">' +
          '<i class="bi bi-' + icon + ' f-icon"></i>' +
          '<input type="' + type + '" class="' + cls + '" placeholder=" "' + (opts.max ? ' max="' + opts.max + '"' : '') + '>' +
          '<label>' + label + '</label>' +
          (error ? '<div class="field-error">' + error + '</div>' : '') +
        '</div></div>'
      );
    }
    function travelerHtml() {
      const today = localISO(new Date());
      return (
        '<div class="traveler-block card-panel">' +
          '<div class="traveler-head"><span class="t-num">1</span><h3 class="t-title">Traveler</h3>' +
          '<button type="button" class="remove-traveler">Remove</button></div>' +
          '<div class="row g-3">' +
            fieldHtml('person', 'trav-name', 'Full name (as on passport)', 'Please add the traveler\u2019s full name.') +
            fieldHtml('calendar-heart', 'trav-dob', 'Date of birth', '', { type: 'date', static: true, max: today }) +
            fieldHtml('flag', 'trav-nationality', 'Nationality', '') +
            fieldHtml('person-vcard', 'trav-passport', 'Passport number (optional now)', '') +
          '</div>' +
        '</div>'
      );
    }
    function renumber() {
      $('.traveler-block').each(function (i) {
        $(this).find('.t-num').text(i + 1);
        $(this).find('.t-title').html('Traveler ' + (i + 1) + (i === 0 ? ' <small>(lead traveler)</small>' : ''));
        $(this).find('.remove-traveler').toggle(i > 0);
      });
    }
    function setTravelers(n) {
      n = Math.max(1, Math.min(MAX_TRAVELERS, n));
      const $list = $('#travelerList');
      let cur = $list.children('.traveler-block').length;
      while (cur < n) { $list.append(travelerHtml()); cur++; }
      while (cur > n) { $list.children('.traveler-block').last().remove(); cur--; }
      $trav.val(n);
      $('#bkTravelersLabel').text(n);
      renumber();
      updateSummary();
    }

    $('[data-stepper]').on('click', function () {
      setTravelers((parseInt($trav.val(), 10) || 1) + parseInt($(this).data('stepper'), 10));
    });
    $('#addTraveler').on('click', function () { setTravelers($('.traveler-block').length + 1); });
    $('#travelerList').on('click', '.remove-traveler', function () {
      $(this).closest('.traveler-block').remove();
      const n = $('.traveler-block').length;
      $trav.val(n); $('#bkTravelersLabel').text(n);
      renumber(); updateSummary();
    });

    /* ---- summary sidebar + mobile bar ---- */
    function updateSummary() {
      const p = findPkg($pkg.val());
      const n = parseInt($trav.val(), 10) || 1;
      const $room = $('input[name="room"]:checked');
      const extraPer = parseInt($room.data('extra'), 10) || 0;
      const base = p ? p.price * n : 0;
      const extra = p ? extraPer * n : 0;
      const total = base + extra;

      $('#sumPackage').text(p ? p.name : '\u2014');
      $('#sumDate').text($date.val() ? new Date($date.val() + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '\u2014');
      $('#sumTravelers').text(n);
      $('#sumRoom').text($room.val() || '\u2014');
      $('#sumBase').text(p ? money(base) : '$0');
      $('#sumExtra').text(money(extra));
      $('#sumTotal').text(money(total));
      $('#sumDeposit').text(money(Math.round(total * 0.3)));
      $('#mobileTotalValue').text(money(total));

      $('#sumThumb').toggleClass('is-visible', !!p);
      if (p) $('#sumThumb').attr('src', p.image).attr('alt', p.name);

      const $pv = $('#pkgPreview');
      if (p) {
        $('#pkgPrevImg').attr('src', p.image).attr('alt', p.name);
        $('#pkgPrevName').text(p.name);
        $('#pkgPrevMeta').text(p.duration + ' \u00b7 ' + p.categoryLabel + ' \u00b7 ' + money(p.price) + ' per person');
        if (!$pv.hasClass('is-visible') || $pv.data('id') !== p.id) {
          $pv.data('id', p.id).removeClass('is-visible');
          void $pv[0].offsetWidth;
          $pv.addClass('is-visible');
        }
      } else { $pv.removeClass('is-visible'); }
    }
    $bk.on('change input', '#bkPackage, #bkDate, input[name="room"]', updateSummary);

    /* ---- steps ---- */
    function goTo(n) {
      $('.wizard-panel').removeClass('is-active').filter('[data-panel="' + n + '"]').addClass('is-active');
      if (n === 'success') {
        $('.wizard-step-indicator').removeClass('is-active').addClass('is-done');
        $('#wizardProgress').css('--p', 1);
        $('#mobileTotal').hide();
        document.body.classList.remove('has-mobile-total');
      } else {
        $('#wizardProgress').css('--p', (n - 1) / 2);
        $('.wizard-step-indicator').each(function () {
          const s = parseInt($(this).data('step'), 10);
          $(this).removeClass('is-active is-done');
          if (s < n) $(this).addClass('is-done');
          if (s === n) $(this).addClass('is-active');
        });
        $('#mobileStepLabel').text('Step ' + n + ' of 3');
      }
      scrollToY($('#wizardProgress').offset().top - 110, 400);
    }

    function focusFirstInvalid() {
      const $f = $('.wizard-panel.is-active .field.is-invalid').first();
      if (!$f.length) return;
      scrollToY($f.offset().top - 150, 300);
      const fld = $f.find('input, select, textarea').first()[0];
      if (fld) fld.focus({ preventScroll: true });
    }
    function validateStep1() {
      let ok = true;
      ok = check($pkg, !!$pkg.val()) && ok;
      ok = check($date, !!$date.val()) && ok;
      if (!ok) focusFirstInvalid();
      return ok;
    }
    function validateStep2() {
      const $e = $('#bkEmail'), $p = $('#bkPhone');
      let ok = true;
      ok = check($e, emailPattern.test($e.val().trim())) && ok;
      ok = check($p, $p.val().replace(/\D/g, '').length >= 7) && ok;
      $('.trav-name').each(function () { ok = check($(this), $(this).val().trim().length > 1) && ok; });
      if (!ok) focusFirstInvalid();
      return ok;
    }

    function buildReview() {
      const p = findPkg($pkg.val());
      let html =
        '<div class="review-block"><h4>Trip</h4><p><strong>' + esc(p ? p.name : '\u2014') + '</strong></p>' +
        '<p>Departure: ' + esc($('#sumDate').text()) + ' \u00b7 ' + $trav.val() + ' traveler(s)</p>' +
        '<p>Room: ' + esc($('input[name="room"]:checked').val()) + '</p>' +
        '<p>Payment: ' + esc($('input[name="payment"]:checked').val()) + '</p></div>' +
        '<div class="review-block"><h4>Contact</h4><p>' + esc($('#bkEmail').val()) + '</p><p>' + esc($('#bkPhone').val()) +
        ($('#bkCity').val() ? ' \u00b7 ' + esc($('#bkCity').val()) : '') + '</p></div>';
      $('.traveler-block').each(function (i) {
        const nat = $(this).find('.trav-nationality').val();
        html += '<div class="review-block"><h4>Traveler ' + (i + 1) + '</h4><p>' + esc($(this).find('.trav-name').val()) + '</p>' +
          '<p>' + esc(nat || 'Nationality not provided') + '</p></div>';
      });
      $('#reviewOutput').html(html);
    }

    $('[data-next]').on('click', function () {
      const next = parseInt($(this).data('next'), 10);
      if (next === 2 && !validateStep1()) return;
      if (next === 3) { if (!validateStep2()) return; buildReview(); }
      goTo(next);
    });
    $('[data-prev]').on('click', function () { goTo(parseInt($(this).data('prev'), 10)); });

    $bk.on('submit', function (e) {
      e.preventDefault();
      const accepted = $('#bkTerms').is(':checked');
      $('#termsError').toggle(!accepted);
      if (!accepted) return;

      // Payload a real backend would receive
      const payload = {
        package: $pkg.val(), departure: $date.val(), room: $('input[name="room"]:checked').val(),
        payment: $('input[name="payment"]:checked').val(), notes: $('#bkNotes').val(),
        contact: { email: $('#bkEmail').val(), phone: $('#bkPhone').val(), city: $('#bkCity').val() },
        travelers: $('.traveler-block').map(function () {
          return { name: $(this).find('.trav-name').val(), dob: $(this).find('.trav-dob').val(),
                   nationality: $(this).find('.trav-nationality').val(), passport: $(this).find('.trav-passport').val() };
        }).get()
      };
      // TODO: fetch('/api/bookings', { method: 'POST', body: JSON.stringify(payload) })
      void payload;

      $('#bookingRefCode').text('SOL-' + Math.floor(100000 + Math.random() * 900000));
      goTo('success');
    });

    setTravelers(parseInt($trav.val(), 10) || 2);
    updateSummary();
  }

  /* =========================================================
     Hotel booking wizard
  ========================================================= */
  const $hb = $('#hotelBookingForm');
  if ($hb.length) {
    // Confirm these rates with the client / each hotel before launch
    const VAT = 0.15, SERVICE = 0.10, ADVANCE = 0.30;
    const $hotel = $('#hbHotel'), $in = $('#hbIn'), $out = $('#hbOut'), $rooms = $('#hbRooms'), $guests = $('#hbGuests');
    document.body.classList.add('has-mobile-total');

    /* hotel data comes from the <option data-*> attributes in hotel-booking.html */
    function findHotel(id) {
      const $o = id ? $hotel.find('option[value="' + id + '"]') : $();
      if (!$o.length) return null;
      return { id: id, name: $o.data('name'), city: $o.data('city'), area: $o.data('area'), price: Number($o.data('price')),
               stars: Number($o.data('stars')), image: $o.data('image') };
    }
    function nights() {
      if (!$in.val() || !$out.val()) return 0;
      const a = new Date($in.val() + 'T00:00:00'), b = new Date($out.val() + 'T00:00:00');
      return Math.max(0, Math.round((b - a) / 864e5));
    }
    const clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };

    $in.attr('min', localISO(new Date()));
    $out.attr('min', addDays(localISO(new Date()), 1));
    $in.on('change', function () {
      if (!this.value) return;
      const min = addDays(this.value, 1);
      $out.attr('min', min);
      if (!$out.val() || $out.val() < min) $out.val(min);
      updateSummary();
    });

    function setCounts(r, g) {
      $rooms.val(r); $guests.val(g);
      $('#hbRoomsLabel').text(r); $('#hbGuestsLabel').text(g);
    }
    $('[data-hstep]').on('click', function () {
      const parts = String($(this).data('hstep')).split(':');
      let r = parseInt($rooms.val(), 10) || 1, g = parseInt($guests.val(), 10) || 1;
      if (parts[0] === 'rooms') { r = clamp(r + parseInt(parts[1], 10), 1, 5); if (g < r) g = r; }
      else { g = clamp(g + parseInt(parts[1], 10), 1, 12); if (r > g) r = g; }
      setCounts(r, g);
      updateSummary();
    });

    /* ---- summary sidebar + mobile bar ---- */
    function updateSummary() {
      const h = findHotel($hotel.val());
      const n = nights();
      const r = parseInt($rooms.val(), 10) || 1, g = parseInt($guests.val(), 10) || 1;
      const $t = $('input[name="rtype"]:checked');
      const rate = h ? h.price + (parseInt($t.data('extra'), 10) || 0) : 0;
      const sub = rate * n * r;
      const svc = Math.round(sub * SERVICE);
      const vat = Math.round((sub + svc) * VAT);
      const total = sub + svc + vat;

      $('#hsHotel').text(h ? h.name : '\u2014');
      $('#hsIn').text(prettyDate($in.val()));
      $('#hsOut').text(prettyDate($out.val()));
      $('#hsNights').text(n || '\u2014');
      $('#hsRG').text(r + ' room' + (r > 1 ? 's' : '') + ' \u00b7 ' + g + ' guest' + (g > 1 ? 's' : ''));
      $('#hsType').text($t.val() || '\u2014');
      $('#hsSub').text(bdt(sub));
      $('#hsSvc').text(bdt(svc));
      $('#hsVat').text(bdt(vat));
      $('#hsTotal').text(bdt(total));
      $('#hsAdv').text(bdt(Math.round(total * ADVANCE)));
      $('#mobileTotalValue').text(bdt(total));
      $('#hbNights').prop('hidden', !n).text(n + ' night' + (n === 1 ? '' : 's') + ' \u00b7 ' + bdt(rate) + ' per room per night');

      $('#hsThumb').toggleClass('is-visible', !!h);
      if (h) $('#hsThumb').attr('src', h.image).attr('alt', h.name);

      const $pv = $('#hbPreview');
      if (h) {
        $('#hbPrevImg').attr('src', h.image).attr('alt', h.name);
        $('#hbPrevName').text(h.name);
        $('#hbPrevMeta').text(h.area + ', ' + h.city + ' \u00b7 ' + h.stars + ' star \u00b7 ' + bdt(h.price) + ' per night');
        if (!$pv.hasClass('is-visible') || $pv.data('id') !== h.id) {
          $pv.data('id', h.id).removeClass('is-visible');
          void $pv[0].offsetWidth;
          $pv.addClass('is-visible');
        }
      } else { $pv.removeClass('is-visible'); }
    }
    $hb.on('change input', '#hbHotel, #hbIn, #hbOut, input[name="rtype"]', updateSummary);

    /* ---- steps ---- */
    function goTo(n) {
      $('.wizard-panel').removeClass('is-active').filter('[data-panel="' + n + '"]').addClass('is-active');
      if (n === 'success') {
        $('.wizard-step-indicator').removeClass('is-active').addClass('is-done');
        $('#wizardProgress').css('--p', 1);
        $('#mobileTotal').hide();
        document.body.classList.remove('has-mobile-total');
      } else {
        $('#wizardProgress').css('--p', (n - 1) / 2);
        $('.wizard-step-indicator').each(function () {
          const st = parseInt($(this).data('step'), 10);
          $(this).removeClass('is-active is-done');
          if (st < n) $(this).addClass('is-done');
          if (st === n) $(this).addClass('is-active');
        });
        $('#mobileStepLabel').text('Step ' + n + ' of 3');
      }
      scrollToY($('#wizardProgress').offset().top - 110, 400);
    }
    function focusFirstInvalid() {
      const $f = $('.wizard-panel.is-active .field.is-invalid').first();
      if (!$f.length) return;
      scrollToY($f.offset().top - 150, 300);
      const fld = $f.find('input, select, textarea').first()[0];
      if (fld) fld.focus({ preventScroll: true });
    }
    function validateStep1() {
      let ok = true;
      ok = check($hotel, !!$hotel.val()) && ok;
      ok = check($in, !!$in.val()) && ok;
      ok = check($out, !!$out.val() && $out.val() > $in.val()) && ok;
      if (!ok) focusFirstInvalid();
      return ok;
    }
    function validateStep2() {
      const $n = $('#hbName'), $p = $('#hbPhone'), $e = $('#hbEmail');
      let ok = true;
      ok = check($n, $n.val().trim().length > 1) && ok;
      ok = check($p, $p.val().replace(/\D/g, '').length >= 7) && ok;
      ok = check($e, emailPattern.test($e.val().trim())) && ok;
      if (!ok) focusFirstInvalid();
      return ok;
    }
    function buildReview() {
      const h = findHotel($hotel.val());
      const n = nights();
      $('#reviewOutput').html(
        '<div class="review-block"><h4>Stay</h4><p><strong>' + esc(h ? h.name : '\u2014') + '</strong> \u00b7 ' + esc(h ? h.city : '') + '</p>' +
        '<p>' + esc(prettyDate($in.val())) + ' \u2192 ' + esc(prettyDate($out.val())) + ' \u00b7 ' + n + ' night' + (n === 1 ? '' : 's') + '</p>' +
        '<p>' + esc($('#hsRG').text()) + ' \u00b7 ' + esc($('input[name="rtype"]:checked').val()) + '</p>' +
        '<p>Estimated total: <strong>' + esc($('#hsTotal').text()) + '</strong></p></div>' +
        '<div class="review-block"><h4>Lead guest</h4><p>' + esc($('#hbName').val()) + '</p><p>' + esc($('#hbPhone').val()) + ' \u00b7 ' + esc($('#hbEmail').val()) +
        '</p><p>Arriving: ' + esc($('#hbArrival').val()) + '</p></div>'
      );
    }

    $hb.find('[data-next]').on('click', function () {
      const next = parseInt($(this).data('next'), 10);
      if (next === 2 && !validateStep1()) return;
      if (next === 3) { if (!validateStep2()) return; buildReview(); }
      goTo(next);
    });
    $hb.find('[data-prev]').on('click', function () { goTo(parseInt($(this).data('prev'), 10)); });

    $hb.on('submit', function (e) {
      e.preventDefault();
      const accepted = $('#hbTerms').is(':checked');
      $('#hbTermsError').toggle(!accepted);
      if (!accepted) return;

      // Payload a real backend would receive
      const payload = {
        hotel: $hotel.val(), checkIn: $in.val(), checkOut: $out.val(), rooms: $rooms.val(), guests: $guests.val(),
        roomType: $('input[name="rtype"]:checked').val(), payment: $('input[name="hpay"]:checked').val(),
        guest: { name: $('#hbName').val(), phone: $('#hbPhone').val(), email: $('#hbEmail').val(), id: $('#hbId').val(), arrival: $('#hbArrival').val() },
        notes: $('#hbNotes').val()
      };
      // TODO: fetch('/api/hotel-bookings', { method: 'POST', body: JSON.stringify(payload) })
      void payload;

      $('#hbRef').text('HTL-' + Math.floor(100000 + Math.random() * 900000));
      goTo('success');
    });

    /* presets from the hotels page: ?hotel= &checkin= &checkout= &guests= */
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('hotel') && findHotel(qs.get('hotel'))) $hotel.val(qs.get('hotel'));
    if (qs.get('checkin')) $in.val(qs.get('checkin')).trigger('change');
    if (qs.get('checkout')) $out.val(qs.get('checkout'));
    const g0 = parseInt(qs.get('guests'), 10);
    if (g0) setCounts(1, clamp(g0, 1, 12));
    updateSummary();
  }

});

/* Page categorie : grille produits selon ?c=<cle> */
(function () {
  'use strict';

  var key = new URLSearchParams(location.search).get('c') || 'tous-les-jellywons';
  var cats = window.CATEGORIES || {};
  var cat = cats[key] || cats['tous-les-jellywons'];
  var PFX = window.IMG_PREFIX;

  document.title = cat.title + ' – Site Web Officiel Jellywon';
  document.querySelector('[data-title]').textContent = cat.title;
  document.querySelector('[data-intro]').textContent = cat.intro || '';

  /* --- Fil d'Ariane ------------------------------------------------------- */
  var crumbs = document.querySelector('[data-crumbs]');
  (cat.crumbs || ['Accueil']).forEach(function (label, i) {
    var a = document.createElement('a');
    a.href = i === 0 ? 'index.html' : '#';
    a.textContent = label;
    crumbs.appendChild(a);
    crumbs.appendChild(document.createTextNode(' / '));
  });
  var last = document.createElement('span');
  last.textContent = cat.title;
  crumbs.appendChild(last);

  /* --- Sous-categories ---------------------------------------------------- */
  if (cat.subs && cat.subs.length) {
    var subs = document.querySelector('[data-subs]');
    subs.hidden = false;
    cat.subs.forEach(function (s) {
      var a = document.createElement('a');
      a.href = 'category.html?c=' + s[1];
      a.textContent = s[0];
      subs.appendChild(a);
    });
  }

  /* --- Grille produits ---------------------------------------------------- */
  var grid = document.querySelector('[data-grid]');
  /* Construire les lignes : soit depuis cat.rows, soit depuis PRODUCTS (mode dynamique) */
  var rows;
  if (cat.dynamic && window.PRODUCTS) {
    var filterCat = cat.filterBadge || null;
    var pool = window.PRODUCTS.filter(function(p) {
      return filterCat ? p.badge === filterCat : true;
    });
    // Mystere en tete, puis Jellycats normaux, puis Halloween en dernier
    var rank = function (p) {
      if (p.badge === 'Mystère') return 0;
      if (p.badge === 'Halloween') return 2;
      return 1;
    };
    pool.sort(function (a, b) { return rank(a) - rank(b); });
    rows = pool.map(function(p) {
      return { slug: p.slug, name: p.name, price: p.priceLabel || (p.price.toFixed(2).replace('.',',')+'\u20ac'), badge: p.badge, img: p.imgs[0] };
    });
  } else {
    rows = (cat.rows || []).map(function (r) {
      var p = r.split('|');
      return { slug: p[0], name: p[1], price: p[2], badge: p[3], img: (p[4] && p[4].match(/^https?:/) ? p[4] : PFX + p[4]) };
    });
  }

  if (!rows.length) {
    document.querySelector('[data-empty]').hidden = false;
    return;
  }

  document.querySelector('[data-bar]').hidden = false;
  document.querySelector('[data-count]').textContent = (cat.count || rows.length) + ' articles';

  function num(price) {
    var m = price.match(/(\d+),(\d{2})/);
    return m ? parseFloat(m[1] + '.' + m[2]) : 0;
  }

  function paint(list) {
    grid.innerHTML = '';
    list.forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'card';
      a.href = 'product.html?p=' + p.slug;
      a.innerHTML =
        '<div class="card__img">' +
          (p.badge ? '<span class="card__badge">' + p.badge + '</span>' : '') +
          '<img src="' + p.img + '" alt="' + p.name.replace(/"/g, '&quot;') + '" loading="lazy">' +
          '<span class="card__wish" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.6-7-9.3A4 4 0 0112 8a4 4 0 017 2.7C19 15.4 12 20 12 20z"/></svg></span>' +
        '</div>' +
        '<p class="card__name">' + p.name + '</p>' +
        '<p class="card__price">' + p.price + '</p>';
      grid.appendChild(a);
    });
  }

  paint(rows);

  document.querySelector('[data-sort]').addEventListener('change', function (e) {
    var v = e.target.value;
    var list = rows.slice();
    if (v === 'az') list.sort(function (a, b) { return a.name.localeCompare(b.name, 'fr'); });
    if (v === 'za') list.sort(function (a, b) { return b.name.localeCompare(a.name, 'fr'); });
    if (v === 'asc') list.sort(function (a, b) { return num(a.price) - num(b.price); });
    if (v === 'desc') list.sort(function (a, b) { return num(b.price) - num(a.price); });
    if (v === 'nouveaute') list.sort(function (a, b) { return (b.badge === 'Nouveauté') - (a.badge === 'Nouveauté'); });
    paint(list);
  });
})();

/* Fiche produit : remplissage depuis products.js selon ?p=<slug>.
   Si le produit n'a pas de fiche detaillee, on retombe sur les donnees de la
   grille categorie (nom, prix, visuel) sans inventer de description.
   Le panier accepte plusieurs articles ; le lien de paiement est choisi
   selon le total du panier (voir script.js). */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var slug = params.get('p');
  var list = window.PRODUCTS || [];
  var p = list.filter(function (x) { return x.slug === slug; })[0];

  /* Repli : on cherche le produit dans les grilles categorie */
  if (!p && window.CATEGORIES) {
    var PFX = window.IMG_PREFIX || '';
    Object.keys(window.CATEGORIES).some(function (k) {
      var cat = window.CATEGORIES[k];
      return (cat.rows || []).some(function (r) {
        var f = r.split('|');
        if (f[0] !== slug) return false;
        p = {
          slug: f[0], name: f[1], sku: '', dim: '',
          price: parseFloat((f[2].match(/(\d+),(\d{2})/) || [0, 0, 0])[1] + '.' + (f[2].match(/(\d+),(\d{2})/) || [0, 0, '00'])[2]),
          priceLabel: f[2], badge: f[3], crumbs: ['Accueil', cat.title], reviews: 0,
          desc: [], imgs: [PFX + f[4]], partial: true
        };
        return true;
      });
    });
  }

  if (!p) p = list[0];

  var euro = function (n) { return n.toFixed(2).replace('.', ',') + '€'; };
  var setAll = function (attr, value) {
    document.querySelectorAll('[' + attr + ']').forEach(function (el) { el.textContent = value; });
  };

  /* --- Entete de fiche ---------------------------------------------------- */
  document.title = p.name + ' – Produit Officiel Jellywon';
  setAll('data-name', p.name);
  setAll('data-price', p.priceLabel || euro(p.price));
  setAll('data-sku', p.sku || '—');
  setAll('data-dim', p.dim || '—');
  setAll('data-reviews-count', p.reviews ? '(' + p.reviews + ' Avis)' : '(0 Avis)');

  /* --- Fil d'Ariane ------------------------------------------------------- */
  var crumbs = document.querySelector('[data-crumbs]');
  p.crumbs.concat([p.name]).forEach(function (label, i, arr) {
    if (i === arr.length - 1) {
      var span = document.createElement('span');
      span.textContent = label;
      crumbs.appendChild(span);
      return;
    }
    var a = document.createElement('a');
    a.href = i === 0 ? 'index.html' : '#';
    a.textContent = label;
    crumbs.appendChild(a);
    crumbs.appendChild(document.createTextNode(' / '));
  });

  /* --- Galerie ------------------------------------------------------------ */
  var mainImg = document.querySelector('[data-main-img]');
  var thumbs = document.querySelector('[data-thumbs]');

  function show(i) {
    mainImg.src = p.imgs[i];
    mainImg.alt = p.name;
    thumbs.querySelectorAll('button').forEach(function (b, j) {
      b.setAttribute('aria-current', i === j ? 'true' : 'false');
    });
  }

  p.imgs.forEach(function (src, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Voir l’image ' + (i + 1));
    var im = document.createElement('img');
    im.src = src.replace('/stencil/1000w/', '/stencil/160w/');
    im.alt = '';
    /* Vignettes chargees tout de suite : elles sont minuscules et leur absence
       donnait l'impression que la 2e photo du produit n'existait pas. */
    im.loading = 'eager';
    /* Si la miniature 160w n'existe pas, on retombe sur le visuel plein format. */
    im.addEventListener('error', function () {
      if (im.src !== src) im.src = src;
      else b.hidden = true;
    });
    b.appendChild(im);
    b.addEventListener('click', function () { show(i); });
    thumbs.appendChild(b);
  });
  show(0);

  /* --- Description -------------------------------------------------------- */
  var desc = document.querySelector('[data-desc]');
  if (p.desc.length) {
    p.desc.forEach(function (t) {
      var el = document.createElement('p');
      el.textContent = t;
      desc.appendChild(el);
    });
  } else {
    desc.closest('details').hidden = true;
  }

  /* --- Avis --------------------------------------------------------------- */
  var box = document.querySelector('[data-reviews]');
  (window.REVIEWS || []).slice(0, p.reviews).forEach(function (r) {
    var art = document.createElement('article');
    art.className = 'review';
    art.innerHTML =
      '<h3>“' + r.title + '”</h3>' +
      '<p class="stars">' + '★'.repeat(r.stars) + '</p>' +
      '<p class="review__meta">Par ' + r.author + ', le ' + r.date + '</p>' +
      '<p>' + r.text + '</p>';
    box.appendChild(art);
  });
  if (!p.reviews) document.getElementById('avis').hidden = true;

  /* --- Rail "Pour vous" --------------------------------------------------- */
  var rail = document.querySelector('[data-related]');
  list.filter(function (x) { return x.slug !== p.slug; }).slice(0, 6).forEach(function (o) {
    var a = document.createElement('a');
    a.className = 'card';
    a.href = 'product.html?p=' + o.slug;
    a.innerHTML =
      '<div class="card__img"><img src="' + o.imgs[0].replace('/stencil/1000w/', '/stencil/500x500/') + '" alt="' + o.name + '" loading="lazy"></div>' +
      '<p class="card__name">' + o.name + '</p>' +
      '<p class="card__price">' + euro(o.price) + '</p>';
    rail.appendChild(a);
  });

  /* --- Panier : plusieurs articles possibles ------------------------------ */
  var btn = document.querySelector('[data-add-cart]');
  var note = document.querySelector('[data-added]');
  var addedTimer;

  function showAdded() {
    note.hidden = false;
    note.textContent = 'Ajouté à votre panier !';
    clearTimeout(addedTimer);
    addedTimer = setTimeout(function () { note.hidden = true; }, 2500);
  }

  btn.addEventListener('click', function () {
    if (window.jcAddToCart) {
      window.jcAddToCart({
        slug: p.slug,
        name: p.name,
        price: p.priceLabel || euro(p.price),
        priceValue: p.price,
        img: p.imgs[0]
      });
    }
    showAdded();
    if (window.jcOpenDrawer) window.jcOpenDrawer();
    else document.dispatchEvent(new CustomEvent('jc:open-cart'));
  });
  /* --- Guide des tailles -------------------------------------------------- */
  var sgOverlay = document.getElementById('sizeguide-overlay');
  var sgModal   = document.getElementById('sizeguide');
  var sgClose   = document.getElementById('sizeguide-close');
  var sgOpen    = document.querySelector('.pdp__sizelink');

  function openSizeGuide() {
    if (!sgOverlay || !sgModal) return;
    sgOverlay.classList.add('open');
    sgModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (sgClose) sgClose.focus();
  }
  function closeSizeGuide() {
    if (!sgOverlay || !sgModal) return;
    sgOverlay.classList.remove('open');
    sgModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (sgOpen)    sgOpen.addEventListener('click', openSizeGuide);
  if (sgOverlay) sgOverlay.addEventListener('click', closeSizeGuide);
  if (sgClose)   sgClose.addEventListener('click', closeSizeGuide);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSizeGuide();
  });

  /* Les liens "Guide des Tailles" du pied de page ouvrent la meme modale */
  document.querySelectorAll('.footer a').forEach(function (a) {
    if (a.textContent.trim() === 'Guide des Tailles') {
      a.addEventListener('click', function (e) { e.preventDefault(); openSizeGuide(); });
    }
  });
})();
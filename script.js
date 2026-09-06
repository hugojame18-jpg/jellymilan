/* Recherche live */
(function () {
  function initSearch() {
    var form = document.querySelector('.search');
    if (!form) return;
    var input = form.querySelector('input[type="search"]');
    if (!input) return;

    var dropdown = document.createElement('ul');
    dropdown.className = 'search-dropdown';
    dropdown.hidden = true;
    form.appendChild(dropdown);

    function query(q) {
      q = q.trim().toLowerCase();
      if (!q || !window.PRODUCTS) return [];
      return window.PRODUCTS.filter(function (p) {
        return p.name.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 8);
    }

    function render(results) {
      dropdown.innerHTML = '';
      if (!results.length) { dropdown.hidden = true; return; }
      results.forEach(function (p) {
        var li = document.createElement('li');
        li.className = 'search-dropdown__item';
        var img = p.imgs && p.imgs[0] ? '<img src="' + p.imgs[0] + '" alt="">' : '';
        li.innerHTML = img + '<span>' + p.name + '</span><small>' + (p.priceLabel || '') + '</small>';
        li.addEventListener('mousedown', function (e) {
          e.preventDefault();
          window.location.href = 'product.html?p=' + p.slug;
        });
        dropdown.appendChild(li);
      });
      dropdown.hidden = false;
    }

    input.addEventListener('input', function () { render(query(input.value)); });
    input.addEventListener('focus', function () { render(query(input.value)); });
    input.addEventListener('blur', function () { setTimeout(function () { dropdown.hidden = true; }, 150); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var results = query(input.value);
      if (results.length) window.location.href = 'product.html?p=' + results[0].slug;
    });

    // Loupe mobile
    var toggleBtn = document.getElementById('search-toggle');
    if (toggleBtn) {
      var overlay = document.createElement('div');
      overlay.className = 'search-overlay';
      var overlayInput = document.createElement('input');
      overlayInput.type = 'search';
      overlayInput.placeholder = 'Que recherchez-vous ?';
      var closeBtn2 = document.createElement('button');
      closeBtn2.className = 'search-overlay__close';
      closeBtn2.innerHTML = '&times;';
      closeBtn2.type = 'button';
      var overlayDropdown = document.createElement('ul');
      overlayDropdown.className = 'search-dropdown';
      overlayDropdown.hidden = true;
      overlay.appendChild(overlayInput);
      overlay.appendChild(closeBtn2);
      overlay.appendChild(overlayDropdown);
      document.body.appendChild(overlay);

      function renderOverlay(results) {
        overlayDropdown.innerHTML = '';
        if (!results.length) { overlayDropdown.hidden = true; return; }
        results.forEach(function (p) {
          var li = document.createElement('li');
          li.className = 'search-dropdown__item';
          var img = p.imgs && p.imgs[0] ? '<img src="' + p.imgs[0] + '" alt="">' : '';
          li.innerHTML = img + '<span>' + p.name + '</span><small>' + (p.priceLabel || '') + '</small>';
          li.addEventListener('mousedown', function (e) {
            e.preventDefault();
            window.location.href = 'product.html?p=' + p.slug;
          });
          overlayDropdown.appendChild(li);
        });
        overlayDropdown.hidden = false;
      }

      toggleBtn.addEventListener('click', function () {
        overlay.classList.add('open');
        overlayInput.focus();
      });
      closeBtn2.addEventListener('click', function () {
        overlay.classList.remove('open');
        overlayInput.value = '';
        overlayDropdown.hidden = true;
      });
      overlayInput.addEventListener('input', function () { renderOverlay(query(overlayInput.value)); });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }
})();

/* Compte à rebours déstockage 48h */
(function(){
  var KEY = 'jc_destockage_end';
  var DURATION = 48 * 3600 * 1000;
  var end = localStorage.getItem(KEY);
  if (!end) {
    end = Date.now() + DURATION;
    try { localStorage.setItem(KEY, end); } catch(e){}
  } else {
    end = parseInt(end, 10);
  }
  function tick() {
    var el = document.getElementById('urgency-timer');
    if (!el) return;
    var rem = Math.max(0, end - Date.now());
    var h = Math.floor(rem / 3600000);
    var m = Math.floor((rem % 3600000) / 60000);
    var s = Math.floor((rem % 60000) / 1000);
    el.textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    if (rem > 0) setTimeout(tick, 1000);
  }
  tick();
})();

/* Carrousel heros + rails de produits */
(function () {
  'use strict';

  /* --- Carrousel heros ---------------------------------------------------- */
  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    var track = hero.querySelector('[data-hero-track]');
    var slides = track.children;
    var dotsBox = hero.querySelector('[data-hero-dots]');
    var index = 0;
    var timer;

    var dots = Array.prototype.map.call(slides, function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Aller à la diapositive ' + (i + 1));
      dot.addEventListener('click', function () { go(i); });
      dotsBox.appendChild(dot);
      return dot;
    });

    function render() {
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      dots.forEach(function (dot, i) {
        dot.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }

    function go(i) {
      index = (i + slides.length) % slides.length;
      render();
      restart();
    }

    function restart() {
      clearInterval(timer);
      timer = setInterval(function () { go(index + 1); }, 7000);
    }

    hero.querySelector('[data-hero-prev]').addEventListener('click', function () { go(index - 1); });
    hero.querySelector('[data-hero-next]').addEventListener('click', function () { go(index + 1); });

    render();
    restart();
  });

  /* --- Rails de produits -------------------------------------------------- */
  document.querySelectorAll('[data-rail]').forEach(function (rail) {
    var scroller = rail.querySelector('[data-rail-scroller]');

    function step() {
      var card = scroller.querySelector('.card');
      return card ? card.getBoundingClientRect().width + 20 : 240;
    }

    rail.querySelector('[data-rail-prev]').addEventListener('click', function () {
      scroller.scrollBy({ left: -step() * 2, behavior: 'smooth' });
    });
    rail.querySelector('[data-rail-next]').addEventListener('click', function () {
      scroller.scrollBy({ left: step() * 2, behavior: 'smooth' });
    });
  });

  /* --- Tiroir panier / paiement ------------------------------------------- */
  var overlay  = document.getElementById('drawer-overlay');
  var drawer   = document.getElementById('cart-drawer');
  var closeBtn = document.getElementById('drawer-close');

  /* Paliers de paiement, tries du plus petit au plus grand prix.
     Regle : on ne fait JAMAIS payer plus que le total reel du panier.
     On choisit donc le palier le plus eleve qui reste <= au total
     (jamais un palier au-dessus, meme si c'est le plus proche). */
  var PRICE_LINKS = [
    { price: 2,     url: 'https://t.trklinkx.com/click?pid=4784&offer_id=13086&sub3=mil'  },
    { price: 9.99,  url: 'https://t.trklinkx.com/click?pid=4784&offer_id=13179&sub3=mil'  },
    { price: 19.99, url: 'https://t.trklinkx.com/click?pid=4784&offer_id=13057&sub3=mil'  },
    { price: 49.99, url: 'https://t.trklinkx.com/click?pid=4784&offer_id=12355&sub3=mil'  },
    { price: 79.99, url: 'https://t.trklinkx.com/click?pid=4784&offer_id=12541&sub3=mil'  },
    { price: 99.99, url: 'https://t.trklinkx.com/click?pid=4784&offer_id=12913&sub3=mil'  }
  ];
  /* Retourne le palier { price, url } le plus eleve <= total (jamais au-dessus).
     Tolerance de 10 centimes pour absorber les ecarts d'arrondi normaux
     (ex: 4 x 19,99 = 79,96, tres proche du palier 79,99) sans jamais
     autoriser un ecart important comme 39,98 -> 49,99. */
  var EPSILON = 0.10;
  function tierForTotal(total) {
    var chosen = PRICE_LINKS[0];
    for (var i = 0; i < PRICE_LINKS.length; i++) {
      if (PRICE_LINKS[i].price <= total + EPSILON) chosen = PRICE_LINKS[i];
    }
    return chosen;
  }
  function linkForTotal(total) { return tierForTotal(total).url; }
  window.jcLinkForTotal = linkForTotal;

  function euro(n) { return n.toFixed(2).replace('.', ',') + '€'; }

  function readCart() {
    try { return JSON.parse(localStorage.getItem('jc_cart') || '[]'); } catch (e) { return []; }
  }
  function writeCart(cart) {
    try { localStorage.setItem('jc_cart', JSON.stringify(cart)); } catch (e) { /* stockage indisponible */ }
  }
  window.jcReadCart = readCart;
  window.jcWriteCart = writeCart;

  function cartTotal(cart) {
    return cart.reduce(function (sum, item) { return sum + (item.priceValue || 0) * (item.qty || 1); }, 0);
  }
  function cartCount(cart) {
    return cart.reduce(function (sum, item) { return sum + (item.qty || 1); }, 0);
  }

  function paintCount() {
    var n = cartCount(readCart());
    document.querySelectorAll('[data-cart-count]').forEach(function (el) { el.textContent = n; });
  }

  /* Ajoute un produit au panier (ou incremente sa quantite s'il y est deja) */
  function addToCart(product) {
    var cart = readCart();
    var existing = cart.filter(function (it) { return it.slug === product.slug; })[0];
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({
        slug: product.slug,
        name: product.name,
        price: product.price,
        priceValue: product.priceValue,
        img: product.img,
        qty: 1
      });
    }
    writeCart(cart);
    document.dispatchEvent(new CustomEvent('jc:cart-changed'));
    return cart;
  }
  window.jcAddToCart = addToCart;

  function changeQty(slug, delta) {
    var cart = readCart();
    var idx = -1;
    cart.forEach(function (it, i) { if (it.slug === slug) idx = i; });
    if (idx === -1) return;
    cart[idx].qty = (cart[idx].qty || 1) + delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    writeCart(cart);
    renderDrawer();
    document.dispatchEvent(new CustomEvent('jc:cart-changed'));
  }

  function removeItem(slug) {
    var cart = readCart().filter(function (it) { return it.slug !== slug; });
    writeCart(cart);
    renderDrawer();
    document.dispatchEvent(new CustomEvent('jc:cart-changed'));
  }

  function renderDrawer() {
    var cart     = readCart();
    var listEl   = document.getElementById('drawer-items');
    var emptyMsg = document.getElementById('drawer-empty');
    var totalBox = document.getElementById('drawer-total');
    var checkout = document.getElementById('drawer-checkout');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (cart.length) {
      if (emptyMsg) emptyMsg.hidden = true;
      cart.forEach(function (item) {
        var row = document.createElement('div');
        row.className = 'drawer__item';
        row.innerHTML =
          '<img src="' + item.img + '" alt="' + item.name + '">' +
          '<div class="drawer__item-info">' +
            '<p class="drawer__item-name">' + item.name + '</p>' +
            '<p class="drawer__item-price">' + item.price + '</p>' +
            '<div class="drawer__qty">' +
              '<button type="button" class="drawer__qty-btn" data-dec aria-label="Retirer un exemplaire">−</button>' +
              '<span>' + (item.qty || 1) + '</span>' +
              '<button type="button" class="drawer__qty-btn" data-inc aria-label="Ajouter un exemplaire">+</button>' +
            '</div>' +
            '<button type="button" class="drawer__remove" data-remove>Supprimer</button>' +
          '</div>';
        row.querySelector('[data-inc]').addEventListener('click', function () { changeQty(item.slug, 1); });
        row.querySelector('[data-dec]').addEventListener('click', function () { changeQty(item.slug, -1); });
        row.querySelector('[data-remove]').addEventListener('click', function () { removeItem(item.slug); });
        listEl.appendChild(row);
      });
    } else {
      if (emptyMsg) emptyMsg.hidden = false;
    }

    var total = cartTotal(cart);
    var promoEl = document.getElementById('drawer-promo');
    if (cart.length) {
      var tier = tierForTotal(total);
      if (totalBox) {
        totalBox.hidden = false;
        document.getElementById('drawer-total-amount').textContent = euro(total);
      }
      if (checkout) {
        checkout.hidden = false;
        checkout.href = tier.url;
      }
      if (promoEl) {
        var diff = tier.price - total;
        if (diff < -0.005) {
          promoEl.hidden = false;
          promoEl.textContent = '🎉 Petite promo : vous payez ' + euro(tier.price) + ' au lieu de ' + euro(total) + '.';
        } else if (diff > 0.005) {
          promoEl.hidden = false;
          promoEl.textContent = 'ℹ️ Total arrondi à ' + euro(tier.price) + ' pour le paiement.';
        } else {
          promoEl.hidden = true;
        }
      }
    } else {
      if (totalBox) totalBox.hidden = true;
      if (checkout) checkout.hidden = true;
      if (promoEl) promoEl.hidden = true;
    }
    paintCount();
  }
  window.jcRenderDrawer = renderDrawer;

  function openDrawer() {
    if (!overlay || !drawer) return;
    renderDrawer();
    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  window.jcOpenDrawer = openDrawer;

  function closeDrawer() {
    if (!overlay || !drawer) return;
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-cart]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); openDrawer(); });
  });
  if (overlay) overlay.addEventListener('click', closeDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  document.addEventListener('jc:open-cart', openDrawer);
  document.addEventListener('jc:cart-changed', paintCount);

  /* --- Compteur du panier (partage entre les pages) ----------------------- */
  paintCount();
})();

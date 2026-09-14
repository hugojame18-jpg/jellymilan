/* ==========================================================================
   Page livraison — collecte les coordonnees puis passe la main a l'offre.

   Le panier et le palier de prix viennent de script.js (jcReadCart /
   jcTierForTotal) : une seule source de verite pour les offer_id.
   Les coordonnees partent dans l'URL de l'offre en sub9..sub16.
   ========================================================================== */
(function () {
  'use strict';

  /* Champ du formulaire -> sub ID attendu par l'offre. */
  var SUB_MAP = [
    ['sub9',  'first'],
    ['sub10', 'last'],
    ['sub11', 'email'],
    ['sub12', 'phone'],
    ['sub13', 'address'],
    ['sub14', 'zip'],
    ['sub15', 'city'],
    ['sub16', 'country']
  ];

  var STORE_KEY = 'jc_ship';

  var form    = document.getElementById('ship-form');
  var grid    = document.getElementById('ship-grid');
  var empty   = document.getElementById('ship-empty');
  var country = document.getElementById('f-country');
  var prefix  = document.getElementById('f-prefix');
  var phone   = document.getElementById('f-phone');

  if (!form) return;

  function euro(n) { return n.toFixed(2).replace('.', ',') + '€'; }
  function $(id) { return document.getElementById(id); }

  /* --- Panier -------------------------------------------------------------- */

  function readCart() {
    if (window.jcReadCart) return window.jcReadCart();
    try { return JSON.parse(localStorage.getItem('jc_cart') || '[]'); } catch (e) { return []; }
  }

  var cart  = readCart();
  var total = cart.reduce(function (sum, it) {
    return sum + (it.priceValue || 0) * (it.qty || 1);
  }, 0);

  if (!cart.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (grid) grid.hidden = false;

  /* Palier facture : jamais au-dessus du total reel (regle de script.js). */
  var tier = window.jcTierForTotal
    ? window.jcTierForTotal(total)
    : { price: total, url: window.jcLinkForTotal ? window.jcLinkForTotal(total) : '#' };

  /* --- Recapitulatif ------------------------------------------------------- */

  function renderSummary() {
    var box = $('ship-items');
    if (!box) return;
    box.innerHTML = '';

    cart.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'ship-item';
      var img = document.createElement('img');
      img.src = item.img || '';
      img.alt = item.name || '';
      img.loading = 'lazy';

      var info = document.createElement('div');
      info.className = 'ship-item__info';
      var name = document.createElement('p');
      name.className = 'ship-item__name';
      name.textContent = item.name || '';
      var qty = document.createElement('p');
      qty.className = 'ship-item__qty';
      qty.textContent = 'Quantité : ' + (item.qty || 1);
      info.appendChild(name);
      info.appendChild(qty);

      var price = document.createElement('p');
      price.className = 'ship-item__price';
      price.textContent = euro((item.priceValue || 0) * (item.qty || 1));

      row.appendChild(img);
      row.appendChild(info);
      row.appendChild(price);
      box.appendChild(row);
    });

    $('ship-subtotal').textContent = euro(total);
    $('ship-total').textContent    = euro(tier.price);
    $('ship-submit-total').textContent = euro(tier.price);

    var promo = $('ship-promo');
    var diff  = tier.price - total;
    if (promo) {
      if (diff < -0.005) {
        promo.hidden = false;
        promo.textContent = '🎉 Petite promo : vous payez ' + euro(tier.price) +
                            ' au lieu de ' + euro(total) + '.';
      } else if (diff > 0.005) {
        promo.hidden = false;
        promo.textContent = 'ℹ️ Total arrondi à ' + euro(tier.price) + ' pour le paiement.';
      }
    }
  }

  /* --- Prefixe telephonique pilote par le pays ----------------------------- */

  function currentPrefix() {
    var opt = country.options[country.selectedIndex];
    return (opt && opt.getAttribute('data-prefix')) || '+33';
  }
  function syncPrefix() {
    if (prefix) prefix.textContent = currentPrefix();
  }
  country.addEventListener('change', function () { syncPrefix(); save(); });

  /* Numero au format international : +33612345678.
     On accepte les trois facons de taper un numero sans jamais doubler
     l'indicatif : 06 12..., +33 6 12... et 0033 6 12...
     L'ordre compte : on retire l'indicatif AVANT le 0 national, sinon un
     numero comme 03 39 12 34 56 se ferait amputer a tort. */
  function fullPhone() {
    var pfx    = currentPrefix();              /* "+33" */
    var pfxNum = pfx.replace(/\D/g, '');       /* "33"  */
    var digits = (phone.value || '').replace(/[^\d]/g, '');
    if (!digits) return '';

    if (digits.indexOf('00') === 0)     digits = digits.slice(2);
    if (digits.indexOf(pfxNum) === 0)   digits = digits.slice(pfxNum.length);
    if (digits.charAt(0) === '0')       digits = digits.slice(1);

    return digits ? pfx + digits : '';
  }

  /* --- Persistance : un retour arriere ne doit rien faire retaper ---------- */

  function values() {
    return {
      first:   $('f-first').value.trim(),
      last:    $('f-last').value.trim(),
      email:   $('f-email').value.trim(),
      phone:   phone.value.trim(),
      address: $('f-address').value.trim(),
      zip:     $('f-zip').value.trim(),
      city:    $('f-city').value.trim(),
      country: country.value
    };
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(values())); } catch (e) { /* stockage indisponible */ }
  }

  function restore() {
    var data;
    try { data = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { return; }
    if (!data || typeof data !== 'object') return;
    if (data.first)   $('f-first').value   = data.first;
    if (data.last)    $('f-last').value    = data.last;
    if (data.email)   $('f-email').value   = data.email;
    if (data.phone)   phone.value          = data.phone;
    if (data.address) $('f-address').value = data.address;
    if (data.zip)     $('f-zip').value     = data.zip;
    if (data.city)    $('f-city').value    = data.city;
    if (data.country) country.value        = data.country;
  }

  /* --- Validation legere --------------------------------------------------- */

  function setError(id, on) {
    var msg   = document.querySelector('[data-err-for="' + id + '"]');
    var field = $(id);
    if (msg) msg.hidden = !on;
    if (field) field.classList.toggle('is-invalid', !!on);
  }

  function validate() {
    var v  = values();
    var ok = true;

    [['f-first', v.first], ['f-last', v.last], ['f-address', v.address],
     ['f-zip', v.zip], ['f-city', v.city]].forEach(function (pair) {
      var bad = !pair[1];
      setError(pair[0], bad);
      if (bad) ok = false;
    });

    var emailBad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email);
    setError('f-email', emailBad);
    if (emailBad) ok = false;

    var phoneBad = fullPhone().replace(/\D/g, '').length < 8;
    setError('f-phone', phoneBad);
    if (phoneBad) ok = false;

    return ok;
  }

  /* --- Construction de l'URL de paiement ----------------------------------- */

  function buildOfferUrl() {
    var v = values();
    v.phone = fullPhone();          /* +33... et non le 06 local */

    var url = tier.url;
    var sep = url.indexOf('?') === -1 ? '?' : '&';

    SUB_MAP.forEach(function (pair) {
      var value = v[pair[1]];
      if (!value) return;
      /* encodeURIComponent transforme le + du telephone en %2B :
         sans ca le reseau recoit un espace a la place. */
      url += sep + pair[0] + '=' + encodeURIComponent(value);
      sep = '&';
    });

    return url;
  }

  window.jcBuildOfferUrl = buildOfferUrl;   /* utile pour verifier en console */

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      var firstBad = form.querySelector('.is-invalid');
      if (firstBad) { firstBad.focus(); firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return;
    }
    save();

    var btn = $('ship-submit');
    if (btn) { btn.disabled = true; btn.textContent = 'Redirection vers le paiement…'; }

    window.location.href = buildOfferUrl();
  });

  /* Sauvegarde a chaque frappe, et efface l'erreur des que le champ est
     corrige (sans jamais en faire apparaitre avant une tentative d'envoi :
     seul un champ deja marque declenche une revalidation). */
  form.addEventListener('input', function (e) {
    save();
    if (e.target && e.target.classList.contains('is-invalid')) validate();
  });
  form.addEventListener('change', function (e) {
    if (e.target && e.target.classList.contains('is-invalid')) validate();
  });

  /* --- Demarrage ----------------------------------------------------------- */

  restore();
  syncPrefix();
  renderSummary();
})();

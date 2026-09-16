(() => {
  const root = document.querySelector("[data-checkout]");
  if (!root) return;
  const token = localStorage.getItem("maelie_token");
  const cart = MAELIE.cart();
  if (!cart.length) {
    root.innerHTML =
      '<div class="empty"><h2>Votre panier est vide</h2><a class="btn btn-primary" href="boutique.html">Retour à la boutique</a></div>';
    return;
  }
  if (!token) {
    root.innerHTML =
      '<div class="empty"><h2>Connectez-vous pour commander</h2><p class="muted">Votre panier est conservé.</p><a class="btn btn-primary" href="compte.html">Accéder à mon compte</a></div>';
    return;
  }
  const sub = cart.reduce(
      (s, x) => s + MAELIE.product(x.id).price * x.quantity,
      0,
    ),
    discount =
      localStorage.getItem(MAELIE.COUPON) === "MAELIE10" ? sub * 0.1 : 0,
    ship = sub - discount >= 80 ? 0 : 4.9;
  root.innerHTML = `<div class="auth-grid"><div class="form-card"><span class="eyebrow">Dernière étape</span><h2>Adresse de livraison</h2><form class="form" data-order><div class="field"><label>E-mail</label><input name="email" type="email" required></div><div class="field"><label>Nom complet</label><input name="name" required></div><div class="field"><label>Téléphone</label><input name="phone" type="tel" required></div><div class="field"><label>Adresse</label><input name="address" required></div><div style="display:grid;grid-template-columns:1fr 2fr;gap:10px"><div class="field"><label>Code postal</label><input name="zip" required></div><div class="field"><label>Ville</label><input name="city" required></div></div><button class="btn btn-primary">Confirmer ma commande</button></form></div><aside class="summary"><span class="eyebrow">Votre sélection</span><h2>Récapitulatif</h2>${cart
    .map((x) => {
      const p = MAELIE.product(x.id);
      return `<div class="summary-row"><span>${p.name} × ${x.quantity}</span><strong>${MAELIE.money(p.price * x.quantity)}</strong></div>`;
    })
    .join(
      "",
    )}<div class="summary-row"><span>Sous-total</span><strong>${MAELIE.money(sub)}</strong></div><div class="summary-row"><span>Livraison</span><strong>${ship ? MAELIE.money(ship) : "Offerte"}</strong></div>${discount ? `<div class="summary-row"><span>Réduction</span><strong>-${MAELIE.money(discount)}</strong></div>` : ""}<div class="summary-row summary-total"><span>Total</span><strong>${MAELIE.money(sub - discount + ship)}</strong></div></aside></div>`;
  root.querySelector("[data-order]").onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          items: cart,
          address: {
            email: fd.email,
            name: fd.name,
            phone: fd.phone,
            address: fd.address,
            zip: fd.zip,
            city: fd.city,
          },
          coupon: localStorage.getItem(MAELIE.COUPON) || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      MAELIE.setCart([]);
      localStorage.removeItem(MAELIE.COUPON);
      root.innerHTML = `<div class="success"><div class="check">✓</div><span class="eyebrow">Merci pour votre confiance</span><h1>Commande confirmée</h1><p>Votre commande <strong>${d.number}</strong> a bien été enregistrée.</p><p class="muted">Retrouvez son statut depuis votre espace personnel.</p><a class="btn btn-primary" href="compte.html">Voir mon compte</a></div>`;
    } catch (x) {
      MAELIE.toast(x.message);
    }
  };
})();

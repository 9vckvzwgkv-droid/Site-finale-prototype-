(() => {
  const root = document.querySelector("[data-cart]");
  if (!root) return;
  const getCoupon = () =>
    localStorage.getItem(MAELIE.COUPON) === "MAELIE10" ? "MAELIE10" : "";
  const render = () => {
    const items = MAELIE.cart();
    const layout = document.querySelector(".cart-layout");
    let summary = document.querySelector("[data-summary]");
    if (!items.length) {
      root.innerHTML =
        '<div class="empty"><h2>Votre panier est vide</h2><p class="muted">Découvrez les nouveautés MAELIE et laissez-vous inspirer.</p><a class="btn btn-primary" href="boutique.html">Découvrir la boutique</a></div>';
      summary?.remove();
      return;
    }
    root.innerHTML = items
      .map((x) => {
        const p = MAELIE.product(x.id);
        return `<article class="cart-item"><a href="product.html?slug=${encodeURIComponent(p.slug)}"><img src="${p.img}" alt="${p.name}"></a><div><span class="eyebrow">${p.cat}</span><h3><a href="product.html?slug=${encodeURIComponent(p.slug)}">${p.name}</a></h3><span class="muted">${MAELIE.money(p.price)} l'unité</span><div class="quantity" style="margin-top:9px"><button data-minus="${p.id}" type="button">−</button><span>${x.quantity}</span><button data-plus="${p.id}" type="button">+</button></div></div><div><strong>${MAELIE.money(p.price * x.quantity)}</strong><br><button class="btn btn-danger" style="margin-top:10px;padding:8px 12px" data-remove="${p.id}" type="button">Supprimer</button></div></article>`;
      })
      .join("");
    const sub = items.reduce(
        (s, x) => s + MAELIE.product(x.id).price * x.quantity,
        0,
      ),
      coupon = getCoupon(),
      disc = coupon ? sub * 0.1 : 0,
      ship = sub - disc >= 80 ? 0 : 4.9,
      total = sub - disc + ship;
    if (!summary) {
      summary = document.createElement("aside");
      summary.className = "summary";
      summary.dataset.summary = "";
      layout.appendChild(summary);
    }
    summary.innerHTML = `<span class="eyebrow">Récapitulatif</span><h2>Total</h2><div class="coupon"><input data-coupon placeholder="Code promo" value="${coupon}" aria-label="Code promo"><button class="btn btn-soft" data-apply type="button">OK</button></div>${coupon ? '<small class="muted">Code MAELIE10 appliqué : -10 %</small>' : ""}<div class="summary-row"><span>Sous-total</span><strong>${MAELIE.money(sub)}</strong></div><div class="summary-row"><span>Livraison</span><strong>${ship ? "4,90 €" : "Offerte"}</strong></div>${disc ? `<div class="summary-row"><span>Réduction</span><strong>-${MAELIE.money(disc)}</strong></div>` : ""}<div class="summary-row summary-total"><span>Total</span><strong>${MAELIE.money(total)}</strong></div><a class="btn btn-primary" style="width:100%;margin-top:18px" href="commande.html">Passer la commande</a><p class="muted" style="font-size:.75rem;margin-top:12px">Paiement sécurisé • Retours sous 14 jours</p>`;
  };
  document.addEventListener("click", (e) => {
    const plus = e.target.closest("[data-plus]"),
      minus = e.target.closest("[data-minus]"),
      remove = e.target.closest("[data-remove]"),
      apply = e.target.closest("[data-apply]");
    if (plus) {
      const row = MAELIE.cart().find((x) => x.id === Number(plus.dataset.plus));
      if (row) MAELIE.qty(row.id, row.quantity + 1);
      render();
    }
    if (minus) {
      const row = MAELIE.cart().find(
        (x) => x.id === Number(minus.dataset.minus),
      );
      if (row) MAELIE.qty(row.id, row.quantity - 1);
      render();
    }
    if (remove) {
      MAELIE.remove(remove.dataset.remove);
      render();
    }
    if (apply) {
      const input = document.querySelector("[data-coupon]"),
        value = input.value.trim().toUpperCase();
      if (value && value !== "MAELIE10") {
        MAELIE.toast("Code promo invalide.");
        return;
      }
      if (value) localStorage.setItem(MAELIE.COUPON, value);
      else localStorage.removeItem(MAELIE.COUPON);
      render();
      MAELIE.toast(value ? "Code promo appliqué." : "Code promo retiré.");
    }
  });
  window.addEventListener("maelie:cart", render);
  render();
})();

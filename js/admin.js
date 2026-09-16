(() => {
  const root = document.querySelector("[data-admin]");
  if (!root) return;
  const token = localStorage.getItem("maelie_token");
  const api = async (p, o = {}) => {
    const r = await fetch("/api" + p, {
      ...o,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error || "Erreur");
    return d;
  };
  async function render() {
    try {
      const [ps, os] = await Promise.all([
        api("/admin/products"),
        api("/admin/orders"),
      ]);
      const revenue = os.reduce((s, o) => s + o.total_cents, 0);
      root.innerHTML = `<div class="admin-shell"><div class="account-head"><div><span class="eyebrow">Back-office</span><h1>MAELIE Admin</h1><p class="muted">Pilotez votre catalogue, vos stocks et vos commandes.</p></div><a class="btn btn-outline" href="index.html">Voir le site</a></div><div class="admin-grid"><div class="stat"><span class="muted">Produits</span><strong>${ps.length}</strong></div><div class="stat"><span class="muted">Commandes</span><strong>${os.length}</strong></div><div class="stat"><span class="muted">Chiffre d'affaires</span><strong>${MAELIE.money(revenue / 100)}</strong></div><div class="stat"><span class="muted">Stock total</span><strong>${ps.reduce((s, p) => s + p.stock, 0)}</strong></div></div><div class="form-card"><h2>Commandes récentes</h2><div style="overflow:auto"><table class="admin-table"><thead><tr><th>Commande</th><th>Email</th><th>Total</th><th>Statut</th><th>Date</th></tr></thead><tbody>${os.map((o) => `<tr><td><strong>${o.number}</strong></td><td>${o.email}</td><td>${MAELIE.money(o.total_cents / 100)}</td><td><select data-status data-id="${o.id}">${["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"].map((s) => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></td><td>${new Date(o.created_at).toLocaleDateString("fr-FR")}</td></tr>`).join("")}</tbody></table></div></div><div class="form-card" style="margin-top:20px"><h2>Catalogue & stocks</h2><div style="overflow:auto"><table class="admin-table"><thead><tr><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>État</th></tr></thead><tbody>${ps.map((p) => `<tr><td>${p.name}</td><td>${p.category}</td><td>${MAELIE.money(p.price_cents / 100)}</td><td>${p.stock}</td><td>${p.active ? "Actif" : "Masqué"}</td></tr>`).join("")}</tbody></table></div></div></div>`;
      root.querySelectorAll("[data-status]").forEach(
        (s) =>
          (s.onchange = async () => {
            try {
              await api("/admin/orders/" + s.dataset.id, {
                method: "PATCH",
                body: JSON.stringify({ status: s.value }),
              });
              MAELIE.toast("Statut mis à jour");
            } catch (e) {
              MAELIE.toast(e.message);
            }
          }),
      );
    } catch (e) {
      root.innerHTML = `<div class="empty"><h2>Accès administrateur requis</h2><p class="muted">Connectez-vous avec un compte administrateur.</p><a class="btn btn-primary" href="compte.html">Se connecter</a></div>`;
    }
  }
  render();
})();

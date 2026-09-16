(() => {
  const root = document.querySelector("[data-account]");
  if (!root) return;
  const token = () => localStorage.getItem("maelie_token");
  const api = async (path, opt = {}) => {
    const r = await fetch("/api" + path, {
      ...opt,
      headers: {
        "Content-Type": "application/json",
        ...(token() ? { Authorization: "Bearer " + token() } : {}),
      },
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(d.error || "Une erreur est survenue");
    return d;
  };
  const login = () =>
    (root.innerHTML = `<div class="auth-grid"><div class="form-card"><span class="eyebrow">Déjà cliente ?</span><h2>Se connecter</h2><form class="form" data-login><div class="field"><label>E-mail</label><input name="email" type="email" required></div><div class="field"><label>Mot de passe</label><input name="password" type="password" required></div><button class="btn btn-primary">Se connecter</button></form></div><div class="form-card"><span class="eyebrow">Bienvenue</span><h2>Créer mon compte</h2><form class="form" data-register><div class="field"><label>Prénom</label><input name="firstName" required></div><div class="field"><label>Nom</label><input name="lastName"></div><div class="field"><label>E-mail</label><input name="email" type="email" required></div><div class="field"><label>Mot de passe</label><input name="password" type="password" minlength="8" required></div><div class="field"><label>Confirmation</label><input name="confirm" type="password" minlength="8" required></div><button class="btn btn-primary">Créer mon compte</button></form></div></div>`);
  async function render() {
    if (!token()) {
      login();
      return;
    }
    try {
      const u = await api("/me"),
        orders = await api("/orders");
      root.innerHTML = `<div class="account-panel"><div class="account-head"><div><span class="eyebrow">Espace personnel</span><h2>Bonjour ${u.firstName || u.email.split("@")[0]} ✨</h2><p class="muted">Gérez votre compte et retrouvez vos commandes.</p></div><button class="btn btn-outline" data-logout>Se déconnecter</button></div><div class="form-card"><h2>Mes informations</h2><p><strong>${u.firstName || ""} ${u.lastName || ""}</strong><br>${u.email}</p></div><div class="form-card" style="margin-top:20px"><h2>Mes commandes</h2>${orders.length ? orders.map((o) => `<div class="order-card"><span><strong>${o.number}</strong><br><small class="muted">${new Date(o.createdAt).toLocaleDateString("fr-FR")} · ${o.status}</small></span><strong>${MAELIE.money(o.totalCents / 100)}</strong></div>`).join("") : '<p class="muted">Vous n’avez pas encore passé de commande.</p>'}</div></div>`;
      root.querySelector("[data-logout]").onclick = () => {
        localStorage.removeItem("maelie_token");
        render();
      };
    } catch {
      localStorage.removeItem("maelie_token");
      login();
    }
  }
  render();
  document.addEventListener("submit", async (e) => {
    if (e.target.matches("[data-login],[data-register]")) {
      e.preventDefault();
      const f = e.target,
        d = Object.fromEntries(new FormData(f));
      try {
        if (f.matches("[data-register]")) {
          if (d.password !== d.confirm)
            throw Error("Les mots de passe ne correspondent pas");
          delete d.confirm;
          const r = await api("/auth/register", {
            method: "POST",
            body: JSON.stringify(d),
          });
          localStorage.setItem("maelie_token", r.token);
        } else {
          const r = await api("/auth/login", {
            method: "POST",
            body: JSON.stringify(d),
          });
          localStorage.setItem("maelie_token", r.token);
        }
        MAELIE.toast("Bienvenue chez MAELIE");
        render();
      } catch (x) {
        MAELIE.toast(x.message);
      }
    }
  });
})();

(() => {
  const KEY = "maelie_cart";
  const FAV = "maelie_favs";
  const COUPON = "maelie_coupon";
  const money = (n) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(Number(n) || 0);
  const read = (key, fallback = []) => {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) =>
    localStorage.setItem(key, JSON.stringify(value));
  const product = (id) =>
    window.MAELIE_PRODUCTS.find((p) => p.id === Number(id));
  const cart = () => read(KEY, []).filter((x) => product(x.id));
  const favs = () =>
    read(FAV, [])
      .map(Number)
      .filter((id) => product(id));
  const setCart = (value) => {
    write(KEY, value);
    refreshCounts();
    window.dispatchEvent(new CustomEvent("maelie:cart"));
  };
  const setFavs = (value) => {
    write(FAV, value);
    refreshCounts();
    window.dispatchEvent(new CustomEvent("maelie:favs"));
  };
  const add = (id, quantity = 1) => {
    const p = product(id);
    if (!p) return;
    const c = cart();
    const q = Math.max(1, Math.min(99, Number(quantity) || 1));
    const row = c.find((x) => x.id === p.id);
    if (row) row.quantity = Math.min(99, row.quantity + q);
    else c.push({ id: p.id, quantity: q });
    setCart(c);
    toast(`${p.name} a été ajouté au panier.`);
  };
  const remove = (id) => setCart(cart().filter((x) => x.id !== Number(id)));
  const qty = (id, quantity) => {
    const c = cart();
    const row = c.find((x) => x.id === Number(id));
    if (!row) return;
    if (Number(quantity) <= 0) return remove(id);
    row.quantity = Math.max(1, Math.min(99, Number(quantity) || 1));
    setCart(c);
  };
  const toggleFav = (id) => {
    const n = Number(id),
      f = favs(),
      i = f.indexOf(n);
    if (i >= 0) f.splice(i, 1);
    else f.push(n);
    setFavs(f);
    return f.includes(n);
  };
  const refreshCounts = () => {
    const total = cart().reduce((sum, x) => sum + x.quantity, 0);
    document
      .querySelectorAll("[data-cart-count]")
      .forEach((el) => (el.textContent = total));
    document
      .querySelectorAll("[data-fav-count]")
      .forEach((el) => (el.textContent = favs().length));
  };
  const toast = (message) => {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), 2400);
  };
  const stars = (rating) => {
    const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return "★".repeat(n) + "☆".repeat(5 - n);
  };
  const card = (p) => {
    const active = favs().includes(p.id);
    return `<article class="product-card">
      <div class="product-media">
        <a href="product.html?slug=${encodeURIComponent(p.slug)}" aria-label="Voir ${p.name}"><img src="${p.img}" alt="${p.name}" loading="lazy"></a>
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ""}
        <button class="wish ${active ? "active" : ""}" data-fav="${p.id}" type="button" aria-label="${active ? "Retirer des favoris" : "Ajouter aux favoris"}">${active ? "♥" : "♡"}</button>
      </div>
      <div class="product-info">
        <div class="product-meta"><div><span class="stars" aria-label="Note ${p.rating} sur 5">${stars(p.rating)}</span> <small class="muted">(${p.reviews})</small></div><span class="muted">${p.cat}</span></div>
        <h3><a href="product.html?slug=${encodeURIComponent(p.slug)}">${p.name}</a></h3>
        <div><span class="price">${money(p.price)}</span>${p.old ? `<span class="old">${money(p.old)}</span>` : ""}</div>
        <button class="quick-add" data-add="${p.id}" type="button">Ajouter au panier</button>
      </div>
    </article>`;
  };
  const bind = () => {
    document.addEventListener("click", (event) => {
      const addButton = event.target.closest("[data-add]");
      if (addButton) {
        event.preventDefault();
        add(addButton.dataset.add);
        return;
      }
      const favButton = event.target.closest("[data-fav]");
      if (favButton) {
        event.preventDefault();
        const active = toggleFav(favButton.dataset.fav);
        favButton.classList.toggle("active", active);
        favButton.textContent = active ? "♥" : "♡";
        favButton.setAttribute(
          "aria-label",
          active ? "Retirer des favoris" : "Ajouter aux favoris",
        );
        return;
      }
      const menu = event.target.closest("[data-menu]");
      if (menu) document.querySelector(".nav-links")?.classList.toggle("open");
    });
    const search = document.querySelector("[data-global-search]");
    if (search)
      search.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && search.value.trim())
          location.href = `boutique.html?q=${encodeURIComponent(search.value.trim())}`;
      });
    const newsletter = document.querySelector("[data-newsletter]");
    if (newsletter)
      newsletter.addEventListener("submit", (e) => {
        e.preventDefault();
        toast("Merci ! Vous êtes inscrite à la newsletter MAELIE.");
        newsletter.reset();
      });
    refreshCounts();
  };
  window.MAELIE = {
    KEY,
    COUPON,
    money,
    read,
    write,
    product,
    cart,
    favs,
    setCart,
    setFavs,
    add,
    remove,
    qty,
    toggleFav,
    refreshCounts,
    toast,
    stars,
    card,
  };
  document.addEventListener("DOMContentLoaded", bind);
})();

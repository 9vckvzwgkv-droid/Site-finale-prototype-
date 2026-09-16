(() => {
  const grid = document.querySelector("[data-products]");
  if (!grid) return;
  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get("q") || "",
    cat: params.get("cat") || "",
    sale: false,
    newOnly: false,
    max: 100,
    sort: "featured",
  };
  const $ = (selector) => document.querySelector(selector);
  const syncUrl = () => {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.cat) p.set("cat", state.cat);
    history.replaceState({}, "", `boutique.html${p.toString() ? "?" + p : ""}`);
  };
  const render = () => {
    let items = MAELIE_PRODUCTS.filter(
      (p) =>
        (!state.q ||
          `${p.name} ${p.desc} ${p.cat}`
            .toLowerCase()
            .includes(state.q.toLowerCase())) &&
        (!state.cat || p.cat === state.cat) &&
        (!state.sale || p.old) &&
        (!state.newOnly || p.new) &&
        p.price <= state.max,
    );
    if (state.sort === "price-asc") items.sort((a, b) => a.price - b.price);
    if (state.sort === "price-desc") items.sort((a, b) => b.price - a.price);
    if (state.sort === "name")
      items.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    if (state.sort === "rating") items.sort((a, b) => b.rating - a.rating);
    if (state.sort === "newest")
      items.sort((a, b) => Number(b.new) - Number(a.new));
    grid.innerHTML = items.length
      ? items.map(MAELIE.card).join("")
      : `<div class="empty shop-empty"><h2>Aucun résultat</h2><p class="muted">Essayez une autre recherche ou réinitialisez vos filtres.</p><button class="btn btn-soft" data-reset type="button">Réinitialiser</button></div>`;
    const count = $("[data-result-count]");
    if (count)
      count.textContent = `${items.length} article${items.length > 1 ? "s" : ""}`;
    syncUrl();
  };
  const search = $("[data-shop-search]");
  if (search) {
    search.value = state.q;
    search.oninput = () => {
      state.q = search.value.trim();
      render();
    };
  }
  document.querySelectorAll("[data-cat]").forEach((el) => {
    el.checked = el.value === state.cat;
    el.onchange = () => {
      if (el.checked) state.cat = el.value;
      render();
    };
  });
  const sale = $("[data-sale]");
  if (sale)
    sale.onchange = () => {
      state.sale = sale.checked;
      render();
    };
  const newer = $("[data-new]");
  if (newer)
    newer.onchange = () => {
      state.newOnly = newer.checked;
      render();
    };
  const max = $("[data-max]");
  if (max) {
    max.value = state.max;
    max.oninput = () => {
      state.max = Number(max.value);
      const v = $("[data-max-value]");
      if (v) v.textContent = MAELIE.money(state.max);
      render();
    };
  }
  const sort = $("[data-sort]");
  if (sort)
    sort.onchange = () => {
      state.sort = sort.value;
      render();
    };
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-reset]")) {
      state.q = "";
      state.cat = "";
      state.sale = false;
      state.newOnly = false;
      state.max = 100;
      if (search) search.value = "";
      if (sale) sale.checked = false;
      if (newer) newer.checked = false;
      document
        .querySelectorAll("[data-cat]")
        .forEach((x) => (x.checked = x.value === ""));
      render();
    }
  });
  render();
})();

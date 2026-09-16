(() => {
  const root = document.querySelector("[data-favorites]");
  if (!root) return;
  const render = () => {
    const ids = MAELIE.favs();
    const items = MAELIE_PRODUCTS.filter((p) => ids.includes(p.id));
    root.innerHTML = items.length
      ? items.map(MAELIE.card).join("")
      : `<div class="empty" style="grid-column:1/-1"><h2>Vos favoris sont encore vides</h2><p class="muted">Ajoutez un cœur aux pièces que vous souhaitez retrouver facilement.</p><a class="btn btn-primary" href="boutique.html">Explorer la boutique</a></div>`;
  };
  window.addEventListener("maelie:favs", render);
  render();
})();

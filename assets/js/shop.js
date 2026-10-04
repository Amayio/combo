// Shop mockup. Products and prices are placeholders.
(function () {
  "use strict";
  const { $, esc, icon, reveal } = window.COMBO_UTIL || {};
  if (!$) return;

  const CATS = {
    phones:   { name: "Telefony",     icon: "i-mobile" },
    laptops:  { name: "Laptopy",      icon: "i-laptop" },
    consoles: { name: "Konsole",      icon: "i-gamepad" },
    gold:     { name: "Złoto",        icon: "i-gem" },
    foto:     { name: "Foto",         icon: "i-camera" },
    tools:    { name: "Narzędzia",    icon: "i-wrench" },
    bikes:    { name: "Rowery",       icon: "i-bike" },
  };
  const LOCS = { rodla: "Pl. Rodła", wyzw: "Al. Wyzwolenia" };

  const PRODUCTS = [
    { id: "p1",  cat: "phones",   name: "iPhone 13 128 GB",              spec: "Bateria 89%, etui i ładowarka",        cond: "Bardzo dobry", price: 1649, loc: "rodla", featured: 1 },
    { id: "p2",  cat: "laptops",  name: "MacBook Air M1 8/256 GB",       spec: "Space Gray, 214 cykli baterii",     cond: "Bardzo dobry", price: 2399, loc: "rodla", featured: 2 },
    { id: "p3",  cat: "consoles", name: "PlayStation 5 z napędem",       spec: "2 pady, komplet okablowania",          cond: "Jak nowy",     price: 1699, loc: "wyzw",  featured: 3 },
    { id: "p4",  cat: "gold",     name: "Łańcuszek złoty 585, 4,8 g",    spec: "Splot pancerka, długość 50 cm",        cond: "Bardzo dobry", price: 1690, loc: "rodla", featured: 4 },
    { id: "p5",  cat: "phones",   name: "Samsung Galaxy S23 256 GB",     spec: "Bez blokad, oryginalne pudełko",       cond: "Dobry",        price: 1899, loc: "wyzw" },
    { id: "p6",  cat: "laptops",  name: "Lenovo ThinkPad T14 Gen 2",     spec: "i5, 16 GB RAM, SSD 512 GB",            cond: "Dobry",        price: 1299, loc: "wyzw" },
    { id: "p7",  cat: "consoles", name: "Nintendo Switch OLED",          spec: "Etui, 2 gry w zestawie",               cond: "Jak nowy",     price: 999,  loc: "rodla" },
    { id: "p8",  cat: "gold",     name: "Pierścionek złoty 585, 2,1 g",  spec: "Rozmiar 14, z cyrkonią",               cond: "Jak nowy",     price: 749,  loc: "wyzw" },
    { id: "p9",  cat: "foto",     name: "Sony A6400 + 16–50 mm",         spec: "Przebieg 8 tys., 2 akumulatory",       cond: "Bardzo dobry", price: 2899, loc: "rodla" },
    { id: "p10", cat: "tools",    name: "Wkrętarka Makita DDF485",       spec: "2 akumulatory 5 Ah, walizka",          cond: "Dobry",        price: 549,  loc: "wyzw" },
    { id: "p11", cat: "tools",    name: "Młotowiertarka Bosch GBH 2-26", spec: "Walizka, komplet wierteł",             cond: "Dobry",        price: 399,  loc: "rodla" },
    { id: "p12", cat: "bikes",    name: "Rower Kross Trans Hybrid 4.0",  spec: "Elektryczny, rama M, 2 200 km",        cond: "Dobry",        price: 2999, loc: "wyzw" },
  ];

  const fmt = (n) => n.toLocaleString("pl-PL") + " zł";

  const card = (p, teaser) => `
    <article class="product reveal" id="${p.id}">
      <div class="product-media">
        <svg class="icon"><use href="#${CATS[p.cat].icon}"/></svg>
        <span class="product-cond">${esc(p.cond)}</span>
      </div>
      <div class="product-body">
        <span class="product-cat">${esc(CATS[p.cat].name)}</span>
        <h3>${esc(p.name)}</h3>
        <p class="product-spec">${esc(p.spec)}</p>
        <div class="product-meta">
          <span>${icon("i-pin")}${esc(LOCS[p.loc])}</span>
          <span>${icon("i-shield")}Gwarancja</span>
        </div>
        <div class="product-foot">
          <strong class="price">${fmt(p.price)}</strong>
          ${teaser
            ? `<a class="btn btn--ghost btn--sm" href="sklep.html#${p.id}">Zobacz</a>`
            : `<button class="btn btn--primary btn--sm" type="button" data-reserve="${p.id}">Zarezerwuj</button>`}
        </div>
      </div>
    </article>`;

  // Homepage teaser
  const teaser = $("#teaser");
  if (teaser) {
    teaser.innerHTML = PRODUCTS.filter((p) => p.featured).sort((a, b) => a.featured - b.featured).map((p) => card(p, true)).join("");
    reveal(teaser);
  }

  // Shop page
  const grid = $("#shopGrid");
  if (!grid) return;

  const state = { cat: "all", q: "", sort: "featured", loc: "all" };
  const chips = $("#shopCats");
  const counts = PRODUCTS.reduce((m, p) => ((m[p.cat] = (m[p.cat] || 0) + 1), m), {});
  chips.innerHTML = [["all", "Wszystko", PRODUCTS.length], ...Object.entries(CATS).map(([k, c]) => [k, c.name, counts[k] || 0])]
    .map(([k, n, c]) => `<button type="button" class="chip${k === "all" ? " active" : ""}" data-cat="${k}">${n}<span>${c}</span></button>`).join("");

  const render = () => {
    const q = state.q.trim().toLowerCase();
    let list = PRODUCTS.filter((p) =>
      (state.cat === "all" || p.cat === state.cat) &&
      (state.loc === "all" || p.loc === state.loc) &&
      (!q || `${p.name} ${p.spec} ${CATS[p.cat].name}`.toLowerCase().includes(q)));
    if (state.sort === "asc") list.sort((a, b) => a.price - b.price);
    if (state.sort === "desc") list.sort((a, b) => b.price - a.price);
    if (state.sort === "featured") list.sort((a, b) => (a.featured || 99) - (b.featured || 99));
    grid.innerHTML = list.length
      ? list.map((p) => card(p)).join("")
      : `<div class="shop-empty">${icon("i-bag")}<strong>Brak wyników</strong><span>Zmień filtry albo zapytaj w punkcie, asortyment zmienia się codziennie.</span></div>`;
    $("#shopCount").textContent = `${list.length} ${list.length === 1 ? "produkt" : list.length % 10 >= 2 && list.length % 10 <= 4 && (list.length % 100 < 10 || list.length % 100 >= 20) ? "produkty" : "produktów"}`;
    reveal(grid);
  };

  chips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    state.cat = b.dataset.cat;
    chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === b));
    render();
  });
  $("#shopSearch").addEventListener("input", (e) => { state.q = e.target.value; render(); });
  $("#shopSort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("#shopLoc").addEventListener("change", (e) => { state.loc = e.target.value; render(); });
  render();

  // Scroll to a product from the URL hash, e.g. sklep.html#p3
  if (location.hash) setTimeout(() => {
    const el = document.getElementById(location.hash.slice(1));
    if (el) { el.classList.add("in", "highlight"); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
  }, 300);

  // Reservation dialog (mockup, sends nothing)
  const dlg = $("#reserve");
  const form = $("#reserveForm");
  grid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-reserve]");
    if (!b) return;
    const p = PRODUCTS.find((x) => x.id === b.dataset.reserve);
    $("#reserveItem").innerHTML = `
      <span class="ic">${icon(CATS[p.cat].icon)}</span>
      <div><strong>${esc(p.name)}</strong><span>${esc(p.cond)} · ${fmt(p.price)}</span></div>`;
    form.reset();
    form.loc.value = p.loc;
    dlg.classList.remove("done");
    dlg.showModal();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    $("#reserveLoc").textContent = LOCS[form.loc.value];
    dlg.classList.add("done");
  });
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
  });
})();

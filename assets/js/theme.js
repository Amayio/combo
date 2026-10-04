// Theme editor: presets, per-element colors, CSS/JSON export. Disable with themeEditor: false or ?editor=0.
(function () {
  "use strict";
  const C = window.COMBO || {};
  const params = new URLSearchParams(location.search);
  const STORE = "combo-theme-v1";
  const root = document.documentElement;

  // Editable colors
  const GROUPS = [
    { name: "Marka", fields: [
      ["accent", "Kolor akcentu"],
      ["accent-strong", "Akcent po najechaniu"],
      ["accent-ink", "Tekst na akcencie"],
      ["star", "Gwiazdki opinii"],
    ]},
    { name: "Tła", fields: [
      ["bg", "Tło strony"],
      ["surface", "Tło sekcji wyróżnionych"],
      ["card", "Karty"],
      ["header-bg", "Nagłówek / menu"],
      ["hero-bg", "Sekcja główna (hero)"],
      ["footer-bg", "Stopka"],
    ]},
    { name: "Tekst i linie", fields: [
      ["text", "Tekst główny"],
      ["muted", "Tekst drugorzędny"],
      ["hero-text", "Tekst w sekcji głównej"],
      ["footer-text", "Tekst w stopce"],
      ["border", "Obramowania"],
    ]},
    { name: "Logo", fields: [
      ["logo-tile", "Tło znaku"],
      ["logo-c", "Litera C"],
      ["logo-l", "Litera L"],
    ]},
  ];
  const KEYS = GROUPS.flatMap((g) => g.fields.map((f) => f[0]));

  // Presets
  const P = (accent, strong, ink, bg, surface, card, header, hero, footer, text, muted, heroText, footerText, border, star, tile, c, l) =>
    ({ accent, "accent-strong": strong, "accent-ink": ink, bg, surface, card, "header-bg": header, "hero-bg": hero, "footer-bg": footer,
       text, muted, "hero-text": heroText, "footer-text": footerText, border, star, "logo-tile": tile, "logo-c": c, "logo-l": l });

  const PRESETS = [
    { name: "Combo Magenta", colors: P("#E5007E", "#B80066", "#FFFFFF", "#FFFFFF", "#F6F4F7", "#FFFFFF", "#FFFFFF", "#1C1B21", "#141318", "#17161C", "#5F5C68", "#FFFFFF", "#CFCCD6", "#E7E3EA", "#FFB400", "#E5007E", "#1C1B21", "#FFFFFF") },
    { name: "Combo Noc",     colors: P("#FF2E93", "#E0137A", "#FFFFFF", "#111015", "#17161C", "#1E1D24", "#111015", "#0A090D", "#0A090D", "#F4F2F7", "#A9A5B3", "#FFFFFF", "#BDB9C6", "#2D2B34", "#FFB400", "#FF2E93", "#0A090D", "#FFFFFF") },
    { name: "Klasyczna czerwień", colors: P("#CC3A49", "#A82C39", "#FFFFFF", "#FFFFFF", "#F5F6F8", "#FFFFFF", "#FFFFFF", "#2F333D", "#23262E", "#1D2027", "#5D6370", "#FFFFFF", "#C9CDD6", "#E3E6EB", "#FFB400", "#CC3A49", "#2F333D", "#FFFFFF") },
    { name: "Grafit i złoto", colors: P("#C9A227", "#A8851A", "#16150F", "#FBFAF7", "#F3F0E8", "#FFFFFF", "#FBFAF7", "#16161A", "#101013", "#18181B", "#615E57", "#FFFFFF", "#C8C4BA", "#E6E1D5", "#C9A227", "#C9A227", "#16161A", "#FFFFFF") },
    { name: "Granat premium", colors: P("#2F6BFF", "#1F52D6", "#FFFFFF", "#FFFFFF", "#F3F6FB", "#FFFFFF", "#FFFFFF", "#0D1530", "#0A1024", "#0F172A", "#556079", "#FFFFFF", "#C3CBDD", "#E2E8F2", "#FFB400", "#2F6BFF", "#0D1530", "#FFFFFF") },
    { name: "Szmaragd",       colors: P("#0E9F6E", "#0B7E57", "#FFFFFF", "#FFFFFF", "#F2F7F5", "#FFFFFF", "#FFFFFF", "#0C1F19", "#08150F", "#10201A", "#52645D", "#FFFFFF", "#BFD0C9", "#DFE9E5", "#FFB400", "#0E9F6E", "#0C1F19", "#FFFFFF") },
  ];
  const DEFAULT = { preset: 0, colors: { ...PRESETS[0].colors }, radius: 18 };

  // State
  const load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE));
      if (s && s.colors) return { ...DEFAULT, ...s, colors: { ...DEFAULT.colors, ...s.colors } };
    } catch (e) { /* storage unavailable, use defaults */ }
    return structuredClone(DEFAULT);
  };
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} };
  let state = load();

  const apply = () => {
    KEYS.forEach((k) => root.style.setProperty(`--${k}`, state.colors[k]));
    root.style.setProperty("--radius", `${state.radius}px`);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = state.colors["hero-bg"];
  };

  const editorOn = C.themeEditor !== false && params.get("editor") !== "0";
  // Editor off: ignore saved theme, style.css wins
  if (!editorOn) return;
  apply();

  // UI
  const icon = (id) => `<svg class="icon"><use href="#${id}"/></svg>`;
  const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v);

  const fab = document.createElement("button");
  fab.className = "te-fab";
  fab.type = "button";
  fab.setAttribute("aria-controls", "themeEditor");
  fab.innerHTML = `<span class="dots"><i style="background:var(--accent)"></i><i style="background:var(--hero-bg)"></i><i style="background:var(--surface)"></i></span><span class="label">Kolorystyka</span>`;

  const panel = document.createElement("aside");
  panel.className = "te";
  panel.id = "themeEditor";
  panel.setAttribute("aria-label", "Edytor kolorystyki");
  panel.setAttribute("aria-hidden", "true");
  panel.inert = true;
  panel.innerHTML = `
    <div class="te-head">
      <div><h3>Kolorystyka strony</h3><p>Zmiany widzisz od razu i są zapisywane w tej przeglądarce.</p></div>
      <button class="te-x" type="button" data-act="close" aria-label="Zamknij">${icon("i-x")}</button>
    </div>
    <div class="te-body">
      <div class="te-label">Gotowe motywy</div>
      <div class="te-presets">
        ${PRESETS.map((p, i) => `
          <button class="te-preset" type="button" data-preset="${i}">
            <span class="sw">${["hero-bg", "accent", "surface", "logo-tile"].map((k) => `<i style="background:${p.colors[k]}"></i>`).join("")}</span>
            <span>${p.name}</span>
          </button>`).join("")}
      </div>

      <div class="te-label">Kolory elementów</div>
      ${GROUPS.map((g, gi) => `
        <details class="te-group" ${gi === 0 ? "open" : ""}>
          <summary>${g.name}${icon("i-down")}</summary>
          ${g.fields.map(([k, label]) => `
            <div class="te-row">
              <label for="te-${k}">${label}</label>
              <input type="color" id="te-${k}" data-key="${k}">
              <input type="text" data-hex="${k}" maxlength="7" spellcheck="false" aria-label="${label}, kod HEX">
            </div>`).join("")}
        </details>`).join("")}

      <div class="te-label">Zaokrąglenia</div>
      <div class="te-range">
        <input type="range" min="0" max="32" step="1" id="te-radius" aria-label="Zaokrąglenie narożników">
        <span id="te-radius-val" style="font-weight:700;min-width:42px;text-align:right"></span>
      </div>
    </div>
    <div class="te-foot">
      <button class="te-btn te-btn--dark" type="button" data-act="css">${icon("i-copy")}Kopiuj CSS</button>
      <button class="te-btn" type="button" data-act="json">${icon("i-download")}Eksport JSON</button>
      <button class="te-btn" type="button" data-act="import">${icon("i-upload")}Import JSON</button>
      <button class="te-btn" type="button" data-act="reset">${icon("i-reset")}Przywróć domyślne</button>
      <input type="file" accept="application/json,.json" hidden id="te-file">
    </div>`;

  const toast = document.createElement("div");
  toast.className = "te-toast";
  toast.setAttribute("role", "status");
  document.body.append(fab, panel, toast);

  let toastT;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove("show"), 2200);
  };

  const sync = () => {
    KEYS.forEach((k) => {
      panel.querySelector(`[data-key="${k}"]`).value = state.colors[k];
      const t = panel.querySelector(`[data-hex="${k}"]`);
      if (document.activeElement !== t) t.value = state.colors[k].toUpperCase();
    });
    panel.querySelector("#te-radius").value = state.radius;
    panel.querySelector("#te-radius-val").textContent = `${state.radius}px`;
    panel.querySelectorAll(".te-preset").forEach((b) => b.classList.toggle("active", +b.dataset.preset === state.preset));
  };
  const commit = () => { apply(); sync(); save(); };

  const setOpen = (open) => {
    panel.classList.toggle("open", open);
    panel.setAttribute("aria-hidden", !open);
    panel.inert = !open;
    fab.setAttribute("aria-expanded", open);
    if (open) panel.querySelector(".te-x").focus();
  };
  fab.addEventListener("click", () => setOpen(!panel.classList.contains("open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("open")) { setOpen(false); fab.focus(); } });

  panel.addEventListener("click", (e) => {
    const pre = e.target.closest("[data-preset]");
    if (pre) {
      state.preset = +pre.dataset.preset;
      state.colors = { ...PRESETS[state.preset].colors };
      commit();
      say(`Motyw: ${PRESETS[state.preset].name}`);
      return;
    }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "close") setOpen(false);
    if (act === "reset") { state = structuredClone(DEFAULT); commit(); say("Przywrócono domyślne kolory"); }
    if (act === "css") copyCss();
    if (act === "json") downloadJson();
    if (act === "import") panel.querySelector("#te-file").click();
  });

  panel.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset.key) {
      state.colors[t.dataset.key] = t.value;
      state.preset = -1;
      commit();
    } else if (t.dataset.hex) {
      let v = t.value.trim();
      if (!v.startsWith("#")) v = "#" + v;
      if (isHex(v)) { state.colors[t.dataset.hex] = v.toLowerCase(); state.preset = -1; commit(); }
    } else if (t.id === "te-radius") {
      state.radius = +t.value;
      commit();
    }
  });
  panel.addEventListener("focusout", (e) => { if (e.target.dataset.hex) sync(); });

  const cssText = () =>
    `:root {\n${KEYS.map((k) => `  --${k}: ${state.colors[k].toUpperCase()};`).join("\n")}\n  --radius: ${state.radius}px;\n}\n`;

  async function copyCss() {
    try { await navigator.clipboard.writeText(cssText()); say("Skopiowano zmienne CSS do schowka"); }
    catch (e) { console.log(cssText()); say("Nie udało się skopiować. CSS jest w konsoli przeglądarki"); }
  }
  function downloadJson() {
    const blob = new Blob([JSON.stringify({ colors: state.colors, radius: state.radius }, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "combo-motyw.json" });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    say("Pobrano plik combo-motyw.json");
  }
  panel.querySelector("#te-file").addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const colors = {};
      KEYS.forEach((k) => { if (isHex(data.colors?.[k] || "")) colors[k] = data.colors[k]; });
      if (!Object.keys(colors).length) throw new Error("brak kolorów");
      state.colors = { ...state.colors, ...colors };
      if (Number.isFinite(data.radius)) state.radius = Math.max(0, Math.min(32, data.radius));
      state.preset = -1;
      commit();
      say("Zaimportowano motyw");
    } catch (err) { say("To nie jest poprawny plik motywu"); }
    e.target.value = "";
  });

  sync();
  // ?editor=open opens the panel right away, handy for demos
  if (params.get("editor") === "open") setOpen(true);
})();

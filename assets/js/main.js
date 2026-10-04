// Shared behaviour for all pages.
(function () {
  "use strict";
  const C = window.COMBO || {};
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const icon = (id) => `<svg class="icon"><use href="#${id}"/></svg>`;
  window.COMBO_UTIL = { $, esc, icon };

  // Header shadow on scroll and mobile menu
  const header = $("#header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  const nav = $("#nav"), toggle = $("#menuToggle");
  if (nav && toggle) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
      toggle.innerHTML = icon(open ? "i-x" : "i-menu");
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a") && nav.classList.contains("open")) toggle.click();
    });
  }

  // Reveal on scroll
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }), { rootMargin: "0px 0px -8% 0px" })
    : null;
  document.documentElement.classList.add("js");
  const reveal = (root = document) => root.querySelectorAll(".reveal:not(.in)").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    io ? io.observe(el) : el.classList.add("in");
  });
  window.COMBO_UTIL.reveal = reveal;
  reveal();

  // Location cards: open/closed status
  const locs = [...document.querySelectorAll(".loc")];
  const now = new Date(), h = now.getHours() + now.getMinutes() / 60;
  locs.forEach((l) => {
    let open = false;
    try { const t = JSON.parse(l.dataset.hours)[now.getDay()]; open = !!t && h >= t[0] && h < t[1]; } catch (e) {}
    const st = l.querySelector(".status");
    if (!st) return;
    st.textContent = open ? "Teraz otwarte" : "Teraz zamknięte";
    st.classList.toggle("open", open);
    st.hidden = false;
  });

  // Hero pill: cycles through locations with their current status
  const ticker = $("#heroTicker");
  if (ticker && locs.length) {
    const hh = (n) => `${Math.floor(n)}:${String(Math.round((n % 1) * 60)).padStart(2, "0")}`;
    const statusOf = (l) => {
      let hours = {};
      try { hours = JSON.parse(l.dataset.hours); } catch (e) {}
      const t = hours[now.getDay()];
      if (t && h >= t[0] && h < t[1]) return { open: true, text: `otwarte do ${hh(t[1])}` };
      if (t && h < t[0]) return { open: false, text: `otwieramy o ${hh(t[0])}` };
      for (let d = 1; d <= 7; d++) {
        const n = hours[(now.getDay() + d) % 7];
        if (n) return { open: false, text: `${d === 1 ? "jutro" : "wkrótce"} od ${hh(n[0])}` };
      }
      return { open: false, text: "" };
    };
    const items = locs.map((l) => {
      const st = statusOf(l);
      return `<b>${esc(l.dataset.short || l.querySelector("h3")?.textContent)}</b><span class="st${st.open ? " open" : ""}">${esc(st.text)}</span>`;
    });
    // Size the pill to the longest entry so it does not jump
    const fit = () => {
      const probe = document.createElement("span");
      probe.className = "ticker-item";
      probe.style.visibility = "hidden";
      ticker.append(probe);
      ticker.style.width = Math.ceil(Math.max(...items.map((html) => ((probe.innerHTML = html), probe.getBoundingClientRect().width)))) + 4 + "px";
      probe.remove();
    };
    ticker.innerHTML = `<span class="ticker-item">${items[0]}</span>`;
    fit();
    document.fonts?.ready.then(fit); // again once the web font is in

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (items.length > 1 && !still) {
      let i = 0;
      setInterval(() => {
        if (document.hidden) return;
        i = (i + 1) % items.length;
        const cur = ticker.firstElementChild;
        const next = document.createElement("span");
        next.className = "ticker-item enter";
        next.innerHTML = items[i];
        ticker.append(next);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          cur.classList.add("leave");
          next.classList.remove("enter");
        }));
        setTimeout(() => cur.remove(), 600);
      }, 3200);
    }
  }

  const map = $("#map");
  if (map && locs.length) {
    const showMap = (loc, scroll) => {
      locs.forEach((l) => l.classList.toggle("active", l === loc));
      map.innerHTML = `<iframe title="Mapa dojazdu: ${esc(loc.querySelector("h3")?.textContent)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(loc.dataset.map)}&z=16&output=embed"></iframe>`;
      // On narrow screens the map sits below the cards, so bring it into view
      if (scroll && map.getBoundingClientRect().top > window.innerHeight * 0.6) map.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    $("#locList").addEventListener("click", (e) => {
      const l = e.target.closest(".loc");
      if (l && !e.target.closest("a")) showMap(l, !!e.target.closest(".loc-show"));
    });
    if (io) {
      const mo = new IntersectionObserver(([e]) => { if (e.isIntersecting) { showMap(locs[0]); mo.disconnect(); } }, { rootMargin: "400px" });
      mo.observe(map);
    } else showMap(locs[0]);
  }

  // Reviews
  const rv = $("#reviews");
  if (rv) {
    const R = C.reviews || {};
    const stars = (n) => Array.from({ length: 5 }, (_, i) => `<svg class="${i < Math.round(n) ? "" : "off"}"><use href="#i-star"/></svg>`).join("");
    const render = (items, sample) => {
      rv.innerHTML = items
        .filter((r) => r.text && (r.rating || 5) >= (R.mode === "endpoint" ? R.minRating || 5 : 0))
        .slice(0, R.maxItems || 8)
        .map((r) => `
          <article class="review">
            <span class="stars">${stars(r.rating || 5)}</span>
            <p class="review-text">„${esc(r.text)}”</p>
            <div class="review-author">
              <span class="avatar">${r.photo ? `<img src="${esc(r.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : esc((r.author || "?").trim()[0])}</span>
              <div><strong>${esc(r.author)}</strong><span>${esc(r.time || "")}</span></div>
              <svg class="g" aria-label="Opinia z Google"><use href="#i-google"/></svg>
            </div>
          </article>`).join("");
      $("#demoChip").hidden = !sample;
      const dots = $("#revDots");
      if (dots) dots.innerHTML = [...rv.children].map((_, i) => `<i${i ? "" : ' class="on"'}></i>`).join("");
    };
    // Carousel dots on mobile
    rv.addEventListener("scroll", () => {
      const dots = $("#revDots"), w = rv.firstElementChild?.offsetWidth;
      if (!dots || !w) return;
      const i = Math.round(rv.scrollLeft / (w + 12));
      [...dots.children].forEach((d, k) => d.classList.toggle("on", k === i));
    }, { passive: true });
    if (R.placeId) $("#reviewsWrite").href = `https://search.google.com/local/writereview?placeid=${R.placeId}`;

    (async () => {
      if (R.mode === "endpoint" && R.endpoint) {
        try {
          const res = await fetch(R.endpoint, { headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error(res.status);
          return render((await res.json()).reviews || [], false);
        } catch (err) { console.warn("[Combo] Nie udało się pobrać opinii Google:", err); }
      }
      render(R.items || [], R.sample !== false);
    })();

    const step = () => (rv.querySelector(".review")?.offsetWidth || 300) + 20;
    $("#revPrev")?.addEventListener("click", () => rv.scrollBy({ left: -step(), behavior: "smooth" }));
    $("#revNext")?.addEventListener("click", () => rv.scrollBy({ left: step(), behavior: "smooth" }));
  }

  const year = $("#year");
  if (year) year.textContent = now.getFullYear();

  // Load the theme editor only when enabled
  if (C.themeEditor !== false && new URLSearchParams(location.search).get("editor") !== "0") {
    const s = document.createElement("script");
    s.src = "assets/js/theme.js";
    document.body.append(s);
  }
})();

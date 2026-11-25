/* MyCircle: places your close friends have actually been, on one map. */
import { fetchCircleData } from "./circle-data.mjs";

(function () {
  "use strict";

  const CFG = window.MYCIRCLE_CONFIG;
  const DEMO = new URLSearchParams(location.search).has("demo") && window.MYCIRCLE_DEMO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- invite code from the link (?join=CODE), kept across the sign-in email ----------
  const JOIN_KEY = "mycircle.join";
  const CIRCLE_KEY = "mycircle.circle";
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  if (!DEMO) {
    const url = new URL(location.href);
    const code = url.searchParams.get("join");
    if (code) {
      store.set(JOIN_KEY, code.trim().slice(0, 64));
      url.searchParams.delete("join");
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }

  const sb = DEMO ? null : window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  // ---------- constants ----------
  const CATS = {
    stay: { label: "Stay" },
    food: { label: "Eat & drink" },
    see: { label: "See & do" },
    other: { label: "Other" }
  };
  const CAT_ORDER = ["stay", "food", "see", "other"];
  const RATING_WORDS = ["Tap a star", "Skip it", "Not great", "It was fine", "Really good", "Loved it"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const AV_COLORS = ["#3b63da", "#a85d22", "#3d7a5c", "#4a5fa8", "#334155", "#2f6f73", "#7a3b55", "#5b4b82", "#8a5a2b", "#3f5a46"];
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.3 18.2 21l-1.6-7 5.4-4.7-7.2-.6L12 2 9.2 8.7 2 9.3l5.5 4.7-1.7 7z"/></svg>';
  const IC = {
    city: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
    chev: '<svg class="r-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6 8.6 7.4 13.2 12l-4.6 4.6L10 18l6-6z"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z"/></svg>',
    ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.6l-9.8 9.8 1.4 1.4L19 6.4V10h2V3h-7z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.3V21h3.7L17.8 9.9l-3.7-3.7L3 17.3zM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.7 3.7L20.7 7z"/></svg>',
    add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>',
    person: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0h-1c1.2.9 2 2 2 3.5V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z"/></svg>',
    walk: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>',
    car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 6c-.2-.6-.8-1-1.4-1h-11c-.7 0-1.2.4-1.4 1L3 12v8c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-1h12v1c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-8l-2.1-6zM6.5 16c-.8 0-1.5-.7-1.5-1.5S5.7 13 6.5 13s1.5.7 1.5 1.5S7.3 16 6.5 16zm11 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3 7.2 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>',
    logo: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="5"/><g opacity=".8"><circle cx="16" cy="4.5" r="3"/><circle cx="26" cy="10.3" r="3"/><circle cx="26" cy="21.7" r="3"/><circle cx="16" cy="27.5" r="3"/><circle cx="6" cy="21.7" r="3"/><circle cx="6" cy="10.3" r="3"/></g></svg>'
  };

  // ---------- state ----------
  const S = {
    user: null, profile: null, circles: [], circleId: null,
    members: new Map(), places: [], trips: [], loaded: false,
    mode: "home", city: null, friendId: null, cat: "all", selId: null,
    markerById: new Map(), progUntil: 0, lastRefresh: 0, plan: null
  };
  let sessionVersion = 0;

  // ---------- small helpers ----------
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  function initials(name) { const w = String(name || "").trim().split(/\s+/).filter(Boolean); if (!w.length) return "?"; return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); }
  function colorFor(id) {
    let h = 2166136261; // FNV-1a
    for (const ch of String(id || "")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return AV_COLORS[h % AV_COLORS.length];
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  function avg(a) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0; }
  function fmtMonth(v) { const m = /^(\d{4})-(\d{2})$/.exec(v || ""); return m ? MONTHS[Number(m[2]) - 1] + " " + m[1] : ""; }
  function debounce(fn, ms) { let t = 0; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function isMobile() { return matchMedia("(max-width: 720px)").matches; }
  function reduceMotion() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function isMe(id) { return S.user && id === S.user.id; }
  function realName(id) {
    if (isMe(id)) return (S.profile && S.profile.display_name) || "You";
    const m = S.members.get(id);
    return (m && m.name) || "Former member";
  }
  function nameOf(id) { return isMe(id) ? "You" : realName(id); }
  function avatar(id, cls) {
    return `<span class="av ${cls || ""}" style="background:${colorFor(id)}" title="${esc(nameOf(id))}" aria-hidden="true">${esc(initials(realName(id)))}</span>`;
  }
  function starsHTML(n) {
    let h = `<span class="stars" role="img" aria-label="${n} out of 5 stars">`;
    for (let i = 1; i <= 5; i++) h += STAR.replace("<svg ", `<svg class="${i <= n ? "on" : ""}" `);
    return h + "</span>";
  }
  function priceStr(p) { return p ? "$".repeat(p) : ""; }
  function mapsHref(p) {
    const q = [p.name, p.address || p.city].filter(Boolean).join(", ");
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q || (p.lat + "," + p.lng));
  }
  let toastTimer = 0;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }
  function friendly(err, fallback) {
    const msg = (err && (err.message || err.error_description)) || "";
    if (/fetch|network|Failed to fetch/i.test(msg)) return "Couldn't reach MyCircle. Check your internet connection and try again.";
    if (/rate limit|too many/i.test(msg) || (err && err.status === 429)) return "Too many tries in a short time. Wait a minute and try again.";
    if (/Sign in first|JWT|not authenticated/i.test(msg)) return "Your sign-in expired. Reload the page and sign in again.";
    if (/invite link is not valid/i.test(msg)) return "That invite link isn't valid any more. Ask your friend for a new one.";
    return fallback || msg || "Something went wrong. Try again.";
  }

  // ---------- map ----------
  const map = L.map("map", { zoomControl: false, worldCopyJump: true, minZoom: 2, zoomSnap: 0.5 }).setView([30, -30], 3);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer(CFG.tileUrl, { maxZoom: CFG.tileMaxZoom || 19, attribution: CFG.tileAttribution }).addTo(map);
  const layer = L.layerGroup().addTo(map);

  function fitPadding() {
    if (isMobile()) return { paddingTopLeft: [24, 120], paddingBottomRight: [24, Math.round(innerHeight * 0.46) + 24] };
    return { paddingTopLeft: [$("#panel").offsetWidth + 40, 70], paddingBottomRight: [70, 50] };
  }
  function flyTo(bounds, maxZoom) {
    if (!bounds || !bounds.isValid()) return;
    S.progUntil = Date.now() + 1600;
    const opts = Object.assign({ maxZoom: maxZoom || 15 }, fitPadding());
    if (reduceMotion()) map.fitBounds(bounds, opts);
    else map.flyToBounds(bounds, Object.assign({ duration: 0.9 }, opts));
  }
  map.on("movestart", () => { if (Date.now() > S.progUntil && S.loaded) $("#area-btn").hidden = false; });
  map.on("popupclose", () => { if (S.selId) { setSelected(null); } });

  function pinIcon(p, num, sel) {
    return L.divIcon({
      className: "pin-wrap",
      html: `<div class="pin p-${p.category}${num ? " has-num" : ""}${sel ? " is-sel" : ""}">${num ? `<span>${num}</span>` : ""}</div>`,
      iconSize: [34, 42], iconAnchor: [17, 42], popupAnchor: [0, -40]
    });
  }

  // ---------- data ----------
  function cleanPlace(p) {
    return {
      id: p.id, name: p.name, category: CATS[p.category] ? p.category : "other",
      address: p.address || "", city: p.city || "", country: p.country || "",
      lat: Number(p.lat), lng: Number(p.lng), source_ref: p.source_ref || null, created_by: p.created_by,
      reviews: (p.reviews || []).slice().sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))),
      photos: (p.photos || []).slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    };
  }
  async function loadCircles() {
    const session = sessionVersion;
    const { data, error } = await sb.from("circle_members").select("role, circles(id, name, invite_code, owner_id)").eq("user_id", S.user.id);
    if (session !== sessionVersion) return false;
    if (error) throw error;
    S.circles = (data || []).filter(r => r.circles).map(r => Object.assign({}, r.circles, { role: r.role }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const saved = store.get(CIRCLE_KEY, null);
    if (!S.circles.some(c => c.id === S.circleId)) S.circleId = S.circles.some(c => c.id === saved) ? saved : (S.circles[0] && S.circles[0].id) || null;
    return true;
  }
  async function loadCircleData(cid) {
    const session = sessionVersion;
    const data = await fetchCircleData(sb, cid);
    if (session !== sessionVersion) return null;
    return {
      ...data,
      places: data.places.map(cleanPlace).filter(p => p.reviews.length && Number.isFinite(p.lat) && Number.isFinite(p.lng))
    };
  }
  function applyCircleData(cid, data) {
    S.circleId = cid;
    S.members = data.members;
    S.trips = data.trips;
    S.places = data.places;
    S.loaded = true;
    S.lastRefresh = Date.now();
  }
  function currentCircle() { return S.circles.find(c => c.id === S.circleId) || null; }

  // ---------- derived views ----------
  function cityGroups() {
    const g = new Map();
    for (const p of S.places) {
      const name = p.city || p.country || "Other places";
      const key = norm(p.city) ? norm(p.city) + "|" + norm(p.country) : "~" + norm(p.country);
      let c = g.get(key);
      if (!c) { c = { key, name, cityKey: norm(p.city), country: p.country, places: [], people: new Set() }; g.set(key, c); }
      c.places.push(p);
      p.reviews.forEach(r => c.people.add(r.user_id));
    }
    for (const c of g.values()) {
      c.lat = avg(c.places.map(p => p.lat)); c.lng = avg(c.places.map(p => p.lng));
      c.bounds = L.latLngBounds(c.places.map(p => [p.lat, p.lng]));
    }
    return [...g.values()].sort((a, b) => b.places.length - a.places.length || a.name.localeCompare(b.name));
  }
  function inCity(p, city) {
    if (!city) return true;
    if (city.key && norm(p.city) === city.key) return true;
    const [s, w, n, e] = city.bbox;
    const lngOk = w <= e ? (p.lng >= w && p.lng <= e) : (p.lng >= w || p.lng <= e);
    return p.lat >= s && p.lat <= n && lngOk;
  }
  function cityPlaces() { return S.places.filter(p => inCity(p, S.city)); }
  function byCat(list) { return S.cat === "all" ? list : list.filter(p => p.category === S.cat); }
  function friendsIn(list) {
    const m = new Map();
    for (const p of list) for (const r of p.reviews) {
      let f = m.get(r.user_id);
      if (!f) { f = { id: r.user_id, places: 0, ratings: [] }; m.set(r.user_id, f); }
      f.places++; f.ratings.push(r.rating);
    }
    return [...m.values()].sort((a, b) => (isMe(b.id) - isMe(a.id)) || b.places - a.places || realName(a.id).localeCompare(realName(b.id)));
  }
  // Top travelled: most countries, then most cities, then the longest trail between their cities
  // (straight lines, in the order they went: visit month, else review date).
  function topTravelled() {
    const trips = new Map();
    for (const g of cityGroups()) for (const p of g.places) for (const r of p.reviews) {
      if (!trips.has(r.user_id)) trips.set(r.user_id, []);
      trips.get(r.user_id).push({ g, when: r.visited_month || r.created_at || "" });
    }
    return [...trips].map(([id, visits]) => {
      visits.sort((a, b) => a.when.localeCompare(b.when));
      const seq = visits.map(x => x.g).filter((g, i, a) => i === 0 || g !== a[i - 1]);
      let km = 0;
      for (let i = 1; i < seq.length; i++) km += kmBetween(seq[i - 1], seq[i]);
      return { id, places: visits.length, cities: new Set(seq).size, countries: new Set(seq.map(g => g.country).filter(Boolean)).size, km };
    }).sort((a, b) => b.countries - a.countries || b.cities - a.cities || b.km - a.km || realName(a.id).localeCompare(realName(b.id)));
  }
  function travelSub(f) { return `${plural(f.countries, "country", "countries")} · ${plural(f.cities, "city", "cities")} · ${Math.round(f.km).toLocaleString()} km`; }
  function friendItems(uid, list) {
    return list.filter(p => p.reviews.some(r => r.user_id === uid))
      .map(p => ({ place: p, review: p.reviews.find(r => r.user_id === uid) }))
      .sort((a, b) => b.review.rating - a.review.rating || a.place.name.localeCompare(b.place.name));
  }
  function stats(p) { const rs = p.reviews; return { avg: avg(rs.map(r => r.rating)), n: rs.length }; }
  function catCounts(list) { const c = { all: list.length, stay: 0, food: 0, see: 0, other: 0 }; list.forEach(p => c[p.category]++); return c; }

  // ---------- navigation ----------
  function goHome(opts) {
    S.plan = null; S.mode = "home"; S.city = null; S.friendId = null; S.cat = "all"; S.selId = null;
    $("#search-input").value = "";
    $("#area-btn").hidden = true;
    map.closePopup();
    render();
    if (!opts || opts.fly !== false) fitAll();
  }
  function fitAll() {
    if (!S.places.length) {
      const c = myCountry();
      if (c) flyTo(L.latLngBounds([[c.bbox[0], c.bbox[1]], [c.bbox[2], c.bbox[3]]]), 6);
      return;
    }
    flyTo(L.latLngBounds(S.places.map(p => [p.lat, p.lng])).pad(0.1), 12);
  }
  function openCity(city, opts) {
    S.plan = null; S.mode = "city"; S.city = city; S.friendId = null; S.cat = "all"; S.selId = null;
    $("#search-input").value = city.name === "This area" ? "" : city.name;
    $("#area-btn").hidden = true;
    map.closePopup();
    render();
    if (!opts || opts.fly !== false) {
      const b = L.latLngBounds([[city.bbox[0], city.bbox[1]], [city.bbox[2], city.bbox[3]]]);
      flyTo(b, 14);
    }
    scrollPanelTop();
  }
  function openCityFromGroup(g) {
    const b = g.bounds.pad(0.25);
    const minPad = 0.04;
    const s = Math.min(b.getSouth(), g.lat - minPad), n = Math.max(b.getNorth(), g.lat + minPad);
    const w = Math.min(b.getWest(), g.lng - minPad), e = Math.max(b.getEast(), g.lng + minPad);
    openCity({ name: g.name, sub: g.cityKey ? g.country : "", key: g.cityKey || null, bbox: [s, w, n, e] });
  }
  function openFriend(uid) {
    S.plan = null; S.mode = "friend"; S.friendId = uid; S.selId = null;
    map.closePopup();
    render();
    const items = friendItems(uid, byCat(cityPlaces()));
    if (items.length) flyTo(L.latLngBounds(items.map(it => [it.place.lat, it.place.lng])).pad(0.2), 16);
    scrollPanelTop();
  }
  function backFromFriend() {
    S.mode = "city"; S.friendId = null; S.selId = null;
    map.closePopup();
    render();
    if (S.city) flyTo(L.latLngBounds([[S.city.bbox[0], S.city.bbox[1]], [S.city.bbox[2], S.city.bbox[3]]]), 14);
  }
  function scrollPanelTop() { const b = $("#panel-body"); if (b) b.scrollTop = 0; }

  // ---------- rendering ----------
  let lastView = "";
  function render() {
    const view = [S.mode, S.city && S.city.name, S.friendId].join("|");
    const changed = view !== lastView;
    lastView = view;
    renderPanel();
    renderMarkers();
    renderPlanRoute();
    if (!changed || !S.loaded || reduceMotion()) return;
    // View changed (home / city / friend): panel content fades in, pins pop in one after another.
    $("#panel-body").animate(
      isMobile() ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], // phones: the sheet owns transform
      { duration: 140, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
    $$(".pin", $("#map")).forEach((el, i) => { el.style.animationDelay = Math.min(i, 8) * 25 + "ms"; });
    document.body.classList.add("pins-in");
    setTimeout(() => document.body.classList.remove("pins-in"), 700);
  }

  function renderMarkers() {
    layer.clearLayers();
    S.markerById = new Map();
    if (!S.loaded) return;
    if (S.plan) {
      S.plan.stops.forEach((st, i) => {
        const p = st.place;
        const m = L.marker([p.lat, p.lng], { icon: pinIcon(p, i + 1, p.id === S.selId), title: `${st.slot.label}: ${p.name}`, keyboard: true, riseOnHover: true, zIndexOffset: 500 });
        m.on("click", () => selectPlace(p.id, { fly: false }));
        m.addTo(layer);
        S.markerById.set(p.id, m);
      });
      return;
    }
    if (S.mode === "home") {
      for (const g of cityGroups()) {
        const icon = L.divIcon({ className: "pin-wrap", html: `<div class="city-bubble">${esc(g.name)}<b>${g.places.length}</b></div>`, iconSize: [0, 0] });
        L.marker([g.lat, g.lng], { icon, title: `${g.name}: ${plural(g.places.length, "place")}`, keyboard: true })
          .on("click", () => openCityFromGroup(g)).addTo(layer);
      }
      return;
    }
    let list;
    if (S.mode === "friend") list = friendItems(S.friendId, byCat(cityPlaces())).map(it => it.place);
    else list = byCat(cityPlaces());
    list.forEach((p, i) => {
      const num = S.mode === "friend" ? i + 1 : null;
      const m = L.marker([p.lat, p.lng], {
        icon: pinIcon(p, num, p.id === S.selId), title: p.name, keyboard: true, riseOnHover: true,
        zIndexOffset: p.id === S.selId ? 1000 : 0
      });
      m.on("click", () => selectPlace(p.id, { fly: false }));
      m.addTo(layer);
      S.markerById.set(p.id, m);
    });
  }

  // One-off "this is yours, saved" cue: a ring on the pin and a soft flash on its list row.
  function pulsePlace(id) {
    if (reduceMotion()) return;
    const m = S.markerById.get(id), el = m && m.getElement();
    const targets = [el && el.querySelector(".pin"), $(`#panel-body [data-place="${CSS.escape(id)}"]`)].filter(Boolean);
    targets.forEach(t => t.classList.add("pulse"));
    setTimeout(() => targets.forEach(t => t.classList.remove("pulse")), 1300);
  }
  function setSelected(id) {
    const prev = S.selId;
    S.selId = id;
    for (const pid of [prev, id]) {
      if (!pid) continue;
      const m = S.markerById.get(pid);
      if (!m) continue;
      const el = m.getElement();
      if (el) { const pin = el.querySelector(".pin"); if (pin) pin.classList.toggle("is-sel", pid === id); }
      m.setZIndexOffset(pid === id ? 1000 : 0);
    }
    $$("[data-place]", $("#panel-body")).forEach(el => el.classList.toggle("is-active", el.dataset.place === id));
  }

  function selectPlace(id, opts) {
    const p = S.places.find(x => x.id === id);
    if (!p) return;
    let m = S.markerById.get(id);
    if (!m) { // place hidden by a filter: show everything, then select
      S.cat = "all"; render(); m = S.markerById.get(id);
      if (!m) return;
    }
    map.closePopup(); // closing the old popup clears the old selection first
    setSelected(id);
    S.progUntil = Date.now() + 2200;
    const open = () => {
      if (S.selId !== id) return;
      S.progUntil = Date.now() + 800;
      m.bindPopup(popupEl(p), {
        maxWidth: 300, minWidth: 280, autoPanPaddingTopLeft: isMobile() ? [16, 120] : [$("#panel").offsetWidth + 40, 70],
        autoPanPaddingBottomRight: isMobile() ? [16, Math.round(innerHeight * 0.46) + 16] : [60, 40]
      }).openPopup();
    };
    if (opts && opts.fly !== false) {
      // open the popup once the map has arrived, so it can pan to fit
      let done = false;
      const go = () => { if (!done) { done = true; open(); } };
      map.once("moveend", go);
      setTimeout(go, 1200);
      const z = Math.max(map.getZoom(), 15);
      if (reduceMotion()) map.setView([p.lat, p.lng], z); else map.flyTo([p.lat, p.lng], z, { duration: 0.6 });
    } else open();
    const row = $(`[data-place="${CSS.escape(id)}"]`, $("#panel-body"));
    if (row && !(opts && opts.fromPanel)) row.scrollIntoView({ block: "nearest", behavior: reduceMotion() ? "auto" : "smooth" });
  }

  function popupEl(p) {
    const st = stats(p);
    const mine = p.reviews.find(r => isMe(r.user_id));
    const ordered = p.reviews.slice().sort((a, b) => {
      if (S.friendId) { const fa = a.user_id === S.friendId, fb = b.user_id === S.friendId; if (fa !== fb) return fa ? -1 : 1; }
      return 0;
    });
    const price = mostCommonPrice(p);
    const el = document.createElement("div");
    el.className = "pp";
    el.innerHTML = `
      <p class="pp-name">${esc(p.name)}</p>
      <p class="pp-meta"><span class="cat-label"><i class="cat-dot cat-${p.category}"></i>${CATS[p.category].label}</span>${price ? `<span>· ${price}</span>` : ""}
        <span class="score"><b>${st.avg.toFixed(1)}</b>${starsHTML(Math.round(st.avg))}</span><span>(${st.n})</span></p>
      ${p.address ? `<p class="pp-addr">${esc(p.address)}</p>` : ""}
      <div class="pp-reviews">${ordered.map(r => `
        <div class="pp-rv">${avatar(r.user_id, "av-xs")}
          <div><p class="pp-rv-who">${esc(nameOf(r.user_id))} ${starsHTML(r.rating)}</p>
          ${r.body ? `<p class="pp-rv-body">${esc(r.body.length > 160 ? r.body.slice(0, 157) + "…" : r.body)}</p>` : ""}</div>
        </div>`).join("")}</div>
      <div class="pp-photos" data-photos hidden></div>
      <div class="pp-actions">
        <a class="btn-outline" href="${esc(mapsHref(p))}" target="_blank" rel="noopener">${IC.ext}Google Maps</a>
        <button type="button" class="btn-outline" data-mine>${mine ? IC.edit + "Edit your review" : IC.add + "I've been here"}</button>
        ${DEMO ? "" : `<button type="button" class="btn-outline" data-addphoto>${IC.camera}Add photos</button>
        <input type="file" accept="image/*" multiple class="sr" tabindex="-1" aria-hidden="true" data-photofile>`}
      </div>`;
    el.querySelector("[data-mine]").addEventListener("click", () => { map.closePopup(); openAdd({ place: p, review: mine || null }); });
    const file = el.querySelector("[data-photofile]");
    if (file) {
      el.querySelector("[data-addphoto]").addEventListener("click", () => file.click());
      file.addEventListener("change", () => { const fs = [...file.files]; file.value = ""; addPhotos(p, fs); });
    }
    fillPhotos(el.querySelector("[data-photos]"), p);
    return el;
  }
  // ---------- trip budgets: what a trip to a city cost, one per person per city, in the currency they paid ----------
  const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "CHF", "CNY", "HKD", "SGD", "AED", "MXN", "BRL", "ZAR", "THB", "IDR", "TRY", "KRW", "NZD", "SEK", "NOK", "DKK", "ISK"];
  const CURRENCY_KEY = "mycircle.currency";
  const REGION_CURRENCY = { US: "USD", GB: "GBP", IN: "INR", JP: "JPY", AU: "AUD", CA: "CAD", CH: "CHF", CN: "CNY", HK: "HKD", SG: "SGD", AE: "AED", MX: "MXN", BR: "BRL", ZA: "ZAR", TH: "THB", ID: "IDR", TR: "TRY", KR: "KRW", NZ: "NZD", SE: "SEK", NO: "NOK", DK: "DKK", IS: "ISK" };
  const EURO = "AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK".split(" ");
  function guessCurrency() {
    try { const r = new Intl.Locale(navigator.language).maximize().region; return REGION_CURRENCY[r] || (EURO.includes(r) ? "EUR" : "USD"); }
    catch (e) { return "USD"; }
  }
  function money(n, cur) {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n); }
    catch (e) { return Math.round(n) + " " + cur; }
  }
  function tripsIn(cityKey) { return cityKey ? S.trips.filter(t => t.city_key === cityKey) : []; }
  function perDay(t) { return t.days ? t.amount / t.days / (t.travellers || 1) : null; }
  function budgetHTML(cityKey, canEdit) {
    if (!cityKey) return "";
    canEdit = canEdit && !DEMO;
    const list = tripsIn(cityKey).slice().sort((a, b) => isMe(b.user_id) - isMe(a.user_id) || String(b.visited_month || "").localeCompare(String(a.visited_month || "")));
    if (!list.length && !canEdit) return "";
    // Typical cost: the median per person per day, in the currency most people used.
    const byCur = {};
    list.forEach(t => { const d = perDay(t); if (d) (byCur[t.currency] = byCur[t.currency] || []).push(d); });
    const cur = Object.keys(byCur).sort((a, b) => byCur[b].length - byCur[a].length)[0];
    let h = `<div class="p-section budget"><h2 class="p-section-title">Trip budgets</h2>`;
    if (cur) {
      const v = byCur[cur].sort((a, b) => a - b), mid = (v[Math.floor((v.length - 1) / 2)] + v[Math.ceil((v.length - 1) / 2)]) / 2;
      h += `<p class="budget-typical"><b>~${money(mid, cur)}</b> per person per day${v.length > 1 ? ` <span>· typical of ${v.length} trips</span>` : ""}</p>`;
    }
    h += list.map(t => `
      <div class="budget-row">${avatar(t.user_id, "av-sm")}
        <span class="r-main"><span class="r-name">${esc(nameOf(t.user_id))} <b>${money(t.amount, t.currency)}</b></span>
          <span class="r-sub">${[t.days ? plural(t.days, "day") : "", t.travellers > 1 ? plural(t.travellers, "person", "people") : "", perDay(t) ? "~" + money(perDay(t), t.currency) + "/person/day" : "", fmtMonth(t.visited_month)].filter(Boolean).join(" · ")}</span>
          ${t.note ? `<span class="r-sub budget-note">${esc(t.note)}</span>` : ""}</span>
      </div>`).join("");
    if (!list.length) h += `<p class="r-sub budget-empty">Nobody has shared what a trip here cost yet.</p>`;
    if (canEdit) h += `<button type="button" class="btn-outline budget-add" data-act="budget">${list.some(t => isMe(t.user_id)) ? IC.edit + "Edit your trip budget" : IC.add + "Add what your trip cost"}</button>`;
    return h + `</div>`;
  }
  const budgetDlg = $("#budget-dialog"), bDel = $("#b-del");
  $("#b-cur").innerHTML = CURRENCIES.map(c => `<option value="${c}">${c}</option>`).join("");
  function myTrip() { return S.city ? tripsIn(S.city.key).find(t => isMe(t.user_id)) : null; }
  function budgetError(msg) { const e = $("#budget-error"); e.textContent = msg || ""; e.hidden = !msg; }
  function openBudget() {
    if (!S.city || !S.city.key) return;
    const t = myTrip();
    $("#budget-city").textContent = `What your trip to ${S.city.name} cost in total. Your circle sees it on the city.`;
    $("#b-amount").value = t ? t.amount : "";
    $("#b-cur").value = t ? t.currency : store.get(CURRENCY_KEY, guessCurrency());
    $("#b-days").value = t && t.days ? t.days : "";
    $("#b-people").value = t ? t.travellers : 1;
    $("#b-month").value = t && t.visited_month ? t.visited_month : "";
    $("#b-note").value = t && t.note ? t.note : "";
    bDel.hidden = !t; bDel.textContent = "Delete"; delete bDel.dataset.sure;
    budgetError("");
    budgetDlg.showModal();
  }
  $$("[data-close]", budgetDlg).forEach(b => b.addEventListener("click", () => budgetDlg.close()));
  $("#budget-form").addEventListener("submit", async ev => {
    ev.preventDefault();
    const amount = Number($("#b-amount").value), days = $("#b-days").value ? Number($("#b-days").value) : null;
    const people = Number($("#b-people").value || 1), month = $("#b-month").value || null, currency = $("#b-cur").value;
    if (!(amount > 0) || amount >= 1e7) { budgetError("Enter the total you spent, for example 1200."); return; }
    if (days != null && !(Number.isInteger(days) && days >= 1 && days <= 366)) { budgetError("Days should be a whole number from 1 to 366."); return; }
    if (!(Number.isInteger(people) && people >= 1 && people <= 50)) { budgetError("People should be a whole number from 1 to 50."); return; }
    const save = $("#b-save");
    save.disabled = true; budgetError("");
    try {
      const { error } = await sb.from("trips").upsert({
        circle_id: S.circleId, user_id: S.user.id, city_key: S.city.key, city: S.city.name, country: S.city.sub || null,
        amount: Math.round(amount * 100) / 100, currency, days, travellers: people, visited_month: month, note: $("#b-note").value.trim() || null
      }, { onConflict: "circle_id,user_id,city_key" });
      if (error) throw error;
      store.set(CURRENCY_KEY, currency);
      budgetDlg.close();
      await refresh();
      toast("Trip budget saved");
    } catch (e) { budgetError(friendly(e, "Couldn't save. Try again.")); }
    finally { save.disabled = false; }
  });
  bDel.addEventListener("click", async () => {
    if (!bDel.dataset.sure) { bDel.dataset.sure = "1"; bDel.textContent = "Delete your budget?"; return; }
    const t = myTrip();
    if (!t) return;
    bDel.disabled = true;
    try {
      const { error } = await sb.from("trips").delete().eq("id", t.id);
      if (error) throw error;
      budgetDlg.close();
      await refresh();
      toast("Trip budget deleted");
    } catch (e) { budgetError(friendly(e, "Couldn't delete. Try again.")); }
    finally { bDel.disabled = false; }
  });

  // ---------- photos: private "photos" bucket, files at <place id>/<random>.jpg, listed in the photos table ----------
  const MAX_THUMBS = 4;
  const photoUrlCache = new Map(); // path -> { url, until }
  async function photoUrls(paths) {
    if (DEMO) return paths; // demo photos are inline images
    const now = Date.now(), need = paths.filter(x => !((photoUrlCache.get(x) || {}).until > now));
    if (need.length) {
      const { data, error } = await sb.storage.from("photos").createSignedUrls(need, 3600);
      if (error) throw error;
      for (const d of data || []) if (d.signedUrl) photoUrlCache.set(d.path, { url: d.signedUrl, until: now + 3300e3 });
    }
    return paths.map(x => (photoUrlCache.get(x) || {}).url || "");
  }
  async function fillPhotos(box, p) {
    const list = p.photos || [];
    if (!list.length) return;
    const shown = list.slice(0, MAX_THUMBS), more = list.length - shown.length;
    box.innerHTML = shown.map((ph, i) => `<button type="button" class="pp-thumb" data-i="${i}" aria-label="Open photo ${i + 1} of ${list.length}">
      <img alt="" loading="lazy">${i === shown.length - 1 && more > 0 ? `<span>+${more}</span>` : ""}</button>`).join("");
    box.hidden = false;
    box.addEventListener("click", ev => { const b = ev.target.closest("[data-i]"); if (b) openPhotos(p, +b.dataset.i); });
    try {
      const urls = await photoUrls(shown.map(ph => ph.path));
      box.querySelectorAll("img").forEach((img, i) => { img.src = urls[i]; });
    } catch (e) { box.hidden = true; }
  }
  // Re-encode as a JPEG of at most 1600px: keeps uploads small and drops the camera's location data (EXIF).
  async function shrinkPhoto(file) {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
    catch (e) { throw new Error(`Couldn't read ${file.name}. Try a JPEG or PNG.`); }
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error(`Couldn't read ${file.name}.`)), "image/jpeg", 0.85));
  }
  async function addPhotos(p, files) {
    files = files.filter(f => /^image\//.test(f.type) || /\.hei[cf]$/i.test(f.name)).slice(0, 10);
    if (!files.length) return;
    let done = 0;
    try {
      for (const f of files) {
        toast(files.length > 1 ? `Uploading photo ${done + 1} of ${files.length}…` : "Uploading photo…");
        const blob = await shrinkPhoto(f);
        const path = `${p.id}/${crypto.randomUUID()}.jpg`;
        const up = await sb.storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw up.error;
        const { error } = await sb.from("photos").insert({ place_id: p.id, path });
        if (error) { await sb.storage.from("photos").remove([path]); throw error; }
        done++;
      }
      toast(done === 1 ? "Photo added. Your friends can see it now." : `${done} photos added. Your friends can see them now.`);
    } catch (e) {
      toast(friendly(e, done ? `Added ${done} of ${files.length} photos. Try the rest again.` : "Couldn't add the photo. Try again."));
    }
    if (!done) return;
    await refresh();
    if (S.places.some(x => x.id === p.id)) selectPlace(p.id, { fly: false });
  }

  const photoDlg = $("#photo-dialog"), photoImg = $("#photo-img"), photoDel = $("#photo-del");
  let PV = null; // { place, i }
  async function showPhoto() {
    const list = PV.place.photos, ph = list[PV.i];
    const when = ph.created_at ? new Date(ph.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "";
    $("#photo-cap").textContent = `${PV.place.name} · ${PV.i + 1} of ${list.length} · ${nameOf(ph.user_id)}${when ? ", " + when : ""}${ph.credit ? " · " + ph.credit : ""}`;
    photoDel.hidden = DEMO || !isMe(ph.user_id);
    photoDel.textContent = "Delete"; delete photoDel.dataset.sure;
    $$("[data-step]", photoDlg).forEach(b => { b.hidden = list.length < 2; });
    photoImg.alt = "Photo of " + PV.place.name;
    photoImg.removeAttribute("src");
    const view = PV, index = PV.i;
    try {
      const [url] = await photoUrls([ph.path]);
      if (PV !== view || PV.i !== index) return;
      if (!url) throw new Error("Photo unavailable");
      photoImg.src = url;
    } catch (e) {
      if (PV === view && PV.i === index) toast(friendly(e, "Couldn't load the photo."));
    }
  }
  function openPhotos(p, i) { PV = { place: p, i }; showPhoto(); if (!photoDlg.open) photoDlg.showModal(); }
  function stepPhoto(d) { if (!PV) return; const n = PV.place.photos.length; PV.i = (PV.i + d + n) % n; showPhoto(); }
  photoDlg.addEventListener("click", ev => {
    if (ev.target === photoDlg) { photoDlg.close(); return; } // backdrop
    const b = ev.target.closest("[data-step]");
    if (b) stepPhoto(+b.dataset.step);
  });
  photoDlg.addEventListener("keydown", ev => {
    if (ev.key === "ArrowLeft") stepPhoto(-1);
    if (ev.key === "ArrowRight") stepPhoto(1);
  });
  $("#photo-close").addEventListener("click", () => photoDlg.close());
  photoDlg.addEventListener("close", () => {
    if (photoDlg.open) return;
    PV = null;
    photoImg.removeAttribute("src");
  });
  photoDel.addEventListener("click", async () => {
    if (!photoDel.dataset.sure) { photoDel.dataset.sure = "1"; photoDel.textContent = "Delete this photo?"; return; }
    const placeId = PV.place.id, ph = PV.place.photos[PV.i];
    photoDel.disabled = true;
    try {
      const rm = await sb.storage.from("photos").remove([ph.path]);
      if (rm.error) throw rm.error;
      const { error } = await sb.from("photos").delete().eq("id", ph.id);
      if (error) throw error;
      photoDlg.close();
      toast("Photo deleted");
      await refresh();
      if (S.places.some(x => x.id === placeId)) selectPlace(placeId, { fly: false });
    } catch (e) { toast(friendly(e, "Couldn't delete the photo. Try again.")); }
    finally { photoDel.disabled = false; }
  });

  function mostCommonPrice(p) {
    const c = {}; let best = 0, bn = 0;
    p.reviews.forEach(r => { if (r.price) { c[r.price] = (c[r.price] || 0) + 1; if (c[r.price] > bn) { bn = c[r.price]; best = r.price; } } });
    return priceStr(best);
  }

  function chipsHTML(list) {
    const cc = catCounts(list);
    const opts = [["all", "All"]].concat(CAT_ORDER.map(k => [k, CATS[k].label]));
    return `<div class="chips" role="group" aria-label="Type of place">${opts.filter(([k]) => k === "all" || cc[k] > 0).map(([k, label]) =>
      `<button type="button" class="chip" data-cat="${k}" aria-pressed="${S.cat === k}">${k === "all" ? "" : `<i class="cat-dot cat-${k}"></i>`}${label} <span class="n">${cc[k]}</span></button>`).join("")}</div>`;
  }

  function renderPanel() {
    const body = $("#panel-body");
    $("#search-back").hidden = S.mode === "home";
    $("#search-brand").hidden = S.mode !== "home";
    $("#search-clear").hidden = !$("#search-input").value;
    if (!S.loaded) { body.innerHTML = ""; $("#panel").classList.add("no-sheet"); return; }
    $("#panel").classList.remove("no-sheet");
    const circle = currentCircle();
    let h = "";

    if (S.mode === "home") {
      const groups = cityGroups();
      h += `<div class="p-head"><p class="p-eyebrow">${esc(circle ? circle.name : "")}</p>
        <h1 class="p-title">Where are you headed?</h1>
        <p class="p-sub">Search a city to see which friends have been there and what they thought.</p>${myCountry() ? `<div class="p-shape" aria-hidden="true">${MC.shapeSVG(myCountry())}</div>` : ""}</div>`;
      h += passportHTML() + doneListHTML();
      if (!groups.length) {
        h += `<div class="p-empty"><p><b>No places yet.</b> Add a few places you've been, then invite close friends to add theirs.</p>
          <button type="button" class="btn btn-primary" data-act="add">Add a place</button>
          <button type="button" class="link-btn" data-act="invite">Invite friends</button></div>`;
      } else {
        const top = topTravelled();
        if (top.length > 1) {
          h += `<div class="p-section"><h2 class="p-section-title">Top travelled</h2>`;
          h += top.slice(0, 3).map((f, i) => `
            <button type="button" class="row" data-act="globe" data-uid="${esc(f.id)}" aria-label="Number ${i + 1}: ${esc(nameOf(f.id))}, ${travelSub(f)}. See their trips on the globe">
              <span class="g-rank r${i + 1}" aria-hidden="true">${i + 1}</span>${avatar(f.id)}
              <span class="r-main"><span class="r-name">${esc(nameOf(f.id))}</span><span class="r-sub">${travelSub(f)}</span></span>
              ${IC.chev}
            </button>`).join("");
          h += `<button type="button" class="link-btn top-all" data-act="globe" data-uid="">${top.length > 3 ? `See all ${top.length} on the globe` : "See their trips on the globe"}</button></div>`;
        }
        h += `<div class="p-section"><h2 class="p-section-title">Cities your circle has been to</h2>`;
        h += groups.map((g, i) => `
          <button type="button" class="row" data-city="${i}">
            <span class="city-ic">${IC.city}</span>
            <span class="r-main"><span class="r-name">${esc(g.name)}</span>
              <span class="r-sub">${esc(g.cityKey && g.country ? g.country + " · " : "")}${plural(g.places.length, "place")} · ${plural(g.people.size, "person", "people")}</span></span>
            <span class="stack">${[...g.people].slice(0, 3).map(id => avatar(id, "av-sm")).join("")}</span>
            ${IC.chev}
          </button>`).join("");
        h += `</div>`;
        S._groups = groups;
      }
    }

    if (S.mode === "city") {
      const all = cityPlaces();
      const list = byCat(all);
      const friends = friendsIn(list);
      h += `<div class="p-head">
        <button type="button" class="p-back" data-act="home">${IC.back}All cities</button>
        <h1 class="p-title">${esc(S.city.name)}</h1>
        ${S.city.sub ? `<p class="p-sub">${esc(S.city.sub)}</p>` : ""}
        <p class="p-sub">${all.length ? `${plural(all.length, "place")} · ${plural(friendsIn(all).length, "person", "people")} from your circle went` : "No one in your circle has been here yet"}</p>${doneBtnHTML()}</div>`;
      if (!all.length) {
        h += `<div class="p-empty"><p>Nobody has added a place in ${esc(S.city.name)} yet. Been there? Add it, or ask a friend who went to add theirs.</p>
          <button type="button" class="btn btn-primary" data-act="add">Add a place</button>
          <button type="button" class="link-btn" data-act="invite">Invite friends</button></div>`;
      } else {
        h += chipsHTML(all);
        if (all.length >= 2) h += `<div class="plan-cta"><div><b>Plan a day here</b><span>Morning, afternoon and evening stops from your friends' best picks, with street directions.</span></div>
          <button type="button" class="btn btn-primary" data-act="plan">Plan my day</button></div>`;
        h += budgetHTML(S.city.key, true);
        h += `<div class="p-section"><h2 class="p-section-title">Friends who've been here</h2>`;
        h += friends.map(f => {
          const a = avg(f.ratings);
          return `<button type="button" class="row" data-friend="${esc(f.id)}">
            ${avatar(f.id)}
            <span class="r-main"><span class="r-name">${esc(nameOf(f.id))}</span>
              <span class="r-sub">${plural(f.places, "place")} · <span class="score"><b>${a.toFixed(1)}</b>${starsHTML(Math.round(a))}</span></span></span>
            ${IC.chev}</button>`;
        }).join("") || `<p class="p-empty">No ${esc(CATS[S.cat] ? CATS[S.cat].label.toLowerCase() : "")} places here.</p>`;
        h += `</div><div class="p-section"><h2 class="p-section-title">Places here</h2>`;
        h += list.slice().sort((a, b) => stats(b).avg - stats(a).avg || stats(b).n - stats(a).n).map(p => {
          const st = stats(p);
          return `<button type="button" class="row" data-place="${esc(p.id)}">
            <span class="r-main"><span class="r-name">${esc(p.name)}</span>
              <span class="r-sub"><span class="score"><b>${st.avg.toFixed(1)}</b>${starsHTML(Math.round(st.avg))}</span>
              <span>·</span><span class="cat-label"><i class="cat-dot cat-${p.category}"></i>${CATS[p.category].label}</span></span></span>
            <span class="stack">${p.reviews.slice(0, 3).map(r => avatar(r.user_id, "av-xs")).join("")}</span></button>`;
        }).join("");
        h += `</div>`;
      }
    }

    if (S.mode === "plan" && S.plan) h += planHTML();

    if (S.mode === "friend") {
      const all = friendItems(S.friendId, cityPlaces());
      const items = friendItems(S.friendId, byCat(cityPlaces()));
      const a = avg(all.map(it => it.review.rating));
      h += `<div class="p-head">
        <button type="button" class="p-back" data-act="city">${IC.back}${esc(S.city ? S.city.name : "Back")}</button>
        <div style="display:flex;gap:12px;align-items:center">${avatar(S.friendId)}
          <div><h1 class="p-title">${esc(isMe(S.friendId) ? "Your places" : realName(S.friendId))}</h1>
          <p class="p-sub">${plural(all.length, "place")} in ${esc(S.city ? S.city.name : "this area")}${all.length ? ` · avg <span class="score"><b>${a.toFixed(1)}</b>${starsHTML(Math.round(a))}</span>` : ""}</p></div></div></div>`;
      h += chipsHTML(all.map(it => it.place));
      h += items.map((it, i) => {
        const p = it.place, r = it.review;
        const when = fmtMonth(r.visited_month);
        return `<article class="rv" data-place="${esc(p.id)}" tabindex="0">
          <span class="num" style="background:var(--cat-${p.category})">${i + 1}</span>
          <div>
            <h3 class="rv-name">${esc(p.name)}</h3>
            <p class="rv-meta"><span class="cat-label"><i class="cat-dot cat-${p.category}"></i>${CATS[p.category].label}</span>
              ${r.price ? `<span>· ${priceStr(r.price)}</span>` : ""}${starsHTML(r.rating)}${when ? `<span>Went ${esc(when)}</span>` : ""}</p>
            ${r.body ? `<p class="rv-body">${esc(r.body)}</p>` : ""}
            ${r.tip ? `<p class="rv-tip"><b>Tip</b>${esc(r.tip)}</p>` : ""}
            <div class="rv-actions">
              <a class="btn-outline" href="${esc(mapsHref(p))}" target="_blank" rel="noopener">${IC.ext}Google Maps</a>
              ${isMe(r.user_id) ? `<button type="button" class="btn-outline" data-edit="${esc(p.id)}">${IC.edit}Edit</button>` : ""}
            </div>
          </div></article>`;
      }).join("") || `<p class="p-empty">No places of this type.</p>`;
    }

    body.innerHTML = h;
    if (S.selId) $$("[data-place]", body).forEach(el => el.classList.toggle("is-active", el.dataset.place === S.selId));
  }


  // ---------- day plan: morning, afternoon and evening stops, joined by real street routes ----------
  const SLOTS = [
    { key: "morning", label: "Morning", time: "9:30 AM" },
    { key: "afternoon", label: "Afternoon", time: "1:30 PM" },
    { key: "evening", label: "Evening", time: "7:00 PM" }
  ];
  const STAY_HOURS = { see: "about 2 hours", food: "about 1.5 hours", other: "about 1 hour", stay: "" };
  const planLayer = L.layerGroup().addTo(map);
  function kmBetween(a, b) {
    const R = 6371, rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  const bestFirst = arr => arr.slice().sort((a, b) => stats(b).avg - stats(a).avg || stats(b).n - stats(a).n);
  // Morning: the best thing to see. Evening: the best food. Afternoon: a good place that adds the least detour.
  function buildStops(places) {
    const pool = places.filter(p => p.category !== "stay");
    const use = pool.length >= 2 ? pool : places;
    const see = bestFirst(use.filter(p => p.category !== "food")), food = bestFirst(use.filter(p => p.category === "food"));
    const morning = see[0] || food[0];
    if (!morning) return [];
    const used = new Set([morning.id]);
    const near = p => kmBetween(morning, p) <= 10; // a day plan stays in one part of town
    const evening = food.find(p => !used.has(p.id) && near(p)) || see.find(p => !used.has(p.id) && near(p)) || null;
    if (evening) used.add(evening.id);
    let afternoon = null;
    if (evening) {
      const rest = use.filter(p => !used.has(p.id) && near(p));
      afternoon = rest.sort((a, b) => (stats(b).avg - 0.2 * (kmBetween(morning, b) + kmBetween(b, evening))) - (stats(a).avg - 0.2 * (kmBetween(morning, a) + kmBetween(a, evening))))[0] || null;
    }
    return [[SLOTS[0], morning], afternoon && [SLOTS[1], afternoon], evening && [SLOTS[2], evening]].filter(Boolean).map(([slot, place]) => ({ slot, place }));
  }
  function fmtDur(sec) { const m = Math.max(1, Math.round(sec / 60)); return m < 60 ? m + " min" : Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0") + " min"; }
  function fmtDist(m) { return m < 1000 ? Math.round(m / 10) * 10 + " m" : (m / 1000).toFixed(1) + " km"; }
  function startPlan() {
    const stops = buildStops(cityPlaces());
    if (stops.length < 2) { toast("Add a few more places here to plan a day."); return; }
    S.plan = { stops, mode: "foot", status: "loading", route: null, ctl: null };
    S.mode = "plan"; S.selId = null;
    map.closePopup();
    render();
    flyTo(L.latLngBounds(stops.map(s => [s.place.lat, s.place.lng])).pad(0.3), 16);
    loadRoute();
  }
  function closePlan() {
    if (S.plan && S.plan.ctl) S.plan.ctl.abort();
    S.plan = null; S.mode = "city"; S.selId = null;
    map.closePopup();
    render();
    if (S.city) flyTo(L.latLngBounds([[S.city.bbox[0], S.city.bbox[1]], [S.city.bbox[2], S.city.bbox[3]]]), 14);
  }
  async function loadRoute() {
    const plan = S.plan;
    if (!plan) return;
    if (plan.ctl) plan.ctl.abort();
    const ctl = plan.ctl = new AbortController();
    plan.status = "loading"; plan.route = null;
    render();
    const coords = plan.stops.map(s => s.place.lng + "," + s.place.lat).join(";");
    const url = `${CFG.routeUrl || "https://routing.openstreetmap.de"}/routed-${plan.mode === "car" ? "car" : "foot"}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    try {
      const res = await fetch(url, { signal: ctl.signal });
      if (!res.ok) throw new Error("route " + res.status);
      const data = await res.json();
      const rt = data.routes && data.routes[0];
      if (!rt) throw new Error("no route");
      if (S.plan !== plan || ctl.signal.aborted) return;
      plan.route = { coords: rt.geometry.coordinates.map(([x, y]) => [y, x]), legs: rt.legs.map(l => ({ m: l.distance, s: l.duration })), m: rt.distance, s: rt.duration };
      plan.status = "ok";
    } catch (e) {
      if (ctl.signal.aborted || S.plan !== plan) return;
      plan.status = "fail";
    }
    render();
    if (plan.route) flyTo(L.latLngBounds(plan.route.coords).pad(0.15), 17);
  }
  function renderPlanRoute() {
    planLayer.clearLayers();
    if (!S.plan) return;
    const line = S.plan.route ? S.plan.route.coords : S.plan.stops.map(s => [s.place.lat, s.place.lng]);
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#3b63da";
    L.polyline(line, { color: "#fff", weight: 10, opacity: .95, lineCap: "round", lineJoin: "round", interactive: false }).addTo(planLayer);
    L.polyline(line, { color: accent, weight: 5, opacity: 1, lineCap: "round", lineJoin: "round", dashArray: S.plan.route ? null : "2 10", interactive: false }).addTo(planLayer);
  }
  function planHTML() {
    const P = S.plan, R = P.route, walk = P.mode === "foot";
    const modeIc = walk ? IC.walk : IC.car;
    let sum = "";
    if (P.status === "ok") sum = `${plural(P.stops.length, "stop")} · ${fmtDist(R.m)} · about ${fmtDur(R.s)} ${walk ? "on foot" : "by car"}`;
    else if (P.status === "loading") sum = "Finding the best streets…";
    else sum = "Couldn't load street directions";
    let h = `<div class="p-head">
      <button type="button" class="p-back" data-act="plan-close">${IC.back}${esc(S.city ? S.city.name : "Back")}</button>
      <p class="p-eyebrow">Your day plan</p>
      <h1 class="p-title">A day in ${esc(S.city ? S.city.name : "the city")}</h1>
      <p class="p-sub" role="status">${esc(sum)}</p></div>
      <div class="plan-modes" role="group" aria-label="How you get around">
        <button type="button" class="chip" data-pmode="foot" aria-pressed="${walk}">${IC.walk}Walk</button>
        <button type="button" class="chip" data-pmode="car" aria-pressed="${!walk}">${IC.car}Drive</button>
      </div>`;
    if (P.status === "fail") h += `<p class="plan-note">The route service didn't answer, so the map shows straight lines for now. <button type="button" class="link-btn" data-act="plan-retry">Try again</button></p>`;
    h += `<ol class="tl">`;
    P.stops.forEach((st, i) => {
      const p = st.place, s = stats(p), tip = (p.reviews.find(r => r.tip) || {}).tip, who = [...new Set(p.reviews.map(r => r.user_id))];
      const leg = P.status === "ok" && i > 0 ? R.legs[i - 1] : null;
      if (leg) h += `<li class="tl-leg" aria-label="Travel">${modeIc}${fmtDur(leg.s)} · ${fmtDist(leg.m)}</li>`;
      h += `<li class="tl-item" data-place="${esc(p.id)}" tabindex="0">
        <div class="tl-when"><span>${st.slot.label}</span><b>${st.slot.time}</b></div>
        <span class="num" style="background:var(--cat-${p.category})">${i + 1}</span>
        <div class="tl-body">
          <h3 class="rv-name">${esc(p.name)}</h3>
          <p class="rv-meta"><span class="score"><b>${s.avg.toFixed(1)}</b>${starsHTML(Math.round(s.avg))}</span><span class="cat-label"><i class="cat-dot cat-${p.category}"></i>${CATS[p.category].label}</span>${STAY_HOURS[p.category] ? `<span>${STAY_HOURS[p.category]}</span>` : ""}</p>
          ${tip ? `<p class="rv-tip"><b>Tip</b>${esc(tip)}</p>` : ""}
          <p class="tl-who"><span class="stack">${who.slice(0, 3).map(id => avatar(id, "av-xs")).join("")}</span>${who.length === 1 ? esc(nameOf(who[0])) + " recommends it" : plural(who.length, "friend") + " recommend it"}</p>
        </div></li>`;
    });
    return h + `</ol>`;
  }

  // panel clicks
  $("#panel-body").addEventListener("click", ev => {
    const t = ev.target;
    if (t.closest("a")) return;
    const act = t.closest("[data-act]");
    if (act) {
      const a = act.dataset.act;
      if (a === "home") goHome();
      else if (a === "city") backFromFriend();
      else if (a === "add") openAdd({});
      else if (a === "invite") openInvite();
      else if (a === "plan") startPlan();
      else if (a === "done") toggleDone(S.city);
      else if (a === "plan-close") closePlan();
      else if (a === "plan-retry") loadRoute();
      else if (a === "globe") openGlobeView(act.dataset.uid || null);
      else if (a === "budget") openBudget();
      return;
    }
    const ud = t.closest("[data-undone]");
    if (ud) { const d = DONE.list[Number(ud.dataset.undone)]; if (d) { DONE.list.splice(Number(ud.dataset.undone), 1); drawDone(); render(); saveDone(); toast(d.n + " is no longer marked complete"); } return; }
    const pm = t.closest("[data-pmode]");
    if (pm && S.plan) { if (S.plan.mode !== pm.dataset.pmode) { S.plan.mode = pm.dataset.pmode; loadRoute(); } return; }
    const cat = t.closest("[data-cat]");
    if (cat) { S.cat = cat.dataset.cat; S.selId = null; map.closePopup(); render(); return; }
    const city = t.closest("[data-city]");
    if (city && S._groups) { openCityFromGroup(S._groups[Number(city.dataset.city)]); return; }
    const fr = t.closest("[data-friend]");
    if (fr) { openFriend(fr.dataset.friend); return; }
    const ed = t.closest("[data-edit]");
    if (ed) {
      const p = S.places.find(x => x.id === ed.dataset.edit);
      if (p) openAdd({ place: p, review: p.reviews.find(r => isMe(r.user_id)) || null });
      return;
    }
    const pl = t.closest("[data-place]");
    if (pl) { selectPlace(pl.dataset.place, { fly: true, fromPanel: true }); if (isMobile()) $("#panel").classList.remove("expanded"); }
  });
  $("#panel-body").addEventListener("keydown", ev => {
    if (ev.key === "Enter" && ev.target.matches("article[data-place], .tl-item[data-place]")) selectPlace(ev.target.dataset.place, { fly: true, fromPanel: true });
  });

  // ---------- city search ----------
  const search = { items: [], active: -1, ctl: null };
  const input = $("#search-input");
  const suggest = $("#suggest");

  function photonUrl(base, params) {
    const u = new URL(base);
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, v); });
    return u.toString();
  }
  const PLACE_TYPES = { country: 1, state: 2, region: 2, city: 3, county: 4, district: 5, town: 3, village: 6, locality: 6, borough: 5, suburb: 7 };

  function featureToArea(f) {
    const p = f.properties || {};
    const [lng, lat] = f.geometry.coordinates;
    let bbox;
    if (Array.isArray(p.extent) && p.extent.length === 4) {
      const [w, n, e, s] = p.extent; // Photon: [minLon, maxLat, maxLon, minLat]
      bbox = [Math.min(s, n), w, Math.max(s, n), e];
    } else {
      const r = p.type === "country" ? 6 : p.type === "state" ? 2.5 : p.type === "city" ? 0.18 : 0.08;
      const k = 1 / Math.max(0.2, Math.cos(lat * Math.PI / 180));
      bbox = [lat - r, lng - r * k, lat + r, lng + r * k];
    }
    const subParts = [p.state, p.country].filter(x => x && x !== p.name);
    return { name: p.name || p.city || "", sub: subParts.join(", "), key: ["city", "town", "village"].includes(p.type) ? norm(p.name) : null, bbox, type: p.type, osm: p.osm_type && p.osm_id ? p.osm_type + p.osm_id : null };
  }

  async function runSearch(q) {
    q = q.trim();
    if (search.ctl) search.ctl.abort();
    if (q.length < 2) { closeSuggest(); return; }
    const local = cityGroups().filter(g => norm(g.name).startsWith(norm(q)) || norm(g.name).includes(" " + norm(q))).slice(0, 3)
      .map(g => ({ kind: "group", group: g, name: g.name, sub: `In your circle · ${plural(g.places.length, "place")}` }));
    search.items = local.slice();
    search.active = -1;
    drawSuggest(true);
    const ctl = new AbortController();
    search.ctl = ctl;
    try {
      const url = photonUrl(CFG.searchUrl, { q, limit: 10, lang: "en" });
      const res = await fetch(url, { signal: ctl.signal });
      if (!res.ok) throw new Error("search " + res.status);
      const data = await res.json();
      if (ctl.signal.aborted) return;
      const feats = (data.features || []).filter(f => f.geometry && f.properties && f.properties.name);
      const areas = feats.filter(f => PLACE_TYPES[f.properties.type] || f.properties.osm_key === "place" || f.properties.osm_key === "boundary")
        .sort((a, b) => (PLACE_TYPES[a.properties.type] || 9) - (PLACE_TYPES[b.properties.type] || 9));
      const seen = new Set(local.map(l => norm(l.name)));
      const remote = [];
      for (const f of areas) {
        const a = featureToArea(f);
        const k = norm(a.name) + "|" + norm(a.sub);
        if (seen.has(k) || seen.has(norm(a.name) + "|")) continue;
        seen.add(k);
        remote.push({ kind: "area", area: a, name: a.name, sub: [a.sub, a.type && a.type !== "other" ? a.type : ""].filter(Boolean).join(" · ") });
        if (remote.length >= 6) break;
      }
      search.items = local.concat(remote);
      drawSuggest(false);
    } catch (e) {
      if (e.name === "AbortError") return;
      search.items = local;
      drawSuggest(false, "Search isn't available right now. Check your connection.");
    }
  }
  const runSearchSoon = debounce(runSearch, 250);

  function drawSuggest(loading, errMsg) {
    let h = search.items.map((it, i) => `
      <li role="option" id="sg-${i}" data-i="${i}" aria-selected="${i === search.active}">
        <span class="s-icon ${it.kind === "group" ? "circle-hit" : ""}">${it.kind === "group" ? IC.person : IC.pin}</span>
        <span class="s-text"><span class="s-name">${esc(it.name)}</span><span class="s-sub">${esc(it.sub)}</span></span>
      </li>`).join("");
    if (!search.items.length) h = `<li class="s-empty">${loading ? "Searching…" : esc(errMsg || "No matching cities")}</li>`;
    else if (errMsg) h += `<li class="s-empty">${esc(errMsg)}</li>`;
    h += `<li class="s-credit">Search by Photon · © OpenStreetMap contributors</li>`;
    suggest.innerHTML = h;
    suggest.hidden = false;
    $(".search-wrap").classList.add("open");
    input.setAttribute("aria-expanded", "true");
  }
  function closeSuggest() {
    suggest.hidden = true;
    $(".search-wrap").classList.remove("open");
    input.setAttribute("aria-expanded", "false");
  }
  function pickSuggestion(i) {
    const it = search.items[i];
    if (!it) return;
    closeSuggest();
    input.blur();
    if (it.kind === "group") openCityFromGroup(it.group);
    else openCity(it.area);
  }
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-controls", "suggest");
  input.setAttribute("aria-autocomplete", "list");
  input.addEventListener("input", () => { $("#search-clear").hidden = !input.value; runSearchSoon(input.value); });
  input.addEventListener("focus", () => { if (input.value.trim().length >= 2 && search.items.length) drawSuggest(false); });
  input.addEventListener("keydown", ev => {
    if (suggest.hidden) return;
    const n = search.items.length;
    if (ev.key === "ArrowDown") { ev.preventDefault(); search.active = (search.active + 1) % n; drawSuggest(false); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); search.active = (search.active - 1 + n) % n; drawSuggest(false); }
    else if (ev.key === "Escape") { closeSuggest(); }
    if (search.active >= 0) input.setAttribute("aria-activedescendant", "sg-" + search.active);
  });
  $("#search-form").addEventListener("submit", async ev => {
    ev.preventDefault();
    if (search.active >= 0) return pickSuggestion(search.active);
    if (!search.items.length && input.value.trim().length >= 2) await runSearch(input.value);
    pickSuggestion(0);
  });
  suggest.addEventListener("mousedown", ev => { const li = ev.target.closest("li[data-i]"); if (li) { ev.preventDefault(); pickSuggestion(Number(li.dataset.i)); } });
  document.addEventListener("click", ev => { if (!ev.target.closest(".search-wrap")) closeSuggest(); });
  $("#search-clear").addEventListener("click", () => { input.value = ""; $("#search-clear").hidden = true; closeSuggest(); input.focus(); });
  $("#search-back").addEventListener("click", () => { if (S.mode === "plan") closePlan(); else if (S.mode === "friend") backFromFriend(); else goHome(); });
  $("#area-btn").addEventListener("click", () => {
    const b = map.getBounds();
    openCity({ name: "This area", sub: "", key: null, bbox: [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()] }, { fly: false });
  });
  $("#sheet-handle").addEventListener("click", () => $("#panel").classList.toggle("expanded"));
  $("#sheet-handle").addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); $("#panel").classList.toggle("expanded"); } });

  // ---------- add / edit a review ----------
  const addDlg = $("#add-dialog");
  const A = { place: null, review: null, manual: false, results: [], ctl: null };

  (function buildRate() {
    let h = "";
    for (let i = 5; i >= 1; i--) h += `<input type="radio" name="rating" id="rate-${i}" value="${i}"><label for="rate-${i}" title="${RATING_WORDS[i]}"><span class="sr">${i} stars, ${RATING_WORDS[i]}</span>${STAR}</label>`;
    $("#f-rate").innerHTML = h;
  })();
  $("#f-rate").addEventListener("change", () => { const v = radio("rating"); $("#rate-word").textContent = RATING_WORDS[Number(v) || 0]; });
  function radio(name) { const el = $(`input[name="${name}"]:checked`, addDlg); return el ? el.value : ""; }
  function setRadio(name, v) { $$(`input[name="${name}"]`, addDlg).forEach(el => { el.checked = el.value === String(v); }); }
  function addError(msg) { const e = $("#add-error"); e.textContent = msg || ""; e.hidden = !msg; }

  function guessCategory(p) {
    const k = p.osm_key, v = p.osm_value;
    if (k === "tourism" && /^(hotel|hostel|motel|guest_house|apartment|chalet|camp_site|caravan_site|alpine_hut)$/.test(v)) return "stay";
    if (k === "amenity" && /^(restaurant|cafe|bar|pub|fast_food|food_court|ice_cream|biergarten)$/.test(v)) return "food";
    if (k === "shop" && /^(bakery|coffee|deli|pastry|confectionery|chocolate|tea|wine|alcohol)$/.test(v)) return "food";
    if (k === "tourism" && /^(attraction|museum|viewpoint|gallery|zoo|theme_park|aquarium|artwork|picnic_site)$/.test(v)) return "see";
    if (k === "leisure" && /^(park|garden|nature_reserve|beach_resort|stadium|water_park|marina)$/.test(v)) return "see";
    if (k === "historic" || k === "natural" || (k === "amenity" && /^(theatre|cinema|arts_centre|place_of_worship|nightclub)$/.test(v))) return "see";
    return "other";
  }
  function featureToCandidate(f) {
    const p = f.properties || {};
    const [lng, lat] = f.geometry.coordinates;
    const street = [p.housenumber, p.street].filter(Boolean).join(" ");
    const town = p.city || p.town || p.village || p.district || p.county || "";
    const name = p.name || street || town;
    const address = [street, town !== name ? town : "", p.state].filter(Boolean).join(", ");
    return {
      name: String(name).slice(0, 120), address: address.slice(0, 200), city: String(town || (p.type === "city" ? p.name : "")).slice(0, 80),
      country: String(p.country || "").slice(0, 80), lat, lng,
      source_ref: p.osm_type && p.osm_id ? ("osm:" + p.osm_type + p.osm_id).slice(0, 80) : null,
      category: guessCategory(p)
    };
  }

  function openAdd(opts) {
    if (!S.circleId) return;
    A.place = opts.place || null;
    A.review = opts.review || null;
    A.manual = false;
    $("#add-form").reset();
    addError("");
    $("#rate-word").textContent = RATING_WORDS[0];
    $("#del-confirm").hidden = true;
    if (A.place) showDetails(); else showFind();
    if (!addDlg.open) addDlg.showModal();
    if (!A.place) setTimeout(() => $("#place-q").focus(), 30);
  }
  function showFind() {
    $("#add-title").textContent = "Add a place";
    $("#add-step-find").hidden = false;
    $("#add-step-details").hidden = true;
    $("#add-foot").hidden = true;
    $("#place-results").innerHTML = "";
    const c = map.getCenter();
    $("#place-near").textContent = map.getZoom() >= 9 ? "Showing results near the part of the map you're looking at." : "Tip: zoom the map to the city first for better results.";
    A._near = [c.lat, c.lng];
  }
  function showDetails() {
    const p = A.place;
    const existing = !!p.id;
    $("#add-title").textContent = A.review ? "Edit your review" : existing ? "Add your review" : "Add a place";
    $("#add-step-find").hidden = true;
    $("#add-step-details").hidden = false;
    $("#add-foot").hidden = false;
    $("#add-back").hidden = existing;
    $("#del-review").hidden = DEMO || !A.review;
    $("#manual-name-field").hidden = !A.manual;
    $("#f-cat").closest("fieldset").hidden = existing;
    const cat = p.category || "other";
    $("#chosen").innerHTML = `<span class="c-ic" style="background:var(--cat-${cat})">${IC.pin}</span>
      <div><b>${esc(A.manual ? "Dropped pin" : p.name)}</b><span>${esc(p.address || [p.city, p.country].filter(Boolean).join(", ") || (p.lat.toFixed(4) + ", " + p.lng.toFixed(4)))}</span></div>`;
    setRadio("cat", existing ? p.category : (p.category || ""));
    const r = A.review;
    setRadio("rating", r ? r.rating : "");
    $("#rate-word").textContent = RATING_WORDS[r ? r.rating : 0];
    setRadio("price", r && r.price ? r.price : "");
    $("#f-month").value = (r && r.visited_month) || "";
    const now = new Date();
    $("#f-month").max = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    $("#f-body").value = (r && r.body) || "";
    $("#f-tip").value = (r && r.tip) || "";
    $("#f-name").value = A.manual ? (p.name || "") : "";
    setTimeout(() => (A.manual ? $("#f-name") : $("#rate-1")).focus(), 30);
  }

  const placeSearch = debounce(async q => {
    q = q.trim();
    const ul = $("#place-results");
    if (A.ctl) A.ctl.abort();
    if (q.length < 2) { ul.innerHTML = ""; return; }
    const ctl = new AbortController(); A.ctl = ctl;
    ul.innerHTML = `<li class="s-empty">Searching…</li>`;
    try {
      const [lat, lon] = A._near || [];
      const res = await fetch(photonUrl(CFG.searchUrl, { q, limit: 8, lang: "en", lat: lat && lat.toFixed(4), lon: lon && lon.toFixed(4) }), { signal: ctl.signal });
      if (!res.ok) throw new Error("search " + res.status);
      const data = await res.json();
      A.results = (data.features || []).filter(f => f.geometry && f.properties).map(featureToCandidate).filter(c => c.name);
      ul.innerHTML = A.results.map((c, i) => `<li tabindex="0" data-i="${i}">
          <span class="c-ic" style="background:var(--cat-${c.category});width:32px;height:32px;border-radius:50%;display:grid;place-items:center;color:#fff;flex:none">${IC.pin}</span>
          <span><span class="s-name">${esc(c.name)}</span><br><span class="s-sub">${esc(c.address || [c.city, c.country].filter(Boolean).join(", "))}</span></span></li>`).join("")
        || `<li class="s-empty">Nothing found. Try the full name, or drop a pin on the map.</li>`;
    } catch (e) {
      if (e.name === "AbortError") return;
      ul.innerHTML = `<li class="s-empty">Search isn't available right now. You can drop a pin on the map instead.</li>`;
    }
  }, 300);
  $("#place-q").addEventListener("input", ev => placeSearch(ev.target.value));
  function chooseResult(i) {
    const c = A.results[i];
    if (!c) return;
    const existing = c.source_ref && S.places.find(p => p.source_ref === c.source_ref);
    if (existing) { A.place = existing; A.review = existing.reviews.find(r => isMe(r.user_id)) || null; }
    else A.place = c;
    A.manual = false;
    showDetails();
  }
  $("#place-results").addEventListener("click", ev => { const li = ev.target.closest("li[data-i]"); if (li) chooseResult(Number(li.dataset.i)); });
  $("#place-results").addEventListener("keydown", ev => { const li = ev.target.closest("li[data-i]"); if (li && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); chooseResult(Number(li.dataset.i)); } });

  // drop a pin
  $("#drop-pin").addEventListener("click", () => {
    addDlg.close();
    document.body.classList.add("picking");
    $("#pin-banner").hidden = false;
    map.once("click", onPick);
  });
  $("#pin-cancel").addEventListener("click", () => { stopPicking(); map.off("click", onPick); addDlg.showModal(); });
  function stopPicking() { document.body.classList.remove("picking"); $("#pin-banner").hidden = true; }
  async function onPick(ev) {
    stopPicking();
    const { lat, lng } = ev.latlng.wrap();
    A.place = { name: "", address: "", city: "", country: "", lat, lng, source_ref: null, category: "" };
    A.manual = true;
    A.review = null;
    addDlg.showModal();
    showDetails();
    try {
      const res = await fetch(photonUrl(CFG.reverseUrl, { lat: lat.toFixed(6), lon: lng.toFixed(6), lang: "en" }));
      const data = await res.json();
      const f = (data.features || [])[0];
      if (f && A.manual && A.place && A.place.lat === lat) {
        const c = featureToCandidate(f);
        A.place.city = c.city; A.place.country = c.country; A.place.address = c.address;
        $("#chosen span:last-child").textContent = c.address || [c.city, c.country].filter(Boolean).join(", ");
      }
    } catch (e) { /* the pin still saves without an address */ }
  }

  $("#add-back").addEventListener("click", () => { A.place = null; A.review = null; A.manual = false; showFind(); $("#place-q").focus(); });
  $$("[data-close]", addDlg).forEach(b => b.addEventListener("click", () => addDlg.close()));
  $("#del-review").addEventListener("click", () => { $("#add-foot").hidden = true; $("#del-confirm").hidden = false; $("#del-no").focus(); });
  $("#del-no").addEventListener("click", () => { $("#del-confirm").hidden = true; $("#add-foot").hidden = false; });
  $("#del-yes").addEventListener("click", async () => {
    const btn = $("#del-yes"); btn.disabled = true;
    try {
      const { error } = await sb.from("reviews").delete().eq("id", A.review.id);
      if (error) throw error;
      addDlg.close();
      await refresh();
      toast("Review deleted");
    } catch (e) {
      $("#del-confirm").hidden = true; $("#add-foot").hidden = false;
      addError(friendly(e, "Couldn't delete the review. Try again."));
    } finally { btn.disabled = false; }
  });

  $("#add-form").addEventListener("submit", async ev => {
    ev.preventDefault();
    if ($("#add-step-details").hidden) return;
    if (DEMO) { addError("Demo mode uses sample data. Open the main site and sign in to save your own places."); return; }
    const p = A.place, cid = S.circleId, session = sessionVersion;
    const save = $("#add-save");
    if (!p || save.disabled) return;
    const existing = !!p.id;
    const rating = Number(radio("rating")) || 0;
    const category = existing ? p.category : radio("cat");
    const name = A.manual ? $("#f-name").value.trim().replace(/\s+/g, " ") : p.name;
    const missing = [];
    if (A.manual && !name) missing.push("the place name");
    if (!category) missing.push("the type");
    if (!rating) missing.push("your rating");
    if (missing.length) { addError("Add " + missing.join(" and ") + " to save."); return; }
    const wasEdit = !!A.review;
    const review = {
      user_id: S.user.id, rating, price: Number(radio("price")) || null,
      visited_month: /^\d{4}-\d{2}$/.test($("#f-month").value) ? $("#f-month").value : null,
      body: $("#f-body").value.trim() || null,
      tip: $("#f-tip").value.trim().replace(/\s+/g, " ") || null
    };
    save.disabled = true; save.textContent = "Saving…";
    addError("");
    try {
      let placeId = p.id || p.savedId || null;
      if (!placeId && p.source_ref) {
        const { data, error } = await sb.from("places").select("id").eq("circle_id", cid).eq("source_ref", p.source_ref).maybeSingle();
        if (session !== sessionVersion) return;
        if (error) throw error;
        if (data) placeId = data.id;
      }
      if (!placeId) {
        const row = {
          circle_id: cid, name: name.slice(0, 120), category,
          address: p.address || null, city: p.city || null, country: p.country || null,
          lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)), source_ref: p.source_ref || null
        };
        const { data, error } = await sb.from("places").insert(row).select("id").single();
        if (error && error.code === "23505" && p.source_ref) {
          const again = await sb.from("places").select("id").eq("circle_id", cid).eq("source_ref", p.source_ref).single();
          if (again.error) throw again.error;
          placeId = again.data.id;
        } else if (error) throw error;
        else placeId = data.id;
      }
      if (session !== sessionVersion) return;
      p.savedId = placeId;
      const { error } = await sb.from("reviews").upsert({ ...review, place_id: placeId }, { onConflict: "place_id,user_id" });
      if (error) throw error;
      if (session !== sessionVersion || cid !== S.circleId) return;
      if (A.place === p) addDlg.close();
      if (S.mode === "friend" && !isMe(S.friendId)) { S.mode = "city"; S.friendId = null; }
      await refresh();
      const saved = S.places.find(x => x.id === placeId);
      if (saved) {
        if (!(S.city && inCity(saved, S.city))) {
          const g = cityGroups().find(g2 => g2.places.some(x => x.id === placeId));
          if (g) openCityFromGroup(g);
        } else render();
        setTimeout(() => {
          if (session !== sessionVersion || cid !== S.circleId) return;
          selectPlace(placeId, { fly: true }); pulsePlace(placeId);
        }, reduceMotion() ? 0 : 950);
      }
      toast(wasEdit ? "Review updated" : "Saved. Your friends can see it now.");
    } catch (e) {
      if (session === sessionVersion && A.place === p) addError(friendly(e, "Couldn't save. Try again."));
    } finally {
      save.disabled = false; save.textContent = "Save";
    }
  });

  // ---------- invite ----------
  const inviteDlg = $("#invite-dialog");
  function inviteUrl(code) { return location.origin + location.pathname + "?join=" + encodeURIComponent(code); }
  function openInvite() {
    if (DEMO) { toast("Sign in to invite friends to your own circle."); return; }
    const c = currentCircle();
    if (!c) return;
    $("#invite-circle").textContent = c.name;
    $("#invite-link").value = inviteUrl(c.invite_code);
    $("#invite-reset").hidden = c.owner_id !== S.user.id;
    inviteDlg.showModal();
    $("#invite-link").select();
  }
  $("#invite-copy").addEventListener("click", async () => {
    const v = $("#invite-link").value;
    try { await navigator.clipboard.writeText(v); toast("Invite link copied"); }
    catch (e) { $("#invite-link").select(); toast("Press Ctrl+C to copy the link"); }
  });
  $("#invite-reset").addEventListener("click", async () => {
    try {
      const { data, error } = await sb.rpc("reset_invite_code", { circle: S.circleId });
      if (error) throw error;
      const c = currentCircle(); c.invite_code = data;
      $("#invite-link").value = inviteUrl(data);
      toast("New link made. The old link no longer works.");
    } catch (e) { toast(friendly(e, "Couldn't make a new link.")); }
  });
  $$("[data-close]", inviteDlg).forEach(b => b.addEventListener("click", () => inviteDlg.close()));

  // ---------- text prompt ----------
  const textDlg = $("#text-dialog");
  let textSave = null;
  function askText(o) {
    $("#text-title").textContent = o.title;
    $("#text-label").textContent = o.label;
    $("#text-input").value = o.value || "";
    $("#text-input").maxLength = o.max || 60;
    $("#text-ok").textContent = o.ok || "Save";
    $("#text-error").hidden = true;
    textSave = o.onSave;
    textDlg.showModal();
    $("#text-input").select();
  }
  $("#text-form").addEventListener("submit", async ev => {
    ev.preventDefault();
    const v = $("#text-input").value.trim().replace(/\s+/g, " ");
    if (!v) { $("#text-error").textContent = "Type something first."; $("#text-error").hidden = false; return; }
    try { await textSave(v); textDlg.close(); }
    catch (e) { $("#text-error").textContent = friendly(e); $("#text-error").hidden = false; }
  });
  $$("[data-close]", textDlg).forEach(b => b.addEventListener("click", () => textDlg.close()));

  // ---------- globe view (js/globe.js, loaded the first time it's opened) ----------
  $("#globe-btn").addEventListener("click", () => openGlobeView(null));
  async function openGlobeView(friendId) {
    const btn = $("#globe-btn");
    if (btn.disabled) return;
    btn.disabled = true;
    try {
      const { openGlobe } = await import(new URL("js/globe.js", location.href).href);
      const c = myCountry();
      openGlobe({
        title: (currentCircle() || {}).name || "Your circle",
        places: S.places, cities: cityGroups(), ranked: topTravelled(), startFriend: friendId,
        homeCountry: c,
        esc, plural, avatar, starsHTML, nameOf, colorFor, reduced: reduceMotion(),
        logo: IC.logo, mapIcon: IC.pin,
        closeIcon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>',
        photoUrls, openPhotos, budgetHTML: key => budgetHTML(key, false),
        onOpenCity: openCityFromGroup
      });
    } catch (e) {
      console.error(e);
      toast("Couldn't open the globe. Your browser may not support 3D, or the connection dropped.");
    } finally { btn.disabled = false; }
  }

  // ---------- account menu ----------
  const meBtn = $("#me-btn"), meMenu = $("#me-menu");
  function renderMe() {
    const name = (S.profile && S.profile.display_name) || "";
    meBtn.style.background = colorFor(S.user.id);
    meBtn.textContent = initials(name || S.user.email);
    meBtn.title = name;
    if (DEMO) {
      meMenu.innerHTML = `<div class="menu-head"><b>Demo mode</b><span>Explore MyCircle with sample data</span></div>
        <button type="button" role="menuitem" data-m="country">Change demo country</button>
        <button type="button" role="menuitem" data-m="leave-demo">Go to sign-in</button>`;
      return;
    }
    meMenu.innerHTML = `
      <div class="menu-head"><b>${esc(name)}</b><span>${esc(S.user.email || "")}</span></div>
      ${S.circles.length > 1 ? `<p class="menu-label">Your circles</p>` + S.circles.map(c =>
        `<button type="button" role="menuitemradio" aria-checked="${c.id === S.circleId}" data-circle="${esc(c.id)}">${esc(c.name)}</button>`).join("") + `<hr>` : ""}
      <button type="button" role="menuitem" data-m="invite">Invite friends to ${esc((currentCircle() || {}).name || "your circle")}</button>
      <button type="button" role="menuitem" data-m="new">Start another circle</button>
      <button type="button" role="menuitem" data-m="name">Change your name</button>
      <button type="button" role="menuitem" data-m="country">Change country</button>
      <hr>
      <button type="button" role="menuitem" data-m="out">Sign out</button>`;
  }
  meBtn.addEventListener("click", ev => { ev.stopPropagation(); const open = meMenu.hidden; meMenu.hidden = !open; meBtn.setAttribute("aria-expanded", String(open)); });
  document.addEventListener("click", ev => { if (!ev.target.closest("#me-menu")) { meMenu.hidden = true; meBtn.setAttribute("aria-expanded", "false"); } });
  document.addEventListener("keydown", ev => { if (ev.key === "Escape") { meMenu.hidden = true; closeSuggest(); } });
  meMenu.addEventListener("click", async ev => {
    const b = ev.target.closest("button");
    if (!b) return;
    meMenu.hidden = true;
    if (b.dataset.m === "leave-demo") {
      location.assign(location.pathname);
      return;
    }
    if (b.dataset.circle) {
      try { await switchCircle(b.dataset.circle); }
      catch (e) { toast(friendly(e, "Couldn't switch circles. Try again.")); }
      return;
    }
    const m = b.dataset.m;
    if (m === "invite") openInvite();
    if (m === "country") showCountryStep(true);
    if (m === "out") {
      const { error } = await sb.auth.signOut();
      if (error) toast(friendly(error, "Couldn't sign out. Try again."));
    }
    if (m === "name") askText({
      title: "Change your name", label: "Name your friends see", value: S.profile.display_name, max: 40,
      onSave: async v => {
        const { error } = await sb.from("profiles").update({ display_name: v }).eq("id", S.user.id);
        if (error) throw error;
        S.profile.display_name = v; await refresh(); renderMe(); toast("Name updated");
      }
    });
    if (m === "new") askText({
      title: "Start another circle", label: "Circle name", value: "", ok: "Create", max: 60,
      onSave: async v => {
        const { data, error } = await sb.rpc("create_circle", { circle_name: v });
        if (error) throw error;
        if (await loadCircles() && await switchCircle(data)) openInvite();
      }
    });
  });
  let switchingCircle = false;
  async function switchCircle(id) {
    if (switchingCircle || id === S.circleId) return false;
    switchingCircle = true;
    meBtn.disabled = true;
    try {
      const data = await loadCircleData(id);
      if (!data) return false;
      for (const dialog of [addDlg, budgetDlg, photoDlg, inviteDlg]) dialog.close();
      stopPicking();
      map.off("click", onPick);
      refreshRequest++;
      applyCircleData(id, data);
      store.set(CIRCLE_KEY, id);
      renderMe();
      goHome();
      return true;
    } finally {
      switchingCircle = false;
      meBtn.disabled = false;
    }
  }

  $("#add-btn").addEventListener("click", () => openAdd({}));

  let refreshRequest = 0;
  async function refresh() {
    if (DEMO || !S.loaded) return;
    const cid = S.circleId, session = sessionVersion, request = ++refreshRequest;
    const isCurrent = () => cid === S.circleId && session === sessionVersion && request === refreshRequest;
    try {
      const data = await loadCircleData(cid);
      if (!data || !isCurrent()) return;
      applyCircleData(cid, data);
      if (S.friendId && !S.members.has(S.friendId) && !S.places.some(p => p.reviews.some(r => r.user_id === S.friendId))) { S.mode = "city"; S.friendId = null; }
      if (S.selId && !S.places.some(p => p.id === S.selId)) S.selId = null;
      render();
    } catch (e) { if (isCurrent()) toast(friendly(e, "Couldn't refresh. Try again in a moment.")); }
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && S.loaded && Date.now() - S.lastRefresh > 30000 && !addDlg.open) refresh();
  });


  // ---------- country: asked once at first sign-in; tints the app and drives the coverage card ----------
  const MC = window.MCCountry;
  const darkMode = matchMedia("(prefers-color-scheme: dark)");
  function myCountry() { return MC && S.user && S.user.user_metadata ? MC.get(S.user.user_metadata.country) : null; }
  function applyCountryTheme() {
    const root = document.documentElement.style, c = myCountry();
    const props = ["--sky", "--head-wash", "--map-rot", "--map-sepia", "--map-bg"];
    if (!c || darkMode.matches) { props.forEach(p => root.removeProperty(p)); return; }
    const h = MC.hue(c.c), h2 = (h + 50) % 360, h3 = (h + 30) % 360;
    root.setProperty("--sky", `radial-gradient(90% 70% at 100% 0%, hsl(${h} 100% 92%) 0%, transparent 60%), radial-gradient(80% 60% at 0% 100%, hsl(${h2} 100% 93%) 0%, transparent 60%), linear-gradient(180deg, hsl(${h} 80% 94%) 0%, hsl(${h} 70% 98%) 55%, hsl(${h3} 90% 96%) 100%)`);
    root.setProperty("--head-wash", `hsl(${h} 90% 93%)`);
    root.setProperty("--map-rot", (h - 35) + "deg");
    root.setProperty("--map-sepia", ".3");
    root.setProperty("--map-bg", `hsl(${h} 55% 93%)`);
  }
  darkMode.addEventListener("change", applyCountryTheme);
  function guessCountry() {
    try {
      const region = (navigator.language || "").split("-")[1];
      return region && MC.byName(new Intl.DisplayNames(["en"], { type: "region" }).of(region.toUpperCase()));
    } catch (e) { return null; }
  }
  async function saveCountry(code) {
    if (DEMO) { S.user.user_metadata = Object.assign({}, S.user.user_metadata, { country: code }); }
    else {
      const { data, error } = await sb.auth.updateUser({ data: { country: code } });
      if (error) throw error;
      S.user = data.user;
    }
    applyCountryTheme();
  }
  function showCountryStep(changing) {
    const guess = changing ? myCountry() : guessCountry();
    showGate(`<h1>${changing ? "Change your country" : "Which country are you from?"}</h1>
      <p>MyCircle takes on your country's colours, and shows how much of it (and of the world) you've covered.</p>
      <form id="g-country" novalidate>
        <label class="field-label" for="g-country-in">Country</label>
        <input id="g-country-in" class="input" list="g-countries" autocomplete="off" placeholder="Start typing…" value="${esc(guess ? guess.n : "")}">
        <datalist id="g-countries">${MC.list.map(c => `<option value="${esc(c.n)}"></option>`).join("")}</datalist>
        <p class="form-error" role="alert" hidden></p>
        <button class="btn btn-primary" type="submit">Continue</button>
        ${changing ? `<button class="btn btn-text" type="button" id="g-cancel">Cancel</button>` : ""}
      </form>`);
    const input = $("#g-country-in");
    input.select();
    if (changing) $("#g-cancel").addEventListener("click", () => { hideGate(); renderMe(); });
    $("#g-country").addEventListener("submit", async ev => {
      ev.preventDefault();
      const c = MC.byName(input.value);
      if (!c) { gateError("Pick a country from the list."); return; }
      const btn = ev.target.querySelector(".btn-primary"); btn.disabled = true;
      try { await saveCountry(c.c); }
      catch (e) { btn.disabled = false; gateError(friendly(e, "Couldn't save your country. Try again.")); return; }
      if (DEMO) { hideGate(); renderMe(); render(); fitAll(); return; }
      if (changing) { hideGate(); renderMe(); render(); fitAll(); return; }
      await afterProfile();
    });
  }
  const pctText = v => v <= 0 ? "0%" : v < 10 ? v.toFixed(1) + "%" : Math.round(v) + "%";
  // Coverage counts the places you have reviewed: land within ~100 km of one, and countries with at least one.
  function passportHTML() {
    const c = myCountry();
    if (!c) return "";
    const mine = S.places.filter(p => p.reviews.some(r => isMe(r.user_id)));
    const key = mine.map(p => p.id).join() + "|" + c.c;
    if (!S._cov || S._cov.key !== key) {
      const seen = new Set();
      mine.forEach(p => { const k = MC.countryAt(p.lat, p.lng); if (k && k.real) seen.add(k.c); });
      S._cov = { key, home: MC.coverage(c, mine, 100).pct, seen: seen.size };
    }
    const world = S._cov.seen / MC.total * 100;
    return `<section class="passport" aria-label="Your coverage">
      <div class="pass-row"><div class="ring" style="--p:${S._cov.home.toFixed(2)}"><b>${pctText(S._cov.home)}</b></div>
        <div><b>${esc(c.n)}</b><span>of the land is within about 100 km of a place you've been</span></div></div>
      <div class="pass-row"><div class="ring ring-world" style="--p:${world.toFixed(2)}"><b>${pctText(world)}</b></div>
        <div><b>The world</b><span>${S._cov.seen} of ${MC.total} countries visited</span></div></div>
      <p class="pass-note">Counts the places you've reviewed.</p></section>`;
  }


  // ---------- completed areas: mark a country, state or city as done and see it in red ----------
  // The list (a few bytes each) rides on the sign-in account; outlines are fetched from OpenStreetMap
  // (Nominatim) when needed and cached on this device.
  const DONE = { list: [], geo: new Map(), loadedFor: null };
  const DONE_MAX = 40;
  map.createPane("done"); map.getPane("done").style.zIndex = 250;
  const doneLayer = L.layerGroup().addTo(map);
  const doneKey = a => a.osm && a.osm[0] === "R" ? a.osm : "q:" + norm(a.name) + "|" + norm(a.sub || "");
  const doneStoreKey = () => "mycircle.done." + (S.user ? S.user.id : "anon");
  const isDone = a => !!a && DONE.list.some(d => d.k === doneKey(a));
  const NOMINATIM = "https://nominatim.openstreetmap.org";
  async function fetchOutline(a) {
    const common = "format=jsonv2&polygon_geojson=1&polygon_threshold=0.005";
    const kind = { country: "country", state: "state", city: "city", town: "city", village: "settlement" }[a.type];
    const url = a.osm && a.osm[0] === "R"
      ? `${NOMINATIM}/lookup?osm_ids=${a.osm}&${common}`
      : `${NOMINATIM}/search?${common}&limit=1&q=${encodeURIComponent([a.name, a.sub].filter(Boolean).join(", "))}${kind ? "&featuretype=" + kind : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("outline " + res.status);
    const item = (await res.json())[0];
    const g = item && item.geojson;
    if (g && (g.type === "Polygon" || g.type === "MultiPolygon")) return g;
    if (a.bbox && Math.max(a.bbox[2] - a.bbox[0], a.bbox[3] - a.bbox[1]) < 2) { // a city known only as a point: use its box
      const [s0, w0, n0, e0] = a.bbox;
      return { type: "Polygon", coordinates: [[[w0, s0], [e0, s0], [e0, n0], [w0, n0], [w0, s0]]] };
    }
    throw new Error("no outline");
  }
  async function outlineFor(rec) {
    if (DONE.geo.has(rec.k)) return DONE.geo.get(rec.k);
    const cached = store.get("mycircle.geo." + rec.k, null);
    if (cached) { DONE.geo.set(rec.k, cached); return cached; }
    const g = await fetchOutline({ osm: rec.k[0] === "R" ? rec.k : null, name: rec.n, sub: rec.s, type: rec.t, bbox: rec.b });
    DONE.geo.set(rec.k, g);
    store.set("mycircle.geo." + rec.k, g);
    return g;
  }
  function drawDone() {
    doneLayer.clearLayers();
    for (const rec of DONE.list) {
      const g = DONE.geo.get(rec.k);
      if (!g) continue;
      L.geoJSON(g, { pane: "done", interactive: false, style: { color: "#d62839", weight: 2, opacity: .85, fillColor: "#e5383b", fillOpacity: .3 } }).addTo(doneLayer);
    }
  }
  async function loadDone() {
    if (!S.user || DONE.loadedFor === S.user.id) return;
    DONE.loadedFor = S.user.id;
    const meta = S.user.user_metadata && S.user.user_metadata.completed;
    DONE.list = Array.isArray(meta) ? meta.slice(0, DONE_MAX) : store.get(doneStoreKey(), []);
    drawDone();
    for (const rec of DONE.list) { // fetch missing outlines gently (the service asks for about one request a second)
      if (DONE.geo.has(rec.k) || store.get("mycircle.geo." + rec.k, null)) { try { await outlineFor(rec); } catch (e) { /* ignore */ } drawDone(); continue; }
      try { await outlineFor(rec); drawDone(); } catch (e) { /* leave it off the map */ }
      await new Promise(r => setTimeout(r, 1100));
    }
    if (S.mode === "home") renderPanel();
  }
  async function saveDone() {
    const list = DONE.list.map(d => ({ k: d.k, n: d.n, s: d.s, t: d.t }));
    store.set(doneStoreKey(), DONE.list);
    if (DEMO) return;
    const { data, error } = await sb.auth.updateUser({ data: { completed: list } });
    if (error) toast("Saved on this device only. " + friendly(error, ""));
    else S.user = data.user;
  }
  async function toggleDone(a) {
    if (!a) return;
    const k = doneKey(a);
    if (isDone(a)) { DONE.list = DONE.list.filter(d => d.k !== k); drawDone(); render(); await saveDone(); toast(a.name + " is no longer marked complete"); return; }
    if (DONE.list.length >= DONE_MAX) { toast("You can mark up to " + DONE_MAX + " areas."); return; }
    toast("Marking " + a.name + "…");
    const rec = { k, n: a.name, s: a.sub || "", t: a.type || "", b: a.bbox };
    try { await outlineFor(rec); }
    catch (e) { toast("Couldn't find the outline of " + a.name + ". Check your connection and try again."); return; }
    DONE.list.push(rec);
    drawDone(); render();
    await saveDone();
    toast(a.name + " is complete");
  }
  function doneBtnHTML() {
    if (!S.city || S.city.name === "This area") return "";
    const on = isDone(S.city);
    return `<button type="button" class="btn-outline done-btn${on ? " is-on" : ""}" data-act="done" aria-pressed="${on}">${on ? "✓ Marked complete · Undo" : "Mark as complete"}</button>`;
  }
  function doneListHTML() {
    if (!DONE.list.length) return "";
    return `<div class="done-list"><span class="done-key"><i></i>Completed</span>${DONE.list.map((d, i) =>
      `<button type="button" class="chip" data-undone="${i}" title="Remove ${esc(d.n)}">${esc(d.n)} <span aria-hidden="true">✕</span><span class="sr">Remove</span></button>`).join("")}</div>`;
  }

  // ---------- sign-in, name and circle setup ----------
  const gate = $("#gate"), gateCard = $("#gate-card");
  let stopLanding = null;
  function showGate(html, landing) {
    if (stopLanding) { stopLanding(); stopLanding = null; }
    gate.hidden = false;
    gate.classList.toggle("landing", !!landing);
    $("#panel").hidden = true; $("#top-right").hidden = true; $("#area-btn").hidden = true;
    gateCard.innerHTML = (landing ? "" : `<div class="gate-brand">${IC.logo}<b>MyCircle</b></div>`) + html;
    const f = gateCard.querySelector("input");
    if (f) setTimeout(() => f.focus(), 30);
  }
  function hideGate() { gate.hidden = true; $("#panel").hidden = false; $("#top-right").hidden = false; }
  function gateError(msg) { const e = gateCard.querySelector(".form-error"); if (e) { e.textContent = msg; e.hidden = !msg; } }

  async function inviteNote() {
    const code = store.get(JOIN_KEY, null);
    if (!code) return "";
    try {
      const { data } = await sb.rpc("circle_preview", { code });
      const c = data && data[0];
      if (c) return `You're invited to join ${c.name} (${plural(Number(c.members), "member")}). Sign in to join.`;
    } catch (e) { /* show the generic note */ }
    return "You've been invited to a circle. Sign in to join.";
  }

  async function sendSignIn(email) {
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter your email address.";
    try {
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
      return error ? friendly(error, "Couldn't send the email. Try again.") : undefined;
    } catch (e) { return friendly(e, "Couldn't send the email. Try again."); }
  }

  const authLinkError = (() => {
    if (DEMO) return "";
    const url = new URL(location.href);
    const fragment = new URLSearchParams(url.hash.slice(1));
    const code = fragment.get("error_code") || url.searchParams.get("error_code");
    if (!code) return "";
    for (const key of ["error", "error_code", "error_description"]) {
      url.searchParams.delete(key);
      fragment.delete(key);
    }
    url.hash = fragment.toString();
    history.replaceState(null, "", url.pathname + url.search + url.hash);
    return code === "otp_expired" ? "This sign-in link expired or has already been used. Request a new one below." : "This sign-in link couldn't be opened. Request a new one below.";
  })();

  // The signed-out screen is the built landing page (landing/dist). It runs in an iframe, so the
  // email goes up as a message, we call Supabase here, and the result goes back down.
  async function showSignIn() {
    const session = sessionVersion;
    const note = inviteNote();
    if (authLinkError) { showPlainSignIn(note, authLinkError); return; }
    showGate('<p class="muted">Loading MyCircle…</p>');
    const landingUrl = "landing/dist/index.html";
    const probe = new AbortController();
    const probeTimer = setTimeout(() => probe.abort(), 3000);
    const hasLanding = await fetch(landingUrl, { method: "HEAD", signal: probe.signal }).then(r => r.ok, () => false);
    clearTimeout(probeTimer);
    if (session !== sessionVersion) return;
    if (!hasLanding) { showPlainSignIn(note); return; }
    showGate(`<iframe class="landing-frame" title="MyCircle: sign in"></iframe>`, true);
    const frame = gateCard.querySelector("iframe");
    const fallback = setTimeout(() => showPlainSignIn(note), 6000);
    let sending = false;
    const listener = async ev => {
      if (ev.origin !== location.origin || ev.source !== frame.contentWindow) return;
      const msg = ev.data || {};
      const reply = m => { if (frame.contentWindow) frame.contentWindow.postMessage(m, location.origin); };
      if (msg.type === "mycircle:ready") {
        clearTimeout(fallback);
        reply({ type: "mycircle:invite", note: await note });
      }
      if (msg.type === "mycircle:signin" && !sending) {
        sending = true;
        const error = await sendSignIn(String(msg.email || "").trim());
        sending = false;
        reply({ type: "mycircle:signin-result", error });
      }
    };
    window.addEventListener("message", listener);
    stopLanding = () => { clearTimeout(fallback); window.removeEventListener("message", listener); };
    frame.src = landingUrl;
  }

  function showPlainSignIn(invitation, linkError) {
    showGate(`<h1>Places your friends have actually been</h1>
      <p id="g-invite-note" hidden></p>
      <p>Sign in with your email. We'll send you a link, no password needed.</p>
      <form id="g-signin" novalidate>
        <label class="field-label" for="g-email">Email</label>
        <input id="g-email" class="input" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" required>
        <p class="form-error" role="alert" hidden></p>
        <button class="btn btn-primary" type="submit">Email me a sign-in link</button>
      </form>`);
    if (linkError) gateError(linkError);
    const note = $("#g-invite-note");
    invitation.then(message => { if (message) { note.textContent = message; note.hidden = false; } });
    $("#g-signin").addEventListener("submit", async ev => {
      ev.preventDefault();
      const email = $("#g-email").value.trim(), btn = ev.target.querySelector("button");
      if (btn.disabled) return;
      btn.disabled = true;
      const error = await sendSignIn(email);
      if (!btn.isConnected) return;
      btn.disabled = false;
      if (error) { gateError(error); return; }
      showGate(`<h1>Check your email</h1><p>We sent a sign-in link to <b>${esc(email)}</b>. Open it on this device.</p>
        <button class="btn btn-text" type="button" id="g-email-back">Use a different email or resend</button>`);
      $("#g-email-back").addEventListener("click", () => { showPlainSignIn(invitation); $("#g-email").value = email; });
    });
  }

  function showNameStep() {
    showGate(`<h1>What should friends call you?</h1>
      <p>This name appears next to your reviews.</p>
      <form id="g-name" novalidate>
        <label class="field-label" for="g-name-in">Your name</label>
        <input id="g-name-in" class="input" maxlength="40" autocomplete="name" required>
        <p class="form-error" role="alert" hidden></p>
        <button class="btn btn-primary" type="submit">Continue</button>
      </form>`);
    $("#g-name").addEventListener("submit", async ev => {
      ev.preventDefault();
      const v = $("#g-name-in").value.trim().replace(/\s+/g, " ");
      if (!v) { gateError("Enter your name."); return; }
      const { data, error } = await sb.from("profiles").insert({ id: S.user.id, display_name: v }).select("id, display_name").single();
      if (error) { gateError(friendly(error, "Couldn't save your name. Try again.")); return; }
      S.profile = data;
      await afterProfile();
    });
  }

  function extractCode(v) {
    v = v.trim();
    try { const u = new URL(v); return u.searchParams.get("join") || ""; } catch (e) { return v; }
  }
  function showCircleStep() {
    const first = ((S.profile && S.profile.display_name) || "").split(" ")[0];
    showGate(`<h1>Start your circle</h1>
      <p>A circle is your group of close friends. Only people in it can see its places and reviews.</p>
      <form id="g-create" novalidate>
        <label class="field-label" for="g-circle">Circle name</label>
        <input id="g-circle" class="input" maxlength="60" value="${esc(first ? first + "'s friends" : "")}">
        <button class="btn btn-primary" type="submit">Create circle</button>
      </form>
      <p class="gate-sep">or</p>
      <form id="g-join" novalidate>
        <label class="field-label" for="g-code">Join a friend's circle</label>
        <input id="g-code" class="input" placeholder="Paste the invite link">
        <button class="btn btn-text" type="submit">Join</button>
      </form>
      <p class="form-error" role="alert" hidden></p>`);
    $("#g-create").addEventListener("submit", async ev => {
      ev.preventDefault();
      const v = $("#g-circle").value.trim();
      if (!v) { gateError("Give your circle a name."); return; }
      const { data, error } = await sb.rpc("create_circle", { circle_name: v });
      if (error) { gateError(friendly(error, "Couldn't create the circle. Try again.")); return; }
      S.circleId = data; store.set(CIRCLE_KEY, data);
      await afterProfile();
    });
    $("#g-join").addEventListener("submit", async ev => {
      ev.preventDefault();
      const code = extractCode($("#g-code").value);
      if (!code) { gateError("Paste the invite link your friend sent you."); return; }
      store.set(JOIN_KEY, code);
      await afterProfile();
    });
  }

  async function afterProfile() {
    const session = sessionVersion;
    applyCountryTheme();
    if (!myCountry()) { showCountryStep(false); return; }
    showGate(`<p class="muted">Loading your circle…</p>`);
    try {
      const code = store.get(JOIN_KEY, null);
      if (code) {
        const { data, error } = await sb.rpc("join_circle", { code });
        if (session !== sessionVersion) return;
        if (error && !/invite link is not valid/i.test(error.message || "")) throw error;
        store.del(JOIN_KEY);
        if (error) toast(friendly(error, "Couldn't join the circle."));
        else { S.circleId = data; store.set(CIRCLE_KEY, data); toast("You joined the circle"); }
      }
      if (!await loadCircles()) return;
      if (!S.circles.length) { showCircleStep(); return; }
      const cid = S.circleId;
      const data = await loadCircleData(cid);
      if (!data) return;
      applyCircleData(cid, data);
      store.set(CIRCLE_KEY, cid);
      hideGate();
      renderMe();
      goHome({ fly: false });
      fitAll();
      loadDone();
    } catch (e) {
      if (session !== sessionVersion) return;
      showGate(`<h1>Couldn't load MyCircle</h1><p>${esc(friendly(e))}</p><button type="button" class="btn btn-primary" id="g-retry">Try again</button>`);
      $("#g-retry").addEventListener("click", afterProfile);
    }
  }

  async function onSession(session, retry = false) {
    const uid = session && session.user ? session.user.id : null;
    if (!retry && sessionVersion && uid === (S.user?.id || null)) { S.user = session?.user || null; return; }
    const version = ++sessionVersion;
    if (S.user && S.user.id !== uid) { location.reload(); return; }
    S.user = session ? session.user : null;
    S.profile = null; S.loaded = false; S.places = []; S.circles = [];
    layer.clearLayers();
    if (!S.user) { showSignIn(); return; }
    showGate(`<p class="muted">Signing you in…</p>`);
    const { data, error } = await sb.from("profiles").select("id, display_name").eq("id", S.user.id).maybeSingle();
    if (version !== sessionVersion) return;
    if (error) {
      showGate(`<h1>Couldn't load MyCircle</h1><p>${esc(friendly(error))}</p><button type="button" class="btn btn-primary" id="g-retry">Try again</button>`);
      $("#g-retry").addEventListener("click", () => onSession(session, true));
      return;
    }
    if (!data) { showNameStep(); return; }
    S.profile = data;
    await afterProfile();
  }

  if (DEMO) {
    S.user = DEMO.user; S.profile = DEMO.profile; S.circles = DEMO.circles; S.circleId = DEMO.circles[0].id;
    S.members = new Map(DEMO.members.map(m => [m.id, m]));
    S.places = DEMO.places.map(cleanPlace); S.trips = DEMO.trips || []; S.loaded = true;
    applyCountryTheme();
    hideGate(); renderMe(); goHome({ fly: false }); fitAll(); loadDone();
    if (new URLSearchParams(location.search).has("pickcountry")) { S.user.user_metadata = {}; applyCountryTheme(); showCountryStep(false); }
  } else {
    sb.auth.onAuthStateChange((_event, session) => { setTimeout(() => onSession(session), 0); });
  }
})();

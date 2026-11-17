// Globe view: the circle's cities on a 3D globe, with floating panels around it.
// Pillars grow with the number of places, arcs fly from your home country (or follow one friend's trips),
// and every position is computed here from latitude/longitude, nothing is a canned animation.
// app.js loads this file with import() the first time someone opens the globe, so three.js only downloads then.
import * as THREE from "../vendor/three/three.module.js";

const DEG = Math.PI / 180;
const UP = new THREE.Vector3(0, 1, 0);
const MAX_LABELS = 30;
let landCache = null;

function toVec(lat, lng, r = 1) {
  const phi = (90 - lat) * DEG, th = (lng + 180) * DEG;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}
// Globe rotation that turns (lat, lng) to face the camera.
function facing(lat, lng) { return { rx: Math.max(-1.2, Math.min(1.2, lat * DEG)), ry: (-90 - lng) * DEG }; }
function wrap(a) { return ((a % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI; }
function ease(rate, dt) { return 1 - Math.exp(-rate * dt); }

// Land as a grid of dots, sampled from the bundled country outlines (about 15k points, computed once).
function landDots() {
  if (landCache) return landCache;
  const MC = window.MCCountry, out = [];
  for (let lat = -56; lat <= 78; lat += 1.3) {
    const step = 1.3 / Math.max(0.25, Math.cos(lat * DEG));
    for (let lng = -180; lng < 180; lng += step)
      if (MC.list.some(c => MC.inCountry(c, lat, lng))) out.push(lat, lng);
  }
  return (landCache = out);
}
// Home: middle of the country's biggest landmass (the bounding box of the USA, say, runs out to the Aleutians).
function homePoint(country) {
  const area = r => { let a = 0; for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) a += (r[j] + r[i]) * (r[j + 1] - r[i + 1]); return Math.abs(a); };
  const ring = country.g.map(p => p[0]).sort((a, b) => area(b) - area(a))[0];
  let w = 180, e = -180, s = 90, n = -90;
  for (let i = 0; i < ring.length; i += 2) { w = Math.min(w, ring[i]); e = Math.max(e, ring[i]); s = Math.min(s, ring[i + 1]); n = Math.max(n, ring[i + 1]); }
  return [(s + n) / 2, (w + e) / 2];
}
// Great-circle arc between two points, lifted off the surface in proportion to its length.
function arcPoints(a, b) {
  const va = toVec(a[0], a[1]), vb = toVec(b[0], b[1]);
  const ang = va.angleTo(vb), lift = 0.03 + ang * 0.16, pts = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64, s = Math.sin(ang);
    const p = s < 1e-6 ? va.clone() : va.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).add(vb.clone().multiplyScalar(Math.sin(t * ang) / s));
    pts.push(p.multiplyScalar(1.003 + lift * Math.sin(Math.PI * t)));
  }
  return pts;
}

export function openGlobe(ctx) {
  const { esc, plural, avatar, starsHTML, nameOf, colorFor, reduced } = ctx;
  const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
  const cities = ctx.cities, places = ctx.places;
  const css = getComputedStyle(document.documentElement);
  const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  const C = {
    accent: new THREE.Color(v("--accent", "#3b63da")), arc: new THREE.Color(v("--accent-dark", "#2f52c0")),
    ocean: new THREE.Color(v("--surface", "#ffffff")), ink: new THREE.Color(v("--ink", "#080e2b")),
    star: new THREE.Color(v("--star", "#e09a10")), glow: new THREE.Color(v("--accent", "#3b63da"))
  };

  // ---------- renderer (created first, so a missing WebGL fails before anything is shown) ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  scene.add(new THREE.HemisphereLight(0xffffff, C.ink.clone().lerp(new THREE.Color(0xffffff), 0.6), 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-2, 3, 4);
  scene.add(sun);

  const globe = new THREE.Group();
  scene.add(globe);
  const ocean = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), new THREE.MeshStandardMaterial({ color: C.ocean, roughness: 0.9 }));
  globe.add(ocean);

  const land = landDots(), pos = new Float32Array(land.length / 2 * 3);
  for (let i = 0; i < land.length; i += 2) toVec(land[i], land[i + 1], 1.002).toArray(pos, i / 2 * 3);
  const landGeo = new THREE.BufferGeometry();
  landGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  // Round dots that fade out as they turn towards the horizon, so none poke out past the globe's edge.
  const landMat = new THREE.ShaderMaterial({
    uniforms: { c: { value: C.accent }, size: { value: 0.042 }, scale: { value: 400 } },
    vertexShader: "uniform float size; uniform float scale; varying float f; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); f = dot(normalize(normalMatrix * position), normalize(-mv.xyz)); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform vec3 c; varying float f; void main(){ if (f < 0.0 || length(gl_PointCoord - 0.5) > 0.5) discard; gl_FragColor = vec4(c, 0.8 * smoothstep(0.0, 0.3, f));\n#include <colorspace_fragment>\n}",
    transparent: true, depthWrite: false
  });
  globe.add(new THREE.Points(landGeo, landMat));

  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.09, 48, 48), new THREE.ShaderMaterial({
    uniforms: { c: { value: C.glow } },
    vertexShader: "varying vec3 n; void main(){ n = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 c; varying vec3 n; void main(){ float i = pow(max(0.0, 0.62 - dot(n, vec3(0.0, 0.0, 1.0))), 3.0); gl_FragColor = vec4(c, clamp(i, 0.0, 1.0) * 0.35); }",
    side: THREE.BackSide, transparent: true, depthWrite: false
  }));
  scene.add(atmo);

  // ---------- cities: a pillar per city, taller with more places ----------
  const stemGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 1, 8).translate(0, 0.5, 0);
  const headGeo = new THREE.SphereGeometry(0.017, 16, 16);
  const hitGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const labels = document.createElement("div");
  labels.className = "g-labels";
  const items = cities.map((g, i) => {
    const n = toVec(g.lat, g.lng).normalize();
    const h = 0.05 + Math.min(0.24, 0.035 * g.places.length);
    const mat = new THREE.MeshStandardMaterial({ color: C.accent, roughness: 0.35, metalness: 0.1, transparent: true });
    const stem = new THREE.Mesh(stemGeo, mat);
    stem.position.copy(n); stem.quaternion.setFromUnitVectors(UP, n);
    const head = new THREE.Mesh(headGeo, mat);
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.userData.i = i;
    head.add(hit);
    globe.add(stem, head);
    let label = null;
    if (i < MAX_LABELS) {
      label = document.createElement("button");
      label.type = "button"; label.className = "g-label"; label.tabIndex = -1;
      label.innerHTML = `<b>${esc(g.name)}</b><span>${g.places.length}</span>`;
      label.addEventListener("click", () => select(i));
      labels.append(label);
    }
    return { g, n, h, mat, stem, head, hit, label, grow: reduced ? 1 : 0, delay: Math.min(i, 20) * 0.05, dim: false };
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.04, 40), new THREE.MeshBasicMaterial({ color: C.star, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  ring.visible = false;
  globe.add(ring);

  const home = ctx.homeCountry ? homePoint(ctx.homeCountry) : null;
  if (home) {
    const hn = toVec(home[0], home[1]).normalize();
    const homeDot = new THREE.Mesh(new THREE.RingGeometry(0.012, 0.024, 32), new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.DoubleSide }));
    homeDot.position.copy(hn).multiplyScalar(1.004); homeDot.lookAt(hn.clone().multiplyScalar(2));
    globe.add(homeDot);
  }

  // ---------- arcs: home to every city, or one friend's trips in the order they went ----------
  const arcs = new THREE.Group();
  globe.add(arcs);
  const travelerGeo = new THREE.SphereGeometry(0.008, 8, 8);
  let arcList = [];
  function clearArcs() {
    for (const a of arcList) { a.line.geometry.dispose(); a.line.material.dispose(); a.dot.material.dispose(); }
    arcs.clear(); arcList = [];
  }
  function buildArcs() {
    clearArcs();
    const pairs = [];
    let color = C.arc;
    if (state.friend) {
      color = new THREE.Color(colorFor(state.friend));
      const seq = tripOf(state.friend);
      for (let i = 1; i < seq.length; i++) pairs.push([[seq[i - 1].lat, seq[i - 1].lng], [seq[i].lat, seq[i].lng]]);
    } else if (home) {
      for (const g of cities) if (Math.hypot(g.lat - home[0], g.lng - home[1]) > 1.5) pairs.push([home, [g.lat, g.lng]]);
    }
    pairs.slice(0, 40).forEach(([a, b], i) => {
      const pts = arcPoints(a, b);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 }));
      line.geometry.setDrawRange(0, reduced ? pts.length : 0);
      const dot = new THREE.Mesh(travelerGeo, new THREE.MeshBasicMaterial({ color }));
      dot.visible = !reduced;
      arcs.add(line, dot);
      arcList.push({ line, dot, pts, t: reduced ? 1 : -i * 0.08, loop: i * 0.37 });
    });
  }

  // One person's trips: the cities they reviewed, in the order they went (visit month, else review date).
  function tripOf(uid) {
    const visits = [];
    for (const g of cities) for (const p of g.places) for (const r of p.reviews)
      if (r.user_id === uid) visits.push({ g, when: r.visited_month || r.created_at || "" });
    visits.sort((a, b) => a.when.localeCompare(b.when));
    return visits.map(x => x.g).filter((g, i, a) => i === 0 || g !== a[i - 1]);
  }
  const ranked = ctx.ranked; // Top travelled, ranked in app.js (topTravelled)
  const maxKm = Math.max(1, ...ranked.map(f => f.km));

  // ---------- panels ----------
  const countries = new Set(places.map(p => p.country).filter(Boolean)).size;
  const reviews = places.reduce((s, p) => s + p.reviews.length, 0);
  const el = document.createElement("section");
  el.className = "globe";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Globe view of " + ctx.title);
  el.innerHTML = `
    <div class="g-top">
      <div class="g-card g-title">${ctx.logo}<div><p class="g-kicker">Globe view</p><h2>${esc(ctx.title)}</h2></div></div>
      <button type="button" class="pill g-close" data-g="close">${ctx.mapIcon}<span>Back to map</span></button>
    </div>
    <div class="g-side">
      <div class="g-card g-stats">
        <div><b>${places.length}</b><span>Places</span></div>
        <div><b>${cities.length}</b><span>Cities</span></div>
        <div><b>${countries}</b><span>Countries</span></div>
        <div><b>${reviews}</b><span>Reviews</span></div>
      </div>
      <div class="g-card g-friends">
        <p class="g-kicker">Top travelled</p>
        <div class="g-flist">
          <button type="button" class="g-friend" data-f="" aria-pressed="true"><span class="av av-sm g-all">${ctx.logo}</span><span><b>Everyone</b><small>${home ? "Arcs from your country" : "All places"}</small></span></button>
          ${ranked.map((f, i) => `
            <button type="button" class="g-friend" data-f="${esc(f.id)}" aria-pressed="false" aria-label="Number ${i + 1}: ${esc(nameOf(f.id))}, ${plural(f.countries, "country", "countries")}, ${plural(f.cities, "city", "cities")}, ${Math.round(f.km).toLocaleString()} km">
              <span class="g-rank${i < 3 ? " r" + (i + 1) : ""}" aria-hidden="true">${i + 1}</span>${avatar(f.id, "av-sm")}
              <span aria-hidden="true"><b>${esc(nameOf(f.id))}</b><small>${plural(f.countries, "country", "countries")} · ${plural(f.cities, "city", "cities")} · ${Math.round(f.km).toLocaleString()} km</small>
              <i class="g-bar"><i style="width:${(f.km / maxKm * 100).toFixed(1)}%;background:${colorFor(f.id)}"></i></i></span>
            </button>`).join("")}
        </div>
      </div>
    </div>
    <aside class="g-card g-detail" aria-live="polite" hidden></aside>
    <p class="g-hint">Drag to spin · scroll to zoom · pick a city</p>
    <div class="g-card g-strip">
      <p class="g-kicker">Cities</p>
      <div class="g-chips">${cities.length ? cities.map((g, i) =>
        `<button type="button" class="g-chip" data-c="${i}" aria-pressed="false"><b>${esc(g.name)}</b><span>${g.places.length}</span></button>`).join("")
        : `<span class="g-empty">No places yet. Add one from the map and it shows up here.</span>`}</div>
    </div>`;
  const canvas = renderer.domElement;
  canvas.className = "g-canvas";
  canvas.setAttribute("aria-hidden", "true");
  el.prepend(canvas, labels);
  document.body.append(el);
  const detail = el.querySelector(".g-detail");
  const back = document.activeElement;
  el.querySelector(".g-close").focus();

  // ---------- state + selection ----------
  const state = { sel: -1, friend: null };
  function visited(g) { return !state.friend || g.places.some(p => p.reviews.some(r => r.user_id === state.friend)); }
  let target = null, idle = 0;
  function select(i) {
    state.sel = i;
    el.querySelectorAll(".g-chip").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.c === i)));
    paint();
    size();
    if (i < 0) { detail.hidden = true; ring.visible = false; return; }
    const it = items[i];
    target = facing(it.g.lat, it.g.lng);
    ring.visible = true;
    ring.position.copy(it.n).multiplyScalar(1.004); ring.lookAt(it.n.clone().multiplyScalar(2));
    showDetail(it.g);
    detail.hidden = false;
    const chip = el.querySelector(`.g-chip[data-c="${i}"]`);
    if (chip) chip.scrollIntoView({ block: "nearest", inline: "center", behavior: reduced ? "auto" : "smooth" });
  }
  // Cover photo: the newest photo in the city (the picked friend's own, when there is one).
  function coverOf(g) {
    let best = null;
    for (const p of g.places) (p.photos || []).forEach((ph, i) => {
      const score = [state.friend && ph.user_id === state.friend ? 1 : 0, String(ph.created_at || "")];
      if (!best || score[0] > best.score[0] || (score[0] === best.score[0] && score[1] > best.score[1])) best = { p, i, ph, score };
    });
    return best;
  }
  function showDetail(g) {
    detail.innerHTML = detailHTML(g);
    detail.classList.remove("has-cover");
    const cover = coverOf(g), box = detail.querySelector(".g-cover");
    if (!cover || !ctx.photoUrls) return;
    box.querySelector("span").textContent = `${cover.p.name} · ${cover.ph.credit || nameOf(cover.ph.user_id)}`;
    box.setAttribute("aria-label", `Open photos of ${cover.p.name}`);
    box.addEventListener("click", () => ctx.openPhotos(cover.p, cover.i));
    ctx.photoUrls([cover.ph.path]).then(([url]) => {
      if (!url || !box.isConnected) return; // card changed while the link was loading
      const img = box.querySelector("img");
      img.onload = () => { box.hidden = false; detail.classList.add("has-cover"); };
      img.src = url;
    }).catch(() => {});
  }
  function detailHTML(g) {
    const rows = g.places
      .map(p => ({ p, rs: state.friend ? p.reviews.filter(r => r.user_id === state.friend) : p.reviews }))
      .filter(x => x.rs.length)
      .sort((a, b) => avg(b.rs.map(r => r.rating)) - avg(a.rs.map(r => r.rating)) || b.rs.length - a.rs.length);
    const tip = rows.flatMap(x => x.rs).find(r => r.tip);
    return `
      <button type="button" class="icon-btn g-x" data-g="unselect" aria-label="Close city">${ctx.closeIcon}</button>
      <button type="button" class="g-cover" hidden><img alt=""><span></span></button>
      <p class="g-kicker">${esc(g.country || "")}</p>
      <h3>${esc(g.name)}</h3>
      <p class="g-meta">${plural(g.places.length, "place")} · ${plural(g.people.size, "friend")} been here</p>
      <div class="g-avs">${[...g.people].slice(0, 8).map(id => avatar(id, "av-xs")).join("")}</div>
      <ul class="g-places">${rows.slice(0, 5).map(x => `
        <li><i class="cat-dot cat-${esc(x.p.category)}"></i><span>${esc(x.p.name)}</span>${starsHTML(Math.round(avg(x.rs.map(r => r.rating))))}</li>`).join("")}
      </ul>
      ${rows.length > 5 ? `<p class="g-meta">and ${plural(rows.length - 5, "more place")}</p>` : ""}
      ${ctx.budgetHTML ? ctx.budgetHTML(g.cityKey) : ""}
      ${tip ? `<p class="g-tip"><b>Tip from ${esc(nameOf(tip.user_id))}:</b> ${esc(tip.tip)}</p>` : ""}
      <button type="button" class="btn btn-primary g-open" data-g="open">Open ${esc(g.name)} on the map</button>`;
  }
  // Pillar colours: the friend's colour when one is picked, amber for the selected city, faded where they haven't been.
  function paint() {
    const fc = state.friend ? new THREE.Color(colorFor(state.friend)) : C.accent;
    items.forEach((it, i) => {
      it.dim = !visited(it.g);
      it.mat.color.copy(i === state.sel ? C.star : fc);
      if (it.label) it.label.classList.toggle("is-dim", it.dim);
      const chip = el.querySelector(`.g-chip[data-c="${i}"]`);
      if (chip) chip.classList.toggle("is-dim", it.dim);
    });
  }
  function setFriend(id) {
    state.friend = id || null;
    el.querySelectorAll(".g-friend").forEach(b => b.setAttribute("aria-pressed", String((b.dataset.f || null) === state.friend)));
    paint();
    buildArcs();
    if (state.sel >= 0) showDetail(items[state.sel].g);
    // Fly to the friend's most-visited city, so the trail is in view.
    const first = items.find(it => !it.dim);
    const keep = state.sel >= 0 && !items[state.sel].dim;
    if (state.friend && first && !keep) target = facing(first.g.lat, first.g.lng);
  }
  function close(after) {
    cancelAnimationFrame(raf);
    ro.disconnect();
    clearArcs();
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    renderer.dispose();
    el.remove();
    if (back && back.focus) back.focus();
    if (after) after();
  }

  el.addEventListener("click", ev => {
    const b = ev.target.closest("button");
    if (!b) return;
    if (b.dataset.g === "close") close();
    else if (b.dataset.g === "unselect") select(-1);
    else if (b.dataset.g === "open") { const g = items[state.sel].g; close(() => ctx.onOpenCity(g)); }
    else if (b.dataset.c != null) select(+b.dataset.c);
    else if (b.dataset.f != null) setFriend(b.dataset.f);
  });
  el.addEventListener("keydown", ev => {
    if (ev.key !== "Escape") return;
    ev.stopPropagation();
    if (state.sel >= 0) select(-1); else close();
  });

  // ---------- drag to spin, wheel to zoom, click a pillar ----------
  let rx = 0.35, ry = facing(0, home ? home[1] : (cities[0] ? cities[0].lng : 0)).ry, vx = 0, vy = 0, zoom = 1, zoomNow = 1;
  if (home) rx = facing(home[0], 0).rx * 0.7;
  let drag = null;
  canvas.addEventListener("pointerdown", ev => {
    drag = { x: ev.clientX, y: ev.clientY, t: performance.now(), moved: 0 };
    canvas.setPointerCapture(ev.pointerId);
    target = null; vx = vy = 0;
  });
  canvas.addEventListener("pointermove", ev => {
    if (!drag) return;
    const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y, now = performance.now();
    const k = 0.005 * zoomNow, dt = Math.max(0.008, (now - drag.t) / 1000);
    ry += dx * k; rx += dy * k;
    vy = dx * k / dt; vx = dy * k / dt;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.x = ev.clientX; drag.y = ev.clientY; drag.t = now;
  });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  canvas.addEventListener("pointerup", ev => {
    if (!drag) return;
    const tap = drag.moved < 6;
    if (performance.now() - drag.t > 80) vx = vy = 0; // held still before letting go: no fling
    drag = null; idle = 0;
    if (!tap) return;
    const r = canvas.getBoundingClientRect();
    ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -(ev.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects([ocean, ...items.map(it => it.hit)], false)[0];
    select(hit && hit.object !== ocean ? hit.object.userData.i : -1);
  });
  canvas.addEventListener("pointercancel", () => { drag = null; });
  canvas.addEventListener("wheel", ev => {
    ev.preventDefault();
    zoom = Math.max(0.6, Math.min(1.5, zoom * (1 + ev.deltaY * 0.001)));
  }, { passive: false });

  // ---------- layout ----------
  let baseDist = 4;
  function size() {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false);
    landMat.uniforms.scale.value = h * renderer.getPixelRatio() / 2;
    camera.aspect = w / h;
    const wide = w > 900, phone = w <= 720;
    // Leave room for the panels: shift the globe right on wide screens; on phones, down a little,
    // or up out of the way of the city sheet when one is open.
    const dy = phone ? Math.round(h * (state.sel >= 0 ? 0.2 : -0.05)) : 0;
    camera.setViewOffset(w, h, wide ? -Math.round(w * 0.06) : 0, dy, w, h);
    baseDist = (phone ? 1.35 : 1.5) / Math.tan(camera.fov * DEG / 2) / Math.min(1, camera.aspect);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(size);
  ro.observe(el);
  size();

  // ---------- frame loop ----------
  const tmp = new THREE.Vector3();
  let last = performance.now(), clock = 0, raf = 0;
  buildArcs();
  if (ctx.startFriend) setFriend(ctx.startFriend);
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now; clock += dt;
    if (!drag) {
      if (target) {
        const k = reduced ? 1 : ease(5, dt);
        ry += wrap(target.ry - ry) * k; rx += (target.rx - rx) * k;
        if (Math.abs(wrap(target.ry - ry)) < 1e-3 && Math.abs(target.rx - rx) < 1e-3) target = null;
      } else {
        ry += vy * dt; rx += vx * dt;
        vy *= Math.exp(-3 * dt); vx *= Math.exp(-3 * dt);
        idle += dt;
        if (!reduced && idle > 3 && state.sel < 0) ry += 0.05 * dt;
      }
    }
    rx = Math.max(-1.25, Math.min(1.25, rx));
    globe.rotation.set(rx, ry, 0);
    zoomNow += (zoom - zoomNow) * ease(8, dt);
    camera.position.set(0, 0, baseDist * zoomNow);
    camera.lookAt(0, 0, 0);

    items.forEach((it, i) => {
      if (it.grow < 1) it.grow = Math.min(1, it.grow + dt * 1.6 * (clock > it.delay ? 1 : 0));
      const g = 1 - Math.pow(1 - it.grow, 3), h = it.h * g * (i === state.sel ? 1.15 : 1);
      it.stem.scale.set(1, Math.max(h, 1e-4), 1);
      it.head.position.copy(it.n).multiplyScalar(1 + h);
      it.head.scale.setScalar(Math.max(g, 1e-3));
      it.mat.opacity = it.dim ? 0.18 : 1;
    });
    if (ring.visible) {
      const p = reduced ? 0.5 : (clock * 0.8) % 1;
      ring.scale.setScalar(1 + p * 1.6);
      ring.material.opacity = 1 - p;
    }
    for (const a of arcList) {
      a.t = Math.min(1, a.t + dt * 0.9);
      a.line.geometry.setDrawRange(0, Math.max(0, Math.round(a.t * a.pts.length)));
      if (a.dot.visible) {
        const u = a.t < 1 ? Math.max(0, a.t) : (clock * 0.25 + a.loop) % 1;
        a.dot.position.copy(a.pts[Math.min(a.pts.length - 1, Math.floor(u * (a.pts.length - 1)))]);
      }
    }

    // Labels follow their pillar tops and fade out as they turn away.
    globe.updateMatrixWorld();
    const w = canvas.clientWidth, hgt = canvas.clientHeight;
    for (const it of items) {
      if (!it.label) continue;
      it.head.getWorldPosition(tmp);
      const face = tmp.clone().normalize().z;
      tmp.project(camera);
      const show = face > 0.25 && it.grow > 0.6;
      it.label.style.opacity = show ? String(Math.min(1, (face - 0.25) * 4) * (it.dim ? 0.45 : 1)) : "0";
      it.label.style.pointerEvents = show ? "auto" : "none";
      it.label.style.transform = `translate3d(${((tmp.x + 1) / 2 * w).toFixed(1)}px, ${((1 - tmp.y) / 2 * hgt).toFixed(1)}px, 0)`;
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
}

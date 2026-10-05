// Country helpers for MyCircle: which country a point is in, how much of a country (or the world)
// someone has covered, and a country-shaped backdrop. Uses the bundled outlines in vendor/countries.js.
(function () {
  const all = (window.MC_COUNTRIES || []).map(c => {
    let w = 180, s = 90, e = -180, n = -90;
    for (const poly of c.g) for (const ring of poly) for (let i = 0; i < ring.length; i += 2) {
      if (ring[i] < w) w = ring[i]; if (ring[i] > e) e = ring[i];
      if (ring[i + 1] < s) s = ring[i + 1]; if (ring[i + 1] > n) n = ring[i + 1];
    }
    return Object.assign({ bbox: [s, w, n, e], real: !/^X/.test(c.c) }, c);
  });
  const REAL = all.filter(c => c.real);
  const byCode = new Map(all.map(c => [c.c, c]));

  function inRing(ring, x, y) {
    let inside = false;
    for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
      const xi = ring[i], yi = ring[i + 1], xj = ring[j], yj = ring[j + 1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function inCountry(c, lat, lng) {
    const b = c.bbox;
    if (lat < b[0] || lat > b[2] || lng < b[1] || lng > b[3]) return false;
    for (const poly of c.g) { // outer ring minus holes
      if (!inRing(poly[0], lng, lat)) continue;
      let hole = false;
      for (let k = 1; k < poly.length && !hole; k++) hole = inRing(poly[k], lng, lat);
      if (!hole) return true;
    }
    return false;
  }
  const cache = new Map();
  // Country that contains the point (null at sea or in a tiny state the map data leaves out).
  function countryAt(lat, lng) {
    const key = lat.toFixed(3) + "," + lng.toFixed(3);
    if (cache.has(key)) return cache.get(key);
    let found = null;
    for (const c of all) if (inCountry(c, lat, lng)) { found = c; break; }
    if (!found) { // coast: the nearest outline within about 25 km
      let best = 0.25;
      for (const c of all) {
        const b = c.bbox;
        if (lat < b[0] - 0.3 || lat > b[2] + 0.3 || lng < b[1] - 0.3 || lng > b[3] + 0.3) continue;
        for (const poly of c.g) for (const ring of poly) for (let i = 0; i < ring.length; i += 2) {
          const d = Math.hypot(ring[i] - lng, ring[i + 1] - lat);
          if (d < best) { best = d; found = c; }
        }
      }
    }
    cache.set(key, found);
    return found;
  }
  function km(aLat, aLng, bLat, bLng) {
    const r = Math.PI / 180, dLat = (bLat - aLat) * r, dLng = (bLng - aLng) * r;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(x));
  }
  // Share of a country's land within `radius` km of any of the given points ({lat, lng}).
  // Samples the country on a grid (weighted by cos(latitude) so far-north cells don't count extra).
  function coverage(country, points, radius) {
    radius = radius || 60;
    const mine = points.filter(p => inCountry(country, p.lat, p.lng));
    if (!mine.length) return { pct: 0, places: 0 };
    const [s, w, n, e] = country.bbox;
    const step = Math.max(0.25, Math.sqrt((n - s) * (e - w) / 9000));
    let total = 0, covered = 0;
    for (let lat = s + step / 2; lat < n; lat += step) {
      const wt = Math.cos(lat * Math.PI / 180);
      for (let lng = w + step / 2; lng < e; lng += step) {
        if (!inCountry(country, lat, lng)) continue;
        total += wt;
        if (mine.some(p => Math.abs(p.lat - lat) < radius / 111 + step && km(lat, lng, p.lat, p.lng) <= radius)) covered += wt;
      }
    }
    // tiny countries can miss every grid sample: count them as covered when a place is inside
    if (!total) return { pct: 100, places: mine.length };
    return { pct: Math.min(100, covered / total * 100), places: mine.length };
  }
  // The country's outline as an SVG string, scaled to fit (largest landmasses only, for a clean silhouette).
  function shapeSVG(country) {
    const [s, w, n, e] = country.bbox;
    const mid = Math.cos(((s + n) / 2) * Math.PI / 180);
    const W = (e - w) * mid, H = n - s;
    const polys = country.g.slice().sort((a, b) => b[0].length - a[0].length).slice(0, 12);
    const pt = (x, y) => ((x - w) * mid).toFixed(2) + " " + (n - y).toFixed(2);
    const d = polys.map(poly => poly.map(ring => {
      let o = "M" + pt(ring[0], ring[1]);
      for (let i = 2; i < ring.length; i += 2) o += "L" + pt(ring[i], ring[i + 1]);
      return o + "Z";
    }).join("")).join("");
    return `<svg viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path fill-rule="evenodd" d="${d}"/></svg>`;
  }
  // A stable colour per country, so everyone from the same place gets the same look.
  function hue(code) {
    let h = 2166136261;
    for (const ch of String(code)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return h % 360;
  }
  window.MCCountry = {
    list: REAL.slice().sort((a, b) => a.n.localeCompare(b.n)),
    total: REAL.length,
    get: code => byCode.get(code) || null,
    byName: name => REAL.find(c => c.n.toLowerCase() === String(name || "").trim().toLowerCase()) || null,
    countryAt, inCountry, coverage, shapeSVG, hue,
    center: c => [(c.bbox[0] + c.bbox[2]) / 2, (c.bbox[1] + c.bbox[3]) / 2]
  };
})();

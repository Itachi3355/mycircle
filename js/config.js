// MyCircle settings.
// The publishable key is meant to be public: every table is protected by
// row-level security, so it only lets signed-in circle members see their own circle.
window.MYCIRCLE_CONFIG = {
  supabaseUrl: "https://mzkheelfhzcfifeohqnb.supabase.co",
  supabaseKey: "sb_publishable_4-lNEo9cemO4Ycf3UpLT3w_hmc4D5uH",

  // Street map tiles: OpenStreetMap's standard map (no key needed).
  tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileMaxZoom: 19,
  tileAttribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',

  // City and place search (Photon, built on OpenStreetMap).
  searchUrl: "https://photon.komoot.io/api/",
  reverseUrl: "https://photon.komoot.io/reverse",

  // Street directions for day plans (FOSSGIS routing on OpenStreetMap data, free for light use).
  routeUrl: "https://routing.openstreetmap.de"
};

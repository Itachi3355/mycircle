// Demo mode: open http://localhost:3000/?demo to preview the UI with fake data and no sign-in.
// Nothing is read from or saved to Supabase. Saving/deleting will show an error toast.
(function () {
  const rv = (id, user, rating, body, tip, m) => ({ id, user_id: user, rating, price: 2, visited_month: m || "2025-06", body, tip: tip || "", created_at: "2025-07-01", updated_at: "2025-07-0" + (1 + (id.length % 8)) });
  const P = (id, name, category, city, country, lat, lng, reviews, photos) => ({ id, name, category, address: "", city, country, lat, lng, created_by: "u1", reviews, photos: photos || [] });
  // Placeholder "photos": soft gradients, so the photo strip and viewer can be previewed.
  const ph = (id, user, a, b) => ({ id, user_id: user, created_at: "2025-07-02", path: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/></svg>`) });
  window.MYCIRCLE_DEMO = {
    user: { id: "u1", email: "you@example.com", user_metadata: { country: "USA" } },
    profile: { id: "u1", display_name: "Murali M" },
    circles: [{ id: "c1", name: "Close friends", invite_code: "demo", owner_id: "u1", role: "owner" }],
    members: [{ id: "u1", role: "owner", name: "Murali M" }, { id: "u2", role: "member", name: "Anika Rao" }, { id: "u3", role: "member", name: "Ravi Kumar" }],
    places: [
      P("p1", "Joe's Pizza", "food", "New York", "United States", 40.7306, -74.0021, [rv("r1", "u2", 5, "Best slice in the Village. Cash only, always a line, worth it.", "Go before noon."), rv("r2", "u3", 4, "Classic. Fold it and walk.")]),
      P("p2", "The Standard High Line", "stay", "New York", "United States", 40.7408, -74.0078, [rv("r3", "u2", 4, "Great views, small rooms.", "Ask for a high floor.")]),
      P("p3", "The High Line", "see", "New York", "United States", 40.748, -74.0048, [rv("r4", "u3", 5, "Walk it north to south at sunset.")], [ph("f1", "u3", "#f6b26b", "#6d9eeb"), ph("f2", "u1", "#93c47d", "#3d85c6"), ph("f3", "u2", "#e06666", "#ffd966"), ph("f4", "u3", "#8e7cc3", "#76a5af"), ph("f5", "u1", "#c27ba0", "#f9cb9c")]),
      P("p8", "Chelsea Market", "food", "New York", "United States", 40.7424, -74.0061, [rv("r9", "u3", 4, "Great for a long lunch. Go hungry.", "Skip the lobster rolls, try the tacos.")]),
      P("p9", "Washington Square Park", "see", "New York", "United States", 40.7308, -73.9973, [rv("r10", "u2", 4, "Street musicians and the best people-watching.")]),
      P("p4", "Prospect Park", "see", "New York", "United States", 40.6602, -73.969, [rv("r5", "u1", 4, "Quiet Sunday loop.")]),
      P("p5", "Café de Flore", "food", "Paris", "France", 48.854, 2.3326, [rv("r6", "u3", 3, "Iconic, pricey. Come for the people-watching.", "Skip the dessert.")]),
      P("p6", "Musée d'Orsay", "see", "Paris", "France", 48.86, 2.3266, [rv("r7", "u2", 5, "Go on a weekday morning.")]),
      P("p7", "Shinjuku Gyoen", "see", "Tokyo", "Japan", 35.6852, 139.7100, [rv("r8", "u1", 5, "Cherry blossom heaven.")])
    ]
  };
})();

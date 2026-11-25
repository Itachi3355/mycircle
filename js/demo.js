// Demo mode: open http://localhost:3000/?demo to preview the UI with fake data and no sign-in.
// Demo uses bundled data and does not connect to Supabase.
(function () {
  const rv = (id, user, rating, body, tip, m) => ({ id, user_id: user, rating, price: 2, visited_month: m || "2025-06", body, tip: tip || "", created_at: "2025-07-01", updated_at: "2025-07-0" + (1 + (id.length % 8)) });
  const P = (id, name, category, city, country, lat, lng, reviews, photos) => ({ id, name, category, address: "", city, country, lat, lng, created_by: "u1", reviews, photos: photos || [] });
  window.MYCIRCLE_DEMO = {
    user: { id: "u1", email: "you@example.com", user_metadata: { country: "USA" } },
    profile: { id: "u1", display_name: "Murali M" },
    circles: [{ id: "c1", name: "Close friends", invite_code: "demo", owner_id: "u1", role: "owner" }],
    members: [{ id: "u1", role: "owner", name: "Murali M" }, { id: "u2", role: "member", name: "Anika Rao" }, { id: "u3", role: "member", name: "Ravi Kumar" }, { id: "u4", role: "member", name: "Sofia Mendes" }, { id: "u5", role: "member", name: "Kenji Watanabe" }],
    places: [
      P("p1", "Joe's Pizza", "food", "New York", "United States", 40.7306, -74.0021, [rv("r1", "u2", 5, "Best slice in the Village. Cash only, always a line, worth it.", "Go before noon."), rv("r2", "u3", 4, "Classic. Fold it and walk.")]),
      P("p2", "The Standard High Line", "stay", "New York", "United States", 40.7408, -74.0078, [rv("r3", "u2", 4, "Great views, small rooms.", "Ask for a high floor.")]),
      P("p3", "The High Line", "see", "New York", "United States", 40.748, -74.0048, [rv("r4", "u3", 5, "Walk it north to south at sunset.")]),
      P("p8", "Chelsea Market", "food", "New York", "United States", 40.7424, -74.0061, [rv("r9", "u3", 4, "Great for a long lunch. Go hungry.", "Skip the lobster rolls, try the tacos.")]),
      P("p9", "Washington Square Park", "see", "New York", "United States", 40.7308, -73.9973, [rv("r10", "u2", 4, "Street musicians and the best people-watching.")]),
      P("p4", "Prospect Park", "see", "New York", "United States", 40.6602, -73.969, [rv("r5", "u1", 4, "Quiet Sunday loop.")]),
      P("p5", "Café de Flore", "food", "Paris", "France", 48.854, 2.3326, [rv("r6", "u3", 3, "Iconic, pricey. Come for the people-watching.", "Skip the dessert.")]),
      P("p6", "Musée d'Orsay", "see", "Paris", "France", 48.86, 2.3266, [rv("r7", "u2", 5, "Go on a weekday morning.")]),
      P("p7", "Shinjuku Gyoen", "see", "Tokyo", "Japan", 35.6852, 139.7100, [rv("r8", "u1", 5, "Cherry blossom heaven."), rv("r11", "u5", 4, "Pay the small fee, worth it for the quiet.", "", "2024-04")]),
      P("p10", "British Museum", "see", "London", "United Kingdom", 51.5194, -0.127, [rv("r12", "u3", 5, "Free and endless. Pick three rooms and stop.", "Go late on Friday.", "2024-05"), rv("r13", "u4", 4, "The Great Court alone is worth it.", "", "2024-10")]),
      P("p11", "Dishoom Shoreditch", "food", "London", "United Kingdom", 51.5245, -0.0768, [rv("r14", "u4", 5, "The bacon naan roll ruined all other breakfasts.", "Queue before 9am.", "2024-10")]),
      P("p12", "Time Out Market", "food", "Lisbon", "Portugal", 38.7069, -9.1459, [rv("r15", "u2", 4, "Loud, fun, try a bit of everything.", "", "2024-03"), rv("r16", "u4", 4, "Go for the pastéis, stay for the seafood.", "", "2024-07")]),
      P("p13", "Belém Tower", "see", "Lisbon", "Portugal", 38.6916, -9.216, [rv("r17", "u4", 4, "Better from outside at golden hour.", "Pastéis de Belém is a 10 minute walk.", "2024-07")]),
      P("p14", "Sagrada Família", "see", "Barcelona", "Spain", 41.4036, 2.1744, [rv("r18", "u2", 5, "Nothing prepares you for the light inside.", "Book the first slot online.", "2024-04")]),
      P("p15", "Museo Frida Kahlo", "see", "Mexico City", "Mexico", 19.3551, -99.1625, [rv("r19", "u4", 5, "Small, personal, unforgettable.", "Tickets sell out days ahead.", "2024-02"), rv("r20", "u1", 4, "Coyoacán around it is lovely too.", "", "2024-12")]),
      P("p16", "Contramar", "food", "Mexico City", "Mexico", 19.4189, -99.1667, [rv("r21", "u1", 5, "Tuna tostadas. That's the review.", "Lunch only, book ahead.", "2024-12")]),
      P("p17", "Sky Lagoon", "see", "Reykjavik", "Iceland", 64.1163, -21.9395, [rv("r22", "u2", 5, "Hot water, cold air, ocean view.", "Do the seven-step ritual.", "2025-02"), rv("r23", "u4", 4, "Smaller than Blue Lagoon, much calmer.", "", "2025-01")]),
      P("p18", "Table Mountain", "see", "Cape Town", "South Africa", -33.9628, 18.4098, [rv("r24", "u2", 5, "Hike up Platteklip, cable car down.", "Check the wind, the cable car closes.", "2024-11"), rv("r25", "u5", 4, "Clouds roll in fast. Go early.", "", "2025-05")]),
      P("p19", "Hagia Sophia", "see", "Istanbul", "Türkiye", 41.0086, 28.9802, [rv("r26", "u3", 5, "Stand in the middle and look up.", "Cover shoulders and knees.", "2024-09")]),
      P("p20", "Fushimi Inari", "see", "Kyoto", "Japan", 34.9671, 135.7727, [rv("r27", "u5", 5, "Keep climbing past the crowds.", "Start at 7am.", "2024-04"), rv("r28", "u3", 5, "The upper trail is almost empty.", "", "2025-01")]),
      P("p21", "Tegallalang Rice Terraces", "see", "Ubud", "Indonesia", -8.4325, 115.2791, [rv("r29", "u5", 4, "Green on green on green.", "Bring cash for the small entry fees.", "2024-08"), rv("r30", "u3", 4, "Touristy but still beautiful.", "", "2025-03")]),
      P("p22", "Bondi to Coogee Walk", "see", "Sydney", "Australia", -33.8915, 151.2767, [rv("r31", "u4", 5, "The best free thing in Sydney.", "Swim at Bronte on the way.", "2025-04"), rv("r32", "u5", 5, "Do it at sunrise.", "", "2024-12")])
    ]
  };
  // What each trip cost, in the currency people paid.
  const T = (user, city_key, city, country, amount, currency, days, travellers, visited_month, note) => ({ id: "t-" + user + city_key, user_id: user, city_key, city, country, amount, currency, days, travellers, visited_month, note });
  window.MYCIRCLE_DEMO.trips = [
    T("u2", "new york", "New York", "United States", 2400, "USD", 5, 2, "2025-06", "Hotel was most of it."),
    T("u3", "new york", "New York", "United States", 1600, "USD", 4, 1, "2025-06", "Stayed with a friend in Brooklyn."),
    T("u2", "paris", "Paris", "France", 1900, "EUR", 5, 2, "2025-06", "Train from London, small hotel in the Marais."),
    T("u2", "lisbon", "Lisbon", "Portugal", 1450, "EUR", 6, 1, "2024-03", "Flights, guesthouse in Alfama, lots of pastéis."),
    T("u4", "lisbon", "Lisbon", "Portugal", 980, "EUR", 5, 1, "2024-07", "Hostel and the 28 tram everywhere."),
    T("u5", "tokyo", "Tokyo", "Japan", 210000, "JPY", 7, 1, "2024-04", "Business hotels and a lot of ramen."),
    T("u1", "tokyo", "Tokyo", "Japan", 2800, "USD", 8, 1, "2025-04", "Flights were half of it."),
    T("u4", "reykjavik", "Reykjavik", "Iceland", 260000, "ISK", 4, 1, "2025-01", "Rental car split four ways."),
    T("u5", "ubud", "Ubud", "Indonesia", 9000000, "IDR", 6, 1, "2024-08", "Villa with a pool, scooter rental."),
    T("u3", "ubud", "Ubud", "Indonesia", 700, "USD", 5, 1, "2025-03"),
    T("u1", "mexico city", "Mexico City", "Mexico", 18000, "MXN", 5, 1, "2024-12", "Ate like a king for very little."),
    T("u4", "mexico city", "Mexico City", "Mexico", 900, "USD", 6, 1, "2024-02"),
    T("u2", "cape town", "Cape Town", "South Africa", 22000, "ZAR", 7, 1, "2024-11", "Car hire is a must.")
  ];

  // Real photos of each place from Wikimedia Commons, credited on screen (full list: demo/photos/CREDITS.md).
  const PHOTOS = [
    ["p1", "u2", "p1-1.jpg", "Photo: Steam Pipe Trunk Distribution Venue, CC BY 2.0"],
    ["p3", "u3", "p3-1.jpg", "Photo: Dansnguyen, CC0"],
    ["p3", "u1", "p3-2.jpg", "Photo: Dansnguyen, CC BY-SA 4.0"],
    ["p7", "u5", "p7-1.jpg", "Photo: Kakidai, CC BY-SA 3.0"],
    ["p10", "u3", "p10-1.jpg", "Photo: Ham, CC BY-SA 3.0"],
    ["p12", "u2", "p12-1.jpg", "Photo: Paul Arps from The Netherlands, CC BY 2.0"],
    ["p13", "u4", "p13-1.jpg", "Photo: Alvesgaspar, CC BY-SA 3.0"],
    ["p14", "u2", "p14-1.jpg", "Photo: Canaan, CC BY-SA 4.0"],
    ["p17", "u4", "p17-1.jpg", "Photo: Laurenmcl, CC BY-SA 4.0"],
    ["p18", "u5", "p18-1.jpg", "Photo: Danie van der Merwe from Cape Town, South Africa, CC BY 2.0"],
    ["p19", "u3", "p19-1.jpg", "Photo: Adli Wahid, CC BY-SA 3.0"],
    ["p20", "u3", "p20-1.jpg", "Photo: Basile Morin, CC BY-SA 4.0"],
    ["p6", "u2", "p6-1.jpg", "Photo: Roman Eisele, CC BY-SA 4.0"],
    ["p21", "u5", "p21-1.jpg", "Photo: Philip Nalangan, CC BY 4.0"],
    ["p22", "u4", "p22-1.jpg", "Photo: Maurice van Creij, CC BY 3.0"],
    ["p15", "u4", "p15-1.jpg", "Photo: Rebeccananonof, CC0"]
  ];
  PHOTOS.forEach(([pid, user, file, credit], i) => {
    const place = window.MYCIRCLE_DEMO.places.find(x => x.id === pid);
    place.photos.push({ id: "ph" + i, user_id: user, created_at: "2025-07-" + String(10 + i).padStart(2, "0"), path: "demo/photos/" + file, credit });
  });
})();

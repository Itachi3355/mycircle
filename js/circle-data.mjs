const PAGE_SIZE = 500;

async function readCircleRows(client, table, columns, circleId, key) {
  const rows = [];
  let after = null;
  while (true) {
    const query = client.from(table).select(columns).eq("circle_id", circleId).order(key).limit(PAGE_SIZE);
    if (after !== null) query.gt(key, after);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
    after = data.at(-1)[key];
  }
}

export async function fetchCircleData(client, circleId) {
  const [membership, trips, places] = await Promise.all([
    readCircleRows(client, "circle_members", "user_id, role", circleId, "user_id"),
    readCircleRows(client, "trips",
      "id, user_id, city_key, city, country, amount, currency, days, travellers, visited_month, note, updated_at",
      circleId, "id"),
    readCircleRows(client, "places",
      "id, name, category, address, city, country, lat, lng, source_ref, created_by, reviews(id, user_id, rating, price, visited_month, body, tip, created_at, updated_at), photos(id, user_id, path, created_at)",
      circleId, "id")
  ]);
  const members = new Map(membership.map(m => [m.user_id, { id: m.user_id, role: m.role, name: "" }]));
  const ids = [...members.keys()];
  for (let i = 0; i < ids.length; i += PAGE_SIZE) {
    const { data, error } = await client.from("profiles").select("id, display_name").in("id", ids.slice(i, i + PAGE_SIZE));
    if (error) throw error;
    for (const profile of data) members.get(profile.id).name = profile.display_name;
  }
  return { members, places, trips: trips.map(t => ({ ...t, amount: Number(t.amount) })) };
}

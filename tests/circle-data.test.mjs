import assert from "node:assert/strict";
import test from "node:test";
import { fetchCircleData } from "../js/circle-data.mjs";

function mockClient(tables) {
  return {
    from(table) {
      let data = tables[table];
      let limit = Infinity;
      return {
        select() { return this; },
        eq(key, value) { data = data.filter(row => row[key] === value); return this; },
        order(key) { data = data.slice().sort((a, b) => a[key].localeCompare(b[key])); return this; },
        gt(key, value) { data = data.filter(row => row[key] > value); return this; },
        limit(value) { limit = value; return this; },
        in(key, values) { data = data.filter(row => values.includes(row[key])); return this; },
        then(resolve) { resolve({ data: data.slice(0, limit), error: null }); }
      };
    }
  };
}

test("a circle loads its places, reviews, and trip budgets into the correct collections", async () => {
  const place = { id: "p1", circle_id: "c1", reviews: [{ rating: 5 }], photos: [] };
  const client = mockClient({
    circle_members: [{ circle_id: "c1", user_id: "u1", role: "owner" }],
    profiles: [{ id: "u1", display_name: "Avery" }],
    trips: [{ id: "t1", circle_id: "c1", amount: "175.25" }, { id: "t2", circle_id: "c2", amount: "500" }],
    places: [place, { id: "p2", circle_id: "c2", reviews: [{ rating: 4 }] }]
  });

  const data = await fetchCircleData(client, "c1");

  assert.deepEqual(data.places, [place]);
  assert.deepEqual(data.trips, [{ id: "t1", circle_id: "c1", amount: 175.25 }]);
  assert.deepEqual([...data.members.values()], [{ id: "u1", role: "owner", name: "Avery" }]);
});

test("places and trips beyond the first page are loaded", async () => {
  const rows = Array.from({ length: 1001 }, (_, i) => ({
    id: String(i).padStart(4, "0"), circle_id: "c1", amount: "1"
  })).reverse();
  const data = await fetchCircleData(mockClient({
    circle_members: [], profiles: [], places: rows, trips: rows
  }), "c1");

  const expectedIds = rows.map(row => row.id).sort();
  assert.deepEqual(data.places.map(row => row.id), expectedIds);
  assert.deepEqual(data.trips.map(row => row.id), expectedIds);
});

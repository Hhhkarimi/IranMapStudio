import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import vm from "node:vm";
import { merge } from "topojson-client";

const bundlePath = resolve("node_modules/react-iran-maps/dist/index.mjs");
const outputPath = resolve("src/data/iran-geo.json");
const source = await readFile(bundlePath, "utf8");
const startMarker = "var u=";
const endMarker = ";function d()";
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (start < 0 || end < 0) {
  throw new Error("Could not locate the bundled Iran TopoJSON data.");
}

const literal = source.slice(start + startMarker.length, end);
const topology = vm.runInNewContext(`(${literal})`, Object.create(null), {
  timeout: 5_000,
});
const object = topology.objects.Shahrestan1400;
const grouped = new Map();
const countyGroups = new Map();

for (const geometry of object.geometries) {
  const key = geometry.properties.provincName || geometry.properties.NAME_1;
  const list = grouped.get(key) ?? [];
  list.push(geometry);
  grouped.set(key, list);

  const countyKey = `${geometry.properties.provincName}::${geometry.properties.cityName}`;
  const countyParts = countyGroups.get(countyKey) ?? [];
  countyParts.push(geometry);
  countyGroups.set(countyKey, countyParts);
}

const provinces = [...grouped.entries()].map(([key, geometries]) => {
  const sample = geometries[0].properties;
  return {
    type: "Feature",
    properties: {
      id: key,
      nameFa: sample.provincName,
      nameEn: sample.NAME_1,
      countyCount: new Set(geometries.map((geometry) => geometry.properties.cityName)).size,
    },
    geometry: merge(topology, geometries),
  };
});

const normalizedCounties = [...countyGroups.entries()].map(([id, geometries]) => {
  const sample = geometries[0].properties;
  return {
    type: "Feature",
    properties: {
      id,
      provinceFa: sample.provincName,
      provinceEn: sample.NAME_1,
      nameFa: sample.cityName,
      nameEn: sample.NAME_2,
    },
    geometry: merge(topology, geometries),
  };
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  JSON.stringify({
    source: "react-iran-maps@1.2.2 — Iran administrative boundaries 1400/2021 — MIT",
    provinces: { type: "FeatureCollection", features: provinces },
    counties: { type: "FeatureCollection", features: normalizedCounties },
  }),
);

console.log(`Wrote ${provinces.length} provinces and ${normalizedCounties.length} counties.`);

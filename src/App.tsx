import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import {
  ArrowRight,
  Braces,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  ImageDown,
  MapPinned,
  PencilLine,
  RotateCcw,
  Type,
  Upload,
} from "lucide-react";
import iranGeoRaw from "./data/iran-geo.json";

type Language = "fa" | "en";
type ViewLevel = "province" | "county";
type DataMode = "manual" | "file";

interface RegionProperties {
  id: string;
  nameFa: string;
  nameEn: string;
  countyCount?: number;
  provinceFa?: string;
  provinceEn?: string;
}

type RegionFeature = Feature<Geometry, RegionProperties>;

interface IranGeoData {
  source: string;
  provinces: FeatureCollection<Geometry, RegionProperties>;
  counties: FeatureCollection<Geometry, RegionProperties>;
}

interface Palette {
  id: string;
  fa: string;
  en: string;
  colors: string[];
}

const geoData = iranGeoRaw as IranGeoData;
const WIDTH = 1200;
const HEIGHT = 900;

const PALETTES: Palette[] = [
  { id: "cobalt", fa: "کبالت", en: "Cobalt", colors: ["#e7edff", "#bdccff", "#879eff", "#536fe8", "#2849be"] },
  { id: "cypress", fa: "سرو", en: "Cypress", colors: ["#e6f3ef", "#b5dacf", "#79b9a6", "#3d917c", "#176653"] },
  { id: "saffron", fa: "زعفران", en: "Saffron", colors: ["#fff2d8", "#f8d594", "#eeb452", "#cc8627", "#94570f"] },
  { id: "plum", fa: "آلو", en: "Plum", colors: ["#f4e9f3", "#dbbfd9", "#bd8ab9", "#925d90", "#663665"] },
  { id: "mono", fa: "خاکستری", en: "Graphite", colors: ["#e9edf2", "#c7ced8", "#9ca8b6", "#6f7d8d", "#414e5d"] },
];

const copy = {
  fa: {
    brand: "نقشه‌ساز ایران",
    tagline: "داده را وارد کنید؛ تصویر آماده تحویل بگیرید.",
    language: "EN",
    provinces: "استان‌ها",
    counties: "شهرستان‌ها",
    selectProvince: "انتخاب استان",
    data: "داده",
    manual: "ورود دستی",
    file: "Excel / JSON",
    upload: "انتخاب فایل",
    uploadHint: "ستون اول نام منطقه و ستون دوم مقدار عددی باشد.",
    matched: "ردیف تطبیق داده شد",
    value: "مقدار",
    region: "منطقه",
    style: "ظاهر نقشه",
    palette: "ترکیب رنگ",
    labels: "نام مناطق",
    show: "نمایش",
    hide: "پنهان",
    title: "عنوان",
    subtitle: "زیرعنوان",
    font: "فونت نقشه",
    fontHint: "TTF، OTF، WOFF یا WOFF2",
    export: "دریافت تصویر",
    quality: "کیفیت",
    png: "دریافت PNG",
    jpg: "دریافت JPG",
    reset: "بازنشانی نمونه",
    back: "بازگشت به ایران",
    mapTitle: "تعداد شهرستان‌ها به تفکیک استان",
    mapSubtitle: "دادهٔ نمونه بر اساس تقسیمات موجود در نقشه",
    emptyTitle: "برای این نما هنوز داده‌ای وارد نشده است",
    emptyHint: "مقادیر را دستی بنویسید یا فایل Excel / JSON بارگذاری کنید.",
    source: "دادهٔ مرزی: react-iran-maps · تقسیمات اداری ۱۴۰۰/۲۰۲۱ · MIT",
    invalid: "فایل خوانده نشد. قالب ستون‌ها یا JSON را بررسی کنید.",
    loaded: "داده‌ها روی نقشه اعمال شد.",
  },
  en: {
    brand: "Iran Map Studio",
    tagline: "Add data. Export a finished map.",
    language: "فا",
    provinces: "Provinces",
    counties: "Counties",
    selectProvince: "Select province",
    data: "Data",
    manual: "Manual entry",
    file: "Excel / JSON",
    upload: "Choose file",
    uploadHint: "Use region names in column one and numeric values in column two.",
    matched: "rows matched",
    value: "Value",
    region: "Region",
    style: "Map style",
    palette: "Colour palette",
    labels: "Region labels",
    show: "Show",
    hide: "Hide",
    title: "Title",
    subtitle: "Subtitle",
    font: "Map font",
    fontHint: "TTF, OTF, WOFF or WOFF2",
    export: "Export image",
    quality: "Quality",
    png: "Download PNG",
    jpg: "Download JPG",
    reset: "Reset sample",
    back: "Back to Iran",
    mapTitle: "County count by province",
    mapSubtitle: "Sample data derived from the map’s administrative boundaries",
    emptyTitle: "No values have been added for this view",
    emptyHint: "Enter values manually or upload an Excel / JSON file.",
    source: "Boundary data: react-iran-maps · 1400/2021 administrative divisions · MIT",
    invalid: "The file could not be read. Check its columns or JSON structure.",
    loaded: "Data applied to the map.",
  },
};

function normalizeName(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\s_-]+/g, "");
}

function App() {
  const [language, setLanguage] = useState<Language>("fa");
  const [level, setLevel] = useState<ViewLevel>("province");
  const [selectedProvince, setSelectedProvince] = useState("تهران");
  const [dataMode, setDataMode] = useState<DataMode>("manual");
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      geoData.provinces.features.map((feature) => [feature.properties.id, feature.properties.countyCount ?? 0]),
    ),
  );
  const [paletteId, setPaletteId] = useState("cobalt");
  const [showLabels, setShowLabels] = useState(true);
  const [title, setTitle] = useState(copy.fa.mapTitle);
  const [subtitle, setSubtitle] = useState(copy.fa.mapSubtitle);
  const [quality, setQuality] = useState(2);
  const [fontName, setFontName] = useState("Vazirmatn Variable");
  const [fontDataUrl, setFontDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; value?: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const regionsRef = useRef<RegionFeature[]>([]);
  const levelRef = useRef<ViewLevel>(level);
  const t = copy[language];
  const direction = language === "fa" ? "rtl" : "ltr";

  const provinces = useMemo(
    () => [...geoData.provinces.features].sort((a, b) => a.properties.nameFa.localeCompare(b.properties.nameFa, "fa")),
    [],
  );

  const visibleRegions = useMemo<RegionFeature[]>(() => {
    if (level === "province") return provinces;
    return geoData.counties.features
      .filter((feature) => feature.properties.provinceFa === selectedProvince)
      .sort((a, b) => a.properties.nameFa.localeCompare(b.properties.nameFa, "fa"));
  }, [level, provinces, selectedProvince]);
  regionsRef.current = visibleRegions;
  levelRef.current = level;

  const palette = PALETTES.find((item) => item.id === paletteId) ?? PALETTES[0];
  const visibleValues = visibleRegions.map((feature) => values[feature.properties.id]).filter(Number.isFinite);
  const hasData = visibleValues.length > 0;
  const minValue = hasData ? Math.min(...visibleValues) : 0;
  const maxValue = hasData ? Math.max(...visibleValues) : 1;
  const collection = useMemo<FeatureCollection<Geometry, RegionProperties>>(
    () => ({ type: "FeatureCollection", features: visibleRegions }),
    [visibleRegions],
  );
  const projection = useMemo(
    () => geoMercator().fitExtent([[78, 132], [1122, 745]], collection),
    [collection],
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  const regionName = (feature: RegionFeature) =>
    language === "fa" ? feature.properties.nameFa : feature.properties.nameEn;

  const colorFor = (value: number | undefined): string => {
    if (!Number.isFinite(value)) return "#edf0f5";
    if (maxValue === minValue) return palette.colors[palette.colors.length - 1];
    const ratio = ((value ?? minValue) - minValue) / (maxValue - minValue);
    return palette.colors[Math.min(palette.colors.length - 1, Math.floor(ratio * palette.colors.length))];
  };

  const resetSample = () => {
    setLevel("province");
    setValues(Object.fromEntries(provinces.map((feature) => [feature.properties.id, feature.properties.countyCount ?? 0])));
    setTitle(t.mapTitle);
    setSubtitle(t.mapSubtitle);
    setStatus("");
  };

  const openProvince = (feature: RegionFeature) => {
    if (level !== "province") return;
    setSelectedProvince(feature.properties.nameFa);
    setLevel("county");
    setTitle(language === "fa" ? `نقشهٔ شهرستان‌های ${feature.properties.nameFa}` : `${feature.properties.nameEn} counties`);
    setSubtitle("");
    setTooltip(null);
  };

  const setRegionValue = (id: string, raw: string) => {
    if (raw === "") {
      setValues((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      return;
    }
    const parsed = Number(raw.replace(/,/g, ""));
    if (Number.isFinite(parsed)) setValues((current) => ({ ...current, [id]: parsed }));
  };

  const applyRows = (rows: Array<[string, unknown]>) => {
    const lookup = new Map<string, string>();
    for (const feature of visibleRegions) {
      lookup.set(normalizeName(feature.properties.nameFa), feature.properties.id);
      lookup.set(normalizeName(feature.properties.nameEn), feature.properties.id);
    }
    let matched = 0;
    const next = { ...values };
    for (const [name, rawValue] of rows) {
      const id = lookup.get(normalizeName(String(name ?? "")));
      const numeric = Number(String(rawValue ?? "").replace(/,/g, ""));
      if (id && Number.isFinite(numeric)) {
        next[id] = numeric;
        matched += 1;
      }
    }
    setValues(next);
    setStatus(`${matched} ${t.matched}`);
  };

  const readDataFile = async (file: File) => {
    try {
      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed: unknown = JSON.parse(await file.text());
        if (Array.isArray(parsed)) {
          const rows = parsed.map((item): [string, unknown] => {
            if (Array.isArray(item)) return [String(item[0] ?? ""), item[1]];
            if (typeof item === "object" && item !== null) {
              const record = item as Record<string, unknown>;
              return [String(record.name ?? record.region ?? record.نام ?? ""), record.value ?? record.مقدار];
            }
            return ["", undefined];
          });
          applyRows(rows);
        } else if (typeof parsed === "object" && parsed !== null) {
          applyRows(Object.entries(parsed as Record<string, unknown>));
        } else throw new Error("Unsupported JSON");
      } else {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(await file.arrayBuffer());
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
        applyRows(rows.slice(1).map((row) => [String(row[0] ?? ""), row[1]]));
      }
    } catch {
      setStatus(t.invalid);
    }
  };

  const loadFont = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const family = `UserMapFont-${Date.now()}`;
    const face = new FontFace(family, `url(${dataUrl})`);
    await face.load();
    document.fonts.add(face);
    setFontName(family);
    setFontDataUrl(dataUrl);
  };

  const downloadMap = async (format: "png" | "jpeg") => {
    if (!svgRef.current) return;
    try {
      const { Canvg } = await import("canvg");
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(WIDTH * quality));
    clone.setAttribute("height", String(HEIGHT * quality));
    const safeFontName = fontName.replace(/["']/g, "");
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `${fontDataUrl ? `@font-face{font-family:"${safeFontName}";src:url(${fontDataUrl})}` : ""}
      text{font-family:"${safeFontName}",sans-serif}
      .svg-title{font-size:30px;font-weight:800}.svg-subtitle{font-size:16px}
      .region-label{font-size:12px;font-weight:750;paint-order:stroke;stroke:#f7f8fb;stroke-width:3px;stroke-linejoin:round}
      .county-label{font-size:10px}.legend-label{font-size:12px;font-variant-numeric:tabular-nums}
      .source-label{font-size:10px}.empty-title{font-size:18px;font-weight:750}.empty-hint{font-size:13px}`;
    clone.prepend(style);
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH * quality;
    canvas.height = HEIGHT * quality;
    const context = canvas.getContext("2d");
    if (!context) return;
    const renderer = Canvg.fromString(context, new XMLSerializer().serializeToString(clone), {
      ignoreAnimation: true,
      ignoreMouse: true,
    });
    await renderer.render();
      canvas.toBlob((output) => {
      if (!output) return;
      const downloadUrl = URL.createObjectURL(output);
      const link = document.createElement("a");
      link.download = `iran-map-${level}-${quality}x.${format === "jpeg" ? "jpg" : "png"}`;
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
        setStatus(language === "fa" ? "دانلود تصویر آغاز شد." : "Image download started.");
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1_000);
      }, `image/${format}`, 0.94);
    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      console.error(`Export failed: ${message}`);
      setStatus(language === "fa" ? `خروجی ساخته نشد: ${message}` : `Export failed: ${message}`);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool?: (tool: unknown, options?: { signal: AbortSignal }) => void } }).modelContext;
    if (!context?.registerTool) return;
    context.registerTool(
      {
        name: "set_map_values",
        title: "Set map values",
        description: "Apply numeric values to currently visible Iranian provinces or counties using Persian or English region names.",
        inputSchema: {
          type: "object",
          properties: { values: { type: "object", additionalProperties: { type: "number" } } },
          required: ["values"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input: unknown) {
          const payload = input as { values?: Record<string, number> };
          if (!payload.values || typeof payload.values !== "object") throw new Error("values must be an object");
          const lookup = new Map<string, string>();
          for (const feature of regionsRef.current) {
            lookup.set(normalizeName(feature.properties.nameFa), feature.properties.id);
            lookup.set(normalizeName(feature.properties.nameEn), feature.properties.id);
          }
          let applied = 0;
          setValues((current) => {
            const next = { ...current };
            for (const [name, value] of Object.entries(payload.values!)) {
              const id = lookup.get(normalizeName(name));
              if (id && Number.isFinite(value)) {
                next[id] = value;
                applied += 1;
              }
            }
            return next;
          });
          return { applied, level: levelRef.current };
        },
      },
    );
  }, []);

  const legendValues = palette.colors.map((_, index) =>
    minValue + ((maxValue - minValue) * index) / Math.max(1, palette.colors.length - 1),
  );

  return (
    <div className="app" dir={direction}>
      <header className="topbar">
        <div className="brand"><MapPinned aria-hidden="true" /><span>{t.brand}</span></div>
        <p>{t.tagline}</p>
        <button className="language-btn" onClick={() => setLanguage(language === "fa" ? "en" : "fa")}>{t.language}</button>
      </header>

      <main className="workspace">
        <aside className="control-panel" aria-label={t.data}>
          <section className="panel-section">
            <div className="section-heading"><span className="section-icon"><MapPinned size={17} aria-hidden="true" /></span><h2>{language === "fa" ? "سطح نقشه" : "Map level"}</h2></div>
            <div className="segmented" role="tablist" aria-label={language === "fa" ? "سطح نقشه" : "Map level"}>
              <button className={level === "province" ? "is-active" : ""} onClick={() => setLevel("province")}>{t.provinces}</button>
              <button className={level === "county" ? "is-active" : ""} onClick={() => setLevel("county")}>{t.counties}</button>
            </div>
            {level === "county" && (
              <label className="field-label">{t.selectProvince}
                <select value={selectedProvince} onChange={(event) => setSelectedProvince(event.target.value)}>
                  {provinces.map((province) => <option key={province.properties.id} value={province.properties.nameFa}>{language === "fa" ? province.properties.nameFa : province.properties.nameEn}</option>)}
                </select>
              </label>
            )}
          </section>

          <section className="panel-section data-section">
            <div className="section-heading"><span className="section-icon"><PencilLine size={17} aria-hidden="true" /></span><h2>{t.data}</h2></div>
            <div className="segmented" role="tablist">
              <button className={dataMode === "manual" ? "is-active" : ""} onClick={() => setDataMode("manual")}><PencilLine size={15} aria-hidden="true" />{t.manual}</button>
              <button className={dataMode === "file" ? "is-active" : ""} onClick={() => setDataMode("file")}><FileSpreadsheet size={15} aria-hidden="true" />{t.file}</button>
            </div>
            {dataMode === "manual" ? (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead><tr><th>{t.region}</th><th>{t.value}</th></tr></thead>
                  <tbody>{visibleRegions.map((feature) => (
                    <tr key={feature.properties.id}>
                      <td>{regionName(feature)}</td>
                      <td><input inputMode="decimal" aria-label={`${t.value} ${regionName(feature)}`} value={values[feature.properties.id] ?? ""} onChange={(event) => setRegionValue(feature.properties.id, event.target.value)} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : (
              <div className="upload-zone">
                <Upload aria-hidden="true" />
                <strong>{t.upload}</strong>
                <span>{t.uploadHint}</span>
                <label className="file-btn"><input type="file" accept=".xlsx,.xls,.csv,.json,application/json" onChange={(event) => event.target.files?.[0] && void readDataFile(event.target.files[0])} /><FileSpreadsheet size={16} aria-hidden="true" />{t.upload}</label>
                <div className="format-row"><span><FileSpreadsheet size={14} aria-hidden="true" />XLSX</span><span><Braces size={14} aria-hidden="true" />JSON</span></div>
              </div>
            )}
            {status && <p className="status" role="status">{status}</p>}
          </section>

          <section className="panel-section">
            <div className="section-heading"><span className="section-icon"><Type size={17} aria-hidden="true" /></span><h2>{t.style}</h2></div>
            <label className="field-label">{t.palette}
              <div className="palette-list">{PALETTES.map((item) => (
                <button key={item.id} className={`palette-option ${paletteId === item.id ? "is-active" : ""}`} onClick={() => setPaletteId(item.id)} aria-label={language === "fa" ? item.fa : item.en}>
                  <span className="swatches">{item.colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span>
                  <span>{language === "fa" ? item.fa : item.en}</span>
                </button>
              ))}</div>
            </label>
            <div className="toggle-row"><span>{t.labels}</span><button className="icon-text-btn" onClick={() => setShowLabels((current) => !current)}>{showLabels ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}{showLabels ? t.show : t.hide}</button></div>
            <label className="field-label">{t.title}<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="field-label">{t.subtitle}<input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} /></label>
            <label className="font-upload"><input type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" onChange={(event) => event.target.files?.[0] && void loadFont(event.target.files[0])} /><Type size={16} aria-hidden="true" /><span><strong>{t.font}</strong><small>{t.fontHint}</small></span></label>
          </section>
        </aside>

        <section className="preview-column">
          <div className="preview-toolbar">
            <div>
              {level === "county" && <button className="back-btn" onClick={() => setLevel("province")}><ArrowRight size={16} aria-hidden="true" />{t.back}</button>}
              <span className="view-label">{level === "province" ? t.provinces : `${t.counties} · ${language === "fa" ? selectedProvince : provinces.find((item) => item.properties.nameFa === selectedProvince)?.properties.nameEn}`}</span>
            </div>
            <button className="reset-btn" onClick={resetSample}><RotateCcw size={15} aria-hidden="true" />{t.reset}</button>
          </div>

          <figure className="map-frame">
            <svg ref={svgRef} className="map-svg" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby="map-svg-title map-svg-desc" style={{ fontFamily: fontName }}>
              <title id="map-svg-title">{title}</title><desc id="map-svg-desc">{subtitle}</desc>
              <rect width={WIDTH} height={HEIGHT} fill="#f7f8fb" />
              <text x={WIDTH / 2} y="54" textAnchor="middle" className="svg-title" fill="#1f2937">{title}</text>
              <text x={WIDTH / 2} y="88" textAnchor="middle" className="svg-subtitle" fill="#667085">{subtitle}</text>
              <g className="map-regions">
                {visibleRegions.map((feature) => {
                  const value = values[feature.properties.id];
                  const name = regionName(feature);
                  const centroid = path.centroid(feature);
                  return (
                    <g key={feature.properties.id}>
                      <path
                        d={path(feature) ?? ""}
                        fill={colorFor(value)}
                        stroke="#f7f8fb"
                        strokeWidth={level === "province" ? 2.2 : 1.5}
                        tabIndex={0}
                        role="button"
                        aria-label={`${name}${Number.isFinite(value) ? `: ${value}` : ""}`}
                        onClick={() => openProvince(feature)}
                        onKeyDown={(event) => event.key === "Enter" && openProvince(feature)}
                        onMouseMove={(event) => setTooltip({ x: event.clientX, y: event.clientY, name, value })}
                        onMouseLeave={() => setTooltip(null)}
                        onFocus={(event) => {
                          const box = event.currentTarget.getBoundingClientRect();
                          setTooltip({ x: box.left + box.width / 2, y: box.top, name, value });
                        }}
                        onBlur={() => setTooltip(null)}
                      />
                      {showLabels && Number.isFinite(centroid[0]) && (
                        <text x={centroid[0]} y={centroid[1]} textAnchor="middle" dominantBaseline="central" className={level === "province" ? "region-label" : "region-label county-label"} fill="#243244" pointerEvents="none">{name}</text>
                      )}
                    </g>
                  );
                })}
              </g>
              {!hasData && <g><rect x="330" y="375" width="540" height="105" rx="10" fill="#ffffff" stroke="#d7dde7" /><text x="600" y="418" textAnchor="middle" className="empty-title" fill="#344054">{t.emptyTitle}</text><text x="600" y="451" textAnchor="middle" className="empty-hint" fill="#667085">{t.emptyHint}</text></g>}
              {hasData && <g transform="translate(270 818)">{palette.colors.map((color, index) => <rect key={color} x={index * 132} width="132" height="18" fill={color} />)}{legendValues.map((value, index) => <text key={index} x={index * 132} y="43" textAnchor={index === 0 ? "start" : index === legendValues.length - 1 ? "end" : "middle"} className="legend-label" fill="#667085">{new Intl.NumberFormat(language === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 1 }).format(value)}</text>)}</g>}
              <text x="40" y="874" className="source-label" fill="#798394">{t.source}</text>
            </svg>
            <figcaption>{t.source}</figcaption>
          </figure>

          <section className="export-bar">
            <div className="export-heading"><ImageDown size={18} aria-hidden="true" /><div><strong>{t.export}</strong><span>{WIDTH * quality} × {HEIGHT * quality} px</span></div></div>
            <div className="quality-picker" aria-label={t.quality}>{[1, 2, 4].map((item) => <button key={item} className={quality === item ? "is-active" : ""} onClick={() => setQuality(item)}>{item}×</button>)}</div>
            <div className="download-actions"><button className="download-primary" onClick={() => void downloadMap("png")}><Download size={16} aria-hidden="true" />{t.png}</button><button className="download-secondary" onClick={() => void downloadMap("jpeg")}><Download size={16} aria-hidden="true" />{t.jpg}</button></div>
          </section>
        </section>
      </main>

      {tooltip && <div className="map-tooltip" style={{ insetInlineStart: tooltip.x + 14, top: tooltip.y + 14 }}><strong>{tooltip.name}</strong>{Number.isFinite(tooltip.value) && <span>{new Intl.NumberFormat(language === "fa" ? "fa-IR" : "en-US").format(tooltip.value!)}</span>}</div>}
      <footer className="foot-line"><span>{t.brand}</span><span>{language === "fa" ? "رایگان · بدون سرور · داده‌ها روی دستگاه شما" : "Free · serverless · your data stays on your device"}</span></footer>
    </div>
  );
}

export default App;

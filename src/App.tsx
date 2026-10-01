import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import {
  AlertCircle,
  ArrowRight,
  Braces,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  ImageDown,
  MapPinned,
  MousePointer2,
  Palette as PaletteIcon,
  PencilLine,
  RotateCcw,
  Type,
  Upload,
} from "lucide-react";
import iranGeoRaw from "./data/iran-geo.json";

type Language = "fa" | "en";
type ViewLevel = "province" | "county";
type DataMode = "manual" | "file";
type WorkflowStep = "data" | "style" | "export";
type ScaleMode = "linear" | "quantile" | "log";
type LegendPosition = "top" | "bottom";

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

interface ImportIssue {
  name: string;
  value: number;
  suggestionId?: string;
  suggestionName?: string;
}

interface ImportSummary {
  matched: number;
  total: number;
  issues: ImportIssue[];
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
  { id: "turquoise", fa: "فیروزه", en: "Turquoise", colors: ["#e2f7f5", "#afe5df", "#6dc9c0", "#2aa89c", "#08756c"] },
  { id: "rose", fa: "رز", en: "Rose", colors: ["#fdebed", "#f7bec7", "#ea8698", "#d64f6a", "#a92545"] },
  { id: "indigo", fa: "نیلی", en: "Indigo", colors: ["#ecebff", "#ccc8ff", "#9f98f3", "#7168d8", "#4840a8"] },
  { id: "copper", fa: "مس", en: "Copper", colors: ["#faeee6", "#eac8b2", "#d49a78", "#b76a43", "#7f4024"] },
  { id: "olive", fa: "زیتون", en: "Olive", colors: ["#f0f2df", "#d4d9a9", "#afb970", "#84943f", "#5b681f"] },
  { id: "ocean", fa: "اقیانوس", en: "Ocean", colors: ["#e2f1fb", "#add7ef", "#6bb5dd", "#318bc0", "#145f91"] },
  { id: "ember", fa: "اخگر", en: "Ember", colors: ["#fff0e6", "#ffc8a5", "#f7955e", "#dc5f2d", "#9b3217"] },
  { id: "forest", fa: "جنگل", en: "Forest", colors: ["#e9f2e7", "#c1d9bc", "#8eb987", "#5b9157", "#356635"] },
  { id: "lagoon", fa: "مرداب", en: "Lagoon", colors: ["#e2f3f1", "#addbd4", "#70bcb1", "#39988d", "#176c65"] },
  { id: "sunset", fa: "غروب", en: "Sunset", colors: ["#fff0dd", "#facba2", "#ee9c72", "#d26459", "#963b53"] },
  { id: "berry", fa: "تمشک", en: "Berry", colors: ["#f7e8f1", "#e4bad2", "#ca82ad", "#a84d83", "#762b5e"] },
];

const GITHUB_URL = "https://github.com/Hhhkarimi/IranMapStudio";
const LINKEDIN_URL = "https://www.linkedin.com/in/hossein-karimi-8a452153/";

function GithubMark({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.29-5.28-1.29-5.28-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.98 10.98 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.4-2.71 5.38-5.29 5.67.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" /></svg>;
}

function LinkedinMark({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.1 20.45H3.54V8.98H7.1v11.47Z" /></svg>;
}

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
    customPalette: "پالت سفارشی",
    labels: "نام مناطق",
    show: "نمایش",
    hide: "پنهان",
    title: "عنوان",
    subtitle: "زیرعنوان",
    titleSize: "اندازه عنوان",
    subtitleSize: "اندازه زیرعنوان",
    provinceSize: "اندازه نام استان‌ها",
    countySize: "اندازه نام شهرستان‌ها",
    font: "فونت نقشه",
    fontHint: "TTF، OTF، WOFF یا WOFF2",
    export: "دریافت تصویر",
    quality: "کیفیت",
    png: "PNG شفاف",
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
    madeBy: "تهیه‌شده توسط حسین کریمی",
    github: "گیت‌هاب",
    linkedin: "لینکدین",
    stepData: "داده",
    stepStyle: "طراحی",
    stepExport: "خروجی",
    next: "مرحله بعد",
    matchingReport: "گزارش تطبیق",
    needsReview: "نیازمند بررسی",
    useSuggestion: "تأیید پیشنهاد",
    complete: "تکمیل داده‌ها",
    editOnMap: "برای ویرایش مقدار، روی یک ناحیه کلیک کنید.",
    editValue: "ویرایش مستقیم مقدار",
    openCounties: "نمایش شهرستان‌ها",
    scaleMethod: "روش بازه‌بندی",
    linear: "خطی",
    quantile: "صدکی",
    logarithmic: "لگاریتمی",
    classes: "تعداد طبقات",
    noDataColor: "رنگ دادهٔ خالی",
    legendPosition: "محل راهنما",
    top: "بالا",
    bottom: "پایین",
    showLegend: "نمایش راهنمای رنگ",
    exportReady: "نقشه برای خروجی آماده است",
    exportCheck: "عنوان، داده و ابعاد خروجی را یک‌بار بررسی کنید.",
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
    customPalette: "Custom palette",
    labels: "Region labels",
    show: "Show",
    hide: "Hide",
    title: "Title",
    subtitle: "Subtitle",
    titleSize: "Title size",
    subtitleSize: "Subtitle size",
    provinceSize: "Province label size",
    countySize: "County label size",
    font: "Map font",
    fontHint: "TTF, OTF, WOFF or WOFF2",
    export: "Export image",
    quality: "Quality",
    png: "Transparent PNG",
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
    madeBy: "Made by Hossein Karimi",
    github: "GitHub",
    linkedin: "LinkedIn",
    stepData: "Data",
    stepStyle: "Design",
    stepExport: "Export",
    next: "Next step",
    matchingReport: "Matching report",
    needsReview: "Needs review",
    useSuggestion: "Accept suggestion",
    complete: "Data complete",
    editOnMap: "Click a region to edit its value directly.",
    editValue: "Edit value directly",
    openCounties: "View counties",
    scaleMethod: "Classification",
    linear: "Linear",
    quantile: "Quantile",
    logarithmic: "Logarithmic",
    classes: "Number of classes",
    noDataColor: "No-data colour",
    legendPosition: "Legend position",
    top: "Top",
    bottom: "Bottom",
    showLegend: "Show colour legend",
    exportReady: "Map is ready to export",
    exportCheck: "Review the title, data, and output dimensions once.",
  },
};

function normalizeName(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\s_-]+/g, "")
    .replace(/^(استان|شهرستان|ostan|province|county|shahrestan)/, "")
    .replace(/(province|county)$/g, "");
}

function editDistance(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let previous = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const current = row[rightIndex];
      row[rightIndex] = Math.min(
        row[rightIndex] + 1,
        row[rightIndex - 1] + 1,
        previous + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      previous = current;
    }
  }
  return row[right.length];
}

function similarity(left: string, right: string): number {
  const longest = Math.max(left.length, right.length);
  return longest === 0 ? 1 : 1 - editDistance(left, right) / longest;
}

function interpolateHex(start: string, end: string, ratio: number): string {
  const from = [1, 3, 5].map((offset) => Number.parseInt(start.slice(offset, offset + 2), 16));
  const to = [1, 3, 5].map((offset) => Number.parseInt(end.slice(offset, offset + 2), 16));
  return `#${from.map((value, index) => Math.round(value + (to[index] - value) * ratio).toString(16).padStart(2, "0")).join("")}`;
}

function samplePalette(colors: string[], count: number): string[] {
  if (count === colors.length) return colors;
  return Array.from({ length: count }, (_, index) => {
    const position = (index / Math.max(1, count - 1)) * (colors.length - 1);
    const lower = Math.floor(position);
    const upper = Math.min(colors.length - 1, Math.ceil(position));
    return interpolateHex(colors[lower], colors[upper], position - lower);
  });
}

function App() {
  const [language, setLanguage] = useState<Language>("fa");
  const [level, setLevel] = useState<ViewLevel>("province");
  const [selectedProvince, setSelectedProvince] = useState("تهران");
  const [dataMode, setDataMode] = useState<DataMode>("manual");
  const [activeStep, setActiveStep] = useState<WorkflowStep>("data");
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      geoData.provinces.features.map((feature) => [feature.properties.id, feature.properties.countyCount ?? 0]),
    ),
  );
  const [paletteId, setPaletteId] = useState("cobalt");
  const [customColors, setCustomColors] = useState(["#eef2ff", "#c7d2fe", "#818cf8", "#4f46e5", "#312e81"]);
  const [showLabels, setShowLabels] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [scaleMode, setScaleMode] = useState<ScaleMode>("linear");
  const [classCount, setClassCount] = useState(5);
  const [noDataColor, setNoDataColor] = useState("#edf0f5");
  const [legendPosition, setLegendPosition] = useState<LegendPosition>("bottom");
  const [title, setTitle] = useState(copy.fa.mapTitle);
  const [subtitle, setSubtitle] = useState(copy.fa.mapSubtitle);
  const [titleFontSize, setTitleFontSize] = useState(30);
  const [subtitleFontSize, setSubtitleFontSize] = useState(16);
  const [provinceFontSize, setProvinceFontSize] = useState(12);
  const [countyFontSize, setCountyFontSize] = useState(10);
  const [quality, setQuality] = useState(2);
  const [fontName, setFontName] = useState("Vazirmatn Variable");
  const [fontDataUrl, setFontDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
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

  const palette = paletteId === "custom"
    ? { id: "custom", fa: copy.fa.customPalette, en: copy.en.customPalette, colors: customColors }
    : PALETTES.find((item) => item.id === paletteId) ?? PALETTES[0];
  const visibleValues = visibleRegions.map((feature) => values[feature.properties.id]).filter(Number.isFinite);
  const hasData = visibleValues.length > 0;
  const minValue = hasData ? Math.min(...visibleValues) : 0;
  const maxValue = hasData ? Math.max(...visibleValues) : 1;
  const scaleColors = useMemo(() => samplePalette(palette.colors, classCount), [classCount, palette.colors]);
  const scaleBreaks = useMemo(() => {
    if (!hasData || maxValue === minValue) return Array.from({ length: classCount + 1 }, () => minValue);
    if (scaleMode === "quantile") {
      const sorted = [...visibleValues].sort((a, b) => a - b);
      return Array.from({ length: classCount + 1 }, (_, index) => {
        const position = (index / classCount) * (sorted.length - 1);
        const lower = Math.floor(position);
        const upper = Math.ceil(position);
        return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
      });
    }
    if (scaleMode === "log" && maxValue > 0) {
      const positives = visibleValues.filter((value) => value > 0);
      const logMin = Math.log(Math.min(...positives));
      const logMax = Math.log(maxValue);
      return Array.from({ length: classCount + 1 }, (_, index) => Math.exp(logMin + ((logMax - logMin) * index) / classCount));
    }
    return Array.from({ length: classCount + 1 }, (_, index) => minValue + ((maxValue - minValue) * index) / classCount);
  }, [classCount, hasData, maxValue, minValue, scaleMode, visibleValues]);
  const selectedRegion = visibleRegions.find((feature) => feature.properties.id === selectedRegionId) ?? null;
  const completedCount = visibleRegions.filter((feature) => Number.isFinite(values[feature.properties.id])).length;
  const completionPercent = visibleRegions.length === 0 ? 0 : Math.round((completedCount / visibleRegions.length) * 100);
  const collection = useMemo<FeatureCollection<Geometry, RegionProperties>>(
    () => ({ type: "FeatureCollection", features: visibleRegions }),
    [visibleRegions],
  );
  const projection = useMemo(
    () => geoMercator().fitExtent([[78, showLegend && legendPosition === "top" ? 174 : 132], [1122, 745]], collection),
    [collection, legendPosition, showLegend],
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  const regionName = (feature: RegionFeature) =>
    language === "fa" ? feature.properties.nameFa : feature.properties.nameEn;

  const colorFor = (value: number | undefined): string => {
    if (!Number.isFinite(value)) return noDataColor;
    if (maxValue === minValue) return scaleColors[scaleColors.length - 1];
    if (scaleMode === "log" && (value ?? 0) <= 0) return scaleColors[0];
    const index = scaleBreaks.findIndex((boundary, boundaryIndex) => boundaryIndex > 0 && (value ?? minValue) <= boundary);
    return scaleColors[index < 0 ? scaleColors.length - 1 : Math.max(0, index - 1)];
  };

  const resetSample = () => {
    setLevel("province");
    setValues(Object.fromEntries(provinces.map((feature) => [feature.properties.id, feature.properties.countyCount ?? 0])));
    setTitle(t.mapTitle);
    setSubtitle(t.mapSubtitle);
    setStatus("");
    setImportSummary(null);
    setSelectedRegionId(null);
  };

  const openProvince = (feature: RegionFeature) => {
    if (level !== "province") return;
    setSelectedProvince(feature.properties.nameFa);
    setLevel("county");
    setTitle(language === "fa" ? `نقشهٔ شهرستان‌های ${feature.properties.nameFa}` : `${feature.properties.nameEn} counties`);
    setSubtitle("");
    setTooltip(null);
    setSelectedRegionId(null);
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
    const lookup = new Map<string, RegionFeature>();
    for (const feature of visibleRegions) {
      lookup.set(normalizeName(feature.properties.nameFa), feature);
      lookup.set(normalizeName(feature.properties.nameEn), feature);
    }
    let matched = 0;
    let validRows = 0;
    const issues: ImportIssue[] = [];
    const next = { ...values };
    for (const [name, rawValue] of rows) {
      const rawName = String(name ?? "");
      const normalized = normalizeName(rawName);
      const numeric = Number(String(rawValue ?? "").replace(/,/g, ""));
      if (!rawName.trim() || !Number.isFinite(numeric)) continue;
      validRows += 1;
      const exact = lookup.get(normalized);
      if (exact) {
        next[exact.properties.id] = numeric;
        matched += 1;
        continue;
      }
      const candidates = visibleRegions
        .map((feature) => ({
          feature,
          score: Math.max(
            similarity(normalized, normalizeName(feature.properties.nameFa)),
            similarity(normalized, normalizeName(feature.properties.nameEn)),
          ),
        }))
        .sort((a, b) => b.score - a.score);
      const suggestion = candidates[0];
      issues.push({
        name: rawName,
        value: numeric,
        suggestionId: suggestion?.score >= 0.58 ? suggestion.feature.properties.id : undefined,
        suggestionName: suggestion?.score >= 0.58 ? regionName(suggestion.feature) : undefined,
      });
    }
    setValues(next);
    setImportSummary({ matched, total: validRows, issues });
    setStatus(`${matched} ${t.matched}`);
  };

  const acceptSuggestion = (issue: ImportIssue) => {
    if (!issue.suggestionId) return;
    setValues((current) => ({ ...current, [issue.suggestionId!]: issue.value }));
    setImportSummary((current) => current ? {
      ...current,
      matched: current.matched + 1,
      issues: current.issues.filter((item) => item !== issue),
    } : current);
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
    if (format === "png") clone.querySelector(".export-background")?.remove();
    const safeFontName = fontName.replace(/["']/g, "");
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `${fontDataUrl ? `@font-face{font-family:"${safeFontName}";src:url(${fontDataUrl})}` : ""}
      text{font-family:"${safeFontName}",sans-serif}
      .svg-title{font-size:${titleFontSize}px;font-weight:800}.svg-subtitle{font-size:${subtitleFontSize}px}
      .region-label{font-size:${provinceFontSize}px;font-weight:750;paint-order:stroke;stroke:#f7f8fb;stroke-width:3px;stroke-linejoin:round}
      .county-label{font-size:${countyFontSize}px}.legend-label{font-size:12px;font-variant-numeric:tabular-nums}
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

  const titleY = Math.max(54, titleFontSize + 10);
  const subtitleY = titleY + subtitleFontSize + 10;

  return (
    <div className="app" dir={direction}>
      <header className="topbar">
        <div className="brand"><MapPinned aria-hidden="true" /><span>{t.brand}</span></div>
        <p>{t.tagline}</p>
        <button className="language-btn" onClick={() => setLanguage(language === "fa" ? "en" : "fa")}>{t.language}</button>
      </header>

      <main className="workspace">
        <aside className="control-panel" aria-label={t.data}>
          <nav className="workflow-steps" aria-label={language === "fa" ? "مراحل ساخت نقشه" : "Map workflow"}>
            {([
              ["data", t.stepData],
              ["style", t.stepStyle],
              ["export", t.stepExport],
            ] as Array<[WorkflowStep, string]>).map(([step, label], index) => (
              <button key={step} className={activeStep === step ? "is-active" : ""} aria-current={activeStep === step ? "step" : undefined} onClick={() => setActiveStep(step)}>
                <span>{index + 1}</span>{label}
              </button>
            ))}
          </nav>

          {activeStep === "data" && <>
            <section className="panel-section">
              <div className="section-heading"><span className="section-icon"><MapPinned size={17} aria-hidden="true" /></span><h2>{language === "fa" ? "سطح نقشه" : "Map level"}</h2></div>
              <div className="segmented" role="tablist" aria-label={language === "fa" ? "سطح نقشه" : "Map level"}>
                <button className={level === "province" ? "is-active" : ""} onClick={() => { setLevel("province"); setSelectedRegionId(null); }}>{t.provinces}</button>
                <button className={level === "county" ? "is-active" : ""} onClick={() => { setLevel("county"); setSelectedRegionId(null); }}>{t.counties}</button>
              </div>
              {level === "county" && (
                <label className="field-label">{t.selectProvince}
                  <select value={selectedProvince} onChange={(event) => { setSelectedProvince(event.target.value); setSelectedRegionId(null); }}>
                    {provinces.map((province) => <option key={province.properties.id} value={province.properties.nameFa}>{language === "fa" ? province.properties.nameFa : province.properties.nameEn}</option>)}
                  </select>
                </label>
              )}
              <div className="completion" aria-label={`${t.complete}: ${completionPercent}%`}>
                <div><span>{t.complete}</span><strong>{completedCount}/{visibleRegions.length}</strong></div>
                <span><i style={{ width: `${completionPercent}%` }} /></span>
              </div>
            </section>

            <section className="panel-section data-section">
              <div className="section-heading"><span className="section-icon"><PencilLine size={17} aria-hidden="true" /></span><h2>{t.data}</h2></div>
              <p className="interaction-hint"><MousePointer2 size={16} aria-hidden="true" />{t.editOnMap}</p>
              <div className="segmented" role="tablist">
                <button className={dataMode === "manual" ? "is-active" : ""} onClick={() => setDataMode("manual")}><PencilLine size={15} aria-hidden="true" />{t.manual}</button>
                <button className={dataMode === "file" ? "is-active" : ""} onClick={() => setDataMode("file")}><FileSpreadsheet size={15} aria-hidden="true" />{t.file}</button>
              </div>
              {dataMode === "manual" ? (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead><tr><th>{t.region}</th><th>{t.value}</th></tr></thead>
                    <tbody>{visibleRegions.map((feature) => (
                      <tr key={feature.properties.id} className={selectedRegionId === feature.properties.id ? "is-selected" : ""}>
                        <td><button className="region-row-button" onClick={() => setSelectedRegionId(feature.properties.id)}>{regionName(feature)}</button></td>
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
              {importSummary && <div className="match-report">
                <div className="match-summary"><Check size={16} aria-hidden="true" /><strong>{t.matchingReport}</strong><span>{importSummary.matched}/{importSummary.total}</span></div>
                {importSummary.issues.length > 0 && <div className="match-issues"><p><AlertCircle size={15} aria-hidden="true" />{t.needsReview}</p>{importSummary.issues.map((issue) => (
                  <div className="match-issue" key={`${issue.name}-${issue.value}`}><span><strong>{issue.name}</strong>{issue.suggestionName && <small>← {issue.suggestionName}</small>}</span>{issue.suggestionId && <button onClick={() => acceptSuggestion(issue)}>{t.useSuggestion}</button>}</div>
                ))}</div>}
              </div>}
              <button className="next-step" onClick={() => setActiveStep("style")}>{t.next}{direction === "rtl" ? <ChevronLeft size={17} aria-hidden="true" /> : <ChevronRight size={17} aria-hidden="true" />}</button>
            </section>
          </>}

          {activeStep === "style" && <section className="panel-section">
            <div className="section-heading"><span className="section-icon"><Type size={17} aria-hidden="true" /></span><h2>{t.style}</h2></div>
            <div className="field-label"><span>{t.palette}</span>
              <div className="palette-list">{PALETTES.map((item) => (
                <button key={item.id} className={`palette-option ${paletteId === item.id ? "is-active" : ""}`} onClick={() => setPaletteId(item.id)} aria-label={language === "fa" ? item.fa : item.en}>
                  <span className="swatches">{item.colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span>
                  <span>{language === "fa" ? item.fa : item.en}</span>
                </button>
              ))}</div>
            </div>
            <div className="custom-palette" aria-label={t.customPalette}>
              <button className={`palette-option ${paletteId === "custom" ? "is-active" : ""}`} onClick={() => setPaletteId("custom")}>
                <span className="swatches">{customColors.map((color, index) => <i key={`${color}-${index}`} style={{ backgroundColor: color }} />)}</span>
                <span><PaletteIcon size={15} aria-hidden="true" />{t.customPalette}</span>
              </button>
              <div className="color-inputs">{customColors.map((color, index) => (
                <input key={index} type="color" value={color} aria-label={`${t.customPalette} ${index + 1}`} onChange={(event) => { const next = [...customColors]; next[index] = event.target.value; setCustomColors(next); setPaletteId("custom"); }} />
              ))}</div>
            </div>
            <div className="legend-settings">
              <label className="field-label">{t.scaleMethod}<select value={scaleMode} onChange={(event) => setScaleMode(event.target.value as ScaleMode)}><option value="linear">{t.linear}</option><option value="quantile">{t.quantile}</option><option value="log">{t.logarithmic}</option></select></label>
              <label className="field-label">{t.classes}<select value={classCount} onChange={(event) => setClassCount(Number(event.target.value))}>{[3, 4, 5, 6, 7].map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
              <label className="field-label">{t.legendPosition}<select value={legendPosition} onChange={(event) => setLegendPosition(event.target.value as LegendPosition)}><option value="top">{t.top}</option><option value="bottom">{t.bottom}</option></select></label>
              <label className="field-label color-field">{t.noDataColor}<input type="color" value={noDataColor} onChange={(event) => setNoDataColor(event.target.value)} /></label>
            </div>
            <div className="toggle-row"><span>{t.showLegend}</span><button className="icon-text-btn" onClick={() => setShowLegend((current) => !current)}>{showLegend ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}{showLegend ? t.show : t.hide}</button></div>
            <div className="toggle-row"><span>{t.labels}</span><button className="icon-text-btn" onClick={() => setShowLabels((current) => !current)}>{showLabels ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}{showLabels ? t.show : t.hide}</button></div>
            <label className="field-label">{t.title}<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="field-label">{t.subtitle}<input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} /></label>
            <div className="type-scale-grid">
              {[{ label: t.titleSize, value: titleFontSize, set: setTitleFontSize, min: 18, max: 64 }, { label: t.subtitleSize, value: subtitleFontSize, set: setSubtitleFontSize, min: 10, max: 36 }, { label: t.provinceSize, value: provinceFontSize, set: setProvinceFontSize, min: 7, max: 28 }, { label: t.countySize, value: countyFontSize, set: setCountyFontSize, min: 6, max: 22 }].map((item) => (
                <label className="range-field" key={item.label}><span>{item.label} <output>{item.value} px</output></span><input type="range" min={item.min} max={item.max} value={item.value} onChange={(event) => item.set(Number(event.target.value))} /></label>
              ))}
            </div>
            <label className="font-upload"><input type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" onChange={(event) => event.target.files?.[0] && void loadFont(event.target.files[0])} /><Type size={16} aria-hidden="true" /><span><strong>{t.font}</strong><small>{t.fontHint}</small></span></label>
            <button className="next-step" onClick={() => setActiveStep("export")}>{t.next}{direction === "rtl" ? <ChevronLeft size={17} aria-hidden="true" /> : <ChevronRight size={17} aria-hidden="true" />}</button>
          </section>}

          {activeStep === "export" && <section className="panel-section export-step">
            <div className="section-heading"><span className="section-icon"><ImageDown size={17} aria-hidden="true" /></span><h2>{t.export}</h2></div>
            <div className="export-readiness"><Check size={18} aria-hidden="true" /><div><strong>{t.exportReady}</strong><span>{t.exportCheck}</span></div></div>
            <div className="export-dimensions"><span>{t.quality}</span><strong>{WIDTH * quality} × {HEIGHT * quality} px</strong></div>
            <div className="quality-picker" aria-label={t.quality}>{[1, 2, 4].map((item) => <button key={item} className={quality === item ? "is-active" : ""} onClick={() => setQuality(item)}>{item}×</button>)}</div>
            <button className="download-primary" onClick={() => void downloadMap("png")}><Download size={16} aria-hidden="true" />{t.png}</button>
            <button className="download-secondary" onClick={() => void downloadMap("jpeg")}><Download size={16} aria-hidden="true" />{t.jpg}</button>
          </section>}
        </aside>

        <section className="preview-column">
          <div className="preview-meta">
            <div className="preview-toolbar">
              <div>
                {level === "county" && <button className="back-btn" onClick={() => { setLevel("province"); setSelectedRegionId(null); }}><ArrowRight size={16} aria-hidden="true" />{t.back}</button>}
                <span className="view-label">{level === "province" ? t.provinces : `${t.counties} · ${language === "fa" ? selectedProvince : provinces.find((item) => item.properties.nameFa === selectedProvince)?.properties.nameEn}`}</span>
              </div>
              <button className="reset-btn" onClick={resetSample}><RotateCcw size={15} aria-hidden="true" />{t.reset}</button>
            </div>
            {selectedRegion && <div className="selection-editor" role="group" aria-label={t.editValue}>
              <span><MousePointer2 size={16} aria-hidden="true" /><small>{t.editValue}</small><strong>{regionName(selectedRegion)}</strong></span>
              <label><span>{t.value}</span><input autoFocus inputMode="decimal" value={values[selectedRegion.properties.id] ?? ""} onChange={(event) => setRegionValue(selectedRegion.properties.id, event.target.value)} /></label>
              {level === "province" && <button onClick={() => openProvince(selectedRegion)}>{t.openCounties}{direction === "rtl" ? <ChevronLeft size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}</button>}
            </div>}
          </div>

          <figure className="map-frame">
            <svg ref={svgRef} className="map-svg" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby="map-svg-title map-svg-desc" style={{ fontFamily: fontName }}>
              <title id="map-svg-title">{title}</title><desc id="map-svg-desc">{subtitle}</desc>
              <rect className="export-background" width={WIDTH} height={HEIGHT} fill="#f7f8fb" />
              <text x={WIDTH / 2} y={titleY} textAnchor="middle" className="svg-title" style={{ fontSize: titleFontSize }} fill="#1f2937">{title}</text>
              <text x={WIDTH / 2} y={subtitleY} textAnchor="middle" className="svg-subtitle" style={{ fontSize: subtitleFontSize }} fill="#667085">{subtitle}</text>
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
                        stroke={selectedRegionId === feature.properties.id ? "#2849be" : "#f7f8fb"}
                        strokeWidth={selectedRegionId === feature.properties.id ? 4 : level === "province" ? 2.2 : 1.5}
                        tabIndex={0}
                        role="button"
                        aria-pressed={selectedRegionId === feature.properties.id}
                        aria-label={`${name}${Number.isFinite(value) ? `: ${value}` : ""}`}
                        onClick={() => setSelectedRegionId(feature.properties.id)}
                        onKeyDown={(event) => event.key === "Enter" && setSelectedRegionId(feature.properties.id)}
                        onMouseMove={(event) => setTooltip({ x: event.clientX, y: event.clientY, name, value })}
                        onMouseLeave={() => setTooltip(null)}
                        onFocus={(event) => {
                          const box = event.currentTarget.getBoundingClientRect();
                          setTooltip({ x: box.left + box.width / 2, y: box.top, name, value });
                        }}
                        onBlur={() => setTooltip(null)}
                      />
                      {showLabels && Number.isFinite(centroid[0]) && (
                        <text x={centroid[0]} y={centroid[1]} textAnchor="middle" dominantBaseline="central" className={level === "province" ? "region-label" : "region-label county-label"} style={{ fontSize: level === "province" ? provinceFontSize : countyFontSize }} fill="#243244" pointerEvents="none">{name}</text>
                      )}
                    </g>
                  );
                })}
              </g>
              {!hasData && <g><rect x="330" y="375" width="540" height="105" rx="10" fill="#ffffff" stroke="#d7dde7" /><text x="600" y="418" textAnchor="middle" className="empty-title" fill="#344054">{t.emptyTitle}</text><text x="600" y="451" textAnchor="middle" className="empty-hint" fill="#667085">{t.emptyHint}</text></g>}
              {hasData && showLegend && <g transform={`translate(270 ${legendPosition === "top" ? 112 : 818})`}>{scaleColors.map((color, index) => <rect key={`${color}-${index}`} x={index * (660 / classCount)} width={660 / classCount} height="18" fill={color} />)}{scaleBreaks.map((value, index) => <text key={`${value}-${index}`} x={index * (660 / classCount)} y="43" textAnchor={index === 0 ? "start" : index === scaleBreaks.length - 1 ? "end" : "middle"} className="legend-label" fill="#667085">{new Intl.NumberFormat(language === "fa" ? "fa-IR" : "en-US", { maximumFractionDigits: 1 }).format(value)}</text>)}</g>}
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
      <footer className="foot-line">
        <div><strong>{t.madeBy}</strong><span>{language === "fa" ? "رایگان · بدون سرور · داده‌ها روی دستگاه شما" : "Free · serverless · your data stays on your device"}</span></div>
        <nav className="social-links" aria-label={language === "fa" ? "شبکه‌های اجتماعی" : "Social links"}>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer"><GithubMark />{t.github}</a>
          <a href={LINKEDIN_URL} target="_blank" rel="noreferrer"><LinkedinMark />{t.linkedin}</a>
        </nav>
      </footer>
    </div>
  );
}

export default App;

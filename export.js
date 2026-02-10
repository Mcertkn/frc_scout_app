// export.js
function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toJSONL(records) {
  return records.map(r => JSON.stringify(r)).join("\n") + "\n";
}

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

function toCSV(records) {
  const flat = records.map(r => flatten(r));
  const cols = Array.from(new Set(flat.flatMap(r => Object.keys(r)))).sort();
  const esc = (x) => {
    const s = (x ?? "").toString();
    if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };
  const lines = [
    cols.join(","),
    ...flat.map(r => cols.map(c => esc(r[c])).join(","))
  ];
  return lines.join("\n") + "\n";
}

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

    if (v && typeof v === "object" && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out[key] = v;
    }

  }

  return out;
}


function toCSV(records) {

  const flat = records.map(r => flatten(r));

  const cols = Array.from(
    new Set(flat.flatMap(r => Object.keys(r)))
  ).sort();

  const esc = (x) => {

    const s = (x ?? "").toString();

    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return `"${s.replaceAll('"', '""')}"`;
    }

    return s;

  };

  const lines = [

    cols.join(","),

    ...flat.map(r =>
      cols.map(c => esc(r[c])).join(",")
    )

  ];

  return lines.join("\n") + "\n";

}


// ==============================
// JSON EXPORT
// ==============================

function exportJSON(records) {

  if (!records || records.length === 0) {
    alert("Kayıt yok");
    return;
  }

  const json = JSON.stringify(records, null, 2);

  downloadFile(
    "scouting_data.json",
    json,
    "application/json"
  );

}


// ==============================
// CSV EXPORT
// ==============================

function exportCSV(records) {

  if (!records || records.length === 0) {
    alert("Kayıt yok");
    return;
  }

  const csv = toCSV(records);

  downloadFile(
    "scouting_data.csv",
    csv,
    "text/csv"
  );

}

async function makeQR(canvas, data) {

  const text = JSON.stringify(data);

  QRCode.toCanvas(canvas, text, {
    width: 220
  });

}
// ==============================
// JSONL EXPORT (çok iyi analiz için)
// ==============================

function exportJSONL(records) {

  if (!records || records.length === 0) {
    alert("Kayıt yok");
    return;
  }

  const jsonl = toJSONL(records);

  downloadFile(
    "scouting_data.jsonl",
    jsonl,
    "application/json"
  );

}


// ==============================
// EXCEL EXPORT
// ==============================

function exportExcel(records) {

  if (!records || records.length === 0) {
    alert("Kayıt yok");
    return;
  }

  const flat = records.map(r => flatten(r));

  const worksheet = XLSX.utils.json_to_sheet(flat);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Scouting"
  );

  XLSX.writeFile(
    workbook,
    "scouting_data.xlsx"
  );

}

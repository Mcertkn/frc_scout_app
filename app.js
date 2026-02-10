let CFG;
let pageIdx = 0;
let formState = {}; // current match record draft

function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

async function loadConfig() {
  const res = await fetch("./config/2026.json");
  CFG = await res.json();
  document.title = CFG.app?.name ?? "FRC Scout";
}

function currentPage() { return CFG.pages[pageIdx]; }

function updateTabs(tab) {
  qsa(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  qsa(".view").forEach(v => v.classList.remove("active"));
  qs(`#view-${tab}`).classList.add("active");
}

function renderPage() {
  const p = currentPage();
  qs("#pageTitle").textContent = p.title;
  qs("#pageIndex").textContent = `${pageIdx + 1} / ${CFG.pages.length}`;

  const area = qs("#formArea");
  renderFields(area, p.fields, formState);

  qs("#prevBtn").disabled = pageIdx === 0;
  qs("#nextBtn").textContent = (pageIdx === CFG.pages.length - 1) ? "Finish" : "Next";

  // son sayfada Save/QR paneli aç
  const isLast = pageIdx === CFG.pages.length - 1;
  qs("#postActions").classList.toggle("hidden", !isLast);

  if (isLast) {
    // QR preview (save zorunlu değil; backup için preview gösterebilir)
    const draft = buildRecord({ draft: true });
    makeQR(qs("#qrCanvas"), draft).catch(() => {});
  }
}

function buildRecord({ draft=false }={}) {
  const event = CFG.app?.eventCode ?? "EVENT";
  const scouter = (formState.scouter ?? "").toString().trim();
  const match = Number(formState.match ?? NaN);
  const team = Number(formState.team ?? NaN);
  const robotPos = (formState.robotPos ?? "").toString().trim();

  const record_id = `${event}_${match}_${robotPos}_${team}_${scouter}`.replaceAll(/\s+/g, "_");

  return {
    record_id,
    event,
    match,
    team,
    robotPos,
    scouter,
    ts: new Date().toISOString(),
    draft,
    data: formState
  };
}

function validateAllRequired() {
  // Her sayfanın required alanlarını kontrol et
  const missing = [];
  CFG.pages.forEach(p => missing.push(...validateRequired(p.fields, formState)));
  return Array.from(new Set(missing));
}

function clearForm() {
  formState = {};
  pageIdx = 0;
  renderPage();
}

async function saveRecord() {
  const missing = validateAllRequired();
  if (missing.length) {
    alert("Eksik alanlar:\n- " + missing.join("\n- "));
    return;
  }

  const rec = buildRecord({ draft: false });
  // record_id sağlam mı?
  if (!rec.record_id || rec.record_id.includes("NaN") || rec.record_id.includes("__")) {
    alert("record_id üretilemedi. Pre-Match alanlarını kontrol et (match/team/robot/scouter).");
    return;
  }

  await putRecord(rec);
  await makeQR(qs("#qrCanvas"), rec);

  alert("Kaydedildi ✅\nQR screenshot alabilirsiniz.");
}

async function refreshRecords() {
  const list = qs("#recordsList");
  list.innerHTML = "Yükleniyor...";
  const recs = await getAllRecords();
  recs.sort((a,b) => (b.ts||"").localeCompare(a.ts||""));

  if (!recs.length) {
    list.innerHTML = "<div class='muted'>Henüz kayıt yok.</div>";
    return;
  }

  list.innerHTML = "";
  recs.slice(0, 50).forEach(r => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div><b>${r.event}</b> • Match ${r.match} • ${r.robotPos} • Team ${r.team}</div>
      <div class="meta">${r.record_id}</div>
      <div class="row gap" style="margin-top:8px">
        <button class="btn" data-del="${r.record_id}">Sil</button>
      </div>
    `;
    list.appendChild(div);
  });

  list.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.del;
      if (!confirm(`Silinsin mi?\n${id}`)) return;
      await deleteRecord(id);
      refreshRecords();
    });
  });
}

async function exportJSON() {
  const recs = await getAllRecords();
  const content = toJSONL(recs);
  const name = `scout_${CFG.app?.eventCode ?? "event"}_${new Date().toISOString().slice(0,10)}.jsonl`;
  downloadFile(name, content, "application/json");
}

async function exportCSV() {
  const recs = await getAllRecords();
  const content = toCSV(recs.map(r => ({
    record_id: r.record_id,
    event: r.event,
    match: r.match,
    team: r.team,
    robotPos: r.robotPos,
    scouter: r.scouter,
    ts: r.ts,
    ...r.data
  })));
  const name = `scout_${CFG.app?.eventCode ?? "event"}_${new Date().toISOString().slice(0,10)}.csv`;
  downloadFile(name, content, "text/csv");
}

function wireUI() {
  // Tabs
  qsa(".tab").forEach(b => b.addEventListener("click", () => {
    updateTabs(b.dataset.tab);
    if (b.dataset.tab === "records") refreshRecords();
  }));

  qs("#prevBtn").addEventListener("click", () => { if (pageIdx > 0) { pageIdx--; renderPage(); } });
  qs("#nextBtn").addEventListener("click", () => {
    if (pageIdx < CFG.pages.length - 1) { pageIdx++; renderPage(); }
    else alert("Son sayfadasın. Save ile kaydedebilirsin.");
  });

  qs("#saveBtn").addEventListener("click", saveRecord);
  qs("#clearBtn").addEventListener("click", () => {
    if (confirm("Form sıfırlansın mı?")) clearForm();
  });

  qs("#refreshRecordsBtn").addEventListener("click", refreshRecords);
  qs("#wipeBtn").addEventListener("click", async () => {
    if (!confirm("Bu cihazdaki TÜM kayıtlar silinecek. Emin misin?")) return;
    await wipeAll();
    refreshRecords();
  });

  qs("#exportJsonBtn").addEventListener("click", exportJSON);
  qs("#exportCsvBtn").addEventListener("click", exportCSV);
}

(async function main() {
  await loadConfig();
  wireUI();
  renderPage();
})();

let CFG;
let pageIdx = 0;
let formState = {};

function qs(sel){return document.querySelector(sel);}
function qsa(sel){return Array.from(document.querySelectorAll(sel));}

async function loadConfig(){
const res=await fetch("./config/2026.json");
CFG=await res.json();
}

function currentPage(){return CFG.pages[pageIdx];}

function renderPage(){

const p=currentPage();

qs("#pageTitle").textContent=p.title;
qs("#pageIndex").textContent=`${pageIdx+1} / ${CFG.pages.length}`;

renderFields(qs("#formArea"),p.fields,formState);

qs("#prevBtn").disabled=pageIdx===0;
qs("#nextBtn").textContent=pageIdx===CFG.pages.length-1?"Finish":"Next";

qs("#postActions").classList.toggle(
"hidden",
pageIdx!==CFG.pages.length-1
);

}

function buildRecord(){

const event=CFG.app.eventCode;

const record_id=`${event}_${formState.match}_${formState.robotPos}_${formState.team}_${formState.scouter}`;

return{
record_id,
event,
ts:new Date().toISOString(),
...formState
};

}

async function uploadToFirebase(rec){

try{
await db.collection("records").doc(rec.record_id).set(rec);
}
catch(e){
console.log("offline olabilir");
}

}

async function saveRecord(){

const rec=buildRecord();

await putRecord(rec);

uploadToFirebase(rec);

makeQR(qs("#qrCanvas"),rec);

alert("Kaydedildi");

}

async function refreshRecords(){

const list=qs("#recordsList");

list.innerHTML="Yükleniyor...";

let recs=await getAllRecords();

try{

const snap=await db.collection("records").get();

const cloud=snap.docs.map(d=>d.data());

const map=new Map();

[...recs,...cloud].forEach(r=>{
map.set(r.record_id,r);
});

recs=Array.from(map.values());

}
catch(e){
console.log("offline olabilir");
}

list.innerHTML="";

recs.forEach(r=>{

const div=document.createElement("div");

div.innerHTML=`Match ${r.match} - Team ${r.team}`;

list.appendChild(div);

});

}

async function exportJSON(){

let recs = await getAllRecords();

try{

const snap = await db.collection("records").get();

const cloud = snap.docs.map(d=>d.data());

const map = new Map();

[...recs,...cloud].forEach(r=>{
map.set(r.record_id,r);
});

recs = Array.from(map.values());

}
catch(e){
console.log("firebase offline olabilir");
}

const text = JSON.stringify(recs,null,2);

downloadFile("scout.json",text,"application/json");

}

async function exportCSV(){

let recs = await getAllRecords();

try{

const snap = await db.collection("records").get();

const cloud = snap.docs.map(d=>d.data());

const map = new Map();

[...recs,...cloud].forEach(r=>{
map.set(r.record_id,r);
});

recs = Array.from(map.values());

}
catch(e){
console.log("firebase offline olabilir");
}

const csv = toCSV(recs);

downloadFile("scout.csv",csv,"text/csv");

}

/* 🔴 KRİTİK: Firebase → Local Sync */

async function syncFromFirebase(){

try{

const snap = await db.collection("records").get();

for(const doc of snap.docs){

const rec = doc.data();

await putRecord(rec);

}

console.log("Firebase sync tamam");

}
catch(e){

console.log("Firebase sync yapılamadı", e);

}

}

function wireUI(){

qsa(".tab").forEach(b=>{
b.onclick=()=>{
qsa(".view").forEach(v=>v.classList.remove("active"));
qs(`#view-${b.dataset.tab}`).classList.add("active");
if(b.dataset.tab==="records")refreshRecords();
};
});

qs("#prevBtn").onclick=()=>{
if(pageIdx>0){
pageIdx--;
renderPage();
}
};

qs("#nextBtn").onclick=()=>{
if(pageIdx<CFG.pages.length-1){
pageIdx++;
renderPage();
}
};

qs("#saveBtn").onclick=saveRecord;

qs("#clearBtn").onclick=()=>{
formState={};
pageIdx=0;
renderPage();
};

qs("#refreshRecordsBtn").onclick=refreshRecords;

/* 🔴 DÜZELTİLMİŞ TÜMÜNÜ SİL */

qs("#wipeBtn").onclick=async()=>{

if(!confirm("Tüm kayıtlar silinsin mi?")) return;

await wipeAll();

try{

const snap = await db.collection("records").get();

const batch = db.batch();

snap.docs.forEach(doc=>{
batch.delete(doc.ref);
});

await batch.commit();

}catch(e){
console.log("firebase silinemedi",e);
}

refreshRecords();

};

qs("#exportJsonBtn").onclick=exportJSON;
qs("#exportCsvBtn").onclick=exportCSV;

}

function makeQR(canvas,data){
QRCode.toCanvas(canvas,JSON.stringify(data),{width:200});
}

(async function main(){

await loadConfig();

/* 🔴 Firebase kayıtlarını indir */
await syncFromFirebase();

wireUI();

renderPage();

})();
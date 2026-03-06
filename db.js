const DB_NAME = "scoutDB";
const STORE = "records";

let dbPromise = idb.openDB(DB_NAME, 1, {
upgrade(db) {
db.createObjectStore(STORE, { keyPath: "record_id" });
}
});

async function putRecord(rec) {
const db = await dbPromise;
return db.put(STORE, rec);
}

async function getAllRecords() {
const db = await dbPromise;
return db.getAll(STORE);
}

async function deleteRecord(id) {
const db = await dbPromise;
return db.delete(STORE, id);
}

async function wipeAll() {
const db = await dbPromise;
return db.clear(STORE);
}

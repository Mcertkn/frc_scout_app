// render.js
function setDeep(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] ??= {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function getDeep(obj, path) {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function renderFields(container, fields, state) {
  container.innerHTML = "";
  fields.forEach((f) => {
    const wrap = document.createElement("div");
    wrap.className = "field";

    const label = document.createElement("label");
    label.className = "label";
    label.textContent = f.label + (f.required ? " *" : "");
    wrap.appendChild(label);

    const key = f.key;

    if (f.type === "text" || f.type === "number") {
      const input = document.createElement("input");
      input.className = "input";
      input.type = f.type === "number" ? "number" : "text";
      input.value = getDeep(state, key) ?? "";
      input.addEventListener("input", () => {
        const v = f.type === "number" ? (input.value === "" ? "" : Number(input.value)) : input.value;
        setDeep(state, key, v);
      });
      wrap.appendChild(input);
    }

    if (f.type === "textarea") {
      const ta = document.createElement("textarea");
      ta.className = "input";
      ta.value = getDeep(state, key) ?? "";
      ta.addEventListener("input", () => setDeep(state, key, ta.value));
      wrap.appendChild(ta);
    }

    if (f.type === "checkbox") {
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(getDeep(state, key));
      input.addEventListener("change", () => setDeep(state, key, input.checked));
      wrap.appendChild(input);
    }

    if (f.type === "radio") {
      const cur = getDeep(state, key) ?? "";
      const group = document.createElement("div");
      group.className = "row gap";
      f.options.forEach((opt) => {
        const b = document.createElement("button");
        b.className = "btn";
        if (opt === cur) b.classList.add("primary");
        b.textContent = opt;
        b.addEventListener("click", (e) => {
          e.preventDefault();
          setDeep(state, key, opt);
          // rerender to update highlight
          renderFields(container, fields, state);
        });
        group.appendChild(b);
      });
      wrap.appendChild(group);
    }

    if (f.type === "counter") {
      const min = f.min ?? 0;
      let val = Number(getDeep(state, key) ?? 0);
      if (Number.isNaN(val)) val = 0;

      const row = document.createElement("div");
      row.className = "counter";

      const minus = document.createElement("button");
      minus.className = "btn";
      minus.textContent = "−";
      minus.addEventListener("click", (e) => {
        e.preventDefault();
        val = Math.max(min, val - 1);
        setDeep(state, key, val);
        renderFields(container, fields, state);
      });

      const plus = document.createElement("button");
      plus.className = "btn";
      plus.textContent = "+";
      plus.addEventListener("click", (e) => {
        e.preventDefault();
        val = val + 1;
        setDeep(state, key, val);
        renderFields(container, fields, state);
      });

      const mid = document.createElement("div");
      mid.className = "val";
      mid.textContent = String(val);

      row.appendChild(minus);
      row.appendChild(mid);
      row.appendChild(plus);

      wrap.appendChild(row);
    }

    container.appendChild(wrap);
  });
}

function validateRequired(fields, state) {
  const missing = [];
  fields.forEach(f => {
    if (!f.required) return;
    const v = getDeep(state, f.key);
    const bad = (v === undefined || v === null || v === "" || (typeof v === "number" && Number.isNaN(v)));
    if (bad) missing.push(f.label);
  });
  return missing;
}

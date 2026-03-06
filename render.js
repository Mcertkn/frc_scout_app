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

    if (f.showIf) {
      const currentValue = getDeep(state, f.showIf.key);
      if (currentValue !== f.showIf.equals) return;
    }

    const wrap = document.createElement("div");
    wrap.className = "field";

    const label = document.createElement("label");
    label.className = "label";
    label.textContent = f.label + (f.required ? " *" : "");
    wrap.appendChild(label);

    const key = f.key;

    // TEXT & NUMBER
    if (f.type === "text" || f.type === "number") {

      const input = document.createElement("input");
      input.className = "input";
      input.type = f.type === "number" ? "number" : "text";
      input.value = getDeep(state, key) ?? "";

      input.addEventListener("input", () => {

        const v = f.type === "number"
          ? (input.value === "" ? "" : Number(input.value))
          : input.value;

        setDeep(state, key, v);

        if (f.repeatShots) {
          renderFields(container, fields, state);
        }

      });

      wrap.appendChild(input);
    }

    // TEXTAREA
    if (f.type === "textarea") {

      const ta = document.createElement("textarea");
      ta.className = "input";
      ta.value = getDeep(state, key) ?? "";

      ta.addEventListener("input", () => {
        setDeep(state, key, ta.value);
      });

      wrap.appendChild(ta);
    }

    // PERCENT
    if (f.type === "percent") {

      const val = Number(getDeep(state, key) ?? 0);

      const input = document.createElement("input");
      input.type = "range";
      input.min = 0;
      input.max = 100;
      input.value = val;

      const display = document.createElement("div");
      display.className = "val";
      display.textContent = val + "%";

      input.addEventListener("input", () => {

        const v = Number(input.value);
        setDeep(state, key, v);
        display.textContent = v + "%";

      });

      wrap.appendChild(input);
      wrap.appendChild(display);
    }

    // CHECKBOX
    if (f.type === "checkbox") {

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(getDeep(state, key));

      input.addEventListener("change", () => {
        setDeep(state, key, input.checked);
      });

      wrap.appendChild(input);
    }

    // RADIO
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

          renderFields(container, fields, state);

        });

        group.appendChild(b);

      });

      wrap.appendChild(group);
    }

    // MULTISELECT (YENİ)
    if (f.type === "multiselect") {

      let selected = getDeep(state, key) || [];

      const group = document.createElement("div");
      group.className = "row gap";

      f.options.forEach(opt => {

        const btn = document.createElement("button");
        btn.className = "btn";

        if (selected.includes(opt)) {
          btn.classList.add("primary");
        }

        btn.textContent = opt;

        btn.onclick = (e) => {

          e.preventDefault();

          let arr = getDeep(state, key) || [];

          if (arr.includes(opt)) {
            arr = arr.filter(x => x !== opt);
          } else {
            arr.push(opt);
          }

          setDeep(state, key, arr);

          renderFields(container, fields, state);
        };

        group.appendChild(btn);

      });

      wrap.appendChild(group);
    }

    // COUNTER
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

    // TIMER
    if (f.type === "timer") {

      let elapsed = Number(getDeep(state, key) ?? 0);
      let running = false;
      let interval = null;

      const display = document.createElement("div");
      display.className = "val";
      display.textContent = elapsed + " s";

      const startBtn = document.createElement("button");
      startBtn.className = "btn";
      startBtn.textContent = "Start";

      const resetBtn = document.createElement("button");
      resetBtn.className = "btn";
      resetBtn.textContent = "Reset";

      startBtn.addEventListener("click", (e) => {

        e.preventDefault();

        if (!running) {

          running = true;

          startBtn.textContent = "Stop";

          interval = setInterval(() => {

            elapsed++;

            display.textContent = elapsed + " s";

          }, 1000);

        } else {

          running = false;

          clearInterval(interval);

          setDeep(state, key, elapsed);

          startBtn.textContent = "Start";

        }

      });

      resetBtn.addEventListener("click", (e) => {

        e.preventDefault();

        running = false;

        clearInterval(interval);

        elapsed = 0;

        setDeep(state, key, 0);

        display.textContent = "0 s";

        startBtn.textContent = "Start";

      });

      const row = document.createElement("div");
      row.className = "row gap";

      row.appendChild(startBtn);
      row.appendChild(resetBtn);

      wrap.appendChild(display);
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

    const bad = (
      v === undefined ||
      v === null ||
      v === "" ||
      (typeof v === "number" && Number.isNaN(v))
    );

    if (bad) missing.push(f.label);

  });

  return missing;

}
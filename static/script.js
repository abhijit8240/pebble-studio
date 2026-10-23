// ---------- tabs ----------

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.add("hidden"));
    tab.classList.add("active");
    document.querySelector(`.panel[data-panel="${tab.dataset.agent}"]`).classList.remove("hidden");
  });
});

// ---------- memory panels ----------

async function loadMemory(agent) {
  const list = document.querySelector(`.file-list[data-agent="${agent}"]`);
  list.innerHTML = "";
  try {
    const res = await fetch(`/api/memory/${agent}/list`);
    const data = await res.json();
    (data.files || []).forEach((f) => list.appendChild(fileRow(agent, f)));
  } catch (e) {
    // silent — memory panel just stays empty if the backend isn't reachable yet
  }
}

function fileRow(agent, file) {
  const li = document.createElement("li");
  const label = document.createElement("span");
  label.textContent = file.name;
  const remove = document.createElement("button");
  remove.className = "remove";
  remove.textContent = "×";
  remove.title = "Remove";
  remove.addEventListener("click", async () => {
    await fetch(`/api/memory/${agent}/${encodeURIComponent(file.name)}`, { method: "DELETE" });
    loadMemory(agent);
  });
  li.appendChild(label);
  li.appendChild(remove);
  return li;
}

async function uploadFile(agent, file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`/api/memory/${agent}/upload`, { method: "POST", body: form });
  if (res.ok) loadMemory(agent);
  else {
    const data = await res.json().catch(() => ({}));
    alert(data.error || "Upload failed");
  }
}

document.querySelectorAll(".dropzone[data-agent]").forEach((zone) => {
  const agent = zone.dataset.agent;
  const input = zone.querySelector("input[type=file]");

  zone.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    if (input.files[0]) uploadFile(agent, input.files[0]);
    input.value = "";
  });

  ["dragover", "dragenter"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove("dragover");
    })
  );
  zone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(agent, file);
  });
});

["seo", "script"].forEach(loadMemory); // "image" now uses its own reference-photo system below

// ---------- tiny markdown renderer (headers, bold, italic, lists, paragraphs) ----------

function renderMarkdown(md) {
  const lines = md.split("\n");
  let html = "";
  let inList = false;
  for (let line of lines) {
    line = line.trim();
    if (line.startsWith("### ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h3>${inline(line.slice(4))}</h3>`;
    } else if (line.startsWith("## ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h2>${inline(line.slice(3))}</h2>`;
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inline(line.slice(2))}</li>`;
    } else if (line === "") {
      if (inList) { html += "</ul>"; inList = false; }
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p>${inline(line)}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}

function inline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

// ---------- notes presets ----------

const NOTE_PRESETS = {
  comparison:
    "Structure this as a balanced comparison between two options. Include a short comparison table or clear side-by-side criteria (cost, maintenance, appearance, durability). Avoid declaring an outright winner — let the reader match the criteria to their situation.",
  buying_guide:
    "Structure this as a practical buyer's checklist — the specific things to check or ask about before purchasing. Use a numbered or bulleted checklist for the core points. Keep it decision-focused, not just descriptive.",
  roundup:
    "Structure this as a roundup of distinct ideas or approaches, each with its own short H2/H3 and a sentence or two of practical detail. Keep each idea skimmable — this format gets scanned, not read start to finish.",
  qna:
    "Write this as a direct answer to a specific question, standalone enough to work as a forum answer. Open with the answer in 1-2 sentences, then explain. No links or CTA in the body — this may get placed somewhere that requires bio-only links.",
};

const WEBSITE_URL = "https://whitepebblewonders.com/";
const EMAIL_ADDRESS = "sales@whitepebblewonders.com";

let websiteOn = false;
let emailOn = false;
let currentContactInstruction = "";

function buildContactInstruction() {
  if (!websiteOn && !emailOn) return "";
  let what;
  if (websiteOn && emailOn) {
    what = `the website (${WEBSITE_URL}) and the email (${EMAIL_ADDRESS})`;
  } else if (websiteOn) {
    what = `the website (${WEBSITE_URL})`;
  } else {
    what = `the email (${EMAIL_ADDRESS})`;
  }
  return (
    "Close the piece with a short, natural closing paragraph that flows from the rest of " +
    `the content — not a sudden stop. Within that closing, include ${what} as a natural ` +
    "pointer, not a hard sell or a bare link/address dropped on its own line."
  );
}

function refreshContactInstruction() {
  const textarea = document.querySelector('textarea[name="notes"]');
  let value = textarea.value;

  if (currentContactInstruction && value.includes(currentContactInstruction)) {
    value = value.replace(currentContactInstruction, "").trim();
  }

  currentContactInstruction = buildContactInstruction();

  if (currentContactInstruction) {
    value = value ? `${value}\n\n${currentContactInstruction}` : currentContactInstruction;
  }

  textarea.value = value;
}

document.querySelectorAll(".preset-chip[data-preset]").forEach((chip) => {
  chip.addEventListener("click", () => {
    const key = chip.dataset.preset;
    const textarea = document.querySelector('textarea[name="notes"]');
    textarea.value = key === "clear" ? "" : NOTE_PRESETS[key];

    if (key === "clear") {
      websiteOn = false;
      emailOn = false;
      currentContactInstruction = "";
      document.getElementById("preset-website").classList.remove("active");
      document.getElementById("preset-email").classList.remove("active");
    } else {
      currentContactInstruction = ""; // this is fresh preset text, nothing to strip yet
      refreshContactInstruction(); // re-apply the toggle state if website/email is still on
    }
  });
});

document.getElementById("preset-website").addEventListener("click", () => {
  websiteOn = !websiteOn;
  document.getElementById("preset-website").classList.toggle("active", websiteOn);
  refreshContactInstruction();
});

document.getElementById("preset-email").addEventListener("click", () => {
  emailOn = !emailOn;
  document.getElementById("preset-email").classList.toggle("active", emailOn);
  refreshContactInstruction();
});

// ---------- Excel topic queue ----------

let selectedRow = null;

async function loadQueue() {
  const list = document.getElementById("queue-list");
  const statusMsg = document.getElementById("queue-status-msg");
  const downloadBtn = document.getElementById("queue-download-btn");
  list.innerHTML = "";
  statusMsg.textContent = "";
  statusMsg.classList.remove("error");

  try {
    const res = await fetch("/api/queue/rows");
    const data = await res.json();

    if (!res.ok) {
      statusMsg.textContent = data.error || "Could not load the queue.";
      statusMsg.classList.add("error");
      return;
    }

    downloadBtn.classList.toggle("hidden", !data.has_file);

    if (!data.rows || data.rows.length === 0) {
      list.innerHTML = data.has_file
        ? '<li class="queue-empty">No usable rows found. Check the file has Day, Topic, and Primary Keyword columns filled in.</li>'
        : '<li class="queue-empty">Upload an .xlsx file to get started.</li>';
      return;
    }
    data.rows.forEach((row) => list.appendChild(queueRow(row)));
  } catch (e) {
    statusMsg.textContent = "Could not reach the server.";
    statusMsg.classList.add("error");
  }
}

function queueRow(row) {
  const li = document.createElement("li");
  li.className = "queue-item";
  li.dataset.row = row.row_number;

  const main = document.createElement("div");
  main.className = "queue-item-main";
  const day = document.createElement("span");
  day.className = "queue-day";
  day.textContent = row.day || `Row ${row.row_number}`;
  const topic = document.createElement("span");
  topic.className = "queue-topic";
  topic.textContent = row.topic;
  main.appendChild(day);
  main.appendChild(topic);

  const status = document.createElement("span");
  const isGenerated = (row.status || "").toLowerCase() === "generated";
  status.className = "queue-status " + (isGenerated ? "generated" : "pending");
  status.textContent = isGenerated ? "Generated" : "Pending";

  li.appendChild(main);
  li.appendChild(status);
  li.addEventListener("click", () => selectQueueRow(row, li));
  return li;
}

function selectQueueRow(row, li) {
  document.querySelectorAll(".queue-item").forEach((el) => el.classList.remove("active"));
  li.classList.add("active");
  selectedRow = row.row_number;

  const form = document.getElementById("seo-form");
  form.elements["topic"].value = row.topic || "";
  form.elements["keyword"].value = row.keyword || "";
  if (row.notes) form.elements["notes"].value = row.notes;
  if (row.word_count) {
    const select = form.elements["word_count"];
    const match = [...select.options].some((o) => o.value === String(row.word_count));
    if (match) select.value = String(row.word_count);
  }
}

document.getElementById("queue-upload-btn").addEventListener("click", () => {
  document.getElementById("queue-file-input").click();
});

document.getElementById("queue-file-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;

  const statusMsg = document.getElementById("queue-status-msg");
  statusMsg.textContent = "Uploading…";
  statusMsg.classList.remove("error");

  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch("/api/queue/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      statusMsg.textContent = data.error || "Upload failed.";
      statusMsg.classList.add("error");
      return;
    }
    statusMsg.textContent = `Loaded ${data.rows.length} topic(s).`;
    loadQueue();
  } catch (err) {
    statusMsg.textContent = "Upload failed — could not reach the server.";
    statusMsg.classList.add("error");
  }
});

document.getElementById("queue-download-btn").addEventListener("click", () => {
  window.location.href = "/api/queue/download";
});

loadQueue();

// ---------- past drafts ----------

async function loadDraftsList(restoreLatest) {
  const list = document.getElementById("drafts-list");
  list.innerHTML = "";
  try {
    const res = await fetch("/api/drafts/seo");
    const data = await res.json();
    if (!data.drafts || data.drafts.length === 0) {
      list.innerHTML = '<li class="queue-empty">No saved drafts yet.</li>';
      return;
    }
    data.drafts.forEach((d) => list.appendChild(draftRow(d)));
    if (restoreLatest) loadDraftIntoOutput(data.drafts[0].filename);
  } catch (e) {
    list.innerHTML = '<li class="queue-empty">Could not load past drafts.</li>';
  }
}

function draftRow(d) {
  const li = document.createElement("li");
  li.className = "queue-item";

  const main = document.createElement("div");
  main.className = "queue-item-main";
  const when = document.createElement("span");
  when.className = "queue-day";
  when.textContent = d.generated_on || "";
  const title = document.createElement("span");
  title.className = "queue-topic";
  title.textContent = d.title;
  main.appendChild(when);
  main.appendChild(title);
  li.appendChild(main);

  li.addEventListener("click", () => loadDraftIntoOutput(d.filename));
  return li;
}

async function loadDraftIntoOutput(filename) {
  try {
    const res = await fetch(`/api/drafts/seo/${encodeURIComponent(filename)}`);
    const data = await res.json();
    if (!res.ok) return;
    renderDraftToOutput(data.draft);
  } catch (e) {
    // silent — a failed restore just leaves the output panel empty
  }
}

// ---------- SEO generation ----------

const seoForm = document.getElementById("seo-form");
const seoStatus = document.getElementById("seo-status");
const seoOutput = document.getElementById("seo-output");

function renderDraftToOutput(draft, fallbackTitle) {
  const titleMatch = draft.match(/^TITLE:\s*(.+)$/m);
  const metaMatch = draft.match(/^META DESCRIPTION:\s*(.+)$/m);
  const body = draft
    .replace(/^TITLE:.*$/m, "")
    .replace(/^META DESCRIPTION:.*$/m, "")
    .trim();

  document.getElementById("seo-output-title").textContent = titleMatch ? titleMatch[1] : (fallbackTitle || "");
  const words = body.split(/\s+/).filter(Boolean).length;
  const meta = metaMatch ? metaMatch[1] : "";
  document.getElementById("seo-output-meta").textContent = `${words} words · claude-sonnet-5 · ${meta}`;
  document.getElementById("seo-output-body").innerHTML = renderMarkdown(body);

  seoOutput.dataset.raw = body;
  seoOutput.classList.remove("hidden");
}

loadDraftsList(true); // restore the most recent draft on page load

function renderSafetyCheck(safety) {
  const card = document.getElementById("safety-check");
  const badge = document.getElementById("safety-badge");
  const note = document.getElementById("safety-note");
  const issuesList = document.getElementById("safety-issues");
  issuesList.innerHTML = "";

  if (!safety || safety.status === "unknown") {
    card.classList.add("hidden");
    return;
  }

  card.classList.remove("hidden");

  if (safety.status === "pass") {
    badge.textContent = "Passed";
    badge.className = "safety-badge pass";
    note.textContent = safety.note || "No issues found.";
    return;
  }

  badge.textContent = "Needs fixes";
  badge.className = "safety-badge needs-fixes";
  note.textContent = `${safety.issues.length} issue(s) found — also logged to memory for review.`;

  safety.issues.forEach((item) => {
    const li = document.createElement("li");
    const issueP = document.createElement("div");
    issueP.className = "safety-issue-text";
    issueP.textContent = item.issue;
    const fixP = document.createElement("div");
    fixP.className = "safety-fix-text";
    fixP.innerHTML = `<span class="safety-fix-label">Suggested fix:</span> ${item.fix}`;
    li.appendChild(issueP);
    li.appendChild(fixP);
    issuesList.appendChild(li);
  });
}

document.getElementById("archive-download-btn").addEventListener("click", () => {
  window.location.href = "/api/archive/seo/download";
});

seoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = seoForm.querySelector(".generate-btn");
  const formData = new FormData(seoForm);
  const payload = Object.fromEntries(formData.entries());
  if (selectedRow) payload.row_number = selectedRow;

  submitBtn.disabled = true;
  submitBtn.textContent = "Generating…";
  seoStatus.textContent = "";
  seoStatus.classList.remove("error");
  seoOutput.classList.add("hidden");

  try {
    const res = await fetch("/api/generate/seo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      seoStatus.textContent = data.error || "Something went wrong.";
      seoStatus.classList.add("error");
      return;
    }

    const draft = data.draft || "";
    renderDraftToOutput(draft, payload.topic);
    renderSafetyCheck(data.safety_check);
    loadDraftsList(false);

    if (data.memory_truncated) {
      seoStatus.textContent = "Note: your brand memory files were long enough to be trimmed for this draft.";
    }

    if (data.queue_status_updated && selectedRow) {
      const activeItem = document.querySelector(`.queue-item[data-row="${selectedRow}"]`);
      if (activeItem) {
        const badge = activeItem.querySelector(".queue-status");
        badge.textContent = "Generated";
        badge.classList.remove("pending");
        badge.classList.add("generated");
      }
    }
  } catch (err) {
    seoStatus.textContent = "Could not reach the server. Is app.py running?";
    seoStatus.classList.add("error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Generate draft";
  }
});

function flashCopied(buttonId) {
  const btn = document.getElementById(buttonId);
  const original = btn.textContent;
  btn.textContent = "Copied";
  setTimeout(() => (btn.textContent = original), 1200);
}

document.getElementById("seo-copy-markdown").addEventListener("click", () => {
  navigator.clipboard.writeText(seoOutput.dataset.raw || "");
  flashCopied("seo-copy-markdown");
});

document.getElementById("seo-copy-formatted").addEventListener("click", async () => {
  const bodyEl = document.getElementById("seo-output-body");
  const html = bodyEl.innerHTML;
  const plain = bodyEl.innerText;
  try {
    // Writes real rich text (actual bold, actual headings) to the clipboard, so pasting
    // into a WYSIWYG box like Quora or Reddit's default composer renders correctly instead
    // of showing literal ** and ## symbols.
    const item = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([plain], { type: "text/plain" }),
    });
    await navigator.clipboard.write([item]);
  } catch (err) {
    // Some browsers/contexts don't support rich clipboard writes — fall back to plain text
    // rather than failing silently.
    await navigator.clipboard.writeText(plain);
  }
  flashCopied("seo-copy-formatted");
});

// ---------- image reference photos (per product, read-only — files live on disk) ----------

let currentRefProduct = "malibu";

async function loadImageRefs(product) {
  const list = document.getElementById("image-ref-list");
  const folderNote = document.getElementById("image-ref-folder");
  list.innerHTML = "";
  try {
    const res = await fetch(`/api/image-refs/${product}/list`);
    const data = await res.json();
    folderNote.textContent = data.folder ? `Folder: ${data.folder}` : "";
    if (!data.files || data.files.length === 0) {
      list.innerHTML = '<li class="queue-empty">No photos found in this folder yet.</li>';
      return;
    }
    data.files.forEach((name) => list.appendChild(imageRefThumb(product, name)));
  } catch (e) {
    folderNote.textContent = "";
    list.innerHTML = '<li class="queue-empty">Could not reach the server.</li>';
  }
}

function imageRefThumb(product, name) {
  const li = document.createElement("li");
  li.className = "output-thumb";
  const img = document.createElement("img");
  img.src = `/api/image-refs/${product}/file/${encodeURIComponent(name)}`;
  img.alt = name;
  const label = document.createElement("span");
  label.className = "output-thumb-date";
  label.textContent = name;
  li.appendChild(img);
  li.appendChild(label);
  return li;
}

document.querySelectorAll(".product-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".product-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentRefProduct = tab.dataset.product;
    loadImageRefs(currentRefProduct);
  });
});

document.getElementById("image-ref-refresh").addEventListener("click", () => {
  loadImageRefs(currentRefProduct);
});

loadImageRefs(currentRefProduct);

// ---------- past outputs gallery ----------

async function loadOutputsGallery(product) {
  const list = document.getElementById("image-outputs-list");
  list.innerHTML = "";
  try {
    const res = await fetch(`/api/image-outputs/${product}/list`);
    const data = await res.json();
    (data.outputs || []).forEach((o) => list.appendChild(outputThumb(product, o)));
  } catch (e) {
    // silent — gallery just stays empty if the backend isn't reachable yet
  }
}

function outputThumb(product, output) {
  const li = document.createElement("li");
  li.className = "output-thumb";
  li.dataset.filename = output.filename;

  const img = document.createElement("img");
  img.src = `/api/image-outputs/${product}/file/${output.filename}`;
  img.alt = "Generated pebble visual";

  const date = document.createElement("span");
  date.className = "output-thumb-date";
  date.textContent = output.generated_on;

  li.appendChild(img);
  li.appendChild(date);
  li.addEventListener("click", () => loadOutputIntoView(product, output.filename, img.src));
  return li;
}

function loadOutputIntoView(product, filename, imageSrc) {
  currentProduct = product;
  currentFilename = filename;
  imageResultImg.src = imageSrc;
  imageResultNote.textContent = "";
  imageHistoryList.innerHTML = "";
  imageResult.classList.remove("hidden");

  document.querySelectorAll(".output-thumb").forEach((el) => el.classList.remove("active"));
  const match = document.querySelector(`.output-thumb[data-filename="${filename}"]`);
  if (match) match.classList.add("active");
}

// ---------- image generation + conversational editing ----------

let currentProduct = document.getElementById("image-product-select").value;
let currentFilename = null;

const imageForm = document.getElementById("image-form");
const imageStatus = document.getElementById("image-status");
const imageResult = document.getElementById("image-result");
const imageResultImg = document.getElementById("image-result-img");
const imageResultNote = document.getElementById("image-result-note");
const imageHistoryList = document.getElementById("image-history");
const imageEditForm = document.getElementById("image-edit-form");

function addHistoryEntry(text) {
  const li = document.createElement("li");
  li.className = "history-entry";
  li.textContent = text;
  imageHistoryList.appendChild(li);
}

document.getElementById("image-product-select").addEventListener("change", (e) => {
  currentProduct = e.target.value;
  loadOutputsGallery(currentProduct);
});

loadOutputsGallery(currentProduct);

imageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = imageForm.querySelector(".generate-btn");
  const formData = new FormData(imageForm);
  const payload = Object.fromEntries(formData.entries());

  submitBtn.disabled = true;
  submitBtn.textContent = "Generating…";
  imageStatus.textContent = "";
  imageStatus.classList.remove("error");

  try {
    const res = await fetch("/api/generate/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      imageStatus.textContent = data.error || "Something went wrong.";
      imageStatus.classList.add("error");
      return;
    }

    currentProduct = data.product;
    currentFilename = data.filename;
    imageResultImg.src = data.image_url;
    imageResultNote.textContent = data.note || "";
    imageHistoryList.innerHTML = "";
    addHistoryEntry(payload.prompt);
    imageResult.classList.remove("hidden");
    loadOutputsGallery(currentProduct);
  } catch (err) {
    imageStatus.textContent = "Could not reach the server. Is app.py running?";
    imageStatus.classList.add("error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Generate image";
  }
});

imageEditForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentFilename) return;

  const submitBtn = imageEditForm.querySelector(".generate-btn");
  const comment = imageEditForm.elements["comment"].value.trim();
  if (!comment) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Applying…";
  imageStatus.textContent = "";
  imageStatus.classList.remove("error");

  try {
    const res = await fetch("/api/generate/image/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: currentProduct, filename: currentFilename, comment }),
    });
    const data = await res.json();

    if (!res.ok) {
      imageStatus.textContent = data.error || "Something went wrong.";
      imageStatus.classList.add("error");
      return;
    }

    currentFilename = data.filename;
    imageResultImg.src = data.image_url;
    imageResultNote.textContent = data.note || "";
    addHistoryEntry(comment);
    imageEditForm.elements["comment"].value = "";
    loadOutputsGallery(currentProduct);
  } catch (err) {
    imageStatus.textContent = "Could not reach the server.";
    imageStatus.classList.add("error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Apply edit";
  }
});

// ---------- settings ----------

async function loadSettingsStatus() {
  try {
    const res = await fetch("/api/settings");
    const data = await res.json();
    const anthropicInput = document.querySelector('input[name="anthropic_api_key"]');
    const googleInput = document.querySelector('input[name="google_api_key"]');
    anthropicInput.placeholder = data.anthropic_api_key_set
      ? "•••• already set — paste to replace"
      : "sk-ant-...";
    googleInput.placeholder = data.google_api_key_set
      ? "•••• already set — paste to replace"
      : "AIzaSy...";
  } catch (e) {
    // silent — the form still works, it just won't show the "already set" hint
  }
}

document.getElementById("settings-btn").addEventListener("click", () => {
  document.getElementById("settings-modal").classList.remove("hidden");
  document.getElementById("settings-status").textContent = "";
  loadSettingsStatus();
});

document.getElementById("settings-close").addEventListener("click", () => {
  document.getElementById("settings-modal").classList.add("hidden");
});

document.getElementById("settings-modal").addEventListener("click", (e) => {
  if (e.target.id === "settings-modal") e.target.classList.add("hidden");
});

document.getElementById("settings-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const statusEl = document.getElementById("settings-status");
  statusEl.textContent = "Saving…";
  statusEl.classList.remove("error");

  try {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      statusEl.textContent = "Could not save.";
      statusEl.classList.add("error");
      return;
    }
    statusEl.textContent = "Saved.";
    form.reset();
    loadSettingsStatus();
    setTimeout(() => document.getElementById("settings-modal").classList.add("hidden"), 900);
  } catch (err) {
    statusEl.textContent = "Could not reach the server.";
    statusEl.classList.add("error");
  }
});
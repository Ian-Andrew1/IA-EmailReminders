console.log("EDITOR.JS LOADED");

/* ============================================================
   CONFIG
============================================================ */

const OWNER = "Ian-Andrew1";
const REPO = "IA-EmailReminders";
const FILE_PATH = "list.json";

/* ============================================================
   ELEMENTS
============================================================ */

const itemsEl = document.getElementById("items");
const sortableList = document.getElementById("sortableList");

const saveBtn = document.getElementById("saveBtn");
const addItemBtn = document.getElementById("addItemBtn");

const statusEl = document.getElementById("status");
const testStatusEl = document.getElementById("testStatus");

const ghUserEl = document.getElementById("ghUser");
const ghTokenEl = document.getElementById("ghToken");

const toggleAuthBtn = document.getElementById("toggleAuth");
const authPanel = document.getElementById("authPanel");

const darkModeToggle = document.getElementById("darkModeToggle");
const previewToggle = document.getElementById("previewToggle");
const previewPanel = document.getElementById("previewPanel");
const previewContent = document.getElementById("previewContent");

const testSendBtn = document.getElementById("testSendBtn");

/* ============================================================
   AUTH PANEL TOGGLE
============================================================ */

toggleAuthBtn.addEventListener("click", () => {
  const hidden = authPanel.classList.contains("auth-hidden");
  authPanel.classList.toggle("auth-hidden");
  toggleAuthBtn.textContent = hidden
    ? "Hide GitHub authentication"
    : "Show GitHub authentication";
});

/* ============================================================
   DARK MODE
============================================================ */

function applyDarkMode() {
  const mode = localStorage.getItem("darkMode") || "light";
  document.body.classList.toggle("dark", mode === "dark");
}

applyDarkMode();

darkModeToggle.addEventListener("click", () => {
  const current = localStorage.getItem("darkMode") || "light";
  const next = current === "light" ? "dark" : "light";
  localStorage.setItem("darkMode", next);
  applyDarkMode();
});

/* ============================================================
   PREVIEW PANEL TOGGLE
============================================================ */

previewToggle.addEventListener("click", () => {
  const hidden = previewPanel.classList.contains("preview-hidden");
  previewPanel.classList.toggle("preview-hidden");
  previewToggle.textContent = hidden ? "Hide preview" : "Show preview";
  if (hidden) updatePreview();
});

/* ============================================================
   LOAD list.json FROM GITHUB
============================================================ */

async function fetchFileMeta() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
  return res.json();
}

async function loadList() {
  try {
    const meta = await fetchFileMeta();
    const content = atob(meta.content.replace(/\n/g, ""));
    const json = JSON.parse(content);
    const items = json.items || [];

    itemsEl.value = items.join("\n");
    renderList(items);
    updatePreview();
  } catch (err) {
    console.error(err);
    setStatus("Error loading list.json – see console.");
  }
}

/* ============================================================
   SAVE list.json TO GITHUB
============================================================ */

async function saveList() {
  const username = ghUserEl.value.trim();
  const token = ghTokenEl.value.trim();

  if (!username || !token) {
    setStatus("Enter GitHub username and personal access token first.");
    return;
  }

  const lines = getListItems();
  const newJson = { items: lines };

  setStatus("Saving…");
  saveBtn.disabled = true;

  try {
    const meta = await fetchFileMeta();
    const sha = meta.sha;

    const newContent = btoa(
      unescape(encodeURIComponent(JSON.stringify(newJson, null, 2)))
    );

    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
    const body = {
      message: "Update list.json via web editor",
      content: newContent,
      sha
    };

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${username}:${token}`)
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Save error:", res.status, text);
      setStatus(`Error saving: ${res.status}. See console.`);
      return;
    }

    setStatus("Saved.");
  } catch (err) {
    console.error(err);
    setStatus("Error saving – see console.");
  } finally {
    saveBtn.disabled = false;
  }
}

saveBtn.addEventListener("click", saveList);

/* ============================================================
   DRAG / EDIT / DELETE / ADD
============================================================ */

let dragSrcEl = null;

function renderList(items) {
  sortableList.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.draggable = true;

    const handle = document.createElement("span");
    handle.textContent = "☰";
    handle.className = "drag-handle";

    const text = document.createElement("span");
    text.textContent = item;
    text.className = "item-text";

    // Inline editing
    text.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = text.textContent;
      input.className = "item-edit";

      text.replaceWith(input);
      input.focus();

      input.addEventListener("blur", () => {
        text.textContent = input.value.trim();
        input.replaceWith(text);
        syncTextarea();
        updatePreview();
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") input.blur();
      });
    });

    // Delete button
    const del = document.createElement("button");
    del.textContent = "×";
    del.className = "delete-btn";

    del.addEventListener("click", () => {
      li.remove();
      syncTextarea();
      updatePreview();
    });

    li.appendChild(handle);
    li.appendChild(text);
    li.appendChild(del);

    addDragEvents(li);
    sortableList.appendChild(li);
  });

  syncTextarea();
}

function addDragEvents(li) {
  li.addEventListener("dragstart", (e) => {
    dragSrcEl = li;
    li.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });

  li.addEventListener("dragend", () => {
    li.classList.remove("dragging");
    syncTextarea();
    updatePreview();
  });

  li.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dragging = sortableList.querySelector(".dragging");
    const siblings = [...sortableList.querySelectorAll("li:not(.dragging)")];
    const nextSibling = siblings.find(
      (s) => e.clientY <= s.offsetTop + s.offsetHeight / 2
    );
    sortableList.insertBefore(dragging, nextSibling);
  });
}

function getListItems() {
  return [...sortableList.querySelectorAll("li")].map(
    (li) => li.children[1].textContent
  );
}

function syncTextarea() {
  itemsEl.value = getListItems().join("\n");
}

/* ============================================================
   ADD ITEM (SAFE VERSION)
============================================================ */

addItemBtn.addEventListener("click", () => {
  const items = getListItems();
  items.push("");   // blank new item
  renderList(items);

  // Safe auto-focus
  const lastItem = sortableList.lastElementChild;
  if (lastItem) {
    const textSpan = lastItem.querySelector(".item-text");
    if (textSpan) textSpan.click();
  }

  updatePreview();
});

/* ============================================================
   PREVIEW
============================================================ */

function updatePreview() {
  const items = getListItems();

  const html = `
    <h3>Todays Personal Tasks Reminder</h3>
    <ul>
      ${items.map((i) => `<li>${i}</li>`).join("")}
    </ul>
  `;

  previewContent.innerHTML = html;
}

/* ============================================================
   TEST SEND
============================================================ */

testSendBtn.addEventListener("click", async () => {
  testStatusEl.textContent = "Triggering test email…";

  const url = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/test-send.yml/dispatches`;

  const username = ghUserEl.value.trim();
  const token = ghTokenEl.value.trim();

  if (!username || !token) {
    testStatusEl.textContent = "Enter GitHub username and token first.";
    return;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": "Basic " + btoa(`${username}:${token}`)
    },
    body: JSON.stringify({
      ref: "main",
      inputs: { test_mode: "true" }
    })
  });

  if (res.ok) {
    testStatusEl.textContent = "Test email triggered.";
  } else {
    testStatusEl.textContent = `Error triggering test email: ${res.status}`;
  }
});

/* ============================================================
   STATUS
============================================================ */

function setStatus(msg) {
  statusEl.textContent = msg;
}

/* ============================================================
   INITIAL LOAD
============================================================ */

loadList().catch(() => {});

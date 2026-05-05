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

const loadBtn = document.getElementById("loadBtn");
const saveBtn = document.getElementById("saveBtn");
const backupBtn = document.getElementById("backupBtn");
const restoreBtn = document.getElementById("restoreBtn");

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
  setStatus("Loading list.json from GitHub…");
  loadBtn.disabled = true;

  try {

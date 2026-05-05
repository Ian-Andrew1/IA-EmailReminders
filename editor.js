const OWNER = "Ian-Andrew1";
const REPO = "IA-EmailReminders";
const FILE_PATH = "list.json";

const itemsEl = document.getElementById("items");
const loadBtn = document.getElementById("loadBtn");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");
const ghUserEl = document.getElementById("ghUser");
const ghTokenEl = document.getElementById("ghToken");

const toggleAuthBtn = document.getElementById("toggleAuth");
const authPanel = document.getElementById("authPanel");

toggleAuthBtn.addEventListener("click", () => {
  const isHidden = authPanel.classList.contains("auth-hidden");
  if (isHidden) {
    authPanel.classList.remove("auth-hidden");
    toggleAuthBtn.textContent = "Hide GitHub authentication";
  } else {
    authPanel.classList.add("auth-hidden");
    toggleAuthBtn.textContent = "Show GitHub authentication";
  }
});

async function fetchFileMeta() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch file: ${res.status}`);
  }
  return res.json();
}

async function loadList() {
  setStatus("Loading list.json from GitHub…");
  loadBtn.disabled = true;
  try {
    const meta = await fetchFileMeta();
    const content = atob(meta.content.replace(/\n/g, ""));
    const json = JSON.parse(content);
    const items = json.items || [];
    itemsEl.value = items.join("\n");
    setStatus("Loaded.");
  } catch (err) {
    console.error(err);
    setStatus("Error loading list.json – see console.");
  } finally {
    loadBtn.disabled = false;
  }
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

async function saveList() {
  const username = ghUserEl.value.trim();
  const token = ghTokenEl.value.trim();

  if (!username || !token) {
    setStatus("Enter GitHub username and personal access token first.");
    return;
  }

  const lines = itemsEl.value
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const newJson = { items: lines };

  setStatus("Preparing save…");
  saveBtn.disabled = true;

  try {
    const meta = await fetchFileMeta();
    const sha = meta.sha;

    const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(newJson, null, 2))));

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

    setStatus("Saved to GitHub.");
  } catch (err) {
    console.error(err);
    setStatus("Error saving – see console.");
  } finally {
    saveBtn.disabled = false;
  }
}

loadBtn.addEventListener("click", loadList);

// Load once on page open
loadList().catch(() => {});

const STORAGE_KEY = "skate_challenge_state_v1";
const todayKey = () => new Date().toLocaleDateString("sv-SE");

const els = {
  doneCount: document.getElementById("doneCount"),
  totalCount: document.getElementById("totalCount"),
  remainingLabel: document.getElementById("remainingLabel"),
  todayLabel: document.getElementById("todayLabel"),
  progressBar: document.getElementById("progressBar"),
  searchInput: document.getElementById("searchInput"),
  kindChips: document.getElementById("kindChips"),
  levelChips: document.getElementById("levelChips"),
  doneToggle: document.getElementById("doneToggle"),
  donePanelCount: document.getElementById("donePanelCount"),
  doneList: document.getElementById("doneList"),
  emptyState: document.getElementById("emptyState"),
  trickList: document.getElementById("trickList"),
  template: document.getElementById("trickCardTemplate"),
};

let tricks = [];
let state = loadState();

function loadState() {
  const fallback = { date: todayKey(), done: [], saved: [], query: "", kind: "すべて", level: "すべて" };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || parsed.date !== todayKey()) {
      return fallback;
    }
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function saveState() {
  state.date = todayKey();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function boot() {
  const response = await fetch("./data/tricks.json", { cache: "no-store" });
  tricks = await response.json();
  els.searchInput.value = state.query;
  els.todayLabel.textContent = `${state.date} のチャレンジ`;
  render();
}

function unique(values) {
  return ["すべて", ...Array.from(new Set(values.filter(Boolean)))];
}

function normalizeKind(kind) {
  return String(kind).replace(/[\/・\s]/g, "");
}

function makeChip(label, key) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `chip${state[key] === label ? " active" : ""}`;
  button.textContent = label;
  button.addEventListener("click", () => {
    state[key] = label;
    saveState();
    render();
  });
  return button;
}

function renderChips() {
  els.kindChips.replaceChildren(...unique(tricks.map((trick) => trick.kind)).map((value) => makeChip(value, "kind")));
  els.levelChips.replaceChildren(...unique(tricks.map((trick) => trick.level)).map((value) => makeChip(value, "level")));
}

function filteredTricks() {
  const query = state.query.trim().toLowerCase();
  return tricks.filter((trick) => {
    if (state.done.includes(trick.id)) return false;
    const haystack = `${trick.name} ${trick.kind} ${trick.level} ${trick.memo}`.toLowerCase();
    return (!query || haystack.includes(query))
      && (state.kind === "すべて" || trick.kind === state.kind)
      && (state.level === "すべて" || trick.level === state.level);
  });
}

function doneTricks() {
  return state.done.map((id) => tricks.find((trick) => trick.id === id)).filter(Boolean);
}

function markDone(trick, card) {
  card.classList.add("done-pop");
  setTimeout(() => {
    if (!state.done.includes(trick.id)) {
      state.done.push(trick.id);
    }
    saveState();
    render();
  }, 220);
}

function undoDone(id) {
  state.done = state.done.filter((doneId) => doneId !== id);
  saveState();
  render();
}

function toggleSaved(id) {
  state.saved = state.saved.includes(id)
    ? state.saved.filter((savedId) => savedId !== id)
    : [...state.saved, id];
  saveState();
  render();
}

function renderCard(trick) {
  const fragment = els.template.content.cloneNode(true);
  const card = fragment.querySelector(".trick-card");
  card.classList.add(`kind-${normalizeKind(trick.kind)}`);
  fragment.querySelector(".number").textContent = trick.no;
  fragment.querySelector(".trick-name").textContent = trick.name;
  fragment.querySelector(".kind").textContent = trick.kind;
  fragment.querySelector(".level").textContent = trick.level || "練習";
  fragment.querySelector(".target").textContent = trick.target || "1回";
  const memo = fragment.querySelector(".memo");
  memo.textContent = trick.memo || "まずは1回でも触る";
  const video = fragment.querySelector(".video-button");
  video.href = trick.video;
  const save = fragment.querySelector(".save-button");
  const saved = state.saved.includes(trick.id);
  save.textContent = saved ? "★" : "☆";
  save.classList.toggle("active", saved);
  save.addEventListener("click", () => toggleSaved(trick.id));
  fragment.querySelector(".done-button").addEventListener("click", () => markDone(trick, card));
  return fragment;
}

function renderDoneList() {
  const done = doneTricks();
  els.donePanelCount.textContent = done.length;
  if (!done.length) {
    els.doneList.replaceChildren();
    return;
  }
  els.doneList.replaceChildren(...done.map((trick) => {
    const row = document.createElement("div");
    row.className = "done-item";
    const name = document.createElement("span");
    name.textContent = `${trick.no}. ${trick.name}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "undo-button";
    button.textContent = "もどす";
    button.addEventListener("click", () => undoDone(trick.id));
    row.append(name, button);
    return row;
  }));
}

function render() {
  renderChips();
  const done = state.done.length;
  const total = tricks.length;
  const remaining = Math.max(total - done, 0);
  els.doneCount.textContent = done;
  els.totalCount.textContent = total;
  els.remainingLabel.textContent = `残り ${remaining} 技`;
  els.progressBar.style.width = total ? `${Math.round((done / total) * 100)}%` : "0%";
  renderDoneList();

  const rows = filteredTricks();
  els.emptyState.hidden = !(remaining === 0 && total > 0);
  els.trickList.replaceChildren(...rows.map(renderCard));
}

els.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  saveState();
  render();
});

els.doneToggle.addEventListener("click", () => {
  els.doneList.hidden = !els.doneList.hidden;
});

boot().catch((error) => {
  els.trickList.innerHTML = `<div class="empty-state"><h2>読み込みに失敗しました</h2><p>${error.message}</p></div>`;
});

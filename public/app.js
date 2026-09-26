import {
  STATUSES, EMOJIS, MAX_NAME_LENGTH, DOMAIN_BOARDS, BOARD_ID_LENGTH, BOARD_ID_ALPHABET, ADMIN_ROUTE, TOAST_MS,
} from "./config.js";
import { db, firestore } from "./firebase.js";
import { enableDrag } from "./drag.js";
import { showAdmin } from "./admin.js";
import { renderPeopleEditor } from "./people.js";

const {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp,
} = firestore;

const $ = (selector) => document.querySelector(selector);

const UNASSIGNED = "";
const ALL = "*";
const FILTER_STORAGE_PREFIX = "filter-";
const DONE = STATUSES.at(-1).id;

let boardId = "";
let board = null;
let tasks = [];
let activeStatus = STATUSES[0].id;
let filter = ALL;
let editing = null;
let newBoard = null;
let editedPeople = [];
let unsubscribers = [];

function randomBoardId() {
  const bytes = crypto.getRandomValues(new Uint8Array(BOARD_ID_LENGTH));
  return Array.from(bytes, (b) => BOARD_ID_ALPHABET[b % BOARD_ID_ALPHABET.length]).join("");
}

function boardDoc() {
  return doc(db, "boards", boardId);
}

function tasksCollection() {
  return collection(boardDoc(), "tasks");
}

// Keeps the admin page sorted by activity.
function touchBoard() {
  return updateDoc(boardDoc(), { lastActivityAt: serverTimestamp() });
}

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function toast(message) {
  const box = $("#toast");
  box.textContent = message;
  box.hidden = false;
  setTimeout(() => { box.hidden = true; }, TOAST_MS);
}

function statusLabel(statusId) {
  return STATUSES.find((s) => s.id === statusId).label;
}

function nextStatus(statusId) {
  return STATUSES[STATUSES.findIndex((s) => s.id === statusId) + 1];
}

function today() {
  return new Date().toLocaleDateString("sv");
}

function formatDate(isoDate) {
  return new Date(`${isoDate}T00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function compareTasks(a, b) {
  const dueA = a.dueDate || "9999";
  const dueB = b.dueDate || "9999";
  return dueA.localeCompare(dueB) || (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0);
}

function visibleTasks() {
  const matching = filter === ALL ? tasks : tasks.filter((t) => t.assignee === filter);
  return [...matching].sort(compareTasks);
}

async function changeStatus(taskId, status) {
  await updateDoc(doc(tasksCollection(), taskId), { status, updatedAt: serverTimestamp() });
  touchBoard();
  toast(`→ ${statusLabel(status)}`);
}

/* ---------- Routing ---------- */

function showPage(id) {
  document.querySelectorAll("body > section").forEach((section) => { section.hidden = section.id !== id; });
}

function openBoard() {
  let isFirstSnapshot = true;
  filter = localStorage.getItem(FILTER_STORAGE_PREFIX + boardId) ?? ALL;
  const stopBoard = onSnapshot(boardDoc(), (snapshot) => {
    if (snapshot.exists()) {
      board = snapshot.data();
      showPage("board");
      renderBoardHeader();
      renderBoard();
      if (isFirstSnapshot) touchBoard();
    } else {
      showPage("not-found");
    }
    isFirstSnapshot = false;
  });
  const stopTasks = onSnapshot(tasksCollection(), (snapshot) => {
    tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderBoard();
  });
  unsubscribers = [stopBoard, stopTasks];
}

function route() {
  const hash = location.hash.slice(1) || (DOMAIN_BOARDS[location.hostname] ?? "");
  unsubscribers.forEach((stop) => stop());
  unsubscribers = [];
  board = null;
  tasks = [];
  boardId = "";
  if (hash === ADMIN_ROUTE) {
    showPage("admin");
    showAdmin();
  } else if (hash) {
    boardId = hash;
    openBoard();
  } else {
    showPage("home");
    renderCreateForm();
  }
}

/* ---------- Board creation ---------- */

function renderEmojiPicker() {
  $("#emoji-picker").replaceChildren(...EMOJIS.map((emoji) => {
    const button = el("button", { type: "button", className: emoji === newBoard.emoji ? "active" : "", textContent: emoji });
    button.addEventListener("click", () => { newBoard.emoji = emoji; renderEmojiPicker(); });
    return button;
  }));
}

function renderCreateForm() {
  newBoard = { emoji: EMOJIS[0], people: [] };
  $("#create-form").reset();
  $("#create-form").elements.name.maxLength = MAX_NAME_LENGTH;
  renderEmojiPicker();
  renderPeopleEditor($("#create-people"), newBoard.people);
}

async function createBoard(event) {
  event.preventDefault();
  const id = randomBoardId();
  await setDoc(doc(db, "boards", id), {
    name: event.target.elements.name.value.trim(),
    emoji: newBoard.emoji,
    people: newBoard.people,
    lastActivityAt: serverTimestamp(),
  });
  location.hash = id;
}

/* ---------- People ---------- */

function openPeopleDialog() {
  editedPeople = [...board.people];
  renderPeopleEditor($("#edit-people-list"), editedPeople);
  $("#people-dialog").showModal();
}

async function savePeople(event) {
  event.preventDefault();
  $("#people-dialog").close();
  await updateDoc(boardDoc(), { people: editedPeople, lastActivityAt: serverTimestamp() });
  toast("Personnes enregistrées ✔");
}

function personOptions(extraName) {
  const names = board.people.includes(extraName) || extraName === UNASSIGNED ? board.people : [...board.people, extraName];
  return names.map((p) => el("option", { value: p, textContent: p }));
}

/* ---------- Board ---------- */

function renderBoardHeader() {
  const title = `${board.emoji} ${board.name}`;
  $("#board-name").textContent = title;
  document.title = title;
  const known = filter === ALL || filter === UNASSIGNED || board.people.includes(filter);
  filter = known ? filter : ALL;
  const select = $("#filter");
  select.replaceChildren(
    el("option", { value: ALL, textContent: "Tout le monde" }),
    ...personOptions(UNASSIGNED),
    el("option", { value: UNASSIGNED, textContent: "Non assigné" }),
  );
  select.value = filter;
}

function renderCard(task) {
  const items = task.checklist ?? [];
  const doneCount = items.filter((i) => i.done).length;
  const meta = el("div", { className: "meta" });
  if (task.assignee) meta.append(el("span", { className: "badge", textContent: task.assignee }));
  if (task.dueDate) {
    const overdue = task.status !== DONE && task.dueDate < today();
    meta.append(el("span", { className: overdue ? "due overdue" : "due", textContent: `📅 ${formatDate(task.dueDate)}` }));
  }
  if (items.length) {
    const complete = doneCount === items.length;
    meta.append(el("span", { className: complete ? "progress complete" : "progress", textContent: `☑ ${doneCount}/${items.length}` }));
  }
  const card = el("div", { className: `card status-${task.status}`, role: "button", tabIndex: 0 },
    el("div", { className: "card-title", textContent: task.title }), meta);
  card.dataset.id = task.id;
  card.addEventListener("click", () => openEditor(task));
  const next = nextStatus(task.status);
  if (next) {
    const shortcut = el("button", { className: `next-status status-${next.id}`, textContent: `→ ${next.label}` });
    shortcut.addEventListener("click", (e) => {
      e.stopPropagation();
      changeStatus(task.id, next.id);
    });
    card.append(shortcut);
  }
  return card;
}

function renderBoard() {
  if (board === null) return;
  const shown = visibleTasks();
  $("#tabs").replaceChildren(...STATUSES.map((s) => {
    const count = shown.filter((t) => t.status === s.id).length;
    const tab = el("button", { className: `tab status-${s.id}${s.id === activeStatus ? " active" : ""}` },
      s.label, el("span", { className: "count", textContent: count }));
    tab.dataset.status = s.id;
    tab.addEventListener("click", () => { activeStatus = s.id; renderBoard(); });
    return tab;
  }));
  $("#columns").replaceChildren(...STATUSES.map((s) => {
    const cards = shown.filter((t) => t.status === s.id).map(renderCard);
    const empty = el("p", { className: "empty", textContent: "Aucune tâche" });
    const column = el("section", { className: `column status-${s.id}${s.id === activeStatus ? " active" : ""}` },
      el("h2", { textContent: s.label }), ...(cards.length ? cards : [empty]));
    column.dataset.status = s.id;
    return column;
  }));
}

function onDrop(taskId, status) {
  const task = tasks.find((t) => t.id === taskId);
  if (task.status !== status) changeStatus(taskId, status);
}

/* ---------- Editor ---------- */

function renderStatusPicker(current) {
  $("#status-picker").replaceChildren(...STATUSES.map((s) => {
    const button = el("button", { type: "button", className: `status-${s.id}${s.id === current ? " active" : ""}`, textContent: s.label });
    button.addEventListener("click", () => { editing.status = s.id; renderStatusPicker(s.id); });
    return button;
  }));
}

function renderChecklist() {
  $("#checklist").replaceChildren(...editing.checklist.map((item, index) => {
    const box = el("input", { type: "checkbox", checked: item.done });
    box.addEventListener("change", () => { item.done = box.checked; });
    const text = el("input", { className: "item-text", value: item.text });
    text.addEventListener("input", () => { item.text = text.value; });
    const remove = el("button", { type: "button", className: "ghost", textContent: "✕", ariaLabel: "Retirer" });
    remove.addEventListener("click", () => { editing.checklist.splice(index, 1); renderChecklist(); });
    return el("li", {}, box, text, remove);
  }));
}

function openEditor(task) {
  const isNew = !task;
  editing = {
    id: task?.id,
    status: task?.status ?? activeStatus,
    checklist: structuredClone(task?.checklist ?? []),
  };
  const form = $("#task-form");
  form.elements.assignee.replaceChildren(
    el("option", { value: UNASSIGNED, textContent: "— Personne —" }),
    ...personOptions(task?.assignee ?? UNASSIGNED),
  );
  form.elements.title.value = task?.title ?? "";
  form.elements.description.value = task?.description ?? "";
  form.elements.assignee.value = task?.assignee ?? (filter === ALL ? UNASSIGNED : filter);
  form.elements.dueDate.value = task?.dueDate ?? "";
  $("#editor-title").textContent = isNew ? "Nouvelle tâche" : "Modifier";
  $("#delete").hidden = isNew;
  renderStatusPicker(editing.status);
  renderChecklist();
  $("#editor").showModal();
  if (isNew) form.elements.title.focus();
}

function addChecklistItem() {
  const input = $("#new-item");
  const text = input.value.trim();
  if (text) {
    editing.checklist.push({ text, done: false });
    input.value = "";
    renderChecklist();
  }
  input.focus();
}

async function saveTask(event) {
  event.preventDefault();
  const form = event.target;
  const data = {
    title: form.elements.title.value.trim(),
    description: form.elements.description.value.trim(),
    assignee: form.elements.assignee.value,
    dueDate: form.elements.dueDate.value,
    status: editing.status,
    checklist: editing.checklist.filter((i) => i.text.trim()),
    updatedAt: serverTimestamp(),
  };
  $("#editor").close();
  activeStatus = data.status;
  if (editing.id) {
    await updateDoc(doc(tasksCollection(), editing.id), data);
  } else {
    await addDoc(tasksCollection(), { ...data, createdAt: serverTimestamp() });
  }
  touchBoard();
  toast("Enregistré ✔");
}

async function removeTask() {
  if (confirm("Supprimer cette tâche ?")) {
    $("#editor").close();
    await deleteDoc(doc(tasksCollection(), editing.id));
    toast("Tâche supprimée");
  }
}

/* ---------- Share ---------- */

async function share() {
  const url = location.href;
  if (navigator.share) {
    await navigator.share({ title: document.title, url });
  } else {
    await navigator.clipboard.writeText(url);
    toast("Lien copié");
  }
}

/* ---------- Init ---------- */

enableDrag(onDrop);

$("#create-form").addEventListener("submit", createBoard);
$("#filter").addEventListener("change", (e) => {
  filter = e.target.value;
  localStorage.setItem(FILTER_STORAGE_PREFIX + boardId, filter);
  renderBoard();
});
$("#edit-people").addEventListener("click", openPeopleDialog);
$("#people-form").addEventListener("submit", savePeople);
$("#people-close").addEventListener("click", () => $("#people-dialog").close());
$("#share").addEventListener("click", share);
$("#add").addEventListener("click", () => openEditor(null));
$("#close").addEventListener("click", () => $("#editor").close());
$("#task-form").addEventListener("submit", saveTask);
$("#add-item").addEventListener("click", addChecklistItem);
$("#new-item").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addChecklistItem();
  }
});
$("#delete").addEventListener("click", removeTask);
window.addEventListener("hashchange", route);

route();

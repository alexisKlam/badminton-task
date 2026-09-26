import { ADMIN_EMAIL } from "./config.js";
import { app, db, firestore, loadAuth } from "./firebase.js";

const { collection, getDocs, query, orderBy } = firestore;
const $ = (selector) => document.querySelector(selector);

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function formatDateTime(timestamp) {
  return timestamp.toDate().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

async function renderBoards() {
  $("#admin-status").textContent = "Chargement…";
  const boards = await getDocs(query(collection(db, "boards"), orderBy("lastActivityAt", "desc")));
  const rows = await Promise.all(boards.docs.map(async (board) => {
    const tasks = await getDocs(collection(db, "boards", board.id, "tasks"));
    const titles = tasks.docs.map((t) => t.data().title).join(" · ");
    const { emoji, name } = board.data();
    return el("li", {},
      el("a", { href: `#${board.id}`, textContent: `${emoji} ${name}` }),
      el("div", { className: "admin-meta", textContent: `${tasks.size} tâche(s) · dernière activité ${formatDateTime(board.data().lastActivityAt)}` }),
      el("div", { className: "admin-titles", textContent: titles }));
  }));
  $("#admin-status").textContent = `${boards.size} tableau(x)`;
  $("#admin-list").replaceChildren(...rows);
}

export async function showAdmin() {
  const { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } = await loadAuth();
  const auth = getAuth(app);
  const signInButton = $("#admin-signin");
  signInButton.onclick = () => signInWithPopup(auth, new GoogleAuthProvider());
  onAuthStateChanged(auth, (user) => {
    const isAdmin = user?.email === ADMIN_EMAIL;
    signInButton.hidden = isAdmin;
    $("#admin-list").replaceChildren();
    $("#admin-status").textContent = user ? `${user.email} n'est pas autorisé.` : "Connecte-toi avec le compte admin.";
    if (isAdmin) renderBoards();
  });
}

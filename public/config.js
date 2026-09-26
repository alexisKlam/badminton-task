export const FIREBASE_SDK_VERSION = "12.19.0";

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAkpLqNm7T2Uz1Z5peyy48C2arOOngLmLk",
  authDomain: "bcv38-taches.firebaseapp.com",
  projectId: "bcv38-taches",
  storageBucket: "bcv38-taches.firebasestorage.app",
  messagingSenderId: "426948137848",
  appId: "1:426948137848:web:3e5469c8c94da0f0732e8d",
};

// Ordered: the "next status" shortcut follows this order.
export const STATUSES = [
  { id: "todo", label: "À faire" },
  { id: "doing", label: "En cours" },
  { id: "done", label: "Terminé" },
];

export const EMOJIS = ["🏸", "🏆", "🎉", "📅", "🛠️", "💰", "📣", "🍕"];
export const MAX_PEOPLE = 30;
export const MAX_NAME_LENGTH = 60;

export const BOARD_ID_LENGTH = 10;
export const BOARD_ID_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

// Admin page (https://<site>/#admin): Google sign-in, only this account may list boards (see firestore.rules).
export const ADMIN_ROUTE = "admin";
export const ADMIN_EMAIL = "alexis.k@bcv38.org";

export const LONG_PRESS_MS = 350;
export const DRAG_THRESHOLD_PX = 8;
export const TOAST_MS = 2000;

import { FIREBASE_SDK_VERSION, FIREBASE_CONFIG } from "./config.js";

const SDK_URL = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;

const { initializeApp } = await import(`${SDK_URL}/firebase-app.js`);

export const firestore = await import(`${SDK_URL}/firebase-firestore.js`);
export const app = initializeApp(FIREBASE_CONFIG);
export const db = firestore.getFirestore(app);
export const loadAuth = () => import(`${SDK_URL}/firebase-auth.js`);

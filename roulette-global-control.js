import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { doc, getFirestore, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD8gAtsn_9B-OmkJKidFFj8VUU91gG_6Vs",
  authDomain: "copao-na-mao.firebaseapp.com",
  projectId: "copao-na-mao",
  storageBucket: "copao-na-mao.firebasestorage.app",
  messagingSenderId: "122784714195",
  appId: "1:122784714195:web:9313db74fe2fa3078b7326",
  measurementId: "G-DB7HSLZ7W9"
};

const CYCLE_LENGTH = 50;
const CONTROL_COLLECTION = "rouletteControl";
const CONTROL_DOCUMENT = "global";
const SPINS_COLLECTION = "rouletteSpins";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function randomWinningPosition() {
  if (window.crypto?.getRandomValues) {
    const buffer = new Uint32Array(1);
    window.crypto.getRandomValues(buffer);
    return (buffer[0] % CYCLE_LENGTH) + 1;
  }
  return Math.floor(Math.random() * CYCLE_LENGTH) + 1;
}

function waitForAuthenticatedUser(timeoutMs = 6000) {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);

  return new Promise((resolve, reject) => {
    let finished = false;
    const timer = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      unsubscribe();
      reject(new Error("roulette_auth_timeout"));
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || finished) return;
      finished = true;
      window.clearTimeout(timer);
      unsubscribe();
      resolve(user);
    }, (error) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      unsubscribe();
      reject(error);
    });
  });
}

function normalizedControl(data = {}) {
  const totalSpins = Math.max(0, Number(data.totalSpins || 0));
  const cycleNumber = Math.max(1, Number(data.cycleNumber || 1));
  const cyclePosition = Math.min(Math.max(0, Number(data.cyclePosition || 0)), CYCLE_LENGTH - 1);
  const winningPosition = Math.min(Math.max(1, Number(data.winningPosition || randomWinningPosition())), CYCLE_LENGTH);

  return { totalSpins, cycleNumber, cyclePosition, winningPosition };
}

async function claimSpin() {
  const user = await waitForAuthenticatedUser();
  const day = todayKey();
  const spinId = `${user.uid}_${day}`;
  const spinRef = doc(db, SPINS_COLLECTION, spinId);
  const controlRef = doc(db, CONTROL_COLLECTION, CONTROL_DOCUMENT);

  return runTransaction(db, async (transaction) => {
    const existingSpin = await transaction.get(spinRef);
    if (existingSpin.exists()) {
      const saved = existingSpin.data() || {};
      return {
        status: "already_played",
        result: saved.result === "win_5_off" ? "win_5_off" : "no_prize",
        cycleNumber: Number(saved.cycleNumber || 0),
        cyclePosition: Number(saved.cyclePosition || 0),
        source: "firestore"
      };
    }

    const controlSnapshot = await transaction.get(controlRef);
    const current = controlSnapshot.exists()
      ? normalizedControl(controlSnapshot.data())
      : normalizedControl({ winningPosition: randomWinningPosition() });

    const spinPosition = current.cyclePosition + 1;
    const won = spinPosition === current.winningPosition;
    const result = won ? "win_5_off" : "no_prize";
    const completedCycle = spinPosition >= CYCLE_LENGTH;

    const nextControl = completedCycle
      ? {
          totalSpins: current.totalSpins + 1,
          cycleNumber: current.cycleNumber + 1,
          cyclePosition: 0,
          winningPosition: randomWinningPosition(),
          lastCompletedCycle: current.cycleNumber,
          lastResult: result,
          lastSpinDay: day,
          lastSpinUid: user.uid,
          updatedAt: serverTimestamp()
        }
      : {
          totalSpins: current.totalSpins + 1,
          cycleNumber: current.cycleNumber,
          cyclePosition: spinPosition,
          winningPosition: current.winningPosition,
          lastCompletedCycle: Number(controlSnapshot.data()?.lastCompletedCycle || 0),
          lastResult: result,
          lastSpinDay: day,
          lastSpinUid: user.uid,
          updatedAt: serverTimestamp()
        };

    transaction.set(controlRef, nextControl);
    transaction.set(spinRef, {
      uid: user.uid,
      day,
      result,
      prizeType: won ? "fixed_discount" : "none",
      prizeValue: won ? 5 : 0,
      cycleNumber: current.cycleNumber,
      cyclePosition: spinPosition,
      createdAt: serverTimestamp()
    });

    return {
      status: "created",
      result,
      cycleNumber: current.cycleNumber,
      cyclePosition: spinPosition,
      source: "firestore"
    };
  });
}

window.copaoRouletteControl = Object.freeze({
  claimSpin,
  cycleLength: CYCLE_LENGTH
});

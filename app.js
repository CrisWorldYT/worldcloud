import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc,
  getDocs, updateDoc, increment,
  collection, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* ================= INIT ================= */

console.log("✅ JS cargado");

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "world-cloud-ff368.firebaseapp.com",
  projectId: "world-cloud-ff368"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const $ = id => document.getElementById(id);
let currentPlan = "FREE";

/* ================= REDIRECT ================= */

async function handleRedirect() {
  try {
    const code = new URLSearchParams(location.search).get("c");
    if (!code) return;

    console.log("Redireccionando código:", code);

    $("redirectScreen")?.classList.remove("hidden");

    const ref = doc(db, "links", code);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.log("Código no encontrado");
      return;
    }

    updateDoc(ref, { clicks: increment(1) }).catch(() => {});
    setTimeout(() => {
      location.href = snap.data().originalURL;
    }, 300);

  } catch (err) {
    console.error("Error en redirect:", err);
  }
}

handleRedirect();

/* ================= LOGIN ================= */

$("loginBtn")?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
  } catch (err) {
    console.error("Error login:", err);
    alert("Error en login");
  }
});

$("logoutBtn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Error logout:", err);
  }
});

/* ================= AUTH STATE ================= */

onAuthStateChanged(auth, async user => {
  console.log("Auth state:", user);

  if (!user) return;

  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, { plan: "FREE" });
      currentPlan = "FREE";
    } else {
      currentPlan = snap.data().plan || "FREE";
    }

    updatePlanUI();

  } catch (err) {
    console.error("Error cargando usuario:", err);
  }
});

/* ================= PLAN UI ================= */

function updatePlanUI() {
  const isPro = currentPlan === "PRO";

  console.log("Plan actual:", currentPlan);

  $("customSection")?.classList.toggle("hidden", !isPro);

  if ($("planChip")) {
    $("planChip").textContent = currentPlan;
  }
}

/* ================= PREVIEW ================= */

$("customCode")?.addEventListener("input", () => {
  const val = $("customCode").value.trim();
  $("previewURL").textContent = val
    ? location.origin + "/" + val
    : "";
});

/* ================= CREAR LINK ================= */

$("shortBtn")?.addEventListener("click", async () => {

  const user = auth.currentUser;
  if (!user) {
    alert("Iniciá sesión primero");
    return;
  }

  const url = $("urlInput").value.trim();
  if (!url) {
    alert("Poné una URL");
    return;
  }

  try {

    let code;

    if (currentPlan === "PRO") {

      const custom = $("customCode")?.value.trim();

      if (custom) {
        const check = await getDoc(doc(db, "links", custom));
        if (check.exists()) {
          $("customError").textContent = "Ese enlace ya existe";
          $("customError").classList.remove("hidden");
          return;
        }
        $("customError").classList.add("hidden");
        code = custom;
      } else {
        code = Math.random().toString(36).substring(2, 8);
      }

    } else {

      const q = query(
        collection(db, "links"),
        where("userId", "==", user.uid)
      );

      const snap = await getDocs(q);

      if (snap.size >= 1) {
        alert("FREE solo permite 1 enlace");
        return;
      }

      code = Math.random().toString(36).substring(2, 8);
    }

    await setDoc(doc(db, "links", code), {
      originalURL: url,
      userId: user.uid,
      clicks: 0
    });

    const shortURL = location.origin + "?c=" + code;

    $("shortLink").textContent = shortURL;
    $("resultSection").classList.remove("hidden");

    if (currentPlan === "PRO") {
      const qr =
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortURL)}`;
      $("qrImage").src = qr;
      $("qrSection").classList.remove("hidden");
    } else {
      $("qrSection")?.classList.add("hidden");
    }

    console.log("✅ Link creado:", shortURL);

  } catch (err) {
    console.error("Error creando link:", err);
    alert("Error creando enlace. Mirá la consola.");
  }
});
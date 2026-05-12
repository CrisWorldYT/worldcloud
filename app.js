import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc,
  getDocs, deleteDoc, collection, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBxnH0R6jVFMQIwlxXWtGJ65p8g-exm6ss",
  authDomain: "world-cloud-ff368.firebaseapp.com",
  projectId: "world-cloud-ff368",
  storageBucket: "world-cloud-ff368.firebasestorage.app",
  messagingSenderId: "222094732623",
  appId: "1:222094732623:web:7e6c9816289d8f2948293a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const $ = id => document.getElementById(id);
let currentPlan = "FREE";

/* THEME */
$("themeToggle").onclick = () => {
  document.body.classList.toggle("light");
};

/* LOGIN */
$("loginBtn").onclick = () => signInWithPopup(auth, new GoogleAuthProvider());
$("logoutBtn").onclick = () => signOut(auth);

onAuthStateChanged(auth, async user => {
  if (user) {
    $("authBtns").classList.add("hidden");
    $("userInfo").classList.remove("hidden");
    $("userName").textContent = user.displayName;
    $("userPhoto").src = user.photoURL;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, { plan: "FREE" });
      currentPlan = "FREE";
    } else {
      currentPlan = snap.data().plan;
    }

    updatePlanUI();
    loadLinks(user.uid);
  } else {
    $("authBtns").classList.remove("hidden");
    $("userInfo").classList.add("hidden");
    $("dashboard").classList.add("hidden");
  }
});

/* PLANES */
$("selectFree").onclick = () => updatePlan("FREE");
$("selectPro").onclick = () => updatePlan("PRO");

async function updatePlan(plan) {
  const user = auth.currentUser;
  if (!user) return alert("Iniciá sesión primero");

  await setDoc(doc(db, "users", user.uid), { plan });
  currentPlan = plan;
  updatePlanUI();
}

function updatePlanUI() {
  $("userPlanBadge").textContent = currentPlan;

  $("freeCard").classList.remove("active");
  $("proCard").classList.remove("active");
  $("selectFree").classList.remove("selected");
  $("selectPro").classList.remove("selected");
  $("selectFree").textContent = "Seleccionar plan";
  $("selectPro").textContent = "Seleccionar plan";

  if (currentPlan === "FREE") {
    $("freeCard").classList.add("active");
    $("selectFree").classList.add("selected");
    $("selectFree").textContent = "Plan actual";
  } else {
    $("proCard").classList.add("active");
    $("selectPro").classList.add("selected");
    $("selectPro").textContent = "Plan actual";
  }
}

/* CREAR LINK */
$("shortBtn").onclick = async () => {
  const user = auth.currentUser;
  if (!user) return alert("Iniciá sesión primero");

  const url = $("urlInput").value.trim();
  if (!url) return alert("Ingresá una URL");

  const q = query(collection(db, "links"), where("userId", "==", user.uid));
  const snap = await getDocs(q);

  if (currentPlan === "FREE" && snap.size >= 1) {
    alert("Plan FREE solo permite 1 enlace");
    return;
  }

  const code = Math.random().toString(36).substring(2, 8);

  await setDoc(doc(db, "links", code), {
    originalURL: url,
    userId: user.uid
  });

  $("shortLink").textContent = location.origin + "?c=" + code;
  $("resultSection").classList.remove("hidden");
  loadLinks(user.uid);
};

/* DASHBOARD */
async function loadLinks(uid) {
  $("dashboard").classList.remove("hidden");
  $("linksList").innerHTML = "";

  const q = query(collection(db, "links"), where("userId", "==", uid));
  const snap = await getDocs(q);

  snap.forEach(d => {
    const div = document.createElement("div");
    div.className = "link-item";
    div.innerHTML = `
      <span>${location.origin}?c=${d.id}</span>
      <button class="btn-ghost" onclick="deleteLink('${d.id}')">🗑️ Eliminar</button>
    `;
    $("linksList").appendChild(div);
  });
}

/* ELIMINAR */
window.deleteLink = async (id) => {
  if (!confirm("¿Eliminar enlace?")) return;
  await deleteDoc(doc(db, "links", id));
  loadLinks(auth.currentUser.uid);
};
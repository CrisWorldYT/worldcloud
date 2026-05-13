/* =========================================================
   WORLD CLOUD PRO — FULL APP
   Reemplaza TODO tu app.js por esto
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBxnH0R6jVFMQIwlxXWtGJ65p8g-exm6ss",
  authDomain: "world-cloud-ff368.firebaseapp.com",
  projectId: "world-cloud-ff368"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

const $ = id => document.getElementById(id);

let currentPlan = "FREE";
let currentUser = null;

/* =========================================================
   INIT
========================================================= */

console.log("✅ WORLD CLOUD LOADED");

/* =========================================================
   REDIRECT
========================================================= */

async function handleRedirect() {

  const code = new URLSearchParams(location.search).get("c");

  if (!code) return;

  $("redirectScreen")?.classList.remove("hidden");

  const ref = doc(db, "links", code);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  updateDoc(ref, {
    clicks: increment(1)
  }).catch(() => {});

  setTimeout(() => {
    location.href = snap.data().originalURL;
  }, 300);
}

handleRedirect();

/* =========================================================
   LOGIN
========================================================= */

$("loginBtn")?.addEventListener("click", async () => {

  try {
    await signInWithPopup(
      auth,
      new GoogleAuthProvider()
    );
  } catch (e) {
    console.error(e);
    showToast("❌ Error login");
  }
});

$("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
});

/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(auth, async user => {

  if (!user) {

    currentUser = null;

    $("authBtns")?.classList.remove("hidden");
    $("userInfo")?.classList.add("hidden");

    return;
  }

  currentUser = user;

  $("authBtns")?.classList.add("hidden");
  $("userInfo")?.classList.remove("hidden");

  /* USER INFO */

  $("userName").textContent = user.displayName;

  if (!$("userAvatar")) {

    const img = document.createElement("img");

    img.src = user.photoURL;
    img.id = "userAvatar";

    img.style.width = "42px";
    img.style.height = "42px";
    img.style.borderRadius = "50%";
    img.style.objectFit = "cover";
    img.style.marginBottom = "10px";
    img.style.border = "2px solid #6366f1";

    $("userInfo").prepend(img);
  }

  /* USER PLAN */

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {

    await setDoc(userRef, {
      plan: "FREE"
    });

    currentPlan = "FREE";

  } else {

    currentPlan = userSnap.data().plan || "FREE";
  }

  updatePlanUI();

  loadDashboard();
});

/* =========================================================
   THEME
========================================================= */

$("themeToggle")?.addEventListener("click", () => {

  document.body.classList.toggle("light");

  localStorage.setItem(
    "theme",
    document.body.classList.contains("light")
      ? "light"
      : "dark"
  );
});

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light");
}

/* =========================================================
   PLAN UI
========================================================= */

function updatePlanUI() {

  const isPro = currentPlan === "PRO";

  $("planChip").textContent = currentPlan;
  $("userPlanBadge").textContent = currentPlan;

  $("userPlanBadge").className =
    isPro
      ? "badge pro"
      : "badge free";

  $("customSection")?.classList.toggle(
    "hidden",
    !isPro
  );

  document.querySelectorAll(".pro-only")
    .forEach(el => {
      el.classList.toggle("hidden", !isPro);
    });

  updatePlanButtons();
}

/* =========================================================
   PLAN BUTTONS
========================================================= */

function updatePlanButtons() {

  if (currentPlan === "FREE") {

    $("selectFree").textContent =
      "✅ Plan actual";

    $("selectPro").textContent =
      "Seleccionar PRO";

  } else {

    $("selectPro").textContent =
      "✅ Plan actual";

    $("selectFree").textContent =
      "Cambiar a FREE";
  }
}

/* =========================================================
   CHANGE PLAN
========================================================= */

$("selectFree")?.addEventListener("click", () => {
  changePlan("FREE");
});

$("selectPro")?.addEventListener("click", () => {
  changePlan("PRO");
});

async function changePlan(plan) {

  if (!currentUser) return;

  if (currentPlan === plan) {
    showToast("😎 Ya tenés este plan");
    return;
  }

  await updateDoc(
    doc(db, "users", currentUser.uid),
    { plan }
  );

  currentPlan = plan;

  updatePlanUI();

  if (plan === "PRO") {
    triggerProAnimation();
    launchConfetti();
  }

  showToast("✅ Plan cambiado correctamente");
}

/* =========================================================
   CONFETTI
========================================================= */

function launchConfetti() {

  for (let i = 0; i < 80; i++) {

    const confetti = document.createElement("div");

    confetti.style.position = "fixed";
    confetti.style.width = "8px";
    confetti.style.height = "8px";
    confetti.style.background =
      `hsl(${Math.random()*360},100%,60%)`;

    confetti.style.left =
      Math.random() * innerWidth + "px";

    confetti.style.top = "-10px";

    confetti.style.borderRadius = "50%";

    confetti.style.zIndex = "99999";

    confetti.style.pointerEvents = "none";

    document.body.appendChild(confetti);

    const duration = 2000 + Math.random() * 2000;

    confetti.animate([
      {
        transform: "translateY(0px) rotate(0deg)",
        opacity: 1
      },
      {
        transform:
          `translateY(${innerHeight+100}px)
           rotate(${Math.random()*720}deg)`,

        opacity: 0
      }
    ], {
      duration,
      easing: "cubic-bezier(.2,.8,.2,1)"
    });

    setTimeout(() => confetti.remove(), duration);
  }
}

/* =========================================================
   PRO ANIMATION
========================================================= */

function triggerProAnimation() {

  $("proCard")?.classList.add("upgrade-flash");

  setTimeout(() => {
    $("proCard")?.classList.add("pro-active-glow");
  }, 800);
}

/* =========================================================
   PREVIEW
========================================================= */

$("customCode")?.addEventListener("input", () => {

  const val = $("customCode").value.trim();

  $("previewURL").textContent =
    val
      ? location.origin + "/" + val
      : "";
});

/* =========================================================
   CREATE LINK
========================================================= */

$("shortBtn")?.addEventListener("click", async () => {

  if (!currentUser) {
    showToast("🔐 Iniciá sesión");
    return;
  }

  const url = $("urlInput").value.trim();

  if (!url) {
    showToast("⚠ Poné una URL");
    return;
  }

  let code;

  /* FREE LIMIT */

  if (currentPlan === "FREE") {

    const q = query(
      collection(db, "links"),
      where("userId", "==", currentUser.uid)
    );

    const existing = await getDocs(q);

    if (existing.size >= 1) {
      showToast("❌ FREE solo permite 1 enlace");
      return;
    }

    code = Math.random()
      .toString(36)
      .substring(2, 8);

  } else {

    const custom =
      $("customCode").value.trim();

    if (custom) {

      const exists =
        await getDoc(doc(db, "links", custom));

      if (exists.exists()) {

        $("customError").textContent =
          "Ese enlace ya existe";

        $("customError")
          .classList.remove("hidden");

        return;
      }

      $("customError")
        .classList.add("hidden");

      code = custom;

    } else {

      code = Math.random()
        .toString(36)
        .substring(2, 8);
    }
  }

  await setDoc(doc(db, "links", code), {

    originalURL: url,
    userId: currentUser.uid,
    clicks: 0,
    createdAt: Date.now()
  });

  const shortURL =
    location.origin + "?c=" + code;

  $("shortLink").textContent = shortURL;

  $("resultSection")
    .classList.remove("hidden");

  /* QR */

  if (currentPlan === "PRO") {

    const qr =
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortURL)}`;

    $("qrImage").src = qr;

    $("qrSection")
      .classList.remove("hidden");
  }

  showToast("✅ Link creado");

  loadDashboard();
});

/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

  if (!currentUser) return;

  const q = query(
    collection(db, "links"),
    where("userId", "==", currentUser.uid)
  );

  onSnapshot(q, snap => {

    const links = [];

    let totalClicks = 0;

    snap.forEach(docu => {

      const data = docu.data();

      totalClicks += data.clicks || 0;

      links.push({
        id: docu.id,
        ...data
      });
    });

    renderLinks(links);

    $("totalLinks").textContent =
      links.length;

    $("totalClicks").textContent =
      totalClicks;
  });
}

/* =========================================================
   RENDER LINKS
========================================================= */

function renderLinks(links) {

  const list = $("linksList");

  if (!list) return;

  list.innerHTML = "";

  if (!links.length) {

    list.innerHTML =
      `<p class="muted">No hay enlaces todavía.</p>`;

    return;
  }

  links.forEach(link => {

    const div = document.createElement("div");

    div.className = "card";

    div.style.padding = "18px";
    div.style.marginBottom = "12px";

    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:15px;align-items:center;flex-wrap:wrap">

        <div>
          <div style="font-weight:600;color:#60a5fa;margin-bottom:6px">
            ${location.origin}?c=${link.id}
          </div>

          <div class="muted" style="font-size:13px">
            ${link.originalURL}
          </div>

          <div style="margin-top:8px;font-size:13px">
            👆 ${link.clicks || 0} clicks
          </div>
        </div>

        <button class="btn-ghost delete-btn">
          🗑 Eliminar
        </button>

      </div>
    `;

    div.querySelector(".delete-btn")
      .addEventListener("click", async () => {

        await deleteDoc(
          doc(db, "links", link.id)
        );

        showToast("🗑 Link eliminado");
      });

    list.appendChild(div);
  });
}

/* =========================================================
   NAVIGATION
========================================================= */

const navButtons =
  document.querySelectorAll(".nav-item");

const sections =
  document.querySelectorAll(".section");

navButtons.forEach(btn => {

  btn.addEventListener("click", () => {

    const section =
      btn.dataset.section;

    navButtons.forEach(b =>
      b.classList.remove("active")
    );

    btn.classList.add("active");

    sections.forEach(sec => {

      sec.classList.toggle(
        "hidden",
        sec.dataset.section !== section
      );
    });

    $("sectionTitle").textContent =
      btn.textContent.replace("PRO", "").trim();

    $("sidebar")
      ?.classList.remove("open");
  });
});

/* =========================================================
   SIDEBAR
========================================================= */

$("sidebarToggle")?.addEventListener("click", () => {
  $("sidebar")?.classList.toggle("open");
});

$("sidebarToggleMobile")?.addEventListener("click", () => {
  $("sidebar")?.classList.toggle("open");
});

/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}
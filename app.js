/* =========================================================
   WORLD CLOUD PRO
   FULL ENTERPRISE VERSION
   PASSWORD + EXPIRATION + REAL ANALYTICS + THEMES
========================================================= */
let currentRole = "OWNER";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  increment,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy
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

/* =========================================================
   HELPERS
========================================================= */

const $ = id => document.getElementById(id);

let currentUser = null;
let currentPlan = "FREE";

let allLinks = [];

let modalChart;
let dailyChart;
let deviceChart;
let countryChart;

let pendingRedirect = null;

let currentTheme = "#6366f1";

/* =========================================================
   INIT
========================================================= */

console.log("✅ WORLD CLOUD READY");

/* =========================================================
   REDIRECT + REAL ANALYTICS + PASSWORD + EXPIRATION
========================================================= */

async function handleRedirect() {

  const code =
    new URLSearchParams(location.search)
      .get("c");

  if (!code) return;

  $("redirectScreen")
    ?.classList.remove("hidden");

  const ref =
    doc(db, "links", code);

  const snap =
    await getDoc(ref);

  if (!snap.exists()) return;

  const linkData =
    snap.data();

  /* ================= EXPIRATION ================= */

  if (
    linkData.expiresAt &&
    Date.now() > linkData.expiresAt
  ) {

    $("redirectScreen")
      ?.classList.add("hidden");

    document.body.innerHTML = `

      <div style="
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#0a0f1e;
        color:white;
        font-family:Inter,sans-serif;
        padding:20px;
        text-align:center;
      ">

        <div>

          <h1 style="
            font-size:52px;
            margin-bottom:12px;
          ">
            ⏳
          </h1>

          <h2 style="
            font-size:28px;
            margin-bottom:10px;
          ">
            Link expirado
          </h2>

          <p style="
            color:#94a3b8;
          ">
            Este enlace ya no está disponible.
          </p>

        </div>

      </div>
    `;

    return;
  }

  /* ================= COUNTRY ================= */

  let country = "Unknown";
  let countryCode = "UN";

  try {

    const geo =
      await fetch("https://ipapi.co/json/")
      .then(r => r.json());

    country =
      geo.country_name || "Unknown";

    countryCode =
      geo.country_code || "UN";

  } catch {}

  /* ================= DEVICE ================= */

  const ua =
    navigator.userAgent;

  let device = "Desktop";

  if (/mobile/i.test(ua)) {
    device = "Mobile";
  }

  if (/tablet/i.test(ua)) {
    device = "Tablet";
  }

  /* ================= SAVE ANALYTICS ================= */

  const analyticsData = {
    timestamp: Date.now(),
    country,
    countryCode,
    device
  };

  await addDoc(
    collection(
      db,
      "links",
      code,
      "analytics"
    ),
    analyticsData
  );

  await addDoc(
    collection(db, "logs"),
    analyticsData
  );

  /* ================= CLICK ================= */

  updateDoc(ref, {
    clicks: increment(1)
  }).catch(() => {});

  /* ================= PASSWORD ================= */

  if (linkData.password) {

    pendingRedirect = {
      url: linkData.originalURL,
      password: linkData.password
    };

    $("passwordModal")
      ?.classList.remove("hidden");

    $("redirectScreen")
      ?.classList.add("hidden");

    return;
  }

  setTimeout(() => {

    location.href =
      linkData.originalURL;

  }, 250);
}

handleRedirect();

/* =========================================================
   PASSWORD UNLOCK
========================================================= */

$("unlockBtn")
  ?.addEventListener("click", () => {

    if (!pendingRedirect) return;

    const val =
      $("passwordInput")
        .value.trim();

    if (
      val !== pendingRedirect.password
    ) {

      $("passwordError")
        ?.classList.remove("hidden");

      return;
    }

    $("passwordError")
      ?.classList.add("hidden");

    location.href =
      pendingRedirect.url;
  });

$("passwordInput")
  ?.addEventListener("keydown", e => {

    if (e.key === "Enter") {

      $("unlockBtn").click();
    }
  });

/* =========================================================
   LOGIN
========================================================= */

$("loginBtn")
  ?.addEventListener("click", async () => {

    try {

      await signInWithPopup(
        auth,
        new GoogleAuthProvider()
      );

    } catch (err) {

      console.error(err);

      showToast("❌ Error login");
    }
  });

/* =========================================================
   LOGOUT
========================================================= */

$("logoutBtn")
  ?.addEventListener("click", async () => {

    await signOut(auth);

    showToast("👋 Sesión cerrada");
  });

/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(auth, async user => {

  if (!user) {

    currentUser = null;

    $("authBtns")
      ?.classList.remove("hidden");

    $("userInfo")
      ?.classList.add("hidden");

    return;
  }

  currentUser = user;

  $("authBtns")
    ?.classList.add("hidden");

  $("userInfo")
    ?.classList.remove("hidden");

  $("userName").textContent =
    user.displayName || "Usuario";

  $("userAvatar").src =
    user.photoURL ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  /* PLAN */

  const userRef =
    doc(db, "users", user.uid);

  const userSnap =
    await getDoc(userRef);

  if (!userSnap.exists()) {

/* =====================================================
   DEFAULT NO WORKSPACE
===================================================== */

let workspaceId = null;
role:"OWNER"
/* =====================================================
   USER
===================================================== */

await setDoc(userRef, {

  plan: "FREE",

  name:
    user.displayName || "Usuario",

  email:
    user.email || "",

  photo:
    user.photoURL || "",

  createdAt:
    Date.now(),

  lastLogin:
    Date.now(),

  banned:false,

  themeColor:"#6366f1",

  /* NEW */

  workspaceId,

  role:"OWNER"
});

    currentPlan = "FREE";
    currentRole =
  userSnap.data().role || "OWNER";
  } else {

    /* BANNED CHECK */

    if (userSnap.data().banned) {

      alert("Tu cuenta fue suspendida");

      await signOut(auth);

      return;
    }

    currentPlan =
      userSnap.data().plan || "FREE";

    /* UPDATE USER DATA */

    await updateDoc(userRef, {

      name:
        user.displayName || "Usuario",

      email:
        user.email || "",

      photo:
        user.photoURL || "",

      lastLogin:
        Date.now()
    });
  }

  updatePlanUI();

  loadEnterpriseTheme();
loadWorkspace();

  loadDashboard();
  checkInvites();
  /* =====================================================
   VIEWER RESTRICTIONS
===================================================== */

const isViewer =
  currentRole === "VIEWER";

/* BOTONES */

document
  .querySelectorAll(
    ".edit-btn,.delete-btn,.csv-btn"
  )
  .forEach(el => {

    el.style.display =
      isViewer
        ? "none"
        : "";
  });

/* CREATE */

if ($("shortBtn")) {

  $("shortBtn").disabled =
    isViewer;
}

/* INVITE */

if ($("inviteBtn")) {

  $("inviteBtn").style.display =
    isViewer
      ? "none"
      : "";
}

/* BRANDING */

document
  .querySelectorAll(
    ".enterprise-theme-card"
  )
  .forEach(el => {

    el.style.display =
      currentRole === "OWNER"
        ? ""
        : "none";
  });
});

/* =========================================================
   LOAD WORKSPACE
========================================================= */

async function loadWorkspace() {

  if (!currentUser) return;

  const userSnap =
    await getDoc(
      doc(db,"users",currentUser.uid)
    );

  if (!userSnap.exists()) return;

  const userData =
    userSnap.data();

  if (!userData.workspaceId) return;

  const workspaceSnap =
    await getDoc(
      doc(
        db,
        "workspaces",
        userData.workspaceId
      )
    );

  if (!workspaceSnap.exists()) return;

  const workspace =
    workspaceSnap.data();

  /* THEME */

  if (workspace.theme) {

    applyTheme(
      workspace.theme
    );
  }

  /* NAME */

  const logo =
    document.querySelector(".logo");

  if (logo) {

    logo.textContent =
      workspace.name || "World Cloud";
  }
}

/* =========================================================
   CHECK INVITES
========================================================= */

async function checkInvites() {

  if (!currentUser) return;

  const q =
    query(
      collection(db,"workspaceInvites"),
      where(
        "email",
        "==",
        currentUser.email
      ),
      where(
        "status",
        "==",
        "PENDING"
      )
    );

  const snap =
    await getDocs(q);

  if (snap.empty) return;

  const invite =
    snap.docs[0];

  const inviteData =
    invite.data();

  /* WORKSPACE */

  const workspaceSnap =
    await getDoc(
      doc(
        db,
        "workspaces",
        inviteData.workspaceId
      )
    );

  if (!workspaceSnap.exists()) return;

  const workspace =
    workspaceSnap.data();

  showInviteModal(
    invite.id,
    workspace.name,
    inviteData.role,
    inviteData.workspaceId
  );
}

/* =========================================================
   INVITE MEMBERS
========================================================= */

$("inviteBtn")
  ?.addEventListener("click", inviteMember);

/* =========================================================
   INVITE MEMBERS
========================================================= */

async function inviteMember() {

  if (
    currentPlan !== "ENTERPRISE"
  ) {

    showToast(
      "🏢 Solo ENTERPRISE"
    );

    return;
  }

  const email =
    $("inviteEmail")
      .value.trim();

  const role =
    $("inviteRole")
      .value;

  if (!email) return;

  /* CURRENT USER */

  const currentUserSnap =
    await getDoc(
      doc(db,"users",currentUser.uid)
    );

  const workspaceId =
    currentUserSnap.data()
      .workspaceId;

  /* CREATE INVITE */

  await addDoc(
    collection(db,"workspaceInvites"),
    {

      email,

      workspaceId,

      role,

      invitedBy:
        currentUser.uid,

      createdAt:
        Date.now(),

      status:"PENDING"
    }
  );

  showToast(
    "📨 Invitación enviada"
  );

  $("inviteEmail").value = "";
}

/* =========================================================
   THEME DARK/LIGHT
========================================================= */

$("themeToggle")
  ?.addEventListener("click", () => {

    document.body
      .classList.toggle("light");

    localStorage.setItem(
      "theme",
      document.body.classList.contains("light")
        ? "light"
        : "dark"
    );
  });

if (
  localStorage.getItem("theme")
  === "light"
) {
  document.body.classList.add("light");
}

/* =========================================================
   ENTERPRISE THEME
========================================================= */

async function loadEnterpriseTheme() {

  if (!currentUser) return;

  const userRef =
    doc(db, "users", currentUser.uid);

  const snap =
    await getDoc(userRef);

  if (!snap.exists()) return;

  const data =
    snap.data();

  currentTheme =
    data.themeColor || "#6366f1";

  applyTheme(currentTheme);

  /* COLOR PICKER */

  if ($("themeColorPicker")) {

    $("themeColorPicker").value =
      currentTheme;
  }
}

function applyTheme(color) {

  document.documentElement
    .style.setProperty(
      "--primary",
      color
    );

  const rgb =
    hexToRgb(color);

  document.documentElement
    .style.setProperty(
      "--primary-rgb",
      `${rgb.r}, ${rgb.g}, ${rgb.b}`
    );
}

function hexToRgb(hex) {

  hex =
    hex.replace("#", "");

  const bigint =
    parseInt(hex, 16);

  return {

    r: (bigint >> 16) & 255,

    g: (bigint >> 8) & 255,

    b: bigint & 255
  };
}

async function saveTheme(color) {

  if (!currentUser) return;

  await updateDoc(
    doc(db, "users", currentUser.uid),
    {
      themeColor: color
    }
  );

  currentTheme = color;

  applyTheme(color);

  showToast("🎨 Tema actualizado");
}

/* =========================================================
   THEME PRESETS
========================================================= */

document
  .querySelectorAll(".theme-preset")
  .forEach(btn => {

    btn.addEventListener("click", () => {

      if (
        currentPlan !== "PRO" &&
        currentPlan !== "ENTERPRISE"
      ) {

        showToast("💎 Solo PRO/ENTERPRISE");

        return;
      }

      saveTheme(btn.dataset.color);
    });
  });

/* =========================================================
   COLOR PICKER
========================================================= */

$("themeColorPicker")
  ?.addEventListener("input", e => {

    if (
      currentPlan !== "PRO" &&
      currentPlan !== "ENTERPRISE"
    ) {

      showToast("💎 Solo PRO/ENTERPRISE");

      return;
    }

    saveTheme(e.target.value);
  });

/* =========================================================
   PLAN UI
========================================================= */

function updatePlanUI() {

  const isPro =
    currentPlan === "PRO" ||
    currentPlan === "ENTERPRISE";

  const isEnterprise =
    currentPlan === "ENTERPRISE";

  $("planChip").textContent =
    currentPlan;

  $("userPlanBadge").textContent =
    currentPlan;

  $("userPlanBadge").className =
    currentPlan === "PRO"
      ? "badge pro"
      : currentPlan === "ENTERPRISE"
        ? "badge enterprise"
        : "badge free";

  /* PRO FEATURES */

  $("customSection")
    ?.classList.toggle(
      "hidden",
      !isPro
    );

  document
    .querySelectorAll(".pro-only")
    .forEach(el => {

      el.classList.toggle(
        "hidden",
        !isPro
      );
    });

  /* ENTERPRISE FEATURES */

  document
    .querySelectorAll(".enterprise-only")
    .forEach(el => {

      el.classList.toggle(
        "hidden",
        !isEnterprise
      );
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

  } else if (currentPlan === "PRO") {

    $("selectPro").textContent =
      "✅ Plan actual";

    $("selectFree").textContent =
      "Cambiar a FREE";

  } else {

    $("selectPro").textContent =
      "Cambiar a PRO";

    $("selectFree").textContent =
      "Cambiar a FREE";
  }
}

/* =========================================================
   CHANGE PLAN
========================================================= */

$("selectFree")
  ?.addEventListener("click", () => {
    changePlan("FREE");
  });

$("selectPro")
  ?.addEventListener("click", () => {
    changePlan("PRO");
  });

$("selectEnterprise")
  ?.addEventListener("click", () => {
    changePlan("ENTERPRISE");
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
/* =====================================================
   CREATE ENTERPRISE WORKSPACE
===================================================== */

if (
  plan === "ENTERPRISE"
) {

  const userSnap =
    await getDoc(
      doc(db,"users",currentUser.uid)
    );

  const userData =
    userSnap.data();

  /* ONLY IF DOESN'T EXIST */

  if (!userData.workspaceId) {

    const workspaceRef =
      doc(
        collection(db,"workspaces")
      );

    const workspaceId =
      workspaceRef.id;

    /* WORKSPACE */

    await setDoc(workspaceRef, {

      name:
        `${currentUser.displayName}'s Workspace`,

      owner:
        currentUser.uid,

      createdAt:
        Date.now(),

      theme:"#6366f1",

      logo:
        currentUser.photoURL || ""
    });

    /* USER */

    await updateDoc(
      doc(db,"users",currentUser.uid),
      {

        workspaceId,

        role:"OWNER"
      }
    );
  }
}
  currentPlan = plan;

  updatePlanUI();

  if (
    plan === "PRO" ||
    plan === "ENTERPRISE"
  ) {

    triggerProAnimation();

    launchConfetti();
  }

  showToast("✅ Plan cambiado");
}

/* =========================================================
   CONFETTI
========================================================= */

function launchConfetti() {

  for (let i = 0; i < 80; i++) {

    const confetti =
      document.createElement("div");

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

    document.body.appendChild(confetti);

    const duration =
      2000 + Math.random() * 2000;

    confetti.animate([

      {
        transform: "translateY(0)",
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

    setTimeout(() => {
      confetti.remove();
    }, duration);
  }
}

/* =========================================================
   PRO EFFECT
========================================================= */

function triggerProAnimation() {

  $("proCard")
    ?.classList.add("upgrade-flash");

  setTimeout(() => {

    $("proCard")
      ?.classList.add("pro-active-glow");

  }, 700);
}

/* =========================================================
   CUSTOM PREVIEW
========================================================= */

$("customCode")
  ?.addEventListener("input", () => {

    const val =
      $("customCode").value.trim();

    $("previewURL").textContent =
      val
        ? location.origin + "/" + val
        : "";
  });

/* =========================================================
   CREATE LINK
========================================================= */

$("shortBtn")
  ?.addEventListener("click", createLink);

async function createLink() {

  if (!currentUser) {

    showToast("🔐 Iniciá sesión");

    return;
  }

  const url =
    $("urlInput").value.trim();

  if (!url) {

    showToast("⚠ Poné una URL");

    return;
  }

  let code;

  const isPro =
    currentPlan === "PRO" ||
    currentPlan === "ENTERPRISE";

  /* FREE LIMIT */

  if (!isPro) {

    const q =
      query(
        collection(db, "links"),
        where(
          "userId",
          "==",
          currentUser.uid
        )
      );

    const existing =
      await getDocs(q);

    if (existing.size >= 1) {

      showToast(
        "❌ FREE solo permite 1 enlace"
      );

      return;
    }

    code =
      Math.random()
        .toString(36)
        .substring(2, 8);

  } else {

    const custom =
      $("customCode")
        .value.trim();

    if (custom) {

      const check =
        await getDoc(
          doc(db, "links", custom)
        );

      if (check.exists()) {

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

      code =
        Math.random()
          .toString(36)
          .substring(2, 8);
    }
  }

  /* PASSWORD */

  const password =
    isPro
      ? $("linkPassword")
          ?.value
          .trim() || ""
      : "";

  /* EXPIRATION */

  const expiresAt =
    isPro
      && $("linkExpiration")
        ?.value
      ? new Date(
          $("linkExpiration").value
        ).getTime()
      : null;

  /* SAVE */

  await setDoc(
    doc(db, "links", code),
    {
      originalURL: url,
      userId: currentUser.uid,
      clicks: 0,
      createdAt: Date.now(),
      password,
      expiresAt
    }
  );

  const shortURL =
    location.origin + "?c=" + code;

  $("shortLink").textContent =
    shortURL;

  $("resultSection")
    .classList.remove("hidden");

  /* QR */

  if (isPro) {

    const qr =
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortURL)}`;

    $("qrImage").src = qr;

    $("qrSection")
      .classList.remove("hidden");
  }

  showToast("✅ Link creado");

  $("urlInput").value = "";

  $("customCode").value = "";

  if ($("linkPassword")) {
    $("linkPassword").value = "";
  }

  if ($("linkExpiration")) {
    $("linkExpiration").value = "";
  }
}

/* =========================================================
   DASHBOARD REAL
========================================================= */

async function loadDashboard() {

  if (!currentUser) return;

  const q =
    query(
      collection(db, "links"),
      where(
        "userId",
        "==",
        currentUser.uid
      )
    );

  onSnapshot(q, async snap => {

    allLinks = [];

    let totalClicks = 0;

    const countries = {};
    const devices = {};
    const daily = {};

    snap.forEach(docu => {

      const data =
        docu.data();

      totalClicks +=
        data.clicks || 0;

      allLinks.push({
        id: docu.id,
        ...data
      });
    });

    const isPro =
      currentPlan === "PRO" ||
      currentPlan === "ENTERPRISE";

    /* REAL ANALYTICS */

    for (const link of allLinks) {

      const analyticsSnap =
        await getDocs(
          collection(
            db,
            "links",
            link.id,
            "analytics"
          )
        );

      analyticsSnap.forEach(docu => {

        const d =
          docu.data();

        countries[d.country] =
          (countries[d.country] || 0) + 1;

        devices[d.device] =
          (devices[d.device] || 0) + 1;

        const day =
          new Date(d.timestamp)
            .toLocaleDateString();

        daily[day] =
          (daily[day] || 0) + 1;
      });
    }

    /* TOP DEVICE */

    let topDevice = "—";

    let max = 0;

    for (const d in devices) {

      if (devices[d] > max) {

        max = devices[d];

        topDevice = d;
      }
    }

    $("totalLinks").textContent =
      allLinks.length;

    $("totalClicks").textContent =
      totalClicks;

    $("totalCountries").textContent =
      isPro
        ? Object.keys(countries).length
        : "—";

    $("topDevice").textContent =
      isPro
        ? topDevice
        : "—";

    renderLinks(allLinks);

    if (isPro) {

      renderDailyChart(daily);
      renderCountryChart(countries);
      renderDeviceChart(devices);
    }
  });
}

/* =========================================================
   RENDER LINKS
========================================================= */

function renderLinks(links) {

  const list =
    $("linksList");

  if (!list) return;

  list.innerHTML = "";

  if (!links.length) {

    list.innerHTML = `
      <p class="muted">
        No hay enlaces todavía.
      </p>
    `;

    return;
  }

  const isPro =
    currentPlan === "PRO" ||
    currentPlan === "ENTERPRISE";

  links.forEach(link => {

    const shortURL =
      location.origin + "?c=" + link.id;

    const isExpired =
      link.expiresAt &&
      Date.now() > link.expiresAt;

    const div =
      document.createElement("div");

    div.className = "card";

    div.style.cursor = "pointer";

    if (isExpired) {
      div.style.opacity = "0.5";
    }

    div.innerHTML = `

      <div style="
        display:flex;
        justify-content:space-between;
        gap:20px;
        flex-wrap:wrap;
      ">

        <div>

          <div style="
            font-weight:700;
            color:var(--primary);
            margin-bottom:8px;
          ">
            ${shortURL}
            ${isExpired ? `
              <span style="
                color:#f87171;
                font-size:12px;
                margin-left:8px;
              ">
                ⏳ Expirado
              </span>
            ` : ""}
          </div>

          <div class="muted"
            style="font-size:13px"
          >
            ${link.originalURL}
          </div>

          <div style="
            margin-top:10px;
            font-size:13px;
          ">
            👆 ${link.clicks || 0} clicks
          </div>

          ${link.password ? `
            <div class="password-lock"
              style="margin-top:10px"
            >
              🔒 Protegido
            </div>
          ` : ""}

          ${link.expiresAt ? `
            <div class="expiration-badge"
              style="margin-top:10px"
            >
              ⏳ Expira:
              ${new Date(link.expiresAt)
                .toLocaleDateString()}
            </div>
          ` : ""}

        </div>

        <div style="
          display:flex;
          gap:8px;
          flex-wrap:wrap;
        ">

          <button class="btn-ghost stats-btn">
            📊 Stats
          </button>

          <button class="btn-ghost copy-btn">
            📋 Copiar
          </button>

          <button class="btn-ghost csv-btn">
            📤 CSV
          </button>

          <button class="btn-ghost edit-btn">
            ✏ Editar
          </button>

          <button class="btn-ghost delete-btn">
            🗑
          </button>

        </div>

      </div>
    `;

    /* COPY */

    div.querySelector(".copy-btn")
      .addEventListener("click", e => {

        e.stopPropagation();

        navigator.clipboard
          .writeText(shortURL);

        showToast("📋 Copiado");
      });

    /* DELETE */

    div.querySelector(".delete-btn")
      .addEventListener("click", async e => {

        e.stopPropagation();

        await deleteDoc(
          doc(db, "links", link.id)
        );

        showToast("🗑 Link eliminado");
      });

    /* CSV */

    div.querySelector(".csv-btn")
      .addEventListener("click", e => {

        e.stopPropagation();

        if (!isPro) {

          showToast("💎 Solo PRO");

          return;
        }

        exportSingleCSV(link);
      });

    /* EDIT */

    div.querySelector(".edit-btn")
      .addEventListener("click", async e => {

        e.stopPropagation();

        if (!isPro) {

          showToast("💎 Editar es PRO");

          return;
        }

        const newURL =
          prompt(
            "Nueva URL:",
            link.originalURL
          );

        if (!newURL) return;

        await updateDoc(
          doc(db, "links", link.id),
          {
            originalURL: newURL
          }
        );

        showToast("✅ Link editado");
      });

    /* STATS */

    div.querySelector(".stats-btn")
      .addEventListener("click", e => {

        e.stopPropagation();

        openStats(link);
      });

    list.appendChild(div);
  });
}

/* =========================================================
   STATS MODAL
========================================================= */

async function openStats(link) {

  $("statsModal")
    .classList.remove("hidden");

  $("modalClicks").textContent =
    link.clicks || 0;

  const isPro =
    currentPlan === "PRO" ||
    currentPlan === "ENTERPRISE";

  /* FREE */

  if (!isPro) {

    $("modalCountry").textContent =
      "💎 PRO";

    $("modalDevice").textContent =
      "💎 PRO";

    renderModalChart({
      "Hoy": link.clicks || 0
    });

    return;
  }

  /* PRO */

  const analyticsSnap =
    await getDocs(
      query(
        collection(
          db,
          "links",
          link.id,
          "analytics"
        ),
        orderBy("timestamp", "asc")
      )
    );

  const countries = {};
  const devices = {};
  const daily = {};

  analyticsSnap.forEach(docu => {

    const d =
      docu.data();

    countries[d.country] =
      (countries[d.country] || 0) + 1;

    devices[d.device] =
      (devices[d.device] || 0) + 1;

    const day =
      new Date(d.timestamp)
        .toLocaleDateString();

    daily[day] =
      (daily[day] || 0) + 1;
  });

  const topCountry =
    Object.entries(countries)
      .sort((a, b) => b[1] - a[1])[0];

  $("modalCountry").textContent =
    topCountry
      ? topCountry[0]
      : "—";

  const topDevice =
    Object.entries(devices)
      .sort((a, b) => b[1] - a[1])[0];

  $("modalDevice").textContent =
    topDevice
      ? topDevice[0]
      : "—";

  renderModalChart(daily);
}

/* =========================================================
   CLOSE MODAL
========================================================= */

$("closeModal")
  ?.addEventListener("click", () => {

    $("statsModal")
      .classList.add("hidden");
  });

/* =========================================================
   MODAL CHART
========================================================= */

function renderModalChart(daily) {

  const ctx =
    $("modalChart");

  if (!ctx) return;

  modalChart?.destroy();

  modalChart =
    new Chart(ctx, {

      type: "line",

      data: {

        labels:
          Object.keys(daily),

        datasets: [{

          label: "Clicks",

          data:
            Object.values(daily),

          borderColor: "var(--primary)",

          backgroundColor:
            "rgba(var(--primary-rgb),.2)",

          fill: true,

          tension: .4
        }]
      }
    });
}

/* =========================================================
   GLOBAL CHARTS
========================================================= */

function renderDailyChart(daily) {

  const ctx =
    $("dailyChart");

  if (!ctx) return;

  dailyChart?.destroy();

  dailyChart =
    new Chart(ctx, {

      type: "line",

      data: {

        labels:
          Object.keys(daily),

        datasets: [{

          label: "Clicks",

          data:
            Object.values(daily),

          borderColor: "var(--primary)",

          backgroundColor:
            "rgba(var(--primary-rgb),.2)",

          fill: true,

          tension: .4
        }]
      }
    });
}

function renderCountryChart(countries) {

  const ctx =
    $("countryChart");

  if (!ctx) return;

  countryChart?.destroy();

  countryChart =
    new Chart(ctx, {

      type: "bar",

      data: {

        labels:
          Object.keys(countries),

        datasets: [{

          label: "Países",

          data:
            Object.values(countries),

          backgroundColor:
            "var(--primary)"
        }]
      }
    });
}

function renderDeviceChart(devices) {

  const ctx =
    $("deviceChart");

  if (!ctx) return;

  deviceChart?.destroy();

  deviceChart =
    new Chart(ctx, {

      type: "doughnut",

      data: {

        labels:
          Object.keys(devices),

        datasets: [{

          data:
            Object.values(devices),

          backgroundColor: [
            "var(--primary)",
            "#6366f1",
            "#8b5cf6"
          ]
        }]
      }
    });
}

/* =========================================================
   SAVE BRANDING
========================================================= */

$("saveBranding")
  ?.addEventListener("click", saveBranding);

async function saveBranding() {

  if (
    currentPlan !== "ENTERPRISE"
  ) {

    showToast(
      "🏢 Solo ENTERPRISE"
    );

    return;
  }

  const userSnap =
    await getDoc(
      doc(db,"users",currentUser.uid)
    );

  const workspaceId =
    userSnap.data().workspaceId;

  const name =
    $("workspaceName")
      ?.value
      .trim();

  const logo =
    $("workspaceLogo")
      ?.value
      .trim();

  const color =
    $("themeColorPicker")
      ?.value ||
      "#6366f1";

  await updateDoc(
    doc(db,"workspaces",workspaceId),
    {

      name:
        name || "Workspace",

      logo:
        logo || "",

      theme:
        color
    }
  );

  /* APPLY */

  applyTheme(color);

  /* UPDATE LOGO */

  const logoEl =
    document.querySelector(".logo");

  if (logoEl) {

    logoEl.innerHTML = `

      ${
        logo
          ? `
            <img
              src="${logo}"
              style="
                width:28px;
                height:28px;
                border-radius:8px;
                object-fit:cover;
                margin-right:10px;
                vertical-align:middle;
              "
            >
          `
          : "☁"
      }

      ${name || "World Cloud"}
    `;
  }

  showToast(
    "🎨 Branding actualizado"
  );
}

/* =========================================================
   EXPORT CSV
========================================================= */

$("exportCSV")
  ?.addEventListener("click", exportAllCSV);

async function exportAllCSV() {

  const isPro =
    currentPlan === "PRO" ||
    currentPlan === "ENTERPRISE";

  if (!isPro) {

    showToast("💎 Solo PRO");

    return;
  }

  let csv =
    "Codigo,URL,Clicks,Password,Expira\n";

  allLinks.forEach(link => {

    csv +=
      `${link.id},"${link.originalURL}",${link.clicks},${link.password ? "Sí" : "No"},${link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "Nunca"}\n`;
  });

  downloadCSV(csv, "worldcloud-links.csv");

  showToast("📤 CSV exportado");
}

function exportSingleCSV(link) {

  let csv =
    "Codigo,URL,Clicks,Password,Expira\n";

  csv +=
    `${link.id},"${link.originalURL}",${link.clicks},${link.password ? "Sí" : "No"},${link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "Nunca"}`;

  downloadCSV(
    csv,
    `${link.id}.csv`
  );

  showToast("📤 CSV descargado");
}

function downloadCSV(content, file) {

  const blob =
    new Blob([content], {
      type: "text/csv"
    });

  const a =
    document.createElement("a");

  a.href =
    URL.createObjectURL(blob);

  a.download = file;

  a.click();
}

/* =========================================================
   QR DOWNLOAD
========================================================= */

$("downloadQR")
  ?.addEventListener("click", () => {

    const img =
      $("qrImage");

    if (!img?.src) return;

    const a =
      document.createElement("a");

    a.href = img.src;

    a.download =
      "worldcloud-qr.png";

    a.click();

    showToast("⬇ QR descargado");
  });

/* =========================================================
   SEARCH
========================================================= */

$("searchLinks")
  ?.addEventListener("input", e => {

    const val =
      e.target.value.toLowerCase();

    const filtered =
      allLinks.filter(link =>
        link.originalURL
          .toLowerCase()
          .includes(val)
      );

    renderLinks(filtered);
  });

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
      btn.textContent
        .replace("PRO", "")
        .trim();

    $("sidebar")
      ?.classList.remove("open");
  });
});

/* =========================================================
   SIDEBAR
========================================================= */

$("sidebarToggle")
  ?.addEventListener("click", () => {

    $("sidebar")
      ?.classList.toggle("open");
  });

$("sidebarToggleMobile")
  ?.addEventListener("click", () => {

    $("sidebar")
      ?.classList.toggle("open");
  });

/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

  const toast =
    $("toast");

  if (!toast) return;

  toast.textContent =
    message;

  toast.classList.remove("hidden");

  setTimeout(() => {

    toast.classList.add("hidden");

  }, 3000);
}

/* =========================================================
   INVITE MODAL
========================================================= */

let currentInvite = null;

function showInviteModal(
  inviteId,
  workspace,
  role,
  workspaceId
){

  currentInvite = {
    inviteId,
    role,
    workspaceId
  };

  $("inviteWorkspace").textContent =
    workspace;

  $("inviteRoleText").textContent =
    role;

  $("inviteModal")
    ?.classList.remove("hidden");
}

$("acceptInvite")
  ?.addEventListener("click", async () => {

    if (!currentInvite) return;

    /* UPDATE USER */

    await updateDoc(
      doc(db,"users",currentUser.uid),
      {

        workspaceId:
          currentInvite.workspaceId,

        role:
          currentInvite.role
      }
    );

    /* UPDATE INVITE */

    await updateDoc(
      doc(
        db,
        "workspaceInvites",
        currentInvite.inviteId
      ),
      {
        status:"ACCEPTED"
      }
    );

    $("inviteModal")
      ?.classList.add("hidden");

    showToast(
      "✅ Te uniste al workspace"
    );

    location.reload();
});

$("rejectInvite")
  ?.addEventListener("click", async () => {

    if (!currentInvite) return;

    await updateDoc(
      doc(
        db,
        "workspaceInvites",
        currentInvite.inviteId
      ),
      {
        status:"REJECTED"
      }
    );

    $("inviteModal")
      ?.classList.add("hidden");

    showToast(
      "❌ Invitación rechazada"
    );
});

/* =========================================================
   LEAVE WORKSPACE
========================================================= */

$("leaveWorkspace")
  ?.addEventListener("click", async () => {

    const confirmLeave =
      confirm(
        "¿Abandonar workspace?"
      );

    if (!confirmLeave) return;

    /* NEW WORKSPACE */

    const workspaceRef =
      doc(
        collection(db,"workspaces")
      );

    const workspaceId =
      workspaceRef.id;

    await setDoc(workspaceRef, {

      name:
        `${currentUser.displayName}'s Workspace`,

      owner:
        currentUser.uid,

      createdAt:
        Date.now(),

      theme:"#6366f1",

      logo:
        currentUser.photoURL || ""
    });

    /* UPDATE USER */

    await updateDoc(
      doc(db,"users",currentUser.uid),
      {

        workspaceId,

        role:"OWNER"
      }
    );

    showToast(
      "🚪 Abandonaste el workspace"
    );

    location.reload();
});
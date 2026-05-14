/* =========================================================
   WORLD CLOUD PRO
   FULL ENTERPRISE VERSION
   FINAL STABLE VERSION
========================================================= */

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
   REDIRECT + ANALYTICS + PASSWORD + EXPIRATION
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

  /* =====================================================
     EXPIRATION
  ====================================================== */

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

  /* =====================================================
     GEO
  ====================================================== */

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

  /* =====================================================
     DEVICE
  ====================================================== */

  const ua =
    navigator.userAgent;

  let device = "Desktop";

  if (/mobile/i.test(ua)) {
    device = "Mobile";
  }

  if (/tablet/i.test(ua)) {
    device = "Tablet";
  }

  /* =====================================================
     ANALYTICS
  ====================================================== */

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

  /* =====================================================
     CLICK
  ====================================================== */

  updateDoc(ref, {
    clicks: increment(1)
  }).catch(() => {});

  /* =====================================================
     PASSWORD
  ====================================================== */

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
   PASSWORD
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
   AUTH
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

  /* =====================================================
     USER REF
  ====================================================== */

  const userRef =
    doc(db, "users", user.uid);

  const userSnap =
    await getDoc(userRef);

  /* =====================================================
     NEW USER
  ====================================================== */

  if (!userSnap.exists()) {

    const workspaceRef =
      doc(
        collection(db,"workspaces")
      );

    const workspaceId =
      workspaceRef.id;

    /* WORKSPACE */

    await setDoc(workspaceRef, {

      name:
        `${user.displayName}'s Workspace`,

      owner:
        user.uid,

      createdAt:
        Date.now(),

      theme:
        "#6366f1",

      logo:
        user.photoURL || ""
    });

    /* USER */

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

      workspaceId,

      role:"OWNER"
    });

    currentPlan = "FREE";

  } else {

    /* BANNED */

    if (userSnap.data().banned) {

      alert("Tu cuenta fue suspendida");

      await signOut(auth);

      return;
    }

    currentPlan =
      userSnap.data().plan || "FREE";

    /* UPDATE */

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
});

/* =========================================================
   WORKSPACE
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

  /* BRANDING */

  const logo =
    document.querySelector(".logo");

  if (logo) {

    logo.innerHTML = `

      ${
        workspace.logo
          ? `
            <img
              src="${workspace.logo}"
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

      ${workspace.name || "World Cloud"}
    `;
  }
}

/* =========================================================
   INVITE MEMBERS
========================================================= */

$("inviteBtn")
  ?.addEventListener("click", inviteMember);

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
    $("inviteEmail").value.trim();

  const role =
    $("inviteRole").value;

  if (!email) return;

  /* FIND USER */

  const q =
    query(
      collection(db,"users"),
      where("email","==",email)
    );

  const snap =
    await getDocs(q);

  if (snap.empty) {

    showToast(
      "❌ Usuario no encontrado"
    );

    return;
  }

  const member =
    snap.docs[0];

  /* CURRENT USER */

  const currentUserSnap =
    await getDoc(
      doc(db,"users",currentUser.uid)
    );

  const workspaceId =
    currentUserSnap.data()
      .workspaceId;

  /* UPDATE */

  await updateDoc(
    doc(db,"users",member.id),
    {
      workspaceId,
      role
    }
  );

  showToast(
    "✅ Miembro añadido"
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
    hex.replace("#","");

  const bigint =
    parseInt(hex,16);

  return {

    r:(bigint>>16)&255,

    g:(bigint>>8)&255,

    b:bigint&255
  };
}

async function saveTheme(color) {

  if (!currentUser) return;

  const userSnap =
    await getDoc(
      doc(db,"users",currentUser.uid)
    );

  const workspaceId =
    userSnap.data().workspaceId;

  await updateDoc(
    doc(db,"workspaces",workspaceId),
    {
      theme:color
    }
  );

  currentTheme = color;

  applyTheme(color);

  showToast(
    "🎨 Tema actualizado"
  );
}

/* =========================================================
   PRESETS
========================================================= */

document
  .querySelectorAll(".theme-preset")
  .forEach(btn => {

    btn.addEventListener("click", () => {

      if (
        currentPlan !== "ENTERPRISE"
      ) {

        showToast(
          "🏢 Solo ENTERPRISE"
        );

        return;
      }

      saveTheme(
        btn.dataset.color
      );
    });
  });

/* =========================================================
   COLOR PICKER
========================================================= */

$("themeColorPicker")
  ?.addEventListener("input", e => {

    if (
      currentPlan !== "ENTERPRISE"
    ) {

      showToast(
        "🏢 Solo ENTERPRISE"
      );

      return;
    }

    saveTheme(
      e.target.value
    );
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

  /* PRO */

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

  /* ENTERPRISE */

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

    $("selectEnterprise").textContent =
      "✅ ENTERPRISE";

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
    doc(db,"users",currentUser.uid),
    { plan }
  );

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
   DASHBOARD
========================================================= */

async function loadDashboard() {

  if (!currentUser) return;

  /* WORKSPACE */

  const userSnap =
    await getDoc(
      doc(db,"users",currentUser.uid)
    );

  const workspaceId =
    userSnap.data().workspaceId;

  /* LINKS */

  const q =
    query(
      collection(db, "links"),
      where(
        "workspaceId",
        "==",
        workspaceId
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
        id:docu.id,
        ...data
      });
    });

    const isPro =
      currentPlan === "PRO" ||
      currentPlan === "ENTERPRISE";

    /* ANALYTICS */

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

    /* DEVICE */

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
   REMAINING FUNCTIONS
   (mantiene TODO lo anterior)
========================================================= */

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
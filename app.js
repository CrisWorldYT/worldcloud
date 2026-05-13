/* =========================================================
   WORLD CLOUD PRO — REAL ANALYTICS
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

let dailyChart;
let countryChart;
let deviceChart;
let modalChart;

/* =========================================================
   REDIRECT + REAL ANALYTICS
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

  /* ================= GEO ================= */

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

  await addDoc(
    collection(db, "links", code, "analytics"),
    {
      timestamp: Date.now(),
      country,
      countryCode,
      device
    }
  );

  /* ================= INCREMENT ================= */

  await updateDoc(ref, {
    clicks: increment(1)
  });

  setTimeout(() => {

    location.href =
      linkData.originalURL;

  }, 300);
}

handleRedirect();

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

  /* ================= PLAN ================= */

  const userRef =
    doc(db, "users", user.uid);

  const userSnap =
    await getDoc(userRef);

  if (!userSnap.exists()) {

    await setDoc(userRef, {
      plan: "FREE"
    });

    currentPlan = "FREE";

  } else {

    currentPlan =
      userSnap.data().plan || "FREE";
  }

  updatePlanUI();

  loadDashboard();
});

/* =========================================================
   THEME
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
   PLAN UI
========================================================= */

function updatePlanUI() {

  const isPro =
    currentPlan === "PRO";

  $("planChip").textContent =
    currentPlan;

  $("userPlanBadge").textContent =
    currentPlan;

  $("userPlanBadge").className =
    isPro
      ? "badge pro"
      : "badge free";

  $("customSection")
    ?.classList.toggle("hidden", !isPro);

  document
    .querySelectorAll(".pro-only")
    .forEach(el => {

      el.classList.toggle(
        "hidden",
        !isPro
      );
    });
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

async function changePlan(plan) {

  if (!currentUser) return;

  await updateDoc(
    doc(db, "users", currentUser.uid),
    { plan }
  );

  currentPlan = plan;

  updatePlanUI();

  showToast("✅ Plan actualizado");
}

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

    showToast("⚠ URL requerida");

    return;
  }

  let code;

  /* FREE LIMIT */

  if (currentPlan === "FREE") {

    const q =
      query(
        collection(db, "links"),
        where("userId","==",currentUser.uid)
      );

    const existing =
      await getDocs(q);

    if (existing.size >= 1) {

      showToast(
        "❌ FREE solo permite 1 enlace"
      );

      return;
    }
  }

  /* CUSTOM */

  const custom =
    $("customCode")
      ?.value
      .trim();

  if (
    currentPlan === "PRO" &&
    custom
  ) {

    const exists =
      await getDoc(
        doc(db,"links",custom)
      );

    if (exists.exists()) {

      $("customError")
        .classList.remove("hidden");

      $("customError").textContent =
        "Ese código ya existe";

      return;
    }

    code = custom;

  } else {

    code =
      Math.random()
        .toString(36)
        .substring(2,8);
  }

  await setDoc(
    doc(db,"links",code),
    {
      originalURL:url,
      userId:currentUser.uid,
      clicks:0,
      createdAt:Date.now()
    }
  );

  const shortURL =
    location.origin + "?c=" + code;

  $("shortLink").textContent =
    shortURL;

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

  $("urlInput").value = "";

  $("customCode").value = "";
}

/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

  if (!currentUser) return;

  const q =
    query(
      collection(db, "links"),
      where("userId","==",currentUser.uid)
    );

  onSnapshot(q, async snap => {

    allLinks = [];

    let totalClicks = 0;

    let countries = new Set();

    let devices = {};

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

    /* ================= ANALYTICS ================= */

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

      analyticsSnap.forEach(a => {

        const d = a.data();

        countries.add(d.country);

        devices[d.device] =
          (devices[d.device] || 0) + 1;
      });
    }

    /* ================= TOP DEVICE ================= */

    let topDevice = "—";

    let max = 0;

    for (const d in devices) {

      if (devices[d] > max) {

        max = devices[d];

        topDevice = d;
      }
    }

    /* ================= KPI ================= */

    $("totalLinks").textContent =
      allLinks.length;

    $("totalClicks").textContent =
      totalClicks;

    $("totalCountries").textContent =
      countries.size;

    $("topDevice").textContent =
      topDevice;

    renderLinks(allLinks);

    renderCharts();
  });
}

/* =========================================================
   RENDER LINKS
========================================================= */

function renderLinks(links) {

  const list =
    $("linksList");

  list.innerHTML = "";

  if (!links.length) {

    list.innerHTML = `
      <p class="muted">
        No hay enlaces todavía.
      </p>
    `;

    return;
  }

  links.forEach(link => {

    const shortURL =
      location.origin + "?c=" + link.id;

    const div =
      document.createElement("div");

    div.className = "card";

    div.innerHTML = `

      <div style="
        display:flex;
        justify-content:space-between;
        gap:20px;
        flex-wrap:wrap;
      ">

        <div>

          <div style="
            color:#60a5fa;
            font-weight:700;
            margin-bottom:8px;
          ">
            ${shortURL}
          </div>

          <div class="muted">
            ${link.originalURL}
          </div>

          <div style="
            margin-top:10px;
            font-size:13px;
          ">
            👆 ${link.clicks || 0} clicks
          </div>

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
          doc(db,"links",link.id)
        );

        showToast("🗑 Link eliminado");
      });

    /* STATS */

    div.querySelector(".stats-btn")
      .addEventListener("click", async e => {

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

  const analyticsSnap =
    await getDocs(
      query(
        collection(
          db,
          "links",
          link.id,
          "analytics"
        ),
        orderBy("timestamp","asc")
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

  /* ================= TOP COUNTRY ================= */

  const topCountry =
    Object.entries(countries)
      .sort((a,b)=>b[1]-a[1])[0];

  $("modalCountry").textContent =
    topCountry
      ? topCountry[0]
      : "—";

  /* ================= TOP DEVICE ================= */

  const topDevice =
    Object.entries(devices)
      .sort((a,b)=>b[1]-a[1])[0];

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

  modalChart?.destroy();

  modalChart =
    new Chart(
      $("modalChart"),
      {

        type:"line",

        data:{

          labels:
            Object.keys(daily),

          datasets:[{

            label:"Clicks",

            data:
              Object.values(daily),

            borderColor:"#3b82f6",

            backgroundColor:
              "rgba(59,130,246,.2)",

            fill:true,

            tension:.4
          }]
        }
      }
    );
}

/* =========================================================
   GLOBAL CHARTS
========================================================= */

async function renderCharts() {

  renderDailyChart();
  renderCountryChart();
  renderDeviceChart();
}

/* =========================================================
   DAILY
========================================================= */

function renderDailyChart() {

  dailyChart?.destroy();

  dailyChart =
    new Chart(
      $("dailyChart"),
      {

        type:"line",

        data:{

          labels:[
            "Lun","Mar","Mié",
            "Jue","Vie","Sáb","Dom"
          ],

          datasets:[{

            label:"Clicks",

            data:[
              4,8,6,12,15,7,10
            ],

            borderColor:"#3b82f6",

            backgroundColor:
              "rgba(59,130,246,.2)",

            fill:true,

            tension:.4
          }]
        }
      }
    );
}

/* =========================================================
   COUNTRY
========================================================= */

function renderCountryChart() {

  countryChart?.destroy();

  countryChart =
    new Chart(
      $("countryChart"),
      {

        type:"bar",

        data:{

          labels:[
            "AR","US","BR","MX","ES"
          ],

          datasets:[{

            label:"Clicks",

            data:[
              12,19,8,14,7
            ],

            backgroundColor:"#6366f1"
          }]
        }
      }
    );
}

/* =========================================================
   DEVICE
========================================================= */

function renderDeviceChart() {

  deviceChart?.destroy();

  deviceChart =
    new Chart(
      $("deviceChart"),
      {

        type:"doughnut",

        data:{

          labels:[
            "Mobile",
            "Desktop",
            "Tablet"
          ],

          datasets:[{

            data:[
              55,35,10
            ],

            backgroundColor:[
              "#3b82f6",
              "#6366f1",
              "#8b5cf6"
            ]
          }]
        }
      }
    );
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
      btn.textContent
        .replace("PRO","")
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
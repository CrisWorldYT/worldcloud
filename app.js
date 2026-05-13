/* =========================================================
   WORLD CLOUD PRO
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

/* =========================================================
   HELPERS
========================================================= */

const $ = id => document.getElementById(id);

let currentUser = null;
let currentPlan = "FREE";

let allLinks = [];

/* =========================================================
   INIT
========================================================= */

console.log("✅ WORLD CLOUD READY");

/* =========================================================
   REDIRECT
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

  updateDoc(ref, {
    clicks: increment(1)
  }).catch(() => {});

  setTimeout(() => {
    location.href =
      snap.data().originalURL;
  }, 250);
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

  } catch (err) {

    console.error(err);

    showToast("❌ Error login");
  }
});

/* =========================================================
   LOGOUT
========================================================= */

$("logoutBtn")?.addEventListener("click", async () => {

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

  /* USER */

  $("userName").textContent =
    user.displayName || "Usuario";

  $("userAvatar").src =
    user.photoURL ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  /* USER PLAN */

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

$("themeToggle")?.addEventListener("click", () => {

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
      Math.random()*innerWidth + "px";

    confetti.style.top = "-10px";

    confetti.style.borderRadius = "50%";

    confetti.style.zIndex = "99999";

    document.body.appendChild(confetti);

    const duration =
      2000 + Math.random()*2000;

    confetti.animate([

      {
        transform:"translateY(0)",
        opacity:1
      },

      {
        transform:
          `translateY(${innerHeight+100}px)
           rotate(${Math.random()*720}deg)`,

        opacity:0
      }

    ], {
      duration,
      easing:"cubic-bezier(.2,.8,.2,1)"
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

  /* FREE LIMIT */

  if (currentPlan === "FREE") {

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
        .substring(2,8);

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
          .substring(2,8);
    }
  }

  await setDoc(
    doc(db, "links", code),
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
      where(
        "userId",
        "==",
        currentUser.uid
      )
    );

  onSnapshot(q, snap => {

    allLinks = [];

    let totalClicks = 0;

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

    $("totalLinks").textContent =
      allLinks.length;

    $("totalClicks").textContent =
      totalClicks;

    $("totalCountries").textContent =
      currentPlan === "PRO"
        ? Math.floor(Math.random()*18)+1
        : "0";

    $("topDevice").textContent =
      currentPlan === "PRO"
        ? ["Mobile","Desktop","Tablet"][
            Math.floor(Math.random()*3)
          ]
        : "—";

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

  links.forEach(link => {

    const shortURL =
      location.origin + "?c=" + link.id;

    const div =
      document.createElement("div");

    div.className = "card";

    div.style.cursor = "pointer";

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
            color:#60a5fa;
            margin-bottom:8px;
          ">
            ${shortURL}
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

          <button class="btn-ghost csv-btn pro-only-btn">
            📤 CSV
          </button>

          <button class="btn-ghost edit-btn pro-only-btn">
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
          doc(db,"links",link.id)
        );

        showToast("🗑 Link eliminado");
      });

    /* CSV */

    div.querySelector(".csv-btn")
      ?.addEventListener("click", e => {

        e.stopPropagation();

        if (currentPlan !== "PRO") {

          showToast("💎 Solo PRO");

          return;
        }

        exportSingleCSV(link);
      });

    /* EDIT */

    div.querySelector(".edit-btn")
      ?.addEventListener("click", async e => {

        e.stopPropagation();

        if (currentPlan !== "PRO") {

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
          doc(db,"links",link.id),
          {
            originalURL:newURL
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
   STATS MODAL
========================================================= */

function openStats(link) {

  $("statsModal")
    .classList.remove("hidden");

  $("modalClicks").textContent =
    link.clicks || 0;

  $("modalCountry").textContent =
    ["AR","US","BR","MX"][
      Math.floor(Math.random()*4)
    ];

  $("modalDevice").textContent =
    ["Mobile","Desktop","Tablet"][
      Math.floor(Math.random()*3)
    ];

  renderModalChart();
}

$("closeModal")
  ?.addEventListener("click", () => {

    $("statsModal")
      .classList.add("hidden");
  });

/* =========================================================
   MODAL CHART
========================================================= */

let modalChart;

function renderModalChart() {

  const ctx =
    $("modalChart");

  if (!ctx) return;

  modalChart?.destroy();

  modalChart =
    new Chart(ctx, {

      type:"line",

      data:{

        labels:[
          "Lun","Mar","Mié",
          "Jue","Vie","Sáb","Dom"
        ],

        datasets:[{

          label:"Clicks",

          data:[
            4,7,5,12,9,14,10
          ],

          borderColor:"#3b82f6",

          backgroundColor:
            "rgba(59,130,246,.2)",

          fill:true,

          tension:.4
        }]
      }
    });
}

/* =========================================================
   EXPORT CSV
========================================================= */

$("exportCSV")
  ?.addEventListener("click", exportAllCSV);

async function exportAllCSV() {

  if (currentPlan !== "PRO") {

    showToast("💎 Solo PRO");

    return;
  }

  let csv =
    "Codigo,URL,Clicks\n";

  allLinks.forEach(link => {

    csv +=
      `${link.id},"${link.originalURL}",${link.clicks}\n`;
  });

  downloadCSV(csv, "worldcloud-links.csv");

  showToast("📤 CSV exportado");
}

function exportSingleCSV(link) {

  let csv =
    "Codigo,URL,Clicks\n";

  csv +=
    `${link.id},"${link.originalURL}",${link.clicks}`;

  downloadCSV(
    csv,
    `${link.id}.csv`
  );

  showToast("📤 CSV descargado");
}

function downloadCSV(content, file) {

  const blob =
    new Blob([content], {
      type:"text/csv"
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
   CHARTS
========================================================= */

let dailyChart;
let deviceChart;
let countryChart;

function renderCharts() {

  renderDailyChart();
  renderDeviceChart();
  renderCountryChart();
}

/* DAILY */

function renderDailyChart() {

  const ctx =
    $("dailyChart");

  if (!ctx) return;

  dailyChart?.destroy();

  dailyChart =
    new Chart(ctx, {

      type:"line",

      data:{

        labels:[
          "Lun","Mar","Mié",
          "Jue","Vie","Sáb","Dom"
        ],

        datasets:[{

          label:"Clicks",

          data:[
            4,7,5,12,9,14,10
          ],

          borderColor:"#3b82f6",

          backgroundColor:
            "rgba(59,130,246,.2)",

          fill:true,

          tension:.4
        }]
      }
    });
}

/* DEVICE */

function renderDeviceChart() {

  const ctx =
    $("deviceChart");

  if (!ctx) return;

  deviceChart?.destroy();

  deviceChart =
    new Chart(ctx, {

      type:"doughnut",

      data:{

        labels:[
          "Mobile",
          "Desktop",
          "Tablet"
        ],

        datasets:[{

          data:[55,35,10],

          backgroundColor:[
            "#3b82f6",
            "#6366f1",
            "#8b5cf6"
          ]
        }]
      }
    });
}

/* COUNTRY */

function renderCountryChart() {

  const ctx =
    $("countryChart");

  if (!ctx) return;

  countryChart?.destroy();

  countryChart =
    new Chart(ctx, {

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
/* =========================================================
   admin.js
   WORLD CLOUD ADMIN PANEL
   FULL VERSION
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
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

/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(auth, async user => {

  if (!user) {

    location.href = "/";

    return;
  }

  /* =====================================================
     ADMIN CHECK
  ====================================================== */

  const ADMIN_EMAIL =
    "TUEMAIL@gmail.com";

  if (
    user.email !== ADMIN_EMAIL
  ) {

    alert("No autorizado");

    location.href = "/";

    return;
  }

  /* =====================================================
     USER
  ====================================================== */

  $("adminName").textContent =
    user.displayName || "Admin";

  $("adminAvatar").src =
    user.photoURL ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  loadAdmin();
});

/* =========================================================
   LOGOUT
========================================================= */

$("logoutBtn")
  ?.addEventListener("click", async () => {

    await signOut(auth);

    location.href = "/";
  });

/* =========================================================
   LOAD ADMIN
========================================================= */

async function loadAdmin() {

  /* =====================================================
     GET USERS
  ====================================================== */

  const usersSnap =
    await getDocs(
      collection(db, "users")
    );

  /* =====================================================
     GET LINKS
  ====================================================== */

  const linksSnap =
    await getDocs(
      collection(db, "links")
    );

  let totalClicks = 0;
  let totalPro = 0;

  /* =====================================================
     USERS COUNT
  ====================================================== */

  $("totalUsers").textContent =
    usersSnap.size;

  usersSnap.forEach(docu => {

    const data =
      docu.data();

    if (data.plan === "PRO") {
      totalPro++;
    }
  });

  $("totalPro").textContent =
    totalPro;

  /* =====================================================
     LINKS COUNT
  ====================================================== */

  $("totalLinks").textContent =
    linksSnap.size;

  /* =====================================================
     LISTS
  ====================================================== */

  const usersList =
    $("usersList");

  const linksList =
    $("linksList");

  usersList.innerHTML = "";
  linksList.innerHTML = "";

  /* =====================================================
     LINKS
  ====================================================== */

  const topLinks = [];

  linksSnap.forEach(docu => {

    const data =
      docu.data();

    totalClicks +=
      data.clicks || 0;

    topLinks.push({
      id:docu.id,
      ...data
    });

    linksList.innerHTML += `

      <div class="admin-item">

        <div>

          <strong>
            ${docu.id}
          </strong>

          <span>
            ${data.originalURL}
          </span>

          <div style="
            margin-top:8px;
            color:#60a5fa;
            font-size:13px;
          ">
            👆 ${data.clicks || 0} clicks
          </div>

          <div style="
            display:flex;
            gap:8px;
            margin-top:10px;
            flex-wrap:wrap;
          ">

            ${
              data.password
                ? `
                  <div class="admin-badge">
                    🔒 Protegido
                  </div>
                `
                : ""
            }

            ${
              data.expiresAt
                ? `
                  <div class="admin-badge">
                    ⏳ Expira
                  </div>
                `
                : ""
            }

          </div>

        </div>

        <div style="
          display:flex;
          gap:10px;
          align-items:center;
        ">

          <button
            class="delete-link-btn"
            data-id="${docu.id}"
          >
            🗑
          </button>

        </div>

      </div>
    `;
  });

  /* =====================================================
     USERS
  ====================================================== */

  usersSnap.forEach(docu => {

    const data =
      docu.data();

    usersList.innerHTML += `

      <div class="admin-item">

        <div>

          <strong>
            ${docu.id}
          </strong>

          <span>
            ${
              data.plan || "FREE"
            }
          </span>

        </div>

        <div>

          ${
            data.plan === "PRO"
              ? `
                <div class="admin-badge">
                  💎 PRO
                </div>
              `
              : `
                <div class="admin-badge">
                  FREE
                </div>
              `
          }

        </div>

      </div>
    `;
  });

  /* =====================================================
     TOTAL CLICKS
  ====================================================== */

  $("totalClicks").textContent =
    totalClicks;

  /* =====================================================
     DELETE BUTTONS
  ====================================================== */

  document
    .querySelectorAll(".delete-link-btn")
    .forEach(btn => {

      btn.addEventListener("click", async () => {

        const id =
          btn.dataset.id;

        const confirmDelete =
          confirm(
            "¿Eliminar link?"
          );

        if (!confirmDelete) return;

        await deleteDoc(
          doc(db, "links", id)
        );

        btn.closest(".admin-item")
          ?.remove();
      });
    });

  /* =====================================================
     TOP LINKS
  ====================================================== */

  topLinks.sort(
    (a,b)=>
      (b.clicks || 0)
      - (a.clicks || 0)
  );

  renderChart(topLinks);
}

/* =========================================================
   CHART
========================================================= */

function renderChart(links) {

  const ctx =
    document.getElementById(
      "globalChart"
    );

  if (!ctx) return;

  new Chart(ctx, {

    type:"bar",

    data:{

      labels:
        links
          .slice(0,7)
          .map(l => l.id),

      datasets:[{

        label:"Clicks",

        data:
          links
            .slice(0,7)
            .map(l => l.clicks || 0),

        backgroundColor:[
          "#3b82f6",
          "#6366f1",
          "#8b5cf6",
          "#60a5fa",
          "#818cf8",
          "#a78bfa",
          "#2563eb"
        ],

        borderRadius:12
      }]
    },

    options:{

      responsive:true,

      plugins:{

        legend:{
          display:false
        }
      },

      scales:{

        y:{
          beginAtZero:true,
          grid:{
            color:"rgba(255,255,255,.05)"
          }
        },

        x:{
          grid:{
            display:false
          }
        }
      }
    }
  });
}
/* =========================================================
   admin.js
   WORLD CLOUD ADMIN PANEL
   ENTERPRISE VERSION
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  limit,
  orderBy,
  onSnapshot
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
    "personadeg321@gmail.com";

  if (
    user.email !== ADMIN_EMAIL
  ) {

    alert("¡Correo Electrónico no Autorizado!");

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
     USERS
  ====================================================== */

  const usersSnap =
    await getDocs(
      collection(db,"users")
    );

  /* =====================================================
     WORKSPACES
  ====================================================== */

  const workspacesSnap =
    await getDocs(
      collection(db,"workspaces")
    );

  /* =====================================================
     LINKS
  ====================================================== */

  const linksSnap =
    await getDocs(
      collection(db,"links")
    );

  /* =====================================================
     INVITES
  ====================================================== */

  const invitesSnap =
    await getDocs(
      collection(db,"workspaceInvites")
    );

  /* =====================================================
     TOTALS
  ====================================================== */

  let totalClicks = 0;
  let totalEnterprise = 0;

  $("totalUsers").textContent =
    usersSnap.size;

  $("totalWorkspaces").textContent =
    workspacesSnap.size;

  $("totalLinks").textContent =
    linksSnap.size;

  invitesSnap.forEach(docu => {

    const data =
      docu.data();

    if (
      data.status === "PENDING"
    ) {
      totalEnterprise++;
    }
  });

  $("totalInvites").textContent =
    invitesSnap.size;

  /* =====================================================
     LISTS
  ====================================================== */

  const usersList =
    $("usersList");

  const linksList =
    $("linksList");

  const workspacesList =
    $("workspacesList");

  const invitesList =
    $("invitesList");

  usersList.innerHTML = "";
  linksList.innerHTML = "";
  workspacesList.innerHTML = "";
  invitesList.innerHTML = "";

  /* =====================================================
     WORKSPACES
  ====================================================== */

  workspacesSnap.forEach(async workspaceDoc => {

    const workspace =
      workspaceDoc.data();

    /* MEMBERS */

    const membersQuery =
      query(
        collection(db,"users"),
        where(
          "workspaceId",
          "==",
          workspaceDoc.id
        )
      );

    const membersSnap =
      await getDocs(membersQuery);

    let memberCount =
      membersSnap.size;

    let totalWorkspaceClicks = 0;

    /* LINKS */

    const workspaceLinksQuery =
      query(
        collection(db,"links"),
        where(
          "workspaceId",
          "==",
          workspaceDoc.id
        )
      );

    const workspaceLinksSnap =
      await getDocs(workspaceLinksQuery);

    workspaceLinksSnap.forEach(link => {

      totalWorkspaceClicks +=
        link.data().clicks || 0;
    });

    workspacesList.innerHTML += `

      <div class="admin-item">

        <div style="
          display:flex;
          align-items:center;
          gap:14px;
        ">

          ${
            workspace.logo
              ? `
                <img
                  src="${workspace.logo}"
                  style="
                    width:56px;
                    height:56px;
                    border-radius:16px;
                    object-fit:cover;
                    border:2px solid #6366f1;
                  "
                >
              `
              : `
                <div style="
                  width:56px;
                  height:56px;
                  border-radius:16px;
                  background:#1e293b;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:22px;
                ">
                  ☁
                </div>
              `
          }

          <div>

            <strong>
              ${workspace.name}
            </strong>

            <span>
              👥 ${memberCount} miembros
            </span>

            <div style="
              margin-top:8px;
              font-size:12px;
              color:#94a3b8;
            ">

              👆 ${totalWorkspaceClicks} clicks

            </div>

          </div>

        </div>

        <div class="admin-actions">

          <div class="admin-badge">
            ENTERPRISE
          </div>

          <button
            class="delete-workspace-btn"
            data-id="${workspaceDoc.id}"
          >
            🗑 Workspace
          </button>

        </div>

      </div>
    `;
  });

  /* =====================================================
     USERS
  ====================================================== */

  usersSnap.forEach(async userDoc => {

    const data =
      userDoc.data();

    /* LINKS */

    const linksQuery =
      query(
        collection(db,"links"),
        where(
          "userId",
          "==",
          userDoc.id
        )
      );

    const linksSnap =
      await getDocs(linksQuery);

    let userClicks = 0;

    linksSnap.forEach(link => {

      userClicks +=
        link.data().clicks || 0;
    });

    /* DATES */

    const createdAt =
      data.createdAt
        ? new Date(data.createdAt)
            .toLocaleDateString()
        : "—";

    const lastLogin =
      data.lastLogin
        ? new Date(data.lastLogin)
            .toLocaleString()
        : "—";

    usersList.innerHTML += `

      <div class="admin-item">

        <div style="
          display:flex;
          align-items:center;
          gap:14px;
        ">

          <img
            src="${
              data.photo ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }"

            style="
              width:52px;
              height:52px;
              border-radius:50%;
              object-fit:cover;
              border:2px solid #6366f1;
            "
          >

          <div>

            <strong>
              ${data.name || "Usuario"}
            </strong>

            <span>
              ${data.email || "Sin email"}
            </span>

            <div style="
              margin-top:8px;
              font-size:12px;
              color:#94a3b8;
              display:flex;
              flex-direction:column;
              gap:4px;
            ">

              <span>
                📅 Registro:
                ${createdAt}
              </span>

              <span>
                🕒 Último login:
                ${lastLogin}
              </span>

              <span>
                🔗 Links:
                ${linksSnap.size}
              </span>

              <span>
                👆 Clicks:
                ${userClicks}
              </span>

            </div>

          </div>

        </div>

        <!-- ACTIONS -->

        <div class="admin-actions">

          <div class="admin-badge">
            ${data.role || "USER"}
          </div>

          <button
            class="plan-btn"
            data-id="${userDoc.id}"
            data-plan="${
              data.plan === "ENTERPRISE"
                ? "PRO"
                : "ENTERPRISE"
            }"
          >

            ${
              data.plan === "ENTERPRISE"
                ? "⬇ PRO"
                : "🏢 ENTERPRISE"
            }

          </button>

          <button
            class="ban-btn"
            data-id="${userDoc.id}"
            data-ban="${
              data.banned
                ? "false"
                : "true"
            }"
          >

            ${
              data.banned
                ? "✅ Desbanear"
                : "🚫 Banear"
            }

          </button>

          <button
            class="delete-user-btn"
            data-id="${userDoc.id}"
          >
            🗑 Usuario
          </button>

        </div>

      </div>
    `;
  });

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

        </div>

        <div class="admin-actions">

          ${
            data.password
              ? `
                <div class="admin-badge">
                  🔒 Protegido
                </div>
              `
              : ""
          }

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
     INVITES
  ====================================================== */

  invitesSnap.forEach(docu => {

    const data =
      docu.data();

    invitesList.innerHTML += `

      <div class="admin-item">

        <div>

          <strong>
            ${data.email}
          </strong>

          <span>
            ${data.role}
          </span>

        </div>

        <div class="admin-badge">

          ${data.status}

        </div>

      </div>
    `;
  });

  /* =====================================================
     KPI
  ====================================================== */

  $("totalClicks").textContent =
    totalClicks;

  $("totalEnterprise").textContent =
    workspacesSnap.size;

  /* =====================================================
     BUTTONS
  ====================================================== */

  setTimeout(() => {

    /* DELETE USER */

    document
      .querySelectorAll(".delete-user-btn")
      .forEach(btn => {

        btn.addEventListener("click", async () => {

          const uid =
            btn.dataset.id;

          if (
            confirm(
              "¿Eliminar usuario?"
            )
          ) {

            await deleteDoc(
              doc(db,"users",uid)
            );

            location.reload();
          }
        });
      });

    /* DELETE LINK */

    document
      .querySelectorAll(".delete-link-btn")
      .forEach(btn => {

        btn.addEventListener("click", async () => {

          const id =
            btn.dataset.id;

          if (
            confirm(
              "¿Eliminar link?"
            )
          ) {

            await deleteDoc(
              doc(db,"links",id)
            );

            location.reload();
          }
        });
      });

    /* DELETE WORKSPACE */

    document
      .querySelectorAll(".delete-workspace-btn")
      .forEach(btn => {

        btn.addEventListener("click", async () => {

          const id =
            btn.dataset.id;

          if (
            confirm(
              "¿Eliminar workspace?"
            )
          ) {

            await deleteDoc(
              doc(db,"workspaces",id)
            );

            location.reload();
          }
        });
      });

    /* PLAN */

    document
      .querySelectorAll(".plan-btn")
      .forEach(btn => {

        btn.addEventListener("click", async () => {

          const uid =
            btn.dataset.id;

          const plan =
            btn.dataset.plan;

          await updateDoc(
            doc(db,"users",uid),
            { plan }
          );

          location.reload();
        });
      });

    /* BAN */

    document
      .querySelectorAll(".ban-btn")
      .forEach(btn => {

        btn.addEventListener("click", async () => {

          const uid =
            btn.dataset.id;

          const banned =
            btn.dataset.ban === "true";

          await updateDoc(
            doc(db,"users",uid),
            { banned }
          );

          location.reload();
        });
      });

  }, 500);

  /* =====================================================
     CHART
  ====================================================== */

  topLinks.sort(
    (a,b)=>
      (b.clicks || 0)
      - (a.clicks || 0)
  );

  renderChart(topLinks);

  /* =====================================================
     REALTIME
  ====================================================== */

  listenToRealtime();
}

/* =========================================================
   REALTIME
========================================================= */

function listenToRealtime() {

  const logsQuery =
    query(
      collection(db,"logs"),
      orderBy("timestamp","desc"),
      limit(200)
    );

  onSnapshot(logsQuery, snap => {

    const countries = {};

    let usersOnline = 0;

    const logsList =
      $("logsList");

    if (logsList) {
      logsList.innerHTML = "";
    }

    snap.forEach(docu => {

      const data =
        docu.data();

      /* COUNTRIES */

      countries[data.countryCode] =
        (countries[data.countryCode] || 0) + 1;

      /* ONLINE */

      if (
        Date.now() - data.timestamp <
        5 * 60 * 1000
      ) {
        usersOnline++;
      }

      /* LOGS */

      if (logsList) {

        logsList.innerHTML += `

          <div class="admin-item">

            <div>

              <strong>
                🌍 ${data.country || "Unknown"}
              </strong>

              <span>
                📱 ${data.device || "Desktop"}
              </span>

            </div>

            <div style="
              font-size:12px;
              color:#94a3b8;
            ">

              ${new Date(
                data.timestamp
              ).toLocaleString()}

            </div>

          </div>
        `;
      }
    });

    if ($("usersOnline")) {

      $("usersOnline").textContent =
        `${usersOnline} ONLINE`;
    }

    renderMap(countries);
  });
}

/* =========================================================
   MAP
========================================================= */

let mapChart;

async function renderMap(countries) {

  const canvas =
    $("worldMap");

  if (!canvas) return;

  if (typeof ChartGeo === "undefined") return;

  const map =
    await fetch(
      "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"
    ).then(r => r.json());

  const data =
    ChartGeo
      .topojson
      .feature(
        map,
        map.objects.countries
      ).features;

  const chartData =
    data.map(d => ({
      feature:d,
      value:
        countries[d.properties.iso_a2] || 0
    }));

  mapChart?.destroy();

  mapChart =
    new Chart(
      canvas,
      {

        type:"choropleth",

        data:{

          labels:
            data.map(
              d => d.properties.name
            ),

          datasets:[{

            label:"Clicks",

            data:chartData
          }]
        },

        options:{

          showOutline:true,

          showGraticule:false,

          plugins:{
            legend:{
              display:false
            }
          },

          scales:{
            xy:{
              projection:"equalEarth"
            }
          }
        }
      }
    );
}

/* =========================================================
   CHART
========================================================= */

let globalChart;

function renderChart(links) {

  const ctx =
    $("globalChart");

  if (!ctx) return;

  globalChart?.destroy();

  globalChart =
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
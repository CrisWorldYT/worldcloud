/* =========================================================
   admin.js
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs
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

  /* ================= ADMIN CHECK ================= */

  const ADMIN_EMAIL =
    "personadeg321@gmail.com";

  if (
    user.email !== ADMIN_EMAIL
  ) {

    alert("No autorizado");

    location.href = "/";

    return;
  }

  /* USER */

  $("adminName").textContent =
    user.displayName;

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

  /* USERS */

  const usersSnap =
    await getDocs(
      collection(db, "users")
    );

  /* LINKS */

  const linksSnap =
    await getDocs(
      collection(db, "links")
    );

  let totalClicks = 0;
  let totalPro = 0;

  /* USERS */

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

  /* LINKS */

  $("totalLinks").textContent =
    linksSnap.size;

  /* LISTS */

  const usersList =
    $("usersList");

  const linksList =
    $("linksList");

  usersList.innerHTML = "";
  linksList.innerHTML = "";

  linksSnap.forEach(docu => {

    const data =
      docu.data();

    totalClicks +=
      data.clicks || 0;

    /* LINKS */

    linksList.innerHTML += `

      <div class="admin-item">

        <div>

          <strong>
            ${docu.id}
          </strong>

          <span>
            ${data.originalURL}
          </span>

        </div>

        <div>

          👆 ${data.clicks || 0}

        </div>

      </div>
    `;
  });

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
            ${data.plan || "FREE"}
          </span>

        </div>

      </div>
    `;
  });

  $("totalClicks").textContent =
    totalClicks;

  renderChart(totalClicks);
}

/* =========================================================
   CHART
========================================================= */

function renderChart(clicks) {

  new Chart(
    document.getElementById("globalChart"),
    {

      type:"line",

      data:{

        labels:[
          "Lun",
          "Mar",
          "Mié",
          "Jue",
          "Vie",
          "Sáb",
          "Dom"
        ],

        datasets:[{

          label:"Actividad",

          data:[
            clicks*0.1,
            clicks*0.2,
            clicks*0.3,
            clicks*0.4,
            clicks*0.6,
            clicks*0.8,
            clicks
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
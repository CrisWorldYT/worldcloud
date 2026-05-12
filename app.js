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

/* CHARTS */
let chartDaily, chartCountry, chartDevice;

/* THEME */
(function initTheme(){
  const saved = localStorage.getItem("wc_theme") || "dark";
  if(saved === "light") document.body.classList.add("light");
  $("themeToggle").textContent = document.body.classList.contains("light") ? "🌙" : "☀️";
})();
$("themeToggle").addEventListener("click", ()=>{
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  localStorage.setItem("wc_theme", isLight ? "light" : "dark");
  $("themeToggle").textContent = isLight ? "🌙" : "☀️";
});

/* SIDEBAR */
function setSection(name){
  document.querySelectorAll(".section").forEach(s => s.classList.toggle("hidden", s.dataset.section !== name));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.section === name));
  const title = {crear:"Crear enlace", planes:"Planes", dashboard:"Dashboard", analytics:"Analytics"}[name];
  $("sectionTitle").textContent = title;
  if(name === "dashboard") refreshDashboard();
  if(name === "analytics") renderAnalytics();
  closeSidebar();
}
document.querySelectorAll(".nav-item").forEach(b => b.addEventListener("click", () => setSection(b.dataset.section)));
function openSidebar(){ $("sidebar").classList.add("open"); }
function closeSidebar(){ $("sidebar").classList.remove("open"); }
$("sidebarToggle").addEventListener("click", () => $("sidebar").classList.toggle("open"));
$("sidebarToggleMobile").addEventListener("click", openSidebar);

/* TOAST */
function toast(msg){
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(()=>t.classList.add("hidden"), 2200);
}

/* REDIRECT + CLICK TRACKING */
(async function handleRedirect(){
  const code = new URLSearchParams(location.search).get("c");
  if(!code) return;
  try{
    const ref = doc(db, "links", code);
    const snap = await getDoc(ref);
    if(!snap.exists()) return;

    // país
    let country = "Desconocido";
    try{
      const geo = await fetch("https://ipapi.co/json/").then(r=>r.json());
      country = geo.country_name || "Desconocido";
    }catch{}

    // dispositivo
    const ua = navigator.userAgent;
    let device = "PC";
    if(/Mobile|Android|iPhone/i.test(ua)) device = "Teléfono";
    else if(/iPad|Tablet/i.test(ua)) device = "Tablet";

    // fecha
    const dkey = new Date().toISOString().split("T")[0];

    // update
    await updateDoc(ref, {
      clicks: increment(1),
      [`clicksByDay.${dkey}`]: increment(1),
      [`countries.${country}`]: increment(1),
      [`devices.${device}`]: increment(1)
    });

    location.href = snap.data().originalURL;
  }catch(e){}
})();

/* AUTH */
$("loginBtn").addEventListener("click", ()=> signInWithPopup(auth, new GoogleAuthProvider()));
$("logoutBtn").addEventListener("click", ()=> signOut(auth));

onAuthStateChanged(auth, async user=>{
  if(user){
    $("authBtns").classList.add("hidden");
    $("userInfo").classList.remove("hidden");
    $("userName").textContent = user.displayName;

    // plan
    const uref = doc(db, "users", user.uid);
    const usnap = await getDoc(uref);
    let plan = "FREE";
    if(!usnap.exists()){
      await setDoc(uref, {plan:"FREE"});
      plan = "FREE";
    }else{
      plan = usnap.data().plan || "FREE";
    }

    setPlanUI(plan);
    refreshDashboard();
    setSection("crear");
  }else{
    $("authBtns").classList.remove("hidden");
    $("userInfo").classList.add("hidden");
    document.body.classList.remove("pro-active");
    setSection("crear");
  }
});

/* PLAN UI */
function setPlanUI(plan){
  const isPro = plan === "PRO";
  document.body.classList.toggle("pro-active", isPro);
  $("userPlanBadge").className = "badge " + (isPro ? "pro" : "free");
  $("userPlanBadge").textContent = plan;
  $("planChip").textContent = plan;

  // cards
  $("freeCard").classList.toggle("active", !isPro);
  $("proCard").classList.toggle("active", isPro);

  $("selectFree").classList.toggle("selected", !isPro);
  $("selectFree").textContent = !isPro ? "Plan actual" : "Seleccionar plan";

  $("selectPro").classList.toggle("selected", isPro);
  $("selectPro").textContent = isPro ? "Plan actual" : "Seleccionar Plan ($5)";

  // QR
  $("qrSection").classList.toggle("hidden", !isPro);
}

/* PLAN SELECT */
$("selectFree").addEventListener("click", ()=> updatePlan("FREE"));
$("selectPro").addEventListener("click", ()=> updatePlan("PRO"));

async function updatePlan(plan){
  const user = auth.currentUser;
  if(!user) return toast("Iniciá sesión primero");
  await setDoc(doc(db, "users", user.uid), {plan});
  setPlanUI(plan);
  toast(plan === "PRO" ? "✅ ¡Plan PRO activado correctamente!" : "✅ ¡Plan FREE activado correctamente!");
  refreshDashboard();
  if(plan === "PRO") setSection("analytics");
}

/* CREAR LINK */
$("shortBtn").addEventListener("click", async ()=>{
  const user = auth.currentUser;
  if(!user) return toast("Iniciá sesión primero");

  const url = $("urlInput").value.trim();
  if(!url) return toast("Ingresá una URL válida");

  // límite FREE
  const q = query(collection(db, "links"), where("userId", "==", user.uid));
  const snap = await getDocs(q);
  const isPro = document.body.classList.contains("pro-active");
  if(!isPro && snap.size >= 1){
    return toast("FREE solo permite 1 enlace");
  }

  // crear
  const code = Math.random().toString(36).substring(2,8);
  await setDoc(doc(db, "links", code), {
    originalURL: url,
    userId: user.uid,
    createdAt: Date.now(),
    clicks: 0,
    clicksByDay: {},
    countries: {},
    devices: {}
  });

  const shortURL = location.origin + "?c=" + code;
  $("shortLink").textContent = shortURL;
  $("resultSection").classList.remove("hidden");

  if(isPro){
    const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shortURL)}`;
    $("qrImage").src = qrURL;
    $("qrSection").classList.remove("hidden");
  }else{
    $("qrSection").classList.add("hidden");
  }

  toast("Enlace creado");
  refreshDashboard();
});

/* DESCARGAR QR */
$("downloadQR").addEventListener("click", ()=>{
  const src = $("qrImage").src;
  const a = document.createElement("a");
  a.href = src;
  a.download = "worldcloud-qr.png";
  a.click();
});

/* DASHBOARD */
async function refreshDashboard(){
  const user = auth.currentUser;
  if(!user) return;

  const q = query(collection(db, "links"), where("userId", "==", user.uid));
  const snap = await getDocs(q);

  // KPIs
  let totalClicks = 0;
  let totalCountries = new Set();
  let topDevice = {name:"—", v:0};

  snap.forEach(d=>{
    const data = d.data();
    totalClicks += data.clicks || 0;

    // countries
    const c = data.countries || {};
    Object.keys(c).forEach(k => totalCountries.add(k));

    // devices
    const dv = data.devices || {};
    Object.entries(dv).forEach(([k,v]) => { if(v > topDevice.v) topDevice = {name:k, v}; });
  });

  $("totalLinks").textContent = snap.size;
  $("totalClicks").textContent = totalClicks;
  $("totalCountries").textContent = totalCountries.size;
  $("topDevice").textContent = topDevice.name;

  // links list
  const list = $("linksList");
  list.innerHTML = "";
  snap.forEach(d=>{
    const data = d.data();
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <div class="meta">
        <div class="url">${location.origin}?c=${d.id}</div>
        <div class="sub">${data.originalURL} • ${new Date(data.createdAt).toLocaleDateString()} • ${data.clicks} clicks</div>
      </div>
      <button class="btn-ghost" data-del="${d.id}">🗑</button>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", async ()=>{
      const id = b.getAttribute("data-del");
      await (await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js")).deleteDoc(doc(db,"links",id));
      toast("Enlace eliminado");
      refreshDashboard();
      renderAnalytics();
    });
  });

  renderAnalytics();
}

/* ANALYTICS (PRO) */
async function renderAnalytics(){
  if(!document.body.classList.contains("pro-active")) return;

  const user = auth.currentUser;
  if(!user) return;

  const q = query(collection(db, "links"), where("userId", "==", user.uid));
  const snap = await getDocs(q);

  // daily
  const dailyMap = {};
  const countryMap = {};
  const deviceMap = {};

  snap.forEach(d=>{
    const data = d.data();

    // daily
    const byDay = data.clicksByDay || {};
    Object.entries(byDay).forEach(([k,v]) => dailyMap[k] = (dailyMap[k] || 0) + v);

    // countries
    const c = data.countries || {};
    Object.entries(c).forEach(([k,v]) => countryMap[k] = (countryMap[k] || 0) + v);

    // devices
    const dv = data.devices || {};
    Object.entries(dv).forEach(([k,v]) => deviceMap[k] = (deviceMap[k] || 0) + v);
  });

  // charts
  const dayLabels = Object.keys(dailyMap).sort();
  const dayValues = dayLabels.map(k => dailyMap[k]);

  if(chartDaily) chartDaily.destroy();
  chartDaily = new Chart($("dailyChart"), {
    type:"line",
    data:{ labels: dayLabels, datasets:[{ label:"Clicks", data: dayValues, borderColor:"#3b82f6", backgroundColor:"rgba(59,130,246,0.15)", fill:true, tension:0.35 }]},
    options:{ responsive:true, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:"#9ca3af"}}, y:{ticks:{color:"#9ca3af"}}} }
  });

  const cLabels = Object.keys(countryMap);
  const cValues = Object.values(countryMap);
  if(chartCountry) chartCountry.destroy();
  chartCountry = new Chart($("countryChart"), {
    type:"doughnut",
    data:{ labels: cLabels, datasets:[{ data: cValues, backgroundColor:["#3b82f6","#9333ea","#10b981","#f59e0b","#ef4444","#06b6d4"] }]},
    options:{ responsive:true, plugins:{legend:{position:"bottom", labels:{color:"#9ca3af"}}} }
  });

  const dLabels = Object.keys(deviceMap);
  const dValues = Object.values(deviceMap);
  if(chartDevice) chartDevice.destroy();
  chartDevice = new Chart($("deviceChart"), {
    type:"bar",
    data:{ labels: dLabels, datasets:[{ label:"Clicks", data: dValues, backgroundColor:"#3b82f6" }]},
    options:{ responsive:true, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:"#9ca3af"}}, y:{ticks:{color:"#9ca3af"}}} }
  });
}
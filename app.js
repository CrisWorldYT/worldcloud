import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc,
  getDocs, updateDoc, increment,
  deleteDoc, collection, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* FIREBASE */
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

/* ================= REDIRECT ================= */
async function handleRedirect(){
  const code = new URLSearchParams(location.search).get("c");
  if(!code) return;

  $("redirectScreen").classList.remove("hidden");

  const ref = doc(db,"links",code);
  const snap = await getDoc(ref);
  if(!snap.exists()) return;

  setTimeout(()=>location.href=snap.data().originalURL,150);
  updateDoc(ref,{clicks:increment(1)}).catch(()=>{});
}
handleRedirect();

/* ================= LOGIN ================= */
$("loginBtn")?.addEventListener("click",()=>signInWithPopup(auth,new GoogleAuthProvider()));
$("logoutBtn")?.addEventListener("click",()=>signOut(auth));

onAuthStateChanged(auth,async user=>{
  if(user){
    const ref=doc(db,"users",user.uid);
    const snap=await getDoc(ref);

    if(!snap.exists()){
      await setDoc(ref,{plan:"FREE"});
      currentPlan="FREE";
    }else{
      currentPlan=snap.data().plan;
    }

    updatePlanUI();
  }
});

/* ================= PLAN UI ================= */
function updatePlanUI(){
  const isPro = currentPlan==="PRO";
  $("customSection")?.classList.toggle("hidden",!isPro);
}

/* ================= PREVIEW ================= */
$("customCode")?.addEventListener("input",()=>{
  const val=$("customCode").value.trim();
  $("previewURL").textContent = val
      ? location.origin + "/" + val
      : "";
});

/* ================= CREAR LINK ================= */
$("shortBtn")?.addEventListener("click",async()=>{
  const user=auth.currentUser;
  if(!user) return alert("Iniciá sesión");

  const url=$("urlInput").value.trim();
  if(!url) return;

  let code;

  if(currentPlan==="PRO"){
    const custom=$("customCode").value.trim();

    if(custom){
      const check=await getDoc(doc(db,"links",custom));
      if(check.exists()){
        $("customError").textContent="Ese enlace ya existe.";
        $("customError").classList.remove("hidden");
        return;
      }
      $("customError").classList.add("hidden");
      code=custom;
    }else{
      code=Math.random().toString(36).substring(2,8);
    }
  }else{
    const q=query(collection(db,"links"),where("userId","==",user.uid));
    const snap=await getDocs(q);
    if(snap.size>=1){
      alert("FREE solo permite 1 enlace");
      return;
    }
    code=Math.random().toString(36).substring(2,8);
  }

  await setDoc(doc(db,"links",code),{
    originalURL:url,
    userId:user.uid,
    clicks:0
  });

  const shortURL=location.origin+"?c="+code;
  $("shortLink").textContent=shortURL;
  $("resultSection").classList.remove("hidden");

  if(currentPlan==="PRO"){
    const qr=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortURL)}`;
    $("qrImage").src=qr;
    $("qrSection").classList.remove("hidden");
    $("qrLocked")?.classList.add("hidden");
  }else{
    $("qrSection")?.classList.add("hidden");
    $("qrLocked")?.classList.remove("hidden");
  }
});
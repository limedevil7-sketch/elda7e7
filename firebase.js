import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { collection, deleteDoc, doc, getDoc, getFirestore, limit, onSnapshot, orderBy, query, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const firebaseConfig = {
  apiKey: "AIzaSyDxiXluts_nTjWK72mm_HQd9VvexOCgAxc",
  authDomain: "elda7e7-f497b.firebaseapp.com",
  projectId: "elda7e7-f497b",
  storageBucket: "elda7e7-f497b.firebasestorage.app",
  messagingSenderId: "605045232808",
  appId: "1:605045232808:web:b1ab6ff23e56b2e2279e9d",
  measurementId: "G-YN9ND001ZB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const supabase = createClient("https://tmwsxwbzvattmbvlygcj.supabase.co", "sb_publishable_YEqTS6Czs8_1C47U2VGCOw_SLHrcU3x");
const SUPABASE_BUCKET = "elday7e7";
const SUPABASE_ADMIN_EMAIL = "limedevil7@gmail.com";

window.sharedQuestions = [];
window.firebaseReady = false;
window.firebaseIsAdmin = false;
window.firebaseUid = "";
window.firebaseStorageReady = false;
window.supabaseReady = false;
window.supabaseIsAdmin = false;
window.firebaseConnectionHint = "";

const status = (message, state = "") => {
  const el = document.getElementById("firebaseStatus");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("connected", "disconnected");
  if (state) el.classList.add(state);
};

window.updateFirebaseAdminHint = () => {
  const el = document.getElementById("firebaseAdminHint");
  if (!el || !document.getElementById("adminPanel")?.classList.contains("show")) return;
  if (!window.firebaseUid) {
    el.textContent = window.firebaseConnectionHint || "بانتظار اتصال Firebase لتفعيل الردود المشتركة.";
    return;
  }
  if (window.firebaseIsAdmin) {
    el.innerHTML = window.supabaseIsAdmin
      ? "إدارة الموقع متصلة. ملفات PDF تُحفظ في Supabase، والأسئلة في Firebase."
      : "إدارة الردود متصلة. سجّل دخول مسؤول Supabase لرفع وحذف ملفات PDF.";
    return;
  }
  el.innerHTML = `لتفعيل الردود الآمنة: أنشئ في Firestore مستندًا باسم <code>admins/${window.firebaseUid}</code> واجعل الحقل <code>active: true</code>. <button type="button" onclick="copyFirebaseUid()">نسخ المعرّف</button>`;
};

window.copyFirebaseUid = async () => {
  try {
    await navigator.clipboard.writeText(window.firebaseUid);
    window.toast?.("تم نسخ معرّف Firebase");
  } catch {
    window.prompt("انسخ معرّف Firebase للإدارة:", window.firebaseUid);
  }
};

window.publishSharedQuestion = async ({ title, category, author }) => {
  if (!window.firebaseReady || !auth.currentUser) throw new Error("Firebase is not ready");
  await addDoc(collection(db, "questions"), {
    title: String(title).slice(0, 1000),
    category: String(category).slice(0, 100),
    author: String(author).slice(0, 80),
    authorUid: auth.currentUser.uid,
    time: Date.now(),
    answer: "",
    answerBy: "",
    answerAt: 0,
    admin: false
  });
};

window.replySharedQuestion = async (questionId, answer) => {
  if (!window.firebaseReady || !window.firebaseIsAdmin) throw new Error("Admin access is not enabled");
  await updateDoc(doc(db, "questions", questionId), {
    answer: String(answer).slice(0, 1000),
    answerBy: "lime_devil",
    answerAt: Date.now()
  });
};

window.deleteSharedQuestion = async (questionId) => {
  if (!window.firebaseReady || !window.firebaseIsAdmin) throw new Error("Admin access is not enabled");
  await deleteDoc(doc(db, "questions", questionId));
};

window.supabaseAdminSignIn = async (password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: SUPABASE_ADMIN_EMAIL,
    password
  });
  if (error) throw error;
  window.supabaseIsAdmin = data.user?.email?.toLowerCase() === SUPABASE_ADMIN_EMAIL;
  if (!window.supabaseIsAdmin) throw new Error("This account is not the configured site admin");
  window.renderAuth?.();
  window.updateFirebaseAdminHint?.();
};

window.supabaseLogout = async () => {
  await supabase.auth.signOut();
};

supabase.auth.onAuthStateChange((_event, session) => {
  window.supabaseIsAdmin = session?.user?.email?.toLowerCase() === SUPABASE_ADMIN_EMAIL;
  window.renderAuth?.();
});

async function loadSharedFiles() {
  const { data, error } = await supabase.from("materials").select("id,title,category,name,path,url,created").order("created", { ascending: false }).limit(500);
  if (error) throw error;
  window.sharedFiles = (data || []).map((item) => ({ ...item, source: "cloud" }));
  window.firebaseStorageReady = true;
  window.supabaseReady = true;
  window.renderFiles?.();
}

window.uploadSharedPdf = async ({ file, title, category }) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!window.supabaseIsAdmin || !session) throw new Error("Supabase admin login is not enabled");
  if (!(file instanceof Blob) || file.type !== "application/pdf") {
    throw new Error("Choose a PDF file");
  }
  if (file.size > 25 * 1024 * 1024) throw new Error("PDF exceeds 25 MB");

  const originalName = file.name || "material.pdf";
  const safeName = originalName.replace(/[^\p{L}\p{N}._-]+/gu, "_");
  const path = `${category}/${Date.now()}_${crypto.randomUUID()}_${safeName}`;
  const { error: uploadError } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, file, { contentType: "application/pdf", upsert: false });
  if (uploadError) throw uploadError;
  const { data: publicData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);

  try {
    const { data, error } = await supabase.from("materials").insert({
      title: String(title).slice(0, 120),
      category: String(category).slice(0, 100),
      name: String(originalName).slice(0, 180),
      path,
      url: publicData.publicUrl,
      created: new Date().toISOString()
    }).select("id").single();
    if (error) throw error;
    await loadSharedFiles();
    return data.id;
  } catch (error) {
    await supabase.storage.from(SUPABASE_BUCKET).remove([path]).catch(() => {});
    throw error;
  }
};

window.deleteSharedPdf = async (material) => {
  if (!window.supabaseIsAdmin) throw new Error("Admin access is not enabled");
  const { error: fileError } = await supabase.storage.from(SUPABASE_BUCKET).remove([material.path]);
  if (fileError) throw fileError;
  const { error } = await supabase.from("materials").delete().eq("id", material.id);
  if (error) throw error;
  await loadSharedFiles();
};

try {
  const existingUser = await new Promise((resolve) => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      unsubscribe();
      resolve(currentUser);
    });
  });
  const firebaseUser = existingUser || (await signInAnonymously(auth)).user;
  window.firebaseUid = firebaseUser.uid;

  try {
    const adminDoc = await getDoc(doc(db, "admins", window.firebaseUid));
    window.firebaseIsAdmin = adminDoc.exists() && adminDoc.data().active === true;
  } catch (error) {
    console.warn("Could not check Firebase admin role", error);
  }
  window.updateFirebaseAdminHint();

  const questionsQuery = query(collection(db, "questions"), orderBy("time", "desc"), limit(200));
  onSnapshot(questionsQuery, (snapshot) => {
    window.sharedQuestions = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), remote: true }));
    window.firebaseReady = true;
    status("الأسئلة متزامنة للجميع", "connected");
    window.renderQA?.();
    window.updateFirebaseAdminHint();
  }, (error) => {
    window.firebaseReady = false;
    window.firebaseConnectionHint = error?.code === "permission-denied"
      ? "Firestore رفض الوصول. انشر قواعد firestore.rules من Firebase Console."
      : "تعذر تحميل الأسئلة. راجع تفعيل Firestore وقواعده في Firebase.";
    status(window.firebaseConnectionHint, "disconnected");
    window.updateFirebaseAdminHint();
    console.error("Firestore question listener failed", error);
  });

  await supabase.auth.getSession();
  await loadSharedFiles();
  window.supabaseReady = true;
} catch (error) {
  window.firebaseReady = false;
  const message = error?.code === "auth/unauthorized-domain"
    ? "أضف limedevil7-sketch.github.io إلى Firebase Authentication > الإعدادات > النطاقات المصرح بها."
    : error?.code === "auth/operation-not-allowed"
      ? "فعّل مزود تسجيل الدخول المجهول (Anonymous) في Firebase Authentication."
      : error?.code === "permission-denied"
        ? "انشر قواعد Firestore الموجودة في firestore.rules من Firebase Console."
        : "تعذر الاتصال بـFirebase. تأكد من إنشاء Firestore وتفعيل Anonymous Authentication.";
  window.firebaseConnectionHint = message;
  status(message, "disconnected");
  window.updateFirebaseAdminHint();
  console.error("Firebase initialization failed", error);
}

if (!window.supabaseReady) {
  loadSharedFiles().then(() => { window.supabaseReady = true; window.renderAuth?.(); }).catch((error) => {
    window.firebaseStorageReady = false;
    console.warn("Supabase materials are not ready", error);
  });
}

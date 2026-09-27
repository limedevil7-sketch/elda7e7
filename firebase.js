import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { collection, deleteDoc, doc, getDoc, getFirestore, limit, onSnapshot, orderBy, query, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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

window.sharedQuestions = [];
window.firebaseReady = false;
window.firebaseIsAdmin = false;
window.firebaseUid = "";

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
    el.textContent = "بانتظار اتصال Firebase لتفعيل الردود المشتركة.";
    return;
  }
  if (window.firebaseIsAdmin) {
    el.textContent = "صلاحية الردود المشتركة مفعّلة لهذا الحساب.";
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
    status("تعذر تحميل الأسئلة المشتركة. راجع إعداد Firestore وقواعد الأمان.", "disconnected");
    console.error("Firestore question listener failed", error);
  });
} catch (error) {
  window.firebaseReady = false;
  status("تعذر الاتصال. فعّل تسجيل الدخول المجهول وFirestore في Firebase.", "disconnected");
  window.updateFirebaseAdminHint();
  console.error("Firebase initialization failed", error);
}

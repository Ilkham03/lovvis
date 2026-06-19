/* ============================================================
   КОНФИГ FIREBASE
   Это публичные данные клиентского приложения (не секрет) —
   безопасность обеспечивается правилами Firestore (Rules),
   а не сокрытием этого объекта.
   Взято из: Firebase Console → Project settings → Your apps → Web
============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAnKsUw89sTSqf-hHMDNuwleN-_I7AB1pU",
  authDomain: "lovvis-66756.firebaseapp.com",
  projectId: "lovvis-66756",
  storageBucket: "lovvis-66756.firebasestorage.app",
  messagingSenderId: "386784002910",
  appId: "1:386784002910:web:466ab9f91401f3ae7085cf",
  measurementId: "G-JEQLEHLTE0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ============================================================
   УПРАВЛЕНИЕ ЭКРАНАМИ
============================================================ */
function showScreen(id){
  document.querySelectorAll(".screen").forEach(s => {
    s.removeAttribute("data-active");
  });
  document.getElementById(id).setAttribute("data-active", "true");
}

/* ============================================================
   ID ПРИГЛАШЕНИЯ В URL
============================================================ */
function getOrCreateInviteId(){
  const params = new URLSearchParams(window.location.search);
  let id = params.get("id");
  if (!id){
    id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
    params.set("id", id);
    const newUrl = window.location.pathname + "?" + params.toString();
    window.history.replaceState({}, "", newUrl);
  }
  return id;
}

const inviteId = getOrCreateInviteId();
const inviteRef = doc(db, "invitations", inviteId);

/* ============================================================
   СТАРТ: проверяем, есть ли уже ответ по этой ссылке
============================================================ */
async function init(){
  try {
    const snap = await getDoc(inviteRef);
    if (snap.exists() && snap.data().status === "answered"){
      fillResult(snap.data());
      showScreen("screen-4");
      launchConfetti();
      return;
    }
    if (!snap.exists()){
      await setDoc(inviteRef, { status: "pending", createdAt: serverTimestamp() });
    }
  } catch(err){
    console.error("Firestore init error:", err);
  }
  showScreen("screen-1");
}

/* ============================================================
   ЭКРАН 1 → 2
============================================================ */
document.getElementById("btn-yes").addEventListener("click", () => {
  showScreen("screen-2");
});

document.getElementById("btn-next-2").addEventListener("click", () => {
  showScreen("screen-3");
});

/* ============================================================
   КНОПКА "НЕТ" — НИКОГДА НЕ НАЖИМАЕТСЯ
============================================================ */
const btnNo = document.getElementById("btn-no");
const btnRow1 = document.getElementById("btn-row-1");

function randomDodgePosition(){
  const margin = 70;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const btnW = btnNo.offsetWidth || 120;
  const btnH = btnNo.offsetHeight || 50;
  const left = margin + Math.random() * (w - btnW - margin * 2);
  const top = margin + Math.random() * (h - btnH - margin * 2);
  return { left, top };
}

function dodge(){
  const { left, top } = randomDodgePosition();
  btnNo.classList.add("dodging");
  btnNo.style.left = left + "px";
  btnNo.style.top = top + "px";
}

// Desktop: курсор приближается — кнопка убегает
document.addEventListener("mousemove", (e) => {
  const rect = btnNo.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
  if (dist < 110){
    dodge();
  }
});

// Mobile: тап никогда не регистрируется как нажатие
btnNo.addEventListener("touchstart", (e) => {
  e.preventDefault();
  dodge();
}, { passive: false });

// На всякий случай — клик тоже ничего не делает
btnNo.addEventListener("click", (e) => {
  e.preventDefault();
  dodge();
});

/* ============================================================
   ЭКРАН 3 — выбор места, даты, времени
============================================================ */
let selectedPlace = null;
const cards = document.querySelectorAll(".card");
const datetimeBlock = document.getElementById("datetime-block");
const inputDate = document.getElementById("input-date");
const inputTime = document.getElementById("input-time");
const btnSubmit = document.getElementById("btn-submit");

cards.forEach(card => {
  card.addEventListener("click", () => {
    cards.forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    selectedPlace = card.dataset.place;
    datetimeBlock.classList.add("open");
    validateForm();
  });
});

inputDate.addEventListener("input", validateForm);
inputTime.addEventListener("input", validateForm);

function validateForm(){
  btnSubmit.disabled = !(selectedPlace && inputDate.value && inputTime.value);
}

/* ============================================================
   ОТПРАВКА ОТВЕТА В FIRESTORE
============================================================ */
btnSubmit.addEventListener("click", async () => {
  btnSubmit.disabled = true;
  btnSubmit.textContent = "Отправляю…";

  const payload = {
    status: "answered",
    place: selectedPlace,
    date: inputDate.value,
    time: inputTime.value,
    answeredAt: serverTimestamp()
  };

  try {
    await setDoc(inviteRef, payload, { merge: true });
  } catch(err){
    console.error("Firestore submit error:", err);
  }

  fillResult(payload);
  showScreen("screen-4");
  launchConfetti();
});

function formatDate(dateStr){
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function formatTime(timeStr){
  return timeStr || "—";
}

function fillResult(data){
  document.getElementById("result-place").textContent = data.place || "—";
  document.getElementById("result-date").textContent = formatDate(data.date);
  document.getElementById("result-time").textContent = formatTime(data.time);
}

/* ============================================================
   ФОНОВАЯ АНИМАЦИЯ — плывущие сердечки
============================================================ */
const bgCanvas = document.getElementById("bg-canvas");
const bgCtx = bgCanvas.getContext("2d");
let bgParticles = [];

function resizeBgCanvas(){
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeBgCanvas);
resizeBgCanvas();

function createBgParticles(){
  const count = window.innerWidth < 600 ? 16 : 28;
  bgParticles = Array.from({ length: count }, () => ({
    x: Math.random() * bgCanvas.width,
    y: Math.random() * bgCanvas.height + bgCanvas.height,
    size: 6 + Math.random() * 10,
    speed: 0.2 + Math.random() * 0.5,
    drift: (Math.random() - 0.5) * 0.4,
    opacity: 0.08 + Math.random() * 0.18
  }));
}
createBgParticles();

function drawHeart(ctx, x, y, size, opacity){
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 20, size / 20);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(0, 2, -8, -6, -14, 0);
  ctx.bezierCurveTo(-20, 6, -14, 14, 0, 22);
  ctx.bezierCurveTo(14, 14, 20, 6, 14, 0);
  ctx.bezierCurveTo(8, -6, 0, 2, 0, 6);
  ctx.closePath();
  ctx.fillStyle = `rgba(232,194,122,${opacity})`;
  ctx.fill();
  ctx.restore();
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function animateBg(){
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgParticles.forEach(p => {
    p.y -= p.speed;
    p.x += p.drift;
    if (p.y < -20){
      p.y = bgCanvas.height + 20;
      p.x = Math.random() * bgCanvas.width;
    }
    drawHeart(bgCtx, p.x, p.y, p.size, p.opacity);
  });
  if (!reduceMotion) requestAnimationFrame(animateBg);
}
animateBg();

/* ============================================================
   КОНФЕТТИ НА ФИНАЛЬНОМ ЭКРАНЕ
============================================================ */
function launchConfetti(){
  if (reduceMotion) return;
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#e8c27a", "#f3d9a0", "#e0708a", "#f6ecd9"];
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.5,
    w: 5 + Math.random() * 5,
    h: 8 + Math.random() * 8,
    speed: 2 + Math.random() * 3,
    drift: (Math.random() - 0.5) * 2,
    rot: Math.random() * Math.PI,
    rotSpeed: (Math.random() - 0.5) * 0.2,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  let frame = 0;
  const maxFrames = 260;

  function tick(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speed;
      p.x += p.drift;
      p.rot += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < maxFrames){
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  tick();
}

/* ============================================================
   СТАРТ ПРИЛОЖЕНИЯ
============================================================ */
init();

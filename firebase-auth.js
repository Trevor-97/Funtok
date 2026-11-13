import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6DUPIHXVQoMNNPFIG3pViyQDwQHdNPQI",
  authDomain: "funtok-77831.firebaseapp.com",
  projectId: "funtok-77831",
  storageBucket: "funtok-77831.firebasestorage.app",
  messagingSenderId: "318736452384",
  appId: "1:318736452384:web:9caa4ddadf42ecb0d12545"
};

const CLOUD_NAME = "ecgad8fl";
const UPLOAD_PRESET = "funtok_media";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (s) => document.querySelector(s);
const feed = $("#feed");
const videoInput = $("#videoInput");
const uploadBtn = $("#uploadBtn");
const toast = $("#toast");

const accountModal = $("#accountModal");
const accountBtn = $("#accountBtn");
const authForm = $("#authForm");
const displayNameInput = $("#displayName");
const displayNameLabel = $("#displayNameLabel");
const authEmail = $("#authEmail");
const authPassword = $("#authPassword");
const authSubmit = $("#authSubmit");
const authSwitch = $("#authSwitch");
const authFeedback = $("#authFeedback");
const accountTitle = $("#accountTitle");
const accountMessage = $("#accountMessage");
const signedInPanel = $("#signedInPanel");

const captionModal = $("#captionModal");
const captionForm = $("#captionForm");
const captionInput = $("#captionInput");
const captionPreview = $("#captionPreview");
const captionCancel = $("#captionCancel");
const uploadProgress = $("#uploadProgress");
const uploadProgressBar = $("#uploadProgressBar");
const uploadStatus = $("#uploadStatus");

let authMode = "signup";
let selectedFile = null;
let observer = null;

function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function showModal(modal) {
  modal?.classList.add("open");
  modal?.setAttribute("aria-hidden", "false");
}

function hideModal(modal) {
  modal?.classList.remove("open");
  modal?.setAttribute("aria-hidden", "true");
}

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function usernameFrom(name, email) {
  const val = name || email?.split("@")[0] || "funtokuser";
  return val.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 30) || "funtokuser";
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignup = mode === "signup";
  if (accountTitle) accountTitle.textContent = isSignup ? "Create your FunTok account" : "Welcome back";
  if (accountMessage) accountMessage.textContent = isSignup ? "Join FunTok with your email address." : "Log in to continue to your FunTok account.";
  if (displayNameInput) displayNameInput.hidden = !isSignup;
  if (displayNameLabel) displayNameLabel.hidden = !isSignup;
  if (authSubmit) authSubmit.textContent = isSignup ? "Create account" : "Log in";
  if (authSwitch) authSwitch.textContent = isSignup ? "Already have an account? Log in" : "New to FunTok? Create an account";
  if (authFeedback) authFeedback.textContent = "";
}

function authErrorMessage(err) {
  const msgs = {
    "auth/email-already-in-use": "That email already has an account.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Choose a stronger password.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/network-request-failed": "Network problem. Check your connection.",
    "auth/too-many-requests": "Too many attempts. Please wait."
  };
  return msgs[err?.code] || "Something went wrong. Please try again.";
}

function bindCard(card) {
  if (!card || card.dataset.bound === "true") return;
  card.dataset.bound = "true";

  const video = card.querySelector("video");
  const like = card.querySelector(".like");
  const follow = card.querySelector(".follow");
  const comments = card.querySelector(".comments");
  const share = card.querySelector(".share");

  like?.addEventListener("click", () => {
    const liked = like.classList.toggle("liked");
    like.firstChild.textContent = liked ? "♥" : "♡";
  });

  follow?.addEventListener("click", () => {
    const following = follow.classList.toggle("following");
    follow.textContent = following ? "Following" : "Follow";
  });

  comments?.addEventListener("click", () => showModal($("#commentsModal")));

  share?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("FunTok link copied!");
    } catch {
      showToast("Share this page with a friend.");
    }
  });

  video?.addEventListener("click", () => video.paused ? video.play().catch(() => {}) : video.pause());
}

function startVideoObserver() {
  if (!feed || !("IntersectionObserver" in window)) return;
  observer?.disconnect();

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector("video");
      if (!video) return;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { root: feed, threshold: 0.6 });

  document.querySelectorAll(".video-card").forEach((card) => observer.observe(card));
}

function renderVideo(data, newest = false) {
  if (!feed || !data.videoUrl) return;

  const name = data.displayName || "FunTok Creator";
  const email = data.email || "";
  const caption = data.caption || "";
  const username = usernameFrom(name, email);
  const letter = name.trim().charAt(0).toUpperCase() || "F";

  const card = document.createElement("article");
  card.className = "video-card uploaded-card";

  card.innerHTML = `
    <div class="visual uploaded-visual">
      <video src="${escapeHtml(data.videoUrl)}" playsinline loop muted preload="metadata"></video>
    </div>
    <div class="video-shade"></div>
    <div class="video-info">
      <div class="creator">
        <span class="avatar">${escapeHtml(letter)}</span>
        <b>@${escapeHtml(username)}</b>
        <button class="follow" type="button">Follow</button>
      </div>
      <p>${escapeHtml(caption)}</p>
      <span class="sound">♫ original sound — ${escapeHtml(name)}</span>
    </div>
    <div class="actions">
      <button class="action like" type="button" aria-label="Like">♡<small>0</small></button>
      <button class="action comments" type="button" aria-label="Comments">▢<small>0</small></button>
      <button class="action share" type="button" aria-label="Share">➤<small>Share</small></button>
      <span class="record">♫</span>
    </div>
  `;

  if (newest && feed.firstChild) {
    feed.insertBefore(card, feed.firstChild);
  } else {
    feed.appendChild(card);
  }

  bindCard(card);
  observer?.observe(card);
}

async function loadVideos() {
  if (!feed) return;
  try {
    const snapshot = await getDocs(query(collection(db, "videos"), orderBy("createdAt", "desc")));
    snapshot.forEach((docSnap) => renderVideo({ id: docSnap.id, ...docSnap.data() }));
    startVideoObserver();
  } catch (err) {
    console.error("Could not load videos:", err);
    showToast("Could not load uploaded videos.");
  }
}

function resetCaptionModal() {
  selectedFile = null;
  captionForm?.reset();
  if (captionPreview) captionPreview.innerHTML = "";
  if (uploadProgress) uploadProgress.hidden = true;
  if (uploadProgressBar) uploadProgressBar.style.width = "0%";
  if (uploadStatus) uploadStatus.textContent = "";
}

function openCaptionModal(file) {
  selectedFile = file;
  if (captionPreview) {
    captionPreview.innerHTML = `<video src="${URL.createObjectURL(file)}" controls muted playsinline></video>`;
  }
  showModal(captionModal);
  captionInput?.focus();
}

async function uploadVideo(file, caption) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please log in before uploading.");

  const name = user.displayName || user.email?.split("@")[0] || "FunTok Creator";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  if (uploadProgress) uploadProgress.hidden = false;
  if (uploadStatus) uploadStatus.textContent = "Uploading video...";
  if (uploadProgressBar) uploadProgressBar.style.width = "35%";

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`

                          , {
    method: "POST",
    body: formData
  });

  const cloudData = await res.json();
  if (!res.ok || !cloudData.secure_url) {
    throw new Error(cloudData.error?.message || "Cloudinary upload failed.");
  }

  if (uploadStatus) uploadStatus.textContent = "Saving video post...";
  if (uploadProgressBar) uploadProgressBar.style.width = "75%";

  const videoData = {
    videoUrl: cloudData.secure_url,
    uid: user.uid,
    email: user.email || "",
    displayName: name,
    caption,
    createdAt: new Date().toISOString()
  };

  await addDoc(collection(db, "videos"), videoData);

  if (uploadProgressBar) uploadProgressBar.style.width = "100%";
  if (uploadStatus) uploadStatus.textContent = "Video posted.";

  renderVideo(videoData, true);
  showToast("Your video was posted.");

  setTimeout(() => {
    hideModal(captionModal);
    resetCaptionModal();
  }, 500);
}

authForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (authFeedback) authFeedback.textContent = "Working...";
  if (authSubmit) authSubmit.disabled = true;

  try {
    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (authMode === "signup") {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const name = displayNameInput.value.trim();

      if (name) await updateProfile(res.user, { displayName: name });

      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        email: res.user.email,
        username: name || email.split("@")[0],
        displayName: name || "FunTok User",
        bio: "Hello! I am new on FunTok.",
        createdAt: new Date().toISOString()
      });

      if (authFeedback) authFeedback.textContent = "Account created.";
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      if (authFeedback) authFeedback.textContent = "Logged in.";
    }
    authForm.reset();
  } catch (err) {
    console.error(err);
    if (authFeedback) authFeedback.textContent = authErrorMessage(err);
  } finally {
    if (authSubmit) authSubmit.disabled = false;
  }
});

authSwitch?.addEventListener("click", () => setAuthMode(authMode === "signup" ? "login" : "signup"));
accountBtn?.addEventListener("click", () => showModal(accountModal));
$('[data-nav="profile"]')?.addEventListener("click", () => showModal(accountModal));

uploadBtn?.addEventListener("click", () => {
  if (!auth.currentUser) {
    showModal(accountModal);
    showToast("Please log in before uploading.");
    return;
  }
  videoInput?.click();
});

videoInput?.addEventListener("change", () => {
  const file = videoInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("video/")) {
    showToast("Please select a video file.");
    videoInput.value = "";
    return;
  }
  openCaptionModal(file);
});

captionForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedFile) {
    showToast("Please select a video first.");
    return;
  }

  const caption = captionInput.value.trim() || "My new FunTok video! 🎬 #FunTok";
  const subBtn = captionForm.querySelector("[type='submit']");

  if (subBtn) {
    subBtn.disabled = true;
    subBtn.textContent = "Uploading...";
  }

  try {
    await uploadVideo(selectedFile, caption);
  } catch (err) {
    console.error("Upload error:", err);
    if (uploadStatus) uploadStatus.textContent = err.message;
    showToast(`Upload failed: ${err.message}`);
  } finally {
    if (subBtn) {
      subBtn.disabled = false;
      subBtn.textContent = "Post video";
    }
    if (videoInput) videoInput.value = "";
  }
});

captionCancel?.addEventListener("click", () => {
  hideModal(captionModal);
  resetCaptionModal();
  if (videoInput) videoInput.value = "";
});

document.querySelectorAll(".modal .close, .modal").forEach((el) => {
  el.addEventListener("click", (e) => {
    if (el.classList.contains("modal") && e.target !== el) return;
    const modal = el.closest(".modal") || el;
    if (modal === captionModal) {
      resetCaptionModal();
      if (videoInput) videoInput.value = "";
    }
    hideModal(modal);
  });
});

$("#commentForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#commentInput");
  const list = $("#commentList");
  const val = input?.value.trim();
  if (!val || !list) return;

  list.querySelector(".muted")?.remove();
  const p = document.createElement("p");
  p.textContent = `You: ${val}`;
  list.appendChild(p);
  input.value = "";
});

$("#searchBtn")?.addEventListener("click", () => showModal($("#searchModal")));
$("#searchInput")?.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const term = e.target.value.trim().toLowerCase();
  let count = 0;

  document.querySelectorAll(".video-card").forEach((card) => {
    const match = !term || card.innerText.toLowerCase().includes(term);
    card.style.display = match ? "" : "none";
    if (match) count++;
  });

  hideModal($("#searchModal"));
  showToast(`${count} matching video(s)`);
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    if (tab.dataset.feed === "following") {
      showToast("Following feed is coming soon.");
    } else {
      document.querySelectorAll(".video-card").forEach((c) => c.style.display = "");
    }
  });
});

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("selected"));
    btn.classList.add("selected");
    if (btn.dataset.nav !== "home") showToast(`${btn.dataset.nav} is coming soon.`);
  });
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (accountBtn) accountBtn.textContent = "Log in";
    if (authForm) authForm.hidden = false;
    if (authSwitch) authSwitch.hidden = false;
    if (signedInPanel) signedInPanel.hidden = true;
    setAuthMode("signup");
    return;
  }

  if (accountBtn) accountBtn.textContent = "My account";
  if (authForm) authForm.hidden = true;
  if (authSwitch) authSwitch.hidden = true;
  if (signedInPanel) signedInPanel.hidden = false;
  if (accountTitle) accountTitle.textContent = "Your FunTok Profile";
  if (accountMessage) accountMessage.textContent = "Manage your bio and account details.";

  let profile = { displayName: user.displayName || "", bio: "Hello! I am new on FunTok." };

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) profile = { ...profile, ...snap.data() };
  } catch (err) {
    console.warn("Could not load profile:", err);
  }

  signedInPanel.innerHTML = `
    <p class="signed-in-email"><b>Email:</b> ${escapeHtml(user.email || "")}</p>
    <label for="editDisplayName">Display name</label>
    <input id="editDisplayName" type="text" maxlength="40" value="${escapeHtml(profile.displayName)}">
    <label for="editBio">Bio</label>
    <textarea id="editBio" rows="3">${escapeHtml(profile.bio)}</textarea>
    <button id="saveProfileBtn" class="primary-btn" type="button">Save profile</button>
    <button id="logoutBtn" class="primary-btn logout-btn" type="button">Log out</button>
    <p id="profileFeedback" class="auth-feedback"></p>
  `;

  $("#saveProfileBtn")?.addEventListener("click", async () => {
    const newName = $("#editDisplayName")?.value.trim() || "FunTok User";
    const newBio = $("#editBio")?.value.trim() || "";
    const feedback = $("#profileFeedback");
    if (!feedback) return;

    feedback.textContent = "Saving...";
    try {
      await setDoc(doc(db, "users", user.uid), { displayName: newName, bio: newBio }, { merge: true });
      await updateProfile(user, { displayName: newName });
      feedback.textContent = "Profile saved.";
      showToast("Profile updated.");
    } catch (err) {
      console.error(err);
      feedback.textContent = "Could not save your profile.";
    }
  });

  $("#logoutBtn")?.addEventListener("click", async () => {
    await signOut(auth);
    hideModal(accountModal);
    showToast("You have been logged out.");
  });
});

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".video-card").forEach(bindCard);
  startVideoObserver();
  loadVideos();
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch((err) => console.warn("Service worker registration failed:", err));
}

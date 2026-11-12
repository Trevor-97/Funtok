import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6DUPIHXVQoMNNPFIG3pViyQDwQHdNPQI",
  authDomain: "funtok-77831.firebaseapp.com",
  projectId: "funtok-77831",
  storageBucket: "funtok-77831.firebasestorage.app",
  messagingSenderId: "318736452384",
  appId: "1:318736452384:web:9caa4ddadf42ecb0d12545"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const CLOUD_NAME = "ecgad8fi";
const UPLOAD_PRESET = "funtok_media";

const feed = document.querySelector("#feed");
const videoInput = document.querySelector("#videoInput");
const toast = document.querySelector("#toast");

const accountModal = document.querySelector("#accountModal");
const accountButton = document.querySelector("#accountBtn");
const authForm = document.querySelector("#authForm");
const displayNameInput = document.querySelector("#displayName");
const displayNameLabel = document.querySelector("#displayNameLabel");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const authSubmit = document.querySelector("#authSubmit");
const authSwitch = document.querySelector("#authSwitch");
const authFeedback = document.querySelector("#authFeedback");
const accountTitle = document.querySelector("#accountTitle");
const accountMessage = document.querySelector("#accountMessage");
const signedInPanel = document.querySelector("#signedInPanel");

let authMode = "signup";
let activeCard = null;

function notify(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function openAccount() {
  openModal(accountModal);
}

function setAuthMode(mode) {
  authMode = mode;

  const signingUp = mode === "signup";

  if (accountTitle) {
    accountTitle.textContent = signingUp
      ? "Create your FunTok account"
      : "Welcome back";
  }

  if (accountMessage) {
    accountMessage.textContent = signingUp
      ? "Join FunTok with your email address."
      : "Log in to continue to your FunTok account.";
  }

  if (displayNameInput) displayNameInput.hidden = !signingUp;
  if (displayNameLabel) displayNameLabel.hidden = !signingUp;

  if (authSubmit) {
    authSubmit.textContent = signingUp
      ? "Create account"
      : "Log in";
  }

  if (authSwitch) {
    authSwitch.textContent = signingUp
      ? "Already have an account? Log in"
      : "New to FunTok? Create an account";
  }

  if (authFeedback) authFeedback.textContent = "";
}

function readableAuthError(error) {
  const messages = {
    "auth/email-already-in-use": "That email already has an account.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Choose a stronger password.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/network-request-failed": "Network problem. Check your connection.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again."
  };

  return messages[error?.code] || "Something went wrong. Please try again.";
}

function bindVideoCard(card) {
  if (!card || card.dataset.bound === "true") return;

  card.dataset.bound = "true";

  const video = card.querySelector("video");
  const likeButton = card.querySelector(".like");
  const followButton = card.querySelector(".follow");
  const commentsButton = card.querySelector(".comments");
  const shareButton = card.querySelector(".share");

  likeButton?.addEventListener("click", () => {
    const liked = likeButton.classList.toggle("liked");
    const countElement = likeButton.querySelector("small");

    if (countElement) {
      const currentCount =
        parseInt(countElement.textContent.replace(/[^\d]/g, ""), 10) || 0;

      countElement.textContent = Math.max(
        0,
        currentCount + (liked ? 1 : -1)
      ).toLocaleString();
    }

    likeButton.firstChild.textContent = liked ? "♥" : "♡";
  });

  followButton?.addEventListener("click", () => {
    const following = followButton.classList.toggle("following");
    followButton.textContent = following ? "Following" : "Follow";
  });

  commentsButton?.addEventListener("click", () => {
    activeCard = card;
    openModal(document.querySelector("#commentsModal"));
  });

  shareButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify("FunTok link copied!");
    } catch {
      notify("Share this page with a friend!");
    }
  });

  video?.addEventListener("click", () => {
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}

function renderVideoCard(videoData) {
  if (!feed) return null;

  const {
    videoUrl,
    displayName = "FunTok Creator",
    caption = "",
    uid = ""
  } = videoData;

  const safeName = escapeHtml(displayName);
  const safeCaption = escapeHtml(caption);
  const avatarLetter = escapeHtml(displayName.charAt(0).toUpperCase() || "F");
  const username = displayName.toLowerCase().replace(/\s+/g, "");

  const card = document.createElement("article");

  card.className = "video-card uploaded-card";
  card.dataset.uid = uid;
  card.dataset.caption = caption.toLowerCase();
  card.dataset.creator = displayName.toLowerCase();

  card.innerHTML = `
    <div class="visual uploaded-visual">
      <video
        src="${escapeHtml(videoUrl)}"
        playsinline
        loop
        muted
        preload="metadata"
      ></video>
    </div>

    <div class="video-shade"></div>

    <div class="video-info">
      <div class="creator">
        <span class="avatar">${avatarLetter}</span>
        <b>@${escapeHtml(username)}</b>
        <button class="follow" type="button">Follow</button>
      </div>

      <p>${safeCaption}</p>
      <span class="sound">♫ original sound — ${safeName}</span>
    </div>

    <div class="actions">
      <button class="action like" type="button" aria-label="Like">
        ♡
        <small>0</small>
      </button>

      <button class="action comments" type="button" aria-label="Comments">
        ▢
        <small>0</small>
      </button>

      <button class="action share" type="button" aria-label="Share">
        ➤
        <small>Share</small>
      </button>

      <span class="record">♫</span>
    </div>
  `;

  feed.appendChild(card);
  bindVideoCard(card);

  return card;
}

function setupVideoObserver() {
  if (!feed || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target.querySelector("video");
        if (!video) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    {
      root: feed,
      threshold: [0.6]
    }
  );

  document.querySelectorAll(".video-card").forEach((card) => {
    observer.observe(card);
  });

  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.matches(".video-card")) observer.observe(node);
          node.querySelectorAll?.(".video-card").forEach((card) => {
            observer.observe(card);
          });
        }
      });
    });
  });

  mutationObserver.observe(feed, { childList: true, subtree: true });
}

async function loadVideosFromFirestore() {
  if (!feed) return;

  try {
    const videosQuery = query(
      collection(db, "videos"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(videosQuery);

    snapshot.forEach((videoDocument) => {
      renderVideoCard({
        id: videoDocument.id,
        ...videoDocument.data()
      });
    });

    setupVideoObserver();
  } catch (error) {
    console.error("Error loading videos:", error);
    notify("Could not load uploaded videos.");
  }
}

async function uploadVideo(file, caption) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    notify("Please log in before posting a video.");
    return;
  }

  const creatorName =
    currentUser.displayName ||
    currentUser.email?.split("@")[0] ||
    "FunTok Creator";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  notify("Uploading your video...");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await response.json();

  if (!response.ok || !data.secure_url) {
    console.error("Cloudinary response:", data);
    throw new Error(data.error?.message || "Cloudinary upload failed.");
  }

  const videoData = {
    videoUrl: data.secure_url,
    uid: currentUser.uid,
    displayName: creatorName,
    caption,
    createdAt: new Date().toISOString()
  };

  await addDoc(collection(db, "videos"), videoData);

  renderVideoCard(videoData);
  notify("Your video was posted!");
}

authForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (authFeedback) authFeedback.textContent = "Working...";
  if (authSubmit) authSubmit.disabled = true;

  try {
    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (authMode === "signup") {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const name = displayNameInput.value.trim();

      if (name) {
        await updateProfile(result.user, {
          displayName: name
        });
      }

      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        username: name || email.split("@")[0],
        displayName: name || "FunTok User",
        bio: "Hello! I am new on FunTok.",
        createdAt: new Date().toISOString()
      });

      if (authFeedback) authFeedback.textContent = "Account created!";
    } else {
      await signInWithEmailAndPassword(auth, email, password);

      if (authFeedback) authFeedback.textContent = "Logged in!";
    }

    authForm.reset();
  } catch (error) {
    console.error(error);

    if (authFeedback) {
      authFeedback.textContent = readableAuthError(error);
    }
  } finally {
    if (authSubmit) authSubmit.disabled = false;
  }
});

authSwitch?.addEventListener("click", () => {
  setAuthMode(authMode === "signup" ? "login" : "signup");
});

accountButton?.addEventListener("click", openAccount);

document
  .querySelector('[data-nav="profile"]')
  ?.addEventListener("click", openAccount);

document.querySelectorAll(".modal .close").forEach((button) => {
  button.addEventListener("click", () => {
    closeModal(button.closest(".modal"));
  });
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal);
  });
});

document.querySelector("#commentForm")?.addEventListener("submit", (event) => {
  event.preventDefault();

  const input = document.querySelector("#commentInput");
  const commentList = document.querySelector("#commentList");
  const value = input?.value.trim();

  if (!value || !commentList) return;

  const emptyMessage = commentList.querySelector(".muted");
  if (emptyMessage) emptyMessage.remove();

  const comment 

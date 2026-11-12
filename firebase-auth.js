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

const CLOUD_NAME = "ecgad8fi";
const UPLOAD_PRESET = "funtok_media";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const feed = document.querySelector("#feed");
const videoInput = document.querySelector("#videoInput");
const uploadButton = document.querySelector("#uploadBtn");
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

const captionModal = document.querySelector("#captionModal");
const captionForm = document.querySelector("#captionForm");
const captionInput = document.querySelector("#captionInput");
const captionPreview = document.querySelector("#captionPreview");
const captionCancel = document.querySelector("#captionCancel");
const uploadProgress = document.querySelector("#uploadProgress");
const uploadProgressBar = document.querySelector("#uploadProgressBar");
const uploadStatus = document.querySelector("#uploadStatus");

let authMode = "signup";
let selectedVideoFile = null;
let feedObserver = null;

function notify(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entities[character];
  });
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

function setAuthMode(mode) {
  authMode = mode;

  const isSignup = mode === "signup";

  if (accountTitle) {
    accountTitle.textContent = isSignup
      ? "Create your FunTok account"
      : "Welcome back";
  }

  if (accountMessage) {
    accountMessage.textContent = isSignup
      ? "Join FunTok with your email address."
      : "Log in to continue to your FunTok account.";
  }

  if (displayNameInput) displayNameInput.hidden = !isSignup;
  if (displayNameLabel) displayNameLabel.hidden = !isSignup;

  if (authSubmit) {
    authSubmit.textContent = isSignup
      ? "Create account"
      : "Log in";
  }

  if (authSwitch) {
    authSwitch.textContent = isSignup
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

function formatCount(value) {
  const count = Number(value) || 0;

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1).replace(".0", "")}M`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(".0", "")}K`;
  }

  return String(count);
}

function getUsername(displayName, email = "") {
  const source = displayName || email.split("@")[0] || "funtokuser";

  return (
    source.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 30) ||
    "funtokuser"
  );
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
    const isLiked = likeButton.classList.toggle("liked");
    const countElement = likeButton.querySelector("small");

    if (countElement) {
      const currentCount =
        parseInt(countElement.textContent.replace(/[^\d]/g, ""), 10) || 0;

      countElement.textContent = formatCount(
        Math.max(0, currentCount + (isLiked ? 1 : -1))
      );
    }

    likeButton.firstChild.textContent = isLiked ? "♥" : "♡";
  });

  followButton?.addEventListener("click", () => {
    const isFollowing = followButton.classList.toggle("following");
    followButton.textContent = isFollowing ? "Following" : "Follow";
  });

  commentsButton?.addEventListener("click", () => {
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

function observeCard(card) {
  if (feedObserver && card) {
    feedObserver.observe(card);
  }
}

function setupFeedObserver() {
  if (!feed || !("IntersectionObserver" in window)) return;

  feedObserver?.disconnect();

  feedObserver = new IntersectionObserver(
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

  document.querySelectorAll(".video-card").forEach(observeCard);
}

function renderVideoCard(videoData, addToTop = false) {
  if (!feed || !videoData?.videoUrl) return null;

  const {
    videoUrl,
    displayName = "FunTok Creator",
    email = "",
    caption = "",
    uid = "",
    likes = 0,
    comments = 0
  } = videoData;

  const card = document.createElement("article");
  const safeDisplayName = escapeHtml(displayName);
  const safeCaption = escapeHtml(caption);
  const safeVideoUrl = escapeHtml(videoUrl);
  const username = getUsername(displayName, email);
  const avatarLetter = escapeHtml(
    displayName.trim().charAt(0).toUpperCase() || "F"
  );

  card.className = "video-card uploaded-card";
  card.dataset.uid = uid;
  card.dataset.creator = displayName.toLowerCase();
  card.dataset.caption = caption.toLowerCase();

  card.innerHTML = `
    <div class="visual uploaded-visual">
      <video
        src="${safeVideoUrl}"
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
      <span class="sound">♫ original sound — ${safeDisplayName}</span>
    </div>

    <div class="actions">
      <button class="action like" type="button" aria-label="Like">
        ♡
        <small>${formatCount(likes)}</small>
      </button>

      <button class="action comments" type="button" aria-label="Comments">
        ▢
        <small>${formatCount(comments)}</small>
      </button>

      <button class="action share" type="button" aria-label="Share">
        ➤
        <small>Share</small>
      </button>

      <span class="record">♫</span>
    </div>
  `;

  if (addToTop && feed.firstChild) {
    feed.insertBefore(card, feed.firstChild);
  } else {
    feed.appendChild(card);
  }

  bindVideoCard(card);
  observeCard(card);

  return card;
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

    setupFeedObserver();
  } catch (error) {
    console.error("Error loading videos from Firestore:", error);
    notify("Could not load uploaded videos.");
 

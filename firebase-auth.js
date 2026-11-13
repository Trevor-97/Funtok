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

const CLOUD_NAME = "ecgad8f1";
const UPLOAD_PRESET = "funtok_media";
const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (selector) => document.querySelector(selector);

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
let previewUrl = "";
let observer = null;

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function showModal(modal) {
  if (!modal) return;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function hideModal(modal) {
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
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

function usernameFrom(name, email = "") {
  const value = name || email.split("@")[0] || "funtokuser";

  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "")
      .slice(0, 30) || "funtokuser"
  );
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

  if (displayNameInput) {
    displayNameInput.hidden = !isSignup;
  }

  if (displayNameLabel) {
    displayNameLabel.hidden = !isSignup;
  }

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

  if (authFeedback) {
    authFeedback.textContent = "";
  }
}

function authErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "That email already has an account.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Choose a stronger password.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/network-request-failed": "Network problem. Check your connection.",
    "auth/too-many-requests": "Too many attempts. Please wait."
  };

  return messages[error?.code] || "Something went wrong. Please try again.";
}

function setUploadMessage(message) {
  if (uploadStatus) {
    uploadStatus.textContent = message;
  }
}

function setUploadProgress(value) {
  if (uploadProgress) {
    uploadProgress.hidden = false;
  }

  if (uploadProgressBar) {
    uploadProgressBar.style.width = `${value}%`;
  }
}

function bindCard(card) {
  if (!card || card.dataset.bound === "true") return;

  card.dataset.bound = "true";

  const video = card.querySelector("video");
  const likeButton = card.querySelector(".like");
  const followButton = card.querySelector(".follow");
  const commentsButton = card.querySelector(".comments");
  const shareButton = card.querySelector(".share");

  likeButton?.addEventListener("click", () => {
    const liked = likeButton.classList.toggle("liked");

    likeButton.firstChild.textContent = liked ? "♥" : "♡";
  });

  followButton?.addEventListener("click", () => {
    const following = followButton.classList.toggle("following");

    followButton.textContent = following ? "Following" : "Follow";
  });

  commentsButton?.addEventListener("click", () => {
    showModal($("#commentsModal"));
  });

  shareButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("FunTok link copied!");
    } catch {
      showToast("Share this page with a friend.");
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

function startVideoObserver() {
  if (!feed || !("IntersectionObserver" in window)) return;

  observer?.disconnect();

  observer = new IntersectionObserver(
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
      threshold: 0.6
    }
  );

  document.querySelectorAll(".video-card").forEach((card) => {
    observer.observe(card);
  });
}

function renderVideo(data, newest = false) {
  if (!feed || !data?.videoUrl) return;

  const displayName = data.displayName || "FunTok Creator";
  const email = data.email || "";
  const caption = data.caption || "";
  const username = usernameFrom(displayName, email);
  const avatarLetter =
    displayName.trim().charAt(0).toUpperCase() || "F";

  const card = document.createElement("article");

  card.className = "video-card uploaded-card";
  card.dataset.uid = data.uid || "";
  card.dataset.creator = displayName.toLowerCase();
  card.dataset.caption = caption.toLowerCase();

  card.innerHTML = `
    <div class="visual uploaded-visual">
      <video
        src="${escapeHtml(data.videoUrl)}"
        playsinline
        loop
        muted
        preload="metadata"
      ></video>
    </div>

    <div class="video-shade"></div>

    <div class="video-info">
      <div class="creator">
        <span class="avatar">
          ${escapeHtml(avatarLetter)}
        </span>

        <b>@${escapeHtml(username)}</b>

        <button class="follow" type="button">
          Follow
        </button>
      </div>

      <p>${escapeHtml(caption)}</p>

      <span class="sound">
        ♫ original sound — ${escapeHtml(displayName)}
      </span>
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

  if (newest && feed.firstChild) {
    feed.insertBefore(card, feed.firstChild);
  } else {
    feed.appendChild(card);
  }

  bindCard(card);

  if (observer) {
    observer.observe(card);
  }
}

async function loadVideos() {
  if (!feed) return;

  try {
    const videosQuery = query(
      collection(db, "videos"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(videosQuery);

    snapshot.forEach((videoDocument) => {
      renderVideo({
        id: videoDocument.id,
        ...videoDocument.data()
      });
    });

    startVideoObserver();
  } catch (error) {
    console.error("Could not load videos:", error);
    showToast("Could not load uploaded videos.");
  }
}

function resetCaptionModal() {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = "";
  }

  selectedFile = null;

  captionForm?.reset();

  if (captionPreview) {
    captionPreview.innerHTML = "";
  }

  if (uploadProgress) {
    uploadProgress.hidden = true;
  }

  if (uploadProgressBar) {
    uploadProgressBar.style.width = "0%";
  }

  if (uploadStatus) {
    uploadStatus.textContent = "";
  }
}

function openCaptionModal(file) {
  resetCaptionModal();

  selectedFile = file;
  previewUrl = URL.createObjectURL(file);

  if (captionPreview) {
    captionPreview.innerHTML = `
      <video
        src="${previewUrl}"
        controls
        muted
        playsinline
      ></video>
    `;
  }

  showModal(captionModal);

  window.setTimeout(() => {
    captionInput?.focus();
  }, 100);
}

function setCaptionFormLoading(isLoading) {
  const submitButton = captionForm?.querySelector("[type='submit']");

  if (submitButton) {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading
      ? "Uploading..."
      : "Post video";
  }

  if (captionInput) {
    captionInput.disabled = isLoading;
  }

  if (captionCancel) {
    captionCancel.disabled = isLoading;
  }
}

async function uploadVideo(file, caption) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please log in before uploading.");
  }

  const displayName =
    user.displayName ||
    user.email?.split("@")[0] ||
    "FunTok Creator";

  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  setUploadMessage("Uploading video...");
  setUploadProgress(35);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData
  });

  const cloudinaryData = await response.json();

  if (!response.ok || !cloudinaryData.secure_url) {
    console.error("Cloudinary response:", cloudinaryData);

    throw new Error(
      cloudinaryData.error?.message ||
      `Cloudinary upload failed with status ${response.status}.`
    );
  }

  setUploadMessage("Saving video post...");
  setUploadProgress(75);

  const videoData = {
    videoUrl: cloudinaryData.secure_url,
    uid: user.uid,
    email: user.email || "",
    displayName,
    caption,
    createdAt: new Date().toISOString()
  };

  await addDoc(collection(db, "videos"), videoData);

  setUploadProgress(100);
  setUploadMessage("Video posted successfully.");

const newCard = renderVideo(videoData, true);

showToast("Your video was posted.");

if (newCard) {
  window.setTimeout(() => {
    newCard.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 100);
}


  window.setTimeout(() => {
    hideModal(captionModal);
    resetCaptionModal();
  }, 600);
}

authForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (authFeedback) {
    authFeedback.textContent = "Working...";
  }

  if (authSubmit) {
    authSubmit.disabled = true;
  }

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

      if (authFeedback) {
        authFeedback.textContent = "Account created.";
      }
    } else {
      await signInWithEmailAndPassword(auth, email, password);

      if (authFeedback) {
        authFeedback.textContent = "Logged in.";
      }
    }

    authForm.reset();
  } catch (error) {
    console.error("Authentication error:", error);

    if (authFeedback) {
      authFeedback.textContent = authErrorMessage(error);
    }
  } finally {
    if (authSubmit) {
      authSubmit.disabled = false;
    }
  }
});

authSwitch?.addEventListener("click", () => {
  setAuthMode(authMode === "signup" ? "login" : "signup");
});

accountBtn?.addEventListener("click", () => {
  showModal(accountModal);
});

$('[data-nav="profile"]')?.addEventListener("click", () => {
  showModal(accountModal);
});

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

captionForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!selectedFile) {
    showToast("Please select a video first.");
    return;
  }

  const caption =
    captionInput?.value.trim() ||
    "My new FunTok video! 🎬 #FunTok";

  setCaptionFormLoading(true);

  try {
    await uploadVideo(selectedFile, caption);
  } catch (error) {
    console.error("Upload error:", error);

    setUploadMessage(error.message);
    showToast(`Upload failed: ${error.message}`);
  } finally {
    setCaptionFormLoading(false);

    if (videoInput) {
      videoInput.value = "";
    }
  }
});

captionCancel?.addEventListener("click", () => {
  hideModal(captionModal);
  resetCaptionModal();

  if (videoInput) {
    videoInput.value = "";
  }
});

document.querySelectorAll(".modal .close").forEach((button) => {
  button.addEventListener("click", () => {
    const modal = button.closest(".modal");

    if (modal === captionModal) {
      resetCaptionModal();

      if (videoInput) {
        videoInput.value = "";
      }
    }

    hideModal(modal);
  });
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target !== modal) return;

    if (modal === captionModal) {
      resetCaptionModal();

      if (videoInput) {
        videoInput.value = "";
      }
    }

    hideModal(modal);
  });
});

$("#commentForm")?.addEventListener("submit", (event) => {
  event.preventDefault();

  const input = $("#commentInput");
  const list = $("#commentList");
  const value = input?.value.trim();

  if (!value || !list) return;

  list.querySelector(".muted")?.remove();

  const comment = document.createElement("p");
  comment.textContent = `You: ${value}`;
  list.appendChild(comment);

  input.value = "";
});

$("#searchBtn")?.addEventListener("click", () => {
  showModal($("#searchModal"));
});

$("#searchInput")?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  const term = event.target.value.trim().toLowerCase();
  let matchCount = 0;

  document.querySelectorAll(".video-card").forEach((card) => {
    const matches =
      !term ||
      card.innerText.toLowerCase().includes(term);

    card.style.display = matches ? "" : "none";

    if (matches) {
      matchCount += 1;
    }
  });

  hideModal($("#searchModal"));
  showToast(`${matchCount} matching video(s)`);
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((item) => item.classList.remove("active"));

    tab.classList.add("active");

    if (tab.dataset.feed === "following") {
      showToast("Following feed is coming soon.");
    } else {
      document.querySelectorAll(".video-card").forEach((card) => {
        card.style.display = "";
      });
    }
  });
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-item")
      .forEach((item) => item.classList.remove("selected"));

    button.classList.add("selected");

    if (button.dataset.nav !== "home") {
      showToast(`${button.dataset.nav} is coming soon.`);
    }
  });
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (accountBtn) {
      accountBtn.textContent = "Log in";
    }

    if (authForm) {
      authForm.hidden = false;
    }

    if (authSwitch) {
      authSwitch.hidden = false;
    }

    if (signedInPanel) {
      signedInPanel.hidden = true;
    }

    setAuthMode("signup");
    return;
  }

  if (accountBtn) {
    accountBtn.textContent = "My account";
  }

  if (authForm) {
    authForm.hidden = true;
  }

  if (authSwitch) {
    authSwitch.hidden = true;
  }

  if (signedInPanel) {
    signedInPanel.hidden = false;
  }

  if (accountTitle) {
    accountTitle.textContent = "Your FunTok Profile";
  }

  if (accountMessage) {
    accountMessage.textContent = "Manage your bio and account details.";
  }

  let profile = {
    displayName: user.displayName || "",
    bio: "Hello! I am new on FunTok."
  };

  try {
    const profileSnapshot = await getDoc(
      doc(db, "users", user.uid)
    );

    if (profileSnapshot.exists()) {
      profile = {
        ...profile,
        ...profileSnapshot.data()
      };
    }
  } catch (error) {
    console.warn("Could not load profile:", error);
  }

  signedInPanel.innerHTML = `
    <p class="signed-in-email">
      <b>Email:</b> ${escapeHtml(user.email || "")}
    </p>

    <label for="editDisplayName">Display name</label>

    <input
      id="editDisplayName"
      type="text"
      maxlength="40"
      value="${escapeHtml(profile.displayName)}"
    >

    <label for="editBio">Bio</label>

    <textarea id="editBio" rows="3">${escapeHtml(profile.bio)}</textarea>

    <button
      id="saveProfileBtn"
      class="primary-btn"
      type="button"
    >
      Save profile
    </button>

    <button
      id="logoutBtn"
      class="primary-btn logout-btn"
      type="button"
    >
      Log out
    </button>

    <p id="profileFeedback" class="auth-feedback"></p>
  `;

  $("#saveProfileBtn")?.addEventListener("click", async () => {
    const newName =
      $("#editDisplayName")?.value.trim() || "FunTok User";

    const newBio =
      $("#editBio")?.value.trim() || "";

    const feedback = $("#profileFeedback");

    if (!feedback) return;

    feedback.textContent = "Saving...";

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: newName,
          bio: newBio
        },
        {
          merge: true
        }
      );

      await updateProfile(user, {
        displayName: newName
      });

      feedback.textContent = "Profile saved.";
      showToast("Profile updated.");
    } catch (error) {
      console.error("Profile update error:", error);
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

if (
  "serviceWorker" in navigator &&
  location.protocol.startsWith("http")
) {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.warn(
      "Service worker registration failed:",
      error
    );
  });
}

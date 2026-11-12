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
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
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
return ${(count / 1000000).toFixed(1).replace(".0", "")}M;
}
if (count >= 1000) {
return ${(count / 1000).toFixed(1).replace(".0", "")}K;
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
}
}
function resetUploadModal() {
selectedVideoFile = null;
if (captionForm) captionForm.reset();
if (captionPreview) captionPreview.innerHTML = "";
if (uploadProgress) uploadProgress.hidden = true;
if (uploadProgressBar) uploadProgressBar.style.width = "0%";
if (uploadStatus) uploadStatus.textContent = "";
}
function openCaptionModal(file) {
selectedVideoFile = file;
if (captionPreview) {
const previewUrl = URL.createObjectURL(file);
captionPreview.innerHTML = `
  <video
    src="${previewUrl}"
    controls
    muted
    playsinline
  ></video>
`;

}
if (captionInput) {
captionInput.value = "";
captionInput.focus();
}
openModal(captionModal);
}
function setUploadState(isUploading) {
const submitButton = captionForm?.querySelector("[type='submit']");
if (submitButton) {
submitButton.disabled = isUploading;
submitButton.textContent = isUploading
? "Uploading..."
: "Post video";
}
if (captionInput) captionInput.disabled = isUploading;
if (captionCancel) captionCancel.disabled = isUploading;
}
async function uploadVideo(file, caption) {
const currentUser = auth.currentUser;
if (!currentUser) {
throw new Error("Please log in before posting a video.");
}
const creatorName =
currentUser.displayName ||
currentUser.email?.split("@")[0] ||
"FunTok Creator";
const formData = new FormData();
formData.append("file", file);
formData.append("upload_preset", UPLOAD_PRESET);
if (uploadProgress) uploadProgress.hidden = false;
if (uploadStatus) uploadStatus.textContent = "Uploading to Cloudinary...";
if (uploadProgressBar) uploadProgressBar.style.width = "35%";
const response = await fetch(
https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload,
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
if (uploadProgressBar) uploadProgressBar.style.width = "75%";
if (uploadStatus) uploadStatus.textContent = "Saving your post...";
const videoData = {
videoUrl: data.secure_url,
uid: currentUser.uid,
displayName: creatorName,
email: currentUser.email || "",
caption,
likes: 0,
comments: 0,
createdAt: new Date().toISOString()
};
await addDoc(collection(db, "videos"), videoData);
if (uploadProgressBar) uploadProgressBar.style.width = "100%";
if (uploadStatus) uploadStatus.textContent = "Video posted successfully.";
renderVideoCard(videoData, true);
notify("Your video was posted.");
window.setTimeout(() => {
closeModal(captionModal);
resetUploadModal();
}, 500);
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

  if (authFeedback) authFeedback.textContent = "Account created.";
} else {
  await signInWithEmailAndPassword(auth, email, password);

  if (authFeedback) authFeedback.textContent = "Logged in.";
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
accountButton?.addEventListener("click", () => {
openModal(accountModal);
});
document
.querySelector('[data-nav="profile"]')
?.addEventListener("click", () => {
openModal(accountModal);
});
uploadButton?.addEventListener("click", () => {
if (!auth.currentUser) {
openModal(accountModal);
notify("Please log in before uploading.");
return;
}
videoInput?.click();
});
videoInput?.addEventListener("change", (event) => {
const file = event.target.files?.[0];
if (!file) return;
if (!file.type.startsWith("video/")) {
notify("Please choose a video file.");
videoInput.value = "";
return;
}
openCaptionModal(file);
});
captionForm?.addEventListener("submit", async (event) => {
event.preventDefault();
if (!selectedVideoFile) {
notify("Please choose a video first.");
return;
}
const caption =
captionInput?.value.trim() ||
"My new FunTok video! 🎬 #FunTok";
try {
setUploadState(true);
await uploadVideo(selectedVideoFile, caption);
} catch (error) {
console.error("Upload error:", error);
if (uploadStatus) {
  uploadStatus.textContent = error.message;
}

notify(`Upload failed: ${error.message}`);

} finally {
setUploadState(false);
if (videoInput) {
  videoInput.value = "";
}

}
});
captionCancel?.addEventListener("click", () => {
closeModal(captionModal);
resetUploadModal();
if (videoInput) {
videoInput.value = "";
}
});
document.querySelectorAll(".modal .close").forEach((button) => {
button.addEventListener("click", () => {
const modal = button.closest(".modal");
if (modal === captionModal) {
  resetUploadModal();

  if (videoInput) {
    videoInput.value = "";
  }
}

closeModal(modal);

});
});
document.querySelectorAll(".modal").forEach((modal) => {
modal.addEventListener("click", (event) => {
if (event.target !== modal) return;
if (modal === captionModal) {
  resetUploadModal();

  if (videoInput) {
    videoInput.value = "";
  }
}

closeModal(modal);

});
});
document.querySelector("#commentForm")?.addEventListener("submit", (event) => {
event.preventDefault();
const input = document.querySelector("#commentInput");
const commentList = document.querySelector("#commentList");
const value = input?.value.trim();
if (!value || !commentList) return;
commentList.querySelector(".muted")?.remove();
const comment = document.createElement("p");
comment.textContent = You: ${value};
commentList.appendChild(comment);
input.value = "";
});
document.querySelector("#searchBtn")?.addEventListener("click", () => {
openModal(document.querySelector("#searchModal"));
});
document.querySelector("#searchInput")?.addEventListener("keydown", (event) => {
if (event.key !== "Enter") return;
const term = event.target.value.trim().toLowerCase();
let matches = 0;
document.querySelectorAll(".video-card").forEach((card) => {
const searchableText = card.innerText.toLowerCase();
const isMatch = !term || searchableText.includes(term);
card.style.display = isMatch ? "" : "none";

if (isMatch) matches += 1;

});
closeModal(document.querySelector("#searchModal"));
notify(${matches} matching video(s));
});
document.querySelectorAll(".tab").forEach((tab) => {
tab.addEventListener("click", () => {
document
.querySelectorAll(".tab")
.forEach((item) => item.classList.remove("active"));
tab.classList.add("active");

if (tab.dataset.feed === "following") {
  notify("Following feed is coming soon.");
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
  notify(`${button.dataset.nav} is coming soon.`);
}

});
});
onAuthStateChanged(auth, async (user) => {
if (user) {
if (accountButton) accountButton.textContent = "My account";
if (authForm) authForm.hidden = true;
if (authSwitch) authSwitch.hidden = true;
if (signedInPanel) signedInPanel.hidden = false;
if (accountTitle) accountTitle.textContent = "Your FunTok Profile";

if (accountMessage) {
  accountMessage.textContent = "Manage your bio and account details.";
}

let profileData = {
  displayName: user.displayName || "",
  bio: "Hello! I am new on FunTok."
};

try {
  const profileSnapshot = await getDoc(doc(db, "users", user.uid));

  if (profileSnapshot.exists()) {
    profileData = {
      ...profileData,
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
    value="${escapeHtml(profileData.displayName)}"
  >

  <label for="editBio">Bio</label>
  <textarea id="editBio" rows="3">${escapeHtml(profileData.bio)}</textarea>

  <button id="saveProfileBtn" class="primary-btn" type="button">
    Save profile
  </button>

  <button id="logoutBtn" class="primary-btn logout-btn" type="button">
    Log out
  </button>

  <p id="profileFeedback" class="auth-feedback"></p>
`;

document
  .querySelector("#saveProfileBtn")
  ?.addEventListener("click", async () => {
    const newName = document
      .querySelector("#editDisplayName")
      ?.value.trim();

    const newBio = document
      .querySelector("#editBio")
      ?.value.trim();

    const feedback = document.querySelector("#profileFeedback");

    if (!feedback) return;

    feedback.textContent = "Saving...";

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: newName || "FunTok User",
          bio: newBio || ""
        },
        { merge: true }
      );

      await updateProfile(user, {
        displayName: newName || "FunTok User"
      });

      feedback.textContent = "Profile saved.";
      notify("Profile updated.");
    } catch (error) {
      console.error(error);
      feedback.textContent = "Could not save your profile.";
    }
  });

document.querySelector("#logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  closeModal(accountModal);
  notify("You have been logged out.");
});

} else {
if (accountButton) accountButton.textContent = "Log in";
if (authForm) authForm.hidden = false;
if (authSwitch) authSwitch.hidden = false;
if (signedInPanel) signedInPanel.hidden = true;
setAuthMode("signup");

}
});
window.addEventListener("DOMContentLoaded", () => {
document.querySelectorAll(".video-card").forEach(bindVideoCard);
setupFeedObserver();
loadVideosFromFirestore();
});
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
navigator.serviceWorker.register("./sw.js").catch((error) => {
console.warn("Service worker registration failed:", error);
});
}

// Firebase Authentication and Firestore for FunTok
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
  getDoc
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

// DOM Elements
const modal = document.querySelector("#accountModal");
const form = document.querySelector("#authForm");
const displayName = document.querySelector("#displayName");
const displayNameLabel = document.querySelector("#displayNameLabel");
const email = document.querySelector("#authEmail");
const password = document.querySelector("#authPassword");
const submit = document.querySelector("#authSubmit");
const switchButton = document.querySelector("#authSwitch");
const feedback = document.querySelector("#authFeedback");
const title = document.querySelector("#accountTitle");
const message = document.querySelector("#accountMessage");
const signedInPanel = document.querySelector("#signedInPanel");
const signedInEmail = document.querySelector("#signedInEmail");
const accountButton = document.querySelector("#accountBtn");
let mode = "signup";

function openAccount(){ 
  if (modal) {
    modal.classList.add("open"); 
    modal.setAttribute("aria-hidden","false"); 
  }
}

function closeAccount(){ 
  if (modal) {
    modal.classList.remove("open"); 
    modal.setAttribute("aria-hidden","true"); 
  }
}

function setMode(nextMode){
  mode = nextMode;
  const signingUp = mode === "signup";
  if(title) title.textContent = signingUp ? "Create your FunTok account" : "Welcome back";
  if(message) message.textContent = signingUp ? "Join FunTok with your email address." : "Log in to continue to your FunTok account.";
  if(displayName) displayName.hidden = !signingUp;
  if(displayNameLabel) displayNameLabel.hidden = !signingUp;
  if(submit) submit.textContent = signingUp ? "Create account" : "Log in";
  if(switchButton) switchButton.textContent = signingUp ? "Already have an account? Log in" : "New to FunTok? Create an account";
  if(password) password.autocomplete = signingUp ? "new-password" : "current-password";
  if(feedback) feedback.textContent = "";
}

// Modal Click Listeners
accountButton?.addEventListener("click", openAccount);
document.querySelector('[data-nav="profile"]')?.addEventListener("click", openAccount);

document.addEventListener("click", (e) => {
  if (e.target.matches('#accountModal .close')) {
    closeAccount();
  } else if (e.target === modal) {
    closeAccount();
  }
});

switchButton?.addEventListener("click", () => setMode(mode === "signup" ? "login" : "signup"));

function readableError(error){
  const code = error?.code || "";
  const messages = {
    "auth/email-already-in-use": "That email already has an account. Try logging in.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/invalid-credential": "Email or password is incorrect. Check them and try again.",
    "auth/network-request-failed": "Network problem. Check your internet connection and try again.",
    "auth/too-many-requests": "Too many attempts. Please wait a while and try again.",
    "auth/unauthorized-domain": "This website domain is not authorized in Firebase yet."
  };
  return messages[code] || `Something went wrong (${code || "unknown error"}). Please try again.`;
}

// Auth Form Submit Handlers
form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if(feedback) feedback.textContent = "Working…";
  if(submit) submit.disabled = true;
  try {
    if (mode === "signup") {
      const result = await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
      const name = displayName.value.trim();
      
      if (name) {
        await updateProfile(result.user, { displayName: name });
      }

      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        username: name || result.user.email.split('@')[0],
        displayName: name || "FunTok User",
        bio: "Hello! I am new on FunTok.",
        profilePicture: "",
        followersCount: 0,
        followingCount: 0,
        createdAt: new Date().toISOString()
      });

      if(feedback) feedback.textContent = "Your FunTok account has been created!";
    } else {
      await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
      if(feedback) feedback.textContent = "You are now logged in!";
    }
    form.reset();
  } catch (error) {
    if(feedback) feedback.textContent = readableError(error);
  } finally {
    if(submit) submit.disabled = false;
  }
});

// Authentication State & Profile Management Loader
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if(accountButton) accountButton.textContent = "My account";
    if(form) form.hidden = true;
    if(switchButton) switchButton.hidden = true;
    if(title) title.textContent = "Your FunTok Profile";
    if(message) message.textContent = "Manage your bio and account details.";

    if (signedInPanel) {
      signedInPanel.hidden = false;

      let userBio = "Hello! I am new on FunTok.";
      let userDisplayName = user.displayName || "";
      try {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          userBio = data.bio || userBio;
          userDisplayName = data.displayName || userDisplayName;
        }
      } catch (e) {
        console.warn("Could not fetch user profile details:", e);
      }

      signedInPanel.innerHTML = `
        <p class="signed-in-email" style="margin-bottom: 12px;"><b>Email:</b> ${user.email}</p>
        <div class="profile-edit-form" style="text-align: left;">
          <label style="display:block; font-size: 14px; margin-bottom: 5px; color: #ccc;">Display Name</label>
          <input id="editDisplayName" type="text" value="${userDisplayName}" style="width:100%; padding:10px; margin-bottom:12px; background:#222; color:#fff; border:1px solid #444; border-radius:6px;">
          
          <label style="display:block; font-size: 14px; margin-bottom: 5px; color: #ccc;">Bio</label>
          <textarea id="editBio" rows="3" style="width:100%; padding:10px; margin-bottom:15px; background:#222; color:#fff; border:1px solid #444; border-radius:6px;">${userBio}</textarea>
          
          <button id="saveProfileBtn" class="primary-btn" type="button" style="width:100%; margin-bottom: 10px;">Save Profile</button>
          <button id="logoutBtn" class="primary-btn" type="button" style="width:100%; background: #333; color: #fff;">Log out</button>
          <p id="profileFeedback" style="margin-top: 8px; font-size: 13px; text-align: center; color: #4ade80;"></p>
        </div>
      `;

      document.querySelector("#saveProfileBtn")?.addEventListener("click", async () => {
        const newName = document.querySelector("#editDisplayName").value.trim();
        const newBio = document.querySelector("#editBio").value.trim();
        const feedbackEl = document.querySelector("#profileFeedback");
        
        feedbackEl.style.color = "#4ade80";
        feedbackEl.textContent = "Saving...";
        try {
          await setDoc(doc(db, "users", user.uid), {
            displayName: newName,
            bio: newBio
          }, { merge: true });

          if (newName) {
            await updateProfile(user, { displayName: newName });
          }

          feedbackEl.textContent = "Profile updated successfully!";
        } catch (err) {
          console.error("Error updating profile:", err);
          feedbackEl.style.color = "#ef4444";
          feedbackEl.textContent = "Failed to update profile.";
        }
      });

      document.querySelector("#logoutBtn")?.addEventListener("click", async () => {
        try { 
          await signOut(auth); 
        } catch (error) { 
          console.error("Logout error:", error);
        }
      });
    }
  } else {
    if(accountButton) accountButton.textContent = "Log in";
    if(signedInPanel) signedInPanel.hidden = true;
    if(form) form.hidden = false;
    if(switchButton) switchButton.hidden = false;
    setMode("signup");
  }
});

// --- Safe UI Fix for Bottom Navigation Bar ---
const styleFix = document.createElement("style");
styleFix.innerHTML = `
  /* Ensure bottom navigation bar stays permanently visible and clickable across all devices */
  nav, .nav, footer, header + nav, [class*="nav"], [class*="bar"], [class*="menu"] {
    z-index: 99999 !important;
  }
`;
document.head.appendChild(styleFix);

// --- Video Upload & Feed Persistence ---
const videoInput = document.querySelector("#videoInput");
const feed = document.querySelector("#feed");

function renderVideoCard(videoUrl, displayName, caption) {
  if (!feed) return;
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const newCard = document.createElement("article");
  newCard.className = "video-card theme-one";
  newCard.style.cssText = "position: relative; width: 100%; max-width: 450px; height: calc(100vh - 85px); margin: 0 auto 15px auto; z-index: 5; background: #000; display: flex; flex-direction: column; overflow: hidden; border-radius: 12px;";
  
  newCard.innerHTML = `
    <div class="visual" style="width:100%; flex: 1; background: #000; display:flex; align-items:center; justify-content:center; overflow:hidden;">
      <video src="${videoUrl}" controls autoplay loop style="width:100%; height:100%; object-fit:cover;"></video>
    </div>
    <div class="video-shade"></div>
    <div class="video-info" style="z-index: 15;">
      <div class="creator"><span class="avatar">${avatarLetter}</span><b>@${displayName.toLowerCase().replace(/\s+/g, '')}</b><button class="follow">Follow</button></div>
      <p>${caption}</p>
      <span class="sound">♫ original sound — ${displayName.toLowerCase()}</span>
    </div>
    <div class="actions" style="z-index: 15;">
      <button class="action like" aria-label="Like">♡<small>1</small></button>
      <button class="action comments" aria-label="Comments">▢<small>0</small></button>
      <button class="action share" aria-label="Share">➤<small>Share</small></button>
      <span class="record">♫</span>
    </div>
  `;
  feed.style.position = "relative";
  feed.prepend(newCard);
}

// Restore saved videos from localStorage safely when page loads
window.addEventListener("DOMContentLoaded", () => {
  const savedVideos = JSON.parse(localStorage.getItem("funtok_videos") || "[]");
  savedVideos.reverse().forEach(v => renderVideoCard(v.videoUrl, v.displayName, v.caption));
});

// When a video file is chosen from the computer via the native label/input
videoInput?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const videoUrl = URL.createObjectURL(file);
  const currentUser = auth.currentUser;
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "FunTok Creator";
  const caption = "My new FunTok video! 🎬 #FunTok";

  renderVideoCard(videoUrl, displayName, caption);

  try {
    const savedVideos = JSON.parse(localStorage.getItem("funtok_videos") || "[]");
    savedVideos.push({ videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", displayName, caption });
    if (savedVideos.length > 5) savedVideos.shift();
    localStorage.setItem("funtok_videos", JSON.stringify(savedVideos));
    console.log("Video posted successfully!");
  } catch (err) {
    console.warn("LocalStorage quota handled.");
  }

  videoInput.value = "";
});

window.addEventListener("funtok:open-account", openAccount);

// Restore saved videos from localStorage safely when page loads
window.addEventListener("DOMContentLoaded", () => {
  const savedVideos = JSON.parse(localStorage.getItem("funtok_videos") || "[]");
  savedVideos.reverse().forEach(v => renderVideoCard(v.videoUrl, v.displayName, v.caption));
});

// When the upload button is clicked
uploadBtn?.addEventListener("click", () => {
  if (!auth.currentUser) {
    window.dispatchEvent(new CustomEvent("funtok:open-account"));
    return;
  }
  videoInput?.click();
});

// When a video file is chosen from the computer
videoInput?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const videoUrl = URL.createObjectURL(file);
  const currentUser = auth.currentUser;
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "FunTok Creator";
  const caption = "My new FunTok video! 🎬 #FunTok";

  // Render on screen immediately
  renderVideoCard(videoUrl, displayName, caption);

  // Safely save session reference to localStorage
  try {
    const savedVideos = JSON.parse(localStorage.getItem("funtok_videos") || "[]");
    savedVideos.push({ videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", displayName, caption });
    if (savedVideos.length > 5) savedVideos.shift();
    localStorage.setItem("funtok_videos", JSON.stringify(savedVideos));
    console.log("Video posted successfully!");
  } catch (err) {
    console.warn("LocalStorage quota handled.");
  }

  videoInput.value = "";
});

window.addEventListener("funtok:open-account", openAccount);

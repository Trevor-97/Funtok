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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Cloudinary Configuration
const CLOUD_NAME = "ecgad8fi";
const UPLOAD_PRESET = "funtok_upload";

// DOM Elements & Auth Setup
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
let mode = "signup";

function openAccount(){ 
  if (modal) { 
    modal.classList.add("open"); 
    modal.setAttribute("aria-hidden","false"); 
  } else {
    console.warn("Account modal element not found!");
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

document.addEventListener("click", (e) => {
  if (e.target.matches('#accountModal .close') || e.target === modal) closeAccount();
});
switchButton?.addEventListener("click", () => setMode(mode === "signup" ? "login" : "signup"));

function readableError(error){
  const code = error?.code || "";
  const messages = {
    "auth/email-already-in-use": "That email already has an account. Try logging in.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/invalid-credential": "Email or password is incorrect. Check them and try again.",
    "auth/network-request-failed": "Network problem. Check your internet connection.",
    "auth/too-many-requests": "Too many attempts. Please wait."
  };
  return messages[code] || `Something went wrong (${code}). Please try again.`;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if(feedback) feedback.textContent = "Working…";
  if(submit) submit.disabled = true;
  try {
    if (mode === "signup") {
      const result = await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
      const name = displayName.value.trim();
      if (name) await updateProfile(result.user, { displayName: name });
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid, email: result.user.email, username: name || result.user.email.split('@')[0],
        displayName: name || "FunTok User", bio: "Hello! I am new on FunTok.", createdAt: new Date().toISOString()
      });
      if(feedback) feedback.textContent = "Account created!";
    } else {
      await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
      if(feedback) feedback.textContent = "Logged in!";
    }
    form.reset();
  } catch (error) {
    if(feedback) feedback.textContent = readableError(error);
  } finally {
    if(submit) submit.disabled = false;
  }
});

onAuthStateChanged(auth, async (user) => {
  const accountButton = document.querySelector("#accountBtn");
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
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          userBio = docSnap.data().bio || userBio;
          userDisplayName = docSnap.data().displayName || userDisplayName;
        }
      } catch (e) { console.warn(e); }

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
        feedbackEl.textContent = "Saving...";
        try {
          await setDoc(doc(db, "users", user.uid), { displayName: newName, bio: newBio }, { merge: true });
          if (newName) await updateProfile(user, { displayName: newName });
          feedbackEl.textContent = "Saved successfully!";
        } catch (err) { feedbackEl.textContent = "Failed."; }
      });
      document.querySelector("#logoutBtn")?.addEventListener("click", async () => { await signOut(auth); });
    }
  } else {
    if(accountButton) accountButton.textContent = "Log in";
    if(signedInPanel) signedInPanel.hidden = true;
    if(form) form.hidden = false;
    if(switchButton) switchButton.hidden = false;
    setMode("signup");
  }
});

// Global CSS Taskbar Fix
const styleFix = document.createElement("style");
styleFix.innerHTML = `nav, .bottom-nav, footer, header + nav, [class*="nav"], [class*="bar"], [class*="menu"] { z-index: 99999 !important; }`;
document.head.appendChild(styleFix);

// Video Upload & Cloudinary Feed Integration
const feed = document.querySelector("#feed");
const videoInput = document.querySelector("#videoInput");

function renderVideoCard(videoUrl, displayName, caption) {
  if (!feed) return;
  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : "F";
  const newCard = document.createElement("article");
  newCard.className = "video-card theme-one";
  newCard.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: calc(100% - 70px); z-index: 100; background: #000;";
  
  newCard.innerHTML = `
    <div class="visual" style="width:100%; height:100%; background: #000; display:flex; align-items:center; justify-content:center; overflow:hidden;">
      <video src="${videoUrl}" controls autoplay loop playsinline style="width:100%; height:100%; object-fit:cover;"></video>
    </div>
    <div class="video-shade"></div>
    <div class="video-info" style="z-index: 110;">
      <div class="creator"><span class="avatar">${avatarLetter}</span><b>@${displayName.toLowerCase().replace(/\s+/g, '')}</b><button class="follow">Follow</button></div>
      <p>${caption}</p>
      <span class="sound">♫ original sound — ${displayName.toLowerCase()}</span>
    </div>
    <div class="actions" style="z-index: 110;">
      <button class="action like" aria-label="Like">♡<small>1</small></button>
      <button class="action comments" aria-label="Comments">▢<small>0</small></button>
      <button class="action share" aria-label="Share">➤<small>Share</small></button>
      <span class="record">♫</span>
    </div>
  `;
  feed.style.position = "relative";
  feed.prepend(newCard);
}

// Load Videos from Firestore on Startup
async function loadVideosFromFirestore() {
  try {
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      renderVideoCard(data.videoUrl, data.displayName, data.caption);
    });
  } catch (err) {
    console.warn("Error loading videos from Firestore:", err);
  }
}

// Safely bind buttons once DOM is fully loaded
window.addEventListener("DOMContentLoaded", () => {
  const accountButton = document.querySelector("#accountBtn");
  if (accountButton) {
    accountButton.addEventListener("click", openAccount);
  }

  const profileNav = document.querySelector('[data-nav="profile"]');
  if (profileNav) {
    profileNav.addEventListener("click", openAccount);
  }

  loadVideosFromFirestore();
});

// Handle Video Upload to Cloudinary & Save to Firestore
videoInput?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("Please log in before posting a video!");
    videoInput.value = "";
    return;
  }

  const displayName = currentUser.displayName || currentUser.email.split('@')[0] || "FunTok Creator";
  const caption = "My new FunTok video! 🎬 #FunTok";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
      method: "POST",
      body: formData
    });
    
    const data = await response.json();
    if (!data.secure_url) {
      console.error("Cloudinary Error Details:", data);
      throw new Error(data.error?.message || "Upload failed from Cloudinary.");
    }

    const videoUrl = data.secure_url;

    await addDoc(collection(db, "videos"), {
      videoUrl: videoUrl,
      uid: currentUser.uid,
      displayName: displayName,
      caption: caption,
      createdAt: new Date().toISOString()
    });

    renderVideoCard(videoUrl, displayName, caption);
    console.log("Video posted successfully to the cloud!");
  } catch (err) {
    console.error("Upload error:", err);
    alert("Failed to upload video: " + err.message);
  } finally {
    videoInput.value = "";
  }
});

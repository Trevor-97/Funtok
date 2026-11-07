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
  getDoc,
  updateDoc
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

// UI Elements
const modal = document.querySelector("#accountModal");
const form = document.querySelector("#authForm");
const displayNameInput = document.querySelector("#displayName");
const displayNameLabel = document.querySelector("#displayNameLabel");
const emailInput = document.querySelector("#authEmail");
const passwordInput = document.querySelector("#authPassword");
const submit = document.querySelector("#authSubmit");
const switchButton = document.querySelector("#authSwitch");
const feedback = document.querySelector("#authFeedback");
const title = document.querySelector("#accountTitle");
const message = document.querySelector("#accountMessage");
const signedInPanel = document.querySelector("#signedInPanel");
const accountButton = document.querySelector("#accountBtn");
let mode = "signup";

function openAccount(){ 
  if(modal) {
    modal.classList.add("open"); 
    modal.setAttribute("aria-hidden","false"); 
  }
}

function closeAccount(){ 
  if(modal) {
    modal.classList.remove("open"); 
    modal.setAttribute("aria-hidden","true"); 
  }
}

function setMode(nextMode){
  mode = nextMode;
  const signingUp = mode === "signup";
  if(title) title.textContent = signingUp ? "Create your FunTok account" : "Welcome back";
  if(message) message.textContent = signingUp ? "Join FunTok with your email address." : "Log in to continue to your FunTok account.";
  if(displayNameInput) displayNameInput.hidden = !signingUp;
  if(displayNameLabel) displayNameLabel.hidden = !signingUp;
  if(submit) submit.textContent = signingUp ? "Create account" : "Log in";
  if(switchButton) switchButton.textContent = signingUp ? "Already have an account? Log in" : "New to FunTok? Create an account";
  if(passwordInput) passwordInput.autocomplete = signingUp ? "new-password" : "current-password";
  if(feedback) feedback.textContent = "";
}

// Event Listeners for Modal Open/Close
accountButton?.addEventListener("click", openAccount);
document.querySelector('[data-nav="profile"]')?.addEventListener("click", openAccount);

const closeBtn = document.querySelector('#accountModal .close');
if (closeBtn) {
  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    closeAccount();
  });
}

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeAccount();
  }
});

switchButton?.addEventListener("click", () => setMode(mode === "signup" ? "login" : "signup"));

// Form Submission (Sign up / Login)
form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if(feedback) feedback.textContent = "Working…";
  if(submit) submit.disabled = true;
  try {
    if (mode === "signup") {
      const result = await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
      const name = displayNameInput.value.trim();
      
      if (name) {
        await updateProfile(result.user, { displayName: name });
      }

      // Save user profile data to Firestore database
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
      await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
      if(feedback) feedback.textContent = "You are now logged in!";
    }
    form.reset();
  } catch (error) {
    if(feedback) feedback.textContent = readableError(error);
  } finally {
    if(submit) submit.disabled = false;
  }
});

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

// Track Auth State Changes & Build Profile Edit View
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if(accountButton) accountButton.textContent = "My account";
    if(form) form.hidden = true;
    if(switchButton) switchButton.hidden = true;
    if(title) title.textContent = "Your FunTok Profile";
    if(message) message.textContent = "Manage your bio and account details.";

    if(signedInPanel) {
      signedInPanel.hidden = false;
      
      // Fetch user profile data from Firestore
      let userBio = "Hello! I am new on FunTok.";
      let userDisplayName = user.displayName || "";
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          userBio = data.bio || userBio;
          userDisplayName = data.displayName || userDisplayName;
        }
      } catch (e) {
        console.log("Error loading profile:", e);
      }

      // Populate signedInPanel with Profile editing fields
      signedInPanel.innerHTML = `
        <p class="signed-in-email"><b>Email:</b> ${user.email}</p>
        <div class="profile-edit-form" style="margin-top: 15px; text-align: left;">
          <label style="display:block; font-size: 14px; margin-bottom: 5px;">Display Name</label>
          <input id="editDisplayName" type="text" value="${userDisplayName}" style="width:100%; padding:10px; margin-bottom:12px; background:#222; color:#fff; border:1px solid #444; border-radius:6px;">
          
          <label style="display:block; font-size: 14px; margin-bottom: 5px;">Bio</label>
          <textarea id="editBio" rows="3" style="width:100%; padding:10px; margin-bottom:15px; background:#222; color:#fff; border:1px solid #444; border-radius:6px;">${userBio}</textarea>
          
          <button id="saveProfileBtn" class="primary-btn" type="button" style="width:100%; margin-bottom: 10px;">Save Profile</button>
          <button id="logoutBtn" class="primary-btn" type="button" style="width:100%; background: #333; color: #fff;">Log out</button>
          <p id="profileFeedback" style="margin-top: 8px; font-size: 13px; text-align: center; color: #4ade80;"></p>
        </div>
      `;

      // Save Profile Button Logic
      document.querySelector("#saveProfileBtn")?.addEventListener("click", async () => {
        const newName = document.querySelector("#editDisplayName").value.trim();
        const newBio = document.querySelector("#editBio").value.trim();
        const feedbackEl = document.querySelector("#profileFeedback");
        
        feedbackEl.textContent = "Saving...";
        try {
          await updateDoc(doc(db, "users", user.uid), {
            displayName: newName,
            bio: newBio
          });
          feedbackEl.textContent = "Profile updated successfully!";
        } catch (err) {
          console.error("Error updating profile:", err);
          feedbackEl.style.color = "#ef4444";
          feedbackEl.textContent = "Failed to update profile.";
        }
      });

      // Logout Button Logic
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

window.addEventListener("funtok:open-account", openAccount);

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

// Logout Action
document.querySelector("#logoutBtn")?.addEventListener("click", async () => {
  try { 
    await signOut(auth); 
    if(feedback) feedback.textContent = "You have logged out."; 
  } catch (error) { 
    if(feedback) feedback.textContent = readableError(error); 
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

// Authentication State & Profile Loader
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if(accountButton) accountButton.textContent = "My account";
    if(signedInPanel) signedInPanel.hidden = false;
    if(form) form.hidden = true;
    if(switchButton) switchButton.hidden = true;
    if(signedInEmail) signedInEmail.textContent = user.displayName ? `${user.displayName} · ${user.email}` : user.email;
    if(title) title.textContent = "Your FunTok account";
    if(message) message.textContent = "You are signed in.";

    try {
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        console.log("Firestore profile loaded:", docSnap.data());
      }
    } catch (e) {
      console.warn("Could not fetch user profile details:", e);
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

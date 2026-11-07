// Firebase Authentication and Firestore for FunTok. This web configuration is intended for client-side use.
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

function openAccount(){ modal.classList.add("open"); modal.setAttribute("aria-hidden","false"); }
function setMode(nextMode){
  mode = nextMode;
  const signingUp = mode === "signup";
  title.textContent = signingUp ? "Create your FunTok account" : "Welcome back";
  message.textContent = signingUp ? "Join FunTok with your email address." : "Log in to continue to your FunTok account.";
  displayName.hidden = !signingUp;
  displayNameLabel.hidden = !signingUp;
  submit.textContent = signingUp ? "Create account" : "Log in";
  switchButton.textContent = signingUp ? "Already have an account? Log in" : "New to FunTok? Create an account";
  password.autocomplete = signingUp ? "new-password" : "current-password";
  feedback.textContent = "";
}

accountButton?.addEventListener("click", openAccount);
document.querySelector('[data-nav="profile"]')?.addEventListener("click", openAccount);
switchButton?.addEventListener("click", () => setMode(mode === "signup" ? "login" : "signup"));

document.querySelector("#logoutBtn")?.addEventListener("click", async () => {
  try { await signOut(auth); feedback.textContent = "You have logged out."; }
  catch (error) { feedback.textContent = readableError(error); }
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
    "auth/unauthorized-domain": "This website domain is not authorized in Firebase yet. We need to add trevor-97.github.io in Firebase Authentication settings."
  };
  return messages[code] || `Something went wrong (${code || "unknown error"}). Please try again.`;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  feedback.textContent = "Working…";
  submit.disabled = true;
  try {
    if (mode === "signup") {
      const result = await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
      const name = displayName.value.trim();
      
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

      feedback.textContent = "Your FunTok account has been created!";
    } else {
      await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
      feedback.textContent = "You are now logged in!";
    }
    form.reset();
  } catch (error) {
    feedback.textContent = readableError(error);
  } finally {
    submit.disabled = false;
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    accountButton.textContent = "My account";
    signedInPanel.hidden = false;
    form.hidden = true;
    switchButton.hidden = true;
    signedInEmail.textContent = user.displayName ? `${user.displayName} · ${user.email}` : user.email;
    title.textContent = "Your FunTok account";
    message.textContent = "You are signed in.";

    // Optional: Fetch and verify profile data from Firestore
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log("User profile loaded from Firestore:", docSnap.data());
      }
    } catch (e) {
      console.log("Could not load profile document yet:", e);
    }
  } else {
    accountButton.textContent = "Log in";
    signedInPanel.hidden = true;
    form.hidden = false;
    switchButton.hidden = false;
    setMode("signup");
  }
});

// The main app's profile button and the header account button both open the same account panel.
window.addEventListener("funtok:open-account", openAccount);

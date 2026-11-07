// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration (Make sure your config details match your project)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "funtok-77831.firebaseapp.com",
  projectId: "funtok-77831",
  storageBucket: "funtok-77831.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Function to handle User Registration and create a Firestore profile document
window.registerUser = async function(email, password, username) {
  try {
    // 1. Create the user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Create a user profile document in Firestore database
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      username: username || email.split('@')[0],
      displayName: username || "FunTok User",
      bio: "Hello! I am new on FunTok.",
      profilePicture: "",
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date().toISOString()
    });

    alert("Account created successfully!");
    window.location.href = "index.html"; // Redirect back to home/feed
  } catch (error) {
    console.error("Error signing up:", error.message);
    alert("Error: " + error.message);
  }
};

// Function to handle User Login
window.loginUser = async function(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Logged in successfully!");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error logging in:", error.message);
    alert("Error: " + error.message);
  }
};

// Function to handle User Logout
window.logoutUser = async function() {
  try {
    await signOut(auth);
    alert("Logged out successfully!");
    window.location.reload();
  } catch (error) {
    console.error("Error logging out:", error.message);
  }
};

// Monitor current login state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in
    console.log("Logged in user UID:", user.uid);
    
    // Optional: Fetch user profile data from Firestore
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("User profile data:", docSnap.data());
    }
  } else {
    // User is signed out
    console.log("No user is signed in.");
  }
});

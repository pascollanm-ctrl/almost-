// --- CONFIGURATION ---
const API_KEY = "AIzaSyChZG0b4IiGy4DMkBnuvivTW_Q48fJ8uEg"; 
const ADMIN_EMAIL = "pascollanm@gmail.com";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: API_KEY,
    authDomain: "discussion-group-2e4e3.firebaseapp.com",
    projectId: "discussion-group-2e4e3",
    storageBucket: "discussion-group-2e4e3.firebasestorage.app",
    messagingSenderId: "992748744659",
    appId: "1:992748744659:web:3538b81190f5fb01f18926",
    measurementId: "G-2H8JVFSNCT"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); 

// --- TROUBLESHOOTING AUTH UI ---
// 1. Create a simple, isolated div for testing
const testDiv = document.createElement('div');
testDiv.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; padding: 10px; z-index: 9999; 
    background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; 
    font-family: Arial, sans-serif; text-align: center;
`;
testDiv.innerHTML = `
    <h3>AUTH TESTER (Temporary)</h3>
    <input type="email" id="test-email" placeholder="Email" style="width: 180px; padding: 5px;">
    <input type="password" id="test-password" placeholder="Password" style="width: 180px; padding: 5px;">
    <button id="test-register-btn" style="padding: 5px 10px;">Register</button>
    <button id="test-login-btn" style="padding: 5px 10px;">Login</button>
    <button id="test-logout-btn" style="padding: 5px 10px; background: orange;">Logout</button>
    <p id="test-status" style="font-weight: bold; margin-top: 5px;">Status: Initializing...</p>
`;
document.body.prepend(testDiv);

const testStatus = document.getElementById('test-status');
const testEmailInput = document.getElementById('test-email');
const testPasswordInput = document.getElementById('test-password');
const testRegisterBtn = document.getElementById('test-register-btn');
const testLoginBtn = document.getElementById('test-login-btn');
const testLogoutBtn = document.getElementById('test-logout-btn');


// 2. Auth Listeners & Handlers
auth.onAuthStateChanged(user => {
    if (user) {
        testStatus.textContent = `Status: Logged In as ${user.email}`;
        testDiv.style.background = '#d4edda'; // Green for success
        testDiv.style.color = '#155724';
    } else {
        testStatus.textContent = `Status: Logged Out. Please Login or Register.`;
        testDiv.style.background = '#f8d7da'; // Red for not logged in
        testDiv.style.color = '#721c24';
    }
});

testRegisterBtn.addEventListener('click', async () => {
    const email = testEmailInput.value;
    const password = testPasswordInput.value;
    testStatus.textContent = 'Attempting Register...';
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        // onAuthStateChanged will update status
    } catch (error) {
        testStatus.textContent = `Error: ${error.message}`;
        console.error("Register Error:", error);
    }
});

testLoginBtn.addEventListener('click', async () => {
    const email = testEmailInput.value;
    const password = testPasswordInput.value;
    testStatus.textContent = 'Attempting Login...';
    try {
        await auth.signInWithEmailAndPassword(email, password);
        // onAuthStateChanged will update status
    } catch (error) {
        testStatus.textContent = `Error: Invalid credentials or account does not exist.`;
        console.error("Login Error:", error);
    }
});

testLogoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// --- REMAINDER OF APPLICATION LOGIC ---
// The main application logic (modals, views, fetching data) is removed for this test.
// If the test above works, we know the API key and Firebase initialization are correct.
// We can then re-integrate the main UI logic carefully.

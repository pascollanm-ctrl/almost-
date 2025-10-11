// **CORRECTED API KEY INCORPORATED**
const API_KEY = "AIzaSyChZG0b4IiGy4DMkBnuvivTW_Q48fJ8uEg"; 

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: API_KEY, // The correct key is used here
    authDomain: "discussion-group-2e4e3.firebaseapp.com",
    projectId: "discussion-group-2e4e3",
    storageBucket: "discussion-group-2e4e3.firebasestorage.app",
    messagingSenderId: "992748744659",
    appId: "1:992748744659:web:3538b81190f5fb01f18926",
    measurementId: "G-2H8JVFSNCT"
};

// Initialize Firebase using the compatibility layer (v9.6.1)
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); 

// --- DOM ELEMENTS ---
const authSection = document.getElementById('auth-section');
const authButton = document.getElementById('auth-button');
const closeAuthModal = document.getElementById('close-auth-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authError = document.getElementById('auth-error');
const newTopicForm = document.getElementById('new-topic-form');
const discussionList = document.getElementById('discussion-list');

// --- EVENT LISTENERS ---

// Toggle Auth Modal visibility
authButton.addEventListener('click', () => {
    authSection.style.display = 'flex';
});

closeAuthModal.addEventListener('click', () => {
    authSection.style.display = 'none';
});

// User Registration
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.textContent = '';
    const email = e.target['register-email'].value;
    const password = e.target['register-password'].value;

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        alert('Registration successful! You are now logged in.');
        authSection.style.display = 'none'; 
    } catch (error) {
        console.error("Registration error:", error);
        authError.textContent = `Registration Failed: ${error.message}`;
    }
});

// User Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.textContent = '';
    const email = e.target['login-email'].value;
    const password = e.target['login-password'].value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        alert('Login successful!');
        authSection.style.display = 'none'; 
    } catch (error) {
        console.error("Login error:", error);
        authError.textContent = `Login Failed: ${error.message}`;
    }
});

// Post New Topic
newTopicForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = e.target['topic-title'].value;
    const content = e.target['topic-content'].value;
    const user = auth.currentUser;
    const postError = document.getElementById('topic-post-error');
    postError.textContent = '';

    if (!user) {
        postError.textContent = "You must be logged in to post a topic.";
        return;
    }

    try {
        await db.collection("topics").add({
            title: title,
            content: content,
            authorId: user.uid,
            authorEmail: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            commentCount: 0 // Initialize comment count
        });
        
        newTopicForm.reset();
        // fetchTopics() is not explicitly called here because onSnapshot handles real-time updates
    } catch (error) {
        console.error("Error adding topic: ", error);
        postError.textContent = `Posting failed: ${error.message}`;
    }
});

// --- FIREBASE AUTH STATE LISTENER ---
// Checks if the user is logged in and updates UI
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        authButton.textContent = `Logout (${user.email})`;
        authButton.onclick = () => auth.signOut(); 
        document.getElementById('new-topic-section').style.display = 'block'; 
    } else {
        // User is signed out
        authButton.textContent = 'Login / Register';
        authButton.onclick = () => authSection.style.display = 'flex'; 
        document.getElementById('new-topic-section').style.display = 'none'; 
    }
});

// --- DATA FETCHING (Topics) ---

function fetchTopics() {
    discussionList.innerHTML = '<h3>Loading discussions...</h3>'; 

    // Listen for real-time updates for the discussion list
    db.collection("topics").orderBy("createdAt", "desc").onSnapshot(snapshot => {
        discussionList.innerHTML = ''; 
        
        if (snapshot.empty) {
            discussionList.innerHTML = '<p>No topics yet. Be the first to start a discussion! 🎉</p>';
            return;
        }

        snapshot.forEach(doc => {
            const topic = doc.data();
            const topicElement = document.createElement('article');
            topicElement.classList.add('topic-post');
            
            // Format timestamp for display
            const date = topic.createdAt ? topic.createdAt.toDate().toLocaleDateString() : 'N/A';

            topicElement.innerHTML = `
                <h3>${topic.title}</h3>
                <p class="meta">Posted by <strong>${topic.authorEmail}</strong> on ${date}</p>
                <p>${topic.content}</p>
                <button class="view-comments" data-topic-id="${doc.id}">View Comments (${topic.commentCount || 0})</button>
            `;
            discussionList.appendChild(topicElement);
        });
    }, error => {
        console.error("Error fetching topics:", error);
        discussionList.innerHTML = '<p class="error-message">Could not load discussions. Please check your network and Firebase connection. ⚠️</p>';
    });
}

// Initial call to load topics when script runs
fetchTopics();

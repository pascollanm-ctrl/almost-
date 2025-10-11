// --- CONFIGURATION ---
const API_KEY = "AIzaSyChZG0b4IiGy4DMkBnuvivTW_Q48fJ8uEg"; 
const ADMIN_EMAIL = "pascollanm@gmail.com";
const UNIT_NAMES = {
    'biochemistry': '1. Biochemistry',
    'physiology': '2. Physiology',
    'anatomy': '3. Anatomy (Embryology, Histology, Gen. Anatomy)',
    'nursing-skills': '4. Nursing Skills'
};

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

// --- DOM ELEMENTS ---
const appMainContent = document.getElementById('app-main-content');
const authModal = document.getElementById('auth-modal');
const authButton = document.getElementById('auth-button');
const closeAuthModal = document.getElementById('close-auth-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const switchToRegister = document.getElementById('switch-to-register');
const switchToLogin = document.getElementById('switch-to-login');
const authError = document.getElementById('auth-error');
const userInfoDisplay = document.getElementById('user-info');
const adminLink = document.getElementById('admin-link');
const newTopicForm = document.getElementById('new-topic-form');
const discussionList = document.getElementById('discussion-list');
const newAnnouncementForm = document.getElementById('new-announcement-form');
const announcementList = document.getElementById('announcement-list');

// Modals
const unitsButton = document.getElementById('units-button');
const unitSelectionModal = document.getElementById('unit-selection-modal');
const resourceSelectionModal = document.getElementById('resource-selection-modal');

// --- HELPER FUNCTIONS ---

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function switchView(viewId) {
    document.querySelectorAll('.content-panel').forEach(panel => {
        panel.classList.remove('active-panel');
    });
    document.getElementById(viewId).classList.add('active-panel');

    document.querySelectorAll('.nav-item').forEach(link => {
        link.classList.remove('active');
    });
    // Highlight the active link, excluding the button
    if (viewId !== 'resource-view') {
        document.querySelector(`.nav-item[href="#${viewId}"]`)?.classList.add('active');
    }
}

// --- AUTHENTICATION & UI SETUP ---

// Toggle between Login and Register Forms
switchToRegister.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authError.textContent = '';
});

switchToLogin.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    authError.textContent = '';
});

// Show Auth Modal
authButton.addEventListener('click', () => {
    authModal.style.display = 'flex';
});

// Close Auth Modal
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modalId = e.target.dataset.closeModal || 'auth-modal';
        hideModal(modalId);
    });
});

// User Registration
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authError.textContent = '';
    const email = e.target['register-email'].value;
    const password = e.target['register-password'].value;

    try {
        await auth.createUserWithEmailAndPassword(email, password);
        // UI updated by onAuthStateChanged
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
        // UI updated by onAuthStateChanged
    } catch (error) {
        console.error("Login error:", error);
        // IMPROVEMENT: Clear and specific error message for wrong credentials
        authError.textContent = "Error: Invalid email or password. Please try again.";
    }
});

// --- FIREBASE AUTH STATE LISTENER (The Core UI Switch) ---
auth.onAuthStateChanged(user => {
    if (user) {
        // Logged In State
        hideModal('auth-modal');
        appMainContent.classList.remove('hidden-content');
        authButton.textContent = 'Logout';
        authButton.onclick = () => auth.signOut();
        
        // Show User Info
        userInfoDisplay.innerHTML = `<p>Welcome, <strong>${user.email}</strong>!</p>`;

        // Check for Admin status and show Admin link
        if (user.email === ADMIN_EMAIL) {
            adminLink.classList.remove('hidden');
        } else {
            adminLink.classList.add('hidden');
        }

        // Fetch initial data
        fetchTopics();
        fetchAnnouncements();
        switchView('discussion-view'); // Set default view

    } else {
        // Logged Out State
        appMainContent.classList.add('hidden-content');
        authButton.textContent = 'Login / Register';
        authButton.onclick = () => showModal('auth-modal');
        userInfoDisplay.innerHTML = '';
        adminLink.classList.add('hidden');
        // Automatically show login modal if not already visible
        if (window.location.hash === '') showModal('auth-modal');
    }
});

// --- DISCUSSION TOPICS (Logic from previous step) ---

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
            commentCount: 0 
        });
        
        newTopicForm.reset();
    } catch (error) {
        postError.textContent = `Posting failed: ${error.message}`;
    }
});

function fetchTopics() {
    discussionList.innerHTML = '<p>Loading discussions...</p>';
    db.collection("topics").orderBy("createdAt", "desc").onSnapshot(snapshot => {
        discussionList.innerHTML = '';
        if (snapshot.empty) {
            discussionList.innerHTML = '<p class="form-card">No topics yet. Start a discussion! 🎉</p>';
            return;
        }
        snapshot.forEach(doc => {
            const topic = doc.data();
            const topicElement = document.createElement('article');
            topicElement.classList.add('topic-post', 'form-card');
            
            const date = topic.createdAt ? topic.createdAt.toDate().toLocaleDateString() : 'N/A';

            topicElement.innerHTML = `
                <h3>${topic.title}</h3>
                <p class="meta">Posted by <strong>${topic.authorEmail}</strong> on ${date}</p>
                <p>${topic.content}</p>
                <button class="btn btn-secondary" data-topic-id="${doc.id}">View Comments (${topic.commentCount || 0})</button>
            `;
            discussionList.appendChild(topicElement);
        });
    });
}

// --- ANNOUNCEMENTS (New Implementation) ---

newAnnouncementForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = e.target['announcement-title'].value;
    const content = e.target['announcement-content'].value;
    const user = auth.currentUser;

    if (!user) {
        alert("You must be logged in to post an announcement.");
        return;
    }

    try {
        await db.collection("announcements").add({
            title: title,
            content: content,
            authorEmail: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        
        newAnnouncementForm.reset();
        // Since we are using onSnapshot, fetchAnnouncements will update automatically

    } catch (error) {
        alert(`Posting failed: ${error.message}`);
    }
});

function fetchAnnouncements() {
    announcementList.innerHTML = '<p>Loading announcements...</p>';
    db.collection("announcements").orderBy("createdAt", "desc").limit(10).onSnapshot(snapshot => {
        announcementList.innerHTML = '';
        if (snapshot.empty) {
            announcementList.innerHTML = '<p class="form-card">No announcements currently posted.</p>';
            return;
        }
        snapshot.forEach(doc => {
            const ann = doc.data();
            const annElement = document.createElement('article');
            annElement.classList.add('announcement-post');
            
            const date = ann.createdAt ? ann.createdAt.toDate().toLocaleString() : 'N/A';

            annElement.innerHTML = `
                <h3>${ann.title}</h3>
                <p class="meta">Posted by <strong>${ann.authorEmail}</strong> on ${date}</p>
                <p>${ann.content}</p>
            `;
            announcementList.appendChild(annElement);
        });
    });
}


// --- MODAL & RESOURCE LOGIC ---

// Pop-up 1: Show Unit Selection Modal
unitsButton.addEventListener('click', () => {
    showModal('unit-selection-modal');
});

let selectedUnit = null;

// Handle Unit Selection
document.querySelectorAll('.unit-select-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        selectedUnit = e.target.dataset.unit;
        hideModal('unit-selection-modal');
        
        // Update Pop-up 2 title
        document.getElementById('resource-modal-title').textContent = `${UNIT_NAMES[selectedUnit]} Resources`;
        
        showModal('resource-selection-modal');
    });
});

// Handle Resource Type Selection (Pop-up 2)
document.querySelectorAll('.resource-select-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const resourceType = e.target.dataset.resourceType;
        hideModal('resource-selection-modal');
        
        // Display the correct unit and resource in the main content area
        displayUnitResource(selectedUnit, resourceType);
    });
});

// Function to display the selected resource content (Placeholder)
function displayUnitResource(unit, resourceType) {
    switchView('resource-view');
    const titleElement = document.getElementById('resource-view-title');
    const contentElement = document.getElementById('resource-content-display');
    
    // Clear previous content
    contentElement.innerHTML = '';
    
    titleElement.textContent = `${UNIT_NAMES[unit]} - ${resourceType.toUpperCase().replace('-', ' ')}`;
    
    // --- Future Logic Placeholder ---
    contentElement.innerHTML = `
        <p>Fetching **${resourceType}** data for **${UNIT_NAMES[unit]}**...</p>
        <div class="form-card">
            <p>This is where the actual Objectives, Past Paper links, or Learning Materials will be displayed based on Firestore data.</p>
            <p>Example: If the admin uploaded a PDF link for a past paper, it would appear here.</p>
        </div>
    `;
    // Future Step: Implement the data retrieval from Firestore based on (unit, resourceType)
}

// --- ADMIN UPLOAD LOGIC ---
const adminUploadForm = document.getElementById('admin-upload-form');

adminUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || user.email !== ADMIN_EMAIL) {
        alert("Authorization denied. You must be the admin to upload resources.");
        return;
    }
    
    const unit = e.target['upload-unit'].value;
    const type = e.target['upload-type'].value;
    const title = e.target['upload-title'].value;
    const data = e.target['upload-data'].value; // Could be link or text

    if (!unit || !type || !title || !data) {
        alert("Please fill in all fields for the upload.");
        return;
    }

    try {
        await db.collection("unit_resources").add({
            unit: unit,
            type: type,
            title: title,
            data: data,
            uploadedBy: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        alert(`Successfully uploaded ${type} for ${UNIT_NAMES[unit]}!`);
        adminUploadForm.reset();
    } catch (error) {
        console.error("Admin upload error:", error);
        alert(`Upload Failed: ${error.message}`);
    }
});

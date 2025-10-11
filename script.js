// **CORRECTED API KEY INCORPORATED**
const API_KEY = "AIzaSyChZG0b4IiGy4DMkBnuvivTW_Q48fJ8uEg"; 

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
const authSection = document.getElementById('auth-section');
const authButton = document.getElementById('auth-button');
const discussionList = document.getElementById('discussion-list');
const newTopicForm = document.getElementById('new-topic-form');
const authError = document.getElementById('auth-error');
const closeAuthModal = document.getElementById('close-auth-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// New elements for the Resource Hub
const sidebarMenu = document.getElementById('sidebar-menu');
const discussionForum = document.getElementById('discussion-forum');
const newTopicSection = document.getElementById('new-topic-section'); // Get the topic section
const resourceDisplayArea = document.getElementById('resource-display-area');
const newAnnouncementForm = document.getElementById('new-announcement-form');
const announcementFeed = document.getElementById('announcement-feed');

// --- HELPER FUNCTION: CONTENT SWITCHING ---

/**
 * Hides all main content sections and shows the requested one.
 * @param {HTMLElement} elementToShow The main section element to make visible.
 */
function switchContent(elementToShow) {
    // Hide all major blocks
    document.querySelectorAll('#main-content .content-block').forEach(block => {
        block.classList.remove('active');
    });

    // Show the requested block
    elementToShow.classList.add('active');
}

// --- CORE FUNCTIONALITY: ANNOUNCEMENTS ---

newAnnouncementForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const announcementText = document.getElementById('announcement-text').value;
    const user = auth.currentUser;

    if (!user) {
        alert("You must be logged in to post an announcement.");
        return;
    }

    try {
        await db.collection("announcements").add({
            text: announcementText,
            authorEmail: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        document.getElementById('announcement-text').value = ''; // Clear form
    } catch (error) {
        console.error("Error posting announcement:", error);
        alert(`Failed to post announcement: ${error.message}`);
    }
});

function fetchAnnouncements() {
    db.collection("announcements").orderBy("createdAt", "desc").limit(10).onSnapshot(snapshot => {
        announcementFeed.innerHTML = '';
        
        if (snapshot.empty) {
            announcementFeed.innerHTML = '<p>No recent announcements.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.createdAt ? data.createdAt.toDate().toLocaleTimeString() : 'N/A';
            const announcementDiv = document.createElement('div');
            announcementDiv.innerHTML = `
                <p><strong>${data.authorEmail.split('@')[0]}</strong> (${date}): ${data.text}</p>
                <hr style="border: none; border-top: 1px dashed #ccc; margin: 5px 0;">
            `;
            announcementFeed.appendChild(announcementDiv);
        });
    }, error => {
        console.error("Error fetching announcements:", error);
        announcementFeed.innerHTML = '<p class="error-message">Could not load announcements.</p>';
    });
}

// --- CORE FUNCTIONALITY: TOPICS (Forum) ---

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
        console.error("Error adding topic: ", error);
        postError.textContent = `Posting failed: ${error.message}`;
    }
});

function fetchTopics() {
    discussionList.innerHTML = '<h3>Loading discussions...</h3>'; 

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
        discussionList.innerHTML = '<p class="error-message">Could not load discussions. ⚠️</p>';
    });
}


// --- CORE FUNCTIONALITY: RESOURCE HUB NAVIGATION & UPLOADS ---

sidebarMenu.addEventListener('click', (e) => {
    // Handle resource links
    if (e.target.tagName === 'A' && e.target.hasAttribute('data-section')) {
        e.preventDefault();
        
        const sectionId = e.target.getAttribute('data-section'); 
        const [unit, resourceType] = sectionId.split('-'); 

        switchContent(resourceDisplayArea);

        resourceDisplayArea.innerHTML = '';

        resourceDisplayArea.innerHTML = `
            <section class="content-block active">
                <h2>${unit.charAt(0).toUpperCase() + unit.slice(1)}: ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1).replace('papers', ' Papers')}</h2>
                <div id="resource-content-list">Loading...</div>
                <div id="upload-form-area"></div>
            </section>
        `;
        
        handleResourceSection(unit, resourceType);

    } 
    // Handle unit toggles (optional, but ensures links don't lead to #)
    else if (e.target.tagName === 'A' && e.target.classList.contains('unit-toggle')) {
        e.preventDefault();
        // You could add logic here to open/close submenus if they were initially hidden.
        // For now, we will simply switch to the discussion forum if a top-level unit link is clicked
        switchContent(discussionForum); 
    }
});


function handleResourceSection(unit, resourceType) {
    const resourceContentList = document.getElementById('resource-content-list');
    const uploadFormArea = document.getElementById('upload-form-area');

    if (resourceType === 'objectives') {
        resourceContentList.innerHTML = `<p>The **Objectives** for **${unit.toUpperCase()}** will be listed here. This content is typically static and would be hardcoded or managed by an admin.</p>`;
        uploadFormArea.innerHTML = '';
        return;
    }
    
    if (resourceType === 'achievements') {
        resourceContentList.innerHTML = `<p>The **Achievements** section for **${unit.toUpperCase()}** will track and display user milestones (e.g., solved past papers, high scores).</p>`;
        uploadFormArea.innerHTML = '';
        return;
    }

    // Display Upload Form (For Learning Materials and Past Papers)
    if (auth.currentUser && (resourceType === 'learning' || resourceType === 'pastpapers')) {
        const typeLabel = resourceType === 'learning' ? 'Learning Link' : 'Past Paper Link';
        uploadFormArea.innerHTML = `
            <h3>Submit a new ${typeLabel}</h3>
            <form id="resource-upload-form">
                <input type="text" id="resource-title" placeholder="Title (e.g., May 2024 Paper or Video on X)" required>
                <input type="url" id="resource-url" placeholder="Paste Link (URL) here" required>
                <button type="submit">Submit Link</button>
            </form>
            <p id="resource-upload-error" class="error-message"></p>
        `;

        document.getElementById('resource-upload-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('resource-title').value;
            const url = document.getElementById('resource-url').value;
            const uploadError = document.getElementById('resource-upload-error');
            uploadError.textContent = '';
            
            try {
                await db.collection("resources").add({
                    unit: unit,
                    type: resourceType,
                    title: title,
                    url: url,
                    authorEmail: auth.currentUser.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                });
                e.target.reset(); 
                // Re-fetch resources to update the list immediately
                fetchResources(unit, resourceType, resourceContentList); 

            } catch (error) {
                console.error("Error submitting resource:", error);
                uploadError.textContent = `Submission failed: ${error.message}`;
            }
        });
    } else if (!auth.currentUser) {
         uploadFormArea.innerHTML = '<p>Log in to submit new resources.</p>';
    }

    fetchResources(unit, resourceType, resourceContentList);
}

function fetchResources(unit, resourceType, containerElement) {
    containerElement.innerHTML = '<p>Fetching links...</p>';

    db.collection("resources")
      .where("unit", "==", unit)
      .where("type", "==", resourceType)
      .orderBy("createdAt", "desc")
      .onSnapshot(snapshot => {
        containerElement.innerHTML = ''; 

        if (snapshot.empty) {
            containerElement.innerHTML = `<p>No ${resourceType} links found for ${unit} yet. Be the first to submit one!</p>`;
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString() : 'N/A';
            const itemElement = document.createElement('div');
            itemElement.innerHTML = `
                <p>
                    <a href="${data.url}" target="_blank" rel="noopener noreferrer">
                        <strong>${data.title}</strong>
                    </a> 
                    <small>| Submitted by ${data.authorEmail.split('@')[0]} on ${date}</small>
                </p>
            `;
            containerElement.appendChild(itemElement);
        });
    }, error => {
        console.error("Error fetching resources:", error);
        containerElement.innerHTML = '<p class="error-message">Failed to load resources.</p>';
    });
}


// --- AUTHENTICATION HANDLERS ---
// Toggle Auth Modal
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


// --- INITIALIZATION ---

// Checks if the user is logged in and updates UI on page load/login/logout
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        authButton.textContent = `Logout (${user.email.split('@')[0]})`;
        authButton.onclick = () => auth.signOut();
        newTopicSection.style.display = 'block'; // Show topic form
    } else {
        // User is signed out
        authButton.textContent = 'Login / Register';
        authButton.onclick = () => authSection.style.display = 'flex';
        newTopicSection.style.display = 'none'; // Hide topic form
    }
});

// Initial calls
fetchTopics();
fetchAnnouncements();
// Ensure the discussion forum is the initial active view when the page loads
switchContent(document.getElementById('discussion-forum')); 
            

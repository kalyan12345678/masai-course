// --- Firebase SDK Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    query,
    onSnapshot,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// --- Firebase Configuration ---

const firebaseConfig = {
    apiKey: "AIzaSyC_NtOHcDXve4Fbz1e689vzVbNtzksIpzg",
    authDomain: "swap-app-cf4da.firebaseapp.com",
    projectId: "swap-app-cf4da",
    storageBucket: "swap-app-cf4da.appspot.com",
    messagingSenderId: "102527007663",
    appId: "1:102527007663:web:a37ba3f3ceedbe5f080d5a",
    measurementId: "G-B1GP34VLQ8"
};

// --- Initialize Firebase Services ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Global Variables ---
let currentUserEmail = "";
const displayedMatchNotifications = new Set(); // Prevent duplicate notifications

// --- Get References to HTML Elements ---
const authEmailInput = document.getElementById("authEmail");
const authPasswordInput = document.getElementById("authPassword");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authMessage = document.getElementById("authMessage");
const authSection = document.getElementById("authSection");
const appContent = document.getElementById("appContent");

// --- Utility Functions ---

/**
 * Displays a temporary message.
 * @param {string} message - The message to display.
 * @param {string} type - 'success' or 'error' for styling.
 */
function displayMessage(message, type = 'success') {
    authMessage.textContent = message;
    authMessage.className = `message ${type}`;
    authMessage.classList.remove('hidden');

    setTimeout(() => {
        authMessage.classList.add('hidden');
        authMessage.textContent = '';
    }, 5000);
}

/**
 * Shows a specific application section and hides others.
 * @param {string} pageId - The ID of the HTML section to display.
 */
window.displayPage = (pageId) => {
    document.querySelectorAll('.app-page-section').forEach(page => {
        page.style.display = 'none';
    });
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.style.display = 'block';
    }
};

// --- User Authentication Functions ---

registerBtn.addEventListener("click", async () => {
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;

    if (!email || !password) {
        displayMessage("Please enter both email and password.", 'error');
        return;
    }
    if (password.length < 6) {
        displayMessage("Password should be at least 6 characters.", 'error');
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        displayMessage("Registration successful! You are now logged in.", 'success');
    } catch (error) {
        console.error("Registration Error:", error);
        let errorMessage = "Registration failed. Please try again.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email is already in use.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Invalid email format.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "Password is too weak (should be at least 6 characters).";
        }
        displayMessage(errorMessage, 'error');
    }
});

loginBtn.addEventListener("click", async () => {
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;

    if (!email || !password) {
        displayMessage("Please enter both email and password.", 'error');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        displayMessage("Logged in successfully!", 'success');
    } catch (error) {
        console.error("Login Error:", error);
        let errorMessage = "Login failed. Please check your credentials.";
        if (error.code === 'auth/invalid-credential') {
            errorMessage = "Invalid email or password.";
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = "Your account has been disabled.";
        }
        displayMessage(errorMessage, 'error');
    }
});

/**
 * Logs the current user out.
 */
window.logout = async () => {
    try {
        await signOut(auth);
        displayMessage("Logged out successfully!", 'success');
    } catch (error) {
        console.error("Logout Error:", error);
        displayMessage("Error logging out. Please try again.", 'error');
    }
};

/**
 * Firebase authentication state observer.
 */
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserEmail = user.email;
        authSection.classList.add("hidden");
        logoutBtn.classList.remove("hidden");
        appContent.classList.remove("hidden");
        authEmailInput.value = "";
        authPasswordInput.value = "";
        authMessage.innerText = "";

        loadUserProfileAndMatches();
        loadMatchNotifications();
        loadUpcomingSessions();
        loadForumPosts();
        loadMessages();
        loadReceivedSessionFeedback();

        displayPage('profileSection');

    } else {
        currentUserEmail = "";
        displayedMatchNotifications.clear();
        authSection.classList.remove("hidden");
        logoutBtn.classList.add("hidden");
        appContent.classList.add("hidden");

        document.getElementById("profileForm").reset();
        document.getElementById("matchNotifications").innerHTML = "<p>Waiting for relevant skill matches...</p>";
        document.getElementById("matchResults").innerHTML = "";
        document.getElementById("upcomingSessions").innerHTML = "";
        document.getElementById("forumPosts").innerHTML = "";
        document.getElementById("chatMessages").innerHTML = "";
        document.getElementById("receivedFeedback").innerHTML = "";
        authMessage.innerText = "Please log in or register.";
    }
});

// --- User Profile Management Functions ---

document.getElementById("profileForm").addEventListener("submit", submitProfile);

/**
 * Handles profile form submission, saving user data to Firestore.
 */
async function submitProfile(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const teach = document.getElementById("teach").value.trim().toLowerCase();
    const learn = document.getElementById("learn").value.trim().toLowerCase();
    const interests = document.getElementById("interests").value.trim().toLowerCase().split(',').map(i => i.trim()).filter(i => i !== '');
    const teachSkillLevel = document.getElementById("teachSkillLevel").value;
    const learnSkillLevel = document.getElementById("learnSkillLevel").value;

    if (!currentUserEmail) {
        displayMessage("Please log in to create or update your profile.", 'error');
        return;
    }

    try {
        await setDoc(doc(db, "users", currentUserEmail), {
            name: name,
            teach: teach,
            learn: learn,
            interests: interests,
            teachSkillLevel: teachSkillLevel,
            learnSkillLevel: learnSkillLevel,
            email: currentUserEmail,
        }, { merge: true });

        displayMessage("Profile updated successfully!", 'success');

        document.getElementById("name").value = "";
        document.getElementById("teach").value = "";
        document.getElementById("learn").value = "";
        document.getElementById("interests").value = "";
        document.getElementById("teachSkillLevel").value = "Beginner";
        document.getElementById("learnSkillLevel").value = "Beginner";

        const currentUserProfile = (await getDoc(doc(db, "users", currentUserEmail))).data();
        displayMatches(currentUserProfile.teach, currentUserProfile.learn, currentUserProfile.interests);

    } catch (error) {
        console.error("Error submitting profile:", error);
        displayMessage("Error submitting profile. Please try again.", 'error');
    }
}

/**
 * Loads and populates the user's profile and displays matches.
 */
async function loadUserProfileAndMatches() {
    if (!currentUserEmail) return;

    try {
        const userDocRef = doc(db, "users", currentUserEmail);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            document.getElementById("name").value = userData.name || "";
            document.getElementById("teach").value = userData.teach || "";
            document.getElementById("learn").value = userData.learn || "";
            document.getElementById("interests").value = (userData.interests || []).join(', ');
            document.getElementById("teachSkillLevel").value = userData.teachSkillLevel || "Beginner";
            document.getElementById("learnSkillLevel").value = userData.learnSkillLevel || "Beginner";

            displayMatches(userData.teach, userData.learn, userData.interests);

        } else {
            console.log("No user profile found, user can create one.");
            document.getElementById("profileForm").reset();
            document.getElementById("matchResults").innerHTML = "";
            document.getElementById("teachSkillLevel").value = "Beginner";
            document.getElementById("learnSkillLevel").value = "Beginner";
        }
    } catch (error) {
        console.error("Error loading user profile:", error);
    }
}

/**
 * Finds and displays potential skill matches based on reciprocal interests.
 * @param {string} currentUserTeachSkill - User's teaching skill.
 * @param {string} currentUserLearnSkill - User's learning skill.
 * @param {Array<string>} currentUserInterests - User's interests.
 */
async function displayMatches(currentUserTeachSkill, currentUserLearnSkill, currentUserInterests) {
    const matchDiv = document.getElementById("matchResults");
    matchDiv.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "users"));
    const matchesFound = [];

    querySnapshot.forEach(docSnap => {
        const otherUser = docSnap.data();
        if (docSnap.id === currentUserEmail) {
            return;
        }

        const otherUserTeaches = otherUser.teach || '';
        const otherUserLearns = otherUser.learn || '';
        const otherUserInterests = otherUser.interests || [];

        let matchScore = 0;
        let matchReasons = [];

        // Skill Exchange Match
        if (currentUserLearnSkill && otherUserTeaches === currentUserLearnSkill) {
            matchScore += 5;
            matchReasons.push(`Can teach you ${otherUserTeaches}`);
        }
        if (currentUserTeachSkill && otherUserLearns === currentUserTeachSkill) {
            matchScore += 5;
            matchReasons.push(`Wants to learn your skill ${currentUserTeachSkill}`);
        }

        // Interest-based Matching
        const commonInterests = currentUserInterests.filter(interest => otherUserInterests.includes(interest));
        if (commonInterests.length > 0) {
            matchScore += commonInterests.length * 1;
            matchReasons.push(`Shares interests: ${commonInterests.join(', ')}`);
        }

        if (matchScore > 0) {
            matchesFound.push({ user: otherUser, score: matchScore, reasons: matchReasons });
        }
    });

    if (matchesFound.length > 0) {
        matchesFound.sort((a, b) => b.score - a.score);

        matchesFound.forEach(match => {
            const matchElement = document.createElement("div");
            matchElement.className = "match";
            matchElement.innerHTML = `
                <h4>${match.user.name || match.user.email}</h4>
                <p>Teaches: ${match.user.teach || 'N/A'}</p>
                <p>Wants to Learn: ${match.user.learn || 'N/A'}</p>
                <p>Skill Level (Teaches): ${match.user.teachSkillLevel || 'N/A'}</p>
                <p>Interests: ${(match.user.interests || []).join(', ') || 'N/A'}</p>
                <p>Match Score: ${match.score}</p>
                <p>Reasons: ${match.reasons.join('; ')}</p>
                <button onclick="proposeSession('${match.user.email}', '${match.user.teach}')">Propose Session</button>
            `;
            matchDiv.appendChild(matchElement);
        });
    } else {
        matchDiv.innerHTML = "<p>No matches found yet. Update your profile for better matches!</p>";
    }
}

// --- Real-time Match Notifications ---


async function loadMatchNotifications() {
    if (!currentUserEmail) return;

    const notificationsDiv = document.getElementById("matchNotifications");

    const currentUserProfile = (await getDoc(doc(db, "users", currentUserEmail))).data();
    if (!currentUserProfile) {
        notificationsDiv.innerHTML = "<p>Please complete your profile to see match notifications.</p>";
        return;
    }

    const usersCollectionRef = collection(db, "users");
    onSnapshot(usersCollectionRef, (snapshot) => {
        const newPotentialMatches = [];

        snapshot.forEach(docSnap => {
            const otherUser = docSnap.data();
            if (docSnap.id === currentUserEmail) {
                return;
            }

            const otherUserTeaches = otherUser.teach || '';
            const otherUserLearns = otherUser.learn || '';

            let notificationMessage = "";

            if (currentUserProfile.learn && otherUserTeaches === currentUserProfile.learn) {
                if (!displayedMatchNotifications.has(docSnap.id + otherUserTeaches)) {
                    notificationMessage += `${otherUser.name || otherUser.email} can teach "${otherUserTeaches}". `;
                    displayedMatchNotifications.add(docSnap.id + otherUserTeaches);
                }
            }
            if (currentUserProfile.teach && otherUserLearns === currentUserProfile.teach) {
                if (!displayedMatchNotifications.has(docSnap.id + otherUserLearns)) {
                    notificationMessage += `${otherUser.name || otherUser.email} wants to learn "${otherUserLearns}". `;
                    displayedMatchNotifications.add(docSnap.id + otherUserLearns);
                }
            }

            if (notificationMessage) {
                newPotentialMatches.push({
                    id: docSnap.id,
                    message: notificationMessage.trim(),
                    email: otherUser.email
                });
            }
        });

        if (newPotentialMatches.length > 0) {
            if (notificationsDiv.innerHTML === "<p>Waiting for relevant skill matches...</p>") {
                notificationsDiv.innerHTML = "";
            }
            newPotentialMatches.forEach(match => {
                const notificationElement = document.createElement("div");
                notificationElement.className = "notification-item";
                notificationElement.innerHTML = `
                    <p><strong>New Match!</strong> ${match.message}</p>
                    <button onclick="displayPage('matchesSection')">View Matches</button>
                    <button onclick="proposeSession('${match.email}', '${currentUserProfile.teach}')">Propose Session with ${match.email.split('@')[0]}</button>
                `;
                notificationsDiv.prepend(notificationElement);
            });
        } else if (notificationsDiv.children.length === 0) {
            notificationsDiv.innerHTML = "<p>Waiting for relevant skill matches...</p>";
        }
    }, (error) => {
        console.error("Error listening to match notifications:", error);
        notificationsDiv.innerHTML = "<p>Error loading match notifications.</p>";
    });
}


// --- Exchange Sessions Functions ---

/**
 * Populates session scheduling form and navigates to sessions section.
 * @param {string} partnerEmail - Partner's email.
 * @param {string} proposedSkill - Suggested skill.
 */
window.proposeSession = (partnerEmail, proposedSkill) => {
    document.getElementById("sessionPartnerEmail").value = partnerEmail;
    document.getElementById("sessionSkill").value = proposedSkill;
    displayPage('sessionsSection');
    displayMessage(`Ready to propose a session with ${partnerEmail} for ${proposedSkill}!`, 'success');
};

/**
 * Schedules a new exchange session in Firestore.
 */
async function scheduleSession() {
    const partnerEmail = document.getElementById("sessionPartnerEmail").value.trim();
    const sessionSkill = document.getElementById("sessionSkill").value.trim();
    const sessionDateTime = document.getElementById("sessionDateTime").value;
    const sessionDuration = document.getElementById("sessionDuration").value;
    const sessionType = document.getElementById("sessionType").value;

    if (!currentUserEmail) {
        displayMessage("Please log in to schedule a session.", 'error');
        return;
    }
    if (!partnerEmail || !sessionSkill || !sessionDateTime) {
        displayMessage("Please fill in all session details.", 'error');
        return;
    }

    try {
        await addDoc(collection(db, "sessions"), {
            initiator: currentUserEmail,
            partner: partnerEmail,
            skill: sessionSkill,
            dateTime: new Date(sessionDateTime),
            duration: parseInt(sessionDuration),
            type: sessionType,
            status: "pending",
            timestamp: serverTimestamp(),
        });

        displayMessage("Session proposed successfully! Waiting for partner's confirmation.", 'success');
        document.getElementById("sessionPartnerEmail").value = "";
        document.getElementById("sessionSkill").value = "";
        document.getElementById("sessionDateTime").value = "";
        document.getElementById("sessionDuration").value = "30";
        document.getElementById("sessionType").value = "virtual";
    } catch (error) {
        console.error("Error scheduling session:", error);
        displayMessage("Error scheduling session. Please try again.", 'error');
    }
}

/**
 * Loads and displays upcoming exchange sessions in real-time.
 */
async function loadUpcomingSessions() {
    if (!currentUserEmail) return;

    const upcomingSessionsDiv = document.getElementById("upcomingSessions");
    upcomingSessionsDiv.innerHTML = "";

    const sessionsQuery = query(
        collection(db, "sessions"),
        where("initiator", "==", currentUserEmail),
        orderBy("dateTime", "asc")
    );

    onSnapshot(sessionsQuery, (snapshot) => {
        if (snapshot.empty) {
            upcomingSessionsDiv.innerHTML = "<p>No upcoming sessions.</p>";
            return;
        }

        upcomingSessionsDiv.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const sessionTime = data.dateTime ? new Date(data.dateTime.toDate()).toLocaleString() : 'N/A';
            const sessionElement = document.createElement("div");
            sessionElement.innerHTML = `
                <h4>Skill: ${data.skill} with ${data.partner}</h4>
                <p>When: ${sessionTime}</p>
                <p>Duration: ${data.duration} mins</p>
                <p>Type: ${data.type}</p>
                <p>Status: ${data.status}</p>
            `;
            upcomingSessionsDiv.appendChild(sessionElement);
        });
    }, (error) => {
        console.error("Error loading upcoming sessions:", error);
        upcomingSessionsDiv.innerHTML = "<p>Error loading sessions.</p>";
    });
}

// --- Community Forum Functions ---

async function submitForumPost() {
    const title = document.getElementById("forumTitle").value.trim();
    const content = document.getElementById("forumContent").value.trim();

    if (!currentUserEmail) {
        displayMessage("Please log in to post to the forum.", 'error');
        return;
    }
    if (!title || !content) {
        displayMessage("Please enter both title and content for your post.", 'error');
        return;
    }

    try {
        await addDoc(collection(db, "forumPosts"), {
            author: currentUserEmail,
            title: title,
            content: content,
            timestamp: serverTimestamp(),
        });
        displayMessage("Post submitted successfully!", 'success');
        document.getElementById("forumTitle").value = "";
        document.getElementById("forumContent").value = "";
    } catch (error) {
        console.error("Error submitting forum post:", error);
        displayMessage("Error submitting forum post. Please try again.", 'error');
    }
}

/**
 * Loads and displays forum posts in real-time.
 */
async function loadForumPosts() {
    const forumPostsDiv = document.getElementById("forumPosts");
    forumPostsDiv.innerHTML = "";

    const forumQuery = query(collection(db, "forumPosts"), orderBy("timestamp", "desc"));

    onSnapshot(forumQuery, (snapshot) => {
        if (snapshot.empty) {
            forumPostsDiv.innerHTML = "<p>No forum posts yet. Be the first to post!</p>";
            return;
        }

        forumPostsDiv.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const postTime = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : 'Loading...';
            const postElement = document.createElement("div");
            postElement.innerHTML = `
                <h4>${data.title}</h4>
                <p>${data.content}</p>
                <small>By ${data.author.split('@')[0]} on ${postTime}</small>
            `;
            forumPostsDiv.appendChild(postElement);
        });
    }, (error) => {
        console.error("Error listening to forum posts:", error);
        forumPostsDiv.innerHTML = "<p>Error loading forum posts.</p>";
    });
}

// --- In-App Messaging Functions ---


async function sendMessage() {
    const messageContent = document.getElementById("chatBox").value.trim();

    if (!currentUserEmail) {
        displayMessage("Please log in to send messages.", 'error');
        return;
    }
    if (!messageContent) return;

    try {
        await addDoc(collection(db, "messages"), {
            sender: currentUserEmail,
            message: messageContent,
            timestamp: serverTimestamp(),
        });
        document.getElementById("chatBox").value = "";
    } catch (error) {
        console.error("Error sending message:", error);
        displayMessage("Error sending message. Please try again.", 'error');
    }
}

/**
 * Loads and displays all messages in real-time.
 */
async function loadMessages() {
    const chatMessagesDiv = document.getElementById("chatMessages");
    chatMessagesDiv.innerHTML = "";

    const messagesQuery = query(collection(db, "messages"), orderBy("timestamp"));

    onSnapshot(messagesQuery, (snapshot) => {
        if (snapshot.empty) {
            chatMessagesDiv.innerHTML = "<p>No messages yet.</p>";
            return;
        }

        chatMessagesDiv.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const messageTime = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : 'Loading...';
            const messageElement = document.createElement("p");
            messageElement.textContent = `${data.sender.split('@')[0]}: ${data.message} (${messageTime})`;
            chatMessagesDiv.appendChild(messageElement);
        });
        chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; 
    }, (error) => {
        console.error("Error listening to messages:", error);
        chatMessagesDiv.innerHTML = "<p>Error loading messages.</p>";
    });
}

// --- Feedback and Rating System Functions ---


async function submitSessionFeedback() {
    const targetEmail = document.getElementById("feedbackTargetEmail").value.trim();
    const rating = document.getElementById("rating").value;
    const feedbackText = document.getElementById("feedbackText").value.trim();

    if (!currentUserEmail) {
        displayMessage("Please log in to submit feedback.", 'error');
        return;
    }
    if (!targetEmail || !rating) {
        displayMessage("Please enter partner's email and a rating.", 'error');
        return;
    }

    try {
        await addDoc(collection(db, "feedback"), {
            reviewer: currentUserEmail,
            target: targetEmail,
            rating: parseInt(rating),
            feedbackText: feedbackText,
            timestamp: serverTimestamp(),
        });
        displayMessage("Feedback submitted successfully!", 'success');
        document.getElementById("feedbackTargetEmail").value = "";
        document.getElementById("rating").value = "5";
        document.getElementById("feedbackText").value = "";
    } catch (error) {
        console.error("Error submitting feedback:", error);
        displayMessage("Error submitting feedback. Please try again.", 'error');
    }
}

/**
 * Loads and displays feedback received by the current user in real-time.
 */
async function loadReceivedSessionFeedback() {
    if (!currentUserEmail) return;

    const receivedFeedbackDiv = document.getElementById("receivedFeedback");
    receivedFeedbackDiv.innerHTML = "";

    const feedbackQuery = query(
        collection(db, "feedback"),
        where("target", "==", currentUserEmail),
        orderBy("timestamp", "desc")
    );

    onSnapshot(feedbackQuery, (snapshot) => {
        if (snapshot.empty) {
            receivedFeedbackDiv.innerHTML = "<p>No feedback received yet.</p>";
            return;
        }

        receivedFeedbackDiv.innerHTML = "";
        snapshot.forEach((doc) => {
            const data = doc.data();
            const feedbackTime = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : 'Loading...';
            const feedbackElement = document.createElement("div");
            feedbackElement.innerHTML = `
                <h4>Rating: ${data.rating} Stars from ${data.reviewer.split('@')[0]}</h4>
                <p>"${data.feedbackText || 'No comments provided.'}"</p>
                <small>On: ${feedbackTime}</small>
            `;
            receivedFeedbackDiv.appendChild(feedbackElement);
        });
    }, (error) => {
        console.error("Error listening to received feedback:", error);
        receivedFeedbackDiv.innerHTML = "<p>Error loading feedback.</p>";
    });
}

// --- Dark Mode Toggle Function ---


window.toggleDarkMode = () => {
    document.body.classList.toggle("dark-mode");
};
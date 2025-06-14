# SkillSwap App

A simple web application designed to help users connect and exchange skills. Users can create profiles, find matches based on what they want to learn and teach, schedule sessions, participate in a community forum, send messages, and provide feedback.

## Features

* **User Authentication:** Register and log in securely.
* **User Profiles:** Create and update your profile, specifying skills you can teach, skills you want to learn, and your interests.
* **Skill Matching:** Discover other users who are a good match for skill exchange based on reciprocal interests.
* **Session Scheduling:** Propose and manage skill exchange sessions.
* **Community Forum:** Engage with other users by posting and viewing forum discussions.
* **In-App Messaging:** Communicate directly with other users.
* **Feedback System:** Provide and receive ratings and feedback for sessions.
* **Dark Mode:** Toggle between light and dark themes for improved user experience.

## Technologies Used

* **HTML5:** For the structure and content of the web pages.
* **CSS3:** For styling the application and creating a responsive design.
* **JavaScript:** For dynamic client-side interactivity and application logic.
* **Firebase:**
    * **Firebase Authentication:** For user registration and login.
    * **Cloud Firestore:** A NoSQL cloud database for storing user profiles, session details, forum posts, messages, and feedback.

## Setup and Installation

To get a local copy of this project up and running, follow these steps:

1.  **Clone the Repository (if applicable):**
    ```bash
    git clone <your-repository-url>
    cd skillswap-app
    ```
    If you don't have a repository, simply create a folder and place the `index.html`, `style.css`, and `script.js` files inside it.

2.  **Firebase Project Setup:**
    * Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    * Add a web app to your Firebase project.
    * During the setup, you will be given your Firebase configuration (an object with `apiKey`, `authDomain`, `projectId`, etc.).
    * **Important:** Open `script.js` and replace the placeholder `firebaseConfig` object with your actual Firebase configuration. It will look something like this:

        ```javascript
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_AUTH_DOMAIN",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_STORAGE_BUCKET",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID",
            measurementId: "YOUR_MEASUREMENT_ID"
        };
        ```
    * **Enable Services:** In your Firebase project, enable:
        * **Authentication:** Go to "Build" -> "Authentication" -> "Get started" and enable the "Email/Password" sign-in method.
        * **Firestore Database:** Go to "Build" -> "Firestore Database" -> "Create database". Start in test mode for quick setup (you can set up security rules later).

3.  **Run the Application:**
    * Simply open the `index.html` file in your web browser. You can do this by double-clicking it.
    * Alternatively, you can use a local web server (e.g., Live Server VS Code extension) for better development experience.

## Usage

1.  **Register/Login:** Upon opening the app, you will see the authentication section. Register a new account or log in with an existing one.
2.  **Complete Your Profile:** After logging in, navigate to the "Profile" section. Fill in your name, skills you teach, skills you want to learn, and interests. This information is crucial for finding matches.
3.  **Explore Matches:** Go to the "Matches" section to see potential skill exchange partners.
4.  **Propose Sessions:** From the "Matches" section or directly from "Sessions," you can propose new skill exchange sessions.
5.  **Participate in Forum:** Visit the "Forum" to read and create posts.
6.  **Send Messages:** Use the "Messages" section for in-app chat.
7.  **Give Feedback:** Provide feedback and ratings for sessions you've had in the "Feedback" section.
8.  **Toggle Dark Mode:** Use the "Toggle Dark Mode" button in the navigation bar to switch themes.

## File Structure

* `index.html`: The main HTML file that provides the structure and links to CSS and JavaScript.
* `style.css`: Contains all the CSS rules for styling the application.
* `script.js`: Contains all the JavaScript logic, including Firebase interactions, UI manipulation, and application features.

## Credits

* **Firebase:** For providing a robust backend as a service.
* **Background Image:** Sourced from Dribbble.

## License

This project is open-source and available under the MIT License.
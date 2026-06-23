// Your web app's Firebase configuration (Updated with new App ID)
const firebaseConfig = {
  apiKey: "AIzaSyAxeqS3oKQlu7gtnuRzcDaA9lH43m5qYwE",
  authDomain: "smart-spend-ab121.firebaseapp.com",
  databaseURL: "https://smart-spend-ab121-default-rtdb.firebaseio.com",
  projectId: "smart-spend-ab121",
  storageBucket: "smart-spend-ab121.firebasestorage.app",
  messagingSenderId: "5129010252",
  appId: "1:5129010252:web:4bd6a434be0f0cd1c808e9",
  measurementId: "G-P2WBSL4F39"
};

// Initialize Firebase once
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global references
var auth = firebase.auth();
var db = firebase.firestore();
var analytics = firebase.analytics ? firebase.analytics() : null;

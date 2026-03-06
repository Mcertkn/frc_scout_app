const firebaseConfig = {
  apiKey: "AIzaSyC5S11THBK-XMvhRoFLyYo2DywghUbPjVs",
  authDomain: "frc-scout-2026.firebaseapp.com",
  projectId: "frc-scout-2026",
  storageBucket: "frc-scout-2026.firebasestorage.app",
  messagingSenderId: "57797549604",
  appId: "1:57797549604:web:02ce4a5323ff55cbcd82b1"
};

firebase.initializeApp(firebaseConfig);

window.db = firebase.firestore();
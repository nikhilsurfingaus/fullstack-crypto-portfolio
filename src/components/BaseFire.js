import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyA3q7skdo0AMlfNZQH2qQteFuReaYMG73A",
    authDomain: "crypto-portfolio-d0306.firebaseapp.com",
    projectId: "crypto-portfolio-d0306",
    storageBucket: "crypto-portfolio-d0306.appspot.com",
    messagingSenderId: "512753591531",
    appId: "1:512753591531:web:0ee30dc233649250cecaae",
    measurementId: "G-X4QVJMFTH5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const provider = new GoogleAuthProvider();


//DB
const db = getFirestore(app)

export { auth, provider, db }
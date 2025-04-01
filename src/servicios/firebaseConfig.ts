import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBkphGA1o85P0x8jVbLDEfZMRKZ9lo36MY",
  authDomain: "recibosprolisto.firebaseapp.com",
  projectId: "recibosprolisto",
  storageBucket: "recibosprolisto.appspot.com",
  messagingSenderId: "39760828400",
  appId: "1:39760828400:web:e46016f4b543b7b91d6f35",
  measurementId: "G-TET1KMXC9J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };

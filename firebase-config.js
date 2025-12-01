// ========================================
// CONFIGURAÇÃO FIREBASE - AYA JOIAS
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyAeiTYTfS4a0Wh4yOrXET-2dAbcT8ZLbj4",
    authDomain: "ayajoias-455fe.firebaseapp.com",
    projectId: "ayajoias-455fe",
    storageBucket: "ayajoias-455fe.firebasestorage.app",
    messagingSenderId: "793600668160",
    appId: "1:793600668160:web:945db49cccd4cc2ff99ee5",
    measurementId: "G-RYRMN5W7P6"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências globais
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

console.log('🔥 Firebase AYA JOIAS inicializado!');
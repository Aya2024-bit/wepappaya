// Config Supabase (ajuste com suas credenciais)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient('SUA_SUPABASE_URL', 'SUA_SUPABASE_KEY');

// Detecta se já está instalado ou já passou pelo onboarding
window.addEventListener('load', async () => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    const onboardingDone = localStorage.getItem('onboarding_done');

    if (onboardingDone === 'true') {
        window.location.href = 'index.html'; // Redireciona para home
        return;
    }

    if (isInstalled) {
        showScreen('notification-screen'); // Pula para notificações se já instalado
    }
});

// Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('install-btn').style.display = 'block';
});

document.getElementById('install-btn').addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            showScreen('notification-screen');
        }
        deferredPrompt = null;
    }
});

document.getElementById('skip-install').addEventListener('click', () => {
    showScreen('notification-screen');
});

// Cadastro de Notificações
document.getElementById('subscribe-btn').addEventListener('click', async () => {
    const name = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value.trim();

    if (!name || !email) {
        alert('Preencha todos os campos');
        return;
    }

    try {
        // Solicita permissão para notificações
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            // Registra o service worker e obtém o subscription
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: 'SUA_VAPID_PUBLIC_KEY' // Gerar no Supabase Edge Functions
            });

            // Salva no Supabase
            const { error } = await supabase.from('push_subscribers').insert({
                name: name,
                email: email,
                subscription: JSON.stringify(subscription),
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            alert('Cadastro realizado! Você receberá nossas promoções.');
        } else {
            alert('Notificações bloqueadas. Ative nas configurações do navegador.');
        }
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        alert('Erro ao cadastrar. Tente novamente.');
    }

    finishOnboarding();
});

document.getElementById('skip-notifications').addEventListener('click', finishOnboarding);

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function finishOnboarding() {
    localStorage.setItem('onboarding_done', 'true');
    window.location.href = 'index.html';
}
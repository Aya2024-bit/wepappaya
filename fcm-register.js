// js/fcm-register.js

console.log('🔔 FCM Register carregado');

// Inicializa Firebase Messaging
const messaging = firebase.messaging();

// ===================================
// REGISTRAR TOKEN FCM COM DADOS DO USUÁRIO
// ===================================
async function registerFCM(nome = null, email = null) {
    try {
        console.log('🔔 Iniciando registro FCM...');
        
        // Aguarda o service worker estar pronto
        const registration = await navigator.serviceWorker.ready;
        console.log('🔔 Service Worker pronto:', registration.scope);
        
        const permission = await Notification.requestPermission();
        console.log('🔔 Permissão:', permission);
        
        if (permission === 'granted') {
            console.log('✅ Permissão concedida');

            const token = await messaging.getToken({
                vapidKey: 'BPuGcCGe65vOpZznu6p3RW4ohv-zDA4GotdheBinbbzK5J6aq9DLHAfjLR-wdReFUkrMI81L94_THGUPrRNrbrk',
                serviceWorkerRegistration: registration
            });

            console.log('📱 Token FCM obtido:', token);

            // Usar dados do usuário logado OU dados informados manualmente
            const user = firebase.auth().currentUser;
            const finalNome = nome || (user ? user.displayName : null) || 'Visitante Anônimo';
            const finalEmail = email || (user ? user.email : null) || 'não informado';
            
            // Salvar token com informações do usuário
            await db.collection('fcm_tokens').doc(token).set({
                token: token,
                userId: user ? user.uid : null,
                nome: finalNome,
                email: finalEmail,
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                last_seen: firebase.firestore.FieldValue.serverTimestamp(),
                device_info: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language,
                    screenResolution: `${screen.width}x${screen.height}`
                }
            }, { merge: true });

            console.log('✅ Token salvo no Firestore');
            console.log(`👤 Nome: ${finalNome}`);
            console.log(`📧 Email: ${finalEmail}`);
            
            // Salvar no localStorage para não pedir novamente
            localStorage.setItem('fcm_registered', 'true');
            localStorage.setItem('user_name', finalNome);
            localStorage.setItem('user_email', finalEmail);
            
            return token;

        } else {
            console.log('❌ Permissão negada');
        }

    } catch (error) {
        console.error('❌ Erro ao registrar FCM:', error);
    }
}

// ===================================
// RECEBER NOTIFICAÇÕES EM FOREGROUND
// ===================================
// ===================================
// RECEBER NOTIFICAÇÕES EM FOREGROUND
// ===================================
messaging.onMessage((payload) => {
    console.log('📩 Notificação recebida (app aberto):', payload);

    // Tocar som de notificação
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZTA0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUhELTKXh8bllHAU2jdXzzn0vBSd6yfDajzsJGGK37OihUhELTKXh8bllHAU2jdXzzn0vBSd6yfDajzsKF2O57OajUREMSqPf8rplHAU1jNXzz4AvBSh5yPDajjsKGGK27OijURELTKTh8bllHAU2jNXzz38vBSh6yfDajTsKGGK37OiiUhELTKTh8blmHAU2jdXzzn0vBSd6yfDajjsKGGO47OmiURENTKXg8LdlHAU2jdTzz38vBSh5yfDajjsKGGK37OijUhEMTKTh8bdlHAU2jdTzz38vBSh6yfDbjjsKGGK37OmiUREMTKTh8blmHAU2jdXzz34vBSd6yfDajjsKGGK37OijUREMTKXh8blmHAU2jdXzz34vBSh5yfDajjsKGGO47OmiURENTKTh8LdlHAU2jdTzz4AvBSh5yPDajjsKGGK27OikUREMTKTh8bdlHAU1jNTzz4AvBSh6yfDbjjsKF2K37OmjUhEMTKPh8bdlHAU2jdTzz38vBSh6yfDajjsKGGK37OmjURENTKTh8LdmHAU2jdTzz38vBSh5yfDajTsKGGK37OmjUREMTKTh8blmHAU2jdXzzn0vBSh6yfDajjsKGGK37OmiUREMTKXh8blmHAU2jdXzzn0vBSh5yfDajjsKGGO57OmiUhEMTKXg8LZlHAU2jdTzz38vBSh5yfDajjsKGGK37OijUhEMTKTh8bllHAU2jdXzz34vBSh5yfDajjsKGGK37OijURENTKXh8blmHAU2jdXzz34vBSh5yfDajjsKGGK37OijURENTKXh8blmHAU2jdXzz34vBSh5yfDajTsKGGO57OijUhEMTKXh8LdlHAU2jdTzz38vBSh5yfDajjsKGGK37OmjURENTKXh8blmHAU2jdXzz34vBSh5yfDajjsKGGK37OijUhEMTKTh8bllHAU2jdTzz38vBSh5yfDajjsKGGK37OijUhEMTKTh8bllHAU2jdXzz38vBSh5yfDajjsK');
        audio.play().catch(e => console.log('🔇 Erro ao tocar som:', e));
    } catch (e) {
        console.log('🔇 Som não disponível');
    }

    if (Notification.permission === 'granted') {
        // Criar notificação com fallback de ícones
        const iconPath = payload.notification?.icon || 
                        './icon-192x192.png' || 
                        './icon-192x192.png' ||
                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"><rect width="192" height="192" fill="%23A7ED00"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="100" fill="white">🔔</text></svg>';

        const notification = new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: iconPath,
            badge: iconPath,
            tag: 'aya-promocao',
            requireInteraction: true, // Mantém visível até clicar
            vibrate: [200, 100, 200, 100, 200], // Vibração (mobile)
            silent: false, // Som habilitado
            data: { url: payload.data?.url || './produtos.html' }
        });

        console.log('✅ Notificação criada:', notification);

        // Abrir link ao clicar
        notification.onclick = function(event) {
            event.preventDefault();
            console.log('🖱️ Clicou na notificação');
            window.focus();
            window.open(payload.data?.url || './produtos.html', '_blank');
            notification.close();
        };

        // Log quando fechar
        notification.onclose = function() {
            console.log('❌ Notificação fechada');
        };

        // Log de erro
        notification.onerror = function(err) {
            console.error('❌ Erro na notificação:', err);
        };
    } else {
        console.warn('⚠️ Permissão de notificação não concedida');
    }
});

// ===================================
// AUTO-REGISTRAR APÓS INSTALAÇÃO
// ===================================
window.addEventListener('appinstalled', () => {
    console.log('✅ App instalado! Registrando FCM...');
    setTimeout(() => {
        const alreadyRegistered = localStorage.getItem('fcm_registered');
        if (!alreadyRegistered) {
            pedirDadosUsuario();
        }
    }, 2000);
});

// ===================================
// DETECTAR MODO STANDALONE
// ===================================
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('📱 App em modo standalone');
    const alreadyRegistered = localStorage.getItem('fcm_registered');
    if (!alreadyRegistered) {
        setTimeout(() => pedirDadosUsuario(), 3000);
    } else {
        console.log('✅ FCM já registrado anteriormente');
    }
}

// ===================================
// PEDIR DADOS DO USUÁRIO
// ===================================
function pedirDadosUsuario() {
    // Criar modal personalizado
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            padding: 30px;
            border-radius: 20px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease;
        ">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 50px; margin-bottom: 10px;">🔔</div>
                <h2 style="color: #333; margin-bottom: 10px;">Receber Promoções?</h2>
                <p style="color: #666; font-size: 14px;">
                    Receba notificações das melhores ofertas da Aya Acessórios!
                </p>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 600; font-size: 14px;">
                    📝 Seu Nome *
                </label>
                <input 
                    type="text" 
                    id="userName" 
                    placeholder="Ex: Maria Silva"
                    style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e0e0e0;
                        border-radius: 10px;
                        font-size: 16px;
                        box-sizing: border-box;
                    "
                    required
                >
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 600; font-size: 14px;">
                    📧 Seu Email *
                </label>
                <input 
                    type="email" 
                    id="userEmail" 
                    placeholder="Ex: maria@email.com"
                    style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e0e0e0;
                        border-radius: 10px;
                        font-size: 16px;
                        box-sizing: border-box;
                    "
                    required
                >
            </div>

            <button id="btnAceitar" style="
                width: 100%;
                padding: 15px;
                background: linear-gradient(135deg, #A7ED00 0%, #7BC500 100%);
                color: #000;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                margin-bottom: 10px;
            ">
                ✅ Aceitar e Receber Notificações
            </button>

            <button id="btnRecusar" style="
                width: 100%;
                padding: 15px;
                background: #f0f0f0;
                color: #666;
                border: none;
                border-radius: 10px;
                font-size: 14px;
                cursor: pointer;
            ">
                ❌ Não, obrigado
            </button>

            <p style="
                text-align: center;
                color: #999;
                font-size: 11px;
                margin-top: 15px;
            ">
                🔒 Seus dados são privados e seguros
            </p>
        </div>
    `;

    // Adicionar animações CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(modal);

    // Botão Aceitar
    document.getElementById('btnAceitar').addEventListener('click', () => {
        const nome = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();

        if (!nome || !email) {
            alert('⚠️ Por favor, preencha nome e email.');
            return;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('⚠️ Por favor, digite um email válido.');
            return;
        }

        modal.remove();
        console.log(`👤 Nome informado: ${nome}`);
        console.log(`📧 Email informado: ${email}`);
        registerFCM(nome, email);
    });

    // Botão Recusar
    document.getElementById('btnRecusar').addEventListener('click', () => {
        modal.remove();
        console.log('❌ Usuário recusou notificações');
        localStorage.setItem('fcm_refused', 'true');
    });
}

// ===================================
// PEDIR PERMISSÃO APÓS 5 SEGUNDOS
// ===================================
window.addEventListener('load', () => {
    console.log('🔔 Página carregada, aguardando 5s...');
    setTimeout(() => {
        const permission = Notification.permission;
        const alreadyRegistered = localStorage.getItem('fcm_registered');
        const refused = localStorage.getItem('fcm_refused');

        console.log('🔔 Status de permissão:', permission);

        // Se já recusou antes, não perguntar novamente
        if (refused === 'true') {
            console.log('❌ Usuário já recusou anteriormente');
            return;
        }

        if (permission === 'default' && !alreadyRegistered) {
            pedirDadosUsuario();
        } else if (permission === 'granted' && !alreadyRegistered) {
            console.log('🔔 Permissão já concedida, pedindo dados...');
            pedirDadosUsuario();
        }
    }, 5000);
});

// ===================================
// ESCUTAR MUDANÇAS DE AUTENTICAÇÃO
// ===================================
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log('👤 Usuário autenticado:', user.email);
        const alreadyRegistered = localStorage.getItem('fcm_registered');
        if (alreadyRegistered === 'true') {
            console.log('🔄 Atualizando token com dados do usuário autenticado...');
            registerFCM();
        }
    }
});
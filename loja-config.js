// ===================================
// CONFIGURAÇÃO FIREBASE - AYA ACESSÓRIOS
// ===================================

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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const storage = firebase.storage();

console.log('🔥 Firebase Aya Acessórios inicializado com sucesso!');

// ===================================
// FUNÇÕES DE CONFIGURAÇÃO DA LOJA
// ===================================

async function loadStoreSettings() {
    try {
        const doc = await db.collection('settings').doc('storeConfig').get();
        
        if (!doc.exists) {
            console.warn('⚠️ Configurações da loja não encontradas no Firestore');
            return;
        }

        const settings = doc.data();

        // Aplicar logo
        if (settings.branding && settings.branding.logoUrl) {
            const logoImage = document.getElementById('logoImage');
            const logoText = document.getElementById('logoText');
            
            if (logoImage && logoText) {
                logoImage.src = settings.branding.logoUrl;
                logoImage.style.display = 'block';
                logoText.style.display = 'none';
            }
        }

        // Aplicar cores customizadas
        if (settings.branding && settings.branding.colors) {
            const colors = settings.branding.colors;
            const root = document.documentElement;

            if (colors.primary) {
                root.style.setProperty('--primary', colors.primary);
                root.style.setProperty('--primary-color', colors.primary);
            }
            if (colors.secondary) {
                root.style.setProperty('--secondary', colors.secondary);
                root.style.setProperty('--secondary-color', colors.secondary);
            }
            if (colors.accent) {
                root.style.setProperty('--accent', colors.accent);
            }
        }

        // Aplicar banner (apenas na página inicial)
        if (settings.branding && settings.branding.bannerUrl) {
            const heroBanner = document.getElementById('heroBanner');
            if (heroBanner) {
                heroBanner.style.backgroundImage = `url('${settings.branding.bannerUrl}')`;
                heroBanner.style.backgroundSize = 'cover';
                heroBanner.style.backgroundPosition = 'center';
            }
        }

        // Configurar links de contato no header
        if (settings.contact) {
            const headerWhatsapp = document.getElementById('headerWhatsapp');
            const headerInstagram = document.getElementById('headerInstagram');

            if (settings.contact.whatsapp && headerWhatsapp) {
                const phone = settings.contact.whatsapp.replace(/\D/g, '');
                headerWhatsapp.href = `https://wa.me/55${phone}`;
            }

            if (settings.contact.instagram && headerInstagram) {
                const handle = settings.contact.instagram.replace('@', '');
                headerInstagram.href = `https://instagram.com/${handle}`;
            }
        }

        // Configurar footer
        updateFooter(settings);

        // Configurar WhatsApp flutuante
        updateWhatsAppFloat(settings);

        console.log('✅ Configurações da loja carregadas com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao carregar configurações:', error);
        console.warn('⚠️ Continuando com configurações padrão...');
    }
}

function updateFooter(settings) {
    // About
    const footerAbout = document.getElementById('footerAbout');
    if (footerAbout && settings.contact && settings.contact.aboutUs) {
        const about = settings.contact.aboutUs;
        footerAbout.textContent = about.length > 150 ? about.substring(0, 150) + '...' : about;
    }

    // Contato
    if (settings.contact) {
        const footerPhone = document.getElementById('footerPhone');
        const footerEmail = document.getElementById('footerEmail');
        const footerAddress = document.getElementById('footerAddress');

        if (footerPhone) {
            const phone = settings.contact.whatsapp || settings.contact.phone || '-';
            footerPhone.innerHTML = `📱 <span>${phone}</span>`;
        }

        if (footerEmail) {
            const email = settings.contact.email || '-';
            footerEmail.innerHTML = `📧 <span>${email}</span>`;
        }

        if (footerAddress) {
            footerAddress.textContent = settings.contact.address || '-';
        }
    }

    // Links sociais
    const footerInstagram = document.getElementById('footerInstagram');
    const footerWhatsapp = document.getElementById('footerWhatsapp');

    if (settings.contact) {
        if (settings.contact.instagram && footerInstagram) {
            const handle = settings.contact.instagram.replace('@', '');
            footerInstagram.href = `https://instagram.com/${handle}`;
        }

        if (settings.contact.whatsapp && footerWhatsapp) {
            const phone = settings.contact.whatsapp.replace(/\D/g, '');
            footerWhatsapp.href = `https://wa.me/55${phone}`;
        }
    }
}

function updateWhatsAppFloat(settings) {
    const whatsappFloat = document.getElementById('whatsappFloat');
    if (whatsappFloat && settings.contact && settings.contact.whatsapp) {
        const phone = settings.contact.whatsapp.replace(/\D/g, '');
        whatsappFloat.href = `https://wa.me/55${phone}`;
    }
}

// ===================================
// FUNÇÕES DE CARRINHO (localStorage)
// ===================================

function getCart() {
    const cart = localStorage.getItem('ayaCart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('ayaCart', JSON.stringify(cart));
    updateCartCount();
}

function clearCart() {
    localStorage.removeItem('ayaCart');
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartCountElements = document.querySelectorAll('#cartCount, .cart-count, .cart-count-premium');
    cartCountElements.forEach(element => {
        if (element) {
            element.textContent = totalItems;
        }
    });
}

// ===================================
// FUNÇÕES DE FORMATAÇÃO
// ===================================

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('pt-BR');
}

// ===================================
// CRIAR CARD DE PRODUTO
// ===================================

function createProductCard(productId, product, discount = 0) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const price = product.price || 0;
    const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
    
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'https://via.placeholder.com/400x500/A7ED00/000000?text=Sem+Imagem';

    card.innerHTML = `
        <div class="product-image-container">
            <img src="${imageUrl}" alt="${product.title}" class="product-image" onerror="this.src='https://via.placeholder.com/400x500/A7ED00/000000?text=Erro'">
            ${discount > 0 ? `<div class="product-badge">-${discount}%</div>` : ''}
        </div>
        <div class="product-info">
            ${product.collection ? `<div class="product-collection">${product.collection}</div>` : ''}
            <h3 class="product-title">${product.title}</h3>
            <div class="product-price">
                ${formatCurrency(finalPrice)}
                ${discount > 0 ? `<span style="font-size: 14px; color: var(--dark-gray); text-decoration: line-through; margin-left: 8px;">${formatCurrency(price)}</span>` : ''}
            </div>
            <div class="product-actions">
                <a href="produto-detalhes.html?id=${productId}" class="btn-primary" style="text-decoration: none; text-align: center;">
                    Ver Detalhes
                </a>
                <button class="btn-secondary" onclick="quickAddToCart('${productId}', '${product.title}', ${price}, ${discount}, '${imageUrl}')" title="Adicionar ao Carrinho">
                    🛒
                </button>
            </div>
        </div>
    `;

    return card;
}

// ===================================
// ADICIONAR AO CARRINHO RÁPIDO
// ===================================

function quickAddToCart(productId, title, price, discount, image) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            title: title,
            price: price,
            discount: discount,
            image: image,
            quantity: 1
        });
    }

    saveCart(cart);
    showNotification('✅ Produto adicionado ao carrinho!');
}

// ===================================
// CARREGAR PRODUTOS EM DESTAQUE
// ===================================

async function loadFeaturedProducts() {
    try {
        const featuredGrid = document.getElementById('featuredProducts');
        if (!featuredGrid) return;

        featuredGrid.innerHTML = '<div class="loading-elegant"><div class="spinner-elegant"></div><p>Carregando produtos...</p></div>';

        // Buscar últimos 6 produtos
        const productsSnapshot = await db.collection('products')
            .orderBy('createdAt', 'desc')
            .limit(6)
            .get();

        if (productsSnapshot.empty) {
            featuredGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--dark-gray);">Nenhum produto disponível</p>';
            return;
        }

        // Buscar promoções ativas
        const promotionsSnapshot = await db.collection('promotions')
            .where('active', '==', true)
            .get();

        const activePromotions = {};
        const now = new Date();

        promotionsSnapshot.forEach(doc => {
            const promo = doc.data();
            const startDate = promo.startDate.toDate();
            const endDate = promo.endDate.toDate();

            if (now >= startDate && now <= endDate && promo.products) {
                promo.products.forEach(productId => {
                    if (!activePromotions[productId] || promo.discount > activePromotions[productId]) {
                        activePromotions[productId] = promo.discount;
                    }
                });
            }
        });

        // Renderizar produtos
        featuredGrid.innerHTML = '';

        productsSnapshot.forEach(doc => {
            const product = doc.data();
            const productCard = createProductCard(doc.id, product, activePromotions[doc.id]);
            featuredGrid.appendChild(productCard);
        });

        console.log(`✅ ${productsSnapshot.size} produtos carregados`);

    } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error);
        const featuredGrid = document.getElementById('featuredProducts');
        if (featuredGrid) {
            featuredGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--error);">Erro ao carregar produtos. Verifique o console.</p>';
        }
    }
}

// ===================================
// CARREGAR PROMOÇÕES ATIVAS
// ===================================

async function loadActivePromotions() {
    try {
        const promotionsSection = document.getElementById('promotionsSection');
        const promotionsGrid = document.getElementById('promotionsGrid');
        
        if (!promotionsGrid) return;

        const snapshot = await db.collection('promotions')
            .where('active', '==', true)
            .get();

        if (snapshot.empty) {
            if (promotionsSection) promotionsSection.style.display = 'none';
            return;
        }

        const now = new Date();
        const activePromos = [];

        snapshot.forEach(doc => {
            const promo = doc.data();
            const startDate = promo.startDate.toDate();
            const endDate = promo.endDate.toDate();

            if (now >= startDate && now <= endDate) {
                activePromos.push({ id: doc.id, ...promo });
            }
        });

        if (activePromos.length === 0) {
            if (promotionsSection) promotionsSection.style.display = 'none';
            return;
        }

        if (promotionsSection) promotionsSection.style.display = 'block';
        promotionsGrid.innerHTML = '';

        activePromos.forEach(promo => {
    const promoCard = document.createElement('div');
    promoCard.className = 'promotion-card';
    
    // Nome da promoção com fallback
    const promoName = promo.name || promo.title || `Promoção ${promo.discount}%` || 'Promoção Especial';
    
    promoCard.innerHTML = `
        <div class="promotion-discount">${promo.discount}%</div>
        <h3 class="promotion-title">${promoName}</h3>
        <p class="promotion-dates">
            Válida de ${formatDate(promo.startDate)} até ${formatDate(promo.endDate)}
        </p>
        <a href="produtos.html" class="btn-secondary-premium" style="display: inline-block; margin-top: 16px; padding: 12px 24px; text-decoration: none;">
            Ver Produtos
        </a>
    `;
    promotionsGrid.appendChild(promoCard);
});

        console.log(`✅ ${activePromos.length} promoções ativas carregadas`);

    } catch (error) {
        console.error('❌ Erro ao carregar promoções:', error);
    }
}

// ===================================
// CARREGAR COLEÇÕES
// ===================================

async function loadCollections() {
    try {
        const collectionsSection = document.getElementById('collectionsSection');
        const collectionsGrid = document.getElementById('collectionsGrid');
        
        if (!collectionsGrid) return;

        const snapshot = await db.collection('collections')
            .orderBy('name')
            .get();

        if (snapshot.empty) {
            if (collectionsSection) collectionsSection.style.display = 'none';
            return;
        }

        if (collectionsSection) collectionsSection.style.display = 'block';
        collectionsGrid.innerHTML = '';

        snapshot.forEach(doc => {
            const collection = doc.data();
            const collectionCard = document.createElement('div');
            collectionCard.className = 'collection-card';
            collectionCard.innerHTML = `
                <div class="collection-icon">💎</div>
                <h3 class="collection-name">${collection.name}</h3>
            `;
            collectionCard.style.cursor = 'pointer';
            collectionCard.addEventListener('click', () => {
                window.location.href = `produtos.html?collection=${encodeURIComponent(collection.name)}`;
            });
            collectionsGrid.appendChild(collectionCard);
        });

        console.log(`✅ ${snapshot.size} coleções carregadas`);

    } catch (error) {
        console.error('❌ Erro ao carregar coleções:', error);
    }
}

// ===================================
// MENU MOBILE
// ===================================

function setupMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.getElementById('mainNav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }
}

// ===================================
// NOTIFICAÇÕES
// ===================================

function showNotification(message, duration = 3000) {
    // Remover notificação existente
    const existing = document.querySelector('.notification-toast');
    if (existing) {
        existing.remove();
    }

    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #000;
        color: #fff;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        font-size: 14px;
        font-weight: 600;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Adicionar animações CSS
if (!document.querySelector('#notification-animations')) {
    const style = document.createElement('style');
    style.id = 'notification-animations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ Loja Config carregada - Aya Acessórios');
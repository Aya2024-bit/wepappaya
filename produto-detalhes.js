// ===================================
// PRODUTO DETALHES - VERSÃO COMPLETA
// ===================================

console.log('🚀 Página de Detalhes do Produto carregada');

// Variável global para armazenar o produto atual
window.currentProduct = null;

// ===================================
// FUNÇÕES DO CARRINHO
// ===================================
function getCart() {
    const cart = localStorage.getItem('ayaCart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('ayaCart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product, quantity = 1) {
    const cart = getCart();
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: product.finalPrice || product.price,
            image: product.images && product.images[0] ? product.images[0] : '',
            quantity: quantity
        });
    }
    
    saveCart(cart);
    
    // Mostrar notificação
    if (typeof showNotification === 'function') {
        showNotification('✅ Produto adicionado ao carrinho!');
    } else {
        alert('✅ Produto adicionado ao carrinho!');
    }
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
// CARREGAR DETALHES DO PRODUTO
// ===================================
async function loadProductDetails() {
    try {
        // 1. PEGAR ID DA URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        console.log('📦 ID do produto na URL:', productId);

        if (!productId) {
            console.error('❌ ERRO: Nenhum ID na URL!');
            showError('ID do produto não encontrado na URL');
            return;
        }

        // 2. BUSCAR PRODUTO NO FIRESTORE
        console.log('🔍 Buscando produto no Firestore...');
        const doc = await db.collection('products').doc(productId).get();

        if (!doc.exists) {
            console.error('❌ Produto não encontrado no banco de dados');
            showError('Produto não encontrado');
            return;
        }

        const product = { id: doc.id, ...doc.data() };
        console.log('✅ Produto carregado:', product);

        // 3. RENDERIZAR PRODUTO NA TELA
        renderProductDetails(product);

        // 4. CARREGAR PRODUTOS RELACIONADOS
        if (product.collection) {
            loadRelatedProducts(product.collection, product.id);
        }

    } catch (error) {
        console.error('❌ Erro ao carregar produto:', error);
        showError('Erro ao carregar produto: ' + error.message);
    }
}

// ===================================
// RENDERIZAR DETALHES DO PRODUTO
// ===================================
function renderProductDetails(product) {
    const container = document.getElementById('productDetailsContainer');

    // Calcular preço com promoção
    const hasPromotion = product.promotion && product.promotion.active;
    const finalPrice = hasPromotion 
        ? product.price * (1 - product.promotion.discount / 100)
        : product.price;

    // Métodos de pagamento
    const paymentMethodsLabels = {
        'pix': '💚 PIX',
        'cartao': '💳 Cartão',
        'boleto': '📄 Boleto',
        'dinheiro': '💵 Dinheiro',
        'transferencia': '🏦 Transferência',
        'whatsapp': '📱 WhatsApp'
    };

    // Gerar HTML das miniaturas
    let thumbnailsHTML = '';
    if (product.images && product.images.length > 1) {
        thumbnailsHTML = `
            <div class="thumbnails">
                ${product.images.map((img, index) => `
                    <div class="thumbnail ${index === 0 ? 'active' : ''}" data-image="${img}">
                        <img src="${img}" alt="${product.title}">
                    </div>
                `).join('')}
            </div>
        `;
    }

    // HTML do produto
    const html = `
        <div class="product-details-container">
            <!-- GALERIA DE IMAGENS -->
            <div class="product-gallery">
                <div class="main-image-container">
                    <img src="${product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/600x600?text=Sem+Imagem'}" 
                         alt="${product.title}" 
                         class="main-image" 
                         id="mainImage">
                </div>
                ${thumbnailsHTML}
            </div>

            <!-- INFORMAÇÕES DO PRODUTO -->
            <div class="product-info-detail">
                <h1 class="product-title-detail">${product.title}</h1>

                <!-- PREÇO -->
                <div class="product-price-detail ${hasPromotion ? 'has-promotion' : ''}">
                    ${hasPromotion ? `
                        <span class="original-price-detail">${formatCurrency(product.price)}</span>
                        <span class="promotion-badge-detail">-${product.promotion.discount}%</span>
                    ` : ''}
                    <span>${formatCurrency(finalPrice)}</span>
                </div>

                <!-- DESCRIÇÃO -->
                <div class="product-description-detail">
                    ${product.description}
                </div>

                <!-- ESTOQUE -->
                ${product.stock !== undefined ? `
                    <div class="product-stock">
                        <span class="stock-status ${product.stock > 10 ? 'available' : product.stock > 0 ? 'low' : 'unavailable'}">
                            ${product.stock > 10 ? '✅ Em Estoque' : product.stock > 0 ? `⚠️ Últimas ${product.stock} unidades` : '❌ Esgotado'}
                        </span>
                    </div>
                ` : ''}

                <!-- SELETOR DE QUANTIDADE -->
                ${product.stock > 0 ? `
                    <div class="quantity-selector">
                        <label>Quantidade:</label>
                        <div class="quantity-controls">
                            <button class="quantity-btn" id="decreaseBtn">−</button>
                            <input type="number" id="quantityInput" class="quantity-input" value="1" min="1" max="${product.stock}" readonly>
                            <button class="quantity-btn" id="increaseBtn">+</button>
                        </div>
                    </div>

                    <!-- BOTÃO ADICIONAR AO CARRINHO -->
                    <button class="add-to-cart-btn" id="addToCartBtn">
                        🛒 Adicionar ao Carrinho
                    </button>
                ` : ''}

                <!-- BOTÃO WHATSAPP -->
                ${product.paymentMethods && product.paymentMethods.includes('whatsapp') ? `
                    <a href="#" class="whatsapp-contact-btn" id="whatsappProductBtn" target="_blank">
                        📱 Consultar no WhatsApp
                    </a>
                ` : ''}

                <!-- MÉTODOS DE PAGAMENTO -->
                ${product.paymentMethods && product.paymentMethods.length > 0 ? `
                    <div style="margin-top: 20px; padding: 20px; background: var(--light-gray); border-radius: 10px;">
                        <h4 style="margin-bottom: 15px; font-size: 14px; text-transform: uppercase; color: var(--dark-gray);">
                            💳 Formas de Pagamento Disponíveis
                        </h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${product.paymentMethods.map(method => {
                                return `<span style="padding: 8px 16px; background: white; border-radius: 20px; font-size: 14px; font-weight: 600;">
                                    ${paymentMethodsLabels[method] || method}
                                </span>`;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Salvar produto globalmente
    window.currentProduct = { ...product, finalPrice };

    // CONFIGURAR EVENT LISTENERS APÓS RENDERIZAR
    setupProductEventListeners(product, finalPrice);
}

// ===================================
// CONFIGURAR EVENT LISTENERS
// ===================================
function setupProductEventListeners(product, finalPrice) {
    // 1. MINIATURAS DAS IMAGENS
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            const imageSrc = this.getAttribute('data-image');
            const mainImage = document.getElementById('mainImage');
            
            if (mainImage && imageSrc) {
                mainImage.src = imageSrc;
                
                // Atualizar classe active
                thumbnails.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                console.log('✅ Imagem alterada:', imageSrc);
            }
        });
    });

    // 2. BOTÕES DE QUANTIDADE
    const increaseBtn = document.getElementById('increaseBtn');
    const decreaseBtn = document.getElementById('decreaseBtn');
    const quantityInput = document.getElementById('quantityInput');

    if (increaseBtn && quantityInput) {
        increaseBtn.addEventListener('click', function() {
            const currentValue = parseInt(quantityInput.value);
            const maxStock = parseInt(quantityInput.getAttribute('max'));
            
            if (currentValue < maxStock) {
                quantityInput.value = currentValue + 1;
                console.log('➕ Quantidade:', quantityInput.value);
            }
        });
    }

    if (decreaseBtn && quantityInput) {
        decreaseBtn.addEventListener('click', function() {
            const currentValue = parseInt(quantityInput.value);
            
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                console.log('➖ Quantidade:', quantityInput.value);
            }
        });
    }

    // 3. BOTÃO ADICIONAR AO CARRINHO
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
            console.log('🛒 Adicionando ao carrinho:', window.currentProduct.title, 'Qtd:', quantity);
            addToCart(window.currentProduct, quantity);
        });
    }

    // 4. BOTÃO WHATSAPP
    const whatsappBtn = document.getElementById('whatsappProductBtn');
    if (whatsappBtn) {
        setupWhatsAppButton(product, finalPrice, whatsappBtn);
    }
}

// ===================================
// CONFIGURAR BOTÃO WHATSAPP
// ===================================
function setupWhatsAppButton(product, finalPrice, whatsappBtn) {
    // Verificar se temos configuração de WhatsApp
    let phone = '';
    
    if (window.lojaConfig && window.lojaConfig.contact && window.lojaConfig.contact.whatsapp) {
        phone = window.lojaConfig.contact.whatsapp.replace(/\D/g, '');
    } else if (window.lojaConfig && window.lojaConfig.whatsapp) {
        phone = window.lojaConfig.whatsapp.replace(/\D/g, '');
    } else {
        phone = '5592000000000'; // Número padrão (ALTERAR!)
    }

    const paymentMethodsLabels = {
        'pix': '💚 PIX',
        'cartao': '💳 Cartão',
        'boleto': '📄 Boleto',
        'dinheiro': '💵 Dinheiro',
        'transferencia': '🏦 Transferência',
        'whatsapp': '📱 WhatsApp'
    };

    const message = `Olá! Tenho interesse no produto:

📦 *${product.title}*
💰 ${formatCurrency(finalPrice)}

${product.paymentMethods && product.paymentMethods.length > 0 ? `
Métodos de pagamento disponíveis:
${product.paymentMethods.map(m => paymentMethodsLabels[m] || m).join('\n')}
` : ''}

Como posso finalizar minha compra?`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    whatsappBtn.href = whatsappUrl;
    
    console.log('✅ WhatsApp configurado:', whatsappUrl);
}

// ===================================
// CARREGAR PRODUTOS RELACIONADOS
// ===================================
async function loadRelatedProducts(collection, currentProductId) {
    try {
        console.log('🔍 Buscando produtos relacionados da coleção:', collection);
        
        const snapshot = await db.collection('products')
            .where('collection', '==', collection)
            .limit(5)
            .get();

        if (snapshot.empty) {
            console.log('❌ Nenhum produto relacionado encontrado');
            return;
        }

        const relatedSection = document.getElementById('relatedProductsSection');
        const relatedGrid = document.getElementById('relatedProductsGrid');

        if (!relatedSection || !relatedGrid) {
            console.log('⚠️ Elementos de produtos relacionados não encontrados');
            return;
        }

        relatedGrid.innerHTML = '';
        let count = 0;

        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            
            if (product.id === currentProductId) return;
            if (count >= 4) return;

            const card = createProductCard(product);
            relatedGrid.appendChild(card);
            count++;
        });

        if (count > 0) {
            relatedSection.style.display = 'block';
            console.log(`✅ ${count} produtos relacionados carregados`);
        }

    } catch (error) {
        console.error('❌ Erro ao carregar produtos relacionados:', error);
    }
}

// ===================================
// CRIAR CARD DE PRODUTO
// ===================================
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card-premium';
    
    const imageUrl = product.images && product.images[0] 
        ? product.images[0] 
        : 'https://via.placeholder.com/400x400?text=Sem+Imagem';

    card.innerHTML = `
        <div class="product-image-premium">
            <img src="${imageUrl}" alt="${product.title}" loading="lazy">
        </div>
        <div class="product-content-premium">
            <h3 class="product-title-premium">${product.title}</h3>
            <p class="product-price-premium">${formatCurrency(product.price)}</p>
            <a href="produto-detalhes.html?id=${product.id}" class="product-link-premium">Ver Detalhes</a>
        </div>
    `;

    return card;
}

// ===================================
// MOSTRAR ERRO
// ===================================
function showError(message) {
    const container = document.getElementById('productDetailsContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 80px 20px;">
            <h2 style="font-size: 48px; margin-bottom: 20px;">😕</h2>
            <h3 style="color: var(--dark-gray); margin-bottom: 15px; font-size: 24px;">Ops!</h3>
            <p style="font-size: 16px; color: var(--dark-gray); margin-bottom: 30px;">${message}</p>
            <a href="produtos.html" style="display: inline-block; padding: 15px 30px; background: var(--primary); color: var(--black); text-decoration: none; border-radius: 10px; font-weight: 700;">
                ← Ver Todos os Produtos
            </a>
        </div>
    `;
}

// ===================================
// FORMATAR MOEDA
// ===================================
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// ===================================
// MENU MOBILE
// ===================================
function setupMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.getElementById('mainNav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            console.log('📱 Menu mobile clicado');
            mainNav.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        console.log('✅ Menu mobile configurado');
    } else {
        console.log('⚠️ Elementos do menu mobile não encontrados');
    }
}

// ===================================
// CARREGAR CONFIGURAÇÕES DO RODAPÉ
// ===================================
async function loadFooterSettings() {
    try {
        console.log('🔧 Carregando configurações do rodapé...');
        
        const doc = await db.collection('settings').doc('storeConfig').get();
        
        if (!doc.exists) {
            console.log('⚠️ Usando configurações padrão do rodapé');
            setDefaultFooterInfo();
            return;
        }

        const settings = doc.data();
        console.log('✅ Configurações carregadas:', settings);

        // Atualizar footer
        if (settings.contact) {
            // About Us
            const footerAbout = document.getElementById('footerAbout');
            if (footerAbout && settings.contact.aboutUs) {
                footerAbout.textContent = settings.contact.aboutUs.substring(0, 150) + '...';
            }

            // Telefone
            const footerPhone = document.getElementById('footerPhone');
            if (footerPhone) {
                const phone = settings.contact.whatsapp || settings.contact.phone || '(92) 00000-0000';
                footerPhone.innerHTML = `📱 <span>${phone}</span>`;
            }

            // Email
            const footerEmail = document.getElementById('footerEmail');
            if (footerEmail) {
                const email = settings.contact.email || 'contato@ayaacessorios.com';
                footerEmail.innerHTML = `📧 <span>${email}</span>`;
            }

            // Endereço
            const footerAddress = document.getElementById('footerAddress');
            if (footerAddress) {
                footerAddress.textContent = settings.contact.address || 'Manaus, AM - Brasil';
            }

            // Links sociais
            const footerInstagram = document.getElementById('footerInstagram');
            const footerWhatsapp = document.getElementById('footerWhatsapp');

            if (settings.contact.instagram && footerInstagram) {
                const handle = settings.contact.instagram.replace('@', '');
                footerInstagram.href = `https://instagram.com/${handle}`;
            }

            if (settings.contact.whatsapp && footerWhatsapp) {
                const phone = settings.contact.whatsapp.replace(/\D/g, '');
                footerWhatsapp.href = `https://wa.me/55${phone}`;
            }

            // WhatsApp flutuante
            const whatsappFloat = document.getElementById('whatsappFloat');
            if (settings.contact.whatsapp && whatsappFloat) {
                const phone = settings.contact.whatsapp.replace(/\D/g, '');
                whatsappFloat.href = `https://wa.me/55${phone}`;
            }
        }

        console.log('✅ Rodapé atualizado com sucesso');

    } catch (error) {
        console.error('❌ Erro ao carregar configurações do rodapé:', error);
        setDefaultFooterInfo();
    }
}

// ===================================
// CONFIGURAÇÕES PADRÃO DO RODAPÉ
// ===================================
function setDefaultFooterInfo() {
    console.log('📝 Aplicando configurações padrão do rodapé');

    const footerAbout = document.getElementById('footerAbout');
    if (footerAbout) {
        footerAbout.textContent = 'Elegância e exclusividade em cada detalhe. Acessórios que fazem a diferença.';
    }

    const footerPhone = document.getElementById('footerPhone');
    if (footerPhone) {
        footerPhone.innerHTML = '📱 <span>(92) 00000-0000</span>';
    }

    const footerEmail = document.getElementById('footerEmail');
    if (footerEmail) {
        footerEmail.innerHTML = '📧 <span>contato@ayaacessorios.com</span>';
    }

    const footerAddress = document.getElementById('footerAddress');
    if (footerAddress) {
        footerAddress.textContent = 'Manaus, AM - Brasil';
    }

    const footerInstagram = document.getElementById('footerInstagram');
    if (footerInstagram) {
        footerInstagram.href = 'https://instagram.com/ayaacessorios';
    }

    const footerWhatsapp = document.getElementById('footerWhatsapp');
    if (footerWhatsapp) {
        footerWhatsapp.href = 'https://wa.me/5592000000000';
    }

    const whatsappFloat = document.getElementById('whatsappFloat');
    if (whatsappFloat) {
        whatsappFloat.href = 'https://wa.me/5592000000000';
    }
}

// ===================================
// INICIALIZAR
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM carregado');
    
    // Atualizar contador do carrinho
    updateCartCount();
    
    // Carregar detalhes do produto
    loadProductDetails();
    
    // Configurar menu mobile
    setupMobileMenu();
    
    // Carregar informações do rodapé
    loadFooterSettings();
});
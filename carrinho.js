// ===================================
// PÁGINA DO CARRINHO
// ===================================

let whatsappNumber = '';

document.addEventListener('DOMContentLoaded', async () => {
    await loadStoreSettings();
    await loadCart();
    setupMobileMenu();
    
    // Obter número do WhatsApp
    const settings = await getStoreSettings();
    if (settings && settings.contact && settings.contact.whatsapp) {
        whatsappNumber = settings.contact.whatsapp.replace(/\D/g, '');
    }
});

// ===================================
// BUSCAR CONFIGURAÇÕES DA LOJA
// ===================================
async function getStoreSettings() {
    try {
        const doc = await db.collection('settings').doc('storeConfig').get();
        return doc.exists ? doc.data() : null;
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        return null;
    }
}

// ===================================
// CARREGAR CARRINHO
// ===================================
async function loadCart() {
    const cart = getCart();
    const container = document.getElementById('cartContent');

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h2 style="font-size: 32px; margin-bottom: 16px; color: var(--black); font-family: var(--font-display);">
                    Seu carrinho está vazio
                </h2>
                <p style="color: var(--dark-gray); margin-bottom: 32px; font-size: 18px;">
                    Adicione produtos para começar suas compras
                </p>
                <a href="produtos.html" class="btn-secondary-premium" style="display: inline-flex; align-items: center; gap: 12px; padding: 16px 36px; text-decoration: none;">
                    Ver Produtos
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </a>
            </div>
        `;
        return;
    }

    renderCart(cart);
}

// ===================================
// RENDERIZAR CARRINHO
// ===================================
function renderCart(cart) {
    const container = document.getElementById('cartContent');

    let subtotal = 0;
    let totalDiscount = 0;

    const cartItemsHTML = cart.map((item, index) => {
        const itemPrice = item.price || 0;
        const discount = item.discount || 0;
        const finalPrice = discount > 0 ? itemPrice * (1 - discount / 100) : itemPrice;
        const itemTotal = finalPrice * item.quantity;

        subtotal += itemPrice * item.quantity;
        totalDiscount += (itemPrice - finalPrice) * item.quantity;

        return `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image || 'https://via.placeholder.com/120x120'}" alt="${item.title}">
                </div>
                
                <div class="cart-item-info">
                    <h3 class="cart-item-title">${item.title}</h3>
                    <div class="cart-item-price">
                        ${formatCurrency(finalPrice)}
                        ${discount > 0 ? `<span style="font-size: 14px; color: var(--dark-gray); text-decoration: line-through; margin-left: 8px;">${formatCurrency(itemPrice)}</span>` : ''}
                    </div>
                    <div class="cart-item-quantity">
                        <span style="font-size: 14px; color: var(--dark-gray); margin-right: 8px;">Quantidade:</span>
                        <button class="cart-qty-btn" onclick="updateQuantity(${index}, ${item.quantity - 1})">−</button>
                        <span class="cart-qty-value">${item.quantity}</span>
                        <button class="cart-qty-btn" onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                
                <div class="cart-item-actions">
                    <div class="cart-item-total">${formatCurrency(itemTotal)}</div>
                    <button class="cart-item-remove" onclick="removeFromCart(${index})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                        Remover
                    </button>
                </div>
            </div>
        `;
    }).join('');

    const total = subtotal - totalDiscount;

    container.innerHTML = `
        <div class="cart-container">
            <div class="cart-items">
                <h2>Itens do Carrinho (${cart.length})</h2>
                ${cartItemsHTML}
            </div>

            <div class="cart-summary">
                <h3>Resumo do Pedido</h3>
                
                <div class="summary-line">
                    <span>Subtotal:</span>
                    <span>${formatCurrency(subtotal)}</span>
                </div>
                
                ${totalDiscount > 0 ? `
                    <div class="summary-line" style="color: var(--primary-dark);">
                        <span>Desconto:</span>
                        <span>-${formatCurrency(totalDiscount)}</span>
                    </div>
                ` : ''}
                
                <div class="summary-line total">
                    <span>Total:</span>
                    <span>${formatCurrency(total)}</span>
                </div>

                <button class="checkout-btn" onclick="finalizeOrder()">
                    💬 Finalizar pelo WhatsApp
                </button>

                <a href="produtos.html" class="continue-shopping">
                    Continuar Comprando
                </a>
            </div>
        </div>
    `;
}

// ===================================
// ATUALIZAR QUANTIDADE
// ===================================
function updateQuantity(index, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }

    const cart = getCart();
    cart[index].quantity = newQuantity;
    saveCart(cart);
    loadCart();
}

// ===================================
// REMOVER DO CARRINHO
// ===================================
function removeFromCart(index) {
    if (!confirm('Deseja remover este item do carrinho?')) {
        return;
    }

    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    loadCart();
    showNotification('✅ Item removido do carrinho');
}

// ===================================
// FINALIZAR PEDIDO
// ===================================
function finalizeOrder() {
    const cart = getCart();
    
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    // Montar mensagem para WhatsApp
    let message = '🛍️ *Novo Pedido - Aya Acessórios*\n\n';
    
    let total = 0;

    cart.forEach((item, index) => {
        const itemPrice = item.price || 0;
        const discount = item.discount || 0;
        const finalPrice = discount > 0 ? itemPrice * (1 - discount / 100) : itemPrice;
        const itemTotal = finalPrice * item.quantity;
        
        total += itemTotal;

        message += `${index + 1}. *${item.title}*\n`;
        message += `   Quantidade: ${item.quantity}\n`;
        message += `   Preço: ${formatCurrency(finalPrice)}`;
        
        if (discount > 0) {
            message += ` _(${discount}% OFF)_`;
        }
        
        message += `\n   Subtotal: ${formatCurrency(itemTotal)}\n\n`;
    });

    message += `💰 *Total: ${formatCurrency(total)}*\n\n`;
    message += `Gostaria de finalizar este pedido!`;

    const whatsappLink = `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappLink, '_blank');
}

console.log('Página do Carrinho carregada');
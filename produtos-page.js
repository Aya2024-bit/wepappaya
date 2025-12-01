// ===================================
// PÁGINA DE PRODUTOS - LISTAGEM E FILTROS
// ===================================

let allProducts = [];
let allPromotions = {};

document.addEventListener('DOMContentLoaded', async () => {
    await loadStoreSettings();
    await loadCollectionsFilter();
    await loadAllProducts();
    setupFilters();
    setupMobileMenu();
    updateCartCount();
    
    // Verificar se há filtro de coleção na URL
    const urlParams = new URLSearchParams(window.location.search);
    const collectionParam = urlParams.get('collection');
    if (collectionParam) {
        document.getElementById('collectionFilter').value = collectionParam;
        filterProducts();
    }
});

// ===================================
// CARREGAR TODAS AS PROMOÇÕES
// ===================================
async function loadAllPromotions() {
    try {
        const snapshot = await db.collection('promotions')
            .where('active', '==', true)
            .get();

        const now = new Date();
        
        snapshot.forEach(doc => {
            const promo = doc.data();
            const startDate = promo.startDate.toDate();
            const endDate = promo.endDate.toDate();

            if (now >= startDate && now <= endDate && promo.products) {
                promo.products.forEach(productId => {
                    if (!allPromotions[productId] || promo.discount > allPromotions[productId]) {
                        allPromotions[productId] = promo.discount;
                    }
                });
            }
        });

    } catch (error) {
        console.error('Erro ao carregar promoções:', error);
    }
}

// ===================================
// CARREGAR TODOS OS PRODUTOS
// ===================================
async function loadAllProducts() {
    try {
        const productsGrid = document.getElementById('productsGrid');
        productsGrid.innerHTML = '<div class="loading-elegant"><div class="spinner-elegant"></div><p>Carregando produtos...</p></div>';

        // Carregar promoções primeiro
        await loadAllPromotions();

        // Buscar todos os produtos do Firestore
        const snapshot = await db.collection('products')
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            productsGrid.innerHTML = '<div class="empty-message">Nenhum produto disponível no momento</div>';
            updateProductsCount(0);
            return;
        }

        allProducts = [];
        
        snapshot.forEach(doc => {
            allProducts.push({
                id: doc.id,
                ...doc.data()
            });
        });

        displayProducts(allProducts);
        updateProductsCount(allProducts.length);

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        document.getElementById('productsGrid').innerHTML = 
            '<div class="empty-message">Erro ao carregar produtos</div>';
    }
}

// ===================================
// EXIBIR PRODUTOS
// ===================================
function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<div class="empty-message">Nenhum produto encontrado com os filtros selecionados</div>';
        return;
    }

    productsGrid.innerHTML = '';

    products.forEach(product => {
        const productCard = createProductCard(product.id, product, allPromotions[product.id]);
        productsGrid.appendChild(productCard);
    });
}

// ===================================
// CARREGAR FILTRO DE COLEÇÕES
// ===================================
async function loadCollectionsFilter() {
    try {
        const select = document.getElementById('collectionFilter');
        
        const snapshot = await db.collection('collections')
            .orderBy('name')
            .get();

        select.innerHTML = '<option value="">Todas as Coleções</option>';

        snapshot.forEach(doc => {
            const collection = doc.data();
            const option = document.createElement('option');
            option.value = collection.name;
            option.textContent = collection.name;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar coleções:', error);
    }
}

// ===================================
// CONFIGURAR FILTROS
// ===================================
function setupFilters() {
    // Filtro de busca
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(filterProducts, 300));

    // Filtro de coleção
    const collectionFilter = document.getElementById('collectionFilter');
    collectionFilter.addEventListener('change', filterProducts);

    // Filtro de ordenação
    const sortFilter = document.getElementById('sortFilter');
    sortFilter.addEventListener('change', filterProducts);
}

// ===================================
// APLICAR FILTROS
// ===================================
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedCollection = document.getElementById('collectionFilter').value;
    const sortOption = document.getElementById('sortFilter').value;

    let filteredProducts = [...allProducts];

    // Filtrar por busca
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
    }

    // Filtrar por coleção
    if (selectedCollection) {
        filteredProducts = filteredProducts.filter(product => 
            product.collection === selectedCollection
        );
    }

    // Ordenar
    switch (sortOption) {
        case 'newest':
            filteredProducts.sort((a, b) => {
                const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA;
            });
            break;
        case 'oldest':
            filteredProducts.sort((a, b) => {
                const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
                return dateA - dateB;
            });
            break;
        case 'price-asc':
            filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }

    displayProducts(filteredProducts);
    updateProductsCount(filteredProducts.length);
}

// ===================================
// ATUALIZAR CONTADOR DE PRODUTOS
// ===================================
function updateProductsCount(count) {
    const countElement = document.getElementById('productsCount');
    if (countElement) {
        countElement.textContent = `${count} produto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    }
}

// ===================================
// DEBOUNCE (PARA BUSCA)
// ===================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

console.log('Página de Produtos carregada');
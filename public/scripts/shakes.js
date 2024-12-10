// Produktkategorier
const productCategories = {
    "Orange Juice": "juice",
    "Apple Juice": "juice",
    "Grape Juice": "juice",
    "Pineapple Juice": "juice",
    "Espresso": "coffee",
    "Cappuccino": "coffee",
};

// Produktbeskrivelser
const productDescriptions = {
    "Orange Juice": "Freshly squeezed oranges with a hint of sunshine.",
    "Apple Juice": "Crisp and sweet apples in every sip.",
    "Grape Juice": "Rich grape flavor straight from the vine.",
    "Pineapple Juice": "Tropical sweetness to brighten your day.",
    "Espresso": "Strong and bold for the perfect start.",
    "Cappuccino": "A creamy delight with a shot of espresso."
};

// Funktion til at hente og indlæse produkter
function loadProducts() {
    fetch('/shakes/products')
        .then(response => response.json())
        .then(products => {
            const productsContainer = document.getElementById('products-grid');
            productsContainer.innerHTML = '';

            products.forEach(product => {
                const productCategory = productCategories[product.name] || 'unknown';
                const productDescription = productDescriptions[product.name] || '';

                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.setAttribute('data-category', productCategory); // Tilføj kategori

                productCard.innerHTML = `
                    <img src="/img/${product.imgsrc}" alt="${product.name}">
                    <div class="product-card-content">
                        <h3>${product.name}</h3>
                        <p>${productDescription}</p>
                        <p><strong>${product.price} DKK</strong></p>
                        <button onclick="addToCart(${product.product_id}, '${product.name}', ${product.price})">Add to Cart</button>
                    </div>
                `;
                productsContainer.appendChild(productCard);
            });
        })
        .catch(error => console.error('Error fetching products:', error));
}
function filterCategory(category) {
    const allProducts = document.querySelectorAll('.product-card');
    const productsContainer = document.getElementById('products-grid');
    
    // Sørg for, at containeren ikke ryddes (vi ændrer kun visningen af elementer)
    allProducts.forEach(product => {
        const productCategory = product.getAttribute('data-category');
        if (category === 'all' || productCategory === category) {
            product.style.display = 'flex'; // Gør produktet synligt
        } else {
            product.style.display = 'none'; // Skjul produktet
        }
    });

    // Opdater aktive knapper
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(button => button.classList.remove('active'));
    document.querySelector(`[onclick="filterCategory('${category}')"]`).classList.add('active');
}2

// Kurv-array til at gemme tilføjede varer
let cart = [];

// Funktion til at tilføje produkter til kurven
function addToCart(productId, productName, price) {
    const existingProduct = cart.find(item => item.productId === productId);
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({ productId, productName, price, quantity: 1 });
    }
    updateCartUI();
    alert(`${productName} added to cart!`);
}

// Funktion til at opdatere kurvens UI
function updateCartUI() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        const li = document.createElement('li');
        li.textContent = `${item.productName} - ${item.quantity} x ${item.price} DKK`;
        cartItems.appendChild(li);
    });

    const totalItem = document.createElement('li');
    totalItem.textContent = `Total: ${total} DKK`;
    cartItems.appendChild(totalItem);
}

// Funktion til at gennemføre en ordre
function placeOrder() {
    if (cart.length === 0) {
        alert('Your cart is empty. Add some items before placing an order!');
        return;
    }

    const items = cart.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
    }));

    fetch('/shakes/order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ items }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.order_id) {
                alert(`Order placed successfully! Order ID: ${data.order_id}`);
                cart = [];
                updateCartUI();
            } else {
                alert('Failed to place order');
            }
        })
        .catch(error => console.error('Error placing order:', error));
}

// Indlæs produkter, når siden indlæses
document.addEventListener('DOMContentLoaded', loadProducts);

// Select all dropdown buttons
const dropdownButtons = document.querySelectorAll('.dropdown-btn');

// Fetch products from the server and render them
// Fetch products from the /products endpoint
function loadProducts() {
    fetch('/shakes/products') // Relative URL, works with the same origin
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.status}`);
            }
            return response.json();
        })
        .then(products => {
            const productsContainer = document.getElementById('products-container');
            productsContainer.innerHTML = ''; // Clear existing content

            products.forEach(product => {
                // Create product card dynamically
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.id = `product-${product.product_id}`;
                productCard.dataset.price = product.price;

                productCard.innerHTML = `
                    <img src="../img/${product.imgsrc}" alt="${product.name}" />
                    <h3>${product.name}</h3>
                    <p>Price: ${product.price} DKK</p>
                    <button onclick="addToCart(${product.product_id}, '${product.name}', ${product.price})">Add to Cart</button>
                `;

                productsContainer.appendChild(productCard);
            });
        })
        .catch(error => console.error('Error fetching products:', error));
}


// Cart array to store added items
let cart = [];

// Function to add products to the cart
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

// Function to update the cart UI
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

// Function to place the order
function placeOrder() {
    if (cart.length === 0) {
        alert('Your cart is empty. Add some items before placing an order!');
        return;
    }

    const items = cart.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
    }));

    console.log('Order Items to Send:', items); // Debugging

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

// Load products when the page loads
document.addEventListener('DOMContentLoaded', loadProducts);

// Close dropdowns when clicking outside
window.addEventListener('click', function (event) {
    if (!event.target.matches('.dropdown-btn')) {
        document.querySelectorAll('.dropdown-content').forEach(content => {
            content.classList.remove('show');
        });
    }
});

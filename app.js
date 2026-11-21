const PRODUCTS = [
  { id: 'sku-1', name: 'Espresso Mug', price: 499 },
  { id: 'sku-2', name: 'Canvas Tote Bag', price: 799 },
  { id: 'sku-3', name: 'Desk Cable Organizer', price: 349 }
];

const cart = new Map();
let deferredInstallPrompt = null;

const catalogEl = document.getElementById('catalog');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const statusEl = document.getElementById('status');
const installBtn = document.getElementById('installBtn');
const checkoutBtn = document.getElementById('checkoutBtn');

function logStatus(message) {
  statusEl.textContent = message;
}

function renderCatalog() {
  catalogEl.innerHTML = PRODUCTS.map((item) => `
    <div class="card">
      <strong>${item.name}</strong>
      <div class="price">₹${item.price.toFixed(2)}</div>
      <button onclick="addToCart('${item.id}')">Add to Cart</button>
    </div>
  `).join('');
}

window.addToCart = function (id) {
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return;
  const current = cart.get(id) || { ...product, qty: 0 };
  current.qty += 1;
  cart.set(id, current);
  renderCart();
};

function renderCart() {
  if (cart.size === 0) {
    cartItemsEl.textContent = 'Your cart is empty.';
    cartTotalEl.textContent = 'Total: ₹0.00';
    return;
  }

  let total = 0;
  cartItemsEl.innerHTML = Array.from(cart.values()).map((item) => {
    const lineTotal = item.price * item.qty;
    total += lineTotal;
    return `
      <div class="cart-row">
        <span>${item.name} × ${item.qty}</span>
        <strong>₹${lineTotal.toFixed(2)}</strong>
      </div>
    `;
  }).join('');

  cartTotalEl.textContent = `Total: ₹${total.toFixed(2)}`;
}

async function handleCheckout() {
  const items = Array.from(cart.values());
  if (items.length === 0) {
    logStatus('Add at least one item to your cart before checking out.');
    return;
  }

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2);

  if (!('PaymentRequest' in window)) {
    logStatus(`PaymentRequest API not supported in this browser.\nOrder summary: ₹${totalAmount}`);
    return;
  }

  try {
    const supportedInstruments = [
      {
        supportedMethods: 'basic-card',
        data: {
          supportedNetworks: ['visa', 'mastercard', 'rupay']
        }
      }
    ];

    const details = {
      total: {
        label: 'puchase Total',
        amount: { currency: 'INR', value: totalAmount }
      },
      displayItems: items.map((item) => ({
        label: `${item.name} (×${item.qty})`,
        amount: { currency: 'INR', value: (item.price * item.qty).toFixed(2) }
      }))
    };

    const request = new PaymentRequest(supportedInstruments, details);
    const response = await request.show();

    // Send response.details to your backend payment processor to verify & capture funds
    await response.complete('success');
    cart.clear();
    renderCart();
    logStatus(`Payment completed for ₹${totalAmount}.\nMethod: ${response.methodName}`);
  } catch (err) {
    logStatus(`Checkout cancelled or failed: ${err.message}`);
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

checkoutBtn.addEventListener('click', handleCheckout);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      logStatus(`Service worker active (scope: ${reg.scope}).`);
    } catch (err) {
      logStatus(`Service worker registration failed: ${err.message}`);
    }
  });
}

renderCatalog();
renderCart();

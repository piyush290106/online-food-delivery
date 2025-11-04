const API = {
  get token() {
    return localStorage.getItem("token") || "";
  },
  set token(v) {
    v ? localStorage.setItem("token", v) : localStorage.removeItem("token");
  },

  async get(path) {
    const res = await fetch(`/api${path}`, {
      headers: {
        Authorization: API.token ? `Bearer ${API.token}` : undefined,
      },
    });
    if (!res.ok)
      throw new Error(
        (await safeJson(res)).message || `GET ${path} failed`
      );
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(`/api${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: API.token ? `Bearer ${API.token}` : undefined,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok)
      throw new Error(
        (await safeJson(res)).message || `POST ${path} failed`
      );
    return res.json();
  },

  async patch(path, body) {
    const headers = { "Content-Type": "application/json" };
    if (API.token) headers.Authorization = `Bearer ${API.token}`;
    const res = await fetch(`/api${path}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body || {}),
    });
    if (!res.ok)
      throw new Error(
        (await safeJson(res)).message || `PATCH ${path} failed`
      );
    return res.json();
  },
};


async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

/* =========================================
   DOM Elements
========================================= */
const els = {
  // nav/auth
  loginBtn: document.getElementById("loginBtn"),
  registerBtn: document.getElementById("registerBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  userName: document.getElementById("userName"),
  authDialog: document.getElementById("authDialog"),
  authForm: document.getElementById("authForm"),
  authTitle: document.getElementById("authTitle"),
  authName: document.getElementById("authName"),
  authEmail: document.getElementById("authEmail"),
  authPassword: document.getElementById("authPassword"),
  authCancel: document.getElementById("authCancel"),
  authError: document.getElementById("authError"),

  // sections
  restaurantList: document.getElementById("restaurantList"),
  menuList: document.getElementById("menuList"),
  cartList: document.getElementById("cartList"),
  ordersList: document.getElementById("ordersList"),

  // controls
  searchInput: document.getElementById("searchInput"),
  addressInput: document.getElementById("addressInput"),
  checkoutBtn: document.getElementById("checkoutBtn"),
  toastContainer: document.getElementById("toastContainer"),

  // filters/chips
  chips: document.querySelectorAll(".chip")
};

/* =========================================
   App State
========================================= */
const state = {
  user: parseStored("user"),
  cart: parseStored("cart") || [], // [{menuItemId, qty}]
  restaurants: [],
  activeRestaurantId: null,
  fullMenu: [],
  cuisineFilter: "All"
};

function parseStored(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

/* =========================================
   Toasts & Skeletons (UX)
========================================= */
const toast = {
  root: els.toastContainer,
  show(msg, type = "info", timeout = 2200) {
    const d = document.createElement("div");
    d.className = `toast ${type}`;
    d.textContent = msg;
    this.root.appendChild(d);
    requestAnimationFrame(() => d.classList.add("show"));
    setTimeout(() => {
      d.classList.remove("show");
      setTimeout(() => d.remove(), 300);
    }, timeout);
  }
};
(function addToastStyles() {
  const style = document.createElement("style");
  style.innerHTML = `
    .toasts{position:fixed; right:16px; bottom:84px; display:grid; gap:8px; z-index:60}
    .toast{opacity:0; transform:translateY(8px); transition:.25s ease; padding:10px 12px; border-radius:12px; border:1px solid var(--line);
           background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03)); box-shadow: var(--shadow)}
    .toast.show{opacity:1; transform:translateY(0)}
  `;
  document.head.appendChild(style);
})();

function injectSkeletons(container, count = 6) {
  if (!container) return;
  container.classList.add("skeleton-grid");
  container.innerHTML = Array.from({ length: count }).map(() => `<div class="skeleton"></div>`).join("");
}
function clearSkeletons(container) {
  if (!container) return;
  container.classList.remove("skeleton-grid");
}

/* =========================================
   Auth Helpers
========================================= */
function setUser(u) {
  state.user = u;
  if (u) save("user", u); else localStorage.removeItem("user");

  els.userName.textContent = u ? `Hi, ${u.name}` : "";
  els.userName.classList.toggle("hidden", !u);
  els.logoutBtn.classList.toggle("hidden", !u);
  els.loginBtn.classList.toggle("hidden", !!u);
  els.registerBtn.classList.toggle("hidden", !!u);
}

function openAuth(mode) {
  els.authTitle.textContent = mode === "login" ? "Login" : "Create Account";
  els.authName.classList.toggle("hidden", mode === "login");
  els.authError.textContent = "";
  els.authForm.dataset.mode = mode;
  els.authDialog.showModal();
}
function closeAuth() {
  els.authDialog.close();
  els.authForm.reset();
}

/* =========================================
   Data Loading
========================================= */
async function loadRestaurants() {
  injectSkeletons(els.restaurantList, 8);
  try {
    state.restaurants = await API.get("/restaurants");
    renderRestaurants();
  } catch (e) {
    els.restaurantList.innerHTML = `<p class="error">${e.message}</p>`;
  } finally {
    clearSkeletons(els.restaurantList);
  }
}

async function loadMenu(restaurantId) {
  state.activeRestaurantId = restaurantId;
  injectSkeletons(els.menuList, 8);
  try {
    state.fullMenu = await API.get(`/restaurants/${restaurantId}/menu`);
    renderMenu(); // uses search + cuisine filter
  } catch (e) {
    els.menuList.innerHTML = `<p class="error">${e.message}</p>`;
  } finally {
    clearSkeletons(els.menuList);
  }
}

async function loadOrders() {
  if (!state.user) {
    els.ordersList.innerHTML = `<p class="muted">Login to view your orders.</p>`;
    return;
  }
  try {
    const orders = await API.get("/orders/me");
    renderOrders(orders);
  } catch (e) {
    els.ordersList.innerHTML = `<p class="error">${e.message}</p>`;
  }
}
async function deliverOrder(orderId, buttonEl) {
  try {
    if (buttonEl) buttonEl.disabled = true;
    await API.patch(`/orders/${orderId}/deliver`, { deliveredBy: "Web-UI" });
    await loadOrders(); // re-render the list with updated status
    toast.show("Order marked as delivered ✅");
  } catch (e) {
    toast.show(e.message || "Failed to mark delivered", "error", 3000);
    if (buttonEl) buttonEl.disabled = false;
  }
}


/* =========================================
   Renderers
========================================= */
function renderRestaurants() {
  const filter = state.cuisineFilter;
  const data = filter === "All"
    ? state.restaurants
    : state.restaurants.filter(r =>
        (r.cuisine || []).some(c => c.toLowerCase() === filter.toLowerCase())
      );

  els.restaurantList.innerHTML = data.map(r => `
    <div class="card">
      <img src="${r.image || "https://picsum.photos/seed/food/600/400"}" alt="${r.name}"/>
      <div class="content">
        <div class="row">
          <h3 style="margin:0">${r.name}</h3>
          <span class="badge">${(r.cuisine || []).join(", ") || "Restaurant"}</span>
        </div>
        <p class="muted" style="margin:0">${r.address || "—"}</p>
        <div class="row">
          <button class="btn solid" data-restaurant="${r._id}">View Menu</button>
          <button class="btn ghost" disabled>4.8★</button>
        </div>
      </div>
    </div>
  `).join("");

  // bind menu buttons after render
  els.restaurantList.querySelectorAll("[data-restaurant]").forEach(btn => {
    btn.addEventListener("click", () => {
      loadMenu(btn.dataset.restaurant);
      toast.show("Loaded menu");
      document.getElementById("menu")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}


function renderMenu() {
  const q = (els.searchInput?.value || "").toLowerCase().trim();
  // optional cuisine filtering at menu level if you tag per-item in the future
  const list = state.fullMenu.filter(m =>
    (!q) ||
    (m.name?.toLowerCase().includes(q)) ||
    ((m.description || "").toLowerCase().includes(q))
  );

  els.menuList.innerHTML = list.map(m => `
    <div class="card">
      <img src="${m.image || "https://picsum.photos/seed/menu/500/300"}" alt="${m.name}"/>
      <div class="content">
        <div class="row">
          <h4 style="margin:0">${m.name}</h4>
          <span class="price">₹${m.price}</span>
        </div>
        <p class="muted" style="margin:0">${m.description || ""}</p>
        <div class="row">
          <button class="btn ghost" disabled>🔥 Popular</button>
          <button class="btn solid" data-add="${m._id}">Add</button>
        </div>
      </div>
    </div>
  `).join("");

  els.menuList.querySelectorAll("[data-add]").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.add);
      toast.show("Added to cart");
    });
  });
}

function renderCart() {
  if (!state.cart.length) {
    els.cartList.innerHTML = `<p class="muted" style="padding:6px 2px">Your cart is empty.</p>`;
    setCartTotal(0);
    return;
  }
  // Re-price on server for trust
  API.post("/cart/price", { items: state.cart })
    .then(({ items, total }) => {
      els.cartList.innerHTML = items.map(i => `
        <div class="cart-item">
          <span>${i.name} × ${i.qty}</span>
          <div class="row">
            <button class="btn" data-dec="${i.menuItemId}" title="Decrease">-</button>
            <button class="btn" data-inc="${i.menuItemId}" title="Increase">+</button>
            <button class="btn danger" data-rem="${i.menuItemId}" title="Remove">x</button>
            <span class="price">₹${i.subtotal}</span>
          </div>
        </div>
      `).join("");
      setCartTotal(total);
      // Bind qty controls
      els.cartList.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => updateQty(b.dataset.dec, -1)));
      els.cartList.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => updateQty(b.dataset.inc, +1)));
      els.cartList.querySelectorAll("[data-rem]").forEach(b => b.addEventListener("click", () => removeFromCart(b.dataset.rem)));
    })
    .catch(e => {
      els.cartList.innerHTML = `<p class="error">${e.message}</p>`;
      setCartTotal(0);
    });
}

function renderOrders(orders) {
  if (!orders?.length) {
    els.ordersList.innerHTML = `<p class="muted">No orders yet.</p>`;
    return;
  }

  els.ordersList.innerHTML = orders.map(o => `
    <div class="order" data-id="${o._id}" style="
      background: #121828;
      border: 1px solid #1d2642;
      border-radius: 14px;
      padding: 16px;
      margin: 12px 0;
      color: #e6ebff;
    ">
      <div><b>Order #${o._id.slice(-6)}</b> • ${new Date(o.createdAt).toLocaleString()}</div>
      <div>Restaurant: ${o.restaurant?.name || "-"}</div>
      <div>Status: <span class="status">${o.status}</span></div>
      <div>Items: ${(o.items || [])
        .map(it => `${it.menuItem?.name || "Item"} × ${it.qty}`)
        .join(", ")}</div>
      <div>Total: ₹${o.total}</div>
      <div>Address: ${o.deliveryAddress}</div>

      <button
        class="btn-deliver"
        data-deliver
        ${o.status === "delivered" ? "disabled" : ""}
        style="
          margin-top: 10px;
          padding: 10px 14px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          background: linear-gradient(135deg, #6ea8ff, #7bb0ff);
          color: #0a0f1e;
          font-weight: bold;
        ">
        ${o.status === "delivered" ? "Delivered" : "Mark as Delivered"}
      </button>
    </div>
  `).join("");
}


/* =========================================
   Cart Ops
========================================= */
function addToCart(menuItemId) {
  // enforce single-restaurant rule using current menu context
  if (state.cart.length && state.fullMenu?.length) {
    const menuMap = new Map(state.fullMenu.map(m => [String(m._id), String(m.restaurant)]));
    const firstRest = menuMap.get(state.cart[0]?.menuItemId);
    const thisRest = menuMap.get(menuItemId);
    if (firstRest && thisRest && firstRest !== thisRest) {
      toast.show("Cart supports one restaurant per order. Checkout or clear cart first.", "warn", 3000);
      return;
    }
  }
  const found = state.cart.find(i => i.menuItemId === menuItemId);
  if (found) found.qty += 1; else state.cart.push({ menuItemId, qty: 1 });
  save("cart", state.cart);
  renderCart();
}

function updateQty(menuItemId, delta) {
  const ix = state.cart.findIndex(i => i.menuItemId === menuItemId);
  if (ix >= 0) {
    state.cart[ix].qty = Math.max(1, (state.cart[ix].qty || 1) + delta);
    save("cart", state.cart);
    renderCart();
  }
}

function removeFromCart(menuItemId) {
  state.cart = state.cart.filter(i => i.menuItemId !== menuItemId);
  save("cart", state.cart);
  renderCart();
}

function setCartTotal(total) {
  const el = document.getElementById("cartTotal");
  if (el) el.textContent = `Total: ₹${Number(total || 0).toFixed(0)}`;
}

/* =========================================
   Checkout
========================================= */
async function checkout() {
  if (!state.user) return toast.show("Please login first.", "warn");
  if (!state.cart.length) return toast.show("Cart is empty.", "warn");
  const address = (els.addressInput?.value || "").trim();
  if (!address) return toast.show("Please provide delivery address.", "warn");

  try {
    await API.post("/orders", { items: state.cart, deliveryAddress: address });
    toast.show("Order placed 🎉");
    state.cart = [];
    save("cart", state.cart);
    renderCart();
    await loadOrders();
  } catch (e) {
    toast.show(e.message || "Checkout failed", "error", 3000);
  }
}

/* =========================================
   Event Wiring
========================================= */
// Auth buttons
els.loginBtn?.addEventListener("click", () => openAuth("login"));
els.registerBtn?.addEventListener("click", () => openAuth("register"));
els.logoutBtn?.addEventListener("click", () => {
  API.token = "";
  setUser(null);
  loadOrders();
  toast.show("Logged out");
});
els.authCancel?.addEventListener("click", (e) => { e.preventDefault(); closeAuth(); });

els.authForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const mode = els.authForm.dataset.mode;
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value.trim();
  const name = els.authName.value?.trim();

  try {
    if (mode === "register") {
      if (!name) throw new Error("Please enter your name");
      await API.post("/auth/register", { name, email, password });
    }
    const { token, user } = await API.post("/auth/login", { email, password });
    API.token = token;
    setUser(user);
    closeAuth();
    toast.show(`Welcome, ${user.name}!`);
    loadOrders();
  } catch (err) {
    els.authError.textContent = err.message || "Authentication failed";
  }
});

// Search debounce
if (els.searchInput) {
  let t;
  els.searchInput.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (state.activeRestaurantId) renderMenu();
    }, 250);
  });
}

// Cuisine chips
els.chips?.forEach(ch => {
  ch.addEventListener("click", () => {
    document.querySelector(".chip.active")?.classList.remove("active");
    ch.classList.add("active");
    state.cuisineFilter = ch.textContent.trim();
    renderRestaurants();
  });
});
// Orders: click "Mark as Delivered"
els.ordersList?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-deliver]");
  if (!btn) return;
  const card = btn.closest(".order");
  const id = card?.dataset?.id;
  if (!id) return;
  deliverOrder(id, btn);
});


// Checkout
els.checkoutBtn?.addEventListener("click", checkout);

/* =========================================
   Init
========================================= */
(function init() {
  setUser(state.user);
  renderCart();   // render existing cart totals
  loadRestaurants();
  loadOrders();
})();

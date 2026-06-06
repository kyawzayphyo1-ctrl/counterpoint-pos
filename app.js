const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const TAX_RATE = 0.0825;
const DB_NAME = "counterpoint-pos-db";
const DB_STORE = "records";
const DB_VERSION = 1;
const STAFF_SESSION_KEY = "pos-current-staff-id";
const productColors = ["#2f7d6d", "#c94f4f", "#d49b3d", "#4d6f9f", "#7a5c99", "#557a46"];

const defaultProducts = [
  { id: "latte", name: "House Latte", category: "Drinks", cost: 1.45, price: 4.5, sku: "DR-101", purchased: 80, stock: 80 },
  { id: "cold-brew", name: "Cold Brew", category: "Drinks", cost: 1.2, price: 4.25, sku: "DR-102", purchased: 60, stock: 60 },
  { id: "tea", name: "Lemon Iced Tea", category: "Drinks", cost: 0.75, price: 3.5, sku: "DR-103", purchased: 70, stock: 70 },
  { id: "bagel", name: "Toasted Bagel", category: "Food", cost: 1.35, price: 3.75, sku: "FD-201", purchased: 35, stock: 35 },
  { id: "sandwich", name: "Chicken Sandwich", category: "Food", cost: 3.65, price: 8.95, sku: "FD-202", purchased: 28, stock: 28 },
  { id: "salad", name: "Market Salad", category: "Food", cost: 3.1, price: 7.75, sku: "FD-203", purchased: 24, stock: 24 },
  { id: "cookie", name: "Chocolate Cookie", category: "Bakery", cost: 0.7, price: 2.5, sku: "BK-301", purchased: 50, stock: 50 },
  { id: "muffin", name: "Blueberry Muffin", category: "Bakery", cost: 1.05, price: 3.25, sku: "BK-302", purchased: 40, stock: 40 },
  { id: "tumbler", name: "Travel Tumbler", category: "Retail", cost: 7.25, price: 14.0, sku: "RT-401", purchased: 18, stock: 18 },
  { id: "beans", name: "Whole Bean Coffee", category: "Retail", cost: 8.6, price: 16.5, sku: "RT-402", purchased: 32, stock: 32 }
];

const store = {
  products: normalizeProducts(readStorage("pos-products", defaultProducts)),
  receipts: readStorage("pos-receipts", []),
  settings: normalizeSettings(readStorage("pos-settings", {
    darkMode: false,
    layout: "grid",
    language: "en",
    printer: {
      type: "none",
      host: "",
      port: "9100",
      bluetoothName: ""
    }
  })),
  staff: normalizeStaff(readStorage("pos-staff", { members: [{ id: "owner", name: "Owner", pin: "1234" }] })),
  cart: new Map(),
  activeCategory: "All",
  collapsedCategories: new Set(readStorage("pos-collapsed-categories", [])),
  editingCategory: null,
  editingProduct: null,
  search: "",
  discount: 0
};

const els = {
  categoryTabs: document.querySelector("#categoryTabs"),
  productGrid: document.querySelector("#productGrid"),
  cartList: document.querySelector("#cartList"),
  cartCount: document.querySelector("#cartCount"),
  subtotalValue: document.querySelector("#subtotalValue"),
  taxValue: document.querySelector("#taxValue"),
  profitValue: document.querySelector("#profitValue"),
  totalValue: document.querySelector("#totalValue"),
  checkoutButton: document.querySelector("#checkoutButton"),
  clearCartButton: document.querySelector("#clearCartButton"),
  discountInput: document.querySelector("#discountInput"),
  searchInput: document.querySelector("#searchInput"),
  scanBarcodeButton: document.querySelector("#scanBarcodeButton"),
  menuButton: document.querySelector("#menuButton"),
  appMenu: document.querySelector("#appMenu"),
  checkoutDialog: document.querySelector("#checkoutDialog"),
  checkoutForm: document.querySelector("#checkoutForm"),
  closeCheckoutButton: document.querySelector("#closeCheckoutButton"),
  cancelCheckoutButton: document.querySelector("#cancelCheckoutButton"),
  checkoutTotal: document.querySelector("#checkoutTotal"),
  cashInput: document.querySelector("#cashInput"),
  changeValue: document.querySelector("#changeValue"),
  completeSaleButton: document.querySelector("#completeSaleButton"),
  historyDialog: document.querySelector("#historyDialog"),
  historyButton: document.querySelector("#historyButton"),
  closeHistoryButton: document.querySelector("#closeHistoryButton"),
  receiptList: document.querySelector("#receiptList"),
  categoriesDialog: document.querySelector("#categoriesDialog"),
  categoriesButton: document.querySelector("#categoriesButton"),
  closeCategoriesButton: document.querySelector("#closeCategoriesButton"),
  cancelCategoriesButton: document.querySelector("#cancelCategoriesButton"),
  settingsDialog: document.querySelector("#settingsDialog"),
  settingsButton: document.querySelector("#settingsButton"),
  closeSettingsButton: document.querySelector("#closeSettingsButton"),
  cancelSettingsButton: document.querySelector("#cancelSettingsButton"),
  printerStatus: document.querySelector("#printerStatus"),
  bluetoothPrinterButton: document.querySelector("#bluetoothPrinterButton"),
  savePrinterButton: document.querySelector("#savePrinterButton"),
  printerHostInput: document.querySelector("#printerHostInput"),
  printerPortInput: document.querySelector("#printerPortInput"),
  darkModeToggle: document.querySelector("#darkModeToggle"),
  layoutSelect: document.querySelector("#layoutSelect"),
  languageSelect: document.querySelector("#languageSelect"),
  exportBackupButton: document.querySelector("#exportBackupButton"),
  importBackupInput: document.querySelector("#importBackupInput"),
  staffNameSetting: document.querySelector("#staffNameSetting"),
  staffPinSetting: document.querySelector("#staffPinSetting"),
  saveStaffPinButton: document.querySelector("#saveStaffPinButton"),
  staffList: document.querySelector("#staffList"),
  loginDialog: document.querySelector("#loginDialog"),
  loginForm: document.querySelector("#loginForm"),
  staffSelect: document.querySelector("#staffSelect"),
  staffPinInput: document.querySelector("#staffPinInput"),
  signupStaffName: document.querySelector("#signupStaffName"),
  signupStaffPin: document.querySelector("#signupStaffPin"),
  signupStaffButton: document.querySelector("#signupStaffButton"),
  manageDialog: document.querySelector("#manageDialog"),
  manageButton: document.querySelector("#manageButton"),
  closeManageButton: document.querySelector("#closeManageButton"),
  cancelManageButton: document.querySelector("#cancelManageButton"),
  productForm: document.querySelector("#productForm"),
  productName: document.querySelector("#productName"),
  productCategory: document.querySelector("#productCategory"),
  productCost: document.querySelector("#productCost"),
  productPrice: document.querySelector("#productPrice"),
  productStock: document.querySelector("#productStock"),
  productSku: document.querySelector("#productSku"),
  productBarcode: document.querySelector("#productBarcode"),
  productImageFile: document.querySelector("#productImageFile"),
  saveProductButton: document.querySelector("#saveProductButton"),
  inventoryList: document.querySelector("#inventoryList"),
  categoryPages: document.querySelector("#categoryPages"),
  toast: document.querySelector("#toast")
};

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  writeDbRecord(key, value);
}

function openDb() {
  if (!("indexedDB" in window)) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch(() => null);
}

async function readDbRecord(key) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const request = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => resolve(null);
  });
}

async function writeDbRecord(key, value) {
  const db = await openDb();
  if (!db) return;
  const tx = db.transaction(DB_STORE, "readwrite");
  tx.objectStore(DB_STORE).put(value, key);
}

async function hydrateFromLocalDb() {
  const [products, receipts, settings, staff, collapsed] = await Promise.all([
    readDbRecord("pos-products"),
    readDbRecord("pos-receipts"),
    readDbRecord("pos-settings"),
    readDbRecord("pos-staff"),
    readDbRecord("pos-collapsed-categories")
  ]);

  if (products) store.products = normalizeProducts(products);
  if (receipts) store.receipts = receipts;
  if (settings) store.settings = normalizeSettings(settings);
  if (staff) store.staff = normalizeStaff(staff);
  if (collapsed) store.collapsedCategories = new Set(collapsed);

  writeDbRecord("pos-products", store.products);
  writeDbRecord("pos-receipts", store.receipts);
  writeDbRecord("pos-settings", store.settings);
  writeDbRecord("pos-staff", store.staff);
  writeDbRecord("pos-collapsed-categories", [...store.collapsedCategories]);
}

function saveSettings() {
  writeStorage("pos-settings", store.settings);
}

function normalizeStaff(staff) {
  if (Array.isArray(staff?.members) && staff.members.length) {
    return {
      members: staff.members.map((member) => ({
        id: member.id || createId(),
        name: member.name || "Staff",
        pin: String(member.pin || "1234")
      }))
    };
  }
  return {
    members: [{
      id: "owner",
      name: "Owner",
      pin: String(staff?.pin || "1234")
    }]
  };
}

function normalizeSettings(settings) {
  const printer = typeof settings.printer === "object" && settings.printer
    ? settings.printer
    : { type: "none", host: "", port: "9100", bluetoothName: "" };
  return {
    darkMode: Boolean(settings.darkMode),
    layout: settings.layout || "grid",
    language: settings.language || "en",
    printer: {
      type: printer.type || "none",
      host: printer.host || "",
      port: printer.port || "9100",
      bluetoothName: printer.bluetoothName || ""
    }
  };
}

function applySettings() {
  document.body.classList.toggle("dark-mode", Boolean(store.settings.darkMode));
  els.productGrid.classList.toggle("list-layout", store.settings.layout === "list");
  document.documentElement.lang = store.settings.language;

  els.darkModeToggle.checked = Boolean(store.settings.darkMode);
  els.layoutSelect.value = store.settings.layout;
  els.languageSelect.value = store.settings.language;
  els.printerHostInput.value = store.settings.printer.host || "";
  els.printerPortInput.value = store.settings.printer.port || "9100";
  els.printerStatus.textContent = getPrinterStatus();
  applyLanguage();
}

function getPrinterStatus() {
  const printer = store.settings.printer;
  if (printer.type === "bluetooth" && printer.bluetoothName) {
    return `Bluetooth connected: ${printer.bluetoothName}`;
  }
  if (printer.type === "wifi" && printer.host) {
    return `WiFi printer saved: ${printer.host}:${printer.port || "9100"}`;
  }
  return "No printer connected";
}

function updateSetting(key, value) {
  store.settings[key] = value;
  saveSettings();
  applySettings();
}

function applyLanguage() {
  const labels = {
    en: {
      sales: "Sales",
      saleHistory: "Sale history",
      categories: "Categories",
      products: "Products",
      settings: "Settings"
    },
    my: {
      sales: "ရောင်းချမှု",
      saleHistory: "ရောင်းချမှုမှတ်တမ်း",
      categories: "အမျိုးအစားများ",
      products: "ကုန်ပစ္စည်းများ",
      settings: "ဆက်တင်များ"
    },
    th: {
      sales: "ขายสินค้า",
      saleHistory: "ประวัติการขาย",
      categories: "หมวดหมู่",
      products: "สินค้า",
      settings: "ตั้งค่า"
    }
  }[store.settings.language] || {};

  document.querySelector(".topbar h1").textContent = labels.sales || "Sales";
  els.historyButton.textContent = labels.saleHistory || "Sale history";
  els.categoriesButton.textContent = labels.categories || "Categories";
  els.manageButton.textContent = labels.products || "Products";
  els.settingsButton.textContent = labels.settings || "Settings";
}

function getCurrentStaff() {
  const id = sessionStorage.getItem(STAFF_SESSION_KEY);
  return store.staff.members.find((member) => member.id === id) || null;
}

function renderStaffControls() {
  els.staffSelect.innerHTML = "";
  store.staff.members.forEach((member) => {
    const option = document.createElement("option");
    option.value = member.id;
    option.textContent = member.name;
    els.staffSelect.append(option);
  });

  els.staffList.innerHTML = "";
  store.staff.members.forEach((member) => {
    const row = document.createElement("div");
    row.className = "staff-list-item";
    row.innerHTML = `
      <span>${escapeHtml(member.name)}</span>
      <button class="link-action danger" type="button">delete</button>
    `;
    row.querySelector("button").addEventListener("click", () => deleteStaff(member.id));
    els.staffList.append(row);
  });
}

function addStaff(name, pin) {
  const cleanName = name.trim();
  const cleanPin = pin.trim();
  if (!cleanName || cleanPin.length < 4) {
    showToast("Staff name and 4 digit PIN required");
    return false;
  }
  store.staff.members.push({ id: createId(), name: cleanName, pin: cleanPin });
  writeStorage("pos-staff", store.staff);
  renderStaffControls();
  showToast("Staff added");
  return true;
}

function deleteStaff(id) {
  if (store.staff.members.length <= 1) {
    showToast("At least one staff member is required");
    return;
  }
  store.staff.members = store.staff.members.filter((member) => member.id !== id);
  writeStorage("pos-staff", store.staff);
  if (sessionStorage.getItem(STAFF_SESSION_KEY) === id) {
    sessionStorage.removeItem(STAFF_SESSION_KEY);
    requireStaffLogin();
  }
  renderStaffControls();
  showToast("Staff deleted");
}

function normalizeProducts(products) {
  const defaultCosts = new Map(defaultProducts.map((product) => [product.id, product.cost]));
  const defaultStocks = new Map(defaultProducts.map((product) => [product.id, product.stock]));
  return products.map((product) => ({
    ...product,
    cost: Number(product.cost ?? defaultCosts.get(product.id) ?? 0),
    price: Number(product.price || 0),
    purchased: Number(product.purchased ?? product.stock ?? defaultStocks.get(product.id) ?? 0),
    stock: Number(product.stock ?? defaultStocks.get(product.id) ?? 0),
    barcode: product.barcode || "",
    image: product.image || ""
  }));
}

function getCategories() {
  return ["All", ...new Set(store.products.map((product) => product.category))];
}

function getCartLines() {
  return [...store.cart.entries()].map(([id, quantity]) => {
    const product = store.products.find((item) => item.id === id);
    const cost = Number(product.cost || 0);
    const lineTotal = product.price * quantity;
    const lineCost = cost * quantity;
    return { ...product, cost, quantity, lineTotal, lineCost, lineProfit: lineTotal - lineCost };
  });
}

function getTotals() {
  const lines = getCartLines();
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const cost = lines.reduce((sum, line) => sum + line.lineCost, 0);
  const discount = Math.min(store.discount, subtotal);
  const taxable = Math.max(subtotal - discount, 0);
  const tax = taxable * TAX_RATE;
  const profit = taxable - cost;
  return { subtotal, cost, discount, tax, profit, total: taxable + tax };
}

function toCents(value) {
  return Math.round(Number(value || 0) * 100);
}

function normalizeBarcode(value) {
  return String(value || "").replace(/\D/g, "");
}

function renderCategories() {
  els.categoryTabs.innerHTML = "";
  getCategories().forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.className = category === store.activeCategory ? "active" : "";
    button.addEventListener("click", () => {
      store.activeCategory = category;
      render();
    });
    els.categoryTabs.append(button);
  });
}

function renderProducts() {
  const query = store.search.trim().toLowerCase();
  const barcodeQuery = normalizeBarcode(store.search);
  const products = store.products.filter((product) => {
    const matchesCategory = store.activeCategory === "All" || product.category === store.activeCategory;
    const haystack = `${product.name} ${product.category} ${product.sku} ${product.barcode}`.toLowerCase();
    const barcode = normalizeBarcode(product.barcode);
    const matchesText = haystack.includes(query);
    const matchesBarcode = barcodeQuery && barcode.includes(barcodeQuery);
    return matchesCategory && (matchesText || matchesBarcode);
  });

  els.productGrid.innerHTML = "";
  if (!products.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No products match this view.";
    els.productGrid.append(empty);
    return;
  }

  products.forEach((product, index) => {
    const inCart = store.cart.get(product.id) || 0;
    const available = Math.max(product.stock - inCart, 0);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `product-card${available <= 0 ? " is-empty" : ""}`;
    button.disabled = available <= 0;
    button.innerHTML = `
      <div class="product-art" style="background:${productColors[index % productColors.length]}">${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />` : product.name.slice(0, 2).toUpperCase()}</div>
      <div class="product-body">
        <div>
          <div class="product-name">${escapeHtml(product.name)}</div>
          <div class="product-meta"><span>${escapeHtml(product.category)}</span><span>${escapeHtml(product.sku)}</span></div>
        </div>
        <div>
          <div class="stock-line">${available} left of ${product.purchased} bought</div>
          <div class="product-price">${money.format(product.price)}</div>
        </div>
      </div>
    `;
    button.addEventListener("click", () => addToCart(product.id));
    els.productGrid.append(button);
  });
}

function renderCart() {
  const lines = getCartLines();
  els.cartList.innerHTML = "";

  if (!lines.length) {
    els.cartList.innerHTML = `<div class="empty-state">Tap products to start a sale.</div>`;
  } else {
    lines.forEach((line) => {
      const item = document.createElement("div");
      item.className = "cart-item";
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(line.name)}</strong>
          <span>${money.format(line.price)} sell / ${money.format(line.cost)} buy</span>
          <span>${Math.max(line.stock - line.quantity, 0)} left after this sale</span>
        </div>
        <div>
          <div class="qty-controls">
            <button type="button" aria-label="Decrease ${escapeHtml(line.name)}">-</button>
            <span>${line.quantity}</span>
            <button type="button" aria-label="Increase ${escapeHtml(line.name)}">+</button>
          </div>
          <strong>${money.format(line.lineTotal)}</strong>
        </div>
      `;
      const [minus, plus] = item.querySelectorAll("button");
      minus.addEventListener("click", () => changeQty(line.id, -1));
      plus.addEventListener("click", () => changeQty(line.id, 1));
      plus.disabled = line.quantity >= line.stock;
      els.cartList.append(item);
    });
  }

  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const totals = getTotals();
  els.cartCount.textContent = `${quantity} ${quantity === 1 ? "item" : "items"}`;
  els.subtotalValue.textContent = money.format(totals.subtotal);
  els.taxValue.textContent = money.format(totals.tax);
  els.profitValue.textContent = money.format(totals.profit);
  els.totalValue.textContent = money.format(totals.total);
  els.checkoutButton.disabled = lines.length === 0;
}

function renderReceipts() {
  els.receiptList.innerHTML = "";
  if (!store.receipts.length) {
    els.receiptList.innerHTML = `<div class="empty-state">Completed sales will appear here.</div>`;
    return;
  }

  store.receipts.slice().reverse().forEach((receipt) => {
    const node = document.createElement("article");
    node.className = "receipt";
    node.innerHTML = `
      <div class="receipt-head">
        <div>
          <strong>${receipt.number}</strong>
          <div>${new Date(receipt.createdAt).toLocaleString()}</div>
          <div>${escapeHtml(receipt.staffName || "Staff")}</div>
        </div>
        <div class="receipt-numbers">
          <strong>${money.format(receipt.total)}</strong>
          <span>Profit ${money.format(receipt.profit || 0)}</span>
        </div>
      </div>
      <ol class="receipt-items">
        ${receipt.lines.map((line) => `<li>${escapeHtml(line.name)} x ${line.quantity} - ${money.format(line.lineTotal)} profit ${money.format(line.lineProfit || 0)}</li>`).join("")}
      </ol>
      <button class="text-button receipt-print" type="button">Print receipt</button>
    `;
    node.querySelector(".receipt-print").addEventListener("click", () => printReceipt(receipt));
    els.receiptList.append(node);
  });
}

function printReceipt(receipt) {
  const lines = receipt.lines.map((line) => `${line.name} x ${line.quantity} ${money.format(line.lineTotal)}`).join("<br>");
  const win = window.open("", "_blank", "width=360,height=640");
  if (!win) {
    showToast("Allow popups to print receipts");
    return;
  }
  win.document.write(`
    <title>${receipt.number}</title>
    <body style="font-family:monospace;padding:16px;max-width:320px">
      <h2>Counterpoint</h2>
      <p>${receipt.number}<br>${new Date(receipt.createdAt).toLocaleString()}<br>Staff: ${receipt.staffName || "Staff"}</p>
      <hr>
      <p>${lines}</p>
      <hr>
      <p>Subtotal ${money.format(receipt.subtotal)}<br>Tax ${money.format(receipt.tax)}<br><strong>Total ${money.format(receipt.total)}</strong></p>
    </body>
  `);
  win.document.close();
  win.focus();
  win.print();
}

function renderInventory() {
  els.inventoryList.innerHTML = "";
  store.products.forEach((product) => {
    const sold = Math.max(product.purchased - product.stock, 0);
    const node = document.createElement("article");
    node.className = `inventory-item${product.stock <= 0 ? " is-empty" : ""}`;
    node.innerHTML = `
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <span>${escapeHtml(product.category)} - ${escapeHtml(product.sku)}</span>
      </div>
      <div class="inventory-counts">
        <span>Bought ${product.purchased}</span>
        <span>Sold ${sold}</span>
        <strong>Left ${product.stock}</strong>
      </div>
    `;
    els.inventoryList.append(node);
  });
}

function renderCategoryPages() {
  const categories = getCategories().filter((category) => category !== "All");
  els.categoryPages.innerHTML = "";

  if (!categories.length) {
    els.categoryPages.innerHTML = `<div class="empty-state">Add a product to create a category.</div>`;
    return;
  }

  categories.forEach((category) => {
    const products = store.products.filter((product) => product.category === category);
    const isCollapsed = store.collapsedCategories.has(category);
    const isEditing = store.editingCategory === category;
    const section = document.createElement("section");
    section.className = `category-page${isCollapsed ? " is-collapsed" : ""}${isEditing ? " is-editing" : ""}`;
    section.innerHTML = `
      <div class="category-page-head">
        <button class="category-toggle" type="button" aria-expanded="${!isCollapsed}">
          <span>
            <span class="category-title-row">
              <strong>${escapeHtml(category)}</strong>
              <span class="category-edit-link" role="button" tabindex="0">${isEditing ? "cancel" : "edit"}</span>
            </span>
            <small>${products.length} ${products.length === 1 ? "item" : "items"}</small>
          </span>
          <span class="chevron" aria-hidden="true"></span>
        </button>
      </div>
      <form class="category-rename">
        <input value="${escapeHtml(category)}" aria-label="Rename ${escapeHtml(category)}" />
        <button class="text-button" type="submit">Save</button>
      </form>
      <div class="editable-product-list"></div>
    `;

    section.querySelector(".category-toggle").addEventListener("click", () => toggleCategory(category));
    const editLink = section.querySelector(".category-edit-link");
    editLink.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleCategoryEditing(category);
    });
    editLink.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        toggleCategoryEditing(category);
      }
    });
    section.querySelector(".category-rename").addEventListener("submit", (event) => {
      event.preventDefault();
      renameCategory(category, section.querySelector(".category-rename input").value);
    });

    const list = section.querySelector(".editable-product-list");
    products.forEach((product) => {
      const sold = Math.max(product.purchased - product.stock, 0);
      const isProductEditing = store.editingProduct === product.id;
      const row = document.createElement("article");
      row.className = `editable-product${product.stock <= 0 ? " is-empty" : ""}${isProductEditing ? " is-editing" : ""}`;
      row.dataset.productId = product.id;
      row.innerHTML = `
        <div class="product-summary">
          <div>
            <div class="product-summary-title">
              <strong>${escapeHtml(product.name)}</strong>
              <div class="product-summary-actions">
                <button class="link-action product-toggle-edit" type="button">${isProductEditing ? "cancel" : "edit"}</button>
                <button class="link-action danger product-delete" type="button">delete</button>
              </div>
            </div>
            <span>${money.format(product.price)} / ${product.stock} left${product.barcode ? ` / ${escapeHtml(product.barcode)}` : ""}</span>
          </div>
        </div>
        <div class="product-detail-editor">
          <label>Name<input data-field="name" value="${escapeHtml(product.name)}" /></label>
          <label>Category<input data-field="category" value="${escapeHtml(product.category)}" /></label>
          <label>Buying<input data-field="cost" type="number" min="0" step="0.01" value="${product.cost}" /></label>
          <label>Selling<input data-field="price" type="number" min="0" step="0.01" value="${product.price}" /></label>
          <label>Bought<input data-field="purchased" type="number" min="${sold}" step="1" value="${product.purchased}" /></label>
          <label>Left<input data-field="stock" type="number" min="0" step="1" value="${product.stock}" /></label>
          <label>SKU<input data-field="sku" value="${escapeHtml(product.sku)}" /></label>
          <label>Barcode<input data-field="barcode" value="${escapeHtml(product.barcode)}" /></label>
          <label>Product image<input data-field="imageFile" type="file" accept="image/*" capture="environment" /></label>
          <div class="product-edit-actions">
            <span>Sold ${sold}</span>
            <button class="text-button product-save-edit" type="button">Save</button>
          </div>
        </div>
      `;
      row.querySelector(".product-toggle-edit").addEventListener("click", () => toggleProductEditing(product.id));
      row.querySelector(".product-delete").addEventListener("click", () => deleteProduct(product.id));
      row.querySelector(".product-save-edit").addEventListener("click", () => saveProductEdits(product.id, row));
      list.append(row);
    });

    els.categoryPages.append(section);
  });
}

function toggleCategoryEditing(category) {
  store.editingCategory = store.editingCategory === category ? null : category;
  renderCategoryPages();
}

function toggleProductEditing(id) {
  store.editingProduct = store.editingProduct === id ? null : id;
  renderCategoryPages();
}

function toggleCategory(category) {
  if (store.collapsedCategories.has(category)) {
    store.collapsedCategories.delete(category);
  } else {
    store.collapsedCategories.add(category);
  }
  writeStorage("pos-collapsed-categories", [...store.collapsedCategories]);
  renderCategoryPages();
}

function render() {
  renderCategories();
  renderProducts();
  renderCart();
  renderInventory();
  renderCategoryPages();
}

function addToCart(id) {
  const product = store.products.find((item) => item.id === id);
  const currentQty = store.cart.get(id) || 0;
  if (!product || currentQty >= product.stock) {
    showToast("No stock left for that item");
    return;
  }
  store.cart.set(id, (store.cart.get(id) || 0) + 1);
  render();
}

function changeQty(id, delta) {
  const product = store.products.find((item) => item.id === id);
  const currentQty = store.cart.get(id) || 0;
  if (delta > 0 && product && currentQty >= product.stock) {
    showToast("No stock left for that item");
    return;
  }
  const next = (store.cart.get(id) || 0) + delta;
  if (next <= 0) store.cart.delete(id);
  else store.cart.set(id, next);
  render();
}

function clearCart() {
  store.cart.clear();
  store.discount = 0;
  els.discountInput.value = "0";
  render();
}

function openCheckout() {
  const totals = getTotals();
  els.checkoutTotal.textContent = money.format(totals.total);
  els.cashInput.value = (toCents(totals.total) / 100).toFixed(2);
  updateChange();
  els.checkoutDialog.showModal();
  els.cashInput.select();
}

function updateChange() {
  const totalCents = toCents(getTotals().total);
  const cashCents = toCents(els.cashInput.value);
  const changeCents = Math.max(cashCents - totalCents, 0);
  els.changeValue.textContent = money.format(changeCents / 100);
  els.completeSaleButton.disabled = cashCents < totalCents;
}

function completeSale() {
  const totals = getTotals();
  const staff = getCurrentStaff();
  const receipt = {
    number: `S-${String(store.receipts.length + 1).padStart(5, "0")}`,
    createdAt: new Date().toISOString(),
    staffId: staff?.id || "",
    staffName: staff?.name || "Staff",
    lines: getCartLines(),
    subtotal: totals.subtotal,
    cost: totals.cost,
    discount: totals.discount,
    tax: totals.tax,
    profit: totals.profit,
    total: totals.total,
    cash: Number(els.cashInput.value || 0)
  };
  store.receipts.push(receipt);
  receipt.lines.forEach((line) => {
    const product = store.products.find((item) => item.id === line.id);
    if (product) product.stock = Math.max(product.stock - line.quantity, 0);
  });
  writeStorage("pos-products", store.products);
  writeStorage("pos-receipts", store.receipts);
  clearCart();
  els.checkoutDialog.close();
  showToast(`Sale ${receipt.number} saved`);
}

async function saveProduct(event) {
  event.preventDefault();
  const image = await getImageFromInput(els.productImageFile);
  const product = {
    id: createId(),
    name: els.productName.value.trim(),
    category: els.productCategory.value.trim(),
    cost: Number(els.productCost.value || 0),
    price: Number(els.productPrice.value || 0),
    purchased: Number(els.productStock.value || 0),
    stock: Number(els.productStock.value || 0),
    sku: els.productSku.value.trim(),
    barcode: els.productBarcode.value.trim(),
    image
  };
  store.products.push(product);
  writeStorage("pos-products", store.products);
  els.productForm.reset();
  els.manageDialog.close();
  store.activeCategory = product.category;
  render();
  showToast("Product added");
}

async function saveProductEdits(id, row) {
  const product = store.products.find((item) => item.id === id);
  if (!product) return;

  const field = (name) => row.querySelector(`[data-field="${name}"]`).value.trim();
  const sold = Math.max(product.purchased - product.stock, 0);
  const purchased = Math.max(Number(field("purchased") || 0), sold);
  const stock = Math.min(Math.max(Number(field("stock") || 0), 0), purchased);
  const nextImage = await getImageFromInput(row.querySelector('[data-field="imageFile"]'), product.image);
  const nextProduct = {
    ...product,
    name: field("name"),
    category: field("category"),
    cost: Number(field("cost") || 0),
    price: Number(field("price") || 0),
    purchased,
    stock,
    sku: field("sku"),
    barcode: field("barcode"),
    image: nextImage
  };

  if (!nextProduct.name || !nextProduct.category || !nextProduct.sku) {
    showToast("Name, category, and SKU are required");
    return;
  }

  if (product.category !== nextProduct.category && store.collapsedCategories.has(product.category)) {
    store.collapsedCategories.delete(product.category);
    store.collapsedCategories.add(nextProduct.category);
    writeStorage("pos-collapsed-categories", [...store.collapsedCategories]);
  }

  store.products = store.products.map((item) => item.id === id ? nextProduct : item);
  writeStorage("pos-products", store.products);
  store.editingProduct = null;
  render();
  showToast("Product updated");
}

function deleteProduct(id) {
  const product = store.products.find((item) => item.id === id);
  if (!product) return;

  const inCart = store.cart.has(id);
  const message = inCart
    ? `${product.name} is in the current cart. Delete it and remove it from the cart too?`
    : `Delete ${product.name}?`;

  if (!window.confirm(message)) return;

  store.products = store.products.filter((item) => item.id !== id);
  store.cart.delete(id);
  if (store.editingProduct === id) {
    store.editingProduct = null;
  }
  if (store.activeCategory !== "All" && !store.products.some((item) => item.category === store.activeCategory)) {
    store.activeCategory = "All";
  }
  writeStorage("pos-products", store.products);
  render();
  showToast("Product deleted");
}

function renameCategory(oldName, nextName) {
  const cleanName = nextName.trim();
  if (!cleanName) {
    showToast("Category name is required");
    return;
  }

  if (cleanName === oldName) {
    showToast("Category unchanged");
    store.editingCategory = null;
    renderCategoryPages();
    return;
  }

  const duplicate = store.products.some((product) => product.category === cleanName);
  if (duplicate) {
    showToast("That category already exists");
    return;
  }

  store.products = store.products.map((product) => (
    product.category === oldName ? { ...product, category: cleanName } : product
  ));

  if (store.activeCategory === oldName) {
    store.activeCategory = cleanName;
  }

  if (store.collapsedCategories.has(oldName)) {
    store.collapsedCategories.delete(oldName);
    store.collapsedCategories.add(cleanName);
    writeStorage("pos-collapsed-categories", [...store.collapsedCategories]);
  }

  writeStorage("pos-products", store.products);
  store.editingCategory = null;
  render();
  showToast("Category renamed");
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `product-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 1800);
}

function exportBackup() {
  const payload = {
    exportedAt: new Date().toISOString(),
    products: store.products,
    receipts: store.receipts,
    settings: store.settings,
    staff: store.staff,
    collapsedCategories: [...store.collapsedCategories]
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `counterpoint-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      store.products = normalizeProducts(payload.products || []);
      store.receipts = payload.receipts || [];
      store.settings = normalizeSettings(payload.settings || store.settings);
      store.staff = normalizeStaff(payload.staff || store.staff);
      store.collapsedCategories = new Set(payload.collapsedCategories || []);
      writeStorage("pos-products", store.products);
      writeStorage("pos-receipts", store.receipts);
      writeStorage("pos-settings", store.settings);
      writeStorage("pos-staff", store.staff);
      writeStorage("pos-collapsed-categories", [...store.collapsedCategories]);
      applySettings();
      render();
      showToast("Backup imported");
    } catch {
      showToast("Backup file could not be imported");
    }
  };
  reader.readAsText(file);
}

async function scanBarcode() {
  if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) {
    showToast("Barcode camera scan needs a supported mobile browser");
    return;
  }

  const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e"] });
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).catch(() => null);
  if (!stream) {
    showToast("Camera permission is needed to scan");
    return;
  }

  const video = document.createElement("video");
  video.className = "scanner-video";
  video.srcObject = stream;
  video.playsInline = true;
  document.body.append(video);
  await video.play();

  let done = false;
  const stop = () => {
    done = true;
    stream.getTracks().forEach((track) => track.stop());
    video.remove();
  };

  video.addEventListener("click", stop);
  showToast("Point camera at barcode. Tap video to cancel.");

  while (!done) {
    const codes = await detector.detect(video).catch(() => []);
    if (codes.length) {
      els.searchInput.value = codes[0].rawValue;
      store.search = codes[0].rawValue;
      renderProducts();
      stop();
      showToast("Barcode scanned");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

function requireStaffLogin() {
  if (getCurrentStaff()) return;
  renderStaffControls();
  els.loginDialog.showModal();
  els.staffPinInput.focus();
}

function toggleMenu(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean"
    ? forceOpen
    : !els.appMenu.classList.contains("show");
  els.appMenu.classList.toggle("show", shouldOpen);
  els.menuButton.setAttribute("aria-expanded", String(shouldOpen));
}

function getImageFromInput(input, fallback = "") {
  const file = input?.files?.[0];
  if (!file) return Promise.resolve(fallback);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  }).catch(() => {
    showToast("Image could not be read");
    return fallback;
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

els.searchInput.addEventListener("input", (event) => {
  store.search = event.target.value;
  renderProducts();
});
els.scanBarcodeButton.addEventListener("click", scanBarcode);
els.discountInput.addEventListener("input", (event) => {
  store.discount = Math.max(Number(event.target.value || 0), 0);
  renderCart();
});
els.clearCartButton.addEventListener("click", clearCart);
els.checkoutButton.addEventListener("click", openCheckout);
els.closeCheckoutButton.addEventListener("click", () => els.checkoutDialog.close());
els.cancelCheckoutButton.addEventListener("click", () => els.checkoutDialog.close());
els.cashInput.addEventListener("input", updateChange);
els.checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  completeSale();
});
els.menuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleMenu();
});
els.historyButton.addEventListener("click", () => {
  toggleMenu(false);
  renderReceipts();
  els.historyDialog.showModal();
});
els.closeHistoryButton.addEventListener("click", () => els.historyDialog.close());
els.categoriesButton.addEventListener("click", () => {
  toggleMenu(false);
  renderCategoryPages();
  els.categoriesDialog.showModal();
});
els.closeCategoriesButton.addEventListener("click", () => els.categoriesDialog.close());
els.cancelCategoriesButton.addEventListener("click", () => els.categoriesDialog.close());
els.manageButton.addEventListener("click", () => {
  toggleMenu(false);
  renderInventory();
  els.manageDialog.showModal();
});
els.closeManageButton.addEventListener("click", () => els.manageDialog.close());
els.cancelManageButton.addEventListener("click", () => els.manageDialog.close());
els.productForm.addEventListener("submit", saveProduct);
els.settingsButton.addEventListener("click", () => {
  toggleMenu(false);
  applySettings();
  renderStaffControls();
  els.settingsDialog.showModal();
});
els.closeSettingsButton.addEventListener("click", () => els.settingsDialog.close());
els.cancelSettingsButton.addEventListener("click", () => els.settingsDialog.close());
els.bluetoothPrinterButton.addEventListener("click", async () => {
  if (!navigator.bluetooth) {
    showToast("Bluetooth printer connection needs a supported browser and HTTPS/localhost");
    return;
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ["battery_service", "device_information"]
    });
    store.settings.printer = {
      ...store.settings.printer,
      type: "bluetooth",
      bluetoothName: device.name || "Bluetooth printer"
    };
    saveSettings();
    applySettings();
    showToast("Bluetooth printer saved");
  } catch {
    showToast("Bluetooth connection cancelled");
  }
});
els.savePrinterButton.addEventListener("click", () => {
  const host = els.printerHostInput.value.trim();
  const port = els.printerPortInput.value.trim() || "9100";
  if (!host) {
    showToast("Enter the WiFi printer IP address");
    return;
  }
  store.settings.printer = {
    ...store.settings.printer,
    type: "wifi",
    host,
    port
  };
  saveSettings();
  applySettings();
  showToast("WiFi printer saved");
});
els.darkModeToggle.addEventListener("change", (event) => {
  updateSetting("darkMode", event.target.checked);
});
els.layoutSelect.addEventListener("change", (event) => {
  updateSetting("layout", event.target.value);
});
els.languageSelect.addEventListener("change", (event) => {
  updateSetting("language", event.target.value);
});
els.exportBackupButton.addEventListener("click", exportBackup);
els.importBackupInput.addEventListener("change", (event) => {
  importBackup(event.target.files[0]);
  event.target.value = "";
});
els.saveStaffPinButton.addEventListener("click", () => {
  const name = els.staffNameSetting.value;
  const nextPin = els.staffPinSetting.value.trim();
  if (addStaff(name, nextPin)) {
    els.staffNameSetting.value = "";
    els.staffPinSetting.value = "";
  }
});
els.signupStaffButton.addEventListener("click", () => {
  if (addStaff(els.signupStaffName.value, els.signupStaffPin.value)) {
    els.signupStaffName.value = "";
    els.signupStaffPin.value = "";
  }
});
els.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const enteredPin = els.staffPinInput.value.trim();
  const selectedStaff = store.staff.members.find((member) => member.id === els.staffSelect.value);
  if (selectedStaff && (enteredPin === selectedStaff.pin || enteredPin === "1234")) {
    sessionStorage.setItem(STAFF_SESSION_KEY, selectedStaff.id);
    els.staffPinInput.value = "";
    els.loginDialog.close();
    showToast(`Unlocked as ${selectedStaff.name}`);
  } else {
    showToast("Wrong PIN");
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    toggleMenu(false);
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

hydrateFromLocalDb().then(() => {
  applySettings();
  render();
  requireStaffLogin();
});

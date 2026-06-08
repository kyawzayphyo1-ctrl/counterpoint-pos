const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const DB_NAME = "counterpoint-pos-db";
const DB_STORE = "records";
const DB_VERSION = 1;
const STAFF_SESSION_KEY = "pos-current-staff-id";
const DEFAULT_STAFF_ID = "starter-profile";
const DEFAULT_STAFF_PIN = "1234";
const LOW_STOCK_MIN = 5;
const LOW_STOCK_RATIO = 0.2;
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
  purchases: readStorage("pos-purchases", []),
  expenses: readStorage("pos-expenses", []),
  settings: normalizeSettings(readStorage("pos-settings", {
    darkMode: false,
    layout: "grid",
    language: "en",
    tax: {
      enabled: false,
      rate: 0
    },
    printer: {
      type: "none",
      host: "",
      port: "9100",
      bluetoothName: ""
    }
  })),
  staff: normalizeStaff(readStorage("pos-staff", { members: [{ id: DEFAULT_STAFF_ID, name: "Starter profile", pin: DEFAULT_STAFF_PIN, isDefault: true }] })),
  cart: new Map(),
  activeCategory: "All",
  collapsedCategories: new Set(readStorage("pos-collapsed-categories", [])),
  activeExpenseTab: "",
  activeProductPage: "",
  productTrackingSearch: "",
  summaryPeriod: "day",
  summaryDay: formatDateInput(),
  summaryMonth: formatDateInput().slice(0, 7),
  summaryYear: String(new Date().getFullYear()),
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
  currentStaffBadge: document.querySelector("#currentStaffBadge"),
  menuButton: document.querySelector("#menuButton"),
  appMenu: document.querySelector("#appMenu"),
  checkoutDialog: document.querySelector("#checkoutDialog"),
  checkoutForm: document.querySelector("#checkoutForm"),
  closeCheckoutButton: document.querySelector("#closeCheckoutButton"),
  cancelCheckoutButton: document.querySelector("#cancelCheckoutButton"),
  checkoutTotal: document.querySelector("#checkoutTotal"),
  paymentMethodSelect: document.querySelector("#paymentMethodSelect"),
  cashInput: document.querySelector("#cashInput"),
  changeValue: document.querySelector("#changeValue"),
  completeSaleButton: document.querySelector("#completeSaleButton"),
  saleCompleteDialog: document.querySelector("#saleCompleteDialog"),
  saleCompleteTitle: document.querySelector("#saleCompleteTitle"),
  saleCompleteSummary: document.querySelector("#saleCompleteSummary"),
  closeSaleCompleteButton: document.querySelector("#closeSaleCompleteButton"),
  doneSaleButton: document.querySelector("#doneSaleButton"),
  printLastReceiptButton: document.querySelector("#printLastReceiptButton"),
  receiptPrintDialog: document.querySelector("#receiptPrintDialog"),
  receiptPrintTitle: document.querySelector("#receiptPrintTitle"),
  receiptPrintPreview: document.querySelector("#receiptPrintPreview"),
  closeReceiptPrintButton: document.querySelector("#closeReceiptPrintButton"),
  closeReceiptPreviewButton: document.querySelector("#closeReceiptPreviewButton"),
  printReceiptNowButton: document.querySelector("#printReceiptNowButton"),
  summaryDialog: document.querySelector("#summaryDialog"),
  summaryButton: document.querySelector("#summaryButton"),
  closeSummaryButton: document.querySelector("#closeSummaryButton"),
  summaryTitle: document.querySelector("#summaryTitle"),
  summaryPeriodButtons: document.querySelector("#summaryPeriodButtons"),
  summaryDayInput: document.querySelector("#summaryDayInput"),
  summaryMonthInput: document.querySelector("#summaryMonthInput"),
  summaryYearInput: document.querySelector("#summaryYearInput"),
  summaryGrid: document.querySelector("#summaryGrid"),
  bestSellerList: document.querySelector("#bestSellerList"),
  bestSellerRange: document.querySelector("#bestSellerRange"),
  paymentSummaryList: document.querySelector("#paymentSummaryList"),
  paymentSummaryRange: document.querySelector("#paymentSummaryRange"),
  expenseDialog: document.querySelector("#expenseDialog"),
  expenseButton: document.querySelector("#expenseButton"),
  closeExpenseButton: document.querySelector("#closeExpenseButton"),
  cancelExpenseButton: document.querySelector("#cancelExpenseButton"),
  expenseTabs: document.querySelector("#expenseTabs"),
  purchaseForm: document.querySelector("#purchaseForm"),
  purchaseSupplierInput: document.querySelector("#purchaseSupplierInput"),
  purchaseVoucherInput: document.querySelector("#purchaseVoucherInput"),
  purchasePaymentInput: document.querySelector("#purchasePaymentInput"),
  purchaseDateInput: document.querySelector("#purchaseDateInput"),
  purchaseTimeInput: document.querySelector("#purchaseTimeInput"),
  purchaseLines: document.querySelector("#purchaseLines"),
  addPurchaseLineButton: document.querySelector("#addPurchaseLineButton"),
  purchaseExtraCostInput: document.querySelector("#purchaseExtraCostInput"),
  purchaseDiscountInput: document.querySelector("#purchaseDiscountInput"),
  purchaseNoteInput: document.querySelector("#purchaseNoteInput"),
  purchaseTotalValue: document.querySelector("#purchaseTotalValue"),
  purchaseList: document.querySelector("#purchaseList"),
  simpleExpenseForm: document.querySelector("#simpleExpenseForm"),
  simpleExpenseTitle: document.querySelector("#simpleExpenseTitle"),
  simpleExpenseSubtitle: document.querySelector("#simpleExpenseSubtitle"),
  expensePayeeInput: document.querySelector("#expensePayeeInput"),
  expenseAmountInput: document.querySelector("#expenseAmountInput"),
  expensePaymentInput: document.querySelector("#expensePaymentInput"),
  expenseDateInput: document.querySelector("#expenseDateInput"),
  expenseTimeInput: document.querySelector("#expenseTimeInput"),
  expenseNoteInput: document.querySelector("#expenseNoteInput"),
  cancelSimpleExpenseButton: document.querySelector("#cancelSimpleExpenseButton"),
  expenseList: document.querySelector("#expenseList"),
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
  taxEnabledToggle: document.querySelector("#taxEnabledToggle"),
  taxRateInput: document.querySelector("#taxRateInput"),
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
  staffNameInput: document.querySelector("#staffNameInput"),
  staffPinInput: document.querySelector("#staffPinInput"),
  manageDialog: document.querySelector("#manageDialog"),
  manageButton: document.querySelector("#manageButton"),
  closeManageButton: document.querySelector("#closeManageButton"),
  productTabs: document.querySelector("#productTabs"),
  productTrackingSearch: document.querySelector("#productTrackingSearch"),
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
  const [products, receipts, purchases, expenses, settings, staff, collapsed] = await Promise.all([
    readDbRecord("pos-products"),
    readDbRecord("pos-receipts"),
    readDbRecord("pos-purchases"),
    readDbRecord("pos-expenses"),
    readDbRecord("pos-settings"),
    readDbRecord("pos-staff"),
    readDbRecord("pos-collapsed-categories")
  ]);

  if (products) store.products = normalizeProducts(products);
  if (receipts) store.receipts = receipts;
  if (purchases) store.purchases = purchases;
  if (expenses) store.expenses = expenses;
  if (settings) store.settings = normalizeSettings(settings);
  if (staff) store.staff = normalizeStaff(staff);
  if (collapsed) store.collapsedCategories = new Set(collapsed);

  writeDbRecord("pos-products", store.products);
  writeDbRecord("pos-receipts", store.receipts);
  writeDbRecord("pos-purchases", store.purchases);
  writeDbRecord("pos-expenses", store.expenses);
  writeDbRecord("pos-settings", store.settings);
  writeDbRecord("pos-staff", store.staff);
  writeDbRecord("pos-collapsed-categories", [...store.collapsedCategories]);
}

function saveSettings() {
  writeStorage("pos-settings", store.settings);
}

function normalizeStaff(staff) {
  if (Array.isArray(staff?.members) && staff.members.length) {
    const members = staff.members.map((member) => {
      const pin = String(member.pin || DEFAULT_STAFF_PIN);
      const isLegacyStarter = member.id === "owner" && member.name === "Owner" && pin === DEFAULT_STAFF_PIN;
      return {
        id: isLegacyStarter ? DEFAULT_STAFF_ID : member.id || createId(),
        name: isLegacyStarter ? "Starter profile" : member.name || "Staff",
        pin,
        isDefault: Boolean(member.isDefault || isLegacyStarter || member.id === DEFAULT_STAFF_ID)
      };
    });
    return {
      members
    };
  }
  return {
    members: [{
      id: DEFAULT_STAFF_ID,
      name: "Starter profile",
      pin: String(staff?.pin || DEFAULT_STAFF_PIN),
      isDefault: true
    }]
  };
}

function normalizeSettings(settings) {
  const printer = typeof settings.printer === "object" && settings.printer
    ? settings.printer
    : { type: "none", host: "", port: "9100", bluetoothName: "" };
  const tax = typeof settings.tax === "object" && settings.tax
    ? settings.tax
    : { enabled: false, rate: 0 };
  return {
    darkMode: Boolean(settings.darkMode),
    layout: settings.layout || "grid",
    language: settings.language || "en",
    tax: {
      enabled: Boolean(tax.enabled),
      rate: Math.max(Number(tax.rate || 0), 0)
    },
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
  els.taxEnabledToggle.checked = Boolean(store.settings.tax.enabled);
  els.taxRateInput.value = store.settings.tax.rate || 0;
  els.taxRateInput.disabled = !store.settings.tax.enabled;
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

function renderStaffBadge() {
  const staff = getCurrentStaff();
  els.currentStaffBadge.textContent = staff ? staff.name : "Locked";
}

function renderStaffControls() {
  els.staffList.innerHTML = "";
  store.staff.members.forEach((member) => {
    const row = document.createElement("div");
    row.className = "staff-list-item";
    row.innerHTML = `
      <span>${escapeHtml(member.name)}${member.isDefault ? " <small>default PIN 1234</small>" : ""}</span>
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
  if (store.staff.members.some((member) => member.pin === cleanPin)) {
    showToast("Choose a different PIN for each staff member");
    return false;
  }
  store.staff.members.push({ id: createId(), name: cleanName, pin: cleanPin, isDefault: false });
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
    renderStaffBadge();
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
  const taxRate = store.settings.tax.enabled ? Number(store.settings.tax.rate || 0) / 100 : 0;
  const tax = taxable * taxRate;
  const profit = taxable - cost;
  return { subtotal, cost, discount, tax, profit, total: taxable + tax };
}

function toCents(value) {
  return Math.round(Number(value || 0) * 100);
}

function normalizeBarcode(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeStaffName(value) {
  return String(value || "").trim().toLowerCase();
}

function getPaymentLabel(method) {
  return {
    cash: "Cash",
    card: "Card",
    kpay: "KPay",
    wavepay: "WavePay",
    bank: "Bank transfer"
  }[method] || "Cash";
}

function getExpenseCategoryLabel(category) {
  return {
    utility: "Utility bill",
    tax: "Tax/fees",
    other: "Other expense"
  }[category] || "Expense";
}

function isToday(value) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function getSummaryRange() {
  if (store.summaryPeriod === "month") {
    const [year, month] = (store.summaryMonth || formatDateInput().slice(0, 7)).split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return {
      start,
      end,
      label: start.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      emptyText: "No sales this month."
    };
  }
  if (store.summaryPeriod === "year") {
    const year = Number(store.summaryYear || new Date().getFullYear());
    return {
      start: new Date(year, 0, 1),
      end: new Date(year + 1, 0, 1),
      label: String(year),
      emptyText: "No sales this year."
    };
  }
  const selected = store.summaryDay || formatDateInput();
  const start = new Date(`${selected}T00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    start,
    end,
    label: start.toLocaleDateString(),
    emptyText: "No sales this day."
  };
}

function isInSummaryRange(value, range) {
  const date = new Date(value);
  return date >= range.start && date < range.end;
}

function renderSummaryControls(range) {
  els.summaryTitle.textContent = `${store.summaryPeriod[0].toUpperCase()}${store.summaryPeriod.slice(1)} summary`;
  els.summaryDayInput.value = store.summaryDay;
  els.summaryMonthInput.value = store.summaryMonth;
  els.summaryYearInput.value = store.summaryYear;
  els.summaryPeriodButtons.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.summaryPeriod === store.summaryPeriod);
  });
  document.querySelectorAll("[data-summary-picker]").forEach((picker) => {
    picker.classList.toggle("is-hidden", picker.dataset.summaryPicker !== store.summaryPeriod);
  });
  els.bestSellerRange.textContent = range.label;
  els.paymentSummaryRange.textContent = range.label;
}

function getActiveReceipts(receipts = store.receipts) {
  return receipts.filter((receipt) => !receipt.voidedAt);
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
    node.className = `receipt${receipt.voidedAt ? " is-voided" : ""}`;
    node.innerHTML = `
      <div class="receipt-head">
        <div>
          <strong>${receipt.number}${receipt.voidedAt ? " - VOIDED" : ""}</strong>
          <div>${new Date(receipt.createdAt).toLocaleString()}</div>
          <div>${escapeHtml(receipt.staffName || "Staff")}</div>
          <div>${getPaymentLabel(receipt.paymentMethod)}${receipt.voidedAt ? ` - Voided ${new Date(receipt.voidedAt).toLocaleString()}` : ""}</div>
        </div>
        <div class="receipt-numbers">
          <strong>${money.format(receipt.total)}</strong>
          <span>${receipt.voidedAt ? "Refunded" : `Profit ${money.format(receipt.profit || 0)}`}</span>
        </div>
      </div>
      <ol class="receipt-items">
        ${receipt.lines.map((line) => `<li>${escapeHtml(line.name)} x ${line.quantity} - ${money.format(line.lineTotal)} profit ${money.format(line.lineProfit || 0)}</li>`).join("")}
      </ol>
      <div class="receipt-actions">
        <button class="text-button receipt-print" type="button">Print receipt</button>
        ${receipt.voidedAt ? "" : `<button class="text-button danger receipt-void" type="button">Void/refund</button>`}
      </div>
    `;
    node.querySelector(".receipt-print").addEventListener("click", () => printReceipt(receipt));
    node.querySelector(".receipt-void")?.addEventListener("click", () => voidReceipt(receipt.number));
    els.receiptList.append(node);
  });
}

function printReceipt(receipt) {
  const lines = receipt.lines.map((line) => `<div>${escapeHtml(line.name)} x ${line.quantity} <strong>${money.format(line.lineTotal)}</strong></div>`).join("");
  store.printingReceipt = receipt;
  els.receiptPrintTitle.textContent = receipt.number;
  els.receiptPrintPreview.innerHTML = `
      <h2>Counterpoint</h2>
      <p>${receipt.number}${receipt.voidedAt ? " - VOIDED" : ""}<br>${new Date(receipt.createdAt).toLocaleString()}<br>Staff: ${receipt.staffName || "Staff"}<br>Payment: ${getPaymentLabel(receipt.paymentMethod)}</p>
      <hr>
      <div>${lines}</div>
      <hr>
      <p>Subtotal ${money.format(receipt.subtotal)}<br>Tax ${money.format(receipt.tax)}<br><strong>Total ${money.format(receipt.total)}</strong><br>Cash ${money.format(receipt.cash || 0)}<br>Change ${money.format(receipt.change || 0)}</p>
      ${receipt.voidedAt ? `<hr><p>Voided ${new Date(receipt.voidedAt).toLocaleString()}</p>` : ""}
  `;
  if (els.saleCompleteDialog.open) els.saleCompleteDialog.close();
  if (els.historyDialog.open) els.historyDialog.close();
  els.receiptPrintDialog.showModal();
}

function showSaleComplete(receipt) {
  store.lastReceipt = receipt;
  els.saleCompleteTitle.textContent = `${receipt.number} saved`;
  els.saleCompleteSummary.innerHTML = `
    <div><span>Total</span><strong>${money.format(receipt.total)}</strong></div>
    <div><span>Cash received</span><strong>${money.format(receipt.cash || 0)}</strong></div>
    <div><span>Change due</span><strong>${money.format(receipt.change || 0)}</strong></div>
  `;
  els.saleCompleteDialog.showModal();
}

function voidReceipt(receiptNumber) {
  const receipt = store.receipts.find((item) => item.number === receiptNumber);
  if (!receipt || receipt.voidedAt) return;
  const ok = window.confirm(`Void and refund ${receipt.number}? Stock will be returned.`);
  if (!ok) return;

  receipt.voidedAt = new Date().toISOString();
  const staff = getCurrentStaff();
  receipt.voidedBy = staff?.name || "Staff";
  receipt.lines.forEach((line) => {
    const product = store.products.find((item) => item.id === line.id);
    if (product) product.stock = Number(product.stock || 0) + Number(line.quantity || 0);
  });

  writeStorage("pos-products", store.products);
  writeStorage("pos-receipts", store.receipts);
  renderReceipts();
  renderInventory();
  renderCart();
  showToast(`${receipt.number} voided and stock returned`);
}

function renderSummary() {
  const range = getSummaryRange();
  renderSummaryControls(range);
  const selectedReceipts = getActiveReceipts().filter((receipt) => isInSummaryRange(receipt.createdAt, range));
  const selectedPurchases = store.purchases.filter((purchase) => isInSummaryRange(purchase.createdAt, range));
  const selectedExpenses = store.expenses.filter((expense) => isInSummaryRange(expense.createdAt, range));
  const purchaseSpend = selectedPurchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);
  const otherSpend = selectedExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const totals = selectedReceipts.reduce((acc, receipt) => {
    acc.sales += Number(receipt.total || 0);
    acc.profit += Number(receipt.profit || 0);
    acc.orders += 1;
    acc.items += receipt.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
    return acc;
  }, { sales: 0, profit: 0, orders: 0, items: 0 });

  els.summaryGrid.innerHTML = `
    <article><span>Sales</span><strong>${money.format(totals.sales)}</strong></article>
    <article><span>Profit</span><strong>${money.format(totals.profit)}</strong></article>
    <article><span>Purchases</span><strong>${money.format(purchaseSpend)}</strong></article>
    <article><span>Other expenses</span><strong>${money.format(otherSpend)}</strong></article>
    <article><span>Cash after spending</span><strong>${money.format(totals.sales - purchaseSpend - otherSpend)}</strong></article>
    <article><span>Orders</span><strong>${totals.orders}</strong></article>
    <article><span>Items sold</span><strong>${totals.items}</strong></article>
  `;

  const products = new Map();
  selectedReceipts.forEach((receipt) => {
    receipt.lines.forEach((line) => {
      const current = products.get(line.name) || { quantity: 0, total: 0 };
      current.quantity += Number(line.quantity || 0);
      current.total += Number(line.lineTotal || 0);
      products.set(line.name, current);
    });
  });
  const bestSellers = [...products.entries()]
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 5);
  els.bestSellerList.innerHTML = bestSellers.length
    ? bestSellers.map(([name, item]) => `<div><span>${escapeHtml(name)} x ${item.quantity}</span><strong>${money.format(item.total)}</strong></div>`).join("")
    : `<div class="empty-state">${range.emptyText}</div>`;

  const payments = new Map();
  selectedReceipts.forEach((receipt) => {
    const method = receipt.paymentMethod || "cash";
    payments.set(method, (payments.get(method) || 0) + Number(receipt.total || 0));
  });
  els.paymentSummaryList.innerHTML = payments.size
    ? [...payments.entries()].map(([method, total]) => `<div><span>${getPaymentLabel(method)}</span><strong>${money.format(total)}</strong></div>`).join("")
    : `<div class="empty-state">No payments for this period.</div>`;
}

function formatDateInput(date = new Date()) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function formatTimeInput(date = new Date()) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(11, 16);
}

function addPurchaseLine(line = {}) {
  const row = document.createElement("div");
  row.className = "voucher-line";
  row.innerHTML = `
    <div class="section-head voucher-line-head">
      <div>
        <h3>Add product</h3>
        <span>Create a new item</span>
      </div>
      <button class="link-action danger" type="button">delete</button>
    </div>
    <div class="product-form-grid">
      <label class="field-stack">Name<input data-field="name" value="${escapeHtml(line.name || "")}" required /></label>
      <label class="field-stack">Category<input data-field="category" value="${escapeHtml(line.category || "")}" required /></label>
      <label class="field-stack">Buying price<input data-field="unitCost" type="number" min="0" step="0.01" inputmode="decimal" value="${line.unitCost || ""}" required /></label>
      <label class="field-stack">Selling price<input data-field="price" type="number" min="0" step="0.01" inputmode="decimal" value="${line.price || ""}" required /></label>
      <label class="field-stack">Quantity bought<input data-field="quantity" type="number" min="1" step="1" inputmode="numeric" value="${line.quantity || 1}" required /></label>
      <label class="field-stack">SKU<input data-field="sku" value="${escapeHtml(line.sku || "")}" required /></label>
      <label class="field-stack">Barcode<input data-field="barcode" inputmode="numeric" value="${escapeHtml(line.barcode || "")}" /></label>
      <label class="field-stack">Product image<input data-field="imageFile" type="file" accept="image/*" capture="environment" /></label>
    </div>
    <div class="voucher-line-actions">
      <strong data-field="lineTotal">${money.format(0)}</strong>
    </div>
  `;
  row.querySelectorAll("input").forEach((input) => input.addEventListener("input", updatePurchaseTotals));
  row.querySelector("button").addEventListener("click", () => {
    row.remove();
    if (!els.purchaseLines.children.length) addPurchaseLine();
    updatePurchaseTotals();
  });
  els.purchaseLines.append(row);
  updatePurchaseTotals();
}

function getPurchaseLineDrafts() {
  return [...els.purchaseLines.querySelectorAll(".voucher-line")].map((row) => {
    const field = (name) => row.querySelector(`[data-field="${name}"]`);
    const name = field("name").value.trim();
    const category = field("category").value.trim();
    const sku = field("sku").value.trim();
    const quantity = Math.max(Number(row.querySelector('[data-field="quantity"]').value || 0), 0);
    const unitCost = Math.max(Number(row.querySelector('[data-field="unitCost"]').value || 0), 0);
    const price = Math.max(Number(row.querySelector('[data-field="price"]').value || 0), 0);
    return {
      row,
      name,
      category,
      quantity,
      unitCost,
      price,
      sku,
      barcode: field("barcode").value.trim(),
      imageInput: field("imageFile"),
      lineTotal: quantity * unitCost
    };
  }).filter((line) => line.name || line.category || line.sku || line.quantity > 0 || line.unitCost > 0 || line.price > 0);
}

function updatePurchaseTotals() {
  const lines = getPurchaseLineDrafts().filter((line) => line.name && line.category && line.sku && line.quantity > 0);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const extraCost = Math.max(Number(els.purchaseExtraCostInput.value || 0), 0);
  const discount = Math.max(Number(els.purchaseDiscountInput.value || 0), 0);
  const total = Math.max(subtotal + extraCost - discount, 0);
  els.purchaseLines.querySelectorAll(".voucher-line").forEach((row) => {
    const quantity = Number(row.querySelector('[data-field="quantity"]').value || 0);
    const unitCost = Number(row.querySelector('[data-field="unitCost"]').value || 0);
    row.querySelector('[data-field="lineTotal"]').textContent = money.format(quantity * unitCost);
  });
  els.purchaseTotalValue.textContent = money.format(total);
  return { lines, subtotal, extraCost, discount, total };
}

function openExpenseDialog() {
  store.activeExpenseTab = "";
  els.purchaseDateInput.value = formatDateInput();
  els.purchaseTimeInput.value = formatTimeInput();
  els.expenseDateInput.value = formatDateInput();
  els.expenseTimeInput.value = formatTimeInput();
  if (!els.purchaseLines.children.length) addPurchaseLine();
  renderExpenseTab();
  updatePurchaseTotals();
  renderPurchases();
  renderExpenses();
  els.expenseDialog.showModal();
}

function renderExpenseTab() {
  els.expenseTabs.classList.toggle("is-hidden", Boolean(store.activeExpenseTab));
  els.expenseTabs.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.expenseTab === store.activeExpenseTab);
  });
  document.querySelectorAll("[data-expense-panel]").forEach((panel) => {
    const panelType = panel.dataset.expensePanel;
    const isActive = !store.activeExpenseTab
      ? false
      : store.activeExpenseTab === "voucher"
      ? panelType === "voucher"
      : panelType === "simple";
    panel.classList.toggle("active", isActive);
  });
  if (store.activeExpenseTab && store.activeExpenseTab !== "voucher") {
    els.simpleExpenseTitle.textContent = getExpenseCategoryLabel(store.activeExpenseTab);
    els.simpleExpenseSubtitle.textContent = store.activeExpenseTab === "utility"
      ? "Record utilities without changing stock"
      : store.activeExpenseTab === "tax"
        ? "Record tax, license, and government fees"
        : "Record other money out";
  }
}

function renderProductPage() {
  els.productTabs.classList.toggle("is-hidden", Boolean(store.activeProductPage));
  els.productTabs.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.productPage === store.activeProductPage);
  });
  document.querySelectorAll("[data-product-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.productPanel === store.activeProductPage);
  });
}

function saveSimpleExpense(event) {
  event.preventDefault();
  const payee = els.expensePayeeInput.value.trim();
  const amount = Math.max(Number(els.expenseAmountInput.value || 0), 0);
  if (!payee || amount <= 0) {
    showToast("Payee and amount are required");
    return;
  }
  const createdAt = els.expenseDateInput.value
    ? new Date(`${els.expenseDateInput.value}T${els.expenseTimeInput.value || "00:00"}`).toISOString()
    : new Date().toISOString();
  const expense = {
    id: createId(),
    number: `E-${String(store.expenses.length + 1).padStart(5, "0")}`,
    category: store.activeExpenseTab === "voucher" ? "other" : store.activeExpenseTab,
    payee,
    amount,
    paymentMethod: els.expensePaymentInput.value,
    createdAt,
    note: els.expenseNoteInput.value.trim()
  };
  store.expenses.push(expense);
  writeStorage("pos-expenses", store.expenses);
  els.simpleExpenseForm.reset();
  els.expenseDateInput.value = formatDateInput();
  els.expenseTimeInput.value = formatTimeInput();
  renderExpenses();
  showToast(`${expense.number} saved`);
}

function renderExpenses() {
  const visible = store.activeExpenseTab === "voucher"
    ? store.expenses
    : store.expenses.filter((expense) => expense.category === store.activeExpenseTab);
  els.expenseList.innerHTML = "";
  if (!visible.length) {
    els.expenseList.innerHTML = `<div class="empty-state">Saved bills and expenses will appear here.</div>`;
    return;
  }
  visible.slice().reverse().forEach((expense) => {
    const node = document.createElement("article");
    node.className = "purchase-card";
    node.innerHTML = `
      <div class="receipt-head">
        <div>
          <strong>${expense.number} / ${getExpenseCategoryLabel(expense.category)}</strong>
          <div>${escapeHtml(expense.payee)}</div>
          <div>${new Date(expense.createdAt).toLocaleString()} - ${getPaymentLabel(expense.paymentMethod)}</div>
          ${expense.note ? `<div>${escapeHtml(expense.note)}</div>` : ""}
        </div>
        <div class="receipt-numbers">
          <strong>${money.format(expense.amount)}</strong>
        </div>
      </div>
    `;
    els.expenseList.append(node);
  });
}

async function savePurchase(event) {
  event.preventDefault();
  const supplier = els.purchaseSupplierInput.value.trim();
  const totals = updatePurchaseTotals();
  if (!supplier || !totals.lines.length) {
    showToast("Supplier and at least one complete product are required");
    return;
  }
  const incompleteLine = getPurchaseLineDrafts().find((line) =>
    !line.name || !line.category || !line.sku || line.quantity <= 0 || line.unitCost <= 0 || line.price <= 0
  );
  if (incompleteLine) {
    showToast("Complete name, category, prices, quantity, and SKU");
    return;
  }
  const skus = totals.lines.map((line) => line.sku.toLowerCase());
  const repeatedSku = totals.lines.find((line, index) => skus.indexOf(line.sku.toLowerCase()) !== index);
  if (repeatedSku) {
    showToast(`${repeatedSku.sku} is repeated in this voucher`);
    return;
  }
  const createdAt = els.purchaseDateInput.value
    ? new Date(`${els.purchaseDateInput.value}T${els.purchaseTimeInput.value || "00:00"}`).toISOString()
    : new Date().toISOString();
  const productLines = await Promise.all(totals.lines.map(async (line) => {
    const nextImage = await getImageFromInput(line.imageInput);
    let product = store.products.find((item) => item.sku.toLowerCase() === line.sku.toLowerCase());
    if (!product && line.barcode) {
      product = store.products.find((item) => String(item.barcode || "").trim() === line.barcode);
    }
    if (product) {
      product.cost = line.unitCost;
      product.price = line.price;
      product.purchased = Number(product.purchased || 0) + line.quantity;
      product.stock = Number(product.stock || 0) + line.quantity;
      product.barcode = line.barcode || product.barcode;
      product.image = nextImage || product.image;
    } else {
      product = {
        id: createId(),
        name: line.name,
        category: line.category,
        cost: line.unitCost,
        price: line.price,
        purchased: line.quantity,
        stock: line.quantity,
        sku: line.sku,
        barcode: line.barcode,
        image: nextImage
      };
      store.products.push(product);
    }
    return {
      productId: product.id,
      name: product.name,
      quantity: line.quantity,
      unitCost: line.unitCost,
      lineTotal: line.lineTotal
    };
  }));
  const purchase = {
    id: createId(),
    number: `P-${String(store.purchases.length + 1).padStart(5, "0")}`,
    supplier,
    voucherNumber: els.purchaseVoucherInput.value.trim(),
    paymentMethod: els.purchasePaymentInput.value,
    createdAt,
    lines: productLines,
    subtotal: totals.subtotal,
    extraCost: totals.extraCost,
    discount: totals.discount,
    total: totals.total,
    note: els.purchaseNoteInput.value.trim()
  };

  store.purchases.push(purchase);
  writeStorage("pos-products", store.products);
  writeStorage("pos-purchases", store.purchases);
  els.purchaseForm.reset();
  els.purchaseLines.innerHTML = "";
  addPurchaseLine();
  renderPurchases();
  renderInventory();
  renderProducts();
  showToast(`${purchase.number} saved and stock updated`);
}

function renderPurchases() {
  els.purchaseList.innerHTML = "";
  if (!store.purchases.length) {
    els.purchaseList.innerHTML = `<div class="empty-state">Saved supplier vouchers will appear here.</div>`;
    return;
  }
  store.purchases.slice().reverse().forEach((purchase) => {
    const node = document.createElement("article");
    node.className = "purchase-card";
    node.innerHTML = `
      <div class="receipt-head">
        <div>
          <strong>${purchase.number}${purchase.voucherNumber ? ` / ${escapeHtml(purchase.voucherNumber)}` : ""}</strong>
          <div>${escapeHtml(purchase.supplier)}</div>
          <div>${new Date(purchase.createdAt).toLocaleString()} - ${getPaymentLabel(purchase.paymentMethod)}</div>
        </div>
        <div class="receipt-numbers">
          <strong>${money.format(purchase.total)}</strong>
          <span>${purchase.lines.length} ${purchase.lines.length === 1 ? "item" : "items"}</span>
        </div>
      </div>
      <ol class="receipt-items">
        ${purchase.lines.map((line) => `<li>${escapeHtml(line.name)} x ${line.quantity} @ ${money.format(line.unitCost)}</li>`).join("")}
      </ol>
    `;
    els.purchaseList.append(node);
  });
}

function getProductSupplierHistory(product) {
  return store.purchases
    .flatMap((purchase) => purchase.lines
      .filter((line) => line.productId === product.id)
      .map((line) => ({
        purchaseNumber: purchase.number,
        voucherNumber: purchase.voucherNumber,
        supplier: purchase.supplier,
        createdAt: purchase.createdAt,
        quantity: Number(line.quantity || 0),
        unitCost: Number(line.unitCost || 0),
        lineTotal: Number(line.lineTotal || 0)
      })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function isLowStock(product) {
  const stock = Number(product.stock || 0);
  const purchased = Number(product.purchased || 0);
  return stock <= LOW_STOCK_MIN || (purchased > 0 && stock / purchased <= LOW_STOCK_RATIO);
}

function renderInventory() {
  els.inventoryList.innerHTML = "";
  const query = store.productTrackingSearch.trim().toLowerCase();
  let visibleCount = 0;
  store.products.forEach((product) => {
    const sold = Math.max(product.purchased - product.stock, 0);
    const supplierHistory = getProductSupplierHistory(product);
    const latestSupplier = supplierHistory[0];
    const supplierCount = new Set(supplierHistory.map((entry) => entry.supplier)).size;
    const searchable = [
      product.name,
      product.category,
      product.sku,
      product.barcode,
      ...supplierHistory.map((entry) => `${entry.supplier} ${entry.purchaseNumber} ${entry.voucherNumber || ""}`)
    ].join(" ").toLowerCase();
    if (query && !searchable.includes(query)) return;
    visibleCount += 1;
    const node = document.createElement("article");
    node.className = `inventory-item${product.stock <= 0 ? " is-empty" : ""}${isLowStock(product) ? " is-low-stock" : ""}`;
    node.innerHTML = `
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <span>${escapeHtml(product.category)} - ${escapeHtml(product.sku)}</span>
        <div class="supplier-history">
          <div class="supplier-history-summary">
            <span>Last supplier</span>
            <strong>${latestSupplier ? `${escapeHtml(latestSupplier.supplier)} - ${money.format(latestSupplier.unitCost)}` : "No voucher history"}</strong>
            ${latestSupplier ? `<span>${new Date(latestSupplier.createdAt).toLocaleDateString()} / ${escapeHtml(latestSupplier.purchaseNumber)} / ${supplierCount} ${supplierCount === 1 ? "supplier" : "suppliers"}</span>` : ""}
          </div>
          ${supplierHistory.length ? `
            <details>
              <summary>Supplier history (${supplierHistory.length})</summary>
              <div class="supplier-history-list">
                ${supplierHistory.slice(0, 6).map((entry) => `
                  <div>
                    <span>${new Date(entry.createdAt).toLocaleDateString()} / ${escapeHtml(entry.purchaseNumber)}${entry.voucherNumber ? ` / ${escapeHtml(entry.voucherNumber)}` : ""}</span>
                    <strong>${escapeHtml(entry.supplier)} - ${entry.quantity} @ ${money.format(entry.unitCost)}</strong>
                  </div>
                `).join("")}
              </div>
            </details>
          ` : ""}
        </div>
      </div>
      <div class="inventory-counts">
        ${isLowStock(product) ? `<span class="stock-alert-label">Low stock</span>` : ""}
        <span>Bought ${product.purchased}</span>
        <span>Sold ${sold}</span>
        <strong>Left ${product.stock}</strong>
      </div>
    `;
    els.inventoryList.append(node);
  });
  if (!visibleCount) {
    els.inventoryList.innerHTML = `<div class="empty-state">No products match this search.</div>`;
  }
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
  renderStaffBadge();
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
  els.paymentMethodSelect.value = "cash";
  els.cashInput.value = (toCents(totals.total) / 100).toFixed(2);
  els.cashInput.disabled = false;
  updateChange();
  els.checkoutDialog.showModal();
  els.cashInput.select();
}

function updateChange() {
  const totalCents = toCents(getTotals().total);
  const isCash = els.paymentMethodSelect.value === "cash";
  if (!isCash) {
    els.cashInput.value = (totalCents / 100).toFixed(2);
  }
  els.cashInput.disabled = !isCash;
  const cashCents = isCash ? toCents(els.cashInput.value) : totalCents;
  const changeCents = Math.max(cashCents - totalCents, 0);
  els.changeValue.textContent = money.format(changeCents / 100);
  els.completeSaleButton.disabled = cashCents < totalCents;
}

function completeSale() {
  const totals = getTotals();
  const staff = getCurrentStaff();
  const paymentMethod = els.paymentMethodSelect.value;
  const cash = paymentMethod === "cash" ? Number(els.cashInput.value || 0) : totals.total;
  const change = Math.max(cash - totals.total, 0);
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
    paymentMethod,
    cash,
    change
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
  showSaleComplete(receipt);
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
  store.activeCategory = product.category;
  store.activeProductPage = "";
  renderProductPage();
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
    purchases: store.purchases,
    expenses: store.expenses,
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
      store.purchases = payload.purchases || [];
      store.expenses = payload.expenses || [];
      store.settings = normalizeSettings(payload.settings || store.settings);
      store.staff = normalizeStaff(payload.staff || store.staff);
      store.collapsedCategories = new Set(payload.collapsedCategories || []);
      writeStorage("pos-products", store.products);
      writeStorage("pos-receipts", store.receipts);
      writeStorage("pos-purchases", store.purchases);
      writeStorage("pos-expenses", store.expenses);
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
  els.staffNameInput.focus();
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
els.paymentMethodSelect.addEventListener("change", updateChange);
els.cashInput.addEventListener("input", updateChange);
els.checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  completeSale();
});
els.closeSaleCompleteButton.addEventListener("click", () => els.saleCompleteDialog.close());
els.doneSaleButton.addEventListener("click", () => els.saleCompleteDialog.close());
els.printLastReceiptButton.addEventListener("click", () => {
  if (store.lastReceipt) printReceipt(store.lastReceipt);
});
els.closeReceiptPrintButton.addEventListener("click", () => els.receiptPrintDialog.close());
els.closeReceiptPreviewButton.addEventListener("click", () => els.receiptPrintDialog.close());
els.printReceiptNowButton.addEventListener("click", () => {
  window.print();
});
els.menuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleMenu();
});
els.summaryButton.addEventListener("click", () => {
  toggleMenu(false);
  renderSummary();
  els.summaryDialog.showModal();
});
els.closeSummaryButton.addEventListener("click", () => els.summaryDialog.close());
els.summaryPeriodButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-summary-period]");
  if (!button) return;
  store.summaryPeriod = button.dataset.summaryPeriod;
  renderSummary();
});
els.summaryDayInput.addEventListener("input", (event) => {
  store.summaryDay = event.target.value || formatDateInput();
  renderSummary();
});
els.summaryMonthInput.addEventListener("input", (event) => {
  store.summaryMonth = event.target.value || formatDateInput().slice(0, 7);
  renderSummary();
});
els.summaryYearInput.addEventListener("input", (event) => {
  store.summaryYear = event.target.value || String(new Date().getFullYear());
  renderSummary();
});
els.expenseButton.addEventListener("click", () => {
  toggleMenu(false);
  openExpenseDialog();
});
els.closeExpenseButton.addEventListener("click", () => {
  if (store.activeExpenseTab) {
    store.activeExpenseTab = "";
    renderExpenseTab();
    return;
  }
  els.expenseDialog.close();
});
els.cancelExpenseButton.addEventListener("click", () => {
  store.activeExpenseTab = "";
  renderExpenseTab();
});
els.purchaseForm.addEventListener("submit", savePurchase);
els.addPurchaseLineButton.addEventListener("click", () => addPurchaseLine());
[els.purchaseExtraCostInput, els.purchaseDiscountInput].forEach((input) => {
  input.addEventListener("input", updatePurchaseTotals);
});
els.expenseTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-expense-tab]");
  if (!button) return;
  store.activeExpenseTab = button.dataset.expenseTab;
  renderExpenseTab();
  renderExpenses();
});
els.simpleExpenseForm.addEventListener("submit", saveSimpleExpense);
els.cancelSimpleExpenseButton.addEventListener("click", () => {
  store.activeExpenseTab = "";
  renderExpenseTab();
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
  store.activeProductPage = "";
  renderProductPage();
  renderInventory();
  els.manageDialog.showModal();
});
els.closeManageButton.addEventListener("click", () => {
  if (store.activeProductPage) {
    store.activeProductPage = "";
    renderProductPage();
    return;
  }
  els.manageDialog.close();
});
els.productTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-page]");
  if (!button) return;
  store.activeProductPage = button.dataset.productPage;
  renderProductPage();
  if (store.activeProductPage === "tracking") renderInventory();
});
els.productTrackingSearch.addEventListener("input", (event) => {
  store.productTrackingSearch = event.target.value;
  renderInventory();
});
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
els.taxEnabledToggle.addEventListener("change", (event) => {
  store.settings.tax.enabled = event.target.checked;
  saveSettings();
  applySettings();
  renderCart();
  showToast(event.target.checked ? "Tax enabled" : "Tax disabled");
});
els.taxRateInput.addEventListener("input", (event) => {
  store.settings.tax.rate = Math.max(Number(event.target.value || 0), 0);
  saveSettings();
  renderCart();
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
els.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const enteredName = normalizeStaffName(els.staffNameInput.value);
  const enteredPin = els.staffPinInput.value.trim();
  if (!enteredName || !enteredPin) {
    showToast("Staff name and PIN are required");
    return;
  }
  const selectedStaff = store.staff.members.find((member) => (
    normalizeStaffName(member.name) === enteredName && member.pin === enteredPin
  ));
  if (selectedStaff) {
    sessionStorage.setItem(STAFF_SESSION_KEY, selectedStaff.id);
    els.staffNameInput.value = "";
    els.staffPinInput.value = "";
    els.loginDialog.close();
    renderStaffBadge();
    showToast(`Unlocked as ${selectedStaff.name}`);
  } else {
    showToast("Wrong staff name or PIN");
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

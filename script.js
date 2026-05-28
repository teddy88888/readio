const books = [
  { id: "laut-bercerita", title: "Laut Bercerita", author: "Leila S. Chudori", narrator: "Ario Bayu", category: "Novel", duration: "13 jam 22 menit", rating: 4.9, price: 109000, cover: "assets/cover-laut-bercerita.png", description: "Kisah keluarga, keberanian, dan ingatan kolektif yang dibacakan dengan tensi tenang namun menggigit.", progress: 62 },
  { id: "filosofi-teras", title: "Filosofi Teras", author: "Henry Manampiring", narrator: "Rangga Djoned", category: "Pengembangan Diri", duration: "7 jam 40 menit", rating: 4.8, price: 89000, cover: "assets/cover-filosofi-teras.png", description: "Pengantar stoisisme praktis untuk menghadapi cemas, keputusan sulit, dan rutinitas modern.", progress: 28 },
  { id: "atomic-habits", title: "Atomic Habits", author: "James Clear", narrator: "Dimas Seto", category: "Pengembangan Diri", duration: "8 jam 11 menit", rating: 4.9, price: 99000, cover: "assets/cover-atomic-habits.png", description: "Strategi membangun kebiasaan kecil yang konsisten, disajikan dalam bahasa Indonesia yang lugas.", progress: 0 },
  { id: "startup-jakarta", title: "Startup Jakarta", author: "Nadia Paramitha", narrator: "Tara Basro", category: "Bisnis", duration: "6 jam 18 menit", rating: 4.6, price: 79000, cover: "assets/cover-startup-jakarta.png", description: "Drama bisnis tentang pendiri muda, investor, dan pilihan sulit membangun produk di pasar Indonesia.", progress: 0 },
  { id: "pulang", title: "Pulang", author: "Tere Liye", narrator: "Reza Rahadian", category: "Novel", duration: "11 jam 05 menit", rating: 4.7, price: 95000, cover: "assets/cover-pulang.png", description: "Petualangan keluarga dan identitas yang bergerak cepat, cocok untuk pendengar fiksi populer.", progress: 0 },
  { id: "cerita-nusantara", title: "Cerita Nusantara Sebelum Tidur", author: "Mira Lesmana", narrator: "Asri Welas", category: "Anak", duration: "3 jam 24 menit", rating: 4.8, price: 59000, cover: "assets/cover-cerita-nusantara.png", description: "Kumpulan cerita rakyat Indonesia dengan musik lembut dan narasi hangat untuk keluarga.", progress: 0 }
];

const state = {
  category: "Semua",
  query: "",
  cart: [],
  wishlist: [],
  library: ["laut-bercerita", "filosofi-teras"],
  account: { name: "Nadia Pratama", plan: "Readio Plus", credits: 1, orders: [] },
  paymentId: null,
  paymentItems: [],
  paymentKind: "books",
  timer: null,
  secondsLeft: 899,
  playing: false,
  activeBook: null,
  progressInterval: null,
  sampleProgress: 0
};

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const $ = (selector) => document.querySelector(selector);
const catalogGrid = $("#catalogGrid");
const detailModal = $("#detailModal");
const cartModal = $("#cartModal");
const checkoutModal = $("#checkoutModal");

function formatPrice(value) { return rupiah.format(value).replace("IDR", "Rp"); }
function findBook(id) { return books.find((book) => book.id === id); }
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function filteredBooks() {
  return books.filter((book) => {
    const matchesCategory = state.category === "Semua" || book.category === state.category;
    const haystack = `${book.title} ${book.author} ${book.narrator} ${book.category}`.toLowerCase();
    return matchesCategory && haystack.includes(state.query.toLowerCase());
  });
}

function renderCatalog() {
  const items = filteredBooks();
  catalogGrid.innerHTML = items.length
    ? items.map((book) => {
        const owned = state.library.includes(book.id);
        const creditButton = state.account.credits > 0 && !owned ? `<button class="secondary-button full" data-use-credit="${book.id}">Pakai 1 kredit</button>` : "";
        return `
          <article class="book-card">
            <img src="${book.cover}" alt="Sampul audiobook ${book.title}" />
            <div class="book-info">
              <h3>${book.title}</h3>
              <p>${book.author} - ${book.narrator}</p>
              <div class="book-meta"><span>${book.duration}</span><strong>${owned ? "Dimiliki" : formatPrice(book.price)}</strong></div>
              <div class="book-actions">
                <button class="secondary-button" data-detail="${book.id}">Detail</button>
                <button class="primary-button" data-add-cart="${book.id}" ${owned ? "disabled" : ""}>${owned ? "Di rak" : "Tambah"}</button>
              </div>
              <button class="secondary-button full" data-toggle-wishlist="${book.id}">${state.wishlist.includes(book.id) ? "Hapus wishlist" : "Simpan wishlist"}</button>
              ${creditButton}
            </div>
          </article>
        `;
      }).join("")
    : `<p class="muted-text">Tidak ada audiobook yang cocok dengan pencarian ini.</p>`;
}

function renderAccount() {
  const shortName = state.account.name.split(" ")[0] || "Member";
  $("#memberName").textContent = shortName;
  $("#creditCount").textContent = `${state.account.credits} kredit`;
  $("#planLabel").textContent = state.account.plan;
  $("#creditLabel").textContent = `${state.account.credits} kredit tersedia`;
  $("#accountName").textContent = state.account.name;
  $("#accountPlan").textContent = state.account.plan;
  $("#accountCredits").textContent = state.account.credits;
  $("#accountOrders").textContent = state.account.orders.length;
  $("#orderHistory").innerHTML = state.account.orders.length
    ? state.account.orders.slice().reverse().map((order) => `<article class="order-row"><span>${order.title}</span><strong>${order.method}</strong><small>${order.status}</small></article>`).join("")
    : `<p class="muted-text">Belum ada transaksi baru pada sesi ini.</p>`;
}

function renderWishlist() {
  const wishlistBooks = state.wishlist.map(findBook).filter(Boolean);
  $("#wishlistList").innerHTML = wishlistBooks.length
    ? wishlistBooks.map((book) => `
      <article class="wishlist-row">
        <img src="${book.cover}" alt="" />
        <span><strong>${book.title}</strong><small>${book.author} - ${formatPrice(book.price)}</small></span>
        <button class="secondary-button small" data-add-cart="${book.id}">Tambah</button>
        <button class="secondary-button small" data-toggle-wishlist="${book.id}">Hapus</button>
      </article>
    `).join("")
    : `<p class="muted-text">Belum ada audiobook yang disimpan.</p>`;
}

function renderLibrary() {
  const libraryBooks = state.library.map(findBook).filter(Boolean);
  $("#libraryList").innerHTML = libraryBooks.map((book) => `
    <article class="library-item">
      <div class="library-title"><img src="${book.cover}" alt="" /><span><strong>${book.title}</strong><span>${book.narrator} - ${book.duration}</span></span></div>
      <div class="library-progress"><span style="width: ${book.progress}%"></span></div>
      <button class="secondary-button small" data-sample="${book.id}">Lanjutkan</button>
    </article>
  `).join("");
}

function updateCartCount() { $("#cartCount").textContent = state.cart.length; }

function addToCart(id) {
  if (state.library.includes(id)) return showToast("Audiobook ini sudah ada di Perpustakaan Saya.");
  if (state.cart.includes(id)) return showToast("Audiobook sudah ada di keranjang.");
  state.cart.push(id);
  updateCartCount();
  showToast("Audiobook ditambahkan ke keranjang.");
}

function openDetail(id) {
  const book = findBook(id);
  if (!book) return;
  const owned = state.library.includes(id);
  $("#detailContent").innerHTML = `
    <div class="detail-layout">
      <img src="${book.cover}" alt="Sampul audiobook ${book.title}" />
      <div>
        <p class="eyebrow">${book.category}</p>
        <h2>${book.title}</h2>
        <p>${book.description}</p>
        <div class="detail-facts">
          <div><span>Penulis</span><strong>${book.author}</strong></div>
          <div><span>Narator</span><strong>${book.narrator}</strong></div>
          <div><span>Rating</span><strong>${book.rating}/5</strong></div>
        </div>
        <div class="featured-actions">
          <button type="button" class="primary-button" data-add-cart="${book.id}" ${owned ? "disabled" : ""}>${owned ? "Sudah dimiliki" : "Tambah ke keranjang"}</button>
          <button type="button" class="secondary-button" data-toggle-wishlist="${book.id}">${state.wishlist.includes(book.id) ? "Hapus wishlist" : "Simpan wishlist"}</button>
          <button type="button" class="secondary-button" data-use-credit="${book.id}" ${state.account.credits <= 0 || owned ? "disabled" : ""}>Pakai kredit</button>
          <button type="button" class="secondary-button" data-sample="${book.id}">Dengar contoh</button>
        </div>
      </div>
    </div>
  `;
  detailModal.showModal();
}

function renderCart() {
  const selected = state.cart.map(findBook).filter(Boolean);
  $("#cartItems").innerHTML = selected.length
    ? selected.map((book) => `<div class="cart-row"><strong>${book.title}</strong><span>${formatPrice(book.price)}</span><button type="button" data-remove-cart="${book.id}">Hapus</button></div>`).join("")
    : `<p>Keranjang masih kosong.</p>`;
  $("#cartTotal").textContent = formatPrice(selected.reduce((sum, book) => sum + book.price, 0));
  $("#checkoutButton").disabled = selected.length === 0;
}

function openCart() {
  renderCart();
  cartModal.showModal();
}

async function postJson(url, payload = {}) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

async function syncAccountFromApi() {
  try {
    const response = await fetch("/api/account");
    if (!response.ok) return;
    const payload = await response.json();
    if (Array.isArray(payload.library)) state.library = payload.library;
    if (Array.isArray(payload.wishlist)) state.wishlist = payload.wishlist;
    if (payload.account) state.account = payload.account;
    renderAll();
  } catch (error) {
    renderAll();
  }
}

async function openCheckout(title, total, itemIds = [], kind = "books") {
  if (!total) return showToast("Pilih audiobook atau paket langganan terlebih dahulu.");
  state.paymentItems = itemIds;
  state.paymentKind = kind;
  state.paymentId = null;
  $("#paymentTitle").textContent = title;
  $("#paymentAmount").textContent = formatPrice(total);
  $("#paymentIdLabel").textContent = "QRIS Demo";
  try {
    const payment = await postJson("/api/payments/qris", { title, amount: total, itemIds, kind });
    state.paymentId = payment.id;
    $("#paymentTitle").textContent = `${title} (${payment.id})`;
    $("#paymentAmount").textContent = formatPrice(payment.amount);
    $("#paymentIdLabel").textContent = payment.id;
  } catch (error) {
    showToast("API pembayaran tidak aktif. Menggunakan QRIS demo lokal.");
  }
  startPaymentTimer();
  checkoutModal.showModal();
}

function startPaymentTimer() {
  window.clearInterval(state.timer);
  state.secondsLeft = 899;
  updatePaymentTimer();
  state.timer = window.setInterval(() => {
    state.secondsLeft -= 1;
    updatePaymentTimer();
    if (state.secondsLeft <= 0) {
      window.clearInterval(state.timer);
      showToast("Kode QRIS kedaluwarsa. Buat pembayaran baru.");
    }
  }, 1000);
}

function updatePaymentTimer() {
  const minutes = String(Math.floor(state.secondsLeft / 60)).padStart(2, "0");
  const seconds = String(state.secondsLeft % 60).padStart(2, "0");
  $("#paymentTimer").textContent = `${minutes}:${seconds}`;
}

async function confirmPayment() {
  let confirmedByApi = false;
  if (state.paymentId) {
    try {
      const payload = await postJson(`/api/payments/${state.paymentId}/confirm`);
      if (Array.isArray(payload.library)) state.library = payload.library;
      if (Array.isArray(payload.wishlist)) state.wishlist = payload.wishlist;
      if (payload.account) state.account = payload.account;
      confirmedByApi = true;
    } catch (error) {
      showToast("Konfirmasi API gagal. Transaksi diselesaikan sebagai demo lokal.");
    }
  }
  if (!confirmedByApi && state.paymentKind === "subscription") {
    state.account.plan = "Readio Plus";
    state.account.credits += 1;
    state.account.orders.push({ title: "Langganan Bulanan", method: "QRIS", status: "PAID" });
  }
  if (!confirmedByApi && state.paymentKind === "books") {
    state.paymentItems.forEach((id) => { if (!state.library.includes(id)) state.library.push(id); });
    state.paymentItems.map(findBook).filter(Boolean).forEach((book) => state.account.orders.push({ title: book.title, method: "QRIS", status: "PAID" }));
  }
  state.cart = state.cart.filter((id) => !state.paymentItems.includes(id));
  state.wishlist = state.wishlist.filter((id) => !state.paymentItems.includes(id));
  renderAll();
  checkoutModal.close();
  cartModal.close();
  showToast("Pembayaran QRIS berhasil. Konten sudah masuk ke akun.");
}

async function useCredit(id) {
  const book = findBook(id);
  if (!book) return;
  if (state.library.includes(id)) return showToast("Audiobook ini sudah ada di Perpustakaan Saya.");
  if (state.account.credits <= 0) return showToast("Kredit habis. Perpanjang Readio Plus dengan QRIS.");
  try {
    const payload = await postJson("/api/redeem-credit", { itemId: id });
    if (Array.isArray(payload.library)) state.library = payload.library;
    if (Array.isArray(payload.wishlist)) state.wishlist = payload.wishlist;
    if (payload.account) state.account = payload.account;
  } catch (error) {
    state.account.credits -= 1;
    state.library.push(id);
    state.account.orders.push({ title: book.title, method: "Kredit", status: "REDEEMED" });
  }
  state.cart = state.cart.filter((itemId) => itemId !== id);
  state.wishlist = state.wishlist.filter((itemId) => itemId !== id);
  renderAll();
  showToast(`${book.title} ditukar dengan 1 kredit.`);
}

function playSample(id) {
  const book = findBook(id);
  if (!book) return;
  state.activeBook = book;
  state.playing = true;
  state.sampleProgress = 12;
  $("#playerCover").src = book.cover;
  $("#playerTitle").textContent = book.title;
  $("#playerMeta").textContent = `Cuplikan - ${book.narrator}`;
  $("#playButton").textContent = "Jeda";
  tickPlayer();
  window.clearInterval(state.progressInterval);
  state.progressInterval = window.setInterval(tickPlayer, 900);
}

function tickPlayer() {
  if (!state.playing || !state.activeBook) return;
  state.sampleProgress = Math.min(100, state.sampleProgress + 4);
  $("#playerProgress").style.width = `${state.sampleProgress}%`;
  if (state.sampleProgress >= 100) {
    state.playing = false;
    $("#playButton").textContent = "Putar";
    window.clearInterval(state.progressInterval);
  }
}

function togglePlay() {
  if (!state.activeBook) return playSample("laut-bercerita");
  state.playing = !state.playing;
  $("#playButton").textContent = state.playing ? "Jeda" : "Putar";
}

function setFeatured(id) {
  const book = findBook(id);
  if (!book) return;
  $("#featuredTitle").textContent = book.title;
  $("#featuredMeta").textContent = `${book.author} - Narator: ${book.narrator} - ${book.duration}`;
  $("#featuredDesc").textContent = book.description;
  $("#featuredCover").src = book.cover;
  $("#featuredBuy").onclick = () => openCheckout(`Beli ${book.title}`, book.price, [book.id], "books");
  $("#featuredCredit").onclick = () => useCredit(book.id);
  $("#featuredSample").onclick = () => playSample(book.id);
}

async function toggleWishlist(id) {
  const book = findBook(id);
  if (!book) return;
  if (state.library.includes(id)) return showToast("Audiobook ini sudah ada di Perpustakaan Saya.");
  try {
    const payload = await postJson("/api/wishlist", { itemId: id });
    if (Array.isArray(payload.wishlist)) state.wishlist = payload.wishlist;
  } catch (error) {
    if (state.wishlist.includes(id)) {
      state.wishlist = state.wishlist.filter((itemId) => itemId !== id);
    } else {
      state.wishlist.push(id);
    }
  }
  renderAll();
  showToast(state.wishlist.includes(id) ? `${book.title} disimpan.` : `${book.title} dihapus dari wishlist.`);
}

async function clearWishlist() {
  try {
    const payload = await postJson("/api/wishlist/clear");
    if (Array.isArray(payload.wishlist)) state.wishlist = payload.wishlist;
  } catch (error) {
    state.wishlist = [];
  }
  renderAll();
  showToast("Wishlist dikosongkan.");
}

function renderAll() {
  renderCatalog();
  renderWishlist();
  renderLibrary();
  renderAccount();
  updateCartCount();
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (target.dataset.detail) openDetail(target.dataset.detail);
  if (target.dataset.addCart) addToCart(target.dataset.addCart);
  if (target.dataset.removeCart) {
    state.cart = state.cart.filter((id) => id !== target.dataset.removeCart);
    renderCart();
    updateCartCount();
  }
  if (target.dataset.sample) playSample(target.dataset.sample);
  if (target.dataset.useCredit) useCredit(target.dataset.useCredit);
  if (target.dataset.toggleWishlist) toggleWishlist(target.dataset.toggleWishlist);
  if (target.dataset.checkoutPlan) openCheckout("Langganan Bulanan", 79000, [], "subscription");
});

document.querySelectorAll("[data-category]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-category]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.category = button.dataset.category;
    renderCatalog();
  });
});

document.querySelectorAll("[data-nav]").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll("[data-nav]").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

$("#searchInput").addEventListener("input", (event) => {
  state.query = event.target.value;
  renderCatalog();
});
$("#cartButton").addEventListener("click", openCart);
$("#libraryButton").addEventListener("click", () => $("#perpustakaan").scrollIntoView());
$("#checkoutButton").addEventListener("click", () => {
  const selected = state.cart.map(findBook).filter(Boolean);
  openCheckout("Bayar keranjang", selected.reduce((sum, book) => sum + book.price, 0), state.cart, "books");
});
$("#confirmPaymentButton").addEventListener("click", confirmPayment);
$("#playButton").addEventListener("click", togglePlay);
$("#syncButton").addEventListener("click", () => { syncAccountFromApi(); showToast("Perpustakaan tersinkron."); });
$("#accountSyncButton").addEventListener("click", () => { syncAccountFromApi(); showToast("Akun diperbarui."); });
$("#wishlistClearButton").addEventListener("click", clearWishlist);

setFeatured("laut-bercerita");
renderAll();
syncAccountFromApi();

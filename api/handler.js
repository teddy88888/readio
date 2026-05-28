const payments = new Map();

const account = {
  name: "Nadia Pratama",
  plan: "Readio Plus",
  credits: 1,
  orders: []
};

let library = ["laut-bercerita", "filosofi-teras"];
let wishlist = [];

const bookTitles = {
  "laut-bercerita": "Laut Bercerita",
  "filosofi-teras": "Filosofi Teras",
  "atomic-habits": "Atomic Habits",
  "startup-jakarta": "Startup Jakarta",
  pulang: "Pulang",
  "cerita-nusantara": "Cerita Nusantara Sebelum Tidur"
};

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100000) {
        request.destroy();
        reject(new Error("Payload too large"));
      }
    });
    request.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function encodePaymentPayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePaymentPayload(paymentId) {
  const token = paymentId.split("-").slice(2).join("-");
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
  } catch (error) {
    return null;
  }
}

function createPaymentId(payment) {
  const token = encodePaymentPayload({ title: payment.title, amount: payment.amount, itemIds: payment.itemIds, kind: payment.kind, expiresAt: payment.expiresAt });
  return `QRIS-${Date.now().toString(36).toUpperCase()}-${token}`;
}

function snapshot() {
  return { account, library, wishlist };
}

async function handleApi(request, response, options = {}) {
  const baseUrl = options.baseUrl || "http://127.0.0.1:4173";
  const requestUrl = options.requestPath || request.url;
  const url = new URL(requestUrl, baseUrl);

  if (request.method === "GET" && (url.pathname === "/api/account" || url.pathname === "/api/library")) {
    sendJson(response, 200, snapshot());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/redeem-credit") {
    try {
      const body = await readJson(request);
      const itemId = body.itemId;
      if (!itemId || !bookTitles[itemId]) return sendJson(response, 400, { error: "Audiobook tidak valid." });
      if (library.includes(itemId)) return sendJson(response, 409, { error: "Audiobook sudah dimiliki." });
      if (account.credits <= 0) return sendJson(response, 402, { error: "Kredit tidak cukup." });
      account.credits -= 1;
      library.push(itemId);
      wishlist = wishlist.filter((id) => id !== itemId);
      account.orders.push({ title: bookTitles[itemId], method: "Kredit", status: "REDEEMED" });
      sendJson(response, 200, snapshot());
    } catch (error) {
      sendJson(response, 400, { error: "Payload JSON tidak valid." });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/wishlist") {
    try {
      const body = await readJson(request);
      const itemId = body.itemId;
      if (!itemId || !bookTitles[itemId]) return sendJson(response, 400, { error: "Audiobook tidak valid." });
      if (library.includes(itemId)) return sendJson(response, 409, { error: "Audiobook sudah dimiliki." });
      wishlist = wishlist.includes(itemId) ? wishlist.filter((id) => id !== itemId) : [...wishlist, itemId];
      sendJson(response, 200, snapshot());
    } catch (error) {
      sendJson(response, 400, { error: "Payload JSON tidak valid." });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/wishlist/clear") {
    wishlist = [];
    sendJson(response, 200, snapshot());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/payments/qris") {
    try {
      const body = await readJson(request);
      const amount = Number(body.amount || 0);
      if (!amount || amount < 1000) return sendJson(response, 400, { error: "Nominal pembayaran tidak valid." });
      const payment = {
        title: body.title || "Pembayaran Readio",
        amount,
        itemIds: Array.isArray(body.itemIds) ? body.itemIds : [],
        kind: body.kind || "books",
        status: "PENDING",
        method: "QRIS",
        merchant: "Readio Digital",
        nmid: "ID102326890001",
        qrisImage: "/assets/qris-demo.png",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      };
      payment.id = createPaymentId(payment);
      payments.set(payment.id, payment);
      sendJson(response, 201, payment);
    } catch (error) {
      sendJson(response, 400, { error: "Payload JSON tidak valid." });
    }
    return;
  }

  const confirmMatch = url.pathname.match(/^\/api\/payments\/([^/]+)\/confirm$/);
  if (request.method === "POST" && confirmMatch) {
    const paymentId = decodeURIComponent(confirmMatch[1]);
    const payment = payments.get(paymentId) || decodePaymentPayload(paymentId);
    if (!payment) return sendJson(response, 404, { error: "Transaksi tidak ditemukan." });
    if (new Date(payment.expiresAt).getTime() < Date.now()) return sendJson(response, 410, { error: "Kode QRIS kedaluwarsa." });
    payment.status = "PAID";
    if (payment.kind === "subscription") {
      account.plan = "Readio Plus";
      account.credits += 1;
      account.orders.push({ title: payment.title, method: "QRIS", status: "PAID" });
    } else {
      payment.itemIds.forEach((id) => {
        if (!library.includes(id) && bookTitles[id]) {
          library.push(id);
          wishlist = wishlist.filter((wishlistId) => wishlistId !== id);
          account.orders.push({ title: bookTitles[id], method: "QRIS", status: "PAID" });
        }
      });
    }
    sendJson(response, 200, { payment, ...snapshot() });
    return;
  }

  sendJson(response, 404, { error: "Endpoint tidak ditemukan." });
}

module.exports = handleApi;

// -----------------------------
//  IoT Sensor Monitor Service Worker
// -----------------------------

const CACHE_NAME = "iot-monitor-v1";
const POLL_INTERVAL = 5000; // 5 seconds

let pollingTimer = null;
let latestId = null;

// ----------------------------------------
//  INSTALL
// ----------------------------------------
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  self.skipWaiting();
});

// ----------------------------------------
//  ACTIVATE
// ----------------------------------------
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(clients.claim());
});

// ----------------------------------------
//  MESSAGE HANDLER
// ----------------------------------------
self.addEventListener("message", (event) => {
  const msg = event.data;
  console.log("[SW] Message received:", msg);

  switch (msg.type) {
    case "START_POLLING":
      // startPolling();
      break;

    case "STOP_POLLING":
      // stopPolling();
      break;

    case "CHECK_NOW":
      // checkForNewData();
      break;

    case "UPDATE_THRESHOLDS":
      self.thresholds = msg.thresholds;
      console.log("[SW] Thresholds updated:", self.thresholds);
      break;
  }
});

// ----------------------------------------
//  POLLING CONTROL
// ----------------------------------------
function startPolling() {
  if (pollingTimer) {
    console.log("[SW] Polling already running, skipping.");
    return;
  }

  console.log("[SW] Starting polling every", POLL_INTERVAL, "ms");
  pollingTimer = setInterval(checkForNewData, POLL_INTERVAL);

  checkForNewData(); // run immediately
}

function stopPolling() {
  if (!pollingTimer) return;

  console.log("[SW] Stopping polling.");
  clearInterval(pollingTimer);
  pollingTimer = null;
}

// ----------------------------------------
//  POLLING LOGIC
// ----------------------------------------
async function checkForNewData() {
  console.log("[SW] Checking for new data...");

  try {
    const url = self.location.origin + "/api/readings?limit=1";
    const response = await fetch(url);
    const json = await response.json();

    if (!json.success || json.readings.length === 0) return;

    const reading = json.readings[0];

    // Prevent duplicate notifications
    if (latestId === reading._id) return;
    latestId = reading._id;

    // Broadcast to all app windows
    const appClients = await clients.matchAll({ type: "window" });
    appClients.forEach((client) => {
      client.postMessage({
        type: "NEW_DATA",
        data: reading,
      });
    });
  } catch (err) {
    console.error("[SW] Polling failed:", err);
  }
}

// ----------------------------------------
//  PUSH HANDLING
// ----------------------------------------
self.addEventListener("push", (event) => {
  console.log("[SW] Push received");

  let data = { title: "IoT Alert", body: "Sensor threshold exceeded" };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      console.error("[SW] Error parsing push data:", err);
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192x192.png",
      badge: "/icon-72x72.png",
      vibrate: [200, 100, 200],
      tag: "iot-alert",
      renotify: true,
      data: data.data || {},
      actions: [
        { action: "view", title: "View Dashboard" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});

// ----------------------------------------
//  NOTIFICATION CLICK
// ----------------------------------------
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      for (const c of list) {
        if (c.url.includes("/") && "focus" in c) return c.focus();
      }
      return clients.openWindow("/");
    })
  );
});

const trackerSource = String.raw`(function () {
  "use strict";

  var script = document.currentScript;
  var trackingId = script && script.getAttribute("data-tracking-id");
  if (!trackingId) return;

  var collectorUrl = new URL("/api/v1/collect", script.src).toString();
  var requireConsent = script.getAttribute("data-require-consent") === "true";
  var respectDoNotTrack = script.getAttribute("data-respect-do-not-track") !== "false";
  var visitorKey = "ai-growth:visitor";
  var sessionKey = "ai-growth:session";
  var sessionStartedKey = "ai-growth:session-started";
  var consentKey = "ai-growth:consent";
  var optOutKey = "ai-growth:opt-out";
  var queue = [];
  var flushTimer = null;
  var heartbeatTimer = null;
  var lastPage = "";
  var scrollMilestones = {};
  var formStarts = typeof WeakSet === "function" ? new WeakSet() : null;

  function randomId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return prefix + window.crypto.randomUUID();
    return prefix + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function readStorage(storage, key) {
    try { return storage.getItem(key); } catch (_) { return null; }
  }

  function writeStorage(storage, key, value) {
    try { storage.setItem(key, value); } catch (_) { /* Storage may be disabled. */ }
  }

  function removeStorage(storage, key) {
    try { storage.removeItem(key); } catch (_) { /* Storage may be disabled. */ }
  }

  function hasDoNotTrack() {
    return respectDoNotTrack && (navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.msDoNotTrack === "1");
  }

  function trackingAllowed() {
    if (hasDoNotTrack() || readStorage(window.localStorage, optOutKey) === "1") return false;
    return !requireConsent || readStorage(window.localStorage, consentKey) === "granted";
  }

  function safeProperties(properties) {
    if (!properties || typeof properties !== "object") return {};
    var output = {};
    Object.keys(properties).slice(0, 20).forEach(function (key) {
      if (/password|passcode|secret|token|authorization|cookie|email|phone|mobile|address|name|ssn|social.?security|credit.?card|card.?number|value/i.test(key)) return;
      var value = properties[key];
      if (["string", "number", "boolean"].indexOf(typeof value) !== -1) output[key.slice(0, 80)] = typeof value === "string" ? value.slice(0, 300) : value;
    });
    return output;
  }

  var visitorId = readStorage(window.localStorage, visitorKey) || randomId("visitor_");
  var sessionId = readStorage(window.sessionStorage, sessionKey) || randomId("session_");
  writeStorage(window.localStorage, visitorKey, visitorId);
  writeStorage(window.sessionStorage, sessionKey, sessionId);

  function safeUrl() {
    return window.location.origin + window.location.pathname;
  }

  function safeReferrer() {
    if (!document.referrer) return null;
    try {
      var referrer = new URL(document.referrer);
      return referrer.origin + referrer.pathname;
    } catch (_) { return null; }
  }

  function eventId() { return randomId("evt_"); }

  function buildEvent(eventType, properties) {
    return {
      trackingId: trackingId,
      eventId: eventId(),
      eventType: eventType,
      occurredAt: new Date().toISOString(),
      visitorId: visitorId,
      sessionId: sessionId,
      url: safeUrl(),
      referrer: safeReferrer(),
      title: document.title.slice(0, 300),
      properties: safeProperties(properties),
      context: {
        userAgent: navigator.userAgent.slice(0, 1000),
        language: navigator.language ? navigator.language.slice(0, 40) : undefined,
        viewport: { width: window.innerWidth, height: window.innerHeight }
      }
    };
  }

  function send(event) {
    var body = JSON.stringify(event);
    if (navigator.sendBeacon) {
      var accepted = navigator.sendBeacon(collectorUrl, new Blob([body], { type: "application/json" }));
      if (accepted) return;
    }
    if (window.fetch) window.fetch(collectorUrl, { method: "POST", body: body, headers: { "Content-Type": "application/json" }, credentials: "omit", keepalive: true }).catch(function () {});
  }

  function flush() {
    if (flushTimer) { window.clearTimeout(flushTimer); flushTimer = null; }
    var pending = queue.splice(0, queue.length);
    pending.forEach(send);
  }

  function scheduleFlush() {
    if (queue.length >= 5) { flush(); return; }
    if (!flushTimer) flushTimer = window.setTimeout(flush, 1000);
  }

  function enqueue(eventType, properties) {
    if (!trackingAllowed()) return false;
    queue.push(buildEvent(eventType, properties));
    scheduleFlush();
    return true;
  }

  function pageView() {
    var page = safeUrl();
    if (page === lastPage) return;
    if (!trackingAllowed()) return;
    lastPage = page;
    scrollMilestones = {};
    enqueue("page_view", {});
  }

  function clickProperties(element) {
    return {
      tag: element.tagName ? element.tagName.toLowerCase() : "unknown",
      id: element.id ? element.id.slice(0, 80) : undefined,
      role: element.getAttribute ? (element.getAttribute("role") || undefined) : undefined,
      href: element.href ? (function () { try { var link = new URL(element.href); return link.origin + link.pathname; } catch (_) { return undefined; } })() : undefined
    };
  }

  function formProperties(form) {
    return {
      tag: "form",
      formId: form.id ? form.id.slice(0, 80) : undefined,
      action: form.action ? (function () { try { var action = new URL(form.action); return action.origin + action.pathname; } catch (_) { return undefined; } })() : undefined,
      method: form.method ? form.method.toLowerCase() : "get"
    };
  }

  function clearQueuedEvents() {
    queue.splice(0, queue.length);
    if (flushTimer) { window.clearTimeout(flushTimer); flushTimer = null; }
  }

  function startHeartbeat() {
    if (heartbeatTimer || !trackingAllowed() || typeof window.setInterval !== "function") return;
    heartbeatTimer = window.setInterval(function () {
      if (document.visibilityState === "visible") enqueue("custom", { eventName: "live_heartbeat" });
    }, 60000);
  }

  function stopHeartbeat() {
    if (heartbeatTimer && typeof window.clearInterval === "function") window.clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  function startTracking() {
    if (!trackingAllowed()) return;
    if (!readStorage(window.sessionStorage, sessionStartedKey)) {
      writeStorage(window.sessionStorage, sessionStartedKey, "1");
      enqueue("session_start", {});
    }
    pageView();
    startHeartbeat();
  }

  function installHistoryTracking() {
    ["pushState", "replaceState"].forEach(function (method) {
      var original = window.history[method];
      if (!original) return;
      window.history[method] = function () {
        var result = original.apply(this, arguments);
        window.setTimeout(pageView, 0);
        return result;
      };
    });
    window.addEventListener("popstate", pageView);
  }

  document.addEventListener("click", function (event) {
    var target = event.target && event.target.closest ? event.target.closest("a,button,[role=button]") : null;
    if (target) enqueue("click", clickProperties(target));
  }, true);

  document.addEventListener("focusin", function (event) {
    var form = event.target && event.target.form;
    if (!form || (formStarts && formStarts.has(form))) return;
    if (formStarts) formStarts.add(form);
    enqueue("form_start", formProperties(form));
  }, true);

  document.addEventListener("submit", function (event) {
    if (event.target && event.target.tagName === "FORM") enqueue("form_submit", formProperties(event.target));
  }, true);

  window.addEventListener("scroll", function () {
    var documentHeight = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0) - window.innerHeight;
    if (documentHeight <= 0) return;
    var depth = Math.min(100, Math.round((window.scrollY / documentHeight) * 100));
    [25, 50, 75, 100].forEach(function (milestone) {
      if (depth >= milestone && !scrollMilestones[milestone]) {
        scrollMilestones[milestone] = true;
        enqueue("scroll", { depth: milestone });
      }
    });
  }, { passive: true });

  window.aiGrowth = window.aiGrowth || {};
  window.aiGrowth.track = function (eventType, properties) {
    enqueue(eventType === "conversion" ? "conversion" : "custom", { eventName: eventType, properties: safeProperties(properties) });
  };
  window.aiGrowth.conversion = function (properties) { enqueue("conversion", properties); };
  window.aiGrowth.flush = flush;
  window.aiGrowth.hasConsent = function () { return !requireConsent || readStorage(window.localStorage, consentKey) === "granted"; };
  window.aiGrowth.grantConsent = function () { writeStorage(window.localStorage, consentKey, "granted"); removeStorage(window.localStorage, optOutKey); startTracking(); enqueue("custom", { eventName: "consent_granted" }); };
  window.aiGrowth.denyConsent = function () { writeStorage(window.localStorage, consentKey, "denied"); window.aiGrowth.optOut(); };
  window.aiGrowth.optOut = function () { writeStorage(window.localStorage, optOutKey, "1"); stopHeartbeat(); clearQueuedEvents(); };
  window.aiGrowth.optIn = function () { removeStorage(window.localStorage, optOutKey); if (!requireConsent) startTracking(); };

  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(); });
  window.addEventListener("pagehide", flush);
  installHistoryTracking();
  startTracking();
})();
`;

export const trackerScript = trackerSource;

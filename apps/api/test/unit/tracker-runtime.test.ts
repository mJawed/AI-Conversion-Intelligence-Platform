import assert from "node:assert/strict";
import vm from "node:vm";
import test from "node:test";
import { trackerScript } from "../../src/tracker";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

function runTracker(attributes: Record<string, string> = {}) {
  const listeners = new Map<string, (event: any) => void>();
  const beacons: any[] = [];
  const intervals: Array<() => void> = [];
  const localStorage = createStorage();
  const sessionStorage = createStorage();
  const script = { src: "http://localhost:4000/tracker.js", getAttribute: (name: string) => attributes[name] ?? null };
  const context: any = {
    document: {
      currentScript: script,
      title: "Test page",
      referrer: "https://referrer.example/pricing?secret=1",
      visibilityState: "visible",
      documentElement: { scrollHeight: 1000 },
      body: { scrollHeight: 1000 },
      addEventListener: (name: string, handler: (event: any) => void) => listeners.set(`document:${name}`, handler),
    },
    navigator: {
      language: "en-US",
      userAgent: "tracker-test",
      sendBeacon: (_url: string, body: any) => { beacons.push(JSON.parse(body.parts[0])); return true; },
    },
    window: {
      localStorage,
      sessionStorage,
      crypto: { randomUUID: (() => { let count = 0; return () => `uuid-${++count}`; })() },
      innerWidth: 1280,
      innerHeight: 500,
      scrollY: 0,
      location: { origin: "https://site.example", pathname: "/home" },
      history: { pushState: () => undefined, replaceState: () => undefined },
      addEventListener: (name: string, handler: (event: any) => void) => listeners.set(`window:${name}`, handler),
      setTimeout: (handler: () => void) => { handler(); return 1; },
      clearTimeout: () => undefined,
      setInterval: (handler: () => void) => { intervals.push(handler); return intervals.length; },
      clearInterval: () => undefined,
      fetch: async () => undefined,
      aiGrowth: undefined,
    },
    URL,
    Blob: class FakeBlob { parts: string[]; type: string; constructor(parts: string[], options: { type: string }) { this.parts = parts; this.type = options.type; } },
    setTimeout: (handler: () => void) => { handler(); return 1; },
    clearTimeout: () => undefined,
  };
  context.window.window = context.window;
  context.window.document = context.document;
  vm.runInNewContext(trackerScript, context);
  context.window.aiGrowth.flush();
  return { context, listeners, beacons, intervals };
}

test("tracker sends baseline, interaction, form, scroll, conversion, and SPA events", () => {
  const { context, listeners, beacons, intervals } = runTracker({ "data-tracking-id": "trk_12345678" });
  assert.deepEqual(beacons.slice(0, 2).map((event) => event.eventType), ["session_start", "page_view"]);

  listeners.get("document:click")!({ target: { closest: () => ({ tagName: "A", id: "hero-cta", href: "https://site.example/signup?email=hidden" , getAttribute: () => null }) } });
  const form = { tagName: "FORM", id: "signup", action: "https://site.example/signup", method: "post" };
  listeners.get("document:focusin")!({ target: { form } });
  listeners.get("document:submit")!({ target: form });
  context.window.scrollY = 500;
  listeners.get("window:scroll")!({});
  context.window.history.pushState({}, "", "/pricing");
  context.window.location.pathname = "/pricing";
  context.window.history.pushState({}, "", "/pricing");
  context.window.aiGrowth.conversion({ goal: "signup" });
  intervals[0]?.();
  context.window.aiGrowth.flush();

  const types = beacons.map((event) => event.eventType);
  assert.ok(types.includes("click"));
  assert.ok(types.includes("form_start"));
  assert.ok(types.includes("form_submit"));
  assert.ok(types.includes("scroll"));
  assert.ok(types.includes("conversion"));
  assert.equal(beacons.find((event) => event.eventType === "form_start").properties.formId, "signup");
  assert.equal(beacons.find((event) => event.eventType === "click").properties.href, "https://site.example/signup");
  assert.equal(beacons.filter((event) => event.eventType === "page_view").length, 2);
  assert.equal(intervals.length, 1);
});

test("consent mode stays silent until consent is granted and respects opt-out", () => {
  const { context, beacons } = runTracker({ "data-tracking-id": "trk_12345678", "data-require-consent": "true" });
  assert.equal(beacons.length, 0);
  assert.equal(context.window.aiGrowth.hasConsent(), false);
  context.window.aiGrowth.grantConsent();
  context.window.aiGrowth.flush();
  assert.equal(beacons.length, 4);
  assert.equal(beacons.filter((event) => event.eventType === "custom").length, 2);
  context.window.aiGrowth.optOut();
  context.window.aiGrowth.conversion({ goal: "blocked" });
  assert.equal(beacons.length, 4);
});

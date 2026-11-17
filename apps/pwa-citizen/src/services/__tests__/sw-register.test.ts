import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { registerServiceWorker } from "../sw-register.ts";

describe("PWA Service Worker Registration Specification", () => {
  test("1. Mengembalikan unsupported secara aman saat dieksekusi di lingkungan tanpa navigator.serviceWorker (Node/SSR)", async () => {
    const result = await registerServiceWorker();
    assert.equal(result.supported, false);
    assert.equal(result.registered, false);
    assert.ok(result.error?.includes("not supported"));
  });

  test("2. Berhasil mendaftarkan service worker saat navigator.serviceWorker tersedia", async () => {
    const originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    const originalWindowDesc = Object.getOwnPropertyDescriptor(globalThis, "window");

    try {
      Object.defineProperty(globalThis, "window", {
        value: {},
        configurable: true,
        writable: true,
      });

      Object.defineProperty(globalThis, "navigator", {
        value: {
          serviceWorker: {
            register: async (scriptUrl: string, options?: { scope?: string }) => {
              assert.equal(scriptUrl, "/sw.js");
              assert.equal(options?.scope, "/");
              return { scope: "http://localhost:3000/" };
            },
          },
        },
        configurable: true,
        writable: true,
      });

      const result = await registerServiceWorker();
      assert.equal(result.supported, true);
      assert.equal(result.registered, true);
      assert.equal(result.scope, "http://localhost:3000/");
    } finally {
      if (originalNavigatorDesc) {
        Object.defineProperty(globalThis, "navigator", originalNavigatorDesc);
      } else {
        delete (globalThis as any).navigator;
      }

      if (originalWindowDesc) {
        Object.defineProperty(globalThis, "window", originalWindowDesc);
      } else {
        delete (globalThis as any).window;
      }
    }
  });
});

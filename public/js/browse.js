(() => {
  const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector('script[data-prism-src="' + src + '"]')) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.dataset.prismSrc = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load " + src));
    document.head.appendChild(script);
  });

  let controllerPromise;
  const frames = new WeakMap();

  window.prismBrowseMarkup = () => `
    <div class="browse-head">
      <div>
        <p class="page-kicker">PRISM / WEB</p>
        <h1 class="page-title">Browse</h1>
        <p class="browse-intro">Open a website inside PRISM using Scramjet. Enter a web address or type a search.</p>
      </div>
    </div>
    <section class="browse-card">
      <form class="browse-toolbar" id="browseForm">
        <input class="browse-address" id="browseAddress" type="text" placeholder="Search or enter a URL…" aria-label="Search or enter a URL" autocomplete="url" spellcheck="false" required>
        <button class="browse-go" type="submit">Go</button>
      </form>
      <div class="browse-status" id="browseStatus" aria-live="polite">Ready when you are. Enter a URL above to begin.</div>
      <div class="browse-frame-wrap">
        <iframe class="browse-frame" id="browseFrame" title="PRISM proxied browsing area" referrerpolicy="no-referrer"></iframe>
      </div>
    </section>
    <p class="browse-foot">Compatibility note: this Vercel serverless version uses HTTP-based Bare transport. Websites that require tunneled WebSockets, some streaming features, or long-running requests may not work. Proxy traffic passes through this service; avoid entering passwords or sensitive information.</p>
  `;

  async function getController() {
    if (controllerPromise) return controllerPromise;
    controllerPromise = (async () => {
      if (!("serviceWorker" in navigator)) {
        throw new Error("This browser does not support service workers.");
      }
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none"
      });
      await navigator.serviceWorker.ready;
      let worker = navigator.serviceWorker.controller || registration.active;
      if (!worker) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("The proxy service worker did not start. Reload the page and try again.")), 12000);
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            clearTimeout(timeout);
            resolve();
          }, { once: true });
        });
        worker = navigator.serviceWorker.controller || registration.active;
      }
      if (!worker) throw new Error("The proxy service worker is not active.");

      for (const src of [
        "/scram/scramjet.js",
        "/controller/controller.api.js",
        "/utils/scramjet-utils.js"
      ]) {
        await loadScript(src);
      }

      const api = window.$scramjetController;
      if (!api) throw new Error("Scramjet's controller did not load.");
      const { default: BareClient } = await import("/baremod/index.mjs");
      const controller = new api.Controller({
        serviceworker: worker,
        transport: new BareClient(new URL("/bare/", location.href)),
        config: {
          scramjetPath: "/scram/scramjet.js",
          wasmPath: "/scram/scramjet.wasm",
          injectPath: "/controller/controller.inject.js"
        }
      });
      await controller.wait();
      window.setInterval(() => {
        navigator.serviceWorker.controller?.postMessage("keepalive");
      }, 15000);
      return { controller, utils: window.$scramjetUtils || window.$scramjetControllerUtils || {} };
    })().catch((error) => {
      controllerPromise = undefined;
      throw error;
    });
    return controllerPromise;
  }

  function normalizeAddress(value) {
    const raw = value.trim();
    if (!raw) throw new Error("Enter a website or search term.");
    if (/\s/.test(raw) && !/^(https?:\/\/)/i.test(raw)) {
      return new URL("https://www.google.com/search?q=" + encodeURIComponent(raw));
    }
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : "https://" + raw;
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Only HTTP and HTTPS websites are supported.");
    }
    return url;
  }

  async function browseSubmit(event) {
    if (!event.target || event.target.id !== "browseForm") return;
    event.preventDefault();
    const form = event.target;
    const address = form.querySelector("#browseAddress");
    const frame = document.getElementById("browseFrame");
    const status = document.getElementById("browseStatus");
    const go = form.querySelector('button[type="submit"]');
    if (!address || !frame || !status) return;
    let target;
    try {
      target = normalizeAddress(address.value);
    } catch (error) {
      status.textContent = error.message || "That address does not look right.";
      return;
    }
    address.value = target.href;
    status.textContent = "Starting Scramjet and opening " + target.hostname + "…";
    if (go) go.disabled = true;
    try {
      const { controller, utils } = await getController();
      let proxyFrame = frames.get(frame);
      if (!proxyFrame) {
        const plugins = [];
        if (utils.HttpCachePlugin) plugins.push(new utils.HttpCachePlugin());
        if (utils.CatchEscapedLinksPlugin) {
          plugins.push(new utils.CatchEscapedLinksPlugin(() => new URL(location.href)));
        }
        proxyFrame = controller.createFrame(frame, { plugins });
        frames.set(frame, proxyFrame);
      }
      proxyFrame.go(target.href);
      status.textContent = "Opened " + target.hostname + ". Some sites may block embedding or require features unavailable on Vercel's serverless transport.";
    } catch (error) {
      status.textContent = "Could not start browsing: " + (error && error.message ? error.message : "unknown error");
    } finally {
      if (go) go.disabled = false;
    }
  }

  document.addEventListener("submit", browseSubmit);
})();

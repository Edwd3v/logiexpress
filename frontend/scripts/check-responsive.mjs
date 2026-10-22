import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createServer } from "node:net";

const viewports = [
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
];
const pageUrl = process.env.LOGIEXPRESS_TEST_URL ?? "http://127.0.0.1:5173/";
const screenshotDirectory = process.env.RESPONSIVE_SCREENSHOT_DIR;
const chrome = findChrome();
const temporaryRoot = process.env.OPENCODE_TMPDIR ?? "/tmp/opencode";
const profile = await mkdtemp(join(temporaryRoot, "logiexpress-responsive-chrome-"));
const port = await reservePort();
const browser = spawn(
  chrome,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-address=127.0.0.1`,
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

let socket;
try {
  const version = await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const targetResponse = await fetch(
    `http://127.0.0.1:${port}/json/new?${encodeURIComponent(pageUrl)}`,
    { method: "PUT" },
  );
  assert.equal(targetResponse.status, 200, "Chrome must open a page target");
  const target = await targetResponse.json();
  assert.ok(version.webSocketDebuggerUrl && target.webSocketDebuggerUrl);

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await waitForSocket(socket);
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data.toString());
    if (message.id === undefined) return;
    const callbacks = pending.get(message.id);
    if (!callbacks) return;
    pending.delete(message.id);
    if (message.error) callbacks.reject(new Error(message.error.message));
    else callbacks.resolve(message.result);
  });

  function command(method, params = {}) {
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const response = await command("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    assert.equal(response.exceptionDetails, undefined, "page evaluation must succeed");
    return response.result.value;
  }

  await command("Page.enable");
  await command("Runtime.enable");
  await command("Page.navigate", { url: pageUrl });
  await waitForPage(evaluate);

  if (screenshotDirectory) await mkdir(screenshotDirectory, { recursive: true });
  for (const viewport of viewports) {
    await command("Emulation.setDeviceMetricsOverride", {
      ...viewport,
      deviceScaleFactor: 1,
      mobile: viewport.width <= 600,
    });
    await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");

    const before = await evaluate(`(() => {
      const width = document.documentElement.clientWidth;
      const required = [document.querySelector('#origin'), document.querySelector('#destination'), document.querySelector('form.controls button[type="submit"]')];
      const visible = required.every(element => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && rect.left >= -1 && rect.right <= width + 1;
      });
      const clipped = [...document.body.querySelectorAll('*')]
        .filter(element => {
          const style = getComputedStyle(element);
          return element.clientWidth > 0
            && element.scrollWidth > element.clientWidth + 1
            && (style.overflowX === 'hidden' || style.overflowX === 'clip' || style.textOverflow === 'ellipsis');
        })
        .slice(0, 8)
        .map(element => ({
          tag: element.tagName,
          className: String(element.className?.baseVal ?? element.className ?? '').slice(0, 80),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        }));
      return {
        viewport: window.innerWidth,
        viewportHeight: window.innerHeight,
        clientWidth: width,
        mapViewport: (() => {
          const map = document.querySelector('.graph-stage');
          if (!map) return null;
          return {
            clientWidth: map.clientWidth,
            contentWidth: map.scrollWidth,
            overflowX: getComputedStyle(map).overflowX,
          };
        })(),
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        controlsVisible: visible,
        clipped,
        nodes: document.querySelectorAll('.svg-node').length,
        roads: document.querySelectorAll('.road-surface').length,
        overflow: [...document.body.querySelectorAll('*')]
          .map(element => ({ element, rect: element.getBoundingClientRect() }))
          .filter(({ element, rect }) => rect.width > 0
            && (rect.left < -1 || rect.right > width + 1)
            && !element.closest('.graph-stage'))
          .slice(0, 6)
          .map(({ element, rect }) => ({ tag: element.tagName, className: String(element.className?.baseVal ?? element.className ?? '').slice(0, 80), left: Math.round(rect.left), right: Math.round(rect.right) }))
      };
    })()`);
    assert.equal(before.nodes, 18, `${viewport.width}px: graph must be loaded from FastAPI`);
    assert.equal(before.roads, 33, `${viewport.width}px: all backend roads must be rendered`);
    assert.equal(before.viewport, viewport.width, `${viewport.width}px: use the requested CSS viewport width`);
    assert.equal(before.viewportHeight, viewport.height, `${viewport.width}px: use the requested CSS viewport height`);
    assert.equal(before.controlsVisible, true, `${viewport.width}px: route controls must fit the viewport`);
    assert.ok(
      before.document <= before.viewport && before.body <= before.viewport,
      `${viewport.width}px: horizontal overflow: ${JSON.stringify(before)}`,
    );
    assert.deepEqual(before.overflow, [], `${viewport.width}px: content extends beyond the viewport: ${JSON.stringify(before.overflow)}`);
    assert.deepEqual(before.clipped, [], `${viewport.width}px: clipped content: ${JSON.stringify(before.clipped)}`);
    if (viewport.width <= 600) {
      assert.ok(before.mapViewport.contentWidth > before.mapViewport.clientWidth, `${viewport.width}px: the map must remain horizontally scrollable.`);
      assert.equal(before.mapViewport.overflowX, "auto", `${viewport.width}px: map overflow must be explicitly scrollable.`);
    }

    await evaluate(`document.querySelector('form.controls button[type="submit"]').click()`);
    const result = await waitForResult(evaluate);
    assert.ok(result.found, `${viewport.width}px: Python route result must be found`);
    assert.ok(result.pathEdges > 0, `${viewport.width}px: the SVG must highlight the returned path`);
    assert.deepEqual(result.renderedPath, result.apiPath, `${viewport.width}px: SVG route must match Python path`);
    assert.equal(result.renderedWeight, String(result.apiWeight), `${viewport.width}px: displayed cost must match Python`);
    assert.equal(result.renderedHops, String(result.apiHops), `${viewport.width}px: displayed hops must match Python`);

    for (const algorithm of ["bfs", "dfs"]) {
      await evaluate(`document.querySelector('input[name="algorithm"][value="${algorithm}"]').click()`);
      await evaluate(`document.querySelector('form.controls button[type="submit"]').click()`);
      const algorithmResult = await waitForResult(evaluate);
      assert.equal(algorithmResult.apiAlgorithm, algorithm, `${viewport.width}px: ${algorithm} must come from FastAPI`);
      assert.ok(algorithmResult.found, `${viewport.width}px: ${algorithm} route must be found`);
      assert.deepEqual(algorithmResult.renderedPath, algorithmResult.apiPath, `${viewport.width}px: ${algorithm} SVG route must match Python`);
    }

    await evaluate(`document.querySelector('input[name="mode"][value="single"]').click()`);
    await evaluate(`document.querySelector('input[name="algorithm"][value="dijkstra"]').click()`);
    await evaluate(`document.querySelector('form.controls button[type="submit"]').click()`);
    const singleRouteResult = await waitForResult(evaluate);
    assert.equal(singleRouteResult.apiAlgorithm, "dijkstra", `${viewport.width}px: single-route mode must call Python`);
    assert.deepEqual(singleRouteResult.renderedPath, ["A", "E", "F", "D"], `${viewport.width}px: individual route must match FastAPI`);

    await evaluate(`(() => {
      const origin = document.querySelector('#origin');
      const destination = document.querySelector('#destination');
      const setValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setValue.call(origin, 'K');
      origin.dispatchEvent(new Event('change', { bubbles: true }));
      setValue.call(destination, 'R');
      destination.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await evaluate(`document.querySelector('form.controls button[type="submit"]').click()`);
    const selectedPairResult = await waitForResult(evaluate);
    assert.equal(selectedPairResult.apiOrigin, "K", `${viewport.width}px: selected origin must be sent to FastAPI`);
    assert.equal(selectedPairResult.apiDestination, "R", `${viewport.width}px: selected destination must be sent to FastAPI`);
    assert.equal(selectedPairResult.selectedEndpoints, true, `${viewport.width}px: selected endpoints must be marked on the map`);

    await evaluate(`(() => {
      const origin = document.querySelector('#origin');
      const destination = document.querySelector('#destination');
      const setValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setValue.call(origin, 'A');
      origin.dispatchEvent(new Event('change', { bubbles: true }));
      setValue.call(destination, 'D');
      destination.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('input[name="algorithm"][value="dijkstra"]').click();
    })()`);
    await evaluate(`document.querySelector('form.controls button[type="submit"]').click()`);
    const restoredResult = await waitForResult(evaluate);
    assert.deepEqual(restoredResult.apiPath, ["A", "E", "F", "D"], `${viewport.width}px: Dijkstra must return the expected Python path`);

    if (screenshotDirectory) {
      const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(join(screenshotDirectory, `${viewport.width}x${viewport.height}.png`), Buffer.from(screenshot.data, "base64"));
      if (viewport.width <= 600) {
        const mapPosition = await evaluate(`(() => {
          const map = document.querySelector('.graph-stage');
          const rect = map.getBoundingClientRect();
          const centeredTop = rect.top + window.scrollY - (window.innerHeight - rect.height) / 2;
          window.scrollTo({ top: Math.max(0, centeredTop), behavior: 'instant' });
          const visibleRect = map.getBoundingClientRect();
          return { top: visibleRect.top, bottom: visibleRect.bottom, scrollY: window.scrollY, height: window.innerHeight };
        })()`);
        await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
        const mapScreenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        await writeFile(join(screenshotDirectory, `${viewport.width}x${viewport.height}-map.png`), Buffer.from(mapScreenshot.data, "base64"));
        const mapScroll = await evaluate(`(() => {
          const map = document.querySelector('.graph-stage');
          map.scrollLeft = map.scrollWidth;
          return { left: map.scrollLeft, maximum: map.scrollWidth - map.clientWidth };
        })()`);
        assert.ok(mapScroll.left > 0, `${viewport.width}px: the map roads must remain horizontally scrollable.`);
        await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
        const mapRightScreenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        await writeFile(join(screenshotDirectory, `${viewport.width}x${viewport.height}-map-right.png`), Buffer.from(mapRightScreenshot.data, "base64"));
        console.log(`${viewport.width}x${viewport.height} map screenshot: ${JSON.stringify(mapPosition)}`);
        console.log(`${viewport.width}x${viewport.height} horizontal map scroll: ${JSON.stringify(mapScroll)}`);
        await evaluate("window.scrollTo(0, 0)");
      }
    }
    console.log(`${viewport.width}x${viewport.height}: no horizontal overflow; controls usable; Python result and SVG path verified.`);
  }
} finally {
  socket?.close();
  if (browser.exitCode === null) {
    const exited = new Promise(resolve => browser.once("exit", resolve));
    browser.kill("SIGTERM");
    await exited;
  }
  await rm(profile, { recursive: true, force: true });
}

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "google-chrome-stable",
    "google-chrome",
    "chromium",
    "chromium-browser",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (spawnSync(candidate, ["--version"], { stdio: "ignore" }).status === 0) return candidate;
  }
  throw new Error("Chrome/Chromium was not found; set CHROME_BIN to its executable path.");
}

async function reservePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port: availablePort } = server.address();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return availablePort;
}

async function waitForJson(url) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Chrome DevTools did not start.");
}

function waitForSocket(webSocket) {
  return new Promise((resolve, reject) => {
    webSocket.addEventListener("open", resolve, { once: true });
    webSocket.addEventListener("error", reject, { once: true });
  });
}

async function waitForPage(evaluate) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const loaded = await evaluate("document.readyState === 'complete' && document.querySelectorAll('.svg-node').length === 18 && document.querySelectorAll('.road-surface').length === 33");
    if (loaded) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Dashboard did not load from ${pageUrl}.`);
}

async function waitForResult(evaluate) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const result = await evaluate(`(async () => {
      const title = document.querySelector('.result-title')?.textContent ?? '';
      if (!title) return null;
      const pathEdges = document.querySelectorAll('.road-highlight').length;
      const mode = document.querySelector('[name="mode"]:checked')?.value ?? 'single';
      const algorithm = document.querySelector('[name="algorithm"]:checked')?.value ?? 'dijkstra';
      const request = {
        origin: document.querySelector('#origin').value,
        destination: document.querySelector('#destination').value,
      };
      const compare = mode === 'compare';
      if (!compare) request.algorithm = algorithm;
      const response = await fetch(compare ? '/api/routes/compare' : '/api/routes/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Python route endpoint returned HTTP ' + response.status);
      const payload = await response.json();
      const apiResult = compare ? payload[algorithm] : payload;
      const numbers = [...document.querySelectorAll('.result-number .number')].map(element => element.textContent.trim());
      const originNode = [...document.querySelectorAll('.svg-node')].find(node => node.dataset.nodeId === apiResult.origin);
      const destinationNode = [...document.querySelectorAll('.svg-node')].find(node => node.dataset.nodeId === apiResult.destination);
      return {
        found: apiResult.found && title.includes('Camino encontrado'),
        pathEdges,
        apiAlgorithm: apiResult.algorithm,
        apiOrigin: apiResult.origin,
        apiDestination: apiResult.destination,
        apiPath: apiResult.path,
        apiWeight: apiResult.total_weight,
        apiHops: apiResult.hops,
        renderedPath: [...document.querySelectorAll('.route-node')].map(element => element.textContent.trim()),
        renderedWeight: numbers[0],
        renderedHops: numbers[1],
        selectedEndpoints: originNode?.classList.contains('is-origin')
          && destinationNode?.classList.contains('is-destination'),
      };
    })()`);
    if (result) return result;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("The route calculation did not produce a visible result.");
}

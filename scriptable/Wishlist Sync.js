const API_BASE =
  "https://wishlist.kotaaaaaaaa12.workers.dev";

const TOKEN_KEY =
  "amazon-wishlist-sync-token";

const DEBUG_METADATA =
  false;

const RUN_STATE_KEY = "amazon-wishlist-sync-run-state";
let previousRunState = null;
let tracksRun = false;

await main();
finishRun();

async function main() {
  const shared = getSharedAmazonData();
  if (await handoffToApp(shared)) return;
  previousRunState = readRunState();
  tracksRun = true;
  recordRunStage("started");

  if (!shared) {
    const token = await getToken();
    if (!token) return;

    await showMainMenu(token);
    return;
  }

  const token = await getToken();
  if (!token) return;

  if (isWishlistUrl(shared.url)) {
    await registerWishlist(shared.url, token);
    return;
  }

  if (isProductUrl(shared.url)) {
    await addProduct(shared, token);
    return;
  }

  await showMessage(
    "Unsupported URL",
    `Received URL:\n${shared.url}`
  );
}

async function handoffToApp(shared) {
  if (config.runsInApp || !(config.runsInActionExtension || config.runsWithSiri)) return false;
  if (args.queryParameters?.wishlistAppHandoff === "1") {
    await showMessage("Open Scriptable", "Open Wishlist Sync directly in the Scriptable app to continue.");
    return true;
  }
  const base = URLScheme.forRunningScript();
  const parameters = { wishlistAppHandoff: "1" };
  if (shared) {
    parameters.amazonUrl = shared.url;
    parameters.amazonTitle = (shared.title || "").slice(0, 1500);
    parameters.amazonText = (shared.rawText || shared.url).slice(0, 4000);
  }
  const query = Object.entries(parameters).map(([key, value]) =>
    `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
  // Open the main app before loading Amazon; never pass the sync token in the URL.
  Safari.open(`${base}${base.includes("?") ? "&" : "?"}${query}`);
  return true;
}

function executionContext() {
  return { runsInApp: Boolean(config.runsInApp),
    runsInActionExtension: Boolean(config.runsInActionExtension),
    runsWithSiri: Boolean(config.runsWithSiri) };
}

function readRunState() {
  try { return Keychain.contains(RUN_STATE_KEY) ? JSON.parse(Keychain.get(RUN_STATE_KEY)) : null; }
  catch { return null; }
}

function recordRunStage(stage, details = {}) {
  if (!tracksRun) return;
  try {
    Keychain.set(RUN_STATE_KEY, JSON.stringify({ version: "app-run-7", stage,
      time: new Date().toISOString(), ...executionContext(), ...details }));
  } catch {}
}

function finishRun() {
  recordRunStage("finished");
  // The main app can finish naturally. Explicit completion is for external execution.
  if (!config.runsInApp) Script.complete();
}

async function copyRunDiagnostics() {
  Pasteboard.copyString(JSON.stringify({ previousRun: previousRunState,
    currentRun: readRunState(), execution: executionContext() }, null, 2));
  await showMessage("Report Copied", "The report contains execution flags and the last recorded stage. It does not contain your sync token.");
}

function getSharedAmazonData() {
  const query = args.queryParameters || {};
  if (query.amazonUrl && (isProductUrl(query.amazonUrl) || isWishlistUrl(query.amazonUrl))) {
    return { url: query.amazonUrl, title: query.amazonTitle || null,
      rawText: query.amazonText || query.amazonUrl };
  }
  const values = [];
  collectInputValues(args.plainTexts, values);
  collectInputValues(args.shortcutParameter, values);
  collectInputValues(args.urls, values);

  let fallback = null;

  for (const value of values) {
    const result = extractAmazonData(String(value));
    if (!result) continue;
    if (result.title) return result;
    fallback ??= result;
  }

  return fallback;
}

function collectInputValues(value, output) {
  if (value === null || value === undefined) return;

  if (typeof value === "string" || typeof value === "number") {
    output.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectInputValues(item, output);
    return;
  }

  if (typeof value === "object") {
    for (const item of Object.values(value)) collectInputValues(item, output);
  }
}

function extractAmazonData(text) {
  const match = text.match(
    /https?:\/\/(?:www\.)?amazon\.(?:jp|co\.jp)\/[^\s<>"']+/i
  );

  if (!match) return null;

  const url = match[0].replace(/[)\],.!?]+$/, "");
  const beforeUrl = text.slice(0, match.index).trim();

  return {
    url,
    title: beforeUrl || null,
    rawText: text
  };
}

function isWishlistUrl(url) {
  return /^https?:\/\/(?:www\.)?amazon\.(?:jp|co\.jp)\/hz\/wishlist\/ls\/[A-Z0-9]+/i.test(
    url
  );
}

function isProductUrl(url) {
  return (
    /^https?:\/\/(?:www\.)?amazon\.(?:jp|co\.jp)\/dp\/[A-Z0-9]{10}(?:[/?]|$)/i.test(
      url
    ) ||
    /^https?:\/\/(?:www\.)?amazon\.(?:jp|co\.jp)\/gp\/product\/[A-Z0-9]{10}(?:[/?]|$)/i.test(
      url
    ) ||
    /^https?:\/\/(?:www\.)?amazon\.(?:jp|co\.jp)\/gp\/aw\/d\/[A-Z0-9]{10}(?:[/?]|$)/i.test(
      url
    )
  );
}

function extractAsin(url) {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})(?:[/?]|$)/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1].toUpperCase();
  }

  return null;
}

async function getToken() {
  if (Keychain.contains(TOKEN_KEY)) {
    return Keychain.get(TOKEN_KEY).trim();
  }

  const alert = new Alert();
  alert.title = "Wishlist Sync Setup";
  alert.message = "Enter your SYNC_TOKEN.";
  alert.addSecureTextField("SYNC_TOKEN");
  alert.addAction("Save");
  alert.addCancelAction("Cancel");

  const result = await alert.presentAlert();
  if (result === -1) return null;

  const token = alert.textFieldValue(0).trim();
  if (!token) {
    await showMessage("Error", "SYNC_TOKEN cannot be empty.");
    return null;
  }

  Keychain.set(TOKEN_KEY, token);
  return token;
}

async function registerWishlist(url, token) {
  const alert = new Alert();
  alert.title = "Register Wishlist";
  alert.message = "Enter a name for this Amazon wishlist.";
  alert.addTextField("Name", "");
  alert.addTextField("Slug", "");
  alert.addAction("Register");
  alert.addCancelAction("Cancel");

  const result = await alert.presentAlert();
  if (result === -1) return;

  const name = alert.textFieldValue(0).trim();
  let slug = alert.textFieldValue(1).trim();

  if (!name) {
    await showMessage("Error", "Wishlist name is required.");
    return;
  }

  if (!slug) slug = makeSlug(name);

  if (!slug) {
    await showMessage(
      "Error",
      "Enter a simple English slug such as main, books, or pc."
    );
    return;
  }

  const response = await apiRequest(
    "/api/wishlists",
    "POST",
    {
      name,
      slug,
      amazonUrl: url
    },
    token
  );

  if (!response.ok) {
    await showMessage(
      "Could Not Register",
      response.data?.error || `HTTP ${response.status}`
    );
    return;
  }

  await showMessage(
    "Wishlist Registered",
    `${name} was registered successfully.`
  );
}

async function addProduct(shared, token) {
  let title = shared.title;
  recordRunStage("product-start", { asin: extractAsin(shared.url) });
  const metadata = await fetchAmazonMetadata(shared.url);

  if (metadata.cancelled) return;
  if (!metadata.imageUrl || (metadata.price === null && metadata.availability !== "unavailable")) {
    if (!await showMetadataFailureReport(metadata)) return;
  }
  if (DEBUG_METADATA) await showMetadataDebug(metadata);
  if (!title && metadata.title) title = metadata.title;

  let price = null;
  let priceMode = "none";

  if (metadata.availability === "unavailable") {
    const manual = await requestManualPrice(true);
    if (manual.cancelled) return;

    price = manual.price;
    priceMode = price !== null ? "manual" : "none";
  } else {
    const sharedPrice = extractPriceFromText(shared.rawText);

    if (metadata.price !== null) {
      price = metadata.price;
      priceMode = "auto";
    } else if (sharedPrice !== null) {
      price = sharedPrice;
      priceMode = "auto";
    } else {
      const manual = await requestManualPrice(false);
      if (manual.cancelled) return;

      price = manual.price;
      priceMode = price !== null ? "manual" : "none";
    }
  }

  if (priceMode === "auto") {
    recordRunStage("price-confirmation");
    const checked = await confirmDetectedPrice(price, metadata);
    if (checked.cancelled) return;
    if (checked.price !== price) priceMode = checked.price === null ? "none" : "manual";
    price = checked.price;
  }
  const clearPrice = price === null;

  recordRunStage("priority");
  const priority = await choosePriority(
    "Set Priority",
    "Choose a priority for this item."
  );

  if (priority === null) return;

  const body = {
    url: shared.url,
    title,
    imageUrl: metadata.imageUrl,
    price,
    currency: price !== null ? "JPY" : null,
    clearPrice,
    priority
  };

  recordRunStage("sending");
  const response = await apiRequest(
    "/api/items",
    "POST",
    body,
    token
  );

  if (response.ok) {
    await showAddedMessage(response, priceMode);
    return;
  }

  if (
    response.status === 409 &&
    response.data?.needsWishlist &&
    Array.isArray(response.data?.wishlists)
  ) {
    const selected = await chooseWishlist(response.data.wishlists);
    if (!selected) return;

    const retry = await apiRequest(
      "/api/items",
      "POST",
      {
        ...body,
        list: selected.slug
      },
      token
    );

    if (!retry.ok) {
      await showMessage(
        "Could Not Add Item",
        retry.data?.error || `HTTP ${retry.status}`
      );
      return;
    }

    await showAddedMessage(retry, priceMode);
    return;
  }

  await showMessage(
    "Could Not Add Item",
    response.data?.error || `HTTP ${response.status}`
  );
}

async function confirmDetectedPrice(price, metadata) {
  while (true) {
    const alert = new Alert();
    alert.title = "Check Price Before Saving";
    alert.message = "Compare this price with the Amazon page. Edit it if needed. Leave it empty to save without a price and clear any previous price.";
    alert.addTextField("Price in JPY", String(price));
    alert.addAction("Save This Price");
    alert.addAction("Copy Price Report");
    alert.addCancelAction("Cancel");
    const choice = await alert.presentAlert();
    if (choice === -1) return { cancelled: true };
    if (choice === 1) {
      Pasteboard.copyString(JSON.stringify({ version: "metadata-price-9",
        detectedPrice: metadata.price, priceSource: metadata.priceSource,
        imageDetected: Boolean(metadata.imageUrl),
        attempts: metadata.debug.attempts || [] }, null, 2));
      continue;
    }
    const raw = alert.textFieldValue(0).trim();
    if (!raw) return { cancelled: false, price: null };
    const value = parseManualPrice(raw);
    if (value !== null) return { cancelled: false, price: value };
    await showMessage("Invalid Price", "Enter a valid positive price in JPY.");
  }
}

async function fetchAmazonMetadata(url) {
  const asin = extractAsin(url);
  if (!asin) return emptyMetadata("ASIN not found.");
  // Preserve the shared language, variant, and offer parameters.
  const productUrl = String(url).replace(/#.*$/, "");
  let result = emptyMetadata("No product metadata was found.");
  const attempts = [];
  let view = null;
  try {
    // Use one browser and return only metadata, never the full product HTML.
    view = new WebView();
    view.shouldAllowRequest = allowAmazonMetadataRequest;
    const request = new Request(productUrl);
    request.timeoutInterval = 20;
    recordRunStage("amazon-loading", { asin });
    await view.loadRequest(request);
    recordRunStage("amazon-extracting", { asin });
    let data = await readRenderedAmazonMetadata(view, asin);
    result = finalizeAmazonMetadata(data);
    attempts.push({ transport: "webview", ...data.diagnostics, error: data.error || result.debug.error });

    if (!result.imageUrl || (result.price === null && result.availability !== "unavailable")) {
      const alert = new Alert();
      alert.title = "Amazon Metadata Incomplete";
      alert.message = `${result.debug.error || "The product price or image could not be read."}\nOpen the product page, complete any verification, then tap Done to retry.`;
      alert.addAction("Open Amazon and Retry");
      alert.addAction("Continue with Available Data");
      alert.addCancelAction("Cancel");
      const choice = await alert.presentAlert();
      if (choice === -1) return { ...result, cancelled: true };
      if (choice === 0) {
        // Show the main product image without enabling all recommendation media.
        view.shouldAllowRequest = request => allowAmazonMetadataRequest(request, true);
        await view.evaluateJavaScript(`
          for (const img of document.querySelectorAll('#main-image, #landingImage, #imgBlkFront')) {
            const src = img.getAttribute('src');
            if (src) { img.removeAttribute('src'); img.setAttribute('src', src); }
          }
        `);
        await view.present();
        data = await readRenderedAmazonMetadata(view, asin);
        const retry = finalizeAmazonMetadata(data);
        attempts.push({ transport: "webview-after-done", ...data.diagnostics, error: data.error || retry.debug.error });
        // Keep earlier valid metadata if a later navigation is not the requested product.
        if (retry.debug.validProduct) {
          result = {
            ...retry,
            imageUrl: retry.imageUrl || result.imageUrl,
            imageSource: retry.imageSource || result.imageSource,
            price: retry.price ?? (retry.availability === "unavailable" ? null : result.price),
            priceSource: retry.priceSource || result.priceSource
          };
        } else if (!result.debug.validProduct) {
          result = retry;
        }
      }
    }
  } catch (error) {
    result.debug.browserError = String(error);
    attempts.push({ transport: "webview", error: String(error) });
  } finally {
    if (view) {
      // Stop the Amazon document before showing item-management dialogs.
      recordRunStage("amazon-unloading", { asin });
      try { await view.evaluateJavaScript("window.stop();"); } catch {}
      try { await view.loadHTML("<html><body></body></html>"); } catch {}
      recordRunStage("amazon-unloaded", { asin });
      view = null;
    }
  }
  result.debug.attempts = attempts;
  return result;
}

function allowAmazonMetadataRequest(request, showImages = false) {
  const url = String(request.url || "");
  if (/captcha|validateCaptcha/i.test(url)) return true;
  if (/\.(?:mp4|webm|m3u8|woff2?|ttf|otf)(?:[?#]|$)/i.test(url)) return false;
  if (!showImages && /\/images\/I\//i.test(url)) return false;
  return true;
}

async function readRenderedAmazonMetadata(view, asin) {
  return view.evaluateJavaScript(`
    (() => {
      const read = (${readAmazonProductDocument.toString()});
      let attempts = 0;
      function sample() {
        try {
          let data = read(document, ${JSON.stringify(asin)}, true);
          if ((data.validProduct && data.imageUrl && (data.price !== null || data.availability === "unavailable")) || data.diagnostics?.captchaFound || attempts++ >= 10) {
            if (!(data.validProduct && data.imageUrl && (data.price !== null || data.availability === "unavailable"))) {
              data = read(document, ${JSON.stringify(asin)}, true, true);
            }
            completion(data);
          } else {
            setTimeout(sample, 500);
          }
        } catch (error) {
          completion({ validProduct: false, error: String(error) });
        }
      }
      sample();
    })();
  `, true);
}

async function showMetadataFailureReport(metadata) {
  const report = JSON.stringify({
    version: "metadata-price-9",
    price: metadata.price,
    imageDetected: Boolean(metadata.imageUrl),
    availability: metadata.availability,
    attempts: metadata.debug.attempts || [],
    error: metadata.debug.error,
    browserError: metadata.debug.browserError
  }, null, 2);
  const alert = new Alert();
  alert.title = "Amazon Retrieval Report";
  alert.message = "The product data is incomplete. You can copy a compact report for troubleshooting, or continue with the data already found.";
  alert.addAction("Copy Report and Continue");
  alert.addAction("Continue");
  alert.addCancelAction("Cancel");
  const choice = await alert.presentAlert();
  if (choice === 0) Pasteboard.copyString(report);
  return choice !== -1;
}

function finalizeAmazonMetadata(data) {
  const status = 0;
  if (!data || !data.validProduct) {
    const result = emptyMetadata(data?.error || "Amazon did not return the requested product page.");
    result.debug.status = status;
    result.debug.page = data?.diagnostics;
    return result;
  }
  const imageUrl = cleanAmazonImageUrl(data.imageUrl);
  return {
    title: data.title,
    price: data.price,
    availability: data.availability,
    priceSource: data.priceSource,
    imageUrl,
    imageSource: imageUrl ? data.imageSource : null,
    debug: { status, validProduct: true, availability: data.availability,
      priceSource: data.priceSource, imageSource: data.imageSource,
      error: !imageUrl || (data.price === null && data.availability !== "unavailable")
        ? "Amazon returned a product page with incomplete metadata." : null }
  };
}

function readAmazonProductDocument(doc, expectedAsin, rendered = false, includeDetails = false) {
  const text = (node) => (node?.textContent || "").replace(/\s+/g, " ").trim();
  const titleNode = doc.querySelector("#productTitle, #title #titleText, #btAsinTitle");
  let title = text(titleNode);
  const pageAsin = doc.querySelector('input#ASIN, input[name="ASIN"]')?.value ||
    doc.querySelector("#dp[data-asin]")?.getAttribute("data-asin");
  const diagnostics = {
    expectedAsin, pageAsin: pageAsin || null, productTitleFound: Boolean(title),
    documentTitle: doc.title || null, readyState: doc.readyState || null,
    path: rendered ? doc.location?.pathname || null : null,
    captchaFound: Boolean(doc.querySelector('form[action*="validateCaptcha"], #captchacharacters')),
  };
  if (includeDetails) {
    Object.assign(diagnostics, {
    priceRegions: [...doc.querySelectorAll('[id*="corePrice"], [id*="apexPrice"], #apex_desktop, #apex_mobile, #price_inside_buybox, #newBuyBoxPrice')].slice(0, 12).map(node => ({
      id: node.id,
      priceClasses: [...node.querySelectorAll('.a-price')].slice(0, 8).map(n => n.className)
    })),
    priceCandidates: [...doc.querySelectorAll('.a-price, #priceblock_ourprice, #priceblock_dealprice, #priceblock_saleprice')].slice(0, 15).map(node => ({
      text: text(node).slice(0, 100), classes: node.className,
      ancestors: [node.parentElement, node.parentElement?.parentElement, node.parentElement?.parentElement?.parentElement].filter(Boolean).map(n => ({ id: n.id || null, classes: n.className }))
    })),
    mainImages: [...doc.querySelectorAll('#landingImage, #imgBlkFront, #main-image, #mainImage, #imageBlock img, #main-image-container img')].slice(0, 8).map(node => ({
      id: node.id || null, src: node.getAttribute("src"), dataSrc: node.getAttribute("data-src"),
      hasDynamicImage: Boolean(node.getAttribute("data-a-dynamic-image")),
      hidden: node.hidden, style: node.getAttribute("style")
    }))
    });
  }
  const locationAsin = rendered ? doc.location?.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i)?.[1] : null;
  if ((pageAsin && pageAsin.toUpperCase() !== expectedAsin) ||
      (locationAsin && locationAsin.toUpperCase() !== expectedAsin)) {
    return { validProduct: false, diagnostics, error: "The loaded product ASIN does not match the shared product." };
  }
  const canonicalUrl = doc.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";
  const canonicalAsin = canonicalUrl.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i)?.[1];
  if (canonicalAsin && canonicalAsin.toUpperCase() !== expectedAsin) {
    return { validProduct: false, diagnostics, error: "The canonical product ASIN does not match the shared product." };
  }
  const identityMatches = [pageAsin, locationAsin, canonicalAsin].some(value => value?.toUpperCase() === expectedAsin);
  if (!title && identityMatches && !diagnostics.captchaFound) {
    const documentTitle = doc.title || "";
    if (/^Amazon(?:\.co\.jp)?\s*[:：|｜]/i.test(documentTitle)) {
      title = documentTitle.replace(/^Amazon(?:\.co\.jp)?\s*[:：|｜]\s*/i, "").trim();
      if (/^Amazon\s*[|｜]/i.test(documentTitle)) {
        title = title.replace(/\s*[|｜][^|｜]*$/, "").trim();
      }
      diagnostics.titleSource = "document-title";
    }
  }
  const hasMainProductImage = Boolean(doc.querySelector("#main-image, #landingImage, #imgBlkFront"));
  if (diagnostics.captchaFound || (!title && !(identityMatches && hasMainProductImage))) {
    return { validProduct: false, diagnostics, error: diagnostics.captchaFound
      ? "Amazon returned a CAPTCHA page."
      : "The product title was not found. See the retrieval report for page details." };
  }
  const visibilityCache = new WeakMap();
  const visibilityReasons = new WeakMap();
  const visible = (node) => {
    if (!node) return false;
    const blocked = (parent, reason) => {
      visibilityReasons.set(node, { id: parent.id || null, classes: parent.className, reason });
      return false;
    };
    for (let parent = node; parent && parent.nodeType === 1; parent = parent.parentElement) {
      if (parent.hidden ||
          /(?:^|\s)aok-hidden(?:\s|$)/.test(parent.className || "") ||
          /display\s*:\s*none|visibility\s*:\s*hidden/i.test(parent.getAttribute("style") || "")) return blocked(parent, "hidden-attribute-class-or-style");
      if (rendered) {
        let style = visibilityCache.get(parent);
        if (!style) { style = doc.defaultView.getComputedStyle(parent); visibilityCache.set(parent, style); }
        if (style.display === "none" || style.visibility === "hidden") return blocked(parent, `computed:${style.display}/${style.visibility}`);
      }
    }
    return true;
  };
  const parsePrice = (value) => {
    const clean = String(value).normalize("NFKC").replace(/[,\s]/g, "");
    const match = clean.match(/^(?:￥|¥)?(\d+)(?:[.]00)?(?:円)?$/);
    const number = match ? Number(match[1]) : NaN;
    return Number.isFinite(number) && number > 0 && number <= 100000000 ? number : null;
  };
  const selectors = [
    "#corePrice_feature_div .priceToPay", "#corePriceDisplay_desktop_feature_div .priceToPay",
    "#corePrice_mobile_feature_div .priceToPay",
    "#corePriceDisplay_mobile_feature_div .priceToPay", "#apex_desktop .priceToPay",
    "#apex_mobile .priceToPay", "#price_inside_buybox", "#newBuyBoxPrice",
    "#priceblock_ourprice", "#priceblock_dealprice", "#priceblock_saleprice",
    "#corePrice_feature_div .a-price", "#corePriceDisplay_desktop_feature_div .a-price",
    "#corePrice_mobile_feature_div .a-price",
    "#corePriceDisplay_mobile_feature_div .a-price", "#apex_desktop .a-price",
    "#apex_mobile .a-price", "#apex_price .apex-pricetopay-value"
  ];
  let price = null;
  let priceSource = null;
  const priceParsing = [];
  const priceEvidence = [];
  const matchedPrices = new Map();
  const excluded = ".reinventMobileHeaderPrice, .show-on-unselected, .a-text-price, .basisPrice, .listPrice, .a-price-range, .pricePerUnit, #usedBuySection, #sponsoredProducts";
  for (const selector of selectors) {
    const values = new Set();
    for (const node of doc.querySelectorAll(selector)) {
      const isVisible = visible(node);
      const isExcluded = Boolean(node.closest(excluded));
      const offscreen = node.querySelector(".a-offscreen");
      const whole = node.querySelector(".a-price-whole");
      const fraction = text(node.querySelector(".a-price-fraction"));
      let detected = null;
      let reason = !isVisible ? "not-displayed" : isExcluded ? "excluded-price" : "unparseable";
      if (isVisible && !isExcluded && (!fraction || /^0+$/.test(fraction))) {
        // ARIA-hidden is an accessibility setting, not a visual visibility setting.
        // Try both accessible and split-number representations of this same price.
        const parts = [offscreen ? parsePrice(text(offscreen)) : null,
          whole ? parsePrice(text(whole).replace(/[.]$/, "")) : null].filter(value => value !== null);
        if (parts.length === 0) {
          const fromText = parsePrice(text(node));
          if (fromText !== null) parts.push(fromText);
        }
        const distinct = new Set(parts);
        if (distinct.size === 1) { detected = [...distinct][0]; reason = "parsed"; }
        else if (distinct.size > 1) reason = "conflicting-number-parts";
      } else if (isVisible && !isExcluded) {
        reason = "nonzero-fraction";
      }
      if (includeDetails && priceParsing.length < 20) {
        priceParsing.push({ selector, reason, detected, hiddenBy: visibilityReasons.get(node) || null,
          ariaHidden: node.getAttribute("aria-hidden"),
          offscreen: text(offscreen).slice(0, 80), whole: text(whole).slice(0, 80), fraction,
          text: text(node).slice(0, 100) });
      }
      if (detected !== null) {
        values.add(detected);
        if (priceEvidence.length < 16) priceEvidence.push({ selector, value: detected });
        if (!matchedPrices.has(detected)) matchedPrices.set(detected, selector);
      }
    }
  }
  // Compare trusted product-price regions instead of taking the first match.
  if (matchedPrices.size === 1) {
    price = [...matchedPrices.keys()][0];
    priceSource = `dom:${matchedPrices.get(price)}`;
  } else if (matchedPrices.size > 1) {
    diagnostics.priceAmbiguous = true;
  }
  diagnostics.priceEvidence = priceEvidence;
  if (includeDetails) diagnostics.priceParsing = priceParsing;

  const availabilityNodes = [...doc.querySelectorAll("#availability, #availabilityInsideBuyBox_feature_div, #outOfStock")].filter(visible);
  const unavailable = availabilityNodes.some(node => /現在在庫切れ|現在(?:この商品は)?お取り扱いできません|一時的に在庫切れ|currently unavailable|temporarily out of stock|out of stock|not currently available/i.test(text(node)));
  let imageUrl = null;
  let imageSource = null;
  for (const selector of ["#landingImage", "#imgBlkFront", "#main-image", "#mainImage", '[data-a-image-name="landingImage"]', "#imageBlock img", "#main-image-container img"]) {
    for (const node of doc.querySelectorAll(selector)) {
      // A blocked image download can leave the primary image hidden while its URL is valid.
      const primary = ["main-image", "landingImage", "imgBlkFront", "mainImage"].includes(node.id);
      if (!primary && !visible(node)) continue;
      const candidates = [node.getAttribute("data-old-hires")];
      try {
        const dynamic = JSON.parse(node.getAttribute("data-a-dynamic-image") || "{}");
        candidates.push(...Object.keys(dynamic).sort((a, b) =>
          (dynamic[b]?.[0] || 0) * (dynamic[b]?.[1] || 0) - (dynamic[a]?.[0] || 0) * (dynamic[a]?.[1] || 0)));
      } catch {}
      candidates.push(node.getAttribute("data-src"), node.getAttribute("data-a-hires"), node.currentSrc, node.getAttribute("src"));
      imageUrl = candidates.find(value => value && /^(?:https:)?\/\/(?:m\.media-amazon\.com|[a-z0-9.-]+\.(?:media-amazon|ssl-images-amazon)\.com)\/images\/I\//i.test(value)) || null;
      if (imageUrl) { imageSource = `dom:${selector}`; break; }
    }
    if (imageUrl) break;
  }
  if (!imageUrl) {
    for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
      const value = doc.querySelector(selector)?.getAttribute("content");
      if (value && /\/images\/I\//i.test(value)) { imageUrl = value; imageSource = selector; break; }
    }
  }
  return { validProduct: true, diagnostics, title, price, priceSource, imageUrl, imageSource,
    availability: price !== null ? "available" : unavailable ? "unavailable" : "unknown" };
}

function emptyMetadata(error) {
  return {
    title: null,
    price: null,
    availability: "unknown",
    priceSource: null,
    imageUrl: null,
    imageSource: null,
    debug: {
      status: 0,
      error
    }
  };
}

function normalizeEmbeddedAmazonText(value) {
  return decodeHtmlEntities(String(value))
    .replace(/\\u0026/gi, "&")
    .replace(/\\u003d/gi, "=")
    .replace(/\\u002f/gi, "/")
    .replace(/\\u003a/gi, ":")
    .replace(/\\\//g, "/");
}

function cleanAmazonImageUrl(value) {
  if (!value) return null;

  let url = normalizeEmbeddedAmazonText(value)
    .trim()
    .replace(/[}\],;]+$/, "");

  if (url.startsWith("//")) url = `https:${url}`;
  if (!/^https:\/\//i.test(url)) return null;
  if (!isAmazonProductImageHost(url)) return null;
  if (!/\/images\/I\//i.test(url)) return null;

  url = url.replace(
    /\._[^/]+_\.(jpg|jpeg|png|webp)(?:[?#].*)?$/i,
    ".$1"
  );

  const imageMatch = url.match(
    /^(https:\/\/[^"'<>\\\s]+?\.(?:jpg|jpeg|png|webp))/i
  );

  return imageMatch ? imageMatch[1] : null;
}

function isAmazonProductImageHost(url) {
  return (
    /^https:\/\/m\.media-amazon\.com\//i.test(url) ||
    /^https:\/\/[^/]+\.media-amazon\.com\//i.test(url) ||
    /^https:\/\/[^/]+\.ssl-images-amazon\.com\//i.test(url)
  );
}

function extractPriceFromText(text) {
  if (!text) return null;

  const patterns = [/(?:￥|¥)\s*([\d,]+)/, /([\d,]+)\s*円/];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const price = normalizeDetectedPrice(match[1]);
      if (price !== null) return price;
    }
  }

  return null;
}

function normalizeDetectedPrice(value) {
  const normalized = String(value).replace(/,/g, "").trim();
  if (!/^\d+$/.test(normalized)) return null;

  const price = Number(normalized);
  if (!Number.isFinite(price) || price <= 0 || price > 100000000) {
    return null;
  }

  return Math.round(price);
}

function cleanHtmlText(value) {
  return decodeHtmlEntities(String(value).replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value) {
  return String(value)
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&yen;/gi, "¥")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, number) =>
      String.fromCharCode(Number(number))
    );
}

async function requestManualPrice(unavailable) {
  while (true) {
    const alert = new Alert();
    alert.title = "Enter Price";
    alert.message = unavailable
      ? "Amazon does not currently show a price for this product. Enter a price manually in JPY, or leave it empty to clear the saved price."
      : "The current Amazon price could not be detected. Enter a price manually in JPY, or leave it empty to clear the saved price.";

    alert.addTextField("Price in JPY", "");
    alert.addAction("Save");
    alert.addCancelAction("Cancel");

    const result = await alert.presentAlert();

    if (result === -1) {
      return {
        cancelled: true,
        price: null
      };
    }

    const raw = alert.textFieldValue(0).trim();

    if (!raw) {
      return {
        cancelled: false,
        price: null
      };
    }

    const price = parseManualPrice(raw);
    if (price !== null) {
      return {
        cancelled: false,
        price
      };
    }

    await showMessage(
      "Invalid Price",
      "Enter a whole JPY amount such as 19980 or 19,980."
    );
  }
}

function parseManualPrice(value) {
  const normalized = String(value)
    .replace(/[０-９]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0xFEE0)
    )
    .replace(/[￥¥円,\s]/g, "");

  if (!/^\d+$/.test(normalized)) return null;
  return normalizeDetectedPrice(normalized);
}

async function showMetadataDebug(metadata) {
  const debug = metadata.debug || {};

  await showMessage(
    "Metadata Debug",
    [
      `HTTP: ${debug.status ?? "unknown"}`,
      `Availability: ${metadata.availability}`,
      `Price: ${metadata.price ?? "NULL"}`,
      `Price source: ${metadata.priceSource || "none"}`,
      `Image URL: ${metadata.imageUrl || "NULL"}`,
      `Image source: ${metadata.imageSource || "none"}`,
      debug.error ? `Error: ${debug.error}` : ""
    ]
      .filter(Boolean)
      .join("\n")
  );
}

async function showAddedMessage(response, priceMode) {
  recordRunStage("saved-awaiting-ok", { asin: response.data?.asin || null });
  const wishlistName = response.data?.wishlist?.name || "wishlist";
  const price = response.data?.price;
  const hasImage = Boolean(response.data?.image_url);
  const priority = normalizePriority(response.data?.priority);

  let firstLine = "No price saved";
  if (price !== null && price !== undefined) firstLine = formatYen(price);

  let priceText = "";
  if (priceMode === "auto") priceText = "\nPrice detected automatically.";
  if (priceMode === "manual") priceText = "\nPrice entered manually.";
  if (priceMode === "none") priceText = "\nSaved without a price.";

  const imageText = hasImage
    ? "\nProduct image detected."
    : "\nProduct image unavailable.";

  const priorityText =
    priority === "none"
      ? "\nPriority: None"
      : `\nPriority: ${capitalize(priority)}`;

  await showMessage(
    "Added",
    `${firstLine}\nSaved to ${wishlistName}.${priceText}${imageText}${priorityText}`
  );
  recordRunStage("saved-ok-dismissed");
}

function formatYen(value) {
  return `¥${Math.round(Number(value)).toLocaleString("ja-JP")}`;
}

async function chooseWishlist(wishlists) {
  const alert = new Alert();
  alert.title = "Choose Wishlist";
  alert.message = "Where should this item be saved?";

  for (const wishlist of wishlists) alert.addAction(wishlist.name);
  alert.addCancelAction("Cancel");

  const index = await alert.presentSheet();
  if (index < 0 || index >= wishlists.length) return null;
  return wishlists[index];
}

async function apiRequest(path, method, body, token) {
  const request = new Request(`${API_BASE}${path}`);
  request.method = method;
  request.headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token.trim()}`
  };

  if (body !== null && body !== undefined) {
    request.headers["Content-Type"] = "application/json";
    request.body = JSON.stringify(body);
  }

  try {
    const data = await request.loadJSON();
    const status = request.response?.statusCode ?? 0;

    return {
      ok: status >= 200 && status < 300,
      status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: request.response?.statusCode ?? 0,
      data: {
        error: String(error)
      }
    };
  }
}

function makeSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePriority(value) {
  const priority = String(value ?? "none").trim().toLowerCase();
  return ["high", "medium", "low"].includes(priority) ? priority : "none";
}

function capitalize(value) {
  const text = String(value ?? "");
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : "";
}

async function choosePriority(title, message) {
  const alert = new Alert();
  alert.title = title;
  alert.message = message;
  alert.addAction("High");
  alert.addAction("Medium");
  alert.addAction("Low");
  alert.addAction("None");
  alert.addCancelAction("Cancel");

  const index = await alert.presentSheet();
  if (index === -1) return null;

  return ["high", "medium", "low", "none"][index] ?? "none";
}

async function getWishlistsFromApi(token) {
  const response = await apiRequest(
    "/api/wishlists",
    "GET",
    null,
    token
  );

  if (!response.ok) {
    await showMessage(
      "Could Not Load Wishlists",
      response.data?.error || `HTTP ${response.status}`
    );
    return null;
  }

  return Array.isArray(response.data?.wishlists)
    ? response.data.wishlists
    : [];
}

async function getItemsFromApi(token, listSlug = null) {
  const path = listSlug
    ? `/api/items?list=${encodeURIComponent(listSlug)}`
    : "/api/items";

  const response = await apiRequest(
    path,
    "GET",
    null,
    token
  );

  if (!response.ok) {
    await showMessage(
      "Could Not Load Items",
      response.data?.error || `HTTP ${response.status}`
    );
    return null;
  }

  return Array.isArray(response.data?.items)
    ? response.data.items
    : [];
}

async function chooseWishlistForManagement(wishlists, includeAll = false) {
  const alert = new Alert();
  alert.title = "Choose Wishlist";

  if (includeAll) {
    alert.addAction("All Wishlists");
  }

  for (const wishlist of wishlists) {
    alert.addAction(wishlist.name);
  }

  alert.addCancelAction("Cancel");
  const index = await alert.presentSheet();
  if (index === -1) return null;

  if (includeAll && index === 0) {
    return {
      name: "All Wishlists",
      slug: null
    };
  }

  const offset = includeAll ? 1 : 0;
  return wishlists[index - offset] ?? null;
}

function formatItemSubtitle(item) {
  const parts = [];

  if (item.price !== null && item.price !== undefined) {
    parts.push(formatYen(item.price));
  } else {
    parts.push("No price");
  }

  const priority = normalizePriority(item.priority);
  parts.push(
    priority === "none"
      ? "No priority"
      : `${capitalize(priority)} priority`
  );

  if (item.wishlist_name) parts.push(item.wishlist_name);
  if (item.asin) parts.push(item.asin);

  return parts.join(" · ");
}

async function selectMultipleItems(items, title) {
  const selected = new Set();
  const table = new UITable();
  table.showSeparators = true;

  function itemKey(item) {
    return `${item.wishlist_slug}:${item.asin}`;
  }

  function render() {
    table.removeAllRows();

    const header = new UITableRow();
    header.isHeader = true;
    header.addText(
      title,
      `${selected.size} selected · ${items.length} shown`
    );
    table.addRow(header);

    const selectAllRow = new UITableRow();
    selectAllRow.dismissOnSelect = false;
    selectAllRow.addText(
      selected.size === items.length ? "Clear all" : "Select all",
      `${items.length} items`
    );

    selectAllRow.onSelect = () => {
      if (selected.size === items.length) {
        selected.clear();
      } else {
        for (const item of items) {
          selected.add(itemKey(item));
        }
      }

      render();
      table.reload();
    };

    table.addRow(selectAllRow);

    for (const item of items) {
      const key = itemKey(item);
      const isSelected = selected.has(key);

      const row = new UITableRow();
      row.dismissOnSelect = false;
      row.addText(
        `${isSelected ? "✓" : "○"} ${item.title || item.asin || "Amazon item"}`,
        formatItemSubtitle(item)
      );

      row.onSelect = () => {
        if (selected.has(key)) selected.delete(key);
        else selected.add(key);

        render();
        table.reload();
      };

      table.addRow(row);
    }

    const done = new UITableRow();
    done.dismissOnSelect = true;
    done.addText(
      selected.size > 0 ? `Done (${selected.size})` : "Done",
      selected.size > 0
        ? "Continue with selected items"
        : "No items selected"
    );
    done.onSelect = () => {};
    table.addRow(done);
  }

  render();
  await table.present(true);

  return items.filter((item) => selected.has(itemKey(item)));
}

async function chooseBulkAction() {
  const alert = new Alert();
  alert.title = "Manage Selected Items";
  alert.addAction("Change Priority");
  alert.addAction("Move Wishlist");
  alert.addAction("Clear Prices");
  alert.addDestructiveAction("Delete Items");
  alert.addCancelAction("Cancel");

  const index = await alert.presentSheet();
  return ["priority", "move", "clear-price", "delete"][index] ?? null;
}

async function runBulkAction(token, items, action, wishlists) {
  const refs = items.map((item) => ({
    asin: item.asin,
    list: item.wishlist_slug
  }));

  const body = {
    action,
    items: refs
  };

  if (action === "priority") {
    const priority = await choosePriority(
      "Change Priority",
      `Apply a priority to ${items.length} selected item${items.length === 1 ? "" : "s"}.`
    );

    if (priority === null) return;
    body.priority = priority;
  }

  if (action === "move") {
    const currentSlugs = new Set(items.map((item) => item.wishlist_slug));
    const choices = wishlists.filter(
      (wishlist) => !(
        currentSlugs.size === 1 &&
        currentSlugs.has(wishlist.slug)
      )
    );

    if (choices.length === 0) {
      await showMessage(
        "No Destination",
        "There is no other wishlist to move these items to."
      );
      return;
    }

    const target = await chooseWishlistForManagement(choices, false);
    if (!target) return;
    body.targetList = target.slug;
  }

  if (action === "clear-price") {
    const confirm = new Alert();
    confirm.title = "Clear Prices?";
    confirm.message =
      `This will remove the current saved price from ${items.length} item${items.length === 1 ? "" : "s"}. Price history will be kept.`;
    confirm.addAction("Clear Prices");
    confirm.addCancelAction("Cancel");

    if (await confirm.presentAlert() === -1) return;
  }

  if (action === "delete") {
    const confirm = new Alert();
    confirm.title = "Delete Items?";
    confirm.message =
      `Delete ${items.length} selected item${items.length === 1 ? "" : "s"}? This also removes their stored price history.`;
    confirm.addDestructiveAction("Delete");
    confirm.addCancelAction("Cancel");

    if (await confirm.presentAlert() === -1) return;
  }

  const response = await apiRequest(
    "/api/items/bulk",
    "POST",
    body,
    token
  );

  if (!response.ok) {
    await showMessage(
      "Bulk Update Failed",
      response.data?.error || `HTTP ${response.status}`
    );
    return;
  }

  const skipped = Array.isArray(response.data?.skipped)
    ? response.data.skipped
    : [];

  const skippedText = skipped.length > 0
    ? `\n${skipped.length} skipped.\n\n${skipped
        .slice(0, 5)
        .map((item) => `${item.asin}: ${item.reason}`)
        .join("\n")}${skipped.length > 5 ? "\n…" : ""}`
    : "";

  await showMessage(
    "Done",
    `${response.data?.updated ?? 0} item${response.data?.updated === 1 ? "" : "s"} updated.${skippedText}`
  );
}

async function askSearchQuery() {
  const alert = new Alert();
  alert.title = "Search Items";
  alert.message = "Search by title, ASIN, wishlist name, or wishlist slug.";
  alert.addTextField("Search", "");
  alert.addAction("Search");
  alert.addCancelAction("Cancel");

  const result = await alert.presentAlert();
  if (result === -1) return null;

  return alert.textFieldValue(0).trim();
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase();
}

function filterItems(items, query) {
  const needle = normalizeSearchText(query).trim();
  if (!needle) return items;

  const terms = needle.split(/\s+/).filter(Boolean);

  return items.filter((item) => {
    const haystack = normalizeSearchText([
      item.title,
      item.asin,
      item.wishlist_name,
      item.wishlist_slug
    ].filter(Boolean).join(" "));

    return terms.every((term) => haystack.includes(term));
  });
}

async function manageItems(token) {
  const wishlists = await getWishlistsFromApi(token);

  if (!wishlists || wishlists.length === 0) {
    if (wishlists) {
      await showMessage(
        "No Wishlists",
        "Register a wishlist first."
      );
    }
    return;
  }

  const selectedWishlist =
    await chooseWishlistForManagement(wishlists, true);

  if (!selectedWishlist) return;

  const items = await getItemsFromApi(
    token,
    selectedWishlist.slug
  );

  if (!items) return;

  if (items.length === 0) {
    await showMessage(
      "No Items",
      "No items are available in that selection."
    );
    return;
  }

  const mode = new Alert();
  mode.title = selectedWishlist.name;
  mode.message =
    `${items.length} item${items.length === 1 ? "" : "s"}`;
  mode.addAction("Search Items");
  mode.addAction("Browse All Items");
  mode.addCancelAction("Cancel");

  const modeIndex = await mode.presentSheet();
  if (modeIndex === -1) return;

  let visibleItems = items;
  let tableTitle = selectedWishlist.name;

  if (modeIndex === 0) {
    const query = await askSearchQuery();
    if (query === null) return;

    visibleItems = filterItems(items, query);
    tableTitle = query ? `Search: ${query}` : selectedWishlist.name;

    if (visibleItems.length === 0) {
      await showMessage(
        "No Results",
        `No items matched “${query}”.`
      );
      return;
    }
  }

  const selected = await selectMultipleItems(
    visibleItems,
    tableTitle
  );

  if (selected.length === 0) return;

  const action = await chooseBulkAction();
  if (!action) return;

  await runBulkAction(
    token,
    selected,
    action,
    wishlists
  );
}

async function manageWishlists(token) {
  while (true) {
    const wishlists = await getWishlistsFromApi(token);
    if (!wishlists) return;

    if (wishlists.length === 0) {
      await showMessage(
        "No Wishlists",
        "Register a wishlist first."
      );
      return;
    }

    const selected =
      await chooseWishlistForManagement(wishlists, false);

    if (!selected) return;

    const action = new Alert();
    action.title = selected.name;
    action.message =
      `Slug: ${selected.slug}\n\n${selected.amazonUrl || ""}`;
    action.addAction("Rename Wishlist");
    action.addAction("Change Amazon URL");
    action.addCancelAction("Back");

    const index = await action.presentSheet();

    if (index === -1) continue;
    if (index === 0) await renameWishlist(token, selected);
    if (index === 1) await changeWishlistUrl(token, selected);
  }
}

async function renameWishlist(token, wishlist) {
  const alert = new Alert();
  alert.title = "Rename Wishlist";
  alert.message =
    `Slug stays unchanged: ${wishlist.slug}`;
  alert.addTextField("Name", wishlist.name || "");
  alert.addAction("Save");
  alert.addCancelAction("Cancel");

  const result = await alert.presentAlert();
  if (result === -1) return;

  const name = alert.textFieldValue(0).trim();

  if (!name) {
    await showMessage(
      "Invalid Name",
      "Wishlist name cannot be empty."
    );
    return;
  }

  const response = await apiRequest(
    "/api/wishlists",
    "POST",
    {
      name,
      slug: wishlist.slug,
      amazonUrl: wishlist.amazonUrl
    },
    token
  );

  if (!response.ok) {
    await showMessage(
      "Rename Failed",
      response.data?.error || `HTTP ${response.status}`
    );
    return;
  }

  await showMessage(
    "Renamed",
    `${wishlist.name} → ${name}`
  );
}

async function changeWishlistUrl(token, wishlist) {
  const alert = new Alert();
  alert.title = "Change Amazon URL";
  alert.message =
    "Paste the Amazon wishlist URL.";
  alert.addTextField(
    "Amazon Wishlist URL",
    wishlist.amazonUrl || ""
  );
  alert.addAction("Save");
  alert.addCancelAction("Cancel");

  const result = await alert.presentAlert();
  if (result === -1) return;

  const amazonUrl =
    alert.textFieldValue(0).trim();

  if (!amazonUrl) {
    await showMessage(
      "Invalid URL",
      "Amazon wishlist URL cannot be empty."
    );
    return;
  }

  if (!isWishlistUrl(amazonUrl)) {
    await showMessage(
      "Invalid URL",
      "Enter a valid Amazon Japan wishlist URL."
    );
    return;
  }

  const response = await apiRequest(
    "/api/wishlists",
    "POST",
    {
      name: wishlist.name,
      slug: wishlist.slug,
      amazonUrl
    },
    token
  );

  if (!response.ok) {
    await showMessage(
      "Update Failed",
      response.data?.error || `HTTP ${response.status}`
    );
    return;
  }

  await showMessage(
    "Updated",
    "Amazon wishlist URL was updated."
  );
}

function formatBackupTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("") + "-" + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}

async function apiTextRequest(path, token) {
  const request = new Request(`${API_BASE}${path}`);
  request.method = "GET";
  request.headers = {
    Accept: "*/*",
    Authorization: `Bearer ${token.trim()}`
  };

  try {
    const text = await request.loadString();
    const status = request.response?.statusCode ?? 0;

    return {
      ok: status >= 200 && status < 300,
      status,
      text
    };
  } catch (error) {
    return {
      ok: false,
      status: request.response?.statusCode ?? 0,
      text: String(error)
    };
  }
}

async function saveExportFile(filename, contents) {
  const manager = FileManager.iCloud();

  const backupDirectory = manager.joinPath(
    manager.documentsDirectory(),
    "Wishlist Sync Backups"
  );

  if (!manager.fileExists(backupDirectory)) {
    manager.createDirectory(backupDirectory, true);
  }

  const path = manager.joinPath(
    backupDirectory,
    filename
  );

  manager.writeString(path, contents);
  return path;
}

async function exportBackup(token) {
  const alert = new Alert();
  alert.title = "Export / Backup";
  alert.message = "Choose an export format.";
  alert.addAction("Full JSON Backup");
  alert.addAction("Items CSV");
  alert.addCancelAction("Cancel");

  const index = await alert.presentSheet();
  if (index === -1) return;

  const isJson = index === 0;
  const format = isJson ? "json" : "csv";
  const extension = isJson ? "json" : "csv";

  const response = await apiTextRequest(
    `/api/export?format=${format}`,
    token
  );

  if (!response.ok) {
    await showMessage(
      "Export Failed",
      `HTTP ${response.status}\n${response.text}`
    );
    return;
  }

  const filename =
    `wishlist-${isJson ? "backup" : "items"}-${formatBackupTimestamp()}.${extension}`;

  await saveExportFile(
    filename,
    response.text
  );

  await showMessage(
    "Export Saved",
    `${filename}\n\nSaved in iCloud Drive > Scriptable > Wishlist Sync Backups.`
  );
}

async function resetSyncToken() {
  const alert = new Alert();
  alert.title = "Reset SYNC_TOKEN?";
  alert.message =
    "The next run will ask for the token again.";
  alert.addDestructiveAction("Reset Token");
  alert.addCancelAction("Cancel");

  if (await alert.presentAlert() === -1) return;

  if (Keychain.contains(TOKEN_KEY)) {
    Keychain.remove(TOKEN_KEY);
  }

  await showMessage(
    "Token Reset",
    "The saved SYNC_TOKEN was removed."
  );
}

async function showMainMenu(token) {
  while (true) {
    const alert = new Alert();
    alert.title = "Wishlist Sync";
    alert.message =
      "Manage your wishlist from Scriptable.";
    alert.addAction("Manage Items");
    alert.addAction("Manage Wishlists");
    alert.addAction("Export / Backup");
    alert.addAction("Reset SYNC_TOKEN");
    alert.addAction("Copy Run Diagnostics");
    alert.addCancelAction("Done");

    const result = await alert.presentSheet();

    if (result === -1) return;
    if (result === 0) await manageItems(token);
    if (result === 1) await manageWishlists(token);
    if (result === 2) await exportBackup(token);
    if (result === 4) await copyRunDiagnostics();

    if (result === 3) {
      await resetSyncToken();
      return;
    }
  }
}

async function showMessage(title, message) {
  const alert = new Alert();
  alert.title = title;
  alert.message = message;
  alert.addAction("OK");
  await alert.presentAlert();
}

(function () {
  "use strict";

  var STORAGE_KEY = "fridaysSelectedPlan";
  var LEGACY_KEY = "selectedPlan";
  var CHECKOUT_URL = "test1_checkout.html";
  var PLAN_URL = "test1.html";

  var PLANS = {
    medication: {
      id: "medication",
      value: "211",
      name: "Medication Only",
      shortName: "Medication Only",
      price: "$389",
      period: "",
      total: "$389",
      supply: "1-month supply",
      billing: "Single month only. One-time purchase.",
      triggerUpgrade: "monthly",
    },
    monthly: {
      id: "monthly",
      value: "3",
      name: "Monthly Auto-Refill",
      shortName: "Monthly Auto-Refill",
      price: "$359",
      period: "/mo",
      total: "$359",
      supply: "1-month supply",
      billing: "Billed every 28 days. Pause or cancel anytime.",
      triggerUpgrade: "threeMonth",
    },
    threeMonth: {
      id: "threeMonth",
      value: "231",
      name: "3-Month Supply",
      shortName: "3 Month Supply",
      price: "$232",
      originalPrice: "$389",
      period: "/mo",
      total: "$696",
      supply: "3-month supply",
      billing: "Billed quarterly. Pause or cancel anytime.",
    },
    sixMonth: {
      id: "sixMonth",
      value: "232",
      name: "6 Month Supply",
      shortName: "6 Month Supply",
      price: "$275",
      period: "/mo",
      total: "$1650",
      supply: "6-month supply",
      billing: "Billed every 6mo ($1650).",
    },
    twelveMonth: {
      id: "twelveMonth",
      value: "233",
      name: "12 Month Supply",
      shortName: "12 Month Supply",
      price: "$240",
      period: "/mo",
      total: "$2880",
      supply: "12-month supply",
      billing: "Billed annually ($2880).",
    },
  };

  var UPSELLS = {
    medication: {
      target: "monthly",
      eyebrow: "Recommended Plan Upgrade",
      badgeIcon: true,
      badgeLabel: "Monthly Auto-Refill",
      tag: "🔥 Most Popular for New Patients",
      titleBlack: "Commit to Results &",
      titleGreen: "Save $30 Instantly",
      subtitle: "92% of visible results happen by Day 90.",
      copy: "",
      benefits: ["Unlimited Provider Visits", "Guaranteed Support", "New Supply Every Month"],
      savings: "$30",
      cta: "Upgrade My Plan",
      decline: "I'll Stick To The Higher Monthly Rate",
    },
    monthly: {
      target: "threeMonth",
      eyebrow: "Recommended Plan Upgrade",
      badgeIcon: true,
      badgeLabel: "Monthly Auto-Refill",
      tag: "🔥 Most Popular for New Patients",
      titleBlack: "Commit to Results &",
      titleGreen: "Save $471 Instantly",
      subtitle: "92% of visible results happen by Day 90.",
      copy: "",
      benefits: ["Unlimited Provider Visits", "Guaranteed Support", "New Supply Every Month"],
      savings: "$471",
      cta: "Upgrade My Plan",
      decline: "I'll Stick To The Higher Monthly Rate",
    },
  };

  var state = {
    selectedId: "medication",
    originalId: null,
    activeUpsell: null,
    initialized: false,
    observer: null,
    checkoutInitialized: false,
    checkoutObserver: null,
    checkoutTimer: null,
  };

  function byValue(value) {
    return Object.keys(PLANS).filter(function (key) {
      return PLANS[key].value === String(value);
    }).map(function (key) { return PLANS[key]; })[0] || null;
  }

  function getSavedPlan() {
    var fromUrl = getPlanFromUrl();
    if (fromUrl) return fromUrl;
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed && parsed.id && PLANS[parsed.id]) return parsed.id;
      }
      var legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        var plan = byValue(legacy);
        if (plan) return plan.id;
      }
    } catch (e) { }
    return null;
  }

  function getPlanFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var planId = params.get("plan");
      if (planId && PLANS[planId]) return planId;
      var planValue = params.get("planValue");
      if (planValue) {
        var plan = byValue(planValue);
        if (plan) return plan.id;
      }
    } catch (e) { }
    return null;
  }

  function isCheckoutPage() {
    return /test1_checkout\.html/i.test(window.location.pathname || "") ||
      /Payment details/i.test(document.body ? document.body.textContent || "" : "");
  }

  function isPlanPage() {
    return !isCheckoutPage() &&
      !!document.querySelector('label[data-slot="radio-group-item"] [role="radio"][value]');
  }

  function savePlan(planId) {
    var plan = PLANS[planId] || PLANS.medication;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
      localStorage.setItem(LEGACY_KEY, plan.value);
    } catch (e) { }
  }

  function getPlanFromLabel(label) {
    var radio = label && label.querySelector('[role="radio"][value]');
    var plan = radio ? byValue(radio.getAttribute("value")) : null;
    var text = ((label && label.textContent) || "").toLowerCase();
    if (plan) return plan;
    if (text.indexOf("medication only") !== -1) return PLANS.medication;
    if (text.indexOf("monthly auto-refill") !== -1) return PLANS.monthly;
    if (text.indexOf("3 month supply") !== -1) return PLANS.threeMonth;
    if (text.indexOf("6 month supply") !== -1) return PLANS.sixMonth;
    if (text.indexOf("12 month supply") !== -1) return PLANS.twelveMonth;
    return null;
  }

  function getSelectedPlanId() {
    var checked = document.querySelector('[role="radio"][aria-checked="true"], [role="radio"][data-state="checked"]');
    var plan = checked ? byValue(checked.getAttribute("value")) : null;
    return plan ? plan.id : state.selectedId;
  }

  function ensureDot(radio) {
    var dot = radio.querySelector("span");
    if (!dot) {
      dot = document.createElement("span");
      dot.className = "rounded-full bg-secondary-500 in-disabled:bg-neutral-600 size-2";
      radio.appendChild(dot);
    }
  }

  function setSelectedPlan(planId) {
    var plan = PLANS[planId] || PLANS.medication;
    state.selectedId = plan.id;
    savePlan(plan.id);

    document.querySelectorAll('[role="radio"][value]').forEach(function (radio) {
      var isSelected = radio.getAttribute("value") === plan.value;
      radio.setAttribute("aria-checked", isSelected ? "true" : "false");
      radio.setAttribute("data-state", isSelected ? "checked" : "unchecked");
      if (isSelected) {
        ensureDot(radio);
      } else {
        radio.innerHTML = "";
      }

      var label = radio.closest("label");
      if (!label) return;
      label.classList.toggle("border-secondary-400", isSelected);
      label.classList.toggle("bg-secondary-100", isSelected);
      label.classList.toggle("border-neutral-200", !isSelected);
    });
  }

  function injectStyles() {
    if (document.getElementById("__fridays_upsell_styles")) return;
    // Load DM Sans from Google Fonts if not already present
    if (!document.getElementById("__fridays_dmsans_font")) {
      var link = document.createElement("link");
      link.id = "__fridays_dmsans_font";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }
    var style = document.createElement("style");
    style.id = "__fridays_upsell_styles";
    style.textContent = [
      "#__fridays_upsell{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(20,24,20,.56);padding:18px;box-sizing:border-box;opacity:0;pointer-events:none;transition:opacity .2s ease}",
      "#__fridays_upsell.is-open{opacity:1;pointer-events:auto}",
      "#__fridays_upsell_modal{width:min(100%,680px);max-height:92vh;overflow:auto;border-radius:14px;background:#fff;box-shadow:0 24px 70px rgba(0,0,0,.28);font-family:'DM Sans',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;transform:translateY(16px);transition:transform .24s ease}",
      "#__fridays_upsell.is-open #__fridays_upsell_modal{transform:translateY(0)}",
      /* Header bar */
      ".__fu_head{background:#000;color:#fff;padding:14px 22px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:16px;font-weight:500;letter-spacing:.05em;text-transform:uppercase;font-family:'DM Sans',sans-serif}",
      ".__fu_head_icon{width:20px;height:20px;object-fit:contain}",
      /* Body */
      ".__fu_body{padding:28px 32px 32px}",
      /* Top Tag */
      ".__fu_top_tag{display:inline-block;background:#ececec;color:#333;padding:6px 12px;border-radius:8px;font-size:13px;font-weight:600;margin-bottom:12px}",
      /* Badge pill with icon */
      ".__fu_badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;background:#e0fba2;color:#393939;padding:5px 12px;font-size:14px;font-weight:500;margin-bottom:10px;}",
      ".__fu_badge_icon{width:12px;height:12px;flex-shrink:0}",
      /* Title */
      ".__fu_title{margin:0 0 6px;color:#111;font-size:28px;line-height:1.15;font-weight:400;letter-spacing:-.01em}",
      ".__fu_title_green{color:#227440;font-weight:900}",
      /* Subtitle */
      ".__fu_subtitle{margin:0 0 20px;color:#4C5647;font-size:14px;font-weight:700;line-height:1.4}",
      /* Body copy */
      ".__fu_copy{display:none}",
      /* Plan card */
      ".__fu_card_container{border-radius:16px;padding:24px 24px 16px;margin-bottom:24px;background:#f9f9f7}",
      ".__fu_card{display:flex;gap:24px;align-items:center;border-bottom:1px solid #dadada;padding-bottom:24px;margin-bottom:24px}",
      ".__fu_img{width:120px;height:120px;object-fit:contain;flex:0 0 auto}",
      ".__fu_info{min-width:0;flex:1}",
      ".__fu_plan{margin:0 0 2px;color:#111;font-size:16px;font-weight:600}",
      ".__fu_meta{margin:0 0 12px;color:#393939;font-size:12px;line-height:1.5}",
      /* Benefits checklist */
      ".__fu_benefits{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px}",
      ".__fu_benefit{color:#393939;font-size:12px;font-weight:400;display:flex;align-items:flex-start;gap:6px;line-height:1}",
      ".__fu_benefit::before{content:'';display:inline-block;width:12px;height:12px;background-image:url('images/tick.png');background-size:contain;background-repeat:no-repeat;background-position:center;flex-shrink:0}",
      /* Price column */
      ".__fu_price{display:flex;flex-direction:column;align-items:flex-start;flex:0 0 auto}",
      ".__fu_price_main{display:flex;align-items:baseline;gap:2px}",
      ".__fu_price_amt{color:rgba(0,0,0,0.9);font-size:28px;line-height:23.7px;font-weight:600}",
      ".__fu_price_period{font-size:16px;color:#555;font-weight:500}",
      ".__fu_price_orig{color:#999;font-size:15px;margin-top:2px;margin-bottom:4px;position:relative}",
      ".__fu_price_orig::after{content:'';position:absolute;top:50%;left:-2px;right:-2px;height:1px;background-color:red;transform:rotate(-15deg)}",
      ".__fu_save{display:inline-flex;justify-content:center;border-radius:30px;background:#bc8230;color:#fff;padding:8px 16px;font-size:14px;font-weight:700;line-height:1;letter-spacing:0.02em;text-transform:uppercase;margin-top:8px;white-space:nowrap}",
      /* CTA */
      ".__fu_cta{width:100%;border:0;border-radius:9px;background:linear-gradient(180deg, #65855A 0%, #3A4834 100%);color:#fff;padding:16px 24px;font-family:'DM Sans',sans-serif;font-size:20px;font-weight:600;line-height:1;text-transform:uppercase;cursor:pointer;transition:background .18s}",
      ".__fu_cta:hover{background:linear-gradient(180deg, #5b7850 0%, #323e2d 100%)}",
      /* Note */
      ".__fu_note{margin:16px 0 0;text-align:center;color:#656565;font-size:12px;line-height:1;letter-spacing:0.02em}",
      /* Decline */
      ".__fu_decline{display:block;width:100%;border:0;background:transparent;color:#656565;text-decoration:underline;font-family:'DM Sans',sans-serif;font-size:16px;font-weight:500;line-height:1;cursor:pointer;padding:8px;text-align:center}",
      ".__fu_decline:hover{color:#333}",
      /* Mobile */
      "@media(max-width:640px){" +
      "#__fridays_upsell{align-items:flex-end;padding:0} " +
      "#__fridays_upsell_modal{border-radius:18px 18px 0 0;max-height:94vh;width:100%} " +
      ".__fu_body{padding:24px 20px 32px} " +
      ".__fu_title{font-size:24px} " +
      ".__fu_card_container{border:1px solid #7cb359;border-radius:12px;padding:24px 16px 16px;position:relative;margin-top:24px;background:#fff;margin-bottom:24px} " +
      ".__fu_badge{position:absolute;top:-14px;left:50%;transform:translateX(-50%);margin:0;z-index:2} " +
      ".__fu_card{background:transparent;padding:0;padding-bottom:0;border-bottom:none;margin-bottom:16px;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto auto;gap:16px;align-items:center} " +
      ".__fu_img{width:90px;height:90px;grid-column:1;grid-row:1} " +
      ".__fu_info{grid-column:2;grid-row:1;padding-left:4px} " +
      ".__fu_plan{font-size:18px} .__fu_meta{font-size:13px} .__fu_benefit{font-size:13px;gap:6px} " +
      ".__fu_card::after{content:'';grid-column:1/-1;grid-row:2;height:1px;background:#e5e5e5} " +
      ".__fu_price{grid-column:1/-1;grid-row:3;flex-direction:row;align-items:center;width:100%;justify-content:flex-end} " +
      ".__fu_save{margin:0 auto 0 0;order:-2} " +
      ".__fu_price_orig{margin:0 8px 0 0;order:-1} " +
      ".__fu_price_main{justify-content:flex-end;order:0} " +
      ".__fu_cta{margin-top:0}" +
      "}",
    ].join("");
    document.head.appendChild(style);
  }

  function buildModal(originalId) {
    var upsell = UPSELLS[originalId];
    var target = PLANS[upsell.target];

    // Build the benefits list HTML
    var benefitsHtml = '';
    if (upsell.benefits && upsell.benefits.length) {
      benefitsHtml = '<ul class="__fu_benefits">';
      for (var i = 0; i < upsell.benefits.length; i++) {
        benefitsHtml += '<li class="__fu_benefit">' + upsell.benefits[i] + '</li>';
      }
      benefitsHtml += '</ul>';
    }

    // Badge: refresh icon SVG + label
    var refreshIcon = upsell.badgeIcon
      ? '<img class="__fu_badge_icon" src="images/refresh.svg" alt="">'
      : '';
    var badgeHtml = '<div class="__fu_badge">' + refreshIcon + '&nbsp;' + upsell.badgeLabel + '</div>';

    // Original price strikethrough (if target has one)
    var origPriceHtml = target.originalPrice
      ? '<span class="__fu_price_orig">' + target.originalPrice + '</span>'
      : '';

    var overlay = document.createElement('div');
    overlay.id = '__fridays_upsell';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', upsell.eyebrow);
    overlay.innerHTML =
      '<div id="__fridays_upsell_modal">' +
      '<div class="__fu_head"><img class="__fu_head_icon" src="images/badge-check-svgrepo-com (1) 1.png" alt="">' + upsell.eyebrow + '</div>' +
      '<div class="__fu_body">' +
      '<div class="__fu_top_tag">' + upsell.tag + '</div>' +
      '<h2 class="__fu_title">' +
      upsell.titleBlack + ' <span class="__fu_title_green">' + upsell.titleGreen + '</span>' +
      '</h2>' +
      '<p class="__fu_subtitle">' + upsell.subtitle + '</p>' +
      '<div class="__fu_card_container">' +
      '<div class="__fu_card">' +
      '<img class="__fu_img" src="images/product_img.png" alt="" loading="eager">' +
      '<div class="__fu_info">' +
      badgeHtml +
      '<p class="__fu_plan">' + target.name + '</p>' +
      '<p class="__fu_meta">Tirzepatide GLP-1/GIP</p>' +
      benefitsHtml +
      '</div>' +
      '<div class="__fu_price">' +
      '<div class="__fu_price_main">' +
      '<span class="__fu_price_amt">' + target.price + '</span>' +
      '<span class="__fu_price_period">' + target.period + '</span>' +
      '</div>' +
      origPriceHtml +
      '<div class="__fu_save">SAVE ' + upsell.savings + '</div>' +
      '</div>' +
      '</div>' +
      '<button type="button" class="__fu_cta" id="__fridays_upsell_accept">' + upsell.cta + '</button>' +
      '<p class="__fu_note">Billed every 28 days (' + target.price + '). Cancel anytime.</p>' +
      '</div>' +
      '<button type="button" class="__fu_decline" id="__fridays_upsell_decline">' + upsell.decline + '</button>' +
      '</div>' +
      '</div>';
    return overlay;
  }

  function closeModal(callback) {
    var overlay = document.getElementById("__fridays_upsell");
    document.removeEventListener("keydown", onEsc);
    if (!overlay) {
      if (callback) callback();
      return;
    }
    overlay.classList.remove("is-open");
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (callback) callback();
    }, 220);
  }

  function continueToCheckout(planId) {
    var plan = PLANS[planId] || PLANS.medication;
    setSelectedPlan(plan.id);
    window.location.href = CHECKOUT_URL + "?plan=" + encodeURIComponent(plan.id);
  }

  function choosePlanFromModal(planId) {
    closeModal(function () {
      setSelectedPlan(planId);
      state.originalId = null;
      state.activeUpsell = null;
    });
  }

  function showModal(originalId) {
    state.originalId = originalId;
    state.activeUpsell = UPSELLS[originalId];
    closeModal();
    injectStyles();
    var overlay = buildModal(originalId);
    document.body.appendChild(overlay);
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
    });
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        choosePlanFromModal(originalId);
      }
    });
    document.getElementById("__fridays_upsell_accept").addEventListener("click", function () {
      choosePlanFromModal(state.activeUpsell.target);
    });
    document.getElementById("__fridays_upsell_decline").addEventListener("click", function () {
      choosePlanFromModal(state.originalId);
    });
    document.addEventListener("keydown", onEsc);
  }

  function onEsc(event) {
    if (event.key === "Escape") {
      choosePlanFromModal(state.originalId || state.selectedId);
    }
  }

  function onPlanClick(event) {
    var label = event.target.closest && event.target.closest('label[data-slot="radio-group-item"]');
    if (!label) return;
    var plan = getPlanFromLabel(label);
    if (!plan) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (UPSELLS[plan.id]) {
      showModal(plan.id);
      return;
    }
    setSelectedPlan(plan.id);
  }

  function onContinueClick(event) {
    var button = event.target.closest && event.target.closest("button");
    if (!button) return;
    var text = (button.textContent || "").trim().toLowerCase();
    if (text !== "continue") return;

    event.preventDefault();
    event.stopImmediatePropagation();
    continueToCheckout(getSelectedPlanId());
  }

  function initPlanPage() {
    if (state.initialized) return;
    if (!isPlanPage()) return;
    injectStyles();
    state.selectedId = getSavedPlan() || getSelectedPlanId() || "medication";
    setSelectedPlan(state.selectedId);
    document.addEventListener("click", onPlanClick, true);
    document.addEventListener("click", onContinueClick, true);
    state.observer = new MutationObserver(function () {
      var saved = getSavedPlan();
      if (saved && saved !== state.selectedId) setSelectedPlan(saved);
    });
    state.observer.observe(document.body, { childList: true, subtree: true });
    state.initialized = true;
  }



  function replacePlanAmounts(root, plan) {
    var knownAmounts = ["$389", "$359", "$896", "$1650", "$1,650", "$2880", "$2,880"];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var text = node.nodeValue.trim();
      if (knownAmounts.indexOf(text) !== -1) {
        node.nodeValue = node.nodeValue.replace(text, plan.total);
      }
    }
  }

  function replaceSupplyText(root, plan) {
    var knownSupply = ["1-month supply", "3-month supply", "6-month supply", "12-month supply"];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var text = node.nodeValue.trim();
      if (knownSupply.indexOf(text) !== -1) {
        node.nodeValue = node.nodeValue.replace(text, plan.supply);
      }
    }
  }

  function renderCheckoutPlan() {
    var savedId = getSavedPlan() || "medication";
    var plan = PLANS[savedId] || PLANS.medication;
    savePlan(plan.id);

    replacePlanAmounts(document.body, plan);
    replaceSupplyText(document.body, plan);

    var summaries = Array.prototype.slice.call(document.querySelectorAll("p, h3, span, div")).filter(function (el) {
      return (el.textContent || "").trim() === "Compounded Tirzepatide (GLP-1/GIP)";
    });
    summaries.forEach(function (el) {
      var wrap = el.closest(".flex") || el.parentElement;
      if (!wrap) return;
      var meta = wrap.querySelector("[data-fridays-selected-plan]");
      if (!meta) {
        meta = document.createElement("p");
        meta.setAttribute("data-fridays-selected-plan", "true");
        meta.className = "inline-flex items-baseline gap-1.5 text-xs text-neutral-800 font-semibold";
        el.parentElement.appendChild(meta);
      }
      meta.textContent = plan.shortName;
    });
  }

  function onCheckoutBackClick(event) {
    var button = event.target.closest && event.target.closest("button");
    if (!button) return;
    var text = (button.textContent || "").trim().toLowerCase();
    if (text !== "back") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.href = PLAN_URL;
  }

  function scheduleCheckoutRender() {
    clearTimeout(state.checkoutTimer);
    state.checkoutTimer = setTimeout(renderCheckoutPlan, 40);
  }

  function initCheckoutPage() {
    if (isCheckoutPage() && document.body && /Order summary/i.test(document.body.textContent || "")) {
      if (state.checkoutInitialized) {
        renderCheckoutPlan();
        return;
      }
      renderCheckoutPlan();
      setTimeout(renderCheckoutPlan, 250);
      setTimeout(renderCheckoutPlan, 900);
      document.addEventListener("click", onCheckoutBackClick, true);
      state.checkoutObserver = new MutationObserver(scheduleCheckoutRender);
      state.checkoutObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
      state.checkoutInitialized = true;
    }
  }

  function init() {
    initCheckoutPage();
    initPlanPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.__fridaysUpsell = {
    plans: PLANS,
    savePlan: savePlan,
    selectPlan: setSelectedPlan,
    renderCheckoutPlan: renderCheckoutPlan,
    show: showModal,
  };
})();

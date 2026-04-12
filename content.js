// Unit Confusion Fixer — Content Script
(function () {
  'use strict';

  let enabled = true;
  let processed = false;

  // ── Unit definitions ──
  // Each unit: { regex match, SI value multiplier, SI unit label, alt conversion, explanation fn }
  const UNITS = [
    // Length
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*km\b/gi,
      toSI: (v) => v * 1000,
      siUnit: 'm',
      alt: (v) => `${v} km`,
      altUnit: 'km',
      explain: (v, si) => `${v} km = ${fmt(si)} metres`,
      category: 'length'
    },
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*cm\b/gi,
      toSI: (v) => v / 100,
      siUnit: 'm',
      alt: (v) => `${v} cm`,
      altUnit: 'cm',
      explain: (v, si) => `${v} cm = ${fmt(si)} metres`,
      category: 'length'
    },
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*mm\b/gi,
      toSI: (v) => v / 1000,
      siUnit: 'm',
      alt: (v) => `${v} mm`,
      altUnit: 'mm',
      explain: (v, si) => `${v} mm = ${fmt(si)} metres`,
      category: 'length'
    },
    {
      // m (but not m/s, m/s², ms, min, mol, mag etc.)
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*m(?![a-zA-Z/²³])/gi,
      toSI: (v) => v,
      siUnit: 'm',
      alt: (v) => v >= 1000 ? `${fmt(v / 1000)} km` : `${fmt(v * 100)} cm`,
      altUnit: '',
      explain: (v) => v >= 1000 ? `${fmt(v)} m = ${fmt(v / 1000)} km` : `${fmt(v)} m (SI base unit of length)`,
      category: 'length'
    },
    // Speed
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*km\s*\/\s*h\b/gi,
      toSI: (v) => v / 3.6,
      siUnit: 'm/s',
      alt: (v) => `${v} km/h`,
      altUnit: 'km/h',
      explain: (v, si) => `${v} km/h = ${fmt(si)} m/s (divide by 3.6)`,
      category: 'speed'
    },
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*m\s*\/\s*s\b/gi,
      toSI: (v) => v,
      siUnit: 'm/s',
      alt: (v) => `${fmt(v * 3.6)} km/h`,
      altUnit: 'km/h',
      explain: (v) => `${fmt(v)} m/s = ${fmt(v * 3.6)} km/h`,
      category: 'speed'
    },
    // Mass
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*kg\b/gi,
      toSI: (v) => v,
      siUnit: 'kg',
      alt: (v) => `${fmt(v * 1000)} g`,
      altUnit: 'g',
      explain: (v) => `${fmt(v)} kg (SI base unit of mass)`,
      category: 'mass'
    },
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*g\b(?!r|a|o|Hz)/gi,
      toSI: (v) => v / 1000,
      siUnit: 'kg',
      alt: (v) => `${v} g`,
      altUnit: 'g',
      explain: (v, si) => `${v} g = ${fmt(si)} kg`,
      category: 'mass'
    },
    // Force
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*N\b/g,
      toSI: (v) => v,
      siUnit: 'N',
      alt: (v) => `${fmt(v)} kg·m/s²`,
      altUnit: 'kg·m/s²',
      explain: (v) => `${fmt(v)} N = ${fmt(v)} kg·m/s² (SI derived unit of force)`,
      category: 'force'
    },
    // Energy
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*J\b/g,
      toSI: (v) => v,
      siUnit: 'J',
      alt: (v) => `${fmt(v)} kg·m²/s²`,
      altUnit: 'kg·m²/s²',
      explain: (v) => `${fmt(v)} J = ${fmt(v)} kg·m²/s² (SI derived unit of energy)`,
      category: 'energy'
    },
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*kJ\b/gi,
      toSI: (v) => v * 1000,
      siUnit: 'J',
      alt: (v) => `${v} kJ`,
      altUnit: 'kJ',
      explain: (v, si) => `${v} kJ = ${fmt(si)} J`,
      category: 'energy'
    },
    // Electricity
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*V\b/g,
      toSI: (v) => v,
      siUnit: 'V',
      alt: (v) => `${fmt(v)} kg·m²/(A·s³)`,
      altUnit: '',
      explain: (v) => `${fmt(v)} V (volt — SI unit of electric potential)`,
      category: 'electricity'
    },
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*A\b/g,
      toSI: (v) => v,
      siUnit: 'A',
      alt: (v) => `${fmt(v)} A`,
      altUnit: '',
      explain: (v) => `${fmt(v)} A (ampere — SI base unit of current)`,
      category: 'electricity'
    },
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*(?:Ω|ohm|ohms)\b/gi,
      toSI: (v) => v,
      siUnit: 'Ω',
      alt: (v) => `${fmt(v)} V/A`,
      altUnit: 'V/A',
      explain: (v) => `${fmt(v)} Ω (ohm — SI unit of resistance, V/A)`,
      category: 'electricity'
    },
    // Frequency
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*(?:kHz)\b/gi,
      toSI: (v) => v * 1000,
      siUnit: 'Hz',
      alt: (v) => `${v} kHz`,
      altUnit: 'kHz',
      explain: (v, si) => `${v} kHz = ${fmt(si)} Hz`,
      category: 'frequency'
    },
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*(?:MHz)\b/gi,
      toSI: (v) => v * 1e6,
      siUnit: 'Hz',
      alt: (v) => `${v} MHz`,
      altUnit: 'MHz',
      explain: (v, si) => `${v} MHz = ${fmt(si)} Hz`,
      category: 'frequency'
    },
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*Hz\b/gi,
      toSI: (v) => v,
      siUnit: 'Hz',
      alt: (v) => `${fmt(v)} cycles/s`,
      altUnit: 'cycles/s',
      explain: (v) => `${fmt(v)} Hz (hertz — SI unit of frequency)`,
      category: 'frequency'
    },
    // Power
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*W\b/g,
      toSI: (v) => v,
      siUnit: 'W',
      alt: (v) => `${fmt(v)} J/s`,
      altUnit: 'J/s',
      explain: (v) => `${fmt(v)} W = ${fmt(v)} J/s (SI unit of power)`,
      category: 'power'
    },
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*kW\b/gi,
      toSI: (v) => v * 1000,
      siUnit: 'W',
      alt: (v) => `${v} kW`,
      altUnit: 'kW',
      explain: (v, si) => `${v} kW = ${fmt(si)} W`,
      category: 'power'
    },
    // Pressure
    {
      pattern: /(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*Pa\b/g,
      toSI: (v) => v,
      siUnit: 'Pa',
      alt: (v) => `${fmt(v)} N/m²`,
      altUnit: 'N/m²',
      explain: (v) => `${fmt(v)} Pa = ${fmt(v)} N/m² (SI unit of pressure)`,
      category: 'pressure'
    },
  ];

  function fmt(n) {
    if (Math.abs(n) >= 1e6 || (Math.abs(n) < 0.01 && n !== 0)) {
      return n.toExponential(2);
    }
    return parseFloat(n.toPrecision(6)).toString();
  }

  function parseValue(raw) {
    // Handle scientific notation like "3 × 10^6" or "3 x 10^6"
    const sciMatch = raw.match(/^([\d.]+)\s*[×x]\s*10\s*\^\s*([+-]?\d+)$/);
    if (sciMatch) {
      return parseFloat(sciMatch[1]) * Math.pow(10, parseInt(sciMatch[2]));
    }
    return parseFloat(raw);
  }

  function processTextNode(node) {
    const text = node.textContent;
    if (!text || text.trim().length < 2) return;

    // Check if already processed
    if (node.parentElement && node.parentElement.classList && node.parentElement.classList.contains('ucf-unit')) return;

    let hasMatch = false;

    // Check compound units first (km/h, m/s) before simple ones
    // Sort by pattern specificity — compound first
    const sortedUnits = [...UNITS];

    for (const unit of sortedUnits) {
      unit.pattern.lastIndex = 0;
      if (unit.pattern.test(text)) {
        hasMatch = true;
        break;
      }
    }

    if (!hasMatch) return;

    // Build replacement HTML
    let html = text;
    // Process compound units first to avoid partial matches
    const compoundFirst = sortedUnits.sort((a, b) => {
      const aLen = a.siUnit.length;
      const bLen = b.siUnit.length;
      return bLen - aLen; // longer SI units first
    });

    for (const unit of compoundFirst) {
      unit.pattern.lastIndex = 0;
      html = html.replace(unit.pattern, (match, numStr) => {
        const val = parseValue(numStr.trim());
        if (isNaN(val)) return match;
        const siVal = unit.toSI(val);
        const explanation = unit.explain(val, siVal);
        const altText = typeof unit.alt === 'function' ? unit.alt(val) : '';

        const isSameUnit = unit.toSI(1) === 1;
        const convLine = isSameUnit
          ? `<div class="ucf-tooltip-value">${fmt(siVal)} ${unit.siUnit}</div>`
          : `<div class="ucf-tooltip-value">${fmt(siVal)} ${unit.siUnit}</div>`;

        const altLine = altText && !isSameUnit
          ? `<div class="ucf-tooltip-alt">≈ ${altText}</div>`
          : isSameUnit && altText
          ? `<div class="ucf-tooltip-alt">= ${altText}</div>`
          : '';

        return `<span class="ucf-unit">${match}<span class="ucf-tooltip"><div class="ucf-tooltip-label">SI Conversion</div>${convLine}${altLine}<div class="ucf-tooltip-note">${explanation}</div></span></span>`;
      });
    }

    if (html !== text) {
      const wrapper = document.createElement('span');
      wrapper.innerHTML = html;
      node.replaceWith(wrapper);
    }
  }

  function walkTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'INPUT'].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (parent.closest('.ucf-unit') || parent.closest('.ucf-tooltip')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(processTextNode);
  }

  function run() {
    if (!enabled || processed) return;
    processed = true;
    walkTextNodes(document.body);
  }

  function cleanup() {
    document.querySelectorAll('.ucf-unit').forEach((el) => {
      const tooltip = el.querySelector('.ucf-tooltip');
      if (tooltip) tooltip.remove();
      const parent = el.parentNode;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    });
    processed = false;
  }

  // Listen for toggle messages
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'toggle') {
      enabled = msg.enabled;
      if (enabled) {
        run();
      } else {
        cleanup();
      }
    }
  });

  // Check initial state and run
  chrome.storage.local.get('enabled', (data) => {
    enabled = data.enabled !== false;
    if (enabled) run();
  });
})();

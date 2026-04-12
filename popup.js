const toggleBtn = document.getElementById('toggleBtn');
const statusLabel = document.getElementById('statusLabel');
const convertInput = document.getElementById('convertInput');
const convertBtn = document.getElementById('convertBtn');
const convertResult = document.getElementById('convertResult');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// ── Toggle ──
function updateUI(enabled) {
  toggleBtn.textContent = enabled ? 'ON' : 'OFF';
  toggleBtn.classList.toggle('off', !enabled);
  statusLabel.textContent = enabled ? 'ENABLED' : 'DISABLED';
}

chrome.runtime.sendMessage({ type: 'getState' }, (response) => {
  if (response) updateUI(response.enabled);
});

toggleBtn.addEventListener('click', () => {
  const isOn = toggleBtn.textContent === 'ON';
  const newState = !isOn;
  chrome.runtime.sendMessage({ type: 'setState', enabled: newState });
  updateUI(newState);
});

// ── Unit definitions (mirrors content.js) ──
function fmt(n) {
  if (Math.abs(n) >= 1e6 || (Math.abs(n) < 0.01 && n !== 0)) {
    return n.toExponential(2);
  }
  return parseFloat(n.toPrecision(6)).toString();
}

const UNITS = [
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*km\s*\/\s*h$/i, toSI: v => v / 3.6, siUnit: 'm/s', explain: (v, si) => `${v} km/h = ${fmt(si)} m/s` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*m\s*\/\s*s$/i, toSI: v => v, siUnit: 'm/s', explain: (v, si) => `${fmt(v)} m/s = ${fmt(v * 3.6)} km/h` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*km$/i, toSI: v => v * 1000, siUnit: 'm', explain: (v, si) => `${v} km = ${fmt(si)} m` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*cm$/i, toSI: v => v / 100, siUnit: 'm', explain: (v, si) => `${v} cm = ${fmt(si)} m` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*mm$/i, toSI: v => v / 1000, siUnit: 'm', explain: (v, si) => `${v} mm = ${fmt(si)} m` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*m$/i, toSI: v => v, siUnit: 'm', explain: (v) => v >= 1000 ? `${fmt(v)} m = ${fmt(v / 1000)} km` : `${fmt(v)} m (SI base unit)` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*kg$/i, toSI: v => v, siUnit: 'kg', explain: (v) => `${fmt(v)} kg (SI base unit of mass)` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*g$/i, toSI: v => v / 1000, siUnit: 'kg', explain: (v, si) => `${v} g = ${fmt(si)} kg` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*N$/i, toSI: v => v, siUnit: 'N', explain: (v) => `${fmt(v)} N = ${fmt(v)} kg·m/s²` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*kJ$/i, toSI: v => v * 1000, siUnit: 'J', explain: (v, si) => `${v} kJ = ${fmt(si)} J` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*J$/i, toSI: v => v, siUnit: 'J', explain: (v) => `${fmt(v)} J = ${fmt(v)} kg·m²/s²` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*V$/i, toSI: v => v, siUnit: 'V', explain: (v) => `${fmt(v)} V (volt)` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*A$/i, toSI: v => v, siUnit: 'A', explain: (v) => `${fmt(v)} A (ampere)` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*(?:Ω|ohm|ohms)$/i, toSI: v => v, siUnit: 'Ω', explain: (v) => `${fmt(v)} Ω = ${fmt(v)} V/A` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*kHz$/i, toSI: v => v * 1000, siUnit: 'Hz', explain: (v, si) => `${v} kHz = ${fmt(si)} Hz` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*MHz$/i, toSI: v => v * 1e6, siUnit: 'Hz', explain: (v, si) => `${v} MHz = ${fmt(si)} Hz` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*Hz$/i, toSI: v => v, siUnit: 'Hz', explain: (v) => `${fmt(v)} Hz (hertz)` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*kW$/i, toSI: v => v * 1000, siUnit: 'W', explain: (v, si) => `${v} kW = ${fmt(si)} W` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*W$/i, toSI: v => v, siUnit: 'W', explain: (v) => `${fmt(v)} W = ${fmt(v)} J/s` },
  { pattern: /^(\d+(?:\.\d+)?(?:\s*[×x]\s*10\s*\^\s*[+-]?\d+)?)\s*Pa$/i, toSI: v => v, siUnit: 'Pa', explain: (v) => `${fmt(v)} Pa = ${fmt(v)} N/m²` },
];

function parseValue(raw) {
  const sciMatch = raw.match(/^([\d.]+)\s*[×x]\s*10\s*\^\s*([+-]?\d+)$/);
  if (sciMatch) return parseFloat(sciMatch[1]) * Math.pow(10, parseInt(sciMatch[2]));
  return parseFloat(raw);
}

function convert(input) {
  const text = input.trim();
  for (const unit of UNITS) {
    unit.pattern.lastIndex = 0;
    const match = text.match(unit.pattern);
    if (match) {
      const val = parseValue(match[1].trim());
      if (isNaN(val)) continue;
      const siVal = unit.toSI(val);
      return {
        input: text,
        siValue: fmt(siVal),
        siUnit: unit.siUnit,
        explanation: unit.explain(val, siVal)
      };
    }
  }
  return null;
}

// ── Manual Convert ──
function doConvert() {
  const text = convertInput.value.trim();
  if (!text) return;
  const result = convert(text);
  if (result) {
    convertResult.classList.remove('hidden');
    convertResult.innerHTML = `<div class="result-value">${result.siValue} ${result.siUnit}</div><div class="result-explain">${result.explanation}</div>`;
    addToHistory(result);
  } else {
    convertResult.classList.remove('hidden');
    convertResult.innerHTML = `<div class="result-error">Unknown unit. Try e.g. "72 km/h"</div>`;
  }
}

convertBtn.addEventListener('click', doConvert);
convertInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doConvert();
});

// ── History ──
let history = [];

function loadHistory() {
  chrome.storage.session.get('conversionHistory', (data) => {
    history = data.conversionHistory || [];
    renderHistory();
  });
}

function saveHistory() {
  chrome.storage.session.set({ conversionHistory: history });
}

function addToHistory(result) {
  // Avoid duplicates at the top
  if (history.length > 0 && history[0].input === result.input) return;
  history.unshift({ input: result.input, output: `${result.siValue} ${result.siUnit}`, explanation: result.explanation });
  if (history.length > 20) history.pop();
  saveHistory();
  renderHistory();
}

function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = '<span class="history-empty">No conversions yet.</span>';
    clearHistoryBtn.classList.add('hidden');
    return;
  }
  clearHistoryBtn.classList.remove('hidden');
  historyList.innerHTML = history.map(h =>
    `<div class="history-item" title="${h.explanation}"><span class="history-input">${h.input}</span> → <span class="history-output">${h.output}</span></div>`
  ).join('');
}

clearHistoryBtn.addEventListener('click', () => {
  history = [];
  saveHistory();
  renderHistory();
});

loadHistory();

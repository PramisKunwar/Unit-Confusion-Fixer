const toggleBtn = document.getElementById('toggleBtn');
const statusLabel = document.getElementById('statusLabel');

function updateUI(enabled) {
  toggleBtn.textContent = enabled ? 'ON' : 'OFF';
  toggleBtn.classList.toggle('off', !enabled);
  statusLabel.textContent = enabled ? 'ENABLED' : 'DISABLED';
}

// Load initial state
chrome.runtime.sendMessage({ type: 'getState' }, (response) => {
  if (response) updateUI(response.enabled);
});

toggleBtn.addEventListener('click', () => {
  const isOn = toggleBtn.textContent === 'ON';
  const newState = !isOn;
  chrome.runtime.sendMessage({ type: 'setState', enabled: newState });
  updateUI(newState);
});

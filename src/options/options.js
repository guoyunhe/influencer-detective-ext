const form = document.getElementById('form');
const apiBaseInput = document.getElementById('apiBase');
const resetBtn = document.getElementById('reset');
const statusEl = document.getElementById('status');

async function load() {
  const base = await InfluencerAPI.getApiBase();
  apiBaseInput.value = base;
}

function flash(msg) {
  statusEl.textContent = msg;
  window.setTimeout(() => {
    statusEl.textContent = '';
  }, 3000);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const value = apiBaseInput.value.trim();
  if (!value) {
    flash('Please enter a URL.');
    return;
  }
  try {
    new URL(value);
  } catch {
    flash('Please enter a valid URL.');
    return;
  }
  await InfluencerAPI.setApiBase(value);
  apiBaseInput.value = await InfluencerAPI.getApiBase();
  flash('Saved.');
});

resetBtn.addEventListener('click', async () => {
  await InfluencerAPI.setApiBase(InfluencerAPI.DEFAULT_API_BASE);
  apiBaseInput.value = await InfluencerAPI.getApiBase();
  flash('Reset to default.');
});

load();

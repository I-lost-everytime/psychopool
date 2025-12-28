let currentRound = null;

// ===============================
// 🔄 FETCH CURRENT ROUND STATUS
// ===============================
async function fetchStatus() {
  try {
    const res = await fetch('/game/current-round');
    const data = await res.json();

    if (data.status === 'ACTIVE') {
      currentRound = data.round.id;
      document.getElementById('status').innerText =
        `Status: ROUND ${data.round.round_number} ACTIVE`;
    } else {
      document.getElementById('status').innerText =
        'Status: Waiting for round';
    }
  } catch (err) {
    console.error('Failed to fetch status:', err);
  }
}

// ===============================
// 🔁 SCORING TYPE TOGGLE
// ===============================
document.getElementById('scoringType')?.addEventListener('change', (e) => {
  const box = document.getElementById('priorityBox');
  if (!box) return;

  box.style.display = e.target.value === 'PRIORITY'
    ? 'block'
    : 'none';
});

// ===============================
// ▶️ START ROUND
// ===============================
async function startRound() {
  const payload = {
    roundNumber: parseInt(document.getElementById('roundNumber').value),
    questionId: parseInt(document.getElementById('questionId').value),
    points: parseInt(document.getElementById('points').value) || 10,
    scoring_type: document.getElementById('scoringType').value,
    priority_rules: document.getElementById('scoringType').value === 'PRIORITY'
      ? {
          1: parseInt(document.getElementById('p1').value),
          2: parseInt(document.getElementById('p2').value)
        }
      : null
  };

  try {
    const res = await fetch('/admin/start-round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    document.getElementById('msg').innerText =
      data.message || data.error;

    // Disable results button for new round
    const btn = document.getElementById('viewResultsBtn');
    if (btn) btn.disabled = true;

    fetchStatus();
  } catch (err) {
    console.error('Failed to start round:', err);
  }
}

// ===============================
// ⏹ END ROUND
// ===============================
async function endRound() {
  try {
    const res = await fetch('/admin/end-round', {
      method: 'POST'
    });

    const data = await res.json();

    document.getElementById('msg').innerText =
      data.message || data.error;

    if (data.success) {
      // ✅ Enable "View Results" button
      const btn = document.getElementById('viewResultsBtn');
      if (btn) btn.disabled = false;
    }

    fetchStatus();
  } catch (err) {
    console.error('Failed to end round:', err);
  }
}

// ===============================
// 🔁 POLLING
// ===============================
setInterval(fetchStatus, 2000);
fetchStatus();

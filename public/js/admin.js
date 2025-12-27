let currentRound = null;

async function fetchStatus() {
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
}

async function startRound() {
  const roundNumber = document.getElementById('roundNumber').value;
  const questionId = document.getElementById('questionId').value;

  const res = await fetch('/admin/start-round', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roundNumber, questionId })
  });

  const data = await res.json();
  document.getElementById('msg').innerText =
    data.message || data.error;

  fetchStatus();
}

async function endRound() {
  const res = await fetch('/admin/end-round', {
    method: 'POST'
  });

  const data = await res.json();
  document.getElementById('msg').innerText =
    data.message || data.error;

  fetchStatus();
}

// poll status every 2 seconds
setInterval(fetchStatus, 2000);
fetchStatus();

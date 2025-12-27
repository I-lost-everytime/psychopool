const userId = localStorage.getItem('userId');
let currentRoundId = null;
let hasVoted = false;

async function fetchRound() {
  const res = await fetch('/game/current-round');
  const data = await res.json();

  // 🟡 RESULT PHASE
  if (data.status === 'RESULT') {
    document.getElementById('status').innerText = 'Round Ended';
    document.getElementById('game').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('msg').innerText = '';

    document.getElementById('resultText').innerText =
      'Results announced! Check leaderboard.';

    return;
  }

  // 🟢 ACTIVE PHASE
  if (data.status === 'ACTIVE') {
    const r = data.round;

    // 🔁 New round → reset vote state
    if (currentRoundId !== r.id) {
      hasVoted = false;
      document.getElementById('msg').innerText = '';
    }

    currentRoundId = r.id;

    document.getElementById('status').innerText = 'Round Active!';
    document.getElementById('result').style.display = 'none';
    document.getElementById('game').style.display = 'block';

    document.getElementById('question').innerText = r.question_text;
    document.getElementById('A').innerText = r.option_a;
    document.getElementById('B').innerText = r.option_b;
    document.getElementById('C').innerText = r.option_c;
    document.getElementById('D').innerText = r.option_d;

    return;
  }

  // ⚪ WAITING PHASE
  document.getElementById('status').innerText = 'Waiting for round...';
  document.getElementById('game').style.display = 'none';
  document.getElementById('result').style.display = 'none';
}

async function vote(option) {
  if (hasVoted) return;

  const res = await fetch('/game/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      roundId: currentRoundId,
      selectedOption: option
    })
  });

  const data = await res.json();

  if (data.success) {
    hasVoted = true;
    document.getElementById('msg').innerText = 'Vote submitted!';
  } else {
    document.getElementById('msg').innerText = data.error;
  }
}

// poll every 2 seconds
setInterval(fetchRound, 2000);
fetchRound();

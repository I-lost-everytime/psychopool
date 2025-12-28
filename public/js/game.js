const userId = localStorage.getItem('userId');
let currentRoundId = null;
let hasVoted = false;

// ===============================
// 🎮 UI HELPERS
// ===============================
function showOptions(show) {
  const box = document.getElementById('optionsBox');
  if (!box) return;
  box.style.display = show ? 'block' : 'none';
}

function setStatus(text) {
  document.getElementById('status').innerText = text;
}

function setQuestion(text) {
  document.getElementById('question').innerText = text;
}

function setMessage(text = '') {
  document.getElementById('msg').innerText = text;
}

// ===============================
// 🔄 FETCH ROUND STATE
// ===============================
async function fetchRound() {
  try {
    const res = await fetch('/game/current-round');
    const data = await res.json();

    // 🔴 RESULT → GLOBAL WAIT
    if (data.status === 'RESULT') {
      showOptions(false);
      setStatus('Round ended');
      setQuestion('Waiting for next round…');
      setMessage('');
      return;
    }

    // 🟢 ACTIVE ROUND
    if (data.status === 'ACTIVE') {
      const r = data.round;

      // 🆕 New round → reset user state
      if (currentRoundId !== r.id) {
        currentRoundId = r.id;
        hasVoted = false;
        setMessage('');
      }

      setStatus('Round Active!');
      setQuestion(r.question_text);

      // 🔒 USER ALREADY VOTED → LOCK UI
      if (hasVoted) {
        showOptions(false);
        setMessage('Vote submitted. Please wait…');
        return;
      }

      // 🟢 USER CAN VOTE
      showOptions(true);
      document.getElementById('A').innerText = r.option_a;
      document.getElementById('B').innerText = r.option_b;
      document.getElementById('C').innerText = r.option_c;
      document.getElementById('D').innerText = r.option_d;
      return;
    }

    // ⚪ NO ROUND YET
    showOptions(false);
    setStatus('Waiting for round…');
    setQuestion('Please wait for the next round');
    setMessage('');

  } catch (err) {
    console.error('fetchRound failed:', err);
  }
}

// ===============================
// 🗳️ VOTE
// ===============================
async function vote(option) {
  if (hasVoted || !currentRoundId) return;

  try {
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
      showOptions(false);
      setMessage('Vote submitted. Please wait…');
    } else {
      setMessage(data.error || 'Vote failed');
    }
  } catch (err) {
    console.error('Vote error:', err);
  }
}

// ===============================
// 🔁 POLLING
// ===============================
setInterval(fetchRound, 2000);
fetchRound();

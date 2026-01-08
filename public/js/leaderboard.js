async function loadLeaderboard() {
  try {
    const res = await fetch('/game/leaderboard');
    const data = await res.json();

    const ul = document.getElementById('list');
    if (!ul) return;

    ul.innerHTML = '';

    if (!data.leaderboard || data.leaderboard.length === 0) {
      ul.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏆</div>
          <div class="empty-text">No players yet</div>
        </div>
      `;
      return;
    }

    data.leaderboard.forEach((u, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="player-info">
          <div class="rank">${i + 1}</div>
          <div class="player-name">${u.name}</div>
        </div>
        <div class="score">${u.score}</div>
      `;
      ul.appendChild(li);
    });
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
    const ul = document.getElementById('list');
    if (ul) {
      ul.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <div class="empty-text">Error loading leaderboard</div>
        </div>
      `;
    }
  }
}

// Auto-refresh every 5 seconds
setInterval(loadLeaderboard, 5000);
loadLeaderboard();

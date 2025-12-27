async function loadLeaderboard() {
  const res = await fetch('/game/leaderboard');
  const data = await res.json();

  const ul = document.getElementById('list');
  ul.innerHTML = '';

  data.leaderboard.forEach((u, i) => {
    const li = document.createElement('li');
    li.innerText = `${i + 1}. ${u.name} – ${u.score}`;
    ul.appendChild(li);
  });
}

loadLeaderboard();

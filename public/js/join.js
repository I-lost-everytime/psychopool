async function joinGame() {
  const name = document.getElementById('name').value;

  const res = await fetch('/game/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });

  const data = await res.json();

  if (data.success) {
    localStorage.setItem('userId', data.userId);
    window.location.href = '/game.html';
  } else {
    document.getElementById('msg').innerText = data.error;
  }
}

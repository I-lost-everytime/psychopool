// ===============================
// 🔍 CHECK EXISTING SESSION
// ===============================
function checkExistingSession() {
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  if (userId && userName) {
    // User already registered, redirect to game immediately
    window.location.href = '/game.html';
    return true;
  }
  
  // Show logout section if somehow user info exists but incomplete
  const logoutSection = document.getElementById('logoutSection');
  const currentUserNameEl = document.getElementById('currentUserName');
  
  if (userName && currentUserNameEl) {
    currentUserNameEl.innerText = userName;
    if (logoutSection) logoutSection.style.display = 'block';
  }
  
  return false;
}

// ===============================
// 👤 JOIN GAME
// ===============================
async function joinGame() {
  const nameInput = document.getElementById('name');
  const name = nameInput.value.trim();
  const msgEl = document.getElementById('msg');

  // Validation
  if (!name || name === '') {
    msgEl.innerText = 'Please enter your name';
    msgEl.className = 'error';
    return;
  }

  // Disable button during request
  const btn = document.querySelector('button');
  btn.disabled = true;
  btn.innerText = 'JOINING...';
  msgEl.innerText = '';
  msgEl.className = '';

  try {
    const res = await fetch('/game/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    const data = await res.json();

    if (data.success) {
      // Save user session
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userName', name);
      
      // Show success message briefly before redirect
      msgEl.innerText = 'Welcome! Redirecting...';
      msgEl.className = 'success';
      
      setTimeout(() => {
        window.location.href = '/game.html';
      }, 500);
    } else {
      msgEl.innerText = data.error || 'Failed to join game';
      msgEl.className = 'error';
      btn.disabled = false;
      btn.innerText = '▶ JOIN GAME ◀';
    }
  } catch (err) {
    console.error('Join error:', err);
    msgEl.innerText = 'Network error. Please try again.';
    msgEl.className = 'error';
    btn.disabled = false;
    btn.innerText = '▶ JOIN GAME ◀';
  }
}

// ===============================
// 🚪 LOGOUT / CHANGE USER
// ===============================
function logout() {
  if (confirm('Do you want to join as a different user?')) {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.reload();
  }
}

// ===============================
// 🚀 INITIALIZE
// ===============================
// Check for existing session immediately (before DOM loads for faster redirect)
if (checkExistingSession()) {
  // User will be redirected, stop execution
  // (This won't actually stop, but redirect happens)
}

// Wait for DOM to load for other features
document.addEventListener('DOMContentLoaded', () => {
  // Re-check session (in case redirect didn't happen)
  if (!checkExistingSession()) {
    // Add Enter key support
    const nameInput = document.getElementById('name');
    if (nameInput) {
      nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          joinGame();
        }
      });

      // Focus on input when page loads
      nameInput.focus();
    }
  }
});

// ===============================
// 🔐 SESSION CHECK
// ===============================
const userId = localStorage.getItem('userId');
const userName = localStorage.getItem('userName');

// Redirect to join page if not registered
if (!userId || !userName) {
  window.location.href = '/';
}

let currentRoundId = null;
let hasVoted = false;
let previousStatus = null;
let leaderboardTimer = null;
let countdownInterval = null;

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

function showLeaderboard(show) {
  const box = document.getElementById('leaderboardBox');
  const container = document.querySelector('.container');
  if (!box) return;
  
  if (show) {
    box.style.display = 'block';
    box.classList.add('show');
    // Add class to container to hide other elements
    if (container) container.classList.add('leaderboard-mode');
  } else {
    box.style.display = 'none';
    box.classList.remove('show');
    // Remove class from container
    if (container) container.classList.remove('leaderboard-mode');
  }
}

function hideAllGameElements() {
  showOptions(false);
  showLeaderboard(false);
  const resultsBox = document.getElementById('resultsBox');
  if (resultsBox) resultsBox.style.display = 'none';
}

function showWaitingElements(show) {
  const waitingAnimation = document.getElementById('waitingAnimation');
  const waitingText = document.getElementById('waitingText');
  const questionPanel = document.querySelector('.question-panel');
  const messagePanel = document.querySelector('.message-panel');
  
  if (waitingAnimation) waitingAnimation.style.display = show ? 'flex' : 'none';
  if (waitingText) waitingText.style.display = show ? 'flex' : 'none';
  if (questionPanel) questionPanel.style.display = show ? 'flex' : 'none';
  if (messagePanel) messagePanel.style.display = show ? 'flex' : 'none';
  
  // Start/stop particle animation
  if (show) {
    startParticleAnimation();
  } else {
    stopParticleAnimation();
  }
}

// ===============================
// ✨ PARTICLE ANIMATION
// ===============================
let particleInterval = null;
const particleColors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff0000'];

function createParticle() {
  const field = document.getElementById('particleField');
  if (!field) return;
  
  const particle = document.createElement('div');
  particle.className = 'particle';
  
  const color = particleColors[Math.floor(Math.random() * particleColors.length)];
  particle.style.color = color;
  particle.style.left = Math.random() * 100 + '%';
  particle.style.top = '100%';
  particle.style.setProperty('--tx', (Math.random() * 300 - 150) + 'px');
  particle.style.animationDelay = Math.random() * 0.3 + 's';
  particle.style.animationDuration = (Math.random() * 2 + 3) + 's';
  
  field.appendChild(particle);
  
  setTimeout(() => {
    if (particle.parentNode) {
      particle.remove();
    }
  }, 5000);
}

function startParticleAnimation() {
  if (particleInterval) return;
  
  // Create initial burst of particles
  for (let i = 0; i < 25; i++) {
    setTimeout(() => createParticle(), i * 100);
  }
  
  // Continue creating particles at regular intervals
  particleInterval = setInterval(() => {
    // Create 2-3 particles at once for more density
    createParticle();
    setTimeout(() => createParticle(), 150);
  }, 400);
}

function stopParticleAnimation() {
  if (particleInterval) {
    clearInterval(particleInterval);
    particleInterval = null;
  }
  
  const field = document.getElementById('particleField');
  if (field) {
    field.innerHTML = '';
  }
}

// ===============================
// 🏆 LOAD LEADERBOARD
// ===============================
async function loadLeaderboard() {
  try {
    const res = await fetch('/game/leaderboard?limit=10');
    const data = await res.json();

    if (data.success && data.leaderboard) {
      const list = document.getElementById('leaderboardList');
      if (!list) return;

      list.innerHTML = '';

      data.leaderboard.forEach((user, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="leaderboard-rank">${index + 1}.</span>
          <span class="leaderboard-name">${user.name}</span>
          <span class="leaderboard-score">${user.score} pts</span>
        `;
        list.appendChild(li);
      });
    }
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
  }
}

// ===============================
// ⏱️ SHOW LEADERBOARD WITH COUNTDOWN
// ===============================
function showLeaderboardWithCountdown() {
  // Clear any existing timers
  if (leaderboardTimer) {
    clearTimeout(leaderboardTimer);
    leaderboardTimer = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  // Hide ALL other elements - only show leaderboard
  showOptions(false);
  const resultsBox = document.getElementById('resultsBox');
  if (resultsBox) resultsBox.style.display = 'none';
  showWaitingElements(false); // Hide waiting animation, question panel, message panel
  
  // Hide status text too - leaderboard has its own header
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.style.display = 'none';

  // Show leaderboard
  loadLeaderboard();
  showLeaderboard(true);

  // Countdown timer
  let secondsLeft = 5;
  const countdownEl = document.getElementById('countdownTimer');
  
  if (countdownEl) {
    countdownEl.innerText = `Returning to waiting area in ${secondsLeft}...`;
    
    countdownInterval = setInterval(() => {
      secondsLeft--;
      if (countdownEl) {
        countdownEl.innerText = secondsLeft > 0 
          ? `Returning to waiting area in ${secondsLeft}...`
          : 'Returning...';
      }
      
      if (secondsLeft <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    }, 1000);
  }

  // Hide leaderboard and return to waiting after 5 seconds
  leaderboardTimer = setTimeout(() => {
    showLeaderboard(false);
    
    // Show waiting elements again
    showWaitingElements(true);
    
    // Remove active classes and update status
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.classList.remove('active');
      statusEl.innerText = 'Waiting for round…';
    }
    
    const questionPanel = document.querySelector('.question-panel');
    if (questionPanel) {
      questionPanel.classList.remove('active');
    }
    
    const msgPanel = document.querySelector('.message-panel');
    if (msgPanel) {
      msgPanel.classList.remove('success');
    }
    
    setQuestion('Please wait for the next round');
    setMessage('');
    
    if (countdownEl) countdownEl.innerText = '';
    
    // Reset state
    currentRoundId = null;
    hasVoted = false;
  }, 5000);
}

// ===============================
// 🔄 FETCH ROUND STATE
// ===============================
async function fetchRound() {
  try {
    const res = await fetch('/game/current-round');
    const data = await res.json();

    // 🔴 RESULT → Show leaderboard for 5 seconds
    if (data.status === 'RESULT') {
      // Only show leaderboard if we just transitioned from ACTIVE to RESULT
      // or if we're not already showing it (e.g., page refresh)
      if (previousStatus === 'ACTIVE') {
        // Transition from active to result - show leaderboard
        showLeaderboardWithCountdown();
      } else if (previousStatus !== 'RESULT' && !leaderboardTimer) {
        // First time seeing RESULT status (e.g., page refresh or late join)
        showLeaderboardWithCountdown();
      }
      // If already showing leaderboard, don't reset the timer
      previousStatus = 'RESULT';
      return;
    }

    // 🟢 ACTIVE ROUND
    if (data.status === 'ACTIVE') {
      // Clear leaderboard timer if active round starts
      if (leaderboardTimer) {
        clearTimeout(leaderboardTimer);
        leaderboardTimer = null;
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      
      // Hide leaderboard
      showLeaderboard(false);
      
      const r = data.round;

      // 🆕 New round → reset user state
      if (currentRoundId !== r.id) {
        currentRoundId = r.id;
        hasVoted = false;
        setMessage('');
      }

      // Hide waiting animation, show question panel
      const waitingAnimation = document.getElementById('waitingAnimation');
      const waitingText = document.getElementById('waitingText');
      if (waitingAnimation) waitingAnimation.style.display = 'none';
      if (waitingText) waitingText.style.display = 'none';
      
      // Show question panel and message panel
      const questionPanel = document.querySelector('.question-panel');
      const messagePanel = document.querySelector('.message-panel');
      if (questionPanel) {
        questionPanel.style.display = 'flex';
        questionPanel.classList.add('active');
      }
      if (messagePanel) messagePanel.style.display = 'flex';
      
      // Update status
      const statusEl = document.getElementById('status');
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.classList.add('active');
        statusEl.innerText = 'Round Active!';
      }
      
      setQuestion(r.question_text);

      // 🔒 USER ALREADY VOTED → LOCK UI
      if (hasVoted) {
        showOptions(false);
        setMessage('Vote submitted. Please wait…');
        previousStatus = 'ACTIVE';
        return;
      }

      // 🟢 USER CAN VOTE
      showOptions(true);
      document.getElementById('A').innerText = r.option_a;
      document.getElementById('B').innerText = r.option_b;
      document.getElementById('C').innerText = r.option_c;
      document.getElementById('D').innerText = r.option_d;
      
      previousStatus = 'ACTIVE';
      return;
    }

    // ⚪ NO ROUND YET
    // Clear any timers
    if (leaderboardTimer) {
      clearTimeout(leaderboardTimer);
      leaderboardTimer = null;
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    
    // Hide leaderboard, show waiting elements
    hideAllGameElements();
    
    // Show waiting animation and text
    const waitingAnimation = document.getElementById('waitingAnimation');
    const waitingText = document.getElementById('waitingText');
    if (waitingAnimation) waitingAnimation.style.display = 'flex';
    if (waitingText) waitingText.style.display = 'flex';
    
    // Show question panel with waiting message
    const questionPanel = document.querySelector('.question-panel');
    if (questionPanel) {
      questionPanel.style.display = 'flex';
      questionPanel.classList.remove('active');
    }
    
    // Show message panel
    const messagePanel = document.querySelector('.message-panel');
    if (messagePanel) {
      messagePanel.style.display = 'flex';
      messagePanel.classList.remove('success');
    }
    
    // Update status
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.classList.remove('active');
      statusEl.innerText = 'Waiting for round…';
    }
    
    setQuestion('Please wait for the next round');
    setMessage('');
    
    previousStatus = 'WAITING';

  } catch (err) {
    console.error('fetchRound failed:', err);
  }
}

// ===============================
// 🎉 CELEBRATION EFFECTS
// ===============================
function createConfetti() {
  const colors = ['#ff00ff', '#00ffff', '#ffff00', '#00ff00', '#ff0000'];
  const container = document.querySelector('.container');
  
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    container.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 3000);
  }
}

function showCelebration() {
  const celebration = document.createElement('div');
  celebration.className = 'celebration';
  celebration.innerHTML = '✨ VOTED! ✨';
  document.body.appendChild(celebration);
  
  setTimeout(() => celebration.remove(), 2500);
  createConfetti();
}

function addSparkles(element) {
  for (let i = 0; i < 5; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = Math.random() * 100 + '%';
    sparkle.style.top = Math.random() * 100 + '%';
    sparkle.style.animationDelay = Math.random() * 0.5 + 's';
    element.appendChild(sparkle);
    
    setTimeout(() => sparkle.remove(), 1000);
  }
}

// ===============================
// 🗳️ VOTE
// ===============================
async function vote(option) {
  if (hasVoted || !currentRoundId) return;

  const button = document.getElementById(option);
  if (button) {
    addSparkles(button);
  }

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
      
      // Celebration effects
      showCelebration();
      
      // Update message panel with success style
      const msgPanel = document.querySelector('.message-panel');
      if (msgPanel) {
        msgPanel.classList.add('success');
      }
      
      setMessage('✓ Vote submitted! Please wait…');
    } else {
      setMessage(data.error || 'Vote failed');
      // Shake animation on error
      if (button) {
        button.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
          button.style.animation = '';
        }, 500);
      }
    }
  } catch (err) {
    console.error('Vote error:', err);
    setMessage('Network error. Please try again.');
  }
}

// ===============================
// 🔁 POLLING
// ===============================
setInterval(fetchRound, 2000);
fetchRound();

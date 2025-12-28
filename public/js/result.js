let resultsRendered = false; // 🔒 prevent re-render

async function loadResults() {
  if (resultsRendered) return;
  resultsRendered = true;

  try {
    const res = await fetch('/admin/live-vote-stats');
    const data = await res.json();

    // 🛑 Safety check
    if (!data || !data.total || data.total < 1) {
      const w = document.getElementById('winner');
      if (w) w.innerText = '🤫 Not enough votes';
      return;
    }

    const options = ['A', 'B', 'C', 'D'];
    let maxCount = -1;
    let winners = [];

    options.forEach((opt, i) => {
      const count = data[opt] || 0;
      const percent = Math.round((count / data.total) * 100);

      const bar = document.getElementById(`bar${opt}`);
      const label = document.getElementById(`p${opt}`);

      // ✅ Animate bar
      if (bar) {
        gsap.to(bar, {
          width: percent + '%',
          duration: 1,
          ease: 'power2.out',
          delay: i * 0.15
        });
      }

      // ✅ Animate percentage (SAFE OBJECT)
      if (label) {
        const counter = { val: 0 };
        gsap.to(counter, {
          val: percent,
          duration: 1,
          delay: i * 0.15,
          onUpdate() {
            label.innerText = Math.round(counter.val) + '%';
          }
        });
      }

      // 🏆 winner detection
      if (count > maxCount) {
        maxCount = count;
        winners = [opt];
      } else if (count === maxCount) {
        winners.push(opt);
      }
    });

    // 🎯 Winner reveal
    setTimeout(() => {
      const winnerEl = document.getElementById('winner');
      if (!winnerEl) return;

      winnerEl.innerText =
        winners.length > 1
          ? `🤝 Tie between options: ${winners.join(', ')}`
          : `🏆 Most Selected Option: ${winners[0]}`;

      gsap.fromTo(
        winnerEl,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4 }
      );
    }, 1200);

  } catch (err) {
    console.error('Failed to load results:', err);
    const w = document.getElementById('winner');
    if (w) w.innerText = '⚠️ Error loading results';
  }
}

// ▶️ Run once
loadResults();

const pool = require('../db');

// ===============================
// 👤 JOIN GAME
// ===============================
exports.joinGame = async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO users (name) VALUES ($1) RETURNING id',
      [name.trim()]
    );

    res.json({
      success: true,
      userId: result.rows[0].id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join game' });
  }
};

// ===============================
// 🔄 CURRENT ROUND (USER)
// ===============================
exports.getCurrentRound = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id,
              r.round_number,
              r.is_active,
              r.is_completed,
              q.question_text,
              q.option_a,
              q.option_b,
              q.option_c,
              q.option_d
       FROM rounds r
       JOIN questions q ON r.question_id = q.id
       ORDER BY r.id DESC
       LIMIT 1`
    );

    // No round yet
    if (result.rows.length === 0) {
      return res.json({ status: 'WAITING' });
    }

    const round = result.rows[0];

    // 🟢 ACTIVE ROUND
    if (round.is_active) {
      return res.json({
        status: 'ACTIVE',
        round
      });
    }

    // 🔴 ROUND ENDED (ADMIN HANDLES RESULTS)
    if (round.is_completed) {
      return res.json({
        status: 'RESULT'
      });
    }

    // ⚪ WAITING
    return res.json({ status: 'WAITING' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch round' });
  }
};

// ===============================
// 🗳️ SUBMIT VOTE
// ===============================
exports.submitVote = async (req, res) => {
  const { userId, roundId, selectedOption } = req.body;

  if (!userId || !roundId || !selectedOption) {
    return res.status(400).json({ error: 'Missing vote data' });
  }

  if (!['A', 'B', 'C', 'D'].includes(selectedOption)) {
    return res.status(400).json({ error: 'Invalid option selected' });
  }

  try {
    // Check if round is active
    const roundCheck = await pool.query(
      'SELECT is_active FROM rounds WHERE id = $1',
      [roundId]
    );

    if (roundCheck.rows.length === 0 || !roundCheck.rows[0].is_active) {
      return res.status(403).json({ error: 'Voting is closed' });
    }

    // Insert vote (unique constraint protects duplicates)
    await pool.query(
      `INSERT INTO votes (user_id, round_id, selected_option)
       VALUES ($1, $2, $3)`,
      [userId, roundId, selectedOption]
    );

    res.json({ success: true });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You have already voted' });
    }

    console.error(err);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
};

// ===============================
// 🏆 LEADERBOARD
// ===============================
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(
      `SELECT id, name, score
       FROM users
       ORDER BY score DESC, id ASC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      leaderboard: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

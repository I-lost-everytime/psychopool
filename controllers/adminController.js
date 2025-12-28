const pool = require('../db');

// ===============================
// ▶️ START ROUND (ADMIN)
// ===============================
exports.startRound = async (req, res) => {
  const {
    questionId,
    roundNumber,
    points = 10,
    scoring_type = 'LEAST',
    priority_rules = null
  } = req.body;

  if (!questionId || !roundNumber) {
    return res.status(400).json({
      error: 'questionId and roundNumber are required'
    });
  }

  try {
    // End any active round
    await pool.query(
      'UPDATE rounds SET is_active = false WHERE is_active = true'
    );

    // Create new round
    const result = await pool.query(
      `INSERT INTO rounds
        (round_number, question_id, is_active, is_completed, scoring_type, points, priority_rules)
       VALUES ($1, $2, true, false, $3, $4, $5)
       RETURNING id`,
      [
        roundNumber,
        questionId,
        scoring_type,
        points,
        priority_rules
      ]
    );

    res.json({
      success: true,
      roundId: result.rows[0].id,
      message: 'Round started successfully'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start round' });
  }
};

// ===============================
// ⏹ END ROUND (ADMIN)
// ===============================
exports.endRound = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get active round
    const roundRes = await client.query(
      `SELECT id, scoring_type, points, priority_rules
       FROM rounds
       WHERE is_active = true
       LIMIT 1`
    );

    if (roundRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No active round' });
    }

    const round = roundRes.rows[0];
    const roundId = round.id;

    // Lock round
    await client.query(
      'UPDATE rounds SET is_active = false WHERE id = $1',
      [roundId]
    );

    // Count votes
    const voteRes = await client.query(
      `SELECT selected_option, COUNT(*) AS count
       FROM votes
       WHERE round_id = $1
       GROUP BY selected_option`,
      [roundId]
    );

    const counts = { A: 0, B: 0, C: 0, D: 0 };
    voteRes.rows.forEach(r => {
      counts[r.selected_option] = parseInt(r.count);
    });

    const values = Object.values(counts);

    // Determine winners
    let winningOptions = [];

    if (round.scoring_type === 'LEAST') {
      const min = Math.min(...values.filter(v => v > 0));
      winningOptions = Object.keys(counts).filter(
        o => counts[o] === min
      );
    }

    if (round.scoring_type === 'MOST') {
      const max = Math.max(...values);
      winningOptions = Object.keys(counts).filter(
        o => counts[o] === max
      );
    }

    // Award points (non-priority)
    if (round.scoring_type !== 'PRIORITY') {
      await client.query(
        `UPDATE users
         SET score = score + $1,
             rounds_played = rounds_played + 1
         WHERE id IN (
           SELECT user_id
           FROM votes
           WHERE round_id = $2
           AND selected_option = ANY($3)
         )`,
        [round.points, roundId, winningOptions]
      );
    }

    // Save results (IMPORTANT)
    await client.query(
      `INSERT INTO round_results (round_id, option_counts, winning_options)
       VALUES ($1, $2::jsonb, $3::jsonb)`,
      [
        roundId,
        JSON.stringify(counts),
        JSON.stringify(winningOptions)
      ]
    );

    // Cleanup votes
    await client.query(
      'DELETE FROM votes WHERE round_id = $1',
      [roundId]
    );

    // Mark round completed
    await client.query(
      'UPDATE rounds SET is_completed = true WHERE id = $1',
      [roundId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      roundId,
      counts,
      winningOptions,
      message: 'Round ended and results calculated'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to end round' });
  } finally {
    client.release();
  }
};

// ===============================
// 📊 FINAL RESULTS (ADMIN ONLY)
// ===============================
exports.getLiveVoteStats = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT option_counts
       FROM round_results
       ORDER BY round_id DESC
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return res.json({ total: 0 });
    }

    const counts = result.rows[0].option_counts;

    const total =
      (counts.A || 0) +
      (counts.B || 0) +
      (counts.C || 0) +
      (counts.D || 0);

    res.json({
      A: counts.A || 0,
      B: counts.B || 0,
      C: counts.C || 0,
      D: counts.D || 0,
      total
    });

  } catch (err) {
    console.error('getLiveVoteStats error:', err);
    res.status(500).json({ error: 'Failed to fetch vote stats' });
  }
};

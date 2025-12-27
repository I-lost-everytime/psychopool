const pool = require('../db');

exports.startRound = async (req, res) => {
  const { questionId, roundNumber } = req.body;

  if (!questionId || !roundNumber) {
    return res.status(400).json({ error: 'questionId and roundNumber required' });
  }

  try {
    // 1️⃣ End any active round
    await pool.query(
      'UPDATE rounds SET is_active = false WHERE is_active = true'
    );

    // 2️⃣ Create new round (inactive first)
    const result = await pool.query(
      `INSERT INTO rounds (round_number, question_id, is_active, is_completed)
       VALUES ($1, $2, true, false)
       RETURNING id`,
      [roundNumber, questionId]
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

exports.endRound = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1️⃣ Get active round
    const roundRes = await client.query(
      'SELECT id FROM rounds WHERE is_active = true LIMIT 1'
    );

    if (roundRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No active round' });
    }

    const roundId = roundRes.rows[0].id;

    // 2️⃣ Lock the round
    await client.query(
      'UPDATE rounds SET is_active = false WHERE id = $1',
      [roundId]
    );

    // 3️⃣ Count votes
    const voteCountsRes = await client.query(
      `SELECT selected_option, COUNT(*) AS count
       FROM votes
       WHERE round_id = $1
       GROUP BY selected_option`,
      [roundId]
    );

    // Convert to object
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    voteCountsRes.rows.forEach(row => {
      counts[row.selected_option] = parseInt(row.count);
    });

    const minCount = Math.min(...Object.values(counts));

    const winningOptions = Object.keys(counts).filter(
      opt => counts[opt] === minCount
    );

    // 4️⃣ Award points (+10)
    await client.query(
      `UPDATE users
       SET score = score + 10,
           rounds_played = rounds_played + 1
       WHERE id IN (
         SELECT user_id
         FROM votes
         WHERE round_id = $1
         AND selected_option = ANY($2)
       )`,
      [roundId, winningOptions]
    );

    // 5️⃣ Save round result
    await client.query(
  `INSERT INTO round_results (round_id, option_counts, winning_options)
   VALUES ($1, $2::jsonb, $3::jsonb)`,
  [
    roundId,
    JSON.stringify(counts),
    JSON.stringify(winningOptions)
  ]
);


    // 6️⃣ Clear votes
    await client.query(
      'DELETE FROM votes WHERE round_id = $1',
      [roundId]
    );

    // 7️⃣ Mark round completed
    await client.query(
      'UPDATE rounds SET is_completed = true, result_visible = true WHERE id = $1',
      [roundId]
    );

    await client.query('COMMIT');

// ⏱️ Auto-hide result after 5 seconds
setTimeout(async () => {
  try {
    await pool.query(
      'UPDATE rounds SET result_visible = false WHERE id = $1',
      [roundId]
    );
  } catch (err) {
    console.error('Failed to hide result:', err);
  }
}, 5000);

res.json({
  success: true,
  roundId,
  counts,
  winningOptions,
  message: 'Round ended and scores updated'
});

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to end round' });
  } finally {
    client.release();
  }
};

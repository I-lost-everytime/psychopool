const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.post('/join', gameController.joinGame);
router.get('/current-round', gameController.getCurrentRound);
router.post('/vote', gameController.submitVote);
router.get('/leaderboard', gameController.getLeaderboard);

module.exports = router;

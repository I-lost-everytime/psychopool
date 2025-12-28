const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/start-round', adminController.startRound);
router.post('/end-round', adminController.endRound);
router.get('/live-vote-stats', adminController.getLiveVoteStats);

module.exports = router;

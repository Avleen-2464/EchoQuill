const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const journalController = require('../controllers/journalController');

// @route GET /api/journal
router.get('/', auth, journalController.getAllJournals);

// @route POST /api/journal/generate-from-chat
router.post('/generate-from-chat', auth, journalController.generateFromChat);

// @route DELETE /api/journal/:id
router.delete('/:id', auth, journalController.deleteJournal);

// @route POST /api/journal/create-from-chat
// router.post('/create-from-chat', auth, journalController.createJournalFromChat);
router.get('/mood-trends', auth, journalController.getMoodTrends);

module.exports = router;

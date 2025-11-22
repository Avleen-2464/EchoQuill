const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const remedyController = require("../controllers/remedyController");

router.post("/generate", auth, remedyController.generateRemedy);
router.post("/feedback", auth, remedyController.submitFeedback);

module.exports = router;


const express = require("express");
const {
  getAllQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
  downloadQuotesPDF
} = require("../controllers/quoteController");

const router = express.Router();

router.get("/", getAllQuotes);
router.get("/:id", getQuoteById);
router.post("/", createQuote);
router.put("/:id", updateQuote);
router.delete("/:id", deleteQuote);
router.get('/download/pdf', downloadQuotesPDF);

module.exports = router;

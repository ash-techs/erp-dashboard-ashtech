const express = require("express");
const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getBalance,
  getTransactionsByStatus,
  downloadFinancePDF
} = require("../controllers/transactionController");

const router = express.Router();
router.get("/", getAllTransactions);
router.get("/balance", getBalance);
router.get("/status/:status", getTransactionsByStatus);
router.get("/:id", getTransactionById);
router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);
router.delete("/:id", deleteTransaction);
router.get('/download/pdf', downloadFinancePDF);

module.exports = router;
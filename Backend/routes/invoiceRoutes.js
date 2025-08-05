const express = require("express");
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoicesPDF
} = require("../controllers/invoiceController");

const router = express.Router();
router.get("/", getAllInvoices);
router.get("/:id", getInvoiceById);
router.post("/", createInvoice);
router.put("/:id", updateInvoice);
router.get('/download/pdf', downloadInvoicesPDF);
router.delete("/:id", deleteInvoice);

module.exports = router;
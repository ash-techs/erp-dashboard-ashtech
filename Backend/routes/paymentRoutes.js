const express = require("express");
const {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getTotalReceived,
  getPaymentsByClient,
  downloadPaymentsPDF
} = require("../controllers/paymentController");

const router = express.Router();

router.get("/", getAllPayments);
router.get("/total-received", getTotalReceived);
router.get("/client/:client", getPaymentsByClient);
router.get("/:id", getPaymentById);
router.post("/", createPayment);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);
router.get("/download/pdf", downloadPaymentsPDF);

module.exports = router;

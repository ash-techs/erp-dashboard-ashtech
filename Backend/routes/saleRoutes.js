const express = require("express");
const {
  getAllSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
  downloadSalesPDF
} = require("../controllers/saleController");

const router = express.Router();
router.get("/", getAllSales);
router.get('/download/pdf', downloadSalesPDF);
router.get("/:id", getSaleById);
router.post("/", createSale);
router.put("/:id", updateSale);
router.delete("/:id", deleteSale);

module.exports = router;
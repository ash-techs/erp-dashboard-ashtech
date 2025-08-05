const express = require("express");
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  downloadOrdersPDF
} = require("../controllers/orderController");

const router = express.Router();
router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.post("/", createOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

router.get('/download/pdf', downloadOrdersPDF);
module.exports = router;

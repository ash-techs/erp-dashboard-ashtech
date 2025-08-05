const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  getOrderAnalytics: async () => {
    try {
      const query = `
        SELECT
          o."id",
          o."number",
          o."quantity",
          o."price",
          o."discount",
          o."total",
          o."status",
          o."phone",
          o."state",
          o."city",
          o."note",
          o."createdAt",
          o."updatedAt",
          o."customerId",
          o."productId",
          o."companyId",
          c."name" AS company_name,
          cu."name" AS customer_name,
          p."name" AS product_name
        FROM
          "orders" o
        LEFT JOIN "companies" c ON o."companyId" = c."id"
        LEFT JOIN "customers" cu ON o."customerId" = cu."id"
        LEFT JOIN "products" p ON o."productId" = p."id"
        ORDER BY o."createdAt" DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getQuoteAnalytics: async () => {
    try {
      const query = `
        SELECT
          q."id",
          q."number",
          q."customerId",
          q."companyId",
          q."date",
          q."expireDate",
          q."year",
          q."currency",
          q."status",
          q."paid",
          q."note",
          q."tax",
          q."createdBy",
          q."createdAt",
          q."updatedAt",
          c."name" AS company_name,
          cu."name" AS customer_name,
          COUNT(qi."id") AS item_count,
          COALESCE(SUM(qi."quantity" * qi."price"), 0) AS total_quote_value
        FROM
          "quotes" q
        LEFT JOIN "QuoteItem" qi ON q."id" = qi."quoteId"
        LEFT JOIN "companies" c ON q."companyId" = c."id"
        LEFT JOIN "customers" cu ON q."customerId" = cu."id"
        GROUP BY q."id", c."name", cu."name"
        ORDER BY q."date" DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getInvoiceAnalytics: async () => {
    try {
      const query = `
        SELECT
          i."id",
          i."number",
          i."customerId",
          i."date",
          i."expireDate",
          i."year",
          i."currency",
          i."status",
          i."paid",
          i."note",
          i."tax",
          i."createdBy",
          i."createdAt",
          i."updatedAt",
          i."companyId",
          c."name" AS company_name,
          cu."name" AS customer_name,
          COUNT(ii."id") AS item_count,
          COALESCE(SUM(ii."quantity" * ii."price"), 0) AS total_item_value
        FROM
          "invoices" i
        LEFT JOIN "invoice_items" ii ON i."id" = ii."invoiceId"
        LEFT JOIN "companies" c ON i."companyId" = c."id"
        LEFT JOIN "customers" cu ON i."customerId" = cu."id"
        GROUP BY i."id", c."name", cu."name"
        ORDER BY i."date" DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getProductAnalytics: async () => {
    try {
      const query = `
        SELECT
          p."id",
          p."sku",
          p."image",
          p."name",
          p."price",
          p."quantity",
          p."description",
          c."name" AS company_name,
          COUNT(DISTINCT o."id") AS order_count,
          COUNT(DISTINCT s."id") AS sale_count,
          COALESCE(SUM(s."quantity" * s."unitPrice"), 0) AS total_sale_value,
          COALESCE(SUM(s."discount"), 0) AS total_discount
        FROM
          "products" p
        LEFT JOIN "companies" c ON p."companyId" = c."id"
        LEFT JOIN "orders" o ON p."id" = o."productId"
        LEFT JOIN "sales" s ON p."id" = s."productId"
        GROUP BY p."id", p."sku", p."image", p."name", p."price", p."quantity", p."description", c."name"
        ORDER BY total_sale_value DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getSaleAnalytics: async () => {
    try {
      const query = `
        SELECT
          s."id",
          s."quantity",
          s."unitPrice",
          s."discount",
          s."total",
          s."createdAt",
          s."updatedAt",
          s."productId",
          s."companyId",
          p."name" AS product_name,
          c."name" AS company_name
        FROM
          "sales" s
        LEFT JOIN "products" p ON s."productId" = p."id"
        LEFT JOIN "companies" c ON s."companyId" = c."id"
        ORDER BY s."createdAt" DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getCustomerAnalytics: async () => {
    try {
      const query = `
        SELECT
          cu."id",
          cu."name",
          cu."email",
          cu."phone",
          cu."address",
          cu."createdAt",
          cu."updatedAt",
          cu."companyId",
          c."name" AS company_name,
          COUNT(DISTINCT o."id") AS order_count,
          COUNT(DISTINCT i."id") AS invoice_count,
          COUNT(DISTINCT q."id") AS quote_count,
          COALESCE(SUM(o."total"), 0) AS total_order_value
        FROM
          "customers" cu
        LEFT JOIN "orders" o ON cu."id" = o."customerId"
        LEFT JOIN "invoices" i ON cu."id" = i."customerId"
        LEFT JOIN "quotes" q ON cu."id" = q."customerId"
        LEFT JOIN "companies" c ON cu."companyId" = c."id"
        GROUP BY cu."id", c."name"
        ORDER BY total_order_value DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getReportsAnalytics: async () => {
    try {
      const [orders, quotes, invoices, products, sales, customers] = await Promise.all([
        module.exports.getOrderAnalytics(),
        module.exports.getQuoteAnalytics(),
        module.exports.getInvoiceAnalytics(),
        module.exports.getProductAnalytics(),
        module.exports.getSaleAnalytics(),
        module.exports.getCustomerAnalytics(),
      ]);

      const stats = {
        revenue: sales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0),
        revenueChange: 0,
        customers: customers.length,
        customersChange: 0,
        invoices: invoices.length,
        invoicesChange: 0,
        orders: orders.length,
        ordersChange: 0,
        quoteCount: quotes.length,
        profit:
          sales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0) -
          products.reduce((sum, product) => sum + (parseFloat(product.total_discount) || 0), 0),
        profitChange: 0,
        monthlyExpenses: 0,
      };

      return {
        orders,
        quotes,
        invoices,
        products,
        sales,
        customers,
        stats,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  },
};
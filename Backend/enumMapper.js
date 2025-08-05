// Invoice Status Mappers
const mapStatusToEnum = (status) => {
  const statusMap = {
    "draft": "DRAFT",
    "pending": "PENDING",
    "unpaid": "UNPAID",
    "overdue": "OVERDUE",
    "partially paid": "PARTIALLY_PAID",
    "paid": "PAID",
  };
  return statusMap[status] || "DRAFT";
};

const mapStatusFromEnum = (status) => {
  const statusMap = {
    "DRAFT": "draft",
    "PENDING": "pending",
    "UNPAID": "unpaid",
    "OVERDUE": "overdue",
    "PARTIALLY_PAID": "partially paid",
    "PAID": "paid",
  };
  return statusMap[status] || "draft";
};

// Invoice Status Mappers
const mapQuoteStatusToEnum = (status) => {
  const statusMap = {
    "draft": "DRAFT",
    "sent": "SENT",
    "accepted": "ACCEPTED",
    "declined": "DECLINED",
    "expired": "EXPIRED",
  };
  return statusMap[status] || "DRAFT";
};

const mapQuoteStatusFromEnum = (status) => {
  const statusMap = {
    "DRAFT": "draft",
    "SENT": "sent",
    "ACCEPTED": "accepted",
    "DECLINED": "declined",
    "EXPIRED": "expired",
  };
  return statusMap[status] || "draft";
};
//Customer Status Mappers
function mapCustomerStatusToEnum(status) {
  if (!status) return 'ACTIVE';
  return status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
}

function mapCustomerStatusFromEnum(enumValue) {
  return enumValue === 'INACTIVE' ? 'Inactive' : 'Active';
}


// Transaction Type Mappers
const mapTypeToEnum = (type) => {
  const typeMap = {
    'Income': 'INCOME',
    'Expense': 'EXPENSE',
    'Transfer': 'TRANSFER'
  };
  return typeMap[type] || 'INCOME';
};

const mapTypeFromEnum = (type) => {
  const typeMap = {
    'INCOME': 'Income',
    'EXPENSE': 'Expense',
    'TRANSFER': 'Transfer'
  };
  return typeMap[type] || 'Income';
};

// Transaction Status Mappers
const mapTransactionStatusToEnum = (status) => {
  const statusMap = {
    'Pending': 'PENDING',
    'Completed': 'COMPLETED',
    'Cancelled': 'CANCELLED'
  };
  return statusMap[status] || 'PENDING';
};

const mapTransactionStatusFromEnum = (status) => {
  const statusMap = {
    'PENDING': 'Pending',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled'
  };
  return statusMap[status] || 'Pending';
};

// Category Mappers
const mapCategoryToEnum = (category) => {
  const categoryMap = {
    'Office Supplies': 'OFFICE_SUPPLIES',
    'Marketing': 'MARKETING',
    'Travel': 'TRAVEL',
    'Utilities': 'UTILITIES',
    'Salaries': 'SALARIES'
  };
  return categoryMap[category] || 'OFFICE_SUPPLIES';
};

const mapCategoryFromEnum = (category) => {
  const categoryMap = {
    'OFFICE_SUPPLIES': 'Office Supplies',
    'MARKETING': 'Marketing',
    'TRAVEL': 'Travel',
    'UTILITIES': 'Utilities',
    'SALARIES': 'Salaries'
  };
  return categoryMap[category] || 'Office Supplies';
};

// Customer Mappers
const mapCustomerToEnum = (customer) => {
  const customerMap = {
    'Acme Corp': 'ACME_CORP',
    'TechStart Inc': 'TECHSTART_INC',
    'Global Solutions': 'GLOBAL_SOLUTIONS'
  };
  return customerMap[customer] || 'ACME_CORP';
};

const mapCustomerFromEnum = (customer) => {
  const customerMap = {
    'ACME_CORP': 'Acme Corp',
    'TECHSTART_INC': 'TechStart Inc',
    'GLOBAL_SOLUTIONS': 'Global Solutions'
  };
  return customerMap[customer] || 'Acme Corp';
};

// Product Mappers
const mapProductToEnum = (product) => {
  const productMap = {
    'Product A': 'PRODUCT_A',
    'Product B': 'PRODUCT_B',
    'Product C': 'PRODUCT_C'
  };
  return productMap[product] || 'PRODUCT_A';
};

const mapProductFromEnum = (product) => {
  const productMap = {
    'PRODUCT_A': 'Product A',
    'PRODUCT_B': 'Product B',
    'PRODUCT_C': 'Product C'
  };
  return productMap[product] || 'Product A';
};

// Discount Mappers
const mapDiscountToEnum = (discount) => {
  const discountMap = {
    'No Discount': 'NO_DISCOUNT',
    '5% Off': 'FIVE_PERCENT',
    '10% Off': 'TEN_PERCENT',
    '15% Off': 'FIFTEEN_PERCENT'
  };
  return discountMap[discount] || 'NO_DISCOUNT';
};

const mapDiscountFromEnum = (discount) => {
  const discountMap = {
    'NO_DISCOUNT': 'No Discount',
    'FIVE_PERCENT': '5% Off',
    'TEN_PERCENT': '10% Off',
    'FIFTEEN_PERCENT': '15% Off'
  };
  return discountMap[discount] || 'No Discount';
};

// Sales Status Mappers
const mapSalesStatusToEnum = (status) => {
  const statusMap = {
    'Pending': 'PENDING',
    'Completed': 'COMPLETED',
    'Cancelled': 'CANCELLED',
    'Refunded': 'REFUNDED'
  };
  return statusMap[status] || 'COMPLETED';
};

const mapSalesStatusFromEnum = (status) => {
  const statusMap = {
    'PENDING': 'Pending',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
    'REFUNDED': 'Refunded'
  };
  return statusMap[status] || 'Completed';
};

// Payment Method Mappers
const mapPaymentMethodToEnum = (paymentMethod) => {
  const paymentMap = {
    'Cash': 'CASH',
    'Credit Card': 'CREDIT_CARD',
    'Bank Transfer': 'BANK_TRANSFER',
    'Digital Wallet': 'DIGITAL_WALLET'
  };
  return paymentMap[paymentMethod] || 'CASH';
};

const mapPaymentMethodFromEnum = (paymentMethod) => {
  const paymentMap = {
    'CASH': 'Cash',
    'CREDIT_CARD': 'Credit Card',
    'BANK_TRANSFER': 'Bank Transfer',
    'DIGITAL_WALLET': 'Digital Wallet'
  };
  return paymentMap[paymentMethod] || 'Cash';
};

// Discount Percentage Helper
const getDiscountPercentage = (discount) => {
  const discountMap = {
    'No Discount': 0,
    '5% Off': 5,
    '10% Off': 10,
    '15% Off': 15
  };
  return discountMap[discount] || 0;
};

// Payment Client Mappers
const mapClientToEnum = (client) => {
  const clientMap = {
    'Acme Corp': 'ACME_CORP',
    'TechStart Inc': 'TECHSTART_INC',
    'Global Solutions': 'GLOBAL_SOLUTIONS'
  };
  return clientMap[client] || 'ACME_CORP';
};

const mapClientFromEnum = (client) => {
  const clientMap = {
    'ACME_CORP': 'Acme Corp',
    'TECHSTART_INC': 'TechStart Inc',
    'GLOBAL_SOLUTIONS': 'Global Solutions'
  };
  return clientMap[client] || 'Acme Corp';
};

// Payment Mode Mappers
const mapPaymentModeToEnum = (paymentMode) => {
  const paymentModeMap = {
    'Cash': 'CASH',
    'Credit Card': 'CREDIT_CARD',
    'Bank Transfer': 'BANK_TRANSFER',
    'Digital Wallet': 'DIGITAL_WALLET',
    'Check': 'CHECK',
    'Wire Transfer': 'WIRE_TRANSFER'
  };
  return paymentModeMap[paymentMode] || 'CASH';
};

const mapPaymentModeFromEnum = (paymentMode) => {
  const paymentModeMap = {
    'CASH': 'Cash',
    'CREDIT_CARD': 'Credit Card',
    'BANK_TRANSFER': 'Bank Transfer',
    'DIGITAL_WALLET': 'Digital Wallet',
    'CHECK': 'Check',
    'WIRE_TRANSFER': 'Wire Transfer'
  };
  return paymentModeMap[paymentMode] || 'Cash';
};

// Payment Status Mappers
const mapPaymentStatusToEnum = (status) => {
  const statusMap = {
    'Received': 'RECEIVED',
    'Pending': 'PENDING',
    'Processing': 'PROCESSING',
    'Completed': 'COMPLETED',
    'Failed': 'FAILED',
    'Refunded': 'REFUNDED'
  };
  return statusMap[status] || 'RECEIVED';
};

const mapPaymentStatusFromEnum = (status) => {
  const statusMap = {
    'RECEIVED': 'Received',
    'PENDING': 'Pending',
    'PROCESSING': 'Processing',
    'COMPLETED': 'Completed',
    'FAILED': 'Failed',
    'REFUNDED': 'Refunded'
  };
  return statusMap[status] || 'Received';
};
// Employee Status Mappers
const mapEmployeeStatusToEnum = (status) => {
  const statusMap = {
    'Active': 'ACTIVE',
    'Inactive': 'INACTIVE'
  };
  return statusMap[status] || 'ACTIVE';
};

const mapEmployeeStatusFromEnum = (status) => {
  const statusMap = {
    'ACTIVE': 'Active',
    'INACTIVE': 'Inactive'
  };
  return statusMap[status] || 'Active';
};
//Order Status Mappers
const mapOrderStatusFromEnum = (statusEnum) => {
  const map = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return map[statusEnum] || statusEnum;
};

const mapOrderStatusToEnum = (statusString) => {
  const map = {
    Pending: "PENDING",
    Confirmed: "CONFIRMED",
    Shipped: "SHIPPED",
    Delivered: "DELIVERED",
    Cancelled: "CANCELLED",
  };
  return map[statusString] || statusString;
};
module.exports = {
  // Invoice mappers
  mapStatusToEnum,
  mapStatusFromEnum,
  
  // Quote mappers
  mapQuoteStatusToEnum,
  mapQuoteStatusFromEnum,
  
  // Transaction mappers
  mapTypeToEnum,
  mapTypeFromEnum,
  mapTransactionStatusToEnum,
  mapTransactionStatusFromEnum,
  mapCategoryToEnum,
  mapCategoryFromEnum,
  
  // Sales mappers
  mapCustomerToEnum,
  mapCustomerFromEnum,
  mapProductToEnum,
  mapProductFromEnum,
  mapDiscountToEnum,
  mapDiscountFromEnum,
  mapSalesStatusToEnum,
  mapSalesStatusFromEnum,
  mapPaymentMethodToEnum,
  mapPaymentMethodFromEnum,
  getDiscountPercentage,
  
  // Payment mappers
  mapClientToEnum,
  mapClientFromEnum,
  mapPaymentModeToEnum,
  mapPaymentModeFromEnum,
  mapPaymentStatusToEnum,
  mapPaymentStatusFromEnum,

    // Employee mappers
  mapEmployeeStatusToEnum,
  mapEmployeeStatusFromEnum,
  
  // Employee mappers
  mapOrderStatusToEnum,
  mapOrderStatusFromEnum,

  // Customer mappers
  mapCustomerStatusFromEnum,
  mapCustomerStatusToEnum

};

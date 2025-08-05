
import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/orders';
import { customerAPI } from '../services/customers';
import { productAPI } from '../services/products';
import { Button } from '@/components/ui/button';
import { Save, Edit, Trash2, X, Plus, Search, RefreshCw, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  number: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  status: string;
  phone: string;
  state: string;
  city: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  productId: string;
  companyId: string;
  customerName: string;
  productName: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

interface ValidationErrors {
  quantity?: string;
  price?: string;
  customerId?: string;
  productId?: string;
}

const LightGlassCard = ({ children, className = '', gradient = false }: { children: React.ReactNode; className?: string; gradient?: boolean }) => (
  <div className={`backdrop-blur-xl bg-white/80 border border-gray-200/50 rounded-2xl shadow-lg ${gradient ? 'bg-gradient-to-br from-white/90 to-gray-50/80' : ''} ${className}`}>
    {children}
  </div>
);

const OrdersForm: React.FC = () => {
  const [formData, setFormData] = useState<Partial<Order>>({
    quantity: 0,
    price: 0,
    discount: 0,
    total: 0,
    status: 'PENDING',
    phone: '',
    state: '',
    city: '',
    note: '',
    customerId: '',
    productId: '',
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState<Partial<Order> | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch orders, customers, and products
  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getOrders();
      setOrders(Array.isArray(response) ? response : []);
      setApiError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch orders';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getCustomers();
      setCustomers(Array.isArray(response) ? response : []);
      setApiError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch customers';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getProducts();
      setProducts(Array.isArray(response) ? response : []);
      setApiError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch products';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
  }, [searchTerm]);

  const validateForm = (data: Partial<Order>): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    if (!data.quantity || data.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (!data.price || data.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (!data.customerId) newErrors.customerId = 'Customer is required';
    if (!data.productId) newErrors.productId = 'Product is required';
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: name === 'quantity' || name === 'price' || name === 'discount' ? parseFloat(value) || 0 : value,
      };
      updated.total = (updated.quantity || 0) * (updated.price || 0) - (updated.discount || 0);
      return updated;
    });

    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editForm) {
      setEditForm(prev => {
        const updated = {
          ...prev,
          [name]: name === 'quantity' || name === 'price' || name === 'discount' ? parseFloat(value) || 0 : value,
        };
        updated.total = (updated.quantity || 0) * (updated.price || 0) - (updated.discount || 0);
        return updated;
      });
    }
  };

  const handleAddOrder = async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: 'Error',
        description: 'Please correct the form errors',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await orderAPI.createOrder({
        quantity: formData.quantity,
        price: formData.price,
        discount: formData.discount,
        total: formData.total,
        status: formData.status,
        phone: formData.phone,
        state: formData.state,
        city: formData.city,
        note: formData.note,
        customerId: formData.customerId,
        productId: formData.productId,
      });
      setOrders([...orders, response.data]);
      setFormData({
        quantity: 0,
        price: 0,
        discount: 0,
        total: 0,
        status: 'PENDING',
        phone: '',
        state: '',
        city: '',
        note: '',
        customerId: '',
        productId: '',
      });
      setErrors({});
      setShowAddModal(false);
      setApiError(null);
      toast({
        title: 'Success',
        description: 'Order added successfully',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create order';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setEditForm({ ...order });
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    const validationErrors = validateForm(editForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: 'Error',
        description: 'Please correct the form errors',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await orderAPI.updateOrder(`/${editForm.id}`, {
        quantity: editForm.quantity,
        price: editForm.price,
        discount: editForm.discount,
        total: editForm.total,
        status: editForm.status,
        phone: editForm.phone,
        state: editForm.state,
        city: editForm.city,
        note: editForm.note,
        customerId: editForm.customerId,
        productId: editForm.productId,
      });
      setOrders(orders.map(ord => ord.id === editForm.id ? response.data : ord));
      setEditingOrder(null);
      setEditForm(null);
      setErrors({});
      setApiError(null);
      toast({
        title: 'Success',
        description: 'Order updated successfully',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update order';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await orderAPI.deleteOrder(`/orders/${id}`);
        setOrders(orders.filter(ord => ord.id !== id));
        if (editingOrder?.id === id) {
          setEditingOrder(null);
          setEditForm(null);
        }
        setApiError(null);
        toast({
          title: 'Success',
          description: 'Order deleted successfully',
        });
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to delete order';
        setApiError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(order =>
    order.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {/* Error Message */}
      {apiError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span>{apiError}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
          <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600" />
          Order Management
        </h2>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => { fetchOrders(); fetchCustomers(); fetchProducts(); }}
            variant="outline"
            className="px-4 py-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
            className="px-4 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Order
          </Button>
        </div>
      </div>

      {/* Order Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredOrders.map((order) => (
          <LightGlassCard key={order.id} className="p-4 sm:p-6 hover:shadow-xl hover:bg-white/90 transition-all duration-300 group relative overflow-hidden" gradient>
            <div className="relative z-10">
              {/* Order Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                    {order.number.slice(0, 2)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-800 font-bold text-base sm:text-lg truncate">{order.number}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm truncate">{order.customerName}</p>
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-2 sm:space-y-3 mb-4">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 text-xs sm:text-sm truncate flex-1">{order.productName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 text-xs sm:text-sm truncate flex-1">${order.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs sm:text-sm truncate flex-1 ${
                      order.status === 'COMPLETED' ? 'text-green-600' :
                      order.status === 'PENDING' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 sm:pt-4 border-t border-gray-200/50 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEdit(order);
                  }}
                  className="flex-1 px-2 sm:px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={(e) => handleDelete(order.id, e)}
                  className="flex-1 px-2 sm:px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </LightGlassCard>
        ))}
      </div>

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <LightGlassCard className="p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" gradient>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Add New Order</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  name="customerId"
                  value={formData.customerId || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.customerId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
                {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  name="productId"
                  value={formData.productId || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.productId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                {errors.productId && <p className="text-red-500 text-xs mt-1">{errors.productId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.quantity ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="1"
                  step="1"
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.price ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="0.00"
                  step="0.01"
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                <input
                  type="number"
                  name="total"
                  value={formData.total?.toFixed(2) || '0.00'}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-sm border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  placeholder="+1 555-123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <input
                  type="text"
                  name="note"
                  value={formData.note || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  placeholder="Optional note"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrder}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm"
              >
                Add Order
              </button>
            </div>
          </LightGlassCard>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <LightGlassCard className="p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" gradient>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Edit Order</h3>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  name="customerId"
                  value={editForm.customerId || ''}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.customerId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
                {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  name="productId"
                  value={editForm.productId || ''}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.productId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                {errors.productId && <p className="text-red-500 text-xs mt-1">{errors.productId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={editForm.quantity || ''}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.quantity ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  step="1"
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  name="price"
                  value={editForm.price || ''}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.price ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  step="0.01"
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                <input
                  type="number"
                  name="discount"
                  value={editForm.discount || ''}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                <input
                  type="number"
                  name="total"
                  value={editForm.total?.toFixed(2) || '0.00'}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-sm border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={editForm.status || ''}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone || ''}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  placeholder="+1 555-123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={editForm.state || ''}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={editForm.city || ''}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <input
                  type="text"
                  name="note"
                  value={editForm.note || ''}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  placeholder="Optional note"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => setEditingOrder(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm"
              >
                Save Changes
              </button>
            </div>
          </LightGlassCard>
        </div>
      )}
    </div>
  );
};

export default OrdersForm;

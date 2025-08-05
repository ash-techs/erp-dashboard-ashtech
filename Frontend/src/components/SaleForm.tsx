import React, { useState, useEffect } from 'react';
import { Save, Calendar, Plus, Trash2, Pencil, Search, Download, RefreshCw, Grid2x2Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { saleApi, Sale, CreateSaleData } from '../services/sales';
import { customerAPI } from '../services/customers';
import { productAPI } from '../services/products';

interface Customer {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  quantity: number;
}

interface SaleFormData {
  saleId?: number;
  customerId: string;
  date: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  paymentMethod: string;
  notes: string;
  companyId?: string;
  createdBy?: string;
}

interface ValidationErrors {
  customerId?: string;
  date?: string;
  productId?: string;
  quantity?: string;
  unitPrice?: string;
  paymentMethod?: string;
}

const SaleForm = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<SaleFormData>({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    productId: '',
    quantity: '',
    unitPrice: '',
    discount: 'NONE',
    paymentMethod: '',
    notes: '',
    companyId: undefined,
    createdBy: 'Admin',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { toast } = useToast();

  // Fetch sales, customers, and products
  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await saleApi.getSales();
      if (!Array.isArray(response.data)) {
        throw new Error('Expected an array of sales, received: ' + JSON.stringify(response.data));
      }
      setSales(response.data);
    } catch (err: any) {
      console.error('Error fetching sales:', err);
      const errorMessage = err.message || 'Failed to fetch sales data';
      setError(errorMessage);
      setSales([]);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getCustomers();
      if (!Array.isArray(response.data)) {
        throw new Error('Expected an array of customers, received: ' + JSON.stringify(response.data));
      }
      setCustomers(response.data);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      const errorMessage = err.message || 'Failed to fetch customers';
      setError(errorMessage);
      setCustomers([]);
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
      if (!Array.isArray(response.data)) {
        throw new Error('Expected an array of products, received: ' + JSON.stringify(response.data));
      }
      setProducts(response.data);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      const errorMessage = err.message || 'Failed to fetch products';
      setError(errorMessage);
      setProducts([]);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchProducts();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      productId: '',
      quantity: '',
      unitPrice: '',
      discount: 'NONE',
      paymentMethod: '',
      notes: '',
      companyId: undefined,
      createdBy: 'Admin',
    });
    setEditingId(null);
    setErrors({});
    setIsDialogOpen(false);
  };

  const calculateAmount = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    const discountPercentage = getDiscountPercentage(formData.discount);
    return (quantity * unitPrice * (1 - discountPercentage)).toFixed(2);
  };

  const getDiscountPercentage = (discount: string) => {
    switch (discount) {
      case 'FIVE_PERCENT':
        return 0.05;
      case 'TEN_PERCENT':
        return 0.10;
      case 'FIFTEEN_PERCENT':
        return 0.15;
      default:
        return 0;
    }
  };

  const validateForm = (data: SaleFormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.customerId) errors.customerId = 'Customer is required';
    if (!data.date) errors.date = 'Date is required';
    if (!data.productId) errors.productId = 'Product is required';
    if (!data.quantity || parseFloat(data.quantity) <= 0) errors.quantity = 'Quantity must be greater than 0';
    if (!data.unitPrice || parseFloat(data.unitPrice) <= 0) errors.unitPrice = 'Unit price must be greater than 0';
    if (!data.paymentMethod) errors.paymentMethod = 'Payment method is required';
    return errors;
  };

  const handleAddOrUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        toast({
          title: 'Error',
          description: 'Please correct the form errors',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const quantity = parseFloat(formData.quantity);
      const selectedProduct = products.find((p) => p.id === parseInt(formData.productId));
      if (selectedProduct && quantity > selectedProduct.quantity) {
        setErrors((prev) => ({ ...prev, quantity: 'Insufficient product quantity available' }));
        toast({
          title: 'Error',
          description: 'Insufficient product quantity available',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const saleData: CreateSaleData = {
        customerId: parseInt(formData.customerId),
        productId: parseInt(formData.productId),
        date: formData.date,
        quantity: parseFloat(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        discount: formData.discount,
        amount: parseFloat(calculateAmount()),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        status: 'COMPLETED',
        createdBy: formData.createdBy,
        companyId: formData.companyId ? parseInt(formData.companyId) : undefined,
        item: '',
      };

      if (editingId) {
        await saleApi.updateSale(editingId, saleData);
        toast({
          title: 'Success',
          description: 'Sale updated successfully',
        });
      } else {
        await saleApi.createSale(saleData);
        toast({
          title: 'Success',
          description: 'Sale recorded successfully',
        });
      }

      await fetchSales();
      resetForm();
    } catch (err: any) {
      console.error('Error saving sale:', err);
      const errorMessage = err.message || (editingId ? 'Failed to update sale' : 'Failed to create sale');
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (sale: Sale) => {
    setLoading(true);
    setError(null);
    try {
      setFormData({
        saleId: sale.saleId,
        customerId: sale.customerId.toString(),
        date: sale.date,
        productId: sale.productId.toString(),
        quantity: sale.quantity.toString(),
        unitPrice: sale.unitPrice.toString(),
        discount: sale.discount,
        paymentMethod: sale.paymentMethod,
        notes: sale.notes || '',
        companyId: sale.companyId?.toString(),
        createdBy: sale.createdBy,
      });
      setEditingId(sale.saleId);
      setIsDialogOpen(true);
    } catch (err: any) {
      console.error('Error preparing sale for edit:', err);
      const errorMessage = err.message || 'Failed to load sale for editing';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      setLoading(true);
      setError(null);
      try {
        await saleApi.deleteSale(id);
        await fetchSales();
        toast({
          title: 'Success',
          description: 'Sale deleted successfully',
        });
      } catch (err: any) {
        console.error('Error deleting sale:', err);
        const errorMessage = err.message || 'Failed to delete sale';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await saleApi.downloadSalesPDF();
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sales-report.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
      });
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      const errorMessage = err.message || 'Failed to download PDF';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearchTerm('');
    fetchSales();
  };

  const filteredSales = sales.filter(
    (sale) =>
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.saleId.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold">Sales List</h1>
        <div className="flex space-x-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <Button variant="outline" onClick={handleRefresh} className="px-4 py-2" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} className="px-4 py-2" disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 min-w-[160px] justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Record New Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Sale' : 'Record New Sale'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddOrUpdateSale} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) =>
                        handleInputChange({ target: { name: 'customerId', value } } as any)
                      }
                    >
                      <SelectTrigger className={errors.customerId ? 'border-red-500 bg-red-50' : ''}>
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.customerId && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.customerId}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Sale Date</Label>
                    <div className="relative">
                      <Input
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className={errors.date ? 'border-red-500 bg-red-50' : ''}
                        required
                      />
                      <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.date && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.date}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productId">Product</Label>
                    <Select
                      value={formData.productId}
                      onValueChange={(value) =>
                        handleInputChange({ target: { name: 'productId', value } } as any)
                      }
                    >
                      <SelectTrigger className={errors.productId ? 'border-red-500 bg-red-50' : ''}>
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} (Available: {product.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.productId && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.productId}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      name="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="1"
                      min="1"
                      className={errors.quantity ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.quantity && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.quantity}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price</Label>
                    <Input
                      name="unitPrice"
                      type="number"
                      value={formData.unitPrice}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={errors.unitPrice ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.unitPrice && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.unitPrice}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <Select
                    value={formData.discount}
                    onValueChange={(value) =>
                      handleInputChange({ target: { name: 'discount', value } } as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Discount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No Discount</SelectItem>
                      <SelectItem value="FIVE_PERCENT">5% Off</SelectItem>
                      <SelectItem value="TEN_PERCENT">10% Off</SelectItem>
                      <SelectItem value="FIFTEEN_PERCENT">15% Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      handleInputChange({ target: { name: 'paymentMethod', value } } as any)
                    }
                  >
                    <SelectTrigger className={errors.paymentMethod ? 'border-red-500 bg-red-50' : ''}>
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="DIGITAL_WALLET">Digital Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.paymentMethod && (
                    <p className="text-red-600 text-sm mt-1 font-medium">{errors.paymentMethod}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Additional sale notes..."
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />

                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Total Amount: </span>
                    <span>${calculateAmount()}</span>
                  </div>
                  <div className="flex space-x-3">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : editingId ? 'Update' : 'Record'} Sale
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Sale ID</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Customer</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Date</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Product</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Quantity</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Unit Price</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Discount</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Amount</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Payment Method</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Status</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Grid2x2Plus className="h-12 w-12 mb-2 text-gray-400" />
                      <p className="text-lg font-medium mb-1">No sales yet</p>
                      <p className="text-sm">Click "Record New Sale" to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.saleId} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="font-medium text-gray-900">{sale.saleId}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{sale.customerName}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{new Date(sale.date).toLocaleDateString()}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{sale.productName}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{sale.quantity}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">${sale.unitPrice.toFixed(2)}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">
                        {sale.discount === 'NONE'
                          ? 'No Discount'
                          : sale.discount === 'FIVE_PERCENT'
                            ? '5% Off'
                            : sale.discount === 'TEN_PERCENT'
                              ? '10% Off'
                              : '15% Off'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="font-medium text-gray-900">${sale.amount.toFixed(2)}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{sale.paymentMethod}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(sale)}
                          disabled={loading}
                          className="hover:bg-blue-50 text-xs px-2 py-1"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(sale.saleId)}
                          disabled={loading}
                          className="text-xs px-2 py-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SaleForm;
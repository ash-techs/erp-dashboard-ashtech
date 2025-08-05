import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Save, Plus, RefreshCw, Edit, Trash2, Search, Download, Grid2x2Plus } from 'lucide-react';
import { invoiceAPI } from '../services/invoices';
import { customerAPI } from '../services/customers';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InvoiceItem {
  id?: string;
  item: string;
  description: string;
  quantity: number;
  price: number;
}

interface Customer {
  id: number;
  name: string;
}

interface InvoiceData {
  id?: number;
  number: string;
  customerId: number;
  customerName?: string; // Optional since we'll map it from customers
  date: string;
  expireDate: string;
  year: number;
  currency: string;
  status: 'DRAFT' | 'PENDING' | 'UNPAID' | 'OVERDUE' | 'PARTIALLY_PAID' | 'PAID';
  paid: number;
  total:number;
  note: string;
  items: InvoiceItem[];
  createdBy: string;
  tax?: number;
  companyId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ValidationErrors {
  number?: string;
  customerId?: string;
  date?: string;
  expireDate?: string;
  year?: string;
  currency?: string;
  items?: string;
  [key: string]: string | undefined;
}

const Invoices = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newInvoice, setNewInvoice] = useState<InvoiceData>({
    number: '',
    customerId: 0,
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    expireDate: '',
    year: new Date().getFullYear(),
    currency: 'PKR',
    status: 'DRAFT',
    paid: 0,
    total:0,
    note: '',
    items: [{ item: '', description: '', quantity: 0, price: 0 }],
    createdBy: 'Admin',
    tax: 0,
  });
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleInvoices, setVisibleInvoices] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    loadInvoices();
    loadCustomers();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoiceAPI.getInvoices();
      if (!Array.isArray(response.data)) {
        throw new Error('Expected an array of invoices');
      }
      setInvoices(response.data);
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.error || 'Failed to load invoices';
      setError(errorMessage);
      setInvoices([]);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.getCustomers();
      if (!Array.isArray(response.data)) {
        throw new Error('Expected an array of customers, received: ' + JSON.stringify(response.data));
      }
      setCustomers(response.data);
    } catch (err: any) {
      console.error('Error loading customers:', err);
      const errorMessage = err.message || 'Failed to load customers. Please try again.';
      setError(errorMessage);
      setCustomers([]);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleScroll = () => {
    const table = document.querySelector('.invoice-table-container');
    if (table) {
      const { scrollTop, scrollHeight, clientHeight } = table;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setVisibleInvoices(prev => prev + 10);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewInvoice({
      ...newInvoice,
      [name]: name === 'paid' || name === 'tax' || name === 'year' || name === 'customerId'
        ? parseFloat(value) || 0
        : value,
    });
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedItems = [...newInvoice.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [e.target.name]: e.target.name === 'quantity' || e.target.name === 'price'
        ? parseFloat(e.target.value) || 0
        : e.target.value,
    };
    setNewInvoice({ ...newInvoice, items: updatedItems });
    setErrors(prev => ({
      ...prev,
      [`item_${index}`]: undefined,
      [`quantity_${index}`]: undefined,
      [`price_${index}`]: undefined,
    }));
  };

  const addItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { item: '', description: '', quantity: 0, price: 0 }],
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = newInvoice.items.filter((_, i) => i !== index);
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };

  const calculateSubtotal = () => {
    return newInvoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTotal = (invoice?: InvoiceData) => {
    const targetInvoice = invoice || newInvoice;
    const subtotal = targetInvoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = targetInvoice.tax ? subtotal * (targetInvoice.tax / 100) : 0;
    return subtotal + taxAmount;
  };

  const validateInvoice = (invoice: InvoiceData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!invoice.number.trim()) errors.number = 'Invoice number is required';
    if (!invoice.customerId) errors.customerId = 'Customer is required';
    if (!invoice.date) errors.date = 'Date is required';
    if (!invoice.expireDate) errors.expireDate = 'Expire date is required';
    if (!invoice.year) errors.year = 'Year is required';
    if (!invoice.currency) errors.currency = 'Currency is required';
    if (invoice.items.length === 0) errors.items = 'At least one item is required';
    invoice.items.forEach((item, index) => {
      if (!item.item.trim()) errors[`item_${index}`] = `Item name is required for item ${index + 1}`;
      if (item.quantity <= 0) errors[`quantity_${index}`] = `Quantity must be greater than 0 for item ${index + 1}`;
      if (item.price <= 0) errors[`price_${index}`] = `Price must be greater than 0 for item ${index + 1}`;
    });
    return errors;
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const validationErrors = validateInvoice(newInvoice);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setLoading(false);
        toast({
          title: 'Error',
          description: 'Please correct the form errors',
          variant: 'destructive',
        });
        return;
      }

      const total = calculateTotal();
      const finalStatus = newInvoice.paid >= total ? 'PAID' :
        newInvoice.paid > 0 ? 'PARTIALLY_PAID' :
          newInvoice.status;

      const invoiceToSave = {
        ...newInvoice,
        status: finalStatus,
        year: parseInt(newInvoice.year.toString()),
        paid: parseFloat(newInvoice.paid.toString()),
        tax: parseFloat(newInvoice.tax?.toString() || '0'),
        customerId: parseInt(newInvoice.customerId.toString()),
        items: newInvoice.items.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity.toString()),
          price: parseFloat(item.price.toString()),
        })),
      };

      let response;
      if (editingId) {
        response = await invoiceAPI.updateInvoice(editingId, invoiceToSave);
      } else {
        response = await invoiceAPI.createInvoice(invoiceToSave);
      }

      await loadInvoices();
      setOpen(false);
      setEditingId(null);
      setNewInvoice({
        number: '',
        customerId: 0,
        customerName: '',
        date: new Date().toISOString().split('T')[0],
        expireDate: '',
        year: new Date().getFullYear(),
        currency: 'PKR',
        status: 'DRAFT',
        paid: 0,
        total:0,
        note: '',
        items: [{ item: '', description: '', quantity: 0, price: 0 }],
        createdBy: 'Admin',
        tax: 0,
      });
      setErrors({});
      toast({
        title: 'Success',
        description: editingId ? 'Invoice updated successfully' : 'Invoice created successfully',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to save invoice';
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

  const handleEdit = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoiceAPI.getInvoice(id);
      if (!response.data) {
        throw new Error('Invalid invoice data');
      }
      setNewInvoice({
        ...response.data,
        year: parseInt(response.data.year.toString()),
        paid: parseFloat(response.data.paid.toString()),
        tax: parseFloat(response.data.tax?.toString() || '0'),
        customerId: parseInt(response.data.customerId.toString()),
        items: response.data.items.map(item => ({
          ...item,
          quantity: parseFloat(item.quantity.toString()),
          price: parseFloat(item.price.toString()),
        })),
      });
      setEditingId(id);
      setOpen(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load invoice for editing';
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
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setLoading(true);
      setError(null);
      try {
        await invoiceAPI.deleteInvoice(id);
        await loadInvoices();
        toast({
          title: 'Success',
          description: 'Invoice deleted successfully',
        });
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to delete invoice';
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
    try {
      const response = await invoiceAPI.downloadInvoicesPDF();
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'invoices-report.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  const filteredInvoices = invoices
    .filter(invoice =>
      (customers.find(c => c.id === invoice.customerId)?.name.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, visibleInvoices);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold">Invoice List</h1>
        <div className="flex space-x-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <Button
            variant="outline"
            onClick={loadInvoices}
            className="px-4 py-2"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            className="px-4 py-2"
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setNewInvoice({
                number: '',
                customerId: 0,
                customerName: '',
                date: new Date().toISOString().split('T')[0],
                expireDate: '',
                year: new Date().getFullYear(),
                currency: 'PKR',
                status: 'DRAFT',
                paid: 0,
                total:0,
                note: '',
                items: [{ item: '', description: '', quantity: 0, price: 0 }],
                createdBy: 'Admin',
                tax: 0,
              });
              setEditingId(null);
              setErrors({});
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 min-w-[160px] justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Add New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>
              </DialogHeader>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer</Label>
                    <Select
                      value={newInvoice.customerId.toString()}
                      onValueChange={(value) => handleChange({ target: { name: 'customerId', value } } as any)}
                    >
                      <SelectTrigger className={errors.customerId ? 'border-red-500 bg-red-50' : ''}>
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
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
                    <Label htmlFor="date">Date</Label>
                    <Input
                      name="date"
                      value={newInvoice.date}
                      onChange={handleChange}
                      type="date"
                      className={errors.date ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.date && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.date}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Number</Label>
                    <Input
                      name="number"
                      value={newInvoice.number}
                      onChange={handleChange}
                      type="text"
                      placeholder="INV-001"
                      className={errors.number ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.number && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.number}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      name="year"
                      value={newInvoice.year}
                      onChange={handleChange}
                      type="number"
                      className={errors.year ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.year && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.year}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={newInvoice.currency}
                      onValueChange={(value) => handleChange({ target: { name: 'currency', value } } as any)}
                    >
                      <SelectTrigger className={errors.currency ? 'border-red-500 bg-red-50' : ''}>
                        <SelectValue placeholder="Select Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PKR">Rs (Pakistan Rupee)</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.currency && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.currency}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newInvoice.status}
                      onValueChange={(value) => handleChange({ target: { name: 'status', value } } as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="UNPAID">Unpaid</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                        <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expireDate">Expire Date</Label>
                    <Input
                      name="expireDate"
                      value={newInvoice.expireDate}
                      onChange={handleChange}
                      type="date"
                      className={errors.expireDate ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.expireDate && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.expireDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Note</Label>
                    <Input
                      name="note"
                      value={newInvoice.note}
                      onChange={handleChange}
                      type="text"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Item Description</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </div>
                  <div className="grid grid-cols-12 gap-2 font-medium text-sm">
                    <div className="col-span-5">Item</div>
                    <div className="col-span-3">Quantity</div>
                    <div className="col-span-3">Price</div>
                    <div className="col-span-1"></div>
                  </div>
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input
                          name="item"
                          value={item.item}
                          onChange={e => handleItemChange(index, e)}
                          type="text"
                          placeholder="Item Name"
                          className={errors[`item_${index}`] ? 'border-red-500 bg-red-50' : ''}
                          required
                        />
                        {errors[`item_${index}`] && (
                          <p className="text-red-600 text-sm mt-1 font-medium">{errors[`item_${index}`]}</p>
                        )}
                      </div>
                      <div className="col-span-3">
                        <Input
                          name="quantity"
                          value={item.quantity || ''}
                          onChange={e => handleItemChange(index, e)}
                          type="number"
                          min="0"
                          className={errors[`quantity_${index}`] ? 'border-red-500 bg-red-50' : ''}
                          required
                        />
                        {errors[`quantity_${index}`] && (
                          <p className="text-red-600 text-sm mt-1 font-medium">{errors[`quantity_${index}`]}</p>
                        )}
                      </div>
                      <div className="col-span-3">
                        <Input
                          name="price"
                          value={item.price || ''}
                          onChange={e => handleItemChange(index, e)}
                          type="number"
                          min="0"
                          step="0.01"
                          className={errors[`price_${index}`] ? 'border-red-500 bg-red-50' : ''}
                          required
                        />
                        {errors[`price_${index}`] && (
                          <p className="text-red-600 text-sm mt-1 font-medium">{errors[`price_${index}`]}</p>
                        )}
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={newInvoice.items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {errors.items && (
                    <p className="text-red-600 text-sm mt-1 font-medium">{errors.items}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paid">Paid Amount</Label>
                    <Input
                      name="paid"
                      value={newInvoice.paid || ''}
                      onChange={handleChange}
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax">Tax (%)</Label>
                    <Input
                      name="tax"
                      value={newInvoice.tax || ''}
                      onChange={handleChange}
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="w-full md:w-1/3 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Sub Total:</span>
                      <span>{newInvoice.currency} {calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Tax:</span>
                      <span>{newInvoice.currency} {(calculateSubtotal() * (newInvoice.tax || 0) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>{newInvoice.currency} {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="overflow-x-auto invoice-table-container" onScroll={handleScroll}>
          <table className="min-w-full table-auto text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Number</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Customer</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Date</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Expired Date</th>
                
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Paid</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Status</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Created By</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Grid2x2Plus className="h-12 w-12 mb-2 text-gray-400" />
                      <p className="text-lg font-medium mb-1">No invoices yet</p>
                      <p className="text-sm">Click "Add New Invoice" to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="font-medium text-gray-900">{invoice.number}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">
                        {customers.find(c => c.id === invoice.customerId)?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{invoice.date}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{invoice.expireDate}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{invoice.currency} {invoice.paid.toFixed(2)}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-white-800' :
                          invoice.status === 'DRAFT' ? 'bg-blue-100 text-white-800' :
                        invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        invoice.status === 'OVERDUE' ? 'bg-gray-100 text-white-800' :
                        invoice.status === 'UNPAID' ? 'bg-red-100 text-white-800' :
                      
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{invoice.createdBy}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(invoice.id!)}
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(invoice.id!)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
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

export default Invoices;
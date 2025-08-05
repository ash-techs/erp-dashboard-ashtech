import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Plus, Save, Download, Edit, Trash2, Grid2x2Plus } from 'lucide-react';
import { paymentsAPI } from '../services/payments';
import { customerAPI } from '../services/customers';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: number;
  name: string;
}

interface Payment {
  id: string;
  receiptNumber: string;
  customerId: number;
  client: string;
  amount: number;
  date: string;
  number: string;
  transactionDate: string;
  paymentMode: 'CASH' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CHECK' | 'DIGITAL_WALLET';
  paymentTransaction: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'RECEIVED';
  notes: string;
  createdBy: string;
  companyId?: number | null;
}

interface ValidationErrors {
  receiptNumber?: string;
  customerId?: string;
  amount?: string;
  date?: string;
  number?: string;
  transactionDate?: string;
  paymentMode?: string;
  paymentTransaction?: string;
}

const PaymentsForm = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [newPayment, setNewPayment] = useState<Payment>({
    id: '',
    receiptNumber: '',
    customerId: 0,
    client: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    number: '',
    transactionDate: new Date().toISOString().split('T')[0],
    paymentMode: 'CASH',
    paymentTransaction: '',
    status: 'PENDING',
    notes: '',
    createdBy: 'Admin',
  });
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePayments, setVisiblePayments] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await customerAPI.getCustomers();
        if (!Array.isArray(res.data)) {
          throw new Error('Expected an array of customers, received: ' + JSON.stringify(res.data));
        }
        setCustomers(res.data);
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
    fetchCustomers();
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentsAPI.getPayments();
      if (!Array.isArray(response.data)) {
        throw new Error('Expected an array of payments, received: ' + JSON.stringify(response.data));
      }
      setPayments(response.data);
    } catch (err: any) {
      console.error('Error loading payments:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load payments. Please try again.';
      setError(errorMessage);
      setPayments([]);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    const table = document.querySelector('.payment-table-container');
    if (table) {
      const { scrollTop, scrollHeight, clientHeight } = table;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setVisiblePayments(prev => prev + 10);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { name: string; value: string }
  ) => {
    const { name, value } = 'target' in e ? e.target : e;
    const parsedValue = name === 'amount' || name === 'customerId' ? parseFloat(value) || 0 : value;

    setNewPayment(prev => ({
      ...prev,
      [name]: parsedValue,
    }));

    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validatePayment = (data: Payment): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    if (!data.receiptNumber.trim()) newErrors.receiptNumber = 'Receipt number is required';
    if (!data.customerId) newErrors.customerId = 'Customer is required';
    if (data.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!data.date) newErrors.date = 'Date is required';
    if (!data.number.trim()) newErrors.number = 'Number is required';
    if (!data.transactionDate) newErrors.transactionDate = 'Transaction date is required';
    if (!data.paymentMode) newErrors.paymentMode = 'Payment mode is required';
    if (!data.paymentTransaction.trim()) newErrors.paymentTransaction = 'Payment transaction is required';
    return newErrors;
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const validationErrors = validatePayment(newPayment);
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

      const paymentToSave = {
        ...newPayment,
        customerId: parseInt(newPayment.customerId.toString()),
        amount: parseFloat(newPayment.amount.toString()),
        companyId: newPayment.companyId || null,
      };

      let response;
      if (editingId) {
        response = await paymentsAPI.updatePayment(editingId, paymentToSave);
      } else {
        response = await paymentsAPI.createPayment(paymentToSave);
      }

      await loadPayments();
      setOpen(false);
      setEditingId(null);
      setNewPayment({
        id: '',
        receiptNumber: '',
        customerId: 0,
        client: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        number: '',
        transactionDate: new Date().toISOString().split('T')[0],
        paymentMode: 'CASH',
        paymentTransaction: '',
        status: 'PENDING',
        notes: '',
        createdBy: 'Admin',
      });
      setErrors({});
      toast({
        title: 'Success',
        description: editingId ? 'Payment updated successfully' : 'Payment created successfully',
      });
    } catch (err: any) {
      console.error('Error saving payment:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save payment. Please check your input and try again.';
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

  const handleEdit = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentsAPI.getPayment(id);
      setNewPayment({
        ...response.data,
        customerId: parseInt(response.data.customerId),
        amount: parseFloat(response.data.amount),
      });
      setEditingId(id);
      setOpen(true);
    } catch (err: any) {
      console.error('Error fetching payment for edit:', err);
      const errorMessage = err.response?.data?.error || 'Failed to load payment for editing. Please try again.';
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      setLoading(true);
      setError(null);
      try {
        await paymentsAPI.deletePayment(id);
        await loadPayments();
        toast({
          title: 'Success',
          description: 'Payment deleted successfully',
        });
      } catch (err: any) {
        console.error('Error deleting payment:', err);
        const errorMessage = err.response?.data?.error || 'Failed to delete payment. Please try again.';
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
      const response = await paymentsAPI.downloadPaymentsPDF();
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'payments-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
      });
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      const errorMessage = err.response?.data?.error || 'Failed to download PDF';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const filteredPayments = payments
    .filter(payment =>
      payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paymentMode.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, visiblePayments);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold">Payment List</h1>
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
            onClick={loadPayments}
            className="px-4 py-2"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 min-w-[160px] justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Add New Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Payment' : 'Create New Payment'}</DialogTitle>
              </DialogHeader>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiptNumber">Receipt Number</Label>
                    <Input
                      id="receiptNumber"
                      name="receiptNumber"
                      value={newPayment.receiptNumber}
                      onChange={handleChange}
                      className={errors.receiptNumber ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.receiptNumber && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.receiptNumber}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer</Label>
                    <Select
                      value={newPayment.customerId.toString()}
                      onValueChange={(value) => handleChange({ name: 'customerId', value })}
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
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      value={newPayment.amount}
                      onChange={handleChange}
                      className={errors.amount ? 'border-red-500 bg-red-50' : ''}
                      required
                      min="0"
                      step="0.01"
                    />
                    {errors.amount && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.amount}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={newPayment.date}
                      onChange={handleChange}
                      className={errors.date ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.date && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.date}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Number</Label>
                    <Input
                      id="number"
                      name="number"
                      value={newPayment.number}
                      onChange={handleChange}
                      className={errors.number ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.number && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.number}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transactionDate">Transaction Date</Label>
                    <Input
                      id="transactionDate"
                      name="transactionDate"
                      type="date"
                      value={newPayment.transactionDate}
                      onChange={handleChange}
                      className={errors.transactionDate ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.transactionDate && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.transactionDate}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMode">Payment Mode</Label>
                    <Select
                      value={newPayment.paymentMode}
                      onValueChange={(value) => handleChange({ name: 'paymentMode', value })}
                    >
                      <SelectTrigger className={errors.paymentMode ? 'border-red-500 bg-red-50' : ''}>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="CHECK">Check</SelectItem>
                        <SelectItem value="DIGITAL_WALLET">Digital Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.paymentMode && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.paymentMode}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTransaction">Payment Transaction</Label>
                    <Input
                      id="paymentTransaction"
                      name="paymentTransaction"
                      value={newPayment.paymentTransaction}
                      onChange={handleChange}
                      className={errors.paymentTransaction ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.paymentTransaction && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.paymentTransaction}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    name="notes"
                    value={newPayment.notes}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="overflow-x-auto payment-table-container" onScroll={handleScroll}>
          <table className="min-w-full table-auto text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Receipt Number</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Client</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Amount</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Date</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Number</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Transaction Date</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Payment Mode</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Payment Transaction</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Status</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Grid2x2Plus className="h-12 w-12 mb-2 text-gray-400" />
                      <p className="text-lg font-medium mb-1">No payments yet</p>
                      <p className="text-sm">Click "Add New Payment" to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="font-medium text-gray-900">{payment.receiptNumber}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{payment.client}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">${payment.amount.toFixed(2)}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{payment.date}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{payment.number}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{payment.transactionDate}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{payment.paymentMode}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{payment.paymentTransaction}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        payment.status === 'RECEIVED' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(payment.id)}
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(payment.id)}
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

export default PaymentsForm;
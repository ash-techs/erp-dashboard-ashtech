import React, { useState, useEffect } from 'react';
import { transactionsAPI } from '../services/transactions';
import { companiesAPI } from '../services/companies';
import { Button } from '@/components/ui/button';
import { Save, Edit, Trash2, X, Plus, Search, RefreshCw, DollarSign, Calendar, Briefcase, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  bank: string;
  checkNumber: string;
  companyId: string | null;
  companyName: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  category: string;
  date: string;
  receivedPayment: number;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Company {
  id: string;
  name: string;
}

interface ValidationErrors {
  type?: string;
  amount?: string;
  bank?: string;
  category?: string;
  date?: string;
}

const LightGlassCard = ({ children, className = '', gradient = false }: { children: React.ReactNode; className?: string; gradient?: boolean }) => (
  <div className={`backdrop-blur-xl bg-white/80 border border-gray-200/50 rounded-2xl shadow-lg ${gradient ? 'bg-gradient-to-br from-white/90 to-gray-50/80' : ''} ${className}`}>
    {children}
  </div>
);

const FinanceForm: React.FC = () => {
  const [formData, setFormData] = useState<Transaction>({
    id: '',
    type: 'INCOME',
    amount: 0,
    bank: '',
    checkNumber: '',
    companyId: null,
    companyName: '',
    status: 'PENDING',
    category: '',
    date: new Date().toISOString().split('T')[0],
    receivedPayment: 0,
    description: '',
    createdBy: 'Admin',
    createdAt: '',
    updatedAt: '',
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState<Transaction | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    try {
      const response = await transactionsAPI.getTransactions();
      if (!Array.isArray(response.data)) {
        throw new Error('Expected an array of transactions');
      }
      setTransactions(response.data);
      setApiError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch transactions';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setTransactions([]);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getCompanies();
      if (!Array.isArray(response.data)) {
        throw new Error('Expected an array of companies');
      }
      setCompanies(response.data);
      setApiError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch companies';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setCompanies([]);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await transactionsAPI.getBalance();
      if (typeof response.data.balance !== 'number') {
        throw new Error('Expected a numeric balance');
      }
      setBalance(response.data.balance);
      setApiError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch balance';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setBalance(null);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCompanies();
    fetchBalance();
  }, []);

  const validateForm = (data: Transaction): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    if (!data.type) newErrors.type = 'Type is required';
    if (!data.amount || data.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!data.bank.trim()) newErrors.bank = 'Bank is required';
    if (!data.category.trim()) newErrors.category = 'Category is required';
    if (!data.date) newErrors.date = 'Date is required';
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' || name === 'receivedPayment' ? parseFloat(value) || 0 : name === 'companyId' ? (value === '' ? null : value) : value,
    }));
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editForm) {
      setEditForm({
        ...editForm,
        [name]: name === 'amount' || name === 'receivedPayment' ? parseFloat(value) || 0 : name === 'companyId' ? (value === '' ? null : value) : value,
      });
    }
  };

  const handleAddTransaction = async () => {
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
      const response = await transactionsAPI.createTransaction({
        type: formData.type,
        amount: formData.amount,
        bank: formData.bank,
        checkNumber: formData.checkNumber,
        status: formData.status,
        category: formData.category,
        date: formData.date,
        receivedPayment: formData.receivedPayment,
        description: formData.description,
        createdBy: formData.createdBy,
        companyId: formData.companyId,
      });
      setTransactions([...transactions, response.data]);
      setFormData({
        id: '',
        type: 'INCOME',
        amount: 0,
        bank: '',
        checkNumber: '',
        companyId: null,
        companyName: '',
        status: 'PENDING',
        category: '',
        date: new Date().toISOString().split('T')[0],
        receivedPayment: 0,
        description: '',
        createdBy: 'Admin',
        createdAt: '',
        updatedAt: '',
      });
      setErrors({});
      setShowAddModal(false);
      setApiError(null);
      fetchBalance();
      toast({
        title: 'Success',
        description: 'Transaction added successfully',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create transaction';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditForm({ ...transaction });
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
      const response = await transactionsAPI.updateTransaction(`${editForm.id}`, {
        type: editForm.type,
        amount: editForm.amount,
        bank: editForm.bank,
        checkNumber: editForm.checkNumber,
        status: editForm.status,
        category: editForm.category,
        date: editForm.date,
        receivedPayment: editForm.receivedPayment,
        description: editForm.description,
        createdBy: editForm.createdBy,
        companyId: editForm.companyId,
      });
      setTransactions(transactions.map(txn => txn.id === editForm.id ? response.data : txn));
      setEditingTransaction(null);
      setEditForm(null);
      setErrors({});
      setApiError(null);
      fetchBalance();
      toast({
        title: 'Success',
        description: 'Transaction updated successfully',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update transaction';
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

    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionsAPI.deleteTransaction(`${id}`);
        setTransactions(transactions.filter(txn => txn.id !== id));
        if (editingTransaction?.id === id) {
          setEditingTransaction(null);
          setEditForm(null);
        }
        setApiError(null);
        fetchBalance();
        toast({
          title: 'Success',
          description: 'Transaction deleted successfully',
        });
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to delete transaction';
        setApiError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await transactionsAPI.downloadTransactionssPDF();
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'finance-report.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Success',
        description: 'PDF downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  const filteredTransactions = transactions.filter(txn =>
    txn.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.bank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {apiError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span>{apiError}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600" />
            Transaction Management
          </h2>
          {balance !== null && (
            <div className="text-sm sm:text-base font-medium text-gray-700">
              Balance: <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>${balance.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              fetchTransactions();
              fetchCompanies();
              fetchBalance();
            }}
            variant="outline"
            className="px-4 py-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="px-4 py-2"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
            className="px-4 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredTransactions.map((transaction) => (
          <LightGlassCard
            key={transaction.id}
            className="p-4 sm:p-6 hover:shadow-xl hover:bg-white/90 transition-all duration-300 group relative overflow-hidden"
            gradient
          >
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg ${transaction.type === 'INCOME' ? 'bg-green-500' : 'bg-red-500'}`}
                  >
                    {transaction.type[0]}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-800 font-bold text-base sm:text-lg truncate">{transaction.category}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm truncate">{transaction.companyName || 'No Company'}</p>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3 mb-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 text-xs sm:text-sm truncate flex-1">
                    ${transaction.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 text-xs sm:text-sm truncate flex-1">{transaction.bank}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 text-xs sm:text-sm truncate flex-1">
                    {new Date(transaction.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs sm:text-sm truncate flex-1 ${transaction.status === 'COMPLETED' ? 'text-green-600' : transaction.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'}`}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>
              <div className="pt-3 sm:pt-4 border-t border-gray-200/50 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEdit(transaction);
                  }}
                  className="flex-1 px-2 sm:px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={(e) => handleDelete(transaction.id, e)}
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <LightGlassCard className="p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" gradient>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Add New Transaction</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.type ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="1000.00"
                  step="0.01"
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                <input
                  type="text"
                  name="bank"
                  value={formData.bank}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.bank ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Bank Name"
                />
                {errors.bank && <p className="text-red-500 text-xs mt-1">{errors.bank}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select Category</option>
                  <option value="Sales">Sales</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Payroll">Payroll</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.date ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check Number</label>
                <input
                  type="text"
                  name="checkNumber"
                  value={formData.checkNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received Payment</label>
                <input
                  type="number"
                  name="receivedPayment"
                  value={formData.receivedPayment}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select
                  name="companyId"
                  value={formData.companyId || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">No Company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
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
                onClick={handleAddTransaction}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm"
              >
                Add Transaction
              </button>
            </div>
          </LightGlassCard>
        </div>
      )}

      {editingTransaction && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <LightGlassCard className="p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" gradient>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Edit Transaction</h3>
              <button
                onClick={() => setEditingTransaction(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={editForm.type}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.type ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={editForm.amount}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  step="0.01"
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
                <input
                  type="text"
                  name="bank"
                  value={editForm.bank}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.bank ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.bank && <p className="text-red-500 text-xs mt-1">{errors.bank}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={editForm.category}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select Category</option>
                  <option value="Sales">Sales</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Payroll">Payroll</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={editForm.date}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.date ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check Number</label>
                <input
                  type="text"
                  name="checkNumber"
                  value={editForm.checkNumber}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received Payment</label>
                <input
                  type="number"
                  name="receivedPayment"
                  value={editForm.receivedPayment}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select
                  name="companyId"
                  value={editForm.companyId || ''}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">No Company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => setEditingTransaction(null)}
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

export default FinanceForm;
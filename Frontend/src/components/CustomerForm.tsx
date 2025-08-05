import React, { useState, useEffect } from 'react';
import { customerAPI } from '../services/customers';
import { Button } from '../components/ui/button';
import { Save, Edit, Trash2, Check, X, Plus, Search, Phone, RefreshCw, User, Mail, Briefcase, MapPin, Globe, Download } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { companiesAPI } from '../services/companies';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  companyId: string | null;
  companyName: string;
}

interface Company {
  id: string;
  name: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

const LightGlassCard = ({ children, className = '', gradient = false }: { children: React.ReactNode; className?: string; gradient?: boolean }) => (
  <div className={`backdrop-blur-xl bg-white/80 border border-gray-200/50 rounded-2xl shadow-lg ${gradient ? 'bg-gradient-to-br from-white/90 to-gray-50/80' : ''} ${className}`}>
    {children}
  </div>
);

const CustomerForm: React.FC = () => {
  const [formData, setFormData] = useState<Customer>({
    id: 0,
    name: '',
    email: '',
    phone: '',
    address: '',
    companyId: null,
    companyName: '',
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getCustomers();
      const data = response?.data ?? [];
      setCustomers(Array.isArray(data) ? data : []);
      setApiError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch customers';
      setApiError(errorMessage);
      console.error('Fetch customers error:', err); // Debug log
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getCompanies();
      const data = response?.data ?? [];
      setCompanies(Array.isArray(data) ? data : []);
      setApiError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch companies';
      setApiError(errorMessage);
      console.error('Fetch companies error:', err); // Debug log
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchCompanies();
    console.log('showAddModal:', showAddModal, 'editingCustomer:', editingCustomer); // Debug modal state
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = (data: Customer): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    if (!data.name.trim()) newErrors.name = 'Name is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'Invalid email format';
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'companyId' ? (value === '' ? null : value) : value,
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
        [name]: name === 'companyId' ? (value === '' ? null : value) : value,
      });
    }
  };

  const handleAddCustomer = async () => {
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
      const response = await customerAPI.createCustomer({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        companyId: formData.companyId,
      });
      setCustomers([...customers, response.data]);
      setFormData({
        id: 0,
        name: '',
        email: '',
        phone: '',
        address: '',
        companyId: null,
        companyName: '',
      });
      setErrors({});
      setShowAddModal(false);
      setApiError(null);
      toast({
        title: 'Success',
        description: 'Customer added successfully',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create customer';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({ ...customer });
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
      const response = await customerAPI.updateCustomer(`/${editForm.id}`, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        companyId: editForm.companyId,
      });
      setCustomers(customers.map(cust =>
        cust.id === editForm.id ? response.data : cust
      ));
      setEditingCustomer(null);
      setEditForm(null);
      setErrors({});
      setApiError(null);
      toast({
        title: 'Success',
        description: 'Customer updated successfully',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update customer';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerAPI.deleteCustomer(`/${id}`);
        setCustomers(customers.filter(cust => cust.id !== id));
        if (editingCustomer?.id === id) {
          setEditingCustomer(null);
          setEditForm(null);
        }
        setApiError(null);
        toast({
          title: 'Success',
          description: 'Customer deleted successfully',
        });
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to delete customer';
        setApiError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  
  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {apiError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span>{apiError}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
          <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600" />
          Customer Management
        </h2>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => { fetchCustomers(); fetchCompanies(); }}
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
            Add Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredCustomers.length === 0 ? (
          <p className="text-gray-500 text-center col-span-full">
            No customers found. Try refreshing or adding a new customer.
          </p>
        ) : (
          filteredCustomers.map((customer) => (
            <LightGlassCard key={customer.id} className="p-4 sm:p-6 hover:shadow-xl hover:bg-white/90 transition-all duration-300 group relative overflow-hidden" gradient>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                      {customer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-800 font-bold text-base sm:text-lg truncate">{customer.name}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm truncate">{customer.companyName}</p>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700 text-xs sm:text-sm truncate flex-1" title={customer.email}>
                      {customer.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700 text-xs sm:text-sm truncate flex-1">
                      {customer.phone}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700 text-xs sm:text-sm truncate flex-1" title={customer.address}>
                      {customer.address.split(',')[0]}
                    </span>
                  </div>
                  {customer.companyName && (
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700 text-xs sm:text-sm truncate flex-1">
                        {customer.companyName}
                      </span>
                    </div>
                  )}
                </div>
                <div className="pt-3 sm:pt-4 border-t border-gray-200/50 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEdit(customer);
                    }}
                    className="flex-1 px-2 sm:px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => handleDelete(customer.id, e)}
                    className="flex-1 px-2 sm:px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </LightGlassCard>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <LightGlassCard className="p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" gradient>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Add New Customer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="contact@company.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="+1 555-123-4567"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="123 Business Ave, City, State ZIP"
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
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
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
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
                onClick={handleAddCustomer}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm"
              >
                Add Customer
              </button>
            </div>
          </LightGlassCard>
        </div>
      )}

      {editingCustomer && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <LightGlassCard className="p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" gradient>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Edit Customer</h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
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
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => setEditingCustomer(null)}
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

export default CustomerForm;
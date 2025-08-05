import React, { useState, useEffect } from 'react';
import { companiesAPI } from '@/services/companies';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, RefreshCw, Search, X, Grid2x2Plus, Pencil, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface Company {
  id: string;
  name: string;
  contact: string;
  country: string;
  phone: string;
  email: string;
  website: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
}

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newCompany, setNewCompany] = useState<Omit<Company, 'id'>>({
    name: '',
    contact: '',
    country: '',
    phone: '',
    email: '',
    website: '',
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { toast } = useToast();

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getCompanies();
      if (!Array.isArray(response.data)) {
        throw new Error('Expected an array of companies');
      }
      setCompanies(response.data);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch companies';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setCompanies([]); // Fallback to empty array
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []); // Removed searchTerm dependency

  const validateForm = (data: Omit<Company, 'id'>): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = 'Name is required';
    if (!data.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Invalid email format';
    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCompany(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(newCompany);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: 'Error',
        description: 'Please correct the form errors',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isEditing) {
        const response = await companiesAPI.updateCompany(isEditing, newCompany);
        setCompanies(companies.map(c => c.id === isEditing ? response.data : c));
        toast({
          title: 'Success',
          description: 'Company updated successfully',
        });
      } else {
        const response = await companiesAPI.createCompany(newCompany);
        setCompanies(prev => [...prev, response.data]);
        toast({
          title: 'Success',
          description: 'Company added successfully',
        });
      }
      setIsAddingNew(false);
      setIsEditing(null);
      setNewCompany({
        name: '',
        contact: '',
        country: '',
        phone: '',
        email: '',
        website: '',
      });
      setValidationErrors({});
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to save company';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (company: Company) => {
    setIsEditing(company.id);
    setIsAddingNew(true);
    setNewCompany({
      name: company.name,
      contact: company.contact,
      country: company.country,
      phone: company.phone,
      email: company.email,
      website: company.website,
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await companiesAPI.deleteCompany(`/companies/${id}`);
        setCompanies(companies.filter(c => c.id !== id));
        setError(null);
        toast({
          title: 'Success',
          description: 'Company deleted successfully',
        });
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'Failed to delete company';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setIsEditing(null);
    setNewCompany({
      name: '',
      contact: '',
      country: '',
      phone: '',
      email: '',
      website: '',
    });
    setValidationErrors({});
    setError(null);
  };

  // Client-side filtering for search
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span>{error}</span>
        </div>
      )}

      {isAddingNew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Company' : 'Add New Company'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">* Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newCompany.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.name ? 'border-red-500 bg-red-50' : 'border-border'}`}
                      required
                    />
                    {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Contact Person</label>
                    <input
                      type="text"
                      name="contact"
                      value={newCompany.contact}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={newCompany.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={newCompany.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">* Email</label>
                    <input
                      type="email"
                      name="email"
                      value={newCompany.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${validationErrors.email ? 'border-red-500 bg-red-50' : 'border-border'}`}
                      required
                    />
                    {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={newCompany.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelAdd}
                    className="px-6 py-2 min-w-[100px]"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 min-w-[140px] flex items-center justify-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Company' : 'Add Company'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
          <h1 className="text-xl sm:text-2xl font-bold">Company List</h1>
          <div className="flex space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <Button
              variant="outline"
              onClick={fetchCompanies}
              className="px-4 py-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setIsAddingNew(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 min-w-[160px] justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Company
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-border shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Name</th>
                  <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Contact Person</th>
                  <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Country</th>
                  <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Phone</th>
                  <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Email</th>
                  <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Website</th>
                  <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Grid2x2Plus className="h-12 w-12 mb-2 text-gray-400" />
                        <p className="text-lg font-medium mb-1">No companies yet</p>
                        <p className="text-sm">Click "Add New Company" to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                        <span className="font-medium text-gray-900">{company.name}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                        <span className="text-gray-700">{company.contact}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                        <span className="text-gray-700">{company.country}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                        <span className="text-gray-700">{company.phone}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                        <span className="text-gray-700">{company.email}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {company.website}
                          </a>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(company)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(company.id)}
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
    </div>
  );
};

export default Companies;
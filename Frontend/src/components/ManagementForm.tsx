import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Edit, Trash2, Check, X, Plus, Search, RefreshCw, User, Mail, Briefcase, Calendar, DollarSign, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { employeesAPI } from '../services/employees';

interface Employee {
  id: number;
  name: string;
  employeeId: string;
  department: string;
  position: string;
  salary: number;
  hireDate: string;
  email: string;
  website: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

interface ValidationErrors {
  name?: string;
  employeeId?: string;
  department?: string;
  position?: string;
  salary?: string;
  hireDate?: string;
  email?: string;
  website?: string;
}

const LightGlassCard = ({ children, className = '', gradient = false }: { children: React.ReactNode; className?: string; gradient?: boolean }) => (
  <div className={`backdrop-blur-xl bg-white/80 border border-gray-200/50 rounded-2xl shadow-lg ${gradient ? 'bg-gradient-to-br from-white/90 to-gray-50/80' : ''} ${className}`}>
    {children}
  </div>
);

const ManagementForm: React.FC = () => {
  const [formData, setFormData] = useState<Employee>({
    id: 0,
    name: '',
    employeeId: '',
    department: '',
    position: '',
    salary: 0,
    hireDate: '',
    email: '',
    website: '',
    status: 'Active',
    createdAt: '',
    updatedAt: '',
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesAPI.getEmployees();
      if (!Array.isArray(response.data)) {
        throw new Error('Expected an array of employees');
      }
      setEmployees(response.data);
      setApiError(null);
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.error || 'Failed to fetch employees';
      setApiError(errorMessage);
      setEmployees([]); // Reset to empty array on error
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const validateForm = (data: Employee): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    if (!data.name.trim()) newErrors.name = 'Name is required';
    if (!data.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!data.department.trim()) newErrors.department = 'Department is required';
    if (!data.position.trim()) newErrors.position = 'Position is required';
    if (!data.salary || data.salary <= 0) newErrors.salary = 'Enter valid salary';
    if (!data.hireDate) newErrors.hireDate = 'Hire date is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'Invalid email format';
    if (data.website && !/^https?:\/\/.+\..+/.test(data.website)) newErrors.website = 'Invalid website URL';
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'salary' ? Number(value) : value,
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
        [name]: name === 'salary' ? Number(value) : value,
      });
      if (errors[name as keyof ValidationErrors]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
      }
    }
  };

  const handleAddEmployee = async () => {
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
      const response = await employeesAPI.createEmployee({
        name: formData.name,
        employeeId: formData.employeeId,
        department: formData.department,
        position: formData.position,
        salary: formData.salary,
        hireDate: formData.hireDate,
        email: formData.email,
        website: formData.website,
        status: formData.status,
      });
      setEmployees([...employees, response.data]);
      setFormData({
        id: 0,
        name: '',
        employeeId: '',
        department: '',
        position: '',
        salary: 0,
        hireDate: '',
        email: '',
        website: '',
        status: 'Active',
        createdAt: '',
        updatedAt: '',
      });
      setErrors({});
      setShowAddModal(false);
      setApiError(null);
      toast({
        title: 'Success',
        description: 'Employee created successfully',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create employee';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditForm({ ...employee });
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
      const response = await employeesAPI.updateEmployee(`/${editForm.id}`, {
        name: editForm.name,
        employeeId: editForm.employeeId,
        department: editForm.department,
        position: editForm.position,
        salary: editForm.salary,
        hireDate: editForm.hireDate,
        email: editForm.email,
        website: editForm.website,
        status: editForm.status,
      });
      setEmployees(employees.map(emp => emp.id === editForm.id ? response.data : emp));
      setEditingEmployee(null);
      setEditForm(null);
      setErrors({});
      setApiError(null);
      toast({
        title: 'Success',
        description: 'Employee updated successfully',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to update employee';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (employee: Employee, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    try {
      await employeesAPI.deleteEmployee(`${employeeToDelete.id}`);
      setEmployees(employees.filter(emp => emp.id !== employeeToDelete.id));
      if (editingEmployee?.id === employeeToDelete.id) {
        setEditingEmployee(null);
        setEditForm(null);
      }
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      setApiError(null);
      toast({
        title: 'Success',
        description: 'Employee deleted successfully',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete employee';
      setApiError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleStatusToggle = (id: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const employee = employees.find(emp => emp.id === id);
    if (employee) {
      setEditForm({
        ...employee,
        status: employee.status === 'Active' ? 'Inactive' : 'Active',
      });
      setEditingEmployee(employee);
      handleSaveEdit();
    }
  };

  const handleView = (employee: Employee, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setViewingEmployee(employee);
  };

  const getDepartmentColor = (department: string) => {
    switch (department.toLowerCase()) {
      case 'it':
        return 'text-purple-700 bg-purple-100 border border-purple-200 hover:bg-purple-200';
      case 'hr':
        return 'text-blue-700 bg-blue-100 border border-blue-200 hover:bg-blue-200';
      case 'finance':
        return 'text-green-700 bg-green-100 border border-green-200 hover:bg-green-200';
      case 'marketing':
        return 'text-pink-700 bg-pink-100 border border-pink-200 hover:bg-pink-200';
      case 'sales':
        return 'text-orange-700 bg-orange-100 border border-orange-200 hover:bg-orange-200';
      default:
        return 'text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active'
      ? 'text-green-700 bg-green-100 border border-green-200 hover:bg-green-200'
      : 'text-red-700 bg-red-100 border border-red-200 hover:bg-red-200';
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {apiError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span>{apiError}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
          <User className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600" />
          Employee Management
        </h2>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={fetchEmployees}
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
            Add Employee
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredEmployees.map((employee) => (
          <LightGlassCard key={employee.id} className="p-4 sm:p-6 hover:shadow-xl hover:bg-white/90 transition-all duration-300 group relative overflow-hidden" gradient>
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-sm ${employee.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-800 font-bold text-base sm:text-lg truncate">{employee.name}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm truncate">{employee.employeeId}</p>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 text-xs sm:text-sm truncate flex-1">
                    {employee.position}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 text-xs sm:text-sm truncate flex-1" title={employee.email}>
                    {employee.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 text-xs sm:text-sm">Department:</span>
                  </div>
                  <span className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-full transition-all duration-200 ${getDepartmentColor(employee.department)}`}>
                    {employee.department}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 text-xs sm:text-sm">Salary:</span>
                  </div>
                  <span className="text-gray-700 text-xs sm:text-sm">
                    ${employee.salary.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 text-xs sm:text-sm">Hire Date:</span>
                  </div>
                  <span className="text-gray-700 text-xs sm:text-sm">
                    {new Date(employee.hireDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-xs sm:text-sm">Status:</span>
                  <button
                    onClick={(e) => handleStatusToggle(employee.id, e)}
                    className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-full transition-all duration-200 hover:scale-105 cursor-pointer ${getStatusColor(employee.status)}`}
                    title="Click to toggle status"
                  >
                    {employee.status}
                  </button>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-gray-200/50 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEdit(employee);
                  }}
                  className="flex-1 px-2 sm:px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={(e) => handleDeleteClick(employee, e)}
                  className="flex-1 px-2 sm:px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={(e) => handleView(employee, e)}
                  className="px-2 sm:px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
                  title={`View ${employee.name}'s details`}
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </LightGlassCard>
        ))}
      </div>

      {viewingEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <LightGlassCard className="p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" gradient>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-600" />
                Employee Details
              </h3>
              <button
                onClick={() => setViewingEmployee(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex items-center space-x-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {viewingEmployee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                    viewingEmployee.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-800">{viewingEmployee.name}</h4>
                <p className="text-gray-600">{viewingEmployee.employeeId}</p>
                <span
                  className={`inline-block text-xs font-medium px-2 py-1 rounded-full mt-1 ${getStatusColor(
                    viewingEmployee.status
                  )}`}
                >
                  {viewingEmployee.status}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Personal Information</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="text-gray-800 font-medium">{viewingEmployee.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employee ID:</span>
                    <span className="text-gray-800 font-medium">{viewingEmployee.employeeId}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Employment Details</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="text-gray-800 font-medium">{viewingEmployee.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Position:</span>
                    <span className="text-gray-800 font-medium">{viewingEmployee.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salary:</span>
                    <span className="text-gray-800 font-medium">${viewingEmployee.salary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hire Date:</span>
                    <span className="text-gray-800 font-medium">{new Date(viewingEmployee.hireDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Contact Information</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-800 font-medium break-all">{viewingEmployee.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Website:</span>
                    <span className="text-gray-800 font-medium">{viewingEmployee.website || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Check className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Account Settings</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(viewingEmployee.status)}`}
                    >
                      {viewingEmployee.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-800 font-medium">{new Date(viewingEmployee.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span className="text-gray-800 font-medium">{new Date(viewingEmployee.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewingEmployee(null)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm"
              >
                Close
              </button>
            </div>
          </LightGlassCard>
        </div>
      )}

      {showDeleteModal && employeeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <LightGlassCard className="p-4 sm:p-6 w-full max-w-sm sm:max-w-md" gradient>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Delete Employee</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                Are you sure you want to delete <strong>{employeeToDelete.name}</strong>? This will permanently
                remove their account and all associated data.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setEmployeeToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                Delete Employee
              </button>
            </div>
          </LightGlassCard>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <LightGlassCard className="p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" gradient>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Add New Employee</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.employeeId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="EMP-001"
                />
                {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.department ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select Department</option>
                  <option>IT</option>
                  <option>HR</option>
                  <option>Finance</option>
                  <option>Marketing</option>
                  <option>Sales</option>
                </select>
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.position ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Manager"
                />
                {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary *</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.salary ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="50000"
                />
                {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date *</label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.hireDate ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.hireDate && <p className="text-red-500 text-xs mt-1">{errors.hireDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="john@company.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.website ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="https://company.com"
                />
                {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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
                onClick={handleAddEmployee}
                disabled={!formData.name || !formData.employeeId || !formData.department || !formData.position || !formData.salary || !formData.hireDate || !formData.email}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Employee
              </button>
            </div>
          </LightGlassCard>
        </div>
      )}

      {editingEmployee && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <LightGlassCard className="p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" gradient>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Edit Employee</h3>
              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setEditForm(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                <input
                  type="text"
                  name="employeeId"
                  value={editForm.employeeId}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.employeeId ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.employeeId && <p className="text-red-500 text-xs mt-1">{errors.employeeId}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select
                  name="department"
                  value={editForm.department}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.department ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select Department</option>
                  <option>IT</option>
                  <option>HR</option>
                  <option>Finance</option>
                  <option>Marketing</option>
                  <option>Sales</option>
                </select>
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                <input
                  type="text"
                  name="position"
                  value={editForm.position}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.position ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary *</label>
                <input
                  type="number"
                  name="salary"
                  value={editForm.salary}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.salary ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date *</label>
                <input
                  type="date"
                  name="hireDate"
                  value={editForm.hireDate}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.hireDate ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.hireDate && <p className="text-red-500 text-xs mt-1">{errors.hireDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="text"
                  name="website"
                  value={editForm.website}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${errors.website ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="https://company.com"
                />
                {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setEditForm(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editForm.name || !editForm.employeeId || !editForm.department || !editForm.position || !editForm.salary || !editForm.hireDate || !editForm.email}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Employee
              </button>
            </div>
          </LightGlassCard>
        </div>
      )}
    </div>
  );
};

export default ManagementForm;
import React, { useState, useEffect } from 'react';
import { Users, Plus, Eye, Edit, Trash2, User, Mail, Key, Shield, X, Search, RefreshCw } from 'lucide-react';
import { userApi } from '../services/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FormUser extends User {
  password?: string;
}

interface ValidationErrors {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
}

// Light theme Glass Card component
const LightGlassCard = ({ children, className = '', gradient = false }: { children: React.ReactNode; className?: string; gradient?: boolean }) => (
  <div
    className={`backdrop-blur-xl bg-white/80 border border-gray-200/50 rounded-2xl shadow-lg ${gradient ? 'bg-gradient-to-br from-white/90 to-gray-50/80' : ''
      } ${className}`}
  >
    {children}
  </div>
);

// User Management Component
const UserManagementForm: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<FormUser>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { toast } = useToast();

  const [addForm, setAddForm] = useState<FormUser>({
    id: 0,
    name: '',
    username: '',
    email: '',
    role: 'Employee',
    status: 'Active',
    password: '',
  });

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.getUsers();
      if (!Array.isArray(response.data)) {
        throw new Error('Expected an array of users, received: ' + JSON.stringify(response.data));
      }
      const usersWithAvatars = response.data.map((user: User) => ({
        ...user,
        avatar: generateAvatar(user.name),
      }));
      setUsers(usersWithAvatars);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      const errorMessage = err.message || 'Failed to fetch users';
      setError(errorMessage);
      setUsers([]);
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
    fetchUsers();
  }, []);

  const generateAvatar = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const validateForm = (data: FormUser): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    if (!data.name.trim()) newErrors.name = 'Name is required';
    if (!data.username.trim()) newErrors.username = 'Username is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'Invalid email format';
    if (!data.password?.trim()) newErrors.password = 'Password is required';
    else if (data.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    return newErrors;
  };

  const validateEditForm = (data: Partial<FormUser>): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    if (!data.name?.trim()) newErrors.name = 'Name is required';
    if (!data.username?.trim()) newErrors.username = 'Username is required';
    if (!data.email?.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'Invalid email format';
    if (data.password && data.password.length > 0 && data.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    return newErrors;
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ ...user, password: '' });
    setErrors({});
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    const validationErrors = validateEditForm(editForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: 'Error',
        description: 'Please correct the form errors',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updateData = { ...editForm };
      if (!updateData.password) {
        delete updateData.password;
      }
      const updatedUser = await userApi.updateUser(`${editingUser.id}`, updateData);
      setUsers(
        users.map((user) =>
          user.id === editingUser.id ? { ...updatedUser.data, avatar: generateAvatar(updatedUser.data.name) } : user
        )
      );
      setEditingUser(null);
      setEditForm({});
      setErrors({});
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    } catch (err: any) {
      console.error('Error updating user:', err);
      const errorMessage = err.message || 'Failed to update user';
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

  const handleDeleteClick = (user: User, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setLoading(true);
    setError(null);
    try {
      await userApi.deleteUser(`${userToDelete.id}`);
      setUsers(users.filter((user) => user.id !== userToDelete.id));
      if (editingUser?.id === userToDelete.id) {
        setEditingUser(null);
        setEditForm({});
      }
      setShowDeleteModal(false);
      setUserToDelete(null);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    } catch (err: any) {
      console.error('Error deleting user:', err);
      const errorMessage = err.message || 'Failed to delete user';
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

  const handleStatusToggle = async (userId: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setEditingUser(user);
    setEditForm({
      ...user,
      status: user.status === 'Active' ? 'Inactive' : 'Active',
      password: '',
    });
    await handleSaveEdit();
  };

  const handleAddUser = async () => {
    const validationErrors = validateForm(addForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: 'Error',
        description: 'Please correct the form errors',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newUser = await userApi.createUser(addForm);
      setUsers([...users, { ...newUser.data, avatar: generateAvatar(newUser.data.name) }]);
      setShowAddModal(false);
      setAddForm({
        id: 0,
        name: '',
        username: '',
        email: '',
        role: 'Employee',
        status: 'Active',
        password: '',
      });
      setErrors({});
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    } catch (err: any) {
      console.error('Error creating user:', err);
      const errorMessage = err.message || 'Failed to create user';
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

  const handleView = (user: User, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setViewingUser(user);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'text-purple-700 bg-purple-100 border border-purple-200 hover:bg-purple-200';
      case 'hr':
        return 'text-yellow-700 bg-yellow-100 border border-yellow-200 hover:bg-yellow-200';
      case 'finance':
        return 'text-red-700 bg-red-100 border border-red-200 hover:bg-red-200';
      case 'sales':
        return 'text-blue-700 bg-blue-100 border border-blue-200 hover:bg-blue-200';
      case 'employee':
        return 'text-green-700 bg-green-100 border border-green-200 hover:bg-green-200';
      default:
        return 'text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active'
      ? 'text-green-700 bg-green-100 border border-green-200 hover:bg-green-200'
      : 'text-red-700 bg-red-100 border border-red-200 hover:bg-red-200';
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span>{error}</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
          <Users className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600" />
          User Management
        </h2>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
          </div>
          <Button onClick={fetchUsers} variant="outline" className="px-4 py-2" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">
            <div className="flex flex-col items-center">
              <Users className="h-12 w-12 mb-2 text-gray-400" />
              <p className="text-lg font-medium mb-1">No users found</p>
              <p className="text-sm">Click "Add User" to get started</p>
            </div>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <LightGlassCard
              key={user.id}
              className="p-4 sm:p-6 hover:shadow-xl hover:bg-white/90 transition-all duration-300 group relative overflow-hidden"
              gradient
            >
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                      {user.avatar || generateAvatar(user.name)}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-sm ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                    ></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-800 font-bold text-base sm:text-lg truncate">{user.name}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm truncate">@{user.username}</p>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700 text-xs sm:text-sm truncate flex-1" title={user.email}>
                      {user.email}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600 text-xs sm:text-sm">Role:</span>
                    </div>
                    <span
                      className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-full transition-all duration-200 ${getRoleColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-xs sm:text-sm">Status:</span>
                    <button
                      onClick={(e) => handleStatusToggle(user.id, e)}
                      className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-full transition-all duration-200 hover:scale-105 cursor-pointer ${getStatusColor(
                        user.status
                      )}`}
                      title="Click to toggle status"
                    >
                      {user.status}
                    </button>
                  </div>
                </div>
                <div className="pt-3 sm:pt-4 border-t border-gray-200/50 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">

                  <Button
                  onClick={() => handleEdit(user)}
                    className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Edit</span>
                  </Button>

                  <Button
                    onClick={(e) => handleDeleteClick(user, e)}
                    className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 text-xs sm:text-sm font-medium flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Delete</span>
                  </Button>
                  <Button
                    onClick={(e) => handleView(user, e)}
                    className="bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center"
                    title={`View ${user.name}'s details`}
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </LightGlassCard>
          ))
        )}
      </div>
      {viewingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <LightGlassCard className="p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" gradient>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-600" />
                User Details
              </h3>
              <Button
                onClick={() => setViewingUser(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
                variant="ghost"
              >
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            </div>
            <div className="flex items-center space-x-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {viewingUser.avatar || generateAvatar(viewingUser.name)}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${viewingUser.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                ></div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-800">{viewingUser.name}</h4>
                <p className="text-gray-600">@{viewingUser.username}</p>
                <span
                  className={`inline-block text-xs font-medium px-2 py-1 rounded-full mt-1 ${getStatusColor(
                    viewingUser.status
                  )}`}
                >
                  {viewingUser.status}
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
                    <span className="text-gray-800 font-medium">{viewingUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">User ID:</span>
                    <span className="text-gray-800 font-medium">#{viewingUser.id}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Key className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Account Credentials</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Username:</span>
                    <span className="text-gray-800 font-medium">@{viewingUser.username}</span>
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
                    <span className="text-gray-800 font-medium break-all">{viewingUser.email}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Account Settings</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Role:</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getRoleColor(viewingUser.role)}`}
                    >
                      {viewingUser.role}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(
                        viewingUser.status
                      )}`}
                    >
                      {viewingUser.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-800 font-medium">
                      {new Date(viewingUser.createdAt || '').toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span className="text-gray-800 font-medium">
                      {new Date(viewingUser.updatedAt || '').toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setViewingUser(null)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 text-sm"
              >
                Close
              </Button>
            </div>
          </LightGlassCard>
        </div>
      )}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <LightGlassCard className="p-4 sm:p-6 w-full max-w-sm sm:max-w-md" gradient>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Delete User</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                Are you sure you want to delete <strong>{userToDelete.name}</strong>? This will permanently
                remove their account and all associated data.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium"
                disabled={loading}
              >
                Delete User
              </Button>
            </div>
          </LightGlassCard>
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <LightGlassCard className="p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto" gradient>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Add New User</h3>
              <Button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
                variant="ghost"
              >
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => {
                    setAddForm({ ...addForm, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  className={errors.name ? 'border-red-500 bg-red-50' : ''}
                  placeholder="Enter full name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  type="text"
                  value={addForm.username}
                  onChange={(e) => {
                    setAddForm({ ...addForm, username: e.target.value });
                    if (errors.username) setErrors({ ...errors, username: undefined });
                  }}
                  className={errors.username ? 'border-red-500 bg-red-50' : ''}
                  placeholder="Enter username"
                />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => {
                    setAddForm({ ...addForm, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  className={errors.password ? 'border-red-500 bg-red-50' : ''}
                  placeholder="Enter password"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => {
                    setAddForm({ ...addForm, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={errors.email ? 'border-red-500 bg-red-50' : ''}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={addForm.role}
                  onValueChange={(value) => setAddForm({ ...addForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={addForm.status}
                  onValueChange={(value) => setAddForm({ ...addForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={loading || !addForm.name || !addForm.username || !addForm.password || !addForm.email}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add User
              </Button>
            </div>
          </LightGlassCard>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
        <LightGlassCard className="p-3 sm:p-4 text-center" gradient>
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{users.length}</div>
          <div className="text-xs sm:text-sm text-gray-600">Total Users</div>
        </LightGlassCard>
        <LightGlassCard className="p-3 sm:p-4 text-center" gradient>
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {users.filter((u) => u.status === 'Active').length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Active Users</div>
        </LightGlassCard>
        <LightGlassCard className="p-3 sm:p-4 text-center" gradient>
          <div className="text-xl sm:text-2xl font-bold text-purple-600">
            {users.filter((u) => u.role === 'Admin').length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Admins</div>
        </LightGlassCard>
        <LightGlassCard className="p-3 sm:p-4 text-center" gradient>
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">
            {users.filter((u) => u.role === 'HR').length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">HR</div>
        </LightGlassCard>
        <LightGlassCard className="p-3 sm:p-4 text-center" gradient>
          <div className="text-xl sm:text-2xl font-bold text-red-600">
            {users.filter((u) => u.role === 'Finance').length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Finance</div>
        </LightGlassCard>
        <LightGlassCard className="p-3 sm:p-4 text-center" gradient>
          <div className="text-xl sm:text-2xl font-bold text-blue-600">
            {users.filter((u) => u.role === 'Sales').length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Sales</div>
        </LightGlassCard>
        <LightGlassCard className="p-3 sm:p-4 text-center" gradient>
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {users.filter((u) => u.role === 'Employee').length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Employee</div>
        </LightGlassCard>
      </div>
    </div>
  );
};

export default UserManagementForm;
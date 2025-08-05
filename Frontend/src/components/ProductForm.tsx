import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, Plus, Trash2, Pencil, Search, Download, RefreshCw, Grid2x2Plus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { productAPI } from '../services/products';
import { useToast } from '@/hooks/use-toast';

interface ProductData {
  id?: number;
  sku: string;
  image?: string | File;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

interface ValidationErrors {
  sku?: string;
  name?: string;
  price?: string;
  quantity?: string;
  image?: string;
  description?: string;
}

const ProductForm = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleProducts, setVisibleProducts] = useState(10);
const [formData, setFormData] = useState({
  sku: '',
  name: '',
  price: 0,
  quantity: 0,
  description: '',
  image: null,
});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productAPI.getProducts();
      if (!Array.isArray(response.data)) {
        throw new Error('Expected an array of products, received: ' + JSON.stringify(response.data));
      }
      setProducts(response.data);
    } catch (err: any) {
      console.error('Error loading products:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load products. Please try again.';
      setError(errorMessage);
      setProducts([]);
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
    const table = document.querySelector('.product-table-container');
    if (table) {
      const { scrollTop, scrollHeight, clientHeight } = table;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setVisibleProducts(prev => prev + 10);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' || name === 'quantity' ? parseFloat(value) || 0 : value,
    });
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Please select a valid image file.' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image file size must be less than 5MB.' }));
        return;
      }
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, image: undefined }));
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: undefined });
    setImagePreview(null);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setErrors(prev => ({ ...prev, image: undefined }));
  };

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      price: 0,
      quantity: 0,
      description: '',
      image: undefined,
    });
    setEditingId(null);
    setImagePreview(null);
    setErrors({});
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const validateProduct = (data: ProductData): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    if (!data.sku) newErrors.sku = 'SKU is required';
    if (!data.name) newErrors.name = 'Product name is required';
    if (data.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (data.quantity < 0) newErrors.quantity = 'Quantity cannot be negative';
    if (data.description && data.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }
    return newErrors;
  };

  const handleAddOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validationErrors = validateProduct(formData);
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

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('sku', formData.sku);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('price', (formData.price ?? 0).toString());
      formDataToSend.append('quantity', (formData.quantity ?? 0).toString());

      if (formData.description) formDataToSend.append('description', formData.description);
      if (formData.image instanceof File) formDataToSend.append('image', formData.image);

      if (editingId) {
        await productAPI.updateProduct(editingId, formDataToSend);
        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
      } else {
        await productAPI.createProduct(formDataToSend);
        toast({
          title: 'Success',
          description: 'Product created successfully',
        });
      }

      await loadProducts();
      resetForm();
      setIsDialogOpen(false);
    } catch (err: any) {
      console.error('Error saving product:', err);
      const errorMessage = err.response?.data?.error || 'Failed to save product. Please check your input and try again.';
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
      const response = await productAPI.getProduct(id);
      const productData = {
        ...response.data,
        price: parseFloat(response.data.price),
        quantity: parseInt(response.data.quantity),
      };
      setFormData(productData);
      setEditingId(id);
      setImagePreview(productData.image || null);
      setIsDialogOpen(true);
    } catch (err: any) {
      console.error('Error fetching product for edit:', err);
      const errorMessage = err.response?.data?.error || 'Failed to load product for editing. Please try again.';
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
    if (window.confirm('Are you sure you want to delete this product?')) {
      setLoading(true);
      setError(null);
      try {
        await productAPI.deleteProduct(id);
        await loadProducts();
        toast({
          title: 'Success',
          description: 'Product deleted successfully',
        });
      } catch (err: any) {
        console.error('Error deleting product:', err);
        const errorMessage = err.response?.data?.error || 'Failed to delete product. Please try again.';
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

  const filteredProducts = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, visibleProducts);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold">Product List</h1>
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
          <Button
            variant="outline"
            onClick={loadProducts}
            className="px-4 py-2"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 min-w-[160px] justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddOrUpdateProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">Product Name</Label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={errors.name ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">SKU</Label>
                    <Input
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className={errors.sku ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.sku && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.sku}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium mb-2">Price</Label>
                    <Input
                      name="price"
                      value={formData.price || ''}
                      onChange={handleInputChange}
                      type="number"
                      step="0.01"
                      min="0"
                      className={errors.price ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.price && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.price}</p>
                    )}
                  </div>
                  <div>
                    <Label className="block text-sm font-medium mb-2">Quantity</Label>
                    <Input
                      name="quantity"
                      value={formData.quantity || ''}
                      onChange={handleInputChange}
                      type="number"
                      min="0"
                      className={errors.quantity ? 'border-red-500 bg-red-50' : ''}
                      required
                    />
                    {errors.quantity && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.quantity}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-2">Product Image</Label>
                  <div className="space-y-4">
                    {imagePreview && (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center space-x-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {imagePreview ? 'Change Image' : 'Upload Image'}
                      </label>
                      <span className="text-sm text-gray-500">Max 5MB, JPG/PNG/GIF</span>
                    </div>
                    {errors.image && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{errors.image}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-2">Description</Label>
                  <Textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className={errors.description ? 'border-red-500 bg-red-50' : ''}
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1 font-medium">{errors.description}</p>
                  )}
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : (editingId ? 'Update' : 'Add') + ' Product'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {error && !isDialogOpen && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="overflow-x-auto product-table-container" onScroll={handleScroll}>
          <table className="min-w-full table-auto text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Image</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Name</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">SKU</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Price</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Quantity</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Description</th>
                <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Grid2x2Plus className="h-12 w-12 mb-2 text-gray-400" />
                      <p className="text-lg font-medium mb-1">No products yet</p>
                      <p className="text-sm">Click "Add Product" to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      {product.image && typeof product.image === 'string' ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://via.placeholder.com/48';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{product.sku || '—'}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">${product.price.toFixed(2)}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700">{product.quantity}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <span className="text-gray-700 truncate block max-w-xs">{product.description || 'N/A'}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product.id!)}
                          disabled={loading}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(product.id!)}
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

export default ProductForm;
import api from './api';


// Product API functions 
export const productAPI = {
  getProducts: () => api.get('api/products'),
  getProduct: (id) => api.get(`api/products/${id}`),
  createProduct: (productData) => {
    const formData = new FormData();
    formData.append('sku', productData.sku);
    formData.append('name', productData.name);
    
      formData.append('price', (productData.price ?? 0).toString());
      formData.append('quantity', (productData.quantity ?? 0).toString());
    
    if (productData.description) {
      formData.append('description', productData.description);
    }
    
    if (productData.image && productData.image instanceof File) {
      formData.append('image', productData.image);
    }
    
    return api.post('api/products/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  updateProduct: (id, productData) => {
    const formData = new FormData();
 
      formData.append('sku', productData.sku);
      formData.append('name', productData.name);
      formData.append('price', (productData.price ?? 0).toString());
      formData.append('quantity', (productData.quantity ?? 0).toString());
        formData.append('description', productData.description);
    
    if (productData.image && productData.image instanceof File) {
      formData.append('image', productData.image);
    }
    
    return api.put(`api/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  deleteProduct: (id) => api.delete(`api/products/${id}`),
};


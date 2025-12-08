import { useState } from 'react';
import { Plus, Edit, Trash2, Star, Package, TrendingUp } from 'lucide-react';
import { Product, Seller } from '../types';

interface SellerDashboardProps {
  seller: Seller;
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'sellerId' | 'sellerName' | 'sellerRating' | 'reviews' | 'averageRating'>) => void;
  onDeleteProduct: (productId: string) => void;
}

export function SellerDashboard({ seller, products, onAddProduct, onDeleteProduct }: SellerDashboardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    stock: '',
  });

  const sellerProducts = products.filter(p => p.sellerId === seller.id);
  const totalRevenue = sellerProducts.reduce((sum, p) => sum + (p.price * (30 - p.stock)), 0);
  const totalSold = sellerProducts.reduce((sum, p) => sum + (30 - p.stock), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddProduct({
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      image: formData.image,
      stock: parseInt(formData.stock),
    });
    setFormData({ name: '', description: '', price: '', category: '', image: '', stock: '' });
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">{seller.storeName}</h1>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-gray-700">{seller.rating.toFixed(1)} rating</span>
            <span className="text-gray-500">({seller.totalReviews} reviews)</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Products</p>
                <p className="text-3xl text-gray-900">{sellerProducts.length}</p>
              </div>
              <Package className="w-12 h-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Items Sold</p>
                <p className="text-3xl text-gray-900">{totalSold}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl text-gray-900">${totalRevenue.toFixed(2)}</p>
              </div>
              <Star className="w-12 h-12 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl text-gray-900">My Products</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>

          {/* Add Product Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg text-gray-900 mb-4">Add New Product</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Stock</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">Image URL</label>
                <input
                  type="text"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 text-gray-700">Stock</th>
                  <th className="text-left py-3 px-4 text-gray-700">Rating</th>
                  <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellerProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <span className="text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{product.category}</td>
                    <td className="py-3 px-4 text-gray-900">${product.price}</td>
                    <td className="py-3 px-4 text-gray-700">{product.stock}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-gray-700">
                          {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sellerProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No products yet. Add your first product to get started!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

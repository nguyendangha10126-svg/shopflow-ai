import React, { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiClientError } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import MoneyText from '../components/ui/MoneyText';
import { useToast } from '../components/ui/Toast';

interface ProductVariant {
  id: string;
  sku: string;
  variant_name: string;
  size?: string;
  color?: string;
  price_vnd: number;
  stock: number;
  low_stock_threshold: number;
}

interface Product {
  id: string;
  name: string;
  category?: string;
  description?: string;
  variants: ProductVariant[];
  created_at: string;
}

export const ProductsPage: React.FC = () => {
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modal State Thêm Sản Phẩm
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Thời trang nữ');
  const [newVariants, setNewVariants] = useState<
    Array<{
      sku: string;
      variant_name: string;
      size: string;
      color: string;
      price_vnd: number;
      stock: number;
    }>
  >([
    { sku: '', variant_name: 'Mặc định (Size S)', size: 'S', color: 'Đen', price_vnd: 200000, stock: 10 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await apiClient.get<{ data: { items: Product[] } }>('/products', {
        params: {
          search: searchTerm || undefined,
          low_stock: onlyLowStock ? 'true' : undefined,
        },
      });
      setProducts(response.data.items);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể tải danh sách sản phẩm');
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, onlyLowStock]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddVariantRow = () => {
    setNewVariants((prev) => [
      ...prev,
      {
        sku: '',
        variant_name: `Biến thể mới (Size M)`,
        size: 'M',
        color: 'Trắng',
        price_vnd: 200000,
        stock: 10,
      },
    ]);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Kiểm tra SKU không rỗng
    for (const v of newVariants) {
      if (!v.sku.trim()) {
        setFormError('Mã SKU biến thể không được để trống');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/products', {
        name: newProdName,
        category: newProdCategory,
        variants: newVariants,
      });

      showToast({
        type: 'success',
        message: `Đã thêm sản phẩm "${newProdName}" thành công!`,
      });

      setIsModalOpen(false);
      setNewProdName('');
      setNewVariants([
        { sku: '', variant_name: 'Mặc định (Size S)', size: 'S', color: 'Đen', price_vnd: 200000, stock: 10 },
      ]);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi tạo sản phẩm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/products/${productId}`);
      showToast({
        type: 'success',
        message: `Đã xóa sản phẩm "${productName}" (Xóa mềm)`,
      });
      fetchProducts();
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.message || 'Không thể xóa sản phẩm',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <span>Danh Mục Sản Phẩm & Tồn Kho</span>
            <Badge variant="system" size="sm">
              Single Source of Truth
            </Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý giá bán, biến thể và số lượng tồn kho phục vụ bóc tách đơn hàng AI
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm">
          ➕ Thêm Sản Phẩm Mới
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="🔍 Tìm kiếm theo tên sản phẩm hoặc mã SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>⚠️ Chỉ xem hàng sắp hết (&le; 5 cái)</span>
          </label>
        </div>
      </Card>

      {/* Product List Content */}
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {errorMessage && !isLoading && (
        <Card className="border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-center py-6">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{errorMessage}</p>
          <Button size="sm" variant="outline" onClick={fetchProducts} className="mt-3">
            Thử tải lại
          </Button>
        </Card>
      )}

      {!isLoading && !errorMessage && products.length === 0 && (
        <EmptyState
          icon="👗"
          title="Không tìm thấy sản phẩm nào"
          description={
            searchTerm
              ? `Không có sản phẩm nào khớp với từ khóa "${searchTerm}".`
              : 'Cửa hàng chưa có sản phẩm nào. Hãy bấm nút thêm sản phẩm bên trên.'
          }
          actionText={searchTerm ? 'Xóa bộ lọc' : 'Thêm sản phẩm đầu tiên'}
          onAction={() => {
            if (searchTerm) {
              setSearchTerm('');
              setOnlyLowStock(false);
            } else {
              setIsModalOpen(true);
            }
          }}
        />
      )}

      {!isLoading && !errorMessage && products.length > 0 && (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.id} className="p-4 sm:p-5 hover:border-slate-300 transition">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {product.name}
                    </span>
                    {product.category && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {product.category}
                      </span>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-xs text-slate-500 line-clamp-1">{product.description}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    🗑️ Xóa
                  </Button>
                </div>
              </div>

              {/* Variants Pill List */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Phân loại & Tồn kho ({product.variants.length} biến thể):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {product.variants.map((v) => {
                    const isLowStock = v.stock <= 3;
                    return (
                      <div
                        key={v.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                          isLowStock
                            ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'
                            : 'bg-slate-50/60 border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-700/60'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {v.variant_name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400">SKU: {v.sku}</p>
                        </div>
                        <div className="text-right">
                          <MoneyText
                            amount={v.price_vnd}
                            className="text-xs text-indigo-600 dark:text-indigo-400 block"
                          />
                          <span
                            className={`text-[10px] font-bold ${
                              isLowStock
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            Tồn: {v.stock}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Thêm Sản Phẩm Mới */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm Sản Phẩm & Biến Thể Mới"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleCreateProduct}
              isLoading={isSubmitting}
            >
              Lưu Sản Phẩm
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium"
            >
              {formError}
            </div>
          )}

          <Input
            label="Tên sản phẩm"
            required
            placeholder="Ví dụ: Áo sơ mi lụa cổ đức"
            value={newProdName}
            onChange={(e) => setNewProdName(e.target.value)}
          />

          <Input
            label="Danh mục"
            placeholder="Thời trang nữ"
            value={newProdCategory}
            onChange={(e) => setNewProdCategory(e.target.value)}
          />

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Các biến thể kích cỡ / màu sắc:
              </label>
              <button
                type="button"
                onClick={handleAddVariantRow}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                ➕ Thêm size/màu khác
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto p-1">
              {newVariants.map((variant, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Mã SKU (duy nhất)"
                      required
                      placeholder="SOMI-TRANG-S"
                      value={variant.sku}
                      onChange={(e) => {
                        const updated = [...newVariants];
                        updated[idx].sku = e.target.value;
                        setNewVariants(updated);
                      }}
                    />
                    <Input
                      label="Tên phân loại"
                      required
                      placeholder="Size S / Trắng"
                      value={variant.variant_name}
                      onChange={(e) => {
                        const updated = [...newVariants];
                        updated[idx].variant_name = e.target.value;
                        setNewVariants(updated);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Giá bán (VNĐ)"
                      type="number"
                      required
                      min={0}
                      value={variant.price_vnd}
                      onChange={(e) => {
                        const updated = [...newVariants];
                        updated[idx].price_vnd = Number(e.target.value);
                        setNewVariants(updated);
                      }}
                    />
                    <Input
                      label="Số lượng tồn kho"
                      type="number"
                      required
                      min={0}
                      value={variant.stock}
                      onChange={(e) => {
                        const updated = [...newVariants];
                        updated[idx].stock = Number(e.target.value);
                        setNewVariants(updated);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductsPage;


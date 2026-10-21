import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  LayoutGrid,
  List,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Pencil,
  Trash2,
  Layers,
  ShoppingBag
} from 'lucide-react';
import { apiClient, ApiClientError } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import MoneyText from '../components/ui/MoneyText';
import { useToast } from '../components/ui/Toast';
import ProductImage from '../components/products/ProductImage';
import ImageUploader, { ImageItem } from '../components/products/ImageUploader';

export interface ProductVariant {
  id: string;
  sku: string;
  variant_name: string;
  size?: string;
  color?: string;
  price_vnd: number;
  stock: number;
  low_stock_threshold: number;
  is_active?: boolean;
}

export interface Product {
  id: string;
  name: string;
  category?: string;
  description?: string;
  image_url?: string;
  image_urls?: string[];
  variants: ProductVariant[];
  created_at: string;
  is_active?: boolean;
}

export const ProductsPage: React.FC = () => {
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'IN_STOCK'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State Thêm / Sửa Sản Phẩm
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Thời trang nữ');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImages, setProdImages] = useState<ImageItem[]>([]);
  const [variants, setVariants] = useState<
    Array<{
      id?: string;
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

  // Undo Soft-Delete state
  const [undoProduct, setUndoProduct] = useState<{ id: string; name: string } | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await apiClient.get<{ data: { items: Product[] } }>('/products', {
        params: {
          search: searchTerm || undefined,
          low_stock: stockFilter === 'LOW' ? 'true' : undefined,
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
  }, [searchTerm, stockFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Thống kê tổng hợp số liệu Single Source of Truth
  const stats = useMemo(() => {
    let totalSkus = 0;
    let lowStockCount = 0;
    let totalStockUnits = 0;

    products.forEach((p) => {
      p.variants.forEach((v) => {
        totalSkus++;
        totalStockUnits += v.stock;
        if (v.stock <= 5) {
          lowStockCount++;
        }
      });
    });

    return {
      totalProducts: products.length,
      totalSkus,
      lowStockCount,
      totalStockUnits,
    };
  }, [products]);

  // Bộ lọc theo Tab kho
  const filteredProducts = useMemo(() => {
    if (stockFilter === 'IN_STOCK') {
      return products.filter((p) => p.variants.every((v) => v.stock > 5));
    }
    return products;
  }, [products, stockFilter]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('Thời trang nữ');
    setProdDescription('');
    setProdImages([]);
    setVariants([
      { sku: '', variant_name: 'Mặc định (Size S)', size: 'S', color: 'Đen', price_vnd: 200000, stock: 10 },
    ]);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdCategory(product.category || 'Thời trang nữ');
    setProdDescription(product.description || '');

    const imgs: ImageItem[] = [];
    if (product.image_urls && product.image_urls.length > 0) {
      product.image_urls.forEach((url, i) => {
        imgs.push({
          id: `img-${i}`,
          url,
          name: `${product.name} ${i + 1}`,
          isCover: i === 0,
        });
      });
    } else if (product.image_url) {
      imgs.push({
        id: 'img-0',
        url: product.image_url,
        name: product.name,
        isCover: true,
      });
    }
    setProdImages(imgs);

    setVariants(
      product.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        variant_name: v.variant_name,
        size: v.size || 'M',
        color: v.color || 'Trắng',
        price_vnd: v.price_vnd,
        stock: v.stock,
      }))
    );
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddVariantRow = () => {
    setVariants((prev) => [
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

  const handleRemoveVariantRow = (index: number) => {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!prodName.trim()) {
      setFormError('Vui lòng nhập tên sản phẩm');
      return;
    }

    for (const v of variants) {
      if (!v.sku.trim()) {
        setFormError('Mã SKU biến thể không được để trống');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        // Cập nhật sản phẩm
        await apiClient.patch(`/products/${editingProduct.id}`, {
          name: prodName.trim(),
          category: prodCategory.trim(),
          description: prodDescription.trim(),
        });

        // Cập nhật các biến thể có sẵn
        for (const v of variants) {
          if (v.id) {
            await apiClient.patch(`/products/variants/${v.id}`, {
              price_vnd: v.price_vnd,
              stock: v.stock,
            });
          }
        }

        showToast(`Đã cập nhật sản phẩm "${prodName}" thành công!`, 'success');
      } else {
        // Tạo sản phẩm mới
        await apiClient.post('/products', {
          name: prodName.trim(),
          category: prodCategory.trim(),
          description: prodDescription.trim(),
          variants,
        });

        showToast(`Đã thêm sản phẩm "${prodName}" thành công!`, 'success');
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu sản phẩm');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa mềm có Hoàn tác (Undo)
  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      await apiClient.delete(`/products/${productId}`);
      setUndoProduct({ id: productId, name: productName });
      showToast(`Đã xóa sản phẩm "${productName}"`, 'success');
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Không thể xóa sản phẩm', 'error');
    }
  };

  const handleRestoreProduct = async () => {
    if (!undoProduct) return;
    try {
      await apiClient.post(`/products/${undoProduct.id}/restore`, {});
      showToast(`Đã khôi phục sản phẩm "${undoProduct.name}"`, 'success');
      setUndoProduct(null);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Không thể khôi phục sản phẩm', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Thao tác chính */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2.5">
            <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Danh Mục Sản Phẩm & Tồn Kho</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý giá bán, hình ảnh và kiểm soát tồn kho tức thời phục vụ chốt đơn AI
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Thêm sản phẩm mới
        </Button>
      </div>

      {/* 2. Thanh KPI thống kê nhanh */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" /> Tổng sản phẩm
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {stats.totalProducts} <span className="text-xs font-normal text-slate-400">mẫu</span>
          </div>
        </Card>

        <Card className="p-3.5">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" /> Tổng biến thể SKU
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {stats.totalSkus} <span className="text-xs font-normal text-slate-400">SKU</span>
          </div>
        </Card>

        <Card className="p-3.5 border-amber-200/60 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10">
          <span className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Sắp hết hàng (&le; 5)
          </span>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {stats.lowStockCount} <span className="text-xs font-normal text-amber-700">SKU</span>
          </div>
        </Card>

        <Card className="p-3.5">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tổng chiếc trong kho
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">
            {stats.totalStockUnits} <span className="text-xs font-normal text-slate-400">chiếc</span>
          </div>
        </Card>
      </div>

      {/* 3. Thanh thông báo Hoàn tác nếu vừa xóa */}
      {undoProduct && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 animate-fade-in">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-indigo-600" />
            <span>
              Đã xóa tạm thời sản phẩm <b>"{undoProduct.name}"</b>
            </span>
          </div>
          <button
            type="button"
            onClick={handleRestoreProduct}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Hoàn tác</span>
          </button>
        </div>
      )}

      {/* 4. Bộ lọc & Tùy chọn hiển thị Lưới / Bảng */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Stock filter chips */}
            <div className="flex items-center space-x-1">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'LOW', label: 'Sắp hết' },
                { id: 'IN_STOCK', label: 'Còn hàng' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStockFilter(tab.id as any)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    stockFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Xem dạng lưới ảnh"
                aria-label="Xem dạng lưới ảnh"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Xem dạng bảng chi tiết"
                aria-label="Xem dạng bảng chi tiết"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Nội dung danh sách sản phẩm */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : errorMessage ? (
        <Card className="border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-center py-8">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="mt-2 text-base font-semibold text-rose-700 dark:text-rose-300">
            {errorMessage}
          </h2>
          <div className="mt-4">
            <Button size="sm" variant="outline" onClick={fetchProducts}>
              Thử tải lại
            </Button>
          </div>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon="👗"
          title="Không tìm thấy sản phẩm nào"
          description={
            searchTerm
              ? `Không có sản phẩm nào khớp với từ khóa "${searchTerm}".`
              : 'Cửa hàng chưa có sản phẩm nào. Hãy bấm nút thêm sản phẩm bên trên.'
          }
          actionText={searchTerm ? 'Xóa tìm kiếm' : '+ Thêm sản phẩm đầu tiên'}
          onAction={() => {
            if (searchTerm) {
              setSearchTerm('');
              setStockFilter('ALL');
            } else {
              handleOpenCreateModal();
            }
          }}
        />
      ) : viewMode === 'grid' ? (
        /* 5A. CHẾ ĐỘ XEM DẠNG LƯỚI (GRID VIEW) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const minPrice = Math.min(...product.variants.map((v) => v.price_vnd));
            const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
            const hasLowStock = product.variants.some((v) => v.stock <= 5);

            return (
              <Card
                key={product.id}
                className="overflow-hidden flex flex-col hover:border-indigo-300 dark:hover:border-indigo-700 transition shadow-sm group"
              >
                {/* Ảnh sản phẩm */}
                <div className="relative">
                  <ProductImage
                    src={product.image_url || (product.image_urls && product.image_urls[0])}
                    alt={product.name}
                    aspectRatio="square"
                  />
                  {hasLowStock && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Sắp hết hàng
                    </span>
                  )}
                  {product.category && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/70 text-white text-[10px] font-medium backdrop-blur-sm">
                      {product.category}
                    </span>
                  )}
                </div>

                {/* Thông tin sản phẩm */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                        <MoneyText amount={minPrice} />
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Tồn: <b className="text-slate-700 dark:text-slate-300 font-mono">{totalStock}</b>
                      </span>
                    </div>

                    {/* Biến thể tóm tắt */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {product.variants.map((v) => (
                          <span
                            key={v.id}
                            className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                              v.stock <= 5
                                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                                : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                            }`}
                            title={`${v.variant_name} - Tồn: ${v.stock}`}
                          >
                            {v.variant_name.replace(/.*\((.*)\).*/, '$1') || v.variant_name}: {v.stock}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Hành động sửa / xóa */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(product)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 p-1"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* 5B. CHẾ ĐỘ XEM DẠNG BẢNG (TABLE VIEW) */
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Số biến thể</th>
                  <th className="py-3 px-4">Giá bán</th>
                  <th className="py-3 px-4">Tổng tồn kho</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((product) => {
                  const minPrice = Math.min(...product.variants.map((v) => v.price_vnd));
                  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
                  const hasLowStock = product.variants.some((v) => v.stock <= 5);

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0">
                            <ProductImage
                              src={product.image_url || (product.image_urls && product.image_urls[0])}
                              alt={product.name}
                              aspectRatio="square"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {product.name}
                            </span>
                            <div className="text-[11px] text-slate-400 font-mono">
                              SKU: {product.variants[0]?.sku || '---'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {product.category || 'Mặc định'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono">{product.variants.length} phân loại</span>
                      </td>

                      <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                        <MoneyText amount={minPrice} />
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {totalStock}
                          </span>
                          {hasLowStock && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                              Sắp hết
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                            title="Chỉnh sửa sản phẩm"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 6. MODAL: Thêm / Sửa Sản phẩm & Biến thể */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end space-x-2">
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
              onClick={handleSaveProduct}
              isLoading={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {editingProduct ? 'Cập Nhật Sản Phẩm' : 'Lưu Sản Phẩm'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          {/* Tải ảnh sản phẩm */}
          <ImageUploader images={prodImages} onChange={setProdImages} />

          {/* Tên & danh mục */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Input
              label="Tên sản phẩm"
              required
              placeholder="VD: Áo sơ mi lụa cổ V"
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
            />
            <Input
              label="Danh mục"
              placeholder="Thời trang nữ"
              value={prodCategory}
              onChange={(e) => setProdCategory(e.target.value)}
            />
          </div>

          <Input
            label="Mô tả sản phẩm"
            placeholder="Chất liệu lụa tơ tằm mềm mại, không nhăn, form dáng thanh lịch..."
            value={prodDescription}
            onChange={(e) => setProdDescription(e.target.value)}
          />

          {/* Danh sách biến thể kích cỡ / màu sắc */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Phân loại & Tồn kho ({variants.length} biến thể)
              </label>
              {!editingProduct && (
                <button
                  type="button"
                  onClick={handleAddVariantRow}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + Thêm size / màu khác
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto p-1">
              {variants.map((variant, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Biến thể #{idx + 1}
                    </span>
                    {!editingProduct && variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantRow(idx)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-medium"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Mã SKU (duy nhất)"
                      required
                      placeholder="SOMI-TRANG-S"
                      value={variant.sku}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].sku = e.target.value;
                        setVariants(updated);
                      }}
                    />
                    <Input
                      label="Tên phân loại"
                      required
                      placeholder="Size S / Trắng"
                      value={variant.variant_name}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].variant_name = e.target.value;
                        setVariants(updated);
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
                        const updated = [...variants];
                        updated[idx].price_vnd = Number(e.target.value);
                        setVariants(updated);
                      }}
                    />
                    <Input
                      label="Số lượng tồn kho"
                      type="number"
                      required
                      min={0}
                      value={variant.stock}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].stock = Number(e.target.value);
                        setVariants(updated);
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

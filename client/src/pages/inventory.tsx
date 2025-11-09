
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Download,
  Upload,
  Settings,
  Search,
  X,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Home,
  ChevronRight as Chevron,
  Minus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProductDetailsModal from "@/components/product-details-modal";

interface Product {
  id: number;
  name: string;
  productCode: string;
  category: string;
  brand: string;
  model: string;
  barcode: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  imageUrl?: string;
  isActive: boolean;
}

type SortDirection = 'asc' | 'desc' | null;
type SortColumn = keyof Product | null;

export default function Inventory() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Quick stock adjustment mutation
  const stockAdjustMutation = useMutation({
    mutationFn: async ({ productId, delta }: { productId: number; delta: number }) => {
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error("Product not found");
      
      const newStock = Math.max(0, product.stockQuantity + delta);
      await apiRequest("PUT", `/api/products/${productId}`, {
        stockQuantity: newStock
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Stock quantity updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStockValue = products.reduce(
      (sum, p) => sum + p.costPrice * p.stockQuantity,
      0
    );
    const lowStockCount = products.filter(
      (p) => p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0
    ).length;
    const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

    return { totalProducts, totalStockValue, lowStockCount, outOfStockCount };
  }, [products]);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.productCode?.toLowerCase().includes(searchLower) ||
        product.barcode?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower)
      );
    });
  }, [products, searchQuery]);

  // Sort products
  const sortedProducts = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return filteredProducts;
    }

    const sorted = [...filteredProducts].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Number comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return sorted;
  }, [filteredProducts, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(paginatedProducts.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, id]);
    } else {
      setSelectedProducts(selectedProducts.filter((pid) => pid !== id));
    }
  };

  // Sorting handler
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline-block" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1 inline-block" />;
    }
    return <ArrowDown className="h-4 w-4 ml-1 inline-block" />;
  };

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    } else if (product.stockQuantity <= product.minStockLevel) {
      return { label: "Low Stock", variant: "outline" as const };
    } else {
      return { label: "In Stock", variant: "default" as const };
    }
  };

  const handleExport = (format: string) => {
    toast({
      title: "Export Started",
      description: `Exporting inventory to ${format.toUpperCase()}...`,
    });
  };

  const handleDelete = (id: number) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete);
    }
  };

  const handleViewDetails = (id: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setSelectedProduct(product);
      setDetailsModalOpen(true);
    }
  };

  const handleEditProduct = (product: Product) => {
    setDetailsModalOpen(false);
    navigate(`/add-product?edit=${product.id}`);
  };

  const handleDeleteFromModal = (productId: number) => {
    setDetailsModalOpen(false);
    handleDelete(productId);
  };

  const handleStockAdjust = (productId: number, delta: number) => {
    stockAdjustMutation.mutate({ productId, delta });
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="breadcrumb-navigation">
        <Home className="h-4 w-4" data-testid="icon-home" />
        <Chevron className="h-4 w-4" />
        <span className="font-medium text-foreground" data-testid="text-page-title">Inventory Management</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-inventory">Inventory Management</h1>
          <p className="text-muted-foreground" data-testid="text-subtitle">Manage your product inventory and stock levels</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-total-products">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <h3 className="text-2xl font-bold mt-2" data-testid="stat-total-products">{stats.totalProducts}</h3>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stock-value">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Stock Value</p>
                <h3 className="text-2xl font-bold mt-2" data-testid="stat-stock-value">₹{stats.totalStockValue.toLocaleString()}</h3>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-low-stock">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Alert</p>
                <h3 className="text-2xl font-bold mt-2 text-yellow-600" data-testid="stat-low-stock">{stats.lowStockCount}</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-out-of-stock">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <h3 className="text-2xl font-bold mt-2 text-red-600" data-testid="stat-out-of-stock">{stats.outOfStockCount}</h3>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/add-product")} className="gap-2" data-testid="button-add-product">
          <Plus className="h-4 w-4" />
          Add New Product
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" data-testid="button-export">
              <Download className="h-4 w-4" />
              Export Inventory
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport("excel")} data-testid="menu-export-excel">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("csv")} data-testid="menu-export-csv">
              <FileText className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf")} data-testid="menu-export-pdf">
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" onClick={() => navigate("/import-products")} className="gap-2" data-testid="button-import">
          <Upload className="h-4 w-4" />
          Import Products
        </Button>

        <Button variant="outline" className="gap-2" data-testid="button-settings">
          <Settings className="h-4 w-4" />
          View Settings
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full md:w-1/2">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by product name, SKU, barcode..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10 pr-10"
          data-testid="input-search"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            data-testid="button-clear-search"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Product Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64" data-testid="loading-products">
              <div className="text-muted-foreground">Loading products...</div>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4" data-testid="empty-state">
              <Package className="h-16 w-16 text-muted-foreground/50" />
              {searchQuery ? (
                <>
                  <p className="text-lg font-medium" data-testid="text-no-results">No products found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search terms
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery("")} data-testid="button-clear-search-empty">
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium" data-testid="text-no-products">No products yet</p>
                  <p className="text-sm text-muted-foreground">
                    Get started by adding your first product
                  </p>
                  <Button onClick={() => navigate("/add-product")} data-testid="button-add-first-product">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Product
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            paginatedProducts.length > 0 &&
                            paginatedProducts.every((p) =>
                              selectedProducts.includes(p.id)
                            )
                          }
                          onCheckedChange={handleSelectAll}
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                      <TableHead data-testid="header-image">Image</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('name')} data-testid="header-product-name">
                        Product Name {getSortIcon('name')}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('category')} data-testid="header-category">
                        Category {getSortIcon('category')}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('brand')} data-testid="header-brand">
                        Brand {getSortIcon('brand')}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('model')} data-testid="header-model">
                        Model {getSortIcon('model')}
                      </TableHead>
                      <TableHead data-testid="header-sku">SKU</TableHead>
                      <TableHead data-testid="header-barcode">Barcode</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('costPrice')} data-testid="header-purchase-price">
                        Purchase Price {getSortIcon('costPrice')}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('price')} data-testid="header-selling-price">
                        Selling Price {getSortIcon('price')}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('stockQuantity')} data-testid="header-stock">
                        Current Stock {getSortIcon('stockQuantity')}
                      </TableHead>
                      <TableHead data-testid="header-status">Stock Status</TableHead>
                      <TableHead data-testid="header-actions">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product, index) => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <TableRow
                          key={product.id}
                          className={`hover:bg-muted/50 ${index % 2 === 1 ? 'bg-muted/30' : 'bg-background'}`}
                          data-testid={`row-product-${product.id}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={(checked) =>
                                handleSelectProduct(product.id, checked as boolean)
                              }
                              data-testid={`checkbox-product-${product.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="w-[60px] h-[60px] rounded-md overflow-hidden bg-muted flex items-center justify-center">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  data-testid={`img-product-${product.id}`}
                                />
                              ) : (
                                <Package className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium" data-testid={`text-name-${product.id}`}>{product.name}</p>
                              <p className="text-xs text-muted-foreground" data-testid={`text-code-${product.id}`}>
                                {product.productCode || "N/A"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-category-${product.id}`}>{product.category || "N/A"}</TableCell>
                          <TableCell data-testid={`text-brand-${product.id}`}>{product.brand || "N/A"}</TableCell>
                          <TableCell data-testid={`text-model-${product.id}`}>{product.model || "N/A"}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded" data-testid={`text-sku-${product.id}`}>
                              {product.productCode || "N/A"}
                            </code>
                          </TableCell>
                          <TableCell data-testid={`text-barcode-${product.id}`}>
                            {product.barcode || "N/A"}
                          </TableCell>
                          <TableCell data-testid={`text-cost-price-${product.id}`}>₹{product.costPrice.toLocaleString()}</TableCell>
                          <TableCell data-testid={`text-price-${product.id}`}>₹{product.price.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleStockAdjust(product.id, -1)}
                                disabled={stockAdjustMutation.isPending || product.stockQuantity === 0}
                                data-testid={`button-stock-decrease-${product.id}`}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-medium min-w-[40px] text-center" data-testid={`text-stock-${product.id}`}>{product.stockQuantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleStockAdjust(product.id, 1)}
                                disabled={stockAdjustMutation.isPending}
                                data-testid={`button-stock-increase-${product.id}`}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant} data-testid={`badge-status-${product.id}`}>
                              {stockStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(product.id)}
                                data-testid={`button-view-${product.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/add-product?edit=${product.id}`)}
                                data-testid={`button-edit-${product.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(product.id)}
                                data-testid={`button-delete-${product.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px]" data-testid="select-items-per-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25" data-testid="option-25">25</SelectItem>
                      <SelectItem value="50" data-testid="option-50">50</SelectItem>
                      <SelectItem value="100" data-testid="option-100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                    Page {currentPage} of {totalPages} ({sortedProducts.length} items)
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          onEdit={handleEditProduct}
          onDelete={handleDeleteFromModal}
        />
      )}
    </div>
  );
}

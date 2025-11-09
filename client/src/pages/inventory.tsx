
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
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

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

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

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
    setSelectedProductId(id);
    setDetailsModalOpen(true);
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Home className="h-4 w-4" />
        <Chevron className="h-4 w-4" />
        <span className="font-medium text-foreground">Inventory Management</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">Manage your product inventory and stock levels</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <h3 className="text-2xl font-bold mt-2">{stats.totalProducts}</h3>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Stock Value</p>
                <h3 className="text-2xl font-bold mt-2">₹{stats.totalStockValue.toLocaleString()}</h3>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Alert</p>
                <h3 className="text-2xl font-bold mt-2 text-yellow-600">{stats.lowStockCount}</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                <h3 className="text-2xl font-bold mt-2 text-red-600">{stats.outOfStockCount}</h3>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/add-product")} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Product
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Inventory
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport("excel")}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              <FileText className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf")}>
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" onClick={() => navigate("/import-products")} className="gap-2">
          <Upload className="h-4 w-4" />
          Import Products
        </Button>

        <Button variant="outline" className="gap-2">
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
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Product Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading products...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Package className="h-16 w-16 text-muted-foreground/50" />
              {searchQuery ? (
                <>
                  <p className="text-lg font-medium">No products found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search terms
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">No products yet</p>
                  <p className="text-sm text-muted-foreground">
                    Get started by adding your first product
                  </p>
                  <Button onClick={() => navigate("/add-product")}>
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
                        />
                      </TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Purchase Price</TableHead>
                      <TableHead>Selling Price</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Stock Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product) => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <TableRow
                          key={product.id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={(checked) =>
                                handleSelectProduct(product.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="w-[60px] h-[60px] rounded-md overflow-hidden bg-muted flex items-center justify-center">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.productCode || "N/A"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{product.category || "N/A"}</TableCell>
                          <TableCell>{product.brand || "N/A"}</TableCell>
                          <TableCell>{product.model || "N/A"}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {product.productCode || "N/A"}
                            </code>
                          </TableCell>
                          <TableCell>
                            {product.barcode || "N/A"}
                          </TableCell>
                          <TableCell>₹{product.costPrice.toLocaleString()}</TableCell>
                          <TableCell>₹{product.price.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className="font-medium">{product.stockQuantity}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant}>
                              {stockStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(product.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/add-product?edit=${product.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(product.id)}
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
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({filteredProducts.length} items)
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Details Modal */}
      {selectedProductId && (
        <ProductDetailsModal
          productId={selectedProductId}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
        />
      )}
    </div>
  );
}

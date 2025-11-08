import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { Plus, Search, Edit, Trash2, Package, MoreVertical, X, Plus as PlusIcon, Minus, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface Product {
  id: number;
  name: string;
  brand?: string;
  model?: string;
  category: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  imeiNumber?: string;
  color?: string;
  storage?: string;
  ram?: string;
  isActive?: boolean;
}

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showBulkStockModal, setShowBulkStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkActionDialog, setShowBulkActionDialog] = useState<'category' | 'status' | 'price' | 'tags' | 'barcode' | 'export' | 'edit' | null>(null);
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [bulkPreviewData, setBulkPreviewData] = useState<any[]>([]);
  const [selectAllPages, setSelectAllPages] = useState(false);
  
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products = [], refetch } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const form = useForm({
    defaultValues: {
      name: "",
      brand: "",
      model: "",
      category: "smartphone",
      price: 0,
      stockQuantity: 0,
      imeiNumber: "",
      color: "",
      storage: "",
      ram: "",
    },
  });

  const stockForm = useForm({
    defaultValues: {
      adjustmentType: "add",
      quantity: 0,
      reason: "correction",
      notes: "",
      referenceNumber: "",
      adjustmentDate: new Date(),
    },
  });

  const bulkStockForm = useForm({
    defaultValues: {
      adjustmentType: "add",
      quantity: 0,
      reason: "correction",
      notes: "",
    },
  });

  const bulkCategoryForm = useForm({
    defaultValues: {
      category: "smartphone",
    },
  });

  const bulkPriceForm = useForm({
    defaultValues: {
      field: "price",
      operation: "increase",
      value: 0,
    },
  });

  const bulkEditForm = useForm({
    defaultValues: {
      warrantyMonths: "",
      minStockLevel: "",
      costPrice: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/products/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product updated successfully" });
      setEditingProduct(null);
      form.reset();
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: number[]) => {
      const res = await apiRequest("POST", "/api/products/bulk/delete", { productIds });
      if (!res.ok) throw new Error("Failed to delete products");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Products deleted successfully" });
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
    },
    onError: () => {
      toast({ title: "Failed to delete products", variant: "destructive" });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ productIds, updates }: { productIds: number[]; updates: any }) => {
      const res = await apiRequest("POST", "/api/products/bulk/update", { productIds, updates });
      if (!res.ok) throw new Error("Failed to update products");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Products updated successfully" });
      setSelectedIds(new Set());
      setShowBulkActionDialog(null);
    },
    onError: () => {
      toast({ title: "Failed to update products", variant: "destructive" });
    },
  });

  const bulkUpdatePricesMutation = useMutation({
    mutationFn: async ({ productIds, priceUpdate }: { productIds: number[]; priceUpdate: any }) => {
      const res = await apiRequest("POST", "/api/products/bulk/update-prices", { productIds, priceUpdate });
      if (!res.ok) throw new Error("Failed to update prices");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Prices updated successfully" });
      setSelectedIds(new Set());
      setShowBulkActionDialog(null);
    },
    onError: () => {
      toast({ title: "Failed to update prices", variant: "destructive" });
    },
  });

  const stockAdjustMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/stock/adjust", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to adjust stock");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Stock adjusted successfully" });
      setShowStockModal(false);
      setStockProduct(null);
      stockForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to adjust stock", description: error.message, variant: "destructive" });
    },
  });

  const bulkStockAdjustMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/stock/bulk-adjust", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to adjust stock");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Stock adjusted for all selected products" });
      setShowBulkStockModal(false);
      setSelectedIds(new Set());
      bulkStockForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to adjust stock", description: error.message, variant: "destructive" });
    },
  });

  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const name = p.name?.toLowerCase() || '';
    const brand = p.brand?.toLowerCase() || '';
    const model = p.model?.toLowerCase() || '';
    const category = p.category?.toLowerCase() || '';
    const imei = p.imeiNumber?.toLowerCase() || '';
    
    return (
      name.includes(query) ||
      brand.includes(query) ||
      model.includes(query) ||
      category.includes(query) ||
      imei.includes(query)
    );
  });

  const onSubmit = (data: any) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    form.reset(product);
  };

  const toggleSelection = (id: number, index: number, shiftKey: boolean) => {
    const newSelection = new Set(selectedIds);
    
    if (shiftKey && lastSelectedIndex !== null) {
      // Range selection
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      for (let i = start; i <= end; i++) {
        newSelection.add(filteredProducts[i].id);
      }
    } else {
      // Single toggle
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
    }
    
    setSelectedIds(newSelection);
    setLastSelectedIndex(index);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
      setSelectAllPages(false);
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const selectAllAcrossPages = () => {
    setSelectedIds(new Set(products.map(p => p.id)));
    setSelectAllPages(true);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleStockAdjust = (product: Product) => {
    setStockProduct(product);
    setShowStockModal(true);
    stockForm.reset({
      adjustmentType: "add",
      quantity: 0,
      reason: "correction",
      notes: "",
      referenceNumber: "",
    });
  };

  const onStockSubmit = (data: any) => {
    if (!stockProduct) return;
    
    stockAdjustMutation.mutate({
      productId: stockProduct.id,
      ...data,
      quantity: parseInt(data.quantity),
    });
  };

  const showBulkStockPreview = (data: any) => {
    const selectedProducts = products.filter(p => selectedIds.has(p.id));
    const preview = selectedProducts.map(product => {
      const currentStock = product.stockQuantity || 0;
      const qty = parseInt(data.quantity) || 0;
      let newStock = currentStock;
      
      switch (data.adjustmentType) {
        case "add":
          newStock = currentStock + qty;
          break;
        case "subtract":
          newStock = Math.max(0, currentStock - qty);
          break;
        case "set":
          newStock = qty;
          break;
      }
      
      return {
        id: product.id,
        name: product.name,
        currentStock,
        newStock,
        change: newStock - currentStock,
      };
    });
    
    setBulkPreviewData(preview);
    setShowBulkPreview(true);
  };

  const onBulkStockSubmit = (data: any) => {
    showBulkStockPreview(data);
  };

  const confirmBulkStockAdjustment = () => {
    const data = bulkStockForm.getValues();
    bulkStockAdjustMutation.mutate({
      productIds: Array.from(selectedIds),
      ...data,
      quantity: parseInt(String(data.quantity)),
    });
    setShowBulkPreview(false);
  };

  const onBulkCategorySubmit = (data: any) => {
    bulkUpdateMutation.mutate({
      productIds: Array.from(selectedIds),
      updates: { category: data.category },
    });
  };

  const onBulkPriceSubmit = (data: any) => {
    bulkUpdatePricesMutation.mutate({
      productIds: Array.from(selectedIds),
      priceUpdate: {
        field: data.field,
        operation: data.operation,
        value: parseFloat(data.value),
      },
    });
  };

  const onBulkEditSubmit = (data: any) => {
    const updates: any = {};
    if (data.warrantyMonths !== "") updates.warrantyMonths = parseInt(data.warrantyMonths);
    if (data.minStockLevel !== "") updates.minStockLevel = parseInt(data.minStockLevel);
    if (data.costPrice !== "") updates.costPrice = parseFloat(data.costPrice);
    
    if (Object.keys(updates).length === 0) {
      toast({ title: "No fields to update", variant: "destructive" });
      return;
    }
    
    bulkUpdateMutation.mutate({
      productIds: Array.from(selectedIds),
      updates,
    });
  };

  const handleBulkStatusChange = (isActive: boolean) => {
    bulkUpdateMutation.mutate({
      productIds: Array.from(selectedIds),
      updates: { isActive },
    });
  };

  const exportSelected = (format: 'csv' | 'excel' | 'pdf') => {
    const selectedProducts = products.filter(p => selectedIds.has(p.id));
    
    if (format === 'csv') {
      const headers = ['Name', 'Brand', 'Model', 'Category', 'Price', 'Cost Price', 'Stock', 'Status'];
      const rows = selectedProducts.map(p => [
        p.name,
        p.brand || '',
        p.model || '',
        p.category,
        p.price,
        p.costPrice,
        p.stockQuantity,
        p.isActive ? 'Active' : 'Inactive'
      ]);
      
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: `Exported ${selectedProducts.length} products to CSV` });
    } else {
      toast({ title: `${format.toUpperCase()} export coming soon`, variant: "default" });
    }
    
    setShowBulkActionDialog(null);
  };

  const generateBarcodesForSelected = () => {
    toast({ title: `Generating barcodes for ${selectedIds.size} products`, variant: "default" });
    setShowBulkActionDialog(null);
  };

  const printLabelsForSelected = () => {
    toast({ title: `Printing labels for ${selectedIds.size} products`, variant: "default" });
    setShowBulkActionDialog(null);
  };

  const calculateNewStock = () => {
    if (!stockProduct) return 0;
    
    const current = stockProduct.stockQuantity || 0;
    const qty = parseInt(stockForm.watch("quantity") as any) || 0;
    const type = stockForm.watch("adjustmentType");
    
    switch (type) {
      case "add":
        return current + qty;
      case "subtract":
        return Math.max(0, current - qty);
      case "set":
        return qty;
      default:
        return current;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <Button onClick={() => setLocation("/add-product")} data-testid="button-add-product">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Selection Toolbar */}
      {selectedIds.size > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSelection}
                  data-testid="button-clear-selection"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex flex-col">
                  <span className="font-medium">{selectedIds.size} selected</span>
                  {!selectAllPages && selectedIds.size === filteredProducts.length && filteredProducts.length < products.length && (
                    <button
                      className="h-auto p-0 text-xs text-primary hover:underline cursor-pointer bg-transparent border-none"
                      onClick={selectAllAcrossPages}
                    >
                      Select all {products.length} products
                    </button>
                  )}
                  {selectAllPages && (
                    <span className="text-xs text-muted-foreground">All {products.length} products selected</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkStockModal(true)}
                  data-testid="button-bulk-stock-adjust"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Adjust Stock
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-bulk-actions">
                      Bulk Actions
                      <MoreVertical className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowBulkActionDialog('edit')}>
                      Edit Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowBulkActionDialog('category')}>
                      Change Category
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowBulkActionDialog('price')}>
                      Update Prices
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleBulkStatusChange(true)}>
                          Activate All
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatusChange(false)}>
                          Deactivate All
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowBulkActionDialog('barcode')}>
                      Generate Barcodes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={printLabelsForSelected}>
                      Print Labels
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowBulkActionDialog('export')}>
                      Export Selected
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => {
        if (!open) {
          setEditingProduct(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product details</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="iPhone 14 Pro" {...field} data-testid="input-edit-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input placeholder="Apple" {...field} data-testid="input-edit-brand" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="A2890" {...field} data-testid="input-edit-model" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="79999" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} data-testid="input-edit-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-edit-stock" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imeiNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IMEI (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789012345" {...field} data-testid="input-edit-imei" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit" data-testid="button-update-product">
                  Update Product
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Quick Stock Adjustment Modal */}
      <Dialog open={showStockModal} onOpenChange={setShowStockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock - {stockProduct?.name}</DialogTitle>
            <DialogDescription>
              Current Stock: <span className="font-mono font-bold">{stockProduct?.stockQuantity || 0}</span>
            </DialogDescription>
          </DialogHeader>
          <Form {...stockForm}>
            <form onSubmit={stockForm.handleSubmit(onStockSubmit)} className="space-y-4">
              <FormField
                control={stockForm.control}
                name="adjustmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-adjustment-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="add">Add to Stock</SelectItem>
                        <SelectItem value="subtract">Subtract from Stock</SelectItem>
                        <SelectItem value="set">Set Stock Level</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={stockForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-stock-quantity"
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      New stock: <span className="font-mono font-bold">{calculateNewStock()}</span>
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => stockForm.setValue("quantity", (stockForm.getValues("quantity") as number) + 1)}
                >
                  +1
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => stockForm.setValue("quantity", (stockForm.getValues("quantity") as number) + 5)}
                >
                  +5
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => stockForm.setValue("quantity", (stockForm.getValues("quantity") as number) + 10)}
                >
                  +10
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => stockForm.setValue("quantity", Math.max(0, (stockForm.getValues("quantity") as number) - 1))}
                >
                  -1
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => stockForm.setValue("quantity", Math.max(0, (stockForm.getValues("quantity") as number) - 5))}
                >
                  -5
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => stockForm.setValue("quantity", Math.max(0, (stockForm.getValues("quantity") as number) - 10))}
                >
                  -10
                </Button>
              </div>
              
              <FormField
                control={stockForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-reason">
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="correction">Correction</SelectItem>
                        <SelectItem value="damage">Damage</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="found">Found</SelectItem>
                        <SelectItem value="return">Return</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={stockForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any additional notes..." 
                        {...field} 
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={stockForm.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="REF-001" 
                        {...field} 
                        data-testid="input-reference"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={stockForm.control}
                name="adjustmentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Adjustment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" data-testid="button-submit-stock-adjust">
                  Adjust Stock
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Stock Adjustment Modal */}
      <Dialog open={showBulkStockModal} onOpenChange={setShowBulkStockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Stock Adjustment</DialogTitle>
            <DialogDescription>
              Adjust stock for {selectedIds.size} selected products
            </DialogDescription>
          </DialogHeader>
          <Form {...bulkStockForm}>
            <form onSubmit={bulkStockForm.handleSubmit(onBulkStockSubmit)} className="space-y-4">
              <FormField
                control={bulkStockForm.control}
                name="adjustmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bulk-adjustment-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="add">Add to All</SelectItem>
                        <SelectItem value="subtract">Subtract from All</SelectItem>
                        <SelectItem value="set">Set All to Same Value</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={bulkStockForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-bulk-stock-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={bulkStockForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bulk-reason">
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="correction">Correction</SelectItem>
                        <SelectItem value="damage">Damage</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="found">Found</SelectItem>
                        <SelectItem value="return">Return</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={bulkStockForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any additional notes..." 
                        {...field} 
                        data-testid="textarea-bulk-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" data-testid="button-submit-bulk-stock-adjust">
                  Adjust Stock for {selectedIds.size} Products
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={showBulkActionDialog === 'edit'} onOpenChange={() => setShowBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Selected Products</DialogTitle>
            <DialogDescription>
              Edit common fields for {selectedIds.size} selected products. Only filled fields will be updated.
            </DialogDescription>
          </DialogHeader>
          <Form {...bulkEditForm}>
            <form onSubmit={bulkEditForm.handleSubmit(onBulkEditSubmit)} className="space-y-4">
              <FormField
                control={bulkEditForm.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="Leave empty to keep unchanged" 
                        {...field} 
                        data-testid="input-bulk-cost-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={bulkEditForm.control}
                name="warrantyMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty (months)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Leave empty to keep unchanged" 
                        {...field} 
                        data-testid="input-bulk-warranty"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={bulkEditForm.control}
                name="minStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stock Level</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Leave empty to keep unchanged" 
                        {...field} 
                        data-testid="input-bulk-min-stock"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBulkActionDialog(null)} type="button">
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-submit-bulk-edit">
                  Update {selectedIds.size} Products
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Category Change Dialog */}
      <Dialog open={showBulkActionDialog === 'category'} onOpenChange={() => setShowBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Category</DialogTitle>
            <DialogDescription>
              Change category for {selectedIds.size} selected products
            </DialogDescription>
          </DialogHeader>
          <Form {...bulkCategoryForm}>
            <form onSubmit={bulkCategoryForm.handleSubmit(onBulkCategorySubmit)} className="space-y-4">
              <FormField
                control={bulkCategoryForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bulk-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="smartphone">Smartphone</SelectItem>
                        <SelectItem value="feature_phone">Feature Phone</SelectItem>
                        <SelectItem value="accessory">Accessory</SelectItem>
                        <SelectItem value="spare_part">Spare Part</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" data-testid="button-submit-bulk-category">
                  Update Category
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Price Update Dialog */}
      <Dialog open={showBulkActionDialog === 'price'} onOpenChange={() => setShowBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Prices</DialogTitle>
            <DialogDescription>
              Update prices for {selectedIds.size} selected products
            </DialogDescription>
          </DialogHeader>
          <Form {...bulkPriceForm}>
            <form onSubmit={bulkPriceForm.handleSubmit(onBulkPriceSubmit)} className="space-y-4">
              <FormField
                control={bulkPriceForm.control}
                name="field"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Field</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-price-field">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="price">Retail Price</SelectItem>
                        <SelectItem value="costPrice">Cost Price</SelectItem>
                        <SelectItem value="mrp">MRP</SelectItem>
                        <SelectItem value="wholesalePrice">Wholesale Price</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={bulkPriceForm.control}
                name="operation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operation</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-price-operation">
                          <SelectValue placeholder="Select operation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="increase">Increase by Amount</SelectItem>
                        <SelectItem value="decrease">Decrease by Amount</SelectItem>
                        <SelectItem value="increasePercent">Increase by Percent</SelectItem>
                        <SelectItem value="decreasePercent">Decrease by Percent</SelectItem>
                        <SelectItem value="set">Set to Value</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={bulkPriceForm.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-price-value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" data-testid="button-submit-bulk-price">
                  Update Prices
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Stock Preview Dialog */}
      <Dialog open={showBulkPreview} onOpenChange={setShowBulkPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Stock Changes</DialogTitle>
            <DialogDescription>
              Review changes before applying to {bulkPreviewData.length} products
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead className="text-right">New Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bulkPreviewData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right font-mono">{item.currentStock}</TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={item.change > 0 ? "text-green-600" : item.change < 0 ? "text-red-600" : ""}>
                        {item.change > 0 ? '+' : ''}{item.change}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">{item.newStock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkPreview(false)}>
              Cancel
            </Button>
            <Button onClick={confirmBulkStockAdjustment}>
              Confirm Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Generation Dialog */}
      <Dialog open={showBulkActionDialog === 'barcode'} onOpenChange={() => setShowBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Barcodes</DialogTitle>
            <DialogDescription>
              Generate barcodes for {selectedIds.size} selected products
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Barcodes will be automatically generated for products that don't have one.
              Existing barcodes will not be overwritten.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkActionDialog(null)}>
              Cancel
            </Button>
            <Button onClick={generateBarcodesForSelected}>
              Generate Barcodes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showBulkActionDialog === 'export'} onOpenChange={() => setShowBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Selected Products</DialogTitle>
            <DialogDescription>
              Export {selectedIds.size} selected products
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => exportSelected('csv')}>
                CSV
              </Button>
              <Button variant="outline" onClick={() => exportSelected('excel')}>
                Excel
              </Button>
              <Button variant="outline" onClick={() => exportSelected('pdf')}>
                PDF
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkActionDialog(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} selected products. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search and Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products by name, brand, model, SKU, or IMEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-products"
                autoComplete="off"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {products.length} products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Products</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? "Try adjusting your search" : "Add your first product to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredProducts.length}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(product.id)}
                        onCheckedChange={(e) => {
                          const event = (e as any).nativeEvent || (e as any);
                          toggleSelection(product.id, index, event?.shiftKey || false);
                        }}
                        data-testid={`checkbox-product-${product.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-name-${product.id}`}>{product.name}</TableCell>
                    <TableCell data-testid={`text-brand-${product.id}`}>{product.brand || '-'}</TableCell>
                    <TableCell className="font-mono text-sm" data-testid={`text-model-${product.id}`}>{product.model || '-'}</TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-price-${product.id}`}>₹{product.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right" data-testid={`text-stock-${product.id}`}>
                      <Badge variant={product.stockQuantity < 5 ? "destructive" : product.stockQuantity < 10 ? "secondary" : "default"}>
                        {product.stockQuantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStockAdjust(product)}
                          data-testid={`button-stock-${product.id}`}
                          title="Adjust Stock"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
                          data-testid={`button-edit-${product.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

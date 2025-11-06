
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  brand: string;
  model: string;
  price: number;
  stock: number;
  imei?: string;
}

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const form = useForm({
    defaultValues: {
      name: "",
      brand: "",
      model: "",
      price: 0,
      stock: 0,
      imei: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create product");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product added successfully" });
      setIsAddDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update product");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product updated successfully" });
      setEditingProduct(null);
      form.reset();
    },
  });

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = (data: any) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    form.reset(product);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <Dialog open={isAddDialogOpen || !!editingProduct} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingProduct(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update product details" : "Enter product information to add to inventory"}
              </DialogDescription>
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
                          <Input placeholder="iPhone 14 Pro" {...field} />
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
                          <Input placeholder="Apple" {...field} />
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
                          <Input placeholder="A2890" {...field} />
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
                          <Input type="number" placeholder="79999" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imei"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMEI (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789012345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingProduct ? "Update Product" : "Add Product"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products by name, brand, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
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
              {products.reduce((sum, p) => sum + p.stock, 0)}
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
                  <TableHead>Product Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell className="font-mono text-sm">{product.model}</TableCell>
                    <TableCell className="text-right font-mono">₹{product.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={product.stock < 5 ? "destructive" : product.stock < 10 ? "secondary" : "default"}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
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

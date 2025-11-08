import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Save, X, Plus, Trash2, Upload, Star, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

// Sample suppliers - in production, this would come from the database
const suppliers = [
  { id: 1, name: "ABC Electronics", code: "ABC001" },
  { id: 2, name: "XYZ Distributors", code: "XYZ002" },
  { id: 3, name: "Global Tech Suppliers", code: "GTS003" },
  { id: 4, name: "Mobile World Wholesale", code: "MWW004" },
  { id: 5, name: "Smart Devices Inc", code: "SDI005" },
];

const productSchema = z.object({
  // Step 1: Basic Information
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().optional(),
  productCode: z.string().optional(),
  imeiNumber: z.string().optional(),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),

  // Step 2: Pricing
  costPrice: z.number().min(0, "Cost price must be positive"),
  price: z.number().min(0, "Selling price must be positive"),
  salesDiscount: z.number().min(0).max(100).optional(),
  hsnCode: z.string().optional(),

  // Step 3: Stock
  stockQuantity: z.number().min(0, "Stock quantity cannot be negative"),
  minStockLevel: z.number().min(0).optional(),
  purchaseUnit: z.string().optional(),
  salesUnit: z.string().optional(),

  // Step 4: Additional Details
  warrantyMonths: z.number().min(0).optional(),
  color: z.string().optional(),
  storage: z.string().optional(),
  ram: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),

  // Supplier Information
  supplierId: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const CATEGORIES = [
  "Smartphones",
  "Feature Phones",
  "Accessories",
  "Spare Parts",
  "Tablets",
  "Smartwatches",
  "Audio Devices"
];

const BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Oppo", "Vivo", "Realme",
  "OnePlus", "Motorola", "Nokia", "Google", "Others"
];

const UNITS = ["Piece", "Box", "Set", "Pair", "Pack"];

export default function AddProduct() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageFiles, setImageFiles] = useState<Array<{ id: string; file: File; preview: string; isPrimary: boolean }>>([]);
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      stockQuantity: 0,
      minStockLevel: 5,
      warrantyMonths: 12,
      salesDiscount: 0,
      isActive: true,
      supplierId: "",
    },
  });

  const createProduct = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      navigate("/inventory");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    createProduct.mutate(data);
  };

  const handleNext = async () => {
    const fieldsToValidate = getStepFields(currentStep);
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepFields = (step: number): (keyof ProductFormData)[] => {
    switch (step) {
      case 1:
        return ["name", "category", "brand", "model"];
      case 2:
        return ["costPrice", "price"];
      case 3:
        return ["stockQuantity"];
      default:
        return [];
    }
  };

  const generateSKU = () => {
    const brand = form.getValues("brand") || "XX";
    const category = form.getValues("category") || "XX";
    const random = Math.floor(Math.random() * 10000);
    const sku = `${brand.substring(0, 3).toUpperCase()}-${category.substring(0, 3).toUpperCase()}-${random}`;
    form.setValue("productCode", sku);
  };

  const generateBarcode = () => {
    const barcode = `${Date.now()}${Math.floor(Math.random() * 1000)}`.substring(0, 13);
    form.setValue("imeiNumber", barcode);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.slice(0, 10 - imageFiles.length).map((file) => ({
      id: Math.random().toString(36),
      file,
      preview: URL.createObjectURL(file),
      isPrimary: imageFiles.length === 0,
    }));
    setImageFiles([...imageFiles, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImageFiles(imageFiles.filter(img => img.id !== id));
  };

  const setPrimaryImage = (id: string) => {
    setImageFiles(imageFiles.map(img => ({
      ...img,
      isPrimary: img.id === id
    })));
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: "", value: "" }]);
  };

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const updateSpecification = (index: number, field: "key" | "value", value: string) => {
    const updated = [...specifications];
    updated[index][field] = value;
    setSpecifications(updated);
  };

  const calculateProfitMargin = () => {
    const costPrice = form.watch("costPrice") || 0;
    const sellingPrice = form.watch("price") || 0;

    if (costPrice === 0) return 0;

    const margin = ((sellingPrice - costPrice) / costPrice) * 100;
    return margin;
  };

  const profitMargin = calculateProfitMargin();
  const profitColor = profitMargin < 10 ? "text-red-600" : profitMargin < 25 ? "text-yellow-600" : "text-green-600";

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/inventory")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-2">Add New Product</h1>
        <p className="text-muted-foreground">Fill in the details to add a new product to your inventory</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: "Basic Info" },
            { num: 2, label: "Pricing" },
            { num: 3, label: "Stock" },
            { num: 4, label: "Details" },
            { num: 5, label: "Images" },
          ].map((step, index) => (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step.num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.num}
                </div>
                <span className={`mt-2 text-sm ${currentStep >= step.num ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
              {index < 4 && (
                <div className={`h-1 flex-1 mx-2 ${currentStep > step.num ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Enter the fundamental product details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="e.g., iPhone 15 Pro Max"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select onValueChange={(value) => form.setValue("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Select onValueChange={(value) => form.setValue("brand", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANDS.map((brand) => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.brand && (
                    <p className="text-sm text-destructive">{form.formState.errors.brand.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    {...form.register("model")}
                    placeholder="e.g., A2894"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productCode">SKU/Product Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="productCode"
                      {...form.register("productCode")}
                      placeholder="Auto-generated or custom"
                    />
                    <Button type="button" variant="outline" onClick={generateSKU}>
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imeiNumber">Barcode/IMEI</Label>
                  <div className="flex gap-2">
                    <Input
                      id="imeiNumber"
                      {...form.register("imeiNumber")}
                      placeholder="Scan or enter manually"
                    />
                    <Button type="button" variant="outline" onClick={generateBarcode}>
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Brief product description (max 500 characters)"
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {form.watch("description")?.length || 0}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Pricing Information */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing Information</CardTitle>
              <CardDescription>Set purchase price, selling price, and tax details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Purchase Price (₹) *</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    {...form.register("costPrice", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {form.formState.errors.costPrice && (
                    <p className="text-sm text-destructive">{form.formState.errors.costPrice.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Selling Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...form.register("price", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {form.formState.errors.price && (
                    <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salesDiscount">Discount (%)</Label>
                  <Input
                    id="salesDiscount"
                    type="number"
                    step="0.01"
                    {...form.register("salesDiscount", { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hsnCode">HSN Code</Label>
                  <Input
                    id="hsnCode"
                    {...form.register("hsnCode")}
                    placeholder="e.g., 8517"
                  />
                </div>
              </div>

              {/* Profit Margin Display */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Profit Margin:</span>
                    <span className={`font-bold text-lg ${profitColor}`}>
                      {profitMargin.toFixed(2)}%
                    </span>
                  </div>
                  {profitMargin < 10 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Low profit margin. Consider reviewing the pricing.
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Stock Management */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Stock Management</CardTitle>
              <CardDescription>Configure inventory and stock levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Opening Stock *</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    {...form.register("stockQuantity", { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {form.formState.errors.stockQuantity && (
                    <p className="text-sm text-destructive">{form.formState.errors.stockQuantity.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaseUnit">Unit of Measurement</Label>
                  <Select onValueChange={(value) => form.setValue("purchaseUnit", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    {...form.register("minStockLevel", { valueAsNumber: true })}
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert will be triggered when stock falls below this level
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salesUnit">Sales Unit</Label>
                  <Select onValueChange={(value) => form.setValue("salesUnit", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Additional Details */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>Warranty, specifications, and other information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Warranty Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warrantyMonths">Warranty Period (Months)</Label>
                    <Input
                      id="warrantyMonths"
                      type="number"
                      {...form.register("warrantyMonths", { valueAsNumber: true })}
                      placeholder="12"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Product Specifications</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addSpecification}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Specification
                  </Button>
                </div>
                {specifications.map((spec, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Specification name (e.g., Display)"
                      value={spec.key}
                      onChange={(e) => updateSpecification(index, "key", e.target.value)}
                    />
                    <Input
                      placeholder="Value (e.g., 6.8'' AMOLED)"
                      value={spec.value}
                      onChange={(e) => updateSpecification(index, "value", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeSpecification(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      {...form.register("color")}
                      placeholder="e.g., Midnight Black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storage">Storage</Label>
                    <Input
                      id="storage"
                      {...form.register("storage")}
                      placeholder="e.g., 256GB"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ram">RAM</Label>
                    <Input
                      id="ram"
                      {...form.register("ram")}
                      placeholder="e.g., 8GB"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Status & Visibility</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={form.watch("isActive")}
                    onCheckedChange={(checked) => form.setValue("isActive", checked as boolean)}
                  />
                  <Label htmlFor="isActive">Active (visible in inventory)</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Images Upload */}
        {currentStep === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>Upload product images (max 10 images, 5MB each)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drag & drop images here or click to browse
                </p>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Label htmlFor="image-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>Choose Files</span>
                  </Button>
                </Label>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG, WebP (max 5MB per image)
                </p>
              </div>

              {imageFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {imageFiles.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt="Product"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {img.isPrimary && (
                        <Badge className="absolute top-2 left-2" variant="default">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!img.isPrimary && (
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            onClick={() => setPrimaryImage(img.id)}
                            className="h-8 w-8"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => removeImage(img.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/inventory")}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            {currentStep < 5 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={createProduct.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {createProduct.isPending ? "Saving..." : "Save Product"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
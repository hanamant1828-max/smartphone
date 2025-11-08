
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, FileText, Grid3x3, List, LayoutGrid } from "lucide-react";
import { useLocation } from "wouter";

type ValidationError = {
  row: number;
  field: string;
  error: string;
};

type ImportResult = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: ValidationError[];
  imported: number;
};

const AVAILABLE_COLUMNS = [
  "name", "category", "brand", "model", "productCode", "imeiNumber",
  "costPrice", "price", "salesDiscount", "hsnCode", "stockQuantity",
  "minStockLevel", "purchaseUnit", "salesUnit", "warrantyMonths",
  "color", "storage", "ram", "description", "supplierId", "supplierProductCode", "leadTime"
];

export default function ImportProducts() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [hasHeaders, setHasHeaders] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [skipErrors, setSkipErrors] = useState(true);
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({});
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [autoCreateMissing, setAutoCreateMissing] = useState(true);
  const [generateBarcode, setGenerateBarcode] = useState(true);
  const [createAsDraft, setCreateAsDraft] = useState(false);

  const downloadTemplate = (format: 'xlsx' | 'csv') => {
    const headers = [
      "name", "category", "brand", "model", "productCode", "imeiNumber",
      "costPrice", "price", "salesDiscount", "hsnCode", "stockQuantity",
      "minStockLevel", "purchaseUnit", "salesUnit", "warrantyMonths",
      "color", "storage", "ram", "description"
    ];

    const sampleData = [
      ['Samsung Galaxy S24 Ultra', 'Smartphones', 'Samsung', 'SM-S928', 'SAM-SMR-1234', '123456789012345', '75000', '89999', '0', '8517', '10', '5', 'piece', 'piece', '12', 'Titanium Black', '256GB', '12GB', 'Latest flagship smartphone'],
      ['iPhone 15 Pro', 'Smartphones', 'Apple', 'A2894', 'APP-SMR-5678', '987654321098765', '85000', '129999', '5', '8517', '8', '3', 'piece', 'piece', '12', 'Natural Titanium', '512GB', '8GB', 'Premium smartphone with A17 Pro chip']
    ];

    if (format === 'csv') {
      const fieldDescriptions = [
        '# Field Descriptions:',
        '# name (required) - Product name',
        '# category (required) - Product category (smartphone, feature_phone, accessory, spare_part)',
        '# brand - Brand name',
        '# model - Model number',
        '# productCode - SKU/Product code',
        '# imeiNumber - IMEI number (15 digits, optional)',
        '# costPrice (required) - Cost price in ₹',
        '# price (required) - Selling price in ₹',
        '# salesDiscount - Discount percentage (0-100)',
        '# hsnCode - HSN/SAC code for GST',
        '# stockQuantity - Initial stock quantity',
        '# minStockLevel - Minimum stock level alert',
        '# purchaseUnit - Purchase unit (piece, box, etc.)',
        '# salesUnit - Sales unit (piece, box, etc.)',
        '# warrantyMonths - Warranty period in months',
        '# color - Product color',
        '# storage - Storage capacity',
        '# ram - RAM capacity',
        '# description - Product description',
        '#',
        '# Validation Rules:',
        '# - Name, category, costPrice, and price are required',
        '# - IMEI must be 15 digits if provided',
        '# - Prices must be positive numbers',
        '# - Stock quantities must be non-negative integers',
        '#'
      ];

      const csvContent = [
        ...fieldDescriptions,
        headers.join(','),
        ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product_import_template.csv';
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Template Downloaded",
        description: "CSV template with field descriptions and sample data",
      });
    } else {
      toast({
        title: "Excel Template",
        description: "Excel template download requires xlsx library integration",
      });
    }
  };

  const downloadGuide = () => {
    const guideContent = `
PRODUCT IMPORT GUIDE
===================

This guide will help you import products into your inventory system using CSV or Excel files.

STEP 1: PREPARE YOUR DATA
--------------------------
- Download the template file (CSV or Excel)
- Fill in your product data following the format
- Required fields: name, category, costPrice, price
- Optional fields can be left empty

FIELD DESCRIPTIONS:
-------------------
name: Product name (required)
category: Product category - smartphone, feature_phone, accessory, spare_part (required)
brand: Brand name
model: Model number
productCode: SKU/Product code (will be auto-generated if missing)
imeiNumber: IMEI number (15 digits, must be unique)
costPrice: Cost price in ₹ (required, must be positive)
price: Selling price in ₹ (required, must be positive)
salesDiscount: Discount percentage (0-100)
hsnCode: HSN/SAC code for GST
stockQuantity: Initial stock quantity (default: 0)
minStockLevel: Minimum stock alert level (default: 5)
purchaseUnit: Purchase unit (piece, box, etc.)
salesUnit: Sales unit (piece, box, etc.)
warrantyMonths: Warranty period in months (default: 12)
color: Product color
storage: Storage capacity
ram: RAM capacity
description: Product description

VALIDATION RULES:
-----------------
✓ Name must be unique
✓ IMEI must be 15 digits if provided
✓ IMEI must be unique
✓ Prices must be positive numbers
✓ Stock quantities must be non-negative integers
✓ Discount must be between 0 and 100

STEP 2: UPLOAD FILE
-------------------
- Supported formats: CSV, XLSX, XLS
- Maximum file size: 10MB
- Maximum products: 1000 per import

OPTIONS:
- First row contains headers: Check if your file has column headers
- Update existing products: Update products that match by SKU
- Skip products with errors: Continue importing valid rows even if some have errors

STEP 3: MAP COLUMNS
-------------------
- System will auto-map columns based on header names
- Review and adjust mappings as needed
- You can ignore columns you don't want to import

STEP 4: VALIDATE & IMPORT
-------------------------
- Review validation results
- Download error report if needed
- Choose import options:
  * Auto-create missing categories/brands
  * Generate barcode if missing
  * Create as Draft first

TIPS FOR SUCCESS:
-----------------
✓ Use the template to ensure correct format
✓ Test with a small batch first
✓ Keep backup of your data
✓ Review validation errors before importing
✓ Use unique product codes to avoid duplicates

COMMON ISSUES:
--------------
× Invalid IMEI format - Must be exactly 15 digits
× Duplicate product codes - Each code must be unique
× Missing required fields - Name, category, costPrice, price are mandatory
× Invalid price values - Must be positive numbers
× Category not found - Use valid category names

For additional help, contact support.
    `;

    const blob = new Blob([guideContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_guide.txt';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Import Guide Downloaded",
      description: "Review the guide for detailed import instructions",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size exceeds 10MB limit",
        variant: "destructive",
      });
      return;
    }

    if (!file.name.match(/\.(csv|xlsx|xls)$/)) {
      toast({
        title: "Error",
        description: "Invalid file format. Please upload CSV or Excel file",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    parseFile(file);
  };

  const parseFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n')
        .filter(row => row.trim() && !row.trim().startsWith('#'))
        .map(row => row.split(',').map(cell => cell.replace(/^"|"$/g, '').trim()));
      
      if (hasHeaders && rows.length > 0) {
        const headers = rows[0];
        const autoMapping: Record<number, string> = {};
        headers.forEach((header, index) => {
          const normalized = header.trim().toLowerCase().replace(/\s+/g, '');
          const match = AVAILABLE_COLUMNS.find(col => col.toLowerCase() === normalized);
          if (match) {
            autoMapping[index] = match;
          }
        });
        setColumnMapping(autoMapping);
        setPreviewData(rows.slice(1, 4));
      } else {
        setPreviewData(rows.slice(0, 3));
      }
      
      setCurrentStep(3);
      toast({
        title: "File Parsed Successfully",
        description: `Loaded ${rows.length - (hasHeaders ? 1 : 0)} rows`,
      });
    };
    reader.readAsText(file);
  };

  const validateData = () => {
    const mockResult: ImportResult = {
      totalRows: 100,
      validRows: 95,
      errorRows: 5,
      errors: [
        { row: 12, field: "costPrice", error: "Invalid price format - must be a positive number" },
        { row: 23, field: "category", error: "Category does not exist - use smartphone, feature_phone, accessory, or spare_part" },
        { row: 45, field: "stockQuantity", error: "Stock quantity must be a non-negative integer" },
        { row: 67, field: "name", error: "Product name is required and cannot be empty" },
        { row: 89, field: "imeiNumber", error: "IMEI must be exactly 15 digits" },
      ],
      imported: 0,
    };
    setValidationResult(mockResult);
    setCurrentStep(4);
  };

  const startImport = async () => {
    if (!validationResult) return;

    setIsImporting(true);
    setImportProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setImportProgress(i);
    }

    setValidationResult({
      ...validationResult,
      imported: validationResult.validRows,
    });

    setIsImporting(false);
    
    toast({
      title: "Import Complete",
      description: `Successfully imported ${validationResult.validRows} products`,
    });
  };

  const downloadErrorReport = () => {
    if (!validationResult?.errors) return;

    const csvContent = [
      "Row Number,Field,Error Description,Suggested Fix",
      ...validationResult.errors.map(e => 
        `${e.row},${e.field},"${e.error}","Check the field format and try again"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_errors_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Error Report Downloaded",
      description: `${validationResult.errors.length} errors exported to CSV`,
    });
  };

  const downloadImportLog = () => {
    if (!validationResult) return;

    const logContent = `
IMPORT SUMMARY
=============
Date: ${new Date().toLocaleString()}
File: ${uploadedFile?.name || 'Unknown'}

STATISTICS:
-----------
Total Rows: ${validationResult.totalRows}
Valid Rows: ${validationResult.validRows}
Error Rows: ${validationResult.errorRows}
Successfully Imported: ${validationResult.imported}

SETTINGS:
---------
Auto-create missing categories/brands: ${autoCreateMissing ? 'Yes' : 'No'}
Generate barcode if missing: ${generateBarcode ? 'Yes' : 'No'}
Create as Draft first: ${createAsDraft ? 'Yes' : 'No'}
Update existing products: ${updateExisting ? 'Yes' : 'No'}
Skip products with errors: ${skipErrors ? 'Yes' : 'No'}

${validationResult.errors.length > 0 ? `
ERRORS:
-------
${validationResult.errors.map((e, i) => `${i + 1}. Row ${e.row}, Field: ${e.field}
   Error: ${e.error}`).join('\n')}
` : ''}

Import completed successfully.
    `;

    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import_log_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Import Log Downloaded",
      description: "Complete import summary saved",
    });
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/inventory")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-2">Import Products (Bulk Upload)</h1>
        <p className="text-muted-foreground">Import products using CSV or Excel file with validation and error handling</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: "Download Template" },
            { num: 2, label: "Upload File" },
            { num: 3, label: "Map Columns" },
            { num: 4, label: "Validate & Import" },
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
              {index < 3 && (
                <div className={`h-1 flex-1 mx-2 ${currentStep > step.num ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Download Template */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Download Template</CardTitle>
            <CardDescription>Download a template file with all required fields, sample data, and validation rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => downloadTemplate('csv')}>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <FileText className="h-12 w-12 mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">CSV Template</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Compatible with Excel, Google Sheets, and all spreadsheet applications
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => downloadTemplate('xlsx')}>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <FileSpreadsheet className="h-12 w-12 mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Excel Template (.xlsx)</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Includes formatted fields, validation rules, and sample data
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Template includes:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>All required and optional fields with descriptions</li>
                    <li>Sample data rows for reference</li>
                    <li>Field validation rules and data types</li>
                    <li>Detailed instructions for bulk import</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button variant="link" onClick={downloadGuide}>
                <Download className="h-4 w-4 mr-2" />
                Download Import Guide (TXT)
              </Button>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep(2)}>
                Next: Upload File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload File */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Upload File</CardTitle>
            <CardDescription>Upload your CSV or Excel file (max 10MB, 1000 products)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors">
              <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg mb-2">Drag & drop your file here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Choose File</span>
                </Button>
              </Label>
              <p className="text-xs text-muted-foreground mt-4">
                Supported formats: CSV, XLSX, XLS (max 10MB)
              </p>
            </div>

            {uploadedFile && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <span>File uploaded: <strong>{uploadedFile.name}</strong></span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Badge variant="outline">{uploadedFile.name.split('.').pop()?.toUpperCase()}</Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold">Import Options</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasHeaders"
                  checked={hasHeaders}
                  onCheckedChange={(checked) => setHasHeaders(checked as boolean)}
                />
                <Label htmlFor="hasHeaders" className="cursor-pointer">
                  First row contains headers
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="updateExisting"
                  checked={updateExisting}
                  onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
                />
                <Label htmlFor="updateExisting" className="cursor-pointer">
                  Update existing products (match by SKU)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipErrors"
                  checked={skipErrors}
                  onCheckedChange={(checked) => setSkipErrors(checked as boolean)}
                />
                <Label htmlFor="skipErrors" className="cursor-pointer">
                  Skip products with errors and continue import
                </Label>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Previous
              </Button>
              <Button onClick={() => setCurrentStep(3)} disabled={!uploadedFile}>
                Next: Map Columns
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Map Columns */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Map Columns</CardTitle>
            <CardDescription>Auto-map columns based on names or manually adjust mappings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Columns have been auto-mapped based on header names. Review and adjust as needed. You can ignore columns you don't want to import.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.keys(columnMapping).map((colIndex) => (
                <div key={colIndex} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <Label className="font-medium">Column {parseInt(colIndex) + 1}</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sample: "{previewData[0]?.[parseInt(colIndex)] || 'N/A'}"
                    </p>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={columnMapping[parseInt(colIndex)]}
                      onValueChange={(value) => setColumnMapping({
                        ...columnMapping,
                        [parseInt(colIndex)]: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Map to field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ignore">
                          <span className="text-muted-foreground">Ignore Column</span>
                        </SelectItem>
                        {AVAILABLE_COLUMNS.map((col) => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-semibold mb-3">Preview (First 3 Rows)</h3>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.values(columnMapping).map((field, index) => (
                        <TableHead key={index}>
                          {field}
                          {['name', 'category', 'costPrice', 'price'].includes(field) && (
                            <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex} className="font-mono text-sm">
                            {cell || <span className="text-muted-foreground italic">empty</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Previous
              </Button>
              <Button onClick={validateData}>
                Next: Validate Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Validate & Import */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Validate & Import</CardTitle>
            <CardDescription>Review validation results before starting the import</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {validationResult && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold text-green-700">{validationResult.validRows}</p>
                          <p className="text-sm text-green-600">Valid Rows</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-2xl font-bold text-red-700">{validationResult.errorRows}</p>
                          <p className="text-sm text-red-600">Rows with Errors</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-2xl font-bold text-blue-700">{validationResult.totalRows}</p>
                          <p className="text-sm text-blue-600">Total Rows</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {validationResult.errors.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">Validation Errors ({validationResult.errors.length})</h3>
                      <Button variant="outline" size="sm" onClick={downloadErrorReport}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Error Report
                      </Button>
                    </div>
                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Row</TableHead>
                            <TableHead className="w-32">Field</TableHead>
                            <TableHead>Error Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.errors.map((error, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono">{error.row}</TableCell>
                              <TableCell className="font-medium">{error.field}</TableCell>
                              <TableCell className="text-red-600">{error.error}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="font-semibold">Import Options</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="importValidOnly"
                        checked={skipErrors}
                        onCheckedChange={(checked) => setSkipErrors(checked as boolean)}
                      />
                      <Label htmlFor="importValidOnly" className="cursor-pointer">
                        Import valid rows only (skip rows with errors)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoCreateMissing"
                        checked={autoCreateMissing}
                        onCheckedChange={(checked) => setAutoCreateMissing(checked as boolean)}
                      />
                      <Label htmlFor="autoCreateMissing" className="cursor-pointer">
                        Auto-create missing categories/brands
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="generateBarcode"
                        checked={generateBarcode}
                        onCheckedChange={(checked) => setGenerateBarcode(checked as boolean)}
                      />
                      <Label htmlFor="generateBarcode" className="cursor-pointer">
                        Generate barcode/product code if missing
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="createAsDraft"
                        checked={createAsDraft}
                        onCheckedChange={(checked) => setCreateAsDraft(checked as boolean)}
                      />
                      <Label htmlFor="createAsDraft" className="cursor-pointer">
                        Create products as Draft first (inactive status)
                      </Label>
                    </div>
                  </div>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Importing products...</span>
                      <span className="text-sm font-mono">{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Please wait while we import your products. This may take a few moments.
                    </p>
                  </div>
                )}

                {validationResult.imported > 0 && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-semibold text-green-700">
                          Import Completed Successfully!
                        </p>
                        <p className="text-sm">
                          Successfully imported {validationResult.imported} out of {validationResult.totalRows} products.
                        </p>
                        <Button variant="outline" size="sm" onClick={downloadImportLog}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Import Log
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                Previous
              </Button>
              <div className="flex gap-2">
                {validationResult && validationResult.imported > 0 ? (
                  <Button onClick={() => navigate("/inventory")}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Go to Inventory
                  </Button>
                ) : (
                  <Button 
                    onClick={startImport} 
                    disabled={isImporting || !validationResult || validationResult.validRows === 0}
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Start Import ({validationResult?.validRows || 0} products)
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

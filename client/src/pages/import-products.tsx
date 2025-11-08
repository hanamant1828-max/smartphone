
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
import { ArrowLeft, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, FileText } from "lucide-react";
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
      "minStockLevel", "warrantyMonths", "color", "storage", "ram", "description"
    ];

    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        'Samsung Galaxy S24 Ultra,Smartphones,Samsung,SM-S928,SAM-SMR-1234,123456789012345,75000,89999,0,8517,10,5,12,Titanium Black,256GB,12GB,Latest flagship smartphone',
        'iPhone 15 Pro,Smartphones,Apple,A2894,APP-SMR-5678,987654321098765,85000,129999,5,8517,8,3,12,Natural Titanium,512GB,8GB,Premium smartphone with A17 Pro chip'
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product_import_template.csv';
      a.click();
    } else {
      toast({
        title: "Excel Download",
        description: "Excel template download would be implemented with a library like xlsx",
      });
    }
  };

  const downloadGuide = () => {
    toast({
      title: "Import Guide",
      description: "Import guide PDF download would be implemented",
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
      const rows = text.split('\n').map(row => row.split(','));
      
      // Auto-detect headers and preview first 3 rows
      if (hasHeaders) {
        const headers = rows[0];
        const autoMapping: Record<number, string> = {};
        headers.forEach((header, index) => {
          const normalized = header.trim().toLowerCase();
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
    };
    reader.readAsText(file);
  };

  const validateData = () => {
    // Simulate validation
    const mockResult: ImportResult = {
      totalRows: 100,
      validRows: 95,
      errorRows: 5,
      errors: [
        { row: 12, field: "costPrice", error: "Invalid price format" },
        { row: 23, field: "category", error: "Category does not exist" },
        { row: 45, field: "stockQuantity", error: "Stock quantity must be a number" },
        { row: 67, field: "name", error: "Product name is required" },
        { row: 89, field: "brand", error: "Brand does not exist" },
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

    // Simulate import progress
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
      "Row,Field,Error",
      ...validationResult.errors.map(e => `${e.row},${e.field},${e.error}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_errors.csv';
    a.click();
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

        <h1 className="text-3xl font-bold mb-2">Import Products</h1>
        <p className="text-muted-foreground">Bulk upload products using CSV or Excel file</p>
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
            <CardTitle>Download Import Template</CardTitle>
            <CardDescription>Download a template file with all required fields and sample data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:border-primary" onClick={() => downloadTemplate('csv')}>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <FileText className="h-12 w-12 mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">CSV Template</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Compatible with Excel, Google Sheets, and all spreadsheet applications
                  </p>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary" onClick={() => downloadTemplate('xlsx')}>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <FileSpreadsheet className="h-12 w-12 mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">Excel Template</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Includes formatted fields, validation rules, and sample data
                  </p>
                  <Button variant="outline">
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
                    <li>Instructions for bulk import</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button variant="link" onClick={downloadGuide}>
                <Download className="h-4 w-4 mr-2" />
                Download Import Guide (PDF)
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
            <CardTitle>Upload File</CardTitle>
            <CardDescription>Upload your CSV or Excel file (max 10MB, 1000 products)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
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
                    <span>File uploaded: <strong>{uploadedFile.name}</strong></span>
                    <Badge>{(uploadedFile.size / 1024).toFixed(2)} KB</Badge>
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
                <Label htmlFor="hasHeaders">First row contains headers</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="updateExisting"
                  checked={updateExisting}
                  onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
                />
                <Label htmlFor="updateExisting">Update existing products (match by SKU)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skipErrors"
                  checked={skipErrors}
                  onCheckedChange={(checked) => setSkipErrors(checked as boolean)}
                />
                <Label htmlFor="skipErrors">Skip products with errors</Label>
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
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>Map your file columns to product fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Columns have been auto-mapped based on header names. Review and adjust as needed.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {Object.keys(columnMapping).map((colIndex) => (
                <div key={colIndex} className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Column {parseInt(colIndex) + 1}</Label>
                    <p className="text-sm text-muted-foreground">
                      {previewData[0]?.[parseInt(colIndex)] || 'N/A'}
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
                        <SelectItem value="ignore">Ignore Column</SelectItem>
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
              <h3 className="font-semibold mb-2">Preview (First 3 Rows)</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.values(columnMapping).map((field, index) => (
                      <TableHead key={index}>{field}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <CardTitle>Validate & Import</CardTitle>
            <CardDescription>Review validation results and start import</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {validationResult && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold">{validationResult.validRows}</p>
                          <p className="text-sm text-muted-foreground">Valid Rows</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-2xl font-bold">{validationResult.errorRows}</p>
                          <p className="text-sm text-muted-foreground">Rows with Errors</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-2xl font-bold">{validationResult.totalRows}</p>
                          <p className="text-sm text-muted-foreground">Total Rows</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {validationResult.errors.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Validation Errors</h3>
                      <Button variant="outline" size="sm" onClick={downloadErrorReport}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Error Report
                      </Button>
                    </div>
                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Row</TableHead>
                            <TableHead>Field</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.errors.map((error, index) => (
                            <TableRow key={index}>
                              <TableCell>{error.row}</TableCell>
                              <TableCell>{error.field}</TableCell>
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
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoCreateMissing"
                      checked={autoCreateMissing}
                      onCheckedChange={(checked) => setAutoCreateMissing(checked as boolean)}
                    />
                    <Label htmlFor="autoCreateMissing">Auto-create missing categories/brands</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="generateBarcode"
                      checked={generateBarcode}
                      onCheckedChange={(checked) => setGenerateBarcode(checked as boolean)}
                    />
                    <Label htmlFor="generateBarcode">Generate barcode if missing</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createAsDraft"
                      checked={createAsDraft}
                      onCheckedChange={(checked) => setCreateAsDraft(checked as boolean)}
                    />
                    <Label htmlFor="createAsDraft">Create as Draft first</Label>
                  </div>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Importing products...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )}

                {validationResult.imported > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Successfully imported {validationResult.imported} products!
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
                    Go to Inventory
                  </Button>
                ) : (
                  <Button onClick={startImport} disabled={isImporting || !validationResult}>
                    {isImporting ? "Importing..." : "Start Import"}
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

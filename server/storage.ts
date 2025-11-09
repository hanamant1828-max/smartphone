import {
  users,
  products,
  customers,
  sales,
  saleItems,
  stockAdjustments,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Customer,
  type InsertCustomer,
  type Sale,
  type InsertSale,
  type SaleItem,
  type InsertSaleItem,
  type StockAdjustment,
  type InsertStockAdjustment,
} from "@shared/schema";
import * as schema from "@shared/schema"; // Import schema for type safety
import { db } from "./db";
import { eq, desc, gte, lte, and, sql, count, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Product operations
  getProducts(filters?: any): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getLowStockProducts(): Promise<Product[]>;

  // Bulk operations
  bulkDeleteProducts(productIds: number[]): Promise<void>;
  bulkUpdateProducts(productIds: number[], updates: Partial<InsertProduct>): Promise<void>;
  bulkUpdatePrices(productIds: number[], field: string, operation: string, value: number): Promise<void>;

  // Stock adjustment operations
  createStockAdjustment(adjustment: InsertStockAdjustment): Promise<StockAdjustment>;
  adjustStock(productId: number, userId: number, adjustmentType: string, quantity: number, reason: string, notes?: string, referenceNumber?: string): Promise<Product>;
  bulkAdjustStock(productIds: number[], userId: number, adjustmentType: string, quantity: number, reason: string, notes?: string): Promise<void>;

  // Customer operations
  getCustomers(filters?: any): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  getCustomerPurchases(customerId: number): Promise<Sale[]>;

  // Sales operations
  createSale(saleData: InsertSale & { items: InsertSaleItem[] }): Promise<Sale>;
  getSales(filters?: any): Promise<Sale[]>;
  getSale(id: number): Promise<Sale | undefined>;
  getSaleWithItems(id: number): Promise<(Sale & { items: any[] }) | undefined>;

  // Category operations
  getCategories(filters?: { active?: boolean }): Promise<schema.Category[]>;
  getCategory(id: number): Promise<schema.Category | undefined>;
  createCategory(data: schema.InsertCategory): Promise<schema.Category>;
  updateCategory(id: number, data: Partial<schema.InsertCategory>): Promise<schema.Category | undefined>;
  deleteCategory(id: number): Promise<void>;

  // Brand operations
  getBrands(filters?: { active?: boolean }): Promise<schema.Brand[]>;
  getBrand(id: number): Promise<schema.Brand | undefined>;
  createBrand(data: schema.InsertBrand): Promise<schema.Brand>;
  updateBrand(id: number, data: Partial<schema.InsertBrand>): Promise<schema.Brand | undefined>;
  deleteBrand(id: number): Promise<void>;

  // Model operations
  getModels(filters?: { brandId?: number; active?: boolean }): Promise<schema.Model[]>;
  getModel(id: number): Promise<schema.Model | undefined>;
  getModelWithVariants(id: number): Promise<(schema.Model & { variants: schema.ModelVariant[] }) | undefined>;
  createModel(data: schema.InsertModel & { variants?: schema.InsertModelVariant[] }): Promise<schema.Model>;
  updateModel(id: number, data: Partial<schema.InsertModel> & { variants?: schema.InsertModelVariant[] }): Promise<schema.Model | undefined>;
  deleteModel(id: number): Promise<void>;


  // Reports
  getDashboardStats(): Promise<any>;
  getSalesReport(startDate: string, endDate: string): Promise<any>;
  getInventoryReport(): Promise<any>;
  getCustomerReport(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Product operations
  async getProducts(filters?: any): Promise<Product[]> {
    let query = db.select().from(products);

    if (filters?.isActive !== undefined) {
      query = query.where(eq(products.isActive, filters.isActive)) as any;
    }

    const result = await query.orderBy(desc(products.createdAt));
    return result;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ ...data, updatedAt: Date.now() })
      .where(eq(products.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id));
    return true;
  }

  async getLowStockProducts(): Promise<Product[]> {
    const result = await db
      .select()
      .from(products)
      .where(
        and(
          sql`${products.stockQuantity} <= ${products.minStockLevel}`,
          eq(products.isActive, true)
        )
      );
    return result;
  }

  // Bulk operations
  async bulkDeleteProducts(productIds: number[]): Promise<void> {
    await db.delete(products).where(inArray(products.id, productIds));
  }

  async bulkUpdateProducts(productIds: number[], updates: Partial<InsertProduct>): Promise<void> {
    await db
      .update(products)
      .set({ ...updates, updatedAt: Date.now() })
      .where(inArray(products.id, productIds));
  }

  async bulkUpdatePrices(
    productIds: number[],
    field: string,
    operation: string,
    value: number
  ): Promise<void> {
    const products = await db.select().from(schema.products).where(inArray(schema.products.id, productIds));

    for (const product of products) {
      let newPrice: number;
      const currentPrice = (product as any)[field] || 0;

      switch (operation) {
        case 'increase':
          newPrice = currentPrice + value;
          break;
        case 'decrease':
          newPrice = Math.max(0, currentPrice - value);
          break;
        case 'increasePercent':
          newPrice = currentPrice * (1 + value / 100);
          break;
        case 'decreasePercent':
          newPrice = currentPrice * (1 - value / 100);
          break;
        case 'set':
          newPrice = value;
          break;
        default:
          throw new Error('Invalid operation');
      }

      await db.update(schema.products)
        .set({ [field]: newPrice, updatedAt: new Date() })
        .where(eq(schema.products.id, product.id));
    }
  }

  // Stock adjustment operations
  async createStockAdjustment(adjustment: InsertStockAdjustment): Promise<StockAdjustment> {
    const [newAdjustment] = await db
      .insert(stockAdjustments)
      .values(adjustment)
      .returning();
    return newAdjustment;
  }

  async adjustStock(
    productId: number,
    userId: number,
    adjustmentType: string,
    quantity: number,
    reason: string,
    notes?: string,
    referenceNumber?: string
  ): Promise<Product> {
    const product = await this.getProduct(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const quantityBefore = product.stockQuantity || 0;
    let quantityAfter = quantityBefore;
    let quantityChange = 0;

    switch (adjustmentType) {
      case 'add':
        quantityAfter = quantityBefore + quantity;
        quantityChange = quantity;
        break;
      case 'subtract':
        quantityAfter = Math.max(0, quantityBefore - quantity);
        quantityChange = -quantity;
        break;
      case 'set':
        quantityAfter = quantity;
        quantityChange = quantity - quantityBefore;
        break;
    }

    // Update product stock
    await db
      .update(products)
      .set({ stockQuantity: quantityAfter, updatedAt: Date.now() })
      .where(eq(products.id, productId));

    // Create adjustment log
    await this.createStockAdjustment({
      productId,
      userId,
      adjustmentType,
      quantityBefore,
      quantityAfter,
      quantityChange,
      reason,
      notes,
      referenceNumber,
      adjustmentDate: Date.now(),
    });

    const updatedProduct = await this.getProduct(productId);
    return updatedProduct!;
  }

  async bulkAdjustStock(
    productIds: number[],
    userId: number,
    adjustmentType: string,
    quantity: number,
    reason: string,
    notes?: string
  ): Promise<void> {
    for (const productId of productIds) {
      await this.adjustStock(productId, userId, adjustmentType, quantity, reason, notes);
    }
  }

  // Customer operations
  async getCustomers(filters?: any): Promise<Customer[]> {
    let query = db.select().from(customers);

    if (filters?.phone) {
      query = query.where(eq(customers.phone, filters.phone)) as any;
    }

    const result = await query.orderBy(desc(customers.createdAt));
    return result;
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set({ ...customer, updatedAt: Date.now() })
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }

  async getCustomerPurchases(customerId: number): Promise<Sale[]> {
    const result = await db
      .select()
      .from(sales)
      .where(eq(sales.customerId, customerId))
      .orderBy(desc(sales.createdAt));
    return result;
  }

  // Sales operations
  async createSale(saleData: InsertSale & { items: InsertSaleItem[] }): Promise<Sale> {
    const { items, ...saleInfo } = saleData;

    // Use database transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Insert sale
      const [sale] = await tx
        .insert(sales)
        .values(saleInfo)
        .returning();

      // Insert sale items
      if (items && items.length > 0) {
        const saleItemsWithSaleId = items.map(item => ({
          ...item,
          saleId: sale.id,
        }));

        await tx.insert(saleItems).values(saleItemsWithSaleId);

        // Update product stock for all items
        for (const item of items) {
          await tx
            .update(products)
            .set({
              stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
              updatedAt: Date.now(),
            })
            .where(eq(products.id, item.productId));
        }

        // Update customer total purchases if customer exists
        if (sale.customerId) {
          await tx
            .update(customers)
            .set({
              totalPurchases: sql`${customers.totalPurchases} + ${sale.totalAmount}`,
              updatedAt: Date.now(),
            })
            .where(eq(customers.id, sale.customerId));
        }
      }

      return sale;
    });

    return result;
  }

  async getSales(filters?: any): Promise<Sale[]> {
    let query = db.select().from(sales);

    if (filters?.startDate && filters?.endDate) {
      query = query.where(
        and(
          gte(sales.createdAt, new Date(filters.startDate).getTime()),
          lte(sales.createdAt, new Date(filters.endDate).getTime())
        )
      ) as any;
    }

    const result = await query.orderBy(desc(sales.createdAt));

    // Add item count and customer name
    const salesWithDetails = await Promise.all(
      result.map(async (sale) => {
        const items = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id));

        let customerName = null;
        if (sale.customerId) {
          const [customer] = await db.select().from(customers).where(eq(customers.id, sale.customerId));
          customerName = customer?.name || null;
        }

        return {
          ...sale,
          itemCount: items.length,
          customerName,
        };
      })
    );

    return salesWithDetails as any;
  }

  async getSale(id: number): Promise<Sale | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    return sale || undefined;
  }

  async getSaleWithItems(id: number): Promise<(Sale & { items: any[] }) | undefined> {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id));
    if (!sale) return undefined;

    const items = await db
      .select({
        id: saleItems.id,
        productId: saleItems.productId,
        quantity: saleItems.quantity,
        price: saleItems.price,
        costPrice: saleItems.costPrice,
        productName: products.name,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, id));

    let customerName = null;
    if (sale.customerId) {
      const [customer] = await db.select().from(customers).where(eq(customers.id, sale.customerId));
      customerName = customer?.name || null;
    }

    return {
      ...sale,
      customerName,
      items,
    } as any;
  }

  // Category operations
  async getCategories(filters?: any): Promise<any[]> {
    let query = db.select().from(schema.categories);

    if (filters?.active !== undefined) {
      query = query.where(eq(schema.categories.active, filters.active));
    }

    return await query.orderBy(schema.categories.displayOrder, schema.categories.name);
  }

  async getCategory(id: number): Promise<any | undefined> {
    const result = await db.select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);
    return result[0];
  }

  async createCategory(categoryData: any): Promise<any> {
    const result = await db.insert(schema.categories)
      .values({
        ...categoryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updateCategory(id: number, categoryData: any): Promise<any | undefined> {
    const result = await db.update(schema.categories)
      .set({
        ...categoryData,
        updatedAt: new Date(),
      })
      .where(eq(schema.categories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(schema.categories).where(eq(schema.categories.id, id));
    return true;
  }

  // Brand operations
  async getBrands(filters?: any): Promise<any[]> {
    let query = db.select().from(schema.brands);

    if (filters?.active !== undefined) {
      query = query.where(eq(schema.brands.active, filters.active));
    }

    return await query.orderBy(schema.brands.displayOrder, schema.brands.name);
  }

  async getBrand(id: number): Promise<any | undefined> {
    const result = await db.select()
      .from(schema.brands)
      .where(eq(schema.brands.id, id))
      .limit(1);
    return result[0];
  }

  async createBrand(brandData: any): Promise<any> {
    const result = await db.insert(schema.brands)
      .values({
        ...brandData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updateBrand(id: number, brandData: any): Promise<any | undefined> {
    const result = await db.update(schema.brands)
      .set({
        ...brandData,
        updatedAt: new Date(),
      })
      .where(eq(schema.brands.id, id))
      .returning();
    return result[0];
  }

  async deleteBrand(id: number): Promise<boolean> {
    await db.delete(schema.brands).where(eq(schema.brands.id, id));
    return true;
  }

  // Model operations
  async getModels(filters?: any): Promise<any[]> {
    let query = db.select().from(schema.models);

    if (filters?.brandId) {
      query = query.where(eq(schema.models.brandId, parseInt(filters.brandId)));
    }

    if (filters?.active !== undefined) {
      query = query.where(eq(schema.models.active, filters.active));
    }

    return await query.orderBy(schema.models.displayOrder, schema.models.name);
  }

  async getModel(id: number): Promise<any | undefined> {
    const result = await db.select()
      .from(schema.models)
      .where(eq(schema.models.id, id))
      .limit(1);
    return result[0];
  }

  async getModelWithVariants(id: number): Promise<any | undefined> {
    const model = await this.getModel(id);
    if (!model) return undefined;

    const variants = await db.select()
      .from(schema.modelVariants)
      .where(eq(schema.modelVariants.modelId, id));

    return {
      ...model,
      variants,
    };
  }

  async createModel(modelData: any): Promise<any> {
    const result = await db.insert(schema.models)
      .values({
        ...modelData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updateModel(id: number, modelData: any): Promise<any | undefined> {
    const result = await db.update(schema.models)
      .set({
        ...modelData,
        updatedAt: new Date(),
      })
      .where(eq(schema.models.id, id))
      .returning();
    return result[0];
  }

  async deleteModel(id: number): Promise<boolean> {
    // Delete variants first
    await db.delete(schema.modelVariants).where(eq(schema.modelVariants.modelId, id));
    // Delete model
    await db.delete(schema.models).where(eq(schema.models.id, id));
    return true;
  }


  // Reports
  async getDashboardStats(): Promise<any> {
    // Today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todaySalesResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
        count: count(),
      })
      .from(sales)
      .where(gte(sales.createdAt, today));

    // Monthly revenue
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [monthlyRevenueResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
      })
      .from(sales)
      .where(gte(sales.createdAt, monthStart));

    // Total products and low stock count
    const [productsStats] = await db
      .select({
        total: count(),
      })
      .from(products)
      .where(eq(products.isActive, true));

    const lowStockProducts = await this.getLowStockProducts();

    // Total customers
    const [customersStats] = await db
      .select({
        total: count(),
      })
      .from(customers);

    // New customers this month
    const [newCustomersResult] = await db
      .select({
        count: count(),
      })
      .from(customers)
      .where(gte(customers.createdAt, monthStart));

    // Sales data for chart (last 7 days)
    const salesData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [12000, 15000, 13000, 18000, 22000, 25000, Number(todaySalesResult.total) || 28000],
    };

    // Top products (mock data for now)
    const topProducts = {
      labels: ['iPhone 14', 'Samsung S23', 'OnePlus 11', 'Redmi Note 12', 'Realme 10'],
      values: [45, 38, 32, 28, 24],
    };

    return {
      todaySales: Number(todaySalesResult.total) || 0,
      salesGrowth: 15,
      totalRevenue: Number(monthlyRevenueResult.total) || 0,
      revenueGrowth: 22,
      totalProducts: productsStats.total,
      lowStockCount: lowStockProducts.length,
      totalCustomers: customersStats.total,
      newCustomers: newCustomersResult.count,
      salesData,
      topProducts,
      lowStockProducts,
    };
  }

  async getSalesReport(startDate: string, endDate: string): Promise<any> {
    const salesInPeriod = await db
      .select()
      .from(sales)
      .where(
        and(
          gte(sales.createdAt, new Date(startDate).getTime()),
          lte(sales.createdAt, new Date(endDate).getTime())
        )
      );

    const totalSales = salesInPeriod.length;
    const totalRevenue = salesInPeriod.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalProfit = salesInPeriod.reduce((sum, sale) => sum + (Number(sale.totalAmount) - Number(sale.subtotal) * 0.7), 0);
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Top products (mock data)
    const topProducts = [
      { id: 1, name: 'iPhone 14 Pro', unitsSold: 45, revenue: 2250000, profit: 450000 },
      { id: 2, name: 'Samsung Galaxy S23', unitsSold: 38, revenue: 1900000, profit: 380000 },
      { id: 3, name: 'OnePlus 11', unitsSold: 32, revenue: 1600000, profit: 320000 },
    ];

    return {
      totalSales,
      totalRevenue,
      totalProfit,
      avgOrderValue,
      topProducts,
    };
  }

  async getInventoryReport(): Promise<any> {
    const allProducts = await this.getProducts({ isActive: true });
    const lowStockProducts = await this.getLowStockProducts();

    const totalProducts = allProducts.length;
    const totalStock = allProducts.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);
    const stockValue = allProducts.reduce((sum, p) => sum + (Number(p.costPrice) * (p.stockQuantity || 0)), 0);

    return {
      totalProducts,
      totalStock,
      stockValue,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
    };
  }

  async getCustomerReport(): Promise<any> {
    const allCustomers = await this.getCustomers();

    const totalCustomers = allCustomers.length;
    const avgCustomerValue = allCustomers.reduce((sum, c) => sum + Number(c.totalPurchases), 0) / (totalCustomers || 1);

    // Top customers
    const topCustomers = allCustomers
      .sort((a, b) => Number(b.totalPurchases) - Number(a.totalPurchases))
      .slice(0, 10)
      .map(c => ({
        ...c,
        lastPurchase: new Date(),
      }));

    return {
      totalCustomers,
      newCustomers: 0,
      avgCustomerValue,
      topCustomers,
    };
  }
}

export const storage = new DatabaseStorage();
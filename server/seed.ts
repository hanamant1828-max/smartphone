import { storage } from "./storage";
import bcrypt from "bcryptjs";

async function seed() {
  try {
    console.log('Seeding database...');

    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername('admin');

    if (!existingAdmin) {
      // Create default admin user
      console.log('Creating admin user with password: admin123');
      const passwordHash = await bcrypt.hash('admin123', 10);
      console.log('Password hash created:', passwordHash);

      await storage.createUser({
        username: 'admin',
        email: 'admin@mobileshop.com',
        fullName: 'System Administrator',
        role: 'admin',
        passwordHash: passwordHash,
      });
      console.log('Admin user created successfully');

      console.log('✓ Default admin user created (username: admin, password: admin123)');
    } else {
      console.log('✓ Admin user already exists');
    }

    // Check if products already exist
    const existingProducts = await storage.getProducts();
    
    if (existingProducts.length === 0) {
      console.log('Adding sample products...');
      
      const sampleProducts = [
        {
          productCode: 'IP15PM-256-BLK',
          name: 'iPhone 15 Pro Max',
          brand: 'Apple',
          model: 'iPhone 15 Pro Max',
          category: 'Smartphone',
          color: 'Black',
          storage: '256GB',
          ram: '8GB',
          price: 159999,
          costPrice: 145000,
          stockQuantity: 15,
          minStockLevel: 5,
          barcode: '8901234567890',
          isActive: true,
        },
        {
          productCode: 'S24U-512-GRY',
          name: 'Samsung Galaxy S24 Ultra',
          brand: 'Samsung',
          model: 'Galaxy S24 Ultra',
          category: 'Smartphone',
          color: 'Gray',
          storage: '512GB',
          ram: '12GB',
          price: 134999,
          costPrice: 122000,
          stockQuantity: 8,
          minStockLevel: 3,
          barcode: '8901234567891',
          isActive: true,
        },
        {
          productCode: 'XM14PRO-256',
          name: 'Xiaomi 14 Pro',
          brand: 'Xiaomi',
          model: 'Mi 14 Pro',
          category: 'Smartphone',
          color: 'White',
          storage: '256GB',
          ram: '12GB',
          price: 79999,
          costPrice: 72000,
          stockQuantity: 12,
          minStockLevel: 5,
          barcode: '8901234567892',
          isActive: true,
        },
        {
          productCode: 'OP12-256-GRN',
          name: 'OnePlus 12',
          brand: 'OnePlus',
          model: 'OnePlus 12',
          category: 'Smartphone',
          color: 'Green',
          storage: '256GB',
          ram: '16GB',
          price: 64999,
          costPrice: 59000,
          stockQuantity: 20,
          minStockLevel: 5,
          barcode: '8901234567893',
          isActive: true,
        },
        {
          productCode: 'PIX8PRO-128',
          name: 'Google Pixel 8 Pro',
          brand: 'Google',
          model: 'Pixel 8 Pro',
          category: 'Smartphone',
          color: 'Blue',
          storage: '128GB',
          ram: '12GB',
          price: 106999,
          costPrice: 98000,
          stockQuantity: 6,
          minStockLevel: 3,
          barcode: '8901234567894',
          isActive: true,
        },
        {
          productCode: 'AIRPODPRO2',
          name: 'AirPods Pro 2nd Gen',
          brand: 'Apple',
          model: 'AirPods Pro',
          category: 'Accessory',
          color: 'White',
          price: 26900,
          costPrice: 24000,
          stockQuantity: 25,
          minStockLevel: 10,
          barcode: '8901234567895',
          isActive: true,
        },
        {
          productCode: 'BUDS2PRO',
          name: 'Galaxy Buds2 Pro',
          brand: 'Samsung',
          model: 'Buds2 Pro',
          category: 'Accessory',
          color: 'Black',
          price: 17999,
          costPrice: 15500,
          stockQuantity: 18,
          minStockLevel: 8,
          barcode: '8901234567896',
          isActive: true,
        },
        {
          productCode: 'CHG45W-USB',
          name: '45W USB-C Charger',
          brand: 'Apple',
          model: '45W Charger',
          category: 'Accessory',
          color: 'White',
          price: 4999,
          costPrice: 3500,
          stockQuantity: 50,
          minStockLevel: 15,
          barcode: '8901234567897',
          isActive: true,
        },
        {
          productCode: 'CASE-IP15-SIL',
          name: 'iPhone 15 Silicone Case',
          brand: 'Apple',
          model: 'Silicone Case',
          category: 'Accessory',
          color: 'Blue',
          price: 4900,
          costPrice: 3000,
          stockQuantity: 35,
          minStockLevel: 20,
          barcode: '8901234567898',
          isActive: true,
        },
        {
          productCode: 'SCRN-S24-GLSS',
          name: 'S24 Ultra Screen Protector',
          brand: 'Samsung',
          model: 'Tempered Glass',
          category: 'Accessory',
          color: 'Clear',
          price: 999,
          costPrice: 500,
          stockQuantity: 100,
          minStockLevel: 30,
          barcode: '8901234567899',
          isActive: true,
        },
        {
          productCode: 'NOKIA-105',
          name: 'Nokia 105 4G',
          brand: 'Nokia',
          model: '105',
          category: 'Feature Phone',
          color: 'Black',
          price: 2299,
          costPrice: 1800,
          stockQuantity: 45,
          minStockLevel: 15,
          barcode: '8901234567800',
          isActive: true,
        },
        {
          productCode: 'REDMI-A2',
          name: 'Redmi A2',
          brand: 'Xiaomi',
          model: 'Redmi A2',
          category: 'Smartphone',
          color: 'Blue',
          storage: '64GB',
          ram: '3GB',
          price: 7499,
          costPrice: 6200,
          stockQuantity: 2,
          minStockLevel: 5,
          barcode: '8901234567801',
          isActive: true,
        },
      ];

      for (const product of sampleProducts) {
        await storage.createProduct(product);
      }
      
      console.log(`✓ Added ${sampleProducts.length} sample products`);
    } else {
      console.log('✓ Products already exist');
    }

    console.log('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
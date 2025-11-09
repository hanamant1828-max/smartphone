
import bcrypt from 'bcryptjs';
import { storage } from './storage';

export async function initializeDatabase() {
  try {
    console.log('Checking for admin user...');
    
    let adminUser;
    try {
      adminUser = await storage.getUserByUsername('admin');
    } catch (error) {
      console.log('Error checking for admin user:', error);
      adminUser = null;
    }
    
    if (!adminUser) {
      console.log('Creating default admin user...');
      console.log('Username: admin');
      console.log('Password: admin123');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      console.log('Password hashed successfully');
      
      try {
        await storage.createUser({
          username: 'admin',
          email: 'admin@shop.com',
          passwordHash: hashedPassword,
          fullName: 'Administrator',
          role: 'admin',
          isActive: true,
        });
        
        console.log('✓ Default admin user created successfully');
      } catch (createError) {
        console.error('Error creating admin user:', createError);
        throw createError;
      }
    } else {
      console.log('✓ Admin user already exists');
    }
    
    // Add sample products if none exist
    try {
      const products = await storage.getProducts();
      if (products.length === 0) {
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
            isActive: true,
          },
        ];
        
        for (const product of sampleProducts) {
          await storage.createProduct(product);
        }
        
        console.log(`✓ Added ${sampleProducts.length} sample products`);
      }
    } catch (productError) {
      console.log('Note: Could not add sample products (this is optional):', productError);
    }
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Fatal error initializing database:', error);
    console.error('Please check your database configuration');
  }
}

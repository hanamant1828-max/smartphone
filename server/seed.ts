import { storage } from "./storage";
import bcrypt from "bcryptjs";

async function seed() {
  try {
    console.log('Seeding database...');
    
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByUsername('admin');
    
    if (!existingAdmin) {
      // Create default admin user
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await storage.createUser({
        username: 'admin',
        email: 'admin@mobileshop.com',
        passwordHash,
        fullName: 'Admin User',
        role: 'admin',
        isActive: true,
      });
      
      console.log('✓ Default admin user created (username: admin, password: admin123)');
    } else {
      console.log('✓ Admin user already exists');
    }
    
    console.log('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();

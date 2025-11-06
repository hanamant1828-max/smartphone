import bcrypt from 'bcryptjs';
import { storage } from './storage';

export async function initializeDatabase() {
  try {
    const adminUser = await storage.getUserByUsername('admin');
    
    if (!adminUser) {
      console.log('Creating default admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await storage.createUser({
        username: 'admin',
        email: 'admin@shop.com',
        passwordHash: hashedPassword,
        fullName: 'Administrator',
        role: 'admin',
        isActive: true,
      });
      
      console.log('Default admin user created successfully');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

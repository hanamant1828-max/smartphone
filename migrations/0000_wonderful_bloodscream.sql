CREATE TABLE `brands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(100) NOT NULL,
	`code` text(50),
	`description` text,
	`logo_url` text(255),
	`website` text(255),
	`email` text(100),
	`phone` text(20),
	`country` text(50),
	`display_order` integer DEFAULT 0,
	`active` integer DEFAULT true,
	`show_in_menu` integer DEFAULT false,
	`featured` integer DEFAULT false,
	`product_count` integer DEFAULT 0,
	`stock_value` real DEFAULT 0,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000),
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(100) NOT NULL,
	`code` text(50),
	`parent_id` integer,
	`description` text,
	`image_url` text(255),
	`display_order` integer DEFAULT 0,
	`active` integer DEFAULT true,
	`show_in_menu` integer DEFAULT true,
	`show_in_pos` integer DEFAULT true,
	`product_count` integer DEFAULT 0,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000),
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000),
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(100) NOT NULL,
	`phone` text(15) NOT NULL,
	`email` text(100),
	`address` text,
	`city` text(50),
	`pincode` text(10),
	`loyalty_points` integer DEFAULT 0,
	`total_purchases` real DEFAULT 0,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000),
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_phone_unique` ON `customers` (`phone`);--> statement-breakpoint
CREATE TABLE `model_variants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model_id` integer NOT NULL,
	`ram` text(20),
	`storage` text(20),
	`color` text(30),
	`sku` text(50),
	`created_at` integer DEFAULT (strftime('%s','now') * 1000),
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand_id` integer NOT NULL,
	`name` text(100) NOT NULL,
	`model_number` text(50),
	`model_code` text(50),
	`description` text,
	`image_url` text(255),
	`launch_date` text(10),
	`discontinued` integer DEFAULT false,
	`warranty_months` integer DEFAULT 12,
	`active` integer DEFAULT true,
	`display_order` integer DEFAULT 0,
	`base_specs` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000),
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000),
	FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_code` text(50),
	`name` text(100) NOT NULL,
	`name_hindi` text(100),
	`name_convert_latin` text(100),
	`brand` text(50),
	`size_brand` text(50),
	`model` text(50),
	`category` text(50) NOT NULL,
	`imei_number` text(15),
	`color` text(30),
	`storage` text(20),
	`ram` text(20),
	`price` real NOT NULL,
	`cost_price` real NOT NULL,
	`stock_quantity` integer DEFAULT 0,
	`min_stock_level` integer DEFAULT 5,
	`description` text,
	`image_url` text(255),
	`warranty_months` integer DEFAULT 12,
	`is_active` integer DEFAULT true,
	`hsn_code` text(20),
	`part_group` text(50),
	`unit_category` text(100),
	`sales_discount` real DEFAULT 0,
	`purchase_unit` text(20),
	`sales_unit` text(20),
	`alter_unit` text(20),
	`margin_percent_1` real DEFAULT 0,
	`margin_percent_2` real DEFAULT 0,
	`mrp` real DEFAULT 0,
	`mrp_2` real DEFAULT 0,
	`retail_price_2` real DEFAULT 0,
	`wholesale_price` real DEFAULT 0,
	`wholesale_price_2` real DEFAULT 0,
	`gst` real DEFAULT 0,
	`cgst` real DEFAULT 0,
	`sgst` real DEFAULT 0,
	`igst` real DEFAULT 0,
	`cess` real DEFAULT 0,
	`barcode` text(50),
	`rack` text(50),
	`default_qty` integer DEFAULT 1,
	`tax_type_sale` text(20) DEFAULT 'inclusive',
	`tax_type_purchase` text(20) DEFAULT 'inclusive',
	`default_sale_qty` integer DEFAULT 1,
	`order_print_section` text(50),
	`batch_serial_no` text(100),
	`mfg_date` integer,
	`expiry_date` integer,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000),
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_imei_number_unique` ON `products` (`imei_number`);--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`price` real NOT NULL,
	`cost_price` real NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text(50) NOT NULL,
	`customer_id` integer,
	`user_id` integer NOT NULL,
	`subtotal` real NOT NULL,
	`discount` real DEFAULT 0,
	`tax_amount` real DEFAULT 0,
	`total_amount` real NOT NULL,
	`payment_method` text(20) NOT NULL,
	`payment_status` text(20) DEFAULT 'completed',
	`notes` text,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000),
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_invoice_number_unique` ON `sales` (`invoice_number`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `IDX_session_expire` ON `sessions` (`expire`);--> statement-breakpoint
CREATE TABLE `stock_adjustments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`adjustment_type` text(20) NOT NULL,
	`quantity_before` integer NOT NULL,
	`quantity_after` integer NOT NULL,
	`quantity_change` integer NOT NULL,
	`reason` text(50) NOT NULL,
	`notes` text,
	`reference_number` text(50),
	`adjustment_date` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text(50) NOT NULL,
	`email` text(100),
	`password_hash` text(255) NOT NULL,
	`full_name` text(100),
	`role` text(20) DEFAULT 'sales_staff' NOT NULL,
	`phone` text(15),
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT (strftime('%s','now') * 1000),
	`updated_at` integer DEFAULT (strftime('%s','now') * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
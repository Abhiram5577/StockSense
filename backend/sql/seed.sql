USE stocksense;

-- Clear existing data for a clean slate
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE stock_ledger;
TRUNCATE TABLE stock;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
TRUNCATE TABLE locations;
TRUNCATE TABLE warehouses;
SET FOREIGN_KEY_CHECKS = 1;

-- Seed Warehouses
INSERT INTO warehouses (id, name, location_address) VALUES 
(1, 'Main Warehouse', '100 Industrial Parkway'),
(2, 'Production Warehouse', 'Building 2, Sector 4');

-- Seed Locations
INSERT INTO locations (id, warehouse_id, name, type) VALUES 
(1, 1, 'Rack A', 'Rack'),
(2, 1, 'Rack B', 'Rack'),
(3, 2, 'Production Floor', 'Floor'),
(4, 1, 'Receiving Dock', 'Zone');

-- Seed Categories
INSERT INTO categories (id, name, description) VALUES 
(1, 'Raw Materials', 'Base materials for production'),
(2, 'Finished Goods', 'Products ready for sale'),
(3, 'Safety Equipment', 'PPE and safety gear');

-- Seed Products
INSERT INTO products (id, name, sku, category_id, uom, reorder_level) VALUES 
(1, 'Steel Rods', 'STL-100', 1, 'KG', 50),
(2, 'Chairs', 'CHR-240', 2, 'Unit', 20),
(3, 'Safety Helmets', 'HLM-001', 3, 'Unit', 10),
(4, 'Neoprene Gasket', 'NGT-012', 1, 'Box', 5);

-- Seed Stock (Initial balances)
INSERT INTO stock (product_id, warehouse_id, location_id, quantity) VALUES 
(1, 1, 1, 100), -- 100 KG Steel Rods in Main/Rack A
(1, 1, 2, 40),  -- 40 KG Steel Rods in Main/Rack B
(1, 2, 3, 20),  -- 20 KG Steel Rods in Prod Floor
(2, 1, 1, 30),  -- 30 Chairs in Main/Rack A
(3, 2, 3, 8),   -- 8 Helmets (Low Stock)
(4, 1, 2, 0);   -- 0 Gaskets (Out of Stock)

-- Seed Stock Ledger (History)
INSERT INTO stock_ledger (product_id, movement_type, quantity, destination_warehouse_id, destination_location_id, reference) VALUES 
(1, 'Receipt', 100, 1, 1, 'INIT-001'),
(1, 'Receipt', 40, 1, 2, 'INIT-001'),
(1, 'Receipt', 20, 2, 3, 'INIT-001'),
(2, 'Receipt', 30, 1, 1, 'INIT-002'),
(3, 'Receipt', 8, 2, 3, 'INIT-003');

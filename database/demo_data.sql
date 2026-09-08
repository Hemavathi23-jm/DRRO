-- DRRO Demo Data for college presentation
-- Run after schema.sql on a fresh or existing database

-- Additional demo users (password: Admin@123 for all — same BCrypt hash)
INSERT INTO users (name, email, password_hash, role_id, status)
SELECT 'Relief Officer', 'officer@drro.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCKzGMRjwjBhkEjGOQX0iEi', role_id, 'ACTIVE'
FROM roles WHERE role_name = 'OFFICER'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password_hash, role_id, status)
SELECT 'Resource Manager', 'manager@drro.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCKzGMRjwjBhkEjGOQX0iEi', role_id, 'ACTIVE'
FROM roles WHERE role_name = 'RESOURCE_MANAGER'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password_hash, role_id, status)
SELECT 'Field Operator', 'field@drro.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCKzGMRjwjBhkEjGOQX0iEi', role_id, 'ACTIVE'
FROM roles WHERE role_name = 'FIELD_OPERATOR'
ON CONFLICT (email) DO NOTHING;

-- Disasters (Kerala region coordinates)
INSERT INTO disasters (title, type, severity, start_time, latitude, longitude, description, status, created_by)
SELECT 'Kerala Floods 2026', 'FLOOD', 85, NOW() - INTERVAL '3 days', 10.8505, 76.2711,
       'Severe monsoon flooding across northern Kerala districts', 'ACTIVE', user_id
FROM users WHERE email = 'admin@drro.com'
ON CONFLICT DO NOTHING;

INSERT INTO disasters (title, type, severity, start_time, latitude, longitude, description, status, created_by)
SELECT 'Wayanad Landslide', 'LANDSLIDE', 92, NOW() - INTERVAL '1 day', 11.6854, 76.1320,
       'Major landslide affecting hillside communities', 'ACTIVE', user_id
FROM users WHERE email = 'admin@drro.com'
ON CONFLICT DO NOTHING;

-- Resource Centers
INSERT INTO resource_centers (name, latitude, longitude, address, status) VALUES
  ('Kochi Central Warehouse', 9.9312, 76.2673, 'Kochi, Kerala', 'ACTIVE'),
  ('Kozhikode Relief Hub', 11.2588, 75.7804, 'Kozhikode, Kerala', 'ACTIVE'),
  ('Munnar Emergency Depot', 10.0889, 77.0595, 'Munnar, Kerala', 'ACTIVE');

-- Affected Locations
INSERT INTO locations (disaster_id, name, latitude, longitude, population_affected, vulnerability_score, severity_score, accessibility)
SELECT d.disaster_id, 'Wayanad North', 11.7200, 76.0800, 12000, 75, 88, 'DIFFICULT'
FROM disasters d WHERE d.title = 'Kerala Floods 2026';

INSERT INTO locations (disaster_id, name, latitude, longitude, population_affected, vulnerability_score, severity_score, accessibility)
SELECT d.disaster_id, 'Alappuzha Coast', 9.4981, 76.3388, 8200, 60, 76, 'ACCESSIBLE'
FROM disasters d WHERE d.title = 'Kerala Floods 2026';

INSERT INTO locations (disaster_id, name, latitude, longitude, population_affected, vulnerability_score, severity_score, accessibility)
SELECT d.disaster_id, 'Kodagu Valley', 12.3375, 75.8069, 4500, 85, 92, 'BLOCKED'
FROM disasters d WHERE d.title = 'Wayanad Landslide';

-- Inventory at centers
INSERT INTO inventory (center_id, resource_type_id, available_qty, reserved_qty, min_stock_level)
SELECT rc.center_id, rt.resource_type_id,
  CASE rt.category WHEN 'FOOD' THEN 5000 WHEN 'WATER' THEN 10000 WHEN 'MEDICINE' THEN 500 WHEN 'SHELTER' THEN 200 ELSE 100 END,
  0, 500
FROM resource_centers rc CROSS JOIN resource_types rt
WHERE rc.name = 'Kochi Central Warehouse'
ON CONFLICT (center_id, resource_type_id) DO NOTHING;

INSERT INTO inventory (center_id, resource_type_id, available_qty, reserved_qty, min_stock_level)
SELECT rc.center_id, rt.resource_type_id,
  CASE rt.category WHEN 'FOOD' THEN 200 WHEN 'WATER' THEN 800 WHEN 'MEDICINE' THEN 50 ELSE 20 END,
  0, 500
FROM resource_centers rc CROSS JOIN resource_types rt
WHERE rc.name = 'Munnar Emergency Depot'
ON CONFLICT (center_id, resource_type_id) DO NOTHING;

-- Response Teams (last known coordinates — not live GPS)
INSERT INTO response_teams (name, skills, latitude, longitude, availability, contact) VALUES
  ('Alpha Rescue Unit', 'Medical, Search & Rescue', 10.5276, 76.2144, 'AVAILABLE', '9876543210'),
  ('Bravo Logistics', 'Transport, Supply Chain', 11.2588, 75.7804, 'DEPLOYED', '9876543211'),
  ('Charlie Medical', 'First Aid, Triage', 9.9312, 76.2673, 'AVAILABLE', '9876543212');

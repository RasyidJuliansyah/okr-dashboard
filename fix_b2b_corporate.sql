-- Fix B2B Corporation -> B2B Corporate value mismatch
-- Run on production database

-- 1. Update department table value
UPDATE `department` SET `value` = 'B2B_CORPORATE' WHERE `value` = 'B2B_CORPORATION';

-- 2. Update user table department column
UPDATE `user` SET `department` = 'B2B_CORPORATE' WHERE `department` = 'B2B_CORPORATION';

-- 3. Update kpi table department column (if any)
UPDATE `kpi` SET `department` = 'B2B_CORPORATE' WHERE `department` = 'B2B_CORPORATION';

-- 4. Update objective table department column (if any)
UPDATE `objective` SET `department` = 'B2B_CORPORATE' WHERE `department` = 'B2B_CORPORATION';

-- 5. Update annual_key_result table department column (if any)
UPDATE `annual_key_result` SET `department` = 'B2B_CORPORATE' WHERE `department` = 'B2B_CORPORATION';

-- 6. Update kr_department table department column (if any)
UPDATE `kr_department` SET `department` = 'B2B_CORPORATE' WHERE `department` = 'B2B_CORPORATION';

-- Verify
SELECT 'department' as table_name, id, name, value FROM department WHERE value LIKE 'B2B%';
SELECT 'user' as table_name, email, department FROM user WHERE department LIKE 'B2B%';
SELECT 'kpi' as table_name, id, department FROM kpi WHERE department LIKE 'B2B%';
SELECT 'objective' as table_name, id, department FROM objective WHERE department LIKE 'B2B%';
SELECT 'annual_key_result' as table_name, id, department FROM annual_key_result WHERE department LIKE 'B2B%';
SELECT 'kr_department' as table_name, id, department FROM kr_department WHERE department LIKE 'B2B%';
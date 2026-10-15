-- Exported from SQLite to MySQL
SET FOREIGN_KEY_CHECKS = 0;
SET UNIQUE_CHECKS = 0;

-- Table: User
DELETE FROM `User`;
INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `department`, `position`, `teamId`, `createdAt`) VALUES
('e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3', 'Skolla Education', 'admin@skolla.education', '$2b$10$YDtX1ZihF1ztntvvD.iyCe3yQiqpeHAfHJCs7w0uZvpo67IUAtb7O', 'ADMIN', NULL, NULL, NULL, '2026-08-10 08:22:48.975'),
('39e86d0c-2e4d-4f5b-ab77-eda0a332bbcd', 'Devlin Hazrian Saleh', 'devlin@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'MANAGER', 'STRATEGIC', 'Chief Executive Officer', 'a623fa11-d5cb-46a7-b2a8-a6885cfa8238', '2026-08-11 08:52:38.914'),
('74355838-bb1e-4058-85bb-9648a88b2ed4', 'Yazid Amanullah', 'yazid@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'C_LEVEL', 'STRATEGIC', 'Chief Technology Officer', 'a623fa11-d5cb-46a7-b2a8-a6885cfa8238', '2026-08-11 08:52:38.919'),
('fe92b231-b9f5-443e-9ddb-fb230a1a3f63', 'Hafizh Abdan Syakura', 'hafizh@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'TEAM', 'STRATEGIC', 'Executive Partner', 'a623fa11-d5cb-46a7-b2a8-a6885cfa8238', '2026-08-11 08:52:38.920'),
('2fe0bee9-fe63-472d-be9c-735ee11ab167', 'Muhammad Akbar Buana Tafsili', 'akbar@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'MANAGER', 'STRATEGIC', 'Chief Business Officer', 'a623fa11-d5cb-46a7-b2a8-a6885cfa8238', '2026-08-11 08:52:38.921'),
('3afaec1a-70ea-4998-bbb0-e0898cf29136', 'Agung Septiansyah', 'agung@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'LEADER', 'B2B_EXPANSION', 'Head of Sales Expansion', 'b195b816-8168-48c3-9540-f37263f5c04f', '2026-08-11 08:52:38.921'),
('e5e0562f-dcf7-495c-8ec1-9954f59e5231', 'Teuku Zhurry Ariyandi Putra', 'zhurry@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'LEADER', 'B2S', 'Head of Sales', '201b58b6-e1e4-44d3-b4e7-3dd0139e2636', '2026-08-11 08:52:38.922'),
('a77d84da-3cc0-4f0c-bbd8-0986176f5197', 'Hervina Anjani Yulistika', 'vina@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'LEADER', 'B2C', 'Communication Lead', '5ad10fff-3bfb-400f-88e1-e9a387743324', '2026-08-11 08:52:38.922'),
('a006dc97-54ee-403c-a82f-95ec9ff1f5f7', 'Syifa Mahmudah', 'syifa@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'LEADER', 'B2B_CORPORATION', 'Program & Service Strategist', 'e9395743-c354-43b4-98f2-2287ea12e07d', '2026-08-11 08:52:38.923'),
('b37bbe0b-9635-4ede-a980-255bc177bebb', 'Muhammad Muflih Gani', 'mugan@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'TEAM', 'B2B_CORPORATION', 'Business & Legal Coordinator', 'e9395743-c354-43b4-98f2-2287ea12e07d', '2026-08-11 08:52:38.924'),
('16d7b28a-a8f7-4bd2-bdba-99114895e389', 'Alma Diva Hafizha Saleh', 'diva@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'TEAM', 'B2B_CORPORATION', 'Corporate Communication', 'e9395743-c354-43b4-98f2-2287ea12e07d', '2026-08-11 08:52:38.924'),
('7addf3c2-7cb8-4fa9-902b-9059fc8dcdde', 'Tamara Aulia Ramadhini', 'tamara@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'TEAM', 'B2C', 'Campaign Lead', '5ad10fff-3bfb-400f-88e1-e9a387743324', '2026-08-11 08:52:38.925'),
('82b9d6e6-0042-4112-b8c1-b5c31b357670', 'Bob Bastian', 'bob@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'TEAM', 'B2C', 'Marketing Lead', '5ad10fff-3bfb-400f-88e1-e9a387743324', '2026-08-11 08:52:38.926'),
('17dc67ce-90a4-441e-9a78-42c2af92711f', 'Dwiva Yulian Edfi', 'dwiva@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'LEADER', 'TECHOPS', 'TechOps Lead', '7b4be7ef-1246-4455-9bfd-da8530e9fae9', '2026-08-11 08:52:38.927'),
('8faec284-7b1f-4b2c-a9b0-bffd764a73f1', 'Zukhrini Khalish Nasution', 'rini@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'LEADER', 'EDUCATION', 'Education Lead', 'c22e7778-49e0-47dd-adfc-a96e23c4a037', '2026-08-11 08:52:38.927'),
('5acebc3e-e242-4bc7-87ba-13cfe19b8751', 'Riska Rosmana', 'riska@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'LEADER', 'SERVICE_ACCOUNT', 'Service Account Manager', '3dc8d8eb-e071-4cc3-8131-0336caebe91a', '2026-08-11 08:52:38.928'),
('26968b6a-da68-4656-8a71-f038cdeae65a', 'Syarief Hidayatullah', 'syarief@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'LEADER', 'TECHDEV', 'Techlead', '602ee7f5-0e5f-4390-a0d3-c111c5651807', '2026-08-11 08:52:38.928'),
('c00701ad-1eca-4ade-bb4c-48ac29647297', 'Farid Aflah', 'farid@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'LEADER', 'SSC', 'Senior Finance & Accounting', 'ac158f67-1705-496a-b06e-28735dd77caa', '2026-08-11 08:52:38.929'),
('f881cfa0-3834-4355-990e-9126a125ab68', 'Ahna Fatun Salsabila', 'anaf@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'ADMIN', 'SSC', 'HR Generalist', 'ac158f67-1705-496a-b06e-28735dd77caa', '2026-08-11 08:52:38.930'),
('8a4998b0-99fd-434a-8e07-3d31ab5d6987', 'Bintang Azzandriya W', 'bintang@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'TEAM', 'SSC', 'Sales Admin', 'ac158f67-1705-496a-b06e-28735dd77caa', '2026-08-11 08:52:38.931'),
('504f885d-df18-4a7a-901d-29e0174c7432', 'Fenni Amalia', 'fenni@skolla.education', '$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS', 'TEAM', 'SSC', 'Data Analyst', 'ac158f67-1705-496a-b06e-28735dd77caa', '2026-08-11 08:52:38.931'),
('e51d00a6-926d-4365-9115-5b2d2132c1fb', 'Mohammad Rizki Adi Pradana', 'rizki@skolla.education', '$2b$10$rxybxoETrgISlqSjLQs5X.Z2n2XFLRqvtvB0Sz0WhIkYwo4TncDc6', 'MANAGER', 'EDUCATION', 'Head of Operation', 'c22e7778-49e0-47dd-adfc-a96e23c4a037', '2026-08-11 09:06:02.493'),
('33fafcd1-894c-4da1-b912-11a1de95ddce', 'Aan Noviyanti', 'novi@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'SERVICE_ACCOUNT', 'Account Manager', '3dc8d8eb-e071-4cc3-8131-0336caebe91a', '2026-08-11 14:05:23.092'),
('5f391494-bfde-49e3-b79d-9bfe0eed4f91', 'Alif Firman Ramdhani', 'aliffirman@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'TECHDEV', 'Mobile Developer', '602ee7f5-0e5f-4390-a0d3-c111c5651807', '2026-08-11 14:05:23.100'),
('d91c2bc1-61bc-4072-a698-264622ee339b', 'Andhika Prakasa', 'andhika@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'TECHDEV', 'Back End Developer', '602ee7f5-0e5f-4390-a0d3-c111c5651807', '2026-08-11 14:05:23.101'),
('f9a7d52d-7ad1-43aa-9789-b697268ede9c', 'Diva Zahraisya Putri Utami', 'tami@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'TECHDEV', 'UI/UX Designer', '602ee7f5-0e5f-4390-a0d3-c111c5651807', '2026-08-11 14:05:23.104'),
('9e75ae68-95f2-4515-a2f9-4b0ca4317190', 'Eka Nur Setianingsih', 'eka@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'EDUCATION', 'Education Bahasa Indonesia', 'c22e7778-49e0-47dd-adfc-a96e23c4a037', '2026-08-11 14:05:23.105'),
('e2f5b2ea-f411-4a2a-b393-0a4ce019fd2b', 'Fedri Ardianas', 'fedri@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'B2S', 'B2B Partnership Manager', '201b58b6-e1e4-44d3-b4e7-3dd0139e2636', '2026-08-11 14:05:23.106'),
('a2c14af3-b35d-455a-9f8c-2426641020a0', 'Ichsan Ramdani', 'ichsan@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'TECHDEV', 'Quality Assurance', '602ee7f5-0e5f-4390-a0d3-c111c5651807', '2026-08-11 14:05:23.108'),
('52563e0e-f486-4483-a843-d464c9aea995', 'Muhamad Fahmi', 'fahmi@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'TECHOPS', 'TechOps Support', '7b4be7ef-1246-4455-9bfd-da8530e9fae9', '2026-08-11 14:05:23.109'),
('2db25c97-ca0e-420d-bbdc-3d169b556007', 'Muhammad Fikri Rizal', 'fikri@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'B2S', 'B2S Partnership Manager', '201b58b6-e1e4-44d3-b4e7-3dd0139e2636', '2026-08-11 14:05:23.112'),
('67637176-ff2f-4a97-abb5-a9c05c785d9c', 'Prisma Harsu Prasetiyo', 'prisma@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'B2S', 'B2S Partnership Manager', '201b58b6-e1e4-44d3-b4e7-3dd0139e2636', '2026-08-11 14:05:23.114'),
('569c82cf-2b22-4bee-848f-f068978b8c72', 'Ridwan Maulana', 'iwan@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'EDUCATION', 'Education Bahasa Inggris', 'c22e7778-49e0-47dd-adfc-a96e23c4a037', '2026-08-11 14:05:23.115'),
('b75d7f4c-9e7a-4945-bd42-4b25edebc815', 'Tatang Supandi', 'tatang@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'SSC', 'Visual Production Lead', 'ac158f67-1705-496a-b06e-28735dd77caa', '2026-08-11 14:05:23.117'),
('7828cc7c-8f00-4bb0-8021-f805b9ca33e9', 'Taufiq Nur Hidayah', 'taufiq@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'TECHOPS', 'TechOps Executive', '7b4be7ef-1246-4455-9bfd-da8530e9fae9', '2026-08-11 14:05:23.118'),
('09e5aa28-5634-4e4b-8b35-ef9443e85c09', 'Ulialbab Nudiashalih', 'ulil@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'TECHDEV', 'Data Engineer', '602ee7f5-0e5f-4390-a0d3-c111c5651807', '2026-08-11 14:05:23.119'),
('dae09c02-9a7c-495c-b2e1-250a98f3d3f3', 'Wahyu Diningrat Suryo Atmojo', 'wahyu@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'B2S', 'Project Officer', '201b58b6-e1e4-44d3-b4e7-3dd0139e2636', '2026-08-11 14:05:23.119'),
('c2d8a2ab-784b-45fc-8264-307fa3d8ba93', 'Oktaviani Winarso', 'via@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'EDUCATION', 'Education Matematika', 'c22e7778-49e0-47dd-adfc-a96e23c4a037', '2026-08-11 14:05:23.120'),
('ddc55a9d-a051-45b5-8462-971c7891fafa', 'Akhmad Mukhibun', 'akhmad@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'SERVICE_ACCOUNT', 'Junior Partnership Manager', '3dc8d8eb-e071-4cc3-8131-0336caebe91a', '2026-08-11 14:05:23.123'),
('7120f48f-4090-42b9-8e95-74a6166bbc25', 'Muhammad Aan Khunaifi', 'aan@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'B2B_EXPANSION', 'B2B Partnership Manager', 'b195b816-8168-48c3-9540-f37263f5c04f', '2026-08-11 14:05:23.123'),
('a19e22a9-08ac-45e2-862f-c000efac1e17', 'Made Jiagustini', 'jia@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'B2S', 'B2S Partnership Manager', '201b58b6-e1e4-44d3-b4e7-3dd0139e2636', '2026-08-11 14:05:23.124'),
('5450b9e9-9b4c-4315-91fe-b5888ca3a68e', 'Sholehatin Ningsih', 'lia@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'B2B_EXPANSION', 'B2B Partnership Manager', 'b195b816-8168-48c3-9540-f37263f5c04f', '2026-08-11 14:05:23.124'),
('a5f40518-1c79-4b46-b321-eb05c9a2a844', 'Candra Mukti', 'candra@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'B2B_EXPANSION', 'B2B Partnership Manager', 'b195b816-8168-48c3-9540-f37263f5c04f', '2026-08-11 14:05:23.125'),
('d37e1b70-2d2d-4103-804b-b6eaf909167d', 'Dwijayanti Suhatsyah', 'poppy@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'B2B_EXPANSION', 'B2B Partnership Manager', 'b195b816-8168-48c3-9540-f37263f5c04f', '2026-08-11 14:05:23.125'),
('8ca3fd77-2c8f-4732-94a2-6caeeb28de76', 'Audia Ramadhan', 'audia@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'B2S', 'B2S Partnership Manager', '201b58b6-e1e4-44d3-b4e7-3dd0139e2636', '2026-08-11 14:05:23.125'),
('4bb5c945-fc26-44fd-b06d-597792f6f063', 'Marufatu Laili', 'laili@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'B2B_EXPANSION', 'B2B Partnership Manager', 'b195b816-8168-48c3-9540-f37263f5c04f', '2026-08-11 14:05:23.126'),
('3748a859-7ef1-4155-b501-1b39874d1976', 'Yogie Ari Shandy', 'yogie@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'EDUCATION', 'Education Biologi', 'c22e7778-49e0-47dd-adfc-a96e23c4a037', '2026-08-11 14:05:23.127'),
('4d8bf416-b272-45ba-894e-85119a356ac0', 'Abdul Majid Al Kholish', 'majid@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'EDUCATION', 'Live Class Specialist', 'c22e7778-49e0-47dd-adfc-a96e23c4a037', '2026-08-11 14:05:23.127'),
('1dac7ccc-e235-41aa-a3b9-74f2fa529505', 'Febrian Indra Rukmana', 'febrian@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'EDUCATION', 'Try Out Specialist', 'c22e7778-49e0-47dd-adfc-a96e23c4a037', '2026-08-11 14:05:23.128'),
('5fb4571c-0d0c-4243-8e7e-80f25a125ba8', 'Paramita Tri Yaningrum', 'mita@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'EDUCATION', 'Education Matematika', 'c22e7778-49e0-47dd-adfc-a96e23c4a037', '2026-08-11 14:05:23.128'),
('5f5e2343-0b52-446c-8891-814d68f9550d', 'Alfyan Rajiv Attar', 'alfyan@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'B2S', 'B2S Partnership Manager', '201b58b6-e1e4-44d3-b4e7-3dd0139e2636', '2026-08-11 14:05:23.129'),
('758b896e-f7e1-4f0b-ae2e-22b23a0c694e', 'Gigin Ginanjar', 'gino@skolla.education', '$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq', 'TEAM', 'SERVICE_ACCOUNT', 'Communication After Sales', '3dc8d8eb-e071-4cc3-8131-0336caebe91a', '2026-08-11 14:05:23.129'),
('f28c7c3e-ebfd-490e-bee8-6a0823dcfa63', 'Muhammad Rasyid Juliansyah', 'rasyid@skolla.education', '$2b$10$0u4aoOKsXX8yvO0UBUoxveDYLHF.2Oa2VOScYrD/cEJVM53N3Eeja', 'ADMIN', 'SSC', 'SSC', NULL, '2026-08-12 10:06:20.090');

-- Table: Team
DELETE FROM `Team`;
INSERT INTO `Team` (`id`, `name`, `managerId`, `leaderId`, `department`) VALUES
('c6bade49-4508-438a-9dff-baa74d1c6398', 'Product & Tech', '8c35244d-697c-4d57-be5c-23c0a2e5001d', NULL, NULL),
('a623fa11-d5cb-46a7-b2a8-a6885cfa8238', 'Strategic Planning', NULL, NULL, 'STRATEGIC'),
('cad67837-c913-41e1-8c11-bb4798068118', 'Finance & Accounting', NULL, NULL, 'FINANCE'),
('e97d2095-0df6-46da-9881-c79df333acb5', 'Business Development', NULL, NULL, 'BUSINESS'),
('201b58b6-e1e4-44d3-b4e7-3dd0139e2636', 'Business to School (B2S)', NULL, NULL, 'B2S'),
('b195b816-8168-48c3-9540-f37263f5c04f', 'B2B Expansion', NULL, NULL, 'B2B_EXPANSION'),
('e9395743-c354-43b4-98f2-2287ea12e07d', 'B2B Corporation', NULL, NULL, 'B2B_CORPORATION'),
('5ad10fff-3bfb-400f-88e1-e9a387743324', 'B2C Consumer', NULL, NULL, 'B2C'),
('5ad31b20-512f-4d76-84e9-3885e3c3b17a', 'Product & Service', NULL, NULL, 'PRODUCT_SERVICE'),
('3dc8d8eb-e071-4cc3-8131-0336caebe91a', 'Service & Account', NULL, NULL, 'SERVICE_ACCOUNT'),
('602ee7f5-0e5f-4390-a0d3-c111c5651807', 'Tech Development', NULL, NULL, 'TECHDEV'),
('7b4be7ef-1246-4455-9bfd-da8530e9fae9', 'Tech Operations', NULL, NULL, 'TECHOPS'),
('c22e7778-49e0-47dd-adfc-a96e23c4a037', 'Education & Academic', NULL, NULL, 'EDUCATION'),
('ac158f67-1705-496a-b06e-28735dd77caa', 'Shared Service Center (SSC)', NULL, NULL, 'SSC'),
('fc9f8239-76c7-475a-94be-390f63a42652', 'Creative & Design', NULL, NULL, 'DESIGN'),
('b853dc12-26d5-4c65-b536-7d7182983f42', 'Data & Analytics', NULL, NULL, 'DATA'),
('ced65713-6872-4f57-ac6b-29360de59dbe', 'People Operations (HR)', NULL, NULL, 'HR');

-- Table: Department
DELETE FROM `Department`;
INSERT INTO `Department` (`id`, `name`, `value`, `managerId`, `createdAt`) VALUES
('ee620a74-7005-4d66-b21e-8a0f3a5b3df3', 'Strategic', 'STRATEGIC', '39e86d0c-2e4d-4f5b-ab77-eda0a332bbcd', '2026-08-11 14:30:57.828'),
('09a9bbaf-194f-4d46-9dbb-d1ce9e7f3904', 'Finance', 'FINANCE', NULL, '2026-08-11 14:30:57.833'),
('6fac984b-5054-4e1b-89c8-6ae3ebe23c8e', 'Business', 'BUSINESS', NULL, '2026-08-11 14:30:57.834'),
('555e072e-7ba7-4e6f-af56-eacd5f2d95f7', 'B2S', 'B2S', '2fe0bee9-fe63-472d-be9c-735ee11ab167', '2026-08-11 14:30:57.834'),
('1e85e1a2-d46a-44ca-af1b-a85ba2c25170', 'B2B Expansion', 'B2B_EXPANSION', '2fe0bee9-fe63-472d-be9c-735ee11ab167', '2026-08-11 14:30:57.835'),
('cc69aa2b-d156-4a8e-9bf3-69f977fe6bac', 'B2B Corporation', 'B2B_CORPORATION', '2fe0bee9-fe63-472d-be9c-735ee11ab167', '2026-08-11 14:30:57.835'),
('b0934145-b7d9-4989-8455-cefb3bd383b8', 'B2C', 'B2C', '2fe0bee9-fe63-472d-be9c-735ee11ab167', '2026-08-11 14:30:57.836'),
('61a5c920-751b-482e-b390-342beea66a24', 'Product Service', 'PRODUCT_SERVICE', NULL, '2026-08-11 14:30:57.837'),
('e644c6da-c345-4e0d-af72-0c99aa4318d9', 'Service Account', 'SERVICE_ACCOUNT', 'e51d00a6-926d-4365-9115-5b2d2132c1fb', '2026-08-11 14:30:57.838'),
('0adfcf05-b80d-4d9d-b3ca-915b79091490', 'Techdev', 'TECHDEV', 'e51d00a6-926d-4365-9115-5b2d2132c1fb', '2026-08-11 14:30:57.839'),
('3987916a-7979-473e-abbd-02719c225cc4', 'TechOps', 'TECHOPS', 'e51d00a6-926d-4365-9115-5b2d2132c1fb', '2026-08-11 14:30:57.839'),
('7d275801-fed8-471c-b6cf-5a992b85553a', 'Education', 'EDUCATION', 'e51d00a6-926d-4365-9115-5b2d2132c1fb', '2026-08-11 14:30:57.840'),
('fa0d204f-287f-4b53-ac36-68fdbb03bb2d', 'Shared Service Center', 'SSC', 'f28c7c3e-ebfd-490e-bee8-6a0823dcfa63', '2026-08-11 14:30:57.840'),
('b3a56c4e-d2a8-4b41-97f6-a717b8d4498a', 'Design', 'DESIGN', NULL, '2026-08-11 14:30:57.841'),
('050ce9dc-b734-4a76-81d0-f9950dcd85e7', 'Data', 'DATA', NULL, '2026-08-11 14:30:57.842'),
('85375f75-b6db-4248-9721-7e17261d0e1c', 'HR', 'HR', NULL, '2026-08-11 14:30:57.843');

-- Table: Objective
DELETE FROM `Objective`;

-- Table: AnnualKeyResult
DELETE FROM `AnnualKeyResult`;

-- Table: KeyResult
DELETE FROM `KeyResult`;

-- Table: KrAssignment
DELETE FROM `KrAssignment`;

-- Table: KrDepartment
DELETE FROM `KrDepartment`;

-- Table: KrUpdate
DELETE FROM `KrUpdate`;

-- Table: CausalLink
DELETE FROM `CausalLink`;

-- Table: Initiative
DELETE FROM `Initiative`;

-- Table: Task
DELETE FROM `Task`;

-- Table: TaskAssignment
DELETE FROM `TaskAssignment`;

-- Table: TaskUpdate
DELETE FROM `TaskUpdate`;

-- Table: InitiativeUpdate
DELETE FROM `InitiativeUpdate`;

SET FOREIGN_KEY_CHECKS = 1;
SET UNIQUE_CHECKS = 1;

-- MySQL dump 10.13  Distrib 9.7.1, for macos26.6 (arm64)
--
-- Host: 127.0.0.1    Database: skolla_okr
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('315a84e2-83f2-4bcd-afe6-e54931bf9530','be6c7847ed264d3c7d913a697bd20a396d7f8188b5a41f08e027d10091be7ba3','2026-08-27 14:14:57.348','20260819091155_init_mysql','',NULL,'2026-08-27 14:14:57.348',0),('33abbfd4-bf0c-4c9c-ba6f-59efaa9d6802','affdb36c213b050afd054ef47296aca37f02430aa12320f67efb0dfbdd52efd3','2026-08-27 14:15:01.167','20260827100126_add_annual_kr_initiative_approval',NULL,NULL,'2026-08-27 14:15:01.155',1),('f5eaac7d-d039-4ecc-856e-9e43ad60073d','fa0082d7da6cc99c236140f51ae75a73702cbe0d6f0bd2d44856e018bb778e65','2026-08-27 14:15:10.024','20260826011725_add_documentation_links','',NULL,'2026-08-27 14:15:10.024',0);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `annual_key_result`
--

DROP TABLE IF EXISTS `annual_key_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `annual_key_result` (
  `id` varchar(191) NOT NULL,
  `objective_id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `target_value` double NOT NULL,
  `current_value` double NOT NULL DEFAULT '0',
  `unit` varchar(191) NOT NULL,
  `bsc_perspective` varchar(191) NOT NULL,
  `year` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'ON_TRACK',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  `target_type` varchar(191) NOT NULL DEFAULT 'AT_LEAST',
  PRIMARY KEY (`id`),
  KEY `AnnualKeyResult_objectiveId_fkey` (`objective_id`),
  CONSTRAINT `AnnualKeyResult_objectiveId_fkey` FOREIGN KEY (`objective_id`) REFERENCES `objective` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `annual_key_result`
--

LOCK TABLES `annual_key_result` WRITE;
/*!40000 ALTER TABLE `annual_key_result` DISABLE KEYS */;
/*!40000 ALTER TABLE `annual_key_result` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` varchar(191) NOT NULL,
  `user_id` varchar(191) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `AuditLog_entityType_entityId_idx` (`entity_type`,`entity_id`),
  KEY `AuditLog_userId_idx` (`user_id`),
  KEY `AuditLog_createdAt_idx` (`created_at`),
  CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES ('02100a17-32d7-40c4-9d53-5b4c47bd7097','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','cab7316b-d491-4e2a-9cf3-b31b590cb434','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:51:01.362'),('03e83304-fe93-4dc2-84fb-8d191fef01de','2fe0bee9-fe63-472d-be9c-735ee11ab167','CREATE','INITIATIVE','e21214d9-dacb-4494-a9a6-4032c74fe52c',NULL,'{\"title\": \"40 Deal bulan Oktober\", \"teamId\": \"b195b816-8168-48c3-9540-f37263f5c04f\", \"keyResultId\": \"5b2eb387-0a2c-472a-b75f-cae91a64e45d\", \"targetValue\": 40}','::ffff:127.0.0.1','2026-09-22 09:51:38.195'),('093de087-9e7e-4196-9c67-f737c30a5afd','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','USER','f881cfa0-3834-4355-990e-9126a125ab68','{\"name\": \"Ahna Fatun Salsabila\", \"role\": \"TEAM\", \"position\": \"HR Generalist\", \"department\": \"SSC\"}','{\"name\": \"Ahna Fatun Salsabila\", \"role\": \"TEAM\", \"position\": \"HR Generalist\", \"department\": \"SSC\"}','::ffff:127.0.0.1','2026-09-20 01:54:10.218'),('0bf1ace8-a9f4-4a6c-8e7f-ca496bca7e5f','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','abba8f2d-05e8-4223-bd54-c42cf6bac17f','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:49:50.790'),('0daedcca-bb55-47a4-a521-4bf9a907bd82','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','b817f395-b2af-4b6f-985a-5ed449f9f516','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:49:54.692'),('15a8d323-5ae8-4107-b108-efdffdf17c50','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','82eb6a8e-465d-494e-aaae-ac43a15435f7','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:49:40.985'),('187656f2-ced5-4acd-8d4c-21edbb5d4983','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','5dcced09-cfe0-4d07-9fb1-190c0cf59654','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:49:03.810'),('1a41c79d-42c0-45f9-9614-cd2892ebe7dc','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','06a791db-83b0-494b-9df7-04bb9264ffc5','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:49:30.582'),('1e9ef492-d7f7-4042-9a82-10e2acfe4dac','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','CREATE','INITIATIVE','61f39dde-4d2f-4d75-822f-8f8415f72495',NULL,'{\"title\": \"Inisiatif Automated Test Timeline\", \"teamId\": \"e9395743-c354-43b4-98f2-2287ea12e07d\", \"keyResultId\": null, \"targetValue\": 100}','::ffff:127.0.0.1','2026-09-22 09:38:53.458'),('29924458-1cb0-49d8-82b5-51ea6932c01a','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','USER','74355838-bb1e-4058-85bb-9648a88b2ed4','{\"name\": \"Yazid Amanullah\", \"role\": \"C_LEVEL\", \"position\": \"Chief Technology Officer\", \"department\": \"STRATEGIC\"}','{\"name\": \"Yazid Amanullah\", \"role\": \"TEAM\", \"position\": \"Chief Technology Officer\", \"department\": \"STRATEGIC\"}','::ffff:127.0.0.1','2026-09-23 07:15:14.687'),('2a6e4e3c-b900-4dde-b6c5-a6c6e038d4d9','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','d74d2f49-6e07-47f8-bfa1-3e5a6f195dde','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:48:59.450'),('30133ea3-7980-432f-8542-412f63b5d4d7','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','STATUS_CHANGE','DEPARTMENT','1e85e1a2-d46a-44ca-af1b-a85ba2c25170','{\"isActive\": true}','{\"isActive\": false}','::ffff:127.0.0.1','2026-09-20 02:25:37.162'),('30a6dd21-344e-4180-9e1d-ca4f21f68faf','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','ebb90f93-a016-4172-ba52-4d7d84b7b273','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:05.518'),('352994a1-73b0-4a38-a38e-b0a4ac0c1e95','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','ASSIGN_C_LEVEL','DEPARTMENT','0adfcf05-b80d-4d9d-b3ca-915b79091490','{\"cLevelId\": \"74355838-bb1e-4058-85bb-9648a88b2ed4\"}','{\"cLevelId\": \"74355838-bb1e-4058-85bb-9648a88b2ed4\"}','::ffff:127.0.0.1','2026-09-23 06:52:00.742'),('36a9ba0f-bbc9-433a-9c89-18e7059bde98','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','b4742437-4c46-46fb-8397-e8526673468b','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:35.739'),('3acb777d-6159-4c3f-9a48-e7e816d6b371','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','939cae9b-980f-443a-8916-eb060690f74a','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:13.208'),('3acd8be4-e4ec-4e6c-9db8-def0fab7a58d','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','c4ba49b5-4948-44a9-b7b7-df8e7c5f1757','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:48:55.050'),('3e94d9a5-3a30-4915-be89-0811496e2d2f','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','bc12ef4e-275b-42b9-afa4-7c5af1dae888','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:49:33.673'),('3eaf4b83-b3d4-437d-8c61-9d57dca9a9e6','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','USER','f881cfa0-3834-4355-990e-9126a125ab68','{\"name\": \"Ahna Fatun Salsabila\", \"role\": \"ADMIN\", \"position\": \"HR Generalist\", \"department\": \"SSC\"}','{\"name\": \"Ahna Fatun Salsabila\", \"role\": \"TEAM\", \"position\": \"HR Generalist\", \"department\": \"SSC\"}','::ffff:127.0.0.1','2026-09-20 01:53:59.621'),('42f9d755-9166-4801-a69a-69c9a9d4fa82','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','0f2b595e-7188-4e35-baa8-ff088eeb592f','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:49:37.190'),('4b5be5a6-62cf-481e-af59-19bb1cd81321','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','43001c9e-85f5-4046-a444-405c1f264777','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:49:44.207'),('4c389b82-bf37-4a3d-9a43-3635e654b2b7','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','cdaede33-1f4a-43fd-854a-298ccbc6acba','{\"status\": \"OFF_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"AT_RISK\", \"currentValue\": 20}','::ffff:127.0.0.1','2026-09-20 01:47:54.682'),('53fc9832-7b12-478e-ad31-be652678f466','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','f8cbf509-64e0-4c75-a1ee-b2276d3ee3b1','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:32.331'),('5ce4714b-f092-416c-9fe2-af865b769263','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','409b7a7c-c885-446d-a3e4-dbce318ace61','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:23.715'),('60158407-0ba1-481c-8a9f-168d74163cb2','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','80f2a953-f30e-4b06-b32d-0962f1bb719c','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:49:57.742'),('623db8ac-5de2-4b5c-8b48-a66b9f381d03','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','USER','fe92b231-b9f5-443e-9ddb-fb230a1a3f63','{\"name\": \"Hafizh Abdan Syakura\", \"role\": \"TEAM\", \"position\": \"Executive Partner\", \"department\": \"STRATEGIC\"}','{\"name\": \"Hafizh Abdan Syakura\", \"role\": \"TEAM\", \"position\": \"Executive Partner\", \"department\": \"STRATEGIC\"}','::ffff:127.0.0.1','2026-09-23 07:15:14.641'),('630005fc-7ae9-4d14-bbe8-b28aa0fd533c','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','38805e20-2731-4155-902d-96ec5eb7431c','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:49:11.464'),('68b2e42a-a450-4444-86a4-abbcc533ae5e','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','1d4f6310-1835-4e05-97c9-5d440ce272e9','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:47.329'),('69cb9b4c-d048-4570-aa97-1d9a4dd8a3d3','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','987d6acb-c9ad-4fd1-a2d2-64e8f47d669d','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:19.264'),('76eaafc8-9a02-4543-a587-0c218a2bf6a9','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','STATUS_CHANGE','DEPARTMENT','050ce9dc-b734-4a76-81d0-f9950dcd85e7','{\"isActive\": true}','{\"isActive\": false}','::ffff:127.0.0.1','2026-09-20 02:20:12.719'),('777f08e3-88d1-4570-979a-8fa91f8d4081','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','USER','2fe0bee9-fe63-472d-be9c-735ee11ab167','{\"name\": \"Muhammad Akbar Buana Tafsili\", \"role\": \"C_LEVEL\", \"position\": \"Chief Business Officer\", \"department\": \"STRATEGIC\"}','{\"name\": \"Muhammad Akbar Buana Tafsili\", \"role\": \"TEAM\", \"position\": \"Chief Business Officer\", \"department\": \"STRATEGIC\"}','::ffff:127.0.0.1','2026-09-23 07:15:14.669'),('7e848031-fc13-4b27-92f0-3e6f5ef514c5','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','ASSIGN_C_LEVEL','DEPARTMENT','ee620a74-7005-4d66-b21e-8a0f3a5b3df3','{\"cLevelId\": null}','{\"cLevelId\": \"39e86d0c-2e4d-4f5b-ab77-eda0a332bbcd\"}','::ffff:127.0.0.1','2026-09-23 07:14:52.868'),('841aaa9a-1a9a-4f78-94af-5cf285efb249','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','0858f774-daf8-474b-a4c1-2699e30bb6ce','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:49:20.850'),('871a4ac0-1a33-46ae-a4e2-16ec6e043105','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','USER','39e86d0c-2e4d-4f5b-ab77-eda0a332bbcd','{\"name\": \"Devlin Hazrian Saleh\", \"role\": \"TEAM\", \"position\": \"Chief Executive Officer\", \"department\": \"STRATEGIC\"}','{\"name\": \"Devlin Hazrian Saleh\", \"role\": \"TEAM\", \"position\": \"Chief Executive Officer\", \"department\": null}','::ffff:127.0.0.1','2026-09-23 07:15:00.916'),('8b898d50-9256-451f-9fb0-6e0f7d93b33c','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','6481e067-3507-42f9-b669-ae495157311d','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:50.510'),('954b0898-e173-4010-b02b-03b1cfc7b3bb','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','3fa992e9-1702-41ab-8752-af094c848c89','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:49:47.463'),('9600fc30-7f2e-4f49-96ff-7c0c6c4b4704','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','46e7503b-7c60-4e98-9071-f856055b518c','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:55.741'),('9c49b38a-6b0b-49ee-aa12-73c87be801a0','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','STATUS_CHANGE','DEPARTMENT','6fac984b-5054-4e1b-89c8-6ae3ebe23c8e','{\"isActive\": true}','{\"isActive\": false}','::ffff:127.0.0.1','2026-09-20 02:35:56.574'),('9ee2c227-fa07-4d8b-a67f-f2dc2ef0a343','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','405b4e98-44d0-4be0-9bd4-7f292310b46d','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:26.440'),('a893b18e-8c3e-4bc0-844d-253658d2e72e','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','09d40249-ab85-4eda-90a4-9d2dd640aa2e','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:00.874'),('ab1359e9-f467-4e86-adf9-610859234ae5','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','REMOVE_MANAGER','DEPARTMENT','ee620a74-7005-4d66-b21e-8a0f3a5b3df3','{\"managerId\": \"39e86d0c-2e4d-4f5b-ab77-eda0a332bbcd\"}','{\"managerId\": null}','::ffff:127.0.0.1','2026-09-23 07:14:49.413'),('b0cad4f9-613e-4222-8f38-995aefa75c54','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','dbc7b786-b855-42df-9ba4-3201d403d013','{\"status\": \"OFF_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:43.439'),('ba1a97ad-2af5-4774-9ac5-ea439164acf3','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','b6ca80dc-4fca-4ebf-9df5-cb55bd7fa128','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:09.748'),('c5ab197e-da90-4e88-baf4-efbba809f114','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','cdaede33-1f4a-43fd-854a-298ccbc6acba','{\"status\": \"AT_RISK\", \"currentValue\": 20}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:48:50.700'),('ca1430c6-b4ed-462c-96b1-ea9d95c124c5','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','24e71c66-30b0-452e-8abb-282c68fb4607','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:49:16.572'),('dc035db5-2471-41dd-a861-4c501de9326b','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','a6793196-025b-4958-be89-92255cf6a6e5','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:40.744'),('e94e98d8-80d2-4c3e-a432-7449cd00b634','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','DELETE','USER','5f5e2343-0b52-446c-8891-814d68f9550d','{\"id\": \"5f5e2343-0b52-446c-8891-814d68f9550d\", \"name\": \"Alfyan Rajiv Attar\", \"role\": \"TEAM\", \"email\": \"alfyan@skolla.education\", \"department\": \"B2S\"}',NULL,'::ffff:127.0.0.1','2026-09-21 06:59:40.326'),('e9a05e33-f5e7-473a-b25a-17a636076d26','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','2fe500a0-1477-46d1-98e3-e01c3d8cd36b','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:51:05.160'),('e9dc9b68-14e1-4c68-a06d-73e3e5a50439',NULL,'STATUS_CHANGE','DEPARTMENT','cc69aa2b-d156-4a8e-9bf3-69f977fe6bac','{\"isActive\": true}','{\"isActive\": false}','::1','2026-09-20 02:31:22.010'),('eead0446-9e54-4ca6-8271-0786977dea18','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','UPDATE','KEY_RESULT','31751644-56e6-4049-a89f-94c48f9ed310','{\"status\": \"ON_TRACK\", \"currentValue\": 0}','{\"note\": null, \"status\": \"OFF_TRACK\", \"currentValue\": 0}','::ffff:127.0.0.1','2026-09-20 01:50:16.374');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `causal_link`
--

DROP TABLE IF EXISTS `causal_link`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `causal_link` (
  `id` varchar(191) NOT NULL,
  `source_kr_id` varchar(191) NOT NULL,
  `target_kr_id` varchar(191) NOT NULL,
  `relationship` varchar(191) NOT NULL,
  `note` text,
  `created_by` varchar(191) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `CausalLink_sourceKrId_idx` (`source_kr_id`),
  KEY `CausalLink_targetKrId_idx` (`target_kr_id`),
  CONSTRAINT `CausalLink_sourceKrId_fkey` FOREIGN KEY (`source_kr_id`) REFERENCES `key_result` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CausalLink_targetKrId_fkey` FOREIGN KEY (`target_kr_id`) REFERENCES `key_result` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `causal_link`
--

LOCK TABLES `causal_link` WRITE;
/*!40000 ALTER TABLE `causal_link` DISABLE KEYS */;
/*!40000 ALTER TABLE `causal_link` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department`
--

DROP TABLE IF EXISTS `department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `value` varchar(191) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `manager_id` varchar(191) DEFAULT NULL,
  `c_level_id` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Department_value_key` (`value`),
  KEY `Department_managerId_fkey` (`manager_id`),
  KEY `Department_cLevelId_fkey` (`c_level_id`),
  CONSTRAINT `Department_cLevelId_fkey` FOREIGN KEY (`c_level_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Department_managerId_fkey` FOREIGN KEY (`manager_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department`
--

LOCK TABLES `department` WRITE;
/*!40000 ALTER TABLE `department` DISABLE KEYS */;
INSERT INTO `department` VALUES ('050ce9dc-b734-4a76-81d0-f9950dcd85e7','Data','DATA',0,NULL,NULL,'2026-08-11 14:30:57.842'),('09a9bbaf-194f-4d46-9dbb-d1ce9e7f3904','Finance','FINANCE',1,NULL,NULL,'2026-08-11 14:30:57.833'),('0adfcf05-b80d-4d9d-b3ca-915b79091490','Techdev','TECHDEV',1,'e51d00a6-926d-4365-9115-5b2d2132c1fb','74355838-bb1e-4058-85bb-9648a88b2ed4','2026-08-11 14:30:57.839'),('1e85e1a2-d46a-44ca-af1b-a85ba2c25170','B2B Expansion','B2B_EXPANSION',0,'2fe0bee9-fe63-472d-be9c-735ee11ab167',NULL,'2026-08-11 14:30:57.835'),('3987916a-7979-473e-abbd-02719c225cc4','TechOps','TECHOPS',1,'e51d00a6-926d-4365-9115-5b2d2132c1fb',NULL,'2026-08-11 14:30:57.839'),('555e072e-7ba7-4e6f-af56-eacd5f2d95f7','B2S','B2S',1,'2fe0bee9-fe63-472d-be9c-735ee11ab167',NULL,'2026-08-11 14:30:57.834'),('61a5c920-751b-482e-b390-342beea66a24','Product Service','PRODUCT_SERVICE',1,NULL,NULL,'2026-08-11 14:30:57.837'),('6fac984b-5054-4e1b-89c8-6ae3ebe23c8e','Business','BUSINESS',0,NULL,NULL,'2026-08-11 14:30:57.834'),('7d275801-fed8-471c-b6cf-5a992b85553a','Education','EDUCATION',1,'e51d00a6-926d-4365-9115-5b2d2132c1fb',NULL,'2026-08-11 14:30:57.840'),('85375f75-b6db-4248-9721-7e17261d0e1c','HR','HR',1,NULL,NULL,'2026-08-11 14:30:57.843'),('b0934145-b7d9-4989-8455-cefb3bd383b8','B2C','B2C',1,'2fe0bee9-fe63-472d-be9c-735ee11ab167',NULL,'2026-08-11 14:30:57.836'),('b3a56c4e-d2a8-4b41-97f6-a717b8d4498a','Design','DESIGN',1,NULL,NULL,'2026-08-11 14:30:57.841'),('cc69aa2b-d156-4a8e-9bf3-69f977fe6bac','B2B Corporate','B2B_CORPORATE',0,'2fe0bee9-fe63-472d-be9c-735ee11ab167',NULL,'2026-08-11 14:30:57.835'),('e644c6da-c345-4e0d-af72-0c99aa4318d9','Service Account','SERVICE_ACCOUNT',1,'e51d00a6-926d-4365-9115-5b2d2132c1fb',NULL,'2026-08-11 14:30:57.838'),('ee620a74-7005-4d66-b21e-8a0f3a5b3df3','Strategic','STRATEGIC',1,NULL,'39e86d0c-2e4d-4f5b-ab77-eda0a332bbcd','2026-08-11 14:30:57.828'),('fa0d204f-287f-4b53-ac36-68fdbb03bb2d','Shared Service Center','SSC',1,'f28c7c3e-ebfd-490e-bee8-6a0823dcfa63',NULL,'2026-08-11 14:30:57.840');
/*!40000 ALTER TABLE `department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `initiative`
--

DROP TABLE IF EXISTS `initiative`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `initiative` (
  `id` varchar(191) NOT NULL,
  `key_result_id` varchar(191) DEFAULT NULL,
  `team_id` varchar(191) NOT NULL,
  `owner_id` varchar(191) DEFAULT NULL,
  `assigned_leader_id` varchar(191) DEFAULT NULL,
  `assigned_by` varchar(191) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `description` text,
  `target_value` double NOT NULL DEFAULT '0',
  `current_value` double NOT NULL DEFAULT '0',
  `achieved_value` double DEFAULT NULL,
  `unit` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'ON_TRACK',
  `kanban_status` varchar(191) NOT NULL DEFAULT 'TODO',
  `weight` double NOT NULL DEFAULT '1',
  `start_date` datetime(3) DEFAULT NULL,
  `due_date` datetime(3) DEFAULT NULL,
  `finish_date` datetime(3) DEFAULT NULL,
  `sprint_month` varchar(191) DEFAULT NULL,
  `sprint_id` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `documentation_link` varchar(191) DEFAULT NULL,
  `target_type` varchar(191) NOT NULL DEFAULT 'AT_LEAST',
  PRIMARY KEY (`id`),
  KEY `Initiative_sprintMonth_idx` (`sprint_month`),
  KEY `Initiative_keyResultId_idx` (`key_result_id`),
  KEY `Initiative_teamId_idx` (`team_id`),
  KEY `Initiative_ownerId_idx` (`owner_id`),
  KEY `Initiative_assignedLeaderId_idx` (`assigned_leader_id`),
  KEY `Initiative_sprintId_idx` (`sprint_id`),
  CONSTRAINT `initiative_assigned_leader_id_fkey` FOREIGN KEY (`assigned_leader_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Initiative_keyResultId_fkey` FOREIGN KEY (`key_result_id`) REFERENCES `key_result` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Initiative_ownerId_fkey` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `initiative_sprint_id_fkey` FOREIGN KEY (`sprint_id`) REFERENCES `sprint` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Initiative_teamId_fkey` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `initiative`
--

LOCK TABLES `initiative` WRITE;
/*!40000 ALTER TABLE `initiative` DISABLE KEYS */;
INSERT INTO `initiative` VALUES ('61f39dde-4d2f-4d75-822f-8f8415f72495',NULL,'e9395743-c354-43b4-98f2-2287ea12e07d','e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3',NULL,'e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','Inisiatif Automated Test Timeline',NULL,100,0,NULL,'%','OFF_TRACK','TODO',100,'2026-10-01 00:00:00.000','2026-10-25 00:00:00.000',NULL,'Sprint Oktober 2026','96b2af15-10ab-4a38-8166-a1aab7710057','2026-09-22 09:38:53.437','2026-09-22 09:38:53.437',NULL,'AT_LEAST'),('e21214d9-dacb-4494-a9a6-4032c74fe52c','5b2eb387-0a2c-472a-b75f-cae91a64e45d','b195b816-8168-48c3-9540-f37263f5c04f','3afaec1a-70ea-4998-bbb0-e0898cf29136',NULL,'2fe0bee9-fe63-472d-be9c-735ee11ab167','40 Deal bulan Oktober',NULL,40,0,NULL,'Sekolah','OFF_TRACK','TODO',1,NULL,NULL,NULL,'2026-10','96b2af15-10ab-4a38-8166-a1aab7710057','2026-09-22 09:51:38.177','2026-09-22 09:51:38.177',NULL,'AT_LEAST');
/*!40000 ALTER TABLE `initiative` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `initiative_kpi`
--

DROP TABLE IF EXISTS `initiative_kpi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `initiative_kpi` (
  `id` varchar(191) NOT NULL,
  `initiative_id` varchar(191) NOT NULL,
  `kpi_id` varchar(191) NOT NULL,
  `target_value` double NOT NULL,
  `current_value` double NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `InitiativeKpi_initiativeId_kpiId_key` (`initiative_id`,`kpi_id`),
  KEY `InitiativeKpi_initiativeId_idx` (`initiative_id`),
  KEY `InitiativeKpi_kpiId_idx` (`kpi_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `initiative_kpi`
--

LOCK TABLES `initiative_kpi` WRITE;
/*!40000 ALTER TABLE `initiative_kpi` DISABLE KEYS */;
/*!40000 ALTER TABLE `initiative_kpi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `initiative_update`
--

DROP TABLE IF EXISTS `initiative_update`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `initiative_update` (
  `id` varchar(191) NOT NULL,
  `initiative_id` varchar(191) NOT NULL,
  `old_value` double NOT NULL,
  `new_value` double NOT NULL,
  `note` text,
  `kanban_status` varchar(191) DEFAULT NULL,
  `submitted_by` varchar(191) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `link` varchar(191) DEFAULT NULL,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `reviewed_by` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING_APPROVAL',
  PRIMARY KEY (`id`),
  KEY `InitiativeUpdate_initiativeId_createdAt_idx` (`initiative_id`,`created_at`),
  CONSTRAINT `InitiativeUpdate_initiativeId_fkey` FOREIGN KEY (`initiative_id`) REFERENCES `initiative` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `initiative_update`
--

LOCK TABLES `initiative_update` WRITE;
/*!40000 ALTER TABLE `initiative_update` DISABLE KEYS */;
/*!40000 ALTER TABLE `initiative_update` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `key_result`
--

DROP TABLE IF EXISTS `key_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `key_result` (
  `id` varchar(191) NOT NULL,
  `objective_id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `target_value` double NOT NULL,
  `current_value` double NOT NULL DEFAULT '0',
  `unit` varchar(191) NOT NULL,
  `bsc_perspective` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'ON_TRACK',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `annual_key_result_id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `month` varchar(191) DEFAULT NULL,
  `month_weight` double NOT NULL DEFAULT '1',
  `is_manual_override` tinyint(1) NOT NULL DEFAULT '0',
  `target_type` varchar(191) NOT NULL DEFAULT 'AT_LEAST',
  PRIMARY KEY (`id`),
  KEY `KeyResult_objectiveId_idx` (`objective_id`),
  KEY `KeyResult_annualKeyResultId_fkey` (`annual_key_result_id`),
  CONSTRAINT `KeyResult_annualKeyResultId_fkey` FOREIGN KEY (`annual_key_result_id`) REFERENCES `annual_key_result` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `KeyResult_objectiveId_fkey` FOREIGN KEY (`objective_id`) REFERENCES `objective` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `key_result`
--

LOCK TABLES `key_result` WRITE;
/*!40000 ALTER TABLE `key_result` DISABLE KEYS */;
INSERT INTO `key_result` VALUES ('06a791db-83b0-494b-9df7-04bb9264ffc5','59438391-c544-47b6-8fc2-b361082e2fb1','Memastikan kecukupan cash runway',3000000000,0,'Rupiah','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.637','2026-09-20 01:49:30.573',NULL,NULL,1,1,'AT_LEAST'),('0858f774-daf8-474b-a4c1-2699e30bb6ce','59438391-c544-47b6-8fc2-b361082e2fb1','Mencapai target revenue dari setiap bisnis unit',31503810629,0,'Rupiah','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.620','2026-09-20 01:49:20.840',NULL,NULL,1,1,'AT_LEAST'),('09d40249-ab85-4eda-90a4-9d2dd640aa2e','b5c64d71-ba2c-4939-9b8f-f0bf5d56f847','Menurunkan Customer Effort Score',80,0,'%','INTERNAL_PROCESS','OFF_TRACK','2026-09-01 22:35:50.696','2026-09-20 01:50:00.858',NULL,NULL,1,1,'AT_LEAST'),('0f2b595e-7188-4e35-baa8-ff088eeb592f','7ffcc4bc-7a40-4f8d-816e-c6808b9ec28f','Meningkatkan collection rate (Days Sales Outstanding)',95,0,'%','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.646','2026-09-20 01:49:37.174',NULL,NULL,1,1,'AT_LEAST'),('12eeaaad-4adf-4591-81e9-8f7f577bc996','48cf64b2-7be7-4fea-be51-e433ac6914e1','Solving problem <1 jam apabila isu tidak perlu ada development dan keterangan isu lengkap',24,0,'Jam','INTERNAL_PROCESS','OFF_TRACK','2026-09-01 22:35:50.764','2026-09-20 01:46:00.460',NULL,'2026-09',1,0,'AT_LEAST'),('1d4f6310-1835-4e05-97c9-5d440ce272e9','fab86720-0a84-4124-a672-31338513e748','Adopsi dashboard single source of truth live dan menjadi rujukan utama manajemen',90,0,'%','LEARNING_GROWTH','OFF_TRACK','2026-09-01 22:35:50.812','2026-09-20 01:50:47.312',NULL,NULL,1,1,'AT_LEAST'),('1d96cc50-fbee-47dc-b252-37a5faed956b','cff3dcf4-fd7e-44b8-9e6c-0d8e1a352daa','100% BU/divisi memiliki OKR yang ter-cascade dari BSC perusahaan dan dimonitor tiap bulan',100,0,'%','LEARNING_GROWTH','OFF_TRACK','2026-09-01 22:35:50.855','2026-09-20 01:46:05.808',NULL,'2026-09',1,0,'AT_LEAST'),('24e71c66-30b0-452e-8abb-282c68fb4607','31901c56-26bf-4108-974a-a8f839f0d91a','[B2B Expansion] Mencapai Revenue Net B2B Expansion Rp15.000.000.000',15000000000,0,'Rupiah','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.594','2026-09-20 01:49:16.556',NULL,NULL,1,1,'AT_LEAST'),('2ef1cb42-c7c5-4416-827d-b32a9eda65bb','31901c56-26bf-4108-974a-a8f839f0d91a','[B2C] Mencapai target Organic Leads total 833',833,0,'Organic Leads','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.530','2026-09-20 01:45:52.102',NULL,'2026-09',1,0,'AT_LEAST'),('2fe500a0-1477-46d1-98e3-e01c3d8cd36b','2e3b7064-801a-45fa-b898-c8cda930eb99','Minimal 1 kajian R&D pengembangan bisnis/produk selesai per kuartal dengan rekomendasi yang diadopsi manajemen',1,0,'Unit','LEARNING_GROWTH','OFF_TRACK','2026-09-01 22:35:50.872','2026-09-20 01:51:05.147',NULL,NULL,1,1,'AT_LEAST'),('2ff7e867-19f6-48a1-9df3-69a65b6c7848','cff3dcf4-fd7e-44b8-9e6c-0d8e1a352daa','100% kepatuhan terhadap SOP & regulasi ketenagakerjaan (zero major violation)',100,0,'%','LEARNING_GROWTH','OFF_TRACK','2026-09-01 22:35:50.847','2026-09-20 01:46:08.360',NULL,'2026-09',1,0,'AT_LEAST'),('31751644-56e6-4049-a89f-94c48f9ed310','336563f9-e175-4e15-b095-e1bf787eb2e5','Menjaga downtime functional platform <20mins',20,0,'Menit','INTERNAL_PROCESS','OFF_TRACK','2026-09-01 22:35:50.731','2026-09-20 01:50:16.358',NULL,NULL,1,1,'AT_LEAST'),('3314dd5b-c268-46a2-966e-5f3bfc18290e','31901c56-26bf-4108-974a-a8f839f0d91a','[B2BC] Mencapai Revenue Net Rp4.700.000.000',4700000000,0,'Rupiah','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.558','2026-09-20 01:46:02.584',NULL,'2026-09',1,0,'AT_LEAST'),('38805e20-2731-4155-902d-96ec5eb7431c','31901c56-26bf-4108-974a-a8f839f0d91a','[B2S] Mencapai Revenue Net B2S Rp9.900.000.000',9900000000,0,'Rupiah','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.567','2026-09-20 01:49:11.449',NULL,NULL,1,1,'AT_LEAST'),('3fa992e9-1702-41ab-8752-af094c848c89','20560432-0747-42bd-b709-19da41b08b60','Menjaga angka churn rate <35%',35,0,'%','CUSTOMER','OFF_TRACK','2026-09-01 22:35:50.654','2026-09-20 01:49:47.446',NULL,NULL,1,1,'AT_LEAST'),('405b4e98-44d0-4be0-9bd4-7f292310b46d','48cf64b2-7be7-4fea-be51-e433ac6914e1','Solving problem <24 jam apabila isu tidak perlu ada development dan keterangan isu lengkap',24,0,'Jam','INTERNAL_PROCESS','OFF_TRACK','2026-09-01 22:35:50.756','2026-09-20 01:50:26.423',NULL,NULL,1,1,'AT_LEAST'),('409b7a7c-c885-446d-a3e4-dbce318ace61','48cf64b2-7be7-4fea-be51-e433ac6914e1','Menjaga First Response Time support <30 mins',30,0,'Menit','INTERNAL_PROCESS','OFF_TRACK','2026-09-01 22:35:50.780','2026-09-20 01:50:23.705',NULL,NULL,1,1,'AT_LEAST'),('43001c9e-85f5-4046-a444-405c1f264777','20560432-0747-42bd-b709-19da41b08b60','Meningkatkan retention rate dari existing customer >65%',65,0,'%','CUSTOMER','OFF_TRACK','2026-09-01 22:35:50.662','2026-09-20 01:49:44.193',NULL,NULL,1,1,'AT_LEAST'),('46e7503b-7c60-4e98-9071-f856055b518c','cff3dcf4-fd7e-44b8-9e6c-0d8e1a352daa','100% talent memiliki KPI yang ter-cascade dari BSC dan dimonitor performanya',100,0,'%','LEARNING_GROWTH','OFF_TRACK','2026-09-01 22:35:50.838','2026-09-20 01:50:55.727',NULL,NULL,1,1,'AT_LEAST'),('4ba3e994-c327-4fef-b827-7cf68ac9257a','31901c56-26bf-4108-974a-a8f839f0d91a','[B2C] Mencapai Revenue Net Rp600.000.000',600000000,0,'Rupiah','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.540','2026-09-04 03:41:53.439',NULL,'2026-09',1,0,'AT_LEAST'),('5b2eb387-0a2c-472a-b75f-cae91a64e45d','31901c56-26bf-4108-974a-a8f839f0d91a','[B2B Expansion] Mencapai Deal Kerja Sama dengan 86 Sekolah B2B Expansion (@55juta/Paket LMS Juara Rombel Menengah)',86,0,'Sekolah','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.603','2026-09-20 01:45:49.002',NULL,'2026-10',1,0,'AT_LEAST'),('5dcced09-cfe0-4d07-9fb1-190c0cf59654','31901c56-26bf-4108-974a-a8f839f0d91a','[B2B Expansion] Mencapai Deal Kerja Sama Penjualan dengan 29 Forum Kepala Sekolah Besar (@330 Juta/Forum)',29,0,'Forum','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.611','2026-09-20 01:49:03.792',NULL,NULL,1,1,'AT_LEAST'),('6481e067-3507-42f9-b669-ae495157311d','cff3dcf4-fd7e-44b8-9e6c-0d8e1a352daa','Fulfillment rate manpower optimal — 100% posisi kritikal terisi sesuai SLA rekrutmen',100,0,'%','LEARNING_GROWTH','OFF_TRACK','2026-09-01 22:35:50.829','2026-09-20 01:50:50.502',NULL,NULL,1,1,'AT_LEAST'),('6cc4efc0-19d9-4710-9454-cda86c4390e3','31901c56-26bf-4108-974a-a8f839f0d91a','[B2C] Mencapai target Paid Leads total 2800',2800,0,'Paid Leads','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.519','2026-09-02 08:21:39.148',NULL,'2026-09',1,0,'AT_LEAST'),('80f2a953-f30e-4b06-b32d-0962f1bb719c','b5c64d71-ba2c-4939-9b8f-f0bf5d56f847','Meningkatkan exam completion rate',80,0,'%','INTERNAL_PROCESS','OFF_TRACK','2026-09-01 22:35:50.715','2026-09-20 01:49:57.735',NULL,NULL,1,1,'AT_LEAST'),('82eb6a8e-465d-494e-aaae-ac43a15435f7','20560432-0747-42bd-b709-19da41b08b60','Mencapai Upsell 10% dari existing customer',10,0,'%','CUSTOMER','OFF_TRACK','2026-09-01 22:35:50.670','2026-09-20 01:49:40.973',NULL,NULL,1,1,'AT_LEAST'),('939cae9b-980f-443a-8916-eb060690f74a','336563f9-e175-4e15-b095-e1bf787eb2e5','Solving bug error P0-P1  <2x24 jam apabila mobile app',48,0,'Jam','INTERNAL_PROCESS','OFF_TRACK','2026-09-01 22:35:50.748','2026-09-20 01:50:13.190',NULL,NULL,1,1,'AT_LEAST'),('987d6acb-c9ad-4fd1-a2d2-64e8f47d669d','48cf64b2-7be7-4fea-be51-e433ac6914e1','<2 hari kerja request PO done terhitung data PO lengkap',48,0,'Jam','INTERNAL_PROCESS','OFF_TRACK','2026-09-01 22:35:50.772','2026-09-20 01:50:19.252',NULL,NULL,1,1,'AT_LEAST'),('a6793196-025b-4958-be89-92255cf6a6e5','8b4e67c9-8692-4c83-a2f0-87d4c0e5551c','Menjaga tingkat kepuasan layanan Skolla >82%',82,0,'%','LEARNING_GROWTH','OFF_TRACK','2026-09-01 22:35:50.803','2026-09-20 01:50:40.727',NULL,NULL,1,1,'AT_LEAST'),('abba8f2d-05e8-4223-bd54-c42cf6bac17f','0c9c7062-d413-4ad7-a56a-4156f173285b','Menjaga jumlah sekolah terkategori merah <20%',20,0,'%','CUSTOMER','OFF_TRACK','2026-09-01 22:35:50.679','2026-09-20 01:49:50.776',NULL,NULL,1,1,'AT_LEAST'),('b4742437-4c46-46fb-8397-e8526673468b','8b4e67c9-8692-4c83-a2f0-87d4c0e5551c','100% akurasi produk dengan kebutuhan user',100,0,'%','INTERNAL_PROCESS','OFF_TRACK','2026-09-01 22:35:50.796','2026-09-20 01:50:35.723',NULL,NULL,1,1,'AT_LEAST'),('b6ca80dc-4fca-4ebf-9df5-cb55bd7fa128','336563f9-e175-4e15-b095-e1bf787eb2e5','Solving bug error P0-P1 <24 jam apabila web atau backend',24,0,'Jam','INTERNAL_PROCESS','OFF_TRACK','2026-09-01 22:35:50.740','2026-09-20 01:50:09.737',NULL,NULL,1,1,'AT_LEAST'),('b817f395-b2af-4b6f-985a-5ed449f9f516','b5c64d71-ba2c-4939-9b8f-f0bf5d56f847','Rata-rata active user 80%',80,0,'%','INTERNAL_PROCESS','OFF_TRACK','2026-09-01 22:35:50.706','2026-09-20 01:49:54.674',NULL,NULL,1,1,'AT_LEAST'),('bc12ef4e-275b-42b9-afa4-7c5af1dae888','7ffcc4bc-7a40-4f8d-816e-c6808b9ec28f','Menurunkan cost-to-revenue ratio (operating expense)',75,0,'%','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.629','2026-09-20 01:49:33.661',NULL,NULL,1,1,'AT_LEAST'),('c4ba49b5-4948-44a9-b7b7-df8e7c5f1757','31901c56-26bf-4108-974a-a8f839f0d91a','[B2S] Mencapai Deal Kerja Sama dengan 95 Sekolah B2S (@55juta/Paket LMS Juara Rombel Menengah)',95,0,'Sekolah','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.576','2026-09-20 01:48:55.031',NULL,NULL,1,1,'AT_LEAST'),('cab7316b-d491-4e2a-9cf3-b31b590cb434','2e3b7064-801a-45fa-b898-c8cda930eb99','Cadence review performa (BSC & Scrum sprint review) berjalan konsisten dengan ≥90% action item ditindaklanjuti tepat waktu',90,0,'%','LEARNING_GROWTH','OFF_TRACK','2026-09-01 22:35:50.864','2026-09-20 01:51:01.344',NULL,NULL,1,1,'AT_LEAST'),('cdaede33-1f4a-43fd-854a-298ccbc6acba','31901c56-26bf-4108-974a-a8f839f0d91a','[B2BC] Mengumpulkan dan Mengkonversi 38 Prospect Leads',38,0,'Leads','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.549','2026-09-20 01:48:50.682',NULL,'2026-10',1,1,'AT_LEAST'),('d74d2f49-6e07-47f8-bfa1-3e5a6f195dde','31901c56-26bf-4108-974a-a8f839f0d91a','[B2S] Mencapai Deal Kerja Sama Penjualan dengan 22 Forum Kepala Sekolah (B2S) (@100 Juta/Forum)',22,0,'Forum','FINANCIAL','OFF_TRACK','2026-09-01 22:35:50.584','2026-09-20 01:48:59.430',NULL,NULL,1,1,'AT_LEAST'),('dbc7b786-b855-42df-9ba4-3201d403d013','fab86720-0a84-4124-a672-31338513e748','100% laporan performa SSC & BU tersedia real-time/self-service, tanpa proses manual berulang',100,0,'%','LEARNING_GROWTH','OFF_TRACK','2026-09-01 22:35:50.821','2026-09-20 01:50:43.424',NULL,'2026-09',1,1,'AT_LEAST'),('ebb90f93-a016-4172-ba52-4d7d84b7b273','336563f9-e175-4e15-b095-e1bf787eb2e5','Menjaga downtime infrastructure <30mins',30,0,'Menit','INTERNAL_PROCESS','OFF_TRACK','2026-09-01 22:35:50.723','2026-09-20 01:50:05.498',NULL,NULL,1,1,'AT_LEAST'),('f8cbf509-64e0-4c75-a1ee-b2276d3ee3b1','8b4e67c9-8692-4c83-a2f0-87d4c0e5551c','100% pencapaian target produksi',100,0,'%','INTERNAL_PROCESS','OFF_TRACK','2026-09-01 22:35:50.788','2026-09-20 01:50:32.320',NULL,NULL,1,1,'AT_LEAST'),('f9d74595-5e69-4772-aff1-ca42e10d7efb','2f0c174e-998f-489d-8201-a111354357bc','Meningkatkan product goal success rate',80,0,'%','CUSTOMER','OFF_TRACK','2026-09-01 22:35:50.688','2026-09-20 01:45:41.428',NULL,'2026-09',1,0,'AT_LEAST');
/*!40000 ALTER TABLE `key_result` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kpi`
--

DROP TABLE IF EXISTS `kpi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kpi` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `department` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bsc_perspective` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `default_target` double DEFAULT NULL,
  `status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Kpi_department_idx` (`department`),
  KEY `Kpi_bscPerspective_idx` (`bsc_perspective`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kpi`
--

LOCK TABLES `kpi` WRITE;
/*!40000 ALTER TABLE `kpi` DISABLE KEYS */;
/*!40000 ALTER TABLE `kpi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kr_assignment`
--

DROP TABLE IF EXISTS `kr_assignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kr_assignment` (
  `id` varchar(191) NOT NULL,
  `key_result_id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `assigned_by` varchar(191) NOT NULL,
  `assigned_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `raci_role` varchar(191) NOT NULL DEFAULT 'RESPONSIBLE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `KrAssignment_keyResultId_userId_key` (`key_result_id`,`user_id`),
  KEY `KrAssignment_keyResultId_idx` (`key_result_id`),
  KEY `KrAssignment_userId_idx` (`user_id`),
  CONSTRAINT `KrAssignment_keyResultId_fkey` FOREIGN KEY (`key_result_id`) REFERENCES `key_result` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `KrAssignment_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kr_assignment`
--

LOCK TABLES `kr_assignment` WRITE;
/*!40000 ALTER TABLE `kr_assignment` DISABLE KEYS */;
INSERT INTO `kr_assignment` VALUES ('006bbdb7-ac08-4b49-8d14-8a7036c97d9f','43001c9e-85f5-4046-a444-405c1f264777','5acebc3e-e242-4bc7-87ba-13cfe19b8751','Skolla Education','2026-09-01 22:35:50.666','ACCOUNTABLE'),('02dd9cb0-2932-4888-b44c-a3796b635266','2ff7e867-19f6-48a1-9df3-69a65b6c7848','f881cfa0-3834-4355-990e-9126a125ab68','Skolla Education','2026-09-01 22:35:50.851','ACCOUNTABLE'),('037744b6-8b3a-440f-81d7-57299c245b56','1d4f6310-1835-4e05-97c9-5d440ce272e9','504f885d-df18-4a7a-901d-29e0174c7432','Skolla Education','2026-09-01 22:35:50.817','ACCOUNTABLE'),('03d296cd-9477-41f3-be65-e6420ad4611c','0f2b595e-7188-4e35-baa8-ff088eeb592f','c00701ad-1eca-4ade-bb4c-48ac29647297','Skolla Education','2026-09-01 22:35:50.650','ACCOUNTABLE'),('0842b587-5725-49a2-8170-1f95f8167afd','405b4e98-44d0-4be0-9bd4-7f292310b46d','17dc67ce-90a4-441e-9a78-42c2af92711f','Skolla Education','2026-09-01 22:35:50.760','ACCOUNTABLE'),('08a78676-d4ad-426c-8419-f0af6e03e84c','ebb90f93-a016-4172-ba52-4d7d84b7b273','26968b6a-da68-4656-8a71-f038cdeae65a','Skolla Education','2026-09-01 22:35:50.727','ACCOUNTABLE'),('0ff87157-5d22-43b1-b7e1-9dbc64d5befa','31751644-56e6-4049-a89f-94c48f9ed310','26968b6a-da68-4656-8a71-f038cdeae65a','Skolla Education','2026-09-01 22:35:50.736','ACCOUNTABLE'),('128dcbe3-2aee-4675-af81-2ed4c4a804aa','46e7503b-7c60-4e98-9071-f856055b518c','f881cfa0-3834-4355-990e-9126a125ab68','Skolla Education','2026-09-01 22:35:50.842','ACCOUNTABLE'),('1ca1f2f8-ff34-4c43-b849-a2c781fd1a34','06a791db-83b0-494b-9df7-04bb9264ffc5','c00701ad-1eca-4ade-bb4c-48ac29647297','Skolla Education','2026-09-01 22:35:50.641','ACCOUNTABLE'),('1dc466a9-0e7e-4c52-9d8a-60cce9980e81','a6793196-025b-4958-be89-92255cf6a6e5','8faec284-7b1f-4b2c-a9b0-bffd764a73f1','Skolla Education','2026-09-01 22:35:50.808','ACCOUNTABLE'),('1de8b939-2935-4968-9644-d793b5d2ec55','f9d74595-5e69-4772-aff1-ca42e10d7efb','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.690','RESPONSIBLE'),('1f5acc4f-9793-4b78-b775-09f1dc4d3b06','abba8f2d-05e8-4223-bd54-c42cf6bac17f','5acebc3e-e242-4bc7-87ba-13cfe19b8751','Skolla Education','2026-09-01 22:35:50.683','ACCOUNTABLE'),('215425c4-b4a6-49c7-96a9-ea6a8e1fdaa8','5b2eb387-0a2c-472a-b75f-cae91a64e45d','2fe0bee9-fe63-472d-be9c-735ee11ab167','Skolla Education','2026-09-01 22:35:50.605','RESPONSIBLE'),('2818452f-c147-4105-a79f-2ee8d6fb8d0f','2fe500a0-1477-46d1-98e3-e01c3d8cd36b','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','Skolla Education','2026-09-01 22:35:50.873','ACCOUNTABLE'),('2ae24b21-3de0-4353-baa5-eec1d7aacee7','12eeaaad-4adf-4591-81e9-8f7f577bc996','17dc67ce-90a4-441e-9a78-42c2af92711f','Skolla Education','2026-09-01 22:35:50.768','ACCOUNTABLE'),('2e9e015c-3068-4896-b4cf-0f4b696f6e7b','cdaede33-1f4a-43fd-854a-298ccbc6acba','a006dc97-54ee-403c-a82f-95ec9ff1f5f7','Skolla Education','2026-09-01 22:35:50.554','ACCOUNTABLE'),('3176663a-0f0c-45dd-aac3-07b03038b79a','ebb90f93-a016-4172-ba52-4d7d84b7b273','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.725','RESPONSIBLE'),('36e1a098-db62-4b26-a092-41a5d75269e0','b4742437-4c46-46fb-8397-e8526673468b','8faec284-7b1f-4b2c-a9b0-bffd764a73f1','Skolla Education','2026-09-01 22:35:50.799','ACCOUNTABLE'),('3f9e2a5e-69f8-4e09-af65-2eae682a2b55','4ba3e994-c327-4fef-b827-7cf68ac9257a','2fe0bee9-fe63-472d-be9c-735ee11ab167','Skolla Education','2026-09-01 22:35:50.543','RESPONSIBLE'),('41d7d01d-c8db-4a74-a097-ad7c3cf781c5','43001c9e-85f5-4046-a444-405c1f264777','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.664','RESPONSIBLE'),('43fdb594-de84-46e4-b0d0-0bd1a4cb0ba9','dbc7b786-b855-42df-9ba4-3201d403d013','504f885d-df18-4a7a-901d-29e0174c7432','Skolla Education','2026-09-01 22:35:50.825','ACCOUNTABLE'),('4707606d-9cd3-4b77-a488-4d04ba8d81cd','12eeaaad-4adf-4591-81e9-8f7f577bc996','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.766','RESPONSIBLE'),('4c61aea7-81c9-4b6b-a3aa-4c73a99a8e3d','939cae9b-980f-443a-8916-eb060690f74a','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.750','RESPONSIBLE'),('4fdab8a6-ce4f-4448-a1a9-cf654265d90f','09d40249-ab85-4eda-90a4-9d2dd640aa2e','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.699','RESPONSIBLE'),('508005f7-4f18-4979-ac2e-42e44b85af89','cdaede33-1f4a-43fd-854a-298ccbc6acba','2fe0bee9-fe63-472d-be9c-735ee11ab167','Skolla Education','2026-09-01 22:35:50.552','RESPONSIBLE'),('538eb476-753d-440f-8c67-6a21bcee37ce','5b2eb387-0a2c-472a-b75f-cae91a64e45d','3afaec1a-70ea-4998-bbb0-e0898cf29136','Skolla Education','2026-09-01 22:35:50.607','ACCOUNTABLE'),('56674fd5-c8c9-4b0a-b07d-c20b501c9545','f8cbf509-64e0-4c75-a1ee-b2276d3ee3b1','8faec284-7b1f-4b2c-a9b0-bffd764a73f1','Skolla Education','2026-09-01 22:35:50.792','ACCOUNTABLE'),('56d50fa5-4493-4c8a-881c-63258586402c','31751644-56e6-4049-a89f-94c48f9ed310','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.734','RESPONSIBLE'),('58c84224-92cf-4e7d-b810-e9fcaf120ab4','80f2a953-f30e-4b06-b32d-0962f1bb719c','26968b6a-da68-4656-8a71-f038cdeae65a','Skolla Education','2026-09-01 22:35:50.719','ACCOUNTABLE'),('608af187-ac7c-4b74-834f-359810239bc8','f9d74595-5e69-4772-aff1-ca42e10d7efb','8faec284-7b1f-4b2c-a9b0-bffd764a73f1','Skolla Education','2026-09-01 22:35:50.692','ACCOUNTABLE'),('6a47f533-1c32-4498-8a0a-7f9592dacb52','2ef1cb42-c7c5-4416-827d-b32a9eda65bb','a77d84da-3cc0-4f0c-bbd8-0986176f5197','Skolla Education','2026-09-01 22:35:50.536','ACCOUNTABLE'),('6e15e75b-332c-476b-9f46-b81bddc7e026','b4742437-4c46-46fb-8397-e8526673468b','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.797','RESPONSIBLE'),('6f457b72-df18-4a56-ab3e-112d28d048fc','06a791db-83b0-494b-9df7-04bb9264ffc5','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','Skolla Education','2026-09-01 22:35:50.639','RESPONSIBLE'),('70c5f8bf-2c37-4541-b892-b49580ff0953','a6793196-025b-4958-be89-92255cf6a6e5','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.806','RESPONSIBLE'),('7498a9ad-0ea0-4047-b627-aaff6878f997','5dcced09-cfe0-4d07-9fb1-190c0cf59654','3afaec1a-70ea-4998-bbb0-e0898cf29136','Skolla Education','2026-09-01 22:35:50.616','ACCOUNTABLE'),('74c91b74-816a-48f2-8dc3-3315a214e3d3','0858f774-daf8-474b-a4c1-2699e30bb6ce','c00701ad-1eca-4ade-bb4c-48ac29647297','Skolla Education','2026-09-01 22:35:50.624','ACCOUNTABLE'),('757e88cf-8888-414a-9b5c-b1733337226e','d74d2f49-6e07-47f8-bfa1-3e5a6f195dde','2fe0bee9-fe63-472d-be9c-735ee11ab167','Skolla Education','2026-09-01 22:35:50.587','RESPONSIBLE'),('78f30a63-3928-4c17-ae4f-f24b0655b955','939cae9b-980f-443a-8916-eb060690f74a','26968b6a-da68-4656-8a71-f038cdeae65a','Skolla Education','2026-09-01 22:35:50.752','ACCOUNTABLE'),('7b3852e1-636a-48c6-b373-fe0d67123afd','bc12ef4e-275b-42b9-afa4-7c5af1dae888','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','Skolla Education','2026-09-01 22:35:50.631','RESPONSIBLE'),('7da154b8-9eba-4985-b010-083da48324e6','c4ba49b5-4948-44a9-b7b7-df8e7c5f1757','e5e0562f-dcf7-495c-8ec1-9954f59e5231','Skolla Education','2026-09-01 22:35:50.580','ACCOUNTABLE'),('82702a59-e1c6-4aa8-8419-44a9d6a1155e','6481e067-3507-42f9-b669-ae495157311d','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','Skolla Education','2026-09-01 22:35:50.832','RESPONSIBLE'),('83f1cd8c-fb5b-4f23-84a0-1c0028597931','cab7316b-d491-4e2a-9cf3-b31b590cb434','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','Skolla Education','2026-09-01 22:35:50.866','ACCOUNTABLE'),('85ca7d37-54ef-4b54-bd62-e7af8d240060','24e71c66-30b0-452e-8abb-282c68fb4607','3afaec1a-70ea-4998-bbb0-e0898cf29136','Skolla Education','2026-09-01 22:35:50.598','ACCOUNTABLE'),('86d8165c-fe93-4196-bc12-730734c87abc','6481e067-3507-42f9-b669-ae495157311d','f881cfa0-3834-4355-990e-9126a125ab68','Skolla Education','2026-09-01 22:35:50.834','ACCOUNTABLE'),('88a230cb-ae34-474f-b8f5-0d843f661123','c4ba49b5-4948-44a9-b7b7-df8e7c5f1757','2fe0bee9-fe63-472d-be9c-735ee11ab167','Skolla Education','2026-09-01 22:35:50.578','RESPONSIBLE'),('8c7a8fe2-e48b-4909-aa57-d368e24817f6','24e71c66-30b0-452e-8abb-282c68fb4607','2fe0bee9-fe63-472d-be9c-735ee11ab167','Skolla Education','2026-09-01 22:35:50.596','RESPONSIBLE'),('8cde47a8-fa30-4f41-9ee6-aaac796117e4','3314dd5b-c268-46a2-966e-5f3bfc18290e','a006dc97-54ee-403c-a82f-95ec9ff1f5f7','Skolla Education','2026-09-01 22:35:50.562','ACCOUNTABLE'),('8deb8650-957e-4383-9363-45fbb62058e8','0858f774-daf8-474b-a4c1-2699e30bb6ce','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','Skolla Education','2026-09-01 22:35:50.622','RESPONSIBLE'),('8f3b501b-e43e-41d3-abb3-28a1d1ad31bc','b817f395-b2af-4b6f-985a-5ed449f9f516','26968b6a-da68-4656-8a71-f038cdeae65a','Skolla Education','2026-09-01 22:35:50.710','ACCOUNTABLE'),('9242530f-edd9-4b51-a003-0431b04fd493','2ef1cb42-c7c5-4416-827d-b32a9eda65bb','2fe0bee9-fe63-472d-be9c-735ee11ab167','Skolla Education','2026-09-01 22:35:50.533','RESPONSIBLE'),('92560f5a-3836-48e6-ac3d-f6e24ffc6549','4ba3e994-c327-4fef-b827-7cf68ac9257a','a77d84da-3cc0-4f0c-bbd8-0986176f5197','Skolla Education','2026-09-01 22:35:50.545','ACCOUNTABLE'),('9330ded8-c84d-4715-bd2b-ff9c2757196b','b6ca80dc-4fca-4ebf-9df5-cb55bd7fa128','26968b6a-da68-4656-8a71-f038cdeae65a','Skolla Education','2026-09-01 22:35:50.744','ACCOUNTABLE'),('947a2f23-a1e2-40a2-a82f-60656061abe7','405b4e98-44d0-4be0-9bd4-7f292310b46d','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.758','RESPONSIBLE'),('96de97f5-cf27-45c5-a67e-91bb5fadf39b','409b7a7c-c885-446d-a3e4-dbce318ace61','17dc67ce-90a4-441e-9a78-42c2af92711f','Skolla Education','2026-09-01 22:35:50.784','ACCOUNTABLE'),('9acdc2ea-0404-4e52-bf9d-688e49d09f55','987d6acb-c9ad-4fd1-a2d2-64e8f47d669d','17dc67ce-90a4-441e-9a78-42c2af92711f','Skolla Education','2026-09-01 22:35:50.776','ACCOUNTABLE'),('9dbde9d8-d35a-42f3-b57a-6f18ac5ac9b8','3fa992e9-1702-41ab-8752-af094c848c89','5acebc3e-e242-4bc7-87ba-13cfe19b8751','Skolla Education','2026-09-01 22:35:50.657','ACCOUNTABLE'),('9e22be93-fe23-43e3-92bd-65c5a63073e5','80f2a953-f30e-4b06-b32d-0962f1bb719c','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.717','RESPONSIBLE'),('9ef60999-4d8a-4b77-91ca-2bf2c4f609b6','1d96cc50-fbee-47dc-b252-37a5faed956b','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','Skolla Education','2026-09-01 22:35:50.857','ACCOUNTABLE'),('a090d784-d584-412e-b0af-6f1bf63a0d02','b6ca80dc-4fca-4ebf-9df5-cb55bd7fa128','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.742','RESPONSIBLE'),('a2cd7a34-a5df-4ca2-b42c-d91ddd0454ce','1d4f6310-1835-4e05-97c9-5d440ce272e9','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','Skolla Education','2026-09-01 22:35:50.814','RESPONSIBLE'),('a66a4472-e047-4e49-a79f-85907adcf9f7','46e7503b-7c60-4e98-9071-f856055b518c','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','Skolla Education','2026-09-01 22:35:50.840','RESPONSIBLE'),('a9f47784-0831-46e3-a23b-24cecf0b14fc','d74d2f49-6e07-47f8-bfa1-3e5a6f195dde','e5e0562f-dcf7-495c-8ec1-9954f59e5231','Skolla Education','2026-09-01 22:35:50.589','ACCOUNTABLE'),('b04cddc4-aa53-4baf-9b1f-e343ec67f7ed','09d40249-ab85-4eda-90a4-9d2dd640aa2e','26968b6a-da68-4656-8a71-f038cdeae65a','Skolla Education','2026-09-01 22:35:50.701','ACCOUNTABLE'),('b0b19850-cddd-4a59-b57f-d2aae36e2016','bc12ef4e-275b-42b9-afa4-7c5af1dae888','c00701ad-1eca-4ade-bb4c-48ac29647297','Skolla Education','2026-09-01 22:35:50.633','ACCOUNTABLE'),('b19d71c8-159c-43d4-870d-119b31bb2b06','abba8f2d-05e8-4223-bd54-c42cf6bac17f','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.681','RESPONSIBLE'),('b243ab64-f3e9-4724-af3a-2eda3dc1b9cf','5dcced09-cfe0-4d07-9fb1-190c0cf59654','2fe0bee9-fe63-472d-be9c-735ee11ab167','Skolla Education','2026-09-01 22:35:50.614','RESPONSIBLE'),('b8073da1-9059-4194-93c0-4b3341b5f40b','3fa992e9-1702-41ab-8752-af094c848c89','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.656','RESPONSIBLE'),('c1adc134-2252-4ee9-9200-59f8e7c11542','0f2b595e-7188-4e35-baa8-ff088eeb592f','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','Skolla Education','2026-09-01 22:35:50.648','RESPONSIBLE'),('c3ccb9a3-9b36-449c-829e-83a9db5a5bdd','b817f395-b2af-4b6f-985a-5ed449f9f516','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.708','RESPONSIBLE'),('c7540040-06de-478a-860b-29e0472c355f','38805e20-2731-4155-902d-96ec5eb7431c','e5e0562f-dcf7-495c-8ec1-9954f59e5231','Skolla Education','2026-09-01 22:35:50.571','ACCOUNTABLE'),('d1060bc2-934a-4424-80e2-e54f8afebdcd','38805e20-2731-4155-902d-96ec5eb7431c','2fe0bee9-fe63-472d-be9c-735ee11ab167','Skolla Education','2026-09-01 22:35:50.569','RESPONSIBLE'),('d37df340-9ddd-4e99-8ac1-ef5dfaa63f11','987d6acb-c9ad-4fd1-a2d2-64e8f47d669d','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.774','RESPONSIBLE'),('d77e08a2-75f3-4aa6-a769-f5c947ff2887','3314dd5b-c268-46a2-966e-5f3bfc18290e','2fe0bee9-fe63-472d-be9c-735ee11ab167','Skolla Education','2026-09-01 22:35:50.560','RESPONSIBLE'),('da3974c1-5263-45e4-953c-21eb4064eacd','82eb6a8e-465d-494e-aaae-ac43a15435f7','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.673','RESPONSIBLE'),('daa80e88-855c-41a7-8f26-679b3bff24b7','409b7a7c-c885-446d-a3e4-dbce318ace61','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.782','RESPONSIBLE'),('ddf25010-4b3e-40d5-90df-8e44eb7caa4d','2ff7e867-19f6-48a1-9df3-69a65b6c7848','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','Skolla Education','2026-09-01 22:35:50.849','RESPONSIBLE'),('e5813e9a-875c-4f87-b262-90ee6326643b','f8cbf509-64e0-4c75-a1ee-b2276d3ee3b1','e51d00a6-926d-4365-9115-5b2d2132c1fb','Skolla Education','2026-09-01 22:35:50.790','RESPONSIBLE'),('e7be4ff1-4a99-4384-938e-bd612dd7361f','6cc4efc0-19d9-4710-9454-cda86c4390e3','a77d84da-3cc0-4f0c-bbd8-0986176f5197','Skolla Education','2026-09-01 22:35:50.525','ACCOUNTABLE'),('edcf9b2a-d06f-46f7-b1bd-0ae084f0d8ca','82eb6a8e-465d-494e-aaae-ac43a15435f7','5acebc3e-e242-4bc7-87ba-13cfe19b8751','Skolla Education','2026-09-01 22:35:50.675','ACCOUNTABLE'),('fde3f491-a4f5-433a-a722-00f70c43f8da','6cc4efc0-19d9-4710-9454-cda86c4390e3','2fe0bee9-fe63-472d-be9c-735ee11ab167','Skolla Education','2026-09-01 22:35:50.523','RESPONSIBLE'),('fdf34b79-30b5-4bb9-ad7e-17aa49059ba0','dbc7b786-b855-42df-9ba4-3201d403d013','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','Skolla Education','2026-09-01 22:35:50.823','RESPONSIBLE');
/*!40000 ALTER TABLE `kr_assignment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kr_department`
--

DROP TABLE IF EXISTS `kr_department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kr_department` (
  `id` varchar(191) NOT NULL,
  `key_result_id` varchar(191) NOT NULL,
  `department` varchar(191) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `KrDepartment_keyResultId_department_key` (`key_result_id`,`department`),
  KEY `KrDepartment_keyResultId_idx` (`key_result_id`),
  CONSTRAINT `KrDepartment_keyResultId_fkey` FOREIGN KEY (`key_result_id`) REFERENCES `key_result` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kr_department`
--

LOCK TABLES `kr_department` WRITE;
/*!40000 ALTER TABLE `kr_department` DISABLE KEYS */;
INSERT INTO `kr_department` VALUES ('077d7d14-1343-4de8-be9e-7d468883c7d4','1d96cc50-fbee-47dc-b252-37a5faed956b','SSC','2026-09-01 22:35:50.862'),('13882d86-4728-42e4-b432-7a09d1cf8c40','31751644-56e6-4049-a89f-94c48f9ed310','TECHDEV','2026-09-01 22:35:50.738'),('141fc232-8d92-4880-a74c-813dd8746655','3314dd5b-c268-46a2-966e-5f3bfc18290e','B2B_CORPORATION','2026-09-01 22:35:50.565'),('2108e3fd-2ef8-49c6-a16b-a2e900208108','0858f774-daf8-474b-a4c1-2699e30bb6ce','FINANCE','2026-09-01 22:35:50.626'),('24367378-4017-47d6-a786-73981c51d1c9','2ef1cb42-c7c5-4416-827d-b32a9eda65bb','B2C','2026-09-01 22:35:50.538'),('24d9332f-a5a5-493a-abb7-3a997a0e2808','82eb6a8e-465d-494e-aaae-ac43a15435f7','SERVICE_ACCOUNT','2026-09-01 22:35:50.677'),('277d3d37-4c55-4578-a431-f36ebaa5754c','d74d2f49-6e07-47f8-bfa1-3e5a6f195dde','B2S','2026-09-01 22:35:50.591'),('311bfc74-281f-4c50-9d4e-3ee5c66f01ba','46e7503b-7c60-4e98-9071-f856055b518c','SSC','2026-09-01 22:35:50.844'),('34fe0b4f-67a9-427e-9224-66ad1670dc83','bc12ef4e-275b-42b9-afa4-7c5af1dae888','FINANCE','2026-09-01 22:35:50.635'),('381d05ae-55b0-41b7-8786-e41fc9e58734','b817f395-b2af-4b6f-985a-5ed449f9f516','TECHDEV','2026-09-01 22:35:50.713'),('38c9a3c4-d299-411a-b8d0-fde1ec1d659c','6cc4efc0-19d9-4710-9454-cda86c4390e3','B2C','2026-09-01 22:35:50.528'),('3bff04b2-60f0-4079-874b-1f7de94c7e6f','09d40249-ab85-4eda-90a4-9d2dd640aa2e','TECHDEV','2026-09-01 22:35:50.703'),('3d5f6774-e962-4673-8e62-25aed31a8c4c','3fa992e9-1702-41ab-8752-af094c848c89','SERVICE_ACCOUNT','2026-09-01 22:35:50.660'),('3f467296-52bd-441d-bd9b-7bb6cc7806f5','5b2eb387-0a2c-472a-b75f-cae91a64e45d','B2B_EXPANSION','2026-09-01 22:35:50.609'),('46a1ef4b-e195-42e2-92bc-52963efd7b35','0f2b595e-7188-4e35-baa8-ff088eeb592f','FINANCE','2026-09-01 22:35:50.652'),('4b496e58-361b-4806-ab82-5ee0edfb296a','ebb90f93-a016-4172-ba52-4d7d84b7b273','TECHDEV','2026-09-01 22:35:50.729'),('538cdafe-63d7-4378-b928-7223704654fb','abba8f2d-05e8-4223-bd54-c42cf6bac17f','SERVICE_ACCOUNT','2026-09-01 22:35:50.685'),('549baef5-0b6a-4947-a7f6-37bcd9ac1eee','dbc7b786-b855-42df-9ba4-3201d403d013','SSC','2026-09-01 22:35:50.827'),('55247a11-afce-451e-a4d9-4b445a89b169','cab7316b-d491-4e2a-9cf3-b31b590cb434','SSC','2026-09-01 22:35:50.870'),('56ba9e1c-6c9b-4992-bd3d-c028065c8ff8','4ba3e994-c327-4fef-b827-7cf68ac9257a','B2C','2026-09-01 22:35:50.547'),('59301cee-f937-49f6-8106-c61b82075f72','06a791db-83b0-494b-9df7-04bb9264ffc5','FINANCE','2026-09-01 22:35:50.643'),('684eef9f-3c85-40df-bb2e-9ab8f350431a','12eeaaad-4adf-4591-81e9-8f7f577bc996','TECHOPS','2026-09-01 22:35:50.770'),('7247fa5c-5260-4f22-8b33-68b6dc27eaf1','f9d74595-5e69-4772-aff1-ca42e10d7efb','EDUCATION','2026-09-01 22:35:50.694'),('85fd0233-0534-4495-b059-ba5cc01d1f20','b4742437-4c46-46fb-8397-e8526673468b','EDUCATION','2026-09-01 22:35:50.801'),('8831826f-5c4d-4daa-bca6-2b89411c3fab','2ff7e867-19f6-48a1-9df3-69a65b6c7848','SSC','2026-09-01 22:35:50.853'),('8887b9cd-f646-4ad9-852c-4e0728b43555','cdaede33-1f4a-43fd-854a-298ccbc6acba','B2B_CORPORATION','2026-09-01 22:35:50.556'),('91c3ecb4-6cfe-4a1e-aaff-815376ec163e','b6ca80dc-4fca-4ebf-9df5-cb55bd7fa128','TECHDEV','2026-09-01 22:35:50.746'),('9b74a78d-fa51-4225-9ba1-a4225be0f010','a6793196-025b-4958-be89-92255cf6a6e5','EDUCATION','2026-09-01 22:35:50.810'),('9df7c870-567e-47ef-ae97-b5ebb3a30761','405b4e98-44d0-4be0-9bd4-7f292310b46d','TECHOPS','2026-09-01 22:35:50.762'),('a9233ddb-3a1d-4561-a93b-84dd956baaea','2fe500a0-1477-46d1-98e3-e01c3d8cd36b','SSC','2026-09-01 22:35:50.877'),('aa0f88dd-859f-4c08-8d44-477ac0731d38','939cae9b-980f-443a-8916-eb060690f74a','TECHDEV','2026-09-01 22:35:50.754'),('acc04fea-6b30-41bd-b75b-710831f0fb31','5dcced09-cfe0-4d07-9fb1-190c0cf59654','B2B_EXPANSION','2026-09-01 22:35:50.618'),('afdad53b-9856-4bf9-a6bf-3e130203bcc8','24e71c66-30b0-452e-8abb-282c68fb4607','B2B_EXPANSION','2026-09-01 22:35:50.601'),('bbaf33a5-76e7-4472-825f-3c23c8d6c106','409b7a7c-c885-446d-a3e4-dbce318ace61','TECHOPS','2026-09-01 22:35:50.786'),('bc1746d6-18c2-467a-8e81-4c6adbc2e1da','987d6acb-c9ad-4fd1-a2d2-64e8f47d669d','TECHOPS','2026-09-01 22:35:50.778'),('c1bc08dd-3ebf-4083-a378-4c2c28d4bb0b','6481e067-3507-42f9-b669-ae495157311d','SSC','2026-09-01 22:35:50.836'),('d08f0348-99ae-47a0-a90a-fc37ba3b99b8','80f2a953-f30e-4b06-b32d-0962f1bb719c','TECHDEV','2026-09-01 22:35:50.721'),('d7356736-70a3-49d6-87a0-1cfc2ccf827c','c4ba49b5-4948-44a9-b7b7-df8e7c5f1757','B2S','2026-09-01 22:35:50.582'),('d8388991-944c-4ba9-85ab-650c9e36f962','43001c9e-85f5-4046-a444-405c1f264777','SERVICE_ACCOUNT','2026-09-01 22:35:50.668'),('ed168940-2051-48ea-8e5d-921dfda6912f','38805e20-2731-4155-902d-96ec5eb7431c','B2S','2026-09-01 22:35:50.573'),('ee3a5454-32d9-44da-adde-c13b391f9fc0','1d4f6310-1835-4e05-97c9-5d440ce272e9','SSC','2026-09-01 22:35:50.819'),('f050b2fd-3119-42b1-8cbf-211de190002d','f8cbf509-64e0-4c75-a1ee-b2276d3ee3b1','EDUCATION','2026-09-01 22:35:50.794');
/*!40000 ALTER TABLE `kr_department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kr_sprint_target`
--

DROP TABLE IF EXISTS `kr_sprint_target`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kr_sprint_target` (
  `id` varchar(191) NOT NULL,
  `key_result_id` varchar(191) NOT NULL,
  `sprint_id` varchar(191) NOT NULL,
  `baseline_value` double NOT NULL DEFAULT '0',
  `target_value` double NOT NULL DEFAULT '0',
  `current_value` double NOT NULL DEFAULT '0',
  `aggregation_type` varchar(191) NOT NULL DEFAULT 'SUM',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `KrSprintTarget_keyResultId_sprintId_key` (`key_result_id`,`sprint_id`),
  KEY `KrSprintTarget_sprintId_idx` (`sprint_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kr_sprint_target`
--

LOCK TABLES `kr_sprint_target` WRITE;
/*!40000 ALTER TABLE `kr_sprint_target` DISABLE KEYS */;
/*!40000 ALTER TABLE `kr_sprint_target` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kr_update`
--

DROP TABLE IF EXISTS `kr_update`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kr_update` (
  `id` varchar(191) NOT NULL,
  `key_result_id` varchar(191) NOT NULL,
  `old_value` double NOT NULL,
  `new_value` double NOT NULL,
  `note` text,
  `updated_by` varchar(191) NOT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `KrUpdate_keyResultId_updatedAt_idx` (`key_result_id`,`updated_at`),
  CONSTRAINT `KrUpdate_keyResultId_fkey` FOREIGN KEY (`key_result_id`) REFERENCES `key_result` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kr_update`
--

LOCK TABLES `kr_update` WRITE;
/*!40000 ALTER TABLE `kr_update` DISABLE KEYS */;
INSERT INTO `kr_update` VALUES ('006b16ca-9400-41b5-a8d9-7ed3deccb27f','cab7316b-d491-4e2a-9cf3-b31b590cb434',0,0,NULL,'Skolla Education','2026-09-20 01:51:01.344'),('013b8567-4ba1-4367-97d0-f61c6bb87243','0858f774-daf8-474b-a4c1-2699e30bb6ce',0,0,NULL,'Skolla Education','2026-09-20 01:49:20.840'),('0bc7efc3-ea1c-4dd1-a9a3-e7e06e4fb708','b4742437-4c46-46fb-8397-e8526673468b',0,0,NULL,'Skolla Education','2026-09-20 01:50:35.723'),('1473dd3f-5568-43a4-baab-428087d4fab1','a6793196-025b-4958-be89-92255cf6a6e5',0,0,NULL,'Skolla Education','2026-09-20 01:50:40.727'),('2435c7cd-48e7-468c-ab54-f5fcfe7c4b63','80f2a953-f30e-4b06-b32d-0962f1bb719c',0,0,NULL,'Skolla Education','2026-09-20 01:49:57.735'),('2bbc84b1-2c15-46c2-a97b-20cb0fe52eb1','abba8f2d-05e8-4223-bd54-c42cf6bac17f',0,0,NULL,'Skolla Education','2026-09-20 01:49:50.776'),('2d15d946-c8cb-4a90-b7d6-218501cecdf9','987d6acb-c9ad-4fd1-a2d2-64e8f47d669d',0,0,NULL,'Skolla Education','2026-09-20 01:50:19.252'),('31d33012-4789-442b-84c3-c0608a9da9d4','06a791db-83b0-494b-9df7-04bb9264ffc5',0,0,NULL,'Skolla Education','2026-09-20 01:49:30.573'),('379c125f-e113-499d-933f-58570552733e','d74d2f49-6e07-47f8-bfa1-3e5a6f195dde',0,0,NULL,'Skolla Education','2026-09-20 01:48:59.430'),('38238aa2-4104-4244-b0c9-b6c26612d166','cdaede33-1f4a-43fd-854a-298ccbc6acba',20,0,NULL,'Skolla Education','2026-09-20 01:48:50.682'),('3a0f76c8-87c5-4303-aa0d-393be92ec16c','3fa992e9-1702-41ab-8752-af094c848c89',0,0,NULL,'Skolla Education','2026-09-20 01:49:47.446'),('3edb484c-d694-44a6-acd1-8298ab84e4c9','24e71c66-30b0-452e-8abb-282c68fb4607',0,0,NULL,'Skolla Education','2026-09-20 01:49:16.556'),('4909196b-cd92-4e38-bac4-f3d97184fd30','38805e20-2731-4155-902d-96ec5eb7431c',0,0,NULL,'Skolla Education','2026-09-20 01:49:11.449'),('4965c775-6e35-42f9-8cd5-5c96bc3871ea','1d4f6310-1835-4e05-97c9-5d440ce272e9',0,0,NULL,'Skolla Education','2026-09-20 01:50:47.312'),('4f3ee143-fc59-4077-adae-7422d881e7db','b817f395-b2af-4b6f-985a-5ed449f9f516',0,0,NULL,'Skolla Education','2026-09-20 01:49:54.674'),('51ec9e6a-355e-449c-8b13-614ac2790066','46e7503b-7c60-4e98-9071-f856055b518c',0,0,NULL,'Skolla Education','2026-09-20 01:50:55.727'),('5f505372-7fd0-4364-a51b-588a4870d260','bc12ef4e-275b-42b9-afa4-7c5af1dae888',0,0,NULL,'Skolla Education','2026-09-20 01:49:33.661'),('6c069009-6492-44be-8107-86e1b3cc7eb6','cdaede33-1f4a-43fd-854a-298ccbc6acba',0,20,NULL,'Skolla Education','2026-09-20 01:47:54.658'),('70c0de58-b52d-43af-ba33-e6d266388015','dbc7b786-b855-42df-9ba4-3201d403d013',0,0,NULL,'Skolla Education','2026-09-20 01:50:43.424'),('74fdad96-9337-4eea-89e5-3cd425334c2f','09d40249-ab85-4eda-90a4-9d2dd640aa2e',0,0,NULL,'Skolla Education','2026-09-20 01:50:00.858'),('8e0c74f2-fc6d-430f-960e-8abb1e422fe4','31751644-56e6-4049-a89f-94c48f9ed310',0,0,NULL,'Skolla Education','2026-09-20 01:50:16.358'),('9da25ea8-7bc7-4eec-b8d0-ce5e0e5ddf8a','82eb6a8e-465d-494e-aaae-ac43a15435f7',0,0,NULL,'Skolla Education','2026-09-20 01:49:40.973'),('a2a42db5-df4c-47b3-9f39-faa5eef44512','ebb90f93-a016-4172-ba52-4d7d84b7b273',0,0,NULL,'Skolla Education','2026-09-20 01:50:05.498'),('a71be842-1faf-451a-a365-a10fd0cfa89c','c4ba49b5-4948-44a9-b7b7-df8e7c5f1757',0,0,NULL,'Skolla Education','2026-09-20 01:48:55.031'),('b36b5100-7215-4b87-843b-edd3e91ec7ec','b6ca80dc-4fca-4ebf-9df5-cb55bd7fa128',0,0,NULL,'Skolla Education','2026-09-20 01:50:09.737'),('c6cfec11-f479-49cd-b05f-8d7009581745','f8cbf509-64e0-4c75-a1ee-b2276d3ee3b1',0,0,NULL,'Skolla Education','2026-09-20 01:50:32.320'),('ca5aa273-4fce-4d2e-bf1f-228356206e1f','2fe500a0-1477-46d1-98e3-e01c3d8cd36b',0,0,NULL,'Skolla Education','2026-09-20 01:51:05.147'),('ca6da17c-3d94-41d7-b771-a89c1ed2d280','405b4e98-44d0-4be0-9bd4-7f292310b46d',0,0,NULL,'Skolla Education','2026-09-20 01:50:26.423'),('cdabd4aa-68d7-4a6e-9d28-6199b7da89a2','6481e067-3507-42f9-b669-ae495157311d',0,0,NULL,'Skolla Education','2026-09-20 01:50:50.502'),('d8724d32-35ea-47a3-856f-43b337234331','939cae9b-980f-443a-8916-eb060690f74a',0,0,NULL,'Skolla Education','2026-09-20 01:50:13.190'),('e08e3158-f1e4-4391-8135-3894a06f98b9','5dcced09-cfe0-4d07-9fb1-190c0cf59654',0,0,NULL,'Skolla Education','2026-09-20 01:49:03.792'),('e3203576-22e2-4c81-9377-598fd6e605d7','0f2b595e-7188-4e35-baa8-ff088eeb592f',0,0,NULL,'Skolla Education','2026-09-20 01:49:37.174'),('efd8f12c-ef89-4970-9aa0-666b8b3a52f2','409b7a7c-c885-446d-a3e4-dbce318ace61',0,0,NULL,'Skolla Education','2026-09-20 01:50:23.705'),('f3f2dd76-fa3d-4764-8542-2aad12c4ac2f','43001c9e-85f5-4046-a444-405c1f264777',0,0,NULL,'Skolla Education','2026-09-20 01:49:44.193');
/*!40000 ALTER TABLE `kr_update` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `member_sprint_progress`
--

DROP TABLE IF EXISTS `member_sprint_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_sprint_progress` (
  `id` varchar(191) NOT NULL,
  `sprint_id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `total_score` double NOT NULL,
  `task_count` int NOT NULL DEFAULT '0',
  `completed_count` int NOT NULL DEFAULT '0',
  `details_json` json DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `MemberSprintProgress_sprintId_userId_key` (`sprint_id`,`user_id`),
  KEY `MemberSprintProgress_userId_idx` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `member_sprint_progress`
--

LOCK TABLES `member_sprint_progress` WRITE;
/*!40000 ALTER TABLE `member_sprint_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `member_sprint_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `link` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Notification_recipientId_isRead_idx` (`recipient_id`,`is_read`),
  KEY `Notification_recipientId_createdAt_idx` (`recipient_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES ('04f37fb2-52ea-4c7d-a226-6460e530f5cf','a77d84da-3cc0-4f0c-bbd8-0986176f5197','TASK_UPDATE_PENDING','Ada Update task Menunggu Persetujuan','task \"Membuat content planning sprint September\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 03:49:08.975'),('0ee5dff4-9f47-43f5-a3ba-0e251d4779f8','9e75ae68-95f2-4515-a2f9-4b0ca4317190','TASK_UPDATE_APPROVED','Update task Disetujui','Update task Anda untuk \"video pembelajaran bahasa indonesia\" telah disetujui','/team/my-work',0,'2026-09-01 08:58:34.952'),('0f204c48-e8cc-4b98-a6bd-f81dadbad6cf','a77d84da-3cc0-4f0c-bbd8-0986176f5197','TASK_UPDATE_PENDING','Ada Update task Menunggu Persetujuan','task \"task 1\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 03:15:54.352'),('128d5fd3-9347-4e11-b290-fdd7e5461882','4bb5c945-fc26-44fd-b06d-597792f6f063','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"Kerjasama dengan 10 Sekolah bulan Oktober per Sales\"','/team/my-work',0,'2026-09-03 09:25:33.468'),('129ed0b5-bd56-4e9d-b1d9-3cc8e43dc0d0','5450b9e9-9b4c-4315-91fe-b5888ca3a68e','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"Kerjasama dengan 10 Sekolah bulan Oktober per Sales\"','/team/my-work',0,'2026-09-03 09:28:46.969'),('18cf0054-484f-4017-9903-f913a8d98f2e','d91c2bc1-61bc-4072-a698-264622ee339b','CROSS_DEPT_TASK_ASSIGNED','Tugas Lintas Departemen Didisposisikan ke Anda','Anda ditugaskan mengerjakan: \"Raport v2\"','/team/my-work',0,'2026-09-21 08:52:14.677'),('19165c19-b794-4ff6-bbdc-c61ce5c3afe5','d37e1b70-2d2d-4103-804b-b6eaf909167d','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"Kerjasama dengan 10 Sekolah bulan Oktober per Sales\"','/team/my-work',0,'2026-09-03 09:25:13.514'),('1cde4f43-fa97-44e0-970e-d90c31219a9d','3afaec1a-70ea-4998-bbb0-e0898cf29136','TASK_UPDATE_PENDING','Update Stage task: DONE','task \"Kerjasama dengan 10 Sekolah bulan Oktober per Sales\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-03 10:19:37.463'),('228e059f-b734-45be-a14a-685e68c2d24a','3afaec1a-70ea-4998-bbb0-e0898cf29136','TASK_UPDATE_PENDING','Ada Update task Menunggu Persetujuan','task \"Kerjasama dengan 10 Sekolah bulan Oktober per Sales\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-03 09:32:00.523'),('27f6245a-a5dc-492f-bc9b-7c0673bce11b','e51d00a6-926d-4365-9115-5b2d2132c1fb','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"test 3\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 09:08:07.231'),('282e643b-64df-430a-994a-20d1f2524375','b37bbe0b-9635-4ede-a980-255bc177bebb','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"Mencapai Target 300000000\"','/team/my-work',0,'2026-09-02 04:42:05.366'),('3b09c0bc-19a4-497f-b83e-dc725fd790d7','a77d84da-3cc0-4f0c-bbd8-0986176f5197','TASK_UPDATE_PENDING','Update Stage task: IN_PROGRESS','task \"Bikin Konten Viral\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',1,'2026-09-01 23:15:42.432'),('3b8bfb8c-e497-4ff8-b628-514849c21d74','16d7b28a-a8f7-4bd2-bdba-99114895e389','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"Mencapai Target 300000000\"','/team/my-work',0,'2026-09-02 04:40:51.188'),('3d6cb116-674a-4809-bb0b-5f995bd8a37b','a77d84da-3cc0-4f0c-bbd8-0986176f5197','TASK_UPDATE_PENDING','Update Stage task: IN_PROGRESS','task \"WA Call Setiap Hari\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',1,'2026-09-02 08:33:08.917'),('3eb5ae19-caaf-418a-bb98-feb9a487b6e4','7addf3c2-7cb8-4fa9-902b-9059fc8dcdde','TASK_UPDATE_APPROVED','Update task Disetujui','Update task Anda untuk \"Monthly report freelance performance sprint Agustus\" telah disetujui','/team/my-work',1,'2026-09-04 03:49:27.431'),('4875c5f4-7ec7-4580-a2a6-f50f1665b1c4','8faec284-7b1f-4b2c-a9b0-bffd764a73f1','TASK_UPDATE_PENDING','Ada Update task Menunggu Persetujuan','task \"video pembelajaran bahasa indonesia\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 08:58:16.207'),('4a770af4-a935-4138-8f8e-938de12d2ec5','a77d84da-3cc0-4f0c-bbd8-0986176f5197','TASK_UPDATE_PENDING','Update Stage Inisiatif: DONE','Inisiatif \"Organic Leads 20\" dipindahkan ke stage DONE oleh anggota tim','/approvals',0,'2026-09-04 03:13:52.057'),('5123076c-d069-40bd-8c0b-a9847336767b','a77d84da-3cc0-4f0c-bbd8-0986176f5197','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Organic Leads 20\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 03:14:07.356'),('59c72995-0819-4c84-8286-97fd480b42b1','a77d84da-3cc0-4f0c-bbd8-0986176f5197','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Organic Leads 20\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 03:13:42.240'),('5ca1ed6b-f929-46bf-844b-0c3262a14541','2fe0bee9-fe63-472d-be9c-735ee11ab167','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Revenue Bulan September\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-02 04:42:50.411'),('5ede035c-80e3-4cd4-a63a-8deb6777b658','26968b6a-da68-4656-8a71-f038cdeae65a','CROSS_DEPT_TASK_ASSIGNED','Tugas Lintas Departemen Ditugaskan ke Anda','Muhammad Akbar Buana Tafsili (STRATEGIC) menugaskan: \"Raport v2\"','/team/my-work',0,'2026-09-21 08:16:43.772'),('654873b8-10bf-4c4f-9a94-ca35aeb9cb18','7addf3c2-7cb8-4fa9-902b-9059fc8dcdde','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"task 1\"','/team/my-work',1,'2026-09-04 03:15:44.388'),('6552fdfc-e798-46ff-9e34-c7a077e54138','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Membuat SOP\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-02 07:38:07.592'),('681c7842-8aee-4842-9bdf-a34cca606f59','2fe0bee9-fe63-472d-be9c-735ee11ab167','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Revenue Bulan September\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-02 04:44:02.919'),('69c9b6ab-f569-4624-95d9-e532d9c93b2f','2fe0bee9-fe63-472d-be9c-735ee11ab167','TASK_UPDATE_PENDING','Update Stage Inisiatif: DONE','Inisiatif \"Revenue Bulan September\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-02 05:04:38.282'),('6b3bb948-66b3-46bb-b147-59bcac9e0896','7addf3c2-7cb8-4fa9-902b-9059fc8dcdde','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"Monthly report freelance performance sprint Agustus\"','/team/my-work',1,'2026-09-04 03:43:58.271'),('7a45534d-8166-43aa-9e13-8f1ab7599b51','7120f48f-4090-42b9-8e95-74a6166bbc25','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"Kerjasama dengan 10 Sekolah bulan Oktober per Sales\"','/team/my-work',0,'2026-09-03 09:28:25.463'),('7c06d77a-879a-4717-8dc2-8c4cd92db311','7addf3c2-7cb8-4fa9-902b-9059fc8dcdde','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"Membuat content planning sprint September\"','/team/my-work',1,'2026-09-04 03:44:19.205'),('7ccd4f92-7913-417f-ae89-91ac0c956fe9','e51d00a6-926d-4365-9115-5b2d2132c1fb','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"test 2\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 09:06:04.065'),('81a92eb1-fc2a-45ee-8c24-30676cf2548e','9e75ae68-95f2-4515-a2f9-4b0ca4317190','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"video pembelajaran bahasa indonesia\"','/team/my-work',0,'2026-09-01 08:50:57.309'),('81db0ad8-c207-4b39-807e-8b1dfc4e1eb4','e51d00a6-926d-4365-9115-5b2d2132c1fb','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Buat 30 video pembelajaran\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 08:52:26.476'),('88946ce4-9b1c-4422-875c-e8842ccc016b','a77d84da-3cc0-4f0c-bbd8-0986176f5197','TASK_UPDATE_PENDING','Ada Update task Menunggu Persetujuan','task \"Monthly report freelance performance sprint Agustus\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 03:48:55.663'),('8b3fced4-6688-4dcb-b8e0-96c616c645c0','a77d84da-3cc0-4f0c-bbd8-0986176f5197','TASK_UPDATE_PENDING','Update Stage task: IN_PROGRESS','task \"Bikin Konten Viral\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',1,'2026-09-01 23:15:44.750'),('8bfed6e6-3c21-4cd7-a50b-b0155c36c9db','9e75ae68-95f2-4515-a2f9-4b0ca4317190','TASK_UPDATE_APPROVED','Update task Disetujui','Update task Anda untuk \"video pembelajaran bahasa indonesia\" telah disetujui','/team/my-work',0,'2026-09-01 08:58:37.335'),('8c450bab-6f28-48fe-9e0c-16dcdfadea7a','7addf3c2-7cb8-4fa9-902b-9059fc8dcdde','TASK_UPDATE_APPROVED','Update task Disetujui','Update task Anda untuk \"Membuat content planning sprint September\" telah disetujui','/team/my-work',1,'2026-09-04 03:49:24.946'),('919ec92d-06fc-485c-bf74-f171f8cf0968','3afaec1a-70ea-4998-bbb0-e0898cf29136','TASK_UPDATE_PENDING','Update Stage task: DONE','task \"Kerjasama dengan 10 Sekolah bulan Oktober per Sales\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-03 09:32:16.296'),('99a154cd-a184-4e46-bf94-eb78172d03f2','2fe0bee9-fe63-472d-be9c-735ee11ab167','TASK_UPDATE_PENDING','Update Stage Inisiatif: IN_PROGRESS','Inisiatif \"Capaian Oktober Rp200.000.000\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',1,'2026-09-02 08:27:20.613'),('99a5e5ac-bf46-4a6a-8229-d04e9fe95434','2fe0bee9-fe63-472d-be9c-735ee11ab167','TASK_UPDATE_PENDING','Update Stage Inisiatif: IN_PROGRESS','Inisiatif \"Revenue Bulan September\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',1,'2026-09-02 05:04:26.538'),('99ba1bfc-0cd0-43ad-bd9d-5be4f667319c','3afaec1a-70ea-4998-bbb0-e0898cf29136','TASK_UPDATE_PENDING','Update Stage task: IN_PROGRESS','task \"Kerjasama dengan 10 Sekolah bulan Oktober per Sales\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',1,'2026-09-03 10:16:22.724'),('a11252f0-ff63-4e5f-aff3-c6dd44201e90','5fb4571c-0d0c-4243-8e7e-80f25a125ba8','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"video pembelajaran matematika\"','/team/my-work',0,'2026-09-01 08:51:19.729'),('a837ff51-bbeb-4f60-8aaa-86bddd63ec6a','e51d00a6-926d-4365-9115-5b2d2132c1fb','CROSS_DEPT_TASK_CREATED','Tugas Lintas Departemen Baru','Muhammad Akbar Buana Tafsili (STRATEGIC) menugaskan: \"Raport v2\" ke departemen TECHDEV','/team/my-work',0,'2026-09-21 08:16:43.777'),('a85edf4e-ebcf-464c-8931-200056e5189a','16d7b28a-a8f7-4bd2-bdba-99114895e389','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"Konversi 5 leads di Oktober\"','/team/my-work',0,'2026-09-04 03:34:59.432'),('b565968d-37ff-4f39-8570-b2ba3ef99a83','a77d84da-3cc0-4f0c-bbd8-0986176f5197','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"Fulfillment Pencatatan Sales Admin \"','/team/my-work',1,'2026-09-01 22:42:42.613'),('b5fe19d2-4c87-4467-87cf-0c2fc4d0f39b','3afaec1a-70ea-4998-bbb0-e0898cf29136','TASK_UPDATE_PENDING','Update Stage task: DONE','task \"Kerjasama dengan 10 Sekolah bulan Oktober per Sales\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-03 10:15:27.616'),('b8e0fd50-4d65-4c73-8c07-a5c450789cbb','8faec284-7b1f-4b2c-a9b0-bffd764a73f1','TASK_UPDATE_PENDING','Ada Update task Menunggu Persetujuan','task \"video pembelajaran bahasa indonesia\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 08:58:06.136'),('bbc03146-98da-4f30-bb1c-a3fe30386461','b37bbe0b-9635-4ede-a980-255bc177bebb','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"Konversi 5 leads di Oktober\"','/team/my-work',0,'2026-09-04 03:35:24.903'),('bf59ed84-9c7e-4290-b208-1348bc72c944','7addf3c2-7cb8-4fa9-902b-9059fc8dcdde','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"Bikin Konten Viral\"','/team/my-work',1,'2026-09-01 22:44:13.917'),('bf6e3aa4-c86b-4710-a904-2b080067c394','3afaec1a-70ea-4998-bbb0-e0898cf29136','TASK_UPDATE_PENDING','Ada Update task Menunggu Persetujuan','task \"Kerjasama dengan 10 Sekolah bulan Oktober per Sales\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-03 10:15:17.389'),('c0ec9a34-9337-472d-8ab4-8ecc905e13c6','a77d84da-3cc0-4f0c-bbd8-0986176f5197','TASK_UPDATE_PENDING','Update Stage task: DONE','task \"WA Call Setiap Hari\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-02 08:30:41.614'),('c1aa1b27-d5a0-4760-be14-a1a1d25bd564','7120f48f-4090-42b9-8e95-74a6166bbc25','TASK_UPDATE_APPROVED','Update task Disetujui','Update task Anda untuk \"Kerjasama dengan 10 Sekolah bulan Oktober per Sales\" telah disetujui','/team/my-work',0,'2026-09-04 10:08:44.256'),('c26ae62b-9292-4378-9f1f-4f6625a02e2f','e51d00a6-926d-4365-9115-5b2d2132c1fb','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"test 3\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 09:10:01.216'),('c2862da3-65f4-48b0-9a2d-3cc33056bde0','d91c2bc1-61bc-4072-a698-264622ee339b','CROSS_DEPT_CLOSED','Tugas Lintas Departemen Ditutup','Tugas \"Raport v2\" telah diverifikasi dan resmi ditutup (Closed) oleh pembuat tugas.','/team/my-work',0,'2026-09-21 08:52:56.914'),('c4e8b915-a779-46ce-911c-ba5e18527d1c','2fe0bee9-fe63-472d-be9c-735ee11ab167','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Koversi 16 leads di Oktober\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 03:35:59.725'),('c7740822-f69e-4f98-a444-5a7f067920b7','a77d84da-3cc0-4f0c-bbd8-0986176f5197','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Organic Leads 20\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 03:14:41.493'),('d9a1487b-f0b6-465c-bfd5-7907c9ab07ab','e51d00a6-926d-4365-9115-5b2d2132c1fb','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Buat 30 video pembelajaran\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 09:08:31.116'),('daf2b63b-505d-4025-9975-947633f89acc','2fe0bee9-fe63-472d-be9c-735ee11ab167','CROSS_DEPT_RESOLVED','Tugas Lintas Departemen Selesai Dikerjakan','Tugas \"Raport v2\" telah diselesaikan. Silakan verifikasi dan Close tugas ini.','/team/my-work',0,'2026-09-21 08:52:34.833'),('e1059820-0228-4653-bcbf-935e1df40e5e','2fe0bee9-fe63-472d-be9c-735ee11ab167','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Capaian Oktober Rp200.000.000\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-02 08:27:42.206'),('e10b6d7b-1d2b-4b68-97e0-318e73c2a17e','e51d00a6-926d-4365-9115-5b2d2132c1fb','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Buat 30 video pembelajaran\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 08:52:00.640'),('e2d377d4-82e4-463c-aee0-fd083466e7c3','4d8bf416-b272-45ba-894e-85119a356ac0','TASK_ASSIGNED','task Baru Ditugaskan','Anda mendapat assignment task: \"video pembelajaran fisika\"','/team/my-work',0,'2026-09-01 08:50:22.098'),('ea9027c0-01a5-4aae-a4ab-ad25a8840bf3','f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Sumber data tersedia 100%\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-02 06:44:09.679'),('ee0543cb-0903-4826-9bcf-8c36b7452209','a77d84da-3cc0-4f0c-bbd8-0986176f5197','TASK_UPDATE_PENDING','Update Stage task: DONE','task \"Bikin Konten Viral\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-01 23:15:49.597'),('f8592166-26b9-4337-b974-9de553fd27dc','e51d00a6-926d-4365-9115-5b2d2132c1fb','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"test 3\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 09:07:17.759'),('fa1efde1-d111-47c4-9b6d-c5d9122750e9','2fe0bee9-fe63-472d-be9c-735ee11ab167','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Capaian Oktober Rp200.000.000\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-02 08:28:15.946'),('feabe5e2-9df1-4fa1-808c-7d211932e9e5','e51d00a6-926d-4365-9115-5b2d2132c1fb','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Buat 30 video pembelajaran\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 08:53:38.414'),('fef94155-fde6-4668-9867-1990defb747e','a77d84da-3cc0-4f0c-bbd8-0986176f5197','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','initiative \"Social Media Regular Content\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 03:51:15.155');
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `objective`
--

DROP TABLE IF EXISTS `objective`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objective` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text,
  `quarter` varchar(191) DEFAULT NULL,
  `owner_id` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `year` varchar(191) NOT NULL DEFAULT 'Q3-2026',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `objective`
--

LOCK TABLES `objective` WRITE;
/*!40000 ALTER TABLE `objective` DISABLE KEYS */;
INSERT INTO `objective` VALUES ('0c9c7062-d413-4ad7-a56a-4156f173285b','Engagement Rate',NULL,NULL,'e51d00a6-926d-4365-9115-5b2d2132c1fb','2026-08-28 02:24:41.386','Q3-2026'),('20560432-0747-42bd-b709-19da41b08b60','Retention Rate',NULL,NULL,'e51d00a6-926d-4365-9115-5b2d2132c1fb','2026-08-28 02:24:41.384','Q3-2026'),('2450c4a6-3085-4881-9de6-f333151b7fa6','Total Revenue NETT',NULL,NULL,'2fe0bee9-fe63-472d-be9c-735ee11ab167','2026-08-28 02:24:41.376','Q3-2026'),('2e3b7064-801a-45fa-b898-c8cda930eb99','Company Performance Score',NULL,NULL,'f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','2026-08-28 02:24:41.402','Q3-2026'),('2f0c174e-998f-489d-8201-a111354357bc','Product Sucess Rate',NULL,NULL,'e51d00a6-926d-4365-9115-5b2d2132c1fb','2026-08-28 02:24:41.388','Q3-2026'),('31901c56-26bf-4108-974a-a8f839f0d91a','Total Revenue NETT','',NULL,'f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','2026-08-27 14:59:26.972','Q3-2026'),('336563f9-e175-4e15-b095-e1bf787eb2e5','Error Rate',NULL,NULL,'e51d00a6-926d-4365-9115-5b2d2132c1fb','2026-08-28 02:24:41.392','Q3-2026'),('48cf64b2-7be7-4fea-be51-e433ac6914e1','CSAT Internal (Sales & SA)',NULL,NULL,'e51d00a6-926d-4365-9115-5b2d2132c1fb','2026-08-28 02:24:41.394','Q3-2026'),('59438391-c544-47b6-8fc2-b361082e2fb1','Nett Profit Margin',NULL,NULL,'f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','2026-08-28 02:24:41.379','Q3-2026'),('7ffcc4bc-7a40-4f8d-816e-c6808b9ec28f','Candangan Cash Ending (Ending Cash) in Month',NULL,NULL,'f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','2026-08-28 02:24:41.382','Q3-2026'),('8b4e67c9-8692-4c83-a2f0-87d4c0e5551c','CSAT External (Consumer & Customer)',NULL,NULL,'e51d00a6-926d-4365-9115-5b2d2132c1fb','2026-08-28 02:24:41.395','Q3-2026'),('b5c64d71-ba2c-4939-9b8f-f0bf5d56f847','Active user',NULL,NULL,'e51d00a6-926d-4365-9115-5b2d2132c1fb','2026-08-28 02:24:41.390','Q3-2026'),('cff3dcf4-fd7e-44b8-9e6c-0d8e1a352daa','Company\'s Talent Performance',NULL,NULL,'f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','2026-08-28 02:24:41.400','Q3-2026'),('fab86720-0a84-4124-a672-31338513e748','Sumber Data Tersedia Secara Real-Time',NULL,NULL,'f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','2026-08-28 02:24:41.398','Q3-2026');
/*!40000 ALTER TABLE `objective` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sprint`
--

DROP TABLE IF EXISTS `sprint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sprint` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `start_date` datetime(3) NOT NULL,
  `end_date` datetime(3) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'UPCOMING',
  `is_locked` tinyint(1) NOT NULL DEFAULT '0',
  `year` varchar(191) NOT NULL DEFAULT '2026',
  `order_index` int NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Sprint_status_idx` (`status`),
  KEY `Sprint_startDate_endDate_idx` (`start_date`,`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sprint`
--

LOCK TABLES `sprint` WRITE;
/*!40000 ALTER TABLE `sprint` DISABLE KEYS */;
INSERT INTO `sprint` VALUES ('226f05bd-1007-4528-b0e1-c6db7fea7bbe','Sprint Januari 2027','2026-12-21 00:00:00.000','2027-01-20 23:59:59.999','UPCOMING',0,'2027',5,'2026-09-20 00:57:56.262','2026-09-20 00:57:56.262'),('3a928013-80fb-4a8e-98e3-3288dfad4a90','Sprint Februari 2027','2027-01-21 00:00:00.000','2027-02-20 23:59:59.999','UPCOMING',0,'2027',6,'2026-09-20 00:57:56.264','2026-09-20 00:57:56.264'),('52588d27-c6bf-44d2-b59e-06366205b82e','Sprint Maret 2027','2027-02-21 00:00:00.000','2027-03-20 23:59:59.999','UPCOMING',0,'2027',7,'2026-09-20 00:57:56.266','2026-09-20 00:57:56.266'),('64d1e759-3866-46e6-8782-61c537cc515e','Sprint Juni 2027','2027-05-21 00:00:00.000','2027-06-20 23:59:59.999','UPCOMING',0,'2027',10,'2026-09-20 00:57:56.274','2026-09-20 00:57:56.274'),('6c0f48a0-1874-4665-b990-9f624a6cbb97','Sprint September 2026','2026-08-21 00:00:00.000','2026-09-20 23:59:59.999','CLOSED',1,'2026',1,'2026-09-20 00:57:56.250','2026-09-20 00:57:56.250'),('7aadf595-409c-4770-bf29-ae772eb83dd0','Sprint Juli 2027','2027-06-21 00:00:00.000','2027-07-20 23:59:59.999','UPCOMING',0,'2027',11,'2026-09-20 00:57:56.278','2026-09-20 00:57:56.278'),('80a00801-940c-4d37-81db-08c6d64d41e9','Sprint Agustus 2027','2027-07-21 00:00:00.000','2027-08-20 23:59:59.999','UPCOMING',0,'2027',12,'2026-09-20 00:57:56.281','2026-09-20 00:57:56.281'),('82c8937e-3f49-41f6-8259-aeecb92986ae','Sprint November 2026','2026-10-21 00:00:00.000','2026-11-20 23:59:59.999','UPCOMING',0,'2026',3,'2026-09-20 00:57:56.256','2026-09-20 00:57:56.256'),('8d8a9525-9e95-4190-89fd-4ed74a0c1afa','Sprint September 2027','2027-08-21 00:00:00.000','2027-09-20 23:59:59.999','UPCOMING',0,'2027',13,'2026-09-20 00:57:56.285','2026-09-20 00:57:56.285'),('91309b9a-2d8e-4016-87d7-e2e06516b874','Sprint Mei 2027','2027-04-21 00:00:00.000','2027-05-20 23:59:59.999','UPCOMING',0,'2027',9,'2026-09-20 00:57:56.270','2026-09-20 00:57:56.270'),('96b2af15-10ab-4a38-8166-a1aab7710057','Sprint Oktober 2026','2026-09-21 00:00:00.000','2026-10-20 23:59:59.999','ACTIVE',0,'2026',2,'2026-09-20 00:57:56.252','2026-09-20 00:57:56.252'),('99c05d76-8e1b-4277-8bd8-f1d427e12b8f','Sprint Desember 2026','2026-11-21 00:00:00.000','2026-12-20 23:59:59.999','UPCOMING',0,'2026',4,'2026-09-20 00:57:56.260','2026-09-20 00:57:56.260'),('b734efca-d76f-4aaa-9d72-a930e2b51149','Sprint April 2027','2027-03-21 00:00:00.000','2027-04-20 23:59:59.999','UPCOMING',0,'2027',8,'2026-09-20 00:57:56.268','2026-09-20 00:57:56.268');
/*!40000 ALTER TABLE `sprint` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task`
--

DROP TABLE IF EXISTS `task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task` (
  `id` varchar(191) NOT NULL,
  `initiative_id` varchar(191) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `target_value` double DEFAULT '0',
  `current_value` double NOT NULL DEFAULT '0',
  `baseline_value` double NOT NULL DEFAULT '0',
  `unit` varchar(191) DEFAULT NULL,
  `assigned_team_member_id` varchar(191) DEFAULT NULL,
  `assigned_by` varchar(191) DEFAULT NULL,
  `sprint_month` varchar(191) DEFAULT NULL,
  `sprint_id` varchar(191) DEFAULT NULL,
  `start_date` datetime(3) DEFAULT NULL,
  `finish_date` datetime(3) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'ON_TRACK',
  `kanban_status` varchar(191) DEFAULT 'TODO',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `weight` double NOT NULL DEFAULT '1',
  `documentation_link` varchar(191) DEFAULT NULL,
  `is_cross_dept` tinyint(1) NOT NULL DEFAULT '0',
  `creator_id` varchar(191) DEFAULT NULL,
  `creator_dept` varchar(191) DEFAULT NULL,
  `target_dept` varchar(191) DEFAULT NULL,
  `description` text,
  `link` varchar(191) DEFAULT NULL,
  `target_type` varchar(191) NOT NULL DEFAULT 'AT_LEAST',
  PRIMARY KEY (`id`),
  KEY `Kpi_initiativeId_idx` (`initiative_id`),
  KEY `Task_assignedTeamMemberId_idx` (`assigned_team_member_id`),
  KEY `Task_sprintMonth_idx` (`sprint_month`),
  KEY `Task_sprintId_idx` (`sprint_id`),
  KEY `Task_creatorId_idx` (`creator_id`),
  KEY `Task_targetDept_idx` (`target_dept`),
  CONSTRAINT `Kpi_initiativeId_fkey` FOREIGN KEY (`initiative_id`) REFERENCES `initiative` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `task_assigned_team_member_id_fkey` FOREIGN KEY (`assigned_team_member_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `task_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `task_sprint_id_fkey` FOREIGN KEY (`sprint_id`) REFERENCES `sprint` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task`
--

LOCK TABLES `task` WRITE;
/*!40000 ALTER TABLE `task` DISABLE KEYS */;
INSERT INTO `task` VALUES ('86f4e336-95e1-4035-9e6d-aca3380b2168',NULL,'Raport v2',1,1,0,'Task','d91c2bc1-61bc-4072-a698-264622ee339b','2fe0bee9-fe63-472d-be9c-735ee11ab167','2026-10','96b2af15-10ab-4a38-8166-a1aab7710057',NULL,'2026-09-23 00:00:00.000','DONE','CLOSED','2026-09-21 08:16:43.753','2026-09-21 08:52:56.906',1,NULL,1,'2fe0bee9-fe63-472d-be9c-735ee11ab167','STRATEGIC','TECHDEV',NULL,NULL,'AT_LEAST');
/*!40000 ALTER TABLE `task` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_assignment`
--

DROP TABLE IF EXISTS `task_assignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_assignment` (
  `id` varchar(191) NOT NULL,
  `task_id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `assigned_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `TaskAssignment_taskId_userId_key` (`task_id`,`user_id`),
  KEY `TaskAssignment_taskId_idx` (`task_id`),
  KEY `KpiAssignment_userId_idx` (`user_id`),
  CONSTRAINT `KpiAssignment_kpiId_fkey` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `KpiAssignment_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_assignment`
--

LOCK TABLES `task_assignment` WRITE;
/*!40000 ALTER TABLE `task_assignment` DISABLE KEYS */;
INSERT INTO `task_assignment` VALUES ('1b6471a8-28ea-4c93-a9e9-f7b18d3b4b21','86f4e336-95e1-4035-9e6d-aca3380b2168','d91c2bc1-61bc-4072-a698-264622ee339b','2026-09-21 08:52:14.652');
/*!40000 ALTER TABLE `task_assignment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_comment`
--

DROP TABLE IF EXISTS `task_comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_comment` (
  `id` varchar(191) NOT NULL,
  `task_id` varchar(191) NOT NULL,
  `user_id` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `attachment_link` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `task_comment_task_id_idx` (`task_id`),
  KEY `task_comment_user_id_idx` (`user_id`),
  CONSTRAINT `task_comment_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `task_comment_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_comment`
--

LOCK TABLES `task_comment` WRITE;
/*!40000 ALTER TABLE `task_comment` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_comment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_kpi`
--

DROP TABLE IF EXISTS `task_kpi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_kpi` (
  `id` varchar(191) NOT NULL,
  `task_id` varchar(191) NOT NULL,
  `kpi_id` varchar(191) NOT NULL,
  `target_value` double NOT NULL,
  `current_value` double NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `TaskKpi_taskId_kpiId_key` (`task_id`,`kpi_id`),
  KEY `TaskKpi_taskId_idx` (`task_id`),
  KEY `TaskKpi_kpiId_idx` (`kpi_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_kpi`
--

LOCK TABLES `task_kpi` WRITE;
/*!40000 ALTER TABLE `task_kpi` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_kpi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task_update`
--

DROP TABLE IF EXISTS `task_update`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_update` (
  `id` varchar(191) NOT NULL,
  `task_id` varchar(191) NOT NULL,
  `old_value` double NOT NULL,
  `new_value` double NOT NULL,
  `note` text,
  `submitted_by` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING_APPROVAL',
  `reviewed_by` varchar(191) DEFAULT NULL,
  `review_note` text,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `link` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `TaskUpdate_taskId_createdAt_idx` (`task_id`,`created_at`),
  CONSTRAINT `KpiUpdate_kpiId_fkey` FOREIGN KEY (`task_id`) REFERENCES `task` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_update`
--

LOCK TABLES `task_update` WRITE;
/*!40000 ALTER TABLE `task_update` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_update` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team`
--

DROP TABLE IF EXISTS `team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `manager_id` varchar(191) DEFAULT NULL,
  `leader_id` varchar(191) DEFAULT NULL,
  `department` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Team_leaderId_idx` (`leader_id`),
  CONSTRAINT `Team_leaderId_fkey` FOREIGN KEY (`leader_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team`
--

LOCK TABLES `team` WRITE;
/*!40000 ALTER TABLE `team` DISABLE KEYS */;
INSERT INTO `team` VALUES ('201b58b6-e1e4-44d3-b4e7-3dd0139e2636','Business to School (B2S)',NULL,NULL,'B2S'),('3dc8d8eb-e071-4cc3-8131-0336caebe91a','Service & Account',NULL,NULL,'SERVICE_ACCOUNT'),('5ad10fff-3bfb-400f-88e1-e9a387743324','B2C Consumer',NULL,'a77d84da-3cc0-4f0c-bbd8-0986176f5197','B2C'),('5ad31b20-512f-4d76-84e9-3885e3c3b17a','Product & Service',NULL,NULL,'PRODUCT_SERVICE'),('602ee7f5-0e5f-4390-a0d3-c111c5651807','Tech Development',NULL,NULL,'TECHDEV'),('7b4be7ef-1246-4455-9bfd-da8530e9fae9','Tech Operations',NULL,NULL,'TECHOPS'),('a623fa11-d5cb-46a7-b2a8-a6885cfa8238','Strategic Planning',NULL,NULL,'STRATEGIC'),('ac158f67-1705-496a-b06e-28735dd77caa','Shared Service Center (SSC)',NULL,NULL,'SSC'),('b195b816-8168-48c3-9540-f37263f5c04f','B2B Expansion',NULL,NULL,'B2B_EXPANSION'),('b853dc12-26d5-4c65-b536-7d7182983f42','Data & Analytics',NULL,NULL,'DATA'),('c22e7778-49e0-47dd-adfc-a96e23c4a037','Education & Academic',NULL,NULL,'EDUCATION'),('c6bade49-4508-438a-9dff-baa74d1c6398','Product & Tech','8c35244d-697c-4d57-be5c-23c0a2e5001d',NULL,NULL),('cad67837-c913-41e1-8c11-bb4798068118','Finance & Accounting',NULL,NULL,'FINANCE'),('ced65713-6872-4f57-ac6b-29360de59dbe','People Operations (HR)',NULL,NULL,'HR'),('e9395743-c354-43b4-98f2-2287ea12e07d','B2B Corporation',NULL,NULL,'B2B_CORPORATION'),('e97d2095-0df6-46da-9881-c79df333acb5','Business Development',NULL,NULL,'BUSINESS'),('fc9f8239-76c7-475a-94be-390f63a42652','Creative & Design',NULL,NULL,'DESIGN');
/*!40000 ALTER TABLE `team` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'TEAM',
  `department` varchar(191) DEFAULT NULL,
  `position` varchar(191) DEFAULT NULL,
  `team_id` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_teamId_idx` (`team_id`),
  CONSTRAINT `User_teamId_fkey` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('09e5aa28-5634-4e4b-8b35-ef9443e85c09','Ulialbab Nudiashalih','ulil@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','TECHDEV','Data Engineer','602ee7f5-0e5f-4390-a0d3-c111c5651807','2026-08-11 14:05:23.119'),('16d7b28a-a8f7-4bd2-bdba-99114895e389','Alma Diva Hafizha Saleh','diva@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','TEAM','B2B_CORPORATE','Corporate Communication','e9395743-c354-43b4-98f2-2287ea12e07d','2026-08-11 08:52:38.924'),('17dc67ce-90a4-441e-9a78-42c2af92711f','Dwiva Yulian Edfi','dwiva@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','LEADER','TECHOPS','TechOps Lead','7b4be7ef-1246-4455-9bfd-da8530e9fae9','2026-08-11 08:52:38.927'),('1dac7ccc-e235-41aa-a3b9-74f2fa529505','Febrian Indra Rukmana','febrian@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','EDUCATION','Try Out Specialist','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-11 14:05:23.128'),('26968b6a-da68-4656-8a71-f038cdeae65a','Syarief Hidayatullah','syarief@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','LEADER','TECHDEV','Techlead','602ee7f5-0e5f-4390-a0d3-c111c5651807','2026-08-11 08:52:38.928'),('2db25c97-ca0e-420d-bbdc-3d169b556007','Muhammad Fikri Rizal','fikri@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','B2S','B2S Partnership Manager','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-11 14:05:23.112'),('2fe0bee9-fe63-472d-be9c-735ee11ab167','Muhammad Akbar Buana Tafsili','akbar@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','TEAM','STRATEGIC','Chief Business Officer','a623fa11-d5cb-46a7-b2a8-a6885cfa8238','2026-08-11 08:52:38.921'),('33fafcd1-894c-4da1-b912-11a1de95ddce','Aan Noviyanti','novi@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','SERVICE_ACCOUNT','Account Manager','3dc8d8eb-e071-4cc3-8131-0336caebe91a','2026-08-11 14:05:23.092'),('3748a859-7ef1-4155-b501-1b39874d1976','Yogie Ari Shandy','yogie@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','EDUCATION','Education Biologi','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-11 14:05:23.127'),('39e86d0c-2e4d-4f5b-ab77-eda0a332bbcd','Devlin Hazrian Saleh','devlin@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','TEAM',NULL,'Chief Executive Officer','a623fa11-d5cb-46a7-b2a8-a6885cfa8238','2026-08-11 08:52:38.914'),('3afaec1a-70ea-4998-bbb0-e0898cf29136','Agung Septiansyah','agung@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','LEADER','B2B_EXPANSION','Head of Sales Expansion','b195b816-8168-48c3-9540-f37263f5c04f','2026-08-11 08:52:38.921'),('4bb5c945-fc26-44fd-b06d-597792f6f063','Ma\'rufatu Laili','laili@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','B2B_EXPANSION','B2B Partnership Manager','b195b816-8168-48c3-9540-f37263f5c04f','2026-08-11 14:05:23.126'),('4d8bf416-b272-45ba-894e-85119a356ac0','Abdul Majid Al Kholish','majid@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','EDUCATION','Live Class Specialist','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-11 14:05:23.127'),('504f885d-df18-4a7a-901d-29e0174c7432','Fenni Amalia','fenni@skolla.education','$2b$10$ZUCp6XXJ5shf0UDRBpb7jObH0LBU3hjIVJuuAPQd0c/zbJClFyxXG','TEAM','SSC','Data Analyst','ac158f67-1705-496a-b06e-28735dd77caa','2026-08-11 08:52:38.931'),('52563e0e-f486-4483-a843-d464c9aea995','Muhamad Fahmi','fahmi@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','TECHOPS','TechOps Support','7b4be7ef-1246-4455-9bfd-da8530e9fae9','2026-08-11 14:05:23.109'),('5450b9e9-9b4c-4315-91fe-b5888ca3a68e','Sholehatin Ningsih','lia@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','B2B_EXPANSION','B2B Partnership Manager','b195b816-8168-48c3-9540-f37263f5c04f','2026-08-11 14:05:23.124'),('569c82cf-2b22-4bee-848f-f068978b8c72','Ridwan Maulana','iwan@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','EDUCATION','Education Bahasa Inggris','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-11 14:05:23.115'),('5acebc3e-e242-4bc7-87ba-13cfe19b8751','Riska Rosmana','riska@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','LEADER','SERVICE_ACCOUNT','Service Account Manager','3dc8d8eb-e071-4cc3-8131-0336caebe91a','2026-08-11 08:52:38.928'),('5f391494-bfde-49e3-b79d-9bfe0eed4f91','Alif Firman Ramdhani','aliffirman@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','TECHDEV','Mobile Developer','602ee7f5-0e5f-4390-a0d3-c111c5651807','2026-08-11 14:05:23.100'),('5fb4571c-0d0c-4243-8e7e-80f25a125ba8','Paramita Tri Yaningrum','mita@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','EDUCATION','Education Matematika','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-11 14:05:23.128'),('67637176-ff2f-4a97-abb5-a9c05c785d9c','Prisma Harsu Prasetiyo','prisma@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','B2S','B2S Partnership Manager','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-11 14:05:23.114'),('7120f48f-4090-42b9-8e95-74a6166bbc25','Muhammad Aan Khunaifi','aan@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','B2B_EXPANSION','B2B Partnership Manager','b195b816-8168-48c3-9540-f37263f5c04f','2026-08-11 14:05:23.123'),('74355838-bb1e-4058-85bb-9648a88b2ed4','Yazid Amanullah','yazid@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','TEAM','STRATEGIC','Chief Technology Officer','a623fa11-d5cb-46a7-b2a8-a6885cfa8238','2026-08-11 08:52:38.919'),('758b896e-f7e1-4f0b-ae2e-22b23a0c694e','Gigin Ginanjar','gino@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','SERVICE_ACCOUNT','Communication After Sales','3dc8d8eb-e071-4cc3-8131-0336caebe91a','2026-08-11 14:05:23.129'),('7828cc7c-8f00-4bb0-8021-f805b9ca33e9','Taufiq Nur Hidayah','taufiq@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','TECHOPS','TechOps Executive','7b4be7ef-1246-4455-9bfd-da8530e9fae9','2026-08-11 14:05:23.118'),('7addf3c2-7cb8-4fa9-902b-9059fc8dcdde','Tamara Aulia Ramadhini','tamara@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','TEAM','B2C','Campaign Lead','5ad10fff-3bfb-400f-88e1-e9a387743324','2026-08-11 08:52:38.925'),('82b9d6e6-0042-4112-b8c1-b5c31b357670','Bob Bastian','bob@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','TEAM','B2C','Marketing Lead','5ad10fff-3bfb-400f-88e1-e9a387743324','2026-08-11 08:52:38.926'),('8a4998b0-99fd-434a-8e07-3d31ab5d6987','Bintang Azzandriya W','bintang@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','TEAM','SSC','Sales Admin','ac158f67-1705-496a-b06e-28735dd77caa','2026-08-11 08:52:38.931'),('8ca3fd77-2c8f-4732-94a2-6caeeb28de76','Audia Ramadhan','audia@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','B2S','B2S Partnership Manager','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-11 14:05:23.125'),('8faec284-7b1f-4b2c-a9b0-bffd764a73f1','Zukhrini Khalish Nasution','rini@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','LEADER','EDUCATION','Education Lead','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-11 08:52:38.927'),('9e75ae68-95f2-4515-a2f9-4b0ca4317190','Eka Nur Setianingsih','eka@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','EDUCATION','Education Bahasa Indonesia','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-11 14:05:23.105'),('a006dc97-54ee-403c-a82f-95ec9ff1f5f7','Syifa Mahmudah','syifa@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','LEADER','B2B_CORPORATE','Program & Service Strategist','e9395743-c354-43b4-98f2-2287ea12e07d','2026-08-11 08:52:38.923'),('a19e22a9-08ac-45e2-862f-c000efac1e17','Made Jiagustini','jia@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','B2S','B2S Partnership Manager','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-11 14:05:23.124'),('a2c14af3-b35d-455a-9f8c-2426641020a0','Ichsan Ramdani','ichsan@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','TECHDEV','Quality Assurance','602ee7f5-0e5f-4390-a0d3-c111c5651807','2026-08-11 14:05:23.108'),('a5f40518-1c79-4b46-b321-eb05c9a2a844','Candra Mukti','candra@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','B2B_EXPANSION','B2B Partnership Manager','b195b816-8168-48c3-9540-f37263f5c04f','2026-08-11 14:05:23.125'),('a77d84da-3cc0-4f0c-bbd8-0986176f5197','Hervina Anjani Yulistika','vina@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','LEADER','B2C','Communication Lead','5ad10fff-3bfb-400f-88e1-e9a387743324','2026-08-11 08:52:38.922'),('b37bbe0b-9635-4ede-a980-255bc177bebb','Muhammad Muflih Gani','mugan@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','TEAM','B2B_CORPORATE','Business & Legal Coordinator','e9395743-c354-43b4-98f2-2287ea12e07d','2026-08-11 08:52:38.924'),('b75d7f4c-9e7a-4945-bd42-4b25edebc815','Tatang Supandi','tatang@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','SSC','Visual Production Lead','ac158f67-1705-496a-b06e-28735dd77caa','2026-08-11 14:05:23.117'),('c00701ad-1eca-4ade-bb4c-48ac29647297','Farid Aflah','farid@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','LEADER','SSC','Senior Finance & Accounting','ac158f67-1705-496a-b06e-28735dd77caa','2026-08-11 08:52:38.929'),('c2d8a2ab-784b-45fc-8264-307fa3d8ba93','Oktaviani Winarso','via@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','EDUCATION','Education Matematika','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-11 14:05:23.120'),('d37e1b70-2d2d-4103-804b-b6eaf909167d','Dwijayanti Suhatsyah','poppy@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','B2B_EXPANSION','B2B Partnership Manager','b195b816-8168-48c3-9540-f37263f5c04f','2026-08-11 14:05:23.125'),('d91c2bc1-61bc-4072-a698-264622ee339b','Andhika Prakasa','andhika@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','TECHDEV','Back End Developer','602ee7f5-0e5f-4390-a0d3-c111c5651807','2026-08-11 14:05:23.101'),('dae09c02-9a7c-495c-b2e1-250a98f3d3f3','Wahyu Diningrat Suryo Atmojo','wahyu@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','B2S','Project Officer','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-11 14:05:23.119'),('ddc55a9d-a051-45b5-8462-971c7891fafa','Akhmad Mukhibun','akhmad@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','SERVICE_ACCOUNT','Junior Partnership Manager','3dc8d8eb-e071-4cc3-8131-0336caebe91a','2026-08-11 14:05:23.123'),('e10f43e5-6a0a-4dd9-96c1-6b7b5719abc3','Skolla Education','admin@skolla.education','$2b$10$wBsSdVc0M94O5u3qpx/ZIOdIeFB1LJk6bfBH07lX8NNFkO7eu3teK','ADMIN',NULL,NULL,NULL,'2026-08-10 08:22:48.975'),('e2f5b2ea-f411-4a2a-b393-0a4ce019fd2b','Fedri Ardianas','fedri@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','B2S','B2B Partnership Manager','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-11 14:05:23.106'),('e51d00a6-926d-4365-9115-5b2d2132c1fb','Mohammad Rizki Adi Pradana','rizki@skolla.education','$2b$10$rxybxoETrgISlqSjLQs5X.Z2n2XFLRqvtvB0Sz0WhIkYwo4TncDc6','MANAGER','EDUCATION','Head of Operation','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-11 09:06:02.493'),('e5e0562f-dcf7-495c-8ec1-9954f59e5231','Teuku Zhurry Ariyandi Putra','zhurry@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','LEADER','B2S','Head of Sales','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-11 08:52:38.922'),('f28c7c3e-ebfd-490e-bee8-6a0823dcfa63','Muhammad Rasyid Juliansyah','rasyid@skolla.education','$2b$10$0u4aoOKsXX8yvO0UBUoxveDYLHF.2Oa2VOScYrD/cEJVM53N3Eeja','ADMIN','SSC','SSC',NULL,'2026-08-12 10:06:20.090'),('f881cfa0-3834-4355-990e-9126a125ab68','Ahna Fatun Salsabila','anaf@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','TEAM','SSC','HR Generalist','ac158f67-1705-496a-b06e-28735dd77caa','2026-08-11 08:52:38.930'),('f9a7d52d-7ad1-43aa-9789-b697268ede9c','Diva Zahraisya Putri Utami','tami@skolla.education','$2b$10$YVIudxOBEam8ACl1CkGb/u1yr4dwWMJss0RO80kmMgLwen8VF2mPq','TEAM','TECHDEV','UI/UX Designer','602ee7f5-0e5f-4390-a0d3-c111c5651807','2026-08-11 14:05:23.104'),('fe92b231-b9f5-443e-9ddb-fb230a1a3f63','Hafizh Abdan Syakura','hafizh@skolla.education','$2b$10$MZ.YlW9juIp52EJhDmjDWOmthl3VrTXQNRA40MmfMizl1EmmjXNDS','TEAM','STRATEGIC','Executive Partner','a623fa11-d5cb-46a7-b2a8-a6885cfa8238','2026-08-11 08:52:38.920');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'skolla_okr'
--
--
-- WARNING: can't read the INFORMATION_SCHEMA.libraries table. It's most probably an old server 8.4.11.
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-27  8:30:13

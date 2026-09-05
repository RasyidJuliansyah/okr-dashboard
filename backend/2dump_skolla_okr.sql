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
-- Table structure for table `AnnualKeyResult`
--

DROP TABLE IF EXISTS `AnnualKeyResult`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `AnnualKeyResult` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `objectiveId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `targetValue` double NOT NULL,
  `currentValue` double NOT NULL DEFAULT '0',
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bscPerspective` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ON_TRACK',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `AnnualKeyResult_objectiveId_idx` (`objectiveId`),
  KEY `AnnualKeyResult_year_idx` (`year`),
  CONSTRAINT `AnnualKeyResult_objectiveId_fkey` FOREIGN KEY (`objectiveId`) REFERENCES `Objective` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `AnnualKeyResult`
--

LOCK TABLES `AnnualKeyResult` WRITE;
/*!40000 ALTER TABLE `AnnualKeyResult` DISABLE KEYS */;
/*!40000 ALTER TABLE `AnnualKeyResult` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CausalLink`
--

DROP TABLE IF EXISTS `CausalLink`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CausalLink` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sourceKrId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetKrId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `relationship` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `CausalLink_sourceKrId_fkey` (`sourceKrId`),
  KEY `CausalLink_targetKrId_fkey` (`targetKrId`),
  CONSTRAINT `CausalLink_sourceKrId_fkey` FOREIGN KEY (`sourceKrId`) REFERENCES `KeyResult` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CausalLink_targetKrId_fkey` FOREIGN KEY (`targetKrId`) REFERENCES `KeyResult` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CausalLink`
--

LOCK TABLES `CausalLink` WRITE;
/*!40000 ALTER TABLE `CausalLink` DISABLE KEYS */;
/*!40000 ALTER TABLE `CausalLink` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Department`
--

DROP TABLE IF EXISTS `Department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Department` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `managerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Department_value_key` (`value`),
  KEY `Department_managerId_fkey` (`managerId`),
  CONSTRAINT `Department_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Department`
--

LOCK TABLES `Department` WRITE;
/*!40000 ALTER TABLE `Department` DISABLE KEYS */;
INSERT INTO `Department` VALUES ('32b8ba18-3742-47a3-ac7b-b5baa2319a66','SSC','SSC','b99f45aa-d805-42cb-aebc-250f399c7ee2','2026-08-28 04:34:04.438'),('338641a7-d4ed-4fb2-a164-6168f93b21c1','STRATEGIC','STRATEGIC','ae26480c-dfe4-4621-89ab-8b53ca20cd16','2026-08-28 04:35:57.204'),('34f9a666-73f4-42d9-bd68-41098562b20b','TECHDEV','TECHDEV','b99f45aa-d805-42cb-aebc-250f399c7ee2','2026-08-28 04:35:24.305'),('4105016f-a80b-40a5-97d2-69e22776c701','Shared Service Center (SSC)','SHARED_SERVICE_CENTER_SSC_','b99f45aa-d805-42cb-aebc-250f399c7ee2','2026-08-28 04:33:16.121'),('5a0dacdf-99f8-4e36-a3c8-d21ebe10cab7','SERVICE_ACCOUNT','SERVICE_ACCOUNT','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-08-28 04:34:41.634'),('68d7eaa7-4e9c-4b99-8178-a55a44ee0758','B2S','B2S','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','2026-08-28 04:31:59.406'),('82e36742-fcae-4d61-bbe1-eb13de5bbff2','B2B_EXPANSION','B2B_EXPANSION','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','2026-08-28 04:37:13.489'),('bbbd505c-b258-4a11-94a9-5853e5d5608e','TECHOPS','TECHOPS','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-08-28 04:35:41.889'),('c7770a3a-78aa-4747-b7ef-f3b76bf6c151','EDUCATION','EDUCATION','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-08-28 04:36:48.509'),('ce816ba3-4490-4692-8651-bd0ab573c792','B2C','B2C','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','2026-08-28 04:31:42.491'),('f75cd11d-439b-4822-bff4-2ccc2888b3aa','B2B Corporation','B2B_CORPORATION','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','2026-08-28 04:32:55.607');
/*!40000 ALTER TABLE `Department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Initiative`
--

DROP TABLE IF EXISTS `Initiative`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Initiative` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `keyResultId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teamId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ownerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assignedLeaderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assignedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `targetValue` double NOT NULL DEFAULT '0',
  `currentValue` double NOT NULL DEFAULT '0',
  `achievedValue` double DEFAULT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ON_TRACK',
  `kanbanStatus` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TODO',
  `weight` double NOT NULL DEFAULT '1',
  `startDate` datetime(3) DEFAULT NULL,
  `dueDate` datetime(3) DEFAULT NULL,
  `finishDate` datetime(3) DEFAULT NULL,
  `sprintMonth` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `documentationLink` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Initiative_sprintMonth_idx` (`sprintMonth`),
  KEY `Initiative_keyResultId_fkey` (`keyResultId`),
  KEY `Initiative_teamId_fkey` (`teamId`),
  KEY `Initiative_ownerId_fkey` (`ownerId`),
  KEY `Initiative_assignedLeaderId_idx` (`assignedLeaderId`),
  CONSTRAINT `Initiative_assignedLeaderId_fkey` FOREIGN KEY (`assignedLeaderId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Initiative_keyResultId_fkey` FOREIGN KEY (`keyResultId`) REFERENCES `KeyResult` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Initiative_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Initiative_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Initiative`
--

LOCK TABLES `Initiative` WRITE;
/*!40000 ALTER TABLE `Initiative` DISABLE KEYS */;
INSERT INTO `Initiative` VALUES ('37877ed0-1b4d-4c55-b885-1e891d384e3c','71eb8414-2003-4c28-93e0-c1493311c3a2','602ee7f5-0e5f-4390-a0d3-c111c5651807','bc98a7e3-8f39-42ee-9dd7-65497507c42d',NULL,'3e3d3129-57d4-4b44-bb74-124025cc39c7','Inisiatif 1',NULL,100,100,NULL,'Unit','ON_TRACK','DONE',1,NULL,NULL,NULL,'2026-09','2026-09-04 23:32:28.627','2026-09-04 23:34:35.915',NULL),('518f3178-d9e3-49de-8f01-fd71b641d1e9','a9970520-1f2d-403e-b780-3e55eee2bc91','b195b816-8168-48c3-9540-f37263f5c04f','ce19f55c-c7c2-4b70-9118-cfd70df69346',NULL,'0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Capaian September Rp5000000000','',5000000000,2500000000,2500000000,'Rp','ON_TRACK','DONE',1,NULL,NULL,NULL,'2026-09','2026-09-01 09:46:27.660','2026-09-03 05:43:19.917',NULL),('5b955b9b-0878-4763-a107-959892f40844','dc0764d4-1bb6-413d-826e-d0cc4001c562','ac158f67-1705-496a-b06e-28735dd77caa','b99f45aa-d805-42cb-aebc-250f399c7ee2',NULL,'17703076-fc99-4c28-bea5-f33496dd36b5','Task1','',400,400,20,'Task','ON_TRACK','DONE',100,'2026-09-03 00:00:00.000',NULL,'2026-09-21 00:00:00.000','2026-09','2026-09-03 05:45:54.392','2026-09-03 05:46:17.166',NULL),('690b60c7-82d6-4022-bc6a-34a9994badcf','a9970520-1f2d-403e-b780-3e55eee2bc91','b195b816-8168-48c3-9540-f37263f5c04f','b8bb523e-2481-4b14-8e20-4abe095f6cc0',NULL,'ce19f55c-c7c2-4b70-9118-cfd70df69346','Capai 2M',NULL,2000000000,1000000000,200000000,'Rp','ON_TRACK','DONE',1,NULL,NULL,NULL,'2026-09','2026-09-01 14:05:29.736','2026-09-01 14:30:15.551',NULL),('77af5c3d-2f93-4a79-add9-912094e20587','7b3ab16d-d7ed-4a88-8526-ec0308854bf6','5ad10fff-3bfb-400f-88e1-e9a387743324','8633c0be-5d11-4ade-9b23-647eab37e0e8',NULL,'8633c0be-5d11-4ade-9b23-647eab37e0e8','Capai Rp120.000.000',NULL,120000000,20000000,20000000,'Rp','ON_TRACK','DONE',1,NULL,NULL,NULL,'2026-09','2026-09-03 06:51:25.412','2026-09-03 06:56:27.836',NULL),('7f4d95bf-525d-4855-af24-3569b0e3dea1','a9970520-1f2d-403e-b780-3e55eee2bc91','b195b816-8168-48c3-9540-f37263f5c04f','b8bb523e-2481-4b14-8e20-4abe095f6cc0',NULL,'b8bb523e-2481-4b14-8e20-4abe095f6cc0','Visit',NULL,50,50,38,'Visit','ON_TRACK','DONE',96,NULL,NULL,NULL,'2026-09','2026-09-04 02:07:47.864','2026-09-04 03:07:25.866',NULL),('8462d5ef-c0c5-40a8-8824-ce3cd8834384','71eb8414-2003-4c28-93e0-c1493311c3a2','602ee7f5-0e5f-4390-a0d3-c111c5651807','bc98a7e3-8f39-42ee-9dd7-65497507c42d',NULL,'bc98a7e3-8f39-42ee-9dd7-65497507c42d','Inisiatif 2',NULL,20,18,NULL,'Unit','ON_TRACK','IN_PROGRESS',99,'2026-09-07 00:00:00.000','2026-09-21 00:00:00.000',NULL,'2026-09','2026-09-04 23:35:16.074','2026-09-04 23:35:54.173',NULL),('8c28e921-78e5-4e9d-a66f-8f865deb43c6','a3785c1d-4ae4-415b-bd45-b2c9e08b5553','5ad10fff-3bfb-400f-88e1-e9a387743324','2957a03a-4083-44ef-80d4-898cddfea0e5',NULL,'0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Organik Leads 40','',40,40,35,'Leads','ON_TRACK','DONE',1,NULL,NULL,NULL,'2026-09','2026-09-01 04:17:04.144','2026-09-04 04:32:20.205',NULL),('b66ab1fc-43e2-4f4e-849a-f6f0b61cbe7a','a9970520-1f2d-403e-b780-3e55eee2bc91','b195b816-8168-48c3-9540-f37263f5c04f','b8bb523e-2481-4b14-8e20-4abe095f6cc0',NULL,'b8bb523e-2481-4b14-8e20-4abe095f6cc0','Test Approve',NULL,10,10,6,'Task','ON_TRACK','DONE',1,NULL,NULL,NULL,'2026-09','2026-09-04 02:46:50.356','2026-09-04 02:47:00.584',NULL),('c304e85f-b574-4227-bf28-af9f651adcd2','0e885b60-50b4-46bf-bdde-d1fa8ca1dba8','b195b816-8168-48c3-9540-f37263f5c04f','ce19f55c-c7c2-4b70-9118-cfd70df69346',NULL,'0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Capai 38 Deal Kerjasama',NULL,38,11.88,NULL,'Deal Kerjasama','ON_TRACK','TODO',1,NULL,NULL,NULL,'2026-09','2026-09-04 03:26:30.232','2026-09-04 03:32:58.387',NULL),('cbac24bd-c108-4c7b-9222-9fc10e0cebfd','62057c20-7e2a-47f3-b754-dba09caaa0ad','c22e7778-49e0-47dd-adfc-a96e23c4a037','34842edc-86c6-442e-9361-3d55cb7f93ce',NULL,'3e3d3129-57d4-4b44-bb74-124025cc39c7','Inisiatif Edu 2',NULL,100,0,NULL,'%','ON_TRACK','TODO',1,NULL,NULL,NULL,'2026-09','2026-09-04 23:32:53.365','2026-09-04 23:32:53.365',NULL),('dd95b09e-dc1a-45ba-9e68-9dcd9e311907','a6a6bd94-3441-49f5-ac29-64d25b283959','5ad10fff-3bfb-400f-88e1-e9a387743324','8633c0be-5d11-4ade-9b23-647eab37e0e8',NULL,'8633c0be-5d11-4ade-9b23-647eab37e0e8','Leads 1000',NULL,1000,300,300,'Leads','ON_TRACK','DONE',1,NULL,NULL,NULL,'2026-09','2026-09-03 06:58:26.961','2026-09-03 06:58:51.070',NULL),('ef36d407-db4e-40e9-8701-a85a2697e8db','a3785c1d-4ae4-415b-bd45-b2c9e08b5553','5ad10fff-3bfb-400f-88e1-e9a387743324','2957a03a-4083-44ef-80d4-898cddfea0e5',NULL,'8633c0be-5d11-4ade-9b23-647eab37e0e8','Leads 10',NULL,10,1,7,'Leads','ON_TRACK','DONE',10,'2026-09-03 00:00:00.000','2026-09-21 00:00:00.000',NULL,'2026-09','2026-09-03 07:37:22.646','2026-09-03 07:38:13.810',NULL),('f8b33668-fdc4-4ce1-95a1-217ca1ea2253','a9970520-1f2d-403e-b780-3e55eee2bc91','b195b816-8168-48c3-9540-f37263f5c04f','96fdb6c2-15a8-4705-9f08-0586a36d4f91',NULL,'96fdb6c2-15a8-4705-9f08-0586a36d4f91','Visit Sekolah',NULL,50,25,40,'Sekolah','ON_TRACK','DONE',10,'2026-09-21 00:00:00.000','2026-09-21 00:00:00.000',NULL,'2026-09','2026-09-01 09:57:16.430','2026-09-04 03:07:28.836',NULL);
/*!40000 ALTER TABLE `Initiative` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `InitiativeKpi`
--

DROP TABLE IF EXISTS `InitiativeKpi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `InitiativeKpi` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `initiativeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kpiId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetValue` double NOT NULL,
  `currentValue` double NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `InitiativeKpi_initiativeId_kpiId_key` (`initiativeId`,`kpiId`),
  KEY `InitiativeKpi_initiativeId_idx` (`initiativeId`),
  KEY `InitiativeKpi_kpiId_idx` (`kpiId`),
  CONSTRAINT `InitiativeKpi_initiativeId_fkey` FOREIGN KEY (`initiativeId`) REFERENCES `Initiative` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `InitiativeKpi_kpiId_fkey` FOREIGN KEY (`kpiId`) REFERENCES `Kpi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `InitiativeKpi`
--

LOCK TABLES `InitiativeKpi` WRITE;
/*!40000 ALTER TABLE `InitiativeKpi` DISABLE KEYS */;
/*!40000 ALTER TABLE `InitiativeKpi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `InitiativeUpdate`
--

DROP TABLE IF EXISTS `InitiativeUpdate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `InitiativeUpdate` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `initiativeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `oldValue` double NOT NULL,
  `newValue` double NOT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kanbanStatus` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submittedBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `link` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewedAt` datetime(3) DEFAULT NULL,
  `reviewedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING_APPROVAL',
  PRIMARY KEY (`id`),
  KEY `InitiativeUpdate_initiativeId_createdAt_idx` (`initiativeId`,`createdAt`),
  CONSTRAINT `InitiativeUpdate_initiativeId_fkey` FOREIGN KEY (`initiativeId`) REFERENCES `Initiative` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `InitiativeUpdate`
--

LOCK TABLES `InitiativeUpdate` WRITE;
/*!40000 ALTER TABLE `InitiativeUpdate` DISABLE KEYS */;
INSERT INTO `InitiativeUpdate` VALUES ('0010e751-2e16-4fbf-82fb-18d04b7ff8c8','518f3178-d9e3-49de-8f01-fd71b641d1e9',0,0,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','96fdb6c2-15a8-4705-9f08-0586a36d4f91','2026-09-01 10:11:41.973',NULL,'2026-09-01 10:11:41.972','96fdb6c2-15a8-4705-9f08-0586a36d4f91','APPROVED'),('02dc03c4-1bc3-4f62-9a57-941bd1e3c0fc','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke DROP','DROP','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:15:26.142',NULL,'2026-09-04 02:15:26.141','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('03a9eaa7-5382-4830-9a55-3dd3a17ff933','37877ed0-1b4d-4c55-b885-1e891d384e3c',0,20,NULL,'IN_PROGRESS','bc98a7e3-8f39-42ee-9dd7-65497507c42d','2026-09-04 23:34:08.562',NULL,'2026-09-04 23:34:08.559','bc98a7e3-8f39-42ee-9dd7-65497507c42d','APPROVED'),('046c043e-07eb-41f7-a9cf-8ff469301e8d','518f3178-d9e3-49de-8f01-fd71b641d1e9',2500000000,5000000000,'Status Kanban diubah ke DONE','DONE','17703076-fc99-4c28-bea5-f33496dd36b5','2026-09-03 05:43:19.954',NULL,'2026-09-03 05:43:19.953','17703076-fc99-4c28-bea5-f33496dd36b5','APPROVED'),('12fecafd-e99b-4f11-9da0-362184f64bbe','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:15:24.832',NULL,'2026-09-04 02:15:24.831','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('131377e6-0bbf-4404-9b98-81270fc0ed48','8462d5ef-c0c5-40a8-8824-ce3cd8834384',20,18,NULL,'IN_PROGRESS','bc98a7e3-8f39-42ee-9dd7-65497507c42d','2026-09-04 23:35:54.173',NULL,'2026-09-04 23:35:54.172','bc98a7e3-8f39-42ee-9dd7-65497507c42d','APPROVED'),('177609a1-f23c-4da3-82f8-9f8385135256','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke DONE','DONE','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 03:07:25.887',NULL,'2026-09-04 03:07:25.886','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('1aa1e391-702e-4d2d-9984-6cb113d6252a','8c28e921-78e5-4e9d-a66f-8f865deb43c6',40,40,NULL,'DONE','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09-01 06:54:13.085',NULL,'2026-09-01 06:54:13.084','8633c0be-5d11-4ade-9b23-647eab37e0e8','APPROVED'),('1da289df-e027-4df3-9f0e-de634fb2f918','518f3178-d9e3-49de-8f01-fd71b641d1e9',0,0,'Status Kanban diubah ke TODO','TODO','96fdb6c2-15a8-4705-9f08-0586a36d4f91','2026-09-01 10:12:25.248',NULL,'2026-09-01 10:12:25.247','96fdb6c2-15a8-4705-9f08-0586a36d4f91','APPROVED'),('251da1dc-b937-4d2c-86b7-e3f03790ac53','8c28e921-78e5-4e9d-a66f-8f865deb43c6',40,36,NULL,'IN_PROGRESS','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09-01 06:54:24.097',NULL,'2026-09-01 06:54:24.095','8633c0be-5d11-4ade-9b23-647eab37e0e8','APPROVED'),('2a7828fb-a504-4a13-a8e2-8126aa2f3424','8c28e921-78e5-4e9d-a66f-8f865deb43c6',26.67,30,NULL,'IN_PROGRESS','2957a03a-4083-44ef-80d4-898cddfea0e5','2026-09-01 06:50:35.380',NULL,'2026-09-01 06:50:35.379','2957a03a-4083-44ef-80d4-898cddfea0e5','APPROVED'),('2bd421e3-c4ef-4aff-bbc4-7a3c3dd3564c','690b60c7-82d6-4022-bc6a-34a9994badcf',0,0,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-01 14:05:40.057',NULL,'2026-09-01 14:05:40.056','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('2c81eb53-d576-404e-ae36-2a4cd6f2c7ef','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke TODO','TODO','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:15:23.000',NULL,'2026-09-04 02:15:22.999','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('34a914c0-e751-405a-af83-63936a48cac4','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke TODO','TODO','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:16:01.229',NULL,'2026-09-04 02:16:01.228','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('3e3d476c-c9ca-421a-aa5c-09fcdb282422','8c28e921-78e5-4e9d-a66f-8f865deb43c6',30,40,'Status Kanban diubah ke DONE','DONE','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09-01 06:51:45.750',NULL,'2026-09-01 06:51:45.750','8633c0be-5d11-4ade-9b23-647eab37e0e8','APPROVED'),('53fa1e03-0f6d-4748-99f7-e2fd54dd4b2a','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:16:50.111',NULL,'2026-09-04 02:16:50.110','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('56de9799-8332-471f-8203-cb91323ba268','37877ed0-1b4d-4c55-b885-1e891d384e3c',20,100,'Status Kanban diubah ke DONE','DONE','bc98a7e3-8f39-42ee-9dd7-65497507c42d','2026-09-04 23:34:27.615',NULL,'2026-09-04 23:34:27.614','bc98a7e3-8f39-42ee-9dd7-65497507c42d','APPROVED'),('6639012e-471a-4cd5-ba86-a6ed9e6e9a82','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 03:06:21.034',NULL,'2026-09-04 03:06:21.034','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('666ecc5e-60e0-449b-8e7f-820edc1bb820','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke DONE','DONE','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:43:15.892',NULL,'2026-09-04 02:43:15.891','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('66a79ce1-3183-43e0-b81d-f0da1ea42807','5b955b9b-0878-4763-a107-959892f40844',0,0,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','17703076-fc99-4c28-bea5-f33496dd36b5','2026-09-03 05:45:58.315',NULL,'2026-09-03 05:45:58.314','17703076-fc99-4c28-bea5-f33496dd36b5','APPROVED'),('6d4888ef-c6b8-46dc-bc86-8f1abbe7ade8','dd95b09e-dc1a-45ba-9e68-9dcd9e311907',0,300,NULL,'IN_PROGRESS','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09-03 06:58:41.430',NULL,'2026-09-03 06:58:41.429','8633c0be-5d11-4ade-9b23-647eab37e0e8','APPROVED'),('6f9f7fdd-b7b3-4f6e-b4be-8f60f8357a77','77af5c3d-2f93-4a79-add9-912094e20587',20000000,20000000,NULL,'IN_PROGRESS','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09-03 06:56:18.107',NULL,'2026-09-03 06:56:18.106','8633c0be-5d11-4ade-9b23-647eab37e0e8','APPROVED'),('6fd1f0c4-6bbf-4f04-b95f-12d5742df453','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:15:27.978',NULL,'2026-09-04 02:15:27.977','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('726894ba-481e-45ba-b6fb-8bf485c0b63c','8c28e921-78e5-4e9d-a66f-8f865deb43c6',0,0,NULL,'IN_PROGRESS','2957a03a-4083-44ef-80d4-898cddfea0e5','2026-09-01 06:36:36.417',NULL,'2026-09-01 06:36:36.412','2957a03a-4083-44ef-80d4-898cddfea0e5','APPROVED'),('8f243f10-3790-47fa-8b94-46289b4074aa','8c28e921-78e5-4e9d-a66f-8f865deb43c6',36,40,NULL,'DONE','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09-01 06:54:47.731',NULL,'2026-09-01 06:54:47.729','8633c0be-5d11-4ade-9b23-647eab37e0e8','APPROVED'),('907277c7-1c73-4411-8818-8ef32bd598a7','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:15:58.161',NULL,'2026-09-04 02:15:58.160','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('9a7846de-1ebf-4063-909a-297e9169e10d','f8b33668-fdc4-4ce1-95a1-217ca1ea2253',0,50,'Status Kanban diubah ke DONE','DONE','96fdb6c2-15a8-4705-9f08-0586a36d4f91','2026-09-01 10:18:28.204',NULL,'2026-09-01 10:18:28.203','96fdb6c2-15a8-4705-9f08-0586a36d4f91','APPROVED'),('9b06ff93-3aa8-44fb-93fa-6760c363b5a5','690b60c7-82d6-4022-bc6a-34a9994badcf',200000000,2000000000,'Status Kanban diubah ke DONE','DONE','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-01 14:06:59.998',NULL,'2026-09-01 14:06:59.997','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('a118a624-a6be-468c-84e7-ddb551c7a828','7f4d95bf-525d-4855-af24-3569b0e3dea1',0,50,'Status Kanban diubah ke DONE','DONE','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:07:56.523',NULL,'2026-09-04 02:07:56.522','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('a2a1c9e7-224d-4595-a8cb-8f42b642ef09','8462d5ef-c0c5-40a8-8824-ce3cd8834384',20,20,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','bc98a7e3-8f39-42ee-9dd7-65497507c42d','2026-09-04 23:35:45.809',NULL,'2026-09-04 23:35:45.808','bc98a7e3-8f39-42ee-9dd7-65497507c42d','APPROVED'),('a7dc2603-a7d3-4b75-8939-1fdc8be1210f','8c28e921-78e5-4e9d-a66f-8f865deb43c6',40,40,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09-01 06:52:42.901',NULL,'2026-09-01 06:52:42.900','8633c0be-5d11-4ade-9b23-647eab37e0e8','APPROVED'),('bce442bb-e7d0-40e7-9f04-3c74c682fc82','ef36d407-db4e-40e9-8701-a85a2697e8db',0,0,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09-03 07:37:57.649',NULL,'2026-09-03 07:37:57.648','8633c0be-5d11-4ade-9b23-647eab37e0e8','APPROVED'),('c20a0670-7c3f-43a6-b542-138614bfffc4','37877ed0-1b4d-4c55-b885-1e891d384e3c',20,100,NULL,'DONE','bc98a7e3-8f39-42ee-9dd7-65497507c42d','2026-09-04 23:34:35.915',NULL,'2026-09-04 23:34:35.914','bc98a7e3-8f39-42ee-9dd7-65497507c42d','APPROVED'),('c621a304-b907-4d22-9495-62da37b9bdd8','ef36d407-db4e-40e9-8701-a85a2697e8db',1,10,'Status Kanban diubah ke DONE','DONE','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09-03 07:38:13.830',NULL,'2026-09-03 07:38:13.829','8633c0be-5d11-4ade-9b23-647eab37e0e8','APPROVED'),('ca0af5a0-ac7d-4326-bc26-d8640420127f','f8b33668-fdc4-4ce1-95a1-217ca1ea2253',0,0,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','96fdb6c2-15a8-4705-9f08-0586a36d4f91','2026-09-01 09:57:21.835',NULL,'2026-09-01 09:57:21.834','96fdb6c2-15a8-4705-9f08-0586a36d4f91','APPROVED'),('cb8183c9-4b1f-4254-8a37-c8a5615208d3','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke DONE','DONE','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:15:33.827',NULL,'2026-09-04 02:15:33.826','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('ce7e3812-8d34-4820-965a-7f02fa54b1d2','77af5c3d-2f93-4a79-add9-912094e20587',20000000,120000000,'Status Kanban diubah ke DONE','DONE','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09-03 06:56:27.859',NULL,'2026-09-03 06:56:27.858','8633c0be-5d11-4ade-9b23-647eab37e0e8','APPROVED'),('d5e073ca-0680-4e94-bbde-b5a0d4c7024d','8462d5ef-c0c5-40a8-8824-ce3cd8834384',0,20,'Status Kanban diubah ke DONE','DONE','bc98a7e3-8f39-42ee-9dd7-65497507c42d','2026-09-04 23:35:37.476',NULL,'2026-09-04 23:35:37.475','bc98a7e3-8f39-42ee-9dd7-65497507c42d','APPROVED'),('d74abccc-aacd-47d9-b26e-d6c805f0df0d','b66ab1fc-43e2-4f4e-849a-f6f0b61cbe7a',0,10,'Status Kanban diubah ke DONE','DONE','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:47:00.603',NULL,'2026-09-04 02:47:00.602','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('d9494638-6380-418c-b929-a97923729745','dd95b09e-dc1a-45ba-9e68-9dcd9e311907',300,1000,'Status Kanban diubah ke DONE','DONE','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09-03 06:58:51.079',NULL,'2026-09-03 06:58:51.079','8633c0be-5d11-4ade-9b23-647eab37e0e8','APPROVED'),('e15cc9ba-4c60-4c07-acd0-b52ef41dbe3d','8c28e921-78e5-4e9d-a66f-8f865deb43c6',40,40,'Status Kanban diubah ke DONE','DONE','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09-01 06:52:58.008',NULL,'2026-09-01 06:52:58.007','8633c0be-5d11-4ade-9b23-647eab37e0e8','APPROVED'),('e54b8f2d-63e7-4f03-87a1-d3dccdaff591','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke DROP','DROP','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:16:48.310',NULL,'2026-09-04 02:16:48.309','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('ef35d38e-b837-4c1e-83d3-cefb477d63b1','518f3178-d9e3-49de-8f01-fd71b641d1e9',0,0,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','96fdb6c2-15a8-4705-9f08-0586a36d4f91','2026-09-01 10:12:36.605',NULL,'2026-09-01 10:12:36.604','96fdb6c2-15a8-4705-9f08-0586a36d4f91','APPROVED'),('f0141c6c-4843-4506-81a8-2f642c705c6e','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:16:46.832',NULL,'2026-09-04 02:16:46.831','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('f1f34aa1-85bc-4f64-af0f-ae5c2baff3c4','5b955b9b-0878-4763-a107-959892f40844',0,400,'Status Kanban diubah ke DONE','DONE','17703076-fc99-4c28-bea5-f33496dd36b5','2026-09-03 05:46:17.183',NULL,'2026-09-03 05:46:17.182','17703076-fc99-4c28-bea5-f33496dd36b5','APPROVED'),('f2488987-9a72-42bf-adc5-ebf384b4c66d','7f4d95bf-525d-4855-af24-3569b0e3dea1',50,50,'Status Kanban diubah ke IN_PROGRESS','IN_PROGRESS','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-04 02:15:21.188',NULL,'2026-09-04 02:15:21.187','b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED'),('f2d34956-f1db-4d69-bc6c-f0dd31c13659','77af5c3d-2f93-4a79-add9-912094e20587',0,20000000,NULL,'TODO','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09-03 06:56:08.564',NULL,'2026-09-03 06:56:08.562','8633c0be-5d11-4ade-9b23-647eab37e0e8','APPROVED');
/*!40000 ALTER TABLE `InitiativeUpdate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `KeyResult`
--

DROP TABLE IF EXISTS `KeyResult`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `KeyResult` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `objectiveId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `annualKeyResultId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `month` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `monthWeight` double NOT NULL DEFAULT '1',
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetValue` double NOT NULL,
  `currentValue` double NOT NULL DEFAULT '0',
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bscPerspective` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ON_TRACK',
  `isManualOverride` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `KeyResult_annualKeyResultId_idx` (`annualKeyResultId`),
  KEY `KeyResult_month_idx` (`month`),
  KEY `KeyResult_objectiveId_fkey` (`objectiveId`),
  CONSTRAINT `KeyResult_annualKeyResultId_fkey` FOREIGN KEY (`annualKeyResultId`) REFERENCES `AnnualKeyResult` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `KeyResult_objectiveId_fkey` FOREIGN KEY (`objectiveId`) REFERENCES `Objective` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `KeyResult`
--

LOCK TABLES `KeyResult` WRITE;
/*!40000 ALTER TABLE `KeyResult` DISABLE KEYS */;
INSERT INTO `KeyResult` VALUES ('0200e827-ba69-4be0-8f83-520d2e0ca593','7152b683-7b54-4a7d-90db-dfe01312405b',NULL,NULL,1,'Menjaga angka churn rate <35%',35,0,'%','CUSTOMER','ON_TRACK',0,'2026-09-01 04:14:57.103','2026-09-01 04:14:57.103'),('08ff7f52-89e4-4f40-b1c6-40b147930e31','516fa3dc-6b6d-4f26-878f-b5480bff926b',NULL,NULL,1,'100% laporan performa SSC & BU tersedia real-time/self-service, tanpa proses manual berulang',100,0,'%','LEARNING_GROWTH','ON_TRACK',0,'2026-09-01 04:14:57.261','2026-09-01 04:14:57.261'),('0c38b59a-51d1-44b5-b108-7b5c498c812c','7152b683-7b54-4a7d-90db-dfe01312405b',NULL,NULL,1,'Meningkatkan retention rate dari existing customer >65%',65,0,'%','CUSTOMER','ON_TRACK',0,'2026-09-01 04:14:57.109','2026-09-01 04:14:57.109'),('0e885b60-50b4-46bf-bdde-d1fa8ca1dba8','9d8ee568-1378-4a04-bfed-3303cf8ab19d',NULL,'2026-09',1,'[B2B Expansion] Mencapai Deal Kerja Sama dengan 86 Sekolah B2B Expansion (@55juta/Paket LMS Juara Rombel Menengah)',86,11.88,'Sekolah','FINANCIAL','OFF_TRACK',0,'2026-09-01 04:14:57.061','2026-09-04 03:32:58.394'),('115e7559-a0cf-4fd3-907b-1e900da682fc','cbc435bc-f6f6-460d-8e29-e0930f8c4466',NULL,NULL,1,'Solving bug error P0-P1  <2x24 jam apabila mobile app',48,0,'Jam','INTERNAL_PROCESS','ON_TRACK',0,'2026-09-01 04:14:57.181','2026-09-01 04:14:57.181'),('12d4a56c-675e-4620-8ac7-04f10cde4349','fee0862f-3985-4165-89bc-4da590e60bb2',NULL,NULL,1,'Solving problem <1 jam apabila isu tidak perlu ada development dan keterangan isu lengkap',24,0,'Jam','INTERNAL_PROCESS','ON_TRACK',0,'2026-09-01 04:14:57.197','2026-09-01 04:14:57.197'),('136b2fde-abed-424a-b68e-2a820522c65c','c5800391-5c09-4fd6-a310-8299de6c63d3',NULL,NULL,1,'Menurunkan Customer Effort Score',80,0,'%','INTERNAL_PROCESS','ON_TRACK',0,'2026-09-01 04:14:57.138','2026-09-01 04:14:57.138'),('1546ea4d-991b-4972-a110-4e3fcf451893','9d8ee568-1378-4a04-bfed-3303cf8ab19d',NULL,NULL,1,'[B2S] Mencapai Revenue Net B2S Rp9.900.000.000',9900000000,0,'Rupiah','FINANCIAL','ON_TRACK',0,'2026-09-01 04:14:57.034','2026-09-01 04:14:57.034'),('276cf569-a148-4312-be8d-e75cc215ca2f','9d8ee568-1378-4a04-bfed-3303cf8ab19d',NULL,NULL,1,'[B2BC] Mencapai Revenue Net Rp4.700.000.000',4700000000,0,'Rupiah','FINANCIAL','ON_TRACK',0,'2026-09-01 04:14:57.029','2026-09-01 04:14:57.029'),('369172ce-766d-45c0-8b20-acff32879a3d','9d8ee568-1378-4a04-bfed-3303cf8ab19d',NULL,NULL,1,'[B2BC] Mengumpulkan dan Mengkonversi 38 Prospect Leads',38,0,'Leads','FINANCIAL','ON_TRACK',0,'2026-09-01 04:14:57.023','2026-09-01 04:14:57.023'),('42342df2-0e9f-4c93-95b3-8970c52301c9','516fa3dc-6b6d-4f26-878f-b5480bff926b',NULL,NULL,1,'Adopsi dashboard single source of truth live dan menjadi rujukan utama manajemen',90,0,'%','LEARNING_GROWTH','ON_TRACK',0,'2026-09-01 04:14:57.249','2026-09-01 04:14:57.249'),('4bf99043-cd3f-41a9-a437-677aadb6e668','c5800391-5c09-4fd6-a310-8299de6c63d3',NULL,NULL,1,'Meningkatkan exam completion rate',80,0,'%','INTERNAL_PROCESS','ON_TRACK',0,'2026-09-01 04:14:57.152','2026-09-01 04:14:57.152'),('4c66e0ab-b764-4edb-ae72-e86d4b1d4933','cbc435bc-f6f6-460d-8e29-e0930f8c4466',NULL,NULL,1,'Menjaga downtime functional platform <20mins',20,0,'Menit','INTERNAL_PROCESS','ON_TRACK',0,'2026-09-01 04:14:57.167','2026-09-01 04:14:57.167'),('512c51dc-2027-4692-a894-a28bd9de4fb0','ee25e3d2-59e6-439d-be75-cc526b5acfd0',NULL,NULL,1,'Fulfillment rate manpower optimal — 100% posisi kritikal terisi sesuai SLA rekrutmen',100,0,'%','LEARNING_GROWTH','ON_TRACK',0,'2026-09-01 04:14:57.270','2026-09-01 04:14:57.270'),('62057c20-7e2a-47f3-b754-dba09caaa0ad','bff4dc86-d15b-4a2e-8c4e-2d824563fa1e',NULL,'2026-09',1,'100% akurasi produk dengan kebutuhan user',100,0,'%','INTERNAL_PROCESS','ON_TRACK',0,'2026-09-01 04:14:57.230','2026-09-04 23:32:53.354'),('71eb8414-2003-4c28-93e0-c1493311c3a2','c5800391-5c09-4fd6-a310-8299de6c63d3',NULL,'2026-09',1,'Rata-rata active user 80%',80,72.08,'%','INTERNAL_PROCESS','ON_TRACK',0,'2026-09-01 04:14:57.145','2026-09-04 23:35:54.187'),('7231d0d8-ffc5-45f0-ab79-530c9fa347e9','9d8ee568-1378-4a04-bfed-3303cf8ab19d',NULL,NULL,1,'[B2S] Mencapai Deal Kerja Sama dengan 95 Sekolah B2S (@55juta/Paket LMS Juara Rombel Menengah)',95,0,'Sekolah','FINANCIAL','ON_TRACK',0,'2026-09-01 04:14:57.040','2026-09-01 04:14:57.040'),('7b3ab16d-d7ed-4a88-8526-ec0308854bf6','9d8ee568-1378-4a04-bfed-3303cf8ab19d',NULL,'2026-09',1,'[B2C] Mencapai Revenue Net Rp600.000.000',600000000,100000000,'Rupiah','FINANCIAL','OFF_TRACK',0,'2026-09-01 04:14:57.017','2026-09-03 06:56:27.853'),('7ce32fef-414e-4699-b919-ab4eff9140ce','62b585ff-048f-4a57-967d-025bd0941837',NULL,NULL,1,'Cadence review performa (BSC & Scrum sprint review) berjalan konsisten dengan ≥90% action item ditindaklanjuti tepat waktu',90,0,'%','LEARNING_GROWTH','ON_TRACK',0,'2026-09-01 04:14:57.310','2026-09-01 04:14:57.310'),('8223f643-6e09-4bd5-b1ce-0f9c3de91f76','c39b68cf-d522-49aa-a7d7-149c77c76e58',NULL,NULL,1,'Menjaga jumlah sekolah terkategori merah <20%',20,0,'%','CUSTOMER','ON_TRACK',0,'2026-09-01 04:14:57.124','2026-09-01 04:14:57.124'),('86976462-0a32-43b0-b2c7-549b7bf91ff6','ee25e3d2-59e6-439d-be75-cc526b5acfd0',NULL,NULL,1,'100% talent memiliki KPI yang ter-cascade dari BSC dan dimonitor performanya',100,0,'%','LEARNING_GROWTH','ON_TRACK',0,'2026-09-01 04:14:57.280','2026-09-01 04:14:57.280'),('881b6ca3-8f33-48a0-8109-8ccf9fcb29b3','dd5808b8-b638-41d8-ae34-22d8771659b9',NULL,NULL,1,'Meningkatkan collection rate (Days Sales Outstanding)',95,0,'%','FINANCIAL','ON_TRACK',0,'2026-09-01 04:14:57.096','2026-09-01 04:14:57.096'),('8fd4751a-bba9-4cbe-9740-121fbe828ebe','fee0862f-3985-4165-89bc-4da590e60bb2',NULL,NULL,1,'Solving problem <24 jam apabila isu tidak perlu ada development dan keterangan isu lengkap',24,0,'Jam','INTERNAL_PROCESS','ON_TRACK',0,'2026-09-01 04:14:57.189','2026-09-01 04:14:57.189'),('96d5aedd-2f9f-403e-99b7-1b6091889fda','9d8ee568-1378-4a04-bfed-3303cf8ab19d',NULL,NULL,1,'[B2S] Mencapai Deal Kerja Sama Penjualan dengan 22 Forum Kepala Sekolah (B2S) (@100 Juta/Forum)',22,0,'Forum','FINANCIAL','ON_TRACK',0,'2026-09-01 04:14:57.047','2026-09-01 04:14:57.047'),('a1d1bf90-f65c-4886-b7bc-b2a6185e8afc','fee0862f-3985-4165-89bc-4da590e60bb2',NULL,NULL,1,'<2 hari kerja request PO done terhitung data PO lengkap',48,0,'Jam','INTERNAL_PROCESS','ON_TRACK',0,'2026-09-01 04:14:57.205','2026-09-01 04:14:57.205'),('a3785c1d-4ae4-415b-bd45-b2c9e08b5553','9d8ee568-1378-4a04-bfed-3303cf8ab19d',NULL,'2026-09',1,'[B2C] Mencapai target Organic Leads total 833',833,42,'Organic Leads','FINANCIAL','OFF_TRACK',0,'2026-09-01 04:14:57.010','2026-09-03 07:38:13.824'),('a42b8adc-d1c6-4b4e-a057-1a70d2f3c376','bff4dc86-d15b-4a2e-8c4e-2d824563fa1e',NULL,NULL,1,'100% pencapaian target produksi',100,0,'%','INTERNAL_PROCESS','ON_TRACK',0,'2026-09-01 04:14:57.222','2026-09-01 04:14:57.222'),('a6a6bd94-3441-49f5-ac29-64d25b283959','9d8ee568-1378-4a04-bfed-3303cf8ab19d',NULL,'2026-09',1,'[B2C] Mencapai target Paid Leads total 2800',2800,840,'Paid Leads','FINANCIAL','OFF_TRACK',0,'2026-09-01 04:14:56.995','2026-09-03 06:58:51.077'),('a9970520-1f2d-403e-b780-3e55eee2bc91','9d8ee568-1378-4a04-bfed-3303cf8ab19d',NULL,'2026-09',1,'[B2B Expansion] Mencapai Revenue Net B2B Expansion Rp15.000.000.000',15000000000,2700000084,'Rupiah','FINANCIAL','OFF_TRACK',0,'2026-09-01 04:14:57.054','2026-09-04 03:07:28.847'),('ac17f280-c5c8-4326-aa44-e36683fa989f','cbc435bc-f6f6-460d-8e29-e0930f8c4466',NULL,NULL,1,'Menjaga downtime infrastructure <30mins',30,0,'Menit','INTERNAL_PROCESS','ON_TRACK',0,'2026-09-01 04:14:57.160','2026-09-01 04:14:57.160'),('ad5cc9a7-a96a-4562-8391-20349752bdf9','bff4dc86-d15b-4a2e-8c4e-2d824563fa1e',NULL,NULL,1,'Menjaga tingkat kepuasan layanan Skolla >82%',82,0,'%','LEARNING_GROWTH','ON_TRACK',0,'2026-09-01 04:14:57.238','2026-09-01 04:14:57.238'),('b241e83b-e610-4212-85f2-6ad94d7196ee','cbc435bc-f6f6-460d-8e29-e0930f8c4466',NULL,NULL,1,'Solving bug error P0-P1 <24 jam apabila web atau backend',24,0,'Jam','INTERNAL_PROCESS','ON_TRACK',0,'2026-09-01 04:14:57.174','2026-09-01 04:14:57.174'),('b4207cda-bd7b-4c05-b01a-b146295a3c95','9ca2373a-38cd-40d4-bb26-ada27ffe559e',NULL,NULL,1,'Mencapai target revenue dari setiap bisnis unit',31503810629,0,'Rupiah','FINANCIAL','ON_TRACK',0,'2026-09-01 04:14:57.075','2026-09-01 04:14:57.075'),('ca88db17-94d2-458a-9779-6eb6f25c76bc','9ca2373a-38cd-40d4-bb26-ada27ffe559e',NULL,NULL,1,'Memastikan kecukupan cash runway',3000000000,0,'Rupiah','FINANCIAL','ON_TRACK',0,'2026-09-01 04:14:57.089','2026-09-01 04:14:57.089'),('cd4a4be8-3edb-4fcd-93a3-a024ffff6010','9d8ee568-1378-4a04-bfed-3303cf8ab19d',NULL,NULL,1,'[B2B Expansion] Mencapai Deal Kerja Sama Penjualan dengan 29 Forum Kepala Sekolah Besar (@330 Juta/Forum)',29,0,'Forum','FINANCIAL','ON_TRACK',0,'2026-09-01 04:14:57.068','2026-09-01 04:14:57.068'),('d276f3f7-1e78-45de-9eb0-60e20dd19062','7152b683-7b54-4a7d-90db-dfe01312405b',NULL,NULL,1,'Mencapai Upsell 10% dari existing customer',10,0,'%','CUSTOMER','ON_TRACK',0,'2026-09-01 04:14:57.117','2026-09-01 04:14:57.117'),('d80b5d5f-e8d2-47fa-8784-03c1b7063cf1','dd5808b8-b638-41d8-ae34-22d8771659b9',NULL,NULL,1,'Menurunkan cost-to-revenue ratio (operating expense)',75,0,'%','FINANCIAL','ON_TRACK',0,'2026-09-01 04:14:57.082','2026-09-01 04:14:57.082'),('dc0764d4-1bb6-413d-826e-d0cc4001c562','62b585ff-048f-4a57-967d-025bd0941837',NULL,'2026-09',1,'Minimal 1 kajian R&D pengembangan bisnis/produk selesai per kuartal dengan rekomendasi yang diadopsi manajemen',1,0.05,'Unit','LEARNING_GROWTH','OFF_TRACK',0,'2026-09-01 04:14:57.322','2026-09-03 05:46:17.178'),('dd85d72d-9b11-454e-92a1-0f0167ea4a3e','ee25e3d2-59e6-439d-be75-cc526b5acfd0',NULL,NULL,1,'100% BU/divisi memiliki OKR yang ter-cascade dari BSC perusahaan dan dimonitor tiap bulan',100,0,'%','LEARNING_GROWTH','ON_TRACK',0,'2026-09-01 04:14:57.300','2026-09-01 04:14:57.300'),('df8aa285-751d-4a8a-b966-931c6395823c','ee25e3d2-59e6-439d-be75-cc526b5acfd0',NULL,NULL,1,'100% kepatuhan terhadap SOP & regulasi ketenagakerjaan (zero major violation)',100,0,'%','LEARNING_GROWTH','ON_TRACK',0,'2026-09-01 04:14:57.291','2026-09-01 04:14:57.291'),('dfe9a1f9-11ab-47da-97ef-d6797bd2979d','4c244321-5d68-4e42-a2ec-e9167eeb27b4',NULL,NULL,1,'Meningkatkan product goal success rate',80,0,'%','CUSTOMER','ON_TRACK',0,'2026-09-01 04:14:57.131','2026-09-01 04:14:57.131'),('eb9b574c-14fd-477e-bf6c-1dc3e9324fad','fee0862f-3985-4165-89bc-4da590e60bb2',NULL,NULL,1,'Menjaga First Response Time support <30 mins',30,0,'Menit','INTERNAL_PROCESS','ON_TRACK',0,'2026-09-01 04:14:57.213','2026-09-01 04:14:57.213');
/*!40000 ALTER TABLE `KeyResult` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Kpi`
--

DROP TABLE IF EXISTS `Kpi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Kpi` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bscPerspective` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `defaultTarget` double DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Kpi_department_idx` (`department`),
  KEY `Kpi_bscPerspective_idx` (`bscPerspective`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Kpi`
--

LOCK TABLES `Kpi` WRITE;
/*!40000 ALTER TABLE `Kpi` DISABLE KEYS */;
/*!40000 ALTER TABLE `Kpi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `KrAssignment`
--

DROP TABLE IF EXISTS `KrAssignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `KrAssignment` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `keyResultId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignedBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `raciRole` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RESPONSIBLE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `KrAssignment_keyResultId_userId_key` (`keyResultId`,`userId`),
  KEY `KrAssignment_keyResultId_idx` (`keyResultId`),
  KEY `KrAssignment_userId_idx` (`userId`),
  CONSTRAINT `KrAssignment_keyResultId_fkey` FOREIGN KEY (`keyResultId`) REFERENCES `KeyResult` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `KrAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `KrAssignment`
--

LOCK TABLES `KrAssignment` WRITE;
/*!40000 ALTER TABLE `KrAssignment` DISABLE KEYS */;
INSERT INTO `KrAssignment` VALUES ('0182b8da-24db-40fc-a63e-92bf8416e440','dd85d72d-9b11-454e-92a1-0f0167ea4a3e','b99f45aa-d805-42cb-aebc-250f399c7ee2','Skolla Education','2026-09-01 04:14:57.302','ACCOUNTABLE'),('019ba5bd-c74d-4825-9bc9-00e284faa236','7231d0d8-ffc5-45f0-ab79-530c9fa347e9','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Skolla Education','2026-09-01 04:14:57.041','RESPONSIBLE'),('022c04a0-ff53-4988-a7de-05ee2cc1df8c','71eb8414-2003-4c28-93e0-c1493311c3a2','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.147','RESPONSIBLE'),('09220f80-a47f-4026-a318-324f4e739507','b4207cda-bd7b-4c05-b01a-b146295a3c95','b99f45aa-d805-42cb-aebc-250f399c7ee2','Skolla Education','2026-09-01 04:14:57.077','RESPONSIBLE'),('0cbcb66c-e149-44cf-9a38-e849304f76a7','62057c20-7e2a-47f3-b754-dba09caaa0ad','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.232','RESPONSIBLE'),('1275af40-c55c-4589-bcc0-1cfe2dac8dac','7b3ab16d-d7ed-4a88-8526-ec0308854bf6','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Skolla Education','2026-09-01 04:14:57.019','RESPONSIBLE'),('149770a9-7466-45af-b836-fe780fedb880','71eb8414-2003-4c28-93e0-c1493311c3a2','bc98a7e3-8f39-42ee-9dd7-65497507c42d','Skolla Education','2026-09-01 04:14:57.149','ACCOUNTABLE'),('15df909e-1794-4937-a74c-69c9a7332464','8fd4751a-bba9-4cbe-9740-121fbe828ebe','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.191','RESPONSIBLE'),('162306d6-f71e-42d3-9985-26f675562ebf','ac17f280-c5c8-4326-aa44-e36683fa989f','bc98a7e3-8f39-42ee-9dd7-65497507c42d','Skolla Education','2026-09-01 04:14:57.164','ACCOUNTABLE'),('175fc588-a381-4814-9dca-b8681d27b52b','0e885b60-50b4-46bf-bdde-d1fa8ca1dba8','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Skolla Education','2026-09-01 04:14:57.063','RESPONSIBLE'),('19c27bde-b3b4-4bad-a680-9f2552734b59','4bf99043-cd3f-41a9-a437-677aadb6e668','bc98a7e3-8f39-42ee-9dd7-65497507c42d','Skolla Education','2026-09-01 04:14:57.156','ACCOUNTABLE'),('1de1b9f8-6f43-4e06-a7c8-4b0ee0003a5a','369172ce-766d-45c0-8b20-acff32879a3d','77d869a5-2537-4927-85fd-dc7089965da2','Skolla Education','2026-09-01 04:14:57.026','ACCOUNTABLE'),('21cfff58-fb65-4d9f-90c0-36741675902a','1546ea4d-991b-4972-a110-4e3fcf451893','3364e110-c458-486f-bb37-a8af31a8424a','Skolla Education','2026-09-01 04:14:57.037','ACCOUNTABLE'),('22b15cf4-0395-498f-a070-d93caa9ebce8','115e7559-a0cf-4fd3-907b-1e900da682fc','bc98a7e3-8f39-42ee-9dd7-65497507c42d','Skolla Education','2026-09-01 04:14:57.185','ACCOUNTABLE'),('2428cca3-0918-4ba3-9282-1177060964db','a3785c1d-4ae4-415b-bd45-b2c9e08b5553','8633c0be-5d11-4ade-9b23-647eab37e0e8','Skolla Education','2026-09-01 04:14:57.014','ACCOUNTABLE'),('24c2f2fd-883e-435e-82dc-ae4da05862a6','ca88db17-94d2-458a-9779-6eb6f25c76bc','eb761b0c-033c-4736-adf8-cada5bc48225','Skolla Education','2026-09-01 04:14:57.092','ACCOUNTABLE'),('2f9b6855-ce09-4b76-a234-16e2ec9b4732','a9970520-1f2d-403e-b780-3e55eee2bc91','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Skolla Education','2026-09-01 04:14:57.056','RESPONSIBLE'),('32320f9f-6653-4af4-809c-d53b0c2283b3','08ff7f52-89e4-4f40-b1c6-40b147930e31','87c99aec-bafa-46de-b0d8-bdbaf5a58371','Skolla Education','2026-09-01 04:14:57.266','ACCOUNTABLE'),('3344549a-1a48-4943-9fb1-2f71de2636ff','136b2fde-abed-424a-b68e-2a820522c65c','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.140','RESPONSIBLE'),('3ae56704-9b95-4dd0-a8c1-522634eca561','a1d1bf90-f65c-4886-b7bc-b2a6185e8afc','11f1dfcf-f913-460d-a9ce-6aa329ddfa9a','Skolla Education','2026-09-01 04:14:57.209','ACCOUNTABLE'),('3db0fbe0-f6f9-4fc0-860d-fa4f2717c0ea','369172ce-766d-45c0-8b20-acff32879a3d','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Skolla Education','2026-09-01 04:14:57.025','RESPONSIBLE'),('43f16299-36cd-4e0d-89cd-647d4c9f88b5','0c38b59a-51d1-44b5-b108-7b5c498c812c','d97d3e36-d563-4239-8a4c-5a3b5d9c3e2b','Skolla Education','2026-09-01 04:14:57.113','ACCOUNTABLE'),('47d8cffc-608a-48ed-9e14-f4ccc035d1ff','12d4a56c-675e-4620-8ac7-04f10cde4349','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.199','RESPONSIBLE'),('4888377d-7674-431b-8ccf-e36deca5633c','7ce32fef-414e-4699-b919-ab4eff9140ce','b99f45aa-d805-42cb-aebc-250f399c7ee2','Skolla Education','2026-09-01 04:14:57.311','ACCOUNTABLE'),('4bb62664-7d28-4934-81ca-a4736b52f225','ad5cc9a7-a96a-4562-8391-20349752bdf9','34842edc-86c6-442e-9361-3d55cb7f93ce','Skolla Education','2026-09-01 04:14:57.244','ACCOUNTABLE'),('4f0b1f72-ff41-46ea-8a42-f32c48e2ba7c','8223f643-6e09-4bd5-b1ce-0f9c3de91f76','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.125','RESPONSIBLE'),('4fbf9578-2b18-4e54-9acd-e8c54b3d4538','08ff7f52-89e4-4f40-b1c6-40b147930e31','b99f45aa-d805-42cb-aebc-250f399c7ee2','Skolla Education','2026-09-01 04:14:57.263','RESPONSIBLE'),('59d86613-4dc1-4257-b009-355953da8209','881b6ca3-8f33-48a0-8109-8ccf9fcb29b3','b99f45aa-d805-42cb-aebc-250f399c7ee2','Skolla Education','2026-09-01 04:14:57.097','RESPONSIBLE'),('5c1ba6f5-4cef-42ea-aa68-50173296678f','276cf569-a148-4312-be8d-e75cc215ca2f','77d869a5-2537-4927-85fd-dc7089965da2','Skolla Education','2026-09-01 04:14:57.031','ACCOUNTABLE'),('62d9b59a-059c-41ed-9e37-329dc61e7a51','12d4a56c-675e-4620-8ac7-04f10cde4349','11f1dfcf-f913-460d-a9ce-6aa329ddfa9a','Skolla Education','2026-09-01 04:14:57.201','ACCOUNTABLE'),('63bf6efc-13da-4b6a-9e65-4cc6e0fa1eb8','62057c20-7e2a-47f3-b754-dba09caaa0ad','34842edc-86c6-442e-9361-3d55cb7f93ce','Skolla Education','2026-09-01 04:14:57.234','ACCOUNTABLE'),('63e2a214-ff76-4948-8c42-b11fb77e6907','df8aa285-751d-4a8a-b966-931c6395823c','aa41a0fb-58de-4a7c-8ef0-1c4abdf6eb05','Skolla Education','2026-09-01 04:14:57.296','ACCOUNTABLE'),('6826690b-a03b-4648-9b4e-171049f612eb','42342df2-0e9f-4c93-95b3-8970c52301c9','87c99aec-bafa-46de-b0d8-bdbaf5a58371','Skolla Education','2026-09-01 04:14:57.257','ACCOUNTABLE'),('71dad1ca-0fc7-426e-b60e-999d74beb444','0200e827-ba69-4be0-8f83-520d2e0ca593','d97d3e36-d563-4239-8a4c-5a3b5d9c3e2b','Skolla Education','2026-09-01 04:14:57.106','ACCOUNTABLE'),('727a6a27-c6c1-4c44-8945-02d70ec92c63','df8aa285-751d-4a8a-b966-931c6395823c','b99f45aa-d805-42cb-aebc-250f399c7ee2','Skolla Education','2026-09-01 04:14:57.293','RESPONSIBLE'),('741b6281-6d90-464d-aa17-8299af8fd152','42342df2-0e9f-4c93-95b3-8970c52301c9','b99f45aa-d805-42cb-aebc-250f399c7ee2','Skolla Education','2026-09-01 04:14:57.255','RESPONSIBLE'),('749016af-e4b3-4c91-b59e-d0b6de7516fd','0200e827-ba69-4be0-8f83-520d2e0ca593','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.104','RESPONSIBLE'),('78b07112-ece6-49af-ae7d-c9f955b258b7','dfe9a1f9-11ab-47da-97ef-d6797bd2979d','34842edc-86c6-442e-9361-3d55cb7f93ce','Skolla Education','2026-09-01 04:14:57.134','ACCOUNTABLE'),('78f963f0-4ab5-441c-b86a-3cb87b33c035','512c51dc-2027-4692-a894-a28bd9de4fb0','b99f45aa-d805-42cb-aebc-250f399c7ee2','Skolla Education','2026-09-01 04:14:57.272','RESPONSIBLE'),('81d0d418-c555-4844-a551-04fd69d5c87d','0e885b60-50b4-46bf-bdde-d1fa8ca1dba8','ce19f55c-c7c2-4b70-9118-cfd70df69346','Skolla Education','2026-09-01 04:14:57.064','ACCOUNTABLE'),('832ba0dc-49af-4a42-be8f-1dda73e6316f','b241e83b-e610-4212-85f2-6ad94d7196ee','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.176','RESPONSIBLE'),('843d581d-e7df-4275-90c3-1e3484947a5e','dfe9a1f9-11ab-47da-97ef-d6797bd2979d','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.132','RESPONSIBLE'),('86b5f696-8c96-4362-aaf5-6803f259880b','4bf99043-cd3f-41a9-a437-677aadb6e668','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.154','RESPONSIBLE'),('8ca40e57-d725-4bf6-8d9d-69174e47637a','1546ea4d-991b-4972-a110-4e3fcf451893','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Skolla Education','2026-09-01 04:14:57.035','RESPONSIBLE'),('914376c4-6b66-4377-b25b-62efd278ed64','a9970520-1f2d-403e-b780-3e55eee2bc91','ce19f55c-c7c2-4b70-9118-cfd70df69346','Skolla Education','2026-09-01 04:14:57.058','ACCOUNTABLE'),('92d375d9-2b09-4b50-8b6c-efc14fb92150','d276f3f7-1e78-45de-9eb0-60e20dd19062','d97d3e36-d563-4239-8a4c-5a3b5d9c3e2b','Skolla Education','2026-09-01 04:14:57.120','ACCOUNTABLE'),('9ad4d235-66b5-4e34-8a28-8ce84cb39ded','276cf569-a148-4312-be8d-e75cc215ca2f','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Skolla Education','2026-09-01 04:14:57.030','RESPONSIBLE'),('9e66369a-bda8-455f-9882-1a71a29810d5','dc0764d4-1bb6-413d-826e-d0cc4001c562','b99f45aa-d805-42cb-aebc-250f399c7ee2','Skolla Education','2026-09-01 04:14:57.325','ACCOUNTABLE'),('a3eb7690-ae4d-4576-bfcb-b479030905be','eb9b574c-14fd-477e-bf6c-1dc3e9324fad','11f1dfcf-f913-460d-a9ce-6aa329ddfa9a','Skolla Education','2026-09-01 04:14:57.217','ACCOUNTABLE'),('a66c4055-7d2b-4399-874c-0aa26670b873','86976462-0a32-43b0-b2c7-549b7bf91ff6','b99f45aa-d805-42cb-aebc-250f399c7ee2','Skolla Education','2026-09-01 04:14:57.282','RESPONSIBLE'),('ae1cb05d-3946-4b7a-ac67-af02f3568088','7231d0d8-ffc5-45f0-ab79-530c9fa347e9','3364e110-c458-486f-bb37-a8af31a8424a','Skolla Education','2026-09-01 04:14:57.043','ACCOUNTABLE'),('aeb9d9e9-0e73-40b6-9f7d-29fa45882067','a6a6bd94-3441-49f5-ac29-64d25b283959','8633c0be-5d11-4ade-9b23-647eab37e0e8','Skolla Education','2026-09-01 04:14:57.005','ACCOUNTABLE'),('aefb3ae3-464b-4beb-ab3c-118365a1dda7','86976462-0a32-43b0-b2c7-549b7bf91ff6','aa41a0fb-58de-4a7c-8ef0-1c4abdf6eb05','Skolla Education','2026-09-01 04:14:57.285','ACCOUNTABLE'),('b752600a-4390-44f9-bbb3-a06e29a3d164','ad5cc9a7-a96a-4562-8391-20349752bdf9','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.242','RESPONSIBLE'),('c07552b5-8c6a-4d7a-8c54-edab0e53f979','96d5aedd-2f9f-403e-99b7-1b6091889fda','3364e110-c458-486f-bb37-a8af31a8424a','Skolla Education','2026-09-01 04:14:57.051','ACCOUNTABLE'),('c46f70fb-22b9-47ab-9d7a-2e792543e5ce','512c51dc-2027-4692-a894-a28bd9de4fb0','aa41a0fb-58de-4a7c-8ef0-1c4abdf6eb05','Skolla Education','2026-09-01 04:14:57.275','ACCOUNTABLE'),('c60640a8-305e-460d-a608-7f7f5bcf6047','a42b8adc-d1c6-4b4e-a057-1a70d2f3c376','34842edc-86c6-442e-9361-3d55cb7f93ce','Skolla Education','2026-09-01 04:14:57.226','ACCOUNTABLE'),('ca648e9b-32f2-4623-87e6-01e388424f23','881b6ca3-8f33-48a0-8109-8ccf9fcb29b3','eb761b0c-033c-4736-adf8-cada5bc48225','Skolla Education','2026-09-01 04:14:57.099','ACCOUNTABLE'),('caa3bc43-290d-48d8-804d-5787b15e709d','eb9b574c-14fd-477e-bf6c-1dc3e9324fad','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.215','RESPONSIBLE'),('cdbdadc0-f3cd-46c2-bb20-b745e3a3be50','b4207cda-bd7b-4c05-b01a-b146295a3c95','eb761b0c-033c-4736-adf8-cada5bc48225','Skolla Education','2026-09-01 04:14:57.079','ACCOUNTABLE'),('ceee860c-94f4-48c4-93ee-4f98b97bf94c','d276f3f7-1e78-45de-9eb0-60e20dd19062','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.118','RESPONSIBLE'),('d2663ebc-875f-491b-8eea-9ee8a88c5d7d','4c66e0ab-b764-4edb-ae72-e86d4b1d4933','bc98a7e3-8f39-42ee-9dd7-65497507c42d','Skolla Education','2026-09-01 04:14:57.171','ACCOUNTABLE'),('d2674430-24c9-4364-92be-6e82c2e8e73b','8223f643-6e09-4bd5-b1ce-0f9c3de91f76','d97d3e36-d563-4239-8a4c-5a3b5d9c3e2b','Skolla Education','2026-09-01 04:14:57.127','ACCOUNTABLE'),('dde5b338-ced5-4177-b7a1-7470d7f463d2','7b3ab16d-d7ed-4a88-8526-ec0308854bf6','8633c0be-5d11-4ade-9b23-647eab37e0e8','Skolla Education','2026-09-01 04:14:57.020','ACCOUNTABLE'),('de2889a6-7d36-4f3f-99d9-7fde2727207b','b241e83b-e610-4212-85f2-6ad94d7196ee','bc98a7e3-8f39-42ee-9dd7-65497507c42d','Skolla Education','2026-09-01 04:14:57.178','ACCOUNTABLE'),('df0782bf-134f-4f22-8a53-d03b033ebc2a','cd4a4be8-3edb-4fcd-93a3-a024ffff6010','ce19f55c-c7c2-4b70-9118-cfd70df69346','Skolla Education','2026-09-01 04:14:57.071','ACCOUNTABLE'),('e1612ac0-9d42-406d-8a6a-7c43fb11c1f2','a6a6bd94-3441-49f5-ac29-64d25b283959','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Skolla Education','2026-09-01 04:14:57.000','RESPONSIBLE'),('e50e346c-938f-4ad5-8d4f-1070f05aa86e','d80b5d5f-e8d2-47fa-8784-03c1b7063cf1','eb761b0c-033c-4736-adf8-cada5bc48225','Skolla Education','2026-09-01 04:14:57.086','ACCOUNTABLE'),('e5c0b60c-38d0-4265-8a77-44a40cb6970d','d80b5d5f-e8d2-47fa-8784-03c1b7063cf1','b99f45aa-d805-42cb-aebc-250f399c7ee2','Skolla Education','2026-09-01 04:14:57.084','RESPONSIBLE'),('e600a4d6-b072-4d6f-a333-c64f387c0b63','8fd4751a-bba9-4cbe-9740-121fbe828ebe','11f1dfcf-f913-460d-a9ce-6aa329ddfa9a','Skolla Education','2026-09-01 04:14:57.192','ACCOUNTABLE'),('e87d258d-d425-4515-bac1-b85aa774645a','4c66e0ab-b764-4edb-ae72-e86d4b1d4933','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.169','RESPONSIBLE'),('e953a867-173c-4a87-95cf-c0c0b0d6330b','a42b8adc-d1c6-4b4e-a057-1a70d2f3c376','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.224','RESPONSIBLE'),('eb0cb94c-cd3e-461e-85b8-7c1767e833f9','96d5aedd-2f9f-403e-99b7-1b6091889fda','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Skolla Education','2026-09-01 04:14:57.049','RESPONSIBLE'),('eb8cce90-98d9-4e18-8c06-41ba3b27b633','ca88db17-94d2-458a-9779-6eb6f25c76bc','b99f45aa-d805-42cb-aebc-250f399c7ee2','Skolla Education','2026-09-01 04:14:57.090','RESPONSIBLE'),('eea6d751-512c-4ebf-93d5-5884ef2deb35','115e7559-a0cf-4fd3-907b-1e900da682fc','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.183','RESPONSIBLE'),('efa10b41-4d78-449a-b4b7-177b881cb4e5','ac17f280-c5c8-4326-aa44-e36683fa989f','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.162','RESPONSIBLE'),('f251685a-72e8-4e98-b0c5-7549e9f1a3a3','cd4a4be8-3edb-4fcd-93a3-a024ffff6010','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Skolla Education','2026-09-01 04:14:57.069','RESPONSIBLE'),('f2b104e4-98e3-4e4c-9471-22133c603d52','a3785c1d-4ae4-415b-bd45-b2c9e08b5553','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Skolla Education','2026-09-01 04:14:57.012','RESPONSIBLE'),('f8c66187-ccfe-4c48-b0e7-1d42fd5701bf','0c38b59a-51d1-44b5-b108-7b5c498c812c','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.111','RESPONSIBLE'),('f8f6d611-5023-4eb4-b612-5bb0c3cdf41a','a1d1bf90-f65c-4886-b7bc-b2a6185e8afc','3e3d3129-57d4-4b44-bb74-124025cc39c7','Skolla Education','2026-09-01 04:14:57.206','RESPONSIBLE'),('fed31c6a-524c-44e4-9d73-b8fb34272e14','136b2fde-abed-424a-b68e-2a820522c65c','bc98a7e3-8f39-42ee-9dd7-65497507c42d','Skolla Education','2026-09-01 04:14:57.142','ACCOUNTABLE');
/*!40000 ALTER TABLE `KrAssignment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `KrDepartment`
--

DROP TABLE IF EXISTS `KrDepartment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `KrDepartment` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `keyResultId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `KrDepartment_keyResultId_department_key` (`keyResultId`,`department`),
  KEY `KrDepartment_keyResultId_idx` (`keyResultId`),
  CONSTRAINT `KrDepartment_keyResultId_fkey` FOREIGN KEY (`keyResultId`) REFERENCES `KeyResult` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `KrDepartment`
--

LOCK TABLES `KrDepartment` WRITE;
/*!40000 ALTER TABLE `KrDepartment` DISABLE KEYS */;
INSERT INTO `KrDepartment` VALUES ('02542300-91d5-4176-a0e8-5c01ceb5a7c3','b241e83b-e610-4212-85f2-6ad94d7196ee','TECHDEV','2026-09-01 04:14:57.180'),('03055f70-e9c1-4d35-99c3-1be533626005','ac17f280-c5c8-4326-aa44-e36683fa989f','TECHDEV','2026-09-01 04:14:57.165'),('0600405f-ada2-4501-b815-cb82337e9704','42342df2-0e9f-4c93-95b3-8970c52301c9','SSC','2026-09-01 04:14:57.259'),('078e0982-f153-4932-8bcd-c557f0c98e3c','71eb8414-2003-4c28-93e0-c1493311c3a2','TECHDEV','2026-09-01 04:14:57.150'),('0e9118be-3eb7-4841-9114-7c02188e8a8f','96d5aedd-2f9f-403e-99b7-1b6091889fda','B2S','2026-09-01 04:14:57.053'),('0ed69541-c549-46b4-be98-bccd57f245db','eb9b574c-14fd-477e-bf6c-1dc3e9324fad','TECHOPS','2026-09-01 04:14:57.220'),('2cd79c27-4fd6-4c41-92a1-7e27e1a12bc1','cd4a4be8-3edb-4fcd-93a3-a024ffff6010','B2B_EXPANSION','2026-09-01 04:14:57.073'),('2d4ae584-111d-4d03-bd94-e88b5a832a46','ca88db17-94d2-458a-9779-6eb6f25c76bc','FINANCE','2026-09-01 04:14:57.094'),('302ba01b-11d7-4050-9f0c-75b999335200','512c51dc-2027-4692-a894-a28bd9de4fb0','SSC','2026-09-01 04:14:57.277'),('3579090e-0c45-4918-b2fa-d559bcbfc751','881b6ca3-8f33-48a0-8109-8ccf9fcb29b3','FINANCE','2026-09-01 04:14:57.101'),('422b90f8-af7c-4371-8c55-eaad9ab69b65','4c66e0ab-b764-4edb-ae72-e86d4b1d4933','TECHDEV','2026-09-01 04:14:57.172'),('4ad4f64d-49c7-4ff8-b73d-f92b045858ee','115e7559-a0cf-4fd3-907b-1e900da682fc','TECHDEV','2026-09-01 04:14:57.187'),('4f07f9ff-79c9-4162-a8bc-3e803b00cc28','7231d0d8-ffc5-45f0-ab79-530c9fa347e9','B2S','2026-09-01 04:14:57.045'),('51e2dace-e613-40da-86d2-83aeb830fd0f','62057c20-7e2a-47f3-b754-dba09caaa0ad','EDUCATION','2026-09-01 04:14:57.236'),('6303577e-e8c7-45d4-b11b-8f1ef2085afe','0200e827-ba69-4be0-8f83-520d2e0ca593','SERVICE_ACCOUNT','2026-09-01 04:14:57.108'),('739b18d2-790c-4df9-809e-64055d49f483','1546ea4d-991b-4972-a110-4e3fcf451893','B2S','2026-09-01 04:14:57.038'),('7461bc8c-7c33-49e7-932f-a7dce11654b3','a9970520-1f2d-403e-b780-3e55eee2bc91','B2B_EXPANSION','2026-09-01 04:14:57.060'),('7ced3680-67cc-4c25-bf41-966077622b3d','b4207cda-bd7b-4c05-b01a-b146295a3c95','FINANCE','2026-09-01 04:14:57.081'),('8c56e107-547a-4ff2-9c7d-7e1f03d12a42','a1d1bf90-f65c-4886-b7bc-b2a6185e8afc','TECHOPS','2026-09-01 04:14:57.211'),('8da14829-1241-42f6-8d6c-7de46c3e0b2d','86976462-0a32-43b0-b2c7-549b7bf91ff6','SSC','2026-09-01 04:14:57.289'),('9231dbda-14b7-4b33-9ea5-987d9fef65fc','dfe9a1f9-11ab-47da-97ef-d6797bd2979d','EDUCATION','2026-09-01 04:14:57.136'),('94f673cd-091c-42a0-af14-cab32ab92209','276cf569-a148-4312-be8d-e75cc215ca2f','B2B_CORPORATION','2026-09-01 04:14:57.033'),('95f5ce0b-39f0-4da0-86c8-dd17d39727fc','d80b5d5f-e8d2-47fa-8784-03c1b7063cf1','FINANCE','2026-09-01 04:14:57.087'),('99f6973e-4bb7-41d1-b6bc-fe16c9ac56e7','df8aa285-751d-4a8a-b966-931c6395823c','SSC','2026-09-01 04:14:57.298'),('a520dc6f-188b-419e-adee-81096b9cfbba','dd85d72d-9b11-454e-92a1-0f0167ea4a3e','SSC','2026-09-01 04:14:57.308'),('ad70fb17-e420-4e38-9752-c798e20ed1b8','4bf99043-cd3f-41a9-a437-677aadb6e668','TECHDEV','2026-09-01 04:14:57.158'),('b39c4aee-003b-495a-8573-19b5970fe4b3','8fd4751a-bba9-4cbe-9740-121fbe828ebe','TECHOPS','2026-09-01 04:14:57.195'),('c07e5da5-bf7e-4e4f-958f-bd3e205d2157','0e885b60-50b4-46bf-bdde-d1fa8ca1dba8','B2B_EXPANSION','2026-09-01 04:14:57.066'),('c1f1ecfd-a692-401c-8603-92175aedbb9f','7ce32fef-414e-4699-b919-ab4eff9140ce','SSC','2026-09-01 04:14:57.320'),('c2f2fa85-0f17-445b-ae34-f5a566dc92e4','12d4a56c-675e-4620-8ac7-04f10cde4349','TECHOPS','2026-09-01 04:14:57.203'),('c6b3ba7a-0236-46bb-a745-198af23b8b44','8223f643-6e09-4bd5-b1ce-0f9c3de91f76','SERVICE_ACCOUNT','2026-09-01 04:14:57.129'),('c9043971-3730-40ec-bd19-9e9bd2f1a3c5','d276f3f7-1e78-45de-9eb0-60e20dd19062','SERVICE_ACCOUNT','2026-09-01 04:14:57.122'),('ccd16b3e-f99f-4383-beb0-5f69ec759930','136b2fde-abed-424a-b68e-2a820522c65c','TECHDEV','2026-09-01 04:14:57.143'),('d20caf2b-5cf6-486f-9f19-1782f02a49d3','ad5cc9a7-a96a-4562-8391-20349752bdf9','EDUCATION','2026-09-01 04:14:57.246'),('d33fc7d3-fcc5-48db-8cf5-80e8cabb86a1','0c38b59a-51d1-44b5-b108-7b5c498c812c','SERVICE_ACCOUNT','2026-09-01 04:14:57.115'),('e14d572a-80be-4ec3-80e6-00e33418684d','7b3ab16d-d7ed-4a88-8526-ec0308854bf6','B2C','2026-09-01 04:14:57.022'),('e2d81d2d-0c7b-43e1-b3bf-38876761926b','a42b8adc-d1c6-4b4e-a057-1a70d2f3c376','EDUCATION','2026-09-01 04:14:57.228'),('ed025c82-a1cd-4939-970a-c5d94ec43550','dc0764d4-1bb6-413d-826e-d0cc4001c562','SSC','2026-09-01 04:14:57.330'),('f736d5ea-45b3-441e-a59d-250d1ad22cd6','08ff7f52-89e4-4f40-b1c6-40b147930e31','SSC','2026-09-01 04:14:57.268'),('f85ecddc-6a60-4f9c-9cc1-33c0f3893c51','369172ce-766d-45c0-8b20-acff32879a3d','B2B_CORPORATION','2026-09-01 04:14:57.028'),('fbe4ce08-45c3-4d9e-bdc1-4ead9cd6fdad','a6a6bd94-3441-49f5-ac29-64d25b283959','B2C','2026-09-01 04:14:57.008'),('ff4b712b-9a4f-49b5-8233-7c472bcbecff','a3785c1d-4ae4-415b-bd45-b2c9e08b5553','B2C','2026-09-01 04:14:57.015');
/*!40000 ALTER TABLE `KrDepartment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `KrUpdate`
--

DROP TABLE IF EXISTS `KrUpdate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `KrUpdate` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `keyResultId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `oldValue` double NOT NULL,
  `newValue` double NOT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `KrUpdate_keyResultId_updatedAt_idx` (`keyResultId`,`updatedAt`),
  CONSTRAINT `KrUpdate_keyResultId_fkey` FOREIGN KEY (`keyResultId`) REFERENCES `KeyResult` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `KrUpdate`
--

LOCK TABLES `KrUpdate` WRITE;
/*!40000 ALTER TABLE `KrUpdate` DISABLE KEYS */;
/*!40000 ALTER TABLE `KrUpdate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Notification`
--

DROP TABLE IF EXISTS `Notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notification` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipientId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `link` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Notification_recipientId_isRead_idx` (`recipientId`,`isRead`),
  KEY `Notification_recipientId_createdAt_idx` (`recipientId`,`createdAt`),
  CONSTRAINT `Notification_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notification`
--

LOCK TABLES `Notification` WRITE;
/*!40000 ALTER TABLE `Notification` DISABLE KEYS */;
INSERT INTO `Notification` VALUES ('029de0c5-e702-434f-a2ce-030c2a23a90e','96fdb6c2-15a8-4705-9f08-0586a36d4f91','TASK_UPDATE_APPROVED','Update Task Disetujui','Update Task Anda untuk \"Capai Rp1000000000\" telah disetujui','/team/my-work',0,'2026-09-01 11:02:29.188'),('0304fc44-22c5-4904-ae78-7335ad805d0a','999eb8f0-6638-49c0-8935-63fe7f0dba30','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Capaian Rp1000000000\"','/team/my-work',0,'2026-09-01 09:47:39.538'),('06958318-22a5-43b4-95e8-715a43d2f2f6','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','Initiative \"Capai Rp150.000.000\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 06:53:34.440'),('06a7295b-fd84-496f-988b-3c73114dc736','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_UPDATE_APPROVED','Update Task Disetujui','Update Task Anda untuk \"Task 1\" telah disetujui','/team/my-work',1,'2026-09-02 03:28:39.479'),('08e65dfa-1e5c-4ce3-a70d-3fdee61c915b','96fdb6c2-15a8-4705-9f08-0586a36d4f91','TASK_UPDATE_APPROVED','Update Task Disetujui','Update Task Anda untuk \"Capai Rp1000000000\" telah disetujui','/team/my-work',1,'2026-09-01 10:29:34.524'),('09afbca5-06be-4efc-85f8-78716b688576','3e3d3129-57d4-4b44-bb74-124025cc39c7','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','Initiative \"Inisiatif 1\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 23:34:08.595'),('0a18ae83-06e4-4bb8-bd6c-c90caf0a43f6','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_UPDATE_PENDING','Update Stage Task: DONE','Task \"Task 1\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-02 02:19:33.187'),('0a4a4367-cd2d-4f9e-a7c3-195b1c3188c6','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: IN_PROGRESS','Task \"Capai 16\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',0,'2026-09-04 03:29:46.733'),('0eaf53d7-455b-4d1a-a187-31b58c139a51','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_UPDATE_PENDING','Update Stage Task: IN_PROGRESS','Task \"Task 1\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',1,'2026-09-02 02:19:37.136'),('162370c1-e42c-4175-a21c-ff52c8a7d740','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: DONE','Task \"Visit Sekolah Sebulan\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-04 03:07:28.851'),('1ab73001-837f-4a1b-861d-e92e1801456a','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','Initiative \"Organik Leads 40\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 06:36:36.444'),('1d6e3469-cac8-46da-85a6-cccf20144b0e','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: DONE','Task \"Capai 16\" dipindahkan ke stage DONE oleh anggota tim','/approvals',0,'2026-09-04 03:31:52.571'),('1f2a950f-8f73-42d2-9af2-94d509563b6d','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Leads Organik\"','/team/my-work',1,'2026-09-01 03:56:37.207'),('1fe66275-dc23-4601-8366-afe10e363723','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: DONE','Task \"Capai Rp1.000.000.000\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-01 14:13:17.978'),('230f3e7f-1ad7-47e9-90c6-d63734875cb7','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_UPDATE_APPROVED','Update Task Disetujui ✅','Update Task Anda untuk \"Content Socmed\" telah disetujui','/team/my-work',1,'2026-09-01 04:58:33.850'),('25ad7327-fa3f-4614-8e21-e0d6d1b08226','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_UPDATE_APPROVED','Update Task Disetujui ✅','Update Task Anda untuk \"Leads Organik\" telah disetujui','/team/my-work',1,'2026-09-01 04:08:56.456'),('2d006548-797a-4723-af47-aebc931588cc','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: IN_PROGRESS','Task \"Visit Sekolah Sebulan\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',1,'2026-09-01 14:28:06.359'),('2e294952-8985-4b4c-b09e-795254c6bd9b','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Ada Update Task Menunggu Persetujuan','Task \"Visit Sekolah Sebulan\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 14:29:33.046'),('2ebc5448-97d5-4332-b023-9a602b042c0b','96fdb6c2-15a8-4705-9f08-0586a36d4f91','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Capaian 1000000000\"','/team/my-work',1,'2026-09-01 09:47:10.354'),('30427df7-2a5d-4b9c-be61-e5ce7b986821','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Ada Update Task Menunggu Persetujuan','Task \"Capai 16\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 03:30:48.546'),('394140bd-d942-4300-acec-19a60124b7d7','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: DONE','Task \"Visit Sekolah Sebulan\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-04 03:07:05.567'),('3a5f259d-3ad5-4510-8a86-1f6c49f31e87','8633c0be-5d11-4ade-9b23-647eab37e0e8','TASK_UPDATE_PENDING','Ada Update Task Menunggu Persetujuan','Task \"Task 1\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 06:35:01.633'),('3ea00706-14fd-4213-91e3-72253a7f0eda','999eb8f0-6638-49c0-8935-63fe7f0dba30','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Capai Rp1000000000\"','/team/my-work',0,'2026-09-01 09:52:52.819'),('3fd260a9-2950-4ece-9804-dad1d2165d71','8633c0be-5d11-4ade-9b23-647eab37e0e8','TASK_UPDATE_PENDING','Update Stage Task: DONE','Task \"Platform Paid 400\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-03 05:44:13.509'),('44e1f161-b33a-439a-93cc-bdb01416fde5','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Ada Update Task Menunggu Persetujuan','Task \"Capai Rp1000000000\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 10:28:42.947'),('4aac5174-bbc4-4cd4-9222-824a60b4269a','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: IN_PROGRESS','Task \"Capai 16\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',0,'2026-09-04 03:29:34.271'),('4ed1990f-fbe3-463e-a198-6ff8597e3fa4','b8bb523e-2481-4b14-8e20-4abe095f6cc0','TASK_UPDATE_APPROVED','Update Task Disetujui','Update Task Anda untuk \"Visit Sekolah Sebulan\" telah disetujui','/team/my-work',1,'2026-09-01 14:29:44.639'),('531a45b1-c25d-4d7f-9b82-013341d2adaf','8633c0be-5d11-4ade-9b23-647eab37e0e8','TASK_UPDATE_PENDING','Update Stage Task: IN_PROGRESS','Task \"Platform Paid 400\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',1,'2026-09-03 05:44:22.290'),('5904eb80-c58a-4f12-a042-87f0aa85ed0c','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Ada Update Task Menunggu Persetujuan','Task \"Capai Rp1000000000\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 11:02:15.032'),('5ef42bac-10b0-4f23-bc5b-993fefbed076','8633c0be-5d11-4ade-9b23-647eab37e0e8','TASK_UPDATE_PENDING','Ada Update Task Menunggu Persetujuan','Task \"Content Socmed\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 04:56:41.738'),('63591751-9f16-49cb-bf1d-857b8494ade8','999eb8f0-6638-49c0-8935-63fe7f0dba30','TASK_UPDATE_APPROVED','Update Task Disetujui','Update Task Anda untuk \"Capai 16\" telah disetujui','/team/my-work',0,'2026-09-04 03:31:17.190'),('6463f5a1-f1fd-4d2d-9993-b24b5bc5344b','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: IN_PROGRESS','Task \"Visit Sekolah Sebulan\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',1,'2026-09-01 14:27:40.857'),('6b8a35e5-a461-4924-a8f0-cdb908f4bef0','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Task 1\"','/team/my-work',0,'2026-09-03 07:37:54.898'),('6f4bde8a-c394-4e24-9b45-64c04543d126','96fdb6c2-15a8-4705-9f08-0586a36d4f91','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Capai Rp1000000000\"','/team/my-work',1,'2026-09-01 09:52:35.120'),('70451176-1592-4607-808c-d251df52c2e5','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Ada Update Task Menunggu Persetujuan','Task \"Capai 16\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 03:32:44.334'),('725333be-0115-41e8-a840-e2d485697795','b8bb523e-2481-4b14-8e20-4abe095f6cc0','TASK_UPDATE_APPROVED','Update Task Disetujui','Update Task Anda untuk \"Visit Sekolah Sebulan\" telah disetujui','/team/my-work',1,'2026-09-04 02:45:00.145'),('74b7f95d-504b-41c6-8093-c8e779063873','999eb8f0-6638-49c0-8935-63fe7f0dba30','TASK_UPDATE_APPROVED','Update Task Disetujui','Update Task Anda untuk \"Capai 16\" telah disetujui','/team/my-work',0,'2026-09-04 03:32:58.397'),('75273a4e-03c4-4bff-ba9a-eeb9d334bf4b','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: IN_PROGRESS','Task \"Capai 16\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',0,'2026-09-04 03:30:17.210'),('78f0fc77-3187-4968-b603-6c13da363a9c','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','Initiative \"Capai Rp150.000.000\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 06:53:27.922'),('7a77cac5-d621-4861-a07e-96faf5b04a7c','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','TASK_UPDATE_PENDING','Update Stage Inisiatif: DONE','Inisiatif \"Capaian September Rp5000000000\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-03 05:43:19.949'),('7c907a78-84cd-4290-ab95-69a7ac0263a4','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: DONE','Task \"Capai 16\" dipindahkan ke stage DONE oleh anggota tim','/approvals',0,'2026-09-04 03:29:32.171'),('8338e5ac-7c05-4e3f-adca-561bc21c3b28','8633c0be-5d11-4ade-9b23-647eab37e0e8','TASK_UPDATE_PENDING','Ada Update Task Menunggu Persetujuan','Task \"Leads Organik\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 04:08:04.263'),('836c3441-2868-4787-958f-d0abddcdb65e','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Ada Update Task Menunggu Persetujuan','Task \"Capai Rp1.000.000.000\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 14:02:00.994'),('83f0d4b9-3303-4164-aea3-faf0735f8130','b8bb523e-2481-4b14-8e20-4abe095f6cc0','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Capai Rp2000000000\"','/team/my-work',1,'2026-09-01 09:49:22.705'),('856f23d4-d2e3-48b6-afae-7962ca7fde62','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: DONE','Task \"Capai Rp1.000.000.000\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-01 14:26:24.265'),('880551f5-099c-4134-a18f-40de53b52f71','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: IN_PROGRESS','Task \"Visit Sekolah Sebulan\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',1,'2026-09-04 03:06:54.273'),('8eae41a6-bb17-4111-a0f3-832341059dca','3e3d3129-57d4-4b44-bb74-124025cc39c7','TASK_UPDATE_PENDING','Update Stage Inisiatif: DONE','Inisiatif \"Inisiatif 1\" dipindahkan ke stage DONE oleh anggota tim','/approvals',0,'2026-09-04 23:34:27.610'),('8f55eb03-069a-4de6-80b4-819dc4636af5','96fdb6c2-15a8-4705-9f08-0586a36d4f91','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Capai 16\"','/team/my-work',0,'2026-09-04 03:28:20.470'),('92c24b56-3c6f-4109-82bc-4aa8c0cca728','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_UPDATE_APPROVED','Update Task Disetujui ✅','Update Task Anda untuk \"Task 1\" telah disetujui','/team/my-work',1,'2026-09-01 08:07:47.490'),('92c5eca3-5806-4e5e-b741-839970d59b1b','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: DONE','Task \"Visit Sekolah Sebulan\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-01 14:28:00.682'),('9422a92a-cdad-4625-985c-483f1f92d35c','3e3d3129-57d4-4b44-bb74-124025cc39c7','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','Initiative \"Inisiatif 1\" memiliki update baru yang perlu Anda setujui','/approvals',0,'2026-09-04 23:34:35.931'),('967808fb-10cf-4e8c-8fc4-cc8d07e62502','b8bb523e-2481-4b14-8e20-4abe095f6cc0','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Capai Rp1000000000\"','/team/my-work',1,'2026-09-01 09:53:16.188'),('98a00cdb-c3df-458b-bf50-92ce5c0cbecb','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','Initiative \"Organik Leads 40\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 06:50:35.409'),('a9a980a3-ebf7-4112-ba53-e9f4ea11e6bf','8633c0be-5d11-4ade-9b23-647eab37e0e8','TASK_UPDATE_PENDING','Update Stage Task: DONE','Task \"Platform Paid 400\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-03 05:44:31.499'),('ab089a0e-0513-44d2-8fa3-f639555ec92e','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_UPDATE_APPROVED','Update Task Disetujui','Update Task Anda untuk \"Task 1\" telah disetujui','/team/my-work',1,'2026-09-02 03:23:00.456'),('ad5115f1-e124-46d7-ab41-464ede60b1c0','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: IN_PROGRESS','Task \"Capai 16\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',0,'2026-09-04 03:32:25.841'),('b1bf3691-fb52-4e7f-8f5b-93e55a47fb5a','8633c0be-5d11-4ade-9b23-647eab37e0e8','TASK_UPDATE_PENDING','Update Stage Task: IN_PROGRESS','Task \"Platform Paid 400\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',1,'2026-09-03 05:44:00.408'),('b49092f4-ac4d-4e13-a164-c10904105001','6b2781b6-c039-498d-baa0-5aa5d8839322','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Ads Meta\"','/team/my-work',0,'2026-09-01 04:36:33.408'),('b89d9504-de7e-4972-9509-c42bd88eecc5','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Content Socmed\"','/team/my-work',1,'2026-09-01 04:36:16.915'),('bac7410c-9258-4ca6-acbf-f3d4409dc525','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Ada Update Task Menunggu Persetujuan','Task \"Visit Sekolah Sebulan\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-04 02:44:20.222'),('bf08988f-8f5b-4333-a41c-fdb1e90dbb73','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_UPDATE_APPROVED','Update Task Disetujui ✅','Update Task Anda untuk \"Task 1\" telah disetujui','/team/my-work',1,'2026-09-01 06:43:16.378'),('ca0bdd11-b83e-4433-9bc0-094a5f720aee','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_UPDATE_APPROVED','Update Task Disetujui','Update Task Anda untuk \"Task 1\" telah disetujui','/team/my-work',0,'2026-09-03 05:47:13.402'),('cbcd4f6e-fff3-4552-b61c-acf315291687','b8bb523e-2481-4b14-8e20-4abe095f6cc0','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Capai Rp1.000.000.000\"','/team/my-work',1,'2026-09-01 14:01:04.786'),('cdea2287-50bc-4ee6-93d1-8288d24c4b9e','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: DONE','Task \"Capai 16\" dipindahkan ke stage DONE oleh anggota tim','/approvals',0,'2026-09-04 03:29:42.192'),('cf65806b-7ca1-4ef0-a1ed-1de169df6648','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: DONE','Task \"Capai 16\" dipindahkan ke stage DONE oleh anggota tim','/approvals',0,'2026-09-04 03:29:54.459'),('d1d033d0-3a33-471b-8215-37c6f92a5a4c','b8bb523e-2481-4b14-8e20-4abe095f6cc0','TASK_UPDATE_APPROVED','Update Task Disetujui','Update Task Anda untuk \"Capai Rp1.000.000.000\" telah disetujui','/team/my-work',1,'2026-09-01 14:02:29.220'),('d1fc3542-6b22-48f8-9e03-3f0f83145a08','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','Initiative \"Organik Leads 40\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 06:54:13.106'),('d33015fd-ffdc-47ae-bc82-c1d9363eaad7','b8bb523e-2481-4b14-8e20-4abe095f6cc0','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Visit Sekolah Sebulan\"','/team/my-work',1,'2026-09-01 14:27:29.425'),('d5903a9a-bc0e-47f7-90f8-03531630ea06','999eb8f0-6638-49c0-8935-63fe7f0dba30','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Capai 16\"','/team/my-work',0,'2026-09-04 03:28:59.294'),('d598665f-ceda-4079-8f5b-3f4f2e5458ab','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','Initiative \"Total Paid Leads 130\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 06:53:58.799'),('d777058a-0fc7-4b8c-9bcf-fb602766e5f3','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','Initiative \"Organik Leads 40\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 06:54:24.115'),('dbe01572-92c6-435b-8286-93f91d982a6f','b8bb523e-2481-4b14-8e20-4abe095f6cc0','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Capai Rp1000000000\"','/team/my-work',1,'2026-09-01 09:48:40.663'),('dbe365b5-b537-4953-b510-d6e466d47fa4','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Posting Sosmed Jumat\"','/team/my-work',1,'2026-09-01 05:01:09.419'),('e177b1e4-a9a9-46e8-b9b3-7bb0e520c86f','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: DONE','Task \"Visit Sekolah Sebulan\" dipindahkan ke stage DONE oleh anggota tim','/approvals',1,'2026-09-01 14:28:14.847'),('e5a00a33-755f-48f6-a739-d3e2635aaa8a','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','Initiative \"Total Paid Leads 130\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 06:53:54.692'),('edf72895-a322-40f3-8025-4721973573d8','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: IN_PROGRESS','Task \"Visit Sekolah Sebulan\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',1,'2026-09-04 03:07:17.250'),('ef0dcccc-6b85-496a-ac96-96a325e0afab','2957a03a-4083-44ef-80d4-898cddfea0e5','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Task 1\"','/team/my-work',1,'2026-09-01 06:34:31.841'),('f71a5f3a-8c35-453a-a86a-44f1b88adff5','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','INITIATIVE_UPDATE_PENDING','Ada Update Inisiatif Menunggu Persetujuan','Initiative \"Organik Leads 40\" memiliki update baru yang perlu Anda setujui','/approvals',1,'2026-09-01 06:54:47.759'),('f7b5d125-e68e-4feb-a544-8cd42e1415ba','9c999a04-3dc8-4e26-853e-fe828ae3fd06','TASK_ASSIGNED','Task Baru Ditugaskan','Anda mendapat assignment Task: \"Capai Rp1000000000\"','/team/my-work',0,'2026-09-01 09:54:04.736'),('fb976cb5-d448-46ac-a178-3a129f070eff','ce19f55c-c7c2-4b70-9118-cfd70df69346','TASK_UPDATE_PENDING','Update Stage Task: IN_PROGRESS','Task \"Capai 16\" dipindahkan ke stage IN_PROGRESS oleh anggota tim','/approvals',0,'2026-09-04 03:29:28.744');
/*!40000 ALTER TABLE `Notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Objective`
--

DROP TABLE IF EXISTS `Objective`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Objective` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ownerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Objective`
--

LOCK TABLES `Objective` WRITE;
/*!40000 ALTER TABLE `Objective` DISABLE KEYS */;
INSERT INTO `Objective` VALUES ('06bdd2a5-accd-44c4-a2cc-cb1b7c1695dd','Product Sucess Rate',NULL,'Q3-2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-08-28 04:09:57.349'),('150f5d92-610c-4bf5-811b-390656438ff4','Active User',NULL,'2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-09-01 03:13:23.399'),('1b89fe0c-62d4-4ed6-9ab5-139ace1d32d5','Company Performance Score',NULL,'Q3-2026','b99f45aa-d805-42cb-aebc-250f399c7ee2','2026-08-28 04:09:57.366'),('1fdc26e7-d5a8-4330-9191-ae9b665b50ec','CSAT Internal (Sales & SA)',NULL,'Q3-2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-08-28 04:09:57.357'),('300ac825-63e4-45dd-b9de-bba5d45c518d','Company\'s Talent Performance',NULL,'Q3-2026','b99f45aa-d805-42cb-aebc-250f399c7ee2','2026-08-28 04:09:57.364'),('30d6dfa0-a182-4dcd-8ff1-56841b125936','Nett Profit Margin',NULL,'2026','b99f45aa-d805-42cb-aebc-250f399c7ee2','2026-09-01 03:13:23.382'),('3fc55270-043e-4d02-ba04-95973444c895','Candangan Cash Ending (Ending Cash) in Month',NULL,'2026','b99f45aa-d805-42cb-aebc-250f399c7ee2','2026-09-01 03:13:23.385'),('46be98ce-ea04-46b1-a080-f1e3dfd9fc24','Sumber Data Tersedia Secara Real-Time',NULL,'Q3-2026','b99f45aa-d805-42cb-aebc-250f399c7ee2','2026-08-28 04:09:57.362'),('4c244321-5d68-4e42-a2ec-e9167eeb27b4','Product Sucess Rate',NULL,'2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-09-01 03:13:23.397'),('4c48a97f-e1a2-4c78-a900-a579828177ef','Error Rate',NULL,'Q3-2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-08-28 04:09:57.354'),('516fa3dc-6b6d-4f26-878f-b5480bff926b','Sumber Data Tersedia Secara Real-Time',NULL,'2026','b99f45aa-d805-42cb-aebc-250f399c7ee2','2026-09-01 03:13:23.407'),('62b585ff-048f-4a57-967d-025bd0941837','Company Performance Score',NULL,'2026','b99f45aa-d805-42cb-aebc-250f399c7ee2','2026-09-01 03:13:23.410'),('6cb61401-de2a-47cd-aacb-9932d00fad39','Total Revenue NETT',NULL,'2026','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','2026-09-01 03:13:23.371'),('6cb9edb6-9c16-4657-8c97-0965bf9555aa','Retention Rate',NULL,'Q3-2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-08-28 04:09:57.343'),('7152b683-7b54-4a7d-90db-dfe01312405b','Retention Rate',NULL,'2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-09-01 03:13:23.391'),('96d22c0f-2468-4104-9ccd-971748fb1a80','Engagement Rate',NULL,'Q3-2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-08-28 04:09:57.346'),('9ca2373a-38cd-40d4-bb26-ada27ffe559e','Nett Profit Margin',NULL,'Q3-2026','b99f45aa-d805-42cb-aebc-250f399c7ee2','2026-08-28 04:09:57.330'),('9d19405e-2ec5-4a94-9859-773fd0b98bad','CSAT External (Consumer & Customer)',NULL,'2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-09-01 03:13:23.405'),('9d8ee568-1378-4a04-bfed-3303cf8ab19d','Total Revenue NETT',NULL,'Q3-2026','0dbeb3e1-0410-46af-8802-fe12dfaaf55e','2026-08-28 04:09:57.319'),('bff4dc86-d15b-4a2e-8c4e-2d824563fa1e','CSAT External (Consumer & Customer)',NULL,'Q3-2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-08-28 04:09:57.359'),('c39b68cf-d522-49aa-a7d7-149c77c76e58','Engagement Rate',NULL,'2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-09-01 03:13:23.395'),('c5800391-5c09-4fd6-a310-8299de6c63d3','Active User',NULL,'Q3-2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-08-28 04:09:57.352'),('cbc435bc-f6f6-460d-8e29-e0930f8c4466','Error Rate',NULL,'2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-09-01 03:13:23.401'),('dd5808b8-b638-41d8-ae34-22d8771659b9','Candangan Cash Ending (Ending Cash) in Month',NULL,'Q3-2026','b99f45aa-d805-42cb-aebc-250f399c7ee2','2026-08-28 04:09:57.338'),('ee25e3d2-59e6-439d-be75-cc526b5acfd0','Company\'s Talent Performance',NULL,'2026','b99f45aa-d805-42cb-aebc-250f399c7ee2','2026-09-01 03:13:23.408'),('fee0862f-3985-4165-89bc-4da590e60bb2','CSAT Internal (Sales & SA)',NULL,'2026','3e3d3129-57d4-4b44-bb74-124025cc39c7','2026-09-01 03:13:23.402');
/*!40000 ALTER TABLE `Objective` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Task`
--

DROP TABLE IF EXISTS `Task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Task` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `initiativeId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetValue` double NOT NULL,
  `currentValue` double NOT NULL DEFAULT '0',
  `weight` double NOT NULL DEFAULT '1',
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assignedTeamMemberId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assignedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sprintMonth` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `startDate` datetime(3) DEFAULT NULL,
  `finishDate` datetime(3) DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ON_TRACK',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `documentationLink` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Task_initiativeId_fkey` (`initiativeId`),
  KEY `Task_assignedTeamMemberId_idx` (`assignedTeamMemberId`),
  KEY `Task_sprintMonth_idx` (`sprintMonth`),
  CONSTRAINT `Task_assignedTeamMemberId_fkey` FOREIGN KEY (`assignedTeamMemberId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Task_initiativeId_fkey` FOREIGN KEY (`initiativeId`) REFERENCES `Initiative` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Task`
--

LOCK TABLES `Task` WRITE;
/*!40000 ALTER TABLE `Task` DISABLE KEYS */;
INSERT INTO `Task` VALUES ('0a756e45-4a93-478c-9dec-de09adf0e641','690b60c7-82d6-4022-bc6a-34a9994badcf','Capai 2M',2000000000,1000000000,1,'Rp','b8bb523e-2481-4b14-8e20-4abe095f6cc0','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09','2026-09-01 00:00:00.000','2026-09-21 00:00:00.000','DONE','2026-09-01 14:06:38.766','2026-09-01 14:30:15.540',NULL),('376deb10-a56e-4acf-8a51-0d12867dd0c7','f8b33668-fdc4-4ce1-95a1-217ca1ea2253','Visit Sekolah Sebulan',60,30,1,'Sekolah','b8bb523e-2481-4b14-8e20-4abe095f6cc0','ce19f55c-c7c2-4b70-9118-cfd70df69346','2026-09',NULL,NULL,'DONE','2026-09-01 14:27:29.412','2026-09-04 03:07:28.825',NULL),('534ecc00-0791-4f25-b604-6071bc2c2d9f','c304e85f-b574-4227-bf28-af9f651adcd2','Capai 16',16,0,1,'Deal Kerjasama','96fdb6c2-15a8-4705-9f08-0586a36d4f91','ce19f55c-c7c2-4b70-9118-cfd70df69346','2026-09',NULL,NULL,'ON_TRACK','2026-09-04 03:28:20.457','2026-09-04 03:28:20.457',NULL),('580ce738-2b6f-42a8-a4c9-d081190faf11','ef36d407-db4e-40e9-8701-a85a2697e8db','Task 1',10,1,1,'Task','2957a03a-4083-44ef-80d4-898cddfea0e5','8633c0be-5d11-4ade-9b23-647eab37e0e8','2026-09','2026-09-03 00:00:00.000','2026-09-21 00:00:00.000','DONE','2026-09-03 07:37:54.884','2026-09-03 07:38:09.667',NULL),('b0ed0759-b44f-4459-9a5d-086a68bba0b3','c304e85f-b574-4227-bf28-af9f651adcd2','Capai 16',16,10,1,'Deal Kerjasama','999eb8f0-6638-49c0-8935-63fe7f0dba30','ce19f55c-c7c2-4b70-9118-cfd70df69346','2026-09',NULL,NULL,'ON_TRACK','2026-09-04 03:28:59.282','2026-09-04 03:32:58.373',NULL),('f8e03822-2ff9-4840-9aca-c1c6d2bdb039','518f3178-d9e3-49de-8f01-fd71b641d1e9','Capai Rp1.000.000.000',1000000000,500000000,1,'Rp','b8bb523e-2481-4b14-8e20-4abe095f6cc0','ce19f55c-c7c2-4b70-9118-cfd70df69346','2026-09',NULL,NULL,'DONE','2026-09-01 14:01:04.770','2026-09-01 14:26:24.221',NULL);
/*!40000 ALTER TABLE `Task` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TaskAssignment`
--

DROP TABLE IF EXISTS `TaskAssignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TaskAssignment` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `taskId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `TaskAssignment_taskId_userId_key` (`taskId`,`userId`),
  KEY `TaskAssignment_taskId_idx` (`taskId`),
  KEY `TaskAssignment_userId_idx` (`userId`),
  CONSTRAINT `TaskAssignment_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `TaskAssignment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TaskAssignment`
--

LOCK TABLES `TaskAssignment` WRITE;
/*!40000 ALTER TABLE `TaskAssignment` DISABLE KEYS */;
INSERT INTO `TaskAssignment` VALUES ('325d5f3e-d63e-4bc1-8492-4cc1e9954347','376deb10-a56e-4acf-8a51-0d12867dd0c7','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-01 14:27:29.412'),('3c2fd970-a984-4d6c-83c7-9e93ac7aab62','f8e03822-2ff9-4840-9aca-c1c6d2bdb039','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-01 14:01:04.770'),('43a55f74-a286-4b8b-aaf3-ffbee9a046b2','534ecc00-0791-4f25-b604-6071bc2c2d9f','96fdb6c2-15a8-4705-9f08-0586a36d4f91','2026-09-04 03:28:20.457'),('5a439ea6-bf93-417a-aa56-4d5e7dfb4315','b0ed0759-b44f-4459-9a5d-086a68bba0b3','999eb8f0-6638-49c0-8935-63fe7f0dba30','2026-09-04 03:28:59.282'),('eeaa162c-8dc5-4212-9d5e-09a40dbce3f1','580ce738-2b6f-42a8-a4c9-d081190faf11','2957a03a-4083-44ef-80d4-898cddfea0e5','2026-09-03 07:37:54.884'),('fbeaf3a4-8d84-4813-ab53-a61bb7553999','0a756e45-4a93-478c-9dec-de09adf0e641','b8bb523e-2481-4b14-8e20-4abe095f6cc0','2026-09-01 14:06:38.766');
/*!40000 ALTER TABLE `TaskAssignment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TaskKpi`
--

DROP TABLE IF EXISTS `TaskKpi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TaskKpi` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `taskId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kpiId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetValue` double NOT NULL,
  `currentValue` double NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `TaskKpi_taskId_kpiId_key` (`taskId`,`kpiId`),
  KEY `TaskKpi_taskId_idx` (`taskId`),
  KEY `TaskKpi_kpiId_idx` (`kpiId`),
  CONSTRAINT `TaskKpi_kpiId_fkey` FOREIGN KEY (`kpiId`) REFERENCES `Kpi` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `TaskKpi_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TaskKpi`
--

LOCK TABLES `TaskKpi` WRITE;
/*!40000 ALTER TABLE `TaskKpi` DISABLE KEYS */;
/*!40000 ALTER TABLE `TaskKpi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TaskUpdate`
--

DROP TABLE IF EXISTS `TaskUpdate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TaskUpdate` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `taskId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `oldValue` double NOT NULL,
  `newValue` double NOT NULL,
  `note` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submittedBy` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING_APPROVAL',
  `reviewedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewNote` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `link` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `TaskUpdate_taskId_createdAt_idx` (`taskId`,`createdAt`),
  CONSTRAINT `TaskUpdate_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TaskUpdate`
--

LOCK TABLES `TaskUpdate` WRITE;
/*!40000 ALTER TABLE `TaskUpdate` DISABLE KEYS */;
INSERT INTO `TaskUpdate` VALUES ('0b5da711-bf80-49ff-8d70-3e615ae7095c','f8e03822-2ff9-4840-9aca-c1c6d2bdb039',100000000,500000000,NULL,'b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED','ce19f55c-c7c2-4b70-9118-cfd70df69346',NULL,'2026-09-01 14:02:29.180','2026-09-01 14:02:00.983',NULL),('505dbafd-4ce5-437e-a0af-27c9f7524d9b','376deb10-a56e-4acf-8a51-0d12867dd0c7',6,47,NULL,'b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED','ce19f55c-c7c2-4b70-9118-cfd70df69346',NULL,'2026-09-01 14:29:44.603','2026-09-01 14:29:33.039',NULL),('5c8aa1ad-1db2-47a4-b7f5-d90978bd3b1a','b0ed0759-b44f-4459-9a5d-086a68bba0b3',8,10,NULL,'999eb8f0-6638-49c0-8935-63fe7f0dba30','APPROVED','ce19f55c-c7c2-4b70-9118-cfd70df69346',NULL,'2026-09-04 03:32:58.372','2026-09-04 03:32:44.327',NULL),('6b43768e-6650-4883-958a-ab1492f72bd8','b0ed0759-b44f-4459-9a5d-086a68bba0b3',1.6,8,NULL,'999eb8f0-6638-49c0-8935-63fe7f0dba30','APPROVED','ce19f55c-c7c2-4b70-9118-cfd70df69346',NULL,'2026-09-04 03:31:17.155','2026-09-04 03:30:48.534',NULL),('c488b451-6a00-42c1-af33-941b1016142c','376deb10-a56e-4acf-8a51-0d12867dd0c7',47,80,NULL,'b8bb523e-2481-4b14-8e20-4abe095f6cc0','APPROVED','ce19f55c-c7c2-4b70-9118-cfd70df69346',NULL,'2026-09-04 02:45:00.101','2026-09-04 02:44:20.213',NULL);
/*!40000 ALTER TABLE `TaskUpdate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Team`
--

DROP TABLE IF EXISTS `Team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Team` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `managerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `leaderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Team_leaderId_fkey` (`leaderId`),
  CONSTRAINT `Team_leaderId_fkey` FOREIGN KEY (`leaderId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Team`
--

LOCK TABLES `Team` WRITE;
/*!40000 ALTER TABLE `Team` DISABLE KEYS */;
INSERT INTO `Team` VALUES ('201b58b6-e1e4-44d3-b4e7-3dd0139e2636','Business to School (B2S)',NULL,NULL,'B2S'),('3dc8d8eb-e071-4cc3-8131-0336caebe91a','Service & Account',NULL,NULL,'SERVICE_ACCOUNT'),('5ad10fff-3bfb-400f-88e1-e9a387743324','B2C Consumer',NULL,NULL,'B2C'),('5ad31b20-512f-4d76-84e9-3885e3c3b17a','Product & Service',NULL,NULL,'PRODUCT_SERVICE'),('602ee7f5-0e5f-4390-a0d3-c111c5651807','Tech Development',NULL,NULL,'TECHDEV'),('7b4be7ef-1246-4455-9bfd-da8530e9fae9','Tech Operations',NULL,NULL,'TECHOPS'),('8bf59bc1-a3c1-4e01-8e11-8e4cd184f30b','Product & Tech','cd0f40e8-784b-41e8-b3a2-f36170c0bfda',NULL,NULL),('a623fa11-d5cb-46a7-b2a8-a6885cfa8238','Strategic',NULL,NULL,'STRATEGIC'),('ac158f67-1705-496a-b06e-28735dd77caa','Shared Service Center (SSC)',NULL,NULL,'SSC'),('b195b816-8168-48c3-9540-f37263f5c04f','B2B Expansion',NULL,NULL,'B2B_EXPANSION'),('b853dc12-26d5-4c65-b536-7d7182983f42','Data & Analytics',NULL,NULL,'DATA'),('c22e7778-49e0-47dd-adfc-a96e23c4a037','Education & Academic',NULL,NULL,'EDUCATION'),('c6bade49-4508-438a-9dff-baa74d1c6398','Product & Tech','8c35244d-697c-4d57-be5c-23c0a2e5001d',NULL,NULL),('cad67837-c913-41e1-8c11-bb4798068118','Finance & Accounting',NULL,NULL,'FINANCE'),('ced65713-6872-4f57-ac6b-29360de59dbe','People Operations (HR)',NULL,NULL,'HR'),('e9395743-c354-43b4-98f2-2287ea12e07d','B2B Corporation',NULL,NULL,'B2B_CORPORATION'),('e97d2095-0df6-46da-9881-c79df333acb5','Business Development',NULL,NULL,'BUSINESS'),('fc9f8239-76c7-475a-94be-390f63a42652','Creative & Design',NULL,NULL,'DESIGN');
/*!40000 ALTER TABLE `Team` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TEAM',
  `department` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teamId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_teamId_fkey` (`teamId`),
  CONSTRAINT `User_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES ('0678f895-1285-48c4-9a7d-eff9b0c61fab','Diva Zahraisya Putri Utami','tami@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','TECHDEV','UI/UX Designer','602ee7f5-0e5f-4390-a0d3-c111c5651807','2026-08-28 04:06:49.013'),('095b3dbd-e7d9-4ba5-841a-c99d6e68bce2','Febrian Indra Rukmana','febrian@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','EDUCATION','Try Out Specialist','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-28 04:06:49.077'),('0dbeb3e1-0410-46af-8802-fe12dfaaf55e','Muhammad Akbar Buana Tafsili','akbar@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','MANAGER',NULL,'Chief Business Officer','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-28 04:06:49.028'),('11f1dfcf-f913-460d-a9ce-6aa329ddfa9a','Dwiva Yulian Edfi','dwiva@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','LEADER','TECHOPS','TechOps Lead','7b4be7ef-1246-4455-9bfd-da8530e9fae9','2026-08-28 04:06:49.015'),('17703076-fc99-4c28-bea5-f33496dd36b5','Skolla Education','admin@skolla.education','$2b$10$T7y/X2Q9ricqPgKJfuVv7uMAd4xkzJoHINVgRaAdI3Z0RatD8GKwW','ADMIN',NULL,NULL,NULL,'2026-08-28 02:54:14.472'),('1f30b44b-58d0-4181-af66-322f5255139e','Bintang Azzandriya W','bintang@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','SSC','Sales Admin','ac158f67-1705-496a-b06e-28735dd77caa','2026-08-28 04:06:49.004'),('1f969578-960e-45fa-bb33-ac4146af01f0','Oktaviani Winarso','via@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','EDUCATION','Education Matematika','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-28 04:06:49.052'),('1fb54bc8-c1af-4d57-887c-7cb54bf44e9d','Taufiq Nur Hidayah','taufiq@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','TECHOPS','TechOps Executive','7b4be7ef-1246-4455-9bfd-da8530e9fae9','2026-08-28 04:06:49.044'),('211cff85-46fa-41d8-8398-0422666a52cb','Made Jiagustini','jia@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2S','B2S Partnership Manager','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-28 04:06:49.062'),('225d75fe-0f11-44b8-988c-9613c1a4030b','Muhammad Muflih Gani','mugan@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2B_CORPORATION','Business & Legal Coordinator','e9395743-c354-43b4-98f2-2287ea12e07d','2026-08-28 04:06:49.031'),('2957a03a-4083-44ef-80d4-898cddfea0e5','Tamara Aulia Ramadhini','tamara@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2C','Campaign Lead','5ad10fff-3bfb-400f-88e1-e9a387743324','2026-08-28 04:06:49.041'),('3364e110-c458-486f-bb37-a8af31a8424a','Teuku Zhurry Ariyandi Putra','zhurry@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','LEADER','B2S','Head of Sales','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-28 04:06:49.046'),('34842edc-86c6-442e-9361-3d55cb7f93ce','Zukhrini Khalish Nasution','rini@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','LEADER','EDUCATION','Education Lead','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-28 04:06:49.053'),('3afc3751-86e0-4de1-a980-bc34c3207dc5','Alfyan Rajiv Attar','alfyan@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2S','B2S Partnership Manager','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-28 04:06:49.079'),('3e36eafd-be3b-4012-a09c-34ca9ac7d564','Aan Noviyanti','novi@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','SERVICE_ACCOUNT','Account Manager','3dc8d8eb-e071-4cc3-8131-0336caebe91a','2026-08-28 04:06:48.975'),('3e3d3129-57d4-4b44-bb74-124025cc39c7','Mohammad Rizki Adi Pradana','rizki@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','MANAGER',NULL,'Head of Operation','3dc8d8eb-e071-4cc3-8131-0336caebe91a','2026-08-28 04:06:49.025'),('44dd474d-fdb2-49bc-9891-84afe7425eae','Akhmad Mukhibun','akhmad@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','SERVICE_ACCOUNT','Junior Partnership Manager','3dc8d8eb-e071-4cc3-8131-0336caebe91a','2026-08-28 04:06:49.059'),('45fc463d-5062-4a94-b8e9-f6a6a45f83a8','Ridwan Maulana','iwan@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','EDUCATION','Education Bahasa Inggris','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-28 04:06:49.036'),('46d7eaf4-7619-4176-8439-b4457728b6a1','Alif Firman Ramdhani','aliffirman@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','TECHDEV','Mobile Developer','602ee7f5-0e5f-4390-a0d3-c111c5651807','2026-08-28 04:06:48.997'),('484f5dae-34c4-412a-b056-9101d4db0374','Gigin Ginanjar','gino@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','SERVICE_ACCOUNT','Communication After Sales','3dc8d8eb-e071-4cc3-8131-0336caebe91a','2026-08-28 04:06:49.081'),('50763fb0-d942-4259-b722-bea1e1238ac1','Andhika Prakasa','andhika@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','TECHDEV','Back End Developer','602ee7f5-0e5f-4390-a0d3-c111c5651807','2026-08-28 04:06:49.002'),('516a0fb0-a1d3-4d03-abd3-3cff0337b14d','Audia Ramadhan','audia@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2S','B2S Partnership Manager','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-28 04:06:49.069'),('5d2be576-dc04-4064-b7e1-d4abc68c3cec','Prisma Harsu Prasetiyo','prisma@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2S','B2S Partnership Manager','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-28 04:06:49.034'),('5e6315c2-181a-46d2-9e92-54738cd1bb88','Paramita Tri Yaningrum','mita@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','EDUCATION','Education Matematika','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-28 04:06:49.078'),('5f41108a-7b80-4223-ae01-8164a6589b80','Eka Nur Setianingsih','eka@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','EDUCATION','Education Bahasa Indonesia','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-28 04:06:49.016'),('66728eca-68dc-4ff1-ad88-587deed806dc','Fedri Ardianas','fedri@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2S','B2B Partnership Manager','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-28 04:06:49.018'),('6b2781b6-c039-498d-baa0-5aa5d8839322','Bob Bastian','bob@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2C','Marketing Lead','5ad10fff-3bfb-400f-88e1-e9a387743324','2026-08-28 04:06:49.006'),('6ec78525-6b83-47db-9977-8b40a9faa353','Abdul Majid Al Kholish','majid@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','EDUCATION','Live Class Specialist','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-28 04:06:49.075'),('77d869a5-2537-4927-85fd-dc7089965da2','Syifa Mahmudah','syifa@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','LEADER','B2B_CORPORATION','Program & Service Strategist','e9395743-c354-43b4-98f2-2287ea12e07d','2026-08-28 04:06:49.039'),('7f020d0c-13ce-41ea-a88d-0c2e1d27e318','Muhammad Fikri Rizal','fikri@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2S','B2S Partnership Manager','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-28 04:06:49.030'),('8633c0be-5d11-4ade-9b23-647eab37e0e8','Hervina Anjani Yulistika','vina@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','LEADER','B2C','Communication Lead','5ad10fff-3bfb-400f-88e1-e9a387743324','2026-08-28 04:06:49.022'),('86af8c4a-41f8-4f9c-a480-830abdb0eaa8','Ichsan Ramdani','ichsan@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM',NULL,'Quality Assurance','602ee7f5-0e5f-4390-a0d3-c111c5651807','2026-08-28 04:06:49.023'),('87c99aec-bafa-46de-b0d8-bdbaf5a58371','Fenni Amalia','fenni@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','SSC','Data Analyst','ac158f67-1705-496a-b06e-28735dd77caa','2026-08-28 04:06:49.020'),('95211b55-9d23-40d5-8f5f-953613c56d15','Muhamad Fahmi','fahmi@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','TECHOPS','TechOps Support','7b4be7ef-1246-4455-9bfd-da8530e9fae9','2026-08-28 04:06:49.027'),('96fdb6c2-15a8-4705-9f08-0586a36d4f91','Dwijayanti Suhatsyah','poppy@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2B_EXPANSION','B2B Partnership Manager','b195b816-8168-48c3-9540-f37263f5c04f','2026-08-28 04:06:49.067'),('999eb8f0-6638-49c0-8935-63fe7f0dba30','Ma\'rufatu Laili','laili@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2B_EXPANSION','B2B Partnership Manager','b195b816-8168-48c3-9540-f37263f5c04f','2026-08-28 04:06:49.072'),('9c999a04-3dc8-4e26-853e-fe828ae3fd06','Sholehatin Ningsih','lia@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2B_EXPANSION','B2B Partnership Manager','b195b816-8168-48c3-9540-f37263f5c04f','2026-08-28 04:06:49.064'),('9fac6d87-444e-48fe-9a33-10a2d51d3012','Ulialbab Nudiashalih','ulil@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','TECHDEV','Data Engineer','602ee7f5-0e5f-4390-a0d3-c111c5651807','2026-08-28 04:06:49.047'),('a53fedf4-9344-4bcf-84c9-85c29aae4972','Wahyu Diningrat Suryo Atmojo','wahyu@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM',NULL,'Project Officer','201b58b6-e1e4-44d3-b4e7-3dd0139e2636','2026-08-28 04:06:49.049'),('aa41a0fb-58de-4a7c-8ef0-1c4abdf6eb05','Ahna Fatun Salsabila','anaf@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','SSC','HR Generalist','ac158f67-1705-496a-b06e-28735dd77caa','2026-08-28 04:06:49.057'),('ae26480c-dfe4-4621-89ab-8b53ca20cd16','Devlin Hazrian Saleh','devlin@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','C_LEVEL','STRATEGIC','Chief Executive Officer','a623fa11-d5cb-46a7-b2a8-a6885cfa8238','2026-08-28 04:06:49.011'),('afc41b19-faba-4786-ac9e-5c0ea711a8ef','Candra Mukti','candra@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2B_EXPANSION','B2B Partnership Manager','b195b816-8168-48c3-9540-f37263f5c04f','2026-08-28 04:06:49.065'),('b1b1453c-0520-41cd-b1f7-fb600c6f55d7','Tatang Supandi','tatang@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','SSC','Visual Production Lead','ac158f67-1705-496a-b06e-28735dd77caa','2026-08-28 04:06:49.042'),('b8bb523e-2481-4b14-8e20-4abe095f6cc0','Muhammad Aan Khunaifi','aan@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2B_EXPANSION','B2B Partnership Manager','b195b816-8168-48c3-9540-f37263f5c04f','2026-08-28 04:06:49.060'),('b99f45aa-d805-42cb-aebc-250f399c7ee2','Muhammad Rasyid Juliansyah','rasyid@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','ADMIN','SSC','Growth Product Manager','ac158f67-1705-496a-b06e-28735dd77caa','2026-08-28 04:06:49.033'),('baff59be-4db2-4431-a4db-e4388e2c5970','Hafizh Abdan Syakura','hafizh@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','STRATEGIC','Executive Partner','a623fa11-d5cb-46a7-b2a8-a6885cfa8238','2026-08-28 04:06:49.070'),('bc98a7e3-8f39-42ee-9dd7-65497507c42d','Syarief Hidayatullah','syarief@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','LEADER','TECHDEV','Techlead','602ee7f5-0e5f-4390-a0d3-c111c5651807','2026-08-28 04:06:49.038'),('ce19f55c-c7c2-4b70-9118-cfd70df69346','Agung Septiansyah','agung@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','LEADER','B2B_EXPANSION','Head of Sales Expansion','b195b816-8168-48c3-9540-f37263f5c04f','2026-08-28 04:06:48.993'),('d97d3e36-d563-4239-8a4c-5a3b5d9c3e2b','Riska Rosmana','riska@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','LEADER','SERVICE_ACCOUNT','Service Account Manager','3dc8d8eb-e071-4cc3-8131-0336caebe91a','2026-08-28 04:06:49.082'),('eb761b0c-033c-4736-adf8-cada5bc48225','Farid Aflah','farid@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','LEADER','SSC','Senior Finance & Accounting','ac158f67-1705-496a-b06e-28735dd77caa','2026-08-28 04:06:49.055'),('f8b14b6a-b5c0-49f3-a2d2-b47dd406084d','Yazid Amanullah','yazid@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','STRATEGIC','Chief Technology Officer','a623fa11-d5cb-46a7-b2a8-a6885cfa8238','2026-08-28 04:06:49.050'),('fff23453-f0c0-4b51-8e07-4fa94a14e1a4','Alma Diva Hafizha Saleh','diva@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','B2B_CORPORATION','Corporate Communication','e9395743-c354-43b4-98f2-2287ea12e07d','2026-08-28 04:06:49.000'),('fffae301-daba-4e0d-b13b-d39b57829453','Yogie Ari Shandy','yogie@skolla.education','$2b$10$uND84VxZNg982UmdQGhvXOKz19MitdqOaLgHB6ZwzRFUNsJYMPVpe','TEAM','EDUCATION','Education Biologi','c22e7778-49e0-47dd-adfc-a96e23c4a037','2026-08-28 04:06:49.073');
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
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
INSERT INTO `_prisma_migrations` VALUES ('2c570d45-320c-4ccf-83de-0c93963d8442','fa0082d7da6cc99c236140f51ae75a73702cbe0d6f0bd2d44856e018bb778e65','2026-08-27 10:01:25.222','20260826011725_add_documentation_links',NULL,NULL,'2026-08-27 10:01:25.177',1),('6cfb90bb-37a7-4829-ae36-5cfa31a8f336','be6c7847ed264d3c7d913a697bd20a396d7f8188b5a41f08e027d10091be7ba3','2026-08-27 10:01:25.176','20260819091155_init_mysql',NULL,NULL,'2026-08-27 10:01:24.795',1),('e199bdb6-a31d-4380-a047-0cb19848d688','affdb36c213b050afd054ef47296aca37f02430aa12320f67efb0dfbdd52efd3','2026-08-27 10:01:26.266','20260827100126_add_annual_kr_initiative_approval',NULL,NULL,'2026-08-27 10:01:26.255',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-05  7:25:11

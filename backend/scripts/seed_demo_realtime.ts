import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Menyiapkan Data Dummy Real-time untuk Video Introduction...");

  // 1. Dapatkan referensi User & Role utama
  console.log("1. Mengupdate C-Board users & linkage...");
  await prisma.user.updateMany({
    where: {
      email: {
        in: [
          "devlin@skolla.education",
          "akbar@skolla.education",
          "yazid@skolla.education",
        ],
      },
    },
    data: { role: "C_LEVEL" },
  });

  const ceo = await prisma.user.findUnique({
    where: { email: "devlin@skolla.education" },
  });
  const cto = await prisma.user.findUnique({
    where: { email: "yazid@skolla.education" },
  });
  const cbo = await prisma.user.findUnique({
    where: { email: "akbar@skolla.education" },
  });
  const managerRizki = await prisma.user.findUnique({
    where: { email: "rizki@skolla.education" },
  });
  const leaderSyarief = await prisma.user.findUnique({
    where: { email: "syarief@skolla.education" },
  });
  const leaderZhurry = await prisma.user.findUnique({
    where: { email: "zhurry@skolla.education" },
  });
  const leaderDwiva = await prisma.user.findUnique({
    where: { email: "dwiva@skolla.education" },
  });
  const memberAndhika = await prisma.user.findUnique({
    where: { email: "andhika@skolla.education" },
  });
  const memberUlil = await prisma.user.findUnique({
    where: { email: "ulil@skolla.education" },
  });
  const memberTami = await prisma.user.findUnique({
    where: { email: "tami@skolla.education" },
  });
  const memberIchsan = await prisma.user.findUnique({
    where: { email: "ichsan@skolla.education" },
  });

  if (!managerRizki || !leaderSyarief || !memberAndhika) {
    throw new Error("User utama demo tidak ditemukan di database!");
  }

  // Update sponsor C-Board di Department
  if (cto) {
    await prisma.department.updateMany({
      where: { value: { in: ["TECHDEV", "TECHOPS"] } },
      data: { cLevelId: cto.id, managerId: managerRizki.id },
    });
  }
  if (cbo) {
    await prisma.department.updateMany({
      where: { value: { in: ["B2S", "B2B_EXPANSION", "B2B_CORPORATE"] } },
      data: { cLevelId: cbo.id },
    });
  }
  if (ceo) {
    await prisma.department.updateMany({
      where: { value: { in: ["STRATEGIC", "EDUCATION", "FINANCE"] } },
      data: { cLevelId: ceo.id },
    });
  }

  // 2. Bersihkan data demo lama jika ada
  console.log("2. Membersihkan data dummy inisiatif, task, dan approval lama...");
  await prisma.taskComment.deleteMany({});
  await prisma.taskUpdate.deleteMany({});
  await prisma.initiativeUpdate.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.taskKpi.deleteMany({});
  await prisma.initiativeKpi.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.initiative.deleteMany({});
  await prisma.memberSprintProgress.deleteMany({});
  await prisma.annualKeyResult.deleteMany({});

  // 3. Ambil Objectives yang relevan untuk BSC 4 Perspektif
  console.log("3. Menyiapkan Annual Key Result (Level 2 BSC Tahunan 2026)...");
  const objRevenue = await prisma.objective.findFirst({
    where: { title: { contains: "Total Revenue NETT" } },
  });
  const objRetention = await prisma.objective.findFirst({
    where: { title: { contains: "Retention Rate" } },
  });
  const objCSATExt = await prisma.objective.findFirst({
    where: { title: { contains: "CSAT External" } },
  });
  const objError = await prisma.objective.findFirst({
    where: { title: { contains: "Error Rate" } },
  });
  const objTalent = await prisma.objective.findFirst({
    where: { title: { contains: "Talent Performance" } },
  });
  const objCompany = await prisma.objective.findFirst({
    where: { title: { contains: "Company Performance Score" } },
  });

  const baseObjId = objRevenue?.id || (await prisma.objective.findFirst())?.id!;

  // 4 Perspektif BSC Tahunan (AnnualKeyResult)
  const akrFin1 = await prisma.annualKeyResult.create({
    data: {
      objectiveId: objRevenue?.id || baseObjId,
      title: "Mencapai Total Net Revenue Perusahaan Rp 31,5 Miliar",
      description: "Agregasi pendapatan B2B, B2S, dan B2C untuk tahun 2026",
      targetValue: 31500000000,
      currentValue: 22850000000,
      unit: "Rupiah",
      bscPerspective: "FINANCIAL",
      year: "2026",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
    },
  });

  const akrCust1 = await prisma.annualKeyResult.create({
    data: {
      objectiveId: objRetention?.id || baseObjId,
      title: "Mempertahankan Rasio Retensi Sekolah Mitra > 75%",
      description: "Customer retention rate tahun ajaran 2026/2027",
      targetValue: 75,
      currentValue: 71.2,
      unit: "%",
      bscPerspective: "CUSTOMER",
      year: "2026",
      status: "AT_RISK",
      targetType: "AT_LEAST",
    },
  });

  const akrProc1 = await prisma.annualKeyResult.create({
    data: {
      objectiveId: objError?.id || baseObjId,
      title: "Menjaga Platform Reliability & Uptime Service ≥ 99.8%",
      description: "Uptime sistem LMS, Web portal, dan Backend microservices",
      targetValue: 99.8,
      currentValue: 99.68,
      unit: "%",
      bscPerspective: "INTERNAL_PROCESS",
      year: "2026",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
    },
  });

  const akrLearn1 = await prisma.annualKeyResult.create({
    data: {
      objectiveId: objTalent?.id || baseObjId,
      title: "100% Talent Divisi Menyelesaikan Sertifikasi & Pelatihan",
      description: "Peningkatan kapabilitas talent tech, sales, dan edukasi",
      targetValue: 100,
      currentValue: 84.0,
      unit: "%",
      bscPerspective: "LEARNING_GROWTH",
      year: "2026",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
    },
  });
  // 4. Update Monthly Key Results & Link ke Annual KRs
  console.log("4. Mengaitkan Monthly Key Results ke Annual BSC & mengupdate nilai berjalan...");

  const krDowntime = await prisma.keyResult.findFirst({
    where: { title: { contains: "downtime functional platform" } },
  });
  if (krDowntime) {
    await prisma.keyResult.update({
      where: { id: krDowntime.id },
      data: {
        annualKeyResultId: akrProc1.id,
        currentValue: 14,
        month: "2026-10",
        status: "ON_TRACK",
        isManualOverride: false,
      },
    });
  }

  const krBugP0 = await prisma.keyResult.findFirst({
    where: { title: { contains: "Solving bug error P0-P1 <24 jam" } },
  });
  if (krBugP0) {
    await prisma.keyResult.update({
      where: { id: krBugP0.id },
      data: {
        annualKeyResultId: akrProc1.id,
        currentValue: 16.5,
        month: "2026-10",
        status: "ON_TRACK",
        isManualOverride: false,
      },
    });
  }

  const krB2S = await prisma.keyResult.findFirst({
    where: { title: { contains: "Mencapai Deal Kerja Sama dengan 95 Sekolah B2S" } },
  });
  if (krB2S) {
    await prisma.keyResult.update({
      where: { id: krB2S.id },
      data: {
        annualKeyResultId: akrFin1.id,
        currentValue: 71,
        month: "2026-10",
        status: "ON_TRACK",
        isManualOverride: false,
      },
    });
  }
  // Update capaian realistis untuk KR lainnya agar dashboard live dan bervariasi
  const allKrs = await prisma.keyResult.findMany();
  for (const kr of allKrs) {
    if (kr.id === krDowntime?.id || kr.id === krBugP0?.id || kr.id === krB2S?.id) continue;
    
    let simulatedCurrent = kr.targetValue * 0.78;
    let targetType = kr.targetType || "AT_LEAST";
    let status = "ON_TRACK";

    if (kr.unit === "Jam" || kr.unit === "Menit" || kr.title.toLowerCase().includes("bug") || kr.title.toLowerCase().includes("downtime")) {
      targetType = "AT_MOST";
      simulatedCurrent = Math.round(kr.targetValue * 0.65);
      status = "ON_TRACK";
    } else if (kr.unit === "Rupiah") {
      simulatedCurrent = Math.round(kr.targetValue * 0.74);
      status = "ON_TRACK";
    } else if (kr.title.toLowerCase().includes("churn") || kr.title.toLowerCase().includes("merah")) {
      targetType = "AT_MOST";
      simulatedCurrent = Math.round(kr.targetValue * 0.7);
      status = "ON_TRACK";
    } else if (kr.title.toLowerCase().includes("retention") || kr.title.toLowerCase().includes("active user")) {
      simulatedCurrent = Math.round(kr.targetValue * 0.88);
      status = "AT_RISK";
    } else {
      simulatedCurrent = Math.round(kr.targetValue * 0.82);
    }

    await prisma.keyResult.update({
      where: { id: kr.id },
      data: {
        currentValue: simulatedCurrent,
        targetType,
        status,
        month: "2026-10",
      },
    });
  }


  const activeSprint = await prisma.sprint.findFirst({
    where: { name: "Sprint Oktober 2026" },
  });
  const sprintId = activeSprint?.id || null;

  const teamTechdev = (await prisma.team.findFirst({
    where: { name: { contains: "Tech" } },
  })) || (await prisma.team.findFirst({
    where: { department: "TECHDEV" },
  }));

  const teamB2S = await prisma.team.findFirst({
    where: { department: "B2S" },
  });

  const techTeamId = teamTechdev?.id || "602ee7f5-0e5f-4390-a0d3-c111c5651807";
  const b2sTeamId = teamB2S?.id || "201b58b6-e1e4-44d3-b4e7-3dd0139e2636";

  await prisma.team.update({
    where: { id: techTeamId },
    data: { leaderId: leaderSyarief.id, managerId: managerRizki.id },
  });

  // 5. Inisiatif (P-Level)
  console.log("5. Membuat Inisiatif (P-Level) yang ter-cascade dari KR Manajer...");

  const init1 = await prisma.initiative.create({
    data: {
      keyResultId: krDowntime?.id || null,
      teamId: techTeamId,
      ownerId: managerRizki.id,
      assignedLeaderId: leaderSyarief.id,
      assignedBy: managerRizki.id,
      title: "Implementasi Sistem Monitoring Real-time & Sentry Alerting V2",
      description: "Upgrade stack observability APM, alerting otomatis ke Slack, dan integrasi error tracking sentry",
      targetValue: 100,
      currentValue: 75,
      unit: "%",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
      kanbanStatus: "IN_PROGRESS",
      weight: 1.5,
      startDate: new Date("2026-09-21T00:00:00.000Z"),
      dueDate: new Date("2026-10-15T23:59:59.000Z"),
      sprintMonth: "2026-10",
      sprintId: sprintId,
      documentationLink: "https://notion.so/skolla/observability-v2-spec",
    },
  });

  const init2 = await prisma.initiative.create({
    data: {
      keyResultId: krBugP0?.id || null,
      teamId: techTeamId,
      ownerId: managerRizki.id,
      assignedLeaderId: leaderSyarief.id,
      assignedBy: managerRizki.id,
      title: "Optimasi Query Database & Caching Engine Dashboard OKR",
      description: "Pengurangan TTFB dashboard executive melalui query caching Redis dan index tuning",
      targetValue: 100,
      currentValue: 60,
      unit: "%",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
      kanbanStatus: "IN_PROGRESS",
      weight: 1.2,
      startDate: new Date("2026-09-22T00:00:00.000Z"),
      dueDate: new Date("2026-10-12T23:59:59.000Z"),
      sprintMonth: "2026-10",
      sprintId: sprintId,
      documentationLink: "https://github.com/skolla/okr-backend/pull/88",
    },
  });

  const init3 = await prisma.initiative.create({
    data: {
      keyResultId: krBugP0?.id || null,
      teamId: techTeamId,
      ownerId: managerRizki.id,
      assignedLeaderId: leaderSyarief.id,
      assignedBy: managerRizki.id,
      title: "Revamp Arsitektur Microservice Modul Assessment LMS",
      description: "Pemisahan engine koreksi ujian otomatis dari monolith ke worker service",
      targetValue: 100,
      currentValue: 20,
      unit: "%",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
      kanbanStatus: "TODO",
      weight: 1.0,
      startDate: new Date("2026-09-28T00:00:00.000Z"),
      dueDate: new Date("2026-10-18T23:59:59.000Z"),
      sprintMonth: "2026-10",
      sprintId: sprintId,
    },
  });

  const init4 = await prisma.initiative.create({
    data: {
      keyResultId: krB2S?.id || null,
      teamId: b2sTeamId,
      ownerId: managerRizki.id,
      assignedLeaderId: leaderZhurry?.id || null,
      assignedBy: managerRizki.id,
      title: "Penetrasi Penjualan LMS Juara ke 30 SMA/SMK Unggulan Jawa Barat",
      description: "Kampanye roadshow demo produk dan pitching paket rombel LMS",
      targetValue: 30,
      currentValue: 21,
      unit: "Sekolah",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
      kanbanStatus: "IN_PROGRESS",
      weight: 1.5,
      startDate: new Date("2026-09-21T00:00:00.000Z"),
      dueDate: new Date("2026-10-15T23:59:59.000Z"),
      sprintMonth: "2026-10",
      sprintId: sprintId,
    },
  });

  const init5 = await prisma.initiative.create({
    data: {
      keyResultId: krDowntime?.id || null,
      teamId: techTeamId,
      ownerId: managerRizki.id,
      assignedLeaderId: leaderDwiva?.id || leaderSyarief.id,
      assignedBy: managerRizki.id,
      title: "Migrasi Auto-scaling Node Cluster & Disaster Recovery Setup",
      description: "Konfigurasi Kubernetes HPA dan snapshot failover database",
      targetValue: 100,
      currentValue: 100,
      unit: "%",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
      kanbanStatus: "DONE",
      weight: 1.0,
      startDate: new Date("2026-09-21T00:00:00.000Z"),
      dueDate: new Date("2026-09-25T23:59:59.000Z"),
      finishDate: new Date("2026-09-25T17:00:00.000Z"),
      sprintMonth: "2026-10",
      sprintId: sprintId,
      documentationLink: "https://notion.so/skolla/dr-playbook-2026",
    },
  });

  // 6. Tasks (T-Level)
  console.log("6. Membuat Tasks (T-Level) untuk anggota tim...");

  const task1 = await prisma.task.create({
    data: {
      initiativeId: init1.id,
      assignedTeamMemberId: memberAndhika.id,
      assignedBy: leaderSyarief.id,
      sprintMonth: "2026-10",
      sprintId: sprintId,
      startDate: new Date("2026-09-21T00:00:00.000Z"),
      finishDate: new Date("2026-09-24T18:00:00.000Z"),
      title: "Setup Prometheus Alertmanager & Sentry Webhook Integration",
      description: "Konfigurasi alert rule, webhook endpoint Slack backend, dan capture unhandled exception",
      targetValue: 100,
      currentValue: 100,
      baselineValue: 0,
      weight: 1.0,
      unit: "%",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
      kanbanStatus: "DONE",
      documentationLink: "https://github.com/skolla/okr-backend/commit/7a2e",
    },
  });

  const task2 = await prisma.task.create({
    data: {
      initiativeId: init1.id,
      assignedTeamMemberId: memberUlil?.id || memberAndhika.id,
      assignedBy: leaderSyarief.id,
      sprintMonth: "2026-10",
      sprintId: sprintId,
      startDate: new Date("2026-09-22T00:00:00.000Z"),
      title: "Konfigurasi Dashboard Monitoring Latency & Throughput di Grafana",
      description: "Visualisasi p95/p99 response time, error rate by endpoint, dan resource utilization",
      targetValue: 100,
      currentValue: 80,
      baselineValue: 0,
      weight: 1.0,
      unit: "%",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
      kanbanStatus: "IN_PROGRESS",
    },
  });

  const task3 = await prisma.task.create({
    data: {
      initiativeId: init1.id,
      assignedTeamMemberId: memberIchsan?.id || memberAndhika.id,
      assignedBy: leaderSyarief.id,
      sprintMonth: "2026-10",
      sprintId: sprintId,
      startDate: new Date("2026-09-24T00:00:00.000Z"),
      title: "Stress Testing & Load Simulation End-to-End API",
      description: "Simulasi beban puncak 5000 concurrent request dengan k6 load test",
      targetValue: 100,
      currentValue: 45,
      baselineValue: 0,
      weight: 1.0,
      unit: "%",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
      kanbanStatus: "IN_PROGRESS",
    },
  });

  const task4 = await prisma.task.create({
    data: {
      initiativeId: init2.id,
      assignedTeamMemberId: memberAndhika.id,
      assignedBy: leaderSyarief.id,
      sprintMonth: "2026-10",
      sprintId: sprintId,
      startDate: new Date("2026-09-23T00:00:00.000Z"),
      title: "Refactor Endpoint BSC & Caching Redis untuk Summary Query",
      description: "Implementasi cache TTL 5 menit untuk agregasi dashboard BSC dan invalidasi on update",
      targetValue: 100,
      currentValue: 60,
      baselineValue: 0,
      weight: 1.5,
      unit: "%",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
      kanbanStatus: "IN_PROGRESS",
      documentationLink: "https://github.com/skolla/okr-backend/pull/142",
    },
  });

  const task5 = await prisma.task.create({
    data: {
      initiativeId: init2.id,
      assignedTeamMemberId: memberTami?.id || memberAndhika.id,
      assignedBy: leaderSyarief.id,
      sprintMonth: "2026-10",
      sprintId: sprintId,
      startDate: new Date("2026-09-24T00:00:00.000Z"),
      title: "UI/UX Redesign Skeleton Loader & Responsive Gantt Chart",
      description: "Komponen timeline frappe gantt responsif di mobile dan visual skeleton loading",
      targetValue: 100,
      currentValue: 75,
      baselineValue: 0,
      weight: 1.0,
      unit: "%",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
      kanbanStatus: "IN_PROGRESS",
    },
  });

  const task6 = await prisma.task.create({
    data: {
      initiativeId: init2.id,
      assignedTeamMemberId: memberTami?.id || memberAndhika.id,
      assignedBy: leaderSyarief.id,
      sprintMonth: "2026-10",
      sprintId: sprintId,
      startDate: new Date("2026-09-25T00:00:00.000Z"),
      title: "Request Desain Banner & Panduan Interaktif Fitur OKR",
      description: "Aset grafis panduan walkthrough cascading inisiatif dan approval untuk user onboarding",
      targetValue: 10,
      currentValue: 6,
      baselineValue: 0,
      weight: 1.0,
      unit: "Asset",
      status: "ON_TRACK",
      targetType: "AT_LEAST",
      kanbanStatus: "IN_PROGRESS",
      isCrossDept: true,
      creatorId: leaderSyarief.id,
      creatorDept: "TECHDEV",
      targetDept: "DESIGN",
    },
  });

  await prisma.taskAssignment.createMany({
    data: [
      { taskId: task1.id, userId: memberAndhika.id },
      { taskId: task2.id, userId: memberUlil?.id || memberAndhika.id },
      { taskId: task3.id, userId: memberIchsan?.id || memberAndhika.id },
      { taskId: task4.id, userId: memberAndhika.id },
      { taskId: task5.id, userId: memberTami?.id || memberAndhika.id },
      { taskId: task6.id, userId: memberTami?.id || memberAndhika.id },
    ],
    skipDuplicates: true,
  });

  // 7. APPROVAL FLOW (T -> P LEVEL & P -> M LEVEL)
  console.log("7. Menyiapkan data Approval Flow (T -> P Level & P -> M Level)...");

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // A) APPROVAL T LEVEL -> P LEVEL (Andhika ke Syarief)
  await prisma.taskUpdate.create({
    data: {
      taskId: task4.id,
      oldValue: 60,
      newValue: 85,
      note: "Optimasi query summary dan cache Redis telah selesai diintegrasikan ke staging. Latensi turun drastis dari 1.8 detik ke 140 ms. Mohon persetujuan Techlead.",
      link: "https://github.com/skolla/okr-backend/pull/142",
      submittedBy: memberAndhika.id,
      status: "PENDING_APPROVAL",
      createdAt: oneHourAgo,
    },
  });

  // B) APPROVAL P LEVEL -> M LEVEL (Syarief ke Rizki)
  await prisma.initiativeUpdate.create({
    data: {
      initiativeId: init1.id,
      oldValue: 75,
      newValue: 95,
      kanbanStatus: "REVIEW",
      note: "Inisiatif observability monitoring real-time telah mencapai 95%. Seluruh konfigurasi alert dan dashboard Grafana siap dideploy ke server production. Mohon approval Head of Operation.",
      link: "https://grafana.skolla.online/d/infra-prod",
      submittedBy: leaderSyarief.id,
      status: "PENDING_APPROVAL",
      createdAt: twoHoursAgo,
    },
  });

  // C) RIWAYAT PERSENJUTUAN (APPROVED)
  await prisma.taskUpdate.create({
    data: {
      taskId: task1.id,
      oldValue: 0,
      newValue: 100,
      note: "Sentry SDK dan rule alert Prometheus selesai dikonfigurasi dan diuji di staging.",
      link: "https://github.com/skolla/okr-backend/commit/7a2e",
      submittedBy: memberAndhika.id,
      status: "APPROVED",
      reviewedBy: leaderSyarief.id,
      reviewedAt: oneDayAgo,
      createdAt: new Date(oneDayAgo.getTime() - 2 * 60 * 60 * 1000),
    },
  });

  await prisma.initiativeUpdate.create({
    data: {
      initiativeId: init5.id,
      oldValue: 50,
      newValue: 100,
      kanbanStatus: "DONE",
      note: "Uji coba disaster recovery failover database dan auto-scaling node sukses dengan beban 10k concurrent session.",
      link: "https://notion.so/skolla/dr-playbook-2026",
      submittedBy: leaderDwiva?.id || leaderSyarief.id,
      status: "APPROVED",
      reviewedBy: managerRizki.id,
      reviewedAt: twoDaysAgo,
      createdAt: new Date(twoDaysAgo.getTime() - 4 * 60 * 60 * 1000),
    },
  });

  // 8. Member Sprint Progress
  if (sprintId) {
    console.log("8. Menghitung capaian member sprint progress...");
    await prisma.memberSprintProgress.createMany({
      data: [
        {
          sprintId: sprintId,
          userId: memberAndhika.id,
          totalScore: 82.5,
          taskCount: 2,
          completedCount: 1,
          detailsJson: { role: "Back End Developer", dept: "TECHDEV" },
        },
        {
          sprintId: sprintId,
          userId: memberTami?.id || memberAndhika.id,
          totalScore: 75.0,
          taskCount: 2,
          completedCount: 0,
          detailsJson: { role: "UI/UX Designer", dept: "TECHDEV" },
        },
        {
          sprintId: sprintId,
          userId: memberUlil?.id || memberAndhika.id,
          totalScore: 80.0,
          taskCount: 1,
          completedCount: 0,
          detailsJson: { role: "Data Engineer", dept: "TECHDEV" },
        },
        {
          sprintId: sprintId,
          userId: memberIchsan?.id || memberAndhika.id,
          totalScore: 45.0,
          taskCount: 1,
          completedCount: 0,
          detailsJson: { role: "Quality Assurance", dept: "TECHDEV" },
        },
      ],
      skipDuplicates: true,
    });
  }

  // 9. Interactive Notifications
  console.log("9. Menyiapkan notifikasi interaktif...");
  await prisma.notification.createMany({
    data: [
      {
        recipientId: leaderSyarief.id,
        type: "TASK_UPDATE_PENDING",
        title: "Ada Update Task Menunggu Persetujuan",
        body: `Andhika Prakasa mengajukan update 85% untuk Task "${task4.title}"`,
        link: "/approvals",
        isRead: false,
        createdAt: oneHourAgo,
      },
      {
        recipientId: managerRizki.id,
        type: "INITIATIVE_UPDATE_PENDING",
        title: "Ada Inisiatif Menunggu Persetujuan",
        body: `Syarief Hidayatullah mengajukan update 95% untuk Inisiatif "${init1.title}"`,
        link: "/approvals",
        isRead: false,
        createdAt: twoHoursAgo,
      },
      {
        recipientId: memberAndhika.id,
        type: "TASK_UPDATE_APPROVED",
        title: "Update Task Disetujui",
        body: `Syarief Hidayatullah telah menyetujui update Task "${task1.title}" menjadi 100%`,
        link: "/team/my-work",
        isRead: false,
        createdAt: oneDayAgo,
      },
    ],
  });

  // 10. Audit Logs
  console.log("10. Menambahkan histori Audit Log terkini...");
  await prisma.auditLog.createMany({
    data: [
      {
        userId: memberAndhika.id,
        action: "SUBMIT_PROGRESS",
        entityType: "TASK",
        entityId: task4.id,
        newValues: { newValue: 85, note: "Optimasi query summary dan cache Redis" },
        ipAddress: "127.0.0.1",
        createdAt: oneHourAgo,
      },
      {
        userId: leaderSyarief.id,
        action: "SUBMIT_PROGRESS",
        entityType: "INITIATIVE",
        entityId: init1.id,
        newValues: { newValue: 95, kanbanStatus: "REVIEW" },
        ipAddress: "127.0.0.1",
        createdAt: twoHoursAgo,
      },
      {
        userId: leaderSyarief.id,
        action: "APPROVE_PROGRESS",
        entityType: "TASK",
        entityId: task1.id,
        newValues: { status: "APPROVED", approvedValue: 100 },
        ipAddress: "127.0.0.1",
        createdAt: oneDayAgo,
      },
      {
        userId: managerRizki.id,
        action: "APPROVE_PROGRESS",
        entityType: "INITIATIVE",
        entityId: init5.id,
        newValues: { status: "APPROVED", approvedValue: 100 },
        ipAddress: "127.0.0.1",
        createdAt: twoDaysAgo,
      },
    ],
  });

  console.log("✨ SUKSES! Data dummy real-time siap digunakan untuk rekaman video demo.");

}
main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


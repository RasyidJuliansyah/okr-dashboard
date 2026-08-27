<script setup lang="ts">
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
} from "chart.js";
import { computed } from "vue";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
);

interface LeaderAssignee {
  userId: string;
  name: string;
  role: string;
  raciRole: string;
}

interface MonthData {
  month: string;
  monthLabel: string;
  monthWeight: number;
  monthTarget: number;
  currentValue: number;
  progressPercent: number;
  status: string;
  isManualOverride: boolean;
  leaderAssignees: LeaderAssignee[];
}

const props = defineProps<{
  months: MonthData[];
  title: string;
  unit: string;
  bscPerspective: string;
}>();

// Map color based on BSC perspective
const chartColor = computed(() => {
  const p = String(props.bscPerspective).toUpperCase();
  switch (p) {
    case "FINANCIAL":
      return "#0e97d6"; // blue
    case "CUSTOMER":
      return "#6366f1"; // indigo
    case "INTERNAL_PROCESS":
    case "INTERNAL":
      return "#a855f7"; // purple
    case "LEARNING_GROWTH":
    case "LEARNING":
      return "#22c55e"; // green
    default:
      return "#3b82f6";
  }
});

const chartData = computed(() => {
  return {
    labels: props.months.map((m) => m.monthLabel.split(" ")[0]), // Ambil nama bulan saja (misal Jan)
    datasets: [
      {
        label: "Progress Capaian (%)",
        backgroundColor: chartColor.value,
        borderColor: chartColor.value,
        pointBackgroundColor: chartColor.value,
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: chartColor.value,
        data: props.months.map((m) => m.progressPercent),
        tension: 0.3,
        fill: false,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
});

const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}%`,
          font: {
            size: 10,
          },
        },
        grid: {
          color: "#f1f5f9",
        },
      },
      x: {
        ticks: {
          font: {
            size: 10,
          },
        },
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 6,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            return props.months[index].monthLabel;
          },
          label: (context: any) => {
            const index = context.dataIndex;
            const m = props.months[index];
            const lines = [
              `Progress: ${m.progressPercent}%`,
              `Capaian: ${m.currentValue} / ${m.monthTarget} ${props.unit || "%"}`,
              `Bobot: ${Math.round(m.monthWeight * 100)}%`,
              `Status: ${m.status}`,
            ];
            if (m.leaderAssignees && m.leaderAssignees.length > 0) {
              const leaders = m.leaderAssignees.map((l) => l.name).join(", ");
              lines.push(`Leader: ${leaders}`);
            }
            if (m.isManualOverride) {
              lines.push("⚠️ (Manual Override)");
            }
            return lines;
          },
        },
      },
    },
  };
});
</script>

<template>
  <div class="chart-container">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 200px;
}
</style>

<script setup>
import { onMounted, ref, watch } from "vue";
import { socket } from "@/helpers";
import { useSessionsStore, useAppStore } from "@/store";
import axios from "axios";
import { ipServer } from "@/config";
import { useToast } from "@/composables";
import AddMac from "./components/AddMac.vue";
import AddPrint from "./components/AddPrint.vue";
import AddMarket from "./components/AddMarket.vue";
const { success, error } = useToast();

const sessionStore = useSessionsStore();
const appStore = useAppStore();

const currentTariff = ref();
const initialCar = { paymentMethod: 1, tariffType: 1, eventName: "output" };
const inputCar = ref({ ...initialCar });
const outputCar = ref({ ...initialCar });
const stats = ref({});
const isOpenInput = ref(false);
const isOpenOutput = ref(false);
const totalCost = ref(0);
const enterCount = ref(0);
const outputCount = ref(0);
const mac_address = ref(null);

const isSocketConnected = ref(false);

const addSessionHandler = async () => {
  const { number, plateImage, fullImage, eventName, paymentMethod, tariffType, cameraIp, price } =
    inputCar.value;

  if (eventName === "input") {
    await axios.post(`${ipServer}/api/register-session`, {
      number,
      plateImage,
      fullImage,
      eventName: eventName || "input",
      paymentMethod,
      tariffType: tariffType || 1,
      cameraIp,
    });
  } else {
    await axios.post(`${ipServer}/api/output-session`, {
      number,
      plateImage,
      fullImage,
      eventName: eventName || "input",
      paymentMethod,
      tariffType: tariffType || 1,
      cameraIp,
      outputCost: price,
    });
  }

  isOpenInput.value = false;
};

const openDrawer = () => {
  isOpenInput.value = true;
  inputCar.value = { ...initialCar };
};

const openDrawerOutput = () => {
  isOpenOutput.value = true;
  outputCar.value = { ...initialCar };
};

const socketsConnect = (operator) => {
  if (!operator) return;
  socket.on(`inputCar-${operator}`, async (data) => {
    inputCar.value = { ...initialCar, ...data };
    isOpenInput.value = true;
  });

  // Выводим уведомление если ранее оплачивал
  socket.on(`notification-${operator}`, async (data) => {
    if (data.type === "error") {
      error("Ошибка", data.message);
    } else if (data.type === "success") {
      success("Успешно", data.message);
    }
  });

  socket.on(`outputCar-${operator}`, async (data) => {
    outputCar.value = data;
    isOpenOutput.value = true;
  });
};

const socketOff = (operator) => {
  socket.off(`inputCar-${operator}`);
  socket.off(`outputCar-${operator}`);
  socket.off(`notification-${operator}`);
};

watch(
  () => appStore.selectedOperator,
  (newValue, oldValue) => {
    if (newValue) {
      socketsConnect(newValue);
      socketOff(oldValue);
    }
  }
);

const getAllInfo = async () => {
  try {
    const { data } = await axios.get(`${ipServer}/api/session/info`);
    const response = await axios.get(
      `https://raqamli-bozor.uz/services/platon-core/api/v1/desktop/pms/sum?mac_address=${mac_address.value}`,
      {
        headers: {
          Authorization: `Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1`,
        },
      }
    );

    totalCost.value = response.data.data.sum;
    enterCount.value = response.data.data.enter_count;
    outputCount.value = response.data.data.exit_count;

    stats.value = data;
  } catch (error) {
    console.error(error);
  }
};

onMounted(async () => {
  socket.connect();
  isSocketConnected.value = true;

  const mac = await axios.get(`${ipServer}/api/mac`);
  mac_address.value = mac.data.mac;

  await getAllInfo();

  socket.on("parkStats", async (data) => {
    stats.value = data;
    const response = await axios.get(
      `https://raqamli-bozor.uz/services/platon-core/api/v1/desktop/pms/sum?mac_address=${mac_address.value}`,
      {
        headers: {
          Authorization: `Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1`,
        },
      }
    );

    totalCost.value = response.data.data.sum;
    enterCount.value = response.data.data.enter_count;
    outputCount.value = response.data.data.exit_count;
  });
  socket.on("connect", () => {
    isSocketConnected.value = true;
  });

  socket.on("disconnect", () => {
    isSocketConnected.value = false;
  });

  appStore.initSelectOperator();
});
</script>

<template>
  <div class="wrapper">
    <!-- Header with operator info and connection status -->
    <div class="header-section">
      <div class="operator-card">
        <div class="operator-info">
          <div class="operator-icon">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="operator-details">
            <h2 class="operator-title">Operator</h2>
            <p class="operator-name">{{ appStore.selectedOperator }}</p>
          </div>
        </div>

        <div class="connection-status" :class="{ connected: isSocketConnected, disconnected: !isSocketConnected }">
          <div class="status-indicator"></div>
          <span class="status-text">{{ isSocketConnected ? "Connected" : "Disconnected" }}</span>
          <!-- Connected WiFi Icon -->
          <svg v-if="isSocketConnected" class="h-4 w-4 text-gray-800" fill="none" stroke="currentColor" stroke-width="2"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>

          <!-- Disconnected WiFi Icon -->
          <svg v-else class="h-4 w-4 text-gray-800" fill="none" stroke="currentColor" stroke-width="2"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Statistics Section -->
    <div class="statistics-section">
      <div class="section-header">
        <div class="section-title">
          <svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 class="text-lg font-semibold text-gray-800">Bugungi statistika</h2>
        </div>
        <div class="date-display">
          <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="text-sm text-gray-500">{{ new Date().toLocaleDateString() }}</span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
          <div class="stat-header">
            <div class="stat-icon bg-blue-100">
              <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.828 0-1.5.672-1.5 1.5v4.5" />
              </svg>
            </div>
            <span class="stat-label">Sessiyalar soni</span>
          </div>
          <div class="stat-value">{{ enterCount }}</div>
        </div>

        <div class="stat-card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
          <div class="stat-header">
            <div class="stat-icon bg-green-100">
              <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span class="stat-label">Umumiy to'lov</span>
          </div>
          <div class="stat-value">{{ totalCost }} so'm</div>
        </div>

        <div class="stat-card bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500">
          <div class="stat-header">
            <div class="stat-icon bg-orange-100">
              <svg class="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span class="stat-label">Chiqishlar soni</span>
          </div>
          <div class="stat-value">{{ outputCount }}</div>
        </div>

        <div class="stat-card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
          <div class="stat-header">
            <div class="stat-icon bg-purple-100">
              <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span class="stat-label">Ichkaridagilar soni</span>
          </div>
          <div class="stat-value">{{ enterCount - outputCount }}</div>
        </div>
      </div>
    </div>

    <!-- Drawers and Sessions -->
    <InputDrawer v-model="isOpenInput" v-model:newCar="inputCar" />
    <OutputDrawer v-model="isOpenOutput" v-model:newCar="outputCar" />
    <Sessions />
  </div>

  <ToastContainer />
  <AddCamera />
  <AddMac />
  <AddPrint />
  <AddMarket />
</template>

<style scoped>
@reference "@/assets/main.css";

.wrapper {
  @apply min-h-screen bg-gray-50 p-6;
}

.operator-details {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Header Section */
.header-section {
  @apply mb-6;
}

.operator-card {
  /* @apply flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm; */
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: var(--radius-2xl, 1rem);
  background: #f5f5f5f5;
  padding: 22px 2px;
  height: 20px
}

.operator-info {
  @apply flex items-center gap-4;
}

.operator-icon {
  /* @apply flex h-12 w-12 items-center justify-center rounded-full bg-white/20; */
}

.operator-icon svg {
  /* @apply text-white; */
}

.operator-title {
  /* @apply text-sm font-medium text-white/80; */
}

.operator-name {
  /* @apply text-xl font-bold text-white; */
}

.connection-status {
  @apply flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm;
}

.connection-status.connected {
  @apply bg-green-500/20 text-green-100;
}

.connection-status.disconnected {
  @apply bg-red-500/20 text-red-100;
}

.status-indicator {
  @apply h-2 w-2 rounded-full;
}

.connection-status.connected .status-indicator {
  @apply bg-green-400;
}

.connection-status.disconnected .status-indicator {
  @apply bg-red-400;
}

.status-text {
  @apply text-sm font-medium;
  color: #404040;
}

/* Statistics Section */
.statistics-section {
  @apply mb-8;
}

.section-header {
  @apply mb-4 flex items-center justify-between;
}

.section-title {
  @apply flex items-center gap-3;
}

.date-display {
  @apply flex items-center gap-2;
}

/* Stats Grid */
.stats-grid {
  @apply grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4;
}

.stat-card {
  @apply rounded-xl p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02];
}

.stat-header {
  @apply mb-3 flex items-center justify-between;
}

.stat-icon {
  @apply flex h-10 w-10 items-center justify-center rounded-lg;
}

.stat-label {
  @apply text-sm font-medium text-gray-600;
}

.stat-value {
  @apply text-2xl font-bold text-gray-800;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .wrapper {
    @apply p-4;
  }

  .operator-card {
    @apply flex-col items-start gap-4;
  }

  .connection-status {
    @apply self-start;
  }
}
</style>
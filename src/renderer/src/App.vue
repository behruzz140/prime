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
    <SubTitle class="flex justify-between">
      Operator {{ appStore.selectedOperator }}
      <div class="socket-wrapper">
        <div
          class="socket-status"
          :class="{ connected: isSocketConnected, disconnected: !isSocketConnected }"
        ></div>
        {{ isSocketConnected ? "Connected" : "Disconnected" }}
      </div>
    </SubTitle>

    <SubTitle class="flex justify-between">Bugungi statistika</SubTitle>

    <div class="stats">
      <div class="statCard">
        Sessiyalar soni
        <div class="statCount">
          {{ enterCount }}
        </div>
      </div>
      <div class="statCard">
        Umumiy to'lov
        <div class="statCount">
          {{ totalCost }}
        </div>
      </div>
      <div class="statCard">
        Chiqishlar soni
        <div class="statCount">
          {{ outputCount }}
        </div>
      </div>
      <div class="statCard">
        Ichkaridagilar soni
        <div class="statCount">
          {{ enterCount - outputCount }}
        </div>
      </div>
    </div>

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
  .stats {
    @apply mt-4 grid grid-cols-4 gap-4;
  }
  .statCard {
    @apply w-full rounded-lg bg-white p-4 text-sm text-gray-400 shadow-md;
  }

  .statCount {
    @apply text-2xl font-semibold text-gray-600;
  }

  .wrapper {
    @apply overflow-hidden p-4;
  }

  .container {
    @apply rounded-lg bg-white p-4 shadow-md;
  }

  .price {
    @apply grid grid-cols-1 gap-2;
  }

  .row {
    @apply flex items-center justify-between gap-2 rounded-md bg-blue-100 p-4;
  }

  .rows {
    @apply flex flex-col gap-4;
  }

  .socket-status {
    @apply h-3 w-3 rounded-full text-center;
  }

  .socket-wrapper {
    @apply flex items-center gap-2 text-base font-medium;
  }
  .connected {
    @apply bg-green-500 text-white;
  }

  .disconnected {
    @apply bg-red-500 text-white;
  }
</style>

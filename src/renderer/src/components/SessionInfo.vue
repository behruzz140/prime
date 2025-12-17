<!-- SessionInfo.vue -->
<script setup>
  import axios from "axios";
  import { onMounted, ref, watch } from "vue";
  import Button from "./Button.vue";
  import {
    DialogContent,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTrigger,
    DialogTitle,
    DialogClose,
  } from "radix-vue";
  import { Icon } from "@iconify/vue";
  import { ipServer } from "@/config";

  const open = defineModel({
    default: false,
  });

  const selectedId = defineModel("selected");
  const isLoading = ref(false);
  const errorMessage = ref("");
  const sessionInfo = ref({
    plateNumber: "",
    startTime: "",
    endTime: "",
    isInner: false,
    isSync: false,
    amount: 0,
    duration: ""
  });

  const loadSessionInfo = async (id) => {
    if (!id) return;
    
    try {
      isLoading.value = true;
      errorMessage.value = "";
      
      const { data } = await axios.get(`${ipServer}/api/session/${id}`);
      
      sessionInfo.value = {
        plateNumber: data.plateNumber || "",
        startTime: data.startTime ? new Date(data.startTime).toLocaleString() : "",
        endTime: data.endTime ? new Date(data.endTime).toLocaleString() : "",
        isInner: data.isInner || false,
        isSync: data.isSync || false,
        amount: data.amount || 0,
        duration: calculateDuration(data.startTime, data.endTime)
      };
    } catch (error) {
      console.error("Ошибка при получении данных сессии:", error);
      errorMessage.value = error.response?.data?.message || "Не удалось загрузить информацию о сессии.";
    } finally {
      isLoading.value = false;
    }
  };

  const printReceipt = async () => {
    try {
      const { data } = await axios.post(`${ipServer}/api/session/print/${selectedId.value}`);
      console.log("Чек отправлен на печать:", data);
    } catch (error) {
      console.error("Ошибка при печати чека:", error);
      errorMessage.value = error.response?.data?.message || "Ошибка при печати чека.";
    }
  };

  watch(
    () => selectedId.value,
    (newVal) => {
      if (newVal && open.value) {
        loadSessionInfo(newVal);
      }
    }
  );

  watch(
    () => open.value,
    (newVal) => {
      if (newVal && selectedId.value) {
        loadSessionInfo(selectedId.value);
      } else {
        sessionInfo.value = {
          plateNumber: "",
          startTime: "",
          endTime: "",
          isInner: false,
          isSync: false,
          amount: 0,
          duration: ""
        };
        errorMessage.value = "";
      }
    }
  );

  const calculateDuration = (startTime, endTime) => {
    if (!startTime) return "";
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours} час ${minutes} минут`;
  };
</script>

<template>
  <DialogRoot key="open" v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-30 bg-black/50" />
      <DialogContent
        class="fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-[450px] -translate-x-1/2 -translate-y-1/2 transform rounded-md bg-white p-6 shadow-lg"
        aria-describedby=""
      >
        <DialogTitle class="text-lg font-semibold">Информация о сессии</DialogTitle>

        <div v-if="isLoading" class="mt-4">
          <p>Загрузка информации...</p>
        </div>
        
        <div v-else class="mt-4 space-y-2">
          <p><strong>Номер машины:</strong> {{ sessionInfo.plateNumber }}</p>
          <p><strong>Время входа:</strong> {{ sessionInfo.startTime }}</p>
          <p v-if="sessionInfo.endTime"><strong>Время выхода:</strong> {{ sessionInfo.endTime }}</p>
          <p><strong>Статус:</strong> {{ sessionInfo.isInner ? "Внутри" : "Вышел" }}</p>
          <p><strong>Синхронизировано:</strong> {{ sessionInfo.isSync ? "Да" : "Нет" }}</p>
          <p v-if="sessionInfo.amount > 0"><strong>Оплачено:</strong> {{ sessionInfo.amount }} сум</p>
          <p><strong>Продолжительность:</strong> {{ sessionInfo.duration }}</p>
          
          <Button 
            @click="printReceipt" 
            variant="success" 
            class="mt-4 flex w-full items-center justify-center gap-2"
            :disabled="isLoading"
          >
            <Icon icon="material-symbols:output-circle" />
            Напечатать чек
          </Button>
        </div>

        <p v-if="errorMessage" class="mt-2 text-red-500">{{ errorMessage }}</p>

        <div class="mt-4 flex justify-end space-x-2">
          <DialogClose as="button" class="rounded bg-gray-200 px-4 py-2">Закрыть</DialogClose>
        </div>

        <DialogClose class="absolute top-2 right-2">
          <Icon icon="lucide:x" class="text-gray-500 hover:text-gray-700" />
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
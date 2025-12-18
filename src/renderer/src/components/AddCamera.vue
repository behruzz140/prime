<script setup>
import axios from "axios";
import { onMounted, ref } from "vue";
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

const open = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");

const cameraInfo = ref({
  name: "",
  ip: "",
  mac: "",
  login: "",
  password: "",
  operatorId: "",
  type: "",
});

const operators = ref([]);

const openModalHandler = (id) => {
  cameraInfo.value.operatorId = id;
  open.value = true;
};

const addCamera = async () => {
  // Barcha kerakli maydonlarni tekshirish
  if (!cameraInfo.value.name.trim()) {
    errorMessage.value = "Название камеры обязательно";
    return;
  }
  
  if (!cameraInfo.value.ip.trim()) {
    errorMessage.value = "IP-адрес обязателен";
    return;
  }
  
  if (!cameraInfo.value.operatorId) {
    errorMessage.value = "Выберите оператора";
    return;
  }
  
  if (!cameraInfo.value.type) {
    errorMessage.value = "Выберите тип камеры";
    return;
  }

  try {
    isLoading.value = true;
    errorMessage.value = "";
    
    // MAC-адресni to'ldirish majburiy emas, lekin yuborish kerak
    const dataToSend = {
      ...cameraInfo.value,
      mac: cameraInfo.value.mac || null, // Agar MAC bo'lmasa, null yuboramiz
    };
    
    await axios.post(`${ipServer}/api/camera`, dataToSend);
    
    // Modalni yopish va formani tozalash
    open.value = false;
    resetForm();
    
    // Ota komponentga hodisa yuborish (agar kerak bo'lsa)
    emit('camera-added');
    
  } catch (error) {
    console.error("Ошибка при добавлении камеры:", error);
    errorMessage.value = error.response?.data?.message || "Не удалось добавить камеру.";
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  cameraInfo.value = {
    name: "",
    ip: "",
    mac: "",
    login: "",
    password: "",
    operatorId: "",
    type: "",
  };
  errorMessage.value = "";
};

const getAllOperators = async () => {
  try {
    const { data } = await axios.get(`${ipServer}/api/operator`);
    operators.value = data;
  } catch (error) {
    console.error("Ошибка при получении операторов:", error);
    errorMessage.value = "Не удалось загрузить список операторов";
  }
};

onMounted(() => {
  getAllOperators();
  window.api.onMessage("add-camera", openModalHandler);
});

// Ota komponentga hodisa yuborish uchun
const emit = defineEmits(['camera-added']);

// Agar DialogRoot tashqaridan ochilishi kerak bo'lsa
defineExpose({
  openModal: openModalHandler
});
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-30 bg-black/50" />
      <DialogContent
        class="fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-[450px] -translate-x-1/2 -translate-y-1/2 transform rounded-md bg-white p-6 shadow-lg"
        @pointer-down-outside="() => open = false"
        @escape-key-down="() => open = false"
      >
        <div class="flex items-center justify-between mb-4">
          <DialogTitle class="text-lg font-semibold">Добавить камеру</DialogTitle>
          <DialogClose 
            class="p-1 rounded hover:bg-gray-100 transition-colors"
            @click="() => { open = false; resetForm(); }"
          >
            <Icon icon="lucide:x" class="w-5 h-5 text-gray-500" />
          </DialogClose>
        </div>

        <div class="space-y-4">
          <!-- Camera Name -->
          <div>
          
            <input
              v-model="cameraInfo.name"
              placeholder="Введите название *"
              class="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <!-- IP Address -->
          <div>
           
            <input
              v-model="cameraInfo.ip"
              placeholder="Введите IP-адрес"
              class="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              
            />
          </div>

          <!-- MAC Address (optional) -->
          <div>
            
            <input
              v-model="cameraInfo.mac"
              placeholder="Введите MAC-адрес"
              class="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Login -->
          <div>
         
            <input
              v-model="cameraInfo.login"
              placeholder="Введите логин"
              class="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Password -->
          <div>
           
            <input
              v-model="cameraInfo.password"
              placeholder="Введите пароль"
              type="password"
              class="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Operator -->
          <div>
           
            <select 
              v-model="cameraInfo.operatorId"
              class="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              
            >
              <option value="" disabled>Выберите оператора</option>
              <option 
                v-for="operator in operators" 
                :key="operator.id" 
                :value="operator.id"
              >
                {{ operator.name }}
              </option>
            </select>
          </div>

          <!-- Camera Type -->
          <div>
            <select 
              v-model="cameraInfo.type"
              class="w-full rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>Выберите тип камеры *</option>
              <option value="input">Вход</option>
              <option value="output">Выход</option>
              <option value="both">Вход/Выход</option>
            </select>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="mt-4 p-2 bg-red-50 border border-red-200 rounded">
          <p class="text-red-600 text-sm">{{ errorMessage }}</p>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex justify-end space-x-3">
          <DialogClose 
            as="button" 
            class="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            @click="resetForm"
          >
            Отмена
          </DialogClose>
          <Button 
            @click="addCamera" 
            :disabled="isLoading"
            class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div class="flex items-center space-x-2">
              <span v-if="isLoading" class="animate-spin">⟳</span>
              <span>{{ isLoading ? 'Добавление...' : 'Добавить' }}</span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>


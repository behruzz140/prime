<template>
  <DialogRoot key="open" v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-30 bg-black/50" />
      <DialogContent
        class="fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 transform rounded-md bg-white p-6 shadow-lg"
        aria-describedby=""
      >
        <!-- Sarlavha -->
        <DialogTitle class="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Icon icon="mdi:car-info" class="w-6 h-6 text-blue-500" />
          Sessiya ma'lumotlari
        </DialogTitle>

        <!-- Yuklash holati -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-8">
          <div class="relative">
            <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p class="mt-4 text-gray-600 font-medium">Ma'lumotlar yuklanmoqda...</p>
        </div>
        
        <!-- Sessiya ma'lumotlari -->
        <div v-else class="mt-2">
          <!-- Xato xabari -->
          <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-600 text-sm flex items-center gap-2">
              <Icon icon="mdi:alert-circle" class="w-5 h-5" />
              {{ errorMessage }}
            </p>
          </div>
          
          <!-- Sessiya ID va asosiy ma'lumotlar -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-blue-50 p-3 rounded-lg">
              <p class="text-xs text-gray-500 mb-1">Sessiya ID</p>
              <p class="font-bold text-blue-700">{{ sessionInfo.id || selectedId }}</p>
            </div>
            <div class="bg-green-50 p-3 rounded-lg">
              <p class="text-xs text-gray-500 mb-1">Davlat raqami</p>
              <p class="font-bold text-green-700 text-lg">{{ sessionInfo.plateNumber || 'Noma\'lum' }}</p>
            </div>
          </div>
          
          <!-- Ma'lumotlar jadvali -->
          <div class="space-y-3">
            <!-- Avtomobil turi -->
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span class="text-gray-600 font-medium flex items-center gap-2">
                <Icon icon="mdi:car" class="w-5 h-5" />
                Avtomobil turi:
              </span>
              <span class="font-medium text-gray-900">{{ sessionInfo.vehicleType || 'Avtomobil' }}</span>
            </div>
            
            <!-- Boshlanish vaqti -->
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span class="text-gray-600 font-medium flex items-center gap-2">
                <Icon icon="mdi:clock-start" class="w-5 h-5" />
                Boshlanish vaqti:
              </span>
              <div class="text-right">
                <div class="font-medium text-gray-900">{{ formatDate(sessionInfo.startTime) }}</div>
                <div class="text-sm text-gray-500">{{ formatTime(sessionInfo.startTime) }}</div>
              </div>
            </div>
            
            <!-- Tugash vaqti (agar mavjud bo'lsa) -->
            <div v-if="sessionInfo.endTime" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span class="text-gray-600 font-medium flex items-center gap-2">
                <Icon icon="mdi:clock-end" class="w-5 h-5" />
                Tugash vaqti:
              </span>
              <div class="text-right">
                <div class="font-medium text-gray-900">{{ formatDate(sessionInfo.endTime) }}</div>
                <div class="text-sm text-gray-500">{{ formatTime(sessionInfo.endTime) }}</div>
              </div>
            </div>
            
            <!-- Davomiylik -->
            <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span class="text-gray-600 font-medium flex items-center gap-2">
                <Icon icon="mdi:timer-outline" class="w-5 h-5" />
                Davomiylik:
              </span>
              <span class="font-semibold text-purple-700">
                {{ sessionInfo.duration || calculateDuration(sessionInfo.startTime, sessionInfo.endTime) }}
              </span>
            </div>
            
            <!-- Holati -->
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span class="text-gray-600 font-medium">Holati:</span>
              <span 
                :class="[
                  'px-3 py-1 rounded-full text-sm font-medium',
                  sessionInfo.isInner 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                ]"
              >
                <span class="w-2 h-2 rounded-full mr-2 inline-block" 
                  :class="sessionInfo.isInner ? 'bg-green-500' : 'bg-red-500'"
                ></span>
                {{ sessionInfo.isInner ? 'Ichkarida' : 'Chiqdi' }}
              </span>
            </div>
            
            <!-- Sinxronlash holati -->
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span class="text-gray-600 font-medium">Sinxronlash:</span>
              <span 
                :class="[
                  'px-3 py-1 rounded-full text-sm font-medium',
                  sessionInfo.isSync && !sessionInfo.isUpdated 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-yellow-100 text-yellow-800'
                ]"
              >
                {{ sessionInfo.isSync && !sessionInfo.isUpdated ? 'Sinxronlangan' : 'Kutilmoqda' }}
              </span>
            </div>
            
            <!-- To'lov summasi -->
            <div class="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span class="text-gray-600 font-medium flex items-center gap-2">
                <Icon icon="mdi:cash-multiple" class="w-5 h-5" />
                To'lov summasi:
              </span>
              <span class="font-bold text-lg text-emerald-700">
                {{ formatCurrency(sessionInfo.amount || 0) }}
              </span>
            </div>
            
            <!-- To'lov turi -->
            <div v-if="sessionInfo.paymentType" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span class="text-gray-600 font-medium">To'lov turi:</span>
              <span class="font-medium text-gray-900">{{ sessionInfo.paymentType }}</span>
            </div>
            
            <!-- Kamera raqami -->
            <div v-if="sessionInfo.cameraNumber" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span class="text-gray-600 font-medium flex items-center gap-2">
                <Icon icon="mdi:cctv" class="w-5 h-5" />
                Kamera raqami:
              </span>
              <span class="font-medium text-gray-900">{{ sessionInfo.cameraNumber }}</span>
            </div>
            
            <!-- Qo'shimcha ma'lumotlar -->
            <div v-if="sessionInfo.notes" class="p-3 bg-yellow-50 rounded-lg">
              <p class="text-xs text-gray-500 mb-1">Qo'shimcha ma'lumotlar</p>
              <p class="text-sm text-gray-700">{{ sessionInfo.notes }}</p>
            </div>
          </div>
          
          <!-- Chek chop etish tugmasi -->
          <div class="mt-6 space-y-3">
            <Button 
              @click="printReceipt" 
              variant="success" 
              class="flex w-full items-center justify-center gap-3 py-3 text-lg"
              :disabled="isLoading || isPrinting"
            >
              <Icon 
                icon="mdi:printer-outline" 
                class="w-6 h-6"
                :class="{'animate-spin': isPrinting}"
              />
              <span class="font-bold">
                {{ isPrinting ? 'Chop etilmoqda...' : 'Chekni chop etish' }}
              </span>
            </Button>
            
            <!-- Muvaffaqiyatli chop etish xabari -->
            <div v-if="printSuccess" class="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-green-600 text-sm flex items-center gap-2">
                <Icon icon="mdi:check-circle" class="w-5 h-5" />
                Chek muvaffaqiyatli printerga yuborildi!
              </p>
            </div>
            
            <!-- Chop etish xatosi -->
            <div v-if="printError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-600 text-sm flex items-center gap-2">
                <Icon icon="mdi:printer-alert" class="w-5 h-5" />
                {{ printError }}
              </p>
            </div>
          </div>
        </div>

        <!-- Yopish tugmasi -->
        <div class="mt-6 flex justify-end">
          <DialogClose as="button" class="flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-2.5 text-gray-700 hover:bg-gray-200 transition-colors">
            <Icon icon="mdi:close" class="w-5 h-5" />
            Yopish
          </DialogClose>
        </div>

        <!-- X (close) ikonkasi -->
        <DialogClose class="absolute top-4 right-4">
          <Icon 
            icon="mdi:close-circle" 
            class="w-7 h-7 text-gray-400 hover:text-gray-600 transition-colors" 
          />
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

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
const isPrinting = ref(false);
const errorMessage = ref("");
const printSuccess = ref(false);
const printError = ref("");
const sessionInfo = ref({
  id: "",
  plateNumber: "",
  startTime: "",
  endTime: "",
  vehicleType: "",
  isInner: false,
  isSync: false,
  isUpdated: false,
  amount: 0,
  paymentType: "",
  cameraNumber: "",
  notes: "",
  duration: ""
});

// Sessiya ma'lumotlarini yuklash
const loadSessionInfo = async (id) => {
  if (!id) return;
  
  try {
    isLoading.value = true;
    errorMessage.value = "";
    printSuccess.value = false;
    printError.value = "";
    
    console.log("Sessiya ma'lumotlari yuklanmoqda, ID:", id);
    
    const { data } = await axios.get(`${ipServer}/api/session/${id}`, {
      timeout: 10000
    });
    
    console.log("API Response:", data);
    
    // API responsini formatlash (har xil strukturani qo'llab-quvvatlash)
    let responseData = data;
    
    // Agar data object ichida bo'lsa
    if (data && typeof data === 'object' && data.data) {
      responseData = data.data;
    }
    
    // Sessiya ma'lumotlarini to'ldirish
    sessionInfo.value = {
      id: responseData.id || responseData.ID || id,
      plateNumber: responseData.plateNumber || responseData.plate_number || responseData.carNumber || responseData.plate || "Noma'lum",
      startTime: responseData.startTime || responseData.start_time || responseData.createdAt || responseData.start_date || "",
      endTime: responseData.endTime || responseData.end_time || responseData.endedAt || responseData.end_date || "",
      vehicleType: responseData.vehicleType || responseData.car_type || responseData.type || responseData.vehicle_type || "Avtomobil",
      isInner: responseData.isInner !== undefined ? responseData.isInner : 
              (responseData.status === "inside" || responseData.status === "active" || responseData.status === "IN"),
      isSync: responseData.isSync || responseData.synced || responseData.sync_status || false,
      isUpdated: responseData.isUpdated || responseData.updated || false,
      amount: responseData.amount || responseData.total_amount || responseData.payment || responseData.payment_amount || 0,
      paymentType: responseData.paymentType || responseData.payment_type || responseData.paymentMethod || "Naqd",
      cameraNumber: responseData.cameraNumber || responseData.camera_number || responseData.cameraId || responseData.camera_id || "",
      notes: responseData.notes || responseData.comment || responseData.description || "",
      duration: calculateDuration(
        responseData.startTime || responseData.start_time,
        responseData.endTime || responseData.end_time
      )
    };
    
    console.log("Formatlangan sessiya ma'lumotlari:", sessionInfo.value);
    
  } catch (error) {
    console.error("Sessiya ma'lumotlarini olishda xato:", error);
    errorMessage.value = error.response?.data?.message || 
                         error.response?.data?.error || 
                         "Sessiya ma'lumotlarini yuklashda xatolik yuz berdi.";
    
    // Fallback: Agar API ishlamasa, jadvaldan kelgan ma'lumotlarni saqlash
    // Bu holatda biz faqat ID va asosiy ma'lumotlarni ko'rsatamiz
    sessionInfo.value = {
      id: id,
      plateNumber: "Ma'lumot yuklanmadi",
      startTime: "",
      isInner: true,
      isSync: false,
      amount: 0,
      duration: "N/A"
    };
  } finally {
    isLoading.value = false;
  }
};

// Chekni chop etish
const printReceipt = async () => {
  if (!selectedId.value) {
    printError.value = "Sessiya ID ko'rsatilmagan";
    return;
  }
  
  try {
    isPrinting.value = true;
    printSuccess.value = false;
    printError.value = "";
    
    console.log("Chek chop etish so'rovi, Sessiya ID:", selectedId.value);
    
    const { data } = await axios.post(`${ipServer}/api/session/print/${selectedId.value}`, null, {
      timeout: 15000
    });
    
    console.log("Chek chop etish javobi:", data);
    
    // Muvaffaqiyatli javobni tekshirish
    if (data.success || data.message || (data && typeof data === 'object')) {
      printSuccess.value = true;
      
      // 3 sekunddan keyin muvaffaqiyat xabarini yashirish
      setTimeout(() => {
        printSuccess.value = false;
      }, 3000);
    } else {
      printError.value = "Printer javob bermadi";
    }
    
  } catch (error) {
    console.error("Chekni chop etishda xato:", error);
    printError.value = error.response?.data?.message || 
                      error.response?.data?.error || 
                      "Chekni chop etishda xatolik yuz berdi. Printer ulanganligini tekshiring.";
    
    // 5 sekunddan keyin xatoni yashirish
    setTimeout(() => {
      printError.value = "";
    }, 5000);
  } finally {
    isPrinting.value = false;
  }
};

// Formatlash funksiyalari
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return 'N/A';
  }
};

const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0
  }).format(amount);
};

const calculateDuration = (startTime, endTime) => {
  if (!startTime) return 'N/A';
  
  try {
    const start = new Date(startTime);
    if (isNaN(start.getTime())) return 'N/A';
    
    const end = endTime ? new Date(endTime) : new Date();
    if (endTime && isNaN(end.getTime())) return 'N/A';
    
    const diffMs = Math.abs(end - start);
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days} kun ${remainingHours} soat`;
    }
    
    if (hours === 0) {
      return `${minutes} daqiqa`;
    }
    
    return `${hours} soat ${minutes} daqiqa`;
  } catch {
    return 'N/A';
  }
};

// Watchers - modal ochilganda avtomatik yuklash
watch(
  () => open.value,
  (newVal) => {
    if (newVal && selectedId.value) {
      console.log("Modal ochildi, sessiya yuklanmoqda:", selectedId.value);
      loadSessionInfo(selectedId.value);
    } else {
      // Modal yopilganda ma'lumotlarni tozalash
      sessionInfo.value = {
        id: "",
        plateNumber: "",
        startTime: "",
        endTime: "",
        vehicleType: "",
        isInner: false,
        isSync: false,
        isUpdated: false,
        amount: 0,
        paymentType: "",
        cameraNumber: "",
        notes: "",
        duration: ""
      };
      errorMessage.value = "";
      printSuccess.value = false;
      printError.value = "";
    }
  }
);

// ID o'zgarganda ham yuklash
watch(
  () => selectedId.value,
  (newVal) => {
    if (newVal && open.value) {
      console.log("Sessiya ID o'zgardi, yangilanmoqda:", newVal);
      loadSessionInfo(newVal);
    }
  }
);
</script>

<style scoped>
/* Animatsiyalar */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.grid > div {
  animation: fadeIn 0.3s ease-out;
}

/* Stagger animatsiya */
.space-y-3 > div {
  animation: fadeIn 0.3s ease-out;
  animation-fill-mode: both;
}

.space-y-3 > div:nth-child(1) { animation-delay: 0.05s; }
.space-y-3 > div:nth-child(2) { animation-delay: 0.1s; }
.space-y-3 > div:nth-child(3) { animation-delay: 0.15s; }
.space-y-3 > div:nth-child(4) { animation-delay: 0.2s; }
.space-y-3 > div:nth-child(5) { animation-delay: 0.25s; }
.space-y-3 > div:nth-child(6) { animation-delay: 0.3s; }
.space-y-3 > div:nth-child(7) { animation-delay: 0.35s; }
.space-y-3 > div:nth-child(8) { animation-delay: 0.4s; }
.space-y-3 > div:nth-child(9) { animation-delay: 0.45s; }
.space-y-3 > div:nth-child(10) { animation-delay: 0.5s; }

/* Hover effektlari */
.space-y-3 > div:hover {
  transform: translateY(-2px);
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Modal ichidagi scroll uchun */
.DialogContent {
  max-height: 85vh;
  overflow-y: auto;
}

/* Yuklash animatsiyasi */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
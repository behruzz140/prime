<!-- ExportModal.vue -->
<template>
  <DialogRoot key="open" v-model:open="open">
    <DialogPortal>
      <DialogOverlay 
        class="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm transition-all duration-300"
      />
      <DialogContent
        class="fixed top-1/2 left-1/2 z-[10000] w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300"
        aria-describedby="export-modal-description"
        @pointer-down-outside="open = false"
        @escape-key-down="open = false"
      >
        <!-- Modal header -->
        <div class="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <DialogTitle class="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Icon icon="mdi:file-excel" class="w-6 h-6 text-green-600" />
            Excel ga export qilish
          </DialogTitle>
          <p id="export-modal-description" class="mt-1 text-sm text-gray-600">
            Tanlangan sana oralig'idagi sessiyalarni Excel fayliga yuklab olish
          </p>
        </div>

        <!-- Modal body -->
        <div class="p-6 space-y-6">
          <!-- Tez tanlash tugmalari -->
          <div>
            <h3 class="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Icon icon="mdi:clock-fast" class="w-4 h-4" />
              Tez tanlash
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                @click="setToday"
                type="button"
                class="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Icon icon="mdi:calendar-today" class="w-5 h-5 mb-1" />
                <span class="text-xs font-medium">Bugun</span>
              </button>
              <button
                @click="setYesterday"
                type="button"
                class="flex flex-col items-center justify-center p-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Icon icon="mdi:calendar-blank" class="w-5 h-5 mb-1" />
                <span class="text-xs font-medium">Kecha</span>
              </button>
              <button
                @click="setLastWeek"
                type="button"
                class="flex flex-col items-center justify-center p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl border border-green-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Icon icon="mdi:calendar-week" class="w-5 h-5 mb-1" />
                <span class="text-xs font-medium">1 hafta</span>
              </button>
              <button
                @click="setLastMonth"
                type="button"
                class="flex flex-col items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl border border-purple-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Icon icon="mdi:calendar-month" class="w-5 h-5 mb-1" />
                <span class="text-xs font-medium">1 oy</span>
              </button>
            </div>
          </div>

          <!-- Vaqt oralig'i -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Icon icon="mdi:calendar-start" class="w-4 h-4" />
                Boshlanish sanasi
              </label>
              <div class="relative">
                <input
                  v-model="dateRange.start"
                  type="date"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :max="dateRange.end"
                />
                <Icon 
                  icon="mdi:calendar" 
                  class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none"
                />
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Icon icon="mdi:calendar-end" class="w-4 h-4" />
                Tugash sanasi
              </label>
              <div class="relative">
                <input
                  v-model="dateRange.end"
                  type="date"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  :min="dateRange.start"
                />
                <Icon 
                  icon="mdi:calendar" 
                  class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none"
                />
              </div>
            </div>
          </div>

          <!-- Tanlangan oralikni ko'rsatish -->
          <div v-if="dateRange.start && dateRange.end" 
            class="p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Tanlangan sana oralig'i:</span>
              <span class="font-medium text-gray-800">
                {{ formatDate(dateRange.start) }} - {{ formatDate(dateRange.end) }}
              </span>
            </div>
            <div class="mt-1 text-xs text-gray-500">
              (Boshlanish: {{ getDayName(dateRange.start) }}, Tugash: {{ getDayName(dateRange.end) }})
            </div>
          </div>

          <!-- Asosiy export tugmasi -->
          <button
            @click="handleExport"
            :disabled="!dateRange.start || !dateRange.end || isLoading"
            type="button"
            class="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon 
              :icon="isLoading ? 'mdi:loading' : 'mdi:file-excel'" 
              class="w-6 h-6"
              :class="{'animate-spin': isLoading}"
            />
            <span v-if="isLoading">Yuklanmoqda...</span>
            <span v-else>Excel ga yuklab olish</span>
          </button>
        </div>

        <!-- Modal footer -->
        <div class="border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="text-xs text-gray-500 flex items-center gap-2">
              <Icon icon="mdi:information" class="w-4 h-4" />
              Tanlangan sana oralig'idagi barcha sessiyalar
            </div>
            
            <DialogClose 
              as="button" 
              @click="open = false"
              class="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Bekor qilish
            </DialogClose>
          </div>
        </div>

        <!-- Yopish tugmasi -->
        <DialogClose 
          as="button"
          @click="open = false"
          class="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Modalni yopish"
        >
          <Icon icon="lucide:x" class="w-5 h-5 text-gray-500 hover:text-gray-700" />
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup>
import { ref, watch } from 'vue'
import { 
  DialogContent, 
  DialogOverlay, 
  DialogPortal, 
  DialogRoot, 
  DialogTitle, 
  DialogClose 
} from 'radix-vue'
import { Icon } from '@iconify/vue'

// Props
const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['export'])

// State
const open = defineModel({
  default: false,
})

const dateRange = ref({
  start: '',
  end: ''
})

// Sana formatlash (faqat kun, oy, yil)
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// Hafta kunini olish
const getDayName = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  return days[date.getDay()];
}

// Modal ochilganda default datelarni sozlash
watch(open, (newVal) => {
  if (newVal) {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    // Format: YYYY-MM-DD (faqat sana)
    dateRange.value.end = now.toISOString().split('T')[0];
    dateRange.value.start = oneMonthAgo.toISOString().split('T')[0];
  } else {
    // Modal yopilganda reset qilish
    dateRange.value = { start: '', end: '' };
  }
}, { immediate: true });

// Tez tanlash funksiyalari (faqat sana uchun)
const setLastMonth = () => {
  const now = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(now.getMonth() - 1);
  
  dateRange.value.end = now.toISOString().split('T')[0];
  dateRange.value.start = oneMonthAgo.toISOString().split('T')[0];
}

const setLastWeek = () => {
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);
  
  dateRange.value.end = now.toISOString().split('T')[0];
  dateRange.value.start = oneWeekAgo.toISOString().split('T')[0];
}

const setToday = () => {
  const now = new Date();
  
  dateRange.value.end = now.toISOString().split('T')[0];
  dateRange.value.start = now.toISOString().split('T')[0];
}

const setYesterday = () => {
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  
  dateRange.value.end = yesterday.toISOString().split('T')[0];
  dateRange.value.start = yesterday.toISOString().split('T')[0];
}

// Exportni boshlash
const handleExport = () => {
  if (!dateRange.value.start || !dateRange.value.end) {
    alert('Iltimos, sana oralig\'ini to\'liq tanlang');
    return;
  }
  
  // Vaqtlar to'g'riligini tekshirish
  const startDate = new Date(dateRange.value.start);
  const endDate = new Date(dateRange.value.end);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    alert('Noto\'g\'ri sana formati. Iltimos, qayta tanlang');
    return;
  }
  
  if (startDate > endDate) {
    alert('Boshlanish sanasi tugash sanasidan oldin bo\'lishi kerak');
    return;
  }
  
  // Export hodisasini emit qilish
  emit('export', { 
    ...dateRange.value 
  });
}
</script>

<style scoped>
/* Modal animatsiyalari */
:deep(.DialogContent) {
  animation: contentShow 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

:deep(.DialogOverlay) {
  animation: overlayShow 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes overlayShow {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes contentShow {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

/* Input elementlari uchun scrollbar */
input[type="date"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.6;
  filter: invert(0.5);
}

input[type="date"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

/* Tugmalar uchun focus holati */
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>
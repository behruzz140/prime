<template>
  <div class="p-4">
    <!-- Toaster uchun container -->
    <div class="toast-container">
      <ToastNotification
        v-if="toast.show"
        :message="toast.message"
        :type="toast.type"
        :duration="toast.duration"
        @close="toast.show = false"
      />
    </div>
    
    <!-- Sarlavha va boshqaruv paneli -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <h2 class="text-2xl font-bold text-gray-800">
        Avtoturargoh sessiyalari 
        <span class="text-blue-600">{{ sessionStore.total }}</span>
      </h2>
      
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <!-- Qidiruv maydoni -->
        <div class="relative flex-1 min-w-[250px]">
          <input
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="Davlat raqami orqali qidiring..."
            class="w-full rounded-lg border border-gray-300 px-2 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <Icon 
            icon="mdi:magnify" 
            class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
          />
        </div>
        
        <!-- Export tugmasi -->
        <button
          @click="isExportModalOpen = true"
          :disabled="isExporting"
          class="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon 
            icon="mdi:file-excel" 
            class="w-5 h-5"
            :class="{'animate-spin': isExporting}"
          />
          <span class="font-medium">
            {{ isExporting ? 'Yuklanmoqda...' : 'Excel export' }}
          </span>
        </button>
      </div>
    </div>
    
    <!-- Yuklash holati -->
    <div v-if="isLoading && sessionStore.sessions.length === 0" class="flex flex-col items-center justify-center py-12">
      <div class="relative">
        <div class="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <Icon 
          icon="mdi:parking" 
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600 w-8 h-8"
        />
      </div>
      <p class="mt-4 text-gray-600 font-medium">Sessiyalar yuklanmoqda...</p>
    </div>
    
    <!-- Jadval -->
    <div v-else-if="sessionStore.sessions.length > 0" class="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table class="min-w-full divide-y divide-gray-200 bg-white">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">№</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Davlat raqami</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Boshlanish vaqti</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holati</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sinxronlash</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To'lov summasi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="session in sessionStore.sessions"
            :key="session.id"
            @click="openSession(session.id)"
            class="hover:bg-blue-50 cursor-pointer transition-colors group"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {{ session.id }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ session.plateNumber || 'Noma\'lum' }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ session.vehicleType || 'Avtomobil' }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                {{ formatDate(session.startTime) }}
              </div>
              <div class="text-sm text-gray-500">
                {{ formatTime(session.startTime) }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                :class="[
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                  session.isInner 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                ]"
              >
                <span class="w-2 h-2 rounded-full mr-2" 
                  :class="session.isInner ? 'bg-green-500' : 'bg-red-500'"
                ></span>
                {{ session.isInner ? 'Ichkarida' : 'Chiqdi' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                :class="[
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                  session.isSync && !session.isUpdated 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                ]"
              >
                {{ session.isSync && !session.isUpdated ? "Sinxronlangan" : "Kutilmoqda" }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-semibold text-gray-900">
                {{ formatCurrency(session.amount || 0) }}
              </div>
              <div class="text-xs text-gray-500">
                {{ session.paymentType || 'Naqd' }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Bo'sh holat -->
    <div v-else-if="!isLoading" class="flex flex-col items-center justify-center py-12 text-center">
      <Icon 
        icon="mdi:database-off" 
        class="w-16 h-16 text-gray-300 mb-4"
      />
      <h3 class="text-lg font-medium text-gray-700 mb-2">Sessiyalar topilmadi</h3>
      <p class="text-gray-500 max-w-md">
        {{ searchQuery ? 'Sizning qidiruvingizga mos sessiyalar topilmadi' : 'Hozircha sessiyalar mavjud emas' }}
      </p>
      <!-- Sessiyalarni qayta yuklash tugmasi -->
      <button
        @click="refreshSessions"
        class="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <Icon icon="mdi:refresh" class="w-5 h-5" />
        Qayta yuklash
      </button>
    </div>
    
    <!-- Infinite scroll marker -->
    <div 
      v-if="sessionStore.sessions.length > 0 && (sessionStore.sessions.length < sessionStore.total)"
      id="load-more" 
      class="h-20 flex items-center justify-center"
    >
      <div v-if="isLoading" class="flex items-center gap-2 text-gray-600">
        <div class="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span>Qo'shimcha yuklanmoqda...</span>
      </div>
    </div>
    
    <!-- Modal komponentlari -->
    <SessionInfo v-model="isSession" v-model:selected="selectedSession" />
    <ExportModal 
      v-model="isExportModalOpen" 
      @export="handleExport"
      :is-loading="isExporting"
    />
  </div>
</template>

<script setup>
import axios from "axios";
import { ipServer } from "@/config";
import { useSessionsStore } from "@/store/SessionsStore";
import { socket } from "@/helpers";
import { onMounted, ref, watch, nextTick } from "vue";
import * as XLSX from 'xlsx';
import SessionInfo from "./SessionInfo.vue";
import ExportModal from "./ExportModal.vue";
import ToastNotification from "@/components/ToastNotification.vue";
import { Icon } from '@iconify/vue';

const sessionStore = useSessionsStore();
const page = ref(1);
const size = ref(20);
const observer = ref(null);
const isSession = ref(false);
const selectedSession = ref(null);
const searchQuery = ref("");
const searchPage = ref(1);
const searchObserver = ref(null);
const isLoading = ref(false);
const isExportModalOpen = ref(false);
const isExporting = ref(false);
const debounceTimer = ref(null);

// Toaster uchun state
const toast = ref({
  show: false,
  message: '',
  type: 'info', // success, error, warning, info
  duration: 3000
});

// Toaster ko'rsatish funksiyasi
const showToast = (message, type = 'info', duration = 3000) => {
  toast.value = {
    show: true,
    message,
    type,
    duration
  };
  
  // Avvalgi toaster'ni yopish
  setTimeout(() => {
    if (toast.value.show) {
      toast.value.show = false;
    }
  }, duration);
};

// Socket hodisalari
socket.on("newSession", async (info) => {
  try {
    console.log("Yangi sessiya:", info);
    // Store'ga yangi sessiyani qo'shamiz
    if (info && typeof info === 'object') {
      if (sessionStore.addSession) {
        sessionStore.addSession(info);
      } else {
        sessionStore.sessions = [info, ...sessionStore.sessions];
        sessionStore.total += 1;
      }
      // Yangi sessiya qo'shilganini bildirish
      showToast(`Yangi sessiya qo'shildi: ${info.plateNumber || 'Noma\'lum'}`, 'success', 2000);
    }
  } catch (error) {
    console.error("Yangi sessiya qo'shishda xato:", error);
    showToast(`Yangi sessiya qo'shishda xato: ${error.message}`, 'error');
  }
});

socket.on("printEvent", async (info) => {
  try {
    console.log("Chop etish so'rovi:", info);
    window.api.send("print-receipt", info);
    showToast('Chek chop etish so\'rovi yuborildi', 'info', 1500);
  } catch (error) {
    console.error("Chop etishda xato:", error);
    showToast(`Chop etishda xato: ${error.message}`, 'error');
  }
});

// Sessiyalarni olish
const getAllSession = async () => {
  if (sessionStore.totalPages !== 0 && page.value > sessionStore.totalPages) return;
  
  try {
    isLoading.value = true;
    const { data } = await axios.get(`${ipServer}/api/session`, {
      params: { 
        page: page.value, 
        size: size.value 
      },
      timeout: 10000
    });
    
    console.log("API Response:", data);
    
    if (!data) {
      console.error("API responsi bo'sh");
      showToast('API responsi bo\'sh', 'error');
      return;
    }
    
    let sessionsData = [];
    let total = 0;
    let totalPages = 0;
    
    if (Array.isArray(data)) {
      sessionsData = data;
      total = data.length;
      totalPages = Math.ceil(data.length / size.value);
    } else if (data.data && Array.isArray(data.data)) {
      sessionsData = data.data;
      total = data.total || data.count || sessionsData.length;
      totalPages = data.totalPages || data.pages || Math.ceil(total / size.value);
    } else if (data.success && Array.isArray(data.data)) {
      sessionsData = data.data;
      total = data.total || sessionsData.length;
      totalPages = data.totalPages || Math.ceil(total / size.value);
    }
    
    const newSessions = sessionsData.filter(
      s => !sessionStore.sessions.some(existing => existing.id === s.id)
    );
    
    console.log("Yangi sessiyalar:", newSessions.length);
    
    if (page.value === 1) {
      sessionStore.setSessions(sessionsData);
    } else {
      sessionStore.setSessions([...sessionStore.sessions, ...newSessions]);
    }
    
    sessionStore.total = total;
    sessionStore.totalPages = totalPages;
    page.value++;
    
    if (page.value === 2) {
      showToast(`${total} ta sessiya yuklandi`, 'success', 2000);
    }
    
  } catch (error) {
    console.error("Sessiyalarni olishda xato:", error);
    showToast(`Sessiyalarni yuklashda xatolik: ${error.message}`, 'error');
  } finally {
    isLoading.value = false;
  }
};

// Qidiruvni amalga oshirish
const searchSessions = async () => {
  searchPage.value = 1;
  
  if (!searchQuery.value.trim()) {
    page.value = 1;
    sessionStore.setSessions([]);
    await nextTick();
    setupObserver();
    getAllSession();
    return;
  }

  try {
    observer.value?.disconnect();
    isLoading.value = true;

    const { data } = await axios.get(`${ipServer}/api/session`, {
      params: { 
        search: searchQuery.value.trim(), 
        page: searchPage.value, 
        size: size.value 
      },
      timeout: 10000
    });
    
    console.log("Qidiruv natijasi:", data);
    
    let sessionsData = [];
    if (Array.isArray(data)) {
      sessionsData = data;
    } else if (data.data && Array.isArray(data.data)) {
      sessionsData = data.data;
    } else if (data.success && Array.isArray(data.data)) {
      sessionsData = data.data;
    }
    
    sessionStore.setSessions(sessionsData);
    sessionStore.total = sessionsData.length;
    sessionStore.totalPages = Math.ceil(sessionsData.length / size.value);
    
    searchPage.value++;
    setupSearchObserver();
    
    showToast(`${sessionsData.length} ta natija topildi`, 'info', 2000);
    
  } catch (error) {
    console.error("Qidiruvda xato:", error);
    showToast(`Qidiruvda xatolik: ${error.message}`, 'error');
  } finally {
    isLoading.value = false;
  }
};

// Qidiruvni debounce qilish
const handleSearch = () => {
  clearTimeout(debounceTimer.value);
  debounceTimer.value = setTimeout(() => {
    searchSessions();
  }, 500);
};

// Qo'shimcha qidiruv natijalarini yuklash
const loadMoreSearchResults = async () => {
  if (!searchQuery.value.trim()) return;
  if (searchPage.value > sessionStore.totalPages) return;
  
  try {
    isLoading.value = true;
    const { data } = await axios.get(`${ipServer}/api/session`, {
      params: { 
        search: searchQuery.value.trim(), 
        page: searchPage.value, 
        size: size.value 
      },
      timeout: 10000
    });

    let sessionsData = [];
    if (Array.isArray(data)) {
      sessionsData = data;
    } else if (data.data && Array.isArray(data.data)) {
      sessionsData = data.data;
    } else if (data.success && Array.isArray(data.data)) {
      sessionsData = data.data;
    }

    const newSessions = sessionsData.filter(
      s => !sessionStore.sessions.some(existing => existing.id === s.id)
    );
    
    sessionStore.setSessions([...sessionStore.sessions, ...newSessions]);
    searchPage.value++;
    
    showToast(`Qo'shimcha ${newSessions.length} ta natija yuklandi`, 'info', 1500);
    
  } catch (error) {
    console.error("Qo'shimcha yuklashda xato:", error);
    showToast(`Qo'shimcha yuklashda xatolik: ${error.message}`, 'error');
  } finally {
    isLoading.value = false;
  }
};

// Sessiyalarni yangilash
const refreshSessions = () => {
  page.value = 1;
  sessionStore.setSessions([]);
  getAllSession();
  showToast('Sessiyalar yangilanmoqda...', 'info', 1500);
};

// Sessiyani ochish
const openSession = (id) => {
  isSession.value = true;
  selectedSession.value = id;
};

// Intersection Observer sozlamalari
const setupObserver = () => {
  if (observer.value) observer.value.disconnect();

  observer.value = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading.value && sessionStore.sessions.length < sessionStore.total) {
        getAllSession();
      }
    },
    { threshold: 0.1 }
  );

  const loadMoreElement = document.querySelector("#load-more");
  if (loadMoreElement) {
    observer.value.observe(loadMoreElement);
  }
};

const setupSearchObserver = () => {
  if (searchObserver.value) searchObserver.value.disconnect();

  searchObserver.value = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading.value && sessionStore.sessions.length < sessionStore.total) {
        loadMoreSearchResults();
      }
    },
    { threshold: 0.1 }
  );

  const loadMoreElement = document.querySelector("#load-more");
  if (loadMoreElement) {
    searchObserver.value.observe(loadMoreElement);
  }
};

// Excel export funksiyasi
const exportToExcel = async (dateRange) => {
  try {
    isExporting.value = true;
    
    console.log('Export boshlanishi:', dateRange);
    
    let allSessions = [];
    let currentPage = 1;
    const pageSize = 100;
    
    // Barcha sahifalarni yuklash
    while (true) {
      try {
        console.log(`Sahifa ${currentPage} yuklanmoqda...`);
        
        const { data } = await axios.get(`${ipServer}/api/session`, {
          params: {
            page: currentPage,
            size: pageSize
          },
          timeout: 15000
        });
        
        let sessionsData = [];
        if (Array.isArray(data)) {
          sessionsData = data;
        } else if (data.data && Array.isArray(data.data)) {
          sessionsData = data.data;
        } else if (data.success && Array.isArray(data.data)) {
          sessionsData = data.data;
        }
        
        if (!sessionsData || sessionsData.length === 0) {
          console.log('Sahifalar tugadi');
          break;
        }
        
        // Vaqt oralig'iga filtr qilish
        const filteredSessions = sessionsData.filter(session => {
          if (!session.startTime) return false;
          
          const sessionDate = new Date(session.startTime);
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          
          return sessionDate >= startDate && sessionDate <= endDate;
        });
        
        allSessions = [...allSessions, ...filteredSessions];
        
        console.log(`Sahifa ${currentPage}: ${filteredSessions.length} ta filtrlandi (jami: ${sessionsData.length})`);
        
        // Agar keyingi sahifa bo'lmasa, to'xtatish
        if (currentPage >= 10 || sessionsData.length < pageSize) {
          break;
        }
        
        currentPage++;
        
      } catch (error) {
        console.error('Sahifani olishda xato:', error);
        break;
      }
    }
    
    console.log(`Jami topildi: ${allSessions.length} ta`);
    
    // TOASTER XABARI - Hech qanday sessiya topilmasa
    if (allSessions.length === 0) {
      showToast('Tanlangan vaqt oralig\'ida hech qanday sessiya topilmadi', 'warning', 4000);
      return;
    }
    
    // Ma'lumotlarni formatlash
    const formattedData = allSessions.map((session, index) => ({
      'T/r': index + 1,
      'ID': session.id,
      'Davlat raqami': session.plateNumber || 'N/A',
      'Avtomobil turi': session.vehicleType || 'Noma\'lum',
      'Boshlanish vaqti': session.startTime 
        ? new Date(session.startTime).toLocaleString('uz-UZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        : 'N/A',
      'Tugash vaqti': session.endTime 
        ? new Date(session.endTime).toLocaleString('uz-UZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        : 'Hali chiqmagan',
      'Davomiylik': calculateDuration(session.startTime, session.endTime),
      'Holati': session.isInner ? 'Ichkarida' : 'Chiqdi',
      'To\'lov summasi': session.amount || 0,
      'To\'lov turi': session.paymentType || 'Naqd',
      'To\'lov holati': session.paymentStatus || 'To\'lanmagan',
      'Kamera raqami': session.cameraNumber || 'N/A',
      'Sinxronlash': session.isSync && !session.isUpdated ? 'Ha' : 'Yo\'q'
    }));
    
    // Worksheet yaratish
    const ws = XLSX.utils.json_to_sheet(formattedData);
    
    // Workbook yaratish
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sessiyalar");
    
    // Ustun kengliklarini sozlash
    const wscols = [
      { wch: 5 },
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
    ];
    ws['!cols'] = wscols;
    
    // Faylni yaratish va yuklab olish
    const excelBuffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'array' 
    });
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const startDateStr = formatDateForFileName(dateRange.start);
    const endDateStr = formatDateForFileName(dateRange.end);
    const fileName = `parking_sessions_${startDateStr}_${endDateStr}.xlsx`;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    // TOASTER XABARI - Muvaffaqiyatli export
    showToast(`✅ ${allSessions.length} ta sessiya Excel fayliga yuklab olindi!`, 'success', 4000);
    
  } catch (error) {
    console.error('Export jarayonida xato:', error);
    
    // TOASTER XABARI - Xatolik
    showToast(`❌ Excel faylini yuklab olishda xatolik:\n${error.message}`, 'error', 5000);
    
  } finally {
    isExporting.value = false;
    isExportModalOpen.value = false;
  }
};

// Qo'shimcha yordamchi funksiyalar
const calculateDuration = (startTime, endTime) => {
  if (!startTime) return 'N/A';
  
  try {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    const diffMs = Math.abs(end - start);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days} kun ${remainingHours} soat`;
    }
    
    return `${hours} soat ${minutes} daqiqa`;
  } catch {
    return 'N/A';
  }
};

const formatDateForFileName = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString().slice(0, 10).replace(/-/g, '');
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
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

// Exportni boshlash
const handleExport = (dateRange) => {
  console.log('Export so\'rovi qabul qilindi:', dateRange);
  exportToExcel(dateRange);
};

// Lifecycle hooks
onMounted(() => {
  getAllSession();
  setTimeout(() => {
    setupObserver();
  }, 300);
});

// Search query'ni kuzatish
watch(searchQuery, (newVal) => {
  if (!newVal.trim()) {
    page.value = 1;
    sessionStore.setSessions([]);
    setTimeout(() => {
      setupObserver();
      getAllSession();
    }, 100);
  }
});
</script>

<style scoped>
/* Animatsiyalar uchun */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

tbody tr {
  animation: fadeIn 0.3s ease-out;
}

/* Scroll uchun */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Table hover effektlari */
tbody tr {
  transition: all 0.2s ease;
}

tbody tr:hover {
  background-color: #f0f9ff;
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Toaster container */
.toast-container {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9999;
}
</style>
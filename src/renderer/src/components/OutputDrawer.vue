<script setup>
  import { useToast } from "../composables/useToast";
  import axios from "axios";
  import { ipServer, tariffs } from "@/config";
  import { ref, watch, onMounted } from "vue";

  import { useAppStore } from "@/store";
  const { success, error: showError } = useToast();
  const appStore = useAppStore();
  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
    newCar: {
      type: Object,
      required: true,
    },
  });

  const cameras = ref([]);
  const selectCam = ref(null);
  const checkId = ref("");
  const isClicked = ref(false);
  const mac_address = ref(null);
  const is_printer = ref(0);

  const advantages = ref([]);
  const selectedAdvantage = ref(null);
  const isAdvantageSelected = ref(false);

  const emit = defineEmits(["update:modelValue", "update:newCar"]);
  const isOpen = ref(props.modelValue);
  // const isOpen = true;

  // newCar uchun lokal nusxa yaratamiz
  const localNewCar = ref({ ...props.newCar });

  watch(
    () => props.newCar,
    async (newValue) => {
      localNewCar.value = { ...newValue, ...newValue.session };
      const { data } = await axios.get(
        `https://raqamli-bozor.uz/services/platon-core/api/v1/desktop/pms/car/sum?mac_address=${mac_address.value}&car_number=${newValue.number}`,
        {
          headers: {
            Authorization: "Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1",
          },
        }
      );

      localNewCar.value.price = data.data.sum;
      localNewCar.value.startTime = data.data.enter_time;
      localNewCar.value.exitTime = data.data.exit_time;
      selectedAdvantage.value = null;
      isAdvantageSelected.value = false;
      const info = await axios.get(
        "https://raqamli-bozor.uz/services/platon-core/api/v1/desktop/pms/types/public_servants",
        {
          headers: {
            Authorization: "Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1",
          },
        }
      );

      advantages.value = info.data.data;
    },
    { immediate: true }
  );

  const getCams = async (operator) => {
    try {
      const { data } = await axios.get(`${ipServer}/api/camera/operators/${operator}`);
      cameras.value = data;
      selectCam.value = data.length > 0 ? data[0].ip : null;
    } catch (err) {
      console.error(err);
      showError("Xato", "Kameralarni yuklab bo'lmadi");
    }
  };

  watch(
    () => appStore.selectedOperator,
    (newValue) => {
      if (newValue) getCams(newValue);
    }
  );

  watch(
    () => props.modelValue,
    (newValue) => {
      isOpen.value = newValue;
    }
  );

  watch(isOpen, (newValue) => {
    emit("update:modelValue", newValue);
    checkId.value = "";
  });

  const addSessionHandler = async () => {
    try {
      const { number, plateImage, fullImage, paymentMethod, tariffType, price, id } =
        localNewCar.value;

      isClicked.value = true;

      if (typeof price != "number" && price <= 0) {
        showError("Xato", "Barcha majburiy maydonlarni to'ldiring");
        isOpen.value = false;
        isClicked.value = false;
        return;
      }

      try {
        await axios.post(`${ipServer}/api/open`, localNewCar.value);
        success("Muvaffaqiyatli!", "Amal muvaffaqiyatli bajarildi");
        isOpen.value = false;
        isClicked.value = false;
      } catch (err) {
        console.error(err, "xatolik================================");
        isClicked.value = false;
        showError("Xato", "Amalni yakunlab bo'lmadi");
      }
    } catch (error) {
      console.error(error);
      isClicked.value = false;
    }
  };

  const setAdvantage = async () => {
    if (!selectedAdvantage.value) {
      showError("Xato", "Imtiyoz tanlang");
      return;
    }

    try {
      const { data } = await axios.post(
        `https://raqamli-bozor.uz/services/platon-core/api/v1/desktop/pms/public_servants`,
        {
          car_number: localNewCar.value.number,
          inserted_at: localNewCar.value.startTime,
          mac_address: mac_address.value,
          id: selectedAdvantage.value,
        },
        {
          headers: {
            Authorization: "Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1",
          },
        }
      );

      isAdvantageSelected.value = true;
      localNewCar.value.price = 0;
      success("Muvaffaqiyatli", "Imtiyoz qo'shildi");
    } catch (err) {
      console.error(err);
      showError("Xato", "Imtiyoz qo'shishda xatolik yuz berdi");
    }
  };

  const getCheckData = async () => {
    if (!checkId.value) {
      showError("Xato", "Chek raqamini kiriting");
      return;
    }

    try {
      const { data } = await axios.get(
        `${ipServer}/api/output/${checkId.value}?cameraIp=${selectCam.value}`
      );

      if (data.eventName === "payedToday") isOpen.value = false;

      if (data) {
        console.log("data", data);
        localNewCar.value = {
          ...data.session,
          price: data.price,
          fullImage: data.fullImage,
        };
      }
      // Lokal nusxani yangilaymiz va o'zgarishlarni ota komponentga yuboramiz

      emit("update:newCar", localNewCar.value);
    } catch (err) {
      console.error(err);
      showError("Xato", "Chek bo'yicha ma'lumot topilmadi");
    }
  };

  watch(selectCam, (newValue) => {
    if (newValue && checkId.value) getCheckData();
  });

  onMounted(async () => {
    const mac = await axios.get(`${ipServer}/api/mac`);
    mac_address.value = mac.data.mac;
    is_printer.value = mac.data.is_printer;

    getCams(appStore.selectedOperator);
  });
</script>

<template>
  <Drawer title="Yangi chiqish" v-model="isOpen" position="right">
    <div class="rows">
      <div class="row" v-if="localNewCar.number">
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          <span>Davlat raqami:</span>
        </div>
        <span class="flex items-center">
          <CarPlate :plateNumber="localNewCar.number" />
        </span>
      </div>
      <div v-else>
        <form @submit.prevent="getCheckData" class="flex gap-2">
          <div class="relative flex-1">
            <svg class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input placeholder="Chek raqamini kiriting" v-model="checkId" class="pl-10" />
          </div>
          <Button type="submit" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Qidirish
          </Button>
        </form>
      </div>
    </div>

    <div class="fixed-button">
      <SubTitle class="flex items-center gap-2">
        <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Chek: <span class="font-semibold text-gray-800">{{ localNewCar.id }}</span>
      </SubTitle>
      
      <SubTitle class="flex items-center gap-2">
        <svg class="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Kirgan vaqti: <span class="font-semibold text-gray-800">{{ localNewCar.startTime }}</span>
      </SubTitle>
      
      <SubTitle v-if="localNewCar.exitTime" class="flex items-center gap-2">
        <svg class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        Chiqgan vaqti: <span class="font-semibold text-gray-800">{{ localNewCar.exitTime }}</span>
      </SubTitle>
      
      <SubTitle class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Umumiy to'lov:
        </div>
        <span style="font-size: 36px" class="font-bold text-green-700">
          {{
            typeof localNewCar.price == "number"
              ? `${localNewCar.price + " so'm"}`
              : localNewCar.price
          }}
        </span>
      </SubTitle>
      
      <SubTitle v-if="advantages.length && !isAdvantageSelected" class="flex items-center gap-2">
        <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Imtiyoz:
      </SubTitle>
      
      <select
        v-if="advantages.length && !isAdvantageSelected"
        v-model="selectedAdvantage"
        class="mb-2 w-full rounded-lg border-2 border-gray-300 bg-white p-3 text-black shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
        placeholder="Imtiyoz tanlang"
      >
        <option value="" disabled selected>Imtiyoz tanlang</option>
        <option v-for="advantage in advantages" :key="advantage.id" :value="advantage.id">
          {{ advantage.name }}
        </option>
      </select>
      
      <Button
        v-if="advantages.length && !isAdvantageSelected"
        @click="setAdvantage"
        variant="success"
        class="m0 flex w-[180px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Imtiyoz qo'shish
      </Button>

      <Button
        @click="addSessionHandler"
        :disabled="isClicked"
        v-if="is_printer"
        variant="success"
        class="mt-4 h-[52px] flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 py-3 text-base font-semibold hover:from-green-700 hover:to-emerald-700"
      >
        <svg v-if="isClicked" class="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <Icon icon="material-symbols:output-circle" />
        {{ isClicked ? 'Ishlanmoqda...' : 'Darvozani ochish' }}
      </Button>
    </div>
  </Drawer>
</template>

<style scoped>
  @reference "@/assets/main.css";

  .rows {
    @apply flex flex-col gap-4;
  }

  .row {
    @apply flex items-center justify-between gap-2 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 p-4 shadow-sm;
    border-left: 4px solid #3b82f6;
  }

  .sub-title {
    @apply my-4 text-lg font-semibold;
  }
  
  .fixed-button {
    @apply right-0 bottom-10 left-0 border-t-2 border-gray-200 bg-gradient-to-b from-white to-gray-50 px-4 pb-6 pt-4;
  }

  .camera-card {
    @apply cursor-pointer rounded-lg border-2 border-gray-200 p-4 text-center transition-all hover:border-blue-500 hover:bg-blue-50;
  }
  
  .camera-selector {
    @apply grid grid-cols-2 gap-4;
  }
  
  .camera-card.selected {
    @apply border-blue-500 bg-blue-100 shadow-md;
  }
</style>
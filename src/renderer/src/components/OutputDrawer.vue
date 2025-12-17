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
        <span>Davlat raqami:</span>
        <span class="flex items-center">
          <CarPlate :plateNumber="localNewCar.number" />
        </span>
      </div>
      <div v-else>
        <form @submit.prevent="getCheckData" class="flex gap-2">
          <Input placeholder="Chek raqamini kiriting" v-model="checkId" />
          <Button type="submit">Qidirish</Button>
        </form>
      </div>
    </div>

    <!-- <PaymentSelector v-model="localNewCar.paymentMethod" /> -->

    <div class="fixed-button">
      <SubTitle>Chek: {{ localNewCar.id }}</SubTitle>
      <SubTitle>Kirgan vaqti: {{ localNewCar.startTime }}</SubTitle>
      <SubTitle v-if="localNewCar.exitTime">Chiqgan vaqti: {{ localNewCar.exitTime }}</SubTitle>
      <SubTitle class="flex justify-between">
        Umumiy to'lov:
        <span style="font-size: 36px" class="font-bold text-black">
          {{
            typeof localNewCar.price == "number"
              ? `${localNewCar.price + " so'm"}`
              : localNewCar.price
          }}
        </span>
      </SubTitle>
      <SubTitle v-if="advantages.length && !isAdvantageSelected">Imtiyoz:</SubTitle>
      <select
        v-if="advantages.length && !isAdvantageSelected"
        v-model="selectedAdvantage"
        class="mb-2 w-full rounded border border-black p-2 text-black"
        placeholder="Imtiyoz tanlang"
      >
        <option v-for="advantage in advantages" :key="advantage.id" :value="advantage.id">
          {{ advantage.name }}
        </option>
      </select>
      <Button
        v-if="advantages.length && !isAdvantageSelected"
        @click="setAdvantage"
        variant="success"
        class="mt-4 flex w-1/2 items-center justify-center gap-2"
      >
        Imtiyoz qo'shish
      </Button>

      <Button
        @click="addSessionHandler"
        :disabled="isClicked"
        v-if="is_printer"
        variant="success"
        class="mt-4 flex w-full items-center justify-center gap-2"
      >
        <Icon icon="material-symbols:output-circle" />
        Darvozani ochish
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
    @apply flex items-center justify-between gap-2 rounded-md bg-blue-100 p-4;
  }

  .sub-title {
    @apply my-4 text-lg font-semibold;
  }
  .fixed-button {
    @apply right-0 bottom-10 left-0 border-t-2 border-gray-200 bg-white px-4 pb-4;
  }

  .camera-card {
    @apply cursor-pointer rounded-lg border-2 border-gray-200 p-4 text-center;
  }
  .camera-selector {
    @apply grid grid-cols-2 gap-4;
  }
  .camera-card.selected {
    @apply border-blue-500 bg-blue-100;
  }
</style>

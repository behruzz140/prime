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

  const open = ref(false);
  const isLoading = ref(false);
  const errorMessage = ref("");

  const macInfo = ref({
    mac: "",
  });

  const openModalHandler = () => {
    open.value = true;
  };

  const addMac = async () => {
    if (macInfo.value.password !== "Waterman1$") {
      errorMessage.value = "Неверный пароль.";
      return;
    }

    if (macInfo.value.mac.trim()) {
      try {
        isLoading.value = true;
        errorMessage.value = "";
        macInfo.value.mac = macInfo.value.mac.trim();
        await axios.put(`${ipServer}/api/mac`, macInfo.value);
        open.value = false;
        macInfo.value = {
          mac: macInfo.value.mac.trim(),
        };
        open.value = false;
      } catch (error) {
        console.error("Ошибка при добавлении мак:", error);
        errorMessage.value = error.response?.data?.message || "Не удалось добавить мак.";
      } finally {
        isLoading.value = false;
        macInfo.value.password = "";
        macInfo.value.mac = "";
      }
    }
  };

  const getMac = async () => {
    try {
      const { data } = await axios.get(`${ipServer}/api/mac`);
      macInfo.value.mac = data.mac;
    } catch (error) {
      console.error("Ошибка при получении мак:", error);
    }
  };

  onMounted(() => {
    getMac();

    window.api.onMessage("add-mac", openModalHandler);
  });
</script>

<template>
  <div></div>
  <DialogRoot key="open" v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-30 bg-black/50" />
      <DialogContent
        class="fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-[450px] -translate-x-1/2 -translate-y-1/2 transform rounded-md bg-white p-6 shadow-lg"
        aria-describedby=""
      >
        <DialogTitle class="text-lg font-semibold">Изменить MAC</DialogTitle>

        <div class="mt-4 space-y-2">
          <input v-model="macInfo.mac" placeholder="MAC-адрес" class="w-full rounded border p-2" />

          <input
            v-model="macInfo.password"
            placeholder="Пароль"
            type="password"
            class="w-full rounded border p-2"
          />
        </div>

        <p v-if="errorMessage" class="mt-2 text-red-500">{{ errorMessage }}</p>

        <div class="mt-4 flex justify-end space-x-2">
          <DialogClose as="button" class="rounded bg-gray-200 px-4 py-2">Отмена</DialogClose>
          <Button @click="addMac" :disabled="isLoading">
            <span v-if="isLoading" class="animate-spin">🔄</span>
            <span v-else>Изменить</span>
          </Button>
        </div>

        <DialogClose class="absolute top-2 right-2">
          <Icon icon="lucide:x" class="text-gray-500 hover:text-gray-700" />
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

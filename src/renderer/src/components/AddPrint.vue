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
    SwitchRoot,
    SwitchThumb,
  } from "radix-vue";
  import { Icon } from "@iconify/vue";
  import { ipServer } from "@/config";

  const open = ref(false);
  const isLoading = ref(false);
  const errorMessage = ref("");

  const printInfo = ref({
    is_printer: 0,
  });

  const openModalHandler = () => {
    open.value = true;
  };

  const addPrinter = async () => {
    if (printInfo.value.password !== "Waterman1$") {
      errorMessage.value = "Неверный пароль.";
      return;
    }

    try {
      isLoading.value = true;
      errorMessage.value = "";
      await axios.put(`${ipServer}/api/printer`, printInfo.value);
      open.value = false;
    } catch (error) {
      console.error("Ошибка при добавлении Принтера:", error);
      errorMessage.value = error.response?.data?.message || "Не удалось добавить мак.";
    } finally {
      isLoading.value = false;
      printInfo.value.password = "";
    }
  };

  const getPrinter = async () => {
    try {
      const { data } = await axios.get(`${ipServer}/api/mac`);
      printInfo.value.is_printer = data.is_printer ? true : false;
    } catch (error) {
      console.error("Ошибка при получении мак:", error);
    }
  };

  onMounted(() => {
    getPrinter();

    window.api.onMessage("add-printer", openModalHandler);
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
        <DialogTitle class="text-lg font-semibold">Изменить Принтер</DialogTitle>

        <div class="mt-4 space-y-2">
          <div class="my-2 flex items-start gap-2">
            <label
              class="pr-[15px] text-[20px] leading-none text-black select-none"
              for="airplane-mode"
            >
              Включить Принтер
            </label>
            <SwitchRoot
              id="airplane-mode"
              v-model:checked="printInfo.is_printer"
              class="relative flex h-[25px] w-[42px] cursor-default rounded-full bg-green-500 shadow-sm focus-within:outline-black data-[state=checked]:bg-black"
            >
              <SwitchThumb
                class="my-auto block h-[21px] w-[21px] translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[19px]"
              />
            </SwitchRoot>
          </div>

          <input
            v-model="printInfo.password"
            placeholder="Пароль"
            type="password"
            class="w-full rounded border p-2"
          />
        </div>

        <p v-if="errorMessage" class="mt-2 text-red-500">{{ errorMessage }}</p>

        <div class="mt-4 flex justify-end space-x-2">
          <DialogClose as="button" class="rounded bg-gray-200 px-4 py-2">Отмена</DialogClose>
          <Button @click="addPrinter" :disabled="isLoading">
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

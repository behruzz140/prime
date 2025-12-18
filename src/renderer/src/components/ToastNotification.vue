<template>
  <transition name="fade">
    <div 
      v-if="visible" 
      :class="['toast-notification', type]"
      @click="hide"
    >
      <div class="toast-icon">
        <Icon :icon="iconType" class="w-5 h-5" />
      </div>
      <div class="toast-content">
        <p class="toast-message">{{ message }}</p>
      </div>
      <button @click.stop="hide" class="toast-close">
        <Icon icon="mdi:close" class="w-4 h-4" />
      </button>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['close'])

const visible = ref(false)

const iconType = computed(() => {
  switch (props.type) {
    case 'success': return 'mdi:check-circle'
    case 'error': return 'mdi:alert-circle'
    case 'warning': return 'mdi:alert'
    default: return 'mdi:information'
  }
})

const show = () => {
  visible.value = true
  setTimeout(() => {
    hide()
  }, props.duration)
}

const hide = () => {
  visible.value = false
  emit('close')
}

onMounted(() => {
  show()
})

defineExpose({ show, hide })
</script>

<style scoped>
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  max-width: 400px;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  cursor: pointer;
  transition: transform 0.3s ease, opacity 0.3s ease;
  backdrop-filter: blur(10px);
}

.toast-notification:hover {
  transform: translateY(-2px);
}

.toast-notification.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-left: 4px solid #047857;
}

.toast-notification.error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-left: 4px solid #b91c1c;
}

.toast-notification.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border-left: 4px solid #b45309;
}

.toast-notification.info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-left: 4px solid #1d4ed8;
}

.toast-icon {
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
}

.toast-message {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  font-weight: 500;
}

.toast-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
<script setup lang="ts">
interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  inputId?: string
  isInvalid?: boolean
}>(), {
  placeholder: 'Seleccionar...',
  disabled: false,
  loading: false,
  inputId: undefined,
  isInvalid: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const searchQuery = ref('')
const isOpen = ref(false)
const highlightedIndex = ref(-1)
const containerRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

const selectedLabel = computed(() => {
  const found = props.options.find(o => o.value === props.modelValue)
  return found?.label ?? ''
})

function normalize(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const q = normalize(searchQuery.value)
  return props.options.filter(o => normalize(o.label).includes(q))
})

function openDropdown(): void {
  if (props.disabled || props.loading) return
  isOpen.value = true
  searchQuery.value = ''
  highlightedIndex.value = -1
  nextTick(() => inputRef.value?.focus())
}

function closeDropdown(): void {
  isOpen.value = false
  searchQuery.value = ''
  highlightedIndex.value = -1
}

function selectOption(option: SelectOption): void {
  emit('update:modelValue', option.value)
  closeDropdown()
}

function onKeydown(e: KeyboardEvent): void {
  if (!isOpen.value) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.value.length - 1)
      scrollToHighlighted()
      break
    case 'ArrowUp':
      e.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      scrollToHighlighted()
      break
    case 'Enter':
      e.preventDefault()
      if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
        selectOption(filteredOptions.value[highlightedIndex.value]!)
      }
      break
    case 'Escape':
      e.preventDefault()
      closeDropdown()
      break
  }
}

function scrollToHighlighted(): void {
  nextTick(() => {
    const list = listRef.value
    if (!list) return
    const item = list.children[highlightedIndex.value] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  })
}

function onClickOutside(e: MouseEvent): void {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<template>
  <div ref="containerRef" class="searchable-select position-relative">
    <!-- Trigger button -->
    <div
      class="form-select d-flex align-items-center"
      :class="{
        'is-invalid': isInvalid,
        disabled: disabled || loading,
      }"
      role="combobox"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      aria-autocomplete="list"
      tabindex="0"
      @click="openDropdown"
      @keydown.enter.prevent="openDropdown"
      @keydown.space.prevent="openDropdown"
    >
      <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" />
      <span v-if="modelValue" class="text-truncate">{{ selectedLabel }}</span>
      <span v-else class="text-muted">{{ placeholder }}</span>
    </div>

    <!-- Dropdown -->
    <div v-if="isOpen" class="dropdown-menu show w-100 p-0 mt-1 shadow-sm" style="max-height: 250px; overflow: hidden; display: flex; flex-direction: column;">
      <!-- Search input -->
      <div class="p-2 border-bottom">
        <input
          :id="inputId"
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          class="form-control form-control-sm"
          placeholder="Buscar..."
          autocomplete="off"
          @keydown="onKeydown"
        >
      </div>

      <!-- Options list -->
      <ul ref="listRef" class="list-unstyled mb-0 overflow-auto" role="listbox" style="max-height: 200px;">
        <li
          v-for="(option, index) in filteredOptions"
          :key="option.value"
          class="dropdown-item px-3 py-2"
          :class="{
            active: index === highlightedIndex,
            'fw-semibold': option.value === modelValue,
          }"
          role="option"
          :aria-selected="option.value === modelValue"
          @click="selectOption(option)"
          @mouseenter="highlightedIndex = index"
        >
          {{ option.label }}
        </li>
        <li v-if="filteredOptions.length === 0" class="px-3 py-2 text-muted small">
          Sin resultados
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.searchable-select .form-select {
  cursor: pointer;
  min-height: calc(1.5em + 0.75rem + 2px);
}

.searchable-select .form-select.disabled {
  opacity: 0.65;
  pointer-events: none;
}

.searchable-select .dropdown-menu {
  z-index: 1050;
}

.searchable-select .dropdown-item {
  cursor: pointer;
}

.searchable-select .dropdown-item.active {
  background-color: var(--bs-primary);
  color: #fff;
}
</style>

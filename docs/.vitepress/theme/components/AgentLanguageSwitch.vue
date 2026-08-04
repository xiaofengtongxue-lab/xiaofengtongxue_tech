<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { onContentUpdated } from 'vitepress'

type AgentLanguage = 'java' | 'python'

const STORAGE_KEY = 'xf-agent-tutorial-language'
const language = ref<AgentLanguage>('java')

const languageFromTitle = (title: string | null): AgentLanguage | null => {
  const normalized = title?.trim().toLowerCase()
  if (normalized === 'java') return 'java'
  if (normalized === 'python') return 'python'
  return null
}

const applyLanguageToCodeGroups = (selected: AgentLanguage) => {
  document.documentElement.dataset.agentTutorialLanguage = selected

  document.querySelectorAll<HTMLElement>('.vp-code-group').forEach((group) => {
    const labels = Array.from(group.querySelectorAll<HTMLLabelElement>('.tabs label'))
    const languages = labels.map((label) => languageFromTitle(label.dataset.title ?? null))
    if (!languages.includes('java') || !languages.includes('python')) return

    const index = languages.indexOf(selected)
    const inputs = group.querySelectorAll<HTMLInputElement>('.tabs input')
    const blocks = group.querySelector<HTMLElement>('.blocks')
    const input = inputs[index]
    const block = blocks?.children.item(index)
    if (!input || !blocks || !block) return

    input.checked = true
    Array.from(blocks.children).forEach((child, childIndex) => {
      child.classList.toggle('active', childIndex === index)
    })
  })
}

const persistLanguage = (selected: AgentLanguage) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, selected)
  } catch {
    // The switch still works when storage is unavailable.
  }
}

const selectLanguage = async (selected: AgentLanguage, persist = true) => {
  language.value = selected
  if (persist) persistLanguage(selected)
  await nextTick()
  window.requestAnimationFrame(() => applyLanguageToCodeGroups(selected))
}

const handleCodeGroupClick = (event: MouseEvent) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement) || !target.matches('.vp-code-group input')) return

  const label = document.querySelector<HTMLLabelElement>(`label[for="${target.id}"]`)
  const selected = languageFromTitle(label?.dataset.title ?? null)
  if (selected) void selectLanguage(selected)
}

onMounted(() => {
  let initial: AgentLanguage = 'java'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'java' || stored === 'python') initial = stored
  } catch {
    // Java remains the default when storage is unavailable.
  }

  window.addEventListener('click', handleCodeGroupClick)
  void selectLanguage(initial, false)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleCodeGroupClick)
})

onContentUpdated(() => {
  window.requestAnimationFrame(() => applyLanguageToCodeGroups(language.value))
})
</script>

<template>
  <div class="agent-code-switch" role="group" aria-label="示例语言">
    <span class="agent-code-switch__label">示例语言</span>
    <div class="agent-code-switch__options">
      <button
        type="button"
        :class="{ 'is-active': language === 'java' }"
        :aria-pressed="language === 'java'"
        @click="selectLanguage('java')"
      >
        Java
      </button>
      <button
        type="button"
        :class="{ 'is-active': language === 'python' }"
        :aria-pressed="language === 'python'"
        @click="selectLanguage('python')"
      >
        Python
      </button>
    </div>
  </div>
</template>

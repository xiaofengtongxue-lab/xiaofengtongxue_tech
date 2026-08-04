<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, withBase } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
const { frontmatter, page } = useData()

const showAuthor = computed(() => {
  return frontmatter.value.author !== false
    && frontmatter.value.publishedDraft !== true
    && page.value.relativePath !== 'index.md'
    && page.value.relativePath !== 'about.md'
    && !page.value.isNotFound
})

interface ActiveDiagram {
  src: string
  alt: string
  naturalWidth: number
  naturalHeight: number
}

const activeDiagram = ref<ActiveDiagram | null>(null)
const diagramZoom = ref(1)
const lightboxDialog = ref<HTMLElement | null>(null)
const lightboxCloseButton = ref<HTMLButtonElement | null>(null)
const lightboxViewport = ref<HTMLElement | null>(null)
const lastDiagramTrigger = ref<HTMLElement | null>(null)

const clampZoom = (zoom: number) => Math.min(2.5, Math.max(0.2, zoom))

const getFitZoom = (width: number, height: number) => {
  const horizontalSpace = window.innerWidth <= 640 ? 32 : 96
  const verticalSpace = window.innerWidth <= 640 ? 136 : 160

  return clampZoom(Math.min(
    1,
    (window.innerWidth - horizontalSpace) / width,
    (window.innerHeight - verticalSpace) / height,
  ))
}

const openDiagram = async (image: HTMLImageElement, trigger: HTMLElement) => {
  const naturalWidth = image.naturalWidth || 1200
  const naturalHeight = image.naturalHeight || 800

  activeDiagram.value = {
    src: image.currentSrc || image.src,
    alt: image.alt,
    naturalWidth,
    naturalHeight,
  }
  diagramZoom.value = getFitZoom(naturalWidth, naturalHeight)
  lastDiagramTrigger.value = trigger
  document.documentElement.classList.add('diagram-lightbox-open')

  await nextTick()
  lightboxCloseButton.value?.focus()
}

const closeDiagram = async () => {
  activeDiagram.value = null
  document.documentElement.classList.remove('diagram-lightbox-open')

  await nextTick()
  lastDiagramTrigger.value?.focus()
}

const setDiagramZoom = async (nextZoom: number) => {
  const viewport = lightboxViewport.value
  const horizontalRatio = viewport
    ? (viewport.scrollLeft + viewport.clientWidth / 2) / viewport.scrollWidth
    : 0.5
  const verticalRatio = viewport
    ? (viewport.scrollTop + viewport.clientHeight / 2) / viewport.scrollHeight
    : 0.5

  diagramZoom.value = clampZoom(nextZoom)
  await nextTick()

  if (!viewport) return

  viewport.scrollTo({
    left: viewport.scrollWidth * horizontalRatio - viewport.clientWidth / 2,
    top: viewport.scrollHeight * verticalRatio - viewport.clientHeight / 2,
  })
}

const resetDiagramZoom = () => {
  if (!activeDiagram.value) return

  void setDiagramZoom(getFitZoom(
    activeDiagram.value.naturalWidth,
    activeDiagram.value.naturalHeight,
  ))
}

const prepareDiagrams = () => {
  document.querySelectorAll<HTMLElement>('.agent-diagram').forEach((diagram) => {
    const image = diagram.querySelector<HTMLImageElement>('img')
    if (!image) return

    image.title = '查看大图'

    let openButton = diagram.querySelector<HTMLButtonElement>('.agent-diagram__open')
    if (!openButton) {
      openButton = document.createElement('button')
      openButton.type = 'button'
      openButton.className = 'agent-diagram__open'
      openButton.textContent = '⛶'
      openButton.title = '查看大图'
      openButton.setAttribute('aria-label', '查看大图')
    }

    diagram.append(openButton)
  })
}

const scheduleDiagramPreparation = async () => {
  await nextTick()
  window.requestAnimationFrame(prepareDiagrams)
}

const handleDiagramClick = (event: MouseEvent) => {
  const target = event.target
  if (!(target instanceof HTMLElement)) return

  const diagram = target.closest<HTMLElement>('.agent-diagram')
  if (!diagram) return

  const image = diagram.querySelector<HTMLImageElement>('img')
  const clickedButton = target.closest<HTMLElement>('.agent-diagram__open')
  if (!image || (target !== image && !clickedButton)) return

  event.preventDefault()
  const openButton = clickedButton
    || diagram.querySelector<HTMLElement>('.agent-diagram__open')
    || image
  void openDiagram(image, openButton)
}

const handleDiagramKeydown = (event: KeyboardEvent) => {
  if (!activeDiagram.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    void closeDiagram()
  } else if (event.key === 'Tab') {
    const dialog = lightboxDialog.value
    const controls = dialog
      ? Array.from(dialog.querySelectorAll<HTMLButtonElement>('button:not([disabled])'))
      : []
    const firstControl = controls.at(0)
    const lastControl = controls.at(-1)
    const activeElement = document.activeElement

    if (!firstControl || !lastControl) return

    if (event.shiftKey && activeElement === firstControl) {
      event.preventDefault()
      lastControl.focus()
    } else if (!event.shiftKey && activeElement === lastControl) {
      event.preventDefault()
      firstControl.focus()
    }
  } else if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    void setDiagramZoom(diagramZoom.value * 1.25)
  } else if (event.key === '-') {
    event.preventDefault()
    void setDiagramZoom(diagramZoom.value * 0.8)
  } else if (event.key === '0') {
    event.preventDefault()
    resetDiagramZoom()
  }
}

onMounted(() => {
  void scheduleDiagramPreparation()
  document.addEventListener('click', handleDiagramClick)
  document.addEventListener('keydown', handleDiagramKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDiagramClick)
  document.removeEventListener('keydown', handleDiagramKeydown)
  document.documentElement.classList.remove('diagram-lightbox-open')
})

watch(() => page.value.relativePath, () => {
  void scheduleDiagramPreparation()
})
</script>

<template>
  <Layout>
    <template #doc-after>
      <aside v-if="showAuthor" class="article-author" aria-labelledby="article-author-title">
        <div>
          <p class="article-author-label">内容作者</p>
          <p id="article-author-title" class="article-author-name">程序员小枫同学</p>
          <p class="article-author-description">持续整理 AI 编程、AI Agent 与软件工程实操教程。</p>
        </div>
        <a :href="withBase('/about')">了解本站与作者</a>
      </aside>
    </template>
  </Layout>

  <Teleport to="body">
    <div
      v-if="activeDiagram"
      ref="lightboxDialog"
      class="diagram-lightbox"
      role="dialog"
      aria-modal="true"
      :aria-label="`查看大图：${activeDiagram.alt}`"
      @click.self="closeDiagram"
    >
      <div class="diagram-lightbox__toolbar">
        <button
          type="button"
          title="缩小"
          aria-label="缩小"
          @click="setDiagramZoom(diagramZoom * 0.8)"
        >
          −
        </button>
        <button
          type="button"
          class="diagram-lightbox__zoom"
          title="适合窗口"
          aria-label="适合窗口"
          @click="resetDiagramZoom"
        >
          {{ Math.round(diagramZoom * 100) }}%
        </button>
        <button
          type="button"
          title="放大"
          aria-label="放大"
          @click="setDiagramZoom(diagramZoom * 1.25)"
        >
          +
        </button>
        <button
          ref="lightboxCloseButton"
          type="button"
          class="diagram-lightbox__close"
          title="关闭"
          aria-label="关闭"
          @click="closeDiagram"
        >
          ×
        </button>
      </div>

      <div ref="lightboxViewport" class="diagram-lightbox__viewport">
        <div class="diagram-lightbox__canvas">
          <img
            :src="activeDiagram.src"
            :alt="activeDiagram.alt"
            :style="{
              width: `${activeDiagram.naturalWidth * diagramZoom}px`,
              height: 'auto',
            }"
          >
        </div>
      </div>
    </div>
  </Teleport>
</template>

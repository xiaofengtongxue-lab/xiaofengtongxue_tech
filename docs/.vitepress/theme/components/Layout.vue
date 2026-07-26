<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { useData, withBase } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

const { Layout } = DefaultTheme
const { frontmatter, page } = useData()

const showAuthor = computed(() => {
  return frontmatter.value.author !== false
    && page.value.relativePath !== 'index.md'
    && page.value.relativePath !== 'about.md'
    && !page.value.isNotFound
})

const centerScrollableDiagrams = () => {
  if (!window.matchMedia('(max-width: 640px)').matches) return

  document
    .querySelectorAll<HTMLElement>('.agent-diagram:not(.agent-diagram-compact)')
    .forEach((diagram) => {
      diagram.scrollLeft = (diagram.scrollWidth - diagram.clientWidth) / 2
    })
}

const scheduleDiagramCentering = async () => {
  await nextTick()
  window.requestAnimationFrame(centerScrollableDiagrams)
}

onMounted(scheduleDiagramCentering)
watch(() => page.value.relativePath, scheduleDiagramCentering)
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
</template>

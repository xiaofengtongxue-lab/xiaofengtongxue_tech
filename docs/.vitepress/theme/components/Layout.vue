<script setup lang="ts">
import { computed } from 'vue'
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

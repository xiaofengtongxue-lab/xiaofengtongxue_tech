import DefaultTheme from 'vitepress/theme'
import HomeSections from './components/HomeSections.vue'
import Layout from './components/Layout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('HomeSections', HomeSections)
  }
}

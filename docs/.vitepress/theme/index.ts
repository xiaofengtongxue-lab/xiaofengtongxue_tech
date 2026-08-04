import DefaultTheme from 'vitepress/theme'
import AgentLanguageSwitch from './components/AgentLanguageSwitch.vue'
import HomeSections from './components/HomeSections.vue'
import Layout from './components/Layout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('AgentLanguageSwitch', AgentLanguageSwitch)
    app.component('HomeSections', HomeSections)
  }
}

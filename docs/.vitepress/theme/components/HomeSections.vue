<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <div class="home-sections">
    <section id="learning-directions" class="home-capabilities" aria-labelledby="home-capabilities-title">
      <div class="home-shell">
        <header class="home-section-heading home-section-heading--capabilities">
          <h2 id="home-capabilities-title">不只学工具，也练完整的工程能力</h2>
          <p>AI 时代变化最快的是工具，真正能长期复用的是理解问题、设计方案、验证结果和可靠交付的能力。</p>
        </header>

        <div class="home-capability-list">
          <article class="home-capability">
            <h3>理解 AI Agent</h3>
            <p>从 AI 编程工具切入，逐步理解模型、上下文、Skill、MCP、工具调用与 Agent 工作流，再把这些能力放进真实任务。</p>
          </article>

          <article class="home-capability">
            <h3>练好工程内功</h3>
            <p>持续打磨编程语言、架构、数据库、调试、测试、性能和安全，这些能力决定系统能否长期稳定。</p>
          </article>

          <article class="home-capability">
            <h3>形成技术判断</h3>
            <p>会做选型和取舍，能识别风险、追踪证据、验证结果，并为最终交付负责。</p>
          </article>
        </div>
      </div>
    </section>

    <section class="home-foundations" aria-labelledby="home-agents-title">
      <div class="home-shell">
        <header class="home-section-heading">
          <h2 id="home-agents-title">AI Agent 大白话教程</h2>
          <p>从会和 AI 对话开始，亲手做出能调用工具、保存状态、请求审批并通过评测的可靠 Agent。</p>
        </header>

        <div class="home-article-list">
          <article class="home-article">
            <a :href="withBase('/agents/')">
              <span class="home-article-topic">完整路线</span>
              <span class="home-article-copy">
                <strong>按零基础、实战、进阶三种起点选教程</strong>
                <span>零基础导读、真实项目主线和工程进阶彼此独立，通过前置与深入链接连接。</span>
              </span>
              <span class="home-article-arrow" aria-hidden="true">↗</span>
            </a>
          </article>

          <article class="home-article">
            <a :href="withBase('/agents/build/from-chat-to-agent')">
              <span class="home-article-topic">项目主线</span>
              <span class="home-article-copy">
                <strong>先跑通第一个资料盘点 Agent</strong>
                <span>从 Tool Calling 一路增加循环、状态、审批、验证和基础评测，每一步都能自己检查。</span>
              </span>
              <span class="home-article-arrow" aria-hidden="true">↗</span>
            </a>
          </article>

          <article class="home-article">
            <a :href="withBase('/agents/advanced/system-design')">
              <span class="home-article-topic">工程进阶</span>
              <span class="home-article-copy">
                <strong>把单 Agent 放进可上线的系统</strong>
                <span>深入 MCP、上下文、记忆、评测、多 Agent、安全边界与生产架构。</span>
              </span>
              <span class="home-article-arrow" aria-hidden="true">↗</span>
            </a>
          </article>
        </div>
      </div>
    </section>

    <section class="home-foundations" aria-labelledby="home-foundations-title">
      <div class="home-shell">
        <header class="home-section-heading">
          <h2 id="home-foundations-title">Codex 教程</h2>
          <p>从普通工作到软件项目，再到场景实战、Skill 与进阶能力，所有内容沿一条完整学习路径展开。</p>
        </header>

        <div class="home-article-list">
          <article class="home-article">
            <a :href="withBase('/codex/')">
              <span class="home-article-topic">完整目录</span>
              <span class="home-article-copy">
                <strong>先看全部教程与学习路线</strong>
                <span>按任务背景选择入口，再逐步进入工作流、场景实战和高级能力。</span>
              </span>
              <span class="home-article-arrow" aria-hidden="true">↗</span>
            </a>
          </article>

          <article class="home-article">
            <a :href="withBase('/codex/everyday/')">
              <span class="home-article-topic">普通工作</span>
              <span class="home-article-copy">
                <strong>不用编程完成可检查的工作成果</strong>
                <span>从办公文件、PPT、电商、研究和内容创作开始，不要求终端或 Git 经验。</span>
              </span>
              <span class="home-article-arrow" aria-hidden="true">↗</span>
            </a>
          </article>

          <article class="home-article">
            <a :href="withBase('/codex/start/what-is-codex')">
              <span class="home-article-topic">开发者路线</span>
              <span class="home-article-copy">
                <strong>把 Codex 接进完整工程流程</strong>
                <span>从项目理解、Bug、功能和测试，逐步进入重构、代码审查、自动化与安全。</span>
              </span>
              <span class="home-article-arrow" aria-hidden="true">↗</span>
            </a>
          </article>

          <article class="home-article">
            <a :href="withBase('/codex/practice/')">
              <span class="home-article-topic">场景实战</span>
              <span class="home-article-copy">
                <strong>在真实业务场景中完成交付</strong>
                <span>覆盖 PPT、电商、文档、数据分析、研究报告、Web 应用和内容制作。</span>
              </span>
              <span class="home-article-arrow" aria-hidden="true">↗</span>
            </a>
          </article>

          <article class="home-article">
            <a :href="withBase('/codex/skills/')">
              <span class="home-article-topic">Skill 与进阶</span>
              <span class="home-article-copy">
                <strong>复用方法并扩展外部能力</strong>
                <span>学习 Skill、Plugin、MCP、自动化、团队协作和权限边界。</span>
              </span>
              <span class="home-article-arrow" aria-hidden="true">↗</span>
            </a>
          </article>
        </div>
      </div>
    </section>

    <section class="home-latest" aria-labelledby="home-latest-title">
      <div class="home-shell">
        <header class="home-section-heading">
          <h2 id="home-latest-title">从一篇能动手的教程开始</h2>
          <p>可以从 Agent 原理或 Codex 实战进入。工具会不会用只是第一步，更重要的是会检查结果、发现问题，把事情真正做完。</p>
        </header>

        <div class="home-article-list">
          <article class="home-article">
            <a :href="withBase('/agents/start/what-is-agent')">
              <span class="home-article-topic">Agent 导读</span>
              <span class="home-article-copy">
                <strong>AI Agent 到底是什么：跟着一个任务走完闭环</strong>
                <span>不要求终端、Git 或编程基础，先看懂观察、决策、工具、反馈和验收。</span>
              </span>
              <span class="home-article-arrow" aria-hidden="true">↗</span>
            </a>
          </article>

          <article class="home-article">
            <a :href="withBase('/codex/everyday/first-result')">
              <span class="home-article-topic">普通人入门</span>
              <span class="home-article-copy">
                <strong>第一次使用 ChatGPT Work：不用写代码完成工作文件</strong>
                <span>从附加资料、生成行动清单，到预览、修改和下载复查。</span>
              </span>
              <span class="home-article-arrow" aria-hidden="true">↗</span>
            </a>
          </article>

          <article class="home-article">
            <a :href="withBase('/codex/start/what-is-codex')">
              <span class="home-article-topic">开发者入门</span>
              <span class="home-article-copy">
                <strong>Codex 是什么：先完成一次只读项目体检</strong>
                <span>用真实代码库理解 App、CLI、IDE 与云任务的边界。</span>
              </span>
              <span class="home-article-arrow" aria-hidden="true">↗</span>
            </a>
          </article>

          <article class="home-article">
            <a :href="withBase('/codex/workflows/fix-bugs')">
              <span class="home-article-topic">工程工作流</span>
              <span class="home-article-copy">
                <strong>用 Codex 复现并修复 Bug</strong>
                <span>先拿到可重复证据，再定位调用链、修改代码并验证结果。</span>
              </span>
              <span class="home-article-arrow" aria-hidden="true">↗</span>
            </a>
          </article>

          <article class="home-article">
            <a :href="withBase('/codex/practice/documents-spreadsheets-pdf')">
              <span class="home-article-topic">场景实战</span>
              <span class="home-article-copy">
                <strong>用 Codex 处理 Word、Excel 和 PDF</strong>
                <span>从源文件盘点到可编辑文件生成，再做公式和逐页检查。</span>
              </span>
              <span class="home-article-arrow" aria-hidden="true">↗</span>
            </a>
          </article>
        </div>
      </div>
    </section>

    <section class="home-paths" aria-labelledby="home-paths-title">
      <div class="home-shell">
        <header class="home-section-heading home-section-heading--paths">
          <h2 id="home-paths-title">按你现在的工作方式选择路线</h2>
          <p>两条路线使用同一套原则：任务要具体，过程要可检查，结果要能验收。</p>
        </header>

        <div class="home-path-grid">
          <article class="home-path home-path--everyday">
            <div>
              <p class="home-path-label">不要求编程经验</p>
              <h3>先完成一份真实工作成果</h3>
              <p>从办公文件、PPT、电商、研究和内容创作开始，默认不要求终端、Git、代码仓库或脚本经验。</p>
            </div>
            <a :href="withBase('/codex/everyday/')">进入普通工作路线 <span aria-hidden="true">→</span></a>
          </article>

          <article class="home-path home-path--developer">
            <div>
              <p class="home-path-label">面向开发者与技术团队</p>
              <h3>把 Codex 接进完整工程流程</h3>
              <p>从项目理解、Bug、功能和测试，到重构、代码审查、MCP、自动化与团队安全。</p>
            </div>
            <a :href="withBase('/codex/start/what-is-codex')">进入开发者路线 <span aria-hidden="true">→</span></a>
          </article>
        </div>
      </div>
    </section>

  </div>
</template>

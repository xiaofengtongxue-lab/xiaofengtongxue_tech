# File Audit Agent

这是“程序员小枫同学”AI Agent 教程的配套项目。它只读取指定工作目录，把报告先写入 `.agent/drafts/`，通过确定性验证后再请求人工确认，最后才发布到 `reports/inventory.md`。

验证基线：2026-07-26，Python 3.14.2，OpenAI Python SDK 2.48.0。项目声明支持 Python 3.11 及以上版本。

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
python -m unittest discover -s tests -v
```

实际调用模型前，请在自己的终端设置环境变量，不要把真实密钥写进文件或聊天窗口：

```bash
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
export OPENAI_MODEL="deepseek-v4-pro"
file-audit-agent --root sample-workspace
```

`deepseek-v4-pro` 是教程默认模型 ID。请先确认你使用的 API 服务提供这个模型，并兼容项目调用的接口；如果不支持，就通过 `OPENAI_MODEL` 换成当前可用并经过验证的模型。本地验证只覆盖确定性测试和项目安装，不代表已经完成真实模型请求验证。

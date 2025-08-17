# Custom Model Prompt Generator 安装指南

## 快速安装

### 方法1: 自动安装脚本（推荐）
```bash
cd ComfyUI/custom_nodes/kontext-super-prompt
python install_dependencies.py
```

### 方法2: 手动安装
根据您的环境选择合适的安装命令：

#### 预编译版本（最稳定）
```bash
pip install llama-cpp-python --only-binary=:all:
```

#### CPU优化版本
```bash
CMAKE_ARGS="-DGGML_BLAS=ON -DGGML_BLAS_VENDOR=OpenBLAS" pip install llama-cpp-python
```

#### GPU加速版本（需要CUDA）
```bash
CMAKE_ARGS="-DGGML_CUDA=ON" pip install llama-cpp-python
```

## 云端环境特殊说明

### Colab/Kaggle
```bash
!pip install llama-cpp-python --only-binary=:all:
```

### Docker/容器环境
```bash
# 在Dockerfile中添加
RUN pip install llama-cpp-python --only-binary=:all:
```

### Ubuntu/Linux服务器
```bash
# 安装编译依赖（如需要）
sudo apt-get update
sudo apt-get install build-essential cmake

# 安装llama-cpp-python
pip install llama-cpp-python --only-binary=:all:
```

## 无依赖使用方式

如果无法安装 llama-cpp-python，节点会自动切换到API模式，支持以下外部服务：

### LM Studio
1. 下载并启动 LM Studio
2. 加载您的模型
3. 启动本地服务器（默认端口1234）

### text-generation-webui
1. 安装并运行 text-generation-webui
2. 通过WebUI加载模型
3. 启用API模式（默认端口5000）

### llama.cpp server
```bash
# 启动llama.cpp服务器
./server -m your_model.gguf --port 8080
```

## 模型文件管理

### 模型存放位置
```
ComfyUI/
├── models/
│   └── custom_prompt_models/
│       ├── deepseek-LLM-7B-Chat-lora-q4_K_M.gguf
│       ├── model-q4_K_M.gguf
│       └── your-other-models.gguf
└── custom_nodes/
    └── kontext-super-prompt/
```

### 模型刷新
- 添加新模型后，在节点界面点击"🔄 刷新模型列表"
- 或者重启ComfyUI

## 故障排除

### 编译错误
如果遇到编译错误，按顺序尝试：
1. 使用预编译版本：`pip install llama-cpp-python --only-binary=:all:`
2. 清理缓存：`pip cache purge && pip install llama-cpp-python --no-cache-dir`
3. 使用外部API模式

### 模型不显示
1. 检查文件路径是否正确
2. 确认文件是.gguf格式
3. 点击刷新按钮
4. 查看控制台调试信息

### 内存不足
1. 使用较小的模型文件
2. 调整n_ctx参数（减少上下文长度）
3. 使用外部API服务

## 性能优化

### CPU优化
- 使用OpenBLAS版本
- 调整线程数（n_threads参数）
- 选择合适的量化模型

### GPU优化
- 安装CUDA版本
- 设置n_gpu_layers参数
- 确保显存足够

### 云端优化
- 使用预编译版本避免编译时间
- 选择4位量化模型节省带宽
- 使用持久化存储保存模型

## 支持的模型格式

- ✅ GGUF (推荐)
- ❌ HF Transformers（需要其他节点）
- ❌ ONNX（需要其他节点）

## 常见问题

**Q: 为什么我的模型加载很慢？**
A: 尝试使用SSD存储模型文件，或使用更小的量化版本。

**Q: 可以同时加载多个模型吗？**
A: 目前一次只能加载一个模型，但可以快速切换。

**Q: 支持中文模型吗？**
A: 支持，特别是Qwen和ChatGLM等中文优化模型。

**Q: 如何获得更好的提示词质量？**
A: 调整temperature和top_p参数，使用自定义系统提示词。
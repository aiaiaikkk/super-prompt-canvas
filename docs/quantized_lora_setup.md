# Quantized LoRA Prompt Enhancer 使用指南

## 🎯 节点简介

专为LoRA微调+llama.cpp量化模型设计的ComfyUI节点，支持本地运行量化模型进行提示词生成。

**支持的模型：**
- qwen-8b-instruct (LoRA微调 + 4位量化)
- deepseek-7b-base (LoRA微调 + 4位量化)

## 📦 安装依赖

### 1. 安装 llama-cpp-python

**CPU版本：**
```bash
pip install llama-cpp-python
```

**GPU版本（推荐）：**
```bash
# CUDA
CMAKE_ARGS="-DLLAMA_CUBLAS=on" pip install llama-cpp-python

# 或者对于Windows
pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu121
```

### 2. 验证安装
```python
python -c "from llama_cpp import Llama; print('✅ llama-cpp-python 安装成功')"
```

## 🚀 使用方法

### 1. 模型准备

确保你的量化模型文件：
- 格式：`.gguf`
- 位置：可访问的本地路径
- 大小：建议4位量化以平衡质量和速度

### 2. 节点配置

1. **添加节点**：在ComfyUI中搜索 "Quantized LoRA Prompt Enhancer"

2. **连接图像**：将图像输入连接到节点

3. **设置模型路径**：
   ```
   例如：D:/models/qwen-8b-instruct-lora-q4_0.gguf
   ```

4. **选择模型类型**：
   - `qwen-8b-instruct` - 中文优化
   - `deepseek-7b-base` - 英文优化

5. **输入编辑要求**：
   ```
   例如：将背景改为蓝天白云，增加温暖的阳光效果
   ```

### 3. 参数调优

| 参数 | 建议值 | 说明 |
|------|--------|------|
| **max_tokens** | 512 | 生成的最大token数 |
| **temperature** | 0.7 | 创造性控制 (0.1-2.0) |
| **top_p** | 0.9 | 词汇选择多样性 (0.1-1.0) |

**参数说明：**
- **低temperature (0.1-0.5)**：更准确、一致的输出
- **高temperature (0.8-1.5)**：更有创意、多样的输出
- **低top_p (0.7-0.85)**：更集中的词汇选择
- **高top_p (0.9-0.95)**：更多样的表达方式

## 🎨 界面功能

### 预设配置
- **qwen-8b-instruct 预设**：中文优化参数
- **deepseek-7b-base 预设**：英文优化参数

### 示例请求
界面提供常用编辑请求示例：
- 背景替换
- 风格转换  
- 光照调整
- 特效添加

### 状态监控
- **未加载**：模型尚未加载
- **就绪**：模型路径已设置
- **已加载**：模型加载成功
- **错误**：加载失败或路径错误

## 📝 提示词模板

### Qwen模型模板
```
<|im_start|>system
你是一个专业的图像编辑提示词生成器。根据用户的编辑要求，生成精确的、结构化的提示词。
<|im_end|>
<|im_start|>user
{用户编辑要求}
<|im_end|>
<|im_start|>assistant
```

### DeepSeek模型模板
```
### System:
You are a professional image editing prompt generator. Generate precise, structured prompts based on user editing requirements.

### User:
{用户编辑要求}

### Assistant:
```

## 🔧 故障排除

### 常见问题

**1. 模型加载失败**
```
错误：FileNotFoundError: 模型文件不存在
解决：检查模型路径是否正确，文件是否存在
```

**2. 内存不足**
```
错误：CUDA out of memory
解决：
- 降低 n_ctx 参数
- 使用CPU模式
- 选择更小的模型
```

**3. 生成速度慢**
```
解决方案：
- 启用GPU加速
- 降低 max_tokens
- 使用更高的量化级别
```

**4. 输出质量差**
```
调整方案：
- 优化系统提示词
- 调整temperature和top_p
- 检查模型是否适合当前任务
```

### 性能优化

**GPU内存优化：**
```python
# 自动调整GPU层数
n_gpu_layers = -1  # 使用所有GPU层
n_ctx = 2048      # 适当的上下文长度
```

**CPU性能优化：**
```python
n_threads = -1    # 使用所有CPU线程
n_batch = 512     # 适当的批处理大小
```

## 📊 模型比较

| 模型 | 语言优势 | 参数量 | 推荐用途 |
|------|----------|--------|----------|
| **qwen-8b-instruct** | 中文 | 8B | 中文图像编辑提示词 |
| **deepseek-7b-base** | 英文 | 7B | 英文图像编辑提示词 |

## 🎯 最佳实践

### 1. 编辑要求书写
```
好的例子：
"将图片背景替换为日落海滩场景，保持人物不变，增加温暖的橙色调"

避免的例子：
"让图片好看一点"
```

### 2. 模型选择
- **中文用户**：优先使用qwen-8b-instruct
- **英文用户**：优先使用deepseek-7b-base
- **多语言**：根据主要语言选择

### 3. 参数调优
- **精确控制**：temperature=0.3, top_p=0.8
- **创意生成**：temperature=0.8, top_p=0.95
- **平衡模式**：temperature=0.7, top_p=0.9

## 🔄 工作流示例

1. **图像输入** → LoadImage
2. **编辑要求** → QuantizedLoRAPromptEnhancer
3. **提示词输出** → 下游图像生成节点

## 📈 版本历史

- **v1.0.0**: 初始版本，支持基础GGUF模型加载
- **v1.1.0**: 添加预设配置和示例请求
- **v1.2.0**: 优化UI界面和状态监控

## 🆘 技术支持

如遇问题，请提供以下信息：
- ComfyUI版本
- 模型文件信息
- 错误日志
- 系统配置（CPU/GPU）
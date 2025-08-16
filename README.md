# Kontext Super Prompt v1.3.4

**ComfyUI图像编辑与智能提示词生成工具集** - 专业的可视化编辑与AI增强提示词生成

![Installation](images/instruction.png)

## 🎯 主要节点

### 🎨 LRPG Canvas  
可视化画布标注工具，提供专业的图层管理和绘制功能
- 支持多种绘制工具和图层操作（画笔、形状、文字、裁切等）
- **画笔羽化效果**: 专业边缘羽化，支持1-20像素可调羽化半径
- **精确鼠标控制**: 按住绘制、释放停止，响应自然
- 自动生成结构化图层数据供下游节点使用
- 实时画布状态同步

![LRPG Canvas](images/LRPG_Canvas.png)

### 🎯 Kontext Super Prompt
智能提示词生成器，将图层信息转换为结构化编辑指令
- **五种编辑模式**: 局部编辑、全局编辑、文字编辑、专业操作、远程API、本地Ollama
- **40+操作模板**: 涵盖颜色变换、风格重构、智能替换等
- **约束和修饰**: 自动生成质量控制和效果增强提示词
- **AI增强集成**: 内置远程API和本地Ollama服务支持
- **确定性输出**: 相同输入保证相同结果

![Kontext Super Prompt](images/KontextSuperPrompt.png)

## 🆕 v1.3.4 版本更新

### 🌐 强制英文输出系统
- **100%英文提示词输出**: 所有API和Ollama模式强制输出英文
- **中文自动转换**: 中文输入自动翻译为英文指令
- **5层保护机制**: 系统提示、用户提示、响应检测、自动提取、默认回退
- **混合语言处理**: 智能提取英文部分，过滤其他语言

### 📝 商业级引导词系统
- **3种预设模式**: 
  - Commercial Production Mode (商业生产)
  - Marketing & Social Media Mode (营销社媒)
  - E-commerce Product Mode (电商产品)
- **12个专业模板**: 覆盖电商、营销、企业、时尚、美食、地产等场景
- **8种编辑意图**: 颜色修改、物体移除、替换、背景、增强、风格、文字、光线
- **8种处理风格**: 产品目录、社交媒体、企业形象、时尚、美食、房地产、汽车、美妆

### ⚡ 性能优化
- **Token消耗降低50%**: 系统提示词精简，max_tokens优化至200
- **指令长度优化**: 30-60词的最佳平衡点
- **响应速度提升**: 移除冗余日志，清理注释代码
- **防截断机制**: 智能控制输出长度，避免API响应被截断

### 🎨 增强的颜色系统
- **精确颜色词汇**: deep navy blue, forest green, rose gold等专业色彩名称
- **材质描述**: matte, glossy, metallic等表面质感
- **行业标准色**: 电商、时尚、企业等行业专用色彩体系

### 🔧 问题修复
- ✅ API响应截断问题 - 优化token使用和输出长度
- ✅ 中文输出问题 - 强制英文输出机制
- ✅ 模板污染问题 - 分离API/Ollama模式与预设模板
- ✅ 多提示词生成 - 确保单一、完整的提示词输出
- ✅ 随机性不足 - 添加变体种子确保多样性

## 💬 集成AI功能

项目已将AI功能完全集成到前端界面中，提供更流畅的用户体验：

### 🌐 内置远程API支持
- **多平台集成**: 直接在编辑界面使用OpenAI、Gemini、DeepSeek、Zhipu等云端AI
- **动态模型选择**: 自动获取最新AI模型列表，支持最新模型  
- **英文强制输出**: 所有API响应强制为英文，确保兼容性
- **智能响应处理**: 自动清理、验证和优化AI响应

### 🦙 内置Ollama服务
- **服务管理**: 一键启动/停止，智能释放GPU资源
- **英文输出保证**: 强制英文系统提示和响应验证
- **模型管理**: 支持多种开源LLM模型
- **参数可调**: 温度、最大Token等参数自定义

### 编辑模式界面展示

**局部编辑模式** - 精确的对象级编辑操作
![局部编辑](images/KontextSuperPrompt1.png)

**全局编辑模式** - 整体图像风格和效果调整
![全局编辑](images/KontextSuperPrompt2.png)

**远程API模式** - 集成多种云端AI模型，强制英文输出
![远程API](images/KontextSuperPrompt3.png)

**本地Ollama模式** - 内置服务管理，英文提示词保证
![本地Ollama](images/KontextSuperPrompt4.png)

## 🤖 外部AI集成

### TextGenWebUI Flux Kontext Enhancer
与Text Generation WebUI的集成方案
- **无缝对接**: 直接调用WebUI接口
- **英文输出**: 强制English-only模式
- **批量处理**: 支持多任务并行处理
- **状态监控**: 实时显示处理进度

![TextGenWebUI](images/textgen_webui.png)

### 🤖 Quantized LoRA Prompt Enhancer
专为LoRA微调+量化模型设计的提示词生成器
- **支持模型**: qwen-8b-instruct、deepseek-7b-base (LoRA微调版本)
- **量化格式**: llama.cpp GGUF 4位量化
- **本地推理**: 完全本地运行，保护数据隐私
- **智能界面**: 预设配置、示例请求、状态监控
- **英文优化**: 确保英文提示词输出质量

## 📋 使用方法

### 基础工作流
1. 添加`🎨 LRPG Canvas`节点，连接图像输入
2. 在画布中创建图层和标注区域
3. 连接`🎯 Kontext Super Prompt`节点生成编辑指令
4. 在Kontext Super Prompt界面中使用内置的API或Ollama功能优化提示词

### 节点连接
- **LRPG Canvas**: 输出`image`和`layer_info`
- **Kontext Super Prompt**: 接收`layer_info`和`image`，输出`edited_image`和`generated_prompt`
- **内置AI功能**: 直接在Kontext Super Prompt界面中使用，无需额外节点

### v1.3.4 使用建议

#### 商业场景最佳实践
- **电商产品**: 使用 "E-commerce Product Mode" + "product_catalog" 风格
- **营销物料**: 使用 "Marketing & Social Media Mode" + "social_media" 风格
- **企业形象**: 使用 "Commercial Production Mode" + "corporate" 风格
- **创意设计**: 根据需求选择合适的模板和风格组合

#### 英文输出保证
- 所有模式默认输出英文提示词
- 中文输入会自动转换为英文指令
- 如遇中文响应，系统自动提取英文或使用默认模板

#### Token优化建议
- API调用建议使用默认设置（max_tokens=200）
- 复杂场景可适当增加到300-400
- 简单操作可减少到100以节省成本

## 🛠️ 安装

### 方法1：通过ComfyUI Manager（推荐）
1. 打开ComfyUI Manager
2. 搜索 "Kontext Super Prompt"
3. 点击安装

### 方法2：Git克隆
```bash
cd ComfyUI/custom_nodes
git clone https://github.com/aiaiaikkk/kontext-super-prompt.git
```

### 方法3：手动安装
1. 下载项目ZIP文件
2. 解压到 `ComfyUI/custom_nodes/` 目录
3. 重启ComfyUI

## 📦 依赖要求

### 基础依赖
- ComfyUI (最新版本)
- Python 3.8+
- PyTorch 1.12+

### 可选依赖
- Ollama (本地LLM支持)
- API密钥 (远程AI服务)

## 🚀 快速开始

1. **安装节点包**: 通过上述任一方法安装
2. **重启ComfyUI**: 确保节点正确加载
3. **添加节点**: 在节点菜单中找到 "kontext_super_prompt" 分类
4. **连接工作流**: 按照示例连接节点
5. **开始创作**: 使用画布标注，生成智能提示词

## 📖 文档

- [安装指南](INSTALLATION.md)
- [图像缩放功能](docs/image_scaling_feature.md)
- [量化LoRA配置](docs/quantized_lora_setup.md)

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 🔗 链接

- [GitHub仓库](https://github.com/aiaiaikkk/kontext-super-prompt)
- [ComfyUI官网](https://github.com/comfyanonymous/ComfyUI)
- [问题反馈](https://github.com/aiaiaikkk/kontext-super-prompt/issues)

## 🎉 致谢

感谢ComfyUI社区的支持和贡献！

---

**Version**: 1.3.4 | **Updated**: 2025-08-16 | **Status**: Production Ready
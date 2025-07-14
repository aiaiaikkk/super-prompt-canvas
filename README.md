# Kontext超级提示词

**[🇨🇳 中文文档](#chinese-docs) | [🇺🇸 English Docs](#english-docs)**

---

## <a id="chinese-docs"></a>🇨🇳 中文文档

**多模态AI超级提示词生成系统** - 智能的视觉提示词生成系统，为ComfyUI提供**可视化标注**与**结构化提示词生成**的完美结合，专为Flux Kontext工作流优化。这是一个革命性的**多模态AI超级提示词界面**，将视觉理解与文本生成无缝集成。

## 🎯 效果展示

| 使用前 | 使用后 |
|--------|--------|
| ![Before](images/before.png) | ![After](images/after.png) |
| 传统文本提示词输入 | 多模态可视化提示词生成 |

### 💫 快速上手

1. **双击节点** → 打开可视化编辑器
2. **绘制标注** → 选择工具标记目标区域  
3. **选择模板** → 选择操作类型和增强提示词
4. **一键生成** → 自动生成结构化提示词

### 🎯 项目目标

本项目旨在构建一个基于 **Flux Kontext 大模型** 的超级提示词生成系统，通过直观的图形标注与智能AI增强的协同控制，实现对图像的精细化、多模态编辑。

用户无需掌握复杂的提示词编写，仅需 **框选图像区域 + 描述意图**，超级提示词系统即可自动生成智能AI增强的结构化编辑指令，驱动 Kontext 模型完成图像局部/整体的智能修改操作。

本项目力求实现：

🖼️ **所见即所得的可视化交互**：支持矩形、圆形、箭头、自由绘图等多种标注方式；

✍️ **结构化提示词自动拼接与补全**：帮助小白用户高效表达编辑需求；

🧠 **结合大模型的语义理解能力**：精确控制图像的变换、替换、修复与增强；

🔄 **编辑闭环完整打通**：从标注 → 生成掩码 → 提示生成 → 编辑执行 → 回显反馈，全流程自动联动。

目标是打造一个适用于 **ComfyUI 图像创作生态** 的超级提示词生成平台，为 AI 图像编辑提供更加智能、自然、高效的交互方式。

### ✨ 核心特性

#### 🎨 视觉标注系统
- **4种绘制工具**：矩形、圆形、箭头、自由绘制多边形
- **多色彩支持**：红、绿、黄、蓝标注颜色
- **交互式编辑**：点击、拖拽、选择、删除标注
- **实时预览**：图像上的实时标注渲染

#### 📝 多模态结构化提示词生成
- **4个模板分类**：局部编辑、全局调整、文字编辑、专业操作
- **49个基础模板**：基于1025条Flux Kontext官方指令精心优化
- **AI智能扩展**：通过Ollama/API增强器可生成无限变体
- **多选提示词**：约束性和修饰性提示词的复选框界面
- **智能组合**：自动将视觉标注转换为多模态AI可理解的结构化提示词


### 🚀 已实现功能

#### ✅ 核心功能
- [x] **可视化提示词编辑器节点** - 双击打开统一界面
- [x] **多工具标注** - 矩形、圆形、箭头、自由绘制
- [x] **4分类模板系统** - 局部/全局/文字/专业操作
- [x] **多选提示词增强** - 约束性/修饰性提示词复选框界面
- [x] **实时模板切换** - 操作类型切换立即更新提示词选项
- [x] **结构化输出生成** - 自动构建包含选中增强词的提示词
- [x] **图像渲染** - 标注直接渲染到输出图像

#### ✅ AI增强功能 (NEW!)
- [x] **🤖 本地Ollama服务集成** - 支持调用本地ollama服务生成结构化提示词
- [x] **🌐 API远程调用** - 支持API远程调用大语言模型生成结构化提示词
- [x] **🎯 多图层指令支持** - 支持对多图层使用不同指令，例如：在红色标记处添加一只小狗，移除蓝色标记处的椅子等
- [x] **📋 智能模板库** - 根据FLUX官方训练数据集优化提示词模板覆盖局部编辑，全局编辑，文字编辑，专业操作70+预设模板
- [x] **🎲 种子参数控制** - 支持seed参数控制生成随机性，确保结果可重现
- [x] **✏️ 用户自定义模板** - 完整的自定义引导话术保存/加载/管理系统
- [x] **🧹 输出清理** - 智能清理技术分析内容，输出简洁自然语言指令
- [x] **🔄 手动刷新模型** - 一键刷新Ollama模型列表，无需重启ComfyUI
- [x] **DeepSeek R1/V3 支持** - 最新推理优化模型集成
- [x] **多服务商支持** - SiliconFlow、DeepSeek、千问、OpenAI
- [x] **成本控制** - 智能缓存和实时成本监控

#### 🚀 模型训练进展
- [x] **基于deepseek-r1和qwen3用于生成kontext提示词的模型正在训练中**……

#### 🌟 仙宫云镜像体验
**仙宫云镜像已部署完成以上功能**：[https://www.xiangongyun.com/register/FIP8MJ](https://www.xiangongyun.com/register/FIP8MJ)（搜索：小红猪）

#### 📈 计划中的高级功能  
- [ ] **标注数据导出** - JSON格式的坐标和元数据
- [ ] **多语言支持** - 中英文界面元素

#### ✅ 用户体验
- [x] **直观界面** - 左侧画布，右侧提示词面板布局
- [x] **响应式设计** - 自动缩放和缩放控制

### 📋 模板分类

| 分类 | 模板数量 | 描述 |
|------|----------|------|
| 🎯 **局部编辑** | 18个模板 | 特定对象编辑（颜色、样式、纹理、姿势等） |
| 🌍 **全局调整** | 12个模板 | 整体图像处理（调色、增强、滤镜） |
| 📝 **文字编辑** | 5个模板 | 文字操作（添加、删除、编辑、调整大小、组合） |
| 🔧 **专业操作** | 14个模板 | 高级编辑（几何变换、合成等） |
| ✏️ **自定义模板** | 无限制 | 用户自定义AI引导话术，支持保存/加载/管理 |

### 🔮 未来规划

#### 📈 计划增强
- [ ] **AI驱动标注** - 自动对象检测和预标注
- [ ] **自定义模板创建器** - 用户定义的提示词模板
- [ ] **批处理** - 多图像标注工作流
- [ ] **模板市场** - 社区共享的提示词模板
- [ ] **高级导出格式** - 支持更多输出格式

#### 🧪 实验性功能
- [ ] **语音标注** - 音频描述转提示词转换
- [ ] **3D对象支持** - 深度感知标注工具
- [ ] **实时协作** - 多用户编辑会话
- [ ] **API集成** - 外部工具连接

### 📦 安装方法

#### 方法一：Git克隆（推荐）
```bash
cd ComfyUI/custom_nodes/
git clone https://github.com/aiaiaikkk/kontext-super-prompt.git
```

#### 方法二：手动安装
1. 将`KontextSuperPrompt`文件夹复制到ComfyUI的custom_nodes目录
2. 重启ComfyUI
3. 在`kontext_super_prompt/core`分类中找到`VisualPromptEditor`节点
4. 双击节点打开可视化编辑器

### 🎮 使用方法

1. **添加节点**：在工作流中放置`VisualPromptEditor`
2. **连接图像**：将图像输入连接到节点
3. **打开编辑器**：双击节点启动界面
4. **标注**：使用绘制工具标记感兴趣的区域
5. **配置**：选择模板分类和操作类型
6. **增强**：通过复选框选择约束性和修饰性提示词
7. **生成**：点击"生成描述"获得结构化提示词
8. **导出**：保存标注并在工作流中使用生成的提示词

### 🔧 系统要求

- ComfyUI（推荐最新版本）
- Python 3.7+
- 支持JavaScript的现代网页浏览器
- 4GB+内存以获得最佳性能

### 📊 项目统计

- **预设模板数量**：70+个FLUX优化模板（基于官方训练数据集）
- **自定义模板**：无限制用户自定义引导话术
- **AI增强节点**：2个智能增强器（Ollama本地 + API远程）
- **提示词数据库**：343个约束性和修饰性提示词
- **多图层支持**：无限制标注层数和指令组合
- **语言支持**：英文/中文双语界面
- **文件大小**：约3.2MB完整包
- **节点数量**：4个核心节点（编辑器 + 2个AI增强器 + 种子控制）

---

## <a id="english-docs"></a>🇺🇸 English Documentation

**Multimodal AI Super Prompt Generation System** - An intelligent visual prompt generation system for ComfyUI that combines **visual annotation** with **structured prompt generation**, optimized for Flux Kontext workflow. This is a revolutionary **multimodal AI super prompt interface** that seamlessly integrates visual understanding with text generation.

## 🎯 Visual Demonstration

| Before | After |
|--------|-------|
| ![Before](images/before.png) | ![After](images/after.png) |
| Traditional text prompt input | Multimodal visual prompt generation |

### 💫 Quick Start

1. **Double-click node** → Open visual editor
2. **Draw annotations** → Select tools to mark target areas
3. **Choose templates** → Select operation type and enhancement prompts  
4. **Generate instantly** → Auto-generate structured prompts

## 🎯 Project Purpose

This project aims to build a super prompt generation system based on the **Flux Kontext large model**, achieving fine-grained, multimodal image editing through the collaborative control of intuitive graphic annotation and AI-enhanced intelligent prompts.

Users don't need to master complex prompt writing - they simply need to **select image regions + describe intentions**, and the super prompt system will automatically generate AI-enhanced structured editing instructions to drive the Kontext model to complete intelligent local/global image modifications.

This project strives to achieve:

🖼️ **WYSIWYG Visual Interaction**: Support for multiple annotation methods including rectangles, circles, arrows, and freehand drawing;

✍️ **Automated Structured Prompt Assembly and Completion**: Help novice users efficiently express editing requirements;

🧠 **Integration with Large Model Semantic Understanding**: Precise control over image transformation, replacement, repair, and enhancement;

🔄 **Complete Editing Loop Integration**: From annotation → mask generation → prompt generation → editing execution → feedback display, full-process automatic coordination.

The goal is to create a super prompt generation platform suitable for the **ComfyUI image creation ecosystem**, providing a more intelligent, natural, and efficient interaction method for AI image editing.

## ✨ Key Features

### 🎨 Visual Annotation System
- **4 Drawing Tools**: Rectangle, Circle, Arrow, Freehand Polygon
- **Multi-color Support**: Red, Green, Yellow, Blue annotations
- **Interactive Editing**: Click, drag, select, delete annotations
- **Real-time Preview**: Live annotation rendering on images

### 📝 Multimodal Structured Prompt Generation
- **4 Template Categories**: Local Edits, Global Adjustments, Text Editing, Professional Operations
- **49 Base Templates**: Carefully optimized based on 1025 official Flux Kontext instructions
- **AI Smart Extension**: Generate unlimited variants through Ollama/API enhancers
- **Multi-select Prompts**: Checkbox interface for constraint and decorative prompts
- **Smart Combination**: Automatically convert visual annotations into multimodal AI-comprehensible structured prompts


## 🚀 Implemented Features

### ✅ Core Functionality
- [x] **Visual Prompt Editor Node** - Double-click to open unified interface
- [x] **Multi-tool Annotation** - Rectangle, Circle, Arrow, Freehand drawing
- [x] **4-category Template System** - Local/Global/Text/Professional operations
- [x] **Multi-select Prompt Enhancement** - Checkbox interface for constraint/decorative prompts
- [x] **Real-time Template Switching** - Operation type changes instantly update prompt options
- [x] **Structured Output Generation** - Automatic prompt construction with selected enhancements
- [x] **Image Rendering** - Annotations directly rendered to output images

### ✅ AI Enhancement Features (NEW!)
- [x] **🤖 Local Ollama Service Integration** - Support calling local ollama service to generate structured prompts
- [x] **🌐 API Remote Calling** - Support API remote calling of large language models to generate structured prompts
- [x] **🎯 Multi-layer Instruction Support** - Support different instructions for multiple layers, e.g.: add a puppy at red marker, remove chair at blue marker, etc.
- [x] **📋 Smart Template Library** - 70+ preset templates optimized based on FLUX official training dataset covering local editing, global editing, text editing, professional operations
- [x] **🎲 Seed Parameter Control** - Support seed parameter to control generation randomness and ensure reproducible results
- [x] **✏️ Custom User Templates** - Complete custom guidance prompt save/load/management system
- [x] **🧹 Output Cleaning** - Intelligent cleaning of technical analysis content, outputting concise natural language instructions
- [x] **🔄 Manual Model Refresh** - One-click refresh Ollama model list without restarting ComfyUI
- [x] **DeepSeek R1/V3 Support** - Latest inference optimization model integration
- [x] **Multi-provider Support** - SiliconFlow, DeepSeek, Qianwen, OpenAI
- [x] **Cost Control** - Smart caching and real-time cost monitoring

### 🚀 Model Training Progress
- [x] **Models based on deepseek-r1 and qwen3 for generating kontext prompts are in training**...

### 🌟 Xiangong Cloud Mirror Experience
**Xiangong Cloud Mirror has deployed all the above features**: [https://www.xiangongyun.com/register/FIP8MJ](https://www.xiangongyun.com/register/FIP8MJ) (Search: 小红猪)

### 📈 Planned Advanced Features
- [ ] **Annotation Data Export** - JSON format with coordinates and metadata
- [ ] **Multi-language Support** - Chinese/English interface elements
- [ ] **Session Persistence** - Save & restore annotation states

### ✅ User Experience
- [x] **Intuitive Interface** - Left canvas, right prompt panel layout
- [x] **Responsive Design** - Auto-scaling and zoom controls

## 📋 Template Categories

| Category | Templates | Description |
|----------|-----------|-------------|
| 🎯 **Local Edits** | 18 templates | Object-specific editing (color, style, texture, pose, etc.) |
| 🌍 **Global Adjustments** | 12 templates | Whole image processing (color grading, enhancement, filters) |
| 📝 **Text Editing** | 5 templates | Text manipulation (add, remove, edit, resize, combine) |
| 🔧 **Professional Operations** | 14 templates | Advanced editing (geometric transforms, compositing, etc.) |
| ✏️ **Custom Templates** | Unlimited | User-defined AI guidance prompts with save/load/management |

## 🔮 Future Roadmap

### 📈 Planned Enhancements
- [ ] **AI-powered Annotation** - Automatic object detection and pre-annotation
- [ ] **Custom Template Creator** - User-defined prompt templates
- [ ] **Batch Processing** - Multiple image annotation workflow
- [ ] **Template Marketplace** - Community-shared prompt templates
- [ ] **Advanced Export Formats** - Support for more output formats

### 🧪 Experimental Features
- [ ] **Voice Annotation** - Audio description to prompt conversion
- [ ] **3D Object Support** - Depth-aware annotation tools
- [ ] **Real-time Collaboration** - Multi-user editing sessions
- [ ] **API Integration** - External tool connectivity

## 📦 Installation

### Method 1: Git Clone (Recommended)
```bash
cd ComfyUI/custom_nodes/
git clone https://github.com/aiaiaikkk/kontext-super-prompt.git
```

### Method 2: Manual Installation
1. Copy the `KontextSuperPrompt` folder to your ComfyUI custom_nodes directory
2. Restart ComfyUI
3. Find the `VisualPromptEditor` node in the `kontext_super_prompt/core` category
4. Double-click the node to open the visual editor

## 🎮 Usage

1. **Add Node**: Place `VisualPromptEditor` in your workflow
2. **Connect Image**: Link your image input to the node
3. **Open Editor**: Double-click the node to launch the interface
4. **Annotate**: Use drawing tools to mark areas of interest
5. **Configure**: Select template category and operation type
6. **Enhance**: Choose constraint and decorative prompts via checkboxes
7. **Generate**: Click "Generate Description" for structured prompts
8. **Export**: Save annotations and use generated prompts in your workflow

## 🔧 Requirements

- ComfyUI (latest version recommended)
- Python 3.7+
- Modern web browser with JavaScript enabled
- 4GB+ RAM for optimal performance

## 📊 Project Stats

- **Preset Templates**: 70+ FLUX optimized templates (based on official training dataset)
- **Custom Templates**: Unlimited user-defined guidance prompts
- **AI Enhancement Nodes**: 2 intelligent enhancers (Ollama local + API remote)
- **Prompt Database**: 343 constraint and decorative prompts
- **Multi-layer Support**: Unlimited annotation layers and instruction combinations
- **Language Support**: English/Chinese bilingual interface
- **File Size**: ~3.2MB total package
- **Node Count**: 4 core nodes (editor + 2 AI enhancers + seed control)

---

**Version**: v3.0.0 - Kontext超级提示词版  
**Status**: ✅ Production Ready  
**License**: MIT  
**Compatibility**: ComfyUI 0.4.0+
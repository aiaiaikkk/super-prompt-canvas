# Kontext Visual Prompt Editor - 智能可视化提示编辑器

**[🇨🇳 中文说明](#chinese-docs) | [🇺🇸 English Manual](#english-docs)**

---

## <a id="chinese-docs"></a>🇨🇳 中文说明

### 📖 产品介绍

Kontext Visual Prompt Editor 是一款图像编辑辅助工具，帮助用户轻松创建AI图像编辑指令。您只需在图片上标记想要修改的区域，描述您的想法，工具会自动生成专业的编辑指令，无需学习复杂的提示词语法。

### ✨ 主要功能

![中文界面](images/visual_editor_zh.png)

#### 🖼️ 图像标注
- 提供矩形、圆形、箭头和自由绘制四种标注工具
- 支持红、绿、黄、蓝四种颜色标记
- 可同时标记多个区域进行批量编辑
- 支持调节标注的大小、透明度等属性

#### 📝 编辑指令生成
- **局部编辑**：修改特定对象的颜色、样式、纹理等属性
- **全局调整**：调整整张图片的色调、光线、风格效果
- **文本操作**：在图片上添加、删除或修改文字内容
- **专业处理**：进行图像合成、变形等高级编辑操作

![编辑指令生成](images/basic.png)

#### 🤖 AI智能辅助
- **本地AI支持**：使用本地AI模型，保护数据隐私
- **云端AI服务**：连接多种在线AI服务，获得更强的处理能力
- **智能理解**：自动分析您的编辑需求，提供合适的编辑建议
- **模板系统**：提供多种预设编辑模板，覆盖常见的编辑场景

![API支持](images/api.png)
![Ollama支持](images/ollama.png)

#### 🌐 多语言界面
- 支持中文和英文界面切换
- 一键切换语言，所有界面文本自动更新
- 界面语言设置自动保存

### 🎯 使用场景

#### 人像修图
- 调整人物的表情、服装、发型
- 修改肤色、去除瑕疵
- 改变人物姿势或添加配饰

#### 场景美化
- 更换背景环境
- 调整天空颜色或天气效果
- 修改场景中的物体颜色或样式

#### 产品图片
- 调整产品颜色和材质
- 优化光照和阴影效果
- 添加或移除产品元素

#### 创意设计
- 将照片转换为不同的艺术风格
- 添加创意元素和特效
- 制作拼图和合成图片

### 🚀 操作步骤

#### 基本使用
1. **打开编辑器**：双击节点打开编辑界面
2. **选择工具**：从工具栏选择合适的标注工具
3. **标记区域**：在图片上圈出需要编辑的部分
4. **选择操作**：从模板中选择想要进行的编辑类型
5. **描述需求**：用简单的语言描述您的编辑想法
6. **生成指令**：点击生成按钮，获得专业的编辑指令

#### 高级操作
- **多区域编辑**：用不同颜色标记多个区域，一次处理多个编辑任务
- **精细调整**：通过约束条件和装饰选项优化编辑效果
- **自定义模板**：保存常用的编辑设置，提高工作效率
- **语言切换**：点击界面右上角的语言按钮切换中英文

### 💡 产品特色

#### 简单易用
- 直观的图形操作界面，无需专业技能
- 丰富的编辑模板，适合各种编辑需求
- 自动生成专业指令，节省学习时间

#### 功能全面
- 涵盖图像编辑的各个方面
- 支持从简单修改到复杂合成的各种操作
- 提供多种AI后端选择，适应不同使用环境

#### 灵活扩展
- 支持自定义编辑模板
- 可与其他ComfyUI工具配合使用
- 定期更新功能，持续改进用户体验

### 🔧 安装方法

#### Git安装
1. 打开终端或命令行界面
2. 进入ComfyUI的`custom_nodes`目录
3. 运行 `git clone https://github.com/aiaiaikkk/kontext-super-prompt` 命令
4. 重启ComfyUI

#### 手动安装
1. 下载插件文件包
2. 将文件夹放置到ComfyUI的custom_nodes目录下
3. 重启ComfyUI程序
4. 在工作流中添加相应节点

### 📋 系统要求

- ComfyUI版本：需要较新版本支持
- 浏览器：Chrome、Firefox、Safari或Edge浏览器
- 内存：建议4GB以上可用内存
- 网络：部分AI功能需要网络连接

---

## <a id="english-docs"></a>🇺🇸 English Manual

### 📖 Product Introduction

Kontext Visual Prompt Editor is an image editing assistant tool that helps users easily create AI image editing instructions. Simply mark the areas you want to modify on the image, describe your ideas, and the tool will automatically generate professional editing instructions without needing to learn complex prompt syntax.

### ✨ Main Features

![English Interface](images/visual_editor_en.png)

#### 🖼️ Image Annotation
- Provides four annotation tools: rectangle, circle, arrow, and freehand drawing
- Supports four color markers: red, green, yellow, and blue
- Allows simultaneous marking of multiple areas for batch editing
- Supports adjustment of annotation size, transparency, and other properties

#### 📝 Editing Instruction Generation
- **Local Editing**: Modify specific object colors, styles, textures, and other attributes
- **Global Adjustment**: Adjust overall image tone, lighting, and style effects
- **Text Operations**: Add, delete, or modify text content on images
- **Professional Processing**: Perform advanced editing operations like image compositing and transformation

![Editing Instruction Generation](images/basic.png)

#### 🤖 AI Intelligent Assistance
- **Local AI Support**: Uses local AI models to protect data privacy
- **Cloud AI Services**: Connects to various online AI services for enhanced processing power
- **Smart Understanding**: Automatically analyzes your editing needs and provides suitable editing suggestions
- **Template System**: Provides various preset editing templates covering common editing scenarios

![API Support](images/api.png)
![Ollama Support](images/ollama.png)

#### 🌐 Multi-language Interface
- Supports Chinese and English interface switching
- One-click language switching with automatic text updates
- Interface language settings are automatically saved

### 🎯 Usage Scenarios

#### Portrait Retouching
- Adjust facial expressions, clothing, and hairstyles
- Modify skin tone and remove blemishes
- Change poses or add accessories

#### Scene Enhancement
- Replace background environments
- Adjust sky colors or weather effects
- Modify object colors or styles in scenes

#### Product Images
- Adjust product colors and materials
- Optimize lighting and shadow effects
- Add or remove product elements

#### Creative Design
- Convert photos to different artistic styles
- Add creative elements and effects
- Create collages and composite images

### 🚀 Operation Steps

#### Basic Usage
1. **Open Editor**: Double-click the node to open the editing interface
2. **Select Tools**: Choose appropriate annotation tools from the toolbar
3. **Mark Areas**: Circle the parts that need editing on the image
4. **Choose Operations**: Select the desired editing type from templates
5. **Describe Requirements**: Use simple language to describe your editing ideas
6. **Generate Instructions**: Click the generate button to get professional editing instructions

#### Advanced Operations
- **Multi-area Editing**: Mark multiple areas with different colors to handle multiple editing tasks at once
- **Fine Tuning**: Optimize editing effects through constraint conditions and decorative options
- **Custom Templates**: Save frequently used editing settings to improve work efficiency
- **Language Switching**: Click the language button in the top-right corner to switch between Chinese and English

### 💡 Product Features

#### Simple and Easy to Use
- Intuitive graphical interface requiring no professional skills
- Rich editing templates suitable for various editing needs
- Automatically generates professional instructions, saving learning time

#### Comprehensive Functionality
- Covers all aspects of image editing
- Supports various operations from simple modifications to complex compositions
- Provides multiple AI backend options to adapt to different usage environments

#### Flexible Extension
- Supports custom editing templates
- Can be used in conjunction with other ComfyUI tools
- Regular feature updates with continuous user experience improvements

### 🔧 Installation Methods

#### Git Installation
1. Open a terminal or command prompt
2. Navigate to the `custom_nodes` directory in your ComfyUI installation
3. Run the command `git clone https://github.com/aiaiaikkk/kontext-super-prompt`
4. Restart ComfyUI

#### Manual Installation
1. Download the plugin package
2. Place the folder in ComfyUI's custom_nodes directory
3. Restart the ComfyUI program
4. Add the corresponding nodes to your workflow

### 📋 System Requirements

- ComfyUI Version: Requires recent version support
- Browser: Chrome, Firefox, Safari, or Edge browser
- Memory: Recommended 4GB+ available memory
- Network: Some AI features require internet connection

---

**Version**: v3.1.0 - Intelligence Enhanced Edition  
**Status**: ✅ Ready for Use  
**License**: MIT  
**Author**: Kontext Team
# Kontext Super Prompt

**ComfyUI图像编辑提示词生成节点** - 可视化标注和AI辅助提示词生成

![Installation](images/instruction.png)

## 🎯 主要功能

### 🎨 Super Canvas  
可视化画布标注工具，支持图层管理和绘制功能
- 多种绘制工具：画笔、形状、文字、裁切等
- 画笔羽化效果：支持1-20像素可调羽化半径
- 图层管理：添加、删除、调整顺序、修改属性
- 实时预览：画布状态实时同步
- 输出结构化图层数据供下游节点使用

![Super Canvas](images/LRPG_Canvas.png)

### Super Prompt
提示词生成器，将图层信息转换为编辑指令
- **六种编辑模式**：
  - 局部编辑：针对特定区域的精确编辑
  - 全局编辑：整体图像风格和效果调整
  - 文字编辑：文本内容的添加和修改
  - 高级操作：高级图像处理功能
  - 远程API：集成云端AI模型
  - 本地Ollama：使用本地大语言模型
- **40+操作模板**：颜色变换、物体移除、背景替换、风格转换等
- **提示词生成**：自动生成约束和修饰提示词
- **英文输出保证**：所有模式强制输出英文提示词

![Kontext Super Prompt](images/KontextSuperPrompt.png)

### 🎭 智能面部处理
基于MediaPipe的高精度面部识别和处理系统
- **双脸对齐算法**：智能识别面部关键点，实现精确的面部对齐
- **眼部优先策略**：以双眼为基准进行旋转和缩放计算，再用鼻子/嘴巴精细调整
- **多特征点识别**：支持眼部、鼻子、嘴巴、耳朵等关键面部特征点检测
- **智能坐标映射**：准确处理图像变换和坐标系转换，确保对齐精度
- **降级检测机制**：在MediaPipe不可用时提供基于肤色的启发式检测
- **实时预览调整**：支持手动微调和匹配度评分，优化对齐效果

![面部处理工具1](images/face_tools_1.png)
![面部处理工具2](images/face_tools_2.png)
![面部处理工具3](images/face_tools_3.png)

### 编辑模式界面展示

**局部编辑模式** - 精确的对象级编辑操作
![局部编辑](images/KontextSuperPrompt1.png)

**全局编辑模式** - 整体图像风格和效果调整
![全局编辑](images/KontextSuperPrompt2.png)

**文字编辑模式** - 文本内容的添加和修改
![文字编辑](images/KontextSuperPrompt3.png)

**高级操作模式** - 高级图像处理功能
![高级操作](images/KontextSuperPrompt4.png)

**远程API模式** - 集成云端AI模型
![远程API](images/KontextSuperPrompt5.png)

**本地Ollama模式** - 使用本地大语言模型
![本地Ollama](images/KontextSuperPrompt6.png)

## 🤖 引导词系统

### 编辑意图类型（16种操作）
**您想做什么操作：**
- 颜色修改、物体移除、物体替换、物体添加
- 背景更换、换脸、质量增强、图像修复
- 风格转换、文字编辑、光线调整、透视校正
- 模糊/锐化、局部变形、构图调整、通用编辑

### 应用场景/风格（16种场景）
**用于什么场景：**
- 电商产品、社交媒体、营销活动、人像摄影
- 生活方式、美食摄影、房地产、时尚零售
- 汽车展示、美妆化妆品、企业品牌、活动摄影
- 产品目录、艺术创作、纪实摄影、自动选择

## 📋 使用方法

### 基础工作流
1. 添加`🎨 Super Canvas`节点，连接图像输入
2. 在画布上标注需要编辑的区域
3. 添加`Super Prompt`节点
4. 选择编辑模式和操作类型
5. 生成编辑指令或使用AI增强功能

### 节点连接
```
[图像输入] → [Super Canvas] → [Super Prompt] → [输出提示词]
                    ↓                    ↓
                [标注图像]          [图层信息]
```

### 使用建议

#### 不同场景选择
- **产品图片**：编辑意图选"颜色修改" + 场景选"电商产品"
- **人像美化**：编辑意图选"换脸" + 场景选"人像摄影"
- **营销海报**：编辑意图选"风格转换" + 场景选"营销活动"

#### API使用说明
1. 在对应平台获取API密钥
2. 在远程API选项卡输入密钥
3. 选择模型（系统会自动获取可用模型）
4. 输入编辑描述，点击生成

#### Ollama使用说明
1. 确保已安装Ollama
2. 点击启动服务按钮
3. 选择本地模型
4. 输入描述，生成提示词

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

- ComfyUI (最新版本)
- Python 3.8+
- PyTorch 1.12+
- Ollama (可选，用于本地模型)

## 🚀 快速开始

1. **安装节点包**：通过上述任一方法安装
2. **重启ComfyUI**：确保节点正确加载
3. **添加节点**：在节点菜单中找到 "kontext_super_prompt" 分类
4. **创建工作流**：按照使用方法连接节点
5. **开始使用**：标注图像，生成提示词

## 🤖 其他节点

### TextGen WebUI Flux Kontext Enhancer
与Text Generation WebUI的集成，提供提示词增强功能：
- **自动连接**：自动检测TextGen WebUI服务状态
- **双API支持**：兼容OpenAI API和原生API接口
- **引导系统**：内置商业场景引导词模板
- **批量处理**：支持多任务并行处理
- **缓存优化**：缓存机制减少重复请求
- **使用方式**：启动TextGen WebUI后，添加增强器节点即可使用

## 📖 文档

- [安装指南](INSTALLATION.md)
- [示例工作流](examples/)

## 🔗 链接

- [GitHub仓库](https://github.com/aiaiaikkk/kontext-super-prompt)
- [问题反馈](https://github.com/aiaiaikkk/kontext-super-prompt/issues)

---

**Version**: 1.3.5
**Author**: aiaiaikkk
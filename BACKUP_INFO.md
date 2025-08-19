# 备份信息

## 备份时间
2025年8月18日 17:40

## 备份版本
kontext-super-prompt - Tab Data Isolation Fix

## 主要修改内容

### 修复的问题
- 修正了六个选项卡共享输入框的设计错误
- 每个选项卡现在维护独立的数据存储

### 主要改进

1. **独立数据存储结构**
   - 创建了 `this.tabData` 对象，为每个选项卡维护独立的数据
   - 包含：`local`, `global`, `text`, `professional`, `api`, `ollama` 六个选项卡
   - 每个选项卡都有独立的 `description`, `generatedPrompt`, `selectedConstraints` 等字段

2. **独立的输入组件**
   - 修改了 `createDescriptionSection(tabId)` 方法，为每个选项卡创建独立的描述输入框
   - 修改了 `createGenerateSection(tabId)` 方法，为每个选项卡创建独立的预览框
   - 使用 `data-tab` 属性标识每个组件属于哪个选项卡

3. **数据隔离机制**
   - 重写了 `switchTab()` 方法，实现选项卡间的数据保存和恢复
   - 添加了 `saveCurrentTabData()` 和 `restoreTabData()` 方法
   - 选项卡切换时自动保存当前数据，恢复目标选项卡的数据

4. **更新的数据管理**
   - 添加了 `updateCurrentTabPreview()` 和 `updateCurrentTabDescription()` 方法
   - 移除了全局的 `updateAllPreviewTextareas()` 和 `updateAllDescriptionTextareas()` 方法
   - 更新了数据同步逻辑，使用 `this.currentTabData` 作为当前选项卡的数据访问器

### 现在的行为

- **局部编辑**：用户可以输入针对选定图层的编辑描述
- **全局编辑**：用户可以输入整体图像处理的描述
- **文字编辑**：用户可以输入文本编辑相关的描述  
- **专业操作**：用户可以输入高级编辑操作的描述
- **远程API**：用户可以输入API生成的描述和配置
- **本地Ollama**：用户可以输入本地AI生成的描述和配置

每个选项卡的输入内容现在完全独立，用户可以在不同编辑模式间自由切换而不会丢失或混淆各自的编辑内容。

## 修改的文件
- `web/KontextSuperPrompt.js` - 主要修改文件，实现了数据隔离

## 备份来源
`E:\ComfyUI\custom_nodes\kontext-super-prompt`

## 备份说明
本备份包含完整的节点源代码，已经修复了选项卡数据共享的设计问题。
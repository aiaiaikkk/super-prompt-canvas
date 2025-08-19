# Kontext Super Prompt 文本输入持久化修复

## 问题描述
Kontext Super Prompt节点的文本输入框（包括描述、约束性提示词、修饰性提示词和生成的提示词）在刷新网页或切换工作流后会丢失数据。

## 根本原因
1. DOM widget创建时设置了`serialize: false`，导致ComfyUI不会序列化其数据
2. 文本输入数据只存储在JavaScript内存中，没有保存到ComfyUI的widget系统
3. 节点重新加载时无法从序列化数据中恢复文本输入

## 修复方案

### 1. 修改了`createHiddenWidgets`方法
- 使用ComfyUI的`addWidget`方法创建widget，而不是手动创建widget对象
- 为所有重要数据字段创建可序列化的widget：
  - description
  - constraint_prompts
  - decorative_prompts
  - generated_prompt
  - edit_mode
  - operation_type
  - 以及所有API和Ollama相关参数

### 2. 添加了`restoreDataFromWidgets`方法
- 在节点初始化时从已存在的widget中恢复数据
- 确保节点重新加载时能从序列化的widget值中恢复文本输入

### 3. 修改了`setEditorData`方法
- 优先从widget中获取保存的数据
- 确保DOM widget的setValue方法能正确恢复文本输入

## 关键代码修改

### 1. createHiddenWidgets方法 (第4689-4710行)
```javascript
// 使用ComfyUI的addWidget方法创建可序列化的widget
if (typeof field.value === 'boolean') {
    widget = this.node.addWidget('toggle', field.name, field.value, () => {}, 
        { on: field.name, off: field.name });
} else {
    widget = this.node.addWidget('text', field.name, field.value, () => {});
}

// 隐藏widget从UI
widget.computeSize = () => [0, -4]; // 隐藏widget
```

### 2. 新增restoreDataFromWidgets方法 (第3725-3770行)
```javascript
restoreDataFromWidgets() {
    // 从已序列化的widget中恢复数据
    const descWidget = this.node.widgets.find(w => w.name === 'description');
    const genWidget = this.node.widgets.find(w => w.name === 'generated_prompt');
    // ... 恢复其他数据
    
    if (descWidget && descWidget.value) {
        this.description = descWidget.value;
    }
    // ... 恢复其他数据
}
```

### 3. 修改setEditorData方法 (第5568-5613行)
```javascript
// 首先尝试从widget中获取保存的数据（这些数据会被序列化）
const descWidget = this.node.widgets?.find(w => w.name === 'description');
const genWidget = this.node.widgets?.find(w => w.name === 'generated_prompt');

// 优先使用widget中的值（这些会被序列化保存）
this.description = descWidget?.value || data.description || '';
this.generatedPrompt = genWidget?.value || data.generatedPrompt || '';
```

### 4. 修改initEditor方法 (第1494-1495行)
```javascript
// 首先尝试从已存在的widget中恢复数据（这些是序列化后保存的）
this.restoreDataFromWidgets();
```

## 测试方法
1. 在Kontext Super Prompt节点的文本输入框中输入内容
2. 保存工作流
3. 刷新网页或重新加载工作流
4. 检查文本输入框中的内容是否仍然存在

## 注意事项
- 所有widget都被隐藏（computeSize返回[0, -4]），不会影响UI显示
- 原有的DOM输入框仍然正常工作，数据会自动同步到隐藏的widget中
- 修复保持了原有功能的完整性，只是增加了数据持久化能力
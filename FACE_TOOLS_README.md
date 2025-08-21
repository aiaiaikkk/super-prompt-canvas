# 面部工具功能说明

## 🎯 功能概述

Super Prompt Canvas 现已集成先进的面部处理功能，提供自动面部裁切和对齐功能，基于MediaPipe技术实现实时、准确的面部检测和处理。

## ✨ 主要功能

### 🔍 智能面部检测
- 基于MediaPipe的高精度面部检测
- 支持468个面部关键点检测
- 实时处理，无需服务器
- 数据隐私保护（本地处理）

### ✂️ 自动面部裁切
- **智能边界检测**：自动识别最佳裁切区域
- **多种裁切模式**：
  - 证件照模式（紧凑裁切，10%边距）
  - 头像模式（标准裁切，20%边距）
  - 肖像模式（宽松裁切，30%边距）
  - 艺术模式（宽泛裁切，50%边距）
- **最小尺寸保证**：确保输出图像质量

### 📐 面部对齐功能
- **角度校正**：基于双眼水平线自动校正倾斜
- **Procrustes分析**：精确的几何变换算法
- **关键点对齐**：支持眼部、鼻部、面部中心等对齐模式
- **比例调整**：智能缩放保持面部比例

### 📊 面部分析工具
- **质量评估**：分析图像质量和清晰度
- **特征测量**：双眼距离、面部角度、尺寸信息
- **位置分析**：面部在图像中的位置和比例
- **建议提供**：根据分析结果提供优化建议

### 🔄 批量处理
- **多图同时处理**：支持一键处理多个图像
- **进度监控**：实时显示处理进度
- **错误处理**：智能跳过问题文件，继续处理其他文件

## 🎮 使用方法

### 基本操作

1. **选择图像**：在画布中选择包含人脸的图像对象
2. **选择处理模式**：从下拉菜单选择合适的预设模式
3. **执行操作**：
   - 点击 "智能裁切" 进行面部裁切
   - 点击 "面部对齐" 进行角度校正
   - 点击 "面部分析" 查看详细信息

### 高级设置

点击 "高级设置" 按钮可调整以下参数：

- **裁切边距**：0-50%，控制裁切区域大小
- **最小面部尺寸**：100-500px，确保输出质量
- **输出质量**：50-100%，控制JPEG压缩质量

### 批量处理

1. 在画布中添加多个包含人脸的图像
2. 点击 "批量处理" 按钮
3. 选择处理类型（仅裁切/仅对齐/裁切+对齐）
4. 等待处理完成

### 快捷键

- `Ctrl+J`：智能裁切
- `Ctrl+K`：面部对齐  
- `Ctrl+I`：面部分析

## 🛠️ 技术架构

### 核心组件

```
web/
├── libs/
│   └── mediapipe-face-detection.js  # MediaPipe封装
├── face-processor.js                # 核心算法
├── face-tools.js                    # UI组件
├── face-tools.css                   # 样式文件
└── KontextCanvasNode.js             # 主画布（已集成）
```

### 依赖关系

- **MediaPipe**：面部检测和关键点识别
- **Fabric.js**：画布操作和图像处理
- **原生Web API**：Canvas 2D、File API等

## 📋 预设配置

### 头像模式（默认）
```javascript
{
    cropPadding: 0.2,      // 20%边距
    minFaceSize: 150,      // 最小150px
    alignmentMode: 'eyes', // 基于双眼对齐
    quality: 0.9           // 90%质量
}
```

### 证件照模式
```javascript
{
    cropPadding: 0.1,      // 10%边距
    minFaceSize: 300,      // 最小300px
    alignmentMode: 'face', // 基于面部对齐
    quality: 0.98          // 98%质量
}
```

### 肖像模式
```javascript
{
    cropPadding: 0.3,      // 30%边距
    minFaceSize: 200,      // 最小200px
    alignmentMode: 'eyes', // 基于双眼对齐
    quality: 0.95          // 95%质量
}
```

### 艺术模式
```javascript
{
    cropPadding: 0.5,      // 50%边距
    minFaceSize: 100,      // 最小100px
    alignmentMode: 'nose', // 基于鼻部对齐
    quality: 0.85          // 85%质量
}
```

## 🔧 自定义开发

### 扩展预设配置

```javascript
import { FaceProcessorPresets } from './face-processor.js';

// 添加自定义预设
FaceProcessorPresets.myCustom = {
    cropPadding: 0.25,
    minFaceSize: 180,
    alignmentMode: 'eyes',
    quality: 0.92
};
```

### 自定义处理算法

```javascript
import FaceProcessor from './face-processor.js';

class CustomFaceProcessor extends FaceProcessor {
    async customProcess(input, options) {
        // 自定义处理逻辑
        const faces = await this.detector.detectFaces(input);
        // ... 处理代码
        return result;
    }
}
```

## 🐛 故障排除

### 常见问题

1. **无法检测到人脸**
   - 确保图像中人脸清晰可见
   - 检查图像分辨率是否足够
   - 尝试调整图像亮度和对比度

2. **MediaPipe加载失败**
   - 检查网络连接
   - 确认CDN可访问性
   - 考虑使用本地MediaPipe文件

3. **处理速度慢**
   - 降低图像分辨率
   - 减少并发处理数量
   - 检查设备性能

4. **内存不足**
   - 处理大图像时分批进行
   - 及时清理不需要的图像对象
   - 降低输出质量设置

### 调试工具

在浏览器控制台中运行：

```javascript
// 运行集成测试
import('./face-tools-integration-test.js').then(module => {
    new module.default();
});

// 快速功能检查
import('./face-tools-integration-test.js').then(module => {
    module.default.runQuickTest();
});
```

## 📈 性能优化

### 推荐设置

- **图像尺寸**：建议不超过2048x2048
- **处理数量**：单次批量处理不超过10张
- **网络环境**：首次使用需要良好的网络连接下载模型

### 最佳实践

1. **预处理**：对模糊或低质量图像进行预处理
2. **批量优化**：相似图像使用相同设置批量处理
3. **缓存策略**：MediaPipe模型会自动缓存，无需重复下载
4. **错误恢复**：处理失败时自动重试或跳过

## 🔒 隐私安全

- **本地处理**：所有面部检测和处理在浏览器本地完成
- **无数据传输**：图像数据不会发送到任何服务器
- **即时清理**：处理完成后临时数据自动清理
- **用户控制**：用户完全控制数据的使用和保存

## 📞 技术支持

如果遇到问题或需要帮助：

1. 查看浏览器控制台错误信息
2. 运行集成测试诊断问题
3. 检查网络连接和设备性能
4. 参考本文档的故障排除部分

---

**版本**: 1.0.0  
**更新时间**: 2025-08-21  
**兼容性**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
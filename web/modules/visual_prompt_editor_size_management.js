/**
 * Visual Prompt Editor - 智能尺寸管理模块
 * 负责画布和对象的智能尺寸管理，优化性能
 */

export class IntelligentSizeManager {
    constructor(nodeInstance) {
        this.nodeInstance = nodeInstance;
        
        // 尺寸管理配置
        this.config = {
            // 最大画布尺寸
            maxCanvasSize: 4096,
            
            // 推荐画布尺寸
            recommendedCanvasSizes: [
                { width: 512, height: 512, name: 'SD 1.5' },
                { width: 768, height: 768, name: 'SD XL' },
                { width: 1024, height: 1024, name: 'HD Square' },
                { width: 1280, height: 720, name: 'HD 16:9' },
                { width: 1920, height: 1080, name: 'FHD 16:9' },
                { width: 2048, height: 2048, name: '2K Square' }
            ],
            
            // 对象尺寸优化
            maxObjectSize: 2048,
            minObjectSize: 10,
            
            // 自动优化阈值
            autoOptimizeThreshold: 1000000, // 1百万像素
            
            // 缩放策略
            scaleStrategy: 'contain', // 'contain', 'cover', 'fill'
            
            // 性能配置
            enableProgressiveLoading: true,
            enableLazyLoading: true,
            enableMemoryOptimization: true
        };
        
        // 尺寸缓存
        this.sizeCache = new Map();
        
        // 性能监控
        this.performanceMetrics = {
            resizeOperations: 0,
            optimizationCount: 0,
            memorySaved: 0,
            lastOptimizationTime: 0
        };
        
        console.log('🔧 IntelligentSizeManager initialized');
    }
    
    /**
     * 智能调整画布尺寸
     */
    intelligentResizeCanvas(fabricCanvas, targetWidth, targetHeight, options = {}) {
        const {
            maintainAspectRatio = true,
            optimizeForContent = true,
            progressive = false
        } = options;
        
        console.log(`📏 智能调整画布尺寸: ${targetWidth}x${targetHeight}`);
        
        // 获取当前画布内容
        const objects = fabricCanvas.getObjects();
        const contentBounds = this.calculateContentBounds(objects);
        
        // 计算最优尺寸
        let finalWidth = targetWidth;
        let finalHeight = targetHeight;
        
        if (maintainAspectRatio && contentBounds) {
            const contentRatio = contentBounds.width / contentBounds.height;
            const targetRatio = targetWidth / targetHeight;
            
            if (optimizeForContent) {
                // 根据内容比例调整
                if (Math.abs(contentRatio - targetRatio) > 0.1) {
                    if (contentRatio > targetRatio) {
                        finalHeight = Math.round(targetWidth / contentRatio);
                    } else {
                        finalWidth = Math.round(targetHeight * contentRatio);
                    }
                    console.log(`🎯 根据内容比例调整尺寸: ${finalWidth}x${finalHeight}`);
                }
            }
        }
        
        // 限制最大尺寸
        finalWidth = Math.min(finalWidth, this.config.maxCanvasSize);
        finalHeight = Math.min(finalHeight, this.config.maxCanvasSize);
        
        // 渐进式调整（对于大尺寸画布）
        if (progressive && (finalWidth > 2000 || finalHeight > 2000)) {
            return this.progressiveResize(fabricCanvas, finalWidth, finalHeight);
        }
        
        // 执行调整
        return this.executeCanvasResize(fabricCanvas, finalWidth, finalHeight, {
            contentBounds,
            maintainContentScale: optimizeForContent
        });
    }
    
    /**
     * 计算内容边界
     */
    calculateContentBounds(objects) {
        if (!objects || objects.length === 0) {
            return null;
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        objects.forEach(obj => {
            if (!obj.visible || obj.skipInBoundsCalculation) return;
            
            const bounds = obj.getBoundingRect();
            minX = Math.min(minX, bounds.left);
            minY = Math.min(minY, bounds.top);
            maxX = Math.max(maxX, bounds.left + bounds.width);
            maxY = Math.max(maxY, bounds.top + bounds.height);
        });
        
        if (minX === Infinity) return null;
        
        return {
            left: minX,
            top: minY,
            width: maxX - minX,
            height: maxY - minY,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2
        };
    }
    
    /**
     * 渐进式调整画布尺寸
     */
    progressiveResize(fabricCanvas, targetWidth, targetHeight) {
        return new Promise((resolve) => {
            const currentWidth = fabricCanvas.getWidth();
            const currentHeight = fabricCanvas.getHeight();
            
            // 计算调整步数
            const widthDiff = targetWidth - currentWidth;
            const heightDiff = targetHeight - currentHeight;
            const steps = Math.max(Math.abs(widthDiff), Math.abs(heightDiff)) / 100;
            
            let currentStep = 0;
            
            const performStep = () => {
                currentStep++;
                const progress = currentStep / steps;
                
                const stepWidth = Math.round(currentWidth + widthDiff * progress);
                const stepHeight = Math.round(currentHeight + heightDiff * progress);
                
                fabricCanvas.setDimensions({
                    width: stepWidth,
                    height: stepHeight
                });
                
                fabricCanvas.renderAll();
                
                if (currentStep < steps) {
                    requestAnimationFrame(performStep);
                } else {
                    // 确保最终尺寸精确
                    fabricCanvas.setDimensions({
                        width: targetWidth,
                        height: targetHeight
                    });
                    fabricCanvas.renderAll();
                    
                    console.log(`✅ 渐进式调整完成: ${targetWidth}x${targetHeight}`);
                    resolve(fabricCanvas);
                }
            };
            
            performStep();
        });
    }
    
    /**
     * 执行画布调整
     */
    executeCanvasResize(fabricCanvas, width, height, options = {}) {
        const {
            contentBounds,
            maintainContentScale = false
        } = options;
        
        const oldWidth = fabricCanvas.getWidth();
        const oldHeight = fabricCanvas.getHeight();
        
        // 记录调整操作
        this.performanceMetrics.resizeOperations++;
        
        // 调整画布尺寸
        fabricCanvas.setDimensions({ width, height });
        
        // 如果需要保持内容比例
        if (maintainContentScale && contentBounds) {
            const scaleX = width / oldWidth;
            const scaleY = height / oldHeight;
            
            // 调整所有对象的位置和大小
            fabricCanvas.getObjects().forEach(obj => {
                obj.set({
                    left: obj.left * scaleX,
                    top: obj.top * scaleY,
                    scaleX: obj.scaleX * scaleX,
                    scaleY: obj.scaleY * scaleY
                });
                
                // 如果是组对象，需要特殊处理
                if (obj.type === 'group') {
                    obj.forEachObject((subObj, index) => {
                        subObj.set({
                            left: subObj.left * scaleX,
                            top: subObj.top * scaleY,
                            scaleX: subObj.scaleX * scaleX,
                            scaleY: subObj.scaleY * scaleY
                        });
                    });
                }
            });
        }
        
        fabricCanvas.renderAll();
        
        console.log(`✅ 画布尺寸调整完成: ${oldWidth}x${oldHeight} → ${width}x${height}`);
        
        // 缓存尺寸信息
        this.sizeCache.set('canvas', { width, height, timestamp: Date.now() });
        
        return fabricCanvas;
    }
    
    /**
     * 智能优化对象尺寸
     */
    optimizeObjectSize(fabricObject, options = {}) {
        const {
            maxSize = this.config.maxObjectSize,
            minSize = this.config.minObjectSize,
            maintainQuality = true
        } = options;
        
        if (!fabricObject) return null;
        
        console.log(`🔧 优化对象尺寸: ${fabricObject.type}`);
        
        // 获取对象当前尺寸
        const bounds = fabricObject.getBoundingRect();
        const currentSize = Math.max(bounds.width, bounds.height);
        
        // 检查是否需要优化
        if (currentSize <= maxSize && currentSize >= minSize) {
            console.log('ℹ️ 对象尺寸已在优化范围内，无需调整');
            return fabricObject;
        }
        
        // 计算缩放比例
        let scale = 1;
        if (currentSize > maxSize) {
            scale = maxSize / currentSize;
        } else if (currentSize < minSize) {
            scale = minSize / currentSize;
        }
        
        // 应用缩放
        if (scale !== 1) {
            fabricObject.set({
                scaleX: fabricObject.scaleX * scale,
                scaleY: fabricObject.scaleY * scale
            });
            
            // 如果是图像对象，可能需要重新采样以保持质量
            if (maintainQuality && fabricObject.type === 'image') {
                this.resampleImageObject(fabricObject, scale);
            }
            
            this.performanceMetrics.optimizationCount++;
            console.log(`✅ 对象尺寸已优化，缩放比例: ${scale.toFixed(3)}`);
        }
        
        return fabricObject;
    }
    
    /**
     * 重新采样图像对象
     */
    resampleImageObject(fabricObject, scale) {
        if (!fabricObject.getElement) return;
        
        try {
            const element = fabricObject.getElement();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 计算新尺寸
            const newWidth = element.naturalWidth * scale;
            const newHeight = element.naturalHeight * scale;
            
            canvas.width = newWidth;
            canvas.height = newHeight;
            
            // 高质量重新采样
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(element, 0, 0, newWidth, newHeight);
            
            // 更新Fabric对象
            fabricObject.setElement(canvas);
            
            console.log(`🖼️ 图像重新采样完成: ${newWidth}x${newHeight}`);
        } catch (error) {
            console.warn('⚠️ 图像重新采样失败:', error);
        }
    }
    
    /**
     * 自动优化所有对象
     */
    autoOptimizeAllObjects(fabricCanvas) {
        console.log('🚀 开始自动优化所有对象...');
        
        const objects = fabricCanvas.getObjects();
        let optimizedCount = 0;
        let totalMemorySaved = 0;
        
        objects.forEach(obj => {
            const beforeSize = this.calculateObjectMemorySize(obj);
            
            // 优化对象尺寸
            this.optimizeObjectSize(obj);
            
            // 优化图像数据
            if (obj.type === 'image') {
                totalMemorySaved += this.optimizeImageMemory(obj);
            }
            
            const afterSize = this.calculateObjectMemorySize(obj);
            totalMemorySaved += (beforeSize - afterSize);
            
            optimizedCount++;
        });
        
        // 更新性能指标
        this.performanceMetrics.memorySaved += totalMemorySaved;
        this.performanceMetrics.lastOptimizationTime = Date.now();
        
        fabricCanvas.renderAll();
        
        console.log(`✅ 自动优化完成: ${optimizedCount} 个对象，节省内存: ${(totalMemorySaved / 1024 / 1024).toFixed(2)}MB`);
        
        return {
            optimizedCount,
            memorySaved: totalMemorySaved
        };
    }
    
    /**
     * 计算对象内存占用
     */
    calculateObjectMemorySize(fabricObject) {
        // 估算内存占用
        let size = 0;
        
        // 基础对象属性
        size += 100; // 基础属性约100字节
        
        // 图像对象特殊处理
        if (fabricObject.type === 'image' && fabricObject.getElement) {
            const element = fabricObject.getElement();
            if (element.naturalWidth && element.naturalHeight) {
                // 假设RGBA格式
                size += element.naturalWidth * element.naturalHeight * 4;
            }
        }
        
        // 复杂路径对象
        if (fabricObject.type === 'path' && fabricObject.path) {
            size += fabricObject.path.length * 20; // 每个路径点约20字节
        }
        
        return size;
    }
    
    /**
     * 优化图像内存
     */
    optimizeImageMemory(fabricObject) {
        if (!fabricObject.type === 'image' || !fabricObject.getElement) return 0;
        
        const element = fabricObject.getElement();
        const originalSize = element.naturalWidth * element.naturalHeight * 4;
        
        // 如果图像过大，进行压缩
        if (originalSize > this.config.autoOptimizeThreshold) {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 计算合适的尺寸
                const scale = Math.sqrt(this.config.autoOptimizeThreshold / originalSize);
                const newWidth = Math.round(element.naturalWidth * scale);
                const newHeight = Math.round(element.naturalHeight * scale);
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                // 高质量缩放
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(element, 0, 0, newWidth, newHeight);
                
                // 更新对象
                fabricObject.setElement(canvas);
                
                const newSize = newWidth * newHeight * 4;
                const saved = originalSize - newSize;
                
                console.log(`💾 图像内存优化: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(newSize / 1024 / 1024).toFixed(2)}MB`);
                
                return saved;
            } catch (error) {
                console.warn('⚠️ 图像内存优化失败:', error);
            }
        }
        
        return 0;
    }
    
    /**
     * 智能缩放以适应画布
     */
    intelligentScaleToFit(fabricCanvas, padding = 20) {
        const objects = fabricCanvas.getObjects();
        if (objects.length === 0) return fabricCanvas;
        
        // 计算内容边界
        const contentBounds = this.calculateContentBounds(objects);
        if (!contentBounds) return fabricCanvas;
        
        const canvasWidth = fabricCanvas.getWidth();
        const canvasHeight = fabricCanvas.getHeight();
        
        // 计算可用空间（减去内边距）
        const availableWidth = canvasWidth - padding * 2;
        const availableHeight = canvasHeight - padding * 2;
        
        // 计算缩放比例
        const scaleX = availableWidth / contentBounds.width;
        const scaleY = availableHeight / contentBounds.height;
        const scale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小
        
        if (scale < 1) {
            console.log(`📐 智能缩放内容以适应画布，比例: ${scale.toFixed(3)}`);
            
            // 计算内容中心点
            const contentCenterX = contentBounds.left + contentBounds.width / 2;
            const contentCenterY = contentBounds.top + contentBounds.height / 2;
            
            // 计算画布中心点
            const canvasCenterX = canvasWidth / 2;
            const canvasCenterY = canvasHeight / 2;
            
            // 应用缩放和居中
            objects.forEach(obj => {
                // 相对于内容中心的位置
                const relativeX = obj.left - contentCenterX;
                const relativeY = obj.top - contentCenterY;
                
                // 缩放后的位置
                obj.set({
                    left: canvasCenterX + relativeX * scale,
                    top: canvasCenterY + relativeY * scale,
                    scaleX: obj.scaleX * scale,
                    scaleY: obj.scaleY * scale
                });
            });
            
            fabricCanvas.renderAll();
        }
        
        return fabricCanvas;
    }
    
    /**
     * 获取推荐尺寸列表
     */
    getRecommendedSizes() {
        return this.config.recommendedCanvasSizes;
    }
    
    /**
     * 检测最佳尺寸
     */
    detectOptimalSize(fabricCanvas) {
        const objects = fabricCanvas.getObjects();
        const contentBounds = this.calculateContentBounds(objects);
        
        if (!contentBounds) {
            // 默认返回中等尺寸
            return { width: 1024, height: 1024 };
        }
        
        // 分析内容特性
        const aspectRatio = contentBounds.width / contentBounds.height;
        const area = contentBounds.width * contentBounds.height;
        
        // 根据内容面积推荐尺寸
        let recommendedSize;
        if (area < 500000) { // 小内容
            recommendedSize = { width: 512, height: 512 };
        } else if (area < 1000000) { // 中等内容
            recommendedSize = { width: 1024, height: 1024 };
        } else if (area < 2000000) { // 大内容
            recommendedSize = { width: 1536, height: 1536 };
        } else { // 超大内容
            recommendedSize = { width: 2048, height: 2048 };
        }
        
        // 根据宽高比调整
        if (aspectRatio > 1.5) { // 宽屏
            recommendedSize.height = Math.round(recommendedSize.width / aspectRatio);
        } else if (aspectRatio < 0.67) { // 竖屏
            recommendedSize.width = Math.round(recommendedSize.height * aspectRatio);
        }
        
        console.log(`🎯 检测到最佳尺寸: ${recommendedSize.width}x${recommendedSize.height}`);
        
        return recommendedSize;
    }
    
    /**
     * 获取性能指标
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            cacheSize: this.sizeCache.size,
            config: this.config
        };
    }
    
    /**
     * 清理缓存
     */
    clearCache() {
        this.sizeCache.clear();
        console.log('🧹 尺寸缓存已清理');
    }
    
    /**
     * 销毁管理器
     */
    destroy() {
        this.clearCache();
        console.log('🗑️ IntelligentSizeManager 已销毁');
    }
}

/**
 * 创建智能尺寸管理器
 */
export function createIntelligentSizeManager(nodeInstance) {
    return new IntelligentSizeManager(nodeInstance);
}
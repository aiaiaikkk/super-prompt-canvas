/**
 * Visual Prompt Editor - 数据管理模块
 * 负责数据的存储、加载、同步和状态管理
 * 🔧 实现LRU缓存策略以优化内存使用
 */

/**
 * LRU缓存实现
 * 🔧 最近最少使用缓存策略
 */
class LRUCache {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.cache = new Map();
        this.hits = 0;
        this.misses = 0;
    }
    
    /**
     * 检查缓存是否存在
     */
    has(key) {
        return this.cache.has(key);
    }
    
    /**
     * 获取缓存数据
     */
    get(key) {
        if (this.cache.has(key)) {
            const value = this.cache.get(key);
            // 移动到最前面（最近使用）
            this.cache.delete(key);
            this.cache.set(key, value);
            this.hits++;
            return value.data;
        }
        this.misses++;
        return null;
    }
    
    /**
     * 设置缓存数据
     */
    set(key, data) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // 删除最久未使用的数据
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            data: JSON.parse(JSON.stringify(data)),
            timestamp: Date.now()
        });
    }
    
    /**
     * 清理过期数据
     */
    cleanup(maxAge = 300000) { // 5分钟
        const now = Date.now();
        for (const [key, value] of this.cache) {
            if (now - value.timestamp > maxAge) {
                this.cache.delete(key);
            }
        }
    }
    
    /**
     * 获取缓存统计
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses) * 100).toFixed(2) + '%' : '0%'
        };
    }
    
    /**
     * 清空缓存
     */
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }
}

export class DataManager {
    constructor(nodeInstance) {
        this.nodeInstance = nodeInstance;
        this.dataCache = new LRUCache(100); // 使用LRU缓存
        this.stateHistory = [];
        this.maxHistorySize = 50;
        
        // 图层状态缓存 - 使用LRU缓存
        this.layerStateCache = new LRUCache(50);
        
        // 🔧 内存优化相关属性
        this.lastCanvasHash = null; // 用于检测画布变化
        this.lastSaveTime = 0; // 上次保存时间
        this.minSaveInterval = 1000; // 最小保存间隔(1秒)
        
        // 🔧 定期清理缓存
        this.cacheCleanupInterval = setInterval(() => {
            this.dataCache.cleanup();
            this.layerStateCache.cleanup();
            console.log('🧹 Cache cleanup completed:', {
                dataCache: this.dataCache.getStats(),
                layerCache: this.layerStateCache.getStats()
            });
        }, 60000); // 每分钟清理一次
    }

    /**
     * 保存Transform-First数据到节点widget
     * LRPG架构：从annotation_data升级到Transform-First数据传输
     */
    saveAnnotationData(modal, promptData) {
        
        try {
            const annotationDataWidget = this.nodeInstance.widgets?.find(w => w.name === "annotation_data");
            
            if (!annotationDataWidget) {
                console.error('❌ 未找到annotation_data widget');
                return false;
            }

            // 🚀 Kontext Transform-First架构：生成轻量级transform数据
            const transformData = this.convertToTransformFirstData(promptData);
            
            // 保存Transform-First数据作为JSON字符串
            const dataToSave = JSON.stringify(transformData);
            annotationDataWidget.value = dataToSave;
            
            console.log('[Kontext] 🎯 Transform-First数据已保存到widget:', {
                layers: transformData.layer_transforms ? Object.keys(transformData.layer_transforms).length : 0,
                canvas_size: transformData.canvas_size,
                timestamp: transformData.timestamp
            });
            
            // 缓存数据
            this.cacheData('last_saved', promptData);
            
            return true;
        } catch (error) {
            console.error('❌ 保存标注数据失败:', error);
            return false;
        }
    }

    /**
     * Kontext Transform-First架构：将annotation数据转换为轻量级Transform数据
     * 这是核心转换函数，从传统annotation模式升级到Transform-First模式
     */
    convertToTransformFirstData(promptData) {
        // ✅ LRPG统一格式 - 无转换层
        const transformData = {
            node_id: this.nodeId?.toString() || "unknown", 
            timestamp: Date.now().toString(),
            type: 'temp',
            subfolder: 'lrpg_canvas',
            overwrite: 'true',
            layer_transforms: {}
        };

        // Background layer - LRPG格式
        transformData.layer_transforms.background = {
            width: promptData.canvasWidth || 800,
            height: promptData.canvasHeight || 600
        };

        // 🚀 LRPG架构：从fabricJSON提取Transform-First格式数据
        if (promptData.fabricJSON && promptData.fabricJSON.objects) {
            promptData.fabricJSON.objects.forEach((obj, index) => {
                const layerId = obj.fabricId || `fabric_${index}`;
                if (!transformData.layer_transforms[layerId]) {
                    // ✅ LRPG正确格式：使用中心点坐标系统
                    const centerX = (obj.left || 0) + (obj.width || 0) / 2;
                    const centerY = (obj.top || 0) + (obj.height || 0) / 2;
                    
                    // ✅ 处理显示缩放：获取对象的显示缩放信息
                    const displayScaleX = obj.displayScale || 1;
                    const displayScaleY = obj.displayScale || 1;
                    const actualScaleX = (obj.scaleX || 1);
                    const actualScaleY = (obj.scaleY || 1);
                    
                    transformData.layer_transforms[layerId] = {
                        // ✅ LRPG核心：中心点坐标系统
                        centerX: centerX,
                        centerY: centerY,
                        
                        // ✅ LRPG核心：完整变换参数
                        scaleX: actualScaleX,
                        scaleY: actualScaleY,
                        angle: obj.angle || 0,
                        width: obj.width || 100,         // 原始宽度
                        height: obj.height || 100,       // 原始高度
                        flipX: obj.flipX || false,       // X轴翻转
                        flipY: obj.flipY || false,       // Y轴翻转
                        
                        // ✅ LRPG双层尺寸系统
                        display_scale: {
                            scaleX: displayScaleX,
                            scaleY: displayScaleY,
                            optimized: obj.needsScaling || false
                        },
                        
                        // 保留类型和样式信息
                        type: obj.type || "rect",
                        style: {
                            stroke: obj.stroke || "#ff0000",
                            strokeWidth: obj.strokeWidth || 2,
                            fill: obj.fill || "transparent",
                            opacity: obj.opacity !== undefined ? obj.opacity : 0.5  // 🔧 添加透明度属性
                        }
                    };
                    
                    // 🚀 Transform-First: 提取裁切变换数据
                    if (obj.transformFirstData && obj.transformFirstData.transforms) {
                        transformData.layer_transforms[layerId].transform_first_data = {
                            crop_transforms: obj.transformFirstData.transforms.filter(t => t.type === 'crop_mask'),
                            has_transform_changes: obj.hasTransformFirstChanges || false,
                            version: obj.transformFirstData.version || '1.0'
                        };
                        
                        console.log(`[Kontext-TransformFirst] 📊 检测到对象 ${layerId} 的裁切变换数据:`, 
                            transformData.layer_transforms[layerId].transform_first_data);
                    }
                }
            });
        }
        
        console.log('[Kontext] ✨ 数据转换完成：Annotation → Transform-First', {
            原始annotations数量: promptData.annotations?.length || 0,
            转换后transforms数量: Object.keys(transformData.layer_transforms).length,
            canvas尺寸: transformData.canvas_size,
            用户提示词: transformData.user_prompt?.substring(0, 50) + '...',
            包含裁切变换的对象: Object.values(transformData.layer_transforms)
                .filter(t => t.transform_first_data?.crop_transforms?.length > 0).length
        });

        return transformData;
    }

    /**
     * 加载标注数据从节点widget
     */
    loadAnnotationData() {
        
        try {
            const annotationDataWidget = this.nodeInstance.widgets?.find(w => w.name === "annotation_data");
            
            if (!annotationDataWidget || !annotationDataWidget.value) {
                return null;
            }

            const parsedData = JSON.parse(annotationDataWidget.value);
            
            // 缓存加载的数据
            this.cacheData('last_loaded', parsedData);
            
            return parsedData;
        } catch (error) {
            console.error('❌ 加载标注数据失败:', error);
            return null;
        }
    }

    /**
     * 标准化标注数据
     */
    normalizeAnnotationData(annotation) {
        const normalized = {
            id: annotation.id || `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: annotation.type || 'rectangle',
            start: annotation.start || { x: 0, y: 0 },
            end: annotation.end || { x: 100, y: 100 },
            color: annotation.color || '#ff0000',
            fillMode: annotation.fillMode || 'filled',
            opacity: annotation.opacity || 50,
            number: annotation.number !== undefined ? annotation.number : 0,
            selected: annotation.selected || false,
            visible: annotation.visible !== false,
            created: annotation.created || Date.now(),
            modified: Date.now(),
            ...annotation
        };

        // 确保几何数据的正确性
        if (annotation.geometry && annotation.geometry.coordinates) {
            normalized.geometry = {
                type: annotation.geometry.type || 'Polygon',
                coordinates: annotation.geometry.coordinates
            };
        }

        // 处理画笔数据
        if (annotation.type === 'brush' || annotation.type === 'freehand') {
            if (annotation.pathData) {
                normalized.pathData = annotation.pathData;
            }
            if (annotation.points) {
                normalized.points = annotation.points;
            }
        }

        // 处理多边形数据
        if (annotation.type === 'polygon' && annotation.points) {
            normalized.points = annotation.points;
        }

        return normalized;
    }

    /**
     * 同步目标文本到后端
     */
    syncTargetTextToBackend(modal) {
        const targetInput = modal.querySelector('#target-input');
        
        if (targetInput) {
            const targetTextWidget = this.nodeInstance.widgets?.find(w => w.name === "target_text");
            if (targetTextWidget && targetInput.value !== targetTextWidget.value) {
                targetTextWidget.value = targetInput.value;
            }
        }
    }

    /**
     * 初始化前端UI从后端参数
     */
    initializeFrontendFromBackend(modal) {
        const targetTextWidget = this.nodeInstance.widgets?.find(w => w.name === "target_text");
        const targetInput = modal.querySelector('#target-input');
        
        if (targetTextWidget && targetInput && targetTextWidget.value) {
            targetInput.value = targetTextWidget.value;
        }
    }

    /**
     * 缓存数据
     * 🔧 使用LRU缓存策略
     */
    cacheData(key, data) {
        this.dataCache.set(key, data);
    }

    /**
     * 获取缓存数据
     * 🔧 使用LRU缓存策略
     */
    getCachedData(key) {
        return this.dataCache.get(key);
    }
    
    /**
     * 获取缓存统计信息
     */
    getCacheStats() {
        return {
            dataCache: this.dataCache.getStats(),
            layerCache: this.layerStateCache.getStats()
        };
    }
    
    /**
     * 清理所有缓存
     */
    clearAllCaches() {
        this.dataCache.clear();
        this.layerStateCache.clear();
        
        // 清理历史记录
        this.stateHistory = [];
        
        // 清理定时器
        if (this.cacheCleanupInterval) {
            clearInterval(this.cacheCleanupInterval);
            this.cacheCleanupInterval = null;
        }
        
        console.log('🧹 All caches cleared');
    }

    /**
     * 保存状态到历史记录
     */
    saveStateToHistory(modal, actionName) {
        const state = {
            action: actionName,
            timestamp: Date.now(),
            // Transform-First架构：移除废弃的annotations字段
            selectedLayers: modal.selectedLayers ? Array.from(modal.selectedLayers) : []
        };
        
        this.stateHistory.push(state);
        
        // 🔧 优化历史记录大小管理 - 保留最近的状态
        if (this.stateHistory.length > this.maxHistorySize) {
            // 删除最旧的状态，但保留一些关键状态
            const keepCount = Math.floor(this.maxHistorySize * 0.3); // 保留30%
            const statesToRemove = this.stateHistory.length - this.maxHistorySize;
            
            // 优先删除非关键状态
            const nonCriticalStates = this.stateHistory.filter(s => 
                !s.action.includes('save') && !s.action.includes('load')
            );
            
            if (nonCriticalStates.length >= statesToRemove) {
                // 删除非关键状态
                for (let i = 0; i < statesToRemove; i++) {
                    const index = this.stateHistory.findIndex(s => 
                        !s.action.includes('save') && !s.action.includes('load')
                    );
                    if (index !== -1) {
                        this.stateHistory.splice(index, 1);
                    }
                }
            } else {
                // 如果非关键状态不够，从开头删除
                this.stateHistory.splice(0, statesToRemove);
            }
            
            console.log(`🗑️ History trimmed: removed ${statesToRemove} states, kept ${this.stateHistory.length}`);
        }
        
    }

    /**
     * 从历史记录恢复状态
     */
    restoreFromHistory(modal, stepsBack = 1) {
        if (this.stateHistory.length < stepsBack + 1) {
            return false;
        }
        
        const targetIndex = this.stateHistory.length - stepsBack - 1;
        const state = this.stateHistory[targetIndex];
        
        if (!state) {
            return false;
        }
        
        
        // Transform-First架构：无需恢复annotations数据
        
        // 恢复选择状态
        modal.selectedLayers = new Set(state.selectedLayers);
        
        // Fabric objects do not need layer connection restoration
        
        this.stateHistory = this.stateHistory.slice(0, targetIndex + 1);
        
        return true;
    }
    
    /**
     * 智能图层状态管理系统 - 提升用户体验
     */
    
    /**
     * 初始化增强的图层状态管理
     */
    initializeEnhancedLayerManagement(modal) {
        console.log('🎯 初始化增强的图层状态管理系统...');
        
        // 创建图层状态管理器
        if (!modal.layerStateManager) {
            modal.layerStateManager = {
                // 图层状态历史
                layerHistory: new Map(),
                maxHistoryPerLayer: 20,
                
                // 图层分组管理
                layerGroups: new Map(),
                
                // 图层锁定状态
                lockedLayers: new Set(),
                
                // 图层可见性状态
                visibilityStates: new Map(),
                
                // 图层选择历史
                selectionHistory: [],
                maxSelectionHistory: 10,
                
                // 图层操作队列
                operationQueue: [],
                isProcessing: false
            };
        }
        
        // 绑定图层事件
        this.bindLayerStateEvents(modal);
        
        // 初始化图层快捷键
        this.initializeLayerShortcuts(modal);
        
        console.log('✅ 增强的图层状态管理系统已初始化');
    }
    
    /**
     * 绑定图层状态事件
     */
    bindLayerStateEvents(modal) {
        // 图层选择事件
        modal.addEventListener('layer-selected', (e) => {
            this.handleLayerSelection(modal, e.detail.layerId, e.detail.multiSelect);
        });
        
        // 图层变换事件
        modal.addEventListener('layer-transformed', (e) => {
            this.recordLayerTransform(modal, e.detail.layerId, e.detail.transformData);
        });
        
        // 图层锁定事件
        modal.addEventListener('layer-locked', (e) => {
            this.toggleLayerLock(modal, e.detail.layerId, e.detail.locked);
        });
        
        // 图层可见性事件
        modal.addEventListener('layer-visibility-changed', (e) => {
            this.updateLayerVisibility(modal, e.detail.layerId, e.detail.visible);
        });
    }
    
    /**
     * 处理图层选择
     */
    handleLayerSelection(modal, layerId, multiSelect = false) {
        const stateManager = modal.layerStateManager;
        
        if (!multiSelect) {
            // 单选：清空其他选择
            modal.selectedLayers = new Set([layerId]);
        } else {
            // 多选：切换选择状态
            if (modal.selectedLayers.has(layerId)) {
                modal.selectedLayers.delete(layerId);
            } else {
                modal.selectedLayers.add(layerId);
            }
        }
        
        // 记录选择历史
        this.recordSelectionHistory(modal, layerId);
        
        // 恢复图层状态
        this.restoreLayerStateEnhanced(modal, layerId);
        
        // 更新UI
        this.updateLayerUI(modal, layerId);
        
        console.log(`🎯 图层选择: ${layerId}, 多选: ${multiSelect}, 已选: ${Array.from(modal.selectedLayers).join(', ')}`);
    }
    
    /**
     * 记录图层变换
     */
    recordLayerTransform(modal, layerId, transformData) {
        const stateManager = modal.layerStateManager;
        
        // 获取图层历史
        if (!stateManager.layerHistory.has(layerId)) {
            stateManager.layerHistory.set(layerId, []);
        }
        
        const history = stateManager.layerHistory.get(layerId);
        
        // 添加变换记录
        history.push({
            timestamp: Date.now(),
            transform: { ...transformData },
            // 保存快照用于撤销
            snapshot: this.createLayerSnapshot(modal, layerId)
        });
        
        // 限制历史大小
        if (history.length > stateManager.maxHistoryPerLayer) {
            history.shift();
        }
        
        console.log(`📝 记录图层 ${layerId} 的变换，历史记录: ${history.length}`);
    }
    
    /**
     * 创建图层快照
     */
    createLayerSnapshot(modal, layerId) {
        // 查找对应的Fabric对象
        const fabricObject = this.findFabricObjectById(modal, layerId);
        
        if (fabricObject) {
            return {
                left: fabricObject.left,
                top: fabricObject.top,
                scaleX: fabricObject.scaleX,
                scaleY: fabricObject.scaleY,
                angle: fabricObject.angle,
                flipX: fabricObject.flipX,
                flipY: fabricObject.flipY,
                opacity: fabricObject.opacity
            };
        }
        
        return null;
    }
    
    /**
     * 查找Fabric对象
     */
    findFabricObjectById(modal, layerId) {
        if (!modal.fabricCanvas) return null;
        
        const objects = modal.fabricCanvas.getObjects();
        return objects.find(obj => obj.fabricId === layerId || obj.name === layerId);
    }
    
    /**
     * 恢复增强的图层状态
     */
    restoreLayerStateEnhanced(modal, layerId) {
        // 首先调用基础的状态恢复
        this.restoreLayerState(layerId, modal);
        
        // 恢复变换历史
        const stateManager = modal.layerStateManager;
        if (stateManager.layerHistory.has(layerId)) {
            const history = stateManager.layerHistory.get(layerId);
            if (history.length > 0) {
                const lastState = history[history.length - 1];
                console.log(`🔄 恢复图层 ${layerId} 的最后状态:`, lastState.transform);
            }
        }
        
        // 恢复可见性
        if (stateManager.visibilityStates.has(layerId)) {
            const visible = stateManager.visibilityStates.get(layerId);
            this.setLayerVisibility(modal, layerId, visible);
        }
        
        // 恢复锁定状态
        const isLocked = stateManager.lockedLayers.has(layerId);
        this.setLayerLock(modal, layerId, isLocked);
    }
    
    /**
     * 记录选择历史
     */
    recordSelectionHistory(modal, layerId) {
        const stateManager = modal.layerStateManager;
        
        stateManager.selectionHistory.push({
            timestamp: Date.now(),
            layerId: layerId,
            selectedLayers: Array.from(modal.selectedLayers)
        });
        
        // 限制历史大小
        if (stateManager.selectionHistory.length > stateManager.maxSelectionHistory) {
            stateManager.selectionHistory.shift();
        }
    }
    
    /**
     * 初始化图层快捷键
     */
    initializeLayerShortcuts(modal) {
        // Ctrl/Cmd + Z: 撤销图层变换
        modal.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undoLayerTransform(modal);
            }
            
            // Ctrl/Cmd + Shift + Z: 重做图层变换
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                this.redoLayerTransform(modal);
            }
            
            // Delete: 删除选中图层
            if (e.key === 'Delete' && modal.selectedLayers.size > 0) {
                e.preventDefault();
                this.deleteSelectedLayers(modal);
            }
            
            // Ctrl/Cmd + D: 复制图层
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.duplicateSelectedLayers(modal);
            }
            
            // Ctrl/Cmd + G: 图层编组
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                e.preventDefault();
                this.groupSelectedLayers(modal);
            }
            
            // Ctrl/Cmd + Shift + G: 取消编组
            if ((e.ctrlKey || e.metaKey) && e.key === 'g' && e.shiftKey) {
                e.preventDefault();
                this.ungroupSelectedLayers(modal);
            }
        });
        
        console.log('⌨️ 图层快捷键已初始化');
    }
    
    /**
     * 撤销图层变换
     */
    undoLayerTransform(modal) {
        const stateManager = modal.layerStateManager;
        
        // 对每个选中的图层执行撤销
        modal.selectedLayers.forEach(layerId => {
            const history = stateManager.layerHistory.get(layerId);
            if (history && history.length > 1) {
                // 移除最后一个状态
                const lastState = history.pop();
                
                // 应用前一个状态
                const prevState = history[history.length - 1];
                if (prevState && prevState.snapshot) {
                    this.applyLayerSnapshot(modal, layerId, prevState.snapshot);
                }
                
                console.log(`↩️ 撤销图层 ${layerId} 的变换`);
            }
        });
        
        // 更新画布
        if (modal.fabricCanvas) {
            modal.fabricCanvas.renderAll();
        }
    }
    
    /**
     * 重做图层变换
     */
    redoLayerTransform(modal) {
        // 这里需要实现重做逻辑
        // 通常需要维护一个撤销栈和一个重做栈
        console.log('↪️ 重做图层变换 (待实现)');
    }
    
    /**
     * 应用图层快照
     */
    applyLayerSnapshot(modal, layerId, snapshot) {
        const fabricObject = this.findFabricObjectById(modal, layerId);
        
        if (fabricObject && snapshot) {
            fabricObject.set({
                left: snapshot.left,
                top: snapshot.top,
                scaleX: snapshot.scaleX,
                scaleY: snapshot.scaleY,
                angle: snapshot.angle,
                flipX: snapshot.flipX,
                flipY: snapshot.flipY,
                opacity: snapshot.opacity
            });
            
            console.log(`🎯 应用图层 ${layerId} 快照:`, snapshot);
        }
    }
    
    /**
     * 删除选中图层
     */
    deleteSelectedLayers(modal) {
        if (!modal.fabricCanvas) return;
        
        const deletedLayers = [];
        
        modal.selectedLayers.forEach(layerId => {
            const fabricObject = this.findFabricObjectById(modal, layerId);
            if (fabricObject) {
                modal.fabricCanvas.remove(fabricObject);
                deletedLayers.push(layerId);
                
                // 清理状态
                const stateManager = modal.layerStateManager;
                stateManager.layerHistory.delete(layerId);
                stateManager.visibilityStates.delete(layerId);
                stateManager.lockedLayers.delete(layerId);
            }
        });
        
        // 清空选择
        modal.selectedLayers.clear();
        
        // 更新UI
        this.updateLayerListUI(modal);
        
        console.log(`🗑️ 已删除图层: ${deletedLayers.join(', ')}`);
    }
    
    /**
     * 复制选中图层
     */
    duplicateSelectedLayers(modal) {
        if (!modal.fabricCanvas) return;
        
        const duplicatedLayers = [];
        
        modal.selectedLayers.forEach(layerId => {
            const fabricObject = this.findFabricObjectById(modal, layerId);
            if (fabricObject) {
                // 克隆对象
                fabricObject.clone((cloned) => {
                    // 设置偏移位置
                    const newId = `fabric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    cloned.set({
                        left: cloned.left + 20,
                        top: cloned.top + 20,
                        fabricId: newId,
                        id: newId  // ✅ 修复：统一ID字段
                    });
                    
                    modal.fabricCanvas.add(cloned);
                    duplicatedLayers.push(cloned.fabricId);
                });
            }
        });
        
        // 选中新复制的图层
        modal.selectedLayers.clear();
        duplicatedLayers.forEach(layerId => modal.selectedLayers.add(layerId));
        
        // 更新UI
        this.updateLayerListUI(modal);
        
        console.log(`📋 已复制图层: ${duplicatedLayers.join(', ')}`);
    }
    
    /**
     * 图层编组
     */
    groupSelectedLayers(modal) {
        if (!modal.fabricCanvas || modal.selectedLayers.size < 2) return;
        
        const activeObjects = [];
        modal.selectedLayers.forEach(layerId => {
            const fabricObject = this.findFabricObjectById(modal, layerId);
            if (fabricObject) {
                activeObjects.push(fabricObject);
            }
        });
        
        if (activeObjects.length >= 2) {
            const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const group = new fabric.Group(activeObjects, {
                fabricId: groupId,
                id: groupId  // ✅ 修复：统一ID字段
            });
            
            modal.fabricCanvas.discardActiveObject();
            modal.fabricCanvas.add(group);
            modal.fabricCanvas.setActiveObject(group);
            modal.fabricCanvas.renderAll();
            
            // 更新选择状态
            modal.selectedLayers.clear();
            modal.selectedLayers.add(group.fabricId);
            
            console.log(`📦 已创建图层组: ${group.fabricId}`);
        }
    }
    
    /**
     * 取消编组
     */
    ungroupSelectedLayers(modal) {
        if (!modal.fabricCanvas) return;
        
        modal.selectedLayers.forEach(layerId => {
            const fabricObject = this.findFabricObjectById(modal, layerId);
            if (fabricObject && fabricObject.type === 'group') {
                const items = fabricObject._objects;
                fabricObject.destroy();
                
                items.forEach(item => {
                    modal.fabricCanvas.add(item);
                });
                
                modal.fabricCanvas.remove(fabricObject);
            }
        });
        
        modal.fabricCanvas.renderAll();
        console.log(`📂 已取消图层编组`);
    }
    
    /**
     * 设置图层可见性
     */
    setLayerVisibility(modal, layerId, visible) {
        const fabricObject = this.findFabricObjectById(modal, layerId);
        if (fabricObject) {
            fabricObject.visible = visible;
            if (modal.fabricCanvas) {
                modal.fabricCanvas.renderAll();
            }
        }
        
        // 更新状态
        const stateManager = modal.layerStateManager;
        stateManager.visibilityStates.set(layerId, visible);
        
        console.log(`👁️ 图层 ${layerId} 可见性: ${visible ? '显示' : '隐藏'}`);
    }
    
    /**
     * 设置图层锁定
     */
    setLayerLock(modal, layerId, locked) {
        const fabricObject = this.findFabricObjectById(modal, layerId);
        if (fabricObject) {
            fabricObject.selectable = !locked;
            fabricObject.evented = !locked;
            if (modal.fabricCanvas) {
                modal.fabricCanvas.renderAll();
            }
        }
        
        // 更新状态
        const stateManager = modal.layerStateManager;
        if (locked) {
            stateManager.lockedLayers.add(layerId);
        } else {
            stateManager.lockedLayers.delete(layerId);
        }
        
        console.log(`🔒 图层 ${layerId} 锁定: ${locked ? '锁定' : '解锁'}`);
    }
    
    /**
     * 更新图层UI
     */
    updateLayerUI(modal, layerId) {
        // 更新图层列表中的选中状态
        const layerItems = modal.querySelectorAll('.layer-list-item');
        layerItems.forEach(item => {
            if (item.dataset.layerId === layerId) {
                if (modal.selectedLayers.has(layerId)) {
                    item.classList.add('selected');
                    item.style.background = '#10b981';
                } else {
                    item.classList.remove('selected');
                    item.style.background = '';
                }
            }
        });
        
        // 更新选择计数
        const selectionCount = modal.querySelector('#selection-count');
        if (selectionCount) {
            selectionCount.textContent = `${modal.selectedLayers.size} selected`;
        }
    }
    
    /**
     * 更新图层列表UI
     */
    updateLayerListUI(modal) {
        // 这里需要重新构建图层列表
        // 可以调用现有的更新函数
        if (modal.updateObjectSelector) {
            modal.updateObjectSelector();
        }
    }
    
    /**
     * 导出图层状态
     */
    exportLayerStates(modal) {
        const stateManager = modal.layerStateManager;
        
        return {
            layerHistory: Object.fromEntries(stateManager.layerHistory),
            layerGroups: Object.fromEntries(stateManager.layerGroups),
            lockedLayers: Array.from(stateManager.lockedLayers),
            visibilityStates: Object.fromEntries(stateManager.visibilityStates),
            selectionHistory: stateManager.selectionHistory,
            selectedLayers: Array.from(modal.selectedLayers || [])
        };
    }
    
    /**
     * 导入图层状态
     */
    importLayerStates(modal, states) {
        const stateManager = modal.layerStateManager;
        
        // 恢复历史
        if (states.layerHistory) {
            stateManager.layerHistory = new Map(Object.entries(states.layerHistory));
        }
        
        // 恢复分组
        if (states.layerGroups) {
            stateManager.layerGroups = new Map(Object.entries(states.layerGroups));
        }
        
        // 恢复锁定状态
        if (states.lockedLayers) {
            stateManager.lockedLayers = new Set(states.lockedLayers);
        }
        
        // 恢复可见性
        if (states.visibilityStates) {
            stateManager.visibilityStates = new Map(Object.entries(states.visibilityStates));
        }
        
        // 恢复选择状态
        if (states.selectedLayers) {
            modal.selectedLayers = new Set(states.selectedLayers);
        }
        
        console.log('📥 图层状态已导入');
    }
    
    /**
     * 清理图层状态
     */
    cleanupLayerStates(modal) {
        if (modal.layerStateManager) {
            modal.layerStateManager.layerHistory.clear();
            modal.layerStateManager.layerGroups.clear();
            modal.layerStateManager.lockedLayers.clear();
            modal.layerStateManager.visibilityStates.clear();
            modal.layerStateManager.selectionHistory = [];
            modal.layerStateManager.operationQueue = [];
            
            console.log('🧹 图层状态已清理');
        }
    }

    /**
     * 缓存图层状态 - 保存操作类型、约束和修饰提示词设置
     */
    cacheLayerState(layerId, modal) {
        if (!layerId) return;
        
        const operationType = modal.querySelector('#operation-type')?.value;
        const targetInput = modal.querySelector('#target-input')?.value;
        
        const constraintPrompts = [];
        const constraintCheckboxes = modal.querySelectorAll('#layer-constraint-prompts-container .constraint-prompt-checkbox:checked');
        constraintCheckboxes.forEach(checkbox => {
            const promptText = checkbox.nextElementSibling?.textContent?.trim();
            if (promptText) {
                constraintPrompts.push(promptText);
            }
        });
        
        const decorativePrompts = [];
        const decorativeCheckboxes = modal.querySelectorAll('#layer-decorative-prompts-container .decorative-prompt-checkbox:checked');
        decorativeCheckboxes.forEach(checkbox => {
            const promptText = checkbox.nextElementSibling?.textContent?.trim();
            if (promptText) {
                decorativePrompts.push(promptText);
            }
        });
        
        // 缓存状态
        const layerState = {
            operationType: operationType || '',
            targetInput: targetInput || '',
            constraintPrompts: constraintPrompts,
            decorativePrompts: decorativePrompts,
            timestamp: Date.now()
        };
        
        this.layerStateCache.set(layerId, layerState);
    }
    
    /**
     * 恢复图层状态
     */
    restoreLayerState(layerId, modal) {
        if (!layerId || !this.layerStateCache.has(layerId)) {
            return false;
        }
        
        const layerState = this.layerStateCache.get(layerId);
        
        // 恢复操作类型
        const operationType = modal.querySelector('#operation-type');
        if (operationType && layerState.operationType) {
            operationType.value = layerState.operationType;
            // 触发change事件以更新相关的约束和修饰提示词选项
            operationType.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // 恢复描述文本
        const targetInput = modal.querySelector('#target-input');
        if (targetInput && layerState.targetInput) {
            targetInput.value = layerState.targetInput;
        }
        
        // 延迟恢复提示词选择状态，等待选项加载完成
        setTimeout(() => {
            this.restorePromptSelections(modal, layerState);
        }, 100);
        
        return true;
    }
    
    /**
     * 恢复提示词选择状态
     */
    restorePromptSelections(modal, layerState) {
        // 恢复约束性提示词选择
        if (layerState.constraintPrompts && layerState.constraintPrompts.length > 0) {
            const constraintCheckboxes = modal.querySelectorAll('#layer-constraint-prompts-container .constraint-prompt-checkbox');
            constraintCheckboxes.forEach(checkbox => {
                const promptText = checkbox.nextElementSibling?.textContent?.trim();
                if (promptText && layerState.constraintPrompts.includes(promptText)) {
                    checkbox.checked = true;
                    // 触发change事件以同步数据
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }
        
        // 恢复修饰性提示词选择
        if (layerState.decorativePrompts && layerState.decorativePrompts.length > 0) {
            const decorativeCheckboxes = modal.querySelectorAll('#layer-decorative-prompts-container .decorative-prompt-checkbox');
            decorativeCheckboxes.forEach(checkbox => {
                const promptText = checkbox.nextElementSibling?.textContent?.trim();
                if (promptText && layerState.decorativePrompts.includes(promptText)) {
                    checkbox.checked = true;
                    // 触发change事件以同步数据
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }
    }
    
    /**
     * 清除图层状态缓存
     */
    clearLayerStateCache(layerId = null) {
        if (layerId) {
            this.layerStateCache.delete(layerId);
        } else {
            this.layerStateCache.clear();
        }
    }

    /**
     * 保存Fabric.js画布数据和图像到节点widget
     * 🔧 修复内存泄露：智能缓存和数据清理
     */
    saveFabricCanvasData(fabricCanvas) {
        if (!fabricCanvas) {
            return false;
        }
        
        try {
            const objects = fabricCanvas.getObjects().filter(obj => !obj.isLockIndicator && !obj.skipInLayerList);
            
            // 🧠 智能保存策略：检查时间间隔和内容变化
            const currentTime = Date.now();
            const currentHash = this.calculateCanvasHash(fabricCanvas, objects);
            
            // 检查时间间隔
            if (currentTime - this.lastSaveTime < this.minSaveInterval) {
                console.log('🔄 Save too frequent, skipping to prevent memory accumulation');
                return true;
            }
            
            // 检查内容变化
            if (this.lastCanvasHash === currentHash) {
                console.log('🔄 Canvas unchanged, skipping save to prevent memory accumulation');
                return true; // 数据未变化，跳过保存
            }
            
            // 🗑️ 清理旧的图像数据缓存
            this.clearPreviousCanvasData();
            
            // 🎯 修改：只传递处理参数，不传递图像数据
            // 后端将根据fabricJSON和处理参数重构相同的图像
            let canvasDataURL = null; // 始终为null，避免内存泄漏
            
            const backgroundColor = fabricCanvas.backgroundColor || '#ffffff';
            
            // 🎯 增强：序列化完整的处理参数，确保后端能精确重构图像
            const fabricData = {
                version: '3.2', // 版本号更新
                timestamp: Date.now(),
                canvasWidth: fabricCanvas.getWidth(),
                canvasHeight: fabricCanvas.getHeight(),
                backgroundColor: backgroundColor,
                
                // 🚫 不再传递canvasImageDataURL以避免内存泄漏
                canvasImageDataURL: null,
                
                // 🎯 完整的Fabric.js JSON数据用于后端重构
                fabricJSON: (function() {
                    // 🕵️ 性能诊断：监控Fabric.js toJSON操作
                    const toJSONStart = performance.now();
                    const fabricJSON = fabricCanvas.toJSON([
                        'fabricId', 'name', 'locked', 'opacity',
                        'transformFirstData', 'hasTransformFirstChanges',
                        'originalBase64', 'src'  // 🚀 新增：保存上传图像数据
                    ]);
                    const toJSONEnd = performance.now();
                    const toJSONDuration = toJSONEnd - toJSONStart;
                    
                    console.log(`🔍 [FABRIC_TO_JSON] Fabric.js序列化耗时: ${toJSONDuration.toFixed(2)}ms`);
                    
                    if (toJSONDuration > 100) {
                        console.warn(`⚠️ [PERFORMANCE] Fabric.js toJSON操作缓慢: ${toJSONDuration.toFixed(2)}ms - 可能原因:`);
                        console.warn(`  - 对象数量: ${objects.length}`);
                        console.warn(`  - 图像对象: ${imageObjects.length}`);
                        if (largeImages.length > 0) {
                            console.warn(`  - 大图像数量: ${largeImages.length}`);
                        }
                    }
                    
                    return fabricJSON;
                })(), 
                
                // 🎯 增强的处理元数据
                processingMetadata: {
                    devicePixelRatio: window.devicePixelRatio || 1,
                    canvasViewScale: 1.0, // 画布视图缩放
                    renderingEngine: 'fabric.js',
                    browserInfo: navigator.userAgent,
                    colorSpace: 'sRGB',
                    antiAliasing: true
                },
                
                // 🎯 详细的对象信息
                objects: objects.map(obj => {
                    const objData = obj.toObject();
                    
                    // 保存自定义属性和渲染参数
                    if (obj.fabricId) objData.fabricId = obj.fabricId;
                    if (obj.name) objData.name = obj.name;
                    if (obj.locked !== undefined) objData.locked = obj.locked;
                    
                    // 保存精确的变换矩阵
                    if (obj.calcTransformMatrix) {
                        objData.transformMatrix = obj.calcTransformMatrix();
                    }
                    
                    return objData;
                })
            };
            
            // 🕵️ 性能诊断：分析对象构成
            const imageObjects = objects.filter(obj => obj.type === 'image');
            const largeImages = imageObjects.filter(img => {
                const size = (img.width || 0) * (img.height || 0);
                return size > 1000000; // 大于1百万像素
            });
            
            console.log(`🎨 [CANVAS_DATA] Fabric canvas data prepared: ${objects.length} 对象 (图像: ${imageObjects.length}, 大图像: ${largeImages.length}), processing-only mode, background: ${backgroundColor}`);
            
            if (largeImages.length > 0) {
                console.warn(`🔍 [PERFORMANCE] 检测到 ${largeImages.length} 个大尺寸图像对象，可能影响序列化性能`);
                largeImages.forEach((img, i) => {
                    const size = (img.width || 0) * (img.height || 0);
                    console.warn(`  大图像 ${i+1}: ${img.width || 0}x${img.height || 0} = ${(size/1000000).toFixed(1)}MP`);
                });
            }
            
            // 保存到annotation_data widget
            const annotationDataWidget = this.nodeInstance.widgets?.find(w => w.name === "annotation_data");
            if (annotationDataWidget) {
                // 🗑️ 清理旧数据引用
                if (annotationDataWidget.value) {
                    try {
                        const oldData = JSON.parse(annotationDataWidget.value);
                        if (oldData.canvasImageDataURL) {
                            // 标记旧数据为清理状态
                            oldData.canvasImageDataURL = null;
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
                
                // 🕵️ 性能诊断：监控序列化过程
                const serializeStart = performance.now();
                const jsonString = JSON.stringify(fabricData);
                const serializeEnd = performance.now();
                const serializeDuration = serializeEnd - serializeStart;
                
                annotationDataWidget.value = jsonString;
                this.lastCanvasHash = currentHash; // 更新哈希值
                this.lastSaveTime = currentTime; // 更新保存时间
                
                console.log(`📊 [SERIALIZE] 序列化完成 - 耗时: ${serializeDuration.toFixed(2)}ms, 数据大小: ${(jsonString.length / 1024).toFixed(2)}KB`);
                
                // ⚠️ 如果序列化时间过长，发出警告
                if (serializeDuration > 200) {
                    console.warn(`⚠️ [PERFORMANCE] JSON序列化耗时过长: ${serializeDuration.toFixed(2)}ms`);
                    
                    if (imageObjects.length > 0) {
                        console.warn(`🔍 [CAUSE] 可能原因: 包含 ${imageObjects.length} 个图像对象`);
                    }
                    
                    if (objects.length > 20) {
                        console.warn(`🔍 [CAUSE] 对象总数过多: ${objects.length}`);
                    }
                }
                
                // 🗑️ 延迟清理确保内存释放（但保留活动画布）
                setTimeout(() => {
                    this.forceGarbageCollection(true); // 传入 true 表示保留活动画布
                }, 100);
                
                console.log('✅ Canvas data saved with memory optimization');
                return true;
            } else {
                console.error('❌ 未找到annotation_data widget');
                return false;
            }
            
        } catch (error) {
            console.error('❌ 保存Fabric画布数据失败:', error);
            return false;
        }
    }
    
    /**
     * 保存Fabric.js画布数据到节点widget - 异步版本优化性能
     */
    async saveFabricCanvasDataAsync(fabricCanvas) {
        if (!fabricCanvas) {
            return false;
        }
        
        return new Promise((resolve) => {
            // 使用 requestIdleCallback 在浏览器空闲时执行
            const saveCallback = () => {
                try {
                    const objects = fabricCanvas.getObjects().filter(obj => !obj.isLockIndicator && !obj.skipInLayerList);
                    
                    // 🧠 智能保存策略：检查时间间隔和内容变化
                    const currentTime = Date.now();
                    const currentHash = this.calculateCanvasHash(fabricCanvas, objects);
                    
                    // 检查时间间隔
                    if (currentTime - this.lastSaveTime < this.minSaveInterval) {
                        console.log('🔄 Save too frequent, skipping to prevent memory accumulation');
                        resolve(true);
                        return;
                    }
                    
                    // 检查内容变化
                    if (this.lastCanvasHash === currentHash) {
                        console.log('🔄 Canvas unchanged, skipping save to prevent memory accumulation');
                        resolve(true); // 数据未变化，跳过保存
                        return;
                    }
                    
                    // 🗑️ 清理旧的图像数据缓存
                    this.clearPreviousCanvasData();
                    
                    // 🎯 修改：只传递处理参数，不传递图像数据
                    let canvasDataURL = null; // 始终为null，避免内存泄漏
                    
                    const backgroundColor = fabricCanvas.backgroundColor || '#ffffff';
                    
                    // 🕵️ 性能诊断：分析对象构成
                    const imageObjects = objects.filter(obj => obj.type === 'image');
                    const largeImages = imageObjects.filter(img => {
                        const size = (img.width || 0) * (img.height || 0);
                        return size > 1000000; // 大于1百万像素
                    });
                    
                    // 🚀 优化：分批处理对象，避免阻塞主线程
                    const processObjectsBatch = (startIndex, batchSize = 10) => {
                        const endIndex = Math.min(startIndex + batchSize, objects.length);
                        const batch = objects.slice(startIndex, endIndex);
                        
                        return batch.map(obj => {
                            const objData = obj.toObject();
                            
                            // 🚀 优化：只序列化必要属性
                            if (obj.fabricId) objData.fabricId = obj.fabricId;
                            if (obj.name) objData.name = obj.name;
                            if (obj.locked !== undefined) objData.locked = obj.locked;
                            
                            // 🚀 跳过大图像的原始数据
                            if (obj.type === 'image' && objData.src) {
                                delete objData.src;
                                delete objData.crossOrigin;
                            }
                            
                            return objData;
                        });
                    };
                    
                    // 分批处理所有对象
                    const allProcessedObjects = [];
                    for (let i = 0; i < objects.length; i += 10) {
                        allProcessedObjects.push(...processObjectsBatch(i, 10));
                    }
                    
                    // 🎯 完整的Fabric.js JSON数据用于后端重构
                    // 🕵️ 性能诊断：监控Fabric.js toJSON操作
                    const toJSONStart = performance.now();
                    const fabricJSON = fabricCanvas.toJSON([
                        'fabricId', 'name', 'locked', 'opacity',
                        'transformFirstData', 'hasTransformFirstChanges',
                        'originalBase64', 'src'  // 🚀 新增：保存上传图像数据
                    ]);
                    const toJSONEnd = performance.now();
                    const toJSONDuration = toJSONEnd - toJSONStart;
                    
                    console.log(`🔍 [FABRIC_TO_JSON] Fabric.js序列化耗时: ${toJSONDuration.toFixed(2)}ms`);
                    
                    if (toJSONDuration > 100) {
                        console.warn(`⚠️ [PERFORMANCE] Fabric.js toJSON操作缓慢: ${toJSONDuration.toFixed(2)}ms - 可能原因:`);
                        console.warn(`  - 对象数量: ${objects.length}`);
                        console.warn(`  - 图像对象: ${imageObjects.length}`);
                        if (largeImages.length > 0) {
                            console.warn(`  - 大图像数量: ${largeImages.length}`);
                        }
                    }
                    
                    const fabricData = {
                        version: '3.2', // 版本号更新
                        timestamp: Date.now(),
                        canvasWidth: fabricCanvas.getWidth(),
                        canvasHeight: fabricCanvas.getHeight(),
                        backgroundColor: backgroundColor,
                        
                        // 🚫 不再传递canvasImageDataURL以避免内存泄漏
                        canvasImageDataURL: null,
                        
                        fabricJSON: fabricJSON, 
                        
                        // 🚀 Transform-First架构：移除废弃字段
                        layers_data: _filterActualAnnotations(allProcessedObjects),
                        
                        // 🎯 内容分析（自动保存版本）
                        content_analysis: _analyzeContentFromObjects(allProcessedObjects),
                        
                        // 🎯 增强的处理元数据
                        processingMetadata: {
                            devicePixelRatio: window.devicePixelRatio || 1,
                            canvasViewScale: 1.0, // 画布视图缩放
                            renderingEngine: 'fabric.js',
                            browserInfo: navigator.userAgent,
                            colorSpace: 'sRGB',
                            antiAliasing: true
                        },
                        
                        // 🎯 详细的对象信息（已优化）
                        objects: allProcessedObjects
                    };
                    
                    console.log(`🎨 [CANVAS_DATA] Fabric canvas data prepared: ${objects.length} 对象 (图像: ${imageObjects.length}, 大图像: ${largeImages.length}), processing-only mode, background: ${backgroundColor}`);
                    
                    // 保存到节点widget
                    const annotationDataWidget = this.nodeInstance.widgets?.find(w => w.name === "annotation_data");
                    
                    if (annotationDataWidget) {
                        // 🕵️ 性能诊断：监控JSON序列化
                        const serializeStart = performance.now();
                        const jsonString = JSON.stringify(fabricData);
                        const serializeEnd = performance.now();
                        const serializeDuration = serializeEnd - serializeStart;
                        
                        annotationDataWidget.value = jsonString;
                        this.lastCanvasHash = currentHash; // 更新哈希值
                        this.lastSaveTime = currentTime; // 更新保存时间
                        
                        console.log(`📊 [SERIALIZE] 序列化完成 - 耗时: ${serializeDuration.toFixed(2)}ms, 数据大小: ${(jsonString.length / 1024).toFixed(2)}KB`);
                        
                        // ⚠️ 如果序列化时间过长，发出警告
                        if (serializeDuration > 200) {
                            console.warn(`⚠️ [PERFORMANCE] JSON序列化耗时过长: ${serializeDuration.toFixed(2)}ms`);
                            
                            if (imageObjects.length > 0) {
                                console.warn(`🔍 [CAUSE] 可能原因: 包含 ${imageObjects.length} 个图像对象`);
                            }
                            
                            if (objects.length > 20) {
                                console.warn(`🔍 [CAUSE] 对象总数过多: ${objects.length}`);
                            }
                        }
                        
                        // 🗑️ 延迟清理确保内存释放（但保留活动画布）
                        setTimeout(() => {
                            this.forceGarbageCollection(true); // 传入 true 表示保留活动画布
                        }, 100);
                        
                        console.log('✅ Canvas data saved with memory optimization');
                        resolve(true);
                    } else {
                        console.error('❌ 未找到annotation_data widget');
                        resolve(false);
                    }
                    
                } catch (error) {
                    console.error('❌ 保存Fabric画布数据失败:', error);
                    resolve(false);
                }
            };
            
            // 使用 requestIdleCallback 或 setTimeout 延迟执行
            if (window.requestIdleCallback) {
                window.requestIdleCallback(saveCallback, { timeout: 1000 });
            } else {
                setTimeout(saveCallback, 0);
            }
        });
    }
    
    /**
     * 从节点widget加载Fabric.js画布数据
     */
    loadFabricCanvasData() {
        try {
            const annotationDataWidget = this.nodeInstance.widgets?.find(w => w.name === "annotation_data");
            
            if (!annotationDataWidget || !annotationDataWidget.value) {
                return null;
            }

            const fabricData = JSON.parse(annotationDataWidget.value);
            
            if (!fabricData.objects || !Array.isArray(fabricData.objects)) {
                return null;
            }
            
            return fabricData;
            
        } catch (error) {
            console.error('❌ 加载Fabric画布数据失败:', error);
            return null;
        }
    }
    
    /**
     * 恢复Fabric.js画布对象
     */
    async restoreFabricCanvas(fabricCanvas, fabricData) {
        if (!fabricCanvas || !fabricData || !fabricData.objects) {
            return false;
        }
        
        try {
            // 等待fabric库加载完成
            if (!window.fabric) {
                return false;
            }
            
            // 先创建所有对象，确保没有错误后再清除现有画布
            const restoredObjects = [];
            
            // 逐个恢复对象
            for (const objData of fabricData.objects) {
                try {
                    let fabricObject = null;
                    
                    // 根据对象类型创建对应的Fabric对象
                    switch (objData.type) {
                        case 'rect':
                            fabricObject = new fabric.Rect(objData);
                            break;
                        case 'circle':
                            fabricObject = new fabric.Circle(objData);
                            break;
                        case 'polygon':
                            fabricObject = new fabric.Polygon(objData.points, objData);
                            break;
                        case 'path':
                            fabricObject = new fabric.Path(objData.path, objData);
                            break;
                        case 'i-text':
                        case 'text':
                            fabricObject = new fabric.IText(objData.text, objData);
                            break;
                        case 'image':
                            // 图片对象需要特殊处理
                            if (objData.src) {
                                fabricObject = await new Promise((resolve) => {
                                    fabric.Image.fromURL(objData.src, (img) => {
                                        // 应用原始属性
                                        img.set(objData);
                                        resolve(img);
                                    });
                                });
                            }
                            break;
                        default:
                            continue;
                    }
                    
                    if (fabricObject) {
                        // 确保对象有fabricId和id
                        if (objData.fabricId) {
                            fabricObject.fabricId = objData.fabricId;
                            fabricObject.id = objData.fabricId;  // ✅ 修复：统一ID字段
                        } else {
                            const newId = `fabric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                            fabricObject.fabricId = newId;
                            fabricObject.id = newId;  // ✅ 修复：统一ID字段
                        }
                        
                        restoredObjects.push(fabricObject);
                    }
                    
                } catch (objError) {
                    console.error('❌ 恢复单个对象失败:', objError, objData);
                }
            }
            
            // 只有成功创建了对象才清除现有画布并添加新对象
            if (restoredObjects.length > 0) {
                fabricCanvas.clear();
                
                // 重新设置画布尺寸和背景色（clear()会清除这些设置）
                if (fabricData.canvasWidth && fabricData.canvasHeight) {
                    fabricCanvas.setDimensions({
                        width: fabricData.canvasWidth,
                        height: fabricData.canvasHeight
                    });
                }
                
                fabricCanvas.setBackgroundColor('#ffffff', () => {
                    restoredObjects.forEach(obj => {
                        fabricCanvas.add(obj);
                    });
                    
                    // 渲染画布
                    fabricCanvas.renderAll();
                });
                
                return true;
            } else {
                return false;
            }
            
        } catch (error) {
            console.error('❌ 恢复Fabric画布失败:', error);
            return false;
        }
    }

    /**
     * 导出数据
     */
    exportData(modal, format = 'json') {
        
        const exportData = {
            version: '2.0',
            exported: Date.now(),
            // Transform-First架构：移除废弃的annotations字段
            // connectedLayers removed - using Fabric objects
            settings: {
                operationType: modal.querySelector('#operation-type')?.value,
                targetText: modal.querySelector('#target-input')?.value
            }
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(exportData, null, 2);
            case 'csv':
                return this.exportToCSV(exportData);
            default:
                return exportData;
        }
    }

    /**
     * 导出为CSV格式
     */
    exportToCSV(data) {
        const annotations = []; // Transform-First架构：不再使用annotations
        const headers = ['ID', 'Type', 'StartX', 'StartY', 'EndX', 'EndY', 'Color', 'FillMode', 'Opacity', 'Created'];
        
        const rows = annotations.map(ann => [
            ann.id,
            ann.type,
            ann.start?.x || 0,
            ann.start?.y || 0,
            ann.end?.x || 0,
            ann.end?.y || 0,
            ann.color,
            ann.fillMode,
            ann.opacity,
            new Date(ann.created || 0).toISOString()
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
            
        return csvContent;
    }

    /**
     * 导入数据
     */
    importData(modal, dataString, format = 'json') {
        
        try {
            let importData;
            
            switch (format) {
                case 'json':
                    importData = JSON.parse(dataString);
                    break;
                case 'csv':
                    importData = this.importFromCSV(dataString);
                    break;
                default:
                    throw new Error('不支持的导入格式');
            }
            
            // 验证数据格式
            if (!this.validateImportData(importData)) {
                throw new Error('导入数据格式无效');
            }
            
            // 保存当前状态到历史记录
            this.saveStateToHistory(modal, 'before_import');
            
            // Transform-First架构：不再导入annotations数据
            
            // Import connectedLayers removed - using Fabric objects
            
            // 导入设置
            if (importData.settings) {
                this.applyImportSettings(modal, importData.settings);
            }
            
            return true;
        } catch (error) {
            console.error('❌ 导入数据失败:', error);
            return false;
        }
    }

    /**
     * 验证导入数据
     */
    validateImportData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        if (data.annotations && !Array.isArray(data.annotations)) {
            return false;
        }
        
        // connectedLayers validation removed
        
        return true;
    }

    /**
     * 应用导入的设置
     */
    applyImportSettings(modal, settings) {
        if (settings.operationType) {
            const operationType = modal.querySelector('#operation-type');
            if (operationType) {
                operationType.value = settings.operationType;
            }
        }
        
        if (settings.targetText) {
            const targetInput = modal.querySelector('#target-input');
            if (targetInput) {
                targetInput.value = settings.targetText;
            }
        }
    }

    /**
     * 获取统计数据
     */
    getStatistics(modal) {
        const stats = {
            // Transform-First架构：移除废弃的annotationCount统计
            // connectedLayerCount removed - using Fabric objects
            selectedCount: modal.selectedLayers?.size || 0,
            historyCount: this.stateHistory.length,
            cacheSize: this.dataCache.size,
            lastSaved: this.getCachedData('last_saved') ? new Date(this.getCachedData('last_saved').timestamp) : null,
            lastLoaded: this.getCachedData('last_loaded') ? new Date(this.getCachedData('last_loaded').timestamp) : null
        };
        
        // Transform-First架构：移除废弃的按类型统计
        
        return stats;
    }

    /**
     * 清理数据缓存
     */
    clearCache() {
        this.dataCache.clear();
    }

    /**
     * 清理历史记录
     * 🔧 增强版清理功能
     */
    clearHistory(keepRecent = 0) {
        if (keepRecent > 0) {
            // 保留最近的一些状态
            const recentStates = this.stateHistory.slice(-keepRecent);
            this.stateHistory = recentStates;
            console.log(`🗑️ History cleared, kept ${recentStates.length} recent states`);
        } else {
            this.stateHistory = [];
            console.log('🗑️ All history cleared');
        }
    }
    
    /**
     * 压缩历史记录
     * 🔧 减少历史记录内存占用
     */
    compressHistory() {
        if (this.stateHistory.length <= 10) return;
        
        // 保留最近5个状态
        const recentStates = this.stateHistory.slice(-5);
        
        // 从较早的状态中采样，保留关键变化
        const sampledStates = [];
        const step = Math.floor((this.stateHistory.length - 5) / 10);
        
        for (let i = 0; i < this.stateHistory.length - 5; i += step) {
            const state = this.stateHistory[i];
            // 只保留关键状态
            if (state.action.includes('save') || state.action.includes('load') || 
                state.action.includes('import') || state.action.includes('export')) {
                sampledStates.push(state);
            }
        }
        
        this.stateHistory = [...sampledStates, ...recentStates];
        console.log(`🗜️ History compressed: ${this.stateHistory.length} states retained`);
    }

    /**
     * 计算画布内容哈希值（用于检测变化）
     */
    calculateCanvasHash(fabricCanvas, objects) {
        const hashData = {
            objectCount: objects.length,
            canvasSize: `${fabricCanvas.getWidth()}x${fabricCanvas.getHeight()}`,
            objectsHash: objects.map(obj => `${obj.type}_${obj.left}_${obj.top}_${obj.width}_${obj.height}`).join('|')
        };
        return btoa(JSON.stringify(hashData)).substring(0, 32);
    }
    
    /**
     * 清理之前的画布数据
     */
    clearPreviousCanvasData() {
        // 清理缓存中的旧画布数据
        const keysToDelete = [];
        for (const [key, value] of this.dataCache.cache) {
            if (key.includes('canvas') || key.includes('fabric') || 
                (value.data && value.data.canvasImageDataURL)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.dataCache.cache.delete(key));
        
        console.log(`🗑️ Cleared ${keysToDelete.length} previous canvas data entries`);
    }
    
    /**
     * 强制垃圾回收提示 - 增强版内存清理
     */
    forceGarbageCollection(preserveActiveCanvas = false) {
        // 🗑️ 特别清理widget中的大base64数据
        if (this.nodeInstance && this.nodeInstance.widgets) {
            const annotationWidget = this.nodeInstance.widgets.find(w => w.name === "annotation_data");
            if (annotationWidget && annotationWidget.value) {
                try {
                    const data = JSON.parse(annotationWidget.value);
                    if (data.canvasImageDataURL && data.canvasImageDataURL.length > 10000) {
                        const sizeMB = (data.canvasImageDataURL.length / 1024 / 1024).toFixed(2);
                        console.log(`🗑️ Clearing large base64 in widget: ${sizeMB}MB`);
                        data.canvasImageDataURL = null;
                        annotationWidget.value = JSON.stringify(data);
                    }
                } catch (e) {
                    // 忽略解析错误
                }
            }
        }
        
        // 🗑️ 清理DOM中可能的大数据（但保留活动画布）
        const canvasElements = document.querySelectorAll('canvas');
        canvasElements.forEach(canvas => {
            if (canvas.width * canvas.height > 1000000) { // 大于1M像素
                // 检查是否是正在使用的Fabric画布
                const isFabricCanvas = preserveActiveCanvas && (
                    canvas.classList.contains('lower-canvas') || 
                    canvas.classList.contains('upper-canvas') ||
                    canvas.closest('.canvas-container')
                );
                
                if (!isFabricCanvas) {
                    console.log(`🗑️ Clearing large canvas: ${canvas.width}x${canvas.height}`);
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                } else {
                    console.log(`⚠️ Preserving active Fabric canvas: ${canvas.width}x${canvas.height}`);
                }
            }
        });
        
        // 🗑️ 清理全局变量中的大对象
        if (window.fabric && window.fabric.Object) {
            try {
                // 清理Fabric.js的缓存
                if (window.fabric.Object._fromObject) {
                    window.fabric.Object._fromObject = null;
                }
            } catch (e) {
                // 忽略清理错误
            }
        }
        
        if (window.gc && typeof window.gc === 'function') {
            try {
                window.gc();
                console.log('🗑️ Forced garbage collection');
            } catch (error) {
                console.log('🗑️ Garbage collection not available');
            }
        }
        
        // 🗑️ 延迟二次清理
        setTimeout(() => {
            if (window.gc && typeof window.gc === 'function') {
                try {
                    window.gc();
                    console.log('🗑️ Secondary garbage collection');
                } catch (error) {
                    // 忽略错误
                }
            }
        }, 1000);
    }
    
    /**
     * 清理所有资源
     */
    cleanup() {
        this.clearCache();
        this.clearHistory();
        this.clearPreviousCanvasData();
        this.lastCanvasHash = null;
        this.forceGarbageCollection();
    }
}

/**
 * 调用标准的updateObjectSelector逻辑
 * 从主文件迁移的数据处理逻辑
 */
export function callStandardUpdateObjectSelector(modal, nodeInstance) {
    
    try {
        // 模拟标准updateObjectSelector的行为
        // 这个函数在annotations模块中定义，我们需要复制其逻辑
        const dropdownOptions = modal.querySelector('#dropdown-options');
        const layerOperations = modal.querySelector('#layer-operations');
        const noLayersMessage = modal.querySelector('#no-layers-message');
        const selectionCount = modal.cachedElements?.selectionCount || modal.querySelector('#selection-count');
        
        if (!dropdownOptions) {
            return;
        }
        
        if (true) { // Transform-First架构：始终显示无图层状态
            dropdownOptions.innerHTML = '';
            if (layerOperations) layerOperations.style.display = 'none';
            if (noLayersMessage) noLayersMessage.style.display = 'block';
            if (selectionCount) selectionCount.textContent = `0 selected`;
            return;
        }
        
        // 隐藏空消息，显示操作区域
        if (noLayersMessage) noLayersMessage.style.display = 'none';
        
        // 清空现有选项
        dropdownOptions.innerHTML = '';
        
        // Transform-First架构：移除废弃的annotations遍历
        [].forEach((annotation, index) => {
            const objectInfo = nodeInstance?.getObjectInfo ? nodeInstance.getObjectInfo(annotation, index) : {
                icon: nodeInstance?.getSimpleIcon ? nodeInstance.getSimpleIcon(annotation.type) : '📝',
                description: `Layer ${annotation.number + 1}`
            };
            
            const option = document.createElement('div');
            option.style.cssText = `
                display: flex; align-items: center; gap: 4px; padding: 2px 6px; 
                cursor: pointer; margin: 0; height: 20px;
                transition: background 0.2s ease; 
                border-bottom: 1px solid #444;
            `;
            
            const isSelected = modal.selectedLayers?.has(annotation.id) || false;
            
            // 极简信息显示 - 与标准版本保持一致
            const layerName = `Layer ${annotation.number + 1}`;
            const operationType = annotation.operationType || 'add_object';
            
            option.innerHTML = `
                <input type="checkbox" ${isSelected ? 'checked' : ''} 
                       style="width: 10px; height: 10px; cursor: pointer; margin: 0; flex-shrink: 0;" 
                       data-annotation-id="${annotation.id}">
                <span style="font-size: 10px; flex-shrink: 0;">${objectInfo.icon}</span>
                <span style="color: white; font-size: 10px; font-weight: 500; flex-shrink: 0;">
                    ${layerName}
                </span>
                <span style="color: #666; font-size: 9px; flex-shrink: 0;">•</span>
                <span style="color: #aaa; font-size: 9px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${operationType}
                </span>
            `;
            
            // 悬停效果
            option.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(255,255,255,0.1)';
            });
            option.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
            });
            
            dropdownOptions.appendChild(option);
            
            // ✅ 复选框事件处理已移至 event_handlers.js 模块
            if (nodeInstance?.eventHandlers) {
                nodeInstance.eventHandlers.bindCheckboxEvents(option, modal, annotation.id);
            }
        });
        
        // 初始化选中状态管理
        if (!modal.selectedLayers) {
            modal.selectedLayers = new Set();
        }
        
        try {
            if (nodeInstance?.standardUpdateSelectionCount) {
                nodeInstance.standardUpdateSelectionCount(modal);
            } else {
            }
            
            if (nodeInstance?.standardUpdateDropdownText) {
                nodeInstance.standardUpdateDropdownText(modal);
            } else {
            }
            
            if (nodeInstance?.standardBindDropdownEvents) {
                nodeInstance.standardBindDropdownEvents(modal);
            } else {
            }
        } catch (methodError) {
        }
        
        
    } catch (error) {
        console.error('❌ 调用标准updateObjectSelector失败:', error);
    }
}

/**
 * 恢复后更新下拉复选框
 * 从主文件迁移的下拉框更新逻辑
 */
export function updateDropdownAfterRestore(modal, nodeInstance) {
    
    try {
        const dropdownOptions = modal.querySelector('#dropdown-options');
        const noLayersMessage = modal.querySelector('#no-layers-message');
        
        
        if (!dropdownOptions) {
            return;
        }
        
        // Transform-First架构：移除废弃的annotations验证
        if (true) {
            dropdownOptions.innerHTML = '';
            if (noLayersMessage) noLayersMessage.style.display = 'block';
            return;
        }
        
        // 隐藏空消息
        if (noLayersMessage) noLayersMessage.style.display = 'none';
        
        // 清空现有选项
        dropdownOptions.innerHTML = '';
        
        // Transform-First架构：移除废弃的annotations遍历
        [].forEach((annotation, index) => {
            
            const option = document.createElement('div');
            option.style.cssText = `
                display: flex; align-items: center; gap: 4px; padding: 2px 6px; 
                cursor: pointer; margin: 0; height: 20px;
                transition: background 0.2s ease; 
                border-bottom: 1px solid #444;
            `;
            
            // 安全获取图标和层名称
            const icon = nodeInstance?.getSimpleIcon ? nodeInstance.getSimpleIcon(annotation.type) : '📝';
            const layerName = `Layer ${annotation.number + 1}`; // 从1开始显示
            const operationType = annotation.operationType || 'add_object';
            
            option.innerHTML = `
                <input type="checkbox" 
                       style="width: 10px; height: 10px; cursor: pointer; margin: 0; flex-shrink: 0;" 
                       data-annotation-id="${annotation.id}">
                <span style="font-size: 10px; flex-shrink: 0;">${icon}</span>
                <span style="color: white; font-size: 10px; font-weight: 500; flex-shrink: 0;">
                    ${layerName}
                </span>
                <span style="color: #666; font-size: 9px; flex-shrink: 0;">•</span>
                <span style="color: #aaa; font-size: 9px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${operationType}
                </span>
            `;
            
            // 悬停效果
            option.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(255,255,255,0.1)';
            });
            option.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
            });
            
            dropdownOptions.appendChild(option);
            
            // 安全调用事件处理器
            try {
                if (nodeInstance?.eventHandlers?.bindCheckboxEventsForRestore) {
                    nodeInstance.eventHandlers.bindCheckboxEventsForRestore(option, modal, annotation.id);
                } else {
                }
            } catch (handlerError) {
            }
        });
        
        // 初始化选中状态管理
        if (!modal.selectedLayers) {
            modal.selectedLayers = new Set();
        }
        
        const dropdownText = modal.querySelector('#dropdown-text');
        if (dropdownText) {
            dropdownText.textContent = 'Click to select layers...';
            dropdownText.style.color = '#aaa';
            dropdownText.style.fontSize = '12px';
        }
        
        const selectionCount = modal.cachedElements?.selectionCount || modal.querySelector('#selection-count');
        if (selectionCount) {
            selectionCount.textContent = `0 selected`;
        }
        
        
        // 安全调用下拉框事件绑定
        try {
            if (nodeInstance?.eventHandlers?.bindDropdownEventsForRestore) {
                nodeInstance.eventHandlers.bindDropdownEventsForRestore(modal);
            } else if (nodeInstance?.bindDropdownEventsForRestore) {
                nodeInstance.bindDropdownEventsForRestore(modal);
            } else {
            }
        } catch (bindError) {
        }
        
    } catch (error) {
        console.error('❌ 更新下拉复选框失败:', error);
    }
}

// 导出创建函数
export function createDataManager(nodeInstance) {
    return new DataManager(nodeInstance);
}

// ==================== 文件管理功能 (merged from file_manager.js) ====================

/**
 * 从LoadImage节点获取图像
 * 从主文件迁移的图像获取逻辑
 */
export function getImageFromLoadImageNode(loadImageNode) {
    try {
        // 方法1: 从imgs属性获取
        if (loadImageNode.imgs && loadImageNode.imgs.length > 0) {
            const imgSrc = loadImageNode.imgs[0].src;
            return imgSrc;
        }
        
        // 方法2: 从widgets获取文件名
        if (loadImageNode.widgets) {
            for (let widget of loadImageNode.widgets) {
                if (widget.name === 'image' && widget.value) {
                    // 构建正确的图像URL - 使用ComfyUI标准格式
                    const filename = widget.value;
                    const imageUrl = `/view?filename=${encodeURIComponent(filename)}&subfolder=&type=input`;
                    return imageUrl;
                }
            }
        }
        
        return null;
    } catch (e) {
        console.error('Error getting LoadImage image:', e);
        return null;
    }
}

/**
 * 从其他类型节点获取图像
 * 从主文件迁移的通用图像获取逻辑
 */
export function tryGetImageFromNode(sourceNode) {
    try {
        if (sourceNode.imgs && sourceNode.imgs.length > 0) {
            return sourceNode.imgs[0].src;
        }
        
        if (sourceNode.widgets) {
            for (let widget of sourceNode.widgets) {
                if ((widget.name === 'image' || widget.name === 'filename') && widget.value) {
                    const imageUrl = `/view?filename=${encodeURIComponent(widget.value)}`;
                    return imageUrl;
                }
            }
        }
        
        return null;
    } catch (e) {
        console.error('Error getting image from node:', e);
        return null;
    }
}

/**
 * 处理图层图像文件
 * 从主文件迁移的文件处理逻辑
 */
export function processLayerImageFile(modal, layerId, file, nodeInstance) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const imageData = e.target.result;
            
            const layerItem = modal.querySelector(`[data-layer="${layerId}"]`);
            if (layerItem) {
                const layerText = layerItem.querySelector('span:nth-child(2)');
                if (layerText) {
                    layerText.innerHTML = `📷 ${file.name.substring(0, 15)}${file.name.length > 15 ? '...' : ''}`;
                }
                
                const statusSpan = layerItem.querySelector('span:last-child');
                if (statusSpan) {
                    statusSpan.textContent = 'Loaded';
                    statusSpan.style.color = '#4CAF50';
                }
            }
            
            // Convert image to Fabric.js object and add to canvas
            convertImageToFabricObject(modal, imageData, file.name, nodeInstance);
            
        } catch (error) {
            console.error(`Error processing image file for layer ${layerId}:`, error);
        }
    };
    
    reader.onerror = () => {
        console.error(`Failed to read image file for layer ${layerId}`);
    };
    
    reader.readAsDataURL(file);
}

/**
 * 在画布中显示图像
 * 从主文件迁移的画布图像显示逻辑
 */
export function displayImageInCanvas(modal, layerId, imageData, nodeInstance) {
    try {
        const imageCanvas = modal.querySelector('#image-canvas');
        if (!imageCanvas) {
            console.warn('Image canvas container not found');
            return;
        }
        
        const existingImage = imageCanvas.querySelector(`[data-layer-id="${layerId}"]`);
        if (existingImage) {
            existingImage.remove();
        }
        
        const imageContainer = document.createElement('div');
        imageContainer.setAttribute('data-layer-id', layerId);
        imageContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100; // Will be managed by Fabric.js
        `;
        
        const img = document.createElement('img');
        img.src = imageData;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            opacity: 1.0;
        `;
        
        img.onload = () => {
            // Image loaded successfully
        };
        
        img.onerror = () => {
            console.error(`Failed to display image for layer ${layerId}`);
        };
        
        imageContainer.appendChild(img);
        imageCanvas.appendChild(imageContainer);
        
    } catch (error) {
        console.error('Error displaying image in canvas:', error);
    }
}

/**
 * 创建默认图层
 * 从主文件迁移的默认图层创建逻辑
 */
export function createDefaultLayer(modal, layerId, nodeInstance) {
    try {
        const dynamicLayersContainer = modal.querySelector('#dynamic-ps-layers');
        if (!dynamicLayersContainer) {
            console.warn('Dynamic PS layers container not found');
            return;
        }
        
        const layerElement = document.createElement('div');
        layerElement.className = 'ps-layer-item vpe-layer-item';
        layerElement.setAttribute('data-layer', layerId);
        layerElement.style.cssText = `
            border-bottom: 1px solid #444;
            background: #10b981;
        `;
        
        const layerName = layerId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        layerElement.innerHTML = `
            <span class="layer-visibility" style="margin-right: 8px; cursor: pointer;">👁️</span>
            <span style="flex: 1; color: white; font-size: 12px;">📄 ${layerName}</span>
            <span class="layer-opacity" style="color: #888; font-size: 10px;">100%</span>
            <span style="color: #888; font-size: 9px; margin-left: 8px;">New</span>
        `;
        
        dynamicLayersContainer.appendChild(layerElement);
        
        // 隐藏空状态消息
        const noLayersMessage = modal.querySelector('#no-ps-layers-message');
        if (noLayersMessage) noLayersMessage.style.display = 'none';
        
        // 重新绑定事件
        if (nodeInstance.bindPSLayerEvents) {
            nodeInstance.bindPSLayerEvents(modal);
        }
        
    } catch (error) {
        console.error(`Error creating default layer ${layerId}:`, error);
    }
}

/**
 * 为指定图层加载图像
 * 从主文件迁移的图层图像加载逻辑
 */
export function loadImageForLayer(modal, layerId, nodeInstance) {
    try {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                processLayerImageFile(modal, layerId, file, nodeInstance);
            }
        });
        
        // 触发文件选择
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
        
    } catch (error) {
        console.error(`Error loading image for layer ${layerId}:`, error);
    }
}

/**
 * 打开图层图像选择对话框
 * 从主文件迁移的图层图像选择逻辑
 */
export function openLayerImageDialog(modal, nodeInstance) {
    try {
        // 更灵活的选中图层检测
        let selectedLayer = modal.querySelector('.ps-layer-item[style*="background: rgb(16, 185, 129)"]') ||
                           modal.querySelector('.ps-layer-item[style*="background:#10b981"]') ||
                           modal.querySelector('.ps-layer-item[style*="background: #10b981"]');
        
        if (!selectedLayer) {
            // 如果没有选中图层，默认选择可用的第一个图层或直接选择layer_1
            const availableLayers = modal.querySelectorAll('.ps-layer-item:not([data-layer="background"])');
            if (availableLayers.length > 0) {
                selectedLayer = availableLayers[0];
                selectedLayer.style.background = '#10b981';
            } else {
                const layerId = 'layer_1';
                createDefaultLayer(modal, layerId, nodeInstance);
                loadImageForLayer(modal, layerId, nodeInstance);
                return;
            }
        }
        
        const layerId = selectedLayer.dataset.layer;
        loadImageForLayer(modal, layerId, nodeInstance);
        
    } catch (error) {
        console.error('Error opening layer image dialog:', error);
    }
}

/**
 * Convert uploaded image to Fabric.js object
 * This function should integrate with the Fabric.js manager
 */
function convertImageToFabricObject(modal, imageData, filename, nodeInstance) {
    try {
        // This should call the Fabric.js manager to add the image as a Fabric object
        // TODO: Integrate with visual_prompt_editor_fabric_manager.js
        // const fabricManager = getFabricPureNativeManager();
        // fabricManager.addImageFromData(imageData, filename);
        
    } catch (error) {
        console.error('Failed to convert image to Fabric object:', error);
    }
}

/**
 * 收集当前编辑状态的完整数据
 */
export function collectCurrentEditingData(modal, nodeInstance) {
    try {
        const data = {
            timestamp: Date.now(),
            // 基础操作设置
            operationType: modal.querySelector('#current-layer-operation')?.value || 'add_object',
            description: modal.querySelector('#current-layer-description')?.value || '',
            
            // 约束性和修饰性提示词
            constraintPrompts: collectSelectedPrompts(modal, '#layer-constraint-prompts-container'),
            decorativePrompts: collectSelectedPrompts(modal, '#layer-decorative-prompts-container'),
            
            // 选中的图层信息
            selectedLayers: collectSelectedLayersData(modal),
            
            // 生成的局部编辑提示词
            generatedDescription: modal.querySelector('#local-generated-description')?.value || '',
            
            // Fabric.js画布数据
            fabricData: null,
            canvasImageData: null,
            
            // 画布设置
            canvasWidth: parseInt(modal.querySelector('#vpe-canvas-width')?.value) || 800,
            canvasHeight: parseInt(modal.querySelector('#vpe-canvas-height')?.value) || 600,
            backgroundColor: modal.querySelector('#vpe-bg-color')?.value || '#ffffff',
            
            // 绘制工具设置
            currentTool: modal.currentTool || 'select',
            currentColor: modal.currentColor || '#ff0000',
            fillMode: modal.fillMode || 'filled',
            opacity: modal.currentOpacity || 50
        };
        
        // 获取Fabric.js画布数据
        if (nodeInstance.fabricManager && nodeInstance.fabricManager.fabricCanvas) {
            try {
                console.log('[LRPG] 🚀 CRITICAL: 开始Fabric序列化（修复后版本）');
                // 🚀 重要修复：使用包含自定义属性的序列化方法
                data.fabricData = nodeInstance.fabricManager.fabricCanvas.toJSON([
                    'fabricId', 'name', 'originalBase64', 'src', 'opacity'
                ]);
                console.log('[LRPG] 🔍 CRITICAL: 修复后序列化结果 - 对象数量:', data.fabricData.objects?.length || 0);
                data.fabricData.objects?.forEach((obj, index) => {
                    console.log(`[LRPG] 📋 CRITICAL: 对象${index}: type=${obj.type}, fabricId=${obj.fabricId}, name=${obj.name}, opacity=${obj.opacity}`);
                    // 🔧 调试：检查每个对象的完整透明度信息
                    const opacityKeys = Object.keys(obj).filter(key => key.toLowerCase().includes('opacity'));
                    if (opacityKeys.length > 0) {
                        console.log(`[LRPG] 🔍 对象${index}透明度相关属性:`, opacityKeys.map(key => `${key}=${obj[key]}`));
                    }
                });
                // 避免内存泄漏：不生成大base64字符串
                data.canvasImageData = null;
            } catch (error) {
                console.warn('Failed to get Fabric canvas data:', error);
            }
        }
        
        console.log('📊 收集到的编辑数据:', data);
        return data;
        
    } catch (error) {
        console.error('❌ 收集编辑数据失败:', error);
        return null;
    }
}

/**
 * 收集选中的提示词
 */
function collectSelectedPrompts(modal, containerSelector) {
    const container = modal.querySelector(containerSelector);
    const selectedPrompts = [];
    
    if (container) {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            const label = checkbox.closest('label');
            if (label) {
                selectedPrompts.push(label.textContent.trim());
            }
        });
    }
    
    return selectedPrompts;
}

/**
 * 收集选中的图层数据
 */
function collectSelectedLayersData(modal) {
    const layersList = modal.querySelector('#layers-list');
    const selectedLayers = [];
    
    if (layersList) {
        const selectedItems = layersList.querySelectorAll('.layer-list-item.selected');
        selectedItems.forEach(item => {
            selectedLayers.push({
                id: item.dataset.layerId,
                type: item.dataset.layerType,
                name: item.querySelector('.layer-name')?.textContent || `Layer ${selectedLayers.length + 1}`,
                selected: true
            });
        });
    }
    
    return selectedLayers;
}

/**
 * 分析和分类画布对象，区分输入图像和标注对象
 */
function _filterActualAnnotations(allObjects) {
    if (!allObjects || allObjects.length === 0) {
        return [];
    }
    
    // 分类对象
    const inputImages = [];
    const actualAnnotations = [];
    
    allObjects.forEach(obj => {
        if (obj.fabricId && obj.fabricId.startsWith('input_image_') || obj.name === 'Input Image') {
            inputImages.push(obj);
        } else {
            actualAnnotations.push(obj);
        }
    });
    
    // 🚀 智能决策：根据对象组合决定返回什么
    if (actualAnnotations.length > 0) {
        // 如果有标注对象，返回所有对象（包括输入图像变换信息）
        console.log(`🎯 [MIXED_CONTENT] 输入图像: ${inputImages.length}, 标注对象: ${actualAnnotations.length} - 返回全部对象`);
        return allObjects; // 返回所有对象，让后端处理
    } else if (inputImages.length > 0) {
        // ✅ 只有输入图像变换也需要发送给后端处理
        console.log(`📷 [INPUT_ONLY] 输入图像变换: ${inputImages.length} - 返回输入图像数据供后端处理`);
        return inputImages; // 返回输入图像，让后端应用变换
    } else {
        // 没有任何对象
        console.log(`⭕ [EMPTY_CANVAS] 画布为空 - 返回空数组`);
        return [];
    }
}

/**
 * 分析画布内容类型和处理需求
 */
function _analyzeContent(modal, editingData) {
    const fabricObjects = editingData.fabricData?.objects || [];
    
    // 分类对象
    const inputImages = fabricObjects.filter(obj => 
        obj.fabricId && obj.fabricId.startsWith('input_image_') || obj.name === 'Input Image'
    );
    const annotations = fabricObjects.filter(obj => 
        !(obj.fabricId && obj.fabricId.startsWith('input_image_')) && obj.name !== 'Input Image'
    );
    
    // 分析处理需求
    const needsProcessing = annotations.length > 0;
    const hasInputTransforms = inputImages.length > 0 && inputImages.some(img => 
        img.left !== 0 || img.top !== 0 || img.angle !== 0 || 
        (img.scaleX && img.scaleX !== 1) || (img.scaleY && img.scaleY !== 1)
    );
    
    return {
        total_objects: fabricObjects.length,
        input_images: inputImages.length,
        annotation_objects: annotations.length,
        needs_processing: needsProcessing,
        has_input_transforms: hasInputTransforms,
        content_type: needsProcessing ? (hasInputTransforms ? 'mixed' : 'annotations_only') : 
                     (hasInputTransforms ? 'input_transforms_only' : 'empty'),
        processing_required: needsProcessing
    };
}

/**
 * 从对象数组分析内容类型（用于自动保存）
 */
function _analyzeContentFromObjects(objects) {
    const inputImages = objects.filter(obj => 
        obj.fabricId && obj.fabricId.startsWith('input_image_') || obj.name === 'Input Image'
    );
    const annotations = objects.filter(obj => 
        !(obj.fabricId && obj.fabricId.startsWith('input_image_')) && obj.name !== 'Input Image'
    );
    
    const needsProcessing = annotations.length > 0;
    const hasInputTransforms = inputImages.length > 0;
    
    return {
        total_objects: objects.length,
        input_images: inputImages.length,
        annotation_objects: annotations.length,
        needs_processing: needsProcessing,
        has_input_transforms: hasInputTransforms,
        content_type: needsProcessing ? (hasInputTransforms ? 'mixed' : 'annotations_only') : 
                     (hasInputTransforms ? 'input_transforms_only' : 'empty'),
        processing_required: needsProcessing
    };
}

/**
 * 保存完整编辑数据到后端
 */
export function saveEditingDataToBackend(modal, nodeInstance) {
    try {
        console.log('💾 开始保存编辑数据到后端...');
        
        // 收集当前所有编辑数据
        const editingData = collectCurrentEditingData(modal, nodeInstance);
        
        if (!editingData) {
            console.error('❌ 无法收集到编辑数据');
            return false;
        }
        
        // 🚀 Transform-First架构：转换编辑数据为Transform格式
        console.log('[Kontext] 🔄 转换编辑数据为Transform-First格式...');
        
        // 🎯 从Fabric对象提取标注数据用于Transform转换
        const fabricObjects = editingData.fabricData?.objects || [];
        const annotations = fabricObjects.map((obj, index) => ({
            id: obj.fabricId || `fabric_${index}`,
            type: obj.type || 'rect',
            left: obj.left || 0,
            top: obj.top || 0,
            width: (obj.width || 100) * (obj.scaleX || 1),
            height: (obj.height || 100) * (obj.scaleY || 1),
            scaleX: obj.scaleX || 1,
            scaleY: obj.scaleY || 1,
            angle: obj.angle || 0,
            fabricObject: obj
        }));
        
        // 构建传统格式以支持转换
        const promptData = {
            operation_type: editingData.operationType,
            target_description: editingData.description,
            positive_prompt: editingData.generatedDescription,
            constraint_prompts: editingData.constraintPrompts,
            decorative_prompts: editingData.decorativePrompts,
            canvasWidth: editingData.canvasWidth,
            canvasHeight: editingData.canvasHeight,
            backgroundColor: editingData.backgroundColor,
            annotations: annotations,  // 🎯 关键：包含从Fabric转换的annotations
            fabricData: editingData.fabricData,
            fabricJSON: editingData.fabricData,  // ✅ 添加fabricJSON字段以兼容convertToTransformFirstData
            timestamp: editingData.timestamp
        };
        
        // 🎯 直接进行Transform-First数据转换
        console.log('[Kontext] 🔍 Debug: convertToTransformFirstData函数存在?', typeof convertToTransformFirstData);
        const transformData = convertToTransformFirstData(promptData);
        console.log('[Kontext] 🔍 Debug: Transform转换结果:', transformData);
        
        console.log('[Kontext] ✅ Transform-First数据转换完成:', {
            layers: transformData.layer_transforms ? Object.keys(transformData.layer_transforms).length : 0,
            canvas_size: transformData.canvas_size,
            operation_type: transformData.operation_type,
            timestamp: transformData.timestamp
        });
        
        // 保存Transform-First数据到annotation_data widget
        const success = saveAnnotationDataToWidget(nodeInstance, transformData);
        
        if (success) {
            console.log('✅ 编辑数据已成功保存到后端');
            return true;
        } else {
            console.error('❌ 保存编辑数据到后端失败');
            return false;
        }
        
    } catch (error) {
        console.error('❌ 保存编辑数据到后端时出错:', error);
        return false;
    }
}

/**
 * 保存数据到节点的annotation_data widget
 */
function saveAnnotationDataToWidget(nodeInstance, data) {
    try {
        const annotationDataWidget = nodeInstance.widgets?.find(w => w.name === "annotation_data");
        
        if (!annotationDataWidget) {
            console.error('❌ 未找到annotation_data widget');
            return false;
        }
        
        // 将数据序列化为JSON字符串
        const dataString = JSON.stringify(data, null, 2);
        annotationDataWidget.value = dataString;
        
        // 触发节点更新
        if (nodeInstance.setDirtyCanvas) {
            nodeInstance.setDirtyCanvas(true, true);
        }
        
        console.log('💾 数据已保存到annotation_data widget，大小:', dataString.length, '字符');
        return true;
        
    } catch (error) {
        console.error('❌ 保存到widget失败:', error);
        return false;
    }
}

// === 🚀 大图像序列化优化 ===

/**
 * 优化的Fabric画布序列化器
 * 基于LRPG的策略：避免序列化大图像数据
 */
class OptimizedFabricSerializer {
    constructor(options = {}) {
        this.maxImageSize = options.maxImageSize || 512 * 512; // 最大图像尺寸
        this.imageCompressionQuality = options.imageCompressionQuality || 0.8;
        this.enableImageOptimization = options.enableImageOptimization !== false;
        
        console.log('📦 OptimizedFabricSerializer initialized with options:', options);
    }

    /**
     * 优化的画布序列化 - 避免保存大图像数据
     */
    serializeCanvas(fabricCanvas, options = {}) {
        const {
            includeImageDataURL = false, // 默认不包含图像数据
            optimizeImages = true,
            includeMetadata = true
        } = options;

        console.log('🔍 Starting optimized canvas serialization...');
        const startTime = performance.now();

        try {
            // 获取所有对象
            const objects = fabricCanvas.getObjects();
            const imageObjects = objects.filter(obj => obj.type === 'image');
            
            console.log(`📊 Canvas stats: ${objects.length} total objects, ${imageObjects.length} image objects`);

            // 处理图像对象 - 优化策略
            if (optimizeImages && imageObjects.length > 0) {
                this.optimizeImageObjects(imageObjects);
            }

            // 序列化画布
            const fabricJSON = fabricCanvas.toJSON([
                'fabricId', 'name', 'locked', 'opacity',
                'originalBase64', 'src'  // 🚀 新增：保存上传图像数据
            ]);
            
            // 构建优化的数据结构
            const optimizedData = {
                version: '4.0-optimized',
                timestamp: Date.now(),
                canvasWidth: fabricCanvas.getWidth(),
                canvasHeight: fabricCanvas.getHeight(),
                
                // 🚀 核心优化：不保存大图像数据
                canvasImageDataURL: includeImageDataURL ? this.generateOptimizedImageDataURL(fabricCanvas) : null,
                
                // Fabric.js JSON数据
                fabricJSON: fabricJSON,
                
                // 图像引用信息（用于重新加载）
                imageReferences: this.extractImageReferences(imageObjects),
                
                // 优化元数据
                optimizationInfo: {
                    imagesOptimized: optimizeImages && imageObjects.length > 0,
                    imageCount: imageObjects.length,
                    totalObjects: objects.length,
                    estimatedMemorySavings: this.calculateMemorySavings(imageObjects)
                }
            };

            // 添加处理元数据
            if (includeMetadata) {
                optimizedData.processingMetadata = {
                    devicePixelRatio: window.devicePixelRatio || 1,
                    canvasViewScale: 1.0,
                    renderingEngine: 'fabric.js-optimized',
                    browserInfo: navigator.userAgent,
                    colorSpace: 'sRGB',
                    antiAliasing: true,
                    serializationTime: performance.now() - startTime
                };
            }

            const endTime = performance.now();
            const serializationTime = endTime - startTime;
            
            console.log(`✅ Optimized serialization completed in ${serializationTime.toFixed(2)}ms`);
            console.log(`💾 Memory savings: ${optimizedData.optimizationInfo.estimatedMemorySavings.toFixed(2)}MB`);
            
            return optimizedData;
            
        } catch (error) {
            console.error('❌ Optimized serialization failed:', error);
            throw error;
        }
    }

    /**
     * 优化图像对象 - 减少内存占用
     */
    optimizeImageObjects(imageObjects) {
        console.log('🗜️ Optimizing image objects...');
        
        imageObjects.forEach((imageObj, index) => {
            try {
                const element = imageObj.getElement();
                if (!element) return;

                const originalSize = element.naturalWidth * element.naturalHeight;
                
                // 检查是否需要优化
                if (originalSize > this.maxImageSize) {
                    console.log(`🔍 Optimizing large image ${index + 1}: ${element.naturalWidth}x${element.naturalHeight}`);
                    
                    // 存储原始图像信息但不存储数据
                    if (!imageObj.originalImageInfo) {
                        imageObj.originalImageInfo = {
                            src: element.src,
                            naturalWidth: element.naturalWidth,
                            naturalHeight: element.naturalHeight,
                            aspectRatio: element.naturalWidth / element.naturalHeight
                        };
                    }
                    
                    // 清理大图像数据引用
                    if (this.enableImageOptimization) {
                        this.clearImageDataReferences(imageObj);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Failed to optimize image object ${index}:`, error);
            }
        });
    }

    /**
     * 清理图像数据引用
     */
    clearImageDataReferences(imageObj) {
        // 保留最小信息用于重新加载
        imageObj.optimized = true;
        
        // 如果有base64数据，清理它
        if (imageObj._element && imageObj._element.src && imageObj._element.src.startsWith('data:image')) {
            console.log('🗑️ Clearing base64 image data reference');
            // 不直接删除，而是标记为已优化
            imageObj._element.optimized = true;
        }
    }

    /**
     * 提取图像引用信息
     */
    extractImageReferences(imageObjects) {
        const references = [];
        
        imageObjects.forEach((imageObj, index) => {
            const ref = {
                id: imageObj.fabricId || `image_${index}`,
                src: null,
                originalWidth: imageObj.width || imageObj.originalWidth,
                originalHeight: imageObj.height || imageObj.originalHeight,
                scaleX: imageObj.scaleX || 1,
                scaleY: imageObj.scaleY || 1,
                optimized: imageObj.optimized || false
            };
            
            // 尝试获取图像源
            const element = imageObj.getElement();
            if (element) {
                // 优先使用URL而不是base64
                if (!element.src.startsWith('data:image')) {
                    ref.src = element.src;
                } else if (imageObj.originalImageInfo) {
                    ref.src = imageObj.originalImageInfo.src;
                }
            }
            
            references.push(ref);
        });
        
        return references;
    }

    /**
     * 生成优化的图像数据URL（仅在需要时）
     */
    generateOptimizedImageDataURL(fabricCanvas) {
        console.log('🖼️ Generating optimized image data URL...');
        
        try {
            // 创建临时画布
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // 使用较小的尺寸
            const maxSize = 512;
            const canvasWidth = fabricCanvas.getWidth();
            const canvasHeight = fabricCanvas.getHeight();
            
            let scale = 1;
            if (canvasWidth > maxSize || canvasHeight > maxSize) {
                scale = Math.min(maxSize / canvasWidth, maxSize / canvasHeight);
            }
            
            tempCanvas.width = canvasWidth * scale;
            tempCanvas.height = canvasHeight * scale;
            
            // 绘制缩略图
            tempCtx.drawImage(
                fabricCanvas.lowerCanvasEl,
                0, 0, canvasWidth, canvasHeight,
                0, 0, tempCanvas.width, tempCanvas.height
            );
            
            // 生成压缩的JPEG
            return tempCanvas.toDataURL('image/jpeg', this.imageCompressionQuality);
            
        } catch (error) {
            console.warn('⚠️ Failed to generate optimized image URL:', error);
            return null;
        }
    }

    /**
     * 计算内存节省量
     */
    calculateMemorySavings(imageObjects) {
        let totalSavings = 0;
        
        imageObjects.forEach(imageObj => {
            const element = imageObj.getElement();
            if (element) {
                const originalSize = element.naturalWidth * element.naturalHeight * 4; // RGBA
                if (originalSize > this.maxImageSize) {
                    // 估计节省的内存
                    totalSavings += (originalSize - this.maxImageSize) / (1024 * 1024); // MB
                }
            }
        });
        
        return totalSavings;
    }

    /**
     * 异步序列化 - 使用分块处理大画布
     */
    async serializeCanvasAsync(fabricCanvas, options = {}) {
        const chunkSize = options.chunkSize || 50;
        const objects = fabricCanvas.getObjects();
        
        console.log(`🚀 Starting async serialization with ${objects.length} objects...`);
        
        // 分块处理对象
        const chunks = [];
        for (let i = 0; i < objects.length; i += chunkSize) {
            chunks.push(objects.slice(i, i + chunkSize));
        }
        
        // 处理每个分块
        const processedChunks = await Promise.all(
            chunks.map((chunk, index) => 
                new Promise(resolve => {
                    setTimeout(() => {
                        const processedChunk = this.processObjectChunk(chunk);
                        resolve({ index, data: processedChunk });
                    }, 0); // 使用setTimeout让出主线程
                })
            )
        );
        
        // 合并结果
        const allObjects = processedChunks.flatMap(chunk => chunk.data);
        
        // 创建临时画布用于序列化
        const tempCanvas = new fabric.Canvas(null, { width: fabricCanvas.getWidth(), height: fabricCanvas.getHeight() });
        allObjects.forEach(obj => tempCanvas.add(obj));
        
        // 序列化
        const result = this.serializeCanvas(tempCanvas, options);
        
        // 清理
        tempCanvas.dispose();
        
        return result;
    }

    /**
     * 处理对象分块
     */
    processObjectChunk(objects) {
        return objects.map(obj => {
            // 克隆对象但不包含图像数据
            const cloned = obj.toObject();
            if (obj.type === 'image' && obj._element) {
                // 清理图像数据
                cloned.src = null;
                cloned._element = null;
            }
            return cloned;
        });
    }
}

// 创建全局实例
export const globalOptimizedSerializer = new OptimizedFabricSerializer({
    maxImageSize: 512 * 512,
    imageCompressionQuality: 0.8,
    enableImageOptimization: true
});

// ===== 🚀 Transform-First 数据转换函数 =====

/**
 * 将传统annotation数据转换为Transform-First格式
 * 这是Transform-First架构的核心转换函数
 */
export function convertToTransformFirstData(promptData) {
    // ✅ LRPG统一格式 - 无转换层
    const transformData = {
        node_id: "unknown",
        timestamp: Date.now().toString(),
        type: 'temp',
        subfolder: 'lrpg_canvas',
        overwrite: 'true',
        layer_transforms: {}
    };

    // Background layer
    transformData.layer_transforms.background = {
        width: promptData.canvasWidth || 800,
        height: promptData.canvasHeight || 600
    };

    // ✅ LRPG格式：处理Fabric对象
    console.log('[LRPG] 🔍 FabricJSON数据检查:', {
        hasFabricJSON: !!promptData.fabricJSON,
        objectsCount: promptData.fabricJSON?.objects?.length || 0,
        objects: promptData.fabricJSON?.objects?.map(o => ({
            type: o.type,
            fabricId: o.fabricId,
            name: o.name,
            angle: o.angle,
            scaleX: o.scaleX
        }))
    });
    
    if (promptData.fabricJSON && promptData.fabricJSON.objects) {
        promptData.fabricJSON.objects.forEach((obj, index) => {
            const layerId = obj.fabricId || `layer_${index}`;
            
            // 🚀 新架构：图像源类型识别
            let imageSource = 'unknown';
            let imageData = null;
            
            if ((obj.name === 'Input Image') || 
                (obj.fabricId && obj.fabricId.startsWith('input_image_'))) {
                imageSource = 'input';
                imageData = null; // 后端使用原始输入图像
            } else if (obj.fabricId && obj.fabricId.startsWith('uploaded_image_')) {
                imageSource = 'upload';
                console.log(`[LRPG] 🎯 上传图像${obj.fabricId}源类型识别为: upload`);
                // 获取上传图像的base64数据
                imageData = obj.originalBase64 || obj.src || obj.getSrc?.();
                if (!imageData && obj._element && obj._element.src) {
                    imageData = obj._element.src;
                }
                console.log(`[LRPG] 📊 上传图像${obj.fabricId}数据长度:`, imageData ? imageData.length : 'null');
            } else if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'polygon' || obj.type === 'path' || obj.type === 'text' || obj.type === 'i-text') {
                // 🎯 标注类型识别 (包含文字标注)
                imageSource = 'annotation';
                imageData = null; // 标注不需要图像数据
                console.log(`[LRPG] 🎯 标注${obj.fabricId}源类型识别为: annotation (${obj.type})`);
            } else if (obj.type === 'image' && index === 0) {
                // 兼容：第一个图像默认为输入图像
                imageSource = 'input';
                imageData = null;
            }
            
            console.log(`[LRPG] 🔍 图层${layerId}源类型识别:`, {
                name: obj.name,
                fabricId: obj.fabricId,
                type: obj.type,
                index: index,
                imageSource: imageSource,
                hasImageData: !!imageData,
                imageDataType: imageData ? (imageData.startsWith('data:') ? 'base64' : 'url') : 'none',
                // 🔍 调试：原始对象信息
                rawObject: {
                    fabricId: obj.fabricId,
                    originalBase64: obj.originalBase64,
                    src: obj.src
                }
            });
            
            const isInputImage = imageSource === 'input';
            
            console.log(`[LRPG] 🔍 图层${layerId}类型识别:`, {
                name: obj.name,
                fabricId: obj.fabricId,
                type: obj.type,
                index: index,
                isNameMatch: obj.name === 'Input Image',
                isFabricIdMatch: obj.fabricId && obj.fabricId.startsWith('input_image_'),
                isFirstImage: obj.type === 'image' && index === 0,
                isUnidentifiedImage: obj.type === 'image' && !obj.fabricId && !obj.name,
                finalResult: isInputImage
            });
            
            // 对于输入图像，使用显示尺寸计算中心点
            let centerX, centerY, actualWidth, actualHeight;
            
            // 🔧 LRPG坐标系修正：正确计算缩放后的中心点
            let centerX_method1, centerY_method1, centerX_method2, centerY_method2;
            
            // 方法1：使用getCenterPoint() API
            if (obj.getCenterPoint) {
                const centerPoint = obj.getCenterPoint();
                centerX_method1 = centerPoint.x;
                centerY_method1 = centerPoint.y;
            }
            
            // 方法2：手动计算（基于缩放后的实际尺寸）
            const scaledWidth = (obj.width || 0) * (obj.scaleX || 1);
            const scaledHeight = (obj.height || 0) * (obj.scaleY || 1);
            centerX_method2 = (obj.left || 0) + scaledWidth / 2;
            centerY_method2 = (obj.top || 0) + scaledHeight / 2;
            
            console.log(`[LRPG] 🧮 坐标计算对比 ${layerId}:`);
            console.log(`  类型: ${isInputImage ? 'image' : 'annotation'}`);
            console.log(`  Fabric位置: left=${obj.left}, top=${obj.top}`);
            console.log(`  原始尺寸: ${obj.width}x${obj.height}, 缩放: ${obj.scaleX}x${obj.scaleY}`);
            console.log(`  缩放后尺寸: ${scaledWidth}x${scaledHeight}`);
            if (centerX_method1 !== undefined) {
                console.log(`  方法1 getCenterPoint(): (${centerX_method1}, ${centerY_method1})`);
            }
            console.log(`  方法2 手动计算: (${centerX_method2}, ${centerY_method2})`);
            
            // 使用正确的手动计算方法
            centerX = centerX_method2;
            centerY = centerY_method2;
            
            console.log(`  ✅ 最终使用: (${centerX}, ${centerY})`);
            
            const layerData = {
                type: imageSource === 'annotation' ? obj.type : 'image', // 🎯 标注保留原始类型，图像统一为'image'
                source: imageSource, // 🚀 新增：图像源类型
                // 🔍 调试信息
                _debug_fabricId: obj.fabricId,
                _debug_name: obj.name,
                image_data: imageData, // 🚀 新增：图像数据
                centerX: centerX,
                centerY: centerY,
                scaleX: obj.scaleX || 1,
                scaleY: obj.scaleY || 1,
                angle: obj.angle || 0,
                width: obj.width || 100,
                height: obj.height || 100,
                flipX: obj.flipX || false,
                flipY: obj.flipY || false,
                // 🎯 多边形特殊数据
                points: obj.points || undefined,  // 多边形的点坐标数组
                
                // 🎯 文字标注特殊数据
                text: (obj.type === 'text' || obj.type === 'i-text') ? obj.text || 'Text' : undefined,
                fontSize: (obj.type === 'text' || obj.type === 'i-text') ? obj.fontSize || 20 : undefined,
                fontFamily: (obj.type === 'text' || obj.type === 'i-text') ? obj.fontFamily || 'Arial' : undefined,
                fontWeight: (obj.type === 'text' || obj.type === 'i-text') ? obj.fontWeight || 'normal' : undefined,
                textAlign: (obj.type === 'text' || obj.type === 'i-text') ? obj.textAlign || 'left' : undefined,
                
                // 🔧 修复：添加样式信息（包含透明度）
                style: imageSource === 'annotation' ? {
                    stroke: obj.stroke || "#ff0000",
                    strokeWidth: obj.strokeWidth || 2,
                    fill: obj.fill || (obj.type === 'text' || obj.type === 'i-text' ? "#000000" : "transparent"),
                    opacity: obj.opacity !== undefined ? obj.opacity : 0.5
                } : {}
            };
            
            // 🔧 调试：标注透明度传递
            if (imageSource === 'annotation') {
                console.log(`[LRPG] 🎨 标注${layerId}样式传递: opacity=${obj.opacity} -> style.opacity=${layerData.style?.opacity}`);
            }
            
            // ✅ LRPG格式：裁切状态检查
            const hasTransformData = !!obj.transformFirstData;
            const hasCropTransforms = hasTransformData && obj.transformFirstData.transforms && 
                                    obj.transformFirstData.transforms.some(t => t.type === 'crop_mask');
            
            console.log(`[LRPG] 🔍 检查图层${layerId}的状态:`, {
                hasTransformFirstData: hasTransformData,
                transforms: obj.transformFirstData?.transforms?.length || 0,
                transformTypes: obj.transformFirstData?.transforms?.map(t => t.type) || [],
                hasCropTransforms: hasCropTransforms,
                isProcessedImage: !hasTransformData // 已处理的图像没有待处理的变换数据
            });
            
            if (hasCropTransforms) {
                // 有待应用的裁切变换
                const cropTransforms = obj.transformFirstData.transforms.filter(t => t.type === 'crop_mask');
                console.log(`[LRPG] 🔍 找到${cropTransforms.length}个待应用的裁切变换:`, cropTransforms);
                
                layerData.crop_path = cropTransforms[0].crop_path || [];
                console.log(`[LRPG] ✂️ 传递裁切路径给后端: ${layerData.crop_path.length} 个点`);
                layerData.crop_path.forEach((point, i) => {
                    console.log(`  点${i+1}: (${point.x}, ${point.y})`);
                });
            } else {
                // 无裁切变换或已应用的图像
                layerData.crop_path = [];
                if (!hasTransformData) {
                    console.log(`[LRPG] ✅ 图层${layerId}是已处理图像 - 无需后端裁切处理`);
                } else {
                    console.log(`[LRPG] ℹ️ 图层${layerId}无裁切变换`);
                }
            }
            
            transformData.layer_transforms[layerId] = layerData;
        });
    }


    console.log('[LRPG] 🎯 统一格式转换完成:', {
        layers: Object.keys(transformData.layer_transforms).length,
        background: transformData.layer_transforms.background
    });

    return transformData;
}
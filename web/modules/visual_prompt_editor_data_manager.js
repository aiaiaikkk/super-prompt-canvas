/**
 * Visual Prompt Editor - 数据管理模块
 * 负责数据的存储、加载、同步和状态管理
 */

export class DataManager {
    constructor(nodeInstance) {
        this.nodeInstance = nodeInstance;
        this.dataCache = new Map();
        this.stateHistory = [];
        this.maxHistorySize = 50;
        
        // 图层状态缓存 - 用于保存每个图层的设置状态
        this.layerStateCache = new Map();
    }

    /**
     * 保存标注数据到节点widget
     */
    saveAnnotationData(modal, promptData) {
        
        try {
            const annotationDataWidget = this.nodeInstance.widgets?.find(w => w.name === "annotation_data");
            
            if (!annotationDataWidget) {
                console.error('❌ 未找到annotation_data widget');
                return false;
            }

            // 标准化标注数据
            if (promptData.annotations) {
                promptData.annotations = promptData.annotations.map(annotation => {
                    return this.normalizeAnnotationData(annotation);
                });
                
            }

            // 保存完整的promptData作为JSON字符串
            const dataToSave = JSON.stringify(promptData);
            annotationDataWidget.value = dataToSave;
            
            // 缓存数据
            this.cacheData('last_saved', promptData);
            
            return true;
        } catch (error) {
            console.error('❌ 保存标注数据失败:', error);
            return false;
        }
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
     */
    cacheData(key, data) {
        this.dataCache.set(key, {
            data: JSON.parse(JSON.stringify(data)),
            timestamp: Date.now()
        });
        
        // 限制缓存大小
        if (this.dataCache.size > 100) {
            const firstKey = this.dataCache.keys().next().value;
            this.dataCache.delete(firstKey);
        }
    }

    /**
     * 获取缓存数据
     */
    getCachedData(key) {
        const cached = this.dataCache.get(key);
        if (cached) {
            return cached.data;
        }
        return null;
    }

    /**
     * 保存状态到历史记录
     */
    saveStateToHistory(modal, actionName) {
        const state = {
            action: actionName,
            timestamp: Date.now(),
            annotations: modal.annotations ? JSON.parse(JSON.stringify(modal.annotations)) : [],
            selectedLayers: modal.selectedLayers ? Array.from(modal.selectedLayers) : []
        };
        
        this.stateHistory.push(state);
        
        // 限制历史记录大小
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
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
        
        
        // 恢复标注数据
        modal.annotations = JSON.parse(JSON.stringify(state.annotations));
        
        // 恢复选择状态
        modal.selectedLayers = new Set(state.selectedLayers);
        
        // Fabric objects do not need layer connection restoration
        
        this.stateHistory = this.stateHistory.slice(0, targetIndex + 1);
        
        return true;
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
     */
    saveFabricCanvasData(fabricCanvas) {
        if (!fabricCanvas) {
            return false;
        }
        
        try {
            const objects = fabricCanvas.getObjects();
            
            // 🎯 使用Fabric.js官方画布图像导出功能
            const canvasDataURL = fabricCanvas.toDataURL({
                format: 'png',
                quality: 1.0,
                multiplier: 1, // 保持原始分辨率
                enableRetinaScaling: false
            });
            
            const backgroundColor = fabricCanvas.backgroundColor || '#ffffff';
            
            // 序列化Fabric对象数据和完整画布信息
            const fabricData = {
                version: '3.1',
                timestamp: Date.now(),
                canvasWidth: fabricCanvas.getWidth(),
                canvasHeight: fabricCanvas.getHeight(),
                backgroundColor: backgroundColor,
                // 🎯 完整画布图像 - 使用Fabric.js官方导出
                canvasImageDataURL: canvasDataURL,
                // Fabric.js官方JSON序列化
                fabricJSON: fabricCanvas.toJSON(['fabricId']), // 包含自定义属性
                objects: objects.map(obj => {
                    // 将Fabric对象转换为可序列化的数据
                    const objData = obj.toObject();
                    
                    // 保存自定义属性
                    if (obj.fabricId) {
                        objData.fabricId = obj.fabricId;
                    }
                    
                    return objData;
                })
            };
            
            console.log(`🎨 Fabric canvas data prepared: ${objects.length} objects, image size: ${(canvasDataURL.length / 1024).toFixed(1)}KB, background: ${backgroundColor}`);
            
            // 保存到annotation_data widget
            const annotationDataWidget = this.nodeInstance.widgets?.find(w => w.name === "annotation_data");
            if (annotationDataWidget) {
                annotationDataWidget.value = JSON.stringify(fabricData);
                console.log('✅ Canvas data saved to annotation_data widget (includes complete canvas image)');
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
                        // 确保对象有fabricId
                        if (objData.fabricId) {
                            fabricObject.fabricId = objData.fabricId;
                        } else {
                            fabricObject.fabricId = `fabric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
            annotations: modal.annotations || [],
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
        const annotations = data.annotations || [];
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
            
            // 导入标注数据
            if (importData.annotations) {
                modal.annotations = importData.annotations.map(ann => this.normalizeAnnotationData(ann));
            }
            
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
            annotationCount: modal.annotations?.length || 0,
            // connectedLayerCount removed - using Fabric objects
            selectedCount: modal.selectedLayers?.size || 0,
            historyCount: this.stateHistory.length,
            cacheSize: this.dataCache.size,
            lastSaved: this.getCachedData('last_saved') ? new Date(this.getCachedData('last_saved').timestamp) : null,
            lastLoaded: this.getCachedData('last_loaded') ? new Date(this.getCachedData('last_loaded').timestamp) : null
        };
        
        // 按类型统计标注
        if (modal.annotations) {
            stats.annotationsByType = {};
            modal.annotations.forEach(ann => {
                stats.annotationsByType[ann.type] = (stats.annotationsByType[ann.type] || 0) + 1;
            });
        }
        
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
     */
    clearHistory() {
        this.stateHistory = [];
    }

    /**
     * 清理所有资源
     */
    cleanup() {
        this.clearCache();
        this.clearHistory();
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
        
        if (!modal.annotations || modal.annotations.length === 0) {
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
        
        modal.annotations.forEach((annotation, index) => {
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
        
        // 安全的数据验证
        if (!modal.annotations || modal.annotations.length === 0) {
            dropdownOptions.innerHTML = '';
            if (noLayersMessage) noLayersMessage.style.display = 'block';
            return;
        }
        
        // 隐藏空消息
        if (noLayersMessage) noLayersMessage.style.display = 'none';
        
        // 清空现有选项
        dropdownOptions.innerHTML = '';
        
        modal.annotations.forEach((annotation, index) => {
            
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
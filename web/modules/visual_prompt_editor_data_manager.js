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
    }

    /**
     * 保存标注数据到节点widget
     */
    saveAnnotationData(modal, promptData) {
        console.log('💾 保存标注数据到节点widget...');
        
        try {
            const annotationDataWidget = this.nodeInstance.widgets?.find(w => w.name === "annotation_data");
            const promptTemplateWidget = this.nodeInstance.widgets?.find(w => w.name === "prompt_template");
            
            if (!annotationDataWidget) {
                console.error('❌ 未找到annotation_data widget');
                return false;
            }

            // 标准化标注数据
            if (promptData.annotations) {
                promptData.annotations = promptData.annotations.map(annotation => {
                    return this.normalizeAnnotationData(annotation);
                });
                
                console.log('📊 标准化后的标注数据:', promptData.annotations.length, '个标注');
            }

            // 保存完整的promptData作为JSON字符串
            const dataToSave = JSON.stringify(promptData);
            annotationDataWidget.value = dataToSave;
            
            console.log('✅ 已保存annotation_data到widget:', dataToSave.length, '字符');
            
            // 同步操作类型到后端
            this.syncOperationTypeToBackend(modal, promptTemplateWidget);
            
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
        console.log('📤 从节点widget加载标注数据...');
        
        try {
            const annotationDataWidget = this.nodeInstance.widgets?.find(w => w.name === "annotation_data");
            
            if (!annotationDataWidget || !annotationDataWidget.value) {
                console.log('📝 没有保存的标注数据');
                return null;
            }

            const parsedData = JSON.parse(annotationDataWidget.value);
            console.log('✅ 成功加载标注数据:', parsedData.annotations?.length || 0, '个标注');
            
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
     * 同步操作类型到后端
     */
    syncOperationTypeToBackend(modal, promptTemplateWidget) {
        const operationType = modal.querySelector('#operation-type');
        const targetInput = modal.querySelector('#target-input');
        
        if (operationType && promptTemplateWidget && operationType.value !== promptTemplateWidget.value) {
            promptTemplateWidget.value = operationType.value;
            console.log('🔄 同步操作类型到后端:', operationType.value);
        }
        
        // 同步目标文本
        if (targetInput) {
            const targetTextWidget = this.nodeInstance.widgets?.find(w => w.name === "target_text");
            if (targetTextWidget && targetInput.value !== targetTextWidget.value) {
                targetTextWidget.value = targetInput.value;
                console.log('🔄 同步目标文本到后端:', targetInput.value);
            }
        }
    }

    /**
     * 初始化前端UI从后端参数
     */
    initializeFrontendFromBackend(modal) {
        console.log('🔄 从后端参数初始化前端UI...');
        
        const promptTemplateWidget = this.nodeInstance.widgets?.find(w => w.name === "prompt_template");
        const targetTextWidget = this.nodeInstance.widgets?.find(w => w.name === "target_text");
        
        const operationType = modal.querySelector('#operation-type');
        const targetInput = modal.querySelector('#target-input');
        
        // 同步操作类型
        if (promptTemplateWidget && operationType && promptTemplateWidget.value) {
            operationType.value = promptTemplateWidget.value;
            console.log('🔄 已从后端同步操作类型到前端:', promptTemplateWidget.value);
        }
        
        // 同步目标文本
        if (targetTextWidget && targetInput && targetTextWidget.value) {
            targetInput.value = targetTextWidget.value;
            console.log('🔄 已从后端同步目标文本到前端:', targetTextWidget.value);
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
            selectedLayers: modal.selectedLayers ? Array.from(modal.selectedLayers) : [],
            connectedLayers: this.nodeInstance.connectedImageLayers ? 
                JSON.parse(JSON.stringify(this.nodeInstance.connectedImageLayers)) : []
        };
        
        this.stateHistory.push(state);
        
        // 限制历史记录大小
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
        
        console.log(`📚 状态已保存到历史记录: ${actionName}, 当前历史记录: ${this.stateHistory.length}`);
    }

    /**
     * 从历史记录恢复状态
     */
    restoreFromHistory(modal, stepsBack = 1) {
        if (this.stateHistory.length < stepsBack + 1) {
            console.warn('⚠️ 历史记录不足，无法回退');
            return false;
        }
        
        const targetIndex = this.stateHistory.length - stepsBack - 1;
        const state = this.stateHistory[targetIndex];
        
        if (!state) {
            console.warn('⚠️ 未找到目标状态');
            return false;
        }
        
        console.log(`🔄 恢复到历史状态: ${state.action} (${new Date(state.timestamp).toLocaleTimeString()})`);
        
        // 恢复标注数据
        modal.annotations = JSON.parse(JSON.stringify(state.annotations));
        
        // 恢复选择状态
        modal.selectedLayers = new Set(state.selectedLayers);
        
        // 恢复连接图层
        if (state.connectedLayers) {
            this.nodeInstance.connectedImageLayers = JSON.parse(JSON.stringify(state.connectedLayers));
        }
        
        // 移除后续的历史记录
        this.stateHistory = this.stateHistory.slice(0, targetIndex + 1);
        
        return true;
    }

    /**
     * 导出数据
     */
    exportData(modal, format = 'json') {
        console.log('📤 导出数据，格式:', format);
        
        const exportData = {
            version: '2.0',
            exported: Date.now(),
            annotations: modal.annotations || [],
            connectedLayers: this.nodeInstance.connectedImageLayers || [],
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
        console.log('📥 导入数据，格式:', format);
        
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
                console.log('✅ 已导入', modal.annotations.length, '个标注');
            }
            
            // 导入连接图层数据
            if (importData.connectedLayers) {
                this.nodeInstance.connectedImageLayers = importData.connectedLayers;
                console.log('✅ 已导入', this.nodeInstance.connectedImageLayers.length, '个连接图层');
            }
            
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
        
        // 检查基本结构
        if (data.annotations && !Array.isArray(data.annotations)) {
            return false;
        }
        
        if (data.connectedLayers && !Array.isArray(data.connectedLayers)) {
            return false;
        }
        
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
            connectedLayerCount: this.nodeInstance.connectedImageLayers?.length || 0,
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
        console.log('🧹 数据缓存已清理');
    }

    /**
     * 清理历史记录
     */
    clearHistory() {
        this.stateHistory = [];
        console.log('🧹 历史记录已清理');
    }

    /**
     * 清理所有资源
     */
    cleanup() {
        this.clearCache();
        this.clearHistory();
        console.log('🧹 数据管理器资源清理完成');
    }
}

/**
 * 调用标准的updateObjectSelector逻辑
 * 从主文件迁移的数据处理逻辑
 */
export function callStandardUpdateObjectSelector(modal, nodeInstance) {
    console.log('🔄 尝试调用标准updateObjectSelector函数...');
    
    try {
        // 模拟标准updateObjectSelector的行为
        // 这个函数在annotations模块中定义，我们需要复制其逻辑
        const dropdownOptions = modal.querySelector('#dropdown-options');
        const layerOperations = modal.querySelector('#layer-operations');
        const noLayersMessage = modal.querySelector('#no-layers-message');
        const selectionCount = modal.cachedElements?.selectionCount || modal.querySelector('#selection-count');
        
        if (!dropdownOptions) {
            console.warn('⚠️ 找不到下拉选择器元素');
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
        
        // 创建下拉选项 - 使用与标准函数相同的逻辑
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
        
        // 更新选中计数和下拉框文本 - 安全调用，如果方法不存在则跳过
        try {
            if (nodeInstance?.standardUpdateSelectionCount) {
                nodeInstance.standardUpdateSelectionCount(modal);
            } else {
                console.log('⚠️ standardUpdateSelectionCount 方法不存在，跳过');
            }
            
            if (nodeInstance?.standardUpdateDropdownText) {
                nodeInstance.standardUpdateDropdownText(modal);
            } else {
                console.log('⚠️ standardUpdateDropdownText 方法不存在，跳过');
            }
            
            // 绑定下拉框事件 - 安全调用
            if (nodeInstance?.standardBindDropdownEvents) {
                nodeInstance.standardBindDropdownEvents(modal);
            } else {
                console.log('⚠️ standardBindDropdownEvents 方法不存在，跳过');
            }
        } catch (methodError) {
            console.warn('⚠️ 调用标准方法时出现错误，但不影响主要功能:', methodError);
        }
        
        console.log('✅ 标准updateObjectSelector逻辑执行完成，共', modal.annotations.length, '个图层');
        
    } catch (error) {
        console.error('❌ 调用标准updateObjectSelector失败:', error);
    }
}

/**
 * 恢复后更新下拉复选框
 * 从主文件迁移的下拉框更新逻辑
 */
export function updateDropdownAfterRestore(modal, nodeInstance) {
    console.log('🔄 尝试更新下拉复选框 - annotations数量:', modal.annotations?.length || 0);
    
    try {
        const dropdownOptions = modal.querySelector('#dropdown-options');
        const noLayersMessage = modal.querySelector('#no-layers-message');
        
        console.log('🔍 DOM元素检查:', {
            dropdownOptions: !!dropdownOptions,
            noLayersMessage: !!noLayersMessage,
            modalId: modal.id
        });
        
        if (!dropdownOptions) {
            console.warn('⚠️ 找不到 #dropdown-options 元素');
            return;
        }
        
        // 安全的数据验证
        if (!modal.annotations || modal.annotations.length === 0) {
            console.log('📝 没有annotations需要显示');
            dropdownOptions.innerHTML = '';
            if (noLayersMessage) noLayersMessage.style.display = 'block';
            return;
        }
        
        // 隐藏空消息
        if (noLayersMessage) noLayersMessage.style.display = 'none';
        
        // 清空现有选项
        dropdownOptions.innerHTML = '';
        console.log('📋 开始创建', modal.annotations.length, '个图层选项...');
        
        // 创建下拉选项
        modal.annotations.forEach((annotation, index) => {
            console.log(`📌 创建图层选项 ${index + 1}:`, {
                id: annotation.id,
                type: annotation.type,
                number: annotation.number
            });
            
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
                    console.log('⚠️ eventHandlers.bindCheckboxEventsForRestore 方法不存在，跳过');
                }
            } catch (handlerError) {
                console.warn('⚠️ 绑定复选框事件时出现错误，但不影响主要功能:', handlerError);
            }
        });
        
        // 初始化选中状态管理
        if (!modal.selectedLayers) {
            modal.selectedLayers = new Set();
        }
        
        // 更新下拉框显示文本
        const dropdownText = modal.querySelector('#dropdown-text');
        if (dropdownText) {
            dropdownText.textContent = 'Click to select layers...';
            dropdownText.style.color = '#aaa';
            dropdownText.style.fontSize = '12px';
        }
        
        // 更新选中计数
        const selectionCount = modal.cachedElements?.selectionCount || modal.querySelector('#selection-count');
        if (selectionCount) {
            selectionCount.textContent = `0 selected`;
        }
        
        console.log('✅ 下拉复选框更新完成，共创建', modal.annotations.length, '个选项');
        
        // 安全调用下拉框事件绑定
        try {
            if (nodeInstance?.eventHandlers?.bindDropdownEventsForRestore) {
                nodeInstance.eventHandlers.bindDropdownEventsForRestore(modal);
            } else if (nodeInstance?.bindDropdownEventsForRestore) {
                nodeInstance.bindDropdownEventsForRestore(modal);
            } else {
                console.log('⚠️ 下拉框事件绑定方法不存在，跳过');
            }
        } catch (bindError) {
            console.warn('⚠️ 绑定下拉框事件时出现错误，但不影响主要功能:', bindError);
        }
        
    } catch (error) {
        console.error('❌ 更新下拉复选框失败:', error);
    }
}

// 导出创建函数
export function createDataManager(nodeInstance) {
    return new DataManager(nodeInstance);
}
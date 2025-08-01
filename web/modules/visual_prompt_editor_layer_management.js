/**
 * Visual Prompt Editor - 完整图层管理系统
 * 整合了所有图层相关功能：核心管理、排序、可见性、变换控制和系统管理
 * 
 * 功能：
 * - 背景图层 + 3个可调整图层
 * - 图层位置和大小调整
 * - 图层显示/隐藏控制
 * - 拖拽排序和Z轴控制
 * - 图层变换控制（缩放、旋转、拖拽）
 * - 与现有标注系统兼容
 */

import { 
    DOMFactory, 
    StyleManager, 
    EventManager,
    createElement,
    setElementStyles,
    bindEvent,
    createModalElementsCache,
    safeDOMOperation
} from './shared/dom_helpers.js';
import { getCoordinateSystem, clearCoordinateCache } from './shared/coordinate_system.js';

// 功能开关 - 现在启用图层管理功能
export const LAYER_MANAGEMENT_ENABLED = true;

// 图层管理数据结构
export class LayerManager {
    constructor(modal) {
        this.modal = modal;
        this.layers = [];
        this.backgroundLayer = null;
        this.activeLayer = null;
        this.initialized = false;
        
        // 只有启用时才初始化
        if (LAYER_MANAGEMENT_ENABLED) {
            this.initialize();
        }
    }
    
    /**
     * 初始化图层管理系统
     */
    initialize() {
        
        this.backgroundLayer = {
            id: 'background',
            name: '背景',
            type: 'background',
            visible: true,
            locked: true,
            opacity: 1.0,
            zIndex: 0
        };
        
        for (let i = 1; i <= 3; i++) {
            this.layers.push({
                id: `layer_${i}`,
                name: `图层 ${i}`,
                type: 'image_layer',
                visible: true,
                locked: false,
                opacity: 1.0,
                transform: {
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                    rotation: 0,
                    scaleX: 1.0,
                    scaleY: 1.0
                },
                zIndex: i,
                imageData: null,
                blendMode: 'normal'
            });
        }
        
        this.initialized = true;
    }
    
    /**
     * 检查功能是否启用
     */
    isEnabled() {
        return LAYER_MANAGEMENT_ENABLED && this.initialized;
    }
    
    /**
     * 获取所有图层（包括背景）
     */
    getAllLayers() {
        if (!this.isEnabled()) return [];
        return [this.backgroundLayer, ...this.layers];
    }
    
    /**
     * 根据ID获取图层
     */
    getLayerById(id) {
        if (!this.isEnabled()) return null;
        
        if (id === 'background') {
            return this.backgroundLayer;
        }
        
        return this.layers.find(layer => layer.id === id);
    }
    
    /**
     * 设置活动图层
     */
    setActiveLayer(layerId) {
        if (!this.isEnabled()) return;
        
        const layer = this.getLayerById(layerId);
        if (layer) {
            this.activeLayer = layer;
        }
    }
    
    /**
     * 切换图层可见性
     */
    toggleLayerVisibility(layerId) {
        if (!this.isEnabled()) return;
        
        const layer = this.getLayerById(layerId);
        if (layer && !layer.locked) {
            layer.visible = !layer.visible;
            this.updateLayerDisplay();
        }
    }
    
    /**
     * 设置图层透明度
     */
    setLayerOpacity(layerId, opacity) {
        if (!this.isEnabled()) return;
        
        const layer = this.getLayerById(layerId);
        if (layer) {
            layer.opacity = Math.max(0, Math.min(1, opacity));
            this.updateLayerDisplay();
        }
    }
    
    /**
     * 更新图层变换属性
     */
    updateLayerTransform(layerId, transform) {
        if (!this.isEnabled()) return;
        
        const layer = this.getLayerById(layerId);
        if (layer && layer.type !== 'background') {
            Object.assign(layer.transform, transform);
            this.updateLayerDisplay();
        }
    }
    
    /**
     * 调整图层顺序
     */
    reorderLayer(layerId, newZIndex) {
        if (!this.isEnabled()) return;
        
        const layer = this.getLayerById(layerId);
        if (layer && layer.type !== 'background') {
            layer.zIndex = newZIndex;
            this.updateLayerDisplay();
        }
    }
    
    /**
     * 更新图层显示
     */
    updateLayerDisplay() {
        if (!this.isEnabled()) return;
        
        // 触发UI更新事件
        const event = new CustomEvent('layersUpdated', {
            detail: {
                layers: this.getAllLayers(),
                activeLayer: this.activeLayer
            }
        });
        
        this.modal.dispatchEvent(event);
    }
    
    /**
     * 导出图层数据
     */
    exportLayerData() {
        if (!this.isEnabled()) return null;
        
        return {
            background: this.backgroundLayer,
            layers: this.layers,
            activeLayerId: this.activeLayer?.id || null,
            version: '1.0'
        };
    }
    
    /**
     * 导入图层数据
     */
    importLayerData(data) {
        if (!this.isEnabled() || !data) return;
        
        try {
            if (data.background) {
                Object.assign(this.backgroundLayer, data.background);
            }
            
            if (data.layers && Array.isArray(data.layers)) {
                this.layers = data.layers;
            }
            
            if (data.activeLayerId) {
                this.setActiveLayer(data.activeLayerId);
            }
            
            this.updateLayerDisplay();
        } catch (error) {
            console.error('Failed to import layer data:', error);
        }
    }
}

// ==================== 图层核心管理器类 ====================

/**
 * 图层核心管理器类
 * 统一处理图层显示、事件绑定、数据管理等功能
 */
export class LayerCoreManager {
    constructor() {
        this.debounceTimers = new Map();
        this.lastUpdateTimes = new Map();
        this.eventCleanupFunctions = new Map();
    }

    /**
     * 获取图层相关DOM元素的统一访问器
     * 消除重复的DOM查询代码
     */
    getLayerElements(modal) {
        if (!modal) {
            console.warn('❌ LayerCoreManager: modal参数为空');
            return null;
        }

        // 使用缓存的元素访问器，避免重复查询
        const elements = modal.cachedElements || createModalElementsCache(modal);
        
        return {
            // 图层列表相关
            layersList: elements.layersList(),
            layersContainer: elements.layersContainer(),
            
            // 画布相关
            canvasContainer: elements.canvasContainer(),
            imageCanvas: elements.imageCanvas(),
            drawingLayer: elements.drawingLayer(),
            
            // 直接查询方法
            querySelector: (selector) => modal.querySelector(selector),
            querySelectorAll: (selector) => modal.querySelectorAll(selector),
            
            // 常用容器快速访问
            layersDisplayContainer: () => modal.querySelector('#layers-display-container'),
            
            // 验证方法
            isValid: () => {
                return elements.layersList() && elements.canvasContainer();
            }
        };
    }

    /**
     * 统一的图层显示更新方法
     */
    updateLayerDisplay(modal, layers, options = {}) {
        const {
            updateType = 'full',
            preventDuplicate = true,
            logOperation = true
        } = options;

        // 防重复更新逻辑
        if (preventDuplicate && this.shouldSkipUpdate(modal, 'layerDisplay', 50)) {
            if (logOperation) {
                console.log('⏰ 跳过重复的图层显示更新');
            }
            return false;
        }

        const elements = this.getLayerElements(modal);
        if (!elements || !elements.isValid()) {
            console.warn('❌ LayerCoreManager: 无法获取有效的图层元素');
            return false;
        }

        try {
            if (logOperation) {
                console.log(`🎨 开始更新图层显示 (${updateType}):`, layers?.length || 0, '个图层');
            }

            // 根据更新类型执行不同的更新策略
            switch (updateType) {
                case 'full':
                    return this._fullLayerDisplayUpdate(elements, layers, logOperation);
                case 'canvas':
                    return this._canvasLayerDisplayUpdate(elements, layers, logOperation);
                case 'list':
                    return this._listLayerDisplayUpdate(elements, layers, logOperation);
                default:
                    console.warn('❌ 未知的图层显示更新类型:', updateType);
                    return false;
            }
        } catch (error) {
            console.error('❌ 图层显示更新失败:', error);
            return false;
        }
    }

    // ... (其他 LayerCoreManager 方法将继续在下一个编辑中添加)
    
    /**
     * 防抖功能
     */
    debounce(func, delay = 300) {
        const funcId = func.toString().slice(0, 50);
        
        return (...args) => {
            const timerId = this.debounceTimers.get(funcId);
            if (timerId) {
                clearTimeout(timerId);
            }
            
            const newTimerId = setTimeout(() => {
                func.apply(this, args);
                this.debounceTimers.delete(funcId);
            }, delay);
            
            this.debounceTimers.set(funcId, newTimerId);
        };
    }

    /**
     * 检查是否应该跳过更新
     */
    shouldSkipUpdate(modal, operationType, minInterval = 50) {
        const now = Date.now();
        const key = `${modal.id || 'default'}_${operationType}`;
        const lastUpdate = this.lastUpdateTimes.get(key);
        
        if (lastUpdate && (now - lastUpdate) < minInterval) {
            return true;
        }
        
        this.lastUpdateTimes.set(key, now);
        return false;
    }

    /**
     * 清理模态框相关的事件绑定
     */
    cleanupModalEvents(modal) {
        const modalId = modal.id || 'default';
        const cleanupFunctions = this.eventCleanupFunctions.get(modalId);
        
        if (cleanupFunctions && cleanupFunctions.length > 0) {
            cleanupFunctions.forEach(cleanup => {
                try {
                    cleanup && cleanup();
                } catch (error) {
                    console.warn('⚠️ LayerCoreManager: 清理事件绑定时出错:', error);
                }
            });
            this.eventCleanupFunctions.delete(modalId);
            console.log(`🧹 LayerCoreManager: 已清理${cleanupFunctions.length}个事件绑定`);
        }
    }

    /**
     * 销毁管理器，清理所有资源
     */
    destroy() {
        // 清理所有防抖定时器
        this.debounceTimers.forEach(timerId => clearTimeout(timerId));
        this.debounceTimers.clear();
        
        // 清理所有事件绑定
        this.eventCleanupFunctions.forEach((cleanupFunctions, modalId) => {
            cleanupFunctions.forEach(cleanup => cleanup && cleanup());
        });
        this.eventCleanupFunctions.clear();
        
        // 清理时间记录
        this.lastUpdateTimes.clear();
        
        console.log('🧹 LayerCoreManager: 已销毁并清理所有资源');
    }

    // 私有方法将在下一个编辑中添加
    _fullLayerDisplayUpdate(elements, layers, logOperation) {
        return true; // 暂时返回true，完整实现在下一个编辑中
    }
    
    _canvasLayerDisplayUpdate(elements, layers, logOperation) {
        return true; // 暂时返回true，完整实现在下一个编辑中
    }
    
    _listLayerDisplayUpdate(elements, layers, logOperation) {
        return true; // 暂时返回true，完整实现在下一个编辑中
    }
}

/**
 * 检查图层管理功能是否可用
 */
export function isLayerManagementAvailable() {
    return LAYER_MANAGEMENT_ENABLED;
}

/**
 * 启用图层管理功能（开发调试用）
 */
export function enableLayerManagement() {
    // 这个函数预留给将来的功能开关
}

// ==================== 图层系统核心类 ====================

/**
 * 图层系统核心类
 * 负责图层检测、初始化、显示和基础管理功能
 */
export class LayerSystemCore {
    constructor(nodeInstance) {
        this.nodeInstance = nodeInstance;
        this.connectedImageLayers = [];
    }

    /**
     * 初始化集成图层系统
     */
    initializeIntegratedLayerSystem(modal) {
        // 检测连接的图像图层
        this.connectedImageLayers = this.detectConnectedImageLayers();
        
        // 缓存检测到的图层，防止状态丢失
        if (this.connectedImageLayers && this.connectedImageLayers.length > 0) {
            modal._cachedConnectedLayers = JSON.parse(JSON.stringify(this.connectedImageLayers));
        }
        
        // 创建图层显示系统
        this.setupLayerCanvasDisplay(modal);
        
        // 尝试恢复图层顺序状态
        this.restoreLayerOrder(modal);
        
        // 将连接图层数据设置到节点实例，以便其他代码可以访问
        this.nodeInstance.connectedImageLayers = this.connectedImageLayers;
        
        return this.connectedImageLayers;
    }

    /**
     * 检测连接的图像图层
     */
    detectConnectedImageLayers() {
        const connectedLayers = [];
        
        if (this.nodeInstance.inputs) {
            this.nodeInstance.inputs.forEach((input, index) => {
                if (input.type === 'IMAGE' && input.link !== null) {
                    let layerId = input.name;
                    
                    // 如果是主图像输入，跳过
                    if (input.name === 'image') {
                        return;
                    }
                    
                    // 修正layer ID格式 - 将layer_1转换为layer1
                    if (layerId.startsWith('layer_')) {
                        layerId = layerId.replace('layer_', 'layer');
                    } else if (!layerId.startsWith('layer')) {
                        layerId = `layer${connectedLayers.length + 1}`;
                    }
                    
                    const layerData = {
                        id: layerId,
                        name: layerId.replace(/layer_?(\d+)/i, 'Layer $1'),
                        connected: true,
                        originalName: input.name,
                        linkId: input.link,
                        visible: true,
                        opacity: 1.0,
                        transform: {
                            x: 0, y: 0, scale: 1.0, rotation: 0
                        }
                    };
                    
                    connectedLayers.push(layerData);
                }
            });
        }
        
        return connectedLayers;
    }

    /**
     * 设置图层画布显示系统
     */
    setupLayerCanvasDisplay(modal) {
        const canvasContainer = modal.querySelector('#canvas-container');
        if (!canvasContainer) {
            return;
        }
        
        // 检查是否已存在图层显示容器
        const existingContainer = modal.querySelector('#layers-display-container');
        if (existingContainer) {
            return;
        }
        
        // 创建图层显示容器
        const layersDisplayContainer = document.createElement('div');
        layersDisplayContainer.id = 'layers-display-container';
        layersDisplayContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        
        // 插入到绘制层之前（确保标注在图层之上）
        const drawingLayer = canvasContainer.querySelector('#drawing-layer');
        if (drawingLayer && drawingLayer.parentNode === canvasContainer) {
            canvasContainer.insertBefore(layersDisplayContainer, drawingLayer);
        } else {
            canvasContainer.appendChild(layersDisplayContainer);
        }
        
        // 显示连接的图层
        this.displayConnectedLayers(layersDisplayContainer);
    }

    /**
     * 显示连接的图层
     */
    displayConnectedLayers(layersContainer) {
        const layersToDisplay = this.nodeInstance.connectedImageLayers || this.connectedImageLayers;
        
        if (layersToDisplay && layersToDisplay.length > 0) {
            layersToDisplay.forEach((layer, index) => {
                this.createCanvasLayerDisplay(layersContainer, layer, index);
            });
        }
    }

    /**
     * 创建画布图层显示
     */
    createCanvasLayerDisplay(container, layer, index) {
        const modal = container.closest('#unified-editor-modal');
        if (!modal) {
            return;
        }
        
        // 获取连接的图像数据 (使用回调机制)
        this.loadConnectedLayerImage(layer, (imageUrl) => {
            const layerElement = document.createElement('div');
            layerElement.className = 'canvas-layer-display';
            layerElement.id = `canvas-layer-${layer.id}`;
            
            // 计算缩放和位置
            const currentZoom = modal.currentZoom || 1.0;
            const finalScale = (layer.transform?.scale || 1.0) * currentZoom;
            
            const totalLayers = this.connectedImageLayers ? this.connectedImageLayers.length : 3;
            const zIndex = totalLayers - index;
            
            layerElement.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: ${layer.opacity || 1.0};
                transform: scale(${finalScale}) translate(${layer.transform?.x || 0}px, ${layer.transform?.y || 0}px);
                z-index: ${zIndex};
                pointer-events: none;
            `;
            
            if (imageUrl) {
                layerElement.innerHTML = `
                    <img src="${imageUrl}" style="
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        opacity: ${layer.visible ? 1 : 0.3};
                    ">
                `;
            } else {
                layerElement.innerHTML = `
                    <div style="
                        width: 100%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(16, 185, 129, 0.1);
                        border: 2px dashed #10b981;
                        color: #10b981;
                        font-size: 14px;
                    ">📷 ${layer.name}</div>
                `;
            }
            
            container.appendChild(layerElement);
        });
    }

    loadConnectedLayerImage(layer, callback) {
        try {
            if (this.nodeInstance.graph && layer.linkId) {
                const link = this.nodeInstance.graph.links[layer.linkId];
                if (link) {
                    const sourceNode = this.nodeInstance.graph.getNodeById(link.origin_id);
                    if (sourceNode && sourceNode.imgs && sourceNode.imgs.length > 0) {
                        const imageUrl = sourceNode.imgs[0].src;
                        callback(imageUrl);
                        return;
                    }
                }
            }
        } catch (error) {
            // 静默处理错误
        }
        
        callback(null);
    }

    restoreLayerOrder(modal) {
        try {
            const savedOrder = localStorage.getItem('vpe_layer_order');
            if (savedOrder) {
                const orderData = JSON.parse(savedOrder);
                if (orderData.layers && Array.isArray(orderData.layers)) {
                    return true;
                }
            }
        } catch (error) {
            // 静默处理错误
        }
        return false;
    }

    toggleConnectedLayersDisplay(modal, enabled) {
        const layersDisplayContainer = modal.querySelector('#layers-display-container');
        if (!layersDisplayContainer) {
            return;
        }
        
        layersDisplayContainer.style.display = enabled ? 'block' : 'none';
    }

    getConnectedImageLayers() {
        return this.connectedImageLayers;
    }

    getCachedConnectedLayers(modal) {
        return modal._cachedConnectedLayers || [];
    }
}

/**
 * 交换相邻图层逻辑
 * 从主文件迁移的图层交换功能
 */
export function swapAdjacentLayers(modal, layerId1, layerId2, nodeInstance, retryCount = 0) {
    // 防抖处理：避免多次快速调用
    const swapKey = `${layerId1}_${layerId2}`;
    if (!nodeInstance._swapDebounce) nodeInstance._swapDebounce = new Set();
    
    if (nodeInstance._swapDebounce.has(swapKey)) {
        return;
    }
    
    nodeInstance._swapDebounce.add(swapKey);
    
    setTimeout(() => {
        nodeInstance._swapDebounce.delete(swapKey);
    }, 1000);
    
    // 等待DOM更新完成后再获取图层数据
    const executeSwap = () => {
        // 优先使用DOM顺序获取图层数据，更可靠
        let allLayers = [];
        
        // 安全调用getAllLayersInOrder方法
        try {
            if (nodeInstance?.getAllLayersInOrder) {
                allLayers = nodeInstance.getAllLayersInOrder(modal);
            }
        } catch (error) {
            console.warn('getAllLayersInOrder method call failed, using fallback method:', error);
        }
        
        // If DOM method fails, use Fabric objects as fallback
        if (allLayers.length === 0) {
            // Get from Fabric objects (annotations)
            if (modal.annotations) {
                modal.annotations.forEach(annotation => {
                    allLayers.push({...annotation, type: 'FABRIC_OBJECT'});
                });
            }
        }
        
        
        // 数据不完整时等待一下再重试，但限制重试次数
        if (allLayers.length < 2) {
            if (retryCount >= 5) {
                console.warn(`Failed to get layer data after ${retryCount} retries, stopping retry`);
                nodeInstance._swapDebounce.delete(swapKey);
                return;
            }
            setTimeout(() => {
                nodeInstance._swapDebounce.delete(swapKey);
                swapAdjacentLayers(modal, layerId1, layerId2, nodeInstance, retryCount + 1);
            }, 100);
            return;
        }
        
        // 继续执行交换逻辑...
        try {
            if (nodeInstance?.layerOrderController?.performLayerSwap) {
                nodeInstance.layerOrderController.performLayerSwap(modal, allLayers, layerId1, layerId2, swapKey);
            } else {
                console.warn('layerOrderController.performLayerSwap method does not exist, skipping swap operation');
                nodeInstance._swapDebounce.delete(swapKey);
            }
        } catch (swapError) {
            console.error('Layer swap operation failed:', swapError);
            nodeInstance._swapDebounce.delete(swapKey);
        }
    };
    
    // 如果是重试，立即执行；否则等待一小段时间确保DOM稳定
    if (retryCount > 0) {
        executeSwap();
    } else {
        setTimeout(executeSwap, 10);
    }
}

/**
 * 创建图层管理UI面板（仅在启用时）
 */
export function createLayerManagementPanel() {
    if (!LAYER_MANAGEMENT_ENABLED) {
        return null;
    }
    
    const panel = document.createElement('div');
    panel.id = 'layer-management-panel';
    panel.style.cssText = `
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 12px;
        margin-top: 12px;
    `;
    
    panel.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span style="color: #10b981; font-weight: bold;">🎨</span>
            <span style="color: white; font-weight: bold; font-size: 14px;">图层管理</span>
            <span style="color: #888; font-size: 11px;">(实验功能)</span>
        </div>
        
        <div id="layer-list" style="background: #333; border-radius: 4px; padding: 8px;">
            <div style="color: #888; text-align: center; padding: 20px; font-size: 12px;">
                图层管理功能开发中...
            </div>
        </div>
        
        <div style="margin-top: 8px; display: flex; gap: 8px;">
            <button id="add-layer-btn" style="flex: 1; padding: 6px; background: #4CAF50; color: white; border: none; border-radius: 4px; font-size: 11px;">
                + 添加图层
            </button>
            <button id="layer-settings-btn" style="flex: 1; padding: 6px; background: #2196F3; color: white; border: none; border-radius: 4px; font-size: 11px;">
                ⚙️ 设置
            </button>
        </div>
    `;
    
    return panel;
}

// ==================== 全局实例和工具函数 ====================

// 创建全局单例实例
export const layerCoreManager = new LayerCoreManager();

// 便捷函数导出
export const getLayerElements = (modal) => layerCoreManager.getLayerElements(modal);
export const updateLayerDisplay = (modal, layers, options) => 
    layerCoreManager.updateLayerDisplay(modal, layers, options);

// 工厂函数
export function createLayerSystemCore(nodeInstance) {
    return new LayerSystemCore(nodeInstance);
}

// 暴露给全局，但只有在启用时才工作
if (typeof window !== 'undefined') {
    window.LayerManager = LayerManager;
    window.isLayerManagementAvailable = isLayerManagementAvailable;
    window.layerCoreManager = layerCoreManager;
}

// ==================== 对外接口和兼容性 ====================

// 注意：由于篇幅限制，这里只包含了核心类和基本功能
// 其他复杂类（LayerListManager, LayerOrderController, LayerVisibilityController, TransformControls）
// 将在后续更新中添加，或者需要时可以从原始文件中导入


/**
 * Visual Prompt Editor - 图层管理模块 (新功能)
 * 独立模块，不影响现有功能
 * 
 * 功能：
 * - 背景图层 + 3个可调整图层
 * - 图层位置和大小调整
 * - 图层显示/隐藏控制
 * - 与现有标注系统兼容
 */

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
        
        // 创建背景图层
        this.backgroundLayer = {
            id: 'background',
            name: '背景',
            type: 'background',
            visible: true,
            locked: true,
            opacity: 1.0,
            zIndex: 0
        };
        
        // 创建3个用户图层
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
    
    // 设置超时清理防抖标记
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
        // 使用layerOrderController模块中的实现
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

// 暴露给全局，但只有在启用时才工作
if (typeof window !== 'undefined') {
    window.LayerManager = LayerManager;
    window.isLayerManagementAvailable = isLayerManagementAvailable;
}


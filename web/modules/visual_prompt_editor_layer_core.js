/**
 * Layer Core Management Module
 * 图层核心管理模块 - 统一图层管理接口，消除重复代码
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
     * @param {Element} modal - 模态框元素
     * @returns {Object} 图层相关元素的访问器对象
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
     * 消除updateLayersListDisplay等函数的重复逻辑
     * @param {Element} modal - 模态框元素
     * @param {Array} layers - 图层数据数组
     * @param {Object} options - 更新选项
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

    /**
     * 创建统一的图层事件处理器
     * 消除重复的事件绑定模式
     * @param {Element} modal - 模态框元素
     * @param {string} eventType - 事件类型 (visibility, order, transform)
     * @param {function} handler - 事件处理函数
     * @param {Object} options - 事件选项
     */
    createLayerEventHandler(modal, eventType, handler, options = {}) {
        const {
            debounceDelay = 100,
            preventDefault = true,
            stopPropagation = false,
            logEvents = false
        } = options;

        // 创建防抖的事件处理器
        const debouncedHandler = this.debounce(handler, debounceDelay);

        return function(e) {
            // 检查是否是目标元素
            const targetSelector = `.layer-${eventType}-btn, [data-layer-${eventType}]`;
            if (!e.target.matches(targetSelector) && !e.target.closest(targetSelector)) {
                return;
            }

            if (preventDefault) e.preventDefault();
            if (stopPropagation) e.stopPropagation();

            if (logEvents) {
                console.log(`🔧 图层${eventType}事件触发:`, e.target.dataset);
            }

            // 获取图层相关数据
            const layerId = e.target.dataset.layerId || 
                           e.target.closest('[data-layer-id]')?.dataset.layerId;
            const layerType = e.target.dataset.layerType || 
                             e.target.closest('[data-layer-type]')?.dataset.layerType;

            // 调用防抖处理器
            debouncedHandler.call(this, {
                originalEvent: e,
                layerId,
                layerType,
                modal,
                target: e.target
            });
        };
    }

    /**
     * 批量绑定图层事件
     * 统一管理图层相关的所有事件绑定
     * @param {Element} modal - 模态框元素
     * @param {Object} eventConfig - 事件配置对象
     */
    bindLayerEvents(modal, eventConfig) {
        const elements = this.getLayerElements(modal);
        if (!elements) {
            console.warn('❌ LayerCoreManager: 无法绑定图层事件，元素获取失败');
            return false;
        }

        // 清理之前的事件绑定
        this.cleanupModalEvents(modal);

        const cleanupFunctions = [];

        try {
            Object.entries(eventConfig).forEach(([eventType, config]) => {
                const {
                    container = elements.layersList,
                    domEvent = 'click',
                    handler,
                    options = {}
                } = config;

                if (!handler || typeof handler !== 'function') {
                    console.warn(`❌ LayerCoreManager: ${eventType}事件处理器无效`);
                    return;
                }

                // 创建统一的事件处理器
                const unifiedHandler = this.createLayerEventHandler(
                    modal, eventType, handler, options
                );

                // 绑定事件
                const targetContainer = typeof container === 'function' ? container() : container;
                if (targetContainer) {
                    const cleanup = bindEvent(targetContainer, domEvent, unifiedHandler);
                    cleanupFunctions.push(cleanup);
                    
                    console.log(`✅ LayerCoreManager: 已绑定${eventType}事件到`, targetContainer.tagName);
                }
            });

            // 保存清理函数
            const modalId = modal.id || 'default';
            this.eventCleanupFunctions.set(modalId, cleanupFunctions);

            console.log(`✅ LayerCoreManager: 已绑定${cleanupFunctions.length}个图层事件`);
            return true;

        } catch (error) {
            console.error('❌ LayerCoreManager: 图层事件绑定失败:', error);
            // 清理已绑定的事件
            cleanupFunctions.forEach(cleanup => cleanup && cleanup());
            return false;
        }
    }

    /**
     * 创建图层画布显示元素
     * 统一的图层显示元素创建逻辑
     * @param {Element} container - 容器元素
     * @param {Object} layer - 图层数据
     * @param {Object} options - 创建选项
     */
    createLayerDisplayElement(container, layer, options = {}) {
        const {
            finalScale = 1,
            zIndex = 1,
            interactive = false,
            logCreation = false
        } = options;

        if (!container || !layer) {
            console.warn('❌ LayerCoreManager: 容器或图层数据无效');
            return null;
        }

        try {
            // 使用DOMFactory创建图层元素
            const layerElement = DOMFactory.createLayerElement(layer, {
                finalScale,
                zIndex
            });

            // 添加交互能力
            if (interactive) {
                layerElement.style.pointerEvents = 'auto';
                layerElement.classList.add('interactive-layer');
            }

            // 添加到容器
            container.appendChild(layerElement);

            if (logCreation) {
                console.log(`🎨 LayerCoreManager: 已创建图层显示元素:`, layer.id);
            }

            return layerElement;

        } catch (error) {
            console.error('❌ LayerCoreManager: 创建图层显示元素失败:', error);
            return null;
        }
    }

    /**
     * 防抖功能
     * 统一的防抖逻辑，避免重复实现
     * @param {function} func - 要防抖的函数
     * @param {number} delay - 延迟时间(ms)
     * @returns {function} 防抖后的函数
     */
    debounce(func, delay = 300) {
        const funcId = func.toString().slice(0, 50); // 函数标识
        
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
     * 统一的防重复更新逻辑
     * @param {Element} modal - 模态框元素
     * @param {string} operationType - 操作类型
     * @param {number} minInterval - 最小间隔时间(ms)
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
     * 统一的图层操作日志记录
     * @param {string} operation - 操作类型
     * @param {*} details - 详细信息
     * @param {'info'|'success'|'warn'|'error'} level - 日志级别
     */
    logLayerOperation(operation, details, level = 'info') {
        const prefix = {
            info: '📝',
            success: '✅',
            warn: '⚠️',
            error: '❌'
        }[level] || '📝';

        const message = `${prefix} LayerCoreManager: ${operation}`;
        
        switch (level) {
            case 'success':
                console.log(message, details);
                break;
            case 'warn':
                console.warn(message, details);
                break;
            case 'error':
                console.error(message, details);
                break;
            default:
                console.log(message, details);
        }
    }

    /**
     * 清理模态框相关的事件绑定
     * @param {Element} modal - 模态框元素
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

    // ==================== 私有方法 ====================

    /**
     * 完整图层显示更新
     * @private
     */
    _fullLayerDisplayUpdate(elements, layers, logOperation) {
        // 清理现有内容
        if (elements.layersList()) {
            elements.layersList().innerHTML = '';
        }
        if (elements.layersDisplayContainer()) {
            elements.layersDisplayContainer().innerHTML = '';
        }

        // 重建图层显示
        const success = this._rebuildLayerDisplay(elements, layers);
        
        if (logOperation) {
            this.logLayerOperation(
                '完整图层显示更新', 
                { layersCount: layers?.length || 0, success }, 
                success ? 'success' : 'error'
            );
        }
        
        return success;
    }

    /**
     * 画布图层显示更新
     * @private
     */
    _canvasLayerDisplayUpdate(elements, layers, logOperation) {
        const container = elements.layersDisplayContainer();
        if (!container) return false;

        // 清理画布图层容器
        container.innerHTML = '';

        // 重建画布图层
        let successCount = 0;
        layers?.forEach((layer, index) => {
            if (this.createLayerDisplayElement(container, layer, { 
                zIndex: layers.length - index,
                logCreation: false 
            })) {
                successCount++;
            }
        });

        const success = successCount === (layers?.length || 0);
        
        if (logOperation) {
            this.logLayerOperation(
                '画布图层显示更新', 
                { total: layers?.length || 0, success: successCount }, 
                success ? 'success' : 'warn'
            );
        }
        
        return success;
    }

    /**
     * 列表图层显示更新
     * @private
     */
    _listLayerDisplayUpdate(elements, layers, logOperation) {
        const layersList = elements.layersList();
        if (!layersList) return false;

        // 清理列表容器
        layersList.innerHTML = '';

        // 重建图层列表项
        let successCount = 0;
        layers?.forEach(layer => {
            try {
                const listItem = this._createLayerListItem(layer);
                if (listItem) {
                    layersList.appendChild(listItem);
                    successCount++;
                }
            } catch (error) {
                console.warn('⚠️ LayerCoreManager: 创建图层列表项失败:', error);
            }
        });

        const success = successCount === (layers?.length || 0);
        
        if (logOperation) {
            this.logLayerOperation(
                '列表图层显示更新', 
                { total: layers?.length || 0, success: successCount }, 
                success ? 'success' : 'warn'
            );
        }
        
        return success;
    }

    /**
     * 重建图层显示
     * @private
     */
    _rebuildLayerDisplay(elements, layers) {
        if (!layers || layers.length === 0) {
            console.log('📝 LayerCoreManager: 没有图层需要显示');
            return true;
        }

        try {
            // 同时重建列表和画布显示
            const listSuccess = this._listLayerDisplayUpdate(elements, layers, false);
            const canvasSuccess = this._canvasLayerDisplayUpdate(elements, layers, false);
            
            return listSuccess && canvasSuccess;
        } catch (error) {
            console.error('❌ LayerCoreManager: 重建图层显示失败:', error);
            return false;
        }
    }

    /**
     * 创建图层列表项
     * @private
     */
    _createLayerListItem(layer) {
        return DOMFactory.createButton(
            layer.name || `Layer ${layer.id}`,
            null, // 点击事件由外部事件委托处理
            {
                className: 'vpe-layer-item',
                id: `layer-item-${layer.id}`,
                style: {
                    width: '100%',
                    textAlign: 'left',
                    opacity: layer.visible !== false ? '1' : '0.5'
                }
            }
        );
    }
}

// 创建全局单例实例
export const layerCoreManager = new LayerCoreManager();

// 便捷函数导出
export const getLayerElements = (modal) => layerCoreManager.getLayerElements(modal);
export const updateLayerDisplay = (modal, layers, options) => 
    layerCoreManager.updateLayerDisplay(modal, layers, options);
export const bindLayerEvents = (modal, eventConfig) => 
    layerCoreManager.bindLayerEvents(modal, eventConfig);
export const createLayerEventHandler = (modal, eventType, handler, options) =>
    layerCoreManager.createLayerEventHandler(modal, eventType, handler, options);
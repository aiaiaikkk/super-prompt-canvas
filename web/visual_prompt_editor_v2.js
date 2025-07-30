/**
 * Visual Prompt Editor - 主入口文件 (模块化版本)
 * 可视化提示词编辑器统一前端 - 重构为模块化架构
 * 
 * 核心功能：双击打开模态弹窗，左侧图形标注区，右侧结构化提示词编辑区
 * 
 * 🆕 VERSION: 2025-01-20-15:35 - 修复addAnnotationToSVGWithGrouping调用问题
 */

import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

// 导入模块
import { KontextUtils, getImageFromWidget } from './modules/visual_prompt_editor_utils.js';
import { COLORS, TIMING } from './modules/visual_prompt_editor_constants.js';
import { 
    DOMFactory, 
    StyleManager, 
    EventManager
} from './modules/shared/dom_helpers.js';

import { 
    createMainModal, 
    createTitleBar, 
    createToolbar, 
    createMainArea, 
    createCanvasArea, 
    createPromptArea,
    showControlInfo,
    initializeTabSwitching,
    createLayerListItem,
    loadLayersToPanel
} from './modules/visual_prompt_editor_ui.js';
import { 
    bindPromptEvents, 
    showPromptQualityAnalysis,
    exportPromptData
} from './modules/visual_prompt_editor_prompts.js';
import { 
    initializeLanguageSystem,
    updateCompleteUI
} from './modules/visual_prompt_editor_language.js';
import { updateAllUITexts, t } from './modules/visual_prompt_editor_i18n.js';
import { 
    LayerManager, 
    LAYER_MANAGEMENT_ENABLED,
    isLayerManagementAvailable,
    swapAdjacentLayers
} from './modules/visual_prompt_editor_layer_management.js';
// Layer system imports removed - using Fabric.js native layer management
import { 
    createEventHandlers
} from './modules/visual_prompt_editor_event_handlers.js';
import { 
    createDataManager,
    callStandardUpdateObjectSelector,
    updateDropdownAfterRestore
} from './modules/visual_prompt_editor_data_manager.js';
import { 
    createSVG 
} from './modules/visual_prompt_editor_dom_utils.js';
import { 
    getImageFromLoadImageNode,
    tryGetImageFromNode,
    processLayerImageFile,
    loadImageForLayer,
    openLayerImageDialog
} from './modules/visual_prompt_editor_file_manager.js';
import { 
    createUnifiedModal,
    initModalFunctionality
    // initializeIntegratedLayerSystem - removed as function doesn't exist
} from './modules/visual_prompt_editor_modal_core.js';

// 导入共享工具模块
import { 
    createModalElementsCache,
    setElementStyles,
    COMMON_STYLES,
    bindEvent,
    bindEvents,
    createElement,
    safeDOMOperation
} from './modules/shared/dom_helpers.js';
import { 
    withErrorHandling,
    domErrorHandler,
    validationErrorHandler,
    logger,
    LOG_LEVELS,
    ERROR_TYPES
} from './modules/shared/error_helpers.js';

// 安全的翻译函数包装器 - 使用共享错误处理
const safeT = (key, fallback) => {
    return withErrorHandling(() => {
        if (typeof t === 'function') {
            const result = t(key);
            return result !== key ? result : (fallback || key);
        }
        return fallback || key;
    }, {
        fallbackValue: fallback || key,
        errorType: ERROR_TYPES.I18N_ERROR,
        onError: (error) => logger(LOG_LEVELS.WARN, `Translation error for key: ${key}`, { error: error.message })
    });
};

// 错误处理函数
function handleError(message, error = null) {
    console.error(`❌ ${message}`, error || '');
    if (error) {
        logger(LOG_LEVELS.ERROR, message, { error: error.message || error });
    } else {
        logger(LOG_LEVELS.ERROR, message);
    }
}

// 模态弹窗清理函数
function cleanupModal(modal, nodeInstance) {
    try {
        // 保存Fabric.js画布数据（确保关闭时数据持久化）
        if (nodeInstance && nodeInstance.fabricManager) {
            try {
                nodeInstance.fabricManager.saveCanvasData();
            } catch (saveError) {
                console.error('❌ 保存画布数据时出错:', saveError);
            }
        }
        
        // 清理Fabric.js画布
        if (nodeInstance && nodeInstance.fabricManager) {
            if (nodeInstance.fabricManager.fabricCanvas) {
                // 清除所有对象
                nodeInstance.fabricManager.fabricCanvas.clear();
                // 停止动画和渲染
                nodeInstance.fabricManager.fabricCanvas.dispose();
                nodeInstance.fabricManager.fabricCanvas = null;
            }
            nodeInstance.fabricManager = null;
        }
        
        // 1. 立即清理模态弹窗内的canvas
        if (modal) {
            const modalCanvases = modal.querySelectorAll('canvas');
            modalCanvases.forEach(canvas => {
                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
            });
        }
        
        // 2. 强制清理所有可能的fabric相关canvas（扩展搜索）
        const allCanvases = document.querySelectorAll('canvas[id*="fabric"], canvas[id*="pure"], #fabric-main-canvas, canvas[class*="fabric"], canvas[data-fabric]');
        allCanvases.forEach(canvas => {
            try {
                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
            } catch (e) {
                // 清理失败，忽略
            }
        });
        
        // 3. 清理可能残留的容器（扩展清理）
        const fabricContainers = document.querySelectorAll('#fabric-pure-interface, #fabric-canvas-container, #canvas-area, #layer-panel, [id*="fabric"], [class*="fabric"]');
        fabricContainers.forEach(container => {
            try {
                if (container.parentNode && container !== document.body && container !== document.documentElement) {
                    container.parentNode.removeChild(container);
                }
            } catch (e) {
                // 清理失败，忽略
            }
        });
        
        // 4. 特别检查ComfyUI主界面区域
        const comfyAreas = document.querySelectorAll('#app, #graph-canvas, #comfy-ui-app, .litegraph');
        comfyAreas.forEach(area => {
            const orphanCanvases = area.querySelectorAll('canvas[id*="fabric"], canvas[style*="position: fixed"], canvas[style*="z-index: 9999"]');
            orphanCanvases.forEach(canvas => {
                try {
                    if (canvas.parentNode) {
                        canvas.parentNode.removeChild(canvas);
                    }
                } catch (e) {
                    // 清理失败，忽略
                }
            });
        });
        
        // 5. 清理全局引用
        if (window.currentVPENode === nodeInstance) {
            window.currentVPENode = null;
        }
        if (window.currentVPEInstance === nodeInstance) {
            window.currentVPEInstance = null;
        }
        
        // 6. 清理节点实例中的modal引用
        if (nodeInstance) {
            nodeInstance.modal = null;
        }
        
        // 7. 移除模态弹窗
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
        
        // 8. 多重延迟清理确保完全清除
        setTimeout(() => {
            const remainingCanvases = document.querySelectorAll('canvas');
            remainingCanvases.forEach(canvas => {
                const shouldRemove = 
                    (canvas.id && (canvas.id.includes('fabric') || canvas.id.includes('pure'))) ||
                    (canvas.className && canvas.className.includes('fabric')) ||
                    canvas.style.cssText.includes('position: fixed') ||
                    canvas.style.cssText.includes('z-index: 9999') ||
                    (canvas.parentNode && canvas.parentNode.id && canvas.parentNode.id.includes('fabric'));
                    
                if (shouldRemove) {
                    try {
                        if (canvas.parentNode) {
                            canvas.parentNode.removeChild(canvas);
                        }
                    } catch (e) {
                        // 清理失败，忽略
                    }
                }
            });
        }, 100);
        
        setTimeout(() => {
            const finalCleanup = document.querySelectorAll('canvas[id*="fabric"], canvas[id*="pure"], canvas[style*="position: fixed"]');
            finalCleanup.forEach(canvas => {
                try {
                    if (canvas.parentNode) {
                        canvas.parentNode.removeChild(canvas);
                    }
                } catch (e) {
                    // 清理失败，忽略
                }
            });
        }, 300);
        
    } catch (error) {
        console.error('❌ 模态弹窗清理失败:', error);
        // 终极暴力清理
        try {
            // 移除模态弹窗
            if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            
            // 暴力清理所有可疑canvas
            const allCanvases = document.querySelectorAll('canvas');
            allCanvases.forEach(canvas => {
                const shouldRemove = 
                    (canvas.id && (canvas.id.includes('fabric') || canvas.id.includes('pure') || canvas.id.includes('test'))) ||
                    canvas.style.cssText.includes('position: fixed') ||
                    canvas.style.cssText.includes('z-index: 9999');
                    
                if (shouldRemove) {
                    try {
                        if (canvas.parentNode) {
                            canvas.parentNode.removeChild(canvas);
                        }
                    } catch (e) {
                        // 忽略清理错误
                    }
                }
            });
        } catch (e) {
            console.error('❌ 终极清理失败:', e);
        }
    }
}

app.registerExtension({
    name: "Kontext.VisualPromptEditor.V2",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "VisualPromptEditor") {
            
            try {
            
            // 添加节点创建时的回调
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                
                // 设置节点样式
                this.color = COLORS.NODE_COLOR;
                this.bgcolor = COLORS.NODE_BG_COLOR;
                
                // 清理的节点状态显示
                this.addWidget("text", "editor_status", "Visual Editor Ready", () => {}, {
                    serialize: false
                });
                
                // 监听双击事件
                const originalOnDblClick = this.onDblClick;
                
                this.onDblClick = function(event) {
                    
                    // 调试：检查关键函数是否可用
                    try {
                    } catch (debugError) {
                        console.error("❌ Debug check failed:", debugError);
                    }
                    
                    // 阻止默认行为
                    if (event) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    
                    // 打开我们的编辑器
                    try {
                        this.openUnifiedEditor();
                    } catch (error) {
                        console.error("❌ Error calling openUnifiedEditor:", error);
                        alert("Failed to open editor: " + error.message);
                    }
                    
                    // 返回false阻止默认双击行为
                    return false;
                };
                
                return r;
            };
            
            // 添加执行后回调
            const onExecuted = nodeType.prototype.onExecuted;
            nodeType.prototype.onExecuted = function(message) {
                const r = onExecuted ? onExecuted.apply(this, arguments) : undefined;
                
                // 更新状态显示
                const statusWidget = this.widgets.find(w => w.name === "editor_status");
                const qualityWidget = this.widgets.find(w => w.name === "prompt_quality");
                const countWidget = this.widgets.find(w => w.name === "selected_count");
                
                if (message && message.text) {
                    if (statusWidget) statusWidget.value = "✅ Processing complete (V2)";
                    
                    try {
                        // 解析编辑元数据
                        const metadataStr = Array.isArray(message.text) ? message.text[5] : message.text;
                        const metadata = JSON.parse(metadataStr);
                        
                        // 更新提示词质量显示
                        if (qualityWidget && metadata.prompt_analysis) {
                            const score = metadata.prompt_analysis.score;
                            qualityWidget.value = `Quality: ${score.toFixed(1)}/100 (${metadata.prompt_analysis.grade})`;
                        }
                        
                        // 更新选中对象计数
                        if (countWidget) {
                            countWidget.value = `${metadata.selected_count} ${safeT('selected_count', 'selected')}`;
                        }
                        
                    } catch (e) {
                    }
                }
                
                return r;
            };
            
            
            
            // 添加右键菜单选项
            const getExtraMenuOptions = nodeType.prototype.getExtraMenuOptions;
            nodeType.prototype.getExtraMenuOptions = function(_, options) {
                const r = getExtraMenuOptions ? getExtraMenuOptions.apply(this, arguments) : undefined;
                
                options.push({
                    content: "🎨 Open Visual Prompt Editor (V2)",
                    callback: () => {
                        this.openUnifiedEditor();
                    }
                });
                
                options.push({
                    content: "📊 Export Prompt Data",
                    callback: () => {
                        this.exportCurrentPromptData();
                    }
                });
                
                return r;
            };
            
            // 核心功能：打开统一编辑器
            // 通用懒加载辅助方法
            nodeType.prototype.ensureController = function(controllerName, createFunction) {
                if (!this[controllerName]) {
                    try {
                        this[controllerName] = createFunction(this);
                    } catch (error) {
                        handleError(`懒加载${controllerName}`, error);
                        return false;
                    }
                }
                return true;
            };
            
            // 确保图层管理模块（需要两个依赖模块）
            nodeType.prototype.ensureLayerManagement = function() {
                if (!this.layerListManager) {
                    try {
                        this.layerSystemCore = createLayerSystemCore(this);
                        // Layer list manager removed - using Fabric.js objects
                    } catch (error) {
                        handleError('懒加载图层管理模块', error);
                        return false;
                    }
                }
                return true;
            };
            
            // 确保变换控制模块
            nodeType.prototype.ensureTransformControls = function() {
                if (!this.transformControls) {
                    try {
                        // this.transformControls = createTransformControls(this); // 临时注释，模块不存在
                    } catch (error) {
                        handleError('懒加载变换控制模块', error);
                        return null;
                    }
                }
                return this.transformControls;
            };
            
            nodeType.prototype.openUnifiedEditor = async function() {
                
                // 尝试多种方式获取输入数据
                let imageData = null;
                let layersData = null;
                
                try {
                    // 方法1：从输入连接获取
                    if (this.inputs && this.inputs.length > 0) {
                        const imageInput = this.inputs[0];
                        const layersInput = this.inputs[1];
                        
                        if (imageInput && imageInput.link) {
                            // 尝试通过链接追踪获取图像数据
                            const linkId = imageInput.link;
                            const graph = app.graph;
                            
                            
                            if (graph && graph.links && graph.links[linkId]) {
                                const link = graph.links[linkId];
                                const sourceNode = graph.getNodeById(link.origin_id);
                                
                                if (sourceNode) {
                                    // 尝试获取LoadImage节点的图像
                                    if (sourceNode.type === 'LoadImage') {
                                        imageData = getImageFromLoadImageNode(sourceNode);
                                    } else {
                                        // 尝试从其他节点获取
                                        imageData = tryGetImageFromNode(sourceNode);
                                    }
                                }
                            }
                        }
                        if (layersInput && layersInput.link) {
                            layersData = this.getInputData(1);
                        }
                    }
                    
                    // 方法2：从widget获取
                    if (!imageData || (typeof imageData === 'object' && Object.keys(imageData).length === 0)) {
                        imageData = getImageFromWidget(this);
                    } else {
                    }
                    
                } catch (e) {
                }
                
                // 方法3：从节点widget加载已保存的annotation数据（用于持久化）
                try {
                    const savedData = this.dataManager.loadAnnotationData();
                    if (savedData) {
                        
                        if (savedData && savedData.annotations && savedData.annotations.length > 0) {
                            layersData = savedData.annotations;
                            
                            // 详细检查每个annotation的结构并修复数据
                            layersData = layersData.map((annotation, index) => {
                                // 修复annotation数据结构
                                const fixedAnnotation = this.dataManager.normalizeAnnotationData(annotation);
                                return fixedAnnotation;
                            });
                            
                        }
                    } else {
                    }
                } catch (e) {
                }
                
                // 创建模态弹窗
                
                try {
                    const modal = createUnifiedModal(imageData, layersData, this);
                    
                    if (modal) {
                        // 创建模态框元素缓存以减少重复DOM查询
                        const elements = createModalElementsCache(modal);
                        
                        // 初始化画布
                        const zoomContainer = elements.zoomContainer();
                        if (zoomContainer) {
                            const imageCanvas = createElement('div', {
                                id: 'image-canvas',
                                style: 'position: relative; display: inline-block;'
                            });
                            zoomContainer.appendChild(imageCanvas);
                            
                            // 图像渲染现在由Fabric.js管理器处理
                        }
                        
                        // 显示控制信息
                        showControlInfo(modal);
                        
                        // 初始化功能模块
                        await initModalFunctionality(modal, layersData, this);
                        
                        // 在模态框完全初始化后初始化缩放和拖拽控制
                        // 缩放控制已集成到Fabric.js管理器中
                        
                        // 初始化变换控制器
                        if (this.ensureTransformControls()) {
                            this.transformControls.initializeTransformControls(modal);
                        }
                        
                    } else {
                        console.error('❌ Modal creation failed - no modal returned');
                    }
                } catch (error) {
                    console.error('❌ Error in createUnifiedModal:', error);
                }
            };
            
            
            
            

            
            
            // 🎨 设置图层画布显示系统
            nodeType.prototype.setupLayerCanvasDisplay = function(modal) {
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
                const layersDisplayContainer = DOMFactory.createLayerContainer('layers-display-container');
                
                // 安全地插入到image-canvas中（与drawing-layer同级）
                try {
                    const elements = modal.cachedElements || createModalElementsCache(modal);
                    const imageCanvas = elements.imageCanvas();
                    if (imageCanvas) {
                        const drawingLayer = imageCanvas.querySelector('#drawing-layer');
                        if (drawingLayer && drawingLayer.parentNode === imageCanvas) {
                            imageCanvas.insertBefore(layersDisplayContainer, drawingLayer);
                        } else {
                            imageCanvas.appendChild(layersDisplayContainer);
                        }
                    } else {
                        // 备用方案：添加到canvas-container
                        canvasContainer.appendChild(layersDisplayContainer);
                    }
                } catch (error) {
                    try {
                        canvasContainer.appendChild(layersDisplayContainer);
                    } catch (fallbackError) {
                        handleError(' 无法创建图层显示容器:', fallbackError.message);
                    }
                }
            };
            
            
            
            
            // 🎨 绑定图层可见性事件
            nodeType.prototype.bindLayerVisibilityEvents = function(modal) {
                
                // 使用事件委托绑定可见性按钮点击事件 - 使用缓存元素
                const elements = modal.cachedElements || createModalElementsCache(modal);
                const layersList = elements.layersList();
                if (!layersList) {
                    return;
                }
                
                // 移除现有的事件监听器（如果存在）
                if (layersList.visibilityEventsBound) {
                    return; // 已经绑定过，避免重复绑定
                }
                
                // 使用命名函数以便后续可以移除
                const visibilityClickHandler = (e) => {
                    // 检查是否是可见性按钮点击
                    if (e.target.classList.contains('layer-visibility-btn')) {
                        e.stopPropagation();
                        e.preventDefault(); // 防止意外的默认行为
                        
                        const layerId = e.target.getAttribute('data-layer-id');
                        const layerType = e.target.getAttribute('data-layer-type');
                        
                        
                        // 防抖：检查是否在短时间内重复点击
                        const now = Date.now();
                        if (!this._lastClickTime) this._lastClickTime = {};
                        if (this._lastClickTime[layerId] && (now - this._lastClickTime[layerId]) < 300) {
                            return;
                        }
                        this._lastClickTime[layerId] = now;
                        
                        // 切换可见性状态
                        this.toggleLayerVisibility(modal, layerId, layerType, e.target);
                    }
                };
                
                bindEvent(layersList, 'click', visibilityClickHandler);
                layersList._visibilityClickHandler = visibilityClickHandler;
                
                // 标记已绑定事件
                layersList.visibilityEventsBound = true;
            };
            
            
            
            
            
            
            // 🎨 图层顺序调整功能
            
            // 绑定图层顺序调整事件 - 委托给图层顺序控制模块
            nodeType.prototype.bindLayerOrderEvents = function(modal) {
                if (this.layerOrderController) {
                    this.layerOrderController.bindLayerOrderEvents(modal);
                } else {
                    handleError('layerOrderController未初始化，无法绑定图层顺序事件');
                }
            };
            
            
            
            // 激活图层自由变换模式
            nodeType.prototype.activateLayerTransform = function(modal, layerId, layerType) {
                
                try {
                    // 使用变换控制模块启动变换（包含完整的操作框功能）
                    const transformControls = this.ensureTransformControls();
                    
                    if (!transformControls) {
                        console.error(`❌ [MAIN] TransformControls实例获取失败`);
                        return;
                    }
                    
                    if (typeof transformControls.activateLayerTransform !== 'function') {
                        console.error(`❌ [MAIN] activateLayerTransform方法不存在`, transformControls);
                        return;
                    }
                    
                    transformControls.activateLayerTransform(modal, layerId, layerType, this);
                    
                } catch (error) {
                    console.error(`❌ [MAIN] 激活变换模式失败:`, error);
                }
            };
            
            
            
            // 交换相邻图层 - 委托给layer_management模块
            nodeType.prototype.swapAdjacentLayers = function(modal, layerId1, layerId2, retryCount = 0) {
                swapAdjacentLayers(modal, layerId1, layerId2, this, retryCount);
            };
            
            
            // 重新排序图层 - 委托给图层顺序控制模块（懒加载）
            nodeType.prototype.reorderLayers = function(modal, draggedLayerId, targetLayerId) {
                if (!this.ensureController('layerOrderController', createLayerOrderController)) return;
                this.layerOrderController.reorderLayers(modal, draggedLayerId, targetLayerId);
            };
            
            // 获取所有图层按当前顺序 - 委托给图层顺序控制模块（懒加载）
            nodeType.prototype.getAllLayersInOrder = function(modal) {
                if (!this.ensureController('layerOrderController', createLayerOrderController)) return [];
                return this.layerOrderController.getAllLayersInOrder(modal);
            };
            
            
            // 更新图层Z-index - 委托给图层顺序控制模块（懒加载）
            nodeType.prototype.updateLayersZIndex = function(modal, orderedLayers) {
                if (!this.ensureController('layerOrderController', createLayerOrderController)) return;
                this.layerOrderController.updateLayersZIndex(modal, orderedLayers);
            };
            
            // 更新图层面板显示 - 使用模块化接口
            nodeType.prototype.updateLayersListDisplay = function(modal, orderedLayers = null) {
                // 如果没有提供排序后的图层，则获取当前图层顺序
                let allLayers = orderedLayers;
                if (!allLayers) {
                    allLayers = this.getAllLayersInOrder(modal);
                }
                
                // 使用统一的图层显示更新接口
                const success = updateLayerDisplay(modal, allLayers, {
                    updateType: 'list',
                    preventDuplicate: true,
                    logOperation: true
                });
                
                if (success) {
                    // 重新绑定事件 - 避免异步竞争条件
                    this.bindLayerEvents(modal);
                }
            };
            
            // 绑定图层事件 - 统一入口
            nodeType.prototype.bindLayerEvents = function(modal) {
                
                // 绑定图层可见性控制
                if (typeof this.bindLayerVisibilityEvents === 'function') {
                    this.bindLayerVisibilityEvents(modal);
                }
                
                // 绑定图层排序事件（拖拽和上下移动按钮）
                if (typeof this.bindLayerOrderEvents === 'function') {
                    this.bindLayerOrderEvents(modal);
                }
                
            };
            
            // 调试DOM结构
            nodeType.prototype.debugDOMStructure = function(modal) {
                
                const canvasContainer = modal.querySelector('#canvas-container');
                if (!canvasContainer) {
                    return;
                }
                
                const imageCanvas = modal.querySelector('#image-canvas');
                
                if (imageCanvas) {
                    
                    // 显示image-canvas的子元素
                    Array.from(imageCanvas.children).forEach((child, index) => {
                        const computedStyle = window.getComputedStyle(child);
                        
                        // 如果是layers-display-container，显示其子元素
                        if (child.id === 'layers-display-container') {
                            Array.from(child.children).forEach((layer, layerIndex) => {
                                const layerStyle = window.getComputedStyle(layer);
                            });
                        }
                    });
                    
                    // 检查image-canvas中的所有标注容器
                    const annotationContainers = imageCanvas.querySelectorAll('[id^="annotation-svg-"]');
                    annotationContainers.forEach(container => {
                        const style = window.getComputedStyle(container);
                    });
                } else {
                }
            };
            
            // Z-index management using Fabric.js native methods
            
            
            
            
            // 添加标注到独立SVG容器并自动分组 - 新版本
            // 添加标注到SVG并创建独立容器 - 已迁移到SVG模块
            nodeType.prototype.addAnnotationToSVGWithGrouping = function(svg, annotationElement, annotationId) {
                return addAnnotationToSVGWithGrouping(svg, annotationElement, annotationId, this);
            };
            
            
            // 刷新图层列表显示 - 委托给图层列表管理模块（懒加载）
            nodeType.prototype.refreshLayersList = function(modal) {
                if (!this.ensureLayerManagement()) return;
                // 默认显示所有图层（连接图层+标注图层）
                this.layerListManager.updateIntegratedLayersList(modal);
            };
            
            // 确保所有标注都在独立的SVG容器中
            nodeType.prototype.ensureAnnotationsInIndependentContainers = function(modal) {
                if (!modal.annotations) return;
                
                
                // 获取当前所有图层来计算正确的z-index
                const allLayers = this.getAllLayersInOrder(modal);
                
                modal.annotations.forEach(annotation => {
                    // 等待标注组被创建后再转移
                    setTimeout(() => {
                        // 找到这个标注在图层列表中的位置
                        const layerIndex = allLayers.findIndex(l => l.id === annotation.id);
                        const baseZIndex = 100;
                        // 根据位置计算z-index，如果找不到则使用默认值
                        const zIndex = layerIndex >= 0 ? 
                            baseZIndex + (allLayers.length - layerIndex) : 
                            baseZIndex + allLayers.length + 1;
                        
                        // 使用图层顺序控制器来设置Z-index
                        if (this.layerOrderController) {
                            this.layerOrderController.updateAnnotationZIndex(modal, annotation.id, zIndex);
                        } else {
                        }
                    }, 100); // 给标注组创建一些时间
                });
            };
            
            
            // 🎨 图层顺序状态管理
            
            // 获取当前的有序图层列表 - 用于新标注z-index计算
            nodeType.prototype.getCurrentOrderedLayers = function(modal) {
                if (!modal.layerOrderStates || !modal.layerOrderStates.has('currentOrder')) {
                    // 如果没有保存的状态，返回空数组
                    return [];
                }
                
                const orderData = modal.layerOrderStates.get('currentOrder');
                return orderData || [];
            };
            
            // 保存图层顺序状态
            nodeType.prototype.saveLayerOrder = function(modal, orderedLayers) {
                if (!modal.layerOrderStates) {
                    modal.layerOrderStates = new Map();
                }
                
                const orderData = orderedLayers.map((layer, index) => ({
                    id: layer.id,
                    type: layer.type,
                    order: index,
                    zIndex: index
                }));
                
                modal.layerOrderStates.set('currentOrder', orderData);
            };
            
            // 恢复图层顺序状态
            nodeType.prototype.restoreLayerOrder = function(modal) {
                if (!modal.layerOrderStates || !modal.layerOrderStates.has('currentOrder')) {
                    return false;
                }
                
                const orderData = modal.layerOrderStates.get('currentOrder');
                
                try {
                    // 重新构建图层数组
                    const restoredLayers = [];
                    
                    orderData.forEach(orderItem => {
                        if (orderItem.type === 'FABRIC_OBJECT') {
                            // Handle Fabric object ordering
                            if (layer) {
                                restoredLayers.push({...layer, type: 'IMAGE_LAYER'});
                            }
                        } else if (orderItem.type === 'ANNOTATION' && modal.annotations) {
                            const annotation = modal.annotations.find(a => a.id === orderItem.id);
                            if (annotation) {
                                restoredLayers.push({...annotation, type: 'ANNOTATION'});
                            }
                        }
                    });
                    
                    if (restoredLayers.length > 0) {
                        // 更新图层数据顺序 - 委托给模块
                        if (this.layerOrderController) {
                            this.layerOrderController.updateLayersOrder(modal, restoredLayers);
                        }
                        
                        // 更新Z-index
                        this.updateLayersZIndex(modal, restoredLayers);
                        
                        return true;
                    }
                } catch (error) {
                }
                
                return false;
            };
            
            // 获取图层顺序状态
            nodeType.prototype.getLayerOrderState = function(modal) {
                if (modal.layerOrderStates && modal.layerOrderStates.has('currentOrder')) {
                    return modal.layerOrderStates.get('currentOrder');
                }
                return null;
            };
            
            // 清除图层顺序状态
            nodeType.prototype.clearLayerOrderState = function(modal) {
                if (modal.layerOrderStates) {
                    modal.layerOrderStates.clear();
                }
            };
            
            // 🎨 更新画布图层显示
            nodeType.prototype.updateCanvasLayersDisplay = function(modal, enabled) {
                const layersContainer = modal.querySelector('#layers-display-container');
                if (!layersContainer) return;
                
                if (!enabled) {
                    // 隐藏所有图层
                    layersContainer.innerHTML = '';
                    return;
                }
                
                // 使用统一的画布图层显示更新接口
                if (modal.annotations && modal.annotations.length > 0) {
                    updateLayerDisplay(modal, modal.annotations, {
                        updateType: 'canvas',
                        preventDuplicate: false,
                        logOperation: true
                    });
                } else {
                    // 清空显示容器
                    layersContainer.innerHTML = '';
                }
            };
            
            // 🎨 创建画布图层显示
            nodeType.prototype.createCanvasLayerDisplay = function(container, layer, index) {
                // 获取modal引用
                const modal = container.closest('#unified-editor-modal');
                if (!modal) {
                    handleError('无法找到modal容器');
                    return;
                }
                
                
                // 获取连接的图像数据
                this.loadConnectedLayerImage(layer, (imageUrl) => {
                    
                    // 获取当前画布缩放值
                    const currentZoom = modal.currentZoom || 1.0;
                    const finalScale = layer.transform.scale * currentZoom;
                    
                    const totalLayers = modal.annotations ? modal.annotations.length : 0;
                    const zIndex = totalLayers - index;
                    
                    const layerElement = DOMFactory.createLayerElement(layer, { finalScale, zIndex });
                    
                    
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
                        // 🔧 修复undefined显示问题：确保图层名称有合理的回退值
                        const displayName = layer.name || layer.id || `Layer ${index + 1}` || 'Unknown Layer';
                        
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
                            ">
                                🖼️ ${displayName}<br>
                                <small>Loading...</small>
                            </div>
                        `;
                    }
                    
                    container.appendChild(layerElement);
                    
                    // 验证元素是否正确添加
                    const addedElement = container.querySelector(`#canvas-layer-${layer.id}`);
                    if (addedElement) {
                    } else {
                        console.error(`❌ 验证失败: 图层 ${layer.id} 不在容器中`);
                    }
                });
            };
            
            // 🎨 加载连接图层图像
            nodeType.prototype.loadConnectedLayerImage = function(layer, callback) {
                
                // 尝试从连接的节点获取图像
                try {
                    if (this.graph && layer.linkId) {
                        const link = this.graph.links[layer.linkId];
                        if (link) {
                            const sourceNode = this.graph.getNodeById(link.origin_id);
                            if (sourceNode) {
                                if (sourceNode.imgs && sourceNode.imgs.length > 0) {
                                    const imageUrl = sourceNode.imgs[0].src;
                                    callback(imageUrl);
                                    return;
                                } else {
                                }
                            } else {
                            }
                        } else {
                        }
                    } else {
                    }
                } catch (error) {
                }
                
                // 如果无法获取图像，返回null
                callback(null);
            };
            
            // 🎨 手动更新PS图层列表（保留兼容性）
            nodeType.prototype.manualUpdatePSLayers = function(modal) {
                
                const dynamicLayersContainer = modal.querySelector('#dynamic-ps-layers');
                const noLayersMessage = modal.querySelector('#no-ps-layers-message');
                
                if (!dynamicLayersContainer) return;
                
                // 检测连接的图层
                const connectedLayers = [];
                
                if (this.inputs) {
                    this.inputs.forEach((input, index) => {
                        
                        if (input.type === 'IMAGE' && input.link !== null && input.name !== 'image') {
                            let layerId = input.name;
                            // 标准化图层ID
                            if (!layerId.startsWith('layer_')) {
                                layerId = `layer_${connectedLayers.length + 1}`;
                            }
                            
                            connectedLayers.push({
                                id: layerId,
                                name: layerId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                connected: true,
                                originalName: input.name
                            });
                        }
                    });
                }
                
                // 清空现有动态图层
                dynamicLayersContainer.innerHTML = '';
                
                if (connectedLayers.length === 0) {
                    if (noLayersMessage) StyleManager.applyPreset(noLayersMessage, 'visible');
                } else {
                    if (noLayersMessage) StyleManager.applyPreset(noLayersMessage, 'hidden');
                    
                    connectedLayers.forEach(layer => {
                        const layerElement = document.createElement('div');
                        layerElement.className = 'ps-layer-item vpe-layer-item';
                        layerElement.setAttribute('data-layer', layer.id);
                        StyleManager.applyPreset(layerElement, 'layerItem', { borderBottom: '1px solid #444' });
                        
                        // 🔧 修复undefined显示问题：确保图层名称有合理的回退值
                        const displayName = layer.name || layer.id || `Layer ${connectedLayers.indexOf(layer) + 1}` || 'Unknown Layer';
                        
                        layerElement.innerHTML = `
                            <span class="layer-visibility" style="margin-right: 8px; cursor: pointer;">👁️</span>
                            <span style="flex: 1; color: white; font-size: 12px;">🔗 ${displayName}</span>
                            <span class="layer-opacity" style="color: #888; font-size: 10px;">100%</span>
                            <span style="color: #10b981; font-size: 9px; margin-left: 8px;">Connected</span>
                        `;
                        
                        dynamicLayersContainer.appendChild(layerElement);
                    });
                    
                }
            };
            
            // 🎨 处理Add Image按钮
            nodeType.prototype.handleAddLayerImage = function(modal) {
                
                // 创建文件输入
                const fileInput = createElement('input', {
                    type: 'file',
                    accept: 'image/*',
                    style: { display: 'none' }
                });
                
                bindEvent(fileInput, 'change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        
                        // 简单处理：创建一个新图层
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            // 图像加载完成，功能正在开发中
                        };
                        reader.readAsDataURL(file);
                    }
                });
                
                document.body.appendChild(fileInput);
                fileInput.click();
                document.body.removeChild(fileInput);
            };
            
            // 🎨 处理Draw按钮
            nodeType.prototype.handleDrawLayer = function(modal) {
                
                // 切换到画布标签页
                const canvasTab = modal.querySelector('[data-tab="canvas"]');
                if (canvasTab) {
                    canvasTab.click();
                }
                
                // 激活绘制工具
                const drawTool = modal.querySelector('[data-tool="rectangle"]');
                if (drawTool) {
                    // 安全地点击工具按钮
                    try {
                        drawTool.click();
                    } catch (error) {
                    }
                }
                
                // 绘制模式已激活
            };
            
            // ✅ 通用设置对话框创建函数 - 避免重复代码
            nodeType.prototype.createSettingsDialog = function(type = 'basic') {
                const settingsContent = type === 'advanced' ? `
                    <div style="margin-bottom: 16px;">
                        <label style="color: white; display: block; margin-bottom: 8px;">Default Layer Blend Mode:</label>
                        <select style="width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px;">
                            <option value="normal">Normal</option>
                            <option value="multiply">Multiply</option>
                            <option value="overlay">Overlay</option>
                            <option value="screen">Screen</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="color: white; display: block; margin-bottom: 8px;">Auto-save Layer Changes:</label>
                        <input type="checkbox" checked style="accent-color: #10b981;">
                        <span style="color: #ccc; margin-left: 8px;">Automatically apply changes</span>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="color: white; display: block; margin-bottom: 8px;">Maximum Layers:</label>
                        <input type="number" value="3" min="1" max="10" style="width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px;">
                    </div>` : `
                    <p style="color: #ccc; margin-bottom: 20px;">Configure layer management behavior and preferences.</p>
                    <div style="margin-bottom: 16px;">
                        <label style="color: white; display: block; margin-bottom: 8px;">Default Layer Blend Mode:</label>
                        <select style="width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px;">
                            <option value="normal">Normal</option>
                            <option value="multiply">Multiply</option>
                            <option value="overlay">Overlay</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="color: white; display: block; margin-bottom: 8px;">
                            <input type="checkbox" checked style="accent-color: #10b981; margin-right: 8px;">
                            Auto-detect connected layers
                        </label>
                    </div>`;

                const settingsDialog = `
                    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 30000; display: flex; justify-content: center; align-items: center;">
                        <div style="background: #2a2a2a; padding: 24px; border-radius: 12px; max-width: 400px; width: 90%;">
                            <h3 style="color: #10b981; margin: 0 0 16px 0;">🎨 Layer Management Settings</h3>
                            ${settingsContent}
                            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                                <button onclick="this.closest('div').parentElement.remove()" style="padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                                <button onclick="this.closest('div').parentElement.remove()" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">Apply</button>
                            </div>
                        </div>
                    </div>
                `;
                
                const settingsElement = document.createElement('div');
                settingsElement.innerHTML = settingsDialog;
                document.body.appendChild(settingsElement.firstElementChild);
            };

            // 🎨 处理Settings按钮 - 使用通用设置对话框创建函数
            nodeType.prototype.handleLayerSettings = function(modal) {
                this.createSettingsDialog('basic');
            };
            
            // 简单图标获取函数
            nodeType.prototype.getSimpleIcon = function(type) {
                const icons = {
                    'rectangle': '📐',
                    'circle': '⭕',
                    'arrow': '➡️',
                    'freehand': '🔗',
                    'brush': '🖌️'
                };
                return icons[type] || '⚪';
            };
            
            // 恢复后的图层选择切换
            nodeType.prototype.toggleLayerSelectionForRestore = function(modal, annotationId, isSelected) {
                if (!modal.selectedLayers) {
                    modal.selectedLayers = new Set();
                }
                
                if (isSelected) {
                    modal.selectedLayers.add(annotationId);
                } else {
                    modal.selectedLayers.delete(annotationId);
                }
                
                
                // 更新下拉框显示文本
                this.updateDropdownTextForRestore(modal);
                
                // 更新选中计数
                this.updateSelectionCountForRestore(modal);
            };
            
            // 恢复后更新下拉框显示文本
            nodeType.prototype.updateDropdownTextForRestore = function(modal) {
                const dropdownText = modal.querySelector('#dropdown-text');
                if (!dropdownText || !modal.selectedLayers) return;
                
                const selectedCount = modal.selectedLayers.size;
                if (selectedCount === 0) {
                    dropdownText.textContent = 'Click to select layers...';
                    StyleManager.applyPreset(dropdownText, 'dropdownTextPlaceholder');
                } else if (selectedCount === 1) {
                    const selectedId = Array.from(modal.selectedLayers)[0];
                    const annotation = modal.annotations.find(ann => ann.id === selectedId);
                    if (annotation) {
                        const layerName = `${safeT('layer_name', 'Layer')} ${annotation.number + 1}`;
                        const operationType = annotation.operationType || 'add_object';
                        dropdownText.textContent = `${layerName} • ${operationType}`;
                        StyleManager.applyPreset(dropdownText, 'dropdownTextSelected');
                    }
                } else {
                    dropdownText.textContent = `${selectedCount} ${safeT('layers_selected', 'layers selected')}`;
                    StyleManager.applyPreset(dropdownText, 'dropdownTextSelected');
                }
                
            };
            
            // 恢复后更新选中计数
            nodeType.prototype.updateSelectionCountForRestore = function(modal) {
                const selectionCount = modal.cachedElements?.selectionCount || modal.querySelector('#selection-count');
                if (selectionCount && modal.selectedLayers) {
                    const count = modal.selectedLayers.size;
                    selectionCount.textContent = `${count} ${safeT('selected_count', 'selected')}`;
                }
            };
            
            // 调用标准的updateObjectSelector函数
            // 调用标准updateObjectSelector - 已迁移到数据管理模块
            nodeType.prototype.callStandardUpdateObjectSelector = function(modal) {
                return callStandardUpdateObjectSelector(modal, this);
            };
            
            // 标准的图层选择切换
            nodeType.prototype.standardToggleLayerSelection = function(modal, annotationId, isSelected) {
                if (!modal.selectedLayers) {
                    modal.selectedLayers = new Set();
                }
                
                if (isSelected) {
                    modal.selectedLayers.add(annotationId);
                } else {
                    modal.selectedLayers.delete(annotationId);
                }
                
                // 更新下拉框显示文本和选中计数
                this.standardUpdateDropdownText(modal);
                this.standardUpdateSelectionCount(modal);
                
            };
            
            // 标准的选中计数更新
            nodeType.prototype.standardUpdateSelectionCount = function(modal) {
                const selectionCount = modal.cachedElements?.selectionCount || modal.querySelector('#selection-count');
                if (selectionCount && modal.selectedLayers) {
                    const count = modal.selectedLayers.size;
                    selectionCount.textContent = `${count} ${safeT('selected_count', 'selected')}`;
                }
            };
            
            // 标准的下拉框文本更新
            nodeType.prototype.standardUpdateDropdownText = function(modal) {
                const dropdownText = modal.querySelector('#dropdown-text');
                if (!dropdownText || !modal.selectedLayers) return;
                
                const selectedCount = modal.selectedLayers.size;
                if (selectedCount === 0) {
                    dropdownText.textContent = 'Click to select layers...';
                    StyleManager.applyPreset(dropdownText, 'dropdownTextPlaceholder');
                } else if (selectedCount === 1) {
                    const selectedId = Array.from(modal.selectedLayers)[0];
                    const annotation = modal.annotations.find(ann => ann.id === selectedId);
                    if (annotation) {
                        const layerName = `${safeT('layer_name', 'Layer')} ${annotation.number + 1}`;
                        const operationType = annotation.operationType || 'add_object';
                        dropdownText.textContent = `${layerName} • ${operationType}`;
                        StyleManager.applyPreset(dropdownText, 'dropdownTextSelected');
                    }
                } else {
                    dropdownText.textContent = `${selectedCount} ${safeT('layers_selected', 'layers selected')}`;
                    StyleManager.applyPreset(dropdownText, 'dropdownTextSelected');
                }
            };
            
            
            // 标准的下拉框事件绑定
            nodeType.prototype.standardBindDropdownEvents = function(modal) {
                const dropdown = modal.querySelector('#layer-dropdown');
                const dropdownMenu = modal.querySelector('#layer-dropdown-menu');
                const dropdownArrow = modal.querySelector('#dropdown-arrow');
                
                if (!dropdown || !dropdownMenu || !dropdownArrow) {
                    return;
                }
                
                // 防止重复绑定
                if (dropdown.dataset.standardBound === 'true') {
                    return;
                }
                dropdown.dataset.standardBound = 'true';
                
                // ✅ 下拉框事件处理已移至 event_handlers.js 模块，避免重复代码
                if (this.eventHandlers) {
                    this.eventHandlers.bindDropdownEventsForRestore(modal);
                }
            };
            
            // 恢复后更新下拉复选框 - 委托给data_manager模块
            nodeType.prototype.updateDropdownAfterRestore = function(modal) {
                updateDropdownAfterRestore(modal, this);
            };
            
            
            // 恢复annotations到canvas - 委托给annotation_restorer模块
            // 恢复不透明度滑块的值
            nodeType.prototype.restoreOpacitySlider = function(modal, savedAnnotations) {
                try {
                    // 查找不透明度滑块和显示元素
                    const opacitySlider = modal.querySelector('#vpe-opacity-slider');
                    const opacityValue = modal.querySelector('#vpe-opacity-value');
                    
                    if (!opacitySlider || !opacityValue) {
                        return;
                    }
                    
                    // 从保存的标注中获取第一个有效的不透明度值
                    let restoredOpacity = 50; // 默认值
                    
                    if (savedAnnotations && savedAnnotations.length > 0) {
                        // 查找第一个有不透明度值的标注
                        for (const annotation of savedAnnotations) {
                            if (annotation.opacity !== undefined && annotation.opacity !== null) {
                                restoredOpacity = annotation.opacity;
                                break;
                            }
                        }
                    }
                    
                    // 更新滑块和显示值
                    opacitySlider.value = restoredOpacity;
                    opacityValue.textContent = restoredOpacity + '%';
                    modal.currentOpacity = restoredOpacity;
                    
                    
                } catch (error) {
                    handleError(' 恢复不透明度滑块', error);
                }
            };

            // 添加编号标签
            nodeType.prototype.addNumberLabel = function(svg, annotation, coords) {
                const text = createSVG('text');
                const x = Math.min(coords[0], coords[2]) + 5;
                const y = Math.min(coords[1], coords[3]) + 15;
                text.setAttribute('x', x);
                text.setAttribute('y', y);
                text.setAttribute('fill', '#ffffff');
                text.setAttribute('font-size', '12');
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('data-annotation-id', annotation.id);
                text.textContent = annotation.number;
                text.style.pointerEvents = 'none';
                svg.appendChild(text);
            };

            // 为恢复的annotation绑定事件处理器
            nodeType.prototype.bindRestoredAnnotationEvents = function(modal, svg) {
                
                // 为所有annotation形状添加点击和悬停事件
                const shapes = svg.querySelectorAll('.annotation-shape');
                shapes.forEach(shape => {
                    // 使用EventManager批量绑定事件
                    EventManager.delegate(svg, '.annotation-shape', 'click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const annotationId = e.target.dataset.annotationId;
                        
                        // 更新选择状态
                        this.selectAnnotationInPanel(modal, annotationId);
                        this.highlightAnnotationOnCanvas(e.target);
                    });
                    
                    // 悬停效果
                    const hoverCleanup = bindEvents(shape, {
                        mouseenter: () => {
                            shape.style.filter = 'brightness(1.2)';
                            
                            // 保存原始宽度，避免硬编码
                            if (!shape.dataset.originalStrokeWidth) {
                                shape.dataset.originalStrokeWidth = shape.getAttribute('stroke-width');
                            }
                            
                            // 对画笔类型使用特殊处理
                            if (shape.classList.contains('brush-path')) {
                                // 画笔悬停时只改变亮度，不改变宽度
                                // 因为画笔宽度是精确计算的，改变会破坏效果
                            } else {
                                // 其他标注类型增加宽度
                                const currentWidth = parseFloat(shape.getAttribute('stroke-width')) || 3;
                                shape.style.strokeWidth = (currentWidth + 1).toString();
                            }
                        },
                        mouseleave: () => {
                            shape.style.filter = 'none';
                            
                            // 恢复原始宽度
                            if (shape.dataset.originalStrokeWidth) {
                                shape.style.strokeWidth = shape.dataset.originalStrokeWidth;
                            } else {
                                // 回退：根据类型设置默认宽度
                                if (shape.classList.contains('brush-path')) {
                                    // 画笔保持当前宽度
                                    shape.style.strokeWidth = shape.getAttribute('stroke-width');
                                } else {
                                    // 其他标注的默认宽度
                                    const originalWidth = shape.classList.contains('highlighted') ? '4' : '3';
                                    shape.style.strokeWidth = originalWidth;
                                }
                            }
                        }
                    });
                });
                
            };

            // 在面板中选择annotation
            nodeType.prototype.selectAnnotationInPanel = function(modal, annotationId) {
                const annotationObjects = modal.cachedElements?.annotationObjects || modal.querySelector('#annotation-objects');
                if (annotationObjects) {
                    // 找到对应的checkbox并选中
                    const checkbox = annotationObjects.querySelector(`input[data-layer-id="${annotationId}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                        // 触发选择事件
                        const changeEvent = new Event('change');
                        checkbox.dispatchEvent(changeEvent);
                    }
                }
            };

            // 在画布上高亮annotation
            nodeType.prototype.highlightAnnotationOnCanvas = function(shape) {
                // 移除其他高亮
                const svg = shape.closest('svg');
                if (svg) {
                    svg.querySelectorAll('.annotation-shape.highlighted').forEach(s => {
                        s.classList.remove('highlighted');
                        s.style.strokeWidth = '3';
                        s.style.filter = 'none';
                    });
                }
                
                // 添加当前高亮
                shape.classList.add('highlighted');
                shape.style.strokeWidth = '5';
                shape.style.filter = 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))';
                
            };

            // 调试annotation可见性
            nodeType.prototype.debugAnnotationVisibility = function(modal, svg) {
                
                // 检查SVG容器
                const svgRect = svg.getBoundingClientRect();
                
                // 检查每个annotation形状
                const shapes = svg.querySelectorAll('.annotation-shape');
                
                shapes.forEach((shape, index) => {
                    const rect = shape.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(shape);
                });
                
                // 检查图层面板状态
                const annotationObjects = modal.cachedElements?.annotationObjects || modal.querySelector('#annotation-objects');
                if (annotationObjects) {
                    const layerItems = annotationObjects.children;
                    
                    Array.from(layerItems).forEach((item, index) => {
                        const checkbox = item.querySelector('input[type="checkbox"]');
                    });
                }
            };

            // ✅ normalizeAnnotationData 函数已移至 DataManager 模块，避免重复实现
            
            // Layer visibility handled by Fabric.js objects
            nodeType.prototype.toggleLayerVisibility = function(modal, layerId, layerType, buttonElement) {
                if (this.layerVisibilityController) {
                    this.layerVisibilityController.toggleLayerVisibility(modal, layerId, layerType, buttonElement);
                } else {
                    handleError('layerVisibilityController未初始化');
                }
            };

            // ✅ 统一的清空标注图层函数 - 避免重复代码
            nodeType.prototype.clearAnnotationLayersFromPanel = function(modal) {
                const elements = modal.cachedElements || createModalElementsCache(modal);
                const layersList = elements.layersList();
                if (layersList) {
                    const annotationItems = layersList.querySelectorAll('.layer-list-item[data-layer-type="ANNOTATION"]');
                    annotationItems.forEach(item => item.remove());
                }
            };

            // 为恢复的annotation添加编号标签
            nodeType.prototype.addRestoredNumberLabel = function(svg, coords, number, color) {
                try {
                    // 计算标签位置（左上角）
                    const labelX = Math.min(coords[0], coords[2]) + 8;
                    const labelY = Math.min(coords[1], coords[3]) - 8;
                    
                    // 创建标签组 - 使用统一创建函数
                    const group = createSVG('g');
                    group.setAttribute('class', 'annotation-label');
                    group.setAttribute('data-annotation-number', number);
                    
                    // 数字文本 - 直接显示数字，无背景圆圈
                    const text = createSVG('text');
                    text.setAttribute('x', labelX);
                    text.setAttribute('y', labelY);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('dominant-baseline', 'central');
                    text.setAttribute('fill', '#fff');
                    text.setAttribute('font-size', '24');
                    text.setAttribute('font-weight', 'bold');
                    text.setAttribute('font-family', 'Arial, sans-serif');
                    text.setAttribute('stroke', '#000');
                    text.setAttribute('stroke-width', '2');
                    text.setAttribute('paint-order', 'stroke fill');
                    text.textContent = number;
                    
                    // 添加文本到组
                    group.appendChild(text);
                    
                    // 添加到SVG
                    svg.appendChild(group);
                    
                } catch (error) {
                    handleError(' 添加恢复的编号标签', error);
                }
            };

            // 手动创建annotation形状 (最后的备用方案)

            // 刷新图层面板状态
            nodeType.prototype.refreshLayerPanelState = function(modal) {
                try {
                    // 找到annotation-objects容器
                    const annotationObjects = modal.cachedElements?.annotationObjects || modal.querySelector('#annotation-objects');
                    if (annotationObjects) {
                        // 对所有层级的元素进行状态恢复
                        const allItems = annotationObjects.querySelectorAll('*');
                        allItems.forEach(item => {
                            // 移除任何可能的禁用状态
                            item.style.opacity = '1';
                            item.style.pointerEvents = 'auto';
                            item.classList.remove('disabled', 'inactive', 'grayed-out');
                            
                            // 如果是input元素，确保它可用
                            if (item.tagName === 'INPUT') {
                                item.disabled = false;
                                if (item.type === 'checkbox') {
                                    item.checked = true; // 默认选中恢复的annotations
                                }
                            }
                        });
                    }
                    
                    // 也检查传统的layer-item选择器
                    const layerItems = modal.querySelectorAll('.layer-list-item');
                    layerItems.forEach(item => {
                        // 移除灰色/禁用状态
                        item.style.opacity = '1';
                        item.style.pointerEvents = 'auto';
                        item.style.color = '#ffffff'; // 确保文字是白色
                        item.style.backgroundColor = '#2b2b2b'; // 恢复正常背景色
                        item.classList.remove('disabled', 'inactive', 'grayed-out');

                        // 确保checkbox可用
                        const checkbox = item.querySelector('input[type="checkbox"]');
                        if (checkbox) {
                            checkbox.disabled = false;
                            checkbox.checked = true; // 默认选中恢复的annotations
                        }
                    });
                    
                } catch (error) {
                    handleError(' 刷新图层面板状态', error);
                }
            };
            
            
            
            
            
            // 绑定基础事件
            nodeType.prototype.bindBasicEvents = function(modal) {
                // 🔗 初始化时同步后端节点参数到前端UI
                const promptTemplateWidget = this.widgets?.find(w => w.name === "prompt_template");
                
                const operationType = modal.querySelector('#operation-type');
                const targetInput = modal.querySelector('#target-input');
                
                if (promptTemplateWidget && operationType && promptTemplateWidget.value) {
                    operationType.value = promptTemplateWidget.value;
                }
                
                // 关闭按钮
                const closeBtn = modal.querySelector('#vpe-close');
                if (closeBtn) {
                    bindEvent(closeBtn, 'click', () => {
                        // 🎯 关闭前自动保存Fabric画布数据
                        if (this.dataManager && this.fabricManager && this.fabricManager.fabricCanvas) {
                            console.log('💾 Auto-saving Fabric canvas data before closing...');
                            const autoSaveSuccess = this.dataManager.saveFabricCanvasData(this.fabricManager.fabricCanvas);
                            if (autoSaveSuccess) {
                                console.log('✅ Canvas data auto-saved successfully');
                            }
                        }
                        cleanupModal(modal, this);
                    });
                }
                
                // 背景点击关闭
                bindEvent(modal, 'click', (e) => {
                    if (e.target === modal) {
                        // 🎯 关闭前自动保存Fabric画布数据
                        if (this.dataManager && this.fabricManager && this.fabricManager.fabricCanvas) {
                            console.log('💾 Auto-saving Fabric canvas data before closing (background click)...');
                            const autoSaveSuccess = this.dataManager.saveFabricCanvasData(this.fabricManager.fabricCanvas);
                            if (autoSaveSuccess) {
                                console.log('✅ Canvas data auto-saved successfully');
                            }
                        }
                        cleanupModal(modal, this);
                    }
                });
                
                // 保存按钮
                const saveBtn = modal.querySelector('#vpe-save');
                if (saveBtn) {
                    bindEvent(saveBtn, 'click', () => {
                        // 🔍 先检查modal.annotations是否存在
                        
                        // 🔍 检查SVG中的标注元素
                        const svg = modal.cachedElements?.drawingSvg || modal.querySelector('#drawing-layer svg');
                        if (svg) {
                            const shapes = svg.querySelectorAll('.annotation-shape');
                            shapes.forEach((shape, index) => {
                                // 处理形状
                            });
                        }
                        
                        const promptData = exportPromptData(modal);
                        if (promptData) {
                            
                            // 🔍 详细调试：检查所有标注数据
                            if (promptData.annotations && promptData.annotations.length > 0) {
                                promptData.annotations.forEach((annotation, index) => {
                                    // 处理标注数据
                                });
                            } else {
                            }
                            
                            // 🎯 实际保存逻辑：保存Fabric画布数据和标注数据到节点widget
                            try {
                                // 使用dataManager统一处理数据保存
                                if (this.dataManager) {
                                    // 🎯 优先保存Fabric.js画布的完整数据（包含canvas图像）
                                    if (this.fabricManager && this.fabricManager.fabricCanvas) {
                                        console.log('💾 Saving Fabric.js canvas data (complete canvas image)...');
                                        const fabricSaveSuccess = this.dataManager.saveFabricCanvasData(this.fabricManager.fabricCanvas);
                                        if (fabricSaveSuccess) {
                                            console.log('✅ Fabric canvas data saved successfully');
                                        } else {
                                            console.warn('⚠️ Failed to save Fabric canvas data, falling back to annotation data');
                                            
                                            // 降级到传统的标注数据保存
                                            if (promptData.annotations) {
                                                promptData.annotations = promptData.annotations.map(annotation => {
                                                    const normalized = this.dataManager ? this.dataManager.normalizeAnnotationData(annotation) : annotation;
                                                    return normalized;
                                                });
                                            }
                                            
                                            const saveSuccess = this.dataManager.saveAnnotationData(modal, promptData);
                                            if (!saveSuccess) {
                                                handleError('使用dataManager保存数据失败');
                                            }
                                        }
                                    } else {
                                        // 没有Fabric管理器时使用传统保存方式
                                        console.log('💾 No Fabric manager found, using traditional annotation data save...');
                                        if (promptData.annotations) {
                                            promptData.annotations = promptData.annotations.map(annotation => {
                                                const normalized = this.dataManager ? this.dataManager.normalizeAnnotationData(annotation) : annotation;
                                                return normalized;
                                            });
                                        }
                                        
                                        const saveSuccess = this.dataManager.saveAnnotationData(modal, promptData);
                                        if (!saveSuccess) {
                                            handleError('使用dataManager保存数据失败');
                                        }
                                    }
                                    
                                    // 标记节点为已修改，触发重新计算
                                    if (app.graph) {
                                        app.graph.setDirtyCanvas(true);
                                    }
                                } else {
                                    handleError('dataManager未初始化');
                                }
                                
                                KontextUtils.showNotification('Canvas data saved successfully (includes complete canvas image)', 'success');
                            } catch (error) {
                                handleError('保存数据', error);
                                KontextUtils.showNotification('保存失败: ' + error.message, 'error');
                            }
                        }
                    });
                }
                
                
                // 🔧 高亮选中的标注功能（内联版本 + 调试增强）
                const highlightSelectedAnnotations = (modal, selectedIds) => {
                    const svg = modal.cachedElements?.drawingSvg || modal.querySelector('#drawing-layer svg');
                    if (!svg) {
                        handleError('未找到SVG容器');
                        return;
                    }
                    
                    
                    // 🔍 调试：显示SVG中的所有标注元素
                    const allShapes = svg.querySelectorAll('.annotation-shape');
                    allShapes.forEach((shape, index) => {
                        // 处理形状属性
                    });
                    
                    // 清除所有选中状态
                    allShapes.forEach(shape => {
                        // 🔧 恢复原始边框状态
                        const originalStroke = shape.getAttribute('data-original-stroke');
                        const originalStrokeWidth = shape.getAttribute('data-original-stroke-width');
                        
                        // 🔧 完全清除高亮效果
                        shape.classList.remove('selected');
                        shape.style.filter = 'none';
                        shape.removeAttribute('stroke-opacity');
                        
                        // 🔧 恢复原始边框宽度
                        if (originalStrokeWidth) {
                            shape.setAttribute('stroke-width', originalStrokeWidth);
                        } else {
                            shape.setAttribute('stroke-width', '3');
                        }
                        
                        // 🔧 恢复原始边框状态
                        if (originalStroke) {
                            shape.setAttribute('stroke', originalStroke);
                        } else {
                            // 🔧 标注在非高亮状态下应该没有边框
                            shape.setAttribute('stroke', 'none');
                        }
                    });
                    
                    svg.querySelectorAll('.annotation-label circle').forEach(circle => {
                        circle.setAttribute('stroke', '#fff');
                        circle.setAttribute('stroke-width', '3');
                    });
                    
                    // 高亮选中的标注
                    let highlightedCount = 0;
                    selectedIds.forEach(annotationId => {
                        
                        const targetShape = svg.querySelector(`[data-annotation-id="${annotationId}"]`);
                        if (targetShape) {
                            
                            // 🔧 确保高亮效果可见 - 设置完整的stroke属性
                            const currentStroke = targetShape.getAttribute('stroke');
                            const currentFill = targetShape.getAttribute('fill');
                            
                            // 🔍 保存原始边框状态以便恢复
                            if (!targetShape.hasAttribute('data-original-stroke')) {
                                targetShape.setAttribute('data-original-stroke', currentStroke || 'none');
                            }
                            if (!targetShape.hasAttribute('data-original-stroke-width')) {
                                targetShape.setAttribute('data-original-stroke-width', targetShape.getAttribute('stroke-width') || '3');
                            }
                            
                            // 设置边框属性以确保可见
                            targetShape.setAttribute('stroke-width', '6');
                            if (!currentStroke || currentStroke === 'none') {
                                // 如果没有边框，使用填充颜色或默认黄色作为边框
                                const strokeColor = currentFill && currentFill !== 'none' ? currentFill : '#ffff00';
                                targetShape.setAttribute('stroke', strokeColor);
                            }
                            targetShape.setAttribute('stroke-opacity', '1.0');
                            targetShape.classList.add('selected');
                            
                            // 🔧 额外的视觉效果：添加阴影滤镜
                            targetShape.style.filter = 'drop-shadow(0 0 8px rgba(255, 255, 0, 0.8))';
                            
                            highlightedCount++;
                            
                            // 🔍 验证高亮是否生效
                            
                            // 高亮对应的编号标签
                            const annotation = modal.annotations?.find(ann => ann.id === annotationId);
                            if (annotation) {
                                const label = svg.querySelector(`[data-annotation-number="${annotation.number}"]`);
                                if (label) {
                                    const circle = label.querySelector('circle');
                                    if (circle) {
                                        circle.setAttribute('stroke', '#ffff00');
                                        circle.setAttribute('stroke-width', '4');
                                    }
                                }
                            }
                        } else {
                            handleError(' 未找到标注形状:', annotationId);
                            
                            // 🔍 尝试其他可能的选择器
                            const altShape1 = svg.querySelector(`[data-id="${annotationId}"]`);
                            const altShape2 = svg.querySelector(`#${annotationId}`);
                        }
                    });
                    
                };
                
                
                
                // 撤销按钮
                const undoBtn = modal.querySelector('#vpe-undo');
                if (undoBtn) {
                    bindEvent(undoBtn, 'click', () => {
                        undoLastAnnotation(modal, this);
                    });
                }
                
                // 清空按钮
                const clearBtn = modal.querySelector('#vpe-clear');
                if (clearBtn) {
                    bindEvent(clearBtn, 'click', () => {
                        // clearAllAnnotations函数不存在，使用Fabric.js管理器清空
                        if (modal.fabricManager) {
                            modal.fabricManager.fabricCanvas.clear();
                            modal.fabricManager.fabricCanvas.renderAll();
                        }
                    });
                }
                
                // Transform按钮事件绑定已迁移到modal_core模块中的bindTransformButtonEvents函数
                
                // 不透明度滑块
                const opacitySlider = modal.querySelector('#vpe-opacity-slider');
                const opacityValue = modal.querySelector('#vpe-opacity-value');
                if (opacitySlider && opacityValue) {
                    // 初始化不透明度值
                    modal.currentOpacity = parseInt(opacitySlider.value);
                    
                    opacitySlider.oninput = () => {
                        const opacityPercent = parseInt(opacitySlider.value);
                        modal.currentOpacity = opacityPercent;
                        opacityValue.textContent = opacityPercent + '%';
                        
                        // 更新所有现有标注的不透明度
                        // 计算不透明度值 (0-1)
                        const fillOpacity = opacityPercent / 100;
                        const strokeOpacity = Math.min(fillOpacity + 0.3, 1.0);
                        
                        // 查找所有标注形状 - 包括主SVG和独立容器中的
                        const imageCanvas = modal.querySelector('#image-canvas');
                        let allShapes = [];
                        
                        if (imageCanvas) {
                            // 从主SVG获取形状
                            const mainSvg = modal.querySelector('#drawing-layer svg');
                            if (mainSvg) {
                                allShapes.push(...mainSvg.querySelectorAll('.annotation-shape'));
                            }
                            
                            // 从所有独立标注容器获取形状
                            const annotationContainers = imageCanvas.querySelectorAll('[id^="annotation-svg-"]');
                            annotationContainers.forEach(container => {
                                const svg = container.querySelector('svg');
                                if (svg) {
                                    allShapes.push(...svg.querySelectorAll('.annotation-shape'));
                                }
                            });
                        }
                        
                        
                        allShapes.forEach(shape => {
                                // 清除任何可能存在的style.opacity
                                shape.style.removeProperty('opacity');
                                
                                // 根据形状类型和填充模式设置正确的不透明度属性
                                const currentFill = shape.getAttribute('fill');
                                const currentStroke = shape.getAttribute('stroke');
                                
                                if (currentFill && currentFill !== 'none') {
                                    // 实心样式：更新fill-opacity
                                    shape.setAttribute('fill-opacity', fillOpacity);
                                }
                                
                                if (currentStroke && currentStroke !== 'none') {
                                    // 有边框：更新stroke-opacity
                                    shape.setAttribute('stroke-opacity', strokeOpacity);
                                    
                                    // 特殊处理箭头：更新marker的不透明度
                                    const markerEnd = shape.getAttribute('marker-end');
                                    if (markerEnd && markerEnd.includes('arrowhead')) {
                                        const color = currentStroke;
                                        // 创建新的不透明度marker
                                        const colorHex = color.replace('#', '');
                                        const markerId = `arrowhead-${colorHex}-opacity-${Math.round(opacityPercent)}`;
                                        
                                        // 找到这个形状所在的SVG
                                        const shapeSvg = shape.closest('svg');
                                        const defs = shapeSvg ? shapeSvg.querySelector('defs') : null;
                                        if (defs && !defs.querySelector(`#${markerId}`)) {
                                            const marker = createSVG('marker');
                                            marker.setAttribute('id', markerId);
                                            marker.setAttribute('markerWidth', '10');
                                            marker.setAttribute('markerHeight', '7');
                                            marker.setAttribute('refX', '9');
                                            marker.setAttribute('refY', '3.5');
                                            marker.setAttribute('orient', 'auto');
                                            
                                            const markerFillOpacity = Math.min((opacityPercent + 30) / 100, 1.0);
                                            const polygon = createSVG('polygon');
                                            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                                            polygon.setAttribute('fill', color);
                                            polygon.setAttribute('fill-opacity', markerFillOpacity.toString());
                                            
                                            marker.appendChild(polygon);
                                            defs.appendChild(marker);
                                        }
                                        
                                        // 更新箭头的marker引用
                                        shape.setAttribute('marker-end', `url(#${markerId})`);
                                    }
                                }
                        });
                        
                        // 更新annotations数据中的不透明度
                        if (modal.annotations) {
                            modal.annotations.forEach(annotation => {
                                annotation.opacity = opacityPercent;
                            });
                        }
                        
                    };
                }
                
                // 画笔大小控制
                const brushSizeSlider = modal.querySelector('#vpe-brush-size');
                const brushSizeValue = modal.querySelector('#vpe-brush-size-value');
                if (brushSizeSlider && brushSizeValue) {
                    // 初始化画笔大小
                    modal.currentBrushSize = parseInt(brushSizeSlider.value);
                    
                    brushSizeSlider.oninput = () => {
                        const sizeValue = parseInt(brushSizeSlider.value);
                        modal.currentBrushSize = sizeValue;
                        brushSizeValue.textContent = sizeValue + 'px';
                    };
                }
                
                // 画笔羽化控制
                const brushFeatherSlider = modal.querySelector('#vpe-brush-feather');
                const brushFeatherValue = modal.querySelector('#vpe-brush-feather-value');
                if (brushFeatherSlider && brushFeatherValue) {
                    // 初始化画笔羽化
                    modal.currentBrushFeather = parseInt(brushFeatherSlider.value);
                    
                    brushFeatherSlider.oninput = () => {
                        const featherValue = parseInt(brushFeatherSlider.value);
                        modal.currentBrushFeather = featherValue;
                        brushFeatherValue.textContent = featherValue + 'px';
                    };
                }
                
                // ✅ 工具选择按钮事件处理已移至 event_handlers.js 模块
                if (this.eventHandlers) {
                    this.eventHandlers.bindDrawingToolEvents(modal);
                }
                
                // 🔧 添加Select All Layers功能
                const selectAllCheckbox = modal.querySelector('#select-all-objects');
                if (selectAllCheckbox) {
                    bindEvent(selectAllCheckbox, 'change', (e) => {
                        const isChecked = e.target.checked;
                        
                        // 获取所有图层复选框
                        const layerCheckboxes = modal.querySelectorAll('#annotation-objects input[type="checkbox"]');
                        layerCheckboxes.forEach(checkbox => {
                            checkbox.checked = isChecked;
                        });
                        
                        // 🔧 触发高亮更新
                        const selectedAnnotationIds = [];
                        if (isChecked) {
                            layerCheckboxes.forEach(checkbox => {
                                const annotationId = checkbox.dataset.annotationId;
                                if (annotationId) {
                                    selectedAnnotationIds.push(annotationId);
                                }
                            });
                        }
                        
                        // 调用高亮功能
                        highlightSelectedAnnotations(modal, selectedAnnotationIds);
                        
                    });
                    
                    // 监听图层复选框变化，更新Select All状态
                    const updateSelectAllState = () => {
                        const layerCheckboxes = modal.querySelectorAll('#annotation-objects input[type="checkbox"]');
                        const checkedCount = modal.querySelectorAll('#annotation-objects input[type="checkbox"]:checked').length;
                        
                        if (checkedCount === 0) {
                            selectAllCheckbox.checked = false;
                            selectAllCheckbox.indeterminate = false;
                        } else if (checkedCount === layerCheckboxes.length) {
                            selectAllCheckbox.checked = true;
                            selectAllCheckbox.indeterminate = false;
                        } else {
                            selectAllCheckbox.checked = false;
                            selectAllCheckbox.indeterminate = true;
                        }
                    };
                    
                    // 使用事件委托监听图层复选框变化
                    const annotationObjects = modal.cachedElements?.annotationObjects || modal.querySelector('#annotation-objects');
                    if (annotationObjects) {
                        EventManager.delegate(annotationObjects, 'input[type="checkbox"]', 'change', (e) => {
                            if (e.target.type === 'checkbox') {
                                updateSelectAllState();
                                
                                // 🔧 调用原始的多选高亮功能
                                // 导入并调用annotations模块的updateMultiSelection功能
                                try {
                                    // 获取当前选中的标注ID列表
                                    const selectedAnnotationIds = [];
                                    const checkedBoxes = modal.querySelectorAll('#annotation-objects input[type="checkbox"]:checked');
                                    checkedBoxes.forEach(checkbox => {
                                        const annotationId = checkbox.dataset.annotationId;
                                        if (annotationId) {
                                            selectedAnnotationIds.push(annotationId);
                                        }
                                    });
                                    
                                    
                                    // 调用高亮功能
                                    highlightSelectedAnnotations(modal, selectedAnnotationIds);
                                    
                                } catch (error) {
                                    handleError(' 调用高亮功能', error);
                                    // 后备方案：使用简化的高亮逻辑
                                    const annotationId = e.target.getAttribute('data-annotation-id');
                                    const isChecked = e.target.checked;
                                    
                                    if (annotationId) {
                                        const svg = modal.cachedElements?.drawingSvg || modal.querySelector('#drawing-layer svg');
                                        if (svg) {
                                            const shape = svg.querySelector(`[data-annotation-id="${annotationId}"]`);
                                            if (shape) {
                                                if (isChecked) {
                                                    // 🔧 保存原始状态
                                                    const currentStroke = shape.getAttribute('stroke');
                                                    const currentStrokeWidth = shape.getAttribute('stroke-width');
                                                    
                                                    if (!shape.hasAttribute('data-original-stroke')) {
                                                        shape.setAttribute('data-original-stroke', currentStroke || 'none');
                                                    }
                                                    if (!shape.hasAttribute('data-original-stroke-width')) {
                                                        shape.setAttribute('data-original-stroke-width', currentStrokeWidth || '3');
                                                    }
                                                    
                                                    // 应用高亮效果
                                                    shape.setAttribute('stroke-width', '6');
                                                    shape.setAttribute('stroke-opacity', '1.0');
                                                    shape.classList.add('selected');
                                                    shape.style.filter = 'drop-shadow(0 0 8px rgba(255, 255, 0, 0.8))';
                                                    
                                                    // 确保边框可见
                                                    if (!currentStroke || currentStroke === 'none') {
                                                        const currentFill = shape.getAttribute('fill');
                                                        const strokeColor = currentFill && currentFill !== 'none' ? currentFill : '#ffff00';
                                                        shape.setAttribute('stroke', strokeColor);
                                                    }
                                                    
                                                    // 🔧 高亮对应的编号标签
                                                    const annotation = modal.annotations?.find(ann => ann.id === annotationId);
                                                    if (annotation) {
                                                        const label = svg.querySelector(`[data-annotation-number="${annotation.number}"]`);
                                                        if (label) {
                                                            const circle = label.querySelector('circle');
                                                            if (circle) {
                                                                circle.setAttribute('stroke', '#ffff00');
                                                                circle.setAttribute('stroke-width', '4');
                                                            }
                                                        }
                                                    }
                                                    
                                                } else {
                                                    // 🔧 完全恢复原始状态
                                                    const originalStroke = shape.getAttribute('data-original-stroke');
                                                    const originalStrokeWidth = shape.getAttribute('data-original-stroke-width');
                                                    
                                                    // 恢复原始边框宽度
                                                    if (originalStrokeWidth) {
                                                        shape.setAttribute('stroke-width', originalStrokeWidth);
                                                    } else {
                                                        shape.setAttribute('stroke-width', '3');
                                                    }
                                                    
                                                    // 恢复原始边框颜色
                                                    if (originalStroke) {
                                                        if (originalStroke === 'none') {
                                                            shape.setAttribute('stroke', 'none');
                                                        } else {
                                                            shape.setAttribute('stroke', originalStroke);
                                                        }
                                                    } else {
                                                        // 🔧 标注在非高亮状态下应该没有边框
                                                        shape.setAttribute('stroke', 'none');
                                                    }
                                                    
                                                    // 清除高亮效果
                                                    shape.classList.remove('selected');
                                                    shape.style.filter = 'none';
                                                    shape.removeAttribute('stroke-opacity');
                                                    
                                                    // 🔧 恢复编号标签的原始状态
                                                    const annotation = modal.annotations?.find(ann => ann.id === annotationId);
                                                    if (annotation) {
                                                        const label = svg.querySelector(`[data-annotation-number="${annotation.number}"]`);
                                                        if (label) {
                                                            const circle = label.querySelector('circle');
                                                            if (circle) {
                                                                circle.setAttribute('stroke', '#fff');
                                                                circle.setAttribute('stroke-width', '3');
                                                            }
                                                        }
                                                    }
                                                    
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
                
                // ✅ 颜色选择按钮事件处理已移至 event_handlers.js 模块
                if (this.eventHandlers) {
                    this.eventHandlers.bindColorSelectionEvents(modal);
                }
                
                // ✅ 填充模式切换按钮事件处理已移至 event_handlers.js 模块
                if (this.eventHandlers) {
                    this.eventHandlers.bindFillToggleButton(modal);
                }
                
                // 默认选择第一个工具和颜色
                const firstTool = modal.querySelector('.vpe-tool');
                const firstColor = modal.querySelector('.vpe-color');
                if (firstTool) {
                    firstTool.click();
                }
                if (firstColor) {
                    firstColor.click();
                }
                
                // 监听Generated Description自动保存事件
                bindEvent(modal, 'descriptionsaved', (event) => {
                const promptData = event.detail.promptData;
                
                if (promptData) {
                    try {
                        // 使用dataManager统一自动保存数据
                        if (this.dataManager) {
                            const saveSuccess = this.dataManager.saveAnnotationData(modal, promptData);
                            if (saveSuccess) {
                                
                                // 通知ComfyUI图形需要更新
                                if (app.graph) {
                                    app.graph.setDirtyCanvas(true);
                                }
                            } else {
                                handleError('Generated Description自动保存失败');
                            }
                        } else {
                        }
                    } catch (error) {
                        handleError(' Generated Description自动保存', error);
                    }
                }
                });
                
                // 🎨 初始化图层管理面板事件绑定（延迟到函数定义后）
                
                // 🔴 将关键函数暴露到全局范围，确保标签页切换时能够重新绑定事件
                window.bindPromptEvents = bindPromptEvents;
                window.updateObjectSelector = updateObjectSelector;
                
                // 🔧 导入并暴露updateOperationTypeSelect函数
                import('./modules/visual_prompt_editor_utils.js').then(module => {
                    window.updateOperationTypeSelect = module.updateOperationTypeSelect;
                }).catch(error => {
                    console.error('❌ 导入updateOperationTypeSelect函数失败:', error);
                });
                
            };
            
            // 更新所有标注的不透明度
            nodeType.prototype.updateAllAnnotationsOpacity = function(modal, opacityPercent) {
                const svg = modal.querySelector('#drawing-layer svg');
                if (!svg) return;
                
                // 计算不透明度值 (0-1)
                const fillOpacity = opacityPercent / 100;
                const strokeOpacity = Math.min(fillOpacity + 0.3, 1.0);
                
                // 更新所有SVG形状的不透明度 - 直接更新SVG属性而不是style
                const shapes = svg.querySelectorAll('.annotation-shape');
                shapes.forEach(shape => {
                    // 清除任何可能存在的style.opacity
                    shape.style.removeProperty('opacity');
                    
                    // 根据形状类型和填充模式设置正确的不透明度属性
                    const currentFill = shape.getAttribute('fill');
                    const currentStroke = shape.getAttribute('stroke');
                    
                    if (currentFill && currentFill !== 'none') {
                        // 实心样式：更新fill-opacity
                        shape.setAttribute('fill-opacity', fillOpacity);
                    }
                    
                    if (currentStroke && currentStroke !== 'none') {
                        // 有边框：更新stroke-opacity
                        shape.setAttribute('stroke-opacity', strokeOpacity);
                        
                        // 特殊处理箭头：更新marker的不透明度
                        const markerEnd = shape.getAttribute('marker-end');
                        if (markerEnd && markerEnd.includes('arrowhead')) {
                            const color = currentStroke;
                            this.updateArrowheadMarker(shape, color, opacityPercent);
                        }
                    }
                });
                
                // 更新annotations数据中的不透明度
                if (modal.annotations) {
                    modal.annotations.forEach(annotation => {
                        annotation.opacity = opacityPercent;
                    });
                    
                    // 🔍 详细调试：输出更新后的annotations数据
                    modal.annotations.forEach((annotation, index) => {
                    });
                }
                
            };
            
            // 内联创建箭头marker（用于恢复）
            nodeType.prototype.createArrowheadMarkerInline = function(svg, color, opacity) {
                const defs = svg.querySelector('defs');
                if (!defs) return `arrowhead-${color.replace('#', '')}`;
                
                const markerId = `arrowhead-${color.replace('#', '')}-opacity-${Math.round(opacity)}`;
                
                // 检查是否已存在
                const existingMarker = defs.querySelector(`#${markerId}`);
                if (existingMarker) {
                    return markerId;
                }
                
                // 创建新的marker - 使用统一创建函数
                const marker = createSVG('marker');
                marker.setAttribute('id', markerId);
                marker.setAttribute('markerWidth', '10');
                marker.setAttribute('markerHeight', '7');
                marker.setAttribute('refX', '9');
                marker.setAttribute('refY', '3.5');
                marker.setAttribute('orient', 'auto');
                
                const fillOpacity = Math.min((opacity + 30) / 100, 1.0);
                const polygon = createSVG('polygon');
                polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                polygon.setAttribute('fill', color);
                polygon.setAttribute('fill-opacity', fillOpacity.toString());
                
                marker.appendChild(polygon);
                defs.appendChild(marker);
                
                return markerId;
            };
            
            // 更新箭头marker的不透明度
            nodeType.prototype.updateArrowheadMarker = function(arrowElement, color, opacity) {
                try {
                    const svg = arrowElement.closest('svg');
                    const defs = svg ? svg.querySelector('defs') : null;
                    if (!svg || !defs) return;
                    
                    // 生成新的marker ID
                    const markerId = `arrowhead-${color.replace('#', '')}-opacity-${Math.round(opacity)}`;
                    
                    // 检查是否已存在
                    let existingMarker = defs.querySelector(`#${markerId}`);
                    if (!existingMarker) {
                        // 创建新的marker - 使用统一创建函数
                        const marker = createSVG('marker');
                        marker.setAttribute('id', markerId);
                        marker.setAttribute('markerWidth', '10');
                        marker.setAttribute('markerHeight', '7');
                        marker.setAttribute('refX', '9');
                        marker.setAttribute('refY', '3.5');
                        marker.setAttribute('orient', 'auto');
                        
                        const fillOpacity = Math.min((opacity + 30) / 100, 1.0);
                        const polygon = createSVG('polygon');
                        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                        polygon.setAttribute('fill', color);
                        polygon.setAttribute('fill-opacity', fillOpacity.toString());
                        
                        marker.appendChild(polygon);
                        defs.appendChild(marker);
                    }
                    
                    // 更新箭头的marker引用
                    arrowElement.setAttribute('marker-end', `url(#${markerId})`);
                } catch (error) {
                    handleError(' 更新箭头marker', error);
                }
            };
            
            // 获取对象信息（从annotations模块获取）
            nodeType.prototype.getObjectInfo = function(annotation, index) {
                // 获取形状图标
                const getShapeIcon = (type) => {
                    const icons = {
                        'rectangle': '🔴▭',
                        'circle': '🟡⭕',
                        'arrow': '🔵➡️',
                        'freehand': '🟢🔗',
                        'brush': '🟠🖌️'
                    };
                    return icons[type] || '📍';
                };
                
                const icon = getShapeIcon(annotation.type);
                const translatedType = safeT(`shape_${annotation.type}`, annotation.type);
                
                // 生成详细描述
                let description = `[${annotation.number}] `;
                if (annotation.color) {
                    const getColorName = (color) => {
                        const colorMap = {
                            '#ff0000': 'color_red',
                            '#00ff00': 'color_green', 
                            '#0000ff': 'color_blue',
                            '#ffff00': 'color_yellow',
                            '#ff8000': 'color_orange'
                        };
                        const colorKey = colorMap[color.toLowerCase()];
                        return colorKey ? safeT(colorKey, 'Color') : 'Color';
                    };
                    
                    const colorName = getColorName(annotation.color);
                    const shapeName = annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1);
                    description += `${colorName}${shapeName} `;
                }
                
                // 添加尺寸信息
                if (annotation.geometry && annotation.geometry.coordinates) {
                    const coords = annotation.geometry.coordinates;
                    if (annotation.type === 'rectangle' && coords.length >= 4) {
                        const width = Math.abs(coords[2] - coords[0]);
                        const height = Math.abs(coords[3] - coords[1]);
                        description += `${Math.round(width)}×${Math.round(height)} `;
                        description += `(${Math.round(coords[0])},${Math.round(coords[1])})`;
                    }
                }
                
                description += `\n${safeT('individual_editing', 'Individual editing')} • ${translatedType}`;
                
                return {
                    icon: icon,
                    description: description
                };
            };
            
            
            // 加载图层到面板
            // 🎨 加载图层到面板 - 已迁移到UI模块
            nodeType.prototype.loadLayersToPanel = function(modal, layers) {
                return loadLayersToPanel(modal, layers);
            };
            
            
            // 撤销最后一个标注 - 已迁移到标注事件模块
            nodeType.prototype.undoLastAnnotation = function(modal) {
                // undoLastAnnotation函数不存在，使用Fabric.js撤销
                if (modal.fabricManager && modal.fabricManager.fabricCanvas) {
                    const objects = modal.fabricManager.fabricCanvas.getObjects();
                    if (objects.length > 0) {
                        modal.fabricManager.fabricCanvas.remove(objects[objects.length - 1]);
                        modal.fabricManager.fabricCanvas.renderAll();
                    }
                }
            };
            
            // 清空所有标注 - 已迁移到标注事件模块
            nodeType.prototype.clearAllAnnotations = function(modal) {
                // 使用Fabric.js管理器清空画布
                if (modal.fabricManager) {
                    modal.fabricManager.fabricCanvas.clear();
                    modal.fabricManager.fabricCanvas.renderAll();
                }
            };
            
            // 导出当前提示词数据
            nodeType.prototype.exportCurrentPromptData = function() {
                // 这里需要获取当前打开的modal
                // 暂时只是显示消息
                KontextUtils.showNotification('导出功能开发中', 'info');
            };

            // 更新恢复后的图层选择面板 - 使用新的下拉复选框界面
            nodeType.prototype.updateRestoredObjectSelector = function(modal) {
                
                // 调用模块中的updateObjectSelector函数
                if (typeof window.updateObjectSelector === 'function') {
                    window.updateObjectSelector(modal);
                } else {
                }
            };
            
            // 获取恢复标注的对象信息

            // 获取恢复标注的对象信息 - 与新创建标注使用相同的格式化逻辑
            nodeType.prototype.getRestoredObjectInfo = function(annotation, index) {
                const { type: tool, color } = annotation;
                
                // 颜色映射
                const COLOR_NAMES = {
                    '#ff0000': { name: 'Red', icon: '🔴' },
                    '#00ff00': { name: 'Green', icon: '🟢' }, 
                    '#ffff00': { name: 'Yellow', icon: '🟡' },
                    '#0000ff': { name: 'Blue', icon: '🔵' }
                };
                
                // 工具映射
                const TOOL_NAMES = {
                    'rectangle': { name: 'Rectangle', icon: '▭' },
                    'circle': { name: 'Circle', icon: '⭕' },
                    'arrow': { name: 'Arrow', icon: '➡️' },
                    'freehand': { name: 'Polygon', icon: '🔗' },
                    'brush': { name: 'Brush', icon: '🖌️' }
                };
                
                const colorInfo = COLOR_NAMES[color] || { name: 'Default', icon: '⚪' };
                const toolInfo = TOOL_NAMES[tool] || { name: tool, icon: '❓' };
                
                // 计算位置信息和尺寸信息
                let centerX, centerY, sizeInfo = '';
                
                if (tool === 'freehand') {
                    // 自由绘制：使用中心点和点数
                    if (annotation.centerPoint) {
                        centerX = Math.round(annotation.centerPoint.x);
                        centerY = Math.round(annotation.centerPoint.y);
                    } else if (annotation.points && annotation.points.length > 0) {
                        centerX = Math.round(annotation.points.reduce((sum, p) => sum + p.x, 0) / annotation.points.length);
                        centerY = Math.round(annotation.points.reduce((sum, p) => sum + p.y, 0) / annotation.points.length);
                    }
                    sizeInfo = ` ${annotation.points?.length || 0}点`;
                } else {
                    // 其他形状：使用start和end点，或从geometry获取
                    const { start: startPoint, end: endPoint } = annotation;
                    
                    // 安全检查：确保startPoint和endPoint存在
                    if (startPoint && endPoint && startPoint.x !== undefined && endPoint.x !== undefined) {
                        centerX = Math.round((startPoint.x + endPoint.x) / 2);
                        centerY = Math.round((startPoint.y + endPoint.y) / 2);
                        
                        if (tool === 'rectangle') {
                            const width = Math.abs(endPoint.x - startPoint.x);
                            const height = Math.abs(endPoint.y - startPoint.y);
                            sizeInfo = ` ${Math.round(width)}×${Math.round(height)}`;
                        }
                    } else if (annotation.geometry && annotation.geometry.coordinates) {
                        // 从geometry.coordinates计算中心点
                        const coords = annotation.geometry.coordinates;
                        if (coords.length >= 4) {
                            centerX = Math.round((coords[0] + coords[2]) / 2);
                            centerY = Math.round((coords[1] + coords[3]) / 2);
                            
                            if (tool === 'rectangle') {
                                const width = Math.abs(coords[2] - coords[0]);
                                const height = Math.abs(coords[3] - coords[1]);
                                sizeInfo = ` ${Math.round(width)}×${Math.round(height)}`;
                            }
                        }
                    } else {
                        // 默认值
                        centerX = 0;
                        centerY = 0;
                        sizeInfo = ' (unknown size)';
                    }
                    
                    if (tool === 'circle') {
                        if (startPoint && endPoint && startPoint.x !== undefined && endPoint.x !== undefined) {
                            const radiusX = Math.abs(endPoint.x - startPoint.x) / 2;
                            const radiusY = Math.abs(endPoint.y - startPoint.y) / 2;
                            if (Math.abs(radiusX - radiusY) < 5) {
                                sizeInfo = ` r=${Math.round(radiusX)}`;
                            } else {
                                sizeInfo = ` ${Math.round(radiusX)}×${Math.round(radiusY)}`;
                            }
                        } else if (annotation.geometry && annotation.geometry.coordinates) {
                            const coords = annotation.geometry.coordinates;
                            if (coords.length >= 4) {
                                const radiusX = Math.abs(coords[2] - coords[0]) / 2;
                                const radiusY = Math.abs(coords[3] - coords[1]) / 2;
                                if (Math.abs(radiusX - radiusY) < 5) {
                                    sizeInfo = ` r=${Math.round(radiusX)}`;
                                } else {
                                    sizeInfo = ` ${Math.round(radiusX)}×${Math.round(radiusY)}`;
                                }
                            }
                        }
                    } else if (tool === 'arrow') {
                        if (startPoint && endPoint && startPoint.x !== undefined && endPoint.x !== undefined) {
                            const length = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));
                            sizeInfo = ` L=${Math.round(length)}`;
                        } else if (annotation.geometry && annotation.geometry.coordinates) {
                            const coords = annotation.geometry.coordinates;
                            if (coords.length >= 4) {
                                const length = Math.sqrt(Math.pow(coords[2] - coords[0], 2) + Math.pow(coords[3] - coords[1], 2));
                                sizeInfo = ` L=${Math.round(length)}`;
                            }
                        }
                    }
                }
                
                return {
                    icon: `${colorInfo.icon}${toolInfo.icon}`,
                    description: `[${annotation.number || index}] ${colorInfo.name}${toolInfo.name}${sizeInfo} (${centerX},${centerY})`,
                    colorName: colorInfo.name,
                    toolName: toolInfo.name
                };
            };
            
            // 🔧 添加缺失的函数 - 加载图层到面板
            
            // 🔧 添加缺失的函数 - 更新提示词统计
            nodeType.prototype.updatePromptStats = function(modal, layersData) {
                
                const selectionCount = modal.cachedElements?.selectionCount || modal.querySelector('#selection-count');
                if (selectionCount) {
                    selectionCount.textContent = `${layersData.length} annotations`;
                }
                
                // 更新其他统计信息
                const statsInfo = {
                    totalAnnotations: layersData.length,
                    rectangles: layersData.filter(l => l.type === 'rectangle').length,
                    circles: layersData.filter(l => l.type === 'circle').length,
                    arrows: layersData.filter(l => l.type === 'arrow').length,
                    freehand: layersData.filter(l => l.type === 'freehand').length,
                    brush: layersData.filter(l => l.type === 'brush').length
                };
                
            };
            
            // 🎨 图层管理事件初始化
            nodeType.prototype.initializeLayerManagementEvents = function(modal) {
                
                if (!LAYER_MANAGEMENT_ENABLED || !isLayerManagementAvailable()) {
                    return;
                }
                
                try {
                    // 初始化时更新图层列表
                    this.updatePSLayersList(modal);
                    
                    // 图层管理开关已移除，默认启用所有图层控制
                    
                    // 图层选择事件 - 已移动到 bindPSLayerEvents 函数中处理动态图层
                    
                    // 图层可见性切换事件 - 已移动到 bindPSLayerEvents 函数中处理动态图层
                    
                    // 透明度滑块事件
                    const opacitySlider = modal.querySelector('#layer-opacity-slider');
                    const opacityValue = modal.querySelector('#opacity-value');
                    if (opacitySlider && opacityValue) {
                        bindEvent(opacitySlider, 'input', (e) => {
                            const value = e.target.value;
                            opacityValue.textContent = value + '%';
                        });
                    }
                    
                    // 缩放滑块事件
                    const scaleSlider = modal.querySelector('#layer-scale-slider');
                    const scaleValue = modal.querySelector('#scale-value');
                    if (scaleSlider && scaleValue) {
                        bindEvent(scaleSlider, 'input', (e) => {
                            const value = e.target.value;
                            scaleValue.textContent = value + '%';
                        });
                    }
                    
                    // 位置输入框事件
                    const layerX = modal.querySelector('#layer-x');
                    const layerY = modal.querySelector('#layer-y');
                    if (layerX) {
                        bindEvent(layerX, 'change', (e) => {
                        });
                    }
                    if (layerY) {
                        bindEvent(layerY, 'change', (e) => {
                        });
                    }
                    
                    // 应用变更按钮事件
                    const applyChanges = modal.querySelector('#apply-layer-changes');
                    if (applyChanges) {
                        bindEvent(applyChanges, 'click', () => {
                            this.applyLayerChanges(modal);
                        });
                    }
                    
                    // 重置属性按钮事件
                    const resetProperties = modal.querySelector('#reset-layer-properties');
                    if (resetProperties) {
                        bindEvent(resetProperties, 'click', () => {
                            if (opacitySlider) opacitySlider.value = 100;
                            if (opacityValue) opacityValue.textContent = '100%';
                            if (scaleSlider) scaleSlider.value = 100;
                            if (scaleValue) scaleValue.textContent = '100%';
                            if (layerX) layerX.value = '';
                            if (layerY) layerY.value = '';
                        });
                    }
                    
                    // 添加图像按钮事件
                    const addLayerImage = modal.querySelector('#add-layer-image');
                    if (addLayerImage) {
                        bindEvent(addLayerImage, 'click', () => {
                            this.openLayerImageDialog(modal);
                        });
                    }
                    
                    // 绘制图层按钮事件
                    const drawLayer = modal.querySelector('#draw-layer');
                    if (drawLayer) {
                        bindEvent(drawLayer, 'click', () => {
                            this.enableLayerDrawingMode(modal);
                        });
                    }
                    
                    // 图层设置按钮事件
                    const layerSettings = modal.querySelector('#layer-settings');
                    if (layerSettings) {
                        bindEvent(layerSettings, 'click', () => {
                            this.openLayerSettings(modal);
                        });
                    }
                    
                    // 监听节点连接变化
                    const originalOnConnectionsChange = this.onConnectionsChange;
                    this.onConnectionsChange = function() {
                        if (originalOnConnectionsChange) {
                            originalOnConnectionsChange.call(this);
                        }
                        
                        // 延迟更新图层列表，确保连接状态已更新
                        setTimeout(() => {
                            if (modal && modal.isConnected) {
                                this.updatePSLayersList(modal);
                            }
                        }, 100);
                    };
                    
                    
                } catch (error) {
                    handleError(' 图层管理事件绑定', error);
                }
            };
            
            // 🎨 图层变更应用方法
            nodeType.prototype.applyLayerChanges = function(modal) {
                
                try {
                    // 收集当前图层配置
                    const layerConfig = this.collectLayerConfiguration(modal);
                    
                    if (layerConfig) {
                        // 将配置传递给节点
                        this.updateNodeLayerConfig(layerConfig);
                        
                        // 显示成功反馈
                        this.showLayerStatusMessage(modal, '图层配置已应用', '#10b981');
                        
                    }
                } catch (error) {
                    handleError(' 应用图层变更', error);
                    this.showLayerStatusMessage(modal, '应用失败: ' + error.message, '#f44336');
                }
            };
            
            // 🎨 收集图层配置信息
            nodeType.prototype.collectLayerConfiguration = function(modal) {
                const selectedLayer = modal.querySelector('.ps-layer-item[style*="background: rgb(16, 185, 129)"]');
                if (!selectedLayer) {
                    throw new Error('请先选择一个图层');
                }
                
                const layerId = selectedLayer.dataset.layer;
                
                // 收集UI控件值
                const opacitySlider = modal.querySelector('#layer-opacity-slider');
                const scaleSlider = modal.querySelector('#layer-scale-slider');
                const layerX = modal.querySelector('#layer-x');
                const layerY = modal.querySelector('#layer-y');
                
                // 检查可见性
                const visibilityButton = selectedLayer.querySelector('.layer-visibility');
                const isVisible = visibilityButton && visibilityButton.textContent === '👁️';
                
                const config = {
                    enabled: true, // 默认启用图层管理
                    layers: {
                        [layerId]: {
                            visible: isVisible,
                            opacity: opacitySlider ? parseFloat(opacitySlider.value) / 100 : 1.0,
                            transform: {
                                x: layerX ? parseInt(layerX.value) || 0 : 0,
                                y: layerY ? parseInt(layerY.value) || 0 : 0,
                                scale: scaleSlider ? parseFloat(scaleSlider.value) / 100 : 1.0
                            }
                        }
                    },
                    timestamp: new Date().toISOString()
                };
                
                return config;
            };
            
            // 🎨 更新节点图层配置
            nodeType.prototype.updateNodeLayerConfig = function(layerConfig) {
                // 查找layer_config小部件
                const layerConfigWidget = this.widgets?.find(w => w.name === 'layer_config');
                
                if (layerConfigWidget) {
                    layerConfigWidget.value = JSON.stringify(layerConfig);
                }
                
                // 标记节点为已修改
                if (typeof this.setDirtyCanvas === 'function') {
                    this.setDirtyCanvas(true);
                }
            };
            
            // 🎨 显示图层状态消息
            nodeType.prototype.showLayerStatusMessage = function(modal, message, color = '#888') {
                const layerStatus = modal.querySelector('#layer-status');
                if (layerStatus) {
                    layerStatus.textContent = message;
                    layerStatus.style.color = color;
                    
                    // 3秒后恢复默认状态
                    setTimeout(() => {
                        layerStatus.textContent = 'Layer management ready. Enable to start using PS-style features.';
                        layerStatus.style.color = '#888';
                    }, 3000);
                }
            };
            
            // 🎨 简单的主图像检测（仅检测主图像输入）
            nodeType.prototype.detectMainImage = function() {
                
                // 只查找主要的image输入
                if (this.inputs) {
                    const mainImageInput = this.inputs.find(input => 
                        input.name === 'image' && input.type === 'IMAGE' && input.link !== null
                    );
                    
                    if (mainImageInput) {
                        return {
                            hasMainImage: true,
                            inputName: mainImageInput.name
                        };
                    }
                }
                
                return {
                    hasMainImage: false,
                    inputName: null
                };
            };
            
            // 🎨 更新PS图层列表
            nodeType.prototype.updatePSLayersList = function(modal) {
                const dynamicLayersContainer = modal.querySelector('#dynamic-ps-layers');
                const noLayersMessage = modal.querySelector('#no-ps-layers-message');
                
                if (!dynamicLayersContainer) return;
                
                // 检测主图像
                const mainImageInfo = this.detectMainImage();
                
                // 清空现有动态图层
                dynamicLayersContainer.innerHTML = '';
                
                if (!mainImageInfo.hasMainImage) {
                    // 显示空状态消息 - 没有主图像输入
                    if (noLayersMessage) {
                        noLayersMessage.style.display = 'block';
                        noLayersMessage.textContent = '未检测到图像输入连接';
                    }
                } else {
                    // 隐藏空状态消息
                    if (noLayersMessage) noLayersMessage.style.display = 'none';
                    
                    // 创建主图像显示项
                    const imageElement = document.createElement('div');
                    imageElement.className = 'ps-layer-item vpe-layer-item';
                    imageElement.setAttribute('data-layer', 'main_image');
                    imageElement.style.borderBottom = '1px solid #444';
                    imageElement.style.background = '#10b981'; // 默认选中
                    
                    imageElement.innerHTML = `
                        <span class="layer-visibility" style="margin-right: 8px; cursor: pointer;">👁️</span>
                        <span style="flex: 1; color: white; font-size: 12px;">🖼️ 主图像</span>
                        <span class="layer-opacity" style="color: #888; font-size: 10px;">100%</span>
                        <span style="color: #10b981; font-size: 9px; margin-left: 8px;">Fabric.js编辑</span>
                    `;
                    
                    // 添加点击事件（虽然只有一个主图像，保持一致性）
                    imageElement.addEventListener('click', () => {
                        dynamicLayersContainer.querySelectorAll('.ps-layer-item').forEach(item => {
                            item.style.background = '';
                        });
                        imageElement.style.background = '#10b981';
                    });
                    
                    dynamicLayersContainer.appendChild(imageElement);
                    
                    // 重新绑定事件
                    this.bindPSLayerEvents(modal);
                }
                
            };
            
            // 🎨 绑定PS图层事件
            nodeType.prototype.bindPSLayerEvents = function(modal) {
                const layerItems = modal.querySelectorAll('#dynamic-ps-layers .ps-layer-item');
                
                layerItems.forEach(item => {
                    // 移除旧的事件监听器
                    const newItem = item.cloneNode(true);
                    item.parentNode.replaceChild(newItem, item);
                    
                    // 绑定新的事件监听器
                    bindEvent(newItem, 'click', (e) => {
                        if (e.target.classList.contains('layer-visibility')) return;
                        
                        // 取消其他图层的选中状态
                        modal.querySelectorAll('.ps-layer-item').forEach(otherItem => {
                            StyleManager.applyPreset(otherItem, 'layerItem');
                        });
                        
                        // 选中当前图层
                        StyleManager.applyPreset(newItem, 'layerItem', { background: '#10b981' });
                        
                        // 显示属性面板
                        const layerProperties = modal.querySelector('#layer-properties');
                        if (layerProperties) {
                            StyleManager.applyPreset(layerProperties, 'visible');
                        }
                        
                    });
                    
                    // 可见性切换事件
                    const visibilityButton = newItem.querySelector('.layer-visibility');
                    if (visibilityButton) {
                        bindEvent(visibilityButton, 'click', (e) => {
                            e.stopPropagation();
                            
                            const isVisible = visibilityButton.textContent === '👁️';
                            visibilityButton.textContent = isVisible ? '🙈' : '👁️';
                            newItem.style.opacity = isVisible ? '0.5' : '1';
                            
                        });
                    }
                });
            };
            
            // 打开图层图像选择对话框 - 委托给file_manager模块
            nodeType.prototype.openLayerImageDialog = function(modal) {
                openLayerImageDialog(modal, this);
            };
            
            // 为指定图层加载图像 - 委托给file_manager模块
            nodeType.prototype.loadImageForLayer = function(modal, layerId) {
                loadImageForLayer(modal, layerId, this);
            };
            
            // 创建默认图层 - 委托给file_manager模块
            // createDefaultLayer functionality removed - using main image only
            
            // 处理图层图像文件 - 委托给file_manager模块
            nodeType.prototype.processLayerImageFile = function(modal, layerId, file) {
                processLayerImageFile(modal, layerId, file, this);
            };
            
            // 🎨 启用图层绘制模式
            nodeType.prototype.enableLayerDrawingMode = function(modal) {
                
                // 更灵活的选中图层检测
                let selectedLayer = modal.querySelector('.ps-layer-item[style*="background: rgb(16, 185, 129)"]') ||
                                   modal.querySelector('.ps-layer-item[style*="background:#10b981"]') ||
                                   modal.querySelector('.ps-layer-item[style*="background: #10b981"]');
                
                if (!selectedLayer) {
                    // 查找主图像层
                    selectedLayer = modal.querySelector('[data-layer="main_image"]');
                    if (!selectedLayer) {
                        return;
                    }
                }
                
                const layerId = selectedLayer.dataset.layer;
                
                // 切换到画布区域
                const canvasTab = modal.querySelector('[data-tab="canvas"]');
                if (canvasTab) {
                    canvasTab.click();
                }
                
                // 激活绘制工具
                const drawTool = modal.querySelector('[data-tool="draw"]');
                if (drawTool) {
                    drawTool.click();
                }
                
                // 设置绘制模式为图层绘制
                this.currentLayerDrawingMode = layerId;
                
                this.showLayerStatusMessage(modal, `已进入 ${layerId} 绘制模式`, '#10b981');
                
                // 显示绘制提示
                setTimeout(() => {
                    this.showLayerStatusMessage(modal, '在画布上绘制，图形将添加到选中图层', '#2196F3');
                }, 1000);
            };
            
            // 🎨 打开图层设置 - 使用通用设置对话框创建函数
            nodeType.prototype.openLayerSettings = function(modal) {
                this.createSettingsDialog('advanced');
                this.showLayerStatusMessage(modal, '图层设置已打开', '#10b981');
            };
            
            } catch (error) {
                console.error("❌ Error initializing Visual Prompt Editor node:", error);
                console.error("Stack trace:", error.stack);
            }
        }
        
        // === 自由变换功能实现 ===
        
        // 添加画布点击选择图层功能
        nodeType.prototype.initCanvasLayerSelection = function(modal) {
            const elements = modal.cachedElements || createModalElementsCache(modal);
            const imageCanvas = elements.imageCanvas();
            if (!imageCanvas) return;
            
            // 添加画布点击事件
            bindEvent(imageCanvas, 'click', (e) => {
                // 检查是否启用了变换模式
                if (!modal.transformModeActive) {
                    return; // 如果变换模式未激活，不处理点击事件（保持绘制模式）
                }
                
                // 检查是否点击在图层上
                const clickedLayer = this.getLayerAtPosition(modal, e.clientX, e.clientY);
                
                if (clickedLayer) {
                    this.activateLayerTransform(modal, clickedLayer.id, clickedLayer.type);
                } else {
                    // 🔧 点击空白区域，清除选择（使用新的变换控制模块）
                    if (this.transformControls) {
                        this.transformControls.clearTransformState(modal);
                    }
                }
            });
            
            // 添加双击激活变换
            bindEvent(imageCanvas, 'dblclick', (e) => {
                const clickedLayer = this.getLayerAtPosition(modal, e.clientX, e.clientY);
                if (clickedLayer) {
                    this.activateLayerTransform(modal, clickedLayer.id, clickedLayer.type);
                }
            });
            
        };
        
        // 获取指定位置的图层
        nodeType.prototype.getLayerAtPosition = function(modal, clientX, clientY) {
            const imageCanvas = modal.querySelector('#image-canvas');
            if (!imageCanvas) return null;
            
            const canvasRect = imageCanvas.getBoundingClientRect();
            const x = clientX - canvasRect.left;
            const y = clientY - canvasRect.top;
            
            // 检查连接图层
            const layerElements = imageCanvas.querySelectorAll('[id^="canvas-layer-"]');
            for (let element of layerElements) {
                const rect = element.getBoundingClientRect();
                const relativeRect = {
                    left: rect.left - canvasRect.left,
                    top: rect.top - canvasRect.top,
                    right: rect.right - canvasRect.left,
                    bottom: rect.bottom - canvasRect.top
                };
                
                if (x >= relativeRect.left && x <= relativeRect.right && 
                    y >= relativeRect.top && y <= relativeRect.bottom) {
                    const layerId = element.id.replace('canvas-layer-', '');
                    return { id: layerId, type: 'IMAGE_LAYER', element: element };
                }
            }
            
            // 检查标注图层
            const annotationElements = imageCanvas.querySelectorAll('[id^="annotation-svg-"]');
            for (let element of annotationElements) {
                const rect = element.getBoundingClientRect();
                const relativeRect = {
                    left: rect.left - canvasRect.left,
                    top: rect.top - canvasRect.top,
                    right: rect.right - canvasRect.left,
                    bottom: rect.bottom - canvasRect.top
                };
                
                if (x >= relativeRect.left && x <= relativeRect.right && 
                    y >= relativeRect.top && y <= relativeRect.bottom) {
                    const layerId = element.id.replace('annotation-svg-', '');
                    return { id: layerId, type: 'ANNOTATION', element: element };
                }
            }
            
            return null;
        };
        
        // 清除变换状态
        
        // 获取图层元素
        nodeType.prototype.getLayerElement = function(modal, layerId, layerType) {
            
            let element = null;
            if (layerType === 'IMAGE_LAYER' || layerType === 'connected') {
                // 连接图层 - 支持两种类型名称
                element = modal.querySelector(`#canvas-layer-${layerId}`);
                
                // 对于变换操作，返回容器元素（可以移动），而不是内部的img元素
                if (element) {
                    return element; // 返回容器元素，这样可以移动整个图层
                }
            } else if (layerType === 'ANNOTATION' || layerType === 'annotation') {
                // 标注图层 - 查找独立SVG容器，支持两种类型名称
                element = modal.querySelector(`#annotation-svg-${layerId}`);
                
                // 对于标注，我们需要找到SVG内实际的图形元素
                if (element) {
                    const svg = element.querySelector('svg') || element;
                    const shapes = svg.querySelectorAll('path, circle, rect, line, polygon, text');
                    if (shapes.length > 0) {
                        // 返回一个包含所有形状边界的虚拟元素
                        return { 
                            isVirtualElement: true,
                            svgContainer: element,
                            svg: svg,
                            shapes: shapes,
                            getBoundingClientRect: function() {
                                return this.calculateShapesBounds();
                            },
                            calculateShapesBounds: function() {
                                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                                const svgRect = this.svg.getBoundingClientRect();
                                
                                this.shapes.forEach(shape => {
                                    try {
                                        const bbox = shape.getBBox();
                                        if (bbox.width > 0 && bbox.height > 0) {
                                            // 将SVG坐标转换为屏幕坐标
                                            const svgPoint1 = this.svg.createSVGPoint();
                                            const svgPoint2 = this.svg.createSVGPoint();
                                            svgPoint1.x = bbox.x;
                                            svgPoint1.y = bbox.y;
                                            svgPoint2.x = bbox.x + bbox.width;
                                            svgPoint2.y = bbox.y + bbox.height;
                                            
                                            const screenPoint1 = svgPoint1.matrixTransform(this.svg.getScreenCTM());
                                            const screenPoint2 = svgPoint2.matrixTransform(this.svg.getScreenCTM());
                                            
                                            minX = Math.min(minX, screenPoint1.x);
                                            minY = Math.min(minY, screenPoint1.y);
                                            maxX = Math.max(maxX, screenPoint2.x);
                                            maxY = Math.max(maxY, screenPoint2.y);
                                        }
                                    } catch (e) {
                                        // 后备方案：使用getBoundingClientRect
                                        const rect = shape.getBoundingClientRect();
                                        minX = Math.min(minX, rect.left);
                                        minY = Math.min(minY, rect.top);
                                        maxX = Math.max(maxX, rect.right);
                                        maxY = Math.max(maxY, rect.bottom);
                                    }
                                });
                                
                                if (minX === Infinity) {
                                    // 没有找到有效的形状，使用SVG容器边界
                                    return svgRect;
                                }
                                
                                return {
                                    left: minX,
                                    top: minY,
                                    width: maxX - minX,
                                    height: maxY - minY,
                                    right: maxX,
                                    bottom: maxY
                                };
                            }
                        };
                    }
                }
            }
            
            if (element) {
                // Element found - processing completed
            }
            
            return element;
        };
        
        // 获取图层当前变换
        nodeType.prototype.getLayerTransform = function(element) {
            if (!element) return { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 };
            
            const computedStyle = window.getComputedStyle(element);
            const transform = computedStyle.transform;
            
            // 解析transform矩阵
            const defaultTransform = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 };
            
            if (transform === 'none') {
                return defaultTransform;
            }
            
            // 简单解析，实际应用可能需要更复杂的矩阵计算
            return defaultTransform;
        };
    },
    
    // 暴露函数给其他模块使用
    addAnnotationToSVGWithGrouping: function(svg, annotationElement, annotationId) {
        
        // 找到当前的VisualPromptEditor节点实例
        const nodeInstance = window.app?.graph?._nodes?.find(node => node.type === 'VisualPromptEditor');
        if (nodeInstance && typeof nodeInstance.addAnnotationToSVGWithGrouping === 'function') {
            return nodeInstance.addAnnotationToSVGWithGrouping(svg, annotationElement, annotationId);
        } else {
            svg.appendChild(annotationElement);
        }
    }
});


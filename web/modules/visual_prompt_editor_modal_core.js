/**
 * Visual Prompt Editor - 模态弹窗核心功能模块
 * 负责模态弹窗的创建、初始化和核心生命周期管理
 */

import { 
    createMainModal, 
    createTitleBar, 
    createToolbar, 
    createMainArea, 
    createCanvasArea, 
    createPromptArea 
} from './visual_prompt_editor_ui.js';
// Layer system imports removed - using Fabric.js native layer management
// Removed imports for deleted modules - replaced with temporary implementations
// import { createSVGAnnotationCreator } from './visual_prompt_editor_svg_creator.js';
// import { createAnnotationRestorer } from './visual_prompt_editor_annotation_restorer.js';
// import { createAnnotationEventHandler } from './visual_prompt_editor_annotation_events.js';
// import { createTransformControls } from './visual_prompt_editor_transform_controls.js';
import { 
    createDataManager
} from './visual_prompt_editor_data_manager.js';
import { 
    createEventHandlers
} from './visual_prompt_editor_event_handlers.js';
import { 
    initializeTabSwitching
} from './visual_prompt_editor_ui.js';
// Removed import from non-existent visual_prompt_editor_canvas.js
// import { initCanvasDrawing, initZoomAndPanControls } from './visual_prompt_editor_canvas.js';
import { 
    bindPromptEvents
} from './visual_prompt_editor_prompts.js';
// Removed import from non-existent visual_prompt_editor_annotations.js
// import { bindCanvasInteractionEvents, bindTabEvents } from './visual_prompt_editor_annotations.js';
import { 
    initializeLanguageSystem
} from './visual_prompt_editor_language.js';
import { 
    createFabricNativeManager
} from './visual_prompt_editor_fabric_native.js';

/**
 * 创建统一编辑器模态弹窗
 * 从主文件迁移的模态弹窗创建逻辑
 */
export function createUnifiedModal(imageData, layersData, nodeInstance) {
    
    try {
        // 设置当前节点实例到全局，供图像获取函数使用
        window.currentVPENode = nodeInstance;
        window.currentVPEInstance = nodeInstance; // 保存完整实例引用
        
        // 移除已存在的编辑器 (与原始版本一致)
        const existingModal = document.getElementById('unified-editor-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 创建主模态
        const { modal, content } = createMainModal();
        
        // 创建标题栏
        const titleBar = createTitleBar();
        
        // 创建工具栏
        const toolbar = createToolbar();
        
        // 创建主体区域
        const mainArea = createMainArea();
        
        // 创建左侧画布区域
        const { canvasArea, canvasContainer, zoomContainer } = createCanvasArea();
        
        // 创建右侧提示词编辑区域
        const promptArea = createPromptArea();
        
        // 组装界面
        content.appendChild(titleBar);
        content.appendChild(toolbar);
        content.appendChild(mainArea);
        mainArea.appendChild(canvasArea);
        mainArea.appendChild(promptArea);
        
        // 添加到页面
        document.body.appendChild(modal);
        
        // 保存modal引用到实例
        nodeInstance.modal = modal;
        if (window.currentVPEInstance) {
            window.currentVPEInstance.modal = modal;
        }
        
        // 调试：检查模态弹窗的位置和样式
        
        // 初始化核心数据
        modal.annotations = [];
        modal.selectedLayers = new Set();
        modal.drawingState = null;
        modal.transformState = null;
        
        // 保存输入图像数据，用于后续加载
        modal.inputImageData = imageData;
        
        // Layer connection data removed - using Fabric.js objects
        
        return modal;
        
    } catch (error) {
        console.error('Failed to create unified editor modal:', error);
        return null;
    }
}

/**
 * 初始化模态弹窗功能
 * 从主文件迁移的模态弹窗初始化逻辑
 */
export async function initModalFunctionality(modal, layersData, nodeInstance) {
    
    try {
        // Layer system controllers removed - using Fabric.js native management
        
        // 🚀 立即初始化标注系统模块 - using temporary implementations
        try {
            nodeInstance.svgAnnotationCreator = createTemporarySVGAnnotationCreator();
            nodeInstance.annotationRestorer = createTemporaryAnnotationRestorer(nodeInstance);
            nodeInstance.annotationEventHandler = createTemporaryAnnotationEventHandler(nodeInstance);
        } catch (error) {
            console.error('Annotation system modules initialization failed:', error);
        }
        
        // 🚀 立即初始化Fabric.js纯原生系统
        try {
            // 先创建数据管理器
            nodeInstance.dataManager = createDataManager(nodeInstance);
            
            // 获取后端canvas尺寸设置
            const canvasWidth = getBackendCanvasSize(nodeInstance, 'canvas_width', 800);
            const canvasHeight = getBackendCanvasSize(nodeInstance, 'canvas_height', 600);
            
            // 然后创建Fabric管理器，传递数据管理器引用
            nodeInstance.fabricManager = await createFabricNativeManager(modal, nodeInstance.dataManager);
            
            // 初始化时设置画布尺寸
            if (nodeInstance.fabricManager && nodeInstance.fabricManager.setCanvasSize) {
                nodeInstance.fabricManager.setCanvasSize(canvasWidth, canvasHeight);
            }
            
            // 同步到前端控件
            syncCanvasSizeToFrontend(modal, canvasWidth, canvasHeight);
            
            // 如果有输入图像，自动加载为画布图层
            if (modal.inputImageData) {
                setTimeout(() => {
                    loadInputImageAsLayer(nodeInstance.fabricManager, modal.inputImageData);
                }, 300); // 延迟加载确保Fabric画布完全初始化
            }
            
            
            nodeInstance.eventHandlers = createEventHandlers(nodeInstance);
        } catch (error) {
            console.error('Fabric.js and module initialization failed:', error);
        }
        
        // Layer detection removed - using Fabric.js objects only
        
        // 🎯 延迟初始化非关键功能，避免阻塞界面
        setTimeout(() => {
            initializeDelayedFeatures(modal, nodeInstance);
        }, 50);
        
        
    } catch (error) {
        console.error('Modal functionality initialization failed:', error);
    }
}

/**
 * 初始化延迟功能
 * 从主文件迁移的延迟初始化逻辑
 */
function initializeDelayedFeatures(modal, nodeInstance) {
    try {
        
        // 初始化语言系统
        try {
            if (typeof initializeLanguageSystem === 'function') {
                initializeLanguageSystem(modal);
            } else {
            }
        } catch (error) {
            console.error('Language system initialization failed:', error);
        }
        
        // 初始化选项卡切换
        try {
            if (typeof initializeTabSwitching === 'function') {
                initializeTabSwitching(modal);
            } else {
            }
        } catch (error) {
            console.error('Tab switching initialization failed:', error);
        }
        
        // 初始化画布绘制 - temporarily removed due to missing module
        try {
            // initCanvasDrawing(modal);
        } catch (error) {
            console.error('Canvas drawing initialization failed:', error);
        }
        
        // 初始化缩放和平移控制 - temporarily removed due to missing module  
        try {
            // initZoomAndPanControls(modal);
        } catch (error) {
            console.error('Zoom and pan controls initialization failed:', error);
        }
        
        // 绑定提示词事件
        try {
            if (typeof bindPromptEvents === 'function') {
                bindPromptEvents(modal);
            } else {
            }
        } catch (error) {
            console.error('Prompt events binding failed:', error);
        }
        
        // 绑定画布交互事件
        try {
            if (typeof bindCanvasInteractionEvents === 'function') {
                bindCanvasInteractionEvents(modal, nodeInstance);
            } else {
            }
        } catch (error) {
            console.error('Canvas interaction events binding failed:', error);
        }
        
        // 绑定选项卡事件
        try {
            if (typeof bindTabEvents === 'function') {
                bindTabEvents(modal);
            } else {
            }
        } catch (error) {
            console.error('Tab events binding failed:', error);
        }
        
        // 绑定基础界面事件（undo、clear、opacity等按钮）
        try {
            if (nodeInstance.eventHandlers && nodeInstance.eventHandlers.bindBasicEvents) {
                nodeInstance.eventHandlers.bindBasicEvents(modal);
            } else {
            }
        } catch (error) {
            console.error('Basic interface events binding failed:', error);
        }
        
        
    } catch (error) {
        console.error('Delayed features initialization failed:', error);
    }
}

// loadConnectedImageLayers function removed - using Fabric.js objects

/**
 * Initialize Fabric.js layer display only
 */
export function initializeFabricLayerDisplay(modal, nodeInstance) {
    try {
        // Show Fabric objects in layer panel
        showEmptyLayerState(modal);
    } catch (error) {
        console.error('Failed to initialize Fabric layer display:', error);
    }
}

/**
 * Bind Fabric.js layer events
 */
function bindFabricLayerEvents(modal, nodeInstance) {
    try {
        // Bind Fabric object selection events
        bindLayerSelectionEvents(modal, nodeInstance);
    } catch (error) {
        console.error('Failed to bind Fabric layer events:', error);
    }
}

/**
 * 绑定图层选择事件
 * 从主文件迁移的图层选择事件绑定逻辑
 */
function bindLayerSelectionEvents(modal, nodeInstance) {
    try {
        const layersList = modal.querySelector('#layers-list');
        if (!layersList) {
            return;
        }
        
        // 使用事件委托处理图层选择
        layersList.addEventListener('click', (e) => {
            const layerItem = e.target.closest('.layer-list-item');
            if (layerItem) {
                e.stopPropagation();
                
                // 移除其他图层的选中状态
                layersList.querySelectorAll('.layer-list-item').forEach(item => {
                    item.classList.remove('selected');
                    item.style.background = '#2b2b2b';
                });
                
                // 设置当前图层为选中
                layerItem.classList.add('selected');
                layerItem.style.background = '#10b981';
                
                const layerId = layerItem.dataset.layerId;
                const layerType = layerItem.dataset.layerType;
                
                
                // 触发图层选中事件
                const event = new CustomEvent('layerSelected', {
                    detail: { layerId, layerType, layerItem }
                });
                modal.dispatchEvent(event);
            }
        });
        
        
    } catch (error) {
        console.error('Failed to bind layer selection events:', error);
    }
}


/**
 * 显示空图层状态
 * 从主文件迁移的空状态显示逻辑
 */
function showEmptyLayerState(modal) {
    try {
        const layersList = modal.querySelector('#layers-list');
        if (layersList) {
            layersList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #888;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🎨</div>
                    <div style="font-size: 14px; margin-bottom: 8px;">No Fabric Objects</div>
                    <div style="font-size: 12px; color: #666;">
                        Create annotations to see Fabric objects here
                    </div>
                </div>
            `;
        }
        
        
    } catch (error) {
        console.error('Failed to show empty layer state:', error);
    }
}

// Temporary implementations for deleted modules
function createTemporarySVGAnnotationCreator() {
    return {
        createAnnotation: () => {},
        // Add other methods as needed
    };
}

function createTemporaryAnnotationRestorer(nodeInstance) {
    return {
        restoreAnnotations: () => {},
        // Add other methods as needed
    };
}

function createTemporaryAnnotationEventHandler(nodeInstance) {
    return {
        bindEvents: () => {},
        // Add other methods as needed  
    };
}


/**
 * 获取后端画布尺寸设置
 */
function getBackendCanvasSize(nodeInstance, widgetName, defaultValue) {
    try {
        if (nodeInstance && nodeInstance.widgets) {
            const widget = nodeInstance.widgets.find(w => w.name === widgetName);
            if (widget && typeof widget.value === 'number') {
                return widget.value;
            }
        }
        return defaultValue;
    } catch (error) {
        return defaultValue;
    }
}

/**
 * 同步画布尺寸到前端控件
 */
function syncCanvasSizeToFrontend(modal, width, height) {
    try {
        // 更新尺寸输入框
        const widthInput = modal.querySelector('#vpe-canvas-width');
        const heightInput = modal.querySelector('#vpe-canvas-height');
        
        if (widthInput) {
            widthInput.value = width;
        }
        
        if (heightInput) {
            heightInput.value = height;
        }
        
        // 检查是否匹配预设尺寸
        const sizeSelect = modal.querySelector('#vpe-canvas-size');
        if (sizeSelect) {
            const sizeString = `${width}x${height}`;
            const options = Array.from(sizeSelect.options);
            const matchingOption = options.find(option => option.value === sizeString);
            
            if (matchingOption) {
                sizeSelect.value = sizeString;
            } else {
                // 如果不匹配预设，选择"自定义"选项并显示自定义控件
                sizeSelect.value = 'custom';
                const customControls = modal.querySelector('#vpe-custom-size-controls');
                if (customControls) {
                    customControls.style.display = 'flex';
                }
            }
        }
        
        
    } catch (error) {
        console.error('❌ 同步画布尺寸到前端失败:', error);
    }
}

/**
 * 将输入图像加载为Fabric.js图层
 */
function loadInputImageAsLayer(fabricManager, imageData) {
    if (!fabricManager || !fabricManager.fabricCanvas) {
        return;
    }

    if (!imageData) {
        return;
    }

    try {

        // 处理不同格式的图像数据
        let imageUrl = null;

        if (typeof imageData === 'string') {
            // 如果是字符串，可能是base64或URL
            if (imageData.startsWith('data:image/') || imageData.startsWith('http') || imageData.startsWith('/')) {
                imageUrl = imageData;
            }
        } else if (imageData && typeof imageData === 'object') {
            // 如果是对象，尝试提取图像URL
            if (imageData.filename && imageData.subfolder !== undefined) {
                // ComfyUI图像格式
                const subfolder = imageData.subfolder ? `${imageData.subfolder}/` : '';
                imageUrl = `/view?filename=${imageData.filename}&subfolder=${subfolder}&type=input`;
            } else if (imageData.src) {
                imageUrl = imageData.src;
            } else if (imageData.url) {
                imageUrl = imageData.url;
            }
        }

        if (!imageUrl) {
            return;
        }


        // 确保fabric库可用
        if (!window.fabric) {
            console.error('❌ Fabric.js库未加载，无法加载图像');
            return;
        }

        // 使用Fabric.js加载图像
        window.fabric.Image.fromURL(imageUrl, (fabricImage) => {
            if (!fabricImage) {
                console.error('❌ Fabric.js加载图像失败');
                return;
            }

            try {
                // 获取画布尺寸
                const canvasWidth = fabricManager.fabricCanvas.getWidth();
                const canvasHeight = fabricManager.fabricCanvas.getHeight();

                // 获取图像原始尺寸
                const imageWidth = fabricImage.width || fabricImage.getElement().naturalWidth;
                const imageHeight = fabricImage.height || fabricImage.getElement().naturalHeight;

                // 计算合适的缩放比例，保持图像比例并适应画布
                let scaleX = 1;
                let scaleY = 1;

                if (imageWidth > canvasWidth || imageHeight > canvasHeight) {
                    const scaleToFitWidth = canvasWidth / imageWidth;
                    const scaleToFitHeight = canvasHeight / imageHeight;
                    const scale = Math.min(scaleToFitWidth, scaleToFitHeight) * 0.9; // 留一些边距
                    
                    scaleX = scale;
                    scaleY = scale;
                }

                // 计算居中位置
                const scaledWidth = imageWidth * scaleX;
                const scaledHeight = imageHeight * scaleY;
                const centerX = (canvasWidth - scaledWidth) / 2;
                const centerY = (canvasHeight - scaledHeight) / 2;

                // 一次性设置所有属性
                fabricImage.set({
                    left: centerX,
                    top: centerY,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    selectable: true,
                    hasControls: true,
                    hasBorders: true,
                    fabricId: `input_image_${Date.now()}`,
                    name: 'Input Image'
                });

                // 添加到画布
                fabricManager.fabricCanvas.add(fabricImage);
                
                // 渲染画布
                fabricManager.fabricCanvas.renderAll();

                // 延迟设置选中状态和更新坐标，确保完全渲染完成
                requestAnimationFrame(() => {
                    // 强制更新对象坐标和控制点
                    fabricImage.setCoords();
                    
                    // 设置为选中状态
                    fabricManager.fabricCanvas.setActiveObject(fabricImage);
                    
                    // 再次强制更新所有对象的坐标
                    fabricManager.fabricCanvas.forEachObject(obj => obj.setCoords());
                    
                    // 最终渲染
                    fabricManager.fabricCanvas.renderAll();
                    
                });

                // 更新图层面板
                if (fabricManager.updateLayerPanel) {
                    fabricManager.updateLayerPanel();
                }

                // 触发自动保存
                if (fabricManager._scheduleAutoSave) {
                    fabricManager._scheduleAutoSave();
                }


            } catch (error) {
                console.error('❌ 设置Fabric图像属性时出错:', error);
            }

        }, {
            // 图像加载选项
            crossOrigin: 'anonymous'
        });

    } catch (error) {
        console.error('❌ 加载输入图像失败:', error);
    }
}


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
import { 
    createLayerSystemCore,
    createLayerListManager
} from './visual_prompt_editor_layer_system.js';
import { 
    createLayerVisibilityController
} from './visual_prompt_editor_layer_visibility.js';
import { 
    createLayerOrderController
} from './visual_prompt_editor_layer_order.js';
import { 
    createSVGAnnotationCreator
} from './visual_prompt_editor_svg_creator.js';
import { 
    createAnnotationRestorer
} from './visual_prompt_editor_annotation_restorer.js';
import { 
    createAnnotationEventHandler
} from './visual_prompt_editor_annotation_events.js';
import { 
    createTransformControls
} from './visual_prompt_editor_transform_controls.js';
import { 
    createDataManager
} from './visual_prompt_editor_data_manager.js';
import { 
    createEventHandlers
} from './visual_prompt_editor_event_handlers.js';
import { 
    initializeTabSwitching
} from './visual_prompt_editor_ui.js';
import { 
    initCanvasDrawing, 
    initZoomAndPanControls
} from './visual_prompt_editor_canvas.js';
import { 
    bindPromptEvents
} from './visual_prompt_editor_prompts.js';
import { 
    bindCanvasInteractionEvents,
    bindTabEvents
} from './visual_prompt_editor_annotations.js';
import { 
    initializeLanguageSystem
} from './visual_prompt_editor_language.js';

/**
 * 创建统一编辑器模态弹窗
 * 从主文件迁移的模态弹窗创建逻辑
 */
export function createUnifiedModal(imageData, layersData, nodeInstance) {
    console.log('🎯 开始创建统一编辑器模态弹窗...');
    
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
        console.log('🎯 模态弹窗已添加到页面');
        console.log('📐 模态弹窗样式:', {
            position: modal.style.position,
            zIndex: modal.style.zIndex,
            display: modal.style.display
        });
        
        // 初始化核心数据
        modal.annotations = [];
        modal.selectedLayers = new Set();
        modal.drawingState = null;
        modal.transformState = null;
        
        // 设置图层数据
        if (layersData && layersData.length > 0) {
            nodeInstance.connectedImageLayers = layersData;
            console.log('📊 设置图层数据:', layersData.length, '个图层');
        }
        
        console.log('✅ 统一编辑器模态弹窗创建完成');
        return modal;
        
    } catch (error) {
        console.error('❌ 创建统一编辑器模态弹窗失败:', error);
        return null;
    }
}

/**
 * 初始化模态弹窗功能
 * 从主文件迁移的模态弹窗初始化逻辑
 */
export function initModalFunctionality(modal, layersData, nodeInstance) {
    console.log('🚀 开始初始化模态弹窗功能...');
    
    try {
        // 🚀 立即初始化关键模块控制器（不延迟）
        try {
            nodeInstance.layerSystemCore = createLayerSystemCore(nodeInstance);
            nodeInstance.layerListManager = createLayerListManager(nodeInstance, nodeInstance.layerSystemCore);
            nodeInstance.layerVisibilityController = createLayerVisibilityController(nodeInstance);
            nodeInstance.layerOrderController = createLayerOrderController(nodeInstance);
            console.log('✅ 关键模块控制器初始化完成');
        } catch (error) {
            console.error('❌ 关键模块控制器初始化失败:', error);
        }
        
        // 🚀 立即初始化标注系统模块
        try {
            nodeInstance.svgAnnotationCreator = createSVGAnnotationCreator();
            nodeInstance.annotationRestorer = createAnnotationRestorer(nodeInstance);
            nodeInstance.annotationEventHandler = createAnnotationEventHandler(nodeInstance);
            console.log('✅ 标注系统模块初始化完成');
        } catch (error) {
            console.error('❌ 标注系统模块初始化失败:', error);
        }
        
        // 🚀 立即初始化变换控制和数据管理模块
        try {
            nodeInstance.transformControls = createTransformControls(nodeInstance);
            nodeInstance.dataManager = createDataManager(nodeInstance);
            nodeInstance.eventHandlers = createEventHandlers(nodeInstance);
            console.log('✅ 变换控制和数据管理模块初始化完成');
        } catch (error) {
            console.error('❌ 变换控制和数据管理模块初始化失败:', error);
        }
        
        // 🎯 主动检测连接的图层数据
        console.log('🔍 开始主动检测连接图层...');
        
        // 使用图层系统核心检测连接的图层
        if (nodeInstance.layerSystemCore) {
            const detectedLayers = nodeInstance.layerSystemCore.detectConnectedImageLayers();
            if (detectedLayers && detectedLayers.length > 0) {
                nodeInstance.connectedImageLayers = detectedLayers;
                console.log('📊 主动检测到图层数据:', detectedLayers.length, '个图层');
            }
        }
        
        // 检查多种可能的图层数据来源
        const layerSources = [
            nodeInstance.connectedImageLayers,
            layersData,
            nodeInstance.getInputData ? nodeInstance.getInputData(1) : null
        ].filter(source => source && Array.isArray(source) && source.length > 0);
        
        if (layerSources.length > 0) {
            const layers = layerSources[0];
            nodeInstance.connectedImageLayers = layers;
            console.log('📊 最终检测到图层数据，开始加载:', layers.length, '个图层');
            
            // 🔒 关键修复：持久化缓存图层数据，防止后续操作中丢失
            nodeInstance._persistentConnectedLayers = JSON.parse(JSON.stringify(layers));
            modal._persistentConnectedLayers = JSON.parse(JSON.stringify(layers));
            console.log('🔒 图层数据已持久化缓存');
            
            setTimeout(() => {
                loadConnectedImageLayers(modal, nodeInstance);
            }, 100);
        } else {
            console.log('📝 没有检测到连接的图层数据');
        }
        
        // 🎯 延迟初始化非关键功能，避免阻塞界面
        setTimeout(() => {
            initializeDelayedFeatures(modal, nodeInstance);
        }, 50);
        
        console.log('✅ 模态弹窗功能初始化完成');
        
    } catch (error) {
        console.error('❌ 模态弹窗功能初始化失败:', error);
    }
}

/**
 * 初始化延迟功能
 * 从主文件迁移的延迟初始化逻辑
 */
function initializeDelayedFeatures(modal, nodeInstance) {
    try {
        console.log('🔄 开始初始化延迟功能...');
        
        // 初始化语言系统
        try {
            if (typeof initializeLanguageSystem === 'function') {
                initializeLanguageSystem(modal);
                console.log('✅ 语言系统初始化完成');
            } else {
                console.warn('⚠️ initializeLanguageSystem 函数不可用');
            }
        } catch (error) {
            console.error('❌ 语言系统初始化失败:', error);
        }
        
        // 初始化选项卡切换
        try {
            if (typeof initializeTabSwitching === 'function') {
                initializeTabSwitching(modal);
                console.log('✅ 选项卡切换初始化完成');
            } else {
                console.warn('⚠️ initializeTabSwitching 函数不可用');
            }
        } catch (error) {
            console.error('❌ 选项卡切换初始化失败:', error);
        }
        
        // 初始化画布绘制
        try {
            if (typeof initCanvasDrawing === 'function') {
                initCanvasDrawing(modal);
                console.log('✅ 画布绘制初始化完成');
            } else {
                console.warn('⚠️ initCanvasDrawing 函数不可用');
            }
        } catch (error) {
            console.error('❌ 画布绘制初始化失败:', error);
        }
        
        // 初始化缩放和平移控制
        try {
            if (typeof initZoomAndPanControls === 'function') {
                initZoomAndPanControls(modal);
                console.log('✅ 缩放平移控制初始化完成');
            } else {
                console.warn('⚠️ initZoomAndPanControls 函数不可用');
            }
        } catch (error) {
            console.error('❌ 缩放平移控制初始化失败:', error);
        }
        
        // 绑定提示词事件
        try {
            if (typeof bindPromptEvents === 'function') {
                bindPromptEvents(modal);
                console.log('✅ 提示词事件绑定完成');
            } else {
                console.warn('⚠️ bindPromptEvents 函数不可用');
            }
        } catch (error) {
            console.error('❌ 提示词事件绑定失败:', error);
        }
        
        // 绑定画布交互事件
        try {
            if (typeof bindCanvasInteractionEvents === 'function') {
                bindCanvasInteractionEvents(modal, nodeInstance);
                console.log('✅ 画布交互事件绑定完成');
            } else {
                console.warn('⚠️ bindCanvasInteractionEvents 函数不可用');
            }
        } catch (error) {
            console.error('❌ 画布交互事件绑定失败:', error);
        }
        
        // 绑定选项卡事件
        try {
            if (typeof bindTabEvents === 'function') {
                bindTabEvents(modal);
                console.log('✅ 选项卡事件绑定完成');
            } else {
                console.warn('⚠️ bindTabEvents 函数不可用');
            }
        } catch (error) {
            console.error('❌ 选项卡事件绑定失败:', error);
        }
        
        // 绑定基础界面事件（undo、clear、opacity等按钮）
        try {
            if (nodeInstance.eventHandlers && nodeInstance.eventHandlers.bindBasicEvents) {
                nodeInstance.eventHandlers.bindBasicEvents(modal);
                console.log('✅ 基础界面事件绑定完成');
            } else {
                console.warn('⚠️ eventHandlers.bindBasicEvents 不可用');
            }
        } catch (error) {
            console.error('❌ 基础界面事件绑定失败:', error);
        }
        
        console.log('✅ 延迟功能初始化完成');
        
    } catch (error) {
        console.error('❌ 延迟功能初始化失败:', error);
    }
}

/**
 * 加载连接的图像图层
 * 从主文件迁移的图层加载逻辑
 */
function loadConnectedImageLayers(modal, nodeInstance) {
    try {
        console.log('📊 开始加载连接的图像图层...');
        
        if (!nodeInstance.connectedImageLayers || nodeInstance.connectedImageLayers.length === 0) {
            console.log('📝 没有连接的图像图层需要加载');
            return;
        }
        
        console.log(`📊 正在加载 ${nodeInstance.connectedImageLayers.length} 个图像图层...`);
        
        // 使用图层列表管理器加载图层
        if (nodeInstance.layerListManager) {
            nodeInstance.layerListManager.updateLayerList(modal);
        }
        
        // 更新画布显示
        if (nodeInstance.layerSystemCore && nodeInstance.layerSystemCore.setupLayerCanvasDisplay) {
            nodeInstance.layerSystemCore.setupLayerCanvasDisplay(modal);
        }
        
        console.log('✅ 连接的图像图层加载完成');
        
    } catch (error) {
        console.error('❌ 加载连接的图像图层失败:', error);
    }
}

/**
 * 初始化集成图层系统
 * 从主文件迁移的图层系统初始化逻辑
 */
export function initializeIntegratedLayerSystem(modal, nodeInstance) {
    console.log('🎨 初始化集成图层系统...');
    
    try {
        // 检查是否有连接的图像图层
        if (nodeInstance.connectedImageLayers && nodeInstance.connectedImageLayers.length > 0) {
            console.log('📊 检测到', nodeInstance.connectedImageLayers.length, '个连接图层');
            
            // 使用图层列表管理器初始化
            if (nodeInstance.layerListManager) {
                nodeInstance.layerListManager.initializeLayerList(modal);
                console.log('✅ 图层列表管理器初始化完成');
            }
            
            // 设置画布显示
            if (nodeInstance.setupLayerCanvasDisplay) {
                nodeInstance.setupLayerCanvasDisplay(modal);
                console.log('✅ 图层画布显示设置完成');
            }
            
            // 绑定图层事件
            bindIntegratedLayerEvents(modal, nodeInstance);
            
        } else {
            console.log('📝 没有连接的图像图层，显示空状态');
            showEmptyLayerState(modal);
        }
        
        console.log('✅ 集成图层系统初始化完成');
        
    } catch (error) {
        console.error('❌ 初始化集成图层系统失败:', error);
    }
}

/**
 * 绑定集成图层事件
 * 从主文件迁移的图层事件绑定逻辑
 */
function bindIntegratedLayerEvents(modal, nodeInstance) {
    try {
        console.log('🔗 绑定集成图层事件...');
        console.log('🔍 bindIntegratedLayerEvents被调用，modal:', !!modal, 'nodeInstance:', !!nodeInstance);
        
        // 绑定图层可见性事件
        if (nodeInstance.bindLayerVisibilityEvents) {
            nodeInstance.bindLayerVisibilityEvents(modal);
        }
        
        // 绑定图层顺序事件
        if (nodeInstance.bindLayerOrderEvents) {
            nodeInstance.bindLayerOrderEvents(modal);
        }
        
        // 绑定图层选择事件
        bindLayerSelectionEvents(modal, nodeInstance);
        
        // 绑定Transform按钮事件
        bindTransformButtonEvents(modal, nodeInstance);
        
        console.log('✅ 集成图层事件绑定完成');
        
    } catch (error) {
        console.error('❌ 绑定集成图层事件失败:', error);
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
            console.warn('⚠️ 找不到图层列表容器');
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
                
                console.log(`🎯 选中图层: ${layerId} (${layerType})`);
                
                // 触发图层选中事件
                const event = new CustomEvent('layerSelected', {
                    detail: { layerId, layerType, layerItem }
                });
                modal.dispatchEvent(event);
            }
        });
        
        console.log('✅ 图层选择事件绑定完成');
        
    } catch (error) {
        console.error('❌ 绑定图层选择事件失败:', error);
    }
}

/**
 * 绑定Transform按钮事件
 * 从主文件迁移的Transform按钮事件绑定逻辑
 */
function bindTransformButtonEvents(modal, nodeInstance) {
    try {
        console.log('🔄 绑定Transform按钮事件...');
        
        const transformBtn = modal.querySelector('#vpe-transform-mode');
        console.log('🔍 Transform按钮查找结果:', transformBtn);
        
        if (transformBtn) {
            console.log('✅ Transform按钮找到，绑定事件');
            // 初始化变换模式状态
            modal.transformModeActive = false;
            
            transformBtn.onclick = () => {
                console.log('🔄 Transform按钮被点击!');
                modal.transformModeActive = !modal.transformModeActive;
                
                if (modal.transformModeActive) {
                    // 激活变换模式
                    transformBtn.style.background = '#10b981';
                    transformBtn.style.color = 'white';
                    transformBtn.textContent = '🔄 Transform ON';
                    console.log('✅ 变换模式已激活 - 点击图层元素来变换');
                    
                    // 🔧 清除当前变换状态（使用新的变换控制模块）
                    if (nodeInstance.transformControls) {
                        nodeInstance.transformControls.clearTransformState(modal);
                    }
                    
                    // 🔧 显示提示信息（使用新的变换控制模块）
                    if (nodeInstance.transformControls) {
                        nodeInstance.transformControls.showTransformModeHint(modal);
                    }
                } else {
                    // 关闭变换模式
                    transformBtn.style.background = '#444';
                    transformBtn.style.color = '#ccc';
                    transformBtn.textContent = '🔄 Transform';
                    console.log('❌ 变换模式已关闭');
                    
                    // 🔧 清除变换状态和提示（使用新的变换控制模块）
                    if (nodeInstance.transformControls) {
                        nodeInstance.transformControls.clearTransformState(modal);
                        nodeInstance.transformControls.hideTransformModeHint(modal);
                    }
                }
            };
        } else {
            console.error('❌ Transform按钮未找到! ID: #vpe-transform-mode');
            console.log('📋 可用的按钮:', modal.querySelectorAll('button'));
        }
        
    } catch (error) {
        console.error('❌ 绑定Transform按钮事件失败:', error);
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
                    <div style="font-size: 48px; margin-bottom: 16px;">📂</div>
                    <div style="font-size: 14px; margin-bottom: 8px;">暂无图层</div>
                    <div style="font-size: 12px; color: #666;">
                        创建标注后将自动显示图层
                    </div>
                </div>
            `;
        }
        
        console.log('📝 空图层状态显示完成');
        
    } catch (error) {
        console.error('❌ 显示空图层状态失败:', error);
    }
}

console.log('📦 模态弹窗核心功能模块已加载');
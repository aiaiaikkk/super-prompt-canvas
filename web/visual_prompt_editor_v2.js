/**
 * Visual Prompt Editor - 主入口文件 (模块化版本)
 * 可视化提示词编辑器统一前端 - 重构为模块化架构
 * 
 * 核心功能：双击打开模态弹窗，左侧图形标注区，右侧结构化提示词编辑区
 */

import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

// 导入模块
import { KontextUtils } from './modules/visual_prompt_editor_utils.js';
import { 
    createMainModal, 
    createTitleBar, 
    createToolbar, 
    createMainArea, 
    createCanvasArea, 
    createPromptArea,
    showControlInfo
} from './modules/visual_prompt_editor_ui.js';
import { 
    initCanvasDrawing, 
    initZoomAndPanControls, 
    renderImageCanvas, 
    setActiveTool,
    updateSVGViewBox
} from './modules/visual_prompt_editor_canvas.js';
import { 
    bindCanvasInteractionEvents,
    updateObjectSelector,
    bindTabEvents
} from './modules/visual_prompt_editor_annotations.js';
import { 
    bindPromptEvents, 
    showPromptQualityAnalysis,
    exportPromptData
} from './modules/visual_prompt_editor_prompts.js';
import { 
    initializeLanguageSystem,
    updateCompleteUI
} from './modules/visual_prompt_editor_language.js';

console.log("🌐 Loading Visual Prompt Editor extension (Modular Version)...");

// 测试模块导入
console.log("🔍 Testing module imports:");
console.log("KontextUtils:", typeof KontextUtils);
console.log("createMainModal:", typeof createMainModal);
console.log("initCanvasDrawing:", typeof initCanvasDrawing);
console.log("bindCanvasInteractionEvents:", typeof bindCanvasInteractionEvents);

app.registerExtension({
    name: "Kontext.VisualPromptEditor.V2",
    
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        console.log("🔍 Checking node:", nodeData.name, "Type:", typeof nodeType);
        if (nodeData.name === "VisualPromptEditor") {
            console.log("🎨 Registering Visual Prompt Editor Node (V2)");
            console.log("🎨 NodeType prototype:", nodeType.prototype);
            console.log("🎨 Original onDblClick:", typeof nodeType.prototype.onDblClick);
            
            // 添加节点创建时的回调
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                console.log("🎨 VisualPromptEditor node created!");
                const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
                
                // 设置节点样式
                this.color = "#673AB7";
                this.bgcolor = "#512DA8";
                
                // 清理的节点状态显示
                this.addWidget("text", "editor_status", "Visual Editor Ready", () => {}, {
                    serialize: false
                });
                
                // 监听双击事件
                console.log("🎨 Setting up double-click handler for node:", this.id);
                const originalOnDblClick = this.onDblClick;
                console.log("🎨 Original onDblClick:", typeof originalOnDblClick);
                
                this.onDblClick = function(event) {
                    console.log("🎨 Visual Prompt Editor V2 double-clicked!");
                    console.log("🎨 Node type:", this.constructor.name);
                    console.log("🎨 Event:", event);
                    
                    // 阻止默认行为
                    if (event) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    
                    // 打开我们的编辑器
                    this.openUnifiedEditor();
                    
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
                            countWidget.value = `${metadata.selected_count} objects selected`;
                        }
                        
                    } catch (e) {
                        console.log("Could not parse editor metadata");
                    }
                }
                
                return r;
            };
            
            // 从LoadImage节点获取图像 - 需要在调用前定义
            nodeType.prototype.getImageFromLoadImageNode = function(loadImageNode) {
                try {
                    console.log('🔍 分析LoadImage节点:', {
                        hasWidgets: !!loadImageNode.widgets,
                        widgetCount: loadImageNode.widgets?.length,
                        hasImgs: !!loadImageNode.imgs,
                        imgCount: loadImageNode.imgs?.length
                    });
                    
                    // 方法1: 从imgs属性获取
                    if (loadImageNode.imgs && loadImageNode.imgs.length > 0) {
                        const imgSrc = loadImageNode.imgs[0].src;
                        console.log('✅ 从imgs获取图像源:', imgSrc?.substring(0, 50) + '...');
                        return imgSrc;
                    }
                    
                    // 方法2: 从widgets获取文件名
                    if (loadImageNode.widgets) {
                        for (let widget of loadImageNode.widgets) {
                            console.log('🔍 检查widget:', widget.name, widget.type);
                            if (widget.name === 'image' && widget.value) {
                                // 构建正确的图像URL - 使用ComfyUI标准格式
                                const filename = widget.value;
                                const imageUrl = `/view?filename=${encodeURIComponent(filename)}&subfolder=&type=input`;
                                console.log('✅ 从widget构建图像URL:', imageUrl);
                                return imageUrl;
                            }
                        }
                    }
                    
                    console.log('❌ 无法从LoadImage节点获取图像');
                    return null;
                } catch (e) {
                    console.error('获取LoadImage图像时出错:', e);
                    return null;
                }
            };
            
            // 从其他节点获取图像 - 需要在调用前定义  
            nodeType.prototype.tryGetImageFromNode = function(sourceNode) {
                try {
                    console.log('🔍 尝试从节点获取图像:', sourceNode.type);
                    
                    // 检查是否有图像输出
                    if (sourceNode.imgs && sourceNode.imgs.length > 0) {
                        return sourceNode.imgs[0].src;
                    }
                    
                    // 检查widgets
                    if (sourceNode.widgets) {
                        for (let widget of sourceNode.widgets) {
                            if ((widget.name === 'image' || widget.name === 'filename') && widget.value) {
                                return `/view?filename=${encodeURIComponent(widget.value)}`;
                            }
                        }
                    }
                    
                    console.log('❌ 无法从节点获取图像:', sourceNode.type);
                    return null;
                } catch (e) {
                    console.error('从节点获取图像时出错:', e);
                    return null;
                }
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
            nodeType.prototype.openUnifiedEditor = function() {
                console.log("🎨 Opening Unified Visual Prompt Editor V2...");
                
                // 尝试多种方式获取输入数据
                let imageData = null;
                let layersData = null;
                
                try {
                    // 方法1：从输入连接获取
                    if (this.inputs && this.inputs.length > 0) {
                        const imageInput = this.inputs[0];
                        const layersInput = this.inputs[1];
                        
                        console.log('🔍 检查输入连接:', {
                            imageInput: !!imageInput,
                            imageInputLink: imageInput?.link,
                            layersInput: !!layersInput,
                            layersInputLink: layersInput?.link
                        });
                        
                        if (imageInput && imageInput.link) {
                            // 尝试通过链接追踪获取图像数据
                            const linkId = imageInput.link;
                            const graph = app.graph;
                            
                            console.log('🔗 追踪图像链接:', { linkId, hasGraph: !!graph });
                            
                            if (graph && graph.links && graph.links[linkId]) {
                                const link = graph.links[linkId];
                                const sourceNode = graph.getNodeById(link.origin_id);
                                
                                console.log('🔍 源节点信息:', {
                                    hasSourceNode: !!sourceNode,
                                    nodeType: sourceNode?.type,
                                    nodeTitle: sourceNode?.title,
                                    outputSlot: link.origin_slot
                                });
                                
                                if (sourceNode) {
                                    // 尝试获取LoadImage节点的图像
                                    if (sourceNode.type === 'LoadImage') {
                                        imageData = this.getImageFromLoadImageNode(sourceNode);
                                        console.log('🖼️ 从LoadImage节点获取图像:', !!imageData);
                                    } else {
                                        // 尝试从其他节点获取
                                        console.log('🔍 尝试从其他节点类型获取图像:', sourceNode.type);
                                        imageData = this.tryGetImageFromNode(sourceNode);
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
                        console.log('⚠️ 未从输入连接获取到图像，尝试从widget获取');
                        imageData = this.getImageFromWidget();
                    } else {
                        console.log('✅ 使用输入连接的图像数据');
                    }
                    
                } catch (e) {
                    console.log('获取输入数据时出错:', e);
                }
                
                // 方法3：从节点widget加载已保存的annotation数据（用于持久化）
                try {
                    const annotationDataWidget = this.widgets?.find(w => w.name === "annotation_data");
                    if (annotationDataWidget && annotationDataWidget.value) {
                        console.log('🔍 从widget加载已保存的annotation数据:', annotationDataWidget.value.length, '字符');
                        
                        // 先看原始数据
                        console.log('🔍 原始保存的数据结构:', annotationDataWidget.value.substring(0, 500) + '...');
                        
                        const savedData = JSON.parse(annotationDataWidget.value);
                        console.log('🔍 解析后的数据结构:', savedData);
                        
                        if (savedData && savedData.annotations && savedData.annotations.length > 0) {
                            layersData = savedData.annotations;
                            console.log('✅ 成功加载', layersData.length, '个已保存的annotations');
                            
                            // 详细检查每个annotation的结构并修复数据
                            layersData = layersData.map((annotation, index) => {
                                console.log(`🔍 Annotation ${index + 1} 原始结构:`, {
                                    id: annotation.id,
                                    type: annotation.type,
                                    color: annotation.color,
                                    geometry: annotation.geometry,
                                    hasCoordinates: !!(annotation.coordinates),
                                    hasStart: !!(annotation.start),
                                    hasEnd: !!(annotation.end),
                                    hasArea: !!(annotation.area),
                                    allKeys: Object.keys(annotation)
                                });
                                
                                // 修复annotation数据结构
                                const fixedAnnotation = this.normalizeAnnotationData(annotation);
                                console.log(`🔧 Annotation ${index + 1} 修复后结构:`, {
                                    id: fixedAnnotation.id,
                                    type: fixedAnnotation.type,
                                    color: fixedAnnotation.color,
                                    geometry: fixedAnnotation.geometry,
                                    hasGeometry: !!fixedAnnotation.geometry,
                                    hasCoordinates: !!(fixedAnnotation.geometry && fixedAnnotation.geometry.coordinates)
                                });
                                
                                return fixedAnnotation;
                            });
                            
                            console.log('✅ 已修复所有annotation数据结构');
                        }
                    } else {
                        console.log('🔍 未找到已保存的annotation数据或数据为空');
                    }
                } catch (e) {
                    console.log('❌ 加载已保存annotation数据时出错:', e);
                }
                
                // 创建模态弹窗
                console.log('🚀 即将创建统一模态弹窗...');
                this.createUnifiedModal(imageData, layersData);
            };
            
            // 创建统一模态弹窗
            nodeType.prototype.createUnifiedModal = function(imageData, layersData) {
                console.log('🎨🎨🎨 创建统一模态弹窗 V2 开始 🎨🎨🎨');
                console.log('📊 输入数据:', { imageData: !!imageData, layersData: !!layersData });
                
                // 设置当前节点实例到全局，供图像获取函数使用
                window.currentVPENode = this;
                console.log('📍 Set current VPE node instance for image acquisition');
                
                // 移除已存在的编辑器 (与原始版本一致)
                const existingModal = document.getElementById('unified-editor-modal');
                if (existingModal) {
                    existingModal.remove();
                    console.log('🗑️ 移除现有模态弹窗');
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
                
                // 调试：检查模态弹窗的位置和样式
                console.log('🎯 模态弹窗已添加到页面');
                console.log('📐 模态弹窗样式:', {
                    position: modal.style.position,
                    top: modal.style.top,
                    left: modal.style.left,
                    zIndex: modal.style.zIndex,
                    display: modal.style.display
                });
                console.log('📏 模态弹窗位置:', modal.getBoundingClientRect());
                
                // 初始化画布
                const imageCanvas = document.createElement('div');
                imageCanvas.id = 'image-canvas';
                imageCanvas.style.cssText = 'position: relative; display: inline-block;';
                zoomContainer.appendChild(imageCanvas);
                
                // 渲染图像
                console.log('🖼️ 渲染图像数据:', { 
                    hasImageData: !!imageData, 
                    imageDataType: typeof imageData,
                    imageDataLength: imageData?.length,
                    imageDataValue: imageData 
                });
                
                // 调试：检查节点的输入连接状态
                console.log('🔗 节点连接状态调试:', {
                    hasInputs: !!this.inputs,
                    inputCount: this.inputs?.length || 0,
                    imageInputConnected: this.inputs?.[0]?.link !== null,
                    nodeType: this.type,
                    nodeId: this.id
                });
                
                renderImageCanvas(imageCanvas, imageData, this);
                
                // 添加初始化标记，等待modal就绪后初始化
                canvasContainer.dataset.needsInit = 'true';
                
                console.log('🔎 VPE标注区域初始化检查:');
                console.log('- 图像容器ID:', imageCanvas?.id || 'undefined');
                console.log('- 缩放容器ID:', zoomContainer?.id || 'undefined');
                console.log('- 画布容器ID:', canvasContainer?.id || 'undefined');
                
                // 显示控制信息
                showControlInfo(modal);
                
                // 初始化功能模块
                this.initModalFunctionality(modal, layersData);
            };
            
            // 初始化模态弹窗功能
            nodeType.prototype.initModalFunctionality = function(modal, layersData) {
                console.log('🔧 初始化模态弹窗功能 V2');
                
                // 初始化语言系统 - 在所有UI元素创建完成后立即初始化
                setTimeout(() => {
                    console.log('🌐 初始化语言系统...');
                    try {
                        initializeLanguageSystem(modal);
                        console.log('✅ 语言系统初始化完成');
                    } catch (error) {
                        console.error('❌ 语言系统初始化失败:', error);
                    }
                }, 50);
                
                // 初始化画布绘制 - 延长时间确保DOM完全就绪
                setTimeout(() => {
                    console.log('🎨 开始初始化画布绘制...');
                    initCanvasDrawing(modal);
                    
                    // 初始化缩放和拖拽控制
                    const { setZoom, currentZoom } = initZoomAndPanControls(modal);
                    modal.setZoom = setZoom;
                    modal.currentZoom = currentZoom();
                    
                    console.log('🔧 VPE初始化缩放值:', modal.currentZoom);
                    
                    // 设置删除函数到modal对象，供canvas模块使用（避免循环依赖）
                    modal.deleteAnnotation = (modal, annotation) => {
                        try {
                            // 从数组中移除
                            const index = modal.annotations.findIndex(ann => ann.id === annotation.id);
                            if (index !== -1) {
                                modal.annotations.splice(index, 1);
                            }
                            
                            // 从SVG中移除
                            const svg = modal.querySelector('#drawing-layer svg');
                            if (svg) {
                                const shapeElement = svg.querySelector(`[data-annotation-id="${annotation.id}"]`);
                                if (shapeElement) {
                                    shapeElement.remove();
                                }
                                
                                // 移除相关标签
                                const labels = svg.querySelectorAll(`[data-annotation-number="${annotation.number}"]`);
                                labels.forEach(label => label.remove());
                            }
                            
                            console.log('✅ 标注已删除:', annotation.id);
                        } catch (e) {
                            console.error('❌ 删除标注失败:', e);
                        }
                    };
                    
                    // 再延迟一点绑定交互事件，确保画布完全就绪
                    setTimeout(() => {
                        console.log('🎨 绑定画布交互事件...');
                        bindCanvasInteractionEvents(modal);
                    }, 50);
                }, 200);
                
                // 绑定提示词相关事件 - 延迟以确保DOM完全初始化
                setTimeout(() => {
                    console.log('🎨 绑定提示词事件...');
                    bindPromptEvents(modal, this.getObjectInfo);
                }, 100);
                
                // 绑定基础事件
                this.bindBasicEvents(modal);
                
                // 绑定标签页事件
                bindTabEvents(modal);
                
                // 加载图层数据 - 延迟以确保DOM完全初始化
                setTimeout(() => {
                    console.log('🔍 DEBUG: About to load layers to panel...');
                    console.log('🔍 layersData:', layersData);
                    console.log('🔍 Modal elements with IDs:', Array.from(modal.querySelectorAll('*[id]')).map(el => el.id));
                    
                    // 🔧 临时修复：直接定义函数（如果不存在）
                    if (!this.loadLayersToPanel) {
                        this.loadLayersToPanel = function(modal, layersData) {
                            console.log('📊 加载图层到面板:', layersData.length, '个图层');
                            
                            const annotationObjects = modal.querySelector('#annotation-objects');
                            if (!annotationObjects) {
                                console.warn('⚠️ 未找到annotation-objects容器');
                                return;
                            }
                            
                            // 清空现有内容
                            annotationObjects.innerHTML = '';
                            
                            if (!layersData || layersData.length === 0) {
                                annotationObjects.innerHTML = '<p style="color: #888; font-style: italic; text-align: center; padding: 20px;">No annotations to display</p>';
                                return;
                            }
                            
                            // 为每个图层创建条目
                            layersData.forEach((layer, index) => {
                                const layerItem = document.createElement('div');
                                layerItem.className = 'layer-item';
                                layerItem.style.cssText = `
                                    display: flex; align-items: center; padding: 8px; margin-bottom: 4px;
                                    background: #2b2b2b; border-radius: 4px; cursor: pointer;
                                    border: 1px solid #444;
                                `;
                                
                                // 生成图层描述
                                const layerInfo = this.generateLayerDescription ? this.generateLayerDescription(layer, index) : {
                                    icon: '🔶',
                                    description: `${layer.type} annotation ${index + 1}`
                                };
                                
                                layerItem.innerHTML = `
                                    <input type="checkbox" data-annotation-id="${layer.id}" data-layer-id="${layer.id}" 
                                           style="margin-right: 8px; cursor: pointer;">
                                    <span style="font-size: 12px; color: #ddd;">
                                        ${layerInfo.icon} ${layerInfo.description}
                                    </span>
                                `;
                                
                                annotationObjects.appendChild(layerItem);
                            });
                            
                            console.log('✅ 图层面板加载完成');
                        };
                    }
                    
                    if (!this.updatePromptStats) {
                        this.updatePromptStats = function(modal, layersData) {
                            console.log('📊 更新提示词统计:', layersData.length, '个图层');
                            
                            const selectionCount = modal.querySelector('#selection-count');
                            if (selectionCount) {
                                selectionCount.textContent = `${layersData.length} annotations`;
                            }
                            
                            console.log('📊 统计信息:', {
                                totalAnnotations: layersData.length,
                                rectangles: layersData.filter(l => l.type === 'rectangle').length,
                                circles: layersData.filter(l => l.type === 'circle').length,
                                arrows: layersData.filter(l => l.type === 'arrow').length,
                                freehand: layersData.filter(l => l.type === 'freehand').length,
                                brush: layersData.filter(l => l.type === 'brush').length
                            });
                        };
                    }
                    
                    if (layersData) {
                        this.loadLayersToPanel(modal, layersData);
                        this.updatePromptStats(modal, layersData);
                        
                        // 如果有保存的annotations，需要恢复到canvas
                        if (Array.isArray(layersData) && layersData.length > 0) {
                            console.log('🎨 恢复保存的annotations到canvas...');
                            // 🔧 保存this引用，避免在setTimeout中丢失上下文
                            const nodeInstance = this;
                            // 🔧 增加延迟到500ms，确保画布初始化、事件绑定都完成
                            setTimeout(() => {
                                nodeInstance.restoreAnnotationsToCanvas.call(nodeInstance, modal, layersData);
                                // 恢复后重新更新图层面板状态
                                nodeInstance.refreshLayerPanelState(modal);
                            }, 500);
                        }
                    } else {
                        this.loadLayersToPanel(modal, []);
                        this.updatePromptStats(modal, []);
                    }
                }, 100);
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
                
                console.log(`${isSelected ? '✅' : '❌'} 恢复的图层选择状态: ${annotationId} = ${isSelected}`);
                console.log(`📊 当前选择的图层: ${Array.from(modal.selectedLayers).join(', ')}`);
                
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
                    dropdownText.style.color = '#aaa';
                    dropdownText.style.fontSize = '12px';
                } else if (selectedCount === 1) {
                    const selectedId = Array.from(modal.selectedLayers)[0];
                    const annotation = modal.annotations.find(ann => ann.id === selectedId);
                    if (annotation) {
                        const layerName = `Layer ${annotation.number + 1}`;
                        const operationType = annotation.operationType || 'add_object';
                        dropdownText.textContent = `${layerName} • ${operationType}`;
                        dropdownText.style.color = 'white';
                        dropdownText.style.fontSize = '12px';
                    }
                } else {
                    dropdownText.textContent = `${selectedCount} layers selected`;
                    dropdownText.style.color = 'white';
                    dropdownText.style.fontSize = '12px';
                }
                
                console.log('🔄 下拉框文本已更新:', dropdownText.textContent);
            };
            
            // 恢复后更新选中计数
            nodeType.prototype.updateSelectionCountForRestore = function(modal) {
                const selectionCount = modal.querySelector('#selection-count');
                if (selectionCount && modal.selectedLayers) {
                    const count = modal.selectedLayers.size;
                    selectionCount.textContent = `${count} selected`;
                    console.log('🔢 选中计数已更新:', count);
                }
            };
            
            // 调用标准的updateObjectSelector函数
            nodeType.prototype.callStandardUpdateObjectSelector = function(modal) {
                console.log('🔄 尝试调用标准updateObjectSelector函数...');
                
                try {
                    // 模拟标准updateObjectSelector的行为
                    // 这个函数在annotations模块中定义，我们需要复制其逻辑
                    const dropdownOptions = modal.querySelector('#dropdown-options');
                    const layerOperations = modal.querySelector('#layer-operations');
                    const noLayersMessage = modal.querySelector('#no-layers-message');
                    const selectionCount = modal.querySelector('#selection-count');
                    
                    if (!dropdownOptions) {
                        console.warn('⚠️ 找不到下拉选择器元素');
                        return;
                    }
                    
                    if (!modal.annotations || modal.annotations.length === 0) {
                        dropdownOptions.innerHTML = '';
                        if (layerOperations) layerOperations.style.display = 'none';
                        if (noLayersMessage) noLayersMessage.style.display = 'block';
                        if (selectionCount) selectionCount.textContent = '0 selected';
                        return;
                    }
                    
                    // 隐藏空消息，显示操作区域
                    if (noLayersMessage) noLayersMessage.style.display = 'none';
                    
                    // 清空现有选项
                    dropdownOptions.innerHTML = '';
                    
                    // 创建下拉选项 - 使用与标准函数相同的逻辑
                    modal.annotations.forEach((annotation, index) => {
                        const objectInfo = this.getObjectInfo ? this.getObjectInfo(annotation, index) : {
                            icon: this.getSimpleIcon(annotation.type),
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
                        const layerName = `Layer ${annotation.number}`;
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
                        
                        // 绑定复选框事件 - 使用标准的事件处理器名称
                        const checkbox = option.querySelector('input[type="checkbox"]');
                        if (checkbox) {
                            checkbox.addEventListener('change', (e) => {
                                e.stopPropagation();
                                this.standardToggleLayerSelection(modal, annotation.id, checkbox.checked);
                            });
                        }
                        
                        // 绑定选项点击事件
                        option.addEventListener('click', (e) => {
                            if (e.target.type !== 'checkbox') {
                                checkbox.checked = !checkbox.checked;
                                this.standardToggleLayerSelection(modal, annotation.id, checkbox.checked);
                            }
                        });
                    });
                    
                    // 初始化选中状态管理
                    if (!modal.selectedLayers) {
                        modal.selectedLayers = new Set();
                    }
                    
                    // 更新选中计数和下拉框文本 - 使用标准方法
                    this.standardUpdateSelectionCount(modal);
                    this.standardUpdateDropdownText(modal);
                    
                    // 绑定下拉框事件 - 使用标准方法
                    this.standardBindDropdownEvents(modal);
                    
                    console.log('✅ 标准updateObjectSelector逻辑执行完成，共', modal.annotations.length, '个图层');
                    
                } catch (error) {
                    console.error('❌ 调用标准updateObjectSelector失败:', error);
                }
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
                
                console.log(`${isSelected ? '✅' : '❌'} 标准图层选择: ${annotationId} = ${isSelected}`);
            };
            
            // 标准的选中计数更新
            nodeType.prototype.standardUpdateSelectionCount = function(modal) {
                const selectionCount = modal.querySelector('#selection-count');
                if (selectionCount && modal.selectedLayers) {
                    const count = modal.selectedLayers.size;
                    selectionCount.textContent = `${count} selected`;
                }
            };
            
            // 标准的下拉框文本更新
            nodeType.prototype.standardUpdateDropdownText = function(modal) {
                const dropdownText = modal.querySelector('#dropdown-text');
                if (!dropdownText || !modal.selectedLayers) return;
                
                const selectedCount = modal.selectedLayers.size;
                if (selectedCount === 0) {
                    dropdownText.textContent = 'Click to select layers...';
                    dropdownText.style.color = '#aaa';
                    dropdownText.style.fontSize = '12px';
                } else if (selectedCount === 1) {
                    const selectedId = Array.from(modal.selectedLayers)[0];
                    const annotation = modal.annotations.find(ann => ann.id === selectedId);
                    if (annotation) {
                        const layerName = `Layer ${annotation.number}`;
                        const operationType = annotation.operationType || 'add_object';
                        dropdownText.textContent = `${layerName} • ${operationType}`;
                        dropdownText.style.color = 'white';
                        dropdownText.style.fontSize = '12px';
                    }
                } else {
                    dropdownText.textContent = `${selectedCount} layers selected`;
                    dropdownText.style.color = 'white';
                    dropdownText.style.fontSize = '12px';
                }
            };
            
            // 确保下拉框事件正常工作 - 已被annotations模块接管，此函数已废弃
            nodeType.prototype.ensureDropdownEventsWork = function(modal) {
                console.log('🔧 下拉框事件管理已迁移到annotations模块，跳过旧的绑定逻辑');
                
                // 检查新的绑定系统是否工作
                const dropdown = modal.querySelector('#layer-dropdown');
                if (dropdown && dropdown.dataset.bound === 'true') {
                    console.log('✅ 新的下拉框事件系统正常工作');
                } else {
                    console.log('⚠️ 新的下拉框事件系统可能未正确初始化');
                }
                
                // 不再执行旧的事件绑定逻辑
                return;
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
                
                // 点击下拉框切换显示状态
                dropdown.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = dropdownMenu.style.display === 'block';
                    
                    if (isOpen) {
                        dropdownMenu.style.display = 'none';
                        dropdownArrow.style.transform = 'rotate(0deg)';
                    } else {
                        dropdownMenu.style.display = 'block';
                        dropdownArrow.style.transform = 'rotate(180deg)';
                    }
                });
                
                // 点击页面其他地方关闭下拉框
                document.addEventListener('click', (e) => {
                    if (!dropdown.contains(e.target) && !dropdownMenu.contains(e.target)) {
                        dropdownMenu.style.display = 'none';
                        dropdownArrow.style.transform = 'rotate(0deg)';
                    }
                });
            };
            
            // 恢复后更新下拉复选框
            nodeType.prototype.updateDropdownAfterRestore = function(modal) {
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
                        console.error('❌ 找不到 #dropdown-options 元素');
                        return;
                    }
                    
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
                        
                        const icon = this.getSimpleIcon(annotation.type);
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
                        
                        // 绑定复选框事件 - 这是关键的缺失部分！
                        const checkbox = option.querySelector('input[type="checkbox"]');
                        if (checkbox) {
                            checkbox.addEventListener('change', (e) => {
                                e.stopPropagation();
                                console.log('📋 复选框状态改变:', annotation.id, checkbox.checked);
                                this.toggleLayerSelectionForRestore(modal, annotation.id, checkbox.checked);
                            });
                        }
                        
                        // 绑定选项点击事件（切换复选框）
                        option.addEventListener('click', (e) => {
                            if (e.target.type !== 'checkbox') {
                                checkbox.checked = !checkbox.checked;
                                console.log('📋 选项点击切换:', annotation.id, checkbox.checked);
                                this.toggleLayerSelectionForRestore(modal, annotation.id, checkbox.checked);
                            }
                        });
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
                    const selectionCount = modal.querySelector('#selection-count');
                    if (selectionCount) {
                        selectionCount.textContent = '0 selected';
                    }
                    
                    console.log('✅ 下拉复选框更新完成，共创建', modal.annotations.length, '个选项');
                    
                    // 绑定下拉框打开/关闭事件
                    this.bindDropdownEventsForRestore(modal);
                    
                } catch (error) {
                    console.error('❌ 更新下拉复选框失败:', error);
                }
            };
            
            // 绑定恢复后的下拉框事件
            nodeType.prototype.bindDropdownEventsForRestore = function(modal) {
                const dropdown = modal.querySelector('#layer-dropdown');
                const dropdownMenu = modal.querySelector('#layer-dropdown-menu');
                const dropdownArrow = modal.querySelector('#dropdown-arrow');
                
                if (!dropdown || !dropdownMenu || !dropdownArrow) {
                    console.warn('⚠️ 下拉框相关元素未找到:', {
                        dropdown: !!dropdown,
                        dropdownMenu: !!dropdownMenu,
                        dropdownArrow: !!dropdownArrow
                    });
                    return;
                }
                
                // 防止重复绑定
                if (dropdown.dataset.boundForRestore === 'true') {
                    console.log('🔄 下拉框事件已绑定，跳过重复绑定');
                    return;
                }
                dropdown.dataset.boundForRestore = 'true';
                
                console.log('🔗 绑定下拉框事件...');
                
                // 点击下拉框切换显示状态
                dropdown.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isOpen = dropdownMenu.style.display === 'block';
                    
                    console.log('📋 下拉框点击，当前状态:', isOpen ? '打开' : '关闭');
                    
                    if (isOpen) {
                        dropdownMenu.style.display = 'none';
                        dropdownArrow.style.transform = 'rotate(0deg)';
                        console.log('📋 下拉框已关闭');
                    } else {
                        dropdownMenu.style.display = 'block';
                        dropdownArrow.style.transform = 'rotate(180deg)';
                        console.log('📋 下拉框已打开');
                    }
                });
                
                // 点击页面其他地方关闭下拉框
                document.addEventListener('click', (e) => {
                    if (!dropdown.contains(e.target) && !dropdownMenu.contains(e.target)) {
                        dropdownMenu.style.display = 'none';
                        dropdownArrow.style.transform = 'rotate(0deg)';
                    }
                });
                
                console.log('✅ 下拉框事件绑定完成');
            };
            
            // 恢复annotations到canvas
            nodeType.prototype.restoreAnnotationsToCanvas = function(modal, savedAnnotations) {
                console.log('🎨 开始恢复', savedAnnotations.length, '个annotations到canvas');
                console.log('🔍 Modal状态:', {
                    modalExists: !!modal,
                    modalId: modal?.id,
                    modalVisible: modal?.style?.display !== 'none'
                });
                
                try {
                    // 初始化modal.annotations
                    if (!modal.annotations) {
                        modal.annotations = [];
                    }
                    
                    // 清空现有的annotations
                    modal.annotations = [];
                    
                    // 详细检查DOM结构
                    console.log('🔍 查找drawing-layer...');
                    const allElements = modal.querySelectorAll('*[id]');
                    console.log('🔍 Modal中所有带ID的元素:', Array.from(allElements).map(el => el.id));
                    
                    // 🔧 改进的SVG获取逻辑 - 优先使用已存在的SVG
                    const drawingLayer = modal.querySelector('#drawing-layer');
                    console.log('🔍 Drawing layer状态:', {
                        exists: !!drawingLayer,
                        parent: drawingLayer?.parentElement?.id,
                        children: drawingLayer?.children?.length
                    });
                    
                    if (!drawingLayer) {
                        console.error('❌ 未找到drawing-layer，这不应该发生，因为initCanvasDrawing应该已经创建了它');
                        return;
                    }
                    
                    // 🔧 优先使用已经存在的SVG（由initCanvasDrawing创建）
                    let svg = drawingLayer.querySelector('svg');
                    console.log('🔍 SVG状态:', {
                        exists: !!svg,
                        id: svg?.id,
                        hasViewBox: !!svg?.getAttribute('viewBox'),
                        drawingLayerExists: !!drawingLayer
                    });
                    
                    if (!svg) {
                        console.log('🔍 创建SVG容器 (备用方案)...');
                        // 获取图像尺寸来设置正确的viewBox
                        const image = modal.querySelector('#vpe-main-image');
                        let viewBoxWidth = 1000;
                        let viewBoxHeight = 1000;
                        
                        if (image && image.complete && image.naturalWidth > 0) {
                            viewBoxWidth = image.naturalWidth;
                            viewBoxHeight = image.naturalHeight;
                            console.log('🖼️ 使用图像实际尺寸设置SVG viewBox:', viewBoxWidth + 'x' + viewBoxHeight);
                        }
                        
                        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        svg.setAttribute('width', '100%');
                        svg.setAttribute('height', '100%');
                        svg.setAttribute('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
                        svg.setAttribute('id', 'annotation-svg');
                        svg.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: auto; z-index: 1000;';
                        
                        // 添加箭头标记定义容器 (确保箭头可见)
                        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                        const colors = ['#ff0000', '#00ff00', '#ffff00', '#0000ff'];
                        colors.forEach(color => {
                            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                            marker.setAttribute('id', `arrowhead-${color.replace('#', '')}`);
                            marker.setAttribute('markerWidth', '10');
                            marker.setAttribute('markerHeight', '7');
                            marker.setAttribute('refX', '9');
                            marker.setAttribute('refY', '3.5');
                            marker.setAttribute('orient', 'auto');
                            
                            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                            polygon.setAttribute('fill', color);
                            
                            marker.appendChild(polygon);
                            defs.appendChild(marker);
                        });
                        svg.appendChild(defs);
                        
                        drawingLayer.appendChild(svg);
                        console.log('✅ SVG已创建并添加到drawing layer');
                    } else {
                        console.log('✅ 使用现有的SVG容器进行标注恢复');
                    }

                    // 确保SVG可见和可交互
                    svg.style.pointerEvents = 'auto';
                    svg.style.display = 'block';
                    svg.style.visibility = 'visible';
                    svg.style.opacity = '1';
                    
                    // 测试SVG容器是否正常工作 - 添加一个测试矩形
                    const testRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    testRect.setAttribute('x', '10');
                    testRect.setAttribute('y', '10');
                    testRect.setAttribute('width', '50');
                    testRect.setAttribute('height', '50');
                    testRect.setAttribute('fill', '#00ff00');
                    testRect.setAttribute('stroke', '#00ff00');
                    testRect.setAttribute('stroke-width', '2');
                    testRect.setAttribute('class', 'test-rect');
                    svg.appendChild(testRect);
                    console.log('🧪 测试矩形已添加到SVG');
                    
                    // 1秒后移除测试矩形
                    setTimeout(() => {
                        const testElement = svg.querySelector('.test-rect');
                        if (testElement) {
                            testElement.remove();
                            console.log('🧪 测试矩形已移除');
                        }
                    }, 1000);
                    
                    // 定义恢复时的填充样式应用函数
                    const applyRestoredFillStyle = (shape, color, fillMode, opacity = 50) => {
                        console.log('🎨 恢复时应用填充样式:', { color, fillMode, opacity });
                        // 计算不透明度值 (0-1)
                        const fillOpacity = opacity / 100;
                        const strokeOpacity = Math.min(fillOpacity + 0.3, 1.0);
                        
                        if (fillMode === 'outline') {
                            // 空心样式
                            shape.setAttribute('fill', 'none');
                            shape.setAttribute('stroke', color);
                            shape.setAttribute('stroke-width', '3');
                            shape.setAttribute('stroke-opacity', strokeOpacity);
                            console.log('✅ 应用空心样式, 不透明度:', strokeOpacity);
                        } else {
                            // 实心样式 (默认)
                            shape.setAttribute('fill', color);
                            shape.setAttribute('fill-opacity', fillOpacity);
                            shape.setAttribute('stroke', 'none');
                            console.log('✅ 应用实心样式, 不透明度:', fillOpacity);
                        }
                    };
                    
                    // 恢复每个annotation - 使用简化的直接方法
                    console.log('🔄 开始逐个恢复annotations...');
                    savedAnnotations.forEach((annotation, index) => {
                        console.log(`🔄 处理第${index + 1}个annotation:`, {
                            id: annotation.id,
                            type: annotation.type,
                            color: annotation.color,
                            geometry: annotation.geometry
                        });
                        
                        // 添加到modal.annotations数组
                        modal.annotations.push(annotation);
                        
                        // 直接使用原生DOM操作创建SVG元素
                        if (annotation.type === 'rectangle' && annotation.geometry && annotation.geometry.coordinates) {
                            console.log('📐 开始创建矩形...');
                            
                            const coords = annotation.geometry.coordinates;
                            const color = annotation.color || '#ff0000';
                            
                            console.log('📐 矩形数据:', { coords, color });
                            
                            // 直接创建矩形元素 - 使用与新annotation相同的样式
                            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                            rect.setAttribute('x', Math.min(coords[0], coords[2]));
                            rect.setAttribute('y', Math.min(coords[1], coords[3]));
                            rect.setAttribute('width', Math.abs(coords[2] - coords[0]));
                            rect.setAttribute('height', Math.abs(coords[3] - coords[1]));
                            rect.setAttribute('data-annotation-id', annotation.id);
                            rect.setAttribute('data-annotation-number', annotation.number || '');
                            rect.setAttribute('class', 'annotation-shape');
                            
                            // 应用填充样式
                            const fillMode = annotation.fillMode || 'filled';
                            const opacity = annotation.opacity || 50;
                            applyRestoredFillStyle(rect, color, fillMode, opacity);
                            
                            // 立即添加到SVG
                            svg.appendChild(rect);
                            console.log('✅ 矩形已添加到SVG');
                            
                            // 添加编号标签（如果有编号）
                            if (annotation.number !== undefined) {
                                console.log('🔢 为恢复的annotation添加编号标签:', annotation.number);
                                // 🔧 简化标签创建
                                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                const labelX = Math.min(coords[0], coords[2]) + 8;
                                const labelY = Math.min(coords[1], coords[3]) - 8;
                                text.setAttribute('x', labelX);
                                text.setAttribute('y', labelY);
                                text.setAttribute('fill', '#fff');
                                text.setAttribute('font-size', '20');
                                text.setAttribute('font-weight', 'bold');
                                text.setAttribute('stroke', '#000');
                                text.setAttribute('stroke-width', '1');
                                text.setAttribute('data-annotation-number', annotation.number);
                                text.textContent = annotation.number;
                                svg.appendChild(text);
                            }
                            
                            // 立即验证
                            const addedRect = svg.querySelector(`[data-annotation-id="${annotation.id}"]`);
                            if (addedRect) {
                                console.log('✅ 验证成功 - 矩形在SVG中');
                            } else {
                                console.error('❌ 验证失败 - 矩形不在SVG中');
                            }
                        }
                        
                        // 椭圆/圆形类型
                        else if (annotation.type === 'circle' && annotation.geometry && annotation.geometry.coordinates) {
                            console.log('⭕ 开始创建椭圆...');
                            
                            const coords = annotation.geometry.coordinates;
                            const color = annotation.color || '#ff0000';
                            
                            console.log('⭕ 椭圆数据:', { coords, color });
                            
                            const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                            const cx = (coords[0] + coords[2]) / 2;
                            const cy = (coords[1] + coords[3]) / 2;
                            const rx = Math.abs(coords[2] - coords[0]) / 2;
                            const ry = Math.abs(coords[3] - coords[1]) / 2;
                            
                            ellipse.setAttribute('cx', cx);
                            ellipse.setAttribute('cy', cy);
                            ellipse.setAttribute('rx', rx);
                            ellipse.setAttribute('ry', ry);
                            ellipse.setAttribute('data-annotation-id', annotation.id);
                            ellipse.setAttribute('data-annotation-number', annotation.number || '');
                            ellipse.setAttribute('class', 'annotation-shape');
                            
                            // 应用填充样式
                            const fillMode = annotation.fillMode || 'filled';
                            const opacity = annotation.opacity || 50;
                            applyRestoredFillStyle(ellipse, color, fillMode, opacity);
                            
                            svg.appendChild(ellipse);
                            console.log('✅ 椭圆已添加到SVG');
                            
                            // 添加编号标签
                            if (annotation.number !== undefined) {
                                console.log('🔢 为恢复的椭圆添加编号标签:', annotation.number);
                                // 🔧 简化标签创建
                                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                const labelX = Math.min(coords[0], coords[2]) + 8;
                                const labelY = Math.min(coords[1], coords[3]) - 8;
                                text.setAttribute('x', labelX);
                                text.setAttribute('y', labelY);
                                text.setAttribute('fill', '#fff');
                                text.setAttribute('font-size', '20');
                                text.setAttribute('font-weight', 'bold');
                                text.setAttribute('stroke', '#000');
                                text.setAttribute('stroke-width', '1');
                                text.setAttribute('data-annotation-number', annotation.number);
                                text.textContent = annotation.number;
                                svg.appendChild(text);
                            }
                        }
                        
                        // 箭头类型
                        else if (annotation.type === 'arrow' && annotation.geometry && annotation.geometry.coordinates) {
                            console.log('➡️ 开始创建箭头...');
                            
                            const coords = annotation.geometry.coordinates;
                            const color = annotation.color || '#ff0000';
                            
                            console.log('➡️ 箭头数据:', { coords, color });
                            
                            // 创建箭头线
                            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                            line.setAttribute('x1', coords[0]);
                            line.setAttribute('y1', coords[1]);
                            line.setAttribute('x2', coords[2]);
                            line.setAttribute('y2', coords[3]);
                            line.setAttribute('stroke', color);
                            line.setAttribute('stroke-width', '6');
                            
                            // 使用保存的不透明度值
                            const opacity = annotation.opacity || 50;
                            const strokeOpacity = Math.min((opacity + 30) / 100, 1.0);
                            line.setAttribute('stroke-opacity', strokeOpacity);
                            
                            // 🔧 使用与不透明度更新一致的marker创建方式
                            const colorHex = color.replace('#', '');
                            const markerId = `arrowhead-${colorHex}-opacity-${Math.round(opacity)}`;
                            
                            // 检查是否已存在对应的marker
                            const defs = svg.querySelector('defs');
                            if (defs && !defs.querySelector(`#${markerId}`)) {
                                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                                marker.setAttribute('id', markerId);
                                marker.setAttribute('markerWidth', '10');
                                marker.setAttribute('markerHeight', '7');
                                marker.setAttribute('refX', '9');
                                marker.setAttribute('refY', '3.5');
                                marker.setAttribute('orient', 'auto');
                                
                                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                                polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                                polygon.setAttribute('fill', color);
                                polygon.setAttribute('fill-opacity', strokeOpacity);
                                
                                marker.appendChild(polygon);
                                defs.appendChild(marker);
                                console.log(`🏹 创建箭头marker: ${markerId}, 不透明度: ${strokeOpacity}`);
                            }
                            
                            line.setAttribute('marker-end', `url(#${markerId})`);
                            line.setAttribute('data-annotation-id', annotation.id);
                            line.setAttribute('data-annotation-number', annotation.number || '');
                            line.setAttribute('class', 'annotation-shape');
                            
                            svg.appendChild(line);
                            console.log('✅ 箭头已添加到SVG');
                            
                            // 添加编号标签
                            if (annotation.number !== undefined) {
                                console.log('🔢 为恢复的箭头添加编号标签:', annotation.number);
                                // 🔧 简化标签创建
                                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                const labelX = coords[0] + 8;
                                const labelY = coords[1] - 8;
                                text.setAttribute('x', labelX);
                                text.setAttribute('y', labelY);
                                text.setAttribute('fill', '#fff');
                                text.setAttribute('font-size', '20');
                                text.setAttribute('font-weight', 'bold');
                                text.setAttribute('stroke', '#000');
                                text.setAttribute('stroke-width', '1');
                                text.setAttribute('data-annotation-number', annotation.number);
                                text.textContent = annotation.number;
                                svg.appendChild(text);
                            }
                        }
                        
                        // 多边形/自由绘制类型
                        else if (annotation.type === 'freehand' && annotation.points && annotation.points.length > 0) {
                            console.log('🔗 开始创建多边形...');
                            
                            const points = annotation.points;
                            const color = annotation.color || '#ff0000';
                            
                            console.log('🔗 多边形数据:', { pointsCount: points.length, color });
                            
                            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                            const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
                            
                            polygon.setAttribute('points', pointsStr);
                            polygon.setAttribute('data-annotation-id', annotation.id);
                            polygon.setAttribute('data-annotation-number', annotation.number || '');
                            polygon.setAttribute('class', 'annotation-shape');
                            
                            // 应用填充样式
                            const fillMode = annotation.fillMode || 'filled';
                            const opacity = annotation.opacity || 50;
                            applyRestoredFillStyle(polygon, color, fillMode, opacity);
                            
                            svg.appendChild(polygon);
                            console.log('✅ 多边形已添加到SVG');
                            
                            // 添加编号标签（使用第一个点作为位置）
                            if (annotation.number !== undefined && points.length > 0) {
                                console.log('🔢 为恢复的多边形添加编号标签:', annotation.number);
                                const firstPoint = points[0];
                                // 🔧 简化标签创建
                                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                text.setAttribute('x', firstPoint.x + 8);
                                text.setAttribute('y', firstPoint.y - 8);
                                text.setAttribute('fill', '#fff');
                                text.setAttribute('font-size', '20');
                                text.setAttribute('font-weight', 'bold');
                                text.setAttribute('stroke', '#000');
                                text.setAttribute('stroke-width', '1');
                                text.setAttribute('data-annotation-number', annotation.number);
                                text.textContent = annotation.number;
                                svg.appendChild(text);
                            }
                        }
                        
                        // 画笔类型
                        else if (annotation.type === 'brush' && annotation.points) {
                            console.log('🖌️ 开始恢复画笔路径...');
                            
                            const color = annotation.color || '#ff0000';
                            const brushSize = annotation.brushSize || 20;
                            const brushFeather = annotation.brushFeather || 5;
                            const opacity = annotation.opacity || 50;
                            const points = annotation.points || [];
                            const pathData = annotation.pathData || '';
                            
                            console.log('🖌️ 画笔数据:', { color, brushSize, brushFeather, opacity, pointsCount: points.length });
                            
                            if (points.length === 0) {
                                console.log('⚠️ 画笔没有路径点，跳过恢复');
                            } else {
                            
                            // 创建SVG路径元素
                            const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            
                            // 获取SVG的viewBox来计算缩放比例
                            const viewBox = svg.getAttribute('viewBox');
                            const svgRect = svg.getBoundingClientRect();
                            let scaleAdjustment = 1;
                            
                            if (viewBox && svgRect.width > 0) {
                                const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(Number);
                                // 计算viewBox到实际显示的缩放比例
                                scaleAdjustment = vbWidth / svgRect.width;
                                    console.log('🖌️ SVG缩放调整:', { viewBox, svgRect: svgRect.width, scaleAdjustment });
                            }
                            
                            // 调整画笔宽度以适应SVG缩放
                            const adjustedBrushSize = brushSize * scaleAdjustment;
                            
                            shape.setAttribute('stroke', color);
                            shape.setAttribute('stroke-width', adjustedBrushSize);
                            shape.setAttribute('stroke-linecap', 'round');
                            shape.setAttribute('stroke-linejoin', 'round');
                            shape.setAttribute('fill', 'none');
                            shape.setAttribute('stroke-opacity', opacity / 100);
                            
                            // 如果有羽化，应用滤镜
                            if (brushFeather > 0) {
                                const defs = svg.querySelector('defs') || (() => {
                                    const defsElement = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                                    svg.appendChild(defsElement);
                                    return defsElement;
                                })();
                                
                                const filterId = `brush-blur-restored-${annotation.id}`;
                                const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
                                filter.setAttribute('id', filterId);
                                filter.setAttribute('x', '-50%');
                                filter.setAttribute('y', '-50%');
                                filter.setAttribute('width', '200%');
                                filter.setAttribute('height', '200%');
                                
                                const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
                                blur.setAttribute('in', 'SourceGraphic');
                                // 调整羽化强度以适应SVG缩放
                                const adjustedFeather = (brushFeather / 2) * scaleAdjustment;
                                blur.setAttribute('stdDeviation', adjustedFeather);
                                
                                filter.appendChild(blur);
                                defs.appendChild(filter);
                                shape.setAttribute('filter', `url(#${filterId})`);
                            }
                            
                            // 设置路径数据
                            if (pathData) {
                                shape.setAttribute('d', pathData);
                            } else {
                                // 从点生成路径
                                let generatedPath = `M ${points[0].x} ${points[0].y}`;
                                for (let i = 1; i < points.length; i++) {
                                    generatedPath += ` L ${points[i].x} ${points[i].y}`;
                                }
                                shape.setAttribute('d', generatedPath);
                            }
                            
                            shape.setAttribute('data-annotation-id', annotation.id);
                            shape.setAttribute('data-annotation-number', annotation.number || '');
                            shape.setAttribute('class', 'annotation-shape brush-path');
                            
                            svg.appendChild(shape);
                            console.log('✅ 画笔路径已添加到SVG');
                            
                            // 添加编号标签
                            if (annotation.number !== undefined && points.length > 0) {
                                console.log('🔢 为恢复的画笔添加编号标签:', annotation.number);
                                const firstPoint = points[0];
                                const labelCoords = [firstPoint.x, firstPoint.y, firstPoint.x + 10, firstPoint.y + 10];
                                this.addRestoredNumberLabel(svg, labelCoords, annotation.number, color);
                            }
                            }
                        }
                        
                        // 未知类型
                        else {
                            console.log('⚠️ 跳过未知annotation类型:', annotation.type, annotation);
                        }
                    });
                    
                    console.log('🔄 所有annotations处理完成');
                    
                    // 为所有恢复的annotation添加事件处理器
                    this.bindRestoredAnnotationEvents(modal, svg);
                    
                    // 强制重新渲染SVG
                    svg.style.transform = 'translateZ(0)';
                    
                    // 立即检查SVG中的形状
                    const immediateShapes = svg.querySelectorAll('.annotation-shape');
                    console.log('🔍 立即检查SVG形状数量:', immediateShapes.length);
                    
                    // 列出所有SVG子元素
                    const allSvgChildren = Array.from(svg.children);
                    console.log('🔍 SVG所有子元素:', allSvgChildren.map(child => ({
                        tagName: child.tagName,
                        id: child.id,
                        class: child.className,
                        dataId: child.getAttribute('data-annotation-id')
                    })));
                    
                    console.log('✅ 成功恢复', savedAnnotations.length, '个annotations');
                    console.log('🔍 最终SVG状态检查:', {
                        svgExists: !!svg,
                        svgId: svg.id,
                        svgParent: svg.parentElement?.id,
                        svgVisible: svg.style.visibility,
                        svgOpacity: svg.style.opacity,
                        svgChildren: svg.children.length,
                        annotationsCount: modal.annotations.length,
                        shapesFound: immediateShapes.length
                    });
                    
                    // 恢复不透明度滑块的值
                    this.restoreOpacitySlider(modal, savedAnnotations);
                    
                    // 重要：更新图层选择面板，确保显示格式与新创建标注一致
                    // 内联实现，避免函数定义顺序问题
                    try {
                        console.log('🔍 开始更新下拉复选框界面...');
                        const dropdownOptions = modal.querySelector('#dropdown-options');
                        console.log('🔍 dropdownOptions 元素:', !!dropdownOptions);
                        console.log('🔍 modal.annotations:', modal.annotations?.length || 0);
                        
                        if (dropdownOptions && modal.annotations && modal.annotations.length > 0) {
                            // 清空现有选项
                            dropdownOptions.innerHTML = '';
                            
                            // 创建下拉选项
                            modal.annotations.forEach((annotation, index) => {
                                const objectInfo = this.getRestoredObjectInfo ? this.getRestoredObjectInfo(annotation, index) : {
                                    icon: this.getAnnotationIcon ? this.getAnnotationIcon(annotation.type) : this.getSimpleIcon(annotation.type),
                                    description: `Layer ${annotation.number}`
                                };
                                
                                const option = document.createElement('div');
                                option.style.cssText = `
                                    display: flex; align-items: center; gap: 4px; padding: 2px 6px; 
                                    cursor: pointer; margin: 0; height: 20px;
                                    transition: background 0.2s ease; 
                                    border-bottom: 1px solid #444;
                                `;
                                
                                const layerName = `Layer ${annotation.number}`;
                                const operationType = annotation.operationType || 'add_object';
                                
                                option.innerHTML = `
                                    <input type="checkbox" 
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
                                
                                dropdownOptions.appendChild(option);
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
                            const selectionCount = modal.querySelector('#selection-count');
                            if (selectionCount) {
                                selectionCount.textContent = '0 selected';
                            }
                            
                            console.log('✅ 内联更新图层选择器完成，共', modal.annotations.length, '个图层');
                        } else {
                            console.warn('⚠️ 无法更新下拉复选框:', {
                                dropdownOptionsExists: !!dropdownOptions,
                                annotationsExists: !!modal.annotations,
                                annotationsLength: modal.annotations?.length || 0
                            });
                            
                            // 如果没有dropdownOptions元素，尝试找到并显示可用的元素
                            const allElements = modal.querySelectorAll('[id*="dropdown"], [id*="layer"], [id*="annotation"]');
                            console.log('🔍 可用的相关元素:', Array.from(allElements).map(el => ({id: el.id, class: el.className})));
                        }
                    } catch (error) {
                        console.error('❌ 内联更新图层选择器失败:', error);
                    }
                    
                    // 保存this引用
                    const nodeInstance = this;
                    
                    // 短延迟后进行详细的可见性检查和持久性验证
                    setTimeout(() => {
                        console.log('🔍 延迟检查开始...');
                        nodeInstance.debugAnnotationVisibility(modal, svg);
                        
                        // 🔧 验证标注是否成功恢复并持久存在
                        const finalShapes = svg.querySelectorAll('.annotation-shape');
                        console.log('🔍 最终验证 - 标注数量:', finalShapes.length, '/ 预期:', savedAnnotations.length);
                        
                        if (finalShapes.length === 0 && savedAnnotations.length > 0) {
                            console.error('❌ 标注恢复失败！尝试备用方案...');
                            // 备用方案：手动创建
                            nodeInstance.manuallyCreateAnnotationShapes(modal, svg);
                        } else if (finalShapes.length < savedAnnotations.length) {
                            console.warn(`⚠️ 部分标注恢复失败: ${finalShapes.length}/${savedAnnotations.length}`);
                        } else {
                            console.log('✅ 标注恢复完全成功！');
                        }
                        
                        // 🔧 标注恢复完成后，更新下拉框选择器
                        console.log('✅ 标注恢复完成，更新下拉框选择器...');
                        try {
                            // 延迟确保DOM更新完成
                            setTimeout(() => {
                                updateObjectSelector(modal);
                                console.log('✅ 下拉框选择器更新完成');
                            }, 100);
                        } catch (error) {
                            console.error('❌ 更新下拉框选择器失败:', error);
                        }
                        
                        // 🔧 额外的持久性检查 - 确保不会被后续操作清除
                        setTimeout(() => {
                            const persistentShapes = svg.querySelectorAll('.annotation-shape');
                            if (persistentShapes.length < finalShapes.length) {
                                console.error('❌ 检测到标注被意外清除！重新恢复中...');
                                nodeInstance.restoreAnnotationsToCanvas.call(nodeInstance, modal, savedAnnotations);
                            } else {
                                console.log('✅ 标注持久性验证通过 - 恢复完成');
                            }
                        }, 300);
                    }, 100);
                } catch (error) {
                    console.error('❌ 恢复annotations失败:', error);
                }
            };

            // 恢复不透明度滑块的值
            nodeType.prototype.restoreOpacitySlider = function(modal, savedAnnotations) {
                try {
                    // 查找不透明度滑块和显示元素
                    const opacitySlider = modal.querySelector('#vpe-opacity-slider');
                    const opacityValue = modal.querySelector('#vpe-opacity-value');
                    
                    if (!opacitySlider || !opacityValue) {
                        console.log('⚠️ 未找到不透明度滑块控件');
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
                    
                    console.log('🎨 恢复不透明度滑块值:', restoredOpacity + '%');
                    
                } catch (error) {
                    console.error('❌ 恢复不透明度滑块失败:', error);
                }
            };

            // 添加编号标签
            nodeType.prototype.addNumberLabel = function(svg, annotation, coords) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
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
                console.log('🔗 为恢复的annotations绑定事件处理器');
                
                // 为所有annotation形状添加点击和悬停事件
                const shapes = svg.querySelectorAll('.annotation-shape');
                shapes.forEach(shape => {
                    // 点击选择事件
                    shape.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const annotationId = shape.dataset.annotationId;
                        console.log('🎯 点击恢复的annotation:', annotationId);
                        
                        // 更新选择状态
                        this.selectAnnotationInPanel(modal, annotationId);
                        this.highlightAnnotationOnCanvas(shape);
                    });
                    
                    // 悬停效果
                    shape.addEventListener('mouseenter', () => {
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
                    });
                    
                    shape.addEventListener('mouseleave', () => {
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
                    });
                });
                
                console.log('✅ 已为', shapes.length, '个恢复的annotation绑定事件处理器');
            };

            // 在面板中选择annotation
            nodeType.prototype.selectAnnotationInPanel = function(modal, annotationId) {
                const annotationObjects = modal.querySelector('#annotation-objects');
                if (annotationObjects) {
                    // 找到对应的checkbox并选中
                    const checkbox = annotationObjects.querySelector(`input[data-layer-id="${annotationId}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                        // 触发选择事件
                        const changeEvent = new Event('change');
                        checkbox.dispatchEvent(changeEvent);
                        console.log('✅ 在面板中选中annotation:', annotationId);
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
                
                console.log('✨ 高亮annotation:', shape.dataset.annotationId);
            };

            // 调试annotation可见性
            nodeType.prototype.debugAnnotationVisibility = function(modal, svg) {
                console.log('🔍 调试annotation可见性检查:');
                
                // 检查SVG容器
                const svgRect = svg.getBoundingClientRect();
                console.log('📐 SVG容器位置和尺寸:', {
                    x: svgRect.x,
                    y: svgRect.y,
                    width: svgRect.width,
                    height: svgRect.height,
                    visible: svgRect.width > 0 && svgRect.height > 0
                });
                
                // 检查每个annotation形状
                const shapes = svg.querySelectorAll('.annotation-shape');
                console.log('📊 找到', shapes.length, '个annotation形状:');
                
                shapes.forEach((shape, index) => {
                    const rect = shape.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(shape);
                    
                    console.log(`  📍 Annotation ${index + 1}:`, {
                        id: shape.dataset.annotationId,
                        type: shape.tagName,
                        visible: rect.width > 0 && rect.height > 0,
                        display: computedStyle.display,
                        visibility: computedStyle.visibility,
                        opacity: computedStyle.opacity,
                        fill: shape.getAttribute('fill'),
                        stroke: shape.getAttribute('stroke'),
                        strokeWidth: shape.getAttribute('stroke-width'),
                        position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                    });
                });
                
                // 检查图层面板状态
                const annotationObjects = modal.querySelector('#annotation-objects');
                if (annotationObjects) {
                    const layerItems = annotationObjects.children;
                    console.log('📋 图层面板中有', layerItems.length, '个条目');
                    
                    Array.from(layerItems).forEach((item, index) => {
                        const checkbox = item.querySelector('input[type="checkbox"]');
                        console.log(`  🎯 图层 ${index + 1}:`, {
                            visible: item.style.opacity !== '0',
                            enabled: !checkbox?.disabled,
                            checked: checkbox?.checked,
                            text: item.textContent?.trim()
                        });
                    });
                }
            };

            // 标准化annotation数据结构
            nodeType.prototype.normalizeAnnotationData = function(annotation) {
                console.log('🔧 标准化annotation数据:', annotation.id, '不透明度:', annotation.opacity);
                
                // 创建标准化的annotation对象
                const normalized = {
                    id: annotation.id,
                    type: annotation.type || 'rectangle',
                    color: annotation.color || '#ff0000',
                    fillMode: annotation.fillMode || 'filled',
                    opacity: annotation.opacity || 50,  // 🔧 修复：添加不透明度字段
                    number: annotation.number
                };
                
                // 处理几何数据 - 尝试多种可能的数据结构
                if (annotation.geometry && annotation.geometry.coordinates) {
                    // 标准格式：已经有geometry.coordinates
                    normalized.geometry = annotation.geometry;
                    console.log('✅ 使用现有geometry.coordinates');
                } else if (annotation.coordinates) {
                    // 格式1：直接有coordinates字段
                    normalized.geometry = {
                        type: annotation.type || 'rectangle',
                        coordinates: annotation.coordinates
                    };
                    console.log('✅ 从coordinates字段创建geometry');
                } else if (annotation.start && annotation.end) {
                    // 格式2：有start和end字段 (常见格式)
                    normalized.geometry = {
                        type: annotation.type || 'rectangle',
                        coordinates: [
                            annotation.start.x,
                            annotation.start.y,
                            annotation.end.x,
                            annotation.end.y
                        ]
                    };
                    console.log('✅ 从start/end字段创建geometry:', normalized.geometry.coordinates);
                } else if (annotation.x !== undefined && annotation.y !== undefined && 
                          annotation.width !== undefined && annotation.height !== undefined) {
                    // 格式3：有x,y,width,height字段
                    normalized.geometry = {
                        type: annotation.type || 'rectangle',
                        coordinates: [
                            annotation.x,
                            annotation.y,
                            annotation.x + annotation.width,
                            annotation.y + annotation.height
                        ]
                    };
                    console.log('✅ 从x/y/width/height字段创建geometry:', normalized.geometry.coordinates);
                } else if (annotation.bbox) {
                    // 格式4：有bbox字段
                    normalized.geometry = {
                        type: annotation.type || 'rectangle',
                        coordinates: annotation.bbox
                    };
                    console.log('✅ 从bbox字段创建geometry');
                } else {
                    // 无法识别的格式，尝试从其他字段推断
                    console.warn('⚠️ 无法识别annotation几何数据格式，尝试推断...');
                    console.log('🔍 所有可用字段:', Object.keys(annotation));
                    
                    // 尝试查找任何可能包含坐标的字段
                    let foundCoords = null;
                    for (const [key, value] of Object.entries(annotation)) {
                        if (Array.isArray(value) && value.length >= 4 && 
                            value.every(v => typeof v === 'number')) {
                            foundCoords = value;
                            console.log(`🔍 在字段 ${key} 中找到可能的坐标:`, foundCoords);
                            break;
                        }
                    }
                    
                    if (foundCoords) {
                        normalized.geometry = {
                            type: annotation.type || 'rectangle',
                            coordinates: foundCoords
                        };
                        console.log('✅ 成功推断坐标数据');
                    } else {
                        // 最后的默认值
                        normalized.geometry = {
                            type: annotation.type || 'rectangle',
                            coordinates: [100, 100, 200, 200] // 默认矩形
                        };
                        console.warn('⚠️ 使用默认坐标值');
                    }
                }
                
                // 从geometry.coordinates创建start和end属性（新annotation使用的格式）
                if (normalized.geometry && normalized.geometry.coordinates && normalized.geometry.coordinates.length >= 4) {
                    const coords = normalized.geometry.coordinates;
                    normalized.start = { x: coords[0], y: coords[1] };
                    normalized.end = { x: coords[2], y: coords[3] };
                    console.log('✅ 为恢复的annotation添加start/end属性:', { start: normalized.start, end: normalized.end });
                }
                
                // 处理多边形的points字段
                if (annotation.type === 'freehand' && annotation.points) {
                    normalized.points = annotation.points;
                    console.log('✅ 保存多边形points数据:', annotation.points.length, '个点');
                }
                
                // 处理画笔的特殊字段
                if (annotation.type === 'brush') {
                    if (annotation.points) normalized.points = annotation.points;
                    if (annotation.brushSize) normalized.brushSize = annotation.brushSize;
                    if (annotation.brushFeather) normalized.brushFeather = annotation.brushFeather;
                    if (annotation.pathData) normalized.pathData = annotation.pathData;
                    console.log('✅ 保存画笔数据:', {
                        points: annotation.points?.length,
                        brushSize: annotation.brushSize,
                        brushFeather: annotation.brushFeather
                    });
                }
                
                // 保留其他可能有用的字段
                if (annotation.area) normalized.area = annotation.area;
                if (annotation.class_name) normalized.class_name = annotation.class_name;
                if (annotation.confidence) normalized.confidence = annotation.confidence;
                if (annotation.visible !== undefined) normalized.visible = annotation.visible;
                
                return normalized;
            };

            // 为恢复的annotation添加编号标签
            nodeType.prototype.addRestoredNumberLabel = function(svg, coords, number, color) {
                try {
                    // 计算标签位置（左上角）
                    const labelX = Math.min(coords[0], coords[2]) + 8;
                    const labelY = Math.min(coords[1], coords[3]) - 8;
                    
                    // 创建标签组
                    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    group.setAttribute('class', 'annotation-label');
                    group.setAttribute('data-annotation-number', number);
                    
                    // 数字文本 - 直接显示数字，无背景圆圈
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
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
                    
                    console.log('✅ 恢复的annotation编号标签已添加:', number);
                } catch (error) {
                    console.error('❌ 添加恢复的编号标签失败:', error);
                }
            };

            // 手动创建annotation形状 (最后的备用方案)
            nodeType.prototype.manuallyCreateAnnotationShapes = function(modal, svg) {
                console.log('🛠️ 手动创建annotation形状...');
                
                if (!modal.annotations || modal.annotations.length === 0) {
                    console.log('⚠️ 没有annotation数据可用于手动创建');
                    return;
                }
                
                modal.annotations.forEach((annotation, index) => {
                    console.log(`🔧 手动创建第 ${index + 1} 个annotation:`, annotation.type, annotation.id);
                    
                    try {
                        if (annotation.type === 'rectangle' && annotation.geometry && annotation.geometry.coordinates) {
                            // 直接使用DOM操作创建矩形
                            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                            const coords = annotation.geometry.coordinates;
                            const color = annotation.color || '#ff0000';
                            
                            rect.setAttribute('x', Math.min(coords[0], coords[2]));
                            rect.setAttribute('y', Math.min(coords[1], coords[3]));
                            rect.setAttribute('width', Math.abs(coords[2] - coords[0]));
                            rect.setAttribute('height', Math.abs(coords[3] - coords[1]));
                            rect.setAttribute('fill', color);
                            rect.setAttribute('fill-opacity', '0.3');
                            rect.setAttribute('stroke', color);
                            rect.setAttribute('stroke-width', '5'); // 更粗的边框
                            rect.setAttribute('stroke-opacity', '1');
                            rect.setAttribute('data-annotation-id', annotation.id);
                            rect.setAttribute('class', 'annotation-shape manual-created');
                            
                            // 强制添加到SVG
                            svg.appendChild(rect);
                            console.log('✅ 手动创建矩形成功');
                        }
                        // 可以在这里添加其他形状的手动创建逻辑
                    } catch (error) {
                        console.error('❌ 手动创建annotation失败:', error);
                    }
                });
                
                // 验证手动创建的结果
                const createdShapes = svg.querySelectorAll('.annotation-shape');
                console.log(`🎯 手动创建完成，现在有 ${createdShapes.length} 个形状`);
            };

            // 刷新图层面板状态
            nodeType.prototype.refreshLayerPanelState = function(modal) {
                try {
                    // 找到annotation-objects容器
                    const annotationObjects = modal.querySelector('#annotation-objects');
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
                    const layerItems = modal.querySelectorAll('.layer-item');
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
                    
                    console.log('✅ 图层面板状态已刷新，恢复正常的可选择状态');
                } catch (error) {
                    console.error('❌ 刷新图层面板状态失败:', error);
                }
            };
            
            // 创建矩形SVG元素 (简化版本)
            nodeType.prototype.createRectangleElement = function(svg, annotation) {
                try {
                    const coords = annotation.geometry.coordinates;
                    const color = annotation.color || '#ff0000';
                    
                    console.log('🔍 矩形坐标数据:', coords);
                    
                    if (!coords || coords.length < 4) {
                        console.error('❌ 矩形坐标数据无效:', coords);
                        return null;
                    }
                    
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    
                    const x = Math.min(coords[0], coords[2]);
                    const y = Math.min(coords[1], coords[3]);
                    const width = Math.abs(coords[2] - coords[0]);
                    const height = Math.abs(coords[3] - coords[1]);
                    
                    console.log('📐 矩形计算属性:', { x, y, width, height, color });
                    
                    rect.setAttribute('x', x);
                    rect.setAttribute('y', y);
                    rect.setAttribute('width', width);
                    rect.setAttribute('height', height);
                    rect.setAttribute('fill', color);
                    rect.setAttribute('fill-opacity', '0.3');
                    rect.setAttribute('stroke', color);
                    rect.setAttribute('stroke-width', '4');
                    rect.setAttribute('stroke-opacity', '1');
                    rect.setAttribute('data-annotation-id', annotation.id);
                    rect.setAttribute('data-annotation-number', annotation.number || '');
                    rect.classList.add('annotation-shape');
                    
                    // 直接添加到SVG
                    svg.appendChild(rect);
                    
                    // 验证是否成功添加
                    const addedRect = svg.querySelector(`[data-annotation-id="${annotation.id}"]`);
                    if (addedRect) {
                        console.log('✅ 矩形已成功添加到SVG');
                        
                        // 添加编号标签
                        if (annotation.number !== undefined) {
                            this.addNumberLabel(svg, annotation, coords);
                        }
                        
                        return rect;
                    } else {
                        console.error('❌ 矩形添加到SVG失败');
                        return null;
                    }
                } catch (error) {
                    console.error('❌ 创建矩形元素出错:', error);
                    return null;
                }
            };

            // 保留原有方法作为后备
            nodeType.prototype.createRectangleOnSVG = function(svg, annotation) {
                return this.createRectangleElement(svg, annotation);
            };
            
            // 创建圆形SVG元素 (简化版本)
            nodeType.prototype.createCircleElement = function(svg, annotation) {
                try {
                    const coords = annotation.geometry.coordinates;
                    const color = annotation.color || '#00ff00';
                    
                    if (!coords || coords.length < 4) {
                        console.error('❌ 圆形坐标数据无效:', coords);
                        return null;
                    }
                    
                    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                    const cx = (coords[0] + coords[2]) / 2;
                    const cy = (coords[1] + coords[3]) / 2;
                    const rx = Math.abs(coords[2] - coords[0]) / 2;
                    const ry = Math.abs(coords[3] - coords[1]) / 2;
                    
                    ellipse.setAttribute('cx', cx);
                    ellipse.setAttribute('cy', cy);
                    ellipse.setAttribute('rx', rx);
                    ellipse.setAttribute('ry', ry);
                    ellipse.setAttribute('fill', color);
                    ellipse.setAttribute('fill-opacity', '0.3');
                    ellipse.setAttribute('stroke', color);
                    ellipse.setAttribute('stroke-width', '4');
                    ellipse.setAttribute('stroke-opacity', '1');
                    ellipse.setAttribute('data-annotation-id', annotation.id);
                    ellipse.setAttribute('data-annotation-number', annotation.number || '');
                    ellipse.classList.add('annotation-shape');
                    
                    svg.appendChild(ellipse);
                    
                    const addedEllipse = svg.querySelector(`[data-annotation-id="${annotation.id}"]`);
                    if (addedEllipse) {
                        console.log('✅ 圆形已成功添加到SVG');
                        return ellipse;
                    } else {
                        console.error('❌ 圆形添加到SVG失败');
                        return null;
                    }
                } catch (error) {
                    console.error('❌ 创建圆形元素出错:', error);
                    return null;
                }
            };

            // 保留原有方法作为后备
            nodeType.prototype.createCircleOnSVG = function(svg, annotation) {
                return this.createCircleElement(svg, annotation);
            };
            
            // 创建箭头SVG元素 (简化版本)
            nodeType.prototype.createArrowElement = function(svg, annotation) {
                try {
                    const coords = annotation.geometry.coordinates;
                    const color = annotation.color || '#0000ff';
                    const colorKey = color.replace('#', '');
                    
                    if (!coords || coords.length < 4) {
                        console.error('❌ 箭头坐标数据无效:', coords);
                        return null;
                    }
                    
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    
                    line.setAttribute('x1', coords[0]);
                    line.setAttribute('y1', coords[1]);
                    line.setAttribute('x2', coords[2]);
                    line.setAttribute('y2', coords[3]);
                    line.setAttribute('stroke', color);
                    line.setAttribute('stroke-width', '4');
                    line.setAttribute('stroke-opacity', '1');
                    line.setAttribute('marker-end', `url(#arrowhead-${colorKey})`);
                    line.setAttribute('data-annotation-id', annotation.id);
                    line.setAttribute('data-annotation-number', annotation.number || '');
                    line.classList.add('annotation-shape');
                    
                    svg.appendChild(line);
                    
                    const addedLine = svg.querySelector(`[data-annotation-id="${annotation.id}"]`);
                    if (addedLine) {
                        console.log('✅ 箭头已成功添加到SVG');
                        return line;
                    } else {
                        console.error('❌ 箭头添加到SVG失败');
                        return null;
                    }
                } catch (error) {
                    console.error('❌ 创建箭头元素出错:', error);
                    return null;
                }
            };

            // 保留原有方法作为后备
            nodeType.prototype.createArrowOnSVG = function(svg, annotation) {
                return this.createArrowElement(svg, annotation);
            };
            
            // 创建多边形SVG元素 (简化版本)
            nodeType.prototype.createPolygonElement = function(svg, annotation) {
                try {
                    const coords = annotation.geometry.coordinates;
                    const color = annotation.color || '#ff00ff';
                    
                    if (!coords || coords.length < 3) {
                        console.error('❌ 多边形坐标数据无效:', coords);
                        return null;
                    }
                    
                    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    const points = coords.map(coord => `${coord[0]},${coord[1]}`).join(' ');
                    
                    polygon.setAttribute('points', points);
                    polygon.setAttribute('fill', color);
                    polygon.setAttribute('fill-opacity', '0.3');
                    polygon.setAttribute('stroke', color);
                    polygon.setAttribute('stroke-width', '4');
                    polygon.setAttribute('stroke-opacity', '1');
                    polygon.setAttribute('data-annotation-id', annotation.id);
                    polygon.setAttribute('data-annotation-number', annotation.number || '');
                    polygon.classList.add('annotation-shape');
                    
                    svg.appendChild(polygon);
                    
                    const addedPolygon = svg.querySelector(`[data-annotation-id="${annotation.id}"]`);
                    if (addedPolygon) {
                        console.log('✅ 多边形已成功添加到SVG');
                        return polygon;
                    } else {
                        console.error('❌ 多边形添加到SVG失败');
                        return null;
                    }
                } catch (error) {
                    console.error('❌ 创建多边形元素出错:', error);
                    return null;
                }
            };

            // 保留原有方法作为后备
            nodeType.prototype.createPolygonOnSVG = function(svg, annotation) {
                return this.createPolygonElement(svg, annotation);
            };
            
            // 绑定基础事件
            nodeType.prototype.bindBasicEvents = function(modal) {
                // 🔗 初始化时同步后端节点参数到前端UI
                const textPromptWidget = this.widgets?.find(w => w.name === "text_prompt");
                const promptTemplateWidget = this.widgets?.find(w => w.name === "prompt_template");
                
                const operationType = modal.querySelector('#operation-type');
                const targetInput = modal.querySelector('#target-input');
                
                if (promptTemplateWidget && operationType && promptTemplateWidget.value) {
                    operationType.value = promptTemplateWidget.value;
                    console.log('🔄 已从后端同步操作类型到前端:', promptTemplateWidget.value);
                }
                
                if (textPromptWidget && targetInput && textPromptWidget.value) {
                    targetInput.value = textPromptWidget.value;
                    console.log('🔄 已从后端同步文本提示到前端:', textPromptWidget.value);
                }
                
                // 关闭按钮
                const closeBtn = modal.querySelector('#vpe-close');
                if (closeBtn) {
                    closeBtn.onclick = () => {
                        document.body.removeChild(modal);
                    };
                }
                
                // 保存按钮
                const saveBtn = modal.querySelector('#vpe-save');
                if (saveBtn) {
                    saveBtn.onclick = () => {
                        // 🔍 先检查modal.annotations是否存在
                        console.log('🔍 检查modal.annotations:', {
                            exists: !!modal.annotations,
                            length: modal.annotations?.length || 0,
                            data: modal.annotations
                        });
                        
                        // 🔍 检查SVG中的标注元素
                        const svg = modal.querySelector('#drawing-layer svg');
                        if (svg) {
                            const shapes = svg.querySelectorAll('.annotation-shape');
                            console.log('🔍 SVG中的标注形状数量:', shapes.length);
                            shapes.forEach((shape, index) => {
                                console.log(`📍 形状${index + 1}:`, {
                                    tagName: shape.tagName,
                                    id: shape.getAttribute('data-annotation-id'),
                                    number: shape.getAttribute('data-annotation-number'),
                                    class: shape.getAttribute('class')
                                });
                            });
                        }
                        
                        const promptData = exportPromptData(modal);
                        if (promptData) {
                            console.log('💾 保存提示词数据:', promptData);
                            
                            // 🔍 详细调试：检查所有标注数据
                            if (promptData.annotations && promptData.annotations.length > 0) {
                                console.log('📊 保存的标注详情:');
                                promptData.annotations.forEach((annotation, index) => {
                                    console.log(`📍 标注${index + 1}:`, {
                                        id: annotation.id,
                                        type: annotation.type,
                                        hasPoints: !!annotation.points,
                                        pointsCount: annotation.points?.length,
                                        hasBrushSize: !!annotation.brushSize,
                                        hasBrushFeather: !!annotation.brushFeather,
                                        hasGeometry: !!annotation.geometry,
                                        opacity: annotation.opacity
                                    });
                                });
                            } else {
                                console.warn('⚠️ 没有找到要保存的标注数据！');
                            }
                            
                            // 实际保存逻辑：保存到节点的annotation_data widget并同步到后端节点参数
                            try {
                                const annotationDataWidget = this.widgets?.find(w => w.name === "annotation_data");
                                const textPromptWidget = this.widgets?.find(w => w.name === "text_prompt");
                                const promptTemplateWidget = this.widgets?.find(w => w.name === "prompt_template");
                                
                                if (annotationDataWidget) {
                                    // 确保保存的annotations有正确的数据结构
                                    if (promptData.annotations) {
                                        promptData.annotations = promptData.annotations.map(annotation => {
                                            const normalized = this.normalizeAnnotationData ? this.normalizeAnnotationData(annotation) : annotation;
                                            console.log('💾 保存时标准化annotation:', {
                                                id: normalized.id,
                                                hasGeometry: !!normalized.geometry,
                                                hasCoordinates: !!(normalized.geometry && normalized.geometry.coordinates)
                                            });
                                            return normalized;
                                        });
                                    }
                                    
                                    // 保存完整的promptData作为JSON字符串
                                    const dataToSave = JSON.stringify(promptData);
                                    annotationDataWidget.value = dataToSave;
                                    console.log('✅ 已保存annotation_data到widget:', dataToSave.length, '字符');
                                    console.log('💾 保存的数据预览:', dataToSave.substring(0, 200) + '...');
                                    
                                    // 🔗 自动同步前端选择的操作类型和文本到后端节点参数
                                    const operationType = modal.querySelector('#operation-type');
                                    const targetInput = modal.querySelector('#target-input');
                                    
                                    if (operationType && promptTemplateWidget && operationType.value !== promptTemplateWidget.value) {
                                        promptTemplateWidget.value = operationType.value;
                                        console.log('🔄 已同步操作类型到后端:', operationType.value);
                                    }
                                    
                                    if (targetInput && textPromptWidget && targetInput.value !== textPromptWidget.value) {
                                        textPromptWidget.value = targetInput.value;
                                        console.log('🔄 已同步文本提示到后端:', targetInput.value);
                                    }
                                    
                                    // 标记节点为已修改，触发重新计算
                                    if (app.graph) {
                                        app.graph.setDirtyCanvas(true);
                                    }
                                } else {
                                    console.error('❌ 未找到annotation_data widget');
                                }
                                
                                KontextUtils.showNotification('数据已保存并同步到后端节点', 'success');
                            } catch (error) {
                                console.error('❌ 保存数据失败:', error);
                                KontextUtils.showNotification('保存失败: ' + error.message, 'error');
                            }
                        }
                    };
                }
                
                
                // 🔧 高亮选中的标注功能（内联版本 + 调试增强）
                const highlightSelectedAnnotations = (modal, selectedIds) => {
                    const svg = modal.querySelector('#drawing-layer svg');
                    if (!svg) {
                        console.error('❌ 未找到SVG容器');
                        return;
                    }
                    
                    console.log('🔍 SVG容器找到，开始处理高亮');
                    
                    // 🔍 调试：显示SVG中的所有标注元素
                    const allShapes = svg.querySelectorAll('.annotation-shape');
                    console.log('🔍 SVG中找到的标注形状:', allShapes.length);
                    allShapes.forEach((shape, index) => {
                        console.log(`📍 形状${index + 1}:`, {
                            tagName: shape.tagName,
                            annotationId: shape.getAttribute('data-annotation-id'),
                            annotationNumber: shape.getAttribute('data-annotation-number'),
                            class: shape.getAttribute('class'),
                            currentStrokeWidth: shape.getAttribute('stroke-width')
                        });
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
                        
                        console.log('🔄 恢复形状原始状态:', {
                            tagName: shape.tagName,
                            originalStroke: originalStroke,
                            originalStrokeWidth: originalStrokeWidth,
                            currentStroke: shape.getAttribute('stroke'),
                            currentStrokeWidth: shape.getAttribute('stroke-width')
                        });
                    });
                    
                    svg.querySelectorAll('.annotation-label circle').forEach(circle => {
                        circle.setAttribute('stroke', '#fff');
                        circle.setAttribute('stroke-width', '3');
                    });
                    
                    // 高亮选中的标注
                    let highlightedCount = 0;
                    selectedIds.forEach(annotationId => {
                        console.log('🎯 尝试高亮标注:', annotationId);
                        
                        const targetShape = svg.querySelector(`[data-annotation-id="${annotationId}"]`);
                        if (targetShape) {
                            console.log('✅ 找到目标形状:', targetShape.tagName);
                            
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
                            console.log('🔍 高亮后的属性:', {
                                strokeWidth: targetShape.getAttribute('stroke-width'),
                                stroke: targetShape.getAttribute('stroke'),
                                strokeOpacity: targetShape.getAttribute('stroke-opacity'),
                                hasSelectedClass: targetShape.classList.contains('selected'),
                                filter: targetShape.style.filter
                            });
                            
                            // 高亮对应的编号标签
                            const annotation = modal.annotations?.find(ann => ann.id === annotationId);
                            if (annotation) {
                                const label = svg.querySelector(`[data-annotation-number="${annotation.number}"]`);
                                if (label) {
                                    const circle = label.querySelector('circle');
                                    if (circle) {
                                        circle.setAttribute('stroke', '#ffff00');
                                        circle.setAttribute('stroke-width', '4');
                                        console.log('✅ 已高亮编号标签:', annotation.number);
                                    }
                                }
                            }
                        } else {
                            console.error('❌ 未找到标注形状:', annotationId);
                            
                            // 🔍 尝试其他可能的选择器
                            const altShape1 = svg.querySelector(`[data-id="${annotationId}"]`);
                            const altShape2 = svg.querySelector(`#${annotationId}`);
                            console.log('🔍 尝试其他选择器:', {
                                'data-id': !!altShape1,
                                'id': !!altShape2
                            });
                        }
                    });
                    
                    console.log(`✅ 已高亮 ${highlightedCount}/${selectedIds.length} 个标注`);
                };
                
                // 🔧 临时解决方案：直接定义函数避免时序问题
                const undoLastAnnotation = (modal) => {
                    console.log('↶ 尝试撤销最后一个标注...');
                    
                    if (!modal.annotations || modal.annotations.length === 0) {
                        console.log('⚠️ 没有可撤销的标注');
                        return;
                    }
                    
                    const lastAnnotation = modal.annotations.pop();
                    console.log('↶ 撤销标注:', lastAnnotation.id, '类型:', lastAnnotation.type);
                    
                    // 从SVG中移除标注形状
                    const svg = modal.querySelector('#drawing-layer svg');
                    if (svg) {
                        // 移除主要形状
                        const shape = svg.querySelector(`[data-annotation-id="${lastAnnotation.id}"]`);
                        if (shape) {
                            shape.remove();
                            console.log('✅ 已移除标注形状');
                        }
                        
                        // 移除编号标签
                        const labels = svg.querySelectorAll(`[data-annotation-number="${lastAnnotation.number}"]`);
                        labels.forEach(label => {
                            label.remove();
                            console.log('✅ 已移除编号标签');
                        });
                        
                        const texts = svg.querySelectorAll(`text[data-annotation-number="${lastAnnotation.number}"]`);
                        texts.forEach(text => text.remove());
                    }
                    
                    // 更新图层面板 - 使用内联函数避免依赖问题
                    if (this.loadLayersToPanel) {
                        this.loadLayersToPanel(modal, modal.annotations);
                    } else {
                        // 简化版本的图层面板更新
                        const annotationObjects = modal.querySelector('#annotation-objects');
                        if (annotationObjects) {
                            if (modal.annotations.length === 0) {
                                annotationObjects.innerHTML = '<p style="color: #888; font-style: italic; text-align: center; padding: 20px;">No annotations to display</p>';
                            } else {
                                // 重新加载图层列表
                                annotationObjects.innerHTML = '';
                                modal.annotations.forEach((layer, index) => {
                                    const layerItem = document.createElement('div');
                                    layerItem.className = 'layer-item';
                                    layerItem.style.cssText = `
                                        display: flex; align-items: center; padding: 8px; margin-bottom: 4px;
                                        background: #2b2b2b; border-radius: 4px; cursor: pointer;
                                        border: 1px solid #444;
                                    `;
                                    
                                    layerItem.innerHTML = `
                                        <input type="checkbox" data-annotation-id="${layer.id}" data-layer-id="${layer.id}" 
                                               style="margin-right: 8px; cursor: pointer;" checked>
                                        <span style="font-size: 12px; color: #ddd;">
                                            🔶 ${layer.type} annotation ${index + 1}
                                        </span>
                                    `;
                                    
                                    annotationObjects.appendChild(layerItem);
                                });
                            }
                        }
                    }
                    
                    // 更新Select All状态和高亮
                    const selectAllCheckbox = modal.querySelector('#select-all-objects');
                    if (selectAllCheckbox) {
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
                        
                        // 🔧 更新高亮状态
                        const selectedAnnotationIds = [];
                        modal.querySelectorAll('#annotation-objects input[type="checkbox"]:checked').forEach(checkbox => {
                            const annotationId = checkbox.dataset.annotationId;
                            if (annotationId) {
                                selectedAnnotationIds.push(annotationId);
                            }
                        });
                        highlightSelectedAnnotations(modal, selectedAnnotationIds);
                    }
                    
                    console.log('✅ 撤销完成，剩余标注:', modal.annotations.length, '个');
                };
                
                const clearAllAnnotations = (modal) => {
                    console.log('🧹 开始清空所有标注...');
                    
                    // 清空annotations数组
                    if (modal.annotations) {
                        console.log('🗑️ 清空', modal.annotations.length, '个标注数据');
                        modal.annotations = [];
                    }
                    
                    // 清空SVG中的标注元素
                    const svg = modal.querySelector('#drawing-layer svg');
                    if (svg) {
                        const shapes = svg.querySelectorAll('.annotation-shape');
                        const labels = svg.querySelectorAll('.annotation-label');
                        const texts = svg.querySelectorAll('text[data-annotation-number]');
                        
                        console.log('🗑️ 清空SVG元素:', {
                            shapes: shapes.length,
                            labels: labels.length, 
                            texts: texts.length
                        });
                        
                        // 移除所有相关元素
                        shapes.forEach(el => el.remove());
                        labels.forEach(el => el.remove());
                        texts.forEach(el => el.remove());
                    }
                    
                    // 更新图层面板
                    const annotationObjects = modal.querySelector('#annotation-objects');
                    if (annotationObjects) {
                        annotationObjects.innerHTML = '<p style="color: #888; font-style: italic; text-align: center; padding: 20px;">No annotations to display</p>';
                    }
                    
                    // 重置Select All状态和高亮
                    const selectAllCheckbox = modal.querySelector('#select-all-objects');
                    if (selectAllCheckbox) {
                        selectAllCheckbox.checked = false;
                        selectAllCheckbox.indeterminate = false;
                    }
                    
                    // 🔧 清除所有高亮
                    highlightSelectedAnnotations(modal, []);
                    
                    console.log('✅ 已清空所有标注');
                };
                
                // 撤销按钮
                const undoBtn = modal.querySelector('#vpe-undo');
                if (undoBtn) {
                    undoBtn.onclick = () => {
                        undoLastAnnotation(modal);
                    };
                }
                
                // 清空按钮
                const clearBtn = modal.querySelector('#vpe-clear');
                if (clearBtn) {
                    clearBtn.onclick = () => {
                        clearAllAnnotations(modal);
                    };
                }
                
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
                        const svg = modal.querySelector('#drawing-layer svg');
                        if (svg) {
                            // 计算不透明度值 (0-1)
                            const fillOpacity = opacityPercent / 100;
                            const strokeOpacity = Math.min(fillOpacity + 0.3, 1.0);
                            
                            // 更新所有SVG形状的不透明度
                            const shapes = svg.querySelectorAll('.annotation-shape');
                            console.log('🎨 更新', shapes.length, '个标注的不透明度为', opacityPercent + '%');
                            
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
                                        // 创建新的不透明度marker
                                        const colorHex = color.replace('#', '');
                                        const markerId = `arrowhead-${colorHex}-opacity-${Math.round(opacityPercent)}`;
                                        
                                        const defs = svg.querySelector('defs');
                                        if (defs && !defs.querySelector(`#${markerId}`)) {
                                            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                                            marker.setAttribute('id', markerId);
                                            marker.setAttribute('markerWidth', '10');
                                            marker.setAttribute('markerHeight', '7');
                                            marker.setAttribute('refX', '9');
                                            marker.setAttribute('refY', '3.5');
                                            marker.setAttribute('orient', 'auto');
                                            
                                            const markerFillOpacity = Math.min((opacityPercent + 30) / 100, 1.0);
                                            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                                            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                                            polygon.setAttribute('fill', color);
                                            polygon.setAttribute('fill-opacity', markerFillOpacity.toString());
                                            
                                            marker.appendChild(polygon);
                                            defs.appendChild(marker);
                                        }
                                        
                                        // 更新箭头的marker引用
                                        shape.setAttribute('marker-end', `url(#${markerId})`);
                                        console.log(`🏹 更新箭头不透明度: ${markerId}`);
                                    }
                                }
                            });
                            
                            // 更新annotations数据中的不透明度
                            if (modal.annotations) {
                                modal.annotations.forEach(annotation => {
                                    annotation.opacity = opacityPercent;
                                });
                            }
                        }
                        
                        console.log('🎨 不透明度调整为:', opacityPercent + '%');
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
                        console.log('🖌️ 画笔大小调整为:', sizeValue + 'px');
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
                        console.log('🖌️ 画笔羽化调整为:', featherValue + 'px');
                    };
                }
                
                // 工具选择按钮
                const toolButtons = modal.querySelectorAll('.vpe-tool');
                toolButtons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        const toolName = button.dataset.tool;
                        if (toolName) {
                            // 移除所有工具的激活状态
                            toolButtons.forEach(btn => btn.classList.remove('active'));
                            // 激活当前工具
                            button.classList.add('active');
                            // 设置活动工具
                            modal.activeTool = toolName;
                            setActiveTool(modal, toolName);
                            
                            // 显示/隐藏画笔控制组
                            const brushControls = modal.querySelector('#vpe-brush-controls');
                            if (brushControls) {
                                brushControls.style.display = toolName === 'brush' ? 'flex' : 'none';
                            }
                            
                            console.log('🎨 选择工具:', toolName);
                        }
                    });
                });
                
                // 🔧 添加Select All Layers功能
                const selectAllCheckbox = modal.querySelector('#select-all-objects');
                if (selectAllCheckbox) {
                    selectAllCheckbox.addEventListener('change', (e) => {
                        const isChecked = e.target.checked;
                        console.log('🔲 Select All Layers:', isChecked ? '全选' : '取消全选');
                        
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
                        
                        console.log('✅ 已', isChecked ? '选中' : '取消选中', layerCheckboxes.length, '个图层');
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
                    const annotationObjects = modal.querySelector('#annotation-objects');
                    if (annotationObjects) {
                        annotationObjects.addEventListener('change', (e) => {
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
                                    
                                    console.log('🎯 当前选中的标注:', selectedAnnotationIds);
                                    
                                    // 调用高亮功能
                                    highlightSelectedAnnotations(modal, selectedAnnotationIds);
                                    
                                } catch (error) {
                                    console.error('❌ 调用高亮功能失败:', error);
                                    // 后备方案：使用简化的高亮逻辑
                                    const annotationId = e.target.getAttribute('data-annotation-id');
                                    const isChecked = e.target.checked;
                                    
                                    if (annotationId) {
                                        const svg = modal.querySelector('#drawing-layer svg');
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
                                                    
                                                    console.log('✨ 高亮标注:', annotationId);
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
                                                    
                                                    console.log('🔹 取消高亮标注:', annotationId);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
                
                // 颜色选择按钮
                const colorButtons = modal.querySelectorAll('.vpe-color');
                colorButtons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        const color = button.dataset.color;
                        if (color) {
                            // 移除所有颜色的激活状态
                            colorButtons.forEach(btn => btn.classList.remove('active'));
                            // 激活当前颜色
                            button.classList.add('active');
                            // 设置当前颜色
                            modal.currentColor = color;
                            
                            console.log('🎨 选择颜色:', color);
                        }
                    });
                });
                
                // 填充模式切换按钮
                const fillToggle = modal.querySelector('#vpe-fill-toggle');
                if (fillToggle) {
                    // 初始化填充模式
                    modal.fillMode = 'filled';
                    
                    fillToggle.addEventListener('click', () => {
                        if (modal.fillMode === 'filled') {
                            modal.fillMode = 'outline';
                            fillToggle.textContent = '⭕ Outline';
                            fillToggle.classList.add('outline');
                        } else {
                            modal.fillMode = 'filled';
                            fillToggle.textContent = '🔴 Filled';
                            fillToggle.classList.remove('outline');
                        }
                        console.log('🎨 填充模式切换为:', modal.fillMode);
                    });
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
            };
            
            // 监听Generated Description自动保存事件
            modal.addEventListener('descriptionsaved', (event) => {
                console.log('🔄 检测到Generated Description自动保存事件');
                const promptData = event.detail.promptData;
                
                if (promptData) {
                    try {
                        // 自动保存到节点的annotation_data widget
                        const annotationDataWidget = this.widgets?.find(w => w.name === "annotation_data");
                        if (annotationDataWidget) {
                            annotationDataWidget.value = JSON.stringify(promptData);
                            console.log('✅ Generated Description自动保存到widget完成');
                            
                            // 通知ComfyUI图形需要更新
                            if (app.graph) {
                                app.graph.setDirtyCanvas(true);
                            }
                        } else {
                            console.warn('⚠️ 未找到annotation_data widget');
                        }
                    } catch (error) {
                        console.error('❌ Generated Description自动保存失败:', error);
                    }
                }
            });
            
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
                    console.log('🎨 不透明度更新详情:');
                    modal.annotations.forEach((annotation, index) => {
                        console.log(`  📍 标注${index + 1}: ID=${annotation.id}, 不透明度=${annotation.opacity}%`);
                    });
                }
                
                console.log('🎨 已更新', shapes.length, '个标注的不透明度为', opacityPercent + '%');
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
                
                // 创建新的marker
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                marker.setAttribute('id', markerId);
                marker.setAttribute('markerWidth', '10');
                marker.setAttribute('markerHeight', '7');
                marker.setAttribute('refX', '9');
                marker.setAttribute('refY', '3.5');
                marker.setAttribute('orient', 'auto');
                
                const fillOpacity = Math.min((opacity + 30) / 100, 1.0);
                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                polygon.setAttribute('fill', color);
                polygon.setAttribute('fill-opacity', fillOpacity.toString());
                
                marker.appendChild(polygon);
                defs.appendChild(marker);
                
                console.log(`🏹 内联创建箭头marker: ${markerId}, 不透明度: ${fillOpacity}`);
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
                        // 创建新的marker
                        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                        marker.setAttribute('id', markerId);
                        marker.setAttribute('markerWidth', '10');
                        marker.setAttribute('markerHeight', '7');
                        marker.setAttribute('refX', '9');
                        marker.setAttribute('refY', '3.5');
                        marker.setAttribute('orient', 'auto');
                        
                        const fillOpacity = Math.min((opacity + 30) / 100, 1.0);
                        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
                        polygon.setAttribute('fill', color);
                        polygon.setAttribute('fill-opacity', fillOpacity.toString());
                        
                        marker.appendChild(polygon);
                        defs.appendChild(marker);
                        console.log(`🏹 创建新箭头marker: ${markerId}, 不透明度: ${fillOpacity}`);
                    }
                    
                    // 更新箭头的marker引用
                    arrowElement.setAttribute('marker-end', `url(#${markerId})`);
                    console.log(`🏹 更新箭头marker: ${markerId}, 不透明度: ${opacity}%`);
                } catch (error) {
                    console.error('❌ 更新箭头marker失败:', error);
                }
            };
            
            // 获取对象信息（从annotations模块获取）
            nodeType.prototype.getObjectInfo = function(annotation, index) {
                // 这个函数在annotations模块中实现
                // 这里提供一个简化版本作为后备
                return {
                    icon: '📍',
                    description: `[${index}] Annotation ${annotation.type}`
                };
            };
            
            
            // 加载图层到面板
            nodeType.prototype.loadLayersToPanel = function(modal, layers) {
                console.log('🔍 loadLayersToPanel called with layers:', layers?.length || 0);
                
                // Safety checks
                if (!modal) {
                    console.error('❌ loadLayersToPanel: modal is null/undefined');
                    return;
                }

                // Find the layers container - use correct element ID from UI module
                const layersList = modal.querySelector('#annotation-objects');
                
                if (!layersList) {
                    console.error('❌ loadLayersToPanel: #annotation-objects element not found');
                    console.log('🔍 Available elements with IDs:', Array.from(modal.querySelectorAll('*[id]')).map(el => el.id));
                    return;
                }
                
                if (!Array.isArray(layers) || layers.length === 0) {
                    layersList.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No layers detected<br><small>Draw annotations to see them here</small></div>';
                    console.log('✅ Empty state set in layers panel');
                    return;
                }
                
                try {
                    layersList.innerHTML = '';
                    console.log('✅ Layers panel cleared, processing', layers.length, 'layers');
                    
                    layers.forEach((layer, index) => {
                    const layerItem = document.createElement('div');
                    layerItem.style.cssText = `
                        margin: 8px 0; padding: 12px; background: #2b2b2b;
                        border-radius: 6px; cursor: pointer; border: 2px solid transparent;
                        transition: all 0.2s;
                    `;
                    
                    layerItem.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <div style="color: white; font-weight: 600; margin-bottom: 4px;">${layer.class_name || 'Annotation'}</div>
                                <div style="font-size: 12px; color: #888;">
                                    ID: ${layer.id || index} | Type: ${layer.type || 'manual'}
                                </div>
                                ${layer.area ? `<div style="font-size: 12px; color: #888;">Area: ${layer.area} px</div>` : ''}
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" ${index < 3 ? 'checked' : ''} data-layer-id="${layer.id || index}" 
                                       style="transform: scale(1.2);">
                            </div>
                        </div>
                    `;
                    
                    // 点击选择图层
                    layerItem.onclick = (e) => {
                        if (e.target.type !== 'checkbox') {
                            const checkbox = layerItem.querySelector('input[type="checkbox"]');
                            checkbox.checked = !checkbox.checked;
                        }
                        
                        // 更新视觉反馈
                        const isSelected = layerItem.querySelector('input[type="checkbox"]').checked;
                        layerItem.style.borderColor = isSelected ? '#673AB7' : 'transparent';
                        layerItem.style.background = isSelected ? '#3a2a5c' : '#2b2b2b';
                        
                        console.log('🎯 VPE选中图层:', layer.id || index);
                    };
                    
                    layersList.appendChild(layerItem);
                });
                
                    console.log('✅ VPE图层列表已更新:', layers.length);
                } catch (error) {
                    console.error('❌ Error in loadLayersToPanel:', error);
                    console.error('❌ Error stack:', error.stack);
                }
            };
            
            // 更新提示词统计
            nodeType.prototype.updatePromptStats = function(modal, layers) {
                // 这里可以添加提示词统计逻辑
                console.log('📊 更新提示词统计:', layers.length);
            };
            
            // 撤销最后一个标注
            nodeType.prototype.undoLastAnnotation = function(modal) {
                console.log('↶ 尝试撤销最后一个标注...');
                
                if (!modal.annotations || modal.annotations.length === 0) {
                    console.log('⚠️ 没有可撤销的标注');
                    return;
                }
                
                const lastAnnotation = modal.annotations.pop();
                console.log('↶ 撤销标注:', lastAnnotation.id, '类型:', lastAnnotation.type);
                
                // 从SVG中移除标注形状
                const svg = modal.querySelector('#drawing-layer svg');
                if (svg) {
                    // 移除主要形状
                    const shape = svg.querySelector(`[data-annotation-id="${lastAnnotation.id}"]`);
                    if (shape) {
                        shape.remove();
                        console.log('✅ 已移除标注形状');
                    }
                    
                    // 移除编号标签（可能有多种格式）
                    const labels = svg.querySelectorAll(`[data-annotation-number="${lastAnnotation.number}"]`);
                    labels.forEach(label => {
                        label.remove();
                        console.log('✅ 已移除编号标签');
                    });
                    
                    // 移除其他相关元素
                    const texts = svg.querySelectorAll(`text[data-annotation-number="${lastAnnotation.number}"]`);
                    texts.forEach(text => text.remove());
                }
                
                // 更新图层面板
                this.loadLayersToPanel(modal, modal.annotations);
                
                // 更新Select All状态
                const selectAllCheckbox = modal.querySelector('#select-all-objects');
                if (selectAllCheckbox) {
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
                }
                
                console.log('✅ 撤销完成，剩余标注:', modal.annotations.length, '个');
            };
            
            // 清空所有标注
            nodeType.prototype.clearAllAnnotations = function(modal) {
                console.log('🧹 开始清空所有标注...');
                
                // 清空annotations数组
                if (modal.annotations) {
                    console.log('🗑️ 清空', modal.annotations.length, '个标注数据');
                    modal.annotations = [];
                }
                
                // 清空SVG中的标注元素
                const svg = modal.querySelector('#drawing-layer svg');
                if (svg) {
                    const shapes = svg.querySelectorAll('.annotation-shape');
                    const labels = svg.querySelectorAll('.annotation-label');
                    const texts = svg.querySelectorAll('text[data-annotation-number]');
                    
                    console.log('🗑️ 清空SVG元素:', {
                        shapes: shapes.length,
                        labels: labels.length, 
                        texts: texts.length
                    });
                    
                    // 移除所有相关元素
                    shapes.forEach(el => el.remove());
                    labels.forEach(el => el.remove());
                    texts.forEach(el => el.remove());
                }
                
                // 更新图层面板
                const annotationObjects = modal.querySelector('#annotation-objects');
                if (annotationObjects) {
                    annotationObjects.innerHTML = '<p style="color: #888; font-style: italic; text-align: center; padding: 20px;">No annotations to display</p>';
                }
                
                // 重置Select All状态
                const selectAllCheckbox = modal.querySelector('#select-all-objects');
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = false;
                    selectAllCheckbox.indeterminate = false;
                }
                
                console.log('✅ 已清空所有标注');
            };
            
            // 导出当前提示词数据
            nodeType.prototype.exportCurrentPromptData = function() {
                // 这里需要获取当前打开的modal
                // 暂时只是显示消息
                console.log('📊 导出提示词数据功能');
                KontextUtils.showNotification('导出功能开发中', 'info');
            };

            // 更新恢复后的图层选择面板 - 使用新的下拉复选框界面
            nodeType.prototype.updateRestoredObjectSelector = function(modal) {
                console.log('🔍 更新恢复后的图层选择面板:', {
                    annotations: modal.annotations?.length || 0
                });
                
                // 导入并调用新的updateObjectSelector函数
                try {
                    // 动态导入annotations模块中的updateObjectSelector函数
                    import('./modules/visual_prompt_editor_annotations.js').then(module => {
                        // 直接调用模块中的updateObjectSelector
                        if (typeof window.updateObjectSelector === 'function') {
                            window.updateObjectSelector(modal);
                        } else {
                            // 如果全局函数不存在，直接调用我们的实现
                            this.updateObjectSelectorDirect(modal);
                        }
                    }).catch(error => {
                        console.log('📝 使用直接调用方式更新图层选择器');
                        this.updateObjectSelectorDirect(modal);
                    });
                } catch (error) {
                    console.log('📝 使用直接调用方式更新图层选择器');
                    this.updateObjectSelectorDirect(modal);
                }
            };
            
            // 直接调用updateObjectSelector的实现
            nodeType.prototype.updateObjectSelectorDirect = function(modal) {
                const dropdownOptions = modal.querySelector('#dropdown-options');
                const layerOperations = modal.querySelector('#layer-operations');
                const noLayersMessage = modal.querySelector('#no-layers-message');
                const selectionCount = modal.querySelector('#selection-count');
                
                if (!dropdownOptions) {
                    console.warn('⚠️ 下拉选择器元素未找到，跳过更新');
                    return;
                }
                
                if (!modal.annotations || modal.annotations.length === 0) {
                    dropdownOptions.innerHTML = '';
                    if (layerOperations) layerOperations.style.display = 'none';
                    if (noLayersMessage) noLayersMessage.style.display = 'block';
                    if (selectionCount) selectionCount.textContent = '0 selected';
                    return;
                }
                
                // 隐藏空消息，显示操作区域
                if (noLayersMessage) noLayersMessage.style.display = 'none';
                
                // 清空现有选项
                dropdownOptions.innerHTML = '';
                
                // 创建下拉选项
                modal.annotations.forEach((annotation, index) => {
                    const objectInfo = this.getRestoredObjectInfo(annotation, index);
                    
                    const option = document.createElement('div');
                    option.style.cssText = `
                        display: flex; align-items: center; gap: 4px; padding: 2px 6px; 
                        cursor: pointer; margin: 0; height: 20px;
                        transition: background 0.2s ease; 
                        border-bottom: 1px solid #444;
                    `;
                    
                    const isSelected = modal.selectedLayers?.has(annotation.id) || false;
                    
                    // 极简信息显示
                    const layerName = `Layer ${annotation.number}`;
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
                    
                    // 绑定复选框事件
                    const checkbox = option.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.addEventListener('change', (e) => {
                            e.stopPropagation();
                            this.toggleLayerSelectionDirect(modal, annotation.id, checkbox.checked);
                        });
                    }
                    
                    // 绑定选项点击事件（切换复选框）
                    option.addEventListener('click', (e) => {
                        if (e.target.type !== 'checkbox') {
                            checkbox.checked = !checkbox.checked;
                            this.toggleLayerSelectionDirect(modal, annotation.id, checkbox.checked);
                        }
                    });
                });
                
                // 初始化选中状态管理
                if (!modal.selectedLayers) {
                    modal.selectedLayers = new Set();
                }
                
                // 更新选中计数和下拉框文本
                this.updateSelectionCountDirect(modal);
                this.updateDropdownTextDirect(modal);
                
                console.log('✅ 下拉复选框式图层选择器已更新，共', modal.annotations.length, '个图层');
            };
            
            // 直接实现toggleLayerSelection
            nodeType.prototype.toggleLayerSelectionDirect = function(modal, annotationId, isSelected) {
                if (!modal.selectedLayers) {
                    modal.selectedLayers = new Set();
                }
                
                if (isSelected) {
                    modal.selectedLayers.add(annotationId);
                } else {
                    modal.selectedLayers.delete(annotationId);
                }
                
                // 更新下拉框显示文本
                this.updateDropdownTextDirect(modal);
                
                // 更新选中计数
                this.updateSelectionCountDirect(modal);
                
                console.log(`${isSelected ? '✅' : '❌'} 图层 ${annotationId} 选中状态: ${isSelected}`);
            };
            
            // 直接实现updateSelectionCount
            nodeType.prototype.updateSelectionCountDirect = function(modal) {
                const selectionCount = modal.querySelector('#selection-count');
                if (selectionCount && modal.selectedLayers) {
                    const count = modal.selectedLayers.size;
                    selectionCount.textContent = `${count} selected`;
                }
            };
            
            // 直接实现updateDropdownText
            nodeType.prototype.updateDropdownTextDirect = function(modal) {
                const dropdownText = modal.querySelector('#dropdown-text');
                if (!dropdownText || !modal.selectedLayers) return;
                
                const selectedCount = modal.selectedLayers.size;
                if (selectedCount === 0) {
                    dropdownText.textContent = 'Click to select layers...';
                    dropdownText.style.color = '#aaa';
                    dropdownText.style.fontSize = '12px';
                } else if (selectedCount === 1) {
                    const selectedId = Array.from(modal.selectedLayers)[0];
                    const annotation = modal.annotations.find(ann => ann.id === selectedId);
                    if (annotation) {
                        const layerName = `Layer ${annotation.number}`;
                        const operationType = annotation.operationType || 'add_object';
                        dropdownText.textContent = `${layerName} • ${operationType}`;
                        dropdownText.style.color = 'white';
                        dropdownText.style.fontSize = '12px';
                    }
                } else {
                    dropdownText.textContent = `${selectedCount} layers selected`;
                    dropdownText.style.color = 'white';
                    dropdownText.style.fontSize = '12px';
                }
            };

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
                        console.warn('⚠️ annotation缺少位置数据:', annotation);
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
            nodeType.prototype.loadLayersToPanel = function(modal, layersData) {
                console.log('📊 加载图层到面板:', layersData.length, '个图层');
                
                const annotationObjects = modal.querySelector('#annotation-objects');
                if (!annotationObjects) {
                    console.warn('⚠️ 未找到annotation-objects容器');
                    return;
                }
                
                // 清空现有内容
                annotationObjects.innerHTML = '';
                
                if (!layersData || layersData.length === 0) {
                    annotationObjects.innerHTML = '<p style="color: #888; font-style: italic; text-align: center; padding: 20px;">No annotations to display</p>';
                    return;
                }
                
                // 为每个图层创建条目
                layersData.forEach((layer, index) => {
                    const layerItem = document.createElement('div');
                    layerItem.className = 'layer-item';
                    layerItem.style.cssText = `
                        display: flex; align-items: center; padding: 8px; margin-bottom: 4px;
                        background: #2b2b2b; border-radius: 4px; cursor: pointer;
                        border: 1px solid #444;
                    `;
                    
                    // 生成图层描述
                    const layerInfo = this.generateLayerDescription(layer, index);
                    
                    layerItem.innerHTML = `
                        <input type="checkbox" data-annotation-id="${layer.id}" data-layer-id="${layer.id}" 
                               style="margin-right: 8px; cursor: pointer;">
                        <span style="font-size: 12px; color: #ddd;">
                            ${layerInfo.icon} ${layerInfo.description}
                        </span>
                    `;
                    
                    annotationObjects.appendChild(layerItem);
                });
                
                console.log('✅ 图层面板加载完成');
            };
            
            // 🔧 添加缺失的函数 - 更新提示词统计
            nodeType.prototype.updatePromptStats = function(modal, layersData) {
                console.log('📊 更新提示词统计:', layersData.length, '个图层');
                
                const selectionCount = modal.querySelector('#selection-count');
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
                
                console.log('📊 统计信息:', statsInfo);
            };
        }
    }
});

console.log("🎨 Visual Prompt Editor V2 (Modular) extension loaded");
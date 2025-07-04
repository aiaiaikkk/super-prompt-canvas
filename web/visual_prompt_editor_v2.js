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
    bindCanvasInteractionEvents 
} from './modules/visual_prompt_editor_annotations.js';
import { 
    bindPromptEvents, 
    showPromptQualityAnalysis,
    exportPromptData
} from './modules/visual_prompt_editor_prompts.js';

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
                
                // 添加编辑状态显示
                this.addWidget("text", "editor_status", "Ready to edit (V2)", () => {}, {
                    serialize: false
                });
                
                // 添加提示词质量显示
                this.addWidget("text", "prompt_quality", "Quality: N/A", () => {}, {
                    serialize: false
                });
                
                // 添加选中对象计数
                this.addWidget("text", "selected_count", "0 objects selected", () => {}, {
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
                    imageDataLength: imageData?.length 
                });
                renderImageCanvas(imageCanvas, imageData);
                
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
                
                // 初始化画布绘制 - 延长时间确保DOM完全就绪
                setTimeout(() => {
                    console.log('🎨 开始初始化画布绘制...');
                    initCanvasDrawing(modal);
                    
                    // 初始化缩放和拖拽控制
                    const { setZoom, currentZoom } = initZoomAndPanControls(modal);
                    modal.setZoom = setZoom;
                    modal.currentZoom = currentZoom();
                    
                    console.log('🔧 VPE初始化缩放值:', modal.currentZoom);
                    
                    // 再延迟一点绑定交互事件，确保画布完全就绪
                    setTimeout(() => {
                        console.log('🎨 绑定画布交互事件...');
                        bindCanvasInteractionEvents(modal);
                    }, 50);
                }, 200);
                
                // 绑定提示词相关事件
                bindPromptEvents(modal, this.getObjectInfo);
                
                // 绑定基础事件
                this.bindBasicEvents(modal);
                
                // 加载图层数据 - 延迟以确保DOM完全初始化
                setTimeout(() => {
                    console.log('🔍 DEBUG: About to load layers to panel...');
                    console.log('🔍 layersData:', layersData);
                    console.log('🔍 Modal elements with IDs:', Array.from(modal.querySelectorAll('*[id]')).map(el => el.id));
                    
                    if (layersData) {
                        this.loadLayersToPanel(modal, layersData);
                        this.updatePromptStats(modal, layersData);
                        
                        // 如果有保存的annotations，需要恢复到canvas
                        if (Array.isArray(layersData) && layersData.length > 0) {
                            console.log('🎨 恢复保存的annotations到canvas...');
                            // 延迟恢复，确保DOM和绘制系统完全初始化
                            setTimeout(() => {
                                this.restoreAnnotationsToCanvas(modal, layersData);
                                // 恢复后重新更新图层面板状态
                                this.refreshLayerPanelState(modal);
                            }, 300);
                        }
                    } else {
                        this.loadLayersToPanel(modal, []);
                        this.updatePromptStats(modal, []);
                    }
                }, 100);
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
                    
                    // 获取drawing layer和SVG
                    const drawingLayer = modal.querySelector('#drawing-layer');
                    console.log('🔍 Drawing layer状态:', {
                        exists: !!drawingLayer,
                        parent: drawingLayer?.parentElement?.id,
                        children: drawingLayer?.children?.length
                    });
                    
                    if (!drawingLayer) {
                        console.error('❌ 未找到drawing-layer，尝试创建...');
                        
                        // 尝试找到image-canvas并创建drawing-layer
                        const imageCanvas = modal.querySelector('#image-canvas');
                        if (imageCanvas) {
                            console.log('✅ 找到image-canvas，创建drawing-layer');
                            const newDrawingLayer = document.createElement('div');
                            newDrawingLayer.id = 'drawing-layer';
                            newDrawingLayer.style.cssText = `
                                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                                pointer-events: auto; z-index: 1000;
                            `;
                            imageCanvas.appendChild(newDrawingLayer);
                            console.log('✅ Drawing layer已创建');
                        } else {
                            console.error('❌ 也未找到image-canvas');
                            return;
                        }
                    }
                    
                    // 重新获取drawing layer (可能刚创建)
                    const finalDrawingLayer = modal.querySelector('#drawing-layer');
                    
                    let svg = finalDrawingLayer.querySelector('svg');
                    console.log('🔍 SVG状态:', {
                        exists: !!svg,
                        drawingLayerExists: !!finalDrawingLayer
                    });
                    
                    if (!svg) {
                        console.log('🔍 创建SVG容器...');
                        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        svg.setAttribute('width', '100%');
                        svg.setAttribute('height', '100%');
                        svg.setAttribute('viewBox', '0 0 1000 1000');
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
                        
                        finalDrawingLayer.appendChild(svg);
                        console.log('✅ SVG已创建并添加到drawing layer');
                        
                        // 立即验证SVG是否在DOM中
                        const verifySvg = modal.querySelector('#annotation-svg');
                        console.log('🔍 SVG验证:', {
                            svgInModal: !!verifySvg,
                            svgParent: svg.parentElement?.id,
                            svgRect: svg.getBoundingClientRect()
                        });
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
                    const applyRestoredFillStyle = (shape, color, fillMode) => {
                        console.log('🎨 恢复时应用填充样式:', { color, fillMode });
                        if (fillMode === 'outline') {
                            // 空心样式
                            shape.setAttribute('fill', 'none');
                            shape.setAttribute('stroke', color);
                            shape.setAttribute('stroke-width', '3');
                            shape.setAttribute('stroke-opacity', '0.8');
                            console.log('✅ 应用空心样式');
                        } else {
                            // 实心样式 (默认)
                            shape.setAttribute('fill', color);
                            shape.setAttribute('fill-opacity', '0.5');
                            shape.setAttribute('stroke', 'none');
                            console.log('✅ 应用实心样式');
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
                            applyRestoredFillStyle(rect, color, fillMode);
                            
                            // 立即添加到SVG
                            svg.appendChild(rect);
                            console.log('✅ 矩形已添加到SVG');
                            
                            // 添加编号标签（如果有编号）
                            if (annotation.number !== undefined) {
                                console.log('🔢 为恢复的annotation添加编号标签:', annotation.number);
                                this.addRestoredNumberLabel(svg, coords, annotation.number, color);
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
                            applyRestoredFillStyle(ellipse, color, fillMode);
                            
                            svg.appendChild(ellipse);
                            console.log('✅ 椭圆已添加到SVG');
                            
                            // 添加编号标签
                            if (annotation.number !== undefined) {
                                console.log('🔢 为恢复的椭圆添加编号标签:', annotation.number);
                                this.addRestoredNumberLabel(svg, coords, annotation.number, color);
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
                            line.setAttribute('stroke-opacity', '1');
                            line.setAttribute('marker-end', `url(#arrowhead-${color.replace('#', '')})`);
                            line.setAttribute('data-annotation-id', annotation.id);
                            line.setAttribute('data-annotation-number', annotation.number || '');
                            line.setAttribute('class', 'annotation-shape');
                            
                            svg.appendChild(line);
                            console.log('✅ 箭头已添加到SVG');
                            
                            // 添加编号标签
                            if (annotation.number !== undefined) {
                                console.log('🔢 为恢复的箭头添加编号标签:', annotation.number);
                                this.addRestoredNumberLabel(svg, coords, annotation.number, color);
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
                            applyRestoredFillStyle(polygon, color, fillMode);
                            
                            svg.appendChild(polygon);
                            console.log('✅ 多边形已添加到SVG');
                            
                            // 添加编号标签（使用第一个点作为位置）
                            if (annotation.number !== undefined && points.length > 0) {
                                console.log('🔢 为恢复的多边形添加编号标签:', annotation.number);
                                const firstPoint = points[0];
                                const labelCoords = [firstPoint.x, firstPoint.y, firstPoint.x + 10, firstPoint.y + 10];
                                this.addRestoredNumberLabel(svg, labelCoords, annotation.number, color);
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
                    
                    // 短延迟后进行详细的可见性检查
                    setTimeout(() => {
                        console.log('🔍 延迟检查开始...');
                        this.debugAnnotationVisibility(modal, svg);
                    }, 100);
                } catch (error) {
                    console.error('❌ 恢复annotations失败:', error);
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
                        shape.style.strokeWidth = (parseInt(shape.getAttribute('stroke-width')) + 1).toString();
                    });
                    
                    shape.addEventListener('mouseleave', () => {
                        shape.style.filter = 'none';
                        const originalWidth = shape.classList.contains('highlighted') ? '4' : '3';
                        shape.style.strokeWidth = originalWidth;
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
                console.log('🔧 标准化annotation数据:', annotation.id);
                
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
                    const labelX = Math.min(coords[0], coords[2]) + 5;
                    const labelY = Math.min(coords[1], coords[3]) - 5;
                    
                    // 创建标签组
                    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    group.setAttribute('class', 'annotation-label');
                    group.setAttribute('data-annotation-number', number);
                    
                    // 背景圆形
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('cx', labelX);
                    circle.setAttribute('cy', labelY);
                    circle.setAttribute('r', '18');
                    circle.setAttribute('fill', '#000');
                    circle.setAttribute('fill-opacity', '0.8');
                    circle.setAttribute('stroke', '#fff');
                    circle.setAttribute('stroke-width', '3');
                    
                    // 内部彩色圆形
                    const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    innerCircle.setAttribute('cx', labelX);
                    innerCircle.setAttribute('cy', labelY);
                    innerCircle.setAttribute('r', '14');
                    innerCircle.setAttribute('fill', color);
                    innerCircle.setAttribute('fill-opacity', '0.9');
                    
                    // 数字文本
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', labelX);
                    text.setAttribute('y', labelY);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('dominant-baseline', 'central');
                    text.setAttribute('fill', '#fff');
                    text.setAttribute('font-size', '16');
                    text.setAttribute('font-weight', 'bold');
                    text.setAttribute('font-family', 'Arial, sans-serif');
                    text.textContent = number;
                    
                    // 组装标签
                    group.appendChild(circle);
                    group.appendChild(innerCircle);
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
                        const promptData = exportPromptData(modal);
                        if (promptData) {
                            console.log('💾 保存提示词数据:', promptData);
                            
                            // 实际保存逻辑：保存到节点的annotation_data widget并同步到后端节点参数
                            try {
                                const annotationDataWidget = this.widgets?.find(w => w.name === "annotation_data");
                                const textPromptWidget = this.widgets?.find(w => w.name === "text_prompt");
                                const promptTemplateWidget = this.widgets?.find(w => w.name === "prompt_template");
                                
                                if (annotationDataWidget) {
                                    // 确保保存的annotations有正确的数据结构
                                    if (promptData.annotations) {
                                        promptData.annotations = promptData.annotations.map(annotation => {
                                            const normalized = this.normalizeAnnotationData(annotation);
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
                
                // 帮助按钮
                const helpBtn = modal.querySelector('#vpe-help');
                if (helpBtn) {
                    helpBtn.onclick = () => {
                        this.showEditorHelp();
                    };
                }
                
                // 撤销按钮
                const undoBtn = modal.querySelector('#vpe-undo');
                if (undoBtn) {
                    undoBtn.onclick = () => {
                        this.undoLastAnnotation(modal);
                    };
                }
                
                // 清空按钮
                const clearBtn = modal.querySelector('#vpe-clear');
                if (clearBtn) {
                    clearBtn.onclick = () => {
                        this.clearAllAnnotations(modal);
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
                        this.updateAllAnnotationsOpacity(modal, opacityPercent);
                        
                        console.log('🎨 不透明度调整为:', opacityPercent + '%');
                    };
                }
            };
            
            // 更新所有标注的不透明度
            nodeType.prototype.updateAllAnnotationsOpacity = function(modal, opacityPercent) {
                const svg = modal.querySelector('#drawing-layer svg');
                if (!svg) return;
                
                // 计算不透明度值 (0-1)
                const opacity = opacityPercent / 100;
                
                // 更新所有SVG形状的不透明度
                const shapes = svg.querySelectorAll('.annotation-shape');
                shapes.forEach(shape => {
                    shape.style.opacity = opacity;
                });
                
                // 更新annotations数据中的不透明度
                if (modal.annotations) {
                    modal.annotations.forEach(annotation => {
                        annotation.opacity = opacityPercent;
                    });
                }
                
                console.log('🎨 已更新', shapes.length, '个标注的不透明度为', opacityPercent + '%');
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
                if (modal.annotations && modal.annotations.length > 0) {
                    const lastAnnotation = modal.annotations.pop();
                    
                    // 从SVG中移除
                    const svg = modal.querySelector('#drawing-layer svg');
                    if (svg) {
                        const shape = svg.querySelector(`[data-annotation-id="${lastAnnotation.id}"]`);
                        if (shape) shape.remove();
                        
                        // 移除编号标签
                        const label = svg.querySelector(`[data-annotation-number="${lastAnnotation.number}"]`);
                        if (label) label.remove();
                    }
                    
                    console.log('↶ 已撤销标注:', lastAnnotation.id);
                    KontextUtils.showNotification('已撤销上一个标注', 'info');
                }
            };
            
            // 清空所有标注
            nodeType.prototype.clearAllAnnotations = function(modal) {
                if (modal.annotations) {
                    modal.annotations = [];
                }
                
                // 清空SVG中的标注
                const svg = modal.querySelector('#drawing-layer svg');
                if (svg) {
                    svg.querySelectorAll('.annotation-shape, .annotation-label').forEach(el => el.remove());
                }
                
                console.log('🧹 已清空所有标注');
                KontextUtils.showNotification('已清空所有标注', 'info');
            };
            
            // 导出当前提示词数据
            nodeType.prototype.exportCurrentPromptData = function() {
                // 这里需要获取当前打开的modal
                // 暂时只是显示消息
                console.log('📊 导出提示词数据功能');
                KontextUtils.showNotification('导出功能开发中', 'info');
            };
            
            // 显示编辑器帮助
            nodeType.prototype.showEditorHelp = function() {
                const helpModal = document.createElement("div");
                helpModal.className = "comfy-modal";
                helpModal.style.cssText = `
                    position: fixed; top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    background: #2b2b2b; color: white;
                    padding: 30px; border-radius: 12px;
                    width: 600px; max-height: 80vh; overflow-y: auto;
                    z-index: 30000; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
                `;
                
                helpModal.innerHTML = `
                    <h2 style="margin-top: 0; color: #673AB7;">🎨 Visual Prompt Editor V2 Help</h2>
                    
                    <h3 style="color: #4CAF50;">📌 New in V2 - Modular Architecture</h3>
                    <ul style="line-height: 1.6;">
                        <li><strong>Modular Design:</strong> Code split into focused modules for better maintainability</li>
                        <li><strong>Enhanced Performance:</strong> Optimized loading and reduced bundle size</li>
                        <li><strong>Better Debugging:</strong> Clear separation of concerns for easier troubleshooting</li>
                        <li><strong>Improved Quality Analysis:</strong> Advanced prompt quality scoring</li>
                    </ul>
                    
                    <h3 style="color: #4CAF50;">Left Panel - Annotation Canvas</h3>
                    <ul style="line-height: 1.6;">
                        <li><strong>Drawing Tools:</strong> Rectangle, Circle, Arrow, Freehand polygon</li>
                        <li><strong>Color Selection:</strong> 4 colors for different annotation types</li>
                        <li><strong>Canvas Controls:</strong> Fit to view, 1:1 scale, zoom in/out</li>
                        <li><strong>Interactive Features:</strong> Middle-click drag, Ctrl+scroll zoom</li>
                        <li><strong>Smart Numbering:</strong> Automatic annotation numbering (0, 1, 2...)</li>
                    </ul>
                    
                    <h3 style="color: #FF9800;">Right Panel - Prompt Generation</h3>
                    <ul style="line-height: 1.6;">
                        <li><strong>Object Selection:</strong> Choose from drawn annotations</li>
                        <li><strong>Operation Types:</strong> 12 different edit operations</li>
                        <li><strong>Smart Prompts:</strong> AI-optimized multimodal editing prompts</li>
                        <li><strong>Quality Analysis:</strong> Real-time prompt quality scoring</li>
                        <li><strong>Export Options:</strong> Copy, save, and export prompt data</li>
                    </ul>
                    
                    <h3 style="color: #2196F3;">🎮 Keyboard Shortcuts</h3>
                    <ul style="line-height: 1.6;">
                        <li><strong>Tools:</strong> R=Rectangle, C=Circle, A=Arrow, F=Freehand</li>
                        <li><strong>Canvas:</strong> Ctrl+Scroll=Zoom, Middle-click=Pan</li>
                        <li><strong>Actions:</strong> Ctrl+Z=Undo, Delete=Clear</li>
                    </ul>
                    
                    <button onclick="document.body.removeChild(this.parentElement)" 
                            style="margin-top: 20px; padding: 10px 20px; background: #673AB7; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Close Help
                    </button>
                `;
                
                document.body.appendChild(helpModal);
            };
            
            // 从LoadImage节点获取图像
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
                    
                    // 方法2: 从widgets获取
                    if (loadImageNode.widgets) {
                        for (let widget of loadImageNode.widgets) {
                            console.log('🔍 检查widget:', widget.name, widget.type);
                            if (widget.name === 'image' && widget.value) {
                                console.log('✅ 从widget获取图像:', widget.value);
                                return widget.value;
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
            
            // 尝试从其他类型节点获取图像
            nodeType.prototype.tryGetImageFromNode = function(node) {
                console.log('🔍 尝试从节点获取图像:', node.type);
                // 这里可以添加对其他节点类型的支持
                return null;
            };
            
            // 从widget获取图像（辅助函数）
            nodeType.prototype.getImageFromWidget = function() {
                try {
                    // 这里需要实现从ComfyUI widget获取图像的逻辑
                    console.log('尝试从widget获取图像');
                    return null;
                } catch (e) {
                    console.log('从widget提取图像失败:', e);
                }
                return null;
            };
        }
    }
});

console.log("🎨 Visual Prompt Editor V2 (Modular) extension loaded");
/**
 * Visual Prompt Editor - 纯Fabric.js官方架构系统
 * 完全基于Fabric.js官方文档和最佳实践
 * 不依赖任何自定义绘制、变换或事件处理逻辑
 */

import { CONSTRAINT_PROMPTS, DECORATIVE_PROMPTS } from './visual_prompt_editor_utils.js';
import { createTextToolManager } from './visual_prompt_editor_text_tool.js';

// 动态加载Fabric.js库
let fabric = null;

async function loadFabricJS() {
    if (window.fabric) {
        fabric = window.fabric;
        return fabric;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/extensions/KontextVisualPromptWindow_Intelligent/libs/fabric.js';
        script.onload = () => {
            fabric = window.fabric;
            resolve(fabric);
        };
        script.onerror = () => {
            console.error('Fabric.js加载失败');
            reject(new Error('Fabric.js加载失败'));
        };
        document.head.appendChild(script);
    });
}

/**
 * 纯Fabric.js官方架构管理器
 * 完全按照Fabric.js官方文档实现，无任何自定义逻辑
 */
export class FabricNativeManager {
    constructor(modal, dataManager = null) {
        
        this.modal = modal;
        this.dataManager = dataManager; // 数据管理器引用，用于状态缓存
        this.fabricCanvas = null;
        this.currentTool = 'select';
        this.isDrawing = false;
        this.startPoint = null;
        this.drawingObject = null;
        
        // 初始化绘制属性
        this.currentColor = '#ff0000';
        this.fillMode = 'filled';
        this.currentOpacity = 0.5; // 默认50%不透明度
        this.drawingOptions = {};
        
        // 多选状态
        this.isCtrlPressed = false;
        this.multiSelectObjects = new Set(); // 存储多选对象
        
        // 多边形绘制状态
        this.polygonPoints = [];
        this.isDrawingPolygon = false;
        this.tempPolygonLine = null;
        
        // 当前选中的图层ID（用于状态缓存）
        this.currentSelectedLayerId = null;
        
        // 自动保存相关
        this.autoSaveTimeout = null;
        this.autoSaveDelay = 2000; // 2秒延迟保存
        
        // 文字工具管理器
        this.textToolManager = null;
        
        // 画布视图缩放状态
        this.canvasViewScale = 1.0; // 画布容器缩放比例
        this.canvasContainer = null; // 画布容器元素
        
        // 初始化绘制选项
        this.updateDrawingOptions();
        
    }
    
    /**
     * 初始化 - 完全按照官方文档
     */
    async initialize() {
        
        try {
            // 加载Fabric.js
            await loadFabricJS();
            
            this.createOfficialCanvas();
            
            this.bindOfficialEvents();
            
            this.setupOfficialToolbar();
            
            this.setupCanvasDragDrop();
            
            this.setColor('#ff0000');
            
            // 同步工具栏不透明度滑块的默认值
            this.syncOpacitySlider();
            
            // 初始化文字工具管理器
            try {
                this.textToolManager = createTextToolManager(this.fabricCanvas, this.modal);
                if (this.textToolManager) {
                    this.textToolManager.initialize();
                }
            } catch (error) {
                console.error('文字工具管理器初始化失败:', error);
                this.textToolManager = null;
            }
            
            this.updateZoomDisplay(this.canvasViewScale);
            
            this.bindKeyboardEvents();
            
            // 初始化图层面板显示
            this.updateLayerPanel();
            
            // 恢复保存的Fabric画布数据
            await this.restoreSavedCanvasData();
            
            window.fabricManager = this;
            
            return true;
            
        } catch (error) {
            console.error('Fabric.js初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 创建Canvas - 完全按照Fabric.js官方文档
     */
    createOfficialCanvas() {
        
        // 找到Canvas容器
        const canvasContainer = this.modal.querySelector('#fabric-canvas-container') || 
                               this.modal.querySelector('#zoom-container') || 
                               this.modal.querySelector('#canvas-container');
        
        if (!canvasContainer) {
            throw new Error('找不到Canvas容器');
        }
        
        // 保存画布容器引用用于视图缩放
        this.canvasContainer = canvasContainer;
        
        const canvasElement = document.createElement('canvas');
        canvasElement.id = 'fabric-official-canvas';
        canvasElement.width = 800;
        canvasElement.height = 600;
        
        // 清空容器并添加Canvas
        canvasContainer.innerHTML = '';
        canvasContainer.appendChild(canvasElement);
        
        this.fabricCanvas = new fabric.Canvas(canvasElement, {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff',
            selection: true,                    // 启用选择
            preserveObjectStacking: true,       // 保持对象层级
            enableRetinaScaling: false,        // 关闭高DPI缩放修复控制点问题
            allowTouchScrolling: false,         // 禁用触摸滚动
            devicePixelRatio: 1,               // 强制设备像素比为1
            stopContextMenu: true,             // 启用右键菜单控制
            fireRightClick: true,              // 启用右键事件
            fireMiddleClick: true              // 启用中键事件
        });
        
        // 确保画布元素样式不干扰控制点渲染
        canvasElement.style.imageRendering = 'pixelated';
        canvasElement.style.width = '800px';
        canvasElement.style.height = '600px';
        
        fabric.Object.prototype.set({
            transparentCorners: false,
            cornerColor: '#4CAF50',
            cornerStrokeColor: '#2E7D32',
            borderColor: '#4CAF50',
            cornerSize: 8,
            padding: 5,
            hasRotatingPoint: true
        });
        
        this.fabricCanvas.freeDrawingBrush.width = 2;
        this.fabricCanvas.freeDrawingBrush.color = '#ff0000'; // 默认红色
        
    }
    
    /**
     * 绑定官方事件 - 完全按照Fabric.js官方事件文档
     */
    bindOfficialEvents() {
        
        // 官方鼠标事件 - 按照官方文档实现
        this.fabricCanvas.on('mouse:down', (e) => {
            this.handleMouseDown(e);
        });
        
        this.fabricCanvas.on('mouse:move', (e) => {
            this.handleMouseMove(e);
        });
        
        this.fabricCanvas.on('mouse:up', (e) => {
            this.handleMouseUp(e);
        });
        
        // 官方选择事件 - 触发面板更新和提示词系统集成
        this.fabricCanvas.on('selection:created', (e) => {
            this._scheduleLayerPanelUpdate();
            this.handleObjectSelection(e.selected || [e.target]);
            // 修复控制点显示
            this.fixControlsDisplay();
            // 更新锁定按钮状态
            this.updateLockButtonState();
        });
        
        this.fabricCanvas.on('selection:updated', (e) => {
            this._scheduleLayerPanelUpdate();
            this.handleObjectSelection(e.selected || [e.target]);
            // 修复控制点显示
            this.fixControlsDisplay();
            // 更新锁定按钮状态
            this.updateLockButtonState();
        });
        
        this.fabricCanvas.on('selection:cleared', () => {
            // 只有在非Ctrl+click模式下才清除多选状态
            if (!this.isCtrlPressed) {
                this.multiSelectObjects.clear();
            }
            this._scheduleLayerPanelUpdate();
            this.handleObjectSelection([]);
            // 更新锁定按钮状态
            this.updateLockButtonState();
        });
        
        // 官方对象事件 - 优化更新频率
        this.fabricCanvas.on('object:added', (e) => {
            this._scheduleLayerPanelUpdate();
            this._scheduleAutoSave();
        });
        
        this.fabricCanvas.on('object:removed', (e) => {
            this._scheduleLayerPanelUpdate();
            this._scheduleAutoSave();
        });
        
        // 对象移动事件 - 图层顺序改变时更新面板
        this.fabricCanvas.on('object:moving', () => {
            // 移动过程中不更新，避免频繁重绘
        });
        
        this.fabricCanvas.on('object:moved', () => {
            this._scheduleLayerPanelUpdate();
            this._scheduleAutoSave();
        });
        
        // 对象修改事件 - 触发自动保存
        this.fabricCanvas.on('object:modified', () => {
            this._scheduleAutoSave();
        });
        
        this.fabricCanvas.on('object:scaling', () => {
            // 缩放过程中不保存
        });
        
        // 文字编辑事件
        this.fabricCanvas.on('text:editing:exited', (e) => {
            // 文字退出编辑模式，触发自动保存
            this._scheduleAutoSave();
        });
        
        this.fabricCanvas.on('mouse:wheel', (opt) => {
            this.handleCanvasZoom(opt);
        });
        
        this.fabricCanvas.on('object:scaled', () => {
            this._scheduleAutoSave();
        });
        
        this.fabricCanvas.on('object:rotating', () => {
            // 旋转过程中不保存
        });
        
        this.fabricCanvas.on('object:rotated', () => {
            this._scheduleAutoSave();
        });
        
        // 键盘事件处理 - 更健壮的Ctrl键管理
        const handleKeyDown = (e) => {
            if (!this.modal || !document.body.contains(this.modal)) {
                return;
            }
            
            if (e.key === 'Control' || e.key === 'ControlLeft' || e.key === 'ControlRight') {
                this.isCtrlPressed = true;
            }
            
            // 删除快捷键
            if (e.key === 'Delete' || e.key === 'Backspace') {
                this.deleteSelected();
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Control' || e.key === 'ControlLeft' || e.key === 'ControlRight') {
                this.isCtrlPressed = false;
            }
        };

        // 处理窗口失焦时重置Ctrl状态
        const handleBlur = () => {
            this.isCtrlPressed = false;
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);
        
        // 存储引用用于清理
        this._keyEventHandlers = { handleKeyDown, handleKeyUp, handleBlur };
        
        // 右键事件处理（多边形工具）
        this.fabricCanvas.wrapperEl.addEventListener('mousedown', (e) => {
            if (e.button === 2 && this.currentTool === 'polygon') {
                e.preventDefault();
                const pointer = this.fabricCanvas.getPointer(e);
                this.handlePolygonRightClick(pointer);
            }
        });
        
        // 阻止右键菜单（多边形工具需要右键完成绘制）
        this.fabricCanvas.wrapperEl.addEventListener('contextmenu', (e) => {
            if (this.currentTool === 'polygon') {
                e.preventDefault();
            }
        });
        
    }
    
    /**
     * 官方鼠标按下处理 - 按照官方绘制教程
     */
    handleMouseDown(e) {
        if (this.currentTool === 'select') {
            // 选择工具：处理Ctrl+点击多选
            if (e.target && this.isCtrlPressed) {
                // 减少事件阻止的激进程度
                e.e.preventDefault();
                
                requestAnimationFrame(() => {
                    this.handleCtrlClick(e.target);
                });
                return;
            }
            // 其他情况交给Fabric.js处理
            return;
        }
        
        if (e.target) {
            // 点击了现有对象：完全交给Fabric.js处理
            return;
        }
        
        const pointer = this.fabricCanvas.getPointer(e.e);
        
        // 多边形绘制特殊处理
        if (this.currentTool === 'polygon') {
            this.handlePolygonClick(pointer, e.e);
            return;
        }
        
        // 文字工具特殊处理
        if (this.currentTool === 'text') {
            if (this.textToolManager) {
                this.textToolManager.createTextObject(e);
            }
            return;
        }
        
        // 绘制工具：开始绘制
        this.isDrawing = true;
        this.startPoint = pointer;
        
        // 根据工具创建相应对象
        this.createDrawingObject();
    }
    
    /**
     * 创建绘制对象 - 官方标准方式
     */
    createDrawingObject() {
        const { x, y } = this.startPoint;
        
        switch (this.currentTool) {
            case 'rectangle':
                this.drawingObject = new fabric.Rect({
                    left: x,
                    top: y,
                    width: 1,
                    height: 1,
                    ...this.drawingOptions,
                    selectable: false  // 绘制时不可选择
                });
                break;
                
            case 'circle':
                this.drawingObject = new fabric.Circle({
                    left: x,
                    top: y,
                    radius: 1,
                    ...this.drawingOptions,
                    selectable: false  // 绘制时不可选择
                });
                break;
                
            default:
                return;
        }
        
        if (this.drawingObject) {
            // 为新创建的对象分配唯一ID
            this.drawingObject.fabricId = this.generateFabricObjectId();
            this.fabricCanvas.add(this.drawingObject);
        }
    }
    
    /**
     * 官方鼠标移动处理
     */
    handleMouseMove(e) {
        if (!this.isDrawing || !this.drawingObject) return;
        
        const pointer = this.fabricCanvas.getPointer(e.e);
        const { x: startX, y: startY } = this.startPoint;
        
        if (this.currentTool === 'rectangle') {
            const width = Math.abs(pointer.x - startX);
            const height = Math.abs(pointer.y - startY);
            
            this.drawingObject.set({
                left: Math.min(startX, pointer.x),
                top: Math.min(startY, pointer.y),
                width: width,
                height: height
            });
        } else if (this.currentTool === 'circle') {
            const radius = Math.sqrt(
                Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
            ) / 2;
            
            this.drawingObject.set({
                radius: radius
            });
        }
        
        this.fabricCanvas.renderAll();
    }
    
    /**
     * 官方鼠标抬起处理
     */
    handleMouseUp(e) {
        if (!this.isDrawing || !this.drawingObject) return;
        
        
        // 恢复对象可选择性
        this.drawingObject.set({
            selectable: true
        });
        
        // 选中新创建的对象
        this.fabricCanvas.setActiveObject(this.drawingObject);
        
        // 重置绘制状态
        this.isDrawing = false;
        this.drawingObject = null;
        this.startPoint = null;
        
        this.fabricCanvas.renderAll();
    }
    
    /**
     * 处理Ctrl+点击多选 - 使用自定义状态管理
     */
    handleCtrlClick(targetObject) {
        if (!targetObject || !targetObject.canvas) {
            return;
        }

        if (this.multiSelectObjects.has(targetObject)) {
            // 从多选集合中移除
            this.multiSelectObjects.delete(targetObject);
        } else {
            this.multiSelectObjects.add(targetObject);
        }
        
        this.updateFabricSelection();
    }
    
    /**
     * 处理Fabric对象选择 - 集成提示词系统和状态缓存
     */
    handleObjectSelection(selectedObjects) {
        if (!Array.isArray(selectedObjects)) {
            selectedObjects = selectedObjects ? [selectedObjects] : [];
        }
        
        // 缓存之前选中对象的状态
        this.cacheCurrentLayerState();
        
        if (!this.modal.selectedLayers) {
            this.modal.selectedLayers = new Set();
        }
        
        // 清除之前的选择
        this.modal.selectedLayers.clear();
        
        // 将选中的Fabric对象添加到selectedLayers
        selectedObjects.forEach(obj => {
            if (obj && obj.fabricId) {
                this.modal.selectedLayers.add(obj.fabricId);
            }
        });
        
        // 触发提示词系统更新
        this.updatePromptSystemForSelection(selectedObjects);
        
        // 恢复新选中对象的状态
        this.restoreLayerState(selectedObjects);
        
        // 触发自定义事件，供其他模块监听
        const event = new CustomEvent('fabricSelectionChanged', {
            detail: { 
                selectedObjects: selectedObjects,
                selectedIds: Array.from(this.modal.selectedLayers)
            }
        });
        this.modal.dispatchEvent(event);
    }
    
    /**
     * 更新提示词系统以响应对象选择
     */
    updatePromptSystemForSelection(selectedObjects) {
        // 如果有选中对象
        if (selectedObjects.length > 0) {
            // 自动切换到局部编辑模式
            this.switchToLocalEditingMode();
            
            // 显示约束和修饰提示词面板
            this.showConstraintAndDecorativePrompts();
            
            // 为选中的Fabric对象创建或更新标注数据
            this.syncFabricObjectsToAnnotations(selectedObjects);
            
            this.bindPromptSelectionEvents();
            
            this.bindLayerDataSyncEvents();
        } else {
            // 没有选中对象时，隐藏局部编辑相关UI
            this.hideLocalEditingPanels();
        }
    }
    
    /**
     * 切换到局部编辑模式
     */
    switchToLocalEditingMode() {
        const categorySelect = this.modal.querySelector('#template-category');
        if (categorySelect && categorySelect.value !== 'local') {
            categorySelect.value = 'local';
            // 触发change事件以更新操作类型选项
            categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // 显示局部编辑相关的UI元素
        const localEditingElements = this.modal.querySelectorAll('.local-editing-panel, .constraint-prompts, .decorative-prompts');
        localEditingElements.forEach(element => {
            element.style.display = 'block';
        });
    }
    
    /**
     * 显示约束和修饰提示词面板
     */
    showConstraintAndDecorativePrompts() {
        // 确保在图层标签页
        this.ensureLayersTabActive();
        
        // 显示图层操作面板
        const layerOperations = this.modal.querySelector('#layer-operations');
        if (layerOperations) {
            layerOperations.style.display = 'block';
            layerOperations.style.visibility = 'visible';
            layerOperations.style.opacity = '1';
        }
        
        // 确保父容器也是可见的
        const currentLayerInfoParent = this.modal.querySelector('#current-layer-info');
        if (currentLayerInfoParent) {
            currentLayerInfoParent.style.display = 'block';
            currentLayerInfoParent.style.visibility = 'visible';
            currentLayerInfoParent.style.opacity = '1';
        }
        
        // 显示约束性提示词面板
        const constraintPanel = this.modal.querySelector('#layer-constraint-prompts-container');
        if (constraintPanel) {
            constraintPanel.style.display = 'block';
            constraintPanel.style.visibility = 'visible';
            constraintPanel.style.opacity = '1';
            constraintPanel.style.height = 'auto';
            constraintPanel.style.overflow = 'visible';
        }
        
        // 显示修饰性提示词面板
        const decorativePanel = this.modal.querySelector('#layer-decorative-prompts-container');
        if (decorativePanel) {
            decorativePanel.style.display = 'block';
            decorativePanel.style.visibility = 'visible';
            decorativePanel.style.opacity = '1';
            decorativePanel.style.height = 'auto';
            decorativePanel.style.overflow = 'visible';
        }
        
        // 显示当前图层信息
        const currentLayerInfo = this.modal.querySelector('#current-layer-info');
        if (currentLayerInfo) {
            currentLayerInfo.style.display = 'block';
            
            const layerTitle = this.modal.querySelector('#layer-title');
            const layerSubtitle = this.modal.querySelector('#layer-subtitle');
            
            if (layerTitle && layerSubtitle) {
                const selectedCount = this.modal.selectedLayers.size;
                layerTitle.textContent = `${selectedCount} Fabric Object${selectedCount > 1 ? 's' : ''} Selected`;
                layerSubtitle.textContent = 'Local editing mode - Configure operation and constraints';
            }
        }
        
        this.updateSelectionCountDisplay();
        
        // 加载约束和修饰提示词
        this.loadConstraintAndDecorativePrompts();
        
        this.bindOperationTypeChangeEvent();
    }
    
    /**
     * 确保图层标签页处于激活状态
     */
    ensureLayersTabActive() {
        const layersTab = this.modal.querySelector('#layers-tab');
        if (layersTab && !layersTab.classList.contains('active')) {
            layersTab.click();
        }
    }
    
    /**
     * 加载约束和修饰提示词
     */
    loadConstraintAndDecorativePrompts() {
        const operationSelect = this.modal.querySelector('#current-layer-operation');
        const operationType = operationSelect ? operationSelect.value : 'change_color';
        
        // 加载约束和修饰提示词（使用顶部静态导入）
        {
            
            // 加载约束性提示词
            this.loadConstraintPrompts(operationType, CONSTRAINT_PROMPTS);
            
            // 加载修饰性提示词
            this.loadDecorativePrompts(operationType, DECORATIVE_PROMPTS);
        }
    }
    
    /**
     * 加载约束性提示词
     */
    loadConstraintPrompts(operationType, CONSTRAINT_PROMPTS) {
        const container = this.modal.querySelector('#layer-constraint-prompts-container');
        if (!container) return;
        
        const prompts = CONSTRAINT_PROMPTS[operationType] || [];
        
        const promptsHTML = prompts.map((prompt, index) => `
            <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                <input type="checkbox" 
                       class="constraint-prompt-checkbox" 
                       data-prompt="${prompt}" 
                       style="margin-right: 8px; accent-color: #4CAF50;">
                <span style="color: #ccc; font-size: 12px;">${prompt}</span>
            </label>
        `).join('');
        
        const finalHTML = `
            <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 6px; font-weight: 500;">🔒 Constraint Prompts (Select multiple)</label>
            <div style="padding: 8px; background: #2b2b2b; border: 1px solid #555; border-radius: 4px; max-height: 150px; overflow-y: auto;">
                ${promptsHTML || '<div style="color: #888; text-align: center; padding: 8px;">No constraints available</div>'}
            </div>
            <div style="font-size: 11px; color: #777; margin-top: 2px;">
                Quality control and technical constraints for better results
            </div>
        `;
        
        container.innerHTML = finalHTML;
        
        // 为新创建的复选框绑定事件监听器
        this.bindConstraintPromptEvents(container);
    }
    
    /**
     * 绑定约束性提示词复选框事件
     */
    bindConstraintPromptEvents(container) {
        const checkboxes = container.querySelectorAll('.constraint-prompt-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateAnnotationConstraintPrompts();
            });
        });
    }
    
    /**
     * 加载修饰性提示词
     */
    loadDecorativePrompts(operationType, DECORATIVE_PROMPTS) {
        const container = this.modal.querySelector('#layer-decorative-prompts-container');
        if (!container) return;
        
        const prompts = DECORATIVE_PROMPTS[operationType] || [];
        
        const promptsHTML = prompts.map((prompt, index) => `
            <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                <input type="checkbox" 
                       class="decorative-prompt-checkbox" 
                       data-prompt="${prompt}" 
                       style="margin-right: 8px; accent-color: #FF9800;">
                <span style="color: #ccc; font-size: 12px;">${prompt}</span>
            </label>
        `).join('');
        
        const finalHTML = `
            <label style="display: block; color: #aaa; font-size: 12px; margin-bottom: 6px; font-weight: 500;">🎨 Decorative Prompts (Select multiple)</label>
            <div style="padding: 8px; background: #2b2b2b; border: 1px solid #555; border-radius: 4px; max-height: 150px; overflow-y: auto;">
                ${promptsHTML || '<div style="color: #888; text-align: center; padding: 8px;">No decorative prompts available</div>'}
            </div>
            <div style="font-size: 11px; color: #777; margin-top: 2px;">
                Aesthetic enhancements and visual quality improvements
            </div>
        `;
        
        container.innerHTML = finalHTML;
        
        // 为新创建的复选框绑定事件监听器
        this.bindDecorativePromptEvents(container);
    }
    
    /**
     * 绑定修饰性提示词复选框事件
     */
    bindDecorativePromptEvents(container) {
        const checkboxes = container.querySelectorAll('.decorative-prompt-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateAnnotationDecorativePrompts();
            });
        });
    }
    
    /**
     * 更新选中对象的约束性提示词
     */
    updateAnnotationConstraintPrompts() {
        if (!this.modal.selectedLayers || !this.modal.annotations) return;
        
        const constraintContainer = this.modal.querySelector('#layer-constraint-prompts-container');
        if (!constraintContainer) return;
        
        const selectedPrompts = [];
        const checkboxes = constraintContainer.querySelectorAll('.constraint-prompt-checkbox:checked');
        checkboxes.forEach(checkbox => {
            if (checkbox.dataset.prompt) {
                selectedPrompts.push(checkbox.dataset.prompt);
            }
        });
        
        this.modal.selectedLayers.forEach(layerId => {
            const annotation = this.modal.annotations.find(ann => ann.id === layerId);
            if (annotation) {
                annotation.constraintPrompts = [...selectedPrompts];
            }
        });
    }
    
    /**
     * 更新选中对象的修饰性提示词
     */
    updateAnnotationDecorativePrompts() {
        if (!this.modal.selectedLayers || !this.modal.annotations) return;
        
        const decorativeContainer = this.modal.querySelector('#layer-decorative-prompts-container');
        if (!decorativeContainer) return;
        
        const selectedPrompts = [];
        const checkboxes = decorativeContainer.querySelectorAll('.decorative-prompt-checkbox:checked');
        checkboxes.forEach(checkbox => {
            if (checkbox.dataset.prompt) {
                selectedPrompts.push(checkbox.dataset.prompt);
            }
        });
        
        this.modal.selectedLayers.forEach(layerId => {
            const annotation = this.modal.annotations.find(ann => ann.id === layerId);
            if (annotation) {
                annotation.decorativePrompts = [...selectedPrompts];
            }
        });
    }
    
    /**
     * 绑定操作类型选择器事件
     */
    bindOperationTypeChangeEvent() {
        const operationSelect = this.modal.querySelector('#current-layer-operation');
        if (operationSelect) {
            operationSelect.removeEventListener('change', this.operationTypeChangeHandler);
            
            this.operationTypeChangeHandler = () => {
                this.loadConstraintAndDecorativePrompts();
            };
            
            operationSelect.addEventListener('change', this.operationTypeChangeHandler);
        }
    }
    
    /**
     * 绑定约束和修饰提示词选择事件
     */
    bindPromptSelectionEvents() {
        const constraintCheckboxes = this.modal.querySelectorAll('.constraint-prompt-checkbox');
        constraintCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateAnnotationConstraintPrompts();
            });
        });
        
        const decorativeCheckboxes = this.modal.querySelectorAll('.decorative-prompt-checkbox');
        decorativeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateAnnotationDecorativePrompts();
            });
        });
    }
    
    /**
     * 更新标注的约束性提示词
     */
    updateAnnotationConstraintPrompts() {
        const selectedPrompts = Array.from(this.modal.querySelectorAll('.constraint-prompt-checkbox:checked'))
            .map(checkbox => checkbox.dataset.prompt);
        
        if (this.modal.selectedLayers) {
            this.modal.selectedLayers.forEach(layerId => {
                const annotation = this.modal.annotations.find(ann => ann.id === layerId);
                if (annotation) {
                    annotation.constraintPrompts = selectedPrompts;
                }
            });
        }
    }
    
    /**
     * 更新标注的修饰性提示词
     */
    updateAnnotationDecorativePrompts() {
        const selectedPrompts = Array.from(this.modal.querySelectorAll('.decorative-prompt-checkbox:checked'))
            .map(checkbox => checkbox.dataset.prompt);
        
        if (this.modal.selectedLayers) {
            this.modal.selectedLayers.forEach(layerId => {
                const annotation = this.modal.annotations.find(ann => ann.id === layerId);
                if (annotation) {
                    annotation.decorativePrompts = selectedPrompts;
                }
            });
        }
    }
    
    /**
     * 绑定图层数据同步事件
     */
    bindLayerDataSyncEvents() {
        const operationSelect = this.modal.querySelector('#current-layer-operation');
        if (operationSelect) {
            operationSelect.addEventListener('change', () => {
                this.updateAnnotationOperationType();
            });
        }
        
        const descriptionTextarea = this.modal.querySelector('#current-layer-description');
        if (descriptionTextarea) {
            descriptionTextarea.addEventListener('input', () => {
                this.updateAnnotationDescription();
            });
        }
    }
    
    /**
     * 更新标注的操作类型
     */
    updateAnnotationOperationType() {
        const operationSelect = this.modal.querySelector('#current-layer-operation');
        const operationType = operationSelect ? operationSelect.value : 'change_color';
        
        if (this.modal.selectedLayers) {
            this.modal.selectedLayers.forEach(layerId => {
                const annotation = this.modal.annotations.find(ann => ann.id === layerId);
                if (annotation) {
                    annotation.operationType = operationType;
                }
            });
        }
    }
    
    /**
     * 更新标注的描述文本
     */
    updateAnnotationDescription() {
        const descriptionTextarea = this.modal.querySelector('#current-layer-description');
        const description = descriptionTextarea ? descriptionTextarea.value : '';
        
        if (this.modal.selectedLayers) {
            this.modal.selectedLayers.forEach(layerId => {
                const annotation = this.modal.annotations.find(ann => ann.id === layerId);
                if (annotation) {
                    annotation.description = description;
                }
            });
        }
    }
    
    /**
     * 更新选择计数显示
     */
    updateSelectionCountDisplay() {
        const selectedCount = this.modal.selectedLayers ? this.modal.selectedLayers.size : 0;
        
        const selectionCountElements = this.modal.querySelectorAll('#selection-count, #selection-count-info');
        selectionCountElements.forEach(element => {
            element.textContent = `${selectedCount} selected`;
        });
        
        const generateBtn = this.modal.querySelector('#generate-prompt');
        if (generateBtn) {
            if (selectedCount > 0) {
                generateBtn.textContent = `Generate Prompt (${selectedCount} objects)`;
                generateBtn.disabled = false;
                generateBtn.style.opacity = '1';
            } else {
                generateBtn.textContent = 'Generate Prompt';
                generateBtn.disabled = true;
                generateBtn.style.opacity = '0.5';
            }
        }
    }
    
    /**
     * 隐藏局部编辑面板
     */
    hideLocalEditingPanels() {
        // 隐藏图层操作面板
        const layerOperations = this.modal.querySelector('#layer-operations');
        if (layerOperations) {
            layerOperations.style.display = 'none';
        }
        
        // 隐藏当前图层信息
        const currentLayerInfo = this.modal.querySelector('#current-layer-info');
        if (currentLayerInfo) {
            currentLayerInfo.style.display = 'none';
        }
        
        this.updateSelectionCountDisplay();
    }
    
    /**
     * 将Fabric对象同步到标注数据系统
     */
    syncFabricObjectsToAnnotations(selectedObjects) {
        if (!this.modal.annotations) {
            this.modal.annotations = [];
        }
        
        selectedObjects.forEach(obj => {
            if (!obj.fabricId) {
                // 为对象分配唯一ID
                obj.fabricId = this.generateFabricObjectId();
            }
            
            let annotation = this.modal.annotations.find(ann => ann.id === obj.fabricId);
            
            if (!annotation) {
                annotation = {
                    id: obj.fabricId,
                    type: obj.type || 'object',
                    fabricObject: obj,
                    operationType: 'change_color', // 默认操作
                    description: '',
                    constraintPrompts: [],
                    decorativePrompts: [],
                    bounds: this.getFabricObjectBounds(obj)
                };
                this.modal.annotations.push(annotation);
            } else {
                annotation.bounds = this.getFabricObjectBounds(obj);
                annotation.fabricObject = obj;
            }
        });
    }
    
    /**
     * 生成Fabric对象的唯一ID
     */
    generateFabricObjectId() {
        return `fabric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 获取Fabric对象的边界信息
     */
    getFabricObjectBounds(obj) {
        if (!obj) return null;
        
        const bounds = obj.getBoundingRect();
        return {
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height
        };
    }
    
    /**
     * 更新Fabric.js选择状态
     */
    updateFabricSelection() {
        const objectsArray = Array.from(this.multiSelectObjects);
        
        // 先清除当前选择
        this.fabricCanvas.discardActiveObject();
        
        if (objectsArray.length === 0) {
            // 没有选中对象
            this.fabricCanvas.renderAll();
            return;
        } else if (objectsArray.length === 1) {
            // 单选
            this.fabricCanvas.setActiveObject(objectsArray[0]);
        } else {
            // 多选 - 使用Fabric.js官方推荐的方式
            // 确保所有对象都在画布上且可选择
            const validObjects = objectsArray.filter(obj => 
                obj && obj.canvas === this.fabricCanvas && obj.selectable !== false
            );
            
            if (validObjects.length > 1) {
                const activeSelection = new fabric.ActiveSelection(validObjects, {
                    canvas: this.fabricCanvas
                });
                
                this.fabricCanvas.setActiveObject(activeSelection);
            } else if (validObjects.length === 1) {
                // 如果只有一个有效对象，单选
                this.fabricCanvas.setActiveObject(validObjects[0]);
            }
        }
        
        this.fabricCanvas.renderAll();
        
        // 手动触发选择事件更新提示词系统
        this.handleObjectSelection(objectsArray);
    }
    
    /**
     * 添加对象到选择 - Fabric.js官方ActiveSelection API
     */
    addToSelection(targetObject, currentSelection) {
        const allSelected = [...currentSelection, targetObject];
        
        if (allSelected.length === 1) {
            // 单选
            this.fabricCanvas.setActiveObject(allSelected[0]);
        } else {
            // 多选：使用Fabric.js官方ActiveSelection
            const activeSelection = new fabric.ActiveSelection(allSelected, {
                canvas: this.fabricCanvas
            });
            this.fabricCanvas.setActiveObject(activeSelection);
        }
        
        this.fabricCanvas.renderAll();
    }
    
    /**
     * 从选择中移除对象 - Fabric.js官方API
     */
    removeFromSelection(targetObject, currentSelection) {
        const remainingObjects = currentSelection.filter(obj => obj !== targetObject);
        
        if (remainingObjects.length === 0) {
            // 没有选中对象
            this.fabricCanvas.discardActiveObject();
        } else if (remainingObjects.length === 1) {
            // 单选
            this.fabricCanvas.setActiveObject(remainingObjects[0]);
        } else {
            // 多选
            const activeSelection = new fabric.ActiveSelection(remainingObjects, {
                canvas: this.fabricCanvas
            });
            this.fabricCanvas.setActiveObject(activeSelection);
        }
        
        this.fabricCanvas.renderAll();
    }
    
    /**
     * 处理多边形点击 - 逐点绘制多边形
     */
    handlePolygonClick(pointer, originalEvent) {
        // 只处理左键点击添加点
        if (originalEvent.button !== 0) {
            return;
        }
        
        // 左键添加新点
        this.polygonPoints.push({x: pointer.x, y: pointer.y});
        
        if (!this.isDrawingPolygon) {
            // 开始绘制多边形
            this.isDrawingPolygon = true;
            this.showPolygonPreview();
        } else {
            this.updatePolygonPreview();
        }
    }
    
    /**
     * 处理多边形右键点击 - 完成绘制
     */
    handlePolygonRightClick(pointer) {
        if (this.isDrawingPolygon) {
            this.finishPolygon();
        }
    }
    
    /**
     * 显示多边形预览
     */
    showPolygonPreview() {
        if (this.polygonPoints.length < 1) return;
        
        const points = [...this.polygonPoints];
        if (points.length >= 2) {
            if (this.tempPolygonLine) {
                this.fabricCanvas.remove(this.tempPolygonLine);
            }
            
            this.tempPolygonLine = new fabric.Polyline(points, {
                fill: 'transparent',
                stroke: this.currentColor || '#ff0000',
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false
            });
            
            this.fabricCanvas.add(this.tempPolygonLine);
            this.fabricCanvas.renderAll();
        }
    }
    
    /**
     * 更新多边形预览
     */
    updatePolygonPreview() {
        if (this.tempPolygonLine) {
            this.tempPolygonLine.set('points', [...this.polygonPoints]);
            this.fabricCanvas.renderAll();
        } else {
            this.showPolygonPreview();
        }
    }
    
    /**
     * 完成多边形绘制 - 使用Fabric.js官方Polygon
     */
    finishPolygon() {
        if (this.polygonPoints.length < 3) {
            // 至少需要3个点才能组成多边形
            this.cancelPolygon();
            return;
        }
        
        if (this.tempPolygonLine) {
            this.fabricCanvas.remove(this.tempPolygonLine);
            this.tempPolygonLine = null;
        }
        
        const polygon = new fabric.Polygon(this.polygonPoints, {
            ...this.drawingOptions,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true
        });
        
        
        this.fabricCanvas.add(polygon);
        this.fabricCanvas.setActiveObject(polygon);
        this.fabricCanvas.renderAll();
        
        // 重置多边形绘制状态
        this.resetPolygonState();
    }
    
    /**
     * 取消多边形绘制
     */
    cancelPolygon() {
        if (this.tempPolygonLine) {
            this.fabricCanvas.remove(this.tempPolygonLine);
            this.tempPolygonLine = null;
        }
        
        // 重置状态
        this.resetPolygonState();
        this.fabricCanvas.renderAll();
    }
    
    /**
     * 重置多边形绘制状态
     */
    resetPolygonState() {
        this.polygonPoints = [];
        this.isDrawingPolygon = false;
        this.tempPolygonLine = null;
    }
    
    /**
     * 设置官方工具栏
     */
    setupOfficialToolbar() {
        
        // 工具按钮映射
        const toolButtons = {
            'select': this.modal.querySelector('[data-tool="select"]'),
            'rectangle': this.modal.querySelector('[data-tool="rectangle"]'),
            'circle': this.modal.querySelector('[data-tool="circle"]'),
            'polygon': this.modal.querySelector('[data-tool="polygon"]'),
            'text': this.modal.querySelector('[data-tool="text"]'),
            'freehand': this.modal.querySelector('[data-tool="freehand"]')
        };
        
        Object.entries(toolButtons).forEach(([tool, button]) => {
            if (button) {
                button.addEventListener('click', () => {
                    this.setTool(tool);
                    this.updateToolButtonState(tool);
                });
            }
        });
        
        // 自由绘制特殊处理
        const freehandBtn = toolButtons.freehand;
        if (freehandBtn) {
            freehandBtn.addEventListener('click', () => {
                this.fabricCanvas.isDrawingMode = !this.fabricCanvas.isDrawingMode;
            });
        }
        
        this.setupColorPicker();
        
        this.setupCanvasBackgroundPicker();
        
        this.setupZoomControls();
        
        this.setupLockControls();
        
    }
    
    /**
     * 设置画布背景颜色选择器
     */
    setupCanvasBackgroundPicker() {
        const canvasBgPicker = this.modal.querySelector('#vpe-bg-color');
        
        if (canvasBgPicker) {
            canvasBgPicker.addEventListener('change', (e) => {
                const bgColor = e.target.value;
                this.setCanvasBackgroundColor(bgColor);
            });
        }
    }
    
    /**
     * 设置画布背景颜色
     */
    setCanvasBackgroundColor(color) {
        if (this.fabricCanvas) {
            this.fabricCanvas.backgroundColor = color;
            this.fabricCanvas.renderAll();
        }
    }
    
    /**
     * 设置缩放控制按钮
     */
    setupZoomControls() {
        const zoomInBtn = this.modal.querySelector('#vpe-zoom-in');
        const zoomOutBtn = this.modal.querySelector('#vpe-zoom-out');
        const zoomResetBtn = this.modal.querySelector('#vpe-zoom-reset');
        const zoomFitBtn = this.modal.querySelector('#vpe-zoom-fit');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.zoomInCanvasView();
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.zoomOutCanvasView();
            });
        }
        
        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', () => {
                this.resetCanvasViewZoom();
            });
        }
        
        if (zoomFitBtn) {
            zoomFitBtn.addEventListener('click', () => {
                this.fitCanvasView();
            });
        }
    }
    
    /**
     * 设置锁定控制按钮
     */
    setupLockControls() {
        const lockToggleBtn = this.modal.querySelector('#vpe-lock-toggle');
        
        if (lockToggleBtn) {
            lockToggleBtn.addEventListener('click', () => {
                this.toggleSelectedObjectsLock();
            });
        }
    }
    
    /**
     * 设置颜色选择器
     */
    setupColorPicker() {
        const colorPicker = this.modal.querySelector('#vpe-color-picker');
        
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => {
                const color = e.target.value;
                this.setColor(color);
            });
        }
        
    }
    
    /**
     * 设置绘制颜色
     */
    setColor(color) {
        this.currentColor = color;
        this.updateDrawingOptions();
        
        if (this.fabricCanvas.freeDrawingBrush) {
            this.fabricCanvas.freeDrawingBrush.color = color;
        }
        
        if (this.textToolManager) {
            this.textToolManager.textColor = color;
        }
    }
    
    /**
     * 设置填充模式 - 支持填充和空心模式
     */
    setFillMode(fillMode) {
        this.fillMode = fillMode;
        this.updateDrawingOptions();
    }
    
    /**
     * 设置不透明度 - Fabric.js官方opacity属性
     */
    setOpacity(opacity) {
        this.currentOpacity = opacity;
        this.updateDrawingOptions();
    }
    
    /**
     * 同步工具栏不透明度滑块
     */
    syncOpacitySlider() {
        const opacitySlider = this.modal.querySelector('#vpe-opacity-slider');
        const opacityValue = this.modal.querySelector('#vpe-opacity-value');
        
        if (opacitySlider && opacityValue) {
            const opacityPercent = Math.round(this.currentOpacity * 100);
            opacitySlider.value = opacityPercent;
            opacityValue.textContent = opacityPercent + '%';
        }
    }
    
    /**
     * 更新绘制选项 - 根据当前颜色和填充模式
     */
    updateDrawingOptions() {
        const color = this.currentColor || '#ff0000';
        
        if (this.fillMode === 'outline') {
            // 空心模式：无填充，只有轮廓
            this.drawingOptions = {
                fill: 'transparent',
                stroke: color,
                strokeWidth: 2,
                opacity: this.currentOpacity
            };
        } else {
            // 填充模式：纯色填充，无边框 - Fabric.js官方方式
            this.drawingOptions = {
                fill: color,
                stroke: null,
                strokeWidth: 0,
                opacity: this.currentOpacity
            };
        }
    }
    
    /**
     * 将十六进制颜色转换为RGBA
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    /**
     * 更新工具按钮状态
     */
    updateToolButtonState(activeTool) {
        const toolButtons = this.modal.querySelectorAll('.vpe-tool');
        toolButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === activeTool) {
                btn.classList.add('active');
            }
        });
    }
    
    /**
     * 设置画布拖拽上传功能
     */
    setupCanvasDragDrop() {
        const canvasWrapper = this.fabricCanvas.wrapperEl;
        if (canvasWrapper) {
            canvasWrapper.addEventListener('dragover', (e) => {
                e.preventDefault();
                canvasWrapper.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
            });
            
            canvasWrapper.addEventListener('dragleave', (e) => {
                e.preventDefault();
                canvasWrapper.style.backgroundColor = '';
            });
            
            canvasWrapper.addEventListener('drop', (e) => {
                e.preventDefault();
                canvasWrapper.style.backgroundColor = '';
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.uploadImageToCanvas(event.target.result, {
                            name: files[0].name || 'Dropped Image'
                        });
                    };
                    reader.readAsDataURL(files[0]);
                }
            });
        }
    }
    
    /**
     * 设置工具 - 官方方式
     */
    setTool(toolName) {
        
        this.currentTool = toolName;
        
        // 重置所有模式
        this.fabricCanvas.isDrawingMode = false;
        this.fabricCanvas.selection = true;
        
        // 切换工具时清除多选状态
        this.multiSelectObjects.clear();
        
        // 切换工具时，如果正在绘制多边形，则取消
        if (this.isDrawingPolygon && toolName !== 'polygon') {
            this.cancelPolygon();
        }
        
        switch (toolName) {
            case 'select':
                this.fabricCanvas.defaultCursor = 'default';
                this.fabricCanvas.hoverCursor = 'move';
                break;
                
            case 'rectangle':
            case 'circle':
                this.fabricCanvas.defaultCursor = 'crosshair';
                this.fabricCanvas.hoverCursor = 'crosshair';
                break;
                
            case 'polygon':
                this.fabricCanvas.defaultCursor = 'crosshair';
                this.fabricCanvas.hoverCursor = 'crosshair';
                break;
                
            case 'text':
                this.fabricCanvas.defaultCursor = 'text';
                this.fabricCanvas.hoverCursor = 'text';
                break;
                
            case 'freehand':
                this.fabricCanvas.isDrawingMode = true;
                this.fabricCanvas.freeDrawingBrush.width = 2;
                this.fabricCanvas.freeDrawingBrush.color = '#ff0000';
                break;
        }
        
    }
    
    /**
     * 放大画布视图
     */
    zoomInCanvasView() {
        if (!this.canvasContainer) return;
        
        // 每次放大20%，最大300%
        this.canvasViewScale = Math.min(this.canvasViewScale * 1.2, 3.0);
        this.applyCanvasViewScale();
    }
    
    /**
     * 缩小画布视图
     */
    zoomOutCanvasView() {
        if (!this.canvasContainer) return;
        
        // 每次缩小20%，最小50%
        this.canvasViewScale = Math.max(this.canvasViewScale / 1.2, 0.5);
        this.applyCanvasViewScale();
    }
    
    /**
     * 重置画布视图缩放到100%
     */
    resetCanvasViewZoom() {
        if (!this.canvasContainer) return;
        
        this.canvasViewScale = 1.0;
        this.applyCanvasViewScale();
    }
    
    /**
     * 应用画布视图缩放
     */
    applyCanvasViewScale() {
        if (!this.canvasContainer) return;
        
        this.canvasContainer.style.transform = `scale(${this.canvasViewScale})`;
        this.canvasContainer.style.transformOrigin = 'center';
        
        this.updateZoomDisplay(this.canvasViewScale);
        
        // 调整容器的父元素以适应缩放后的大小
        const parentContainer = this.canvasContainer.parentElement;
        if (parentContainer) {
            // 确保有足够的空间显示缩放后的画布
            parentContainer.style.overflow = 'auto';
            parentContainer.style.display = 'flex';
            parentContainer.style.justifyContent = 'center';
            parentContainer.style.alignItems = 'center';
        }
    }
    
    /**
     * 更新缩放显示
     */
    updateZoomDisplay(scale) {
        const zoomDisplay = this.modal.querySelector('#zoom-display');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${Math.round(scale * 100)}%`;
        }
    }
    
    /**
     * 处理鼠标滚轮缩放 - 优先缩放选中对象，否则缩放画布
     */
    handleCanvasZoom(opt) {
        // 阻止默认滚轮行为
        opt.e.preventDefault();
        opt.e.stopPropagation();
        
        const delta = opt.e.deltaY;
        const activeObject = this.fabricCanvas.getActiveObject();
        
        // 如果有选中的对象，缩放对象
        if (activeObject && activeObject.type !== 'activeSelection') {
            this.scaleSelectedObject(activeObject, delta);
        } else if (activeObject && activeObject.type === 'activeSelection') {
            // 如果是多选，缩放整个选择组
            this.scaleSelectedObject(activeObject, delta);
        } else {
            // 没有选中对象时，缩放画布视图
            this.scaleCanvasView(delta);
        }
    }
    
    /**
     * 缩放选中的对象
     */
    scaleSelectedObject(object, delta) {
        if (!object) return;
        
        const currentScaleX = object.scaleX || 1;
        const currentScaleY = object.scaleY || 1;
        
        // 计算缩放因子
        const scaleFactor = delta < 0 ? 1.1 : 0.9;
        
        // 设置缩放范围限制
        const minScale = 0.1;
        const maxScale = 5.0;
        
        const newScaleX = Math.max(minScale, Math.min(maxScale, currentScaleX * scaleFactor));
        const newScaleY = Math.max(minScale, Math.min(maxScale, currentScaleY * scaleFactor));
        
        // 应用缩放
        object.set({
            scaleX: newScaleX,
            scaleY: newScaleY
        });
        
        // 触发对象变化事件
        object.fire('scaling');
        this.fabricCanvas.fire('object:scaling', { target: object });
        
        // 重新渲染画布
        this.fabricCanvas.renderAll();
        
        // 触发自动保存
        this._scheduleAutoSave();
    }
    
    /**
     * 缩放画布视图
     */
    scaleCanvasView(delta) {
        if (!this.canvasContainer) return;
        
        let zoom = this.canvasViewScale;
        
        // 根据滚轮方向调整缩放
        if (delta < 0) {
            // 向上滚动 - 放大
            zoom = Math.min(zoom * 1.1, 3.0);
        } else {
            // 向下滚动 - 缩小  
            zoom = Math.max(zoom * 0.9, 0.5);
        }
        
        this.canvasViewScale = zoom;
        this.applyCanvasViewScale();
    }
    
    /**
     * 自适应画布视图 - 显示整个画布内容
     */
    fitCanvasView() {
        if (!this.canvasContainer) return;
        
        const parentContainer = this.canvasContainer.parentElement;
        if (!parentContainer) return;
        
        const containerWidth = this.canvasContainer.offsetWidth;
        const containerHeight = this.canvasContainer.offsetHeight;
        const parentWidth = parentContainer.clientWidth;
        const parentHeight = parentContainer.clientHeight;
        
        // 计算合适的缩放比例，留出一些边距
        const scaleX = (parentWidth * 0.9) / containerWidth;
        const scaleY = (parentHeight * 0.9) / containerHeight;
        const scale = Math.min(scaleX, scaleY, 2.0); // 最大缩放200%
        
        this.canvasViewScale = Math.max(scale, 0.5); // 最小50%
        this.applyCanvasViewScale();
    }
    
    /**
     * 调度图层面板更新 - 防止频繁调用
     */
    _scheduleLayerPanelUpdate() {
        clearTimeout(this._updateTimeout);
        this._updateTimeout = setTimeout(() => {
            this.updateLayerPanel();
        }, 100);
    }
    
    /**
     * 更新图层面板 - 完全基于Fabric.js官方图层管理
     */
    updateLayerPanel() {
        const layersList = this.modal.querySelector('#layers-list');
        if (!layersList) return;
        
        const objects = this.fabricCanvas.getObjects();
        const activeObjects = this.fabricCanvas.getActiveObjects();
        
        if (objects.length === 0) {
            layersList.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #888;">
                    <div style="font-size: 32px; margin-bottom: 8px;">🎨</div>
                    <div style="font-size: 12px;">暂无对象</div>
                    <div style="font-size: 10px; color: #666; margin-top: 4px;">
                        使用绘制工具或上传图片创建对象
                    </div>
                </div>
            `;
            return;
        }
        
        // 反向显示对象（最新的在上面，符合图层逻辑）
        const reversedObjects = [...objects].reverse();
        layersList.innerHTML = reversedObjects.map((obj, displayIndex) => {
            // 实际索引是反向的
            const actualIndex = objects.length - 1 - displayIndex;
            
            const objType = obj.type === 'rect' ? '🟩 矩形' : 
                           obj.type === 'circle' ? '🔴 圆形' : 
                           obj.type === 'polygon' ? '🔷 多边形' :
                           obj.type === 'path' ? '✏️ 路径' : 
                           obj.type === 'image' ? '🖼️ 图片' :
                           obj.type === 'text' ? '🅰️ 文字' : `📐 ${obj.type}`;
            
            const isSelected = activeObjects.some(activeObj => activeObj === obj);
            const isLocked = obj.locked === true;
            const lockIndicator = isLocked ? '🔒 ' : '';
            
            return `
                <div class="fabric-layer-item" data-index="${actualIndex}" 
                     style="
                        padding: 8px 12px; 
                        margin: 2px 0; 
                        background: ${isSelected ? '#4CAF50' : '#2b2b2b'};
                        border: 1px solid ${isSelected ? '#4CAF50' : '#444'}; 
                        border-radius: 4px; 
                        cursor: pointer;
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center;
                        transition: all 0.2s ease;
                     ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 12px; color: ${isSelected ? 'white' : '#ccc'};">
                            ${lockIndicator}${objType} (层级: ${actualIndex})
                        </span>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="fabric-layer-lock" data-index="${actualIndex}" 
                                style="background: ${isLocked ? '#f44336' : '#4CAF50'}; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;"
                                title="${isLocked ? '解锁图层' : '锁定图层'}">${isLocked ? '🔓' : '🔒'}</button>
                        <button class="fabric-layer-up" data-index="${actualIndex}" 
                                style="background: #666; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;"
                                title="向上移动" ${actualIndex >= objects.length - 1 ? 'disabled' : ''}>↑</button>
                        <button class="fabric-layer-down" data-index="${actualIndex}"
                                style="background: #666; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;"
                                title="向下移动" ${actualIndex <= 0 ? 'disabled' : ''}>↓</button>
                        <button class="fabric-layer-delete" data-index="${actualIndex}"
                                style="background: #f44336; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;"
                                title="删除">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // 清除之前的事件监听器，然后重新绑定
        this.unbindLayerPanelEvents();
        this.bindLayerPanelEvents();
        
    }
    
    /**
     * 清除图层面板事件监听器
     */
    unbindLayerPanelEvents() {
        // 清除所有已绑定的事件监听器
        const layerItems = this.modal.querySelectorAll('.fabric-layer-item');
        const buttons = this.modal.querySelectorAll('.fabric-layer-lock, .fabric-layer-up, .fabric-layer-down, .fabric-layer-delete');
        
        layerItems.forEach(item => {
            item.replaceWith(item.cloneNode(true));
        });
        
        buttons.forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
    }
    
    /**
     * 绑定图层面板事件 - 完全基于Fabric.js官方图层API
     */
    bindLayerPanelEvents() {
        const layerItems = this.modal.querySelectorAll('.fabric-layer-item');
        const lockButtons = this.modal.querySelectorAll('.fabric-layer-lock');
        const upButtons = this.modal.querySelectorAll('.fabric-layer-up');
        const downButtons = this.modal.querySelectorAll('.fabric-layer-down');
        const deleteButtons = this.modal.querySelectorAll('.fabric-layer-delete');
        
        // 点击图层项选择对象 - Fabric.js官方选择API
        layerItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') return; // 忽略按钮点击
                
                const index = parseInt(item.dataset.index);
                this.selectObjectByIndex(index, true); // 添加更新面板标志
            });
        });
        
        // 锁定/解锁图层 - 直接操作对象锁定状态
        lockButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.toggleObjectLockByIndex(index);
            });
        });
        
        // 向上移动 - Fabric.js官方bringForward API
        upButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                if (!btn.disabled) {
                    this.moveObjectUp(index);
                }
            });
        });
        
        // 向下移动 - Fabric.js官方sendBackwards API
        downButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                if (!btn.disabled) {
                    this.moveObjectDown(index);
                }
            });
        });
        
        // 删除对象 - Fabric.js官方remove API
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.deleteObjectByIndex(index);
            });
        });
    }
    
    /**
     * 按索引选择对象 - Fabric.js官方setActiveObject API
     */
    selectObjectByIndex(index, updatePanel = false) {
        const objects = this.fabricCanvas.getObjects();
        if (objects[index]) {
            this.fabricCanvas.discardActiveObject(); // 清除之前的选择
            this.fabricCanvas.setActiveObject(objects[index]);
            this.fabricCanvas.renderAll();
            
            if (updatePanel) {
                // 立即更新面板显示
                this._scheduleLayerPanelUpdate();
            }
            
        }
    }
    
    /**
     * 向上移动对象 - Fabric.js官方bringForward API
     */
    moveObjectUp(index) {
        const objects = this.fabricCanvas.getObjects();
        if (objects[index]) {
            this.fabricCanvas.bringForward(objects[index]);
            this.fabricCanvas.renderAll();
            // 触发object:moved事件会自动更新图层面板
            this.fabricCanvas.fire('object:moved');
        }
    }
    
    /**
     * 向下移动对象 - Fabric.js官方sendBackwards API
     */
    moveObjectDown(index) {
        const objects = this.fabricCanvas.getObjects();
        if (objects[index]) {
            this.fabricCanvas.sendBackwards(objects[index]);
            this.fabricCanvas.renderAll();
            // 触发object:moved事件会自动更新图层面板
            this.fabricCanvas.fire('object:moved');
        }
    }
    
    /**
     * 按索引删除对象 - Fabric.js官方remove API
     */
    deleteObjectByIndex(index) {
        const objects = this.fabricCanvas.getObjects();
        if (objects[index]) {
            const objType = objects[index].type;
            this.fabricCanvas.remove(objects[index]);
            this.fabricCanvas.renderAll();
        }
    }
    
    /**
     * 清空画布 - Fabric.js官方clear API
     */
    clear() {
        this.fabricCanvas.clear();
        this.fabricCanvas.backgroundColor = '#ffffff';
        this.fabricCanvas.renderAll();
        
        // 触发图层面板更新
        this._scheduleLayerPanelUpdate();
    }

    /**
     * 获取所有对象 - Fabric.js官方API
     */
    getAllObjects() {
        return this.fabricCanvas.getObjects();
    }

    /**
     * 选择所有对象 - Fabric.js官方API
     */
    selectAll() {
        const objects = this.fabricCanvas.getObjects();
        if (objects.length > 0) {
            const selection = new fabric.ActiveSelection(objects, {
                canvas: this.fabricCanvas
            });
            this.fabricCanvas.setActiveObject(selection);
            this.fabricCanvas.renderAll();
        }
    }

    /**
     * 取消选择 - Fabric.js官方API
     */
    clearSelection() {
        this.fabricCanvas.discardActiveObject();
        this.fabricCanvas.renderAll();
    }

    /**
     * 删除选中对象 - Fabric.js官方API
     */
    deleteSelected() {
        const activeObjects = this.fabricCanvas.getActiveObjects();
        if (activeObjects.length > 0) {
            activeObjects.forEach(obj => {
                this.fabricCanvas.remove(obj);
            });
            this.fabricCanvas.discardActiveObject();
            this.fabricCanvas.renderAll();
            // 触发图层面板更新
            this._scheduleLayerPanelUpdate();
        }
    }


    /**
     * 绑定键盘事件 - Fabric.js官方支持
     */
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // 只在弹窗打开时处理键盘事件
            if (!this.modal || !document.body.contains(this.modal)) {
                return;
            }

            // Delete/Backspace键删除选中对象
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                this.deleteSelected();
            }

            // Ctrl+A全选
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                this.selectAll();
            }

            // Escape取消选择
            if (e.key === 'Escape') {
                e.preventDefault();
                this.clearSelection();
            }
        });

    }
    
    /**
     * 缓存当前选中图层的状态
     */
    cacheCurrentLayerState() {
        if (!this.dataManager || !this.currentSelectedLayerId) {
            return;
        }
        
        this.dataManager.cacheLayerState(this.currentSelectedLayerId, this.modal);
    }
    
    /**
     * 恢复图层状态
     */
    restoreLayerState(selectedObjects) {
        if (!this.dataManager || !selectedObjects || selectedObjects.length === 0) {
            return;
        }
        
        const firstObject = selectedObjects[0];
        if (firstObject && firstObject.fabricId) {
            this.currentSelectedLayerId = firstObject.fabricId;
            this.dataManager.restoreLayerState(firstObject.fabricId, this.modal);
        }
    }
    
    /**
     * 调度自动保存
     */
    _scheduleAutoSave() {
        if (!this.dataManager) return;
        
        // 清除之前的定时器
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
            this.performAutoSave();
        }, this.autoSaveDelay);
    }
    
    /**
     * 执行自动保存
     */
    performAutoSave() {
        if (!this.dataManager || !this.fabricCanvas) {
            return;
        }
        
        try {
            const success = this.dataManager.saveFabricCanvasData(this.fabricCanvas);
            if (success) {
            }
        } catch (error) {
            console.error('❌ 自动保存失败:', error);
        }
    }
    
    /**
     * 恢复保存的画布数据
     */
    async restoreSavedCanvasData() {
        if (!this.dataManager || !this.fabricCanvas) {
            return;
        }
        
        try {
            const fabricData = this.dataManager.loadFabricCanvasData();
            if (fabricData) {
                const success = await this.dataManager.restoreFabricCanvas(this.fabricCanvas, fabricData);
                if (success) {
                    this.updateLayerPanel();
                }
            }
        } catch (error) {
            console.error('❌ 恢复画布数据失败:', error);
        }
    }
    
    /**
     * 设置画布尺寸
     */
    setCanvasSize(width, height) {
        if (!this.fabricCanvas) {
            return false;
        }
        
        try {
            this.fabricCanvas.setDimensions({
                width: width,
                height: height
            });
            
            const canvasElement = this.fabricCanvas.getElement();
            if (canvasElement) {
                canvasElement.width = width;
                canvasElement.height = height;
                canvasElement.style.width = width + 'px';
                canvasElement.style.height = height + 'px';
            }
            
            // 重新渲染画布
            this.fabricCanvas.renderAll();
            
            // 触发自动保存
            this._scheduleAutoSave();
            
            return true;
            
        } catch (error) {
            console.error('❌ 设置画布尺寸失败:', error);
            return false;
        }
    }

    /**
     * 手动保存画布数据
     */
    saveCanvasData() {
        if (!this.dataManager) {
            return false;
        }
        
        return this.dataManager.saveFabricCanvasData(this.fabricCanvas);
    }

    /**
     * 上传图像到画布
     */
    uploadImageToCanvas(imageUrl, options = {}) {
        if (!this.fabricCanvas || !window.fabric) {
            return;
        }

        try {
            window.fabric.Image.fromURL(imageUrl, (fabricImage) => {
                if (!fabricImage) {
                    console.error('❌ 加载图像失败:', imageUrl);
                    return;
                }

                const defaults = {
                    selectable: true,
                    hasControls: true,
                    hasBorders: true,
                    fabricId: `uploaded_image_${Date.now()}`,
                    name: options.name || 'Uploaded Image'
                };

                fabricImage.set({...defaults, ...options});

                // 如果没有指定位置，自动居中和缩放
                if (!options.left && !options.top) {
                    const canvasWidth = this.fabricCanvas.getWidth();
                    const canvasHeight = this.fabricCanvas.getHeight();
                    
                    // 计算合适的缩放
                    const maxScale = 0.8; // 最大占画布80%
                    const scaleX = Math.min(maxScale, canvasWidth / fabricImage.width);
                    const scaleY = Math.min(maxScale, canvasHeight / fabricImage.height);
                    const scale = Math.min(scaleX, scaleY);

                    fabricImage.set({
                        scaleX: scale,
                        scaleY: scale,
                        left: (canvasWidth - fabricImage.width * scale) / 2,
                        top: (canvasHeight - fabricImage.height * scale) / 2
                    });
                }

                this.fabricCanvas.add(fabricImage);
                this.fabricCanvas.setActiveObject(fabricImage);
                this.fabricCanvas.renderAll();

                this.updateLayerPanel();

                // 触发自动保存
                this._scheduleAutoSave();


            }, {
                crossOrigin: 'anonymous'
            });

        } catch (error) {
            console.error('❌ 上传图像到画布失败:', error);
        }
    }

    /**
     * 修复控制点显示问题
     */
    fixControlsDisplay() {
        try {
            const activeObject = this.fabricCanvas.getActiveObject();
            if (activeObject) {
                // 强制重新计算对象坐标
                activeObject.setCoords();
                
                // 强制重新渲染控制点
                this.fabricCanvas.renderAll();
                
                requestAnimationFrame(() => {
                    activeObject.setCoords();
                    this.fabricCanvas.renderAll();
                });
            }
        } catch (error) {
            console.error('❌ 修复控制点显示失败:', error);
        }
    }
    
    /**
     * 切换选中对象的锁定状态
     */
    toggleSelectedObjectsLock() {
        const activeObjects = this.fabricCanvas.getActiveObjects();
        
        if (activeObjects.length === 0) {
            // 如果没有选中对象，检查是否有锁定的对象，如果有则解锁所有
            const allObjects = this.fabricCanvas.getObjects();
            const lockedObjects = allObjects.filter(obj => obj.locked === true);
            
            if (lockedObjects.length > 0) {
                // 解锁所有锁定的对象
                lockedObjects.forEach(obj => {
                    this.setObjectLock(obj, false);
                });
                
                console.log(`🔓 解锁了所有 ${lockedObjects.length} 个锁定对象`);
            } else {
                console.log('⚠️ 没有选中的对象，也没有锁定的对象');
                return;
            }
        } else {
            // 有选中对象时的正常逻辑
            const hasLockedObjects = activeObjects.some(obj => obj.locked === true);
            const newLockState = !hasLockedObjects;
            
            activeObjects.forEach(obj => {
                this.setObjectLock(obj, newLockState);
            });
            
            console.log(`🔒 ${newLockState ? '锁定' : '解锁'}了 ${activeObjects.length} 个选中对象`);
        }
        
        // 更新锁定按钮显示
        this.updateLockButtonState();
        
        // 更新图层面板显示
        this.updateLayerPanel();
    }
    
    /**
     * 设置对象锁定状态
     */
    setObjectLock(object, locked) {
        if (!object) return;
        
        object.locked = locked;
        
        if (locked) {
            // 锁定对象：禁用选择、移动、缩放、旋转
            object.set({
                selectable: false,
                evented: false,
                hasControls: false,
                hasBorders: false,
                hoverCursor: 'default',
                moveCursor: 'default'
            });
            
            // 添加视觉指示器
            this.addLockIndicator(object);
        } else {
            // 解锁对象：恢复交互功能
            object.set({
                selectable: true,  
                evented: true,
                hasControls: true,
                hasBorders: true,
                hoverCursor: 'move',
                moveCursor: 'move'
            });
            
            // 移除视觉指示器
            this.removeLockIndicator(object);
        }
        
        this.fabricCanvas.renderAll();
    }
    
    /**
     * 添加锁定视觉指示器
     */
    addLockIndicator(object) {
        if (!object || object.lockIndicator) return;
        
        // 创建锁定图标
        const lockIcon = new fabric.Text('🔒', {
            left: object.left + object.width * object.scaleX - 15,
            top: object.top - 15,
            fontSize: 12,
            selectable: false,
            evented: false,
            excludeFromExport: true
        });
        
        lockIcon.lockIndicatorFor = object.fabricId || object.id;
        object.lockIndicator = lockIcon;
        
        this.fabricCanvas.add(lockIcon);
        this.fabricCanvas.bringToFront(lockIcon);
    }
    
    /**
     * 移除锁定视觉指示器
     */
    removeLockIndicator(object) {
        if (!object || !object.lockIndicator) return;
        
        this.fabricCanvas.remove(object.lockIndicator);
        object.lockIndicator = null;
    }
    
    /**
     * 更新锁定按钮状态
     */
    updateLockButtonState() {
        const lockBtn = this.modal.querySelector('#vpe-lock-toggle');
        if (!lockBtn) return;
        
        const activeObjects = this.fabricCanvas.getActiveObjects();
        const allObjects = this.fabricCanvas.getObjects();
        const lockedObjects = allObjects.filter(obj => obj.locked === true);
        
        if (activeObjects.length === 0) {
            // 没有选中对象时，显示是否有锁定对象
            if (lockedObjects.length > 0) {
                lockBtn.textContent = '🔓';
                lockBtn.title = `解锁所有锁定对象 (${lockedObjects.length}个)`;
                lockBtn.style.background = '#ff9800'; // 橙色表示有锁定对象可解锁
            } else {
                lockBtn.textContent = '🔒';
                lockBtn.title = '锁定/解锁选中对象';
                lockBtn.style.background = '#555'; // 灰色表示无操作
            }
            return;
        }
        
        const hasLockedObjects = activeObjects.some(obj => obj.locked === true);
        
        if (hasLockedObjects) {
            lockBtn.textContent = '🔓';
            lockBtn.title = `解锁选中对象 (${activeObjects.length}个)`;
            lockBtn.style.background = '#f44336'; // 红色表示有锁定对象
        } else {
            lockBtn.textContent = '🔒';
            lockBtn.title = `锁定选中对象 (${activeObjects.length}个)`;
            lockBtn.style.background = '#4CAF50'; // 绿色表示可锁定
        }
    }
    
    /**
     * 通过索引切换对象锁定状态
     */
    toggleObjectLockByIndex(index) {
        const objects = this.fabricCanvas.getObjects();
        const targetObject = objects[index];
        
        if (!targetObject) {
            console.error('❌ 找不到索引为', index, '的对象');
            return;
        }
        
        const currentLockState = targetObject.locked === true;
        const newLockState = !currentLockState;
        
        // 设置新的锁定状态
        this.setObjectLock(targetObject, newLockState);
        
        // 更新锁定按钮状态
        this.updateLockButtonState();
        
        // 更新图层面板显示
        this.updateLayerPanel();
        
        console.log(`🔒 ${newLockState ? '锁定' : '解锁'}了对象:`, targetObject.type, `(索引: ${index})`);
    }
    
    /**
     * 检查对象是否被锁定
     */
    isObjectLocked(object) {
        return object && object.locked === true;
    }
}

/**
 * 创建官方架构管理器实例
 */
export async function createFabricNativeManager(modal, dataManager = null) {
    const manager = new FabricNativeManager(modal, dataManager);
    
    // 立即初始化
    await manager.initialize();
    
    // 确保图层面板在管理器完全初始化后更新
    setTimeout(() => {
        manager.updateLayerPanel();
    }, 200);
    
    return manager;
}


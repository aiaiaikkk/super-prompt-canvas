/**
 * Visual Prompt Editor - 纯Fabric.js官方架构系统
 * 完全基于Fabric.js官方文档和最佳实践
 * 不依赖任何自定义绘制、变换或事件处理逻辑
 */

import { CONSTRAINT_PROMPTS, DECORATIVE_PROMPTS, generateId } from './visual_prompt_editor_utils.js';
import { registerManagedFabricCanvas, addManagedEventListener } from './visual_prompt_editor_cleanup.js';
import { globalImageScalingManager, MAX_DISPLAY_SIZE } from './visual_prompt_editor_image_scaling.js';

// 动态加载Fabric.js库
let fabric = null;

async function loadFabricJS() {
    // 🔧 强制重新加载完整版Fabric.js，不使用已存在的不完整实例
    console.log('🔧 强制加载完整版Fabric.js...');
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        // 🔧 使用完整版Fabric.js
        script.src = '/extensions/kontext-super-prompt/libs/fabric.js';
        script.onload = () => {
            // 延迟一下确保Fabric.js完全初始化
            setTimeout(() => {
                fabric = window.fabric;
                console.log('✅ 完整版Fabric.js强制加载成功');
                console.log('Fabric.js版本:', fabric.version);
                console.log('fabric.Canvas可用性:', typeof fabric.Canvas);
                console.log('fabric.Object可用性:', typeof fabric.Object);
                console.log('fabric.StaticCanvas可用性:', typeof fabric.StaticCanvas);
                console.log('fabric.Rect可用性:', typeof fabric.Rect);
                
                if (typeof fabric.Canvas !== 'function') {
                    console.error('❌ 即使重新加载，Canvas仍不可用');
                    reject(new Error('Canvas构造函数仍不可用'));
                } else {
                    resolve(fabric);
                }
            }, 200);
        };
        script.onerror = () => {
            console.error('❌ Fabric.js完整版加载失败');
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
        
        // 裁切工具状态 - 性能优化版
        this.cropPoints = [];
        this.isDrawingCrop = false;
        this.tempCropLine = null;
        this.cropAnchors = []; // 存储锚点标记
        this.cropPreviewPending = false; // 防止频繁重绘的标志
        this.cropRenderThrottle = null; // 渲染节流器
        
        // Transform-First架构状态管理
        this.transformFirstUpdatePending = false; // Transform-First数据更新标志
        
        // 当前选中的图层ID（用于状态缓存）
        this.currentSelectedLayerId = null;
        
        // 自动保存相关 - 🚀 优化版本
        this.autoSaveTimeout = null;
        this.autoSaveDelay = 3000; // 增加到3秒延迟，减少频繁保存
        this.lastAutoSaveTime = 0;
        this.autoSaveEnabled = true; // 可以手动禁用自动保存
        this.pendingAutoSave = false; // 标记有待处理的自动保存
        
        // 🚀 变换操作优化相关
        this._isTransforming = false; // 标记是否正在变换中
        this._transformEndTimeout = null; // 变换结束定时器
        this._lastTransformTime = 0; // 上次变换时间
        
        // Undo/Redo 功能
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 20; // 最多保存20个历史状态
        this.isPerformingUndoRedo = false; // 防止在undo/redo时触发保存状态
        
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
            
            // 延迟自动适应屏幕，确保界面完全渲染完成
            setTimeout(() => {
                this.fitCanvasView();
                // 初始化历史记录
                this.initializeHistory();
            }, 500);
            
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
        console.log('🎨 开始创建Fabric画布...');
        
        // 找到Canvas容器
        const canvasContainer = this.modal.querySelector('#fabric-canvas-container') || 
                               this.modal.querySelector('#zoom-container') || 
                               this.modal.querySelector('#canvas-container');
        
        if (!canvasContainer) {
            console.error('❌ 找不到Canvas容器');
            throw new Error('找不到Canvas容器');
        }
        
        console.log('✅ 找到Canvas容器:', canvasContainer.id);
        
        // 保存画布容器引用用于视图缩放
        this.canvasContainer = canvasContainer;
        
        const canvasElement = document.createElement('canvas');
        canvasElement.id = 'fabric-official-canvas';
        canvasElement.width = 800;
        canvasElement.height = 600;
        
        // 清空容器并添加Canvas
        canvasContainer.innerHTML = '';
        canvasContainer.appendChild(canvasElement);
        
        console.log('🔧 准备创建Fabric画布，fabric对象:', typeof fabric);
        console.log('🔧 fabric.Canvas类型:', typeof fabric.Canvas);
        
        if (!fabric) {
            console.error('❌ Fabric.js未正确加载');
            throw new Error('Fabric.js未加载');
        }
        
        // 检查不同的Canvas构造方式
        let CanvasConstructor = null;
        if (typeof fabric.Canvas === 'function') {
            CanvasConstructor = fabric.Canvas;
        } else if (fabric.canvas && typeof fabric.canvas === 'function') {
            CanvasConstructor = fabric.canvas;
        } else if (fabric.StaticCanvas && typeof fabric.StaticCanvas === 'function') {
            CanvasConstructor = fabric.StaticCanvas;
        }
        
        if (!CanvasConstructor) {
            console.error('❌ 找不到有效的Canvas构造函数');
            console.log('可用的fabric属性:', Object.keys(fabric));
            throw new Error('Fabric.js Canvas构造函数不可用');
        }
        
        console.log('✅ 使用Canvas构造函数:', CanvasConstructor.name || 'Unknown');
        
        this.fabricCanvas = new CanvasConstructor(canvasElement, {
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
        
        // 🧹 注册Fabric画布到清理管理器（防止内存泄漏）
        registerManagedFabricCanvas(this.fabricCanvas);
        
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
            this.handleObjectSelection(e.selected || [e.target]);
            this.fixControlsDisplay();
            this.updateLockButtonState();
        });
        
        this.fabricCanvas.on('selection:updated', (e) => {
            this.handleObjectSelection(e.selected || [e.target]);
            this.fixControlsDisplay();
            this.updateLockButtonState();
        });
        
        this.fabricCanvas.on('selection:cleared', () => {
            // 只有在非Ctrl+click模式下才清除多选状态
            if (!this.isCtrlPressed) {
                this.multiSelectObjects.clear();
            }
            this.handleObjectSelection([]);
            this.updateLockButtonState();
        });
        
        // 官方对象事件 - 优化更新频率
        this.fabricCanvas.on('object:added', (e) => {
            // 过滤掉锁定指示器
            if (e.target && !e.target.isLockIndicator && !e.target.skipInLayerList) {
                this.saveState();
            }
            this._scheduleLayerPanelUpdate();
            this._scheduleAutoSave();
        });
        
        this.fabricCanvas.on('object:removed', (e) => {
            // 过滤掉锁定指示器
            if (e.target && !e.target.isLockIndicator && !e.target.skipInLayerList) {
                this.saveState();
            }
            this._scheduleLayerPanelUpdate();
            this._scheduleAutoSave();
        });
        
        // 对象移动事件 - 图层顺序改变时更新面板
        this.fabricCanvas.on('object:moving', () => {
            // 移动过程中不更新，避免频繁重绘
        });
        
        this.fabricCanvas.on('object:moved', (e) => {
            this._constrainObjectToBounds(e.target);
            this.saveState();
            this._scheduleAutoSave();
        });
        
        // 对象修改事件 - 触发自动保存
        this.fabricCanvas.on('object:modified', (e) => {
            const target = e.target;
            if (target) {
                console.log(`🔄 [OBJECT_MODIFIED] 对象修改: ${target.type}${target.type === 'image' ? ' (' + (target.width || 0) + 'x' + (target.height || 0) + ')' : ''}, 变换: ${JSON.stringify({
                    scaleX: target.scaleX,
                    scaleY: target.scaleY,
                    angle: target.angle,
                    left: target.left,
                    top: target.top
                })}`);
            }
            this.saveState();
            
            // 🚀 节流优化：变换操作时延长保存间隔
            if (target && (target.type === 'image' || target._isTransforming)) {
                // 标记正在变换中
                this._isTransforming = true;
                
                // 清除之前的定时器
                if (this._transformEndTimeout) {
                    clearTimeout(this._transformEndTimeout);
                }
                
                // 延迟保存，等待变换操作完全结束
                this._transformEndTimeout = setTimeout(() => {
                    this._isTransforming = false;
                    this._scheduleAutoSave();
                }, 1500); // 变换结束后1.5秒再保存
            } else {
                // 非变换操作，正常保存
                this._scheduleAutoSave();
            }
        });
        
        this.fabricCanvas.on('object:scaling', () => {
            // 缩放过程中不保存
        });
        
        // 🚀 变换开始事件
        this.fabricCanvas.on('transform:start', (e) => {
            const target = e.target;
            if (target) {
                target._isTransforming = true;
                this._isTransforming = true;
                console.log(`🔄 [TRANSFORM_START] 开始变换: ${target.type}`);
            }
        });
        
        // 🚀 变换结束事件
        this.fabricCanvas.on('transform:end', (e) => {
            const target = e.target;
            if (target) {
                console.log(`🔄 [TRANSFORM_END] 变换结束: ${target.type}`);
                
                // 延迟标记变换结束，确保所有修改事件都已触发
                setTimeout(() => {
                    if (target) {
                        target._isTransforming = false;
                    }
                    
                    // 清除之前的定时器
                    if (this._transformEndTimeout) {
                        clearTimeout(this._transformEndTimeout);
                    }
                    
                    // 延迟保存，等待可能的连续变换操作
                    this._transformEndTimeout = setTimeout(() => {
                        this._isTransforming = false;
                        console.log(`🔄 [TRANSFORM_COMPLETE] 变换操作完全结束，触发保存`);
                        this._scheduleAutoSave();
                    }, 1000); // 变换结束后1秒再保存
                }, 100);
            }
        });
        
        // 文字编辑事件
        this.fabricCanvas.on('text:editing:exited', (e) => {
            // 文字退出编辑模式，触发自动保存
            this._scheduleAutoSave();
        });
        
        this.fabricCanvas.on('mouse:wheel', (opt) => {
            this.handleCanvasZoom(opt);
        });
        
        this.fabricCanvas.on('object:scaled', (e) => {
            const target = e.target;
            if (target && target.type === 'image') {
                const originalSize = (target.originalWidth || 0) * (target.originalHeight || 0);
                // 使用Fabric.js原生API获取实际尺寸
                const bounds = target.getBoundingRect();
                const currentSize = bounds.width * bounds.height;
                console.log(`📏 [IMAGE_SCALED] 图像缩放完成: 原始尺寸: ${target.originalWidth || 0}x${target.originalHeight || 0}, 显示尺寸: ${Math.round(bounds.width)}x${Math.round(bounds.height)}, 缩放比例: ${target.scaleX.toFixed(2)}x${target.scaleY.toFixed(2)}`);
                
                // 检查是否为大图像
                if (originalSize > 1000000) { // 大于1百万像素
                    console.warn(`⚠️ [PERFORMANCE] 大图像缩放操作可能影响性能 - 原始尺寸: ${(originalSize/1000000).toFixed(1)}MP`);
                }
            }
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
            
            // 删除快捷键 - 只使用Delete键，避免与文字输入冲突
            if (e.key === 'Delete') {
                // 检查焦点是否在输入框中，避免删除文字时误删对象
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                this.deleteSelected();
            }
            
            // 回车键确认裁切
            if (e.key === 'Enter') {
                // 检查焦点是否在输入框中，避免与文字输入冲突
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                
                if (this.currentTool === 'crop' && this.isDrawingCrop) {
                    e.preventDefault();
                    this.finishCrop();
                }
            }
            
            // Undo/Redo 快捷键
            if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
                // 检查焦点是否在输入框中，避免冲突
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                e.preventDefault();
                this.undo();
            }
            
            if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
                // 检查焦点是否在输入框中，避免冲突
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                e.preventDefault();
                this.redo();
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
        
        // 右键事件处理（多边形和裁切工具）
        this.fabricCanvas.wrapperEl.addEventListener('mousedown', (e) => {
            if (e.button === 2 && this.currentTool === 'polygon') {
                e.preventDefault();
                const pointer = this.fabricCanvas.getPointer(e);
                this.handlePolygonRightClick(pointer);
            } else if (e.button === 2 && this.currentTool === 'crop') {
                e.preventDefault();
                const pointer = this.fabricCanvas.getPointer(e);
                this.finishCrop();
            }
        });
        
        // 阻止右键菜单（多边形和裁切工具需要右键完成绘制）
        this.fabricCanvas.wrapperEl.addEventListener('contextmenu', (e) => {
            if (this.currentTool === 'polygon' || this.currentTool === 'crop') {
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
        
        // 裁切工具特殊处理
        if (this.currentTool === 'crop') {
            this.handleCropClick(pointer, e.e);
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
            const newId = this.generateFabricObjectId();
            this.drawingObject.fabricId = newId;
            this.drawingObject.id = newId;  // ✅ 修复：统一ID字段
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
        const selectedPrompts = Array.from(this.modal.querySelectorAll('.constraint-prompt-checkbox:checked'))
            .map(checkbox => checkbox.dataset.prompt);
        
        if (this.modal.selectedLayers) {
            this.modal.selectedLayers.forEach(layerId => {
                // Transform-First架构：移除废弃的annotation查找
                const annotation = null;
                if (annotation) {
                    annotation.constraintPrompts = selectedPrompts;
                }
            });
        }
    }
    
    /**
     * 更新选中对象的修饰性提示词
     */
    updateAnnotationDecorativePrompts() {
        const selectedPrompts = Array.from(this.modal.querySelectorAll('.decorative-prompt-checkbox:checked'))
            .map(checkbox => checkbox.dataset.prompt);
        
        if (this.modal.selectedLayers) {
            this.modal.selectedLayers.forEach(layerId => {
                // Transform-First架构：移除废弃的annotation查找
                const annotation = null;
                if (annotation) {
                    annotation.decorativePrompts = selectedPrompts;
                }
            });
        }
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
                // Transform-First架构：移除废弃的annotation查找
                const annotation = null;
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
                // Transform-First架构：移除废弃的annotation查找
                const annotation = null;
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
                // Transform-First架构：移除废弃的annotation查找
                const annotation = null;
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
                // Transform-First架构：移除废弃的annotation查找
                const annotation = null;
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
        // Transform-First架构：移除废弃的annotations同步逻辑
        
        selectedObjects.forEach(obj => {
            if (!obj.fabricId) {
                // 为对象分配唯一ID
                const newId = this.generateFabricObjectId();
                obj.fabricId = newId;
                obj.id = newId;  // ✅ 修复：统一ID字段
            } else if (!obj.id) {
                // 确保已有fabricId的对象也有id字段
                obj.id = obj.fabricId;
            }
            
            // Transform-First架构：移除废弃的annotation查找
            let annotation = null;
            
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
                // Transform-First架构：移除废弃的annotations push
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
            hasBorders: true,
            fabricId: `fabric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        
        // 🎯 设置polygon序列化
        this._setupFabricObjectSerialization(polygon);
        
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
     * 处理裁切工具点击 - 左键添加锚点，右键闭合
     */
    handleCropClick(pointer, mouseEvent) {
        if (mouseEvent.button === 2) {
            // 右键点击 - 闭合路径
            this.finishCrop();
            return;
        }
        
        if (mouseEvent.button === 0) {
            // 左键点击 - 添加锚点
            this.cropPoints.push({ x: pointer.x, y: pointer.y });
            this.addCropAnchor(pointer.x, pointer.y);
            
            if (!this.isDrawingCrop) {
                this.isDrawingCrop = true;
                this.showCropPreview();
            } else {
                this.updateCropPreview();
            }
            
            // 🚀 性能优化：节流渲染，避免频繁重绘
            this.throttledCropRender();
        }
    }
    
    /**
     * 节流渲染 - 防止裁切工具频繁重绘
     */
    throttledCropRender() {
        if (this.cropRenderThrottle) {
            clearTimeout(this.cropRenderThrottle);
        }
        
        this.cropRenderThrottle = setTimeout(() => {
            if (this.fabricCanvas) {
                this.fabricCanvas.renderAll();
            }
            this.cropRenderThrottle = null;
        }, 16); // 约60FPS的渲染频率
    }
    
    /**
     * 添加裁切锚点可视化标记 - 性能优化版
     */
    addCropAnchor(x, y) {
        // 🚀 性能优化：复用锚点对象，避免重复创建
        if (this.cropAnchors.length >= 20) {
            // 限制最大锚点数量，防止内存泄漏
            console.warn('[Crop] 🚨 裁切锚点数量过多，请完成当前裁切或取消');
            return;
        }
        
        const anchor = new fabric.Circle({
            left: x - 3,
            top: y - 3,
            radius: 6,
            fill: '#00ff00',
            stroke: '#ffffff',
            strokeWidth: 2,
            selectable: false,
            evented: false,
            excludeFromExport: true,
            originX: 'center',
            originY: 'center',
            // 🚀 性能优化：禁用阴影和缓存
            shadow: null,
            cacheProperties: []
        });
        
        this.cropAnchors.push(anchor);
        this.fabricCanvas.add(anchor);
        this.fabricCanvas.bringToFront(anchor);
        // 渲染将由父方法的throttledCropRender处理
    }
    
    /**
     * 清除所有裁切锚点 - 性能优化版
     */
    clearCropAnchors() {
        // 🚀 性能优化：批量移除锚点，减少DOM操作
        if (this.cropAnchors.length > 0) {
            // 使用批量操作而不是逐个移除
            this.fabricCanvas.remove(...this.cropAnchors);
            this.cropAnchors.length = 0; // 快速清空数组
        }
    }
    
    /**
     * 统一清理裁切状态 - 消除代码重复
     */
    cleanupCropState() {
        // 🚀 性能优化：清理渲染节流器
        if (this.cropRenderThrottle) {
            clearTimeout(this.cropRenderThrottle);
            this.cropRenderThrottle = null;
        }
        
        this.cropPreviewPending = false;
        
        // 清理预览线
        if (this.tempCropLine) {
            this.fabricCanvas.remove(this.tempCropLine);
            this.tempCropLine = null;
        }
        
        // 清理锚点
        this.clearCropAnchors();
        
        // 重置状态变量
        this.cropPoints.length = 0; // 快速清空数组
        this.isDrawingCrop = false;
    }
    
    /**
     * 显示裁切路径预览
     */
    showCropPreview() {
        if (this.cropPoints.length < 2) return;
        
        const points = this.cropPoints.map(p => [p.x, p.y]).flat();
        
        this.tempCropLine = new fabric.Polyline(this.cropPoints, {
            fill: 'transparent',
            stroke: '#00ff00',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            excludeFromExport: true
        });
        
        this.fabricCanvas.add(this.tempCropLine);
        // renderAll()在父方法中调用
    }
    
    /**
     * 更新裁切路径预览 - 性能优化版
     */
    updateCropPreview() {
        if (this.tempCropLine) {
            this.tempCropLine.set('points', [...this.cropPoints]);
            // 🚀 性能优化：使用requestAnimationFrame延迟渲染，避免频繁重绘
            if (!this.cropPreviewPending) {
                this.cropPreviewPending = true;
                requestAnimationFrame(() => {
                    if (this.fabricCanvas && this.tempCropLine) {
                        this.fabricCanvas.renderAll();
                    }
                    this.cropPreviewPending = false;
                });
            }
        } else {
            this.showCropPreview();
        }
    }
    
    /**
     * 完成裁切 - Transform-First架构版本
     * 🚀 不再生成实际图像，只保存裁切变换元数据
     */
    finishCrop() {
        if (this.cropPoints.length < 3) {
            // 至少需要3个点才能组成裁切路径
            this.cancelCrop();
            return;
        }
        
        console.log('[Crop-TransformFirst] 🎯 开始Transform-First裁切处理...');
        
        // 🚀 Transform-First: 创建裁切变换元数据，不执行实际裁切
        const cropTransform = {
            type: 'crop_mask',
            crop_path: this.cropPoints.map(point => ({
                x: point.x,
                y: point.y
            })),
            timestamp: Date.now(),
            transform_id: `crop_${Date.now()}`
        };
        
        // 查找目标对象（优先选中对象）
        const activeObjects = this.fabricCanvas.getActiveObjects();
        let targetObjects = [];
        
        if (activeObjects.length > 0) {
            targetObjects = activeObjects.filter(obj => 
                obj.type !== 'activeSelection' && this.isValidCropTarget(obj)
            );
        } else {
            // 自动查找裁切区域内的对象
            const cropBounds = {
                left: Math.min(...this.cropPoints.map(p => p.x)),
                top: Math.min(...this.cropPoints.map(p => p.y)),
                right: Math.max(...this.cropPoints.map(p => p.x)),
                bottom: Math.max(...this.cropPoints.map(p => p.y))
            };
            
            targetObjects = this.getValidObjects().filter(obj => 
                this.isValidCropTarget(obj) && this.isObjectInCropArea(obj, cropBounds)
            );
        }
        
        if (targetObjects.length === 0) {
            console.warn('[Crop-TransformFirst] ⚠️ 未找到可裁切的对象');
            this.cancelCrop();
            return;
        }
        
        // 🚀 Transform-First: 将裁切作为变换属性添加到对象，不修改图像数据
        targetObjects.forEach(obj => {
            this.applyTransformFirstCrop(obj, cropTransform);
        });
        
        console.log(`[Crop-TransformFirst] ✅ 已为 ${targetObjects.length} 个对象添加裁切变换元数据`);
        
        // 清理裁切状态并切换工具
        this.cleanupCropState();
        this.setTool('select');
        this.updateToolButtonState('select');
        
        // 触发Transform-First数据更新
        this.throttledCropRender();
    }
    
    /**
     * Transform-First架构：应用裁切变换元数据
     * 🚀 不处理实际图像，只添加变换信息
     */
    applyTransformFirstCrop(object, cropTransform) {
        // 初始化对象的Transform-First数据
        if (!object.transformFirstData) {
            object.transformFirstData = {
                transforms: [],
                version: '1.0'
            };
        }
        
        // 添加裁切变换到对象
        object.transformFirstData.transforms.push(cropTransform);
        
        // 🎨 添加可视化预览：半透明裁切蒙版
        this.addCropPreviewMask(object, cropTransform);
        
        // 标记对象已被Transform-First修改
        object.hasTransformFirstChanges = true;
        
        console.log(`[Crop-TransformFirst] 📊 对象 ${object.fabricId || 'unnamed'} 已添加裁切变换:`, {
            crop_points: cropTransform.crop_path.length,
            transform_id: cropTransform.transform_id
        });
        
        // 触发数据管理器更新Transform数据
        this._scheduleTransformFirstUpdate();
    }
    
    /**
     * 添加裁切预览效果 - 图像对象直接替换，其他对象显示蒙版
     */
    addCropPreviewMask(object, cropTransform) {
        if (object.type === 'image') {
            // 🖼️ 图像对象：直接应用裁切并替换原图
            console.log('[Crop-TransformFirst] 🖼️ 图像对象 - 应用裁切并替换原图');
            this.applyCropPreviewToImage(object, cropTransform);
        } else {
            // 📐 其他对象：显示裁切路径蒙版预览
            console.log('[Crop-TransformFirst] 📐 非图像对象 - 显示裁切蒙版预览');
            const previewMask = new fabric.Polygon(cropTransform.crop_path, {
                fill: 'rgba(255, 255, 0, 0.2)', // 半透明黄色
                stroke: '#ffff00',
                strokeWidth: 2,
                strokeDashArray: [8, 4],
                selectable: false,
                evented: false,
                excludeFromExport: true,
                cropPreviewFor: object.fabricId || object.id,
                name: `Crop Preview for ${object.name || 'Object'}`
            });
            
            this.fabricCanvas.add(previewMask);
            this.fabricCanvas.bringToFront(previewMask);
            
            // 将预览蒙版与原对象关联
            if (!object.cropPreviews) {
                object.cropPreviews = [];
            }
            object.cropPreviews.push(previewMask);
            
            // 渲染画布以显示预览效果
            this.fabricCanvas.renderAll();
        }
    }
    
    /**
     * 为图像对象应用裁切预览效果
     */
    applyCropPreviewToImage(imageObject, cropTransform) {
        try {
            console.log('[Crop-TransformFirst] 🎨 开始应用图像裁切预览...');
            
            // 保存原始图像源（如果还没保存）
            if (!imageObject._originalSrc) {
                imageObject._originalSrc = imageObject.getSrc();
            }
            
            // 计算裁切区域的边界框（相对于画布坐标）
            const cropBounds = this.calculateCropBounds(cropTransform.crop_path);
            
            // 使用Fabric.js原生API进行坐标转换
            const imageMatrix = imageObject.calcTransformMatrix();
            const invertedMatrix = fabric.util.invertTransform(imageMatrix);
            
            // 转换裁切边界到图像本地坐标系
            const topLeft = fabric.util.transformPoint({x: cropBounds.left, y: cropBounds.top}, invertedMatrix);
            const bottomRight = fabric.util.transformPoint({
                x: cropBounds.left + cropBounds.width, 
                y: cropBounds.top + cropBounds.height
            }, invertedMatrix);
            
            const imgCropBounds = {
                left: topLeft.x,
                top: topLeft.y,
                width: bottomRight.x - topLeft.x,
                height: bottomRight.y - topLeft.y
            };
            
            console.log('[Crop-TransformFirst] 📐 裁切边界计算:', {
                canvasCropBounds: cropBounds,
                imageCropBounds: imgCropBounds,
                imageObject: {
                    left: imageObject.left,
                    top: imageObject.top,
                    scale: imageObject.scaleX
                }
            });
            
            // 创建临时画布，尺寸为裁切区域的大小
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // 设置画布尺寸为裁切区域大小
            tempCanvas.width = Math.max(1, Math.round(imgCropBounds.width));
            tempCanvas.height = Math.max(1, Math.round(imgCropBounds.height));
            
            // 获取图像元素
            const imgElement = imageObject.getElement();
            if (!imgElement || !imgElement.complete) {
                console.warn('[Crop-TransformFirst] ⚠️ 图像未加载完成，跳过裁切预览');
                return;
            }
            
            // 创建裁切路径（转换为图像坐标系，并相对于裁切区域）
            tempCtx.beginPath();
            cropTransform.crop_path.forEach((point, index) => {
                const imgX = (point.x - imageObject.left) / imageObject.scaleX - imgCropBounds.left;
                const imgY = (point.y - imageObject.top) / imageObject.scaleY - imgCropBounds.top;
                
                if (index === 0) {
                    tempCtx.moveTo(imgX, imgY);
                } else {
                    tempCtx.lineTo(imgX, imgY);
                }
            });
            tempCtx.closePath();
            tempCtx.clip(); // 使用clip而不是填充
            
            // 绘制图像的裁切部分
            tempCtx.drawImage(
                imgElement,
                imgCropBounds.left, imgCropBounds.top, imgCropBounds.width, imgCropBounds.height, // 源区域
                0, 0, tempCanvas.width, tempCanvas.height // 目标区域
            );
            
            // 将裁切后的图像设置回对象
            const croppedDataURL = tempCanvas.toDataURL();
            
            // 创建新的图像对象完全替换原图
            fabric.Image.fromURL(croppedDataURL, (croppedImg) => {
                console.log('[Crop-TransformFirst] 📏 裁切后图像尺寸:', {
                    originalImage: `${imageObject.width}x${imageObject.height}`,
                    croppedImage: `${croppedImg.width}x${croppedImg.height}`,
                    croppedCanvas: `${tempCanvas.width}x${tempCanvas.height}`
                });
                
                // 新图像应该放置在裁切区域的左上角位置
                const newLeft = cropBounds.left;
                const newTop = cropBounds.top;
                
                // 计算新的缩放比例，使裁切后的图像显示大小与裁切区域一致
                const newScaleX = cropBounds.width / croppedImg.width;
                const newScaleY = cropBounds.height / croppedImg.height;
                
                // 设置新图像属性 - 精确匹配裁切区域的显示效果
                croppedImg.set({
                    left: newLeft,
                    top: newTop,
                    scaleX: newScaleX,
                    scaleY: newScaleY,
                    angle: imageObject.angle,
                    fabricId: imageObject.fabricId, // 保持相同的 fabricId
                    name: imageObject.name || 'Input Image',
                    selectable: true,    // ✅ 可选择
                    evented: true,       // ✅ 可交互
                    hasControls: true,   // ✅ 有控制点
                    hasBorders: true,    // ✅ 有边框
                    moveCursor: 'move',  // ✅ 移动光标
                    // 继承其他重要属性
                    opacity: imageObject.opacity || 1,
                    visible: true,
                    excludeFromExport: false
                });
                
                console.log('[Crop-TransformFirst] 📐 新图像定位:', {
                    originalPosition: `(${imageObject.left}, ${imageObject.top})`,
                    originalSize: `${imageObject.width}x${imageObject.height}`,
                    originalScale: `${imageObject.scaleX}x${imageObject.scaleY}`,
                    cropBounds: `(${cropBounds.left}, ${cropBounds.top}) ${cropBounds.width}x${cropBounds.height}`,
                    newPosition: `(${newLeft}, ${newTop})`,
                    newImageSize: `${croppedImg.width}x${croppedImg.height}`,
                    newScale: `${newScaleX.toFixed(3)}x${newScaleY.toFixed(3)}`
                });
                
                // ✂️ 清除Transform状态 - 裁切已在前端应用，避免后端重复处理
                // 创建新的transformFirstData但移除crop transforms，因为裁切已经应用了
                if (imageObject.transformFirstData) {
                    // 复制原始transform数据但过滤掉已应用的crop transforms
                    const filteredTransforms = imageObject.transformFirstData.transforms ? 
                        imageObject.transformFirstData.transforms.filter(t => t.type !== 'crop_mask') : [];
                    
                    croppedImg.transformFirstData = {
                        ...imageObject.transformFirstData,
                        transforms: filteredTransforms
                    };
                    croppedImg.hasTransformFirstChanges = filteredTransforms.length > 0;
                    console.log('[Crop-TransformFirst] ✅ 裁切已应用，移除crop transforms避免重复处理，保留其他变换');
                    console.log(`[Crop-TransformFirst] 📊 剩余变换: ${filteredTransforms.length} 个`);
                } else {
                    // 没有transform数据，创建空的
                    croppedImg.transformFirstData = { transforms: [] };
                    croppedImg.hasTransformFirstChanges = false;
                    console.log('[Crop-TransformFirst] ✅ 创建新的空transform数据');
                }
                
                // ✂️ 完全移除原图像对象
                this.fabricCanvas.remove(imageObject);
                
                // 添加新的裁切后图像
                this.fabricCanvas.add(croppedImg);
                
                // 自动选中新创建的图像，方便用户进行后续操作
                this.fabricCanvas.setActiveObject(croppedImg);
                
                // 确保对象坐标正确
                croppedImg.setCoords();
                
                // 保存状态到撤销历史，方便用户撤销裁切操作
                this.saveState();
                
                this.fabricCanvas.renderAll();
                
                console.log('[Crop-TransformFirst] ✅ 原图已被裁切后的新图像完全替换');
                console.log(`[Crop-TransformFirst] 📊 新图像属性: 可选择=${croppedImg.selectable}, 可交互=${croppedImg.evented}`);
                
                // 触发自动保存，确保数据同步
                this._scheduleAutoSave();
                
                // 立即触发数据管理器更新，确保"已处理图像"状态传递给后端
                if (this.dataManager) {
                    console.log('[Crop-TransformFirst] 📤 立即同步已处理图像状态到后端');
                    this.dataManager.saveFabricCanvasDataAsync(this.fabricCanvas);
                }
            });
            
        } catch (error) {
            console.error('[Crop-TransformFirst] ❌ 应用图像裁切预览失败:', error);
        }
    }
    
    /**
     * 计算裁切路径的边界框
     */
    calculateCropBounds(cropPath) {
        if (!cropPath || cropPath.length === 0) {
            return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
        }
        
        const xs = cropPath.map(p => p.x);
        const ys = cropPath.map(p => p.y);
        
        const left = Math.min(...xs);
        const top = Math.min(...ys);
        const right = Math.max(...xs);
        const bottom = Math.max(...ys);
        
        return {
            left: left,
            top: top,
            right: right,
            bottom: bottom,
            width: right - left,
            height: bottom - top
        };
    }
    
    /**
     * 调度Transform-First数据更新
     */
    _scheduleTransformFirstUpdate() {
        if (!this.transformFirstUpdatePending) {
            this.transformFirstUpdatePending = true;
            
            // 异步触发数据更新，避免阻塞UI
            setTimeout(() => {
                this._triggerTransformFirstDataUpdate();
                this.transformFirstUpdatePending = false;
            }, 100); // 100ms延迟批量处理
        }
    }
    
    /**
     * 触发Transform-First数据更新到data manager
     */
    _triggerTransformFirstDataUpdate() {
        const transformObjects = this.fabricCanvas.getObjects().filter(obj => 
            obj.hasTransformFirstChanges && obj.transformFirstData
        );
        
        if (transformObjects.length > 0) {
            console.log(`[Crop-TransformFirst] 📤 更新 ${transformObjects.length} 个对象的Transform数据`);
            
            // 通知data manager更新Transform-First数据
            if (this._scheduleAutoSave) {
                this._scheduleAutoSave();
            }
        }
    }
    
    /**
     * 过滤有效对象 - 统一过滤逻辑，消除重复代码
     */
    getValidObjects() {
        return this.fabricCanvas.getObjects().filter(obj => !obj.isLockIndicator && !obj.skipInLayerList);
    }
    
    /**
     * 判断对象是否是有效的裁切目标
     */
    isValidCropTarget(object) {
        // 过滤掉临时预览对象和锚点
        if (object.excludeFromExport || 
            this.cropAnchors.includes(object) || 
            object === this.tempCropLine) {
            return false;
        }
        
        // 支持图像、矩形、圆形、多边形等可见对象
        const validTypes = ['image', 'rect', 'circle', 'polygon', 'path', 'text', 'group'];
        return validTypes.includes(object.type);
    }
    
    /**
     * 判断对象是否在裁切区域内
     */
    isObjectInCropArea(object, cropBounds) {
        const objBounds = object.getBoundingRect();
        
        // 检查对象是否与裁切区域有重叠
        return !(objBounds.left > cropBounds.left + cropBounds.width ||
                 objBounds.left + objBounds.width < cropBounds.left ||
                 objBounds.top > cropBounds.top + cropBounds.height ||
                 objBounds.top + objBounds.height < cropBounds.top);
    }
    
    // 🚫 DEPRECATED: 旧的图像缓存裁切方法已被Transform-First架构替代
    // applyCropToObject 方法已移除，因为它违背了Transform-First架构
    // 现在使用 applyTransformFirstCrop 方法，只传输变换元数据，不缓存图像数据
    
    /**
     * 将对象渲染到指定画布
     */
    renderObjectToCanvas(object, ctx, cropBounds) {
        try {
            ctx.save();
            
            if (object.type === 'image') {
                // 处理图像对象 - 使用 Fabric.js 的渲染方法
                const img = object.getElement();
                if (img && img.complete) {
                    // 设置透明度
                    ctx.globalAlpha = object.opacity || 1;
                    
                    // 使用Fabric.js原生变换矩阵
                    const objectMatrix = object.calcTransformMatrix();
                    const offsetMatrix = [1, 0, 0, 1, -cropBounds.left, -cropBounds.top];
                    const combinedMatrix = fabric.util.multiplyTransformMatrices(offsetMatrix, objectMatrix);
                    
                    // 应用变换矩阵
                    ctx.setTransform(...combinedMatrix);
                    
                    // 绘制图像（以中心为原点）
                    ctx.drawImage(
                        img,
                        -object.width / 2,
                        -object.height / 2,
                        object.width,
                        object.height
                    );
                }
            } else {
                // 处理其他类型对象
                const offsetX = object.left - cropBounds.left;
                const offsetY = object.top - cropBounds.top;
                
                // 应用对象变换
                ctx.translate(offsetX, offsetY);
                ctx.rotate((object.angle || 0) * Math.PI / 180);
                ctx.scale(object.scaleX || 1, object.scaleY || 1);
                
                // 根据对象类型进行不同的渲染
                this.renderShapeToCanvas(object, ctx);
            }
            
            ctx.restore();
            
        } catch (error) {
            console.error('❌ 渲染对象到画布失败:', error);
        }
    }
    
    /**
     * 将形状对象渲染到画布 - 优化后的版本
     */
    renderShapeToCanvas(object, ctx) {
        // 设置透明度
        ctx.globalAlpha = object.opacity || 1;
        
        // 设置填充和描边样式
        ctx.fillStyle = object.fill || 'transparent';
        ctx.strokeStyle = object.stroke || 'transparent';
        ctx.lineWidth = object.strokeWidth || 0;
        
        // 统一的填充和描边处理函数 - 消除重复代码
        const applyFillAndStroke = () => {
            if (object.fill && object.fill !== 'transparent') {
                ctx.fill();
            }
            if (object.stroke && object.stroke !== 'transparent' && object.strokeWidth > 0) {
                ctx.stroke();
            }
        };
        
        switch (object.type) {
            case 'rect':
                if (object.fill && object.fill !== 'transparent') {
                    ctx.fillRect(0, 0, object.width, object.height);
                }
                if (object.stroke && object.stroke !== 'transparent' && object.strokeWidth > 0) {
                    ctx.strokeRect(0, 0, object.width, object.height);
                }
                break;
                
            case 'circle':
                const radius = object.radius;
                ctx.beginPath();
                ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
                applyFillAndStroke();
                break;
                
            case 'polygon':
                if (object.points && object.points.length > 0) {
                    ctx.beginPath();
                    ctx.moveTo(object.points[0].x, object.points[0].y);
                    for (let i = 1; i < object.points.length; i++) {
                        ctx.lineTo(object.points[i].x, object.points[i].y);
                    }
                    ctx.closePath();
                    applyFillAndStroke();
                }
                break;
                
            case 'text':
                if (object.text) {
                    ctx.font = `${object.fontSize || 16}px ${object.fontFamily || 'Arial'}`;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    
                    if (object.fill && object.fill !== 'transparent') {
                        ctx.fillText(object.text, 0, 0);
                    }
                    if (object.stroke && object.stroke !== 'transparent' && object.strokeWidth > 0) {
                        ctx.strokeText(object.text, 0, 0);
                    }
                }
                break;
                
            case 'path':
                if (object.path && object.path.length > 0) {
                    ctx.beginPath();
                    // 简化处理：直接绘制基本路径
                    applyFillAndStroke();
                }
                break;
        }
    }
    
    /**
     * 取消裁切 - 性能优化版
     */
    cancelCrop() {
        console.log('[Crop] 🚫 取消裁切操作');
        this.cleanupCropState();
        // 使用节流渲染，避免阻塞
        this.throttledCropRender();
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
            'freehand': this.modal.querySelector('[data-tool="freehand"]'),
            'crop': this.modal.querySelector('[data-tool="crop"]')
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
        
        this.setupUndoRedoControls();
        
    }
    
    /**
     * 设置Undo/Redo控件
     */
    setupUndoRedoControls() {
        const undoBtn = this.modal.querySelector('#vpe-undo');
        const redoBtn = this.modal.querySelector('#vpe-redo');
        
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undo();
            });
        }
        
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                this.redo();
            });
        }
        
        // 初始化按钮状态
        this.updateUndoRedoButtons();
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
        
        // 🚀 性能优化：切换工具时，如果正在绘制裁切路径，则高效取消
        if (this.isDrawingCrop && toolName !== 'crop') {
            this.cancelCrop();
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
                
            case 'crop':
                this.fabricCanvas.defaultCursor = 'crosshair';
                this.fabricCanvas.hoverCursor = 'crosshair';
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
        
        // 每次缩小20%，最小30%
        this.canvasViewScale = Math.max(this.canvasViewScale / 1.2, 0.3);
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
            zoom = Math.max(zoom * 0.9, 0.3);
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
        
        this.canvasViewScale = Math.max(scale, 0.3); // 最小30%
        this.applyCanvasViewScale();
    }
    
    /**
     * 调度图层面板更新 - 防止频繁调用
     */
    _scheduleLayerPanelUpdate() {
        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout);
        }
        this._updateTimeout = setTimeout(() => {
            this.updateLayerPanel();
        }, 200);
    }
    
    /**
     * 更新图层面板 - 完全基于Fabric.js官方图层管理
     */
    updateLayerPanel() {
        const layersList = this.modal.querySelector('#layers-list');
        if (!layersList) return;
        
        const objects = this.getValidObjects();
        const activeObjects = this.fabricCanvas.getActiveObjects();
        
        // 避免在undo/redo过程中重复更新
        if (this.isPerformingUndoRedo) {
            return;
        }
        
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
            
            // 为图像对象添加尺寸信息
            let sizeInfo = '';
            if (obj.type === 'image') {
                if (obj.originalWidth && obj.originalHeight) {
                    // 有原始尺寸信息，使用原生API获取显示尺寸
                    const bounds = obj.getBoundingRect();
                    const displayWidth = Math.round(bounds.width);
                    const displayHeight = Math.round(bounds.height);
                    sizeInfo = ` (${displayWidth}×${displayHeight}`;
                    if (obj.needsScaling) {
                        sizeInfo += `, 原始: ${obj.originalWidth}×${obj.originalHeight})`;
                    } else {
                        sizeInfo += ')';
                    }
                } else {
                    // 没有原始尺寸信息，使用原生API获取当前尺寸
                    const bounds = obj.getBoundingRect();
                    const displayWidth = Math.round(bounds.width);
                    const displayHeight = Math.round(bounds.height);
                    sizeInfo = ` (${displayWidth}×${displayHeight})`;
                }
            }
            
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
                            ${lockIndicator}${objType}${sizeInfo} (层级: ${actualIndex})
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
        const filteredObjects = this.getValidObjects();
        const targetObject = filteredObjects[index];
        
        if (targetObject) {
            this.fabricCanvas.discardActiveObject(); // 清除之前的选择
            this.fabricCanvas.setActiveObject(targetObject);
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
        const filteredObjects = this.getValidObjects();
        const targetObject = filteredObjects[index];
        
        if (targetObject && !targetObject.isLockIndicator && !targetObject.skipInLayerList) {
            this.fabricCanvas.bringForward(targetObject);
            this.fabricCanvas.renderAll();
            this._scheduleLayerPanelUpdate();
        }
    }
    
    /**
     * 向下移动对象 - Fabric.js官方sendBackwards API
     */
    moveObjectDown(index) {
        const filteredObjects = this.getValidObjects();
        const targetObject = filteredObjects[index];
        
        if (targetObject && !targetObject.isLockIndicator && !targetObject.skipInLayerList) {
            this.fabricCanvas.sendBackwards(targetObject);
            this.fabricCanvas.renderAll();
            this._scheduleLayerPanelUpdate();
        }
    }
    
    /**
     * 按索引删除对象 - Fabric.js官方remove API
     */
    deleteObjectByIndex(index) {
        const filteredObjects = this.getValidObjects();
        const targetObject = filteredObjects[index];
        
        if (targetObject) {
            // 确保不是锁定指示器
            if (targetObject.isLockIndicator || targetObject.skipInLayerList) {
                console.error('❌ 不能删除锁定指示器');
                return;
            }
            
            const objType = targetObject.type;
            this.fabricCanvas.remove(targetObject);
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
     * 获取所有对象 - Fabric.js官方API，使用统一过滤方法
     */
    getAllObjects() {
        return this.getValidObjects();
    }

    /**
     * 选择所有对象 - Fabric.js官方API，使用统一过滤方法
     */
    selectAll() {
        const objects = this.getValidObjects();
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

            // 只使用Delete键删除选中对象，避免与文字输入冲突
            if (e.key === 'Delete') {
                // 检查焦点是否在输入框中
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
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
     * 调度自动保存 - 🚀 优化版本：智能防抖
     */
    _scheduleAutoSave() {
        if (!this.dataManager || !this.autoSaveEnabled) return;
        
        const now = Date.now();
        
        // 🚀 如果距离上次保存时间太近（小于500ms），忽略此次保存
        if (now - this.lastAutoSaveTime < 500) {
            return;
        }
        
        // 清除之前的定时器
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = null;
        }
        
        // 标记有待处理的自动保存
        this.pendingAutoSave = true;
        
        // 🚀 动态调整延迟：如果连续操作，延长延迟时间
        const dynamicDelay = this.pendingAutoSave ? 
            Math.min(this.autoSaveDelay * 2, 8000) : // 最长8秒
            this.autoSaveDelay;
        
        this.autoSaveTimeout = setTimeout(() => {
            this.performAutoSave();
        }, dynamicDelay);
    }
    
    /**
     * 执行自动保存 - 🚀 优化版本：减少频繁保存
     */
    performAutoSave() {
        if (!this.dataManager || !this.fabricCanvas) {
            return;
        }
        
        const now = Date.now();
        
        // 🚀 再次检查保存间隔
        if (now - this.lastAutoSaveTime < 2000) { // 最少间隔2秒
            return;
        }
        
        // 🕵️ 性能诊断：记录开始时间和内存使用
        const startTime = performance.now();
        const objectCount = this.fabricCanvas.getObjects().length;
        const activeObject = this.fabricCanvas.getActiveObject();
        
        // 📊 内存使用监控
        let memoryInfo = null;
        if (performance.memory) {
            memoryInfo = {
                used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
                total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + 'MB',
                limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + 'MB'
            };
        }
        
        console.log(`🔍 [AUTO_SAVE] 开始自动保存 - 对象数量: ${objectCount}, 活动对象: ${activeObject ? activeObject.type + (activeObject.type === 'image' ? '(' + (activeObject.width || 0) + 'x' + (activeObject.height || 0) + ')' : '') : '无'}`);
        if (memoryInfo) {
            console.log(`📊 [MEMORY] 内存使用: ${memoryInfo.used} / ${memoryInfo.total} (限制: ${memoryInfo.limit})`);
        }
        
        try {
            // 🚀 检查画布是否有实际变化
            if (!this._hasCanvasChanged()) {
                console.log(`🔍 [AUTO_SAVE] 画布无变化，跳过保存`);
                return;
            }
            
            // 🚀 异步执行保存，避免阻塞UI
            setTimeout(async () => {
                try {
                    const success = await this.dataManager.saveFabricCanvasDataAsync(this.fabricCanvas);
                    if (success) {
                        this.lastAutoSaveTime = Date.now();
                        this.pendingAutoSave = false;
                        
                        // 🕵️ 性能诊断：记录耗时
                        const endTime = performance.now();
                        const duration = endTime - startTime;
                        
                        console.log(`💾 [AUTO_SAVE] 自动保存成功 - 耗时: ${duration.toFixed(2)}ms`);
                        
                        // ⚠️ 如果保存时间过长，发出警告
                        if (duration > 500) {
                            console.warn(`⚠️ [PERFORMANCE] 自动保存耗时过长: ${duration.toFixed(2)}ms - 可能存在性能问题!`);
                            
                            // 分析可能的性能瓶颈
                            if (objectCount > 10) {
                                console.warn(`🔍 [BOTTLENECK] 检测到大量对象 (${objectCount})，可能导致序列化缓慢`);
                            }
                            
                            if (activeObject && activeObject.type === 'image') {
                                const imgSize = (activeObject.width || 0) * (activeObject.height || 0);
                                if (imgSize > 2000000) { // 大于2百万像素
                                    console.warn(`🔍 [BOTTLENECK] 检测到大尺寸图像 (${activeObject.width || 0}x${activeObject.height || 0} = ${(imgSize/1000000).toFixed(1)}MP)，可能导致序列化缓慢`);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ 异步自动保存失败:', error);
                }
            }, 0);
            
        } catch (error) {
            console.error('❌ 自动保存失败:', error);
        }
    }
    
    /**
     * 🚀 检查画布是否有实际变化
     * 避免没有变化时的无用保存
     */
    _hasCanvasChanged() {
        // 简单实现：检查是否有对象
        // 可以进一步优化为检查对象属性是否真的改变了
        return this.fabricCanvas.getObjects().length > 0;
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
     * 限制对象在画布边界内
     */
    _constrainObjectToBounds(obj) {
        if (!obj || !this.fabricCanvas) return;
        
        const canvasWidth = this.fabricCanvas.width;
        const canvasHeight = this.fabricCanvas.height;
        
        // 获取对象的边界
        const objWidth = obj.width * obj.scaleX;
        const objHeight = obj.height * obj.scaleY;
        
        // 计算边界限制
        const minLeft = -objWidth * 0.5; // 允许对象部分超出画布
        const maxLeft = canvasWidth - objWidth * 0.5;
        const minTop = -objHeight * 0.5;
        const maxTop = canvasHeight - objHeight * 0.5;
        
        // 应用边界限制
        let newLeft = Math.max(minLeft, Math.min(obj.left, maxLeft));
        let newTop = Math.max(minTop, Math.min(obj.top, maxTop));
        
        // 只有位置改变时才更新
        if (newLeft !== obj.left || newTop !== obj.top) {
            obj.set({
                left: newLeft,
                top: newTop
            });
            this.fabricCanvas.renderAll();
            
            console.log(`🎯 [边界约束] 对象位置调整: (${obj.left.toFixed(1)}, ${obj.top.toFixed(1)}) -> (${newLeft.toFixed(1)}, ${newTop.toFixed(1)})`);
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
     * 上传图像到画布 - 带自动缩放功能
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

                // 🚀 一次性设置所有属性，防止fabricId被覆盖
                fabricImage.set({
                    ...defaults, 
                    ...options,
                    originalBase64: imageUrl, // 保存原始base64数据
                    src: imageUrl // 确保src也被设置
                });
                
                // 🔧 修复：重写toObject方法确保属性被序列化
                const originalToObject = fabricImage.toObject.bind(fabricImage);
                fabricImage.toObject = function(propertiesToInclude) {
                    return originalToObject([
                        'fabricId', 'name', 'originalBase64', 'src',
                        ...(propertiesToInclude || [])
                    ]);
                };
                
                // 🎯 通用方法：为所有Fabric对象重写toObject确保自定义属性被序列化
                this._setupFabricObjectSerialization = function(fabricObj) {
                    const originalToObject = fabricObj.toObject.bind(fabricObj);
                    fabricObj.toObject = function(propertiesToInclude) {
                        const baseProps = ['fabricId', 'name'];
                        // 根据对象类型添加特殊属性
                        if (fabricObj.type === 'polygon') {
                            baseProps.push('points');
                        } else if (fabricObj.type === 'path') {
                            baseProps.push('path');
                        }
                        return originalToObject([
                            ...baseProps,
                            ...(propertiesToInclude || [])
                        ]);
                    };
                };
                
                console.log(`[LRPG] 🔖 上传图像fabricId设置: ${defaults.fabricId}`);
                
                // 🔍 调试：验证fabricId是否正确设置
                console.log(`[LRPG] 🔍 验证fabricImage属性:`, {
                    fabricId: fabricImage.fabricId,
                    name: fabricImage.name,
                    originalBase64: fabricImage.originalBase64 ? '存在' : '缺失',
                    src: fabricImage.src ? '存在' : '缺失'
                });

                // 获取原始图像尺寸
                const originalWidth = fabricImage.width;
                const originalHeight = fabricImage.height;
                
                // 计算适合的显示尺寸
                const displaySize = globalImageScalingManager.calculateDisplaySize(
                    originalWidth, 
                    originalHeight
                );
                
                // 存储原始尺寸和缩放信息
                globalImageScalingManager.storeOriginalSize(
                    defaults.fabricId, 
                    originalWidth, 
                    originalHeight
                );
                globalImageScalingManager.storeDisplayScale(
                    defaults.fabricId, 
                    displaySize.scale
                );
                
                // 设置图像的缩放信息
                fabricImage.set({
                    originalWidth: originalWidth,
                    originalHeight: originalHeight,
                    displayScale: displaySize.scale,
                    needsScaling: displaySize.needsScaling
                });

                // 如果没有指定位置，自动居中
                if (!options.left && !options.top) {
                    const canvasWidth = this.fabricCanvas.getWidth();
                    const canvasHeight = this.fabricCanvas.getHeight();
                    
                    // 如果图像需要缩放，使用计算后的显示尺寸
                    if (displaySize.needsScaling) {
                        fabricImage.set({
                            scaleX: displaySize.scale,
                            scaleY: displaySize.scale,
                            left: (canvasWidth - displaySize.displayWidth) / 2,
                            top: (canvasHeight - displaySize.displayHeight) / 2
                        });
                        
                        console.log(`📏 上传图像已自动缩放: ${originalWidth}×${originalHeight} → ${displaySize.displayWidth}×${displaySize.displayHeight} (${Math.round(displaySize.scale * 100)}%)`);
                    } else {
                        // 不需要缩放，使用原始尺寸
                        const maxScale = 0.8; // 最大占画布80%
                        const scaleX = Math.min(maxScale, canvasWidth / originalWidth);
                        const scaleY = Math.min(maxScale, canvasHeight / originalHeight);
                        const scale = Math.min(scaleX, scaleY);

                        fabricImage.set({
                            scaleX: scale,
                            scaleY: scale,
                            left: (canvasWidth - originalWidth * scale) / 2,
                            top: (canvasHeight - originalHeight * scale) / 2
                        });
                    }
                }

                this.fabricCanvas.add(fabricImage);
                this.fabricCanvas.setActiveObject(fabricImage);
                this.fabricCanvas.renderAll();

                // 更新图层面板以显示尺寸信息
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
                activeObject.setCoords();
                this.fabricCanvas.renderAll();
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
            excludeFromExport: true,
            isLockIndicator: true,  // 标记为锁定指示器
            skipInLayerList: true   // 跳过图层列表显示
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
        const allObjects = this.getValidObjects();
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
        const filteredObjects = this.getValidObjects();
        
        // 找到过滤后对象在原始列表中的索引
        const targetObject = filteredObjects[index];
        
        if (!targetObject) {
            console.error('❌ 找不到索引为', index, '的对象');
            return;
        }
        
        // 确保不是锁定指示器
        if (targetObject.isLockIndicator || targetObject.skipInLayerList) {
            console.error('❌ 不能操作锁定指示器');
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
    }
    
    /**
     * 检查对象是否被锁定
     */
    isObjectLocked(object) {
        return object && object.locked === true;
    }
    
    /**
     * 获取过滤后的画布状态 - 统一状态处理逻辑
     */
    getFilteredCanvasState() {
        const canvasData = this.fabricCanvas.toJSON();
        
        // 过滤掉锁定指示器对象
        if (canvasData.objects) {
            canvasData.objects = canvasData.objects.filter(obj => 
                !obj.isLockIndicator && !obj.skipInLayerList
            );
        }
        
        return JSON.stringify(canvasData);
    }
    
    /**
     * 保存当前画布状态到undo栈
     */
    saveState() {
        if (this.isPerformingUndoRedo) return;
        
        try {
            const state = this.getFilteredCanvasState();
            
            // 如果状态与上一个状态相同，不保存
            if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === state) {
                return;
            }
            
            this.undoStack.push(state);
            
            // 限制历史记录大小
            if (this.undoStack.length > this.maxHistorySize) {
                this.undoStack.shift();
            }
            
            // 清空redo栈
            this.redoStack = [];
            
            // 更新按钮状态
            this.updateUndoRedoButtons();
            
        } catch (error) {
            console.error('保存状态失败:', error);
        }
    }
    
    /**
     * 执行undo操作，使用统一状态处理
     */
    undo() {
        if (this.undoStack.length === 0) return;
        
        try {
            // 保存当前状态到redo栈
            const currentState = this.getFilteredCanvasState();
            this.redoStack.push(currentState);
            
            // 恢复上一个状态
            const previousState = this.undoStack.pop();
            this.loadCanvasFromState(previousState);
            
            this.updateUndoRedoButtons();
            
            // 强制图层面板同步
            this.forceLayerPanelSync('undo');
            
        } catch (error) {
            console.error('Undo操作失败:', error);
            this.isPerformingUndoRedo = false;
        }
    }
    
    /**
     * 执行redo操作，使用统一状态处理
     */
    redo() {
        if (this.redoStack.length === 0) return;
        
        try {
            // 保存当前状态到undo栈
            const currentState = this.getFilteredCanvasState();
            this.undoStack.push(currentState);
            
            // 恢复redo状态
            const nextState = this.redoStack.pop();
            this.loadCanvasFromState(nextState);
            
            this.updateUndoRedoButtons();
            
            // 强制图层面板同步
            this.forceLayerPanelSync('redo');
            
        } catch (error) {
            console.error('Redo操作失败:', error);
            this.isPerformingUndoRedo = false;
        }
    }
    
    /**
     * 从JSON状态加载画布
     */
    loadCanvasFromState(stateJson) {
        try {
            // 临时禁用事件监听，避免在清理和加载过程中触发状态保存
            this.isPerformingUndoRedo = true;
            
            // 保存锁定指示器
            const allObjects = this.fabricCanvas.getObjects();
            const lockIndicators = allObjects.filter(obj => obj.isLockIndicator || obj.skipInLayerList);
            
            // 使用Fabric.js的官方loadFromJSON方法，但优化时序
            this.fabricCanvas.loadFromJSON(stateJson, () => {
                // 恢复锁定指示器
                lockIndicators.forEach(indicator => {
                    if (!this.fabricCanvas.getObjects().includes(indicator)) {
                        this.fabricCanvas.add(indicator);
                        this.fabricCanvas.bringToFront(indicator);
                    }
                });
                
                // 渲染画布
                this.fabricCanvas.renderAll();
                
                // 延迟单次更新图层面板
                setTimeout(() => {
                    this.isPerformingUndoRedo = false;
                    this.updateLayerPanel();
                }, 50);
            });
            
        } catch (error) {
            console.error('加载画布状态失败:', error);
            this.isPerformingUndoRedo = false;
        }
    }
    
    /**
     * 更新undo/redo按钮状态
     */
    updateUndoRedoButtons() {
        const undoBtn = this.modal.querySelector('#vpe-undo');
        const redoBtn = this.modal.querySelector('#vpe-redo');
        
        if (undoBtn) {
            const canUndo = this.undoStack.length > 0;
            undoBtn.disabled = !canUndo;
            undoBtn.style.opacity = canUndo ? '1' : '0.5';
            undoBtn.style.cursor = canUndo ? 'pointer' : 'not-allowed';
        }
        
        if (redoBtn) {
            const canRedo = this.redoStack.length > 0;
            redoBtn.disabled = !canRedo;
            redoBtn.style.opacity = canRedo ? '1' : '0.5';
            redoBtn.style.cursor = canRedo ? 'pointer' : 'not-allowed';
        }
    }
    
    /**
     * 初始化画布状态（保存初始状态）
     */
    initializeHistory() {
        // 清空历史记录
        this.undoStack = [];
        this.redoStack = [];
        
        // 延迟保存初始状态，确保画布完全初始化
        setTimeout(() => {
            this.saveState();
            console.log('🔄 Undo/Redo history initialized');
        }, 100);
    }
    
    /**
     * 强制图层面板同步 - 专门用于undo/redo操作
     */
    forceLayerPanelSync(operation) {
        const layersList = this.modal.querySelector('#layers-list');
        if (!layersList) return;
        
        // 立即清空图层面板
        layersList.innerHTML = '<div style="color: #888; padding: 10px;">正在同步...</div>';
        
        // 延迟重建，确保Canvas状态完全更新
        setTimeout(() => {
            const objects = this.getValidObjects();
            
            // 单次重建图层面板
            this.rebuildLayerPanel();
        }, 200);
    }
    
    /**
     * 重建图层面板 - 强制完全重建
     */
    rebuildLayerPanel() {
        const layersList = this.modal.querySelector('#layers-list');
        if (!layersList) return;
        
        // 先清空
        layersList.innerHTML = '';
        
        // 重新获取对象并重建
        const objects = this.getValidObjects();
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
                           obj.type === 'i-text' ? '📝 文字' :
                           obj.type === 'textbox' ? '📄 文本框' :
                           obj.type === 'image' ? '🖼️ 图片' : 
                           '❓ 对象';
            
            const isSelected = activeObjects.includes(obj);
            const isLocked = obj.locked === true;
            
            return `
                <div class="fabric-layer-item" data-index="${actualIndex}" 
                     style="display: flex; align-items: center; padding: 6px; background: ${isSelected ? '#444' : '#333'}; 
                            margin-bottom: 2px; border-radius: 4px; cursor: pointer; border-left: 3px solid ${isSelected ? '#4CAF50' : 'transparent'};">
                    <span style="flex: 1; color: white; font-size: 12px;">${objType} (原始: ${actualIndex})</span>
                    <div style="display: flex; gap: 4px;">
                        <button class="fabric-layer-lock" data-index="${actualIndex}" 
                                style="background: ${isLocked ? '#f44336' : '#4CAF50'}; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;"
                                title="${isLocked ? '解锁图层' : '锁定图层'}">${isLocked ? '🔓' : '🔒'}</button>
                        <button class="fabric-layer-up" data-index="${actualIndex}" 
                                style="background: #2196F3; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;"
                                title="向上移动" ${actualIndex >= objects.length - 1 ? 'disabled' : ''}>↑</button>
                        <button class="fabric-layer-down" data-index="${actualIndex}" 
                                style="background: #FF9800; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;"
                                title="向下移动" ${actualIndex <= 0 ? 'disabled' : ''}>↓</button>
                        <button class="fabric-layer-delete" data-index="${actualIndex}" 
                                style="background: #f44336; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;"
                                title="删除图层">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // 重新绑定事件（先清除之前的事件监听器，避免重复绑定）
        this.unbindLayerPanelEvents();
        this.bindLayerPanelEvents();
    }
    
    /**
     * 销毁管理器 - 清理所有资源
     * 🚀 增强版本：清理所有事件监听器
     */
    destroy() {
        console.log('🧹 Destroying FabricNativeManager...');
        
        // 清理定时器
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
        
        if (this.layerPanelUpdateTimer) {
            clearTimeout(this.layerPanelUpdateTimer);
            this.layerPanelUpdateTimer = null;
        }
        
        // 🚀 清理自动保存定时器
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = null;
        }
        
        // 🚀 清理所有手动添加的事件监听器
        this._cleanupManualEventListeners();
        
        // 清理Fabric画布事件
        if (this.fabricCanvas) {
            // 先清理所有Fabric事件
            this.fabricCanvas.off();
            
            // 清理画布对象
            const objects = this.fabricCanvas.getObjects();
            objects.forEach(obj => {
                if (obj.type === 'image' && obj._element) {
                    obj._element.src = '';
                    obj._element = null;
                }
                obj.canvas = null;
            });
            
            // 清理背景图像
            if (this.fabricCanvas.backgroundImage) {
                if (this.fabricCanvas.backgroundImage._element) {
                    this.fabricCanvas.backgroundImage._element.src = '';
                    this.fabricCanvas.backgroundImage._element = null;
                }
                this.fabricCanvas.backgroundImage = null;
            }
            
            // 清理画布
            this.fabricCanvas.clear();
            this.fabricCanvas.dispose();
            this.fabricCanvas = null;
        }
        
        // 清理其他引用
        this.modal = null;
        this.dataManager = null;
        this.currentTool = null;
        this.drawingMode = null;
        this.isDrawing = false;
        this.polygonPoints = [];
        this.cropRect = null;
        this.history = [];
        this.historyStep = -1;
        this.multiSelectObjects.clear();
        
        console.log('✅ FabricNativeManager destroyed');
    }
    
    /**
     * 🚀 清理所有手动添加的事件监听器
     */
    _cleanupManualEventListeners() {
        // 清理键盘事件
        if (this._keyEventHandlers) {
            document.removeEventListener('keydown', this._keyEventHandlers.handleKeyDown);
            document.removeEventListener('keyup', this._keyEventHandlers.handleKeyUp);
            window.removeEventListener('blur', this._keyEventHandlers.handleBlur);
            this._keyEventHandlers = null;
        }
        
        // 清理画布包装器事件
        if (this.fabricCanvas && this.fabricCanvas.wrapperEl) {
            // 这里无法直接移除，因为使用了匿名函数
            // 需要在创建时使用命名函数或保存引用
        }
        
        // 清理其他UI元素事件
        // 由于大部分使用了匿名函数，需要在创建时保存引用
        // 这是一个临时解决方案，理想情况下应该重构为使用托管的事件监听器
        
        console.log('🧹 Manual event listeners cleanup attempted');
    }
}

/**
 * 创建官方架构管理器实例
 */
export async function createFabricNativeManager(modal, dataManager = null, options = {}) {
    const manager = new FabricNativeManager(modal, dataManager);
    
    // 应用LG Transform选项
    if (options.lgTransformMode) {
        manager.lgTransformMode = true;
        console.log('[LRPG_Transform] 🎨 启用Transform-First模式');
    }
    
    if (options.nodeId) {
        manager.nodeId = options.nodeId;
    }
    
    if (options.initialSize) {
        manager.initialSize = options.initialSize;
    }
    
    // 立即初始化
    await manager.initialize();
    
    // 确保图层面板在管理器完全初始化后更新
    setTimeout(() => {
        manager.updateLayerPanel();
    }, 200);
    
    return manager;
}

// ================================
// LRPG Transform-First 核心架构扩展
// ================================

/**
 * 为FabricNativeManager添加LRPG Transform-First方法
 */
Object.assign(FabricNativeManager.prototype, {
    /**
     * LRPG架构：收集变换数据
     * Transform-First设计的核心 - 只传输轻量级变换元数据
     */
    collectLGTransformData() {
        const layerTransforms = {};
        
        // 收集背景信息
        layerTransforms['background'] = {
            width: this.originalSize.width,
            height: this.originalSize.height
        };
        
        // 收集所有对象的变换数据 - LRPG简化架构
        const objects = this.fabricCanvas.getObjects();
        console.log(`[LRPG_Transform] 📊 画布上总对象数: ${objects.length}`);
        
        // ✅ 调试：检查所有对象的ID情况
        objects.forEach((obj, index) => {
            console.log(`[LRPG_Transform] 对象${index}: type=${obj.type}, id=${obj.id}, fabricId=${obj.fabricId}`);
        });
        
        objects.forEach(obj => {
            if (obj.id) {
                // 使用Fabric.js原生API直接获取变换数据
                const bounds = obj.getBoundingRect();
                const center = obj.getCenterPoint();
                const matrix = obj.calcTransformMatrix();
                
                // 最简化的变换数据收集，避免任何手动计算
                layerTransforms[obj.id] = {
                    // 使用原生API获取的中心点
                    centerX: center.x,
                    centerY: center.y,
                    // 直接使用对象属性
                    scaleX: obj.scaleX || 1,
                    scaleY: obj.scaleY || 1,
                    angle: obj.angle || 0,
                    width: obj.width,
                    height: obj.height,
                    flipX: obj.flipX || false,
                    flipY: obj.flipY || false,
                    // 可选：包含变换矩阵用于精确计算
                    matrix: matrix,
                    // 可选：包含边界框用于布局参考
                    bounds: bounds
                };
                
                console.log(`[LRPG_Transform] 收集图层 ${obj.id}:`, layerTransforms[obj.id]);
            }
        });
        
        return layerTransforms;
    },

    /**
     * LG Tools风格的Transform数据提交
     * 直接提交Transform数据，不需要图像传输
     */
    async submitLGTransformData(transformData) {
        try {
            // ✅ Widget架构：直接保存到annotation_data
            const submitData = {
                layer_transforms: transformData,
                timestamp: Date.now(),
                version: "widget_1.0"
            };
            
            console.log('[Widget] 🚀 保存数据到annotation_data widget:', submitData);
            
            // 查找annotation_data widget
            const annotationWidget = this.node.widgets.find(w => w.name === 'annotation_data');
            if (annotationWidget) {
                // 直接保存到widget
                annotationWidget.value = JSON.stringify(submitData);
                console.log('[Widget] ✅ 数据已保存到annotation_data widget');
                return true;
            } else {
                console.error('[Widget] ❌ 未找到annotation_data widget');
                return false;
            }
        } catch (error) {
            console.error('[Widget] ❌ 保存数据异常:', error);
            return false;
        }
    },

    /**
     * 保存当前变换数据到后端（关闭编辑器时调用）
     * 这是关闭按钮所需的方法
     */
    async saveCurrentTransformsLG() {
        try {
            console.log('[Widget] 🔄 开始收集并保存当前变换数据到annotation_data...');
            
            // 收集当前的变换数据
            const layerTransforms = this.collectLGTransformData();
            
            console.log('[Widget] 📊 收集到的变换数据:', {
                layers: Object.keys(layerTransforms).length,
                data: layerTransforms
            });
            
            // 提交到后端
            const success = await this.submitLGTransformData(layerTransforms);
            
            if (success) {
                this.lastLGState = layerTransforms;
                console.log('[Widget] ✅ 当前变换数据已成功保存到annotation_data');
                return true;
            } else {
                console.error('[Widget] ❌ 变换数据保存失败');
                return false;
            }
        } catch (error) {
            console.error('[Widget] ❌ 保存变换数据异常:', error);
            return false;
        }
    },
    
    /**
     * LG Tools风格：发送Transform-First数据
     * 纯Transform数据传输，不包含图像
     */
    async sendLGCanvasData() {
        if (!this.fabricCanvas || !this.node) {
            console.warn('[LRPG] 发送条件不满足');
            return;
        }

        try {
            console.log('[LRPG] 🚀 开始LG Tools风格数据发送...');
            
            // 收集Transform数据（轻量级元数据）
            const layerTransforms = this.collectLGTransformData();
            
            console.log('[LRPG] 📊 Transform数据大小:', {
                transforms: JSON.stringify(layerTransforms).length,
                total_objects: Object.keys(layerTransforms).length - 1  // 减去background
            });
            
            // 使用LG Tools风格直接提交Transform数据
            const success = await this.submitLGTransformData(layerTransforms);
            
            if (success) {
                // 缓存当前变换状态
                this.lastLGState = layerTransforms;
                console.log('[LRPG] ✅ Transform数据发送完成');
                return true;
            } else {
                console.error('[LRPG] ❌ Transform数据发送失败');
                return false;
            }
            
        } catch (error) {
            console.error('[LRPG] ❌ 数据发送异常:', error);
            return false;
        }
    },

    /**
     * 获取当前用户提示词
     */
    getCurrentUserPrompt() {
        try {
            // 从提示词编辑器获取当前内容
            if (window.visualPromptEditor && window.visualPromptEditor.promptsManager) {
                return window.visualPromptEditor.promptsManager.getLatestPrompt();
            }
            // 备用方式：从DOM元素获取
            const promptTextarea = document.querySelector('#structured-prompt-output');
            if (promptTextarea) {
                return promptTextarea.value || "";
            }
            return "";
        } catch (error) {
            console.warn('[Kontext_Binary] 获取用户提示词失败:', error);
            return "";
        }
    },

    /**
     * LRPG架构：生成主画布图像缓冲区
     * 使用复用的临时Canvas避免内存泄漏
     */
    async generateMainImageBuffer() {
        // 使用复用的临时Canvas
        let tempCanvas = this._lgTempCanvas;
        if (!tempCanvas) {
            tempCanvas = this._lgTempCanvas = document.createElement('canvas');
            console.log('[LRPG_Canvas] 创建LG复用临时Canvas');
        }
        
        tempCanvas.width = this.originalSize.width;
        tempCanvas.height = this.originalSize.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 清空画布
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // 绘制完整画布内容到目标尺寸
        tempCtx.drawImage(
            this.fabricCanvas.lowerCanvasEl,
            0, 0, this.fabricCanvas.lowerCanvasEl.width, this.fabricCanvas.lowerCanvasEl.height,
            0, 0, this.originalSize.width, this.originalSize.height
        );
        
        // 转换为二进制数据
        const imageBlob = await new Promise(resolve => {
            tempCanvas.toBlob(resolve, 'image/png', 1.0);
        });
        
        return await imageBlob.arrayBuffer();
    },

    /**
     * LRPG架构：生成蒙版缓冲区
     */
    async generateLGMaskBuffer() {
        let maskCanvas = this._lgMaskCanvas;
        if (!maskCanvas) {
            maskCanvas = this._lgMaskCanvas = document.createElement('canvas');
            console.log('[LRPG_Canvas] 创建LG蒙版Canvas');
        }
        
        maskCanvas.width = this.originalSize.width;
        maskCanvas.height = this.originalSize.height;
        const maskCtx = maskCanvas.getContext('2d');
        
        // 清空画布
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        // 填充黑色背景
        maskCtx.fillStyle = '#000000';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        // 绘制白色蒙版区域（选中的对象）
        maskCtx.fillStyle = '#ffffff';
        this.fabricCanvas.getObjects().forEach(obj => {
            const bounds = obj.getBoundingRect();
            maskCtx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
        });
        
        const maskBlob = await new Promise(resolve => {
            maskCanvas.toBlob(resolve, 'image/png', 1.0);
        });
        
        return await maskBlob.arrayBuffer();
    },

    /**
     * LRPG架构：检查是否需要发送数据
     * Transform-First优化：只在变换真正改变时才发送
     */
    shouldSendLGData() {
        const currentTransforms = this.collectLGTransformData();
        const currentState = JSON.stringify(currentTransforms);
        const lastState = JSON.stringify(this.lastLGState || {});
        
        if (currentState !== lastState) {
            console.log('[LRPG_Canvas] 🔄 检测到变换数据变化，准备发送');
            return true;
        }
        
        return false;
    },

    /**
     * LRPG架构：自动发送机制
     * 在对象变化时自动触发Transform-First传输
     */
    _scheduleLGDataSend() {
        if (this._lgSendTimeout) {
            clearTimeout(this._lgSendTimeout);
        }
        
        this._lgSendTimeout = setTimeout(() => {
            if (this.shouldSendLGData()) {
                this.sendLGCanvasData();
            }
        }, 500); // 500ms防抖
    },

    /**
     * LRPG架构：初始化Transform-First事件绑定
     */
    initLGTransformTracking() {
        if (!this.fabricCanvas) return;
        
        console.log('[LRPG_Canvas] 🚀 初始化Transform-First事件追踪');
        
        // 🔧 修复：设置WebSocket连接状态
        this.wsConnected = true;
        
        // 🔧 修复：使用命名空间避免事件冲突
        this.fabricCanvas.on('object:modified.lgTransform', () => {
            this._scheduleLGDataSend();
        });
        
        this.fabricCanvas.on('object:added.lgTransform', () => {
            this._scheduleLGDataSend();
        });
        
        this.fabricCanvas.on('object:removed.lgTransform', () => {
            this._scheduleLGDataSend();
        });
        
        // 选择变化时也可以发送
        this.fabricCanvas.on('selection:updated.lgTransform', () => {
            this._scheduleLGDataSend();
        });
        
        this.fabricCanvas.on('selection:created.lgTransform', () => {
            this._scheduleLGDataSend();
        });
    }
});

// 修改原有的初始化流程，集成LRPG Transform-First架构
const originalInitialize = FabricNativeManager.prototype.initialize;
FabricNativeManager.prototype.initialize = async function(modal = null) {
    // 调用原有初始化
    const result = await originalInitialize.call(this, modal);
    
    // 集成LRPG Transform-First架构
    this.initLGTransformTracking();
    
    console.log('[LRPG_Canvas] ✅ Transform-First架构集成完成');
    return result;
};

// 修改清理方法，清理LRPG相关资源
const originalCleanup = FabricNativeManager.prototype.cleanup;
FabricNativeManager.prototype.cleanup = function() {
    console.log('[LRPG_Canvas] 🧹 清理LRPG Transform-First资源...');
    
    // 清理LG专用Canvas
    if (this._lgTempCanvas) {
        this._lgTempCanvas.width = 1;
        this._lgTempCanvas.height = 1;
        this._lgTempCanvas = null;
    }
    if (this._lgMaskCanvas) {
        this._lgMaskCanvas.width = 1;
        this._lgMaskCanvas.height = 1;
        this._lgMaskCanvas = null;
    }
    
    // 清理定时器
    if (this._lgSendTimeout) {
        clearTimeout(this._lgSendTimeout);
        this._lgSendTimeout = null;
    }
    
    // 清理状态缓存
    this.lastLGState = null;
    
    // 调用原有清理
    originalCleanup.call(this);
    
    console.log('[LRPG_Canvas] ✅ LRPG资源清理完成');
};

// ==================== Text Tool Manager (merged from text_tool.js) ====================

/**
 * 文字工具管理器
 * 基于Fabric.js的专业文字标注工具，支持中文和自定义字体
 */
export class TextToolManager {
    constructor(fabricCanvas, modal) {
        this.fabricCanvas = fabricCanvas;
        this.modal = modal;
        
        // 文字工具属性
        this.textColor = '#ff0000';  // 默认红色
        this.fontSize = 24;
        this.fontFamily = 'Arial';
        this.textBold = false;
        this.textItalic = false;
        this.availableFonts = ['Arial', 'Times New Roman', 'SimSun', 'Microsoft YaHei', 'PingFang SC'];
        this.customFonts = new Map(); // 存储用户上传的自定义字体
    }
    
    /**
     * 初始化文字工具
     */
    initialize() {
        this.setupFontUpload();
        this.setupTextControls();
    }
    
    /**
     * 设置字体上传功能
     */
    setupFontUpload() {
        const uploadFontBtn = this.modal.querySelector('#upload-font-btn');
        const fontUploadInput = this.modal.querySelector('#font-upload-input');
        
        if (!uploadFontBtn || !fontUploadInput) {
            console.warn('Font upload elements not found');
            return;
        }
        
        // 点击按钮触发文件选择
        uploadFontBtn.addEventListener('click', () => {
            fontUploadInput.click();
        });
        
        // 字体文件选择处理
        fontUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && this.isValidFontFile(file)) {
                this.loadFontFile(file);
            } else {
                alert('请选择有效的字体文件（.ttf, .otf, .woff, .woff2）');
            }
        });
    }
    
    /**
     * 验证字体文件类型
     */
    isValidFontFile(file) {
        const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
        const fileName = file.name.toLowerCase();
        return validExtensions.some(ext => fileName.endsWith(ext));
    }
    
    /**
     * 加载字体文件
     */
    async loadFontFile(file) {
        try {
            const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');
            const fontUrl = URL.createObjectURL(file);
            const fontFace = new FontFace(fontName, `url(${fontUrl})`);
            
            // 加载字体
            await fontFace.load();
            document.fonts.add(fontFace);
            
            // 存储到自定义字体集合
            this.customFonts.set(fontName, {
                name: fontName,
                url: fontUrl,
                file: file
            });
            
            this.updateFontSelector(fontName);
            alert(`字体 "${fontName}" 上传成功！`);
            
        } catch (error) {
            console.error('Font loading failed:', error);
            alert('字体加载失败，请检查文件格式是否正确');
        }
    }
    
    /**
     * 更新字体选择器
     */
    updateFontSelector(newFontName) {
        const fontSelector = this.modal.querySelector('#font-family-select');
        if (fontSelector) {
            const existingOption = Array.from(fontSelector.options).find(
                option => option.value === newFontName
            );
            
            if (!existingOption) {
                const option = document.createElement('option');
                option.value = newFontName;
                option.textContent = `${newFontName} (自定义)`;
                fontSelector.appendChild(option);
                
                // 自动选择新上传的字体
                fontSelector.value = newFontName;
                this.fontFamily = newFontName;
            }
        }
    }
    
    /**
     * 设置文字工具控件
     */
    setupTextControls() {
        // 字体选择器
        const fontFamilySelect = this.modal.querySelector('#font-family-select');
        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', (e) => {
                this.fontFamily = e.target.value;
                this.updateSelectedTextObjects();
            });
        }
        
        // 字体大小滑块
        const fontSizeSlider = this.modal.querySelector('#font-size-slider');
        const fontSizeDisplay = this.modal.querySelector('#font-size-display');
        if (fontSizeSlider && fontSizeDisplay) {
            fontSizeSlider.addEventListener('input', (e) => {
                this.fontSize = parseInt(e.target.value);
                fontSizeDisplay.textContent = `${this.fontSize}px`;
                this.updateSelectedTextObjects();
            });
        }
        
        // 文字颜色选择器
        const textColorPicker = this.modal.querySelector('#text-color-picker');
        if (textColorPicker) {
            textColorPicker.addEventListener('change', (e) => {
                this.textColor = e.target.value;
                this.updateSelectedTextObjects();
            });
        }
        
        // 粗体按钮
        const textBoldBtn = this.modal.querySelector('#text-bold-btn');
        if (textBoldBtn) {
            textBoldBtn.addEventListener('click', () => {
                this.textBold = !this.textBold;
                textBoldBtn.style.background = this.textBold ? '#4CAF50' : '#555';
                this.updateSelectedTextObjects();
            });
        }
        
        // 斜体按钮
        const textItalicBtn = this.modal.querySelector('#text-italic-btn');
        if (textItalicBtn) {
            textItalicBtn.addEventListener('click', () => {
                this.textItalic = !this.textItalic;
                textItalicBtn.style.background = this.textItalic ? '#4CAF50' : '#555';
                this.updateSelectedTextObjects();
            });
        }
    }
    
    /**
     * 更新选中的文字对象样式
     */
    updateSelectedTextObjects() {
        const activeObjects = this.fabricCanvas.getActiveObjects();
        let updated = false;
        
        activeObjects.forEach(obj => {
            if (obj.type === 'text') {
                obj.set({
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    fill: this.textColor,
                    fontWeight: this.textBold ? 'bold' : 'normal',
                    fontStyle: this.textItalic ? 'italic' : 'normal'
                });
                updated = true;
            }
        });
        
        if (updated) {
            this.fabricCanvas.renderAll();
        }
    }
    
    /**
     * 创建文字对象
     */
    createTextObject(e) {
        if (!window.fabric) {
            console.error('Fabric.js not loaded');
            return null;
        }
        
        const pointer = this.fabricCanvas.getPointer(e.e);
        
        const text = new window.fabric.IText('双击编辑文字', {
            left: pointer.x,
            top: pointer.y,
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            fill: this.textColor,
            fontWeight: this.textBold ? 'bold' : 'normal',
            fontStyle: this.textItalic ? 'italic' : 'normal',
            id: generateId(),
            hasControls: true,
            hasBorders: true,
            editable: true,
            selectable: true,
            lockMovementX: false,
            lockMovementY: false
        });
        
        this.fabricCanvas.add(text);
        this.fabricCanvas.setActiveObject(text);
        this.fabricCanvas.renderAll();
        
        // 立即进入编辑模式（IText支持enterEditing）
        setTimeout(() => {
            if (text && this.fabricCanvas.getActiveObject() === text) {
                text.enterEditing();
                text.selectAll();
            }
        }, 50);
        
        return text;
    }
    
    /**
     * 显示文字工具控制面板
     */
    showTextControlPanel() {
        const textControls = this.modal.querySelector('#text-controls');
        if (textControls) {
            textControls.style.display = 'block';
        }
    }
    
    /**
     * 隐藏文字工具控制面板
     */
    hideTextControlPanel() {
        const textControls = this.modal.querySelector('#text-controls');
        if (textControls) {
            textControls.style.display = 'none';
        }
    }
    
    /**
     * 获取字体属性（供外部调用）
     */
    getTextProperties() {
        return {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            textColor: this.textColor,
            textBold: this.textBold,
            textItalic: this.textItalic
        };
    }
    
    /**
     * 设置字体属性（供外部调用）
     */
    setTextProperties(properties) {
        if (properties.fontFamily) this.fontFamily = properties.fontFamily;
        if (properties.fontSize) this.fontSize = properties.fontSize;
        if (properties.textColor) this.textColor = properties.textColor;
        if (typeof properties.textBold !== 'undefined') this.textBold = properties.textBold;
        if (typeof properties.textItalic !== 'undefined') this.textItalic = properties.textItalic;
        
        this.updateUIControls();
    }
    
    /**
     * 更新UI控件状态
     */
    updateUIControls() {
        const fontFamilySelect = this.modal.querySelector('#font-family-select');
        const fontSizeSlider = this.modal.querySelector('#font-size-slider');
        const fontSizeDisplay = this.modal.querySelector('#font-size-display');
        const textColorPicker = this.modal.querySelector('#text-color-picker');
        const textBoldBtn = this.modal.querySelector('#text-bold-btn');
        const textItalicBtn = this.modal.querySelector('#text-italic-btn');
        
        if (fontFamilySelect) fontFamilySelect.value = this.fontFamily;
        if (fontSizeSlider) fontSizeSlider.value = this.fontSize;
        if (fontSizeDisplay) fontSizeDisplay.textContent = `${this.fontSize}px`;
        if (textColorPicker) textColorPicker.value = this.textColor;
        if (textBoldBtn) textBoldBtn.style.background = this.textBold ? '#4CAF50' : '#555';
        if (textItalicBtn) textItalicBtn.style.background = this.textItalic ? '#4CAF50' : '#555';
    }
    
    /**
     * 清理资源
     */
    cleanup() {
        this.customFonts.forEach(font => {
            if (font.url && font.url.startsWith('blob:')) {
                URL.revokeObjectURL(font.url);
            }
        });
        this.customFonts.clear();
    }
}

/**
 * 创建文字工具管理器
 */
export function createTextToolManager(fabricCanvas, modal) {
    return new TextToolManager(fabricCanvas, modal);
}

/**
 * 获取文字工具管理器实例
 */
export function getTextToolManager(modal) {
    if (!modal._textToolManager) {
        console.warn('Text tool manager not initialized');
        return null;
    }
    return modal._textToolManager;
}

/**
 * 创建画布实例 (LRPG Transform集成使用的别名)
 */
export async function createLRPGCanvas(modal, options = {}) {
    console.log('[LRPG_Transform] 🚀 创建LRPG画布实例 (FabricNativeManager)');
    return await createFabricNativeManager(modal, null, options);
}


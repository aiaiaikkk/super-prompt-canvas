/**
 * 面部工具UI组件
 * 提供面部处理功能的用户界面和交互逻辑
 */

import FaceProcessor, { FaceProcessorPresets } from './face-processor.js';
import DualFaceAlignment, { AlignmentPresets } from './dual-face-alignment.js';

class FaceToolsUI {
    constructor(canvas, container, canvasInstance = null) {
        this.canvas = canvas;  // Fabric canvas
        this.container = container;
        this.canvasInstance = canvasInstance; // KontextCanvas实例引用
        this.node = canvasInstance ? canvasInstance.node : null; // ComfyUI节点引用
        this.faceProcessor = new FaceProcessor();
        this.dualFaceAlignment = new DualFaceAlignment();
        this.isProcessing = false;
        this.currentPreset = 'avatar';
        this.alignmentMode = 'single'; // 'single' or 'dual'
        
        this.loadStyles();
        this.init();
    }

    /**
     * 加载CSS样式
     */
    loadStyles() {
        // 检查是否已经加载了样式
        if (document.querySelector('#face-tools-styles')) {
            return;
        }

        const link = document.createElement('link');
        link.id = 'face-tools-styles';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        // 使用相对路径，基于当前JS文件位置
        const currentScript = document.currentScript || 
            Array.from(document.getElementsByTagName('script')).pop();
        const basePath = currentScript ? currentScript.src.replace(/\/[^\/]*$/, '/') : './';
        link.href = basePath + 'face-tools.css';
        document.head.appendChild(link);
    }

    /**
     * 初始化UI组件
     */
    init() {
        this.createToolbar();
        this.bindEvents();
        this.loadPreferences();
    }

    /**
     * 创建工具栏
     */
    createToolbar() {
        // 创建与图层面板风格一致的面板
        const panel = document.createElement('div');
        panel.className = 'face-tools-panel';
        panel.style.cssText = `
            background: #2a2a2a;
            border-top: 1px solid #444;
            transition: all 0.3s ease;
            overflow: hidden;
            margin-top: 2px;
        `;
        
        panel.innerHTML = this.getPanelHTML();
        
        // 查找图层面板，插入在其后
        const layerPanel = this.container.querySelector('.layer-management-panel');
        if (layerPanel && layerPanel.nextSibling) {
            this.container.insertBefore(panel, layerPanel.nextSibling);
        } else if (layerPanel) {
            layerPanel.parentNode.insertBefore(panel, layerPanel.nextSibling);
        } else {
            this.container.appendChild(panel);
        }
        
        this.toolbar = panel;
        
        // 初始化折叠状态
        this.isPanelExpanded = false;
        
        // 延迟一下确保DOM已经完全加载
        setTimeout(() => {
            this.updatePanelState();
        }, 100);
    }

    /**
     * 获取面板HTML - 与图层面板风格一致
     */
    getPanelHTML() {
        return `
            <!-- 面板头部 - 与图层管理相同的样式 -->
            <div class="face-panel-header" style="
                display: flex;
                align-items: center;
                padding: 8px 12px;
                cursor: pointer;
                user-select: none;
                background: #333;
                border-bottom: 1px solid #444;
            ">
                <span class="toggle-icon" style="
                    color: #888;
                    margin-right: 8px;
                    transition: transform 0.3s ease;
                    display: inline-block;
                    transform: rotate(-90deg);
                ">▼</span>
                
                <span style="
                    color: #fff;
                    font-size: 11px;
                    font-weight: bold;
                ">智能面部处理</span>
                
                <span class="face-mode-indicator" style="
                    color: #888;
                    font-size: 10px;
                    margin-left: auto;
                ">单图处理</span>
            </div>
            
            <!-- 面板内容容器 -->
            <div class="face-panel-container" style="
                max-height: 0;
                overflow: hidden;
                background: #1a1a1a;
                transition: max-height 0.3s ease;
            ">
                <div class="face-panel-content" style="padding: 8px; font-size: 11px;">
                <!-- 对齐模式选择 -->
                <div class="toolbar-section" style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #333;">
                    <label style="font-size: 10px; color: #888; margin-bottom: 4px; display: block;">对齐模式:</label>
                    <div class="mode-toggle" style="display: flex; gap: 8px;">
                        <label for="single-mode" style="flex: 1; padding: 4px 8px; background: #007bff; color: white; border-radius: 3px; text-align: center; cursor: pointer; font-size: 10px; transition: all 0.2s;">
                            <input type="radio" id="single-mode" name="alignment-mode" value="single" checked style="display: none;">
                            单图处理
                        </label>
                        <label for="dual-mode" style="flex: 1; padding: 4px 8px; background: #2a2a2a; color: #888; border-radius: 3px; text-align: center; cursor: pointer; font-size: 10px; transition: all 0.2s;">
                            <input type="radio" id="dual-mode" name="alignment-mode" value="dual" style="display: none;">
                            双脸对齐
                        </label>
                    </div>
                </div>

                <!-- 单图处理模式 -->
                <div class="toolbar-section" id="single-mode-section" style="margin-bottom: 8px;">
                    <label style="font-size: 10px; color: #888; margin-bottom: 4px; display: block;">处理模式:</label>
                    <select id="face-preset" title="选择预设处理模式" style="width: 100%; padding: 4px; font-size: 10px; background: #333; border: 1px solid #444; color: #fff; border-radius: 3px; margin-bottom: 6px;">
                        <option value="avatar">头像模式</option>
                        <option value="portrait">肖像模式</option>
                        <option value="idPhoto">证件照模式</option>
                        <option value="artistic">艺术模式</option>
                        <option value="custom">自定义</option>
                    </select>
                    
                    <div class="button-group" style="display: flex; gap: 4px;">
                        <button id="auto-face-crop" class="mini-btn" title="自动裁切" style="flex: 1; padding: 4px; font-size: 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            裁切
                        </button>
                        <button id="auto-face-align" class="mini-btn" title="面部对齐" style="flex: 1; padding: 4px; font-size: 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            对齐
                        </button>
                        <button id="face-analyze" class="mini-btn" title="分析" style="flex: 1; padding: 4px; font-size: 10px; background: #6c757d; color: white; border: none; border-radius: 3px; cursor: pointer;">
                            分析
                        </button>
                    </div>
                </div>

                <!-- 双脸对齐模式 -->
                <div class="toolbar-section" id="dual-mode-section" style="display: none; margin-bottom: 6px;">
                    <label style="font-size: 10px; color: #888; margin-bottom: 3px; display: block;">换脸预处理:</label>
                    <div class="dual-alignment-controls">
                        <!-- 状态显示行 -->
                        <div class="face-status" style="display: flex; justify-content: space-between; font-size: 9px; color: #6c757d; margin-bottom: 4px;">
                            <span id="reference-status">参考脸: 未设置</span>
                            <span id="source-status">源脸: 未设置</span>
                        </div>
                        
                        <!-- 设置和预设行 -->
                        <div style="display: flex; gap: 4px; margin-bottom: 4px;">
                            <button id="set-reference-face" class="mini-btn" title="设置参考脸" style="flex: 1; padding: 3px 6px; font-size: 9px; background: #6c757d; color: white; border: none; border-radius: 2px; cursor: pointer;">
                                参考脸
                            </button>
                            <button id="set-source-face" class="mini-btn" title="设置源脸" style="flex: 1; padding: 3px 6px; font-size: 9px; background: #6c757d; color: white; border: none; border-radius: 2px; cursor: pointer;">
                                源脸
                            </button>
                            <select id="alignment-preset" title="预设" style="flex: 1; padding: 3px; font-size: 9px; background: #333; border: 1px solid #444; color: #fff; border-radius: 2px;">
                                <option value="precise">精确</option>
                                <option value="conservative">保守</option>
                                <option value="angleOnly">角度</option>
                                <option value="sizeOnly">尺寸</option>
                            </select>
                        </div>
                        
                        <!-- 操作按钮行 -->
                        <div class="alignment-actions" style="display: flex; gap: 4px;">
                            <button id="perform-dual-alignment" class="mini-btn" title="执行对齐" disabled style="flex: 2; padding: 4px; font-size: 10px; background: #28a745; color: white; border: none; border-radius: 2px; cursor: pointer; opacity: 0.5;">
                                执行对齐
                            </button>
                            <button id="get-matching-score" class="mini-btn" title="匹配度" disabled style="flex: 1; padding: 4px; font-size: 9px; background: #17a2b8; color: white; border: none; border-radius: 2px; cursor: pointer; opacity: 0.5;">
                                匹配度
                            </button>
                            <button id="reset-alignment" class="mini-btn" title="重置" style="flex: 1; padding: 4px; font-size: 9px; background: #dc3545; color: white; border: none; border-radius: 2px; cursor: pointer;">
                                重置
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 手动微调控制 -->
                <div class="toolbar-section" id="manual-adjustment-section" style="display: none; margin-bottom: 6px;">
                    <label style="font-size: 10px; color: #888; margin-bottom: 3px; display: block;">手动微调:</label>
                    <div class="adjustment-controls">
                        <!-- 旋转和缩放行 -->
                        <div style="display: flex; gap: 8px; margin-bottom: 3px; align-items: center;">
                            <div style="flex: 1; display: flex; align-items: center; gap: 4px;">
                                <span style="font-size: 8px; color: #6c757d; min-width: 24px;">旋转</span>
                                <input type="range" id="rotation-adjust" min="-45" max="45" value="0" step="1" style="flex: 1; height: 3px;">
                                <span id="rotation-value" style="font-size: 8px; color: #6c757d; min-width: 20px;">0°</span>
                            </div>
                            <div style="flex: 1; display: flex; align-items: center; gap: 4px;">
                                <span style="font-size: 8px; color: #6c757d; min-width: 24px;">缩放</span>
                                <input type="range" id="scale-adjust" min="-50" max="50" value="0" step="1" style="flex: 1; height: 3px;">
                                <span id="scale-value" style="font-size: 8px; color: #6c757d; min-width: 20px;">0%</span>
                            </div>
                        </div>
                        
                        <!-- 水平和垂直位移行 -->
                        <div style="display: flex; gap: 8px; margin-bottom: 4px; align-items: center;">
                            <div style="flex: 1; display: flex; align-items: center; gap: 4px;">
                                <span style="font-size: 8px; color: #6c757d; min-width: 24px;">水平</span>
                                <input type="range" id="offset-x-adjust" min="-100" max="100" value="0" step="1" style="flex: 1; height: 3px;">
                                <span id="offset-x-value" style="font-size: 8px; color: #6c757d; min-width: 26px;">0px</span>
                            </div>
                            <div style="flex: 1; display: flex; align-items: center; gap: 4px;">
                                <span style="font-size: 8px; color: #6c757d; min-width: 24px;">垂直</span>
                                <input type="range" id="offset-y-adjust" min="-100" max="100" value="0" step="1" style="flex: 1; height: 3px;">
                                <span id="offset-y-value" style="font-size: 8px; color: #6c757d; min-width: 26px;">0px</span>
                            </div>
                        </div>
                        
                        <!-- 操作按钮行 -->
                        <div style="display: flex; gap: 4px;">
                            <button id="apply-manual-adjustment" class="mini-btn" style="flex: 2; padding: 3px; font-size: 9px; background: #28a745; color: white; border: none; border-radius: 2px; cursor: pointer;">
                                应用微调
                            </button>
                            <button id="reset-adjustment" class="mini-btn" style="flex: 1; padding: 3px; font-size: 9px; background: #dc3545; color: white; border: none; border-radius: 2px; cursor: pointer;">
                                重置
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 高级设置 -->
                <div class="toolbar-section advanced-settings" id="advanced-settings" style="display: none; margin-bottom: 6px;">
                    <label style="font-size: 10px; color: #888; margin-bottom: 3px; display: block;">高级设置:</label>
                    
                    <!-- 裁切边距行 -->
                    <div style="display: flex; gap: 6px; margin-bottom: 3px; align-items: center;">
                        <div style="flex: 1; display: flex; align-items: center; gap: 3px;">
                            <span style="font-size: 8px; color: #6c757d; min-width: 28px;">裁切边距</span>
                            <input type="range" id="crop-padding" min="0" max="50" value="20" step="1" style="flex: 1; height: 3px;">
                            <span id="padding-value" style="font-size: 8px; color: #6c757d; min-width: 24px;">20%</span>
                        </div>
                    </div>
                    
                    <!-- 面部尺寸行 -->
                    <div style="display: flex; gap: 6px; margin-bottom: 3px; align-items: center;">
                        <div style="flex: 1; display: flex; align-items: center; gap: 3px;">
                            <span style="font-size: 8px; color: #6c757d; min-width: 28px;">面部尺寸</span>
                            <input type="range" id="min-face-size" min="100" max="500" value="150" step="10" style="flex: 1; height: 3px;">
                            <span id="size-value" style="font-size: 8px; color: #6c757d; min-width: 32px;">150px</span>
                        </div>
                    </div>
                    
                    <!-- 输出质量行 -->
                    <div style="display: flex; gap: 6px; margin-bottom: 4px; align-items: center;">
                        <div style="flex: 1; display: flex; align-items: center; gap: 3px;">
                            <span style="font-size: 8px; color: #6c757d; min-width: 28px;">输出质量</span>
                            <input type="range" id="output-quality" min="50" max="100" value="90" step="5" style="flex: 1; height: 3px;">
                            <span id="quality-value" style="font-size: 8px; color: #6c757d; min-width: 24px;">90%</span>
                        </div>
                    </div>
                </div>

                <!-- 批量处理和高级设置 -->
                <div style="display: flex; gap: 4px; margin-bottom: 4px;">
                    <button id="batch-process" class="mini-btn" title="批量处理多个图像" style="flex: 1; padding: 3px; font-size: 9px; background: #6c757d; color: white; border: none; border-radius: 2px; cursor: pointer;">
                        批量处理
                    </button>
                    <button id="toggle-advanced" class="mini-btn" title="显示/隐藏高级设置" style="flex: 1; padding: 3px; font-size: 9px; background: #17a2b8; color: white; border: none; border-radius: 2px; cursor: pointer;">
                        高级设置
                    </button>
                </div>

                <!-- 处理状态 -->
                <div class="toolbar-section status-section" id="status-section" style="display: none;">
                    <div class="processing-indicator">
                        <div class="spinner"></div>
                        <span id="status-text">处理中...</span>
                    </div>
                    <div class="progress-bar" id="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                </div>
                </div>
            </div>
        `;
    }

    /**
     * 更新面板折叠状态
     */
    updatePanelState() {
        const toggleIcon = this.toolbar.querySelector('.toggle-icon');
        const panelContainer = this.toolbar.querySelector('.face-panel-container');
        const modeIndicator = this.toolbar.querySelector('.face-mode-indicator');
        
        if (this.isPanelExpanded) {
            toggleIcon.style.transform = 'rotate(0deg)';
            panelContainer.style.maxHeight = '380px';
            panelContainer.style.overflow = 'visible';
        } else {
            toggleIcon.style.transform = 'rotate(-90deg)';
            panelContainer.style.maxHeight = '0';
            panelContainer.style.overflow = 'hidden';
        }
        
        // 更新模式指示器
        if (modeIndicator) {
            modeIndicator.textContent = this.alignmentMode === 'dual' ? '双脸对齐' : '单图处理';
        }
        
        // 更新节点大小 - 参考图层面板的实现
        this.updateNodeSize();
    }
    
    /**
     * 更新节点大小以适应面板变化
     */
    updateNodeSize() {
        if (!this.node) return;
        
        // 强制更新节点的size属性
        if (this.node.computeSize) {
            const newSize = this.node.computeSize();
            this.node.size = newSize;
            console.log(`[Face Tools] 更新节点大小: [${newSize[0]}, ${newSize[1]}]`);
        }
        
        // 确保节点立即刷新
        if (this.node.graph) {
            this.node.graph.setDirtyCanvas(true, true);
            // 触发图形重新布局
            if (this.node.graph.change) {
                this.node.graph.change();
            }
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        const toolbar = this.toolbar;

        // 绑定面板头部点击事件 - 折叠/展开
        const panelHeader = toolbar.querySelector('.face-panel-header');
        if (panelHeader) {
            panelHeader.addEventListener('click', () => {
                this.isPanelExpanded = !this.isPanelExpanded;
                this.updatePanelState();
                // 通知画布更新节点高度
                if (this.canvasInstance && this.canvasInstance.updateNodeSizeForFacePanel) {
                    this.canvasInstance.updateNodeSizeForFacePanel(this.isPanelExpanded);
                }
            });
        }

        // 对齐模式切换
        toolbar.querySelectorAll('input[name="alignment-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.switchAlignmentMode(e.target.value);
            });
        });

        // 预设选择
        toolbar.querySelector('#face-preset').addEventListener('change', (e) => {
            this.applyPreset(e.target.value);
        });

        // 主要功能按钮
        toolbar.querySelector('#auto-face-crop').addEventListener('click', () => {
            this.performFaceCrop();
        });

        toolbar.querySelector('#auto-face-align').addEventListener('click', () => {
            this.performFaceAlign();
        });

        toolbar.querySelector('#face-analyze').addEventListener('click', () => {
            this.performFaceAnalysis();
        });

        // 批量处理
        toolbar.querySelector('#batch-process').addEventListener('click', () => {
            this.performBatchProcess();
        });

        // 高级设置切换
        toolbar.querySelector('#toggle-advanced').addEventListener('click', () => {
            this.toggleAdvancedSettings();
        });

        // 双脸对齐事件
        this.bindDualAlignmentEvents(toolbar);

        // 滑块事件
        this.bindSliderEvents(toolbar);

        // 键盘快捷键
        this.bindKeyboardShortcuts();
    }

    /**
     * 绑定滑块事件
     */
    bindSliderEvents(toolbar) {
        const sliders = [
            { id: 'crop-padding', display: 'padding-value', suffix: '%' },
            { id: 'min-face-size', display: 'size-value', suffix: 'px' },
            { id: 'output-quality', display: 'quality-value', suffix: '%' }
        ];

        sliders.forEach(({ id, display, suffix }) => {
            const slider = toolbar.querySelector(`#${id}`);
            const valueDisplay = toolbar.querySelector(`#${display}`);
            
            slider.addEventListener('input', (e) => {
                valueDisplay.textContent = e.target.value + suffix;
                this.onSettingChange();
            });
        });
    }

    /**
     * 绑定键盘快捷键
     */
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'j': // Ctrl+J 智能裁切
                        e.preventDefault();
                        this.performFaceCrop();
                        break;
                    case 'k': // Ctrl+K 面部对齐
                        e.preventDefault();
                        this.performFaceAlign();
                        break;
                    case 'i': // Ctrl+I 面部分析
                        e.preventDefault();
                        this.performFaceAnalysis();
                        break;
                }
            }
        });
    }

    /**
     * 切换工具栏显示状态
     */
    toggleToolbar() {
        const content = this.toolbar.querySelector('#face-toolbar-content');
        const toggleBtn = this.toolbar.querySelector('#toggle-face-tools i');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggleBtn.className = 'fas fa-chevron-up';
        } else {
            content.style.display = 'none';
            toggleBtn.className = 'fas fa-chevron-down';
        }
    }

    /**
     * 应用预设配置
     */
    applyPreset(presetName) {
        this.currentPreset = presetName;
        
        if (presetName === 'custom') {
            this.showAdvancedSettings();
            return;
        }

        const preset = FaceProcessorPresets[presetName];
        if (!preset) return;

        // 更新UI控件值
        this.updateSliderValue('crop-padding', preset.cropPadding * 100);
        this.updateSliderValue('min-face-size', preset.minFaceSize);
        this.updateSliderValue('output-quality', preset.quality * 100);

        this.savePreferences();
    }

    /**
     * 更新滑块值
     */
    updateSliderValue(id, value) {
        const slider = this.toolbar.querySelector(`#${id}`);
        const suffix = id === 'crop-padding' || id === 'output-quality' ? '%' : 'px';
        
        slider.value = value;
        slider.dispatchEvent(new Event('input'));
    }

    /**
     * 执行面部裁切
     */
    async performFaceCrop() {
        if (this.isProcessing) return;

        const activeObject = this.canvas.getActiveObject();
        if (!activeObject || activeObject.type !== 'image') {
            this.showMessage('请先选择一个图像对象', 'warning');
            return;
        }

        try {
            this.setProcessingState(true, '正在检测面部...');
            
            const options = this.getCurrentOptions();
            const imageUrl = this.getImageUrl(activeObject);
            
            const result = await this.faceProcessor.autoFaceCrop(imageUrl, options);
            
            await this.replaceCanvasImage(activeObject, result);
            this.showMessage('面部裁切完成', 'success');
            
        } catch (error) {
            console.error('Face crop error:', error);
            this.showMessage(`裁切失败: ${error.message}`, 'error');
        } finally {
            this.setProcessingState(false);
        }
    }

    /**
     * 执行面部对齐
     */
    async performFaceAlign() {
        if (this.isProcessing) return;

        const activeObject = this.canvas.getActiveObject();
        if (!activeObject || activeObject.type !== 'image') {
            this.showMessage('请先选择一个图像对象', 'warning');
            return;
        }

        try {
            this.setProcessingState(true, '正在分析面部关键点...');
            
            const options = this.getCurrentOptions();
            const imageUrl = this.getImageUrl(activeObject);
            
            const result = await this.faceProcessor.autoFaceAlign(imageUrl, options);
            
            await this.replaceCanvasImage(activeObject, result);
            this.showMessage('面部对齐完成', 'success');
            
        } catch (error) {
            console.error('Face align error:', error);
            this.showMessage(`对齐失败: ${error.message}`, 'error');
        } finally {
            this.setProcessingState(false);
        }
    }

    /**
     * 执行面部分析
     */
    async performFaceAnalysis() {
        if (this.isProcessing) return;

        const activeObject = this.canvas.getActiveObject();
        if (!activeObject || activeObject.type !== 'image') {
            this.showMessage('请先选择一个图像对象', 'warning');
            return;
        }

        try {
            this.setProcessingState(true, '正在分析面部特征...');
            
            const imageUrl = this.getImageUrl(activeObject);
            const analysis = await this.faceProcessor.analyzeFace(imageUrl);
            
            this.showAnalysisResults(analysis);
            
        } catch (error) {
            console.error('Face analysis error:', error);
            this.showMessage(`分析失败: ${error.message}`, 'error');
        } finally {
            this.setProcessingState(false);
        }
    }

    /**
     * 执行批量处理
     */
    async performBatchProcess() {
        const images = this.canvas.getObjects().filter(obj => obj.type === 'image');
        
        if (images.length === 0) {
            this.showMessage('画布中没有图像对象', 'warning');
            return;
        }

        const operation = await this.showBatchDialog();
        if (!operation) return;

        try {
            this.setProcessingState(true, `正在批量处理 ${images.length} 个图像...`);
            
            const imageUrls = images.map(img => this.getImageUrl(img));
            const options = this.getCurrentOptions();
            
            const results = await this.faceProcessor.batchProcess(imageUrls, operation, options);
            
            // 替换成功处理的图像
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                if (result.success) {
                    await this.replaceCanvasImage(images[result.index], result.data);
                    this.updateProgress((i + 1) / results.length * 100);
                }
            }
            
            const successCount = results.filter(r => r.success).length;
            this.showMessage(`批量处理完成: ${successCount}/${results.length} 成功`, 'success');
            
        } catch (error) {
            console.error('Batch process error:', error);
            this.showMessage(`批量处理失败: ${error.message}`, 'error');
        } finally {
            this.setProcessingState(false);
        }
    }

    /**
     * 绑定双脸对齐事件
     */
    bindDualAlignmentEvents(toolbar) {
        // 设置参考脸
        toolbar.querySelector('#set-reference-face').addEventListener('click', () => {
            this.setReferenceFace();
        });

        // 设置源脸
        toolbar.querySelector('#set-source-face').addEventListener('click', () => {
            this.setSourceFace();
        });

        // 执行双脸对齐
        toolbar.querySelector('#perform-dual-alignment').addEventListener('click', () => {
            this.performDualAlignment();
        });

        // 获取匹配度
        toolbar.querySelector('#get-matching-score').addEventListener('click', () => {
            this.showMatchingScore();
        });

        // 重置对齐
        toolbar.querySelector('#reset-alignment').addEventListener('click', () => {
            this.resetAlignment();
        });

        // 手动微调事件
        this.bindManualAdjustmentEvents(toolbar);
    }

    /**
     * 绑定手动微调事件
     */
    bindManualAdjustmentEvents(toolbar) {
        // 微调滑块
        const adjustmentSliders = [
            { id: 'rotation-adjust', display: 'rotation-value', suffix: '°' },
            { id: 'scale-adjust', display: 'scale-value', suffix: '%' },
            { id: 'offset-x-adjust', display: 'offset-x-value', suffix: 'px' },
            { id: 'offset-y-adjust', display: 'offset-y-value', suffix: 'px' }
        ];

        adjustmentSliders.forEach(({ id, display, suffix }) => {
            const slider = toolbar.querySelector(`#${id}`);
            const valueDisplay = toolbar.querySelector(`#${display}`);
            
            if (slider && valueDisplay) {
                slider.addEventListener('input', (e) => {
                    valueDisplay.textContent = e.target.value + suffix;
                });
            }
        });

        // 应用微调
        toolbar.querySelector('#apply-manual-adjustment').addEventListener('click', () => {
            this.applyManualAdjustment();
        });

        // 重置微调
        toolbar.querySelector('#reset-adjustment').addEventListener('click', () => {
            this.resetManualAdjustment();
        });
    }

    /**
     * 切换对齐模式
     */
    switchAlignmentMode(mode) {
        this.alignmentMode = mode;
        
        const singleSection = this.toolbar.querySelector('#single-mode-section');
        const dualSection = this.toolbar.querySelector('#dual-mode-section');
        const manualSection = this.toolbar.querySelector('#manual-adjustment-section');
        
        // 更新模式标签样式
        const singleLabel = this.toolbar.querySelector('label[for="single-mode"]');
        const dualLabel = this.toolbar.querySelector('label[for="dual-mode"]');
        
        if (mode === 'single') {
            singleSection.style.display = 'block';
            dualSection.style.display = 'none';
            manualSection.style.display = 'none';
            
            // 更新标签样式
            if (singleLabel) {
                singleLabel.style.background = '#007bff';
                singleLabel.style.color = 'white';
            }
            if (dualLabel) {
                dualLabel.style.background = '#2a2a2a';
                dualLabel.style.color = '#888';
            }
        } else {
            singleSection.style.display = 'none';
            dualSection.style.display = 'block';
            
            // 更新标签样式
            if (singleLabel) {
                singleLabel.style.background = '#2a2a2a';
                singleLabel.style.color = '#888';
            }
            if (dualLabel) {
                dualLabel.style.background = '#007bff';
                dualLabel.style.color = 'white';
            }
        }
        
        // 更新面板状态指示器
        this.updatePanelState();
        
        console.log(`切换到${mode === 'single' ? '单图处理' : '双脸对齐'}模式`);
    }

    /**
     * 设置参考脸（背景图）
     */
    async setReferenceFace() {
        const activeObject = this.canvas.getActiveObject();
        if (!activeObject || activeObject.type !== 'image') {
            this.showMessage('请先选择背景图像', 'warning');
            return;
        }

        try {
            this.setProcessingState(true, '检测背景图人脸...');
            
            const result = await this.dualFaceAlignment.setReferenceFace(activeObject);
            
            this.showMessage(`参考脸设置成功 (置信度: ${Math.round(result.confidence * 100)}%)`, 'success');
            this.updateDualAlignmentButtons();
            this.updateStatusDisplay();
            
        } catch (error) {
            console.error('设置参考脸失败:', error);
            this.showMessage(`设置失败: ${error.message}`, 'error');
        } finally {
            this.setProcessingState(false);
        }
    }

    /**
     * 设置源脸（前景图）
     */
    async setSourceFace() {
        const activeObject = this.canvas.getActiveObject();
        if (!activeObject || activeObject.type !== 'image') {
            this.showMessage('请先选择前景图像', 'warning');
            return;
        }

        try {
            this.setProcessingState(true, '检测前景图人脸...');
            
            const result = await this.dualFaceAlignment.setSourceFace(activeObject);
            
            this.showMessage(`源脸设置成功 (置信度: ${Math.round(result.confidence * 100)}%)`, 'success');
            this.updateDualAlignmentButtons();
            this.updateStatusDisplay();
            
        } catch (error) {
            console.error('设置源脸失败:', error);
            this.showMessage(`设置失败: ${error.message}`, 'error');
        } finally {
            this.setProcessingState(false);
        }
    }

    /**
     * 执行双脸对齐
     */
    async performDualAlignment() {
        if (!this.dualFaceAlignment.referenceFace || !this.dualFaceAlignment.sourceFace) {
            this.showMessage('请先设置参考脸和源脸', 'warning');
            return;
        }

        try {
            this.setProcessingState(true, '计算对齐参数...');
            
            // 获取对齐预设
            const presetName = this.toolbar.querySelector('#alignment-preset').value;
            const preset = AlignmentPresets[presetName];
            
            // 执行对齐
            const result = await this.dualFaceAlignment.performAlignment(preset);
            
            // 更新画布
            this.canvas.renderAll();
            
            // 显示手动微调控制
            this.toolbar.querySelector('#manual-adjustment-section').style.display = 'block';
            
            this.showMessage('双脸对齐完成', 'success');
            
        } catch (error) {
            console.error('双脸对齐失败:', error);
            this.showMessage(`对齐失败: ${error.message}`, 'error');
        } finally {
            this.setProcessingState(false);
        }
    }

    /**
     * 显示匹配度评分
     */
    showMatchingScore() {
        try {
            const score = this.dualFaceAlignment.getMatchingScore();
            
            if (!score) {
                this.showMessage('请先设置两个人脸', 'warning');
                return;
            }
            
            const modal = this.createScoreModal(score);
            document.body.appendChild(modal);
            modal.style.display = 'block';
            
            modal.querySelector('.close-btn').onclick = () => {
                modal.remove();
            };
            
        } catch (error) {
            console.error('获取匹配度失败:', error);
            this.showMessage(`获取匹配度失败: ${error.message}`, 'error');
        }
    }

    /**
     * 应用手动微调
     */
    applyManualAdjustment() {
        try {
            const adjustments = {
                rotationDelta: parseFloat(this.toolbar.querySelector('#rotation-adjust').value),
                scaleDelta: parseFloat(this.toolbar.querySelector('#scale-adjust').value) / 100,
                offsetXDelta: parseFloat(this.toolbar.querySelector('#offset-x-adjust').value),
                offsetYDelta: parseFloat(this.toolbar.querySelector('#offset-y-adjust').value)
            };
            
            this.dualFaceAlignment.manualAdjust(adjustments);
            this.canvas.renderAll();
            
            this.showMessage('微调已应用', 'success');
            
        } catch (error) {
            console.error('应用微调失败:', error);
            this.showMessage(`微调失败: ${error.message}`, 'error');
        }
    }

    /**
     * 重置手动微调
     */
    resetManualAdjustment() {
        // 重置滑块值
        this.toolbar.querySelector('#rotation-adjust').value = 0;
        this.toolbar.querySelector('#scale-adjust').value = 0;
        this.toolbar.querySelector('#offset-x-adjust').value = 0;
        this.toolbar.querySelector('#offset-y-adjust').value = 0;
        
        // 更新显示
        this.toolbar.querySelector('#rotation-value').textContent = '0°';
        this.toolbar.querySelector('#scale-value').textContent = '0%';
        this.toolbar.querySelector('#offset-x-value').textContent = '0px';
        this.toolbar.querySelector('#offset-y-value').textContent = '0px';
        
        // 重置对齐数据
        this.dualFaceAlignment.resetAlignment();
        
        // 隐藏手动微调面板
        this.toolbar.querySelector('#manual-adjustment-section').style.display = 'none';
        
        this.showMessage('已重置对齐', 'info');
    }

    /**
     * 更新状态显示
     */
    updateStatusDisplay() {
        const refStatus = this.toolbar.querySelector('#reference-status');
        const srcStatus = this.toolbar.querySelector('#source-status');
        
        if (refStatus) {
            refStatus.innerHTML = this.dualFaceAlignment.referenceFace 
                ? '<span class="status-indicator status-success"></span>参考脸: 已设置'
                : '<span class="status-indicator status-error"></span>参考脸: 未设置';
        }
        
        if (srcStatus) {
            srcStatus.innerHTML = this.dualFaceAlignment.sourceFace
                ? '<span class="status-indicator status-success"></span>源脸: 已设置'
                : '<span class="status-indicator status-error"></span>源脸: 未设置';
        }
    }

    /**
     * 重置对齐设置
     */
    resetAlignment() {
        this.dualFaceAlignment.reset();
        this.updateDualAlignmentButtons();
        this.updateStatusDisplay();
        this.toolbar.querySelector('#manual-adjustment-section').style.display = 'none';
        this.showMessage('对齐设置已重置', 'info');
    }

    /**
     * 更新双脸对齐按钮状态
     */
    updateDualAlignmentButtons() {
        const hasReference = !!this.dualFaceAlignment.referenceFace;
        const hasSource = !!this.dualFaceAlignment.sourceFace;
        const canAlign = hasReference && hasSource;
        
        const performBtn = this.toolbar.querySelector('#perform-dual-alignment');
        const scoreBtn = this.toolbar.querySelector('#get-matching-score');
        
        performBtn.disabled = !canAlign;
        scoreBtn.disabled = !canAlign;
        
        // 更新样式
        performBtn.style.opacity = canAlign ? '1' : '0.5';
        performBtn.style.cursor = canAlign ? 'pointer' : 'not-allowed';
        scoreBtn.style.opacity = canAlign ? '1' : '0.5';
        scoreBtn.style.cursor = canAlign ? 'pointer' : 'not-allowed';
        
        // 更新按钮文本提示
        if (hasReference && hasSource) {
            performBtn.title = '执行双脸对齐';
        } else if (!hasReference) {
            performBtn.title = '请先设置参考脸';
        } else if (!hasSource) {
            performBtn.title = '请先设置源脸';
        }
        
        // 更新按钮颜色以显示状态
        const refBtn = this.toolbar.querySelector('#set-reference-face');
        const srcBtn = this.toolbar.querySelector('#set-source-face');
        
        if (refBtn) {
            refBtn.style.background = hasReference ? '#28a745' : '#6c757d';
        }
        if (srcBtn) {
            srcBtn.style.background = hasSource ? '#28a745' : '#6c757d';
        }
    }

    /**
     * 创建匹配度评分模态框
     */
    createScoreModal(score) {
        const modal = document.createElement('div');
        modal.className = 'face-analysis-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>人脸匹配度评分</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <label>综合评分:</label>
                            <span style="font-size: 24px; color: ${this.getScoreColor(score.overall)}">${score.overall}/100</span>
                        </div>
                        <div class="analysis-item">
                            <label>角度匹配:</label>
                            <span>${score.angle}/100</span>
                        </div>
                        <div class="analysis-item">
                            <label>尺寸匹配:</label>
                            <span>${score.size}/100</span>
                        </div>
                        <div class="analysis-item full-width">
                            <label>建议:</label>
                            <span>${score.recommendation}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    /**
     * 根据评分获取颜色
     */
    getScoreColor(score) {
        if (score >= 80) return '#28a745';
        if (score >= 60) return '#ffc107';
        return '#dc3545';
    }

    // ==================== 辅助方法 ====================

    /**
     * 获取当前配置选项
     */
    getCurrentOptions() {
        return {
            cropPadding: this.toolbar.querySelector('#crop-padding').value / 100,
            minFaceSize: parseInt(this.toolbar.querySelector('#min-face-size').value),
            quality: this.toolbar.querySelector('#output-quality').value / 100,
            outputFormat: 'dataurl'
        };
    }

    /**
     * 获取图像URL
     */
    getImageUrl(imageObject) {
        return imageObject.getSrc ? imageObject.getSrc() : imageObject._element.src;
    }

    /**
     * 替换画布中的图像
     */
    async replaceCanvasImage(oldObject, newImageData) {
        return new Promise((resolve) => {
            const { fabric } = window;
            fabric.Image.fromURL(newImageData, (newImg) => {
                // 保持原有的位置和变换
                newImg.set({
                    left: oldObject.left,
                    top: oldObject.top,
                    scaleX: oldObject.scaleX,
                    scaleY: oldObject.scaleY,
                    angle: oldObject.angle
                });
                
                this.canvas.remove(oldObject);
                this.canvas.add(newImg);
                this.canvas.setActiveObject(newImg);
                this.canvas.renderAll();
                resolve();
            });
        });
    }

    /**
     * 设置处理状态
     */
    setProcessingState(isProcessing, statusText = '') {
        this.isProcessing = isProcessing;
        const statusSection = this.toolbar.querySelector('#status-section');
        const statusTextEl = this.toolbar.querySelector('#status-text');
        
        if (isProcessing) {
            statusSection.style.display = 'block';
            statusTextEl.textContent = statusText;
            this.disableButtons(true);
        } else {
            statusSection.style.display = 'none';
            this.disableButtons(false);
            this.updateProgress(0);
        }
    }

    /**
     * 更新进度条
     */
    updateProgress(percentage) {
        const progressFill = this.toolbar.querySelector('#progress-fill');
        progressFill.style.width = `${percentage}%`;
    }

    /**
     * 禁用/启用按钮
     */
    disableButtons(disabled) {
        const buttons = this.toolbar.querySelectorAll('button:not(#toggle-face-tools)');
        buttons.forEach(btn => btn.disabled = disabled);
    }

    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        // 简单的消息显示，可以集成现有的通知系统
        const messageEl = document.createElement('div');
        messageEl.className = `face-message face-message-${type}`;
        messageEl.textContent = message;
        
        this.toolbar.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    /**
     * 显示分析结果
     */
    showAnalysisResults(analysis) {
        const modal = this.createAnalysisModal(analysis);
        document.body.appendChild(modal);
        
        // 简单的模态框显示
        modal.style.display = 'block';
        
        // 点击关闭
        modal.querySelector('.close-btn').onclick = () => {
            modal.remove();
        };
    }

    /**
     * 创建分析结果模态框
     */
    createAnalysisModal(analysis) {
        const modal = document.createElement('div');
        modal.className = 'face-analysis-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>面部分析结果</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    ${this.formatAnalysisData(analysis)}
                </div>
            </div>
        `;
        return modal;
    }

    /**
     * 格式化分析数据
     */
    formatAnalysisData(analysis) {
        if (!analysis.hasFace) {
            return '<p>未检测到人脸</p>';
        }

        const { analysis: data, confidence } = analysis;
        return `
            <div class="analysis-grid">
                <div class="analysis-item">
                    <label>检测置信度:</label>
                    <span>${Math.round(confidence * 100)}%</span>
                </div>
                <div class="analysis-item">
                    <label>人脸尺寸:</label>
                    <span>${data.faceSize.width} × ${data.faceSize.height}px</span>
                </div>
                <div class="analysis-item">
                    <label>面部角度:</label>
                    <span>${Math.round(data.faceAngle)}°</span>
                </div>
                <div class="analysis-item">
                    <label>双眼距离:</label>
                    <span>${Math.round(data.eyeDistance)}px</span>
                </div>
                <div class="analysis-item">
                    <label>质量评分:</label>
                    <span>${data.qualityScore.score}/100</span>
                </div>
                <div class="analysis-item full-width">
                    <label>建议:</label>
                    <span>${data.recommendedCrop.reason}</span>
                </div>
            </div>
        `;
    }

    /**
     * 显示批量处理对话框
     */
    async showBatchDialog() {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'batch-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <h3>批量处理选项</h3>
                    <div class="option-group">
                        <input type="radio" id="batch-crop" name="batch-operation" value="crop" checked>
                        <label for="batch-crop">仅裁切</label>
                    </div>
                    <div class="option-group">
                        <input type="radio" id="batch-align" name="batch-operation" value="align">
                        <label for="batch-align">仅对齐</label>
                    </div>
                    <div class="option-group">
                        <input type="radio" id="batch-both" name="batch-operation" value="both">
                        <label for="batch-both">裁切+对齐</label>
                    </div>
                    <div class="dialog-buttons">
                        <button id="batch-confirm">确定</button>
                        <button id="batch-cancel">取消</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            dialog.querySelector('#batch-confirm').onclick = () => {
                const operation = dialog.querySelector('input[name="batch-operation"]:checked').value;
                dialog.remove();
                resolve(operation);
            };
            
            dialog.querySelector('#batch-cancel').onclick = () => {
                dialog.remove();
                resolve(null);
            };
        });
    }

    /**
     * 切换高级设置显示
     */
    toggleAdvancedSettings() {
        const advancedSettings = this.toolbar.querySelector('#advanced-settings');
        const isHidden = advancedSettings.style.display === 'none';
        
        advancedSettings.style.display = isHidden ? 'block' : 'none';
    }

    /**
     * 显示高级设置
     */
    showAdvancedSettings() {
        const advancedSettings = this.toolbar.querySelector('#advanced-settings');
        advancedSettings.style.display = 'block';
    }

    /**
     * 设置改变时触发
     */
    onSettingChange() {
        // 设置为自定义模式
        this.toolbar.querySelector('#face-preset').value = 'custom';
        this.savePreferences();
    }

    /**
     * 保存用户偏好
     */
    savePreferences() {
        const preferences = {
            preset: this.currentPreset,
            cropPadding: this.toolbar.querySelector('#crop-padding').value,
            minFaceSize: this.toolbar.querySelector('#min-face-size').value,
            outputQuality: this.toolbar.querySelector('#output-quality').value
        };
        
        localStorage.setItem('faceToolsPreferences', JSON.stringify(preferences));
    }

    /**
     * 加载用户偏好
     */
    loadPreferences() {
        try {
            const preferences = JSON.parse(localStorage.getItem('faceToolsPreferences') || '{}');
            
            if (preferences.preset) {
                this.toolbar.querySelector('#face-preset').value = preferences.preset;
                this.applyPreset(preferences.preset);
            }
        } catch (error) {
            console.warn('Failed to load face tools preferences:', error);
        }
    }

    /**
     * 销毁组件
     */
    destroy() {
        if (this.toolbar) {
            this.toolbar.remove();
        }
        this.faceProcessor = null;
    }
}

export default FaceToolsUI;
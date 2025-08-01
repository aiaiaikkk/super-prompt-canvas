/**
 * Visual Prompt Editor - 事件处理系统模块
 * 负责各种UI事件的绑定和处理，包括下拉框、文件上传、基础界面事件等
 */

import { addManagedEventListener } from './visual_prompt_editor_cleanup.js';

export class EventHandlers {
    constructor(nodeInstance) {
        this.nodeInstance = nodeInstance;
    }

    /**
     * 绑定下拉框事件（用于恢复状态）
     */
    bindDropdownEventsForRestore(modal) {
        const dropdown = modal.querySelector('#layer-dropdown');
        const dropdownMenu = modal.querySelector('#layer-dropdown-menu');
        const dropdownArrow = modal.querySelector('#dropdown-arrow');
        
        if (!dropdown || !dropdownMenu || !dropdownArrow) {
            return;
        }
        
        addManagedEventListener(dropdown, 'click', (e) => {
            e.preventDefault();
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
        
        // 点击页面其他地方关闭下拉框 - 使用管理的事件监听器
        addManagedEventListener(document, 'click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdownMenu.style.display = 'none';
                dropdownArrow.style.transform = 'rotate(0deg)';
            }
        });
        
    }

    /**
     * 绑定下拉框选项事件
     */
    bindDropdownOptionsEvents(modal) {
        
        const dropdownOptions = modal.querySelector('#dropdown-options');
        if (!dropdownOptions) {
            return;
        }

        // 为所有选项绑定悬停和点击事件
        const options = dropdownOptions.querySelectorAll('.dropdown-option');
        options.forEach(option => {
            // 悬停效果
            option.addEventListener('mouseenter', function() {
                this.style.background = '#3b82f6';
            });
            option.addEventListener('mouseleave', function() {
                this.style.background = '#2b2b2b';
            });
            
            // 复选框变化事件
            const checkbox = option.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    const annotationId = checkbox.dataset.annotationId;
                    this.updateObjectSelection(modal, annotationId, checkbox.checked);
                });
            }
            
            // 点击选项事件
            option.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = option.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                }
            });
        });
        
    }

    /**
     * 绑定主下拉框事件
     */
    bindMainDropdownEvents(modal) {
        
        const dropdown = modal.querySelector('#layer-dropdown');
        const dropdownMenu = modal.querySelector('#layer-dropdown-menu');
        const dropdownArrow = modal.querySelector('#dropdown-arrow');
        
        if (!dropdown || !dropdownMenu || !dropdownArrow) {
            return;
        }
        
        dropdown.addEventListener('click', (e) => {
            e.preventDefault();
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
        
        // 点击其他地方关闭下拉框
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdownMenu.style.display = 'none';
                dropdownArrow.style.transform = 'rotate(0deg)';
            }
        });
    }

    /**
     * 绑定文件上传事件
     */
    bindFileUploadEvents(modal) {
        
        const fileInput = modal.querySelector('#layer-image-upload');
        if (!fileInput) {
            return;
        }
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageUpload(modal, file);
            } else {
            }
        });
        
    }

    /**
     * 处理图片上传
     */
    handleImageUpload(modal, file) {
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // 这里可以添加图片处理逻辑
            if (this.nodeInstance.processUploadedImage) {
                this.nodeInstance.processUploadedImage(modal, imageData, file.name);
            }
        };
        
        reader.onerror = () => {
            console.error('Image reading failed');
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * 绑定图层管理切换事件
     */
    bindLayerManagementToggleEvents(modal) {
        
        const enableLayerManagement = modal.querySelector('#enable-layer-management');
        if (!enableLayerManagement) {
            return;
        }
        
        enableLayerManagement.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            
            if (this.nodeInstance.toggleConnectedLayersDisplay) {
                this.nodeInstance.toggleConnectedLayersDisplay(modal, enabled);
            }
            
            this.updateLayerManagementUI(modal, enabled);
        });
        
    }

    /**
     * 更新图层管理UI状态
     */
    updateLayerManagementUI(modal, enabled) {
        const layerControls = modal.querySelector('#layer-controls');
        const layersList = modal.querySelector('#layers-list');
        
        if (layerControls) {
            layerControls.style.display = enabled ? 'block' : 'none';
        }
        
        if (layersList) {
            layersList.style.opacity = enabled ? '1' : '0.5';
        }
        
    }

    /**
     * 绑定基础界面事件
     */
    bindBasicEvents(modal) {
        
        this.bindCloseAndSaveButtons(modal);
        
        this.bindOperationTypeEvents(modal);
        
        this.bindDrawingToolEvents(modal);
        
        this.bindLayerManagementEvents(modal);
        
        this.bindLayerPanelButtons(modal);
        
        this.bindCanvasSizeEvents(modal);
        
        this.bindFileUploadEvents(modal);
        this.bindLayerManagementToggleEvents(modal);
        this.bindMainDropdownEvents(modal);
        
    }

    /**
     * 绑定图层管理事件
     */
    bindLayerManagementEvents(modal) {
        
        // 延迟绑定，确保DOM准备就绪
        setTimeout(() => {
            try {
                this.bindLayerOrderEvents(modal);
                
                this.bindLayerVisibilityEvents(modal);
                
                
            } catch (error) {
                console.error('Layer management event binding failed:', error);
            }
        }, 150); // 比主文件中的延迟稍长一些
    }

    /**
     * 绑定图层顺序调整事件
     */
    bindLayerOrderEvents(modal) {
        try {
        } catch (error) {
            console.error('Layer order event binding failed:', error);
        }
    }

    /**
     * 绑定图层可见性事件
     */
    bindLayerVisibilityEvents(modal) {
        try {
        } catch (error) {
            console.error('Layer visibility event binding failed:', error);
        }
    }


    bindFileUploadEvents(modal) {
        
        const fileInput = modal.querySelector('#layer-image-upload');
        if (!fileInput) {
            return;
        }
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageUpload(modal, file);
            } else {
            }
        });
        
    }

    /**
     * 处理图片上传
     */
    handleImageUpload(modal, file) {
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // 这里可以添加图片处理逻辑
            if (this.nodeInstance.processUploadedImage) {
                this.nodeInstance.processUploadedImage(modal, imageData, file.name);
            }
        };
        
        reader.onerror = () => {
            console.error('Image reading failed');
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * 绑定图层管理切换事件
     */
    bindLayerManagementToggleEvents(modal) {
        
        const enableLayerManagement = modal.querySelector('#enable-layer-management');
        if (!enableLayerManagement) {
            return;
        }
        
        enableLayerManagement.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            
            if (this.nodeInstance.toggleConnectedLayersDisplay) {
                this.nodeInstance.toggleConnectedLayersDisplay(modal, enabled);
            }
            
            this.updateLayerManagementUI(modal, enabled);
        });
        
    }

    /**
     * 更新图层管理UI状态
     */
    updateLayerManagementUI(modal, enabled) {
        const layerControls = modal.querySelector('#layer-controls');
        const layersList = modal.querySelector('#layers-list');
        
        if (layerControls) {
            layerControls.style.display = enabled ? 'block' : 'none';
        }
        
        if (layersList) {
            layersList.style.opacity = enabled ? '1' : '0.5';
        }
        
    }

    /**
     * 绑定基础界面事件
     */
    bindBasicEvents(modal) {
        
        this.bindCloseAndSaveButtons(modal);
        
        this.bindOperationTypeEvents(modal);
        
        this.bindDrawingToolEvents(modal);
        
        this.bindLayerManagementEvents(modal);
        
        this.bindLayerPanelButtons(modal);
        
        this.bindCanvasSizeEvents(modal);
        
        this.bindFileUploadEvents(modal);
        this.bindLayerManagementToggleEvents(modal);
        this.bindMainDropdownEvents(modal);
        
    }

    /**
     * 绑定图层管理事件
     */
    bindLayerManagementEvents(modal) {
        
        // 延迟绑定，确保DOM准备就绪
        setTimeout(() => {
            try {
                this.bindLayerOrderEvents(modal);
                
                this.bindLayerVisibilityEvents(modal);
                
                
            } catch (error) {
                console.error('Layer management event binding failed:', error);
            }
        }, 150); // 比主文件中的延迟稍长一些
    }

    /**
     * 绑定图层顺序调整事件
     */
    bindLayerOrderEvents(modal) {
        try {
        } catch (error) {
            console.error('Layer order event binding failed:', error);
        }
    }

    /**
     * 绑定图层可见性事件
     */
    bindLayerVisibilityEvents(modal) {
        try {
        } catch (error) {
            console.error('Layer visibility event binding failed:', error);
        }
    }


    bindFileUploadEvents(modal) {
        
        const fileInput = modal.querySelector('#layer-image-upload');
        if (!fileInput) {
            return;
        }
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageUpload(modal, file);
            } else {
            }
        });
        
    }

    /**
     * 处理图片上传
     */
    handleImageUpload(modal, file) {
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // 这里可以添加图片处理逻辑
            if (this.nodeInstance.processUploadedImage) {
                this.nodeInstance.processUploadedImage(modal, imageData, file.name);
            }
        };
        
        reader.onerror = () => {
            console.error('Image reading failed');
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * 绑定图层管理切换事件
     */
    bindLayerManagementToggleEvents(modal) {
        
        const enableLayerManagement = modal.querySelector('#enable-layer-management');
        if (!enableLayerManagement) {
            return;
        }
        
        enableLayerManagement.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            
            if (this.nodeInstance.toggleConnectedLayersDisplay) {
                this.nodeInstance.toggleConnectedLayersDisplay(modal, enabled);
            }
            
            this.updateLayerManagementUI(modal, enabled);
        });
        
    }

    /**
     * 更新图层管理UI状态
     */
    updateLayerManagementUI(modal, enabled) {
        const layerControls = modal.querySelector('#layer-controls');
        const layersList = modal.querySelector('#layers-list');
        
        if (layerControls) {
            layerControls.style.display = enabled ? 'block' : 'none';
        }
        
        if (layersList) {
            layersList.style.opacity = enabled ? '1' : '0.5';
        }
        
    }

    /**
     * 绑定基础界面事件
     */
    bindBasicEvents(modal) {
        
        this.bindCloseAndSaveButtons(modal);
        
        this.bindOperationTypeEvents(modal);
        
        this.bindDrawingToolEvents(modal);
        
        this.bindLayerManagementEvents(modal);
        
        this.bindLayerPanelButtons(modal);
        
        this.bindCanvasSizeEvents(modal);
        
        this.bindFileUploadEvents(modal);
        this.bindLayerManagementToggleEvents(modal);
        this.bindMainDropdownEvents(modal);
        
    }

    /**
     * 绑定图层管理事件
     */
    bindLayerManagementEvents(modal) {
        
        // 延迟绑定，确保DOM准备就绪
        setTimeout(() => {
            try {
                this.bindLayerOrderEvents(modal);
                
                this.bindLayerVisibilityEvents(modal);
                
                
            } catch (error) {
                console.error('Layer management event binding failed:', error);
            }
        }, 150); // 比主文件中的延迟稍长一些
    }

    /**
     * 绑定图层顺序调整事件
     */
    bindLayerOrderEvents(modal) {
        try {
        } catch (error) {
            console.error('Layer order event binding failed:', error);
        }
    }

    /**
     * 绑定图层可见性事件
     */
    bindLayerVisibilityEvents(modal) {
        try {
        } catch (error) {
            console.error('Layer visibility event binding failed:', error);
        }
    }

    /**
     * 绑定绘制工具事件
     */
    bindDrawingToolEvents(modal) {
        this.bindColorSelector(modal);
        
        this.bindFillToggleButton(modal);
        
        this.bindOpacitySlider(modal);
        
        this.bindClearButton(modal);
        
        this.bindToolSelector(modal);
        
        this.bindImageUploadButton(modal);
    }

    /**
     * 绑定颜色选择器
     */
    bindColorSelector(modal) {
        const colorButtons = modal.querySelectorAll('.vpe-color');
        colorButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                
                modal.currentColor = color;
                
                colorButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // 如果使用Fabric.js系统，更新Fabric画布的颜色
                if (window.fabricManager && window.fabricManager.setColor) {
                    window.fabricManager.setColor(color);
                }
            });
        });
        
        if (colorButtons.length > 0) {
            modal.currentColor = '#ff0000';
            colorButtons[0].classList.add('active');
        }
    }

    /**
     * 绑定填充/轮廓切换按钮
     */
    bindFillToggleButton(modal) {
        const fillToggle = modal.querySelector('#vpe-fill-toggle');
        if (fillToggle) {
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
                
                if (window.fabricManager && window.fabricManager.setFillMode) {
                    window.fabricManager.setFillMode(modal.fillMode);
                }
            });
        }
    }

    /**
     * 绑定不透明度滑块
     */
    bindOpacitySlider(modal) {
        const opacitySlider = modal.querySelector('#vpe-opacity-slider');
        const opacityValue = modal.querySelector('#vpe-opacity-value');
        
        if (opacitySlider && opacityValue) {
            modal.currentOpacity = parseInt(opacitySlider.value) || 50;
            
            opacitySlider.addEventListener('input', () => {
                const opacityPercent = parseInt(opacitySlider.value);
                modal.currentOpacity = opacityPercent;
                opacityValue.textContent = opacityPercent + '%';
                
                if (window.fabricManager && window.fabricManager.setOpacity) {
                    window.fabricManager.setOpacity(opacityPercent / 100);
                }
            });
        }
    }

    /**
     * 绑定清空按钮（移除了undo功能）
     */
    bindClearButton(modal) {
        const clearBtn = modal.querySelector('#vpe-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllAnnotations(modal);
            });
        }
    }

    /**
     * 清空所有标注
     */
    clearAllAnnotations(modal) {
        // 尝试多种方式找到Fabric管理器
        const fabricManager = window.fabricManager || 
                             (window.currentVPEInstance && window.currentVPEInstance.fabricManager) ||
                             (window.currentVPENode && window.currentVPENode.fabricManager) ||
                             (this.nodeInstance && this.nodeInstance.fabricManager);
        
        if (fabricManager && fabricManager.clear) {
            fabricManager.clear();
            return;
        }
        
        // 如果没有找到Fabric管理器，尝试直接清空Fabric画布
        if (window.fabric && modal) {
            const canvasElement = modal.querySelector('#fabric-official-canvas');
            if (canvasElement) {
                const fabricCanvas = canvasElement.__fabricCanvas || window.__fabricCanvas;
                if (fabricCanvas) {
                    fabricCanvas.clear();
                    fabricCanvas.backgroundColor = '#ffffff';
                    fabricCanvas.renderAll();
                    return;
                }
            }
        }
        
        // 清空传统数据
        if (modal.annotations) {
            modal.annotations = [];
        }
        
    }

    /**
     * 绑定工具选择器
     */
    bindToolSelector(modal) {
        const toolButtons = modal.querySelectorAll('.vpe-tool');
        toolButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tool = e.target.dataset.tool;
                this.setActiveTool(modal, tool);
            });
        });
    }

    /**
     * 设置活动工具
     */
    setActiveTool(modal, tool) {
        modal.currentTool = tool;
        
        if (window.fabricManager && window.fabricManager.setTool) {
            window.fabricManager.setTool(tool);
        }
        
        const toolButtons = modal.querySelectorAll('.vpe-tool');
        toolButtons.forEach(btn => {
            if (btn.dataset.tool === tool) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * 绑定操作类型选择器事件
     */
    bindOperationTypeEvents(modal) {
        const operationSelect = modal.querySelector('#current-layer-operation');
        if (operationSelect) {
            operationSelect.addEventListener('change', (e) => {
                // 操作类型变化处理
            });
        }
    }

    /**
     * 绑定关闭和保存按钮事件
     */
    bindCloseAndSaveButtons(modal) {
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
                // 保存逻辑
            };
        }
    }

    /**
     * 绑定图层面板按钮事件
     */
    bindLayerPanelButtons(modal) {
        const clearSelectionBtn = modal.querySelector('#clear-selection');
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => {
                this.clearAllAnnotations(modal);
            });
        }

        const selectAllBtn = modal.querySelector('#select-all-layers');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.selectAllFabricObjects(modal);
            });
        }
    }

    /**
     * 选择所有Fabric对象 - 使用官方API
     */
    selectAllFabricObjects(modal) {
        // 尝试找到Fabric管理器
        const fabricManager = window.fabricManager || 
                             (window.currentVPEInstance && window.currentVPEInstance.fabricManager) ||
                             (window.currentVPENode && window.currentVPENode.fabricManager) ||
                             (this.nodeInstance && this.nodeInstance.fabricManager);

        if (fabricManager && fabricManager.selectAll) {
            fabricManager.selectAll();
        } else if (fabricManager && fabricManager.fabricCanvas) {
            // 备用：直接使用Fabric.js官方API
            const fabricCanvas = fabricManager.fabricCanvas;
            const objects = fabricCanvas.getObjects();
            
            if (objects.length > 0) {
                const selection = new fabric.ActiveSelection(objects, {
                    canvas: fabricCanvas
                });
                fabricCanvas.setActiveObject(selection);
                fabricCanvas.renderAll();
            } else {
            }
        } else {
        }
    }

    /**
     * 绑定画布尺寸控制事件
     */
    bindCanvasSizeEvents(modal) {
        const canvasSizeSelect = modal.querySelector('#vpe-canvas-size');
        const customSizeControls = modal.querySelector('#vpe-custom-size-controls');
        const canvasWidthInput = modal.querySelector('#vpe-canvas-width');
        const canvasHeightInput = modal.querySelector('#vpe-canvas-height');
        const applySizeBtn = modal.querySelector('#vpe-apply-size');

        if (canvasSizeSelect) {
            canvasSizeSelect.addEventListener('change', (e) => {
                const selectedValue = e.target.value;
                
                if (selectedValue === 'custom') {
                    // 显示自定义尺寸控件
                    if (customSizeControls) {
                        customSizeControls.style.display = 'flex';
                    }
                } else {
                    // 隐藏自定义尺寸控件
                    if (customSizeControls) {
                        customSizeControls.style.display = 'none';
                    }
                    
                    // 应用预设尺寸
                    if (selectedValue !== 'custom') {
                        const [width, height] = selectedValue.split('x').map(Number);
                        this.applyCanvasSize(modal, width, height);
                    }
                }
            });
        }

        if (applySizeBtn) {
            applySizeBtn.addEventListener('click', () => {
                const width = parseInt(canvasWidthInput?.value || 800);
                const height = parseInt(canvasHeightInput?.value || 600);
                
                // 验证尺寸范围
                if (width >= 200 && width <= 2048 && height >= 200 && height <= 2048) {
                    this.applyCanvasSize(modal, width, height);
                } else {
                    alert('Canvas size must be between 200x200 and 2048x2048 pixels');
                }
            });
        }

        [canvasWidthInput, canvasHeightInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        applySizeBtn?.click();
                    }
                });
            }
        });
    }

    /**
     * 应用画布尺寸
     */
    applyCanvasSize(modal, width, height) {
        try {
            const fabricManager = this.getFabricManager();
            if (fabricManager && fabricManager.setCanvasSize) {
                fabricManager.setCanvasSize(width, height);
            }

            // 同步到后端节点
            this.syncCanvasSizeToBackend(width, height);

            // 显示成功提示
            
            // 可选：显示用户友好的通知
            this.showCanvasSizeNotification(width, height);

        } catch (error) {
            console.error('❌ Failed to apply canvas size:', error);
            alert('Failed to apply canvas size. Please try again.');
        }
    }

    /**
     * 获取Fabric管理器
     */
    getFabricManager() {
        return window.fabricManager || 
               (window.currentVPEInstance && window.currentVPEInstance.fabricManager) ||
               (window.currentVPENode && window.currentVPENode.fabricManager) ||
               (this.nodeInstance && this.nodeInstance.fabricManager);
    }

    /**
     * 同步画布尺寸到后端节点
     */
    syncCanvasSizeToBackend(width, height) {
        try {
            if (this.nodeInstance && this.nodeInstance.widgets) {
                // 查找canvas_width和canvas_height widgets
                const widthWidget = this.nodeInstance.widgets.find(w => w.name === 'canvas_width');
                const heightWidget = this.nodeInstance.widgets.find(w => w.name === 'canvas_height');

                if (widthWidget) {
                    widthWidget.value = width;
                }

                if (heightWidget) {
                    heightWidget.value = height;
                }

                // 触发节点更新
                if (this.nodeInstance.setDirtyCanvas) {
                    this.nodeInstance.setDirtyCanvas(true, true);
                }
            }
        } catch (error) {
            console.error('❌ Failed to sync canvas size to backend:', error);
        }
    }

    /**
     * 显示画布尺寸更改通知
     */
    showCanvasSizeNotification(width, height) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 30000;
            background: #4CAF50; color: white; padding: 12px 20px;
            border-radius: 6px; font-size: 14px; font-weight: 500;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
            opacity: 0; transition: all 0.3s ease;
        `;
        notification.textContent = `✅ Canvas size updated: ${width}×${height}`;

        document.body.appendChild(notification);

        // 动画显示
        setTimeout(() => notification.style.opacity = '1', 10);

        // 3秒后自动移除
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    /**
     * 绑定图片上传按钮事件
     */
    bindImageUploadButton(modal) {
        const uploadBtn = modal.querySelector('#vpe-upload-btn');
        const fileInput = modal.querySelector('#vpe-image-upload');

        if (uploadBtn && fileInput) {
            // 点击按钮触发文件选择
            uploadBtn.addEventListener('click', () => {
                fileInput.click();
            });

            // 文件选择事件
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.handleToolbarImageUpload(modal, file);
                    // 清空input，允许重复选择同一文件
                    fileInput.value = '';
                } else if (file) {
                    alert('Please select a valid image file.');
                }
            });
        }
    }

    /**
     * 处理工具栏图片上传
     */
    handleToolbarImageUpload(modal, file) {
        try {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imageUrl = e.target.result;
                
                const fabricManager = this.getFabricManager();
                if (fabricManager && fabricManager.uploadImageToCanvas) {
                    fabricManager.uploadImageToCanvas(imageUrl, {
                        name: file.name || 'Uploaded Image'
                    });
                    
                    
                    // 显示成功提示
                    this.showImageUploadNotification(file.name);
                } else {
                    console.error('❌ Fabric管理器不可用，无法上传图片');
                    alert('Canvas not ready. Please try again.');
                }
            };
            
            reader.onerror = () => {
                console.error('❌ 读取图片文件失败');
                alert('Failed to read image file.');
            };
            
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('❌ 处理图片上传失败:', error);
            alert('Failed to upload image. Please try again.');
        }
    }

    /**
     * 显示图片上传成功通知
     */
    showImageUploadNotification(fileName) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 30000;
            background: #FF9800; color: white; padding: 12px 20px;
            border-radius: 6px; font-size: 14px; font-weight: 500;
            box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
            opacity: 0; transition: all 0.3s ease;
        `;
        notification.textContent = `📁 Image uploaded: ${fileName}`;

        document.body.appendChild(notification);

        // 动画显示
        setTimeout(() => notification.style.opacity = '1', 10);

        // 3秒后自动移除
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
}

// 导出创建函数
export function createEventHandlers(nodeInstance) {
    return new EventHandlers(nodeInstance);
}

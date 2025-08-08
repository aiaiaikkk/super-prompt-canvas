/**
 * Visual Prompt Editor - 事件处理系统模块
 * 负责各种UI事件的绑定和处理，包括下拉框、文件上传、基础界面事件等
 */

import { addManagedEventListener, performModalCleanup, addManagedTimeout } from './visual_prompt_editor_cleanup.js';
import { saveEditingDataToBackend, collectCurrentEditingData } from './visual_prompt_editor_data_manager.js';
import { globalMemoryManager } from './visual_prompt_editor_utils.js';

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
            // 悬停效果 - 使用管理的事件监听器
            addManagedEventListener(option, 'mouseenter', function() {
                this.style.background = '#3b82f6';
            });
            addManagedEventListener(option, 'mouseleave', function() {
                this.style.background = '#2b2b2b';
            });
            
            // 复选框变化事件 - 使用管理的事件监听器
            const checkbox = option.querySelector('input[type="checkbox"]');
            if (checkbox) {
                addManagedEventListener(checkbox, 'change', (e) => {
                    const annotationId = checkbox.dataset.annotationId;
                    this.updateObjectSelection(modal, annotationId, checkbox.checked);
                });
            }
            
            // 点击选项事件 - 使用管理的事件监听器
            addManagedEventListener(option, 'click', (e) => {
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
        
        // 点击其他地方关闭下拉框 - 使用管理的事件监听器
        addManagedEventListener(document, 'click', (e) => {
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
        
        addManagedEventListener(fileInput, 'change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageUpload(modal, file);
            } else {
            }
        });
        
    }

    /**
     * 处理图片上传
     * 🔧 添加base64大小限制以防止内存泄露
     */
    handleImageUpload(modal, file) {
        // 检查文件大小限制 (10MB)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            this.showNotification('文件太大，请选择小于10MB的图片', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // 检查base64数据大小限制 (5MB base64)
            const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB
            if (imageData.length > MAX_BASE64_SIZE) {
                this.showNotification('图片数据太大，请选择更小的图片', 'error');
                return;
            }
            
            console.log(`📸 图片上传成功: ${file.name}, 大小: ${(imageData.length / 1024).toFixed(1)}KB`);
            
            // 这里可以添加图片处理逻辑
            if (this.nodeInstance.processUploadedImage) {
                this.nodeInstance.processUploadedImage(modal, imageData, file.name);
            }
        };
        
        reader.onerror = () => {
            console.error('Image reading failed');
            this.showNotification('图片读取失败', 'error');
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
        
        addManagedEventListener(enableLayerManagement, 'change', (e) => {
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
        
        // 🆕 绑定局部编辑提示词生成功能
        this.bindLocalEditingEvents(modal);
        
    }

    /**
     * 绑定图层管理事件
     */
    bindLayerManagementEvents(modal) {
        
        // 延迟绑定，确保DOM准备就绪 - 使用管理的定时器
        const timerId = addManagedTimeout(() => {
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
        
        addManagedEventListener(fileInput, 'change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageUpload(modal, file);
            } else {
            }
        });
        
    }

    /**
     * 处理图片上传
     * 🔧 添加base64大小限制以防止内存泄露
     */
    handleImageUpload(modal, file) {
        // 检查文件大小限制 (10MB)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            this.showNotification('文件太大，请选择小于10MB的图片', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // 检查base64数据大小限制 (5MB base64)
            const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB
            if (imageData.length > MAX_BASE64_SIZE) {
                this.showNotification('图片数据太大，请选择更小的图片', 'error');
                return;
            }
            
            console.log(`📸 图片上传成功: ${file.name}, 大小: ${(imageData.length / 1024).toFixed(1)}KB`);
            
            // 这里可以添加图片处理逻辑
            if (this.nodeInstance.processUploadedImage) {
                this.nodeInstance.processUploadedImage(modal, imageData, file.name);
            }
        };
        
        reader.onerror = () => {
            console.error('Image reading failed');
            this.showNotification('图片读取失败', 'error');
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
        
        addManagedEventListener(enableLayerManagement, 'change', (e) => {
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
        
        // 🆕 绑定局部编辑提示词生成功能
        this.bindLocalEditingEvents(modal);
        
    }

    /**
     * 绑定图层管理事件
     */
    bindLayerManagementEvents(modal) {
        
        // 延迟绑定，确保DOM准备就绪 - 使用管理的定时器
        const timerId = addManagedTimeout(() => {
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
        
        addManagedEventListener(fileInput, 'change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageUpload(modal, file);
            } else {
            }
        });
        
    }

    /**
     * 处理图片上传
     * 🔧 添加base64大小限制以防止内存泄露
     */
    handleImageUpload(modal, file) {
        // 检查文件大小限制 (10MB)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            this.showNotification('文件太大，请选择小于10MB的图片', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // 检查base64数据大小限制 (5MB base64)
            const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB
            if (imageData.length > MAX_BASE64_SIZE) {
                this.showNotification('图片数据太大，请选择更小的图片', 'error');
                return;
            }
            
            console.log(`📸 图片上传成功: ${file.name}, 大小: ${(imageData.length / 1024).toFixed(1)}KB`);
            
            // 这里可以添加图片处理逻辑
            if (this.nodeInstance.processUploadedImage) {
                this.nodeInstance.processUploadedImage(modal, imageData, file.name);
            }
        };
        
        reader.onerror = () => {
            console.error('Image reading failed');
            this.showNotification('图片读取失败', 'error');
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
        
        addManagedEventListener(enableLayerManagement, 'change', (e) => {
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
        
        // 🆕 绑定局部编辑提示词生成功能
        this.bindLocalEditingEvents(modal);
        
    }

    /**
     * 绑定图层管理事件
     */
    bindLayerManagementEvents(modal) {
        
        // 延迟绑定，确保DOM准备就绪 - 使用管理的定时器
        const timerId = addManagedTimeout(() => {
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
            addManagedEventListener(button, 'click', (e) => {
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
            
            addManagedEventListener(fillToggle, 'click', () => {
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
            
            if (opacitySlider && opacityValue) {
                addManagedEventListener(opacitySlider, 'input', () => {
                    const opacityPercent = parseInt(opacitySlider.value);
                    modal.currentOpacity = opacityPercent;
                    opacityValue.textContent = opacityPercent + '%';
                    
                    if (window.fabricManager && window.fabricManager.setOpacity) {
                        window.fabricManager.setOpacity(opacityPercent / 100);
                    }
                });
            }
        }
    }

    /**
     * 绑定清空按钮（移除了undo功能）
     */
    bindClearButton(modal) {
        const clearBtn = modal.querySelector('#vpe-clear');
        if (clearBtn) {
            if (clearBtn) {
            addManagedEventListener(clearBtn, 'click', () => {
                this.clearAllAnnotations(modal);
            });
        }
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
        
        // Transform-First架构：移除清空annotations的逻辑
        
    }

    /**
     * 绑定工具选择器
     */
    bindToolSelector(modal) {
        const toolButtons = modal.querySelectorAll('.vpe-tool');
        toolButtons.forEach(button => {
            addManagedEventListener(button, 'click', (e) => {
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
            if (operationSelect) {
            addManagedEventListener(operationSelect, 'change', (e) => {
                // 操作类型变化处理
            });
        }
        }
    }

    /**
     * 执行完整的模态弹窗清理
     * 🚀 增强版本，确保彻底清理所有资源
     */
    performCompleteModalCleanup(modal) {
        console.log('🧹 开始执行模态弹窗完整清理...');
        
        try {
            // 1. 清理 Fabric.js 画布
            if (this.nodeInstance.fabricManager) {
                // 🚀 调用完整的销毁方法
                if (typeof this.nodeInstance.fabricManager.destroy === 'function') {
                    this.nodeInstance.fabricManager.destroy();
                }
                
                // 清理fabricManager引用
                this.nodeInstance.fabricManager = null;
            }
            
            // 2. 清理数据管理器
            if (this.nodeInstance.dataManager) {
                this.nodeInstance.dataManager.clearAllCaches();
                this.nodeInstance.dataManager = null;
            }
            
            // 3. 清理全局引用
            if (window.currentVPENode === this.nodeInstance) {
                window.currentVPENode = null;
            }
            if (window.currentVPEInstance === this.nodeInstance) {
                window.currentVPEInstance = null;
            }
            
            // 4. 清理图像缓存（只清理当前相关的）
            if (window.globalImageCache && modal.inputImageData) {
                // 如果有图像URL，从缓存中删除
                if (typeof modal.inputImageData === 'string') {
                    globalImageCache.cache.delete(modal.inputImageData);
                } else if (modal.inputImageData && modal.inputImageData.filename) {
                    const subfolder = modal.inputImageData.subfolder ? `${modal.inputImageData.subfolder}/` : '';
                    const imageUrl = `/view?filename=${modal.inputImageData.filename}&subfolder=${subfolder}&type=input`;
                    globalImageCache.cache.delete(imageUrl);
                }
            }
            
            // 5. 🚀 使用新的内存管理器进行深度清理
            if (globalMemoryManager) {
                globalMemoryManager.cleanupOnModalClose(modal);
            }
            
            // 6. 执行通用清理
            performModalCleanup();
            
            console.log('✅ 模态弹窗清理完成');
            
        } catch (error) {
            console.error('❌ 模态弹窗清理出错:', error);
            // 即使出错也要继续执行基本清理
            try {
                if (globalMemoryManager) {
                    globalMemoryManager.cleanupOnModalClose(modal);
                }
                performModalCleanup();
            } catch (e) {
                console.error('❌ 基本清理也失败:', e);
            }
        }
    }

    /**
     * 绑定关闭和保存按钮事件
     */
    bindCloseAndSaveButtons(modal) {
        // 关闭按钮
        const closeBtn = modal.querySelector('#vpe-close');
        if (closeBtn) {
            closeBtn.onclick = async () => {
                try {
                    console.log('💾 正在保存变换数据并关闭编辑器...');
                    
                    // 🔄 先收集并提交实际的变换数据
                    if (modal.fabricCanvas) {
                        const fabricNative = modal.fabricCanvas.fabricNative;
                        if (fabricNative && typeof fabricNative.saveCurrentTransformsLG === 'function') {
                            await fabricNative.saveCurrentTransformsLG();
                            console.log('[LRPG_WebSocket] ✅ 变换数据已提交到后端');
                        }
                    }
                    
                    // 🚀 执行完整的资源清理，防止内存泄漏
                    this.performCompleteModalCleanup(modal);
                } catch (cleanupError) {
                    console.error('❌ 保存和清理过程中出错:', cleanupError);
                } finally {
                    // 🚀 确保弹窗总是被移除，无论清理是否成功
                    try {
                        if (modal && modal.parentNode) {
                            document.body.removeChild(modal);
                        }
                    } catch (removeError) {
                        console.error('❌ 移除弹窗失败:', removeError);
                    }
                }
            };
        }

        // 保存按钮
        const saveBtn = modal.querySelector('#vpe-save');
        if (saveBtn) {
            saveBtn.onclick = () => {
                this.handleSaveEditingData(modal);
            };
        }
    }

    /**
     * 处理保存编辑数据到后端
     */
    handleSaveEditingData(modal) {
        try {
            console.log('💾 开始保存编辑数据...');
            
            // 显示保存中状态
            const saveBtn = modal.querySelector('#vpe-save');
            if (saveBtn) {
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '💾 Saving...';
                saveBtn.disabled = true;
                
                // 保存数据到后端
                const success = saveEditingDataToBackend(modal, this.nodeInstance);
                
                // 恢复按钮状态 - 使用管理的定时器
                addManagedTimeout(() => {
                    saveBtn.innerHTML = originalText;
                    saveBtn.disabled = false;
                    
                    if (success) {
                        this.showNotification('编辑数据已成功保存到后端！', 'success');
                    } else {
                        this.showNotification('保存失败，请检查数据和连接', 'error');
                    }
                }, 1000);
            }
            
        } catch (error) {
            console.error('❌ 保存编辑数据时出错:', error);
            this.showNotification('保存时发生错误', 'error');
        }
    }

    /**
     * 绑定图层面板按钮事件
     */
    bindLayerPanelButtons(modal) {
        const clearSelectionBtn = modal.querySelector('#clear-selection');
        if (clearSelectionBtn) {
            addManagedEventListener(clearSelectionBtn, 'click', () => {
                this.clearAllAnnotations(modal);
            });
        }

        const selectAllBtn = modal.querySelector('#select-all-layers');
        if (selectAllBtn) {
            addManagedEventListener(selectAllBtn, 'click', () => {
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
            const objects = fabricCanvas.getObjects().filter(obj => !obj.isLockIndicator && !obj.skipInLayerList);
            
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
            addManagedEventListener(canvasSizeSelect, 'change', (e) => {
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
            addManagedEventListener(applySizeBtn, 'click', () => {
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
                addManagedEventListener(input, 'keypress', (e) => {
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
        this.showNotification(`✅ Canvas size updated: ${width}×${height}`, 'success');
    }

    /**
     * 绑定图片上传按钮事件
     */
    bindImageUploadButton(modal) {
        const uploadBtn = modal.querySelector('#vpe-upload-btn');
        const fileInput = modal.querySelector('#vpe-image-upload');

        if (uploadBtn && fileInput) {
            // 点击按钮触发文件选择
            addManagedEventListener(uploadBtn, 'click', () => {
                fileInput.click();
            });

            // 文件选择事件
            addManagedEventListener(fileInput, 'change', (e) => {
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
        
        // 🚀 内存监控按钮
        const memoryMonitorBtn = modal.querySelector('#vpe-memory-monitor');
        if (memoryMonitorBtn) {
            addManagedEventListener(memoryMonitorBtn, 'click', () => {
                if (globalMemoryManager) {
                    const report = globalMemoryManager.getMemoryReport();
                    
                    // 创建报告弹窗
                    const reportDialog = document.createElement('div');
                    reportDialog.className = 'comfy-modal';
                    reportDialog.style.cssText = `
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: rgba(0, 0, 0, 0.8); z-index: 20000;
                        display: flex; justify-content: center; align-items: center;
                    `;
                    
                    const content = document.createElement('div');
                    content.className = 'content';
                    content.style.cssText = `
                        background: #2b2b2b; color: white; padding: 30px;
                        border-radius: 12px; max-width: 600px; max-height: 80vh;
                        overflow-y: auto; position: relative;
                        font-family: monospace; font-size: 14px; line-height: 1.6;
                    `;
                    
                    content.innerHTML = `
                        <div style="text-align: center; margin-bottom: 25px;">
                            <h2 style="margin: 0; color: #9C27B0;">🧹 Memory Usage Report</h2>
                            <p style="margin: 10px 0 0 0; color: #888;">Real-time memory monitoring and optimization</p>
                        </div>
                        
                        <pre style="background: #1a1a1a; padding: 20px; border-radius: 8px; overflow-x: auto; white-space: pre-wrap;">${report}</pre>
                        
                        <div style="margin-top: 20px; text-align: center;">
                            <button id="memory-force-cleanup" style="margin-right: 10px; padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer;">🗑️ Force Cleanup</button>
                            <button id="memory-close-report" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
                        </div>
                    `;
                    
                    reportDialog.appendChild(content);
                    document.body.appendChild(reportDialog);
                    
                    // 绑定按钮事件
                    content.querySelector('#memory-close-report').onclick = () => {
                        document.body.removeChild(reportDialog);
                    };
                    
                    content.querySelector('#memory-force-cleanup').onclick = () => {
                        globalMemoryManager.performCleanup();
                        // 更新报告
                        const updatedReport = globalMemoryManager.getMemoryReport();
                        content.querySelector('pre').textContent = updatedReport;
                    };
                    
                    reportDialog.onclick = (e) => {
                        if (e.target === reportDialog) {
                            document.body.removeChild(reportDialog);
                        }
                    };
                }
            });
        }
    }

    /**
     * 处理工具栏图片上传
     * 🔧 添加base64大小限制以防止内存泄露
     */
    handleToolbarImageUpload(modal, file) {
        try {
            // 检查文件大小限制 (10MB)
            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
            if (file.size > MAX_FILE_SIZE) {
                this.showNotification('文件太大，请选择小于10MB的图片', 'error');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imageUrl = e.target.result;
                
                // 检查base64数据大小限制 (5MB base64)
                const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB
                if (imageUrl.length > MAX_BASE64_SIZE) {
                    this.showNotification('图片数据太大，请选择更小的图片', 'error');
                    return;
                }
                
                console.log(`📸 工具栏图片上传成功: ${file.name}, 大小: ${(imageUrl.length / 1024).toFixed(1)}KB`);
                
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
                this.showNotification('图片读取失败', 'error');
            };
            
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('❌ 处理图片上传失败:', error);
            this.showNotification('图片上传失败', 'error');
        }
    }

    /**
     * 显示图片上传成功通知
     */
    showImageUploadNotification(fileName) {
        this.showNotification(`📁 Image uploaded: ${fileName}`, 'warning');
    }

    /**
     * 绑定局部编辑提示词生成功能事件
     */
    bindLocalEditingEvents(modal) {
        console.log('🎯 开始绑定局部编辑面板事件...');
        
        // 生成局部编辑提示词按钮
        const generateBtn = modal.querySelector('#generate-local-prompt');
        console.log('🔍 查找生成按钮:', { generateBtn: !!generateBtn, id: generateBtn?.id });
        
        if (generateBtn) {
            console.log('✅ 找到生成按钮，绑定点击事件');
            addManagedEventListener(generateBtn, 'click', (event) => {
                console.log('🎯 生成按钮被点击!', event);
                this.handleGenerateLocalPrompt(modal);
            });
            
            // 添加悬停效果 - 使用管理的事件监听器
            addManagedEventListener(generateBtn, 'mouseenter', () => {
                generateBtn.style.background = '#AB47BC';
                generateBtn.style.transform = 'translateY(-1px)';
            });
            addManagedEventListener(generateBtn, 'mouseleave', () => {
                generateBtn.style.background = '#9C27B0';
                generateBtn.style.transform = 'translateY(0)';
            });
        } else {
            console.error('❌ 找不到生成按钮元素 #generate-local-prompt');
        }

        // 绑定复制按钮事件
        const copyBtn = modal.querySelector('#copy-local-description');
        if (copyBtn) {
            addManagedEventListener(copyBtn, 'click', () => {
                this.copyLocalDescription(modal);
            });
        }

        // 绑定应用按钮事件
        const applyBtn = modal.querySelector('#apply-local-description');
        if (applyBtn) {
            addManagedEventListener(applyBtn, 'click', () => {
                this.applyLocalDescription(modal);
            });
        }
    }
    
    /**
     * 处理生成局部编辑提示词
     */
    handleGenerateLocalPrompt(modal) {
        try {
            console.log('🎯 开始生成局部编辑提示词...');
            
            // 🎯 首先确保layer-operations容器是显示的
            const layerOperations = modal.querySelector('#layer-operations');
            if (layerOperations && layerOperations.style.display === 'none') {
                layerOperations.style.display = 'block';
                layerOperations.style.visibility = 'visible';
                layerOperations.style.opacity = '1';
                console.log('✅ 显示了layer-operations容器');
            }
            
            // 获取当前设置
            const operationType = modal.querySelector('#current-layer-operation')?.value || 'add_object';
            const description = modal.querySelector('#current-layer-description')?.value || '';
            
            // 获取选中的约束性提示词
            const constraintPrompts = this.getSelectedConstraintPrompts(modal);
            
            // 获取选中的修饰性提示词
            const decorativePrompts = this.getSelectedDecorativePrompts(modal);
            
            // 获取选中的图层信息
            const selectedLayers = this.getSelectedLayersInfo(modal);
            
            console.log('🔍 获取到的参数:', { 
                operationType, 
                description, 
                constraintPrompts,
                decorativePrompts,
                selectedLayersCount: selectedLayers.length 
            });
            
            // 生成局部编辑提示词
            const promptData = this.generateLocalEditingPrompt({
                operationType,
                description,
                constraintPrompts,
                decorativePrompts,
                selectedLayers
            });
            
            console.log('✅ 生成的提示词数据:', promptData);
            this.displayGeneratedLocalDescription(modal, promptData);
            
        } catch (error) {
            console.error('❌ 生成局部编辑提示词失败:', error);
            this.showNotification('生成失败，请检查选择的图层和参数', 'error');
        }
    }

    /**
     * 获取选中的约束性提示词
     */
    getSelectedConstraintPrompts(modal) {
        const constraintContainer = modal.querySelector('#layer-constraint-prompts-container');
        const selectedPrompts = [];
        
        if (constraintContainer) {
            const checkboxes = constraintContainer.querySelectorAll('input[type="checkbox"]:checked');
            checkboxes.forEach(checkbox => {
                const label = checkbox.closest('label');
                if (label) {
                    selectedPrompts.push(label.textContent.trim());
                }
            });
        }
        
        return selectedPrompts;
    }

    /**
     * 获取选中的修饰性提示词
     */
    getSelectedDecorativePrompts(modal) {
        const decorativeContainer = modal.querySelector('#layer-decorative-prompts-container');
        const selectedPrompts = [];
        
        if (decorativeContainer) {
            const checkboxes = decorativeContainer.querySelectorAll('input[type="checkbox"]:checked');
            checkboxes.forEach(checkbox => {
                const label = checkbox.closest('label');
                if (label) {
                    selectedPrompts.push(label.textContent.trim());
                }
            });
        }
        
        return selectedPrompts;
    }

    /**
     * 获取选中的图层信息
     */
    getSelectedLayersInfo(modal) {
        const layersList = modal.querySelector('#layers-list');
        const selectedLayers = [];
        
        if (layersList) {
            const selectedItems = layersList.querySelectorAll('.layer-list-item.selected');
            selectedItems.forEach(item => {
                selectedLayers.push({
                    id: item.dataset.layerId,
                    type: item.dataset.layerType,
                    name: item.querySelector('.layer-name')?.textContent || `Layer ${selectedLayers.length + 1}`
                });
            });
        }
        
        return selectedLayers;
    }

    /**
     * 生成局部编辑提示词
     */
    generateLocalEditingPrompt({ operationType, description, constraintPrompts, decorativePrompts, selectedLayers }) {
        // Flux Kontext优化操作模板映射 - 使用英文专业提示词
        const operationTemplates = {
            // 局部编辑模板 (L01-L18) - Flux Kontext优化
            'add_object': 'add {description} to the marked area',
            'change_color': 'make the marked area {description}',
            'change_style': 'turn the marked area into {description} style',
            'replace_object': 'replace the marked area with {description}',
            'remove_object': 'remove the marked area',
            'change_texture': 'change the marked area texture to {description}',
            'change_pose': 'make the marked area {description} pose',
            'change_expression': 'give the marked area {description} expression',
            'change_clothing': 'change the marked area clothing to {description}',
            'change_background': 'change the background to {description}',
            'enhance_quality': 'enhance the marked area quality',
            'blur_background': 'blur the background behind the marked area',
            'adjust_lighting': 'adjust lighting on the marked area',
            'resize_object': 'make the marked area {description} size',
            'enhance_skin_texture': 'enhance the marked area skin texture',
            'character_expression': 'make the person {description}',
            'character_hair': 'give the person {description} hair',
            'character_accessories': 'give the person {description}',
            'zoom_focus': 'zoom focus on the marked area',
            'stylize_local': 'stylize the marked area with {description}',
            'custom': 'apply custom modification to the marked area'
        };

        // 构建基础提示词 - 处理模板占位符
        const baseTemplate = operationTemplates[operationType] || operationTemplates['custom'];
        let positivePrompt = '';
        
        // 如果有描述，使用模板并替换占位符；否则使用默认描述
        if (description && description.trim()) {
            // 使用用户描述替换模板中的占位符
            positivePrompt = baseTemplate.replace('{description}', description.trim());
        } else {
            // 使用默认描述替换占位符
            const defaultDescriptions = {
                'add_object': 'a new object',
                'change_color': 'red',
                'change_style': 'cartoon',
                'replace_object': 'a different object',
                'change_texture': 'smooth',
                'change_pose': 'standing',
                'change_expression': 'happy',
                'change_clothing': 'casual clothes',
                'change_background': 'natural landscape',
                'resize_object': 'larger',
                'character_expression': 'smile',
                'character_hair': 'blonde',
                'character_accessories': 'glasses',
                'stylize_local': 'artistic style',
                'custom': 'modification'
            };
            
            const defaultDesc = defaultDescriptions[operationType] || 'modification';
            positivePrompt = baseTemplate.replace('{description}', defaultDesc);
        }

        // 添加图层信息
        if (selectedLayers.length > 0) {
            const layerNames = selectedLayers.map(layer => layer.name).join(', ');
            positivePrompt += ` (targeting: ${layerNames})`;
        }

        // 添加约束性提示词
        if (constraintPrompts.length > 0) {
            positivePrompt += `, ${constraintPrompts.join(', ')}`;
        }

        // 添加修饰性提示词
        if (decorativePrompts.length > 0) {
            positivePrompt += `, ${decorativePrompts.join(', ')}`;
        }

        // 生成负向提示词（基于操作类型） - Flux Kontext优化
        const negativePrompts = {
            'add_object': 'floating objects, unrealistic placement, size mismatch, poor integration',
            'change_color': 'wrong colors, color bleeding, inconsistent coloring, unnatural hues',
            'change_style': 'inconsistent style, style mixing, poor artistic quality, stylistic conflicts',
            'replace_object': 'incomplete replacement, object remnants, blended objects, poor boundaries',
            'remove_object': 'object traces, incomplete removal, artifacts, visible gaps',
            'change_texture': 'unrealistic texture, poor surface quality, texture misalignment',
            'change_pose': 'unnatural pose, anatomical errors, distorted proportions',
            'change_expression': 'unnatural expression, distorted face, wrong emotion, facial artifacts',
            'change_clothing': 'ill-fitting clothes, unrealistic fabric, clothing artifacts',
            'change_background': 'inconsistent lighting, perspective mismatch, background artifacts',
            'enhance_quality': 'blur, noise, artifacts, low resolution, over-sharpening',
            'blur_background': 'subject blur, uneven blur, artifacts, poor depth separation',
            'adjust_lighting': 'harsh lighting, unnatural shadows, lighting inconsistency',
            'resize_object': 'distortion, pixel stretching, interpolation artifacts, poor scaling quality',
            'enhance_skin_texture': 'plastic skin, over-smoothing, unnatural skin tone',
            'character_expression': 'unnatural expression, distorted face, wrong emotion',
            'character_hair': 'unnatural hair physics, poor hair texture, hair artifacts', 
            'character_accessories': 'floating accessories, poor fit, unrealistic positioning',
            'zoom_focus': 'blur artifacts, poor focus transition, unnatural depth',
            'stylize_local': 'style inconsistency, over-stylization, quality loss',
            'default': 'low quality, blurry, distorted, artifacts, inconsistent'
        };

        const negativePrompt = negativePrompts[operationType] || negativePrompts['default'];

        // 计算质量分数（基于设置的完整性）
        let qualityScore = 0.6; // 基础分数
        if (description && description.trim()) qualityScore += 0.2;
        if (constraintPrompts.length > 0) qualityScore += 0.1;
        if (decorativePrompts.length > 0) qualityScore += 0.1;
        if (selectedLayers.length > 0) qualityScore += 0.1;
        qualityScore = Math.min(qualityScore, 1.0);

        return {
            positivePrompt,
            negativePrompt,
            qualityScore,
            selectedLayersCount: selectedLayers.length,
            operationType,
            metadata: {
                constraintPrompts,
                decorativePrompts,
                selectedLayers
            }
        };
    }

    /**
     * 显示生成的局部编辑描述
     */
    displayGeneratedLocalDescription(modal, promptData) {
        console.log('🔍 displayGeneratedLocalDescription被调用，promptData:', promptData);
        
        // 显示描述区域
        const descContainer = modal.querySelector('#local-generated-description-container');
        const descTextarea = modal.querySelector('#local-generated-description');
        
        console.log('🔍 查找描述容器:', { descContainer: !!descContainer, descTextarea: !!descTextarea });
        
        if (descContainer && descTextarea) {
            descContainer.style.display = 'block';
            console.log('✅ 显示描述区域');
            
            const description = `${promptData.positivePrompt}${promptData.negativePrompt ? ` | Avoid: ${promptData.negativePrompt}` : ''}`;
            descTextarea.value = description;
            console.log('✅ 设置描述文本');
        } else {
            console.error('❌ 找不到描述容器元素');
        }
        
        // 显示成功通知
        this.showNotification('局部编辑提示词生成成功！', 'success');
        
        console.log('🎯 displayGeneratedLocalDescription执行完成');
    }

    /**
     * 复制局部编辑描述到剪贴板
     */
    copyLocalDescription(modal) {
        const descTextarea = modal.querySelector('#local-generated-description');
        if (descTextarea && descTextarea.value) {
            navigator.clipboard.writeText(descTextarea.value).then(() => {
                this.showNotification('描述已复制到剪贴板', 'success');
            }).catch(err => {
                console.error('复制失败:', err);
                // 回退方案
                descTextarea.select();
                document.execCommand('copy');
                this.showNotification('描述已复制到剪贴板', 'success');
            });
        }
    }

    /**
     * 应用局部编辑描述到主描述区域
     */
    applyLocalDescription(modal) {
        const descTextarea = modal.querySelector('#local-generated-description');
        const mainDescTextarea = modal.querySelector('#current-layer-description');
        
        if (descTextarea && mainDescTextarea && descTextarea.value) {
            mainDescTextarea.value = descTextarea.value.split(' | Avoid:')[0]; // 只取正向提示词
            this.showNotification('描述已应用到主编辑区域', 'success');
        }
    }

    /**
     * 显示通知消息（相对于弹窗内部定位）
     */
    showNotification(message, type = 'info') {
        // 查找弹窗容器
        const modal = document.getElementById('unified-editor-modal');
        if (!modal) {
            console.warn('Modal not found, falling back to body notification');
            return;
        }

        const notification = document.createElement('div');
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            info: '#2196F3',
            warning: '#FF9800'
        };
        
        notification.style.cssText = `
            position: absolute; top: 80px; right: 20px; z-index: 10000;
            background: ${colors[type] || colors.info}; color: white; padding: 12px 20px;
            border-radius: 6px; font-size: 14px; font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            opacity: 0; transition: all 0.3s ease; max-width: 300px;
            pointer-events: none;
        `;
        notification.textContent = message;

        // 添加到弹窗内部而不是body
        modal.appendChild(notification);

        // 动画显示 - 使用管理的定时器
        addManagedTimeout(() => notification.style.opacity = '1', 10);

        // 3秒后自动移除 - 使用管理的定时器
        addManagedTimeout(() => {
            notification.style.opacity = '0';
            addManagedTimeout(() => {
                if (notification.parentNode) {
                    modal.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 导出创建函数
export function createEventHandlers(nodeInstance) {
    return new EventHandlers(nodeInstance);
}

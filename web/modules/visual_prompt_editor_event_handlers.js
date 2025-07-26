/**
 * Visual Prompt Editor - 事件处理系统模块
 * 负责各种UI事件的绑定和处理，包括下拉框、文件上传、基础界面事件等
 */

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
            console.warn('⚠️ 下拉框相关元素不完整，跳过事件绑定');
            return;
        }
        
        dropdown.addEventListener('click', (e) => {
            e.preventDefault();
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
            if (!dropdown.contains(e.target)) {
                dropdownMenu.style.display = 'none';
                dropdownArrow.style.transform = 'rotate(0deg)';
            }
        });
        
        console.log('✅ 下拉框事件绑定完成');
    }

    /**
     * 绑定下拉框选项事件
     */
    bindDropdownOptionsEvents(modal) {
        console.log('🔗 开始绑定下拉选择器事件...');
        
        const dropdownOptions = modal.querySelector('#dropdown-options');
        if (!dropdownOptions) {
            console.warn('⚠️ 下拉选项容器未找到');
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
                    console.log('🔄 下拉框复选框状态变化:', annotationId, checkbox.checked);
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
        
        console.log('✅ 下拉选择器事件绑定完成，共', options.length, '个选项');
    }

    /**
     * 绑定主下拉框事件
     */
    bindMainDropdownEvents(modal) {
        console.log('🔗 绑定主下拉框事件...');
        
        const dropdown = modal.querySelector('#layer-dropdown');
        const dropdownMenu = modal.querySelector('#layer-dropdown-menu');
        const dropdownArrow = modal.querySelector('#dropdown-arrow');
        
        if (!dropdown || !dropdownMenu || !dropdownArrow) {
            console.warn('⚠️ 主下拉框元素不完整');
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
        
        console.log('✅ 主下拉框事件绑定完成');
    }

    /**
     * 绑定文件上传事件
     */
    bindFileUploadEvents(modal) {
        console.log('🔗 绑定文件上传事件...');
        
        const fileInput = modal.querySelector('#layer-image-upload');
        if (!fileInput) {
            console.warn('⚠️ 文件上传元素未找到');
            return;
        }
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                console.log('📁 文件选择:', file.name);
                this.handleImageUpload(modal, file);
            } else {
                console.warn('⚠️ 请选择有效的图片文件');
            }
        });
        
        console.log('✅ 文件上传事件绑定完成');
    }

    /**
     * 处理图片上传
     */
    handleImageUpload(modal, file) {
        console.log('📤 处理图片上传:', file.name);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            console.log('✅ 图片读取完成，大小:', Math.round(imageData.length / 1024), 'KB');
            
            // 这里可以添加图片处理逻辑
            if (this.nodeInstance.processUploadedImage) {
                this.nodeInstance.processUploadedImage(modal, imageData, file.name);
            }
        };
        
        reader.onerror = () => {
            console.error('❌ 图片读取失败');
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * 绑定图层管理切换事件
     */
    bindLayerManagementToggleEvents(modal) {
        console.log('🔗 绑定图层管理切换事件...');
        
        const enableLayerManagement = modal.querySelector('#enable-layer-management');
        if (!enableLayerManagement) {
            console.warn('⚠️ 图层管理切换元素未找到');
            return;
        }
        
        enableLayerManagement.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            console.log('🔄 图层管理切换:', enabled ? '启用' : '禁用');
            
            if (this.nodeInstance.toggleConnectedLayersDisplay) {
                this.nodeInstance.toggleConnectedLayersDisplay(modal, enabled);
            }
            
            // 更新UI状态
            this.updateLayerManagementUI(modal, enabled);
        });
        
        console.log('✅ 图层管理切换事件绑定完成');
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
        
        console.log('🎨 图层管理UI状态已更新:', enabled ? '启用' : '禁用');
    }

    /**
     * 绑定基础界面事件
     */
    bindBasicEvents(modal) {
        console.log('🔗 绑定基础界面事件...');
        
        // 绑定关闭和保存按钮事件
        this.bindCloseAndSaveButtons(modal);
        
        // 绑定操作类型选择器事件
        this.bindOperationTypeEvents(modal);
        
        // 绑定绘制工具事件
        this.bindDrawingToolEvents(modal);
        
        // 绑定图层管理事件
        this.bindLayerManagementEvents(modal);
        
        // 绑定所有子事件
        this.bindFileUploadEvents(modal);
        this.bindLayerManagementToggleEvents(modal);
        this.bindMainDropdownEvents(modal);
        
        console.log('✅ 基础界面事件绑定完成');
    }

    /**
     * 绑定图层管理事件
     */
    bindLayerManagementEvents(modal) {
        console.log('🎨 绑定图层管理事件...');
        
        // 延迟绑定，确保DOM准备就绪
        setTimeout(() => {
            try {
                // 绑定图层顺序调整事件
                this.bindLayerOrderEvents(modal);
                
                // 绑定图层可见性事件
                this.bindLayerVisibilityEvents(modal);
                
                // 绑定Transform按钮事件
                this.bindTransformButtonEvents(modal);
                
                console.log('✅ 图层管理事件绑定完成');
            } catch (error) {
                console.error('❌ 图层管理事件绑定失败:', error);
            }
        }, 150); // 比主文件中的延迟稍长一些
    }

    /**
     * 绑定图层顺序调整事件
     */
    bindLayerOrderEvents(modal) {
        try {
            import('./visual_prompt_editor_layer_order.js').then(module => {
                const controller = new module.LayerOrderController(this.nodeInstance);
                controller.bindLayerOrderEvents(modal);
                console.log('✅ 图层顺序调整事件绑定完成');
            }).catch(error => {
                console.error('❌ 导入图层顺序控制器失败:', error);
            });
        } catch (error) {
            console.error('❌ 绑定图层顺序事件失败:', error);
        }
    }

    /**
     * 绑定图层可见性事件
     */
    bindLayerVisibilityEvents(modal) {
        try {
            import('./visual_prompt_editor_layer_visibility.js').then(module => {
                const controller = new module.LayerVisibilityController(this.nodeInstance);
                controller.bindLayerVisibilityEvents(modal);
                console.log('✅ 图层可见性事件绑定完成');
            }).catch(error => {
                console.error('❌ 导入图层可见性控制器失败:', error);
            });
        } catch (error) {
            console.error('❌ 绑定图层可见性事件失败:', error);
        }
    }

    /**
     * 绑定Transform按钮事件
     */
    bindTransformButtonEvents(modal) {
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
                        console.log('✅ 变换模式已激活 - 点击图层列表或画布图层来变换');
                        
                        // 🔧 清除当前变换状态（使用新的变换控制模块）
                        if (this.nodeInstance.transformControls) {
                            this.nodeInstance.transformControls.clearTransformState(modal);
                        }
                        
                        // 🔧 显示提示信息（使用新的变换控制模块）
                        if (this.nodeInstance.transformControls) {
                            this.nodeInstance.transformControls.showTransformModeHint(modal);
                        }
                        
                        // 🔧 绑定图层列表的变换点击事件
                        this.bindLayerListTransformEvents(modal);
                        
                        // 🔧 绑定画布图层点击事件
                        this.bindCanvasLayerTransformEvents(modal);
                    } else {
                        // 关闭变换模式
                        transformBtn.style.background = '#444';
                        transformBtn.style.color = '#ccc';
                        transformBtn.textContent = '🔄 Transform';
                        console.log('❌ 变换模式已关闭');
                        
                        // 🔧 清除变换状态和提示（使用新的变换控制模块）
                        if (this.nodeInstance.transformControls) {
                            this.nodeInstance.transformControls.clearTransformState(modal);
                            this.nodeInstance.transformControls.hideTransformModeHint(modal);
                        }
                        
                        // 🔧 清除图层列表的变换点击事件
                        this.clearLayerListTransformEvents(modal);
                        
                        // 🔧 清除画布图层的变换点击事件
                        this.clearCanvasLayerTransformEvents(modal);
                    }
                };
                
                console.log('✅ Transform按钮事件绑定完成');
            } else {
                console.error('❌ Transform按钮未找到! ID: #vpe-transform-mode');
                console.log('📋 可用的按钮:', modal.querySelectorAll('button'));
            }
            
        } catch (error) {
            console.error('❌ 绑定Transform按钮事件失败:', error);
        }
    }

    /**
     * 绑定图层列表的变换点击事件
     */
    bindLayerListTransformEvents(modal) {
        try {
            console.log('🔗 绑定图层列表变换点击事件...');
            
            const layersList = modal.querySelector('#layers-list');
            if (!layersList) {
                console.warn('⚠️ 图层列表未找到');
                return;
            }
            
            // 清除之前的变换点击监听器（如果存在）
            if (layersList._transformClickHandler) {
                layersList.removeEventListener('click', layersList._transformClickHandler);
            }
            
            // 创建变换点击处理器
            const transformClickHandler = (e) => {
                // 检查是否在变换模式下
                if (!modal.transformModeActive) {
                    return;
                }
                
                // 查找被点击的图层项
                const layerItem = e.target.closest('.layer-list-item');
                if (layerItem) {
                    // 提取图层ID和类型
                    let layerId = layerItem.getAttribute('data-layer-id');
                    const layerType = layerItem.getAttribute('data-layer-type') || 'IMAGE_LAYER';
                    
                    // 如果没有data-layer-id，尝试从其他属性获取
                    if (!layerId) {
                        // 查找图层项内的按钮或元素
                        const visibilityBtn = layerItem.querySelector('[data-layer-id]');
                        if (visibilityBtn) {
                            layerId = visibilityBtn.getAttribute('data-layer-id');
                        }
                    }
                    
                    if (layerId) {
                        console.log(`🎯 [LAYER-LIST] 变换模式：选中图层列表项 ${layerId} (${layerType})`);
                        
                        // 阻止事件冒泡，避免触发其他事件
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // 调用变换激活函数
                        this.nodeInstance.activateLayerTransform(modal, layerId, layerType);
                    } else {
                        console.warn('⚠️ 无法从图层列表项获取图层ID');
                    }
                }
            };
            
            // 绑定事件监听器
            layersList.addEventListener('click', transformClickHandler);
            layersList._transformClickHandler = transformClickHandler;
            
            console.log('✅ 图层列表变换点击事件绑定完成');
            
        } catch (error) {
            console.error('❌ 绑定图层列表变换事件失败:', error);
        }
    }

    /**
     * 清除图层列表的变换点击事件
     */
    clearLayerListTransformEvents(modal) {
        try {
            const layersList = modal.querySelector('#layers-list');
            if (layersList && layersList._transformClickHandler) {
                layersList.removeEventListener('click', layersList._transformClickHandler);
                delete layersList._transformClickHandler;
                console.log('🗑️ 图层列表变换点击事件已清除');
            }
        } catch (error) {
            console.error('❌ 清除图层列表变换事件失败:', error);
        }
    }

    /**
     * 绑定画布图层的变换点击事件
     */
    bindCanvasLayerTransformEvents(modal) {
        try {
            console.log('🔗 [NEW] 绑定画布图层变换点击事件...');
            
            const canvasContainer = modal.querySelector('#image-canvas');
            if (!canvasContainer) {
                console.warn('⚠️ 画布容器未找到');
                return;
            }
            
            // 清除之前的变换点击监听器（如果存在）
            if (canvasContainer._canvasTransformClickHandler) {
                canvasContainer.removeEventListener('click', canvasContainer._canvasTransformClickHandler);
            }
            
            // 创建画布变换点击处理器
            const canvasTransformClickHandler = (e) => {
                // 检查是否在变换模式下
                if (!modal.transformModeActive) {
                    return;
                }
                
                // 查找被点击的图层元素
                const layerElement = e.target.closest('[id^=\"canvas-layer-\"], [id^=\"annotation-svg-\"]');
                if (layerElement) {
                    // 提取图层ID和类型
                    let layerId = null;
                    let layerType = 'IMAGE_LAYER';
                    
                    if (layerElement.id.startsWith('canvas-layer-')) {
                        layerId = layerElement.id.replace('canvas-layer-', '');
                        layerType = 'connected'; // 或 'IMAGE_LAYER'
                    } else if (layerElement.id.startsWith('annotation-svg-')) {
                        layerId = layerElement.id.replace('annotation-svg-', '');
                        layerType = 'ANNOTATION';
                    }
                    
                    if (layerId) {
                        console.log(`🎯 [CANVAS] 变换模式：选中画布图层 ${layerId} (${layerType})`);
                        
                        // 阻止事件冒泡
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // 调用变换激活函数
                        this.nodeInstance.activateLayerTransform(modal, layerId, layerType);
                    }
                }
            };
            
            // 绑定事件监听器
            canvasContainer.addEventListener('click', canvasTransformClickHandler);
            canvasContainer._canvasTransformClickHandler = canvasTransformClickHandler;
            
            console.log('✅ 画布图层变换点击事件绑定完成');
        } catch (error) {
            console.error('❌ 绑定画布图层变换点击事件失败:', error);
        }
    }

    /**
     * 清除画布图层的变换点击事件
     */
    clearCanvasLayerTransformEvents(modal) {
        try {
            console.log('🧹 清除画布图层变换点击事件...');
            
            const canvasContainer = modal.querySelector('#image-canvas');
            if (canvasContainer && canvasContainer._canvasTransformClickHandler) {
                canvasContainer.removeEventListener('click', canvasContainer._canvasTransformClickHandler);
                delete canvasContainer._canvasTransformClickHandler;
            }
            
            console.log('✅ 画布图层变换点击事件清除完成');
        } catch (error) {
            console.error('❌ 清除画布图层变换点击事件失败:', error);
        }
    }

    /**
     * 绑定绘制工具事件
     */
    bindDrawingToolEvents(modal) {
        console.log('🎨 绑定绘制工具事件...');
        
        // 绑定填充/轮廓切换按钮
        this.bindFillToggleButton(modal);
        
        // 绑定不透明度滑块
        this.bindOpacitySlider(modal);
        
        // 绑定撤销按钮
        this.bindUndoButton(modal);
        
        // 绑定清空按钮
        this.bindClearButton(modal);
        
        // 绑定工具选择器（包括橡皮擦）
        this.bindToolSelector(modal);
        
        console.log('✅ 绘制工具事件绑定完成');
    }

    /**
     * 绑定填充/轮廓切换按钮
     */
    bindFillToggleButton(modal) {
        const fillToggle = modal.querySelector('#vpe-fill-toggle');
        if (fillToggle) {
            // 初始化填充模式
            modal.fillMode = 'filled';
            
            fillToggle.addEventListener('click', () => {
                if (modal.fillMode === 'filled') {
                    modal.fillMode = 'outline';
                    fillToggle.textContent = '⭕ Outline';
                    fillToggle.classList.add('outline');
                    console.log('🔄 切换到轮廓模式');
                } else {
                    modal.fillMode = 'filled';
                    fillToggle.textContent = '🔴 Filled';
                    fillToggle.classList.remove('outline');
                    console.log('🔄 切换到填充模式');
                }
            });
            console.log('✅ 填充/轮廓切换按钮事件绑定完成');
        } else {
            console.warn('⚠️ 填充切换按钮元素未找到');
        }
    }

    /**
     * 绑定不透明度滑块
     */
    bindOpacitySlider(modal) {
        const opacitySlider = modal.querySelector('#vpe-opacity-slider');
        const opacityValue = modal.querySelector('#vpe-opacity-value');
        
        if (opacitySlider && opacityValue) {
            // 初始化不透明度
            modal.currentOpacity = parseInt(opacitySlider.value) || 50;
            
            opacitySlider.addEventListener('input', () => {
                const opacityPercent = parseInt(opacitySlider.value);
                modal.currentOpacity = opacityPercent;
                opacityValue.textContent = opacityPercent + '%';
                
                console.log(`🎨 不透明度调整为: ${opacityPercent}%`);
                
                // 更新所有现有标注的不透明度
                this.updateAllAnnotationsOpacity(modal, opacityPercent);
            });
            console.log('✅ 不透明度滑块事件绑定完成');
        } else {
            console.warn('⚠️ 不透明度滑块元素未找到');
        }
    }

    /**
     * 更新所有标注的不透明度（增强版：支持图层系统）
     */
    updateAllAnnotationsOpacity(modal, opacityPercent) {
        const fillOpacity = opacityPercent / 100;
        const strokeOpacity = Math.min(fillOpacity + 0.3, 1.0);
        let totalUpdated = 0;
        
        // 1. 更新主SVG中的标注
        const mainSvg = modal.querySelector('#drawing-layer svg');
        if (mainSvg) {
            const mainShapes = mainSvg.querySelectorAll('.annotation-shape, [data-annotation-id], [data-annotation-group]');
            mainShapes.forEach(shape => {
                shape.setAttribute('fill-opacity', fillOpacity);
                shape.setAttribute('stroke-opacity', strokeOpacity);
                totalUpdated++;
            });
        }
        
        // 2. 更新独立SVG容器中的标注（图层系统）
        const canvasContainer = modal.querySelector('#canvas-container');
        if (canvasContainer) {
            const independentContainers = canvasContainer.querySelectorAll('[id^="annotation-svg-"]');
            independentContainers.forEach(container => {
                const independentSvg = container.querySelector('svg');
                if (independentSvg) {
                    const independentShapes = independentSvg.querySelectorAll('*[fill], *[stroke]');
                    independentShapes.forEach(shape => {
                        shape.setAttribute('fill-opacity', fillOpacity);
                        shape.setAttribute('stroke-opacity', strokeOpacity);
                        totalUpdated++;
                    });
                }
            });
        }
        
        // 3. 更新image-canvas中的所有SVG标注
        const imageCanvas = modal.querySelector('#image-canvas');
        if (imageCanvas) {
            const canvasShapes = imageCanvas.querySelectorAll('svg *[fill], svg *[stroke]');
            canvasShapes.forEach(shape => {
                if (!shape.closest('#drawing-layer')) { // 避免重复更新主SVG中的元素
                    shape.setAttribute('fill-opacity', fillOpacity);
                    shape.setAttribute('stroke-opacity', strokeOpacity);
                    totalUpdated++;
                }
            });
        }
        
        console.log(`🎨 已更新 ${totalUpdated} 个标注的不透明度 (多重容器)`);
    }

    /**
     * 绑定撤销按钮
     */
    bindUndoButton(modal) {
        const undoBtn = modal.querySelector('#vpe-undo');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                console.log('↶ 撤销按钮点击');
                this.undoLastAnnotation(modal);
            });
            console.log('✅ 撤销按钮事件绑定完成');
        } else {
            console.warn('⚠️ 撤销按钮元素未找到');
        }
    }

    /**
     * 撤销最后一个标注（增强版：支持图层系统）
     */
    undoLastAnnotation(modal) {
        if (!modal.annotations || modal.annotations.length === 0) {
            console.log('⚠️ 没有可撤销的标注');
            return;
        }
        
        const lastAnnotation = modal.annotations.pop();
        console.log('⬅️ 撤销标注:', lastAnnotation.id);
        
        // 使用增强版删除逻辑
        const removedCount = this.removeAnnotationFromDOM(modal, lastAnnotation.id);
        console.log(`🗑️ 从DOM中移除了 ${removedCount} 个相关元素`);
        
        // 更新UI
        this.updateAnnotationUI(modal);
    }

    /**
     * 绑定清空按钮
     */
    bindClearButton(modal) {
        const clearBtn = modal.querySelector('#vpe-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                console.log('🗂️ 清空按钮点击');
                this.clearAllAnnotations(modal);
            });
            console.log('✅ 清空按钮事件绑定完成');
        } else {
            console.warn('⚠️ 清空按钮元素未找到');
        }
    }

    /**
     * 清空所有标注（增强版：支持图层系统）
     */
    clearAllAnnotations(modal) {
        // 获取待删除的标注列表
        const annotationsToRemove = modal.annotations ? [...modal.annotations] : [];
        const count = annotationsToRemove.length;
        
        // 清空annotations数组
        if (modal.annotations) {
            modal.annotations = [];
            console.log(`🗑️ 清空了 ${count} 个标注数据`);
        }
        
        // 使用增强版删除逻辑移除所有标注
        let totalRemoved = 0;
        annotationsToRemove.forEach(annotation => {
            const removed = this.removeAnnotationFromDOM(modal, annotation.id);
            totalRemoved += removed;
        });
        
        // 额外清理：移除所有可能遗留的标注元素
        totalRemoved += this.clearAllRemainingAnnotationElements(modal);
        
        console.log(`🗑️ 从DOM中总共移除了 ${totalRemoved} 个标注元素`);
        
        // 更新UI
        this.updateAnnotationUI(modal);
    }

    /**
     * 从DOM中移除指定标注的所有相关元素（统一删除策略）
     */
    removeAnnotationFromDOM(modal, annotationId) {
        let removedCount = 0;
        
        // 1. 从主SVG中删除（多种选择器策略）
        const mainSvg = modal.querySelector('#drawing-layer svg');
        if (mainSvg) {
            const selectors = [
                `[data-annotation-id="${annotationId}"]`,
                `[data-annotation-group="${annotationId}"]`,
                `.annotation-shape[data-annotation-id="${annotationId}"]`,
                `text[data-annotation-number][data-annotation-id="${annotationId}"]`
            ];
            
            selectors.forEach(selector => {
                const elements = mainSvg.querySelectorAll(selector);
                elements.forEach(el => {
                    el.remove();
                    removedCount++;
                    console.log(`🗑️ 从主SVG移除: ${el.tagName} (${selector})`);
                });
            });
        }
        
        // 2. 删除独立SVG容器（图层系统）
        const independentContainer = modal.querySelector(`#annotation-svg-${annotationId}`);
        if (independentContainer) {
            independentContainer.remove();
            removedCount++;
            console.log(`🗑️ 移除独立SVG容器: annotation-svg-${annotationId}`);
        }
        
        // 3. 从image-canvas中删除相关标注
        const imageCanvas = modal.querySelector('#image-canvas');
        if (imageCanvas) {
            const canvasSelectors = [
                `[data-annotation-id="${annotationId}"]`,
                `[data-annotation-group="${annotationId}"]`
            ];
            
            canvasSelectors.forEach(selector => {
                const elements = imageCanvas.querySelectorAll(selector);
                elements.forEach(el => {
                    el.remove();
                    removedCount++;
                    console.log(`🗑️ 从image-canvas移除: ${el.tagName} (${selector})`);
                });
            });
        }
        
        // 4. 从所有独立SVG容器中删除（图层系统清理）
        const canvasContainer = modal.querySelector('#canvas-container');
        if (canvasContainer) {
            const independentContainers = canvasContainer.querySelectorAll('[id^="annotation-svg-"]');
            independentContainers.forEach(container => {
                const svg = container.querySelector('svg');
                if (svg) {
                    const elements = svg.querySelectorAll(`[data-annotation-id="${annotationId}"], [data-annotation-group="${annotationId}"]`);
                    elements.forEach(el => {
                        el.remove();
                        removedCount++;
                        console.log(`🗑️ 从独立容器移除: ${el.tagName}`);
                    });
                }
            });
        }
        
        return removedCount;
    }

    /**
     * 清理所有可能遗留的标注元素
     */
    clearAllRemainingAnnotationElements(modal) {
        let removedCount = 0;
        
        // 清理主SVG中的所有标注相关元素
        const mainSvg = modal.querySelector('#drawing-layer svg');
        if (mainSvg) {
            const elements = mainSvg.querySelectorAll('.annotation-shape, .annotation-label, text[data-annotation-number], [data-annotation-id], [data-annotation-group]');
            elements.forEach(el => {
                el.remove();
                removedCount++;
            });
        }
        
        // 清理所有独立SVG容器
        const canvasContainer = modal.querySelector('#canvas-container');
        if (canvasContainer) {
            const independentContainers = canvasContainer.querySelectorAll('[id^="annotation-svg-"]');
            independentContainers.forEach(container => {
                container.remove();
                removedCount++;
            });
        }
        
        // 清理image-canvas中的标注元素
        const imageCanvas = modal.querySelector('#image-canvas');
        if (imageCanvas) {
            const elements = imageCanvas.querySelectorAll('[data-annotation-id], [data-annotation-group], .annotation-shape');
            elements.forEach(el => {
                el.remove();
                removedCount++;
            });
        }
        
        return removedCount;
    }

    /**
     * 绑定工具选择器（包括橡皮擦）
     */
    bindToolSelector(modal) {
        const toolButtons = modal.querySelectorAll('.vpe-tool');
        toolButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tool = e.target.dataset.tool;
                console.log(`🔧 选择工具: ${tool}`);
                this.setActiveTool(modal, tool);
            });
        });
        
        if (toolButtons.length > 0) {
            console.log(`✅ 工具选择器事件绑定完成，共 ${toolButtons.length} 个工具`);
        } else {
            console.warn('⚠️ 工具按钮元素未找到');
        }
    }

    /**
     * 设置活动工具
     */
    setActiveTool(modal, tool) {
        // 更新工具状态
        modal.currentTool = tool;
        
        // 更新按钮样式
        const toolButtons = modal.querySelectorAll('.vpe-tool');
        toolButtons.forEach(btn => {
            if (btn.dataset.tool === tool) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 特殊处理橡皮擦模式
        if (tool === 'eraser') {
            this.enableEraserMode(modal);
        } else {
            this.disableEraserMode(modal);
        }
        
        console.log(`🔧 已设置活动工具: ${tool}`);
    }

    /**
     * 启用橡皮擦模式
     */
    enableEraserMode(modal) {
        const svg = modal.querySelector('#drawing-layer svg');
        if (!svg) return;
        
        const shapes = svg.querySelectorAll('.annotation-shape');
        shapes.forEach(shape => {
            shape.style.cursor = 'pointer';
            shape.classList.add('erasable');
            
            // 移除旧的事件监听器
            shape.removeEventListener('click', this.handleEraserClick);
            // 添加新的事件监听器
            shape.addEventListener('click', (e) => this.handleEraserClick(e, modal));
        });
        
        console.log(`🗑️ 橡皮擦模式已启用，${shapes.length} 个标注可被擦除`);
    }

    /**
     * 禁用橡皮擦模式
     */
    disableEraserMode(modal) {
        const svg = modal.querySelector('#drawing-layer svg');
        if (!svg) return;
        
        const shapes = svg.querySelectorAll('.annotation-shape');
        shapes.forEach(shape => {
            shape.style.cursor = '';
            shape.classList.remove('erasable');
            shape.removeEventListener('click', this.handleEraserClick);
        });
        
        console.log('🗑️ 橡皮擦模式已禁用');
    }

    /**
     * 处理橡皮擦点击（增强版：支持图层系统）
     */
    handleEraserClick(e, modal) {
        e.preventDefault();
        e.stopPropagation();
        
        const clickedElement = e.target;
        // 尝试多种方式获取标注ID
        const annotationId = clickedElement.dataset.annotationId || 
                           clickedElement.dataset.annotationGroup ||
                           clickedElement.closest('[data-annotation-id]')?.dataset.annotationId ||
                           clickedElement.closest('[data-annotation-group]')?.dataset.annotationGroup;
        
        if (annotationId && modal.annotations) {
            const annotation = modal.annotations.find(ann => ann.id === annotationId);
            if (annotation) {
                // 从数组中移除
                const index = modal.annotations.findIndex(ann => ann.id === annotationId);
                if (index !== -1) {
                    modal.annotations.splice(index, 1);
                }
                
                // 使用增强版删除逻辑
                const removedCount = this.removeAnnotationFromDOM(modal, annotationId);
                console.log(`🗑️ 橡皮擦删除标注: ${annotationId}，移除了 ${removedCount} 个DOM元素`);
                
                // 更新UI
                this.updateAnnotationUI(modal);
            }
        } else {
            console.warn('⚠️ 橡皮擦无法获取标注ID，元素:', clickedElement);
        }
    }

    /**
     * 更新标注相关UI
     */
    updateAnnotationUI(modal) {
        try {
            // 尝试调用更新对象选择器函数
            import('./visual_prompt_editor_annotations.js').then(module => {
                if (module.updateObjectSelector) {
                    module.updateObjectSelector(modal);
                }
            }).catch(error => {
                console.error('❌ 导入annotations模块失败:', error);
            });
        } catch (error) {
            console.error('❌ 更新标注UI失败:', error);
        }
    }

    /**
     * 绑定操作类型选择器事件
     */
    bindOperationTypeEvents(modal) {
        console.log('🔗 绑定操作类型选择器事件...');
        
        const operationSelect = modal.querySelector('#current-layer-operation');
        if (operationSelect) {
            operationSelect.addEventListener('change', (e) => {
                const selectedOperationType = e.target.value;
                console.log('🔄 操作类型变化:', selectedOperationType);
                
                // 更新提示词选择器
                this.updatePromptSelectors(modal, selectedOperationType);
                
                // 恢复当前选中图层的提示词状态
                this.restorePromptSelections(modal);
            });
            console.log('✅ 操作类型选择器事件绑定完成');
        } else {
            console.warn('⚠️ 操作类型选择器元素未找到');
        }
    }

    /**
     * 更新提示词选择器
     */
    updatePromptSelectors(modal, operationType) {
        console.log(`🔄 开始更新提示词选择器: ${operationType}`);
        
        try {
            // 动态导入prompts模块的更新函数
            import('./visual_prompt_editor_prompts.js').then(module => {
                if (module.updatePromptSelectors) {
                    module.updatePromptSelectors(modal, operationType);
                    console.log(`✅ 提示词选择器已更新: ${operationType}`);
                } else {
                    console.warn('⚠️ updatePromptSelectors函数未找到');
                }
            }).catch(error => {
                console.error('❌ 导入提示词模块失败:', error);
            });
        } catch (error) {
            console.error('❌ 更新提示词选择器失败:', error);
        }
    }

    /**
     * 恢复提示词选择状态
     */
    restorePromptSelections(modal) {
        try {
            // 如果有选中的图层，恢复其提示词选择状态
            if (modal.selectedLayers && modal.selectedLayers.size > 0) {
                const selectedId = Array.from(modal.selectedLayers)[0];
                const annotation = modal.annotations.find(ann => ann.id === selectedId);
                
                if (annotation) {
                    // 动态导入annotations模块的恢复函数
                    import('./visual_prompt_editor_annotations.js').then(module => {
                        if (module.restorePromptSelections) {
                            module.restorePromptSelections(modal, annotation);
                            console.log(`✅ 已恢复图层 ${selectedId} 的提示词选择状态`);
                        }
                    }).catch(error => {
                        console.error('❌ 导入annotations模块失败:', error);
                    });
                }
            }
        } catch (error) {
            console.error('❌ 恢复提示词选择状态失败:', error);
        }
    }

    /**
     * 绑定关闭和保存按钮事件
     */
    bindCloseAndSaveButtons(modal) {
        console.log('🔗 绑定关闭和保存按钮事件...');
        
        // 关闭按钮
        const closeBtn = modal.querySelector('#vpe-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                console.log('🚪 关闭按钮被点击');
                document.body.removeChild(modal);
            };
            console.log('✅ 关闭按钮事件绑定完成');
        } else {
            console.warn('⚠️ 关闭按钮元素未找到');
        }

        // 保存按钮
        const saveBtn = modal.querySelector('#vpe-save');
        if (saveBtn) {
            saveBtn.onclick = () => {
                console.log('💾 保存按钮被点击');
                this.handleSaveAction(modal);
            };
            console.log('✅ 保存按钮事件绑定完成');
        } else {
            console.warn('⚠️ 保存按钮元素未找到');
        }
    }

    /**
     * 处理保存操作
     */
    handleSaveAction(modal) {
        console.log('💾 开始保存操作...');
        
        try {
            // 动态导入exportPromptData函数
            import('./visual_prompt_editor_prompts.js').then(module => {
                const { exportPromptData } = module;
                
                // 检查modal.annotations是否存在
                console.log('🔍 检查modal.annotations:', {
                    exists: !!modal.annotations,
                    length: modal.annotations?.length || 0,
                    data: modal.annotations
                });
                
                // 检查SVG中的标注元素
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
                    
                    if (promptData.annotations && promptData.annotations.length > 0) {
                        console.log('📊 保存的标注详情:');
                        promptData.annotations.forEach((annotation, index) => {
                            console.log(`📍 标注${index + 1}:`, {
                                id: annotation.id,
                                type: annotation.type,
                                description: annotation.description,
                                hasGeometry: !!annotation.geometry
                            });
                        });
                    } else {
                        console.log('⚠️ 没有标注数据要保存');
                    }
                    
                    // 保存到节点的annotation_data widget
                    const annotationDataWidget = this.nodeInstance.widgets?.find(w => w.name === "annotation_data");
                    if (annotationDataWidget) {
                        annotationDataWidget.value = JSON.stringify(promptData);
                        
                        // 同步到后端节点参数
                        if (typeof app !== 'undefined' && app.graph) {
                            app.graph.setDirtyCanvas(true);
                        }
                        console.log('✅ 数据已保存并同步到后端节点');
                        
                        // 显示成功提示
                        this.showSaveSuccessNotification();
                    } else {
                        console.warn('⚠️ annotation_data widget未找到');
                    }
                } else {
                    console.warn('⚠️ 导出提示词数据失败');
                }
            }).catch(error => {
                console.error('❌ 导入exportPromptData函数失败:', error);
            });
        } catch (error) {
            console.error('❌ 保存操作失败:', error);
        }
    }

    /**
     * 显示保存成功提示
     */
    showSaveSuccessNotification() {
        try {
            // 尝试使用KontextUtils显示通知
            if (typeof KontextUtils !== 'undefined' && KontextUtils.showNotification) {
                KontextUtils.showNotification('数据已保存并同步到后端节点', 'success');
            } else {
                // 备用方案：简单的alert
                alert('数据已保存成功！');
            }
        } catch (error) {
            console.error('❌ 显示保存成功提示失败:', error);
        }
    }

    /**
     * 更新对象选择状态（标注勾选处理）
     */
    updateObjectSelection(modal, annotationId, isSelected) {
        console.log(`🔄 更新对象选择状态: ${annotationId} = ${isSelected}`);
        
        try {
            // 确保选中图层集合存在
            if (!modal.selectedLayers) {
                modal.selectedLayers = new Set();
            }
            
            // 更新选中状态
            if (isSelected) {
                modal.selectedLayers.add(annotationId);
            } else {
                modal.selectedLayers.delete(annotationId);
            }
            
            // 更新UI显示
            this.updateDropdownText(modal);
            this.updateSelectionCount(modal);
            
            // 更新提示词区域（恢复图层设置）
            this.restoreLayerSettings(modal);
            
            console.log(`✅ 对象选择状态已更新: ${annotationId} = ${isSelected}, 总选中: ${modal.selectedLayers.size}`);
        } catch (error) {
            console.error('❌ 更新对象选择状态失败:', error);
        }
    }

    /**
     * 更新下拉框显示文本
     */
    updateDropdownText(modal) {
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
                const layerName = `Layer ${(annotation.number || 0) + 1}`;
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
    }

    /**
     * 更新选中计数显示
     */
    updateSelectionCount(modal) {
        const countElement = modal.querySelector('#selection-count');
        if (!countElement || !modal.selectedLayers) return;
        
        const selectedCount = modal.selectedLayers.size;
        countElement.textContent = `${selectedCount} selected`;
    }

    /**
     * 恢复图层设置（更新提示词区域）
     */
    restoreLayerSettings(modal) {
        try {
            // 如果有选中的图层，恢复第一个图层的设置
            if (modal.selectedLayers && modal.selectedLayers.size > 0) {
                const selectedId = Array.from(modal.selectedLayers)[0];
                const annotation = modal.annotations.find(ann => ann.id === selectedId);
                
                if (annotation) {
                    // 更新操作类型
                    const operationSelect = modal.querySelector('#current-layer-operation');
                    if (operationSelect && annotation.operationType) {
                        operationSelect.value = annotation.operationType;
                        console.log(`🔄 恢复操作类型: ${annotation.operationType}`);
                        
                        // 触发操作类型变化事件，更新提示词选择器
                        const changeEvent = new Event('change', { bubbles: true });
                        operationSelect.dispatchEvent(changeEvent);
                    }
                    
                    // 更新描述
                    const descriptionTextarea = modal.querySelector('#current-layer-description');
                    if (descriptionTextarea && annotation.description) {
                        descriptionTextarea.value = annotation.description;
                    }
                    
                    console.log(`✅ 已恢复图层 ${selectedId} 的设置`);
                }
            } else {
                // 没有选中图层时，清空设置
                const operationSelect = modal.querySelector('#current-layer-operation');
                const descriptionTextarea = modal.querySelector('#current-layer-description');
                
                if (operationSelect) operationSelect.value = 'add_object';
                if (descriptionTextarea) descriptionTextarea.value = '';
                
                console.log('🔄 已清空图层设置');
            }
        } catch (error) {
            console.error('❌ 恢复图层设置失败:', error);
        }
    }

    /**
     * 绑定所有事件
     */
    bindAllEvents(modal) {
        console.log('🔗 开始绑定所有事件处理器...');
        
        try {
            this.bindBasicEvents(modal);
            this.bindDropdownEventsForRestore(modal);
            
            console.log('✅ 所有事件处理器绑定完成');
        } catch (error) {
            console.error('❌ 事件处理器绑定失败:', error);
        }
    }

    /**
     * 清理所有事件监听器
     */
    cleanup() {
        console.log('🧹 清理事件处理器...');
        // 这里可以添加清理逻辑
        console.log('✅ 事件处理器清理完成');
    }
}

// 导出创建函数
export function createEventHandlers(nodeInstance) {
    return new EventHandlers(nodeInstance);
}
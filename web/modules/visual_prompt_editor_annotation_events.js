/**
 * Visual Prompt Editor - 标注事件处理模块
 * 负责标注的交互事件处理、选择管理和面板操作
 */

export class AnnotationEventHandler {
    constructor(nodeInstance) {
        this.nodeInstance = nodeInstance;
        this.selectedAnnotations = new Set();
    }

    /**
     * 为恢复的标注绑定事件
     */
    bindRestoredAnnotationEvents(modal) {
        console.log('🔗 为恢复的标注绑定事件...');
        
        // 绑定标注选择事件
        this.bindAnnotationSelectionEvents(modal);
        
        // 绑定标注面板事件
        this.bindAnnotationPanelEvents(modal);
        
        // 绑定键盘事件
        this.bindAnnotationKeyboardEvents(modal);
        
        console.log('✅ 标注事件绑定完成');
    }

    /**
     * 绑定标注选择事件
     */
    bindAnnotationSelectionEvents(modal) {
        const svg = modal.querySelector('#drawing-layer svg');
        if (!svg) {
            return;
        }
        
        // 使用事件委托处理标注点击
        svg.addEventListener('click', (e) => {
            const annotationElement = e.target.closest('[data-annotation-group]');
            if (annotationElement) {
                e.stopPropagation();
                const annotationId = annotationElement.getAttribute('data-annotation-group');
                this.handleAnnotationClick(modal, annotationId, e);
            }
        });
        
        // 处理标注双击
        svg.addEventListener('dblclick', (e) => {
            const annotationElement = e.target.closest('[data-annotation-group]');
            if (annotationElement) {
                e.stopPropagation();
                const annotationId = annotationElement.getAttribute('data-annotation-group');
                this.handleAnnotationDoubleClick(modal, annotationId, e);
            }
        });
        
        // 处理鼠标悬停
        svg.addEventListener('mouseover', (e) => {
            const annotationElement = e.target.closest('[data-annotation-group]');
            if (annotationElement) {
                this.handleAnnotationHover(modal, annotationElement, true);
            }
        });
        
        svg.addEventListener('mouseout', (e) => {
            const annotationElement = e.target.closest('[data-annotation-group]');
            if (annotationElement) {
                this.handleAnnotationHover(modal, annotationElement, false);
            }
        });
    }

    /**
     * 处理标注点击
     */
    handleAnnotationClick(modal, annotationId, event) {
        console.log('🎯 标注点击:', annotationId);
        
        // 检查是否按住了Ctrl键进行多选
        if (event.ctrlKey || event.metaKey) {
            this.toggleAnnotationSelection(modal, annotationId);
        } else {
            this.selectSingleAnnotation(modal, annotationId);
        }
        
        // 更新面板显示
        this.updateAnnotationPanelDisplay(modal);
        
        // 在面板中选择对应的标注
        this.selectAnnotationInPanel(modal, annotationId);
    }

    /**
     * 处理标注双击
     */
    handleAnnotationDoubleClick(modal, annotationId, event) {
        console.log('🖱️ 标注双击:', annotationId);
        
        // 双击进入编辑模式
        this.enterEditMode(modal, annotationId);
    }

    /**
     * 处理标注悬停
     */
    handleAnnotationHover(modal, annotationElement, isHovering) {
        if (isHovering) {
            annotationElement.style.filter = 'brightness(1.2) drop-shadow(0 0 5px rgba(255,255,255,0.3))';
        } else {
            // 如果不是选中状态，清除高亮
            const annotationId = annotationElement.getAttribute('data-annotation-group');
            if (!this.selectedAnnotations.has(annotationId)) {
                annotationElement.style.filter = '';
            }
        }
    }

    /**
     * 选择单个标注
     */
    selectSingleAnnotation(modal, annotationId) {
        // 清除之前的选择
        this.clearAllSelections(modal);
        
        // 选择新的标注
        this.selectedAnnotations.add(annotationId);
        
        // 更新视觉状态
        this.updateAnnotationVisualState(modal, annotationId, true);
        
        // 更新modal的选择状态
        if (!modal.selectedLayers) {
            modal.selectedLayers = new Set();
        }
        modal.selectedLayers.clear();
        modal.selectedLayers.add(annotationId);
    }

    /**
     * 切换标注选择状态
     */
    toggleAnnotationSelection(modal, annotationId) {
        if (this.selectedAnnotations.has(annotationId)) {
            this.selectedAnnotations.delete(annotationId);
            this.updateAnnotationVisualState(modal, annotationId, false);
            modal.selectedLayers?.delete(annotationId);
        } else {
            this.selectedAnnotations.add(annotationId);
            this.updateAnnotationVisualState(modal, annotationId, true);
            if (!modal.selectedLayers) {
                modal.selectedLayers = new Set();
            }
            modal.selectedLayers.add(annotationId);
        }
    }

    /**
     * 清除所有选择
     */
    clearAllSelections(modal) {
        console.log('🧹 清除所有选择，当前选中:', this.selectedAnnotations.size);
        
        this.selectedAnnotations.forEach(annotationId => {
            this.updateAnnotationVisualState(modal, annotationId, false);
        });
        
        this.selectedAnnotations.clear();
        modal.selectedLayers?.clear();
        
        // 🔧 同步主文件的选择状态
        if (modal.annotations) {
            modal.annotations.forEach(annotation => {
                annotation.selected = false;
            });
        }
        
        console.log('✅ 所有选择已清除');
    }

    /**
     * 更新标注视觉状态
     */
    updateAnnotationVisualState(modal, annotationId, isSelected) {
        console.log(`🔄 更新标注视觉状态: ${annotationId}, 选中: ${isSelected}`);
        
        const annotationElement = modal.querySelector(`[data-annotation-group="${annotationId}"]`);
        if (annotationElement) {
            if (isSelected) {
                annotationElement.style.filter = 'brightness(1.3) drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))';
            } else {
                annotationElement.style.filter = '';
            }
            console.log(`✅ 更新画布标注视觉状态: ${annotationId}`);
        } else {
            console.warn(`⚠️ 未找到画布标注元素: [data-annotation-group="${annotationId}"]`);
        }
        
        // 更新复选框状态 - 尝试多种选择器
        let checkbox = modal.querySelector(`input[data-annotation-id="${annotationId}"]`);
        if (!checkbox) {
            // 尝试其他可能的选择器
            checkbox = modal.querySelector(`input[data-layer-id="${annotationId}"]`);
        }
        if (!checkbox) {
            // 尝试在图层项内查找
            const layerItem = modal.querySelector(`[data-layer-id="${annotationId}"]`);
            if (layerItem) {
                checkbox = layerItem.querySelector('input[type="checkbox"]');
            }
        }
        
        if (checkbox) {
            checkbox.checked = isSelected;
            console.log(`✅ 更新复选框状态: ${annotationId}, checked: ${isSelected}`);
        } else {
            console.warn(`⚠️ 未找到复选框: ${annotationId}`);
            // 调试：列出所有可用的复选框
            const allCheckboxes = modal.querySelectorAll('input[type="checkbox"]');
            console.log('🔍 所有复选框:', Array.from(allCheckboxes).map(cb => ({
                dataAnnotationId: cb.getAttribute('data-annotation-id'),
                dataLayerId: cb.getAttribute('data-layer-id'),
                checked: cb.checked
            })));
        }
    }

    /**
     * 在面板中选择标注
     */
    selectAnnotationInPanel(modal, annotationId) {
        const layerItem = modal.querySelector(`[data-layer-id="${annotationId}"]`);
        if (layerItem) {
            // 滚动到可见位置
            layerItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // 添加临时高亮效果
            layerItem.style.background = '#3b82f6';
            setTimeout(() => {
                layerItem.style.background = '';
            }, 1000);
        }
    }

    /**
     * 在画布上高亮标注
     */
    highlightAnnotationOnCanvas(modal, annotationId) {
        const annotationElement = modal.querySelector(`[data-annotation-group="${annotationId}"]`);
        if (annotationElement) {
            // 添加临时闪烁效果
            let blinkCount = 0;
            const blinkInterval = setInterval(() => {
                annotationElement.style.opacity = annotationElement.style.opacity === '0.5' ? '1' : '0.5';
                blinkCount++;
                
                if (blinkCount >= 6) {
                    clearInterval(blinkInterval);
                    annotationElement.style.opacity = '1';
                }
            }, 200);
        }
    }

    /**
     * 绑定标注面板事件
     */
    bindAnnotationPanelEvents(modal) {
        // 绑定图层列表中的标注点击事件
        const layersList = modal.querySelector('#layers-list');
        if (layersList) {
            layersList.addEventListener('click', (e) => {
                const layerItem = e.target.closest('[data-layer-type="annotation"]');
                if (layerItem) {
                    const annotationId = layerItem.getAttribute('data-layer-id');
                    this.highlightAnnotationOnCanvas(modal, annotationId);
                }
            });
        }
        
        // 🔧 绑定复选框变化事件（修复手动勾选问题）
        this.bindCheckboxEvents(modal);
        
        // 绑定操作按钮事件
        this.bindOperationButtonEvents(modal);
    }

    /**
     * 绑定复选框变化事件
     */
    bindCheckboxEvents(modal) {
        console.log('🔗 绑定复选框变化事件...');
        
        // 使用事件委托绑定所有标注复选框的变化事件
        const layersList = modal.querySelector('#layers-list');
        if (layersList) {
            layersList.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox' && e.target.hasAttribute('data-annotation-id')) {
                    const annotationId = e.target.getAttribute('data-annotation-id');
                    const isChecked = e.target.checked;
                    
                    console.log(`🔄 复选框手动切换: ${annotationId}, checked: ${isChecked}`);
                    
                    // 更新内部状态
                    if (isChecked) {
                        this.selectedAnnotations.add(annotationId);
                        if (!modal.selectedLayers) {
                            modal.selectedLayers = new Set();
                        }
                        modal.selectedLayers.add(annotationId);
                        
                        // 🔧 同步主文件的标注状态
                        const annotation = modal.annotations?.find(ann => ann.id === annotationId);
                        if (annotation) {
                            annotation.selected = true;
                        }
                        
                        // 更新画布视觉状态（不包括复选框，避免循环）
                        this.updateCanvasVisualState(modal, annotationId, true);
                    } else {
                        this.selectedAnnotations.delete(annotationId);
                        modal.selectedLayers?.delete(annotationId);
                        
                        // 🔧 同步主文件的标注状态
                        const annotation = modal.annotations?.find(ann => ann.id === annotationId);
                        if (annotation) {
                            annotation.selected = false;
                        }
                        
                        // 更新画布视觉状态
                        this.updateCanvasVisualState(modal, annotationId, false);
                    }
                    
                    // 更新面板显示
                    this.updateAnnotationPanelDisplay(modal);
                    
                    console.log(`✅ 复选框状态同步完成，当前选中: ${this.selectedAnnotations.size}`);
                }
            });
            
            console.log('✅ 复选框事件绑定完成');
        } else {
            console.warn('⚠️ 未找到图层列表，无法绑定复选框事件');
        }
    }

    /**
     * 仅更新画布视觉状态（不包括复选框）
     */
    updateCanvasVisualState(modal, annotationId, isSelected) {
        const annotationElement = modal.querySelector(`[data-annotation-group="${annotationId}"]`);
        if (annotationElement) {
            if (isSelected) {
                annotationElement.style.filter = 'brightness(1.3) drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))';
            } else {
                annotationElement.style.filter = '';
            }
        }
    }

    /**
     * 绑定操作按钮事件
     */
    bindOperationButtonEvents(modal) {
        // 删除按钮
        const deleteBtn = modal.querySelector('#delete-selected-annotations');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteSelectedAnnotations(modal);
            });
        }
        
        // 复制按钮
        const copyBtn = modal.querySelector('#copy-selected-annotations');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copySelectedAnnotations(modal);
            });
        }
        
        // 图层面板全选按钮
        const selectAllBtn = modal.querySelector('#select-all-layers');
        if (selectAllBtn) {
            console.log('✅ 找到图层面板全选按钮，绑定事件...');
            selectAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎯 图层面板全选按钮点击');
                this.selectAllAnnotations(modal);
            });
        } else {
            console.warn('⚠️ 未找到图层面板全选按钮 #select-all-layers');
        }
        
        // 图层面板清空选择按钮
        const clearBtn = modal.querySelector('#clear-selection');
        if (clearBtn) {
            console.log('✅ 找到图层面板清除按钮，绑定事件...');
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🧹 图层面板清除按钮点击');
                console.log('🧹 清除前状态:', {
                    selectedAnnotations: this.selectedAnnotations.size,
                    modalAnnotations: modal.annotations?.length || 0,
                    modalSelectedLayers: modal.selectedLayers?.size || 0
                });
                this.clearAllSelections(modal);
                this.updateAnnotationPanelDisplay(modal);
            });
        } else {
            console.warn('⚠️ 未找到图层面板清除按钮 #clear-selection');
            // 调试：列出所有可用的按钮
            const allButtons = modal.querySelectorAll('button');
            console.log('🔍 所有按钮:', Array.from(allButtons).map(btn => ({
                id: btn.id,
                textContent: btn.textContent?.trim()
            })));
        }
    }

    /**
     * 绑定键盘事件
     */
    bindAnnotationKeyboardEvents(modal) {
        document.addEventListener('keydown', (e) => {
            // 只在模态窗口打开时处理键盘事件
            if (!modal.style.display || modal.style.display === 'none') {
                return;
            }
            
            // 检查焦点是否在输入框中
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    this.deleteSelectedAnnotations(modal);
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.clearAllSelections(modal);
                    this.updateAnnotationPanelDisplay(modal);
                    break;
                case 'a':
                case 'A':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.selectAllAnnotations(modal);
                    }
                    break;
                case 'c':
                case 'C':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.copySelectedAnnotations(modal);
                    }
                    break;
            }
        });
    }

    /**
     * 删除选中的标注
     */
    deleteSelectedAnnotations(modal) {
        if (this.selectedAnnotations.size === 0) {
            return;
        }
        
        console.log('🗑️ 删除选中的标注:', Array.from(this.selectedAnnotations));
        
        this.selectedAnnotations.forEach(annotationId => {
            // 从数据中移除
            if (modal.annotations) {
                const index = modal.annotations.findIndex(ann => ann.id === annotationId);
                if (index !== -1) {
                    modal.annotations.splice(index, 1);
                }
            }
            
            // 从SVG中移除
            const annotationElement = modal.querySelector(`[data-annotation-group="${annotationId}"]`);
            if (annotationElement) {
                annotationElement.remove();
            }
        });
        
        // 清除选择状态
        this.clearAllSelections(modal);
        
        // 更新UI
        this.updateAnnotationPanelDisplay(modal);
        if (typeof this.nodeInstance.updateObjectSelector === 'function') {
            this.nodeInstance.updateObjectSelector(modal);
        }
    }

    /**
     * 复制选中的标注
     */
    copySelectedAnnotations(modal) {
        if (this.selectedAnnotations.size === 0) {
            return;
        }
        
        console.log('📋 复制选中的标注:', Array.from(this.selectedAnnotations));
        
        const newAnnotations = [];
        this.selectedAnnotations.forEach(annotationId => {
            const annotation = modal.annotations?.find(ann => ann.id === annotationId);
            if (annotation) {
                const newAnnotation = {
                    ...annotation,
                    id: `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    start: {
                        x: annotation.start.x + 20,
                        y: annotation.start.y + 20
                    },
                    end: {
                        x: annotation.end.x + 20,
                        y: annotation.end.y + 20
                    }
                };
                
                newAnnotations.push(newAnnotation);
                modal.annotations.push(newAnnotation);
            }
        });
        
        // 恢复新标注到画布
        if (newAnnotations.length > 0 && this.nodeInstance.annotationRestorer) {
            newAnnotations.forEach(annotation => {
                this.nodeInstance.annotationRestorer.restoreSingleAnnotation(
                    modal, 
                    modal.querySelector('#drawing-layer svg'), 
                    annotation, 
                    modal.annotations.length - 1
                );
            });
        }
        
        // 更新UI
        this.updateAnnotationPanelDisplay(modal);
        if (typeof this.nodeInstance.updateObjectSelector === 'function') {
            this.nodeInstance.updateObjectSelector(modal);
        }
    }

    /**
     * 全选标注
     */
    selectAllAnnotations(modal) {
        if (!modal.annotations || modal.annotations.length === 0) {
            console.log('⚠️ 没有标注可选择');
            return;
        }
        
        console.log('🎯 全选所有标注，共', modal.annotations.length, '个');
        
        // 清除现有选择
        this.clearAllSelections(modal);
        
        // 选择所有标注
        modal.annotations.forEach(annotation => {
            this.selectedAnnotations.add(annotation.id);
            this.updateAnnotationVisualState(modal, annotation.id, true);
            
            if (!modal.selectedLayers) {
                modal.selectedLayers = new Set();
            }
            modal.selectedLayers.add(annotation.id);
            
            // 🔧 同步主文件的选择状态
            annotation.selected = true;
        });
        
        // 更新面板显示
        this.updateAnnotationPanelDisplay(modal);
        
        console.log('✅ 已选择', this.selectedAnnotations.size, '个标注');
    }

    /**
     * 进入编辑模式
     */
    enterEditMode(modal, annotationId) {
        console.log('✏️ 进入编辑模式:', annotationId);
        
        // 找到标注数据
        const annotation = modal.annotations?.find(ann => ann.id === annotationId);
        if (!annotation) {
            return;
        }
        
        // 显示编辑面板或属性对话框
        this.showAnnotationEditDialog(modal, annotation);
    }

    /**
     * 显示标注编辑对话框
     */
    showAnnotationEditDialog(modal, annotation) {
        // 创建简单的编辑对话框
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #2b2b2b;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 20px;
            z-index: 20000;
            min-width: 300px;
            color: #e5e7eb;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #e5e7eb;">编辑标注</h3>
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px;">颜色:</label>
                <input type="color" id="edit-color" value="${annotation.color}" style="width: 50px; height: 30px;">
            </div>
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 5px;">不透明度:</label>
                <input type="range" id="edit-opacity" min="0" max="100" value="${annotation.opacity || 50}" style="width: 100%;">
                <span id="opacity-display">${annotation.opacity || 50}%</span>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">填充模式:</label>
                <select id="edit-fill-mode" style="width: 100%; padding: 5px; background: #1a1a1a; color: #e5e7eb; border: 1px solid #444;">
                    <option value="filled" ${annotation.fillMode === 'filled' ? 'selected' : ''}>填充</option>
                    <option value="outline" ${annotation.fillMode === 'outline' ? 'selected' : ''}>轮廓</option>
                </select>
            </div>
            <div style="text-align: right;">
                <button id="cancel-edit" style="margin-right: 10px; padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">取消</button>
                <button id="save-edit" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">保存</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 绑定不透明度滑块事件
        const opacitySlider = dialog.querySelector('#edit-opacity');
        const opacityDisplay = dialog.querySelector('#opacity-display');
        opacitySlider.addEventListener('input', (e) => {
            opacityDisplay.textContent = e.target.value + '%';
        });
        
        // 绑定按钮事件
        dialog.querySelector('#cancel-edit').addEventListener('click', () => {
            dialog.remove();
        });
        
        dialog.querySelector('#save-edit').addEventListener('click', () => {
            // 保存修改
            annotation.color = dialog.querySelector('#edit-color').value;
            annotation.opacity = parseInt(dialog.querySelector('#edit-opacity').value);
            annotation.fillMode = dialog.querySelector('#edit-fill-mode').value;
            
            // 更新SVG元素
            this.updateAnnotationAppearance(modal, annotation);
            
            dialog.remove();
        });
    }

    /**
     * 更新标注外观
     */
    updateAnnotationAppearance(modal, annotation) {
        const annotationElement = modal.querySelector(`[data-annotation-group="${annotation.id}"]`);
        if (annotationElement) {
            // 更新颜色和样式
            const shapes = annotationElement.querySelectorAll('rect, ellipse, polygon, path, line');
            shapes.forEach(shape => {
                shape.setAttribute('stroke', annotation.color);
                if (annotation.fillMode === 'filled') {
                    shape.setAttribute('fill', annotation.color);
                    shape.setAttribute('fill-opacity', annotation.opacity / 100);
                } else {
                    shape.setAttribute('fill', 'none');
                }
            });
        }
    }

    /**
     * 更新标注面板显示
     */
    updateAnnotationPanelDisplay(modal) {
        // 更新选择计数（检查多个可能的选择器）
        const selectionCount = modal.querySelector('#selection-count') || 
                              modal.querySelector('#selection-count-info');
        if (selectionCount) {
            selectionCount.textContent = `${this.selectedAnnotations.size} selected`;
        }
        
        // 更新操作面板可见性
        const layerOperations = modal.querySelector('#layer-operations');
        if (layerOperations) {
            layerOperations.style.display = this.selectedAnnotations.size > 0 ? 'block' : 'none';
        }
        
        // 更新全选按钮状态
        const selectAllBtn = modal.querySelector('#select-all-layers');
        if (selectAllBtn && modal.annotations) {
            const totalAnnotations = modal.annotations.length;
            const selectedCount = this.selectedAnnotations.size;
            
            if (selectedCount === 0) {
                selectAllBtn.textContent = '📋 Select All';
                selectAllBtn.style.background = '#2196F3';
            } else if (selectedCount === totalAnnotations) {
                selectAllBtn.textContent = '☑️ All Selected';
                selectAllBtn.style.background = '#10b981';
            } else {
                selectAllBtn.textContent = `📋 Select All (${selectedCount}/${totalAnnotations})`;
                selectAllBtn.style.background = '#ff9800';
            }
        }
    }

    /**
     * 获取选中的标注数量
     */
    getSelectedCount() {
        return this.selectedAnnotations.size;
    }

    /**
     * 获取选中的标注ID列表
     */
    getSelectedAnnotationIds() {
        return Array.from(this.selectedAnnotations);
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.selectedAnnotations.clear();
    }
}

/**
 * 撤销最后一个标注
 * 从主文件迁移的标注处理逻辑
 */
export function undoLastAnnotation(modal, nodeInstance) {
    console.log('↶ 尝试撤销最后一个标注...');
    
    if (!modal.annotations || modal.annotations.length === 0) {
        console.log('⚠️ 没有可撤销的标注');
        return;
    }
    
    const lastAnnotation = modal.annotations.pop();
    console.log('↶ 撤销标注:', lastAnnotation.id, '类型:', lastAnnotation.type);
    
    // 从主SVG中查找和移除标注元素
    const svg = modal.querySelector('#drawing-layer svg');
    if (svg) {
        console.log('🔍 检查主SVG中的元素...');
        
        // 查找所有可能的相关元素
        const allAnnotationElements = svg.querySelectorAll(`*[data-annotation-id="${lastAnnotation.id}"]`);
        const allNumberElements = svg.querySelectorAll(`*[data-annotation-number="${lastAnnotation.number}"]`);
        const annotationGroups = svg.querySelectorAll(`[data-annotation-group="${lastAnnotation.id}"]`);
        const classElements = svg.querySelectorAll(`.annotation-${lastAnnotation.id}`);
        
        console.log('📊 主SVG中找到的元素:', {
            'data-annotation-id': allAnnotationElements.length,
            'data-annotation-number': allNumberElements.length, 
            'data-annotation-group': annotationGroups.length,
            'class-annotation': classElements.length
        });
        
        // 移除所有找到的元素
        [...allAnnotationElements, ...allNumberElements, ...annotationGroups, ...classElements].forEach(el => {
            console.log('🗑️ 从主SVG移除:', el.tagName, el.getAttribute('class'), el.dataset);
            el.remove();
        });
    } else {
        console.log('❌ 未找到主SVG');
    }
    
    // 检查独立SVG容器
    const imageCanvas = modal.querySelector('#image-canvas');
    if (imageCanvas) {
        console.log('🔍 检查独立容器中的元素...');
        
        // 查找目标容器
        const annotationContainer = imageCanvas.querySelector(`#annotation-svg-${lastAnnotation.id}`);
        
        if (annotationContainer) {
            console.log('✅ 找到独立容器:', annotationContainer.id);
            annotationContainer.remove();
            console.log('✅ 已移除独立标注容器');
        } else {
            console.log('❌ 未找到独立容器: #annotation-svg-' + lastAnnotation.id);
        }
        
        // 额外的全局搜索
        console.log('🔍 在image-canvas中全局搜索相关元素...');
        const allRelatedById = imageCanvas.querySelectorAll(`*[data-annotation-id="${lastAnnotation.id}"]`);
        const allRelatedByNumber = imageCanvas.querySelectorAll(`*[data-annotation-number="${lastAnnotation.number}"]`);
        const allRelatedByGroup = imageCanvas.querySelectorAll(`*[data-annotation-group="${lastAnnotation.id}"]`);
        
        // 移除所有找到的相关元素
        [...allRelatedById, ...allRelatedByNumber, ...allRelatedByGroup].forEach(el => {
            console.log('🗑️ 从image-canvas全局移除:', el.tagName, el.getAttribute('class'), el.dataset);
            el.remove();
        });
    } else {
        console.log('❌ 未找到image-canvas');
    }
    
    // 强制更新图层面板
    if (!modal.annotations || modal.annotations.length === 0) {
        const annotationObjects = modal.cachedElements?.annotationObjects || modal.querySelector('#annotation-objects');
        if (annotationObjects) {
            annotationObjects.innerHTML = '<p style="color: #888; font-style: italic; text-align: center; padding: 20px;">No annotations to display</p>';
        }
    } else {
        if (nodeInstance && nodeInstance.loadLayersToPanel) {
            nodeInstance.loadLayersToPanel(modal, modal.annotations);
        }
    }
    
    // 强制刷新图层列表显示
    if (nodeInstance && nodeInstance.updateLayersListDisplay && nodeInstance.getAllLayersInOrder) {
        nodeInstance.updateLayersListDisplay(modal, nodeInstance.getAllLayersInOrder(modal));
    }
    
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
}

/**
 * 清空所有标注
 * 从主文件迁移的标注清理逻辑
 */  
export function clearAllAnnotations(modal, nodeInstance) {
    console.log('🧹 开始清空所有标注...');
    
    // 清空annotations数组
    if (modal.annotations) {
        console.log('🗑️ 清空', modal.annotations.length, '个标注数据');
        modal.annotations = [];
    }
    
    // 清空主SVG中的标注元素
    const svg = modal.querySelector('#drawing-layer svg');
    if (svg) {
        const shapes = svg.querySelectorAll('.annotation-shape');
        const labels = svg.querySelectorAll('.annotation-label');
        const texts = svg.querySelectorAll('text[data-annotation-number]');
        
        // 清除预览元素
        const previewElements = svg.querySelectorAll('.shape-preview, .freehand-preview, .brush-preview-path');
        
        // 清除箭头标记
        const defs = svg.querySelector('defs');
        let arrowMarkers = [];
        if (defs) {
            arrowMarkers = defs.querySelectorAll('marker[id^="arrowhead-"]');
        }
        
        console.log('🗑️ 清空主SVG元素:', {
            shapes: shapes.length,
            labels: labels.length, 
            texts: texts.length,
            previews: previewElements.length,
            arrows: arrowMarkers.length
        });
        
        // 移除所有相关元素
        shapes.forEach(el => el.remove());
        labels.forEach(el => el.remove());
        texts.forEach(el => el.remove());
        previewElements.forEach(el => el.remove());
        arrowMarkers.forEach(el => el.remove());
    }
    
    // 清空独立SVG容器中的标注元素
    const imageCanvas = modal.querySelector('#image-canvas');
    if (imageCanvas) {
        const annotationContainers = imageCanvas.querySelectorAll('[id^="annotation-svg-"]');
        console.log('🗑️ 清空', annotationContainers.length, '个独立标注容器');
        annotationContainers.forEach(container => {
            console.log('🗑️ 移除标注容器:', container.id);
            container.remove();
        });
    }
    
    // 更新图层面板
    const annotationObjects = modal.cachedElements?.annotationObjects || modal.querySelector('#annotation-objects');
    if (annotationObjects) {
        annotationObjects.innerHTML = '<p style="color: #888; font-style: italic; text-align: center; padding: 20px;">No annotations to display</p>';
    }
    
    // 清空图层列表
    if (nodeInstance && nodeInstance.clearAnnotationLayersFromPanel) {
        nodeInstance.clearAnnotationLayersFromPanel(modal);
    }
    
    // 重置Select All状态
    const selectAllCheckbox = modal.querySelector('#select-all-objects');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
    
    // 清除变换状态
    if (modal.transformState) {
        modal.transformState.active = false;
        modal.transformState.layerId = null;
        modal.transformState.layerType = null;
        const transformControls = modal.querySelector('#transform-controls');
        if (transformControls) {
            transformControls.style.display = 'none';
        }
    }
    
    console.log('✅ 已清空所有标注');
}

// 导出创建函数
export function createAnnotationEventHandler(nodeInstance) {
    return new AnnotationEventHandler(nodeInstance);
}
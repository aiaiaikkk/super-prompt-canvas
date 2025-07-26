/**
 * Visual Prompt Editor - 标注恢复逻辑模块
 * 负责将保存的标注数据恢复到画布上
 */

import { createSVGAnnotationCreator } from './visual_prompt_editor_svg_creator.js';

export class AnnotationRestorer {
    constructor(nodeInstance) {
        this.nodeInstance = nodeInstance;
        this.svgCreator = createSVGAnnotationCreator();
    }

    /**
     * 恢复标注到画布
     */
    async restoreAnnotationsToCanvas(modal, annotations) {
        console.log('🔄 开始恢复标注到画布...');
        
        if (!annotations || annotations.length === 0) {
            console.log('📝 没有标注需要恢复');
            return;
        }
        
        const svg = modal.querySelector('#drawing-layer svg');
        if (!svg) {
            console.error('❌ 未找到SVG绘制层');
            return;
        }
        
        console.log(`📝 准备恢复 ${annotations.length} 个标注`);
        
        // 清空现有标注
        this.clearExistingAnnotations(svg);
        
        // 逐个恢复标注
        for (let i = 0; i < annotations.length; i++) {
            const annotation = annotations[i];
            try {
                await this.restoreSingleAnnotation(modal, svg, annotation, i);
            } catch (error) {
                console.error(`❌ 恢复标注 ${annotation.id} 失败:`, error);
            }
        }
        
        console.log('✅ 标注恢复完成');
        
        // 恢复完成后的处理
        this.afterRestoreComplete(modal, annotations);
    }

    /**
     * 恢复单个标注
     */
    async restoreSingleAnnotation(modal, svg, annotation, index) {
        console.log(`📝 恢复标注 ${index + 1}: ${annotation.type} (${annotation.id})`);
        
        // 标准化标注数据
        const normalizedAnnotation = this.normalizeAnnotationData(annotation, index);
        
        // 创建标注元素
        const annotationGroup = this.svgCreator.createCompleteAnnotation(normalizedAnnotation, modal);
        
        // 添加到SVG
        svg.appendChild(annotationGroup);
        
        // 绑定事件
        this.bindAnnotationEvents(modal, annotationGroup, normalizedAnnotation);
        
        console.log(`✅ 标注 ${normalizedAnnotation.id} 恢复完成`);
    }

    /**
     * 清空现有标注
     */
    clearExistingAnnotations(svg) {
        const existingAnnotations = svg.querySelectorAll('[data-annotation-group]');
        existingAnnotations.forEach(element => {
            element.remove();
        });
        
        // 也清理独立的标注元素
        const standaloneAnnotations = svg.querySelectorAll('[data-annotation-id]');
        standaloneAnnotations.forEach(element => {
            if (!element.closest('[data-annotation-group]')) {
                element.remove();
            }
        });
    }

    /**
     * 标准化标注数据
     */
    normalizeAnnotationData(annotation, index) {
        const normalized = {
            id: annotation.id || `annotation_${Date.now()}_${index}`,
            type: annotation.type || 'rectangle',
            start: annotation.start || { x: 0, y: 0 },
            end: annotation.end || { x: 100, y: 100 },
            color: annotation.color || '#ff0000',
            fillMode: annotation.fillMode || 'filled',
            opacity: annotation.opacity || 50,
            number: annotation.number !== undefined ? annotation.number : index,
            ...annotation
        };
        
        // 特殊处理不同类型的标注
        switch (normalized.type) {
            case 'brush':
            case 'freehand':
                normalized.pathData = annotation.pathData;
                normalized.points = annotation.points;
                break;
            case 'polygon':
                normalized.points = annotation.points || [];
                break;
            case 'arrow':
                // 确保箭头有正确的起点和终点
                if (!normalized.start || !normalized.end) {
                    normalized.start = { x: 0, y: 0 };
                    normalized.end = { x: 50, y: 50 };
                }
                break;
        }
        
        return normalized;
    }

    /**
     * 绑定标注事件
     */
    bindAnnotationEvents(modal, annotationElement, annotation) {
        // 点击选择事件
        annotationElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectAnnotation(modal, annotation);
        });
        
        // 鼠标悬停事件
        annotationElement.addEventListener('mouseenter', (e) => {
            this.highlightAnnotation(annotationElement, true);
        });
        
        annotationElement.addEventListener('mouseleave', (e) => {
            this.highlightAnnotation(annotationElement, false);
        });
        
        // 右键菜单事件
        annotationElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showAnnotationContextMenu(modal, annotation, e);
        });
    }

    /**
     * 选择标注
     */
    selectAnnotation(modal, annotation) {
        console.log('🎯 选择标注:', annotation.id);
        
        // 更新选择状态
        if (!modal.selectedLayers) {
            modal.selectedLayers = new Set();
        }
        
        modal.selectedLayers.clear();
        modal.selectedLayers.add(annotation.id);
        
        // 更新UI状态
        this.updateAnnotationSelection(modal, annotation);
        
        // 触发选择事件
        if (typeof this.nodeInstance.updateLayerOperationsDisplay === 'function') {
            this.nodeInstance.updateLayerOperationsDisplay(modal);
        }
    }

    /**
     * 高亮标注
     */
    highlightAnnotation(annotationElement, highlight) {
        if (highlight) {
            annotationElement.style.filter = 'brightness(1.2) drop-shadow(0 0 5px rgba(255,255,255,0.5))';
        } else {
            annotationElement.style.filter = '';
        }
    }

    /**
     * 显示标注右键菜单
     */
    showAnnotationContextMenu(modal, annotation, event) {
        // 实现右键菜单逻辑
        console.log('🖱️ 标注右键菜单:', annotation.id);
        
        // 创建简单的右键菜单
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed;
            left: ${event.clientX}px;
            top: ${event.clientY}px;
            background: #2b2b2b;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 8px 0;
            z-index: 10000;
            min-width: 120px;
        `;
        
        const menuItems = [
            { label: '删除标注', action: () => this.deleteAnnotation(modal, annotation) },
            { label: '复制标注', action: () => this.copyAnnotation(modal, annotation) },
            { label: '编辑属性', action: () => this.editAnnotation(modal, annotation) }
        ];
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.textContent = item.label;
            menuItem.style.cssText = `
                padding: 8px 16px;
                color: #e5e7eb;
                cursor: pointer;
                font-size: 13px;
            `;
            
            menuItem.addEventListener('click', () => {
                item.action();
                menu.remove();
            });
            
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = '#3b82f6';
            });
            
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.background = '';
            });
            
            menu.appendChild(menuItem);
        });
        
        document.body.appendChild(menu);
        
        // 点击其他地方关闭菜单
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    /**
     * 删除标注
     */
    deleteAnnotation(modal, annotation) {
        console.log('🗑️ 删除标注:', annotation.id);
        
        // 从数据中移除
        if (modal.annotations) {
            const index = modal.annotations.findIndex(ann => ann.id === annotation.id);
            if (index !== -1) {
                modal.annotations.splice(index, 1);
            }
        }
        
        // 从SVG中移除
        const annotationElement = modal.querySelector(`[data-annotation-group="${annotation.id}"]`);
        if (annotationElement) {
            annotationElement.remove();
        }
        
        // 更新UI
        if (typeof this.nodeInstance.updateObjectSelector === 'function') {
            this.nodeInstance.updateObjectSelector(modal);
        }
    }

    /**
     * 复制标注
     */
    copyAnnotation(modal, annotation) {
        console.log('📋 复制标注:', annotation.id);
        
        const newAnnotation = {
            ...annotation,
            id: `annotation_${Date.now()}_copy`,
            start: {
                x: annotation.start.x + 20,
                y: annotation.start.y + 20
            },
            end: {
                x: annotation.end.x + 20,
                y: annotation.end.y + 20
            }
        };
        
        // 添加到数据中
        if (!modal.annotations) {
            modal.annotations = [];
        }
        modal.annotations.push(newAnnotation);
        
        // 恢复到画布
        this.restoreSingleAnnotation(modal, modal.querySelector('#drawing-layer svg'), newAnnotation, modal.annotations.length - 1);
    }

    /**
     * 编辑标注
     */
    editAnnotation(modal, annotation) {
        console.log('✏️ 编辑标注:', annotation.id);
        // 实现编辑逻辑（可以打开属性面板等）
    }

    /**
     * 更新标注选择状态
     */
    updateAnnotationSelection(modal, annotation) {
        // 清除所有选择状态
        const allAnnotations = modal.querySelectorAll('[data-annotation-group]');
        allAnnotations.forEach(element => {
            element.style.filter = '';
        });
        
        // 高亮选中的标注
        const selectedElement = modal.querySelector(`[data-annotation-group="${annotation.id}"]`);
        if (selectedElement) {
            selectedElement.style.filter = 'brightness(1.3) drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))';
        }
        
        // 更新图层面板中的复选框状态
        const checkbox = modal.querySelector(`input[data-annotation-id="${annotation.id}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    }

    /**
     * 恢复不透明度滑块
     */
    restoreOpacitySlider(modal) {
        const opacitySlider = modal.querySelector('#annotation-opacity');
        const opacityValue = modal.querySelector('#opacity-value');
        
        if (opacitySlider && modal.currentOpacity !== undefined) {
            opacitySlider.value = modal.currentOpacity;
            if (opacityValue) {
                opacityValue.textContent = modal.currentOpacity + '%';
            }
        }
    }

    /**
     * 恢复完成后的处理
     */
    afterRestoreComplete(modal, annotations) {
        // 恢复透明度滑块
        this.restoreOpacitySlider(modal);
        
        // 更新图层面板
        if (typeof this.nodeInstance.updateObjectSelector === 'function') {
            this.nodeInstance.updateObjectSelector(modal);
        }
        
        // 刷新图层面板状态
        this.refreshLayerPanelState(modal);
        
        console.log(`✅ 成功恢复 ${annotations.length} 个标注到画布`);
    }

    /**
     * 刷新图层面板状态
     */
    refreshLayerPanelState(modal) {
        try {
            // 更新选择计数
            const selectionCount = modal.querySelector('#selection-count');
            if (selectionCount) {
                const selectedCount = modal.selectedLayers ? modal.selectedLayers.size : 0;
                selectionCount.textContent = `${selectedCount} selected`;
            }
            
            // 更新图层操作面板
            const layerOperations = modal.querySelector('#layer-operations');
            if (layerOperations) {
                const hasSelection = modal.selectedLayers && modal.selectedLayers.size > 0;
                layerOperations.style.display = hasSelection ? 'block' : 'none';
            }
            
        } catch (error) {
            console.warn('⚠️ 刷新图层面板状态失败:', error);
        }
    }

    /**
     * 手动创建标注形状（备用方案）
     */
    manuallyCreateAnnotationShapes(modal, annotations) {
        console.log('🔧 使用手动创建方案恢复标注...');
        
        const svg = modal.querySelector('#drawing-layer svg');
        if (!svg) {
            return;
        }
        
        annotations.forEach((annotation, index) => {
            try {
                const element = this.svgCreator.createElement(annotation, modal);
                if (element) {
                    svg.appendChild(element);
                    console.log(`✅ 手动创建标注 ${annotation.id}`);
                }
            } catch (error) {
                console.error(`❌ 手动创建标注 ${annotation.id} 失败:`, error);
            }
        });
    }

    /**
     * 调试标注可见性
     */
    debugAnnotationVisibility(modal, annotations) {
        console.log('🔍 调试标注可见性...');
        
        const svg = modal.querySelector('#drawing-layer svg');
        if (!svg) {
            console.error('❌ SVG元素未找到');
            return;
        }
        
        console.log('📊 SVG信息:', {
            element: svg,
            children: svg.children.length,
            viewBox: svg.getAttribute('viewBox'),
            style: svg.style.cssText
        });
        
        annotations.forEach(annotation => {
            const element = svg.querySelector(`[data-annotation-id="${annotation.id}"]`);
            console.log(`📝 标注 ${annotation.id}:`, {
                exists: !!element,
                visible: element ? element.style.display !== 'none' : false,
                element: element
            });
        });
    }
}

// 导出创建函数
export function createAnnotationRestorer(nodeInstance) {
    return new AnnotationRestorer(nodeInstance);
}
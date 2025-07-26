/**
 * Visual Prompt Editor - 标注CRUD操作
 * 从annotations模块拆分出的标注增删改查操作
 * 
 * 版本: v1.0.0 - 从annotations.js拆分
 * 日期: 2025-07-23
 * 拆分来源: visual_prompt_editor_annotations.js 行2869-2977
 */

/**
 * 删除指定标注 (v2.2.1 双重删除策略)
 * @param {Element} modal - 模态窗口元素
 * @param {Object} annotation - 要删除的标注对象
 */
export function deleteAnnotation(modal, annotation) {
    try {
        // 从数组中移除
        const index = modal.annotations.findIndex(ann => ann.id === annotation.id);
        if (index !== -1) {
            modal.annotations.splice(index, 1);
            console.log('📝 从数组中移除标注，剩余:', modal.annotations.length);
        }
        
        // 从SVG中移除
        const drawingLayer = modal.querySelector('#drawing-layer');
        if (drawingLayer) {
            const svg = drawingLayer.querySelector('svg');
            if (svg) {
                // 移除标注形状
                const shapeElement = svg.querySelector(`[data-annotation-id="${annotation.id}"]`);
                if (shapeElement) {
                    shapeElement.remove();
                    console.log('🗑️ 移除SVG形状元素');
                }
                
                // 移除相关标签 - 增强版本（优先按编号删除）
                console.log('🔍 查找并删除相关标签...', {
                    annotationId: annotation.id,
                    annotationNumber: annotation.number
                });
                
                let removedLabelCount = 0;
                
                // 方法1: 优先按编号删除（最可靠）
                if (annotation.number !== undefined) {
                    console.log('🔍 尝试按编号删除标签:', annotation.number);
                    const numberLabels = svg.querySelectorAll(`[data-annotation-number="${annotation.number}"]`);
                    console.log('📊 找到', numberLabels.length, '个编号标签');
                    
                    numberLabels.forEach((label, index) => {
                        console.log(`🗑️ 删除编号标签 ${index}:`, label.tagName);
                        label.remove();
                        removedLabelCount++;
                    });
                    
                    console.log('📊 按编号删除了', removedLabelCount, '个标签');
                }
                
                // 方法2: 如果按编号没找到，再按位置查找
                if (removedLabelCount === 0) {
                    console.log('🔍 按编号未找到标签，尝试按位置查找...');
                    const labels = svg.querySelectorAll('circle, text');
                    console.log('📊 总共找到', labels.length, '个标签元素');
                    
                    labels.forEach((label, index) => {
                        const isNear = isLabelNearAnnotation(label, annotation);
                        if (isNear) {
                            console.log(`🗑️ 按位置删除标签 ${index}:`, label.tagName);
                            label.remove();
                            removedLabelCount++;
                        }
                    });
                    
                    console.log('📊 按位置删除了', removedLabelCount, '个标签');
                }
                
                console.log('✅ 标签删除总计:', removedLabelCount, '个');
            }
        }
        
        // 更新对象选择器 - 需要从其他模块导入
        if (typeof window.updateObjectSelector === 'function') {
            window.updateObjectSelector(modal);
        }
        
        console.log('✅ 标注删除完成');
        
    } catch (e) {
        console.error('❌ 删除标注失败:', e);
    }
}

/**
 * 判断标签是否靠近指定标注
 * @param {SVGElement} labelElement - 标签元素
 * @param {Object} annotation - 标注对象
 * @returns {boolean} 是否靠近
 */
export function isLabelNearAnnotation(labelElement, annotation) {
    try {
        const tolerance = 20; // 容差像素
        
        if (labelElement.tagName.toLowerCase() === 'circle') {
            const cx = parseFloat(labelElement.getAttribute('cx'));
            const cy = parseFloat(labelElement.getAttribute('cy'));
            
            // 计算标注的参考位置
            let refX, refY;
            if (annotation.start && annotation.end) {
                refX = Math.min(annotation.start.x, annotation.end.x) + 5;
                refY = Math.min(annotation.start.y, annotation.end.y) + 15;
            } else if (annotation.points && annotation.points.length > 0) {
                refX = annotation.points[0].x + 5;
                refY = annotation.points[0].y + 15;
            } else {
                return false;
            }
            
            const distance = Math.sqrt(Math.pow(cx - refX, 2) + Math.pow(cy - refY, 2));
            return distance <= tolerance;
        }
        
        return false;
    } catch (e) {
        console.error('判断标签位置时出错:', e);
        return false;
    }
}

/**
 * 添加标注到数据数组
 * 通用的标注数据添加函数
 * @param {Element} modal - 模态窗口元素
 * @param {Object} annotationData - 标注数据对象
 */
export function addAnnotationToArray(modal, annotationData) {
    try {
        if (!modal.annotations) {
            modal.annotations = [];
        }
        
        modal.annotations.push(annotationData);
        console.log('📝 标注已添加到数组:', annotationData.id, '总数:', modal.annotations.length);
        
        return annotationData;
    } catch (e) {
        console.error('❌ 添加标注到数组失败:', e);
        return null;
    }
}

/**
 * 根据ID查找标注
 * @param {Element} modal - 模态窗口元素
 * @param {string} annotationId - 标注ID
 * @returns {Object|null} 找到的标注对象
 */
export function findAnnotationById(modal, annotationId) {
    try {
        if (!modal.annotations) return null;
        
        return modal.annotations.find(ann => ann.id === annotationId) || null;
    } catch (e) {
        console.error('❌ 查找标注失败:', e);
        return null;
    }
}

/**
 * 获取所有标注
 * @param {Element} modal - 模态窗口元素
 * @returns {Array} 标注数组
 */
export function getAllAnnotations(modal) {
    try {
        return modal.annotations || [];
    } catch (e) {
        console.error('❌ 获取标注列表失败:', e);
        return [];
    }
}
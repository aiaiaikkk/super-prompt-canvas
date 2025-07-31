/**
 * Visual Prompt Editor - 提示词生成模块
 * 负责生成适合多模态图像编辑模型的提示词
 */

import { OPERATION_TEMPLATES, TEMPLATE_CATEGORIES, CONSTRAINT_PROMPTS, DECORATIVE_PROMPTS, updateOperationTypeSelect, KontextUtils } from './visual_prompt_editor_utils.js';
import { t } from './visual_prompt_editor_i18n.js';

/**
 * 判断是否需要选择图层
 */
function shouldRequireLayerSelection(category, operationType) {
    // 全局编辑 - 不需要选择图层
    if (category === 'global') {
        return false;
    }
    
    // 专业操作 - 可选择图层（支持全局和局部）
    if (category === 'professional') {
        return false;
    }
    
    // 局部编辑 - 需要选择图层
    if (category === 'local') {
        return true;
    }
    
    // 文字编辑 - 需要选择图层
    if (category === 'text') {
        return true;
    }
    
    // 默认需要选择图层
    return true;
}

/**
 * 绑定提示词相关事件
 */
export function bindPromptEvents(modal, getObjectInfoFunction) {
    
    // 初始化分类选择器
    initializeCategorySelector(modal);
    
    // 生成按钮
    const generateBtn = modal.querySelector('#generate-prompt');
    if (generateBtn) {
        generateBtn.onclick = () => {
            // 生成描述
            generateDescription(modal, getObjectInfoFunction);
        };
    }
    
    // 复制按钮
    const copyBtn = modal.querySelector('#copy-description');
    if (copyBtn) {
        copyBtn.onclick = () => {
            const textarea = modal.querySelector('#generated-description');
            if (textarea && textarea.value) {
                navigator.clipboard.writeText(textarea.value);
                // 复制成功
                KontextUtils.showNotification('Description copied to clipboard', 'success');
            }
        };
    }
    
    // 清空按钮
    const clearBtn = modal.querySelector('#clear-description');
    if (clearBtn) {
        clearBtn.onclick = () => {
            const textarea = modal.querySelector('#generated-description');
            if (textarea) {
                textarea.value = '';
                // 清空成功
                // 触发实时同步
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };
    }
    
    // Generated Description 实时编辑同步
    const generatedDescription = modal.querySelector('#generated-description');
    const descriptionStatus = modal.querySelector('#description-status');
    
    if (generatedDescription) {
        let isModified = false;
        let saveTimeout = null;
        let originalValue = generatedDescription.value; // 记录原始值
        
        // 实时编辑监听
        generatedDescription.addEventListener('input', () => {
            const currentValue = generatedDescription.value;
            const hasChanged = currentValue !== originalValue;
            
            if (hasChanged && !isModified) {
                isModified = true;
                generatedDescription.style.borderColor = '#FF9800';
                if (descriptionStatus) {
                    descriptionStatus.style.display = 'block';
                    descriptionStatus.style.background = '#FF9800';
                    descriptionStatus.style.color = 'white';
                }
            } else if (!hasChanged && isModified) {
                // 内容恢复到原始状态
                isModified = false;
                generatedDescription.style.borderColor = '#555';
                if (descriptionStatus) {
                    descriptionStatus.style.display = 'none';
                }
            }
            
            // 清除之前的保存定时器
            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }
            
            if (isModified) {
                saveTimeout = setTimeout(() => {
                    autoSaveDescription(modal);
                    isModified = false;
                    originalValue = currentValue;
                    generatedDescription.style.borderColor = '#555';
                    if (descriptionStatus) {
                        descriptionStatus.style.background = '#4CAF50';
                        descriptionStatus.innerHTML = '💾 Saved';
                        setTimeout(() => {
                            descriptionStatus.style.display = 'none';
                        }, 1500);
                    }
                }, 2000);
            }
        });
        
        // 失去焦点时立即保存
        generatedDescription.addEventListener('blur', () => {
            if (isModified) {
                if (saveTimeout) {
                    clearTimeout(saveTimeout);
                }
                autoSaveDescription(modal);
                isModified = false;
                originalValue = generatedDescription.value;
                generatedDescription.style.borderColor = '#555';
                if (descriptionStatus) {
                    descriptionStatus.style.background = '#4CAF50';
                    descriptionStatus.innerHTML = '💾 Saved';
                    setTimeout(() => {
                        descriptionStatus.style.display = 'none';
                    }, 1500);
                }
            }
        });
        
        // 生成新内容时更新原始值
        generatedDescription.addEventListener('descriptiongenerated', () => {
            originalValue = generatedDescription.value;
            isModified = false;
            if (descriptionStatus) {
                descriptionStatus.style.display = 'none';
            }
        });
        
    }
}

/**
 * 自动保存Generated Description的内容
 */
function autoSaveDescription(modal) {
    try {
        // 导出当前数据 (包括编辑后的Generated Description)
        const promptData = exportPromptData(modal);
        
        if (promptData) {
            // 触发数据保存事件，通知主系统数据已更新
            const saveEvent = new CustomEvent('descriptionsaved', {
                detail: { promptData: promptData },
                bubbles: true
            });
            modal.dispatchEvent(saveEvent);
            
            
            // 显示保存成功的视觉反馈
            const generatedDescription = modal.querySelector('#generated-description');
            if (generatedDescription) {
                const originalBg = generatedDescription.style.backgroundColor;
                generatedDescription.style.backgroundColor = '#1B5E20'; // 绿色背景
                setTimeout(() => {
                    generatedDescription.style.backgroundColor = originalBg;
                }, 500);
            }
            
            // 显示简短的保存通知
            KontextUtils.showNotification('Description auto-saved', 'success', 1000);
        }
    } catch (error) {
        console.error('Auto-save failed:', error);
        KontextUtils.showNotification('Auto-save failed', 'error', 2000);
    }
}

/**
 * 生成描述文本 - 支持全局和独立两种模式
 */
function generateDescription(modal, getObjectInfoFunction) {
    const operationType = modal.querySelector('#operation-type');
    const targetInput = modal.querySelector('#target-input');
    const generatedDescription = modal.querySelector('#generated-description');
    
    if (!generatedDescription) {
        return;
    }
    
    const selectedAnnotationIds = getSelectedAnnotationIds(modal);
    
    const currentCategory = modal.querySelector('#template-category')?.value;
    const currentOperationType = operationType?.value;
    
    // 根据操作类型决定是否需要选择图层
    const requiresLayerSelection = shouldRequireLayerSelection(currentCategory, currentOperationType);
    
    if (requiresLayerSelection && selectedAnnotationIds.length === 0) {
        KontextUtils.showNotification('Please select annotation objects for this operation', 'error');
        return;
    }
    
    // 检测编辑模式
    const globalOperation = operationType?.value;
    const globalDescription = targetInput?.value?.trim();
    
    let description;
    
    // 如果没有选择图层（全局或专业操作）
    if (selectedAnnotationIds.length === 0) {
        // 全局操作：直接使用全局设置生成描述
        if (globalOperation && globalDescription) {
            description = generateGlobalPrompt(globalOperation, globalDescription, modal);
            } else {
            KontextUtils.showNotification('Please enter description for global operation', 'error');
            return;
        }
    } else {
        // 有选择图层的情况（原逻辑）
        const individualOperationsInfo = selectedAnnotationIds.map(id => {
            const annotation = modal.annotations.find(ann => ann.id === id);
            return annotation ? {
                id: annotation.id,
                hasIndividualOperation: annotation.operationType && annotation.operationType.trim() !== '',
                hasIndividualDescription: annotation.description && annotation.description.trim() !== '',
                operationType: annotation.operationType,
                description: annotation.description
            } : null;
        }).filter(info => info);
        
        const hasIndividualOperations = individualOperationsInfo.some(info => 
            info.hasIndividualOperation || info.hasIndividualDescription
        );
        
        if (hasIndividualOperations) {
            // 独立模式：使用每个层的独立设置
            description = generateMultiLayerPrompt(selectedAnnotationIds, modal);
        } else if (globalOperation && globalDescription) {
            // 全局模式：使用全局设置
            description = generateMultiSelectPrompt(selectedAnnotationIds, globalOperation, globalDescription, modal, getObjectInfoFunction);
        } else {
            // 混合模式：优先使用独立设置，回退到全局设置
            description = generateMultiLayerPrompt(selectedAnnotationIds, modal);
        }
    }
    
    const originalDescription = description;
    description = enhanceDescriptionWithPrompts(description, modal);
    
    generatedDescription.value = description;
    
    // 触发生成完成事件，通知编辑监听器
    generatedDescription.dispatchEvent(new Event('descriptiongenerated', { bubbles: true }));
    
    // 显示应用成功提示（如果有约束和修饰提示词被应用）
    if (description !== originalDescription) {
        showApplySuccessNotification(modal);
    }
    
    // 根据是否选择图层显示不同的通知
    if (selectedAnnotationIds.length === 0) {
        KontextUtils.showNotification(`Global description generated successfully`, 'success');
    } else {
        KontextUtils.showNotification(`Description generated successfully (${selectedAnnotationIds.length} objects)`, 'success');
    }
}

/**
 * 显示应用成功提示
 */
function showApplySuccessNotification(modal) {
    const notification = modal.querySelector('#apply-success-notification');
    if (!notification) return;
    
    // 显示提示
    notification.style.display = 'block';
    
    // 触发渐入动画
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // 3秒后自动隐藏
    setTimeout(() => {
        notification.style.opacity = '0';
        
        // 等待渐出动画完成后隐藏元素
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 3000);
}

/**
 * 获取选中的标注ID列表 (适应Fabric.js对象和标签页系统)
 */
function getSelectedAnnotationIds(modal) {
    
    // 优先：从 selectedLayers Set 获取（支持Fabric.js对象）
    if (modal.selectedLayers && modal.selectedLayers.size > 0) {
        return Array.from(modal.selectedLayers);
    }
    
    // 备用方案1：从Fabric.js画布获取当前选中的对象
    if (window.fabricManager && window.fabricManager.fabricCanvas) {
        const activeObjects = window.fabricManager.fabricCanvas.getActiveObjects();
        if (activeObjects.length > 0) {
            const fabricIds = activeObjects.map(obj => obj.fabricId).filter(id => id);
            if (fabricIds.length > 0) {
                // 确保这些对象在selectedLayers中
                if (!modal.selectedLayers) {
                    modal.selectedLayers = new Set();
                }
                fabricIds.forEach(id => modal.selectedLayers.add(id));
                return fabricIds;
            }
        }
    }
    
    // 备用方案2：从复选框获取
    const checkedBoxes = modal.querySelectorAll('.layer-tab input[type="checkbox"]:checked, #annotation-objects input[type="checkbox"]:checked');
    const fromCheckboxes = Array.from(checkedBoxes).map(checkbox => checkbox.dataset.annotationId).filter(id => id);
    
    // 备用方案3：如果复选框也没有选中，则获取所有有修改设置的标注
    if (fromCheckboxes.length === 0) {
        const annotationsWithOperations = modal.annotations?.filter(ann => {
            const hasOperationType = ann.operationType && ann.operationType.trim() !== '';
            const hasDescription = ann.description && ann.description.trim() !== '';
            const hasConstraints = ann.constraintPrompts && ann.constraintPrompts.length > 0;
            const hasDecoratives = ann.decorativePrompts && ann.decorativePrompts.length > 0;
            
            return hasOperationType || hasDescription || hasConstraints || hasDecoratives;
        }).map(ann => ann.id) || [];
        return annotationsWithOperations;
    }
    
    return fromCheckboxes;
}

/**
 * 生成多层独立操作的提示词
 */
function generateMultiLayerPrompt(selectedAnnotationIds, modal) {
    // 读取编号显示设置
    const includeNumbersCheckbox = modal.querySelector('#include-annotation-numbers');
    const includeNumbers = includeNumbersCheckbox ? includeNumbersCheckbox.checked : false;
    
    const globalOperation = modal.querySelector('#operation-type')?.value;
    const globalDescription = modal.querySelector('#target-input')?.value?.trim();
    
    // 为每个选中的标注生成独立的描述
    const layerDescriptions = selectedAnnotationIds.map(annotationId => {
        const annotation = modal.annotations.find(ann => ann.id === annotationId);
        if (!annotation) return null;
        
        const operationType = annotation.operationType || globalOperation || 'change_color';
        const layerDescription = annotation.description || globalDescription || '';
        
        // 如果标注没有描述，尝试从当前层描述框获取
        const currentLayerDescription = modal.querySelector('#current-layer-description')?.value?.trim();
        const finalDescription = layerDescription || currentLayerDescription || '';
        
        
        // 生成该层的对象描述
        const objectDescription = generateAnnotationDescription(annotation, includeNumbers);
        
        const template = OPERATION_TEMPLATES[operationType];
        if (!template) {
            return `Apply ${operationType} to ${objectDescription}`;
        }
        
        // 生成该层的完整描述
        let layerPrompt = template.description(finalDescription).replace('{object}', objectDescription);
        
        if (annotation.constraintPrompts && annotation.constraintPrompts.length > 0) {
            layerPrompt += `, ${annotation.constraintPrompts.join(', ')}`;
        }
        
        if (annotation.decorativePrompts && annotation.decorativePrompts.length > 0) {
            layerPrompt += `, ${annotation.decorativePrompts.join(', ')}`;
        }
        
        return layerPrompt;
    }).filter(desc => desc);
    
    if (layerDescriptions.length === 0) {
        return 'No valid layers selected.';
    }
    
    // 合并多层描述
    let combinedDescription;
    if (layerDescriptions.length === 1) {
        combinedDescription = layerDescriptions[0];
    } else if (layerDescriptions.length === 2) {
        combinedDescription = `${layerDescriptions[0]}, and ${layerDescriptions[1]}`;
    } else {
        const lastDesc = layerDescriptions.pop();
        combinedDescription = `${layerDescriptions.join(', ')}, and ${lastDesc}`;
    }
    
    
    return combinedDescription;
}

/**
 * 生成多选标注的提示词 (保留兼容性)
 */
function generateMultiSelectPrompt(selectedAnnotationIds, operation, inputText, modal, getObjectInfoFunction) {
    // 读取编号显示设置
    const includeNumbersCheckbox = modal.querySelector('#include-annotation-numbers');
    const includeNumbers = includeNumbersCheckbox ? includeNumbersCheckbox.checked : false;
    
    if (selectedAnnotationIds.length === 1) {
        // 单选情况，使用原有逻辑
        const annotation = modal.annotations.find(ann => ann.id === selectedAnnotationIds[0]);
        if (annotation) {
            return generateSingleAnnotationPrompt(annotation, operation, inputText, modal, includeNumbers);
        }
    }
    
    // 多选情况，生成组合描述
    const annotationDescriptions = selectedAnnotationIds.map(id => {
        const annotation = modal.annotations.find(ann => ann.id === id);
        if (annotation) {
            return generateAnnotationDescription(annotation, includeNumbers);
        }
        return null;
    }).filter(desc => desc);
    
    if (annotationDescriptions.length === 0) {
        return 'No valid annotations selected.';
    }
    
    // 构建多选对象描述
    let objectDescription;
    if (annotationDescriptions.length === 2) {
        objectDescription = `${annotationDescriptions[0]} and ${annotationDescriptions[1]}`;
    } else if (annotationDescriptions.length > 2) {
        const lastDesc = annotationDescriptions.pop();
        objectDescription = `${annotationDescriptions.join(', ')}, and ${lastDesc}`;
    } else {
        objectDescription = annotationDescriptions[0];
    }
    
    const template = OPERATION_TEMPLATES[operation];
    if (!template) {
        return `Apply ${operation} to ${objectDescription}.`;
    }
    
    // 生成最终描述
    const finalDescription = template.description(inputText).replace('{object}', objectDescription);
    
    
    return finalDescription;
}

/**
 * 生成单个标注的提示词
 */
function generateSingleAnnotationPrompt(annotation, operation, inputText, modal, includeNumbers = false) {
    const objectDescription = generateAnnotationDescription(annotation, includeNumbers);
    
    const template = OPERATION_TEMPLATES[operation];
    if (!template) {
        return `Apply ${operation} to ${objectDescription}.`;
    }
    
    // 生成最终描述
    const finalDescription = template.description(inputText).replace('{object}', objectDescription);
    
    return finalDescription;
}

/**
 * 生成标注的描述文本
 */
function generateAnnotationDescription(annotation, includeNumbers = false) {
    const colorMap = {
        '#ff0000': 'red',
        '#00ff00': 'green', 
        '#ffff00': 'yellow',
        '#0000ff': 'blue'
    };
    
    const shapeMap = {
        'rect': 'rectangular',
        'rectangle': 'rectangular',
        'circle': 'circular',
        'polygon': 'polygon',
        'path': 'freehand drawn',
        'image': 'image',
        'text': 'text',
        'arrow': 'arrow-marked',
        'freehand': 'outlined'
    };
    
    // 处理Fabric对象的颜色和类型
    let color = 'marked';
    let shape = 'marked';
    
    if (annotation.fabricObject) {
        // 从Fabric对象获取颜色和类型
        const fabricObj = annotation.fabricObject;
        const fillColor = fabricObj.fill || fabricObj.stroke;
        color = colorMap[fillColor] || 'colored';
        shape = shapeMap[fabricObj.type] || fabricObj.type || 'marked';
    } else {
        // 兼容旧的标注数据
        color = colorMap[annotation.color] || 'marked';
        shape = shapeMap[annotation.type] || 'marked';
    }
    
    const number = annotation.number;
    
    // 构建基础描述
    let description;
    if (includeNumbers) {
        description = `the ${color} ${shape} marked area (annotation ${number})`;
    } else {
        description = `the ${color} ${shape} marked area`;
    }
    
    let positionInfo = '';
    let centerX, centerY;
    
    if (annotation.bounds) {
        // 从Fabric对象的bounds获取位置
        centerX = Math.round(annotation.bounds.left + annotation.bounds.width / 2);
        centerY = Math.round(annotation.bounds.top + annotation.bounds.height / 2);
    } else if (annotation.start && annotation.end) {
        // 兼容旧的标注数据
        centerX = Math.round((annotation.start.x + annotation.end.x) / 2);
        centerY = Math.round((annotation.start.y + annotation.end.y) / 2);
    } else if (annotation.centerPoint) {
        // 自由绘制的中心点
        centerX = Math.round(annotation.centerPoint.x);
        centerY = Math.round(annotation.centerPoint.y);
    }
    
    if (centerX !== undefined && centerY !== undefined) {
        // 简化的位置描述
        let position = '';
        if (centerY < 300) position = 'upper ';
        else if (centerY > 600) position = 'lower ';
        
        if (centerX < 300) position += 'left';
        else if (centerX > 600) position += 'right';
        else position += 'center';
        
        positionInfo = position ? ` in the ${position.trim()} part of the image` : '';
    }
    
    return description + positionInfo;
}

/**
 * 生成多模态图像编辑提示词 (保留原有函数用于兼容)
 */
function generateMultimodalPrompt(selectedObject, operation, inputText, modal, getObjectInfoFunction) {
    let objectDescription = 'the marked area';
    
    if (selectedObject.startsWith('annotation_')) {
        const index = parseInt(selectedObject.split('_')[1]);
        const annotation = modal.annotations[index];
        
        if (annotation) {
            // 构建具体的区域描述
            const colorMap = {
                '#ff0000': 'red',
                '#00ff00': 'green', 
                '#ffff00': 'yellow',
                '#0000ff': 'blue'
            };
            
            const shapeMap = {
                'rectangle': 'rectangular',
                'circle': 'circular',
                'arrow': 'arrow-marked',
                'freehand': 'outlined'
            };
            
            const color = colorMap[annotation.color] || 'marked';
            const shape = shapeMap[annotation.type] || 'marked';
            const number = annotation.number;
            
            // 计算位置信息
            let positionInfo = '';
            if (annotation.start && annotation.end) {
                const centerX = Math.round((annotation.start.x + annotation.end.x) / 2);
                const centerY = Math.round((annotation.start.y + annotation.end.y) / 2);
                
                // 简化的位置描述
                let position = '';
                if (centerY < 300) position = 'upper ';
                else if (centerY > 600) position = 'lower ';
                
                if (centerX < 300) position += 'left';
                else if (centerX > 600) position += 'right';
                else position += 'center';
                
                positionInfo = position ? ` in the ${position.trim()} part of the image` : '';
            }
            
            // 构建具体描述
            objectDescription = `the ${color} ${shape} marked area (annotation ${number})${positionInfo}`;
        }
    }
    
    const opTemplate = OPERATION_TEMPLATES[operation] || OPERATION_TEMPLATES['custom'];
    
    // 构建最终提示词
    const finalPrompt = opTemplate.description(inputText).replace(/{object}/g, objectDescription);
    
    return finalPrompt;
}

/**
 * 分析提示词质量
 */
export function analyzePromptQuality(prompt) {
    const words = prompt.split(/\s+/);
    const wordCount = words.length;
    const charCount = prompt.length;
    
    // 质量评分
    let score = 50.0;
    const suggestions = [];
    
    // 长度分析
    if (wordCount < 10) {
        score -= 20;
        suggestions.push("Prompt too short, add more details");
    } else if (wordCount > 100) {
        score -= 10;
        suggestions.push("Prompt quite long, consider simplifying");
    } else if (wordCount >= 20 && wordCount <= 50) {
        score += 15;
    } else {
        score += 10;
    }
    
    // 专业词汇检测
    const professionalWords = [
        'professional', 'high quality', 'masterpiece', 'detailed', 
        '8k', 'realistic', 'lighting', 'composition', 'perspective',
        'shadows', 'texture', 'natural', 'seamless', 'integrate'
    ];
    const foundProfessional = professionalWords.filter(word => 
        prompt.toLowerCase().includes(word)
    ).length;
    score += foundProfessional * 3;
    
    // 描述性词汇检测
    const descriptiveWords = [
        'maintaining', 'ensuring', 'preserving', 'enhance', 'improve',
        'transform', 'replace', 'adjust', 'modify', 'change'
    ];
    const foundDescriptive = descriptiveWords.filter(word =>
        prompt.toLowerCase().includes(word)
    ).length;
    score += foundDescriptive * 2;
    
    // 技术约束检测
    const constraintWords = [
        'same shape', 'original composition', 'natural lighting',
        'realistic', 'proportions', 'perspective', 'environment'
    ];
    const foundConstraints = constraintWords.filter(phrase =>
        prompt.toLowerCase().includes(phrase)
    ).length;
    score += foundConstraints * 4;
    
    // 负面词汇检测
    const negativeWords = ['low quality', 'blurry', 'bad', 'ugly', 'distorted', 'artifacts'];
    const foundNegative = negativeWords.filter(word => 
        prompt.toLowerCase().includes(word)
    ).length;
    if (foundNegative > 0) {
        suggestions.push("Consider moving negative terms to negative prompt");
        score -= foundNegative * 5;
    }
    
    // 完整性检测
    if (prompt.includes('selected region')) {
        score += 10;
    }
    
    if (prompt.includes('maintaining') || prompt.includes('preserving')) {
        score += 8;
    }
    
    // 最终分数限制
    score = Math.max(0, Math.min(100, score));
    
    // 根据分数给出建议
    if (score >= 80) {
        suggestions.unshift("Excellent prompt quality");
    } else if (score >= 60) {
        suggestions.unshift("Good prompt, minor improvements possible");
    } else if (score >= 40) {
        suggestions.unshift("Moderate quality, consider adding more details");
    } else {
        suggestions.unshift("Prompt needs improvement, add more specific details");
    }
    
    return {
        score: score,
        word_count: wordCount,
        char_count: charCount,
        professional_terms: foundProfessional,
        descriptive_terms: foundDescriptive,
        constraint_terms: foundConstraints,
        suggestions: suggestions,
        grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D'
    };
}

/**
 * 显示提示词质量分析
 */
export function showPromptQualityAnalysis(modal, prompt) {
    const analysis = analyzePromptQuality(prompt);
    
    let qualityDisplay = modal.querySelector('#prompt-quality-display');
    if (!qualityDisplay) {
        qualityDisplay = document.createElement('div');
        qualityDisplay.id = 'prompt-quality-display';
        qualityDisplay.style.cssText = `
            margin-top: 8px; padding: 8px; background: #2a2a2a; 
            border-radius: 4px; border-left: 4px solid;
        `;
        
        const generatedDescription = modal.querySelector('#generated-description');
        if (generatedDescription && generatedDescription.parentNode) {
            generatedDescription.parentNode.insertBefore(qualityDisplay, generatedDescription.nextSibling);
        }
    }
    
    // 根据分数设置颜色
    const color = analysis.score >= 80 ? '#4CAF50' : 
                  analysis.score >= 60 ? '#FF9800' : 
                  analysis.score >= 40 ? '#FFC107' : '#f44336';
    
    qualityDisplay.style.borderLeftColor = color;
    
    qualityDisplay.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="color: white; font-weight: 600; font-size: 12px;">📊 Prompt Quality</span>
            <span style="color: ${color}; font-weight: 600; font-size: 12px;">
                ${analysis.score.toFixed(1)}/100 (Grade ${analysis.grade})
            </span>
        </div>
        <div style="font-size: 11px; color: #ccc; margin-bottom: 4px;">
            Words: ${analysis.word_count} | Professional terms: ${analysis.professional_terms} | Constraints: ${analysis.constraint_terms}
        </div>
        ${analysis.suggestions.length > 0 ? `
        <div style="font-size: 11px; color: #aaa;">
            💡 ${analysis.suggestions[0]}
        </div>` : ''}
    `;
}

/**
 * 生成负面提示词
 */
export function generateNegativePrompt(operation, inputText) {
    // 简化负面提示词，默认为空，让用户自己决定
    return "";
}

/**
 * 导出提示词数据 - 🔴 支持多选提示词
 */
export function exportPromptData(modal) {
    const generatedDescription = modal.querySelector('#generated-description');
    const includeNumbersCheckbox = modal.querySelector('#include-annotation-numbers');
    
    // 🔧 修复：即使找不到#generated-description也继续执行，确保connectedLayers数据被保存
    if (!generatedDescription) {
    }
    
    const selectedConstraints = getSelectedPrompts(modal, 'constraint');
    const selectedDecoratives = getSelectedPrompts(modal, 'decorative');
    
    // 🔴 优化：获取所有已编辑的标注（有操作类型设置的）+ 当前选中的标注
    let selectedAnnotationIds = getSelectedAnnotationIds(modal);
    
    const annotationsWithOperations = modal.annotations?.filter(ann => {
        const hasOperationType = ann.operationType && ann.operationType.trim() !== '';
        const hasDescription = ann.description && ann.description.trim() !== '';
        const hasConstraints = ann.constraintPrompts && ann.constraintPrompts.length > 0;
        const hasDecoratives = ann.decorativePrompts && ann.decorativePrompts.length > 0;
        
        return hasOperationType || hasDescription || hasConstraints || hasDecoratives;
    }).map(ann => ann.id) || [];
    
    // 合并两个列表，去重
    const allRelevantIds = [...new Set([...selectedAnnotationIds, ...annotationsWithOperations])];
    
    
    selectedAnnotationIds = allRelevantIds;
    
    const selectedAnnotations = selectedAnnotationIds.map(id => {
        const annotation = modal.annotations.find(ann => ann.id === id);
        if (annotation) {
        }
        return annotation ? {
            id: annotation.id,
            operationType: annotation.operationType || 'add_object',
            description: annotation.description || '',
            type: annotation.type,
            color: annotation.color,
            coordinates: annotation.coordinates,
            number: annotation.number,
            constraintPrompts: annotation.constraintPrompts || [],
            decorativePrompts: annotation.decorativePrompts || []
        } : null;
    }).filter(ann => ann);
    
    
    const operationType = modal.querySelector('#operation-type');
    const targetInput = modal.querySelector('#target-input');
    const templateCategory = modal.querySelector('#template-category');
    
    // Layer connection data removed - using Fabric.js objects only
    const fabricObjectsData = modal.annotations || [];
    
    
    // 🔧 关键修复：获取图像显示缩放信息，确保前后端坐标系统一致
    const imageScaleInfo = getImageDisplayScaleInfo(modal);
    
    const promptData = {
        positive_prompt: generatedDescription ? generatedDescription.value : '',
        negative_prompt: generateNegativePrompt(operationType?.value || 'custom', targetInput?.value || ''),
        selected_annotations: selectedAnnotations,  // 🔴 新增：选中的标注及其独立设置
        global_operation_type: operationType?.value || 'add_object',  // 🔴 恢复：全局操作类型
        global_description: targetInput?.value || '',  // 🔴 恢复：全局描述
        template_category: templateCategory?.value || 'local',  // 🔴 恢复：模板分类
        constraint_prompts: selectedConstraints,  // 🔴 改为数组
        decorative_prompts: selectedDecoratives,  // 🔴 改为数组
        include_annotation_numbers: includeNumbersCheckbox ? includeNumbersCheckbox.checked : false,
        annotations: modal.annotations || [],
        // 🔧 关键修复：添加connectedLayers字段，防止连接图层数据丢失
        fabricObjects: fabricObjectsData,
        // 🔧 新增：图像缩放信息，确保后端使用正确的坐标转换
        image_scale_info: imageScaleInfo,
        quality_analysis: analyzePromptQuality(generatedDescription ? generatedDescription.value : ''),
        editing_mode: 'hybrid',  // 🔴 支持混合模式
        timestamp: new Date().toISOString()
    };
    
    
    return promptData;
}

/**
 * 初始化分类选择器
 */
function initializeCategorySelector(modal) {
    
    // 更健壮的DOM查询 - 先尝试在modal中查找，然后尝试在整个文档中查找
    let categorySelect = modal.querySelector('#template-category');
    let operationSelect = modal.querySelector('#operation-type');
    
    // 如果在modal中找不到，尝试在整个文档中查找
    if (!categorySelect) {
        categorySelect = document.querySelector('#template-category');
    }
    
    if (!operationSelect) {
        operationSelect = document.querySelector('#operation-type');
    }
    
    
    if (!categorySelect || !operationSelect) {
        const controlsTab = modal.querySelector('#controls-tab-content') || document.querySelector('#controls-tab-content');
        if (controlsTab) {
            categorySelect = controlsTab.querySelector('#template-category');
            operationSelect = controlsTab.querySelector('#operation-type');
        }
        
        if (!categorySelect || !operationSelect) {
            return;
        }
    }
    
    // 初始化为全局调整模板（第一个选项）
    updateOperationTypeSelect(operationSelect, 'global');
    
    // Edit Control区域不再需要提示词选择器初始化
    
    categorySelect.addEventListener('change', function() {
        const selectedCategory = this.value;
        
        updateOperationTypeSelect(operationSelect, selectedCategory);
        
        updateLayerSelectionLabel(modal, selectedCategory);
        
        if (operationSelect.options.length > 0) {
            const firstOperation = operationSelect.options[0].value;
            operationSelect.value = firstOperation;  // 设置选中值
        }
    });
    
    operationSelect.addEventListener('change', function() {
        const selectedOperation = this.value;
        
        // 可以在这里添加操作类型切换的逻辑
        // 例如更新UI显示或预填充描述模板
    });
    
    
    // 初始化时也更新标签
    updateLayerSelectionLabel(modal, categorySelect.value);
    
    
    
    // Edit Control区域已简化，调试信息已移除
}

/**
 * 获取分类对应的占位符文本 - 🔴 支持文字编辑分类
 */
function getCategoryPlaceholder(category) {
    const placeholders = {
        local: 'Enter target changes for the selected object (e.g., "red color", "casual style")...',
        global: 'Enter global adjustment parameters (e.g., "high contrast", "warm tones")...',
        text: 'Enter text content or editing instructions (e.g., "Hello World", "bigger size")...',  // 🔴 新增文字编辑
        professional: 'Enter professional operation details (e.g., "perspective correction", "smart fill")...'
    };
    return placeholders[category] || 'Enter editing instructions...';
}

/**
 * 显示分类信息提示
 */
function showCategoryInfo(modal, category) {
    const categoryInfo = TEMPLATE_CATEGORIES[category];
    if (!categoryInfo) return;
    
    // 可以在这里添加临时提示显示
}

/**
 * 更新约束性和修饰性提示词选择器 - 🔴 支持复选框容器
 */
export function updatePromptSelectors(modal, operationType) {
    
    // 只查找图层编辑区域的容器（Edit Control区域已移除提示词面板）
    const layerConstraintContainer = modal.querySelector('#layer-constraint-prompts-container');
    const layerDecorativeContainer = modal.querySelector('#layer-decorative-prompts-container');
    
    
    if (layerConstraintContainer && layerDecorativeContainer) {
        updateConstraintPrompts(layerConstraintContainer, operationType);
        updateDecorativePrompts(layerDecorativeContainer, operationType);
    } else {
    }
}

/**
 * 更新约束性提示词选择器 - 🔴 改为复选框形式
 */
function updateConstraintPrompts(containerElement, operationType) {
    // 如果传入的是select元素，找到其父容器
    const actualContainer = containerElement.tagName === 'SELECT' ? 
        containerElement.parentElement : containerElement;
    
    // 清空现有内容
    actualContainer.innerHTML = `
        <div style="margin-bottom: 8px;">
            <span style="color: #ccc; font-size: 12px; font-weight: 600;">${t('constraint_prompts_title', '🔒 Constraint Prompts:')}</span>
            <span style="color: #888; font-size: 10px; margin-left: 8px;">${t('select_multiple_subtitle', '(Select multiple)')}</span>
        </div>
        <div id="constraint-checkboxes" style="max-height: 120px; overflow-y: auto; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; padding: 8px;"></div>
    `;
    
    const checkboxContainer = actualContainer.querySelector('#constraint-checkboxes');
    const constraints = CONSTRAINT_PROMPTS[operationType] || CONSTRAINT_PROMPTS['default'];
    if (!constraints || !checkboxContainer) return;
    
    constraints.forEach((constraint, index) => {
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.style.cssText = 'margin-bottom: 4px; display: flex; align-items: flex-start; gap: 6px;';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `constraint-${operationType}-${index}`;
        checkbox.value = constraint;
        checkbox.style.cssText = 'margin-top: 2px; cursor: pointer;';
        
        // Add auto-save event handler for real-time constraint prompt saving
        checkbox.addEventListener('change', function() {
            autoSavePromptSelections();
        });
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = t(`constraint_${operationType}_${index + 1}`, constraint);
        label.style.cssText = 'color: #ddd; font-size: 11px; cursor: pointer; line-height: 1.3; flex: 1;';
        
        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(label);
        checkboxContainer.appendChild(checkboxWrapper);
    });
    
    
    // 🔴 验证复选框创建状态
    setTimeout(() => {
    }, 100);
}

/**
 * 更新修饰性提示词选择器 - 🔴 改为复选框形式
 */
function updateDecorativePrompts(containerElement, operationType) {
    // 如果传入的是select元素，找到其父容器
    const actualContainer = containerElement.tagName === 'SELECT' ? 
        containerElement.parentElement : containerElement;
    
    // 清空现有内容
    actualContainer.innerHTML = `
        <div style="margin-bottom: 8px;">
            <span style="color: #ccc; font-size: 12px; font-weight: 600;">${t('decorative_prompts_title', '🎨 Decorative Prompts:')}</span>
            <span style="color: #888; font-size: 10px; margin-left: 8px;">${t('select_multiple_subtitle', '(Select multiple)')}</span>
        </div>
        <div id="decorative-checkboxes" style="max-height: 120px; overflow-y: auto; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; padding: 8px;"></div>
    `;
    
    const checkboxContainer = actualContainer.querySelector('#decorative-checkboxes');
    const decoratives = DECORATIVE_PROMPTS[operationType] || DECORATIVE_PROMPTS['default'];
    if (!decoratives || !checkboxContainer) return;
    
    decoratives.forEach((decorative, index) => {
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.style.cssText = 'margin-bottom: 4px; display: flex; align-items: flex-start; gap: 6px;';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `decorative-${operationType}-${index}`;
        checkbox.value = decorative;
        checkbox.style.cssText = 'margin-top: 2px; cursor: pointer;';
        
        // Add auto-save event handler for real-time decorative prompt saving
        checkbox.addEventListener('change', function() {
            autoSavePromptSelections();
        });
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = t(`decorative_${operationType}_${index + 1}`, decorative);
        label.style.cssText = 'color: #ddd; font-size: 11px; cursor: pointer; line-height: 1.3; flex: 1;';
        
        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(label);
        checkboxContainer.appendChild(checkboxWrapper);
    });
    
    
    // 🔴 验证复选框创建状态
    setTimeout(() => {
    }, 100);
}

/**
 * 使用约束性和修饰性提示词增强描述 - 🔴 支持多选复选框
 */
function enhanceDescriptionWithPrompts(baseDescription, modal) {
    let enhancedDescription = baseDescription;
    
    const selectedConstraints = getSelectedPrompts(modal, 'constraint');
    if (selectedConstraints.length > 0) {
        enhancedDescription += `, ${selectedConstraints.join(', ')}`;
    }
    
    const selectedDecoratives = getSelectedPrompts(modal, 'decorative');
    if (selectedDecoratives.length > 0) {
        enhancedDescription += `, ${selectedDecoratives.join(', ')}`;
    }
    
    return enhancedDescription;
}

/**
 * 获取选中的提示词复选框 - 🔴 适配Fabric.js对象选择
 */
function getSelectedPrompts(modal, type) {
    let checkboxes;
    let container;
    
    // 首先尝试在当前modal中查找容器
    if (type === 'constraint') {
        container = modal.querySelector('#layer-constraint-prompts-container');
        
        // 如果当前modal中没有容器，尝试使用fabricManager的modal
        if (!container && window.fabricManager && window.fabricManager.modal) {
            container = window.fabricManager.modal.querySelector('#layer-constraint-prompts-container');
        }
        
        if (container) {
            checkboxes = container.querySelectorAll('.constraint-prompt-checkbox:checked');
        } else {
            checkboxes = [];
        }
    } else if (type === 'decorative') {
        container = modal.querySelector('#layer-decorative-prompts-container');
        
        // 如果当前modal中没有容器，尝试使用fabricManager的modal
        if (!container && window.fabricManager && window.fabricManager.modal) {
            container = window.fabricManager.modal.querySelector('#layer-decorative-prompts-container');
        }
        
        if (container) {
            checkboxes = container.querySelectorAll('.decorative-prompt-checkbox:checked');
        } else {
            checkboxes = [];
        }
    } else {
        // 兼容旧版本选择器
        checkboxes = modal.querySelectorAll(`#${type}-checkboxes input[type="checkbox"]:checked`);
    }
    
    // 如果还是找不到容器，尝试从标注数据中获取已保存的提示词
    if (checkboxes.length === 0) {
        // 从fabricManager的annotation数据中获取已选择的提示词
        if (window.fabricManager && window.fabricManager.modal && window.fabricManager.modal.annotations) {
            const annotations = window.fabricManager.modal.annotations;
            
            let allPrompts = [];
            annotations.forEach((annotation) => {
                if (type === 'constraint' && annotation.constraintPrompts) {
                    allPrompts = allPrompts.concat(annotation.constraintPrompts);
                } else if (type === 'decorative' && annotation.decorativePrompts) {
                    allPrompts = allPrompts.concat(annotation.decorativePrompts);
                }
            });
            
            // 去重并返回
            const uniquePrompts = [...new Set(allPrompts)];
            if (uniquePrompts.length > 0) {
                return uniquePrompts;
            }
        }
    }
    
    // 从复选框提取提示词
    const results = Array.from(checkboxes).map(checkbox => 
        checkbox.dataset.prompt
    ).filter(prompt => prompt);
    
    return results;
}

/**
 * 简单通知函数
 */
/**
 * 生成全局操作的提示词（无需选择图层）
 */
function generateGlobalPrompt(operationType, description, modal) {
    
    const template = OPERATION_TEMPLATES[operationType];
    if (!template) {
        return description || `Apply ${operationType} to the entire image`;
    }
    
    // 对于全局操作，直接使用描述，不需要 {object} 占位符
    let prompt;
    if (template.template && template.template.includes('{object}')) {
        // 如果模板包含 {object}，替换为 "the entire image"
        prompt = template.template
            .replace('{object}', 'the entire image')
            .replace('{target}', description);
    } else {
        // 如果模板不包含 {object}，直接使用描述函数
        prompt = template.description(description);
    }
    
    return prompt;
}

/**
 * 更新图层选择标签文本
 */
function updateLayerSelectionLabel(modal, category) {
    const label = modal.querySelector('#layer-selection-label');
    if (!label) return;
    
    let labelText;
    let labelColor = '#aaa';
    
    switch (category) {
        case 'global':
            labelText = '📋 Select Layers (Optional - Global operations work without selection)';
            labelColor = '#4CAF50'; // 绿色表示可选
            break;
        case 'professional':
            labelText = '📋 Select Layers (Optional - Can work globally or locally)';
            labelColor = '#2196F3'; // 蓝色表示灵活
            break;
        case 'local':
            labelText = '📋 Select Layers (Required for local operations)';
            labelColor = '#FF9800'; // 橙色表示必需
            break;
        case 'text':
            labelText = '📋 Select Layers (Required for text operations)';
            labelColor = '#FF9800'; // 橙色表示必需
            break;
        default:
            labelText = '📋 Select Layers';
            labelColor = '#aaa';
    }
    
    label.textContent = labelText;
    label.style.color = labelColor;
    
}

/**
 * Auto-save prompt selections to the currently selected layer(s)
 */
function autoSavePromptSelections() {
    
    const modal = document.querySelector('#unified-editor-modal');
    if (!modal || !modal.selectedLayers || modal.selectedLayers.size === 0) {
        return;
    }
    
    // Collect constraint prompts
    const constraintPrompts = [];
    const constraintCheckboxes = modal.querySelectorAll('#layer-constraint-prompts-container input[type="checkbox"]:checked');
    constraintCheckboxes.forEach(checkbox => {
        constraintPrompts.push(checkbox.value);
    });
    
    // Collect decorative prompts
    const decorativePrompts = [];
    const decorativeCheckboxes = modal.querySelectorAll('#layer-decorative-prompts-container input[type="checkbox"]:checked');
    decorativeCheckboxes.forEach(checkbox => {
        decorativePrompts.push(checkbox.value);
    });
    
    // Save to all selected layers
    modal.selectedLayers.forEach(annotationId => {
        const annotation = modal.annotations.find(a => a.id === annotationId);
        if (annotation) {
            annotation.constraintPrompts = [...constraintPrompts];
            annotation.decorativePrompts = [...decorativePrompts];
            
        }
    });
    
}

/**
 * 获取当前图像显示的缩放信息
 * 用于确保前后端坐标系统一致
 */
function getImageDisplayScaleInfo(modal) {
    try {
        const mainImage = modal.querySelector('#vpe-main-image');
        const canvasContainer = modal.querySelector('#image-canvas');
        
        if (!mainImage || !canvasContainer) {
                return {
                display_width: 800,
                display_height: 600,
                natural_width: 800,
                natural_height: 600,
                scale_x: 1.0,
                scale_y: 1.0,
                canvas_offset_x: 0,
                canvas_offset_y: 0,
                source: 'fallback'
            };
        }
        
        const canvasRect = canvasContainer.getBoundingClientRect();
        const imageRect = mainImage.getBoundingClientRect();
        
        const canvasOffsetX = imageRect.left - canvasRect.left;
        const canvasOffsetY = imageRect.top - canvasRect.top;
        
        const displayWidth = imageRect.width;
        const displayHeight = imageRect.height;
        const naturalWidth = mainImage.naturalWidth || mainImage.width;
        const naturalHeight = mainImage.naturalHeight || mainImage.height;
        
        // 计算缩放比例
        // 🔧 关键修复：考虑到前端图层也被缩放了，需要使用实际的合成画面比例
        // 前端合成后的画面尺寸就是canvasRect的尺寸
        const composedScaleX = naturalWidth / canvasRect.width;
        const composedScaleY = naturalHeight / canvasRect.height;
        
        const scaleX = naturalWidth / displayWidth;
        const scaleY = naturalHeight / displayHeight;
        
        const scaleInfo = {
            display_width: Math.round(displayWidth),
            display_height: Math.round(displayHeight),
            natural_width: naturalWidth,
            natural_height: naturalHeight,
            scale_x: composedScaleX,  // 🔧 使用合成画面的缩放比例
            scale_y: composedScaleY,  // 🔧 使用合成画面的缩放比例
            image_scale_x: scaleX,    // 保留原始图像缩放比例用于调试
            image_scale_y: scaleY,    // 保留原始图像缩放比例用于调试
            canvas_offset_x: Math.round(canvasOffsetX),
            canvas_offset_y: Math.round(canvasOffsetY),
            canvas_width: Math.round(canvasRect.width),
            canvas_height: Math.round(canvasRect.height),
            source: 'computed'
        };
        
        
        return scaleInfo;
        
    } catch (error) {
        console.error('Failed to get image scale info:', error);
        return {
            display_width: 800,
            display_height: 600,
            natural_width: 800,
            natural_height: 600,
            scale_x: 1.0,
            scale_y: 1.0,
            canvas_offset_x: 0,
            canvas_offset_y: 0,
            source: 'error_fallback'
        };
    }
}

// 导出需要在其他模块中使用的函数
// updatePromptSelectors 已在第927行直接导出，此处删除重复导出
/**
 * Visual Prompt Editor - 提示词生成模块
 * 负责生成适合多模态图像编辑模型的提示词
 */

import { OPERATION_TEMPLATES, TEMPLATE_CATEGORIES, CONSTRAINT_PROMPTS, DECORATIVE_PROMPTS, updateOperationTypeSelect } from './visual_prompt_editor_utils.js';

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
            console.log('✨ 生成描述按钮点击');
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
                console.log('📋 复制成功');
                showNotification('Description copied to clipboard', 'success');
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
                console.log('🧹 清空成功');
            }
        };
    }
}

/**
 * 生成描述文本
 */
function generateDescription(modal, getObjectInfoFunction) {
    const operationType = modal.querySelector('#operation-type');
    const targetInput = modal.querySelector('#target-input');
    const generatedDescription = modal.querySelector('#generated-description');
    
    if (!operationType || !targetInput || !generatedDescription) {
        console.log('⚠️ VPE缺少必要元素');
        return;
    }
    
    // 获取选中的标注对象（支持多选）
    const selectedAnnotationIds = getSelectedAnnotationIds(modal);
    const operation = operationType.value;
    const inputText = targetInput.value.trim();
    
    if (selectedAnnotationIds.length === 0 || !operation) {
        showNotification('Please select annotation objects and operation type', 'error');
        return;
    }
    
    // 生成多模态编辑模型可理解的提示词
    let description = generateMultiSelectPrompt(selectedAnnotationIds, operation, inputText, modal, getObjectInfoFunction);
    
    // 添加约束性和修饰性提示词
    description = enhanceDescriptionWithPrompts(description, modal);
    
    generatedDescription.value = description;
    console.log('✨ VPE生成多模态提示词:', description);
    showNotification(`Description generated successfully (${selectedAnnotationIds.length} objects)`, 'success');
}

/**
 * 获取选中的标注ID列表 (从annotations模块导入)
 */
function getSelectedAnnotationIds(modal) {
    const checkedBoxes = modal.querySelectorAll('#annotation-objects input[type="checkbox"]:checked');
    return Array.from(checkedBoxes).map(checkbox => checkbox.dataset.annotationId).filter(id => id);
}

/**
 * 生成多选标注的提示词
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
    
    // 获取操作模板
    const template = OPERATION_TEMPLATES[operation];
    if (!template) {
        return `Apply ${operation} to ${objectDescription}.`;
    }
    
    // 生成最终描述
    const finalDescription = template.description(inputText).replace('{object}', objectDescription);
    
    console.log('🎯 多选提示词生成:', {
        selectedCount: selectedAnnotationIds.length,
        objectDescription,
        operation,
        finalDescription
    });
    
    return finalDescription;
}

/**
 * 生成单个标注的提示词
 */
function generateSingleAnnotationPrompt(annotation, operation, inputText, modal, includeNumbers = false) {
    const objectDescription = generateAnnotationDescription(annotation, includeNumbers);
    
    // 获取操作模板
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
        'rectangle': 'rectangular',
        'circle': 'circular',
        'arrow': 'arrow-marked',
        'freehand': 'outlined'
    };
    
    const color = colorMap[annotation.color] || 'marked';
    const shape = shapeMap[annotation.type] || 'marked';
    const number = annotation.number;
    
    // 构建基础描述
    let description;
    if (includeNumbers) {
        description = `the ${color} ${shape} marked area (annotation ${number})`;
    } else {
        description = `the ${color} ${shape} marked area`;
    }
    
    // 添加位置信息
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
    } else if (annotation.centerPoint) {
        // 自由绘制的中心点
        const centerX = Math.round(annotation.centerPoint.x);
        const centerY = Math.round(annotation.centerPoint.y);
        
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
    // 获取选中标注的详细信息
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
    
    // 创建质量分析显示区域
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
 * 导出提示词数据
 */
export function exportPromptData(modal) {
    const generatedDescription = modal.querySelector('#generated-description');
    const objectSelector = modal.querySelector('#object-selector');
    const operationType = modal.querySelector('#operation-type');
    const targetInput = modal.querySelector('#target-input');
    const includeNumbersCheckbox = modal.querySelector('#include-annotation-numbers');
    
    if (!generatedDescription) return null;
    
    // 获取约束性和修饰性提示词
    const constraintSelect = modal.querySelector('#constraint-prompts');
    const decorativeSelect = modal.querySelector('#decorative-prompts');
    
    const promptData = {
        positive_prompt: generatedDescription.value,
        negative_prompt: generateNegativePrompt(operationType?.value || 'custom', targetInput?.value || ''),
        selected_object: objectSelector?.value || '',
        operation_type: operationType?.value || 'custom',
        target_description: targetInput?.value || '',
        constraint_prompt: constraintSelect?.value || '',
        decorative_prompt: decorativeSelect?.value || '',
        include_annotation_numbers: includeNumbersCheckbox ? includeNumbersCheckbox.checked : false,
        annotations: modal.annotations || [],
        quality_analysis: analyzePromptQuality(generatedDescription.value),
        timestamp: new Date().toISOString()
    };
    
    return promptData;
}

/**
 * 初始化分类选择器
 */
function initializeCategorySelector(modal) {
    const categorySelect = modal.querySelector('#template-category');
    const operationSelect = modal.querySelector('#operation-type');
    
    if (!categorySelect || !operationSelect) {
        console.warn('⚠️ 分类选择器或操作选择器未找到');
        return;
    }
    
    // 初始化为局部编辑模板
    updateOperationTypeSelect(operationSelect, 'local');
    
    // 初始化提示词选择器（默认为第一个操作类型）
    if (operationSelect.options.length > 0) {
        const firstOperation = operationSelect.options[0].value;
        updatePromptSelectors(modal, firstOperation);
    }
    
    // 绑定分类选择器事件
    categorySelect.addEventListener('change', function() {
        const selectedCategory = this.value;
        console.log(`📂 切换模板分类: ${selectedCategory}`);
        
        // 更新操作类型选择器
        updateOperationTypeSelect(operationSelect, selectedCategory);
        
        // 清空描述文本框（可选）
        const targetInput = modal.querySelector('#target-input');
        if (targetInput) {
            targetInput.placeholder = getCategoryPlaceholder(selectedCategory);
        }
        
        // 显示分类提示
        showCategoryInfo(modal, selectedCategory);
    });
    
    // 绑定操作类型选择器事件，更新约束性和修饰性提示词
    operationSelect.addEventListener('change', function() {
        const selectedOperation = this.value;
        console.log(`🎯 切换操作类型: ${selectedOperation}`);
        
        updatePromptSelectors(modal, selectedOperation);
    });
    
    console.log('🎯 分类选择器已初始化，默认显示局部编辑模板');
}

/**
 * 获取分类对应的占位符文本
 */
function getCategoryPlaceholder(category) {
    const placeholders = {
        local: 'Enter target changes for the selected object (e.g., "red color", "casual style")...',
        global: 'Enter global adjustment parameters (e.g., "high contrast", "warm tones")...',
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
    console.log(`📋 ${categoryInfo.name}: ${categoryInfo.description}`);
    console.log(`📊 包含 ${categoryInfo.templates.length} 个模板`);
}

/**
 * 更新约束性和修饰性提示词选择器
 */
function updatePromptSelectors(modal, operationType) {
    const constraintSelect = modal.querySelector('#constraint-prompts');
    const decorativeSelect = modal.querySelector('#decorative-prompts');
    
    if (!constraintSelect || !decorativeSelect) {
        console.warn('⚠️ 约束性或修饰性提示词选择器未找到');
        return;
    }
    
    // 更新约束性提示词选择器
    updateConstraintPrompts(constraintSelect, operationType);
    
    // 更新修饰性提示词选择器
    updateDecorativePrompts(decorativeSelect, operationType);
    
    console.log(`🔄 已更新提示词选择器: ${operationType}`);
}

/**
 * 更新约束性提示词选择器
 */
function updateConstraintPrompts(selectElement, operationType) {
    // 清空现有选项
    selectElement.innerHTML = '<option value="">Select constraint prompts...</option>';
    
    const constraints = CONSTRAINT_PROMPTS[operationType];
    if (!constraints) return;
    
    // 添加约束性提示词选项
    constraints.forEach(constraint => {
        const option = document.createElement('option');
        option.value = constraint;
        option.textContent = constraint;
        selectElement.appendChild(option);
    });
}

/**
 * 更新修饰性提示词选择器
 */
function updateDecorativePrompts(selectElement, operationType) {
    // 清空现有选项
    selectElement.innerHTML = '<option value="">Select decorative prompts...</option>';
    
    const decoratives = DECORATIVE_PROMPTS[operationType];
    if (!decoratives) return;
    
    // 添加修饰性提示词选项
    decoratives.forEach(decorative => {
        const option = document.createElement('option');
        option.value = decorative;
        option.textContent = decorative;
        selectElement.appendChild(option);
    });
}

/**
 * 使用约束性和修饰性提示词增强描述
 */
function enhanceDescriptionWithPrompts(baseDescription, modal) {
    const constraintSelect = modal.querySelector('#constraint-prompts');
    const decorativeSelect = modal.querySelector('#decorative-prompts');
    
    let enhancedDescription = baseDescription;
    
    // 添加约束性提示词
    if (constraintSelect && constraintSelect.value) {
        enhancedDescription += `, ${constraintSelect.value}`;
    }
    
    // 添加修饰性提示词
    if (decorativeSelect && decorativeSelect.value) {
        enhancedDescription += `, ${decorativeSelect.value}`;
    }
    
    return enhancedDescription;
}

/**
 * 简单通知函数
 */
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // 这里可以添加UI通知显示逻辑
}
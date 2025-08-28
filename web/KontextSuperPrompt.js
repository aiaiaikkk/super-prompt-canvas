// Kontext Super Prompt Node - 完整复现Visual Prompt Editor功能
import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { getIntentGuidance, getStyleGuidance } from "./guidanceLibraryA.js";
import TranslationHelper from "./translation-helper.js";
import "./kontext-menu-system.js";

// Kontext Super Prompt 命名空间 - 资源隔离机制
window.KontextSuperPromptNS = window.KontextSuperPromptNS || {
    instances: new Map(), // 存储所有实例
    constants: {},        // 存储常量
    utils: {},           // 存储工具函数
    version: '1.3.4',    // 版本信息
    
    // 注册实例
    registerInstance(nodeId, instance) {
        this.instances.set(nodeId, instance);
    },
    
    // 注销实例
    unregisterInstance(nodeId) {
        if (this.instances.has(nodeId)) {
            const instance = this.instances.get(nodeId);
            if (instance && instance.cleanup) {
                instance.cleanup();
            }
            this.instances.delete(nodeId);
        }
    },
    
    // 获取实例
    getInstance(nodeId) {
        return this.instances.get(nodeId);
    },
    
    // 清理所有实例
    cleanup() {
        this.instances.forEach((instance, nodeId) => {
            this.unregisterInstance(nodeId);
        });
    },
    
    // 性能监控工具
    performance: {
        metrics: new Map(),
        
        // 开始性能计时
        startTimer(key, label = '') {
            this.metrics.set(key, {
                label: label || key,
                startTime: performance.now(),
                endTime: null,
                duration: null,
                memoryStart: this.getMemoryUsage()
            });
        },
        
        // 结束性能计时
        endTimer(key) {
            const metric = this.metrics.get(key);
            if (metric) {
                metric.endTime = performance.now();
                metric.duration = metric.endTime - metric.startTime;
                metric.memoryEnd = this.getMemoryUsage();
                metric.memoryDelta = metric.memoryEnd - metric.memoryStart;
                
                return metric;
            }
            return null;
        },
        
        // 获取内存使用情况
        getMemoryUsage() {
            if (performance.memory) {
                return performance.memory.usedJSHeapSize / 1024 / 1024; // MB
            }
            return 0;
        },
        
        // 获取性能报告
        getReport() {
            const report = {
                totalMetrics: this.metrics.size,
                completedMetrics: 0,
                totalTime: 0,
                memoryUsage: this.getMemoryUsage(),
                details: []
            };
            
            this.metrics.forEach((metric, key) => {
                if (metric.duration !== null) {
                    report.completedMetrics++;
                    report.totalTime += metric.duration;
                    report.details.push({
                        key,
                        label: metric.label,
                        duration: metric.duration,
                        memoryDelta: metric.memoryDelta
                    });
                }
            });
            
            return report;
        },
        
        // 清理性能指标
        clear() {
            this.metrics.clear();
        }
    }
};

// 将常量移到命名空间中
const KSP_NS = window.KontextSuperPromptNS;

// 确保constants对象已初始化
if (!KSP_NS.constants) {
    KSP_NS.constants = {};
}

// 编辑意图引导词模板
KSP_NS.constants.INTENT_PROMPTS = {
    color_change: "Transform {target} color to {new_color}, maintain original lighting and texture, professional color grading, natural color transition",
    object_removal: "Remove {object} completely, seamlessly fill background, maintain perspective and lighting consistency, clean removal, invisible editing",
    object_replacement: "Replace {original_object} with {new_object}, match lighting, scale, and perspective of original scene, seamless integration",
    object_addition: "Add {new_object} to {location}, integrate naturally with existing lighting, shadows, and perspective, realistic insertion",
    background_change: "Replace background with {new_background}, maintain subject lighting and edges, seamless composition, perfect edge detection",
    face_swap: "Replace face with {target_face}, maintain original pose, lighting, and facial expression naturally, seamless face swap",
    quality_enhancement: "Enhance image quality, increase resolution, reduce noise, sharpen details while maintaining natural appearance",
    image_restoration: "Repair damaged areas, restore missing parts, fix {defect_type}, maintain original image style and quality",
    style_transfer: "Transform image to {target_style} style, maintain subject recognition while applying artistic interpretation",
    text_edit: "Edit text from '{original_text}' to '{new_text}', maintain font style, perspective, and integration",
    lighting_adjustment: "Adjust lighting to {lighting_description}, modify shadows and highlights while maintaining natural appearance",
    perspective_correction: "Correct perspective distortion, straighten {target_elements}, maintain proportions and natural geometry",
    blur_sharpen: "Apply {blur_type} effect to {target_area}, create {desired_effect} while maintaining image quality",
    local_deformation: "Modify {target_area} shape/size, apply {transformation_type}, maintain natural proportions and context",
    composition_adjustment: "Reframe composition to {new_composition}, adjust {framing_elements}, maintain visual balance"
};

// 应用场景引导词模板
KSP_NS.constants.SCENE_PROMPTS = {
    ecommerce_product: "Clean product presentation, neutral background, even lighting, sharp details, commercial photography standard",
    social_media: "Engaging visual content, trendy aesthetics, platform-optimized format, eye-catching appeal, vibrant color palette",
    marketing_campaign: "Bold promotional imagery, campaign-driven aesthetics, brand message support, conversion-focused visuals",
    portrait_professional: "Professional headshot quality, executive presence, corporate standard, confidence projection",
    lifestyle: "Authentic lifestyle representation, aspirational living, natural moments, relatable scenarios",
    food_photography: "Appetizing food presentation, culinary artistry, restaurant quality, food styling excellence",
    real_estate: "Property showcase excellence, architectural photography, space maximization, luxury presentation",
    fashion_retail: "Fashion photography excellence, style showcase, trend representation, retail presentation",
    automotive: "Automotive photography excellence, vehicle showcase, performance emphasis, luxury automobile presentation",
    beauty_cosmetics: "Beauty product excellence, cosmetic presentation, skin tone accuracy, makeup artistry showcase",
    corporate_branding: "Corporate brand representation, professional identity, business excellence, brand consistency",
    event_photography: "Event documentation excellence, moment capture, celebration atmosphere, professional event photography",
    product_catalog: "Catalog photography standard, product line presentation, systematic showcase, inventory documentation",
    artistic_creation: "Artistic expression freedom, creative vision support, fine art quality, gallery presentation",
    documentary: "Documentary authenticity, journalistic integrity, real moment capture, storytelling excellence"
};

// 将常量存储到命名空间，避免全局污染
KSP_NS.constants.OPERATION_CATEGORIES = {
    local: {
        name: '🎯 局部编辑',
        description: 'Local object-specific editing operations',
        templates: [
            'add_object', 'change_color', 'change_style', 'replace_object', 'remove_object', 'face_swap',
            'change_texture', 'change_pose', 'change_expression', 'change_clothing', 'change_background',
            'enhance_quality', 'blur_background', 'adjust_lighting', 'resize_object', 'enhance_skin_texture',
            'character_expression', 'character_hair', 'character_accessories'
        ]
    },
    global: {
        name: '🌍 全局编辑', 
        description: 'Whole image processing operations',
        templates: [
            'global_color_grade', 'global_style_transfer', 'global_brightness_contrast',
            'global_hue_saturation', 'global_sharpen_blur', 'global_noise_reduction',
            'global_enhance', 'global_filter', 'character_age', 'detail_enhance',
            'realism_enhance', 'camera_operation', 'global_perspective'
        ]
    },
    text: {
        name: '📝 文字编辑',
        description: 'Text editing and manipulation operations',
        templates: ['text_add', 'text_remove', 'text_edit', 'text_resize', 'object_combine']
    },
    professional: {
        name: '🔧 专业操作',
        description: 'Advanced professional editing tools', 
        templates: [
            'geometric_warp', 'perspective_transform', 'lens_distortion', 'content_aware_fill',
            'seamless_removal', 'smart_patch', 'style_blending', 'collage_integration',
            'texture_mixing', 'precision_cutout', 'alpha_composite', 'mask_feathering', 'depth_composite',
            'professional_product', 'zoom_focus', 'stylize_local', 'custom'
        ]
    },
    api: {
        name: '🌐 远程API',
        description: 'Remote cloud AI model enhancement',
        templates: ['api_enhance']
    },
    ollama: {
        name: '🦙 本地Ollama',
        description: 'Local Ollama model enhancement',
        templates: ['ollama_enhance']
    }
};

KSP_NS.constants.OPERATION_TEMPLATES = {
    'change_color': { template: 'make {object} {target} color', label: '颜色变换', category: 'local' },
    'change_style': { template: 'make {object} {target} style', label: '风格重构', category: 'local' },
    'replace_object': { template: 'replace {object} with {target}', label: '替换物体', category: 'local' },
    'add_object': { template: 'add {target} to {object}', label: '添加物体', category: 'local' },
    'remove_object': { template: 'remove {object}', label: '无缝移除', category: 'local' },
    'face_swap': { template: 'place {object} face on {target}, make it natural', label: '换脸', category: 'local' },
    'change_texture': { template: 'make {object} {target} texture', label: '纹理增强', category: 'local' },
    'change_pose': { template: 'make {object} {target} pose', label: '姿态调整', category: 'local' },
    'change_expression': { template: 'make {object} {target} expression', label: '表情增强', category: 'local' },
    'change_clothing': { template: 'make {object} wear {target}', label: '服装造型', category: 'local' },
    'change_background': { template: 'make the background {target}', label: '背景更改', category: 'local' },
    'enhance_quality': { template: 'make {object} better quality', label: '质量增强', category: 'local' },
    'blur_background': { template: 'make the background blurred behind {object}', label: '背景虚化', category: 'local' },
    'adjust_lighting': { template: 'make lighting {target} on {object}', label: '光照调整', category: 'local' },
    'resize_object': { template: 'make {object} {target} size', label: '大小调整', category: 'local' },
    'enhance_skin_texture': { template: 'make skin texture {target}', label: '皮肤纹理增强', category: 'local' },
    'character_expression': { template: 'make character expression {target}', label: '角色表情', category: 'local' },
    'character_hair': { template: 'make character hair {target}', label: '角色发型', category: 'local' },
    'character_accessories': { template: 'add {target} accessories to character', label: '角色配饰', category: 'local' },
    
    'global_color_grade': { template: 'apply {target} color grading to entire image', label: '色彩分级', category: 'global' },
    'global_style_transfer': { template: 'turn entire image into {target} style', label: '风格转换', category: 'global' },
    'global_brightness_contrast': { template: 'adjust image brightness and contrast to {target}', label: '亮度对比度', category: 'global' },
    'global_hue_saturation': { template: 'change image hue and saturation to {target}', label: '色相饱和度', category: 'global' },
    'global_sharpen_blur': { template: 'apply {target} sharpening to entire image', label: '锐化模糊', category: 'global' },
    'global_noise_reduction': { template: 'reduce noise in entire image', label: '噪点消除', category: 'global' },
    'global_enhance': { template: 'enhance entire image quality', label: '全局增强', category: 'global' },
    'global_filter': { template: 'apply {target} filter to entire image', label: '滤镜效果', category: 'global' },
    'character_age': { template: 'make the person look {target}', label: '年龄调整', category: 'global' },
    'detail_enhance': { template: 'add more details to {object}', label: '细节增强', category: 'global' },
    'realism_enhance': { template: 'make {object} more realistic', label: '真实感增强', category: 'global' },
    'camera_operation': { template: 'zoom out and show {target}', label: '镜头操作', category: 'global' },
    'global_perspective': { template: 'adjust global perspective to {target}', label: '全局透视', category: 'global' },
    
    'text_add': { template: 'add text saying "{target}" to {area}', label: '添加文字', category: 'text' },
    'text_remove': { template: 'remove the text from {area}', label: '移除文字', category: 'text' },
    'text_edit': { template: 'change the text in {area} to "{target}"', label: '编辑文字', category: 'text' },
    'text_resize': { template: 'make the text in {area} {target} size', label: '文字大小', category: 'text' },
    'object_combine': { template: 'combine text with {target}', label: '对象合并', category: 'text' },
    
    'geometric_warp': { template: 'apply {target} geometric transformation', label: '几何变形', category: 'professional' },
    'perspective_transform': { template: 'transform perspective to {target}', label: '透视变换', category: 'professional' },
    'lens_distortion': { template: 'correct lens distortion with {target}', label: '镜头畸变', category: 'professional' },
    'content_aware_fill': { template: 'fill selected area with {target}', label: '内容感知填充', category: 'professional' },
    'seamless_removal': { template: 'seamlessly remove {target}', label: '无缝移除', category: 'professional' },
    'smart_patch': { template: 'smart patch with {target}', label: '智能修补', category: 'professional' },
    'style_blending': { template: 'blend styles with {target}', label: '风格混合', category: 'professional' },
    'collage_integration': { template: 'integrate into collage with {target}', label: '拼贴集成', category: 'professional' },
    'texture_mixing': { template: 'mix textures with {target}', label: '纹理混合', category: 'professional' },
    'precision_cutout': { template: 'precise cutout of {target}', label: '精确抠图', category: 'professional' },
    'alpha_composite': { template: 'composite with alpha using {target}', label: '透明合成', category: 'professional' },
    'mask_feathering': { template: 'feather mask edges with {target}', label: '遮罩羽化', category: 'professional' },
    'depth_composite': { template: 'composite with depth using {target}', label: '深度合成', category: 'professional' },
    'professional_product': { template: 'create professional product presentation with {target}', label: '专业产品', category: 'professional' },
    'zoom_focus': { template: 'apply zoom focus effect with {target}', label: '缩放聚焦', category: 'professional' },
    'stylize_local': { template: 'apply local stylization with {target}', label: '局部风格化', category: 'professional' },
    'custom': { template: 'apply custom editing with {target}', label: '自定义', category: 'professional' },
    
    // API和Ollama增强模板
    'api_enhance': { template: 'enhance with cloud AI model: {target}', label: 'AI增强', category: 'api' },
    'ollama_enhance': { template: 'enhance with local Ollama model: {target}', label: 'Ollama增强', category: 'ollama' }
};

// 旧的静态约束系统已移除，现在使用基于1026数据集的增强约束系统
// 参见 kontext-menu-system.js 中的 ENHANCED_CONSTRAINT_SYSTEM

// 旧的修饰性提示词已移除，现在使用增强约束系统
// 参见 kontext-menu-system.js 中的 ENHANCED_CONSTRAINT_SYSTEM

// 旧的翻译映射表已移除，现在使用增强约束系统的翻译
// 参见 kontext-menu-system.js 中的 CONSTRAINT_TRANSLATIONS


// 将中文提示词转换为英文
function translatePromptsToEnglish(chinesePrompts) {
    if (!chinesePrompts || !Array.isArray(chinesePrompts)) {
        return [];
    }
    
    return chinesePrompts.map(prompt => {
        // 如果已经是英文，直接返回
        if (!/[\u4e00-\u9fa5]/.test(prompt)) {
            return prompt;
        }
        
        // 从 OPERATION_SPECIFIC_CONSTRAINTS 中查找翻译
        if (window.KontextMenuSystem && window.KontextMenuSystem.OPERATION_SPECIFIC_CONSTRAINTS) {
            for (const operationType in window.KontextMenuSystem.OPERATION_SPECIFIC_CONSTRAINTS) {
                const operationData = window.KontextMenuSystem.OPERATION_SPECIFIC_CONSTRAINTS[operationType];
                
                // 在约束中查找
                if (operationData.constraints) {
                    const constraint = operationData.constraints.find(c => c.zh === prompt);
                    if (constraint) {
                        return constraint.en;
                    }
                }
                
                // 在修饰词中查找
                if (operationData.modifiers) {
                    const modifier = operationData.modifiers.find(m => m.zh === prompt);
                    if (modifier) {
                        return modifier.en;
                    }
                }
            }
        }
        
        // 优先使用新的增强约束系统的翻译
        if (window.KontextMenuSystem && window.KontextMenuSystem.CONSTRAINT_TRANSLATIONS) {
            const translation = window.KontextMenuSystem.CONSTRAINT_TRANSLATIONS[prompt];
            if (translation) {
                return translation;
            }
        }
        
        // 备用：旧的翻译映射表（如果存在）
        if (KSP_NS.constants.PROMPT_TRANSLATION_MAP && KSP_NS.constants.PROMPT_TRANSLATION_MAP[prompt]) {
            return KSP_NS.constants.PROMPT_TRANSLATION_MAP[prompt];
        }
        
        // 如果都没有找到翻译，返回原文
        console.warn(`[Translation] No translation found for: ${prompt}`);
        return prompt;
    });
}

// 定义界面尺寸
KSP_NS.constants.EDITOR_SIZE = {
    WIDTH: 800, // 1000 * 0.8 - 减小20%
    HEIGHT: 850,
    LAYER_PANEL_HEIGHT: 144, // 180 * 0.8 - 减小20%
    TOOLBAR_HEIGHT: 50,
    TAB_HEIGHT: 40
};

// 定义界面尺寸
KSP_NS.constants.EDITOR_SIZE = {
    WIDTH: 800, // 1000 * 0.8 - 减小20%
    HEIGHT: 850,
    LAYER_PANEL_HEIGHT: 144, // 180 * 0.8 - 减小20%
    TOOLBAR_HEIGHT: 50,
    TAB_HEIGHT: 40
};

class KontextSuperPrompt {
    constructor(node) {
        // 开始性能监控
        KSP_NS.performance.startTimer(`node_${node.id}_init`, `节点 ${node.id} 初始化`);
        
        this.node = node;
        
        // 在命名空间中注册此实例
        KSP_NS.registerInstance(node.id, this);
        this.layerInfo = null;
        this.selectedLayers = [];
        this.currentEditMode = "局部编辑";
        this.currentCategory = 'local';
        this.autoGenerate = false;  // 默认不自动生成
        
        // 为每个选项卡创建独立的数据存储
        this.tabData = {
            local: {
                operationType: '',
                description: '',
                selectedConstraints: [],
                selectedDecoratives: [],
                generatedPrompt: ''
            },
            global: {
                operationType: '',
                description: '',
                selectedConstraints: [],
                selectedDecoratives: [],
                generatedPrompt: ''
            },
            text: {
                operationType: '',
                description: '',
                selectedConstraints: [],
                selectedDecoratives: [],
                generatedPrompt: ''
            },
            professional: {
                operationType: '',
                description: '',
                selectedConstraints: [],
                selectedDecoratives: [],
                generatedPrompt: ''
            },
            creative: {
                operationType: '',
                description: '',
                selectedConstraints: [],
                selectedDecoratives: [],
                generatedPrompt: ''
            },
            api: {
                description: '',
                generatedPrompt: '',
                apiProvider: 'siliconflow',
                apiKey: '',
                apiModel: 'deepseek-ai/DeepSeek-V3',
                editingIntent: 'general_editing',
                processingStyle: 'auto_smart',
                customGuidance: ''
            },
            ollama: {
                description: '',
                generatedPrompt: '',
                ollamaUrl: 'http://127.0.0.1:11434',
                ollamaModel: '',
                temperature: 0.7,
                editingIntent: 'general_editing',
                processingStyle: 'auto_smart',
                customGuidance: '',
                enableVisual: false,
                autoUnload: false
            }
        };
        
        // 新旧选项卡ID映射
        this.tabIdMap = {
            'local_editing': 'local',
            'global_editing': 'global', 
            'text_editing': 'text',
            'creative_reconstruction': 'creative',
            'professional_operations': 'professional'
        };
        
        // 当前选项卡的便捷访问器（指向当前选项卡的数据）
        this.currentTabData = this.tabData[this.currentCategory];
        
        // 事件监听器管理系统 - 防止堆积和内存泄漏
        this._eventListeners = [];
        this._apiEventListeners = [];
        this._timeouts = [];
        this._intervals = [];
        
        // 初始化UI
        this.initEditor();
    }

    // 事件监听器管理方法 - 统一管理所有监听器以防止内存泄漏
    addEventListenerManaged(element, event, handler, options = false) {
        element.addEventListener(event, handler, options);
        this._eventListeners.push({ element, event, handler, options });
    }

    addAPIEventListenerManaged(event, handler) {
        if (api && api.addEventListener) {
            api.addEventListener(event, handler);
            this._apiEventListeners.push({ event, handler });
        }
    }

    addTimeoutManaged(callback, delay) {
        const timeoutId = setTimeout(callback, delay);
        this._timeouts.push(timeoutId);
        return timeoutId;
    }

    addIntervalManaged(callback, interval) {
        const intervalId = setInterval(callback, interval);
        this._intervals.push(intervalId);
        return intervalId;
    }

    // 清理所有事件监听器和定时器
    cleanup() {
        // 清理DOM事件监听器
        this._eventListeners.forEach(({ element, event, handler, options }) => {
            if (element && element.removeEventListener) {
                element.removeEventListener(event, handler, options);
            }
        });
        this._eventListeners = [];

        // 清理API事件监听器
        this._apiEventListeners.forEach(({ event, handler }) => {
            if (api && api.removeEventListener) {
                api.removeEventListener(event, handler);
            }
        });
        this._apiEventListeners = [];

        // 清理定时器
        this._timeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this._timeouts = [];

        this._intervals.forEach(intervalId => clearInterval(intervalId));
        this._intervals = [];

        // 清理渲染相关的定时器
        if (this._renderTimeout) {
            clearTimeout(this._renderTimeout);
            this._renderTimeout = null;
        }

        // 清理图层检查定时器
        if (this.layerCheckInterval) {
            clearInterval(this.layerCheckInterval);
            this.layerCheckInterval = null;
        }

        // 输出性能报告
        const report = KSP_NS.performance.getReport();
        if (report.completedMetrics > 0) {
        }
        
        // 从命名空间注销实例
        if (this.node && this.node.id) {
            KSP_NS.unregisterInstance(this.node.id);
        }

    }

    initEditor() {
        
        // 创建主容器
        this.editorContainer = document.createElement('div');
        this.editorContainer.className = 'kontext-super-prompt-container';
        this.editorContainer.style.cssText = `
            width: ${KSP_NS.constants.EDITOR_SIZE.WIDTH}px;
            height: ${KSP_NS.constants.EDITOR_SIZE.HEIGHT}px;
            background: #1a1a1a;
            border: 1px solid #444;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;

        // 工具栏已移除 - 不再需要标题、图层选择计数和自动生成功能

        // 创建标签栏
        this.tabBar = this.createTabBar();
        this.editorContainer.appendChild(this.tabBar);

        // 创建主内容区域
        this.contentArea = this.createContentArea();
        this.editorContainer.appendChild(this.contentArea);

        // 将容器添加到节点
        this.domWidget = this.node.addDOMWidget("kontext_super_prompt", "div", this.editorContainer, {
            serialize: false,
            hideOnZoom: false,
            getValue: () => this.getEditorData(),
            setValue: (value) => this.setEditorData(value)
        });

        // 设置节点尺寸
        const nodeWidth = 816; // 1020 * 0.8 - 减小20%
        const nodeHeight = 907; // KSP_NS.constants.EDITOR_SIZE.HEIGHT + 50 + 20%
        this.node.size = [nodeWidth, nodeHeight];
        this.node.setSize?.(this.node.size);
        
        // 确保节点重新计算大小
        this.updateNodeSize();

        // 设置事件监听
        this.setupEventListeners();
        
        // 注意：不在这里调用 restoreDataFromWidgets，因为UI组件还没创建
        // 数据恢复将在 onConfigure 中处理
        
        // 初始化隐藏widget（从localStorage恢复API设置）
        const initData = {
            edit_mode: this.currentEditMode,
            operation_type: this.currentOperationType,
            description: this.description,
            constraint_prompts: '',
            decorative_prompts: '',
            selected_layers: JSON.stringify(this.selectedLayers),
            auto_generate: this.autoGenerate,
            generated_prompt: this.generatedPrompt
        };
        
        // 尝试从localStorage恢复API设置
        if (window.kontextAPIManager) {
            const savedProvider = window.kontextAPIManager.getSavedProvider();
            if (savedProvider) {
                initData.api_provider = savedProvider;
                const savedKey = window.kontextAPIManager.getKey(savedProvider);
                if (savedKey) {
                    initData.api_key = savedKey;
                }
            }
        }
        
        this.createHiddenWidgets(initData);
        
        // 隐藏所有持久化相关的widget
        this.hideAllPersistenceWidgets();
        
        // 初始化显示（切换到默认标签页）
        this.switchTab('local');
        
        // 设置默认操作类型（匹配global标签页）
        this.currentOperationType = 'global_color_grade'; // 全局编辑的默认操作类型
        
        // 保存初始操作类型，避免被其他操作覆盖
        const initialOperationType = this.currentOperationType;
        
        setTimeout(() => {
            // 确保操作类型没有被覆盖
            if (!this.currentOperationType || this.currentOperationType === '') {
                this.currentOperationType = initialOperationType;
            }
            
            // 确保下拉框被正确设置并触发变化事件
            const selects = this.editorContainer.querySelectorAll('.operation-select');
            selects.forEach(select => {
                const option = select.querySelector(`option[value="${this.currentOperationType}"]`);
                if (option) {
                    select.value = this.currentOperationType;
                    // 触发change事件来更新提示词
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                }
            });
            
            this.updateOperationButtons(); // 更新按钮状态
            
            // 提示词将在标签页切换时按需加载
            
            this.refreshLayerInfo();
            
            // 强制再次尝试显示提示词
            setTimeout(() => {
                // 确保当前选项卡的提示词容器已填充
                const currentPanel = this.tabContents[this.currentCategory];
                if (currentPanel) {
                    const constraintContainer = currentPanel.querySelector('.constraint-prompts-container');
                    const decorativeContainer = currentPanel.querySelector('.decorative-prompts-container');
                    
                    if (constraintContainer && constraintContainer.children.length === 0) {
                        // 更新全局引用
                        this.constraintContainer = constraintContainer;
                        // 使用通用约束提示词强制填充
                        this.updateConstraintContainer(['保持自然外观', '确保技术精度', '维持视觉连贯性', '严格质量控制']);
                    }
                    if (decorativeContainer && decorativeContainer.children.length === 0) {
                        // 更新全局引用
                        this.decorativeContainer = decorativeContainer;
                        // 使用通用修饰提示词强制填充
                        this.updateDecorativeContainer(['增强质量', '改善视觉效果', '专业完成', '艺术卓越']);
                    }
                }
                
                // 再次强制检查
                setTimeout(() => {
                    // Final check completed
                }, 500);
            }, 1000);
        }, 500);
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'kontext-toolbar';
        toolbar.style.cssText = `
            height: ${KSP_NS.constants.EDITOR_SIZE.TOOLBAR_HEIGHT}px;
            background: #2a2a2a;
            border-bottom: 1px solid #444;
            display: flex;
            align-items: center;
            padding: 0 16px;
            gap: 16px;
        `;

        // 标题
        const title = document.createElement('div');
        title.style.cssText = `
            color: #fff;
            font-size: 14px;
            font-weight: bold;
        `;
        title.textContent = 'Super Prompt 生成器';

        // 自动生成开关
        const autoGenLabel = document.createElement('label');
        autoGenLabel.style.cssText = `
            display: flex;
            align-items: center;
            color: #ccc;
            font-size: 10px;
            cursor: pointer;
            margin-left: auto;
        `;

        this.autoGenCheckbox = document.createElement('input');
        this.autoGenCheckbox.type = 'checkbox';
        this.autoGenCheckbox.checked = this.autoGenerate;
        this.autoGenCheckbox.style.cssText = `
            margin-right: 6px;
            accent-color: #9C27B0;
        `;

        autoGenLabel.appendChild(this.autoGenCheckbox);
        autoGenLabel.appendChild(document.createTextNode('自动生成约束修饰词'));

        // 选中图层计数
        this.layerCountDisplay = document.createElement('span');
        this.layerCountDisplay.style.cssText = `
            color: #888;
            font-size: 10px;
        `;
        this.updateLayerCountDisplay();

        toolbar.appendChild(title);
        toolbar.appendChild(this.layerCountDisplay);
        toolbar.appendChild(autoGenLabel);

        return toolbar;
    }

    createTabBar() {
        const tabBar = document.createElement('div');
        tabBar.className = 'kontext-tab-bar';
        tabBar.style.cssText = `
            height: ${KSP_NS.constants.EDITOR_SIZE.TAB_HEIGHT}px;
            background: #2a2a2a;
            border-bottom: 1px solid #444;
            display: flex;
            align-items: center;
        `;

        // 使用Kontext菜单系统配置 - 基于1026样本数据
        const kontextTabs = window.KontextMenuSystem ? 
            window.KontextMenuSystem.getTabConfig() : [
                { id: 'local_editing', name: '局部编辑', emoji: '🎯', frequency: '49.5%' },
                { id: 'text_editing', name: '文字编辑', emoji: '📝', frequency: '9.0%' },
                { id: 'global_editing', name: '全局编辑', emoji: '🌍', frequency: '25.5%' },
                { id: 'creative_reconstruction', name: '创意重构', emoji: '🎭', frequency: '25.0%' },
                { id: 'professional_operations', name: '专业操作', emoji: '💼', badge: '商业版' }
            ];
        
        // 添加API和Ollama选项卡
        const tabs = [
            ...kontextTabs.map(tab => ({
                id: tab.id,
                name: window.KontextMenuSystem ? 
                    window.KontextMenuSystem.getTabDisplayName(tab) : 
                    `${tab.emoji} ${tab.name} ${tab.frequency ? `(${tab.frequency})` : ''}`,
                isNew: tab.isNew,
                badge: tab.badge
            })),
            { id: 'api', name: '🌐 远程API' },
            { id: 'ollama', name: '🦙 本地Ollama' }
        ];

        tabs.forEach(tab => {
            const tabButton = document.createElement('button');
            tabButton.className = `tab-button tab-${tab.id}`;
            tabButton.textContent = tab.name;
            tabButton.style.cssText = `
                background: none;
                border: none;
                color: #888;
                padding: 8px 16px;
                font-size: 13px;  // 增加2px字体大小
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all 0.2s;
                position: relative;
                overflow: visible;
            `;
            
            // 添加新功能标识
            if (tab.isNew) {
                const newBadge = document.createElement('span');
                newBadge.textContent = 'NEW';
                newBadge.style.cssText = `
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: #ff4444;
                    color: white;
                    font-size: 10px;
                    padding: 2px 4px;
                    border-radius: 8px;
                    font-weight: bold;
                    pointer-events: none;
                `;
                tabButton.appendChild(newBadge);
            }
            
            // 添加徽章
            if (tab.badge) {
                tabButton.style.background = 'linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 100%)';
            }

            this.addEventListenerManaged(tabButton, 'click', () => {
                this.switchTab(tab.id);
            });

            tabBar.appendChild(tabButton);
        });

        return tabBar;
    }

    createContentArea() {
        const contentArea = document.createElement('div');
        contentArea.className = 'kontext-content-area';
        contentArea.style.cssText = `
            flex: 1;
            display: flex;
            overflow: hidden;
        `;

        // 左侧面板 - 图层选择
        this.leftPanel = this.createLeftPanel();
        contentArea.appendChild(this.leftPanel);

        // 右侧面板 - 编辑控制
        this.rightPanel = this.createRightPanel();
        contentArea.appendChild(this.rightPanel);

        return contentArea;
    }

    createLeftPanel() {
        const panel = document.createElement('div');
        panel.className = 'kontext-left-panel';
        panel.style.cssText = `
            width: 216px;
            background: #1a1a1a;
            border-right: 1px solid #444;
            display: flex;
            flex-direction: column;
        `;

        // 图层面板标题
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 12px;
            background: #2a2a2a;
            border-bottom: 1px solid #444;
            color: #fff;
            font-size: 10px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;

        const title = document.createElement('span');
        title.textContent = '📋 图层选择';

        const buttonGroup = document.createElement('div');
        buttonGroup.style.cssText = `
            display: flex;
            gap: 4px;
        `;

        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '🔄';
        refreshBtn.title = '刷新图层信息';
        refreshBtn.style.cssText = `
            background: #4CAF50;
            color: white;
            border: 1px solid #66bb6a;
            border-radius: 3px;
            padding: 2px 6px;
            font-size: 10px;
            cursor: pointer;
        `;

        const selectAllBtn = document.createElement('button');
        selectAllBtn.textContent = '全选/取消';
        selectAllBtn.style.cssText = `
            background: #444;
            color: white;
            border: 1px solid #666;
            border-radius: 3px;
            padding: 2px 8px;
            font-size: 10px;
            cursor: pointer;
        `;

        buttonGroup.appendChild(refreshBtn);
        buttonGroup.appendChild(selectAllBtn);
        header.appendChild(title);
        header.appendChild(buttonGroup);

        // 图层列表
        this.layerList = document.createElement('div');
        this.layerList.className = 'layer-list';
        this.layerList.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 6px;
        `;

        panel.appendChild(header);
        panel.appendChild(this.layerList);

        // 绑定按钮事件 - 使用管理方法防止监听器泄漏
        this.addEventListenerManaged(refreshBtn, 'click', () => {
            this.refreshLayerInfo();
        });

        this.addEventListenerManaged(selectAllBtn, 'click', () => {
            this.toggleSelectAll();
        });

        return panel;
    }

    createRightPanel() {
        const panel = document.createElement('div');
        panel.className = 'kontext-right-panel';
        panel.style.cssText = `
            flex: 1;
            background: #1a1a1a;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        // 创建各个编辑模式的内容面板 - 支持Kontext新架构
        this.tabContents = {
            local_editing: this.createLocalEditPanel(),
            creative_reconstruction: this.createCreativeEditPanel(), // 新增
            global_editing: this.createGlobalEditPanel(), 
            text_editing: this.createTextEditPanel(),
            professional_operations: this.createProfessionalEditPanel(),
            api: this.createAPIEditPanel(),
            ollama: this.createOllamaEditPanel()
        };

        // 添加所有面板，但只显示当前激活的
        Object.values(this.tabContents).forEach(content => {
            panel.appendChild(content);
        });

        return panel;
    }

    createLocalEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel local-edit-panel';
        panel.style.cssText = `
            flex: 1;
            display: none;
            flex-direction: column;
            overflow-y: auto;
        `;

        // Kontext双下拉框系统
        if (window.KontextMenuSystem) {
            const dropdownContainer = document.createElement('div');
            this.localDropdownUI = window.KontextMenuSystem.createDropdownUI(dropdownContainer, {
                onOperationChange: (editingType, operationType) => {
                    this.handleOperationChange('local_editing', operationType);
                },
                onSpecificChange: (editingType, operationType, specificOperation) => {
                    this.handleSpecificOperationChange('local_editing', operationType, specificOperation);
                }
            });
            this.localDropdownUI.setEditingType('local_editing');
            panel.appendChild(dropdownContainer);
        } else {
            // 操作类型选择 - 兼容模式
            const operationSection = this.createOperationTypeSection('local');
            panel.appendChild(operationSection);
        }

        // 描述输入
        const descriptionSection = this.createDescriptionSection('local');
        panel.appendChild(descriptionSection);

        const constraintSection = this.createConstraintPromptsSection();
        panel.appendChild(constraintSection);

        // 修饰性提示词
        const decorativeSection = this.createDecorativePromptsSection();
        panel.appendChild(decorativeSection);

        // 生成按钮
        const generateSection = this.createGenerateSection('local');
        panel.appendChild(generateSection);

        return panel;
    }

    createGlobalEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel global-edit-panel';
        panel.style.cssText = `
            flex: 1;
            display: none;
            flex-direction: column;
            padding: 16px;
            overflow-y: auto;
        `;

        // 全局编辑不需要图层选择提示
        const notice = document.createElement('div');
        notice.style.cssText = `
            background: #2a4a2a;
            border: 1px solid #4a8a4a;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 16px;
            color: #8FBC8F;
            font-size: 10px;
        `;
        notice.textContent = 'ℹ️ 全局编辑将应用于整个图像，无需选择图层';
        panel.appendChild(notice);

        // Kontext双下拉框系统
        if (window.KontextMenuSystem) {
            const dropdownContainer = document.createElement('div');
            this.globalDropdownUI = window.KontextMenuSystem.createDropdownUI(dropdownContainer, {
                onOperationChange: (editingType, operationType) => {
                    this.handleOperationChange('global_editing', operationType);
                },
                onSpecificChange: (editingType, operationType, specificOperation) => {
                    this.handleSpecificOperationChange('global_editing', operationType, specificOperation);
                }
            });
            this.globalDropdownUI.setEditingType('global_editing');
            panel.appendChild(dropdownContainer);
        } else {
            // 操作类型选择 - 兼容模式
            const operationSection = this.createOperationTypeSection('global');
            panel.appendChild(operationSection);
        }

        // 描述输入
        const descriptionSection = this.createDescriptionSection('global');
        panel.appendChild(descriptionSection);

        const constraintSection = this.createConstraintPromptsSection();
        panel.appendChild(constraintSection);

        // 修饰性提示词
        const decorativeSection = this.createDecorativePromptsSection();
        panel.appendChild(decorativeSection);

        // 生成按钮
        const generateSection = this.createGenerateSection('global');
        panel.appendChild(generateSection);

        return panel;
    }

    createCreativeEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel creative-edit-panel';
        panel.style.cssText = `
            flex: 1;
            display: none;
            flex-direction: column;
            overflow-y: auto;
        `;

        // 简洁的创意重构提示
        const notice = document.createElement('div');
        notice.style.cssText = `
            background: #2a2a3a;
            border: 1px solid #4a4a5a;
            border-radius: 4px;
            padding: 8px 12px;
            margin: 16px;
            color: #ccc;
            font-size: 13px;  // 增加2px字体大小
        `;
        notice.innerHTML = `🎨 创意重构：将图像元素进行艺术性改造和风格转换`;
        panel.appendChild(notice);

        // Kontext双下拉框系统 - 创意重构专用
        if (window.KontextMenuSystem) {
            const dropdownContainer = document.createElement('div');
            this.creativeDropdownUI = window.KontextMenuSystem.createDropdownUI(dropdownContainer, {
                onOperationChange: (editingType, operationType) => {
                    this.handleOperationChange('creative_reconstruction', operationType);
                },
                onSpecificChange: (editingType, operationType, specificOperation) => {
                    this.handleSpecificOperationChange('creative_reconstruction', operationType, specificOperation);
                }
            });
            panel.appendChild(dropdownContainer);
        }

        // 描述输入 - 创意重构
        const descriptionSection = this.createDescriptionSection('creative', {
            placeholder: '输入创意描述...\n例如: "oil painting style" 或 "metallic texture"',
            minHeight: '80px'
        });
        panel.appendChild(descriptionSection);

        // 创意提示词库
        const creativePromptsSection = this.createCreativePromptsSection();
        panel.appendChild(creativePromptsSection);

        // 生成按钮
        const generateSection = this.createGenerateSection('creative');
        panel.appendChild(generateSection);

        return panel;
    }

    createTextEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel text-edit-panel';
        panel.style.cssText = `
            flex: 1;
            display: none;
            flex-direction: column;
            padding: 16px;
            overflow-y: auto;
        `;

        // 文字编辑需要图层选择提示
        const notice = document.createElement('div');
        notice.style.cssText = `
            background: #4a3a2a;
            border: 1px solid #8a6a4a;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 16px;
            color: #DEB887;
            font-size: 10px;
        `;
        notice.textContent = '⚠️ 文字编辑需要选择包含文字的图层';
        panel.appendChild(notice);

        // Kontext双下拉框系统
        if (window.KontextMenuSystem) {
            const dropdownContainer = document.createElement('div');
            this.textDropdownUI = window.KontextMenuSystem.createDropdownUI(dropdownContainer, {
                onOperationChange: (editingType, operationType) => {
                    this.handleOperationChange('text_editing', operationType);
                },
                onSpecificChange: (editingType, operationType, specificOperation) => {
                    this.handleSpecificOperationChange('text_editing', operationType, specificOperation);
                }
            });
            this.textDropdownUI.setEditingType('text_editing');
            panel.appendChild(dropdownContainer);
        } else {
            // 操作类型选择 - 兼容模式
            const operationSection = this.createOperationTypeSection('text');
            panel.appendChild(operationSection);
        }

        // 描述输入
        const descriptionSection = this.createDescriptionSection('text');
        panel.appendChild(descriptionSection);

        const constraintSection = this.createConstraintPromptsSection();
        panel.appendChild(constraintSection);

        // 修饰性提示词
        const decorativeSection = this.createDecorativePromptsSection();
        panel.appendChild(decorativeSection);

        // 生成按钮
        const generateSection = this.createGenerateSection('text');
        panel.appendChild(generateSection);

        return panel;
    }

    createProfessionalEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel professional-edit-panel';
        panel.style.cssText = `
            flex: 1;
            display: none;
            flex-direction: column;
            padding: 16px;
            overflow-y: auto;
        `;

        // 专业操作说明
        const notice = document.createElement('div');
        notice.style.cssText = `
            background: #2a2a4a;
            border: 1px solid #4a4a8a;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 16px;
            color: #9999ff;
            font-size: 10px;
        `;
        notice.textContent = '🔧 专业操作支持全局和局部编辑，可选择性使用图层';
        panel.appendChild(notice);

        // Kontext双下拉框系统
        if (window.KontextMenuSystem) {
            const dropdownContainer = document.createElement('div');
            this.professionalDropdownUI = window.KontextMenuSystem.createDropdownUI(dropdownContainer, {
                onOperationChange: (editingType, operationType) => {
                    this.handleOperationChange('professional_operations', operationType);
                },
                onSpecificChange: (editingType, operationType, specificOperation) => {
                    this.handleSpecificOperationChange('professional_operations', operationType, specificOperation);
                }
            });
            this.professionalDropdownUI.setEditingType('professional_operations');
            panel.appendChild(dropdownContainer);
        } else {
            // 操作类型选择 - 兼容模式
            const operationSection = this.createOperationTypeSection('professional');
            panel.appendChild(operationSection);
        }

        // 描述输入
        const descriptionSection = this.createDescriptionSection('professional');
        panel.appendChild(descriptionSection);

        const constraintSection = this.createConstraintPromptsSection();
        panel.appendChild(constraintSection);

        // 修饰性提示词
        const decorativeSection = this.createDecorativePromptsSection();
        panel.appendChild(decorativeSection);

        // 生成按钮
        const generateSection = this.createGenerateSection('professional');
        panel.appendChild(generateSection);

        return panel;
    }

    createAPIEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel api-edit-panel';
        panel.style.cssText = `
            flex: 1;
            display: none;
            flex-direction: column;
            padding: 16px;
            overflow-y: auto;
        `;

        // API编辑说明
        const notice = document.createElement('div');
        notice.style.cssText = `
            background: #2a4a4a;
            border: 1px solid #4a8a8a;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 16px;
            color: #8FBC8F;
            font-size: 10px;
        `;
        notice.textContent = '🌐 使用云端AI模型生成高质量的编辑提示词';
        panel.appendChild(notice);

        // API配置区域
        const apiConfigSection = this.createAPIConfigSection();
        panel.appendChild(apiConfigSection);

        // 描述输入
        const descriptionSection = this.createDescriptionSection('api');
        panel.appendChild(descriptionSection);

        // 生成按钮
        const generateSection = this.createGenerateSection('api');
        panel.appendChild(generateSection);

        return panel;
    }

    createOllamaEditPanel() {
        const panel = document.createElement('div');
        panel.className = 'edit-panel ollama-edit-panel';
        panel.style.cssText = `
            flex: 1;
            display: none;
            flex-direction: column;
            padding: 16px;
            overflow-y: auto;
        `;

        // Ollama编辑说明
        const notice = document.createElement('div');
        notice.style.cssText = `
            background: #4a2a4a;
            border: 1px solid #8a4a8a;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 16px;
            color: #FF9999;
            font-size: 10px;
        `;
        notice.textContent = '🦙 使用本地Ollama模型生成私密安全的编辑提示词';
        panel.appendChild(notice);

        // Ollama服务管理区域
        const serviceManagementSection = this.createOllamaServiceManagementSection();
        panel.appendChild(serviceManagementSection);

        // 模型转换器区域
        const converterSection = this.createModelConverterSection();
        panel.appendChild(converterSection);

        // Ollama配置区域
        const ollamaConfigSection = this.createOllamaConfigSection();
        panel.appendChild(ollamaConfigSection);

        // 描述输入
        const descriptionSection = this.createDescriptionSection('ollama');
        panel.appendChild(descriptionSection);

        // 生成按钮
        const generateSection = this.createGenerateSection('ollama');
        panel.appendChild(generateSection);

        return panel;
    }

    createOperationTypeSection(category) {
        const section = document.createElement('div');
        section.className = 'operation-type-section';
        section.style.cssText = `
            margin-bottom: 10px;
        `;

        // 标题
        const title = document.createElement('div');
        title.style.cssText = `
            color: #fff;
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 6px;
        `;
        title.textContent = '🎨 操作类型';

        // 操作类型下拉框
        const operationSelect = document.createElement('select');
        operationSelect.className = `operation-select operation-select-${category}`;
        operationSelect.style.cssText = `
            width: 100%;
            background: #333;
            color: #fff;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 12px;
            cursor: pointer;
            outline: none;
        `;

        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '请选择操作类型...';
        defaultOption.disabled = true;
        // 不设置 selected = true，让初始化代码来设置正确的选项
        operationSelect.appendChild(defaultOption);

        // 添加操作选项
        const templates = KSP_NS.constants.OPERATION_CATEGORIES[category]?.templates || [];
        templates.forEach(templateId => {
            const template = KSP_NS.constants.OPERATION_TEMPLATES[templateId];
            if (template) {
                const option = document.createElement('option');
                option.value = templateId;
                option.textContent = template.label;
                operationSelect.appendChild(option);
            }
        });

        // 添加事件监听
        operationSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.selectOperationType(e.target.value);
            }
        });

        section.appendChild(title);
        section.appendChild(operationSelect);

        return section;
    }

    createDescriptionSection(tabId) {
        const section = document.createElement('div');
        section.className = 'description-section';
        section.style.cssText = `
            margin-bottom: 6px;
        `;

        // 标题容器
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        `;
        
        const title = document.createElement('div');
        title.style.cssText = `
            color: #fff;
            font-size: 10px;
            font-weight: bold;
        `;
        title.textContent = '✏️ 编辑描述';
        
        // 翻译按钮
        const translateBtn = document.createElement('button');
        translateBtn.textContent = '🌐 中→英';
        translateBtn.title = '将中文描述翻译为英文';
        translateBtn.style.cssText = `
            background: #3a7bc8;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 10px;
            cursor: pointer;
            transition: all 0.3s;
        `;
        translateBtn.onmouseover = () => translateBtn.style.background = '#4a8bd8';
        translateBtn.onmouseout = () => translateBtn.style.background = '#3a7bc8';
        
        titleContainer.appendChild(title);
        titleContainer.appendChild(translateBtn);

        // 输入框
        const descriptionTextarea = document.createElement('textarea');
        descriptionTextarea.placeholder = '输入详细的编辑描述（支持中文）...';
        descriptionTextarea.style.cssText = `
            width: 100%;
            height: 48px;
            background: #2a2a2a;
            color: white;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 6px;
            font-size: 13px;  // 增加2px字体大小
            font-family: inherit;
            resize: vertical;
            outline: none;
        `;
        
        // 翻译功能
        translateBtn.addEventListener('click', async () => {
            const currentText = descriptionTextarea.value;
            if (!currentText) return;
            
            // 显示加载状态
            translateBtn.textContent = '⏳ 翻译中...';
            translateBtn.disabled = true;
            
            try {
                // 使用翻译助手
                const translator = window.translationHelper || new TranslationHelper();
                const translatedText = await translator.translate(currentText);
                
                // 更新文本框
                descriptionTextarea.value = translatedText;
                
                // 触发input事件以更新数据
                const event = new Event('input', { bubbles: true });
                descriptionTextarea.dispatchEvent(event);
                
                // 恢复按钮状态
                translateBtn.textContent = '✅ 已翻译';
                setTimeout(() => {
                    translateBtn.textContent = '🌐 中→英';
                }, 2000);
            } catch (error) {
                console.error('Translation failed:', error);
                translateBtn.textContent = '❌ 翻译失败';
                setTimeout(() => {
                    translateBtn.textContent = '🌐 中→英';
                }, 2000);
            } finally {
                translateBtn.disabled = false;
            }
        });
        
        // 设置选项卡特定的属性标识
        descriptionTextarea.setAttribute('data-tab', tabId);
        
        // 为每个描述输入框添加事件监听 - 现在只更新当前选项卡的数据
        descriptionTextarea.addEventListener('input', (e) => {
            const newValue = e.target.value;
            const currentTab = e.target.getAttribute('data-tab');
            
            // 只更新当前选项卡的数据
            if (this.tabData[currentTab]) {
                this.tabData[currentTab].description = newValue;
                // 更新当前选项卡访问器
                if (currentTab === this.currentCategory) {
                    this.currentTabData = this.tabData[currentTab];
                    // 描述变化时刷新增强约束
                    setTimeout(() => this.refreshEnhancedConstraints(), 300);
                }
                this.notifyNodeUpdate();
            }
        });
        
        // 设置初始值 - 从对应选项卡的数据中获取
        if (this.tabData[tabId] && this.tabData[tabId].description) {
            descriptionTextarea.value = this.tabData[tabId].description;
        }

        section.appendChild(titleContainer);
        section.appendChild(descriptionTextarea);

        return section;
    }

    createConstraintPromptsSection() {
        const section = document.createElement('div');
        section.className = 'constraint-prompts-section';
        section.style.cssText = `
            margin-bottom: 10px;
        `;

        // 标题
        const title = document.createElement('div');
        title.style.cssText = `
            color: #fff;
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;

        const titleText = document.createElement('span');
        titleText.textContent = '🛡️ 约束性提示词';

        title.appendChild(titleText);

        const constraintContainer = document.createElement('div');
        constraintContainer.className = 'constraint-prompts-container';
        constraintContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 3px;
            max-height: 55px;
            overflow-y: auto;
            padding: 6px;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 4px;
        `;
        
        // 不设置全局引用，让每个选项卡独立管理
        // this.constraintContainer 将在 switchTab 和 selectOperationType 中动态设置

        section.appendChild(title);
        section.appendChild(constraintContainer);

        // 自动添加按钮已移除

        return section;
    }

    createDecorativePromptsSection() {
        const section = document.createElement('div');
        section.className = 'decorative-prompts-section';
        section.style.cssText = `
            margin-bottom: 10px;
        `;

        // 标题
        const title = document.createElement('div');
        title.style.cssText = `
            color: #fff;
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;

        const titleText = document.createElement('span');
        titleText.textContent = '✨ 修饰性提示词';

        title.appendChild(titleText);

        // 修饰词容器 - 创建独立容器而不是覆盖全局引用
        const decorativeContainer = document.createElement('div');
        decorativeContainer.className = 'decorative-prompts-container';
        decorativeContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 3px;
            max-height: 55px;
            overflow-y: auto;
            padding: 6px;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 4px;
        `;
        
        // 不设置全局引用，让每个选项卡独立管理
        // this.decorativeContainer 将在 switchTab 和 selectOperationType 中动态设置

        section.appendChild(title);
        section.appendChild(decorativeContainer);

        // 自动添加按钮已移除

        return section;
    }

    createGenerateSection(tabId) {
        const section = document.createElement('div');
        section.className = 'generate-section';
        section.style.cssText = `
            margin-top: auto;
            padding-top: 16px;
            border-top: 1px solid #444;
        `;

        // 预览文本框标题容器
        const previewTitleContainer = document.createElement('div');
        previewTitleContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        `;
        
        // 标题
        const previewTitle = document.createElement('div');
        previewTitle.style.cssText = `
            color: #fff;
            font-size: 10px;
            font-weight: bold;
        `;
        previewTitle.textContent = '📝 提示词预览';
        
        // 翻译按钮
        const previewTranslateBtn = document.createElement('button');
        previewTranslateBtn.textContent = '🌐 中→英';
        previewTranslateBtn.title = '将中文提示词翻译为英文';
        previewTranslateBtn.style.cssText = `
            background: #3a7bc8;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 10px;
            cursor: pointer;
            transition: all 0.3s;
        `;
        previewTranslateBtn.onmouseover = () => previewTranslateBtn.style.background = '#4a8bd8';
        previewTranslateBtn.onmouseout = () => previewTranslateBtn.style.background = '#3a7bc8';
        
        previewTitleContainer.appendChild(previewTitle);
        previewTitleContainer.appendChild(previewTranslateBtn);
        
        // 创建预览文本框（每个选项卡独立的textarea）
        const promptPreviewTextarea = document.createElement('textarea');
        promptPreviewTextarea.placeholder = '生成的超级提示词将在此处显示，可编辑修改...';
        promptPreviewTextarea.style.cssText = `
            width: 100%;
            height: 198px;  // 减少高度10% (220px - 22px = 198px)
            background: #2a2a2a;
            color: #fff;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 6px;
            font-size: 13px;  // 增加2px字体大小
            resize: vertical;
            font-family: monospace;
            margin-bottom: 12px;
            box-sizing: border-box;
        `;
        
        // 设置选项卡特定的属性标识
        promptPreviewTextarea.setAttribute('data-tab', tabId);
        
        // 翻译功能
        previewTranslateBtn.addEventListener('click', async () => {
            const currentText = promptPreviewTextarea.value;
            if (!currentText) return;
            
            // 显示加载状态
            previewTranslateBtn.textContent = '⏳ 翻译中...';
            previewTranslateBtn.disabled = true;
            
            try {
                // 使用翻译助手
                const translator = window.translationHelper || new TranslationHelper();
                const translatedText = await translator.translate(currentText);
                
                // 更新文本框
                promptPreviewTextarea.value = translatedText;
                
                // 触发input事件以更新数据
                const event = new Event('input', { bubbles: true });
                promptPreviewTextarea.dispatchEvent(event);
                
                // 恢复按钮状态
                previewTranslateBtn.textContent = '✅ 已翻译';
                setTimeout(() => {
                    previewTranslateBtn.textContent = '🌐 中→英';
                }, 2000);
            } catch (error) {
                console.error('Translation failed:', error);
                previewTranslateBtn.textContent = '❌ 翻译失败';
                setTimeout(() => {
                    previewTranslateBtn.textContent = '🌐 中→英';
                }, 2000);
            } finally {
                previewTranslateBtn.disabled = false;
            }
        });
        
        // 设置初始值 - 从对应选项卡的数据中获取
        if (this.tabData[tabId] && this.tabData[tabId].generatedPrompt) {
            promptPreviewTextarea.value = this.tabData[tabId].generatedPrompt;
        }
        
        // 添加事件监听器 - 只更新当前选项卡的数据
        promptPreviewTextarea.addEventListener('input', (e) => {
            const newValue = e.target.value;
            const currentTab = e.target.getAttribute('data-tab');
            
            // 只更新当前选项卡的数据
            if (this.tabData[currentTab]) {
                this.tabData[currentTab].generatedPrompt = newValue;
                // 更新当前选项卡访问器
                if (currentTab === this.currentCategory) {
                    this.currentTabData = this.tabData[currentTab];
                }
                this.notifyNodeUpdate();
            }
        });

        const buttonGroup = document.createElement('div');
        buttonGroup.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        const generateBtn = document.createElement('button');
        generateBtn.textContent = '🎯 生成超级提示词';
        generateBtn.style.cssText = `
            flex: 1;
            background: linear-gradient(45deg, #9C27B0, #673AB7);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 12px 16px;
            font-size: 13px;
            cursor: pointer;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(156, 39, 176, 0.3);
            transition: all 0.2s;
        `;

        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 复制';
        copyBtn.style.cssText = `
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 12px 16px;
            font-size: 13px;
            cursor: pointer;
            font-weight: 600;
            min-width: 60px;
        `;

        buttonGroup.appendChild(generateBtn);
        buttonGroup.appendChild(copyBtn);
        
        section.appendChild(previewTitleContainer);
        section.appendChild(promptPreviewTextarea);
        section.appendChild(buttonGroup);

        // 绑定事件
        generateBtn.addEventListener('click', () => {
            this.generateSuperPrompt();
        });

        copyBtn.addEventListener('click', () => {
            this.copyToClipboard();
        });

        return section;
    }

    createAPIConfigSection() {
        const section = document.createElement('div');
        section.className = 'api-config-section';
        section.style.cssText = `
            margin-bottom: 16px;
            padding: 12px;
            border: 1px solid #4a8a8a;
            border-radius: 6px;
            background: #1a2a2a;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            color: #8FBC8F;
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 12px;
        `;
        title.textContent = '🌐 远程API配置';

        // API提供商选择
        const providerRow = document.createElement('div');
        providerRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const providerLabel = document.createElement('span');
        providerLabel.style.cssText = `color: #ccc; font-size: 10px; width: 80px;`;
        providerLabel.textContent = 'API提供商:';
        
        const providerSelect = document.createElement('select');
        providerSelect.className = 'api-provider-select';
        providerSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 10px;
        `;
        const providerOptions = [
            { value: 'siliconflow', text: 'SiliconFlow (DeepSeek)' },
            { value: 'deepseek', text: 'DeepSeek 官方' },
            { value: 'qianwen', text: '千问 (阿里云)' },
            { value: 'modelscope', text: 'ModelScope (魔搭)' },
            { value: 'zhipu', text: '智谱AI (GLM)' },
            { value: 'moonshot', text: 'Moonshot (Kimi)' },
            { value: 'gemini', text: 'Google Gemini' },
            { value: 'claude', text: 'Claude (Anthropic)' },
            { value: 'openai', text: 'OpenAI' }
        ];
        providerOptions.forEach(provider => {
            const option = document.createElement('option');
            option.value = provider.value;
            option.textContent = provider.text;
            providerSelect.appendChild(option);
        });

        // API Key输入
        const keyRow = document.createElement('div');
        keyRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const keyLabel = document.createElement('span');
        keyLabel.style.cssText = `color: #ccc; font-size: 10px; width: 80px;`;
        keyLabel.textContent = 'API Key:';
        
        const keyInput = document.createElement('input');
        keyInput.className = 'api-key-input';
        keyInput.type = 'password';
        keyInput.placeholder = '输入API密钥/访问令牌...';
        keyInput.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 10px;
        `;

        // 模型选择
        const modelRow = document.createElement('div');
        modelRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const modelLabel = document.createElement('span');
        modelLabel.style.cssText = `color: #ccc; font-size: 10px; width: 80px;`;
        modelLabel.textContent = '模型:';
        
        const modelSelect = document.createElement('select');
        modelSelect.className = 'api-model-select';
        modelSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 10px;
        `;
        // 定义每个提供商的默认模型
        const providerModels = {
            'siliconflow': ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1'],
            'deepseek': ['deepseek-chat'],
            'qianwen': ['qwen-turbo', 'qwen-plus', 'qwen-max'],
            'modelscope': ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen2.5-72b-instruct', 'qwen2-72b-instruct'],
            'zhipu': ['glm-4', 'glm-4-flash', 'glm-4-plus', 'glm-4v', 'glm-4v-plus'],
            'moonshot': ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
            'gemini': ['gemini-pro', 'gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
            'claude': ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
            'openai': ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'o1-mini', 'o1-preview']
        };
        
        // 更新模型列表的函数
        const updateModelList = async (provider) => {
            modelSelect.innerHTML = '';
            
            // 添加加载提示
            const loadingOption = document.createElement('option');
            loadingOption.value = '';
            loadingOption.textContent = '加载模型列表中...';
            modelSelect.appendChild(loadingOption);
            
            try {
                // 尝试动态获取模型列表
                const apiKey = this.apiConfig?.keyInput?.value || '';
                if (apiKey && this.supportsDynamicModels(provider)) {
                    const dynamicModels = await this.fetchDynamicModels(provider, apiKey);
                    if (dynamicModels && dynamicModels.length > 0) {
                        modelSelect.innerHTML = '';
                        dynamicModels.forEach(model => {
                            const option = document.createElement('option');
                            option.value = model;
                            option.textContent = model;
                            modelSelect.appendChild(option);
                        });
                        return;
                    }
                }
            } catch (error) {
                console.warn(`动态获取${provider}模型失败:`, error);
            }
            
            // 回退到预定义模型列表
            modelSelect.innerHTML = '';
            const models = providerModels[provider] || ['custom-model'];
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
        };
        
        // 不在这里初始化模型列表，等待数据恢复时再初始化
        
        // 监听提供商变化
        providerSelect.addEventListener('change', () => {
            updateModelList(providerSelect.value);
            // 保存到当前标签页数据
            if (this.currentTabData) {
                this.currentTabData.apiProvider = providerSelect.value;
                this.saveCurrentDataToWidgets();
                this.notifyNodeUpdate();
            }
        });

        // 监听API key变化，自动更新模型列表
        let keyInputTimeout;
        keyInput.addEventListener('input', () => {
            // 防抖动，避免频繁请求
            clearTimeout(keyInputTimeout);
            keyInputTimeout = setTimeout(() => {
                const provider = providerSelect.value;
                const apiKey = keyInput.value.trim();
                if (apiKey && this.supportsDynamicModels(provider)) {
                    updateModelList(provider);
                }
            }, 1000); // 1秒延迟
            
            // 立即保存到当前标签页数据
            if (this.currentTabData) {
                this.currentTabData.apiKey = keyInput.value;
                this.saveCurrentDataToWidgets();
                this.notifyNodeUpdate();
            }
        });
        
        // 监听模型选择变化
        modelSelect.addEventListener('change', () => {
            if (this.currentTabData) {
                this.currentTabData.apiModel = modelSelect.value;
                this.saveCurrentDataToWidgets();
                this.notifyNodeUpdate();
            }
        });

        // 编辑意图选择
        const intentRow = document.createElement('div');
        intentRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const intentLabel = document.createElement('span');
        intentLabel.style.cssText = `color: #ccc; font-size: 10px; width: 80px;`;
        intentLabel.textContent = '编辑意图:';
        
        const intentSelect = document.createElement('select');
        intentSelect.className = 'api-intent-select';
        intentSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 10px;
        `;
        const intents = [
            // 编辑意图类型 - 与引导词库key保持一致
            { value: 'none', text: '无' },
            { value: 'color_adjustment', text: '颜色修改' },
            { value: 'object_removal', text: '物体移除' },
            { value: 'object_replacement', text: '物体替换' },
            { value: 'object_addition', text: '物体添加' },
            { value: 'background_change', text: '背景更换' },
            { value: 'face_swap', text: '换脸' },
            { value: 'quality_enhancement', text: '质量增强' },
            { value: 'image_restoration', text: '图像修复' },
            { value: 'style_transfer', text: '风格转换' },
            { value: 'text_editing', text: '文字编辑' },
            { value: 'lighting_adjustment', text: '光线调整' },
            { value: 'perspective_correction', text: '透视校正' },
            { value: 'blur_sharpen', text: '模糊/锐化' },
            { value: 'local_deformation', text: '局部变形' },
            { value: 'composition_adjustment', text: '构图调整' },
            { value: 'general_editing', text: '通用编辑' },
            // 基于1026条数据分析的新增高频操作类型
            { value: 'identity_conversion', text: '身份转换' },
            { value: 'wearable_assignment', text: '穿戴赋予' },
            { value: 'positional_placement', text: '位置放置' },
            { value: 'narrative_scene', text: '叙事场景' },
            { value: 'style_temporal', text: '风格时代' },
            { value: 'multi_step_editing', text: '多步编辑' },
            { value: 'depth_processing', text: '深度处理' },
            { value: 'digital_art_effects', text: '数字艺术' }
        ];
        intents.forEach(intent => {
            const option = document.createElement('option');
            option.value = intent.value;
            option.textContent = intent.text;
            if (intent.value === 'general_editing') option.selected = true;
            intentSelect.appendChild(option);
        });

        // 处理风格选择
        const styleRow = document.createElement('div');
        styleRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const styleLabel = document.createElement('span');
        styleLabel.style.cssText = `color: #ccc; font-size: 10px; width: 80px;`;
        styleLabel.textContent = '处理风格:';
        
        const styleSelect = document.createElement('select');
        styleSelect.className = 'api-style-select';
        styleSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 10px;
        `;
        const styles = [
            // 应用场景/风格 - 用于什么场景
            { value: 'none', text: '无' },
            { value: 'ecommerce_product', text: '电商产品' },
            { value: 'social_media', text: '社交媒体' },
            { value: 'marketing_campaign', text: '营销活动' },
            { value: 'portrait_professional', text: '专业肖像' },
            { value: 'lifestyle', text: '生活方式' },
            { value: 'food_photography', text: '美食摄影' },
            { value: 'real_estate', text: '房地产' },
            { value: 'fashion_retail', text: '时尚零售' },
            { value: 'automotive', text: '汽车展示' },
            { value: 'beauty_cosmetics', text: '美妆化妆品' },
            { value: 'corporate_branding', text: '企业品牌' },
            { value: 'event_photography', text: '活动摄影' },
            { value: 'product_catalog', text: '产品目录' },
            { value: 'artistic_creation', text: '艺术创作' },
            { value: 'documentary', text: '纪实摄影' },
            { value: 'auto_smart', text: '智能自动' }
        ];
        styles.forEach(style => {
            const option = document.createElement('option');
            option.value = style.value;
            option.textContent = style.text;
            if (style.value === 'auto_smart') option.selected = true;
            styleSelect.appendChild(option);
        });

        providerRow.appendChild(providerLabel);
        providerRow.appendChild(providerSelect);
        keyRow.appendChild(keyLabel);
        keyRow.appendChild(keyInput);
        modelRow.appendChild(modelLabel);
        modelRow.appendChild(modelSelect);
        intentRow.appendChild(intentLabel);
        intentRow.appendChild(intentSelect);
        styleRow.appendChild(styleLabel);
        styleRow.appendChild(styleSelect);

        section.appendChild(title);
        section.appendChild(providerRow);
        section.appendChild(keyRow);
        section.appendChild(modelRow);
        section.appendChild(intentRow);
        section.appendChild(styleRow);

        // 添加编辑意图选择事件监听
        intentSelect.addEventListener('change', () => {
            if (this.currentTabData) {
                this.currentTabData.apiIntent = intentSelect.value;
                this.saveCurrentDataToWidgets();
                this.notifyNodeUpdate();
            }
        });

        // 添加处理风格选择事件监听
        styleSelect.addEventListener('change', () => {
            if (this.currentTabData) {
                this.currentTabData.apiStyle = styleSelect.value;
                this.saveCurrentDataToWidgets();
                this.notifyNodeUpdate();
            }
        });

        // 保存配置到实例
        this.apiConfig = {
            providerSelect,
            keyInput,
            modelSelect,
            intentSelect,
            styleSelect
        };

        // 存储为类属性，以便恢复数据时访问
        this.apiProviderSelect = providerSelect;
        this.apiKeyInput = keyInput;
        this.apiModelSelect = modelSelect;
        this.apiIntentSelect = intentSelect;
        this.apiStyleSelect = styleSelect;
        
        // 存储updateModelList函数以便后续调用
        this.updateAPIModelList = updateModelList;
        
        // 延迟初始化，确保在数据恢复后再设置默认值
        setTimeout(() => {
            // 如果没有已保存的提供商，使用默认提供商初始化模型列表
            if (!this.currentTabData?.apiProvider) {
                updateModelList('siliconflow');
            }
        }, 50);

        return section;
    }

    // 异步恢复API配置，确保正确的恢复顺序
    async restoreAPIConfiguration() {
        if (!this.currentTabData || !this.apiProviderSelect) return;
        
        // 1. 先恢复API提供商
        if (this.currentTabData.apiProvider) {
            this.apiProviderSelect.value = this.currentTabData.apiProvider;
        }
        
        // 2. 恢复API密钥
        if (this.currentTabData.apiKey && this.apiKeyInput) {
            this.apiKeyInput.value = this.currentTabData.apiKey;
        }
        
        // 3. 根据提供商更新模型列表，然后恢复模型选择
        if (this.updateAPIModelList && this.currentTabData.apiProvider) {
            try {
                await this.updateAPIModelList(this.currentTabData.apiProvider);
                
                // 等待模型列表更新完成后，恢复用户选择的模型
                if (this.currentTabData.apiModel && this.apiModelSelect) {
                    // 稍等一下确保DOM更新完成
                    setTimeout(() => {
                        this.apiModelSelect.value = this.currentTabData.apiModel;
                    }, 100);
                }
            } catch (error) {
                console.warn('恢复API模型列表失败:', error);
                // 如果动态获取失败，直接恢复模型选择
                if (this.currentTabData.apiModel && this.apiModelSelect) {
                    this.apiModelSelect.value = this.currentTabData.apiModel;
                }
            }
        }
        
        // 4. 恢复其他配置
        if (this.currentTabData.apiIntent && this.apiIntentSelect) {
            this.apiIntentSelect.value = this.currentTabData.apiIntent;
        }
        
        if (this.currentTabData.apiStyle && this.apiStyleSelect) {
            this.apiStyleSelect.value = this.currentTabData.apiStyle;
        }
    }

    createOllamaServiceManagementSection() {
        const section = document.createElement('div');
        section.className = 'ollama-service-section';
        section.style.cssText = `
            margin-bottom: 16px;
            padding: 12px;
            border: 1px solid #666;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.03);
        `;

        // 紧凑的一行布局
        const controlRow = document.createElement('div');
        controlRow.style.cssText = `
            display: flex; 
            align-items: center; 
            gap: 6px; 
            font-size: 10px;
        `;
        
        // 服务标识
        const serviceLabel = document.createElement('span');
        serviceLabel.textContent = '🦙';
        serviceLabel.style.cssText = `font-size: 14px;`;
        
        // 状态显示
        this.ollamaStatusDisplay = document.createElement('span');
        this.ollamaStatusDisplay.style.cssText = `
            padding: 2px 6px; font-size: 10px; border-radius: 2px;
            font-weight: bold; min-width: 50px; text-align: center;
        `;
        this.ollamaStatusDisplay.textContent = '检测中';
        this.updateOllamaServiceStatus('检测中');

        // 启动/停止按钮
        this.ollamaServiceButton = document.createElement('button');
        this.ollamaServiceButton.style.cssText = `
            padding: 3px 8px; border: none; border-radius: 3px;
            background: #4CAF50; color: white; font-size: 10px;
            cursor: pointer; font-weight: bold; min-width: 40px;
        `;
        this.ollamaServiceButton.textContent = '启动';
        this.ollamaServiceButton.onclick = () => this.toggleOllamaService();

        // 释放内存按钮
        const unloadButton = document.createElement('button');
        unloadButton.style.cssText = `
            padding: 3px 8px; border: none; border-radius: 3px;
            background: #FF9800; color: white; font-size: 10px;
            cursor: pointer; font-weight: bold;
        `;
        unloadButton.textContent = '释放';
        unloadButton.title = '释放模型内存';
        unloadButton.onclick = () => this.unloadOllamaModels();

        // 刷新按钮
        const refreshButton = document.createElement('button');
        refreshButton.style.cssText = `
            padding: 3px 6px; border: none; border-radius: 3px;
            background: #2196F3; color: white; font-size: 10px;
            cursor: pointer; font-weight: bold;
        `;
        refreshButton.textContent = '🔄';
        refreshButton.title = '刷新状态';
        refreshButton.onclick = () => this.checkOllamaServiceStatus();

        // 组装元素 - 一行排列
        controlRow.appendChild(serviceLabel);
        controlRow.appendChild(this.ollamaStatusDisplay);
        controlRow.appendChild(this.ollamaServiceButton);
        controlRow.appendChild(unloadButton);
        controlRow.appendChild(refreshButton);
        
        section.appendChild(controlRow);

        // 初始状态检查
        this.checkOllamaServiceStatus();

        return section;
    }

    createOllamaConfigSection() {
        const section = document.createElement('div');
        section.className = 'ollama-config-section';
        section.style.cssText = `
            margin-bottom: 16px;
            padding: 12px;
            border: 1px solid #8a4a8a;
            border-radius: 6px;
            background: #2a1a2a;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            color: #FF9999;
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 12px;
        `;
        title.textContent = '🦙 本地Ollama配置';

        // Ollama URL输入
        const urlRow = document.createElement('div');
        urlRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const urlLabel = document.createElement('span');
        urlLabel.style.cssText = `color: #ccc; font-size: 10px; width: 80px;`;
        urlLabel.textContent = '服务地址:';
        
        const urlInput = document.createElement('input');
        urlInput.value = 'http://127.0.0.1:11434';
        urlInput.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 10px;
        `;

        // 模型选择
        const modelRow = document.createElement('div');
        modelRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const modelLabel = document.createElement('span');
        modelLabel.style.cssText = `color: #ccc; font-size: 10px; width: 80px;`;
        modelLabel.textContent = '模型:';
        
        const modelSelect = document.createElement('select');
        modelSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 10px;
        `;
        
        // 添加刷新按钮
        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '🔄';
        refreshBtn.style.cssText = `
            margin-left: 4px; background: #444; color: #fff; border: 1px solid #666;
            border-radius: 3px; padding: 4px 8px; cursor: pointer; font-size: 10px;
        `;
        
        // 温度设置
        const tempRow = document.createElement('div');
        tempRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const tempLabel = document.createElement('span');
        tempLabel.style.cssText = `color: #ccc; font-size: 10px; width: 80px;`;
        tempLabel.textContent = '温度:';
        
        const tempInput = document.createElement('input');
        tempInput.type = 'range';
        tempInput.min = '0.1';
        tempInput.max = '1.0';
        tempInput.step = '0.1';
        tempInput.value = '0.7';
        tempInput.style.cssText = `flex: 1; margin-right: 8px;`;
        
        const tempValue = document.createElement('span');
        tempValue.style.cssText = `color: #ccc; font-size: 10px; width: 30px;`;
        tempValue.textContent = '0.7';

        tempInput.addEventListener('input', () => {
            tempValue.textContent = tempInput.value;
        });

        urlRow.appendChild(urlLabel);
        urlRow.appendChild(urlInput);
        modelRow.appendChild(modelLabel);
        modelRow.appendChild(modelSelect);
        modelRow.appendChild(refreshBtn);
        tempRow.appendChild(tempLabel);
        tempRow.appendChild(tempInput);
        tempRow.appendChild(tempValue);

        // 编辑意图选择
        const intentRow = document.createElement('div');
        intentRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const intentLabel = document.createElement('span');
        intentLabel.style.cssText = `color: #ccc; font-size: 10px; width: 80px;`;
        intentLabel.textContent = '编辑意图:';
        
        const intentSelect = document.createElement('select');
        intentSelect.className = 'ollama-editing-intent';
        intentSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 10px;
        `;
        const intents = [
            // 编辑意图类型 - 与引导词库key保持一致
            { value: 'none', label: '无' },
            { value: 'color_adjustment', label: '颜色修改' },
            { value: 'object_removal', label: '物体移除' },
            { value: 'object_replacement', label: '物体替换' },
            { value: 'object_addition', label: '物体添加' },
            { value: 'background_change', label: '背景更换' },
            { value: 'face_swap', label: '换脸' },
            { value: 'quality_enhancement', label: '质量增强' },
            { value: 'image_restoration', label: '图像修复' },
            { value: 'style_transfer', label: '风格转换' },
            { value: 'text_editing', label: '文字编辑' },
            { value: 'lighting_adjustment', label: '光线调整' },
            { value: 'perspective_correction', label: '透视校正' },
            { value: 'blur_sharpen', label: '模糊/锐化' },
            { value: 'local_deformation', label: '局部变形' },
            { value: 'composition_adjustment', label: '构图调整' },
            { value: 'general_editing', label: '通用编辑' },
            // 基于1026条数据分析的新增高频操作类型
            { value: 'identity_conversion', label: '身份转换' },
            { value: 'wearable_assignment', label: '穿戴赋予' },
            { value: 'positional_placement', label: '位置放置' },
            { value: 'narrative_scene', label: '叙事场景' },
            { value: 'style_temporal', label: '风格时代' },
            { value: 'multi_step_editing', label: '多步编辑' },
            { value: 'depth_processing', label: '深度处理' },
            { value: 'digital_art_effects', label: '数字艺术' }
        ];
        intents.forEach(intent => {
            const option = document.createElement('option');
            option.value = intent.value;
            option.textContent = intent.label;
            if (intent.value === 'general_editing') option.selected = true;
            intentSelect.appendChild(option);
        });

        // 处理风格选择
        const styleRow = document.createElement('div');
        styleRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px;`;
        
        const styleLabel = document.createElement('span');
        styleLabel.style.cssText = `color: #ccc; font-size: 10px; width: 80px;`;
        styleLabel.textContent = '处理风格:';
        
        const styleSelect = document.createElement('select');
        styleSelect.className = 'ollama-processing-style';
        styleSelect.style.cssText = `
            flex: 1; background: #2a2a2a; color: #fff; border: 1px solid #555;
            border-radius: 3px; padding: 4px 8px; font-size: 10px;
        `;
        const styles = [
            // 应用场景/风格 - 与API模式保持一致
            { value: 'none', label: '无' },
            { value: 'ecommerce_product', label: '电商产品' },
            { value: 'social_media', label: '社交媒体' },
            { value: 'marketing_campaign', label: '营销活动' },
            { value: 'portrait_professional', label: '专业肖像' },
            { value: 'lifestyle', label: '生活方式' },
            { value: 'food_photography', label: '美食摄影' },
            { value: 'real_estate', label: '房地产' },
            { value: 'fashion_retail', label: '时尚零售' },
            { value: 'automotive', label: '汽车展示' },
            { value: 'beauty_cosmetics', label: '美妆化妆品' },
            { value: 'corporate_branding', label: '企业品牌' },
            { value: 'event_photography', label: '活动摄影' },
            { value: 'product_catalog', label: '产品目录' },
            { value: 'artistic_creation', label: '艺术创作' },
            { value: 'documentary', label: '纪实摄影' },
            { value: 'auto_smart', label: '智能自动' }
        ];
        styles.forEach(style => {
            const option = document.createElement('option');
            option.value = style.value;
            option.textContent = style.label;
            if (style.value === 'auto_smart') option.selected = true;
            styleSelect.appendChild(option);
        });

        // 自定义指引文本框（默认隐藏）
        const guidanceRow = document.createElement('div');
        guidanceRow.className = 'ollama-custom-guidance-row';
        guidanceRow.style.cssText = `display: none; margin-bottom: 8px;`;
        
        const guidanceLabel = document.createElement('div');
        guidanceLabel.style.cssText = `color: #ccc; font-size: 10px; margin-bottom: 4px;`;
        guidanceLabel.textContent = '自定义指引:';
        
        const guidanceTextarea = document.createElement('textarea');
        guidanceTextarea.className = 'ollama-custom-guidance';
        guidanceTextarea.placeholder = '输入自定义AI指引...';
        guidanceTextarea.style.cssText = `
            width: 100%; height: 80px; background: #2a2a2a; color: #fff; 
            border: 1px solid #555; border-radius: 3px; padding: 4px 8px; 
            font-size: 13px;  // 增加2px字体大小 resize: vertical; box-sizing: border-box;
        `;

        // 当选择自定义指引时显示文本框
        styleSelect.addEventListener('change', () => {
            guidanceRow.style.display = styleSelect.value === 'custom_guidance' ? 'block' : 'none';
        });

        // 额外选项
        const optionsRow = document.createElement('div');
        optionsRow.style.cssText = `display: flex; align-items: center; margin-bottom: 8px; gap: 16px;`;
        
        const visualCheckbox = document.createElement('input');
        visualCheckbox.type = 'checkbox';
        visualCheckbox.className = 'ollama-enable-visual';
        visualCheckbox.id = 'ollama-visual';
        
        const visualLabel = document.createElement('label');
        visualLabel.htmlFor = 'ollama-visual';
        visualLabel.style.cssText = `color: #ccc; font-size: 10px; cursor: pointer;`;
        visualLabel.textContent = '启用视觉分析';
        
        const unloadCheckbox = document.createElement('input');
        unloadCheckbox.type = 'checkbox';
        unloadCheckbox.className = 'ollama-auto-unload';
        unloadCheckbox.id = 'ollama-unload';
        
        const unloadLabel = document.createElement('label');
        unloadLabel.htmlFor = 'ollama-unload';
        unloadLabel.style.cssText = `color: #ccc; font-size: 10px; cursor: pointer;`;
        unloadLabel.textContent = '自动卸载模型';

        optionsRow.appendChild(visualCheckbox);
        optionsRow.appendChild(visualLabel);
        optionsRow.appendChild(unloadCheckbox);
        optionsRow.appendChild(unloadLabel);

        intentRow.appendChild(intentLabel);
        intentRow.appendChild(intentSelect);
        styleRow.appendChild(styleLabel);
        styleRow.appendChild(styleSelect);
        guidanceRow.appendChild(guidanceLabel);
        guidanceRow.appendChild(guidanceTextarea);

        section.appendChild(title);
        section.appendChild(urlRow);
        section.appendChild(modelRow);
        section.appendChild(tempRow);
        section.appendChild(intentRow);
        section.appendChild(styleRow);
        section.appendChild(guidanceRow);
        section.appendChild(optionsRow);

        // 保存引用以便后续访问
        this.ollamaUrlInput = urlInput;
        this.ollamaModelSelect = modelSelect;
        this.ollamaTempInput = tempInput;
        this.ollamaIntentSelect = intentSelect;
        this.ollamaStyleSelect = styleSelect;
        this.ollamaGuidanceTextarea = guidanceTextarea;
        this.ollamaVisualCheckbox = visualCheckbox;
        this.ollamaUnloadCheckbox = unloadCheckbox;

        // 添加刷新模型列表功能
        refreshBtn.addEventListener('click', async () => {
            try {
                const url = urlInput.value || 'http://127.0.0.1:11434';
                const response = await fetch('/ollama_flux_enhancer/get_models', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const models = await response.json();
                
                // 清空并重新填充模型列表
                modelSelect.innerHTML = '';
                if (models && models.length > 0) {
                    models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model;
                        option.textContent = model;
                        modelSelect.appendChild(option);
                    });
                } else {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = '未找到模型';
                    modelSelect.appendChild(option);
                }
            } catch (e) {
                console.error('获取Ollama模型失败:', e);
            }
        });

        return section;
    }

    createModelConverterSection() {
        const section = document.createElement('div');
        section.className = 'model-converter-section';
        section.style.cssText = `
            margin-bottom: 16px;
            padding: 12px;
            border: 1px solid #6a4a8a;
            border-radius: 6px;
            background: #1a1a2a;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            color: #BB99FF;
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 6px;
        `;
        title.textContent = '🔄 GGUF模型转换器';

        // 扫描按钮和状态显示
        const scanRow = document.createElement('div');
        scanRow.style.cssText = `display: flex; align-items: center; margin-bottom: 6px; gap: 6px;`;
        
        const scanBtn = document.createElement('button');
        scanBtn.textContent = '扫描GGUF模型';
        scanBtn.style.cssText = `
            background: #4a6a8a; color: #fff; border: 1px solid #6a8aaa;
            border-radius: 3px; padding: 4px 8px; cursor: pointer; font-size: 10px;
        `;
        
        const statusSpan = document.createElement('span');
        statusSpan.style.cssText = `color: #999; font-size: 10px; flex: 1;`;
        statusSpan.textContent = '请先扫描GGUF模型文件';

        scanRow.appendChild(scanBtn);
        scanRow.appendChild(statusSpan);

        // 模型列表容器
        const modelsContainer = document.createElement('div');
        modelsContainer.className = 'gguf-models-container';
        modelsContainer.style.cssText = `
            max-height: 120px; overflow-y: auto; border: 1px solid #444;
            border-radius: 3px; background: #1a1a1a; margin-bottom: 6px;
            display: none;
        `;

        // 说明文字
        const helpText = document.createElement('div');
        helpText.style.cssText = `color: #888; font-size: 10px; margin-top: 4px; line-height: 1.2;`;
        helpText.textContent = '将GGUF模型文件放置到 ComfyUI/models/ollama_import/ 目录下，点击扫描后可转换为Ollama格式';

        section.appendChild(title);
        section.appendChild(scanRow);
        section.appendChild(modelsContainer);
        section.appendChild(helpText);

        // 绑定扫描事件
        scanBtn.addEventListener('click', () => {
            this.scanGGUFModels(statusSpan, modelsContainer);
        });

        return section;
    }

    async scanGGUFModels(statusSpan, modelsContainer) {
        try {
            statusSpan.textContent = '正在扫描模型文件...';
            statusSpan.style.color = '#ff9';
            
            const response = await fetch('/ollama_converter/models');
            const data = await response.json();
            
            if (data.models && data.models.length > 0) {
                this.displayGGUFModels(data.models, modelsContainer, statusSpan);
                statusSpan.textContent = `发现 ${data.models.length} 个GGUF模型`;
                statusSpan.style.color = '#9f9';
                modelsContainer.style.display = 'block';
            } else {
                statusSpan.textContent = '未发现GGUF模型文件';
                statusSpan.style.color = '#f99';
                modelsContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('[Model Converter] 扫描失败:', error);
            statusSpan.textContent = '扫描失败: ' + error.message;
            statusSpan.style.color = '#f99';
            modelsContainer.style.display = 'none';
        }
    }

    displayGGUFModels(models, container, statusSpan) {
        container.innerHTML = '';
        
        models.forEach(model => {
            const modelItem = document.createElement('div');
            modelItem.style.cssText = `
                padding: 6px; border-bottom: 1px solid #333; display: flex;
                align-items: center; justify-content: space-between;
            `;
            
            const modelInfo = document.createElement('div');
            modelInfo.style.cssText = `flex: 1;`;
            
            const modelName = document.createElement('div');
            modelName.style.cssText = `color: #fff; font-size: 10px; font-weight: bold;`;
            modelName.textContent = model.name;
            
            const modelDetails = document.createElement('div');
            modelDetails.style.cssText = `color: #888; font-size: 10px; margin-top: 1px;`;
            modelDetails.textContent = `文件大小: ${(model.file_size / 1024 / 1024 / 1024).toFixed(2)} GB`;
            
            const convertBtn = document.createElement('button');
            convertBtn.style.cssText = `
                padding: 3px 6px; font-size: 10px; border-radius: 2px;
                border: 1px solid; cursor: pointer;
            `;
            
            if (model.is_converted) {
                convertBtn.textContent = '已转换';
                convertBtn.style.cssText += `
                    background: #2a4a2a; color: #9f9; border-color: #4a6a4a;
                    cursor: default;
                `;
                convertBtn.disabled = true;
            } else {
                convertBtn.textContent = '转换';
                convertBtn.style.cssText += `
                    background: #4a2a8a; color: #fff; border-color: #6a4aaa;
                `;
                convertBtn.addEventListener('click', () => {
                    this.convertGGUFModel(model, convertBtn, statusSpan);
                });
            }
            
            modelInfo.appendChild(modelName);
            modelInfo.appendChild(modelDetails);
            modelItem.appendChild(modelInfo);
            modelItem.appendChild(convertBtn);
            container.appendChild(modelItem);
        });
    }

    async convertGGUFModel(model, button, statusSpan) {
        try {
            button.textContent = '转换中...';
            button.disabled = true;
            button.style.background = '#444';
            statusSpan.textContent = `正在转换模型: ${model.name}`;
            statusSpan.style.color = '#ff9';
            
            const response = await fetch('/ollama_converter/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model_name: model.name })
            });
            
            const result = await response.json();
            
            if (result.success) {
                button.textContent = '已转换';
                button.style.background = '#2a4a2a';
                button.style.color = '#9f9';
                button.style.borderColor = '#4a6a4a';
                statusSpan.textContent = `转换成功: ${model.ollama_name}`;
                statusSpan.style.color = '#9f9';
                
                // 刷新Ollama模型列表
                if (this.ollamaModelSelect) {
                    this.refreshOllamaModels();
                }
            } else {
                button.textContent = '转换失败';
                button.disabled = false;
                button.style.background = '#4a2a2a';
                button.style.color = '#f99';
                statusSpan.textContent = `转换失败: ${result.message}`;
                statusSpan.style.color = '#f99';
            }
        } catch (error) {
            console.error('[Model Converter] 转换失败:', error);
            button.textContent = '转换失败';
            button.disabled = false;
            button.style.background = '#4a2a2a';
            button.style.color = '#f99';
            statusSpan.textContent = '转换失败: ' + error.message;
            statusSpan.style.color = '#f99';
        }
    }

    async refreshOllamaModels() {
        try {
            const url = this.ollamaUrlInput?.value || 'http://127.0.0.1:11434';
            const response = await fetch('/ollama_flux_enhancer/get_models', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const models = await response.json();
            
            if (this.ollamaModelSelect && models && models.length > 0) {
                const currentValue = this.ollamaModelSelect.value;
                this.ollamaModelSelect.innerHTML = '';
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    this.ollamaModelSelect.appendChild(option);
                });
                
                // 恢复之前的选择
                if (currentValue && models.includes(currentValue)) {
                    this.ollamaModelSelect.value = currentValue;
                }
            }
        } catch (error) {
            console.error('[Model Converter] 刷新Ollama模型列表失败:', error);
        }
    }

    switchTab(tabId) {
        // 如果正在从API或Ollama更新，不执行切换
        if (this.isUpdatingFromAPI || this.isUpdatingFromOllama) {
            return;
        }
        
        // 保存当前选项卡的数据到对应的tabData中
        this.saveCurrentTabData();
        
        // 更新选项卡按钮样式
        const tabButtons = this.tabBar.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
            if (btn.classList.contains(`tab-${tabId}`)) {
                btn.style.color = '#9C27B0';
                btn.style.borderBottomColor = '#9C27B0';
                btn.style.background = '#2a1a2a';
            } else {
                btn.style.color = '#888';
                btn.style.borderBottomColor = 'transparent';
                btn.style.background = 'none';
            }
        });

        // 显示对应的内容面板
        Object.entries(this.tabContents).forEach(([key, panel]) => {
            const shouldShow = key === tabId;
            panel.style.display = shouldShow ? 'flex' : 'none';
        });

        // 更新当前选项卡信息
        this.currentCategory = tabId;
        
        // 支持新的选项卡ID格式
        if (KSP_NS.constants.OPERATION_CATEGORIES && KSP_NS.constants.OPERATION_CATEGORIES[tabId]) {
            this.currentEditMode = KSP_NS.constants.OPERATION_CATEGORIES[tabId].name.replace(/^\W+\s/, '');
        } else {
            // 新选项卡的默认处理
            const tabNames = {
                'local_editing': '局部编辑',
                'creative_reconstruction': '创意重构', 
                'global_editing': '全局编辑',
                'text_editing': '文字编辑',
                'professional_operations': '专业操作'
            };
            this.currentEditMode = tabNames[tabId] || tabId;
        }
        
        // 使用映射后的tabId获取正确的数据
        const mappedTabId = this.tabIdMap[tabId] || tabId;
        this.currentTabData = this.tabData[mappedTabId] || this.tabData[this.currentCategory] || this.tabData.local || {};
        
        // 更新Kontext下拉框UI
        this.updateKontextDropdownUI(tabId);
        
        // 恢复新选项卡的数据
        this.restoreTabData(tabId);
        
        // 更新操作按钮
        setTimeout(() => {
            this.updateOperationButtons();
        }, 50);
        
        this.updatePromptContainers();
    }
    
    // Kontext菜单系统支持方法
    updateKontextDropdownUI(tabId) {
        if (!window.KontextMenuSystem) return;
        
        // 更新对应选项卡的下拉框选项
        if (tabId === 'local_editing' && this.localDropdownUI) {
            this.localDropdownUI.updateOperationTypes('local_editing');
        } else if (tabId === 'creative_reconstruction' && this.creativeDropdownUI) {
            this.creativeDropdownUI.updateOperationTypes('creative_reconstruction');
        } else if (tabId === 'global_editing' && this.globalDropdownUI) {
            this.globalDropdownUI.updateOperationTypes('global_editing');
        } else if (tabId === 'text_editing' && this.textDropdownUI) {
            this.textDropdownUI.updateOperationTypes('text_editing');
        } else if (tabId === 'professional_operations' && this.professionalDropdownUI) {
            this.professionalDropdownUI.updateOperationTypes('professional_operations');
        }
    }
    
    // 处理操作类型变化
    handleOperationChange(editingType, operationType) {
        
        // 更新内部状态
        this.currentOperationType = operationType;
        this.currentEditingType = editingType;
        
        // 保存到当前选项卡数据
        if (this.currentTabData) {
            this.currentTabData.operationType = operationType;
        }
        
        // 可以触发其他UI更新
        this.updatePromptSuggestions(editingType, operationType);
        
        // 更新约束和修饰提示词
        this.loadConstraintsForCurrentOperation();
    }
    
    // 处理具体操作变化
    handleSpecificOperationChange(editingType, operationType, specificOperation) {
        
        // 更新内部状态
        this.currentSpecificOperation = specificOperation;
        
        // 保存到当前选项卡数据
        if (this.currentTabData) {
            this.currentTabData.specificOperation = specificOperation;
        }
        
        // 获取示例并自动填充
        this.autoFillExample(editingType, operationType, specificOperation);
        
        // 更新约束和修饰提示词
        this.loadConstraintsForCurrentOperation();
    }
    
    // 更新提示建议
    updatePromptSuggestions(editingType, operationType) {
        if (!window.KontextMenuSystem) return;
        
        const tips = window.KontextMenuSystem.getOperationTips(operationType);
        
        // 找到提示显示区域并更新
        const hintElements = document.querySelectorAll('.operation-hint');
        hintElements.forEach(hint => {
            if (hint.style.display !== 'none') {
                // 先移除旧的操作提示，再添加新的
                const existingTips = hint.querySelector('.operation-tips');
                if (existingTips) {
                    existingTips.remove();
                }
                
                const tipsHTML = tips.map(tip => `<li>${tip}</li>`).join('');
                const tipsDiv = document.createElement('div');
                tipsDiv.className = 'operation-tips';
                tipsDiv.innerHTML = `
                    <div style="margin-top: 8px;">
                        <strong>操作提示:</strong>
                        <ul style="
                            margin: 4px 0 0 0; 
                            font-size: 12px;
                            list-style: none;
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 4px 8px;
                            padding: 0;
                        ">
                            ${tipsHTML}
                        </ul>
                    </div>
                `;
                hint.appendChild(tipsDiv);
            }
        });
    }
    
    // 自动填充示例
    autoFillExample(editingType, operationType, specificOperation) {
        if (!window.KontextMenuSystem) return;
        
        const specifics = window.KontextMenuSystem.getSpecificConfig(editingType, operationType);
        const selectedSpecific = specifics.find(s => s.id === specificOperation);
        
        if (selectedSpecific && selectedSpecific.example) {
            // 自动填充到描述框
            const descriptionInputs = document.querySelectorAll('textarea[placeholder*="描述"]');
            descriptionInputs.forEach(textarea => {
                if (textarea.closest('.edit-panel').style.display !== 'none') {
                    // 只在当前为空时自动填充示例
                    if (!textarea.value) {
                        textarea.value = selectedSpecific.example;
                        textarea.dispatchEvent(new Event('input'));
                    }
                }
            });
        }
    }
    
    // 创意提示词库方法
    createCreativePromptsSection() {
        const section = document.createElement('div');
        section.className = 'creative-prompts-section';
        section.style.cssText = `
            margin: 16px;
        `;
        
        // 第一个下拉框：操作类型选择
        const typeLabel = document.createElement('label');
        typeLabel.style.cssText = `
            display: block;
            color: #ccc;
            font-size: 13px;  // 增加2px字体大小
            margin-bottom: 6px;
        `;
        typeLabel.textContent = '🎭 创意操作类型';
        
        const typeSelect = document.createElement('select');
        typeSelect.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: #333;
            border: 1px solid #555;
            border-radius: 4px;
            color: #fff;
            font-size: 13px;  // 增加2px字体大小
            outline: none;
            margin-bottom: 12px;
        `;
        
        // 操作类型选项
        const operationTypes = [
            { value: '', text: '-- 选择操作类型 --' },
            { value: 'scene_building', text: '🏗️ 创意场景构建' },
            { value: 'style_creation', text: '🎨 风格模仿创作' },
            { value: 'character_action', text: '🎭 角色动作设定' },
            { value: 'media_transformation', text: '🖼️ 媒介形式转换' },
            { value: 'environment_reconstruction', text: '🌍 场景环境重构' },
            { value: 'material_transformation', text: '⚗️ 材质形态转换' }
        ];
        
        operationTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.text;
            typeSelect.appendChild(option);
        });
        
        // 第二个下拉框：创意模板选择
        const templateLabel = document.createElement('label');
        templateLabel.style.cssText = `
            display: block;
            color: #ccc;
            font-size: 13px;  // 增加2px字体大小
            margin-bottom: 6px;
        `;
        templateLabel.textContent = '✨ 创意模板';
        
        const templateSelect = document.createElement('select');
        templateSelect.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: #333;
            border: 1px solid #555;
            border-radius: 4px;
            color: #fff;
            font-size: 13px;  // 增加2px字体大小
            outline: none;
        `;
        templateSelect.disabled = true;
        
        // 为不同操作类型设计的创意模板 - 天马行空的想象力创意合集
        const creativeTemplates = {
            scene_building: [
                { value: 'celestial library with floating books spilling starlight into cosmic void', text: '📚 流淌星光的 celestial library 书籍漂浮在宇宙虚空中' },
                { value: 'baroque planetarium with orrery of golden gears orbiting luminescent sun', text: '⚙️ 巴洛克天文台金色齿轮仪轨道环绕发光太阳' },
                { value: 'surreal dreamscape of crystallized islands floating in lavender haze', text: '🔮 超现实梦境结晶岛屿漂浮在薰衣草雾霭中' },
                { value: 'upside-down world with cascading waterfalls reflecting twin moons', text: '🌊 倒悬世界瀑布倾泻映照双月' },
                { value: 'prismatic rainbow bridge materializing from aurora connecting fantasy realms', text: '🌈 极光幻化棱镜彩虹桥连接幻想国度' },
                { value: 'bioluminescent space whale breaching through stardust with trailing constellations', text: '🐋 生物发光宇宙鲸鱼跃出星尘拖曳星座' },
                { value: 'enchanted library with ancient tomes blossoming on ethereal trees', text: '📳 魔法图书馆古籍在空灵树上绽放' },
                { value: 'floating bazaar where merchants trade bottled dreams and memory artifacts', text: '🎪 漂浮集市商人交易瓶装梦境和记忆器物' },
                { value: 'impossible museum housing paradoxical exhibits like perpetual motion machines', text: '🏛️ 不可能博物馆藏永动机等悖论展品' },
                { value: 'iridescent soap metropolis with translucent buildings reflecting rainbow hues', text: '🫧 彩虹肥皂都市半透明建筑折射七彩光芒' },
                { value: 'endless desert of crystalline hourglasses pouring diamond sand in winds', text: '⏳ 无尽水晶沙漠沙漏倾洒钻石沙粒随风' },
                { value: 'luminous waterfall defying gravity flowing into moon crater with stardust', text: '🌙 发光瀑布逆重力流入月球陨石坑星尘' },
                { value: 'living labyrinth with walls breathing shifting colors with emotions', text: '🌺 活体迷宫墙壁呼吸随情绪变幻色彩' },
                { value: 'crystalline cavern with sleeping stories glowing like pulsating fireflies', text: '💎 水晶洞穴沉睡故事如萤火虫脉动发光' },
                { value: 'ancient turtle island carrying mountain temple with cherry blossoms forever', text: '🐢 古老龟岛承载山间神殿樱花永绽' }
            ],
            style_creation: [
                { value: 'impressionist watercolor dreams with dissolved pigments blooming like flowers', text: '🎨 印象派水彩梦境溶解颜料如花绽放' },
                { value: 'neon noir ink wash blending eastern and western aesthetics on handmade paper', text: '🔦 霓虹黑墨水墨融合东西方美学手工纸' },
                { value: 'zero gravity holographic explosion creating iridescent dust motes in darkness', text: '✨ 零重力全息爆炸黑暗中创造虹彩尘埃' },
                { value: 'bioluminescent microorganism painting living canvas breathing with gentle rhythm', text: '🌿 生物发光微生物绘画活体画布轻柔呼吸' },
                { value: 'sacred geometry mandala with infinitely recursive golden ratio patterns', text: '🔮 神圣几何曼陀罗无限递归黄金比例图案' },
                { value: 'avant-garde shadow puppetry with kinetic light sculptures projecting emotions', text: '🎪 先锋皮影戏动态光影雕塑投射情感' },
                { value: 'prismatic chromatic aberration creating ethereal rainbow halo effects', text: '🌈 棱镜色差创造空灵彩虹光晕效果' },
                { value: 'vintage daguerreotype capturing contemporary subjects with haunting beauty', text: '📸 古老银版摄影捕捉现代主题幽美' },
                { value: 'surreal melted crayon sculpture floating in cosmic void with vibrant trails', text: '🖍️ 超现实融化蜡笔雕塑宇宙虚空彩色轨迹' },
                { value: 'aurora borealis reimagined as dancing brushstrokes across night sky canvas', text: '🌅 北极光重绘为夜空画布舞动画笔' },
                { value: 'post-Internet glitch art with corrupted data creating beautiful artifacts', text: '👾 后互联网故障艺术损坏数据创造美' },
                { value: 'synthwave landscape with neon grid mountains reflecting in chrome ocean', text: '🌇 合成波景观霓虹网格山铬合金海洋反射' },
                { value: 'gothic revival stained glass depicting digital age history with jewel tones', text: '🪟 哥特复兴彩绘玻璃描绘数字时代历史' },
                { value: 'biomechanical living tattoo with circulatory light pulses beneath skin', text: '🎭 生物机械活体纹身皮下光脉冲循环' },
                { value: 'celestial constellation map woven with glowing fiber optic nebulae', text: '🌌 天体星座图编织发光光纤星云' }
            ],
            character_action: [
                { value: 'maestro conducting aurora borealis orchestra with baton of pure light', text: '🎭 指挥家挥舞纯光指挥棒指挥北极光交响乐团' },
                { value: 'mystic weaving cosmic tapestry with threads of captured starlight', text: '🌟 神秘主义者编织捕获星光织就宇宙挂毯' },
                { value: 'alchemist harvesting moonbeams in crystalline phials under silver sky', text: '🏺 炼金术士银色天空下水晶瓶采集月光' },
                { value: 'ballerina dancing with mirror reflection creating perfect symmetry', text: '💃 芭蕾舞者与镜中倒影共舞创造完美对称' },
                { value: 'druid planting seeds of instant growth blossoming into magical flora', text: '🌱 德鲁伊种植瞬间生长种子绽放魔法植物' },
                { value: 'calligrapher writing with shadow ink that glows ethereally on parchment', text: '✍️ 书法家使用阴影墨水羊皮纸空灵发光' },
                { value: 'origami master folding paper cranes that transform into living birds', text: '🦯 折纸大师折叠纸鹤化为活鸟飞舞' },
                { value: 'juggler keeping iridescent soap bubbles aloft with impossible grace', text: '🫧 杂技师以不可能优雅保持彩虹肥皂泡漂浮' },
                { value: 'bibliomancer summoning luminous butterflies from ancient grimoire pages', text: '📚 书法魔法师从古代魔法书页召唤发光蝴蝶' },
                { value: 'sculptor breathing life into marble statues with touch of gentle hands', text: '🗿 雕塑家温柔双手赋予大理石雕像生命' },
                { value: 'light painter creating ephemeral art with fingertips leaving glowing trails', text: '✨ 光画家指尖创造短暂艺术留下发光轨迹' },
                { value: 'storm conductor orchestrating lightning bolts with dramatic gestures', text: '⚡ 风暴指挥家戏剧性姿态编排闪电' },
                { value: 'tree whisperer communicating with ancient oaks causing instantaneous bloom', text: '🌳 树语者与古橡树交流促使其瞬间绽放' },
                { value: 'gravity defier walking on ceiling as if strolling through meadow', text: '🚶 反重力者天花板行走如漫步草地' },
                { value: 'snow catcher collecting eternal snowflakes that shimmer like diamonds', text: '❄️ 捕雪者收集永恒雪花如钻石闪耀' }
            ],
            media_transformation: [
                { value: 'symphony of sound waves frozen in crystalline glass sculpture singing silently', text: '🎵 声波交响乐水晶玻璃雕塑无声歌唱' },
                { value: 'artisanal perfume bottle capturing golden hour sunset with swirling colors', text: '🌅 工艺香水瓶捕捉金色时刻日落旋动色彩' },
                { value: 'avant-garde shadow theater with kinetic light sculptures performing ballet', text: '🎪 先锋影子剧院动态光影雕塑表演芭蕾' },
                { value: 'magical musical staff with living notes growing into flowering vines', text: '🎼 魔法五线谱活体音符长成开花藤蔓' },
                { value: 'temporal timepieces displaying precious memories instead of mundane hours', text: '⏰ 时间器物珍贵记忆取代平凡时刻' },
                { value: 'psychomirror reflecting subconscious dreams rather than physical reality', text: '🪞 心灵镜子反射潜意识梦境非物质现实' },
                { value: 'collection of bottled messages sent across alternate future timelines', text: '📮 瓶装信集跨越 alternate future timelines' },
                { value: 'ethereal kite woven from pure imagination soaring through starlit sky', text: '🪁 空灵风筝纯想象力织就星光夜空翱翔' },
                { value: 'vintage camera developing photographs of forgotten memories in sepia tones', text: '📷 复古相机棕褐色调冲洗被遗忘记忆' },
                { value: 'vacuum tube radio receiving ethereal signals from parallel dimensions', text: '📻 真空管收音机接收平行维度空灵信号' },
                { value: 'archaeologist\'s quill pen writing with liquid starlight documenting history', text: '🪶 考古学家羽毛笔液态星光书写历史' },
                { value: 'intricate snow globe containing entire miniature civilization with moving parts', text: '🏙️ 精密雪花球含整个微型文明活动部件' },
                { value: 'haunted theater where ghostly actors perform eternal plays automatically', text: '🎭 闹鬼剧院鬼魂演员自动永恒演出' },
                { value: 'enchanted loom weaving golden fabric from condensed morning sunrise mist', text: '🌫️ 魔法织布机浓缩晨曦金雾编织织物' },
                { value: 'mystical candle casting colored flame shadows that dance independently', text: '🕯️ 神秘蜡烛彩色火焰阴影独立舞蹈' }
            ],
            environment_reconstruction: [
                { value: 'ancient megalopolis built on colossal world turtle carrying mountain temples', text: '🐢 古代巨城建在巨型世界龟背负山间神殿' },
                { value: 'sacred garden where all four seasons coexist in perfect harmony', text: '🌸 神圣花园四季共存完美和谐' },
                { value: 'infinite library with Escher-esque rotating corridors of knowledge', text: '📚 无限图书馆埃舍尔式旋转知识走廊' },
                { value: 'confectionery wonderland with chocolate rivers and candy cane forests', text: '🍫 糖果仙境巧克力河流拐杖糖森林' },
                { value: 'celestial cloud city accessible only via hot air balloon journeys', text: '☁️ 天上云城仅热气球旅行可达' },
                { value: 'bioluminescent underwater cave with self-renewing air bubble ecosystems', text: '🫧 生物发光水下洞穴自新气泡生态系统' },
                { value: 'endless desert of mirrored dunes reflecting celestial constellations', text: '🌌 无尽镜面沙漠沙丘反射天体星座' },
                { value: 'enchanted forest where ancient trees whisper forgotten wisdom', text: '🌳 魔法森林古树低语被遗忘智慧' },
                { value: 'quirky village where gravity reverses direction every midnight', text: '🏘️ 古怪小镇重力每午夜逆转方向' },
                { value: 'temporal valley where time flows in recursive loops', text: '⭕ 时间山谷时间递归循环流动' },
                { value: 'floating archipelago defying physics hovering inverted in azure sky', text: '🏝️ 漂浮群岛违抗物理倒悬蔚蓝天空中' },
                { value: 'rainbow canyon painted by giant brushes with liquid prismatic colors', text: '🎨 彩虹峡谷巨大画笔液态棱镜色彩' },
                { value: 'mystical swamp where lost memories surface as glowing bubbles', text: '🫧 神秘沼泽失落记忆发光气泡浮现' },
                { value: 'wind-swept plateau carrying prophetic whispers from ancient spirits', text: '🌬️ 风扫高原古老精灵携带预言低语' },
                { value: 'mirage oasis where impossible dreams blossom into reality', text: '🌺 海市蜃楼绿洲不可能梦想绽放现实' }
            ],
            material_transformation: [
                { value: 'prismatic rainbow solidified into translucent candy with gem-like clarity', text: '🌈 棱镜彩虹固化半透明糖果宝石般清澈' },
                { value: 'frozen musical notes forming intricate crystalline structures with harmonic resonance', text: '🎵 冻结音符形成复杂晶体结构谐波共振' },
                { value: 'handwoven fabric from pure sunlight threads creating golden textile', text: '☀️ 纯阳光线段手工编织金色织物' },
                { value: 'petrified cosmic stardust containing miniature galaxy formations', text: '✨ 石化宇宙星尘含微型银河系形态' },
                { value: 'sentient liquid shadow moving with autonomous graceful purpose', text: '🌑 有感知液态阴影自主优雅移动' },
                { value: 'tangible imagination condensed into physical sculptural forms', text: '💭 有形想象力凝聚物理雕塑形态' },
                { value: 'iridescent mosaic crafted from butterfly wing scales with prismatic effects', text: '🦋 蝴蝶翅膀鳞片制虹彩马赛克棱镜效果' },
                { value: 'synesthetic color harmony creating visual symphony of light and form', text: '🎨 通感色彩和谐创造光形视觉交响乐' },
                { value: 'ethereal cloud spun into gossamer cotton candy with celestial sweetness', text: '☁️ 空灵云纺成蛛网棉花糖天界甜蜜' },
                { value: 'morning dewdrops encapsulating entire miniature universes within spheres', text: '💧 晨露球体内含整个微型宇宙' },
                { value: 'pure crystallized laughter forming brilliant gemstones with joyful essence', text: '💎 纯结晶笑声形成灿烂宝石喜悦本质' },
                { value: 'tears of transformation metamorphosing into graceful living butterflies', text: '🦋 变化眼泪化优雅活蝴蝶' },
                { value: 'fear transmuted into protective armor through ancient alchemical process', text: '🛡️ 恐惧古老炼金术变保护护甲' },
                { value: 'pure joy compressed into iridescent bubbles that never pop', text: '🫧 纯喜悦压缩虹彩泡泡永不破裂' },
                { value: 'cherished memories engraved into translucent ancient wood with golden veins', text: '🪵 珍贵记忆雕刻半透明古木金色纹理' }
            ]
        };
        
        // 第一个下拉框变化事件
        typeSelect.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            
            // 清空第二个下拉框
            templateSelect.innerHTML = '';
            
            if (selectedType) {
                // 启用第二个下拉框并添加对应模板
                templateSelect.disabled = false;
                
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '-- 选择创意模板 --';
                templateSelect.appendChild(defaultOption);
                
                const templates = creativeTemplates[selectedType] || [];
                templates.forEach(template => {
                    const option = document.createElement('option');
                    option.value = template.value;
                    option.textContent = template.text;
                    templateSelect.appendChild(option);
                });
            } else {
                // 禁用第二个下拉框
                templateSelect.disabled = true;
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '-- 请先选择操作类型 --';
                templateSelect.appendChild(defaultOption);
            }
        });
        
        // 第二个下拉框选择事件
        templateSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                // 找到当前活动的描述框并填入选择的提示词
                const currentPanel = this.tabContents[this.currentCategory];
                if (currentPanel) {
                    const actualTabId = this.tabIdMap[this.currentCategory] || this.currentCategory;
                    const descTextarea = currentPanel.querySelector('textarea[data-tab="' + actualTabId + '"]');
                    if (descTextarea) {
                        // 如果描述框为空，直接填入；如果有内容，追加
                        const currentValue = descTextarea.value.trim();
                        if (currentValue) {
                            descTextarea.value = currentValue + ', ' + e.target.value;
                        } else {
                            descTextarea.value = e.target.value;
                        }
                        
                        // 触发数据更新
                        this.currentTabData.description = descTextarea.value;
                        this.generateSuperPrompt();
                        
                        // 重置选择框
                        e.target.value = '';
                        typeSelect.value = '';
                        templateSelect.innerHTML = '';
                        templateSelect.disabled = true;
                        const resetOption = document.createElement('option');
                        resetOption.value = '';
                        resetOption.textContent = '-- 请先选择操作类型 --';
                        templateSelect.appendChild(resetOption);
                    }
                }
            }
        });
        
        section.appendChild(typeLabel);
        section.appendChild(typeSelect);
        section.appendChild(templateLabel);
        section.appendChild(templateSelect);
        
        return section;
    }
    
    saveCurrentTabData() {
        // 保存当前选项卡的数据
        const currentData = this.tabData[this.currentCategory];
        if (!currentData) return;
        
        // 获取当前显示的面板
        const currentPanel = this.tabContents[this.currentCategory];
        if (!currentPanel) return;
        
        // 保存描述输入框的内容
        const actualTabId = this.tabIdMap[this.currentCategory] || this.currentCategory;
        const descTextarea = currentPanel.querySelector('textarea[data-tab="' + actualTabId + '"]');
        if (descTextarea) {
            currentData.description = descTextarea.value;
        }
        
        // 保存预览框的内容
        const previewActualTabId = this.tabIdMap[this.currentCategory] || this.currentCategory;
        const previewTextarea = currentPanel.querySelector('.generate-section textarea[data-tab="' + previewActualTabId + '"]');
        if (previewTextarea) {
            currentData.generatedPrompt = previewTextarea.value;
        }
        
        // 保存操作类型
        if (this.tabData[this.currentCategory].hasOwnProperty('operationType')) {
            currentData.operationType = this.getCurrentOperationType();
        }
        
        // 保存约束和修饰词选择（仅限前四个选项卡）
        if (['local', 'global', 'text', 'professional'].includes(this.currentCategory)) {
            const constraintCheckboxes = currentPanel.querySelectorAll('.constraint-prompts-container input[type="checkbox"]:checked');
            currentData.selectedConstraints = Array.from(constraintCheckboxes).map(cb => cb.nextElementSibling.textContent);
            
            const decorativeCheckboxes = currentPanel.querySelectorAll('.decorative-prompts-container input[type="checkbox"]:checked');
            currentData.selectedDecoratives = Array.from(decorativeCheckboxes).map(cb => cb.nextElementSibling.textContent);
        }
        
        // 保存API特定设置
        if (this.currentCategory === 'api') {
            const apiPanel = currentPanel;
            const providerSelect = apiPanel.querySelector('.api-provider-select');
            const keyInput = apiPanel.querySelector('.api-key-input');
            const modelSelect = apiPanel.querySelector('.api-model-select');
            
            if (providerSelect) currentData.apiProvider = providerSelect.value;
            if (keyInput) currentData.apiKey = keyInput.value;
            if (modelSelect) currentData.apiModel = modelSelect.value;
        }
        
        // 保存Ollama特定设置
        if (this.currentCategory === 'ollama') {
            const ollamaPanel = currentPanel;
            const urlInput = ollamaPanel.querySelector('input[type="text"]');
            const modelSelect = ollamaPanel.querySelector('.ollama-model-select');
            const tempInput = ollamaPanel.querySelector('input[type="range"]');
            
            if (urlInput) currentData.ollamaUrl = urlInput.value;
            if (modelSelect) currentData.ollamaModel = modelSelect.value;
            if (tempInput) currentData.temperature = parseFloat(tempInput.value);
        }
    }
    
    restoreTabData(tabId) {
        // 恢复指定选项卡的数据
        const tabData = this.tabData[tabId];
        if (!tabData) return;
        
        // 获取目标面板
        const targetPanel = this.tabContents[tabId];
        if (!targetPanel) return;
        
        // 延迟恢复，确保DOM已经渲染
        setTimeout(() => {
            // 恢复描述输入框
            const descTextarea = targetPanel.querySelector('textarea[data-tab="' + tabId + '"]');
            if (descTextarea && tabData.description) {
                descTextarea.value = tabData.description;
            }
            
            // 恢复预览框
            const previewTextarea = targetPanel.querySelector('.generate-section textarea[data-tab="' + tabId + '"]');
            if (previewTextarea && tabData.generatedPrompt) {
                previewTextarea.value = tabData.generatedPrompt;
            }
            
            // 恢复约束和修饰词选择（仅限前四个选项卡）
            if (['local', 'global', 'text', 'professional'].includes(tabId)) {
                // 恢复约束词选择
                if (tabData.selectedConstraints && tabData.selectedConstraints.length > 0) {
                    const constraintCheckboxes = targetPanel.querySelectorAll('.constraint-prompts-container input[type="checkbox"]');
                    constraintCheckboxes.forEach(checkbox => {
                        const label = checkbox.nextElementSibling.textContent;
                        checkbox.checked = tabData.selectedConstraints.includes(label);
                    });
                }
                
                // 恢复修饰词选择
                if (tabData.selectedDecoratives && tabData.selectedDecoratives.length > 0) {
                    const decorativeCheckboxes = targetPanel.querySelectorAll('.decorative-prompts-container input[type="checkbox"]');
                    decorativeCheckboxes.forEach(checkbox => {
                        const label = checkbox.nextElementSibling.textContent;
                        checkbox.checked = tabData.selectedDecoratives.includes(label);
                    });
                }
            }
            
            // 恢复API特定设置
            if (tabId === 'api') {
                const apiPanel = targetPanel;
                const providerSelect = apiPanel.querySelector('.api-provider-select');
                const keyInput = apiPanel.querySelector('.api-key-input');
                const modelSelect = apiPanel.querySelector('.api-model-select');
                
                if (providerSelect && tabData.apiProvider) providerSelect.value = tabData.apiProvider;
                if (keyInput && tabData.apiKey) keyInput.value = tabData.apiKey;
                if (modelSelect && tabData.apiModel) modelSelect.value = tabData.apiModel;
            }
            
            // 恢复Ollama特定设置
            if (tabId === 'ollama') {
                const ollamaPanel = targetPanel;
                const urlInput = ollamaPanel.querySelector('input[type="text"]');
                const modelSelect = ollamaPanel.querySelector('.ollama-model-select');
                const tempInput = ollamaPanel.querySelector('input[type="range"]');
                const tempValue = ollamaPanel.querySelector('.temp-value');
                
                if (urlInput && tabData.ollamaUrl) urlInput.value = tabData.ollamaUrl;
                if (modelSelect && tabData.ollamaModel) modelSelect.value = tabData.ollamaModel;
                if (tempInput && tabData.temperature) {
                    tempInput.value = tabData.temperature;
                    if (tempValue) tempValue.textContent = tabData.temperature;
                }
            }
        }, 10);
    }
    
    getCurrentOperationType() {
        // 获取当前操作类型
        const currentPanel = this.tabContents[this.currentCategory];
        if (!currentPanel) return '';
        
        const operationSelect = currentPanel.querySelector('.operation-select');
        return operationSelect ? operationSelect.value : '';
    }
    
    updateCurrentTabPreview() {
        
        // 更新当前选项卡的预览框
        const currentPanel = this.tabContents[this.currentCategory];
        if (!currentPanel) return;
        
        // Use mapped tab ID for compatibility with new Kontext system
        const actualTabId = this.tabIdMap[this.currentCategory] || this.currentCategory;
        
        const previewTextarea = currentPanel.querySelector('.generate-section textarea[data-tab="' + actualTabId + '"]');
        
        if (previewTextarea && this.currentTabData) {
            previewTextarea.value = this.currentTabData.generatedPrompt || '';
        } else {
            console.log('[DEBUG] Preview update failed - previewTextarea:', !!previewTextarea, 'currentTabData:', !!this.currentTabData);
        }
    }
    
    updateCurrentTabDescription() {
        // 更新当前选项卡的描述框
        const currentPanel = this.tabContents[this.currentCategory];
        if (!currentPanel) return;
        
        const actualTabId = this.tabIdMap[this.currentCategory] || this.currentCategory;
        const descTextarea = currentPanel.querySelector('textarea[data-tab="' + actualTabId + '"]');
        if (descTextarea && this.currentTabData) {
            descTextarea.value = this.currentTabData.description || '';
        }
    }

    selectOperationType(operationType) {
        this.currentOperationType = operationType;
        // 同时保存到当前选项卡的数据中
        if (this.currentTabData) {
            this.currentTabData.operationType = operationType;
        }
        this.updateOperationButtons();
        
        // 获取当前选项卡的容器
        const currentPanel = this.tabContents[this.currentCategory];
        if (currentPanel) {
            const constraintContainer = currentPanel.querySelector('.constraint-prompts-container');
            const decorativeContainer = currentPanel.querySelector('.decorative-prompts-container');
            
            // 更新全局引用
            this.constraintContainer = constraintContainer;
            this.decorativeContainer = decorativeContainer;
            
            // 重新加载对应操作类型的提示词选项（不自动选中）
            if (this.constraintContainer && this.decorativeContainer) {
                this.loadDefaultPrompts();
            }
        }
        
        this.notifyNodeUpdate();
    }

    updateOperationButtons() {
        const selects = this.editorContainer.querySelectorAll('.operation-select');
        selects.forEach(select => {
            // 查找当前操作类型是否在这个下拉框中
            const option = select.querySelector(`option[value="${this.currentOperationType}"]`);
            if (option) {
                select.value = this.currentOperationType;
                select.style.borderColor = '#9C27B0';
                select.style.background = '#444';
            } else {
                select.value = '';
                select.style.borderColor = '#555';
                select.style.background = '#333';
            }
        });
        
        // 触发增强约束系统更新
        this.refreshEnhancedConstraints();
    }
    
    // 刷新增强约束系统 - 使用固定约束
    refreshEnhancedConstraints() {
        // Debug: Refreshing constraints
        this.loadConstraintsForCurrentOperation();
    }

    // 根据当前操作类型加载固定约束和修饰词
    loadConstraintsForCurrentOperation() {
        if (!window.KontextMenuSystem || !window.KontextMenuSystem.getConstraintsForOperation) {
            console.warn('[Kontext Super Prompt] KontextMenuSystem not available');
            return;
        }

        // 先更新容器引用，确保指向当前活跃选项卡的容器
        const currentPanel = this.tabContents[this.currentCategory];
        if (currentPanel) {
            const constraintContainer = currentPanel.querySelector('.constraint-prompts-container');
            const decorativeContainer = currentPanel.querySelector('.decorative-prompts-container');
            
            // 更新全局引用
            this.constraintContainer = constraintContainer;
            this.decorativeContainer = decorativeContainer;
        }

        const operationType = this.currentOperationType || 'default';
        const constraintData = window.KontextMenuSystem.getConstraintsForOperation(operationType);
        
        // 更新约束容器
        this.updateConstraintContainer(constraintData.constraints, false);
        
        // 更新修饰容器
        this.updateDecorativeContainer(constraintData.modifiers, false);
        
        // Debug: Loaded constraints and modifiers
    }

    autoAddConstraints() {
        // 直接调用增强约束生成逻辑，与上面的方法保持一致
        let constraints = [];
        let decoratives = [];
        
        try {
            if (window.KontextMenuSystem && window.KontextMenuSystem.generateEnhancedConstraintsWithTranslation) {
                // 分析当前参数
                const operationType = this.mapOperationTypeToConstraintSystem(this.currentOperationType || 'add_operations');
                const description = (this.currentTabData && this.currentTabData.description) || '';
                const editingIntent = this.currentCategory || 'local_editing';
                const processingStyle = this.getProcessingStyleFromCurrentTab();
                
                // 生成增强约束（中文显示 + 英文生成）
                const enhancedConstraints = window.KontextMenuSystem.generateEnhancedConstraintsWithTranslation(
                    operationType, description, editingIntent, processingStyle
                );
                
                // 组合所有约束类型 - 使用中文显示版本
                constraints = [
                    ...enhancedConstraints.display_operation_constraints || [],
                    ...enhancedConstraints.display_cognitive_constraints || [],
                    ...enhancedConstraints.display_context_constraints || []
                ];
                
                // 使用中文语义修饰词作为修饰性提示词
                decoratives = enhancedConstraints.display_semantic_modifiers || [];
                
                console.log(`[Enhanced AutoAdd] Generated ${constraints.length} constraints, ${decoratives.length} modifiers`);
            } else {
                // 备用：使用传统约束系统
                constraints = ['专业质量输出', '无缝集成', '自然外观', '技术精度'];
                decoratives = ['增强质量', '专业完成'];
            }
        } catch (error) {
            console.warn('[Enhanced AutoAdd] Failed, using fallback:', error);
            constraints = ['professional quality output', 'seamless integration'];
            decoratives = ['precise', 'professional'];
        }
        
        this.updateConstraintContainer(constraints, true);
        this.updateDecorativeContainer(decoratives, true);
    }

    autoAddDecoratives() {
        
        let decoratives;
        if (!this.currentOperationType || this.currentOperationType === '') {
            // 如果没有选择操作类型，使用通用修饰提示词
            decoratives = ['增强质量', '改善视觉效果', '专业完成', '艺术卓越'];
        } else {
            decoratives = ['增强质量', '改善视觉效果', '专业完成', '艺术卓越'];
        }
        
        this.updateDecorativeContainer(decoratives);
    }

    loadDefaultPrompts() {
        // 如果正在生成提示词，跳过重新加载以避免清空选择状态
        if (this.isGeneratingPrompt) {
            return;
        }
        
        
        // 使用增强约束系统生成动态约束词（基于1026数据集分析）
        let constraints = [];
        let decoratives = [];
        
        try {
            if (window.KontextMenuSystem && window.KontextMenuSystem.generateEnhancedConstraintsWithTranslation) {
                // 分析当前参数
                const operationType = this.mapOperationTypeToConstraintSystem(this.currentOperationType || 'add_operations');
                const description = this.currentTabData.description || '';
                const editingIntent = this.currentCategory || 'local_editing';
                const processingStyle = this.getProcessingStyleFromCurrentTab();
                
                // 生成增强约束（中文显示 + 英文生成）
                const enhancedConstraints = window.KontextMenuSystem.generateEnhancedConstraintsWithTranslation(
                    operationType, description, editingIntent, processingStyle
                );
                
                // 组合所有约束类型 - 使用中文显示版本
                constraints = [
                    ...enhancedConstraints.display_operation_constraints || [],
                    ...enhancedConstraints.display_cognitive_constraints || [],
                    ...enhancedConstraints.display_context_constraints || []
                ];
                
                // 使用中文语义修饰词作为修饰性提示词
                decoratives = enhancedConstraints.display_semantic_modifiers || [];
                
                // Debug: Generated constraints and modifiers
            } else {
                // 备用：使用传统约束系统
                console.warn('[Enhanced UI] Falling back to traditional constraint system');
                constraints = ['专业质量输出', '无缝集成', '自然外观', '技术精度'];
                decoratives = ['增强质量', '改善视觉效果', '专业完成', '艺术卓越'];
            }
        } catch (error) {
            console.warn('[Enhanced UI] Enhanced constraint generation failed, using fallback:', error);
            // 备用约束
            constraints = ['professional quality output', 'seamless integration', 'natural appearance'];
            decoratives = ['precise', 'professional', 'enhanced'];
        }
        
        this.updateConstraintContainer(constraints, true); // 自动选中增强约束
        this.updateDecorativeContainer(decoratives, true); // 自动选中语义修饰词
        
    }

    updateConstraintContainer(constraints, autoSelect = true) {
        
        // 检查容器是否存在
        if (!this.constraintContainer) {
            console.warn('[Kontext Super Prompt] constraintContainer is null, skipping update');
            return;
        }
        
        // 保存现有的选择状态
        const previousSelections = new Set(this.selectedConstraints || []);
        
        this.constraintContainer.innerHTML = '';
        
        if (!constraints || !Array.isArray(constraints)) {
            console.error('[Kontext Super Prompt] 约束提示词数据无效:', constraints);
            return;
        }
        
        constraints.forEach(constraint => {
            // 处理新的数据结构 {zh: "中文", en: "English"} 或者旧的字符串格式
            const displayText = typeof constraint === 'object' ? constraint.zh : constraint;
            const englishText = typeof constraint === 'object' ? constraint.en : constraint;
            
            const label = document.createElement('label');
            label.style.cssText = `
                display: flex;
                align-items: center;
                padding: 3px 6px;
                background: #2a2a2a;
                border-radius: 3px;
                cursor: pointer;
                border: 1px solid transparent;
                font-size: 13px;  // 增加2px字体大小
                transition: all 0.2s ease;
                user-select: none;
                margin-bottom: 1px;
            `;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = englishText;
            checkbox.style.cssText = `
                margin-right: 4px;
                margin-left: 0;
                transform: scale(0.8);
                accent-color: #4CAF50;
            `;
            
            const text = document.createElement('span');
            text.textContent = displayText;
            text.style.cssText = `
                flex: 1;
                color: #ccc;
                font-size: 13px;  // 增加2px字体大小
                line-height: 1.1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            `;
            
            // 恢复之前的选择状态
            if (previousSelections.has(englishText)) {
                checkbox.checked = true;
                label.style.background = '#1a4966';
                label.style.borderColor = '#4a90e2';
                text.style.color = '#ffffff';
            } else if (autoSelect && this.autoGenerate) {
                checkbox.checked = true;
                label.style.background = '#1a4966';
                label.style.borderColor = '#4a90e2';
                text.style.color = '#ffffff';
            }
            
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    label.style.background = '#1a4966';
                    label.style.borderColor = '#4a90e2';
                    text.style.color = '#ffffff';
                } else {
                    label.style.background = '#2a2a2a';
                    label.style.borderColor = 'transparent';
                    text.style.color = '#ccc';
                }
                this.updateSelectedConstraints();
            });
            
            label.addEventListener('mouseover', () => {
                if (!checkbox.checked) {
                    label.style.background = '#3a3a3a';
                }
            });
            
            label.addEventListener('mouseout', () => {
                if (!checkbox.checked) {
                    label.style.background = '#2a2a2a';
                }
            });

            label.appendChild(checkbox);
            label.appendChild(text);
            this.constraintContainer.appendChild(label);
        });
        
        this.updateSelectedConstraints();
    }

    updateDecorativeContainer(decoratives, autoSelect = true) {
        
        // 检查容器是否存在
        if (!this.decorativeContainer) {
            console.warn('[Kontext Super Prompt] decorativeContainer is null, skipping update');
            return;
        }
        
        // 保存现有的选择状态
        const previousSelections = new Set(this.selectedDecoratives || []);
        
        this.decorativeContainer.innerHTML = '';
        
        if (!decoratives || !Array.isArray(decoratives)) {
            console.error('[Kontext Super Prompt] 修饰提示词数据无效:', decoratives);
            return;
        }
        
        decoratives.forEach(decorative => {
            // 处理新的数据结构 {zh: "中文", en: "English"} 或者旧的字符串格式
            const displayText = typeof decorative === 'object' ? decorative.zh : decorative;
            const englishText = typeof decorative === 'object' ? decorative.en : decorative;
            
            const label = document.createElement('label');
            label.style.cssText = `
                display: flex;
                align-items: center;
                padding: 3px 6px;
                background: #2a2a2a;
                border-radius: 3px;
                cursor: pointer;
                border: 1px solid transparent;
                font-size: 13px;  // 增加2px字体大小
                transition: all 0.2s ease;
                user-select: none;
                margin-bottom: 1px;
            `;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = englishText;
            checkbox.style.cssText = `
                margin-right: 4px;
                margin-left: 0;
                transform: scale(0.8);
                accent-color: #9C27B0;
            `;
            
            const text = document.createElement('span');
            text.textContent = displayText;
            text.style.cssText = `
                flex: 1;
                color: #ccc;
                font-size: 13px;  // 增加2px字体大小
                line-height: 1.1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            `;
            
            // 恢复之前的选择状态
            if (previousSelections.has(englishText)) {
                checkbox.checked = true;
                label.style.background = '#4a1a66';
                label.style.borderColor = '#9C27B0';
                text.style.color = '#ffffff';
            } else if (autoSelect && this.autoGenerate) {
                checkbox.checked = true;
                label.style.background = '#4a1a66';
                label.style.borderColor = '#9C27B0';
                text.style.color = '#ffffff';
            }
            
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    label.style.background = '#4a1a66';
                    label.style.borderColor = '#9C27B0';
                    text.style.color = '#ffffff';
                } else {
                    label.style.background = '#2a2a2a';
                    label.style.borderColor = 'transparent';
                    text.style.color = '#ccc';
                }
                this.updateSelectedDecoratives();
            });
            
            label.addEventListener('mouseover', () => {
                if (!checkbox.checked) {
                    label.style.background = '#3a3a3a';
                }
            });
            
            label.addEventListener('mouseout', () => {
                if (!checkbox.checked) {
                    label.style.background = '#2a2a2a';
                }
            });

            label.appendChild(checkbox);
            label.appendChild(text);
            this.decorativeContainer.appendChild(label);
        });
        
        this.updateSelectedDecoratives();
    }

    updateSelectedConstraints() {
        const checkboxes = this.constraintContainer.querySelectorAll('input[type="checkbox"]:checked');
        this.selectedConstraints = Array.from(checkboxes).map(cb => cb.value);
        // 同时更新到当前选项卡数据中
        if (this.currentTabData) {
            this.currentTabData.selectedConstraints = this.selectedConstraints;
        }
        this.notifyNodeUpdate();
    }

    updateSelectedDecoratives() {
        const checkboxes = this.decorativeContainer.querySelectorAll('input[type="checkbox"]:checked');
        this.selectedDecoratives = Array.from(checkboxes).map(cb => cb.value);
        // 同时更新到当前选项卡数据中
        if (this.currentTabData) {
            this.currentTabData.selectedDecoratives = this.selectedDecoratives;
        }
        this.notifyNodeUpdate();
    }
    
    forceUpdateSelections() {
        // 确保currentTabData存在
        if (!this.currentTabData) {
            const tabId = this.tabIdMap && this.tabIdMap[this.currentCategory] ? this.tabIdMap[this.currentCategory] : this.currentCategory;
            if (!this.tabData[tabId]) {
                this.tabData[tabId] = {
                    operationType: '',
                    description: '',
                    selectedConstraints: [],
                    selectedDecoratives: [],
                    generatedPrompt: ''
                };
            }
            this.currentTabData = this.tabData[tabId];
        }
        
        // 强制更新描述字段 - 从当前活动面板读取
        const panelClassMap = {
            '局部编辑': 'local-edit-panel',
            '全局编辑': 'global-edit-panel', 
            '文字编辑': 'text-edit-panel',
            '专业操作': 'professional-edit-panel'
        };
        const panelClass = panelClassMap[this.currentEditMode];
        const currentPanel = document.querySelector(`.${panelClass}`);
        
        if (currentPanel) {
            const descriptionTextarea = currentPanel.querySelector('textarea[placeholder*="描述"]');
            if (descriptionTextarea) {
                const currentDescription = descriptionTextarea.value;
                this.description = currentDescription;
            } else {
                console.warn("[Kontext Super Prompt] 未找到描述输入框");
            }
            
            // 强制更新操作类型 - 从当前活动面板读取下拉框选中的操作类型
            const operationSelect = currentPanel.querySelector('.operation-select');
            if (operationSelect && operationSelect.value) {
                const currentOperationType = operationSelect.value;
                this.currentOperationType = currentOperationType;
            } else {
            }
        } else {
            console.warn(`[Kontext Super Prompt] 未找到当前面板: ${panelClass}`);
        }
        
        // 强制更新约束提示词选择
        if (this.constraintContainer) {
            const constraintCheckboxes = this.constraintContainer.querySelectorAll('input[type="checkbox"]:checked');
            const newConstraints = Array.from(constraintCheckboxes).map(cb => cb.nextElementSibling.textContent);
            this.selectedConstraints = newConstraints;
            // 同时更新到当前选项卡数据中
            if (this.currentTabData) {
                this.currentTabData.selectedConstraints = newConstraints;
            }
        } else {
            console.warn("[Kontext Super Prompt] 约束容器不存在");
        }
        
        // 强制更新修饰提示词选择  
        if (this.decorativeContainer) {
            const decorativeCheckboxes = this.decorativeContainer.querySelectorAll('input[type="checkbox"]:checked');
            const newDecoratives = Array.from(decorativeCheckboxes).map(cb => cb.nextElementSibling.textContent);
            this.selectedDecoratives = newDecoratives;
            // 同时更新到当前选项卡数据中
            if (this.currentTabData) {
                this.currentTabData.selectedDecoratives = newDecoratives;
            }
        } else {
            console.warn("[Kontext Super Prompt] 修饰容器不存在");
        }
    }

    updatePromptContainers() {
        // 获取当前选项卡的容器
        const currentPanel = this.tabContents[this.currentCategory];
        if (!currentPanel) return;
        
        // 查找当前选项卡的约束和修饰容器
        const constraintContainer = currentPanel.querySelector('.constraint-prompts-container');
        const decorativeContainer = currentPanel.querySelector('.decorative-prompts-container');
        
        // 清空约束和修饰词容器
        if (constraintContainer) {
            constraintContainer.innerHTML = '';
        }
        if (decorativeContainer) {
            decorativeContainer.innerHTML = '';
        }
        
        // 更新全局引用为当前选项卡的容器
        this.constraintContainer = constraintContainer;
        this.decorativeContainer = decorativeContainer;
        
        // 重新加载当前操作类型的提示词
        if (['local', 'global', 'text', 'professional'].includes(this.currentCategory)) {
            this.loadDefaultPrompts();
        }
    }

    setupEventListeners() {
        // 自动生成开关（已移除，保留代码以防错误）
        if (this.autoGenCheckbox) {
            this.autoGenCheckbox.addEventListener('change', (e) => {
                this.autoGenerate = e.target.checked;
                this.notifyNodeUpdate();
            });
        }

        // 描述输入事件监听已移到createDescriptionSection中，确保每个面板的输入框都有监听
        
        // 结束性能监控
        KSP_NS.performance.endTimer(`node_${this.node.id}_init`);
    }
    
    restoreDataFromWidgets() {
        // 从已序列化的widget中恢复数据
        if (!this.node.widgets || this.node.widgets.length === 0) {
            return;
        }
        
        // 恢复每个选项卡的数据
        const tabs = ['local', 'global', 'text', 'professional', 'api', 'ollama'];
        let restoredCount = 0;
        
        tabs.forEach(tab => {
            // 恢复描述和生成的提示词
            const descWidget = this.node.widgets.find(w => w.name === `${tab}_description`);
            const genWidget = this.node.widgets.find(w => w.name === `${tab}_generated_prompt`);
            
            if (descWidget && descWidget.value) {
                this.tabData[tab].description = descWidget.value;
                restoredCount++;
            }
            
            if (genWidget && genWidget.value) {
                this.tabData[tab].generatedPrompt = genWidget.value;
                restoredCount++;
            }
            
            // 恢复操作类型（前四个选项卡）
            if (['local', 'global', 'text', 'professional'].includes(tab)) {
                const opTypeWidget = this.node.widgets.find(w => w.name === `${tab}_operation_type`);
                const constrWidget = this.node.widgets.find(w => w.name === `${tab}_selected_constraints`);
                const decorWidget = this.node.widgets.find(w => w.name === `${tab}_selected_decoratives`);
                
                if (opTypeWidget && opTypeWidget.value) {
                    this.tabData[tab].operationType = opTypeWidget.value;
                    restoredCount++;
                }
                
                if (constrWidget && constrWidget.value) {
                    try {
                        this.tabData[tab].selectedConstraints = constrWidget.value.split('\n').filter(s => s.trim());
                        restoredCount++;
                    } catch (e) {
                        console.warn(`[Kontext Super Prompt] 恢复${tab}约束提示词失败:`, e);
                    }
                }
                
                if (decorWidget && decorWidget.value) {
                    try {
                        this.tabData[tab].selectedDecoratives = decorWidget.value.split('\n').filter(s => s.trim());
                        restoredCount++;
                    } catch (e) {
                        console.warn(`[Kontext Super Prompt] 恢复${tab}修饰提示词失败:`, e);
                    }
                }
            }
            
            // 恢复API选项卡的特殊字段
            if (tab === 'api') {
                const providerWidget = this.node.widgets.find(w => w.name === 'api_provider');
                const keyWidget = this.node.widgets.find(w => w.name === 'api_key');
                const modelWidget = this.node.widgets.find(w => w.name === 'api_model');
                
                if (providerWidget && providerWidget.value) {
                    this.tabData.api.apiProvider = providerWidget.value;
                    restoredCount++;
                }
                
                if (keyWidget && keyWidget.value) {
                    this.tabData.api.apiKey = keyWidget.value;
                    restoredCount++;
                }
                
                if (modelWidget && modelWidget.value) {
                    this.tabData.api.apiModel = modelWidget.value;
                    restoredCount++;
                }
                
                const intentWidget = this.node.widgets.find(w => w.name === 'api_intent');
                const styleWidget = this.node.widgets.find(w => w.name === 'api_style');
                
                if (intentWidget && intentWidget.value) {
                    this.tabData.api.apiIntent = intentWidget.value;
                    restoredCount++;
                }
                
                if (styleWidget && styleWidget.value) {
                    this.tabData.api.apiStyle = styleWidget.value;
                    restoredCount++;
                }
            }
            
            // 恢复Ollama选项卡的特殊字段
            if (tab === 'ollama') {
                const urlWidget = this.node.widgets.find(w => w.name === 'ollama_url');
                const modelWidget = this.node.widgets.find(w => w.name === 'ollama_model');
                
                if (urlWidget && urlWidget.value) {
                    this.tabData.ollama.ollamaUrl = urlWidget.value;
                    restoredCount++;
                }
                
                if (modelWidget && modelWidget.value) {
                    this.tabData.ollama.ollamaModel = modelWidget.value;
                    restoredCount++;
                }
            }
        });
        
        // 恢复系统字段
        const editModeWidget = this.node.widgets.find(w => w.name === 'edit_mode');
        const opTypeWidget = this.node.widgets.find(w => w.name === 'operation_type');
        
        if (editModeWidget && editModeWidget.value) {
            this.currentEditMode = editModeWidget.value;
        }
        
        if (opTypeWidget && opTypeWidget.value) {
            this.currentOperationType = opTypeWidget.value;
        }
        
        // 兼容旧版本：如果没有新字段，从旧字段恢复
        const oldDescWidget = this.node.widgets.find(w => w.name === 'description');
        const oldGenWidget = this.node.widgets.find(w => w.name === 'generated_prompt');
        
        if (oldDescWidget && oldDescWidget.value && !this.tabData.local.description) {
            // 如果旧字段有值但新字段没有，恢复到当前选项卡
            this.tabData[this.currentCategory].description = oldDescWidget.value;
            restoredCount++;
        }
        
        if (oldGenWidget && oldGenWidget.value && !this.tabData.local.generatedPrompt) {
            this.tabData[this.currentCategory].generatedPrompt = oldGenWidget.value;
            restoredCount++;
        }
        
        // 恢复到UI中
        this.restoreDataToUI();
    }
    
    restoreDataToUI() {
        // 将恢复的数据同步到UI组件中
        
        // 更新当前选项卡的数据访问器
        this.currentTabData = this.tabData[this.currentCategory];
        
        // 检查数据是否存在
        if (!this.currentTabData) {
            console.warn('[Kontext Super Prompt] currentTabData is null, skipping UI restore');
            return;
        }
        
        // 恢复当前选项卡的输入框内容
        const currentPanel = this.tabContents[this.currentCategory];
        if (!currentPanel) return;
        
        // 恢复描述输入框
        const actualTabId = this.tabIdMap[this.currentCategory] || this.currentCategory;
        const descTextarea = currentPanel.querySelector('textarea[data-tab="' + actualTabId + '"]');
        if (descTextarea && this.currentTabData.description) {
            descTextarea.value = this.currentTabData.description;
        }
        
        // 恢复预览框
        const previewActualTabId = this.tabIdMap[this.currentCategory] || this.currentCategory;
        const previewTextarea = currentPanel.querySelector('.generate-section textarea[data-tab="' + previewActualTabId + '"]');
        if (previewTextarea && this.currentTabData.generatedPrompt) {
            previewTextarea.value = this.currentTabData.generatedPrompt;
        }
        
        // 恢复操作类型选择
        if (this.currentTabData && this.currentTabData.operationType) {
            const operationSelect = currentPanel.querySelector('.operation-select');
            if (operationSelect) {
                operationSelect.value = this.currentTabData.operationType;
                this.currentOperationType = this.currentTabData.operationType;
            }
        }
        
        // 恢复约束和修饰提示词选择
        if (['local', 'global', 'text', 'professional'].includes(this.currentCategory)) {
            this.updatePromptContainers();
            
            // 重新显示选中的约束提示词
            if (this.currentTabData.selectedConstraints && this.currentTabData.selectedConstraints.length > 0) {
                this.loadDefaultPrompts(); // 先加载默认提示词
                // 然后标记已选择的
                setTimeout(() => {
                    this.currentTabData.selectedConstraints.forEach(prompt => {
                        const button = this.constraintContainer?.querySelector(`button[data-prompt="${prompt}"]`);
                        if (button) {
                            button.classList.add('selected');
                        }
                    });
                }, 50);
            }
            
            // 重新显示选中的修饰提示词
            if (this.currentTabData.selectedDecoratives && this.currentTabData.selectedDecoratives.length > 0) {
                setTimeout(() => {
                    this.currentTabData.selectedDecoratives.forEach(prompt => {
                        const button = this.decorativeContainer?.querySelector(`button[data-prompt="${prompt}"]`);
                        if (button) {
                            button.classList.add('selected');
                        }
                    });
                }, 50);
            }
        }
        
        // 恢复API选项卡的特殊UI
        if (this.currentCategory === 'api') {
            this.restoreAPIConfiguration();
        }
        
        // 恢复Ollama选项卡的特殊UI
        if (this.currentCategory === 'ollama') {
            // 恢复Ollama URL
            if (this.currentTabData.ollamaUrl && this.ollamaUrlInput) {
                this.ollamaUrlInput.value = this.currentTabData.ollamaUrl;
            }
            
            // 恢复Ollama模型选择
            if (this.currentTabData.ollamaModel && this.ollamaModelSelect) {
                this.ollamaModelSelect.value = this.currentTabData.ollamaModel;
            }
        }
    }

    updateLayerInfo(layerInfo) {
        
        // 递归防护：防止updateLayerInfo和tryGetLayerInfoFromConnectedNode之间的无限递归
        if (this._updateLayerInfoInProgress) {
            return;
        }
        
        if (!layerInfo) {
            console.warn("[Kontext Super Prompt] layerInfo为空，显示默认界面");
            // 显示空图层界面
            layerInfo = { layers: [], canvas_size: { width: 512, height: 512 } };
        }
        
        // 检查是否与上次更新的数据相同，避免不必要的UI更新
        const layerInfoString = JSON.stringify(layerInfo);
        if (this._lastLayerInfoString === layerInfoString) {
            // Debug: 图层信息未变化，跳过更新
            return;
        }
        this._lastLayerInfoString = layerInfoString;
        
        this.layerInfo = layerInfo;
        //     layers: layerInfo.layers?.length || 0,
        //     canvasSize: layerInfo.canvas_size,
        //     transformData: layerInfo.transform_data ? Object.keys(layerInfo.transform_data).length : 0
        // });
        
        // 使用防抖动批量渲染
        this.scheduleRender();
    }

    scheduleRender() {
        // 直接同步渲染，确保画布立即显示
        try {
            this.renderLayerList();
            this.updateLayerCountDisplay();
        } catch (error) {
            console.error('[Kontext Super Prompt] 渲染失败:', error);
        }
    }

    batchRender() {
        // 简化为直接调用渲染
        this.scheduleRender();
    }

    async tryGetLayerInfoFromConnectedNode() {
        
        if (!this.node.inputs || !this.node.inputs[0] || !this.node.inputs[0].link) {
            return;
        }

        const link = app.graph.links[this.node.inputs[0].link];
        if (!link) return;

        const sourceNode = app.graph.getNodeById(link.origin_id);
        if (!sourceNode) return;


        // 直接从LRPG Canvas节点获取实时图层数据
        if (sourceNode.type === "LRPGCanvas") {
            
            let layerInfo = null;
            
            // 方式1: 从LRPG Canvas节点的canvasInstance属性获取
            if (sourceNode.canvasInstance && sourceNode.canvasInstance.canvas) {
                const fabricCanvas = sourceNode.canvasInstance.canvas;
                
                // 直接从Fabric.js画布提取图层数据
                layerInfo = this.extractLayerInfoFromFabricCanvas(fabricCanvas);
                if (layerInfo && layerInfo.layers && layerInfo.layers.length > 0) {
                    // Debug: 从 Fabric.js 获取到图层信息
                }
            }
            
            // 方式1备用: 从DOM元素获取LRPG Canvas实例
            if (!layerInfo && sourceNode.canvasElement) {
                const canvasElement = sourceNode.canvasElement.querySelector('canvas');
                if (canvasElement && canvasElement.__fabric) {
                    const fabricCanvas = canvasElement.__fabric;
                    
                    // 直接从Fabric.js画布提取图层数据
                    layerInfo = this.extractLayerInfoFromFabricCanvas(fabricCanvas);
                }
            }
            
            // 方式2: 尝试从节点的自定义属性获取
            if (!layerInfo && sourceNode.canvasInstance) {
                if (sourceNode.canvasInstance.extractTransformData) {
                    const transformData = sourceNode.canvasInstance.extractTransformData();
                    layerInfo = this.buildLayerInfoFromTransformData(transformData, sourceNode);
                }
            }
            
            // 方式3: 从后端缓存获取最新的图层数据
            if (!layerInfo) {
                try {
                    // 从后端 API 获取缓存的 transform_data
                    const response = await fetch('/get_canvas_transform_data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ node_id: sourceNode.id.toString() })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.transform_data && Object.keys(data.transform_data).length > 0) {
                            layerInfo = this.buildLayerInfoFromTransformData(data.transform_data, sourceNode);
                            // Debug: 从后端缓存获取到图层数据
                        }
                    }
                } catch (e) {
                    console.warn('[Kontext Super Prompt] 获取后端缓存数据失败:', e);
                }
            }
            
            // 方式4: 从localStorage获取（前端持久化）
            if (!layerInfo) {
                try {
                    const storageKey = `kontext_canvas_state_${sourceNode.id}`;
                    const savedState = localStorage.getItem(storageKey);
                    if (savedState) {
                        const state = JSON.parse(savedState);
                        if (state && state.canvasData) {
                            // 从保存的画布数据构建图层信息
                            layerInfo = this.extractLayerInfoFromCanvasData(state.canvasData);
                        }
                    }
                } catch (err) {
                    // 忽略localStorage错误
                }
            }
            
            // 如果还没有获取到，使用测试数据
            if (!layerInfo || !layerInfo.layers || layerInfo.layers.length === 0) {
                layerInfo = {
                    layers: [
                        {
                            id: "test_layer_1",
                            name: "测试图层 1 (等待真实数据)",
                            visible: true,
                            locked: false,
                            z_index: 0,
                            transform: {
                                name: "测试图层 1",
                                visible: true,
                                locked: false
                            }
                        }
                    ],
                    canvas_size: { width: 500, height: 500 },
                    transform_data: {
                        background: { width: 500, height: 500 }
                    }
                };
            }
            
            if (layerInfo) {
                // 检查递归防护：只有在非递归状态下才调用updateLayerInfo
                if (!this._updateLayerInfoInProgress) {
                    this.updateLayerInfo(layerInfo);
                }
            }
            
            this.setupLRPGCanvasListener(sourceNode);
        }
    }

    extractLayerInfoFromCanvasInstance(canvasInstance) {
        // 从 Canvas 实例直接提取图层信息
        if (!canvasInstance) {
            return null;
        }
        
        // 优先尝试从 Fabric.js 画布获取
        if (canvasInstance.canvas) {
            return this.extractLayerInfoFromFabricCanvas(canvasInstance.canvas);
        }
        
        // 其次尝试从 extractTransformData 方法获取
        if (canvasInstance.extractTransformData && typeof canvasInstance.extractTransformData === 'function') {
            const transformData = canvasInstance.extractTransformData();
            return this.buildLayerInfoFromTransformData(transformData);
        }
        
        return null;
    }
    
    extractLayerInfoFromFabricCanvas(fabricCanvas) {
        // 防御性检查：确保是有效的Fabric.js实例且与其他插件兼容
        if (!fabricCanvas) {
            console.warn('[Kontext Super Prompt] Fabric.js canvas实例为空');
            return null;
        }
        
        // 检查Fabric.js对象的完整性，防止版本冲突
        if (!fabricCanvas.getObjects || typeof fabricCanvas.getObjects !== 'function') {
            console.warn('[Kontext Super Prompt] 无效的Fabric.js实例或版本不兼容');
            return null;
        }
        
        let objects;
        try {
            objects = fabricCanvas.getObjects();
        } catch (error) {
            console.warn('[Kontext Super Prompt] 获取Fabric.js对象失败:', error);
            return null;
        }
        
        if (!Array.isArray(objects)) {
            console.warn('[Kontext Super Prompt] Fabric.js返回的对象不是数组');
            return null;
        }
        
        const layers = [];
        
        objects.forEach((obj, index) => {
            const centerPoint = obj.getCenterPoint ? obj.getCenterPoint() : { x: obj.left, y: obj.top };
            
            // 生成图层类型的中文名称
            const getLayerTypeName = (type) => {
                const typeMap = {
                    'rect': '矩形',
                    'circle': '圆形',
                    'ellipse': '椭圆',
                    'triangle': '三角形',
                    'polygon': '多边形',
                    'line': '直线',
                    'path': '路径',
                    'image': '图片',
                    'i-text': '文字',
                    'text': '文本',
                    'textbox': '文本框',
                    'group': '组合'
                };
                return typeMap[type] || '图层';
            };
            
            // 生成缩略图
            const generateThumbnail = (obj) => {
                try {
                    // 创建临时画布用于生成缩略图
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = 64;
                    tempCanvas.height = 64;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // 设置背景
                    tempCtx.fillStyle = '#f3f4f6';
                    tempCtx.fillRect(0, 0, 64, 64);
                    
                    // 保存当前状态
                    tempCtx.save();
                    
                    // 计算缩放比例
                    const objWidth = (obj.width * (obj.scaleX || 1)) || 100;
                    const objHeight = (obj.height * (obj.scaleY || 1)) || 100;
                    const scale = Math.min(48 / objWidth, 48 / objHeight, 1);
                    
                    // 移动到中心并缩放
                    tempCtx.translate(32, 32);
                    tempCtx.scale(scale, scale);
                    tempCtx.translate(-objWidth/2, -objHeight/2);
                    
                    if (obj.type === 'image' && obj._element) {
                        // 绘制图片缩略图
                        tempCtx.drawImage(obj._element, 0, 0, objWidth, objHeight);
                    } else if (obj.type === 'rect') {
                        // 绘制矩形缩略图
                        tempCtx.fillStyle = obj.fill || '#3b82f6';
                        tempCtx.strokeStyle = obj.stroke || '#1e40af';
                        tempCtx.lineWidth = (obj.strokeWidth || 1) * scale;
                        tempCtx.fillRect(0, 0, objWidth, objHeight);
                        if (obj.stroke) tempCtx.strokeRect(0, 0, objWidth, objHeight);
                    } else if (obj.type === 'circle') {
                        // 绘制圆形缩略图
                        const radius = objWidth / 2;
                        tempCtx.beginPath();
                        tempCtx.arc(radius, radius, radius, 0, 2 * Math.PI);
                        tempCtx.fillStyle = obj.fill || '#10b981';
                        tempCtx.fill();
                        if (obj.stroke) {
                            tempCtx.strokeStyle = obj.stroke || '#047857';
                            tempCtx.lineWidth = (obj.strokeWidth || 1) * scale;
                            tempCtx.stroke();
                        }
                    } else if (obj.type === 'i-text' || obj.type === 'text') {
                        // 绘制文字缩略图
                        tempCtx.fillStyle = obj.fill || '#374151';
                        tempCtx.font = `${Math.min(objHeight * 0.8, 20)}px Arial`;
                        tempCtx.textAlign = 'center';
                        tempCtx.textBaseline = 'middle';
                        const text = obj.text || 'Text';
                        tempCtx.fillText(text.length > 8 ? text.substring(0, 8) + '...' : text, objWidth/2, objHeight/2);
                    } else {
                        // 默认图层样式
                        tempCtx.fillStyle = '#e5e7eb';
                        tempCtx.strokeStyle = '#9ca3af';
                        tempCtx.lineWidth = 2;
                        tempCtx.fillRect(0, 0, objWidth, objHeight);
                        tempCtx.strokeRect(0, 0, objWidth, objHeight);
                        
                        // 添加图层图标
                        tempCtx.fillStyle = '#6b7280';
                        tempCtx.font = '16px Arial';
                        tempCtx.textAlign = 'center';
                        tempCtx.textBaseline = 'middle';
                        tempCtx.fillText('📄', objWidth/2, objHeight/2);
                    }
                    
                    tempCtx.restore();
                    return tempCanvas.toDataURL('image/png');
                } catch (error) {
                    console.warn('[Kontext Super Prompt] 生成缩略图失败:', error);
                    // 返回默认缩略图
                    const canvas = document.createElement('canvas');
                    canvas.width = 64;
                    canvas.height = 64;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#f3f4f6';
                    ctx.fillRect(0, 0, 64, 64);
                    ctx.fillStyle = '#9ca3af';
                    ctx.font = '32px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('?', 32, 32);
                    return canvas.toDataURL('image/png');
                }
            };
            
            const layerTypeName = getLayerTypeName(obj.type);
            const layerName = obj.name || `${layerTypeName} ${index + 1}`;
            const thumbnail = generateThumbnail(obj);
            
            layers.push({
                id: `fabric_obj_${index}`,
                name: layerName,
                type: layerTypeName,
                visible: obj.visible !== false,
                locked: obj.selectable === false,
                z_index: index,
                thumbnail: thumbnail,
                transform: {
                    type: obj.type || 'object',
                    centerX: centerPoint.x,
                    centerY: centerPoint.y,
                    scaleX: obj.scaleX || 1,
                    scaleY: obj.scaleY || 1,
                    angle: obj.angle || 0,
                    width: obj.width || 100,
                    height: obj.height || 100,
                    flipX: obj.flipX || false,
                    flipY: obj.flipY || false,
                    visible: obj.visible !== false,
                    locked: obj.selectable === false,
                    name: layerName,
                    // 额外的样式信息
                    fill: obj.fill,
                    stroke: obj.stroke,
                    strokeWidth: obj.strokeWidth,
                    opacity: obj.opacity || 1
                }
            });
        });
        
        return {
            layers: layers,
            canvas_size: {
                width: fabricCanvas.width || 500,
                height: fabricCanvas.height || 500
            },
            transform_data: {
                background: {
                    width: fabricCanvas.width || 500,
                    height: fabricCanvas.height || 500
                }
            }
        };
    }

    setupLRPGCanvasListener(sourceNode) {
        // 清理旧的定时器防止泄漏
        if (this.layerCheckInterval) {
            clearInterval(this.layerCheckInterval);
        }
        
        // 监听画布变化事件
        const checkForUpdates = () => {
            this.checkForLayerUpdates(sourceNode);
        };
        
        // Debug: 设置监听器
        // Debug: Canvas实例检查
        
        // 使用较低频率的定时器以实现自动同步，但防止频繁刷新
        this.layerCheckInterval = this.addIntervalManaged(() => {
            // Debug: 定时器触发检查
            this.checkForLayerUpdatesThrottled(sourceNode);
        }, 1500); // 每1.5秒检查一次，更快响应变化
        
        // 直接监听Canvas事件以实现实时同步
        if (sourceNode.canvasInstance && sourceNode.canvasInstance.canvas) {
            const fabricCanvas = sourceNode.canvasInstance.canvas;
            // Debug: 成功访问到Fabric Canvas
            
            // 监听对象添加/删除/修改事件
            const updateHandler = (eventType) => {
                // Debug: 检测到Canvas事件
                this.addTimeoutManaged(() => {
                    this.checkForLayerUpdatesThrottled(sourceNode);
                }, 200); // 短延迟以防止频繁触发
            };
            
            // 使用管理方法添加监听器
            this.addEventListenerManaged(fabricCanvas, 'object:added', () => updateHandler('object:added'));
            this.addEventListenerManaged(fabricCanvas, 'object:removed', () => updateHandler('object:removed'));
            this.addEventListenerManaged(fabricCanvas, 'object:modified', () => updateHandler('object:modified'));
            this.addEventListenerManaged(fabricCanvas, 'selection:created', () => updateHandler('selection:created'));
            this.addEventListenerManaged(fabricCanvas, 'selection:cleared', () => updateHandler('selection:cleared'));
        }
    }

    buildLayerInfoFromTransformData(transformData, sourceNode) {
        if (!transformData) return null;

        const layers = [];
        let canvasSize = { width: 512, height: 512 };

        // 提取背景信息
        if (transformData.background) {
            canvasSize = {
                width: transformData.background.width || 512,
                height: transformData.background.height || 512
            };
        }

        // 提取图层信息
        Object.entries(transformData).forEach(([key, data], index) => {
            if (key !== 'background' && data && typeof data === 'object') {
                layers.push({
                    id: key,
                    transform: data,
                    visible: data.visible !== false,
                    locked: data.locked === true,
                    z_index: data.z_index || index,
                    name: data.name || `图层 ${index + 1}`
                });
            }
        });

        const layerInfo = {
            layers: layers,
            canvas_size: canvasSize,
            transform_data: transformData
        };

        return layerInfo;
    }

    checkForLayerUpdatesThrottled(sourceNode) {
        // 节流版本：防止频繁调用导致刷新
        const now = Date.now();
        if (this._lastUpdateCheck && now - this._lastUpdateCheck < 1000) {
            // Debug: 节流中，跳过更新
            return; // 1秒内只允许一次更新
        }
        this._lastUpdateCheck = now;
        
        // Debug: 开始检查图层更新
        this.checkForLayerUpdates(sourceNode);
    }
    
    checkForLayerUpdates(sourceNode) {
        if (!sourceNode || sourceNode.type !== "LRPGCanvas") {
            // Debug: 检查跳过，源节点无效或类型不匹配
            return;
        }

        // Debug: 开始检查图层更新，节点ID

        try {
            let currentTransformData = null;
            let layerInfo = null;

            // 方式1: 直接从LRPG Canvas节点的canvasInstance获取最新数据
            if (sourceNode.canvasInstance && sourceNode.canvasInstance.canvas) {
                // Debug: 使用方式1：直接从canvasInstance获取数据
                const fabricCanvas = sourceNode.canvasInstance.canvas;
                layerInfo = this.extractLayerInfoFromFabricCanvas(fabricCanvas);
                
                if (layerInfo && layerInfo.layers && layerInfo.layers.length > 0) {
                    const currentHash = JSON.stringify(layerInfo.layers);
                    
                    if (this.lastTransformHash !== currentHash) {
                        this.lastTransformHash = currentHash;
                        this.updateLayerInfo(layerInfo);
                        return;
                    }
                }
            }
            
            // 方式1备用: 从DOM元素获取Fabric.js画布
            if (!layerInfo && sourceNode.canvasElement) {
                // Debug: 使用方式1备用：从DOM元素获取
                const canvasElement = sourceNode.canvasElement.querySelector('canvas');
                if (canvasElement && canvasElement.__fabric) {
                    console.log('[Kontext Super Prompt] 从DOM找到Fabric画布');
                    const fabricCanvas = canvasElement.__fabric;
                    layerInfo = this.extractLayerInfoFromFabricCanvas(fabricCanvas);
                    
                    if (layerInfo && layerInfo.layers && layerInfo.layers.length > 0) {
                        const currentHash = JSON.stringify(layerInfo.layers);
                        
                        if (this.lastTransformHash !== currentHash) {
                            this.lastTransformHash = currentHash;
                            this.updateLayerInfo(layerInfo);
                            return;
                        }
                    }
                }
            }

            // 方式2: 从节点属性获取
            if (!layerInfo && sourceNode.canvasInstance && sourceNode.canvasInstance.extractTransformData) {
                // Debug: 使用方式2：从节点属性获取数据
                currentTransformData = sourceNode.canvasInstance.extractTransformData();
                const currentHash = JSON.stringify(currentTransformData);
                
                if (this.lastTransformHash !== currentHash) {
                    this.lastTransformHash = currentHash;
                    
                    layerInfo = this.buildLayerInfoFromTransformData(currentTransformData, sourceNode);
                    if (layerInfo) {
                        this.updateLayerInfo(layerInfo);
                    }
                }
            }
            
            // 如果没有获取到任何层信息，记录调试信息
            if (!layerInfo) {
                console.log('[Kontext Super Prompt] 未获取到图层信息，源节点状态:', {
                    hasCanvasInstance: !!sourceNode.canvasInstance,
                    hasCanvas: !!(sourceNode.canvasInstance && sourceNode.canvasInstance.canvas),
                    hasCanvasElement: !!sourceNode.canvasElement,
                    hasExtractMethod: !!(sourceNode.canvasInstance && sourceNode.canvasInstance.extractTransformData)
                });
            } else {
                console.log('[Kontext Super Prompt] 成功获取图层信息，层数量:', layerInfo.layers ? layerInfo.layers.length : 0);
            }
        } catch (e) {
            console.warn("[Kontext Super Prompt] 检查图层更新时出错:", e);
        }
    }

    renderLayerList() {
        if (!this.layerInfo || !this.layerInfo.layers) {
            this.layerList.innerHTML = `
                <div style="color: #666; text-align: center; padding: 20px; font-size: 10px;">
                    暂无图层信息<br>请连接 🎨 LRPG Canvas 节点
                </div>
            `;
            return;
        }

        // 批量DOM操作优化
        const fragment = document.createDocumentFragment();
        const layers = this.layerInfo.layers;
        
        // 对于大量图层使用分批渲染
        if (layers.length > 50) {
            this.renderLayersInBatches(layers, fragment);
        } else {
            // 小量图层直接渲染
            layers.forEach((layer, index) => {
                const layerItem = this.createLayerItem(layer, index);
                fragment.appendChild(layerItem);
            });
        }
        
        // 一次性更新DOM
        this.layerList.innerHTML = '';
        this.layerList.appendChild(fragment);
    }

    renderLayersInBatches(layers, fragment) {
        const batchSize = 10; // 每批处理10个图层
        let currentIndex = 0;
        
        const renderBatch = () => {
            const endIndex = Math.min(currentIndex + batchSize, layers.length);
            
            for (let i = currentIndex; i < endIndex; i++) {
                const layerItem = this.createLayerItem(layers[i], i);
                fragment.appendChild(layerItem);
            }
            
            currentIndex = endIndex;
            
            // 如果还有更多图层需要渲染，使用requestAnimationFrame继续
            if (currentIndex < layers.length) {
                requestAnimationFrame(renderBatch);
            }
        };
        
        renderBatch();
    }

    createLayerItem(layer, index) {
        const item = document.createElement('div');
        item.className = 'layer-item';
        item.style.cssText = `
            display: flex;
            align-items: center;
            padding: 6px;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 4px;
            margin-bottom: 4px;
            cursor: pointer;
            transition: all 0.2s;
        `;

        // 选择框
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.cssText = `
            margin-right: 8px;
            accent-color: #9C27B0;
        `;

        // 缩略图
        const thumbnail = document.createElement('div');
        thumbnail.style.cssText = `
            width: 32px;
            height: 32px;
            background: #333;
            border: 1px solid #555;
            border-radius: 3px;
            margin-right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #888;
            font-size: 10px;
        `;

        if (layer.thumbnail) {
            const img = document.createElement('img');
            img.src = layer.thumbnail;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 2px;
            `;
            thumbnail.appendChild(img);
        } else {
            // 根据图层类型显示不同的图标
            const typeIcons = {
                '矩形': '⬜',
                '圆形': '⭕',
                '椭圆': '🟢', 
                '三角形': '🔺',
                '直线': '📏',
                '图片': '🖼️',
                '文字': '📝',
                '文本': '📝',
                '文本框': '📄',
                '组合': '📂'
            };
            thumbnail.textContent = typeIcons[layer.type] || '📄';
        }

        // 图层信息
        const info = document.createElement('div');
        info.style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        const name = document.createElement('div');
        name.style.cssText = `
            color: #fff;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        name.textContent = layer.name || `图层 ${index + 1}`;

        const details = document.createElement('div');
        details.style.cssText = `
            color: #888;
            font-size: 10px;
        `;
        const typeText = layer.type ? `${layer.type} | ` : '';
        details.textContent = `${typeText}Z:${layer.z_index || index} | ${layer.visible ? '👁️' : '👁️‍🗨️'} | ${layer.locked ? '🔒' : '🔓'}`;

        info.appendChild(name);
        info.appendChild(details);

        item.appendChild(checkbox);
        item.appendChild(thumbnail);
        item.appendChild(info);

        // 点击事件
        item.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            this.updateSelectedLayers();
            this.updateItemAppearance(item, checkbox.checked);
        });

        checkbox.addEventListener('change', () => {
            this.updateSelectedLayers();
            this.updateItemAppearance(item, checkbox.checked);
        });

        return item;
    }

    updateItemAppearance(item, selected) {
        if (selected) {
            item.style.background = '#3a2a4a';
            item.style.borderColor = '#9C27B0';
        } else {
            item.style.background = '#2a2a2a';
            item.style.borderColor = '#444';
        }
    }

    updateSelectedLayers() {
        const checkboxes = this.layerList.querySelectorAll('input[type="checkbox"]');
        this.selectedLayers = [];
        
        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked && this.layerInfo?.layers[index]) {
                this.selectedLayers.push({
                    index: index,
                    layer: this.layerInfo.layers[index]
                });
            }
        });

        this.updateLayerCountDisplay();
        this.notifyNodeUpdate();
    }

    updateLayerCountDisplay() {
        // 图层计数显示已移除，此函数保留为空以防止错误
        if (this.layerCountDisplay) {
            const total = this.layerInfo?.layers?.length || 0;
            const selected = this.selectedLayers.length;
            this.layerCountDisplay.textContent = `已选择 ${selected}/${total} 图层`;
        }
    }

    toggleSelectAll() {
        const checkboxes = this.layerList.querySelectorAll('input[type="checkbox"]');
        const allSelected = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = !allSelected;
            const item = checkbox.closest('.layer-item');
            this.updateItemAppearance(item, checkbox.checked);
        });
        
        this.updateSelectedLayers();
    }

    // 主动触发Canvas节点刷新图层信息
    forceRefreshFromCanvas() {
        // 查找连接的LRPG Canvas节点
        if (!this.node.inputs || !this.node.inputs[0] || !this.node.inputs[0].link) {
            return;
        }

        const link = app.graph.links[this.node.inputs[0].link];
        if (!link) return;

        const sourceNode = app.graph.getNodeById(link.origin_id);
        if (!sourceNode || sourceNode.type !== "LRPGCanvas") return;

        // 方法1: 触发Canvas节点的刷新方法
        if (sourceNode.canvasInstance && sourceNode.canvasInstance.broadcastLayerUpdate) {
            sourceNode.canvasInstance.broadcastLayerUpdate();
        }
        
        // 方法2: 触发Canvas节点的状态更新
        if (sourceNode.canvasInstance && sourceNode.canvasInstance.markCanvasChanged) {
            sourceNode.canvasInstance.markCanvasChanged();
        }
        
        // 方法3: 直接触发节点事件
        if (sourceNode.onNodeCreated || sourceNode.onExecuted) {
            // 触发节点重新计算
            setTimeout(() => {
                if (sourceNode.onNodeCreated) {
                    sourceNode.onNodeCreated();
                }
            }, 100);
        }
    }

    refreshLayerInfo() {
        
        // 清除缓存的图层信息字符串，强制更新
        this._lastLayerInfoString = null;
        
        // 显示加载状态
        this.layerList.innerHTML = `
            <div style="color: #888; text-align: center; padding: 20px; font-size: 10px; line-height: 1.4;">
                <div style="margin-bottom: 8px;">🔄 正在刷新图层信息...</div>
            </div>
        `;
        
        if (this.layerCheckInterval) {
            clearInterval(this.layerCheckInterval);
            this.layerCheckInterval = null;
        }
        
        // 重新获取数据 - 主动触发Canvas节点刷新
        this.forceRefreshFromCanvas();
        
        // 备用方案：直接调用节点的 updateLayerInfo 方法
        if (this.node && this.node.updateLayerInfo) {
            this.node.updateLayerInfo();
        } else {
            // 备用方案：直接尝试获取
            (async () => {
                await this.tryGetLayerInfoFromConnectedNode();
            })();
        }
        
        // 如果还是没有数据，显示详细提示信息
        setTimeout(() => {
            if (!this.layerInfo || !this.layerInfo.layers || this.layerInfo.layers.length === 0) {
                this.layerList.innerHTML = `
                    <div style="color: #888; text-align: center; padding: 20px; font-size: 10px; line-height: 1.4;">
                        <div style="margin-bottom: 8px;">⚠️ 未检测到图层信息</div>
                        <div style="font-size: 10px; color: #666; margin-bottom: 12px;">
                            请检查以下几点：<br>
                            • 是否已连接 🎨 LRPG Canvas 节点<br>
                            • 画布中是否有图层对象<br>
                            • 尝试点击刷新按钮重新获取
                        </div>
                        <button onclick="event.preventDefault(); event.stopPropagation(); this.closest('.kontext-super-prompt-container').querySelector('.kontext-super-prompt').refreshLayerInfo(); return false;" 
                                style="padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; font-size: 10px; cursor: pointer;">
                            🔄 重新获取
                        </button>
                        <div style="margin-top: 8px; font-size: 10px; color: #555;">
                            调试信息请查看浏览器控制台
                        </div>
                    </div>
                `;
            }
        }, 2000);
    }

    translateToEnglish(chineseText) {
        // 简单的中文到英文翻译映射
        const translations = {
            '给女生带上太阳眼睛': 'add sunglasses to the woman',
            '给女生戴上太阳镜': 'add sunglasses to the woman',
            '添加太阳镜': 'add sunglasses',
            '戴上眼镜': 'wear glasses',
            '换成红色': 'change to red',
            '变成蓝色': 'change to blue',
            '变成黑色': 'change to black',
            '删除背景': 'remove background',
            '模糊背景': 'blur background',
            '增强质量': 'enhance quality',
            '提高清晰度': 'improve clarity',
            '修复图像': 'fix image',
            '添加文字': 'add text',
            '更换背景': 'replace background',
            '调整光线': 'adjust lighting',
            '改变风格': 'change style',
            '移除物体': 'remove object',
            '替换物体': 'replace object',
            '放大': 'enlarge',
            '缩小': 'shrink',
            '旋转': 'rotate',
            '翻转': 'flip',
            '裁剪': 'crop'
        };
        
        // 优先使用增强约束系统的翻译映射表
        if (window.KontextMenuSystem?.CONSTRAINT_TRANSLATIONS?.[chineseText]) {
            return window.KontextMenuSystem.CONSTRAINT_TRANSLATIONS[chineseText];
        }
        
        // 检查局部翻译表
        if (translations[chineseText]) {
            return translations[chineseText];
        }
        
        // 如果已经是英文，直接返回
        if (!/[\u4e00-\u9fa5]/.test(chineseText)) {
            return chineseText;
        }
        
        // 尝试增强约束系统映射表部分匹配
        let result = chineseText;
        if (window.KontextMenuSystem?.CONSTRAINT_TRANSLATIONS) {
            for (const [chinese, english] of Object.entries(window.KontextMenuSystem.CONSTRAINT_TRANSLATIONS)) {
                if (chineseText.includes(chinese)) {
                    result = result.replace(chinese, english);
                }
            }
        }
        
        // 尝试局部翻译表部分匹配
        for (const [chinese, english] of Object.entries(translations)) {
            if (result.includes(chinese)) {
                result = result.replace(chinese, english);
            }
        }
        
        // 如果仍包含中文，返回通用描述
        if (/[\u4e00-\u9fa5]/.test(result)) {
            console.warn('无法完全翻译的中文输入:', chineseText);
            // 根据操作类型返回合适的默认值，支持图层信息
            const layerDescription = this.getSelectedLayerDescription();
            if (this.currentOperationType === 'add_object') {
                return layerDescription ? `add object to the ${layerDescription}` : 'add object to selected area';
            } else if (this.currentOperationType === 'replace_object') {
                return layerDescription ? `replace object in the ${layerDescription}` : 'replace selected object';
            } else if (this.currentOperationType === 'remove_object') {
                return layerDescription ? `remove object from the ${layerDescription}` : 'remove selected object';
            } else if (this.currentOperationType === 'change_color') {
                return layerDescription ? `change color of the ${layerDescription}` : 'change color of selected area';
            } else if (this.currentOperationType === 'change_style') {
                return layerDescription ? `change style of the ${layerDescription}` : 'change style of selected area';
            } else if (this.currentOperationType === 'blur_background') {
                return layerDescription ? `blur background around the ${layerDescription}` : 'blur background in selected area';
            } else {
                return layerDescription ? `edit the ${layerDescription}` : 'edit selected area';
            }
        }
        
        return result;
    }

    getSelectedLayerDescription() {
        // 获取选中图层的描述信息
        try {
            // 直接使用 this.selectedLayers，这是通过 checkbox 管理的选中图层
            if (!this.selectedLayers || this.selectedLayers.length === 0) {
                console.log('[Layer Context] No layers selected');
                return '';
            }

            // 生成图层描述 - 支持多个图层
            const descriptions = [];
            
            console.log('[Layer Context] Processing selected layers:', this.selectedLayers);
            
            this.selectedLayers.forEach(selectedItem => {
                const layer = selectedItem.layer;
                if (!layer) {
                    console.log('[Layer Context] Layer data is missing for item:', selectedItem);
                    return;
                }
                
                // 调试：输出关键图层信息
                console.log('[Layer Context] Layer type:', layer.type, 'fill:', layer.fill, 'stroke:', layer.stroke);
                
                const shape = this.getShapeDescription(layer);
                console.log('[Layer Context] Shape description:', shape, '(from type:', layer.type, ')');
                
                // 优化颜色检测：优先检查 stroke 属性（边框色）- 对于空心形状
                let colorValue = null;
                
                // 添加更多调试信息
                console.log('[Layer Context] Full layer object for color detection:', JSON.stringify(layer, null, 2));
                
                // 1. 优先检查 stroke 属性（边框色）- 对于空心形状
                if (layer.stroke && layer.stroke !== 'transparent' && layer.stroke !== '' && layer.stroke !== null) {
                    colorValue = layer.stroke;
                    console.log('[Layer Context] Color from stroke:', colorValue);
                }
                // 2. 检查 fill 属性（填充色）
                else if (layer.fill && layer.fill !== 'transparent' && layer.fill !== '' && layer.fill !== null) {
                    colorValue = layer.fill;
                    console.log('[Layer Context] Color from fill:', colorValue);
                }
                // 3. 检查 backgroundColor 属性（某些情况下）
                else if (layer.backgroundColor && layer.backgroundColor !== 'transparent') {
                    colorValue = layer.backgroundColor;
                    console.log('[Layer Context] Color from backgroundColor:', colorValue);
                }
                // 4. 检查 transform 中的颜色（对于某些特殊形状）
                else if (layer.transform && layer.transform.stroke) {
                    colorValue = layer.transform.stroke;
                    console.log('[Layer Context] Color from transform.stroke:', colorValue);
                }
                else if (layer.transform && layer.transform.fill) {
                    colorValue = layer.transform.fill;
                    console.log('[Layer Context] Color from transform.fill:', colorValue);
                }
                
                // 5. 如果还是找不到颜色，检查其他可能的属性
                if (!colorValue) {
                    // 检查是否有其他颜色相关的属性
                    if (layer.color) {
                        colorValue = layer.color;
                        console.log('[Layer Context] Color from color property:', colorValue);
                    }
                    // 检查 Fabric.js 特定的属性
                    if (layer._stroke && layer._stroke !== 'transparent') {
                        colorValue = layer._stroke;
                        console.log('[Layer Context] Color from _stroke:', colorValue);
                    }
                    if (layer._fill && layer._fill !== 'transparent') {
                        colorValue = layer._fill;
                        console.log('[Layer Context] Color from _fill:', colorValue);
                    }
                }
                
                const color = this.getColorDescription(colorValue);
                console.log('[Layer Context] Final color description:', color, '(from value:', colorValue, ')');
                
                // 图层名称处理：转换为英文，去除编号
                let name = '';
                if (layer.name && layer.name !== `图层 ${selectedItem.index + 1}`) {
                    name = this.translateLayerNameToEnglish(layer.name);
                    
                    // 去除编号和多余的空格
                    name = name.replace(/\s*\d+\s*$/, '').trim();
                    
                    // 如果名称太短或者是默认名称，使用形状+颜色描述
                    if (name.length < 2 || name.match(/^(图层|layer|object)/i)) {
                        name = '';
                    }
                }
                
                // 调试：输出图层信息
                console.log('[Layer Context] Layer analysis:', {
                    originalName: layer.name,
                    translatedName: name,
                    type: layer.type,
                    shape: shape,
                    color: color,
                    stroke: layer.stroke,
                    fill: layer.fill,
                    rawData: layer
                });
                
                let layerDesc = '';
                if (name && color) {
                    layerDesc = `${color} ${name}`;
                } else if (shape && color) {
                    layerDesc = `${color} ${shape}`;
                } else if (color) {
                    layerDesc = `${color} object`;
                } else if (shape) {
                    layerDesc = `${shape}`;
                } else {
                    layerDesc = 'selected object';
                }
                
                console.log('[Layer Context] Generated description:', layerDesc);
                descriptions.push(layerDesc);
            });
            
            // 组合多个图层描述
            let finalDescription = '';
            if (descriptions.length === 1) {
                finalDescription = descriptions[0];
            } else if (descriptions.length === 2) {
                finalDescription = `${descriptions[0]} and ${descriptions[1]}`;
            } else if (descriptions.length > 2) {
                const lastItem = descriptions.pop();
                finalDescription = `${descriptions.join(', ')}, and ${lastItem}`;
            }
            
            console.log('[Layer Context] Selected layers description:', finalDescription);
            return finalDescription;
        } catch (error) {
            console.warn('获取图层描述失败:', error);
            return '';
        }
    }

    integrateLayerContext(originalPrompt, layerDescription, operationType) {
        // 将图层上下文整合到提示词中
        if (!layerDescription || !originalPrompt) {
            return originalPrompt;
        }

        // 根据操作类型选择合适的介词和描述方式
        const operationContextMap = {
            'add_operations': {
                preposition: 'on',
                template: 'add {prompt} on the {layer}',
                examples: ['add apple on the red rectangle', 'add text on the blue circle']
            },
            'object_removal': {
                preposition: 'from',
                template: 'remove {prompt} from the {layer}',
                examples: ['remove object from the red rectangle', 'remove text from the blue area']
            },
            'object_replacement': {
                preposition: 'in',
                template: 'replace {layer} with {prompt}',
                examples: ['replace red rectangle with blue circle', 'replace selected area with apple']
            },
            'color_modification': {
                preposition: 'on',
                template: 'change {layer} to {prompt}',
                examples: ['change red rectangle to blue', 'change selected area to green']
            },
            'shape_operations': {
                preposition: 'of',
                template: 'modify {layer} to {prompt}',
                examples: ['modify red rectangle to circle', 'resize selected area to smaller']
            }
        };

        const contextInfo = operationContextMap[operationType] || operationContextMap['add_operations'];
        
        try {
            // 智能整合逻辑
            const lowerPrompt = originalPrompt.toLowerCase();
            const lowerLayer = layerDescription.toLowerCase();
            
            // 检查原提示词是否已经包含位置信息
            const hasLocationWords = /\b(on|at|in|from|to|near|beside|above|below|inside|outside)\b/.test(lowerPrompt);
            
            if (hasLocationWords) {
                // 如果已有位置信息，可能需要替换或保持原样
                return originalPrompt;
            }

            // 根据操作类型和内容智能生成上下文化提示词
            let contextualPrompt = '';
            
            if (operationType === 'add_operations' || operationType === 'object_add') {
                // 添加操作：在...上添加...
                if (lowerPrompt.startsWith('add ')) {
                    const objectToAdd = originalPrompt.substring(4); // 去掉 "add "
                    contextualPrompt = `add ${objectToAdd} on the ${layerDescription}`;
                } else {
                    contextualPrompt = `add ${originalPrompt} on the ${layerDescription}`;
                }
            } else if (operationType === 'object_removal' || lowerPrompt.includes('remove')) {
                // 移除操作：从...移除...
                if (lowerPrompt.startsWith('remove ')) {
                    const objectToRemove = originalPrompt.substring(7); // 去掉 "remove "
                    contextualPrompt = `remove ${objectToRemove} from the ${layerDescription}`;
                } else {
                    contextualPrompt = `remove ${originalPrompt} from the ${layerDescription}`;
                }
            } else if (operationType === 'object_replacement' || lowerPrompt.includes('replace')) {
                // 替换操作：将...替换为...
                // 检查originalPrompt是否已经包含replace指令
                if (lowerPrompt.startsWith('replace ')) {
                    // 如果已经包含replace，检查是否包含"selected object"
                    if (lowerPrompt.includes('selected object')) {
                        // 将"selected object"替换为实际的图层描述
                        contextualPrompt = originalPrompt.replace(/selected object/g, layerDescription);
                    } else {
                        // 如果不包含"selected object"，直接使用
                        contextualPrompt = originalPrompt;
                    }
                } else {
                    // 如果不包含replace，添加完整的替换指令
                    contextualPrompt = `replace the ${layerDescription} with ${originalPrompt}`;
                }
            } else if (operationType === 'color_modification' || lowerPrompt.includes('change') || lowerPrompt.includes('color')) {
                // 颜色修改：将...改为...
                contextualPrompt = `change the ${layerDescription} to ${originalPrompt}`;
            } else {
                // 默认：在...处进行...操作
                contextualPrompt = `${originalPrompt} on the ${layerDescription}`;
            }

            console.log(`[Layer Context] Integrated prompt: "${originalPrompt}" + "${layerDescription}" = "${contextualPrompt}"`);
            return contextualPrompt;

        } catch (error) {
            console.warn('整合图层上下文失败:', error);
            return originalPrompt; // 失败时返回原始提示词
        }
    }

    translateLayerNameToEnglish(chineseName) {
        // 将中文图层名称翻译为英文
        if (!chineseName) return '';
        
        // 常用图层名称翻译映射
        const nameTranslations = {
            // 基本形状
            '矩形': 'box',
            '长方形': 'box',
            '正方形': 'box',
            '方形': 'box',
            '方框': 'box',
            '圆形': 'circle', 
            '椭圆': 'circle',
            '椭圆形': 'circle',
            '三角形': 'triangle',
            '多边形': 'polygon',
            '线条': 'line',
            '路径': 'path',
            '文字': 'text',
            '文本': 'text',
            
            // 颜色相关
            '红色': 'red',
            '绿色': 'green',
            '蓝色': 'blue',
            '黄色': 'yellow',
            '橙色': 'orange',
            '紫色': 'purple',
            '黑色': 'black',
            '白色': 'white',
            '灰色': 'gray',
            '粉色': 'pink',
            '棕色': 'brown',
            
            // 其他通用词汇
            '图层': 'layer',
            '对象': 'object',
            '背景': 'background',
            '前景': 'foreground',
            '边框': 'border',
            '填充': 'fill',
            '图片': 'image',
            '图像': 'image'
        };
        
        let translatedName = chineseName;
        
        // 精确匹配翻译
        for (const [chinese, english] of Object.entries(nameTranslations)) {
            // 使用正则表达式进行全词匹配替换
            const regex = new RegExp(chinese, 'g');
            translatedName = translatedName.replace(regex, english);
        }
        
        // 如果仍包含中文字符，尝试基础翻译
        if (/[\u4e00-\u9fa5]/.test(translatedName)) {
            // 对于包含"形"字的，通常是形状
            if (translatedName.includes('形')) {
                translatedName = translatedName.replace(/.*形.*/, 'shape');
            }
            // 对于其他未翻译的中文，使用通用名称
            else {
                translatedName = translatedName.replace(/[\u4e00-\u9fa5]+/g, 'object');
            }
        }
        
        return translatedName.trim();
    }

    getShapeDescription(layer) {
        // 处理传入字符串的情况（向后兼容）
        const shapeType = typeof layer === 'string' ? layer : layer.type;
        
        // 将形状类型转换为描述
        const shapeMap = {
            'rect': 'box',
            'rectangle': 'box',
            '矩形': 'box',
            '方框': 'box',
            'square': 'box',
            'circle': 'circle',
            '圆形': 'circle',
            'ellipse': 'circle',
            '椭圆': 'circle',
            'oval': 'circle',
            'polygon': 'polygon',
            '多边形': 'polygon',
            'line': 'line',
            '线条': 'line',
            'path': 'path',
            '路径': 'path',
            'text': 'text area',
            '文本': 'text area',
            'i-text': 'text area',
            'textbox': 'text area'
        };
        
        const shapeDescription = shapeMap[shapeType] || shapeType || '';
        return shapeDescription;
    }

    getColorDescription(colorValue) {
        // 将颜色值转换为英文描述
        if (!colorValue) return '';
        
                
        // 标准化颜色值
        const normalizedColor = colorValue.toString().toLowerCase();
        
        // 精确匹配常用颜色
        const colorMap = {
            '#ff0000': 'red', '#f00': 'red', 'red': 'red', 'rgb(255,0,0)': 'red',
            '#00ff00': 'green', '#0f0': 'green', 'green': 'green', '#008000': 'green', 'rgb(0,255,0)': 'green',
            '#0000ff': 'blue', '#00f': 'blue', 'blue': 'blue', 'rgb(0,0,255)': 'blue',
            '#ffff00': 'yellow', '#ff0': 'yellow', 'yellow': 'yellow', 'rgb(255,255,0)': 'yellow',
            '#ff8000': 'orange', '#ffa500': 'orange', 'orange': 'orange', 'rgb(255,165,0)': 'orange',
            '#800080': 'purple', '#8000ff': 'purple', 'purple': 'purple', 'rgb(128,0,128)': 'purple',
            '#000000': 'black', '#000': 'black', 'black': 'black', 'rgb(0,0,0)': 'black',
            '#ffffff': 'white', '#fff': 'white', 'white': 'white', 'rgb(255,255,255)': 'white',
            '#808080': 'gray', '#888': 'gray', 'gray': 'gray', 'grey': 'gray', 'rgb(128,128,128)': 'gray',
            '#ffc0cb': 'pink', 'pink': 'pink', 'rgb(255,192,203)': 'pink',
            '#a52a2a': 'brown', 'brown': 'brown', 'rgb(165,42,42)': 'brown',
            '#40e0d0': 'turquoise', 'turquoise': 'turquoise', 'rgb(64,224,208)': 'turquoise',
            '#ff69b4': 'hotpink', 'rgb(255,105,180)': 'hotpink',
            '#90ee90': 'lightgreen', 'rgb(144,238,144)': 'lightgreen',
            '#ffb6c1': 'lightpink', 'rgb(255,182,193)': 'lightpink'
        };

        // 精确匹配
        if (colorMap[normalizedColor]) {
                        return colorMap[normalizedColor];
        }
        
        // 处理RGB格式
        let r, g, b;
        
        // RGB值分析（适用于十六进制颜色）
        if (normalizedColor.startsWith('#')) {
            const hex = normalizedColor.substring(1);
            
            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
            } else if (hex.length === 6) {
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            } else {
                                return '';
            }
        } else if (normalizedColor.startsWith('rgb')) {
            // 处理 rgb(r,g,b) 格式
            const matches = normalizedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (matches) {
                r = parseInt(matches[1]);
                g = parseInt(matches[2]);
                b = parseInt(matches[3]);
            } else {
                console.log('[Color Debug] Invalid RGB format:', normalizedColor);
                return '';
            }
        } else {
            console.log('[Color Debug] Unrecognized color format:', normalizedColor);
            return '';
        }
        
        console.log('[Color Debug] RGB values:', r, g, b);
        
        // 基于RGB值推断主要颜色
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        
        // 灰度判断
        if (max - min < 30) {
            if (max < 80) return 'dark gray';
            else if (max > 200) return 'light gray';
            else return 'gray';
        }
        
        // 主色判断 - 使用更宽松的阈值
        if (r > g && r > b) {
            // 红色为主
            if (r > 200 && g < 100 && b < 100) return 'red';
            else if (r > 200 && g > 150 && b < 100) return 'orange';
            else if (r > 200 && g > 200 && b < 100) return 'yellow';
            else if (r > 150 && g < 100 && b > 100) return 'purple';
            else return 'reddish';
        } else if (g > r && g > b) {
            // 绿色为主
            if (g > 200 && r < 100 && b < 100) return 'green';
            else if (g > 200 && b > 150 && r < 100) return 'cyan';
            else if (g > 200 && r > 150 && b < 100) return 'yellow';
            else return 'greenish';
        } else if (b > r && b > g) {
            // 蓝色为主
            if (b > 200 && r < 100 && g < 100) return 'blue';
            else if (b > 200 && r > 150 && g < 100) return 'purple';
            else if (b > 200 && g > 150 && r < 100) return 'cyan';
            else return 'bluish';
        }
        
        return '';
    }

    getLayerInfo() {
        // 获取图层信息
        try {
            console.log('[调试] getLayerInfo开始执行');
            console.log('[调试] this.node:', this.node);
            
            // 尝试从连接的Canvas节点获取图层信息
            if (this.node && this.node.inputs) {
                console.log('[调试] 节点输入数量:', this.node.inputs.length);
                const layerInput = this.node.inputs.find(input => input.name === 'layer_info');
                console.log('[调试] layer_info输入:', layerInput);
                
                if (layerInput && layerInput.link) {
                    console.log('[调试] 找到layer_info连接:', layerInput.link);
                    
                    // 获取连接的源节点
                    const sourceLink = app.graph.links[layerInput.link];
                    console.log('[调试] 源连接信息:', sourceLink);
                    
                    if (sourceLink) {
                        const sourceNode = app.graph.getNodeById(sourceLink.origin_id);
                        console.log('[调试] 源节点:', sourceNode);
                        
                        if (sourceNode && sourceNode.canvasInstance && sourceNode.canvasInstance.extractTransformData) {
                            // 获取变换数据
                            const transformData = sourceNode.canvasInstance.extractTransformData();
                            
                            // 转换为期望的格式
                            const layerInfo = {
                                layers: [],
                                canvas_size: {
                                    width: transformData.background?.width || 512,
                                    height: transformData.background?.height || 512
                                },
                                transform_data: transformData
                            };
                            
                            // 提取图层信息
                            for (const [layerId, layerData] of Object.entries(transformData)) {
                                if (layerId !== 'background') {
                                    layerInfo.layers.push({
                                        id: layerId,
                                        type: layerData.type || 'image',
                                        selected: layerData.selected || false,
                                        stroke: layerData.stroke,
                                        fill: layerData.fill,
                                        strokeWidth: layerData.strokeWidth,
                                        name: layerData.name,
                                        visible: layerData.visible !== false,
                                        locked: layerData.locked || false,
                                        z_index: layerData.z_index || 0
                                    });
                                }
                            }
                            
                            // 按z_index排序
                            layerInfo.layers.sort((a, b) => (a.z_index || 0) - (b.z_index || 0));
                            
                            return layerInfo;
                        }
                    }
                }
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    getDefaultTargetForOperation(operationType) {
        // 为不同操作类型提供合适的默认目标描述
        const operationDefaults = {
            // 图像编辑操作
            'inpainting': 'natural, seamless blending',
            'outpainting': 'expanded scene with consistent style',
            'img2img': 'enhanced version with improved details',
            
            // 对象操作
            'add_object': 'new object placed naturally',
            'remove_object': 'clean removal with natural background',
            'replace_object': 'replacement object that fits perfectly',
            'modify_object': 'modified object with enhanced details',
            'move_object': 'repositioned object in natural placement',
            
            // 风格和效果
            'style_transfer': 'artistic style applied seamlessly',
            'color_change': 'natural color transition',
            'lighting_adjustment': 'improved lighting and shadows',
            'background_change': 'new background that complements the subject',
            'background_blur': 'professional depth of field effect',
            
            // 人像编辑
            'face_swap': 'face swap seamlessly',
            'portrait_enhancement': 'enhanced facial features with natural look',
            'age_modification': 'age-appropriate changes with realistic details',
            'hair_change': 'new hairstyle that suits the face',
            'makeup_application': 'subtle makeup enhancement',
            
            // 图像质量
            'upscale': 'high-resolution enhancement with sharp details',
            'denoising': 'clean image with preserved details',
            'restoration': 'restored image with improved clarity',
            'super_resolution': 'enhanced resolution with crisp details',
            
            // 构图和变换
            'crop': 'perfectly framed composition',
            'resize': 'proportionally adjusted image',
            'rotation': 'properly oriented image',
            'flip': 'mirrored image with maintained quality',
            
            // 特殊效果
            'artistic_filter': 'creative artistic effect applied tastefully',
            'vintage_effect': 'nostalgic vintage appearance',
            'black_white': 'elegant monochrome conversion',
            'sepia': 'warm sepia tone effect',
            'hdr': 'enhanced dynamic range with balanced exposure'
        };

        return operationDefaults[operationType] || 'enhanced result with professional quality';
    }
    
    // 将前端操作类型映射到增强约束系统的操作类型
    mapOperationTypeToConstraintSystem(operationType) {
        const mapping = {
            // 形态操作映射
            'shape_transformation': 'shape_operations',
            'body_posture': 'shape_operations',
            'hand_gesture': 'shape_operations',
            'facial_expression': 'shape_operations',
            
            // 颜色操作映射
            'color_modification': 'color_modification',
            'single_color': 'color_modification',
            'multi_object': 'color_modification',
            'gradient_color': 'color_modification',
            
            // 对象删除操作映射（关键修复）
            'object_removal': 'remove_operations',
            'body_part': 'remove_operations',
            'background_element': 'remove_operations',  // 背景元素删除
            'decoration': 'remove_operations',
            'seamless_repair': 'remove_operations',
            
            // 对象添加操作映射
            'object_addition': 'add_operations',
            'add_object': 'add_operations',
            'remove_object': 'remove_operations',
            
            // 文字操作映射
            'content_replace': 'text_operations',
            'content_add': 'text_operations',
            'style_modify': 'text_operations',
            'text_editing': 'text_operations',
            
            // 背景操作映射
            'background_replacement': 'background_operations',
            'scene_reconstruction': 'background_operations',
            'environment_reconstruction': 'background_operations',
            
            // 默认映射
            'inpainting': 'add_operations',
            'outpainting': 'background_operations',
            'img2img': 'color_modification'
        };
        
        return mapping[operationType] || 'add_operations';
    }
    
    // 从当前选项卡获取处理风格
    getProcessingStyleFromCurrentTab() {
        const category = this.currentCategory || 'local_editing';
        
        // 基于编辑类别推断处理风格
        const styleMapping = {
            'local_editing': 'technical',
            'global_editing': 'professional', 
            'creative_reconstruction': 'artistic',
            'text_editing': 'professional',
            'professional_operations': 'commercial'
        };
        
        return styleMapping[category] || 'professional';
    }
    
    generateSuperPrompt() {
        console.log('[DEBUG] generateSuperPrompt called, currentCategory:', this.currentCategory);
        console.log('[DEBUG] currentTabData:', this.currentTabData);
        
        // 检查当前选项卡模式 - API和Ollama模式完全独立，不受模板影响
        if (this.currentCategory === 'api') {
            console.log('[DEBUG] Using API mode');
            // API模式：完全独立，不使用任何模板
            this.generateWithAPI();
            return;
        } else if (this.currentCategory === 'ollama') {
            console.log('[DEBUG] Using Ollama mode');
            // Ollama模式：完全独立，不使用任何模板
            this.generateWithOllama();
            return;
        }
        
        // 首先强制更新选择状态，确保与UI一致
        this.forceUpdateSelections();
        
        
        // 设置标志位，防止在生成期间重新加载提示词
        this.isGeneratingPrompt = true;
        
        // 收集当前选项卡的数据，将中文提示词转换为英文
        const constraintPromptsEnglish = translatePromptsToEnglish(this.currentTabData.selectedConstraints || []);
        const decorativePromptsEnglish = translatePromptsToEnglish(this.currentTabData.selectedDecoratives || []);
        
        // 生成综合提示词
        let generatedPromptParts = [];
        
        // 使用新的关键词转换系统
        const description = this.currentTabData.description || '';
        
        // 获取操作类型（优先使用用户手动选择，只有未选择时才自动检测）
        let operationType = this.currentTabData.operationType || this.currentOperationType;
        let specificOperation = this.currentTabData.specificOperation || this.currentSpecificOperation;
        
        // 只有在用户没有手动选择具体操作时才使用自动检测
        if ((!operationType || operationType === 'global_color_grade') && 
            (!specificOperation || specificOperation === 'default') &&
            description && description.trim() && 
            window.KontextMenuSystem && window.KontextMenuSystem.autoDetectOperationType) {
            const detected = window.KontextMenuSystem.autoDetectOperationType(description);
            operationType = detected.operationType;
            specificOperation = detected.specificOperation;
            console.log('[DEBUG] Auto-detected operation:', detected);
        } else {
            console.log('[DEBUG] Using user-selected operation:', operationType, specificOperation);
        }
        
        console.log('[DEBUG] Using keyword conversion - operationType:', operationType, 'specificOperation:', specificOperation, 'description:', description);
        
        // 获取选中图层的描述信息
        const selectedLayerDescription = this.getSelectedLayerDescription();
        console.log('[DEBUG] Selected layer description:', selectedLayerDescription);
        console.log('[DEBUG] Selected layer description type:', typeof selectedLayerDescription);
        console.log('[DEBUG] getSelectedLayerDescription method:', this.getSelectedLayerDescription.toString().substring(0, 100) + '...');
        
        if (description && description.trim() && window.KontextMenuSystem && window.KontextMenuSystem.convertKeywordsToPrompt) {
            // 使用新的关键词转换系统
            const convertedPrompt = window.KontextMenuSystem.convertKeywordsToPrompt(
                operationType, 
                specificOperation, 
                description.trim(),
                this.currentCategory
            );
            console.log('[DEBUG] Converted prompt:', convertedPrompt);
            if (convertedPrompt && convertedPrompt.trim()) {
                // 如果有选中的图层，整合图层上下文
                if (selectedLayerDescription) {
                    const contextualPrompt = this.integrateLayerContext(convertedPrompt, selectedLayerDescription, operationType);
                    generatedPromptParts.push(contextualPrompt);
                } else {
                    // 没有选择图层时，使用简单的模板
                    let simplePrompt = convertedPrompt;
                    
                    // 根据操作类型调整模板
                    if (operationType === 'color_modification') {
                        // 简化颜色修改的提示词
                        simplePrompt = `make ${description.trim()} orange`;
                    } else if (operationType === 'add_operations') {
                        // 简化添加对象的提示词
                        simplePrompt = `add ${description.trim()}`;
                    } else if (operationType === 'object_removal') {
                        // 简化移除对象的提示词
                        simplePrompt = `remove ${description.trim()}`;
                    } else if (operationType === 'object_replacement') {
                        // 简化替换对象的提示词
                        // 检查是否是 "A to B" 或 "A-B" 格式
                        let sourceObj, targetObj;
                        
                        if (description.includes(' to ')) {
                            const parts = description.split(' to ');
                            if (parts.length === 2) {
                                sourceObj = parts[0].trim();
                                targetObj = parts[1].trim();
                            }
                        } else if (description.includes('-')) {
                            const parts = description.split('-');
                            if (parts.length === 2) {
                                sourceObj = parts[0].trim();
                                targetObj = parts[1].trim();
                            }
                        }
                        
                        if (sourceObj && targetObj) {
                            simplePrompt = `replace ${sourceObj} with ${targetObj}`;
                        } else {
                            simplePrompt = `replace with ${description.trim()}`;
                        }
                    } else if (operationType === 'text_operations' || operationType === 'content_replace' || operationType === 'content_add' || operationType === 'style_modify') {
                        // 简化文字操作的提示词 - 直接使用转换后的提示词
                        simplePrompt = convertedPrompt;
                    } else if (operationType === 'scene_building' || operationType === 'style_creation' || operationType === 'character_action' || operationType === 'media_transformation') {
                        // 创意重构操作 - 直接使用转换后的提示词
                        simplePrompt = convertedPrompt;
                    } else if (operationType === 'geometric_warp' || operationType === 'perspective_transform' || operationType === 'blur_sharpen' || 
                              operationType === 'local_deformation' || operationType === 'composition_adjustment' || operationType === 'general_editing' ||
                              operationType === 'ecommerce' || operationType === 'portrait' || operationType === 'architecture' || 
                              operationType === 'product' || operationType === 'automotive' || operationType === 'fashion' ||
                              operationType === 'food' || operationType === 'real_estate' || operationType === 'medical' ||
                              operationType === 'technical_processing' || operationType === 'color_accuracy' || operationType === 'background_clean' ||
                              operationType === 'detail_enhance' || operationType === 'defect_remove' || operationType === 'skin_natural' ||
                              operationType === 'feature_preserve' || operationType === 'background_pro' || operationType === 'lighting_opt') {
                        // 专业操作 - 直接使用描述，不需要 change to 前缀
                        simplePrompt = description.trim();
                    } else {
                        // 其他操作使用通用模板
                        simplePrompt = `change to ${description.trim()}`;
                    }
                    
                    generatedPromptParts.push(simplePrompt);
                }
            }
        } else if (description && description.trim()) {
            // 备用方案：直接翻译描述
            let englishDescription = this.translateToEnglish(description.trim());
            console.log('[DEBUG] Fallback translation:', englishDescription);
            
            // 如果有选中的图层，整合图层上下文
            if (selectedLayerDescription) {
                const contextualPrompt = this.integrateLayerContext(englishDescription, selectedLayerDescription, operationType);
                generatedPromptParts.push(contextualPrompt);
            } else {
                // 没有选择图层时，使用简单的模板
                let simplePrompt = englishDescription;
                
                // 根据操作类型调整模板
                if (operationType === 'color_modification') {
                    simplePrompt = `make ${description.trim()} orange`;
                } else if (operationType === 'add_operations') {
                    simplePrompt = `add ${description.trim()}`;
                } else if (operationType === 'object_removal') {
                    simplePrompt = `remove ${description.trim()}`;
                } else if (operationType === 'object_replacement') {
                    // 简化替换对象的提示词
                    // 检查是否是 "A to B" 或 "A-B" 格式
                    let sourceObj, targetObj;
                    
                    if (description.includes(' to ')) {
                        const parts = description.split(' to ');
                        if (parts.length === 2) {
                            sourceObj = parts[0].trim();
                            targetObj = parts[1].trim();
                        }
                    } else if (description.includes('-')) {
                        const parts = description.split('-');
                        if (parts.length === 2) {
                            sourceObj = parts[0].trim();
                            targetObj = parts[1].trim();
                        }
                    }
                    
                    if (sourceObj && targetObj) {
                        simplePrompt = `replace ${sourceObj} with ${targetObj}`;
                    } else {
                        simplePrompt = `replace with ${description.trim()}`;
                    }
                } else if (operationType === 'text_operations' || operationType === 'content_replace' || operationType === 'content_add' || operationType === 'style_modify') {
                    simplePrompt = englishDescription;
                } else if (operationType === 'scene_building' || operationType === 'style_creation' || operationType === 'character_action' || operationType === 'media_transformation') {
                    simplePrompt = englishDescription;
                } else if (operationType === 'geometric_warp' || operationType === 'perspective_transform' || operationType === 'blur_sharpen' || 
                          operationType === 'local_deformation' || operationType === 'composition_adjustment' || operationType === 'general_editing' ||
                          operationType === 'ecommerce' || operationType === 'portrait' || operationType === 'architecture' || 
                          operationType === 'product' || operationType === 'automotive' || operationType === 'fashion' ||
                          operationType === 'food' || operationType === 'real_estate' || operationType === 'medical' ||
                          operationType === 'technical_processing' || operationType === 'color_accuracy' || operationType === 'background_clean' ||
                          operationType === 'detail_enhance' || operationType === 'defect_remove' || operationType === 'skin_natural' ||
                          operationType === 'feature_preserve' || operationType === 'background_pro' || operationType === 'lighting_opt') {
                    // 专业操作 - 直接使用描述，不需要 change to 前缀
                    simplePrompt = englishDescription;
                } else {
                    simplePrompt = `change to ${description.trim()}`;
                }
                
                generatedPromptParts.push(simplePrompt);
            }
        }
        
        // 只使用用户手动选择的约束和修饰词，不自动生成额外约束
        if (constraintPromptsEnglish.length > 0) {
            console.log('[DEBUG] Adding user-selected constraints:', constraintPromptsEnglish);
            generatedPromptParts.push(...constraintPromptsEnglish);
        }
        
        if (decorativePromptsEnglish.length > 0) {
            console.log('[DEBUG] Adding user-selected decoratives:', decorativePromptsEnglish);
            generatedPromptParts.push(...decorativePromptsEnglish);
        }
        
        // 生成最终提示词
        this.currentTabData.generatedPrompt = generatedPromptParts.join(', ');
        console.log('[DEBUG] Generated prompt parts:', generatedPromptParts);
        console.log('[DEBUG] Final generated prompt:', this.currentTabData.generatedPrompt);
        
        // 如果没有生成任何内容，提供一个默认提示
        if (!this.currentTabData.generatedPrompt || this.currentTabData.generatedPrompt.trim() === '') {
            this.currentTabData.generatedPrompt = 'Please describe the changes you want to make or select some options above';
            console.log('[DEBUG] Using default prompt');
        }
        
        console.log('[DEBUG] About to call updateCurrentTabPreview()');
        this.updateCurrentTabPreview();
        
        const promptData = {
            edit_mode: this.currentEditMode,
            operation_type: this.currentTabData.operationType || '',
            description: this.currentTabData.description || '',
            constraint_prompts: constraintPromptsEnglish.join('\n'),
            decorative_prompts: decorativePromptsEnglish.join('\n'),
            selected_layers: JSON.stringify(this.selectedLayers),
            auto_generate: this.autoGenerate,
            generated_prompt: this.currentTabData.generatedPrompt
        };

        this.updateNodeWidgets(promptData);
        
        // 强制触发节点序列化，确保数据传递到后端
        if (this.node.serialize) {
            const serializedData = this.node.serialize();
        }
        
        // 通知节点图更新
        if (this.node.graph) {
            this.node.graph.change();
        }
        
        this.isGeneratingPrompt = false;
        
        // 通知生成完成
        this.showNotification("超级提示词已生成！", "success");
    }

    updateNodeWidgets(data) {
        // ⚠️ 关键修复：保留现有的widget值，不要用不完整的data覆盖
        // 获取当前所有widget的值
        const currentValues = {};
        if (this.node.widgets) {
            this.node.widgets.forEach(widget => {
                if (widget.name && widget.value !== undefined) {
                    currentValues[widget.name] = widget.value;
                }
            });
        }
        
        // 合并：只更新data中提供的字段，保留其他现有值
        const mergedData = {
            // 首先使用现有值
            ...currentValues,
            // 然后用新数据覆盖（只覆盖提供的字段）
            ...data
        };
        
        
        // 创建或更新隐藏的widget来传递数据给后端
        this.createHiddenWidgets(mergedData);
        
        // 将数据存储到节点属性中，供serialize方法使用
        this.node._kontextData = mergedData;
        
        this.notifyNodeUpdate();
    }
    
    createHiddenWidgets(data) {
        // 确保节点有widgets数组
        if (!this.node.widgets) {
            this.node.widgets = [];
        }
        
        // 为每个选项卡创建独立的widgets
        const widgetFields = [
            // 系统字段
            { name: 'tab_mode', value: data.tab_mode || 'manual' },
            { name: 'edit_mode', value: data.edit_mode || '局部编辑' },
            { name: 'operation_type', value: data.operation_type || '' },
            { name: 'selected_layers', value: data.selected_layers || '' },
            { name: 'auto_generate', value: data.auto_generate !== false },
            
            // 局部编辑选项卡
            { name: 'local_description', value: this.tabData.local.description || '' },
            { name: 'local_generated_prompt', value: this.tabData.local.generatedPrompt || '' },
            { name: 'local_operation_type', value: this.tabData.local.operationType || 'add_object' },
            { name: 'local_selected_constraints', value: this.tabData.local.selectedConstraints.join('\n') || '' },
            { name: 'local_selected_decoratives', value: this.tabData.local.selectedDecoratives.join('\n') || '' },
            
            // 全局编辑选项卡
            { name: 'global_description', value: this.tabData.global.description || '' },
            { name: 'global_generated_prompt', value: this.tabData.global.generatedPrompt || '' },
            { name: 'global_operation_type', value: this.tabData.global.operationType || 'global_color_grade' },
            { name: 'global_selected_constraints', value: this.tabData.global.selectedConstraints.join('\n') || '' },
            { name: 'global_selected_decoratives', value: this.tabData.global.selectedDecoratives.join('\n') || '' },
            
            // 文字编辑选项卡
            { name: 'text_description', value: this.tabData.text.description || '' },
            { name: 'text_generated_prompt', value: this.tabData.text.generatedPrompt || '' },
            { name: 'text_operation_type', value: this.tabData.text.operationType || 'text_add' },
            { name: 'text_selected_constraints', value: this.tabData.text.selectedConstraints.join('\n') || '' },
            { name: 'text_selected_decoratives', value: this.tabData.text.selectedDecoratives.join('\n') || '' },
            
            // 专业操作选项卡
            { name: 'professional_description', value: this.tabData.professional.description || '' },
            { name: 'professional_generated_prompt', value: this.tabData.professional.generatedPrompt || '' },
            { name: 'professional_operation_type', value: this.tabData.professional.operationType || 'geometric_warp' },
            { name: 'professional_selected_constraints', value: this.tabData.professional.selectedConstraints.join('\n') || '' },
            { name: 'professional_selected_decoratives', value: this.tabData.professional.selectedDecoratives.join('\n') || '' },
            
            // API选项卡
            { name: 'api_description', value: this.tabData.api.description || '' },
            { name: 'api_generated_prompt', value: this.tabData.api.generatedPrompt || '' },
            { name: 'api_provider', value: this.tabData.api.apiProvider || 'siliconflow' },
            { name: 'api_key', value: this.tabData.api.apiKey || '' },
            { name: 'api_model', value: this.tabData.api.apiModel || 'deepseek-ai/DeepSeek-V3' },
            { name: 'api_intent', value: this.tabData.api.apiIntent || 'general_editing' },
            { name: 'api_style', value: this.tabData.api.apiStyle || 'auto_smart' },
            
            // Ollama选项卡
            { name: 'ollama_description', value: this.tabData.ollama.description || '' },
            { name: 'ollama_generated_prompt', value: this.tabData.ollama.generatedPrompt || '' },
            
            // 兼容旧版本
            { name: 'description', value: data.description || '' },
            { name: 'constraint_prompts', value: data.constraint_prompts || '' },
            { name: 'decorative_prompts', value: data.decorative_prompts || '' },
            { name: 'generated_prompt', value: data.generated_prompt || '' },
            // API参数
            { name: 'api_provider', value: data.api_provider || 'siliconflow' },
            { name: 'api_key', value: data.api_key || '' },
            { name: 'api_model', value: data.api_model || 'deepseek-ai/DeepSeek-V3' },
            { name: 'api_editing_intent', value: data.api_editing_intent || 'general_editing' },
            { name: 'api_processing_style', value: data.api_processing_style || 'auto_smart' },
            { name: 'api_seed', value: data.api_seed || 0 },
            { name: 'api_custom_guidance', value: data.api_custom_guidance || '' },
            // Ollama参数
            { name: 'ollama_url', value: data.ollama_url || 'http://127.0.0.1:11434' },
            { name: 'ollama_model', value: data.ollama_model || '' },
            { name: 'ollama_temperature', value: data.ollama_temperature || 0.7 },
            { name: 'ollama_editing_intent', value: data.ollama_editing_intent || 'general_editing' },
            { name: 'ollama_processing_style', value: data.ollama_processing_style || 'auto_smart' },
            { name: 'ollama_seed', value: data.ollama_seed || 42 },
            { name: 'ollama_custom_guidance', value: data.ollama_custom_guidance || '' },
            { name: 'ollama_enable_visual', value: data.ollama_enable_visual || false },
            { name: 'ollama_auto_unload', value: data.ollama_auto_unload || false }
        ];
        
        // 创建或更新widget - 使用ComfyUI的widget系统
        widgetFields.forEach((field) => {
            let widget = this.node.widgets.find(w => w.name === field.name);
            
            if (!widget) {
                // 使用ComfyUI的addWidget方法创建可序列化的widget
                if (typeof field.value === 'boolean') {
                    widget = this.node.addWidget('toggle', field.name, field.value, () => {}, 
                        { on: field.name, off: field.name });
                } else {
                    widget = this.node.addWidget('text', field.name, field.value, () => {});
                }
                
                // 隐藏widget从UI
                widget.computeSize = () => [0, -4]; // 隐藏widget
            } else {
                // 更新现有widget的值
                widget.value = field.value;
            }
        });
    }

    hideAllPersistenceWidgets() {
        // 隐藏所有用于数据持久化的widget
        if (this.node && this.node.widgets) {
            this.node.widgets.forEach(widget => {
                // 隐藏所有持久化相关的widget
                if (widget.name && (
                    widget.name.includes('_description') ||
                    widget.name.includes('_generated_prompt') ||
                    widget.name.includes('_selected_constraints') ||
                    widget.name.includes('_selected_decoratives') ||
                    widget.name.includes('_operation_type') ||
                    widget.name.includes('api_') ||
                    widget.name.includes('ollama_') ||
                    widget.name === 'description' ||
                    widget.name === 'constraint_prompts' ||
                    widget.name === 'decorative_prompts' ||
                    widget.name === 'generated_prompt' ||
                    widget.name === 'edit_mode' ||
                    widget.name === 'operation_type' ||
                    widget.name === 'selected_layers' ||
                    widget.name === 'auto_generate'
                )) {
                    // 简单的隐藏widget
                    widget.computeSize = () => [0, -4];
                }
            });
            
            // 强制节点重新计算大小
            if (this.node.setSize) {
                this.node.setSize(this.node.size);
            }
        }
    }

    generateWithAPI() {
        // 防止重复触发
        if (this.isGeneratingAPI) {
            return;
        }
        this.isGeneratingAPI = true;
        
        
        // 清除任何可能的旧状态
        this.description = '';  // 先清空缓存的description
        
        // 保存当前选项卡状态
        const currentTab = this.currentCategory;
        
        // 获取API配置
        const provider = this.apiConfig?.providerSelect?.value || 'siliconflow';
        const apiKey = this.apiConfig?.keyInput?.value || '';
        const model = this.apiConfig?.modelSelect?.value || 'deepseek-ai/DeepSeek-V3';
        const intent = this.apiConfig?.intentSelect?.value || 'general_editing';
        const style = this.apiConfig?.styleSelect?.value || 'auto_smart';
        
        // 每次生成前清空缓存，强制重新读取
        this.description = '';
        
        // 获取描述 - 优先从API面板的输入框读取
        let description = '';
        const apiDescTextarea = this.editorContainer.querySelector('.api-edit-panel .description-section textarea');
        
        if (apiDescTextarea && apiDescTextarea.value) {
            description = apiDescTextarea.value.trim();
        } else {
            // 如果API面板没有输入框，尝试其他选择器
            const descriptionInputs = [
                this.editorContainer.querySelector('.description-section textarea'),
                this.descriptionTextarea,
                this.descriptionInput
            ];
            
            for (const input of descriptionInputs) {
                if (input && input.value && typeof input.value === 'string') {
                    const trimmedValue = input.value.trim();
                    if (trimmedValue) {
                        description = trimmedValue;
                        break;
                    }
                }
            }
        }
        
        // 更新缓存
        this.description = description;
        
        
        // 检测并修复模板污染问题
        const templatePatterns = [
            /transform selected area color to\s+(.+)/,
            /transform \{object\} color to\s+(.+)/,
            /reimagine selected area in\s+(.+)\s+aesthetic/,
            /thoughtfully replace selected area with\s+(.+)/,
            /thoughtfully introduce\s+(.+)\s+to complement/,
            /seamlessly eliminate selected area/,
            /transform selected area surface to\s+(.+)\s+texture/
        ];
        
        for (const pattern of templatePatterns) {
            if (description && pattern.test(description)) {
                console.warn('[API] ⚠️ 检测到模板污染:', description);
                const matches = description.match(pattern);
                if (matches && matches[1]) {
                    description = matches[1].trim();
                } else if (description.includes('seamlessly eliminate')) {
                    // 特殊处理remove_object模板
                    description = '';
                }
                // 更新当前选项卡的description属性为清理后的值
                this.currentTabData.description = description;
                // ⭐ 关键修复：恢复UI显示，与Ollama方法保持一致
                this.updateCurrentTabDescription();
                break;
            }
        }
        
        if (!apiKey) {
            alert('请输入API密钥');
            return;
        }
        
        // 设置生成中状态 - 添加时间戳确保用户看到新的生成过程
        const timestamp = new Date().toLocaleTimeString();
        this.tabData.api.generatedPrompt = `🔄 正在使用API生成提示词... (${timestamp})`;
        this.updateCurrentTabPreview();
        
        // 设置标志位防止切换选项卡
        this.isUpdatingFromAPI = true;
        
        // 更新节点数据
        this.updateNodeWidgets({
            tab_mode: 'api',
            edit_mode: '远程API',  // 设置为API模式
            api_provider: provider,
            api_key: apiKey,
            api_model: model,
            api_editing_intent: intent,
            api_processing_style: style,
            api_seed: Math.floor(Math.random() * 1000000),
            api_custom_guidance: style === 'custom_guidance' ? (this.apiConfig?.guidanceTextarea?.value || '') : '',
            description: description,
            // 保持空的约束和修饰提示词，避免与手动模式混淆
            constraint_prompts: '',
            decorative_prompts: '',
            operation_type: 'api_enhance'
        });
        
        // 触发后端处理
        this.notifyNodeUpdate();
        
        // 确保保持在API选项卡
        setTimeout(() => {
            this.isUpdatingFromAPI = false;
            if (this.currentCategory !== currentTab) {
                this.switchTab(currentTab);
            }
        }, 100);
        
        // 等待后端处理结果
        this.waitForAPIResult(provider, model, description);
    }
    
    generateWithOllama() {
        // 防止重复触发
        if (this.isGeneratingOllama) {
            return;
        }
        this.isGeneratingOllama = true;
        
        
        // 保存当前选项卡状态
        const currentTab = this.currentCategory;
        
        // 获取Ollama配置
        const url = this.ollamaUrlInput?.value || 'http://127.0.0.1:11434';
        const model = this.ollamaModelSelect?.value || '';
        const temperature = parseFloat(this.ollamaTempInput?.value || '0.7');
        const intent = this.ollamaIntentSelect?.value || 'general_editing';
        const style = this.ollamaStyleSelect?.value || 'auto_smart';
        const enableVisual = this.ollamaVisualCheckbox?.checked || false;
        const autoUnload = this.ollamaUnloadCheckbox?.checked || false;
        
        // 获取描述 - 尝试多种选择器，优先使用当前DOM中的值
        let description = '';
        const descriptionInputs = [
            this.editorContainer.querySelector('.ollama-edit-panel .description-section textarea'),
            this.editorContainer.querySelector('.description-section textarea'),
            this.descriptionTextarea,
            this.descriptionInput
        ];
        
        // 优先从DOM查询获取最新值，避免使用缓存的旧值
        for (const input of descriptionInputs) {
            if (input && input.value && typeof input.value === 'string') {
                const trimmedValue = input.value.trim();
                if (trimmedValue) {
                    description = trimmedValue;
                    // 更新组件的description属性为最新值
                    this.description = description;
                    break;
                }
            }
        }
        
        // 如果DOM中没有找到，才使用缓存的值
        if (!description && this.description && this.description.trim()) {
            description = this.description.trim();
        }
        
        
        // 检测并修复模板污染问题（与API模式相同）
        const templatePatterns = [
            /transform selected area color to\s+(.+)/,
            /transform \{object\} color to\s+(.+)/,
            /reimagine selected area in\s+(.+)\s+aesthetic/,
            /thoughtfully replace selected area with\s+(.+)/,
            /thoughtfully introduce\s+(.+)\s+to complement/,
            /seamlessly eliminate selected area/,
            /transform selected area surface to\s+(.+)\s+texture/
        ];
        
        for (const pattern of templatePatterns) {
            if (description && pattern.test(description)) {
                console.warn('[Ollama] ⚠️ 检测到模板污染:', description);
                const matches = description.match(pattern);
                if (matches && matches[1]) {
                    description = matches[1].trim();
                } else if (description.includes('seamlessly eliminate')) {
                    // 特殊处理remove_object模板
                    description = '';
                }
                // 更新当前选项卡的description属性
                this.currentTabData.description = description;
                // 更新当前选项卡的描述输入框
                this.updateCurrentTabDescription();
                break;
            }
        }
        
        if (!model) {
            alert('请选择Ollama模型');
            return;
        }
        
        // 设置生成中状态 - 添加时间戳确保用户看到新的生成过程  
        const timestamp = new Date().toLocaleTimeString();
        this.tabData.ollama.generatedPrompt = `🔄 正在使用Ollama生成提示词... (${timestamp})`;
        this.updateCurrentTabPreview();
        
        // 设置标志位防止切换选项卡
        this.isUpdatingFromOllama = true;
        
        // 更新节点数据
        this.updateNodeWidgets({
            tab_mode: 'ollama',
            edit_mode: '本地Ollama',  // 设置为Ollama模式
            ollama_url: url,
            ollama_model: model,
            ollama_temperature: temperature,
            ollama_editing_intent: intent,
            ollama_processing_style: style,
            ollama_seed: Math.floor(Math.random() * 1000000),
            ollama_custom_guidance: style === 'custom_guidance' ? (this.ollamaGuidanceTextarea?.value || '') : '',
            ollama_enable_visual: enableVisual,
            ollama_auto_unload: autoUnload,
            description: description,
            // 保持空的约束和修饰提示词，避免与手动模式混淆
            constraint_prompts: '',
            decorative_prompts: '',
            operation_type: 'ollama_enhance'
        });
        
        // 触发后端处理
        this.notifyNodeUpdate();
        
        // 确保保持在Ollama选项卡
        setTimeout(() => {
            this.isUpdatingFromOllama = false;
            if (this.currentCategory !== currentTab) {
                this.switchTab(currentTab);
            }
        }, 100);
        
        // 等待后端处理结果
        this.waitForOllamaResult(model, description);
    }

    async waitForAPIResult(provider, model, description) {
        try {
            
            // 显示连接状态
            this.tabData.api.generatedPrompt = `🔄 正在连接 ${provider} (${model})...`;
            this.updateCurrentTabPreview();
            
            // 获取API配置
            const apiKey = (this.apiConfig?.keyInput?.value || '').trim();
            const editingIntent = this.apiConfig?.intentSelect?.value || 'general_editing';
            const processingStyle = this.apiConfig?.styleSelect?.value || 'auto_smart';
            const customGuidance = (this.apiConfig?.guidanceTextarea?.value || '').trim();
            
            // 根据提供商构建API请求
            let apiUrl = '';
            let headers = {};
            let requestBody = {};
            
            // 获取引导词 - 所有API提供商统一使用
            const intentGuide = this.getIntentGuidance(editingIntent);
            const styleGuide = this.getStyleGuidance(processingStyle);
            
            if (provider === 'zhipu') {
                // 添加随机性确保每次生成不同结果
                const randomSeed = Math.floor(Math.random() * 1000000);
                const temperature = 0.7 + (Math.random() * 0.3); // 0.7-1.0之间的随机温度
                
                apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                requestBody = {
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional image editing prompt generator. Generate concise, creative prompts in English.'
                        },
                        {
                            role: 'user',
                            content: `Generate an image editing prompt for: ${description}\nIntent: ${intentGuide}\nStyle: ${styleGuide}\n${customGuidance ? `Additional: ${customGuidance}` : ''}\n\nOutput a single creative prompt (no numbering or formatting).`
                        }
                    ],
                    temperature: temperature,
                    max_tokens: 500,  // 确保有足够空间生成完整提示词
                    top_p: 0.95
                };
            } else if (provider === 'moonshot') {
                // 添加随机性确保每次生成不同结果
                const randomSeed = Math.floor(Math.random() * 1000000);
                const temperature = 0.7 + (Math.random() * 0.3); // 0.7-1.0之间的随机温度
                
                apiUrl = 'https://api.moonshot.cn/v1/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                requestBody = {
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional image editing prompt generator. Generate concise, creative prompts in English.'
                        },
                        {
                            role: 'user',
                            content: `Generate an image editing prompt for: ${description}\nIntent: ${intentGuide}\nStyle: ${styleGuide}\n${customGuidance ? `Additional: ${customGuidance}` : ''}\n\nOutput a single creative prompt (no numbering or formatting).`
                        }
                    ],
                    temperature: temperature,
                    max_tokens: 500,  // 确保有足够空间生成完整提示词
                    top_p: 0.95
                };
            } else if (provider === 'siliconflow') {
                // 添加随机性确保每次生成不同结果
                const randomSeed = Math.floor(Math.random() * 1000000);
                const temperature = 0.7 + (Math.random() * 0.3); // 0.7-1.0之间的随机温度
                
                apiUrl = 'https://api.siliconflow.cn/v1/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                requestBody = {
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional image editing prompt generator. Generate concise, creative prompts in English.'
                        },
                        {
                            role: 'user',
                            content: `Generate an image editing prompt for: ${description}\nIntent: ${intentGuide}\nStyle: ${styleGuide}\n${customGuidance ? `Additional: ${customGuidance}` : ''}\n\nOutput a single creative prompt (no numbering or formatting).`
                        }
                    ],
                    temperature: temperature,
                    max_tokens: 500,  // 确保有足够空间生成完整提示词
                    top_p: 0.95
                };
            } else if (provider === 'deepseek') {
                // 添加随机性确保每次生成不同结果
                const randomSeed = Math.floor(Math.random() * 1000000);
                const temperature = 0.7 + (Math.random() * 0.3); // 0.7-1.0之间的随机温度
                
                apiUrl = 'https://api.deepseek.com/v1/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                requestBody = {
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional image editing prompt generator. Generate concise, creative prompts in English.'
                        },
                        {
                            role: 'user',
                            content: `Generate an image editing prompt for: ${description}\nIntent: ${intentGuide}\nStyle: ${styleGuide}\n${customGuidance ? `Additional: ${customGuidance}` : ''}\n\nOutput a single creative prompt (no numbering or formatting).`
                        }
                    ],
                    temperature: temperature,
                    max_tokens: 500,  // 确保有足够空间生成完整提示词
                    top_p: 0.95
                };
            } else if (provider === 'modelscope') {
                // ModelScope API配置 (尝试OpenAI兼容格式)
                apiUrl = 'https://api-inference.modelscope.cn/v1/chat/completions';
                headers = {
                    'Authorization': `Bearer ${apiKey}`,  // 尝试使用Bearer token格式
                    'Content-Type': 'application/json'
                };
                requestBody = {
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are an expert image editing assistant. Generate optimized editing prompts in English.
                            
Your task:
1. Generate a clear, professional English prompt (60-120 words)
2. Include specific technical requirements
3. Use proper editing terminology
4. Be creative and unique in each generation`
                        },
                        {
                            role: 'user',
                            content: `Generate an image editing prompt for: ${description}

Editing guidance:
- Intent: ${intentGuide}
- Style: ${styleGuide}
${customGuidance ? `- Additional: ${customGuidance}` : ''}

Output a single, detailed English prompt without any explanations or formatting.`
                        }
                    ],
                    temperature: 0.7 + (Math.random() * 0.2),
                    max_tokens: 500,
                    top_p: 0.95,
                    stream: false
                };
            } else if (provider === 'gemini') {
                // 添加随机性确保每次生成不同结果
                const randomSeed = Math.floor(Math.random() * 1000000);
                const temperature = 0.7 + (Math.random() * 0.3); // 0.7-1.0之间的随机温度
                
                // Note: Gemini API需要特殊处理，使用不同的URL格式
                apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                headers = {
                    'Content-Type': 'application/json'
                };
                requestBody = {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Generate an optimized image editing prompt.
                                    
User input: ${description}
Editing intent: ${intentGuide}
Processing style: ${styleGuide}
${customGuidance ? `Custom guidance: ${customGuidance}` : ''}

Please generate a professional English prompt that is creative and unique. Output only the prompt text without any formatting or numbering.`
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: temperature,
                        maxOutputTokens: 1000
                    }
                };
            } else {
                // 对于不支持直接调用的提供商，显示说明
                this.tabData.api.generatedPrompt = `ℹ️ ${provider} 提供商暂不支持前端直接调用\n\n由于浏览器CORS限制，某些API提供商无法直接从前端调用。\n\n请使用支持的提供商：\n- 智谱AI (zhipu)\n- Moonshot (moonshot) 
- SiliconFlow (siliconflow)\n- DeepSeek (deepseek)\n- ModelScope (modelscope)\n- Google Gemini (gemini)\n\n或者联系开发者添加对 ${provider} 的支持。`;
                this.updateCurrentTabPreview();
                this.isGeneratingAPI = false;
                return;
            }
            
            const callTimestamp = new Date().toLocaleTimeString();
            this.tabData.api.generatedPrompt = `⚡ 正在调用 ${provider} API... (${callTimestamp})`;
            this.updateCurrentTabPreview();
            
            // 调用远程API
            // 确保headers只包含ASCII字符
            const safeHeaders = {};
            for (const [key, value] of Object.entries(headers)) {
                // 确保键和值都只包含ASCII字符
                if (key && value) {
                    safeHeaders[key] = String(value).replace(/[^\x00-\x7F]/g, '');
                }
            }
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: safeHeaders,
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // 提取生成的内容
            let generatedContent = '';
            if (provider === 'modelscope') {
                // ModelScope/DashScope API使用不同的响应格式
                if (result.output && result.output.choices && result.output.choices[0]) {
                    generatedContent = result.output.choices[0].message?.content || result.output.text || '';
                } else if (result.output && result.output.text) {
                    generatedContent = result.output.text;
                } else if (result.choices && result.choices[0]) {
                    // 兼容OpenAI格式
                    generatedContent = result.choices[0].message?.content || result.choices[0].text || '';
                } else {
                    generatedContent = '未能获取到有效的ModelScope响应';
                }
            } else if (provider === 'gemini') {
                // Gemini API使用不同的响应格式
                if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
                    generatedContent = result.candidates[0].content.parts[0].text;
                } else {
                    generatedContent = '未能获取到有效的Gemini响应';
                }
            } else if (result.choices && result.choices[0] && result.choices[0].message) {
                const rawContent = result.choices[0].message.content;
                
                // 如果原始内容为空，尝试其他字段
                if (!rawContent || rawContent.trim().length === 0) {
                    console.error('[API] API返回了空内容！');
                    
                    // 检查是否因为token限制导致的空响应
                    if (result.choices[0].finish_reason === 'length') {
                        generatedContent = '❌ API响应被截断（token限制），请重试或简化输入';
                        console.warn('[API] 响应因token限制被截断');
                    } else if (result.choices[0].text) {
                        generatedContent = result.choices[0].text;
                    } else {
                        generatedContent = '❌ API返回了空响应，请重试';
                    }
                } else {
                    // 清理API响应，提取纯净提示词
                    generatedContent = this.cleanApiResponse(rawContent);
                    
                    // 如果清理后为空，使用原始内容
                    if (!generatedContent || generatedContent.length < 10) {
                        console.warn('[API] 清理后内容过短，使用原始内容');
                        generatedContent = rawContent;
                    }
                }
            } else {
                generatedContent = 'Unable to get valid response, using default prompt';
            }
            
            // 最终验证：确保输出是英文
            if (generatedContent && /[\u4e00-\u9fa5]/.test(generatedContent)) {
                console.error('[API] ⚠️ 最终输出仍包含中文，强制替换为英文');
                // 根据描述生成备用英文
                if (description.includes('颜色') || description.includes('color')) {
                    generatedContent = 'Transform the selected area to the specified color with natural blending';
                } else if (description.includes('删除') || description.includes('移除') || description.includes('remove')) {
                    generatedContent = 'Remove the selected object seamlessly from the image';
                } else if (description.includes('添加') || description.includes('add')) {
                    generatedContent = 'Add the requested element to the selected area naturally';
                } else if (description.includes('替换') || description.includes('replace')) {
                    generatedContent = 'Replace the selected object with the specified element';
                } else if (description.includes('风格') || description.includes('style')) {
                    generatedContent = 'Apply the specified style transformation to the marked region';
                } else {
                    generatedContent = 'Edit the selected area according to the specified requirements';
                }
            }
            
            // 显示最终结果并传递纯净提示词给后端
            this.tabData.api.generatedPrompt = `✅ ${provider} API生成完成！\n\n模型: ${model}\n输入: "${description}"\n\n生成的提示词:\n${generatedContent}`;
            this.updateCurrentTabPreview();
            
            // 将纯净的提示词传递给后端，同时保持API模式设置
            this.updateNodeWidgets({
                tab_mode: 'api',
                edit_mode: '远程API',
                generated_prompt: generatedContent || '',
                api_provider: provider,
                api_key: apiKey,
                api_model: model,
                api_editing_intent: editingIntent,
                api_processing_style: processingStyle,
                description: description
            });
            
            this.isGeneratingAPI = false;
            // 确保选项卡不会被切换
            this.currentCategory = 'api';
            
        } catch (error) {
            console.error('[API] 请求失败:', error);
            
            if (error.message.includes('Failed to fetch') || error.message.includes('CORS') || error.message.includes('Network')) {
                this.generatedPrompt = `❌ 网络请求失败 (${provider})\n\n可能的原因：\n1. 浏览器CORS限制 - 某些API不允许前端直接调用\n2. 网络连接问题\n3. API服务不可用\n\n建议：\n- 检查API密钥是否正确\n- 尝试其他支持的API提供商\n- 或使用本地Ollama选项卡`;
            } else if (error.message.includes('401') || error.message.includes('403')) {
                this.generatedPrompt = `❌ 认证失败 (${provider})\n\nAPI密钥错误或已过期\n\n请检查：\n1. API密钥是否正确\n2. API密钥是否有效\n3. 账户是否有足够余额`;
            } else if (error.message.includes('429')) {
                this.generatedPrompt = `❌ 请求频率过高 (${provider})\n\n请稍后再试或升级API套餐`;
            } else {
                this.generatedPrompt = `❌ API请求失败 (${provider}/${model}): ${error.message}`;
            }
            
            this.updateCurrentTabPreview();
            this.isGeneratingAPI = false;
            // 确保选项卡不会被切换
            this.currentCategory = 'api';
        }
    }
    
    getIntentGuidance(intent) {
        // 使用方案A的AI生成专业引导词库
        return getIntentGuidance(intent);
    }
    
    getStyleGuidance(style) {
        // 使用方案A的AI生成专业引导词库
        return getStyleGuidance(style);
    }
    
    generateFallbackPrompt(description) {
        // 基于方案A引导词库的智能备用方案
        const desc_lower = description.toLowerCase();
        
        // 根据描述内容匹配相应的专业引导词
        if (desc_lower.includes('color') || desc_lower.includes('颜色') || 
            desc_lower.includes('red') || desc_lower.includes('blue') || desc_lower.includes('green') ||
            desc_lower.includes('红') || desc_lower.includes('蓝') || desc_lower.includes('绿')) {
            return "Transform the selected area to the specified color with precise color grading and tonal balance adjustment, maintaining natural transitions and professional quality finish";
        } else if (desc_lower.includes('remove') || desc_lower.includes('移除') || 
                   desc_lower.includes('delete') || desc_lower.includes('删除')) {
            return "Remove the selected object with seamless object erasure using intelligent content-aware fill and contextual background regeneration";
        } else if (desc_lower.includes('replace') || desc_lower.includes('替换') || 
                   desc_lower.includes('change') || desc_lower.includes('更换') ||
                   desc_lower.includes('swap') || desc_lower.includes('交换')) {
            return "Replace the selected element with intelligent object substitution, maintaining matched lighting and perspective with realistic integration";
        } else if (desc_lower.includes('add') || desc_lower.includes('添加') || 
                   desc_lower.includes('insert') || desc_lower.includes('插入')) {
            return "Add the described element with realistic object insertion using proper depth and occlusion, natural element placement with accurate shadows and lighting";
        } else if (desc_lower.includes('enhance') || desc_lower.includes('增强') || 
                   desc_lower.includes('improve') || desc_lower.includes('改善') ||
                   desc_lower.includes('quality') || desc_lower.includes('质量')) {
            return "Enhance the selected area with professional upscaling and detail enhancement, AI-powered quality improvement with texture preservation and noise reduction";
        } else if (desc_lower.includes('background') || desc_lower.includes('背景') ||
                   desc_lower.includes('backdrop') || desc_lower.includes('scene')) {
            return "Modify the background with professional background replacement using edge refinement and matched lighting conditions for seamless integration";
        } else if (desc_lower.includes('face') || desc_lower.includes('facial') || 
                   desc_lower.includes('脸') || desc_lower.includes('面部')) {
            return "Apply facial modifications with advanced facial replacement technology, preserving expression and ensuring natural blending with skin tone matching";
        } else if (desc_lower.includes('style') || desc_lower.includes('风格') ||
                   desc_lower.includes('artistic') || desc_lower.includes('艺术')) {
            return "Apply artistic style transformation with content preservation, professional aesthetic transformation using selective stylization and balanced artistic expression";
        } else if (desc_lower.includes('text') || desc_lower.includes('文字') ||
                   desc_lower.includes('typography') || desc_lower.includes('字体')) {
            return "Modify text elements with professional typography modification and text replacement, intelligent text editing with font matching and proper perspective";
        } else if (desc_lower.includes('light') || desc_lower.includes('lighting') ||
                   desc_lower.includes('光') || desc_lower.includes('照明')) {
            return "Adjust lighting with professional lighting enhancement using natural shadows, studio lighting simulation with directional control and mood preservation";
        } else {
            return "Apply comprehensive image optimization with intelligent enhancement, multi-aspect improvement using balanced adjustments and professional post-processing workflow automation";
        }
    }
    
    generateSmartFallback(description, editingIntent, processingStyle) {
        // 基于用户选择的编辑意图和处理风格生成智能备用方案
        const intentGuide = this.getIntentGuidance(editingIntent);
        const styleGuide = this.getStyleGuidance(processingStyle);
        
        // 结合用户输入描述、编辑意图引导词和处理风格引导词
        return `Execute the editing task: "${description}" using ${intentGuide}, optimized for ${styleGuide}`;
    }
    
    async waitForOllamaResult(model, description) {
        try {
            
            // 显示连接状态
            this.tabData.ollama.generatedPrompt = `🔄 正在连接本地 Ollama (${model})...`;
            this.updateCurrentTabPreview();
            
            // 获取Ollama配置
            // 智能检测Ollama地址
            let ollamaUrl = this.ollamaUrlInput?.value || 'http://127.0.0.1:11434';
            
            // 如果是远程访问，尝试使用同域名的11434端口
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                const defaultRemoteUrl = `${window.location.protocol}//${window.location.hostname.replace('-80', '-11434')}`;
                if (ollamaUrl === 'http://127.0.0.1:11434') {
                    ollamaUrl = defaultRemoteUrl;
                }
            }
            const temperature = parseFloat(this.ollamaTempInput?.value || '0.7');
            const editingIntent = this.ollamaIntentSelect?.value || 'general_editing';
            const processingStyle = this.ollamaStyleSelect?.value || 'auto_smart';
            const customGuidance = this.ollamaGuidanceTextarea?.value || '';
            
            
            // 添加随机性确保每次生成不同结果
            const randomSeed = Math.floor(Math.random() * 1000000);
            const finalTemperature = temperature + (Math.random() * 0.2); // 在原温度基础上增加一些随机性
            
            // 构建引导词基于编辑意图和处理风格
            const intentGuide = this.getIntentGuidance(editingIntent);
            const styleGuide = this.getStyleGuidance(processingStyle);
            
            
            // 尝试不同的提示词格式，根据模型大小调整复杂度
            let finalPrompt;
            
            // 检测模型大小
            const isSmallModel = model && (model.includes('0.6b') || model.includes('0.5b') || model.includes('1b'));
            
            if (isSmallModel) {
                // 小模型需要极其简单的格式
                finalPrompt = `Change ${description} to English editing command:`;
            } else {
                // 正常提示词for较大模型
                finalPrompt = `Task: ${description}
Type: ${intentGuide}
Style: ${styleGuide}
${customGuidance ? `Extra: ${customGuidance}` : ''}
Create English editing prompt:`;
            }

            const requestBody = {
                model: model,
                prompt: finalPrompt,
                system: "Output English editing instruction only.",
                options: {
                    temperature: isSmallModel ? 0.5 : finalTemperature,  // 小模型用更低温度
                    seed: randomSeed,
                    num_predict: 400,  // 给足够空间让模型完成思考和输出
                    stop: ['###']
                },
                stream: false
            };
            
            const callTimestamp = new Date().toLocaleTimeString();
            this.tabData.ollama.generatedPrompt = `⚡ 正在调用本地 Ollama API... (${callTimestamp})`;
            this.updateCurrentTabPreview();
            
            
            // 调用本地Ollama API - 使用generate端点
            const response = await fetch(`${ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Ollama Debug] API错误响应:', errorText);
                console.error('[Ollama Debug] HTTP状态码:', response.status);
                console.error('[Ollama Debug] 使用的模型名:', model);
                throw new Error(`Ollama API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const result = await response.json();
            
            
            // 提取生成的内容 - generate API使用result.response
            let generatedContent = '';
            if (result.response !== undefined && result.response !== null) {
                generatedContent = result.response.trim();
                
                // 清理响应 - 提取真正的指令
                if (generatedContent.includes('<think>')) {
                    // 找到</think>标签后的内容
                    const thinkEnd = generatedContent.indexOf('</think>');
                    if (thinkEnd !== -1) {
                        generatedContent = generatedContent.substring(thinkEnd + 8).trim();
                    }
                }
                
                // 提取引号内的指令
                const quoteMatch = generatedContent.match(/"([^"]+)"/);
                if (quoteMatch) {
                    generatedContent = quoteMatch[1];
                } else {
                    // 如果没有引号，尝试提取第一行
                    const lines = generatedContent.split('\n');
                    if (lines.length > 0) {
                        // 查找包含编辑动词的行
                        for (const line of lines) {
                            if (line.match(/^(Make|Turn|Transform|Change|Convert|Add|Remove|Enhance)/i)) {
                                generatedContent = line.replace(/[.\s]+$/, '').trim();
                                break;
                            }
                        }
                    }
                }
                
                if (!generatedContent) {
                    // 提供基于方案A的智能备用方案，结合编辑意图和处理风格
                    const editingIntent = this.ollamaIntentSelect?.value || 'general_editing';
                    const processingStyle = this.ollamaStyleSelect?.value || 'auto_smart';
                    generatedContent = this.generateSmartFallback(description, editingIntent, processingStyle);
                    // 标记为备用生成
                    generatedContent = `🤖 智能备用生成 (模型 ${model} 无响应)\n\n${generatedContent}`;
                }
            } else if (result.message && result.message.content) {
                generatedContent = result.message.content;
            } else if (result.content) {
                generatedContent = result.content;
            } else {
                const editingIntent = this.ollamaIntentSelect?.value || 'general_editing';
                const processingStyle = this.ollamaStyleSelect?.value || 'auto_smart';
                generatedContent = this.generateSmartFallback(description, editingIntent, processingStyle);
                // 标记为备用生成
                generatedContent = `🤖 智能备用生成 (响应解析失败)\n\n${generatedContent}`;
            }
            
            // 显示最终结果并传递纯净提示词给后端
            this.tabData.ollama.generatedPrompt = `✅ 本地 Ollama 生成完成！\n\n模型: ${model}\n输入: "${description}"\n\n生成的提示词:\n${generatedContent}`;
            this.updateCurrentTabPreview();
            
            // 将纯净的提示词传递给后端，同时保持Ollama模式设置
            this.updateNodeWidgets({
                tab_mode: 'ollama',
                edit_mode: '本地Ollama',
                generated_prompt: generatedContent || '',
                ollama_url: ollamaUrl,
                ollama_model: model,
                ollama_temperature: temperature,
                ollama_editing_intent: editingIntent,
                ollama_processing_style: processingStyle,
                description: description,
                ollama_enable_visual: this.ollamaVisualCheckbox?.checked || false,
                ollama_auto_unload: this.ollamaUnloadCheckbox?.checked || false
            });
            
            this.isGeneratingOllama = false;
            // 确保选项卡不会被切换
            this.currentCategory = 'ollama';
            
        } catch (error) {
            console.error('[Ollama] 请求失败:', error);
            if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
                this.generatedPrompt = `❌ 无法连接到本地 Ollama 服务\n\n请确保:\n1. Ollama 已安装并启动\n   Windows: 运行 ollama serve\n   Mac/Linux: ollama serve\n\n2. 模型已下载\n   运行: ollama pull ${model || 'llama2'}\n   推荐模型: deepseek-r1:1.5b (轻量快速)\n\n3. 服务地址正确\n   当前地址: ${this.ollamaUrlInput?.value || 'http://127.0.0.1:11434'}\n   默认端口: 11434\n\n4. 防火墙未阻止连接\n   检查防火墙是否允许端口 11434\n\n💡 提示: 您也可以使用远程API选项卡，无需本地安装`;
            } else if (error.message.includes('404')) {
                this.generatedPrompt = `❌ 模型未找到: ${model}\n\n请先下载模型:\nollama pull ${model}\n\n或选择已安装的模型:\nollama list`;
            } else {
                this.generatedPrompt = `❌ Ollama请求失败\n\n模型: ${model}\n错误: ${error.message}\n\n建议:\n1. 检查Ollama服务状态\n2. 尝试重启Ollama服务\n3. 或使用远程API选项卡`;
            }
            this.updateCurrentTabPreview();
            this.isGeneratingOllama = false;
            // 确保选项卡不会被切换
            this.currentCategory = 'ollama';
        }
    }

    copyToClipboard() {
        // 复制预览文本框中的内容，如果为空则复制详细信息
        const copyText = this.generatedPrompt && this.generatedPrompt.trim() 
            ? this.generatedPrompt 
            : [
                `编辑模式: ${this.currentEditMode}`,
                `操作类型: ${this.currentOperationType}`,
                `描述: ${this.description}`,
                `约束性提示词: ${this.selectedConstraints.join(', ')}`,
                `修饰性提示词: ${this.selectedDecoratives.join(', ')}`,
                `选中图层: ${this.selectedLayers.length}个`
            ].join('\n');

        navigator.clipboard.writeText(copyText).then(() => {
            this.showNotification("已复制到剪贴板", "success");
        }).catch(() => {
            this.showNotification("复制失败", "error");
        });
    }

    notifyNodeUpdate() {
        // 保存所有选项卡的数据到widgets以支持持久化
        this.saveAllTabDataToWidgets();
        
        // 通知ComfyUI节点需要更新
        if (this.node.onResize) {
            this.node.onResize();
        }
        
        app.graph.change();
    }
    
    saveAllTabDataToWidgets() {
        // 构建完整的数据对象，包含所有选项卡的数据
        const allData = {
            // 系统字段
            tab_mode: 'manual',
            edit_mode: this.currentEditMode,
            operation_type: this.currentOperationType || '',
            selected_layers: JSON.stringify(this.selectedLayers),
            auto_generate: this.autoGenerate,
            
            // 局部编辑选项卡
            local_description: this.tabData.local.description || '',
            local_generated_prompt: this.tabData.local.generatedPrompt || '',
            local_operation_type: this.tabData.local.operationType || 'add_object',
            local_selected_constraints: this.tabData.local.selectedConstraints.join('\n') || '',
            local_selected_decoratives: this.tabData.local.selectedDecoratives.join('\n') || '',
            
            // 全局编辑选项卡
            global_description: this.tabData.global.description || '',
            global_generated_prompt: this.tabData.global.generatedPrompt || '',
            global_operation_type: this.tabData.global.operationType || 'global_color_grade',
            global_selected_constraints: this.tabData.global.selectedConstraints.join('\n') || '',
            global_selected_decoratives: this.tabData.global.selectedDecoratives.join('\n') || '',
            
            // 文字编辑选项卡
            text_description: this.tabData.text.description || '',
            text_generated_prompt: this.tabData.text.generatedPrompt || '',
            text_operation_type: this.tabData.text.operationType || 'text_add',
            text_selected_constraints: this.tabData.text.selectedConstraints.join('\n') || '',
            text_selected_decoratives: this.tabData.text.selectedDecoratives.join('\n') || '',
            
            // 专业操作选项卡
            professional_description: this.tabData.professional.description || '',
            professional_generated_prompt: this.tabData.professional.generatedPrompt || '',
            professional_operation_type: this.tabData.professional.operationType || 'geometric_warp',
            professional_selected_constraints: this.tabData.professional.selectedConstraints.join('\n') || '',
            professional_selected_decoratives: this.tabData.professional.selectedDecoratives.join('\n') || '',
            
            // API选项卡
            api_description: this.tabData.api.description || '',
            api_generated_prompt: this.tabData.api.generatedPrompt || '',
            api_provider: this.tabData.api.apiProvider || 'siliconflow',
            api_key: this.tabData.api.apiKey || '',
            api_model: this.tabData.api.apiModel || 'deepseek-ai/DeepSeek-V3',
            
            // Ollama选项卡
            ollama_description: this.tabData.ollama.description || '',
            ollama_generated_prompt: this.tabData.ollama.generatedPrompt || '',
            ollama_url: this.tabData.ollama.ollamaUrl || 'http://127.0.0.1:11434',
            ollama_model: this.tabData.ollama.ollamaModel || '',
            
            // 兼容旧版本（使用当前选项卡的数据）
            description: this.currentTabData ? this.currentTabData.description || '' : '',
            generated_prompt: this.currentTabData ? this.currentTabData.generatedPrompt || '' : '',
            constraint_prompts: (this.currentTabData && this.currentTabData.selectedConstraints) ? this.currentTabData.selectedConstraints.join('\n') : '',
            decorative_prompts: (this.currentTabData && this.currentTabData.selectedDecoratives) ? this.currentTabData.selectedDecoratives.join('\n') : ''
        };
        
        // 创建或更新widgets
        this.createHiddenWidgets(allData);
        
        // 将数据存储到节点属性中，供serialize方法使用
        this.node._kontextData = allData;
    }

    updateNodeSize() {
        const nodeWidth = 816; // 1020 * 0.8 - 减小20%
        const nodeHeight = 907; // KSP_NS.constants.EDITOR_SIZE.HEIGHT + 50 + 20%
        
        // 强制更新节点大小
        this.node.size = [nodeWidth, nodeHeight];
        
        if (this.node.setSize) {
            this.node.setSize([nodeWidth, nodeHeight]);
        }
        
        // 触发重绘
        if (this.node.setDirtyCanvas) {
            this.node.setDirtyCanvas(true, true);
        }
        
        // 通知ComfyUI节点大小已更改
        if (this.node.onResize) {
            this.node.onResize([nodeWidth, nodeHeight]);
        }
        
        // 如果有画布，通知画布更新
        if (this.node.graph && this.node.graph.canvas) {
            this.node.graph.canvas.setDirty(true, true);
        }
    }

    getEditorData() {
        return {
            currentEditMode: this.currentEditMode,
            currentCategory: this.currentCategory,
            currentOperationType: this.currentOperationType,
            description: this.description,
            selectedConstraints: this.selectedConstraints,
            selectedDecoratives: this.selectedDecoratives,
            selectedLayers: this.selectedLayers,
            autoGenerate: this.autoGenerate,
            generatedPrompt: this.generatedPrompt  // 添加生成的提示词
        };
    }

    setEditorData(data) {
        if (!data) return;
        
        // 保存当前选项卡状态，防止被意外切换
        const previousCategory = this.currentCategory;
        const isGenerating = this.isGeneratingAPI || this.isGeneratingOllama;
        
        // 首先尝试从widget中获取保存的数据（这些数据会被序列化）
        const descWidget = this.node.widgets?.find(w => w.name === 'description');
        const genWidget = this.node.widgets?.find(w => w.name === 'generated_prompt');
        const constrWidget = this.node.widgets?.find(w => w.name === 'constraint_prompts');
        const decorWidget = this.node.widgets?.find(w => w.name === 'decorative_prompts');
        
        // 优先使用widget中的值（这些会被序列化保存）
        this.currentEditMode = data.currentEditMode || "局部编辑";
        this.currentCategory = data.currentCategory || previousCategory || 'local';
        this.currentOperationType = data.currentOperationType || '';
        this.description = descWidget?.value || data.description || '';
        this.selectedConstraints = data.selectedConstraints || [];
        this.selectedDecoratives = data.selectedDecoratives || [];
        this.selectedLayers = data.selectedLayers || [];
        this.autoGenerate = data.autoGenerate !== false;
        this.generatedPrompt = genWidget?.value || data.generatedPrompt || '';
        
        // 如果有约束性和修饰性提示词的widget值，也恢复它们
        if (constrWidget?.value) {
            try {
                this.selectedConstraints = constrWidget.value.split('\n').filter(s => s.trim());
            } catch (e) {
                console.warn('[Kontext Super Prompt] 恢复约束提示词失败:', e);
            }
        }
        
        if (decorWidget?.value) {
            try {
                this.selectedDecoratives = decorWidget.value.split('\n').filter(s => s.trim());
            } catch (e) {
                console.warn('[Kontext Super Prompt] 恢复修饰提示词失败:', e);
            }
        }
        
        // 如果正在生成中，不要更新UI（防止切换选项卡）
        if (!isGenerating) {
            this.updateUI();
        }
    }

    cleanApiResponse(response) {
        /**
         * 清理API响应，确保输出英文提示词
         */
        if (!response) {
            console.warn('[API] 响应为空');
            return 'Edit the selected area as requested';
        }
        
        // 检测是否包含中文
        const hasChineseChar = /[\u4e00-\u9fa5]/.test(response);
        
        if (hasChineseChar) {
            console.warn('[API] ⚠️ 检测到中文输出，强制转换为英文');
            
            // 尝试提取英文句子
            const englishSentences = response.match(/[A-Z][a-zA-Z\s,\.\-;:]+[\.|!|?]/g);
            if (englishSentences && englishSentences.length > 0) {
                // 返回最长的英文句子
                const longestSentence = englishSentences.reduce((a, b) => a.length > b.length ? a : b);
                if (longestSentence.length > 30) {
                    return longestSentence.trim();
                }
            }
            
            // 尝试提取任何英文片段
            const englishFragments = response.match(/[a-zA-Z][a-zA-Z\s,\.\-]+/g);
            if (englishFragments) {
                // 过滤太短的片段
                const validFragments = englishFragments.filter(f => f.length > 15);
                if (validFragments.length > 0) {
                    const combined = validFragments.join(' ');
                    return combined.trim();
                }
            }
            
            // 如果完全无法提取英文，返回默认英文
            console.error('[API] 无法从中文响应中提取英文，使用默认值');
            return 'Transform the selected area with professional image editing techniques';
        }

        // 如果响应包含多个Prompt编号，只提取第一个
        if (response.includes('### Prompt') || response.includes('Prompt 1:')) {
            
            // 尝试提取第一个引号内的提示词
            const firstQuotedMatch = response.match(/"([^"]{30,})"/);
            if (firstQuotedMatch) {
                return firstQuotedMatch[1].trim();
            }
            
            // 尝试提取第一个提示词段落（在第一个---之前）
            const firstPromptMatch = response.match(/(?:Prompt \d+:.*?)"([^"]+)"/s);
            if (firstPromptMatch) {
                return firstPromptMatch[1].trim();
            }
        }

        let cleaned = response.trim();
        
        // 尝试提取引号中的提示词（仅当引号内容足够长时）
        const quotedMatch = response.match(/"([^"]{30,})"/);
        if (quotedMatch) {
            return quotedMatch[1].trim();
        }
        
        // 尝试提取代码块中的提示词
        const codeBlockMatch = response.match(/```[^`]*?\n(.*?)\n```/s);
        if (codeBlockMatch && codeBlockMatch[1].trim().length > 20) {
            return codeBlockMatch[1].trim();
        }

        // 移除常见的标题和前缀
        const patternsToRemove = [
            /^###.*$/gm,           // 移除Markdown标题
            /^Prompt \d+:.*$/gm,   // 移除"Prompt 1:"等
            /^---.*$/gm,           // 移除分隔线
            /^.*?prompt:\s*/i,     // 移除prompt前缀
        ];

        for (const pattern of patternsToRemove) {
            cleaned = cleaned.replace(pattern, '');
        }
        
        // 清理多余空行
        cleaned = cleaned.replace(/\n{2,}/g, '\n').trim();

        // 确保返回有意义的内容
        if (!cleaned || cleaned.length < 10) {
            console.warn('[API] 清理后内容过短，返回默认英文');
            return 'Edit the selected area with professional quality';
        }
        
        // 最终检查：确保没有中文
        if (/[\u4e00-\u9fa5]/.test(cleaned)) {
            console.error('[API] 清理后仍包含中文，强制返回英文');
            return 'Apply the requested editing transformation to the selected area';
        }
        
        return cleaned;
    }

    updateUI() {
        // 如果正在生成提示词，跳过UI更新以避免清空选择状态
        if (this.isGeneratingPrompt) {
            return;
        }
        
        if (this.descriptionTextarea) {
            this.descriptionTextarea.value = this.description;
        }
        
        if (this.autoGenCheckbox) {
            this.autoGenCheckbox.checked = this.autoGenerate;
        }
        
        if (this.currentCategory) {
            this.switchTab(this.currentCategory);
        }
        
        this.updateOperationButtons();
        
        this.updateLayerCountDisplay();
    }

    // 已移除 updateAllPreviewTextareas - 现在每个选项卡独立管理预览框
    
    // 已移除 updateAllDescriptionTextareas - 现在每个选项卡独立管理描述框

    showNotification(message, type = "info") {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 10px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // 检查API提供商是否支持动态模型获取
    supportsDynamicModels(provider) {
        const dynamicProviders = ['openai', 'gemini', 'siliconflow', 'deepseek', 'qianwen', 'modelscope', 'zhipu', 'moonshot', 'claude'];
        return dynamicProviders.includes(provider);
    }

    // 动态获取模型列表
    async fetchDynamicModels(provider, apiKey) {
        try {
            if (provider === 'gemini') {
                // Gemini API特殊处理
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                const models = [];
                
                for (const model of data.models || []) {
                    const modelName = model.name?.replace('models/', '');
                    if (model.supportedGenerationMethods?.includes('generateContent')) {
                        models.push(modelName);
                    }
                }
                
                return models.length > 0 ? models : null;
                
            } else if (provider === 'claude') {
                // Claude API特殊处理
                const response = await fetch('https://api.anthropic.com/v1/models', {
                    headers: {
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                // Claude API返回的格式可能是 { data: [models] } 或直接是模型数组
                const modelList = data.data || data;
                const models = modelList?.map(model => model.id || model.name) || [];
                
                return models.length > 0 ? models : null;
                
            } else {
                // OpenAI兼容API提供商
                const baseUrls = {
                    'openai': 'https://api.openai.com/v1',
                    'siliconflow': 'https://api.siliconflow.cn/v1',
                    'deepseek': 'https://api.deepseek.com/v1',
                    'qianwen': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
                    'modelscope': 'https://api-inference.modelscope.cn/v1',
                    'zhipu': 'https://open.bigmodel.cn/api/paas/v4',
                    'moonshot': 'https://api.moonshot.cn/v1'
                };
                
                const baseUrl = baseUrls[provider];
                if (!baseUrl) return null;
                
                const response = await fetch(`${baseUrl}/models`, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                const models = data.data?.map(model => model.id) || [];
                
                return models.length > 0 ? models : null;
            }
        } catch (error) {
            console.warn(`获取${provider}模型列表失败:`, error);
            return null;
        }
    }

    // Ollama服务管理相关方法
    async checkOllamaServiceStatus() {
        try {
            // 检查Ollama服务状态
            const response = await fetch('/ollama_service_control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'status' })
            });

            if (response.ok) {
                const result = await response.json();
                this.updateOllamaServiceStatus(result.status || '未知');
            } else {
                // 尝试直接检查Ollama API
                try {
                    const ollamaResponse = await fetch('http://127.0.0.1:11434/api/tags', { 
                        method: 'GET',
                        signal: AbortSignal.timeout(3000) 
                    });
                    if (ollamaResponse.ok) {
                        this.updateOllamaServiceStatus('运行中');
                    } else {
                        this.updateOllamaServiceStatus('已停止');
                    }
                } catch {
                    this.updateOllamaServiceStatus('已停止');
                }
            }
        } catch (error) {
            console.warn('[Ollama Service] 状态检查失败:', error);
            this.updateOllamaServiceStatus('未知');
        }
    }

    updateOllamaServiceStatus(status) {
        if (!this.ollamaStatusDisplay) return;
        
        // 根据状态设置样式和按钮
        switch (status) {
            case '运行中':
                this.ollamaStatusDisplay.textContent = '运行中';
                this.ollamaStatusDisplay.style.background = '#4CAF50';
                this.ollamaStatusDisplay.style.color = 'white';
                if (this.ollamaServiceButton) {
                    this.ollamaServiceButton.textContent = '停止';
                    this.ollamaServiceButton.style.background = '#f44336';
                    this.ollamaServiceButton.disabled = false;
                }
                break;
            case '已停止':
                this.ollamaStatusDisplay.textContent = '已停止';
                this.ollamaStatusDisplay.style.background = '#f44336';
                this.ollamaStatusDisplay.style.color = 'white';
                if (this.ollamaServiceButton) {
                    this.ollamaServiceButton.textContent = '启动';
                    this.ollamaServiceButton.style.background = '#4CAF50';
                    this.ollamaServiceButton.disabled = false;
                }
                break;
            case '启动中':
                this.ollamaStatusDisplay.textContent = '启动中';
                this.ollamaStatusDisplay.style.background = '#FF9800';
                this.ollamaStatusDisplay.style.color = 'white';
                if (this.ollamaServiceButton) {
                    this.ollamaServiceButton.textContent = '启动中';
                    this.ollamaServiceButton.disabled = true;
                }
                break;
            case '停止中':
                this.ollamaStatusDisplay.textContent = '停止中';
                this.ollamaStatusDisplay.style.background = '#FF9800';
                this.ollamaStatusDisplay.style.color = 'white';
                if (this.ollamaServiceButton) {
                    this.ollamaServiceButton.textContent = '停止中';
                    this.ollamaServiceButton.disabled = true;
                }
                break;
            default:
                this.ollamaStatusDisplay.textContent = '检测中';
                this.ollamaStatusDisplay.style.background = '#666';
                this.ollamaStatusDisplay.style.color = '#ccc';
                if (this.ollamaServiceButton) {
                    this.ollamaServiceButton.textContent = '启动';
                    this.ollamaServiceButton.style.background = '#4CAF50';
                    this.ollamaServiceButton.disabled = false;
                }
        }
    }

    async toggleOllamaService() {
        try {
            const currentStatus = this.ollamaStatusDisplay?.textContent || '';
            const action = currentStatus === '运行中' ? 'stop' : 'start';
            
            // 设置操作中状态
            this.updateOllamaServiceStatus(action === 'start' ? '启动中' : '停止中');
            
            const response = await fetch('/ollama_service_control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: action })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message || `${action === 'start' ? '启动' : '停止'}服务成功`, 'success');
                // 延迟检查状态，给服务时间启动/停止
                setTimeout(() => this.checkOllamaServiceStatus(), 2000);
            } else {
                this.showNotification(`操作失败: ${result.message}`, 'error');
                this.checkOllamaServiceStatus();
            }
        } catch (error) {
            console.error('[Ollama Service] 服务控制失败:', error);
            this.showNotification(`服务操作失败: ${error.message}`, 'error');
            this.checkOllamaServiceStatus();
        }
    }

    async unloadOllamaModels() {
        try {
            this.showNotification('正在释放Ollama模型...', 'info');
            
            // 方法1: 调用Ollama API释放所有模型
            try {
                const response = await fetch('http://127.0.0.1:11434/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: '',
                        keep_alive: 0  // 立即释放所有模型
                    })
                });
                
                if (response.ok) {
                    this.showNotification('模型内存释放成功！', 'success');
                    return;
                }
            } catch (directError) {
                console.warn('[Ollama] 直接API调用失败:', directError);
            }

            // 方法2: 通过后端服务控制
            const response = await fetch('/ollama_service_control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'unload' })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification(result.message || '模型内存释放成功！', 'success');
            } else {
                this.showNotification(`释放失败: ${result.message}`, 'warning');
            }
        } catch (error) {
            console.error('[Ollama Service] 释放模型失败:', error);
            this.showNotification(`释放模型失败: ${error.message}`, 'error');
        }
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// 注册节点到ComfyUI
app.registerExtension({
    name: "KontextSuperPrompt",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "KontextSuperPrompt") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) {
                    onNodeCreated.apply(this, arguments);
                }
                
                // 定义隐藏widget的函数
                const hideWidget = (widget) => {
                    if (!widget) return;
                    // 设置widget不占用任何空间
                    widget.computeSize = () => [0, -4];
                    // 标记为隐藏
                    widget.hidden = true;
                    // 移除绘制功能
                    widget.draw = () => {};
                    widget.onDrawBackground = () => {};
                    widget.onDrawForeground = () => {};
                    
                    // 隐藏DOM元素
                    if (widget.element) {
                        widget.element.style.display = 'none';
                    }
                    if (widget.inputEl) {
                        widget.inputEl.style.display = 'none';
                    }
                    
                    // 直接修改widget的y坐标，让它在节点外部（不可见）
                    if (widget.y !== undefined) {
                        widget.y = -1000;
                    }
                };
                
                // 处理现有的widgets
                if (this.widgets && this.widgets.length > 0) {
                    this.widgets.forEach(hideWidget);
                }
                
                // 重写addWidget方法，自动隐藏新添加的widget
                const originalAddWidget = this.addWidget;
                this.addWidget = function(type, name, value, callback, options) {
                    const widget = originalAddWidget.call(this, type, name, value, callback, options);
                    
                    // 检查是否是需要隐藏的widget
                    if (name && (
                        name.includes('_description') ||
                        name.includes('_generated_prompt') ||
                        name.includes('_selected_constraints') ||
                        name.includes('_selected_decoratives') ||
                        name.includes('_operation_type') ||
                        name.includes('api_') ||
                        name.includes('ollama_') ||
                        name === 'description' ||
                        name === 'constraint_prompts' ||
                        name === 'decorative_prompts' ||
                        name === 'generated_prompt' ||
                        name === 'edit_mode' ||
                        name === 'operation_type' ||
                        name === 'selected_layers' ||
                        name === 'auto_generate' ||
                        name === 'tab_mode' ||
                        name === 'unique_id'
                    )) {
                        hideWidget(widget);
                    }
                    
                    return widget;
                };
                
                // 设置节点初始大小
                const nodeWidth = 816; // 1020 * 0.8 - 减小20%
                const nodeHeight = 907; // KSP_NS.constants.EDITOR_SIZE.HEIGHT + 50 + 20%
                this.size = [nodeWidth, nodeHeight];
                
                // 不清空widgets，而是隐藏它们
                if (this.widgets && this.widgets.length > 0) {
                    this.widgets.forEach(widget => {
                        hideWidget(widget);
                        // 额外设置：让widget完全不占用空间
                        widget.computedHeight = -4;
                        widget.computedWidth = 0;
                        // 确保widget不会被绘制
                        Object.defineProperty(widget, 'computeSize', {
                            value: () => [0, -4],
                            writable: false,
                            configurable: false
                        });
                    });
                }
                
                // 重写节点的computeSize方法，始终返回固定大小
                const originalComputeSize = this.computeSize;
                this.computeSize = function() {
                    // 忽略所有widgets，直接返回固定大小
                    return [nodeWidth, nodeHeight];
                };
                
                // 重写节点的size getter/setter
                Object.defineProperty(this, 'size', {
                    get: function() {
                        return this._size || [nodeWidth, nodeHeight];
                    },
                    set: function(value) {
                        this._size = [nodeWidth, nodeHeight]; // 强制固定大小
                    },
                    configurable: true
                });
                
                // 创建超级提示词编辑器实例
                this.kontextSuperPrompt = new KontextSuperPrompt(this);
                
                // 添加配置恢复方法 - 这是关键的数据持久化机制
                const originalOnConfigure = this.onConfigure;
                this.onConfigure = function(info) {
                    if (originalOnConfigure) {
                        originalOnConfigure.apply(this, arguments);
                    }
                    
                    // 恢复widget数据到UI
                    if (this.kontextSuperPrompt && this.widgets && this.widgets.length > 0) {
                        // 延迟恢复，确保UI已初始化
                        setTimeout(() => {
                            this.kontextSuperPrompt.restoreDataFromWidgets();
                            
                            // 恢复当前选项卡显示
                            const currentTab = this.kontextSuperPrompt.currentCategory || 'local';
                            this.kontextSuperPrompt.switchTab(currentTab);
                        }, 100);
                    }
                };
                
                
                
                // 重写onResize方法
                const originalOnResize = this.onResize;
                this.onResize = function(size) {
                    if (originalOnResize) {
                        originalOnResize.apply(this, arguments);
                    }
                    
                    // 确保最小尺寸
                    if (size) {
                        size[0] = Math.max(size[0], nodeWidth);
                        size[1] = Math.max(size[1], nodeHeight);
                    }
                    
                    return size;
                };
                
                // 强制设置节点为不可调整大小（可选）
                this.resizable = false;
                
                // 确保节点立即应用大小
                if (this.setSize) {
                    this.setSize([nodeWidth, nodeHeight]);
                }
                
                // 不需要重写serialize方法，因为widgets数组保留了
                
                // 初始化默认界面，确保即使没有Canvas连接也能正常显示
                setTimeout(() => {
                    if (!this.kontextSuperPrompt.layerInfo || this.kontextSuperPrompt.layerInfo.layers.length === 0) {
                        this.kontextSuperPrompt.updateLayerInfo({ 
                            layers: [], 
                            canvas_size: { width: 512, height: 512 },
                            transform_data: { background: { width: 512, height: 512 } }
                        });
                    }
                }, 100);

                // 监听输入变化
                const onConnectionsChange = this.onConnectionsChange;
                this.onConnectionsChange = function(type, index, connected, link_info) {
                    if (onConnectionsChange) {
                        onConnectionsChange.apply(this, arguments);
                    }
                    
                    
                    // 当layer_info输入连接时，更新图层信息
                    if (type === 1 && index === 0 && connected) { // input, layer_info, connected
                        // 移除循环调用以防止界面不停刷新
                        // setTimeout(() => {
                        //     this.updateLayerInfo();
                        // }, 100);
                        
                        // 移除循环调用以防止界面不停刷新
                        // setTimeout(() => {
                        //     this.kontextSuperPrompt.tryGetLayerInfoFromConnectedNode();
                        // }, 500);
                    } else if (type === 1 && index === 0 && !connected) {
                        // 当断开连接时，显示默认界面
                        this.kontextSuperPrompt.updateLayerInfo({ 
                            layers: [], 
                            canvas_size: { width: 512, height: 512 },
                            transform_data: { background: { width: 512, height: 512 } }
                        });
                    }
                };
                
                // 监听节点执行完成事件
                const originalOnExecuted = this.onExecuted;
                this.onExecuted = function(message) {
                    if (originalOnExecuted) {
                        originalOnExecuted.apply(this, arguments);
                    }
                    
                    
                    // 从执行结果中提取图层信息
                    if (message && message.text) {
                        try {
                            let layerData = null;
                            
                            // message.text可能是字符串数组
                            if (Array.isArray(message.text)) {
                                for (let textItem of message.text) {
                                    if (typeof textItem === 'string' && textItem.includes('layers')) {
                                        layerData = JSON.parse(textItem);
                                        break;
                                    }
                                }
                            } else if (typeof message.text === 'string' && message.text.includes('layers')) {
                                layerData = JSON.parse(message.text);
                            }
                            
                            if (layerData) {
                                this.kontextSuperPrompt.updateLayerInfo(layerData);
                            }
                        } catch (e) {
                            console.warn("[Kontext Super Prompt] 解析图层数据失败:", e);
                        }
                    }
                };
                
                this.updateLayerInfo = function() {
                    
                    if (this.inputs[0] && this.inputs[0].link) {
                        const link = app.graph.links[this.inputs[0].link];
                        
                        if (link) {
                            const sourceNode = app.graph.getNodeById(link.origin_id);
                            
                            if (sourceNode) {
                                
                                // 尝试多种方式获取图层信息
                                let layerInfo = null;
                                
                                // 方式1: 从最近的执行输出获取
                                if (sourceNode.last_output) {
                                    if (sourceNode.last_output.length > 1) {
                                        try {
                                            const layerInfoOutput = sourceNode.last_output[1]; // 第二个输出是layer_info
                                            if (typeof layerInfoOutput === 'string') {
                                                layerInfo = JSON.parse(layerInfoOutput);
                                            } else {
                                                layerInfo = layerInfoOutput;
                                            }
                                        } catch (e) {
                                            console.warn("[Kontext Super Prompt] 解析last_output失败:", e);
                                        }
                                    }
                                }
                                
                                // 方式2: 从properties获取
                                if (!layerInfo && sourceNode.properties && sourceNode.properties.layer_info) {
                                    layerInfo = sourceNode.properties.layer_info;
                                }
                                
                                // 方式3: 从widget值获取（新增）
                                if (!layerInfo && sourceNode.widgets) {
                                    for (let widget of sourceNode.widgets) {
                                        if (widget.name === 'layer_info' && widget.value) {
                                            try {
                                                layerInfo = typeof widget.value === 'string' ? JSON.parse(widget.value) : widget.value;
                                                break;
                                            } catch (e) {
                                                console.warn("[Kontext Super Prompt] 解析widget值失败:", e);
                                            }
                                        }
                                    }
                                }
                                
                                // 方式4: 监听WebSocket消息（新增）
                                this.listenToWebSocketMessages(sourceNode);
                                
                                // 方式5: 从节点的内部数据获取
                                if (!layerInfo && sourceNode.canvasInstance) {
                                    // 直接从canvasInstance获取图层信息，避免递归调用
                                    layerInfo = this.kontextSuperPrompt.extractLayerInfoFromCanvasInstance(sourceNode.canvasInstance);
                                }
                                
                                if (layerInfo) {
                                    this.kontextSuperPrompt.updateLayerInfo(layerInfo);
                                } else {
                                    console.warn("[Kontext Super Prompt] 未找到图层信息，显示默认界面");
                                    // 即使没有图层信息也要确保界面正常显示
                                    this.kontextSuperPrompt.updateLayerInfo({ layers: [], canvas_size: { width: 512, height: 512 } });
                                }
                            }
                        }
                    } else {
                    }
                };
                
                // 监听WebSocket消息以获取实时数据 - 使用管理方法防止泄漏
                this.listenToWebSocketMessages = function(sourceNode) {
                    // 检查是否已经有盘中的kontextSuperPrompt实例
                    if (!this.kontextSuperPrompt) return;
                    
                    // 禁用WebSocket executed事件监听以防止频繁刷新
                    // const executedHandler = (event) => {
                    //     if (event.detail && event.detail.node === sourceNode.id.toString()) {
                    //         if (event.detail.output && event.detail.output.layer_info) {
                    //             let layerInfo = event.detail.output.layer_info;
                    //             if (typeof layerInfo === 'string') {
                    //                 try {
                    //                     layerInfo = JSON.parse(layerInfo);
                    //                 } catch (e) {
                    //                     console.warn("[Kontext Super Prompt] 解析WebSocket数据失败:", e);
                    //                     return;
                    //                 }
                    //             }
                    //             
                    //             // 检查递归防护：只有在非递归状态下才调用updateLayerInfo
                    //             if (!this.kontextSuperPrompt._updateLayerInfoInProgress) {
                    //                 this.kontextSuperPrompt.updateLayerInfo(layerInfo);
                    //             }
                    //         }
                    //     }
                    // };
                    // 
                    // this.kontextSuperPrompt.addAPIEventListenerManaged('executed', executedHandler);
                };
                
                // 重写getExtraMenuOptions以防止显示widget选项
                this.getExtraMenuOptions = function(_, options) {
                    return options;
                };
                
                // 添加节点销毁时的清理机制，防止内存泄漏
                const originalOnRemoved = this.onRemoved;
                this.onRemoved = function() {
                    // 清理KontextSuperPrompt实例的所有资源
                    if (this.kontextSuperPrompt && this.kontextSuperPrompt.cleanup) {
                        this.kontextSuperPrompt.cleanup();
                    }
                    
                    // 调用原始的onRemoved方法
                    if (originalOnRemoved) {
                        originalOnRemoved.call(this);
                    }
                };
                
                // 隐藏widget数据传递方式，不再需要复杂的serialize重写
            };
        }
    }
});

// Export class to global scope for patching
window.KontextSuperPrompt = KontextSuperPrompt;

/**
 * Visual Prompt Editor - 工具函数模块
 * 通用工具函数和常量定义
 */

// 工具映射
export const TOOL_NAMES = {
    'rectangle': { name: 'Rectangle', icon: '▭' },
    'circle': { name: 'Circle', icon: '⭕' },
    'arrow': { name: 'Arrow', icon: '➡️' },
    'freehand': { name: 'Polygon', icon: '🔗' },
    'brush': { name: 'Brush', icon: '🖌️' }
};

// 颜色映射 - 使用标准纯色
export const COLOR_NAMES = {
    '#ff0000': { name: 'Red', icon: '🔴' },
    '#00ff00': { name: 'Green', icon: '🟢' }, 
    '#ffff00': { name: 'Yellow', icon: '🟡' },
    '#0000ff': { name: 'Blue', icon: '🔵' }
};

// 模板分类定义
export const TEMPLATE_CATEGORIES = {
    local: {
        name: '📍 Local Edits',
        description: 'Object-specific editing operations',
        templates: [
            'change_color', 'change_style', 'replace_object', 'add_object',
            'remove_object', 'change_texture', 'change_pose', 'change_expression',
            'change_clothing', 'change_background', 'enhance_quality', 'blur_background',
            'adjust_lighting', 'resize_object', 'enhance_skin_texture'
        ]
    },
    global: {
        name: '🌍 Global Adjustments',
        description: 'Whole image processing operations',
        templates: [
            'global_color_grade', 'global_style_transfer', 'global_brightness_contrast',
            'global_hue_saturation', 'global_sharpen_blur', 'global_noise_reduction',
            'global_enhance', 'global_filter'
        ]
    },
    professional: {
        name: '🔧 Professional Operations',
        description: 'Advanced professional editing tools',
        templates: [
            'geometric_warp', 'perspective_transform', 'lens_distortion', 'global_perspective',
            'content_aware_fill', 'seamless_removal', 'smart_patch',
            'style_blending', 'collage_integration', 'texture_mixing',
            'precision_cutout', 'alpha_composite', 'mask_feathering', 'depth_composite'
        ]
    }
};

// 操作类型模板 - 完整版本，包含36个专业模板
export const OPERATION_TEMPLATES = {
    // 局部编辑模板 (L01-L14)
    'change_color': {
        template: 'Change the color of {object} to {target}',
        description: (target) => `Change the color of {object} to ${target || 'red'}`,
        category: 'local',
        label: 'Change Color'
    },
    'change_style': {
        template: 'Transform {object} into {target} style', 
        description: (target) => `Transform {object} into ${target || 'cartoon style'}`,
        category: 'local',
        label: 'Change Style'
    },
    'replace_object': {
        template: 'Replace {object} with {target}',
        description: (target) => `Replace {object} with ${target || 'a different object'}`,
        category: 'local',
        label: 'Replace Object'
    },
    'add_object': {
        template: 'Add {target} near {object}',
        description: (target) => `Add ${target || 'a new object'} near {object}`,
        category: 'local',
        label: 'Add Object'
    },
    'remove_object': {
        template: 'Remove {object} from the scene',
        description: () => `Remove {object} from the scene`,
        category: 'local',
        label: 'Remove Object'
    },
    'change_texture': {
        template: 'Change the texture of {object} to {target}',
        description: (target) => `Change the texture of {object} to ${target || 'smooth texture'}`,
        category: 'local',
        label: 'Change Texture'
    },
    'change_pose': {
        template: 'Change the pose of {object} to {target}',
        description: (target) => `Change the pose of {object} to ${target || 'standing pose'}`,
        category: 'local',
        label: 'Change Pose'
    },
    'change_expression': {
        template: 'Change the expression of {object} to {target}',
        description: (target) => `Change the expression of {object} to ${target || 'happy expression'}`,
        category: 'local',
        label: 'Change Expression'
    },
    'change_clothing': {
        template: 'Change the clothing of {object} to {target}',
        description: (target) => `Change the clothing of {object} to ${target || 'casual clothes'}`,
        category: 'local',
        label: 'Change Clothing'
    },
    'change_background': {
        template: 'Change the background behind {object} to {target}',
        description: (target) => `Change the background behind {object} to ${target || 'natural landscape'}`,
        category: 'local',
        label: 'Change Background'
    },
    'enhance_quality': {
        template: 'Enhance the quality of {object} with {target} improvement',
        description: (target) => `Enhance the quality of {object} with ${target || 'high definition improvement'}`,
        category: 'local',
        label: 'Enhance Quality'
    },
    'blur_background': {
        template: 'Blur the background around {object} with {target} effect',
        description: (target) => `Blur the background around {object} with ${target || 'soft blur effect'}`,
        category: 'local',
        label: 'Blur Background'
    },
    'adjust_lighting': {
        template: 'Adjust the lighting on {object} to {target}',
        description: (target) => `Adjust the lighting on {object} to ${target || 'natural lighting'}`,
        category: 'local',
        label: 'Adjust Lighting'
    },
    'resize_object': {
        template: 'Resize {object} to {target} scale',
        description: (target) => `Resize {object} to ${target || 'larger scale'}`,
        category: 'local',
        label: 'Resize Object'
    },
    'enhance_skin_texture': {
        template: 'Enhance the skin texture of {object} with {target} improvement',
        description: (target) => `Enhance the skin texture of {object} with ${target || 'natural enhancement'}`,
        category: 'local',
        label: 'Enhance Skin Texture'
    },

    // 全图编辑模板 (G01-G08)
    'global_color_grade': {
        template: 'Apply {target} color grading to the entire image',
        description: (target) => `Apply ${target || 'cinematic color grading'} to the entire image`,
        category: 'global',
        label: 'Color Grading'
    },
    'global_style_transfer': {
        template: 'Transform the entire image to {target} style',
        description: (target) => `Transform the entire image to ${target || 'oil painting style'}`,
        category: 'global',
        label: 'Style Transfer'
    },
    'global_brightness_contrast': {
        template: 'Adjust the brightness and contrast of the entire image to {target}',
        description: (target) => `Adjust the brightness and contrast of the entire image to ${target || 'high contrast'}`,
        category: 'global',
        label: 'Brightness & Contrast'
    },
    'global_hue_saturation': {
        template: 'Adjust the hue and saturation of the entire image to {target}',
        description: (target) => `Adjust the hue and saturation of the entire image to ${target || 'vibrant colors'}`,
        category: 'global',
        label: 'Hue & Saturation'
    },
    'global_sharpen_blur': {
        template: 'Apply {target} sharpening or blur to the entire image',
        description: (target) => `Apply ${target || 'sharpening'} to the entire image`,
        category: 'global',
        label: 'Sharpen/Blur'
    },
    'global_noise_reduction': {
        template: 'Apply {target} noise reduction to the entire image',
        description: (target) => `Apply ${target || 'noise reduction'} to the entire image`,
        category: 'global',
        label: 'Noise Reduction'
    },
    'global_enhance': {
        template: 'Enhance the entire image with {target} improvement',
        description: (target) => `Enhance the entire image with ${target || 'quality improvement'}`,
        category: 'global',
        label: 'Global Enhance'
    },
    'global_filter': {
        template: 'Apply {target} filter effect to the entire image',
        description: (target) => `Apply ${target || 'vintage filter'} effect to the entire image`,
        category: 'global',
        label: 'Filter Effect'
    },

    // 专业操作模板 (P01-P14)
    'geometric_warp': {
        template: 'Apply {target} geometric warp transformation to {object}',
        description: (target) => `Apply ${target || 'perspective warp'} geometric transformation to {object}`,
        category: 'professional',
        label: 'Geometric Warp'
    },
    'perspective_transform': {
        template: 'Transform {object} perspective to {target} viewpoint',
        description: (target) => `Transform {object} perspective to ${target || 'frontal viewpoint'}`,
        category: 'professional',
        label: 'Perspective Transform'
    },
    'lens_distortion': {
        template: 'Apply {target} lens distortion effect to {object}',
        description: (target) => `Apply ${target || 'barrel distortion'} lens effect to {object}`,
        category: 'professional',
        label: 'Lens Distortion'
    },
    'global_perspective': {
        template: 'Apply {target} perspective correction to the entire image',
        description: (target) => `Apply ${target || 'keystone correction'} perspective correction to the entire image`,
        category: 'professional',
        label: 'Global Perspective'
    },
    'content_aware_fill': {
        template: 'Remove {object} and intelligently fill with {target} content',
        description: (target) => `Remove {object} and intelligently fill with ${target || 'surrounding content'}`,
        category: 'professional',
        label: 'Content-Aware Fill'
    },
    'seamless_removal': {
        template: 'Seamlessly remove {object} maintaining {target} background continuity',
        description: (target) => `Seamlessly remove {object} maintaining ${target || 'background continuity'}`,
        category: 'professional',
        label: 'Seamless Removal'
    },
    'smart_patch': {
        template: 'Patch {object} area with {target} using content-aware technology',
        description: (target) => `Patch {object} area with ${target || 'smart content'} using content-aware technology`,
        category: 'professional',
        label: 'Smart Patch'
    },
    'style_blending': {
        template: 'Blend {object} style with {target} artistic elements',
        description: (target) => `Blend {object} style with ${target || 'artistic elements'}`,
        category: 'professional',
        label: 'Style Blending'
    },
    'collage_integration': {
        template: 'Integrate {object} into {target} collage composition',
        description: (target) => `Integrate {object} into ${target || 'collage composition'}`,
        category: 'professional',
        label: 'Collage Integration'
    },
    'texture_mixing': {
        template: 'Mix {object} texture with {target} material properties',
        description: (target) => `Mix {object} texture with ${target || 'material properties'}`,
        category: 'professional',
        label: 'Texture Mixing'
    },
    'precision_cutout': {
        template: 'Precisely cut out {object} with {target} edge refinement',
        description: (target) => `Precisely cut out {object} with ${target || 'edge refinement'}`,
        category: 'professional',
        label: 'Precision Cutout'
    },
    'alpha_composite': {
        template: 'Composite {object} onto {target} with alpha blending',
        description: (target) => `Composite {object} onto ${target || 'new background'} with alpha blending`,
        category: 'professional',
        label: 'Alpha Composite'
    },
    'mask_feathering': {
        template: 'Apply {target} feathering to {object} mask edges',
        description: (target) => `Apply ${target || 'soft feathering'} to {object} mask edges`,
        category: 'professional',
        label: 'Mask Feathering'
    },
    'depth_composite': {
        template: 'Composite {object} with {target} depth-aware blending',
        description: (target) => `Composite {object} with ${target || 'depth-aware blending'}`,
        category: 'professional',
        label: 'Depth Composite'
    },

    'custom': {
        template: '{target}',
        description: (target) => target || 'Apply custom modification to the selected region',
        category: 'local',
        label: 'Custom Operation'
    }
};

// 约束性提示词库 - 按操作类型分类
export const CONSTRAINT_PROMPTS = {
    'change_color': ['preserving original texture details', 'maintaining material properties', 'avoiding color bleeding'],
    'change_style': ['maintaining structural integrity', 'preserving essential details', 'avoiding over-stylization'],
    'replace_object': ['matching perspective angles', 'consistent lighting direction', 'maintaining scale proportions'],
    'add_object': ['respecting spatial relationships', 'maintaining proper scale', 'avoiding visual conflicts'],
    'remove_object': ['preserving background continuity', 'maintaining visual coherence', 'avoiding obvious gaps'],
    'change_texture': ['preserving surface geometry', 'maintaining lighting interaction', 'avoiding pattern distortion'],
    'change_pose': ['ensuring anatomical correctness', 'maintaining joint constraints', 'preserving muscle definition'],
    'change_expression': ['maintaining facial symmetry', 'preserving skin texture', 'avoiding unnatural distortion'],
    'change_clothing': ['ensuring proper fit', 'simulating fabric physics', 'maintaining style consistency'],
    'change_background': ['maintaining depth relationships', 'preserving atmospheric perspective', 'matching lighting conditions'],
    'enhance_quality': ['avoiding over-sharpening artifacts', 'preserving natural appearance', 'maintaining tonal balance'],
    'blur_background': ['preserving subject sharpness', 'maintaining edge definition', 'avoiding halo effects'],
    'adjust_lighting': ['preserving form definition', 'maintaining shadow detail', 'avoiding blown highlights'],
    'resize_object': ['maintaining image quality', 'preserving detail resolution', 'avoiding scaling artifacts'],
    'enhance_skin_texture': ['preserving natural skin tone', 'maintaining pore authenticity', 'avoiding over-smoothing artifacts'],
    'global_color_grade': ['preserving skin tone accuracy', 'maintaining color relationships', 'avoiding posterization'],
    'global_style_transfer': ['preserving essential details', 'maintaining structural integrity', 'avoiding over-stylization'],
    'global_brightness_contrast': ['avoiding highlight clipping', 'preserving shadow detail', 'maintaining tonal balance'],
    'global_hue_saturation': ['preserving natural color relationships', 'avoiding oversaturation', 'maintaining color accuracy'],
    'global_sharpen_blur': ['maintaining edge definition', 'controlling noise amplification', 'preserving fine details'],
    'global_noise_reduction': ['preserving texture details', 'avoiding over-smoothing', 'maintaining edge sharpness'],
    'global_enhance': ['optimizing dynamic range', 'maintaining natural appearance', 'avoiding over-processing'],
    'global_filter': ['ensuring consistent application', 'preserving image integrity', 'maintaining detail clarity'],
    'geometric_warp': ['preserving straight lines where appropriate', 'maintaining architectural integrity', 'avoiding excessive distortion'],
    'perspective_transform': ['ensuring proper vanishing points', 'maintaining realistic proportions', 'preserving structural relationships'],
    'lens_distortion': ['simulating authentic optical characteristics', 'avoiding unnatural deformation', 'maintaining image quality'],
    'global_perspective': ['straightening vertical lines', 'maintaining natural viewing angles', 'preserving composition balance'],
    'content_aware_fill': ['seamlessly blending textures', 'maintaining contextual continuity', 'preserving lighting patterns'],
    'seamless_removal': ['preserving lighting patterns', 'maintaining surface characteristics', 'ensuring visual coherence'],
    'smart_patch': ['matching surrounding patterns', 'maintaining visual coherence', 'preserving texture quality'],
    'style_blending': ['harmonizing color palettes', 'preserving distinctive characteristics', 'maintaining artistic integrity'],
    'collage_integration': ['balancing visual weights', 'creating unified artistic narrative', 'maintaining composition flow'],
    'texture_mixing': ['creating realistic surface interactions', 'maintaining tactile believability', 'preserving material authenticity'],
    'precision_cutout': ['achieving pixel-perfect boundaries', 'maintaining natural edge transitions', 'preserving fine details'],
    'alpha_composite': ['managing transparency interactions', 'preserving color accuracy', 'maintaining blending precision'],
    'mask_feathering': ['creating soft natural transitions', 'maintaining selection accuracy', 'avoiding harsh edges'],
    'depth_composite': ['respecting spatial relationships', 'maintaining atmospheric perspective', 'preserving depth cues']
};

// 修饰性提示词库 - 按操作类型分类
export const DECORATIVE_PROMPTS = {
    'change_color': ['smooth color transition', 'natural blending', 'vibrant yet realistic tones', 'professional color grading'],
    'change_style': ['artistic excellence', 'seamless style adaptation', 'visually striking', 'sophisticated aesthetic'],
    'replace_object': ['seamless integration', 'photorealistic replacement', 'perfect visual harmony', 'natural placement'],
    'add_object': ['natural positioning', 'environmental harmony', 'balanced composition', 'contextually appropriate'],
    'remove_object': ['invisible removal', 'seamless background reconstruction', 'natural scene flow', 'perfect cleanup'],
    'change_texture': ['realistic material properties', 'detailed surface quality', 'tactile authenticity', 'professional texturing'],
    'change_pose': ['natural body mechanics', 'dynamic posing', 'graceful movement', 'lifelike positioning'],
    'change_expression': ['emotional authenticity', 'expressive naturalness', 'subtle facial nuances', 'captivating presence'],
    'change_clothing': ['fashionable appearance', 'elegant draping', 'realistic fabric behavior', 'stylistic harmony'],
    'change_background': ['stunning backdrop', 'environmental beauty', 'atmospheric depth', 'cinematic composition'],
    'enhance_quality': ['crystal clear details', 'professional quality', 'enhanced clarity', 'masterpiece-level refinement'],
    'blur_background': ['beautiful bokeh', 'artistic depth of field', 'professional portrait look', 'elegant focus'],
    'adjust_lighting': ['dramatic illumination', 'perfect lighting balance', 'dimensional modeling', 'cinematic mood'],
    'resize_object': ['perfect proportions', 'seamless scaling', 'optimal size balance', 'visually harmonious'],
    'enhance_skin_texture': ['realistic skin detail', 'natural pore structure', 'healthy skin appearance', 'photorealistic texture'],
    'global_color_grade': ['cinematic color palette', 'professional grading', 'rich tonal depth', 'visually stunning result'],
    'global_style_transfer': ['artistic masterpiece', 'seamless style adaptation', 'visually captivating', 'sophisticated aesthetic'],
    'global_brightness_contrast': ['perfect exposure balance', 'dramatic contrast', 'enhanced dynamic range', 'professional quality'],
    'global_hue_saturation': ['vibrant yet natural colors', 'harmonious palette', 'rich saturation', 'color-accurate result'],
    'global_sharpen_blur': ['crystal clear sharpness', 'artistic blur effect', 'enhanced clarity', 'professional processing'],
    'global_noise_reduction': ['clean smooth result', 'artifact-free image', 'pristine quality', 'professional cleanup'],
    'global_enhance': ['stunning visual impact', 'enhanced beauty', 'masterpiece quality', 'professional refinement'],
    'global_filter': ['artistic filter effect', 'stylistic enhancement', 'creative transformation', 'visually appealing'],
    'geometric_warp': ['precise geometric transformation', 'professional correction', 'seamless warp effect', 'architectural accuracy'],
    'perspective_transform': ['perfect perspective alignment', 'natural viewpoint shift', 'dimensional accuracy', 'spatial harmony'],
    'lens_distortion': ['realistic lens effect', 'professional optical simulation', 'authentic distortion', 'artistic enhancement'],
    'global_perspective': ['architectural perfection', 'professional correction', 'balanced perspective', 'structural accuracy'],
    'content_aware_fill': ['invisible object removal', 'intelligent reconstruction', 'seamless background fill', 'natural scene flow'],
    'seamless_removal': ['flawless removal', 'perfect background reconstruction', 'invisible cleanup', 'natural continuity'],
    'smart_patch': ['intelligent pattern matching', 'seamless patch integration', 'professional repair', 'flawless reconstruction'],
    'style_blending': ['masterful style fusion', 'artistic harmony', 'creative blending', 'sophisticated aesthetic'],
    'collage_integration': ['artistic collage effect', 'creative composition', 'visual harmony', 'unified aesthetic'],
    'texture_mixing': ['realistic material blend', 'authentic texture fusion', 'professional surface quality', 'tactile realism'],
    'precision_cutout': ['precision cutting', 'flawless edge quality', 'professional cutout', 'masterful selection'],
    'alpha_composite': ['perfect alpha blending', 'seamless transparency', 'professional compositing', 'flawless integration'],
    'mask_feathering': ['smooth edge transitions', 'natural feathering', 'professional softening', 'elegant blending'],
    'depth_composite': ['realistic depth integration', 'dimensional accuracy', 'spatial harmony', 'atmospheric realism']
};

/**
 * 根据分类获取模板选项
 */
export function getTemplatesByCategory(category) {
    if (!TEMPLATE_CATEGORIES[category]) {
        return [];
    }
    
    return TEMPLATE_CATEGORIES[category].templates.map(templateId => {
        const template = OPERATION_TEMPLATES[templateId];
        return {
            id: templateId,
            label: template?.label || templateId,
            template: template
        };
    });
}

/**
 * 更新操作类型选择器
 */
export function updateOperationTypeSelect(selectElement, category) {
    if (!selectElement) return;
    
    // 清空现有选项
    selectElement.innerHTML = '';
    
    // 获取分类下的模板
    const templates = getTemplatesByCategory(category);
    
    // 添加选项
    templates.forEach(({ id, label }) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = label;
        selectElement.appendChild(option);
    });
    
    // 添加自定义选项
    if (category === 'local') {
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = 'Custom Operation';
        selectElement.appendChild(customOption);
    }
}

/**
 * 获取画布坐标
 */
export function getCanvasCoordinates(e, element) {
    const rect = element.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

/**
 * 创建SVG元素
 */
export function createSVGElement(type, attributes = {}) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', type);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    return element;
}

/**
 * 生成唯一ID
 */
export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 通知显示函数
 */
export class KontextUtils {
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 50%; left: 50%; z-index: 50000;
            transform: translate(-50%, -50%);
            padding: 20px 30px; border-radius: 12px; color: white;
            font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;
            box-shadow: 0 12px 24px rgba(0,0,0,0.4);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            border: 3px solid #fff; text-align: center; min-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
        
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

/**
 * 计算两点距离
 */
export function calculateDistance(point1, point2) {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

/**
 * 限制数值范围
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * 检查点是否在矩形内
 */
export function isPointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.width &&
           point.y >= rect.y && point.y <= rect.y + rect.height;
}

/**
 * 将鼠标坐标转换为SVG viewBox坐标 - 避免transform累积问题
 */
export function mouseToSVGCoordinates(e, modal) {
    const drawingLayer = modal.querySelector('#drawing-layer');
    const svg = drawingLayer ? drawingLayer.querySelector('svg') : null;
    
    if (!svg) return { x: 0, y: 0 };
    
    // 获取多个容器的位置信息进行对比
    const canvasContainer = modal.querySelector('#canvas-container');
    const zoomContainer = modal.querySelector('#zoom-container');
    const imageCanvas = modal.querySelector('#image-canvas');
    const image = modal.querySelector('#vpe-main-image');
    
    if (!canvasContainer) return { x: 0, y: 0 };
    
    // 获取各个容器的边界框
    const canvasContainerRect = canvasContainer.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const drawingLayerRect = drawingLayer.getBoundingClientRect();
    
    console.log('🔍 容器位置对比:', {
        mouse: { x: e.clientX, y: e.clientY },
        canvasContainer: { left: canvasContainerRect.left, top: canvasContainerRect.top, width: canvasContainerRect.width, height: canvasContainerRect.height },
        svgRect: { left: svgRect.left, top: svgRect.top, width: svgRect.width, height: svgRect.height },
        drawingLayer: { left: drawingLayerRect.left, top: drawingLayerRect.top, width: drawingLayerRect.width, height: drawingLayerRect.height }
    });
    
    if (image) {
        const imageRect = image.getBoundingClientRect();
        console.log('🖼️ 图片位置:', { left: imageRect.left, top: imageRect.top, width: imageRect.width, height: imageRect.height });
    }
    
    // 使用SVG自身的边界框进行坐标转换
    const svgRelativeX = e.clientX - svgRect.left;
    const svgRelativeY = e.clientY - svgRect.top;
    
    // 计算相对位置的比例 (0-1)
    const scaleX = svgRelativeX / svgRect.width;
    const scaleY = svgRelativeY / svgRect.height;
    
    // 映射到SVG viewBox坐标系
    const svgX = scaleX * svg.viewBox.baseVal.width;
    const svgY = scaleY * svg.viewBox.baseVal.height;
    
    console.log('🖱️ SVG坐标转换:', {
        svgRelative: { x: svgRelativeX, y: svgRelativeY },
        scale: { x: scaleX, y: scaleY },
        viewBox: { width: svg.viewBox.baseVal.width, height: svg.viewBox.baseVal.height },
        final: { x: svgX, y: svgY }
    });
    
    return { x: svgX, y: svgY };
}
import { t } from './visual_prompt_editor_i18n.js';
import { getCoordinateSystem } from './shared/coordinate_system.js';

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

// 模板分类定义 - Flux Kontext优化版 (4大分类)
export const TEMPLATE_CATEGORIES = {
    global: {
        name: '🌍 全局编辑',
        description: 'Whole image processing operations',
        templates: [
            'global_color_grade', 'global_style_transfer', 'global_brightness_contrast',
            'global_hue_saturation', 'global_sharpen_blur', 'global_noise_reduction',
            'global_enhance', 'global_filter', 'character_age', 'detail_enhance',
            'realism_enhance', 'camera_operation',
            // 新增：来自kontext-presets的全局操作
            'relight_scene', 'colorize_image', 'teleport_context'
        ]
    },
    text: {
        name: '📝 文字编辑',
        description: 'Text editing and manipulation operations',
        templates: [
            'text_add', 'text_remove', 'text_edit', 'text_resize', 'object_combine'
        ]
    },
    professional: {
        name: '🔧 专业操作',
        description: 'Advanced professional editing tools',
        templates: [
            'geometric_warp', 'perspective_transform', 'lens_distortion', 'global_perspective',
            'content_aware_fill', 'seamless_removal', 'smart_patch',
            'style_blending', 'collage_integration', 'texture_mixing',
            'precision_cutout', 'alpha_composite', 'mask_feathering', 'depth_composite',
            // 新增：来自kontext-presets的专业操作
            'professional_product'
        ]
    }
};

// 操作类型模板 - Flux Kontext优化版，包含49个专业模板
export const OPERATION_TEMPLATES = {
    // 局部编辑模板 (L01-L18) - 🔴 Flux Kontext优化
    'change_color': {
        template: 'make {object} {target}',  // 🔴 官方高频动词"make"替代"change"
        description: (target) => `make {object} ${target || 'red'}`,
        category: 'local',
        label: 'Change Color'
    },
    'change_style': {
        template: 'turn {object} into {target} style',  // 🔴 官方标准句式"turn into"
        description: (target) => `turn {object} into ${target || 'cartoon style'}`,
        category: 'local',
        label: 'Change Style'
    },
    'replace_object': {
        template: 'replace {object} with {target}',  // 🔴 采用官方"replace with"标准格式
        description: (target) => `replace {object} with ${target || 'a different object'}`,
        category: 'local',
        label: 'Replace Object'
    },
    'add_object': {
        template: 'add {target} to {object}',  // 🔴 官方"add to"介词结构
        description: (target) => `add ${target || 'a new object'} to {object}`,
        category: 'local',
        label: 'Add Object'
    },
    'remove_object': {
        template: 'remove the {object}',  // 🔴 保持官方"remove the"定冠词格式
        description: () => `remove the {object}`,
        category: 'local',
        label: 'Remove Object'
    },
    'change_texture': {
        template: 'change {object} texture to {target}',  // 🔴 优化为官方"change to"句式
        description: (target) => `change {object} texture to ${target || 'smooth texture'}`,
        category: 'local',
        label: 'Change Texture'
    },
    'change_pose': {
        template: 'make {object} {target} pose',  // 🔴 采用官方"make pose"简洁表达
        description: (target) => `make {object} ${target || 'standing'} pose`,
        category: 'local',
        label: 'Change Pose'
    },
    'change_expression': {
        template: 'give {object} {target} expression',  // 🔴 使用官方高频动词"give"
        description: (target) => `give {object} ${target || 'happy'} expression`,
        category: 'local',
        label: 'Change Expression'
    },
    'change_clothing': {
        template: 'change {object} clothing to {target}',  // 🔴 采用官方服装编辑标准句式
        description: (target) => `change {object} clothing to ${target || 'casual clothes'}`,
        category: 'local',
        label: 'Change Clothing'
    },
    'change_background': {
        template: 'change the background to {target}',  // 🔴 使用官方背景编辑标准格式
        description: (target) => `change the background to ${target || 'natural landscape'}`,
        category: 'local',
        label: 'Change Background'
    },
    'enhance_quality': {
        template: 'enhance {object} quality',  // 🔴 采用官方质量提升简洁表达
        description: (target) => `enhance {object} quality`,
        category: 'local',
        label: 'Enhance Quality'
    },
    'blur_background': {
        template: 'blur the background behind {object}',  // 🔴 使用官方背景模糊标准句式
        description: (target) => `blur the background behind {object}`,
        category: 'local',
        label: 'Blur Background'
    },
    'adjust_lighting': {
        template: 'adjust lighting on {object}',  // 🔴 采用官方光照调整标准格式
        description: (target) => `adjust lighting on {object}`,
        category: 'local',
        label: 'Adjust Lighting'
    },
    'resize_object': {
        template: 'make {object} {target} size',  // 🔴 使用官方尺寸调整句式
        description: (target) => `make {object} ${target || 'larger'} size`,
        category: 'local',
        label: 'Resize Object'
    },
    'enhance_skin_texture': {
        template: 'enhance {object} skin texture',  // 🔴 采用官方皮肤纹理专业表达
        description: (target) => `enhance {object} skin texture`,
        category: 'local',
        label: 'Enhance Skin Texture'
    },
    // 🔴 新增局部编辑模板 (L16-L18)
    'character_expression': {
        template: 'make the person {target}',  // 🔴 新增：基于官方193次角色表情指令
        description: (target) => `make the person ${target || 'smile'}`,
        category: 'local',
        label: 'Character Expression'
    },
    'character_hair': {
        template: 'give the person {target} hair',  // 🔴 新增：基于官方87次发型编辑指令
        description: (target) => `give the person ${target || 'blonde'} hair`,
        category: 'local',
        label: 'Character Hair'
    },
    'character_accessories': {
        template: 'give the person {target}',  // 🔴 新增：基于官方65次配饰指令
        description: (target) => `give the person ${target || 'glasses'}`,
        category: 'local',
        label: 'Character Accessories'
    },

    // 全局编辑模板 (G01-G12) - 🔴 Flux Kontext优化
    'global_color_grade': {
        template: 'apply {target} color grading to entire image',  // 🔴 采用官方"apply to"专业术语
        description: (target) => `apply ${target || 'cinematic'} color grading to entire image`,
        category: 'global',
        label: 'Color Grading'
    },
    'global_style_transfer': {
        template: 'turn entire image into {target} style',  // 🔴 使用官方"turn into"全图转换
        description: (target) => `turn entire image into ${target || 'vintage'} style`,
        category: 'global',
        label: 'Style Transfer'
    },
    'global_brightness_contrast': {
        template: 'adjust image brightness and contrast to {target}',  // 🔴 采用官方"adjust to"格式
        description: (target) => `adjust image brightness and contrast to ${target || 'high'}`,
        category: 'global',
        label: 'Brightness & Contrast'
    },
    'global_hue_saturation': {
        template: 'change image hue and saturation to {target}',  // 🔴 使用官方"change to"色彩术语
        description: (target) => `change image hue and saturation to ${target || 'vibrant'}`,
        category: 'global',
        label: 'Hue & Saturation'
    },
    'global_sharpen_blur': {
        template: 'apply {target} sharpening to entire image',  // 🔴 采用官方"apply"锐化表达
        description: (target) => `apply ${target || 'strong'} sharpening to entire image`,
        category: 'global',
        label: 'Sharpen/Blur'
    },
    'global_noise_reduction': {
        template: 'reduce noise in entire image',  // 🔴 使用官方降噪简洁表达
        description: (target) => `reduce noise in entire image`,
        category: 'global',
        label: 'Noise Reduction'
    },
    'global_enhance': {
        template: 'enhance entire image quality',  // 🔴 采用官方质量增强术语
        description: (target) => `enhance entire image quality`,
        category: 'global',
        label: 'Global Enhance'
    },
    'global_filter': {
        template: 'apply {target} filter to entire image',  // 🔴 使用官方滤镜标准句式
        description: (target) => `apply ${target || 'sepia'} filter to entire image`,
        category: 'global',
        label: 'Filter Effect'
    },
    // 🔴 新增全局编辑模板 (G09-G12)
    'character_age': {
        template: 'make the person look {target}',  // 🔴 新增：基于官方43次年龄编辑指令
        description: (target) => `make the person look ${target || 'older'}`,
        category: 'global',
        label: 'Character Age'
    },
    'detail_enhance': {
        template: 'add more details to {object}',  // 🔴 新增：基于官方56次细节增强指令
        description: (target) => `add more details to ${target || 'the background'}`,
        category: 'global',
        label: 'Detail Enhance'
    },
    'realism_enhance': {
        template: 'make {object} more realistic',  // 🔴 新增：基于官方34次真实感指令
        description: (target) => `make ${target || 'the portrait'} more realistic`,
        category: 'global',
        label: 'Realism Enhance'
    },
    'camera_operation': {
        template: 'zoom out and show {target}',  // 🔴 新增：基于官方28次镜头操作指令
        description: (target) => `zoom out and show ${target || 'full body'}`,
        category: 'global',
        label: 'Camera Operation'
    },

    // 文字编辑模板 (T01-T05) - 🔴 全新类型
    'text_add': {
        template: 'add text saying "{target}"',  // 🔴 新增：基于官方92次text相关指令
        description: (target) => `add text saying "${target || 'Hello World'}"`,
        category: 'text',
        label: 'Add Text'
    },
    'text_remove': {
        template: 'remove the text',  // 🔴 新增：基于官方48次text删除指令
        description: (target) => `remove the text`,
        category: 'text',
        label: 'Remove Text'
    },
    'text_edit': {
        template: 'change the text to "{target}"',  // 🔴 新增：基于官方31次text编辑指令
        description: (target) => `change the text to "${target || 'Welcome'}"`,
        category: 'text',
        label: 'Edit Text'
    },
    'text_resize': {
        template: 'make the text {target} size',  // 🔴 新增：基于官方18次text大小指令
        description: (target) => `make the text ${target || 'bigger'} size`,
        category: 'text',
        label: 'Resize Text'
    },
    'object_combine': {
        template: 'combine {object} with {target}',  // 🔴 新增：基于官方21次组合指令
        description: (target) => `combine {object} with ${target || 'the background'}`,
        category: 'text',
        label: 'Object Combine'
    },

    // 专业操作模板 (P01-P14) - 🔴 Flux Kontext优化
    'geometric_warp': {
        template: 'apply {target} geometric transformation to {object}',  // 🔴 采用官方"apply transformation"术语
        description: (target) => `apply ${target || 'perspective'} geometric transformation to {object}`,
        category: 'professional',
        label: 'Geometric Warp'
    },
    'perspective_transform': {
        template: 'transform {object} perspective to {target}',  // 🔴 使用官方"transform to"格式
        description: (target) => `transform {object} perspective to ${target || 'frontal'}`,
        category: 'professional',
        label: 'Perspective Transform'
    },
    'lens_distortion': {
        template: 'apply {target} lens distortion to {object}',  // 🔴 采用官方镜头畸变专业术语
        description: (target) => `apply ${target || 'barrel'} lens distortion to {object}`,
        category: 'professional',
        label: 'Lens Distortion'
    },
    'global_perspective': {
        template: 'correct perspective of entire image',  // 🔴 使用官方透视校正表达
        description: (target) => `correct perspective of entire image`,
        category: 'professional',
        label: 'Global Perspective'
    },
    'content_aware_fill': {
        template: 'remove {object} and fill with surrounding content',  // 🔴 采用官方"remove and fill"句式
        description: (target) => `remove {object} and fill with surrounding content`,
        category: 'professional',
        label: 'Content-Aware Fill'
    },
    'seamless_removal': {
        template: 'seamlessly remove {object}',  // 🔴 使用官方"seamlessly remove"表达
        description: (target) => `seamlessly remove {object}`,
        category: 'professional',
        label: 'Seamless Removal'
    },
    'smart_patch': {
        template: 'patch {object} area with smart content',  // 🔴 采用官方"patch with"术语
        description: (target) => `patch {object} area with smart content`,
        category: 'professional',
        label: 'Smart Patch'
    },
    'style_blending': {
        template: 'blend {object} with {target} style',  // 🔴 使用官方"blend with"句式
        description: (target) => `blend {object} with ${target || 'oil painting'} style`,
        category: 'professional',
        label: 'Style Blending'
    },
    'collage_integration': {
        template: 'integrate {object} into {target} composition',  // 🔴 采用官方"integrate into"表达
        description: (target) => `integrate {object} into ${target || 'artistic'} composition`,
        category: 'professional',
        label: 'Collage Integration'
    },
    'texture_mixing': {
        template: 'mix {object} texture with {target}',  // 🔴 使用官方"mix with"简洁格式
        description: (target) => `mix {object} texture with ${target || 'metal'}`,
        category: 'professional',
        label: 'Texture Mixing'
    },
    'precision_cutout': {
        template: 'precisely cut out {object}',  // 🔴 采用官方"cut out"标准术语
        description: (target) => `precisely cut out {object}`,
        category: 'professional',
        label: 'Precision Cutout'
    },
    'alpha_composite': {
        template: 'composite {object} onto {target}',  // 🔴 使用官方"composite onto"表达
        description: (target) => `composite {object} onto ${target || 'new background'}`,
        category: 'professional',
        label: 'Alpha Composite'
    },
    'mask_feathering': {
        template: 'apply soft feathering to {object} edges',  // 🔴 采用官方羽化专业术语
        description: (target) => `apply soft feathering to {object} edges`,
        category: 'professional',
        label: 'Mask Feathering'
    },
    'depth_composite': {
        template: 'composite {object} with depth blending',  // 🔴 使用官方深度合成术语
        description: (target) => `composite {object} with depth blending`,
        category: 'professional',
        label: 'Depth Composite'
    },

    // 新增：来自kontext-presets的操作模板
    'zoom_focus': {
        template: 'zoom {target} of {object}',
        description: (target) => `zoom ${target || 'close-up'} of {object}`,
        category: 'local',
        label: 'Zoom Focus'
    },
    'stylize_local': {
        template: 'stylize {object} into {target} style',
        description: (target) => `stylize {object} into ${target || 'artistic'} style`,
        category: 'local',
        label: 'Stylize Local'
    },
    'relight_scene': {
        template: 'relight the scene with {target}',
        description: (target) => `relight the scene with ${target || 'professional lighting'}`,
        category: 'global',
        label: 'Relight Scene'
    },
    'colorize_image': {
        template: 'colorize the image with {target}',
        description: (target) => `colorize the image with ${target || 'natural colors'}`,
        category: 'global',
        label: 'Colorize Image'
    },
    'teleport_context': {
        template: 'teleport to {target} context',
        description: (target) => `teleport to ${target || 'different location'} context`,
        category: 'global',
        label: 'Teleport Context'
    },
    'professional_product': {
        template: 'create professional product photo with {target}',
        description: (target) => `create professional product photo with ${target || 'catalog quality'}`,
        category: 'professional',
        label: 'Professional Product'
    },
    'custom': {
        template: '{target}',
        description: (target) => target || 'Apply custom modification to the selected region',
        category: 'local',
        label: 'Custom Operation'
    }
};

// 约束性提示词库 - Flux Kontext整合版，支持49个模板
export const CONSTRAINT_PROMPTS = {
    // 局部编辑约束性提示词 (L01-L18)
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
    // 🔴 新增局部编辑约束性提示词
    'character_expression': ['maintaining facial symmetry', 'preserving natural emotion', 'avoiding forced expressions'],
    'character_hair': ['ensuring realistic hair physics', 'maintaining hair texture quality', 'avoiding unnatural hair placement'],
    'character_accessories': ['ensuring proper fit and scale', 'maintaining realistic positioning', 'avoiding visual conflicts'],
    
    // 全局编辑约束性提示词 (G01-G12)
    'global_color_grade': ['preserving skin tone accuracy', 'maintaining color relationships', 'avoiding posterization'],
    'global_style_transfer': ['preserving essential details', 'maintaining structural integrity', 'avoiding over-stylization'],
    'global_brightness_contrast': ['avoiding highlight clipping', 'preserving shadow detail', 'maintaining tonal balance'],
    'global_hue_saturation': ['preserving natural color relationships', 'avoiding oversaturation', 'maintaining color accuracy'],
    'global_sharpen_blur': ['maintaining edge definition', 'controlling noise amplification', 'preserving fine details'],
    'global_noise_reduction': ['preserving texture details', 'avoiding over-smoothing', 'maintaining edge sharpness'],
    'global_enhance': ['optimizing dynamic range', 'maintaining natural appearance', 'avoiding over-processing'],
    'global_filter': ['ensuring consistent application', 'preserving image integrity', 'maintaining detail clarity'],
    // 🔴 新增全局编辑约束性提示词
    'character_age': ['maintaining facial structure', 'preserving identity characteristics', 'avoiding unrealistic aging'],
    'detail_enhance': ['maintaining image balance', 'avoiding over-enhancement', 'preserving natural appearance'],
    'realism_enhance': ['maintaining artistic intent', 'avoiding uncanny valley effects', 'preserving style consistency'],
    'camera_operation': ['maintaining subject focus', 'preserving composition balance', 'avoiding distortion'],
    
    // 文字编辑约束性提示词 (T01-T05) - 🔴 全新类型
    'text_add': ['ensuring readable typography', 'maintaining text clarity', 'avoiding visual interference'],
    'text_remove': ['preserving background integrity', 'maintaining visual coherence', 'avoiding obvious gaps'],
    'text_edit': ['maintaining font consistency', 'preserving text formatting', 'ensuring readability'],
    'text_resize': ['maintaining text proportions', 'preserving readability', 'avoiding distortion'],
    'object_combine': ['ensuring seamless integration', 'maintaining visual harmony', 'preserving individual characteristics'],
    
    // 专业操作约束性提示词 (P01-P14)
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
    'depth_composite': ['respecting spatial relationships', 'maintaining atmospheric perspective', 'preserving depth cues'],
    // 新增：来自kontext-presets的约束性提示词
    'zoom_focus': ['maintaining subject clarity', 'preserving focus quality', 'avoiding distortion artifacts'],
    'stylize_local': ['preserving essential details', 'maintaining structural integrity', 'avoiding over-stylization'],
    'relight_scene': ['preserving natural shadows', 'maintaining surface characteristics', 'avoiding harsh lighting artifacts'],
    'colorize_image': ['maintaining natural color relationships', 'preserving tonal balance', 'avoiding color bleeding'],
    'teleport_context': ['maintaining visual coherence', 'preserving lighting consistency', 'avoiding perspective conflicts'],
    'professional_product': ['ensuring catalog quality', 'maintaining product accuracy', 'avoiding commercial distortion'],
    'custom': ['maintaining overall coherence', 'preserving artistic intent', 'ensuring realistic results'],
    'default': []
};

// 修饰性提示词库 - Flux Kontext整合版，支持49个模板
export const DECORATIVE_PROMPTS = {
    // 局部编辑修饰性提示词 (L01-L18)
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
    // 🔴 新增局部编辑修饰性提示词
    'character_expression': ['emotionally engaging', 'naturally expressive', 'captivating facial features', 'authentic human emotion'],
    'character_hair': ['natural hair flow', 'realistic hair texture', 'stylistically appropriate', 'professionally styled'],
    'character_accessories': ['stylistically matching', 'perfectly fitted', 'naturally integrated', 'fashion-forward design'],
    
    // 全局编辑修饰性提示词 (G01-G12)
    'global_color_grade': ['cinematic color palette', 'professional grading', 'rich tonal depth', 'visually stunning result'],
    'global_style_transfer': ['artistic masterpiece', 'seamless style adaptation', 'visually captivating', 'sophisticated aesthetic'],
    'global_brightness_contrast': ['perfect exposure balance', 'dramatic contrast', 'enhanced dynamic range', 'professional quality'],
    'global_hue_saturation': ['vibrant yet natural colors', 'harmonious palette', 'rich saturation', 'color-accurate result'],
    'global_sharpen_blur': ['crystal clear sharpness', 'artistic blur effect', 'enhanced clarity', 'professional processing'],
    'global_noise_reduction': ['clean smooth result', 'artifact-free image', 'pristine quality', 'professional cleanup'],
    'global_enhance': ['stunning visual impact', 'enhanced beauty', 'masterpiece quality', 'professional refinement'],
    'global_filter': ['artistic filter effect', 'stylistic enhancement', 'creative transformation', 'visually appealing'],
    // 🔴 新增全局编辑修饰性提示词
    'character_age': ['naturally aging', 'age-appropriate features', 'realistic life progression', 'dignified maturation'],
    'detail_enhance': ['rich fine details', 'enhanced texture clarity', 'professional detailing', 'crystal clear definition'],
    'realism_enhance': ['photorealistic quality', 'lifelike appearance', 'natural authenticity', 'enhanced believability'],
    'camera_operation': ['cinematic framing', 'professional composition', 'dynamic perspective', 'visually engaging angle'],
    
    // 文字编辑修饰性提示词 (T01-T05) - 🔴 全新类型
    'text_add': ['elegant typography', 'perfectly integrated text', 'stylistically harmonious', 'professionally designed'],
    'text_remove': ['seamless text removal', 'invisible cleanup', 'perfect background restoration', 'natural scene flow'],
    'text_edit': ['improved readability', 'enhanced text clarity', 'professional typography', 'stylistically consistent'],
    'text_resize': ['optimal text scaling', 'perfect size balance', 'enhanced readability', 'visually proportioned'],
    'object_combine': ['seamless fusion', 'harmonious integration', 'unified composition', 'artistic synthesis'],
    
    // 专业操作修饰性提示词 (P01-P14)
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
    'depth_composite': ['realistic depth integration', 'dimensional accuracy', 'spatial harmony', 'atmospheric realism'],
    // 新增：来自kontext-presets的修饰性提示词
    'zoom_focus': ['dramatic focus enhancement', 'cinematic depth', 'professional zoom quality', 'artistic magnification'],
    'stylize_local': ['artistic style enhancement', 'creative transformation', 'unique artistic flair', 'stylized perfection'],
    'relight_scene': ['dramatic lighting effects', 'professional illumination', 'cinematic atmosphere', 'masterful lighting'],
    'colorize_image': ['vibrant color restoration', 'natural color enhancement', 'artistic colorization', 'lifelike color depth'],
    'teleport_context': ['seamless context transition', 'immersive environment', 'creative scene transformation', 'dynamic context shift'],
    'professional_product': ['catalog-quality finish', 'commercial excellence', 'professional presentation', 'premium product showcase'],
    'custom': ['personalized enhancement', 'creative freedom', 'unique artistic vision', 'customized perfection'],
    'default': []
};

/**
 * 根据分类获取模板选项
 */
export function getTemplatesByCategory(category) {
    console.log(`🔍 getTemplatesByCategory被调用，分类: ${category}`);
    
    if (!TEMPLATE_CATEGORIES[category]) {
        console.warn(`❌ 分类 ${category} 不存在于TEMPLATE_CATEGORIES中`);
        console.log('📋 可用的分类:', Object.keys(TEMPLATE_CATEGORIES));
        return [];
    }
    
    const categoryData = TEMPLATE_CATEGORIES[category];
    console.log(`📂 分类 ${category} 的模板数量: ${categoryData.templates.length}`);
    console.log('📋 模板ID列表:', categoryData.templates);
    
    const result = categoryData.templates.map(templateId => {
        const template = OPERATION_TEMPLATES[templateId];
        console.log(`🔍 处理模板 ${templateId}:`, template ? '✅ 找到' : '❌ 未找到');
        return {
            id: templateId,
            label: template?.label || templateId,
            template: template
        };
    });
    
    console.log(`✅ getTemplatesByCategory返回 ${result.length} 个模板:`, result.map(r => `${r.id}(${r.label})`));
    return result;
}

/**
 * 更新操作类型选择器
 */
export function updateOperationTypeSelect(selectElement, category) {
    console.log(`🔧 更新操作类型选择器，分类: ${category}`);
    if (!selectElement) {
        console.warn('❌ selectElement为空，无法更新');
        return;
    }
    
    // 清空现有选项
    selectElement.innerHTML = '';
    console.log('🧹 已清空现有选项');
    
    // 获取分类下的模板
    const templates = getTemplatesByCategory(category);
    console.log(`📋 获取到 ${templates.length} 个模板:`, templates.map(t => t.id));
    
    // 添加选项
    templates.forEach(({ id, label }) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = t(`op_${id}`, label);
        selectElement.appendChild(option);
        console.log(`➕ 添加选项: ${id} - ${label}`);
    });
    
    // 添加自定义选项
    if (category === 'local') {
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = t('op_custom', 'Custom Operation');
        selectElement.appendChild(customOption);
        console.log('➕ 添加自定义选项');
    }
    
    console.log(`✅ 操作类型选择器更新完成，共${selectElement.options.length}个选项`);
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
    console.log('📐 [UNIFIED] 使用统一坐标系统进行SVG坐标转换');
    
    // 使用新的统一坐标系统
    const coordinateSystem = getCoordinateSystem(modal);
    return coordinateSystem.mouseToSVGCoords(e.clientX, e.clientY);
}
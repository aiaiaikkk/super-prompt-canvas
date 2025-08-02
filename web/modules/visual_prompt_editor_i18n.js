/**
 * Visual Prompt Editor - 国际化模块
 * 负责管理中英文界面切换
 */

// 语言配置
export const LANGUAGES = {
    'en': 'English',
    'zh': '中文'
};

// 国际化文本映射
export const I18N_TEXTS = {
    // 主界面标题
    'title': {
        'en': 'Visual Prompt Editor',
        'zh': '可视化提示编辑器'
    },
    'subtitle': {
        'en': 'Unified Annotation & Prompt Generation',
        'zh': '统一标注和提示生成'
    },
    
    // 主要按钮
    'save_apply': {
        'en': '💾 Save & Apply',
        'zh': '💾 保存并应用'
    },
    'close': {
        'en': '✕ Close',
        'zh': '✕ 关闭'
    },
    'language_switch': {
        'en': '🌐 中文',
        'zh': '🌐 English'
    },
    
    // 工具栏标签
    'tools': {
        'en': 'Tools:',
        'zh': '工具:'
    },
    'colors': {
        'en': 'Colors:',
        'zh': '颜色:'
    },
    'edit': {
        'en': 'Edit:',
        'zh': '编辑:'
    },
    'fill': {
        'en': 'Fill:',
        'zh': '填充:'
    },
    'opacity': {
        'en': 'Opacity:',
        'zh': '不透明度:'
    },
    'brush': {
        'en': 'Brush:',
        'zh': '画笔:'
    },
    'view': {
        'en': 'View:',
        'zh': '视图:'
    },
    'size': {
        'en': 'Size:',
        'zh': '大小:'
    },
    'feather': {
        'en': 'Feather:',
        'zh': '羽化:'
    },
    
    // 工具提示
    'tooltip_rectangle': {
        'en': 'Rectangle',
        'zh': '矩形'
    },
    'tooltip_circle': {
        'en': 'Circle (Shift=Perfect Circle)',
        'zh': '圆形 (Shift=正圆)'
    },
    'tooltip_arrow': {
        'en': 'Arrow',
        'zh': '箭头'
    },
    'tooltip_freehand': {
        'en': 'Freehand Drawing (Left-click to add anchor points, right-click to close)',
        'zh': '自由绘制 (左键添加锚点，右键闭合)'
    },
    'tooltip_brush': {
        'en': 'Brush (Adjustable size and feather)',
        'zh': '画笔 (可调节大小和羽化)'
    },
    'tooltip_eraser': {
        'en': 'Eraser',
        'zh': '橡皮擦'
    },
    'tooltip_polygon': {
        'en': 'Polygon (Left click to add points, Right click to finish)',
        'zh': '多边形 (左键添加点，右键完成)'
    },
    'tooltip_text': {
        'en': 'Text Tool (Click to add text)',
        'zh': '文字工具 (点击添加文字)'
    },
    'tooltip_crop': {
        'en': 'Custom Crop - Creates cropped image objects (Left click to add anchor points, Right click to close, Enter to apply)',
        'zh': '自定义裁切 - 创建裁切后的图像对象 (左键添加锚点，右键闭合，回车确认)'
    },
    'tooltip_undo': {
        'en': 'Undo',
        'zh': '撤销'
    },
    'tooltip_clear': {
        'en': 'Clear All',
        'zh': '清除全部'
    },
    'tooltip_fill_toggle': {
        'en': 'Toggle between filled and outline annotations',
        'zh': '切换填充和轮廓标注'
    },
    'tooltip_opacity': {
        'en': 'Adjust annotation opacity (10-100%)',
        'zh': '调整标注不透明度 (10-100%)'
    },
    'tooltip_brush_size': {
        'en': 'Adjust brush size (5-50px)',
        'zh': '调整画笔大小 (5-50px)'
    },
    'tooltip_brush_feather': {
        'en': 'Adjust brush feather/softness (0-20px)',
        'zh': '调整画笔羽化/柔和度 (0-20px)'
    },
    'tooltip_zoom_fit': {
        'en': 'Fit to Screen',
        'zh': '适应屏幕'
    },
    'tooltip_zoom_100': {
        'en': '100% Zoom',
        'zh': '100% 缩放'
    },
    'tooltip_zoom_in': {
        'en': 'Zoom In',
        'zh': '放大'
    },
    'tooltip_zoom_out': {
        'en': 'Zoom Out',
        'zh': '缩小'
    },
    'tooltip_apply_to_selected': {
        'en': 'Apply the current prompt and description to all selected layers',
        'zh': '将当前提示和描述应用到所有选中的图层'
    },
    'apply_to_selected_hint': {
        'en': '💡 Apply current prompt and description to all selected layers',
        'zh': '💡 将当前提示和描述应用到所有选中的图层'
    },
    
    // 编辑操作按钮
    'btn_undo': {
        'en': '↶ Undo',
        'zh': '↶ 撤销'
    },
    'btn_clear': {
        'en': '🗂️ Clear',
        'zh': '🗂️ 清除'
    },
    'btn_filled': {
        'en': '🔴 Filled',
        'zh': '🔴 填充'
    },
    'btn_outline': {
        'en': '⭕ Outline',
        'zh': '⭕ 轮廓'
    },
    'btn_fit': {
        'en': 'Fit',
        'zh': '适应'
    },
    'btn_zoom_100': {
        'en': '1:1',
        'zh': '1:1'
    },
    'btn_zoom_in': {
        'en': '+',
        'zh': '+'
    },
    'btn_zoom_out': {
        'en': '-',
        'zh': '-'
    },
    
    // 右侧面板标题
    'layer_selection_operations': {
        'en': '🎯 Layer Selection & Operations',
        'zh': '🎯 图层选择与操作'
    },
    'edit_control': {
        'en': '🎯 Edit Control',
        'zh': '🎯 编辑控制'
    },
    'generated_description': {
        'en': '📝 Generated Description',
        'zh': '📝 生成的描述'
    },
    'selection_count': {
        'en': 'selected',
        'zh': '已选择'
    },
    'edited_status': {
        'en': '✏️ Edited',
        'zh': '✏️ 已编辑'
    },
    
    // 表单标签
    'select_layers': {
        'en': '📋 Available Layers',
        'zh': '📋 可用图层'
    },
    'btn_clear_selection': {
        'en': '🗑️ Clear',
        'zh': '🗑️ 清除'
    },
    'layer_name': {
        'en': 'Layer',
        'zh': '图层'
    },
    'no_description': {
        'en': 'No description',
        'zh': '无描述'
    },
    'no_layers_message': {
        'en': 'No layers available',
        'zh': '暂无图层'
    },
    'selected_count': {
        'en': 'selected',
        'zh': '已选择'
    },
    'layers_selected': {
        'en': 'layers selected',
        'zh': '个图层已选择'
    },
    
    // 操作类型翻译
    'op_add_object': {
        'en': 'Add Object',
        'zh': '添加对象'
    },
    'op_change_color': {
        'en': 'Change Color',
        'zh': '更改颜色'
    },
    'op_change_style': {
        'en': 'Change Style',
        'zh': '更改风格'
    },
    'op_replace_object': {
        'en': 'Replace Object',
        'zh': '替换对象'
    },
    'op_remove_object': {
        'en': 'Remove Object',
        'zh': '移除对象'
    },
    
    // 形状类型翻译
    'shape_rectangle': {
        'en': 'rectangle',
        'zh': '矩形'
    },
    'shape_circle': {
        'en': 'circle',
        'zh': '圆形'
    },
    'shape_arrow': {
        'en': 'arrow',
        'zh': '箭头'
    },
    'shape_freehand': {
        'en': 'freehand',
        'zh': '自由绘制'
    },
    'shape_brush': {
        'en': 'brush',
        'zh': '画笔'
    },
    
    // 编辑模式翻译
    'individual_editing': {
        'en': 'Individual editing',
        'zh': '单独编辑'
    },
    
    // 颜色翻译
    'color_red': {
        'en': 'Red',
        'zh': '红色'
    },
    'color_green': {
        'en': 'Green',
        'zh': '绿色'
    },
    'color_blue': {
        'en': 'Blue',
        'zh': '蓝色'
    },
    'color_yellow': {
        'en': 'Yellow',
        'zh': '黄色'
    },
    'color_orange': {
        'en': 'Orange',
        'zh': '橙色'
    },
    'operation_type': {
        'en': '⚙️ Operation Type',
        'zh': '⚙️ 操作类型'
    },
    'constraint_prompts': {
        'en': '🔒 Constraint Prompts (Select multiple)',
        'zh': '🔒 约束提示 (可多选)'
    },
    'decorative_prompts': {
        'en': '🎨 Decorative Prompts (Select multiple)',
        'zh': '🎨 装饰提示 (可多选)'
    },
    'description': {
        'en': '📝 Description',
        'zh': '📝 描述'
    },
    'template_category': {
        'en': 'Template Category',
        'zh': '模板分类'
    },
    'edit_operation_type': {
        'en': 'Edit Operation Type',
        'zh': '编辑操作类型'
    },
    'description_text': {
        'en': '📝 Description Text',
        'zh': '📝 描述文本'
    },
    'include_annotation_numbers': {
        'en': 'Include annotation numbers in description',
        'zh': '在描述中包含标注编号'
    },
    'annotation_numbers_help': {
        'en': '🏷️ Show annotation numbers (e.g., "annotation 1") in generated prompts',
        'zh': '🏷️ 在生成的提示中显示标注编号 (如 "标注1")'
    },
    
    // --- 面板标题 (20240718更新) ---
    'constraint_prompts_title': {
        'en': '🔒 Constraint Prompts:',
        'zh': '🔒 约束提示:'
    },
    'decorative_prompts_title': {
        'en': '🎨 Decorative Prompts:',
        'zh': '🎨 装饰提示:'
    },
    'select_multiple_subtitle': {
        'en': '(Select multiple)',
        'zh': '(可多选)'
    },

    // +++ 约束性提示词翻译 (20240718更新) +++
    'constraint_preserving_natural_skin_tone': { 'en': 'preserving natural skin tone', 'zh': '保持自然肤色' },
    'constraint_maintaining_pore_authenticity': { 'en': 'maintaining pore authenticity', 'zh': '保持毛孔真实性' },
    'constraint_avoiding_over-smoothing_artifacts': { 'en': 'avoiding over-smoothing artifacts', 'zh': '避免过度平滑产生的瑕疵' },
    'constraint_realistic_details': { 'en': 'realistic details', 'zh': '写实细节' },
    'constraint_symmetrical': { 'en': 'symmetrical', 'zh': '对称' },

    // +++ 装饰性提示词翻译 (20240718更新) +++
    'decorative_realistic_skin_detail': { 'en': 'realistic skin detail', 'zh': '真实的皮肤细节' },
    'decorative_natural_pore_structure': { 'en': 'natural pore structure', 'zh': '自然的毛孔结构' },
    'decorative_healthy_skin_appearance': { 'en': 'healthy skin appearance', 'zh': '健康的皮肤外观' },
    'decorative_photorealistic_texture': { 'en': 'photorealistic texture', 'zh': '照片般真实的纹理' },
    'decorative_cinematic': { 'en': 'cinematic', 'zh': '电影感' },
    'decorative_dreamy_atmosphere': { 'en': 'dreamy atmosphere', 'zh': '梦幻氛围' },
    'decorative_professional_color_grading': { 'en': 'professional color grading', 'zh': '专业色彩分级' },

    // --- add_object 操作的翻译 (20240718) ---
    'constraint_respecting_spatial_relationships': { 'en': 'respecting spatial relationships', 'zh': '尊重空间关系' },
    'constraint_maintaining_proper_scale': { 'en': 'maintaining proper scale', 'zh': '保持适当比例' },
    'constraint_avoiding_visual_conflicts': { 'en': 'avoiding visual conflicts', 'zh': '避免视觉冲突' },
    'decorative_natural_positioning': { 'en': 'natural positioning', 'zh': '自然定位' },
    'decorative_environmental_harmony': { 'en': 'environmental harmony', 'zh': '与环境和谐' },
    'decorative_balanced_composition': { 'en': 'balanced composition', 'zh': '均衡构图' },
    'decorative_contextually_appropriate': { 'en': 'contextually appropriate', 'zh': '符合上下文' },
    
    // 占位符文本
    'placeholder_select_layers': {
        'en': 'Click to select layers...',
        'zh': '点击选择图层...'
    },
    'placeholder_layer_description': {
        'en': 'Enter description for selected layer(s)...',
        'zh': '输入所选图层的描述...'
    },
    'placeholder_target_input': {
        'en': 'Enter editing instructions for selected objects...',
        'zh': '输入所选对象的编辑指令...'
    },
    'placeholder_generated_description': {
        'en': 'Generated description text will appear here...',
        'zh': '生成的描述文本将显示在此处...'
    },
    
    // 操作类型选项
    'op_add_object': {
        'en': 'Add Object',
        'zh': '添加对象'
    },
    'op_change_color': {
        'en': 'Change Color',
        'zh': '改变颜色'
    },
    'op_change_style': {
        'en': 'Change Style',
        'zh': '改变风格'
    },
    'op_replace_object': {
        'en': 'Replace Object',
        'zh': '替换对象'
    },
    'op_remove_object': {
        'en': 'Remove Object',
        'zh': '移除对象'
    },
    'op_change_texture': {
        'en': 'Change Texture',
        'zh': '改变纹理'
    },
    'op_change_pose': {
        'en': 'Change Pose',
        'zh': '改变姿势'
    },
    'op_change_expression': {
        'en': 'Change Expression',
        'zh': '改变表情'
    },
    'op_change_clothing': {
        'en': 'Change Clothing',
        'zh': '改变服装'
    },
    'op_change_background': {
        'en': 'Change Background',
        'zh': '改变背景'
    },
    'op_enhance_quality': {
        'en': 'Enhance Quality',
        'zh': '提升质量'
    },
    'op_blur_background': {
        'en': 'Blur Background',
        'zh': '模糊背景'
    },
    'op_adjust_lighting': {
        'en': 'Adjust Lighting',
        'zh': '调整光照'
    },
    'op_resize_object': {
        'en': 'Resize Object',
        'zh': '调整对象大小'
    },
    'op_enhance_skin_texture': {
        'en': 'Enhance Skin Texture',
        'zh': '增强皮肤纹理'
    },
    'op_character_expression': {
        'en': 'Character Expression',
        'zh': '角色表情'
    },
    'op_character_hair': {
        'en': 'Character Hair',
        'zh': '角色发型'
    },
    'op_character_accessories': {
        'en': 'Character Accessories',
        'zh': '角色配饰'
    },
    'op_zoom_focus': {
        'en': 'Zoom Focus',
        'zh': '聚焦缩放'
    },
    'op_stylize_local': {
        'en': 'Stylize Local',
        'zh': '局部风格化'
    },
    'op_custom': {
        'en': 'Custom Operation',
        'zh': '自定义操作'
    },
    
    // 全局操作
    'op_global_color_grade': { 'en': 'Color Grading', 'zh': '色彩分级' },
    'op_global_style_transfer': { 'en': 'Style Transfer', 'zh': '风格迁移' },
    'op_global_brightness_contrast': { 'en': 'Brightness & Contrast', 'zh': '亮度与对比度' },
    'op_global_hue_saturation': { 'en': 'Hue & Saturation', 'zh': '色相与饱和度' },
    'op_global_sharpen_blur': { 'en': 'Sharpen/Blur', 'zh': '锐化/模糊' },
    'op_global_noise_reduction': { 'en': 'Noise Reduction', 'zh': '降噪' },
    'op_global_enhance': { 'en': 'Global Enhance', 'zh': '全局增强' },
    'op_global_filter': { 'en': 'Filter Effect', 'zh': '滤镜效果' },
    'op_character_age': { 'en': 'Character Age', 'zh': '角色年龄' },
    'op_detail_enhance': { 'en': 'Detail Enhance', 'zh': '细节增强' },
    'op_realism_enhance': { 'en': 'Realism Enhance', 'zh': '真实感增强' },
    'op_camera_operation': { 'en': 'Camera Operation', 'zh': '镜头操作' },
    'op_relight_scene': { 'en': 'Relight Scene', 'zh': '场景重打光' },
    'op_colorize_image': { 'en': 'Colorize Image', 'zh': '图像上色' },
    'op_teleport_context': { 'en': 'Teleport Context', 'zh': '场景传送' },
    
    // 文本操作
    'op_text_add': { 'en': 'Add Text', 'zh': '添加文字' },
    'op_text_remove': { 'en': 'Remove Text', 'zh': '移除文字' },
    'op_text_edit': { 'en': 'Edit Text', 'zh': '编辑文字' },
    'op_text_resize': { 'en': 'Resize Text', 'zh': '缩放文字' },
    'op_object_combine': { 'en': 'Object Combine', 'zh': '对象组合' },
    
    // 专业操作
    'op_geometric_warp': { 'en': 'Geometric Warp', 'zh': '几何扭曲' },
    'op_perspective_transform': { 'en': 'Perspective Transform', 'zh': '透视变换' },
    'op_lens_distortion': { 'en': 'Lens Distortion', 'zh': '镜头畸变' },
    'op_global_perspective': { 'en': 'Global Perspective', 'zh': '全局透视' },
    'op_content_aware_fill': { 'en': 'Content-Aware Fill', 'zh': '内容感知填充' },
    'op_seamless_removal': { 'en': 'Seamless Removal', 'zh': '无缝移除' },
    'op_smart_patch': { 'en': 'Smart Patch', 'zh': '智能修补' },
    'op_style_blending': { 'en': 'Style Blending', 'zh': '风格混合' },
    'op_collage_integration': { 'en': 'Collage Integration', 'zh': '拼贴集成' },
    'op_texture_mixing': { 'en': 'Texture Mixing', 'zh': '纹理混合' },
    'op_precision_cutout': { 'en': 'Precision Cutout', 'zh': '精确抠图' },
    'op_alpha_composite': { 'en': 'Alpha Composite', 'zh': 'Alpha合成' },
    'op_mask_feathering': { 'en': 'Mask Feathering', 'zh': '蒙版羽化' },
    'op_depth_composite': { 'en': 'Depth Composite', 'zh': '深度合成' },
    'op_professional_product': { 'en': 'Professional Product', 'zh': '专业产品' },
    
    // 模板分类
    'template_global': {
        'en': '🌍 Global Adjustments (15 templates)',
        'zh': '🌍 全局调整 (15个模板)'
    },
    'template_text': {
        'en': '📝 Text Editing (5 templates)',
        'zh': '📝 文本编辑 (5个模板)'
    },
    'template_professional': {
        'en': '🔧 Professional Operations (15 templates)',
        'zh': '🔧 专业操作 (15个模板)'
    },
    
    // 提示信息
    'constraint_prompts_help': {
        'en': 'Quality control and technical constraints for better results',
        'zh': '质量控制和技术约束，获得更好的结果'
    },
    'decorative_prompts_help': {
        'en': 'Aesthetic enhancements and visual quality improvements',
        'zh': '美学增强和视觉质量改善'
    },
    'select_operation_constraint': {
        'en': 'Please select an operation type to load constraint prompts...',
        'zh': '请选择操作类型以加载约束提示...'
    },
    'select_operation_decorative': {
        'en': 'Please select an operation type to load decorative prompts...',
        'zh': '请选择操作类型以加载装饰提示...'
    },
    
    // 操作按钮
    'btn_apply_to_selected': {
        'en': '✅ Apply to Selected',
        'zh': '✅ 应用到选中项'
    },
    'btn_select_all': {
        'en': '📋 Select All',
        'zh': '📋 全选'
    },
    'btn_generate_description': {
        'en': '✨ Generate Description',
        'zh': '✨ 生成描述'
    },
    'btn_copy': {
        'en': '📋 Copy',
        'zh': '📋 复制'
    },
    'btn_clear_description': {
        'en': '🧹 Clear',
        'zh': '🧹 清除'
    },
    
    
    // 控制说明
    'canvas_controls_title': {
        'en': 'VPE Canvas Controls:',
        'zh': 'VPE 画布控制:'
    },
    'control_left_click': {
        'en': '• Left-click: Draw freehand',
        'zh': '• 左键点击: 自由绘制'
    },
    'control_middle_click': {
        'en': '• Middle-click: Drag to pan',
        'zh': '• 中键点击: 拖拽平移'
    },
    'control_ctrl_scroll': {
        'en': '• Ctrl+Scroll: Zoom',
        'zh': '• Ctrl+滚轮: 缩放'
    },
    'control_shift_circle': {
        'en': '• Shift+Circle: Perfect Circle',
        'zh': '• Shift+圆形: 正圆'
    },
    
    // ===== 约束性提示词翻译 =====
    
    // 局部编辑约束性提示词 (L01-L18)
    'constraint_change_color_1': {
        'en': 'preserving original texture details',
        'zh': '保持原始纹理细节'
    },
    'constraint_change_color_2': {
        'en': 'maintaining material properties',
        'zh': '保持材质属性'
    },
    'constraint_change_color_3': {
        'en': 'avoiding color bleeding',
        'zh': '避免颜色溢出'
    },
    'constraint_change_style_1': {
        'en': 'maintaining structural integrity',
        'zh': '保持结构完整性'
    },
    'constraint_change_style_2': {
        'en': 'preserving essential details',
        'zh': '保留重要细节'
    },
    'constraint_change_style_3': {
        'en': 'avoiding over-stylization',
        'zh': '避免过度风格化'
    },
    'constraint_replace_object_1': {
        'en': 'matching perspective angles',
        'zh': '匹配透视角度'
    },
    'constraint_replace_object_2': {
        'en': 'consistent lighting direction',
        'zh': '保持光照方向一致'
    },
    'constraint_replace_object_3': {
        'en': 'maintaining scale proportions',
        'zh': '保持比例尺度'
    },
    'constraint_add_object_1': {
        'en': 'respecting spatial relationships',
        'zh': '尊重空间关系'
    },
    'constraint_add_object_2': {
        'en': 'maintaining proper scale',
        'zh': '保持适当比例'
    },
    'constraint_add_object_3': {
        'en': 'avoiding visual conflicts',
        'zh': '避免视觉冲突'
    },
    'constraint_remove_object_1': {
        'en': 'preserving background continuity',
        'zh': '保持背景连续性'
    },
    'constraint_remove_object_2': {
        'en': 'maintaining visual coherence',
        'zh': '保持视觉连贯性'
    },
    'constraint_remove_object_3': {
        'en': 'avoiding obvious gaps',
        'zh': '避免明显空缺'
    },
    'constraint_change_texture_1': {
        'en': 'preserving surface geometry',
        'zh': '保持表面几何形状'
    },
    'constraint_change_texture_2': {
        'en': 'maintaining lighting interaction',
        'zh': '保持光影交互'
    },
    'constraint_change_texture_3': {
        'en': 'avoiding pattern distortion',
        'zh': '避免图案变形'
    },
    'constraint_change_pose_1': {
        'en': 'ensuring anatomical correctness',
        'zh': '确保解剖学正确性'
    },
    'constraint_change_pose_2': {
        'en': 'maintaining joint constraints',
        'zh': '保持关节限制'
    },
    'constraint_change_pose_3': {
        'en': 'preserving muscle definition',
        'zh': '保持肌肉定义'
    },
    'constraint_change_expression_1': {
        'en': 'maintaining facial symmetry',
        'zh': '保持面部对称性'
    },
    'constraint_change_expression_2': {
        'en': 'preserving skin texture',
        'zh': '保持肌肤纹理'
    },
    'constraint_change_expression_3': {
        'en': 'avoiding unnatural distortion',
        'zh': '避免不自然变形'
    },
    'constraint_change_clothing_1': {
        'en': 'ensuring proper fit',
        'zh': '确保合身效果'
    },
    'constraint_change_clothing_2': {
        'en': 'simulating fabric physics',
        'zh': '模拟布料物理'
    },
    'constraint_change_clothing_3': {
        'en': 'maintaining style consistency',
        'zh': '保持风格一致性'
    },
    'constraint_change_background_1': {
        'en': 'maintaining depth relationships',
        'zh': '保持深度关系'
    },
    'constraint_change_background_2': {
        'en': 'preserving atmospheric perspective',
        'zh': '保持大气透视'
    },
    'constraint_change_background_3': {
        'en': 'matching lighting conditions',
        'zh': '匹配光照条件'
    },
    'constraint_enhance_quality_1': {
        'en': 'avoiding over-sharpening artifacts',
        'zh': '避免过度锐化伪影'
    },
    'constraint_enhance_quality_2': {
        'en': 'preserving natural appearance',
        'zh': '保持自然外观'
    },
    'constraint_enhance_quality_3': {
        'en': 'maintaining tonal balance',
        'zh': '保持色调平衡'
    },
    'constraint_blur_background_1': {
        'en': 'preserving subject sharpness',
        'zh': '保持主体清晰度'
    },
    'constraint_blur_background_2': {
        'en': 'maintaining edge definition',
        'zh': '保持边缘定义'
    },
    'constraint_blur_background_3': {
        'en': 'avoiding halo effects',
        'zh': '避免光晕效应'
    },
    'constraint_adjust_lighting_1': {
        'en': 'preserving form definition',
        'zh': '保持形态定义'
    },
    'constraint_adjust_lighting_2': {
        'en': 'maintaining shadow detail',
        'zh': '保持阴影细节'
    },
    'constraint_adjust_lighting_3': {
        'en': 'avoiding blown highlights',
        'zh': '避免高光过曝'
    },
    'constraint_resize_object_1': {
        'en': 'maintaining image quality',
        'zh': '保持图像质量'
    },
    'constraint_resize_object_2': {
        'en': 'preserving detail resolution',
        'zh': '保持细节分辨率'
    },
    'constraint_resize_object_3': {
        'en': 'avoiding scaling artifacts',
        'zh': '避免缩放伪影'
    },
    'constraint_enhance_skin_texture_1': {
        'en': 'preserving natural skin tone',
        'zh': '保持自然肤色'
    },
    'constraint_enhance_skin_texture_2': {
        'en': 'maintaining pore authenticity',
        'zh': '保持毛孔真实性'
    },
    'constraint_enhance_skin_texture_3': {
        'en': 'avoiding over-smoothing artifacts',
        'zh': '避免过度平滑伪影'
    },
    
    // 新增局部编辑约束性提示词
    'constraint_character_expression_1': {
        'en': 'maintaining facial symmetry',
        'zh': '保持面部对称性'
    },
    'constraint_character_expression_2': {
        'en': 'preserving natural emotion',
        'zh': '保持自然情感'
    },
    'constraint_character_expression_3': {
        'en': 'avoiding forced expressions',
        'zh': '避免僵硬表情'
    },
    'constraint_character_hair_1': {
        'en': 'ensuring realistic hair physics',
        'zh': '确保真实的头发物理'
    },
    'constraint_character_hair_2': {
        'en': 'maintaining hair texture quality',
        'zh': '保持头发纹理质量'
    },
    'constraint_character_hair_3': {
        'en': 'avoiding unnatural hair placement',
        'zh': '避免不自然的发型'
    },
    'constraint_character_accessories_1': {
        'en': 'ensuring proper fit and scale',
        'zh': '确保合适的尺寸和比例'
    },
    'constraint_character_accessories_2': {
        'en': 'maintaining realistic positioning',
        'zh': '保持真实的位置'
    },
    'constraint_character_accessories_3': {
        'en': 'avoiding visual conflicts',
        'zh': '避免视觉冲突'
    },
    
    // 全局编辑约束性提示词 (G01-G12)
    'constraint_global_color_grade_1': {
        'en': 'preserving skin tone accuracy',
        'zh': '保持肤色准确性'
    },
    'constraint_global_color_grade_2': {
        'en': 'maintaining color relationships',
        'zh': '保持色彩关系'
    },
    'constraint_global_color_grade_3': {
        'en': 'avoiding posterization',
        'zh': '避免色调分离'
    },
    'constraint_global_style_transfer_1': {
        'en': 'preserving essential details',
        'zh': '保留重要细节'
    },
    'constraint_global_style_transfer_2': {
        'en': 'maintaining structural integrity',
        'zh': '保持结构完整性'
    },
    'constraint_global_style_transfer_3': {
        'en': 'avoiding over-stylization',
        'zh': '避免过度风格化'
    },
    'constraint_global_brightness_contrast_1': {
        'en': 'avoiding highlight clipping',
        'zh': '避免高光削波'
    },
    'constraint_global_brightness_contrast_2': {
        'en': 'preserving shadow detail',
        'zh': '保持阴影细节'
    },
    'constraint_global_brightness_contrast_3': {
        'en': 'maintaining tonal balance',
        'zh': '保持色调平衡'
    },
    'constraint_global_hue_saturation_1': {
        'en': 'preserving natural color relationships',
        'zh': '保持自然色彩关系'
    },
    'constraint_global_hue_saturation_2': {
        'en': 'avoiding oversaturation',
        'zh': '避免过度饱和'
    },
    'constraint_global_hue_saturation_3': {
        'en': 'maintaining color accuracy',
        'zh': '保持色彩准确性'
    },
    'constraint_global_sharpen_blur_1': {
        'en': 'maintaining edge definition',
        'zh': '保持边缘定义'
    },
    'constraint_global_sharpen_blur_2': {
        'en': 'controlling noise amplification',
        'zh': '控制噪声放大'
    },
    'constraint_global_sharpen_blur_3': {
        'en': 'preserving fine details',
        'zh': '保持精细细节'
    },
    'constraint_global_noise_reduction_1': {
        'en': 'preserving texture details',
        'zh': '保持纹理细节'
    },
    'constraint_global_noise_reduction_2': {
        'en': 'avoiding over-smoothing',
        'zh': '避免过度平滑'
    },
    'constraint_global_noise_reduction_3': {
        'en': 'maintaining edge sharpness',
        'zh': '保持边缘锐度'
    },
    'constraint_global_enhance_1': {
        'en': 'optimizing dynamic range',
        'zh': '优化动态范围'
    },
    'constraint_global_enhance_2': {
        'en': 'maintaining natural appearance',
        'zh': '保持自然外观'
    },
    'constraint_global_enhance_3': {
        'en': 'avoiding over-processing',
        'zh': '避免过度处理'
    },
    'constraint_global_filter_1': {
        'en': 'ensuring consistent application',
        'zh': '确保一致应用'
    },
    'constraint_global_filter_2': {
        'en': 'preserving image integrity',
        'zh': '保持图像完整性'
    },
    'constraint_global_filter_3': {
        'en': 'maintaining detail clarity',
        'zh': '保持细节清晰度'
    },
    
    // 新增全局编辑约束性提示词
    'constraint_character_age_1': {
        'en': 'maintaining facial structure',
        'zh': '保持面部结构'
    },
    'constraint_character_age_2': {
        'en': 'preserving identity characteristics',
        'zh': '保持身份特征'
    },
    'constraint_character_age_3': {
        'en': 'avoiding unrealistic aging',
        'zh': '避免不真实的老化'
    },
    'constraint_detail_enhance_1': {
        'en': 'maintaining image balance',
        'zh': '保持图像平衡'
    },
    'constraint_detail_enhance_2': {
        'en': 'avoiding over-enhancement',
        'zh': '避免过度增强'
    },
    'constraint_detail_enhance_3': {
        'en': 'preserving natural appearance',
        'zh': '保持自然外观'
    },
    'constraint_realism_enhance_1': {
        'en': 'maintaining artistic intent',
        'zh': '保持艺术意图'
    },
    'constraint_realism_enhance_2': {
        'en': 'avoiding uncanny valley effects',
        'zh': '避免恐怖谷效应'
    },
    'constraint_realism_enhance_3': {
        'en': 'preserving style consistency',
        'zh': '保持风格一致性'
    },
    'constraint_camera_operation_1': {
        'en': 'maintaining subject focus',
        'zh': '保持主体焦点'
    },
    'constraint_camera_operation_2': {
        'en': 'preserving composition balance',
        'zh': '保持构图平衡'
    },
    'constraint_camera_operation_3': {
        'en': 'avoiding distortion',
        'zh': '避免变形'
    },
    
    // 文字编辑约束性提示词 (T01-T05)
    'constraint_text_add_1': {
        'en': 'ensuring readable typography',
        'zh': '确保可读的字体排版'
    },
    'constraint_text_add_2': {
        'en': 'maintaining text clarity',
        'zh': '保持文字清晰度'
    },
    'constraint_text_add_3': {
        'en': 'avoiding visual interference',
        'zh': '避免视觉干扰'
    },
    'constraint_text_remove_1': {
        'en': 'preserving background integrity',
        'zh': '保持背景完整性'
    },
    'constraint_text_remove_2': {
        'en': 'maintaining visual coherence',
        'zh': '保持视觉连贯性'
    },
    'constraint_text_remove_3': {
        'en': 'avoiding obvious gaps',
        'zh': '避免明显空缺'
    },
    'constraint_text_edit_1': {
        'en': 'maintaining font consistency',
        'zh': '保持字体一致性'
    },
    'constraint_text_edit_2': {
        'en': 'preserving text formatting',
        'zh': '保持文字格式'
    },
    'constraint_text_edit_3': {
        'en': 'ensuring readability',
        'zh': '确保可读性'
    },
    'constraint_text_resize_1': {
        'en': 'maintaining text proportions',
        'zh': '保持文字比例'
    },
    'constraint_text_resize_2': {
        'en': 'preserving readability',
        'zh': '保持可读性'
    },
    'constraint_text_resize_3': {
        'en': 'avoiding distortion',
        'zh': '避免变形'
    },
    'constraint_object_combine_1': {
        'en': 'ensuring seamless integration',
        'zh': '确保无缝整合'
    },
    'constraint_object_combine_2': {
        'en': 'maintaining visual harmony',
        'zh': '保持视觉和谐'
    },
    'constraint_object_combine_3': {
        'en': 'preserving individual characteristics',
        'zh': '保持个体特征'
    },
    
    // 专业操作约束性提示词 (P01-P14)
    'constraint_geometric_warp_1': {
        'en': 'preserving straight lines where appropriate',
        'zh': '适当保持直线'
    },
    'constraint_geometric_warp_2': {
        'en': 'maintaining architectural integrity',
        'zh': '保持建筑完整性'
    },
    'constraint_geometric_warp_3': {
        'en': 'avoiding excessive distortion',
        'zh': '避免过度变形'
    },
    'constraint_perspective_transform_1': {
        'en': 'ensuring proper vanishing points',
        'zh': '确保正确的消失点'
    },
    'constraint_perspective_transform_2': {
        'en': 'maintaining realistic proportions',
        'zh': '保持真实比例'
    },
    'constraint_perspective_transform_3': {
        'en': 'preserving structural relationships',
        'zh': '保持结构关系'
    },
    'constraint_lens_distortion_1': {
        'en': 'simulating authentic optical characteristics',
        'zh': '模拟真实光学特性'
    },
    'constraint_lens_distortion_2': {
        'en': 'avoiding unnatural deformation',
        'zh': '避免不自然变形'
    },
    'constraint_lens_distortion_3': {
        'en': 'maintaining image quality',
        'zh': '保持图像质量'
    },
    'constraint_global_perspective_1': {
        'en': 'straightening vertical lines',
        'zh': '矫正垂直线条'
    },
    'constraint_global_perspective_2': {
        'en': 'maintaining natural viewing angles',
        'zh': '保持自然视角'
    },
    'constraint_global_perspective_3': {
        'en': 'preserving composition balance',
        'zh': '保持构图平衡'
    },
    'constraint_content_aware_fill_1': {
        'en': 'seamlessly blending textures',
        'zh': '无缝混合纹理'
    },
    'constraint_content_aware_fill_2': {
        'en': 'maintaining contextual continuity',
        'zh': '保持上下文连续性'
    },
    'constraint_content_aware_fill_3': {
        'en': 'preserving lighting patterns',
        'zh': '保持光照模式'
    },
    'constraint_seamless_removal_1': {
        'en': 'preserving lighting patterns',
        'zh': '保持光照模式'
    },
    'constraint_seamless_removal_2': {
        'en': 'maintaining surface characteristics',
        'zh': '保持表面特征'
    },
    'constraint_seamless_removal_3': {
        'en': 'ensuring visual coherence',
        'zh': '确保视觉连贯性'
    },
    'constraint_smart_patch_1': {
        'en': 'matching surrounding patterns',
        'zh': '匹配周围图案'
    },
    'constraint_smart_patch_2': {
        'en': 'maintaining visual coherence',
        'zh': '保持视觉连贯性'
    },
    'constraint_smart_patch_3': {
        'en': 'preserving texture quality',
        'zh': '保持纹理质量'
    },
    'constraint_style_blending_1': {
        'en': 'harmonizing color palettes',
        'zh': '协调色彩调色板'
    },
    'constraint_style_blending_2': {
        'en': 'preserving distinctive characteristics',
        'zh': '保持独特特征'
    },
    'constraint_style_blending_3': {
        'en': 'maintaining artistic integrity',
        'zh': '保持艺术完整性'
    },
    'constraint_collage_integration_1': {
        'en': 'balancing visual weights',
        'zh': '平衡视觉重量'
    },
    'constraint_collage_integration_2': {
        'en': 'creating unified artistic narrative',
        'zh': '创造统一的艺术叙事'
    },
    'constraint_collage_integration_3': {
        'en': 'maintaining composition flow',
        'zh': '保持构图流动性'
    },
    'constraint_texture_mixing_1': {
        'en': 'creating realistic surface interactions',
        'zh': '创造真实的表面交互'
    },
    'constraint_texture_mixing_2': {
        'en': 'maintaining tactile believability',
        'zh': '保持触觉真实感'
    },
    'constraint_texture_mixing_3': {
        'en': 'preserving material authenticity',
        'zh': '保持材质真实性'
    },
    'constraint_precision_cutout_1': {
        'en': 'achieving pixel-perfect boundaries',
        'zh': '实现像素级精确边界'
    },
    'constraint_precision_cutout_2': {
        'en': 'maintaining natural edge transitions',
        'zh': '保持自然边缘过渡'
    },
    'constraint_precision_cutout_3': {
        'en': 'preserving fine details',
        'zh': '保持精细细节'
    },
    'constraint_alpha_composite_1': {
        'en': 'managing transparency interactions',
        'zh': '管理透明度交互'
    },
    'constraint_alpha_composite_2': {
        'en': 'preserving color accuracy',
        'zh': '保持色彩准确性'
    },
    'constraint_alpha_composite_3': {
        'en': 'maintaining blending precision',
        'zh': '保持混合精度'
    },
    'constraint_mask_feathering_1': {
        'en': 'creating soft natural transitions',
        'zh': '创造柔和自然过渡'
    },
    'constraint_mask_feathering_2': {
        'en': 'maintaining selection accuracy',
        'zh': '保持选择准确性'
    },
    'constraint_mask_feathering_3': {
        'en': 'avoiding harsh edges',
        'zh': '避免尖锐边缘'
    },
    'constraint_depth_composite_1': {
        'en': 'respecting spatial relationships',
        'zh': '尊重空间关系'
    },
    'constraint_depth_composite_2': {
        'en': 'maintaining atmospheric perspective',
        'zh': '保持大气透视'
    },
    'constraint_depth_composite_3': {
        'en': 'preserving depth cues',
        'zh': '保持深度线索'
    },
    
    // 新增：来自kontext-presets的约束性提示词
    'constraint_zoom_focus_1': {
        'en': 'maintaining subject clarity',
        'zh': '保持主体清晰度'
    },
    'constraint_zoom_focus_2': {
        'en': 'preserving focus quality',
        'zh': '保持焦点质量'
    },
    'constraint_zoom_focus_3': {
        'en': 'avoiding distortion artifacts',
        'zh': '避免变形伪影'
    },
    'constraint_stylize_local_1': {
        'en': 'preserving essential details',
        'zh': '保留重要细节'
    },
    'constraint_stylize_local_2': {
        'en': 'maintaining structural integrity',
        'zh': '保持结构完整性'
    },
    'constraint_stylize_local_3': {
        'en': 'avoiding over-stylization',
        'zh': '避免过度风格化'
    },
    'constraint_relight_scene_1': {
        'en': 'preserving natural shadows',
        'zh': '保持自然阴影'
    },
    'constraint_relight_scene_2': {
        'en': 'maintaining surface characteristics',
        'zh': '保持表面特征'
    },
    'constraint_relight_scene_3': {
        'en': 'avoiding harsh lighting artifacts',
        'zh': '避免刺眼的光照伪影'
    },
    'constraint_colorize_image_1': {
        'en': 'maintaining natural color relationships',
        'zh': '保持自然色彩关系'
    },
    'constraint_colorize_image_2': {
        'en': 'preserving tonal balance',
        'zh': '保持色调平衡'
    },
    'constraint_colorize_image_3': {
        'en': 'avoiding color bleeding',
        'zh': '避免颜色溢出'
    },
    'constraint_teleport_context_1': {
        'en': 'maintaining visual coherence',
        'zh': '保持视觉连贯性'
    },
    'constraint_teleport_context_2': {
        'en': 'preserving lighting consistency',
        'zh': '保持光照一致性'
    },
    'constraint_teleport_context_3': {
        'en': 'avoiding perspective conflicts',
        'zh': '避免透视冲突'
    },
    'constraint_professional_product_1': {
        'en': 'ensuring catalog quality',
        'zh': '确保目录级质量'
    },
    'constraint_professional_product_2': {
        'en': 'maintaining product accuracy',
        'zh': '保持产品准确性'
    },
    'constraint_professional_product_3': {
        'en': 'avoiding commercial distortion',
        'zh': '避免商业化变形'
    },
    
    // 遗漏的局部编辑约束性提示词
    'constraint_custom_1': {
        'en': 'maintaining overall coherence',
        'zh': '保持整体连贯性'
    },
    'constraint_custom_2': {
        'en': 'preserving artistic intent',
        'zh': '保持艺术意图'
    },
    'constraint_custom_3': {
        'en': 'ensuring realistic results',
        'zh': '确保真实结果'
    },
    
    // ===== 修饰性提示词翻译 =====
    
    // 局部编辑修饰性提示词 (L01-L18)
    'decorative_change_color_1': {
        'en': 'smooth color transition',
        'zh': '平滑的颜色过渡'
    },
    'decorative_change_color_2': {
        'en': 'natural blending',
        'zh': '自然融合'
    },
    'decorative_change_color_3': {
        'en': 'vibrant yet realistic tones',
        'zh': '鲜艳而真实的色调'
    },
    'decorative_change_color_4': {
        'en': 'professional color grading',
        'zh': '专业调色'
    },
    'decorative_change_style_1': {
        'en': 'artistic excellence',
        'zh': '艺术卓越'
    },
    'decorative_change_style_2': {
        'en': 'seamless style adaptation',
        'zh': '无缝风格适配'
    },
    'decorative_change_style_3': {
        'en': 'visually striking',
        'zh': '视觉震撼'
    },
    'decorative_change_style_4': {
        'en': 'sophisticated aesthetic',
        'zh': '精致美学'
    },
    'decorative_replace_object_1': {
        'en': 'seamless integration',
        'zh': '无缝集成'
    },
    'decorative_replace_object_2': {
        'en': 'photorealistic replacement',
        'zh': '照片级真实替换'
    },
    'decorative_replace_object_3': {
        'en': 'perfect visual harmony',
        'zh': '完美视觉和谐'
    },
    'decorative_replace_object_4': {
        'en': 'natural placement',
        'zh': '自然放置'
    },
    'decorative_add_object_1': {
        'en': 'natural positioning',
        'zh': '自然定位'
    },
    'decorative_add_object_2': {
        'en': 'environmental harmony',
        'zh': '环境和谐'
    },
    'decorative_add_object_3': {
        'en': 'balanced composition',
        'zh': '平衡构图'
    },
    'decorative_add_object_4': {
        'en': 'contextually appropriate',
        'zh': '符合情境'
    },
    'decorative_remove_object_1': {
        'en': 'invisible removal',
        'zh': '无痕移除'
    },
    'decorative_remove_object_2': {
        'en': 'seamless background reconstruction',
        'zh': '无缝背景重建'
    },
    'decorative_remove_object_3': {
        'en': 'natural scene flow',
        'zh': '自然场景流动'
    },
    'decorative_remove_object_4': {
        'en': 'perfect cleanup',
        'zh': '完美清理'
    },
    'decorative_change_texture_1': {
        'en': 'realistic material properties',
        'zh': '真实材质属性'
    },
    'decorative_change_texture_2': {
        'en': 'detailed surface quality',
        'zh': '细致表面质量'
    },
    'decorative_change_texture_3': {
        'en': 'tactile authenticity',
        'zh': '触觉真实感'
    },
    'decorative_change_texture_4': {
        'en': 'professional texturing',
        'zh': '专业纹理处理'
    },
    'decorative_change_pose_1': {
        'en': 'natural body mechanics',
        'zh': '自然身体力学'
    },
    'decorative_change_pose_2': {
        'en': 'dynamic posing',
        'zh': '动态姿态'
    },
    'decorative_change_pose_3': {
        'en': 'graceful movement',
        'zh': '优雅动作'
    },
    'decorative_change_pose_4': {
        'en': 'lifelike positioning',
        'zh': '生动定位'
    },
    'decorative_change_expression_1': {
        'en': 'emotional authenticity',
        'zh': '情感真实性'
    },
    'decorative_change_expression_2': {
        'en': 'expressive naturalness',
        'zh': '表达自然性'
    },
    'decorative_change_expression_3': {
        'en': 'subtle facial nuances',
        'zh': '微妙面部细节'
    },
    'decorative_change_expression_4': {
        'en': 'captivating presence',
        'zh': '迷人气质'
    },
    'decorative_change_clothing_1': {
        'en': 'fashionable appearance',
        'zh': '时尚外观'
    },
    'decorative_change_clothing_2': {
        'en': 'elegant draping',
        'zh': '优雅垂坠'
    },
    'decorative_change_clothing_3': {
        'en': 'realistic fabric behavior',
        'zh': '真实织物表现'
    },
    'decorative_change_clothing_4': {
        'en': 'stylistic harmony',
        'zh': '风格和谐'
    },
    'decorative_change_background_1': {
        'en': 'stunning backdrop',
        'zh': '惊艳背景'
    },
    'decorative_change_background_2': {
        'en': 'environmental beauty',
        'zh': '环境美感'
    },
    'decorative_change_background_3': {
        'en': 'atmospheric depth',
        'zh': '大气深度'
    },
    'decorative_change_background_4': {
        'en': 'cinematic composition',
        'zh': '电影级构图'
    },
    'decorative_enhance_quality_1': {
        'en': 'crystal clear details',
        'zh': '水晶般清晰细节'
    },
    'decorative_enhance_quality_2': {
        'en': 'professional quality',
        'zh': '专业品质'
    },
    'decorative_enhance_quality_3': {
        'en': 'enhanced clarity',
        'zh': '增强清晰度'
    },
    'decorative_enhance_quality_4': {
        'en': 'masterpiece-level refinement',
        'zh': '杰作级精炼'
    },
    'decorative_blur_background_1': {
        'en': 'beautiful bokeh',
        'zh': '美丽虚化'
    },
    'decorative_blur_background_2': {
        'en': 'artistic depth of field',
        'zh': '艺术景深'
    },
    'decorative_blur_background_3': {
        'en': 'professional portrait look',
        'zh': '专业肖像效果'
    },
    'decorative_blur_background_4': {
        'en': 'elegant focus',
        'zh': '优雅焦点'
    },
    'decorative_adjust_lighting_1': {
        'en': 'dramatic illumination',
        'zh': '戏剧性照明'
    },
    'decorative_adjust_lighting_2': {
        'en': 'perfect lighting balance',
        'zh': '完美光照平衡'
    },
    'decorative_adjust_lighting_3': {
        'en': 'dimensional modeling',
        'zh': '立体造型'
    },
    'decorative_adjust_lighting_4': {
        'en': 'cinematic mood',
        'zh': '电影氛围'
    },
    'decorative_resize_object_1': {
        'en': 'perfect proportions',
        'zh': '完美比例'
    },
    'decorative_resize_object_2': {
        'en': 'seamless scaling',
        'zh': '无缝缩放'
    },
    'decorative_resize_object_3': {
        'en': 'optimal size balance',
        'zh': '最佳尺寸平衡'
    },
    'decorative_resize_object_4': {
        'en': 'visually harmonious',
        'zh': '视觉和谐'
    },
    'decorative_enhance_skin_texture_1': {
        'en': 'realistic skin detail',
        'zh': '真实肌肤细节'
    },
    'decorative_enhance_skin_texture_2': {
        'en': 'natural pore structure',
        'zh': '自然毛孔结构'
    },
    'decorative_enhance_skin_texture_3': {
        'en': 'healthy skin appearance',
        'zh': '健康肌肤外观'
    },
    'decorative_enhance_skin_texture_4': {
        'en': 'photorealistic texture',
        'zh': '照片级真实纹理'
    },
    
    // 新增局部编辑修饰性提示词
    'decorative_character_expression_1': {
        'en': 'emotionally engaging',
        'zh': '情感投入'
    },
    'decorative_character_expression_2': {
        'en': 'naturally expressive',
        'zh': '自然表达'
    },
    'decorative_character_expression_3': {
        'en': 'captivating facial features',
        'zh': '迷人面部特征'
    },
    'decorative_character_expression_4': {
        'en': 'authentic human emotion',
        'zh': '真实人类情感'
    },
    'decorative_character_hair_1': {
        'en': 'natural hair flow',
        'zh': '自然发丝流动'
    },
    'decorative_character_hair_2': {
        'en': 'realistic hair texture',
        'zh': '真实发质纹理'
    },
    'decorative_character_hair_3': {
        'en': 'stylistically appropriate',
        'zh': '风格恰当'
    },
    'decorative_character_hair_4': {
        'en': 'professionally styled',
        'zh': '专业造型'
    },
    'decorative_character_accessories_1': {
        'en': 'stylistically matching',
        'zh': '风格匹配'
    },
    'decorative_character_accessories_2': {
        'en': 'perfectly fitted',
        'zh': '完美合身'
    },
    'decorative_character_accessories_3': {
        'en': 'naturally integrated',
        'zh': '自然融合'
    },
    'decorative_character_accessories_4': {
        'en': 'fashion-forward design',
        'zh': '时尚前卫设计'
    },
    
    // 全局编辑修饰性提示词 (G01-G12)
    'decorative_global_color_grade_1': {
        'en': 'cinematic color palette',
        'zh': '电影级调色板'
    },
    'decorative_global_color_grade_2': {
        'en': 'professional grading',
        'zh': '专业调色'
    },
    'decorative_global_color_grade_3': {
        'en': 'rich tonal depth',
        'zh': '丰富色调深度'
    },
    'decorative_global_color_grade_4': {
        'en': 'visually stunning result',
        'zh': '视觉震撼效果'
    },
    'decorative_global_style_transfer_1': {
        'en': 'artistic masterpiece',
        'zh': '艺术杰作'
    },
    'decorative_global_style_transfer_2': {
        'en': 'seamless style adaptation',
        'zh': '无缝风格适配'
    },
    'decorative_global_style_transfer_3': {
        'en': 'visually captivating',
        'zh': '视觉迷人'
    },
    'decorative_global_style_transfer_4': {
        'en': 'sophisticated aesthetic',
        'zh': '精致美学'
    },
    'decorative_global_brightness_contrast_1': {
        'en': 'perfect exposure balance',
        'zh': '完美曝光平衡'
    },
    'decorative_global_brightness_contrast_2': {
        'en': 'dramatic contrast',
        'zh': '戏剧对比'
    },
    'decorative_global_brightness_contrast_3': {
        'en': 'enhanced dynamic range',
        'zh': '增强动态范围'
    },
    'decorative_global_brightness_contrast_4': {
        'en': 'professional quality',
        'zh': '专业品质'
    },
    'decorative_global_hue_saturation_1': {
        'en': 'vibrant yet natural colors',
        'zh': '鲜艳而自然的色彩'
    },
    'decorative_global_hue_saturation_2': {
        'en': 'harmonious palette',
        'zh': '和谐调色板'
    },
    'decorative_global_hue_saturation_3': {
        'en': 'rich saturation',
        'zh': '丰富饱和度'
    },
    'decorative_global_hue_saturation_4': {
        'en': 'color-accurate result',
        'zh': '色彩准确结果'
    },
    'decorative_global_sharpen_blur_1': {
        'en': 'crystal clear sharpness',
        'zh': '水晶般清晰锐度'
    },
    'decorative_global_sharpen_blur_2': {
        'en': 'artistic blur effect',
        'zh': '艺术模糊效果'
    },
    'decorative_global_sharpen_blur_3': {
        'en': 'enhanced clarity',
        'zh': '增强清晰度'
    },
    'decorative_global_sharpen_blur_4': {
        'en': 'professional processing',
        'zh': '专业处理'
    },
    'decorative_global_noise_reduction_1': {
        'en': 'clean smooth result',
        'zh': '干净平滑效果'
    },
    'decorative_global_noise_reduction_2': {
        'en': 'artifact-free image',
        'zh': '无伪影图像'
    },
    'decorative_global_noise_reduction_3': {
        'en': 'pristine quality',
        'zh': '纯净品质'
    },
    'decorative_global_noise_reduction_4': {
        'en': 'professional cleanup',
        'zh': '专业清理'
    },
    'decorative_global_enhance_1': {
        'en': 'stunning visual impact',
        'zh': '惊艳视觉冲击'
    },
    'decorative_global_enhance_2': {
        'en': 'enhanced beauty',
        'zh': '增强美感'
    },
    'decorative_global_enhance_3': {
        'en': 'masterpiece quality',
        'zh': '杰作品质'
    },
    'decorative_global_enhance_4': {
        'en': 'professional refinement',
        'zh': '专业精炼'
    },
    'decorative_global_filter_1': {
        'en': 'artistic filter effect',
        'zh': '艺术滤镜效果'
    },
    'decorative_global_filter_2': {
        'en': 'stylistic enhancement',
        'zh': '风格增强'
    },
    'decorative_global_filter_3': {
        'en': 'creative transformation',
        'zh': '创意变换'
    },
    'decorative_global_filter_4': {
        'en': 'visually appealing',
        'zh': '视觉吸引'
    },
    
    // 遗漏的局部编辑修饰性提示词
    'decorative_zoom_focus_1': {
        'en': 'dramatic focus enhancement',
        'zh': '戏剧性焦点增强'
    },
    'decorative_zoom_focus_2': {
        'en': 'cinematic depth',
        'zh': '电影级景深'
    },
    'decorative_zoom_focus_3': {
        'en': 'professional zoom quality',
        'zh': '专业缩放质量'
    },
    'decorative_zoom_focus_4': {
        'en': 'artistic magnification',
        'zh': '艺术放大'
    },
    'decorative_stylize_local_1': {
        'en': 'artistic style enhancement',
        'zh': '艺术风格增强'
    },
    'decorative_stylize_local_2': {
        'en': 'creative transformation',
        'zh': '创意变换'
    },
    'decorative_stylize_local_3': {
        'en': 'unique artistic flair',
        'zh': '独特艺术风格'
    },
    'decorative_stylize_local_4': {
        'en': 'stylized perfection',
        'zh': '风格化完美'
    },
    'decorative_custom_1': {
        'en': 'personalized enhancement',
        'zh': '个性化增强'
    },
    'decorative_custom_2': {
        'en': 'creative freedom',
        'zh': '创意自由'
    },
    'decorative_custom_3': {
        'en': 'unique artistic vision',
        'zh': '独特艺术视野'
    },
    'decorative_custom_4': {
        'en': 'customized perfection',
        'zh': '定制完美'
    },
    
    // 标签页翻译
    'tab_layers': {
        'en': '🔴 Local Editing',
        'zh': '🔴 局部编辑'
    },
    'tab_controls': {
        'en': '🎛️ Global Editing',
        'zh': '🎛️ 全局编辑'
    },
    'tab_ai_enhancer': {
        'en': '🤖 AI Enhancer',
        'zh': '🤖 AI增强'
    },
    
    // AI增强器相关翻译
    'ai_select_enhancer': {
        'en': '🚀 Select Enhancer',
        'zh': '🚀 选择增强器'
    },
    'ai_edit_description': {
        'en': '✏️ Edit Description',
        'zh': '✏️ 编辑描述'
    },
    'ai_parameter_settings': {
        'en': '🎛️ Parameter Settings',
        'zh': '🎛️ 参数设置'
    },
    'ai_enhancer_api': {
        'en': 'API Cloud',
        'zh': 'API云端'
    },
    'ai_enhancer_ollama': {
        'en': 'Ollama Local',
        'zh': 'Ollama本地'
    },
    'ai_enhancer_textgen': {
        'en': 'TextGen',
        'zh': 'TextGen'
    },
    'ai_edit_intent': {
        'en': 'Edit Intent',
        'zh': '编辑意图'
    },
    'ai_processing_style': {
        'en': 'Processing Style',
        'zh': '处理风格'
    },
    'ai_temperature': {
        'en': 'Temperature',
        'zh': 'Temperature'
    },
    'ai_random_seed': {
        'en': 'Random Seed',
        'zh': '随机种子'
    },
    'ai_generate_prompt': {
        'en': '🚀 Generate Prompt',
        'zh': '🚀 生成提示词'
    },
    'ai_prompt_preview': {
        'en': '📝 Prompt Preview',
        'zh': '📝 提示词预览'
    },
    'ai_regenerate': {
        'en': '🔄 Regenerate',
        'zh': '🔄 重新生成'
    },
    'ai_confirm_apply': {
        'en': '✅ Confirm Apply',
        'zh': '✅ 确认应用'
    },
    'ai_placeholder_description': {
        'en': 'Describe the editing effect you want...',
        'zh': '描述您想要的编辑效果...'
    },
    'ai_prompt_placeholder': {
        'en': 'Click "🚀 Generate Prompt" to start generating professional prompts...',
        'zh': '点击"🚀 生成提示词"按钮开始生成专业提示词...'
    },
    'ai_status_pending': {
        'en': 'Pending',
        'zh': '待生成'
    },
    'ai_intent_change_color': {
        'en': 'Change Color',
        'zh': '改变颜色'
    },
    'ai_intent_replace_object': {
        'en': 'Replace Object',
        'zh': '替换对象'
    },
    'ai_intent_remove_object': {
        'en': 'Remove Object',
        'zh': '移除对象'
    },
    'ai_intent_add_object': {
        'en': 'Add Object',
        'zh': '添加对象'
    },
    'ai_intent_change_style': {
        'en': 'Change Style',
        'zh': '改变风格'
    },
    'ai_intent_enhance_quality': {
        'en': 'Enhance Quality',
        'zh': '增强质量'
    },
    'ai_style_natural': {
        'en': 'Natural Realistic',
        'zh': '自然真实'
    },
    'ai_style_artistic': {
        'en': 'Artistic Creative',
        'zh': '艺术创意'
    },
    'ai_style_technical': {
        'en': 'Technical Precise',
        'zh': '技术精确'
    },
    'ai_temp_conservative': {
        'en': '0.3 (Conservative)',
        'zh': '0.3 (保守)'
    },
    'ai_temp_creative': {
        'en': '0.7 (Creative)',
        'zh': '0.7 (创意)'
    },
    'ai_temp_random': {
        'en': '0.9 (Random)',
        'zh': '0.9 (随机)'
    },
    'ai_temp_maximum': {
        'en': '1.0 (Maximum)',
        'zh': '1.0 (最大)'
    },
    'ai_seed_default': {
        'en': '42 (Default)',
        'zh': '42 (默认)'
    },
    'ai_seed_random': {
        'en': 'Random (-1)',
        'zh': '随机 (-1)'
    },
    
    // AI增强器 - 编辑意图
    'ai_intent_general_editing': {
        'en': 'General Editing',
        'zh': '通用编辑'
    },
    'ai_intent_product_showcase': {
        'en': 'Product Showcase',
        'zh': '产品展示优化'
    },
    'ai_intent_portrait_enhancement': {
        'en': 'Portrait Enhancement',
        'zh': '人像美化'
    },
    'ai_intent_creative_design': {
        'en': 'Creative Design',
        'zh': '创意设计'
    },
    'ai_intent_architectural_photo': {
        'en': 'Architectural Photo',
        'zh': '建筑摄影'
    },
    'ai_intent_food_styling': {
        'en': 'Food Styling',
        'zh': '美食摄影'
    },
    'ai_intent_fashion_retail': {
        'en': 'Fashion Retail',
        'zh': '时尚零售'
    },
    'ai_intent_landscape_nature': {
        'en': 'Landscape Nature',
        'zh': '风景自然'
    },
    'ai_intent_professional_editing': {
        'en': 'Professional Editing',
        'zh': '专业图像编辑'
    },
    'ai_intent_custom': {
        'en': 'Custom',
        'zh': '自定义'
    },
    
    // AI增强器 - 处理风格
    'ai_style_auto_smart': {
        'en': 'Auto Smart',
        'zh': '智能自动'
    },
    'ai_style_efficient_fast': {
        'en': 'Efficient Fast',
        'zh': '高效快速'
    },
    'ai_style_creative_artistic': {
        'en': 'Creative Artistic',
        'zh': '创意艺术'
    },
    'ai_style_precise_technical': {
        'en': 'Precise Technical',
        'zh': '精确技术'
    },
    'ai_style_custom_guidance': {
        'en': 'Custom Guidance',
        'zh': '自定义指引'
    },
    
    // API配置占位符
    'api_key_placeholder': {
        'en': 'Enter your API Key',
        'zh': '输入您的API Key'
    },
    'ollama_url_placeholder': {
        'en': 'http://localhost:11434',
        'zh': 'http://localhost:11434'
    },
    'textgen_url_placeholder': {
        'en': 'http://localhost:5000',
        'zh': 'http://localhost:5000'
    },
    
    // 🆕 局部编辑提示词生成功能
    'btn_generate_local_prompt': {
        'en': '🎯 Generate Local Edit Prompt',
        'zh': '🎯 生成局部编辑提示词'
    },
    'generated_description': {
        'en': '🤖 Generated Description',
        'zh': '🤖 生成的描述'
    },
    'placeholder_generated_description': {
        'en': 'Generated local editing description will appear here...',
        'zh': '生成的局部编辑描述将显示在这里...'
    },
    'btn_copy': {
        'en': '📋 Copy',
        'zh': '📋 复制'
    },
    'btn_apply': {
        'en': '✅ Apply',
        'zh': '✅ 应用'
    }
};

// 当前语言设置
let currentLanguage = 'en';

/**
 * 获取当前语言
 */
export function getCurrentLanguage() {
    return currentLanguage;
}

/**
 * 设置当前语言
 */
export function setCurrentLanguage(lang) {
    if (lang in LANGUAGES) {
        currentLanguage = lang;
        localStorage.setItem('vpe_language', lang);
    }
}

/**
 * 从本地存储加载语言设置
 */
export function loadLanguageFromStorage() {
    const saved = localStorage.getItem('vpe_language');
    if (saved && saved in LANGUAGES) {
        currentLanguage = saved;
    }
}

/**
 * 获取文本翻译
 */
export function t(key, defaultText = '') {
    const translations = I18N_TEXTS[key];
    if (translations && translations[currentLanguage]) {
        return translations[currentLanguage];
    }
    return defaultText || key;
}

/**
 * 切换语言
 */
export function toggleLanguage() {
    const newLang = currentLanguage === 'en' ? 'zh' : 'en';
    setCurrentLanguage(newLang);
    return newLang;
}

/**
 * 更新所有UI文本
 */
export function updateAllUITexts(modal) {
    if (!modal) return;
    
    const elements = modal.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const text = t(key);
        if (text !== key) {
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = text;
            } else if (element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else if (element.hasAttribute('title')) {
                element.title = text;
            } else {
                element.textContent = text;
            }
        }
    });
    
    const elementsWithTitle = modal.querySelectorAll('[data-i18n-title]');
    elementsWithTitle.forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const text = t(key);
        if (text !== key) {
            element.title = text;
        }
    });
    
    const elementsWithPlaceholder = modal.querySelectorAll('[data-i18n-placeholder]');
    elementsWithPlaceholder.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const text = t(key);
        if (text !== key) {
            element.placeholder = text;
        }
    });
    
    const selectionCount = modal.querySelector('#selection-count');
    if (selectionCount) {
        const count = selectionCount.textContent.match(/\d+/);
        if (count) {
            selectionCount.textContent = `${count[0]} ${t('selection_count')}`;
        }
    }
    
    const selectElements = modal.querySelectorAll('select');
    selectElements.forEach(select => {
        const options = select.querySelectorAll('option[data-i18n]');
        options.forEach(option => {
            const key = option.getAttribute('data-i18n');
            const text = t(key);
            if (text !== key) {
                option.textContent = text;
            }
        });
    });
}

// === Translation utilities (merged from translation_utils.js) ===

/**
 * 安全的翻译函数包装器
 * 提供错误处理和回退机制
 * @param {string} key - 翻译键
 * @param {string} fallback - 回退文本
 * @returns {string} 翻译后的文本或回退文本
 */
export const safeT = (key, fallback) => {
    try {
        if (typeof t === 'function') {
            const result = t(key);
            return result !== key ? result : (fallback || key);
        }
        return fallback || key;
    } catch (e) {
        console.warn('Translation error for key:', key, e);
        return fallback || key;
    }
};

/**
 * 翻译操作类型
 * @param {string} operationType - 操作类型
 * @returns {string} 翻译后的操作类型
 */
export const translateOperationType = (operationType) => {
    const operationKey = `op_${operationType}`;
    return safeT(operationKey, operationType);
};

/**
 * 翻译形状类型  
 * @param {string} shapeType - 形状类型
 * @returns {string} 翻译后的形状类型
 */
export const translateShapeType = (shapeType) => {
    const shapeKey = `shape_${shapeType}`;
    return safeT(shapeKey, shapeType);
};

// === Language Event Handling (merged from language.js) ===

/**
 * 初始化语言系统
 */
export function initializeLanguageSystem(modal) {
    // 加载保存的语言设置
    loadLanguageFromStorage();
    
    // 初始化语言切换按钮
    const languageToggle = modal.querySelector('#vpe-language-toggle');
    if (languageToggle) {
        languageToggle.addEventListener('click', () => {
            const newLang = toggleLanguage();
            
            // 强制更新所有UI文本
            updateAllUITexts(modal);
            
            // 强制重新生成动态内容
            forceDynamicContentRefresh(modal);
            
            // 显示切换提示
            showLanguageChangeNotification(newLang);
        });
        
        languageToggle.addEventListener('mouseenter', () => {
            languageToggle.style.transform = 'translateY(-1px)';
            languageToggle.style.boxShadow = '0 4px 8px rgba(33, 150, 243, 0.3)';
        });
        
        languageToggle.addEventListener('mouseleave', () => {
            languageToggle.style.transform = 'translateY(0)';
            languageToggle.style.boxShadow = 'none';
        });
    }
    
    // 初始化UI文本
    updateAllUITexts(modal);
}

/**
 * 显示语言切换通知
 */
function showLanguageChangeNotification(language) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2196F3;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 30000;
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        animation: slideInRight 0.3s ease-out;
    `;
    
    const langText = language === 'en' ? 'English' : '中文';
    notification.textContent = `🌐 Language switched to ${langText}`;
    
    if (!document.getElementById('language-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'language-notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * 更新语言切换按钮文本
 */
export function updateLanguageToggleButton(modal) {
    const languageToggle = modal.querySelector('#vpe-language-toggle');
    if (languageToggle) {
        const currentLang = getCurrentLanguage();
        languageToggle.textContent = t('language_switch');
        languageToggle.title = currentLang === 'en' ? 'Switch to Chinese' : '切换到英文';
    }
}

/**
 * 获取当前语言的占位符文本
 */
export function getPlaceholderText(key) {
    return t(key);
}

/**
 * 更新下拉选项文本
 */
export function updateSelectOptions(modal) {
    const operationSelect = modal.querySelector('#current-layer-operation');
    if (operationSelect) {
        const options = operationSelect.querySelectorAll('option');
        options.forEach(option => {
            const value = option.value;
            const textKey = `op_${value}`;
            const translatedText = t(textKey);
            if (translatedText !== textKey) {
                option.textContent = translatedText;
            }
        });
    }
    
    const templateSelect = modal.querySelector('#template-category');
    if (templateSelect) {
        const options = templateSelect.querySelectorAll('option');
        options.forEach(option => {
            const value = option.value;
            const textKey = `template_${value}`;
            const translatedText = t(textKey);
            if (translatedText !== textKey) {
                option.textContent = translatedText;
            }
        });
    }
    
    const editIntentSelect = modal.querySelector('#edit-intent');
    if (editIntentSelect) {
        const options = editIntentSelect.querySelectorAll('option');
        options.forEach(option => {
            const value = option.value;
            const textKey = `ai_intent_${value}`;
            const translatedText = t(textKey);
            if (translatedText !== textKey) {
                option.textContent = translatedText;
            }
        });
    }
    
    const processingStyleSelect = modal.querySelector('#processing-style');
    if (processingStyleSelect) {
        const options = processingStyleSelect.querySelectorAll('option');
        options.forEach(option => {
            const value = option.value;
            const textKey = `ai_style_${value}`;
            const translatedText = t(textKey);
            if (translatedText !== textKey) {
                option.textContent = translatedText;
            }
        });
    }
    
    const temperatureSelect = modal.querySelector('#temperature');
    if (temperatureSelect) {
        const options = temperatureSelect.querySelectorAll('option');
        options.forEach(option => {
            const dataI18n = option.getAttribute('data-i18n');
            if (dataI18n) {
                const translatedText = t(dataI18n);
                if (translatedText !== dataI18n) {
                    option.textContent = translatedText;
                }
            }
        });
    }
    
    const seedSelect = modal.querySelector('#seed');
    if (seedSelect) {
        const options = seedSelect.querySelectorAll('option');
        options.forEach(option => {
            const dataI18n = option.getAttribute('data-i18n');
            if (dataI18n) {
                const translatedText = t(dataI18n);
                if (translatedText !== dataI18n) {
                    option.textContent = translatedText;
                }
            }
        });
    }
}

/**
 * 更新动态文本内容
 */
export function updateDynamicTexts(modal) {
    const selectionCount = modal.querySelector('#selection-count');
    if (selectionCount) {
        const count = selectionCount.textContent.match(/\d+/);
        if (count) {
            selectionCount.textContent = `${count[0]} ${t('selection_count')}`;
        }
    }
    
    const placeholderElements = [
        { selector: '#dropdown-text', key: 'placeholder_select_layers' },
        { selector: '#current-layer-description', key: 'placeholder_layer_description' },
        { selector: '#target-input', key: 'placeholder_target_input' },
        { selector: '#generated-description', key: 'placeholder_generated_description' }
    ];
    
    placeholderElements.forEach(({ selector, key }) => {
        const element = modal.querySelector(selector);
        if (element) {
            const placeholderText = t(key);
            if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                element.placeholder = placeholderText;
            } else {
                element.textContent = placeholderText;
            }
        }
    });
}

/**
 * 强制刷新动态内容
 */
function forceDynamicContentRefresh(modal) {
    // 重新生成图层列表以使用新的翻译
    try {
        // 导入必要的函数（在运行时导入避免循环依赖）
        if (window.updateObjectSelector && typeof window.updateObjectSelector === 'function') {
            window.updateObjectSelector(modal);
        }
    } catch (e) {
        console.warn('Error updating layer list:', e);
    }
    
    updateSelectOptions(modal);
    updateDynamicTexts(modal);
    
    // 强制更新所有带有计数的元素
    const countElements = modal.querySelectorAll('[id*="count"], [class*="count"]');
    countElements.forEach(element => {
        const text = element.textContent;
        const numberMatch = text.match(/(\d+)/);
        if (numberMatch) {
            const number = numberMatch[1];
            const translatedText = `${number} ${t('selected_count')}`;
            element.textContent = translatedText;
        }
    });
}

/**
 * 完整的UI更新函数
 */
export function updateCompleteUI(modal) {
    updateAllUITexts(modal);
    updateLanguageToggleButton(modal);
    updateSelectOptions(modal);
    updateDynamicTexts(modal);
}
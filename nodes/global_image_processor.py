"""
Global Image Processor Node
Global Image Processor Node - For image enhancement, desaturation, style transfer and other global operations

支持多种全图处理模式：
- 高清化 (Upscaling)
- 去色/单色化 (Desaturation/Monochrome)
- 色彩调整 (Color Adjustment)
- 风格转换 (Style Transfer)
- 锐化/模糊 (Sharpening/Blur)
- 噪点处理 (Noise Processing)
"""

import json
import numpy as np
import torch
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

try:
    import comfy.model_management as model_management
    from nodes import MAX_RESOLUTION
    COMFY_AVAILABLE = True
except ImportError:
    COMFY_AVAILABLE = False
    MAX_RESOLUTION = 8192

class GlobalImageProcessor:
    """全图处理节点 - 高清化、去色、风格转换等操作"""
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "processing_mode": ([
                    "enhance_quality",     # 质量增强
                    "upscale_2x",         # 2倍放大
                    "upscale_4x",         # 4倍放大
                    "desaturate",         # 去色
                    "monochrome_warm",    # 暖色单色
                    "monochrome_cool",    # 冷色单色
                    "vintage_film",       # 胶片风格
                    "high_contrast",      # 高对比度
                    "soft_blur",          # 柔和模糊
                    "sharpen",            # 锐化
                    "denoise",            # 降噪
                    "color_pop",          # 色彩增强
                    "dramatic_lighting",  # 戏剧性光线
                    "custom"              # 自定义
                ], {"default": "enhance_quality"}),
            },
            "optional": {
                "strength": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 2.0, "step": 0.1, "tooltip": "Processing strength"}),
                "custom_params": ("STRING", {"multiline": True, "default": "", "tooltip": "Custom parameters JSON"}),
                "preserve_details": ("BOOLEAN", {"default": True, "tooltip": "Preserve details"}),
                "clip": ("CLIP", {"tooltip": "Optional: CLIP model for style understanding"}),
                "guidance": ("FLOAT", {"default": 7.5, "min": 0.0, "max": 20.0, "step": 0.1, "tooltip": "Guidance strength"}),
            }
        }
    
    RETURN_TYPES = ("IMAGE", "STRING", "STRING", "CONDITIONING", "STRING")
    RETURN_NAMES = (
        "processed_image",
        "processing_metadata", 
        "suggested_prompt",
        "conditioning",
        "processing_log"
    )
    FUNCTION = "process_global_image"
    CATEGORY = "kontext/global"
    DESCRIPTION = "Global Image Processor Node: Image enhancement, desaturation, style transfer and other global operations, supports multiple preset modes and custom parameters"
    
    def process_global_image(self, image: torch.Tensor, processing_mode: str = "enhance_quality",
                           strength: float = 1.0, custom_params: str = "", preserve_details: bool = True,
                           clip=None, guidance: float = 7.5):
        """全图处理主函数"""
        
        try:
            # 解析自定义参数
            custom_settings = {}
            if custom_params.strip():
                try:
                    custom_settings = json.loads(custom_params)
                except json.JSONDecodeError:
                    custom_settings = {}
            
            # 执行图像处理
            processed_image, processing_info = self._apply_processing(
                image, processing_mode, strength, custom_settings, preserve_details
            )
            
            # 生成建议的提示词
            suggested_prompt = self._generate_prompt_for_mode(processing_mode, strength)
            
            # 创建conditioning（如果有CLIP）
            if clip is not None:
                conditioning = self._create_conditioning(clip, suggested_prompt, guidance)
            else:
                conditioning = self._create_fallback_conditioning(suggested_prompt, guidance)
            
            # 创建处理元数据
            metadata = {
                "processing_mode": processing_mode,
                "strength": strength,
                "preserve_details": preserve_details,
                "guidance": guidance,
                "custom_params": custom_settings,
                "processing_info": processing_info,
                "timestamp": datetime.now().isoformat()
            }
            
            # 创建处理日志
            log = self._create_processing_log(processing_mode, processing_info, strength)
            
            return (
                processed_image,
                json.dumps(metadata, indent=2),
                suggested_prompt,
                conditioning,
                log
            )
            
        except Exception as e:
            return self._create_fallback_output(image, str(e))
    
    def _apply_processing(self, image: torch.Tensor, mode: str, strength: float, 
                         custom_settings: dict, preserve_details: bool) -> Tuple[torch.Tensor, dict]:
        """应用图像处理"""
        
        try:
            from PIL import Image, ImageEnhance, ImageFilter
            import cv2
            
            # 转换为PIL图像
            if len(image.shape) == 4:
                img_array = image[0].cpu().numpy()
            else:
                img_array = image.cpu().numpy()
                
            if img_array.max() <= 1.0:
                img_array = (img_array * 255).astype(np.uint8)
            else:
                img_array = img_array.astype(np.uint8)
                
            pil_image = Image.fromarray(img_array, 'RGB')
            original_size = pil_image.size
            
            processing_info = {
                "original_size": original_size,
                "mode": mode,
                "strength": strength
            }
            
            # 根据模式进行处理
            if mode == "enhance_quality":
                processed_pil = self._enhance_quality(pil_image, strength, preserve_details)
                processing_info["enhancement"] = "quality_boost"
                
            elif mode in ["upscale_2x", "upscale_4x"]:
                scale_factor = 2 if mode == "upscale_2x" else 4
                processed_pil = self._upscale_image(pil_image, scale_factor, preserve_details)
                processing_info["scale_factor"] = scale_factor
                processing_info["new_size"] = processed_pil.size
                
            elif mode == "desaturate":
                processed_pil = self._desaturate_image(pil_image, strength)
                processing_info["saturation_level"] = 1.0 - strength
                
            elif mode in ["monochrome_warm", "monochrome_cool"]:
                processed_pil = self._apply_monochrome(pil_image, mode, strength)
                processing_info["monochrome_type"] = mode
                
            elif mode == "vintage_film":
                processed_pil = self._apply_vintage_film(pil_image, strength)
                processing_info["vintage_intensity"] = strength
                
            elif mode == "high_contrast":
                processed_pil = self._apply_high_contrast(pil_image, strength)
                processing_info["contrast_boost"] = strength
                
            elif mode == "soft_blur":
                processed_pil = self._apply_soft_blur(pil_image, strength)
                processing_info["blur_radius"] = strength * 2
                
            elif mode == "sharpen":
                processed_pil = self._apply_sharpen(pil_image, strength)
                processing_info["sharpen_factor"] = strength
                
            elif mode == "denoise":
                processed_pil = self._apply_denoise(pil_image, strength)
                processing_info["denoise_level"] = strength
                
            elif mode == "color_pop":
                processed_pil = self._apply_color_pop(pil_image, strength)
                processing_info["saturation_boost"] = strength
                
            elif mode == "dramatic_lighting":
                processed_pil = self._apply_dramatic_lighting(pil_image, strength)
                processing_info["lighting_intensity"] = strength
                
            elif mode == "custom":
                processed_pil = self._apply_custom_processing(pil_image, custom_settings, strength)
                processing_info["custom_applied"] = custom_settings
                
            else:
                processed_pil = pil_image
                processing_info["warning"] = f"Unknown mode: {mode}"
            
            # 转换回torch tensor
            processed_array = np.array(processed_pil)
            processed_tensor = torch.from_numpy(processed_array).float() / 255.0
            
            # 保持原始维度
            if len(image.shape) == 4:
                processed_tensor = processed_tensor.unsqueeze(0)
                
            return processed_tensor, processing_info
            
        except Exception as e:
            # 如果处理失败，返回原图
            processing_info = {"error": str(e), "fallback": "original_image"}
            return image, processing_info
    
    def _enhance_quality(self, image: Image.Image, strength: float, preserve_details: bool) -> Image.Image:
        """质量增强"""
        # 锐化
        sharpness = ImageEnhance.Sharpness(image)
        image = sharpness.enhance(1.0 + strength * 0.3)
        
        # 对比度增强
        contrast = ImageEnhance.Contrast(image)
        image = contrast.enhance(1.0 + strength * 0.2)
        
        # 色彩饱和度
        color = ImageEnhance.Color(image)
        image = color.enhance(1.0 + strength * 0.1)
        
        return image
    
    def _upscale_image(self, image: Image.Image, scale_factor: int, preserve_details: bool) -> Image.Image:
        """图像放大"""
        width, height = image.size
        new_size = (width * scale_factor, height * scale_factor)
        
        # 使用LANCZOS算法进行高质量放大
        if preserve_details:
            upscaled = image.resize(new_size, Image.Resampling.LANCZOS)
            # 后处理锐化
            sharpness = ImageEnhance.Sharpness(upscaled)
            upscaled = sharpness.enhance(1.1)
        else:
            upscaled = image.resize(new_size, Image.Resampling.BICUBIC)
            
        return upscaled
    
    def _desaturate_image(self, image: Image.Image, strength: float) -> Image.Image:
        """去色处理"""
        # 转换为灰度然后混合
        grayscale = image.convert('L').convert('RGB')
        
        # 混合原图和灰度图
        if strength >= 1.0:
            return grayscale
        else:
            return Image.blend(image, grayscale, strength)
    
    def _apply_monochrome(self, image: Image.Image, mode: str, strength: float) -> Image.Image:
        """单色化处理"""
        import numpy as np
        
        img_array = np.array(image)
        
        if mode == "monochrome_warm":
            # 暖色调：偏黄褐色
            tint_color = np.array([1.0, 0.95, 0.8])
        else:  # monochrome_cool
            # 冷色调：偏蓝色
            tint_color = np.array([0.8, 0.95, 1.0])
        
        # 转为灰度
        gray = np.dot(img_array[...,:3], [0.299, 0.587, 0.114])
        
        # 应用色调
        tinted = np.stack([gray * tint_color[0], gray * tint_color[1], gray * tint_color[2]], axis=2)
        tinted = np.clip(tinted, 0, 255).astype(np.uint8)
        
        result = Image.fromarray(tinted)
        
        # 混合强度
        return Image.blend(image, result, strength)
    
    def _apply_vintage_film(self, image: Image.Image, strength: float) -> Image.Image:
        """胶片风格"""
        # 降低对比度
        contrast = ImageEnhance.Contrast(image)
        image = contrast.enhance(0.9)
        
        # 增加暖色调
        import numpy as np
        img_array = np.array(image).astype(np.float32)
        
        # 胶片色调调整
        img_array[:,:,0] *= 1.1  # 增加红色
        img_array[:,:,1] *= 1.05  # 略增绿色
        img_array[:,:,2] *= 0.95  # 减少蓝色
        
        img_array = np.clip(img_array, 0, 255).astype(np.uint8)
        result = Image.fromarray(img_array)
        
        # 添加轻微模糊
        result = result.filter(ImageFilter.GaussianBlur(radius=0.5 * strength))
        
        return Image.blend(image, result, strength)
    
    def _apply_high_contrast(self, image: Image.Image, strength: float) -> Image.Image:
        """高对比度"""
        contrast = ImageEnhance.Contrast(image)
        return contrast.enhance(1.0 + strength * 0.8)
    
    def _apply_soft_blur(self, image: Image.Image, strength: float) -> Image.Image:
        """柔和模糊"""
        radius = strength * 2.0
        return image.filter(ImageFilter.GaussianBlur(radius=radius))
    
    def _apply_sharpen(self, image: Image.Image, strength: float) -> Image.Image:
        """锐化"""
        sharpness = ImageEnhance.Sharpness(image)
        return sharpness.enhance(1.0 + strength * 0.5)
    
    def _apply_denoise(self, image: Image.Image, strength: float) -> Image.Image:
        """降噪"""
        # 使用双边滤波降噪
        try:
            import cv2
            img_array = np.array(image)
            
            # 双边滤波参数
            d = int(5 + strength * 5)  # 邻域直径
            sigma_color = 50 + strength * 50  # 颜色空间标准差
            sigma_space = 50 + strength * 50  # 坐标空间标准差
            
            denoised = cv2.bilateralFilter(img_array, d, sigma_color, sigma_space)
            return Image.fromarray(denoised)
        except:
            # 如果没有OpenCV，使用简单的模糊
            return image.filter(ImageFilter.GaussianBlur(radius=strength * 0.5))
    
    def _apply_color_pop(self, image: Image.Image, strength: float) -> Image.Image:
        """色彩增强"""
        # 增加饱和度
        color = ImageEnhance.Color(image)
        image = color.enhance(1.0 + strength * 0.4)
        
        # 轻微增加对比度
        contrast = ImageEnhance.Contrast(image)
        image = contrast.enhance(1.0 + strength * 0.2)
        
        return image
    
    def _apply_dramatic_lighting(self, image: Image.Image, strength: float) -> Image.Image:
        """戏剧性光线"""
        import numpy as np
        
        img_array = np.array(image).astype(np.float32)
        
        # 增加对比度
        img_array = (img_array - 128) * (1.0 + strength * 0.5) + 128
        
        # 创建渐晕效果
        h, w = img_array.shape[:2]
        center_x, center_y = w // 2, h // 2
        
        y, x = np.ogrid[:h, :w]
        distance = np.sqrt((x - center_x)**2 + (y - center_y)**2)
        max_distance = np.sqrt(center_x**2 + center_y**2)
        
        # 渐晕遮罩
        vignette = 1.0 - (distance / max_distance) * strength * 0.3
        vignette = np.clip(vignette, 0.7, 1.0)
        
        # 应用渐晕
        for i in range(3):
            img_array[:,:,i] *= vignette
            
        img_array = np.clip(img_array, 0, 255).astype(np.uint8)
        return Image.fromarray(img_array)
    
    def _apply_custom_processing(self, image: Image.Image, custom_settings: dict, strength: float) -> Image.Image:
        """自定义处理"""
        processed = image
        
        # 支持的自定义参数
        if "brightness" in custom_settings:
            brightness = ImageEnhance.Brightness(processed)
            processed = brightness.enhance(custom_settings["brightness"] * strength)
            
        if "contrast" in custom_settings:
            contrast = ImageEnhance.Contrast(processed)
            processed = contrast.enhance(custom_settings["contrast"] * strength)
            
        if "saturation" in custom_settings:
            color = ImageEnhance.Color(processed)
            processed = color.enhance(custom_settings["saturation"] * strength)
            
        if "sharpness" in custom_settings:
            sharpness = ImageEnhance.Sharpness(processed)
            processed = sharpness.enhance(custom_settings["sharpness"] * strength)
            
        if "blur_radius" in custom_settings:
            radius = custom_settings["blur_radius"] * strength
            processed = processed.filter(ImageFilter.GaussianBlur(radius=radius))
            
        return processed
    
    def _generate_prompt_for_mode(self, mode: str, strength: float) -> str:
        """根据处理模式生成建议的提示词"""
        
        prompts = {
            "enhance_quality": "high quality, enhanced details, sharp focus, professional photography",
            "upscale_2x": "high resolution, detailed, crisp, upscaled image, enhanced quality",
            "upscale_4x": "ultra high resolution, extremely detailed, crystal clear, 4K quality",
            "desaturate": "monochrome, black and white, artistic, dramatic mood",
            "monochrome_warm": "sepia tone, warm monochrome, vintage aesthetic, nostalgic mood",
            "monochrome_cool": "cool monochrome, blue tint, modern artistic style, dramatic atmosphere",
            "vintage_film": "vintage film photography, analog aesthetic, retro style, film grain",
            "high_contrast": "high contrast, dramatic lighting, bold shadows, striking visual impact",
            "soft_blur": "soft focus, dreamy atmosphere, gentle blur, artistic bokeh effect",
            "sharpen": "sharp focus, crisp details, enhanced clarity, professional sharpness",
            "denoise": "clean image, smooth texture, noise-free, professional quality",
            "color_pop": "vibrant colors, enhanced saturation, vivid hues, colorful and bright",
            "dramatic_lighting": "dramatic lighting, cinematic mood, strong shadows, artistic illumination",
            "custom": "custom processed image, artistic enhancement, creative editing"
        }
        
        base_prompt = prompts.get(mode, "processed image")
        
        # 根据强度调整
        if strength > 1.5:
            base_prompt += ", intense effect, bold artistic vision"
        elif strength > 1.0:
            base_prompt += ", enhanced effect, strong artistic style"
        elif strength < 0.5:
            base_prompt += ", subtle effect, gentle enhancement"
            
        return base_prompt
    
    def _create_conditioning(self, clip, prompt: str, guidance: float):
        """创建CLIP conditioning"""
        try:
            tokens = clip.tokenize(prompt)
            cond, pooled = clip.encode_from_tokens(tokens, return_pooled=True)
            return [[cond, {"pooled_output": pooled, "guidance": guidance}]]
        except Exception as e:
            return self._create_fallback_conditioning(prompt, guidance)
    
    def _create_fallback_conditioning(self, prompt: str, guidance: float):
        """创建fallback conditioning"""
        return [{
            "model_cond": prompt,
            "guidance": guidance,
            "type": "global_processing",
            "timestamp": datetime.now().isoformat()
        }]
    
    def _create_processing_log(self, mode: str, processing_info: dict, strength: float) -> str:
        """创建处理日志"""
        log_lines = [
            f"Global Image Processing Log",
            f"=" * 40,
            f"Mode: {mode}",
            f"Strength: {strength}",
            f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        ]
        
        if "original_size" in processing_info:
            log_lines.append(f"Original Size: {processing_info['original_size']}")
            
        if "new_size" in processing_info:
            log_lines.append(f"New Size: {processing_info['new_size']}")
            
        if "error" in processing_info:
            log_lines.append(f"Error: {processing_info['error']}")
            
        for key, value in processing_info.items():
            if key not in ["original_size", "new_size", "error"]:
                log_lines.append(f"{key.replace('_', ' ').title()}: {value}")
                
        return "\n".join(log_lines)
    
    def _create_fallback_output(self, image: torch.Tensor, error_msg: str):
        """创建fallback输出"""
        fallback_metadata = {
            "status": "error",
            "error": error_msg,
            "timestamp": datetime.now().isoformat()
        }
        
        fallback_conditioning = [{
            "model_cond": "error in global processing",
            "type": "fallback"
        }]
        
        return (
            image,
            json.dumps(fallback_metadata),
            "error in processing",
            [fallback_conditioning],
            f"Error: {error_msg}"
        )

# Node registration
NODE_CLASS_MAPPINGS = {
    "GlobalImageProcessor": GlobalImageProcessor,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "GlobalImageProcessor": "🌍 Global Image Processor",
}
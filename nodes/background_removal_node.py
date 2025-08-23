#!/usr/bin/env python3
"""
高质量背景移除节点
使用rembg进行专业级背景移除
"""

import torch
import numpy as np
from PIL import Image, ImageOps
import io

try:
    from .rembg_api import get_processor
except ImportError:
    from rembg_api import get_processor

class AdvancedBackgroundRemoval:
    """高质量背景移除节点"""
    
    @classmethod
    def INPUT_TYPES(cls):
        processor = get_processor()
        available_models = processor.get_available_models()
        
        return {
            "required": {
                "image": ("IMAGE",),
                "model": (available_models, {"default": "u2net"}),
                "alpha_matting": ("BOOLEAN", {"default": False}),
                "post_processing": ("BOOLEAN", {"default": True}),
            },
            "optional": {
                "edge_feather": ("INT", {"default": 2, "min": 0, "max": 10}),
                "mask_blur": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 5.0}),
            }
        }
    
    RETURN_TYPES = ("IMAGE", "MASK")
    RETURN_NAMES = ("image", "mask")
    FUNCTION = "remove_background"
    CATEGORY = "kontext_super_prompt/background"
    
    def remove_background(self, image, model, alpha_matting=False, post_processing=True, 
                         edge_feather=2, mask_blur=1.0):
        """
        移除背景
        
        Args:
            image: 输入图像张量
            model: 使用的模型名称
            alpha_matting: 是否启用Alpha Matting边缘优化
            post_processing: 是否启用后处理
            edge_feather: 边缘羽化程度
            mask_blur: 掩膜模糊程度
            
        Returns:
            tuple: (处理后的图像, 提取的掩膜)
        """
        try:
            # 获取处理器
            processor = get_processor()
            
            # 转换输入图像格式
            batch_size = image.shape[0]
            results = []
            masks = []
            
            for i in range(batch_size):
                # 将张量转换为PIL图像
                img_tensor = image[i]
                img_array = (img_tensor.cpu().numpy() * 255).astype(np.uint8)
                pil_image = Image.fromarray(img_array)
                
                # 执行背景移除
                result_image = processor.remove_background(
                    pil_image, 
                    model_name=model, 
                    alpha_matting=alpha_matting
                )
                
                # 后处理
                if post_processing:
                    result_image = self._post_process_image(
                        result_image, edge_feather, mask_blur
                    )
                
                # 分离RGB和Alpha通道
                rgb_array = np.array(result_image.convert('RGB'))
                alpha_array = np.array(result_image)[:, :, 3] if result_image.mode == 'RGBA' else np.full(rgb_array.shape[:2], 255)
                
                # 转换回张量格式
                rgb_tensor = torch.from_numpy(rgb_array.astype(np.float32) / 255.0)
                alpha_tensor = torch.from_numpy(alpha_array.astype(np.float32) / 255.0)
                
                results.append(rgb_tensor)
                masks.append(alpha_tensor)
            
            # 堆叠批次
            result_batch = torch.stack(results, dim=0)
            mask_batch = torch.stack(masks, dim=0)
            
            return (result_batch, mask_batch)
            
        except Exception as e:
            print(f"❌ 背景移除失败: {e}")
            # 返回原图像和全白掩膜
            white_mask = torch.ones((batch_size, image.shape[1], image.shape[2]), dtype=torch.float32)
            return (image, white_mask)
    
    def _post_process_image(self, image, edge_feather, mask_blur):
        """
        后处理图像
        
        Args:
            image: PIL图像
            edge_feather: 边缘羽化程度
            mask_blur: 掩膜模糊程度
            
        Returns:
            PIL Image: 处理后的图像
        """
        try:
            if image.mode != 'RGBA':
                return image
            
            # 提取alpha通道
            alpha = image.split()[-1]
            rgb = image.convert('RGB')
            
            # 对alpha通道进行处理
            if mask_blur > 0:
                # 高斯模糊
                from PIL import ImageFilter
                alpha = alpha.filter(ImageFilter.GaussianBlur(radius=mask_blur))
            
            if edge_feather > 0:
                # 边缘羽化（通过多次膨胀腐蚀实现）
                alpha = self._feather_edges(alpha, edge_feather)
            
            # 重新组合图像
            result = Image.merge('RGBA', (*rgb.split(), alpha))
            
            return result
            
        except Exception as e:
            print(f"⚠️  后处理失败: {e}")
            return image
    
    def _feather_edges(self, alpha, feather_amount):
        """
        对alpha通道进行边缘羽化
        
        Args:
            alpha: PIL Image alpha通道
            feather_amount: 羽化程度
            
        Returns:
            PIL Image: 羽化后的alpha通道
        """
        try:
            from PIL import ImageFilter
            
            # 多级羽化
            result = alpha
            for i in range(feather_amount):
                # 轻微模糊
                result = result.filter(ImageFilter.GaussianBlur(radius=0.5))
                # 轻微收缩（通过阈值实现）
                result_array = np.array(result)
                result_array = np.where(result_array > 245, 255, result_array)
                result_array = np.where(result_array < 10, 0, result_array)
                result = Image.fromarray(result_array)
            
            return result
            
        except Exception:
            return alpha

class BackgroundRemovalSettings:
    """背景移除设置节点"""
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "enable_server_api": ("BOOLEAN", {"default": True}),
                "api_timeout": ("INT", {"default": 30, "min": 5, "max": 120}),
                "fallback_threshold": ("FLOAT", {"default": 20.0, "min": 5.0, "max": 50.0}),
                "edge_smooth_iterations": ("INT", {"default": 2, "min": 1, "max": 5}),
            }
        }
    
    RETURN_TYPES = ("BACKGROUND_REMOVAL_CONFIG",)
    RETURN_NAMES = ("config",)
    FUNCTION = "create_config"
    CATEGORY = "kontext_super_prompt/background"
    
    def create_config(self, enable_server_api, api_timeout, fallback_threshold, edge_smooth_iterations):
        """创建背景移除配置"""
        config = {
            "enable_server_api": enable_server_api,
            "api_timeout": api_timeout,
            "fallback_threshold": fallback_threshold,
            "edge_smooth_iterations": edge_smooth_iterations,
        }
        return (config,)

# 节点映射
NODE_CLASS_MAPPINGS = {
    "AdvancedBackgroundRemoval": AdvancedBackgroundRemoval,
    "BackgroundRemovalSettings": BackgroundRemovalSettings,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AdvancedBackgroundRemoval": "🎭 高质量背景移除",
    "BackgroundRemovalSettings": "⚙️ 背景移除设置",
}
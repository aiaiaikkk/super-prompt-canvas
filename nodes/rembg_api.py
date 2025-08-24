#!/usr/bin/env python3
"""
rembg API 服务端
提供高质量的背景移除功能
"""

import io
import base64
from PIL import Image
import numpy as np

try:
    from rembg import remove, new_session
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False

class RemBGProcessor:
    """背景移除处理器"""
    
    def __init__(self):
        self.sessions = {}
        self._initialize_sessions()
    
    def _initialize_sessions(self):
        """初始化不同的模型会话"""
        if not REMBG_AVAILABLE:
            return
            
        # 预加载常用模型
        try:
            # U²-Net - 通用人像背景移除，速度快
            self.sessions['u2net'] = new_session('u2net')
            
            # U²-Net Human - 专用于人体分割
            self.sessions['u2net_human_seg'] = new_session('u2net_human_seg') 
            
            # BiRefNet - 最新最准确的模型，适合复杂场景
            self.sessions['birefnet'] = new_session('birefnet')
            
            # ISNet - 适合高分辨率图像
            self.sessions['isnet'] = new_session('isnet-general-use')
            
        except Exception as e:
            pass
    
    def remove_background(self, input_image, model_name='u2net', alpha_matting=False):
        """
        移除背景
        
        Args:
            input_image: PIL Image对象或字节数据
            model_name: 模型名称 ('u2net', 'birefnet', 'isnet', 'u2net_human_seg')
            alpha_matting: 是否启用Alpha Matting边缘优化
        
        Returns:
            PIL Image: 移除背景后的图像
        """
        
        if not REMBG_AVAILABLE:
            return self._fallback_remove_background(input_image)
        
        try:
            # 转换输入图像格式
            if isinstance(input_image, bytes):
                input_image = Image.open(io.BytesIO(input_image))
            elif not isinstance(input_image, Image.Image):
                raise ValueError("不支持的输入图像格式")
            
            # 确保图像为RGB格式
            if input_image.mode != 'RGB':
                input_image = input_image.convert('RGB')
            
            # 获取会话
            session = self.sessions.get(model_name)
            if session is None:
                session = self.sessions.get('u2net')
                if session is None:
                    return self._fallback_remove_background(input_image)
            
            # 执行背景移除
            input_bytes = io.BytesIO()
            input_image.save(input_bytes, format='PNG')
            input_bytes = input_bytes.getvalue()
            
            # 使用rembg移除背景
            output_bytes = remove(input_bytes, session=session)
            
            # 转换为PIL图像
            output_image = Image.open(io.BytesIO(output_bytes)).convert('RGBA')
            
            # 如果启用Alpha Matting，进行边缘优化
            if alpha_matting:
                output_image = self._apply_alpha_matting(input_image, output_image)
            
            return output_image
            
        except Exception as e:
            return self._fallback_remove_background(input_image)
    
    def _apply_alpha_matting(self, original_image, mask_image):
        """
        应用Alpha Matting边缘优化
        
        Args:
            original_image: 原始图像
            mask_image: 带透明通道的掩膜图像
            
        Returns:
            PIL Image: 边缘优化后的图像
        """
        try:
            # 将图像转换为numpy数组
            original_array = np.array(original_image)
            mask_array = np.array(mask_image)
            
            # 提取alpha通道作为trimap
            alpha = mask_array[:, :, 3] / 255.0
            
            # 简化的Alpha Matting实现
            # 对边缘区域进行高斯模糊平滑
            from scipy.ndimage import gaussian_filter
            
            # 检测边缘区域
            edge_mask = self._detect_edges(alpha)
            
            # 对边缘区域应用高斯模糊
            blurred_alpha = gaussian_filter(alpha, sigma=1.0)
            
            # 只在边缘区域使用模糊结果
            final_alpha = np.where(edge_mask, blurred_alpha, alpha)
            
            # 创建最终图像
            result = original_array.copy()
            result = np.dstack([result, (final_alpha * 255).astype(np.uint8)])
            
            return Image.fromarray(result, 'RGBA')
            
        except Exception as e:
            return mask_image
    
    def _detect_edges(self, alpha):
        """
        检测alpha通道中的边缘区域
        
        Args:
            alpha: Alpha通道数组
            
        Returns:
            numpy array: 边缘掩膜
        """
        try:
            from scipy.ndimage import sobel
            
            # 计算梯度
            dx = sobel(alpha, axis=1)
            dy = sobel(alpha, axis=0)
            magnitude = np.hypot(dx, dy)
            
            # 阈值化得到边缘
            threshold = np.percentile(magnitude, 85)  # 取85%分位数作为阈值
            edge_mask = magnitude > threshold
            
            # 膨胀操作，扩大边缘区域
            from scipy.ndimage import binary_dilation
            edge_mask = binary_dilation(edge_mask, iterations=2)
            
            return edge_mask
            
        except Exception:
            # 如果scipy不可用，使用简单的差分检测
            edge_mask = np.zeros_like(alpha, dtype=bool)
            edge_mask[1:-1, 1:-1] = (
                np.abs(alpha[1:-1, 2:] - alpha[1:-1, :-2]) > 0.1) | \
                (np.abs(alpha[2:, 1:-1] - alpha[:-2, 1:-1]) > 0.1
            )
            return edge_mask
    
    def _fallback_remove_background(self, input_image):
        """
        备用背景移除算法（不依赖rembg）
        使用基于阈值的简单分割
        
        Args:
            input_image: PIL Image对象
            
        Returns:
            PIL Image: 处理后的图像
        """
        try:
            # 转换为numpy数组
            img_array = np.array(input_image)
            height, width = img_array.shape[:2]
            
            # 检测背景色（取四个角落的平均色）
            corner_colors = [
                img_array[0, 0], img_array[0, width-1],
                img_array[height-1, 0], img_array[height-1, width-1]
            ]
            bg_color = np.mean(corner_colors, axis=0)
            
            # 计算每个像素与背景色的距离
            diff = np.sum(np.abs(img_array - bg_color), axis=2)
            
            # 自适应阈值
            threshold = np.percentile(diff, 20)  # 取20%分位数作为阈值
            
            # 创建alpha通道
            alpha = np.where(diff > threshold, 255, 0).astype(np.uint8)
            
            # 高斯模糊平滑边缘
            try:
                from scipy.ndimage import gaussian_filter
                alpha = gaussian_filter(alpha.astype(float), sigma=1.0)
                alpha = (alpha * 255 / alpha.max()).astype(np.uint8)
            except ImportError:
                pass  # 如果没有scipy，跳过模糊
            
            # 创建RGBA图像
            result = np.dstack([img_array, alpha])
            
            return Image.fromarray(result, 'RGBA')
            
        except Exception as e:
            # 返回原图像，添加完全不透明的alpha通道
            img_array = np.array(input_image)
            alpha = np.full((img_array.shape[0], img_array.shape[1]), 255, dtype=np.uint8)
            result = np.dstack([img_array, alpha])
            return Image.fromarray(result, 'RGBA')
    
    def get_available_models(self):
        """获取可用的模型列表"""
        if not REMBG_AVAILABLE:
            return ['fallback']
        
        available = []
        for model_name, session in self.sessions.items():
            if session is not None:
                available.append(model_name)
        
        return available if available else ['fallback']

# 全局处理器实例
_processor = None

def get_processor():
    """获取全局处理器实例"""
    global _processor
    if _processor is None:
        _processor = RemBGProcessor()
    return _processor

def remove_background_api(image_data, model_name='u2net', alpha_matting=False):
    """
    API接口函数
    
    Args:
        image_data: 图像数据（bytes或PIL Image）
        model_name: 模型名称
        alpha_matting: 是否启用边缘优化
        
    Returns:
        bytes: 处理后的PNG图像数据
    """
    processor = get_processor()
    result_image = processor.remove_background(image_data, model_name, alpha_matting)
    
    # 转换为bytes
    output_buffer = io.BytesIO()
    result_image.save(output_buffer, format='PNG')
    return output_buffer.getvalue()

if __name__ == '__main__':
    # 测试代码
    processor = RemBGProcessor()

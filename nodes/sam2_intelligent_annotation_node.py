"""
SAM2智能标注节点
集成SAM2+FastSAM的ComfyUI节点
"""

import json
import numpy as np
import torch
from typing import Dict, List, Any
import os
import sys

# 添加当前目录到路径
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

try:
    from sam2_annotation_service import get_sam2_service
    SAM2_SERVICE_AVAILABLE = True
except ImportError as e:
    print(f"SAM2服务导入失败: {e}")
    SAM2_SERVICE_AVAILABLE = False

try:
    import comfy.model_management as model_management
    from nodes import MAX_RESOLUTION
    COMFY_AVAILABLE = True
except ImportError:
    COMFY_AVAILABLE = False
    MAX_RESOLUTION = 8192

class SAM2IntelligentAnnotationNode:
    """SAM2智能标注节点"""
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
            },
            "optional": {
                "interaction_mode": (["auto", "fast", "precise"], {"default": "auto"}),
                "interaction_points": ("STRING", {
                    "multiline": True, 
                    "default": "[]", 
                    "tooltip": "JSON格式的交互点，例如: [{\"type\":\"point\",\"point\":[320,240]}]"
                }),
                "confidence_threshold": ("FLOAT", {
                    "default": 0.4, 
                    "min": 0.1, 
                    "max": 1.0, 
                    "step": 0.1,
                    "tooltip": "FastSAM置信度阈值"
                }),
                "enable_sam2": ("BOOLEAN", {
                    "default": False,
                    "tooltip": "启用SAM2精确模式（需要更多GPU内存）"
                })
            }
        }
    
    RETURN_TYPES = ("STRING", "STRING", "STRING")
    RETURN_NAMES = ("layers_json", "performance_stats", "debug_info")
    FUNCTION = "intelligent_annotate"
    CATEGORY = "kontext/sam2"
    DESCRIPTION = "使用SAM2+FastSAM进行智能标注"
    
    def __init__(self):
        self.service = None
        self.last_interaction_mode = None
        
    def intelligent_annotate(self, image: torch.Tensor, interaction_mode: str = "auto", 
                           interaction_points: str = "[]", confidence_threshold: float = 0.4,
                           enable_sam2: bool = False):
        """执行智能标注"""
        
        try:
            # 检查服务可用性
            if not SAM2_SERVICE_AVAILABLE:
                return self._create_fallback_result("SAM2服务不可用")
            
            # 获取服务实例
            if self.service is None:
                self.service = get_sam2_service()
                print("🔧 SAM2服务已初始化")
            
            # 根据需要加载模型
            if enable_sam2 and interaction_mode in ["precise", "auto"]:
                self.service.load_models(load_fastsam=True, load_sam2=True)
            else:
                self.service.load_models(load_fastsam=True, load_sam2=False)
            
            # 设置工作模式
            if interaction_mode != self.last_interaction_mode:
                self.service.set_mode(interaction_mode)
                self.last_interaction_mode = interaction_mode
            
            # 转换图像格式
            image_np = self._tensor_to_numpy(image)
            h, w = image_np.shape[:2]
            
            # 解析交互点
            try:
                interactions = json.loads(interaction_points) if interaction_points.strip() else []
            except json.JSONDecodeError:
                print("⚠️ 交互点JSON解析失败，使用默认中心点")
                interactions = []
            
            # 如果没有交互点，生成默认点
            if not interactions:
                interactions = self._generate_default_interactions(w, h)
            
            # 执行智能标注
            results = []
            debug_info = []
            
            for i, interaction in enumerate(interactions):
                print(f"🎯 处理交互 {i+1}/{len(interactions)}: {interaction}")
                
                # 设置置信度阈值
                if interaction_mode == "fast":
                    # 为FastSAM设置动态参数
                    if hasattr(self.service, 'fastsam_model'):
                        interaction["conf_threshold"] = confidence_threshold
                
                # 执行分割
                result = self.service.smart_segment(image_np, interaction, interaction_mode)
                
                if result["success"]:
                    # 转换为标准层数据格式
                    layer_data = self._convert_to_layer_format(result, i)
                    results.append(layer_data)
                    
                    debug_info.append({
                        "interaction_id": i,
                        "method": result["method"],
                        "confidence": result["confidence"],
                        "process_time_ms": result["process_time"] * 1000,
                        "success": True
                    })
                else:
                    debug_info.append({
                        "interaction_id": i,
                        "error": result.get("error", "未知错误"),
                        "success": False
                    })
            
            # 生成输出
            layers_json = json.dumps(results, ensure_ascii=False, indent=2)
            
            # 性能统计
            perf_stats = self.service.get_performance_stats()
            perf_json = json.dumps(perf_stats, ensure_ascii=False, indent=2)
            
            # 调试信息
            debug_json = json.dumps({
                "total_interactions": len(interactions),
                "successful_results": len(results),
                "interaction_details": debug_info,
                "image_info": {
                    "width": w,
                    "height": h,
                    "channels": image_np.shape[2] if len(image_np.shape) > 2 else 1
                },
                "mode_info": {
                    "interaction_mode": interaction_mode,
                    "enable_sam2": enable_sam2,
                    "confidence_threshold": confidence_threshold
                }
            }, ensure_ascii=False, indent=2)
            
            print(f"✅ SAM2智能标注完成: {len(results)}个结果")
            return (layers_json, perf_json, debug_json)
            
        except Exception as e:
            error_msg = f"SAM2智能标注失败: {str(e)}"
            print(f"❌ {error_msg}")
            return self._create_fallback_result(error_msg)
    
    def _tensor_to_numpy(self, tensor: torch.Tensor) -> np.ndarray:
        """将tensor转换为numpy数组"""
        if len(tensor.shape) == 4:
            # 批次维度，取第一个
            tensor = tensor[0]
        
        # 转换为numpy
        if tensor.device.type == 'cuda':
            tensor = tensor.cpu()
        
        numpy_array = tensor.numpy()
        
        # 确保值范围在[0, 255]
        if numpy_array.max() <= 1.0:
            numpy_array = (numpy_array * 255).astype(np.uint8)
        else:
            numpy_array = numpy_array.astype(np.uint8)
        
        return numpy_array
    
    def _generate_default_interactions(self, width: int, height: int) -> List[Dict[str, Any]]:
        """生成默认交互点"""
        # 生成网格采样点
        interactions = []
        
        # 中心点
        interactions.append({
            "type": "point",
            "point": [width // 2, height // 2]
        })
        
        # 四个象限的点
        for x_ratio, y_ratio in [(0.25, 0.25), (0.75, 0.25), (0.25, 0.75), (0.75, 0.75)]:
            interactions.append({
                "type": "point", 
                "point": [int(width * x_ratio), int(height * y_ratio)]
            })
        
        return interactions
    
    def _convert_to_layer_format(self, result: Dict[str, Any], index: int) -> Dict[str, Any]:
        """将SAM2结果转换为标准层格式"""
        mask_data = result["mask"]
        method = result["method"]
        confidence = result["confidence"]
        
        # 生成唯一ID
        layer_id = f"sam2_annotation_{int(torch.rand(1).item() * 1000000)}_{method.lower()}"
        
        # 基础层数据
        layer = {
            "id": layer_id,
            "type": "detection",
            "name": f"{method}_object_{index + 1}",
            "confidence": confidence,
            "class_name": mask_data.get("class_name", "object"),
            "method": method,
            "visible": True,
            "color": self._get_color_by_confidence(confidence),
            "number": index + 1
        }
        
        # 添加几何信息
        if "geometry" in mask_data:
            layer["geometry"] = mask_data["geometry"]
        
        # 添加中心点
        if "center" in mask_data:
            layer["center"] = mask_data["center"]
        
        # 添加轮廓信息（如果有）
        if "contours" in mask_data:
            layer["contours"] = mask_data["contours"]
        
        # 添加mask数据（如果有且不太大）
        if "mask" in mask_data and mask_data["mask"] is not None:
            layer["mask"] = mask_data["mask"]
        
        return layer
    
    def _get_color_by_confidence(self, confidence: float) -> str:
        """根据置信度选择颜色"""
        if confidence >= 0.8:
            return "#00ff00"  # 绿色 - 高置信度
        elif confidence >= 0.6:
            return "#ffff00"  # 黄色 - 中等置信度
        elif confidence >= 0.4:
            return "#ff8800"  # 橙色 - 较低置信度
        else:
            return "#ff0000"  # 红色 - 低置信度
    
    def _create_fallback_result(self, error_msg: str):
        """创建回退结果"""
        fallback_layers = [{
            "id": "fallback_annotation",
            "type": "error",
            "name": "Fallback Annotation",
            "confidence": 0.0,
            "class_name": "error",
            "method": "Fallback",
            "visible": True,
            "color": "#ff0000",
            "geometry": {
                "type": "rectangle",
                "coordinates": [10, 10, 100, 100]
            },
            "error": error_msg
        }]
        
        error_stats = {
            "error": error_msg,
            "models_loaded": {"fastsam": False, "sam2": False},
            "device": "cpu"
        }
        
        error_debug = {
            "error": error_msg,
            "fallback_used": True
        }
        
        return (
            json.dumps(fallback_layers, ensure_ascii=False),
            json.dumps(error_stats, ensure_ascii=False),
            json.dumps(error_debug, ensure_ascii=False)
        )

# ComfyUI节点注册
NODE_CLASS_MAPPINGS = {
    "SAM2IntelligentAnnotation": SAM2IntelligentAnnotationNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "SAM2IntelligentAnnotation": "🤖 SAM2 Intelligent Annotation",
}

if __name__ == "__main__":
    # 测试代码
    print("🧪 SAM2智能标注节点测试")
    node = SAM2IntelligentAnnotationNode()
    print("✅ 节点创建成功")
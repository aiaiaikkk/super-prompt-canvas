"""
SAM2 ComfyUI原生节点
直接使用ComfyUI的SAM2模型实现，支持模型选择和加载
"""

import json
import numpy as np
import torch
import time
from typing import Dict, List, Any, Optional, Tuple
import os
import sys

# 添加当前目录到路径
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

try:
    import comfy.model_management as model_management
    import folder_paths
    from nodes import MAX_RESOLUTION
    COMFY_AVAILABLE = True
except ImportError:
    COMFY_AVAILABLE = False
    MAX_RESOLUTION = 8192

try:
    # 尝试导入ComfyUI的SAM2实现
    from comfy.sam import load_sam2_model, sam2_image_predictor
    COMFY_SAM2_AVAILABLE = True
except ImportError:
    try:
        # 备用：直接导入SAM2
        from sam2.build_sam import build_sam2
        from sam2.sam2_image_predictor import SAM2ImagePredictor
        from sam2.automatic_mask_generator import SAM2AutomaticMaskGenerator
        COMFY_SAM2_AVAILABLE = False
        DIRECT_SAM2_AVAILABLE = True
    except ImportError:
        COMFY_SAM2_AVAILABLE = False
        DIRECT_SAM2_AVAILABLE = False
        print("SAM2不可用，请安装: pip install segment-anything-2")

try:
    # FastSAM 导入
    from ultralytics import FastSAM
    FASTSAM_AVAILABLE = True
except ImportError:
    FASTSAM_AVAILABLE = False
    print("FastSAM不可用，请安装: pip install ultralytics")

class SAM2ComfyUINativeNode:
    """SAM2 ComfyUI原生节点 - 使用ComfyUI内置SAM2模型"""
    
    @classmethod
    def INPUT_TYPES(cls):
        # 获取可用的SAM2模型列表
        sam2_models = cls._get_available_sam2_models()
        
        return {
            "required": {
                "image": ("IMAGE",),
                "sam2_model": (sam2_models, {"default": sam2_models[0] if sam2_models else "auto"}),
            },
            "optional": {
                "mode": (["auto", "fast", "precise", "automatic"], {"default": "auto"}),
                "interaction_points": ("STRING", {
                    "multiline": True, 
                    "default": "[]", 
                    "tooltip": "JSON格式交互点: [{\"type\":\"point\",\"point\":[x,y]}]"
                }),
                "confidence_threshold": ("FLOAT", {
                    "default": 0.4, 
                    "min": 0.1, 
                    "max": 1.0, 
                    "step": 0.1,
                    "tooltip": "FastSAM置信度阈值"
                }),
                "points_per_side": ("INT", {
                    "default": 32,
                    "min": 8,
                    "max": 128,
                    "step": 8,
                    "tooltip": "自动模式每边采样点数"
                }),
                "pred_iou_thresh": ("FLOAT", {
                    "default": 0.88,
                    "min": 0.0,
                    "max": 1.0,
                    "step": 0.01,
                    "tooltip": "预测IoU阈值"
                }),
                "stability_score_thresh": ("FLOAT", {
                    "default": 0.95,
                    "min": 0.0,
                    "max": 1.0,
                    "step": 0.01,
                    "tooltip": "稳定性分数阈值"
                }),
                "crop_n_layers": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": 3,
                    "step": 1,
                    "tooltip": "裁剪层数"
                }),
                "box_nms_thresh": ("FLOAT", {
                    "default": 0.7,
                    "min": 0.0,
                    "max": 1.0,
                    "step": 0.01,
                    "tooltip": "边界框NMS阈值"
                }),
                "crop_n_points_downscale_factor": ("INT", {
                    "default": 1,
                    "min": 1,
                    "max": 4,
                    "step": 1,
                    "tooltip": "裁剪点下采样因子"
                }),
            }
        }
    
    RETURN_TYPES = ("STRING", "STRING", "STRING", "IMAGE")
    RETURN_NAMES = ("layers_json", "performance_stats", "debug_info", "mask_visualization")
    FUNCTION = "native_sam2_segment"
    CATEGORY = "kontext/sam2"
    DESCRIPTION = "使用ComfyUI原生SAM2模型进行智能分割"
    
    def __init__(self):
        self.sam2_predictor = None
        self.sam2_generator = None
        self.fastsam_model = None
        self.current_model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
    @classmethod
    def _get_available_sam2_models(cls) -> List[str]:
        """获取可用的SAM2模型列表"""
        models = ["auto"]
        
        if COMFY_AVAILABLE:
            try:
                # 获取ComfyUI的SAM2模型
                sam2_models = folder_paths.get_filename_list("sam2")
                models.extend([f"comfyui:{model}" for model in sam2_models])
            except:
                pass
        
        # 添加标准SAM2模型选项
        standard_models = [
            "sam2_hiera_large.pt",
            "sam2_hiera_base_plus.pt", 
            "sam2_hiera_small.pt",
            "sam2_hiera_tiny.pt"
        ]
        models.extend(standard_models)
        
        # 添加FastSAM选项
        if FASTSAM_AVAILABLE:
            models.extend(["fastsam-x", "fastsam-s"])
        
        return models
    
    def native_sam2_segment(
        self,
        image: torch.Tensor,
        sam2_model: str = "auto",
        mode: str = "auto",
        interaction_points: str = "[]",
        confidence_threshold: float = 0.4,
        points_per_side: int = 32,
        pred_iou_thresh: float = 0.88,
        stability_score_thresh: float = 0.95,
        crop_n_layers: int = 0,
        box_nms_thresh: float = 0.7,
        crop_n_points_downscale_factor: int = 1,
    ) -> Tuple[str, str, str, torch.Tensor]:
        """执行ComfyUI原生SAM2分割"""
        
        try:
            start_time = time.time()
            
            # 加载模型
            model_info = self._load_model(sam2_model)
            if not model_info["success"]:
                return self._create_error_result(model_info["error"])
            
            # 转换图像格式
            image_np = self._tensor_to_numpy(image)
            h, w = image_np.shape[:2]
            
            # 解析交互点
            try:
                interactions = json.loads(interaction_points) if interaction_points.strip() else []
            except json.JSONDecodeError:
                print("⚠️ 交互点JSON解析失败，使用默认模式")
                interactions = []
            
            # 选择分割模式
            if mode == "fast" and self.fastsam_model is not None:
                results = self._fast_segment(image_np, interactions, confidence_threshold)
            elif mode == "automatic":
                results = self._automatic_segment(
                    image_np, points_per_side, pred_iou_thresh, stability_score_thresh,
                    crop_n_layers, box_nms_thresh, crop_n_points_downscale_factor
                )
            elif mode == "precise" and self.sam2_predictor is not None:
                results = self._precise_segment(image_np, interactions)
            else:  # auto mode
                if interactions:
                    # 有交互点时优先使用精确模式
                    if self.sam2_predictor is not None:
                        results = self._precise_segment(image_np, interactions)
                    elif self.fastsam_model is not None:
                        results = self._fast_segment(image_np, interactions, confidence_threshold)
                    else:
                        results = self._fallback_segment(image_np, interactions)
                else:
                    # 无交互点时使用自动模式
                    if self.sam2_generator is not None:
                        results = self._automatic_segment(
                            image_np, points_per_side, pred_iou_thresh, stability_score_thresh,
                            crop_n_layers, box_nms_thresh, crop_n_points_downscale_factor
                        )
                    else:
                        results = self._fallback_segment(image_np, [])
            
            # 转换为标准层格式
            layers_data = self._convert_to_layer_format(results)
            
            # 生成可视化
            mask_viz = self._create_mask_visualization(image_np, results)
            
            # 性能统计
            total_time = time.time() - start_time
            perf_stats = {
                "model_used": model_info["model_name"],
                "model_type": model_info["model_type"],
                "device": self.device,
                "total_time_ms": total_time * 1000,
                "method": results[0].get("method", "Unknown") if results else "None",
                "results_count": len(results)
            }
            
            # 调试信息
            debug_info = {
                "mode": mode,
                "model_info": model_info,
                "interaction_count": len(interactions),
                "results_count": len(results),
                "image_shape": [h, w],
                "parameters": {
                    "confidence_threshold": confidence_threshold,
                    "points_per_side": points_per_side,
                    "pred_iou_thresh": pred_iou_thresh,
                    "stability_score_thresh": stability_score_thresh
                }
            }
            
            # 输出JSON
            layers_json = json.dumps(layers_data, ensure_ascii=False, indent=2)
            perf_json = json.dumps(perf_stats, ensure_ascii=False, indent=2)
            debug_json = json.dumps(debug_info, ensure_ascii=False, indent=2)
            
            print(f"✅ SAM2原生分割完成: {len(layers_data)}个结果 ({total_time*1000:.1f}ms)")
            return (layers_json, perf_json, debug_json, mask_viz)
            
        except Exception as e:
            error_msg = f"SAM2原生分割失败: {str(e)}"
            print(f"❌ {error_msg}")
            return self._create_error_result(error_msg)
    
    def _load_model(self, model_name: str) -> Dict[str, Any]:
        """加载指定的模型"""
        try:
            # 如果模型已加载且相同，直接返回
            if self.current_model == model_name:
                return {
                    "success": True,
                    "model_name": model_name,
                    "model_type": "cached"
                }
            
            # 清理之前的模型
            self._cleanup_models()
            
            if model_name == "auto":
                # 自动选择最佳可用模型
                return self._auto_load_model()
            
            elif model_name.startswith("comfyui:"):
                # ComfyUI模型
                comfy_model_name = model_name[8:]  # 去除"comfyui:"前缀
                return self._load_comfyui_model(comfy_model_name)
            
            elif model_name.startswith("fastsam"):
                # FastSAM模型
                return self._load_fastsam_model(model_name)
            
            else:
                # 标准SAM2模型
                return self._load_standard_sam2_model(model_name)
                
        except Exception as e:
            return {
                "success": False,
                "error": f"模型加载失败: {str(e)}"
            }
    
    def _auto_load_model(self) -> Dict[str, Any]:
        """自动加载最佳可用模型"""
        # 优先级：ComfyUI SAM2 > 标准SAM2 > FastSAM
        
        # 1. 尝试ComfyUI SAM2
        if COMFY_SAM2_AVAILABLE:
            try:
                sam2_models = folder_paths.get_filename_list("sam2")
                if sam2_models:
                    return self._load_comfyui_model(sam2_models[0])
            except:
                pass
        
        # 2. 尝试标准SAM2
        if DIRECT_SAM2_AVAILABLE:
            standard_models = [
                "sam2_hiera_large.pt",
                "sam2_hiera_base_plus.pt",
                "sam2_hiera_small.pt"
            ]
            for model in standard_models:
                result = self._load_standard_sam2_model(model)
                if result["success"]:
                    return result
        
        # 3. 回退到FastSAM
        if FASTSAM_AVAILABLE:
            return self._load_fastsam_model("fastsam-x")
        
        return {
            "success": False,
            "error": "没有可用的模型"
        }
    
    def _load_comfyui_model(self, model_name: str) -> Dict[str, Any]:
        """加载ComfyUI SAM2模型"""
        try:
            if not COMFY_SAM2_AVAILABLE:
                return {"success": False, "error": "ComfyUI SAM2不可用"}
            
            # 获取模型路径
            model_path = folder_paths.get_full_path("sam2", model_name)
            if not model_path:
                return {"success": False, "error": f"ComfyUI模型未找到: {model_name}"}
            
            print(f"📦 加载ComfyUI SAM2模型: {model_name}")
            
            # 加载模型
            sam2_model = load_sam2_model(model_path, device=self.device)
            self.sam2_predictor = sam2_image_predictor(sam2_model)
            
            # 创建自动生成器
            try:
                from sam2.automatic_mask_generator import SAM2AutomaticMaskGenerator
                self.sam2_generator = SAM2AutomaticMaskGenerator(sam2_model)
            except:
                self.sam2_generator = None
            
            self.current_model = f"comfyui:{model_name}"
            
            return {
                "success": True,
                "model_name": model_name,
                "model_type": "comfyui_sam2",
                "model_path": model_path
            }
            
        except Exception as e:
            return {"success": False, "error": f"ComfyUI模型加载失败: {str(e)}"}
    
    def _load_standard_sam2_model(self, model_name: str) -> Dict[str, Any]:
        """加载标准SAM2模型"""
        try:
            if not DIRECT_SAM2_AVAILABLE:
                return {"success": False, "error": "标准SAM2不可用"}
            
            # 查找模型文件
            models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
            model_path = os.path.join(models_dir, model_name)
            
            if not os.path.exists(model_path):
                return {"success": False, "error": f"模型文件未找到: {model_path}"}
            
            print(f"📦 加载标准SAM2模型: {model_name}")
            
            # 确定配置文件
            config_map = {
                "sam2_hiera_large.pt": "sam2_hiera_l.yaml",
                "sam2_hiera_base_plus.pt": "sam2_hiera_b+.yaml",
                "sam2_hiera_small.pt": "sam2_hiera_s.yaml",
                "sam2_hiera_tiny.pt": "sam2_hiera_t.yaml"
            }
            
            config_name = config_map.get(model_name, "sam2_hiera_l.yaml")
            
            # 加载模型
            sam2_model = build_sam2(config_name, model_path, device=self.device)
            self.sam2_predictor = SAM2ImagePredictor(sam2_model)
            
            # 创建自动生成器
            try:
                self.sam2_generator = SAM2AutomaticMaskGenerator(sam2_model)
            except:
                self.sam2_generator = None
            
            self.current_model = model_name
            
            return {
                "success": True,
                "model_name": model_name,
                "model_type": "standard_sam2",
                "model_path": model_path
            }
            
        except Exception as e:
            return {"success": False, "error": f"标准SAM2模型加载失败: {str(e)}"}
    
    def _load_fastsam_model(self, model_name: str) -> Dict[str, Any]:
        """加载FastSAM模型"""
        try:
            if not FASTSAM_AVAILABLE:
                return {"success": False, "error": "FastSAM不可用"}
            
            print(f"📦 加载FastSAM模型: {model_name}")
            
            # FastSAM模型映射
            model_map = {
                "fastsam-x": "FastSAM-x.pt",
                "fastsam-s": "FastSAM-s.pt"
            }
            
            model_file = model_map.get(model_name, "FastSAM-x.pt")
            
            # 检查本地模型
            models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
            local_path = os.path.join(models_dir, model_file)
            
            if os.path.exists(local_path):
                self.fastsam_model = FastSAM(local_path)
            else:
                # 使用ultralytics自动下载
                self.fastsam_model = FastSAM(model_file)
            
            self.fastsam_model.to(self.device)
            self.current_model = model_name
            
            return {
                "success": True,
                "model_name": model_name,
                "model_type": "fastsam",
                "model_path": local_path if os.path.exists(local_path) else "auto_download"
            }
            
        except Exception as e:
            return {"success": False, "error": f"FastSAM模型加载失败: {str(e)}"}
    
    def _cleanup_models(self):
        """清理已加载的模型"""
        self.sam2_predictor = None
        self.sam2_generator = None
        self.fastsam_model = None
        
        # 清理GPU内存
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    
    def _tensor_to_numpy(self, tensor: torch.Tensor) -> np.ndarray:
        """将tensor转换为numpy数组"""
        if len(tensor.shape) == 4:
            tensor = tensor[0]
        
        if tensor.device.type == 'cuda':
            tensor = tensor.cpu()
        
        numpy_array = tensor.numpy()
        
        if numpy_array.max() <= 1.0:
            numpy_array = (numpy_array * 255).astype(np.uint8)
        else:
            numpy_array = numpy_array.astype(np.uint8)
        
        return numpy_array
    
    def _fast_segment(self, image: np.ndarray, interactions: List[Dict[str, Any]], conf_threshold: float) -> List[Dict[str, Any]]:
        """FastSAM快速分割"""
        if self.fastsam_model is None:
            return []
        
        try:
            # 运行FastSAM
            results = self.fastsam_model(
                image,
                device=self.device,
                retina_masks=True,
                imgsz=1024,
                conf=conf_threshold,
                iou=0.9
            )
            
            if not results or len(results) == 0 or results[0].masks is None:
                return []
            
            # 处理结果
            result_data = results[0]
            masks = result_data.masks.data.cpu().numpy()
            
            annotations = []
            
            if interactions:
                # 根据交互点选择mask
                for i, interaction in enumerate(interactions):
                    if interaction.get("type") == "point":
                        selected_mask, confidence = self._select_mask_by_point(
                            masks, interaction["point"], image.shape[:2]
                        )
                        
                        annotation = self._mask_to_annotation(
                            selected_mask, confidence, "FastSAM", i
                        )
                        annotations.append({
                            "annotation": annotation,
                            "confidence": confidence,
                            "method": "FastSAM"
                        })
            else:
                # 返回所有检测到的mask
                for i, mask in enumerate(masks[:10]):  # 限制最多10个
                    confidence = 0.8  # FastSAM默认置信度
                    annotation = self._mask_to_annotation(mask, confidence, "FastSAM", i)
                    annotations.append({
                        "annotation": annotation,
                        "confidence": confidence,
                        "method": "FastSAM"
                    })
            
            return annotations
            
        except Exception as e:
            print(f"❌ FastSAM分割失败: {e}")
            return []
    
    def _precise_segment(self, image: np.ndarray, interactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """SAM2精确分割"""
        if self.sam2_predictor is None:
            return []
        
        try:
            # 设置图像
            self.sam2_predictor.set_image(image)
            
            annotations = []
            
            for i, interaction in enumerate(interactions):
                interaction_type = interaction.get("type", "point")
                
                if interaction_type == "point":
                    point_coords = np.array([interaction["point"]])
                    point_labels = np.array([1])
                    
                    masks, scores, logits = self.sam2_predictor.predict(
                        point_coords=point_coords,
                        point_labels=point_labels,
                        multimask_output=True
                    )
                    
                    # 选择最佳mask
                    best_idx = np.argmax(scores)
                    best_mask = masks[best_idx]
                    best_score = scores[best_idx]
                    
                    annotation = self._mask_to_annotation(
                        best_mask, best_score, "SAM2", i
                    )
                    annotations.append({
                        "annotation": annotation,
                        "confidence": float(best_score),
                        "method": "SAM2"
                    })
                
                elif interaction_type == "box":
                    box = np.array(interaction["box"])
                    
                    masks, scores, logits = self.sam2_predictor.predict(
                        box=box,
                        multimask_output=False
                    )
                    
                    annotation = self._mask_to_annotation(
                        masks[0], scores[0], "SAM2", i
                    )
                    annotations.append({
                        "annotation": annotation,
                        "confidence": float(scores[0]),
                        "method": "SAM2"
                    })
            
            return annotations
            
        except Exception as e:
            print(f"❌ SAM2精确分割失败: {e}")
            return []
    
    def _automatic_segment(
        self,
        image: np.ndarray,
        points_per_side: int,
        pred_iou_thresh: float,
        stability_score_thresh: float,
        crop_n_layers: int,
        box_nms_thresh: float,
        crop_n_points_downscale_factor: int
    ) -> List[Dict[str, Any]]:
        """SAM2自动分割"""
        if self.sam2_generator is None:
            return []
        
        try:
            # 设置参数
            self.sam2_generator.points_per_side = points_per_side
            self.sam2_generator.pred_iou_thresh = pred_iou_thresh
            self.sam2_generator.stability_score_thresh = stability_score_thresh
            self.sam2_generator.crop_n_layers = crop_n_layers
            self.sam2_generator.box_nms_thresh = box_nms_thresh
            self.sam2_generator.crop_n_points_downscale_factor = crop_n_points_downscale_factor
            
            # 生成masks
            masks = self.sam2_generator.generate(image)
            
            annotations = []
            
            for i, mask_data in enumerate(masks):
                segmentation = mask_data["segmentation"]
                stability_score = mask_data.get("stability_score", 0.9)
                
                annotation = self._mask_to_annotation(
                    segmentation, stability_score, "SAM2Auto", i
                )
                annotations.append({
                    "annotation": annotation,
                    "confidence": stability_score,
                    "method": "SAM2Auto"
                })
            
            return annotations
            
        except Exception as e:
            print(f"❌ SAM2自动分割失败: {e}")
            return []
    
    def _fallback_segment(self, image: np.ndarray, interactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """回退分割方法"""
        print("⚠️ 使用简单回退分割")
        
        h, w = image.shape[:2]
        annotations = []
        
        if interactions:
            # 基于交互点的简单分割
            for i, interaction in enumerate(interactions):
                if interaction.get("type") == "point":
                    x, y = interaction["point"]
                    
                    # 创建简单的矩形区域
                    size = min(100, w // 8, h // 8)
                    x1 = max(0, x - size // 2)
                    y1 = max(0, y - size // 2)
                    x2 = min(w, x + size // 2)
                    y2 = min(h, y + size // 2)
                    
                    annotation = {
                        "id": f"fallback_{i}",
                        "type": "detection",
                        "name": f"Fallback_Object_{i+1}",
                        "geometry": {
                            "type": "rectangle",
                            "coordinates": [x1, y1, x2, y2]
                        },
                        "center": {"x": (x1+x2)//2, "y": (y1+y2)//2},
                        "confidence": 0.5,
                        "class_name": "object",
                        "method": "Fallback",
                        "visible": True,
                        "color": "#888888"
                    }
                    
                    annotations.append({
                        "annotation": annotation,
                        "confidence": 0.5,
                        "method": "Fallback"
                    })
        else:
            # 简单的网格分割
            grid_size = 4
            cell_w = w // grid_size
            cell_h = h // grid_size
            
            for i in range(grid_size):
                for j in range(grid_size):
                    x1 = j * cell_w
                    y1 = i * cell_h
                    x2 = min(w, (j+1) * cell_w)
                    y2 = min(h, (i+1) * cell_h)
                    
                    idx = i * grid_size + j
                    annotation = {
                        "id": f"grid_{idx}",
                        "type": "detection",
                        "name": f"Grid_Cell_{idx+1}",
                        "geometry": {
                            "type": "rectangle",
                            "coordinates": [x1, y1, x2, y2]
                        },
                        "center": {"x": (x1+x2)//2, "y": (y1+y2)//2},
                        "confidence": 0.3,
                        "class_name": "grid_cell",
                        "method": "GridFallback",
                        "visible": True,
                        "color": "#666666"
                    }
                    
                    annotations.append({
                        "annotation": annotation,
                        "confidence": 0.3,
                        "method": "GridFallback"
                    })
        
        return annotations
    
    def _select_mask_by_point(self, masks: np.ndarray, point: tuple, image_shape: tuple) -> tuple:
        """根据点击位置选择最相关的mask"""
        x, y = point
        h, w = image_shape
        
        x = max(0, min(x, w - 1))
        y = max(0, min(y, h - 1))
        
        best_mask = None
        best_score = 0
        
        for mask in masks:
            if mask[y, x] > 0.5:
                area = np.sum(mask > 0.5)
                if area == 0:
                    continue
                
                coords = np.where(mask > 0.5)
                if len(coords[0]) == 0:
                    continue
                
                min_y, max_y = coords[0].min(), coords[0].max()
                min_x, max_x = coords[1].min(), coords[1].max()
                bbox_area = (max_y - min_y + 1) * (max_x - min_x + 1)
                compactness = area / bbox_area if bbox_area > 0 else 0
                
                score = compactness * (1 - abs(area - 5000) / 50000)
                
                if score > best_score:
                    best_score = score
                    best_mask = mask
        
        if best_mask is None:
            best_mask = masks[0] if len(masks) > 0 else np.zeros(image_shape, dtype=bool)
            best_score = 0.1
        
        return best_mask, min(best_score, 1.0)
    
    def _mask_to_annotation(self, mask: np.ndarray, confidence: float, method: str, index: int) -> Dict[str, Any]:
        """将mask转换为标注格式"""
        coords = np.where(mask > 0.5)
        if len(coords[0]) == 0:
            return {
                "type": "empty",
                "confidence": 0.0,
                "method": method
            }
        
        min_y, max_y = int(coords[0].min()), int(coords[0].max())
        min_x, max_x = int(coords[1].min()), int(coords[1].max())
        
        center_x = (min_x + max_x) // 2
        center_y = (min_y + max_y) // 2
        
        # 生成轮廓
        try:
            import cv2
            mask_uint8 = (mask > 0.5).astype(np.uint8) * 255
            contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            contour_list = [contour.reshape(-1, 2).tolist() for contour in contours[:3]]
        except:
            contour_list = []
        
        return {
            "id": f"{method.lower()}_annotation_{int(time.time()*1000)}_{index}",
            "type": "detection",
            "name": f"{method}_object_{index + 1}",
            "geometry": {
                "type": "rectangle",
                "coordinates": [min_x, min_y, max_x, max_y]
            },
            "center": {"x": center_x, "y": center_y},
            "confidence": float(confidence),
            "class_name": "object",
            "method": method,
            "visible": True,
            "color": self._get_color_by_confidence(confidence),
            "contours": contour_list,
            "number": index + 1
        }
    
    def _get_color_by_confidence(self, confidence: float) -> str:
        """根据置信度选择颜色"""
        if confidence >= 0.8:
            return "#00ff00"  # 绿色
        elif confidence >= 0.6:
            return "#ffff00"  # 黄色
        elif confidence >= 0.4:
            return "#ff8800"  # 橙色
        else:
            return "#ff0000"  # 红色
    
    def _convert_to_layer_format(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """转换为标准层格式"""
        return [result["annotation"] for result in results if "annotation" in result]
    
    def _create_mask_visualization(self, image: np.ndarray, results: List[Dict[str, Any]]) -> torch.Tensor:
        """创建掩码可视化"""
        try:
            from PIL import Image, ImageDraw
            
            # 创建可视化图像
            viz_image = Image.fromarray(image).convert("RGBA")
            overlay = Image.new("RGBA", viz_image.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)
            
            # 绘制每个结果
            for i, result in enumerate(results):
                annotation = result.get("annotation", {})
                geometry = annotation.get("geometry", {})
                
                if geometry.get("type") == "rectangle":
                    coords = geometry.get("coordinates", [])
                    if len(coords) == 4:
                        x1, y1, x2, y2 = coords
                        
                        # 根据置信度选择颜色和透明度
                        confidence = result.get("confidence", 0.5)
                        if confidence >= 0.8:
                            color = (0, 255, 0, 100)  # 绿色
                        elif confidence >= 0.6:
                            color = (255, 255, 0, 100)  # 黄色
                        else:
                            color = (255, 128, 0, 100)  # 橙色
                        
                        # 绘制矩形
                        draw.rectangle([x1, y1, x2, y2], fill=color, outline=color[:3] + (255,), width=2)
                        
                        # 绘制标签
                        label = f"{annotation.get('method', 'Unknown')} {i+1}"
                        draw.text((x1, y1-15), label, fill=(255, 255, 255, 255))
            
            # 合并图层
            viz_image = Image.alpha_composite(viz_image, overlay)
            viz_image = viz_image.convert("RGB")
            
            # 转换为tensor
            viz_array = np.array(viz_image).astype(np.float32) / 255.0
            viz_tensor = torch.from_numpy(viz_array).unsqueeze(0)  # 添加batch维度
            
            return viz_tensor
            
        except Exception as e:
            print(f"⚠️ 可视化创建失败: {e}")
            # 返回原图
            image_tensor = torch.from_numpy(image.astype(np.float32) / 255.0).unsqueeze(0)
            return image_tensor
    
    def _create_error_result(self, error_msg: str) -> Tuple[str, str, str, torch.Tensor]:
        """创建错误结果"""
        error_layers = [{
            "id": "error_annotation",
            "type": "error",
            "name": "Error",
            "confidence": 0.0,
            "class_name": "error",
            "method": "Error",
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
            "model_used": "none",
            "device": self.device
        }
        
        error_debug = {
            "error": error_msg,
            "available_models": self._get_available_sam2_models()
        }
        
        # 创建错误可视化
        error_viz = torch.zeros((1, 100, 100, 3), dtype=torch.float32)
        
        return (
            json.dumps(error_layers, ensure_ascii=False),
            json.dumps(error_stats, ensure_ascii=False),
            json.dumps(error_debug, ensure_ascii=False),
            error_viz
        )

# ComfyUI节点注册
NODE_CLASS_MAPPINGS = {
    "SAM2ComfyUINativeNode": SAM2ComfyUINativeNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "SAM2ComfyUINativeNode": "🎯 SAM2 ComfyUI Native",
}

if __name__ == "__main__":
    # 测试代码
    print("🧪 SAM2 ComfyUI原生节点测试")
    node = SAM2ComfyUINativeNode()
    print(f"✅ 节点创建成功，可用模型: {node._get_available_sam2_models()}")
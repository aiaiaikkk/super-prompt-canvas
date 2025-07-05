"""
SAM2 Loader (Impact Pack风格)
仿照Impact Pack的SAMLoader设计，提供标准化的SAM2模型加载器
"""

import json
import numpy as np
import torch
import time
from typing import Dict, List, Any, Optional, Tuple, Union
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
    # 尝试导入Impact Pack的SAM相关模块
    from impact.core import SAMLoader as ImpactSAMLoader
    IMPACT_AVAILABLE = True
except ImportError:
    IMPACT_AVAILABLE = False

try:
    # SAM2导入
    from sam2.build_sam import build_sam2
    from sam2.sam2_image_predictor import SAM2ImagePredictor
    from sam2.automatic_mask_generator import SAM2AutomaticMaskGenerator
    SAM2_AVAILABLE = True
except ImportError:
    SAM2_AVAILABLE = False

try:
    # FastSAM导入
    from ultralytics import FastSAM
    FASTSAM_AVAILABLE = True
except ImportError:
    FASTSAM_AVAILABLE = False

class SAM2Model:
    """SAM2模型包装器，兼容Impact Pack风格"""
    
    def __init__(self, model, model_type="sam2", device="cuda"):
        self.model = model
        self.model_type = model_type  # sam2, fastsam
        self.device = device
        self.predictor = None
        self.generator = None
        
        # 根据模型类型初始化预测器
        if model_type == "sam2":
            self.predictor = SAM2ImagePredictor(model)
            try:
                self.generator = SAM2AutomaticMaskGenerator(model)
            except:
                self.generator = None
        elif model_type == "fastsam":
            self.predictor = model  # FastSAM直接作为预测器
    
    def predict(self, image, point_coords=None, point_labels=None, box=None, mask_input=None, multimask_output=True):
        """预测接口，兼容Impact Pack SAM接口"""
        if self.model_type == "sam2" and self.predictor:
            self.predictor.set_image(image)
            return self.predictor.predict(
                point_coords=point_coords,
                point_labels=point_labels,
                box=box,
                mask_input=mask_input,
                multimask_output=multimask_output
            )
        elif self.model_type == "fastsam":
            # FastSAM预测逻辑
            return self._fastsam_predict(image, point_coords, point_labels, box)
        else:
            raise NotImplementedError(f"模型类型 {self.model_type} 不支持predict方法")
    
    def generate(self, image):
        """自动生成masks，兼容Impact Pack接口"""
        if self.model_type == "sam2" and self.generator:
            return self.generator.generate(image)
        elif self.model_type == "fastsam":
            return self._fastsam_generate(image)
        else:
            raise NotImplementedError(f"模型类型 {self.model_type} 不支持generate方法")
    
    def _fastsam_predict(self, image, point_coords=None, point_labels=None, box=None):
        """FastSAM预测实现"""
        # FastSAM的预测逻辑
        results = self.predictor(image, device=self.device, retina_masks=True, imgsz=1024)
        
        if not results or not results[0].masks:
            return np.array([]), np.array([]), np.array([])
        
        masks = results[0].masks.data.cpu().numpy()
        scores = np.ones(len(masks)) * 0.8  # FastSAM默认分数
        logits = np.zeros_like(masks)
        
        # 如果有点坐标，选择最相关的mask
        if point_coords is not None:
            selected_masks = []
            selected_scores = []
            selected_logits = []
            
            for point in point_coords:
                x, y = int(point[0]), int(point[1])
                if 0 <= y < masks.shape[1] and 0 <= x < masks.shape[2]:
                    # 找到包含该点的mask
                    for i, mask in enumerate(masks):
                        if mask[y, x] > 0.5:
                            selected_masks.append(mask)
                            selected_scores.append(scores[i])
                            selected_logits.append(logits[i])
                            break
            
            if selected_masks:
                return np.array(selected_masks), np.array(selected_scores), np.array(selected_logits)
        
        return masks, scores, logits
    
    def _fastsam_generate(self, image):
        """FastSAM自动生成实现"""
        results = self.predictor(image, device=self.device, retina_masks=True, imgsz=1024)
        
        if not results or not results[0].masks:
            return []
        
        masks = results[0].masks.data.cpu().numpy()
        boxes = results[0].boxes.xyxy.cpu().numpy() if results[0].boxes else None
        
        # 转换为Impact Pack格式
        generated_masks = []
        for i, mask in enumerate(masks):
            mask_data = {
                "segmentation": mask,
                "area": int(np.sum(mask)),
                "bbox": boxes[i].tolist() if boxes is not None else self._mask_to_bbox(mask),
                "predicted_iou": 0.8,
                "point_coords": [[0, 0]],  # FastSAM不提供点坐标
                "stability_score": 0.8,
                "crop_box": [0, 0, mask.shape[1], mask.shape[0]]
            }
            generated_masks.append(mask_data)
        
        return generated_masks
    
    def _mask_to_bbox(self, mask):
        """从mask计算边界框"""
        coords = np.where(mask > 0.5)
        if len(coords[0]) == 0:
            return [0, 0, 0, 0]
        
        min_y, max_y = coords[0].min(), coords[0].max()
        min_x, max_x = coords[1].min(), coords[1].max()
        return [min_x, min_y, max_x, max_y]

class SAM2LoaderImpactStyle:
    """SAM2加载器 - Impact Pack风格"""
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "model_name": (cls._get_model_list(), {"default": "auto"}),
                "device_mode": (["AUTO", "Prefer GPU", "CPU"], {"default": "AUTO"}),
            },
            "optional": {
                "provider": (["auto", "sam2", "fastsam"], {"default": "auto"}),
            }
        }
    
    RETURN_TYPES = ("SAM_MODEL", "STRING")
    RETURN_NAMES = ("sam_model", "model_info")
    FUNCTION = "load_model"
    CATEGORY = "kontext/loaders"
    DESCRIPTION = "加载SAM2模型 (Impact Pack兼容风格)"
    
    def __init__(self):
        self.model_cache = {}
        
    @classmethod
    def _get_model_list(cls):
        """获取可用模型列表"""
        models = ["auto"]
        
        # ComfyUI SAM2模型
        if COMFY_AVAILABLE:
            try:
                sam2_models = folder_paths.get_filename_list("sam2")
                models.extend([f"comfyui/{model}" for model in sam2_models])
            except:
                pass
        
        # 标准SAM2模型
        standard_models = [
            "sam2_hiera_large.pt",
            "sam2_hiera_base_plus.pt",
            "sam2_hiera_small.pt",
            "sam2_hiera_tiny.pt"
        ]
        
        # 检查models目录中的模型
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
        if os.path.exists(models_dir):
            for model in standard_models:
                if os.path.exists(os.path.join(models_dir, model)):
                    models.append(f"local/{model}")
        
        # 添加可下载的模型
        models.extend([f"download/{model}" for model in standard_models])
        
        # FastSAM模型
        if FASTSAM_AVAILABLE:
            models.extend(["fastsam/FastSAM-x.pt", "fastsam/FastSAM-s.pt"])
        
        return models
    
    def load_model(self, model_name="auto", device_mode="AUTO", provider="auto"):
        """加载模型"""
        try:
            # 设备选择 (Impact Pack风格)
            if device_mode == "AUTO":
                device = model_management.get_torch_device()
            elif device_mode == "Prefer GPU":
                device = "cuda" if torch.cuda.is_available() else "cpu"
            else:  # CPU
                device = "cpu"
            
            device_str = str(device)
            cache_key = f"{model_name}_{device_str}_{provider}"
            
            # 检查缓存
            if cache_key in self.model_cache:
                print(f"📦 使用缓存模型: {model_name}")
                model_wrapper = self.model_cache[cache_key]
                model_info = f"模型: {model_name} (缓存)\n设备: {device_str}\n类型: {model_wrapper.model_type}"
                return (model_wrapper, model_info)
            
            # 加载新模型
            print(f"🔧 加载SAM2模型: {model_name} -> {device_str}")
            
            model_wrapper, model_info_dict = self._load_model_by_name(model_name, device, provider)
            
            if model_wrapper is None:
                raise Exception(f"模型加载失败: {model_name}")
            
            # 缓存模型
            self.model_cache[cache_key] = model_wrapper
            
            # 格式化模型信息
            model_info = f"模型: {model_info_dict['name']}\n"
            model_info += f"类型: {model_info_dict['type']}\n"
            model_info += f"设备: {device_str}\n"
            model_info += f"路径: {model_info_dict.get('path', 'N/A')}\n"
            model_info += f"大小: {model_info_dict.get('size', 'Unknown')}"
            
            print(f"✅ 模型加载成功: {model_name}")
            return (model_wrapper, model_info)
            
        except Exception as e:
            error_msg = f"模型加载失败: {str(e)}"
            print(f"❌ {error_msg}")
            
            # 返回错误模型
            error_model = SAM2Model(None, "error", device_str)
            return (error_model, error_msg)
    
    def _load_model_by_name(self, model_name, device, provider):
        """根据名称加载模型"""
        
        if model_name == "auto":
            return self._auto_load_best_model(device, provider)
        
        elif model_name.startswith("comfyui/"):
            return self._load_comfyui_model(model_name[8:], device)
        
        elif model_name.startswith("local/"):
            return self._load_local_model(model_name[6:], device)
        
        elif model_name.startswith("download/"):
            return self._download_and_load_model(model_name[9:], device)
        
        elif model_name.startswith("fastsam/"):
            return self._load_fastsam_model(model_name[8:], device)
        
        else:
            # 直接模型名称
            return self._load_direct_model(model_name, device, provider)
    
    def _auto_load_best_model(self, device, provider):
        """自动加载最佳模型"""
        
        # 优先级：ComfyUI SAM2 > 本地SAM2 > FastSAM
        
        if provider in ["auto", "sam2"]:
            # 尝试ComfyUI SAM2
            if COMFY_AVAILABLE:
                try:
                    sam2_models = folder_paths.get_filename_list("sam2")
                    if sam2_models:
                        return self._load_comfyui_model(sam2_models[0], device)
                except:
                    pass
            
            # 尝试本地SAM2
            models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
            for model in ["sam2_hiera_large.pt", "sam2_hiera_base_plus.pt", "sam2_hiera_small.pt"]:
                if os.path.exists(os.path.join(models_dir, model)):
                    return self._load_local_model(model, device)
        
        if provider in ["auto", "fastsam"]:
            # 回退到FastSAM
            if FASTSAM_AVAILABLE:
                return self._load_fastsam_model("FastSAM-x.pt", device)
        
        raise Exception("没有找到可用的模型")
    
    def _load_comfyui_model(self, model_name, device):
        """加载ComfyUI模型"""
        if not COMFY_AVAILABLE:
            raise Exception("ComfyUI不可用")
        
        model_path = folder_paths.get_full_path("sam2", model_name)
        if not model_path:
            raise Exception(f"ComfyUI模型未找到: {model_name}")
        
        if not SAM2_AVAILABLE:
            raise Exception("SAM2库不可用")
        
        # 确定配置文件
        config_map = {
            "sam2_hiera_large.pt": "sam2_hiera_l.yaml",
            "sam2_hiera_base_plus.pt": "sam2_hiera_b+.yaml", 
            "sam2_hiera_small.pt": "sam2_hiera_s.yaml",
            "sam2_hiera_tiny.pt": "sam2_hiera_t.yaml"
        }
        
        config_name = config_map.get(model_name, "sam2_hiera_l.yaml")
        
        # 加载模型
        sam2_model = build_sam2(config_name, model_path, device=device)
        model_wrapper = SAM2Model(sam2_model, "sam2", device)
        
        model_info = {
            "name": model_name,
            "type": "ComfyUI SAM2",
            "path": model_path,
            "size": self._get_file_size(model_path)
        }
        
        return model_wrapper, model_info
    
    def _load_local_model(self, model_name, device):
        """加载本地模型"""
        if not SAM2_AVAILABLE:
            raise Exception("SAM2库不可用")
        
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
        model_path = os.path.join(models_dir, model_name)
        
        if not os.path.exists(model_path):
            raise Exception(f"本地模型文件不存在: {model_path}")
        
        # 配置映射
        config_map = {
            "sam2_hiera_large.pt": "sam2_hiera_l.yaml",
            "sam2_hiera_base_plus.pt": "sam2_hiera_b+.yaml",
            "sam2_hiera_small.pt": "sam2_hiera_s.yaml", 
            "sam2_hiera_tiny.pt": "sam2_hiera_t.yaml"
        }
        
        config_name = config_map.get(model_name, "sam2_hiera_l.yaml")
        
        # 加载模型
        sam2_model = build_sam2(config_name, model_path, device=device)
        model_wrapper = SAM2Model(sam2_model, "sam2", device)
        
        model_info = {
            "name": model_name,
            "type": "Local SAM2",
            "path": model_path,
            "size": self._get_file_size(model_path)
        }
        
        return model_wrapper, model_info
    
    def _download_and_load_model(self, model_name, device):
        """下载并加载模型"""
        if not SAM2_AVAILABLE:
            raise Exception("SAM2库不可用")
        
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
        os.makedirs(models_dir, exist_ok=True)
        
        model_path = os.path.join(models_dir, model_name)
        
        # 如果文件不存在，下载
        if not os.path.exists(model_path):
            print(f"⬇️ 下载模型: {model_name}")
            
            download_urls = {
                "sam2_hiera_large.pt": "https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_hiera_large.pt",
                "sam2_hiera_base_plus.pt": "https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_hiera_base_plus.pt",
                "sam2_hiera_small.pt": "https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_hiera_small.pt",
                "sam2_hiera_tiny.pt": "https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_hiera_tiny.pt"
            }
            
            if model_name not in download_urls:
                raise Exception(f"未知的模型: {model_name}")
            
            # 下载文件
            import urllib.request
            urllib.request.urlretrieve(download_urls[model_name], model_path)
            print(f"✅ 下载完成: {model_name}")
        
        # 加载下载的模型
        return self._load_local_model(model_name, device)
    
    def _load_fastsam_model(self, model_name, device):
        """加载FastSAM模型"""
        if not FASTSAM_AVAILABLE:
            raise Exception("FastSAM不可用")
        
        # 检查本地文件
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
        local_path = os.path.join(models_dir, model_name)
        
        if os.path.exists(local_path):
            fastsam_model = FastSAM(local_path)
            model_path = local_path
        else:
            # 使用ultralytics自动下载
            fastsam_model = FastSAM(model_name)
            model_path = "auto_download"
        
        fastsam_model.to(device)
        model_wrapper = SAM2Model(fastsam_model, "fastsam", device)
        
        model_info = {
            "name": model_name,
            "type": "FastSAM",
            "path": model_path,
            "size": self._get_file_size(local_path) if os.path.exists(local_path) else "Unknown"
        }
        
        return model_wrapper, model_info
    
    def _load_direct_model(self, model_name, device, provider):
        """直接加载模型"""
        # 尝试作为本地模型
        try:
            return self._load_local_model(model_name, device)
        except:
            pass
        
        # 尝试作为FastSAM模型
        if FASTSAM_AVAILABLE and model_name.startswith("FastSAM"):
            try:
                return self._load_fastsam_model(model_name, device)
            except:
                pass
        
        # 尝试下载
        try:
            return self._download_and_load_model(model_name, device)
        except:
            pass
        
        raise Exception(f"无法加载模型: {model_name}")
    
    def _get_file_size(self, file_path):
        """获取文件大小"""
        try:
            if os.path.exists(file_path):
                size_bytes = os.path.getsize(file_path)
                if size_bytes < 1024**2:
                    return f"{size_bytes / 1024:.1f} KB"
                elif size_bytes < 1024**3:
                    return f"{size_bytes / (1024**2):.1f} MB"
                else:
                    return f"{size_bytes / (1024**3):.1f} GB"
        except:
            pass
        return "Unknown"

class SAM2DetectorImpactStyle:
    """SAM2检测器 - Impact Pack风格"""
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "sam_model": ("SAM_MODEL",),
                "image": ("IMAGE",),
                "detection_hint": (["center-1", "horizontal-2", "vertical-2", "rect-4", "diamond-4", "mask-area", "mask-points", "mask-point-bbox", "none"], {"default": "center-1"}),
                "dilation": ("INT", {"default": 0, "min": -512, "max": 512, "step": 1}),
                "threshold": ("FLOAT", {"default": 0.93, "min": 0.0, "max": 1.0, "step": 0.01}),
                "bbox_expansion": ("INT", {"default": 0, "min": 0, "max": 1000, "step": 1}),
                "mask_hint_threshold": ("FLOAT", {"default": 0.7, "min": 0.0, "max": 1.0, "step": 0.01}),
                "mask_hint_use_negative": (["False", "Small", "Outter"], {"default": "False"}),
            },
            "optional": {
                "mask": ("MASK",),
                "bbox": ("BBOX",),
            }
        }
    
    RETURN_TYPES = ("MASK",)
    RETURN_NAMES = ("mask",)
    FUNCTION = "detect"
    CATEGORY = "kontext/detectors"
    DESCRIPTION = "SAM2检测器 (Impact Pack兼容风格)"
    
    def detect(self, sam_model, image, detection_hint="center-1", dilation=0, threshold=0.93, 
               bbox_expansion=0, mask_hint_threshold=0.7, mask_hint_use_negative="False",
               mask=None, bbox=None):
        """执行检测"""
        
        try:
            # 转换图像格式
            if len(image.shape) == 4:
                image_np = image[0].cpu().numpy()
            else:
                image_np = image.cpu().numpy()
            
            # 确保图像是uint8格式
            if image_np.max() <= 1.0:
                image_np = (image_np * 255).astype(np.uint8)
            else:
                image_np = image_np.astype(np.uint8)
            
            h, w = image_np.shape[:2]
            
            # 根据检测提示生成交互点
            point_coords, point_labels = self._generate_detection_points(
                detection_hint, w, h, mask, bbox
            )
            
            # 执行SAM2预测
            if sam_model.model_type == "error":
                # 错误模型，返回空mask
                result_mask = torch.zeros((1, h, w), dtype=torch.float32)
            else:
                masks, scores, logits = sam_model.predict(
                    image_np,
                    point_coords=point_coords,
                    point_labels=point_labels,
                    multimask_output=True
                )
                
                # 选择最佳mask
                if len(masks) > 0:
                    # 应用阈值过滤
                    valid_indices = scores >= threshold
                    if np.any(valid_indices):
                        best_idx = np.argmax(scores[valid_indices])
                        best_mask = masks[valid_indices][best_idx]
                    else:
                        best_mask = masks[np.argmax(scores)]
                    
                    # 转换为tensor
                    result_mask = torch.from_numpy(best_mask.astype(np.float32)).unsqueeze(0)
                    
                    # 应用膨胀
                    if dilation != 0:
                        result_mask = self._apply_dilation(result_mask, dilation)
                else:
                    result_mask = torch.zeros((1, h, w), dtype=torch.float32)
            
            print(f"✅ SAM2检测完成: {detection_hint}, mask形状: {result_mask.shape}")
            return (result_mask,)
            
        except Exception as e:
            print(f"❌ SAM2检测失败: {str(e)}")
            # 返回空mask
            h, w = 512, 512
            if image is not None:
                h, w = image.shape[1:3] if len(image.shape) == 4 else image.shape[:2]
            return (torch.zeros((1, h, w), dtype=torch.float32),)
    
    def _generate_detection_points(self, detection_hint, width, height, mask=None, bbox=None):
        """生成检测点"""
        
        if detection_hint == "center-1":
            # 中心点
            point_coords = np.array([[width // 2, height // 2]])
            point_labels = np.array([1])
            
        elif detection_hint == "horizontal-2":
            # 水平两点
            y_center = height // 2
            point_coords = np.array([
                [width // 4, y_center],
                [3 * width // 4, y_center]
            ])
            point_labels = np.array([1, 1])
            
        elif detection_hint == "vertical-2":
            # 垂直两点
            x_center = width // 2
            point_coords = np.array([
                [x_center, height // 4],
                [x_center, 3 * height // 4]
            ])
            point_labels = np.array([1, 1])
            
        elif detection_hint == "rect-4":
            # 矩形四个角
            margin_x, margin_y = width // 8, height // 8
            point_coords = np.array([
                [margin_x, margin_y],
                [width - margin_x, margin_y],
                [margin_x, height - margin_y],
                [width - margin_x, height - margin_y]
            ])
            point_labels = np.array([1, 1, 1, 1])
            
        elif detection_hint == "diamond-4":
            # 菱形四点
            point_coords = np.array([
                [width // 2, height // 4],      # 顶部
                [3 * width // 4, height // 2],  # 右侧
                [width // 2, 3 * height // 4],  # 底部
                [width // 4, height // 2]       # 左侧
            ])
            point_labels = np.array([1, 1, 1, 1])
            
        elif detection_hint == "mask-area" and mask is not None:
            # 基于mask区域的点
            if len(mask.shape) == 3:
                mask_np = mask[0].cpu().numpy()
            else:
                mask_np = mask.cpu().numpy()
            
            # 找到mask的质心
            coords = np.where(mask_np > 0.5)
            if len(coords[0]) > 0:
                center_y = int(np.mean(coords[0]))
                center_x = int(np.mean(coords[1]))
                point_coords = np.array([[center_x, center_y]])
                point_labels = np.array([1])
            else:
                # 回退到中心点
                point_coords = np.array([[width // 2, height // 2]])
                point_labels = np.array([1])
                
        elif detection_hint == "none":
            # 无点，使用自动生成
            point_coords = None
            point_labels = None
            
        else:
            # 默认中心点
            point_coords = np.array([[width // 2, height // 2]])
            point_labels = np.array([1])
        
        return point_coords, point_labels
    
    def _apply_dilation(self, mask, dilation):
        """应用膨胀或腐蚀"""
        try:
            import cv2
            
            mask_np = mask[0].cpu().numpy()
            
            if dilation > 0:
                # 膨胀
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilation*2+1, dilation*2+1))
                mask_np = cv2.dilate(mask_np, kernel, iterations=1)
            elif dilation < 0:
                # 腐蚀
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (-dilation*2+1, -dilation*2+1))
                mask_np = cv2.erode(mask_np, kernel, iterations=1)
            
            return torch.from_numpy(mask_np).unsqueeze(0)
            
        except ImportError:
            print("⚠️ OpenCV不可用，跳过膨胀处理")
            return mask
        except Exception as e:
            print(f"⚠️ 膨胀处理失败: {e}")
            return mask

# ComfyUI节点注册
NODE_CLASS_MAPPINGS = {
    "SAM2LoaderImpactStyle": SAM2LoaderImpactStyle,
    "SAM2DetectorImpactStyle": SAM2DetectorImpactStyle,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "SAM2LoaderImpactStyle": "📦 SAM2 Loader (Impact Style)",
    "SAM2DetectorImpactStyle": "🎯 SAM2 Detector (Impact Style)",
}

# 为了兼容性，也注册简化版本名称
NODE_CLASS_MAPPINGS.update({
    "SAM2Loader": SAM2LoaderImpactStyle,
    "SAM2Detector": SAM2DetectorImpactStyle,
})

NODE_DISPLAY_NAME_MAPPINGS.update({
    "SAM2Loader": "📦 SAM2 Loader",
    "SAM2Detector": "🎯 SAM2 Detector",
})

if __name__ == "__main__":
    # 测试代码
    print("🧪 SAM2 Impact Style节点测试")
    loader = SAM2LoaderImpactStyle()
    print(f"✅ 可用模型: {loader._get_model_list()}")
    
    detector = SAM2DetectorImpactStyle()
    print("✅ 检测器创建成功")
"""
SAM2通用节点
支持云端/本地部署的通用ComfyUI节点
"""

import json
import numpy as np
import torch
import requests
import time
import base64
import io
from typing import Dict, List, Any, Optional, Tuple
from PIL import Image
import os
import sys

# 添加当前目录到路径
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

try:
    from sam2_universal_service import get_universal_service
    UNIVERSAL_SERVICE_AVAILABLE = True
except ImportError as e:
    print(f"SAM2通用服务导入失败: {e}")
    UNIVERSAL_SERVICE_AVAILABLE = False

try:
    import comfy.model_management as model_management
    from nodes import MAX_RESOLUTION
    COMFY_AVAILABLE = True
except ImportError:
    COMFY_AVAILABLE = False
    MAX_RESOLUTION = 8192

class SAM2UniversalNode:
    """SAM2通用节点 - 支持云端/本地自动切换"""
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
            },
            "optional": {
                "mode": (["auto", "fast", "precise"], {"default": "auto"}),
                "interaction_points": ("STRING", {
                    "multiline": True, 
                    "default": "[]", 
                    "tooltip": "JSON格式交互点: [{\"type\":\"point\",\"point\":[x,y]}]"
                }),
                "confidence_threshold": ("FLOAT", {
                    "default": 0.4, 
                    "min": 0.1, 
                    "max": 1.0, 
                    "step": 0.1
                }),
                "service_url": ("STRING", {
                    "default": "auto",
                    "tooltip": "服务URL，auto为自动检测"
                }),
                "enable_sam2": ("BOOLEAN", {
                    "default": True,
                    "tooltip": "启用SAM2精确模式"
                }),
                "timeout": ("INT", {
                    "default": 30,
                    "min": 5,
                    "max": 120,
                    "tooltip": "请求超时时间(秒)"
                })
            }
        }
    
    RETURN_TYPES = ("STRING", "STRING", "STRING", "STRING")
    RETURN_NAMES = ("layers_json", "performance_stats", "service_info", "debug_info")
    FUNCTION = "universal_segment"
    CATEGORY = "kontext/sam2"
    DESCRIPTION = "SAM2通用智能分割，支持云端/本地自动切换"
    
    def __init__(self):
        self.service_urls = []
        self.active_service_url = None
        self.last_detection_time = 0
        self.detection_interval = 60  # 60秒重新检测一次
        
    def universal_segment(
        self, 
        image: torch.Tensor, 
        mode: str = "auto",
        interaction_points: str = "[]",
        confidence_threshold: float = 0.4,
        service_url: str = "auto",
        enable_sam2: bool = True,
        timeout: int = 30
    ) -> Tuple[str, str, str, str]:
        """执行通用智能分割"""
        
        try:
            start_time = time.time()
            
            # 检测或验证服务
            active_url = self._get_active_service_url(service_url, timeout)
            
            if not active_url:
                # 回退到本地服务
                return self._fallback_local_service(
                    image, mode, interaction_points, confidence_threshold, enable_sam2
                )
            
            # 转换图像为base64
            image_data = self._tensor_to_base64(image)
            
            # 解析交互点
            try:
                interactions = json.loads(interaction_points) if interaction_points.strip() else []
            except json.JSONDecodeError:
                print("⚠️ 交互点JSON解析失败，使用默认中心点")
                interactions = []
            
            # 如果没有交互点，生成默认点
            if not interactions:
                h, w = image.shape[1:3]
                interactions = [{"type": "point", "point": [w//2, h//2]}]
            
            # 调用远程服务
            response_data = self._call_remote_service(
                active_url, image_data, interactions, mode, confidence_threshold, enable_sam2, timeout
            )
            
            if response_data["success"]:
                # 转换结果格式
                layers_data = self._convert_results_to_layers(response_data["results"])
                
                # 生成输出
                layers_json = json.dumps(layers_data, ensure_ascii=False, indent=2)
                
                # 性能统计
                total_time = time.time() - start_time
                perf_stats = {
                    "service_url": active_url,
                    "service_type": self._detect_service_type(active_url),
                    "total_time_ms": total_time * 1000,
                    "remote_time_ms": response_data.get("performance_stats", {}).get("response_time_ms", 0),
                    "method": response_data.get("performance_stats", {}).get("method", "Unknown"),
                    "device": response_data.get("performance_stats", {}).get("device", "Unknown")
                }
                perf_json = json.dumps(perf_stats, ensure_ascii=False, indent=2)
                
                # 服务信息
                service_info = {
                    "active_url": active_url,
                    "service_type": perf_stats["service_type"],
                    "connection_status": "connected",
                    "response_time_ms": perf_stats["total_time_ms"]
                }
                service_json = json.dumps(service_info, ensure_ascii=False, indent=2)
                
                # 调试信息
                debug_info = {
                    "total_interactions": len(interactions),
                    "successful_results": len(response_data["results"]),
                    "service_detection": self.service_urls,
                    "image_info": {
                        "shape": list(image.shape),
                        "device": str(image.device)
                    }
                }
                debug_json = json.dumps(debug_info, ensure_ascii=False, indent=2)
                
                print(f"✅ SAM2通用分割完成: {len(layers_data)}个结果 ({total_time*1000:.1f}ms)")
                return (layers_json, perf_json, service_json, debug_json)
            
            else:
                error_msg = response_data.get("error", "远程服务调用失败")
                print(f"❌ 远程服务失败: {error_msg}")
                return self._create_error_result(error_msg, active_url)
                
        except Exception as e:
            error_msg = f"SAM2通用分割失败: {str(e)}"
            print(f"❌ {error_msg}")
            return self._create_error_result(error_msg, self.active_service_url)
    
    def _get_active_service_url(self, service_url: str, timeout: int) -> Optional[str]:
        """获取活跃的服务URL"""
        current_time = time.time()
        
        # 如果指定了具体URL
        if service_url != "auto":
            if self._test_service_connection(service_url, timeout):
                self.active_service_url = service_url
                return service_url
            else:
                print(f"⚠️ 指定的服务URL不可用: {service_url}")
                return None
        
        # 如果已有活跃服务且未超时
        if (self.active_service_url and 
            current_time - self.last_detection_time < self.detection_interval and
            self._test_service_connection(self.active_service_url, 5)):
            return self.active_service_url
        
        # 重新检测服务
        print("🔍 检测可用的SAM2服务...")
        self.service_urls = self._detect_available_services(timeout)
        self.last_detection_time = current_time
        
        if self.service_urls:
            self.active_service_url = self.service_urls[0]
            print(f"✅ 选择服务: {self.active_service_url}")
            return self.active_service_url
        
        print("❌ 未找到可用的SAM2服务")
        return None
    
    def _detect_available_services(self, timeout: int) -> List[str]:
        """检测可用的服务列表"""
        # 构建候选URL列表
        candidate_urls = []
        
        # 检测环境类型
        is_cloud = self._is_cloud_environment()
        
        if is_cloud:
            # 云端环境：尝试相同主机的不同端口
            import socket
            hostname = socket.getfqdn()
            candidate_urls.extend([
                "http://localhost:8002",
                f"http://{hostname}:8002",
                "http://127.0.0.1:8002",
                "http://0.0.0.0:8002"
            ])
        else:
            # 本地环境
            candidate_urls.extend([
                "http://localhost:8002",
                "http://127.0.0.1:8002"
            ])
        
        # 测试每个候选URL
        available_services = []
        for url in candidate_urls:
            if self._test_service_connection(url, timeout // len(candidate_urls) or 1):
                available_services.append(url)
                print(f"✅ 发现服务: {url}")
        
        return available_services
    
    def _is_cloud_environment(self) -> bool:
        """检测是否为云端环境"""
        indicators = [
            os.getenv("CLOUD_PROVIDER") is not None,
            os.getenv("KUBERNETES_SERVICE_HOST") is not None,
            os.getenv("AWS_EXECUTION_ENV") is not None,
            os.path.exists("/.dockerenv")
        ]
        return any(indicators)
    
    def _test_service_connection(self, url: str, timeout: int) -> bool:
        """测试服务连接"""
        try:
            response = requests.get(f"{url}/health", timeout=timeout)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    return True
        except Exception:
            pass
        return False
    
    def _detect_service_type(self, url: str) -> str:
        """检测服务类型"""
        if "localhost" in url or "127.0.0.1" in url:
            return "local"
        elif url.startswith("http://") and ":" in url:
            return "cloud"
        else:
            return "unknown"
    
    def _tensor_to_base64(self, tensor: torch.Tensor) -> str:
        """将tensor转换为base64字符串"""
        # 转换为PIL图像
        if len(tensor.shape) == 4:
            tensor = tensor[0]  # 移除batch维度
        
        if tensor.device.type == 'cuda':
            tensor = tensor.cpu()
        
        numpy_array = tensor.numpy()
        
        # 确保值范围在[0, 255]
        if numpy_array.max() <= 1.0:
            numpy_array = (numpy_array * 255).astype(np.uint8)
        else:
            numpy_array = numpy_array.astype(np.uint8)
        
        # 转换为PIL图像
        pil_image = Image.fromarray(numpy_array)
        
        # 转换为base64
        buffer = io.BytesIO()
        pil_image.save(buffer, format='PNG')
        image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return f"data:image/png;base64,{image_data}"
    
    def _call_remote_service(
        self, 
        service_url: str, 
        image_data: str, 
        interactions: List[Dict[str, Any]], 
        mode: str,
        confidence_threshold: float,
        enable_sam2: bool,
        timeout: int
    ) -> Dict[str, Any]:
        """调用远程服务"""
        
        # 选择API端点
        if mode == "fast":
            endpoint = "/preview"
        elif mode == "precise":
            endpoint = "/segment"
        else:
            endpoint = "/smart_segment"
        
        # 构建请求数据
        request_data = {
            "image_data": image_data,
            "interactions": interactions,
            "mode": mode,
            "confidence_threshold": confidence_threshold,
            "enable_sam2": enable_sam2,
            "session_id": f"comfyui_{int(time.time())}"
        }
        
        try:
            response = requests.post(
                f"{service_url}{endpoint}",
                json=request_data,
                timeout=timeout,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": f"请求超时 ({timeout}秒)"
            }
        except requests.exceptions.ConnectionError:
            return {
                "success": False,
                "error": "连接失败"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"请求失败: {str(e)}"
            }
    
    def _convert_results_to_layers(self, results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """将API结果转换为层格式"""
        layers = []
        
        for i, result in enumerate(results):
            if "annotation" in result:
                annotation = result["annotation"]
                
                # 基础层数据
                layer = {
                    "id": annotation.get("id", f"sam2_universal_{i}"),
                    "type": annotation.get("type", "detection"),
                    "name": annotation.get("name", f"SAM2_Object_{i+1}"),
                    "confidence": annotation.get("confidence", 0.5),
                    "class_name": annotation.get("class_name", "object"),
                    "method": result.get("method", "SAM2Universal"),
                    "visible": True,
                    "color": annotation.get("color", "#00ff00"),
                    "number": i + 1
                }
                
                # 添加几何信息
                if "geometry" in annotation:
                    layer["geometry"] = annotation["geometry"]
                
                # 添加中心点
                if "center" in annotation:
                    layer["center"] = annotation["center"]
                
                # 添加轮廓
                if "contours" in annotation:
                    layer["contours"] = annotation["contours"]
                
                layers.append(layer)
        
        return layers
    
    def _fallback_local_service(
        self,
        image: torch.Tensor,
        mode: str,
        interaction_points: str,
        confidence_threshold: float,
        enable_sam2: bool
    ) -> Tuple[str, str, str, str]:
        """回退到本地服务"""
        print("🔄 使用本地回退服务...")
        
        if not UNIVERSAL_SERVICE_AVAILABLE:
            return self._create_error_result("本地服务不可用", "local_fallback")
        
        try:
            # 获取本地服务实例
            local_service = get_universal_service()
            
            # 转换图像
            image_np = self._tensor_to_numpy(image)
            
            # 解析交互点
            try:
                interactions = json.loads(interaction_points) if interaction_points.strip() else []
            except json.JSONDecodeError:
                interactions = []
            
            if not interactions:
                h, w = image_np.shape[:2]
                interactions = [{"type": "point", "point": [w//2, h//2]}]
            
            # 执行本地分割
            results = []
            for interaction in interactions:
                result = local_service._smart_segment(image_np, interaction, mode, confidence_threshold)
                if result["success"]:
                    results.append(result)
            
            # 转换结果
            layers_data = self._convert_results_to_layers(results)
            layers_json = json.dumps(layers_data, ensure_ascii=False, indent=2)
            
            # 性能统计
            perf_stats = {
                "service_type": "local_fallback",
                "device": str(image.device),
                "method": "Local" + ("SAM2" if enable_sam2 else "FastSAM")
            }
            perf_json = json.dumps(perf_stats, ensure_ascii=False, indent=2)
            
            # 服务信息
            service_info = {
                "active_url": "local_fallback",
                "service_type": "local",
                "connection_status": "fallback"
            }
            service_json = json.dumps(service_info, ensure_ascii=False, indent=2)
            
            # 调试信息
            debug_info = {
                "fallback_used": True,
                "successful_results": len(results)
            }
            debug_json = json.dumps(debug_info, ensure_ascii=False, indent=2)
            
            print(f"✅ 本地回退分割完成: {len(layers_data)}个结果")
            return (layers_json, perf_json, service_json, debug_json)
            
        except Exception as e:
            return self._create_error_result(f"本地回退失败: {str(e)}", "local_fallback")
    
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
    
    def _create_error_result(self, error_msg: str, service_url: Optional[str]) -> Tuple[str, str, str, str]:
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
            "service_url": service_url,
            "service_type": "error"
        }
        
        error_service_info = {
            "active_url": service_url,
            "service_type": "error",
            "connection_status": "failed",
            "error": error_msg
        }
        
        error_debug = {
            "error": error_msg,
            "detected_services": self.service_urls,
            "fallback_attempted": True
        }
        
        return (
            json.dumps(error_layers, ensure_ascii=False),
            json.dumps(error_stats, ensure_ascii=False),
            json.dumps(error_service_info, ensure_ascii=False),
            json.dumps(error_debug, ensure_ascii=False)
        )

# ComfyUI节点注册
NODE_CLASS_MAPPINGS = {
    "SAM2UniversalNode": SAM2UniversalNode,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "SAM2UniversalNode": "🌐 SAM2 Universal Segmentation",
}

if __name__ == "__main__":
    # 测试代码
    print("🧪 SAM2通用节点测试")
    node = SAM2UniversalNode()
    print("✅ 节点创建成功")
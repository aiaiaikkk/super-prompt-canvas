# Super Canvas - 专业画布标注工具
import torch
import numpy as np
import base64
import cv2
import time
from PIL import Image, ImageOps
from io import BytesIO
from threading import Event
import asyncio
from aiohttp import web

# ComfyUI imports
try:
    from server import PromptServer
    routes = PromptServer.instance.routes
except ImportError as e:
    pass

CATEGORY_TYPE = "🎨 Super Canvas"

def get_canvas_cache():
    """获取Super Canvas节点的临时缓存"""
    if not hasattr(PromptServer.instance, '_kontext_canvas_node_cache'):
        PromptServer.instance._kontext_canvas_node_cache = {}
    return PromptServer.instance._kontext_canvas_node_cache


def base64_to_tensor(base64_string):
    """将 base64 图像数据转换为 tensor"""
    try:
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        
        with BytesIO(image_data) as bio:
            with Image.open(bio) as image:
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # 转换为numpy数组并归一化
                image_np = np.array(image).astype(np.float32) / 255.0

                # 处理灰度图像
                if image_np.ndim == 2:
                    image_np = np.stack([image_np] * 3, axis=-1)
                # 处理RGBA图像
                elif image_np.shape[2] == 4:
                    image_np = image_np[:, :, :3]

                # 确保图像格式正确 [B, H, W, C]
                image_np = np.expand_dims(image_np, axis=0)
                tensor = torch.from_numpy(image_np).float()
                return tensor
    
    except Exception as e:
        raise

def toBase64ImgUrl(img):
    bytesIO = BytesIO()
    img.save(bytesIO, format="png")
    img_types = bytesIO.getvalue()
    img_base64 = base64.b64encode(img_types)
    return f"data:image/png;base64,{img_base64.decode('utf-8')}"

def tensor_to_base64(tensor):
    if len(tensor.shape) == 3:
        tensor = tensor.unsqueeze(0)
    
    array = (tensor[0].cpu().numpy() * 255).astype(np.uint8)
    
    if array.shape[-1] == 1:
        array = np.repeat(array, 3, axis=-1)
    elif array.shape[-1] == 4:
        # RGBA -> BGRA
        array = array[..., [2,1,0,3]]
    else:
        # RGB -> BGR
        array = array[..., ::-1]
    
    array = np.ascontiguousarray(array)
    
    try:
        success, buffer = cv2.imencode('.png', array)
        if success:
            return f"data:image/png;base64,{base64.b64encode(buffer).decode('utf-8')}"
    except Exception as e:
        pass
    
    return None

@routes.post("/lrpg_canvas")
async def handle_canvas_data(request):
    try:
        data = await request.json()
        node_id = data.get('node_id')
        
        
        if not node_id:
            return web.json_response({"status": "error", "message": "Missing node_id"}, status=400)

        
        waiting_node = None
        
        for i, node in enumerate(LRPGCanvas.active_nodes):
            event_status = "等待中" if node.waiting_for_response else "已响应"
            node_id_str = getattr(node, 'node_id', '未知')
            
            if node.waiting_for_response and node.node_id == node_id:
                waiting_node = node
                break

        if not waiting_node:
            # 没有等待的节点，直接返回成功
            return web.Response(status=200)
            
        transform_data = data.get('layer_transforms', {})
        main_image = array_to_tensor(data.get('main_image'), "image")
        main_mask = array_to_tensor(data.get('main_mask'), "mask")
        
        if main_image is not None:
            pass
        if main_mask is not None:
            pass

        processed_data = {
            'image': main_image,
            'mask': main_mask,
            'transform_data': transform_data
        }

        # 暂存transform_data供后续使用
        waiting_node.transform_data = transform_data

        waiting_node.processed_data = processed_data
        waiting_node.response_event.set()

        return web.json_response({"status": "success"})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return web.json_response({"status": "error", "message": str(e)}, status=500)

# 删除冗余的API端点，前端已有localStorage持久化

class LRPGCanvas:
    # 将活动节点列表移到类属性 - 复制lg_tools的做法
    active_nodes = []
    
    def __init__(self):
        self.response_event = Event()
        self.processed_data = None
        self.node_id = None
        self.waiting_for_response = False
        self.transform_data = None  # 临时存储transform数据
        
        # 清理已有节点并添加自己 - 完全复制lg_tools的做法
        LRPGCanvas.clean_nodes()
        LRPGCanvas.active_nodes.append(self)


    @classmethod
    def clean_nodes(cls):
        """清理非活动节点 - 完全复制lg_tools的做法"""
        cls.active_nodes = [node for node in cls.active_nodes 
                          if node.waiting_for_response and hasattr(node, 'response_event')]
    
    @classmethod
    def INPUT_TYPES(cls):
        # 每次加载节点类型时重置活动节点列表 - 完全复制lg_tools的做法
        cls.active_nodes = []
        return {
            "required": {},
            "hidden": {"unique_id": "UNIQUE_ID"},
            "optional": {
                "image": ("IMAGE",)
            }
        }

    RETURN_TYPES = ("IMAGE", "LAYER_INFO")
    RETURN_NAMES = ("image", "layer_info") 
    FUNCTION = "canvas_execute"
    CATEGORY = CATEGORY_TYPE
    OUTPUT_NODE = True

    @classmethod
    def IS_CHANGED(cls, unique_id, image=None):
        # 强制每次都重新执行 - 关键解决方案
        import time
        return float(time.time())

    def canvas_execute(self, unique_id, image=None):
        try:
            self.node_id = unique_id
            self.response_event.clear()
            self.processed_data = None
            self.waiting_for_response = True
            
            # 确保节点在活动列表中 - 完全复制lg_tools的做法
            if self not in LRPGCanvas.active_nodes:
                LRPGCanvas.active_nodes.append(self)
            

            # 移除lrpg_data逻辑，直接获取画布状态
            PromptServer.instance.send_sync(
                "lrpg_canvas_get_state", {
                    "node_id": unique_id
                }
            )

            if not self.response_event.wait(timeout=30):
                self.waiting_for_response = False
                LRPGCanvas.clean_nodes()
                # 返回默认值而不是None
                if image is not None:
                    # 如果有输入图像，返回原图和空的图层信息
                    empty_layer_info = {
                        'layers': [],
                        'canvas_size': {
                            'width': image.shape[2] if len(image.shape) > 2 else 512,
                            'height': image.shape[1] if len(image.shape) > 1 else 512
                        },
                        'transform_data': {}
                    }
                    return (image, empty_layer_info)
                else:
                    # 如果没有输入图像，创建默认空图像
                    import torch
                    empty_image = torch.zeros((1, 512, 512, 3), dtype=torch.float32)
                    empty_layer_info = {
                        'layers': [],
                        'canvas_size': {'width': 512, 'height': 512},
                        'transform_data': {}
                    }
                    return (empty_image, empty_layer_info)

            self.waiting_for_response = False
            LRPGCanvas.clean_nodes()
            
            if self.processed_data:
                image = self.processed_data.get('image')
                mask = self.processed_data.get('mask')
                transform_data = getattr(self, 'transform_data', {})
                
                if image is not None:
                    bg_height, bg_width = image.shape[1:3]
                    transform_data['background'] = {
                        'width': bg_width,
                        'height': bg_height
                    }
                
                # 构建详细的图层信息
                layer_info = {
                    'layers': [],
                    'canvas_size': {
                        'width': bg_width,
                        'height': bg_height
                    },
                    'transform_data': transform_data
                }
                
                # 从transform_data中提取图层信息
                for layer_id, layer_data in transform_data.items():
                    if layer_id != 'background':
                        layer_info['layers'].append({
                            'id': layer_id,
                            'transform': layer_data,
                            'visible': layer_data.get('visible', True),
                            'locked': layer_data.get('locked', False),
                            'z_index': layer_data.get('z_index', 0)
                        })
                
                # 按z_index排序
                layer_info['layers'].sort(key=lambda x: x.get('z_index', 0))
                
                return image, layer_info
            
            # 没有处理数据时返回默认值
            if image is not None:
                empty_layer_info = {
                    'layers': [],
                    'canvas_size': {
                        'width': image.shape[2] if len(image.shape) > 2 else 512,
                        'height': image.shape[1] if len(image.shape) > 1 else 512
                    },
                    'transform_data': {}
                }
                return (image, empty_layer_info)
            else:
                import torch
                empty_image = torch.zeros((1, 512, 512, 3), dtype=torch.float32)
                empty_layer_info = {
                    'layers': [],
                    'canvas_size': {'width': 512, 'height': 512},
                    'transform_data': {}
                }
                return (empty_image, empty_layer_info)

        except Exception as e:
            import traceback
            traceback.print_exc()
            self.waiting_for_response = False
            LRPGCanvas.clean_nodes()
            # 异常时也返回默认值
            if image is not None:
                empty_layer_info = {
                    'layers': [],
                    'canvas_size': {
                        'width': image.shape[2] if len(image.shape) > 2 else 512,
                        'height': image.shape[1] if len(image.shape) > 1 else 512
                    },
                    'transform_data': {}
                }
                return (image, empty_layer_info)
            else:
                import torch
                empty_image = torch.zeros((1, 512, 512, 3), dtype=torch.float32)
                empty_layer_info = {
                    'layers': [],
                    'canvas_size': {'width': 512, 'height': 512},
                    'transform_data': {}
                }
                return (empty_image, empty_layer_info)

    def __del__(self):
        # 确保从活动节点列表中删除 - 完全复制lg_tools的做法
        if self in LRPGCanvas.active_nodes:
            LRPGCanvas.active_nodes.remove(self)

def array_to_tensor(array_data, data_type):
    try:
        if array_data is None:
            return None

        byte_data = bytes(array_data)
        image = Image.open(BytesIO(byte_data))
        
        if data_type == "mask":
            if 'A' in image.getbands():
                mask = np.array(image.getchannel('A')).astype(np.float32) / 255.0
                mask = torch.from_numpy(mask)
            else:
                mask = torch.zeros((image.height, image.width), dtype=torch.float32)
            return mask.unsqueeze(0)
            
        elif data_type == "image":
            if image.mode != 'RGB':
                image = image.convert('RGB')

            image = np.array(image).astype(np.float32) / 255.0
            return torch.from_numpy(image)[None,] 

        return None

    except Exception as e:
        return None

# 节点注册
NODE_CLASS_MAPPINGS = {
    "LRPGCanvas": LRPGCanvas,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "LRPGCanvas": "🖼️ Super Canvas",
}


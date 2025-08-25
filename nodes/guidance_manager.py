"""
Guidance Manager
用于管理、保存和加载用户自定义的AI指引模板
"""
import os
import json
from typing import Dict, List

class GuidanceManager:
    """处理自定义AI指引的保存、加载和删除"""

    def __init__(self, directory="user_guidance"):
        # 获取当前文件所在目录
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # 在当前文件目录下创建user_guidance子目录
        self.storage_dir = os.path.join(current_dir, directory)
        if not os.path.exists(self.storage_dir):
            os.makedirs(self.storage_dir)

    def _get_guidance_path(self, name: str) -> str:
        """获取指引文件的完整路径"""
        # 对文件名进行安全处理，防止路径遍历
        safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '_', '-')).rstrip()
        return os.path.join(self.storage_dir, f"{safe_name}.json")

    def save_guidance(self, name: str, content: str) -> bool:
        """
        保存自定义指引
        :param name: 指引名称
        :param content: 指引内容
        :return: True if successful, False otherwise
        """
        if not name or not content:
            return False
        
        path = self._get_guidance_path(name)
        try:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump({"name": name, "content": content}, f, ensure_ascii=False, indent=4)
            return True
        except Exception as e:
            return False

    def load_guidance(self, name: str) -> Dict:
        """
        加载指定的自定义指引
        :param name: 指引名称
        :return: A dict with guidance data or an empty dict
        """
        if not name:
            return {}
        
        path = self._get_guidance_path(name)
        if os.path.exists(path):
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                pass
        return {}

    def delete_guidance(self, name: str) -> bool:
        """
        删除指定的自定义指引
        :param name: 指引名称
        :return: True if successful, False otherwise
        """
        if not name:
            return False
        
        path = self._get_guidance_path(name)
        if os.path.exists(path):
            try:
                os.remove(path)
                return True
            except Exception as e:
                pass
        return False

    def list_guidance(self) -> List[str]:
        """
        列出所有已保存的自定义指引名称
        :return: A list of guidance names
        """
        guidance_files = [f for f in os.listdir(self.storage_dir) if f.endswith('.json')]
        names = []
        for file_name in guidance_files:
            try:
                # 从文件名反向解析出指引名称
                name = os.path.splitext(file_name)[0]
                names.append(name)
            except Exception as e:
                pass
        
        return sorted(names)

# 全局实例
guidance_manager = GuidanceManager() 
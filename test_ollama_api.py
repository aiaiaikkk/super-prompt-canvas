#!/usr/bin/env python3
"""
测试Ollama API调用的脚本
用于诊断空响应问题
"""

import requests
import json

def test_ollama_api():
    """测试Ollama API调用"""
    
    # API调用参数
    payload = {
        "model": "qwen3:0.6b",
        "prompt": """Task: 将选定区域的颜色改为红色

引导模板: precise color grading and tonal balance adjustment, clean e-commerce presentation with pure white background and studio lighting

Write one English sentence that describes how to edit the image. Start with an action word like "Transform", "Remove", "Add", or "Enhance".

Example format: "Transform the selected area to red color with natural blending and professional quality"

Your instruction:""",
        "system": "You generate English image editing instructions. Output only the instruction, no explanation.",
        "stream": False,
        "options": {
            "temperature": 0.7,
            "seed": 42,
            "num_predict": 80,
            "top_k": 20,
            "top_p": 0.8,
            "repeat_penalty": 1.05,
            "stop": ["\n\n", "Task:", "Example:"]
        }
    }
    
    print("=== 测试Ollama API调用 ===")
    print(f"URL: http://127.0.0.1:11434/api/generate")
    print(f"Payload:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    print("\n=== 发送请求 ===")
    
    try:
        response = requests.post("http://127.0.0.1:11434/api/generate", json=payload, timeout=60)
        print(f"HTTP状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"完整响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
            
            generated_text = result.get('response', '')
            print(f"\n=== 结果分析 ===")
            print(f"生成的文本: '{generated_text}'")
            print(f"文本长度: {len(generated_text)}")
            print(f"是否为空: {not generated_text}")
            
            if generated_text:
                print("✅ API调用成功，生成了内容")
            else:
                print("❌ API调用成功但返回空内容")
                print("可能的原因:")
                print("1. 模型被stop tokens过早终止")
                print("2. num_predict参数太小")
                print("3. 提示词格式问题")
                
        else:
            print(f"❌ HTTP错误: {response.status_code}")
            print(f"错误内容: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        
def test_simplified_prompt():
    """测试简化版提示词"""
    
    payload = {
        "model": "qwen3:0.6b",
        "prompt": "Change the selected area to red color.",
        "system": "Generate one English sentence for image editing.",
        "stream": False,
        "options": {
            "temperature": 0.7,
            "seed": 42,
            "num_predict": 50
        }
    }
    
    print("\n=== 测试简化版提示词 ===")
    print(f"Payload:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    
    try:
        response = requests.post("http://127.0.0.1:11434/api/generate", json=payload, timeout=60)
        result = response.json()
        generated_text = result.get('response', '')
        print(f"简化版结果: '{generated_text}'")
        print(f"长度: {len(generated_text)}")
        
    except Exception as e:
        print(f"简化版测试失败: {e}")

if __name__ == "__main__":
    test_ollama_api()
    test_simplified_prompt()
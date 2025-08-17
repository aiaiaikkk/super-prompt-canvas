#!/usr/bin/env python3
"""
测试修复后的Ollama API调用
"""

import requests
import json
import re

def clean_response_test(response):
    """测试响应清理函数"""
    print(f"原始响应: {response[:200]}...")
    
    # 1. 处理 <think> 标签 - 提取思考后的内容
    if '<think>' in response:
        # 查找 </think> 后的内容
        think_end = response.find('</think>')
        if think_end != -1:
            after_think = response[think_end + 8:].strip()
            if after_think:
                response = after_think
                print(f"提取</think>后内容: {response[:100]}...")
            else:
                # 如果 </think> 后没有内容，尝试提取 <think> 内的最后一句
                think_content = response[response.find('<think>') + 7:think_end]
                # 查找最后一个完整的英文句子
                sentences = re.findall(r'[A-Z][^.!?]*[.!?]', think_content)
                if sentences:
                    response = sentences[-1].strip()
                    print(f"从<think>内提取: {response}")
    
    # 2. 提取英文编辑指令句子
    instruction_patterns = [
        r'(Transform[^.!?]*[.!?])',
        r'(Remove[^.!?]*[.!?])',
        r'(Add[^.!?]*[.!?])',
        r'(Enhance[^.!?]*[.!?])',
        r'(Apply[^.!?]*[.!?])',
        r'(Change[^.!?]*[.!?])',
        r'(Convert[^.!?]*[.!?])',
        r'([A-Z][a-z]+\s+the\s+selected[^.!?]*[.!?])'
    ]
    
    for pattern in instruction_patterns:
        matches = re.findall(pattern, response, re.IGNORECASE)
        if matches:
            instruction = matches[0].strip()
            print(f"提取编辑指令: {instruction}")
            return instruction
    
    # 3. fallback - 查找任何完整的英文句子
    english_sentences = re.findall(r'[A-Z][a-zA-Z\s,\.;:\-!?()]+[\.!?]', response)
    if english_sentences:
        longest = max(english_sentences, key=len)
        if len(longest) > 15:
            print(f"使用最长英文句子: {longest}")
            return longest.strip()
    
    return "Apply professional editing to the selected area with high quality results"

def test_fixed_ollama():
    """测试修复后的Ollama调用"""
    
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
            "num_predict": 200,
            "top_k": 20,
            "top_p": 0.8,
            "repeat_penalty": 1.05
        }
    }
    
    print("=== 测试修复后的Ollama API ===")
    
    try:
        response = requests.post("http://127.0.0.1:11434/api/generate", json=payload, timeout=60)
        result = response.json()
        
        if response.status_code == 200:
            generated_text = result.get('response', '')
            print(f"HTTP状态码: {response.status_code}")
            print(f"原始响应长度: {len(generated_text)}")
            
            # 使用清理函数处理响应
            cleaned_instruction = clean_response_test(generated_text)
            
            print(f"\n=== 最终结果 ===")
            print(f"清理后的指令: '{cleaned_instruction}'")
            
            if 'Transform' in cleaned_instruction or 'Remove' in cleaned_instruction or 'Add' in cleaned_instruction:
                print("✅ 成功提取有效的编辑指令！")
            else:
                print("⚠️  提取的指令可能不够理想")
                
        else:
            print(f"❌ HTTP错误: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")

if __name__ == "__main__":
    test_fixed_ollama()
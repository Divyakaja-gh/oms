import re

with open("server/ai-helper.ts", "r") as f:
    content = f.read()

content = content.replace("defaultModel = 'gemini-3.6-flash'", "defaultModel = 'gemini-2.5-flash'")
content = content.replace("fallbackModel = 'gemini-1.5-flash'", "fallbackModel = 'gemini-3.6-flash'")

with open("server/ai-helper.ts", "w") as f:
    f.write(content)

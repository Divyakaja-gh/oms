import re

with open("server.ts", "r") as f:
    content = f.read()

# Add import
content = "import { generateContentWithFallback } from './server/ai-helper';\n" + content

# Replace generateContent
content = re.sub(
    r"const aiResponse = await ai\.models\.generateContent\(\{\s*model: 'gemini-3\.6-flash',\s*contents: `(.*?)`,\s*\}\);\s*res\.json\(\{ response: aiResponse\.text \}\);",
    r"const result = await generateContentWithFallback(ai, `\1`);\n    res.json({ response: result.text, fallbackUsed: result.fallbackUsed });",
    content
)

with open("server.ts", "w") as f:
    f.write(content)

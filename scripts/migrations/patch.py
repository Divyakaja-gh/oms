import re

with open("server/agents.ts", "r") as f:
    content = f.read()

# Import the helper at the top
content = "import { generateContentWithFallback } from './ai-helper';\n" + content

# First replace the fallbackUsed variable at the top of the functions or just inside the agent
# Actually, the result object returned from each agent function needs fallbackUsed. 
# It's easier to just track `let overallFallbackUsed = false;` in each function.

def patch_agent(content, fn_name):
    content = re.sub(
        rf"export async function {fn_name}\((.*?)\): Promise<(.*?)> {{",
        rf"export async function {fn_name}(\1): Promise<\2> {{\n  let fallbackUsed = false;",
        content
    )
    
    # Replace ai.models.generateContent
    content = re.sub(
        r"const response = await ai\.models\.generateContent\(\{\s*model: 'gemini-3\.6-flash',\s*contents: prompt\s*\}\);\s*(\w+)\s*=\s*response\.text \|\| '';",
        r"const result = await generateContentWithFallback(ai, prompt);\n      \1 = result.text;\n      if (result.fallbackUsed) fallbackUsed = true;",
        content, count=1 # Only one per function actually
    )
    
    # Add fallbackUsed to the return object
    content = re.sub(
        r"return \{\s*(.*?)\n\s*status: 'READY_FOR_DISPATCH'(.*?)\};",
        r"return {\n        \1\n        status: 'READY_FOR_DISPATCH',\n        fallbackUsed\2};",
        content
    )
    return content

content = patch_agent(content, "runOnboardingAgent")
content = patch_agent(content, "runNoticeTriageAgent")
content = patch_agent(content, "runGstBankReconAgent")

# Note: GST bank recon returns status 'RECON_COMPLETED', let's fix that
content = re.sub(
    r"return \{\s*(.*?)\n\s*status: 'RECON_COMPLETED'(.*?)\};",
    r"return {\n        \1\n        status: 'RECON_COMPLETED',\n        fallbackUsed\2};",
    content
)

with open("server/agents.ts", "w") as f:
    f.write(content)

import os
import glob

def patch_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    # Generic replace for await res.json() assignments
    if filepath.endswith("AIAgent.tsx"):
        content = content.replace(
            "setMessages(prev => [...prev, { role: 'agent', text: data.response }]);",
            "setMessages(prev => [...prev, { role: 'agent', text: data.response }]);\n      if (data.fallbackUsed) {\n        window.dispatchEvent(new CustomEvent('ai_fallback', { detail: { message: 'Primary model unavailable. Defaulted to fallback model.' } }));\n      }"
        )
    else:
        # For the specific views like OnboardingAgentView.tsx etc.
        # we look for: const data: ... = await res.json();
        # followed by setResult(data);
        content = content.replace(
            "setResult(data);",
            "setResult(data);\n        if (data.fallbackUsed) {\n          window.dispatchEvent(new CustomEvent('ai_fallback', { detail: { message: 'Primary model unavailable. Defaulted to fallback model.' } }));\n        }"
        )

    with open(filepath, "w") as f:
        f.write(content)

patch_file("src/pages/AIAgent.tsx")
for f in glob.glob("src/components/agents/*AgentView.tsx"):
    patch_file(f)

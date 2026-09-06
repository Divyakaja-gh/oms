import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = "import { NotificationCenter } from './components/layout/NotificationCenter';\n" + content

content = re.sub(
    r"(</Sidebar>.*?</SessionInactivityModal>\s*</div>)",
    r"\1\n      <NotificationCenter />",
    content,
    flags=re.DOTALL
)

with open("src/App.tsx", "w") as f:
    f.write(content)

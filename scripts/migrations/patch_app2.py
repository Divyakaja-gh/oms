import re

with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("    </div>\n  );\n}", "      <NotificationCenter />\n    </div>\n  );\n}")

with open("src/App.tsx", "w") as f:
    f.write(content)

import re

with open("src/pages/Billing.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
for idx, line in enumerate(lines):
    if "</div>" in line and "isModalOpen && (" in lines[min(idx+2, len(lines)-1)] and "</div>" not in lines[idx-1]:
        pass
    new_lines.append(line)

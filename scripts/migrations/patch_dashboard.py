import re

with open("src/pages/Dashboard.tsx", "r") as f:
    content = f.read()

content = "import { DashboardWeather } from '../components/layout/DashboardWeather';\n" + content

# Replace the specific div with an updated header including the weather widget
old_header = r"""        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('clients')}"""

new_header = r"""        <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
          <DashboardWeather />
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('clients')}"""

content = content.replace(old_header, new_header)

with open("src/pages/Dashboard.tsx", "w") as f:
    f.write(content)

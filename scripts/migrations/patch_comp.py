import re

with open("src/pages/Compliance.tsx", "r") as f:
    content = f.read()

# 1. Add views to state
content = re.sub(
    r"const \[activeView, setActiveView\] = useState<'overview' \| 'templates' \| 'calendar' \| 'gstr3b' \| 'incometax'>\('overview'\);",
    "const [activeView, setActiveView] = useState<'overview' | 'templates' | 'calendar' | 'gstr3b' | 'incometax' | 'tds' | 'health'>('overview');",
    content
)

# 2. Add imports
import_add = """import { TdsManagementTab } from '../components/compliance/TdsManagementTab';
import { ComplianceHealthDashboardTab } from '../components/compliance/ComplianceHealthDashboardTab';
"""
content = re.sub(
    r"import \{ IncomeTaxComputationTab \} from '\.\./components/compliance/IncomeTaxComputationTab';",
    "import { IncomeTaxComputationTab } from '../components/compliance/IncomeTaxComputationTab';\n" + import_add,
    content
)

# 3. Add buttons to the top bar
buttons_add = """            <button
              onClick={() => setActiveView('tds')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'tds'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>TDS Management</span>
            </button>
            <button
              onClick={() => setActiveView('health')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === 'health'
                  ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Health Dashboard</span>
            </button>
            <button
              onClick={() => setActiveView('templates')}"""
content = re.sub(r"            <button\s*onClick=\{\(\) => setActiveView\('templates'\)\}", buttons_add, content)

# 4. Add the actual view components to the main view area
views_add = """      ) : activeView === 'tds' ? (
        <div className="p-8 max-w-[1600px] mx-auto w-full">
          <TdsManagementTab />
        </div>
      ) : activeView === 'health' ? (
        <div className="p-8 max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
          <ComplianceHealthDashboardTab filings={filings} clients={clientOptions} />
        </div>
      ) : ("""
content = re.sub(r"      \) : \(\s*<div className=\"p-8 max-w-\[1600px\] mx-auto w-full\">\s*<StatutoryTemplatesSection />\s*</div>\s*\)", views_add + '\n        <div className="p-8 max-w-[1600px] mx-auto w-full">\n          <StatutoryTemplatesSection />\n        </div>\n      )', content)

with open("src/pages/Compliance.tsx", "w") as f:
    f.write(content)


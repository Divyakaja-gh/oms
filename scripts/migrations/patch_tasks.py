import re

with open("src/pages/Tasks.tsx", "r") as f:
    content = f.read()

# Add priority state
state_match = r"const \[title, setTitle\] = useState\(''\);\s*const \[assignee, setAssignee\] = useState\(''\);"
state_repl = "const [title, setTitle] = useState('');\n  const [assignee, setAssignee] = useState('');\n  const [priority, setPriority] = useState('Medium');"
content = re.sub(state_match, state_repl, content)

# Add priority to payload
payload_match = r"title,\s*assignee,\s*status: 'Pending',"
payload_repl = "title,\n        assignee,\n        priority,\n        status: 'Pending',"
content = re.sub(payload_match, payload_repl, content)

# Reset priority on success
reset_match = r"setTitle\(''\);\s*setAssignee\(''\);"
reset_repl = "setTitle('');\n      setAssignee('');\n      setPriority('Medium');"
content = re.sub(reset_match, reset_repl, content)

# Update the task UI to include the badge
task_ui_match = r"<div className=\"font-bold text-zinc-900\">\{t\.title\}</div>\s*<div className=\"text-sm text-zinc-500 mt-1\">Assignee: \{t\.assignee \|\| 'Unassigned'\} \| Status: \{t\.status\}</div>"
task_ui_repl = """<div className="flex items-center justify-between">
                    <div className="font-bold text-zinc-900">{t.title}</div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      t.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                      t.priority === 'Low' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {t.priority || 'Medium'}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">Assignee: {t.assignee || 'Unassigned'} | Status: {t.status}</div>"""
content = re.sub(task_ui_match, task_ui_repl, content)

# Update form
form_match = r"<div>\s*<label className=\"block text-xs font-bold text-zinc-700 mb-1\">Assignee</label>\s*<input type=\"text\" value=\{assignee\} onChange=\{e => setAssignee\(e.target.value\)\} className=\"w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm\" placeholder=\"T. Varsha\" />\s*</div>"
form_repl = """<div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Assignee</label>
                <input type="text" value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20" placeholder="T. Varsha" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20">
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>"""
content = re.sub(form_match, form_repl, content)

with open("src/pages/Tasks.tsx", "w") as f:
    f.write(content)

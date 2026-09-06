import re

with open("src/pages/Dashboard.tsx", "r") as f:
    content = f.read()

# I need to find the closing div of that section.
# The section is:
#         <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
#           <DashboardWeather />
#           <div className="flex items-center gap-3">
#             ... buttons ...
#           </button>
#         </div>
#       </div>
#       {/* Access Credentials Banner */}

content = content.replace(
    "          </button>\n        </div>\n      </div>\n      {/* Access Credentials Banner */}",
    "          </button>\n        </div>\n        </div>\n      </div>\n      {/* Access Credentials Banner */}"
)

with open("src/pages/Dashboard.tsx", "w") as f:
    f.write(content)

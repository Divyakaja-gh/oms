#!/bin/bash

# Function to add modal to a file
add_modal() {
  local FILE=$1
  local SEARCH=$2
  local MODAL_TITLE=$3

  # Skip if already has modal logic for this specific title
  if grep -q "modalTitle" "$FILE"; then
    # Already wired
    return
  fi

  # Add state var
  sed -i "s/import React from 'react';/import React, { useState } from 'react';/" "$FILE"
  sed -i "s/import React, { useEffect, useState } from 'react';/import React, { useEffect, useState } from 'react';/" "$FILE" # no-op just in case
  
  # Import modal
  sed -i "1s|^|import { ComingSoonModal } from '../components/ui/ComingSoonModal';\n|" "$FILE"

  # Find the main component function (handling different declarations)
  if grep -q "export function" "$FILE"; then
    sed -i "s/export function [a-zA-Z]*() {/&\n  const [isModalOpen, setIsModalOpen] = useState(false);\n  const [modalTitle, setModalTitle] = useState('');\n\n  const openModal = (title: string) => {\n    setModalTitle(title);\n    setIsModalOpen(true);\n  };\n/" "$FILE"
  fi

  # Add modal render at the end before last closing div
  # This is fragile with sed, so we will use a perl script or just sed to inject before the last closing </div>.
  # Let's insert it before the very last </div>
  sed -i '$ s|</div>|  <ComingSoonModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle} />\n</div>|' "$FILE"
}

# Pitching
add_modal "src/pages/Pitching.tsx" "" ""
sed -i "s/<button className=\"flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700/<button onClick={() => openModal('Add New Prospect')} className=\"flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700/" src/pages/Pitching.tsx

# KnowledgeBase
add_modal "src/pages/KnowledgeBase.tsx" "" ""
sed -i "s/<span className=\"text-xs font-bold text-zinc-900\">Upload document File<\/span>/<span onClick={() => openModal('Upload document File')} className=\"text-xs font-bold text-zinc-900 cursor-pointer\">Upload document File<\/span>/" src/pages/KnowledgeBase.tsx

# Vault
add_modal "src/pages/Vault.tsx" "" ""
sed -i "s/<button className=\"flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm\">/<button onClick={() => openModal('Add KMS Secret')} className=\"flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm\">/" src/pages/Vault.tsx

# APIKeys
add_modal "src/pages/APIKeys.tsx" "" ""
sed -i "s/<button className=\"flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm\">/<button onClick={() => openModal('Generate New Key')} className=\"flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm\">/" src/pages/APIKeys.tsx

# Support
add_modal "src/pages/Support.tsx" "" ""
sed -i "s/<button className=\"flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm\">/<button onClick={() => openModal('New Support Request')} className=\"flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm\">/" src/pages/Support.tsx


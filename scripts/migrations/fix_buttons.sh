#!/bin/bash

# Simple script to add a modal to a page
add_modal() {
  local FILE=$1
  local SEARCH=$2
  local MODAL_TITLE=$3

  # If modal already exists, skip
  if grep -q "const \[isModalOpen" "$FILE"; then
    echo "Modal already in $FILE"
    return
  fi

  # Add useState
  sed -i "s/import React from 'react';/import React, { useState } from 'react';/" "$FILE"
  sed -i "s/import {/import { X, /" "$FILE"
  
  # Add state var
  sed -i "s/export function [a-zA-Z]*() {/&\n  const [isModalOpen, setIsModalOpen] = useState(false);\n/" "$FILE"

  # Find the button and add onClick
  sed -i "s/$SEARCH/onClick={() => setIsModalOpen(true)}\n            $SEARCH/" "$FILE"

  # Add modal UI right after the header section
  # This is a bit tricky with sed, let's just append it before the main content div or return statement.
  # A robust way is to just find the first `</div>` after the header and insert there.
}


#!/bin/bash

# Concatenate Functional Requirements and Technical Design into a single file

OUTPUT_FILE="COMBINED_SPEC.md"

{
  echo "# MarkM8 Complete Specification"
  echo ""
  echo "This document combines the Functional Requirements and Technical Design specifications."
  echo ""
  echo "---"
  echo ""
  echo "# Part 1: Functional Requirements"
  echo ""
  cat FUNCTIONAL_REQUIREMENTS.md
  echo ""
  echo "---"
  echo ""
  echo "# Part 2: Technical Design"
  echo ""
  cat TECHNICAL_DESIGN.md
} > "$OUTPUT_FILE"

echo "✅ Successfully created $OUTPUT_FILE"
wc -l FUNCTIONAL_REQUIREMENTS.md TECHNICAL_DESIGN.md "$OUTPUT_FILE"


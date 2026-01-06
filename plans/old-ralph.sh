#!/bin/bash
set -e

# 1. Determine the verification command
# Checks for 'plans/verify_cmd'. Defaults to "npm run build" if missing.
if [ -f "plans/verify_cmd" ]; then
  VERIFY_CMD=$(cat plans/verify_cmd)
else
  VERIFY_CMD="npm run build"
fi

# 2. Check for iteration argument
if [ -z "$1" ]; then
  echo "Usage: ralph <iterations>"
  echo "Current verification command: $VERIFY_CMD"
  exit 1
fi

echo "---------------------------------"
echo "Starting Ralph with command: $VERIFY_CMD"
echo "---------------------------------"

# 3. The Loop
for ((i=1; i<=$1; i++)); do
  echo "Iteration $i"
  echo "---------------------------------"

  # We use | tee /dev/tty so you see the output live
  result=$(claude -p --permission-mode acceptEdits "@plans/prd.json @plans/progress.txt \
1. Find the highest-priority feature to work on and work only on that feature. \
This should be the one YOU decide has the highest priority - not necessarily the first in the list. \
2. Check that the work is correct by running: ${VERIFY_CMD} \
3. Update the PRD (plans/prd.json) with the work that was done - set passes to true for completed features. \
4. Append your progress to the progress.txt file. \
Use this to leave a note for the next person working in the codebase. \
5. Make a git commit of that feature. \
ONLY WORK ON A SINGLE FEATURE. \
If, while implementing the feature, you notice the PRD is complete, output <promise>COMPLETE</promise>.
" | tee /dev/tty)

  # Check for completion signal
  if echo "$result" | grep -q "<promise>COMPLETE</promise>"; then
    echo "PRD complete, exiting."
    exit 0
  fi
done
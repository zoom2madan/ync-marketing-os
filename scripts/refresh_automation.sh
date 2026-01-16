#!/bin/bash
#
# refresh_automation.sh
# 
# This script reads active automations from the database and sets up
# corresponding CRON jobs on the system.
#
# Usage: ./scripts/refresh_automation.sh
#
# Prerequisites:
# - DATABASE_URL environment variable must be set
# - Node.js and npx must be available
# - The script must have execute permissions: chmod +x scripts/refresh_automation.sh
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CRON_TAG="# YNC-MARKETING-OS-AUTOMATION"
LOG_DIR="$PROJECT_DIR/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL environment variable is not set"
        exit 1
    fi

    if ! command -v npx &> /dev/null; then
        log_error "npx is not installed"
        exit 1
    fi

    if ! command -v crontab &> /dev/null; then
        log_error "crontab is not available"
        exit 1
    fi
}

# Create logs directory
setup_logs() {
    mkdir -p "$LOG_DIR"
}

# Get active automations from database
get_automations() {
    cd "$PROJECT_DIR"
    npx tsx scripts/get_automation_data.ts
}

# Remove existing automation cron jobs
remove_existing_crons() {
    log_info "Removing existing automation CRON jobs..."
    
    # Get current crontab, remove our tagged lines, and reinstall
    crontab -l 2>/dev/null | grep -v "$CRON_TAG" | crontab - 2>/dev/null || true
}

# Add new cron jobs for active automations
add_automation_crons() {
    local automations="$1"
    
    if [ -z "$automations" ] || [ "$automations" = "[]" ]; then
        log_warn "No active automations found"
        return
    fi
    
    log_info "Setting up CRON jobs for active automations..."
    
    # Parse JSON and create cron entries
    local cron_entries=""
    
    # Use jq to parse JSON if available, otherwise use node
    if command -v jq &> /dev/null; then
        while IFS= read -r line; do
            local id=$(echo "$line" | jq -r '.id')
            local name=$(echo "$line" | jq -r '.name')
            local cron=$(echo "$line" | jq -r '.cron')
            
            if [ -n "$id" ] && [ -n "$cron" ]; then
                local log_file="$LOG_DIR/automation_${id}.log"
                local entry="$cron cd $PROJECT_DIR && DATABASE_URL=\"\$DATABASE_URL\" npx tsx scripts/run-automation.ts $id >> $log_file 2>&1 $CRON_TAG $name"
                cron_entries="${cron_entries}${entry}\n"
                log_info "  Added: $name (ID: $id) - Schedule: $cron"
            fi
        done < <(echo "$automations" | jq -c '.[]')
    else
        # Fallback: use node to parse JSON
        local parsed=$(node -e "
            const data = $automations;
            data.forEach(a => {
                console.log(JSON.stringify(a));
            });
        ")
        
        while IFS= read -r line; do
            local id=$(echo "$line" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.id)")
            local name=$(echo "$line" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.name)")
            local cron=$(echo "$line" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log(d.cron)")
            
            if [ -n "$id" ] && [ -n "$cron" ]; then
                local log_file="$LOG_DIR/automation_${id}.log"
                local entry="$cron cd $PROJECT_DIR && DATABASE_URL=\"\$DATABASE_URL\" npx tsx scripts/run-automation.ts $id >> $log_file 2>&1 $CRON_TAG $name"
                cron_entries="${cron_entries}${entry}\n"
                log_info "  Added: $name (ID: $id) - Schedule: $cron"
            fi
        done <<< "$parsed"
    fi
    
    # Add new cron entries
    if [ -n "$cron_entries" ]; then
        (crontab -l 2>/dev/null; echo -e "$cron_entries") | crontab -
    fi
}

# List current automation crons
list_crons() {
    log_info "Current automation CRON jobs:"
    crontab -l 2>/dev/null | grep "$CRON_TAG" || log_warn "  No automation CRON jobs found"
}

# Main execution
main() {
    log_info "Starting automation refresh..."
    
    check_prerequisites
    setup_logs
    
    # Get automations from database
    log_info "Fetching active automations from database..."
    local automations=$(get_automations)
    
    if [ $? -ne 0 ]; then
        log_error "Failed to fetch automations"
        exit 1
    fi
    
    # Update cron jobs
    remove_existing_crons
    add_automation_crons "$automations"
    
    echo ""
    list_crons
    
    log_info "Automation refresh completed!"
}

# Run main
main "$@"


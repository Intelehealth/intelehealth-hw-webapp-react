#!/bin/bash

# Deployment Configuration Validation Script
# This script validates all deployment YAML files for consistency and correctness

set -e

echo "🔍 Validating deployment configurations..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to print status
print_status() {
    local status=$1
    local message=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
    else
        echo -e "${BLUE}ℹ️  INFO${NC}: $message"
    fi
}

# Function to check if file exists
check_file_exists() {
    local file=$1
    if [ -f "$file" ]; then
        print_status "PASS" "File exists: $file"
        return 0
    else
        print_status "FAIL" "File missing: $file"
        return 1
    fi
}

# Function to validate YAML syntax
validate_yaml_syntax() {
    local file=$1
    if command -v yq >/dev/null 2>&1; then
        if yq eval '.' "$file" >/dev/null 2>&1; then
            print_status "PASS" "Valid YAML syntax: $file"
            return 0
        else
            print_status "FAIL" "Invalid YAML syntax: $file"
            return 1
        fi
    else
        print_status "WARN" "yq not installed, skipping YAML syntax validation"
        return 0
    fi
}

# Function to check required fields in deployment files
check_required_fields() {
    local file=$1
    local env_name=$2
    
    echo -e "\n${BLUE}📋 Checking required fields in $file${NC}"
    
    # Check if file has required structure
    local required_fields=(
        "name"
        "on"
        "env.NODE_VERSION"
        "env.DEPLOY_ENV"
        "jobs"
    )
    
    for field in "${required_fields[@]}"; do
        if command -v yq >/dev/null 2>&1; then
            if yq eval ".$field" "$file" >/dev/null 2>&1 && [ "$(yq eval ".$field" "$file")" != "null" ]; then
                print_status "PASS" "Required field present: $field"
            else
                print_status "FAIL" "Required field missing: $field"
            fi
        else
            # Handle special cases for grep fallback
            case "$field" in
                "env.NODE_VERSION")
                    if grep -q "NODE_VERSION:" "$file"; then
                        print_status "PASS" "Required field present: $field"
                    else
                        print_status "FAIL" "Required field missing: $field"
                    fi
                    ;;
                "env.DEPLOY_ENV")
                    if grep -q "DEPLOY_ENV:" "$file"; then
                        print_status "PASS" "Required field present: $field"
                    else
                        print_status "FAIL" "Required field missing: $field"
                    fi
                    ;;
                *)
                    if grep -q "$field" "$file"; then
                        print_status "PASS" "Required field present: $field"
                    else
                        print_status "FAIL" "Required field missing: $field"
                    fi
                    ;;
            esac
        fi
    done
    
    # Check environment-specific configurations
    if grep -q "VITE_APP_ENV.*$env_name" "$file"; then
        print_status "PASS" "Environment variable correctly set: VITE_APP_ENV=$env_name"
    else
        print_status "FAIL" "Environment variable incorrect or missing: VITE_APP_ENV=$env_name"
    fi
}

# Function to check step consistency
check_step_consistency() {
    local file=$1
    
    echo -e "\n${BLUE}🔄 Checking step consistency in $file${NC}"
    
    local required_steps=(
        "Checkout code"
        "Setup Node.js"
        "Install dependencies"
        "Run tests"
        "Analyze bundle"
        "Build for"
        "Security audit"
        "Deploy to"
    )
    
    for step in "${required_steps[@]}"; do
        if grep -q "$step" "$file"; then
            print_status "PASS" "Required step present: $step"
        else
            print_status "FAIL" "Required step missing: $step"
        fi
    done
}

# Function to check for commented code
check_commented_code() {
    local file=$1
    
    echo -e "\n${BLUE}🧹 Checking for commented code in $file${NC}"
    
    local comment_count=$(grep -c "^[[:space:]]*#" "$file" || true)
    local todo_comments=$(grep -c "# Add your.*commands here" "$file" || true)
    
    if [ "$todo_comments" -eq 0 ]; then
        print_status "PASS" "No TODO comments found"
    else
        print_status "FAIL" "Found $todo_comments TODO comments that should be removed"
    fi
    
    # Check for large commented blocks (more than 5 consecutive comment lines)
    local large_blocks=$(awk '/^[[:space:]]*#/{c++} !/^[[:space:]]*#/{if(c>5) print "Large comment block found"; c=0}' "$file" | wc -l)
    if [ "$large_blocks" -eq 0 ]; then
        print_status "PASS" "No large commented code blocks found"
    else
        print_status "WARN" "Found $large_blocks large commented code blocks"
    fi
}

# Main validation function
validate_deployment_file() {
    local file=$1
    local env_name=$2
    
    echo -e "\n${BLUE}🔍 Validating $file for $env_name environment${NC}"
    echo "=================================================="
    
    check_file_exists "$file" || return 1
    validate_yaml_syntax "$file"
    check_required_fields "$file" "$env_name"
    check_step_consistency "$file"
    check_commented_code "$file"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_status "FAIL" "Not in project root directory (package.json not found)"
    exit 1
fi

print_status "INFO" "Starting deployment configuration validation"

# Validate each deployment file
validate_deployment_file ".github/workflows/deploy-dev.yml" "development"
validate_deployment_file ".github/workflows/deploy-qa.yml" "qa"
validate_deployment_file ".github/workflows/deploy-staging.yml" "staging"
validate_deployment_file ".github/workflows/deploy-production.yml" "production"

# Check for consistency across files
echo -e "\n${BLUE}🔄 Checking consistency across deployment files${NC}"
echo "=================================================="

# Check Node.js version consistency
dev_node_version=$(grep "NODE_VERSION:" .github/workflows/deploy-dev.yml | head -1 | cut -d"'" -f2)
qa_node_version=$(grep "NODE_VERSION:" .github/workflows/deploy-qa.yml | head -1 | cut -d"'" -f2)
staging_node_version=$(grep "NODE_VERSION:" .github/workflows/deploy-staging.yml | head -1 | cut -d"'" -f2)
prod_node_version=$(grep "NODE_VERSION:" .github/workflows/deploy-production.yml | head -1 | cut -d"'" -f2)

if [ "$dev_node_version" = "$qa_node_version" ] && [ "$qa_node_version" = "$staging_node_version" ] && [ "$staging_node_version" = "$prod_node_version" ]; then
    print_status "PASS" "Node.js version consistent across all environments: $dev_node_version"
else
    print_status "FAIL" "Node.js version inconsistent: dev=$dev_node_version, qa=$qa_node_version, staging=$staging_node_version, prod=$prod_node_version"
fi

# Check for consistent step ordering
echo -e "\n${BLUE}📊 Validation Summary${NC}"
echo "=================================================="
echo -e "Total checks: ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"

if [ "$FAILED_CHECKS" -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All deployment configurations are valid!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ $FAILED_CHECKS validation(s) failed. Please fix the issues above.${NC}"
    exit 1
fi
#!/bin/bash

# Deployment Verification Test Script
# This script tests the deployment process for all environments to ensure they work correctly

# Note: Not using 'set -e' to allow proper handling of expected non-zero exit codes (e.g., yarn audit)

echo "🧪 Testing deployment configurations..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test status
print_test_status() {
    local status=$1
    local message=$2
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
    else
        echo -e "${BLUE}ℹ️  INFO${NC}: $message"
    fi
}

# Function to test environment build
test_environment_build() {
    local env_name=$1
    local vite_env=$2
    
    echo -e "\n${BLUE}🏗️ Testing $env_name environment build${NC}"
    echo "=================================================="
    
    # Set environment variables
    export VITE_APP_ENV="$vite_env"
    export NODE_ENV="production"
    
    # Add development-specific variables
    if [ "$env_name" = "development" ]; then
        export VITE_DEBUG_MODE="true"
    fi
    
    # Test if build command works
    if yarn build >/dev/null 2>&1; then
        print_test_status "PASS" "$env_name build completed successfully"
        
        # Check if dist directory was created
        if [ -d "dist" ]; then
            print_test_status "PASS" "Build output directory created"
            
            # Check if index.html exists
            if [ -f "dist/index.html" ]; then
                print_test_status "PASS" "Main HTML file generated"
            else
                print_test_status "FAIL" "Main HTML file missing"
            fi
            
            # Check if assets directory exists
            if [ -d "dist/assets" ]; then
                print_test_status "PASS" "Assets directory created"
                
                # Check if JS files exist (in js subdirectory)
                if ls dist/assets/js/*.js >/dev/null 2>&1; then
                    print_test_status "PASS" "JavaScript files generated"
                else
                    print_test_status "FAIL" "JavaScript files missing"
                fi
                
                # Check if CSS files exist (in css subdirectory)
                if ls dist/assets/css/*.css >/dev/null 2>&1; then
                    print_test_status "PASS" "CSS files generated"
                else
                    print_test_status "WARN" "CSS files missing (may be expected for some builds)"
                fi
            else
                print_test_status "FAIL" "Assets directory missing"
            fi
            
            # Check bundle size (should be reasonable)
            local bundle_size=$(du -sh dist 2>/dev/null | cut -f1)
            if [ -n "$bundle_size" ]; then
                print_test_status "PASS" "Bundle size: $bundle_size"
            else
                print_test_status "WARN" "Could not determine bundle size"
            fi
            
        else
            print_test_status "FAIL" "Build output directory not created"
        fi
        
        # Clean up build output
        rm -rf dist
        
    else
        print_test_status "FAIL" "$env_name build failed"
    fi
    
    # Unset environment variables
    unset VITE_APP_ENV
    unset NODE_ENV
    unset VITE_DEBUG_MODE
}

# Function to test workflow syntax
test_workflow_syntax() {
    local workflow_file=$1
    local env_name=$2
    
    echo -e "\n${BLUE}📋 Testing $env_name workflow syntax${NC}"
    echo "=================================================="
    
    # Check if file exists
    if [ -f "$workflow_file" ]; then
        print_test_status "PASS" "Workflow file exists: $workflow_file"
        
        # Basic YAML syntax check (if yq is available)
        if command -v yq >/dev/null 2>&1; then
            if yq eval '.' "$workflow_file" >/dev/null 2>&1; then
                print_test_status "PASS" "YAML syntax is valid"
            else
                print_test_status "FAIL" "YAML syntax is invalid"
            fi
        else
            print_test_status "WARN" "yq not available, skipping YAML syntax check"
        fi
        
        # Check for required GitHub Actions structure
        if grep -q "name:" "$workflow_file" && grep -q "on:" "$workflow_file" && grep -q "jobs:" "$workflow_file"; then
            print_test_status "PASS" "GitHub Actions structure is valid"
        else
            print_test_status "FAIL" "GitHub Actions structure is invalid"
        fi
        
        # Check for environment-specific configurations
        if grep -q "VITE_APP_ENV.*$env_name" "$workflow_file"; then
            print_test_status "PASS" "Environment variable correctly configured"
        else
            print_test_status "FAIL" "Environment variable not configured correctly"
        fi
        
        # Check for required steps
        local required_steps=(
            "Checkout code"
            "Setup Node.js"
            "Install dependencies"
            "Run tests"
            "Analyze bundle"
            "Security audit"
            "Build for"
            "Deploy to"
        )
        
        for step in "${required_steps[@]}"; do
            if grep -q "$step" "$workflow_file"; then
                print_test_status "PASS" "Required step present: $step"
            else
                print_test_status "FAIL" "Required step missing: $step"
            fi
        done
        
    else
        print_test_status "FAIL" "Workflow file missing: $workflow_file"
    fi
}

# Function to test dependencies
test_dependencies() {
    echo -e "\n${BLUE}📦 Testing project dependencies${NC}"
    echo "=================================================="
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        print_test_status "PASS" "package.json exists"
        
        # Check if yarn.lock exists
        if [ -f "yarn.lock" ]; then
            print_test_status "PASS" "yarn.lock exists"
        else
            print_test_status "WARN" "yarn.lock missing (dependencies may not be locked)"
        fi
        
        # Test dependency installation
        if yarn install --frozen-lockfile >/dev/null 2>&1; then
            print_test_status "PASS" "Dependencies install successfully"
            
            # Test if required scripts exist
            local required_scripts=("build" "test" "analyze")
            for script in "${required_scripts[@]}"; do
                if yarn run "$script" --help >/dev/null 2>&1 || grep -q "\"$script\":" package.json; then
                    print_test_status "PASS" "Script available: $script"
                else
                    print_test_status "FAIL" "Script missing: $script"
                fi
            done
            
        else
            print_test_status "FAIL" "Dependencies installation failed"
        fi
        
    else
        print_test_status "FAIL" "package.json missing"
        return 1
    fi
}

# Function to test security audit
test_security_audit() {
    echo "🔒 Testing security audit"
    echo "=================================================="
    
    # Test yarn audit command (exit codes 0-15 are valid, >15 indicates command failure)
    yarn audit --level high >/dev/null 2>&1
    local audit_exit_code=$?
    
    if [ $audit_exit_code -le 15 ]; then
        if [ $audit_exit_code -eq 0 ]; then
            print_test_status "PASS" "Security audit passed (no vulnerabilities found)"
        else
            print_test_status "PASS" "Security audit executed successfully (vulnerabilities found - exit code: $audit_exit_code)"
        fi
    else
        print_test_status "FAIL" "Security audit command failed (exit code: $audit_exit_code)"
    fi
    
    echo ""
}

# Function to test backward compatibility
test_backward_compatibility() {
    echo -e "\n${BLUE}🔄 Testing backward compatibility${NC}"
    echo "=================================================="
    
    # Check if old environment variables are still supported
    local old_env_vars=("NODE_VERSION" "DEPLOY_ENV")
    for var in "${old_env_vars[@]}"; do
        if grep -r "$var" .github/workflows/ >/dev/null 2>&1; then
            print_test_status "PASS" "Backward compatibility maintained for: $var"
        else
            print_test_status "FAIL" "Backward compatibility broken for: $var"
        fi
    done
    
    # Check if deployment structure is consistent
    local workflow_files=(
        ".github/workflows/deploy-dev.yml"
        ".github/workflows/deploy-qa.yml"
        ".github/workflows/deploy-staging.yml"
        ".github/workflows/deploy-production.yml"
    )
    
    local first_file_steps=""
    local consistent=true
    
    for file in "${workflow_files[@]}"; do
        if [ -f "$file" ]; then
            local file_steps=$(grep -o "name: [^#]*" "$file" | sort)
            if [ -z "$first_file_steps" ]; then
                first_file_steps="$file_steps"
            else
                if [ "$file_steps" != "$first_file_steps" ]; then
                    consistent=false
                    break
                fi
            fi
        fi
    done
    
    if [ "$consistent" = true ]; then
        print_test_status "PASS" "Deployment structure is consistent across environments"
    else
        print_test_status "WARN" "Deployment structure varies between environments (may be intentional)"
    fi
}

# Main test execution
main() {
    print_test_status "INFO" "Starting deployment verification tests"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_test_status "FAIL" "Not in project root directory (package.json not found)"
        exit 1
    fi
    
    # Test dependencies first
    test_dependencies
    
    # Test security audit
    test_security_audit
    
    # Test workflow syntax for each environment
    test_workflow_syntax ".github/workflows/deploy-dev.yml" "development"
    test_workflow_syntax ".github/workflows/deploy-qa.yml" "qa"
    test_workflow_syntax ".github/workflows/deploy-staging.yml" "staging"
    test_workflow_syntax ".github/workflows/deploy-production.yml" "production"
    
    # Test builds for each environment
    test_environment_build "development" "development"
    test_environment_build "qa" "qa"
    test_environment_build "staging" "staging"
    test_environment_build "production" "production"
    
    # Test backward compatibility
    test_backward_compatibility
    
    # Print summary
    echo -e "\n${BLUE}📊 Test Summary${NC}"
    echo "=================================================="
    echo -e "Total tests: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    
    if [ "$FAILED_TESTS" -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All deployment verification tests passed!${NC}"
        echo -e "${GREEN}✅ All environments are ready for deployment${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ $FAILED_TESTS test(s) failed. Please fix the issues above.${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
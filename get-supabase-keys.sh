#!/bin/bash

# Script to get Supabase project keys using the Supabase CLI
# Usage: 
#   ./get-supabase-keys.sh          # Get local keys
#   ./get-supabase-keys.sh prod     # Get production keys

MODE=${1:-local}

echo "==================================="
echo "Supabase Project Configuration"
echo "==================================="
echo ""

if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
    echo "🌐 Getting PRODUCTION project keys..."
    echo ""
    
    # Check if user is logged in
    if ! supabase projects list &>/dev/null; then
        echo "❌ Error: Not logged in to Supabase CLI"
        echo "Run 'supabase login' first"
        exit 1
    fi
    
    # Get linked project reference
    if [ -f "supabase/.temp/project-ref" ]; then
        PROJECT_REF=$(cat supabase/.temp/project-ref)
    else
        PROJECT_REF=$(supabase status 2>/dev/null | grep "Project ref" | awk '{print $3}')
    fi
    
    if [ -z "$PROJECT_REF" ]; then
        echo "❌ Error: No linked project found"
        echo "Run 'supabase link' to link your production project"
        exit 1
    fi
    
    echo "📦 Project: $PROJECT_REF"
    
    echo "📋 Environment Variables for .env file:"
    echo "==================================="
    echo ""
    
    # Get project API settings
    API_SETTINGS=$(supabase projects api-keys --project-ref "$PROJECT_REF" 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "❌ Error: Could not fetch API keys"
        echo "Make sure you're linked to a project with 'supabase link'"
        exit 1
    fi
    
    # Extract anon key (it's separated by | character in the table format)
    ANON_KEY=$(echo "$API_SETTINGS" | grep "anon" | awk -F'|' '{print $2}' | xargs)
    
    # Construct the production URL
    API_URL="https://${PROJECT_REF}.supabase.co"
    
    echo "VITE_SUPABASE_URL=$API_URL"
    echo "VITE_SUPABASE_ANON_KEY=$ANON_KEY"
    
else
    echo "🏠 Getting LOCAL development keys..."
    echo ""
    
    # Get the project status to ensure we're in a Supabase project
    if ! supabase status 2>/dev/null; then
        echo "❌ Error: Supabase is not running or not initialized"
        echo "Run 'supabase start' to start the local Supabase instance"
        exit 1
    fi
    
    echo "📋 Environment Variables for .env file:"
    echo "==================================="
    echo ""
    
    # Get API URL
    API_URL=$(supabase status | grep "API URL" | awk '{print $3}')
    echo "VITE_SUPABASE_URL=$API_URL"
    
    # Get anon key
    ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
    echo "VITE_SUPABASE_ANON_KEY=$ANON_KEY"
fi

echo ""
echo "==================================="
echo ""
echo "💡 Copy these values to your frontend/.env file"
echo ""
echo "Usage:"
echo "  ./get-supabase-keys.sh          # Local keys"
echo "  ./get-supabase-keys.sh prod     # Production keys"
echo ""

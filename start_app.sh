#!/bin/bash

# Golf Handicap Calculator Startup Script

echo "🏌️  Starting Golf Handicap Calculator..."
echo "📍 Activating virtual environment..."

# Activate virtual environment
source venv/bin/activate

echo "🚀 Starting Flask application..."
echo "🌐 The application will be available at: http://localhost:5001"
echo "⏹️  Press Ctrl+C to stop the application"
echo ""

# Run the application
python app.py 
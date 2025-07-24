#!/bin/bash

echo "🧪 CLI Browser Test for WhatsApp Chat Converter"
echo "=============================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:8001/ > /dev/null; then
    echo "❌ Server not running. Starting Python server..."
    python3 -m http.server 8001 > /dev/null 2>&1 &
    sleep 3
fi

echo "✅ Server is running on http://localhost:8001/"
echo ""
echo "📁 Sample files available:"
ls -la sample/ | head -n 5
echo ""

echo "🚀 Opening browser to test the actual application..."
echo "📋 Test steps to perform:"
echo "   1. Upload files: sample/_chat.txt and the 3 .opus files"
echo "   2. Click 'Process Files'"
echo "   3. Wait for transcription to complete"
echo "   4. Check if audio is playable and transcribed text is visible"
echo "   5. Test edit functionality on transcribed text"
echo ""

# Open browser (works on macOS)
if command -v open > /dev/null; then
    open "http://localhost:8001/"
    echo "✅ Browser opened! Please test the application manually."
else
    echo "📱 Please open http://localhost:8001/ in your browser"
fi

echo ""
echo "💡 After testing, check the downloaded HTML file for:"
echo "   🎵 Playable audio elements"
echo "   📝 Visible transcribed text"
echo "   ✏️ Working edit buttons"
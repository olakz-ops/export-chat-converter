export async function generateHTMLOutput(messages, totalCost) {
    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Chat Export</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        // Tailwind CSS configuration for shadcn/ui compatibility
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        border: "hsl(214.3 31.8% 91.4%)",
                        input: "hsl(214.3 31.8% 91.4%)",
                        ring: "hsl(222.2 84% 4.9%)",
                        background: "hsl(0 0% 100%)",
                        foreground: "hsl(222.2 84% 4.9%)",
                        primary: {
                            DEFAULT: "hsl(222.2 47.4% 11.2%)",
                            foreground: "hsl(210 40% 98%)",
                        },
                        secondary: {
                            DEFAULT: "hsl(210 40% 96%)",
                            foreground: "hsl(222.2 84% 4.9%)",
                        },
                        destructive: {
                            DEFAULT: "hsl(0 84.2% 60.2%)",
                            foreground: "hsl(210 40% 98%)",
                        },
                        muted: {
                            DEFAULT: "hsl(210 40% 96%)",
                            foreground: "hsl(215.4 16.3% 46.9%)",
                        },
                        accent: {
                            DEFAULT: "hsl(210 40% 96%)",
                            foreground: "hsl(222.2 84% 4.9%)",
                        },
                        popover: {
                            DEFAULT: "hsl(0 0% 100%)",
                            foreground: "hsl(222.2 84% 4.9%)",
                        },
                        card: {
                            DEFAULT: "hsl(0 0% 100%)",
                            foreground: "hsl(222.2 84% 4.9%)",
                        },
                    },
                    borderRadius: {
                        lg: "var(--radius)",
                        md: "calc(var(--radius) - 2px)",
                        sm: "calc(var(--radius) - 4px)",
                    },
                }
            }
        }
    </script>
    <style>
        :root {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 84% 4.9%;
            --popover: 0 0% 100%;
            --popover-foreground: 222.2 84% 4.9%;
            --primary: 222.2 47.4% 11.2%;
            --primary-foreground: 210 40% 98%;
            --secondary: 210 40% 96%;
            --secondary-foreground: 222.2 84% 4.9%;
            --muted: 210 40% 96%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --accent: 210 40% 96%;
            --accent-foreground: 222.2 84% 4.9%;
            --destructive: 0 84.2% 60.2%;
            --destructive-foreground: 210 40% 98%;
            --border: 214.3 31.8% 91.4%;
            --input: 214.3 31.8% 91.4%;
            --ring: 222.2 84% 4.9%;
            --radius: 0.5rem;
        }
        
        * {
            border-color: hsl(var(--border));
        }
        
        body {
            background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(210 40% 98%) 100%);
            color: hsl(var(--foreground));
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans Hebrew', sans-serif;
            line-height: 1.6;
            letter-spacing: 0.01em;
        }
        
        /* shadcn/ui Button component styles */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
            border-radius: calc(var(--radius) - 2px);
            font-size: 0.875rem;
            font-weight: 500;
            transition: colors 0.2s;
            border: 1px solid transparent;
            cursor: pointer;
            outline: none;
        }
        
        .btn:focus-visible {
            outline: 2px solid hsl(var(--ring));
            outline-offset: 2px;
        }
        
        .btn:disabled {
            pointer-events: none;
            opacity: 0.5;
        }
        
        .btn-primary {
            background-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
        }
        
        .btn-primary:hover {
            background-color: hsl(var(--primary) / 0.9);
        }
        
        .btn-secondary {
            background-color: hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
        }
        
        .btn-secondary:hover {
            background-color: hsl(var(--secondary) / 0.8);
        }
        
        .btn-destructive {
            background-color: hsl(var(--destructive));
            color: hsl(var(--destructive-foreground));
        }
        
        .btn-destructive:hover {
            background-color: hsl(var(--destructive) / 0.9);
        }
        
        .btn-outline {
            border: 1px solid hsl(var(--border));
            background-color: hsl(var(--background));
        }
        
        .btn-outline:hover {
            background-color: hsl(var(--accent));
            color: hsl(var(--accent-foreground));
        }
        
        .btn-ghost {
            background-color: transparent;
        }
        
        .btn-ghost:hover {
            background-color: hsl(var(--accent));
            color: hsl(var(--accent-foreground));
        }
        
        .btn-sm {
            height: 2.25rem;
            border-radius: calc(var(--radius) - 4px);
            padding: 0 0.75rem;
            font-size: 0.8125rem;
        }
        
        .btn-default {
            height: 2.5rem;
            padding: 0 1rem;
        }
        
        .btn-lg {
            height: 2.75rem;
            border-radius: calc(var(--radius) - 2px);
            padding: 0 2rem;
        }
        
        /* shadcn/ui Card component styles - Enhanced */
        .card {
            border-radius: calc(var(--radius) + 4px);
            border: 1px solid hsl(var(--border) / 0.8);
            background: linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.98) 100%);
            color: hsl(var(--card-foreground));
            box-shadow: 0 2px 8px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06);
            backdrop-filter: blur(8px);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-header {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid hsl(var(--border) / 0.4);
        }
        
        .card-title {
            font-size: 1.5rem;
            font-weight: 600;
            line-height: 1;
            letter-spacing: -0.025em;
        }
        
        .card-description {
            font-size: 0.875rem;
            color: hsl(var(--muted-foreground));
        }
        
        .card-content {
            padding: 1.5rem;
            padding-top: 1.25rem;
        }
        
        .card-footer {
            display: flex;
            align-items: center;
            padding: 1.5rem;
            padding-top: 0;
        }
        
        /* shadcn/ui Badge component styles */
        .badge {
            display: inline-flex;
            align-items: center;
            border-radius: 9999px;
            padding: 0.125rem 0.625rem;
            font-size: 0.75rem;
            font-weight: 600;
            line-height: 1;
            transition: colors 0.2s;
            border: 1px solid transparent;
        }
        
        .badge-default {
            background-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
        }
        
        .badge-secondary {
            background-color: hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
        }
        
        .badge-destructive {
            background-color: hsl(var(--destructive));
            color: hsl(var(--destructive-foreground));
        }
        
        .badge-outline {
            color: hsl(var(--foreground));
            border: 1px solid hsl(var(--border));
        }
        
        /* Custom message styling with 2025 modern design */
        .message-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateY(0);
            position: relative;
            overflow: hidden;
        }
        
        .message-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, hsl(var(--border) / 0.5), transparent);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .message-card:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 25px 0 rgb(0 0 0 / 0.08), 0 4px 12px 0 rgb(0 0 0 / 0.05);
        }
        
        .message-card:hover::before {
            opacity: 1;
        }
        
        .message-card.speaker-2 {
            background: linear-gradient(145deg, hsl(142 76% 98%) 0%, hsl(142 76% 96%) 100%);
            border-color: hsl(142 76% 88%);
            position: relative;
        }
        
        .message-card.speaker-2::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 3px;
            height: 100%;
            background: linear-gradient(180deg, hsl(142 76% 75%) 0%, hsl(142 76% 65%) 100%);
            border-radius: 0 calc(var(--radius) + 4px) calc(var(--radius) + 4px) 0;
        }
        
        .message-card.edit-mode {
            border-color: hsl(var(--ring));
            box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
        }
        
        .merge-mode .message-card {
            cursor: pointer;
            border-style: dashed;
            border-color: hsl(var(--muted-foreground));
        }
        
        .merge-mode .message-card:hover {
            border-color: hsl(var(--primary));
            background-color: hsl(var(--primary) / 0.05);
        }
        
        .merge-mode .message-card.selected {
            border-color: hsl(var(--primary));
            background-color: hsl(var(--primary) / 0.1);
            border-style: solid;
        }
        
        .edit-textarea {
            width: 100%;
            border-radius: calc(var(--radius) - 2px);
            border: 1px solid hsl(var(--border));
            background-color: hsl(var(--background));
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            outline: none;
            transition: border-color 0.2s;
        }
        
        .edit-textarea:focus {
            border-color: hsl(var(--ring));
            box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
        }
        
        /* Enhanced Alert component with modern styling */
        .alert {
            position: relative;
            width: 100%;
            border-radius: calc(var(--radius) + 2px);
            border: 1px solid hsl(var(--border) / 0.6);
            padding: 1.25rem;
            background: linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.3) 100%);
            backdrop-filter: blur(8px);
            box-shadow: 0 2px 8px 0 rgb(0 0 0 / 0.04);
        }
        
        .alert-info {
            border-color: hsl(214 100% 82%);
            background: linear-gradient(135deg, hsl(214 100% 98%) 0%, hsl(214 100% 96%) 100%);
            color: hsl(214 84% 28%);
            position: relative;
            overflow: hidden;
        }
        
        .alert-info::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(180deg, hsl(214 100% 70%) 0%, hsl(214 100% 60%) 100%);
        }
        
        /* Enhanced Audio Player Styling */
        .audio-player-wrapper audio {
            width: 100%;
            border-radius: calc(var(--radius));
            background: hsl(var(--background));
            box-shadow: 0 2px 8px 0 rgb(0 0 0 / 0.06);
        }
        
        /* Modern Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: hsl(var(--muted) / 0.3);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.8));
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, hsl(var(--primary) / 0.7), hsl(var(--primary) / 0.9));
        }
        
        /* Subtle animations on load */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .message-card {
            animation: fadeInUp 0.4s ease-out;
        }
        
        .message-card:nth-child(even) {
            animation-delay: 0.1s;
        }
        
        .message-card:nth-child(odd) {
            animation-delay: 0.05s;
        }
        
        /* Focus states for better accessibility */
        .btn:focus-visible,
        .edit-textarea:focus-visible {
            outline: 2px solid hsl(var(--ring));
            outline-offset: 2px;
        }
    </style>
</head>
<body class="min-h-screen bg-background font-sans antialiased">
    <div class="container mx-auto max-w-6xl p-6">
        <!-- Header Card -->
        <div class="card mb-8">
            <div class="card-header">
                <div class="flex items-center justify-between">
                    <div class="space-y-2">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                                <span class="text-xl">💬</span>
                            </div>
                            <h1 class="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">שיחת WhatsApp</h1>
                        </div>
                        <p class="text-base text-muted-foreground font-medium">מרכיב הודעות ומקבצים תמלולי שמע עם עיצוב מודרני</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <button id="mergeBtn" onclick="toggleMergeMode()" 
                                class="btn btn-primary btn-default">
                            🔗 מצב מיזוג הודעות
                        </button>
                        <button id="confirmMergeBtn" onclick="confirmMerge()" style="display: none;"
                                class="btn btn-secondary btn-default">
                            ✅ בצע מיזוג
                        </button>
                        <button id="cancelMergeBtn" onclick="cancelMergeMode()" style="display: none;"
                                class="btn btn-outline btn-default">
                            ❌ בטל
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Merge Instructions Alert -->
        <div id="mergeInstructions" class="alert alert-info mb-6 hidden">
            <div class="flex items-start gap-3">
                <div class="text-lg">💡</div>
                <div>
                    <h4 class="font-semibold mb-1">מצב מיזוג הודעות</h4>
                    <p class="text-sm opacity-90">
                        לחץ על הודעות מאותו דובר כדי לסמן אותן למיזוג. ההודעות המסומנות יתמזגו להודעה אחת.
                    </p>
                </div>
            </div>
        </div>
        
        <!-- Messages Container with Bento Grid Layout -->
        <div id="messagesContainer" class="grid gap-6 auto-rows-auto">
            ${await generateMessagesHTML(messages)}
        </div>
        
        <!-- Footer Card -->
        <div class="card mt-8">
            <div class="card-content text-center">
                <div class="flex items-center justify-center gap-2 text-muted-foreground">
                    <span>✨</span>
                    <span class="text-sm font-medium">נוצר על ידי WhatsApp Chat Converter</span>
                </div>
                <div class="mt-2 text-sm">
                    <span class="text-muted-foreground">עלות תמלול כוללת:</span>
                    <span class="badge badge-outline ml-2">${totalCost.toFixed(4)}$</span>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let mergeMode = false;
        let selectedMessages = new Set();
        
        function editMessage(msgIndex) {
            const textDiv = document.getElementById('text-' + msgIndex);
            const editButton = document.getElementById('edit-btn-' + msgIndex);
            
            // Check if already in edit mode
            if (textDiv.classList.contains('edit-mode')) {
                // Save the changes
                saveMessage(msgIndex);
                return;
            }
            
            const originalText = textDiv.textContent || textDiv.innerText;
            
            // Store original text for cancel functionality
            textDiv.dataset.originalText = originalText;
            
            // Update button to "Save" state
            editButton.innerHTML = '💾 שמור';
            editButton.className = 'btn btn-secondary btn-sm';
            
            textDiv.innerHTML = \`
                <textarea id="edit-\${msgIndex}" class="edit-textarea resize-none" rows="4" placeholder="ערוך את הטקסט כאן...">\${originalText}</textarea>
                <div class="mt-3 flex gap-2">
                    <button onclick="cancelEdit(\${msgIndex})" 
                            class="btn btn-outline btn-sm">
                        🚫 בטל
                    </button>
                </div>
            \`;
            textDiv.classList.add('edit-mode');
            document.getElementById('edit-' + msgIndex).focus();
        }
        
        function saveMessage(msgIndex) {
            const textDiv = document.getElementById('text-' + msgIndex);
            const editButton = document.getElementById('edit-btn-' + msgIndex);
            const newText = document.getElementById('edit-' + msgIndex).value;
            
            // Update text content
            textDiv.innerHTML = newText.replace(/\\n/g, '<br>');
            textDiv.classList.remove('edit-mode');
            
            // Reset button to "Edit" state
            editButton.innerHTML = '✏️ ערוך טקסט';
            editButton.className = 'btn btn-ghost btn-sm';
        }
        
        function cancelEdit(msgIndex) {
            const textDiv = document.getElementById('text-' + msgIndex);
            const editButton = document.getElementById('edit-btn-' + msgIndex);
            
            // Get original text from data attribute
            const originalText = textDiv.dataset.originalText;
            textDiv.innerHTML = originalText.replace(/\\n/g, '<br>');
            textDiv.classList.remove('edit-mode');
            
            // Reset button to "Edit" state
            editButton.innerHTML = '✏️ ערוך טקסט';
            editButton.className = 'btn btn-ghost btn-sm';
        }
        
        function toggleMergeMode() {
            mergeMode = !mergeMode;
            const container = document.getElementById('messagesContainer');
            const instructions = document.getElementById('mergeInstructions');
            const mergeBtn = document.getElementById('mergeBtn');
            const confirmBtn = document.getElementById('confirmMergeBtn');
            const cancelBtn = document.getElementById('cancelMergeBtn');
            
            if (mergeMode) {
                container.classList.add('merge-mode');
                instructions.classList.remove('hidden');
                mergeBtn.innerHTML = '🔗 מצב מיזוג פעיל';
                mergeBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');
                mergeBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                confirmBtn.style.display = 'inline-block';
                cancelBtn.style.display = 'inline-block';
            } else {
                cancelMergeMode();
            }
        }
        
        function cancelMergeMode() {
            mergeMode = false;
            selectedMessages.clear();
            const container = document.getElementById('messagesContainer');
            const instructions = document.getElementById('mergeInstructions');
            const mergeBtn = document.getElementById('mergeBtn');
            const confirmBtn = document.getElementById('confirmMergeBtn');
            const cancelBtn = document.getElementById('cancelMergeBtn');
            
            container.classList.remove('merge-mode');
            instructions.classList.add('hidden');
            mergeBtn.innerHTML = '🔗 מצב מיזוג הודעות';
            mergeBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
            mergeBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
            confirmBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            
            // Remove selection from all messages
            document.querySelectorAll('.message-block').forEach(block => {
                block.classList.remove('selected');
            });
        }
        
        function selectMessageForMerge(msgIndex) {
            if (!mergeMode) return;
            
            const messageBlock = document.getElementById('message-' + msgIndex);
            const sender = messageBlock.dataset.sender;
            
            if (selectedMessages.has(msgIndex)) {
                selectedMessages.delete(msgIndex);
                messageBlock.classList.remove('selected');
            } else {
                // Check if this sender matches other selected messages
                const selectedArray = Array.from(selectedMessages);
                if (selectedArray.length > 0) {
                    const firstSelected = document.getElementById('message-' + selectedArray[0]);
                    if (firstSelected.dataset.sender !== sender) {
                        alert('ניתן לבחור רק הודעות מאותו דובר למיזוג');
                        return;
                    }
                }
                
                selectedMessages.add(msgIndex);
                messageBlock.classList.add('selected');
            }
        }
        
        function confirmMerge() {
            if (selectedMessages.size < 2) {
                alert('יש לבחור לפחות 2 הודעות למיזוג');
                return;
            }
            
            const selectedArray = Array.from(selectedMessages).sort((a, b) => a - b);
            const firstMessage = document.getElementById('message-' + selectedArray[0]);
            const firstTextDiv = document.getElementById('text-' + selectedArray[0]);
            
            // Collect all text content
            let mergedText = firstTextDiv.innerHTML;
            
            for (let i = 1; i < selectedArray.length; i++) {
                const msgIndex = selectedArray[i];
                const textDiv = document.getElementById('text-' + msgIndex);
                mergedText += '<br><br>' + textDiv.innerHTML;
                
                // Remove the message block
                const messageBlock = document.getElementById('message-' + msgIndex);
                messageBlock.remove();
            }
            
            // Update the first message with merged content
            firstTextDiv.innerHTML = mergedText;
            firstMessage.classList.add('merge-indicator');
            
            // Add merge indicator
            const header = firstMessage.querySelector('.message-header');
            if (header && !header.querySelector('.merge-badge')) {
                const mergeBadge = document.createElement('span');
                mergeBadge.className = 'merge-badge text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2';
                mergeBadge.innerHTML = '🔗 מוזג';
                header.appendChild(mergeBadge);
            }
            
            cancelMergeMode();
        }
    </script>
</body>
</html>`;
    
    return html;
}

async function generateMessagesHTML(messages) {
    // Track speakers to assign colors
    const speakers = [...new Set(messages.map(msg => msg.sender))];
    
    const messageElements = await Promise.all(messages.map(async (msg, index) => {
        const hasAudio = msg.audioFile || msg.audioFiles || msg.originalAudio;
        const speakerClass = speakers.indexOf(msg.sender) === 1 ? 'speaker-2' : '';
        
        
        // Check if this is an audio filename message (even without actual audio file)
        const isAudioFilename = msg.text.includes('.opus') && msg.text.includes('<מצורף:');
        
        if (hasAudio) {
            // Audio message block with actual audio file
            const audioData = await generateAudioData(msg);
            return `
                <div class="card message-card ${speakerClass} mb-4" id="message-${index}" 
                     data-sender="${msg.sender.replace(/"/g, '&quot;')}" onclick="selectMessageForMerge(${index})">
                    <div class="card-header pb-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="text-sm font-medium text-muted-foreground">${msg.timestamp}</div>
                                <div class="text-sm font-semibold">${msg.sender}</div>
                                ${msg.transcriptionCost > 0 ? `<span class="badge badge-secondary">$${msg.transcriptionCost.toFixed(4)}</span>` : ''}
                            </div>
                            <button id="edit-btn-${index}" onclick="event.stopPropagation(); editMessage(${index})" 
                                    class="btn btn-ghost btn-sm">
                                ✏️ ערוך טקסט
                            </button>
                        </div>
                    </div>
                    
                    <div class="card-content space-y-4">
                        <!-- Audio Player Section with Enhanced Design -->
                        <div class="rounded-lg border bg-gradient-to-br from-muted/20 to-muted/40 p-5 backdrop-blur-sm">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span class="text-sm">🎵</span>
                                </div>
                                <span class="text-sm font-semibold text-foreground/90">הודעה קולית</span>
                            </div>
                            <div class="audio-player-wrapper">
                                ${audioData}
                            </div>
                        </div>
                        
                        <!-- Transcription Section with Enhanced Design -->
                        <div class="rounded-lg border bg-gradient-to-br from-secondary/30 to-secondary/50 p-5 backdrop-blur-sm">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                                    <span class="text-sm">📝</span>
                                </div>
                                <span class="text-sm font-semibold text-foreground/90">תמלול</span>
                            </div>
                            <div id="text-${index}" class="text-base leading-relaxed font-medium text-foreground/95">${formatMessageText(msg.text)}</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (isAudioFilename) {
            // Audio filename message block (without actual audio file)
            return `
                <div class="card message-card ${speakerClass} mb-4" id="message-${index}" 
                     data-sender="${msg.sender.replace(/"/g, '&quot;')}" onclick="selectMessageForMerge(${index})">
                    <div class="card-header pb-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="text-sm font-medium text-muted-foreground">${msg.timestamp}</div>
                                <div class="text-sm font-semibold">${msg.sender}</div>
                            </div>
                            <button id="edit-btn-${index}" onclick="event.stopPropagation(); editMessage(${index})" 
                                    class="btn btn-ghost btn-sm">
                                ✏️ ערוך טקסט
                            </button>
                        </div>
                    </div>
                    
                    <div class="card-content">
                        <!-- Audio Filename Section -->
                        <div class="rounded-md border bg-muted/30 p-4">
                            <div class="flex items-center gap-2 mb-3">
                                <span class="text-sm font-medium">🎵</span>
                                <span class="text-sm font-medium text-muted-foreground">קובץ אודיו</span>
                            </div>
                            <div id="text-${index}" class="text-base leading-relaxed">${formatMessageText(msg.text)}</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Regular text message block
            return `
                <div class="card message-card ${speakerClass} mb-4" id="message-${index}" 
                     data-sender="${msg.sender.replace(/"/g, '&quot;')}" onclick="selectMessageForMerge(${index})">
                    <div class="card-header pb-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="text-sm font-medium text-muted-foreground">${msg.timestamp}</div>
                                <div class="text-sm font-semibold">${msg.sender}</div>
                            </div>
                            <button id="edit-btn-${index}" onclick="event.stopPropagation(); editMessage(${index})" 
                                    class="btn btn-ghost btn-sm">
                                ✏️ ערוך טקסט
                            </button>
                        </div>
                    </div>
                    
                    <div class="card-content">
                        <div id="text-${index}" class="text-base leading-relaxed">${formatMessageText(msg.text)}</div>
                    </div>
                </div>
            `;
        }
    }));
    
    return messageElements.filter(element => element.trim() !== '').join('');
}

async function generateAudioData(message) {
    if (!message.originalAudio) {
        return `
            <div class="text-center text-gray-500 py-4">
                <span class="text-sm">🎵 קובץ אודיו: ${message.audioFile || 'לא זמין'}</span>
            </div>
        `;
    }
    
    try {
        const audioData = await fileToBase64(message.originalAudio);
        // Fix: Use OGG format for browser compatibility instead of OPUS
        const mimeType = 'audio/ogg'; // Change from audio/opus to audio/ogg
        const audioSrc = `data:${mimeType};base64,${audioData}`;
        
        return `
            <audio controls class="w-full h-10 bg-gray-100 rounded-lg shadow-inner" style="width: 100%;">
                <source src="${audioSrc}" type="${mimeType}">
                <source src="${audioSrc}" type="audio/webm">
                <source src="${audioSrc}" type="audio/wav">
                הדפדפן שלך לא תומך בהשמעת אודיו
            </audio>
            <div class="mt-2 text-xs text-gray-500 text-center">
                גודל קובץ: ${(message.originalAudio.size / 1024).toFixed(1)} KB
            </div>
        `;
    } catch (error) {
        console.warn('Failed to embed audio file:', error);
        return `
            <div class="text-center text-red-500 py-4 bg-red-50 rounded">
                <span class="text-sm">⚠️ שגיאה בהטמעת קובץ האודיו</span>
            </div>
        `;
    }
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // Remove data:type;base64, prefix
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function formatMessageText(text) {
    return text
        .replace(/\n/g, '<br>')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&lt;br&gt;/g, '<br>'); // Restore line breaks
}
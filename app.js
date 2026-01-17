// Wait for all libraries to load
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing full-featured app...');

    // Check if libraries are loaded
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined' || typeof lucide === 'undefined') {
        console.error('Required libraries not loaded');
        document.getElementById('root').innerHTML = '<div style="padding: 40px; color: red;">Error: Required libraries failed to load</div>';
        return;
    }

    console.log('All libraries loaded successfully');

    // Initialize Lucide icons
    lucide.createIcons();

    // Import what we need from React
    const { useState, useEffect, useRef, useMemo, createElement: h } = React;

    // Constants
    const STATUS = {
        PENDING: 'pending',
        ANALYZING: 'analyzing',
        SENDING: 'sending',
        SENT: 'sent',
        ASSUMED: 'assumed',
        FAILED: 'failed',
        ERROR: 'error'
    };

    const CONFIDENCE = {
        HIGH: 'High',
        MEDIUM: 'Med',
        LOW: 'Low'
    };

    const SOURCES = {
        METADATA: 'PDF Metadata',
        TEXT: 'PDF Text',
        LOCAL_OCR: 'Local OCR',
        CLOUD_OCR: 'Cloud OCR',
        MANUAL: 'Manual'
    };

    const DEFAULT_TEMPLATE = `{greeting}{name},
This is Keya - Head of HR, Bakerist Restaurant DHM,
We have received your CV and it seems to be quite impressive, we would like to know more about you, I would like to invite you for an in person interview & trial day tomorrow.
Date : {date}.
Bakerist DHM at {time}.
Position - {position}
Location:
https://maps.app.goo.gl/LKryWeFSdTbBVTae6?g_st=ipc
Please review our menu and try to understand our signature options:
https://menu.apetitomenu.com/BakeristDubaiHillsMallMenu/en/menu/58f34b
Thank you`;

    const PRESET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwgUoX3W-XSfRdTEylLedV7LDJ4umY0e78H9iWmEU3bauD_HL_UeOWHqAHgObnfXMrU/exec';

    // Utility functions
    const formatDateForInput = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '...';
        const dateObj = new Date(dateStr);
        const day = dateObj.getDate();
        let suffix = 'th';
        if (day % 10 === 1 && day !== 11) suffix = 'st';
        else if (day % 10 === 2 && day !== 12) suffix = 'nd';
        else if (day % 10 === 3 && day !== 13) suffix = 'rd';
        return `${dateObj.toLocaleDateString('en-US', { month: 'long' })} ${day}${suffix} ${dateObj.getFullYear()}`;
    };

    const formatDisplayTime = (timeStr) => {
        if (!timeStr) return '...';
        const [hours, minutes] = timeStr.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    const addMinutesToTime = (timeStr, minutesToAdd) => {
        const [h, m] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);
        date.setMinutes(date.getMinutes() + minutesToAdd);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const generateBody = (templateStr, candidate, commonData) => {
        if (!candidate) return '';
        const name = candidate.name || '';
        const greetingName = name.trim().length > 0 ? ' ' + name : '';
        const pos = candidate.interviewPosition || commonData.position;
        const date = formatDisplayDate(candidate.interviewDate || commonData.date);
        const time = formatDisplayTime(candidate.interviewTime || commonData.time);

        let body = templateStr || DEFAULT_TEMPLATE;
        try {
            const hrs = new Date().getHours();
            let greeting = 'Good morning';
            if (hrs >= 12 && hrs < 17) greeting = 'Good afternoon';
            else if (hrs >= 17) greeting = 'Good evening';
            body = body.replace('{greeting}', greeting);
        } catch (e) {
            body = body.replace('{greeting}', 'Hello');
        }

        body = body.replace('{name}', greetingName);
        body = body.replace('{position}', pos);
        body = body.replace('{date}', date);
        body = body.replace('{time}', time);
        return body;
    };

    // Convert 24-hour time to 12-hour format with AM/PM
    const timeTo12Hour = (time24) => {
        if (!time24) return { hour: '12', minute: '00', period: 'PM' };
        const [h, m] = time24.split(':');
        let hour = parseInt(h, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return { hour: String(hour), minute: m, period };
    };

    // Convert 12-hour format to 24-hour time
    const timeFrom12Hour = (hour, minute, period) => {
        let h = parseInt(hour, 10);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${minute}`;
    };

    // Custom Time Picker Component
    const TimePicker = ({ value, onChange, className = '' }) => {
        const { hour, minute, period } = timeTo12Hour(value);

        const handleChange = (newHour, newMinute, newPeriod) => {
            const time24 = timeFrom12Hour(newHour || hour, newMinute || minute, newPeriod || period);
            onChange(time24);
        };

        return h('div', { className: `flex gap-2 ${className}` },
            h('select', {
                value: hour,
                onChange: e => handleChange(e.target.value, minute, period),
                className: 'flex-1 border rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100'
            },
                Array.from({ length: 12 }, (_, i) => i + 1).map(hr =>
                    h('option', { key: hr, value: String(hr) }, String(hr))
                )
            ),
            h('select', {
                value: minute,
                onChange: e => handleChange(hour, e.target.value, period),
                className: 'flex-1 border rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100'
            },
                ['00', '15', '30', '45'].map(m =>
                    h('option', { key: m, value: m }, m)
                )
            ),
            h('select', {
                value: period,
                onChange: e => handleChange(hour, minute, e.target.value),
                className: 'border rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 font-bold'
            },
                h('option', { value: 'AM' }, 'AM'),
                h('option', { value: 'PM' }, 'PM')
            )
        );
    };

    // Icon helper
    const Icon = ({ name, className = '', size = 24 }) => {
        return h('i', {
            'data-lucide': name,
            className,
            style: { width: size, height: size }
        });
    };

    // Enhanced Timeline View Component
    const TimelineView = ({ candidates, maxCapacity, onSlotClick }) => {
        const timelineScrollRef = useRef(null);

        const slots = useMemo(() => {
            const map = {};
            candidates.forEach(c => {
                if (!c.interviewTime) return;
                const key = `${c.interviewDate}|${c.interviewTime}`;
                if (!map[key]) map[key] = {
                    date: c.interviewDate,
                    time: c.interviewTime,
                    count: 0,
                    candidates: []
                };
                map[key].count++;
                map[key].candidates.push(c);
            });
            return Object.values(map).sort((a, b) =>
                a.date !== b.date ? a.date.localeCompare(b.date) : a.time.localeCompare(b.time)
            );
        }, [candidates]);

        const scrollTimeline = (direction) => {
            if (timelineScrollRef.current) {
                const amount = direction === 'left' ? -200 : 200;
                timelineScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
            }
        };

        const getTimeOfDay = (time) => {
            const hour = parseInt(time.split(':')[0]);
            if (hour < 12) return '☀️ Morning';
            if (hour < 17) return '🌤️ Afternoon';
            return '🌙 Evening';
        };

        const getInitials = (name) => {
            if (!name) return '??';
            const parts = name.split(' ');
            return parts.length >= 2
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : name.slice(0, 2).toUpperCase();
        };

        if (slots.length === 0) return null;

        return h('div', { className: 'timeline-container mb-6 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg' },
            h('div', { className: 'flex items-center justify-between mb-4' },
                h('h4', { className: 'text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2' },
                    h(Icon, { name: 'calendar-clock', className: 'h-4 w-4 text-blue-500' }),
                    'Interview Timeline'
                ),
                h('div', { className: 'flex gap-2' },
                    h('button', {
                        onClick: () => scrollTimeline('left'),
                        className: 'timeline-arrow'
                    }, h(Icon, { name: 'chevron-left', className: 'h-4 w-4' })),
                    h('button', {
                        onClick: () => scrollTimeline('right'),
                        className: 'timeline-arrow'
                    }, h(Icon, { name: 'chevron-right', className: 'h-4 w-4' }))
                )
            ),
            h('div', {
                ref: timelineScrollRef,
                className: 'timeline-scroll'
            },
                slots.map((slot, i) => {
                    const isCrowded = slot.count > maxCapacity;
                    const fillPercent = Math.min((slot.count / maxCapacity) * 100, 100);
                    const gaugeColor = isCrowded ? '#f43f5e' : fillPercent > 70 ? '#f59e0b' : '#10b981';

                    return h('div', {
                        key: i,
                        className: `timeline-slot ${isCrowded ? 'crowded' : ''} cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 dark:hover:ring-offset-slate-800 transition-all active:scale-95`,
                        onClick: () => onSlotClick && onSlotClick(slot)
                    },
                        // Capacity Gauge
                        h('div', {
                            className: 'capacity-gauge',
                            style: {
                                background: `conic-gradient(${gaugeColor} ${fillPercent}%, #e2e8f0 ${fillPercent}%)`
                            }
                        },
                            h('span', null, `${slot.count}/${maxCapacity}`)
                        ),
                        // Time
                        h('div', { className: 'text-sm font-black text-slate-700 dark:text-slate-200' },
                            formatDisplayTime(slot.time)
                        ),
                        // Date
                        h('div', { className: 'text-[10px] text-slate-400 mb-2' },
                            slot.date ? slot.date.slice(5) : 'No date'
                        ),
                        // Time of Day Label
                        h('div', { className: 'text-[9px] text-slate-400' },
                            getTimeOfDay(slot.time)
                        ),
                        // Mini Avatars
                        slot.candidates.length > 0 && h('div', { className: 'mini-avatars' },
                            slot.candidates.slice(0, 4).map((c, j) =>
                                h('div', {
                                    key: j,
                                    className: 'mini-avatar',
                                    title: c.name
                                }, getInitials(c.name))
                            ),
                            slot.candidates.length > 4 && h('div', {
                                className: 'mini-avatar bg-slate-200 text-slate-600'
                            }, `+${slot.candidates.length - 4}`)
                        )
                    );
                })
            )
        );
    };

    // Main App Component
    function App() {
        // State
        const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('rt_webhook_url') || PRESET_WEBHOOK_URL);
        const [sendMethod, setSendMethod] = useState(() => localStorage.getItem('rt_send_method') || 'webhook');
        const [ocrApiKey, setOcrApiKey] = useState(() => localStorage.getItem('rt_ocr_api_key') || '');
        const [candidates, setCandidates] = useState([]);
        const [selectedIds, setSelectedIds] = useState(new Set());
        const [commonData, setCommonData] = useState({ position: 'SOUS CHEF', date: '', time: '12:00' });
        const [maxCapacity, setMaxCapacity] = useState(5);
        const [slotInterval, setSlotInterval] = useState(30);
        const [showManualAdd, setShowManualAdd] = useState(false);
        const [subjectLine, setSubjectLine] = useState('Interview Invitation');
        const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
        const [showSettings, setShowSettings] = useState(false);
        const [showTemplateEditor, setShowTemplateEditor] = useState(false);
        const [showSafetyModal, setShowSafetyModal] = useState(false);
        const [previewCandidateId, setPreviewCandidateId] = useState(null);
        const [globalIsAnalyzing, setGlobalIsAnalyzing] = useState(false);
        const [newName, setNewName] = useState('');
        const [newEmail, setNewEmail] = useState('');
        const [bulkEditPosition, setBulkEditPosition] = useState('');
        const [bulkEditTime, setBulkEditTime] = useState('');
        const [bulkGroups, setBulkGroups] = useState([]);
        const [activeGroupIndex, setActiveGroupIndex] = useState(0);
        const [bulkSendingProgress, setBulkSendingProgress] = useState(null);
        const [countdown, setCountdown] = useState(null);
        const stopProcessingRef = useRef(false);
        const [pdfLibReady, setPdfLibReady] = useState(false);
        const [tesseractReady, setTesseractReady] = useState(false);
        const [darkMode, setDarkMode] = useState(() => localStorage.getItem('rt_dark_mode') === 'true');
        const [statusFilter, setStatusFilter] = useState('all');
        const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
        const [isDragging, setIsDragging] = useState(false);
        const timelineRef = useRef(null);
        const [webhookPassword, setWebhookPassword] = useState('');
        const [webhookUnlocked, setWebhookUnlocked] = useState(false);

        const currentBulkGroup = bulkGroups[activeGroupIndex];

        // Filter candidates by status
        const filteredCandidates = useMemo(() => {
            if (statusFilter === 'all') return candidates;
            return candidates.filter(c => {
                if (statusFilter === 'pending') return c.status === STATUS.PENDING;
                if (statusFilter === 'sent') return c.status === STATUS.SENT || c.status === STATUS.ASSUMED;
                if (statusFilter === 'failed') return c.status === STATUS.ERROR;
                return true;
            });
        }, [candidates, statusFilter]);

        // Get status counts
        const statusCounts = useMemo(() => ({
            all: candidates.length,
            pending: candidates.filter(c => c.status === STATUS.PENDING).length,
            sent: candidates.filter(c => c.status === STATUS.SENT || c.status === STATUS.ASSUMED).length,
            failed: candidates.filter(c => c.status === STATUS.ERROR).length
        }), [candidates]);

        // Get initials from name
        const getInitials = (name) => {
            if (!name) return '??';
            const parts = name.split(' ');
            return parts.length >= 2
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : name.slice(0, 2).toUpperCase();
        };

        // Select inverse
        const selectInverse = () => {
            const newSelection = new Set(candidates.filter(c => !selectedIds.has(c.id)).map(c => c.id));
            setSelectedIds(newSelection);
        };

        // Timeline scroll
        const scrollTimeline = (direction) => {
            if (timelineRef.current) {
                const scrollAmount = direction === 'left' ? -200 : 200;
                timelineRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        };

        // Load demo data
        const loadDemoData = () => {
            const demoNames = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Gupta', 'Vikram Singh', 'Anjali Verma'];
            const demoData = demoNames.map((name, i) => ({
                id: Date.now() + i,
                name,
                email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
                status: i < 3 ? STATUS.PENDING : i < 5 ? STATUS.SENT : STATUS.ERROR,
                interviewPosition: commonData.position,
                interviewDate: commonData.date || new Date().toISOString().split('T')[0],
                interviewTime: `${10 + Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'}`,
                isEditing: false
            }));
            setCandidates(demoData);
        };


        // Initialize
        useEffect(() => {
            // Load PDF.js
            if (!window.pdfjsLib) {
                const scriptPdf = document.createElement('script');
                scriptPdf.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                scriptPdf.onload = () => {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    setPdfLibReady(true);
                };
                document.body.appendChild(scriptPdf);
            } else setPdfLibReady(true);

            // Load Tesseract
            if (!window.Tesseract) {
                const scriptOcr = document.createElement('script');
                scriptOcr.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
                scriptOcr.onload = () => setTesseractReady(true);
                document.body.appendChild(scriptOcr);
            } else setTesseractReady(true);

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setCommonData(prev => ({ ...prev, date: formatDateForInput(tomorrow) }));

            setTimeout(() => lucide.createIcons(), 100);
        }, []);

        // Re-create icons when UI changes
        useEffect(() => {
            lucide.createIcons();
        });

        // Timer Effect
        useEffect(() => {
            if (countdown !== null && countdown > 0) {
                const timer = setTimeout(() => setCountdown(0), 3000);
                return () => clearTimeout(timer);
            } else if (countdown === 0) {
                setCountdown(null);
                executeActiveGroupSend();
            }
        }, [countdown]);

        // Sync to localStorage
        useEffect(() => {
            localStorage.setItem('rt_webhook_url', webhookUrl);
            localStorage.setItem('rt_send_method', sendMethod);
            localStorage.setItem('rt_ocr_api_key', ocrApiKey);
            localStorage.setItem('rt_dark_mode', darkMode);
        }, [webhookUrl, sendMethod, ocrApiKey, darkMode]);

        // Dark mode effect
        useEffect(() => {
            if (darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }, [darkMode]);

        // Core Functions
        const updateCandidate = (id, updates) => {
            setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        };

        const removeCandidate = (id) => {
            setCandidates(prev => prev.filter(c => c.id !== id));
            setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
        };

        const toggleSelection = (id) => {
            setSelectedIds(prev => {
                const n = new Set(prev);
                if (n.has(id)) n.delete(id); else n.add(id);
                return n;
            });
        };

        const resetAll = () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setCandidates([]);
            setSelectedIds(new Set());
            setCommonData({ position: 'SOUS CHEF', date: formatDateForInput(tomorrow), time: '12:00' });
        };

        // Bulk edit selected candidates
        const applyBulkEdit = (field, value) => {
            if (!value) return;
            setCandidates(prev => prev.map(c => {
                if (selectedIds.has(c.id)) {
                    if (field === 'position') return { ...c, interviewPosition: value };
                    if (field === 'time') return { ...c, interviewTime: value };
                    if (field === 'date') return { ...c, interviewDate: value };
                }
                return c;
            }));
        };

        const addManualCandidate = () => {
            if (!newName && !newEmail) return;
            const newCand = {
                id: Date.now(),
                name: newName || 'Candidate',
                email: newEmail,
                status: STATUS.PENDING,
                interviewPosition: commonData.position,
                interviewDate: commonData.date,
                interviewTime: commonData.time,
                confidence: CONFIDENCE.HIGH,
                source: SOURCES.MANUAL
            };
            setCandidates(prev => [...prev, newCand]);
            setNewName('');
            setNewEmail('');
        };

        const autoSchedule = () => {
            if (candidates.length === 0) return;
            const pool = selectedIds.size > 0 ? candidates.filter(c => selectedIds.has(c.id)) : [...candidates];
            if (pool.length === 0) return;
            let currTime = pool[0].interviewTime || commonData.time;
            let count = 0;
            setCandidates(prev => prev.map(c => {
                if (selectedIds.size > 0 && !selectedIds.has(c.id)) return c;
                if (count >= maxCapacity) { currTime = addMinutesToTime(currTime, slotInterval); count = 0; }
                count++;
                return { ...c, interviewTime: currTime };
            }));
        };

        // PDF Scanning Engine
        const extractEmailRobustly = (text) => {
            const healed = text.replace(/([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*com/gi, "$1@$2.com");
            const matches = healed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com/gi);
            if (!matches) return '';
            return matches.sort((a, b) => b.length - a.length)[0].toLowerCase();
        };

        const analyzeFile = async (candidateId, file) => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';
                let foundEmail = '';

                for (let i = 1; i <= Math.min(pdf.numPages, 2); i++) {
                    const page = await pdf.getPage(i);
                    if (!foundEmail) {
                        const anns = await page.getAnnotations();
                        for (const a of anns) {
                            if (a.url && a.url.startsWith('mailto:')) {
                                const e = a.url.replace(/^mailto:/i, '').trim().split('?')[0];
                                if (e.toLowerCase().endsWith('.com')) foundEmail = e.toLowerCase();
                            }
                        }
                    }
                    const content = await page.getTextContent();
                    fullText += content.items.map(item => item.str).join(' ') + ' ';
                }

                let email = foundEmail || extractEmailRobustly(fullText);

                if (!email && pdf.numPages > 2) {
                    updateCandidate(candidateId, { summary: 'Deep scan...' });
                    for (let i = 3; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        fullText += content.items.map(item => item.str).join(' ') + ' ';
                    }
                    email = extractEmailRobustly(fullText);
                }

                if (!email && tesseractReady) {
                    updateCandidate(candidateId, { summary: 'Auto OCR Scan...' });
                    const page = await pdf.getPage(1);
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: ctx, viewport }).promise;
                    const { data: { text } } = await window.Tesseract.recognize(canvas.toDataURL('image/png'), 'eng');
                    email = extractEmailRobustly(text);
                }

                updateCandidate(candidateId, {
                    email,
                    status: email ? STATUS.PENDING : STATUS.ERROR,
                    summary: email ? 'Ready' : 'Email not found'
                });
            } catch (err) {
                updateCandidate(candidateId, { status: STATUS.ERROR, summary: 'Read Fail' });
            }
        };



        const handleDragOver = (e) => {
            e.preventDefault();
            setIsDragging(true);
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            setIsDragging(false);
        };

        const handleDrop = (e) => {
            e.preventDefault();
            setIsDragging(false);
            const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
            if (files.length > 0) processFiles(files);
        };

        const processFiles = async (files) => {
            if (!files || files.length === 0) return;
            setGlobalIsAnalyzing(true);

            // Auto slotting logic
            let currTime = commonData.time;
            let count = 0;

            const newOnes = files.map((f, i) => {
                const cand = {
                    id: Date.now() + i,
                    fileObj: f,
                    name: f.name.replace('.pdf', '').replace(/_/g, ' '),
                    email: '',
                    status: STATUS.ANALYZING,
                    interviewPosition: commonData.position,
                    interviewDate: commonData.date,
                    interviewTime: currTime
                };

                count++;
                if (count >= maxCapacity) {
                    currTime = addMinutesToTime(currTime, slotInterval);
                    count = 0;
                }

                return cand;
            });

            setCandidates(prev => [...prev, ...newOnes]);

            for (const cand of newOnes) {
                await analyzeFile(cand.id, cand.fileObj);
            }
            setGlobalIsAnalyzing(false);
        };

        // Bulk Sending
        const initiateBulkAction = () => {
            const pool = candidates.filter(c =>
                (selectedIds.size > 0 ? selectedIds.has(c.id) : true) &&
                c.status !== STATUS.ERROR &&
                c.email
            );
            if (pool.length === 0) {
                alert("No valid candidates.");
                return;
            }

            const grouped = pool.reduce((acc, c) => {
                const p = c.interviewPosition || 'Unassigned';
                if (!acc[p]) acc[p] = [];
                acc[p].push(c);
                return acc;
            }, {});

            setBulkGroups(Object.entries(grouped).map(([pos, items]) =>
                ({ position: pos, items, status: 'pending', template })
            ));
            setActiveGroupIndex(0);
            setShowSafetyModal(true);
        };

        const executeActiveGroupSend = async () => {
            const group = bulkGroups[activeGroupIndex];
            if (!group) return;
            stopProcessingRef.current = false;
            setShowSafetyModal(false);
            setBulkSendingProgress({ current: 0, total: group.items.length });

            for (let i = 0; i < group.items.length; i++) {
                if (stopProcessingRef.current) break;
                const c = group.items[i];
                setBulkSendingProgress({ current: i + 1, total: group.items.length });
                const body = generateBody(group.template, c, commonData);

                if (sendMethod === 'webhook') {
                    await new Promise(r => setTimeout(r, 1500));
                    try {
                        await fetch(webhookUrl, {
                            method: 'POST',
                            mode: 'no-cors',
                            headers: { 'Content-Type': 'text/plain' },
                            body: JSON.stringify({ recipient: c.email, subject: subjectLine, body })
                        });
                        updateCandidate(c.id, { status: STATUS.ASSUMED });
                    } catch (e) {
                        updateCandidate(c.id, { status: STATUS.FAILED });
                    }
                } else {
                    window.open(`mailto:${c.email}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(body)}`, '_blank');
                    updateCandidate(c.id, { status: STATUS.SENT });
                    await new Promise(r => setTimeout(r, 400));
                }
            }

            setBulkSendingProgress(null);
            setBulkGroups(prev => prev.map((g, i) => i === activeGroupIndex ? { ...g, status: 'sent' } : g));

            if (!stopProcessingRef.current && activeGroupIndex < bulkGroups.length - 1) {
                setTimeout(() => {
                    setActiveGroupIndex(prev => prev + 1);
                    setShowSafetyModal(true);
                }, 1000);
            }
        };

        const closeSafetyModal = () => {
            setCountdown(null);
            setShowSafetyModal(false);
            setBulkGroups([]);
            setActiveGroupIndex(0);
        };

        const groupedForRender = useMemo(() => {
            return candidates.reduce((acc, c) => {
                const p = c.interviewPosition || 'Unassigned';
                if (!acc[p]) acc[p] = [];
                acc[p].push(c);
                return acc;
            }, {});
        }, [candidates]);

        // RENDER - Main UI
        return h('div', { className: 'min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 pb-24' },
            // Header
            h('div', { className: 'max-w-7xl mx-auto flex justify-between items-center mb-8' },
                h('div', { className: 'flex items-center gap-4' },
                    h('div', {
                        className: 'bg-slate-900 dark:bg-slate-800 rounded-xl shadow-xl shadow-slate-200 dark:shadow-black/50 overflow-hidden border border-slate-700',
                        style: { height: '40px', width: '40px', minWidth: '40px' }
                    },
                        h('img', { src: 'assets/keya-logo.png', className: 'h-full w-full object-cover' })
                    ),
                    h('div', null,
                        h('h1', { className: 'text-3xl font-black text-slate-900 dark:text-white tracking-tighter' }, 'KEYA'),
                        h('p', { className: 'text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]' }, 'Human Resource Tool')
                    )
                ),
                h('div', { className: 'flex gap-2' },
                    h('button', {
                        onClick: () => setDarkMode(!darkMode),
                        className: `p-2.5 border rounded-2xl transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white hover:bg-slate-50 text-slate-400'}`
                    }, h(Icon, { name: darkMode ? 'sun' : 'moon', className: 'h-5 w-5' })),
                    h('button', {
                        onClick: () => setShowSettings(!showSettings),
                        className: `p-2.5 border rounded-2xl transition-all ${showSettings ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-400'}`
                    }, h(Icon, { name: 'settings', className: 'h-5 w-5' })),
                    h('button', {
                        onClick: resetAll,
                        className: 'p-2.5 border bg-white rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all'
                    }, h(Icon, { name: 'refresh-cw', className: 'h-5 w-5' }))
                )
            ),

            // Settings Panel - Modernized & Minimal
            showSettings && h('div', { className: 'max-w-7xl mx-auto mb-8 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700/50 animate-in slide-in-from-top-4' },
                h('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-12' },
                    h('div', { className: 'space-y-6' },
                        h('div', { className: 'flex items-center gap-3 mb-2' },
                            h('div', { className: 'p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl' },
                                h(Icon, { name: 'zap', className: 'h-4 w-4' })
                            ),
                            h('h3', { className: 'font-black text-xs text-slate-400 uppercase tracking-widest' }, 'Method')
                        ),
                        h('div', { className: 'flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl' },
                            h('button', {
                                onClick: () => setSendMethod('webhook'),
                                className: `flex-1 py-3 text-xs font-black rounded-xl transition-all ${sendMethod === 'webhook' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`
                            }, 'Webhook'),
                            h('button', {
                                onClick: () => setSendMethod('mailto'),
                                className: `flex-1 py-3 text-xs font-black rounded-xl transition-all ${sendMethod === 'mailto' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`
                            }, 'Mailto')
                        ),
                        sendMethod === 'webhook' && h('div', { className: 'space-y-2' },
                            h('label', { className: 'text-[10px] font-bold text-slate-400 ml-1 uppercase' }, 'Webhook URL'),
                            !webhookUnlocked ? h('div', { className: 'flex gap-2' },
                                h('input', {
                                    type: 'password',
                                    value: webhookPassword,
                                    onChange: e => setWebhookPassword(e.target.value),
                                    placeholder: 'Enter password to reveal URL',
                                    className: 'flex-1 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20'
                                }),
                                h('button', {
                                    onClick: () => {
                                        if (webhookPassword === 'keya100') {
                                            setWebhookUnlocked(true);
                                            setWebhookPassword('');
                                        } else {
                                            alert('Incorrect password');
                                        }
                                    },
                                    className: 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all'
                                }, 'Unlock')
                            ) : h('div', { className: 'space-y-2' },
                                h('input', {
                                    type: 'text',
                                    value: webhookUrl,
                                    onChange: e => setWebhookUrl(e.target.value),
                                    placeholder: 'https://script.google.com/...',
                                    className: 'w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20'
                                }),
                                h('button', {
                                    onClick: () => setWebhookUnlocked(false),
                                    className: 'text-[10px] text-slate-400 hover:text-red-500 ml-1'
                                }, '🔒 Lock URL')
                            )
                        ),
                        h('div', { className: 'space-y-2' },
                            h('label', { className: 'text-[10px] font-bold text-slate-400 ml-1 uppercase' }, 'OCR Key (Optional)'),
                            h('input', {
                                type: 'password',
                                value: ocrApiKey,
                                onChange: e => setOcrApiKey(e.target.value),
                                placeholder: 'OCR.space Key',
                                className: 'w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20'
                            })
                        )
                    ),
                    h('div', { className: 'space-y-6' },
                        h('div', { className: 'flex items-center gap-3 mb-2' },
                            h('div', { className: 'p-2 bg-pink-50 dark:bg-pink-900/20 text-pink-500 rounded-xl' },
                                h(Icon, { name: 'layout-grid', className: 'h-4 w-4' })
                            ),
                            h('h3', { className: 'font-black text-xs text-slate-400 uppercase tracking-widest' }, 'Capacity Control')
                        ),
                        h('div', { className: 'grid grid-cols-2 gap-6' },
                            h('div', { className: 'space-y-2' },
                                h('label', { className: 'text-[10px] font-bold text-slate-400 ml-1 uppercase' }, 'Max Per Slot'),
                                h('input', {
                                    type: 'number',
                                    value: maxCapacity,
                                    onChange: e => setMaxCapacity(parseInt(e.target.value) || 1),
                                    className: 'w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold text-center'
                                })
                            ),
                            h('div', { className: 'space-y-2' },
                                h('label', { className: 'text-[10px] font-bold text-slate-400 ml-1 uppercase' }, 'Slot Interval (Min)'),
                                h('input', {
                                    type: 'number',
                                    value: slotInterval,
                                    onChange: e => setSlotInterval(parseInt(e.target.value) || 1),
                                    className: 'w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold text-center'
                                })
                            )
                        )
                    )
                )
            ),

            // Dashboard Controls
            h('div', { className: 'max-w-7xl mx-auto mb-8' },
                h('div', { className: 'grid grid-cols-1 md:grid-cols-12 gap-6' },
                    // Upload Card - Modernized & Interactive
                    h('div', { className: 'md:col-span-4 lg:col-span-3' },
                        h('div', {
                            className: `upload-card h-full bg-white dark:bg-slate-800 rounded-3xl p-1 shadow-sm border ${isDragging ? 'border-blue-500 ring-4 ring-blue-500/20 scale-[1.02]' : 'border-slate-100 dark:border-slate-700/50'} flex flex-col items-center justify-center text-center group transition-all duration-300 hover:shadow-md`,
                            onDragOver: handleDragOver,
                            onDragLeave: handleDragLeave,
                            onDrop: handleDrop
                        },
                            h('label', { className: `cursor-pointer w-full h-full flex flex-col items-center justify-center p-6 rounded-[1.3rem] border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-700 group-hover:border-blue-400/50 group-hover:bg-blue-50/30 dark:group-hover:bg-slate-700/30'} transition-all duration-300` },
                                h('div', { className: `bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 p-4 rounded-2xl mb-4 transition-transform duration-300 ${isDragging ? 'scale-110 rotate-12' : 'group-hover:scale-110'}` },
                                    h(Icon, { name: isDragging ? 'arrow-down' : 'upload-cloud', className: 'h-8 w-8' })
                                ),
                                h('span', { className: 'text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors' }, isDragging ? 'Drop Files Now' : 'Upload CVs'),
                                h('span', { className: 'text-[10px] text-slate-400 mt-2 font-medium' }, isDragging ? 'Release to upload' : 'Drag & Drop or Click'),
                                h('div', { className: 'mt-2 flex gap-1' },
                                    h('span', { className: 'px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[9px] font-bold text-slate-500 dark:text-slate-400' }, 'PDF ONLY')
                                ),
                                h('input', {
                                    type: 'file',
                                    multiple: true,
                                    accept: '.pdf',
                                    className: 'hidden',
                                    onChange: e => processFiles(Array.from(e.target.files)),
                                    disabled: !pdfLibReady
                                })
                            )
                        )
                    ),

                    // Controls & Defaults - Modernized
                    h('div', { className: 'md:col-span-8 lg:col-span-9 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col justify-between' },
                        h('div', { className: 'flex items-center justify-between mb-6' },
                            h('div', { className: 'flex items-center gap-3' },
                                h('div', { className: 'p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl' },
                                    h(Icon, { name: 'sliders', className: 'h-4 w-4' })
                                ),
                                h('span', { className: 'text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest' }, 'Batch Settings')
                            ),
                            h('button', {
                                onClick: () => setShowManualAdd(!showManualAdd),
                                className: `flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showManualAdd ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100'}`
                            },
                                h(Icon, { name: showManualAdd ? 'minus' : 'plus', className: 'h-3.5 w-3.5' }),
                                ' Add Manually'
                            )
                        ),

                        h('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
                            h('div', { className: 'space-y-2' },
                                h('label', { className: 'text-[10px] font-bold text-slate-400 uppercase ml-1' }, 'Role'),
                                h('input', {
                                    value: commonData.position,
                                    onChange: e => setCommonData({ ...commonData, position: e.target.value }),
                                    className: 'w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20'
                                })
                            ),
                            h('div', { className: 'space-y-2' },
                                h('label', { className: 'text-[10px] font-bold text-slate-400 uppercase ml-1' }, 'Date'),
                                h('input', {
                                    type: 'date',
                                    value: commonData.date,
                                    onChange: e => setCommonData({ ...commonData, date: e.target.value }),
                                    className: 'w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20'
                                })
                            ),
                            h('div', { className: 'space-y-2' },
                                h('label', { className: 'text-[10px] font-bold text-slate-400 uppercase ml-1' }, 'Start Time'),
                                h(TimePicker, {
                                    value: commonData.time,
                                    onChange: time => setCommonData({ ...commonData, time }),
                                    className: 'bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-1'
                                })
                            )
                        ),

                        showManualAdd && h('div', { className: 'mt-6 pt-6 border-t border-slate-50 dark:border-slate-700 animate-in slide-in-from-top-2' },
                            h('div', { className: 'flex gap-3' },
                                h('input', {
                                    value: newName,
                                    onChange: e => setNewName(e.target.value),
                                    placeholder: 'Candidate Name',
                                    className: 'flex-1 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/20'
                                }),
                                h('input', {
                                    value: newEmail,
                                    onChange: e => setNewEmail(e.target.value),
                                    placeholder: 'Email Address',
                                    className: 'flex-1 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/20'
                                }),
                                h('button', {
                                    onClick: addManualCandidate,
                                    className: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-2xl text-[10px] font-black uppercase hover:opacity-90 transition-all shadow-lg shadow-slate-200 dark:shadow-none'
                                }, 'Add')
                            )
                        )
                    )
                )
            ),

            // Email Template Editor - Rebuilt from Scratch
            h('div', { className: 'max-w-7xl mx-auto mb-8' },
                !showTemplateEditor ? (
                    // Collapsed State - Clean Minimal Bar (Enlarged)
                    h('button', {
                        onClick: () => setShowTemplateEditor(true),
                        className: 'w-full group flex items-center justify-between p-8 bg-transparent border border-slate-700/50 hover:border-purple-500/50 rounded-3xl transition-all'
                    },
                        h('div', { className: 'flex items-center gap-6' },
                            h('div', { className: 'h-16 w-16 shrink-0 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-purple-400 group-hover:scale-105 transition-all border border-slate-700 group-hover:border-purple-500/30 shadow-lg' },
                                h(Icon, { name: 'mail', className: 'h-8 w-8' })
                            ),
                            h('div', { className: 'text-left space-y-1' },
                                h('h3', { className: 'text-xl font-bold text-slate-200 group-hover:text-white transition-colors' }, 'Email Template'),
                                h('p', { className: 'text-sm text-slate-500' }, 'Click here to customize the invitation message')
                            )
                        ),
                        h('div', { className: 'px-6 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-slate-400 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-all shadow-md' },
                            h('div', { className: 'flex items-center gap-2' },
                                h(Icon, { name: 'edit-3', className: 'h-4 w-4' }),
                                'Edit Template'
                            )
                        )
                    )
                ) : (
                    // Expanded State - Full Editor
                    h('div', { className: 'bg-slate-900/50 border border-slate-700 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300' },
                        // Header
                        h('div', { className: 'flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-slate-900/30' },
                            h('div', { className: 'flex items-center gap-3' },
                                h('div', { className: 'h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400' },
                                    h(Icon, { name: 'edit-3', className: 'h-4 w-4' })
                                ),
                                h('div', {},
                                    h('h3', { className: 'text-sm font-bold text-slate-200' }, 'Customize Invitation Email'),
                                    h('p', { className: 'text-[10px] text-slate-500 font-medium uppercase tracking-wider' }, 'Edit the message sent to candidates')
                                )
                            ),
                            h('button', {
                                onClick: () => setShowTemplateEditor(false),
                                className: 'h-8 w-8 flex items-center justify-center hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-300 transition-colors'
                            }, h(Icon, { name: 'x', className: 'h-4 w-4' }))
                        ),

                        // Main Grid
                        h('div', { className: 'grid lg:grid-cols-2' },
                            // Left: Editor
                            h('div', { className: 'p-6 space-y-5 border-r border-slate-800' },
                                // Subject
                                h('div', { className: 'space-y-2' },
                                    h('label', { className: 'text-[10px] uppercase font-bold text-slate-500 tracking-wider' }, 'Subject'),
                                    h('input', {
                                        value: subjectLine,
                                        onChange: e => setSubjectLine(e.target.value),
                                        className: 'w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-colors placeholder-slate-600',
                                        placeholder: 'Enter email subject...'
                                    })
                                ),

                                // Body
                                h('div', { className: 'space-y-2' },
                                    h('label', { className: 'text-[10px] uppercase font-bold text-slate-500 tracking-wider' }, 'Message'),
                                    h('textarea', {
                                        value: template,
                                        onChange: e => setTemplate(e.target.value),
                                        className: 'w-full h-[600px] bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-slate-300 focus:outline-none focus:border-purple-500 transition-colors resize-y placeholder-slate-600 leading-relaxed custom-scrollbar'
                                    })
                                ),

                                // Variables Bar
                                h('div', { className: 'pt-2' },
                                    h('div', { className: 'flex flex-wrap gap-2' },
                                        [
                                            { tag: '{name}', icon: 'user' },
                                            { tag: '{position}', icon: 'briefcase' },
                                            { tag: '{date}', icon: 'calendar' },
                                            { tag: '{time}', icon: 'clock' }
                                        ].map(v => h('button', {
                                            key: v.tag,
                                            onClick: () => setTemplate(prev => prev + ' ' + v.tag),
                                            className: 'flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-purple-500/20 border border-slate-700 hover:border-purple-500/50 rounded-lg group transition-all'
                                        },
                                            h(Icon, { name: v.icon, className: 'h-3 w-3 text-slate-500 group-hover:text-purple-400' }),
                                            h('code', { className: 'text-xs font-mono text-slate-400 group-hover:text-purple-300' }, v.tag)
                                        ))
                                    )
                                )
                            ),

                            // Right: Preview
                            h('div', { className: 'bg-slate-950/30 p-6 flex flex-col' },
                                h('div', { className: 'flex items-center gap-2 mb-4 opacity-50' },
                                    h(Icon, { name: 'eye', className: 'h-3 w-3' }),
                                    h('span', { className: 'text-[10px] uppercase font-bold tracking-wider' }, 'Preview')
                                ),
                                h('div', { className: 'flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm' },
                                    h('div', { className: 'border-b border-slate-200 dark:border-slate-800 pb-4 mb-4' },
                                        h('h4', { className: 'text-sm font-bold text-slate-900 dark:text-slate-100' },
                                            subjectLine.replace('{position}', commonData.position).replace('{name}', 'Candidate Name')
                                        ),
                                        h('div', { className: 'flex items-center gap-2 mt-2' },
                                            h('div', { className: 'h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-[10px] font-bold text-purple-600 dark:text-purple-400' }, 'HR'),
                                            h('span', { className: 'text-xs text-slate-500' }, 'Recruiting Team')
                                        )
                                    ),
                                    h('div', { className: 'prose dark:prose-invert max-w-none' },
                                        h('div', { className: 'text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed' },
                                            generateBody(template, { name: 'Alex Johnson' }, { ...commonData, position: commonData.position || 'Senior Designer', date: formatDisplayDate(commonData.date || new Date().toISOString().split('T')[0]), time: commonData.time })
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            ),

            // Slot Candidates Modal
            selectedTimeSlot && h('div', { className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200' },
                h('div', { className: 'modal-content rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative' },
                    // Modal Header
                    h('div', { className: 'modal-header px-6 py-5 border-b flex justify-between items-center' },
                        h('div', { className: 'flex items-center gap-3' },
                            h('div', { className: 'h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400' },
                                h(Icon, { name: 'calendar', className: 'h-5 w-5' })
                            ),
                            h('div', {},
                                h('h3', { className: 'text-base font-bold text-slate-800 dark:text-white' }, formatDisplayTime(selectedTimeSlot.time)),
                                h('p', { className: 'text-xs text-slate-500 dark:text-slate-400 font-medium' },
                                    selectedTimeSlot.date ? selectedTimeSlot.date : 'No date scheduled'
                                )
                            )
                        ),
                        h('button', {
                            onClick: () => setSelectedTimeSlot(null),
                            className: 'p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400'
                        }, h(Icon, { name: 'x', className: 'h-5 w-5' }))
                    ),

                    // Modal Body
                    h('div', { className: 'p-2 max-h-[60vh] overflow-y-auto custom-scrollbar' },
                        (selectedTimeSlot.candidates && selectedTimeSlot.candidates.length > 0) ? (
                            h('div', { className: 'space-y-1' },
                                selectedTimeSlot.candidates.map(c => h('div', {
                                    key: c.id,
                                    className: 'flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group'
                                },
                                    h('div', { className: 'h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xs' },
                                        getInitials(c.name)
                                    ),
                                    h('div', { className: 'flex-1 min-w-0' },
                                        h('h4', { className: 'text-sm font-bold text-slate-700 dark:text-slate-200 truncate' }, c.name),
                                        h('p', { className: 'text-xs text-slate-400 truncate' }, c.email || 'No email')
                                    ),
                                    h('div', { className: `px-2 py-1 rounded-md text-[10px] font-bold uppercase ${c.status === STATUS.SENT ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}` },
                                        String(c.status || 'pending')
                                    )
                                ))
                            )
                        ) : (
                            h('div', { className: 'py-12 text-center text-slate-400' }, 'No candidates in this slot')
                        )
                    ),

                    // Modal Footer
                    h('div', { className: 'bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center' },
                        h('span', { className: 'text-xs font-bold text-slate-400 uppercase tracking-wider' },
                            `${(selectedTimeSlot.candidates || []).length} Candidate${(selectedTimeSlot.candidates || []).length !== 1 ? 's' : ''}`
                        ),
                        h('button', {
                            onClick: () => setSelectedTimeSlot(null),
                            className: 'px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm'
                        }, 'Close')
                    )
                )
            ),

            // Timeline View - Clean
            h('div', { className: 'max-w-7xl mx-auto mb-8' },
                h(TimelineView, { candidates, maxCapacity, onSlotClick: setSelectedTimeSlot })
            ),

            // Main Table Container with Sticky Header
            h('div', { className: 'max-w-7xl mx-auto bg-transparent rounded-2xl overflow-hidden border border-slate-600' },
                // Sticky Header with Filters
                h('div', { className: 'sticky-header' },
                    h('div', { className: 'flex items-center gap-4' },
                        // Select All Checkbox
                        h('div', {
                            onClick: () => setSelectedIds(selectedIds.size === candidates.length ? new Set() : new Set(candidates.map(c => c.id))),
                            className: `custom-checkbox ${selectedIds.size === candidates.length && candidates.length > 0 ? 'checked' : ''}`
                        }),
                        h('span', { className: 'text-xs font-bold text-slate-600 dark:text-slate-300' }, 'Select All'),
                        selectedIds.size > 0 && h('span', { className: 'count-badge' }, selectedIds.size)
                    ),
                    // Filter Chips
                    h('div', { className: 'flex items-center gap-2 flex-wrap' },
                        [
                            { key: 'all', label: 'All', icon: 'users' },
                            { key: 'pending', label: 'Pending', icon: 'clock' },
                            { key: 'sent', label: 'Sent', icon: 'check-circle' },
                            { key: 'failed', label: 'Failed', icon: 'x-circle' }
                        ].map(f => h('button', {
                            key: f.key,
                            onClick: () => setStatusFilter(f.key),
                            className: `filter-chip ${statusFilter === f.key ? 'active' : ''}`
                        },
                            h(Icon, { name: f.icon, className: 'h-3 w-3' }),
                            f.label,
                            h('span', { className: 'text-[9px] opacity-60' }, statusCounts[f.key])
                        ))
                    ),
                    // Actions
                    h('div', { className: 'flex items-center gap-2' },
                        selectedIds.size > 0 && h('button', {
                            onClick: selectInverse,
                            className: 'text-[10px] font-bold text-slate-500 hover:text-blue-500 flex items-center gap-1 transition-colors'
                        },
                            h(Icon, { name: 'shuffle', className: 'h-3 w-3' }),
                            'Invert'
                        )
                    )
                ),
                // Candidates List
                h('div', { className: 'p-4 space-y-3' },
                    Object.entries(groupedForRender).map(([pos, group]) => {
                        const filteredGroup = group.filter(c => filteredCandidates.some(fc => fc.id === c.id));
                        if (filteredGroup.length === 0) return null;
                        return h('div', { key: pos, className: 'space-y-2' },
                            h('div', { className: 'flex items-center gap-4 px-2 py-2' },
                                h('span', { className: 'text-[10px] font-black text-slate-400 uppercase tracking-widest' }, pos),
                                h('div', { className: 'h-px bg-slate-100 dark:bg-slate-700 flex-1' }),
                                h('span', { className: 'text-[10px] font-bold text-slate-300' }, `${filteredGroup.length} candidates`)
                            ),
                            filteredGroup.map(c => {
                                const isSuccess = c.status === STATUS.SENT || c.status === STATUS.ASSUMED;
                                const isError = c.status === STATUS.ERROR;
                                const statusClass = isSuccess ? 'status-sent' : isError ? 'status-error' : 'status-pending';
                                return h('div', {
                                    key: c.id,
                                    className: `candidate-card ${statusClass} ${selectedIds.has(c.id) ? 'selected' : ''} group`,
                                    onClick: () => toggleSelection(c.id)
                                },
                                    // Custom Checkbox
                                    h('div', {
                                        onClick: e => { e.stopPropagation(); toggleSelection(c.id); },
                                        className: `custom-checkbox ${selectedIds.has(c.id) ? 'checked' : ''}`
                                    }),
                                    // Avatar
                                    h('div', { className: 'avatar-circle' }, getInitials(c.name)),
                                    // Info
                                    h('div', { className: 'flex-1 min-w-0' },
                                        h('div', { className: 'flex items-center gap-3 mb-1' },
                                            h('span', { className: 'font-bold text-slate-800 dark:text-slate-100 text-sm truncate' }, c.name),
                                            h('span', {
                                                className: `status-badge ${isSuccess ? 'sent' : isError ? 'error' : 'pending'}`
                                            },
                                                h(Icon, { name: isSuccess ? 'check' : isError ? 'x' : 'clock', className: 'h-3 w-3' }),
                                                c.status
                                            )
                                        ),
                                        h('div', { className: 'flex flex-wrap items-center gap-4 text-[11px] text-slate-400' },
                                            h('div', {
                                                className: 'flex items-center gap-2',
                                                onClick: e => e.stopPropagation()
                                            },
                                                h(Icon, { name: 'mail', className: 'h-3 w-3 opacity-50' }),
                                                c.isEditing
                                                    ? h('input', {
                                                        autoFocus: true,
                                                        defaultValue: c.email,
                                                        onBlur: e => updateCandidate(c.id, { email: e.target.value, isEditing: false, status: STATUS.PENDING }),
                                                        onKeyDown: e => {
                                                            if (e.key === 'Enter') updateCandidate(c.id, { email: e.target.value, isEditing: false, status: STATUS.PENDING });
                                                        },
                                                        className: 'bg-slate-100 dark:bg-slate-900 border-none rounded-lg px-2 py-1 outline-none w-48 lowercase text-slate-700 dark:text-slate-200 text-xs'
                                                    })
                                                    : h('span', {
                                                        className: `cursor-pointer hover:text-blue-500 transition-colors lowercase ${!c.email ? 'text-rose-400' : ''}`,
                                                        onClick: () => updateCandidate(c.id, { isEditing: true })
                                                    }, c.email || 'Add email...')
                                            ),
                                            h('div', {
                                                className: 'flex items-center gap-2',
                                                onClick: e => e.stopPropagation()
                                            },
                                                h(Icon, { name: 'clock', className: 'h-3 w-3 opacity-50' }),
                                                h(TimePicker, {
                                                    value: c.interviewTime,
                                                    onChange: time => updateCandidate(c.id, { interviewTime: time }),
                                                    className: 'text-xs bg-transparent'
                                                })
                                            )
                                        )
                                    ),
                                    // Actions
                                    h('div', {
                                        className: 'flex items-center gap-2',
                                        onClick: e => e.stopPropagation()
                                    },
                                        // Quick Send Button
                                        c.status === STATUS.PENDING && c.email && h('button', {
                                            onClick: () => { /* Quick send logic */ },
                                            className: 'quick-send-btn'
                                        },
                                            h(Icon, { name: 'send', className: 'h-3 w-3' }),
                                            'Send'
                                        ),
                                        h('button', {
                                            onClick: () => setPreviewCandidateId(c.id),
                                            className: 'p-2 bg-transparent border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all',
                                            title: 'Preview'
                                        }, h(Icon, { name: 'eye', className: 'h-4 w-4' })),
                                        h('button', {
                                            onClick: () => removeCandidate(c.id),
                                            className: 'p-2 bg-transparent border border-slate-200 dark:border-slate-600 hover:border-red-400 dark:hover:border-red-500 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all',
                                            title: 'Remove'
                                        }, h(Icon, { name: 'trash-2', className: 'h-4 w-4' }))
                                    )
                                );
                            })
                        );
                    }),
                    // Empty State
                    candidates.length === 0 && h('div', { className: 'empty-state' },
                        h('div', { className: 'empty-state-illustration' },
                            h(Icon, { name: 'inbox', className: 'h-16 w-16 text-blue-400 relative z-10' })
                        ),
                        h('h3', { className: 'text-xl font-black text-slate-700 dark:text-slate-200 mb-2' }, 'No Candidates Yet'),
                        h('p', { className: 'text-sm text-slate-400 mb-6 max-w-md mx-auto' },
                            'Upload PDF resumes or add candidates manually to get started with your recruitment workflow.'
                        ),
                        h('div', { className: 'mt-6 flex flex-col items-center animate-bounce' },
                            h(Icon, { name: 'arrow-up', className: 'h-6 w-6 text-blue-400' }),
                            h('span', { className: 'text-xs font-bold text-blue-500 uppercase tracking-widest mt-2' }, 'Start Above')
                        )
                    )
                )
            ),

            // Progress Bar
            bulkSendingProgress && h('div', { className: 'bg-blue-50 px-8 py-4 flex items-center gap-6 border-b animate-in fade-in' },
                h(Icon, { name: 'loader-2', className: 'h-4 w-4 animate-spin text-blue-600' }),
                h('div', { className: 'flex-1 h-2 bg-blue-100 rounded-full overflow-hidden' },
                    h('div', {
                        className: 'h-full bg-blue-600 transition-all duration-300',
                        style: { width: `${(bulkSendingProgress.current / bulkSendingProgress.total) * 100}%` }
                    })
                ),
                h('button', {
                    onClick: () => stopProcessingRef.current = true,
                    className: 'text-[10px] font-black text-red-600 bg-white px-4 py-1.5 rounded-full border border-red-100 uppercase tracking-widest'
                }, 'Abort')
            ),


            // Safety Modal
            showSafetyModal && currentBulkGroup && h('div', {
                className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in'
            },
                h('div', { className: 'bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden relative' },
                    countdown !== null && h('div', {
                        className: 'absolute top-0 left-0 h-1.5 bg-blue-600 transition-all duration-[3000ms] ease-linear w-full',
                        style: { width: '100%', transformOrigin: 'left' }
                    }),
                    h('div', { className: 'px-10 py-8 bg-slate-50 border-b flex justify-between items-center' },
                        h('div', null,
                            h('h3', { className: 'font-black text-2xl text-slate-900 flex items-center gap-4 tracking-tighter' },
                                h(Icon, { name: 'shield-alert', className: 'text-blue-600 h-8 w-8' }),
                                ' Ready to Launch?'
                            ),
                            h('p', { className: 'text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2' },
                                `Active Batch: ${currentBulkGroup.position} (${activeGroupIndex + 1} of ${bulkGroups.length})`
                            )
                        ),
                        h('button', {
                            onClick: closeSafetyModal,
                            className: 'p-3 hover:bg-slate-200 rounded-full transition-all'
                        }, h(Icon, { name: 'x', className: 'h-5 w-5' }))
                    ),
                    h('div', { className: 'p-4 flex justify-between px-16 bg-white border-b' },
                        h('button', {
                            onClick: () => setActiveGroupIndex(Math.max(0, activeGroupIndex - 1)),
                            disabled: activeGroupIndex === 0 || countdown !== null,
                            className: 'p-2 border rounded-full disabled:opacity-10 hover:bg-slate-50 transition-all'
                        }, h(Icon, { name: 'chevron-left' })),
                        h('span', { className: 'text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] self-center' }, 'Switch Group'),
                        h('button', {
                            onClick: () => setActiveGroupIndex(Math.min(bulkGroups.length - 1, activeGroupIndex + 1)),
                            disabled: activeGroupIndex === bulkGroups.length - 1 || countdown !== null,
                            className: 'p-2 border rounded-full disabled:opacity-10 hover:bg-slate-50 transition-all'
                        }, h(Icon, { name: 'chevron-right' }))
                    ),
                    h('div', { className: 'p-10 space-y-8' },
                        currentBulkGroup.status === 'sent'
                            ? h('div', { className: 'text-center py-12 flex flex-col items-center animate-in zoom-in' },
                                h(Icon, { name: 'check-circle-2', className: 'text-green-500 h-20 w-20 mb-6' }),
                                h('h4', { className: 'font-black text-2xl text-slate-900 uppercase tracking-widest' }, 'Emails Dispatched')
                            )
                            : h('div', null,
                                h('div', { className: 'grid grid-cols-2 gap-6' },
                                    h('div', { className: 'bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner' },
                                        h('span', { className: 'text-[10px] font-black block opacity-40 uppercase tracking-widest mb-2' }, 'Recipients'),
                                        h('span', { className: 'text-3xl font-black' }, currentBulkGroup.items.length)
                                    ),
                                    h('div', { className: 'bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner' },
                                        h('span', { className: 'text-[10px] font-black block opacity-40 uppercase tracking-widest mb-2' }, 'Method'),
                                        h('span', { className: 'text-3xl font-black uppercase text-blue-600' }, sendMethod)
                                    )
                                ),
                                h('div', { className: 'space-y-2' },
                                    h('label', { className: 'text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest' }, 'Custom Template for this Group'),
                                    h('textarea', {
                                        value: currentBulkGroup.template,
                                        onChange: e => {
                                            const next = [...bulkGroups];
                                            next[activeGroupIndex].template = e.target.value;
                                            setBulkGroups(next);
                                        },
                                        className: 'w-full h-44 p-6 bg-slate-50 border border-slate-200 rounded-3xl font-mono text-[11px] outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed shadow-inner'
                                    })
                                )
                            )
                    ),
                    currentBulkGroup.status !== 'sent' && !countdown && h('div', { className: 'p-10 bg-slate-50 border-t flex justify-end gap-6' },
                        h('button', {
                            onClick: closeSafetyModal,
                            className: 'px-8 py-3 font-black text-slate-400 hover:text-slate-600 transition-all uppercase text-[10px] tracking-widest'
                        }, 'Dismiss'),
                        h('button', {
                            onClick: () => setCountdown(3),
                            className: 'px-14 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-500/40 hover:bg-blue-700 flex items-center gap-4 transition-all active:scale-95 uppercase text-[10px] tracking-widest'
                        },
                            h(Icon, { name: 'rocket', className: 'h-5 w-5' }),
                            ' Launch Emails'
                        )
                    ),
                    countdown && h('div', { className: 'p-10 text-center font-black text-blue-600 animate-pulse uppercase tracking-[0.2em] text-sm' },
                        'Launching group in 3s... ',
                        h('button', {
                            onClick: () => setCountdown(null),
                            className: 'ml-6 text-red-500 underline text-xs font-black uppercase tracking-tight'
                        }, 'Abort')
                    )
                )
            ),
            // New Floating Action Bar - Chip Style Design
            selectedIds.size > 0 && !showSafetyModal && h('div', {
                className: 'floating-bar-enter',
                style: { position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 40 }
            },
                h('div', {
                    className: 'flex items-center gap-3 bg-slate-800/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-2xl shadow-black/50 border border-slate-700'
                },
                    // Selection Badge
                    h('div', { className: 'flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-full' },
                        h(Icon, { name: 'check-circle', className: 'h-4 w-4 text-blue-400' }),
                        h('span', { className: 'text-sm font-bold text-blue-300' },
                            `${selectedIds.size} Selected`
                        )
                    ),

                    // Divider
                    h('div', { className: 'w-px h-8 bg-slate-200 dark:bg-slate-700' }),

                    // Bulk Edit: Position
                    h('div', { className: 'flex items-center gap-1.5' },
                        h(Icon, { name: 'briefcase', className: 'h-4 w-4 text-slate-400' }),
                        h('input', {
                            type: 'text',
                            placeholder: 'Position',
                            value: bulkEditPosition,
                            onChange: e => setBulkEditPosition(e.target.value),
                            className: 'w-24 px-2 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30'
                        })
                    ),

                    // Bulk Edit: Time (AM/PM)
                    h('div', { className: 'flex items-center gap-1' },
                        h(Icon, { name: 'clock', className: 'h-4 w-4 text-slate-400' }),
                        h('select', {
                            value: bulkEditTime.split(':')[0] || '12',
                            onChange: e => {
                                const mins = bulkEditTime.split(':')[1] || '00';
                                setBulkEditTime(`${e.target.value}:${mins}`);
                            },
                            className: 'px-1 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none'
                        },
                            ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'].map(hr =>
                                h('option', { key: hr, value: hr }, hr)
                            )
                        ),
                        h('span', { className: 'text-slate-400 text-xs' }, ':'),
                        h('select', {
                            value: bulkEditTime.split(':')[1] || '00',
                            onChange: e => {
                                const hrs = bulkEditTime.split(':')[0] || '12';
                                setBulkEditTime(`${hrs}:${e.target.value}`);
                            },
                            className: 'px-1 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none'
                        },
                            ['00', '15', '30', '45'].map(min =>
                                h('option', { key: min, value: min }, min)
                            )
                        ),
                        h('select', {
                            onChange: e => {
                                let hrs = parseInt(bulkEditTime.split(':')[0] || '12');
                                const mins = bulkEditTime.split(':')[1] || '00';
                                if (e.target.value === 'PM' && hrs < 12) hrs += 12;
                                if (e.target.value === 'AM' && hrs >= 12) hrs -= 12;
                                setBulkEditTime(`${hrs.toString().padStart(2, '0')}:${mins}`);
                            },
                            className: 'px-1 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none'
                        },
                            h('option', { value: 'AM' }, 'AM'),
                            h('option', { value: 'PM' }, 'PM')
                        )
                    ),

                    // Single Apply Button (Chip - outlined like Schedule/Clear)
                    h('button', {
                        onClick: () => {
                            if (bulkEditPosition) applyBulkEdit('position', bulkEditPosition);
                            if (bulkEditTime) applyBulkEdit('time', bulkEditTime);
                            setBulkEditPosition('');
                            setBulkEditTime('');
                        },
                        className: 'flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all',
                        title: 'Apply Changes'
                    },
                        h(Icon, { name: 'check', className: 'h-4 w-4' }),
                        'Apply'
                    ),

                    // Divider
                    h('div', { className: 'w-px h-8 bg-slate-200 dark:bg-slate-700' }),

                    // Launch Button (Primary - filled)
                    h('button', {
                        onClick: () => setShowSafetyModal(true),
                        className: 'flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95'
                    },
                        h(Icon, { name: 'send', className: 'h-4 w-4' }),
                        'Launch'
                    ),

                    // Schedule All (Chip - outlined)
                    h('button', {
                        onClick: autoSchedule,
                        className: 'flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300 transition-all',
                        title: 'Auto Schedule All'
                    },
                        h(Icon, { name: 'calendar-plus', className: 'h-4 w-4 text-slate-500 dark:text-slate-400' }),
                        'Schedule'
                    ),

                    // Clear All (Chip - outlined with red hover)
                    h('button', {
                        onClick: () => setSelectedIds(new Set()),
                        className: 'flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-red-50 dark:hover:bg-red-950 border border-slate-300 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-800 rounded-full text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all',
                        title: 'Clear Selection'
                    },
                        h(Icon, { name: 'x-circle', className: 'h-4 w-4' }),
                        'Clear'
                    )
                )
            ),

            // Preview Modal
            previewCandidateId && h('div', {
                className: 'fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in',
                onClick: () => setPreviewCandidateId(null)
            },
                h('div', {
                    className: 'bg-white rounded-[3rem] max-w-xl w-full p-12 shadow-2xl relative animate-in zoom-in-95 border border-white/20',
                    onClick: e => e.stopPropagation()
                },
                    h('h3', { className: 'font-black text-3xl mb-10 flex items-center gap-4 text-slate-900 tracking-tighter' },
                        h(Icon, { name: 'eye', className: 'text-blue-500 h-10 w-10' }),
                        ' Message Detail'
                    ),
                    h('div', { className: 'bg-slate-50 p-10 rounded-[2rem] border border-slate-100 text-sm font-mono whitespace-pre-wrap leading-relaxed shadow-inner max-h-[55vh] overflow-y-auto custom-scrollbar' },
                        generateBody(template, candidates.find(c => c.id === previewCandidateId) || {}, commonData)
                    ),
                    h('div', { className: 'mt-10 border-t border-slate-100 pt-8 flex justify-end' },
                        h('button', {
                            onClick: () => setPreviewCandidateId(null),
                            className: 'px-14 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95'
                        }, 'Looks Good')
                    )
                )
            )
        );
    }

    // Render the app
    try {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(h(App));
        console.log('Full-featured app rendered successfully!');
    } catch (error) {
        console.error('Render error:', error);
        document.getElementById('root').innerHTML = `<div style="padding: 40px; color: red;">Error: ${error.message}</div>`;
    }
});

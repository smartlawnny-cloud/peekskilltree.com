/**
 * Ground Control — White-Label Configuration
 * Change these values to rebrand the entire app.
 */
var GC_CONFIG = {
  // Branding
  appName: 'Ground Control',
  tagline: 'Your morning. Your mind. Your map.',
  version: '1.0.0',

  // Colors
  primaryColor: '#4A90D9',
  primaryDark: '#3A7BC8',
  primaryLight: '#6BA8E8',
  accentColor: '#F5A623',
  accentLight: '#FFEAA7',
  successColor: '#27AE60',
  dangerColor: '#E74C3C',
  bgColor: '#F7F8FA',
  cardBg: '#FFFFFF',
  textColor: '#2D3436',
  textLight: '#636E72',
  borderColor: '#DFE6E9',

  // Dark mode
  darkBg: '#1A1D23',
  darkCard: '#242830',
  darkText: '#E4E6EB',
  darkTextLight: '#B0B3B8',
  darkBorder: '#3A3D45',

  // Mood emojis (ordered low to high)
  moods: [
    { emoji: '😤', label: 'Frustrated', value: 'frustrated' },
    { emoji: '😔', label: 'Low', value: 'low' },
    { emoji: '😐', label: 'Neutral', value: 'neutral' },
    { emoji: '🙂', label: 'Good', value: 'good' },
    { emoji: '😊', label: 'Great', value: 'great' }
  ],

  // Movement options
  movements: [
    { icon: '🚶', label: 'Walk', value: 'walk' },
    { icon: '🧘', label: 'Stretch', value: 'stretch' },
    { icon: '💪', label: 'Workout', value: 'workout' },
    { icon: '⏭️', label: 'Skip', value: 'skip' }
  ],

  // Journal prompts (ADHD/anxiety-aware, rotated daily)
  prompts: [
    "What's your brain chewing on before you even asked it to?",
    "What are you avoiding right now?",
    "What would make today feel like a win?",
    "What's one thing you're grateful for that you usually ignore?",
    "What pattern are you noticing in yourself lately?",
    "If you could only do one thing today, what matters most?",
    "What's draining your energy that you haven't named yet?",
    "Who do you need to talk to that you've been putting off?",
    "What's something small you did yesterday that actually mattered?",
    "What would you tell a friend who felt the way you feel right now?",
    "What are you overthinking?",
    "What needs to happen before you can relax today?",
    "What's one boundary you need to hold today?",
    "What did you learn about yourself this week?",
    "What's the story you're telling yourself right now? Is it true?"
  ]
};

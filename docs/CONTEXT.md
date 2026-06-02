# Dyslexia Learning Platform – Complete Product Specification

---

# 1. Project Overview

This project is an **educational web application designed to support children with dyslexia** by improving their reading, pronunciation, and comprehension skills through interactive learning activities.

The platform combines **multisensory learning, gamification, and assistive technologies** to create a supportive learning environment. It integrates **Text-to-Speech and Speech-to-Text technologies** that allow children to listen to words and practice speaking.

A **Machine Learning personalization system** continuously adapts the learning experience to match each child's learning speed and ability. The platform analyzes performance data such as reading accuracy, pronunciation scores, response time, and completed activities to automatically adjust difficulty levels and recommend appropriate learning tasks.

The interface is designed to be **child-friendly, visually engaging, and dyslexia-friendly**, using soft color palettes, large typography, clear spacing, and playful animations.

The goal is to provide a **simple, accessible, and adaptive learning environment for children aged 6–14**.

---

# 2. Target Users

## Primary Users
Children with dyslexia (ages **6–14**) who need support improving:

- Reading ability
- Pronunciation
- Language comprehension

## Secondary Users
- Parents
- Teachers

Parents and teachers can monitor student learning progress through analytics dashboards.

---

# 3. Application Flow

## Step 1 – Website Launch

When the user opens the website:

- A **loading screen appears**
- The **app logo is displayed in the center**
- A **soft animated buffering/loading indicator** appears below the logo
- The background uses **soft pastel colors suitable for dyslexic children**

After loading finishes, the user is directed to the **dashboard**.

---

## Step 2 – Open Access System

The platform allows **open access without mandatory signup**.

Users can:

- View the dashboard
- Use reading practice
- Use speech practice
- Play learning games
- View progress demo

Users can optionally:

- **Sign Up**
- **Log In**

to save their progress.

---

## Step 3 – Dashboard Navigation

The dashboard serves as the **main navigation hub**.

Large animated cards provide access to:

- Reading Practice
- Speech Practice
- Learning Games
- Progress Tracker

Each card includes:

- A friendly icon
- A large label
- Hover or tap animation
- Bright pastel color theme

---

## Step 4 – Learning Activities

Children participate in learning activities such as:

- Reading stories
- Speech practice
- Word-based games

Children earn:

- Points
- Stars
- Rewards
- Achievements

---

## Step 5 – Adaptive Learning

The system records learning data and uses **Machine Learning personalization** to adjust:

- Difficulty levels
- Lesson pacing
- Recommended activities

This ensures each child receives a **personalized learning experience**.

---

# 4. Core Features

## Reading Practice

Children practice reading simple learning content.

Examples:

- Words
- Sentences
- Short stories

Features include:

- Word highlighting while reading
- Text-to-Speech support
- Audio playback
- Large readable fonts
- Minimal distractions

---

## Speech Practice

Speech practice focuses on pronunciation improvement.

### Interaction Flow

1. The system plays an **audio pronunciation**.
2. The child listens carefully.
3. The child **records their response using the microphone**.
4. Speech recognition converts speech to text.
5. The system compares expected text with spoken text.
6. The system displays pronunciation feedback.

Example feedback:

- ⭐ Excellent pronunciation
- 👍 Good job
- 🔁 Try again

---

## Gamified Learning

Learning activities are presented as **interactive mini-games**.

Gamification elements include:

- Levels
- Points
- Rewards
- Achievements
- Stars or badges

These features encourage children to **continue practicing regularly**.

---

## Machine Learning Personalization

The system tracks learning data such as:

- Reading accuracy
- Pronunciation scores
- Activity completion
- Response speed
- Time spent learning

Machine learning algorithms use this data to:

- Adjust difficulty levels
- Recommend suitable exercises
- Adapt lesson pacing

This creates a **continuously adaptive learning path for each child**.

---

# 5. UI Design Guidelines

The interface follows **dyslexia-friendly design principles**.

---

## Typography

Use dyslexia-friendly fonts such as:

- OpenDyslexic
- Lexend

Typography rules:

- Large font sizes
- Increased letter spacing
- Clear readable characters
- Avoid decorative fonts

---

## Colors

Use **soft pastel color palettes**.

Examples:

- Light blue
- Soft green
- Warm yellow
- Gentle purple

Avoid:

- Pure white backgrounds
- Neon colors
- High visual clutter

Maintain **strong contrast between text and background**.

---

## Layout

Layouts should be:

- Clean
- Simple
- Minimal text per screen
- Large buttons
- Clear navigation

---

## Animations

Animations keep the interface engaging.

Examples include:

- Button hover animations
- Page transitions
- Reward celebrations
- Floating icons
- Progress animations

Animations should be **smooth and not distracting**.

---

# 6. Main Screens

## Loading Screen

Elements:

- App logo
- Animated loading indicator
- Pastel gradient background

---

## Dashboard

Displays navigation cards for:

- Reading Practice
- Speech Practice
- Learning Games
- Progress Tracker

Optional:

- Login / Signup buttons

---

## Reading Practice Screen

Displays:

- Words
- Sentences
- Stories

Features:

- Word highlighting
- Audio playback
- Large readable text

---

## Speech Practice Screen

Flow:

1. Play pronunciation audio
2. User records response
3. Speech recognition evaluates pronunciation
4. Feedback is displayed

---

## Learning Games Screen

Examples include:

- Word matching
- Phonics puzzles
- Vocabulary games
- Letter recognition

---

## Progress Tracker

Displays:

- Completed lessons
- Points earned
- Accuracy improvements
- Achievements

Visual elements include:

- Progress bars
- Charts
- Badges

---

# 7. Frontend Component Structure


src/

components/
Navbar.js
LogoLoader.js
AnimatedButton.js
ProgressCard.js
AudioPlayer.js
RecordingButton.js

pages/
Dashboard.js
ReadingPractice.js
SpeechPractice.js
LearningGames.js
ProgressTracker.js
Login.js
Signup.js

features/
speech/
SpeechRecorder.js
SpeechEvaluator.js

reading/
StoryReader.js
WordHighlighter.js

games/
WordMatchGame.js
PhonicsGame.js

services/
supabaseClient.js
speechService.js
mlService.js

styles/
colors.js
typography.js

App.js


---

# 8. Supabase Database Schema

## Users

| Column | Type | Description |
|------|------|-------------|
| id | uuid | Primary key |
| email | text | User email |
| name | text | User name |
| role | text | child / parent / teacher |
| created_at | timestamp | Account creation time |

---

## Reading_Content

| Column | Type | Description |
|------|------|-------------|
| id | uuid | Content ID |
| title | text | Story title |
| text | text | Story content |
| difficulty | integer | Level 1–5 |
| audio_url | text | Audio pronunciation |

---

## Speech_Practice

| Column | Type | Description |
|------|------|-------------|
| id | uuid | Prompt ID |
| sentence | text | Word or sentence |
| audio_url | text | Pronunciation audio |
| difficulty | integer | Difficulty level |

---

## Speech_Results

| Column | Type | Description |
|------|------|-------------|
| id | uuid | Result ID |
| user_id | uuid | User reference |
| practice_id | uuid | Speech prompt reference |
| pronunciation_score | float | Accuracy score |
| recording_url | text | Stored audio |
| created_at | timestamp | Attempt time |

---

## Progress

| Column | Type | Description |
|------|------|-------------|
| id | uuid | Record ID |
| user_id | uuid | User reference |
| reading_accuracy | float | Reading score |
| speech_accuracy | float | Speech score |
| lessons_completed | integer | Completed lessons |
| total_points | integer | Points |
| updated_at | timestamp | Last update |

---

## Achievements

| Column | Type | Description |
|------|------|-------------|
| id | uuid | Achievement ID |
| title | text | Reward name |
| description | text | Reward details |
| icon | text | Icon reference |

---

# 9. Speech Recognition API Flow

### Step 1 – Fetch Prompt


GET /speech-prompts


Response:


{
"sentence": "The cat sat on the mat",
"audio_url": "audio/cat_sentence.mp3"
}


---

### Step 2 – Play Audio

The **AudioPlayer component** plays the pronunciation.

---

### Step 3 – Record Child Response

The user presses the **record button**.

The microphone captures speech.

---

### Step 4 – Send Recording


POST /speech-evaluate


Payload:


{
"audio": "recording.wav",
"expected_text": "The cat sat on the mat"
}


---

### Step 5 – Speech Processing

Speech-to-Text converts audio to text.

Example result:


recognized_text: "The cat sat on mat"


---

### Step 6 – Pronunciation Evaluation

The system compares:


expected_text vs recognized_text


Example score:


Pronunciation Accuracy: 85%


---

### Step 7 – Store Result

Result is saved in the **Speech_Results table**.

---

### Step 8 – Display Feedback

Examples:

- ⭐ Excellent!
- 👍 Good job!
- 🔁 Try again!

---

# 10. Technology Stack

Frontend

React Native

Backend

Supabase

Programming Language

JavaScript

APIs

- Text-to-Speech
- Speech-to-Text

---

# 11. Future Improvements

Potential enhancements include:

- Mood-aware learning adjustments
- Teacher content creation tools
- Multiplayer educational games
- Offline learning mode
- AI tutoring assistance

---

# 12. UI Page Layout Specifications

---

## Loading Screen Layout

Top Section  
(empty space)

Center Section  
- App Logo  
- App Name  
- Animated loading spinner  

Bottom Section  
- Soft floating shapes animation  

---

## Dashboard Layout

Top Navigation Bar

- App Logo
- Title
- Login / Signup buttons

Main Content

Grid of 4 cards:

Row 1  
Reading Practice  
Speech Practice  

Row 2  
Learning Games  
Progress Tracker  

Cards include:

- Icon
- Title
- Hover animation

---

## Reading Practice Layout

Top

- Back button
- Title

Center

- Reading card
- Story text
- Word highlighting
- Audio button

Bottom

- Previous story
- Next story

---

## Speech Practice Layout

Top

- Back button
- Page title

Center

- Sentence prompt
- Play audio button
- Record button
- Waveform animation

Below

- Feedback
- Score

Bottom

- Retry
- Next prompt

---

## Learning Games Layout

Grid of game cards:

- Word Match
- Phonics Game
- Vocabulary Puzzle
- Letter Recognition

Cards include:

- Icon
- Title
- Difficulty

---

## Progress Tracker Layout

Top

- Page title

Center

Progress Overview Card

Displays:

- Total points
- Lessons completed
- Accuracy percentage

Below

Charts showing:

- Reading improvement
- Speech improvement

Bottom

Achievements grid

---

# 13. Animation Guidelines

Recommended animations:

Button hover scale: **1.05**

Page transitions: **fade + slide**

Reward animation: **star burst**

Recording animation: **pulsing microphone**

Loading animation: **smooth spinner**

---

# 14. Accessibility Considerations

To support children with dyslexia:

- Maintain high text contrast
- Avoid dense paragraphs
- Use large clickable elements
- Provide audio support
- Avoid flashing animations
- Use clear navigation

---
# TESAT Master — UI/UX Pro Max Design System (`MASTER.md`)

Generated using **UI/UX Pro Max (`nextlevelbuilder/ui-ux-pro-max-skill`)** & **Anthropic `frontend-design` (`anthropics/skills`)**.

## 1. Visual Direction & Domain Identity
- **Product Category**: Professional EdTech & National Economic Assessment Platform (`Hankyung TESAT`)
- **Primary Style**: Swiss Modernism 2.0 + Editorial Clarity (inspired by Toss, Hankyung Korea Economic Daily, and Linear)
- **Core UX Architecture**:
  1. **Calm Entry Lobby (`HOME_HUB`)**: Never drop the learner into an active countdown timer on page load. Present 4 focused workflow cards (Mock Exam 80Q, Topic Drills, Vocabulary by Topic, Error Log & Analytics).
  2. **Two-Step Mode Entry**: Selecting a mode opens a clean configuration/topic selection view (`MOCK_EXAM_LOBBY`, `TOPIC_DRILL_LOBBY`, `VOCAB_LOBBY`). The 100-minute timer only starts when the user explicitly clicks **"Bắt đầu làm bài"**.
  3. **Progressive Disclosure Workspace**: Keep the exam/drill viewport quiet. Vietnamese translations, 80-question OMR matrix, and 3-level AI hints are revealed progressively via clean segmented controls.

## 2. Color Token System (5 Named Hex Values)
| Token | Light Mode | Dark Mode | Role |
|-------|------------|-----------|------|
| `--surface-canvas` | `#F6F5F1` (Editorial Alabaster) | `#0B0F17` (Deep Obsidian) | Main page background reducing eye strain during 100m reading |
| `--surface-card` | `#FFFFFF` (Pure Paper) | `#111827` (Slate Surface) | Elevated question & mode cards with `1px` crisp border |
| `--ink-primary` | `#0F172A` (Hankyung Ink) | `#F8FAFC` (Crisp White) | Primary Korean & Vietnamese body text (Contrast > 12:1) |
| `--accent-primary` | `#1D4ED8` (Royal Cobalt) | `#3B82F6` (Signal Blue) | Primary interactive CTAs, active tabs, and progress indicators |
| `--semantic-correct` / `--semantic-danger` | `#047857` / `#BE123C` | `#10B981` / `#F43F5E` | Answer validation & negative syntactic trap warnings |

## 3. Strict UI/UX Pro Max Quality Rules Applied
- **Zero Emojis as UI Icons**: 100% vector SVG icons (`lucide-react`) with consistent `1.75px` stroke width and `aria-hidden="true"` on decorative icons.
- **Typography Scale**:
  - Korean Question Stem: `18px–20px` (`text-lg` / `text-xl`), `font-semibold`, `leading-relaxed`, `max-w-[68ch]`.
  - Korean Passage / Data Table: `15px` (`text-[15px]`), `leading-7`, high legibility tabular numerals (`tabular-nums`).
  - Vietnamese Support Text: `14px` (`text-sm`), clean muted slate tone so the two languages never compete visually.
- **Touch & Click Targets**: All option buttons, mode cards, and navigation controls maintain a minimum height of `44px` with stable bounds on press.

# Improve Quran reading, focus lock, Adhkar, and lessons

## Changes
- Replace revelation labels with the Islamic terms “Makki” and “Madani” throughout Quran reading.
- Add a persistent Quran bookmark: readers can save an ayah, see it on the surah list, and return directly to it.
- Replace blocked-app names on Today with recognizable app icons while keeping accessible labels.
- Repair the Adhkar counter, including reliable count updates, clear loading/error states, and undo behavior.
- Rework each lesson into a guided 5–7 minute experience with clear reading stages, richer explanation, reflection, and the existing quiz.

## Technical details
- Store the Quran bookmark locally per browser because Quran reading data comes from the external Quran feed and does not need account syncing yet.
- Use the existing icon library and semantic colors rather than external app artwork.
- Make Adhkar increments update safely from the latest saved count and prevent rapid taps from losing counts.
- Expand the current lesson presentation and lesson content without changing lesson order or completion rules.

## Validation
- Check Quran list and reader labels, bookmark save/restore, blocked-app icons, Adhkar increment/undo, and the complete lesson flow in the signed-in preview.
- Confirm desktop and narrow mobile layouts remain readable and no browser errors occur.

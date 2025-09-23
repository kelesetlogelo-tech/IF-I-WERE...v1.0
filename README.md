# If I Were... — Full Game with Guessing Phase (Firebase-ready)

This bundle implements the full guessing logic where:

- Host collects answers during quiz phase (assumed already saved by quiz flow).
- Host prepares a shuffled queue of answers and starts the guessing phase.
- Each guess item shows a question and an anonymous answer; players guess which player wrote it.
- Hosts compute scores per answer and advance through the queue.
- Final results are displayed once all answers are processed.

## Setup
1. Replace `firebaseConfig` in `script.js` with your Firebase project's config (if needed).
2. Ensure Realtime Database rules allow reads/writes during testing:
   {
     "rules": { ".read": true, ".write": true }
   }
3. Serve locally with `python -m http.server` or deploy to GitHub Pages.
4. Play: Host creates room, players join, host starts quiz, players answer, host prepares queue and clicks NEXT PHASE (in host controls), then host advances through guesses and computes scores.

Notes:
- This implementation expects quiz answers to be stored under `/rooms/ROOMCODE/answers/{player}/{qIndex}`.
- The host action `prepareGuessQueueAndStart()` creates `/rooms/ROOMCODE/guessQueue` and sets `phase` to `guessing`.
- Scoring logic increments a player's score by 1 for each correct guess they make.

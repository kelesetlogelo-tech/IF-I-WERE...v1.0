import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ✅ Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8O6Fh10MNQrdW6cBZnUibVFRB2q5cD1Q",
  authDomain: "if-i-were-c624c.firebaseapp.com",
  databaseURL: "https://if-i-were-c624c-default-rtdb.firebaseio.com",
  projectId: "if-i-were-c624c",
  storageBucket: "if-i-were-c624c.appspot.com",
  messagingSenderId: "21442086633",
  appId: "1:21442086633:web:e49f99337b3caaeaecd278"
};

let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (err) {
  console.warn("Firebase not initialized - paste your firebaseConfig in script.js");
}

// ✅ Question bank (clean + safe quotes)
const QUESTIONS = [
  { 
    text: "If I were a sound effect, I'd be ....", 
    options: [
      "The frantic hoot of a Siyaya (taxi)", 
      "Evil laugh!", 
      "A mix of Kwaito & Amapiano basslines from a shebeen", 
      "Ta-da!", 
      "Dramatic gasp", 
      "The hiss of a shaken carbonated drink"
    ] 
  },
  { 
    text: "If I were a weather-forecast, I'd be ....", 
    options: [
      "Partly dramatic with a chance of chaos", 
      "Sudden tornado of opinions", 
      "100% chill", 
      "Heatwave in Limpopo", 
      "The calm before the storm: I'm a quiet observer until I have had too much coffee!", 
      "Severe weather alert for a sudden unexplainable urge to reorganize my entire living space"
    ] 
  },
  { 
    text: "If I were a bedtime excuse, I'd be ....", 
    options: [
      "I need to find the remote", 
      "I can't sleep without Pillow", 
      "Trying to find my way out of this rabbit hole of YouTube videos", 
      "I need water", 
      "There's something in my closet", 
      "Just one more episode", 
      "There's a spider in my room"
    ] 
  },
  { 
    text: "If I were a breakfast cereal, I'd be ....", 
    options: [
      "Jungle Oats", 
      "Weetbix", 
      "The weird healthy one that keeps piling up in the pantry", 
      "Rice Krispies", 
      "Bokomo Cornflakes", 
      "MorVite"
    ] 
  },
  { 
    text: "If I were a villain in a movie, I'd be ....", 
    options: [
      "Thanos", 
      "Grinch", 
      "Scarlet Overkill", 
      "A mosquito in your room at night", 
      "Darth Vader", 
      "Doctor Doom", 
      "Emperor Palpatine"
    ] 
  },
  { 
    text: "If I were a kitchen appliance, I'd be ....", 
    options: [
      "A blender on high speed with no lid", 
      "A toaster that only pops when no one’s looking", 
      "A microwave that screams when it’s done", 
      "A fridge that judges your snack choices"
    ] 
  },
  { 
    text: "If I were a dance move, I'd be ....", 
    options: [
      "The sprinkler: I'm a little awkward, a little stiff and probably hitting the person next to me!", 
      "The moonwalk: I'm trying to move forward, but somehow end up where I started...", 
      "The I thought no one was watching move", 
      "The knee-pop followed by a regretful sit-down", 
      "The Macarena: I know I can do it, but I'm not quite sure why", 
      "That running to the bathroom shuffle: the desperate high-speed march with clenched-up posture and wild eyes"
    ] 
  },
  { 
    text: "If I were a text message, I'd be ....", 
    options: [
      "A typo-ridden voice-to-text disaster", 
      "A three-hour late LOL", 
      "A group chat gif spammer", 
      "A mysterious K. with no context"
    ] 
  },
  { 
    text: "If I were a warning label, I'd be ....", 
    options: [
      "Caution: May spontaneously break into song", 
      "Warning: Contains high levels of optimism and creative ideas, but only after caffeine", 
      "Contents may cause uncontrollable giggles", 
      "Warning: Do not operate on an empty stomach", 
      "Warning: Will talk your ear off about random facts", 
      "May contain traces of impulsive decisions", 
      "Caution: Do not interrupt during a new K-Pop music video release", 
      "Warning: Do not approach before first cup of coffee"
    ] 
  },
  { 
    text: "If I were a type of chair, I'd be ....", 
    options: [
      "That sofa at Phala Phala", 
      "A creaky antique that screams when you sit", 
      "One of those folding chairs that attack your fingers", 
      "The overstuffed armchair covered in snack crumbs", 
      "The velvet fainting couch - I'm a little dramatic... a lot extra actually!"
    ] 
  }
];

// TODO: Rest of game logic here (hostGame, joinRoom, etc.)

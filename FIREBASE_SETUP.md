# Firebase Setup Guide for Global Leaderboard

Your asteroid game now has a global leaderboard feature! To enable it, you need to set up a free Firebase Realtime Database.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "Personal-Website-Leaderboard")
4. You can disable Google Analytics (not needed for this project)
5. Click **"Create project"**

## Step 2: Set Up Realtime Database

1. In your Firebase project, click on **"Build"** in the left sidebar
2. Click **"Realtime Database"**
3. Click **"Create Database"**
4. Choose a location (choose one close to your users, e.g., Europe for Germany)
5. **IMPORTANT:** Start in **"test mode"** (we'll secure it in Step 4)
6. Click **"Enable"**

## Step 3: Get Your Firebase Configuration

1. In your Firebase project, click the **gear icon** (⚙️) next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. Give it a nickname (e.g., "Personal Website")
6. **DO NOT** check "Firebase Hosting" (not needed)
7. Click **"Register app"**
8. Copy the `firebaseConfig` object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxxxxxxxxxxxxx"
};
```

## Step 4: Update Your Code

1. Open `leaderboard.js` in your project
2. Find the `firebaseConfig` object at the top (lines 12-19)
3. **Replace it** with your Firebase config from Step 3
4. Save the file

## Step 5: Secure Your Database

**IMPORTANT:** By default, test mode allows anyone to read/write. Let's add proper security rules.

1. Go back to Firebase Console → Realtime Database
2. Click on the **"Rules"** tab
3. Replace the rules with this:

```json
{
  "rules": {
    "leaderboard": {
      ".read": true,
      ".write": true,
      ".indexOn": "score",
      "$entry": {
        ".validate": "newData.hasChildren(['name', 'icon', 'score', 'timestamp']) && newData.child('name').isString() && newData.child('name').val().length <= 15 && newData.child('icon').isString() && newData.child('score').isNumber() && newData.child('timestamp').isNumber()"
      }
    }
  }
}
```

4. Click **"Publish"**

### What these rules do:
- ✅ Anyone can **read** the leaderboard (so visitors can see it)
- ✅ Anyone can **write** to the leaderboard (to submit scores)
- ✅ **Validation** ensures only valid data is submitted:
  - Name must be a string, max 15 characters
  - Icon must be a string
  - Score must be a number
  - Timestamp must be a number

## Step 6: Test It!

1. Open your website in a browser
2. Play the asteroid game and achieve a top 3 score
3. You should see:
   - 🎉 Confetti animation
   - A modal asking for your name and icon
   - After submitting, your score appears in the global leaderboard

## Pricing (Free Tier)

Firebase Realtime Database is **FREE** for small projects:
- ✅ **1 GB** of stored data (plenty for a leaderboard with only 3 entries)
- ✅ **10 GB/month** of downloaded data
- ✅ **100 simultaneous connections**

For a personal website with a top 3 leaderboard, you will **never exceed the free tier**.

## Troubleshooting

### "Firebase not initialized"
- Check that you replaced the config in `leaderboard.js`
- Make sure the `databaseURL` is correct
- Open browser console (F12) to see error messages

### "Permission denied"
- Check your database rules (Step 5)
- Make sure `.read` and `.write` are set to `true` for the `leaderboard` path

### Leaderboard not showing
- Open browser console (F12) to check for errors
- Verify your database rules include `.indexOn: "score"`
- Check that the database URL ends with your region (e.g., `-europe-west1` or `-default`)

## How It Works

1. When a player finishes the game, the code checks if their score qualifies for top 3
2. If yes:
   - 🎊 Confetti animation plays
   - Modal appears to collect name + icon
   - Score is submitted to Firebase
   - Old scores beyond top 3 are automatically removed
3. If no:
   - Normal game over screen shows
   - Global leaderboard is displayed (read-only)

4. Players can also click **"VIEW GLOBAL LEADERBOARD"** button anytime to see rankings

## Security Note

Since this is a client-side implementation, technically someone could inspect the code and submit fake scores. For a personal website/game, this is usually fine. If you need more security:

1. Consider adding Firebase Authentication
2. Implement server-side score validation with Cloud Functions
3. Add rate limiting

But for a personal portfolio website, the current setup is perfect! 🚀

# Firebase Setup Guide

## 🔥 Firebase Console Setup

### 1. Firebase Storage Rules
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `mirrorsbeautylounge-7c5ff`
3. Navigate to **Storage** → **Rules**
4. Copy the rules from `firebase-storage-rules.txt` and paste them
5. Click **Publish**

### 2. Firestore Database Rules
1. In Firebase Console, navigate to **Firestore Database** → **Rules**
2. Copy the rules from `firebase-firestore-rules.txt` and paste them
3. Click **Publish**

### 3. Enable Required Services
Make sure these services are enabled in your Firebase project:
- ✅ **Firestore Database** (Native mode)
- ✅ **Storage**
- ✅ **Analytics** (optional)

## 🛠️ Local Development Setup

### 1. Environment Variables
The `.env.local` file has been created with your Firebase credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBYQA66rKOPrb4kce-hYCTYAbGKanVGbZ8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mirrorsbeautylounge-7c5ff.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mirrorsbeautylounge-7c5ff
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mirrorsbeautylounge-7c5ff.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1029530532506
NEXT_PUBLIC_FIREBASE_APP_ID=1:1029530532506:web:2fa18cc521b2524e5afd23
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-GMWQSDP9JW
```

### 2. Install Firebase Dependencies
```bash
npm install firebase
```

## 🔧 What's Been Fixed

### CORS Error Resolution:
1. **Safe File Names**: Removed special characters and spaces from uploaded file names
2. **Proper URL Handling**: Fixed image deletion by properly parsing Firebase Storage URLs
3. **Security Rules**: Created proper Firebase Storage and Firestore rules

### File Upload Improvements:
- Files are now saved with safe names: `category_[timestamp].[extension]`
- No more special characters or spaces in file paths
- Proper error handling for upload failures

## 📁 Project Structure
```
mirror-admin-panel/
├── src/
│   ├── lib/
│   │   ├── firebase.ts          # Firebase configuration
│   │   └── firebaseServices.ts  # Firebase service functions
│   └── app/
│       └── catagories/
│           └── page.tsx         # Categories page with Firebase integration
├── .env.local                   # Environment variables
├── firebase-storage-rules.txt   # Storage security rules
├── firebase-firestore-rules.txt # Firestore security rules
└── FIREBASE_SETUP.md           # This setup guide
```

## 🚀 Testing the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test the categories page**:
   - Navigate to `/catagories`
   - Try adding a new category with an image
   - Edit existing categories
   - Delete categories

3. **Check Firebase Console**:
   - Go to Firestore Database to see your data
   - Go to Storage to see uploaded images

## 🔒 Security Notes

- **Development Rules**: Current rules allow all read/write access for development
- **Production Rules**: Use the commented production rules when deploying
- **Authentication**: Consider adding Firebase Auth for production use

## 🐛 Troubleshooting

### If you still get CORS errors:
1. Make sure you've applied the Storage rules in Firebase Console
2. Wait 1-2 minutes for rules to propagate
3. Clear your browser cache
4. Restart your development server

### If images don't upload:
1. Check that Storage is enabled in Firebase Console
2. Verify your Storage bucket name matches the one in `.env.local`
3. Check browser console for detailed error messages

### If data doesn't save:
1. Make sure Firestore Database is enabled
2. Check that you've applied the Firestore rules
3. Verify your project ID in `.env.local`

## 📞 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify all Firebase services are enabled
3. Make sure the security rules are properly applied
4. Restart your development server after making changes
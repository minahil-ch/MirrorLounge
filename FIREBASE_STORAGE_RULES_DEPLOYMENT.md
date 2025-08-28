# Firebase Storage Rules Deployment Guide

This guide will help you fix the mobile app's image upload authorization errors by properly configuring Firebase Storage Rules.

## Overview

The mobile app is experiencing `[firebase_storage/unauthorized] User is not authorized to perform the desired action` errors when:
- Uploading profile pictures in the Profile section
- Sending images in the Chat section

These errors occur because Firebase Storage Rules are not properly configured for the paths used by the mobile app.

## Storage Paths Used by Mobile App

The mobile app uses these specific storage paths:

### Profile Pictures
- **Path**: `profile_pictures/{userId}.jpg`
- **Usage**: User profile picture uploads and updates
- **File**: `lib/services/profile_picture_service.dart`
- **Operations**: Upload, delete, and retrieve profile pictures

### Chat Images
- **Path**: `chat_images/{userId}/{fileName}`
- **Usage**: Image sharing in chat conversations
- **File**: `lib/services/chat_service.dart`
- **Operations**: Upload and retrieve chat images

## Step-by-Step Deployment Instructions

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click on the **Rules** tab

### Step 2: Update Storage Rules

1. In the Rules editor, replace the existing rules with the following:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read/write access to categories folder
    match /categories/{allPaths=**} {
      allow read, write: if true;
    }
    
    // Allow read/write access to services folder
    match /services/{allPaths=**} {
      allow read, write: if true;
    }
    
    // Allow read/write access to branches folder
    match /branches/{allPaths=**} {
      allow read, write: if true;
    }
    
    // Allow read/write access to offers folder
    match /offers/{allPaths=**} {
      allow read, write: if true;
    }
    
    // Allow read/write access to chat images folder
    match /chat_images/{allPaths=**} {
      allow read, write: if true;
    }
    
    // Allow read/write access to profile pictures folder
    match /profile_pictures/{allPaths=**} {
      allow read, write: if true;
    }
    
    // Allow read/write access to user uploads folder
    match /user_uploads/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

2. Click **Publish** to deploy the rules

### Step 3: Verify Deployment

1. Wait for the "Rules published successfully" message
2. The rules should now be active within a few seconds

## Testing Instructions

### Test Profile Picture Upload

1. Open the mobile app
2. Navigate to the Profile section
3. Tap on the profile picture area
4. Select an image from your device
5. Verify the upload completes without errors

### Test Chat Image Sharing

1. Open the mobile app
2. Navigate to any chat conversation
3. Tap the image/attachment button
4. Select an image to share
5. Verify the image uploads and appears in the chat

## Troubleshooting Common Issues

### Issue: Still getting authorization errors after deployment

**Solutions:**
1. **Wait for propagation**: Rules can take up to 5 minutes to propagate globally
2. **Clear app cache**: Force close and restart the mobile app
3. **Check user authentication**: Ensure the user is properly signed in to Firebase Auth
4. **Verify project**: Confirm you're updating rules for the correct Firebase project

### Issue: Rules not saving or publishing

**Solutions:**
1. **Check syntax**: Ensure the rules syntax is correct (no missing brackets or semicolons)
2. **Browser issues**: Try using a different browser or incognito mode
3. **Permissions**: Verify you have Editor or Owner permissions on the Firebase project

### Issue: Some paths still not working

**Solutions:**
1. **Check file paths**: Verify the mobile app is using the exact paths defined in the rules
2. **Case sensitivity**: Ensure path casing matches exactly
3. **Add debugging**: Temporarily add broader rules to isolate the issue

## Security Considerations for Production

### Current Rules (Development)
The current rules use `if true` which allows unrestricted access. This is suitable for development but **NOT recommended for production**.

### Recommended Production Rules

For production deployment, consider implementing these more secure rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures - only authenticated users can upload their own
    match /profile_pictures/{userId}.jpg {
      allow read: if true; // Public read access
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Chat images - only authenticated users can upload
    match /chat_images/{userId}/{fileName} {
      allow read: if request.auth != null; // Authenticated read access
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Other folders - authenticated access only
    match /categories/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /services/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /branches/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /offers/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Security Best Practices

1. **Authentication Required**: Always require authentication for write operations
2. **User Isolation**: Ensure users can only modify their own files
3. **File Size Limits**: Implement file size restrictions
4. **File Type Validation**: Validate file types and extensions
5. **Rate Limiting**: Consider implementing upload rate limits

## Quick Fix Summary

1. Go to Firebase Console → Storage → Rules
2. Replace rules with the provided development rules
3. Click Publish
4. Test profile picture and chat image uploads
5. Consider implementing production rules before going live

## Support

If you continue experiencing issues after following this guide:
1. Check the Firebase Console logs for detailed error messages
2. Verify the mobile app's Firebase configuration
3. Ensure the correct Firebase project is being used
4. Review the mobile app's authentication implementation

---

**Note**: The rules provided in this guide use permissive access (`if true`) for development purposes. Always implement proper authentication and authorization rules before deploying to production.
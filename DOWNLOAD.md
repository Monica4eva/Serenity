# Getting Project Serenity onto phones without the app stores

There are two parts:

1. **The web app**: the whole app running in the browser. On iPhone people add it to the home screen from Safari; on Android they can install it from Chrome. No App Store or Play Store.
2. **The download page** at `/download`: one link to share with everyone. It shows the right steps for Android or iPhone, has the Android APK button, and a QR code for people on a computer.

Both are published together, free, with **EAS Hosting** (part of your Expo account).

## Publish (first time)

In the VS Code terminal, inside the `serenity` folder:

```
npm install
npx expo export -p web
eas deploy --prod
```

- `npx expo export -p web` builds the web app into the `dist` folder (it uses your `.env`, so Supabase works).
- The first `eas deploy` asks you to choose a web address, for example `project-serenity`. Your app is then at
  `https://project-serenity.expo.app` and the download page at `https://project-serenity.expo.app/download/`.
- If you are not signed in to Expo in this terminal, set your token first (see SECURITY.md): `$env:EXPO_TOKEN = "..."`.

**Share this link with your team and users:** `https://YOUR-NAME.expo.app/download/`

## Update after changes

```
npx expo export -p web
eas deploy --prod
```

Or in one go: `npm run web:deploy`.

## Set the download links

Open `public/download/index.html` and change the two lines near the bottom:

```
var ANDROID_APK_URL = '...';   // the install link of your newest APK build on expo.dev
var TESTFLIGHT_URL = '';       // your TestFlight public link, once you have an Apple Developer account
```

To get the Android link: run `eas build -p android --profile preview`, open the build on expo.dev, and copy its **Install** link.
Then publish again (the two update commands above).

## Supabase sign-in on the web

Add your web address to Supabase: **Authentication → URL Configuration → Redirect URLs**:

```
https://YOUR-NAME.expo.app/**
```

## What works differently in the web app

| | Android app (APK) | Web app (iPhone and Android) |
| --- | --- | --- |
| Installs from | Download link | Safari "Add to Home Screen" / Chrome "Install app" |
| Works offline | Yes | Yes, after the first visit |
| Data on the phone | Encrypted, key in the phone's secure store | Stored in the browser (not encrypted on the device) |
| Fingerprint / Face ID lock | Yes | No (PIN lock only) |
| Voice notes | Yes | Yes in most browsers (Safari asks for the microphone) |
| Reminders and notifications | Coming | Limited on iPhone |
| Online backup with Supabase | Yes | Yes |

Because the web app keeps data in the browser, the download page tells people not to use it on a shared or public computer.
For the strongest privacy on iPhone, the long-term route is TestFlight and then the App Store (Apple Developer account, USD 99 a year).

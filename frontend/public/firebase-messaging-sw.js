importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCcSYdmRC0LGFZpNZUMZQeLbT3pr_Lylr4",
  authDomain: "kaamhub-9ca56.firebaseapp.com",
  projectId: "kaamhub-9ca56",
  storageBucket: "kaamhub-9ca56.firebasestorage.app",
  messagingSenderId: "544046430387",
  appId: "1:544046430387:web:c1258ebc9b9c1bbfb298c6",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo192.png"
  });
});

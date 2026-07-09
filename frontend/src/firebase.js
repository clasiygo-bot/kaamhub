import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCcSYdmRC0LGFZpNZUMZQeLbT3pr_Lylr4",
  authDomain: "kaamhub-9ca56.firebaseapp.com",
  projectId: "kaamhub-9ca56",
  storageBucket: "kaamhub-9ca56.firebasestorage.app",
  messagingSenderId: "544046430387",
  appId: "1:544046430387:web:c1258ebc9b9c1bbfb298c6",
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);
export default app;

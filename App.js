import axios from "axios";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useState, useEffect, useRef } from "react";
import { Text, View, Button, Platform } from "react-native";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#67C8E6", fontWeight: "bold" }}>
        YOUR FAVORITE NOTIFICATIONS
      </Text>
      <Text>{notification && notification.request.content.body}</Text>
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }

    try {
      const projectId =
        Constants.expoConfig.extra && Constants.expoConfig.extra.eas
          ? Constants.expoConfig.extra.eas.projectId
          : null;

      if (!projectId) {
        console.error(
          "Project ID is undefined. Make sure your configuration is correct."
        );
        return;
      }

      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      token = expoPushToken.data;
      console.log(token);
    } catch (error) {
      console.error("Error getting Expo push token:", error);
    }

    const res = await axios.post(
      "https://expo-notifications.vercel.app/savetoken",
      { token }
    );

    console.log(res.data);
  } else {
    alert("Must use a physical device for Push Notifications");
  }

  return token;
}

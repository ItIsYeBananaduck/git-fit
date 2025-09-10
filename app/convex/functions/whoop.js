import { defineMutation, defineQuery } from "convex/server";
import fetch from "node-fetch";

export const exchangeWhoopCode = defineMutation(async (_, { code }) => {
  const response = await fetch("https://api.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.VITE_WHOOP_CLIENT_ID,
      client_secret: process.env.VITE_WHOOP_CLIENT_SECRET,
      redirect_uri: process.env.VITE_WHOOP_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for token");
  }

  return await response.json();
});

export const getWhoopData = defineQuery(async (_, { accessToken }) => {
  const response = await fetch("https://api.whoop.com/v1/user/profile", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Whoop data");
  }

  return await response.json();
});

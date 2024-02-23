import { HubHttpUrlOptions } from "frames.js"

export const APP_BASE_URL = process.env["NEXT_PUBLIC_HOST"] || "http://localhost:3000"

// See https://neynar.com/
const NEYNAR_HUB_OPTIONS = {
  hubHttpUrl: "https://hub-api.neynar.com",
  hubRequestOptions: {
    headers: {
      api_key: process.env.NEYNAR_API_KEY || "",
    },
  },
} satisfies HubHttpUrlOptions

// See https://www.pinata.cloud/farcaster
const PINATA_HUB_OPTIONS = {
  hubHttpUrl: "https://hub.pinata.cloud",
  hubRequestOptions: {
    headers: {
      "Accept-Encoding": "zlib",
    },
  },
} satisfies HubHttpUrlOptions

/** WARNING: This is a mock hub for development purposes only that does not verify signatures */
const DEBUG_HUB_OPTIONS = {
  hubHttpUrl: "http://localhost:3000/debug/hub",
  hubRequestOptions: {
    headers: {},
  },
} satisfies HubHttpUrlOptions

export const FALLBACK_HUB_OPTIONS = PINATA_HUB_OPTIONS
// export const FALLBACK_HUB_OPTIONS = NEYNAR_HUB_OPTIONS

export const HUB_OPTIONS = process.env.NODE_ENV === "development" ? DEBUG_HUB_OPTIONS : FALLBACK_HUB_OPTIONS

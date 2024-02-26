"use client"

import { GithubCorner } from "./components/GithubCorner"
import { APP_BASE_URL } from "./constants"
import { useState } from "react"

// Defaulting to our example listing for the tutorial
// TODO: Replace with the definitive tutorial gift listing
const DEFAULT_LISTING_ID = "bb736890-cba9-4c91-a580-8221965394e9"
// const DEFAULT_LISTING_ID = "a414b244-9174-4ab5-9ac5-f366b9d48307"


export default function Home() {
  const [listingId, setListingId] = useState(DEFAULT_LISTING_ID)

  const handleSubmit = (e: any) => {
    e.preventDefault()
    window.location.href = `${APP_BASE_URL}/listing/${listingId}`
  }

  // use tailwind class for styling elements
  return (
    <div className="bg-violet-900 flex items-center justify-center h-screen w-screen">
      <div style={{ maxWidth: "700px" }}>
        <GithubCorner repository="Consensys/phosphor-frame-tutorial" />
        <h1 className="text-3xl mb-4 font-bold text-slate-100">
          Phosphor x Farcaster Frames Example
        </h1>
        <form className="bg-violet-950 shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label
              htmlFor="listing_id"
              className="block text-slate-200 text-sm font-bold mb-2"
            >
              Enter the listing identifier:
            </label>
            <input
              type="text"
              id="listing_id"
              placeholder="UUID"
              className="bg-slate-200 shadow appearance-none border rounded w-full py-2 px-3 text-slate-800 leading-tight focus:outline-none focus:shadow-outline placeholder:text-slate-400"
              required
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-sky-400 hover:bg-sky-300 text-black font-bold py-1 px-9 rounded focus:outline-none focus:shadow-outline"
              style={{ marginLeft: "auto" }}
            >
              Open
            </button>
          </div>
        </form>
        <div className="text-center text-slate-200">
          <p>
            Learn more about{" "}
            <a
              href="https://phosphor.xyz/developer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-200 underline"
            >
              Phosphor
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

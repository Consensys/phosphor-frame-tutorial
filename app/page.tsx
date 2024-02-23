"use client"

import { APP_BASE_URL } from "./constants"
import { useState } from "react"

export default function Home() {
  const [listingId, setListingId] = useState("")

  const handleSubmit = (e: any) => {
    e.preventDefault()
    window.location.href = `${APP_BASE_URL}/${listingId}`
  }

  // use tailwind class for styling elements
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">
        Phosphor x Farcaster Frames example
      </h1>
      <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label
            htmlFor="listing_id"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Enter the listing identifier:
          </label>
          <input
            type="text"
            id="listing_id"
            placeholder="listing UUID"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Open
        </button>
      </form>
    </div>
  )
}

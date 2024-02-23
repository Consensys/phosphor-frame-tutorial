import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameReducer,
  NextServerPageProps,
  getPreviousFrame,
  useFramesReducer,
  getFrameMessage,
} from "frames.js/next/server"
import Link from "next/link"
import { APP_BASE_URL, HUB_OPTIONS } from "../../constants"

const PHOSPHOR_API_BASE_URL = "https://public-api.phosphor.xyz/v1"
const PHOSPHOR_PAYMENT_PROVIDER = "BETA_FREE_MINT" // TODO: This will change to ORGANIZATION before publishing when a new listing is created

// This is how frames.js helps you handle state across frames.
// However, for this example we are not using it.
type State = {}
const initialState: State = {}
const reducer: FrameReducer<State> = (state, action) => {
  const buttonIndex = action.postBody?.untrustedData.buttonIndex
  return {
    ...state,
  }
}

// This is a React server component only
export default async function Home({
  params,
  searchParams,
}: NextServerPageProps) {
  // Step 1: Get the frame message and validate it
  const previousFrame = getPreviousFrame<State>(searchParams)
  let listingId = params.slug
  const [state] = useFramesReducer<State>(reducer, initialState, previousFrame)

  // Remember, the first frame in frameMessage is undefined.
  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    ...HUB_OPTIONS,
  })
  console.log({ frameMessage })

  // Check the frame payload for validity
  if (frameMessage && !frameMessage.isValid) {
    throw new Error("Invalid frame payload")
  }

  // Step 2: Get the user address
  // We are simply using the first verified address, if available,
  // and defaulting to the custody address.
  // The custody address is reliably accessible, but the verified
  // address is more user-friendly.
  //
  // At the first frame, frameMessage is undefined, so userAddress will be undefined too.
  const userAddress: string | undefined =
    frameMessage?.requesterVerifiedAddresses?.[0] ||
    frameMessage?.requesterCustodyAddress

  // Step 3: Get the listing data and validate it
  // API doc: https://docs.phosphor.xyz/latest-public-api#/paths/~1v1~1listings~1%7Blisting_id%7D/get
  // Learn more on listings: https://docs.phosphor.xyz/platform-features/digital-asset-distribution/listings/
  const listing = await requestPhosphorApi(`/listings/${listingId}`)

  let errorMessage = await validateListing(listing, userAddress)

  // Step 4: Add other checks
  // Check if the user has liked the cast.
  if (!errorMessage && frameMessage?.likedCast === false) {
    errorMessage = "Mmmh... maybe if you like it first? Try again"
  }

  // Step 5: Create a purchase intent
  if (!errorMessage && userAddress) {
    // API doc: https://docs.phosphor.xyz/latest-public-api#/paths/~1v1~1purchase-intents/post
    // Learn more on purchase intents: https://docs.phosphor.xyz/platform-features/digital-asset-distribution/listings/purchase-intents
    const purchaseIntent = await requestPhosphorApi("/purchase-intents", {
      method: "POST",
      body: JSON.stringify({
        provider: PHOSPHOR_PAYMENT_PROVIDER,
        listing_id: listing.id,
        quantity: 1,
        buyer: { eth_address: userAddress },
      }),
    })

    if (purchaseIntent.error) {
      console.error({ purchaseIntent })
      errorMessage = "There was an error minting this item"
    } else {
      console.log({ purchaseIntent })
      errorMessage =
        "Your item has been minted successfully. It could take up a few minutes to arrive..."
    }
  }

  // Step 6: Get the item data
  const { imageUrl, title, collectionName } = await getItemData(listing)

  // Step 7: Render the frame
  const listingUrl = `/listing/${listingId}`
  return (
    <div>
      <FrameContainer
        pathname={`${listingUrl}`}
        postUrl={`${listingUrl}/frames`}
        state={state}
        previousFrame={previousFrame}
      >
        <FrameImage src={imageUrl} />
        <FrameButton>
          {errorMessage ||
            `Like cast to mint "${title}" from ${collectionName}
            (${listing.quantity_remaining} / ${listing.quantity_listed})`}
        </FrameButton>
      </FrameContainer>
      <b>Mint with Phosphor example</b>
      <p>
        You can check this page on the{" "}
        <Link href={`/debug?url=${APP_BASE_URL}${listingUrl}`}>
          frames.js debugger
        </Link>
        {!APP_BASE_URL.includes("localhost") && (
          <>
            {" "}
            or on the{" "}
            <a
              href={`https://warpcast.com/~/developers/frames?url=${APP_BASE_URL}${listingUrl}`}
            >
              Warpcast Frame validator
            </a>
            , or share the URL on Farcaster!
          </>
        )}
      </p>
    </div>
  )
}

// Retrieves item data from the Phosphor API based on the provided listing
async function getItemData(listing: any) {
  if (!listing || listing.error) {
    return {}
  }

  // API doc: https://docs.phosphor.xyz/latest-public-api#/paths/~1v1~1items/get
  // Learn more on items: https://docs.phosphor.xyz/platform-features/digital-asset-creation/items
  const item = await requestPhosphorApi(`/items/${listing.item_id}`)

  // API doc: https://docs.phosphor.xyz/latest-public-api#/paths/~1v1~1collections/get
  // Learn more on collections: https://docs.phosphor.xyz/platform-features/digital-asset-creation/collections
  const collection = await requestPhosphorApi(
    `/collections/${item.collection_id}`
  )

  let imageUrl = item.media.image.full
  if (!imageUrl) {
    imageUrl = collection.media.thumbnail_image_url
  }
  const title = item.attributes.title
  const collectionName = collection.name

  return { imageUrl, title, collectionName }
}

async function validateListing(listing: any, address: any) {
  if (!listing || listing.error) {
    return "Listing not found"
  }
  if (!listing.payment_providers.includes(PHOSPHOR_PAYMENT_PROVIDER)) {
    return "Invalid listing"
  }
  if (listing.quantity_remaining === 0) {
    return "No more items remaining"
  }
  if (listing.end_time && new Date(listing.end_time) < new Date()) {
    return "Listing has ended"
  }
  if (address) {
    // API doc: https://docs.phosphor.xyz/latest-public-api#/paths/~1v1~1listings~1redemption-eligibility/get
    // Learn more on listing policies: https://docs.phosphor.xyz/platform-features/digital-asset-distribution/listings/listing-policy
    const eligibility = await requestPhosphorApi(
      `/listings/redemption-eligibility?listing_id=${listing.id}&eth_address=${address}`
    )
    if (!eligibility?.is_eligible) {
      if (eligibility?.quantity_claimed === eligibility?.quantity_allowed) {
        return "You have already minted this item"
      }
      return "You are not eligible to mint this item"
    }
  }
}

async function requestPhosphorApi(url: string, init: RequestInit = {}) {
  return await fetchJson(`${PHOSPHOR_API_BASE_URL}${url}`, init)
}

async function fetchJson(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set("Content-Type", "application/json")
  init.headers = headers

  console.log(init.method || "GET", url, init.body)
  const response = await fetch(url, init)
  const text = await response.text()
  try {
    const parsed = JSON.parse(text)
    console.log(parsed)
    return parsed
  } catch (e: any) {
    console.error(`fetchJson error ${text}`, e)
    throw e
  }
}

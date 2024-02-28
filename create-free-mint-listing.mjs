
const PHOSPHOR_API_KEY = process.env.PHOSPHOR_API_KEY // Get your API key from https://www.phosphor.xyz/developer
const PHOSPHOR_ADMIN_API_BASE_URL = "https://admin-api.phosphor.xyz/v1"
const NETWORK_ID = 59144 // Linea
// const NETWORK_ID = 59140 // Linea Testnet
const NFT_CONTRACT_SYMBOL = "POGS"
const COLLECTION_NAME = "Phosphor OGs Hall of Fame"
const COLLECTION_DESCRIPTION = "This collection celebrates the pioneers and early adopters of the Phosphor community. Each token stands as a digital homage to the individuals who were early in learning and using Phosphor's offerings."
const COLLECTION_IMAGE_URL = "https://phosphor-frame-tutorial.vercel.app/PhosphorOGsHallOfFame.jpeg"
const ITEM_TITLE = "Phosphor API x Frames OG Reader"
const ITEM_DESCRIPTION = "OG Reader of the Phosphor API x Farcaster Frames Tutorial."
const ITEM_IMAGE_URL = "https://phosphor-frame-tutorial.vercel.app/PhosphorPlusFrames.png"
const ITEM_ATTRIBUTES = {
    "repository_url": "https://github.com/Consensys/phosphor-frame-tutorial",
}
const QUANTITY_LISTED = 100
const MAX_PER_USER = 1

/* Create a collection and deploy contract */
// API doc: https://docs.phosphor.xyz/latest-admin-api#tag/Collection/paths/~1v1~1collections/post
// Learn more on collections: https://docs.phosphor.xyz/platform-features/digital-asset-creation/collections
// Learn more on configuring a collection contract: https://docs.phosphor.xyz/platform-features/digital-asset-creation/collections/collection-contract
const collection = await postPhosphorAdminApi("/collections", {
    "name": COLLECTION_NAME,
    "description": COLLECTION_DESCRIPTION,
    "image_url": COLLECTION_IMAGE_URL,
    "deployment_request": {
        "network_id": NETWORK_ID,
        "type": "PLATFORM",  // Learn more on platform contracts: https://docs.phosphor.xyz/platform-features/digital-asset-creation/collections/collection-contract/platform-contract
        "platform": {
            "variant": "FlexibleERC1155",
            "symbol": NFT_CONTRACT_SYMBOL,
        }
    }
})

/* Wait for contract deployment */
while (true) {
    // API doc: https://docs.phosphor.xyz/latest-admin-api#tag/Collection/paths/~1v1~1collections~1%7Bcollection_id%7D~1deployment-request/get
    const deploymentRequest = await requestPhosphorAdminApi(`/collections/${collection.id}/deployment-request`)
    if (deploymentRequest.status === "SUCCESS") {
        break
    }
    if (deploymentRequest.status === "FAILED") {
        // API doc: https://docs.phosphor.xyz/latest-admin-api#tag/Transaction/paths/~1v1~1transactions/get
        const transaction = await requestPhosphorAdminApi(`/transactions/${deploymentRequest.transaction_id}`)
        process.exit(1)
    }

    await new Promise(resolve => setTimeout(resolve, 5000))
}

/* Create item */
// API doc: https://docs.phosphor.xyz/latest-admin-api#tag/Item/paths/~1v1~1items/post
// Learn more on items: https://docs.phosphor.xyz/platform-features/digital-asset-creation/items
const item = await postPhosphorAdminApi("/items", {
    "collection_id": collection.id,
    "attributes": {
        "title": ITEM_TITLE,
        "description": ITEM_DESCRIPTION,
        "image_url": ITEM_IMAGE_URL,
        ...ITEM_ATTRIBUTES
    }
})

/* Lock items */
// API doc: https://docs.phosphor.xyz/latest-admin-api#tag/Item/paths/~1v1~1items~1lock/post
// Learn more on locking items: https://docs.phosphor.xyz/platform-features/digital-asset-creation/items/locking
const lock = await postPhosphorAdminApi("/items/lock", {
    "collection_id": collection.id
})

/* Create listing */
// API doc: https://docs.phosphor.xyz/latest-admin-api#tag/Listing/paths/~1v1~1listings/post
// Learn more on listings: https://docs.phosphor.xyz/platform-features/digital-asset-distribution/listings/
const listing = await postPhosphorAdminApi("/listings", {
    "item_id": item.id,
    "quantity_listed": QUANTITY_LISTED,
    "price": "0",
    "currency": "ETH",
    "payment_providers": [
        "ORGANIZATION"
    ],
    "max_quantity_per_tx": 1,
    "policy": {
        "max_per_user": MAX_PER_USER,
    }
})

/* Done! */
console.log("\nListing ID:", listing.id)


async function postPhosphorAdminApi(url, body) {
    return await requestPhosphorAdminApi(url, {
        method: "POST",
        body: JSON.stringify(body)
    })
}

async function requestPhosphorAdminApi(url, init = {}) {
    return await fetchJson(`${PHOSPHOR_ADMIN_API_BASE_URL}${url}`, init)
}

async function fetchJson(url, init = {}) {
    const headers = new Headers(init.headers)
    headers.set("Content-Type", "application/json")
    headers.set("Phosphor-Api-Key", PHOSPHOR_API_KEY)
    init.headers = headers

    console.log()
    console.log(init.method || "GET", url, init.body)

    const response = await fetch(url, init)
    if (response.status >= 400) {
        console.error(`Error: ${response.status} ${response.statusText}`)
        console.error(await response.text())
        process.exit(1)
    }
    const text = await response.text()
    try {
        const parsed = JSON.parse(text)
        console.log('RESPONSE', parsed)
        return parsed
    } catch (e) {
        console.error(`Error: ${text}`, e)
        throw e
    }
}

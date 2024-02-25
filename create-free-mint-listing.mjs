
const PHOSPHOR_API_KEY = process.env.PHOSPHOR_API_KEY // Get your API key from https://www.phosphor.xyz/developer
const ADMIN_API_BASE_URL = "https://admin-api.dev.phosphor.xyz/v1"
// const NETWORK_ID = 59144 // Linea // TODO: confirm
// const NETWORK_ID = 59140 // Linea Testnet
const NETWORK_ID = 80001 // Polygon Testnet
const NFT_CONTRACT_SYMBOL = "PHxFF"
const COLLECTION_NAME = "Phosphor x Frames Tutorial 2"
const COLLECTION_DESCRIPTION = ""
const ITEM_TITLE = "Phosphor API x Farcaster Frames Tutorial Memento"
const ITEM_DESCRIPTION = ""
// TODO: replace with new image
const ITEM_URL = "https://nftprodstorage.blob.core.windows.net/public/QmWJVNmDjj32PPvWyBNRrvT4MEhbEpX1vzsoctteRRcnsq/phosphor-nft-badge-1.png"
const QUANTITY_LISTED = 100 // TODO: confirm
const MAX_PER_USER = 1

// TODO: remove
let id = 0

/* Create a collection and deploy contract */
// API doc: https://docs.phosphor.xyz/latest-admin-api#tag/Collection/paths/~1v1~1collections/post
// Learn more on collections: https://docs.phosphor.xyz/platform-features/digital-asset-creation/collections
// Learn more on configuring a collection contract: https://docs.phosphor.xyz/platform-features/digital-asset-creation/collections/collection-contract
const collection = await postPhosphorAdminApi("/collections", {
    "name": COLLECTION_NAME,
    "description": COLLECTION_DESCRIPTION,
    "image_url": "https://nftprodstorage.blob.core.windows.net/public/Qma6CMuBBrfxpwfadSDhJS2nGinZWrFjseJRSs5Rqm59nE/phosphor-collection-logo-2.png",
    "deployment_request": {
        "network_id": NETWORK_ID,
        "type": "PLATFORM",  // Learn more on platform contracts: https://docs.phosphor.xyz/platform-features/digital-asset-creation/collections/collection-contract/platform-contract
        "platform": {
            "variant": "FlexibleERC1155",
            "symbol": NFT_CONTRACT_SYMBOL,
        }
    }
})

// TODO: remove
// const collection = {
//     "id": "8f8b2e93-3c79-4290-a49e-121d9a558f08",
//     "deployment": {
//         "transaction_id": 'cad8f6e8-5ed9-46c2-8d4d-87c86707fea0'
//     }
// }

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
        "image_url": ITEM_URL
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
    "collection_id": collection.id,
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
    return await fetchJson(`${ADMIN_API_BASE_URL}${url}`, init)
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

// TODO: remove
// async function fetch(url) {
//     return {
//         status: 200,
//         text: async () => JSON.stringify({ url, id: ++id })
//     }
// }
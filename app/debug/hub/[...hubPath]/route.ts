import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { sortedSearchParamsString } from "../../lib/utils";
import { FALLBACK_HUB_OPTIONS } from "../../../constants";

function getHubRequest(request: NextRequest, hubPath: string[]) {
  const { url, headers: originalHeaders, ...rest } = request;

  const fallbackHubUrl = new URL(FALLBACK_HUB_OPTIONS.hubHttpUrl);
  const newUrl = new URL(url);
  newUrl.protocol = "https";
  newUrl.hostname = fallbackHubUrl.hostname;
  newUrl.port = "443";
  newUrl.pathname = hubPath.join("/");

  const headers = new Headers({
    ...FALLBACK_HUB_OPTIONS.hubRequestOptions?.headers,
    ...originalHeaders,
  });
  headers.delete("host");
  headers.delete("referer");

  const hubRequest = new Request(newUrl, {
    headers,
    ...rest,
  });

  return hubRequest;
}

export async function GET(
  request: NextRequest,
  { params: { hubPath } }: { params: { hubPath: string[] } }
) {
  // Check if the request needs to be mocked
  // Open json config file
  // Check if the request is in the json file
  // If it is, return the response from the json file
  // If it is not, forward the request to the real hub

  try {
    // Only available in local development
    const file = path.join(process.cwd(), "app", "debug", "mocks.json");
    const json = fs.readFileSync(file, "utf-8");
    const mocks = JSON.parse(json);
    const searchParams = new URL(request.url).searchParams;
    const pathAndQuery = `/${hubPath.join("/")}?${sortedSearchParamsString(searchParams)}`;

    const mockResult: { ok: boolean | undefined } = mocks[pathAndQuery];
    if (mockResult.ok !== undefined) {
      console.log(
        `info: Mock hub: Found mock for ${pathAndQuery}, returning ${mockResult.ok ? "200" : "404"}`
      );
      return new Response(JSON.stringify(mocks[pathAndQuery]), {
        headers: {
          "content-type": "application/json",
        },
        status: mockResult.ok ? 200 : 404,
      });
    }
  } catch (error) {}

  console.warn(
    `info: Mock hub: Forwarding message ${hubPath.join("/")} to a real hub`
  );

  const hubRequest = getHubRequest(request, hubPath);
  const response = await fetch(hubRequest);
  const text = await response.clone().text();
  console.log({hubPath, response: text})
  return response;
}

export async function POST(
  request: NextRequest,
  { params: { hubPath } }: { params: { hubPath: string[] } }
) {
  console.warn(
    `info: Mock hub: Forwarding message ${hubPath.join("/")} to a real hub`
  );

  const hubRequest = getHubRequest(request, hubPath);
  const response = await fetch(hubRequest);
  return response;
}

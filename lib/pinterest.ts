import { getRequiredEnv } from "@/lib/env";

const PINTEREST_API_BASE_URL = "https://api.pinterest.com/v5";

type PinterestApiListResponse<T> = {
  items?: T[];
  bookmark?: string;
};

type PinterestApiErrorPayload = {
  message?: string;
  code?: number | string;
  errors?: Array<{ message?: string }>;
};

export type PinterestBoard = {
  id: string;
  name: string;
  description?: string;
  privacy?: string;
  pin_count?: number;
};

export type PinterestPin = {
  id: string;
  title?: string;
  description?: string;
  link?: string;
  board_id?: string;
};

export type PinterestUserAccount = {
  id?: string;
  username?: string;
  account_type?: string;
  profile_image?: string;
  website_url?: string;
};

export type CreatePinInput = {
  boardId: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  altText?: string;
};

type PinterestFetchOptions = RequestInit & {
  accessToken?: string;
};

export function getPinterestAccessToken(accessToken?: string) {
  return accessToken || getRequiredEnv("PINTEREST_ACCESS_TOKEN");
}

function getPinterestErrorMessage(data: unknown, status: number, path: string) {
  if (typeof data === "string" && data.length > 0) {
    return `Pinterest API request failed for ${path} with status ${status}: ${data}`;
  }

  if (data && typeof data === "object") {
    const payload = data as PinterestApiErrorPayload;
    const message = payload.message || payload.errors?.map((error) => error.message).filter(Boolean).join("; ");

    if (message) {
      return `Pinterest API request failed for ${path} with status ${status}: ${message}`;
    }
  }

  return `Pinterest API request failed for ${path} with status ${status}.`;
}

async function pinterestFetch<T>(path: string, { accessToken, ...init }: PinterestFetchOptions = {}) {
  const method = init.method || "GET";
  const response = await fetch(`${PINTEREST_API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${getPinterestAccessToken(accessToken)}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers
    }
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  console.info("[pinterest]", {
    method,
    path,
    status: response.status
  });

  if (!response.ok) {
    throw new Error(getPinterestErrorMessage(payload, response.status, path));
  }

  return payload as T;
}

export async function getUserAccount(accessToken?: string) {
  return pinterestFetch<PinterestUserAccount>("/user_account", {
    accessToken
  });
}

export async function getBoards(accessToken?: string) {
  const response = await pinterestFetch<PinterestApiListResponse<PinterestBoard>>("/boards?page_size=25", {
    accessToken
  });
  return response.items || [];
}

export async function createPin(
  { boardId, title, description, link, imageUrl, altText }: CreatePinInput,
  accessToken?: string
) {
  return pinterestFetch<PinterestPin>("/pins", {
    accessToken,
    method: "POST",
    body: JSON.stringify({
      board_id: boardId,
      title,
      description,
      link,
      alt_text: altText,
      media_source: {
        source_type: "image_url",
        url: imageUrl
      }
    })
  });
}

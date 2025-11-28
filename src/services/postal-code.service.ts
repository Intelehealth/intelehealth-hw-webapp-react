import type {
  PostalCodeApiResponse,
  PostalCodeData,
} from '../types/postal-code.type';

/**
 * Fetches postal code data from the API
 * @param pincode - 6-digit Indian postal code
 * @returns Promise with postal code data (state, district, city) or null if not found
 */
export async function fetchPostalCodeData(
  pincode: string
): Promise<PostalCodeData | null> {
  // Validate postal code format
  const trimmedPincode = pincode.trim();
  if (trimmedPincode.length !== 6 || !/^\d{6}$/.test(trimmedPincode)) {
    return null;
  }

  try {
    const response = await fetch(
      `http://www.postalpincode.in/api/pincode/${trimmedPincode}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: PostalCodeApiResponse = await response.json();

    // The API returns an array with one response object
    if (
      !apiResponse ||
      !apiResponse.PostOffice ||
      apiResponse.PostOffice.length === 0
    ) {
      return null;
    }

    // Use the first post office entry (typically the main one)
    const postOffice = apiResponse.PostOffice[0];

    return {
      state: postOffice.State || '',
      district: postOffice.District || '',
      city: postOffice.Block || '',
    };
  } catch (error) {
    console.error('Error fetching postal code data:', error);
    throw error;
  }
}

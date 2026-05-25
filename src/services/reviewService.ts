import axios from 'axios';
import { getAuthToken } from '../state/authToken';

const API_URL = 'http://localhost:8080/api/v1/reviews';

export interface ReviewRequest {
  productId: number;
  rating: number;
  comment: string;
}

export const reviewService = {
  getReviews: async (productId: number) => {
    try {
      const response = await axios.get(`${API_URL}?productId=${productId}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || error.response.data);
      }
      throw error;
    }
  },
  submitReview: async (reviewData: ReviewRequest) => {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await axios.post(API_URL, reviewData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || error.response.data);
      }
      throw error;
    }
  },
  getMyReviews: async () => {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');

    try {
      const response = await axios.get(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || error.response.data);
      }
      throw error;
    }
  }
};

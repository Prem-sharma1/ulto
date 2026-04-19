import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = 'http://localhost:5000/api/rides';

const initialState = {
  activeRide: null,
  rideHistory: [],
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Request a Ride
export const requestRide = createAsyncThunk(
  'ride/request',
  async (rideData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await fetch(`${API_URL}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rideData),
      });

      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Failed to request ride');
      }
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// Fetch History
export const fetchRideHistory = createAsyncThunk(
  'ride/history',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const response = await fetch(`${API_URL}/history`, {
        method: 'GET',
        headers: {
           Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        return thunkAPI.rejectWithValue(data.message || 'Failed to fetch history');
      }
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const rideSlice = createSlice({
  name: 'ride',
  initialState,
  reducers: {
    resetRideState: (state) => {
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = '';
    },
    setActiveRide: (state, action) => {
      state.activeRide = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestRide.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(requestRide.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.activeRide = action.payload;
      })
      .addCase(requestRide.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(fetchRideHistory.fulfilled, (state, action) => {
        state.rideHistory = action.payload;
      });
  },
});

export const { resetRideState, setActiveRide } = rideSlice.actions;
export default rideSlice.reducer;

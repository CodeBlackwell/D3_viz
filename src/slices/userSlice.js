// src/slices/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
    name: 'user',
    initialState: null, // Initial state for the user
    reducers: {
        setUser: (state, action) => action.payload, // Set the user
        logout: () => null, // Log out the user
    },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;

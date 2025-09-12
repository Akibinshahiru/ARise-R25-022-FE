import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Role = "tutor" | "student";

export type User = {
  uid: string;
  email: string;
  role: Role;
  idToken: string;
} | null;

type State = { user: User };

const slice = createSlice({
  name: "auth",
  initialState: { user: null } as State,
  reducers: {
    // Save user object returned from API
    setUser: (
      state,
      action: PayloadAction<{
        uid: string;
        email: string;
        role: Role;
        idToken: string;
      }>
    ) => {
      state.user = action.payload;
    },
    // Update just the role (rare, but useful)
    setRole: (state, action: PayloadAction<Role>) => {
      if (state.user) state.user = { ...state.user, role: action.payload };
    },
    // Clear user session
    logout: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, setRole, logout } = slice.actions;
export default slice.reducer;

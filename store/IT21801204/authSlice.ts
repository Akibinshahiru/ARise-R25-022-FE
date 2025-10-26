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
  // initialState: {
  //   user: {
  //     email: "student@gmail.com",
  //     idToken:
  //       "eyJhbGciOiJSUzI1NiIsImtpZCI6ImUzZWU3ZTAyOGUzODg1YTM0NWNlMDcwNTVmODQ2ODYyMjU1YTcwNDYiLCJ0eXAiOiJKV1QifQ.eyJ1aWQiOiJYWElrcUQwSmwxTXQ3VFpJTHQ0RDRialdDTEUyIiwicm9sZSI6InN0dWRlbnQiLCJlbWFpbCI6InN0dWRlbnRAZ21haWwuY29tIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL2FyaXNlLXJlc2VhcmNoLXNsaWl0IiwiYXVkIjoiYXJpc2UtcmVzZWFyY2gtc2xpaXQiLCJhdXRoX3RpbWUiOjE3NTc3MDg5NDEsInVzZXJfaWQiOiJYWElrcUQwSmwxTXQ3VFpJTHQ0RDRialdDTEUyIiwic3ViIjoiWFhJa3FEMEpsMU10N1RaSUx0NEQ0YmpXQ0xFMiIsImlhdCI6MTc1NzcwODk0MSwiZXhwIjoxNzU3NzEyNTQxLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsic3R1ZGVudEBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJjdXN0b20ifX0.a3xLRQLRMHX-el74SeHB_8sTFF7VJEw--oJSqMIfFWIE3-GbfiHWjPzZmQKjEwo-GxhkdhXDjgcpqZv3LNPOhJWjsXCPKn2CuPP4fRBrLidRp8x3WijVLd6nXMnLJgSX55YPnL24xuYCbIVMHTVy_jy-8E7cKPvP-vU8rteAElph9rhAtgHuelnAowadlWgY-h1IXEHxHekQghoSWiNpHuCEvVX_ifdiR1Ke72G_2S7hM5EzLqPGcyxRtGLNINvg0koUB4nx8Xp7eP0ttpqYv34z-d4GzLhEJNNYe141GYToI1jnciFbxxLqfs90-JN1Cn77h9ybusAIrKwAWrBlBw",
  //     message: "Login success",
  //     role: "student",
  //     uid: "XXIkqD0Jl1Mt7TZILt4D4bjWCLE2",
  //   },
  // } as State,
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

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./IT21801204/authSlice";
// later: import someOtherReducer from "./IT..../someOtherSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // skila: someOtherReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

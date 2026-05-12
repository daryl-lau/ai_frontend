import { createBrowserRouter, type RouteObject } from "react-router";
import App from "../App.tsx";
import ChatMessages from "@/components/Chat/ChatMessages.tsx";
import NotFoundView from "@/views/NotFoundView.tsx";
import LoginView from "@/views/LoginView.tsx";
import Upload from "@/components/Upload/Upload.tsx";
import LoginRoute from "@/components/LoginRoute.tsx";
import ProtectedRoute from "@/components/ProtectedRoute";
import ChatView from "@/views/ChatView/index.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <ChatView />,
      },
      {
        path: "login",
        element: (
          <LoginRoute>
            <LoginView />
          </LoginRoute>
        ),
      },
      {
        path: "upload",
        element: (
          <ProtectedRoute>
            <Upload />
          </ProtectedRoute>
        ),
      },
      {
        path: "chat",
        element: <ChatView />,
        children: [
          { index: true, element: <ChatMessages /> },
          { path: ":session_id", element: <ChatMessages /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundView />,
  },
] satisfies RouteObject[]);

export default router;

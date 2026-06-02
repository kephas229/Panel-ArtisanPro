import { createBrowserRouter } from "react-router";
import { Root } from "./components/layout/Root";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Users } from "./pages/Users";
import { ArtisanRequests } from "./pages/ArtisanRequests";
import { Reports } from "./pages/Reports";
import { Metiers } from "./pages/Metiers";
import { Villes } from "./pages/Villes";
import { Zones } from "./pages/Zones";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Root,
    children: [
      { index: true,              Component: Dashboard },
      { path: "users",            Component: Users },
      { path: "artisan-requests", Component: ArtisanRequests },
      { path: "reports",          Component: Reports },
      { path: "metiers",          Component: Metiers },
      { path: "villes",           Component: Villes },
      { path: "zones",            Component: Zones },
    ],
  },
]);
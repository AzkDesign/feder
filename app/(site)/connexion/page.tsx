import { redirect } from "next/navigation";

/* The client area now lives in « Le Salon ». */
export default function ConnexionRedirect() {
  redirect("/espace/connexion");
}

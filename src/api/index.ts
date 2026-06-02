/**
 * index.ts
 * Point d'entrée unique du dossier api/.
 *
 * Usage :
 *   import { listUsers, getGlobalStats, login } from "../api";
 */

// Client de base (token, fetch wrapper)
export * from "./client";

// Auth
export * from "./auth";

// Users
export * from "./users";

// Artisan Requests
export * from "./artisanRequests";

// Stats / Dashboard
export * from "./stats";

// Reports / Signalements
export * from "./reports";

// Avis (lecture seule)
export * from "./avis";

// Référentiels (Métiers, Villes, Zones)
export * from "./referentiels";
